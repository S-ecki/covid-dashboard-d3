<template>
  <div class="vis-component" ref="chart">
    <b-container>
      <b-row align-h="center" align-v="start">
        <div class="h5 pb-1 pr-2">
          Relation between Vaccinations and New Infections/Deaths
        </div>
        <div
          v-b-tooltip.html
          title="Click the legend to hide/display a dataset.</br>
          Countries without sufficient vaccination data are not shown. <br>
          Vaccination Rates exceeding 100% are possible due to non-resident vaccinations!"
        >
          <b-icon
            icon="question-circle"
            style="width: 1.5em; height: 1.5em"
          ></b-icon>
        </div>
      </b-row>
      <b-row align-h="center">
        <b-alert show variant="warning" v-if="missingData" class="w-50 mb-0"
          >No Data for selected Focus Country!</b-alert
        >
      </b-row>
    </b-container>
    <svg class="main-svg" :width="svgWidth" :height="svgHeight" ref="mainSVG">
      <g class="chart-group" ref="chartGroup">
        <g class="bg" ref="bg"></g>
        <g class="rect-group" ref="rectGroup"></g>
        <g class="axis axis-x" ref="axisX"></g>
        <g class="axis axis-y" ref="axisY"></g>
        <g class="legend-group" ref="legendGroup"></g>
      </g>
      <g class="scatter-group" ref="scatterGroup"></g>
    </svg>
  </div>
</template>

<script>
import * as d3 from "d3";
import { mapGetters } from "vuex";
import bivariate_colors from "../helpers/bivariate_colors.js";

export default {
  name: "Scatterplot",
  props: {},
  data() {
    return {
      hoveredID: "",
      colors: [bivariate_colors[2][2], bivariate_colors[0][0]],
      showCases: true,
      showDeaths: true,
      missingData: false,
      svgWidth: 500,
      svgHeight: 518,
      svgPadding: {
        top: 20,
        right: 20,
        bottom: 50,
        left: 70,
      },
    };
  },

  mounted() {
    this.drawVis();
    this.initTooltip();
  },

  methods: {
    drawVis() {
      if (this.$refs.chart) this.svgWidth = this.$refs.chart.clientWidth;
      this.transformSVGs();
      this.drawChart();
      this.addBackground();
    },
    transformSVGs() {
      d3.select(this.$refs.chartGroup).attr(
        "transform",
        `translate(${this.svgPadding.left},${this.svgPadding.top})`
      );
      d3.select(this.$refs.scatterGroup).attr(
        "transform",
        `translate(${this.svgPadding.left},${this.svgPadding.top})`
      );
      d3.select(this.$refs.brushGroup).attr(
        "transform",
        `translate(${this.svgPadding.left},${this.svgPadding.top})`
      );
    },
    addBackground() {
      d3.select(this.$refs.bg)
        .append("rect")
        .attr("width", this.svgWidth)
        .attr("height", this.svgHeight)
        .attr("style", `fill:transparent;`)
        .on("click", () => {
          this.$store.commit("clearStateSelection");
        });
    },
    drawChart() {
      d3.selectAll("#scatterLabel").remove();
      this.drawXAxis();
      this.drawYAxis();
      this.drawScatter();
      this.drawLegend();
    },
    drawXAxis() {
      const xAxis = d3.axisBottom(this.xScale).tickFormat((data) => `${data}%`);

      d3.select(this.$refs.axisX)
        .attr(
          "transform",
          `translate( 0, ${
            this.svgHeight - this.svgPadding.top - this.svgPadding.bottom
          } )`
        )
        .call(xAxis);

      this.drawXLabel();
    },
    drawXLabel() {
      d3.select(this.$refs.axisY)
        .append("text")
        .attr("id", "scatterLabel")
        .attr("y", this.svgHeight - this.svgPadding.top - 15)
        .attr("text-anchor", "start")
        .text("Percentage of People with atleast 1 Vaccine Dose");
    },

    drawYAxis() {
      const yAxis = d3.axisLeft(this.yScale).tickFormat((data) => `${data}`);
      d3.select(this.$refs.axisY).call(yAxis);
    },
    drawLegend() {
      d3.selectAll(".scatter-legend").remove();

      d3.select(this.$refs.legendGroup)
        .append("circle")
        .attr("class", "scatter-legend")
        .attr("cx", 30)
        .attr("cy", 10)
        .attr("r", 6)
        .style("fill", this.colors[0])
        .style("opacity", this.showCases ? 1 : 0.5)
        .on("click", this.toggleCases);
      d3.select(this.$refs.legendGroup)
        .append("rect")
        .attr("class", "scatter-legend")
        .attr("x", 24)
        .attr("y", 10 + 13)
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", this.colors[1])
        .style("opacity", this.showDeaths ? 1 : 0.5)
        .on("click", this.toggleDeaths);
      this.legendText(
        0,
        "New Infections per 1 Million People",
        this.showCases,
        this.toggleCases
      );
      this.legendText(
        1,
        "Deaths per 1 Million People",
        this.showDeaths,
        this.toggleDeaths
      );
    },
    legendText(index, text, showBool, toggle) {
      d3.select(this.$refs.legendGroup)
        .append("text")
        .attr("class", "scatter-legend")
        .attr("x", 50)
        .attr("y", 10 + index * 20)
        .text(text)
        .style("font-size", "15px")
        .style("fill", showBool ? "black" : "grey")
        .attr("alignment-baseline", "middle")
        .on("click", toggle);
    },
    toggleCases() {
      this.showCases = !this.showCases;
      this.drawChart();
    },
    toggleDeaths() {
      this.showDeaths = !this.showDeaths;
      this.drawChart();
    },
    drawScatter() {
      d3.select(this.$refs.scatterGroup).selectAll(".scatter-cases").remove();
      d3.select(this.$refs.scatterGroup).selectAll(".scatter-deaths").remove();

      let data = [];
      if (this.selectedState != "") {
        data = [this.covidDataByCountry(this.selectedState)];
      } else {
        data = this.covidData;
      }

      // dont filter deaths == 0 as this is a valid number for some countries
      data = data.filter((d) => d.cases > 0 && d.vax > 0);

      if (data.length == 0) {
        this.missingData = true;
        return;
      } else {
        this.missingData = false;
      }

      if (this.showCases) {
        d3.select(this.$refs.scatterGroup)
          .selectAll(".scatter-cases")
          .data(data)
          .join("circle")
          .attr("class", "scatter-cases")
          .attr("id", (d) => `scatter-cases-${d.cases.toFixed(0)}`)
          .attr("fill", this.colors[0])
          .attr("stroke", "black")
          .attr("stroke-width", 0)
          .attr("cx", (d) => this.xScale(d.vax))
          .attr("cy", (d) => this.yScale(d.cases))
          .attr("r", 3)
          .on("mouseover", this.showTooltip)
          .on("mouseout", this.hideTooltip)
          .on("click", (_, d) => {
            this.$store.commit("changeSelectedState", d.state);
          });
      }
      if (this.showDeaths) {
        d3.select(this.$refs.scatterGroup)
          .selectAll(".scatter-deaths")
          .data(data)
          .join("rect")
          .attr("class", "scatter-deaths")
          .attr("id", (d) => `scatter-deaths-${d.cases.toFixed(0)}`)
          .attr("fill", this.colors[1])
          .attr("stroke", "black")
          .attr("stroke-width", "0")
          .attr("x", (d) => this.xScale(d.vax))
          .attr("y", (d) => this.yScale(d.deaths) - 3)
          .attr("width", 6)
          .attr("height", 6)
          .on("mouseover", this.showTooltip)
          .on("mousemove", this.moveTooltip)
          .on("mouseout", this.hideTooltip)
          .on("click", (_, d) => {
            this.$store.commit("changeSelectedState", d.state);
          });
      }
    },
    // the idea of how to use tooltips was inspired by following 2 websites, but heavily changed to my own needs
    // https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
    // https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
    initTooltip() {
      d3.select("#scatterTooltip").remove();
      d3.select("body").append("div").attr("id", "scatterTooltip");
    },
    showTooltip(event, data) {
      const stateName = data.state;
      const vax = data.vax.toFixed(1);
      const cases = data.cases.toFixed(0);
      const deaths = data.deaths.toFixed(1);

      const displayedText = `<b>${stateName}</b></br>
        Population with atleast 1 Vaccination: ${vax}%</br>
        New Infections per Million People: ${cases}</br>
        Deaths per Million: ${deaths}
        `;

      const div = d3.select("#scatterTooltip").style("opacity", 0);
      div.transition().duration(150).style("opacity", 0.95);

      div
        .html(displayedText)
        .style("left", `${event.pageX + 50}px`)
        .style("top", `${event.pageY + 40}px`)
        .style("display", "block");

      d3.select(`#scatter-cases-${cases}`)
        .attr("stroke-width", "1")
        .attr("r", 5);
      d3.select(`#scatter-deaths-${cases}`)
        .attr("stroke-width", "1")
        .attr("width", 9)
        .attr("height", 9);
      this.hoveredID = cases;
    },
    moveTooltip(event) {
      d3.select("#scatterTooltip")
        .style("left", `${event.pageX + 50}px`)
        .style("top", `${event.pageY + 40}px`);
    },
    hideTooltip() {
      const div = d3.select("#scatterTooltip").style("opacity", 0.95);
      div.transition().duration(300).style("opacity", 0);

      d3.select(`#scatter-cases-${this.hoveredID}`)
        .attr("stroke-width", "0")
        .attr("r", 3);

      d3.select(`#scatter-deaths-${this.hoveredID}`)
        .attr("stroke-width", "0")
        .attr("width", 6)
        .attr("height", 6);
      this.hoveredID = "";
    },
  },

  computed: {
    ...mapGetters([
      "selectedState",
      "covidData",
      "covidDataByCountry",
      "casesMin",
      "casesMax",
      "vaxMin",
      "vaxMax",
      "deathsMin",
      "deathsMax",
      "colorMap",
    ]),
    xScale() {
      return d3
        .scaleLinear()
        .domain([this.vaxMin, this.vaxMax])
        .range([
          0,
          this.svgWidth - this.svgPadding.left - this.svgPadding.right,
        ]);
    },
    yScale() {
      return d3
        .scaleLinear()
        .domain([0, this.casesMax])
        .range([
          this.svgHeight - this.svgPadding.top - this.svgPadding.bottom,
          0,
        ]);
    },
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
        this.drawVis();
      },
      deep: true,
    },
    colorMap: {
      handler() {
        this.drawVis();
      },
      deep: true,
    },
  },
};
</script>

<style>
#scatterTooltip {
  position: absolute;
  text-align: center;
  width: 300px;
  height: 100px;
  background: lightgrey;
  border-radius: 10px;
  padding: 5px;
  font-size: 14px;
  opacity: 0;
  display: none;
}
#scatterLabel {
  font-size: small;
  fill: black;
}
</style>
