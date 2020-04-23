"use strict";

const ThermalCycler = require("./control/thermal_cycler");
const Optics = require("./control/optics");

/* QPCR Interface */
class NinjaQPCR {
  constructor () {
    this.thermalCycler = new ThermalCycler();
    this.thermalCycler.setEventReceiver(this);
    this.optics = new Optics();
    this.optics.setEventReceiver(this);
  }
  setEventReceiver (receiver) {
    this.receiver = receiver;
    /*
      onThermalTransition(transition)
      onError(error)
      onExperimentFinish()
    */
  }
  start (protocol) {
    this.thermalCycler.start(protocol);
    this.optics.start();
  }
  getStatus () {
    const status = {
      thermalCycler: this.thermalCycler.getStatus(),
      fluorescence: this.optics.getStatus()
    };
    return status;
  }
  getThermalCyclerStatus () {
    return this.thermalCycler.getStatus();
  }
  getFluorescenceLogs () {
    return this.optics.getStatus();
  }
  onThermalTransition (data) {
    if (this.receiver != null && this.receiver.onThermalTransition != null) {
      this.receiver.onThermalTransition(data);
    }
  }
  onThermalDataUpdate (data) {
    if (this.receiver != null && this.receiver.onThermalDataUpdate) {
      this.receiver.onThermalDataUpdate(data);
    }
  }
  onFluorescenceDataUpdate (data) {
    if (this.receiver != null && this.receiver.onFluorescenceDataUpdate) {
      this.receiver.onFluorescenceDataUpdate(data);
    }
    
  }
  
}

module.exports = new NinjaQPCR();