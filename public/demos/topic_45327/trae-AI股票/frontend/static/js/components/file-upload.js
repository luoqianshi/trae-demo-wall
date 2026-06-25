/**
 * 文件上传组件（支持拖拽 + 点击）
 * 双槽位: 训练数据 / 测试数据
 */
const FileUpload = {
  name: "FileUpload",
  props: {
    role: { type: String, default: "train" }, // train | test
    label: { type: String, default: "训练数据" },
  },
  emits: ["uploaded"],
  data() {
    return { dragover: false, file: null, preview: null, loading: false };
  },
  template: `
    <div class="card">
      <div class="card-title">{{ label }}</div>
      <div class="drop-zone" :class="{dragover}"
           @click="$refs.input.click()"
           @dragover.prevent="dragover = true"
           @dragleave.prevent="dragover = false"
           @drop.prevent="onDrop">
        <div class="icon">📁</div>
        <div v-if="!file">点击或拖拽文件到此处上传<br/><small>支持 CSV / Excel / JSON</small></div>
        <div v-else>
          <strong>{{ file.name }}</strong><br/>
          <small class="text-muted">{{ (file.size / 1024).toFixed(1) }} KB</small>
        </div>
        <input ref="input" type="file" hidden
               accept=".csv,.xlsx,.xls,.json"
               @change="onChange" />
      </div>
      <div v-if="preview" class="mt-2">
        <div class="flex-between mb-2">
          <span class="text-muted">共 {{ preview.rows }} 行 · {{ preview.columns.length }} 列</span>
          <span class="tag tag-accent">{{ preview.path.split('.').pop().toUpperCase() }}</span>
        </div>
        <table class="table">
          <thead><tr><th v-for="c in preview.columns.slice(0,6)" :key="c">{{ c }}</th></tr></thead>
          <tbody>
            <tr v-for="(row,i) in preview.preview.slice(0,5)" :key="i">
              <td v-for="c in preview.columns.slice(0,6)" :key="c">{{ row[c] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  methods: {
    onDrop(e) {
      this.dragover = false;
      const f = e.dataTransfer.files[0];
      if (f) this.handleFile(f);
    },
    onChange(e) {
      const f = e.target.files[0];
      if (f) this.handleFile(f);
    },
    async handleFile(f) {
      this.file = f;
      const fd = new FormData();
      fd.append(this.role, f);
      this.loading = true;
      try {
        const res = await API.data.upload(fd);
        this.preview = res[this.role];
        this.$emit("uploaded", { role: this.role, preview: this.preview });
      } catch (err) {
        alert("上传失败: " + err.message);
      } finally {
        this.loading = false;
      }
    },
  },
};

window.FileUpload = FileUpload;
