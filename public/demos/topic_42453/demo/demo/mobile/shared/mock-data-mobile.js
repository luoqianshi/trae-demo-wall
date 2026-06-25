/* =========================================================================
 * 「知行」移动端 Demo —— Mobile 专属 Mock 数据层
 * -------------------------------------------------------------------------
 * 与 demo/shared/mock-data.js 数据结构完全兼容（同样的全局挂载方式、字段名），
 * 但内容去学术化、生活向、更多元：保留 3 篇电池主题笔记 + 8 篇生活向笔记。
 * 挂载方式：
 *   <script src="../shared/mock-data-mobile.js"></script>
 *   window.ZX_MOCK                          —— 全量数据（旧式引用）
 *   window.ZX = window.ZX || {};            —— 与 icons.js 共用 ZX 命名空间
 *   window.ZX.mock                          —— 同一份引用
 * 说明：mobile 不使用知识图谱（graph），故本文件不含 graph 字段。
 * 所有 noteId / userId 在 notes / debates / dailyPicks.targetNoteId /
 * feed.* 中严格一致。
 * =======================================================================*/

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
   * users —— 12 位用户（ID 与 demo 版完全一致，人设去精英化、更多元）
   * 字段：id / name / initials / avatarColor / authority（0-100 权威分）
   *       / domain（领域）/ bio（一句话）
   *       / followers（粉丝数）/ following（关注数）/ likes（获赞总数）
   *       / tags（个人标签 2-4 个）
   * avatarColor 取自 design-tokens.css 的墨韵色系
   * -------------------------------------------------------------------- */
  var users = [
    {
      id: 'u-me', name: '我', initials: '我',
      avatarColor: '#1D5B7A', authority: 45, domain: '生活/学习',
      bio: '大三在读，喜欢折腾各种感兴趣的事，最近在备战考研。',
      followers: 128, following: 89, likes: 56,
      tags: ['大学生', '好奇宝宝', '考研党']
    },
    {
      id: 'u-linzw', name: '林知微', initials: '林',
      avatarColor: '#C1272D', authority: 90, domain: '材料学',
      bio: '材料学博士在读，坚持用大白话写电池笔记，偶尔焦虑但绝不躺平。',
      followers: 45200, following: 312, likes: 128900,
      tags: ['材料学', '硬核科普', '博士日常']
    },
    {
      id: 'u-chenmb', name: '陈墨白', initials: '陈',
      avatarColor: '#1D5B7A', authority: 72, domain: '科研/生活',
      bio: '一只混在实验室的研究猿，下班只想回家做饭撸猫。',
      followers: 3420, following: 568, likes: 23100,
      tags: ['科研民工', '做饭', '猫奴']
    },
    {
      id: 'u-suqing', name: '苏青', initials: '苏',
      avatarColor: '#C7A24A', authority: 68, domain: '电池工程/职场',
      bio: '电池厂工程师，十年产线经验，也想聊聊打工人的钱怎么管。',
      followers: 8970, following: 402, likes: 45600,
      tags: ['工程师', '打工人', '理财新手']
    },
    {
      id: 'u-zhouye', name: '周野', initials: '周',
      avatarColor: '#3E8DB0', authority: 62, domain: '科普创作',
      bio: '全职科普 UP 主，把硬核知识翻译成人话，话痨本痨。',
      followers: 102400, following: 234, likes: 458200,
      tags: ['科普UP主', '十万粉', '话痨']
    },
    {
      id: 'u-zhangheng', name: '张衡', initials: '张',
      avatarColor: '#C1272D', authority: 88, domain: '化学/科普',
      bio: '大学化学老师，讲课爱跑题聊哲学和科学史，学生又爱又恨。',
      followers: 15600, following: 178, likes: 67300,
      tags: ['大学老师', '哲学爱好者', '科普']
    },
    {
      id: 'u-liqy', name: '李轻语', initials: '李',
      avatarColor: '#E58A8E', authority: 50, domain: '学习/考研',
      bio: '研二在读，考研上岸后开始写学习方法，偶尔也会焦虑到失眠。',
      followers: 5230, following: 689, likes: 18900,
      tags: ['研二', '学习方法', '焦虑青年']
    },
    {
      id: 'u-wangshi', name: '王石', initials: '王',
      avatarColor: '#2A2724', authority: 75, domain: '职场/行业分析',
      bio: '互联网行业分析师，天天看趋势，也想帮年轻人少踩坑。',
      followers: 67800, following: 421, likes: 234500,
      tags: ['职场', '行业分析', '理财']
    },
    {
      id: 'u-shenyan', name: '沈砚', initials: '沈',
      avatarColor: '#1D5B7A', authority: 58, domain: '生活/思考',
      bio: '自由职业者，写字为生，信奉极简生活，喜欢把日子想清楚。',
      followers: 12300, following: 156, likes: 54200,
      tags: ['自由职业', '哲学', '极简生活']
    },
    {
      id: 'u-guci', name: '顾辞', initials: '顾',
      avatarColor: '#6B655C', authority: 70, domain: '认知科学/思维',
      bio: '认知科学背景，沉迷各种思维模型，书架永远比衣柜满。',
      followers: 28900, following: 387, likes: 98700,
      tags: ['认知科学', '思维模型', '阅读']
    },
    {
      id: 'u-hanxing', name: '韩星', initials: '韩',
      avatarColor: '#B4602C', authority: 60, domain: '健身/程序员',
      bio: '白天写代码，晚上举铁，坚信自律才能真正自由。',
      followers: 9450, following: 512, likes: 36800,
      tags: ['健身', '程序员', '自律']
    },
    {
      id: 'u-jiangyue', name: '江月', initials: '江',
      avatarColor: '#3E8DB0', authority: 64, domain: '生活/情感',
      bio: '生活类博主，记录情感与日常，用文字陪更多人走过难捱的日子。',
      followers: 18700, following: 298, likes: 78300,
      tags: ['生活博主', '情感', '旅行']
    }
  ];

  /* -----------------------------------------------------------------------
   * 块树 spec 构建工具 —— 块节点统一形态见 spec.md「块树结构约定」
   * 内容块（叶）：text / image / video / doc / embed-note / embed-block
   * 布局块（非叶）：section / cols / grid / canvas / callout / tabs
   * -------------------------------------------------------------------- */
  var _blkSeq = 0;
  function _blkId() { return 'blk-m' + (++_blkSeq); }
  function _t(text) { return { id: _blkId(), type: 'text', text: text || '' }; }
  function _img(fileId) { return { id: _blkId(), type: 'image', fileId: fileId }; }
  function _video(fileId) { return { id: _blkId(), type: 'video', fileId: fileId }; }
  function _doc(fileId) { return { id: _blkId(), type: 'doc', fileId: fileId }; }
  function _section(children) { return { id: _blkId(), type: 'section', children: children || [] }; }

  /* -----------------------------------------------------------------------
   * portfolios —— 作品集（顶层容器，非文件）
   * -------------------------------------------------------------------- */
  var portfolios = [
    { id: 'p-default', name: '我的作品集', isDefault: true, createdAt: '导入' }
  ];

  /* -----------------------------------------------------------------------
   * notebooks —— 笔记本（笔记物理家，notebookId 唯一归属，非文件）
   * -------------------------------------------------------------------- */
  var notebooks = [
    { id: 'nb-default', name: '随笔', portfolioId: 'p-default', isDefault: true, createdAt: '导入' },
    { id: 'nb-research', name: '固态电池研究', portfolioId: 'p-default', createdAt: '导入' }
  ];

  /* -----------------------------------------------------------------------
   * files —— 文件资产（image/video/doc/audio），作为内容源 A
   * -------------------------------------------------------------------- */
  var files = [
    { id: 'f-img-1', name: '界面阻抗示意图.png', type: 'image', url: 'mock://files/img-1.png', mime: 'image/png' },
    { id: 'f-doc-1', name: '固态电池量产路线图.pdf', type: 'doc', url: 'mock://files/doc-1.pdf', mime: 'application/pdf' }
  ];

  /* -----------------------------------------------------------------------
   * inlineBlocks —— 内联块（现场文字，带 id 可被引用），作为内容源 B
   * -------------------------------------------------------------------- */
  var inlineBlocks = [
    { id: 'ib-1', type: 'text', text: '硫化物电解质本体离子电导率早已不是瓶颈', noteId: 'n-solid-battery-impedance' },
    { id: 'ib-2', type: 'text', text: '3 nm LiNbO₃ 涂层能把界面阻抗从 1200 压到 80 Ω·cm²', noteId: 'n-solid-battery-impedance' }
  ];

  /* -----------------------------------------------------------------------
   * migrateLegacyNote —— 把旧 body/blocks/outline/template 迁移为 spec 块树
   * 规则：doc|dual → body 段落拆 text 块（dual 再包 cols）；canvas → blocks+links 转 canvas 布局；outline → 递归转嵌套 section
   * 保留旧字段做兼容（spec 与旧字段并存，渲染器优先读 spec）
   * -------------------------------------------------------------------- */
  function migrateLegacyNote(note) {
    note = note || {};
    if (note.spec) return note; /* 已迁移 */
    var template = note.template || 'doc';
    var stripTags = function (s) { return String(s).replace(/<[^>]+>/g, ''); };
    var spec;

    if (template === 'doc' || template === 'dual') {
      var rawParas = note.body ? String(note.body).split(/[\n\r]+/).filter(function (p) { return p.trim().length > 0; }) : [];
      var textBlocks = rawParas.map(function (p) { return _t(stripTags(p)); });
      if (template === 'dual') {
        var rightBlocks = (note.links && note.links.length)
          ? note.links.map(function (l) { return (l.fileId || l.id) ? _doc(l.fileId || l.id) : _t(l.title || l.text || ''); })
          : [_t('右侧文档区')];
        spec = { id: _blkId(), type: 'cols', cols: [_section(textBlocks), _section(rightBlocks)] };
      } else {
        spec = _section(textBlocks);
      }
    } else if (template === 'canvas') {
      var cells = [];
      (note.blocks || []).forEach(function (b, i) {
        cells.push({ id: _blkId(), type: 'text', text: b.text || '', x: b.x != null ? b.x : (i % 3) * 220, y: b.y != null ? b.y : Math.floor(i / 3) * 180 });
      });
      (note.links || []).forEach(function (l, i) {
        cells.push({ id: _blkId(), type: 'image', fileId: l.fileId || l.id, x: l.x != null ? l.x : 480, y: l.y != null ? l.y : i * 220 });
      });
      spec = { id: _blkId(), type: 'canvas', children: cells };
    } else if (template === 'outline') {
      var convNode = function (node) {
        if (!node) return null;
        var self = _t(node.text || '');
        if (node.children && node.children.length) {
          var subs = node.children.map(convNode).filter(Boolean);
          return _section([self].concat(subs));
        }
        return self;
      };
      var root = note.outline ? convNode(note.outline) : null;
      spec = root ? (root.type === 'section' ? root : _section([root])) : _section([]);
    } else {
      spec = _section([]);
    }
    note.spec = spec;
    return note;
  }

  /* -----------------------------------------------------------------------
   * notes —— 11 条笔记（3 篇电池主题 + 8 篇生活向）
   * 字段：id / title / authorId / fingerprint（human|cocreate|ai-pdf|ai）
   *       / authority（内容信任分 0-100）/ summary（约 150 字）/ body（3-5 段）
   *       / tags / likes / dislikes / commentCount / sedimentCount
   *       / createdAt（相对时间）/ stream（knowledge|creation|review|discussion）
   *       / featuredPage?（可选）
   * body 用 join('\n') 拼接数组，段落用 <p> 包裹，可含 <strong>。
   * -------------------------------------------------------------------- */
  var notes = [
    /* —— 保留：电池主题 3 篇（ID 不变，debates 引用，内容精简版） —— */
    {
      id: 'n-solid-battery-impedance',
      title: '固态电池界面阻抗的真相：硫化物电解质的瓶颈在哪',
      authorId: 'u-linzw',
      fingerprint: 'human',
      authority: 87,
      summary:
        '硫化物电解质本体离子电导率早已不是瓶颈，真正卡量产的是固-固界面阻抗。一组 3 nm LiNbO₃ 涂层能把界面阻抗从 1200 压到 80 Ω·cm²，但这条路径至今不被所有人买账。这篇是精简版，完整论证看评论区。',
      body: [
        '<p>固态电池被视为下一代储能的“圣杯”，但真正卡住它量产的，不是大多数人想象的电解质本身，而是<strong>固-固界面阻抗</strong>。硫化物电解质的本体离子电导率早已与液态电解液同量级，可一旦它与正极或锂金属负极接触，界面处会形成一层高阻抗副反应层，让整块电池内阻飙升。</p>',
        '<p>最有突破性的工作是：用原位 XPS 直接观察界面元素互扩散，并证明只需 3 nm 的 LiNbO₃ 涂层就能把界面阻抗从 1200 压到 80 Ω·cm²，临界电流密度也随之大幅提升。</p>',
        '<p>但这条路径不被所有人买账。一派把资源压在界面修饰，另一派认为长循环中电解质本体的相分离与机械粉化才是真正的杀手。本文整理这条线索上正反双方最具代表性的论证，让这场争论本身被看见。</p>'
      ].join('\n'),
      tags: ['固态电池', '界面阻抗', '硫化物电解质', 'LiNbO₃ 涂层'],
      likes: 1234,
      dislikes: 89,
      commentCount: 156,
      sedimentCount: 387,
      createdAt: '3 天前',
      stream: 'knowledge',
      featuredPage: 1,
      hasDebate: true
    },
    {
      id: 'n-li-battery-paradigm',
      title: '锂电池范式转移：从液态到固态的 5 年路线图',
      authorId: 'u-suqing',
      fingerprint: 'cocreate',
      authority: 79,
      summary:
        '把过去五年的产线数据连起来看，锂电池正经历一次范式转移。2024 半固态上车，2026 硫化物全固态中试，2028 才是规模化窗口。AI 协助整理 80+ 篇产业报告，路线判断由我本人做出。',
      body: [
        '<p>锂电池过去三十年的范式是“液态电解液 + 石墨负极”，下一代范式是“固态电解质 + 锂金属负极”，理论能量密度可冲 500 Wh/kg，且彻底消除易燃问题。这不是渐进改良，是<strong>范式转移</strong>。</p>',
        '<p>但范式不会一夜发生。把它拆成可观测的节点：2024 年半固态上车，2026 年硫化物全固态进入中试，2028 年才是真正的规模化窗口。每一步对应不同的电解质体系与工艺精度要求。</p>',
        '<p>关键判断：半固态是过渡方案，但这个“过渡”至少持续 5 年。原因是固态电池对界面接触的工艺要求比液态高一个数量级。如果你是投资者，请把“半固态”和“全固态”分开估值——它们不是同一条曲线。</p>'
      ].join('\n'),
      tags: ['锂电池', '固态电池', '半固态', '量产路线'],
      likes: 768,
      dislikes: 134,
      commentCount: 92,
      sedimentCount: 245,
      createdAt: '5 天前',
      stream: 'knowledge',
      featuredPage: 1,
      hasDebate: true
    },
    {
      id: 'n-sulfide-vs-oxide',
      title: '硫化物 vs 氧化物哪个能赢？产线、电导、安全的三方对决',
      authorId: 'u-zhangheng',
      fingerprint: 'human',
      authority: 82,
      summary:
        '硫化物电导率高但怕水，氧化物稳定但烧结难。表面是材料取舍，实质是产业逻辑对决：一方押注氧化物强调“绝对安全”，一方用硫化物加快落地强调“先上车”。本文不试图给结论，只整理双方最硬的论据。',
      body: [
        '<p>硫化物与氧化物，是固态电解质两条最主要的路线，也是过去十年最持久的争论。硫化物离子电导率逼近液态、加工性好，但对空气极其敏感，遇水即释放有毒气体；氧化物化学稳定性优异，但烧结温度高、界面接触差。</p>',
        '<p>表面上看这是材料性能的取舍，实质是两条产业逻辑的对决。一方押注氧化物陶瓷隔膜强调“绝对安全”，另一方用硫化物加快落地强调“先上车再换轮子”。两条路至今没有收敛。</p>',
        '<p>本文不试图给出结论——这条线索的科学共识尚未形成。我整理了双方最具代表性的论据、反驳、再反驳，让读者看到一个真问题的演化过程，而不是被某个阵营带跑。</p>'
      ].join('\n'),
      tags: ['硫化物电解质', '氧化物电解质', '产业路线'],
      likes: 596,
      dislikes: 78,
      commentCount: 184,
      sedimentCount: 168,
      createdAt: '1 周前',
      stream: 'discussion',
      featuredPage: 1,
      hasDebate: true
    },

    /* —— 电池深度向 5 篇（知识星图第三层关联笔记） —— */
    {
      id: 'n-impedance-overestimated',
      title: '界面阻抗是否被高估了？物理学群 72 小时热议',
      authorId: 'u-jiangyue',
      fingerprint: 'human',
      authority: 76,
      summary:
        '江月发了一组复测数据：过去三年顶刊声称“界面阻抗降低 10 倍”的工作，40% 在相同条件下只降了 2-3 倍。群里立刻分成两派，讨论持续 72 小时。',
      body: [
        '<p>本周物理学群里冒出一个尖锐问题：界面阻抗是不是被高估了？起因是我发了一组数据——把过去三年顶刊中所有声称“界面阻抗降低 10 倍”的工作复测，发现其中 40% 在相同条件下只降低了 2-3 倍。</p>',
        '<p>群里立刻分成两派。一派认为这是 EIS 拟合的系统性偏差；另一派指出问题不在测量，而在研究范式本身——大家都盯着界面，是因为界面最容易发文章。</p>'
      ].join('\n'),
      tags: ['界面阻抗', '讨论', '可重复性', 'EIS'],
      likes: 358,
      dislikes: 47,
      commentCount: 129,
      sedimentCount: 89,
      createdAt: '昨天',
      stream: 'discussion'
    },
    {
      id: 'n-2026-solid-mass-production',
      title: '为什么 2026 年是固态电池量产元年——一份产业视角',
      authorId: 'u-wangshi',
      fingerprint: 'ai-pdf',
      authority: 73,
      summary:
        '从 86 页产业报告 PDF 抽取的关键节点：宁德时代 17Ah 良率破 80%、QuantumScape QSE-5 通过车企第三方测试、半固态 2027 年前仍占主流。',
      body: [
        '<p>过去十年，“固态电池量产”被许诺过太多次。但 2026 年这一次，产业侧的信号不太一样：宁德时代 17Ah 良率突破 80%，QuantumScape 的 QSE-5 通过了车企第三方测试。</p>',
        '<p>硫化物路线在中国大陆跑得最快，氧化物路线在北美更稳，半固态是过渡方案，预计 2027 年前仍占主流。</p>'
      ].join('\n'),
      tags: ['固态电池', '产业分析', '量产', '宁德时代'],
      likes: 596,
      dislikes: 78,
      commentCount: 81,
      sedimentCount: 234,
      createdAt: '6 天前',
      stream: 'knowledge'
    },
    {
      id: 'n-solid-vs-liquid-review',
      title: '复习卡片：锂电池 vs 固态电池核心差异',
      authorId: 'u-linzw',
      fingerprint: 'human',
      authority: 85,
      summary:
        '一张为复习设计的对比卡。核心差异不在“固 vs 液”，而在离子传输机制、界面稳定性、可逆性三个根本维度。',
      body: [
        '<p>液态电解液是“流体自适应”——它能浸润任何粗糙的电极表面；固态电解质是“刚性接触”——一旦界面有空隙，阻抗立刻飙升。</p>',
        '<p>记忆口诀：液态靠浸润、固态靠贴合、半固态是折中。下次看到“全固态突破”的新闻，先问：界面真的解决了吗？</p>'
      ].join('\n'),
      tags: ['复习', '锂电池', '固态电池', '对比'],
      likes: 234,
      dislikes: 12,
      commentCount: 18,
      sedimentCount: 156,
      createdAt: '1 周前',
      stream: 'review'
    },
    {
      id: 'n-na-dendrite-review',
      title: '钠电池枝晶：137 篇论文背后的可重复性危机',
      authorId: 'u-liqy',
      fingerprint: 'human',
      authority: 71,
      summary:
        '翻了 137 篇钠枝晶论文，几乎没有一篇文章能稳定复现另一篇的“长循环无枝晶”。这或许不是枝晶的问题，而是电化学循环测试的可重复性危机。',
      body: [
        '<p>钠电池因为钠资源廉价、分布均匀，被视为大规模储能的候选者。但钠金属负极同样面临枝晶问题，且钠更活泼、电导率更低。</p>',
        '<p>结论令人沮丧：137 篇论文的临界电流密度报告值在 0.3 到 3.0 mA/cm² 之间漂移，跨实验室差异比“处理 vs 对照”还大。这或许是电化学循环测试的可重复性危机。</p>'
      ].join('\n'),
      tags: ['钠电池', '钠枝晶', '可重复性', '文献综述'],
      likes: 412,
      dislikes: 23,
      commentCount: 67,
      sedimentCount: 198,
      createdAt: '4 天前',
      stream: 'knowledge'
    },
    {
      id: 'n-sei-explainer',
      title: '三分钟看懂 SEI 膜：电池第一次充电时发生了什么',
      authorId: 'u-zhouye',
      fingerprint: 'ai',
      authority: 68,
      summary:
        'SEI 膜是电池第一次充电时在负极表面“自我牺牲”形成的纳米层，决定寿命、安全和低温性能。理解 SEI，是理解一切电池界面问题的钥匙。',
      body: [
        '<p>SEI 是锂离子电池第一次充电时，电解液在负极表面形成的一层纳米级薄膜，决定了电池的寿命、安全和低温性能。</p>',
        '<p>膜太厚，离子走不动，电池内阻大；膜太薄，电解液会继续分解，电池慢慢“老死”。即使是全固态，固-固界面也会形成类似的钝化层。</p>'
      ].join('\n'),
      tags: ['SEI 膜', '科普', '负极', '界面'],
      likes: 892,
      dislikes: 41,
      commentCount: 53,
      sedimentCount: 412,
      createdAt: '2 天前',
      stream: 'creation'
    },

    /* —— 新增：生活向 8 篇 —— */
    {
      id: 'n-chicken-or-egg-first',
      title: '先有鸡还是先有蛋？一个被吵了千年的问题',
      authorId: 'u-guci',
      fingerprint: 'human',
      authority: 71,
      summary:
        '这问题听起来像抬杠，但认真想下去，它会一路把你带到进化论、到“物种是什么”、到因果的时间方向。我试着把正反两方的最强论据摆出来，结论可能比你想的更颠覆。',
      body: [
        '<p>“先有鸡还是先有蛋”——这大概是人类历史上最古老的抬杠之一。大多数人把它当脑筋急转弯，随便选一边就过去了。但你认真想下去，会发现它其实是一连串硬核问题的入口。</p>',
        '<p>先看演化生物学的答案：<strong>先有蛋</strong>。因为广义上的“蛋”（带壳的羊膜卵）在鸡出现前几亿年就存在了，恐龙就在下蛋。就算只算“孵出鸡的蛋”，第一只真正意义上的鸡，也一定是从一颗“不是鸡的鸟”下的、却因基因突变而孵出鸡的蛋里出来的。</p>',
        '<p>但哲学角度的反驳更有意思：你凭什么认定那颗突变后的蛋“属于鸡的蛋”？物种是连续渐变的，“鸡”这个分类本身是人类事后画的线。把模糊集合当成有明确起点的东西，问题本身就问错了。</p>',
        '<p>所以这问题真正的价值，不在答案，而在它逼你思考：<strong>因果在时间里到底往哪个方向流</strong>。评论区我把双方最强论据都放上了，欢迎来吵。</p>'
      ].join('\n'),
      tags: ['哲学', '科普', '进化论', '思维'],
      likes: 2840,
      dislikes: 102,
      commentCount: 387,
      sedimentCount: 156,
      createdAt: '昨天',
      stream: 'discussion',
      hasDebate: true
    },
    {
      id: 'n-2026-graduate-job-guide',
      title: '2026 大学生就业指南：别再海投简历了',
      authorId: 'u-wangshi',
      fingerprint: 'cocreate',
      authority: 78,
      summary:
        '今年应届生数量再创新高，但海投简历几乎是最低效的找工作的方式。这份指南拆解了三个更有效的动作：精准卡位、用作品替代学历、把面试当成对话而非考试。',
      body: [
        '<p>又到毕业季。说句扎心的：今年再海投 500 份简历，回复率大概率还是个位数。不是你不够好，是这个打法在 2026 年已经失效了——HR 邮箱每天被几千份模板简历淹没，你的亮点根本没机会被看见。</p>',
        '<p>第一个动作是<strong>精准卡位</strong>。与其投 100 家，不如研究 10 家你最想去的，把它们近半年的业务动态、用人节奏摸清楚，针对性地改简历、找内推。命中率会高出一个数量级。</p>',
        '<p>第二个动作是<strong>用作品替代学历</strong>。无论你是想进大厂还是创业公司，一个能直接展示的项目（代码、设计、文案、运营复盘）比一纸文凭有说服力得多。企业招的是能干活的人，不是能考试的人。</p>',
        '<p>第三个动作最反直觉：<strong>把面试当成对话而非考试</strong>。紧张到说不出话，往往是因为你把它当成单向被审。试着反过来，你也在评估这家公司值不值得你去。心态一变，发挥会好很多。</p>'
      ].join('\n'),
      tags: ['职场', '就业', '应届生', '求职'],
      likes: 4520,
      dislikes: 218,
      commentCount: 624,
      sedimentCount: 312,
      createdAt: '2 天前',
      stream: 'knowledge'
    },
    {
      id: 'n-gym-beginner-mistakes',
      title: '健身新手避坑指南：第一个月千万别犯这些错',
      authorId: 'u-hanxing',
      fingerprint: 'human',
      authority: 64,
      summary:
        '我见过太多新手第一个月就练废了。这篇把最常见的 5 个坑列清楚：一上来就上大重量、只练胸不练背、忽视热身、天天练不休息、迷信补剂。避开这些，你已经赢了 80% 的人。',
      body: [
        '<p>我带过不少健身新手，发现第一周放弃的人，90% 都栽在同样的几个坑里。健身这事，难的不是动作，是别把自己练废。下面这 5 个错，新手第一个月千万别犯。</p>',
        '<p>第一个坑：<strong>一上来就上大重量</strong>。朋友圈想秀可以理解，但动作都没学会就冲重量，受伤是迟早的事。前一个月先把动作模式练标准，重量是后面自然而然的事。</p>',
        '<p>第二个坑：<strong>只练胸不练背</strong>。男生爱卧推、女生爱练臀，结果体态越来越歪，圆肩驼背找上门。记住一个原则：拉的量不能少于推的量，前后要平衡。</p>',
        '<p>第三、四个坑是忽视热身和天天练不休息。肌肉不是在训练时长出来的，是在休息时长出来的。一周练 3-4 次、每次认真热身，效果远好过天天去健身房硬撑。第五个坑是迷信补剂——蛋白粉只是方便，不是魔法，好好吃饭永远是第一位。</p>'
      ].join('\n'),
      tags: ['健身', '新手', '健康', '避坑'],
      likes: 3180,
      dislikes: 87,
      commentCount: 256,
      sedimentCount: 198,
      createdAt: '4 天前',
      stream: 'creation'
    },
    {
      id: 'n-quantum-counterintuitive-facts',
      title: '量子力学里 5 个反直觉的事实，看完怀疑人生',
      authorId: 'u-zhouye',
      fingerprint: 'ai',
      authority: 66,
      summary:
        '量子力学不是玄学，是这个世界最底层的运行规则。我挑了 5 个最反直觉的实验事实，每一个都在挑战你对“现实”的直觉。看完你可能会重新理解“观察”这两个字。',
      body: [
        '<p>【视频卡片 · 时长 8:46 · 已沉淀 2100 次】</p>',
        '<p>量子力学最让人不舒服的地方在于：它是对的，但它跟我们日常的直觉完全对不上。今天挑 5 个最反直觉的事实，每一个都是被实验反复验证过的。</p>',
        '<p>第一，<strong>一个粒子可以同时出现在两个地方</strong>。双缝干涉实验里，单个电子通过缝隙后，在屏幕上形成干涉条纹——它像波一样同时走了两条路。这不是比喻，是真实的测量结果。</p>',
        '<p>第二，<strong>你看一眼，世界就不一样了</strong>。测量会改变被测量的对象，这就是“观察者效应”。第三是量子纠缠：两个纠缠粒子无论隔多远，测一个另一个瞬间响应。第四是真空不空，真空中随时有虚粒子生灭。第五，时间在量子层面可能根本没有方向。</p>',
        '<p>看完这五条，你应该能理解为什么爱因斯坦本人都对量子力学感到不安。这不是玄学，这是这个世界最底层的运行规则，只是它运行的方式，跟我们的大脑习惯完全不同。</p>'
      ].join('\n'),
      tags: ['量子力学', '科普', '物理', '视频卡片'],
      likes: 5670,
      dislikes: 143,
      commentCount: 489,
      sedimentCount: 412,
      createdAt: '3 天前',
      stream: 'creation'
    },
    {
      id: 'n-kaoyan-second-try-lessons',
      title: '考研二战上岸：我把走过的弯路都写在这里',
      authorId: 'u-liqy',
      fingerprint: 'human',
      authority: 60,
      summary:
        '一战失败后我复盘了半年，发现踩的坑其实都是“自以为努力”。这篇是我二战上岸后整理的 4 个教训：别堆资料、别比时长、别跳过复盘、别忽视心态。希望你能少走我走过的路。',
      body: [
        '<p>一战出分那天我对着屏幕哭了半小时。后来冷静下来复盘，发现败得不冤——我那一年看似很努力，实则全是无效劳动。二战调整方法后上岸了，这里把走过的弯路写出来，希望你不用再走一遍。</p>',
        '<p>第一个弯路：<strong>疯狂堆资料</strong>。我囤了七八本参考书、十几个网课，结果每本都看一点，哪本都没吃透。二战我只留了一套主教材 + 真题，反复啃，反而通透了。资料多不等于学得多。</p>',
        '<p>第二个弯路：<strong>比学习时长</strong>。我每天坐 12 小时，有效学习可能只有 5 小时，剩下全在走神和自我感动。二战我改成番茄钟，专注 6 小时胜过摸鱼 12 小时。</p>',
        '<p>第三个弯路是跳过复盘——错题不做归纳，下次还错。第四个是忽视心态，后期焦虑到失眠反而拖垮状态。考研是马拉松，<strong>能稳住节奏的人，才走得完</strong>。</p>'
      ].join('\n'),
      tags: ['考研', '二战', '学习方法', '复盘'],
      likes: 3920,
      dislikes: 76,
      commentCount: 543,
      sedimentCount: 287,
      createdAt: '1 周前',
      stream: 'review',
      lastStudiedAt: '3 天前'
    },
    {
      id: 'n-lazy-weekly-cooking',
      title: '懒人一周做饭攻略：30 块吃好一周',
      authorId: 'u-chenmb',
      fingerprint: 'human',
      authority: 58,
      summary:
        '科研狗也能吃好饭。这套攻略的核心是周末一次性备菜 + 三种基础酱汁百搭。30 块一周、每天不到 20 分钟开饭，营养还均衡。亲测能坚持两个月不腻。',
      body: [
        '<p>很多朋友说“做饭太花时间”，其实是你没找对方法。作为一只常年加班的科研狗，我摸索出了一套懒人做饭法，<strong>30 块吃好一周，每天开饭不超过 20 分钟</strong>，营养还不凑合。</p>',
        '<p>核心是两件事：周末一次性备菜 + 三种基础酱汁百搭。周日用一小时把土豆、胡萝卜、洋葱切好冷藏，再煮一锅杂粮饭分装。工作日回家，抓一把菜下锅，浇酱汁，齐活。</p>',
        '<p>三种万能酱汁分享给你：<strong>日式照烧汁</strong>（酱油 + 味淋 + 糖）配鸡肉，<strong>泰式酸辣汁</strong>（柠檬 + 鱼露 + 小米辣）配虾仁，<strong>中式葱油汁</strong>（葱油 + 酱油 + 蚝油）拌面或配豆腐。换酱汁就是换一道菜。</p>',
        '<p>预算分配：主食（米面杂粮）8 块、蛋白质（鸡腿肉、鸡蛋、豆腐）12 块、蔬菜 8 块、水果 2 块。真的能压到 30 块以内，而且吃得比外卖健康多了。别再天天点外卖了，试试看。</p>'
      ].join('\n'),
      tags: ['做饭', '懒人', '省钱', '生活'],
      likes: 4180,
      dislikes: 64,
      commentCount: 376,
      sedimentCount: 234,
      createdAt: '5 天前',
      stream: 'creation'
    },
    {
      id: 'n-moonlight-saver-ledger',
      title: '月光族怎么存下第一笔钱？我的真实账本',
      authorId: 'u-suqing',
      fingerprint: 'cocreate',
      authority: 70,
      summary:
        '我曾经也是月光族，后来用一套笨办法存下了第一笔 5 万。核心不是省到窒息，而是先付给自己 + 记账反查 + 三账户分账。附我连续记了 12 个月的真实账本。',
      body: [
        '<p>说句实话：我曾经也是月光族，工资一到账就还花呗，循环往复。后来我用一套笨办法，用一年时间存下了人生第一笔 5 万。核心不是省到窒息，而是换一套管钱的思路。</p>',
        '<p>第一步叫<strong>先付给自己</strong>。工资到账当天，先把 20% 转到一个“不许动”的账户，剩下的才是你能花的。顺序一换，效果天差地别——大部分人存不下钱，是因为想“花剩下的再存”，结果永远剩不下。</p>',
        '<p>第二步是<strong>记账反查</strong>。不用记一辈子，认真记三个月，你会震惊地发现钱都漏在哪了。我当时发现自己一个月光在外卖和奶茶上就花了 1800，看到数字的那一刻才真的有动力改。</p>',
        '<p>第三步是<strong>三账户分账</strong>：日常账户放生活费、固定账户放房租水电等、储蓄账户只进不出。钱分开放，诱惑就少一半。附我连续记了 12 个月的真实账本，数字可能不优雅，但绝对真实。</p>'
      ].join('\n'),
      tags: ['理财', '记账', '存钱', '生活'],
      likes: 5230,
      dislikes: 198,
      commentCount: 467,
      sedimentCount: 321,
      createdAt: '6 天前',
      stream: 'knowledge'
    },
    {
      id: 'n-why-cant-stop-short-video',
      title: '为什么我们停不下刷短视频？多巴胺绑架了你的大脑',
      authorId: 'u-shenyan',
      fingerprint: 'human',
      authority: 65,
      summary:
        '刷到凌晨两点不是你意志力差，是算法在用多巴胺的机制精准投喂你。这篇拆解了短视频让人上瘾的三层原理，也给出了一些不那么痛苦的脱瘾方法。别自责，先理解它。',
      body: [
        '<p>“再看一条就睡”——然后刷到凌晨两点。这件事让你自责，但我想先告诉你：这不是你意志力差，是几百个顶尖工程师在用多巴胺的机制，精准地投喂你。要脱身，得先理解它怎么绑架你的。</p>',
        '<p>第一层原理是<strong>间歇性奖励</strong>。你永远不知道下一条是神作还是无聊，这种不确定性正是多巴胺分泌最猛的触发器——跟老虎机的原理一模一样。可预期的快乐让人厌倦，未知的快乐让人上瘾。</p>',
        '<p>第二层是无尽的滚动，没有“结束”信号，大脑永远在等“再一条”。第三层是个性化推荐越推越准，它比你更懂你喜欢什么。三层叠加，你的前额叶（负责自控）根本打不过杏仁核（负责冲动）。</p>',
        '<p>脱瘾不靠硬扛，靠环境：把 APP 移到第二屏、设置每日时长提醒、睡前手机放客厅。我试过最有效的一招是——<strong>刷之前先问自己“我现在真的想看，还是在逃避什么”</strong>。多数时候，答案是后者。</p>'
      ].join('\n'),
      tags: ['思考', '多巴胺', '习惯', '生活'],
      likes: 6780,
      dislikes: 312,
      commentCount: 824,
      sedimentCount: 198,
      createdAt: '昨天',
      stream: 'discussion',
      hasDebate: true
    }
  ];

  /* -----------------------------------------------------------------------
   * 给存量 notes 补 notebookId + spec（块树示例），保留旧字段做兼容
   * 电池主题 3 篇 → nb-research，生活向 → nb-default
   * -------------------------------------------------------------------- */
  (function () {
    var researchIds = { 'n-solid-battery-impedance': 1, 'n-li-battery-paradigm': 1, 'n-sulfide-vs-oxide': 1 };
    var stripTags = function (s) { return String(s).replace(/<[^>]+>/g, ''); };
    notes.forEach(function (n) {
      n.notebookId = researchIds[n.id] ? 'nb-research' : 'nb-default';
      n.refs = n.refs || [];
      if (n.spec) return;
      var paras = n.body ? String(n.body).split(/[\n\r]+/).filter(function (p) { return p.trim().length > 0; }).slice(0, 3) : [];
      var children = paras.map(function (p) { return _t(stripTags(p)); });
      /* 电池主题首篇加一张图块做 fileId 引用示例 */
      if (n.id === 'n-solid-battery-impedance') { children.unshift(_img('f-img-1')); }
      n.spec = _section(children);
    });
  })();

  /* -----------------------------------------------------------------------
   * 统一文件模型迁移（workspace-unified-files spec）
   * 把 notes 迁移为 files 中的 type='note' 条目（保留旧字段 title/body/spec 做兼容）
   * 统一 File 结构：{ id, name, type, path, content, notebookId, updatedAt }
   * type 取值：'note' | 'template' | 'workflow' | 'code' | 'plugin'
   * files 数组原有 image/doc 资产保留（block-renderer 按 id 查 url 仍可用）
   * -------------------------------------------------------------------- */
  (function () {
    var portfolioNameById = {};
    portfolios.forEach(function (p) { portfolioNameById[p.id] = p.name; });
    var notebookById = {};
    notebooks.forEach(function (nb) { notebookById[nb.id] = nb; });

    /* 1) 迁移 notes → files（type='note'），同一对象引用，notes 仍可用 */
    notes.forEach(function (n) {
      var nb = notebookById[n.notebookId] || notebooks[0];
      var pName = nb ? (portfolioNameById[nb.portfolioId] || '未分类') : '未分类';
      var nbName = nb ? nb.name : '未分类';
      n.name = n.title;
      n.type = 'note';
      n.path = '/' + pName + '/' + nbName + '/' + n.title;
      n.content = {
        spec: n.spec,
        refs: n.refs || [],
        aiCo: n.aiCo || false,
        body: n.body,
        blocks: n.blocks,
        outline: n.outline,
        template: n.template
      };
      n.updatedAt = n.updatedAt || '2026-06-22';
      files.push(n);
    });

    /* 2) 新增各类型示例文件（template / workflow / code / plugin） */
    var rp = '/我的作品集/固态电池研究/';
    files.push(
      { id: 'f-tpl-compare', name: '对比页模板', type: 'template', path: rp + '对比页模板',
        content: { spec: { type: 'section', children: [{ type: 'text', text: '对比标题' }, { type: 'cols', cols: [[{ type: 'text', text: '左栏' }], [{ type: 'text', text: '右栏' }]] }] }, icon: '⚖️', desc: '左右对比布局' },
        notebookId: 'nb-research', updatedAt: '2026-06-22' },
      { id: 'f-tpl-timeline', name: '时间线模板', type: 'template', path: rp + '时间线模板',
        content: { spec: { type: 'section', children: [{ type: 'text', text: '时间线' }, { type: 'text', text: '• 2024 ...' }, { type: 'text', text: '• 2025 ...' }, { type: 'text', text: '• 2026 ...' }] }, icon: '📅', desc: '时间线排列' },
        notebookId: 'nb-research', updatedAt: '2026-06-22' },
      { id: 'f-wf-collect', name: '数据采集流', type: 'workflow', path: rp + '数据采集流',
        content: { steps: [{ name: '读取论文', input: 'PDF', output: '摘要' }, { name: '提取数据', input: '摘要', output: '数据表' }, { name: '生成图表', input: '数据表', output: '图表' }] },
        notebookId: 'nb-research', updatedAt: '2026-06-22' },
      { id: 'f-code-chart', name: 'chart-plugin.js', type: 'code', path: rp + 'chart-plugin.js',
        content: { language: 'javascript', code: '// 简易图表插件\nfunction renderChart(data) {\n  const svg = createSVG(data);\n  return svg;\n}\n\nmodule.exports = { renderChart };' },
        notebookId: 'nb-research', updatedAt: '2026-06-22' },
      { id: 'f-plg-battery', name: '电池计算器插件', type: 'plugin', path: rp + '电池计算器插件',
        content: { language: 'javascript', code: '// 电池能量密度计算器\nfunction calcEnergyDensity(capacity, weight) {\n  return (capacity * 3.7) / weight;\n}\n\nmodule.exports = { calcEnergyDensity };', manifest: { name: '电池计算器', version: '1.0.0', desc: '计算电池能量密度' } },
        notebookId: 'nb-research', updatedAt: '2026-06-22' }
    );
  })();

  /* -----------------------------------------------------------------------
   * debates —— 5 条争论树（3 条电池主题 + 2 条生活向）
   * key = noteId，value = { proPercent, conPercent, pros: [...], cons: [...] }
   * 每条评论：{ id, authorId, body, likes, type, evaluations: [二层评价] }
   * type ∈ support（补充）/ refute（反驳）/ correct（纠错）/ extend（延伸）
   * -------------------------------------------------------------------- */
  var debates = {
    'n-solid-battery-impedance': {
      proPercent: 70,
      conPercent: 30,
      pros: [
        {
          id: 'd1-pro-1',
          authorId: 'u-zhangheng',
          body: '界面阻抗分析扎实，理由有三：其一，硫化物电解质本体离子电导率早已突破 10⁻² S/cm，本体早已不是限制；其二，原位 XPS 直接证明界面副反应层是整电池阻抗的真正来源，3 nm LiNbO₃ 涂层让阻抗从 1200 降到 80 Ω·cm²，这是数量级的跨越；其三，所有“界面修好仍循环差”的反例，仔细看都存在测量或工艺瑕疵。把资源压在界面上，是边际收益最高的方向。',
          likes: 456,
          type: 'support',
          evaluations: [
            {
              id: 'd1-pro-1-e1',
              authorId: 'u-suqing',
              body: '补充一条产线数据：我们厂在中试线上实测过，加了 LiNbO₃ 涂层的电芯，1000 循环后容量保持率从 62% 提升到 89%，本体电解质完全没换。这证明在工程尺度上界面确实是杠杆点，钱花得最值的地方就是它。',
              likes: 78,
              type: 'extend',
              evaluations: []
            }
          ]
        }
      ],
      cons: [
        {
          id: 'd1-con-1',
          authorId: 'u-shenyan',
          body: '短窗口数据漂亮不代表长循环能撑住。硫化物电解质在长循环后会因晶界处的相分离而电导率下降，且这种衰减无法靠任何界面涂层挽回。短窗口看界面是赢家，长窗口看本体才是决定性的。只看 200 循环的曲线，结论会被严重误导。',
          likes: 203,
          type: 'refute',
          evaluations: [
            {
              id: 'd1-con-1-e1',
              authorId: 'u-guci',
              body: '需要纠错一处：长循环衰减的数据在不同卤素体系之间差异显著，不能直接外推。Cl 体系的衰减幅度远小于 Br 体系，引用时需要限定条件，否则会扩大化结论。',
              likes: 96,
              type: 'correct',
              evaluations: []
            }
          ]
        },
        {
          id: 'd1-con-2',
          authorId: 'u-liqy',
          body: '成本视角的反对意见：LiNbO₃ 涂层目前需要磁控溅射，产线速度只有 0.5 m/min，远低于液态电池涂布线的 15 m/min。即使界面性能再好，量产成本也扛不住。路线图里“界面优先”的前提是涂层工艺能突破，但这个突破至今没有发生。',
          likes: 34,
          type: 'refute',
          evaluations: []
        }
      ]
    },

    'n-li-battery-paradigm': {
      proPercent: 64,
      conPercent: 36,
      pros: [
        {
          id: 'd2-pro-1',
          authorId: 'u-wangshi',
          body: '5 年路线图与产业真实信号高度吻合。良率突破、车企第三方测试通过、整车搭载时间表——这些都是真金白银的产线投入，不是 PPT。半固态 2024 上车、硫化物全固态 2026 中试、2028 规模化，这个节奏与全球头部企业的资本支出曲线完全对齐，判断靠谱。',
          likes: 389,
          type: 'support',
          evaluations: [
            {
              id: 'd2-pro-1-e1',
              authorId: 'u-suqing',
              body: '补充一条产线细节：半固态的“过渡”其实比外界想象得更长。我们厂实测半固态电芯的工艺良率比全固态高 35 个百分点，且不需要干燥间，CapEx 只有硫化物全固态的 1/3。在尚未验证规模市场之前，半固态至少能撑到 2030 年。',
              likes: 142,
              type: 'extend',
              evaluations: []
            }
          ]
        }
      ],
      cons: [
        {
          id: 'd2-con-1',
          authorId: 'u-shenyan',
          body: '“5 年路线图”过度乐观，忽略了三个被低估的因素：其一，硫化物对水的敏感性使产线 CapEx 是同产能液态的两倍多；其二，锂金属负极在长循环中的工程化难题至今没有解决方案；其三，2028 年规模化窗口的判断建立在需求高速增长的假设上，若需求不及预期，资本会迅速撤退。范式的转移从来不会按路线图发生。',
          likes: 219,
          type: 'refute',
          evaluations: [
            {
              id: 'd2-con-1-e1',
              authorId: 'u-guci',
              body: '纠错一处：路线图里“硫化物对水敏感使 CapEx 是液态 2.3 倍”这个数偏高。随着卷对卷工艺成熟，干燥间 CapEx 已降至 1.6 倍左右。路线图的成本估计偏保守，但方向正确。',
              likes: 73,
              type: 'correct',
              evaluations: []
            }
          ]
        }
      ]
    },

    'n-sulfide-vs-oxide': {
      proPercent: 88,
      conPercent: 12,
      pros: [
        {
          id: 'd3-pro-1',
          authorId: 'u-zhangheng',
          body: '硫化物电导率逼近液态电解液，加工性好，搭配锂金属负极已能做到较高的临界电流密度。从性能指标看，硫化物在低温高倍率场景下显著占优，这是头部企业选择“先上车”路线的根本原因。',
          likes: 74,
          type: 'support',
          evaluations: []
        },
        {
          id: 'd3-pro-2',
          authorId: 'u-suqing',
          body: '产线实测：硫化物半固态电芯的工艺良率已突破 80%，且不需要高温烧结工序。相比之下氧化物烧结温度高达 1100℃，能耗和设备投入都是数量级的差距。先上车再换轮子，是产业最务实的选择。',
          likes: 52,
          type: 'extend',
          evaluations: []
        }
      ],
      cons: [
        {
          id: 'd3-con-1',
          authorId: 'u-shenyan',
          body: '硫化物对水的敏感性是致命弱点。产线露点要求极低，有毒气体释放量在很低浓度就有安全风险。这不是“先上车”能解决的问题，而是路线本身的基因缺陷。',
          likes: 67,
          type: 'refute',
          evaluations: []
        },
        {
          id: 'd3-con-2',
          authorId: 'u-guci',
          body: '纠错一处：硫化物“加工性好”需要限定条件。冷压成型确实简单，但致密度只有 80-85%，剩余空隙导致循环时界面阻抗持续上升。氧化物虽然烧结难，但致密度可达 98% 以上，长循环稳定性反而更好。',
          likes: 29,
          type: 'correct',
          evaluations: []
        }
      ]
    },

    /* —— 新增：生活向 debates —— */
    'n-chicken-or-egg-first': {
      proPercent: 55,
      conPercent: 45,
      pros: [
        {
          id: 'd4-pro-1',
          authorId: 'u-zhangheng',
          body: '从演化生物学看，答案很清楚：先有蛋。广义的羊膜卵在鸡出现前几亿年就存在了，恐龙就在下蛋。就算只算“孵出鸡的蛋”，第一只鸡也是从一颗非鸡祖先下的、因基因突变而孵出鸡的蛋里出来的。蛋在先，是演化的必然结论。',
          likes: 412,
          type: 'support',
          evaluations: [
            {
              id: 'd4-pro-1-e1',
              authorId: 'u-hanxing',
              body: '补充一点：这个突变一定发生在受精卵阶段，也就是蛋里，而不是成年个体身上。所以“先有蛋”不只是一句俏皮话，它在遗传学层面是成立的。',
              likes: 88,
              type: 'extend',
              evaluations: []
            }
          ]
        },
        {
          id: 'd4-pro-2',
          authorId: 'u-guci',
          body: '如果非要在两者之间选，科学证据更支持“先有蛋”。演化的最小单位是基因，而基因的重组与突变发生在生殖细胞阶段。从这个意义上，那颗“成了鸡”的蛋，是因果链上更早的一环。',
          likes: 156,
          type: 'support',
          evaluations: []
        }
      ],
      cons: [
        {
          id: 'd4-con-1',
          authorId: 'u-shenyan',
          body: '这个问题本身问错了。“鸡”是人类事后画的分类线，物种演化是连续渐变的，根本不存在“第一只鸡”这个清晰的点。在一条平滑的渐变曲线上强行找一个起点，就像问“这一粒沙从哪开始变成一堆”——它是歧义悖论，不是事实问题。',
          likes: 287,
          type: 'refute',
          evaluations: [
            {
              id: 'd4-con-1-e1',
              authorId: 'u-jiangyue',
              body: '同意。这就跟“人是从哪一代猿变成人”一样，没有那一刻。我们执着要一个“第一”，是因为大脑不擅长处理连续性，总想把它切成离散的块。',
              likes: 64,
              type: 'extend',
              evaluations: []
            }
          ]
        },
        {
          id: 'd4-con-2',
          authorId: 'u-liqy',
          body: '从语义学反驳：什么叫“鸡的蛋”？如果定义为“鸡下的蛋”，那先有鸡；如果定义为“孵出鸡的蛋”，那先有蛋。两边都没错，错的是问题本身定义不清。这种争论本质上是在不同的定义下各说各话。',
          likes: 143,
          type: 'correct',
          evaluations: []
        }
      ]
    },

    'n-why-cant-stop-short-video': {
      proPercent: 70,
      conPercent: 30,
      pros: [
        {
          id: 'd5-pro-1',
          authorId: 'u-guci',
          body: '支持“多巴胺陷阱”这个判断。短视频平台的设计逻辑——间歇性奖励、无尽滚动、个性化推荐——每一项都是对着多巴胺回路精准设计的。这不是用户意志力的问题，是几百个工程师在系统性地赢过你的前额叶。把它叫做“绑架”并不夸张。',
          likes: 534,
          type: 'support',
          evaluations: [
            {
              id: 'd5-pro-1-e1',
              authorId: 'u-liqy',
              body: '补充一个数据：有研究测过，刷短视频时多巴胺的波动模式跟赌博机几乎一致。这种强度的刺激，靠“自律”去对抗，输是大概率事件。',
              likes: 128,
              type: 'extend',
              evaluations: []
            }
          ]
        },
        {
          id: 'd5-pro-2',
          authorId: 'u-hanxing',
          body: '从行为角度同意。我自己戒过一段时间，最难熬的不是不看，而是不看之后那段空白不知道填什么。这说明上瘾的不是内容，是多巴胺本身——平台只是提供了最廉价的获取方式。',
          likes: 198,
          type: 'support',
          evaluations: []
        }
      ],
      cons: [
        {
          id: 'd5-con-1',
          authorId: 'u-zhouye',
          body: '反对把锅全甩给算法。作为内容创作者我说句公道话：平台确实在诱导，但刷不刷、刷多久，最终决定的还是用户自己。“绑架”这个词太重了，它把人当成完全被动的受体，抹掉了人的能动性。承认诱导存在，不等于承认自己毫无选择权。',
          likes: 312,
          type: 'refute',
          evaluations: [
            {
              id: 'd5-con-1-e1',
              authorId: 'u-jiangyue',
              body: '同意。我刷短视频也会停不下来，但我知道那是我的选择。把一切归因于“被绑架”，反而会让人放弃改变——反正不是我的错嘛。承认是个人选择，才是改变的起点。',
              likes: 96,
              type: 'support',
              evaluations: []
            }
          ]
        },
        {
          id: 'd5-con-2',
          authorId: 'u-wangshi',
          body: '部分纠错：多巴胺机制的解释是对的，但“绑架”这种说法容易让人误以为无解。真正的问题不是多巴胺，而是现实生活提供的正向反馈太少、太慢，短视频才显得那么诱人。治本之道是让现实更有意思，而不是单纯骂平台。',
          likes: 167,
          type: 'correct',
          evaluations: []
        }
      ]
    }
  };

  /* -----------------------------------------------------------------------
   * dailyPicks —— 每日推荐 4 张卡片（去学术化文案）
   * 字段：id / type（review|hot|new|creation）/ title / subtitle
   *       / targetNoteId / reason（具体解释）/ time
   * -------------------------------------------------------------------- */
  var dailyPicks = [
    {
      id: 'dp-1',
      type: 'review',
      title: '考研二战上岸：走过的弯路',
      subtitle: '上次学习 3 天前 · 该复盘了',
      targetNoteId: 'n-kaoyan-second-try-lessons',
      reason: '你 3 天前收藏过这篇考研复盘，趁记忆还在，再过一遍那四个最容易踩的坑。',
      time: '今天 09:12'
    },
    {
      id: 'dp-2',
      type: 'hot',
      title: '为什么我们停不下刷短视频？',
      subtitle: '今日热议 · 6780 赞',
      targetNoteId: 'n-why-cant-stop-short-video',
      reason: '广场今天吵得最凶的一条，“多巴胺陷阱”派和“个人选择”派正在对决，值得一看。',
      time: '今天 08:30'
    },
    {
      id: 'dp-3',
      type: 'new',
      title: '2026 大学生就业指南',
      subtitle: '别再海投简历了 · 新发布',
      targetNoteId: 'n-2026-graduate-job-guide',
      reason: '毕业季到了，王石这份指南把“精准卡位”和“用作品替代学历”讲得很透，推荐给找工作的你。',
      time: '昨天 22:05'
    },
    {
      id: 'dp-4',
      type: 'creation',
      title: '懒人一周做饭攻略：30 块吃好一周',
      subtitle: '创作流精选 · 4180 赞',
      targetNoteId: 'n-lazy-weekly-cooking',
      reason: '你最近收藏了好几篇生活类内容，陈墨白这套备菜 + 三酱汁的懒人法，亲测能坚持，可以试试。',
      time: '昨天 19:48'
    }
  ];

  /* -----------------------------------------------------------------------
   * feed —— 按 4 种流分组的 noteId 列表
   * 流：knowledge / creation / review / discussion
   * 每条流 3-4 条 noteId，11 篇笔记合理分配（可在多个流重复出现）
   * -------------------------------------------------------------------- */
  var feed = {
    knowledge: [
      'n-2026-graduate-job-guide',
      'n-moonlight-saver-ledger',
      'n-li-battery-paradigm',
      'n-solid-battery-impedance'
    ],
    creation: [
      'n-gym-beginner-mistakes',
      'n-lazy-weekly-cooking',
      'n-quantum-counterintuitive-facts'
    ],
    review: [
      'n-kaoyan-second-try-lessons',
      'n-solid-battery-impedance',
      'n-li-battery-paradigm'
    ],
    discussion: [
      'n-chicken-or-egg-first',
      'n-why-cant-stop-short-video',
      'n-sulfide-vs-oxide'
    ]
  };

  /* -----------------------------------------------------------------------
   * 挂载到全局（与 demo/shared/mock-data.js 完全一致）
   * -------------------------------------------------------------------- */
  var ZX_MOCK = {
    users: users,
    portfolios: portfolios,
    notebooks: notebooks,
    files: files,
    inlineBlocks: inlineBlocks,
    notes: notes,
    debates: debates,
    dailyPicks: dailyPicks,
    feed: feed
  };

  window.ZX = window.ZX || {};
  window.ZX.mock = ZX_MOCK;
  window.ZX.migrateLegacyNote = migrateLegacyNote;
  window.ZX_MOCK = ZX_MOCK;
})();
