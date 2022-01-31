<template>
  <div class="vis-component" ref="chart">
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

export default {
  name: "Scatterplot",
  props: {},
  data() {
    return {
      hoveredID: "",
      colors: ["green", "red"],
      showCases: true,
      showDeaths: true,
      svgWidth: 500,
      svgHeight: 600,
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
    this.drawLegend();
  },

  methods: {
    drawVis() {
      if (this.$refs.chart) this.svgWidth = this.$refs.chart.clientWidth;
      this.transformSVGs();
      this.drawChart();
      this.addBackground();
    },

    drawChart() {
      d3.selectAll("#scatterLabel").remove();
      this.drawXAxis();
      this.drawYAxis();
      this.drawScatter();
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
      d3.select(this.$refs.legendGroup)
        .append("circle")
        .attr("cx", 30)
        .attr("cy", 10)
        .attr("r", 6)
        .style("fill", this.colors[0])
        .on("click", this.toggleCases);
      d3.select(this.$refs.legendGroup)
        .append("text")
        .attr("x", 50)
        .attr("y", 10)
        .text("New Infections per 1 Million People")
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle")
        .on("click", this.toggleCases);
      d3.select(this.$refs.legendGroup)
        .append("rect")
        .attr("x", 24)
        .attr("y", 10 + 13)
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", this.colors[1])
        .on("click", this.toggleDeaths);
      d3.select(this.$refs.legendGroup)
        .append("text")
        .attr("x", 50)
        .attr("y", 10 + 20)
        .text("Deaths per 1 Million People")
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle")
        .on("click", this.toggleDeaths);
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

      // data = data.filter((d) => d.cases > 0 && d.vax > 0);

      if (this.showCases) {
        d3.select(this.$refs.scatterGroup)
          .selectAll(".scatter-cases")
          .data(data)
          .join("circle")
          .attr("class", "scatter-cases")
          .attr("id", (d) => `scatter-cases-${d.cases.toFixed(0)}`)
          .attr("fill", "green")
          .attr("stroke", "black")
          .attr("stroke-width", (d) =>
            this.selectedState == d.state ? "0.5" : "0"
          )
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
          .attr("fill", "red")
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

    initTooltip() {
      d3.select("#scatterTooltip").remove();
      // the idea of how to use tooltips was inspired by this website, but heavily changed to my own needs
      // https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
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
        .attr("r", 4);
      d3.select(`#scatter-deaths-${cases}`)
        .attr("stroke-width", "1")
        .attr("width", 8)
        .attr("height", 8);
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
        .domain([0, this.vaxMax])
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
