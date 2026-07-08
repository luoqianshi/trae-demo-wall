// ============ 援力通 2.0 AI 引擎 ============
// 知识库 + 响应引擎 + 实时态势分析 + 可嵌入聊天组件
// 纯前端规则匹配，无第三方依赖；读取 DB 实时数据生成态势研判

// ============ 知识库 ============
const AI_KB = [
  {
    category: '洪水救援', icon: '🌊',
    keywords: ['洪水', '水灾', '暴雨', '内涝', '积水', '河道', '水位', '汛', '洪涝'],
    answer: '洪水救援要点：<br><br><strong>1. 水流判断</strong>：流速 &gt; 1m/s 危险，水深过膝不宜徒步<br><strong>2. 装备配备</strong>：冲锋舟、救生衣、救生圈、伸缩救援杆、安全绳<br><strong>3. 转移顺序</strong>：老人儿童优先 → 行动不便者双人协助 → 物资最后转移<br><strong>4. 安全禁忌</strong>：不涉水穿越湍流、不进入不明水域、不在涵洞避雨<br><strong>5. 协同配合</strong>：舟艇操作 2 人一组（驾驶员 + 观察员），岸上 3 人接应<br><br>⚠️ 始终佩戴救生衣，全员保持对讲机通讯畅通。'
  },
  {
    category: 'CPR 急救', icon: '🩺',
    keywords: ['cpr', '心肺复苏', '急救', '心脏按压', '人工呼吸', 'AED', '猝死', '昏迷'],
    answer: 'CPR 心肺复苏流程（成人）：<br><br><strong>1. 判断意识</strong>：拍打双肩呼叫，无反应即开始<br><strong>2. 呼救</strong>：指派他人拨打 120 并取 AED<br><strong>3. 胸外按压</strong>：<br>&nbsp;&nbsp;• 位置：两乳头连线中点<br>&nbsp;&nbsp;• 深度：5-6cm<br>&nbsp;&nbsp;• 频率：100-120 次/分钟<br>&nbsp;&nbsp;• 每轮 30 次按压<br><strong>4. 人工呼吸</strong>：仰头抬颌，捏鼻吹气 2 次，见胸廓起伏<br><strong>5. 循环</strong>：30:2 按压吹气比，直至 AED 到达或恢复呼吸<br><br>💡 AED 到达后立即按语音提示操作，放电前所有人离开。'
  },
  {
    category: '冲锋舟操作', icon: '🚤',
    keywords: ['冲锋舟', '舟艇', '橡皮艇', '操舟', '水域救援'],
    answer: '冲锋舟操作要领：<br><br><strong>1. 启动前检查</strong>：船体气密性、舷外机燃油、螺旋桨、救生绳<br><strong>2. 人员配置</strong>：驾驶员 1 + 观察员 1 + 救援员 1-2，全员穿救生衣<br><strong>3. 离岸</strong>：先松绳再启动，低速驶离岸边 10m 后加速<br><strong>4. 接近目标</strong>：从下游 45° 角接近，距落水者 3m 熄火滑行<br><strong>5. 救捞</strong>：使用救生圈或救援杆，禁止徒手拉人上船<br><strong>6. 翻船应急</strong>：抓住船体不弃船，等待救援<br><br>⚠️ 风速 > 6 级或浪高 > 0.5m 禁止出舟。'
  },
  {
    category: '人员落水', icon: '🆘',
    keywords: ['落水', '溺水', '淹溺', '掉水里', '人员落水'],
    answer: '人员落水救援流程：<br><br><strong>1. 黄金 30 秒</strong>：抛投救生圈/救生衣，喊话安抚<br><strong>2. 岸上救援</strong>：使用伸缩杆（5m）、抛绳袋（20m），双人拉拽<br><strong>3. 舟艇救援</strong>：从下游接近，3m 处熄火滑行<br><strong>4. 下水救援</strong>（最后手段）：双人保护 + 安全绳 + 救生衣<br><strong>5. 上岸后处置</strong>：<br>&nbsp;&nbsp;• 清理口腔异物<br>&nbsp;&nbsp;• 检查呼吸心跳<br>&nbsp;&nbsp;• 必要时立即 CPR<br>&nbsp;&nbsp;• 保暖防失温<br><br>⚠️ 救援人员安全优先，禁止单人徒手下水。'
  },
  {
    category: '山地搜救', icon: '⛰️',
    keywords: ['山地', '搜救', '迷路', '山林', '驴友', '登山', '山地救援'],
    answer: '山地搜救要点：<br><br><strong>1. 信息收集</strong>：失联人数、最后位置、装备情况、体能状况<br><strong>2. 搜索分区</strong>：以最后位置为圆心，3km 半径分 6 个扇区<br><strong>3. 搜索方法</strong>：<br>&nbsp;&nbsp;• 沿等高线横向搜索<br>&nbsp;&nbsp;• 沿水系/小径追踪<br>&nbsp;&nbsp;• 无人机热成像辅助<br><strong>4. 通讯保障</strong>：每 15 分钟呼叫一次，对讲机 + 哨子<br><strong>5. 找到后处置</strong>：评估伤情、补充热量、缓慢下撤<br><br>⚠️ 天黑前 1 小时必须收队或建立夜间搜索营地。'
  },
  {
    category: '火灾救援', icon: '🔥',
    keywords: ['火灾', '火情', '着火', '起火', '森林火灾', '灭火'],
    answer: '火灾救援要点：<br><br><strong>1. 火情判断</strong>：风向、火势蔓延速度、可燃物类型<br><strong>2. 个人防护</strong>：阻燃服、防毒面具、湿毛巾（民用）<br><strong>3. 扑救顺序</strong>：<br>&nbsp;&nbsp;• 先控制后消灭<br>&nbsp;&nbsp;• 先外围后中心<br>&nbsp;&nbsp;• 先下风后侧风<br><strong>4. 隔离带</strong>：清除 5m 宽可燃物带<br><strong>5. 撤离路线</strong>：始终背风方向撤离，预留 2 条退路<br><br>⚠️ 风向突变立即撤退，不与火头正面交锋。森林火请协调航空灭火。'
  },
  {
    category: '地震救援', icon: '🌡️',
    keywords: ['地震', '震灾', '倒塌', '废墟', '建筑坍塌'],
    answer: '地震救援要点：<br><br><strong>1. 自保</strong>：伏地、遮挡、手抓牢（Drop Cover Hold）<br><strong>2. 转移</strong>：震动停止后通过楼梯撤离，禁用电梯<br><strong>3. 搜救</strong>：<br>&nbsp;&nbsp;• 听呼救声<br>&nbsp;&nbsp;• 敲击管道回应<br>&nbsp;&nbsp;• 生命探测仪定位<br><strong>4. 救援</strong>：支撑稳固废墟 → 切割破拆 → 医疗评估<br><strong>5. 余震应对</strong>：主震后 24h 内余震高发，设置警戒区<br><br>⚠️ 不进入严重损毁建筑，警惕燃气泄漏和二次坍塌。'
  },
  {
    category: '交通事故', icon: '🚑',
    keywords: ['交通事故', '车祸', '追尾', '碰撞', '伤员', '破拆'],
    answer: '交通事故救援流程：<br><br><strong>1. 现场警戒</strong>：上游 150m 设置警示标志，引导车流<br><strong>2. 伤情评估</strong>：ABCDE 评估法（气道/呼吸/循环/神经/暴露）<br><strong>3. 车辆破拆</strong>：<br>&nbsp;&nbsp;• 液压剪扩器开门<br>&nbsp;&nbsp;• 切割 A/B 柱<br>&nbsp;&nbsp;• 顶升仪表盘解困<br><strong>4. 脱困搬运</strong>：颈托固定 + 脊柱板，整体翻身<br><strong>5. 后送</strong>：红标优先（10 分钟内），黄标次之<br><br>⚠️ 切断车辆电源，防范安全气囊二次爆开和燃油泄漏。'
  },
  {
    category: '无人机操作', icon: '🚁',
    keywords: ['无人机', '航拍', '飞手', 'uav', '正射', '热成像'],
    answer: '无人机救援应用：<br><br><strong>1. 起飞前</strong>：电池满电、桨叶检查、RTK 信号、空域申报<br><strong>2. 航拍任务</strong>：<br>&nbsp;&nbsp;• 高度 100-150m<br>&nbsp;&nbsp;• 重叠率 80%/60%（航向/旁向）<br>&nbsp;&nbsp;• 速度 8m/s<br><strong>3. 搜救应用</strong>：热成像模式，扫描网格 200m×200m<br><strong>4. 实时回传</strong>：5G/4G 图传至指挥中心，标注可疑点<br><strong>5. 应急返航</strong>：电量 30% 强制返航，丢失信号 10s 自动返航<br><br>⚠️ 风速 > 8m/s 或降雨 > 中雨禁飞，避开高压线和人群。'
  },
  {
    category: '调度指挥', icon: '🧠',
    keywords: ['调度', '指挥', '协调', '资源分配', '任务分配', '出动'],
    answer: '应急救援调度原则：<br><br><strong>1. 优先级</strong>：人员生命 > 险情控制 > 财产保护<br><strong>2. 资源匹配</strong>：<br>&nbsp;&nbsp;• 紧急任务 → 甲级队伍 + 特种装备<br>&nbsp;&nbsp;• 高优先级 → 乙级队伍 + 标准装备<br>&nbsp;&nbsp;• 一般任务 → 待命队伍<br><strong>3. 出动规模</strong>：单人/单车 → 小队（5-8 人）→ 中队（15-20 人）→ 大队（30+）<br><strong>4. 协同</strong>：现场指挥 + 后方调度 + 多队伍通讯统一频道<br><strong>5. 升级机制</strong>：响应超 30 分钟无进展 → 升级响应等级<br><br>📊 建议参考实时态势面板和队伍可用性表进行决策。'
  },
  {
    category: '心理疏导', icon: '🧑‍🤝‍🧑',
    keywords: ['心理', '安抚', '情绪', '创伤', '焦虑', '恐慌', '疏导'],
    answer: '受灾人员心理援助要点：<br><br><strong>1. 建立联系</strong>：蹲平视线交流，温和自我介绍<br><strong>2. 倾听陪伴</strong>：不打断、不评判、不说"别哭"<br><strong>3. 稳定情绪</strong>：<br>&nbsp;&nbsp;• 深呼吸引导（4-7-8 呼吸法）<br>&nbsp;&nbsp;• 握住物品锚定现实<br>&nbsp;&nbsp;• 提供水和毛毯<br><strong>4. 信息传递</strong>：明确告知"现在安全"，避免空洞承诺<br><strong>5. 转介</strong>：持续症状 > 1 周转介专业心理医生<br><br>⚠️ 救援人员自身也需心理疏导，任务后 72h 内开展 CISD 减压。'
  },
  {
    category: '转移安置', icon: '🏕️',
    keywords: ['转移', '安置', '避难', '安置点', '疏散', '撤离'],
    answer: '群众转移安置流程：<br><br><strong>1. 通知</strong>：多渠道（广播/短信/敲门）发布转移令，明确集合点和路线<br><strong>2. 转移</strong>：<br>&nbsp;&nbsp;• 优先老幼病残孕<br>&nbsp;&nbsp;• 双人协助行动不便者<br>&nbsp;&nbsp;• 物资随后车运输<br><strong>3. 安置点要求</strong>：<br>&nbsp;&nbsp;• 人均面积 ≥ 3.5㎡<br>&nbsp;&nbsp;• 饮用水 3L/人/天<br>&nbsp;&nbsp;• 食物 1500kcal/人/天<br>&nbsp;&nbsp;• 卫生设施 1:50<br><strong>4. 登记管理</strong>：实名登记、家庭分组、特殊需求标记<br><strong>5. 信息发布</strong>：每 4 小时更新安置情况和回迁计划<br><br>⚠️ 安置点选址避开低洼、危房、滑坡风险区。'
  },
  {
    category: '装备使用', icon: '🛠️',
    keywords: ['装备', '设备', '器材', '工具', '装备库', '领用'],
    answer: '救援装备管理要点：<br><br><strong>1. 分类</strong>：特种装备（冲锋舟/无人机）· 防护类（救生衣/绳索）· 通讯类（对讲机/卫星电话）· 医疗类（急救箱/担架）· 工具类（液压剪/破拆器）<br><strong>2. 领用流程</strong>：扫码 → 审批 → 出库 → 使用登记 → 归还检查<br><strong>3. 维保</strong>：月度检查 + 出任务前后点检 + 故障 24h 上报<br><strong>4. 消耗品</strong>：急救药品每月盘点，过期 1 月前更换<br><strong>5. 报废标准</strong>：绳索 5 年/救生衣 3 年/对讲机电池 2 年<br><br>📊 当前装备可用率请参考装备管理页面实时数据。'
  },
  {
    category: '通讯保障', icon: '📡',
    keywords: ['通讯', '通信', '对讲机', '信号', '中继', '卫星电话'],
    answer: '应急通讯保障要点：<br><br><strong>1. 多重备份</strong>：对讲机（主）+ 卫星电话（备）+ 手机 4G（辅）<br><strong>2. 频道规划</strong>：<br>&nbsp;&nbsp;• CH1 指挥频道（全队监听）<br>&nbsp;&nbsp;• CH2 各小队内部<br>&nbsp;&nbsp;• CH3 医疗专用<br>&nbsp;&nbsp;• CH4 后勤调度<br><strong>3. 通话规范</strong>：先报"呼叫 XX"，对方应答后传输内容，结束说"完毕"<br><strong>4. 中继台</strong>：山区/地下室架设便携中继，覆盖半径扩大至 10km<br><strong>5. 静默规则</strong>：紧急呼叫全频道静默，仅指挥与事发方通话<br><br>⚠️ 任务前测试所有设备，备用电池按 1.5 倍配备。'
  },
  {
    category: '止血包扎', icon: '🩹',
    keywords: ['止血', '出血', '包扎', '伤口', '失血', '创伤'],
    answer: '止血包扎技术：<br><br><strong>1. 评估出血</strong>：动脉（喷射状鲜红）> 静脉（涌出暗红）> 毛细血管（渗出）<br><strong>2. 直接压迫</strong>：无菌纱布按压 5-10 分钟，最常用<br><strong>3. 加压包扎</strong>：纱布 + 绷带螺旋缠绕，松紧度以一指伸入为宜<br><strong>4. 止血带</strong>（四肢大出血最后手段）：<br>&nbsp;&nbsp;• 位置：伤口上方 5-7cm<br>&nbsp;&nbsp;• 记录时间，每 1h 松开 30s<br>&nbsp;&nbsp;• 标记"T"在伤员额头<br><strong>5. 异物刺入</strong>：不拔出，固定后包扎<br><br>⚠️ 失血 > 1000ml 立即建立静脉通路，快速后送。'
  },
];

// ============ AI 引擎 ============
const AI = {
  // ---------- 对话历史（按页面隔离） ----------
  _conversations: {},

  // ---------- 快捷问题 ----------
  quickQuestions: [
    { icon: '🌊', text: '洪水救援流程' },
    { icon: '🩺', text: '如何进行 CPR' },
    { icon: '🚤', text: '冲锋舟操作要领' },
    { icon: '🆘', text: '人员落水怎么救' },
    { icon: '⛰️', text: '山地迷路搜救' },
    { icon: '🔥', text: '火灾逃生方法' },
    { icon: '🌡️', text: '地震自救原则' },
    { icon: '🚁', text: '无人机救援应用' },
  ],

  // ---------- 关键词匹配响应 ----------
  respond(question) {
    if (!question || !question.trim()) return null;
    const q = question.toLowerCase().trim();

    // 特殊指令：态势分析
    if (/(态势|当前|实时|情况|现状|概览)/.test(q) && /(分析|情况|态势|概览|现状)/.test(q)) {
      return this.situationalAnalysis();
    }
    // 特殊指令：调度建议
    if (/(调度|建议|方案|如何分配|怎么派)/.test(q) && /(调度|建议|方案|派|分配)/.test(q)) {
      return this.dispatchSuggestion();
    }
    // 特殊指令：风险
    if (/(风险|危险|预警|评估)/.test(q)) {
      return this.riskAssessment();
    }
    // 特殊指令：求助/帮助
    if (/^(帮助|help|功能|能做什么|你能)/.test(q)) {
      return '我是 <strong>援力通 AI 助手</strong>，专长应急救援领域，可以为您提供：<br><br>• 🌊 各类灾害救援流程（洪水/火灾/地震/山地）<br>• 🩺 急救技术指导（CPR/止血/包扎）<br>• 🚁 装备使用说明（冲锋舟/无人机/对讲机）<br>• 🧠 调度指挥建议<br>• 📊 <strong>实时态势分析</strong>（直接问"当前态势"）<br>• ⚠️ <strong>风险预警</strong>（直接问"风险评估"）<br><br>💡 试试点击下方快捷问题，或直接输入您的疑问。';
    }

    // 关键词匹配评分
    let best = null, bestScore = 0;
    AI_KB.forEach(item => {
      let score = 0;
      item.keywords.forEach(kw => {
        if (q.includes(kw.toLowerCase())) {
          score += kw.length; // 长关键词权重高
        }
      });
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });

    if (best && bestScore > 0) {
      return best.answer;
    }

    // 兜底响应
    const fallbacks = [
      '这个问题我暂时没有精准答案，建议尝试以下关键词：<br>洪水 / CPR / 冲锋舟 / 落水 / 山地搜救 / 火灾 / 地震 / 无人机 / 调度 / 心理疏导<br><br>💡 也可以直接问"当前态势"获取实时分析。',
      '未匹配到相关知识点。您可以问我各类灾害救援流程、急救技术、装备使用，或直接输入"实时态势"获取当前灾情分析。',
      '抱歉，我的知识库暂未覆盖此问题。试试点击下方快捷问题，或询问"当前态势"/"调度建议"/"风险评估"获取实时数据洞察。',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  },

  // ---------- 实时态势分析（读 DB） ----------
  situationalAnalysis() {
    const stats = Store.stats();
    const activeTasks = DB.tasks.filter(t => t.status === 'progress');
    const pendingSos = DB.sos.filter(s => s.status === 'pending');
    const busyTeams = DB.teams.filter(t => t.status === 'busy');
    const idleTeams = DB.teams.filter(t => t.status === 'idle');
    const flyingDrones = DB.devices.filter(d => d.type === '无人机' && d.status === 'flying');

    let html = '<div style="border-left:3px solid var(--purple);padding-left:10px;margin-bottom:8px">';
    html += `<strong>📊 当前态势（基于系统实时数据）</strong><br><br>`;
    html += `📌 <strong>任务</strong>：进行中 ${stats.tasksProgress} 个，待开始 ${stats.tasksPending} 个，已完成 ${stats.tasksDone} 个<br>`;
    if (activeTasks.length) {
      html += `&nbsp;&nbsp;└ 进行中任务：${activeTasks.slice(0, 3).map(t => t.name).join('、')}<br>`;
    }
    html += `🆘 <strong>SOS</strong>：待响应 ${stats.sosPending} 起，处理中 ${stats.sosProgress} 起<br>`;
    if (pendingSos.length) {
      html += `&nbsp;&nbsp;└ 待响应：${pendingSos.slice(0, 2).map(s => s.type + '@' + s.location).join('、')}<br>`;
    }
    html += `👥 <strong>队伍</strong>：忙碌 ${stats.teamsBusy} 支，待命 ${stats.teamsIdle} 支<br>`;
    html += `🚁 <strong>无人机</strong>：在飞 ${stats.dronesFlying} 架<br>`;
    html += `📨 <strong>未读消息</strong>：${stats.unreadMsgs} 条<br>`;
    html += '</div>';

    // 风险研判
    html += '<div style="border-left:3px solid var(--danger);padding-left:10px;margin-bottom:8px">';
    html += '<strong>⚠️ 风险研判</strong><br>';
    if (stats.sosPending >= 3) html += `• SOS 待响应数 ${stats.sosPending} ≥ 3，存在响应滞后风险<br>`;
    if (stats.teamsIdle === 0) html += '• 所有队伍均忙碌，无可用预备力量，建议请求增援<br>';
    else if (stats.teamsIdle <= 1) html += `• 仅 ${stats.teamsIdle} 支队伍待命，预备力量不足<br>`;
    if (flyingDrones.length < 2) html += '• 在飞无人机不足 2 架，建议增派进行态势侦察<br>';
    if (stats.tasksProgress > stats.teamsBusy) html += '• 进行中任务数 > 忙碌队伍数，资源紧张<br>';
    if (stats.sosPending < 3 && stats.teamsIdle > 1 && flyingDrones.length >= 2) {
      html += '• 当前资源充足，可正常处置<br>';
    }
    html += '</div>';

    // 调度建议
    html += '<div style="border-left:3px solid var(--success);padding-left:10px">';
    html += '<strong>💡 调度建议</strong><br>';
    if (pendingSos.length && idleTeams.length) {
      html += `• 待命队伍 ${idleTeams.map(t => t.name).join('、')} 可派往 SOS 现场<br>`;
    }
    if (stats.tasksPending > 0) {
      html += `• ${stats.tasksPending} 个待开始任务需立即分配队伍<br>`;
    }
    html += `• 建议 ${stats.tasksProgress} 个进行中任务每 15 分钟上报进度<br>`;
    html += '• 启用无人机持续侦察灾区，30 分钟更新一次态势';
    html += '</div>';

    return html;
  },

  // ---------- 调度建议（读 DB） ----------
  dispatchSuggestion() {
    const pendingTasks = DB.tasks.filter(t => t.status === 'pending');
    const pendingSos = DB.sos.filter(s => s.status === 'pending');
    const idleTeams = DB.teams.filter(t => t.status === 'idle');
    const idleDrones = DB.devices.filter(d => d.type === '无人机' && d.status !== 'flying' && d.battery > 30);

    let html = '<strong>🧠 AI 调度建议</strong>（基于实时资源）<br><br>';

    if (!pendingTasks.length && !pendingSos.length) {
      html += '✅ 当前无待处置任务和 SOS，资源处于待命状态。<br>';
      html += '建议：保持当前配置，开展日常培训和装备维保。';
      return html;
    }

    // 任务分配
    if (pendingTasks.length) {
      html += '<strong>📋 待开始任务分配</strong><br>';
      pendingTasks.forEach((task, i) => {
        const team = idleTeams[i % Math.max(1, idleTeams.length)];
        if (team) {
          html += `• ${task.name} → <strong>${team.name}</strong>（${team.type}，可用 ${team.available} 人）<br>`;
        } else {
          html += `• ${task.name} → ⚠️ <strong>无可用队伍，建议请求增援</strong><br>`;
        }
      });
    }

    // SOS 响应
    if (pendingSos.length) {
      html += '<br><strong>🆘 SOS 响应建议</strong><br>';
      pendingSos.forEach(sos => {
        const nearestTeam = idleTeams.find(t => t.type === '水域救援组' && sos.type.includes('落水'))
          || idleTeams.find(t => t.type === '山地救援' && sos.type.includes('迷路'))
          || idleTeams[0];
        if (nearestTeam) {
          html += `• ${sos.type}@${sos.location} → <strong>${nearestTeam.name}</strong><br>`;
        } else {
          html += `• ${sos.type}@${sos.location} → ⚠️ <strong>无匹配专业队伍</strong><br>`;
        }
      });
    }

    // 无人机调度
    if (idleDrones.length) {
      html += '<br><strong>🚁 无人机调度</strong><br>';
      html += `• 建议起飞 ${Math.min(2, idleDrones.length)} 架无人机进行态势侦察<br>`;
      html += `• 可用设备：${idleDrones.slice(0, 3).map(d => d.name + '(' + d.battery + '%)').join('、')}<br>`;
    }

    // 预测
    html += '<br><strong>🎯 完成预测</strong><br>';
    const totalTime = (pendingTasks.length * 90 + pendingSos.length * 45);
    html += `• 预计 ${Math.ceil(totalTime / 60)} 小时内完成全部待处置事项<br>`;
    html += `• 当前可用人员 ${DB.members.filter(m => m.status !== 'offline').length} 人，可满足需求`;

    return html;
  },

  // ---------- 风险评估 ----------
  riskAssessment() {
    const pendingSos = DB.sos.filter(s => s.status === 'pending');
    const progressTasks = DB.tasks.filter(t => t.status === 'progress');
    const lowBatteryDrones = DB.devices.filter(d => d.battery < 30);
    const warningEquip = DB.equipment.filter(e => e.status === 'warning');
    const idleTeams = DB.teams.filter(t => t.status === 'idle');

    let html = '<strong>⚠️ 风险评估报告</strong><br><br>';
    html += `<div style="background:rgba(239,68,68,.1);padding:8px;border-radius:6px;margin-bottom:8px">`;
    html += `<strong>🔴 高风险项</strong><br>`;
    if (pendingSos.length >= 3) html += `• 待响应 SOS ${pendingSos.length} 起，响应压力极大<br>`;
    if (idleTeams.length === 0) html += '• 零队伍待命，无应急预备力量<br>';
    if (lowBatteryDrones.length) html += `• ${lowBatteryDrones.length} 架无人机低电量（<30%）<br>`;
    if (!pendingSos.length && idleTeams.length && !lowBatteryDrones.length) html += '• 暂无高风险项<br>';
    html += '</div>';

    html += `<div style="background:rgba(245,158,11,.1);padding:8px;border-radius:6px;margin-bottom:8px">`;
    html += `<strong>🟡 中风险项</strong><br>`;
    if (warningEquip.length) html += `• ${warningEquip.length} 件装备预警：${warningEquip.map(e => e.name).join('、')}<br>`;
    if (progressTasks.length > 3) html += `• ${progressTasks.length} 个任务并行，指挥压力大<br>`;
    if (idleTeams.length <= 2 && idleTeams.length > 0) html += `• 仅 ${idleTeams.length} 支队伍待命<br>`;
    if (!warningEquip.length && progressTasks.length <= 3 && idleTeams.length > 2) html += '• 暂无中风险项<br>';
    html += '</div>';

    html += `<div style="background:rgba(16,185,129,.1);padding:8px;border-radius:6px">`;
    html += `<strong>🟢 正常项</strong><br>`;
    html += `• 人员在线 ${DB.members.filter(m => m.status === 'online' || m.status === 'busy').length} 人<br>`;
    html += `• 无人机在飞 ${DB.devices.filter(d => d.status === 'flying').length} 架<br>`;
    html += `• 装备总数 ${DB.equipment.length} 件，可用 ${DB.equipment.reduce((s, e) => s + e.available, 0)} 件`;
    html += '</div>';

    return html;
  },

  // ---------- 历史相似案例 ----------
  historyCases() {
    return [
      { time: '2023-07', name: '城北洪水', desc: '24h 降雨 120mm，转移 350 人，无伤亡', match: '洪水' },
      { time: '2024-06', name: '城东内涝', desc: '内涝导致 50 人被困，2 小时完成转移', match: '内涝' },
      { time: '2025-08', name: '城南暴雨', desc: '暴雨引发河道漫溢，3 队伍联合处置', match: '暴雨' },
    ];
  },

  // ---------- 弹窗辅助（安全转义，供 onclick 调用） ----------
  showDispatch() {
    showModal('⚡ AI 一键调度建议', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${this.dispatchSuggestion()}</div>`, '采纳方案', () => {
      toast('✅ 已采纳 AI 调度方案，任务已分配');
    });
  },
  showRisk() {
    showModal('⚠️ AI 风险评估报告', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${this.riskAssessment()}</div>`, '关闭');
  },
  showCases() {
    const cases = this.historyCases();
    showModal('📊 历史相似案例', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${cases.map(c => `<p><strong>📌 ${c.time} ${c.name}</strong><br>${c.desc}<br><span style="color:var(--text2)">匹配关键词：${c.match}</span></p>`).join('<hr style="border-color:var(--border);margin:8px 0">')}</div>`, '关闭');
  },
  showAnalysis() {
    showModal('🧠 AI 实时态势研判', `<div style="font-size:13px;line-height:1.9;color:var(--text)">${this.situationalAnalysis()}</div>`, '关闭');
  },

  // ============ 聊天组件 ============

  // 初始化某页面的对话
  _init(pageId) {
    if (!this._conversations[pageId]) {
      this._conversations[pageId] = {
        messages: [
          { role: 'ai', text: '您好！我是<strong>援力通 AI 助手</strong> 🤖<br>专长应急救援，可为您实时分析灾情态势。<br><br>💡 试试点击下方快捷问题，或直接输入您的疑问。', time: new Date().toTimeString().slice(0, 5) }
        ],
        isTyping: false,
      };
    }
    return this._conversations[pageId];
  },

  // 渲染聊天容器（嵌入到 phoneFrame 或 web 页面）
  chatContainer(pageId, opts = {}) {
    this._init(pageId);
    const conv = this._conversations[pageId];
    const compact = opts.compact; // 小程序紧凑模式
    const showQuick = opts.quickQuestions !== false;
    const maxHeight = opts.maxHeight || '320px';

    return `
      <div class="ai-chat" data-page="${pageId}" style="display:flex;flex-direction:column;gap:8px">
        ${showQuick ? `
          <div style="font-size:11px;color:var(--text2);margin-bottom:4px">💡 快捷问题</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            ${this.quickQuestions.slice(0, compact ? 4 : 8).map(q => `
              <button class="mini-btn secondary" style="width:auto;padding:5px 10px;margin:0;font-size:11px" onclick="AI.ask('${pageId}','${q.text.replace(/'/g, "\\'")}')">${q.icon} ${q.text}</button>
            `).join('')}
          </div>
        ` : ''}
        <div id="aiChatMsgs_${pageId}" style="max-height:${maxHeight};overflow-y:auto;background:var(--bg2);border-radius:10px;padding:10px;border:1px solid var(--border)">
          ${this._renderMessages(pageId)}
        </div>
        <div style="background:var(--card);border-radius:10px;padding:8px;display:flex;gap:6px;align-items:center;border:1px solid var(--border)">
          <input id="aiChatInput_${pageId}" style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);outline:none;font-size:12px" placeholder="输入问题，回车发送..." onkeydown="if(event.key==='Enter')AI.send('${pageId}')">
          <button class="btn btn-primary btn-sm" onclick="AI.send('${pageId}')">发送</button>
        </div>
      </div>
    `;
  },

  // 渲染消息列表
  _renderMessages(pageId) {
    const conv = this._init(pageId);
    return conv.messages.map(m => {
      if (m.role === 'user') {
        return `
          <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
            <div style="background:var(--primary-light);color:#fff;padding:8px 12px;border-radius:12px 12px 2px 12px;max-width:80%;font-size:12px;line-height:1.6">${m.text}</div>
          </div>
        `;
      }
      return `
        <div style="display:flex;justify-content:flex-start;margin-bottom:8px">
          <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);padding:8px 12px;border-radius:12px 12px 12px 2px;max-width:88%;font-size:12px;line-height:1.7;color:var(--text)">${m.text}</div>
        </div>
      `;
    }).join('') + (conv.isTyping ? `
      <div style="display:flex;justify-content:flex-start;margin-bottom:8px">
        <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);padding:10px 14px;border-radius:12px 12px 12px 2px;font-size:12px;color:var(--purple)">
          🤖 <span style="animation:pulse 1s infinite">正在思考...</span>
        </div>
      </div>
    ` : '');
  },

  // 局部刷新消息区
  _refreshMsgs(pageId) {
    const box = document.getElementById('aiChatMsgs_' + pageId);
    if (!box) return;
    box.innerHTML = this._renderMessages(pageId);
    box.scrollTop = box.scrollHeight;
  },

  // 直接提问（来自快捷按钮）
  ask(pageId, question) {
    const input = document.getElementById('aiChatInput_' + pageId);
    if (input) input.value = question;
    this.send(pageId);
  },

  // 发送消息
  send(pageId) {
    const input = document.getElementById('aiChatInput_' + pageId);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const conv = this._init(pageId);
    conv.messages.push({ role: 'user', text, time: new Date().toTimeString().slice(0, 5) });
    input.value = '';
    conv.isTyping = true;
    this._refreshMsgs(pageId);

    // 模拟 AI 思考延迟（300-800ms）
    const delay = 300 + Math.random() * 500;
    setTimeout(() => {
      const answer = this.respond(text);
      conv.isTyping = false;
      conv.messages.push({ role: 'ai', text: answer, time: new Date().toTimeString().slice(0, 5) });
      this._refreshMsgs(pageId);
    }, delay);
  },

  // 清空对话
  clear(pageId) {
    delete this._conversations[pageId];
    this._init(pageId);
    this._refreshMsgs(pageId);
    toast('💬 对话已清空');
  },
};
