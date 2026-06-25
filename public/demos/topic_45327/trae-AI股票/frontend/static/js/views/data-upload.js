/**
 * 数据接入视图
 * - 文件上传（训练 + 测试）
 * - 一键生成模拟数据
 * - 连接本地结构化数据库（MySQL/SQLite/PostgreSQL/SQL Server）
 *   选择数据库类型后自动显示对应参数并可一键填充默认值
 * - 列聚合统计（平均值/最大值/最小值/求和/计数/标准差等）
 */
const DataUploadView = {
  name: "DataUploadView",
  components: { FileUpload },
  template: `
    <div>
      <div class="card">
        <div class="card-title">数据接入</div>
        <p class="card-desc">选择数据来源：上传 CSV/Excel/JSON 文件、连接本地结构化数据库，或一键生成模拟数据体验完整流程。支持对任意列执行平均值、最大值等聚合统计。</p>
        <div class="flex gap-2" style="flex-wrap:wrap;">
          <button class="btn" :class="{ 'btn-outline': mode!=='upload' }" @click="mode='upload'">📁 文件上传</button>
          <button class="btn" :class="{ 'btn-outline': mode!=='mock' }" @click="mode='mock'">🎲 生成模拟数据</button>
          <button class="btn" :class="{ 'btn-outline': mode!=='db' }" @click="mode='db'">🗄️ 连接数据库</button>
          <button class="btn" :class="{ 'btn-outline': mode!=='stats' }" @click="mode='stats'">📊 聚合统计</button>
        </div>
      </div>

      <!-- 文件上传 -->
      <div v-if="mode==='upload'" class="grid grid-2">
        <file-upload role="train" label="训练数据" @uploaded="onUploaded" />
        <file-upload role="test" label="测试数据（可选）" @uploaded="onUploaded" />
      </div>

      <!-- 模拟数据 -->
      <div v-if="mode==='mock'" class="card">
        <div class="card-title">生成模拟股票数据</div>
        <div class="grid grid-3">
          <div class="form-group">
            <label class="form-label">数据天数</label>
            <input class="form-control" type="number" v-model.number="mockParams.days" min="30" max="2000" />
          </div>
          <div class="form-group">
            <label class="form-label">波动率</label>
            <input class="form-control" type="number" step="0.005" v-model.number="mockParams.volatility" min="0.005" max="0.1" />
          </div>
          <div class="form-group">
            <label class="form-label">随机种子</label>
            <input class="form-control" type="number" v-model.number="mockParams.seed" />
          </div>
        </div>
        <button class="btn btn-success" @click="generate" :disabled="loading">
          {{ loading ? '生成中...' : '一键生成' }}
        </button>
        <div v-if="mockResult" class="alert alert-success mt-2">
          模拟数据生成成功！训练集 {{ mockResult.train?.rows }} 行，测试集 {{ mockResult.test?.rows }} 行。
        </div>
      </div>

      <!-- ============ 数据库连接 ============ -->
      <div v-if="mode==='db'">

        <!-- 第一步：选择数据库类型 -->
        <div class="card">
          <div class="card-title">第 1 步：选择数据库类型</div>
          <p class="card-desc">选择您本地安装的结构化数据库类型，系统将自动显示对应的连接参数。</p>

          <div class="grid grid-4">
            <div v-for="db in dbTypes" :key="db.id"
                 class="db-type-card"
                 :class="{ active: dbConfig.db_type === db.id }"
                 @click="selectDbType(db.id)">
              <div class="db-icon">{{ db.icon }}</div>
              <div class="db-name">{{ db.name }}</div>
              <div class="db-desc text-muted">{{ db.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 第二步：填写连接参数 -->
        <div class="card">
          <div class="card-title">第 2 步：填写连接参数 — {{ currentDbName }}</div>

          <!-- 快捷填充按钮 -->
          <div class="flex gap-1 mb-2" style="flex-wrap:wrap;">
            <button class="btn btn-outline" style="padding:0.35rem 0.8rem;font-size:0.82rem;"
              @click="fillDefaultParams">⚡ 一键填充默认参数</button>
            <button class="btn btn-outline" style="padding:0.35rem 0.8rem;font-size:0.82rem;"
              @click="clearDbParams">🗑️ 清空参数</button>
            <button class="btn btn-outline" style="padding:0.35rem 0.8rem;font-size:0.82rem;"
              @click="saveConfig">💾 保存配置</button>
            <button class="btn btn-outline" style="padding:0.35rem 0.8rem;font-size:0.82rem;"
              @click="loadSavedConfig">📂 加载已保存配置</button>
          </div>

          <!-- 参数表单（根据数据库类型动态显示） -->
          <div class="grid grid-3">
            <!-- SQLite 只需文件路径 -->
            <div class="form-group" v-if="dbConfig.db_type==='sqlite'">
              <label class="form-label">📁 SQLite 数据库文件路径 *</label>
              <input class="form-control" v-model="dbConfig.database"
                placeholder="如：data/ai_zhigu.db 或 C:/data/my.db" />
              <small class="text-muted" style="font-size:0.75rem;">输入本地 .db 文件的相对或绝对路径</small>
            </div>

            <!-- MySQL / PostgreSQL / SQL Server 参数 -->
            <div class="form-group" v-if="dbConfig.db_type!=='sqlite'">
              <label class="form-label">🌐 主机地址 (Host) *</label>
              <input class="form-control" v-model="dbConfig.host" placeholder="127.0.0.1" />
            </div>
            <div class="form-group" v-if="dbConfig.db_type!=='sqlite'">
              <label class="form-label">🔌 端口 (Port) *</label>
              <input class="form-control" type="number" v-model.number="dbConfig.port" />
              <small class="text-muted" style="font-size:0.75rem;">默认端口：{{ defaultPort }}</small>
            </div>
            <div class="form-group" v-if="dbConfig.db_type!=='sqlite'">
              <label class="form-label">👤 用户名 (User) *</label>
              <input class="form-control" v-model="dbConfig.user" placeholder="root" />
            </div>
            <div class="form-group" v-if="dbConfig.db_type!=='sqlite'">
              <label class="form-label">🔑 密码 (Password)</label>
              <input class="form-control" type="password" v-model="dbConfig.password" placeholder="留空表示无密码" />
            </div>
            <div class="form-group" v-if="dbConfig.db_type!=='sqlite'">
              <label class="form-label">🗄️ 数据库名 (Database) *</label>
              <input class="form-control" v-model="dbConfig.database" placeholder="ai_zhigu" />
            </div>
            <div class="form-group" v-if="dbConfig.db_type==='postgresql'">
              <label class="form-label">📋 Schema</label>
              <input class="form-control" v-model="dbConfig.schema" placeholder="public" />
            </div>
          </div>

          <!-- 连接按钮 -->
          <div class="flex gap-1" style="flex-wrap:wrap;">
            <button class="btn btn-success" @click="testConnect" :disabled="loading">
              🔌 {{ loading ? '连接中...' : '测试连接' }}
            </button>
            <button class="btn btn-outline" @click="loadTables" :disabled="!connected">🔄 刷新表列表</button>
          </div>

          <div v-if="connectMsg" :class="['alert','mt-2', connectOk?'alert-success':'alert-error']">
            {{ connectMsg }}
          </div>
        </div>

        <!-- 第三步：浏览表与数据 -->
        <div v-if="connected && tables.length" class="grid grid-2">
          <div class="card">
            <div class="card-title">数据库表 ({{ tables.length }})</div>
            <div class="form-group">
              <input class="form-control" v-model="tableFilter" placeholder="🔍 筛选表名..." />
            </div>
            <div style="max-height:360px;overflow:auto;">
              <table class="table">
                <thead><tr><th>表名</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="t in filteredTables" :key="t">
                    <td>{{ t }}</td>
                    <td>
                      <button class="btn btn-outline" style="padding:0.2rem 0.6rem;font-size:0.78rem;"
                        @click="selectTable(t)" :disabled="loading">查看</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card" v-if="selectedTable">
            <div class="card-title">表结构：{{ selectedTable }}</div>
            <table class="table">
              <thead><tr><th>字段</th><th>类型</th><th>可空</th><th>主键</th></tr></thead>
              <tbody>
                <tr v-for="c in schema" :key="c.name">
                  <td><strong>{{ c.name }}</strong></td>
                  <td class="text-muted">{{ c.type }}</td>
                  <td>{{ c.nullable ? '是' : '否' }}</td>
                  <td>{{ c.primary_key ? '✓' : '' }}</td>
                </tr>
              </tbody>
            </table>
            <button class="btn btn-outline mt-2" @click="previewTable" :disabled="loading">预览前 10 行</button>

            <div v-if="tablePreview" class="mt-2">
              <div class="text-muted mb-2">共 {{ tablePreview.rows.length }} 行</div>
              <div style="overflow:auto;">
                <table class="table">
                  <thead><tr><th v-for="c in tablePreview.columns" :key="c">{{ c }}</th></tr></thead>
                  <tbody>
                    <tr v-for="(row,i) in tablePreview.rows" :key="i">
                      <td v-for="c in tablePreview.columns" :key="c">{{ row[c] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- SQL 查询 -->
        <div v-if="connected" class="card">
          <div class="card-title">SQL 查询</div>
          <div class="form-group">
            <textarea class="form-control" rows="4" v-model="sql"
              placeholder="SELECT date, close FROM stock_daily ORDER BY date LIMIT 500"></textarea>
          </div>
          <button class="btn" @click="queryDB" :disabled="loading">{{ loading ? '查询中...' : '执行查询' }}</button>
          <div v-if="dbResult" class="mt-2">
            <div class="text-muted mb-2">共 {{ dbResult.rows.length }} 行 · {{ dbResult.columns.length }} 列</div>
            <div style="overflow:auto;">
              <table class="table">
                <thead><tr><th v-for="c in dbResult.columns" :key="c">{{ c }}</th></tr></thead>
                <tbody>
                  <tr v-for="(row,i) in dbResult.rows.slice(0,50)" :key="i">
                    <td v-for="c in dbResult.columns" :key="c">{{ row[c] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 聚合统计 -->
      <div v-if="mode==='stats'" class="card">
        <div class="card-title">列聚合统计</div>
        <p class="card-desc">对数据文件或数据库表的指定列一键计算平均值、最大值、最小值、求和、计数、标准差等统计指标。</p>

        <div class="form-group">
          <label class="form-label">数据来源</label>
          <select class="form-control" v-model="statsSource">
            <option value="file">数据文件（已上传）</option>
            <option value="db">数据库表（需先连接）</option>
          </select>
        </div>

        <div v-if="statsSource==='file'" class="form-group">
          <label class="form-label">选择文件</label>
          <select class="form-control" v-model="statsFilePath">
            <option value="">请选择...</option>
            <option v-if="trainPath" :value="trainPath">训练数据 ({{ fileName(trainPath) }})</option>
            <option v-if="testPath" :value="testPath">测试数据 ({{ fileName(testPath) }})</option>
          </select>
        </div>

        <div v-if="statsSource==='db'">
          <div v-if="!connected" class="alert alert-info">请先在"连接数据库"标签页完成数据库连接。</div>
          <div v-else class="form-group">
            <label class="form-label">选择表</label>
            <select class="form-control" v-model="statsTable">
              <option value="">请选择...</option>
              <option v-for="t in tables" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="form-group" v-if="availableColumns.length">
          <label class="form-label">选择要统计的列（可多选）</label>
          <div class="flex gap-1" style="flex-wrap:wrap;">
            <label v-for="c in availableColumns" :key="c"
                   style="padding:0.3rem 0.7rem;border:1px solid var(--rule);border-radius:6px;cursor:pointer;font-size:0.85rem;">
              <input type="checkbox" :value="c" v-model="statsColumns" style="margin-right:0.3rem;" />{{ c }}
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">选择统计指标</label>
          <div class="flex gap-1" style="flex-wrap:wrap;">
            <label v-for="f in aggFuncOptions" :key="f.id"
                   style="padding:0.3rem 0.7rem;border:1px solid var(--rule);border-radius:6px;cursor:pointer;font-size:0.85rem;">
              <input type="checkbox" :value="f.id" v-model="statsAggFuncs" style="margin-right:0.3rem;" />{{ f.name }}
            </label>
          </div>
        </div>

        <button class="btn btn-success" @click="runAggregate" :disabled="loading || !canRunStats">
          {{ loading ? '计算中...' : '一键统计' }}
        </button>

        <div v-if="statsResult" class="mt-3">
          <div class="card-title">统计结果</div>
          <div style="overflow:auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>列名</th>
                  <th v-for="fn in statsAggFuncs" :key="fn">{{ aggName(fn) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stats,col) in statsResult" :key="col">
                  <td><strong>{{ col }}</strong></td>
                  <td v-for="fn in statsAggFuncs" :key="fn">{{ formatNum(stats[fn]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 当前数据状态 -->
      <div class="card" v-if="trainPath || testPath">
        <div class="card-title">当前数据集</div>
        <div class="grid grid-2">
          <div>
            <strong>训练数据：</strong>
            <span v-if="trainPath" class="tag tag-accent">已就绪</span>
            <span v-else class="text-muted">未上传</span>
          </div>
          <div>
            <strong>测试数据：</strong>
            <span v-if="testPath" class="tag tag-accent">已就绪</span>
            <span v-else class="text-muted">未上传</span>
          </div>
        </div>
        <div class="mt-2">
          <router-link to="/train" class="btn">前往模型训练 →</router-link>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      mode: "upload",
      trainPath: null,
      testPath: null,
      loading: false,
      // 模拟数据
      mockParams: { days: 365, volatility: 0.02, seed: 42 },
      mockResult: null,
      // 数据库类型列表
      dbTypes: [
        { id: "mysql", name: "MySQL", icon: "🐬", desc: "最流行的开源数据库", defaultPort: 3306 },
        { id: "postgresql", name: "PostgreSQL", icon: "🐘", desc: "功能强大的对象关系数据库", defaultPort: 5432 },
        { id: "sqlite", name: "SQLite", icon: "📦", desc: "轻量级本地文件数据库", defaultPort: null },
        { id: "sqlserver", name: "SQL Server", icon: "🟦", desc: "微软企业级数据库", defaultPort: 1433 },
      ],
      // 数据库连接配置
      dbConfig: { db_type: "mysql", host: "127.0.0.1", port: 3306,
                  user: "root", password: "", database: "ai_zhigu", schema: "public" },
      connected: false,
      connectMsg: "",
      connectOk: false,
      tables: [],
      tableFilter: "",
      selectedTable: "",
      schema: [],
      tablePreview: null,
      sql: "SELECT date, close FROM stock_daily ORDER BY date LIMIT 500",
      dbResult: null,
      // 聚合统计
      statsSource: "file",
      statsFilePath: "",
      statsTable: "",
      statsColumns: [],
      statsAggFuncs: ["avg", "max", "min"],
      statsResult: null,
      fileColumns: {},
      aggFuncOptions: [
        { id: "avg", name: "平均值" },
        { id: "max", name: "最大值" },
        { id: "min", name: "最小值" },
        { id: "sum", name: "求和" },
        { id: "count", name: "计数" },
        { id: "std", name: "标准差" },
        { id: "median", name: "中位数" },
        { id: "var", name: "方差" },
      ],
    };
  },
  computed: {
    trainPath() { return this.$root.trainPath; },
    testPath() { return this.$root.testPath; },
    currentDbName() {
      const db = this.dbTypes.find(d => d.id === this.dbConfig.db_type);
      return db ? db.name : "";
    },
    defaultPort() {
      const db = this.dbTypes.find(d => d.id === this.dbConfig.db_type);
      return db ? db.defaultPort : "";
    },
    filteredTables() {
      if (!this.tableFilter) return this.tables;
      return this.tables.filter(t =>
        t.toLowerCase().includes(this.tableFilter.toLowerCase())
      );
    },
    availableColumns() {
      if (this.statsSource === "db" && this.selectedTable) {
        return this.schema.map((c) => c.name);
      }
      if (this.statsSource === "file" && this.statsFilePath) {
        return this.fileColumns[this.statsFilePath] || [];
      }
      return [];
    },
    canRunStats() {
      if (this.statsSource === "file") return this.statsFilePath && this.statsColumns.length;
      if (this.statsSource === "db") return this.connected && this.statsTable && this.statsColumns.length;
      return false;
    },
  },
  watch: {
    "statsTable"(v) {
      if (v) this.loadSchemaForStats(v);
    },
    "statsFilePath"(v) {
      if (v && !this.fileColumns[v]) this.loadFileColumns(v);
    },
  },
  methods: {
    fileName(path) {
      if (!path) return "";
      return path.split("\\").pop().split("/").pop();
    },
    onUploaded({ role, preview }) {
      if (role === "train") {
        this.trainPath = preview.path;
        this.$root.trainPath = preview.path;
        this.fileColumns[preview.path] = preview.columns || [];
      }
      if (role === "test") {
        this.testPath = preview.path;
        this.$root.testPath = preview.path;
        this.fileColumns[preview.path] = preview.columns || [];
      }
    },
    async loadFileColumns(path) {
      try {
        const data = await API.data.preview(path);
        this.fileColumns = { ...this.fileColumns, [path]: data.columns || [] };
      } catch (e) { /* 静默 */ }
    },
    async generate() {
      this.loading = true;
      try {
        this.mockResult = await API.data.generate(this.mockParams);
        this.trainPath = this.mockResult.train.path;
        this.testPath = this.mockResult.test.path;
        this.$root.trainPath = this.trainPath;
        this.$root.testPath = this.testPath;
      } catch (e) {
        alert("生成失败: " + e.message);
      } finally {
        this.loading = false;
      }
    },
    // ===== 数据库连接方法 =====
    selectDbType(typeId) {
      this.dbConfig.db_type = typeId;
      // 切换类型时自动设置默认端口
      const db = this.dbTypes.find(d => d.id === typeId);
      if (db && db.defaultPort) {
        this.dbConfig.port = db.defaultPort;
      }
      // 重置连接状态
      this.connected = false;
      this.connectMsg = "";
      this.tables = [];
      this.selectedTable = "";
      this.schema = [];
    },
    fillDefaultParams() {
      const db = this.dbTypes.find(d => d.id === this.dbConfig.db_type);
      if (this.dbConfig.db_type === "sqlite") {
        this.dbConfig.database = "data/ai_zhigu.db";
      } else if (this.dbConfig.db_type === "mysql") {
        this.dbConfig.host = "127.0.0.1";
        this.dbConfig.port = 3306;
        this.dbConfig.user = "root";
        this.dbConfig.password = "";
        this.dbConfig.database = "ai_zhigu";
      } else if (this.dbConfig.db_type === "postgresql") {
        this.dbConfig.host = "127.0.0.1";
        this.dbConfig.port = 5432;
        this.dbConfig.user = "postgres";
        this.dbConfig.password = "";
        this.dbConfig.database = "ai_zhigu";
        this.dbConfig.schema = "public";
      } else if (this.dbConfig.db_type === "sqlserver") {
        this.dbConfig.host = "127.0.0.1";
        this.dbConfig.port = 1433;
        this.dbConfig.user = "sa";
        this.dbConfig.password = "";
        this.dbConfig.database = "ai_zhigu";
      }
    },
    clearDbParams() {
      this.dbConfig.host = "";
      this.dbConfig.port = this.defaultPort || "";
      this.dbConfig.user = "";
      this.dbConfig.password = "";
      this.dbConfig.database = "";
      this.dbConfig.schema = "public";
    },
    saveConfig() {
      localStorage.setItem("ai_zhigu_db_config", JSON.stringify({ ...this.dbConfig }));
      alert("✅ 连接配置已保存到本地浏览器，下次可直接加载。");
    },
    loadSavedConfig() {
      const saved = localStorage.getItem("ai_zhigu_db_config");
      if (saved) {
        try {
          const cfg = JSON.parse(saved);
          Object.assign(this.dbConfig, cfg);
          alert("✅ 已加载保存的配置。");
        } catch (e) {
          alert("❌ 配置文件损坏，无法加载。");
        }
      } else {
        alert("⚠️ 没有找到已保存的配置。");
      }
    },
    buildConnPayload(extra = {}) {
      return { ...this.dbConfig, ...extra };
    },
    async testConnect() {
      this.loading = true;
      this.connectMsg = "";
      try {
        const data = await API.data.dbConnect(this.buildConnPayload());
        this.connected = true;
        this.connectOk = true;
        this.tables = data.tables || [];
        this.connectMsg = `✅ 连接成功！共发现 ${this.tables.length} 张表。`;
      } catch (e) {
        this.connected = false;
        this.connectOk = false;
        this.connectMsg = "❌ 连接失败: " + e.message;
      } finally {
        this.loading = false;
      }
    },
    async loadTables() {
      this.loading = true;
      try {
        const data = await API.data.dbTables(this.buildConnPayload());
        this.tables = data.tables || [];
      } catch (e) {
        alert("获取表列表失败: " + e.message);
      } finally {
        this.loading = false;
      }
    },
    async selectTable(t) {
      this.selectedTable = t;
      this.loading = true;
      try {
        const data = await API.data.dbSchema(this.buildConnPayload({ table: t }));
        this.schema = data.columns || [];
      } catch (e) {
        alert("获取表结构失败: " + e.message);
      } finally {
        this.loading = false;
      }
    },
    async previewTable() {
      this.loading = true;
      try {
        this.tablePreview = await API.data.dbPreview(
          this.buildConnPayload({ table: this.selectedTable, limit: 10 })
        );
      } catch (e) {
        alert("预览失败: " + e.message);
      } finally {
        this.loading = false;
      }
    },
    async queryDB() {
      this.loading = true;
      try {
        this.dbResult = await API.data.dbQuery(this.buildConnPayload({ sql: this.sql }));
      } catch (e) {
        alert("查询失败: " + e.message);
      } finally {
        this.loading = false;
      }
    },
    // 聚合统计
    async loadSchemaForStats(t) {
      try {
        const data = await API.data.dbSchema(this.buildConnPayload({ table: t }));
        this.schema = data.columns || [];
      } catch (e) { /* 静默 */ }
    },
    async runAggregate() {
      this.loading = true;
      this.statsResult = null;
      try {
        let payload, data;
        if (this.statsSource === "file") {
          payload = {
            path: this.statsFilePath,
            columns: this.statsColumns,
            agg_funcs: this.statsAggFuncs,
          };
          data = await API.data.fileAggregate(payload);
        } else {
          payload = this.buildConnPayload({
            table: this.statsTable,
            columns: this.statsColumns,
            agg_funcs: this.statsAggFuncs,
          });
          data = await API.data.dbAggregate(payload);
        }
        this.statsResult = data.stats;
      } catch (e) {
        alert("统计失败: " + e.message);
      } finally {
        this.loading = false;
      }
    },
    aggName(fn) {
      const m = { avg: "平均值", max: "最大值", min: "最小值", sum: "求和",
                  count: "计数", std: "标准差", median: "中位数", var: "方差" };
      return m[fn] || fn;
    },
    formatNum(v) {
      if (v === null || v === undefined) return "-";
      if (typeof v !== "number") return v;
      return Math.abs(v) >= 1000 ? v.toFixed(2) : v.toFixed(4);
    },
  },
  mounted() {
    // 尝试恢复保存的配置
    const saved = localStorage.getItem("ai_zhigu_db_config");
    if (saved) {
      try {
        Object.assign(this.dbConfig, JSON.parse(saved));
      } catch (e) {}
    }
  },
};

window.DataUploadView = DataUploadView;
