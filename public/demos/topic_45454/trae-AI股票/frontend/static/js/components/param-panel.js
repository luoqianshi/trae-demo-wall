/**
 * 参数调节面板组件
 * 6 项核心参数 + 3 套预设模板
 */
const ParamPanel = {
  name: "ParamPanel",
  props: {
    modelValue: { type: Object, default: () => ({}) },
  },
  emits: ["update:modelValue"],
  template: `
    <div class="card">
      <div class="card-title">参数调节</div>

      <div class="form-group">
        <label class="form-label">预设模板</label>
        <select class="form-control" v-model="presetId" @change="applyPreset">
          <option value="">自定义</option>
          <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">时间步长 (time_step)</label>
          <input class="form-control" type="number" min="1" max="120"
                 v-model.number="params.time_step" @input="emit" />
        </div>
        <div class="form-group">
          <label class="form-label">训练轮次 (epochs)</label>
          <input class="form-control" type="number" min="1" max="500"
                 v-model.number="params.epochs" @input="emit" />
        </div>
        <div class="form-group">
          <label class="form-label">学习率 (learning_rate)</label>
          <input class="form-control" type="number" step="0.0001" min="0.00001"
                 v-model.number="params.learning_rate" @input="emit" />
        </div>
        <div class="form-group">
          <label class="form-label">批量大小 (batch_size)</label>
          <input class="form-control" type="number" min="1" max="256"
                 v-model.number="params.batch_size" @input="emit" />
        </div>
        <div class="form-group">
          <label class="form-label">隐藏层单元 (hidden_units)</label>
          <input class="form-control" type="number" min="8" max="512"
                 v-model.number="params.hidden_units" @input="emit" />
        </div>
        <div class="form-group">
          <label class="form-label">Dropout 比率</label>
          <input class="form-control" type="number" step="0.05" min="0" max="0.9"
                 v-model.number="params.dropout" @input="emit" />
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      presetId: "standard",
      presets: [],
      params: { time_step: 30, epochs: 50, learning_rate: 0.001,
                batch_size: 32, hidden_units: 64, dropout: 0.2 },
    };
  },
  async mounted() {
    try {
      this.presets = await API.model.presets();
      this.applyPreset();
    } catch (e) { /* 静默 */ }
  },
  methods: {
    applyPreset() {
      const p = this.presets.find((x) => x.id === this.presetId);
      if (p) { this.params = { ...p.params }; this.emit(); }
    },
    emit() {
      this.$emit("update:modelValue", { ...this.params });
    },
  },
};

window.ParamPanel = ParamPanel;
