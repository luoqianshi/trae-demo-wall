// ============================================================
// 生成引擎 — 知识点 → 完整讲解页 HTML
// 负责调用模板库，组装手风琴模块 + 双风格 Tab
// ============================================================

(function() {
'use strict';

// ===== 生成完整讲解页 HTML =====
function generate(kp) {
  if (!kp) return '<p class="empty-notice">未找到知识点数据</p>';

  var html = '';

  // 知识点头部
  html += generateKPHeader(kp);

  // 模块 1：知识概览
  html += generateAccordionSection(1, '知识概览', '知识点的基本信息和能力点概览', function() {
    return Templates.generateOverview(kp);
  });

  // 模块 2：双风格讲解（核心模块）
  html += generateAccordionSection(2, '多风格讲解', '常规讲解 + 故事化讲解，选择适合你的方式', function() {
    return generateDualStyleTabs(kp);
  }, true); // 默认展开

  // 模块 3：常见错误
  html += generateAccordionSection(3, '常见错误', '提前了解易错点，避免踩坑', function() {
    return Templates.generateErrors(kp);
  });

  // 模块 4：典型例题
  html += generateAccordionSection(4, '典型例题', '通过例题巩固理解', function() {
    return Templates.generateExamples(kp);
  });

  // 模块 5：前置知识
  html += generateAccordionSection(5, '前置知识', '学习本知识点的基础', function() {
    return Templates.generatePrerequisites(kp);
  });

  // 小结卡片
  html += generateSummary(kp);

  return html;
}

// ===== 知识点头部 =====
function generateKPHeader(kp) {
  var html = '<div class="kp-header">';
  html += '<h1>' + escapeHtml(kp.name) + '</h1>';
  html += '<div class="kp-meta">';
  html += '<span class="kp-meta-tag">📘 ' + escapeHtml(kp.subject_name || '通用') + '</span>';
  if (kp.phase_name) html += '<span class="kp-meta-tag">🎓 ' + escapeHtml(kp.phase_name) + '</span>';
  if (kp.module) html += '<span class="kp-meta-tag">📂 ' + escapeHtml(kp.module) + '</span>';
  if (kp.unit) html += '<span class="kp-meta-tag">📑 ' + escapeHtml(kp.unit) + '</span>';
  if (kp.difficulty) html += '<span class="kp-meta-tag">⭐ ' + escapeHtml(kp.difficulty) + '</span>';
  if (kp.custom) html += '<span class="kp-meta-tag">✨ 自定义知识点</span>';
  html += '</div>';
  html += '</div>';
  return html;
}

// ===== 生成手风琴模块 =====
function generateAccordionSection(num, title, desc, contentFn, open) {
  var html = '<section class="accordion-section' + (open ? ' open' : '') + '">';
  html += '<div class="accordion-header" onclick="Generator.toggleAccordion(this)">';
  html += '<div class="module-num">' + num + '</div>';
  html += '<div class="title-area">';
  html += '<h2>' + escapeHtml(title) + '</h2>';
  html += '<p class="desc">' + escapeHtml(desc) + '</p>';
  html += '</div>';
  html += '<span class="toggle-icon">+</span>';
  html += '</div>';
  html += '<div class="accordion-body">';
  html += contentFn();
  html += '</div>';
  html += '</section>';
  return html;
}

// ===== 双风格 Tab =====
function generateDualStyleTabs(kp) {
  var sectionId = 'kp-' + (kp.id || 'custom-' + Date.now());
  var tabNormal = 'tab-normal-' + sectionId;
  var tabStory = 'tab-story-' + sectionId;

  var html = '<div class="tabs">';
  html += '<button class="tab-btn active" onclick="Generator.switchTab(this, \'' + tabNormal + '\')">📖 常规讲解</button>';
  html += '<button class="tab-btn" onclick="Generator.switchTab(this, \'' + tabStory + '\')">🌟 讲给 Alice 听</button>';
  html += '</div>';

  // 常规讲解
  html += '<div class="tab-content active" id="' + tabNormal + '">';
  html += Templates.generateRegular(kp);
  html += '</div>';

  // 故事化讲解
  html += '<div class="tab-content alice-style" id="' + tabStory + '">';
  html += Templates.generateStory(kp);
  html += '</div>';

  return html;
}

// ===== 小结卡片 =====
function generateSummary(kp) {
  var html = '<div class="summary-card">';
  html += '<h4>📌 知识点小结</h4>';
  html += '<ul>';

  var subSkills = kp.sub_skills || [];
  if (subSkills.length > 0) {
    html += '<li>本知识点包含 ' + subSkills.length + ' 个能力点：' +
            escapeHtml(subSkills.slice(0, 3).join('、')) +
            (subSkills.length > 3 ? ' 等' : '') + '</li>';
  } else {
    html += '<li>' + escapeHtml(kp.name) + '是重要知识点，建议结合教材深入学习</li>';
  }

  var errors = kp.common_errors || [];
  if (errors.length > 0) {
    html += '<li>注意 ' + errors.length + ' 个常见错误，提前避坑</li>';
  }

  var examples = kp.typical_examples || [];
  if (examples.length > 0) {
    html += '<li>配套 ' + examples.length + ' 道典型例题，学完即练</li>';
  }

  html += '<li>推荐学习顺序：概览 → 常规讲解 → 故事化讲解 → 例题练习</li>';
  html += '</ul>';
  html += '</div>';
  return html;
}

// ===== 生成自定义知识点 =====
function generateCustom(name, subject) {
  var kp = {
    id: 'custom-' + Date.now(),
    name: name,
    subject: subject || 'general',
    subject_name: subject ? getSubjectName(subject) : '通用',
    module: '',
    unit: '',
    phase: '',
    phase_name: '',
    confidence: 'llm_inferred',
    sub_skills: [],
    common_errors: [],
    typical_examples: [],
    prerequisites: [],
    semester: '',
    textbook: '',
    grade: '',
    difficulty: '',
    custom: true
  };

  // 尝试根据名称推断子技能
  kp.sub_skills = inferSubSkills(name);

  return generate(kp);
}

// 推断子技能
function inferSubSkills(name) {
  var skills = [];

  // 通用能力点
  skills.push('理解' + name + '的基本概念');
  skills.push('掌握' + name + '的核心要点');
  skills.push('能够运用' + name + '解决实际问题');

  return skills;
}

// 获取学科名称
function getSubjectName(subjectId) {
  var names = {
    math: '数学', chinese: '语文', english: '英语', science: '科学',
    physics: '物理', chemistry: '化学', biology: '生物',
    history: '历史', morality_law: '道德与法治', general: '通用'
  };
  return names[subjectId] || '通用';
}

// ===== HTML 转义 =====
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== 导出 =====
window.Generator = {
  generate: generate,
  generateCustom: generateCustom,

  // 手风琴切换
  toggleAccordion: function(header) {
    var section = header.parentElement;
    section.classList.toggle('open');
  },

  // Tab 切换
  switchTab: function(btn, tabId) {
    var section = btn.closest('.accordion-section');
    section.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    section.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    btn.classList.add('active');
    var tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');

    // 重新渲染 MathJax
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise([tab]);
    }
  }
};

})();
