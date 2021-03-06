"use strict";

// Basic configuration
const OPTICS_CHANNELS_COUNT = 2;
const WELLS_COUNT = 16;

const SPI = require('pi-spi');
const i2c = require('i2c-bus');
const raspi = require('raspi'); // For SoftPWM
const pwm = require('raspi-soft-pwm');
const rpio = require('rpio');
const PID = require("../control/heat_control/pid.js");
const HeatUnit = require("../control/heat_control/heat_unit.js");
const ExclusiveTaskQueue = require("../control/exclusive_task_queue.js");
const demoPlate = require("../control/plate_multi_demo.js"); // Use it if you are runnint qPCR cycle without real haat unit.
const Plate = require("../control/plate_multi.js");
const HeatLidMulti = require("../control/heat_lid_multi.js");
const PlateBlock = require("../control/plate_block.js");
const Thermistor = require("../hardware/thermistor.js");

// Hardware lilbraries
const ADS1219IPWR = require("../hardware/adc_ads1219ipwr.js");
const ADCManager = require("../hardware/adc_manager.js");
const ADG731BSUZ = require("../hardware/mux_adg731bsuz.js");
const MUX16ch = require("../hardware/mux_16ch.js");
const MCP4551T = require("../hardware/pot_mcp4551t.js");
const TLC59281DBQR = require("../hardware/led_driver_tlc59281dbqr.js");

const DEBUG_COEFF = 1;
const EXCITATION_DURATION_MSEC = 25 * DEBUG_COEFF;
const MEASUREMENT_ALL_MIN_INTERVAL_MSEC = 4000 * DEBUG_COEFF;

const PIN_NUM_PD_MUX_1 = 22; //GPIO6 (Mux select)
const PIN_NUM_PD_MUX_2 = 16; //GPIO4 (Mux channel)
const PIN_NUM_PD_MUX_3 = 12; //GPIO1 (Mux channel)
const PIN_NUM_PD_MUX_4 = 10; //GPIO16 (Mux channel)
const PIN_NUM_PD_MUX_5 = 8; //GPIO15 (Mux channel)
const PIN_MUX_SWITCH = PIN_NUM_PD_MUX_1;

const PIN_LATCH = 15;

// LED Driver
const muxQueue = new ExclusiveTaskQueue();

// Pins
const SPI_CHANNEL = "/dev/spidev0.0";
const I2C_CHANNEL = 1; // SDA1 & SCL1

const ADC_DATA_RATE = 90;
const ADC_DEVICE_ADDR = 0x40;
const POT_DEVICE_ADDR = 0x2F;

const ADC_CHANNEL_FLUORESCENCE_MEASUREMENT = 0;
const ADC_CHANNEL_THERMISTORS = 0;

const RES = 47.0; // kOhm
const R0 = 100.0;
const BASE_TEMP = 25.0;
const B_CONST = [
  { minTemp:0.0, bConst:4250, voltageLimit:0.0 }, // 4250 for 0-50 deg 
  { minTemp:50.0, bConst:4311, voltageLimit:0.0 }, // 4311 for 50-85 deg 
  { minTemp:85.0, bConst:4334, voltageLimit:0.0 } // 4334 for 85-100 deg 
];

const PLATE_THERMISTOR_POS = false; /* Thermistor is connected to 0V line */
const LID_THERMISTOR_POS = false; /* Thermistor is connected to 0V line */
const AIR_THERMISTOR_POS = false; /* Thermistor is connected to 0V line */

/* 
  PIN_NUM_* means pin number.
  PIN_NAME_* means pin's GPIO name
*/

const PIN_NAME_PWM_PLATE_HEATER1 = 23;
const PIN_NAME_PWM_PLATE_HEATER2 = 0;
const PIN_NAME_PWM_LID_HEATER1 = 2;
const PIN_NAME_PWM_LID_HEATER2 = 24;

const PIN_NAME_PWM_FAN1 = 21;
const PIN_NAME_PWM_FAN2 = 22;

const PIN_NUM_ADC_DRDY = 24;

const PIN_NUM_SPI_SWITCH = 18; //GPIO5
const VALUE_SPI_SWITCH_LED = rpio.LOW;
const VALUE_SPI_SWITCH_MUX = rpio.HIGH;

const PIN_NUM_LED_DRIVER_LATCH = 15;

const PIN_NUM_PD_SYNC = 22 //GPIO6

const PLATE_KP = 1.0;
const PLATE_KI = 0.02;
const PLATE_KD = 0.02;

const HEATER_KP = 1.0;
const HEATER_KI = 1.0;
const HEATER_KD = 1.0;

const MUX_CHANNEL_THERMISTOR_PLATE_BLOCK1 = 0;
const MUX_CHANNEL_THERMISTOR_PLATE_BLOCK2 = 0;
const MUX_CHANNEL_THERMISTOR_AIR = 0;
const MUX_CHANNEL_THERMISTOR_LID = 1;

class HardwareConf {
  constructor () {
    this.ledUnit = null;
    this.spi = SPI.initialize(SPI_CHANNEL);
    this.i2c = i2c.openSync(I2C_CHANNEL);
    const adc = new ADS1219IPWR(this.i2c, ADC_DEVICE_ADDR);
    this.adcManager = new ADCManager(adc, ADC_DATA_RATE);
    
    this.pwmPlate1 = new pwm.SoftPWM(PIN_NAME_PWM_PLATE_HEATER1);
    this.pwmPlate2 = new pwm.SoftPWM(PIN_NAME_PWM_PLATE_HEATER2);
    
    this.pwmLid1 = new pwm.SoftPWM(PIN_NAME_PWM_LID_HEATER1);
    this.pwmLid2 = new pwm.SoftPWM(PIN_NAME_PWM_LID_HEATER2);
    
    this.pwmFan1 = new pwm.SoftPWM(PIN_NAME_PWM_FAN1);
    this.pwmFan2 = new pwm.SoftPWM(PIN_NAME_PWM_FAN2);
    
    this.thermistorMux = new MUXWrapperThermistor();
    
    const blocks = [];
    // PLATE_THERMISTOR_POS TODO: switch mux
    {
      const sensing = new PlateSensing(new Thermistor(B_CONST, R0, BASE_TEMP, PLATE_THERMISTOR_POS , RES), 
        this.adcManager, 
        ADC_CHANNEL_THERMISTORS,
        this.thermistorMux, MUX_CHANNEL_THERMISTOR_PLATE_BLOCK1);
      const output = new PlateHeater(this.pwmPlate1);
      const block = new PlateBlock(this.createPID(), sensing, output);
      blocks.push(block);
    }
    {
      const sensing = new PlateSensing(new Thermistor(B_CONST, R0, BASE_TEMP, PLATE_THERMISTOR_POS , RES), 
        this.adcManager, 
        ADC_CHANNEL_THERMISTORS,
        this.thermistorMux, MUX_CHANNEL_THERMISTOR_PLATE_BLOCK2);
      const output = new PlateHeater(this.pwmPlate2);
      const block = new PlateBlock(this.createPID(), sensing, output);
      blocks.push(block);
    }
    
    const fan = new Fan([this.pwmFan1, this.pwmFan2]);
    const airThermistor = new Thermistor(B_CONST, R0, BASE_TEMP, AIR_THERMISTOR_POS , RES);
    const air = new AirSensing(airThermistor, this.adcManager, ADC_CHANNEL_THERMISTORS,
      this.thermistorMux, MUX_CHANNEL_THERMISTOR_AIR);
    this.plate = new Plate (blocks, fan, air);
  
    let lids = [];
    {
      const lidThermistor = new Thermistor(B_CONST, R0, BASE_TEMP, PLATE_THERMISTOR_POS , RES)
      const lidSensing = new LidSensing(lidThermistor, this.adcManager, ADC_CHANNEL_THERMISTORS, 
        this.thermistorMux, MUX_CHANNEL_THERMISTOR_LID);
      const pid = new PID(HEATER_KP, HEATER_KI, HEATER_KD);
      pid.setOutputRange(0, 1.0);
      const output = new HeatLidOutput(this.pwmLid1);
      lids.push(new HeatUnit(pid, lidSensing, output));
    }
    this.lid = new HeatLidMulti(lids);
  }
  shutdown () {
    // TODO
    // Shutdown all
    this.i2c.close();
  }
  createPID () {
    return new PID(PLATE_KP, PLATE_KI, PLATE_KD);
  }
  start () {
    this.adcManager.start();
    this.thermistorMux.start();
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
      const ledDriver = new TLC59281DBQR(this.spi, PIN_LATCH, 0, 1000 /* Hz (=1kHz) */);
      this.ledUnit = new LEDUnit(pot, ledDriver);
    }
    return this.ledUnit;
  }
  getFluorescenceSensingUnit() {
    // ADG731BSUZ (SPI)
    
    // Generic 16ch MUX
    const muxWrapper = new GenericGPIOMuxWrapper();
    // const muxWrapper = new SPIMuxWrapper(this.spi, PIN_NUM_PD_SYNC);
    return new FluorescenceSensingUnit(muxWrapper, this.adcManager, ADC_CHANNEL_FLUORESCENCE_MEASUREMENT);
  }
};
// Channel name (Not index)
const MUX_MAP_N = [
  //0ch
  [16,14,11,10,8,6,4,2],
  [15,13,12,9,7,5,3,1]
];
const MUX_MAP_S = [
  [16,14,11,10,8,6,4,2],
  [15,13,12,9,7,5,3,1]
];

class SPIMuxWrapper {
  constructor (spi, pinSync) {
    this.mux = new ADG731BSUZ(spi, pinSync);
  }
  start () {
    this.mux.initialize();
  }
  select (wellIndex, channel) {
    let muxCh = 0;
    if (wellIndex < 8) {
        // North (switch=high)
        muxCh = MUX_MAP_N[channel][wellIndex] - 1;
    } else {
        // North (switch=low)
        muxCh = 16 + MUX_MAP_S[channel][wellIndex-8] - 1;
    }
    rpio.write(PIN_NUM_SPI_SWITCH, VALUE_SPI_SWITCH_MUX);
    this.mux.selectChannel(muxCh);
  }
}
/* 4bit GPIO MUX  + Switch */
class GenericGPIOMuxWrapper {
  constructor () {
    this.mux = new MUX16ch(PIN_NUM_PD_MUX_2, PIN_NUM_PD_MUX_3, PIN_NUM_PD_MUX_4, PIN_NUM_PD_MUX_5);
    this.muxSwitch = PIN_MUX_SWITCH;
      
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
        muxChName = MUX_MAP_N[channel][wellIndex];
    } else {
        // South
        muxSwitchVal = 1;
        muxChName = MUX_MAP_S[channel][wellIndex-8];
    }
    const muxChannel = muxChName - 1;
    rpio.write(this.muxSwitch, muxSwitchVal);
    this.mux.selectChannel(muxChannel);
    // console.log("W %d O %d M %d S %d @%d", wellIndex, channel, muxChannel, muxSwitchVal, new Date().getTime()%10000);
  }
}
class MUXWrapperThermistor {
  constructor () {
    this.mux = new MUX16ch(PIN_NUM_PD_MUX_2, PIN_NUM_PD_MUX_3, PIN_NUM_PD_MUX_4, PIN_NUM_PD_MUX_5);
    this.muxSwitch = PIN_MUX_SWITCH;
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
    // this.ledDriver.start();
    rpio.open(PIN_NUM_SPI_SWITCH, rpio.OUTPUT, VALUE_SPI_SWITCH_LED);
    this.pot.initialize();
  }
  select (channel) {
    // channel = debug;
    //channel = (channel)%16;
    rpio.write(PIN_NUM_SPI_SWITCH, VALUE_SPI_SWITCH_LED);
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

const PIN_NUM_GAIN_SWITCH = 7;// GPIO7
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
    rpio.open(PIN_NUM_GAIN_SWITCH, rpio.OUTPUT, LARGE_GAIN_SIG);
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
    rpio.write(PIN_NUM_GAIN_SWITCH, (this.isStrongSignal)? SMALL_GAIN_SIG:LARGE_GAIN_SIG);
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
    this.adcManager.readDiffChannelValue(2, 3, (_val)=>{
      const val = _val * 2;
      this.measuredValues[this.opticalChannel][this.wellIndex] = {v:val,s:this.isStrongSignal};
      callback({v:val,s:this.isStrongSignal?"1M":"10M"});
    });
  }
  shutdown () {
    console.log("Shutting down photosensing unit.");
  }
}

// instance of HeatUnit (Replace it with real hardware implementation)
class HeatLid {
  constructor () {
    this.temperature = 25;
    this.targetTemperature = 25;
  }
  start () {
    // Initialize hardware. This function is called once at the first run.
  }
  setTargetTemperature (targetTemperature) {
    this.targetTemperature = targetTemperature;
  }
  control () {
    this.temperature = getDummyTemp(this.temperature, this.targetTemperature, TEMP_CONTROL_INTERVAL_MSEC);
  }
  off () {
    // Do nothing
  }
  shutdown () {
    console.log("Shutting down dummy heat lid.");
    this.off();
  }
}

const THERMISTOR_MUX_WAIT_MSEC = 4;

class LidSensing {
  constructor (thermistor, adcManager, adcChannel, mux, muxChannel) {
    this.thermistor = thermistor;
    this.adcManager = adcManager;
    this.adcChannel = adcChannel;
    this.mux = mux;
    this.muxChannel = muxChannel;
    console.log("LidSensing.muxChannel",this.muxChannel);
  }
  start () {
    this.adcManager.start();
  }
  measureTemperature(callback) {
    const muxTaskId = muxQueue.request(()=>{
      this.mux.selectChannel(this.muxChannel);
      setTimeout(()=>{
        this.adcManager.readChannelValue(this.adcChannel, (val)=>{
          const temp = this.thermistor.getTemp(val);
          console.log("Lid ADC=%f TEMP=%f", val, temp);
          muxQueue.release(muxTaskId);
          callback(temp);
        });
      }, THERMISTOR_MUX_WAIT_MSEC);

    });
  }
  shutdown () {
    
  }
}

class AirSensing {
  constructor (thermistor, adcManager, adcChannel, mux, muxChannel) {
    this.thermistor = thermistor;
    this.adcManager = adcManager;
    this.adcChannel = adcChannel;
    this.mux = mux;
    this.muxChannel = muxChannel;
    console.log("LidSensing.muxChannel",this.muxChannel);
  }
  measureTemperature(callback) {
    const muxTaskId = muxQueue.request(()=>{
      
      this.mux.selectChannel(this.muxChannel);
      setTimeout(()=>{
        this.adcManager.readChannelValue(this.adcChannel, (val)=>{
          const temp = this.thermistor.getTemp(val);
          muxQueue.release(muxTaskId);
          console.log("Air ADC=%f TEMP=%f", val, temp);
          callback(temp);
        });
      }, THERMISTOR_MUX_WAIT_MSEC);
    });
  }
  shutdown () {
    
  }
}

class PlateSensing {
  constructor (thermistor, adcManager, adcChannel, mux, muxChannel) {
    this.thermistor = thermistor;
    this.adcManager = adcManager;
    this.adcChannel = adcChannel;
    this.mux = mux;
    this.muxChannel = muxChannel;
    console.log("LidSensing.muxChannel",this.muxChannel);
  }

  readTemperature(callback) {
    const muxTaskId = muxQueue.request(()=>{
      this.mux.selectChannel(this.muxChannel);
      setTimeout(()=>{
        this.adcManager.readChannelValue(this.adcChannel, (val)=>{
          const temp = this.thermistor.getTemp(val);
          console.log("Plate ADC=%f TEMP=%f", val, temp);
          muxQueue.release(muxTaskId);
          callback(temp);
        });
      }, THERMISTOR_MUX_WAIT_MSEC);
    });
  }
  shutdown () {
    
  }
}
class HeatLidOutput {
  // Heater (with PWM)
  constructor (pwm) {
  // TODO active low / active high
    this.pwm = pwm;
  }
  start () {
    rpio.open(PIN_NUM_SPI_SWITCH, rpio.OUTPUT, rpio.LOW);
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

class Fan {
  constructor (pwms) {
    this.pwms = pwms;
  }
  setOutput (value) {
    // console.log("Fan output", value);
    value = Math.max(0.0, Math.min(1.0, value));
    try {
      for (let pwm of this.pwms) {
        pwm.write(value);
      }
    } catch (ex) {
      console.log("Value", value);
      console.log(ex);
    }
  }
  shutdown () {
    this.setOutput(0);
  }
}

class PlateHeater  {
  constructor (pwm) {
    this.pwm = pwm;
  }
  setOutput (value) {
    // console.log("PlateHeater output", value);
    value = Math.max(0.0, Math.min(1.0, value));
    this.pwm.write(value);
  }
  shutdown () {
    this.pwm.write(0);
  }
}

module.exports = new HardwareConf();