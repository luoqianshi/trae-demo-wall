/* =========================================================================
 * 「知行」App 本体 Demo —— ZX_AI 伪 ReAct 取材大脑（zx-ai.js）
 * -------------------------------------------------------------------------
 * 职责：统一各处 AI mock 输出，让林"显得懂"——从 ZX_MOCK.notes 真实标题/数字取材，
 *       输出前先一句伪 ReAct（"我看了 @《X》，对比了…，所以…"）。
 * 三能力：
 *   · reply(intent, ctx)        → 贴合上下文的一句回复（替代旧 mockAiReply 随机池）
 *   · cowrite(ctx)              → {mode, ins, del?} 鎏金差异续写（替代旧 COWRITE 池）
 *   · dispatch(agentId, query)  → {query, duration, resultCount, items:[真实标题]}
 * 设计依据：mock 数据本就主题一致（固态电池/界面阻抗主线），取材法免费显得懂。
 * 约束：纯 JS / IIFE；不接真 LLM；零依赖（仅依赖 window.ZX_MOCK）
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 取材源 ----------------------------- */

  function mock() { return window.ZX_MOCK || { notes: [] }; }

  /* 关键词权重表：intent → 关注词集合（用于给笔记打分） */
  var KW = {
    impedance: ['阻抗', '界面', 'EIS', '四电极', '两电极', 'LiNbO', '涂层', '中间层'],
    sulfide:   ['硫化物', 'Li6PS5Cl', 'Li₆PS₅Cl', '电导率', '电解质', '硫化'],
    oxide:     ['氧化物', 'LLZO', '石榴石'],
    measure:   ['测量', '方法', '高估', '可信', '复测', '样本', 'n=', '可重复'],
    debate:    ['争议', '反对', '质疑', '沈砚', '江月', '反方', '讨论'],
    industry:  ['宁德', '路线', '中试', '量产', '产业', 'QuantumScape', '范式'],
    method:    ['费曼', '学习', '方法论', '复习'],
    sei:       ['SEI', '负极', '枝晶']
  };

  /* 真实数字池（按 intent 挑一个嵌入回复，显得有据） */
  var NUMS = {
    impedance: ['约 10×', '约一个数量级', '10⁻³ S/cm'],
    sulfide:   ['10⁻³ S/cm', 'Li₆PS₅Cl'],
    measure:   ['n=12', 'n≥30', '四电极体系'],
    debate:    ['n=12', '72 小时'],
    industry:  ['350 Wh/kg', '500 次循环', '2026 中试']
  };

  function escapeRe(s) { return String(s == null ? '' : s); }

  /* 把任意文本归一化为关键词命中集合 */
  function hitsIn(text, words) {
    text = String(text || '');
    var hit = [];
    for (var i = 0; i < words.length; i++) { if (text.indexOf(words[i]) >= 0) hit.push(words[i]); }
    return hit;
  }

  /* 给一条笔记打分：title×3 / tags×2 / summary×1 */
  function scoreNote(note, words) {
    var s = 0;
    s += hitsIn(note.title, words).length * 3;
    s += hitsIn((note.tags || []).join(' '), words).length * 2;
    s += hitsIn(note.summary, words).length * 1;
    return s;
  }

  /* 取相关度最高的前 n 条笔记 */
  function topNotes(words, n) {
    n = n || 5;
    var arr = (mock().notes || []).slice();
    arr.sort(function (a, b) { return scoreNote(b, words) - scoreNote(a, words); });
    var out = [];
    for (var i = 0; i < arr.length && out.length < n; i++) {
      if (scoreNote(arr[i], words) > 0) out.push({ title: arr[i].title, summary: arr[i].summary, tags: arr[i].tags || [] });
    }
    return out;
  }

  /* 取材但保证非空：score 全 0 时退化为前 n 条（让 AI 永远"有话可说"） */
  function topNotesFallback(words, n) {
    var rel = topNotes(words, n);
    if (rel.length) return rel;
    return (mock().notes || []).slice(0, n).map(function (x) { return { title: x.title, summary: x.summary, tags: x.tags || [] }; });
  }

  function pickNum(intent) {
    var pool = NUMS[intent] || NUMS.impedance;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* 由文本片段推断 intent（关键词命中优先级） */
  function inferIntent(text) {
    text = String(text || '');
    if (hitsIn(text, KW.impedance).length) return 'impedance';
    if (hitsIn(text, KW.debate).length) return 'debate';
    if (hitsIn(text, KW.measure).length) return 'measure';
    if (hitsIn(text, KW.industry).length) return 'industry';
    if (hitsIn(text, KW.sulfide).length) return 'sulfide';
    if (hitsIn(text, KW.method).length) return 'method';
    if (hitsIn(text, KW.sei).length) return 'sei';
    return 'general';
  }

  /* 把 intent/文本映射为关注词集合 */
  function kwForIntent(intent, text) {
    var words = [];
    if (KW[intent]) words = words.concat(KW[intent]);
    /* 再从文本里补捞任意已知词 */
    for (var k in KW) { if (KW.hasOwnProperty(k)) words = words.concat(hitsIn(text, KW[k])); }
    return dedupe(words);
  }

  /* 子智能体 → 关注词倾向 */
  function kwForAgent(agentId, query) {
    if (agentId === 'research') return dedupe((KW.debate || []).concat(KW.measure || []).concat(hitsIn(query, KW.impedance)));
    if (agentId === 'reader')   return dedupe((KW.impedance || []).concat(KW.sulfide || []).concat(hitsIn(query, KW.impedance)));
    if (agentId === 'summary')  return dedupe((KW.sulfide || []).concat(KW.impedance || []).concat(hitsIn(query, KW.industry)));
    /* search 默认全词 */
    var all = [];
    for (var k in KW) { if (KW.hasOwnProperty(k)) all = all.concat(KW[k]); }
    return dedupe(all.concat(hitsIn(query, all)));
  }

  function dedupe(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) { if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); } }
    return out;
  }

  /* ----------------------------- 伪 ReAct 前缀 ----------------------------- */

  function reactPrefix(rel) {
    if (!rel || !rel.length) return '';
    var a = '@《' + rel[0].title + '》';
    var b = rel[1] ? '，对比了 @《' + rel[1].title + '》' : '';
    return '我看了 ' + a + b + '，';
  }

  /* ----------------------------- 主题截取（用于"这段"指代） ----------------------------- */

  function shortTopic(ctx) {
    var t = (ctx && (ctx.selText || ctx.paragraph || ctx.query)) || '';
    t = String(t).replace(/\s+/g, '').slice(0, 12);
    return t || '这段';
  }

  /* ----------------------------- 能力 1：reply ----------------------------- */

  function reply(intent, ctx) {
    ctx = ctx || {};
    if (intent === 'suggest') return suggestLine(ctx);
    if (intent === 'conflict') return conflictLine(ctx);
    var realIntent = (intent === 'general' || !KW[intent]) ? inferIntent(ctx.selText || ctx.paragraph || ctx.query || '') : intent;
    var kw = kwForIntent(realIntent, ctx.selText || ctx.paragraph || ctx.query || '');
    var rel = topNotesFallback(kw, 2);
    return reactPrefix(rel) + conclusion(realIntent, rel, ctx);
  }

  /* 结论模板：把真实标题/数字嵌进去（取材法核心） */
  function conclusion(intent, rel, ctx) {
    var t0 = (rel[0] && rel[0].title) || '相关笔记';
    var t1 = (rel[1] && rel[1].title) || '';
    var topic = shortTopic(ctx);
    var num = pickNum(intent);
    if (intent === 'impedance') {
      return '关于「' + topic + '」，' + (t1 ? t0 + ' 与 ' + t1 + ' 都指向' : t0 + ' 指出') + '测量方法是关键——四电极体系下 LiNbO₃ 涂层可降界面阻抗 ' + num + '，两电极会高估。要我标「高可信」吗？';
    }
    if (intent === 'summarize' || intent === 'summary') {
      return '已从 ' + t0 + (t1 ? ' 和 ' + t1 : '') + ' 抽取要点，挂在你的「固态电池」主线下，要看看吗？';
    }
    if (intent === 'counter') {
      return '有一个反例值得注意：' + t0 + ' 指出长循环下本体阻抗才是决定因素，样本 ' + num + ' 偏小。要不要列成待验证项？';
    }
    if (intent === 'debate' || intent === 'measure') {
      return t0 + ' 里提到 ' + num + ' 的样本，结论方向可信但量级待复核，建议复测到 n≥30 再下定论。';
    }
    if (intent === 'industry') {
      return '产业侧看，' + t0 + ' 给出的 ' + num + ' 是当前第一梯队的指标。要我帮你梳理路线图吗？';
    }
    if (intent === 'sulfide') {
      return t0 + ' 指出硫化物电解质室温电导率达 ' + num + '，是当前全固态路线的有力候选。要展开它的优缺点吗？';
    }
    return '我看了一下，' + t0 + (t1 ? ' 与 ' + t1 : '') + ' 和「' + topic + '」相关，要我展开吗？';
  }

  /* 姿态1 旁观：短建议（不带前缀，更轻） */
  function suggestLine(ctx) {
    var p = ctx && ctx.paragraph ? ctx.paragraph : '';
    var intent = inferIntent(p);
    var rel = topNotesFallback(kwForIntent(intent, p), 1);
    var t = rel[0] ? rel[0].title : '你的笔记';
    if (intent === 'impedance') return '这段可以补一个四电极的数据吗？我在 @《' + t + '》里见过。';
    if (intent === 'measure') return '这个数字要不要标来源？我能帮你溯源到 @《' + t + '》。';
    if (intent === 'debate') return '这里似乎有争议，要让明辨（研究）帮你找反例吗？';
    if (intent === 'industry') return '要不要补一段产业视角？@《' + t + '》有路线图。';
    if (intent === 'sulfide') return '这段可以和 @《' + t + '》加双链吗？';
    if (p.length < 20) return '这段有点短，要不要展开一个具体数据？';
    return '要不要在这里补一个例子，让论点更有说服力？';
  }

  /* 矛盾检测：对比 selText 与 pageText，给三态判定 */
  function conflictLine(ctx) {
    var sel = (ctx && ctx.selText) || '';
    var page = (ctx && ctx.pageText) || '';
    var numSel = (sel.match(/n\s*=\s*\d+|\d+×|\d+ ?Wh\/kg|\d+ ?S\/cm/) || [''])[0];
    var numPage = (page.match(/n\s*=\s*\d+|\d+×|\d+ ?Wh\/kg|\d+ ?S\/cm/) || [''])[0];
    var rel = topNotesFallback(kwForIntent('impedance', sel + page), 1);
    var t = rel[0] ? rel[0].title : '原文';
    /* 简易三态：两侧数字不同 → 冲突；都含数字且相同 → 一致；否则 → 待验证 */
    if (numSel && numPage && numSel !== numPage) {
      return '冲突：原文是 ' + numPage + '，你写的是 ' + numSel + '。建议以 @《' + t + '》的四电极数据为准。';
    }
    if (numSel && numPage && numSel === numPage) {
      return '一致：两侧都给 ' + numSel + '，与 @《' + t + '》吻合。';
    }
    return '待验证：两侧都没有明确数字，建议补一个 n≥30 的复测结论。';
  }

  /* ----------------------------- 能力 2：cowrite ----------------------------- */

  function cowrite(ctx) {
    ctx = ctx || {};
    var mode = ctx.mode === 'rewrite' ? 'rewrite' : 'expand';
    var p = ctx.paragraph || '';
    var intent = inferIntent(p);
    var rel = topNotesFallback(kwForIntent(intent, p), 1);
    var t = rel[0] ? rel[0].title : '相关研究';
    var num = pickNum(intent);
    if (mode === 'rewrite') {
      return {
        mode: 'rewrite',
        del: p.slice(0, 18) || '这段表述',
        ins: (intent === 'impedance' ? '界面阻抗是决定全固态电池循环寿命的关键因素，其量级高度依赖测量方法' :
              intent === 'sulfide' ? '硫化物电解质具备高室温电导率（' + num + '级），是当前全固态路线的有力候选' :
              '这一论点在 @《' + t + '》中有数据支撑，可表述得更精确')
      };
    }
    return {
      mode: 'expand',
      ins: (intent === 'impedance' ? '具体而言，' + t + ' 指出四电极体系下 LiNbO₃ 涂层可降界面阻抗 ' + num + '；但两电极测量会高估，需在结论里标注测量方法。' :
            intent === 'sulfide' ? '补充一点：Li₆PS₅Cl 室温电导率可达 ' + num + '，与液态电解液相当，这是它最具吸引力的特性。' :
            '展开来说，@《' + t + '》的相关数据可以佐证这段；建议把数字与来源一并标上，便于后续核对。')
    };
  }

  /* ----------------------------- 能力 3：dispatch ----------------------------- */

  function dispatch(agentId, query) {
    agentId = agentId || 'search';
    var kw = kwForAgent(agentId, query);
    var rel = topNotesFallback(kw, 5);
    var items = rel.map(function (n) { return n.title; });
    /* duration 伪随机 1~5s，resultCount 与 items 数挂钩 */
    var duration = (1 + Math.random() * 4).toFixed(1) + 's';
    return {
      query: String(query || '').replace(/^(帮我|请|麻烦)?(查一下|查询|搜索|查找|查|找一下|找|总结一下|归纳一下|总结|归纳|研究一下|调研一下|深入研究|研究|调研|读一下|陪读|读)/, '').trim() || query || '',
      duration: duration,
      resultCount: items.length || 1,
      items: items
    };
  }

  /* ----------------------------- 能力 4：composeBlocks（块树编排 delta） -----------------------------
   * 输入：{intent, anchorSpec, anchorText, newType}
   *   · intent：'wrap' | 'rearrange' | 'restyle' | 'suggest' | 'compose'
   *   · anchorSpec：被选中的块或当前 spec（编辑器侧按 intent 计算后传入）
   *   · anchorText：选中文本/关键词（可选；restyle 据此推断 newType）
   *   · newType：restyle 显式指定类型（callout/cols/grid，优先于 anchorText 推断）
   * 输出：{intent, ops:[...], preview, undo:fn}
   *   · undo 为占位桩（实际撤销由编辑器用 spec 快照还原，见 SubTask 4.3）
   * mock 逻辑基于电池主题，与既有 reply/cowrite 风格一致（取材真实笔记标题/数字）。
   * -------------------------------------------------------------------------------------------- */
  var _cbSeq = 0;
  function _cbId(p) { return (p || 'ai') + '-blk' + (++_cbSeq); }

  function _aiText(text, aiCo) {
    return { id: _cbId('txt'), type: 'text', text: text == null ? '' : String(text), aiCo: aiCo !== false };
  }

  /* 从 spec 收集可重排的直接子块 id（section.children 或 cols 各列） */
  function _collectChildIds(spec) {
    if (!spec) return [];
    if (spec.children) return spec.children.map(function (c) { return c.id; }).filter(Boolean);
    if (spec.cols) {
      var ids = [];
      (spec.cols).forEach(function (col) { (col || []).forEach(function (c) { if (c.id) ids.push(c.id); }); });
      return ids;
    }
    return [];
  }

  function inferRestype(text) {
    text = String(text || '');
    if (/双栏|对比|并列|cols|两栏|栏/.test(text)) return 'cols';
    if (/网格|田字|grid|宫格|四宫/.test(text)) return 'grid';
    return 'callout';
  }

  function restypeLabel(t) {
    return ({ callout: '证据卡', cols: '双栏', grid: '网格' })[t] || t;
  }

  function composeBlocks(opts) {
    opts = opts || {};
    var intent = opts.intent || 'wrap';
    var anchor = opts.anchorSpec || {};
    var anchorText = String(opts.anchorText || '');
    var ai = topNotesFallback(KW.impedance || [], 1);
    var topic = (ai[0] && ai[0].title) || '界面阻抗';
    var num = pickNum('impedance');

    /* wrap：把 target 块包进 callout（含 ✦ 的强调容器） */
    if (intent === 'wrap') {
      var targetId = anchor.id || 'blk';
      var title = /✦/.test(anchorText) ? '✦ 核心论点' : '✦ 证据卡';
      var wrapWith = { id: _cbId('co'), type: 'callout', title: title, children: [] };
      return {
        intent: 'wrap',
        ops: [{ op: 'wrap', targetId: targetId, wrapWith: wrapWith }],
        preview: '把这块套进鎏金证据卡（callout），强调它在「' + topic + '」论证里的分量。',
        undo: function () {}
      };
    }

    /* rearrange：把一组子块拆成左右双栏 cols（前一半左栏，后一半右栏） */
    if (intent === 'rearrange') {
      var moveIds = _collectChildIds(anchor).slice();
      if (!moveIds.length && anchor.id) moveIds = [anchor.id];
      var newParent = { id: _cbId('cols'), type: 'cols', cols: [[], []] };
      return {
        intent: 'rearrange',
        ops: [{ op: 'rearrange', newParent: newParent, moveIds: moveIds, anchorId: anchor.id || moveIds[0] }],
        preview: '把这一节的子块拆成左右双栏，方便并列对比「论点」与「证据」（' + num + ' 量级对照）。',
        undo: function () {}
      };
    }

    /* restyle：改 target 块的 type（newType 优先，否则按 anchorText 关键词推断） */
    if (intent === 'restyle') {
      var newType = opts.newType || inferRestype(anchorText);
      return {
        intent: 'restyle',
        ops: [{ op: 'restyle', targetId: anchor.id || 'blk', newType: newType }],
        preview: '把这块的布局换成「' + restypeLabel(newType) + '」，换一种表达形式。',
        undo: function () {}
      };
    }

    /* suggest：返回 1-2 个推荐布局块（对比卡 / 时间线） */
    if (intent === 'suggest') {
      var suggestBlocks = [];
      /* 推荐一：对比卡（正反方两栏） */
      suggestBlocks.push({
        id: _cbId('co'), type: 'callout', title: '✦ 对比卡：界面阻抗',
        children: [
          _aiText('<p><b>正方</b>：LiNbO₃ 涂层在四电极体系下降界面阻抗 ' + num + '，数据见 @《' + topic + '》。</p>'),
          _aiText('<p><b>反方</b>：两电极测量可能高估该结论，需 n≥30 复测后再下定论。</p>')
        ]
      });
      /* 推荐二：时间线（关键词命中"路线/演进/时间/产业"时加） */
      if (/路线|演进|时间|产业|timeline/i.test(anchorText)) {
        suggestBlocks.push({
          id: _cbId('grid'), type: 'grid',
          children: [
            _aiText('<p><b>2024</b>　硫化物电导率达 10⁻³ S/cm</p>'),
            _aiText('<p><b>2025</b>　LiNbO₃ 涂层进入中试验证</p>'),
            _aiText('<p><b>2026</b>　350 Wh/kg 目标量级</p>'),
            _aiText('<p><b>后续</b>　复测 n≥30 后锁定路线</p>')
          ]
        });
      }
      return {
        intent: 'suggest',
        ops: [{ op: 'suggest', anchorId: anchor.id, suggestBlocks: suggestBlocks }],
        preview: '林建议补 ' + suggestBlocks.length + ' 个布局块：对比卡梳理正反论据' + (suggestBlocks.length > 1 ? '，时间线看技术演进' : '') + '。',
        undo: function () {}
      };
    }

    /* compose：生成一棵新的 section 块树（对比页：标题 + 双栏 + 结论卡） */
    if (intent === 'compose') {
      var newSpec = {
        id: _cbId('sec'), type: 'section',
        children: [
          _aiText('<h2>✦ 全固态电池界面阻抗 · 对比页</h2>'),
          {
            id: _cbId('cols'), type: 'cols',
            cols: [
              [_aiText('<p><b>硫化物路线</b><br>Li₆PS₅Cl 室温电导率 ' + num + '，对金属锂界面稳定性差。</p>')],
              [_aiText('<p><b>氧化物路线</b><br>LLZO 石榴石界面稳定，但电导率低约一个数量级。</p>')]
            ]
          },
          {
            id: _cbId('co'), type: 'callout', title: '✦ 结论',
            children: [_aiText('<p>测量方法决定结论可信度：四电极体系下硫化物 + 涂层是当前第一梯队，两电极数据需复核（见 @《' + topic + '》）。</p>')]
          }
        ]
      };
      return {
        intent: 'compose',
        ops: [{ op: 'compose', newSpec: newSpec }],
        preview: '林生成了一棵对比页块树：标题 + 左右双栏路线对比 + 结论证据卡。',
        undo: function () {}
      };
    }

    /* 兜底 */
    return { intent: intent, ops: [], preview: '林暂时没有可执行的编排。', undo: function () {} };
  }

  /* ----------------------------- 导出 ----------------------------- */
  window.ZX_AI = {
    reply: reply,
    cowrite: cowrite,
    dispatch: dispatch,
    /* Task 4.1：块树编排 delta 生成器 */
    composeBlocks: composeBlocks,
    inferRestype: inferRestype,
    /* 暴露给 dispatch helper / 编辑器复用 */
    inferIntent: inferIntent,
    suggestLine: suggestLine,
    conflictLine: conflictLine,
    _topNotes: topNotes,
    _topNotesFallback: topNotesFallback,
    _kwForAgent: kwForAgent
  };
})();
