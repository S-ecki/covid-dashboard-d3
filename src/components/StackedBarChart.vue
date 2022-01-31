<template>
  <div class="vis-component" ref="chart">
    <div class="stacked-bar-chart">
      <b-container>
        <b-row align-h="center" align-v="start">
          <div class="h5 pb-4 pr-2">Vaccination Rates per Dose</div>
          <div
            v-b-tooltip.html
            title="Vaccination Rates per Dose of the <b>Focus Country</b>
            can be compared to another selected Area."
          >
            <b-icon
              icon="question-circle"
              style="width: 1.5em; height: 1.5em"
            ></b-icon>
          </div>
        </b-row>
        <b-row align-v="center" class="pl-5 pb-1">
          <div>Comparison Area:</div>
          <div
            class="dropdown pl-2"
            v-b-tooltip.html
            title="The comparison is only actived when a Focus Country is selected!"
          >
            <select
              class="form-control"
              v-model="comparisonCountry"
              height="200px"
            >
              <option value="Europe Average">Europe Average</option>
              <option v-for="country in countries" :key="country.state">
                {{ country.state }}
              </option>
            </select>
          </div>
        </b-row>
      </b-container>
      <svg id="main-svg" :width="svgWidth" :height="svgHeight">
        <g class="chart-group" ref="chartGroup">
          <g class="axis axis-x" ref="stackedAxisX"></g>
          <g class="axis axis-y" ref="stackedAxisY"></g>
          <g class="stacked-bars-group" ref="stackedBarsGroup"></g>
          <g class="legend-group" ref="legendGroup"></g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import { mapGetters } from "vuex";

export default {
  name: "StackedBarChart",
  props: {},
  data() {
    return {
      comparisonCountry: "Europe Average",
      doses: ["vax", "vax_full", "vax_booster"],
      countries: [],
      colors: ["#1A4314", "#2C5E1A", "#B2D2A4"],
      svgWidth: 500,
      svgHeight: 510,
      svgPadding: {
        top: 20,
        right: 20,
        bottom: 50,
        left: 70,
      },
    };
  },
  mounted() {
    this.initTooltip();
    this.drawChart();
    this.drawLegend();
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
      d3.select(this.$refs.stackedAxisX)
        .attr(
          "transform",
          `translate( 0, ${
            this.svgHeight - this.svgPadding.top - this.svgPadding.bottom
          } )`
        )
        .call(d3.axisBottom(this.xScale).tickFormat((data) => `${data}%`))
        .selectAll("text")
        .attr("class", "stacked-labels")
        .attr("y", 12);

      d3.select(this.$refs.stackedAxisX)
        .append("text")
        .attr("class", "stacked-y-text")
        .attr("x", 20)
        .attr("y", -20)
        .attr("dy", "0.5em")
        .text("Percent of Population Vaccinated, per Dose");
    },
    drawYAxis() {
      d3.select(this.$refs.stackedAxisY)
        .call(d3.axisLeft(this.yScale))
        .selectAll("text")
        .attr("transform", "translate(0,-10)rotate(-90)")
        .attr("y", -15)
        .attr("class", "stacked-y-labels");
    },
    drawLegend() {
      for (let i = 0; i < 3; i++) {
        this.drawCircle(i);
      }
      this.drawText(0, "Population with 1 Vaccine Dose");
      this.drawText(1, "Population with 2 Vaccine Doses");
      this.drawText(2, "Population with Booster");
    },
    drawCircle(index) {
      d3.select(this.$refs.legendGroup)
        .append("circle")
        .attr("cx", 30)
        .attr("cy", 10 + index * 20)
        .attr("r", 6)
        .style("fill", this.colors[index]);
    },
    drawText(index, text) {
      d3.select(this.$refs.legendGroup)
        .append("text")
        .attr("x", 50)
        .attr("y", 10 + index * 20)
        .text(text)
        .style("font-size", "15px")
        .attr("alignment-baseline", "middle");
    },
    // https://www.d3-graph-gallery.com/graph/barplot_stacked_basicWide.html
    drawBars() {
      const barsGroup = d3.select(this.$refs.stackedBarsGroup);
      barsGroup.selectAll(".stacked-bar").remove();
      if (this.selectedState == "") {
        return;
      }
      const country = this.covidDataByCountry(this.selectedState);
      const vaxData = [this.vaxDataFromCountry(country)];

      this.comparisonCountry == "Europe Average"
        ? vaxData.push(this.vaxDataEurope())
        : vaxData.push(
            this.vaxDataFromCountry(
              this.covidDataByCountry(this.comparisonCountry)
            )
          );

      const stackData = d3.stack().keys(this.doses)(vaxData);

      barsGroup
        .append("g")
        .selectAll("g")
        .data(stackData)
        .join("g")
        .attr("class", "stacked-bar")
        .attr("fill", (d) => this.colorPalette()(d.key))
        .selectAll("rect")
        .data((d) => d)
        .join("rect")
        .attr("y", (d) => this.yScale(d.data.group) + 10)
        .attr("x", (d) => this.xScale(d[0]))
        .attr("width", (d) => this.xScale(d[1]) - this.xScale(d[0]))
        .attr("height", this.yScale.bandwidth() - 20)
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip)
        .on("mousemove", this.moveTooltip);
    },
    vaxDataFromCountry(country) {
      const noData = country.vax == 0;
      return {
        vax: (noData ? country.vax_full : country.vax) - country.vax_full,
        vax_full: country.vax_full - country.vax_booster,
        vax_booster: country.vax_booster,
        group: country.state,
      };
    },
    vaxDataEurope() {
      return {
        vax: this.vax_average - this.vax_full_average,
        vax_full: this.vax_full_average - this.vax_booster_average,
        vax_booster: this.vax_booster_average,
        group: "Europe Average",
      };
    },
    colorPalette() {
      return d3.scaleOrdinal().domain(this.doses).range(this.colors);
    },

    initTooltip() {
      d3.select("#stackedTooltip").remove();
      // the idea of how to use tooltips was inspired by this website, but heavily changed to my own needs
      // https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
      d3.select("body").append("div").attr("id", "stackedTooltip");
    },
    showTooltip(event, data) {
      const stateName = data.data.group;
      const vaxOnce = data.data.vax.toFixed(1);
      const vaxFull = data.data.vax_full.toFixed(1);
      const vaxBooster = data.data.vax_booster.toFixed(1);
      const vax_none = (
        100 -
        data.data.vax -
        data.data.vax_full -
        data.data.vax_booster
      ).toFixed(1);

      const displayedText = `
      <b>${stateName}</b></br>
        Population with 1 Vaccine Dose: ${vaxOnce}%
        Population with 2 Vaccine Doses: ${vaxFull}%
        Population with 3 Vaccine Doses: ${vaxBooster}%
        Population without Vaccinations: ${vax_none}%
        `;

      const div = d3.select("#stackedTooltip").style("opacity", 0);
      div.transition().duration(150).style("opacity", 0.95);
      div
        .html(displayedText)
        .style("left", `${event.pageX - 300}px`)
        .style("top", `${event.pageY - 120}px`)
        .style("display", "block");
    },
    moveTooltip(event) {
      const div = d3.select("#stackedTooltip");
      div
        .style("left", `${event.pageX - 300}px`)
        .style("top", `${event.pageY - 120}px`);
    },
    hideTooltip() {
      const div = d3.select("#stackedTooltip").style("opacity", 0.95);
      div.transition().duration(300).style("opacity", 0);
    },
  },

  computed: {
    ...mapGetters([
      "selectedState",
      "covidData",
      "covidDataByCountry",
      "vax_average",
      "vax_full_average",
      "vax_booster_average",
    ]),
    xScale() {
      return d3
        .scaleLinear()
        .rangeRound([
          0,
          this.svgWidth - this.svgPadding.left - this.svgPadding.right,
        ])
        .domain([0, 100]);
    },
    yScale() {
      let domainArray = [];
      if (this.selectedState != "") {
        domainArray.push(this.selectedState);
        domainArray.push(this.comparisonCountry);
      }

      return d3
        .scaleBand()
        .rangeRound([
          0,
          this.svgHeight - this.svgPadding.top - this.svgPadding.bottom,
        ])
        .domain(domainArray)
        .padding(0.5);
    },
  },
  watch: {
    selectedState: {
      handler() {
        this.drawChart();
      },
      deep: true,
    },
    covidData: {
      handler() {
        this.countries = this.covidData;
        this.drawChart();
      },
    },
    comparisonCountry: {
      handler() {
        this.drawChart();
      },
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

.stacked-y-labels {
  font-size: 12px;
  /* font-weight: bold; */
  text-anchor: middle;
}

.stacked-y-text {
  font-size: 14px;
  fill: black;
  text-anchor: start;
}
#stackedTooltip {
  position: absolute;
  text-align: center;
  width: 280px;
  height: 120px;
  background: lightgrey;
  border-radius: 10px;
  padding: 5px;
  font-size: 14px;
  opacity: 0;
  display: none;
}
</style>
