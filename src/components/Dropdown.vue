<template>
  <b-container>
    <b-row class="p-2" align-h="center" align-v="center">
      <b-col cols="4" class="text-light pr-1 font-weight-bolder top">
        COVID-19 Dashboard - Europe
      </b-col>
      <b-col cols="3" class="text-light pr-2 font-weight-light date">
        viewing data for 1.2.2022
      </b-col>
      <b-col cols="3" class="text-light pr-1 font-weight-bolder top">
        Select a Focus Country
      </b-col>
      <b-col cols="2" class="dropdown">
        <select class="form-control" v-model="selectedState">
          <option value="">No Selection</option>
          <option v-for="country in countries" :key="country.state">
            {{ country.state }}
          </option>
        </select>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: "Dropdown",
  props: {},
  data() {
    return {
      countries: [],
    };
  },
  mounted() {},
  methods: {},
  computed: {
    selectedState: {
      get() {
        return this.$store.getters.selectedState;
      },
      set(value) {
        this.$store.commit("changeSelectedState", value);
      },
    },
    covidData: {
      get() {
        return this.$store.getters.covidData;
      },
    },
  },
  watch: {
    covidData: {
      handler() {
        this.countries = this.covidData;
      },
    },
  },
};
</script>

<style>
.top {
  font-size: 1.2em;
}
.date {
  font-size: 0.9em;
}
</style>
