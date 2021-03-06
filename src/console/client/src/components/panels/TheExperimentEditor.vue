<template>
  <div class="panel">
    <!-- Info section -->
    <section class="section" v-if="experiment">
      <header class="section__header">
        <div class="section__header__menu">
          <b-button v-show="isStarted"
            class="ml-1"
            @click.stop="deleteIt">
            Delete
          </b-button>
          <b-button v-show="isStarted"
            class="ml-1"
            @click.stop="updateInfo">
            Save
          </b-button>
        </div>
        <h2 class="section__header__title" >Summary</h2>
      </header>
      <div class="section__body">
        <div class="item item--detail-card">
          <div class="item--detail-card__body">
            <div class="item--detail-card__body__content">
              <dl class="labeled_list">
                <dt class="labeled_list__label">Name</dt>
                <dd class="labeled_list__content"><input
                  v-model="experiment.info.name" type="text" style="width:80%"
                ></dd>
                <dt class="labeled_list__label">Comment</dt>
                <dd class="labeled_list__content"><textarea
                  v-model="experiment.info.comment" type="text" style="width:80%" rows="4"
                ></textarea></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Protocol Section -->
    <section class="section">
      <header class="section__header">
        <div class="section__header__menu">
          <b-button v-show="!pickingProtocol && !isStarted"
            class="ml-1"
            @click.stop="pickProtocol">
            Select protocol
          </b-button>
          
          <b-button v-show="pickingProtocol"
            class="ml-1"
            @click.stop="cancelPickProtocol">
            Cancel
          </b-button>
        </div>
        <h2 class="section__header__title" >Protocol</h2>
      </header>
      <div class="section__body" v-show="!pickingProtocol">
        <div class="item item--detail-card">
          <div class="item--detail-card__body">
            <ProtocolDetail ref="protocolDetail" />
          </div>
        </div>
      </div>
      <!-- Protocol Picker -->
      <ProtocolPicker v-show="pickingProtocol" ref="protocolPicker" :limit="2" :pagination="true" @select="onPickProtocol" />
    </section>
    
    <!-- Config Section  -->
    <section class="section">
      <header class="section__header">
        <div class="section__header__menu">
          <b-button v-show="isStarted"
            class="ml-1"
            @click.stop="updateConfig">
            Save
          </b-button>
        </div>
        <h2 class="section__header__title" >Plate Layout</h2>
      </header>
      <ExperimentConfig ref="experimentConfig" />
    </section>
    
    <!-- Raw Log -->
    <section class="section" v-show="isStarted">
      <header class="section__header">
        <h2 class="section__header__title" >Log and Analysis</h2>
      </header>
      <div class="section__body ">
        <div class="row">
          <div class="col-12">
            <!-- Raw log tabs -->
            <div class="item item--tabbed">
              <b-tabs pills nav-wrapper-class="item--tabbed__tabs">
                <b-tab @click="onSelectTabAmp()"
                  title="Amplification"
                  active>
                  <div class="item--tabbed__content">
                    <div class="item--tabbed__content__main" id="tabAmpMain">
                      <AmplificationChart ref="amplificationChart" />
                      <div>
                        TODO Baseline conf / manual
                      </div>
                      <div>
                        TODO Threshold conf / manual
                      </div>
                      Export <button  class="btn btn-link" @click.stop="exportExperiment('qpcr')" >JSON</button> / 
                      <button  class="btn btn-link" @click.stop="exportExperiment('qpcr','csv')" >CSV</button>
                    </div>
                    <div class="item--tabbed__content__side" id="tabAmpSide">
                      <table class="pcr_table" v-if="experiment && experiment.analysis && experiment.analysis.is_valid" id="analysisTable">
                        <tr>
                          <th>Well</th>
                          <th>A</th>
                          <template v-for="channel of experiment.hardware.channels.count">
                            <th :key="`b-${channel}`" v-show="selectedTab==TAB_AMP">Baseline {{ channel }}</th>
                            <th :key="`t-${channel}`" v-show="selectedTab==TAB_AMP">Threshold {{ channel }}</th>
                            <th :key="`c-${channel}`" v-show="selectedTab==TAB_STD_CURVE || selectedTab==TAB_AMP">Ct {{ channel }}</th>
                            <th :key="`q-${channel}`" v-show="selectedTab==TAB_STD_CURVE">Qty {{ channel }}</th>
                            <th :key="`tm1-${channel}`" v-show="selectedTab==TAB_MELT">Tm1 {{ channel }}</th>
                            <th :key="`tm2-${channel}`" v-show="selectedTab==TAB_MELT">Tm2 {{ channel }}</th>
                          </template>
                        </tr>
                        <tr v-for="(wellLabel, wellIndex) of experiment.hardware.wells.names" :key="wellIndex">
                          <td>{{ wellLabel }}</td>
                          <td :key="`a-${wellIndex}`" v-bind:style="{backgroundColor:well_appearance[wellIndex].c}" @click="openColorPicker(wellIndex)">
                            &nbsp;
                          </td>
                          <template v-for="channel of experiment.hardware.channels.count">
                            <td :key="`b-${channel}-${wellIndex}`" v-show="selectedTab==TAB_AMP">{{ round(experiment.analysis.baseline[channel-1][wellIndex], 1) }}</td>
                            <td :key="`t-${channel}-${wellIndex}`" v-show="selectedTab==TAB_AMP">{{ round(experiment.analysis.threshold[channel-1][wellIndex], 1) }}</td>
                            <td :key="`c-${channel}-${wellIndex}`" v-show="selectedTab==TAB_STD_CURVE || selectedTab==TAB_AMP">{{ round(experiment.analysis.ct[channel-1][wellIndex], 1) }}</td>
                            <td :key="`q-${channel}-${wellIndex}`" v-show="selectedTab==TAB_STD_CURVE">{{ round(experiment.analysis.quantity[channel-1][wellIndex], 1) }}</td>
                            <td :key="`tm1-${channel}-${wellIndex}`" v-show="selectedTab==TAB_MELT">-</td>
                            <td :key="`tm2-${channel}-${wellIndex}`" v-show="selectedTab==TAB_MELT">-</td>
                          </template>
                        </tr>
                      </table>
                      
                    </div>
                  </div>
                </b-tab>
                <b-tab title="Melt curve" @click="onSelectTabMelt()">
                  <div class="item--tabbed__content">
                    <div class="item--tabbed__content__main" ref="tabMeltMain">
                      <MeltCurveChart ref="meltCurveChart" />
                      Export <button  class="btn btn-link" @click.stop="exportExperiment('melt_curve')" >JSON</button> / 
                      <button  class="btn btn-link" @click.stop="exportExperiment('melt_curve','csv')" >CSV</button>
                    </div>
                    <div class="item--tabbed__content__side" id="tabMeltSide">
                      
                    </div>
                  </div>
                </b-tab>
                <b-tab title="Standard curve" @click="onSelectTabStdCurve()">
                  <div class="item--tabbed__content">
                    <div class="item--tabbed__content__main" ref="tabStdCurveMain">
                      <StandardCurveChart ref="standardCurveChart" />
                    </div>
                    <div class="item--tabbed__content__side" id="tabStdCurveSide">
                      
                    </div>
                  </div>
                </b-tab>
                <b-tab title="Temperature" @click="onSelectTabTemperature()">
                  <div class="item--tabbed__content">
                    <div class="item--tabbed__content__main" ref="tabTemperatureMain">
                      <TemperatureChart ref="temperatureChart" />
                      Export <button  class="btn btn-link" @click.stop="exportExperiment('temp')" >JSON</button> / 
                      <button  class="btn btn-link" @click.stop="exportExperiment('temp','csv')" >CSV</button>
                    </div>
                    <div class="item--tabbed__content__side" id="tabTemperatureSide">
                      
                    </div>
                  </div>
                </b-tab>
              </b-tabs>
            </div>
          </div>
          <ColorPicker ref="colorPicker" />
        </div>
      </div>
    </section>
    <!-- Analysis -->
    <section class="section" v-show="isStarted">
      <header class="section__header">
        <h2 class="section__header__title" >Analysis</h2>
      </header>
      <div class="section__body">
        <div class="item item--detail-card">
          <div class="item--detail-card__body">
            <div class="item--detail-card__body__content">
              Analysis Config
              <b-button
                class="mr-1"
                @click.stop="updateAnalysis">
                Update (Debug)
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Analysis section -->
    <div>
      <b-button
        v-if="!isStarted"
        class="mr-1"
        @click.stop="saveAndRun">
        Save and Run
      </b-button>
      <b-button
        v-if="!isStarted"
        class="mr-1"
        @click.stop="save">
        Save
      </b-button>
    </div>
  </div>
</template>
<script>
import appState from "../../lib/AppState.js";
import client from "../../lib/RestClient.js";
import Util from "../../lib/Util.js";

import ProtocolDetail from '../ProtocolDetail.vue';
import ProtocolPicker from '../widget/ProtocolPicker.vue';
import ExperimentConfig from '../ExperimentConfig.vue';
import TemperatureChart from '../ExperimentMonitor/TemperatureChart.vue';
import AmplificationChart from '../ExperimentMonitor/AmplificationChart.vue';
import MeltCurveChart from '../ExperimentMonitor/MeltCurveChart.vue';
import StandardCurveChart from '../StandardCurveChart.vue';
import ColorPicker from '../widget/ColorPicker.vue';

const TAB_AMP = 0;
const TAB_MELT= 1;
const TAB_STD_CURVE= 2;
const TAB_TEMPERATURE= 3;
export default {
  name: 'TheExperimentEditor',
  components: {
    ProtocolDetail,
    ProtocolPicker,
    ExperimentConfig,
    TemperatureChart,
    AmplificationChart,
    MeltCurveChart,
    StandardCurveChart,
    ColorPicker
  },
  props: {
    limit: { type:Number }
  },
  data() {
    return {
      experiment: null,
      pickingProtocol: false,
      isEditing: false,
      isNew: false,
      isStarted: false,
      channels: [0, 1],
      well_appearance:[],
      selectedTab:TAB_AMP,
      TAB_AMP: TAB_AMP,
      TAB_MELT: TAB_MELT,
      TAB_STD_CURVE: TAB_STD_CURVE,
      TAB_TEMPERATURE: TAB_TEMPERATURE,
      styleDemo: {backgroundColor:"pink"}
    }
  },
  created: function () {
  },
  mounted: function () {
  
  },
  methods: {
    saveAndRun () {
      this.isEditing = false;
      this.experiment.config = this.$refs.experimentConfig.config;
      if (this.isNew) {
        this.isNew = false;
        client.submitCreateExperiment(this.$data.experiment, (createdItem)=>{
          console.log("submitCreateExperiment success. id=%s", createdItem.id);
          appState.run(createdItem.id);
        });
      } else {
        client.submitUpdateExperiment(this.experiment.id, this.$data.experiment, 
        ()=>{
          console.log("Saved. run...");
          appState.run(this.experiment.id);
        },
        ()=>{});
      }
    },
    save () {
      this.experiment.config = this.$refs.experimentConfig.config;
      console.log(this.$data.experiment)
      if (this.isNew) {
        client.submitCreateExperiment(this.$data.experiment, (createdItem)=>{
          this.isNew = false;
          console.log("submitCreateExperiment success. id=%s", createdItem.id);
          this.experiment = createdItem;
        });
      } else {
        client.submitUpdateExperiment(this.experiment.id, this.$data.experiment, 
        ()=>{
          console.log("Saved.");
        },
        ()=>{});
      }
    },
    setProtocol (protocol) {
      this.protocol = protocol;
    },
    onAppear () {
    },
    getAppearanceConf () {
      let appearances = [];
      for (let ch=0; ch<this.experiment.hardware.channels.count; ch++) {
        appearances.push(this.well_appearance);
      }
      return appearances;
    },
    /* Panel transition */
    setExperiment (experiment) {
      this.experiment = experiment;
      this.isStarted = experiment.status.start > 0;
      this.$refs.protocolDetail.setProtocol(this.experiment.protocol);
      this.$refs.experimentConfig.setConfig(this.experiment.config);
      this.$refs.standardCurveChart.setExperiment(this.experiment);
      
      if (!this.$refs.temperatureChart) {
        console.warn("this.$refs.temperatureChart is null. why?")
      }
      this.well_appearance = [];
      if (experiment.hardware) {
        for (let w=0; w<experiment.hardware.wells.count; w++) {
          let obj = {
            v: true,
            c: Util.defaultPalette[w]
          };
          this.well_appearance.push(obj);
        }
      }
      console.log(this.$data.well_appearance);
      
      if (this.isStarted && experiment.log) {
        if (experiment.log.temp) {
          console.log("setExperiment 1.1");
          this.$refs.temperatureChart.set(
            experiment.log.temp.time, 
            experiment.log.temp.plate, 
            experiment.log.temp.lid);
        
        }
        if (experiment.log.fluorescence && experiment.log.fluorescence.qpcr) {
          this.$refs.amplificationChart.setHardwareConf(experiment.hardware);
            this.$refs.amplificationChart.setAppearanceConf(this.getAppearanceConf());
          this.$refs.amplificationChart.setData(experiment.log.fluorescence.qpcr);
          this.$refs.amplificationChart.setAnalysis(experiment.analysis);
        }
        if (experiment.log.fluorescence && experiment.log.fluorescence.melt_curve) {
          this.$refs.meltCurveChart.setHardwareConf(experiment.hardware);
          this.$refs.meltCurveChart.setAppearanceConf(this.getAppearanceConf());
          this.$refs.meltCurveChart.setData(experiment.log.fluorescence.melt_curve);
          this.$refs.meltCurveChart.setAnalysis(experiment.analysis);
        }
      }
      
      this.isNew = false;
    },
    startCreateExperiment (draft) {
      this.isNew = true;
      this.isStarted = false;
      this.experiment = draft;
      this.$refs.protocolDetail.setProtocol(this.experiment.protocol);
      this.$refs.experimentConfig.setConfig(this.experiment.config);
    },
    submitCreateExperiment () {
    
    },
    submitUpdateExperiment () {
    
    },
    confirmLeave (callback) {
      if (this.isEditing) {
        if (window.confirm("Are you sure you want to discard the changes?")) {
          callback();
        }
      } else {
        callback();
      }
    },
    pickProtocol () {
      this.pickingProtocol = true;
      this.$refs.protocolPicker.load();
      
    },
    onPickProtocol (id, protocol) {
      this.pickingProtocol = false;
      this.experiment.protocol = protocol;
      this.experiment.protocol_id = id;
      this.pickingProtocol = false;
      this.$refs.protocolDetail.setProtocol(this.experiment.protocol);
    },
    cancelPickProtocol () {
      this.pickingProtocol = false;
    },
    updateInfo: function () {
      console.log(this.$data.experiment.id)
      console.log(this.$data.experiment.info)
      client.submitUpdateExperimentProperty (this.$data.experiment.id, "info",
       this.$data.experiment.info, (resObj)=>{
        console.log(resObj)
       }, ()=>{});
    },
    updateConfig: function () {
      this.experiment.config = this.$refs.experimentConfig.config;
      client.submitUpdateExperimentProperty (this.$data.experiment.id, "config",
       this.$data.experiment.config, (resObj)=>{
        console.log(resObj);
       }, ()=>{});
    },
    updateAnalysis: function () {
      this.experiment.analysis_config.dummy = new Date().getTime();
      console.log(this.$data.experiment.id);
      console.log(this.$data.experiment.analysis_config);
      client.submitUpdateExperimentProperty (this.$data.experiment.id, "analysis_config",
        this.$data.experiment.analysis_config, (resObj)=>{
          this.experiment = resObj;
          this.$refs.amplificationChart.setAnalysis(this.$data.experiment.analysis);
          this.$refs.standardCurveChart.setExperiment(this.experiment);
        }, ()=>{});
    },
    deleteIt: function () {
      console.log(this.$data.experiment.id)
      client.submitDeleteExperiment(this.$data.experiment.id, ()=>{
        appState.toast(this, "Deleted", "The experiment was deleted.");
        appState.backPanel();
      });
    },
    round: function (val, digits) {
      if (val === null) return "";
      const d = Math.pow(10, digits);
      return Math.round(val * d) / d;
    },
    exportExperiment: function (property, extension) {
      const url = client.getExperimentExportURL(this.experiment.id, property, extension);
      window.open(url);
    },
    onSelectTabAmp: function () {
      console.log("onSelectTabAmp");
      document.getElementById("tabAmpSide").appendChild(document.getElementById("analysisTable"));
      this.selectedTab = TAB_AMP;
    },
    onSelectTabMelt: function () {
      console.log("onSelectTabMelt");
      document.getElementById("tabMeltSide").appendChild(document.getElementById("analysisTable"));
      this.selectedTab = TAB_MELT;
    },
    onSelectTabStdCurve: function () {
      console.log("onSelectTabStdCurve");
      document.getElementById("tabStdCurveSide").appendChild(document.getElementById("analysisTable"));
      this.selectedTab = TAB_STD_CURVE;
    },
    onSelectTabTemperature: function () {
      console.log("onSelectTabTemperature");
      document.getElementById("tabTemperatureSide").appendChild(document.getElementById("analysisTable"));
      this.selectedTab = TAB_TEMPERATURE;
    },
    openColorPicker: function (index) {
      const origColor = this.well_appearance[index].c;
      this.$refs.colorPicker.open(origColor, (pickedColor)=>{
        this.well_appearance[index].c = pickedColor;
        this.$refs.amplificationChart.setAppearanceConf(this.getAppearanceConf());
        this.$refs.meltCurveChart.setAppearanceConf(this.getAppearanceConf());
        this.$refs.amplificationChart.repaint();
        this.$refs.meltCurveChart.repaint();
      });
    }
  }
}
</script>
<style>
.item--tabbed__content {
  display:flex;
  flex-direction:row;
}
.item--tabbed__content__main {
  width:70%;
  flex-basis: 70%;

}
.item--tabbed__content__side {
    width:30%;
    flex-basis: 30%;
    overflow-x: scroll;
}
</style>