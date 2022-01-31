<template>
  <div class="vis-component" ref="vis">
    <b-container>
      <b-row align-h="center" align-v="start">
        <div class="h5 pb-1 pr-2">
          ICU Patients and New Infections per Million
        </div>
      </b-row>
      <b-row align-h="center" align-v="start">
        <p class="font-weight-ligth pr-1 text-muted">Legend Explanation</p>
        <div
          v-b-tooltip.html
          title="The Map is encoded with a <b>bivariate color scheme</b>.<br>
        Increasing <b>Infections</b> are shown on the <b>X-Axis</b>.<br>
        Increasing <b>ICU Patients</b> are shown on the <b>Y-Axis</b>.<br>
        Missing datapoints are substituted with 0 - hover over the country to see details."
        >
          <b-icon icon="question-circle-fill" variant="secondary"></b-icon>
        </div>
      </b-row>
    </b-container>
    <svg class="main-svg" :width="svgWidth" :height="svgHeight">
      <g class="bg" ref="bg"></g>
      <!-- Legend and JS code that goes along with it inspired by: https://observablehq.com/@d3/bivariate-choropleth -->
      <g class="legend" ref="legend"></g>
      <g class="choropleth-map" ref="map"></g>
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
      cases: 0,
      icu: 0,
      rectSize: 30,
      svgWidth: 480,
      svgHeight: 500,
      svgPadding: {
        top: 20,
        right: 20,
        bottom: 0,
        left: 20,
      },
    };
  },

  mounted() {
    this.drawVis();
    this.initTooltip();
  },

  methods: {
    drawVis() {
      if (this.$refs.vis) this.svgWidth = this.$refs.vis.clientWidth;
      this.transformSVG();
      this.drawMap();
      this.addBackground();
      this.updateNumbers();
      this.drawLegend();
    },

    transformSVG() {
      d3.select(this.$refs.map).attr(
        "transform",
        `translate(${this.svgPadding.left},${this.svgPadding.top})`
      );
    },

    updateNumbers() {
      if (this.selectedState == "") {
        this.cases = -1;
        this.icu = -1;
      } else {
        this.cases = this.covidDataByCountry(this.selectedState).cases;
        this.icu = this.covidDataByCountry(this.selectedState).icu;
      }
    },

    drawMap() {
      const path = this.getGeopath();

      d3.select(this.$refs.map)
        .selectAll("path")
        .data(mapStatesEurope.features)
        .attr("id", (d) => d.properties.name)
        .join("path")
        .attr("d", path)
        .attr("stroke", "white")
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
        .on("mousemove", this.moveTooltip)
        .on("mouseout", this.hideTooltip);

      // todo fix this
      // const incompleteStates = this.covidData
      //   .filter((d) => d.icuIncomplete)
      //   .map((d) => d.state);

      // for (var state of incompleteStates) {
      //   d3.select(`#${state}`).remove();
      // }
    },
    getGeopath() {
      return d3.geoPath().projection(this.getProjection());
    },
    getProjection() {
      return (
        d3 // this projection was chosen due to the recommendation during the tutorial
          .geoAlbers()
          // the next lines were copied from the following link to display Europe properly: https://observablehq.com/@toja/five-map-projections-for-europe#_albers
          .rotate([-15, 0.0])
          .center([0, 52.0])
          .parallels([55.0, 65.0])
          .translate([this.svgWidth / 2, this.svgHeight / 2])
          .scale([this.svgHeight * 1.4])
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
      d3.select("body").append("div").attr("id", "mapTooltip");
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
        Infections per Million: ${casesOfState} <br>
        ICU Patients per Million: ${icuOfState == 0 ? "No Data" : icuOfState}`
        )
        .style("left", `${event.pageX - 230}px`)
        .style("top", `${event.pageY - 110}px`)
        .style("display", "block");
    },
    moveTooltip(event) {
      d3.select("#mapTooltip")
        .style("left", `${event.pageX - 230}px`)
        .style("top", `${event.pageY - 110}px`);
    },
    hideTooltip() {
      const div = d3.select("#mapTooltip").style("opacity", 0.95);
      div.transition().duration(300).style("opacity", 0);
    },

    // https://observablehq.com/@d3/bivariate-choropleth
    drawLegend() {
      d3.selectAll(".map-legend").remove();
      // const rectDiagonal = Math.sqrt(2 * this.rectSize * this.rectSize);
      d3.select(this.$refs.legend).attr(
        "transform",
        `translate(${this.svgWidth - 4 * this.rectSize},${this.svgPadding.top})`
      );

      for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
          this.appendRect(i, j);
        }
      }

      this.drawText();
      // this.drawNoDataLegend();
    },
    drawText() {
      d3.select(this.$refs.legend)
        .append("text")
        .text("Infections")
        .attr("y", this.rectSize * 4 - 12)
        .attr("fill", "black")
        .attr("font-size", "14px")
        .attr("class", "map-legend");

      d3.select(this.$refs.legend)
        .append("text")
        .text("ICU Patients")
        .attr("transform", "rotate(270)")
        .attr("class", "map-legend")
        .attr("x", this.rectSize - 39)
        .attr("y", this.rectSize - 35)
        .attr("text-anchor", "end")
        .attr("font-size", "14px")
        .attr("fill", "black");
    },
    // drawNoDataLegend() {
    //   // const rectDiagonal = Math.sqrt(2 * this.rectSize * this.rectSize);
    //   const x = this.svgWidth - 5.5 * this.rectSize;
    //   const y = this.svgPadding.top + this.rectSize * 4 - 10;
    //   const rectSize = this.rectSize - 8;

    //   d3.select(this.$refs.map)
    //     .append("rect")
    //     .attr("class", "map-legend")
    //     .attr("x", x)
    //     .attr("y", y)
    //     .attr("width", rectSize)
    //     .attr("height", rectSize)
    //     .style("fill", this.noDataColor);

    //   d3.select(this.$refs.map)
    //     .append("text")
    //     .text("Missing Data")
    //     .attr("class", "map-legend")
    //     .attr("x", x + rectSize + 10)
    //     .attr("y", y + rectSize - 6)
    //     .attr("font-size", "14px")
    //     .attr("fill", "black");
    // },
    appendRect(xInd, yInd) {
      const color = bivariate_colors[xInd][yInd];

      d3.select(this.$refs.legend)
        .append("rect")
        .attr("class", "map-legend")
        .attr("x", xInd * this.rectSize)
        .attr("y", yInd * this.rectSize)
        .attr("width", this.rectSize)
        .attr("height", this.rectSize)
        .attr("style", `fill:${color};`);
    },

    // this fills up the Map in the store, which saves the colors
    // each state should be highlighted on the choropleth map when selected
    // gets called every time eduRate/ persIncome change
    fillColorMap() {
      let colorMap = new Map();

      for (let datapoint of this.covidData) {
        const color = this.getColorForDatapoint(datapoint.cases, datapoint.icu);
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
  width: 225px;
  height: 80px;
  background: lightgrey;
  border-radius: 10px;
  padding: 5px;
  font-size: 14px;
  opacity: 0;
  display: none;
}
.small-text {
  font-size: 13px;
}
</style>
