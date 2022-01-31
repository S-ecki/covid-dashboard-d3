<template>
  <div ref="chart">
    <b-container>
      <b-row align-h="center">
        <div class="pr-2">Diverse Risk Factors for Selected Country</div>
        <div
          v-b-tooltip.html
          title="
        Risk Facotrs are normalized by dividing them by the biggest occurance of the risk factor.<br>
        <b>Poverty:</b> Percentage of population below the poverty line.<br>
        <b>Diabetes:</b> Percentage of population with diabetes.<br>
        <b>CV Death:</b> Death rate from cardiovascular disease per 100.000 people.<br>
        <b>Smoking:</b> Percentage of population who smoke.<br>
        <b>Inverse HDI:</b> Inverse of the Human Development Index.
        <p><b>Hover over the bars to see exact numbers.</b></p>
        "
        >
          <b-icon icon="question-circle"></b-icon>
        </div>
      </b-row>
    </b-container>
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
    this.initTooltip();
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
        { name: "Poverty", value: countryData.poverty_rate },
        { name: "Diabetes", value: countryData.diabetes_rate },
        { name: "CV Death", value: countryData.cardiovascular_rate },
        { name: "Smokers", value: countryData.smokers_rate },
        { name: "Inverse HDI", value: countryData.development_index_inverse },
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
        )
        .on("mouseover", this.showTooltip)
        .on("mousemove", this.moveTooltip)
        .on("mouseout", this.hideTooltip);

      // https://stackoverflow.com/questions/42491106/add-labels-to-bar-chart-d3
      barsGroup
        .selectAll(".text")
        .data(filteredData)
        .join("text")
        .attr("class", "bar-label")
        .attr("fill", "black")
        .attr("x", (d) => this.xScale(d.name) + 5)
        .attr("y", (d) => this.yScale(d.value) - 20)
        .attr("text-anchor", "start")
        .attr("dy", ".8em")
        .text((d) =>
          d.value == 0 ? "No Data" : (d.value * 100).toFixed(1) + "%"
        );
    },
    initTooltip() {
      d3.select("#barTooltip").remove();
      // the idea of how to use tooltips was inspired by this website, but heavily changed to my own needs
      // https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
      d3.select("body").append("div").attr("id", "barTooltip");
    },
    showTooltip(event) {
      const stateName = this.selectedState;
      const stateyData = this.covidDataByCountry(stateName);
      const poverty = stateyData.poverty;
      const diabetes = stateyData.diabetes;
      const cardiovascular = stateyData.cardiovascular;
      const smokers = stateyData.smokers;
      const development = 1 - stateyData.development_index_inverse;

      const displayedText = `
        <b>${stateName}</b></br>
       Extreme Poverty: ${
         poverty == 0 ? "No Data" : `${poverty.toFixed(2)}%`
       }</br>
        Diabetes Prevelance: ${
          diabetes == 0 ? "No Data" : diabetes.toFixed(1)
        }%</br>
        Cardiovascular Death Rate: ${
          cardiovascular == 0 ? "No Data" : cardiovascular.toFixed(0)
        }</br>
        Share of Smokers: ${smokers == 0 ? "No Data" : smokers.toFixed(0)}%</br>
        Human Development Index: ${
          development == 0 ? "No Data" : development.toFixed(2)
        }</br>`;

      const div = d3.select("#barTooltip").style("opacity", 0);
      div.transition().duration(150).style("opacity", 0.95);

      div
        .html(displayedText)
        .style("left", `${event.pageX + 50}px`)
        .style("top", `${event.pageY - 30}px`)
        .style("display", "block");
    },
    moveTooltip(event) {
      d3.select("#barTooltip")
        .style("left", `${event.pageX - 280}px`)
        .style("top", `${event.pageY - 170}px`);
    },
    hideTooltip() {
      const div = d3.select("#barTooltip").style("opacity", 0.95);
      div.transition().duration(300).style("opacity", 0);
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
        .domain(["Poverty", "Diabetes", "CV Death", "Smokers", "Inverse HDI"])
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

#barTooltip {
  position: absolute;
  text-align: center;
  width: 250px;
  height: 145px;
  background: lightgrey;
  border-radius: 10px;
  padding: 5px;
  font-size: 14px;
  opacity: 0;
  display: none;
}
.tooltip .tooltip-inner {
  max-width: 400px;
}
</style>
