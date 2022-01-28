import Vue from 'vue';
import Vuex from 'vuex';
import * as d3 from 'd3';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    selectedStates: [],
    // create god object instead with keys for those arrays
    casesPerMillion: [],
    icuPerMillion: [],
    colorMap: new Map(),
  },

  mutations: {
    changeSelectedStates(state, states) {
      state.selectedStates = states;
    },
    flipStateSelection(state, stateName) {
      state.selectedStates.includes(stateName) ?
        // remove element if in array
        state.selectedStates.splice(state.selectedStates.indexOf(stateName), 1) :
        // add element if not in array
        state.selectedStates.push(stateName);
    },
    clearStateSelection(state) {
      state.selectedStates = []
    },
    setColorMap(state, colorMap) {
      state.colorMap = colorMap;
    }
  },

  getters: {
    selectedStates: (state) => state.selectedStates,
    colorMap: (state) => state.colorMap,
    casesPerMillion: (state) => state.casesPerMillion,
    icuPerMillion: (state) => state.icuPerMillion,
  },

  actions: {
    loadData({ state }) {

      d3.csv('./owid-covid-latest.csv').then((data) => {
        const filteredData = data.filter(data => data.continent == 'Europe');

        // load cases per million into state
        for (let i = 0; i < filteredData.length; i++) {
          state.casesPerMillion.push({
            state: filteredData[i].location,
            value: +filteredData[i].total_cases_per_million
          })
        }

        // load icu data into state
        for (let i = 0; i < filteredData.length; i++) {
          state.icuPerMillion.push({
            state: filteredData[i].location,
            value: +filteredData[i].icu_patients_per_million
          })
        }

      })

    },
  }
})

export default store;
