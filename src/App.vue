<template>
  <div id="app">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-6">
          <Dropdown />
        </div>
        <div class="col-md-6">
          <ChoroplethMap />
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <ChoroplethMap />
        </div>
        <div class="col-md-6">
          <ChoroplethMap />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import BarChart from "./components/BarChart.vue";
import ChoroplethMap from "./components/ChoroplethMap.vue";
import Dropdown from "./components/Dropdown.vue";

export default {
  name: "App",
  components: {
    // BarChart,
    ChoroplethMap,
    Dropdown,
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
  color: #2c3e50;
  margin-top: 20px;
}
</style>
