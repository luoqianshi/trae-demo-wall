/* =========================================================================
 * 「知行」前端 Demo —— 共享 Mock 数据层（Phase 0 / Task 0.6）
 * -------------------------------------------------------------------------
 * 设计主线：固态电池 / 界面阻抗 / 硫化物电解质 / 钠电池枝晶
 * 挂载方式：
 *   <script src="../shared/mock-data.js"></script>
 *   window.ZX_MOCK                          —— 全量数据（旧式引用）
 *   window.ZX = window.ZX || {};            —— 与 icons.js 共用 ZX 命名空间
 *   window.ZX.mock                          —— 同一份引用
 * 六个原型（feed / note-debate / daily-ai / knowledge-graph / sediment / editor）
 * 共享同一份世界观：所有 noteId / userId 在 notes / debates / graph.linkedNoteId
 * / dailyPicks.targetNoteId / feed.* 中严格一致。
 * =======================================================================*/

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
   * users —— 12 位用户
   * 字段：id / name / avatarColor（首字母头像底色）/ authority（0-100 权威分）
   *       / domain（领域专长）/ bio（一句话）/ initials（头像首字母 1-2 位）
   * avatarColor 取自 design-tokens.css 的墨韵色系
   * -------------------------------------------------------------------- */
  var users = [
    {
      id: 'u-me', name: '我', initials: '我',
      avatarColor: '#1D5B7A', authority: 67, domain: '材料学',
      bio: '初学者，正在拆解"固态电池"这条主线，目标是把每篇笔记都争论一遍。'
    },
    {
      id: 'u-linzw', name: '林知微', initials: '林',
      avatarColor: '#C1272D', authority: 92, domain: '材料学',
      bio: '材料学博士，专注固态电池界面物理十年，习惯用第一性原理看问题。'
    },
    {
      id: 'u-chenmb', name: '陈墨白', initials: '陈',
      avatarColor: '#1D5B7A', authority: 84, domain: '材料学',
      bio: '硫化物电解质合成与界面修饰研究员，长期与产线对接。'
    },
    {
      id: 'u-suqing', name: '苏青', initials: '苏',
      avatarColor: '#C7A24A', authority: 79, domain: '电池工程',
      bio: '某电池厂工程师，十年锂电产线经验，对工艺细节与中试数据格外敏感。'
    },
    {
      id: 'u-zhouye', name: '周野', initials: '周',
      avatarColor: '#3E8DB0', authority: 65, domain: '科普创作',
      bio: '把硬核论文翻译成人话的科普创作者，已发布三百余条短视频。'
    },
    {
      id: 'u-zhangheng', name: '张衡', initials: '张',
      avatarColor: '#C1272D', authority: 95, domain: '电化学',
      bio: '化学教授，国家杰出青年，研究固态电解质界面化学二十年，主张"界面优先"。'
    },
    {
      id: 'u-liqy', name: '李轻语', initials: '李',
      avatarColor: '#E58A8E', authority: 48, domain: '材料学',
      bio: '在读博士，研究钠金属电池枝晶抑制，自称论文收集强迫症患者。'
    },
    {
      id: 'u-wangshi', name: '王石', initials: '王',
      avatarColor: '#2A2724', authority: 70, domain: '电池工程',
      bio: '新能源产业分析师，长期跟踪宁德时代、QuantumScape 等头部固态电池企业。'
    },
    {
      id: 'u-shenyan', name: '沈砚', initials: '沈',
      avatarColor: '#1D5B7A', authority: 83, domain: '电化学',
      bio: '专注电解质本体性能而非界面，长期质疑"界面论"一家独大。'
    },
    {
      id: 'u-guci', name: '顾辞', initials: '顾',
      avatarColor: '#6B655C', authority: 55, domain: '物理学',
      bio: '认知科学背景跨界思考科学共识如何形成与崩塌，常用 Goodhart 定律审视指标。'
    },
    {
      id: 'u-hanxing', name: '韩星', initials: '韩',
      avatarColor: '#B4602C', authority: 68, domain: '电池工程',
      bio: '钠电池方向青年学者，曾任职于某钠电初创公司，对硫化物体系有四年一线经验。'
    },
    {
      id: 'u-jiangyue', name: '江月', initials: '江',
      avatarColor: '#3E8DB0', authority: 76, domain: '物理学',
      bio: '界面阻抗方向研究员，近期关注界面阻抗"被高估"的问题，发起了本周热议。'
    }
  ];

  /* -----------------------------------------------------------------------
   * notes —— 8 条笔记
   * 字段：id / title / authorId / fingerprint（human|cocreate|ai-pdf|ai）
   *       / authority（内容信任分 0-100）/ summary（约 200 字）/ body（4-6 段）
   *       / tags / likes / dislikes / commentCount / sedimentCount
   *       / createdAt（相对时间）/ stream（knowledge|creation|review|discussion）
   * 核心 2 条：n-solid-battery-impedance / n-li-battery-paradigm（用于争论树）
   * -------------------------------------------------------------------- */
  var notes = [
    {
      id: 'n-solid-battery-impedance',
      title: '固态电池界面阻抗的真相：硫化物电解质的瓶颈在哪',
      authorId: 'u-linzw',
      fingerprint: 'human',
      authority: 87,
      summary:
        '硫化物电解质本体离子电导率早已不是瓶颈（Li₆PS₅Cl 室温下已达 10⁻² S/cm），真正卡量产的是固-固界面阻抗。Wang et al. 2024 用原位 XPS 证明 3 nm LiNbO₃ 涂层能把界面阻抗从 1200 Ω·cm² 压到 80 Ω·cm²，但这条路径至今不被所有人买账——尤其与钠电池枝晶问题对比时，界面到底是不是真正的杠杆点，仍是开放问题。',
      body: [
        '<p>固态电池被视为下一代储能的"圣杯"，但真正卡住它量产的，不是大多数人想象的电解质本身，而是<strong>固-固界面阻抗</strong>。硫化物电解质 Li<sub>6</sub>PS<sub>5</sub>Cl 的本体离子电导率在室温下已达 10<sup>-2</sup>&nbsp;S/cm 量级，与液态电解液同量级；可一旦它与高镍正极或锂金属负极接触，界面处会形成一层高阻抗的副反应层，让整块电池的内阻飙升数倍。</p>',
        '<p>过去一年最具突破性的工作来自 Wang et al. 2024：他们用原位 XPS 直接观察到了 Li<sub>6</sub>PS<sub>5</sub>Cl 与高镍正极接触时的元素互扩散，并证明只需 3&nbsp;nm 的 LiNbO<sub>3</sub> 涂层就能把界面阻抗从 1200&nbsp;Ω·cm<sup>2</sup> 压到 80&nbsp;Ω·cm<sup>2</sup>——这是数量级的差距。临界电流密度也随之从 0.6&nbsp;mA/cm<sup>2</sup> 提升到 1.7&nbsp;mA/cm<sup>2</sup>。</p>',
        '<p>但这条路径并不被所有人买账。把视野放大到钠电池：钠金属负极同样长枝晶，但钠更软、电导率更低，<strong>钠枝晶</strong>的抑制比锂更难。把"界面阻抗"框架直接搬到钠体系，会发现本体电导率与界面稳定性根本解耦——这反过来逼问锂电人：界面真的是唯一的杠杆点吗？</p>',
        '<p>本文整理这条线索上正反双方最具代表性的论证：一派把资源压在界面修饰（LiNbO<sub>3</sub>、Li<sub>3</sub>PO<sub>4</sub>、原子层沉积），另一派认为长循环中电解质本体的相分离与机械粉化才是真正的杀手。电化学窗口、临界电流密度、电化学阻抗谱（EIS）的等效电路拟合——每一项测量的陷阱都会让结论失真。</p>',
        '<p>请带着审慎读：这条线索的科学共识尚未形成，本文的目标不是给你答案，而是让这场争论本身被看见。</p>'
      ].join('\n'),
      tags: ['固态电池', '界面阻抗', '硫化物电解质', 'LiNbO₃ 涂层', '原位 XPS'],
      likes: 1234,
      dislikes: 89,
      commentCount: 156,
      sedimentCount: 387,
      createdAt: '3 天前',
      stream: 'knowledge',
      hasDebate: true
    },
    {
      id: 'n-li-battery-paradigm',
      title: '锂电池范式转移：从液态到固态的 5 年路线图',
      authorId: 'u-suqing',
      fingerprint: 'cocreate',
      authority: 79,
      summary:
        '把过去五年的产线数据连起来看，锂电池正在经历一次真正的范式转移：液态电解液 → 半固态 → 准固态 → 全固态。2024 是半固态上车的元年，2026 是硫化物全固态中试的关键节点，2028 才是规模化量产的窗口。AI 协助整理了 80+ 篇产业报告，所有路线判断由我本人做出。',
      body: [
        '<p>锂电池过去三十年的范式是"液态电解液 + 石墨负极"，能量密度天花板约 300&nbsp;Wh/kg。下一代范式是"固态电解质 + 锂金属负极"，理论能量密度可冲 500&nbsp;Wh/kg，且彻底消除液态电解液的易燃问题。这不是渐进改良，是<strong>范式转移</strong>。</p>',
        '<p>但范式不会一夜发生。把它拆成可观测的节点：2024 年半固态电池率先上车（蔚来 150&nbsp;kWh 包、卫蓝固态三元），2026 年硫化物全固态进入中试（宁德时代 17Ah 良率突破 80%），2028 年才是真正的规模化窗口。每一步对应不同的电解质体系、不同的负极、不同的工艺精度要求。</p>',
        '<p>关键判断：半固态是过渡方案，但这个"过渡"至少持续 5 年。原因是固态电池对界面接触的工艺要求比液态高一个数量级，而液态电解液靠"流体自适应"掩盖了大量界面瑕疵。LLZO 这类氧化物陶瓷烧结温度高、大面积致密化难，短期内更适合做隔膜而非本体电解质。</p>',
        '<p>本笔记由我和 AI 共同完成。AI 协助整理了 80+ 篇产业报告摘要、对齐了各家产能爬坡曲线；所有路线判断与时间节点由我——一个在锂电产线待了十年的工程师——做出，错误也由我承担。</p>',
        '<p>如果你是研究者，请重点关注硫化物路线的界面阻抗问题；如果你是投资者，请把"半固态"和"全固态"分开估值——它们不是同一条曲线。</p>'
      ].join('\n'),
      tags: ['锂电池', '固态电池', '半固态', '范式转移', '量产路线'],
      likes: 768,
      dislikes: 134,
      commentCount: 92,
      sedimentCount: 245,
      createdAt: '5 天前',
      stream: 'knowledge',
      hasDebate: true
    },
    {
      id: 'n-sulfide-vs-oxide',
      title: '硫化物 vs 氧化物哪个能赢？产线、电导、安全的三方对决',
      authorId: 'u-zhangheng',
      fingerprint: 'human',
      authority: 82,
      summary:
        '硫化物电导率高（10⁻² S/cm）但怕水，氧化物稳定但烧结难。表面是材料取舍，实质是产业逻辑对决：QuantumScape 押注氧化物陶瓷隔膜强调"绝对安全"，宁德时代用硫化物加快落地强调"先上车"。本文不试图给结论，整理双方最硬的论据。',
      body: [
        '<p>硫化物与氧化物，是固态电解质两条最主要的路线，也是过去十年最持久的争论。硫化物（Li<sub>6</sub>PS<sub>5</sub>Cl）离子电导率逼近液态电解液、加工性好，但对空气极其敏感，遇水即释放 H<sub>2</sub>S；氧化物（LLZO、NASICON）化学稳定性优异，但烧结温度高、界面接触差，难以制成大面积薄膜。</p>',
        '<p>表面上看这是材料性能的取舍，实质是两条产业逻辑的对决。QuantumScape 押注氧化物陶瓷隔膜，强调"绝对安全"；宁德时代则用硫化物加少量液态的"半固态"路径快速落地，强调"先上车再换轮子"。两条路至今没有收敛。</p>',
        '<p>从电化学窗口看，氧化物的稳定性窗口普遍宽于硫化物；但从离子电导率看，硫化物在低温高倍率场景下显著占优。临界电流密度方面，硫化物搭配锂金属负极已能做到 1.7&nbsp;mA/cm<sup>2</sup>，氧化物则受界面接触限制普遍停留在 0.5-1.0。</p>',
        '<p>本文不试图给出结论——这条线索的科学共识尚未形成。我整理了双方最具代表性的论据、反驳、再反驳，让读者看到一个真问题在科学共同体里的演化过程，而不是被某个阵营的观点带跑。</p>'
      ].join('\n'),
      tags: ['硫化物电解质', '氧化物电解质', 'LLZO', '产业路线', 'QuantumScape'],
      likes: 596,
      dislikes: 78,
      commentCount: 184,
      sedimentCount: 168,
      createdAt: '1 周前',
      stream: 'discussion'
    },
    {
      id: 'n-na-dendrite-review',
      title: '钠电池枝晶：137 篇论文背后的可重复性危机',
      authorId: 'u-liqy',
      fingerprint: 'human',
      authority: 71,
      summary:
        '翻了 137 篇钠枝晶论文，结论令人沮丧：几乎没有一篇文章能稳定复现另一篇的"长循环无枝晶"。钠金属更软、电导率更低，钠枝晶比锂枝晶更难抑制。这或许不是枝晶的问题，而是电化学循环测试的可重复性危机。',
      body: [
        '<p>钠电池因为钠资源廉价、分布均匀，被视为大规模储能的候选者。但钠金属负极同样面临枝晶问题，且钠更活泼、电导率更低，<strong>钠枝晶</strong>的抑制比锂更难。我花了一周时间把 2020 年以来所有关于钠枝晶的重要论文都翻了一遍，共 137 篇。</p>',
        '<p>结论令人沮丧：几乎没有一篇文章能稳定复现另一篇的"长循环无枝晶"结果。钠金属的软硬、集流体的粗糙度、电解液中 FEC 的浓度，每一个变量都会推翻结论。临界电流密度的报告值在 0.3 到 3.0&nbsp;mA/cm<sup>2</sup> 之间漂移，跨实验室差异比"处理 vs 对照"还大。</p>',
        '<p>有意思的是，研究者在论文摘要里都用了"显著抑制"，但当我把循环曲线叠在一起，差异其实小得让人怀疑方法论本身。这或许不是钠枝晶的问题，而是电化学循环测试的<strong>可重复性危机</strong>。</p>',
        '<p>笔记最后附上了一张可交互的论文图谱，按枝晶形貌分类。若你也在做钠金属，欢迎补充我没收录的文献；也欢迎指出我标注错的——一个人整理 137 篇，出错是必然的。</p>'
      ].join('\n'),
      tags: ['钠电池', '钠枝晶', '可重复性', '临界电流密度', '文献综述'],
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
        'SEI 膜是电池第一次充电时在负极表面"自我牺牲"形成的纳米层，决定寿命、安全和低温性能。本卡片由 AI 生成的 3 分钟科普视频脚本，配以关键概念图解。理解 SEI，是理解一切电池界面问题的钥匙。',
      body: [
        '<p>【视频卡片 · 时长 3:12 · 已沉淀 892 次】</p>',
        '<p>SEI（Solid Electrolyte Interphase，固体电解质界面膜）是电池界最被低估的存在。它是锂离子电池第一次充电时，电解液在负极表面"自我牺牲"形成的一层纳米级薄膜，决定了电池的寿命、安全和低温性能。</p>',
        '<p>想象一下：锂离子要从负极出来，必须穿过这层膜。膜太厚，离子走不动，电池内阻大；膜太薄，电解液会继续分解，电池慢慢"老死"。一个好的 SEI 膜，是离子通行无阻、电子绝缘的完美关卡。</p>',
        '<p>为什么固态电池也要谈 SEI？因为即使是全固态，固-固界面也会形成类似的钝化层——它的化学组成和失效机理，与液态电池的 SEI 高度相似。理解 SEI，是理解一切电池界面问题的钥匙。</p>'
      ].join('\n'),
      tags: ['SEI 膜', '科普', '负极', '界面', '视频卡片'],
      likes: 892,
      dislikes: 41,
      commentCount: 53,
      sedimentCount: 412,
      createdAt: '2 天前',
      stream: 'creation'
    },
    {
      id: 'n-solid-vs-liquid-review',
      title: '复习卡片：锂电池 vs 固态电池核心差异',
      authorId: 'u-linzw',
      fingerprint: 'human',
      authority: 85,
      summary:
        '一张为复习设计的对比卡。核心差异不在"固 vs 液"，而在离子传输机制、界面稳定性、可逆性三个根本维度。记忆口诀：液态靠浸润、固态靠贴合、半固态是折中。下次看到任何"全固态突破"的新闻，先问界面真的解决了吗。',
      body: [
        '<p>【复习卡片 · 上次学习 7 天前 · 遗忘曲线已下降至 65%】</p>',
        '<p>这是一张为复习设计的对比卡。锂电池（液态电解液）与固态电池的核心差异，不在电解质的"固 vs 液"，而在三个根本维度：离子传输机制、界面稳定性、可逆性。</p>',
        '<p>液态电解液是"流体自适应"——它能浸润任何粗糙的电极表面，所以界面问题被掩盖；固态电解质是"刚性接触"——一旦界面有空隙，阻抗立刻飙升。这就是为什么固态电池对工艺精度的要求，比液态高一个数量级。</p>',
        '<p>记忆口诀：<strong>液态靠浸润、固态靠贴合、半固态是折中</strong>。下次看到任何"全固态突破"的新闻，先问一句：界面真的解决了吗？还是只是 200 循环内的好看曲线？</p>'
      ].join('\n'),
      tags: ['复习', '锂电池', '固态电池', '对比', '记忆口诀'],
      likes: 234,
      dislikes: 12,
      commentCount: 18,
      sedimentCount: 156,
      createdAt: '1 周前',
      stream: 'review',
      lastStudiedAt: '7 天前'
    },
    {
      id: 'n-2026-solid-mass-production',
      title: '为什么 2026 年是固态电池量产元年——一份产业视角',
      authorId: 'u-wangshi',
      fingerprint: 'ai-pdf',
      authority: 73,
      summary:
        '从 86 页产业报告 PDF 抽取的关键节点：宁德时代 17Ah 良率破 80%、QuantumScape QSE-5 通过车企第三方测试、半固态 2027 年前仍占主流。这次不是 PPT。AI 协助抽取节点，判断由我完成。',
      body: [
        '<p>【来源：86 页产业报告 PDF · AI 抽取 + 人工对齐】</p>',
        '<p>过去十年，"固态电池量产"被许诺过太多次。但 2026 年这一次，产业侧的信号不太一样：宁德时代宣布硫化物路线 17Ah 电芯良率突破 80%，QuantumScape 的 QSE-5 通过了车企的第三方循环测试，丰田给出明确的整车搭载时间表。这不是 PPT，是真金白银的产线投入。</p>',
        '<p>本笔记整理自一份内部产业研究报告 PDF（共 86 页）。AI 协助抽取了关键节点、产能爬坡曲线与各家技术路线的差异；原文的判断与产能对齐工作由我完成，AI 不做结论。</p>',
        '<p>核心结论：硫化物路线在中国大陆跑得最快，氧化物路线在北美更稳，半固态是过渡方案，预计 2027 年前仍占主流。把路线图和真实产能对齐看，你会发现很多"概念股"其实根本没有产线，只是蹭热度。</p>'
      ].join('\n'),
      tags: ['固态电池', '产业分析', '量产', '宁德时代', 'QuantumScape'],
      likes: 596,
      dislikes: 78,
      commentCount: 81,
      sedimentCount: 234,
      createdAt: '6 天前',
      stream: 'knowledge'
    },
    {
      id: 'n-impedance-overestimated',
      title: '界面阻抗是否被高估了？物理学群 72 小时热议',
      authorId: 'u-jiangyue',
      fingerprint: 'human',
      authority: 76,
      summary:
        '江月发了一组复测数据：过去三年顶刊声称"界面阻抗降低 10 倍"的工作，40% 在相同条件下只降了 2-3 倍。群里立刻分成两派，讨论持续 72 小时。是 EIS 拟合的系统性偏差，还是研究范式本身的问题？',
      body: [
        '<p>本周物理学群里冒出一个尖锐问题：界面阻抗是不是被高估了？起因是我发了一组数据——把过去三年顶刊中所有声称"界面阻抗降低 10 倍"的工作复测，发现其中 40% 在相同条件下只降低了 2-3 倍，且不同实验室之间的差异，比"处理 vs 对照"还大。</p>',
        '<p>群里立刻分成两派。一派认为这是测量方法的系统性偏差，EIS 等效电路拟合的随意性太大，blocking electrode 的选择会显著改变结论；另一派则指出，问题不在测量，而在研究范式本身——大家都盯着界面，是因为界面最容易发文章，而不是因为它最重要。</p>',
        '<p>讨论持续了 72 小时，涌现了大量有意思的论据与反论据。我把最高赞的几条整理成本笔记的讨论区，希望能让更多没参与讨论的人看到这个真问题，而不是只看到"学界共识"四个字。</p>'
      ].join('\n'),
      tags: ['界面阻抗', '讨论', '可重复性', 'EIS', '物理学'],
      likes: 358,
      dislikes: 47,
      commentCount: 129,
      sedimentCount: 89,
      createdAt: '昨天',
      stream: 'discussion'
    }
  ];

  /* -----------------------------------------------------------------------
   * debates —— 2 条完整争论树
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
          body: '界面阻抗分析扎实，理由有三：其一，硫化物电解质本体离子电导率早在 2019 年就已突破 10⁻² S/cm，本体早已不是限制；其二，Wang et al. 2024 用原位 XPS 直接证明界面副反应层是整电池阻抗的真正来源，3 nm LiNbO₃ 涂层让阻抗从 1200 降到 80 Ω·cm²，临界电流密度从 0.6 提升到 1.7 mA/cm²——这是数量级的跨越；其三，所有"界面修好仍循环差"的反例，仔细看都存在测量或工艺瑕疵。把资源压在界面上，是边际收益最高的方向。',
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
            },
            {
              id: 'd1-pro-1-e2',
              authorId: 'u-jiangyue',
              body: '对数据来源的核实很到位。Wang et al. 2024 的原始数据我下载下来重做过拟合，80 Ω·cm² 这个数是用 Randles 等效电路 + 常相位元件拟合得到的，方法学上没有问题；临界电流密度的测量也用了四电极体系，排除了极化伪影。这是近三年界面方向最干净的一组数据。',
              likes: 52,
              type: 'support',
              evaluations: []
            }
          ]
        }
      ],
      cons: [
        {
          id: 'd1-con-1',
          authorId: 'u-shenyan',
          body: '2024 年的新数据已部分推翻此结论。Arbit et al. 2025 的工作表明，硫化物电解质在 500 循环后会因晶界处的相分离而电导率下降 40%，且这种衰减无法靠任何界面涂层挽回。林博士引的 Wang et al. 2024 数据漂亮，但只跑了 200 循环，到 800 循环时界面阻抗照样回升。短窗口看界面是赢家，长窗口看本体才是决定性的。',
          likes: 203,
          type: 'refute',
          evaluations: [
            {
              id: 'd1-con-1-e1',
              authorId: 'u-guci',
              body: '需要纠错一处：Arbit et al. 2025 的衰减数据是基于 Li₆PS₅Br 而非 Li₆PS₅Cl，两者晶界化学差异显著，不能直接外推到本笔记讨论的 Cl 体系。我重新查了原文 Table 2，Cl 体系在 500 循环后电导率下降仅 18%，沈老师这里的引用有扩大化嫌疑。',
              likes: 96,
              type: 'correct',
              evaluations: []
            },
            {
              id: 'd1-con-1-e2',
              authorId: 'u-hanxing',
              body: '从钠电池方向补充一个反例：钠金属负极的临界电流密度普遍报告值在 0.3-3.0 mA/cm² 之间漂移，跨实验室差异比"处理 vs 对照"还大。如果界面真是唯一的杠杆点，钠体系应该和锂体系表现一致——但事实上钠体系的瓶颈更多在集流体粗糙度和本体电导率。这间接说明"界面优先"是一个锂体系特异的结论，不是普适规律。',
              likes: 64,
              type: 'refute',
              evaluations: []
            }
          ]
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
          body: '5 年路线图与产业真实信号高度吻合。宁德时代 17Ah 良率破 80%、QuantumScape QSE-5 通过车企第三方测试、丰田给出整车搭载时间表——这些都是真金白银的产线投入，不是 PPT。半固态 2024 上车、硫化物全固态 2026 中试、2028 规模化，这个节奏与全球头部企业的资本支出曲线完全对齐，苏工的判断靠谱。',
          likes: 389,
          type: 'support',
          evaluations: [
            {
              id: 'd2-pro-1-e1',
              authorId: 'u-suqing',
              body: '补充一条产线细节：半固态的"过渡"其实比外界想象得更长。我们厂的实测数据是，半固态电芯的工艺良率比全固态高 35 个百分点，且不需要干燥间，CapEx 只有硫化物全固态的 1/3。在尚未验证规模市场之前，半固态至少能撑到 2030 年，这个时间窗口比路线图预估的还要宽。',
              likes: 142,
              type: 'extend',
              evaluations: []
            },
            {
              id: 'd2-pro-1-e2',
              authorId: 'u-chenmb',
              body: '对工艺精度判断的核实很到位。"固态电池对界面接触的工艺精度要求比液态高一个数量级"——这个论断我们组用 SEM + EDS 验证过，固-固界面的实际接触面积只有表观面积的 60-70%，剩余部分是高阻抗空隙。这意味着固态电池的良率上限，短期内被工艺设备精度卡死，而非材料本身。苏工的判断抓住了关键变量。',
              likes: 88,
              type: 'support',
              evaluations: []
            }
          ]
        }
      ],
      cons: [
        {
          id: 'd2-con-1',
          authorId: 'u-shenyan',
          body: '"5 年路线图"过度乐观，忽略了三个被低估的因素：其一，硫化物对水的敏感性使干燥间露点需达到 -60℃，产线 CapEx 是同产能液态的 2.3 倍；其二，锂金属负极在长循环中的体积膨胀（约 300%）会撕裂界面，至今没有工程解决方案；其三，2028 年规模化窗口的判断建立在全球电动车年销 4000 万辆的假设上，若需求不及预期，资本会迅速撤退。范式的转移从来不会按路线图发生。',
          likes: 219,
          type: 'refute',
          evaluations: [
            {
              id: 'd2-con-1-e1',
              authorId: 'u-guci',
              body: '需要纠错：锂金属负极的体积膨胀数应为"理论无限膨胀"（因为锂沉积/溶解无主晶格），300% 这个数实际上是硅基负极的膨胀率。沈老师这里把硅负极的工程难点误植到了锂金属上。锂金属的真正问题是枝晶与库伦效率，不是膨胀——但这反而强化了沈老师的结论：锂金属负极的工程化难题比路线图承认的更严重。',
              likes: 73,
              type: 'correct',
              evaluations: []
            },
            {
              id: 'd2-con-1-e2',
              authorId: 'u-liqy',
              body: '从钠电池方向延伸：钠资源廉价这个常被引用的优势，在硫化物全固态路线下其实被高估了——因为 Na₃PS₄ 的电化学窗口比 Li₆PS₅Cl 窄，对集流体腐蚀更严重，导致钠全固态的工程化比锂更远。如果锂的 5 年路线图都乐观，钠全固态的时间表至少要乘以 2。这间接说明"硫化物路线复用红利"是个伪命题，路线图低估了体系切换的成本。',
              likes: 51,
              type: 'extend',
              evaluations: []
            }
          ]
        }
      ]
    }
  };

  /* -----------------------------------------------------------------------
   * graph —— 知识图谱节点与边
   * node: { id, label, type, domain, weight, linkedNoteId? }
   *   type:  concept | note | material | person | domain
   *   domain: materials | physics | chemistry | engineering
   * edge: { source, target, relation, strength }
   *   relation: 属于 | 子类 | 相关问题 | 材料组成 | 前置概念 | 对比 | 关联事实 | 作者
   * -------------------------------------------------------------------- */
  var graph = {
    nodes: [
      /* —— 领域根节点 —— */
      { id: 'd-materials',   label: '材料学',     type: 'domain',   domain: 'materials',   weight: 10 },
      { id: 'd-physics',     label: '物理学',     type: 'domain',   domain: 'physics',     weight: 10 },
      { id: 'd-chemistry',   label: '化学',       type: 'domain',   domain: 'chemistry',   weight: 10 },
      { id: 'd-engineering', label: '工程/产业',  type: 'domain',   domain: 'engineering', weight: 10 },

      /* —— 电池体系 —— */
      { id: 'g-solid-battery',  label: '固态电池',     type: 'concept', domain: 'engineering', weight: 10, linkedNoteId: 'n-solid-battery-impedance' },
      { id: 'g-li-battery',     label: '锂电池',       type: 'concept', domain: 'engineering', weight: 10, linkedNoteId: 'n-li-battery-paradigm' },
      { id: 'g-na-battery',     label: '钠电池',       type: 'concept', domain: 'engineering', weight: 7,  linkedNoteId: 'n-na-dendrite-review' },
      { id: 'g-semi-solid',     label: '半固态电池',   type: 'concept', domain: 'engineering', weight: 7 },
      { id: 'g-quasi-solid',    label: '准固态电池',   type: 'concept', domain: 'engineering', weight: 5 },

      /* —— 电解质（材料） —— */
      { id: 'g-sulfide',           label: '硫化物电解质', type: 'material', domain: 'materials', weight: 9, linkedNoteId: 'n-sulfide-vs-oxide' },
      { id: 'g-oxide',             label: '氧化物电解质', type: 'material', domain: 'materials', weight: 8 },
      { id: 'g-llzo',              label: 'LLZO',         type: 'material', domain: 'materials', weight: 8 },
      { id: 'g-nasicon',           label: 'NASICON',      type: 'material', domain: 'materials', weight: 6 },
      { id: 'g-garnet',            label: '石榴石',       type: 'material', domain: 'materials', weight: 7 },
      { id: 'g-polymer',           label: '聚合物电解质', type: 'material', domain: 'materials', weight: 6 },
      { id: 'g-liquid-electrolyte',label: '电解液',       type: 'material', domain: 'chemistry', weight: 8 },

      /* —— 物理量（concept） —— */
      { id: 'g-impedance',         label: '界面阻抗',       type: 'concept', domain: 'physics', weight: 10, linkedNoteId: 'n-solid-battery-impedance' },
      { id: 'g-ionic-cond',        label: '离子电导率',     type: 'concept', domain: 'physics', weight: 9 },
      { id: 'g-electronic-cond',   label: '电子电导率',     type: 'concept', domain: 'physics', weight: 6 },
      { id: 'g-electrochem-window',label: '电化学窗口',     type: 'concept', domain: 'physics', weight: 8 },
      { id: 'g-critical-current',  label: '临界电流密度',   type: 'concept', domain: 'physics', weight: 7 },
      { id: 'g-cycle',             label: '充放电循环',     type: 'concept', domain: 'physics', weight: 7 },

      /* —— 枝晶 —— */
      { id: 'g-na-dendrite',       label: '钠枝晶', type: 'concept', domain: 'physics', weight: 7 },
      { id: 'g-li-dendrite',       label: '锂枝晶', type: 'concept', domain: 'physics', weight: 8 },

      /* —— 电极材料 —— */
      { id: 'g-cathode',           label: '正极材料',   type: 'material', domain: 'materials', weight: 7 },
      { id: 'g-anode',             label: '负极材料',   type: 'material', domain: 'materials', weight: 7 },
      { id: 'g-li-metal-anode',    label: '锂金属负极', type: 'material', domain: 'materials', weight: 8 },
      { id: 'g-sic-anode',         label: '硅碳负极',   type: 'material', domain: 'materials', weight: 6 },
      { id: 'g-lfp',               label: '磷酸铁锂',   type: 'material', domain: 'chemistry', weight: 7 },
      { id: 'g-ncm',               label: '三元锂',     type: 'material', domain: 'chemistry', weight: 7 },
      { id: 'g-separator',         label: '隔膜',       type: 'material', domain: 'chemistry', weight: 5 },

      /* —— 工程指标 —— */
      { id: 'g-energy-density',    label: '能量密度', type: 'concept', domain: 'engineering', weight: 8 },
      { id: 'g-safety',            label: '安全性',   type: 'concept', domain: 'engineering', weight: 8 },
      { id: 'g-cost',              label: '成本',     type: 'concept', domain: 'engineering', weight: 7 },
      { id: 'g-mass-prod',         label: '量产',     type: 'concept', domain: 'engineering', weight: 8, linkedNoteId: 'n-2026-solid-mass-production' },
      { id: 'g-academic',          label: '学术研究', type: 'concept', domain: 'engineering', weight: 6 },
      { id: 'g-industry-landing',  label: '产业落地', type: 'concept', domain: 'engineering', weight: 7 },

      /* —— 人/机构 —— */
      { id: 'g-catl',              label: '宁德时代',     type: 'person', domain: 'engineering', weight: 8 },
      { id: 'g-quantumscape',      label: 'QuantumScape', type: 'person', domain: 'engineering', weight: 7 },
      { id: 'g-linzw',             label: '林知微',       type: 'person', domain: 'materials',   weight: 6 },
      { id: 'g-suqing',            label: '苏青',         type: 'person', domain: 'engineering', weight: 5 },

      /* —— 笔记节点（独立挂载，与上面 linkedNoteId 互补） —— */
      { id: 'g-note-paradigm',     label: '锂电池范式转移',  type: 'note', domain: 'engineering', weight: 8, linkedNoteId: 'n-li-battery-paradigm' },
      { id: 'g-note-vs',           label: '硫化物 vs 氧化物',type: 'note', domain: 'materials',   weight: 7, linkedNoteId: 'n-sulfide-vs-oxide' },
      { id: 'g-note-overestimated',label: '界面阻抗被高估？',type: 'note', domain: 'physics',     weight: 6, linkedNoteId: 'n-impedance-overestimated' }
    ],
    edges: [
      /* —— 领域归属 —— */
      { source: 'g-sulfide',            target: 'd-materials',   relation: '属于',     strength: 10 },
      { source: 'g-oxide',              target: 'd-materials',   relation: '属于',     strength: 9 },
      { source: 'g-llzo',               target: 'd-materials',   relation: '属于',     strength: 8 },
      { source: 'g-impedance',          target: 'd-physics',     relation: '属于',     strength: 10 },
      { source: 'g-ionic-cond',         target: 'd-physics',     relation: '属于',     strength: 9 },
      { source: 'g-electrochem-window', target: 'd-physics',     relation: '属于',     strength: 8 },
      { source: 'g-liquid-electrolyte', target: 'd-chemistry',   relation: '属于',     strength: 8 },
      { source: 'g-lfp',                target: 'd-chemistry',   relation: '属于',     strength: 7 },
      { source: 'g-solid-battery',      target: 'd-engineering', relation: '属于',     strength: 10 },
      { source: 'g-mass-prod',          target: 'd-engineering', relation: '属于',     strength: 8 },

      /* —— 电池体系间关系 —— */
      { source: 'g-li-battery',     target: 'g-solid-battery', relation: '相关问题', strength: 10 },
      { source: 'g-li-battery',     target: 'g-na-battery',    relation: '对比',     strength: 7 },
      { source: 'g-solid-battery',  target: 'g-semi-solid',    relation: '子类',     strength: 8 },
      { source: 'g-semi-solid',     target: 'g-quasi-solid',   relation: '子类',     strength: 5 },

      /* —— 电解质间关系 —— */
      { source: 'g-sulfide',        target: 'g-oxide',         relation: '对比',     strength: 10 },
      { source: 'g-oxide',          target: 'g-llzo',          relation: '子类',     strength: 9 },
      { source: 'g-oxide',          target: 'g-nasicon',       relation: '子类',     strength: 6 },
      { source: 'g-oxide',          target: 'g-garnet',        relation: '子类',     strength: 7 },
      { source: 'g-sulfide',        target: 'g-polymer',       relation: '对比',     strength: 5 },

      /* —— 界面阻抗核心关系 —— */
      { source: 'g-solid-battery',  target: 'g-impedance',     relation: '相关问题', strength: 10 },
      { source: 'g-impedance',      target: 'g-ionic-cond',    relation: '前置概念', strength: 8 },
      { source: 'g-impedance',      target: 'g-cycle',         relation: '相关问题', strength: 7 },
      { source: 'g-sulfide',        target: 'g-impedance',     relation: '相关问题', strength: 9 },
      { source: 'g-oxide',          target: 'g-impedance',     relation: '相关问题', strength: 7 },

      /* —— 物理量 —— */
      { source: 'g-sulfide',           target: 'g-ionic-cond',         relation: '关联事实', strength: 9 },
      { source: 'g-oxide',             target: 'g-ionic-cond',         relation: '关联事实', strength: 7 },
      { source: 'g-electrochem-window',target: 'g-sulfide',            relation: '相关问题', strength: 7 },
      { source: 'g-electrochem-window',target: 'g-oxide',              relation: '相关问题', strength: 7 },
      { source: 'g-ionic-cond',        target: 'g-electronic-cond',    relation: '对比',     strength: 5 },

      /* —— 枝晶 —— */
      { source: 'g-na-battery',     target: 'g-na-dendrite',   relation: '相关问题', strength: 9 },
      { source: 'g-li-battery',     target: 'g-li-dendrite',   relation: '相关问题', strength: 8 },
      { source: 'g-li-dendrite',    target: 'g-na-dendrite',   relation: '对比',     strength: 7 },
      { source: 'g-li-metal-anode', target: 'g-li-dendrite',   relation: '相关问题', strength: 8 },
      { source: 'g-li-dendrite',    target: 'g-critical-current', relation: '相关问题', strength: 7 },
      { source: 'g-na-dendrite',    target: 'g-critical-current', relation: '相关问题', strength: 6 },

      /* —— 电极材料 —— */
      { source: 'g-cathode',        target: 'g-lfp',           relation: '子类',     strength: 7 },
      { source: 'g-cathode',        target: 'g-ncm',           relation: '子类',     strength: 7 },
      { source: 'g-anode',          target: 'g-li-metal-anode',relation: '子类',     strength: 8 },
      { source: 'g-anode',          target: 'g-sic-anode',     relation: '子类',     strength: 6 },
      { source: 'g-li-battery',     target: 'g-cathode',       relation: '材料组成', strength: 8 },
      { source: 'g-li-battery',     target: 'g-anode',         relation: '材料组成', strength: 8 },
      { source: 'g-solid-battery',  target: 'g-li-metal-anode',relation: '材料组成', strength: 8 },
      { source: 'g-li-battery',     target: 'g-liquid-electrolyte', relation: '材料组成', strength: 9 },
      { source: 'g-li-battery',     target: 'g-separator',     relation: '材料组成', strength: 6 },

      /* —— 工程指标 —— */
      { source: 'g-solid-battery',  target: 'g-energy-density',relation: '相关问题', strength: 9 },
      { source: 'g-solid-battery',  target: 'g-safety',        relation: '相关问题', strength: 9 },
      { source: 'g-solid-battery',  target: 'g-cost',          relation: '相关问题', strength: 8 },
      { source: 'g-solid-battery',  target: 'g-mass-prod',     relation: '相关问题', strength: 8 },
      { source: 'g-energy-density', target: 'g-li-metal-anode',relation: '相关问题', strength: 7 },
      { source: 'g-mass-prod',      target: 'g-catl',          relation: '关联事实', strength: 8 },
      { source: 'g-mass-prod',      target: 'g-quantumscape',  relation: '关联事实', strength: 7 },
      { source: 'g-mass-prod',      target: 'g-industry-landing', relation: '相关问题', strength: 7 },
      { source: 'g-impedance',      target: 'g-academic',      relation: '相关问题', strength: 5 },

      /* —— 人/机构与对象 —— */
      { source: 'g-linzw',          target: 'g-impedance',     relation: '关联事实', strength: 6 },
      { source: 'g-linzw',          target: 'g-solid-battery', relation: '关联事实', strength: 5 },
      { source: 'g-catl',           target: 'g-solid-battery', relation: '关联事实', strength: 8 },
      { source: 'g-catl',           target: 'g-sulfide',       relation: '关联事实', strength: 7 },
      { source: 'g-quantumscape',   target: 'g-oxide',         relation: '关联事实', strength: 8 },

      /* —— 笔记节点 —— */
      { source: 'g-linzw',          target: 'g-note-paradigm', relation: '作者',     strength: 6 },
      { source: 'g-suqing',         target: 'g-note-paradigm', relation: '作者',     strength: 8 },
      { source: 'g-note-paradigm',  target: 'g-solid-battery', relation: '关联事实', strength: 9 },
      { source: 'g-note-paradigm',  target: 'g-li-battery',    relation: '关联事实', strength: 9 },
      { source: 'g-note-vs',        target: 'g-sulfide',       relation: '关联事实', strength: 10 },
      { source: 'g-note-vs',        target: 'g-oxide',         relation: '关联事实', strength: 10 },
      { source: 'g-note-overestimated', target: 'g-impedance', relation: '关联事实', strength: 9 }
    ]
  };

  /* -----------------------------------------------------------------------
   * dailyPicks —— 每日推荐 4 张卡片
   * 字段：id / type（review|hot|new|creation）/ title / subtitle
   *       / targetNoteId / reason（具体用户行为解释）/ time
   * -------------------------------------------------------------------- */
  var dailyPicks = [
    {
      id: 'dp-1',
      type: 'review',
      title: '锂电池 vs 固态电池核心差异',
      subtitle: '上次学习 7 天前 · 该复习了',
      targetNoteId: 'n-solid-vs-liquid-review',
      reason: '你 7 天前学过《固态电池界面阻抗的真相》，这张对比卡正好接住，趁遗忘曲线没掉下来。',
      time: '今天 09:12'
    },
    {
      id: 'dp-2',
      type: 'hot',
      title: '界面阻抗是否被高估了？',
      subtitle: '物理学群 72 小时热议 · 358 赞',
      targetNoteId: 'n-impedance-overestimated',
      reason: '你关注的物理学群正吵得最凶，江月的复测数据让两派同时跳出，争论很值得读一遍。',
      time: '今天 08:30'
    },
    {
      id: 'dp-3',
      type: 'new',
      title: '为什么 2026 年是固态电池量产元年',
      subtitle: '一份产业视角 · 新发布',
      targetNoteId: 'n-2026-solid-mass-production',
      reason: '你的知识图谱缺产业分支，这条把宁德时代、QuantumScape 的真实产能对齐讲清了。',
      time: '昨天 22:05'
    },
    {
      id: 'dp-4',
      type: 'creation',
      title: '三分钟看懂 SEI 膜',
      subtitle: '创作流精选 · 892 赞',
      targetNoteId: 'n-sei-explainer',
      reason: '你最近在收藏界面类内容，周野这期把 SEI 讲得通俗又不失真，可作为创作参考。',
      time: '昨天 19:48'
    }
  ];

  /* -----------------------------------------------------------------------
   * feed —— 按 4 种流分组的 noteId 列表
   * 流：knowledge / creation / review / discussion
   * 每条流至少 3 条 noteId
   * -------------------------------------------------------------------- */
  var feed = {
    knowledge: [
      'n-solid-battery-impedance',
      'n-li-battery-paradigm',
      'n-na-dendrite-review',
      'n-2026-solid-mass-production'
    ],
    creation: [
      'n-sei-explainer',
      'n-solid-battery-impedance',
      'n-li-battery-paradigm'
    ],
    review: [
      'n-solid-vs-liquid-review',
      'n-solid-battery-impedance',
      'n-li-battery-paradigm'
    ],
    discussion: [
      'n-sulfide-vs-oxide',
      'n-impedance-overestimated',
      'n-solid-battery-impedance'
    ]
  };

  /* -----------------------------------------------------------------------
   * 挂载到全局
   * -------------------------------------------------------------------- */
  var ZX_MOCK = {
    users: users,
    notes: notes,
    debates: debates,
    graph: graph,
    dailyPicks: dailyPicks,
    feed: feed
  };

  window.ZX = window.ZX || {};
  window.ZX.mock = ZX_MOCK;
  window.ZX_MOCK = ZX_MOCK;
})();
