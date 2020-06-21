"use strict";
const STAGE_TYPE_HOLD = 1;
const STAGE_TYPE_PCR = 2;
const STAGE_TYPE_MELT_CURVE = 3;

const MEASUREMENT_CONTINUOUS = 1;
const MEASUREMENT_RAMP_END = 2;
const MEASUREMENT_HOLD_END = 3;

/* Initial extension */
const example_hold_stage = {
  type: STAGE_TYPE_HOLD,
  repeat: 1,
  steps: [
    { label:"initial", temp:94.0, duration:15.0, data_collection:[] }
  ]
};

/* PCR */
const example_pcr_stage = {
  type: STAGE_TYPE_PCR,
  repeat: 35,
  steps: [
    { label:"denature", temp:94.0, duration:15.0, data_collection:[MEASUREMENT_RAMP_END, MEASUREMENT_HOLD_END] },
    { label:"anneal", temp:55.0, duration:15.0, data_collection:[MEASUREMENT_RAMP_END, MEASUREMENT_HOLD_END] },
    { label:"extend", temp:72.0, duration:15.0, data_collection:[MEASUREMENT_RAMP_END, MEASUREMENT_HOLD_END] }
  ]
};

const example_melt_curve_stage = {
  type: STAGE_TYPE_MELT_CURVE,
  repeat: 1,
  steps: [
    { label:"denature", ramp_speed: 1.0, hold_duration:15, temp:95.0, data_collection:[] },
    { label:"cool", ramp_speed: 1.0, hold_duration:15, temp:95.0, data_collection:[] },
    { label:"melt", ramp_speed: 1.0, hold_duration:15, temp:95.0, data_collection:[{type:MEASUREMENT_CONTINUOUS} ] }
  ]
};

const protocol = {
  lidTemp: 110.0, // Celsius
  cycles: [
    example_hold_stage,
    example_pcr_stage,
    example_melt_curve_stage
  ]
};

module.exports = protocol;