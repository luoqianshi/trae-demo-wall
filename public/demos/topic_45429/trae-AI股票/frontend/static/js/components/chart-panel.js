/**
 * 通用 ECharts 图表面板组件
 * 用法: <chart-panel :option="echartsOption" height="360px" />
 */
const ChartPanel = {
  name: "ChartPanel",
  props: {
    option: { type: Object, default: () => ({}) },
    height: { type: String, default: "360px" },
  },
  template: `<div ref="el" class="chart" :style="{height: height}"></div>`,
  mounted() {
    this.chart = echarts.init(this.$refs.el);
    if (this.option && Object.keys(this.option).length) {
      this.chart.setOption(this.option);
    }
    window.addEventListener("resize", this.resize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resize);
    this.chart && this.chart.dispose();
  },
  watch: {
    option: {
      deep: true,
      handler(val) {
        if (this.chart && val) this.chart.setOption(val, true);
      },
    },
  },
  methods: {
    resize() {
      this.chart && this.chart.resize();
    },
  },
};

window.ChartPanel = ChartPanel;
