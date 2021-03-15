"use strict";
const PromiseQueue = require("./promise_queue.js");

/* Excitation and fluorescence measurement */
// const MEASUREMENT_INTERVAL_MSEC = 10000; // 10sec
const DEBUG_COEFF = 1;
const EXCITATION_DURATION_MSEC = 25 * DEBUG_COEFF;
const MEASUREMENT_MIN_INTERVAL_MSEC = 4000 * DEBUG_COEFF;
class Optics {
  constructor (ledUnit, fluorescenceSensingUnit, wellsCount, opticsChannelsCount) {
    // new Optics(hardwareConf.getLEDUnit(), hardwareConf.getFluorescenceSensingUnit(), hardwareConf.wellsCount(), hardwareConf.opticsChannelsCount());
    this.ledUnit = ledUnit;
    this.fluorescenceSensingUnit = fluorescenceSensingUnit;
    this.wellsCount = wellsCount;
    this.opticsChannelsCount = opticsChannelsCount;
    
    this.ROUND_POSITION = Math.pow(10, 5);
    
    this.fluorescence = [
      // Channel array?
    ];
    this.isMeasuring = false;
    this.oneShotCallbacks = [];
    this.continuousCallback = null;
    this.continuous = false;
    this.shouldResumeContinuous = false;
    this.devugValue = null;
    this.lastMeasurementTimestamp = new Date();
  }
  /* Promise queue tasks */
  
  taskSelectLED (wellIndex) {
    return ()=>{
      return new Promise((resolve, reject)=>{
        this.ledUnit.select(wellIndex);
        resolve();
      });
    };
  }
  taskSelectPhotodiode (wellIndex, opticalChannel) {
    return ()=>{
      return new Promise((resolve, reject)=>{
        this.fluorescenceSensingUnit.select(wellIndex, opticalChannel);
        resolve();
      });
    };
  }
  
  taskMeasure (wellIndex, opticalChannel, values) {
    return ()=>{
      return new Promise((resolve, reject)=>{
        this.fluorescenceSensingUnit.measure((v)=>{
          // console.log("%d-%d Fluo %f", wellIndex, opticalChannel, v);
          values[opticalChannel][wellIndex] = v;
          resolve();
        });
      });
    };
  }
  
  // Delay
  taskDelay (ms) {
    return ()=>{
      return new Promise ((resolve, reject)=>{
        // console.log("Start wait %d", ms);
        setTimeout(resolve, ms);
      });
    };
  }
  
  start () {
    this.startTimestamp = new Date();
    this.ledUnit.start();
    this.fluorescenceSensingUnit.start();
    // Set dummy timeout
    // well ID <=> Channel ID (MUX)
    this.wells = [];
    for (let i=0; i<this.wellsCount; i++) {
      this.wells.push({
        index:i,
        id:i,
        fluorescence:[]
      });
    }
  }
  pause () {
    this.shouldResumeContinuous = this.continuous;
    this.continuous = false;
  }
  resume () {
    this.continuous = this.shouldResumeContinuous;
    this.continuous = this.shouldResumeContinuous = false;
    if (this.continuous) {
      this.startContinuousDataCollection(this.continuousCallback);
    }
  }
  abort () {
    this.continuous = false;
    this.shouldResumeContinuous = false;
  }
  finish () {
    this.continuous = false;
    this.shouldResumeContinuous = false;
  }
  measureAll (callback) {
    this.oneShotCallbacks.push(callback);
    if (this.isMeasuring) {
      // measure all task is already running
      return;
    }
    this._measureAll();
  }
  _measureAll () {
    const lastMeasurementTimestamp = new Date();
    this.isMeasuring = true;
    
    let queue = [];
    let values = [];
    
    for (let opticsChannel=0; opticsChannel<this.opticsChannelsCount; opticsChannel++) {
      values.push([]);
      for (let wellIndex=0; wellIndex<this.wellsCount; wellIndex++) {
        values[opticsChannel].push(0);
      }
    }
    
    for (let wellIndex=0; wellIndex<this.wellsCount; wellIndex++) {
      queue.push(this.taskSelectLED(wellIndex));
      queue.push(this.taskDelay(5));
      for (let opticsChannel=0; opticsChannel<this.opticsChannelsCount; opticsChannel++) {
        queue.push(this.taskSelectPhotodiode(wellIndex, opticsChannel));
        queue.push(this.taskDelay(EXCITATION_DURATION_MSEC));
        queue.push(this.taskMeasure(wellIndex, opticsChannel, values));
      }
    }
    
    new PromiseQueue(queue).exec().then(()=>{
      this.ledUnit.off();
      if (this.oneShotCallbacks.length > 0) {
        this.oneShotCallbacks.forEach((callback)=>{
          callback(values);
        });
        this.oneShotCallbacks = [];
      }
      if (this.continuous && this.continuousCallback != null) {
        this.continuousCallback(values);
      }
      if (this.continuous) {
        // Next time
        const elapsed = new Date().getTime() - lastMeasurementTimestamp.getTime();
        const next = Math.max(0, MEASUREMENT_MIN_INTERVAL_MSEC - elapsed);
        setTimeout(()=>{ this._measureAll() }, next);
      }
      this.isMeasuring = false;
    },
    (e)=>{
      console.log(e)
    });
  }
  startContinuousDataCollection (callback) {
    console.log("startContinuousDataCollection");
    this.continuous = true;
    this.continuousCallback = callback;
    this._measureAll();
  }
  stopContinuousDataCollection () {
    console.log("stopContinuousDataCollection");
    this.continuous = false;
  }
  _roundFluorescence (value) {
    return Math.round(value * this.ROUND_POSITION) / this.ROUND_POSITION;
  }
  getStatus () {
    let data = [];
    this.wells.forEach((well)=>{
      let wellData = {
        id:well.id,
        fluorescence:[]
      };
      if (well.fluorescence.length > 0) {
        wellData.fluorescence.push(_roundFluorescence(well.fluorescence[well.fluorescence.length-1]));
      }
      data.push(wellData);
    });
    return data;
  }
  shutdown () {
    console.log("Optics.shutdown()");
    this.ledUnit.shutdown();
  }
}

module.exports = Optics;