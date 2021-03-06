<template>
  <div class="section__body">
    <div class="item item--detail-card">
      <div class="item--detail-card__body">
        <div class="item--detail-card__body__content">
          <h3>Layout</h3>
          <div>
            <table class="pcr_table pcr_tables--well_layout">
              <tr v-for="(row, row_index) in well_layout" v-bind:key="row_index">
                <td v-for="(well, well_index) in row" v-bind:key="well_index">
                  {{ well.name }}
                </td>
              </tr>
            </table>
          </div>
          <h3>Wells</h3>
          <div>
            <table class="pcr_table pcr_table--wells">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Factor</th>
                <th>Label</th>
              </tr>
              <tr v-for="(item, index) in config.wells" v-bind:key="index">
                <td>{{ item.id }}</td>
                <td>{{ item.name }}</td>
                <td>
                  <select v-model="item.type" @change="onChange()" v-if="!item.is_in_series">
                    <option value="">----</option>
                    <option value="standard">Standard</option>
                    <option value="unknown">Unknown sample</option>
                    <option value="positive_control">Positive control</option>
                    <option value="negative_control">Negative control</option>
                    <option value="empty">Empty</option>
                  </select>
                  <span v-if="item.is_in_series">{{ item.series_type }}</span>
                </td>
                <td>
                  <input v-if="!item.is_in_series"
                    v-model.number="item.quantity" v-on:input="onChange()"
                      type="number" step="0.01"/>
                  <span v-if="item.series_type=='standard'">{{ item.series_quantity }}</span>
                </td>
                <td>
                  <span v-if="item.is_in_series">{{ item.series_factor }}</span>
                </td>
                <td>
                  <input
                    v-model.number="item.label" v-on:input="onChange()"
                      type="text"/>
                </td>
              </tr>
            </table>
          </div>
          <h3>Dilution Series</h3>
          <div>
            <table v-if="seriesCount" class="pcr_table pcr_table--dilusion_series_list">
              <tr>
                <th>Label</th>
                <th>Type</th>
                <th>Starting Quantity</th>
                <th>Serial Factor</th>
                <th>Number of Wells</th>
                <th>Wells</th>
              </tr>
              <tr v-for="(series, series_index) in config.series_list" v-bind:key="series_index">
                <td>
                  <input
                    v-model.number="series.label" v-on:input="onChange()"
                      size="8"
                      type="text"/>
                </td>
                <td>
                  <select v-model="series.type" @change="onChange()">
                    <option value="">----</option>
                    <option value="standard">Standard</option>
                    <option value="unknown">Unknown sample</option>
                  </select>
                </td>
                <td>
                  <input
                    v-model.number="series.start_quantity" v-on:input="onChange()"
                      size="4"
                      type="text"/>
                </td>
                <td>
                  <input
                    v-model.number="series.factor" v-on:input="onChange()"
                      size="4"
                      type="text"/>
                </td>
                <td>
                  <input
                    v-model.number="series.count" v-on:input="onChange()"
                      size="4"
                      type="number" step="1"/>
                </td>
                <td>
                  <div v-if="series.wells.length > 0">
                    {{ series.wells }}
                    <b-button
                      @click.stop="clearWells(series_index)">
                      Clear
                    </b-button>
                  </div>
                  <div v-if="series.wells.length == 0">
                    Assign wells
                    <b-button
                      @click.stop="assignWellsAuto(series_index)">
                      Auto
                    </b-button>
                    <b-button
                      @click.stop="assignWellsManual(series_index)">
                      Manual
                    </b-button>
                  </div>
                  
                </td>
              </tr>
            </table>
            <b-button
              @click.stop="setSeries">
              Add
            </b-button>
            <WellPicker ref="wellPicker" @select="didSelectWell" @cancel="didCancelSelectWell"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import device from "../lib/Device.js";
import appState from "../lib/AppState.js";
import WellPicker from './WellPicker.vue'
const NULL_WELL = {
  
};
const ASSIGNED_TYPES = [
  "standard",
  "unknown",
  "positive_control",
  "negative_control"
];
export default {
  name: 'TheExperimentEditor',
  components: {
    WellPicker
  },
  props: {
  },
  data() {
    return {
      seriesCount: 0, //  For array hack. Don't remove it.
      config: {
        wells: {},
        series_list:[]
      },
      well_layout:[[]]
    }
  },
  created: function () {
  },
  methods: {
    updateLayout: function () {
      this.well_layout = layout.map((row)=>{
        return row.map((wellId)=>{
          let wellConf = this.findWellConfById(wellId);
          let name = device.config.wells.names[wellId];
          wellConf.name = name;
          return {
            id: wellId,
            name: name,
            conf: wellConf
          };
        });
      });
    },
    findWellConfById (id) {
      for (let well of this.config.wells) {
        if (well.id == id) {
          return well;
        }
      }
      return null;
    },
    createWellConfig (wellId) {
      return {
        id: wellId,
        label: "",
        type: ""
      }
    },
    makeConfigConsistent () {
      const layout = device.config.wells.layout;
      if (!this.config.series_list) {
        this.config.series_list = [];
      }
      for (let row of layout) {
        for (let wellId of row) {
          if (!this.findWellConfById(wellId)) {
            this.config.wells.push(this.createWellConfig(wellId));
          }
        }
      }
      // Remove all series-related info from individual wells
      this.config.wells.forEach((well)=>{
        well.is_in_series = false;
        delete(well.series_id);
        delete(well.series_type);
        delete(well.series_quantity);
        delete(well.series_factor);
      });
      for (let seriesIndex = 0; seriesIndex < this.config.series_list.length; seriesIndex++) {
        let series = this.config.series_list[seriesIndex];
        for (let wellIndex = 0; wellIndex < series.wells.length; wellIndex ++) {
          let wellId = series.wells[wellIndex];
          const well = this.config.wells[wellId];
          well.is_in_series = true;
          well.series_id = seriesIndex;
          well.series_type = series.type;
          if (series.factor > 0) {
            well.series_factor = Math.pow(series.factor, wellIndex);
            if (series.type == "standard" && series.start_quantity > 0) {
              well.series_quantity = well.series_factor * series.start_quantity;
            }
          }
        }
      }
    },
    setConfig (config) {
      this.config = config;
      try {
        this.makeConfigConsistent();
        this.updateLayout();
        this.touch();
      } catch (ex) {
        console.log(ex)
      }
    },
    createDefaultSeries () {
      return {
        label:"",
        type:"",
        start_quantity: 0,
        factor: 0,
        count: 1,
        wells:[]
      };
    },
    touch () {
      this.seriesCount ++;
    },
    setSeries () {
      this.config.series_list.push(this.createDefaultSeries());
      this.touch();
    },
    _getEmptyWells () {
      let emptyWells = [];
      for (let i=0; i<this.config.wells.length; i++) {
        const well = this.config.wells[i];
        if (ASSIGNED_TYPES.indexOf(well.type) < 0 && !well.is_in_series) {
          emptyWells.push(i);
        }
      }
      return emptyWells;
    },
    assignWellsAuto(seriesIndex) {
      const series = this.config.series_list[seriesIndex];
      let emptyWells = this._getEmptyWells();
      if (emptyWells.length < series.count) {
        alert("There are not enough empty wells.");
        return;
      }
      series.wells = emptyWells.slice(0, series.count);
      this.makeConfigConsistent();
      this.touch();
    },
    assignWellsManual(seriesIndex) {
      const series = this.config.series_list[seriesIndex];
      let emptyWells = this._getEmptyWells();
      if (emptyWells.length < series.count) {
        alert("There are not enough empty wells.");
        return;
      }
      this.targetSeriesIndex = seriesIndex;
      this.$refs.wellPicker.open(this.well_layout, emptyWells, series.count);
    },
    clearWells(seriesIndex) {
      this.config.series_list[seriesIndex].wells = [];
      this.makeConfigConsistent();
      this.touch();
    },
    onChange () {
    },
    didSelectWell (selected) {
      const targetSeries = this.config.series_list[this.targetSeriesIndex];
      if (!targetSeries) {
        console.warn("No series is selected.");
        return;
      }
      targetSeries.wells = selected;
      this.makeConfigConsistent();
      this.touch();
    },
    didCancelSelectWell (){
      alert("Cancel");
    }
  }
}
</script>
<style>

.pcr_table--well_layout {
  min-width:640px;
}
.pcr_table--wells {
  min-width:640px;
}
.pcr_table--dilusion_series_list {
  min-width:640px;
}
.pcr_table--well_picker {
  min-width:640px;
}
</style>