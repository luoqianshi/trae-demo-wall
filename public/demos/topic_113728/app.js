/* ============================================
   AI 会议行动清单助手
   TRAE AI 创造力大赛 · 第二阶段
   交互逻辑（AI 模拟解析 + 看板 + 风险提醒）
   ============================================ */

// === 示例会议纪要 ===
var SAMPLE_MEETING = '今天讨论 AI 会议行动清单助手的初赛 Demo。张三负责完成首页和输入区，周三前提交。李四负责实现任务看板，本周五前完成。王五继续调研导出 Markdown 和 CSV 的实现方式，时间待定。测试同学需要在周日前完成移动端兼容性检查，但负责人还没确定。大家一致认为风险提醒功能是核心亮点，需要优先完成。';

// === 示例会议纪要对应的预设任务（精确匹配时使用） ===
var SAMPLE_TASKS = [
  {
    id: 1,
    title: '完成首页和输入区',
    owner: '张三',
    deadline: '周三前',
    priority: '中',
    status: '待处理',
    source: '张三负责完成首页和输入区，周三前提交。',
    risk: '暂无明显风险',
    description: '完成首页布局和输入区开发',
    suggestion: '按页面结构先完成核心布局，再补充交互细节。'
  },
  {
    id: 2,
    title: '实现任务看板',
    owner: '李四',
    deadline: '本周五前',
    priority: '高',
    status: '进行中',
    source: '李四负责实现任务看板，本周五前完成。',
    risk: '核心功能任务，建议优先跟进',
    description: '实现三列看板视图及任务状态切换',
    suggestion: '先实现三列看板，再补充任务状态切换和详情查看。'
  },
  {
    id: 3,
    title: '调研 Markdown 和 CSV 导出',
    owner: '王五',
    deadline: '时间待定',
    priority: '中',
    status: '待处理',
    source: '王五继续调研导出 Markdown 和 CSV 的实现方式，时间待定。',
    risk: '截止时间不明确',
    description: '调研导出功能的实现方式',
    suggestion: '建议补充明确截止日期，避免影响最终提交。'
  },
  {
    id: 4,
    title: '完成移动端兼容性检查',
    owner: '未明确',
    deadline: '周日前',
    priority: '高',
    status: '待处理',
    source: '测试同学需要在周日前完成移动端兼容性检查，但负责人还没确定。',
    risk: '负责人不明确',
    description: '完成移动端兼容性测试',
    suggestion: '建议指定具体测试负责人，并补充测试设备范围。'
  },
  {
    id: 5,
    title: '优先完成风险提醒功能',
    owner: '未明确',
    deadline: '未明确',
    priority: '高',
    status: '待处理',
    source: '大家一致认为风险提醒功能是核心亮点，需要优先完成。',
    risk: '负责人和截止时间均不明确',
    description: '开发风险识别、展示和提醒功能',
    suggestion: '建议立即指定负责人，并拆分为风险识别、风险展示、提醒话术三个子任务。'
  }
];

// === 全局状态 ===
var tasks = [];          // 当前任务列表
var risks = [];          // 当前风险列表
var currentFilter = 'all';  // 当前筛选条件
var currentTaskId = null;   // 弹窗中展示的任务 ID

// === 页面初始化 ===
document.addEventListener('DOMContentLoaded', function () {
  initCharCount();
  initMobileMenu();
  initScrollHighlight();
  initIntersectionObserver();
});

// --- 字数统计 ---
function initCharCount() {
  var textarea = document.getElementById('meeting-input');
  var counter = document.getElementById('char-count');
  if (textarea && counter) {
    textarea.addEventListener('input', function () {
      counter.textContent = textarea.value.length;
    });
  }
}

// --- 移动端菜单 ---
function initMobileMenu() {
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('hidden');
      var icon = toggle.querySelector('i');
      if (menu.classList.contains('hidden')) {
        icon.className = 'fas fa-bars';
      } else {
        icon.className = 'fas fa-times';
      }
    });
  }
}

function closeMobileMenu() {
  var menu = document.getElementById('mobile-menu');
  var toggle = document.getElementById('menu-toggle');
  if (menu) menu.classList.add('hidden');
  if (toggle) toggle.querySelector('i').className = 'fas fa-bars';
}

// --- 导航高亮 ---
function initScrollHighlight() {
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY + 100;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

// --- 滚动入场动画 ---
function initIntersectionObserver() {
  var animateTargets = document.querySelectorAll(
    '.feature-card, .workflow-step, .stat-card, .contest-card, .empty-feature'
  );

  animateTargets.forEach(function (el, index) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease ' + (index % 4) * 0.08 + 's, transform 0.5s ease ' + (index % 4) * 0.08 + 's';
    el.setAttribute('data-animate', 'true');
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  animateTargets.forEach(function (el) {
    observer.observe(el);
  });
}

// === 平滑滚动 ===
function scrollTo(selector) {
  var el = document.querySelector(selector);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// === 填充示例会议纪要 ===
function fillSampleMeeting() {
  var textarea = document.getElementById('meeting-input');
  var counter = document.getElementById('char-count');
  if (textarea) {
    textarea.value = SAMPLE_MEETING;
    if (counter) counter.textContent = SAMPLE_MEETING.length;
    scrollTo('#demo');
    setTimeout(function () {
      textarea.focus();
      showToast('已填充示例会议纪要', 'info');
    }, 400);
  }
}

// === 清空输入 ===
function clearInput() {
  var textarea = document.getElementById('meeting-input');
  var counter = document.getElementById('char-count');
  if (textarea) {
    textarea.value = '';
    if (counter) counter.textContent = '0';
    textarea.focus();
    showToast('已清空内容', 'info');
  }
}

// ============================================
//   第二阶段：AI 模拟解析引擎
// ============================================

// === AI 解析会议（主入口） ===
function handleAnalyze() {
  var textarea = document.getElementById('meeting-input');
  if (!textarea || !textarea.value.trim()) {
    showToast('请先输入会议内容或点击"使用示例"', 'info');
    return;
  }

  var text = textarea.value.trim();
  var btn = document.getElementById('analyze-btn');

  // 按钮进入 loading 状态
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 解析中...';

  // 显示加载状态，隐藏空状态
  showState('loading');
  runLoadingAnimation();

  // 延迟 1.5~2 秒后展示结果，模拟 AI 分析
  var delay = 1500 + Math.random() * 500;
  setTimeout(function () {
    // 判断是否为示例会议纪要
    if (text === SAMPLE_MEETING.trim()) {
      // 使用预设的精确任务数据
      tasks = JSON.parse(JSON.stringify(SAMPLE_TASKS));
    } else {
      // 使用规则引擎解析
      tasks = parseByRules(text);
    }

    // 生成风险
    risks = generateRisks(tasks);

    // 渲染结果
    renderAll();

    // 恢复按钮
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-brain"></i> AI 解析会议';

    // 提示
    showToast('AI 解析完成，已生成任务看板', 'success');
  }, delay);
}

// === 切换面板显示状态 ===
function showState(state) {
  var empty = document.getElementById('empty-state');
  var loading = document.getElementById('loading-state');
  var result = document.getElementById('result-content');
  var panel = document.getElementById('result-panel');

  empty.classList.add('hidden');
  loading.classList.add('hidden');
  result.classList.add('hidden');
  panel.classList.remove('has-result');

  if (state === 'empty') {
    empty.classList.remove('hidden');
  } else if (state === 'loading') {
    loading.classList.remove('hidden');
  } else if (state === 'result') {
    result.classList.remove('hidden');
    panel.classList.add('has-result');
  }
}

// === 加载动画逐步推进 ===
function runLoadingAnimation() {
  var steps = [
    { id: 'ls-1', delay: 200 },
    { id: 'ls-2', delay: 500 },
    { id: 'ls-3', delay: 900 },
    { id: 'ls-4', delay: 1200 }
  ];

  // 先重置所有步骤
  steps.forEach(function (s) {
    var el = document.getElementById(s.id);
    if (el) { el.classList.remove('active', 'done'); }
  });

  // 依次激活
  steps.forEach(function (s) {
    setTimeout(function () {
      var el = document.getElementById(s.id);
      if (el) {
        el.classList.remove('active');
        el.classList.add('done');
      }
      // 激活下一个
      var idx = steps.indexOf(s);
      if (idx < steps.length - 1) {
        var next = document.getElementById(steps[idx + 1].id);
        if (next) next.classList.add('active');
      }
    }, s.delay);
  });

  // 第一步立即激活
  setTimeout(function () {
    var first = document.getElementById('ls-1');
    if (first) first.classList.add('active');
  }, 100);
}

// ============================================
//   规则引擎：基于关键词的模拟 AI 解析
// ============================================

function parseByRules(text) {
  var result = [];
  var sentences = text.split(/[。！？\n]+/).filter(function (s) { return s.trim().length > 5; });

  // 关键词映射
  var ownerNames = ['张三', '李四', '王五', '赵六', '小明', '小红', '老王', '小刘', '小陈', '阿杰'];

  sentences.forEach(function (sentence, idx) {
    var owner = '未明确';
    var deadline = '未明确';
    var priority = '低';
    var risk = '';
    var suggestion = '';

    // 1. 识别负责人：查找"XX负责"模式或人名
    for (var i = 0; i < ownerNames.length; i++) {
      if (sentence.indexOf(ownerNames[i]) !== -1) {
        owner = ownerNames[i];
        break;
      }
    }
    // 也尝试匹配"XX同学""XX老师"等
    if (owner === '未明确') {
      var ownerMatch = sentence.match(/([\u4e00-\u9fa5]{2,3})(同学|老师|经理|主管|负责)/);
      if (ownerMatch) owner = ownerMatch[1];
    }
    // 如果包含"负责"但没有匹配到具体人名
    if (sentence.indexOf('负责') !== -1 && owner === '未明确') {
      // 尝试从"负责"前面提取
      var beforeFuze = sentence.split('负责')[0];
      var nameExtract = beforeFuze.match(/([\u4e00-\u9fa5]{2,3})$/);
      if (nameExtract) owner = nameExtract[1];
    }

    // 2. 识别截止时间
    var timeWords = ['周一', '周二', '周三', '周四', '周五', '周六', '周日',
      '本周', '下周', '明天', '后天', '月底', '今天', '本周五', '本周三', '本周内'];
    for (var t = 0; t < timeWords.length; t++) {
      if (sentence.indexOf(timeWords[t]) !== -1) {
        deadline = timeWords[t] + '前';
        break;
      }
    }
    // 检查"时间待定"
    if (sentence.indexOf('时间待定') !== -1) {
      deadline = '时间待定';
    }

    // 3. 识别优先级
    var highWords = ['优先', '核心', '重要', '尽快', '必须', '紧急', '关键'];
    for (var h = 0; h < highWords.length; h++) {
      if (sentence.indexOf(highWords[h]) !== -1) {
        priority = '高';
        break;
      }
    }
    if (priority === '低' && (sentence.indexOf('负责') !== -1 || sentence.indexOf('完成') !== -1)) {
      priority = '中';
    }

    // 4. 风险检测
    if (owner === '未明确') {
      risk = '负责人不明确';
      suggestion = '建议尽快明确负责人，避免任务无人跟进。';
    }
    if (deadline === '未明确' || deadline === '时间待定') {
      risk += (risk ? '；' : '') + '截止时间' + (deadline === '时间待定' ? '不明确' : '缺失');
      suggestion += (suggestion ? ' ' : '') + '建议补充明确的截止日期。';
    }
    if (risk === '') {
      risk = '暂无明显风险';
      suggestion = '按计划推进即可，注意定期同步进度。';
    }

    // 5. 生成任务标题
    var title = extractTitle(sentence);

    result.push({
      id: idx + 1,
      title: title,
      owner: owner,
      deadline: deadline,
      priority: priority,
      status: '待处理',
      source: sentence.trim(),
      risk: risk,
      description: title,
      suggestion: suggestion
    });
  });

  // 兜底：如果没有解析到任何任务，生成一个通用任务
  if (result.length === 0) {
    result.push({
      id: 1,
      title: '整理会议内容并分解任务',
      owner: '未明确',
      deadline: '未明确',
      priority: '中',
      status: '待处理',
      source: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
      risk: '未能自动识别具体任务项',
      description: '根据会议内容整理行动项',
      suggestion: '建议会议纪要中明确使用"XX负责...，XX前完成"的句式，以便 AI 更准确地提取任务。'
    });
  }

  return result;
}

// 从句子中提取任务标题
function extractTitle(sentence) {
  // 去掉常见前缀词
  var cleaned = sentence.replace(/^(今天|大家|我们|会议|讨论|接下来|另外|还有)[，,]?\s*/g, '').trim();

  // 如果有"负责"关键词，提取"负责"后面的内容
  var fuzeIdx = cleaned.indexOf('负责');
  if (fuzeIdx !== -1) {
    var after = cleaned.substring(fuzeIdx + 2);
    // 去掉"负责"后面可能的"完成"等词
    after = after.replace(/^(完成|实现|开发|跟进|处理|协调)/, '');
    // 取到句号或逗号
    var end = after.search(/[,，。！？、]/);
    if (end !== -1) after = after.substring(0, end);
    after = after.trim();
    if (after.length > 2 && after.length <= 20) return after;
  }

  // 兜底：取前 15 个字作为标题
  if (cleaned.length > 15) cleaned = cleaned.substring(0, 15) + '...';
  return cleaned;
}

// ============================================
//   风险识别引擎
// ============================================

function generateRisks(taskList) {
  var riskList = [];

  // 1. 负责人不明确
  var noOwner = taskList.filter(function (t) { return t.owner === '未明确'; });
  if (noOwner.length > 0) {
    riskList.push({
      type: '负责人不明确',
      tasks: noOwner.map(function (t) { return t.title; }),
      desc: noOwner.length + ' 个任务没有指定明确的负责人，可能导致无人跟进。',
      suggestion: '建议在会后尽快确认负责人，并通过群消息或邮件通知到位。'
    });
  }

  // 2. 截止时间缺失
  var noDeadline = taskList.filter(function (t) { return t.deadline === '未明确' || t.deadline === '时间待定'; });
  if (noDeadline.length > 0) {
    riskList.push({
      type: '截止时间缺失',
      tasks: noDeadline.map(function (t) { return t.title; }),
      desc: noDeadline.length + ' 个任务缺少明确的截止时间，可能影响项目进度。',
      suggestion: '建议为每个任务设定具体的截止日期，并录入项目管理工具。'
    });
  }

  // 3. 高优先级任务数量较多
  var highPriority = taskList.filter(function (t) { return t.priority === '高'; });
  if (highPriority.length >= 3) {
    riskList.push({
      type: '高优先级任务较多',
      tasks: highPriority.map(function (t) { return t.title; }),
      desc: '当前有 ' + highPriority.length + ' 个高优先级任务，资源可能分散。',
      suggestion: '建议评估团队容量，必要时降低部分任务优先级或增加人力支持。'
    });
  }

  // 4. 任务描述过宽
  var vagueTasks = taskList.filter(function (t) { return t.title.length > 12 || t.title.indexOf('功能') !== -1; });
  if (vagueTasks.length > 0) {
    riskList.push({
      type: '任务描述可能过宽',
      tasks: vagueTasks.map(function (t) { return t.title; }),
      desc: vagueTasks.length + ' 个任务的描述范围较宽，可能需要进一步拆分。',
      suggestion: '建议将大任务拆分为可独立验收的子任务，每个子任务控制在 1-3 天内完成。'
    });
  }

  // 5. 核心功能未明确拆分
  var coreTasks = taskList.filter(function (t) {
    return t.source.indexOf('核心') !== -1 || t.source.indexOf('优先') !== -1;
  });
  if (coreTasks.length > 0) {
    var notSplit = coreTasks.filter(function (t) { return t.title.length > 10; });
    if (notSplit.length > 0) {
      riskList.push({
        type: '核心功能未明确拆分',
        tasks: notSplit.map(function (t) { return t.title; }),
        desc: '部分核心/优先任务的粒度较大，未拆分为具体的执行步骤。',
        suggestion: '建议为核心功能创建子任务清单，明确每个步骤的输入、输出和验收标准。'
      });
    }
  }

  return riskList;
}

// ============================================
//   渲染引擎
// ============================================

// 统一渲染入口
function renderAll() {
  showState('result');
  renderKanban();
  renderRisks();
  renderSummary();
  updateStats();
}

// === 渲染看板 ===
function renderKanban() {
  var pendingBody = document.getElementById('body-pending');
  var progressBody = document.getElementById('body-progress');
  var doneBody = document.getElementById('body-done');

  // 清空
  pendingBody.innerHTML = '';
  progressBody.innerHTML = '';
  doneBody.innerHTML = '';

  // 筛选值到优先级的映射
  var filterMap = { high: '高', medium: '中', low: '低' };

  // 根据筛选条件过滤
  var filtered = tasks.filter(function (t) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'risk') return t.risk !== '暂无明显风险';
    return t.priority === filterMap[currentFilter];
  });

  // 分组
  var pending = [], progress = [], done = [];
  filtered.forEach(function (t) {
    if (t.status === '待处理') pending.push(t);
    else if (t.status === '进行中') progress.push(t);
    else done.push(t);
  });

  // 渲染每列
  renderColumn(pendingBody, pending);
  renderColumn(progressBody, progress);
  renderColumn(doneBody, done);

  // 更新计数
  document.getElementById('count-pending').textContent = pending.length;
  document.getElementById('count-progress').textContent = progress.length;
  document.getElementById('count-done').textContent = done.length;
}

// 渲染单列卡片
function renderColumn(container, taskList) {
  taskList.forEach(function (task, idx) {
    var card = document.createElement('div');
    card.className = 'task-card' + (task.risk !== '暂无明显风险' ? ' has-risk' : '');
    card.style.animationDelay = (idx * 0.06) + 's';
    card.setAttribute('data-id', task.id);
    card.onclick = function () { openModal(task.id); };

    var html = '<div class="task-card-title">' + escapeHtml(task.title) + '</div>';
    html += '<div class="task-card-meta">';
    html += '<span class="task-card-tag tag-owner"><i class="fas fa-user"></i> ' + escapeHtml(task.owner) + '</span>';
    html += '<span class="task-card-tag tag-deadline"><i class="fas fa-clock"></i> ' + escapeHtml(task.deadline) + '</span>';
    html += '<span class="task-card-tag tag-priority-' + task.priority + '">' + task.priority + '</span>';
    if (task.risk !== '暂无明显风险') {
      html += '<span class="task-card-tag tag-risk"><i class="fas fa-exclamation-circle"></i> 风险</span>';
    }
    html += '</div>';

    card.innerHTML = html;
    container.appendChild(card);
  });
}

// === 渲染风险提醒 ===
function renderRisks() {
  var section = document.getElementById('risk-section');
  var container = document.getElementById('risk-cards');

  container.innerHTML = '';

  if (risks.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');

  risks.forEach(function (risk, idx) {
    var card = document.createElement('div');
    card.className = 'risk-card';
    card.style.animationDelay = (idx * 0.08) + 's';

    var taskNames = risk.tasks.length > 2
      ? risk.tasks.slice(0, 2).join('、') + ' 等 ' + risk.tasks.length + ' 项'
      : risk.tasks.join('、');

    card.innerHTML =
      '<div class="risk-card-header">' +
        '<span class="risk-card-type">' + escapeHtml(risk.type) + '</span>' +
        '<span class="risk-card-tasks">涉及：' + escapeHtml(taskNames) + '</span>' +
      '</div>' +
      '<div class="risk-card-desc">' + escapeHtml(risk.desc) + '</div>' +
      '<div class="risk-card-suggestion"><i class="fas fa-lightbulb"></i> ' + escapeHtml(risk.suggestion) + '</div>';

    container.appendChild(card);
  });
}

// === 更新统计卡片 ===
function updateStats() {
  var total = tasks.length;
  var highCount = tasks.filter(function (t) { return t.priority === '高'; }).length;
  var riskCount = risks.length;
  var doneCount = tasks.filter(function (t) { return t.status === '已完成'; }).length;

  animateNumber('stat-total', total);
  animateNumber('stat-high', highCount);
  animateNumber('stat-risk', riskCount);
  animateNumber('stat-done', doneCount);
}

// 数字递增动画
function animateNumber(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var current = 0;
  if (target === 0) { el.textContent = '0'; return; }
  var step = Math.max(1, Math.floor(target / 12));
  var interval = setInterval(function () {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 40);
}

// === 筛选功能 ===
function setFilter(filter) {
  currentFilter = filter;

  // 更新按钮状态
  var btns = document.querySelectorAll('.filter-btn');
  btns.forEach(function (btn) {
    btn.classList.remove('active');
    if (btn.getAttribute('data-filter') === filter) {
      btn.classList.add('active');
    }
  });

  // 重新渲染看板
  renderKanban();
}

// ============================================
//   任务详情弹窗
// ============================================

function openModal(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;

  currentTaskId = taskId;

  // 填充弹窗内容
  document.getElementById('modal-title').textContent = '任务详情';
  document.getElementById('modal-field-title').textContent = task.title;
  document.getElementById('modal-field-owner').textContent = task.owner;
  document.getElementById('modal-field-deadline').textContent = task.deadline;
  document.getElementById('modal-field-source').textContent = task.source;
  document.getElementById('modal-field-risk').textContent = task.risk;
  document.getElementById('modal-field-suggestion').textContent = task.suggestion;

  // 优先级标签
  var priorityEl = document.getElementById('modal-field-priority');
  var priorityClass = 'tag-priority-' + task.priority;
  priorityEl.innerHTML = '<span class="task-card-tag ' + priorityClass + '">' + task.priority + '</span>';

  // 状态标签
  var statusEl = document.getElementById('modal-field-status');
  var statusClass = task.status === '待处理' ? 'tag-priority-medium' : (task.status === '进行中' ? 'tag-owner' : 'tag-priority-low');
  statusEl.innerHTML = '<span class="task-card-tag ' + statusClass + '">' + task.status + '</span>';

  // 显示弹窗
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  currentTaskId = null;
}

// === 修改任务状态 ===
function changeTaskStatus(newStatus) {
  if (currentTaskId === null) return;

  var task = tasks.find(function (t) { return t.id === currentTaskId; });
  if (!task) return;

  var oldStatus = task.status;
  if (oldStatus === newStatus) {
    closeModal();
    return;
  }

  // 更新状态
  task.status = newStatus;

  // 关闭弹窗
  closeModal();

  // 重新渲染
  renderKanban();
  updateStats();

  // 提示
  showToast('已将「' + task.title + '」改为 ' + newStatus, 'success');
}

// ============================================
//   工具函数
// ============================================

// HTML 转义，防止 XSS
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ============================================
//   第三阶段：会后总结、群消息与导出
// ============================================

// === 检查是否有解析结果 ===
function ensureParsed() {
  if (tasks.length === 0) {
    showToast('请先解析会议内容', 'info');
    return false;
  }
  return true;
}

// === 生成会后总结 ===
function generateSummary() {
  var total = tasks.length;
  var highCount = tasks.filter(function (t) { return t.priority === '高'; }).length;
  var riskTasks = tasks.filter(function (t) { return t.risk !== '暂无明显风险'; });
  var highTasks = tasks.filter(function (t) { return t.priority === '高'; });

  // 提取重点跟进任务
  var keyTasks = highTasks.slice(0, 3).map(function (t) { return '「' + t.title + '」'; });

  // 判断是否为示例会议
  var textarea = document.getElementById('meeting-input');
  var text = textarea ? textarea.value.trim() : '';
  var isSample = text === SAMPLE_MEETING.trim();

  var theme = isSample
    ? 'AI 会议行动清单助手初赛 Demo 的开发推进'
    : '本次会议讨论的工作事项';

  var summary = '';
  summary += '本次会议主要围绕' + theme + '展开。';
  summary += '系统共识别出 ' + total + ' 项待办任务，';
  summary += '其中 ' + highCount + ' 项为高优先级任务，';
  summary += riskTasks.length + ' 项存在负责人或截止时间不明确的问题。';

  if (keyTasks.length > 0) {
    summary += '建议优先跟进' + keyTasks.join('、') + '，';
  }
  summary += '并尽快明确未分配任务的负责人。';

  return summary;
}

// === 渲染会后总结 ===
function renderSummary() {
  var section = document.getElementById('summary-section');
  var body = document.getElementById('summary-body');
  if (!section || !body) return;

  var summary = generateSummary();
  body.textContent = summary;
  section.classList.remove('hidden');
}

// === 生成会后群消息 ===
function generateGroupMessage() {
  if (!ensureParsed()) return;

  var lines = [];
  lines.push('各位，本次会议行动项已整理：');
  lines.push('');

  tasks.forEach(function (t, idx) {
    var line = (idx + 1) + '. ';
    if (t.owner !== '未明确') {
      line += t.owner + '：';
    }
    line += t.title + '，' + t.deadline + '。';
    lines.push(line);
  });

  // 风险提醒
  var riskTasks = tasks.filter(function (t) { return t.risk !== '暂无明显风险'; });
  if (riskTasks.length > 0) {
    lines.push('');
    lines.push('风险提醒：');
    riskTasks.forEach(function (t) {
      lines.push('* ' + t.title + ' - ' + t.risk + '。');
    });
    lines.push('  请相关同学及时确认。');
  }

  return lines.join('\n');
}

// === 复制群消息到剪贴板 ===
function copyGroupMessage() {
  var msg = generateGroupMessage();
  copyToClipboard(msg, '会后群消息已复制');
}

// === 复制任务清单 ===
function copyTaskList() {
  if (!ensureParsed()) return;

  var lines = [];
  lines.push('【任务清单】');
  lines.push('');
  tasks.forEach(function (t, idx) {
    lines.push((idx + 1) + '. ' + t.title);
    lines.push('   负责人：' + t.owner + ' | 截止：' + t.deadline + ' | 优先级：' + t.priority + ' | 状态：' + t.status);
  });

  copyToClipboard(lines.join('\n'), '任务清单已复制');
}

// === 导出 Markdown ===
function exportMarkdown() {
  if (!ensureParsed()) return;

  var md = '';
  md += '# AI 会议行动清单助手 - 会议总结\n\n';
  md += '## 会议总结\n\n';
  md += generateSummary() + '\n\n';

  md += '## 任务清单\n\n';
  md += '| 序号 | 任务标题 | 负责人 | 截止时间 | 优先级 | 状态 | 风险提示 |\n';
  md += '| --- | --- | --- | --- | --- | --- | --- |\n';
  tasks.forEach(function (t, idx) {
    md += '| ' + (idx + 1) + ' | ' + t.title + ' | ' + t.owner + ' | ' + t.deadline + ' | ' + t.priority + ' | ' + t.status + ' | ' + t.risk + ' |\n';
  });

  md += '\n## 风险提醒\n\n';
  if (risks.length === 0) {
    md += '暂无风险。\n';
  } else {
    risks.forEach(function (r) {
      md += '### ' + r.type + '\n\n';
      md += '涉及任务：' + r.tasks.join('、') + '\n\n';
      md += r.desc + '\n\n';
      md += '**建议**：' + r.suggestion + '\n\n';
    });
  }

  md += '## 会后群消息\n\n```\n' + generateGroupMessage() + '\n```\n';

  downloadFile('会议行动清单.md', md, 'text/markdown;charset=utf-8');
  showToast('Markdown 文件已导出', 'success');
}

// === 导出 CSV ===
function exportCSV() {
  if (!ensureParsed()) return;

  // BOM + CSV 内容，确保中文不乱码
  var bom = '\uFEFF';
  var header = '任务标题,负责人,截止时间,优先级,状态,风险提示,来源句子,AI建议\n';
  var rows = '';
  tasks.forEach(function (t) {
    rows += '"' + csvEscape(t.title) + '",'
          + '"' + csvEscape(t.owner) + '",'
          + '"' + csvEscape(t.deadline) + '",'
          + '"' + t.priority + '",'
          + '"' + t.status + '",'
          + '"' + csvEscape(t.risk) + '",'
          + '"' + csvEscape(t.source) + '",'
          + '"' + csvEscape(t.suggestion) + '"\n';
  });

  downloadFile('会议行动清单.csv', bom + header + rows, 'text/csv;charset=utf-8');
  showToast('CSV 文件已导出', 'success');
}

// CSV 字段转义
function csvEscape(str) {
  return str.replace(/"/g, '""');
}

// === 通用剪贴板复制 ===
function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showToast(successMsg || '已复制', 'success');
    }).catch(function () {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

// 降级复制方案
function fallbackCopy(text, successMsg) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg || '已复制', 'success');
  } catch (e) {
    showToast('复制失败，请手动复制', 'error');
  }
  document.body.removeChild(ta);
}

// === 通用文件下载 ===
function downloadFile(filename, content, mimeType) {
  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === Toast 通知系统 ===
function showToast(message, type) {
  type = type || 'success';
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast ' + type;

  var iconClass = 'fa-check-circle';
  if (type === 'info') iconClass = 'fa-info-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-circle';
  if (type === 'error') iconClass = 'fa-times-circle';

  toast.innerHTML = '<i class="fas ' + iconClass + '"></i> ' + message;
  container.appendChild(toast);

  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}