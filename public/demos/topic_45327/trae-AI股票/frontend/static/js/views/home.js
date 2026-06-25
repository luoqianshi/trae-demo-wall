/**
 * 首页视图 - 产品介绍 + 数据库连接 + 免责声明
 * 用户打开主网页最直接看到的页面
 */
const HomeView = {
  name: "HomeView",
  template: `
    <div>
      <!-- 顶部 Hero -->
      <div class="card" style="background:linear-gradient(135deg,#1e3a8a,#312e81,#581c87);color:#fff;border:none;">
        <h1 style="font-size:2rem;margin-bottom:0.5rem;">AI <span style="color:#a78bfa;">智股</span></h1>
        <p style="color:rgba(255,255,255,0.8);">智能股票预测与交互式可视化平台</p>
        <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:0.5rem;">
          零代码、可交互的 AI 股票预测工具 —— 连接数据库、上传数据、点击按钮，即可完成深度学习建模与可视化分析
        </p>
      </div>

      <!-- ============ 免责声明（首页顶部醒目展示） ============ -->
      <div class="card" style="border-left:4px solid #f59e0b;background:#fffbeb;">
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <span style="font-size:1.5rem;">⚠️</span>
          <div style="flex:1;">
            <strong style="color:#b45309;font-size:1rem;">免责声明</strong>
            <p style="color:#92400e;font-size:0.88rem;margin-top:0.3rem;line-height:1.7;">
              本项目仅面向金融类、大数据技术等专业学生用于学习使用，预测结果仅为模拟参考，不构成投资建议，请慎重考虑。
            </p>
            <router-link to="/disclaimer" style="color:#b45309;font-size:0.82rem;text-decoration:underline;">查看完整声明 →</router-link>
          </div>
        </div>
      </div>

      <!-- ============ 连接本地结构化数据库 ============ -->
      <div class="card">
        <div class="card-title">🗄️ 连接本地结构化数据库</div>
        <p class="card-desc">
          选择您本地安装的结构化数据库类型，填写连接参数即可一键连接到您自己的数据库，浏览表结构、预览数据、执行 SQL 查询。
        </p>

        <!-- 第 1 步：选择数据库类型 -->
        <div class="form-label" style="margin-bottom:0.75rem;">第 1 步：选择数据库类型</div>
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

        <!-- 第 2 步：填写连接参数 -->
        <div class="form-label" style="margin:1.25rem 0 0.75rem;">第 2 步：填写连接参数 — {{ currentDbName }}</div>

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

      <!-- 连接成功后：浏览表与数据 -->
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

      <!-- 功能特性 -->
      <div class="grid grid-3" style="margin-top:1.25rem;">
        <div class="card" v-for="f in features" :key="f.title">
          <div style="font-size:1.8rem;">{{ f.icon }}</div>
          <h3 style="margin:0.5rem 0;color:var(--ink);">{{ f.title }}</h3>
          <p class="text-muted" style="font-size:0.85rem;">{{ f.desc }}</p>
        </div>
      </div>

      <!-- 使用流程 -->
      <div class="card">
        <div class="card-title">使用流程</div>
        <div class="grid grid-4">
          <div v-for="(s,i) in steps" :key="i" class="text-center">
            <div style="font-size:1.5rem;font-weight:700;color:var(--accent);">{{ i+1 }}</div>
            <div style="font-weight:600;margin:0.3rem 0;">{{ s.title }}</div>
            <div class="text-muted" style="font-size:0.8rem;">{{ s.desc }}</div>
          </div>
        </div>
        <div class="mt-2 text-center">
          <router-link to="/data" class="btn">前往数据接入 →</router-link>
          <router-link to="/train" class="btn btn-outline" style="margin-left:0.5rem;">模型训练 →</router-link>
        </div>
      </div>

      <!-- ============ 免责声明（首页底部再次强调） ============ -->
      <div class="card" style="border-left:4px solid #f59e0b;background:#fffbeb;margin-top:1.25rem;">
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <span style="font-size:1.5rem;">⚠️</span>
          <div style="flex:1;">
            <strong style="color:#b45309;font-size:1rem;">再次提醒 · 免责声明</strong>
            <p style="color:#92400e;font-size:0.88rem;margin-top:0.3rem;line-height:1.7;">
              本项目仅面向金融类、大数据技术等专业学生用于学习使用，预测结果仅为模拟参考，不构成投资建议，请慎重考虑。
            </p>
            <p style="color:#92400e;font-size:0.8rem;margin-top:0.5rem;">
              股票投资有风险，入市需谨慎。本平台所有内容不构成任何形式的投资建议，因使用本平台内容而产生的任何直接或间接损失，本项目及开发者不承担任何责任。
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: false,
      // 数据库类型列表
      dbTypes: [
        { id: "mysql", name: "MySQL", icon: "🐬", desc: "最流行的开源数据库", defaultPort: 3306 },
        { id: "postgresql", name: "PostgreSQL", icon: "🐘", desc: "功能强大的对象关系数据库", defaultPort: 5432 },
        { id: "sqlite", name: "SQLite", icon: "📦", desc: "轻量级本地文件数据库", defaultPort: null },
        { id: "sqlserver", name: "SQL Server", icon: "🟦", desc: "微软企业级数据库", defaultPort: 1433 },
      ],
      // 数据库连接配置
      dbConfig: {
        db_type: "mysql", host: "127.0.0.1", port: 3306,
        user: "root", password: "", database: "ai_zhigu", schema: "public",
      },
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
      // 功能介绍
      features: [
        { icon: "📊", title: "数据接入", desc: "支持 CSV/Excel/JSON 上传、数据库连接、一键生成模拟数据" },
        { icon: "🤖", title: "模型体系", desc: "线性回归、随机森林、LSTM、GRU、Bi-LSTM、Attention 全覆盖" },
        { icon: "📈", title: "交互式可视化", desc: "走势叠加、误差分布、Attention 热力图、多模型对比" },
        { icon: "⚙️", title: "参数调节", desc: "6 项核心参数可视化调节，内置 3 套预设模板" },
        { icon: "⚡", title: "效率提升", desc: "数小时的建模流程压缩到几分钟内完成" },
        { icon: "🎯", title: "零代码", desc: "无需编程，上传数据点击按钮即可得到专业预测" },
      ],
      steps: [
        { title: "接入数据", desc: "连接数据库或上传文件" },
        { title: "选择模型", desc: "从传统 ML 到深度学习" },
        { title: "调节参数", desc: "使用预设或自定义参数" },
        { title: "可视化分析", desc: "查看预测与评估结果" },
      ],
    };
  },
  computed: {
    currentDbName() {
      const db = this.dbTypes.find((d) => d.id === this.dbConfig.db_type);
      return db ? db.name : "";
    },
    defaultPort() {
      const db = this.dbTypes.find((d) => d.id === this.dbConfig.db_type);
      return db ? db.defaultPort : "";
    },
    filteredTables() {
      if (!this.tableFilter) return this.tables;
      return this.tables.filter((t) =>
        t.toLowerCase().includes(this.tableFilter.toLowerCase())
      );
    },
  },
  methods: {
    // ===== 数据库连接方法 =====
    selectDbType(typeId) {
      this.dbConfig.db_type = typeId;
      // 切换类型时自动设置默认端口
      const db = this.dbTypes.find((d) => d.id === typeId);
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
          Object.assign(this.dbConfig, JSON.parse(saved));
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

window.HomeView = HomeView;
