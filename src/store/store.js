import Vue from 'vue';
import Vuex from 'vuex';
import * as d3 from 'd3';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    selectedState: "",
    covidData: [],
    colorMap: new Map(),
  },

  mutations: {
    changeSelectedState(state, country) {
      state.selectedState = country;
    },
    clearStateSelection(state) {
      state.selectedState = "";
    },
    setColorMap(state, colorMap) {
      state.colorMap = colorMap;
    },



  },

  getters: {
    selectedState: (state) => state.selectedState,
    colorMap: (state) => state.colorMap,
    covidData: (state) => state.covidData,
    covidDataByCountry: (state) => (country) => state.covidData.filter(d => d.state === country)[0],
    casesMin: (state) => d3.min(state.covidData.filter(d => d.cases != 0), d => d.cases),
    casesMax: (state) => d3.max(state.covidData.filter(d => d.icu != 0), d => d.cases),
    icuMin: (state) => d3.min(state.covidData, d => d.icu),
    icuMax: (state) => d3.max(state.covidData, d => d.icu),
  },

  actions: {
    loadData({ state }) {

      d3.csv('./owid-covid-latest.csv').then((data) => {
        const europeData = data.filter(data => data.continent == 'Europe');

        state.covidData = europeData.map(state => ({
          state: state.location,
          cases: +state.total_cases_per_million,
          icu: +state.icu_patients_per_million,
          poverty: +state.extreme_poverty,
          incomplete: state.total_cases_per_million == "" || state.icu_patients_per_million == "",
        }));
      });
    },
  }
})

export default store;
