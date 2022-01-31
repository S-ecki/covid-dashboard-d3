<template>
  <div class="dropdown">
    <select class="form-control" v-model="selectedState">
      <option value="">Choose a Country</option>
      <option v-for="country in countries" :key="country.state">
        {{ country.state }}
      </option>
    </select>
    <!-- <div>Selected country: {{ selectedState }}</div> -->
  </div>
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
  methods: {
    // changeCountrySelection(event) {
    //   const selection = event.target.value;
    //   this.$store.commit("changeSelectedState", selection);
    // },
  },
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
</style>
