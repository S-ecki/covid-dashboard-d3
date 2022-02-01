<template>
  <div id="app">
    <b-container fluid>
      <b-row class="p-3 bg-dark">
        <Dropdown />
      </b-row>
      <b-row class="pt-4">
        <b-col md="7" class="pr-1">
          <Scatterplot />
        </b-col>
        <b-col md="5" class="pr-1">
          <StackedBarChart />
        </b-col>
      </b-row>
      <b-row>
        <b-col md="7" class="pt-4">
          <ChoroplethMap />
        </b-col>
        <b-col md="5" class="pr-1 pt-4">
          <BarChart />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import BarChart from "./components/BarChart.vue";
import ChoroplethMap from "./components/ChoroplethMap.vue";
import Dropdown from "./components/Dropdown.vue";
import Scatterplot from "./components/Scatterplot.vue";
import StackedBarChart from "./components/StackedBarChart.vue";

export default {
  name: "App",
  components: {
    BarChart,
    ChoroplethMap,
    Dropdown,
    Scatterplot,
    StackedBarChart,
  },
  mounted() {
    this.$store.dispatch("loadData");
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #000000;
  margin-top: 20px;
}
</style>
