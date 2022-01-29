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
    casesMax: (state) => d3.max(state.covidData, d => d.cases),
    icuMin: (state) => d3.min(state.covidData.filter(d => d.icu != 0), d => d.icu),
    icuMax: (state) => d3.max(state.covidData, d => d.icu),
    vaxMin: (state) => d3.min(state.covidData.filter(d => d.vax != 0), d => d.vax),
    vaxMax: (state) => d3.max(state.covidData, d => d.vax),
    deathsMin: (state) => d3.min(state.covidData.filter(d => d.deaths != 0), d => d.deaths),
    deathsMax: (state) => d3.max(state.covidData, d => d.deaths),
  },

  actions: {
    loadData({ state }) {

      d3.csv('./owid-covid-latest.csv').then((data) => {
        const europeData = data.filter(data => data.continent == 'Europe');

        const filteredData = europeData.map(state => ({
          state: state.location,
          cases: +state.new_cases_per_million,
          icu: +state.icu_patients_per_million,
          poverty: +state.extreme_poverty,
          diabetes: +state.diabetes_prevalence,
          cardiovascular: +state.cardiovasc_death_rate,
          smokers: +state.male_smokers + +state.female_smokers,
          development_index: +state.human_development_index,
          vax: +state.people_vaccinated_per_hundred,
          deaths: +state.total_deaths_per_million,
        }));

        const maxPoverty = d3.max(filteredData, d => d.poverty);
        const maxDiabetes = d3.max(filteredData, d => d.diabetes);
        const maxCardiovascular = d3.max(filteredData, d => d.cardiovascular);
        const maxSmokers = d3.max(filteredData, d => d.smokers);

        // normalize poverty, diabetes, and cardiovascular with max values
        state.covidData = filteredData.map(d => ({
          state: d.state,
          cases: d.cases,
          icu: d.icu,
          icuIncomplete: d.icu == 0,
          poverty: d.poverty = d.poverty / maxPoverty,
          diabetes: d.diabetes = d.diabetes / maxDiabetes,
          cardiovascular: d.cardiovascular = d.cardiovascular / maxCardiovascular,
          smokers: d.smokers = d.smokers / maxSmokers,
          development_index_inverse: 1 - d.development_index,
          vax: d.vax,
          deaths: d.deaths,
        }));


      });
    },
  }
})

export default store;
