/* 不三迁 · 家长端逻辑（完整版）
   集成：三套评价体系 + 天赋评测 + 心理分析(5模型) + 学情详情(年龄适配+天才) + 安全引擎(5类风险) + 共育决策 + 搭子设置
   导航：底部导航栏（5个主页面）
*/

initSharedData();

/* ===== 模拟数据 ===== */
var fragments = [
  { scene: '游戏', type: '专注', desc: '搭建红石电路持续 47 分钟', dim: '空间力', signal: '专注' },
  { scene: '学习', type: '上手快', desc: '首次接触几何证明，掌握速度快于平均', dim: '推理力', signal: '上手快' },
  { scene: '创作', type: '感兴趣', desc: '主动续画科幻城市草图 3 次', dim: '创造力', signal: '感兴趣' },
  { scene: '运动', type: '正反馈', desc: '篮球教练表扬空间判断好', dim: '观察力', signal: '正反馈' },
  { scene: '阅读', type: '专注', desc: '古文阅读持续 42 分钟', dim: '记忆力', signal: '专注' },
  { scene: '社交', type: '正反馈', desc: '作文被老师当范文朗读', dim: '创造力', signal: '正反馈' },
];

var goals = [
  { name: '提升历史学科兴趣', progress: 45 },
  { name: '保持物理竞赛手感', progress: 78 },
  { name: '每日户外 1 小时', progress: 90 },
  { name: '减少屏幕连续使用时长', progress: 62 }
];

var reviewItems = [
  '宋代建筑特点（识别到"塔/古建筑"触发）',
  '并联电路与串联电路区别（游戏桥接）',
  '光合作用公式（户外场景）',
  '能量守恒定律（观察到车辆）'
];

var knowledgeLog = [
  { time: '08:15', knowledge: '宋代建筑', scene: '通勤', subject: '历史', status: '已植入' },
  { time: '10:30', knowledge: '一元二次方程', scene: '学习', subject: '数学', status: '讨论引导' },
  { time: '14:20', knowledge: '能量守恒', scene: '观察', subject: '物理', status: '已植入' },
  { time: '16:45', knowledge: '并联电路', scene: '游戏', subject: '物理', status: '已植入' },
  { time: '19:00', knowledge: '光合作用', scene: '户外', subject: '生物', status: '复习巩固' },
];

/* ===== 工具函数 ===== */
function esc(s) { return String(s == null ? '' : s); }

function renderProgress(containerId, data, color) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var html = '';
  for (var label in data) {
    var value = data[label];
    html += '<div class="progress-row">' +
      '<div class="progress-label">' + esc(label) + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + value + '%;background:' + color + '"></div></div>' +
      '<div class="progress-value">' + (typeof value === 'number' ? value : '') + '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}

/* ===== 雷达图 ===== */
function drawRadar(containerId, data, size) {
  var container = document.getElementById(containerId);
  if (!container) return;
  size = size || 260;
  var labels = Object.keys(data);
  var values = Object.values(data);
  var count = labels.length;
  var center = size / 2;
  var radius = size * 0.38;
  var angleStep = (Math.PI * 2) / count;

  var grid = '';
  for (var i = 1; i <= 4; i++) {
    var r = (radius / 4) * i;
    var pts = '';
    for (var j = 0; j < count; j++) {
      var a = j * angleStep - Math.PI / 2;
      pts += (center + r * Math.cos(a)) + ',' + (center + r * Math.sin(a)) + ' ';
    }
    grid += '<polygon points="' + pts + '" fill="none" stroke="#E8E0D8" stroke-width="1"/>';
  }

  var axis = '', labelEls = '';
  for (var j = 0; j < count; j++) {
    var a = j * angleStep - Math.PI / 2;
    var x = center + radius * Math.cos(a);
    var y = center + radius * Math.sin(a);
    axis += '<line x1="' + center + '" y1="' + center + '" x2="' + x + '" y2="' + y + '" stroke="#E8E0D8" stroke-width="1"/>';
    var lx = center + (radius + 22) * Math.cos(a);
    var ly = center + (radius + 22) * Math.sin(a);
    labelEls += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#5C5048">' + esc(labels[j]) + '</text>';
  }

  var dataPoints = '';
  var circles = '';
  for (var j = 0; j < count; j++) {
    var a = j * angleStep - Math.PI / 2;
    var r = (values[j] / 100) * radius;
    var px = center + r * Math.cos(a);
    var py = center + r * Math.sin(a);
    dataPoints += px + ',' + py + ' ';
    circles += '<circle cx="' + px + '" cy="' + py + '" r="3" fill="#6B9080"/>';
  }

  container.innerHTML =
    '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" height="100%">' +
    grid + axis +
    '<polygon points="' + dataPoints + '" fill="rgba(107,144,128,0.25)" stroke="#6B9080" stroke-width="2"/>' +
    circles + labelEls +
    '</svg>';
}

/* ===== 概览 ===== */
function renderOverview() {
  drawRadar('radar-overview', StudentProfile.abilities);

  var todayEvents = Memory.getToday();
  var timeline = document.getElementById('timeline-list');
  if (todayEvents.length > 0) {
    var html = '';
    for (var i = 0; i < todayEvents.length; i++) {
      var e = todayEvents[i];
      var time = new Date(e.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      var dotColor = e.response === 'positive' ? 'var(--sage)' : e.response === 'negative' ? 'var(--coral)' : 'var(--gold)';
      var respText = e.response === 'positive' ? '积极回应' : e.response === 'negative' ? '消极回应' : '中性';
      html += '<div class="list-item" style="display:flex;align-items:center;gap:10px;">' +
        '<div style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';flex-shrink:0;"></div>' +
        '<div style="flex:1;">' +
        '<div style="font-size:0.88rem;">' + esc(e.topic) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--muted);">' + esc(e.scene) + ' · ' + esc(e.knowledge) + ' · ' + respText + '</div>' +
        '</div>' +
        '<div style="font-size:0.75rem;color:var(--muted);">' + time + '</div>' +
        '</div>';
    }
    timeline.innerHTML = html;
  } else {
    timeline.innerHTML = '<div class="empty-state">今日暂无互动记录</div>';
  }

  var reviewHtml = '';
  for (var i = 0; i < reviewItems.length; i++) {
    reviewHtml += '<div class="list-item">• ' + esc(reviewItems[i]) + '</div>';
  }
  document.getElementById('review-list').innerHTML = reviewHtml;

  var alertEl = document.getElementById('ov-alert');
  var unresolvedEvents = SafetyEngine.events.filter(function(e) { return !e.resolved; });
  if (unresolvedEvents.length > 0) {
    var alertHtml = '';
    for (var i = 0; i < unresolvedEvents.length; i++) {
      var e = unresolvedEvents[i];
      alertHtml += '<div class="alert"><div class="alert-title">⚠️ ' + esc(e.typeName) + '</div><div class="alert-text">' + esc(e.detail) + '</div></div>';
    }
    alertEl.innerHTML = alertHtml;
  } else {
    alertEl.innerHTML = '<div class="alert" style="border-left-color:var(--sage);background:var(--sage-light);"><div class="alert-title" style="color:var(--sage);">安全状态正常</div><div class="alert-text">今日无异常事件，孩子按时到家。</div></div>';
  }
}

/* ===== 成长评价 ===== */
function renderEvaluation() {
  renderProgress('qualitative-list', StudentProfile.qualitative, 'var(--accent)');
  renderProgress('ability-list', StudentProfile.abilities, 'var(--sage)');

  var geniusAbilities = Object.entries(StudentProfile.abilities).filter(function(entry) { return entry[1] >= 90; });
  var badgeHtml = '';
  for (var i = 0; i < geniusAbilities.length; i++) {
    var k = geniusAbilities[i][0];
    badgeHtml += '<div style="margin-top:8px;"><span class="tag tag-gold">✨ ' + esc(k) + '超同龄TOP 3% — 天才模式已激活</span></div>';
  }
  document.getElementById('genius-badge-ability').innerHTML = badgeHtml;

  var stages = [
    { range: '6-8岁', name: '启蒙期', current: false },
    { range: '9-12岁', name: '基础期', current: true },
    { range: '13-15岁', name: '深化期', current: false },
    { range: '16-18岁', name: '冲刺期', current: false },
  ];
  var stageHtml = '<div style="display:flex;gap:6px;margin-bottom:14px;">';
  for (var i = 0; i < stages.length; i++) {
    var s = stages[i];
    var bg = s.current ? 'var(--accent)' : 'var(--surface-alt)';
    var col = s.current ? '#fff' : 'var(--muted)';
    stageHtml += '<div style="flex:1;text-align:center;padding:8px 4px;border-radius:var(--radius-sm);background:' + bg + ';color:' + col + ';">' +
      '<div style="font-size:0.72rem;">' + s.range + '</div>' +
      '<div style="font-size:0.82rem;font-weight:600;">' + s.name + '</div></div>';
  }
  stageHtml += '</div><div style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:10px;">当前：' + StudentProfile.age + '岁 · 基础期（9-12岁阶段评价标准）</div>';
  document.getElementById('age-stage-display').innerHTML = stageHtml;

  var subjectList = document.getElementById('subject-list');
  var subHtml = '';
  var entries = Object.entries(StudentProfile.subjects);
  for (var i = 0; i < entries.length; i++) {
    var name = entries[i][0];
    var info = entries[i][1];
    var color = info.genius ? 'var(--gold)' : info.score < 80 ? 'var(--coral)' : 'var(--sage)';
    var geniusTag = info.genius ? ' <span class="tag tag-gold" style="font-size:0.6rem;padding:1px 4px;">天才</span>' : '';
    subHtml += '<div class="progress-row">' +
      '<div class="progress-label" style="width:70px">' + esc(name) + geniusTag + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + info.score + '%;background:' + color + '"></div></div>' +
      '<div class="progress-value" style="width:60px">' + info.score + ' ' + info.trend + '</div></div>';
    if (info.genius) {
      subHtml += '<div style="font-size:0.75rem;color:var(--gold);margin-bottom:10px;">超同龄2σ+ · 已启动天才模式：引入竞赛级内容</div>';
    }
  }
  subjectList.innerHTML = subHtml;
}

/* ===== MBTI 性格评测 ===== */
function renderMBTI() {
  var result = MBTIAssessment.assess(StudentProfile);
  var info = result.info;
  var container = document.getElementById('mbti-result');
  if (!info) { container.innerHTML = '<div class="empty-state">评测数据不足</div>'; return; }

  // 四维度倾向条
  var eiLabel = result.isE ? 'E 外向' : 'I 内向';
  var snLabel = result.isN ? 'N 直觉' : 'S 实感';
  var tfLabel = result.isT ? 'T 思考' : 'F 情感';
  var jpLabel = result.isJ ? 'J 判断' : 'P 知觉';
  var eiPct = Math.min(100, Math.abs(result.scores.ei) + 50);
  var snPct = Math.min(100, Math.abs(result.scores.sn) + 50);
  var tfPct = Math.min(100, Math.abs(result.scores.tf) + 50);
  var jpPct = Math.min(100, Math.abs(result.scores.jp) + 50);

  var html = '';
  // MBTI 类型大卡片
  html += '<div class="mbti-hero">' +
    '<div class="mbti-type">' + esc(result.type) + '</div>' +
    '<div class="mbti-name">' + esc(info.name) + '</div>' +
    '<div class="mbti-desc">' + esc(info.desc) + '</div></div>';

  // 四维度倾向
  html += '<div class="mbti-axis-list">';
  html += renderAxisBar('E 外向', 'I 内向', eiPct, result.isE);
  html += renderAxisBar('N 直觉', 'S 实感', snPct, result.isN);
  html += renderAxisBar('T 思考', 'F 情感', tfPct, result.isT);
  html += renderAxisBar('J 判断', 'P 知觉', jpPct, result.isJ);
  html += '</div>';

  // 性格特质标签
  html += '<div style="margin:12px 0 8px;"><strong>性格特质：</strong></div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
  for (var i = 0; i < info.traits.length; i++) {
    html += '<span class="tag tag-accent">' + esc(info.traits[i]) + '</span>';
  }
  html += '</div>';

  // 优势与成长
  html += '<div class="list-item"><strong style="color:var(--sage);">✓ 优势：</strong>' + esc(info.strengths) + '</div>';
  html += '<div class="list-item"><strong style="color:var(--gold);">⚠ 成长方向：</strong>' + esc(info.growth) + '</div>';

  container.innerHTML = html;
}

function renderAxisBar(leftLabel, rightLabel, pct, isLeft) {
  var leftColor = isLeft ? 'var(--accent)' : 'var(--muted)';
  var rightColor = isLeft ? 'var(--muted)' : 'var(--sage)';
  var leftWeight = isLeft ? '700' : '400';
  var rightWeight = isLeft ? '400' : '700';
  return '<div class="mbti-axis-row">' +
    '<span style="font-size:0.75rem;color:' + leftColor + ';font-weight:' + leftWeight + ';width:55px;text-align:right;">' + esc(leftLabel) + '</span>' +
    '<div class="mbti-axis-track">' +
    '<div class="mbti-axis-fill" style="width:' + pct + '%;"></div>' +
    '</div>' +
    '<span style="font-size:0.75rem;color:' + rightColor + ';font-weight:' + rightWeight + ';width:55px;">' + esc(rightLabel) + '</span>' +
    '</div>';
}

/* ===== 榜样力量 · 培养方向 ===== */
function renderRoleModel() {
  var result = MBTIAssessment.assess(StudentProfile);
  var container = document.getElementById('role-model-plan');
  if (!result.info) { container.innerHTML = '<div class="empty-state">评测数据不足</div>'; return; }

  // 取匹配度最高的天赋赛道
  var topTrack = TalentTracks.tracks[0];
  var plan = MBTIAssessment.getCultivationPlan(result.type, topTrack.name);
  var info = result.info;

  var html = '';

  // 综合培养方向卡片
  html += '<div class="role-model-hero">' +
    '<div class="role-model-title">🎯 综合培养方向</div>' +
    '<div style="font-size:0.85rem;color:var(--ink-soft);margin-bottom:10px;">' +
    'MBTI <strong style="color:var(--accent)">' + esc(result.type) + ' · ' + esc(info.name) + '</strong>' +
    ' × 天赋赛道 <strong style="color:var(--gold)">' + esc(topTrack.name) + '</strong>' +
    '</div>' +
    '<div class="role-model-cultivate">' + esc(info.cultivate) + '</div></div>';

  // 名人榜样列表
  html += '<div style="margin:16px 0 10px;"><strong>🌟 同型名人榜样</strong></div>';
  for (var i = 0; i < info.famous.length; i++) {
    var f = info.famous[i];
    html += '<div class="role-model-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">' +
      '<div><strong style="font-size:0.95rem;">' + esc(f.name) + '</strong>' +
      '<span class="tag tag-gold" style="margin-left:6px;font-size:0.65rem;">' + esc(f.role) + '</span></div>' +
      '<span style="font-size:0.72rem;color:var(--muted);">' + esc(f.field) + '</span></div>' +
      '<div style="font-size:0.8rem;color:var(--ink-soft);">' + esc(f.achievement) + '</div>' +
      '<div style="font-size:0.75rem;color:var(--sage);margin-top:6px;">💡 榜样启示：' + getRoleModelInsight(result.type, f) + '</div>' +
      '</div>';
  }

  // 匹配的职业方向
  html += '<div style="margin:16px 0 10px;"><strong>💼 匹配职业方向</strong></div>';
  if (plan.jobs.length > 0) {
    for (var j = 0; j < plan.jobs.length; j++) {
      var job = plan.jobs[j];
      html += '<div class="progress-row">' +
        '<div class="progress-label" style="width:auto;min-width:120px">' + esc(job.name) + '</div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + job.fit + '%;background:var(--blue)"></div></div>' +
        '<div class="progress-value">' + job.fit + '%</div></div>' +
        '<div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;">能力差距：' + esc(job.gap) + '</div>';
    }
  } else {
    html += '<div class="empty-state">暂无匹配职业数据</div>';
  }

  // 桥接路径
  html += '<div style="margin:14px 0 8px;"><strong>🔗 桥接路径</strong></div>';
  html += '<div class="role-model-bridge">' + esc(topTrack.bridge) + '</div>';

  container.innerHTML = html;
}

function getRoleModelInsight(mbtiType, famous) {
  var insights = {
    'INTJ': '像' + famous.name + '一样，培养系统性思维与长期规划能力，学会把愿景拆解为可执行步骤',
    'INTP': '像' + famous.name + '一样，保持对世界的好奇心，同时训练把理论转化为实践的能力',
    'ENTJ': '像' + famous.name + '一样，锻炼领导力与决策力，同时学会倾听团队的声音',
    'ENTP': '像' + famous.name + '一样，发挥创新思维，同时培养把创意落地为成果的执行力',
    'INFJ': '像' + famous.name + '一样，坚持理想与信念，同时注意自我关怀与情绪平衡',
    'INFP': '像' + famous.name + '一样，用创造力表达内心世界，同时增强现实感与行动力',
    'ENFJ': '像' + famous.name + '一样，发挥激励他人的天赋，同时学会照顾自己的需求',
    'ENFP': '像' + famous.name + '一样，保持热情与创意，同时培养专注与坚持的习惯',
    'ISTJ': '像' + famous.name + '一样，发挥可靠与严谨的优势，同时尝试拥抱变化',
    'ISFJ': '像' + famous.name + '一样，用温暖守护他人，同时学会表达自己的需求',
    'ESTJ': '像' + famous.name + '一样，发挥组织管理能力，同时培养同理心与包容度',
    'ESFJ': '像' + famous.name + '一样，用热情连接他人，同时增强独立判断力',
    'ISTP': '像' + famous.name + '一样，发挥动手实践能力，同时培养长远规划意识',
    'ISFP': '像' + famous.name + '一样，用艺术感知世界，同时增强规划与执行力',
    'ESTP': '像' + famous.name + '一样，把握机会勇敢行动，同时培养耐心与反思习惯',
    'ESFP': '像' + famous.name + '一样，用表现力感染他人，同时培养深度思考能力'
  };
  return insights[mbtiType] || '从榜样身上学习其优秀品质，结合自身特点发展';
}

/* ===== 相似学生协同匹配（32维Embedding + KNN + 协同过滤） ===== */
function renderSimilarStudents() {
  var mbtiResult = MBTIAssessment.assess(StudentProfile);
  var targetVec = StudentEmbedding.buildVector(StudentProfile, mbtiResult);

  // 1) Embedding 可视化
  var summary = StudentEmbedding.vectorSummary(targetVec);
  var vizHtml = '<div class="embedding-section"><div class="embedding-title">📐 当前学生 32 维画像向量</div>' +
    '<div class="embedding-blocks">';
  for (var s = 0; s < summary.length; s++) {
    var item = summary[s];
    var isText = typeof item.value === 'string';
    var pct = isText ? 100 : item.value;
    var display = isText ? item.value : item.value + '';
    vizHtml += '<div class="embedding-block">' +
      '<div class="embedding-block-label">' + esc(item.name) + '</div>' +
      '<div class="embedding-block-value" style="' + (isText ? '' : 'font-size:1.1rem;color:var(--accent);') + '">' + esc(display) + (isText ? '' : '') + '</div>' +
      (isText ? '' : '<div class="embedding-block-bar"><div style="width:' + pct + '%;background:var(--accent);height:3px;border-radius:2px;"></div></div>') +
      '</div>';
  }
  vizHtml += '</div>' +
    '<div style="font-size:0.7rem;color:var(--muted);margin-top:6px;">向量构成：能力6维 + 定性6维 + 学科6维 + MBTI4维 + 兴趣4维 + 性格6维 = 32维</div>' +
    '</div>';
  document.getElementById('embedding-viz').innerHTML = vizHtml;

  // 2) 生成模拟学生群体并 KNN 匹配
  var cohort = StudentEmbedding.generateCohort(120, 20260624);
  var similar = StudentEmbedding.findSimilar(targetVec, cohort, 6);

  var simHtml = '<div class="embedding-section"><div class="embedding-title">🔍 KNN 最近邻匹配（Top 6 / 120 名学员）</div>';
  for (var i = 0; i < similar.length; i++) {
    var stu = similar[i].student;
    var sim = Math.round(similar[i].similarity * 100);
    var simColor = sim > 85 ? 'var(--sage)' : sim > 75 ? 'var(--accent)' : 'var(--gold)';
    simHtml += '<div class="similar-student-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
      '<div><strong>' + esc(stu.name) + '</strong> <span style="font-size:0.72rem;color:var(--muted);">' + stu.age + '岁</span></div>' +
      '<span class="tag" style="background:' + simColor + ';color:#fff;font-size:0.72rem;">相似度 ' + sim + '%</span></div>' +
      '<div style="font-size:0.78rem;color:var(--ink-soft);margin-bottom:4px;">🎯 ' + esc(stu.track) + '</div>' +
      '<div style="font-size:0.78rem;color:var(--ink-soft);margin-bottom:4px;">📍 ' + esc(stu.path) + '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--muted);">' +
      '<span>🏆 ' + esc(stu.outcome) + '</span>' +
      '<span>📈 能力提升 +' + stu.improvement + '</span></div>' +
      '<div class="similarity-bar"><div class="similarity-fill" style="width:' + sim + '%;background:' + simColor + ';"></div></div>' +
      '</div>';
  }
  simHtml += '</div>';
  document.getElementById('similar-students').innerHTML = simHtml;

  // 3) 协同过滤路径推荐
  var reco = StudentEmbedding.recommendPath(similar);
  var recoHtml = '<div class="embedding-section recommendation-section"><div class="embedding-title">🎯 协同过滤路径推荐</div>';
  if (reco) {
    recoHtml += '<div class="recommendation-hero">' +
      '<div style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:6px;">基于 ' + reco.supporters + ' 名相似学员的成长轨迹加权投票</div>' +
      '<div class="recommendation-track">推荐赛道：' + esc(reco.recommendedTrack) + '</div>' +
      '<div class="recommendation-path">推荐路径：' + esc(reco.recommendedPath) + '</div>' +
      '</div>';
    recoHtml += '<div class="recommendation-metrics">' +
      '<div class="metric-card"><div class="metric-value" style="color:var(--accent);">+' + reco.predictedImprovement + '</div><div class="metric-label">预测能力提升</div></div>' +
      '<div class="metric-card"><div class="metric-value" style="color:var(--sage);">' + reco.confidence + '%</div><div class="metric-label">推荐置信度</div></div>' +
      '<div class="metric-card"><div class="metric-value" style="color:var(--gold);">' + reco.avgSimilarity + '%</div><div class="metric-label">平均相似度</div></div>' +
      '<div class="metric-card"><div class="metric-value" style="color:var(--blue);">' + reco.pathConsistency + '%</div><div class="metric-label">路径一致性</div></div>' +
      '</div>';
    recoHtml += '<div class="recommendation-outcome">' +
      '<strong>🏆 成果预测：</strong>' + esc(reco.outcomePrediction) + '</div>';
    recoHtml += '<div style="font-size:0.72rem;color:var(--muted);margin-top:10px;line-height:1.6;">' +
      '算法说明：对Top ' + reco.supporters + ' 名相似学员的培养路径进行加权投票（权重=余弦相似度），' +
      '选出得票最高的赛道与路径；置信度 = Top1相似度×0.6 + 路径一致性×0.4；' +
      '能力提升预测 = 相似学员提升幅度的相似度加权平均。</div>';
  } else {
    recoHtml += '<div class="empty-state">数据不足</div>';
  }
  recoHtml += '</div>';
  document.getElementById('path-recommendation').innerHTML = recoHtml;
}

/* ===== 天赋评测 ===== */
function renderTalent() {
  // 使用真实余弦相似度算法计算赛道匹配度
  var trackResults = TalentTracks.computeTrackMatches(StudentProfile);
  var mbtiResult = MBTIAssessment.assess(StudentProfile);

  var trackContainer = document.getElementById('talent-tracks');
  var trackHtml = '';
  for (var idx = 0; idx < trackResults.length; idx++) {
    var item = trackResults[idx];
    var t = item.track;
    var matchVal = item.realMatch;
    trackHtml += '<div class="list-item">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
      '<strong>' + (idx + 1) + '. ' + esc(t.name) + '</strong>' +
      '<span class="tag tag-sage">余弦相似度 ' + matchVal + '%</span></div>' +
      '<div style="font-size:0.82rem;color:var(--muted);margin-bottom:6px">' + esc(t.short) + '</div>' +
      '<div class="progress-track" style="margin-bottom:8px"><div class="progress-fill" style="width:' + matchVal + '%;background:var(--gold)"></div></div>' +
      '<div style="font-size:0.75rem;color:var(--sage);margin-bottom:6px;">算法：cos(学生能力向量, 赛道需求向量) = ' + matchVal + '%</div>' +
      '<div style="font-size:0.82rem;margin-bottom:4px"><strong>培养建议：</strong>' + esc(t.advice) + '</div>' +
      '<div style="font-size:0.82rem;color:var(--muted)"><strong>桥接路径：</strong>' + esc(t.bridge) + '</div>' +
      '<div style="margin-top:8px;">';

    var reqEntries = Object.entries(t.requirements);
    for (var r = 0; r < reqEntries.length; r++) {
      var k = reqEntries[r][0];
      var v = reqEntries[r][1];
      var studentVal = StudentProfile.abilities[k] || 0;
      var meet = studentVal / 100 >= v;
      var tagClass = meet ? 'tag-sage' : 'tag-coral';
      var mark = meet ? '✓' : '✗';
      trackHtml += '<span class="tag ' + tagClass + '" style="font-size:0.7rem;">' + esc(k) + ': 需' + Math.round(v * 100) + ' / 有' + studentVal + ' ' + mark + '</span>';
    }
    trackHtml += '</div></div>';
  }
  trackContainer.innerHTML = trackHtml;

  var fragContainer = document.getElementById('fragment-list');
  var fragHtml = '';
  for (var i = 0; i < fragments.length; i++) {
    var f = fragments[i];
    fragHtml += '<div class="list-item">' +
      '<span class="tag tag-accent">' + esc(f.signal) + '</span>' +
      '<span class="tag tag-sage">' + esc(f.scene) + '</span>' +
      '<span class="tag tag-gold">' + esc(f.dim) + '</span>' +
      '<div style="margin-top:6px;font-size:0.85rem">' + esc(f.desc) + '</div></div>';
  }
  fragContainer.innerHTML = fragHtml;

  // 使用真实三因子加权算法计算岗位贴合度
  var jobResults = TalentTracks.computeJobFit(StudentProfile, mbtiResult.type);
  var jobContainer = document.getElementById('job-fit');
  var jobHtml = '';
  for (var i = 0; i < jobResults.length; i++) {
    var j = jobResults[i];
    jobHtml += '<div class="progress-row">' +
      '<div class="progress-label" style="width:auto;min-width:120px">' + esc(j.name) + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + j.fit + '%;background:var(--blue)"></div></div>' +
      '<div class="progress-value">' + j.fit + '%</div></div>' +
      '<div style="font-size:0.72rem;color:var(--sage);margin-bottom:4px;">三因子加权：' + esc(j.detail) + '</div>' +
      '<div style="font-size:0.75rem;color:var(--muted);margin-bottom:10px">能力差距：' + esc(j.gap) + ' · 趋势：' + esc(j.trend) + '</div>';
  }
  jobContainer.innerHTML = jobHtml;
}

/* ===== 心理健康 ===== */
function renderMental() {
  var container = document.getElementById('emotion-chart');
  var size = 320, padding = 30, width = size - padding * 2, height = 120, max = 100;
  var step = width / (PsychologyData.emotionTrend.length - 1);
  var points = '';
  var circlesAndText = '';
  for (var i = 0; i < PsychologyData.emotionTrend.length; i++) {
    var d = PsychologyData.emotionTrend[i];
    var x = padding + i * step;
    var y = padding + height - (d.value / max) * height;
    points += x + ',' + y + ' ';
    circlesAndText += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#6B9080"/>';
    circlesAndText += '<text x="' + x + '" y="' + (padding + height + 18) + '" text-anchor="middle" font-size="11" fill="#9B8E82">' + esc(d.day) + '</text>';
  }
  container.innerHTML =
    '<svg viewBox="0 0 ' + size + ' 180" width="100%" height="100%">' +
    '<line x1="' + padding + '" y1="' + (padding + height) + '" x2="' + (size - padding) + '" y2="' + (padding + height) + '" stroke="#E8E0D8" stroke-width="1"/>' +
    '<line x1="' + padding + '" y1="' + padding + '" x2="' + padding + '" y2="' + (padding + height) + '" stroke="#E8E0D8" stroke-width="1"/>' +
    '<polyline points="' + points + '" fill="none" stroke="#6B9080" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    circlesAndText +
    '</svg>';
  document.getElementById('emotion-summary').textContent = '本周情绪整体平稳，周末明显提升。当前情绪状态：' + PsychologyData.emotionState + '。';

  var stress = PsychologyData.stressIndex;
  var stressColor = stress < 40 ? 'var(--sage)' : stress < 70 ? 'var(--gold)' : 'var(--coral)';
  var stressText = stress < 40 ? '压力水平正常' : stress < 70 ? '需关注' : '建议干预';
  document.getElementById('stress-display').innerHTML =
    '<div style="text-align:center;margin-bottom:10px;">' +
    '<span style="font-size:2rem;font-weight:800;color:' + stressColor + ';">' + stress + '</span>' +
    '<span style="font-size:0.85rem;color:var(--muted);">/ 100</span></div>' +
    '<div class="progress-track"><div class="progress-fill" style="width:' + stress + '%;background:' + stressColor + '"></div></div>' +
    '<div style="font-size:0.78rem;color:var(--muted);margin-top:6px;text-align:center;">' + stressText + '</div>';

  var langHtml = '';
  var langEntries = Object.entries(PsychologyData.languageMetrics);
  for (var i = 0; i < langEntries.length; i++) {
    var k = langEntries[i][0];
    var v = langEntries[i][1];
    langHtml += '<div class="list-item"><strong>' + esc(k) + '：</strong>' + esc(v.value) + ' <span style="color:var(--muted);">(' + esc(v.trend) + ')</span></div>';
  }
  document.getElementById('language-analysis').innerHTML = langHtml;

  var catchHtml = '';
  for (var i = 0; i < PsychologyData.catchphrases.length; i++) {
    var c = PsychologyData.catchphrases[i];
    var color = c.zScore > 2.5 ? 'var(--coral)' : c.zScore > 1.5 ? 'var(--gold)' : 'var(--sage)';
    catchHtml += '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><strong>"' + esc(c.phrase) + '"</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">本周' + c.freq + '次 · 基线' + c.baseline + '次 · Z=' + c.zScore.toFixed(1) + '</div></div>' +
      '<span class="tag" style="background:' + color + '20;color:' + color + ';">' + esc(c.status) + '</span></div>';
  }
  document.getElementById('catchphrase-list').innerHTML = catchHtml;

  var alertContainer = document.getElementById('mental-alert');
  var hasWarning = false;
  for (var i = 0; i < PsychologyData.catchphrases.length; i++) {
    if (PsychologyData.catchphrases[i].zScore > 2.5) { hasWarning = true; break; }
  }
  if (hasWarning) {
    alertContainer.innerHTML = '<div class="alert"><div class="alert-title">⚠️ 心理预警</div><div class="alert-text">检测到部分口头禅频率异常升高（Z-score > 2.5），建议关注孩子近期情绪状态，必要时寻求专业帮助。</div></div>';
  } else {
    alertContainer.innerHTML = '<div class="alert" style="border-left-color:var(--sage);background:var(--sage-light);"><div class="alert-title" style="color:var(--sage);">心理状态正常</div><div class="alert-text">本周激烈言辞频率低，情绪趋势平稳。建议继续保持周末亲子互动节奏。</div></div>';
  }
}

/* ===== 学情详情 ===== */
function renderStudy() {
  document.getElementById('study-age-stage').innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
    '<span style="font-size:0.85rem;color:var(--ink-soft);">当前阶段</span>' +
    '<span style="font-weight:700;color:var(--accent);">' + StudentProfile.age + '岁 · ' + esc(StudentProfile.stage) + '</span>' +
    '<div class="progress-track" style="flex:1;max-width:120px;"><div class="progress-fill" style="width:45%;background:var(--accent);"></div></div>' +
    '<span style="font-size:0.72rem;color:var(--muted);">下一阶段: 13岁深化期</span></div>';

  var subHtml = '';
  var entries = Object.entries(StudentProfile.subjects);
  for (var i = 0; i < entries.length; i++) {
    var name = entries[i][0];
    var info = entries[i][1];
    var color = info.genius ? 'var(--gold)' : info.score < 80 ? 'var(--coral)' : 'var(--sage)';
    var geniusTag = info.genius ? ' <span class="tag tag-gold" style="font-size:0.6rem;padding:1px 4px;">✨天才</span>' : '';
    subHtml += '<div style="padding:4px 0">' +
      '<div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px;">' +
      '<span>' + esc(name) + geniusTag + '</span>' +
      '<span style="font-weight:600;color:' + color + '">' + info.score + '% ' + info.trend + '</span></div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + info.score + '%;background:' + color + '"></div></div>';
    if (info.genius) {
      subHtml += '<p style="font-size:0.72rem;color:var(--gold);margin:3px 0 0;">超同龄2σ+ · 天才模式：引入竞赛级内容+加速间隔重复</p>';
    }
    subHtml += '</div>';
  }
  document.getElementById('study-subjects').innerHTML = subHtml;

  var geniusSubjects = StudentProfile.geniusSubjects;
  var geniusHtml = '';
  if (geniusSubjects.length > 0) {
    geniusHtml = '<div style="font-size:0.85rem;margin-bottom:10px;">已激活天才模式的学科：<strong style="color:var(--gold)">' + geniusSubjects.join('、') + '</strong></div>' +
      '<div style="font-size:0.82rem;color:var(--ink-soft);">' +
      '<p>• 自动加深知识深度，引入竞赛级内容</p>' +
      '<p>• 加速间隔重复节奏（4轮→3轮）</p>' +
      '<p>• 推荐外部资源（竞赛班、在线课程）</p>' +
      '<p>• 跨学科联动桥接，培养复合型天赋</p></div>';
  } else {
    geniusHtml = '<div class="empty-state">暂未触发天才模式</div>';
  }
  document.getElementById('genius-mode').innerHTML = geniusHtml;

  var logHtml = '';
  for (var i = 0; i < knowledgeLog.length; i++) {
    var k = knowledgeLog[i];
    logHtml += '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><strong>' + esc(k.knowledge) + '</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(k.subject) + ' · ' + esc(k.scene) + ' · ' + esc(k.status) + '</div></div>' +
      '<span style="font-size:0.78rem;color:var(--muted);">' + esc(k.time) + '</span></div>';
  }
  document.getElementById('knowledge-log').innerHTML = logHtml;
}

/* ===== 安全提醒 ===== */
function renderSafety() {
  var typesHtml = '';
  var typeEntries = Object.entries(SafetyEngine.riskTypes);
  for (var i = 0; i < typeEntries.length; i++) {
    var key = typeEntries[i][0];
    var info = typeEntries[i][1];
    var tagClass = info.level === 'P0' ? 'tag-coral' : 'tag-gold';
    typesHtml += '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><strong>' + esc(info.name) + '</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(info.response) + '</div></div>' +
      '<span class="tag ' + tagClass + '">' + info.level + '</span></div>';
  }
  document.getElementById('safety-types').innerHTML = typesHtml;

  renderSafetyEvents();
}

function renderSafetyEvents() {
  var container = document.getElementById('safety-events');
  if (SafetyEngine.events.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无安全事件记录 ✓</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < SafetyEngine.events.length; i++) {
    var e = SafetyEngine.events[i];
    var time = new Date(e.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    var color = e.level === 'P0' ? 'var(--coral)' : 'var(--gold)';
    var tagClass = e.resolved ? 'tag-sage' : 'tag-coral';
    var statusText = e.resolved ? '已处理' : '待处理';
    html += '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><strong style="color:' + color + '">' + esc(e.typeName) + '</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(e.detail) + '</div></div>' +
      '<div style="text-align:right;"><div style="font-size:0.75rem;color:var(--muted);">' + time + '</div>' +
      '<span class="tag ' + tagClass + '" style="font-size:0.68rem;">' + statusText + '</span></div></div>';
  }
  container.innerHTML = html;
}

function simulateSafetyEvent(type) {
  var details = {
    traffic: '检测到孩子在马路边停留，已语音提醒注意安全',
    stranger: '检测到陌生人接近，已提醒保持距离并通知家长',
    weather: '检测到恶劣天气（暴雨），已提醒避险',
    stay: '检测到异常滞留（非日常路线停留>15分钟）',
    fall: '检测到可能的跌倒，已询问状况'
  };
  SafetyEngine.addEvent(type, details[type] || '未知事件');
  renderSafetyEvents();
  renderOverview();
}

/* ===== 共育决策 ===== */
var decisionChat = document.getElementById('decision-chat');
var decisionInput = document.getElementById('decision-input');
var decisionSend = document.getElementById('decision-send');

function addDecisionBubble(role, text) {
  var div = document.createElement('div');
  div.className = 'chat-bubble ' + role;
  div.textContent = text;
  decisionChat.appendChild(div);
  decisionChat.scrollTop = decisionChat.scrollHeight;
}

function generateDecisionReply(text) {
  var t = text.toLowerCase();
  var analysis = '', suggestion = '';

  if (/竞赛|奥数|数学/.test(t)) {
    analysis = '数据呈现：数学' + StudentProfile.subjects['数学'].score + '分（趋势' + StudentProfile.subjects['数学'].trend + '），计算力' + StudentProfile.abilities['计算力'] + '，推理力' + StudentProfile.abilities['推理力'] + '。已处于同龄前15%。';
    suggestion = '建议：如果孩子本身有兴趣，可以先尝试校内竞赛或线上挑战，观察投入度再决定是否报班。不建议过早高强度训练。';
  } else if (/历史|文科|薄弱|兴趣/.test(t)) {
    analysis = '数据呈现：历史' + StudentProfile.subjects['历史'].score + '分，有下降趋势（' + StudentProfile.subjects['历史'].trend + '）。结合学生空间力突出（' + StudentProfile.abilities['空间力'] + '）、对建筑和游戏场景敏感的特点。';
    suggestion = '建议：用"场景旅行"方式切入——参观古建筑、看历史纪录片，把时间和空间线索结合起来。不要强迫背诵。';
  } else if (/物理|理科/.test(t)) {
    analysis = '数据呈现：物理' + StudentProfile.subjects['物理'].score + '分，已进入天才模式识别阈值。持续高于同龄2个标准差。';
    suggestion = '建议：提供更高阶的实验资源或竞赛级内容，同时保持跨学科桥接，避免偏科。可考虑引入物理实验套件。';
  } else if (/时间|管理|手机|屏幕/.test(t)) {
    analysis = '数据呈现：本周屏幕连续使用时长目标完成62%，仍有提升空间。健康守护已触发2次休息提醒。';
    suggestion = '建议：和孩子一起制定"番茄钟+搭子提醒"规则，把决策权交还给孩子，培养自我管理能力。';
  } else {
    var qualAvg = Math.round(Object.values(StudentProfile.qualitative).reduce(function(a, b) { return a + b; }, 0) / 6);
    var abilAvg = Math.round(Object.values(StudentProfile.abilities).reduce(function(a, b) { return a + b; }, 0) / 6);
    analysis = '数据呈现：综合定性评价平均' + qualAvg + '分，六维能力平均' + abilAvg + '分。';
    suggestion = '建议：先和孩子做一次"兴趣+目标"对齐对话。您希望我重点分析哪方面的数据？';
  }

  DecisionLog.add(text.substring(0, 30), analysis, suggestion, '讨论中', '');
  return analysis + '\n\n' + suggestion;
}

function sendDecision() {
  var text = decisionInput.value.trim();
  if (!text) return;
  addDecisionBubble('user', text);
  decisionInput.value = '';
  setTimeout(function() {
    addDecisionBubble('ai', generateDecisionReply(text));
    renderDecisionLog();
  }, 500);
}

decisionSend.addEventListener('click', sendDecision);
decisionInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendDecision(); });

function renderGoals() {
  var html = '';
  for (var i = 0; i < goals.length; i++) {
    var g = goals[i];
    html += '<div class="progress-row">' +
      '<div class="progress-label" style="width:auto;min-width:140px">' + esc(g.name) + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + g.progress + '%;background:var(--accent)"></div></div>' +
      '<div class="progress-value">' + g.progress + '%</div></div>';
  }
  document.getElementById('goal-list').innerHTML = html;
}

function renderDecisionLog() {
  var container = document.getElementById('decision-log');
  var html = '';
  for (var i = 0; i < DecisionLog.records.length; i++) {
    var d = DecisionLog.records[i];
    var time = new Date(d.timestamp).toLocaleDateString('zh-CN');
    var tagClass = d.status === 'completed' ? 'tag-sage' : 'tag-gold';
    html += '<div class="list-item">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
      '<strong>' + esc(d.topic) + '</strong>' +
      '<span class="tag ' + tagClass + '" style="font-size:0.68rem;">' + esc(d.consensus) + '</span></div>' +
      '<div style="font-size:0.78rem;color:var(--ink-soft);margin-bottom:3px;">分析：' + esc(d.analysis) + '</div>' +
      '<div style="font-size:0.78rem;color:var(--muted);">建议：' + esc(d.suggestion) + '</div>';
    if (d.strategy) {
      html += '<div style="font-size:0.75rem;color:var(--sage);margin-top:3px;">策略：' + esc(d.strategy) + '</div>';
    }
    html += '<div style="font-size:0.72rem;color:var(--muted);margin-top:3px;">' + time + '</div></div>';
  }
  container.innerHTML = html;
}

/* ===== 搭子设置 ===== */
function renderSettings() {
  var dims = [
    { key: 'warmth', label: '温暖度', desc: '搭子的关怀程度', color: 'var(--accent)' },
    { key: 'humor', label: '幽默感', desc: '话术的趣味性', color: 'var(--gold)' },
    { key: 'patience', label: '耐心度', desc: '引导的耐心程度', color: 'var(--sage)' },
    { key: 'proactivity', label: '主动性', desc: '主动发起话题的频率', color: 'var(--coral)' },
    { key: 'formality', label: '正式度', desc: '语言的正式程度', color: 'var(--blue)' },
    { key: 'curiosity', label: '好奇心', desc: '探索新话题的倾向', color: 'var(--accent)' }
  ];

  var html = '';
  for (var i = 0; i < dims.length; i++) {
    var d = dims[i];
    var v = Personality.vector[d.key];
    var bound = Personality.bounds[d.key];
    var locked = Personality.locked[d.key];
    var lockBg = locked ? 'var(--accent)' : 'var(--surface-alt)';
    var lockCol = locked ? '#fff' : 'var(--ink-soft)';
    var lockText = locked ? '已锁定' : '锁定';
    html += '<div class="list-item">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
      '<div><strong>' + esc(d.label) + '</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(d.desc) + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span style="font-size:0.85rem;font-weight:600;color:' + d.color + ';">' + Math.round(v * 100) + '</span>' +
      '<button class="btn" style="padding:4px 10px;font-size:0.72rem;background:' + lockBg + ';color:' + lockCol + ';" onclick="toggleLock(\'' + d.key + '\')">' + lockText + '</button></div></div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + (v * 100) + '%;background:' + d.color + '"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--muted);margin-top:3px;">' +
      '<span>下限 ' + Math.round(bound.min * 100) + '</span>' +
      '<span>安全边界</span>' +
      '<span>上限 ' + Math.round(bound.max * 100) + '</span></div></div>';
  }
  document.getElementById('personality-settings').innerHTML = html;

  document.getElementById('safety-bounds').innerHTML =
    '<div class="list-item"><strong>温暖度下限 0.5：</strong>搭子永远不会变得冷漠</div>' +
    '<div class="list-item"><strong>耐心度下限 0.7：</strong>搭子永远不会对学生不耐烦</div>' +
    '<div class="list-item"><strong>正式度上限 0.6：</strong>搭子永远不会变成"老师"语气</div>' +
    '<div class="list-item"><strong>信息熵约束（高情商）：</strong>单次输出信息密度 ≥ 0.7，冗余度 ≤ 0.3，避免低信息量重复性表述</div>' +
    '<div class="list-item"><strong>话轮占比上限：</strong>对话中搭子发言占比 ≤ 40%，保障学生表达空间，防止话语霸权</div>' +
    '<div class="list-item"><strong>侵入性抑制：</strong>主动干预信噪比 ≥ 3:1（即每3次被动响应才允许1次主动发起），避免注意力劫持</div>' +
    '<div class="list-item"><strong>语义新颖性阈值：</strong>连续两次发言的语义相似度 ≤ 0.6，杜绝啰嗦与同义反复</div>' +
    '<div class="list-item" style="color:var(--muted);font-size:0.82rem;">这些边界确保性格演化不会偏离"益友"定位，同时维持高情商的非侵入式交互</div>';

  document.getElementById('frequency-control').innerHTML =
    '<div class="list-item"><strong>主动话题间隔：</strong>≥ 15 分钟</div>' +
    '<div class="list-item"><strong>每日上限：</strong>≤ 20 次</div>' +
    '<div class="list-item"><strong>冷却规则：</strong>连续忽略 2 次 → 30分钟内不再主动发起</div>' +
    '<div class="list-item"><strong>情绪感知：</strong>检测到烦躁/疲惫时自动降频或静默</div>' +
    '<div class="list-item"><strong>断网保护：</strong>安全功能继续运行（边缘端）</div>' +
    '<div class="list-item"><strong>家长透明：</strong>所有AI对话记录可被家长查看</div>';
}

function toggleLock(dim) {
  Personality.locked[dim] = !Personality.locked[dim];
  renderSettings();
}

/* ===== 商业模式 · 会员服务 ===== */
var pricingPlans = [
  {
    name: '基础版', price: '免费', period: '永久', icon: '🌱', color: 'var(--sage)',
    desc: '核心体验免费开放，让每个家庭都能用起来',
    features: ['摄像头识物 + 知识桥接（每日20次）', '苏格拉底式学习引导（每日5题）', '基础间隔重复复习', '六维能力雷达图', '安全引擎基础版', '社区支持'],
    cta: '当前使用中'
  },
  {
    name: 'Pro版', price: '¥39', period: '/月', icon: '⭐', color: 'var(--accent)', popular: true,
    desc: '解锁完整AI能力，深度个性化培养',
    features: ['无限摄像头识物 + 知识桥接', '无限苏格拉底引导 + 误解检测', '加速间隔重复（4轮→3轮）', 'MBTI性格评测 + 榜样力量', '心理分析5模型完整版', '场景引擎全状态解锁', '共育决策AI助手', '每月1次专家咨询'],
    cta: '升级Pro'
  },
  {
    name: '天才版', price: '¥99', period: '/月', icon: '🚀', color: 'var(--gold)',
    desc: '为天才儿童量身定制的加速培养方案',
    features: ['Pro版全部功能', '天才模式自动激活（2σ+检测）', '竞赛级内容推送', '跨学科桥接强化', '外部资源智能对接（竞赛班/实验室）', '天才赛道1对1导师匹配', '季度天赋深度报告', '优先体验新功能'],
    cta: '申请天才版'
  }
];

var featureCompare = [
  { feature: '摄像头识物', basic: '20次/天', pro: '无限', genius: '无限' },
  { feature: '苏格拉底引导', basic: '5题/天', pro: '无限', genius: '无限+竞赛级' },
  { feature: 'MBTI评测', basic: '—', pro: '✓', genius: '✓+深度报告' },
  { feature: '心理分析', basic: '基础', pro: '5模型完整', genius: '5模型+专家解读' },
  { feature: '间隔重复', basic: '标准4轮', pro: '加速3轮', genius: '极速2轮' },
  { feature: '天才模式', basic: '—', pro: '—', genius: '✓' },
  { feature: '专家咨询', basic: '—', pro: '1次/月', genius: '1次/周' },
  { feature: '课程推荐', basic: '—', pro: '✓', genius: '✓+1对1匹配' }
];

var onlineCourses = [
  { name: '编程思维启蒙（Scratch+Python）', platform: '编程猫', price: '¥299/学期', matchSubject: '信息技术', matchDim: '推理力', matchMBTI: ['INTJ','INTP','ENTP'], rating: 4.8, students: '12万+' },
  { name: '数学竞赛冲刺班（华罗庚杯）', platform: '学而思', price: '¥1999/学期', matchSubject: '数学', matchDim: '计算力', matchMBTI: ['INTJ','INTP','ENTJ'], rating: 4.9, students: '8万+' },
  { name: '物理实验探究课', platform: '猿辅导', price: '¥899/学期', matchSubject: '物理', matchDim: '观察力', matchMBTI: ['INTP','ISTP','ENTP'], rating: 4.7, students: '5万+' },
  { name: '创意写作大师课', platform: '得到', price: '¥199/学期', matchSubject: '语文', matchDim: '创造力', matchMBTI: ['INFP','INFJ','ENFP'], rating: 4.6, students: '15万+' },
  { name: '英语口语AI陪练', platform: '流利说', price: '¥399/年', matchSubject: '英语', matchDim: '记忆力', matchMBTI: ['ESFJ','ENFJ','ESTP'], rating: 4.5, students: '20万+' },
  { name: '生物探索纪录片系列', platform: 'B站课堂', price: '¥99/系列', matchSubject: '生物', matchDim: '观察力', matchMBTI: ['ISFP','INFP','ISTP'], rating: 4.8, students: '3万+' }
];

var offlineCourses = [
  { name: '篮球训练营', venue: '附近·东方启明星', price: '¥180/课时', distance: '1.2km', matchDim: '空间力', matchInterest: 'minecraft', ageRange: '8-15岁', rating: 4.7 },
  { name: '乐高机器人课程', venue: '附近·乐高活动中心', price: '¥220/课时', distance: '0.8km', matchDim: '空间力', matchInterest: 'lego', ageRange: '6-14岁', rating: 4.9 },
  { name: '游泳技能班', venue: '附近·市游泳馆', price: '¥120/课时', distance: '2.5km', matchDim: '观察力', matchInterest: 'threebody', ageRange: '7-16岁', rating: 4.6 },
  { name: '攀岩体验课', venue: '附近·岩点攀岩馆', price: '¥150/课时', distance: '3.0km', matchDim: '空间力', matchInterest: 'minecraft', ageRange: '8-18岁', rating: 4.8 },
  { name: '自然观察营（周末）', venue: '郊外·森林公园', price: '¥380/次', distance: '15km', matchDim: '观察力', matchInterest: 'threebody', ageRange: '6-12岁', rating: 4.9 }
];

function renderPricing() {
  var container = document.getElementById('pricing-plans');
  var html = '';
  for (var i = 0; i < pricingPlans.length; i++) {
    var p = pricingPlans[i];
    var border = p.popular ? '2px solid var(--accent)' : '1px solid var(--border)';
    var badge = p.popular ? '<span class="tag tag-accent" style="position:absolute;top:-10px;right:12px;font-size:0.65rem;">最受欢迎</span>' : '';
    html += '<div class="pricing-card" style="border:' + border + ';position:relative;">' + badge +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      '<span style="font-size:1.5rem;">' + p.icon + '</span>' +
      '<div><div style="font-weight:700;font-size:1rem;">' + esc(p.name) + '</div>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(p.desc) + '</div></div></div>' +
      '<div style="margin-bottom:10px;"><span style="font-size:1.6rem;font-weight:800;color:' + p.color + ';">' + esc(p.price) + '</span>' +
      '<span style="font-size:0.8rem;color:var(--muted);">' + esc(p.period) + '</span></div>' +
      '<div style="margin-bottom:12px;">';
    for (var f = 0; f < p.features.length; f++) {
      html += '<div style="font-size:0.8rem;color:var(--ink-soft);margin-bottom:4px;">✓ ' + esc(p.features[f]) + '</div>';
    }
    html += '</div><button class="btn" style="width:100%;background:' + p.color + ';color:#fff;font-size:0.85rem;">' + esc(p.cta) + '</button></div>';
  }
  container.innerHTML = html;

  // 功能对比表
  var compareHtml = '<div style="overflow-x:auto;"><table class="compare-table"><thead><tr><th>功能</th><th>基础版</th><th>Pro版</th><th>天才版</th></tr></thead><tbody>';
  for (var c = 0; c < featureCompare.length; c++) {
    var fc = featureCompare[c];
    compareHtml += '<tr><td style="font-weight:600;">' + esc(fc.feature) + '</td>' +
      '<td style="color:var(--muted);">' + esc(fc.basic) + '</td>' +
      '<td style="color:var(--accent);font-weight:600;">' + esc(fc.pro) + '</td>' +
      '<td style="color:var(--gold);font-weight:600;">' + esc(fc.genius) + '</td></tr>';
  }
  compareHtml += '</tbody></table></div>';
  document.getElementById('feature-compare').innerHTML = compareHtml;
}

function renderCourses() {
  var mbtiResult = MBTIAssessment.assess(StudentProfile);
  var mbtiType = mbtiResult.type;
  var weakSubjects = StudentProfile.weakSubjects;

  // 线上课程推荐：基于MBTI匹配 + 薄弱学科 + 能力维度
  var onlineContainer = document.getElementById('online-courses');
  var onlineHtml = '';
  for (var i = 0; i < onlineCourses.length; i++) {
    var c = onlineCourses[i];
    var mbtiMatch = c.matchMBTI.indexOf(mbtiType) >= 0;
    var subjectMatch = weakSubjects.indexOf(c.matchSubject) >= 0;
    var dimVal = StudentProfile.abilities[c.matchDim] || 0;
    var dimMatch = dimVal >= 80;
    var score = 50;
    if (mbtiMatch) score += 20;
    if (subjectMatch) score += 25;
    if (dimMatch) score += 15;
    score = Math.min(100, score);
    var reasonHtml = '';
    if (mbtiMatch) reasonHtml += '<span class="tag tag-accent" style="font-size:0.65rem;">MBTI匹配</span> ';
    if (subjectMatch) reasonHtml += '<span class="tag tag-coral" style="font-size:0.65rem;">薄弱学科</span> ';
    if (dimMatch) reasonHtml += '<span class="tag tag-gold" style="font-size:0.65rem;">优势能力</span> ';

    onlineHtml += '<div class="course-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">' +
      '<div><strong style="font-size:0.9rem;">' + esc(c.name) + '</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(c.platform) + ' · ⭐' + c.rating + ' · ' + esc(c.students) + '学员</div></div>' +
      '<span class="tag tag-sage">推荐度 ' + score + '%</span></div>' +
      '<div style="margin:6px 0;">' + reasonHtml + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<span style="font-size:0.82rem;color:var(--ink-soft);">匹配维度：' + esc(c.matchDim) + ' · 学科：' + esc(c.matchSubject) + '</span>' +
      '<span style="font-weight:700;color:var(--accent);">' + esc(c.price) + '</span></div></div>';
  }
  onlineContainer.innerHTML = onlineHtml;

  // 线下体能课程推荐：基于空间力 + 观察力 + 兴趣画像
  var offlineContainer = document.getElementById('offline-courses');
  var offlineHtml = '';
  for (var j = 0; j < offlineCourses.length; j++) {
    var oc = offlineCourses[j];
    var dimVal2 = StudentProfile.abilities[oc.matchDim] || 0;
    var interestMatch = StudentProfile.interests.indexOf(oc.matchInterest) >= 0;
    var score2 = Math.round(dimVal2 * 0.5 + (interestMatch ? 30 : 10) + (oc.rating >= 4.8 ? 20 : 10));
    score2 = Math.min(100, score2);
    var reasonHtml2 = '<span class="tag tag-sage" style="font-size:0.65rem;">' + esc(oc.matchDim) + ' ' + dimVal2 + '</span> ';
    if (interestMatch) reasonHtml2 += '<span class="tag tag-gold" style="font-size:0.65rem;">兴趣匹配</span> ';

    offlineHtml += '<div class="course-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">' +
      '<div><strong style="font-size:0.9rem;">' + esc(oc.name) + '</strong>' +
      '<div style="font-size:0.75rem;color:var(--muted);">' + esc(oc.venue) + ' · 📍' + esc(oc.distance) + ' · ⭐' + oc.rating + '</div></div>' +
      '<span class="tag tag-sage">推荐度 ' + score2 + '%</span></div>' +
      '<div style="margin:6px 0;">' + reasonHtml2 + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<span style="font-size:0.82rem;color:var(--ink-soft);">适合年龄：' + esc(oc.ageRange) + '</span>' +
      '<span style="font-weight:700;color:var(--accent);">' + esc(oc.price) + '</span></div></div>';
  }
  offlineContainer.innerHTML = offlineHtml;
}

function renderBusinessModel() {
  var container = document.getElementById('business-model');
  container.innerHTML =
    '<div class="list-item"><strong>🎯 C端订阅（核心收入）：</strong>Freemium模式，基础免费+Pro版¥39/月+天才版¥99/月。预计转化率8-12%，LTV/CAC>3</div>' +
    '<div class="list-item"><strong>🎓 课程分销佣金：</strong>与线上教育平台（学而思/猿辅导/编程猫等）合作，按成交金额15-25%抽佣</div>' +
    '<div class="list-item"><strong>🏃 线下机构对接：</strong>为体能/艺术/科创机构导流，按到店体验¥50/人+成单¥200/单收费</div>' +
    '<div class="list-item"><strong>🏫 B端学校授权：</strong>向K12学校提供"不三迁校园版"SaaS，按学生数¥20/学期授权</div>' +
    '<div class="list-item"><strong>📊 数据报告增值：</strong>季度天赋深度报告¥49/份、年度成长白皮书¥99/份</div>' +
    '<div class="list-item"><strong>🔬 天才计划专项：</strong>天才版用户对接竞赛班/实验室/导师资源，按匹配服务¥999/次</div>' +
    '<div class="list-item" style="color:var(--muted);font-size:0.82rem;">商业模式核心：用免费基础版获客 → 用AI深度评测创造付费动机 → 用课程推荐实现商业闭环 → 用天才版建立高端品牌</div>';
}

/* ===== 底部导航 ===== */
var pageTitles = {
  home: '不三迁 · 家长端',
  growth: '成长评价 · 天赋评测',
  study: '学情详情',
  care: '心理健康 · 安全提醒',
  coparent: '共育决策 · 搭子设置',
  service: '会员服务 · 课程推荐'
};

document.getElementById('bottom-nav').addEventListener('click', function(e) {
  var btn = e.target.closest('.nav-item');
  if (!btn) return;
  var page = btn.dataset.page;

  var navItems = document.querySelectorAll('.nav-item');
  for (var i = 0; i < navItems.length; i++) navItems[i].classList.remove('active');
  btn.classList.add('active');

  var pages = document.querySelectorAll('.page-content');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');

  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.getElementById('page-title').textContent = pageTitles[page] || '不三迁 · 家长端';
  document.getElementById('app-body').scrollTop = 0;
  window.scrollTo(0, 0);
});

/* ===== 初始化 ===== */
renderOverview();
renderEvaluation();
renderMBTI();
renderRoleModel();
renderSimilarStudents();
renderTalent();
renderMental();
renderStudy();
renderSafety();
renderGoals();
renderDecisionLog();
renderSettings();
renderPricing();
renderCourses();
renderBusinessModel();
