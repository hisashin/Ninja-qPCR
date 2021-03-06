"use strict";

// Basic configuration
const OPTICS_CHANNELS_COUNT = 2;
const WELLS_COUNT = 16;

const i2c = require('i2c-bus');
const raspi = require('raspi'); // For SoftPWM
const pwm = require('raspi-soft-pwm');
const rpio = require('rpio');
const PID = require("../control/heat_control/pid.js");
const HeatUnit = require("../control/heat_control/heat_unit.js");
const ExclusiveTaskQueue = require("../control/exclusive_task_queue.js");
// const demoPlate = require("../control/plate_multi_demo.js"); // Use it if you are runnint qPCR cycle without real haat unit.
const Plate = require("../control/plate_multi.js");
const HeatLidMulti = require("../control/heat_lid_multi.js");
const PlateBlock = require("../control/plate_block.js");
const Thermistor = require("../hardware/thermistor.js");

// Hardware lilbraries
const ADS122C04IPWR = require("../hardware/adc_ads122c04ipwr.js");
const ADCManager = require("../hardware/adc_manager.js");
const ADG731BSUZ = require("../hardware/mux_adg731bsuz.js");
const MUX16ch = require("../hardware/mux_16ch.js");
const MUX8ch = require("../hardware/mux_16ch.js");
const MCP4551T = require("../hardware/pot_mcp4551t.js");
const PCA9955B = require("../hardware/led_driver_pca9955b.js");

const DEBUG_COEFF = 1;
const EXCITATION_DURATION_MSEC = 25 * DEBUG_COEFF;
const MEASUREMENT_ALL_MIN_INTERVAL_MSEC = 4000 * DEBUG_COEFF;
const I2C_ADDR_PCA9955B = 0x05;

// Pins
const I2C_CHANNEL = 1; // SDA1 & SCL1

const ADC_DATA_RATE = 90;
const ADC_DEVICE_ADDR = 0x40;
const POT_DEVICE_ADDR = 0x2F;

const ADC_CHANNEL_FLUORESCENCE_MEASUREMENT = [3, 2]; // AIN3->P, AIN2->N
const ADC_CHANNEL_THERMISTORS = [1, 0]; // AIN0->P, AIN1->N

/* Thermistor config */
// http://localhost:8888/notebooks/PCR/Ninja_qPCR_thermistor_selection.ipynb
const RES_LOW_TEMP = 30.0; // kOhm
const RES_HIGH_TEMP = 10.0; // kOhm
const SWITCHING_TEMP = 66.0;
const R0 = 100.0;
const BASE_TEMP = 25.0;
const B_CONST = [
  { minTemp:0.0, bConst:4250, voltageLimit:0.0 }, // 4250 for 0-50 deg 
  { minTemp:50.0, bConst:4311, voltageLimit:0.0 }, // 4311 for 50-85 deg 
  { minTemp:85.0, bConst:4334, voltageLimit:0.0 } // 4334 for 85-100 deg 
];
const THERMISTOR_POSITION = false; /* Thermistor is connected to 0V line */

/* 
  PIN_NUM_* means pin number.
  PIN_NAME_* means pin's GPIO name
*/
const PIN_NUM_VIN_SENSE = 11; //GPIO0

const PIN_NUM_MUX_SELECT = 22; // GPIO6
const PIN_NUM_PD_MUX_1 = 16; //GPIO4 (Mux channel)
const PIN_NUM_PD_MUX_2 = 12; //GPIO1 (Mux channel)
const PIN_NUM_PD_MUX_3 = 10; //GPIO16 (Mux channel)
const PIN_NUM_PD_MUX_4 = 8; //GPIO15 (Mux channel)
const PIN_NUM_AMP_GAIN_SWITCH = 7;// GPIO7
const PIN_NUM_THERMISTOR_R = 26;// Pin 26, GPIO 11
const PIN_NAME_PWM_PLATE_HEATER = 23; // Pin 33, GPIO23
const PIN_NAME_PWM_LID_HEATER = 2; // Pin 13, GPIO2
const PIN_NAME_PWM_FAN = 21; // Pin 29, GPIO 21
const PIN_NUM_DOOR_OPEN = 35; // Pin 35, GPIO24
const PIN_NUM_DOOR_LOCK = 36; // Pin 36, GPIO 27
const PIN_NUM_ADC_DRDY = 24; // Pin 24, GPIO10

/* Pin COnfig */
const PLATE_KP = 1.0;
const PLATE_KI = 0.02;
const PLATE_KD = 0.02;

const HEATER_KP = 1.0;
const HEATER_KI = 1.0;
const HEATER_KD = 1.0;

const MUX_CHANNEL_THERMISTOR_PLATE_BLOCK = 0;
const MUX_CHANNEL_THERMISTOR_AIR = 0;
const MUX_CHANNEL_THERMISTOR_LID = 1;

// Channel name (Not index)
const MUX_MAP_PHOTODIODES_N = [
  //0ch
  [16,14,11,10,8,6,4,2],
  [15,13,12,9,7,5,3,1]
];
const MUX_MAP_PHOTODIODES_S = [
  [16,14,11,10,8,6,4,2],
  [15,13,12,9,7,5,3,1]
];

const muxQueue = new ExclusiveTaskQueue();

class HardwareConf {
  constructor () {
    this.ledUnit = null;
    this.i2c = i2c.openSync(I2C_CHANNEL);
    const adc = new ADS122C04IPWR(this.i2c, ADC_DEVICE_ADDR);
    this.adcManager = new ADCManager(adc, ADC_DATA_RATE);
    this.pwmPlate = new pwm.SoftPWM(PIN_NAME_PWM_PLATE_HEATER);
    this.pwmLid = new pwm.SoftPWM(PIN_NAME_PWM_LID_HEATER);
    this.pwmFan = new pwm.SoftPWM(PIN_NAME_PWM_FAN);
    this.thermistorMux = new MUX8ch(PIN_NUM_PD_MUX_1, PIN_NUM_PD_MUX_2, PIN_NUM_PD_MUX_3);
    const thermistorLowTemp = new Thermistor(B_CONST, R0, BASE_TEMP, THERMISTOR_POSITION , RES_LOW_TEMP);
    const thermistorHighTemp = new Thermistor(B_CONST, R0, BASE_TEMP, THERMISTOR_POSITION , RES_HIGH_TEMP);
    
    {
      // TODO switching?
      const plateBlockSensing = new TemperatureSensing(thermistorLowTemp, thermistorHighTemp, SWITCHING_TEMP,
        this.adcManager, ADC_CHANNEL_THERMISTORS,
        this.thermistorMux, MUX_CHANNEL_THERMISTOR_PLATE_BLOCK);
      const airSensing = new TemperatureSensing(thermistorLowTemp, thermistorHighTemp, SWITCHING_TEMP,
        this.adcManager, ADC_CHANNEL_THERMISTORS,
        this.thermistorMux, MUX_CHANNEL_THERMISTOR_AIR);
      const plateSensing = new PlateSensing(plateBlockSensing, airSensing);
      const plateOutput = new PlateOutput(this.pwmPlate, this.pwmFan);
      this.plate = new HeatUnit(new PID(PLATE_KP, PLATE_KI, PLATE_KD), plateSensing, plateOutput);
    }
    {
      const lidSensing = new TemperatureSensing(thermistorLowTemp, thermistorHighTemp, SWITCHING_TEMP, 
        this.adcManager, ADC_CHANNEL_THERMISTORS, 
        this.thermistorMux, MUX_CHANNEL_THERMISTOR_LID);
      const pid = new PID(HEATER_KP, HEATER_KI, HEATER_KD);
      pid.setOutputRange(0, 1.0);
      const output = new HeatLidOutput(this.pwmLid);
      this.lid = new HeatUnit(pid, lidSensing, output);
    }
  }
  start () {
    this.adcManager.start();
    this.thermistorMux.start();
  }
  shutdown () {
    this.i2c.close();
  }
  
  /* Hardware specifications */
  wellsCount () {
    return WELLS_COUNT;
  }
  opticsChannelsCount () {
    return OPTICS_CHANNELS_COUNT;
  }
  
  /* Getters of hardware units */
  getPlate () {
    return this.plate;
  }
  getHeatLid () {
    return this.lid;
  }
  getLEDUnit () {
    console.log("getLEDUnit()");
    if (this.ledUnit == null) {
      console.log("getLEDUnit() create...");
      const pot = new MCP4551T(this.i2c, POT_DEVICE_ADDR);
      const ledDriver = new PCA9955B(this.i2c, I2C_ADDR_PCA9955B);
      this.ledUnit = new LEDUnit(pot, ledDriver);
    }
    return this.ledUnit;
  }
  getFluorescenceSensingUnit() {
    // Generic 16ch MUX
    const muxWrapper = new GenericGPIOMuxWrapper();
    return new FluorescenceSensingUnit(muxWrapper, this.adcManager, ADC_CHANNEL_FLUORESCENCE_MEASUREMENT);
  }
};
class PlateSensing {
  constructor (plateBlockSensing, airSensing) {
    this.plateBlockSensing = plateBlockSensing;
    this.airSensing = airSensing;
  }
  start () {
    this.plateBlockSensing.start();
    this.airSensing.start();
  }
  getTemperature (callback) {
    this.plateBlockSensing.measureTemperature((plateTemperature)=>{
      this.airSensing.measureTemperature((airTemperature)=>{
        // TODO sample temp simulation
        const temperature = plateTemperature;
        callback(temperature);
      });
    });
  }
}
const THERMISTOR_MUX_WAIT_MSEC = 4;

class TemperatureSensing {
  constructor (thermistorLowTemp, thermistorHighTemp, switchingTemp, adcManager, adcChannel, mux, muxChannel) {
    this.thermistorLowTemp = thermistorLowTemp;
    this.thermistorHighTemp = thermistorHighTemp;
    this.switchingTemp = switchingTemp;
    this.adcManager = adcManager;
    this.adcChannel = adcChannel;
    this.mux = mux;
    this.muxChannel = muxChannel;
    this.prevValue = BASE_TEMP;
    console.log("LidSensing.muxChannel",this.muxChannel);
  }
  start () {
    this.adcManager.start();
    rpio.open(PIN_NUM_THERMISTOR_R, rpio.OUTPUT, rpio.LOW);
  }
  measureTemperature(callback) {
    const muxTaskId = muxQueue.request(()=>{
      this.mux.selectChannel(this.muxChannel);
      let thermistor = null;
      let switchPinVal = 0;
      if (this.prevValue < switchingTemp) {
        thermistor = this.thermistorLowTemp;
      } else {
        thermistor = this.thermistorHighTemp;
        switchPinVal = 1;
      }
      rpio.write(PIN_NUM_THERMISTOR_R, switchPinVal);
      // Prev value
      // Switch
      setTimeout(()=>{
        this.adcManager.readDiffChannelValue(this.adcChannel[0], this.adcChannel[1], (val)=>{
          const temp = thermistor.getTemp(val);
          this.prevValue = temp;
          console.log("ADC=%f TEMP=%f", val, temp);
          muxQueue.release(muxTaskId);
          callback(temp);
        });
      }, THERMISTOR_MUX_WAIT_MSEC);
    });
  }
  shutdown () {
  }
}
class PlateOutput {
  // Combination of heater (PWM) and fan (PWM)
  constructor (platePWM, fanPWM) {
    this.platePWM = platePWM;
    this.fanPWM = fanPWM;
    console.log("this.fanPWM = " + this.fanPWM);
    console.log("this.platePWM = " + this.platePWM);
  }
  start () {
  }
  setOutput (outputValue /* Range={-1,1.0} */) {
    outputValue = Math.min(1.0, Math.max(-1, outputValue));
    if (outputValue > 0) {
      this.platePWM.write(outputValue);
      this.fanPWM.write(0);
    } else {
      this.platePWM.write(0);
      this.fanPWM.write(-outputValue);
    }
  }
  off () {
    this.platePWM.write(0);
    this.fanPWM.write(0);
  }
  shutdown () {
    console.log("Shutting down HeatLidOutput.");
    this.off();
  }
}

/* 4bit GPIO MUX  + Switch */
class GenericGPIOMuxWrapper {
  constructor () {
    this.mux = new MUX16ch(PIN_NUM_PD_MUX_1, PIN_NUM_PD_MUX_2, PIN_NUM_PD_MUX_3, PIN_NUM_PD_MUX_4);
    this.muxSwitch = PIN_NUM_MUX_SELECT;
      
  }
  start () {
    rpio.open(this.muxSwitch, rpio.OUTPUT, rpio.LOW);
    this.mux.initialize();
  }
  select (wellIndex, channel) {
    const channelOffset = channel;
    let muxSwitchVal = 0;
    let muxChName = 1;
    if (wellIndex < 8) {
        // North
        muxSwitchVal = 0;
        muxChName = MUX_MAP_PHOTODIODES_N[channel][wellIndex];
    } else {
        // South
        muxSwitchVal = 1;
        muxChName = MUX_MAP_PHOTODIODES_S[channel][wellIndex-8];
    }
    const muxChannel = muxChName - 1;
    rpio.write(this.muxSwitch, muxSwitchVal);
    this.mux.selectChannel(muxChannel);
    // console.log("W %d O %d M %d S %d @%d", wellIndex, channel, muxChannel, muxSwitchVal, new Date().getTime()%10000);
  }
}
class MUXWrapperThermistor {
  constructor () {
    this.mux = new MUX16ch(PIN_NUM_PD_MUX_1, PIN_NUM_PD_MUX_2, PIN_NUM_PD_MUX_3, PIN_NUM_PD_MUX_4);
    this.muxSwitch = PIN_NUM_MUX_SELECT;
  }
  start () {
    this.mux.initialize();
    rpio.open(this.muxSwitch, rpio.OUTPUT, rpio.LOW);
  }
  selectChannel (channel) {
    this.mux.selectChannel(channel);
    rpio.write(this.muxSwitch, 0);
  }
}

let debug = 8;
// LED unit with given potentiometer & led driver (Not dependent on specific hardware implementation)
class LEDUnit {
  constructor (pot, ledDriver) {
    console.log("LEDUnit.init()")
    console.log(pot);
    console.log(ledDriver);
    this.pot = pot;
    this.ledDriver = ledDriver;
    this.flg = true;
  }
  start () {
    this.pot.initialize();
  }
  select (channel) {
    this.pot.setWiper(0);
    this.flg = !this.flg;
    this.ledDriver.selectChannel(channel);
  }
  off () {
    this.ledDriver.off();
    debug = (debug + 1) % 16;
    console.log("Debug value=%d", debug);
  }
  shutdown () {
    console.log("Shutting down LED unit.");
  }
}

const LARGE_GAIN_SIG = 0;
const SMALL_GAIN_SIG = 1;
const LARGE_GAIN_VALUE = 10.0; // MOhm
const SMALL_GAIN_VALUE = 1.0; // MOhm

const USE_GAIN_SWITCHING = false;
// Photodiode
class FluorescenceSensingUnit {
  constructor (mux, adcManager, adcChannel) {
    this.mux = mux;
    this.adcManager = adcManager;
    this.adcChannel = adcChannel;
    this.measuredValues = [];
    for (let i=0; i<2; i++) {
      this.measuredValues.push([]);
      for (let j=0; j<16; j++) {
        this.measuredValues[i].push({v:0.15,s:true});
      }
    }
    this.wellIndex = 0;
    this.opticalChannel = 0;
    this.isStrongSignal = false;
  }
  start () {
    rpio.open(PIN_NUM_AMP_GAIN_SWITCH, rpio.OUTPUT, LARGE_GAIN_SIG);
    this.adcManager.start();
    this.mux.start();
  }
  excitationDuration () { return EXCITATION_DURATION_MSEC; }
  measurementAllMinInterval () { return MEASUREMENT_ALL_MIN_INTERVAL_MSEC; }
  _select (wellIndex, opticalChannel) {
    this.mux.select(wellIndex, opticalChannel);
    // Switch gain according to previous measurement
    this.opticalChannel = opticalChannel;
    this.wellIndex = wellIndex;
    if (USE_GAIN_SWITCHING) {
        
      const prev = this.measuredValues[this.opticalChannel][this.wellIndex];
      this.isStrongSignal = prev.s;
      if (prev.s /* 1M */ && prev.v  < 0.008) {
        // Measured by strong-signal (small gain) mode but the actual measurement was too weak
        this.isStrongSignal = false;
      }
      if (!prev.s /* 10M */  && prev.v  > 0.4) {
        // Measured by weak-signal (large gain) mode but amplified signal is saturated.
        this.isStrongSignal = true;
      }
    } else {
      // this.isStrongSignal = false;
    }
    rpio.write(PIN_NUM_AMP_GAIN_SWITCH, (this.isStrongSignal)? SMALL_GAIN_SIG:LARGE_GAIN_SIG);
  }
  select (wellIndex, opticalChannel, callback) {
    this.muxTaskId = muxQueue.request(()=>{
      // Wait if MUX is in use
      this._select(wellIndex, opticalChannel);
      callback();
    });
  }
  release () {
    muxQueue.release(this.muxTaskId);
  }
  measure(callback) {
    this.adcManager.readDiffChannelValue(this.adcChannel[0], this.adcChannel[1], (_val)=>{
      const val = _val * 2;
      this.measuredValues[this.opticalChannel][this.wellIndex] = {v:val,s:this.isStrongSignal};
      callback({v:val,s:this.isStrongSignal?"1M":"10M"});
    });
  }
  shutdown () {
    console.log("Shutting down photosensing unit.");
  }
}

class HeatLidOutput {
  // Heater (with PWM)
  constructor (pwm) {
  // TODO active low / active high
    this.pwm = pwm;
  }
  start () {
  }
  setOutput (outputValue /* Range={0,1.0} */) {
    // console.log("Lid output", outputValue);
    outputValue = Math.min(1.0, Math.max(0, outputValue));
    //this.pwm.write(outputValue);
  }
  off () {
    //this.pwm.write(0);
  }
  shutdown () {
    console.log("Shutting down HeatLidOutput.");
    this.off();
  }
}

module.exports = new HardwareConf();