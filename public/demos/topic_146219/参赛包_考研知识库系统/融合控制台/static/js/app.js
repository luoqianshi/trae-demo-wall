/**
 * 考研知识库系统 · 融合控制台
 * 纯前端单页应用，预置demo数据，localStorage持久化
 */
(function () {
  'use strict';

  // ===================== 预置demo数据 =====================

  const KNOWLEDGE_TREE = [
    {
      name: '00_总览与计划', icon: '📋', children: [
        { name: '考研科目与分值', file: 'subjects' },
        { name: '学习路线图（管综199）', file: 'roadmap-note' },
        { name: '每日SOP', file: 'sop' }
      ]
    },
    {
      name: '01_英二', icon: '🔤', children: [
        { name: '主语从句拆解', file: 'eng-subject-clause' },
        { name: '阅读长难句技巧', file: 'eng-reading' }
      ]
    },
    {
      name: '02_管综', icon: '📐', children: [
        { name: '假言命题推理', file: 'logic-hypo' },
        { name: '选言命题推理', file: 'logic-disj' },
        { name: '数学公式表（基础期）', file: 'math-formula' }
      ]
    },
    {
      name: '03_图情专业课', icon: '📚', children: [
        { name: '查准率与查全率', file: 'pandr' }
      ]
    },
    {
      name: '04_真题错题', icon: '❌', children: [
        { name: '管综逻辑错题集（示例）', file: 'wrong-logic' }
      ]
    },
    {
      name: '05_模板库', icon: '📝', children: [
        { name: '论效文框架模板', file: 'writing-template' }
      ]
    },
    {
      name: '06_错题本', icon: '❌', children: [
        { name: '全部错题', file: 'wrong-all' }
      ]
    },
    {
      name: '07_我的导入', icon: '📥', children: [] }
  ];

  const NOTES = {
    'subjects': {
      title: '考研科目与分值',
      meta: '总览 · 2026-07-12',
      html: `
        <h5>英语二（满分100）</h5>
        <ul>
          <li>完形填空 10分（10题）</li>
          <li>阅读理解 40分（4篇20题）</li>
          <li>新题型 10分</li>
          <li>翻译 15分</li>
          <li>小作文 10分</li>
          <li>大作文 15分</li>
        </ul>
        <h5>管综199（满分200）</h5>
        <ul>
          <li>数学 75分（问题求解15题 + 条件充分性判断10题）</li>
          <li>逻辑 60分（30题）</li>
          <li>写作 65分（论证有效性分析30分 + 论说文35分）</li>
        </ul>
      `
    },
    'roadmap-note': {
      title: '学习路线图（管综199）',
      meta: '总览 · 2026-07-12',
      html: `
        <h5>四阶段计划</h5>
        <ul>
          <li><strong>基础期（7-8月）</strong>：数学公式+逻辑基础+写作框架，不留空白</li>
          <li><strong>强化期（9-10月）</strong>：分科刷题+真题起步，会做题</li>
          <li><strong>冲刺期（11月）</strong>：套卷提速+错题复盘，稳分</li>
          <li><strong>模考期（12月）</strong>：全真模拟+查漏补缺，适应考场节奏</li>
        </ul>
        <p>每日闭环：学→理→存→卡，碎片时间不浪费。</p>
      `
    },
    'sop': {
      title: '每日对话沉淀 SOP',
      meta: '总览 · v2.1',
      html: `
        <h5>四步闭环</h5>
        <ol>
          <li><strong>学</strong>：跟AI对话搞懂知识点，基础期重"懂"，强化期重"对"</li>
          <li><strong>理</strong>：AI自动整理"3要点+1自测"结构化输出</li>
          <li><strong>存</strong>：存入知识库对应分类，别堆桌面</li>
          <li><strong>卡</strong>：抽关键点做Anki卡片，手机上刷</li>
        </ol>
        <h5>每天时间分配（基础期）</h5>
        <ul>
          <li>学：约1.5小时</li>
          <li>理：约0.3小时</li>
          <li>存：约0.2小时</li>
          <li>卡：约0.4小时</li>
          <li>合计约2.4小时</li>
        </ul>
      `
    },
    'eng-subject-clause': {
      title: '英二·主语从句拆解',
      meta: '英二 · 阅读',
      html: `
        <h5>句型结构</h5>
        <p><code>What makes X difficult is that Y</code></p>
        <ul>
          <li>What makes X difficult 整体是<strong>主语从句</strong>，当名词用</li>
          <li>is that... 是系表结构，that后解释"难在哪"</li>
          <li>翻译口诀：「让X困难的事，是Y」</li>
        </ul>
        <h5>示例</h5>
        <p><code>What surprised me was that he passed.</code></p>
        <ul>
          <li>主语从句：What surprised me</li>
          <li>表语从句：that he passed</li>
        </ul>
      `
    },
    'eng-reading': {
      title: '英二·阅读长难句技巧',
      meta: '英二 · 阅读',
      html: `
        <h5>三步拆解法</h5>
        <ol>
          <li><strong>抓主干</strong>：先找主谓宾，从句暂时跳过</li>
          <li><strong>理从句</strong>：定语从句找先行词，状语从句看逻辑关系</li>
          <li><strong>串意思</strong>：把主干和从句的意思串起来</li>
        </ol>
        <p>关键：别一上来就逐字翻译，先看整体框架。</p>
      `
    },
    'logic-hypo': {
      title: '管综逻辑·假言命题推理',
      meta: '管综 · 逻辑',
      html: `
        <h5>核心规则</h5>
        <p><code>p→q</code> 等价于逆否 <code>¬q→¬p</code>，这是唯一稳的。</p>
        <h5>类比理解</h5>
        <p>把 p→q 想成"下雨→地湿"：</p>
        <ul>
          <li>地没湿(¬q) ⇒ 一定没下雨(¬p)，<strong>逆否成立</strong></li>
          <li>地湿了(q)推不出下雨了(p)，可能有人洒水，<strong>肯定后件无效</strong></li>
          <li>没下雨(¬p)推不出地没湿(¬q)，<strong>否定前件无效</strong></li>
        </ul>
        <div class="note-meta">真题警惕：条件充分性判断常把"肯定后件"当陷阱。</div>
      `
    },
    'logic-disj': {
      title: '管综逻辑·选言命题推理',
      meta: '管综 · 逻辑',
      html: `
        <h5>核心规则</h5>
        <p>选言命题 <code>p∨q</code>（p或q）：否定一个必须肯定另一个。</p>
        <h5>类比理解</h5>
        <p>"要么甲来，要么乙来"，已知甲没来 ⇒ 乙一定来。</p>
        <ul>
          <li>否定肯定式：¬p ∴ q（有效）</li>
          <li>肯定否定式：p ∴ ¬q（<strong>仅在不相容选言时有效</strong>）</li>
        </ul>
        <div class="note-meta">区分"或者"（相容）和"要么...要么..."（不相容）是关键。</div>
      `
    },
    'math-formula': {
      title: '管综数学·基础公式表',
      meta: '管综 · 数学',
      html: `
        <h5>算术</h5>
        <ul>
          <li>比例：a:b = c:d ⇒ ad = bc</li>
          <li>百分比：增长率 = (现-原)/原 × 100%</li>
        </ul>
        <h5>代数</h5>
        <ul>
          <li>(a+b)² = a² + 2ab + b²</li>
          <li>(a-b)² = a² - 2ab + b²</li>
          <li>(a+b)(a-b) = a² - b²</li>
          <li>一元二次方程 ax²+bx+c=0 ⇒ x = (-b±√(b²-4ac))/2a</li>
        </ul>
        <h5>几何</h5>
        <ul>
          <li>圆面积 = πr²，周长 = 2πr</li>
          <li>三角形面积 = ½×底×高</li>
        </ul>
      `
    },
    'pandr': {
      title: '图情·查准率与查全率',
      meta: '图情 · 信息检索',
      html: `
        <h5>定义</h5>
        <ul>
          <li><strong>查准率 Precision</strong>：搜出来的里多少是对的 = 相关命中/总命中</li>
          <li><strong>查全率 Recall</strong>：该找的里找到多少 = 相关命中/全部相关</li>
        </ul>
        <h5>类比</h5>
        <p>P = 捞上来的鱼里几条你要的；R = 池塘里所有目标鱼你捞了几条。</p>
        <h5>P-R权衡</h5>
        <p>二者常此消彼长：捞多易混（准降），只捞精的易漏（全降）。F值是综合指标。</p>
        <h5>算例</h5>
        <p>库有100篇相关，系统返50篇其中40相关：P = 40/50 = 80%，R = 40/100 = 40%</p>
      `
    },
    'wrong-logic': {
      title: '管综逻辑错题集（示例）',
      meta: '真题错题',
      html: `
        <h5>错题1：假言命题肯定后件</h5>
        <p>题干：如果下雨则地湿，已知地湿，能否推出下雨？</p>
        <p><strong>错因</strong>：我选了"能"。实际上肯定后件无效，地湿可能是洒水。</p>
        <p><strong>正解</strong>：不能。只有逆否 ¬q→¬p 是100%成立的。</p>
      `
    },
    'writing-template': {
      title: '论效文框架模板',
      meta: '模板库 · 写作',
      html: `
        <h5>论证有效性分析四段式</h5>
        <ol>
          <li><strong>开头</strong>：概括原文论证，表明"存在若干逻辑漏洞"</li>
          <li><strong>找谬误</strong>：挑3-4个主要逻辑错误逐一分析</li>
          <li><strong>分析</strong>：每个谬误用"前提...推不出结论...因为..."</li>
          <li><strong>总结</strong>：回扣开头，总结论证不成立</li>
        </ol>
        <p>常见谬误：以偏概全、因果倒置、偷换概念、不当类比、数字陷阱。</p>
      `
    }
  };

  const ANKI_CARDS = [
    { front: 'p→q 的逆否等价式是？', back: '¬q→¬p，这是唯一百分百成立的' },
    { front: 'p→q 已知¬q，推出？', back: '¬p（逆否，唯一稳的推理）' },
    { front: '查准率 Precision 公式？', back: 'P = 相关命中/总命中（捞上来的里多少对）' },
    { front: '查全率 Recall 公式？', back: 'R = 相关命中/全部相关（目标鱼捞了几条）' },
    { front: 'What makes X difficult is that... 主干？', back: '主语从句(What..)+is+表语从句(that..)，译「让X困难的事，是Y」' },
    { front: '基础期每日闭环四步？', back: '学→理→存→卡' },
    { front: '选言命题¬p∴q是？', back: '否定肯定式，有效' },
    { front: '管综满分多少？各科分值？', back: '200分：数学75+逻辑60+写作65' }
  ];

  const STAGES = [
    {
      key: 'base', name: '基础期（7-8月）', color: 'active', percent: 30,
      goal: '数学公式+逻辑基础+写作框架，不留空白',
      tasks: ['过一遍核心公式', '形式逻辑入门', '论效文框架抄写3篇'],
      resources: '公式手册+基础课+形式逻辑入门'
    },
    {
      key: 'strengthen', name: '强化期（9-10月）', color: 'pending', percent: 0,
      goal: '分科刷题+真题起步，会做题',
      tasks: ['数学分题型刷题', '逻辑真题分类', '写作每周练1篇'],
      resources: '历年真题+分科习题册'
    },
    {
      key: 'sprint', name: '冲刺期（11月）', color: 'pending', percent: 0,
      goal: '套卷提速+错题复盘，稳分',
      tasks: ['每周2套管综卷', '作文模板定稿', '错题二刷'],
      resources: '模拟卷+错题本'
    },
    {
      key: 'mock', name: '模考期（12月）', color: 'pending', percent: 0,
      goal: '全真模拟+查漏补缺，适应考场节奏',
      tasks: ['3次全真模考', '只复习不加新卡', '调整作息'],
      resources: '近3年真题+押题卷'
    }
  ];

  const CHAT_TOPICS = {
    '假言命题': {
      tag: 'logic', tagName: '逻辑',
      keywords: ['假言', 'p→q', '逆否', '下雨', '地湿', '蕴含'],
      response: `
        <p>假言命题推理规则用大白话讲，记三句话：</p>
        <div class="key-point"><strong>要点1：</strong>把 p→q 想成"下雨→地湿"。地没湿(¬q)⇒一定没下雨(¬p)，这叫<strong>逆否</strong>，百分百成立。</div>
        <div class="key-point"><strong>要点2：</strong>"地湿了(q)"推不出"下雨了(p)"，可能有人洒水——<strong>肯定后件无效</strong>。</div>
        <div class="key-point"><strong>要点3：</strong>"没下雨(¬p)"也推不出"地没湿(¬q)"——<strong>否定前件无效</strong>。只有逆否这一招稳。</div>
        <div class="quiz-box">
          <div class="quiz-question">🧪 自测题：</div>
          <p>若"张三开会→李四必到"，已知李四没到，能推出什么？</p>
          <div class="quiz-options" data-answer="b">
            <div class="quiz-option" data-value="a">A. 张三开了会</div>
            <div class="quiz-option" data-value="b">B. 张三没开会</div>
            <div class="quiz-option" data-value="c">C. 李四迟到了</div>
          </div>
        </div>
      `,
      cards: [
        { front: 'p→q 时已知¬q，推出？', back: '¬p（逆否¬q→¬p，唯一稳的推理）' },
        { front: '肯定后件（已知q）能推出p吗？', back: '不能。地湿不一定是下雨，可能有人洒水。' }
      ],
      kbTarget: 'logic-hypo'
    },
    '选言命题': {
      tag: 'logic', tagName: '逻辑',
      keywords: ['选言', '或者', '要么', '∨', '或'],
      response: `
        <p>选言命题就是"或"关系，核心记住一招：</p>
        <div class="key-point"><strong>要点1：</strong>选言命题 p∨q（p或q），<strong>否定一个必须肯定另一个</strong>。"甲乙至少来一个"，甲没来⇒乙一定来。</div>
        <div class="key-point"><strong>要点2：</strong>区分"或者"（相容选言，p和q可以同时成立）和"要么...要么..."（不相容，只能有一个成立）。</div>
        <div class="key-point"><strong>要点3：</strong>相容选言只有"否定肯定式"有效；不相容选言"肯定否定式"也有效。</div>
        <div class="quiz-box">
          <div class="quiz-question">🧪 自测题：</div>
          <p>"要么甲去，要么乙去"，已知甲去了，能推出？</p>
          <div class="quiz-options" data-answer="b">
            <div class="quiz-option" data-value="a">A. 乙也去了</div>
            <div class="quiz-option" data-value="b">B. 乙没去</div>
            <div class="quiz-option" data-value="c">C. 无法判断</div>
          </div>
        </div>
      `,
      cards: [
        { front: '选言命题p∨q，已知¬p，推出？', back: 'q（否定肯定式，有效）' },
        { front: '"或者A或者B"已知A成立，能推出¬B吗？', back: '不能。"或者"是相容的，A和B可以同时成立。' }
      ],
      kbTarget: 'logic-disj'
    },
    '主语从句': {
      tag: 'english', tagName: '英二',
      keywords: ['主语从句', 'what makes', '长难句', '从句', 'grammar'],
      response: `
        <p>英二阅读里经常卡人的主语从句，拆解方法：</p>
        <div class="key-point"><strong>要点1：</strong>What makes X difficult 整体是<strong>主语从句</strong>，当一个大名词用，意思是"让X变难的东西"。</div>
        <div class="key-point"><strong>要点2：</strong>is that... 是系表结构，that后面解释"难在哪"。</div>
        <div class="key-point"><strong>要点3：</strong>翻译口诀——先抓主干 A is B（什么是什么），再填从句内容。译法：「让X困难的事，是Y」。</div>
        <div class="quiz-box">
          <div class="quiz-question">🧪 自测题：</div>
          <p>"What surprised me was that he passed." 中主语从句是什么？</p>
          <div class="quiz-options" data-answer="a">
            <div class="quiz-option" data-value="a">A. What surprised me</div>
            <div class="quiz-option" data-value="b">B. that he passed</div>
            <div class="quiz-option" data-value="c">C. was that</div>
          </div>
        </div>
      `,
      cards: [
        { front: 'What makes X difficult is that Y 主干？', back: '主语从句(What..)+is+表语从句(that..)，译「让X困难的事，是Y」' }
      ],
      kbTarget: 'eng-subject-clause'
    },
    '阅读技巧': {
      tag: 'english', tagName: '英二',
      keywords: ['阅读', '长难句', '阅读理解', 'reading', '拆句'],
      response: `
        <p>英二阅读长难句，三步拆解法：</p>
        <div class="key-point"><strong>要点1：抓主干</strong>——先找主谓宾，从句暂时跳过不看，搞清楚谁做了什么。</div>
        <div class="key-point"><strong>要点2：理从句</strong>——定语从句找先行词（修饰谁），状语从句看逻辑关系（原因/转折/条件）。</div>
        <div class="key-point"><strong>要点3：串意思</strong>——把主干和从句串起来翻译，别逐字硬翻。</div>
        <div class="quiz-box">
          <div class="quiz-question">🧪 自测题：</div>
          <p>遇到长难句第一步应该做什么？</p>
          <div class="quiz-options" data-answer="b">
            <div class="quiz-option" data-value="a">A. 逐字翻译每个词</div>
            <div class="quiz-option" data-value="b">B. 找主谓宾抓主干</div>
            <div class="quiz-option" data-value="c">C. 直接跳过看选项</div>
          </div>
        </div>
      `,
      cards: [
        { front: '长难句拆解三步法？', back: '①抓主干(主谓宾) ②理从句(定从找先行词/状从看逻辑) ③串意思' }
      ],
      kbTarget: 'eng-reading'
    },
    '数学公式': {
      tag: 'math', tagName: '数学',
      keywords: ['数学', '公式', '代数', '方程', '平方', '几何'],
      response: `
        <p>管综数学基础期必背公式，先记这几个：</p>
        <div class="key-point"><strong>要点1：乘法公式</strong>——(a+b)²=a²+2ab+b²；(a-b)²=a²-2ab+b²；(a+b)(a-b)=a²-b²</div>
        <div class="key-point"><strong>要点2：一元二次方程</strong>——ax²+bx+c=0 的解是 x=(-b±√(b²-4ac))/2a，判别式Δ=b²-4ac决定根的个数。</div>
        <div class="key-point"><strong>要点3：几何基础</strong>——圆面积πr²/周长2πr；三角形面积½×底×高；勾股定理a²+b²=c²。</div>
        <div class="quiz-box">
          <div class="quiz-question">🧪 自测题：</div>
          <p>(a+b)(a-b) 等于？</p>
          <div class="quiz-options" data-answer="c">
            <div class="quiz-option" data-value="a">A. a²+2ab+b²</div>
            <div class="quiz-option" data-value="b">B. a²-b²+2ab</div>
            <div class="quiz-option" data-value="c">C. a²-b²</div>
          </div>
        </div>
      `,
      cards: [
        { front: '(a+b)(a-b) = ?', back: 'a²-b²（平方差公式）' },
        { front: '一元二次方程求根公式？', back: 'x = (-b±√(b²-4ac))/2a' }
      ],
      kbTarget: 'math-formula'
    },
    '查准查全': {
      tag: 'math', tagName: '图情',
      keywords: ['查准率', '查全率', 'precision', 'recall', 'P', 'R', '检索'],
      response: `
        <p>信息检索里最常考的P和R，用捞鱼来记：</p>
        <div class="key-point"><strong>要点1（查准率P）：</strong>捞上来的鱼里几条是你要的 = 相关命中/总命中。"准不准"。</div>
        <div class="key-point"><strong>要点2（查全率R）：</strong>池塘里所有目标鱼你捞了几条 = 相关命中/全部相关。"全不全"。</div>
        <div class="key-point"><strong>要点3（P-R权衡）：</strong>放宽条件⇒R升P降（捞多了坏鱼也来）；收紧条件⇒P升R降（捞精了漏鱼）。</div>
        <div class="quiz-box">
          <div class="quiz-question">🧪 自测题：</div>
          <p>库里有100篇相关，系统返50篇其中40篇相关，P和R各多少？</p>
          <div class="quiz-options" data-answer="a">
            <div class="quiz-option" data-value="a">A. P=80%, R=40%</div>
            <div class="quiz-option" data-value="b">B. P=40%, R=80%</div>
            <div class="quiz-option" data-value="c">C. P=50%, R=50%</div>
          </div>
        </div>
      `,
      cards: [
        { front: '查准率P公式？', back: 'P = 相关命中/总命中（捞上来的里多少对）' },
        { front: '查全率R公式？', back: 'R = 相关命中/全部相关（目标鱼捞了几条）' }
      ],
      kbTarget: 'pandr'
    }
  };

  const QUICK_TOPIC_LIST = [
    { id: '假言命题', tag: 'logic', tagName: '逻辑', desc: 'p→q逆否推理，下雨地湿类比' },
    { id: '选言命题', tag: 'logic', tagName: '逻辑', desc: '或者/要么，否定肯定式' },
    { id: '主语从句', tag: 'english', tagName: '英二', desc: 'What makes...is that...拆解' },
    { id: '阅读技巧', tag: 'english', tagName: '英二', desc: '长难句三步拆解法' },
    { id: '数学公式', tag: 'math', tagName: '数学', desc: '基础期必背乘法/方程/几何' },
    { id: '查准查全', tag: 'math', tagName: '图情', desc: 'Precision和Recall捞鱼类比' }
  ];

  // ===================== 状态管理 =====================

  const STORAGE_KEY = 'kaoyan_dashboard_state';

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {
      checkinDates: [],
      stageProgress: { base: 30, strengthen: 0, sprint: 0, mock: 0 },
      notesCount: Object.keys(NOTES).length,
      cardsCount: ANKI_CARDS.length,
      lastCheckin: null,
      importNotes: [],
      masteredWrongs: []
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  const state = loadState();
  let currentParseResult = null;

  // 恢复历史导入的笔记到 NOTES 和知识树
  function restoreImportedNotes() {
    if (!state.importNotes || state.importNotes.length === 0) return;
    const importFolder = KNOWLEDGE_TREE.find(f => f.name === '07_我的导入');
    state.importNotes.forEach(item => {
      if (!NOTES[item.key]) {
        NOTES[item.key] = item.note;
        if (importFolder) {
          importFolder.children.push({ name: item.note.title, file: item.key });
        }
      }
    });
  }
  restoreImportedNotes();

  function getStreak() {
    if (state.checkinDates.length === 0) return 0;
    const sorted = [...state.checkinDates].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const expected = new Date(new Date(sorted[i - 1]).getTime() - 86400000).toISOString().slice(0, 10);
      if (sorted[i] === expected) streak++;
      else break;
    }
    return streak;
  }

  function isCheckedInToday() {
    const today = new Date().toISOString().slice(0, 10);
    return state.checkinDates.includes(today);
  }

  // ===================== DOM工具 =====================

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function showToast(msg, type) {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '凌晨了还在学，注意身体';
    if (h < 9) return '早，通勤路上刷两道题？';
    if (h < 12) return '上午好，今天的进度推了吗？';
    if (h < 14) return '午休时间，搞懂一个知识点？';
    if (h < 18) return '下午好，摸鱼也能背两个单词';
    if (h < 22) return '晚上好，该整理今天的笔记了';
    return '夜深了，学完这题就睡吧';
  }

  // ===================== 页面路由 =====================

  function switchPage(pageName) {
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === pageName));

    const current = $('.page.active');
    const next = $('#page-' + pageName);

    if (current && current !== next) {
      current.classList.remove('active');
    }

    if (next) {
      next.classList.remove('active');
      void next.offsetWidth; // 强制重绘，确保 animation 重新触发
      next.classList.add('active');
    }
  }

  function initNav() {
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        switchPage(item.dataset.page);
      });
    });
  }

  // ===================== 仪表盘 =====================

  function animateNumber(el, target, duration) {
    const start = performance.now();
    const from = 0;
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(from + (target - from) * ease);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function renderDashboard() {
    $('#greeting').textContent = getGreeting();
    $('#streak-count').textContent = getStreak();
    animateNumber($('#stat-notes'), state.notesCount, 600);
    animateNumber($('#stat-cards'), state.cardsCount, 600);
    animateNumber($('#stat-wrongs'), getWrongCount(), 600);
    $('#stat-checkin').textContent = isCheckedInToday() ? '已打卡 ✓' : '未打卡';

    const stageList = $('#stage-list');
    stageList.innerHTML = '';
    STAGES.forEach(stage => {
      const pct = state.stageProgress[stage.key] || stage.percent;
      const div = document.createElement('div');
      div.className = 'stage-item';
      div.innerHTML = `
        <div class="stage-header">
          <span class="stage-name">${stage.name}</span>
          <span class="stage-percent">${pct}%</span>
        </div>
        <div class="stage-bar">
          <div class="stage-fill ${pct >= 100 ? 'done' : stage.key === 'base' ? 'active' : 'pending'}" style="width:${pct}%"></div>
        </div>
      `;
      stageList.appendChild(div);
    });

    const randomTopic = QUICK_TOPIC_LIST[Math.floor(Math.random() * QUICK_TOPIC_LIST.length)];
    $('#recommend-topic').innerHTML = `
      <div class="recommend-topic-name">${randomTopic.desc}</div>
      <div class="recommend-topic-desc">分类：${randomTopic.tagName} · 点右侧直接开始学习</div>
    `;
    $('#btn-go-topic').onclick = () => {
      switchPage('chat');
      setTimeout(() => triggerTopic(randomTopic.id), 200);
    };

    $('#btn-start-learning').onclick = () => switchPage('chat');

    const checkinBtn = $('#btn-checkin');
    const checkinMsg = $('#checkin-msg');
    if (isCheckedInToday()) {
      checkinBtn.disabled = true;
      const todayShort = new Date().toISOString().slice(5, 10).replace('-', '/');
      checkinBtn.textContent = `✅ 已打卡 · ${todayShort}`;
      checkinBtn.classList.add('btn-checkin-done');
      checkinMsg.textContent = '明天继续！';
    } else {
      checkinBtn.disabled = false;
      checkinBtn.textContent = '📝 今日打卡';
      checkinBtn.classList.remove('btn-checkin-done');
      checkinMsg.textContent = '';
      checkinBtn.onclick = doCheckin;
    }
  }

  function doCheckin() {
    const today = new Date().toISOString().slice(0, 10);
    if (!state.checkinDates.includes(today)) {
      state.checkinDates.push(today);
      state.lastCheckin = today;
      saveState();
    }
    const checkinBtn = $('#btn-checkin');
    if (checkinBtn) {
      checkinBtn.classList.add('btn-celebrate');
      setTimeout(() => {
        checkinBtn.classList.remove('btn-celebrate');
        renderDashboard();
      }, 500);
    } else {
      renderDashboard();
    }
    showToast('🎉 打卡成功！连续' + getStreak() + '天，继续保持！');
  }

  function getWrongCount() {
    return Object.keys(NOTES).filter(k => NOTES[k].isWrong && !isWrongMastered(k)).length;
  }

  function isWrongMastered(key) {
    return state.masteredWrongs && state.masteredWrongs.includes(key);
  }

  function toggleWrongMastered(key) {
    if (!state.masteredWrongs) state.masteredWrongs = [];
    const idx = state.masteredWrongs.indexOf(key);
    if (idx >= 0) {
      state.masteredWrongs.splice(idx, 1);
    } else {
      state.masteredWrongs.push(key);
    }
    saveState();
    renderWrongList();
    renderDashboard();
  }

  // ===================== 导入资料 =====================

  function initImportEvents() {
    $('#btn-parse').onclick = startParse;
    $('#btn-save-import').onclick = saveImportResult;
    $('#btn-goto-browse').onclick = () => {
      switchPage('browse');
      renderFolderTree();
    };
  }

  function startParse() {
    const name = $('#import-name').value.trim();
    const text = $('#import-text').value.trim();
    if (!name || !text) {
      showToast('请填写资料名称和原文内容', 'error');
      return;
    }

    $('#import-form').style.display = 'none';
    $('#import-progress').style.display = 'block';
    $('#import-result').style.display = 'none';

    const steps = ['正在分词…', '正在向量化…', '正在提取知识点…', '正在识别错题…', '整理完成'];
    const fill = $('#progress-fill');
    fill.classList.remove('animating');
    fill.style.width = '0%';

    // 强制重绘后启动 CSS animation，确保 headless 下也能播放
    void fill.offsetWidth;
    fill.classList.add('animating');

    let stepIndex = 0;
    $('#progress-step').textContent = steps[0];
    $('#progress-percent').textContent = '0%';

    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        $('#progress-step').textContent = steps[stepIndex];
        $('#progress-percent').textContent = Math.min(stepIndex * 22, 100) + '%';
      }
    }, 280);

    setTimeout(() => {
      clearInterval(stepInterval);
      $('#progress-percent').textContent = '100%';
      $('#progress-step').textContent = steps[steps.length - 1];
      setTimeout(() => showParseResult(name, text), 200);
    }, 1500);
  }

  function showParseResult(name, text) {
    const items = parseMaterial(name, text);
    currentParseResult = items;

    $('#import-progress').style.display = 'none';
    $('#import-result').style.display = 'block';

    const notesCount = items.filter(i => !i.isWrong).length;
    const wrongsCount = items.filter(i => i.isWrong).length;
    $('#result-notes-count').textContent = notesCount;
    $('#result-wrongs-count').textContent = wrongsCount;

    const preview = $('#result-preview');
    preview.innerHTML = items.slice(0, 4).map((item, i) => `
      <div class="preview-item ${item.isWrong ? 'preview-wrong' : 'preview-note'}">
        <span class="preview-tag">${item.isWrong ? '❌ 错题' : '📄 知识点'}</span>
        <p>${item.title}</p>
      </div>
    `).join('') + (items.length > 4 ? `<p class="preview-more">还有 ${items.length - 4} 条…</p>` : '');
  }

  function parseMaterial(name, text) {
    const segments = text.split(/\n\s*\n|\n{2,}/).filter(s => s.trim().length > 0);
    const items = [];
    segments.forEach((seg, i) => {
      const trimmed = seg.trim();
      if (trimmed.length < 5) return;
      const isWrong = /错|错误|不对|没懂|误|错题|做错了/.test(trimmed);
      const title = trimmed.split(/\n|。/)[0].slice(0, 36) + (trimmed.split(/\n|。/)[0].length > 36 ? '…' : '');
      const content = trimmed.replace(/\n/g, '<br>');
      items.push({
        index: i,
        title: title || `第 ${i + 1} 条笔记`,
        content: content,
        isWrong: isWrong,
        source: name,
        meta: `导入 · ${name} · ${new Date().toLocaleDateString('zh-CN')}`
      });
    });
    return items;
  }

  function saveImportResult() {
    if (!currentParseResult || currentParseResult.length === 0) return;

    const importFolder = KNOWLEDGE_TREE.find(f => f.name === '07_我的导入');
    const wrongFolder = KNOWLEDGE_TREE.find(f => f.name === '06_错题本');
    const ts = Date.now();

    currentParseResult.forEach((item, i) => {
      const key = `import-${ts}-${i}`;
      const note = {
        title: item.title,
        meta: item.meta,
        html: `
          <p>${item.content}</p>
          <p style="margin-top:14px;color:var(--ink-lighter);font-size:13px;">来源：${item.source}</p>
        `,
        isWrong: item.isWrong,
        source: item.source
      };
      NOTES[key] = note;
      state.importNotes.push({ key: key, note: note });

      if (importFolder) {
        importFolder.children.push({ name: item.title, file: key });
      }
      if (item.isWrong && wrongFolder && !wrongFolder.children.find(c => c.file === key)) {
        wrongFolder.children.push({ name: item.title, file: key });
      }
    });

    const savedCount = currentParseResult.length;
    state.notesCount = Object.keys(NOTES).length;
    saveState();
    renderDashboard();
    renderFolderTree();

    $('#import-form').style.display = 'block';
    $('#import-progress').style.display = 'none';
    $('#import-result').style.display = 'none';
    $('#import-name').value = '';
    $('#import-text').value = '';
    currentParseResult = null;

    showToast(`📥 已导入 ${savedCount} 条笔记到知识库`);
  }

  // ===================== 对话学习 =====================

  let currentTopic = null;
  let currentCardIndex = 0;
  let currentCards = [];

  function renderQuickTopics() {
    const container = $('#quick-topics');
    container.innerHTML = '';
    QUICK_TOPIC_LIST.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'quick-topic';
      btn.innerHTML = `${t.desc} <span class="topic-tag ${t.tag}">${t.tagName}</span>`;
      btn.onclick = () => triggerTopic(t.id);
      container.appendChild(btn);
    });
  }

  function triggerTopic(topicId) {
    const topic = CHAT_TOPICS[topicId];
    if (!topic) return;
    currentTopic = topicId;
    addUserMessage(`讲讲"${topicId}"`);
    setTimeout(() => {
      addAiMessage(topic.response);
      bindQuizOptions();
      $('#chat-action-area').style.display = 'block';
      $('#btn-save-kb').disabled = false;
      $('#btn-make-card').disabled = false;
      $('#action-feedback').innerHTML = '';
    }, 500);
    scrollChat();
  }

  function addUserMessage(text) {
    const container = $('#chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg msg-user';
    div.innerHTML = `
      <div class="msg-avatar">👤</div>
      <div class="msg-bubble"><p>${text}</p></div>
    `;
    container.appendChild(div);
  }

  function addAiMessage(html) {
    const container = $('#chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg msg-ai';
    div.innerHTML = `
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble">${html}</div>
    `;
    container.appendChild(div);
    scrollChat();
  }

  function scrollChat() {
    const container = $('#chat-messages');
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
  }

  function bindQuizOptions() {
    $$('.quiz-option').forEach(opt => {
      opt.style.pointerEvents = 'auto';
      opt.onclick = () => {
        const parent = opt.closest('.quiz-options');
        const answer = parent.dataset.answer;
        const val = opt.dataset.value;
        parent.querySelectorAll('.quiz-option').forEach(o => {
          o.style.pointerEvents = 'none';
          if (o.dataset.value === answer) o.classList.add('correct');
        });
        if (val !== answer) {
          opt.classList.add('wrong');
          addAiMessage('<p>❌ 不太对哦。<strong>正确答案是' + answer.toUpperCase() + '</strong>。再看看要点，记住逆否规则才是唯一稳的。</p>');
        } else {
          addAiMessage('<p>✅ 回答正确！你已经掌握这个知识点了。可以点下方按钮存入知识库，或生成Anki卡复习。</p>');
        }
      };
    });
  }

  function handleSend() {
    const input = $('#chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);

    // 关键词匹配
    let matched = null;
    for (const [name, topic] of Object.entries(CHAT_TOPICS)) {
      for (const kw of topic.keywords) {
        if (text.includes(kw)) {
          matched = name;
          break;
        }
      }
      if (matched) break;
    }

    setTimeout(() => {
      if (matched) {
        const topic = CHAT_TOPICS[matched];
        currentTopic = matched;
        addAiMessage(topic.response);
        bindQuizOptions();
        $('#chat-action-area').style.display = 'block';
        $('#btn-save-kb').disabled = false;
        $('#btn-make-card').disabled = false;
        $('#action-feedback').innerHTML = '';
      } else {
        addAiMessage(`
          <p>这个我暂时没准备好，但你可以试试上方快捷按钮里的考点，或者输入这些关键词：</p>
          <p style="font-size:13px;color:#94a3b8;">假言命题、选言命题、主语从句、阅读技巧、数学公式、查准查全</p>
        `);
      }
      scrollChat();
    }, 500);
  }

  function saveToKB() {
    if (!currentTopic) return;
    const topic = CHAT_TOPICS[currentTopic];
    state.notesCount = Math.max(state.notesCount, Object.keys(NOTES).length);
    saveState();
    $('#action-feedback').innerHTML = '✅ 已存入知识库 → ' + (NOTES[topic.kbTarget] ? NOTES[topic.kbTarget].title : currentTopic);
    $('#btn-save-kb').disabled = true;
    showToast('📁 笔记已存入知识库');
    renderDashboard();
  }

  function makeCards() {
    if (!currentTopic) return;
    const topic = CHAT_TOPICS[currentTopic];
    currentCards = topic.cards || [];
    if (currentCards.length === 0) {
      currentCards = [{ front: currentTopic + ' 核心要点', back: '请回顾对话中的3个要点' }];
    }
    currentCardIndex = 0;
    showCardModal();
    $('#btn-make-card').disabled = true;
    state.cardsCount = ANKI_CARDS.length + currentCards.length;
    saveState();
    renderDashboard();
  }

  function showCardModal() {
    const modal = $('#card-modal');
    modal.style.display = 'flex';
    updateCardDisplay();
  }

  function updateCardDisplay() {
    const card = currentCards[currentCardIndex];
    $('#card-front').textContent = card.front;
    $('#card-back').textContent = card.back;
    $('#card-counter').textContent = (currentCardIndex + 1) + ' / ' + currentCards.length;
    $('.flip-card').classList.remove('flipped');
  }

  function initChatEvents() {
    $('#btn-send').onclick = handleSend;
    $('#chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSend();
    });
    $('#btn-save-kb').onclick = saveToKB;
    $('#btn-make-card').onclick = makeCards;

    $('#btn-card-close').onclick = () => { $('#card-modal').style.display = 'none'; };
    $('#btn-card-prev').onclick = () => {
      if (currentCardIndex > 0) { currentCardIndex--; updateCardDisplay(); }
    };
    $('#btn-card-next').onclick = () => {
      if (currentCardIndex < currentCards.length - 1) { currentCardIndex++; updateCardDisplay(); }
    };
    $('#flip-card').onclick = () => {
      $('.flip-card').classList.toggle('flipped');
    };
    $('#card-modal').addEventListener('click', e => {
      if (e.target === $('#card-modal')) $('#card-modal').style.display = 'none';
    });
  }

  // ===================== 知识库浏览 =====================

  let currentBrowseTab = 'notes';

  function renderFolderTree() {
    const container = $('#folder-tree');
    container.innerHTML = '';
    KNOWLEDGE_TREE.forEach(folder => {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'folder-item';
      folderDiv.innerHTML = `<span class="folder-icon">${folder.icon}</span><span>${folder.name}</span>`;
      container.appendChild(folderDiv);

      if (folder.children && folder.children.length > 0) {
        const childDiv = document.createElement('div');
        childDiv.className = 'folder-children';
        folder.children.forEach(file => {
          const fileDiv = document.createElement('div');
          fileDiv.className = 'file-item';
          fileDiv.innerHTML = `<span>📄</span><span>${file.name}</span>`;
          fileDiv.onclick = () => openNote(file.file, fileDiv);
          childDiv.appendChild(fileDiv);
        });
        container.appendChild(childDiv);

        folderDiv.onclick = (e) => {
          e.stopPropagation();
          childDiv.style.display = childDiv.style.display === 'none' ? 'block' : 'none';
        };
      }
    });
  }

  function openNote(fileKey, el) {
    $$('.file-item').forEach(f => f.classList.remove('active'));
    if (el) el.classList.add('active');
    const note = NOTES[fileKey];
    if (!note) return;
    const content = $('#browse-content');
    content.innerHTML = `
      <div class="note-content">
        <div class="note-meta">${note.meta}</div>
        <h4>${note.title}</h4>
        ${note.html}
      </div>
    `;
  }

  function renderCardList() {
    const container = $('#card-list');
    container.innerHTML = '';
    const allCards = [...ANKI_CARDS];
    if (currentTopic && CHAT_TOPICS[currentTopic]) {
      CHAT_TOPICS[currentTopic].cards.forEach(c => allCards.push(c));
    }
    allCards.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = 'card-list-item';
      div.textContent = card.front;
      div.onclick = () => {
        currentCards = allCards;
        currentCardIndex = i;
        showCardModal();
      };
      container.appendChild(div);
    });
  }

  function renderWrongList() {
    const container = $('#wrong-list');
    container.innerHTML = '';
    const wrongKeys = Object.keys(NOTES).filter(k => NOTES[k].isWrong);
    if (wrongKeys.length === 0) {
      container.innerHTML = '<p style="padding:12px;color:var(--ink-lighter);font-size:13px;">暂无错题，去导入资料试试看</p>';
      return;
    }
    wrongKeys.forEach((key, i) => {
      const note = NOTES[key];
      const mastered = isWrongMastered(key);
      const div = document.createElement('div');
      div.className = 'wrong-list-item' + (mastered ? ' mastered' : '');
      div.innerHTML = `
        <span class="wrong-status">${mastered ? '✅ 已掌握' : '❌ 待复习'}</span>
        <p class="wrong-title">${note.title}</p>
      `;
      div.onclick = () => openWrongDetail(key);
      container.appendChild(div);
    });
  }

  function openWrongDetail(key) {
    $$('.wrong-list-item').forEach(f => f.classList.remove('active'));
    const note = NOTES[key];
    if (!note) return;
    const mastered = isWrongMastered(key);
    const content = $('#browse-content');
    content.innerHTML = `
      <div class="note-content wrong-detail">
        <div class="note-meta">${note.meta}</div>
        <h4>${note.title}</h4>
        <div class="wrong-detail-tag ${mastered ? 'mastered' : 'pending'}">${mastered ? '✅ 已掌握' : '❌ 待复习'}</div>
        ${note.html}
        <div style="margin-top:20px;">
          <button class="btn-primary ${mastered ? 'btn-secondary' : ''}" id="btn-toggle-mastered">${mastered ? '标记为待复习' : '✅ 标记已掌握'}</button>
        </div>
      </div>
    `;
    $('#btn-toggle-mastered').onclick = () => toggleWrongMastered(key);
  }

  function initBrowseEvents() {
    $$('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        $$('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBrowseTab = btn.dataset.browseTab;
        $('#folder-tree').style.display = currentBrowseTab === 'notes' ? 'block' : 'none';
        $('#card-list').style.display = currentBrowseTab === 'cards' ? 'block' : 'none';
        $('#wrong-list').style.display = currentBrowseTab === 'wrongs' ? 'block' : 'none';
        if (currentBrowseTab === 'cards') {
          renderCardList();
          $('#browse-content').innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">🃏</div>
              <p>点左侧卡片查看正面/背面</p>
            </div>
          `;
        } else if (currentBrowseTab === 'wrongs') {
          renderWrongList();
          $('#browse-content').innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">❌</div>
              <p>点左侧错题查看详情并标记掌握状态</p>
            </div>
          `;
        } else {
          $('#browse-content').innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">📖</div>
              <p>点左侧目录查看笔记内容</p>
            </div>
          `;
        }
      };
    });
  }

  // ===================== 路线图 =====================

  let currentStageIndex = 0;

  function renderRoadmapTabs() {
    const tabs = $('#roadmap-tabs');
    tabs.innerHTML = '';
    STAGES.forEach((stage, i) => {
      const btn = document.createElement('button');
      btn.className = 'roadmap-tab' + (i === currentStageIndex ? ' active' : '');
      btn.textContent = stage.name;
      btn.onclick = () => { currentStageIndex = i; renderRoadmapTabs(); renderRoadmapDetail(); };
      tabs.appendChild(btn);
    });
  }

  function renderRoadmapDetail() {
    const stage = STAGES[currentStageIndex];
    const detail = $('#roadmap-detail');
    const pct = state.stageProgress[stage.key] || stage.percent;

    let flowHtml = '<div class="roadmap-flow">';
    STAGES.forEach((s, i) => {
      flowHtml += `<div class="flow-step ${i === currentStageIndex ? 'current' : ''}">${s.name.split('（')[0]}</div>`;
      if (i < STAGES.length - 1) flowHtml += '<span class="flow-arrow">→</span>';
    });
    flowHtml += '</div>';

    let tasksHtml = '<ul>';
    stage.tasks.forEach(t => { tasksHtml += `<li>${t}</li>`; });
    tasksHtml += '</ul>';

    detail.innerHTML = `
      <h3>${stage.name}</h3>
      ${flowHtml}
      <h4>🎯 目标</h4>
      <p>${stage.goal}</p>
      <div style="margin:16px 0;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-light);margin-bottom:6px;">
          <span>完成进度</span><span>${pct}%</span>
        </div>
        <div class="stage-bar"><div class="stage-fill ${pct >= 100 ? 'done' : currentStageIndex === 0 ? 'active' : 'pending'}" style="width:${pct}%"></div></div>
      </div>
      <h4>📝 知识作业</h4>
      ${tasksHtml}
      <h4>📚 推荐资源</h4>
      <p>${stage.resources}</p>
      <div style="margin-top:20px;display:flex;gap:10px;">
        <button class="btn-primary" id="btn-mark-stage">标记此阶段完成</button>
        <button class="btn-secondary" id="btn-back-dash">← 返回仪表盘</button>
      </div>
    `;

    $('#btn-mark-stage').onclick = () => {
      state.stageProgress[stage.key] = 100;
      saveState();
      renderRoadmapDetail();
      renderDashboard();
      showToast('🎉 ' + stage.name + ' 已完成！');
    };
    $('#btn-back-dash').onclick = () => switchPage('dashboard');
  }

  // ===================== 初始化 =====================

  function init() {
    initNav();
    renderDashboard();
    renderQuickTopics();
    initChatEvents();
    initImportEvents();
    renderFolderTree();
    initBrowseEvents();
    renderRoadmapTabs();
    renderRoadmapDetail();

    // 作品介绍页进入控制台按钮
    const enterBtn = document.getElementById('btn-enter-console');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => switchPage('dashboard'));
    }

    // 路由默认显示作品介绍页
    switchPage('intro');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
