/**
 * 模型训练视图
 * - 选择模型
 * - 调节参数
 * - 训练并查看结果
 */
const ModelTrainingView = {
  name: "ModelTrainingView",
  components: { ParamPanel, ChartPanel },
  template: `
    <div>
      <div class="card">
        <div class="card-title">模型训练</div>
        <div v-if="!trainPath" class="alert alert-info">
          请先前往 <router-link to="/data">数据接入</router-link> 页面上传或生成数据。
        </div>
      </div>

      <div v-if="trainPath" class="grid" style="grid-template-columns: 1fr 1fr;">
        <div class="card">
          <div class="card-title">选择模型</div>
          <div class="grid grid-2">
            <label v-for="m in models" :key="m.id"
                   class="flex gap-1"
                   style="padding:0.5rem;border:1px solid var(--rule);border-radius:8px;cursor:pointer;"
                   :style="{borderColor: modelId===m.id ? 'var(--accent)' : '', background: modelId===m.id ? '#eff6ff' : ''}">
              <input type="radio" :value="m.id" v-model="modelId" />
              <div>
                <div style="font-weight:600;font-size:0.9rem;">{{ m.name }}</div>
                <div class="text-muted" style="font-size:0.75rem;">{{ m.type }}</div>
              </div>
            </label>
          </div>
        </div>

        <param-panel v-model="params" />
      </div>

      <div class="card" v-if="trainPath">
        <div class="flex-between">
          <div>
            <strong>训练数据：</strong><span class="tag tag-accent">已就绪</span>
            <strong style="margin-left:1rem;">测试数据：</strong>
            <span v-if="testPath" class="tag tag-accent">已就绪</span>
            <span v-else class="text-muted">无（使用训练集自评估）</span>
          </div>
          <button class="btn btn-success" @click="train" :disabled="training">
            {{ training ? '训练中...' : '🚀 开始训练' }}
          </button>
        </div>
      </div>

      <!-- 训练结果 -->
      <div v-if="result">
        <div class="card">
          <div class="card-title">评估指标</div>
          <div class="grid grid-5" style="grid-template-columns:repeat(5,1fr);">
            <div class="metric" v-for="(v,k) in result.metrics" :key="k">
              <div class="value">{{ formatMetric(v) }}</div>
              <div class="label">{{ k }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">预测结果对比</div>
          <chart-panel :option="forecastOption" height="420px" />
        </div>

        <div v-if="result.history && result.history.loss" class="card">
          <div class="card-title">训练损失曲线</div>
          <chart-panel :option="lossOption" height="300px" />
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      models: [],
      modelId: "lstm",
      params: { time_step: 30, epochs: 50, learning_rate: 0.001,
                batch_size: 32, hidden_units: 64, dropout: 0.2 },
      training: false,
      result: null,
    };
  },
  computed: {
    trainPath() { return this.$root.trainPath; },
    testPath() { return this.$root.testPath; },
    forecastOption() {
      if (!this.result) return {};
      const n = this.result.y_true.length;
      const x = Array.from({ length: n }, (_, i) => i + 1);
      return {
        tooltip: { trigger: "axis" },
        legend: { data: ["真实值", "预测值"] },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: { type: "category", data: x, name: "时间步" },
        yAxis: { type: "value", name: "价格" },
        series: [
          { name: "真实值", type: "line", data: this.result.y_true,
            smooth: true, lineStyle: { width: 2 } },
          { name: "预测值", type: "line", data: this.result.y_pred,
            smooth: true, lineStyle: { width: 2, color: "#ef4444" } },
        ],
      };
    },
    lossOption() {
      if (!this.result || !this.result.history.loss) return {};
      const h = this.result.history;
      return {
        tooltip: { trigger: "axis" },
        legend: { data: ["训练损失", "验证损失"] },
        xAxis: { type: "category", data: h.loss.map((_, i) => i + 1), name: "Epoch" },
        yAxis: { type: "value", name: "Loss" },
        series: [
          { name: "训练损失", type: "line", data: h.loss, smooth: true },
          { name: "验证损失", type: "line", data: h.val_loss || [], smooth: true },
        ],
      };
    },
  },
  async mounted() {
    try { this.models = await API.model.list(); } catch (e) { /* 静默 */ }
  },
  methods: {
    formatMetric(v) {
      if (typeof v !== "number") return v;
      return Math.abs(v) < 0.01 ? v.toExponential(2) : v.toFixed(4);
    },
    async train() {
      this.training = true;
      this.result = null;
      try {
        this.result = await API.model.train({
          model_id: this.modelId,
          train_path: this.trainPath,
          test_path: this.testPath,
          params: this.params,
        });
        // 缓存结果供可视化页面使用
        this.$root.lastResult = this.result;
      } catch (e) {
        alert("训练失败: " + e.message);
      } finally {
        this.training = false;
      }
    },
  },
};

window.ModelTrainingView = ModelTrainingView;
