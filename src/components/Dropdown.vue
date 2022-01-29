<template>
  <div class="dropdown">
    <select class="form-control" @change="changeCountrySelection($event)">
      <option value=""></option>
      <option
        v-for="country in countries"
        :value="country.state"
        :key="country.state"
      >
        {{ country.state }}
      </option>
    </select>
    <p>
      <span>Selected country: {{ selectedCountry }}</span>
    </p>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "Dropdown",
  props: {},
  data() {
    return {
      countries: [],
      selectedCountry: null,
    };
  },

  mounted() {
    // this.countries = this.covidData;
  },
  methods: {
    changeCountrySelection(event) {
      console.log(event);
      this.selectedCountry =
        event.target.options[event.target.options.selectedIndex].text;
      this.$store.commit("changeSelectedState", this.selectedCountry);
    },
  },
  computed: {
    ...mapGetters(["selectedState", "covidData"]),
  },
  watch: {
    selectedState(newVal) {
      this.selectedCountry = newVal;
    },
    covidData(newVal) {
      this.countries = newVal;
    },
  },
};
</script>

<style>
</style>
