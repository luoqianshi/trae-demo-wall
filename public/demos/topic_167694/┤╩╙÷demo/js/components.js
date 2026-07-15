// ============================================================
// 词遇 CIYU · 组件定义与应用逻辑
// ============================================================

// ------------------------------------------------------------
// 工具函数：路由导航
// ------------------------------------------------------------

/** 跳转到单元详情页 */
function goToDetail(word) {
  var unit = wordLookup[word];
  if (!unit) return;
  store.navStack.push({ view: store.currentView });
  store.selectedUnit = unit;
  store.currentView = 'detail';
}

/** 返回上一页 */
function goBack() {
  if (store.navStack.length === 0) return;
  var prev = store.navStack.pop();
  store.currentView = prev.view;
}

/** 切换到指定视图 */
function goView(viewName) {
  store.currentView = viewName;
}

/** 跳转到 AI 助手页面 */
function goToAiView() {
  store.navStack.push({ view: store.currentView });
  store.currentView = 'ai';
}

// ------------------------------------------------------------
// 工具函数：根据学习目标推荐关联
// ------------------------------------------------------------

/** 获取某单词基于用户目标的 AI 推荐关联 */
function getGoalRecs(word) {
  var goal = store.goalText || '';
  var isTravel = goal.indexOf('旅游') >= 0 || goal.indexOf('旅行') >= 0 || goal.indexOf('自由行') >= 0;
  var isExam = goal.indexOf('考试') >= 0 || goal.indexOf('N') >= 0 || goal.indexOf('JLPT') >= 0;
  var isAnime = goal.indexOf('动漫') >= 0 || goal.indexOf('日剧') >= 0 || goal.indexOf('动画') >= 0;

  var recs = {
    '食べる': {
      travel:  ['お弁当', 'レストラン', 'おすすめ', '召し上がる', 'いただきます', '美味しい'],
      exam:    ['食う', '召し上がる', '〜てから', '〜前に', '可能形', '被动形'],
      anime:   ['食う', '食っちゃう', 'もぐもぐ', '美味い', 'うまい', '飯']
    },
    '散歩': {
      travel:  ['観光', 'お寺', '神社', '写真', '公園', '街'],
      exam:    ['歩く', '散歩道', '〜ながら', '〜途中'],
      anime:   ['ブラブラ', '散歩する', '道', '公園']
    },
    'お弁当': {
      travel:  ['駅弁', 'ランチ', '食べる', '美味しい', '店'],
      exam:    ['弁当', '昼食', '食事', '〜を作る'],
      anime:   ['おにぎり', '弁当', '手作り', 'お昼']
    },
    '天気': {
      travel:  ['晴れ', '雨', '予報', '暑い', '寒い', '服装'],
      exam:    ['気候', '季節', '〜そうだ', '〜ようだ'],
      anime:   ['晴れ', '雨', '曇り', '虹', '雪']
    },
    '勉強': {
      travel:  ['会話', '質問', '聞く', '話す', '練習'],
      exam:    ['授業', '宿題', 'テスト', '試験', '教科書'],
      anime:   ['勉強する', '学校', '授業', 'テスト', '赤点']
    },
    '公園': {
      travel:  ['散歩', '花見', '桜', 'ベンチ', '遊ぶ'],
      exam:    ['庭', '広場', '遊園地', '植物'],
      anime:   ['公園', 'ブランコ', '遊び場', '待ち合わせ']
    }
  };

  var map = recs[word] || { travel: [], exam: [], anime: [] };
  if (isTravel) return map.travel || [];
  if (isExam) return map.exam || [];
  if (isAnime) return map.anime || [];
  return (map.travel || []).slice(0, 3);
}

/** 获取混合排序的关联列表（AI 根据目标+状态排序） */
function getMixedAssocs(unit) {
  var base = (unit.associations || []).slice(0, 8);
  var goalRecs = getGoalRecs(unit.word).slice(0, 6);
  var mixed = [];

  // 把 goalRecs 优先插入（按 AI 推荐排序）
  goalRecs.forEach(function(g) {
    mixed.push({ word: g, isAi: true });
  });
  // 基础关联补充进去
  base.forEach(function(b) {
    // 去重
    var exists = mixed.some(function(m) { return m.word === b; });
    if (!exists) mixed.push({ word: b, isAi: false });
  });

  return mixed;
}

// ------------------------------------------------------------
// 工具函数：划词解析
// ------------------------------------------------------------

/** 生成默认解析结果 */
function generatePopupResult(text, units) {
  var isLong = text.length > 6 || units.length > 1;
  var isSentence = text.indexOf(' ') >= 0 || text.indexOf('、') >= 0 || text.indexOf('。') >= 0 || text.length > 8;

  if (units.length === 1 && !isLong && !isSentence) {
    // 单个单词：详细解析
    var u = units[0];
    var examples = u.meanings && u.meanings[0] ? u.meanings[0].example : '';
    var exampleCn = u.meanings && u.meanings[0] ? u.meanings[0].exampleCn : '';
    var assocHint = (u.associations || []).slice(0, 3).join('、');
    return '' +
      '<div class="spop-res-word">' +
        '<div class="spop-res-main">' +
          '<b>' + u.word + '</b>' +
          '<span class="spop-res-kana">' + u.kana + '</span>' +
          '<span class="spop-res-mean">' + u.meaning + '</span>' +
          (u.type ? '<span class="spop-res-type">' + u.type + '</span>' : '') +
        '</div>' +
        (examples ? '<div class="spop-res-ex">「' + examples + '」' + (exampleCn ? '<br>「' + exampleCn + '」' : '') + '</div>' : '') +
        (assocHint ? '<div class="spop-res-assoc">相关：' + assocHint + '</div>' : '') +
      '</div>';
  }

  if (isSentence || units.length > 1) {
    // 句子/短语：翻译 + 词汇解析
    var trans = text;
    var vocabHtml = units.map(function(u) {
      return '<span class="spop-res-tag">' + u.word + '（' + u.kana + '）' + u.meaning + '</span>';
    }).join('');
    return '' +
      '<div class="spop-res-sent">' +
        '<div class="spop-res-trans">' + trans + '</div>' +
        '<div class="spop-res-label">涉及词汇</div>' +
        '<div class="spop-res-vocab">' + vocabHtml + '</div>' +
      '</div>';
  }

  // 兜底
  return '<div class="spop-res-fallback">「' + text + '」<br>当前词库未匹配到该内容，正式版中 AI 会实时解析。</div>';
}

/** 处理全局文本选中 */
function handleSelection() {
  var sel = window.getSelection();
  var text = sel ? sel.toString().trim() : '';
  if (!text || text.length < 1 || text.length > 50) return;

  store.popupText = text;
  store.popupUnits = [];
  store.popupLoading = true;
  store.popupMatched = false;
  store.popupResult = '';
  store.popupResultType = '';
  store.showPopup = true;

  // 模拟加载延迟（后续对接真实 AI 时替换为实际 API 调用）
  setTimeout(function() {
    // 长词优先匹配
    var found = [];
    var keys = Object.keys(wordLookup).sort(function(a, b) {
      return b.length - a.length;
    });
    for (var i = 0; i < keys.length; i++) {
      if (text.indexOf(keys[i]) >= 0) {
        found.push(wordLookup[keys[i]]);
      }
    }

    store.popupMatched = found.length > 0;
    if (found.length === 0) {
      // 未匹配时的兜底反馈
      found = [{
        word: text,
        kana: '—',
        meaning: '当前词库未匹配到该内容。正式版中 AI 会实时解析，自动拆分为基本单元。'
      }];
    }

    store.popupUnits = found;
    store.popupResult = generatePopupResult(text, found);
    store.popupResultType = (found.length === 1 && text.length <= 6 && text.indexOf(' ') < 0 && text.indexOf('、') < 0) ? 'word' : 'sentence';
    store.popupLoading = false;
  }, 400);
}

// ------------------------------------------------------------
// 工具函数：AI 对话
// ------------------------------------------------------------

/** 发送 AI 消息 */
function sendAiMessage() {
  var q = store.aiInput.trim();
  if (!q) return;

  store.aiMessages.push({ role: 'user', text: q });
  store.aiInput = '';

  // 根据问题内容生成 mock 回复
  var reply = generateAiReply(q);
  setTimeout(function() {
    store.aiMessages.push({ role: 'ai', html: reply });
  }, 300);
}

/** 生成 AI 回复 HTML */
function generateAiReply(question) {
  var wlink = function(w) {
    return '<span class="wlink" data-w="' + w + '">' + w + '</span>';
  };

  if (question.indexOf('语法') >= 0 || question.indexOf('结构') >= 0) {
    return '' +
      '<p>这是一个很好的问题！</p>' +
      '<p>「' + wlink('食べる') + '」是一段动词，' +
      '否定形为「食べない」，て形为「食べて」。</p>' +
      '<p>在句子中，助词「を」提示宾语。例如：' +
      wlink('お弁当') + 'を' + wlink('食べる') + '（吃便当）。</p>' +
      '<p style="color:#888;font-size:.85em;">💡 你可能还想了解：' +
      wlink('散歩') + ' 的动词变形？</p>';
  }

  if (question.indexOf('水平') >= 0 || question.indexOf('能力') >= 0) {
    return '' +
      '<p>根据你的学习轨迹，目前大约 <b style="color:#2B5F8A;">N5 水平</b>。</p>' +
      '<p>已接触 18 个单元，其中 8 个掌握较好，5 个待复习。</p>' +
      '<p>建议重点加强：' + wlink('散歩') + '、' + wlink('お弁当') + ' 等低熟悉度词。</p>';
  }

  if (question.indexOf('目标') >= 0 || question.indexOf('goal') >= 0) {
    return '' +
      '<p>你的当前学习目标：<b>"' + store.goalText + '"</b></p>' +
      '<p>AI 分析建议：</p>' +
      '<ul style="margin:4px 0 0 16px;padding:0;">' +
        store.goalAnalysis.map(function(g) {
          return '<li><b>' + g.label + '：</b>' + g.value + '</li>';
        }).join('') +
      '</ul>' +
      '<p style="color:#888;font-size:.85em;margin-top:8px;">💡 告诉我你想怎么修改，我帮你更新目标。</p>';
  }

  if (question.indexOf('修改目标') >= 0 || question.indexOf('改目标') >= 0) {
    return '' +
      '<p>好的，我帮你更新学习目标！</p>' +
      '<p>请告诉我你想改成什么样的目标？比如：</p>' +
      '<ul style="margin:4px 0 0 16px;padding:0;">' +
        '<li>"我想通过 JLPT N3 考试"</li>' +
        '<li>"我想无字幕看懂动漫"</li>' +
        '<li>"我想去日本自由行"</li>' +
      '</ul>' +
      '<p style="color:#888;font-size:.85em;">💡 更新后我也会同步调整分析结果和推荐内容。</p>';
  }

  if (question.indexOf('旅游') >= 0 || question.indexOf('自由行') >= 0) {
    return '' +
      '<p>' + wlink('食べる') + '（たべる）= "吃"</p>' +
      '<p>常用搭配：' + wlink('ご飯') + 'を食べる（吃饭）、' +
      wlink('お弁当') + 'を食べる（吃便当）</p>' +
      '<p>近义词：' + wlink('食う') + '（口语）、' +
      wlink('召し上がる') + '（尊敬语）</p>';
  }

  return '' +
    '<p>好的，这是一个很好的问题！（AI 示意）</p>' +
    '<p>试试点击回复中的 ' + wlink('天気') + '、' + wlink('勉強') + ' 等词可以跳转到详情。</p>' +
    '<p style="color:#888;font-size:.85em;">💡 你也可以选中页面上任意文字划词查询～</p>';
}

// ------------------------------------------------------------
// 工具函数：测试模块
// ------------------------------------------------------------

/** 选择答案 */
function answerTest(optionIndex) {
  if (store.testAnswered) return;
  store.testChosen = optionIndex;
  store.testAnswered = true;
}

/** 下一题 */
function nextTest() {
  store.testResults.push(store.testChosen === testQuestions[store.testIndex].answer);

  if (store.testIndex < testQuestions.length - 1) {
    store.testIndex++;
    store.testAnswered = false;
    store.testChosen = -1;
    store.currentTest = testQuestions[store.testIndex];
  } else {
    store.testScore = store.testResults.filter(function(r) { return r; }).length;
    store.testFinished = true;
  }
}

/** 重置测试 */
function resetTest() {
  store.testIndex = 0;
  store.testAnswered = false;
  store.testChosen = -1;
  store.testFinished = false;
  store.testScore = 0;
  store.testResults = [];
  store.currentTest = testQuestions[0];
}

// ------------------------------------------------------------
// 创建 Vue 应用
// ------------------------------------------------------------

var app = Vue.createApp({
  setup: function() {
    return { store: store };
  },
  provide: function() {
    return { store: store };
  },
  data: function() {
    return {
      viewNames: {
        components: '组件展示',
        home: '首页',
        reading: '阅读',
        explore: '探索',
        test: '测试',
        settings: '设置',
        ai: '助手',
        detail: '单元详情'
      },
      searchInput: ''
    };
  },
  computed: {
    displayUnits: function() { return units.slice(0, 3); },
    reviewUnits: function() { return [units[3], units[0]]; },
    allUnits: function() { return units; },
    historyEntries: function() { return historyEntries; },
    readingSentences: function() { return readingSentences; },
    readingRewrites: function() { return readingRewrites; },
    currentRewrite: function() {
      if (this.store.readingRewriteKey && readingRewrites[this.store.readingRewriteKey]) {
        return readingRewrites[this.store.readingRewriteKey];
      }
      return null;
    },
    historyStats: function() {
      var unitSet = {};
      var learnCount = 0;
      var practiceCount = 0;
      historyEntries.forEach(function(e) {
        if (e.type === 'learn') learnCount++;
        if (e.type === 'practice') practiceCount++;
      });
      units.forEach(function(u) { unitSet[u.word] = true; });
      return { unitCount: Object.keys(unitSet).length, learnCount: learnCount, practiceCount: practiceCount };
    },
    testQuestions: function() { return testQuestions; },
    currentQuestion: function() { return testQuestions[store.testIndex]; }
  },
  methods: {
    goToDetail: goToDetail,
    goBack: goBack,
    goView: goView,
    answerTest: answerTest,
    nextTest: nextTest,
    resetTest: resetTest,
    sendAiMessage: sendAiMessage,
    searchOrAsk: function() {
      var q = this.searchInput.trim();
      if (!q) return;
      this.searchInput = '';
      // 追加到聊天记录（不重置，保留上下文）
      store.aiMessages.push({ role: 'user', text: q });
      var reply = generateAiReply(q);
      store.aiEmbedHtml = reply;
      store.aiEmbedVisible = true;
      store.aiMessages.push({ role: 'ai', html: reply });
    },
    goToAiView: goToAiView,
    goReadingWith: function(title) {
      store.readingTitle = title;
      goView('reading');
    },
    askAboutReading: function() {
      var q = '帮我解析这篇文章：「' + (store.readingTitle || '来週、京都へ旅行に行きます') + '」';
      store.aiMessages.push({ role: 'user', text: q });
      var reply = generateAiReply(q);
      store.aiMessages.push({ role: 'ai', html: reply });
      goToAiView();
    },
    wcStyle: function(unit) {
      var sizes = { low: 1.3, medium: 1.0, high: 0.8 };
      var colors = { low: '#E08B4F', medium: '#3B829C', high: '#5B9A7A' };
      return {
        fontSize: (sizes[unit.familiarity] || 1) + 'em',
        opacity: sizes[unit.familiarity] || 0.7
      };
    }
  },
  mounted: function() {
    var self = this;

    // 全局划词监听
    document.addEventListener('mouseup', function() {
      setTimeout(function() {
        var sel = window.getSelection();
        var text = sel ? sel.toString().trim() : '';
        if (text && text.length > 0 && text.length < 50) {
          handleSelection();
        }
      }, 10);
    });

    // AI 对话中点击词跳转
    document.addEventListener('click', function(e) {
      if (e.target.classList && e.target.classList.contains('wlink')) {
        var w = e.target.getAttribute('data-w');
        if (w) goToDetail(w);
      }
    });
  }
});

// ============================================================
// 组件定义
// ============================================================

// ------------------------------------------------------------
// 组件 1：导航栏
// ------------------------------------------------------------
app.component('nav-bar', {
  inject: ['store'],
  template: '' +
    '<div class="nav">' +
      '<div class="nav-left">' +
        '<button v-if="store.navStack.length" class="nav-back" @click="goBack()">←</button>' +
      '</div>' +
      '<div class="nav-title">{{ viewName }}</div>' +
      '<div class="nav-right">' +
        '<button ' +
          'v-for="(name, key) in tabs" ' +
          ':key="key" ' +
          'class="nav-tab" ' +
          ':class="{ on: store.currentView === key }" ' +
          '@click="goView(key)">' +
          '{{ name }}' +
        '</button>' +
      '</div>' +
    '</div>',
  data: function() {
    return {
      tabs: {
        components: '组件',
        home: '首页',
        units: '单元',
        reading: '阅读',
        test: '测试',
        settings: '设置'
      }
    };
  },
  computed: {
    viewName: function() {
      var map = {
        components: '组件展示',
        home: '首页',
        units: '所有单元',
        reading: '阅读与解析',
        explore: '单元探索',
        test: '快速测试',
        settings: '设置',
        ai: '助手',
        detail: '单元详情',
        history: '学习历史'
      };
      return map[this.store.currentView] || '';
    }
  },
  methods: {
    goView: goView,
    goBack: goBack
  }
});

// ------------------------------------------------------------
// 组件 2：单元卡片
// ------------------------------------------------------------
app.component('unit-card', {
  props: ['unit'],
  emits: ['click'],
  template: '' +
    '<div class="ucard" @click="$emit(\'click\', unit)">' +
      '<div class="ucard-head">' +
        '<span class="ucard-word">{{ unit.word }}</span>' +
        '<span class="ucard-kana">{{ unit.kana }}</span>' +
      '</div>' +
      '<div class="ucard-meaning">{{ unit.meaning }}</div>' +
      '<div class="ucard-foot">' +
        '<span class="ucard-type">{{ unit.type }}</span>' +
        '<div class="ucard-fam">' +
          '<div class="ucard-bar">' +
            '<div class="ucard-fill" :class="unit.familiarity"></div>' +
          '</div>' +
          '<span class="ucard-count">{{ unit.seenCount }}次</span>' +
        '</div>' +
      '</div>' +
    '</div>',
  methods: {
    analyzeGoal: function() {
      // 模拟 AI 分析，根据 target 文本生成不同的分析结果
      var text = this.store.goalText;
      if (text.indexOf('旅游') >= 0) {
        this.store.goalAnalysis = [
          { label: '目标水平', value: 'JLPT N4 左右' },
          { label: '核心词汇', value: '约 800-1000 词（旅游、餐饮、交通）' },
          { label: '重点语法', value: '基本敬语、～てください、～たい、～ましょう' },
          { label: '预估时长', value: '3-6 个月（每天 30 分钟）' },
          { label: '推荐侧重', value: '听力 + 口语，辅以阅读' }
        ];
      } else if (text.indexOf('考试') >= 0 || text.indexOf('N') >= 0) {
        this.store.goalAnalysis = [
          { label: '目标水平', value: 'JLPT N3 左右' },
          { label: '核心词汇', value: '约 2000 词（覆盖考纲）' },
          { label: '重点语法', value: '中级语法、敬语、被动/使役' },
          { label: '预估时长', value: '6-12 个月（每天 45+ 分钟）' },
          { label: '推荐侧重', value: '阅读 + 语法，辅以听力' }
        ];
      } else if (text.indexOf('动漫') >= 0 || text.indexOf('日剧') >= 0) {
        this.store.goalAnalysis = [
          { label: '目标水平', value: 'JLPT N3~N2 左右' },
          { label: '核心词汇', value: '约 1500-2000 词（口语、生活、文化）' },
          { label: '重点语法', value: '口语省略、拟声拟态词、年轻人用语' },
          { label: '预估时长', value: '6-12 个月（每天 30 分钟）' },
          { label: '推荐侧重', value: '听力 + 口语，大量输入' }
        ];
      } else {
        this.store.goalAnalysis = [
          { label: '目标水平', value: '日常交流水平' },
          { label: '核心词汇', value: '约 1000-1500 词' },
          { label: '重点语法', value: '基本时态、敬语基础' },
          { label: '预估时长', value: '3-9 个月' },
          { label: '推荐侧重', value: '综合均衡发展' }
        ];
      }
    }
  }
});

// ------------------------------------------------------------
// 组件 2.5：所有单元列表（浏览+检索）
// ------------------------------------------------------------
app.component('unit-list', {
  inject: ['store'],
  template: '' +
    '<div class="ulist">' +
      '<div class="ulist-search">' +
        '<input ' +
          'v-model="store.unitSearchQuery" ' +
          'placeholder="搜索单元（日文、中文、假名）…" />' +
      '</div>' +
      '<div class="ulist-results">' +
        '<div v-if="filtered.length === 0" class="ulist-empty">' +
          '没有匹配的单元。试试其他关键词？' +
        '</div>' +
        '<div ' +
          'class="ulist-item" ' +
          'v-for="u in filtered" ' +
          ':key="u.id" ' +
          '@click="goDetail(u.word)">' +
          '<div class="ulist-word">{{ u.word }}</div>' +
          '<div class="ulist-kana">{{ u.kana }}</div>' +
          '<div class="ulist-meaning">{{ u.meaning }}</div>' +
          '<div class="ulist-type">{{ u.type }}</div>' +
          '<div class="ulist-fam">' +
            '<div class="ulist-bar">' +
              '<div class="ucard-fill" :class="u.familiarity"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ulist-count">共 {{ allUnits.length }} 个单元，显示 {{ filtered.length }} 个</div>' +
    '</div>',
  computed: {
    allUnits: function() { return units; },
    filtered: function() {
      var q = this.store.unitSearchQuery.trim().toLowerCase();
      if (!q) return units;
      return units.filter(function(u) {
        return u.word.indexOf(q) >= 0 ||
               u.kana.indexOf(q) >= 0 ||
               u.meaning.indexOf(q) >= 0 ||
               u.type.indexOf(q) >= 0;
      });
    }
  },
  methods: {
    goDetail: goToDetail
  }
});

// ------------------------------------------------------------
// 组件 3：单元详情（嵌入关联网络，支持链式导航）
// ------------------------------------------------------------
app.component('unit-detail', {
  inject: ['store'],
  props: ['unit'],
  template: '' +
    '<div class="udetail" v-if="unit">' +
      '<div class="udetail-top">' +
        '<button v-if="store.navStack.length" class="udetail-back" @click="goBack()">← 返回</button>' +
      '</div>' +
      '<div class="udetail-head">' +
        '<div>' +
          '<span class="udetail-word">{{ unit.word }}</span>' +
          '<span class="udetail-kana">{{ unit.kana }}</span>' +
          '<span class="udetail-type">{{ unit.type }}</span>' +
        '</div>' +
        '<button class="icon-btn">🔊</button>' +
      '</div>' +

      '<div class="udetail-sec" v-if="unit.meanings && unit.meanings.length">' +
        '<div class="udetail-label">释义</div>' +
        '<div class="udetail-meaning" v-for="(m, i) in unit.meanings" :key="i">' +
          '<span class="udetail-num">{{ i + 1 }}.</span> {{ m.text }}' +
          '<div class="udetail-ex">' +
            '<span class="udetail-ex-jp">{{ m.example }}</span>' +
            '<span class="udetail-ex-cn">{{ m.exampleCn }}</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- 关联网络：AI 混合排序 -->' +
      '<div class="udetail-sec">' +
        '<div class="udetail-label">关联网络 <span class="ai-badge">AI</span></div>' +
        '<div class="anet-chips">' +
          '<span ' +
            'v-for="a in mixedAssocs" ' +
            ':key="a.word" ' +
            'class="assoc-chip" ' +
            ':class="{ goal: a.isAi }" ' +
            '@click="goToDetail(a.word)">' +
            '{{ a.word }}' +
          '</span>' +
        '</div>' +
        '<div class="anet-tip">' +
          '💡 金色标记为 AI 根据你的目标推荐，蓝色为常用关联。点击任意词可继续探索。' +
        '</div>' +
      '</div>' +

      '<div class="udetail-sec" v-if="unit.timeline && unit.timeline.length">' +
        '<div class="udetail-label">学习轨迹</div>' +
        '<div class="udetail-hist">' +
          '<hist-item v-for="t in unit.timeline" :key="t.date" :entry="timelineEntry(t)"></hist-item>' +
        '</div>' +
      '</div>' +

      '<div class="udetail-mark">' +
        '<button class="mark-btn" :class="{ on: unit._mark === \'unknown\' }" @click="unit._mark = \'unknown\'">不认识</button>' +
        '<button class="mark-btn" :class="{ on: unit._mark === \'vague\' }" @click="unit._mark = \'vague\'">有点印象</button>' +
        '<button class="mark-btn" :class="{ on: unit._mark === \'known\' }" @click="unit._mark = \'known\'">认识</button>' +
      '</div>' +
    '</div>',
  computed: {
    mixedAssocs: function() {
      return getMixedAssocs(this.unit);
    }
  },
  methods: {
    goToDetail: goToDetail,
    goBack: goBack,
    typeLabel: function(type) {
      var map = { learn: '学习', practice: '练习', test: '测试', review: '复习', unlock: '解锁' };
      return map[type] || '学习';
    },
    timelineEntry: function(t) {
      var word = this.unit.word;
      var map = {
        learn: '学习了「' + word + '」',
        review: '复习了「' + word + '」',
        practice: '练习了「' + word + '」',
        test: '测试了「' + word + '」',
        unlock: '解锁了「' + word + '」'
      };
      return { date: t.date, action: map[t.type] || t.action, type: t.type || 'learn' };
    }
  }
});

// ------------------------------------------------------------
// 组件 4：关联网络
// ------------------------------------------------------------
app.component('assoc-net', {
  inject: ['store'],
  template: '' +
    '<div class="anet">' +
      '<div class="anet-center">' +
        '<span class="anet-core">食べる</span>' +
      '</div>' +
      '<div class="anet-groups">' +
        '<div class="anet-group">' +
          '<div class="anet-gt">近义表达</div>' +
          '<div class="anet-node" @click="go(\'食う\')">' +
            '食う<span class="anet-note">口语</span>' +
          '</div>' +
          '<div class="anet-node" @click="go(\'召し上がる\')">' +
            '召し上がる<span class="anet-note">尊敬</span>' +
          '</div>' +
        '</div>' +
        '<div class="anet-group">' +
          '<div class="anet-gt">相关语法</div>' +
          '<div class="anet-node" @click="go(\'〜てから\')">' +
            '〜てから<span class="anet-note">之后</span>' +
          '</div>' +
          '<div class="anet-node" @click="go(\'〜前に\')">' +
            '〜前に<span class="anet-note">之前</span>' +
          '</div>' +
        '</div>' +
        '<div class="anet-group">' +
          '<div class="anet-gt">常用搭配</div>' +
          '<div class="anet-node" @click="go(\'ご飯\')">ご飯を食べる</div>' +
          '<div class="anet-node" @click="go(\'外食\')">外で食べる</div>' +
        '</div>' +
        '<div class="anet-group">' +
          '<div class="anet-gt">场景差异</div>' +
          '<div class="anet-node" @click="go(\'食事\')">' +
            '食事をする<span class="anet-note">正式</span>' +
          '</div>' +
          '<div class="anet-node" @click="go(\'口語\')">' +
            '食べちゃった<span class="anet-note">口语</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>',
  methods: {
    go: function(name) {
      var detail = assocDetail[name];
      if (detail) {
        var unit = {
          word: name,
          kana: '',
          meaning: detail.type,
          type: detail.type,
          meanings: [{ text: detail.desc, example: detail.compare || '', exampleCn: '' }],
          associations: [],
          timeline: [],
          familiarity: 'low',
          seenCount: 0
        };
        store.navStack.push({ view: store.currentView });
        store.selectedUnit = unit;
        store.currentView = 'detail';
      } else {
        goToDetail(name);
      }
    }
  }
});

// ------------------------------------------------------------
// 组件 5：划词浮窗
// ------------------------------------------------------------
app.component('sel-popup', {
  inject: ['store'],
  template: '' +
    '<transition name="fade">' +
      '<div v-if="store.showPopup" class="spop-wrap" @click.self="store.showPopup = false">' +
        '<div class="spop">' +
          '<!-- 选中内容提示 -->' +
          '<div class="spop-original">' +
            '<span class="spop-odeco">选中内容</span>' +
            '<span class="spop-otext">{{ store.popupText }}</span>' +
          '</div>' +
          '<!-- 加载动画 -->' +
          '<div v-if="store.popupLoading" class="spop-loading">' +
            '<div class="spop-spinner"></div>' +
            '<span>AI 解析中…</span>' +
          '</div>' +
          '<!-- 解析结果 -->' +
          '<div v-else>' +
            '<div class="spop-head">' +
              '<span class="spop-title">' +
                '解析结果 ' +
                '<span class="spop-badge" :class="store.popupMatched ? \'ok\' : \'no\'">' +
                  '{{ store.popupMatched ? "已匹配" : "未匹配" }}' +
                '</span>' +
              '</span>' +
              '<button class="spop-close" @click="store.showPopup = false">✕</button>' +
            '</div>' +
            '<div class="spop-result" v-html="store.popupResult"></div>' +
            '<div class="spop-list" v-if="!store.popupMatched">' +
              '<div class="spop-item" v-for="(u, i) in store.popupUnits" :key="i">' +
                '<div class="spop-item-h">' +
                  '<span class="spop-w">{{ u.word }}</span>' +
                  '<span class="spop-k">{{ u.kana }}</span>' +
                '</div>' +
                '<div class="spop-m">{{ u.meaning }}</div>' +
              '</div>' +
            '</div>' +
            '<div class="spop-foot">' +
              '<div class="spop-ai-btns">' +
                '<button class="spop-ai-btn" @click="askExplain">💬 详细解释</button>' +
                '<button class="spop-ai-btn" @click="askRewrite">改写语气</button>' +
                '<button class="spop-ai-btn" @click="askGrammar">语法解析</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</transition>',
  methods: {
    goDetail: function(w) {
      store.showPopup = false;
      goToDetail(w);
    },
    sendToAi: function(q) {
      store.showPopup = false;
      store.aiMessages.push({ role: 'user', text: q });
      var reply = generateAiReply(q);
      store.aiMessages.push({ role: 'ai', html: reply });
      goToAiView();
    },
    askTranslate: function() {
      this.sendToAi('「' + store.popupText + '」翻译成中文');
    },
    askRewrite: function() {
      this.sendToAi('把「' + store.popupText + '」换一种更口语化的说法');
    },
    askGrammar: function() {
      this.sendToAi('解析「' + store.popupText + '」的语法结构');
    },
    askExplain: function() {
      this.sendToAi('「' + store.popupText + '」是什么意思？');
    }
  }
});

// ------------------------------------------------------------
// 组件 6：AI 对话浮窗
// ------------------------------------------------------------
app.component('ai-fab', {
  inject: ['store'],
  template: '' +
    '<div class="aifab">' +
      '<transition name="fab-slide">' +
        '<div v-if="store.aiChatOpen" class="aifab-panel">' +
          '<div class="aifab-head">' +
            '<span>💬 助手</span>' +
            '<div class="aifab-head-actions">' +
              '<button class="aifab-close" @click="openFull">⛶ 展开</button>' +
              '<button class="aifab-close" @click="store.aiChatOpen = false">✕</button>' +
            '</div>' +
          '</div>' +
          '<div class="aifab-msgs" ref="msgs">' +
            '<div v-if="!store.aiMessages.length" class="aifab-empty">有问题随时问我～</div>' +
            '<div ' +
              'v-for="(m, i) in store.aiMessages" ' +
              ':key="i" ' +
              'class="aifab-msg" ' +
              ':class="m.role">' +
              '<template v-if="m.role === \'user\'">{{ m.text }}</template>' +
              '<template v-else v-html="m.html"></template>' +
            '</div>' +
          '</div>' +
          '<div class="aifab-input">' +
            '<input ' +
              'v-model="store.aiInput" ' +
              'placeholder="输入问题..." ' +
              '@keyup.enter="send" />' +
            '<button @click="send">发送</button>' +
          '</div>' +
        '</div>' +
      '</transition>' +
      '<button v-if="!store.aiChatOpen" class="aifab-btn" @click="store.aiChatOpen = true">💬</button>' +
    '</div>',
  methods: {
    send: sendAiMessage,
    openFull: function() {
      store.aiChatOpen = false;
      goToAiView();
    }
  },
  updated: function() {
    var el = this.$refs.msgs;
    if (el) el.scrollTop = el.scrollHeight;
  }
});

// ------------------------------------------------------------
// 组件 6.5：AI 独立页面
// ------------------------------------------------------------
app.component('ai-view', {
  inject: ['store'],
  template: '' +
    '<div class="ai-view">' +
      '<div class="ai-view-head">' +
        '<h2>💬 助手</h2>' +
        '<p>什么都可以问——单词、语法、句子、学习方法、目标调整</p>' +
      '</div>' +
      '<div class="ai-view-msgs" ref="msgs">' +
        '<div v-if="!store.aiMessages.length" class="aifab-empty" style="padding:40px 0;">' +
          '试试问点什么～' +
        '</div>' +
        '<div ' +
          'v-for="(m, i) in store.aiMessages" ' +
          ':key="i" ' +
          'class="ai-view-msg" ' +
          ':class="m.role">' +
          '<template v-if="m.role === \'user\'">{{ m.text }}</template>' +
          '<template v-else v-html="m.html"></template>' +
        '</div>' +
      '</div>' +
      '<div class="ai-view-input">' +
        '<input ' +
          'v-model="store.aiInput" ' +
          'placeholder="输入问题..." ' +
          '@keyup.enter="send" />' +
        '<button @click="send">发送</button>' +
      '</div>' +
    '</div>',
  methods: {
    send: sendAiMessage
  },
  updated: function() {
    var el = this.$refs.msgs;
    if (el) el.scrollTop = el.scrollHeight;
  }
});

// ------------------------------------------------------------
// 组件 7：测试卡片
// ------------------------------------------------------------
app.component('test-card', {
  inject: ['store'],
  template: '' +
    '<div class="tcard">' +
      '<div class="tcard-type">{{ q.type }}</div>' +
      '<div class="tcard-q">{{ q.question }}</div>' +
      '<div class="tcard-opts">' +
        '<div ' +
          'class="tcard-opt" ' +
          'v-for="(o, i) in q.options" ' +
          ':key="i"' +
          ':class="' +
            '{ ' +
              'ok: store.testAnswered && i === q.answer, ' +
              'no: store.testAnswered && i === store.testChosen && i !== q.answer ' +
            '}' +
          '"' +
          '@click="answer(i)">' +
          '<span class="tcard-letter">{{ ["A","B","C","D"][i] }}</span>' +
          '<span>{{ o }}</span>' +
        '</div>' +
      '</div>' +
      '<transition name="slide">' +
        '<div ' +
          'v-if="store.testAnswered" ' +
          'class="tcard-fb" ' +
          ':class="store.testChosen === q.answer ? \'ok\' : \'no\'">' +
          '{{ store.testChosen === q.answer ? "✓ 正确" : "✗ 错误，正确答案：" + ["A","B","C","D"][q.answer] }}' +
          '<div class="tcard-exp">{{ q.explanation }}</div>' +
        '</div>' +
      '</transition>' +
      '<button ' +
        'v-if="store.testAnswered" ' +
        'class="tcard-next" ' +
        '@click="next">' +
        '{{ isLast ? "查看结果" : "下一题" }}' +
      '</button>' +
    '</div>',
  computed: {
    q: function() { return testQuestions[store.testIndex]; },
    isLast: function() { return store.testIndex >= testQuestions.length - 1; }
  },
  methods: {
    answer: answerTest,
    next: nextTest
  }
});

// ------------------------------------------------------------
// 组件 8：能力评估
// ------------------------------------------------------------
app.component('ability-card', {
  inject: ['store'],
  template: '' +
    '<div class="abcard">' +
      '<div class="abcard-desc">你现在大约能看懂简单的日语菜单和天气预报</div>' +
      '<div class="abcard-ref">参考：JLPT N5</div>' +
      '<div class="abcard-radar">' +
        '<div class="ab-radar-item" v-for="d in store.abilityData" :key="d.name">' +
          '<div class="ab-radar-label">{{ d.name }}</div>' +
          '<div class="ab-radar-bar">' +
            '<div class="ab-radar-fill" :style="{ width: d.value + \'%\' }"></div>' +
          '</div>' +
          '<div class="ab-radar-val">{{ d.value }}%</div>' +
        '</div>' +
      '</div>' +
      '<div class="abcard-stats">' +
        '<div class="ab-stat">' +
          '<div class="ab-num">{{ store.abilityStats.unitCount }}</div>' +
          '<div class="ab-label">接触过</div>' +
        '</div>' +
        '<div class="ab-stat">' +
          '<div class="ab-num">{{ store.abilityStats.mastered }}</div>' +
          '<div class="ab-label">掌握较好</div>' +
        '</div>' +
        '<div class="ab-stat">' +
          '<div class="ab-num">{{ store.abilityStats.toReview }}</div>' +
          '<div class="ab-label">待复习</div>' +
        '</div>' +
      '</div>' +
    '</div>'
});

// ------------------------------------------------------------
// 组件 9：历史记录
// ------------------------------------------------------------
app.component('hist-item', {
  props: ['entry'],
  template: '' +
    '<div class="hitem">' +
      '<div class="hitem-icon" :class="entry.type">' +
        '<template v-if="entry.type === \'learn\'">📖</template>' +
        '<template v-else-if="entry.type === \'practice\'">✏️</template>' +
        '<template v-else-if="entry.type === \'test\'">📝</template>' +
        '<template v-else-if="entry.type === \'review\'">🔄</template>' +
        '<template v-else>✨</template>' +
      '</div>' +
      '<div class="hitem-body">' +
        '<div class="hitem-title">{{ entry.action }}</div>' +
        '<div class="hitem-meta">{{ entry.date }} · {{ typeLabel }}</div>' +
        '<div class="hitem-units" v-if="unitWords.length">' +
          '<span ' +
            'class="hunit" ' +
            'v-for="w in unitWords" ' +
            ':key="w" ' +
            '@click.stop="go(w)">' +
            '{{ w }}' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</div>',
  computed: {
    typeLabel: function() {
      var map = { learn: '学习', practice: '练习', test: '测试', review: '复习', unlock: '解锁' };
      return map[this.entry.type] || '';
    },
    unitWords: function() {
      var text = this.entry.action;
      var found = [];
      for (var i = 0; i < units.length; i++) {
        if (text.indexOf(units[i].word) >= 0) found.push(units[i].word);
      }
      return found;
    }
  },
  methods: {
    go: function(w) { goToDetail(w); }
  }
});

// ------------------------------------------------------------
// 组件 10：内联阅读
// ------------------------------------------------------------
app.component('inline-read', {
  inject: ['store'],
  props: ['source'],
  template: '' +
    '<div class="iread" ref="ireadEl">' +
      '<!-- 只有一个阶段：Vue 渲染 measuredLines，测量和渲染是同一个 DOM -->' +
      '<div v-for="(s, si) in measuredLines" :key="si" class="iread-sentence">' +
        '<div class="iread-line" :data-line-idx="si">' +
          '<template v-for="(w, wi) in s.words" :key="wi">' +
            '<br v-if="w.isBreak">' +
            '<span v-else ' +
              'class="iread-word" ' +
              ':class="[w.familiarity, w.showRuby && w.isFirst ? \'ruby\' : \'\', w.familiarity===\'low\' && w.isFirst && showAnnots ? \'annotated\' : \'\']" ' +
              ':data-word="w.word" ' +
              '@click="go(w.word)">' +
              "<ruby v-if=\"w.showRuby && w.isFirst\">" +
                '{{ w.word }}' +
                '<rt>{{ w.kana }}</rt>' +
              '</ruby>' +
              '<template v-else>{{ w.word }}</template>' +
            '</span>' +
          '</template>' +
        '</div>' +
        '<svg class="iread-conn-svg" v-if="showAnnots"></svg>' +
        '<div class="iread-annots" v-if="showAnnots && getLowWords(s).length">' +
          '<div v-for="w in getLowWords(s)" :key="w.word" class="iread-annot" :data-word="w.word">' +
            '<div class="iread-annot-card">' +
              '<b>{{ w.word }}</b>（{{ w.kana }}）{{ w.meaning }}' +
              '<span v-if="w.grammarNote" class="iread-note-gram"> · {{ w.grammarNote }}</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<!-- 注释开关 -->' +
      '<div class="iread-annot-toggle" @click="showAnnots = !showAnnots">' +
        '{{ showAnnots ? "隐藏注释" : "显示注释" }}' +
      '</div>' +
    '</div>',
  data: function() {
    return {
      measuredLines: [],
      showAnnots: true
    };
  },
  computed: {
    allWords: function() {
      var raw;
      if (this.source === 'original') {
        raw = readingSentences;
      } else if (this.source === 'rewrite' && this.store.readingRewriteKey && readingRewrites[this.store.readingRewriteKey]) {
        raw = readingRewrites[this.store.readingRewriteKey].sentences;
      } else if (this.store.readingRewriteKey && readingRewrites[this.store.readingRewriteKey]) {
        raw = readingRewrites[this.store.readingRewriteKey].sentences;
      } else {
        raw = readingSentences;
      }
      // 合并所有句子为一个词列表，句子之间加句号
      var words = [];
      var periodWord = { word: '。', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' };
      var breakWord = { word: '', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '', isBreak: true };
      var isDialog = this.source === 'rewrite' && this.store.readingRewriteKey === 'dialog';
      // 追踪哪些词是首次出现（注音和注释只在首次显示）
      var seenWords = {};
      for (var i = 0; i < raw.length; i++) {
        if (i > 0) {
          words.push(periodWord);
          // 对话体：A/B 标记前强制换行
          if (isDialog) words.push(breakWord);
        }
        for (var j = 0; j < raw[i].words.length; j++) {
          var w = raw[i].words[j];
          w = Object.assign({}, w); // 浅拷贝，避免修改原始数据
          if (w.word && !seenWords[w.word]) {
            seenWords[w.word] = true;
            w.isFirst = true;
          } else {
            w.isFirst = false;
          }
          words.push(w);
        }
      }
      return words;
    }
  },
  methods: {
    go: function(w) { goToDetail(w); },
    getLowWords: function(s) {
      var seen = {};
      return s.words.filter(function(w) {
        if (w.familiarity !== 'low' || w.isBreak || !w.word || !w.isFirst) return false;
        if (seen[w.word]) return false;
        seen[w.word] = true;
        return true;
      });
    },
    detectLineBreaks: function() {
      var self = this;
      if (!self.allWords.length) return;

      // Vue 响应式驱动：逐词填入 measuredLines，每次 $nextTick 后检查当前行高度
      self.measuredLines = [{ words: [] }];
      var lineIdx = 0;
      var baseH = 0; // 基准行高（第一个词所在行的高度）

      function fillNext(wordIdx) {
        if (wordIdx >= self.allWords.length) {
          // 所有词填完，清理空行
          if (self.measuredLines.length > 0 && self.measuredLines[self.measuredLines.length - 1].words.length === 0) {
            self.measuredLines.pop();
          }
          // 后处理：逐行检查高度，溢出的行把尾部词移到下一行
          self.$nextTick(function() { fixOverflowLines(0); });
          return;
        }

        var w = self.allWords[wordIdx];

        // isBreak 强制开新行
        if (w.isBreak) {
          if (self.measuredLines[lineIdx].words.length === 0) {
            // 当前行为空，直接跳过这个 break
            fillNext(wordIdx + 1);
            return;
          }
          lineIdx++;
          self.measuredLines.push({ words: [] });
          baseH = 0;
          fillNext(wordIdx + 1);
          return;
        }

        // 把词加入当前行
        self.measuredLines[lineIdx].words.push(w);

        self.$nextTick(function() {
          self.$nextTick(function() {
          // 获取当前行的 DOM
          var lineEl = self.$el.querySelector('[data-line-idx="' + lineIdx + '"]');
          // Vue 3 的 :ref="'line-'+si" 会生成 ref 数组，用 querySelector 更可靠
          if (!lineEl) {
            // fallback：找最后一个 .iread-line
            var allLines = self.$el.querySelectorAll('.iread-line');
            lineEl = allLines[allLines.length - 1];
          }
          if (!lineEl) {
            fillNext(wordIdx + 1);
            return;
          }

          var h = lineEl.offsetHeight;
          if (baseH === 0) {
            baseH = h; // 第一个词的高度作为基准
          } else if (h > baseH) {
            // 高度溢出 → 撤回这个词，开新行
            self.measuredLines[lineIdx].words.pop();
            lineIdx++;
            self.measuredLines.push({ words: [w] });
            baseH = 0;
          }

          fillNext(wordIdx + 1);
          });
        });
      }

      // 后处理：逐行检查高度，溢出的行把尾部词移到下一行
      function fixOverflowLines(startIdx) {
        self.$nextTick(function() {
          var lineEls = self.$el.querySelectorAll('.iread-line');
          var changed = false;

          for (var i = startIdx; i < lineEls.length; i++) {
            var h = lineEls[i].offsetHeight;
            var lineData = self.measuredLines[i];
            if (!lineData || lineData.words.length <= 1) continue;

            // 基准高度：第一个词时的高度（39px）
            // 用第一行的高度作为基准（最可靠）
            var refH = lineEls[0] ? lineEls[0].offsetHeight : 39;
            // 如果第一行也是多行，refH 会是 78... 那用 39 作为 fallback
            if (refH > 50) refH = 39;

            if (h > refH * 1.3) {
              // 溢出了，把最后一个词移到下一行
              var overflowWord = lineData.words.pop();
              if (i + 1 < self.measuredLines.length) {
                self.measuredLines[i + 1].words.unshift(overflowWord);
              } else {
                self.measuredLines.push({ words: [overflowWord] });
              }
              console.log('[fixOverflow] line ' + i + ' h=' + h + ', moved "' + overflowWord.word + '" to line ' + (i + 1));
              changed = true;
              break; // 每次 $nextTick 只处理一行，重新检查
            }
          }

          if (changed) {
            fixOverflowLines(startIdx); // 重新检查
          } else {
            // 所有行高度正确，绘制连线
            self.drawLines();
          }
        });
      }

      fillNext(0);
    },
    drawLines: function() {
      var self = this;
      self.$nextTick(function() {
        var sentences = self.$el.querySelectorAll('.iread-sentence');
        var rowColors = ['#C4A882', '#3B829C', '#E08B4F', '#5B9A7A', '#8B7CB3', '#D4A84B', '#6B8E9F', '#B08D57'];
        sentences.forEach(function(sentence) {
          var svg = sentence.querySelector('.iread-conn-svg');
          if (!svg) return;
          var annotsContainer = sentence.querySelector('.iread-annots');
          if (!annotsContainer) return;
          var words = sentence.querySelectorAll('.iread-word.annotated');
          var annots = sentence.querySelectorAll('.iread-annot');
          var sRect = sentence.getBoundingClientRect();
          var sLeft = sRect.left;
          var sTop = sRect.top;

          // ---- 第一步：注释卡定位 ----
          var wordPositions = [];
          words.forEach(function(word) {
            var wWord = word.getAttribute('data-word');
            var annot = null;
            for (var i = 0; i < annots.length; i++) {
              if (annots[i].getAttribute('data-word') === wWord) { annot = annots[i]; break; }
            }
            if (!annot) return;
            var wRect = word.getBoundingClientRect();
            var aRect = annot.getBoundingClientRect();
            var idealLeft = (wRect.left + wRect.width / 2) - aRect.width / 2 - sLeft;
            var desiredLeft = Math.max(0, Math.min(idealLeft, sRect.width - aRect.width));
            var wordLeftRel = wRect.left - sLeft;
            wordPositions.push({
              word: wWord, annot: annot, desiredLeft: desiredLeft,
              wordLeft: wordLeftRel, width: aRect.width, height: aRect.height, row: -1
            });
          });

          // ---- 第二步：瀑布式放置（无重叠） ----
          var cardGap = 8;
          var rowGap = 6;
          var rows = [];
          wordPositions.forEach(function(wp) {
            var left = Math.max(0, Math.min(wp.desiredLeft, sRect.width - wp.width));
            var right = left + wp.width;
            var cardH = wp.height;

            // 尝试放在已有行的某个位置（不重叠）
            var fitRow = -1;
            for (var r = 0; r < rows.length; r++) {
              var row = rows[r];
              var ok = true;
              for (var p = 0; p < row.placed.length; p++) {
                var ex = row.placed[p];
                if (left < ex.right + cardGap && right > ex.left - cardGap) { ok = false; break; }
              }
              if (ok) { fitRow = r; break; }
            }

            // 没找到不重叠的行 → 如果理想位置右移能放下也试试
            if (fitRow < 0) {
              var shiftLeft = wp.wordLeft;
              var shiftedRight = shiftLeft + wp.width;
              if (shiftedRight <= sRect.width) {
                for (var r = 0; r < rows.length; r++) {
                  var row = rows[r];
                  var ok = true;
                  for (var p = 0; p < row.placed.length; p++) {
                    var ex = row.placed[p];
                    if (shiftLeft < ex.right + cardGap && shiftedRight > ex.left - cardGap) { ok = false; break; }
                  }
                  if (ok) { fitRow = r; left = shiftLeft; right = shiftedRight; break; }
                }
              }
            }

            if (fitRow >= 0) {
              // 放入已有行
              var row = rows[fitRow];
              var top = row.top;
              wp.annot.style.left = left + 'px';
              wp.annot.style.top = top + 'px';
              wp.row = fitRow;
              var thisBottom = top + cardH;
              row.placed.push({ left: left, right: right });
              if (thisBottom > row.bottom) row.bottom = thisBottom;
            } else {
              // 新开一行
              var newRowIndex = rows.length;
              var prevBottom = rows.length > 0 ? rows[rows.length - 1].bottom : 0;
              var top = prevBottom + rowGap;
              left = Math.max(0, Math.min(wp.desiredLeft, sRect.width - wp.width));
              right = left + wp.width;
              wp.annot.style.left = left + 'px';
              wp.annot.style.top = top + 'px';
              wp.row = newRowIndex;
              var thisBottom = top + cardH;
              rows.push({ placed: [{ left: left, right: right }], top: top, bottom: thisBottom });
            }
          });

          // 更新注释容器高度
          var maxBottom = 50;
          rows.forEach(function(row) { if (row.bottom > maxBottom) maxBottom = row.bottom; });
          annotsContainer.style.minHeight = maxBottom + 'px';

          // ---- 第三步：画连线 ----
          self.$nextTick(function() {
            var sRect2 = sentence.getBoundingClientRect();
            var sLeft2 = sRect2.left;
            var sTop2 = sRect2.top;
            var lineHTML = '';
            words.forEach(function(word) {
              var wWord = word.getAttribute('data-word');
              var annot = null;
              var wpData = null;
              for (var i = 0; i < wordPositions.length; i++) {
                if (wordPositions[i].word === wWord) { wpData = wordPositions[i]; break; }
              }
              if (!wpData) return;
              for (var i = 0; i < annots.length; i++) {
                if (annots[i].getAttribute('data-word') === wWord) { annot = annots[i]; break; }
              }
              if (!annot) return;
              var wRect = word.getBoundingClientRect();
              var aRect = annot.getBoundingClientRect();
              var x1 = wRect.left + wRect.width / 2 - sLeft2;
              var y1 = wRect.bottom - sTop2;
              var aLeft = aRect.left;
              var aRight = aRect.right;
              var pad = 12;
              var x2;
              if (x1 + sLeft2 >= aLeft + pad && x1 + sLeft2 <= aRight - pad) {
                x2 = x1;
              } else if (x1 + sLeft2 < aLeft + pad) {
                x2 = aLeft + pad - sLeft2;
              } else {
                x2 = aRight - pad - sLeft2;
              }
              var y2 = aRect.top - sTop2;
              var color = rowColors[wpData.row % rowColors.length];
              var hDist = Math.abs(x1 - x2);
              if (hDist < 5) {
                lineHTML += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>';
              } else {
                var gap = y2 - y1;
                var midY = y1 + gap * 0.35;
                lineHTML += '<polyline points="' + x1 + ',' + y1 + ' ' + x1 + ',' + midY + ' ' + x2 + ',' + midY + ' ' + x2 + ',' + y2 + '" stroke="' + color + '" stroke-width="1.2" stroke-dasharray="3,2" fill="none" opacity="0.7"/>';
              }
            });
            svg.innerHTML = lineHTML;
            svg.setAttribute('width', sRect2.width);
            svg.setAttribute('height', sRect2.height);
          });
        });
      });
    }
  },
  mounted: function() {
    var self = this;
    self.detectLineBreaks();
    self._resizeHandler = function() {
      self.measuredLines = [];
      self.$nextTick(function() { self.detectLineBreaks(); });
    };
    window.addEventListener('resize', self._resizeHandler);
  },
  beforeDestroy: function() {
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
  },
  watch: {
    showAnnots: function() {
      this.$nextTick(function() { this.drawLines(); });
    }
  }
});

// ------------------------------------------------------------
// 组件 11：设置面板
// ------------------------------------------------------------
app.component('setting-panel', {
  inject: ['store'],
  template: '' +
    '<div class="setp">' +
      '<div class="setp-nav">' +
        '<div ' +
          'class="setp-item" ' +
          ':class="{ on: store.settingsTab === \'goal\' }" ' +
          '@click="store.settingsTab = \'goal\'">' +
          '🎯 目标设定' +
        '</div>' +
        '<div ' +
          'class="setp-item" ' +
          ':class="{ on: store.settingsTab === \'model\' }" ' +
          '@click="store.settingsTab = \'model\'">' +
          '🤖 AI 模型' +
        '</div>' +
        '<div ' +
          'class="setp-item" ' +
          ':class="{ on: store.settingsTab === \'tts\' }" ' +
          '@click="store.settingsTab = \'tts\'">' +
          '🔊 语音设置' +
        '</div>' +
      '</div>' +
      '<div class="setp-body">' +
        // 目标设定
        '<div v-if="store.settingsTab === \'goal\'" class="setp-sec">' +
          '<div class="setp-title">学习目标</div>' +
          '<div class="setp-desc">用你自己的话描述你想达到什么样的语言水平。AI 会分析你的目标，拆解成具体的学习建议。</div>' +
          '<div class="setp-goal-input">' +
            '<textarea ' +
              'v-model="store.goalText" ' +
              'placeholder="例如：想去日本旅游，能看懂菜单和路牌，能简单交流…" ' +
              'rows="4"></textarea>' +
            '<button class="setp-analyze" @click="analyzeGoal">AI 分析目标</button>' +
          '</div>' +
          '<div class="setp-goal-result">' +
            '<div class="setp-goal-header">' +
              '<span class="setp-goal-icon">✨</span>' +
              '<span>AI 分析结果</span>' +
            '</div>' +
            '<div class="setp-goal-items">' +
              '<div class="setp-goal-item" v-for="(g, i) in store.goalAnalysis" :key="i">' +
                '<span class="setp-goal-label">{{ g.label }}</span>' +
                '<span class="setp-goal-value">{{ g.value }}</span>' +
              '</div>' +
            '</div>' +
            '<div class="setp-goal-tip">' +
              '💡 你也可以在 <b>AI 助手</b> 中直接说"帮我修改学习目标"来调整这些设定。' +
            '</div>' +
          '</div>' +
        '</div>' +
        // AI 模型
        '<div v-if="store.settingsTab === \'model\'" class="setp-sec">' +
          '<div class="setp-title">AI 模型</div>' +
          '<div class="setp-field">' +
            '<label>对话模型</label>' +
            '<div class="setp-radios">' +
              '<label><input type="radio" name="m" checked> GPT-4o（推荐）</label>' +
              '<label><input type="radio" name="m"> Claude 3.5</label>' +
              '<label><input type="radio" name="m"> DeepSeek</label>' +
            '</div>' +
          '</div>' +
          '<div class="setp-stats">' +
            '<div class="ss"><div class="ss-n">127</div><div class="ss-l">本月调用</div></div>' +
            '<div class="ss"><div class="ss-n">¥0.83</div><div class="ss-l">预估费用</div></div>' +
            '<div class="ss"><div class="ss-n">34%</div><div class="ss-l">缓存命中</div></div>' +
          '</div>' +
        '</div>' +
        // 语音设置
        '<div v-if="store.settingsTab === \'tts\'" class="setp-sec">' +
          '<div class="setp-title">语音设置</div>' +
          '<div class="setp-field">' +
            '<label>发音引擎</label>' +
            '<select>' +
              '<option>系统默认</option>' +
              '<option>Google TTS</option>' +
              '<option>Azure TTS</option>' +
            '</select>' +
          '</div>' +
          '<div class="setp-field">' +
            '<label>语速</label>' +
            '<div class="setp-range">' +
              '<input type="range" min="0.5" max="2" step="0.1" value="1">' +
              '<span>1.0x</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
});

// ------------------------------------------------------------
// 挂载应用
// ------------------------------------------------------------
app.mount('#app');
