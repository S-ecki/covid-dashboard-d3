<template>
  <div class="vis-component" ref="vis">
    <svg class="main-svg" :width="svgWidth" :height="svgHeight">
      <g class="bg" ref="bg"></g>
      <g class="choropleth-map" ref="map"></g>
    </svg>
  </div>
</template>

<script>
import mapStatesEurope from "@/assets/europe-states-geo.json";
import * as d3 from "d3";

export default {
  name: "ChoroplethMap",
  props: {},
  data() {
    return {
      svgWidth: 500,
      svgHeight: 600,
      svgPadding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    };
  },

  mounted() {
    this.drawVis();
  },

  methods: {
    drawVis() {
      if (this.$refs.vis) this.svgWidth = this.$refs.vis.clientWidth;
      this.transformSVG();
      this.drawMap();
      this.addBackground();
    },

    transformSVG() {
      d3.select(this.$refs.map).attr(
        "transform",
        `translate(${this.svgPadding.left},${this.svgPadding.top})`
      );
    },

    drawMap() {
      const path = this.getGeopath();

      // const colorMap = this.$store.state.colorMap;

      d3.select(this.$refs.map)
        .selectAll("path")
        .data(mapStatesEurope.features)

        .join("path")
        .attr("d", path)
        .attr("stroke", "black")
        .attr("stroke-width", "0.5")
        .attr("fill", "white")
        .attr("fill", (d) => {
          // if (!this.selectedStates.length) {
          //   return colorMap.get(d.properties.name);
          // }
          return this.selectedStates.includes(d.properties.name)
            ? "red" //colorMap.get(d.properties.name)
            : "white";
        })
        .on("click", (_, d) => {
          this.$store.commit("flipStateSelection", d.properties.name);
        });
      // .on("mouseover", () => console.log("mouseover"))
      // .on("mouseout", () => console.log("mouseout"));
    },
    getGeopath() {
      return d3.geoPath().projection(this.getProjection());
    },
    getProjection() {
      return (
        d3 // this projection was chosen due to the recommendation during the tutorial
          .geoAlbers()
          // the next lines were copied from the following link to display Europe properly: https://observablehq.com/@toja/five-map-projections-for-europe#_albers
          .rotate([-20.0, 0.0])
          .center([0.0, 52.0])
          .parallels([35.0, 65.0])
          .translate([this.svgWidth / 2, this.svgHeight / 2])
          .scale([this.svgWidth * 0.75])
      );
    },

    addBackground() {
      // add transparent rect "behind" map with onClick handler unselecting everything
      d3.select(this.$refs.bg)
        .append("rect")
        .attr("width", this.svgWidth)
        .attr("height", this.svgHeight)
        .attr("style", `fill:transparent;`)
        .on("click", () => {
          console.log("unselecting all - should implement");
          // this.$store.commit("clearStateSelection");
        });
    },
  },
  computed: {
    selectedStates: {
      get() {
        return this.$store.getters.selectedStates;
      },
    },
  },
  watch: {
    selectedStates: {
      handler() {
        this.drawVis();
      },
      deep: true,
    },
  },
};
</script>

<style>
</style>
