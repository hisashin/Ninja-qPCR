<template>
  <div class="panel">
    <ProgressMonitor ref="progressMonitor"/>
    <section class="section" v-if="experiment">
      <header class="section__header">
        <h2 class="section__header__title" >{{ experiment.info.name }}</h2>
        <div class="section__header__menu"></div>
      </header>
      <div class="section__body">
        <div v-if="autoPause">
          The expriment is automatically paused.
          <b-button
            class="ml-1"
            @click.stop="finishAutoPause">
            Continue
          </b-button>
        </div>
        <div class="item item--tabbed">
          <b-tabs pills content-class="item--tabbed__content" nav-wrapper-class="item--tabbed__tabs">
            <b-tab title="Temperature">
              <TemperatureChart ref="temperatureChart" />
            </b-tab>
            <b-tab
              title="Amplification"
              active>
                <p><AmplificationChart ref="amplificationChart" /></p>
                  <div>one-shot={{ oneShot }}</div>
                  <div>continuous={{ continuous }}</div>
            </b-tab>
            <b-tab title="Melt curve">
              <b-button
                class="ml-1"
                @click.stop="updateMeltCurve">
                Update (debug)
              </b-button>
              <MeltCurveChart ref="meltCurveChart" />
            </b-tab>
            <b-tab title="Protocol">
              <ProtocolDetail
                ref="protocolDetail" />
            </b-tab>
          </b-tabs>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import device from "../../lib/Device.js";
import appState from "../../lib/AppState.js";
import client from "../../lib/RestClient.js";

import ProtocolDetail from '../ProtocolDetail.vue';
import ProgressMonitor from '../ExperimentMonitor/ProgressMonitor.vue';
import TemperatureChart from '../ExperimentMonitor/TemperatureChart.vue';
import AmplificationChart from '../ExperimentMonitor/AmplificationChart.vue';
import MeltCurveChart from '../ExperimentMonitor/MeltCurveChart.vue';

let startTime = new Date();

export default {
  name: 'TheExperimentMonitor',
  components: {
    ProgressMonitor,
    ProtocolDetail,
    TemperatureChart,
    AmplificationChart,
    MeltCurveChart
  },
  props: {
  },
  data() {
    return {
      experiment: null,
      oneShot: false,
      continuous: false,
      autoPause: false
    };
  },
  created: function () {
  },
  methods: {
    updateMeltCurve:  function () {
    },
    onFluorescenceUpdate: function (data) {
      let timestamp = new Date().getTime() - startTime.getTime();
      this.$refs.amplificationChart.add(data);
    },
    onMeltCurveUpdate: function (data) {
      let timestamp = new Date().getTime() - startTime.getTime();
      this.$refs.meltCurveChart.add(timestamp, data);
    },
    onFluorescenceEvent (data) {
    // On/Off indicator
      switch (data.type) {
        case "start":
        this.continuous = true;
        break;
        case "stop": 
        this.continuous = false;
        break;
        case "measure": 
        this.oneShot = true;
        setTimeout(()=>{this.oneShot = false}, 1000);
        break;
        default:
        break;
      }
    },
    finishAutoPause () {
      device.finishAutoPause();
      this.autoPause = false;
    },
    onDisappear () {
    },
    onAppear () {
      client.fetchDeviceExperiment (
        (experiment)=>{
          this.experiment = experiment;
          this.$nextTick(()=>{
            this.$refs.protocolDetail.setProtocol(this.experiment.protocol);
            // Set past data
            this.$refs.temperatureChart.set(
              experiment.log.temp.time, 
              experiment.log.temp.plate, 
              experiment.log.temp.lid);
            try {
              this.$refs.amplificationChart.setHardwareConf(experiment.hardware);
              this.$refs.amplificationChart.setData(experiment.log.fluorescence.qpcr);
            
            } catch (ex) {
              console.log(ex);
            }
            
            // TODO init meltCurveChart
            
          try {
            this.$refs.progressMonitor.reset();
            this.$refs.progressMonitor.protocol = this.experiment.protocol;
            
          } catch (ex) {
            console.log(ex);
          }
            device.addTransitionHandler({
              onComplete: (obj)=>{
                startTime = new Date();
              },
              onAutoPause: (obj)=>{
                console.log("TheExperimentMonitor AutoPause event received.");
                this.autoPause = true;
              }
            });
            device.addProgressHandler({
              onProgress:(obj)=>{
                if (!(obj.state && (obj.state.state == 'preheat' && obj.state.state == 'complete'))) {
                  this.$refs.temperatureChart.add(obj.elapsed, obj.plate, obj.lid);
                
                }
              }
            });
            device.addFluorescenceUpdateHandler(this);
          
          });
        }, 
        ()=>{}
      );
    }
  }
}
</script>