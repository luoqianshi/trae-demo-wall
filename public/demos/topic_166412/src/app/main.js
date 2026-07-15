/* ===== MiniFish WebManage · V1.0 productized prototype ===== */
const { createApp, nextTick } = Vue;

const MiniFish = {
  data: window.MiniFishData || {},
  icons: window.MiniFishIcons || {},
  charts: window.MiniFishCharts || {},
  features: window.MiniFishFeatures || { items: [] },
  api: window.MiniFishAPI || null
};

function featureNavItems() {
  return [...(MiniFish.features.items || [])]
    .sort((a, b) => a.order - b.order)
    .map(item => ({
      key: item.key,
      label: item.label,
      badge: item.badge,
      icon: MiniFish.icons[item.iconKey] || ''
    }));
}

createApp({
  data() {
    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    return {
      navCollapsed: false,
      currentPanel: 'dashboard',
      searchKeyword: '',
      showNotice: false,
      showUserMenu: false,
      showAccountSwitcher: false,
      toast: { show: false, msg: '', type: 'success' },
      today,
      navItems: featureNavItems(),
      expandedCase: { excellent: false, average: false, failed: false },
      // API 状态
      apiReady: !!MiniFish.api,
      isLoggedIn: MiniFish.api ? MiniFish.api.isLoggedIn() : false,
      apiLoading: false,
      apiError: null,
      demoMode: localStorage.getItem('minifish_demo') === '1',
      showLoginPrompt: localStorage.getItem('minifish_demo') !== '1',
      authMode: 'login', // 'login' | 'register'
      loginForm: { email: '', password: '' },
      registerForm: { email: '', password: '', displayName: '' },
      profileForm: { displayName: '' },
      syncPolicy: {
        trend_interval_minutes: 15,
        account_interval_hours: 6,
        credential_check_enabled: true
      },
      aiConnections: [],
      availableProviders: [],
      connectorPlatforms: [],
      newConnectorPlatform: 'douyin',
      connectorSession: null,
      usageSummary: null,
      unreadNotificationCount: 0,
      mediaAnalyses: [],
      mediaAssets: [],
      activeMediaAnalysis: null,
      mediaAnalysisResult: null,
      featureAvailability: {
        notifications: true,
        connectorCreate: true,
        aiConnectionCreate: true,
        aiComparison: true,
        studioRun: true,
        mediaAnalysis: true,
        exports: false,
        billing: false
      },
      // 登录用户、平台账号和查询范围是三个独立状态，禁止再混入 currentAccount。
      me: null,
      creatorAccounts: [],
      activeCreatorAccountId: null,
      scope: 'all',
      responseMeta: {},
      dataStates: {
        accounts: { status: 'idle', error: null, request_id: '' },
        dashboard: { status: 'idle', error: null, request_id: '' },
        trends: { status: 'idle', error: null, request_id: '' },
        materials: { status: 'idle', error: null, request_id: '' },
        coach: { status: 'idle', error: null, request_id: '' },
        ai: { status: 'idle', error: null, request_id: '' },
        studio: { status: 'idle', error: null, request_id: '' },
        media: { status: 'idle', error: null, request_id: '' }
      },
      // 仅显式游客 Demo 使用；登录态 currentAccount 始终由 me/creatorAccounts 计算。
      demoAccount: {
        id: 'acc-main',
        name: '墨白工作室',
        email: 'demo@minifish.local',
        avatar: '墨',
        role: '演示账号',
        platform: '抖音',
        platformColor: '#737373',
        color: 'linear-gradient(135deg,#e8755e,#d4634a)',
        cookieStatus: 'valid',
        cookieRemain: '5天12时',
        cookiePercent: 72
      },
      ...(MiniFish.data.dashboard || {}),
      ...(MiniFish.data.accounts || {}),
      ...(MiniFish.data.ai || {}),
      ...(MiniFish.data.media || {}),
      ...(MiniFish.data.studio || {}),
      ...(MiniFish.data.intelligence || {}),
      activeTrendItem: null,
      heatRange: '7d',
      showEvalTool: false,
      ...(MiniFish.data.coach || {}),
      ...(MiniFish.data.product || {}),
      ...(MiniFish.data.settings || {}),
      charts: {},
      caseDetailVisible: false,
      caseCardVisible: false,
      activeCaseCard: null,
      candidatePoolVisible: false,
      activeAssessment: null,
      assessmentLoading: false,
      newAiConnection: { provider: 'xiaomi_mimo', label: 'MiMo Token Plan', credential_type: 'token_plan', region: 'cn', secret: '', base_url: '', models: [], test_model: '', proxy: '', remark: '' },
      newModelInput: '',
      aiConnectionSaving: false,
      aiConnectionSave: {
        state: 'idle',
        stage: '',
        message: '',
        code: '',
        request_id: '',
        connection_id: '',
        cleanup: ''
      },
    };
  },

  computed: {
    activeCreatorAccount() {
      return this.creatorAccounts.find(account => account.id === this.activeCreatorAccountId) || null;
    },
    currentAccount() {
      if (this.demoMode && !this.isLoggedIn) return this.demoAccount;
      if (this.activeCreatorAccount) return this.presentCreatorAccount(this.activeCreatorAccount);
      const user = this.me || {};
      const label = user.display_name || user.email || '未绑定平台账号';
      return {
        id: user.id || '',
        name: label,
        email: user.email || '',
        avatar: label.charAt(0).toUpperCase(),
        role: this.isLoggedIn ? '登录用户' : '未登录',
        platform: this.isLoggedIn ? '未绑定' : '游客',
        platformColor: '#737373',
        color: 'linear-gradient(135deg,#6b95bf,#4a90e2)',
        cookieStatus: 'none',
        cookieRemain: '',
        cookiePercent: 0
      };
    },
    switchableAccounts() {
      if (this.demoMode && !this.isLoggedIn) return [{ ...this.demoAccount, status: 'current' }];
      return this.creatorAccounts.map(account => ({
        ...this.presentCreatorAccount(account),
        status: account.id === this.activeCreatorAccountId ? 'current' : 'available'
      }));
    },
    filteredMaterials() {
      const items = this.materials || [];
      return this.matPlatform === '全部' ? items : items.filter(m => m.platform === this.matPlatform);
    },
    intelligencePlatforms() {
      const unique = [...new Set((this.trendItems || []).map(item => item.platform))];
      return ['全部', ...unique];
    },
    filteredTrendItems() {
      const tabMap = { '实时热点': 'hot', '上升榜': 'rising', '总榜': 'total' };
      const listType = tabMap[this.intelligenceTab];
      return (this.trendItems || []).filter(item => {
        const platformOk = this.intelligencePlatform === '全部' || item.platform === this.intelligencePlatform;
        const tabOk = this.intelligenceTab === '总榜' ? true : item.listType === listType;
        return platformOk && tabOk;
      });
    },
    sortedTrendItems() {
      const sorted = [...this.filteredTrendItems];
      const riskWeight = { low: 1, mid: 0.85, high: 0.5 };
      if (this.intelligenceSort === 'heat') {
        return sorted.sort((a, b) => b.heatScore - a.heatScore);
      }
      if (this.intelligenceSort === 'growth') {
        return sorted.sort((a, b) => b.growthRate - a.growthRate);
      }
      return sorted.sort((a, b) => {
        return b.opportunityScore * riskWeight[b.riskLevel] - a.opportunityScore * riskWeight[a.riskLevel];
      });
    },
    activeRecommendation() {
      const top = this.sortedTrendItems[0];
      if (!top) return null;
      const matched = (this.marketPicks || []).find(item => item.trendId === top.id);
      if (matched) return { ...matched, trend: top };
      return {
        trend: top,
        opportunityScore: top.opportunityScore,
        marketReasons: [top.whyOpportunity, `热度分 ${top.heatScore}，增长分 ${top.growthRate}`, top.platform].filter(Boolean),
        anglePool: top.commonAngles,
        entryBarrier: top.materialReady >= 70 ? '低——素材完备度高' : top.materialReady >= 40 ? '中——需补充部分素材' : '高——素材缺口大'
      };
    },
    filteredCases() {
      if (this.activeCaseFilter === 'all' || !this.activeCaseFilter) {
        return this.allCases || [];
      }
      return (this.allCases || []).filter(c => c.category === this.activeCaseFilter);
    },
    caseDetailData() {
      const key = this.activeCaseFilter || 'all';
      const data = this.caseChartData || {};
      return data[key] || data.all || null;
    },
    candidatePoolItems() {
      return (this.candidatePool || []).map(id => (this.trendItems || []).find(t => t.id === id)).filter(Boolean);
    },
    marketWindJudgment() {
      const high = this.filteredTrendItems.filter(t => t.opportunityScore >= 70).length;
      if (high >= 3) return '本周高机会选题密集，AI工具/效率赛道呈现爆发态势，建议优先锁定 1-2 个方向快速切入。';
      if (high >= 1) return '本周有' + high + '个高机会选题，可在候选池中标记后去成长教练评估账号适配度。';
      return '本周无显著高机会赛道，建议巩固存量内容、观察趋势变化。';
    },
    hotCount() {
      return this.filteredTrendItems.filter(t => t.heatScore >= 85).length;
    },
    fastRisingCount() {
      return this.filteredTrendItems.filter(t => t.growthRate >= 200).length;
    },
    highOppCount() {
      return this.filteredTrendItems.filter(t => t.opportunityScore >= 70).length;
    },
    resolvedMarketPicks() {
      return (this.marketPicks || []).map(p => ({
        ...p,
        trend: this.trendItems.find(t => t.id === p.trendId)
      })).filter(p => p.trend);
    },
    heatTrendDirection() {
      const item = this.activeTrendItem;
      if (!item) return '';
      if (this.isLoggedIn) return `当前热度分 ${item.heatScore}，增长分 ${item.growthRate}。趋势结论仅使用接口返回序列，不生成演示性判断。`;
      const g = item.growthRate;
      if (g >= 300) return `近${this.heatRange==='7d'?'一周':this.heatRange==='30d'?'一月':'一季度'}热度呈爆发式增长（+${g}%），远超同类均值，处于加速上升通道，建议快速切入抢占流量窗口。`;
      if (g >= 150) return `热度持续走高（+${g}%），增长动能强劲，属于上升期话题，竞争尚未白热化，是较好的切入时机。`;
      if (g >= 50) return `热度稳中有升（+${g}%），话题处于成长期，已有一定声量但仍有增长空间，适合差异化切入。`;
      if (g >= 0) return `热度走势平稳（+${g}%），话题已进入成熟期，竞争较为充分，需要较强差异化才能突围。`;
      return `热度呈下行趋势（${g}%），话题进入衰退期，不建议作为主力方向投入。`;
    },
    heatTrendConclusion() {
      const item = this.activeTrendItem;
      if (!item) return '点击左侧选题查看热度趋势分析';
      if (this.isLoggedIn) return `当前机会分 ${item.opportunityScore}，置信度 ${item.confidence == null ? '暂无' : item.confidence}。`;
      const range = this.heatRange === '7d' ? '近7天' : this.heatRange === '30d' ? '近30天' : '近90天';
      return `${range}数据显示，该话题热度${item.growthRate>=150?'持续攀升，增速高于同类均值':'表现平稳'}，${item.riskLevel==='low'?'竞争度低，切入风险较小':item.riskLevel==='mid'?'存在中等竞争，需差异化切入':'竞争较激烈，需谨慎评估'}。`;
    },
    heatKeyPoints() {
      const item = this.activeTrendItem;
      if (!item) return [];
      if (this.isLoggedIn) return item.keyPoints || [];
      const today = new Date();
      function daysAgo(n) { const d = new Date(today); d.setDate(d.getDate()-n); return (d.getMonth()+1)+'/'+d.getDate(); }
      const points = [];
      if (item.growthRate >= 200) {
        points.push({ date: daysAgo(this.heatRange==='90d'?45:this.heatRange==='30d'?12:3), text: '热度首次出现明显拉升，话题开始破圈' });
      }
      if (item.lifecycle === '爆发期' || item.lifecycle === '上升期') {
        points.push({ date: daysAgo(this.heatRange==='90d'?15:this.heatRange==='30d'?5:1), text: '平台算法开始加大推荐流量，搜索指数快速攀升' });
      }
      points.push({ date: daysAgo(0), text: '当前热度' + (item.heatScore>=80?'处于高位':'趋于稳定') + '，' + (item.competition==='低竞争'?'竞争蓝海':'竞争逐步加剧') });
      return points;
    },
    relatedTopics() {
      const item = this.activeTrendItem;
      if (!item) return [];
      if (this.isLoggedIn) return item.relatedTopics || [];
      const base = item.commonAngles || [];
      const related = [
        item.platform + '运营技巧', 'AI工具推荐', '效率提升',
        '副业变现', '新手入门', '2026趋势'
      ];
      return [...new Set([...base.slice(0,2), ...related])].slice(0,6);
    },
    caseDimDiagnosis() {
      const card = this.activeCaseCard;
      if (!card || !card.diagnosis || !card.diagnosis.bars) return null;
      const bars = card.diagnosis.bars;
      const cat = card.category;
      const dims = bars.map(b => {
        const delta = b.val - b.avg;
        let level = 'mid', label = '达标';
        if (delta >= 30) { level = 'strong'; label = '核心优势'; }
        else if (delta >= 15) { level = 'good'; label = '明显优势'; }
        else if (delta >= 0) { level = 'mid'; label = '达标'; }
        else if (delta >= -15) { level = 'weak'; label = '短板'; }
        else { level = 'bad'; label = '严重拖后腿'; }
        return { dim: b.dim, val: b.val, avg: b.avg, delta, level, label };
      });
      const strongDims = dims.filter(d => d.level === 'strong').map(d => d.dim);
      const badDims = dims.filter(d => d.level === 'bad').map(d => d.dim);
      let tag = '', summary = '';
      if (cat === 'excellent') {
        tag = strongDims.length >= 2 ? '多维驱动型爆款' : '单项爆发型爆款';
        summary = strongDims.join('、') + '远超均值，是该案例的核心爆款驱动力';
        if (badDims.length) summary += '；但' + badDims.join('、') + '拖了后腿';
      } else if (cat === 'average') {
        tag = strongDims.length ? '偏科型中位内容' : '平庸型中位内容';
        summary = strongDims.length ? strongDims.join('、') + '尚可，但' + (badDims.length ? badDims.join('、') + '明显拖后腿' : '其余维度均无突出表现') : '各维度均接近均值，缺乏差异化爆点';
      } else {
        tag = badDims.length >= 3 ? '全面失速型失败' : '定位偏移型失败';
        summary = badDims.length ? badDims.join('、') + '全面落后均值，是典型失败案例' : '多个关键维度不达标，内容缺乏竞争力';
      }
      return { tag, summary, dims };
    },
    providerList() {
      if (this.isLoggedIn) {
        const labels = { deepseek: 'DeepSeek', opencode_go: 'OpenCode Go', xiaomi_mimo: '小米 MiMo' };
        return (this.availableProviders || []).map(provider => ({
          ...provider,
          label: provider.name || labels[provider.id] || provider.id,
          ...(() => {
            const local = window.MiniFishProviderRegistry && window.MiniFishProviderRegistry.getProvider(provider.id) || {};
            const allowedCredentials = provider.credential_types || ['standard'];
            const localDefault = local.defaultCredentialType;
            return {
              defaultBaseUrl: local.defaultBaseUrl || '',
              regions: local.regions || ['cn', 'sgp', 'eu'],
              models: local.models || [],
              defaultCredentialType: allowedCredentials.includes(localDefault) ? localDefault : allowedCredentials[0]
            };
          })(),
          credentialTypes: provider.credential_types || ['standard'],
        }));
      }
      return window.MiniFishProviderRegistry ? window.MiniFishProviderRegistry.getProviderList() : [];
    },
    currentProvider() {
      return this.providerList.find(provider => provider.id === this.newAiConnection.provider) || null;
    },
    currentCredentialTypes() {
      if (this.isLoggedIn) {
        const labels = { standard: '普通 API', token_plan: 'Token Plan' };
        return (this.currentProvider && this.currentProvider.credentialTypes || ['standard'])
          .map(value => ({ value, label: labels[value] || value }));
      }
      if (!window.MiniFishProviderRegistry) return [{ value: 'standard', label: '普通 API' }];
      return window.MiniFishProviderRegistry.resolveCredentialTypes(this.newAiConnection.provider);
    },
    activeMediaAsset() {
      if (!this.activeMediaAnalysis) return null;
      return this.mediaAssets.find(asset => asset.id === this.activeMediaAnalysis.asset_id) || null;
    },
    mediaPreviewTitle() {
      if (this.activeMediaAsset && this.activeMediaAsset.file_name) return this.activeMediaAsset.file_name;
      if (!this.activeMediaAnalysis) return '暂无分析记录';
      return '媒体分析 ' + String(this.activeMediaAnalysis.id || '').slice(0, 8);
    },
    mediaPreviewMeta() {
      if (!this.activeMediaAnalysis) return '上传音视频后在此显示真实分析结果';
      const labels = { queued: '排队中', running: '分析中', succeeded: '已完成', failed: '失败', dead_letter: '重试耗尽' };
      const parts = [labels[this.activeMediaAnalysis.status] || this.activeMediaAnalysis.status || '未知状态'];
      if (this.activeMediaAsset && this.activeMediaAsset.content_type) parts.push(this.activeMediaAsset.content_type);
      if (this.activeMediaAnalysis.created_at) parts.push(new Date(this.activeMediaAnalysis.created_at).toLocaleString('zh-CN'));
      return parts.join(' · ');
    },
    secretPlaceholder() {
      const ct = this.newAiConnection.credential_type;
      const meta = window.MiniFishProviderRegistry && window.MiniFishProviderRegistry.credentialTypeMeta;
      if (meta && meta[ct]) return meta[ct].placeholder;
      return 'API Key（只写入加密存储，不会回显）';
    },
    currentProviderHint() {
      if (!window.MiniFishProviderRegistry) return '';
      const credentialHint = window.MiniFishProviderRegistry.resolveHint(this.newAiConnection.provider, this.newAiConnection.credential_type);
      if (credentialHint) return credentialHint;
      const baseUrl = window.MiniFishProviderRegistry.resolveDefaultBaseUrl(this.newAiConnection.provider, this.newAiConnection.credential_type);
      return baseUrl ? `推荐 API 地址：${baseUrl}` : '';
    },
    currentBaseUrlPlaceholder() {
      if (!window.MiniFishProviderRegistry) return '留空使用默认地址';
      const baseUrl = window.MiniFishProviderRegistry.resolveDefaultBaseUrl(this.newAiConnection.provider, this.newAiConnection.credential_type);
      return baseUrl || '留空使用默认地址';
    },
    aiConnectionSaveLabel() {
      if (!this.aiConnectionSaving) return '保存并验证';
      const labels = {
        create: '正在创建连接…',
        secret: '正在加密保存密钥…',
        verify_submit: '正在提交验证…',
        verify_wait: '正在验证模型连接…',
        refresh: '正在刷新连接…'
      };
      return labels[this.aiConnectionSave.stage] || '正在保存…';
    }
  },

  watch: {
    aiTab() { nextTick(() => this.renderCharts()); },
    settingsTab() { nextTick(() => this.renderCharts()); },
    intelligenceTab() {
      this.activeTrendItem = null;
      if (this.isLoggedIn) {
        if (this.intelligenceTab === '素材库') this.loadMaterials();
        else this.loadTrends();
      }
      nextTick(() => { if(!this.activeTrendItem && this.sortedTrendItems.length) this.activeTrendItem = this.sortedTrendItems[0]; this.renderCharts(); });
    },
    intelligencePlatform() {
      this.activeTrendItem = null;
      if (this.isLoggedIn) { this.loadTrends(); }
      nextTick(() => { if(!this.activeTrendItem && this.sortedTrendItems.length) this.activeTrendItem = this.sortedTrendItems[0]; this.renderCharts(); });
    },
    intelligenceSort() { nextTick(() => this.renderCharts()); },
    heatRange() { nextTick(() => this.renderCharts()); },
    activeTrendItem() { nextTick(() => this.renderCharts()); },
    coachTab() { nextTick(() => this.renderCharts()); },
    activeCaseFilter() { nextTick(() => this.renderCharts()); },
    caseDetailVisible(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    },
    caseCardVisible(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    },
    candidatePoolVisible(val) {
      document.body.style.overflow = val ? 'hidden' : '';
    },
    sortedTrendItems(list) {
      if (!this.activeTrendItem && list && list.length > 0) {
        this.activeTrendItem = list[0];
      }
    },
    'newAiConnection.provider'(val) {
      const p = this.providerList.find(provider => provider.id === val);
      this.aiConnectionSave = { state: 'idle', stage: '', message: '', code: '', request_id: '', connection_id: '', cleanup: '' };
      if (!p) {
        this.newAiConnection.credential_type = 'standard';
        this.newAiConnection.label = val;
        return;
      }
      this.newAiConnection.credential_type = p.defaultCredentialType || 'standard';
      this.newAiConnection.label = p.label || p.name || val;
      this.newAiConnection.base_url = '';
      this.newAiConnection.models = [];
      this.newAiConnection.region = p.regions && p.regions[0] || 'cn';
    },
    'newAiConnection.credential_type'(val) {
      const p = this.currentProvider;
      if (!p) return;
      if (p.defaultLabelByCredential && p.defaultLabelByCredential[val]) {
        this.newAiConnection.label = p.defaultLabelByCredential[val];
      }
      this.newAiConnection.base_url = '';
    }
  },

  methods: {
    presentCreatorAccount(account) {
      const platformColor = {
        douyin: '#737373',
        xiaohongshu: '#FF2442',
        bilibili: '#FB7299'
      }[account.platform] || '#737373';
      const label = account.display_name || account.name || '未命名账号';
      const expiresAt = account.credential_expires_at ? new Date(account.credential_expires_at) : null;
      let remain = '';
      let percent = 0;
      if (expiresAt && !Number.isNaN(expiresAt.getTime())) {
        const remainingMs = expiresAt.getTime() - Date.now();
        const remainingHours = Math.max(0, Math.floor(remainingMs / 3600000));
        remain = remainingHours > 24 ? Math.floor(remainingHours / 24) + '天' : remainingHours + '小时';
        percent = Math.max(0, Math.min(100, Math.round(remainingHours / (24 * 14) * 100)));
      }
      return {
        id: account.id,
        name: label,
        email: this.me && this.me.email || '',
        avatar: label.charAt(0).toUpperCase(),
        role: '创作者',
        platform: account.platform_label || this.reversePlatformName(account.platform),
        platformColor,
        color: 'linear-gradient(135deg,#e8755e,#d4634a)',
        cookieStatus: account.credential_status || 'pending',
        cookieRemain: remain,
        cookiePercent: percent
      };
    },
    setDataState(domain, status, error, response) {
      const message = error ? (error.message || String(error)) : null;
      const requestId = response && response.request_id || error && error.requestId || '';
      this.dataStates[domain] = { status, error: message, request_id: requestId };
      if (response) {
        this.responseMeta[domain] = {
          meta: response.meta || null,
          request_id: response.request_id || '',
          status: response.status,
          accepted: response.accepted
        };
      }
      if (error) this.apiError = message;
    },
    requireLogin(actionLabel) {
      if (this.isLoggedIn) return true;
      this.showLoginPrompt = true;
      this.showToast((actionLabel || '此操作') + '需要先登录', 'error');
      return false;
    },
    blankDataShape(value) {
      if (Array.isArray(value)) return [];
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, this.blankDataShape(child)]));
      }
      if (typeof value === 'number') return 0;
      if (typeof value === 'boolean') return false;
      return '';
    },
    clearAuthenticatedData() {
      this.dashboard = this.blankDataShape(MiniFish.data.dashboard && MiniFish.data.dashboard.dashboard || {});
      this.notices = [];
      this.unreadNotificationCount = 0;
      this.cookieOverview = [];
      this.cookiePlatforms = [];
      this.aiModels = [];
      this.compareModels = [];
      this.compareResults = [];
      this.usageTable = [];
      this.usageSummary = null;
      this.aiConnections = [];
      this.availableProviders = [];
      this.transcript = [];
      this.keyframes = [];
      this.videoStructure = [];
      this.trendItems = [];
      this.marketPicks = [];
      this.materials = [];
      this.candidatePool = [];
      this.activeTrendItem = null;
      this.topicDraft = '';
      this.topicEvaluation = null;
      this.caseSummary = this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.caseSummary || {});
      this.caseDimensions = [];
      this.allCases = [];
      this.caseChartData = this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.caseChartData || {});
      this.creatorProfile = this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.creatorProfile || {});
      this.skillScores = [];
      this.skillBaseline = [];
      this.profileDiagnosis = '';
      this.radarNarrative = '';
      this.diagnosticCards = [];
      this.routeSummary = this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.routeSummary || {});
      this.routes = [];
      this.navActions = [];
      this.routeProgress = [];
      this.growthPath = this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.growthPath || {});
      this.caseCategories = [];
      if (this.studio) {
        this.studio.messages = [];
        this.studio.outputFiles = [];
        this.studio.sources = [];
        this.studio.modelList = [];
        this.studio.streamingBlocks = [];
        this.studio.sessionId = null;
        this.studio.sessions = [];
        this.studio.accessMode = 'auto';
        this.studio.activeRunId = null;
        this.studio.runError = null;
        this.studio.previewContent = '';
        this.studio.currentArtifactId = null;
        this.studio.previewTabs = [{ key: 'md', label: '文本' }];
        this.studio.previewTab = 'md';
      }
      this._dashboardSeries = null;
      this._trendSeries = null;
      this._coachOverview = null;
      this._aiUsageSummary = null;
      this._aiUsageSeries = null;
      this._aiUsageRecords = [];
      this.mediaAnalysisResult = null;
      this.mediaAnalyses = [];
      this.mediaAssets = [];
      this.activeMediaAnalysis = null;
      Object.keys(this.dataStates).forEach(domain => this.setDataState(domain, 'idle'));
    },
    applyDemoData() {
      const clone = value => JSON.parse(JSON.stringify(value));
      ['dashboard', 'accounts', 'ai', 'media', 'studio', 'intelligence', 'coach', 'product', 'settings']
        .forEach(domain => {
          if (MiniFish.data[domain]) Object.assign(this, clone(MiniFish.data[domain]));
        });
      this.activeTrendItem = this.trendItems && this.trendItems[0] || null;
      nextTick(() => this.renderCharts());
    },
    switchPanel(key) {
      this.currentPanel = key;
      this.showUserMenu = false;
      this.showNotice = false;
      this.caseDetailVisible = false;
      this.caseCardVisible = false;
      this.candidatePoolVisible = false;
      nextTick(() => this.renderCharts());
    },
    openCaseDetail(key) {
      this.activeCaseFilter = key;
      this.caseDetailVisible = true;
    },
    closeCaseDetail() {
      this.caseDetailVisible = false;
    },
    async openCaseCard(c) {
      let card = c;
      if (this.isLoggedIn && c && c.id) {
        try {
          const response = await MiniFish.api.coach.caseDetail(c.id);
          const detail = response.data;
          card = {
            ...this.mapCase(detail),
            cover: detail.cover_url || '',
            sourceUrl: detail.source_url || '',
            diagnosis: {
              verdict: (detail.diagnosis || []).join('；'),
              hook: { label: '', text: '' },
              open: { label: '', text: '' },
              structure: { label: '', text: '' },
              ending: { label: '', text: '' },
              formula: { label: '', text: '' },
              bars: [], strengths: [], weaknesses: [], takeaways: [], actions: [],
              bottlenecks: [], suggestions: [], pitfalls: [], warnings: []
            },
            dataMeta: detail.data_meta
          };
        } catch (err) {
          this.showToast(err.message || '案例详情加载失败', 'error');
          return;
        }
      }
      this.activeCaseCard = card;
      this.caseCardVisible = true;
      nextTick(() => {
        MiniFish.charts.intelligence.renderCaseCardRadar(this);
      });
    },
    closeCaseCard() {
      this.caseCardVisible = false;
      this.activeCaseCard = null;
    },
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
      this.showAccountSwitcher = false;
      this.showNotice = false;
    },
    toggleAccountSwitcher() {
      this.showAccountSwitcher = !this.showAccountSwitcher;
    },
    toggleNotice() {
      this.showNotice = !this.showNotice;
      this.showUserMenu = false;
      if (this.showNotice && this.isLoggedIn) this.loadNotifications();
    },
    closePopups() {
      this.showUserMenu = false;
      this.showAccountSwitcher = false;
      this.showNotice = false;
      if (this.studio) {
        this.studio.showModelMenu = false;
        this.studio.showFilesMenu = false;
      }
    },
    sentLabel(s) {
      return s === 'pos' ? '正面' : s === 'neg' ? '负面' : '中性';
    },
    riskLabel(level) {
      return level === 'low' ? '低风险' : level === 'mid' ? '中风险' : level === 'high' ? '高风险' : '风险待评估';
    },
    showToast(msg, type = 'success', duration = 2400) {
      this.toast = { show: true, msg, type };
      setTimeout(() => { this.toast.show = false; }, duration);
    },
    normalizeApiError(error) {
      const networkTypeError = error instanceof TypeError;
      return {
        message: error && error.message || '请求失败，请稍后重试',
        code: error && error.code || (networkTypeError ? 'NETWORK_ERROR' : 'CLIENT_ERROR'),
        status: Number(error && error.status || 0),
        request_id: error && (error.requestId || error.request_id) || ''
      };
    },
    formatApiError(error, prefix) {
      const normalized = this.normalizeApiError(error);
      const code = normalized.code ? ` [${normalized.code}]` : '';
      const requestId = normalized.request_id ? ` · 请求 ID：${normalized.request_id}` : '';
      return `${prefix}：${normalized.message}${code}${requestId}`;
    },
    setStudioRunError(error, fallbackMessage) {
      const normalized = this.normalizeApiError(error || {});
      this.studio.runError = {
        code: normalized.code && normalized.code !== 'CLIENT_ERROR' ? normalized.code : 'STUDIO_RUN_FAILED',
        message: normalized.message || fallbackMessage || '内容生成失败',
        request_id: normalized.request_id || ''
      };
      this.setDataState('studio', 'error', new Error(this.studio.runError.message));
      return this.studio.runError;
    },
    refreshAll() {
      if (!this.requireLogin('刷新真实数据')) return;
      this.syncAndReload();
    },

    // ======== API 集成方法 ========

    /** 构建通用查询参数 */
    apiBaseParams() {
      const params = { scope: this.scope };
      if (this.scope === 'account' && this.activeCreatorAccountId) {
        params.creator_account_id = this.activeCreatorAccountId;
      } else if (this.scope === 'account') {
        params.scope = 'all';
      }
      return params;
    },

    /** 初始化 API：尝试通过 HttpOnly Cookie 恢复会话 */
    async initApi() {
      if (!this.apiReady) return;
      // 页面加载时尝试 loadMe()，若 Refresh Cookie 仍有效则恢复登录态
      try {
        const response = await MiniFish.api.loadMe();
        const me = response.data;
        if (me && me.id) {
          this.me = me;
          this.profileForm.displayName = me.display_name || '';
          this.isLoggedIn = true;
          this.showLoginPrompt = false;
          this.demoMode = false;
          localStorage.removeItem('minifish_demo');
          this.clearAuthenticatedData();
          await this.loadCreatorAccounts();
          if (this.creatorAccounts.length > 0) {
            this.activeCreatorAccountId = this.creatorAccounts[0].id;
            this.scope = 'account';
          } else {
            this.scope = 'all';
          }
          await this.loadAllData();
        }
      } catch (err) {
        // Cookie 失效或未登录
        this.isLoggedIn = false;
        // 已有 Token 尝试刷新失败才跳登录；Demo 模式不弹
        this.showLoginPrompt = !this.demoMode;
      }
    },

    /** 登录 */
    async doLogin() {
      if (!this.apiReady) { this.showToast('API 未初始化', 'error'); return; }
      if (!this.loginForm.email || !this.loginForm.password) {
        this.showToast('请输入邮箱和密码', 'error'); return;
      }
      this.apiLoading = true;
      try {
        // login 返回 { user, access_token, expires_in }，Access Token 已存入内存
        const response = await MiniFish.api.login(this.loginForm.email, this.loginForm.password);
        const data = response.data;
        if (data && data.user) this.me = data.user;
        this.profileForm.displayName = this.me && this.me.display_name || '';
        this.isLoggedIn = true;
        this.showLoginPrompt = false;
        this.demoMode = false;
        localStorage.removeItem('minifish_demo');
        this.clearAuthenticatedData();
        this.showToast('登录成功', 'success');
        await this.loadCreatorAccounts();
        if (this.creatorAccounts.length > 0) {
          this.activeCreatorAccountId = this.creatorAccounts[0].id;
          this.scope = 'account';
        } else {
          this.scope = 'all';
        }
        await this.loadAllData();
      } catch (err) {
        this.apiError = err.message;
        this.showToast(err.message || '登录失败', 'error');
      } finally {
        this.apiLoading = false;
      }
    },

    /** 注册 */
    async doRegister() {
      if (!this.apiReady) { this.showToast('API 未初始化', 'error'); return; }
      const { email, password, displayName } = this.registerForm;
      if (!email || !password || !displayName.trim()) {
        this.showToast('请输入邮箱、密码和昵称', 'error'); return;
      }
      if (password.length < 12) {
        this.showToast('密码至少 12 位', 'error'); return;
      }
      this.apiLoading = true;
      try {
        // register 返回 { user, access_token, expires_in }，注册后自动登录
        const response = await MiniFish.api.register(email, password, displayName.trim());
        const data = response.data;
        if (data && data.user) this.me = data.user;
        this.profileForm.displayName = this.me && this.me.display_name || '';
        this.isLoggedIn = true;
        this.showLoginPrompt = false;
        this.demoMode = false;
        localStorage.removeItem('minifish_demo');
        this.clearAuthenticatedData();
        this.showToast('注册成功，已自动登录', 'success');
        await this.loadCreatorAccounts();
        if (this.creatorAccounts.length > 0) {
          this.activeCreatorAccountId = this.creatorAccounts[0].id;
          this.scope = 'account';
        } else {
          this.scope = 'all';
        }
        await this.loadAllData();
      } catch (err) {
        this.apiError = err.message;
        this.showToast(err.message || '注册失败', 'error');
      } finally {
        this.apiLoading = false;
      }
    },

    /** 切换认证模式（登录/注册） */
    switchAuthMode(mode) {
      this.authMode = mode;
      this.apiError = null;
    },

    /** 进入 Demo 模式 */
    enterDemoMode() {
      this.demoMode = true;
      this.showLoginPrompt = false;
      localStorage.setItem('minifish_demo', '1');
      this.applyDemoData();
    },

    /** 登出 */
    async doLogout() {
      if (this.apiReady) {
        try { await MiniFish.api.logout(); } catch {}
      }
      this.isLoggedIn = false;
      this.me = null;
      this.demoMode = false;
      this.creatorAccounts = [];
      this.activeCreatorAccountId = null;
      this.scope = 'all';
      this.clearAuthenticatedData();
      this.showLoginPrompt = true;
      this.authMode = 'login';
      this.loginForm = { email: '', password: '' };
      this.registerForm = { email: '', password: '', displayName: '' };
      localStorage.removeItem('minifish_demo');
      this.showToast('已退出登录', 'info');
    },

    /** 加载创作者账号列表 */
    async loadCreatorAccounts() {
      this.setDataState('accounts', 'loading');
      try {
        const response = await MiniFish.api.get('/creator-accounts');
        const payload = response.data || {};
        this.creatorAccounts = Array.isArray(payload) ? payload : (payload.items || []);
        const summary = payload.summary || {
          valid: this.creatorAccounts.filter(a => a.credential_status === 'valid').length,
          expiring: this.creatorAccounts.filter(a => a.credential_status === 'expiring').length,
          invalid: this.creatorAccounts.filter(a => ['expired', 'invalid'].includes(a.credential_status)).length
        };
        this.cookieOverview = [
          { label: '管理账号总数', value: this.creatorAccounts.length, color: '#e8755e' },
          { label: '正常运行', value: summary.valid || 0, color: '#7ba989' },
          { label: '即将过期', value: summary.expiring || 0, color: '#d4a04c' },
          { label: '已失效', value: summary.invalid || 0, color: '#e06c6c' }
        ];
        const platformMeta = {
          douyin: { name: '抖音', color: '#737373' },
          xiaohongshu: { name: '小红书', color: '#FF2442' },
          bilibili: { name: 'B站', color: '#FB7299' }
        };
        this.cookiePlatforms = Object.entries(platformMeta).map(([platform, meta]) => {
          const accounts = this.creatorAccounts.filter(account => account.platform === platform);
          const valid = accounts.filter(a => a.credential_status === 'valid').length;
          const expiring = accounts.filter(a => a.credential_status === 'expiring').length;
          const expired = accounts.filter(a => ['expired', 'invalid'].includes(a.credential_status)).length;
          return {
            ...meta,
            status: expired ? 'err' : expiring ? 'warn' : 'ok',
            statusText: expired ? '存在失效' : expiring ? '即将过期' : accounts.length ? '正常' : '未绑定',
            valid,
            expiring,
            expired,
            accounts: accounts.map(account => {
              const presented = this.presentCreatorAccount(account);
              return {
                id: account.id,
                name: presented.name,
                uid: '',
                color: meta.color,
                status: account.credential_status,
                percent: presented.cookiePercent,
                remain: presented.cookieRemain || '未知',
                expire: account.credential_expires_at
                  ? new Date(account.credential_expires_at).toLocaleString('zh-CN')
                  : '未提供'
              };
            })
          };
        });
        this.setDataState('accounts', this.creatorAccounts.length ? 'ready' : 'empty', null, response);
      } catch (err) {
        this.creatorAccounts = [];
        this.cookieOverview = [];
        this.cookiePlatforms = [];
        this.activeCreatorAccountId = null;
        this.scope = 'all';
        this.setDataState('accounts', 'error', err);
      }
    },

    async saveProfile() {
      if (!this.requireLogin('保存个人资料')) return;
      const displayName = (this.profileForm.displayName || '').trim();
      if (!displayName) {
        this.showToast('昵称不能为空', 'error');
        return;
      }
      this.apiLoading = true;
      try {
        const response = await MiniFish.api.profile.update({ display_name: displayName });
        this.me = response.data;
        this.profileForm.displayName = response.data.display_name;
        this.showToast('个人资料已保存', 'success');
      } catch (err) {
        this.showToast(err.message || '保存个人资料失败', 'error');
      } finally {
        this.apiLoading = false;
      }
    },

    cancelProfileEdit() {
      this.profileForm.displayName = this.me && this.me.display_name || '';
    },

    async loadSyncPolicy() {
      if (!MiniFish.api.accounts) return;
      try {
        const response = await MiniFish.api.accounts.policy();
        this.syncPolicy = response.data;
        this.responseMeta.syncPolicy = {
          meta: response.meta,
          request_id: response.request_id,
          status: response.status,
          accepted: response.accepted
        };
      } catch (err) {
        this.apiError = err.message;
      }
    },

    async saveSyncPolicy() {
      if (!this.requireLogin('保存刷新策略')) return;
      this.apiLoading = true;
      try {
        const response = await MiniFish.api.accounts.updatePolicy({
          trend_interval_minutes: Number(this.syncPolicy.trend_interval_minutes),
          account_interval_hours: Number(this.syncPolicy.account_interval_hours),
          credential_check_enabled: !!this.syncPolicy.credential_check_enabled
        });
        this.syncPolicy = response.data;
        this.showToast('刷新策略已保存', 'success');
      } catch (err) {
        this.showToast(err.message || '保存刷新策略失败', 'error');
      } finally {
        this.apiLoading = false;
      }
    },

    async loadConnectorPlatforms() {
      if (!MiniFish.api.connectors || !this.isLoggedIn) return;
      try {
        const response = await MiniFish.api.connectors.platforms();
        this.connectorPlatforms = Array.isArray(response.data) ? response.data : [];
        if (this.connectorPlatforms.length && !this.connectorPlatforms.some(item => item.id === this.newConnectorPlatform)) {
          this.newConnectorPlatform = this.connectorPlatforms[0].id;
        }
      } catch (err) {
        this.connectorPlatforms = [];
        this.apiError = err.message;
      }
    },

    async createConnectorSession() {
      if (!this.requireLogin('添加平台账号')) return;
      this.apiLoading = true;
      try {
        const response = await MiniFish.api.connectors.createSession(this.newConnectorPlatform);
        this.connectorSession = response.data;
        this.showAddAccount = true;
        this.showToast('配对会话已创建，请在浏览器扩展中完成连接', 'info');
      } catch (err) {
        this.connectorSession = null;
        this.showToast(err.message || '创建平台配对会话失败', 'error');
      } finally {
        this.apiLoading = false;
      }
    },

    async loadTasks() {
      try {
        const response = await MiniFish.api.tasks.list();
        const items = response.data && response.data.items || [];
        this.dashboard.todos = items.map(task => ({
          id: task.id,
          text: task.title,
          done: task.status === 'done',
          status: task.status,
          priority: task.priority === 'medium' ? 'mid' : task.priority
        }));
        this.responseMeta.tasks = {
          meta: response.meta,
          request_id: response.request_id,
          status: response.status,
          accepted: response.accepted
        };
      } catch (err) {
        this.dashboard.todos = [];
        this.apiError = err.message;
      }
    },

    async loadNotifications() {
      if (!MiniFish.api.notifications || !this.isLoggedIn) return;
      try {
        const [listResponse, countResponse] = await Promise.all([
          MiniFish.api.notifications.list({ limit: 30 }),
          MiniFish.api.notifications.unreadCount()
        ]);
        this.notices = (listResponse.data && listResponse.data.items || []).map(item => ({
          id: item.id,
          type: item.type || 'info',
          tag: item.read_at ? '已读' : '未读',
          title: item.title,
          body: item.body,
          time: item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '',
          read: !!item.read_at
        }));
        this.unreadNotificationCount = Number(countResponse.data && countResponse.data.count || 0);
        this.responseMeta.notifications = {
          meta: listResponse.meta,
          request_id: listResponse.request_id,
          status: listResponse.status,
          accepted: listResponse.accepted
        };
      } catch (err) {
        this.notices = [];
        this.unreadNotificationCount = 0;
        this.apiError = err.message;
      }
    },

    async readNotification(notification) {
      if (!notification || notification.read) return;
      try {
        await MiniFish.api.notifications.mark(notification.id, true);
        notification.read = true;
        notification.tag = '已读';
        this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
      } catch (err) {
        this.showToast(err.message || '通知状态更新失败', 'error');
      }
    },

    async readAllNotifications() {
      try {
        await MiniFish.api.notifications.readAll();
        await this.loadNotifications();
      } catch (err) {
        this.showToast(err.message || '全部已读失败', 'error');
      }
    },

    async toggleTask(task) {
      if (!this.requireLogin('更新待办')) return;
      const previous = task.done;
      task.done = !task.done;
      try {
        await MiniFish.api.tasks.update(task.id, { status: task.done ? 'done' : 'open' });
      } catch (err) {
        task.done = previous;
        this.showToast(err.message || '待办更新失败', 'error');
      }
    },

    /** 切换账号并重新加载数据 */
    async switchToAccount(acc) {
      if (acc.id === this.activeCreatorAccountId && this.scope === 'account') return;
      this.activeCreatorAccountId = acc.id;
      this.scope = 'account';
      this.showUserMenu = false;
      this.showAccountSwitcher = false;
      this.showToast(`已切换到「${acc.name}」`, 'success');
      if (this.isLoggedIn) {
        await this.loadAllData();
      }
    },

    /** 加载所有面板数据 */
    async loadAllData() {
      this.apiLoading = true;
      this.apiError = null;
      await Promise.allSettled([
        this.loadDashboard(),
        this.loadTrends(),
        this.loadCoach(),
        this.loadAiUsage(),
        this.loadAiConnections(),
        this.loadSyncPolicy(),
        this.loadTasks(),
        this.loadNotifications(),
        this.loadConnectorPlatforms(),
        this.loadStudioData(),
        this.loadMediaData()
      ]);
      this.apiLoading = false;
      nextTick(() => this.renderCharts());
    },

    /** 加载仪表盘数据 */
    async loadDashboard() {
      this.setDataState('dashboard', 'loading');
      this.dashboard = this.blankDataShape(MiniFish.data.dashboard && MiniFish.data.dashboard.dashboard || {});
      this._dashboardSeries = null;
      try {
        const params = { ...this.apiBaseParams(), range: '7d' };
        const [overviewResponse, seriesResponse] = await Promise.all([
          MiniFish.api.dashboard.overview(params),
          MiniFish.api.dashboard.series(params)
        ]);
        const overview = overviewResponse.data;
        const series = seriesResponse.data;
        // 映射 overview 到 dashboard 数据
        if (overview) {
          const metricPresentation = {
            followers: { label: '粉丝总数', bg: 'linear-gradient(135deg,#6b8cb8,#4f6f99)' },
            views: { label: '播放量', bg: 'linear-gradient(135deg,#e8755e,#d96548)' },
            engagements: { label: '互动量', bg: 'linear-gradient(135deg,#7ba989,#5e8a6e)' },
            engagement_rate: { label: '互动率', bg: 'linear-gradient(135deg,#d4a04c,#b8862e)', percent: true },
            growth_rate: { label: '增长率', bg: 'linear-gradient(135deg,#9b8fd0,#7467ad)', percent: true }
          };
          this.dashboard.stats = Object.entries(overview.metrics || {}).map(([key, value]) => ({
            label: metricPresentation[key] && metricPresentation[key].label || key,
            value: metricPresentation[key] && metricPresentation[key].percent
              ? Number(value || 0).toLocaleString() + '%'
              : Number(value || 0).toLocaleString(),
            trend: 0,
            bg: metricPresentation[key] && metricPresentation[key].bg || '',
            icon: ''
          }));
          if (overview.health) {
            this.dashboard.todaySummary = {
              title: '当前数据健康度',
              score: overview.health.score || 0,
              scoreLabel: '数据健康度',
              scoreColor: overview.health.status === 'healthy' ? 'green' : 'yellow',
              highlights: []
            };
          }
          if (overview.fan_insights) {
            this.dashboard.fanInsights = [
              { label: '粉丝总数', value: Number(overview.fan_insights.total || 0).toLocaleString(), trend: '', status: 'green' },
              ...(overview.fan_insights.by_platform || []).map(item => ({
                label: this.reversePlatformName(item.platform),
                value: Number(item.value || 0).toLocaleString(),
                trend: '',
                status: 'blue'
              }))
            ];
          }
          if (overview.content_performance) {
            const best = overview.content_performance.best_items && overview.content_performance.best_items[0];
            this.dashboard.contentPerformance = {
              bestTitle: best && best.title || '暂无内容',
              bestViews: best ? Number(best.views || 0).toLocaleString() : '—',
              bestFavRate: best ? Number(best.engagements || 0).toLocaleString() : '—',
              tip: best && best.published_at ? '发布于 ' + new Date(best.published_at).toLocaleString('zh-CN') : ''
            };
          }
          if (overview.data_meta) {
            this.dashboard.dataMeta = {
              range: params.range,
              updateTime: overview.data_meta.updated_at ? new Date(overview.data_meta.updated_at).toLocaleString('zh-CN') : '',
              source: overview.data_meta.source || ''
            };
          }
        }
        // 存储 series 供图表使用
        this._dashboardSeries = series || null;
        const hasData = !!(overview && (
          (Array.isArray(overview.metrics) && overview.metrics.length) ||
          (overview.metrics && Object.keys(overview.metrics).length) ||
          overview.health
        ));
        this.setDataState('dashboard', hasData ? 'ready' : 'empty', null, overviewResponse);
      } catch (err) {
        this.setDataState('dashboard', 'error', err);
      }
    },

    async changeCreatorScope(value) {
      if (value === 'all') {
        this.scope = 'all';
        this.activeCreatorAccountId = null;
      } else {
        this.scope = 'account';
        this.activeCreatorAccountId = value;
      }
      await this.loadAllData();
    },

    /** 加载趋势情报数据 */
    async loadTrends() {
      this.setDataState('trends', 'loading');
      this.trendItems = [];
      this.candidatePool = [];
      this.activeTrendItem = null;
      try {
        const params = {
          platform: this.intelligencePlatform === '全部' ? undefined : this.mapPlatformName(this.intelligencePlatform),
          list_type: this.intelligenceTab === '实时热点' ? 'hot' : this.intelligenceTab === '上升榜' ? 'rising' : 'total',
          sort: this.intelligenceSort,
          range: '7d',
          limit: 50
        };
        const response = await MiniFish.api.trends.list(params);
        const data = response.data || {};
        const items = Array.isArray(data) ? data : (data.items || []);
        this.trendItems = items.map(t => this.mapTrendItem(t));
        this.setDataState('trends', this.trendItems.length ? 'ready' : 'empty', null, response);
        // 加载候选池
        try {
          const candidateResponse = await MiniFish.api.trends.candidates({ limit: 100 });
          const candidates = candidateResponse.data || {};
          const candidateItems = Array.isArray(candidates) ? candidates : (candidates.items || []);
          this.candidatePool = candidateItems.map(c => c.trend && c.trend.id).filter(Boolean);
          this.responseMeta.candidates = {
            meta: candidateResponse.meta,
            request_id: candidateResponse.request_id,
            status: candidateResponse.status,
            accepted: candidateResponse.accepted
          };
        } catch (err) {
          this.apiError = err.message;
        }
      } catch (err) {
        this.setDataState('trends', 'error', err);
      }
    },

    /** 加载趋势详情和热度曲线 */
    async loadTrendDetail(trendId) {
      try {
        const [detailResponse, seriesResponse] = await Promise.all([
          MiniFish.api.trends.detail(trendId),
          MiniFish.api.trends.series(trendId, { range: this.heatRange })
        ]);
        const detail = detailResponse.data;
        const series = seriesResponse.data;
        if (detail) {
          const mapped = this.mapTrendItem(detail);
          // 合并详情字段
          Object.assign(this.activeTrendItem || {}, mapped);
          this.activeTrendItem = { ...this.activeTrendItem, ...mapped };
        }
        // 存储 series 供图表使用
        this._trendSeries = series || null;
        nextTick(() => this.renderCharts());
      } catch (err) {
        this.apiError = err.message;
        this._trendSeries = null;
        this.showToast(err.message || '趋势详情加载失败', 'error');
      }
    },

    /** 加载素材库 */
    async loadMaterials() {
      this.setDataState('materials', 'loading');
      this.materials = [];
      try {
        const params = {
          platform: this.matPlatform === '全部' ? undefined : this.mapPlatformName(this.matPlatform),
          limit: 50
        };
        const response = await MiniFish.api.trends.materials(params);
        const data = response.data || {};
        this.materials = (data.items || []).map(m => ({
          id: m.id,
          platform: m.platform_label || this.reversePlatformName(m.platform),
          type: m.type,
          title: m.title,
          author: m.author_name,
          cover: m.cover_url || '',
          duration: m.duration_seconds,
          heat: m.heat_display || '',
          heatScore: m.heat_score || 0,
          tags: m.tags || [],
          capturedAt: m.captured_at
        }));
        this.setDataState('materials', this.materials.length ? 'ready' : 'empty', null, response);
      } catch (err) {
        this.setDataState('materials', 'error', err);
      }
    },

    /** 加载成长教练数据 */
    async loadCoach() {
      this.setDataState('coach', 'loading');
      this._coachOverview = null;
      this.allCases = [];
      this.caseSummary = null;
      try {
        const params = this.apiBaseParams();
        const [overview, casesSummary] = await Promise.allSettled([
          MiniFish.api.coach.overview(params),
          MiniFish.api.coach.casesSummary(params)
        ]);
        if (overview.status === 'fulfilled' && overview.value) {
          const overviewData = overview.value.data;
          this._coachOverview = overviewData;
          if (overviewData) {
            const profile = overviewData.profile || {};
            this.creatorProfile = {
              ...this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.creatorProfile || {}),
              id: overviewData.creator_account_id || '',
              name: this.currentAccount.name,
              contentHistorySummary: profile.summary || '',
              level: profile.level || '',
              score: profile.score || 0
            };
            this.skillScores = (overviewData.skill_scores || []).map(score => ({
              key: score.key,
              name: score.label,
              value: score.score,
              avg: score.score,
              tag: '',
              level: '',
              note: ''
            }));
            this.profileDiagnosis = (overviewData.diagnosis || []).join('；');
            this.routeSummary = {
              ...this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.routeSummary || {}),
              currentRoute: overviewData.route_summary && overviewData.route_summary.title || '',
              coreJudgment: overviewData.route_summary && overviewData.route_summary.description || '',
              progress: 0
            };
            this.growthPath = {
              summary: overviewData.route_summary && overviewData.route_summary.description || '',
              phases: (overviewData.growth_path || []).map(item => ({
                phase: '第' + item.day + '天',
                label: item.title,
                status: item.status,
                goal: '',
                tasks: [],
                kpi: ''
              })),
              risks: []
            };
          }
        }
        if (casesSummary.status === 'fulfilled' && casesSummary.value) {
          const summary = casesSummary.value.data;
          this.caseSummary = {
            ...this.blankDataShape(MiniFish.data.coach && MiniFish.data.coach.caseSummary || {}),
            totalCases: summary.total,
            excellentCount: summary.excellent,
            averageCount: summary.normal,
            failedCount: summary.failed
          };
        }
        // 加载案例列表
        try {
          const casesResponse = await MiniFish.api.coach.cases({ ...params, limit: 50 });
          const casesData = casesResponse.data || {};
          this.allCases = (casesData.items || []).map(c => this.mapCase(c));
        } catch (err) {
          this.apiError = err.message;
        }
        const overviewResponse = overview.status === 'fulfilled' ? overview.value : null;
        const hasData = !!this._coachOverview || this.allCases.length > 0;
        if (!hasData && overview.status === 'rejected') throw overview.reason;
        this.setDataState('coach', hasData ? 'ready' : 'empty', null, overviewResponse);
      } catch (err) {
        this.setDataState('coach', 'error', err);
      }
    },

    async createCoachSnapshot() {
      if (!this.requireLogin('更新成长画像')) return;
      try {
        const response = await MiniFish.api.coach.createSnapshot(this.apiBaseParams());
        const accepted = response.data || {};
        if (!response.accepted || !accepted.job_id) throw new Error('成长快照任务未被接受');
        this.showToast('成长画像更新任务已提交', 'info');
        MiniFish.api.jobs.subscribe(accepted.job_id, {
          onCompleted: async () => {
            await this.loadCoach();
            this.showToast('成长画像已更新', 'success');
          },
          onFailed: event => this.showToast(event.error && event.error.message || '成长画像更新失败', 'error'),
          onError: error => this.showToast(error.message || '成长画像状态获取失败', 'error')
        });
      } catch (err) {
        this.showToast(err.message || '成长画像更新失败', 'error');
      }
    },

    /** 加载 AI 用量数据 */
    async loadAiUsage() {
      this.setDataState('ai', 'loading');
      this.usageTable = [];
      this._aiUsageSummary = null;
      this._aiUsageSeries = null;
      this._aiUsageRecords = [];
      try {
        const [summary, seriesData, records] = await Promise.allSettled([
          MiniFish.api.ai.usageSummary({ range: '30d' }),
          MiniFish.api.ai.usageSeries({ range: '30d', granularity: 'day' }),
          MiniFish.api.ai.usageRecords({ limit: 20 })
        ]);
        if (summary.status === 'fulfilled' && summary.value) {
          const summaryData = summary.value.data;
          this._aiUsageSummary = summaryData;
          this.usageSummary = summaryData;
          // 更新用量表格
          if (summaryData && summaryData.by_model) {
            this.usageTable = summaryData.by_model.map(m => ({
              name: m.model_id,
              model: m.model_id,
              calls: m.calls,
              tokens: m.total_tokens,
              cost: m.estimated_cost,
              latency: null,
              success: null
            }));
          }
        }
        if (seriesData.status === 'fulfilled') {
          this._aiUsageSeries = seriesData.value.data;
        }
        if (records.status === 'fulfilled' && records.value) {
          this._aiUsageRecords = records.value.data && records.value.data.items || [];
        }
        const summaryResponse = summary.status === 'fulfilled' ? summary.value : null;
        if (summary.status === 'rejected' && seriesData.status === 'rejected' && records.status === 'rejected') throw summary.reason;
        this.setDataState('ai', this.usageTable.length ? 'ready' : 'empty', null, summaryResponse);
      } catch (err) {
        this.setDataState('ai', 'error', err);
      }
    },

    /** 加载真实 AI 连接和可用模型，覆盖演示模型列表 */
    async loadAiConnections() {
      try {
        const [connectionsResponse, modelsResponse, providersResponse] = await Promise.all([
          MiniFish.api.ai.connections(),
          MiniFish.api.ai.models(),
          MiniFish.api.ai.providers()
        ]);
        const connectionsPayload = connectionsResponse.data || {};
        const modelsPayload = modelsResponse.data || {};
        const connections = Array.isArray(connectionsPayload) ? connectionsPayload : (connectionsPayload.items || []);
        const models = Array.isArray(modelsPayload) ? modelsPayload : (modelsPayload.items || []);
        this.aiConnections = connections;
        this.availableProviders = Array.isArray(providersResponse.data) ? providersResponse.data : [];
        if (this.availableProviders.length && !this.availableProviders.some(p => p.id === this.newAiConnection.provider)) {
          this.newAiConnection.provider = this.availableProviders[0].id;
        }
        const registry = window.MiniFishProviderRegistry;
        const resolveProviderId = (pid) => {
          if (registry && registry.resolveLegacy(pid)) {
            return registry.resolveLegacy(pid).provider;
          }
          return pid;
        };
        const getProviderMeta = (pid) => {
          const resolved = resolveProviderId(pid);
          return registry ? registry.getProvider(resolved) : null;
        };
        const activeConnections = new Set((connections || [])
          .filter(c => c.status === 'active')
          .map(c => c.id));
        const modelRows = (models || []).filter(m => activeConnections.has(m.connection_id));
        const modelToMeta = (m) => {
          const meta = getProviderMeta(m.provider);
          const bg = meta ? meta.bg : '#737373';
          const short = meta ? meta.short : m.id.slice(0, 4);
          return {
            name: m.name || m.id,
            short,
            version: m.id,
            modelId: m.id,
            connectionId: m.connection_id,
            capabilities: m.capabilities || [],
            bg,
            active: true
          };
        };
        this.studio.modelList = modelRows.map(modelToMeta);
        if (this.studio.modelList.length && !this.studio.modelList.some(m => m.version === this.studio.selectedModelVersion)) {
          this.studio.selectedModel = this.studio.modelList[0].name;
          this.studio.selectedModelVersion = this.studio.modelList[0].version;
        }
        this.aiModels = modelRows.map(m => ({
          ...modelToMeta(m),
          status: 'online',
          statusText: '已连接'
        }));
      } catch (err) {
        this.aiModels = [];
        if (this.studio) this.studio.modelList = [];
        this.setDataState('ai', 'error', err);
      }
    },

    addModelFromInput() {
      const v = (this.newModelInput || '').trim();
      if (!v) return;
      if (!this.newAiConnection.models.includes(v)) {
        this.newAiConnection.models.push(v);
      }
      this.newModelInput = '';
    },

    removeModelFromNew(idx) {
      this.newAiConnection.models.splice(idx, 1);
    },

    togglePresetModel(m) {
      const arr = this.newAiConnection.models;
      const i = arr.indexOf(m);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(m);
    },

    fillPresetModels() {
      const p = this.currentProvider;
      if (!p || !p.models) return;
      p.models.forEach(m => {
        if (!this.newAiConnection.models.includes(m)) {
          this.newAiConnection.models.push(m);
        }
      });
    },

    prepareAiConnectionInput() {
      const c = this.newAiConnection;
      const invalid = message => {
        const error = new Error(message);
        error.code = 'VALIDATION_ERROR';
        throw error;
      };
      const provider = this.providerList.find(item => item.id === c.provider);
      const label = (c.label || '').trim();
      const secret = (c.secret || '').trim();
      const models = [...new Set((c.models || []).map(model => String(model).trim()).filter(Boolean))];
      const credentialTypes = provider && provider.credentialTypes || [];
      const region = (c.region || '').trim();
      const testModel = (c.test_model || '').trim();
      const baseUrl = (c.base_url || '').trim();

      if (!provider) invalid('请选择服务端支持的渠道类型');
      if (!label) invalid('请填写连接名称');
      if (label.length > 100) invalid('连接名称不能超过 100 个字符');
      if (!credentialTypes.includes(c.credential_type)) invalid('当前渠道不支持所选凭证类型');
      if (secret.length < 8 || secret.length > 8192) invalid('密钥长度必须为 8–8192 个字符');
      if (!models.length) invalid('请至少选择一个模型');
      if (models.length > 50) invalid('单个连接最多配置 50 个模型');
      if (models.some(model => model.length > 120)) invalid('模型名称不能超过 120 个字符');
      if (testModel.length > 120) invalid('测试模型名称不能超过 120 个字符');
      if (region && !['cn', 'sgp', 'eu'].includes(region)) invalid('区域必须是 cn、sgp 或 eu');

      if (baseUrl) {
        let parsed;
        try { parsed = new URL(baseUrl); } catch { invalid('API 地址必须是完整 URL'); }
        if (!['http:', 'https:'].includes(parsed.protocol)) invalid('API 地址仅支持 HTTP 或 HTTPS');
        if (parsed.username || parsed.password) invalid('API 地址不能包含用户名或密码');
        if (parsed.search || parsed.hash) invalid('API 地址不能包含查询参数或锚点');
        const localHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
        if (parsed.protocol !== 'https:' && !localHost) invalid('远程 API 地址必须使用 HTTPS');
      }

      const resolvedBaseUrl = baseUrl || (window.MiniFishProviderRegistry
        ? window.MiniFishProviderRegistry.resolveDefaultBaseUrl(c.provider, c.credential_type)
        : (provider && provider.defaultBaseUrl) || '');

      const payload = {
        provider: c.provider,
        label,
        credential_type: c.credential_type,
        models
      };
      if (region) payload.region = region;
      if (resolvedBaseUrl) payload.base_url = resolvedBaseUrl;
      if (testModel) payload.test_model = testModel;
      return { payload, secret, models };
    },

    async waitForAiConnectionVerification(jobId, timeoutMs = 60000) {
      const startedAt = Date.now();
      let lastRequestId = '';
      while (Date.now() - startedAt < timeoutMs) {
        const response = await MiniFish.api.jobs.get(jobId);
        lastRequestId = response.request_id || lastRequestId;
        const job = response.data || {};
        if (job.status === 'succeeded') return response;
        if (['failed', 'cancelled', 'dead_letter'].includes(job.status)) {
          const failure = job.last_error || {};
          throw new MiniFish.api.ApiError(
            failure.message || '模型连接验证失败',
            failure.code || `AI_VERIFY_${String(job.status || 'FAILED').toUpperCase()}`,
            0,
            response.request_id,
            failure
          );
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      throw new MiniFish.api.ApiError('验证任务仍在执行，请稍后在连接列表查看状态', 'AI_VERIFY_TIMEOUT', 0, lastRequestId);
    },

    async saveAiConnection() {
      if (!this.featureAvailability.aiConnectionCreate) {
        this.showToast('模型连接创建契约正在修正，当前入口已禁用', 'error');
        return;
      }
      if (this.aiConnectionSaving || this.apiLoading) return;
      let prepared;
      try {
        prepared = this.prepareAiConnectionInput();
      } catch (error) {
        const normalized = this.normalizeApiError(error);
        const message = this.formatApiError(error, '表单校验失败');
        this.aiConnectionSave = { state: 'error', stage: 'validation', message, code: normalized.code, request_id: '', connection_id: '', cleanup: '' };
        this.showToast('模型连接表单校验未通过', 'error', 3200);
        return;
      }

      const c = this.newAiConnection;
      let connection = null;
      let stage = 'create';
      this.aiConnectionSaving = true;
      this.aiConnectionSave = { state: 'saving', stage, message: '正在创建连接…', code: '', request_id: '', connection_id: '', cleanup: '' };
      try {
        const connectionResponse = await MiniFish.api.ai.createConnection(prepared.payload);
        connection = connectionResponse.data;
        if (!connection || !connection.id) {
          const error = new Error('后端未返回连接 ID');
          error.code = 'INVALID_RESPONSE';
          error.request_id = connectionResponse.request_id;
          throw error;
        }

        stage = 'secret';
        this.aiConnectionSave = { state: 'saving', stage, message: '连接已创建，正在加密保存密钥…', code: '', request_id: connectionResponse.request_id || '', connection_id: connection.id, cleanup: '' };
        await MiniFish.api.ai.putSecret(connection.id, prepared.secret);

        stage = 'verify_submit';
        this.aiConnectionSave = { state: 'saving', stage, message: '密钥已保存，正在提交连接验证…', code: '', request_id: '', connection_id: connection.id, cleanup: '' };
        const verificationResponse = await MiniFish.api.ai.testConnection(connection.id);
        const accepted = verificationResponse.data || {};
        if (!verificationResponse.accepted || !accepted.job_id) {
          const error = new Error('后端未接受连接验证任务');
          error.code = 'INVALID_RESPONSE';
          error.request_id = verificationResponse.request_id;
          throw error;
        }

        stage = 'verify_wait';
        this.aiConnectionSave = { state: 'saving', stage, message: '密钥已保存，正在验证模型连接…', code: '', request_id: verificationResponse.request_id || '', connection_id: connection.id, cleanup: '' };
        const verificationResult = await this.waitForAiConnectionVerification(accepted.job_id);
        c.secret = '';
        c.models = prepared.models;
        this.showAddModel = false;
        await this.loadAiConnections();
        const activeConnection = this.aiConnections.find(item => item.id === connection.id);
        if (!activeConnection || activeConnection.status !== 'active') {
          const error = new Error('验证任务已完成，但连接未进入 active 状态');
          error.code = 'AI_CONNECTION_STATUS_MISMATCH';
          error.request_id = verificationResult.request_id;
          throw error;
        }
        this.aiConnectionSave = {
          state: 'success',
          stage: 'completed',
          message: '模型连接已创建、保存密钥并通过验证，现已启用。',
          code: '',
          request_id: verificationResult.request_id || '',
          connection_id: connection.id,
          cleanup: ''
        };
        this.showToast('模型连接已保存并通过验证', 'success');
      } catch (err) {
        const normalized = this.normalizeApiError(err);
        const prefixes = {
          create: '创建连接失败',
          secret: '连接已创建，但密钥保存失败',
          verify_submit: '连接和密钥已保存，但验证任务提交失败',
          verify_wait: '连接和密钥已保存，但模型验证失败'
        };
        let cleanup = '';
        let suffix = '';

        if (stage === 'secret' && connection && connection.id) {
          try {
            await MiniFish.api.ai.removeConnection(connection.id);
            cleanup = 'rolled_back';
            suffix = '；已撤销本次未完成连接，可修正后重试';
          } catch {
            cleanup = 'unknown';
            suffix = '；未能确认未完成连接是否已清理，请刷新列表检查后再重试';
          }
        } else if (['verify_submit', 'verify_wait'].includes(stage) && connection && connection.id) {
          c.secret = '';
          this.showAddModel = false;
          suffix = '；连接与密钥已保留，可在列表中修正配置后重新测试';
        }

        if (connection && connection.id) await this.loadAiConnections();
        const message = this.formatApiError(err, prefixes[stage] || '保存模型连接失败') + suffix;
        this.aiConnectionSave = {
          state: ['verify_submit', 'verify_wait'].includes(stage) ? 'warning' : 'error',
          stage,
          message,
          code: normalized.code,
          request_id: normalized.request_id,
          connection_id: connection && connection.id || '',
          cleanup
        };
        const toastMessages = {
          create: '模型连接创建失败',
          secret: cleanup === 'rolled_back' ? '密钥保存失败，已撤销未完成连接' : '密钥保存失败，请检查连接列表',
          verify_submit: '连接已保存，但验证任务未提交',
          verify_wait: '连接已保存，但验证未通过'
        };
        this.showToast(toastMessages[stage] || '模型连接保存失败', 'error', 3600);
      } finally {
        this.aiConnectionSaving = false;
      }
    },

    /** 加载媒体分析详情 */
    async loadMediaAnalysis(analysisId) {
      this.setDataState('media', 'loading');
      this.transcript = [];
      this.keyframes = [];
      this.videoStructure = [];
      this.mediaAnalysisResult = null;
      try {
        const response = await MiniFish.api.media.analysisDetail(analysisId);
        const data = response.data;
        this.activeMediaAnalysis = data || null;
        if (data && data.status === 'succeeded') this.applyMediaAnalysis(data);
        if (data && ['failed', 'dead_letter'].includes(data.status)) {
          const failure = new Error(data.error && data.error.message || '媒体分析失败');
          failure.code = data.error && data.error.code;
          this.setDataState('media', 'error', failure, response);
          return;
        }
        if (data && ['queued', 'running'].includes(data.status)) {
          this.setDataState('media', 'loading', null, response);
          return;
        }
        const result = data && data.result;
        const hasData = !!(result && (result.summary || result.transcript || (result.keyframes || []).length || (result.structure || []).length));
        this.setDataState('media', hasData ? 'ready' : 'empty', null, response);
      } catch (err) {
        this.setDataState('media', 'error', err);
      }
    },

    formatMediaTime(seconds) {
      const value = Math.max(0, Number(seconds || 0));
      const minutes = Math.floor(value / 60);
      const remainder = Math.floor(value % 60);
      return String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
    },

    applyMediaAnalysis(analysis) {
      const result = analysis.result || {};
      this.transcript = result.transcript ? [{ time: '00:00', text: result.transcript, sent: 'neu' }] : [];
      this.keyframes = (result.keyframes || []).map(frame => ({
        time: this.formatMediaTime(frame.timestamp_seconds),
        image: '',
        gradient: 'linear-gradient(135deg,#302a28,#1c1c1c)',
        description: frame.description || '',
        tags: Array.isArray(frame.tags) ? frame.tags : []
      }));
      this.videoStructure = (result.structure || []).map(section => ({
        range: this.formatMediaTime(section.start_seconds) + '-' + this.formatMediaTime(section.end_seconds),
        stage: section.label,
        desc: section.description || ''
      }));
      this.mediaAnalysisResult = result;
      nextTick(() => this.renderCharts());
    },

    async loadMediaData() {
      if (!this.isLoggedIn || !MiniFish.api.media) return;
      try {
        const [response, assetResponse] = await Promise.all([
          MiniFish.api.media.analyses(),
          MiniFish.api.media.assets()
        ]);
        const items = response.data && response.data.items || [];
        this.mediaAnalyses = items;
        this.mediaAssets = assetResponse.data && assetResponse.data.items || [];
        const latest = items[0];
        if (latest) {
          await this.loadMediaAnalysis(latest.id);
          if (['queued', 'running'].includes(latest.status)) this.pollMediaResource('analysis', latest.id, 0).catch(err => {
            this.apiLoading = false;
            this.setDataState('media', 'error', err);
          });
        }
        else {
          this.activeMediaAnalysis = null;
          this.setDataState('media', 'empty', null, response);
        }
      } catch (err) {
        this.setDataState('media', 'error', err);
      }
    },

    async pollMediaResource(kind, id, attempt) {
      attempt = attempt || 0;
      const response = kind === 'analysis'
        ? await MiniFish.api.media.analysisDetail(id)
        : await MiniFish.api.media.transcription(id);
      const resource = response.data;
      this.activeMediaAnalysis = resource || null;
      if (!resource || !resource.status) throw new Error('媒体任务返回格式无效');
      if (resource.status === 'succeeded') {
        if (kind === 'analysis') this.applyMediaAnalysis(resource);
        else {
          const result = resource.result || {};
          this.transcript = (result.segments || []).map(segment => ({
            time: this.formatMediaTime(segment.start_seconds),
            text: segment.text,
            sent: 'neu'
          }));
          if (!this.transcript.length && (resource.text || result.text)) {
            this.transcript = [{ time: '00:00', text: resource.text || result.text, sent: 'neu' }];
          }
        }
        this.apiLoading = false;
        this.setDataState('media', 'ready', null, response);
        this.showToast(kind === 'analysis' ? '音视频分析完成' : '语音转写完成', 'success');
        return;
      }
      if (['failed', 'cancelled', 'dead_letter'].includes(resource.status)) {
        throw new Error(resource.error && resource.error.message || '媒体处理失败');
      }
      this.setDataState('media', 'loading', null, response);
      if (attempt >= 240) throw new Error('媒体处理等待超时，任务仍可从分析记录继续查看');
      setTimeout(() => this.pollMediaResource(kind, id, attempt + 1).catch(err => {
        this.apiLoading = false;
        this.setDataState('media', 'error', err);
        this.showToast(err.message, 'error');
      }), 2000);
    },

    resolveMediaContentType(file) {
      if (file.type) return file.type;
      const extension = String(file.name || '').split('.').pop().toLowerCase();
      return { mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', wmv: 'video/x-ms-wmv', mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', m4a: 'audio/mp4', ogg: 'audio/ogg' }[extension] || '';
    },

    /** 上传真实音视频并执行 MiMo 2.5 多模态分析 */
    async uploadAndAnalyze(event) {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file || !this.isLoggedIn || !MiniFish.api.media) {
        if (!this.isLoggedIn) this.showToast('请先登录后上传媒体', 'error');
        return;
      }
      const contentType = this.resolveMediaContentType(file);
      const isVideo = contentType.startsWith('video/');
      const isAudio = contentType.startsWith('audio/');
      if (!isVideo && !isAudio) {
        this.showToast('请选择支持的 MP4/MOV/AVI/WMV 或 MP3/WAV/FLAC/M4A/OGG 文件', 'error');
        return;
      }
      const maxBytes = 37 * 1024 * 1024;
      if (file.size > maxBytes) {
        this.showToast('音视频原文件不能超过 37 MiB', 'error');
        return;
      }
      this.apiLoading = true;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('文件读取失败'));
          reader.readAsDataURL(file);
        });
        const normalizedDataUrl = String(dataUrl).replace(/^data:[^;,]+;base64,/, 'data:' + contentType + ';base64,');
        const assetResponse = await MiniFish.api.media.createAsset({ file_name: file.name, content_type: contentType, data_base64: normalizedDataUrl });
        const asset = assetResponse.data;
        if (!asset || !asset.id) throw new Error('媒体上传未返回资源 ID');
        const resultResponse = await MiniFish.api.media.analyze(
          { asset_id: asset.id, fps: isVideo ? 2 : undefined, media_resolution: isVideo ? 'default' : undefined },
          MiniFish.api.withIdempotency()
        );
        const accepted = resultResponse.data || {};
        if (!accepted.analysis_id || !accepted.job_id) throw new Error('分析任务未返回 analysis_id/job_id');
        this.activeMediaAnalysis = { id: accepted.analysis_id, asset_id: asset.id, job_id: accepted.job_id, status: accepted.status || 'queued', created_at: new Date().toISOString() };
        this.setDataState('media', 'loading', null, resultResponse);
        this.showToast(accepted.status === 'running' ? '分析任务运行中' : '分析任务已排队', 'info');
        await this.pollMediaResource('analysis', accepted.analysis_id, 0);
        nextTick(() => this.renderCharts());
      } catch (err) {
        this.apiLoading = false;
        this.showToast(err.message || '媒体处理失败', 'error');
      } finally {}
    },

    /** 触发同步并订阅 SSE */
    async syncAndReload() {
      if (!this.isLoggedIn) { this.showToast('请先登录', 'error'); return; }
      this.apiLoading = true;
      try {
        const idempotencyKey = crypto.randomUUID();
        let jobId;
        if (this.scope === 'account' && this.activeCreatorAccountId) {
          const response = await MiniFish.api.post('/creator-accounts/' + this.activeCreatorAccountId + '/syncs', {}, {}, MiniFish.api.withIdempotency(idempotencyKey));
          jobId = response.data && response.data.job_id;
        } else {
          const response = await MiniFish.api.post('/sync-runs', {}, {}, MiniFish.api.withIdempotency(idempotencyKey));
          jobId = response.data && response.data.job_id;
        }
        if (!jobId) { this.showToast('同步任务创建失败', 'error'); return; }
        this.showToast('同步任务已启动…', 'info');
        // 订阅 SSE
        MiniFish.api.subscribeJobEvents(jobId, {
          onProgress: (evt) => {
            if (evt.message) this.showToast(evt.message, 'info');
          },
          onCompleted: async () => {
            this.showToast('同步完成，正在刷新数据', 'success');
            this.apiLoading = false;
            await this.loadAllData();
          },
          onFailed: (evt) => {
            this.apiLoading = false;
            this.showToast(evt.message || '同步失败', 'error');
          },
          onError: () => {
            this.apiLoading = false;
            this.showToast('同步连接异常', 'error');
          }
        });
      } catch (err) {
        this.apiLoading = false;
        this.showToast(err.message || '同步请求失败', 'error');
      }
    },

    // ======== 数据映射工具 ========

    /** 平台中文名 → API 枚举 */
    mapPlatformName(name) {
      const map = { '抖音': 'douyin', '小红书': 'xiaohongshu', 'B站': 'bilibili' };
      return map[name] || name;
    },
    /** API 枚举 → 平台中文名 */
    reversePlatformName(key) {
      const map = { douyin: '抖音', xiaohongshu: '小红书', bilibili: 'B站' };
      return map[key] || key;
    },

    /** 趋势条目映射 */
    mapTrendItem(t) {
      return {
        id: t.id,
        platform: t.platform_label || this.reversePlatformName(t.platform),
        listType: t.list_type || 'hot',
        title: t.title,
        tags: t.tags || [],
        heat: Number(t.heat_score || 0).toLocaleString(),
        heatScore: t.heat_score || 0,
        growthRate: t.growth_score || 0,
        category: t.category || '',
        source: t.source_url || '',
        riskLevel: t.risk_level || 'unknown',
        lifecycle: t.lifecycle || '',
        competition: t.competition_level || '',
        competitionScore: t.competition_score || 0,
        whyHot: t.why_hot || '',
        whyOpportunity: t.why_opportunity || '',
        opportunityScore: t.opportunity_score || 0,
        bestPlatforms: (t.best_platforms || []).map(bp => ({ name: bp.platform_label || this.reversePlatformName(bp.platform), fit: bp.fit_score })),
        commonAngles: t.common_angles || [],
        materialReady: Number(t.material_readiness || 0),
        materialNote: '',
        benchmarkCase: t.benchmark_case || '',
        relatedTopics: t.related_topics || [],
        keyPoints: (t.key_points || []).map(kp => ({ date: kp.occurred_at, text: kp.description })),
        confidence: t.confidence,
        scoringVersion: t.scoring_version,
        observedAt: t.observed_at,
        coverUrl: t.cover_url || '',
        sourceUrl: t.source_url || ''
      };
    },

    /** 案例映射 */
    mapCase(c) {
      return {
        id: c.id,
        category: c.category === 'normal' ? 'average' : c.category,
        title: c.title,
        platform: this.reversePlatformName(c.platform),
        cover: c.cover_url || '',
        summary: c.summary || '',
        views: Number(c.views || 0).toLocaleString(),
        likes: '—',
        favorites: '—',
        comments: '—',
        engagementRate: c.engagement_rate == null ? '—' : (Number(c.engagement_rate) * 100).toFixed(2) + '%',
        metrics: { views: c.views, engagements: c.engagements, engagement_rate: c.engagement_rate },
        publishedAt: c.published_at,
        diagnosis: {
          verdict: '', bars: [], strengths: [], weaknesses: [], takeaways: [], actions: []
        }
      };
    },

    // ---- 数据情报 ----
    setIntelligenceSort(mode) {
      this.intelligenceSort = mode;
      const label = mode === 'opportunity' ? '机会分排序' : mode === 'heat' ? '热度排序' : '增长排序';
      this.showToast(`已切换为${label}`, 'info');
    },
    setHeatRange(range) {
      this.heatRange = range;
      const label = range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天';
      this.showToast(`已切换至${label}热度趋势`, 'info');
      if (this.isLoggedIn && this.activeTrendItem && this.activeTrendItem.id) {
        this.loadTrendDetail(this.activeTrendItem.id);
      }
    },
    evaluateTopic() {
      if (!this.requireLogin('选题评估')) return;
      this.topicEvaluation = null;
      this.showToast('自由文本市场评估没有后端接口，请从趋势候选池发起账号适配评估', 'error');
    },
    useTrendIdea(item) {
      this.studio.prompt = `围绕「${item.title}」写一篇${item.platform}内容方案，突出${item.whyOpportunity || item.whyHot}，给出标题、结构和发布建议。`;
      this.currentPanel = 'studio';
      nextTick(() => this.renderCharts());
      this.showToast('已带入内容创作台', 'success');
    },
    selectTrendItem(item) {
      this.activeTrendItem = item;
      if (this.isLoggedIn && item && item.id) {
        this.loadTrendDetail(item.id);
      }
    },
    async addToCandidatePool(item) {
      if (!this.requireLogin('修改候选池')) return;
      if (this.candidatePool.includes(item.id)) {
        // 已在候选池 → 移除
        try { await MiniFish.api.trends.removeCandidate(item.id); }
        catch (err) { this.showToast(err.message || '移出候选池失败', 'error'); return; }
        const idx = this.candidatePool.indexOf(item.id);
        this.candidatePool.splice(idx, 1);
        this.showToast('已从候选池移除', 'info');
        return;
      }
      // 加入候选池
      try { await MiniFish.api.trends.addCandidate(item.id); }
      catch (err) { this.showToast(err.message || '加入候选池失败', 'error'); return; }
      this.candidatePool.push(item.id);
      this.showToast(`「${item.title.slice(0,12)}...」已加入候选池`, 'success');
    },
    isInCandidatePool(item) {
      return this.candidatePool.includes(item.id);
    },
    viewMarketDetail(item) {
      this.activeTrendItem = item;
      this.candidatePoolVisible = false;
      this.currentPanel = 'intelligence';
      if (this.isLoggedIn) this.loadTrendDetail(item.id);
    },
    openCandidatePool() {
      this.candidatePoolVisible = true;
    },
    closeCandidatePool() {
      this.candidatePoolVisible = false;
    },
    async removeFromCandidatePool(item) {
      if (!this.requireLogin('修改候选池')) return;
      try { await MiniFish.api.trends.removeCandidate(item.id); }
      catch (err) { this.showToast(err.message || '移出候选池失败', 'error'); return; }
      const idx = this.candidatePool.indexOf(item.id);
      if (idx >= 0) this.candidatePool.splice(idx, 1);
      this.showToast('已从候选池移除', 'info');
    },
    async adoptCandidate(item) {
      if (!this.requireLogin('账号适配评估')) return;
      this.assessmentLoading = true;
      this.activeAssessment = null;
      try {
        const body = { trend_id: item.id };
        if (this.scope === 'account' && this.activeCreatorAccountId) body.creator_account_id = this.activeCreatorAccountId;
        const response = await MiniFish.api.coach.createAssessment(body);
        const accepted = response.data || {};
        if (!response.accepted || !accepted.job_id || !accepted.resource_id) throw new Error('评估任务未被接受');
        this.showToast('账号适配评估已提交', 'info');
        MiniFish.api.jobs.subscribe(accepted.job_id, {
          onCompleted: async () => {
            try {
              const resultResponse = await MiniFish.api.coach.assessment(accepted.resource_id);
              this.activeAssessment = resultResponse.data;
              this.showToast('账号适配评估完成，请确认后加入计划', 'success');
            } catch (err) {
              this.showToast(err.message || '评估结果读取失败', 'error');
            } finally {
              this.assessmentLoading = false;
            }
          },
          onFailed: event => {
            this.assessmentLoading = false;
            this.showToast(event.error && event.error.message || '账号适配评估失败', 'error');
          },
          onError: error => {
            this.assessmentLoading = false;
            this.showToast(error.message || '评估状态连接失败', 'error');
          }
        });
      } catch (err) {
        this.assessmentLoading = false;
        this.showToast(err.message || '账号适配评估失败', 'error');
      }
    },
    async confirmAssessmentAdoption() {
      if (!this.activeAssessment || this.activeAssessment.status !== 'succeeded') return;
      this.assessmentLoading = true;
      try {
        await MiniFish.api.coach.adoptAssessment(this.activeAssessment.id, {});
        await this.loadTasks();
        this.activeAssessment = null;
        this.candidatePoolVisible = false;
        this.showToast('已加入本周计划', 'success');
      } catch (err) {
        this.showToast(err.message || '加入本周计划失败', 'error');
      } finally {
        this.assessmentLoading = false;
      }
    },
    getRouteProgress(route) {
      if (!route.stages || route.stages.length === 0) return 0;
      const total = route.stages.length;
      const done = route.stages.filter(s => s.status === 'done').length;
      const nowIdx = route.stages.findIndex(s => s.status === 'now');
      if (nowIdx >= 0) {
        return Math.round(((done + 0.15) / total) * 100);
      }
      return Math.round((done / total) * 100);
    },

    // ---- 平台凭据 ----
    async checkCredential(account) {
      if (!this.requireLogin('检测平台凭据')) return;
      this.apiLoading = true;
      try {
        const response = await MiniFish.api.accounts.credentialCheck(account.id);
        const jobId = response.data && response.data.job_id;
        if (!response.accepted || !jobId) throw new Error('凭据检测任务未被接受');
        this.showToast('凭据检测任务已提交', 'info');
        MiniFish.api.jobs.subscribe(jobId, {
          onCompleted: async () => {
            this.apiLoading = false;
            await this.loadCreatorAccounts();
            this.showToast('凭据检测完成', 'success');
          },
          onFailed: event => {
            this.apiLoading = false;
            this.showToast(event.error && event.error.message || '凭据检测失败', 'error');
          },
          onError: error => {
            this.apiLoading = false;
            this.showToast(error.message || '凭据检测连接失败', 'error');
          }
        });
      } catch (err) {
        this.apiLoading = false;
        this.showToast(err.message || '凭据检测失败', 'error');
      }
    },
    async switchAccountById(accountId) {
      const account = this.creatorAccounts.find(item => item.id === accountId);
      if (!account) return;
      if (['expired', 'invalid'].includes(account.credential_status)) {
        this.showToast('该凭据已失效，请等待重新连接功能开放', 'error');
        return;
      }
      await this.switchToAccount(this.presentCreatorAccount(account));
    },
    async deleteAccount(account) {
      if (!this.requireLogin('删除平台账号')) return;
      const name = account.name || account.display_name || account.platform_username || account.platform || '该账号';
      if (!confirm(`确定要删除「${name}」吗？删除后该平台的Cookie凭据将被永久移除，此操作不可撤销。`)) return;
      this.apiLoading = true;
      try {
        await MiniFish.api.accounts.remove(account.id);
        await this.loadCreatorAccounts();
        this.showToast(`已删除「${name}」`, 'success');
      } catch (err) {
        this.showToast(err.message || '删除账号失败', 'error');
      } finally {
        this.apiLoading = false;
      }
    },

    // ---- AI 模型 ----
    providerLabel(providerId) {
      const provider = this.availableProviders.find(item => item.id === providerId);
      return provider && provider.name || ({ deepseek: 'DeepSeek', opencode_go: 'OpenCode Go', xiaomi_mimo: '小米 MiMo' }[providerId] || providerId);
    },
    async testConnection(connection) {
      if (!this.requireLogin('测试模型连接')) return;
      if (!connection || !connection.id) {
        this.showToast('连接信息无效', 'error');
        return;
      }
      this.showToast(`正在测试 ${connection.label}…`, 'info');
      try {
        const response = await MiniFish.api.ai.testConnection(connection.id);
        const jobId = response.data && response.data.job_id;
        if (!response.accepted || !jobId) throw new Error('连接测试任务未被接受');
        MiniFish.api.jobs.subscribe(jobId, {
          onCompleted: async () => {
            await this.loadAiConnections();
            this.showToast(`${connection.label} 连接测试完成`, 'success');
          },
          onFailed: event => this.showToast(event.error && event.error.message || '连接测试失败', 'error'),
          onError: error => this.showToast(error.message || '连接测试状态获取失败', 'error')
        });
      } catch (err) {
        this.showToast(err.message || `${connection.label} 连接测试失败`, 'error');
      }
    },
    async toggleConnection(connection) {
      if (!this.requireLogin('修改模型连接')) return;
      const nextStatus = connection.status === 'active' ? 'disabled' : 'active';
      try {
        await MiniFish.api.ai.updateConnection(connection.id, { status: nextStatus });
        await this.loadAiConnections();
      } catch (err) {
        this.showToast(err.message || '连接状态更新失败', 'error');
      }
    },
    async removeConnection(connection) {
      if (!this.requireLogin('删除模型连接')) return;
      try {
        await MiniFish.api.ai.removeConnection(connection.id);
        await this.loadAiConnections();
        this.showToast('模型连接已删除', 'success');
      } catch (err) {
        this.showToast(err.message || '删除模型连接失败', 'error');
      }
    },
    toggleCompare(m) {
      if (!m.active) return;
      const id = m.modelId || m.version;
      const i = this.compareModels.indexOf(id);
      if (i >= 0) {
        if (this.compareModels.length > 1) this.compareModels.splice(i, 1);
      } else if (this.compareModels.length < 3) {
        this.compareModels.push(id);
      } else {
        this.showToast('最多对比 3 个模型', 'error');
      }
    },
    async runCompare() {
      this.compareResults = [];
      if (!this.requireLogin('多模型对比')) return;
      if (this.compareModels.length < 2 || this.compareModels.length > 3) {
        this.showToast('请选择 2–3 个已验证模型', 'error');
        return;
      }
      if (!(this.comparePrompt || '').trim()) {
        this.showToast('请输入创作需求', 'error');
        return;
      }
      const selections = this.compareModels.map(modelId => {
        const model = this.aiModels.find(item => item.modelId === modelId);
        return model && { connection_id: model.connectionId, model_id: model.modelId };
      }).filter(Boolean);
      if (selections.length !== this.compareModels.length) {
        this.showToast('模型连接信息不完整，请刷新模型列表', 'error');
        return;
      }
      try {
        const response = await MiniFish.api.ai.createComparison({
          prompt: this.comparePrompt.trim(),
          selections
        });
        const accepted = response.data || {};
        if (!response.accepted || !accepted.job_id || !accepted.resource_id) throw new Error('对比任务未被接受');
        this.showToast('多模型对比任务已提交', 'info');
        MiniFish.api.jobs.subscribe(accepted.job_id, {
          onCompleted: async () => {
            try {
              const resultResponse = await MiniFish.api.ai.comparisonResult(accepted.resource_id);
              const comparison = resultResponse.data;
              this.compareResults = (comparison.result && comparison.result.results || []).map(result => ({
                model: this.aiModels.find(item => item.modelId === result.model_id)?.name || result.model_id,
                modelId: result.model_id,
                bg: this.aiModels.find(item => item.modelId === result.model_id)?.bg || '#737373',
                status: result.status,
                content: result.text || ''
              }));
              this.showToast('多模型对比完成', 'success');
            } catch (err) {
              this.showToast(err.message || '对比结果读取失败', 'error');
            }
          },
          onFailed: event => this.showToast(event.error && event.error.message || '多模型对比失败', 'error'),
          onError: error => this.showToast(error.message || '对比任务状态获取失败', 'error')
        });
      } catch (err) {
        this.showToast(err.message || '多模型对比失败', 'error');
      }
    },

    escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    mapStudioMessage(message) {
      const text = message.content && message.content.text || '';
      if (message.role === 'user') {
        return { id: message.id, role: 'user', content: text, createdAt: message.created_at };
      }
      return {
        id: message.id,
        role: message.role,
        elapsed: '',
        feedback: message.feedback || null,
        plainText: text,
        blocks: [{ type: 'result', plainText: text, content: this.escapeHtml(text).replace(/\n/g, '<br>') }],
        createdAt: message.created_at
      };
    },

    async loadStudioData() {
      if (!this.isLoggedIn || !MiniFish.api.studio) return;
      this.setDataState('studio', 'loading');
      try {
        const response = await MiniFish.api.studio.sessions();
        const sessions = response.data && response.data.items || [];
        this.studio.sessions = sessions;
        if (!sessions.length) {
          this.studio.messages = [];
          this.studio.sessionId = null;
          this.studio.outputFiles = [];
          this.setDataState('studio', 'empty', null, response);
          return;
        }
        const active = sessions.find(item => item.id === this.studio.sessionId) || sessions[0];
        await this.loadStudioSession(active.id);
        this.setDataState('studio', 'ready', null, response);
      } catch (err) {
        this.studio.messages = [];
        this.studio.outputFiles = [];
        this.setDataState('studio', 'error', err);
      }
    },

    async loadStudioSession(sessionId) {
      const [sessionResponse, messagesResponse, artifactsResponse] = await Promise.all([
        MiniFish.api.studio.session(sessionId),
        MiniFish.api.studio.messages(sessionId),
        MiniFish.api.studio.artifacts(sessionId)
      ]);
      const session = sessionResponse.data;
      this.studio.sessionId = session.id;
      this.studio.sessionTitle = session.title;
      this.studio.messages = (messagesResponse.data && messagesResponse.data.items || []).map(message => this.mapStudioMessage(message));
      this.applyStudioArtifacts(artifactsResponse.data && artifactsResponse.data.items || []);
      this.$nextTick(() => this.studioScrollToBottom());
    },

    applyStudioArtifacts(items) {
      this.studio.outputFiles = items.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        type: artifact.kind === 'markdown' ? 'md' : artifact.kind,
        contentType: artifact.content_type,
        byteSize: artifact.byte_size,
        createdAt: artifact.created_at
      }));
      this.studio.allFilesCount = items.length;
      this.studio.moreFilesCount = 0;
      this.studio.previewTabs = [{ key: 'md', label: '文本' }];
      this.studio.previewTab = 'md';
    },

    async finishStudioRun(runId) {
      const response = await MiniFish.api.studio.getRun(runId);
      const run = response.data;
      if (run.status === 'succeeded') {
        await this.loadStudioSession(run.session_id);
        this.studio.runError = null;
        this.studio.activeRunId = null;
        this.setDataState('studio', 'ready', null, response);
        this.showToast('内容生成完成', 'success');
      } else if (['failed', 'cancelled', 'dead_letter'].includes(run.status)) {
        const failure = new Error(run.error && run.error.message || '内容生成失败');
        failure.code = run.error && run.error.code || 'STUDIO_RUN_FAILED';
        failure.request_id = response.request_id || '';
        this.setStudioRunError(failure);
        this.studio.activeRunId = null;
        throw failure;
      }
      return run;
    },

    async reconcileStudioRunEvent(runId) {
      const run = await this.finishStudioRun(runId);
      if (['queued', 'running'].includes(run.status)) {
        this.pollStudioRun(runId, 0);
        return false;
      }
      return true;
    },

    async pollStudioRun(runId, attempt) {
      attempt = attempt || 0;
      if (this.studio.activeRunId !== runId) return;
      try {
        const run = await this.finishStudioRun(runId);
        if (['queued', 'running'].includes(run.status) && attempt < 20) {
          setTimeout(() => this.pollStudioRun(runId, attempt + 1), 2000);
          return;
        }
        if (['queued', 'running'].includes(run.status)) {
          const timeout = new Error('任务仍在运行，请稍后刷新会话确认最终状态');
          timeout.code = 'STUDIO_STATUS_TIMEOUT';
          this.setStudioRunError(timeout);
        }
        this.studio.isRunning = false;
        this.studio.runningStatus = '';
      } catch (err) {
        this.studio.isRunning = false;
        this.studio.runningStatus = '';
        this.setStudioRunError(err);
        this.showToast(err.message || '内容生成失败', 'error');
      }
    },

    // ---- 创作台 (Codex 风格) ----
    async studioSend() {
      const prompt = this.studio.prompt.trim();
      if (!prompt || this.studio.isRunning) return;
      if (!this.requireLogin('创作台生成')) return;
      if (!this.featureAvailability.studioRun) {
        this.showToast('创作台流式接口尚未冻结，当前发送入口已禁用', 'error');
        return;
      }

      this.studio.showModelMenu = false;
      this.studio.showFilesMenu = false;

      if (!this.studio.sessionTitle) {
        this.studio.sessionTitle = prompt.length > 20 ? prompt.slice(0, 20) + '…' : prompt;
      }

      this.studio.messages.push({ role: 'user', content: prompt });
      this.studio.prompt = '';

      this.$nextTick(() => {
        if (this.$refs.codexInput) {
          this.$refs.codexInput.style.height = 'auto';
        }
        this.studioScrollToBottom();
      });

      this.studio.isRunning = true;
      this.studio.runningStatus = '正在分析需求…';
      this.studio.streamingBlocks = [];
      this.studio.runError = null;
      this.studio.activeRunId = null;
      this.studio.currentOutput = 'draft.md';

      // 登录后创作台只走真实服务端会话、Run 与 SSE。
      if (this.isLoggedIn && this.apiReady && MiniFish.api.studio) {
        try {
          if (!this.studio.sessionId) {
            const sessionResponse = await MiniFish.api.studio.createSession({ title: this.studio.sessionTitle || '新会话' });
            const session = sessionResponse.data;
            this.studio.sessionId = session.id;
          }
          const mode = this.studio.accessMode === 'strict' ? 'strict' : 'auto';
          const body = {
            prompt,
            mode,
            reasoning_effort: this.studio.reasoningLevel === '超高' ? 'max' : this.studio.reasoningLevel === '高' ? 'high' : this.studio.reasoningLevel === '中' ? 'medium' : 'low'
          };
          if (this.scope === 'account' && this.activeCreatorAccountId) body.creator_account_id = this.activeCreatorAccountId;
          if (mode === 'strict') {
            const selected = this.studio.modelList.find(model => model.version === this.studio.selectedModelVersion);
            if (!selected) throw new Error('Strict 模式必须选择已验证模型');
            body.model_id = selected.modelId;
            body.connection_id = selected.connectionId;
          }
          const runResponse = await MiniFish.api.studio.run(this.studio.sessionId, body);
          const accepted = runResponse.data || {};
          if (!runResponse.accepted || !accepted.resource_id) throw new Error('创作任务未被接受');
          const runId = accepted.resource_id;
          this.studio.activeRunId = runId;
          this.studio.runningStatus = '任务已排队…';
          MiniFish.api.studio.subscribeRun(runId, {
            onProgress: event => { this.studio.runningStatus = event.message || '正在生成…'; },
            onDelta: event => {
              this.studio.runningStatus = '正在接收生成内容…';
              if (event.text) this.studio.streamingBlocks = [{ type: 'text', content: this.escapeHtml(event.text).replace(/\n/g, '<br>') }];
            },
            onCompleted: async () => {
              let terminal = false;
              try {
                terminal = await this.reconcileStudioRunEvent(runId);
              } catch (err) {
                terminal = true;
                this.setStudioRunError(err);
                this.showToast(err.message || '内容生成失败', 'error');
              } finally {
                if (terminal) {
                  this.studio.isRunning = false;
                  this.studio.runningStatus = '';
                  this.studio.streamingBlocks = [];
                }
              }
            },
            onFailed: async event => {
              let terminal = false;
              try {
                terminal = await this.reconcileStudioRunEvent(runId);
              } catch (err) {
                terminal = true;
                const failure = event.error || err;
                this.setStudioRunError(failure, '内容生成失败');
                this.showToast(failure.message || '内容生成失败', 'error');
              } finally {
                if (terminal) {
                  this.studio.isRunning = false;
                  this.studio.runningStatus = '';
                  this.studio.streamingBlocks = [];
                }
              }
            },
            onFallback: () => this.pollStudioRun(runId, 0),
            onError: async error => {
              let terminal = false;
              try {
                terminal = await this.reconcileStudioRunEvent(runId);
              } catch (reconcileError) {
                terminal = true;
                const failure = reconcileError || error;
                this.setStudioRunError(failure, '创作任务状态连接失败');
                this.showToast(failure.message || '创作任务状态连接失败', 'error');
              } finally {
                if (terminal) {
                  this.studio.isRunning = false;
                  this.studio.runningStatus = '';
                  this.studio.streamingBlocks = [];
                }
              }
            }
          });
        } catch (err) {
          this.studio.isRunning = false;
          this.studio.runningStatus = '';
          this.studio.streamingBlocks = [];
          this.setStudioRunError(err);
          this.showToast(err.message || '模型调用失败', 'error');
        }
        return;
      }

      this.studio.isRunning = false;
      this.studio.runningStatus = '';
      this.setStudioRunError(new Error('Studio API 不可用'));
      this.showToast('Studio API 不可用', 'error');
    },

    studioNewSession() {
      this.studio.messages = [];
      this.studio.sessionId = null;
      this.studio.sessionTitle = '';
      this.studio.currentOutput = '';
      this.studio.isRunning = false;
      this.studio.runningStatus = '';
      this.studio.streamingBlocks = [];
      this.studio.activeRunId = null;
      this.studio.runError = null;
      this.studio.prompt = '';
      this.studio.outputFiles = [];
    },

    studioAutoResize(e) {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    },

    studioToggleModelMenu() {
      this.studio.showModelMenu = !this.studio.showModelMenu;
      if (this.studio.showModelMenu) {
        this.$nextTick(() => {
          const btn = this.$refs.modelBtn;
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          const menuWidth = 280;
          const menu = btn.closest('.codex-model-selector').querySelector('.codex-model-menu');
          const contentHeight = menu ? menu.scrollHeight : 500;
          const gap = 8;
          const availableAbove = rect.top - gap - 10;
          const availableBelow = window.innerHeight - rect.bottom - gap - 70;
          let top, left, maxH;
          left = rect.right - menuWidth;
          if (left < 8) left = 8;
          if (availableAbove >= contentHeight || availableAbove >= availableBelow) {
            // 显示在按钮上方
            maxH = Math.min(contentHeight, availableAbove);
            top = rect.top - maxH - gap;
          } else {
            // 显示在按钮下方
            maxH = Math.min(contentHeight, availableBelow);
            top = rect.bottom + gap;
          }
          this.studio.menuStyle = { top: top + 'px', left: left + 'px', maxHeight: maxH + 'px' };
        });
      }
    },

    studioToggleFilesMenu() {
      this.studio.showFilesMenu = !this.studio.showFilesMenu;
      if (this.studio.showFilesMenu) {
        this.$nextTick(() => {
          const btn = this.$refs.filesBtn;
          if (!btn) return;
          const rect = btn.getBoundingClientRect();
          const menuWidth = 280;
          let left = rect.right - menuWidth;
          let top = rect.bottom + 8;
          if (left < 8) left = 8;
          if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
          const menu = btn.closest('.codex-files-selector').querySelector('.codex-files-menu');
          const menuH = menu ? menu.scrollHeight : 300;
          if (top + menuH > window.innerHeight - 10) {
            top = rect.top - menuH - 8;
          }
          this.studio.filesMenuStyle = { top: top + 'px', left: left + 'px' };
        });
      }
    },

    async selectOutputFile(f) {
      this.studio.currentOutput = f.name;
      this.studio.currentArtifactId = f.id || null;
      this.studio.previewFilePath = f.name;
      this.studio.showFilesMenu = false;
      if (f.id && this.isLoggedIn) {
        try {
          const response = await MiniFish.api.studio.artifact(f.id);
          this.studio.previewContent = response.data.content || '';
          this.studio.previewTab = 'md';
          this.studio.showPreview = true;
        } catch (err) {
          this.studio.previewContent = '';
          this.showToast(err.message || '产物读取失败', 'error');
        }
        return;
      }
      if (this.demoMode) this.studio.showPreview = true;
    },

    async downloadCurrentArtifact() {
      if (!this.studio.currentArtifactId) return;
      try {
        const file = await MiniFish.api.studio.artifactDownload(this.studio.currentArtifactId);
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        this.showToast(err.message || '产物下载失败', 'error');
      }
    },

    loadMoreFiles() {
      // 仅显式游客 Demo 展示更多本地 fixture 文件。
      const more = [
        { name: '选题策划书.md' },
        { name: '短视频分镜.docx' },
        { name: '文案草稿_v2.md' },
        { name: '竞品分析报告.md' },
        { name: '发布计划.xlsx' },
        { name: '封面设计说明.md' },
        { name: '标签策略.txt' },
        { name: '数据复盘模板.md' }
      ];
      this.studio.outputFiles.push(...more);
      this.studio.moreFilesCount = 0;
      // 重新定位菜单
      this.$nextTick(() => {
        const btn = this.$refs.filesBtn;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const menu = btn.closest('.codex-files-selector').querySelector('.codex-files-menu');
        const menuH = menu ? menu.scrollHeight : 300;
        let top = rect.bottom + 8;
        if (top + menuH > window.innerHeight - 10) {
          top = rect.top - menuH - 8;
        }
        const menuWidth = 280;
        let left = rect.right - menuWidth;
        if (left < 8) left = 8;
        this.studio.filesMenuStyle = { top: top + 'px', left: left + 'px' };
      });
    },

    studioScrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.codexMessages;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },

    studioCopyText(text) {
      if (!text) {
        this.showToast('暂无内容可复制', 'error');
        return;
      }
      const cleanText = text.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n').trim();
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(cleanText).then(() => this.showToast('已复制到剪贴板', 'success'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = cleanText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.showToast('已复制到剪贴板', 'success');
      }
    },

    async studioRegenerate(idx) {
      if (this.studio.isRunning) return;
      const message = this.studio.messages[idx];
      if (!message || !message.id) {
        this.showToast('该演示消息没有可重新生成的服务端记录', 'error');
        return;
      }
      this.studio.isRunning = true;
      this.studio.runningStatus = '重新生成任务已提交…';
      this.studio.runError = null;
      try {
        const response = await MiniFish.api.studio.regenerate(message.id);
        const accepted = response.data || {};
        if (!response.accepted || !accepted.resource_id) throw new Error('重新生成任务未被接受');
        const runId = accepted.resource_id;
        this.studio.activeRunId = runId;
        MiniFish.api.studio.subscribeRun(runId, {
          onProgress: event => { this.studio.runningStatus = event.message || '正在重新生成…'; },
          onCompleted: async () => {
            let terminal = false;
            try {
              terminal = await this.reconcileStudioRunEvent(runId);
            } catch (err) {
              terminal = true;
              this.setStudioRunError(err);
              this.showToast(err.message || '重新生成失败', 'error');
            } finally {
              if (terminal) {
                this.studio.isRunning = false;
                this.studio.runningStatus = '';
              }
            }
          },
          onFailed: async event => {
            let terminal = false;
            try {
              terminal = await this.reconcileStudioRunEvent(runId);
            } catch (err) {
              terminal = true;
              const failure = event.error || err;
              this.setStudioRunError(failure, '重新生成失败');
              this.showToast(failure.message || '重新生成失败', 'error');
            } finally {
              if (terminal) {
                this.studio.isRunning = false;
                this.studio.runningStatus = '';
              }
            }
          },
          onFallback: () => this.pollStudioRun(runId, 0),
          onError: async error => {
            let terminal = false;
            try {
              terminal = await this.reconcileStudioRunEvent(runId);
            } catch (reconcileError) {
              terminal = true;
              const failure = reconcileError || error;
              this.setStudioRunError(failure, '重新生成状态获取失败');
              this.showToast(failure.message || '重新生成状态获取失败', 'error');
            } finally {
              if (terminal) {
                this.studio.isRunning = false;
                this.studio.runningStatus = '';
              }
            }
          }
        });
      } catch (err) {
        this.studio.isRunning = false;
        this.studio.runningStatus = '';
        this.setStudioRunError(err);
        this.showToast(err.message || '重新生成失败', 'error');
      }
    },

    async studioFeedback(message, feedback) {
      if (!message || !message.id) return;
      try {
        await MiniFish.api.studio.feedback(message.id, feedback);
        message.feedback = feedback;
      } catch (err) {
        this.showToast(err.message || '反馈提交失败', 'error');
      }
    },

    // ---- 套餐定价（AI 模型页 tab） ----
    setPricingPeriod(period) {
      this.pricingPeriod = period;
      this.showToast(period === 'yearly' ? '已切换年付价格' : '已切换月付价格', 'info');
    },
    displayPrice(plan) {
      return this.pricingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    },
    displayPeriod(plan) {
      if (plan.id === 'free') return '';
      return this.pricingPeriod === 'yearly' ? '/月（年付）' : '/月';
    },

    // ---- Chart dispatch ----
    baseChart() {
      return {
        textStyle: { fontFamily: 'Inter, PingFang SC, sans-serif', color: '#a3a3a3' },
        color: ['#e8755e', '#6b8cb8', '#7ba989', '#d4a04c', '#9b8fd0', '#e06c6c'],
        grid: { left: 45, right: 20, top: 30, bottom: 35 },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(38,38,38,.96)',
          borderColor: 'rgba(255,255,255,.12)',
          borderWidth: 1,
          textStyle: { color: '#f5f5f5' },
          axisPointer: { lineStyle: { color: 'rgba(255,255,255,.15)' } }
        }
      };
    },
    renderCharts() {
      const map = {
        dashboard: () => {
          MiniFish.charts.dashboard.renderTrend(this);
          MiniFish.charts.dashboard.renderFans(this);
          MiniFish.charts.dashboard.renderHeat(this);
        },
        intelligence: () => {
          MiniFish.charts.intelligence.renderHeatTrend(this);
        },
        coach: () => {
          MiniFish.charts.intelligence.renderSkillRadar(this);
          MiniFish.charts.intelligence.renderGrowthTrack(this);
          if (this.coachTab === '案例复盘') {
            MiniFish.charts.intelligence.renderCaseChart(this);
          }
          if (this.coachTab === '路线规划') {
            MiniFish.charts.intelligence.renderRouteMatch(this);
          }
        },
        ai: () => {
          if (this.aiTab === '用量计费统计') {
            MiniFish.charts.ai.renderModelCall(this);
            MiniFish.charts.ai.renderCost(this);
          }
        },
        settings: () => {
          if (this.settingsTab === 'aimodels' && this.aiTab === '用量计费统计') {
            MiniFish.charts.ai.renderModelCall(this);
            MiniFish.charts.ai.renderCost(this);
          }
        },
        media: () => {
          MiniFish.charts.media.renderSentiment(this);
          MiniFish.charts.media.renderTopicHot(this);
          MiniFish.charts.media.renderAudio(this);
          MiniFish.charts.media.renderStructure(this);
        }
      };
      const fn = map[this.currentPanel];
      if (fn) nextTick(fn);
    },
    handleResize() {
      Object.values(this.charts).forEach(c => c && c.resize());
    }
  },

  mounted() {
    if (!this.activeTrendItem && this.sortedTrendItems && this.sortedTrendItems.length > 0) {
      this.activeTrendItem = this.sortedTrendItems[0];
    }
    this.renderCharts();
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('click', this.closePopups);
    // 初始化 API，已登录则加载真实数据
    this.initApi();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.closePopups);
    Object.values(this.charts).forEach(c => c && c.dispose());
  }
}).mount('#app');
