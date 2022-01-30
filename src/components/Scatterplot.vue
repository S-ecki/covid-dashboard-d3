<template>
  <div class="vis-component" ref="chart">
    <svg class="main-svg" :width="svgWidth" :height="svgHeight" ref="mainSVG">
      <g class="chart-group" ref="chartGroup">
        <g class="bg" ref="bg"></g>
        <g class="rect-group" ref="rectGroup"></g>
        <g class="axis axis-x" ref="axisX"></g>
        <g class="axis axis-y" ref="axisY"></g>
      </g>
      <g class="brush-group" ref="brushGroup"></g>
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
      const xAxis = d3
        .axisBottom(this.xScale)
        // .ticks(6)
        .tickFormat((data) => `${data}%`);

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
        .attr("y", this.svgHeight - this.svgPadding.top - 10)
        .attr("text-anchor", "start")
        .text("People Vaccinated per 100 ");
    },

    drawYAxis() {
      const yAxis = d3
        .axisLeft(this.yScale)
        // .ticks(6)
        .tickFormat((data) => `${data}`);

      d3.select(this.$refs.axisY).call(yAxis);

      this.drawYLabel();
    },
    drawYLabel() {
      d3.select(this.$refs.axisY)
        .append("text")
        .attr("id", "scatterLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", -this.svgPadding.left + 20)
        .attr("text-anchor", "end")
        .text("Covid Cases per 1 Million");
    },

    drawScatter() {
      d3.select(this.$refs.scatterGroup).selectAll(".scatter-cases").remove();

      let data = [];
      if (this.selectedState != "") {
        data = [this.covidDataByCountry(this.selectedState)];
      } else {
        data = this.covidData;
      }

      // data = data.filter((d) => d.cases > 0 && d.vax > 0);

      d3.select(this.$refs.scatterGroup)
        .selectAll(".scatter-cases")
        .data(data)
        .join("circle")
        .attr("class", "scatter-cases")
        .attr("id", (d) => `scatter-cases-${d.state}`)
        .attr("fill", "green")
        // .attr("stroke", (d) =>
        //   this.selectedStates.includes(d.state) ? "white" : "black"
        // )
        // .attr("stroke-width", (d) =>
        //   this.selectedStates.includes(d.state) ? "1.5" : "1"
        // )
        .attr("cx", (d) => this.xScale(d.vax))
        .attr("cy", (d) => this.yScale(d.cases))
        .attr("r", 3)
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip)
        .on("click", (_, d) => {
          this.$store.commit("changeSelectedState", d.state);
        });

      d3.select(this.$refs.scatterGroup)
        .selectAll(".scatter-deaths")
        .data(data)
        .join("rect")
        .attr("class", "scatter-deaths")
        .attr("id", (d) => `scatter-deaths-${d.state}`)
        .attr("fill", "red")
        // .attr("stroke", (d) =>
        //   this.selectedStates.includes(d.state) ? "white" : "black"
        // )
        // .attr("stroke-width", (d) =>
        //   this.selectedStates.includes(d.state) ? "1.5" : "1"
        // )
        .attr("x", (d) => this.xScale(d.vax))
        .attr("y", (d) => this.yScale(d.deaths))
        .attr("width", 6)
        .attr("height", 6)
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip)
        .on("click", (_, d) => {
          this.$store.commit("changeSelectedState", d.state);
        });
    },

    // getScatterData() {
    //   return this.$store.getters.personalIncome.map((pInc, i) => ({
    //     state: pInc.state,
    //     x: this.$store.getters.educationRates[i].value,
    //     y: pInc.value,
    //   }));
    // },

    initTooltip() {
      d3.select("#scatterTooltip").remove();
      // the idea of how to use tooltips was inspired by this website, but heavily changed to my own needs
      // https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
      d3.select("body").append("div").attr("id", "scatterTooltip");
    },
    showTooltip(event, data) {
      d3.select("#scatterTooltip")
        .style("left", `${event.pageX - 50}px`)
        .style("top", `${event.pageY + 30}px`)
        .style("opacity", 1)
        .style("display", "block")
        .text(data.state);
    },
    hideTooltip() {
      d3.select(`#scatterTooltip`).style("opacity", 0).style("display", "none");
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
  width: 110px;
  height: 45px;
  background: lightgrey;
  border-radius: 5px;
  font-size: 14px;
  opacity: 0;
  display: none;
}
#scatterLabel {
  font-size: small;
  fill: black;
}
</style>
