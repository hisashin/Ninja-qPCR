"use strict";
const hardwareConf = require("./conf/batch3_hardware_conf.js");
const Optics = require("./control/optics.js");
const rpio = require('rpio');
const SINGLE_TARGET_WELL_INDEX = 8;
// Run optics demo with batch3 boards.
class OpticsDemo {
  constructor () {
    // const hardwareConf = require(boardConfFile);
    this.led = hardwareConf.getLEDUnit();
    this.photosensing = hardwareConf.getFluorescenceSensingUnit();
    this.wellsCount = hardwareConf.wellsCount();
    this.opticsStarted = false;
    this.ledStarted = false;
    this.photosensingStarted = false;
    rpio.open(32, rpio.INPUT); // To disable PWM pin for ADA2200's RCLK
  }
  runOpticsDemo () {
    // Combination of LED and Photosensing
    this.optics = new Optics(this.led, this.photosensing, this.wellsCount);
    this.optics.start();
    this.opticsStarted = true;
    let singleCh = 0;
    setInterval(()=>{
      this.optics.measureSingle(singleCh, (res)=>{
        console.log(res);
      });
      singleCh = (singleCh + 1) % 16;
    }, 500);
    
    /*
    setInterval(()=>{
      this.optics.measureAll((values)=>{
        console.log(values);
      });
    }, 2000);
    */
  }
  //  Event handlers
  runLEDDemo () {
    // Test only LEDs
    this.led.start();
    this.ledStarted = true;
    let ch = 0;
    setInterval(()=>{
      this.led.select(ch);
      ch = (ch + 1) % 16;
    }, 2000);
  }
  runPhotosensingDemo () {
    // Test photosensing
    this.photosensing.start();
    this.photosensingStarted = true;
    let ch = 0;
    setInterval(()=>{
      this.photosensing.measure(ch, (measurement)=>{
        console.log("ch%d=%f", ch, measurement);
        ch = (ch + 1) % 16;
      });
    }, 2000);
  }
  shutdown () {
    if (this.opticsStarted) {
      this.optics.shutdown();
    }
    if (this.ledStarted) {
      this.led.shutdown();
    }
    if (this.photosensingStarted) {
      this.photosensing.shutdown();
    }
  }
}
const demo = new OpticsDemo();
demo.runOpticsDemo();
// demo.runLEDDemo();
// demo.runPhotosensingDemo();

process.on('SIGINT', () => {
    console.log('Received SIGINT');
    demo.shutdown();
    process.exit(1);
});