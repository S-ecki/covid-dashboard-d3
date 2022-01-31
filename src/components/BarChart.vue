<template>
  <div class="vis-component" ref="chart">
    <!-- todo fix height so bars dont jump  -->
    <div v-b-tooltip.html title="test<p>test</br>test">
      some header
      <div class="info-text" v-if="cases != -1">
        Infections per Million:
        {{ cases == 0 ? "No data" : cases.toFixed(0) }}
      </div>
      <div class="info-text" v-if="icu != -1">
        ICU per Million: {{ icu == 0 ? "No data" : icu.toFixed(1) }}
      </div>
    </div>
    <div class="bar-chart">
      <svg id="main-svg" :width="svgWidth" :height="svgHeight">
        <g class="chart-group" ref="chartGroup">
          <g class="axis axis-x" ref="axisX"></g>
          <g class="axis axis-y" ref="axisY"></g>
          <g class="bars-group" ref="barsGroup"></g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import { mapGetters } from "vuex";

export default {
  name: "BarChart",
  props: {},
  data() {
    return {
      cases: 0,
      icu: 0,
      svgWidth: 0,
      svgHeight: 500,
      svgPadding: {
        top: 25,
        right: 20,
        bottom: 70,
        left: 80,
      },
    };
  },
  mounted() {
    this.drawChart();
  },
  methods: {
    drawChart() {
      if (this.$refs.chart) this.svgWidth = this.$refs.chart.clientWidth;
      d3.select(this.$refs.chartGroup).attr(
        "transform",
        `translate(${this.svgPadding.left},${this.svgPadding.top})`
      );
      this.drawXAxis();
      this.drawYAxis();
      this.drawBars();
      this.updateNumbers();
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
    drawXAxis() {
      d3.select(this.$refs.axisX)
        .attr(
          "transform",
          `translate( 0, ${
            this.svgHeight - this.svgPadding.top - this.svgPadding.bottom
          } )`
        )
        .call(d3.axisBottom(this.xScale))
        .selectAll("text")
        .attr("class", "labels")
        .attr("y", 12);
    },
    drawYAxis() {
      d3.select(this.$refs.axisY)
        .call(d3.axisLeft(this.yScale))
        .selectAll("text")
        .attr("class", "labels");

      d3.select(this.$refs.axisY)
        .append("text")
        .attr("class", "y-text")
        .attr("transform", "rotate(-90)")

        .attr("y", 6)
        .attr("dy", "0.9em")
        .text("Risk Factor normalized");
    },
    drawBars() {
      const barsGroup = d3.select(this.$refs.barsGroup);
      barsGroup.selectAll(".bar-label").remove();
      barsGroup.selectAll(".bar").remove();
      if (this.selectedState == "") {
        return;
      }

      const countryData = this.covidDataByCountry(this.selectedState);
      let color = this.colorMap.get(this.selectedState);
      if (color == "white") color = "red";
      const filteredData = [
        { name: "poverty", value: countryData.poverty },
        { name: "diabetes", value: countryData.diabetes },
        { name: "cardiovascular", value: countryData.cardiovascular },
        { name: "smokers", value: countryData.smokers },
        { name: "development", value: countryData.development_index_inverse },
      ];

      barsGroup
        .selectAll(".bar")
        .data(filteredData)
        .join("rect")
        .attr("class", "bar")
        .attr("fill", color)
        .attr("x", (d) => this.xScale(d.name))
        .attr("y", (d) => this.yScale(d.value))
        .attr("width", this.xScale.bandwidth())
        .attr(
          "height",
          (d) =>
            this.svgHeight -
            this.svgPadding.top -
            this.svgPadding.bottom -
            this.yScale(d.value)
        );

      // https://stackoverflow.com/questions/42491106/add-labels-to-bar-chart-d3
      barsGroup
        .selectAll(".text")
        .data(filteredData)
        .join("text")
        .attr("class", "bar-label")
        // .append("text")
        .attr("fill", "black")
        .attr("x", (d) => this.xScale(d.name) + this.xScale.bandwidth() / 4)
        .attr("y", (d) => this.yScale(d.value) - 20)
        .attr("dy", ".8em")
        .text((d) => (d.value * 100).toFixed(1) + "%");
    },
  },

  computed: {
    ...mapGetters([
      "selectedState",
      "covidData",
      "covidDataByCountry",
      "colorMap",
    ]),
    xScale() {
      return d3
        .scaleBand()
        .rangeRound([
          0,
          this.svgWidth - this.svgPadding.left - this.svgPadding.right,
        ])
        .domain([
          "poverty",
          "diabetes",
          "cardiovascular",
          "smokers",
          "development",
        ])
        .padding(0.5);
    },
    yScale() {
      return d3
        .scaleLinear()
        .rangeRound([
          this.svgHeight - this.svgPadding.top - this.svgPadding.bottom,
          0,
        ])
        .domain([0, 1]);
    },
  },
  watch: {
    selectedState: {
      handler() {
        this.drawChart();
      },
      deep: true,
    },
  },
};
</script>

<style>
.info-text {
  display: flex;
  align-content: left;
  flex-direction: row;
}

.labels {
  font-size: 12px;
  font-weight: bold;
}

.y-text {
  font-size: 14px;
  fill: black;
}
</style>
