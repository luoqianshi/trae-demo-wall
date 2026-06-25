/**
 * 可视化视图
 * - 历史走势 + 预测叠加
 * - 误差分布
 * - Attention 权重
 * - 多模型对比
 */
const VisualizationView = {
  name: "VisualizationView",
  components: { ChartPanel },
  template: `
    <div>
      <div class="card">
        <div class="card-title">交互式可视化</div>
        <p class="card-desc">展示预测结果的多维度可视化分析。所有图表支持缩放、悬停查看等交互操作。</p>
        <div v-if="!result" class="alert alert-info">
          暂无训练结果，请先前往 <router-link to="/train">模型训练</router-link> 页面训练模型。
        </div>
      </div>

      <div v-if="result">
        <!-- 走势叠加 -->
        <div class="card">
          <div class="card-title">历史走势与预测曲线叠加</div>
          <chart-panel :option="forecastOption" height="440px" />
        </div>

        <div class="grid grid-2">
          <!-- 误差分布 -->
          <div class="card">
            <div class="card-title">预测误差分布</div>
            <chart-panel :option="errorOption" height="320px" />
          </div>

          <!-- 残差曲线 -->
          <div class="card">
            <div class="card-title">残差时序曲线</div>
            <chart-panel :option="residualOption" height="320px" />
          </div>
        </div>

        <!-- Attention 权重 -->
        <div class="card" v-if="result.attention">
          <div class="card-title">Attention 权重热力图</div>
          <chart-panel :option="attentionOption" height="360px" />
        </div>

        <!-- 指标雷达图 -->
        <div class="card">
          <div class="card-title">模型评估雷达图</div>
          <chart-panel :option="radarOption" height="380px" />
        </div>
      </div>
    </div>
  `,
  computed: {
    result() { return this.$root.lastResult; },
    forecastOption() {
      if (!this.result) return {};
      const n = this.result.y_true.length;
      const x = Array.from({ length: n }, (_, i) => i + 1);
      return {
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        legend: { data: ["真实值", "预测值"], top: 0 },
        grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
        toolbox: { feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: {} } },
        dataZoom: [{ type: "inside" }, { type: "slider" }],
        xAxis: { type: "category", data: x, name: "时间步" },
        yAxis: { type: "value", name: "价格" },
        series: [
          { name: "真实值", type: "line", data: this.result.y_true, smooth: true,
            areaStyle: { opacity: 0.05 }, lineStyle: { width: 2 } },
          { name: "预测值", type: "line", data: this.result.y_pred, smooth: true,
            lineStyle: { width: 2, color: "#ef4444" } },
        ],
      };
    },
    errorOption() {
      if (!this.result) return {};
      const errors = this.result.y_true.map((v, i) => v - this.result.y_pred[i]);
      // 直方图分箱
      const min = Math.min(...errors), max = Math.max(...errors);
      const bins = 20, step = (max - min) / bins || 1;
      const counts = new Array(bins).fill(0);
      const labels = [];
      errors.forEach((e) => {
        let idx = Math.floor((e - min) / step);
        if (idx >= bins) idx = bins - 1;
        counts[idx]++;
      });
      for (let i = 0; i < bins; i++) labels.push((min + i * step).toFixed(2));
      return {
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: labels, name: "误差" },
        yAxis: { type: "value", name: "频次" },
        series: [{ type: "bar", data: counts, itemStyle: { color: "#7c3aed" } }],
      };
    },
    residualOption() {
      if (!this.result) return {};
      const residuals = this.result.y_true.map((v, i) => v - this.result.y_pred[i]);
      return {
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: residuals.map((_, i) => i + 1), name: "时间步" },
        yAxis: { type: "value", name: "残差" },
        series: [{ type: "line", data: residuals, smooth: true,
          areaStyle: { opacity: 0.1 }, lineStyle: { color: "#f59e0b" } }],
      };
    },
    attentionOption() {
      if (!this.result || !this.result.attention) return {};
      const data = this.result.attention;
      const n = data.length;
      const heatData = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          heatData.push([j, i, Math.abs(data[i] - data[j])]);
        }
      }
      return {
        tooltip: { position: "top" },
        grid: { left: "10%", right: "10%", bottom: "15%" },
        xAxis: { type: "category", data: Array.from({length:n},(_,i)=>i+1), name: "时间步" },
        yAxis: { type: "category", data: Array.from({length:n},(_,i)=>i+1) },
        visualMap: { min: 0, max: Math.max(...data), calculable: true,
          orient: "horizontal", left: "center", bottom: "2%",
          inRange: { color: ["#dbeafe", "#3b82f6", "#1e3a8a"] } },
        series: [{ type: "heatmap", data: heatData, emphasis: { itemStyle: { shadowBlur: 10 } } }],
      };
    },
    radarOption() {
      if (!this.result || !this.result.metrics) return {};
      const m = this.result.metrics;
      // 归一化（越小越好 → 转为越大越好的分数）
      const norm = (v, max) => Math.max(0, 100 - (v / max) * 100);
      return {
        tooltip: {},
        radar: {
          indicator: [
            { name: "MAE", max: 100 },
            { name: "MSE", max: 100 },
            { name: "RMSE", max: 100 },
            { name: "MAPE", max: 100 },
            { name: "R²", max: 100 },
          ],
        },
        series: [{
          type: "radar",
          data: [{
            value: [norm(m.MAE, 10), norm(m.MSE, 100), norm(m.RMSE, 10),
                    norm(m.MAPE, 50), Math.max(0, m.R2 * 100)],
            name: "模型表现",
            areaStyle: { opacity: 0.3 },
          }],
        }],
      };
    },
  },
};

window.VisualizationView = VisualizationView;
