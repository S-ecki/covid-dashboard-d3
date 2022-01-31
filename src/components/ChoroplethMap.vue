<template>
  <div class="vis-component" ref="vis">
    <b-button size="lg" variant="primary" disabled class="mb-2">
      <b-icon icon="question-circle-fill" aria-label="Help"></b-icon>
    </b-button>
    <svg class="main-svg" :width="svgWidth" :height="svgHeight">
      <g class="bg" ref="bg"></g>
      <!-- Legend and JS code that goes along with it inspired by: https://observablehq.com/@d3/bivariate-choropleth -->
      <g
        class="legend"
        ref="legend"
        transform="translate(80,80) rotate(315)"
      ></g>
      <g class="choropleth-map" ref="map"></g>
      <!-- http://thenewcode.com/1068/Making-Arrows-in-SVG -->
      <!-- <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>
      <line
        x1="0"
        y1="50"
        x2="90"
        y2="50"
        stroke="#000"
        stroke-width="3"
        marker-end="url(#arrowhead)"
      /> -->
    </svg>
  </div>
</template>

<script>
import mapStatesEurope from "@/assets/europe-states-geo.json";
import * as d3 from "d3";
import { mapGetters } from "vuex";
import bivariate_colors from "../helpers/bivariate_colors.js";

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
    this.drawLegend();
    this.drawVis();
    this.initTooltip();
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

      d3.select(this.$refs.map)
        .selectAll("path")
        .data(mapStatesEurope.features)
        .attr("id", (d) => d.properties.name)
        .join("path")
        .attr("d", path)
        .attr("stroke", (d) => {
          if (this.covidData.length == 0) return "transparent";

          const county = this.covidData.filter(
            (c) => c.state === d.properties.name
          )[0];

          return county.icuIncomplete ? "white" : "white"; // maybe black
        })
        .attr("stroke-width", "0.3")
        .attr("fill", (d) => {
          if (this.selectedState == "") {
            return this.colorMap.get(d.properties.name);
          }
          if (this.selectedState == d.properties.name) {
            return this.colorMap.get(d.properties.name);
          } else {
            return "#d3d3d3";
          }
        })
        .on("click", (_, d) => {
          this.$store.commit("changeSelectedState", d.properties.name);
        })
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip);

      // todo fix this
      const incompleteStates = this.covidData
        .filter((d) => d.icuIncomplete)
        .map((d) => d.state);

      for (var state of incompleteStates) {
        d3.select(`#${state}`).remove();
      }
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
          this.$store.commit("clearStateSelection");
        });
    },

    initTooltip() {
      d3.select("#mapTooltip").remove();
      // the idea of how to use tooltips was inspired by this website, but heavily changed to my own needs
      // https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
      d3.select("body").append("div").attr("id", "mapTooltip").class("tooltip");
    },
    showTooltip(event, data) {
      const stateName = data.properties.name;
      const casesOfState = this.covidDataByCountry(stateName).cases.toFixed(0);
      const icuOfState = this.covidDataByCountry(stateName).icu.toFixed(1);

      const div = d3.select("#mapTooltip").style("opacity", 0);
      div.transition().duration(150).style("opacity", 0.95);

      div
        .html(
          `<b>${stateName}</b> <br>
        Infections / Million: ${casesOfState} <br>
        ICU beds / Million: ${icuOfState == 0 ? "No Data" : icuOfState}`
        )
        .style("left", `${event.pageX - 40}px`)
        .style("top", `${event.pageY + 40}px`)
        .style("display", "block");
    },
    hideTooltip() {
      const div = d3.select("#mapTooltip").style("opacity", 0.95);
      div.transition().duration(300).style("opacity", 0);
    },

    // https://observablehq.com/@d3/bivariate-choropleth
    drawLegend() {
      for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
          this.appendRect(i, j);
        }
      }

      const rectSize = 30;
      d3.select(this.$refs.legend)
        .append("text")
        .text("Infections")
        .attr("y", rectSize * 4 - 5)
        .attr("fill", "black");

      d3.select(this.$refs.legend)
        .append("text")
        .text("ICU Beds")
        .attr("transform", "rotate(90)")
        .attr("x", rectSize + 5)
        .attr("y", rectSize - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "black");

      d3.select(this.$refs.legend);
    },
    appendRect(xInd, yInd) {
      const rectSize = 30;
      const color = bivariate_colors[xInd][yInd];

      d3.select(this.$refs.legend)
        .append("rect")
        .attr("x", xInd * rectSize)
        .attr("y", yInd * rectSize)
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("style", `fill:${color};`);
    },

    // this fills up the Map in the store, which saves the colors
    // each state should be highlighted on the choropleth map when selected
    // gets called every time eduRate/ persIncome change
    fillColorMap() {
      let colorMap = new Map();

      for (let datapoint of this.covidData) {
        const color = datapoint.icuIncomplete
          ? "transparent"
          : this.getColorForDatapoint(datapoint.cases, datapoint.icu);
        colorMap.set(datapoint.state, color);
      }
      this.$store.commit("setColorMap", colorMap);
    },

    // returns hex code that the state should be highlighted with
    getColorForDatapoint(cases, icu) {
      const x = this.getXColorIndex(cases);
      const y = this.getYColorIndex(icu);
      return bivariate_colors[x][y];
    },

    // todo fix this
    // determines the x-"index" of the field the datapoint is on
    // the left column is be 0, middle 1 and right 2
    getXColorIndex(cases) {
      const scale = d3
        .scaleQuantile()
        .domain(this.covidData.map((d) => d.cases))
        .range(d3.range(3));

      return scale(cases);

      // const xColorIndex = Math.floor(scale(cases) * 3);
      // return xColorIndex == 3 ? xColorIndex - 1 : xColorIndex;
    },

    // determines the y-"index" of the field the datapoint is on
    // the left row is be 0, middle 1 and right 2
    getYColorIndex(icu) {
      const scale = d3
        .scaleQuantile()
        .domain(this.covidData.map((d) => d.icu))
        .range(d3.range(3));

      return 3 - scale(icu);

      // const yColorIndex = 2 - Math.floor(scale(icu) * 3);
      // return yColorIndex == -1 ? 0 : yColorIndex;
    },
  },
  computed: {
    ...mapGetters([
      "selectedState",
      "covidData",
      "covidDataByCountry",
      "casesMin",
      "casesMax",
      "icuMin",
      "icuMax",
      "colorMap",
    ]),
  },
  watch: {
    selectedState: {
      handler() {
        this.drawVis();
      },
      deep: true,
    },
    covidData: {
      handler() {
        this.fillColorMap();
        this.drawVis();
      },
      deep: true,
    },
  },
};
</script>

<style>
#mapTooltip {
  position: absolute;
  padding: 4px;
  text-align: center;
  width: 180px;
  height: 80px;
  background: lightgrey;
  border-radius: 5px;
  font-size: 14px;
  opacity: 0;
  display: none;
}
</style>
