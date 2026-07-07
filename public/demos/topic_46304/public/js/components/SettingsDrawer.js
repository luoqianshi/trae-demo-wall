/* ============================================================
 * 设置抽屉组件 - 三Tab架构
 *
 * Tab 1: 模型管理 (多模型 CRUD + 能力标签 + 深度思考 + 设默认)
 * Tab 2: 写作参数 (8 组参数 + 约束框架配置)
 * Tab 3: 作者画像 (风格分析 + 画像注入)
 *
 * 为什么拆分三 Tab：
 *   参考项目 settings.html + writing_settings.html 分离了模型管理和写作参数，
 *   单页信息量过大导致用户迷失，Tab 分页让每个任务聚焦。
 * ============================================================ */
const SettingsDrawer = {
  name: 'SettingsDrawer',
  data(){
    return {
      // 当前激活的 Tab
      activeTab: 'models',

      // ===== Tab 1: 概览 =====
      mode: 'api',
      base: '',
      key: '',
      model: '',
      testing: false,
      testResult: { show:false, ok:false, msg:'' },

      // ===== Tab 2: 模型管理 =====
      showModelForm: false,
      editingModelId: null,
      modelForm: {
        name: '', apiUrl: '', apiKey: '', modelName: '',
        maxTokens: 8192, temperature: 0.8, isDefault: false,
        capCreative: false, capStructured: false, capSynopsis: false,
        thinkingEnabled: false,
      },
      modelTesting: false,
      modelTestResult: { show:false, ok:false, msg:'' },
      testModelId: '',

      // ===== Tab 3: 写作参数 =====
      // 直接引用 store.writingParams，v-model 双向绑定
      wp: null,
      cc: null,
      // 卡片折叠状态：{ key: true } 表示已折叠
      wpCollapsed: {},
      // 是否已初始化过折叠状态
      wpCollapsedInited: false,

      // 重写模式预设
      rewriteModes: [
        { val:'conservative', name:'保守模式', desc:'1轮迭代，Token消耗最低', config:{ rewriteMaxIterations:1, rewriteThreshold:80, rewriteMinGain:15, rewriteTargetScore:85 } },
        { val:'balanced', name:'均衡模式', desc:'3轮迭代，性价比最优', config:{ rewriteMaxIterations:3, rewriteThreshold:70, rewriteMinGain:10, rewriteTargetScore:80 } },
        { val:'aggressive', name:'深度优化', desc:'5轮迭代，追求极致质量', config:{ rewriteMaxIterations:5, rewriteThreshold:60, rewriteMinGain:5, rewriteTargetScore:90 } },
        { val:'fast', name:'快速提升', desc:'2轮迭代，快速批量优化', config:{ rewriteMaxIterations:2, rewriteThreshold:65, rewriteMinGain:8, rewriteTargetScore:75 } },
      ],
      // ===== Tab 4: 作者画像（P2-1）=====
      profileEnabled: false,
      analyzing: false,
      profileData: null,
    };
  },
  computed: {
    isOpen(){ return store.drawerOpen; },
    presets(){ return CONST.PRESETS; },
    models(){ return store.models; },
    modelCount(){ return store.models.length; },
    defaultModelId(){ return store.defaultModelId; },
    defaultModel(){
      if(!store.models || store.models.length === 0) return null;
      const dm = store.models.find(m => m.id === store.defaultModelId);
      return dm || store.models[0];
    },
  },
  watch: {
    isOpen(val){
      if(val) this.syncFromStore();
    },
    // 填写 API 字段时自动切换到 API 模式
    base(){ if(this.base && this.mode !== 'api') this.mode = 'api'; },
    key(){ if(this.key && this.mode !== 'api') this.mode = 'api'; },
    model(){ if(this.model && this.mode !== 'api') this.mode = 'api'; },
    // P2-1: 同步画像启用状态
    profileEnabled(val){ AuthorProfile.enabled = val; },
  },
  template: `
  <div>
    <div class="drawer-mask" :class="{open: isOpen}" @click="close"></div>
    <aside class="drawer" :class="{open: isOpen}">
      <div class="drawer-head">
        <h3>设置</h3>
        <div class="drawer-head-actions">
          <button class="head-icon-btn" title="导出配置" @click="exportConfig">
            <app-icon name="download" :size="16" />
          </button>
          <button class="head-icon-btn" title="导入配置" @click="$refs.fileInput.click()">
            <app-icon name="upload" :size="16" />
          </button>
          <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importConfig">
          <select class="mode-select" v-model="mode" @change="onModeChange" title="选择生成模式">
            <option value="api">真实 API</option>
            <option value="mock">模拟模式</option>
          </select>
          <div class="drawer-close" @click="close"><app-icon name="x" :size="20" /></div>
        </div>
      </div>
      <div class="drawer-body">

        <!-- ===== Tab 导航 ===== -->
        <div class="drawer-tabs">
          <button class="drawer-tab" :class="{active: activeTab==='models'}" @click="activeTab='models'">
            <app-icon name="cpu" :size="14" /> 模型管理
            <span v-if="modelCount > 0" class="tab-badge">{{ modelCount }}</span>
          </button>
          <button class="drawer-tab" :class="{active: activeTab==='writing'}" @click="activeTab='writing'">
            <app-icon name="sliders" :size="14" /> 写作参数
          </button>
          <button class="drawer-tab" :class="{active: activeTab==='profile'}" @click="activeTab='profile'">
            <app-icon name="user" :size="14" /> 作者画像
          </button>
        </div>

        <!-- ===== Tab 1: 模型管理 ===== -->
        <div v-if="activeTab==='models'">
          <!-- 已配置模型列表 -->
          <div v-if="models.length > 0" class="model-list">
            <div v-for="m in models" :key="m.id" class="model-item" :class="{default: m.id === defaultModelId}">
              <div class="model-item-head">
                <div>
                  <div class="model-item-name">
                    <span v-if="m.id === defaultModelId" class="default-star"><app-icon name="star" :size="14" /></span>
                    {{ m.name || m.modelName }}
                  </div>
                  <div class="model-item-meta">
                    {{ m.apiUrl }}<br>
                    模型: {{ m.modelName }} | MaxTokens: {{ m.maxTokens }} | Temp: {{ m.temperature }}
                  </div>
                  <div v-if="m.capCreative || m.capStructured || m.capSynopsis || m.thinkingEnabled" class="model-item-caps">
                    <span v-if="m.capCreative" class="cap-badge creative">creative</span>
                    <span v-if="m.capStructured" class="cap-badge structured">structured</span>
                    <span v-if="m.capSynopsis" class="cap-badge synopsis">synopsis</span>
                    <span v-if="m.thinkingEnabled" class="cap-badge thinking">thinking</span>
                  </div>
                </div>
                <div class="model-item-actions">
                  <button v-if="m.id !== defaultModelId" class="model-action-btn" title="设为默认" @click="setDefault(m.id)">
                    <app-icon name="star" :size="14" />
                  </button>
                  <button class="model-action-btn" title="编辑" @click="editModel(m.id)">
                    <app-icon name="edit-2" :size="14" />
                  </button>
                  <button class="model-action-btn danger" title="删除" @click="deleteModel(m.id)">
                    <app-icon name="trash-2" :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-state" style="padding:2rem 1rem">
            <div class="icon"><app-icon name="cpu" :size="36" /></div>
            <p style="font-size:0.85rem;margin-top:0.5rem">尚未添加模型</p>
            <p style="font-size:0.78rem">点击下方按钮添加您的 AI 模型</p>
          </div>

          <!-- 添加/编辑表单 -->
          <div v-if="showModelForm" class="model-form">
            <div class="model-form-title">{{ editingModelId ? '编辑模型' : '添加模型' }}</div>

            <!-- 预设 -->
            <div style="margin-bottom:0.8rem">
              <div style="font-size:0.78rem;color:var(--warm-gray);margin-bottom:0.4rem">快速选择预设：</div>
              <div class="preset-row">
                <button v-for="(p,k) in presets" :key="k" class="preset-btn" @click="applyModelPreset(k)">{{ p.name }}</button>
              </div>
            </div>

            <div class="form-group">
              <label>模型名称 <span style="color:var(--danger)">*</span></label>
              <input v-model="modelForm.name" placeholder="例：DeepSeek Chat">
            </div>
            <div class="form-group">
              <label>API 地址 <span style="color:var(--danger)">*</span></label>
              <input v-model="modelForm.apiUrl" placeholder="https://api.openai.com/v1">
            </div>
            <div class="form-group">
              <label>API 密钥</label>
              <input v-model="modelForm.apiKey" type="password" placeholder="sk-...">
            </div>
            <div class="form-group">
              <label>模型标识符 <span style="color:var(--danger)">*</span></label>
              <input v-model="modelForm.modelName" placeholder="deepseek-chat / glm-4 / ...">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Max Tokens</label>
                <input v-model.number="modelForm.maxTokens" type="number" min="256" max="131072">
              </div>
              <div class="form-group">
                <label>Temperature</label>
                <input v-model.number="modelForm.temperature" type="number" min="0" max="2" step="0.1">
              </div>
            </div>

            <!-- 深度思考 -->
            <div class="thinking-box">
              <label class="checkbox-item">
                <input type="checkbox" v-model="modelForm.thinkingEnabled">
                <strong style="color:var(--ink)">深度思考 Enable Thinking</strong>
              </label>
              <div style="font-size:0.72rem;color:var(--warm-gray);margin-top:0.3rem;line-height:1.5">
                开启后 AI 会进行深度推理（思维链），提升复杂推理和创作质量，但增加 Token 消耗
              </div>
            </div>

            <!-- 能力标签 -->
            <div class="caps-box">
              <div style="font-size:0.82rem;font-weight:600;margin-bottom:0.4rem;color:var(--ink)">模型能力标签</div>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="modelForm.capCreative">
                  <span class="cap-badge creative">creative</span> 正文写作
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="modelForm.capStructured">
                  <span class="cap-badge structured">structured</span> 结构化任务
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="modelForm.capSynopsis">
                  <span class="cap-badge synopsis">synopsis</span> 章节简介
                </label>
              </div>
            </div>

            <!-- 设为默认 -->
            <label class="checkbox-item" style="margin-top:0.6rem">
              <input type="checkbox" v-model="modelForm.isDefault">
              设为默认模型
            </label>

            <!-- 操作按钮 -->
            <div style="display:flex;gap:0.5rem;margin-top:0.8rem">
              <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center" @click="saveModel">
                {{ editingModelId ? '保存修改' : '添加模型' }}
              </button>
              <button class="btn btn-outline btn-sm" @click="cancelModelForm">取消</button>
            </div>
          </div>

          <!-- 添加模型按钮 -->
          <button v-if="!showModelForm" class="btn btn-outline btn-sm" style="width:100%;justify-content:center" @click="startAddModel">
            <app-icon name="plus" :size="14" /> 添加模型
          </button>

          <!-- 连接测试 -->
          <div v-if="models.length > 0" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--soft-border)">
            <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.4rem">连接测试</label>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <select v-model="testModelId" style="flex:1;padding:0.5rem;border:1px solid var(--soft-border);border-radius:6px;font-size:0.85rem">
                <option value="">选择要测试的模型</option>
                <option v-for="m in models" :key="m.id" :value="m.id">{{ m.name || m.modelName }}</option>
              </select>
              <button class="btn btn-outline btn-sm" @click="testModel" :disabled="modelTesting">
                {{ modelTesting ? '测试中...' : '测试' }}
              </button>
            </div>
            <div class="test-result" :class="{ok: modelTestResult.ok, err: !modelTestResult.ok, hidden: !modelTestResult.show}">
              {{ modelTestResult.msg }}
            </div>
          </div>
        </div>

        <!-- ===== Tab 2: 写作参数 ===== -->
        <div v-if="activeTab==='writing' && wp">
          <!-- 1. 基础生成参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('basic')">
              <app-icon name="sliders" :size="14" /> 基础生成参数
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.basic}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.basic}">
            <div class="wp-field">
              <div class="wp-field-label"><label>每章目标字数</label><span class="wp-val">{{ wp.chapterWords }}字</span></div>
              <input type="number" v-model.number="wp.chapterWords" min="500" max="5000" step="100">
              <div class="wp-hint">网文常见区间：1500-2500字</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>章节字数容差</label><span class="wp-val">{{ wp.chapterWordTolerance }}字</span></div>
              <input type="number" v-model.number="wp.chapterWordTolerance" min="50" max="500" step="50">
              <div class="wp-hint">允许正文偏离目标字数的范围（固定容差）</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>动态容差比例</label><span class="wp-val">{{ (wp.dynamicToleranceRatio * 100).toFixed(0) }}%</span></div>
              <input type="range" v-model.number="wp.dynamicToleranceRatio" min="0.05" max="0.30" step="0.01">
              <div class="wp-hint">按目标字数比例计算容差，替代固定值，使不同字数章节控制一致</div>
            </div>
            <div class="wp-grid-2">
              <div class="wp-field">
                <div class="wp-field-label"><label>动态容差下限</label></div>
                <input type="number" v-model.number="wp.minTolerance" min="50" max="200" step="10">
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>动态容差上限</label></div>
                <input type="number" v-model.number="wp.maxTolerance" min="200" max="1000" step="50">
              </div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>大纲批量生成数</label><span class="wp-val">{{ wp.outlineBatch }}章</span></div>
              <input type="number" v-model.number="wp.outlineBatch" min="3" max="50" step="1">
              <div class="wp-hint">值越大AI对长程节奏把控越好，但耗时越长</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>大纲批量(1M模式)</label><span class="wp-val">{{ wp.outlineBatch1M }}章</span></div>
              <input type="number" v-model.number="wp.outlineBatch1M" min="10" max="100" step="5">
              <div class="wp-hint">支持1M上下文的模型专用批量数，模型名含[1m]时自动启用</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>自动写作间隔</label><span class="wp-val">{{ wp.autoWriteInterval }}秒</span></div>
              <input type="number" v-model.number="wp.autoWriteInterval" min="1" max="60" step="1">
              <div class="wp-hint">太短可能触发API限流，太长拖慢整体进度</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>上下文模式</label></div>
              <select v-model="wp.contextMode">
                <option value="auto">自动（根据模型选择）</option>
                <option value="compressed">压缩模式（节省token）</option>
                <option value="full">完整模式（需1M上下文）</option>
              </select>
              <div class="wp-hint">压缩模式仅注入摘要，完整模式注入所有历史章节</div>
            </div>
            </div>
          </div>

          <!-- 2. 爽点调度参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('coolpoint')">
              <app-icon name="zap" :size="14" /> 爽点调度参数
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.coolpoint}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.coolpoint}">
            <div class="wp-field">
              <div class="wp-field-label"><label>爽点密度目标值</label><span class="wp-val">{{ wp.coolPointDensityTarget }}</span></div>
              <input type="range" v-model.number="wp.coolPointDensityTarget" min="0.5" max="1.5" step="0.05">
              <div class="wp-hint">参考值0.88，低于0.6读者流失风险高</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>爽点饥饿阈值</label><span class="wp-val">{{ wp.coolPointHungerThreshold }}</span></div>
              <input type="range" v-model.number="wp.coolPointHungerThreshold" min="0.3" max="1.0" step="0.05">
              <div class="wp-hint">值越低同类型爽点出现越频繁</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>双爽点最小间隔</label><span class="wp-val">{{ wp.doubleCoolpointGap }}章</span></div>
              <input type="number" v-model.number="wp.doubleCoolpointGap" min="1" max="10" step="1">
              <div class="wp-hint">防止高潮密度过高导致读者疲劳</div>
            </div>
            </div>
          </div>

          <!-- 3. 章节结构参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('structure')">
              <app-icon name="layout" :size="14" /> 章节结构参数(四段占比%)
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.structure}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.structure}">
            <div class="wp-field">
              <div class="wp-field-label"><label>铺垫段</label><span class="wp-val">{{ wp.segmentRatioSetup }}%</span></div>
              <input type="range" v-model.number="wp.segmentRatioSetup" min="10" max="35" step="5">
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>发展段</label><span class="wp-val">{{ wp.segmentRatioRising }}%</span></div>
              <input type="range" v-model.number="wp.segmentRatioRising" min="20" max="40" step="5">
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>高潮/爽点释放</label><span class="wp-val">{{ wp.segmentRatioClimax }}%</span></div>
              <input type="range" v-model.number="wp.segmentRatioClimax" min="20" max="50" step="5">
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>钩子收尾</label><span class="wp-val">{{ wp.segmentRatioHook }}%</span></div>
              <input type="range" v-model.number="wp.segmentRatioHook" min="5" max="25" step="5">
            </div>
            </div>
          </div>

          <!-- 4. 伏笔与记忆参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('memory')">
              <app-icon name="clock" :size="14" /> 伏笔与记忆参数
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.memory}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.memory}">
            <div class="wp-field">
              <div class="wp-field-label"><label>伏笔唤醒回溯章数</label><span class="wp-val">{{ wp.foreshadowingLookback }}章</span></div>
              <input type="number" v-model.number="wp.foreshadowingLookback" min="3" max="30" step="1">
              <div class="wp-hint">AI回溯多少章内的伏笔进行唤醒/回收</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>上下文记忆回溯章数</label><span class="wp-val">{{ wp.memoryLookback }}章</span></div>
              <input type="number" v-model.number="wp.memoryLookback" min="1" max="15" step="1">
              <div class="wp-hint">值越大上下文越完整，但Token消耗越高</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>语义检索 Top-K</label><span class="wp-val">{{ wp.embeddingTopK }}条</span></div>
              <input type="number" v-model.number="wp.embeddingTopK" min="1" max="20" step="1">
              <div class="wp-hint">通过Embedding语义检索取最相关的记忆条数</div>
            </div>
            </div>
          </div>

          <!-- 5. AI 生成参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('ai')">
              <app-icon name="cpu" :size="14" /> AI 生成参数
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.ai}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.ai}">
            <div class="wp-field">
              <div class="wp-field-label"><label>大纲 Temperature</label><span class="wp-val">{{ wp.temperatureOutline.toFixed(2) }}</span></div>
              <input type="range" v-model.number="wp.temperatureOutline" min="0" max="1" step="0.05">
              <div class="wp-hint">低温度输出更稳定，高温度创意更发散</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>正文 Temperature</label><span class="wp-val">{{ wp.temperatureChapter.toFixed(2) }}</span></div>
              <input type="range" v-model.number="wp.temperatureChapter" min="0.5" max="1.2" step="0.05">
              <div class="wp-hint">爽文推荐0.7-0.9</div>
            </div>
            <div class="wp-grid-2">
              <div class="wp-field">
                <div class="wp-field-label"><label>大纲 MaxTokens</label></div>
                <input type="number" v-model.number="wp.maxTokensOutline" min="1024" max="8192" step="512">
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>正文 MaxTokens</label></div>
                <input type="number" v-model.number="wp.maxTokensChapter" min="2048" max="16384" step="1024">
              </div>
            </div>
            </div>
          </div>

          <!-- 6. 质量检查参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('quality')">
              <app-icon name="shield" :size="14" /> 质量检查参数
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.quality}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.quality}">
            <div class="wp-field">
              <div class="wp-field-label"><label>启用质量检查</label></div>
              <select v-model="wp.qualityCheckEnabled" style="width:auto;min-width:80px">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>质量最低分阈值</label><span class="wp-val">{{ wp.qualityMinScore.toFixed(1) }}分</span></div>
              <input type="range" v-model.number="wp.qualityMinScore" min="1" max="10" step="0.5">
              <div class="wp-hint">低于此值标记为"需优化"</div>
            </div>
            </div>
          </div>

          <!-- 7. 写作质量增强 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('enhance')">
              <app-icon name="eye" :size="14" /> 写作质量增强
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.enhance}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.enhance}">
            <div class="wp-field">
              <div class="wp-field-label"><label>读者视角评分</label></div>
              <select v-model="wp.criticEnabled" style="width:auto;min-width:80px">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
              <div class="wp-hint">五维评分：爽感/代入感/节奏/新鲜感/追读意愿</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>风格守护</label></div>
              <select v-model="wp.styleGuardEnabled" style="width:auto;min-width:80px">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
              <div class="wp-hint">检测章节风格是否偏离基线</div>
            </div>
            <div class="wp-field">
              <div class="wp-field-label"><label>AI痕迹检测</label></div>
              <select v-model="wp.aiPatternsCheckEnabled" style="width:auto;min-width:80px">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
              <div class="wp-hint">检测过度使用排比、空洞抒情等套路化表达</div>
            </div>
            </div>
          </div>

          <!-- 8. 迭代重写参数 -->
          <div class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('rewrite')">
              <app-icon name="refresh-cw" :size="14" /> 迭代重写参数
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.rewrite}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.rewrite}">
            <div class="wp-field">
              <div class="wp-field-label"><label>启用自动迭代重写</label></div>
              <select v-model="wp.rewriteEnabled" style="width:auto;min-width:80px">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
              <div class="wp-hint">章节质量低于阈值时自动多轮迭代改进</div>
            </div>
            <!-- 推荐模式 -->
            <div v-if="wp.rewriteEnabled" style="margin-top:0.5rem">
              <div style="font-size:0.78rem;color:var(--warm-gray);margin-bottom:0.4rem">推荐配置模式：</div>
              <div style="display:flex;flex-wrap:wrap;gap:0.3rem">
                <button v-for="rm in rewriteModes" :key="rm.val"
                  class="preset-btn" @click="applyRewriteMode(rm)">{{ rm.name }}</button>
              </div>
            </div>
            <div v-if="wp.rewriteEnabled">
              <div class="wp-field">
                <div class="wp-field-label"><label>重写触发阈值</label><span class="wp-val">{{ wp.rewriteThreshold }}</span></div>
                <input type="range" v-model.number="wp.rewriteThreshold" min="50" max="100" step="5">
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>最低质量提升</label><span class="wp-val">{{ wp.rewriteMinGain }}</span></div>
                <input type="range" v-model.number="wp.rewriteMinGain" min="1" max="30" step="1">
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>最大迭代次数</label><span class="wp-val">{{ wp.rewriteMaxIterations }}</span></div>
                <input type="range" v-model.number="wp.rewriteMaxIterations" min="1" max="5" step="1">
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>目标质量分数</label><span class="wp-val">{{ wp.rewriteTargetScore }}</span></div>
                <input type="range" v-model.number="wp.rewriteTargetScore" min="60" max="100" step="0.5">
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>质量下降容忍度</label><span class="wp-val">{{ wp.rewriteDeclineThreshold }}</span></div>
                <input type="range" v-model.number="wp.rewriteDeclineThreshold" min="1" max="10" step="0.5">
              </div>
            </div>
            </div>
          </div>

          <!-- 9. 约束框架 -->
          <div v-if="cc" class="wp-section">
            <div class="wp-section-title" @click="toggleWpSection('constraint')">
              <app-icon name="lock" :size="14" /> 约束框架
              <span class="wp-collapse-btn" :class="{collapsed: wpCollapsed.constraint}"><app-icon name="chevron-down" :size="14" /></span>
            </div>
            <div class="wp-section-body" :class="{collapsed: wpCollapsed.constraint}">
            <div class="wp-field">
              <div class="wp-field-label"><label>启用约束框架</label></div>
              <select v-model="cc.enabled" style="width:auto;min-width:80px">
                <option :value="true">开启</option>
                <option :value="false">关闭</option>
              </select>
              <div class="wp-hint">每章写完自动校验结构、语言、情节、节奏等约束</div>
            </div>
            <div v-if="cc.enabled">
              <div class="wp-field">
                <div class="wp-field-label"><label>严格模式(P0拦截)</label></div>
                <select v-model="cc.strictMode" style="width:auto;min-width:80px">
                  <option :value="false">关闭</option>
                  <option :value="true">开启</option>
                </select>
                <div class="wp-hint">开启后P0严重违规会阻止本章落盘并自动重写</div>
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>禁用词列表</label></div>
                <input type="text" v-model="cc.bannedWords" placeholder="逗号分隔">
                <div class="wp-hint">章节正文中不允许出现的词语</div>
              </div>
              <div class="wp-field">
                <div class="wp-field-label"><label>禁用词最大出现次数</label><span class="wp-val">{{ cc.maxBannedWordUsage }}</span></div>
                <input type="number" v-model.number="cc.maxBannedWordUsage" min="1" max="50" step="1">
              </div>
              <div class="wp-grid-2">
                <div class="wp-field">
                  <div class="wp-field-label"><label>巧合数上限</label></div>
                  <input type="number" v-model.number="cc.maxCoincidences" min="1" max="20" step="1">
                </div>
                <div class="wp-field">
                  <div class="wp-field-label"><label>同类冲突上限</label></div>
                  <input type="number" v-model.number="cc.maxSameConflict" min="1" max="5" step="1">
                </div>
              </div>
              <div class="wp-grid-2">
                <div class="wp-field">
                  <div class="wp-field-label"><label>伏笔回收率下限(%)</label></div>
                  <input type="number" v-model.number="cc.foreshadowingRecoveryMin" min="30" max="100" step="5">
                </div>
                <div class="wp-field">
                  <div class="wp-field-label"><label>每章新信息上限</label></div>
                  <input type="number" v-model.number="cc.maxNewInfoPerCh" min="1" max="5" step="1">
                </div>
              </div>
              <div class="wp-grid-2">
                <div class="wp-field">
                  <div class="wp-field-label"><label>高潮后缓冲释放</label></div>
                  <input type="number" v-model.number="cc.minBufferRelease" min="1" max="5" step="1">
                </div>
                <div class="wp-field">
                  <div class="wp-field-label"><label>高潮后冷却章数</label></div>
                  <input type="number" v-model.number="cc.cooldownAfterClimax" min="0" max="3" step="1">
                </div>
              </div>
              <div class="wp-grid-2">
                <div class="wp-field">
                  <div class="wp-field-label"><label>战斗比例下限(%)</label></div>
                  <input type="number" v-model.number="cc.combatRatioMin" min="10" max="60" step="5">
                </div>
                <div class="wp-field">
                  <div class="wp-field-label"><label>战斗比例上限(%)</label></div>
                  <input type="number" v-model.number="cc.combatRatioMax" min="40" max="90" step="5">
                </div>
              </div>
              <div class="wp-grid-2">
                <div class="wp-field">
                  <div class="wp-field-label"><label>速度因子</label></div>
                  <input type="number" v-model.number="cc.speedFactor" min="1" max="20" step="1">
                  <div class="wp-hint">控制叙事推进速度</div>
                </div>
                <div class="wp-field">
                  <div class="wp-field-label"><label>对手因子</label></div>
                  <input type="number" v-model.number="cc.rivalFactor" min="0.1" max="2.0" step="0.1">
                  <div class="wp-hint">控制对手强度递增</div>
                </div>
              </div>
            </div>
            </div>
          </div>

          <!-- 保存按钮 -->
          <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem" @click="saveWritingParams">
            保存所有参数
          </button>
        </div>

        <!-- ===== Tab 3: 作者画像（P2-1）===== -->
        <div v-if="activeTab==='profile'">
          <div class="profile-section">
            <p class="profile-desc">作者画像系统通过分析你已生成的作品，提取写作风格特征（句式偏好、对话密度、情感基调等），并在后续生成中自动注入风格保持一致。</p>

            <!-- 启用开关 -->
            <div class="profile-toggle">
              <label>启用作者画像注入</label>
              <button class="toggle-btn" :class="{on: profileEnabled}" @click="profileEnabled = !profileEnabled">
                {{ profileEnabled ? '已启用' : '已关闭' }}
              </button>
            </div>

            <!-- 分析按钮 -->
            <button class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:1rem" @click="analyzeProfile" :disabled="analyzing">
              <app-icon name="sparkles" :size="14" /> {{ analyzing ? '分析中...' : '分析所有作品' }}
            </button>

            <!-- 画像展示 -->
            <div v-if="profileData" class="profile-result">
              <div class="profile-stat">
                <span class="profile-stat-label">已分析作品</span>
                <span class="profile-stat-val">{{ profileData.totalWorks }} 部</span>
              </div>
              <div class="profile-stat">
                <span class="profile-stat-label">总字数</span>
                <span class="profile-stat-val">{{ profileData.totalWords }}</span>
              </div>
              <div v-if="profileData.avgStyle" class="profile-detail">
                <h4>风格特征</h4>
                <div class="profile-detail-row">
                  <span>平均句长</span>
                  <span>{{ profileData.avgStyle.avgSentenceLength }} 字</span>
                </div>
                <div class="profile-detail-row">
                  <span>短句占比</span>
                  <span>{{ profileData.avgStyle.shortSentenceRatio }}%</span>
                </div>
                <div class="profile-detail-row">
                  <span>对话密度</span>
                  <span>{{ profileData.avgStyle.dialogueRatio }}%</span>
                </div>
                <div class="profile-detail-row">
                  <span>描写密度</span>
                  <span>{{ profileData.avgStyle.descriptionDensity }}%</span>
                </div>
              </div>
              <div v-if="profileData.avgSentiment" class="profile-detail">
                <h4>情感基调</h4>
                <div class="profile-detail-row">
                  <span>倾向</span>
                  <span>{{ sentimentLabel(profileData.avgSentiment.tone) }}</span>
                </div>
                <div class="profile-detail-row">
                  <span>强度</span>
                  <span>{{ Math.round(profileData.avgSentiment.intensity * 100) }}%</span>
                </div>
              </div>
              <div v-if="profileData.topWords && profileData.topWords.length > 0" class="profile-detail">
                <h4>高频用词</h4>
                <div class="profile-word-tags">
                  <span v-for="w in profileData.topWords.slice(0, 15)" :key="w.word" class="profile-word-tag">{{ w.word }}</span>
                </div>
              </div>
            </div>

            <div v-else-if="!analyzing" class="profile-empty">
              <app-icon name="user" :size="32" />
              <p>暂无作者画像数据</p>
              <span>点击"分析所有作品"生成画像</span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  </div>
  `,
  methods: {
    // ===== 同步 store 到本地 =====
    syncFromStore(){
      this.mode = store.mode;
      this.base = store.config.base;
      this.key = store.config.key;
      this.model = store.config.model;
      this.testResult = { show:false, ok:false, msg:'' };
      this.modelTestResult = { show:false, ok:false, msg:'' };
      // 写作参数直接引用 store 对象，实现双向绑定
      this.wp = store.writingParams;
      this.cc = store.constraintConfig;
      // 加载折叠状态：首次打开时默认只展开第一个卡片
      if(store.wpCollapsed && Object.keys(store.wpCollapsed).length > 0){
        this.wpCollapsed = { ...store.wpCollapsed };
        this.wpCollapsedInited = true;
      } else if(!this.wpCollapsedInited){
        this.wpCollapsed = {
          basic: false,
          coolpoint: true,
          structure: true,
          memory: true,
          ai: true,
          quality: true,
          enhance: true,
          rewrite: true,
          constraint: true,
        };
        this.wpCollapsedInited = true;
      }
      // P2-1: 同步作者画像状态
      this.profileEnabled = AuthorProfile.enabled || false;
      this.profileData = AuthorProfile.profile || null;
    },

    close(){
      store.drawerOpen = false;
    },

    // 模式切换：立即生效
    onModeChange(){
      store.mode = this.mode;
      store.saveConfig();
      if(this.mode === 'mock'){
        store.toast('已切换到模拟模式，将使用预设内容', 'warn');
      } else {
        // API 模式：检查是否有可用模型
        if(!store.models || store.models.length === 0){
          store.toast('未配置模型，请在模型管理中添加', 'warn');
        } else {
          const dm = store.models.find(m => m.id === store.defaultModelId) || store.models[0];
          store.toast('已切换到 API 模式，使用模型：' + (dm ? dm.name : '未知'), 'success');
        }
      }
    },

    // ===== Tab 1: 快速配置 =====
    applyPreset(name){
      const p = CONST.PRESETS[name];
      if(!p) return;
      this.base = p.base;
      this.model = p.model;
      store.toast('已填入 ' + p.name + ' 预设，请补充 API Key', 'success');
    },

    async testApi(){
      if(!this.base || !this.key || !this.model){
        this.testResult = { show:true, ok:false, msg:'请填写完整配置' };
        return;
      }
      this.testing = true;
      try{
        const r = await Api.testConnection(this.base, this.key, this.model);
        if(r.ok){
          this.testResult = { show:true, ok:true, msg:'连接成功，API 配置正常' };
        }else{
          this.testResult = { show:true, ok:false, msg:'失败: '+r.error };
        }
      }catch(e){
        this.testResult = { show:true, ok:false, msg:'网络错误: '+e.message };
      }
      this.testing = false;
    },

    saveQuick(){
      if(this.mode==='api'){
        if(!this.base || !this.key || !this.model){
          store.toast('请填写完整的 API 配置', 'error');
          return;
        }
        store.config = { base:this.base, key:this.key, model:this.model };
        // 模型列表为空时自动创建默认模型，确保新建页可选择
        if(store.models.length === 0){
          store.addModel({
            name: this.model,
            apiUrl: this.base,
            apiKey: this.key,
            modelName: this.model,
            isDefault: true,
          });
        }
      }else if(this.mode==='mock'){
        // mock 模式下如果 API 字段已填全，自动切换到 api 模式
        if(this.base && this.key && this.model){
          this.mode = 'api';
          store.config = { base:this.base, key:this.key, model:this.model };
          if(store.models.length === 0){
            store.addModel({
              name: this.model,
              apiUrl: this.base,
              apiKey: this.key,
              modelName: this.model,
              isDefault: true,
            });
          }
          store.toast('检测到完整 API 配置，已自动切换到真实 API 模式', 'success');
        }
      }
      store.mode = this.mode;
      store.saveConfig();
      store.toast('设置已保存', 'success');
      this.close();
    },

    // ===== Tab 2: 模型管理 =====
    startAddModel(){
      this.editingModelId = null;
      this.modelForm = {
        name: '', apiUrl: '', apiKey: '', modelName: '',
        maxTokens: 8192, temperature: 0.8, isDefault: store.models.length === 0,
        capCreative: false, capStructured: false, capSynopsis: false,
        thinkingEnabled: false,
      };
      this.showModelForm = true;
    },

    applyModelPreset(name){
      const p = CONST.PRESETS[name];
      if(!p) return;
      this.modelForm.name = p.name;
      this.modelForm.apiUrl = p.base;
      this.modelForm.modelName = p.model;
      store.toast('已填入 ' + p.name + ' 预设', 'success');
    },

    editModel(id){
      const m = store.getModel(id);
      if(!m) return;
      this.editingModelId = id;
      this.modelForm = {
        name: m.name, apiUrl: m.apiUrl, apiKey: m.apiKey, modelName: m.modelName,
        maxTokens: m.maxTokens, temperature: m.temperature, isDefault: m.isDefault,
        capCreative: m.capCreative, capStructured: m.capStructured, capSynopsis: m.capSynopsis,
        thinkingEnabled: m.thinkingEnabled,
      };
      this.showModelForm = true;
    },

    saveModel(){
      if(!this.modelForm.name || !this.modelForm.apiUrl || !this.modelForm.modelName){
        store.toast('请填写模型名称、API地址和模型标识符', 'error');
        return;
      }
      if(this.editingModelId){
        store.updateModel(this.editingModelId, { ...this.modelForm });
        store.toast('模型已更新', 'success');
      }else{
        store.addModel({ ...this.modelForm });
        store.toast('模型已添加', 'success');
      }
      this.showModelForm = false;
      this.editingModelId = null;
    },

    cancelModelForm(){
      this.showModelForm = false;
      this.editingModelId = null;
    },

    setDefault(id){
      store.setDefaultModel(id);
      store.toast('已设为默认模型', 'success');
    },

    deleteModel(id){
      if(confirm('确定删除此模型配置？')){
        store.removeModel(id);
        store.toast('模型已删除', 'success');
      }
    },

    async testModel(){
      if(!this.testModelId){
        store.toast('请选择要测试的模型', 'warn');
        return;
      }
      const m = store.getModel(this.testModelId);
      if(!m) return;
      this.modelTesting = true;
      try{
        const r = await Api.testConnection(m.apiUrl, m.apiKey, m.modelName);
        if(r.ok){
          this.modelTestResult = { show:true, ok:true, msg: m.name + ' 连接成功' };
        }else{
          this.modelTestResult = { show:true, ok:false, msg:'失败: '+r.error };
        }
      }catch(e){
        this.modelTestResult = { show:true, ok:false, msg:'网络错误: '+e.message };
      }
      this.modelTesting = false;
    },

    // ===== Tab 3: 写作参数 =====
    applyRewriteMode(mode){
      Object.assign(this.wp, mode.config);
      store.toast('已应用' + mode.name, 'success');
    },

    saveWritingParams(){
      // 同步折叠状态到 store 持久化
      store.wpCollapsed = { ...this.wpCollapsed };
      store.saveConfig();
      store.toast('写作参数已保存', 'success');
    },

    toggleWpSection(key){
      // 为什么用赋值而非直接修改：确保 Vue 3 响应式触发
      this.wpCollapsed = { ...this.wpCollapsed, [key]: !this.wpCollapsed[key] };
    },

    // ===== 配置导入导出 =====
    exportConfig(){
      store.exportConfigFile();
      store.toast('配置文件已导出', 'success');
    },

    async importConfig(e){
      const file = e.target.files[0];
      if(!file) return;
      try{
        await store.importConfigFile(file);
        this.syncFromStore();
        store.toast('配置文件已导入', 'success');
      }catch(err){
        store.toast('导入失败: '+err.message, 'error');
      }
      e.target.value = '';
    },

    // ===== P2-1: 作者画像 =====
    async analyzeProfile(){
      this.analyzing = true;
      try{
        const result = await AuthorProfile.analyzeAllWorks();
        if(result){
          this.profileData = result;
          AuthorProfile.enabled = this.profileEnabled;
          store.toast('作者画像分析完成', 'success');
        }else{
          store.toast('未找到可分析的作品', 'warn');
        }
      }catch(e){
        store.toast('分析失败: ' + e.message, 'error');
      }finally{
        this.analyzing = false;
      }
    },

    sentimentLabel(tone){
      const map = { positive: '积极正向', negative: '偏沉重', neutral: '中性平衡' };
      return map[tone] || '未知';
    },
  },
};

window.SettingsDrawer = SettingsDrawer;
