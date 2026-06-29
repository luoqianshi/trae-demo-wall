// ============================================================
// 主应用逻辑 — 知识点浏览、搜索、生成、查看
// ============================================================

(function() {
'use strict';

// ===== 状态管理 =====
var state = {
  currentPhase: 'all',
  currentSubject: 'all',
  searchQuery: '',
  currentKP: null,
};

// 热门知识点 ID（五年级数学重点）
var FEATURED_KP_IDS = [
  'math_fraction_add_sub',     // 分数加减法
  'math_decimal_multiply_integer', // 小数乘整数
  'math_positive_negative_intro',  // 正数和负数
  'math_letter_represent_number',  // 用字母表示数
];

// 备选热门关键词（如果 ID 不匹配，用关键词搜索）
var FEATURED_KEYWORDS = ['分数', '小数', '负数', '方程'];

// ===== 初始化 =====
function init() {
  // 显示知识点总数
  document.getElementById('kpCounter').textContent = '共 ' + KnowledgeBase.totalKP + ' 个知识点';

  // 初始化学科筛选
  initSubjectFilter();

  // 初始化年级筛选
  initGradeFilter();

  // 初始化搜索
  initSearch();

  // 初始化自定义输入
  initCustomInput();

  // 构建知识树
  buildTree();

  // 显示热门知识点
  showFeatured();

  // 工具栏按钮
  document.getElementById('backBtn').addEventListener('click', showWelcome);
  document.getElementById('printBtn').addEventListener('click', function() {
    // 展开所有手风琴
    document.querySelectorAll('.accordion-section').forEach(function(s) { s.classList.add('open'); });
    setTimeout(function() { window.print(); }, 200);
  });
}

// ===== 学科筛选 =====
function initSubjectFilter() {
  var container = document.getElementById('subjectFilter');
  var subjects = KnowledgeBase.subjects;

  for (var i = 0; i < subjects.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'filter-tab';
    btn.dataset.subject = subjects[i].id;
    btn.textContent = subjects[i].name;
    btn.addEventListener('click', function(e) {
      var subjectId = e.target.dataset.subject;
      state.currentSubject = subjectId;
      container.querySelectorAll('.filter-tab').forEach(function(b) { b.classList.remove('active'); });
      e.target.classList.add('active');
      buildTree();
    });
    container.appendChild(btn);
  }
}

// ===== 年级筛选 =====
function initGradeFilter() {
  var container = document.getElementById('gradeFilter');
  container.querySelectorAll('.filter-tab').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      var phase = e.target.dataset.phase;
      state.currentPhase = phase;
      container.querySelectorAll('.filter-tab').forEach(function(b) { b.classList.remove('active'); });
      e.target.classList.add('active');
      buildTree();
    });
  });
}

// ===== 搜索 =====
function initSearch() {
  var input = document.getElementById('searchInput');
  var clear = document.getElementById('searchClear');

  input.addEventListener('input', function(e) {
    var query = e.target.value.trim();
    state.searchQuery = query;
    clear.style.display = query ? 'block' : 'none';

    if (query) {
      showSearchResults(query);
    } else {
      buildTree();
    }
  });

  clear.addEventListener('click', function() {
    input.value = '';
    state.searchQuery = '';
    clear.style.display = 'none';
    buildTree();
  });
}

function showSearchResults(query) {
  var results = KnowledgeBase.search(query);
  var container = document.getElementById('treeContainer');

  if (results.length === 0) {
    container.innerHTML = '<div class="search-no-result">未找到匹配的知识点<br>试试其他关键词，或使用"自定义知识点"输入</div>';
    return;
  }

  var html = '<div class="search-results">';
  html += '<div style="padding:8px 12px;font-size:12px;color:var(--text-muted);">找到 ' + results.length + ' 个相关知识点</div>';

  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    html += '<div class="search-result-item" data-kp-id="' + r.id + '">';
    html += '<div class="sr-name">' + escapeHtml(r.name) + '</div>';
    html += '<div class="sr-meta">' + escapeHtml(r.subject_name) + ' · ' + escapeHtml(r.phase_name) + ' · ' + escapeHtml(r.unit) + '</div>';
    html += '</div>';
  }
  html += '</div>';

  container.innerHTML = html;

  // 绑定点击事件
  container.querySelectorAll('.search-result-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var kpId = this.dataset.kpId;
      selectKP(kpId);
    });
  });
}

// ===== 知识树 =====
function buildTree() {
  var container = document.getElementById('treeContainer');

  if (state.searchQuery) {
    return; // 搜索模式，不显示树
  }

  var html = '';
  var subjects = KnowledgeBase.subjects;
  var hasContent = false;

  for (var i = 0; i < subjects.length; i++) {
    var subj = subjects[i];

    // 学科筛选
    if (state.currentSubject !== 'all' && state.currentSubject !== subj.id) continue;

    var tree = KnowledgeBase.tree[subj.id];
    if (!tree) continue;

    // 构建学科节点
    var subjHtml = buildSubjectNode(subj, tree);
    if (subjHtml) {
      html += subjHtml;
      hasContent = true;
    }
  }

  if (!hasContent) {
    html = '<div class="search-no-result">该筛选条件下暂无知识点<br>试试切换其他学科或年级</div>';
  }

  container.innerHTML = html;

  // 绑定树节点点击事件
  bindTreeEvents();
}

function buildSubjectNode(subj, tree) {
  var html = '';
  var hasKP = false;

  // 先收集所有符合条件的知识点
  var modulesHtml = '';
  for (var i = 0; i < tree.modules.length; i++) {
    var mod = tree.modules[i];
    var unitsHtml = '';
    var moduleHasKP = false;

    for (var j = 0; j < mod.units.length; j++) {
      var unit = mod.units[j];

      // 年级筛选
      if (state.currentPhase !== 'all' && state.currentPhase !== unit.phase) continue;

      var kpsHtml = '';
      for (var k = 0; k < unit.knowledge_points.length; k++) {
        var kp = unit.knowledge_points[k];
        kpsHtml += buildKPNode(kp);
        moduleHasKP = true;
        hasKP = true;
      }

      if (kpsHtml) {
        unitsHtml += '<div class="tree-node tree-level-unit">';
        unitsHtml += '<div class="tree-header" data-toggle="true">';
        unitsHtml += '<span class="tree-toggle">▶</span>';
        unitsHtml += '<span class="tree-label">' + escapeHtml(unit.name) + '</span>';
        unitsHtml += '<span class="tree-count">' + countKPs(kpsHtml) + '</span>';
        unitsHtml += '</div>';
        unitsHtml += '<div class="tree-children">' + kpsHtml + '</div>';
        unitsHtml += '</div>';
      }
    }

    if (unitsHtml) {
      modulesHtml += '<div class="tree-node tree-level-module">';
      modulesHtml += '<div class="tree-header" data-toggle="true">';
      modulesHtml += '<span class="tree-toggle">▶</span>';
      modulesHtml += '<span class="tree-label">' + escapeHtml(mod.name) + '</span>';
      modulesHtml += '</div>';
      modulesHtml += '<div class="tree-children">' + unitsHtml + '</div>';
      modulesHtml += '</div>';
    }
  }

  if (hasKP) {
    html += '<div class="tree-node tree-level-subject open">';
    html += '<div class="tree-header" data-toggle="true">';
    html += '<span class="tree-toggle">▶</span>';
    html += '<span class="tree-label">' + escapeHtml(subj.name) + '</span>';
    html += '</div>';
    html += '<div class="tree-children">' + modulesHtml + '</div>';
    html += '</div>';
  }

  return html;
}

function buildKPNode(kp) {
  var html = '<div class="tree-node tree-level-kp">';
  html += '<div class="tree-header" data-kp-id="' + kp.id + '">';
  html += '<span class="tree-toggle">▶</span>';
  html += '<span class="tree-label">' + escapeHtml(kp.name) + '</span>';
  if (kp.difficulty) {
    html += '<span class="kp-badge diff-' + escapeHtml(kp.difficulty) + '">' + escapeHtml(kp.difficulty) + '</span>';
  }
  html += '</div>';
  html += '</div>';
  return html;
}

function countKPs(kpsHtml) {
  return (kpsHtml.match(/data-kp-id/g) || []).length;
}

function bindTreeEvents() {
  var container = document.getElementById('treeContainer');

  // 树节点展开/折叠
  container.querySelectorAll('.tree-header[data-toggle="true"]').forEach(function(header) {
    header.addEventListener('click', function(e) {
      if (e.target.closest('[data-kp-id]')) return;
      this.parentElement.classList.toggle('open');
    });
  });

  // 知识点点击
  container.querySelectorAll('[data-kp-id]').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      var kpId = this.dataset.kpId;
      selectKP(kpId);
    });
  });
}

// ===== 自定义输入 =====
function initCustomInput() {
  var input = document.getElementById('customInput');
  var btn = document.getElementById('customBtn');

  function handleGenerate() {
    var name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    generateCustomKP(name);
  }

  btn.addEventListener('click', handleGenerate);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleGenerate();
  });
}

// ===== 选择知识点并生成 =====
function selectKP(kpId) {
  var kp = KnowledgeBase.getKP(kpId);
  if (!kp) {
    console.error('知识点未找到:', kpId);
    return;
  }
  state.currentKP = kp;
  generateAndShow(kp);
}

function generateCustomKP(name) {
  // 尝试在知识库中搜索
  var results = KnowledgeBase.search(name);
  if (results.length > 0 && results[0].name === name) {
    // 精确匹配，直接使用
    selectKP(results[0].id);
    return;
  }

  // 生成自定义知识点
  var kp = {
    id: 'custom-' + Date.now(),
    name: name,
    subject: 'general',
    subject_name: '通用',
    module: '',
    unit: '',
    phase: '',
    phase_name: '',
    confidence: 'llm_inferred',
    sub_skills: [
      '理解' + name + '的基本概念',
      '掌握' + name + '的核心要点',
      '能够运用' + name + '解决实际问题'
    ],
    common_errors: [],
    typical_examples: [],
    prerequisites: [],
    semester: '',
    textbook: '',
    grade: '',
    difficulty: '',
    custom: true
  };

  state.currentKP = kp;
  generateAndShow(kp);
}

// ===== 生成并展示 =====
function generateAndShow(kp) {
  // 显示加载状态
  showLoading(kp.name);

  // 模拟生成步骤
  var steps = [
    '解析知识点结构...',
    '匹配教学模板...',
    '生成常规讲解...',
    '生成故事化讲解...',
    '组装讲解页面...'
  ];

  var stepIndex = 0;
  var progressBar = document.getElementById('loadingBar');
  var stepLabel = document.getElementById('loadingStep');

  var stepInterval = setInterval(function() {
    if (stepIndex < steps.length) {
      stepLabel.textContent = steps[stepIndex];
      progressBar.style.width = ((stepIndex + 1) / steps.length * 100) + '%';
      stepIndex++;
    } else {
      clearInterval(stepInterval);

      // 生成内容
      var html = Generator.generate(kp);

      // 显示内容
      showContent(html, kp);

      // 渲染 MathJax
      if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([document.getElementById('contentContainer')]);
      }
    }
  }, 200);
}

// ===== 状态切换 =====
function showLoading(kpName) {
  document.getElementById('welcomeState').style.display = 'none';
  document.getElementById('contentState').style.display = 'none';
  document.getElementById('loadingState').style.display = 'flex';
  document.getElementById('loadingTitle').textContent = '正在生成「' + kpName + '」的讲解...';
  document.getElementById('loadingBar').style.width = '0%';
  document.getElementById('loadingStep').textContent = '解析知识点结构...';
}

function showContent(html, kp) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('welcomeState').style.display = 'none';
  document.getElementById('contentState').style.display = 'block';

  document.getElementById('contentContainer').innerHTML = html;

  // 工具栏信息
  var info = kp.subject_name || '通用';
  if (kp.phase_name) info += ' · ' + kp.phase_name;
  if (kp.difficulty) info += ' · ' + kp.difficulty;
  document.getElementById('toolbarInfo').textContent = info;

  // 滚动到顶部
  document.getElementById('viewerPanel').scrollTop = 0;
}

function showWelcome() {
  document.getElementById('contentState').style.display = 'none';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('welcomeState').style.display = 'flex';
  state.currentKP = null;
}

// ===== 热门知识点 =====
function showFeatured() {
  var container = document.getElementById('featuredList');
  var featured = [];

  // 尝试通过 ID 查找
  for (var i = 0; i < FEATURED_KP_IDS.length; i++) {
    var kp = KnowledgeBase.getKP(FEATURED_KP_IDS[i]);
    if (kp) featured.push(kp);
  }

  // 如果不够，通过关键词补充
  if (featured.length < 4) {
    for (var j = 0; j < FEATURED_KEYWORDS.length && featured.length < 6; j++) {
      var results = KnowledgeBase.search(FEATURED_KEYWORDS[j]);
      for (var k = 0; k < results.length && featured.length < 6; k++) {
        var exists = featured.some(function(f) { return f.id === results[k].id; });
        if (!exists) {
          var kpFull = KnowledgeBase.getKP(results[k].id);
          if (kpFull) featured.push(kpFull);
        }
      }
    }
  }

  // 如果还不够，取前几个五年级数学
  if (featured.length < 4) {
    var allKPs = KnowledgeBase.searchIndex;
    for (var m = 0; m < allKPs.length && featured.length < 6; m++) {
      if (allKPs[m].phase === 'primary_5' && allKPs[m].subject === 'math') {
        var exists2 = featured.some(function(f) { return f.id === allKPs[m].id; });
        if (!exists2) {
          var kpFull2 = KnowledgeBase.getKP(allKPs[m].id);
          if (kpFull2) featured.push(kpFull2);
        }
      }
    }
  }

  var html = '';
  for (var n = 0; n < featured.length; n++) {
    html += '<span class="featured-item" data-kp-id="' + featured[n].id + '">' +
            escapeHtml(featured[n].name) + '</span>';
  }
  container.innerHTML = html;

  // 绑定点击
  container.querySelectorAll('.featured-item').forEach(function(item) {
    item.addEventListener('click', function() {
      selectKP(this.dataset.kpId);
    });
  });
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

// ===== 启动 =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
