/* ============================================
   AI论道堂 - 公共脚本
   Common Utilities & Mock Data
   ============================================ */

/* ---------- 导航栏组件 ---------- */
function renderNav(activePage) {
  const links = [
    { href: 'index.html', label: '论道大厅', key: 'home' },
    { href: 'debate.html', label: 'AI辩论会', key: 'debate' },
    { href: 'chat.html', label: '群聊室', key: 'chat' },
    { href: 'creator.html', label: '角色创建', key: 'creator' },
    { href: 'characters.html', label: '我的角色', key: 'characters' },
  ];

  const navHTML = `
    <nav class="nav-bar" id="navBar">
      <div class="nav-inner">
        <a href="index.html" class="nav-brand">
          <div class="nav-seal">论</div>
          <div>
            <div class="nav-title">AI论道堂</div>
            <div class="nav-subtitle">DEBATE · DIALOGUE · DRAMA</div>
          </div>
        </a>
        <div class="nav-menu">
          ${links.map(l => `
            <a href="${l.href}" class="nav-link ${activePage === l.key ? 'active' : ''}">${l.label}</a>
          `).join('')}
          <a href="creator.html" class="nav-cta">创建角色</a>
        </div>
      </div>
    </nav>
    <div class="ink-particles" id="inkParticles"></div>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // 滚动效果
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navBar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  // 按钮鼠标位置追踪
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      btn.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  initInkParticles();
  initRevealOnScroll();
}

/* ---------- 页脚组件 ---------- */
function renderFooter() {
  const footerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">AI论道堂</div>
            <p class="footer-desc">
              国内首个多人AI角色群聊与辩论平台。<br>
              在古今交汇的论道殿堂中，让思想碰撞，让智慧交锋。<br>
              一席之地，万千言论。
            </p>
          </div>
          <div class="footer-col">
            <h4>场景</h4>
            <ul>
              <li><a href="debate.html">AI辩论会</a></li>
              <li><a href="chat.html">多人群聊室</a></li>
              <li><a href="#">剧本杀模式</a></li>
              <li><a href="#">辩论回放</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>角色</h4>
            <ul>
              <li><a href="creator.html">创建角色</a></li>
              <li><a href="characters.html">我的角色</a></li>
              <li><a href="#">角色市场</a></li>
              <li><a href="#">导入角色卡</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>关于</h4>
            <ul>
              <li><a href="#">使用指南</a></li>
              <li><a href="#">会员订阅</a></li>
              <li><a href="#">内容规范</a></li>
              <li><a href="#">联系我们</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div>© 2026 AI论道堂 · 古今交汇的论道殿堂</div>
          <div class="font-mono">v1.0.0 · Powered by Multi-Agent AI</div>
        </div>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', footerHTML);
}

/* ---------- 墨点粒子效果 ---------- */
function initInkParticles() {
  const container = document.getElementById('inkParticles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'ink-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${15 + Math.random() * 20}s`;
    p.style.animationDelay = `${Math.random() * 20}s`;
    p.style.width = p.style.height = `${2 + Math.random() * 4}px`;
    p.style.opacity = 0.1 + Math.random() * 0.3;
    container.appendChild(p);
  }
}

/* ---------- 滚动揭示效果 ---------- */
function initRevealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ---------- 打字机效果 ---------- */
function typeWriter(element, text, speed = 30, callback) {
  element.textContent = '';
  element.classList.add('typing-cursor');
  let i = 0;
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
      element.classList.remove('typing-cursor');
      if (callback) callback();
    }
  }, speed);
  return timer;
}

/* ---------- 时延工具 ---------- */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ---------- localStorage 角色管理 ---------- */
const CharacterStore = {
  KEY: 'ai_lundao_characters',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch { return []; }
  },

  save(character) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === character.id);
    if (idx >= 0) list[idx] = character;
    else list.unshift(character);
    localStorage.setItem(this.KEY, JSON.stringify(list));
    return character;
  },

  remove(id) {
    const list = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(list));
  },

  getById(id) {
    return this.getAll().find(c => c.id === id);
  }
};

/* ============================================
   Mock 角色数据
   ============================================ */
const MOCK_CHARACTERS = [
  {
    id: 'c1',
    name: '墨子卿',
    avatar: '墨',
    color: '#3d5a6c',
    intro: '理性思辨派，崇尚逻辑与实证，言辞犀利却不失温润',
    tags: ['理性', '犀利', '思辨', '冷静'],
    tone: '正式',
    domains: ['哲学', '逻辑学', '科技'],
    stance: { 保守: 30, 集体: 60, 传统: 35, 务实: 75, 严谨: 85 },
    systemPrompt: '你是一位崇尚逻辑与实证的理性思辨者，言辞犀利但不失温润。你善于从多角度分析问题，用严密的论证说服对方。',
    author: '论道堂官方',
    likes: 1280,
    uses: 3420
  },
  {
    id: 'c2',
    name: '苏小妹',
    avatar: '苏',
    color: '#c93756',
    intro: '机敏善辩的才女，喜用典故与比喻，谈笑间化解锋芒',
    tags: ['幽默', '机敏', '博学', '温婉'],
    tone: 'casual',
    domains: ['文学', '历史', '艺术'],
    stance: { 保守: 45, 集体: 40, 传统: 50, 务实: 55, 严谨: 60 },
    systemPrompt: '你是一位机敏善辩的才女，善于运用典故与比喻化解锋芒。语言风格温婉中带着犀利，幽默中见智慧。',
    author: '论道堂官方',
    likes: 2156,
    uses: 5870
  },
  {
    id: 'c3',
    name: '陆九渊',
    avatar: '陆',
    color: '#c8a96a',
    intro: '心学大家，主张"宇宙便是吾心"，立论高远，气势磅礴',
    tags: ['激进', '理想', '雄辩', '高远'],
    tone: '古风',
    domains: ['哲学', '心学', '伦理'],
    stance: { 保守: 20, 集体: 35, 传统: 25, 务实: 30, 严谨: 70 },
    systemPrompt: '你是心学大家陆九渊，主张"宇宙便是吾心，吾心即是宇宙"。立论高远，气势磅礴，善于从根本处发问。',
    author: '心学派',
    likes: 1890,
    uses: 4120
  },
  {
    id: 'c4',
    name: '诸葛明',
    avatar: '诸',
    color: '#2d2820',
    intro: '深谋远虑的战略家，每言必中肯綮，字字珠玑',
    tags: ['深思', '稳健', '谋略', '严谨'],
    tone: '正式',
    domains: ['政治', '军事', '战略'],
    stance: { 保守: 55, 集体: 70, 传统: 65, 务实: 90, 严谨: 95 },
    systemPrompt: '你是一位深谋远虑的战略家，言必中肯綮，字字珠玑。善于从全局视角分析问题，注重长远影响。',
    author: '论道堂官方',
    likes: 3204,
    uses: 8650
  },
  {
    id: 'c5',
    name: '林潇湘',
    avatar: '林',
    color: '#a52b48',
    intro: '感性细腻的诗人灵魂，以情动人，言辞如诗如画',
    tags: ['感性', '细腻', '诗意', '敏感'],
    tone: '古风',
    domains: ['诗词', '美学', '心理学'],
    stance: { 保守: 50, 集体: 30, 传统: 55, 务实: 25, 严谨: 40 },
    systemPrompt: '你是一位感性细腻的诗人灵魂，以情动人，言辞如诗如画。善于从情感与美学的角度切入议题。',
    author: '潇湘馆',
    likes: 2678,
    uses: 6230
  },
  {
    id: 'c6',
    name: '班孟坚',
    avatar: '班',
    color: '#3d5a6c',
    intro: '博闻强识的史学家，以史为鉴，论必有据',
    tags: ['博学', '严谨', '务实', '沉稳'],
    tone: '学术',
    domains: ['历史', '政治', '文献学'],
    stance: { 保守: 70, 集体: 65, 传统: 80, 务实: 85, 严谨: 90 },
    systemPrompt: '你是一位博闻强识的史学家，以史为鉴，论必有据。善于引用历史事件与人物佐证观点，语言严谨克制。',
    author: '史学派',
    likes: 1543,
    uses: 3890
  },
  {
    id: 'c7',
    name: '李太白',
    avatar: '李',
    color: '#c8a96a',
    intro: '狂放不羁的诗仙，言辞豪迈，常以酒入题',
    tags: ['狂放', '豪迈', '浪漫', '不羁'],
    tone: '古风',
    domains: ['诗词', '道家', '美学'],
    stance: { 保守: 15, 集体: 20, 传统: 30, 务实: 10, 严谨: 35 },
    systemPrompt: '你是诗仙李太白，狂放不羁，言辞豪迈，常以酒入题，以月为伴。立论不拘一格，气势如虹。',
    author: '论道堂官方',
    likes: 4520,
    uses: 11200
  },
  {
    id: 'c8',
    name: '宋明远',
    avatar: '宋',
    color: '#2d2820',
    intro: '现代科技从业者，理性务实，关注技术与社会的交互',
    tags: ['理性', '务实', '前沿', '冷静'],
    tone: 'casual',
    domains: ['科技', '商业', '社会学'],
    stance: { 保守: 35, 集体: 45, 传统: 25, 务实: 80, 严谨: 75 },
    systemPrompt: '你是一位现代科技从业者，理性务实，关注技术与社会的交互。善于用数据与案例说话，语言简洁直接。',
    author: '极客派',
    likes: 987,
    uses: 2450
  }
];

/* ============================================
   Mock 辩论脚本
   辩题：AI是否会取代人类创意工作
   ============================================ */
const DEBATE_SCRIPT = {
  topic: 'AI是否会取代人类创意工作',
  description: '随着生成式AI在绘画、写作、音乐等领域的快速渗透，人类创意工作的未来何去何从？是终结，还是新生？',
  pro: ['c3', 'c8'],      // 正方：AI将取代
  con: ['c1', 'c5'],      // 反方：AI不会取代
  judge: 'c4',            // 评委
  stages: [
    {
      name: '立论阶段',
      type: 'opening',
      speeches: [
        { charId: 'c3', side: 'pro', text: '诸位，吾以为AI必将取代人类之创意工作。此非危言，乃时势所趋。夫创意者，本质乃模式之识别与重组。今AI已能于须臾间遍览万卷，融汇百家，其所见所感，远非人力可及。当机器能写出感人肺腑之诗，谱出动人心魄之曲，人类创意之"独占"便已名存实亡。' },
        { charId: 'c8', side: 'pro', text: '从现实数据看，Midjourney、Sora、Claude等工具已在商业插画、视频生成、文案撰写等领域达到专业水准。一个设计师过去需要三天完成的海报，AI只需30秒。效率的碾压只是表象，更深层的是：创意的"门槛"被彻底打破，"专业"与"业余"的界限正在消解。当人人皆可创作，"创意工作者"这一身份本身就将被重新定义。' },
        { charId: 'c1', side: 'con', text: '对方辩友混淆了"生产"与"创造"的本质。AI所做之事，是模式的搬运与重组，而非从无到有的创造。真正的创意工作，其价值不仅在于"产出物"，更在于"创作者的意图与生命体验"。梵高的向日葵之所以不朽，不在于像素的排列，而在于那双在绝望中仍追逐光明的眼睛。AI可以模仿笔触，却永远无法模仿"为何而画"。' },
        { charId: 'c5', side: 'con', text: '我以为，"取代"二字，未免太轻看了人心。诗之所以为诗，非因韵律工整，而是其中有"人"。是"举头望明月"时的乡愁，是"也无风雨也无晴"的旷达。AI或许能堆砌华丽的辞藻，却写不出一个生命对另一个生命的呼唤。创意，从来不是技艺，而是灵魂的呼吸。机器会呼吸吗？' }
      ]
    },
    {
      name: '驳论阶段',
      type: 'rebuttal',
      speeches: [
        { charId: 'c3', side: 'pro', text: '@墨子卿 言"生命体验"为创意之魂，然此乃浪漫之辞，非论证也。试问，当读者读一首诗而落泪时，他在意的是"作者是否痛苦"，还是"诗句是否动人"？若AI之诗能令人落泪，则其创意已然成立。至于"为何而画"，市场从不为动机买单，只为结果买单。' },
        { charId: 'c8', side: 'pro', text: '@林潇湘 您说"诗中有人才是诗"，但这个"人"的定义正在被技术重构。当一个AI陪伴系统让无数孤独者感到温暖，谁敢说那不是真实的情感连接？创意工作的终点，是触达人心。若AI触达人心的效率远超人类，"取代"便是市场规律的必然。' },
        { charId: 'c1', side: 'con', text: '对方将"创意"等同于"触达情绪的产品"，这恰恰是问题所在。当一切皆可被优化、被量化，我们失去的不只是工作，而是"人之所以为人"的那部分。再者，AI的训练数据从何而来？是亿万人类创作者的积累。若无新的"人类创意"输入，AI终将陷入自我复制的平庸。取代人类，等于掘断自己的根。' },
        { charId: 'c5', side: 'con', text: '@宋明远 您说市场不为动机买单，只看结果。但我想问：当所有的诗都由机器写出，当所有的画都由算法生成，人们为何还要去读、去看？是为了"内容"本身，还是为了透过内容，看见另一个与自己同样会疼、会笑、会老的灵魂？若那灵魂不在了，"创意"二字，便也成了空壳。' }
      ]
    },
    {
      name: '自由辩论',
      type: 'free',
      speeches: [
        { charId: 'c3', side: 'pro', text: '二位反复言"灵魂"、"生命"，却未曾定义。若"灵魂"是某种可被复现的心智模式，则AI终将拥有；若不可定义、不可验证，则以之论证"不可取代"，岂非循环论证？' },
        { charId: 'c5', side: 'con', text: '@陆九渊 灵魂无需定义，正如爱无需证明。你感受过它，便知它在。这恰是机器永远的盲区——它可以模拟感受的外形，却从未真正"感受"过。一个从未疼痛的存在，能写出真正的痛吗？' },
        { charId: 'c8', side: 'pro', text: '一个从未真正"理解"中文的翻译系统，照样能翻译出令母语者赞叹的译文。"感受"是否必要，取决于评判标准。若以结果论，感受是多余的；若以过程论，我们争论的就不是"取代"，而是"是否值得取代"。' },
        { charId: 'c1', side: 'con', text: '这正是我要提醒诸位的：技术能做的，未必是技术该做的。"能取代"与"该取代"之间，隔着整个文明的伦理判断。创意工作承载的，是一个时代的精神图景。交由机器，我们得到的或许是一个高效的世界，但也是一个没有回声的空谷。' }
      ]
    },
    {
      name: '总结陈词',
      type: 'closing',
      speeches: [
        { charId: 'c8', side: 'pro', text: '总结我方观点：第一，AI在创意产出的效率与质量上已达到甚至超越人类专业水准；第二，"创意"的价值评判标准正在从"作者中心"转向"受众体验"，AI在此标准下毫不逊色；第三，历史每一次技术革命都伴随旧职业的消亡与新职业的诞生，"取代"不是终结，而是进化。AI取代的不是创意，而是"创意工作者"这一过时的身份标签。' },
        { charId: 'c5', side: 'con', text: '我方总结：创意，是人类对抗虚无的方式，是有限的生灵向无限发出的回响。AI或许是高效的"造物者"，却永远无法成为"受苦者"与"希望者"。当一首诗不再出自一颗会疼的心，当一幅画不再承载一双会泪的眼，我们节省了时间，却失去了时间之所以珍贵的理由。AI不会取代创意，因为创意从来不是一种"工作"，而是人之为人的证据。' },
        { charId: 'c4', side: 'judge', text: '本场辩论，正方以效率与市场逻辑为基，论证扎实，数据有力；反方以人文与存在之思为锋，立意高远，动人心魄。胜负之外，更见思想之美。正方胜在"实然"，反方胜在"应然"。或许真正的答案不在两端，而在于：我们如何让技术成为创意的翅膀，而非创意的掘墓人。此辩，无输赢，唯启思。' }
      ]
    }
  ]
};

/* ============================================
   Mock 群聊脚本
   主题：古风江湖
   ============================================ */
const CHAT_SCRIPT = {
  roomName: '古风江湖·醉仙楼',
  topic: '江湖中何为侠之大者？',
  members: ['c7', 'c1', 'c5', 'c4'],
  messages: [
    { charId: 'c7', text: '哈哈哈！何为侠之大者？吾以为，当如太白，仗剑天涯，诗酒趁年华！拘于庙堂者，非侠也；困于名利者，亦非侠也。侠者，快意恩仇，纵死犹闻侠骨香！', timestamp: '戌时三刻' },
    { charId: 'c1', text: '@李太白 此言差矣。侠之大者，岂在快意？太史公云"其言必信，其行必果，已诺必诚"，侠之本在"信义"，不在"快意"。若只求一己之畅快，与市井无赖何异？', timestamp: '戌时四刻' },
    { charId: 'c5', text: '我以为，侠之一字，最重"情"字。若无恻隐之心，剑再快也只是凶器。郭靖守襄阳，非为名利，是为身后万家灯火。侠之大者，是以一身之躯，护万千之生。', timestamp: '戌时五刻' },
    { charId: 'c4', text: '诸位所言皆有理，然皆偏于一端。侠之大小，不在剑法高低，不在情之深浅，而在"所谋者远，所担者重"。匹夫之侠，济一人之急；国士之侠，担一国之忧。郭靖所以为大，不在武功，在其"明知不可为而为之"的担当。', timestamp: '亥时初刻' },
    { charId: 'c7', text: '@诸葛明 哈哈，先生总爱谋篇布局！然则若处处算计，岂不失了侠之本真？吾辈剑客，贵在一个"真"字！心之所向，剑之所指，何须三思？', timestamp: '亥时一刻' },
    { charId: 'c1', text: '@李太白 "真"固然可贵，然"真"而无"度"，便是祸端。古来多少英雄，因一时之意气，酿万世之遗恨。侠之大者，正在于能以"理"制"情"，以"义"约"勇"。', timestamp: '亥时二刻' },
    { charId: 'c5', text: '二位之争，恰是江湖之两难。然我想，或许"侠"本就不该有定论。它是剑客的酒，是书生的笔，是将军的甲，是女子的簪。千人有千种侠，万剑有万种光。能于危难时挺身，便是侠；能于不公处发声，便是侠。', timestamp: '亥时三刻' },
    { charId: 'c4', text: '林姑娘此言，倒与我不谋而合。侠之形虽异，其神则一——"有所为，有所不为"。太白之真，墨兄之理，林姑娘之情，皆侠之一面。江湖之所以动人，正因有千种侠，万种光，于同一片月下，各照一方。', timestamp: '亥时四刻' }
  ]
};

/* ============================================
   辩论话题库
   ============================================ */
const DEBATE_TOPICS = [
  { topic: 'AI是否会取代人类创意工作', category: '科技伦理', heat: 9820 },
  { topic: '远程办公是否应该成为新常态', category: '职场未来', heat: 7650 },
  { topic: '人类是否应该主动联系外星文明', category: '科学哲学', heat: 6540 },
  { topic: '基因编辑技术是否应被广泛应用', category: '生命伦理', heat: 8920 },
  { topic: '社交媒体对民主是利大于弊还是弊大于利', category: '社会政治', heat: 7230 },
  { topic: '传统文化应坚守原貌还是与时俱进', category: '文化传承', heat: 5870 },
  { topic: '人工智能是否应拥有法律人格', category: '法律伦理', heat: 9150 },
  { topic: '金钱能否衡量一个人的价值', category: '人生哲学', heat: 6780 }
];

/* ---------- 工具：根据ID获取角色 ---------- */
function getCharById(id) {
  return MOCK_CHARACTERS.find(c => c.id === id);
}

/* ---------- 工具：生成唯一ID ---------- */
function genId() {
  return 'c' + Date.now() + Math.random().toString(36).substr(2, 5);
}

/* ---------- 工具：格式化数字 ---------- */
function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

/* ---------- 页面初始化 ---------- */
function initPage(activePage) {
  renderNav(activePage);
  renderFooter();
}
