<template>
  <div>
    <header class="header">
      <div class="header__content">
        <h1 class="header__title">Ninja qPCR</h1>
        <!-- Device monitor -->
        <div class="header__device">
          <TheDeviceSummary v-show="selectedPanel!=panels.EXPERIMENT_MONITOR"/>
        </div>
      </div>
    </header>
    <main class="main">
      <nav class="panel-nav">
        <BackButton v-show="backEnabled" />
      </nav>
      <!-- Panels -->
      <TheDashboard ref="panelDashboard" v-show="selectedPanel==panels.DASHBOARD" />
      <TheProtocolList ref="panelProtocolList" v-show="selectedPanel==panels.PROTOCOL_LIST" />
      <TheProtocolDetail ref="panelProtocolDetail" v-show="selectedPanel==panels.PROTOCOL_DETAIL" />
      <TheExperimentList ref="panelExperimentList" v-show="selectedPanel==panels.EXPERIMENT_LIST" />
      <TheProtocolEditor ref="panelProtocolEditor" v-show="selectedPanel==panels.PROTOCOL_EDITOR" />
      <TheExperimentEditor ref="panelExperimentEditor" v-show="selectedPanel==panels.EXPERIMENT_EDITOR" />
      <TheExperimentMonitor ref="panelExperimentMonitor" v-show="selectedPanel==panels.EXPERIMENT_MONITOR" />
      <PanelTemplate ref="panelTemplate" v-show="selectedPanel==panels.TEMPLATE" />
      <div>
      (Dev)
        <b-button class="mr-1"
          @click.stop="showTemplate">
          Panel Template
        </b-button>
        <b-button class="mr-1"
          @click.stop="home">
          Home
        </b-button>
        <b-button class="mr-1"
          @click.stop="ping">
          Ping
        </b-button>
      </div>
    </main>
    <footer class="footer">
    </footer>
  </div>
</template>
<script>

import TheDeviceSummary from './TheDeviceSummary.vue'

import TheDashboard from './panels/TheDashboard.vue'
import TheExperimentEditor from './panels/TheExperimentEditor.vue'
import TheExperimentMonitor from './panels/TheExperimentMonitor.vue'
import TheExperimentList from './panels/TheExperimentList.vue'
import TheProtocolDetail from './panels/TheProtocolDetail.vue'
import TheProtocolEditor from './panels/TheProtocolEditor.vue'
import TheProtocolList from './panels/TheProtocolList.vue'
import PanelTemplate from './panels/PanelTemplate.vue'

import BackButton from './BackButton.vue';

import device from "../lib/Device.js";
import appState from "../lib/AppState.js";

const DEVICE_STATUS_IDLE = 1;
const DEVICE_STATUS_RUNNING = 2;
const DEVICE_STATUS_FINISHED = 3;
const DEVICE_STATUS_AUTO_PAUSE = 4;

export default {
  name: 'TheMain',
  components: {
  TheDashboard,
    //TheExperimentDetail,
    TheExperimentList,
    TheProtocolDetail,
    TheProtocolList,
    TheExperimentMonitor,
    TheExperimentEditor,
    TheProtocolEditor,
    PanelTemplate,
    TheDeviceSummary,
    BackButton
  },
  data() {
    return {
      isIdle:true,
      status:DEVICE_STATUS_IDLE,
      panels:appState.PANELS,
      selectedPanel:appState.PANELS.DASHBOARD,
      backEnabled: false
    }
  },
  created: function () {
    appState.setPanelContainer(this);
    device.addTransitionHandler({
      onStart: (obj)=>{
        console.log("Experiment started.");
        this.status = DEVICE_STATUS_RUNNING;
      },
      onComplete: (obj)=>{
        console.log("Experiment is complete!");
        this.status = DEVICE_STATUS_FINISHED;
      },
      onAutoPause: (obj)=>{
        console.log("Experiment is paused automatically by protocol!");
        this.status = DEVICE_STATUS_AUTO_PAUSE;
      },
      onTransition:(obj)=>{
      }
    });
    appState.setNavigationHandler((panelStack)=>{
      this.backEnabled = (panelStack.length > 1);
    
    });
  },
  mounted: function () {
    appState.setViews(this.$refs);
  
  },
  methods: {
    presentPanel(panel) {
      this.selectedPanel = panel;
    },
    showTemplate () {
      appState.pushPanel(appState.PANELS.TEMPLATE);
      
    },
    home () {
      appState.home();
    },
    ping () {
      device.ping();
    }
  }
}
</script>