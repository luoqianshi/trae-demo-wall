/* ========================================================
   晚安鸭 · 故事生成引擎
   - 主角设定
   - 愿望嫁接（角色 + 主题）
   - 故事骨架（开场/发展/转折/收尾）
   - 正文生成
   - 故事库数据
   ======================================================== */

// ===== 角色库 =====
// genderPref: 'male' 男生更偏好 | 'female' 女生更偏好 | 'neutral' 中性
const ROLE_LIBRARY = {
  animal: [
    { name: '小恐龙', emoji: '🦖', trait: '有点着急但心地温柔', setting: '住在安静的森林里', genderPref: 'male' },
    { name: '小兔子', emoji: '🐰', trait: '善良但有时没耐心', setting: '住在软软的蘑菇房子里', genderPref: 'female' },
    { name: '小鸭子', emoji: '🦆', trait: '好奇又勇敢', setting: '住在池塘边的芦苇丛', genderPref: 'neutral' },
    { name: '小熊', emoji: '🐻', trait: '温暖但有点害羞', setting: '住在树洞里的蜂蜜小窝', genderPref: 'neutral' },
    { name: '小狐狸', emoji: '🦊', trait: '聪明但有时调皮', setting: '住在红叶山下的小洞穴', genderPref: 'male' },
    { name: '小猫咪', emoji: '🐱', trait: '安静但爱探险', setting: '住在老院子的屋檐下', genderPref: 'female' },
    { name: '小象', emoji: '🐘', trait: '温柔又细心', setting: '住在河边的大榕树下', genderPref: 'neutral' },
    { name: '小企鹅', emoji: '🐧', trait: '认真但有点笨拙', setting: '住在冰雪小镇里', genderPref: 'neutral' },
    { name: '小鹿', emoji: '🦌', trait: '安静又敏感', setting: '住在晨雾森林的深处', genderPref: 'female' }
  ],
  robot: [
    { name: '小机器人', emoji: '🤖', trait: '认真但有点迷糊', setting: '住在星星修理站', genderPref: 'male' },
    { name: '星星修理员', emoji: '⭐', trait: '细心又勤奋', setting: '住在夜空中的小工作间', genderPref: 'neutral' },
    { name: '小火箭', emoji: '🚀', trait: '勇敢但有时紧张', setting: '住在安静的发射台', genderPref: 'male' },
    { name: '月亮飞船', emoji: '🌙', trait: '安静又可靠', setting: '住在银河边的小码头', genderPref: 'neutral' }
  ],
  kid: [
    { name: '小豆豆', emoji: '👦', trait: '好奇又认真', setting: '住在有小院子的家里', genderPref: 'male' },
    { name: '小米粒', emoji: '👧', trait: '温柔又勇敢', setting: '住在有窗台花园的家里', genderPref: 'female' }
  ],
  custom: [
    { name: '奥特曼', emoji: '🦸', trait: '勇敢但有时想家', setting: '住在遥远的星球上', genderPref: 'male' },
    { name: '小猪佩奇', emoji: '🐷', trait: '活泼但有时有点调皮', setting: '住在山坡上的红房子里', genderPref: 'female' },
    { name: '爱莎', emoji: '❄️', trait: '温柔但有时有点孤独', setting: '住在冰雪城堡里', genderPref: 'female' },
    { name: '汪汪队', emoji: '🐕', trait: '团结又热心', setting: '住在冒险湾的小基地', genderPref: 'male' },
    { name: '超级飞侠', emoji: '✈️', trait: '乐于助人又准时', setting: '住在世界各地的机场', genderPref: 'male' },
    { name: '巧虎', emoji: '🐯', trait: '懂事又爱学习', setting: '住在巧虎岛的小房子里', genderPref: 'neutral' }
  ]
};

// ===== 主题性别偏好排序 =====
// 基于儿童发展普遍规律微调默认排序，但所有主题对所有性别开放
const THEME_GENDER_ORDER = {
  male: ['bravery', 'persistence', 'independence', 'patience', 'honesty', 'politeness', 'kindness', 'sharing', 'gratitude', 'friendship'],
  female: ['kindness', 'sharing', 'gratitude', 'patience', 'bravery', 'honesty', 'politeness', 'persistence', 'independence', 'friendship'],
  neutral: ['patience', 'bravery', 'sharing', 'honesty', 'politeness', 'kindness', 'persistence', 'independence', 'gratitude', 'friendship']
};

// ===== 主题库（对应成长教育主题）=====
const THEME_LIBRARY = {
  patience: {
    name: '耐心',
    emoji: '🌸',
    core: '慢慢等待也是一种能力',
    graft: '让主角遇到一件需要耐心等待的小事，通过等待收获温暖的结果',
    behaviors: [
      '慢慢数着数等花开',
      '不着急，一步一步来',
      '安静地等一等，好的事情就会出现',
      '虽然很想马上看到，但还是耐心地等着'
    ]
  },
  bravery: {
    name: '勇敢',
    emoji: '🦁',
    core: '小小的勇气也很了不起',
    graft: '让主角面对一个小小的害怕，发现勇敢不是没有害怕，而是带着害怕也能往前走一步',
    behaviors: [
      '虽然心里有点紧张，但还是试着去做',
      '深吸一口气，往前走了一小步',
      '发现害怕的事情其实没有那么可怕',
      '带着一点点害怕，也可以勇敢地试一试'
    ]
  },
  sharing: {
    name: '分享',
    emoji: '🎁',
    core: '好东西一起分享更快乐',
    graft: '让主角拥有一份小小的美好，然后分享给朋友，发现分享之后快乐变多了',
    behaviors: [
      '虽然很想自己留着，但还是分了一半给朋友',
      '看到朋友开心，自己心里也暖暖的',
      '分享之后发现，快乐变成了两份',
      '原来分享不是失去，而是一起拥有'
    ]
  },
  honesty: {
    name: '诚实',
    emoji: '💎',
    core: '说真话让人心里轻松',
    graft: '让主角不小心犯了一个小错误，犹豫之后选择诚实地说出来，发现坦白之后心里很轻松',
    behaviors: [
      '想了很久，还是决定如实说出来',
      '坦白之后，心里那块小石头终于放下了',
      '说真话虽然需要一点勇气，但说完之后整个人都轻松了',
      '诚实不是不犯错，而是犯错之后愿意说出来'
    ]
  },
  politeness: {
    name: '礼貌',
    emoji: '🙏',
    core: '小小的问候也是温暖',
    graft: '让主角在日常的小事情中用礼貌的方式交流，收获朋友之间的温暖',
    behaviors: [
      '轻轻说一声谢谢',
      '打扰别人的时候先说对不起',
      '用温柔的声音和朋友说话',
      '小小的问候让一整天都暖洋洋的'
    ]
  },
  persistence: {
    name: '坚持',
    emoji: '🌱',
    core: '一点一点也能走很远',
    graft: '让主角尝试一件不容易的小事，中间想过放弃，但还是坚持了下来，收获了小小的成就感',
    behaviors: [
      '虽然有点累，但还是再试了一次',
      '一点一点地，慢慢就做好了',
      '想放弃的时候，想起了朋友说过的话',
      '原来坚持不是不疲惫，而是疲惫了还愿意继续走一步'
    ]
  },
  kindness: {
    name: '善良',
    emoji: '🌸',
    core: '小小的善意也很温暖',
    graft: '让主角遇到一个需要帮助的小生命，主动伸出援手，发现善良会让心里暖暖的',
    behaviors: [
      '看到小生命需要帮助，轻轻伸出手',
      '虽然自己也不容易，但还是愿意帮一把',
      '善良不需要理由，只是心里觉得应该这样做',
      '小小的善意，让世界温柔了一点'
    ]
  },
  independence: {
    name: '独立',
    emoji: '🌟',
    core: '自己试试也是一种成长',
    graft: '让主角尝试自己做一件平时需要帮忙的事，发现独立完成的感觉很好',
    behaviors: [
      '虽然有点难，但还是想自己试一试',
      '一步一步，自己慢慢做完了',
      '原来自己也可以做到，不用总是依赖别人',
      '独立不是不需要帮助，而是愿意先自己试试'
    ]
  },
  gratitude: {
    name: '感恩',
    emoji: '💝',
    core: '看见别人对自己的好',
    graft: '让主角发现身边人为自己默默做的事，学会在心里说一声谢谢',
    behaviors: [
      '发现妈妈每天悄悄为自己做的事',
      '原来朋友的陪伴也是一种礼物',
      '在心里轻轻说一声谢谢',
      '感恩不是说出来，而是记在心里'
    ]
  },
  friendship: {
    name: '友谊',
    emoji: '🤝',
    core: '朋友之间的小温暖',
    graft: '让主角和朋友之间发生一个小小的误会或距离，最后通过一点温柔的方式重新靠近',
    behaviors: [
      '虽然吵了架，但还是想和好',
      '朋友难过的时候，安静地陪在身边',
      '一点点小礼物，让友谊更暖了',
      '友谊不是不吵架，而是吵完还愿意在一起'
    ]
  }
};

// ===== 风格库 =====
const STYLE_LIBRARY = {
  gentle: { name: '温柔入睡', desc: '语言柔软，节奏慢' },
  interesting: { name: '有趣一点', desc: '有一些轻松的小互动' },
  adventure: { name: '小小冒险', desc: '温和的探索，不刺激' }
};

// ===== 故事场景库（用于生成多样化内容）=====
const SCENE_POOL = {
  star: ['森林里的星星灯', '慢慢亮起的星星', '星星小灯需要安静等待', '星星一盏一盏地亮起来'],
  flower: ['一朵慢慢开放的花', '花苞在夜色中悄悄打开', '花瓣一片一片地舒展开', '花儿在月光下轻轻呼吸'],
  friend: ['一个迷路的小同伴', '需要帮助的小鸟', '安静的小伙伴', '一起回家的朋友'],
  home: ['温暖的小窝', '软软的毯子', '暖暖的小灯', '安静的睡前时光'],
  nature: ['轻轻吹过的晚风', '叶子慢慢飘落', '小溪静静地流', '月光温柔地洒下来']
};

// ===== 故事标题生成 =====
function generateTitle(role, theme, style) {
  const titleTemplates = [
    `{role}和{scene}`,
    `{role}的{action}`,
    `{role}发现的{thing}`,
    `关于{role}的{thing}`,
    `{role}和{thing}的故事`
  ];

  const sceneByTheme = {
    patience: ['森林里的星星灯', '慢慢开放的花', '需要等待的礼物'],
    bravery: ['夜空中的小冒险', '黑黑的小树洞', '有点陌生的小路'],
    sharing: ['温暖的小饼干', '一朵漂亮的小花', '发现的小宝藏'],
    honesty: ['打翻的小罐子', '不小心的事情', '心里的小石头'],
    politeness: ['小小的问候', '温柔的一句话', '轻轻的感谢'],
    persistence: ['慢慢长出的小芽', '一直走着的小路', '一点一点的进步'],
    kindness: ['受伤的小鸟', '需要帮助的小生命', '温柔的小手'],
    independence: ['自己搭的小书架', '一个人完成的事', '慢慢学会的自己'],
    gratitude: ['一碗热汤', '妈妈的小纸条', '藏在心里的谢谢'],
    friendship: ['吵架以后', '手拉手的画', '重新靠近的朋友']
  };

  const template = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  // 自定义主题使用通用场景
  const scenes = sceneByTheme[theme.key] || ['安静的小夜晚', '慢慢学会的事', '心里的小小成长', '温柔的小时光'];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];

  return template
    .replace('{role}', role.name)
    .replace('{scene}', scene)
    .replace('{thing}', scene)
    .replace('{action}', theme.core);
}

// ===== 核心：愿望嫁接故事生成 =====
function generateStory(role, theme, style, age, nickname, isContinue = false, continueCount = 0) {
  // 基于年龄调整：句子长度控制
  const isYounger = age <= 4;
  const paragraphs = isContinue ? generateContinueStory(role, theme, age, continueCount)
                                  : generateMainStory(role, theme, style, age, nickname);

  return {
    title: isContinue
      ? `${role.name}和安静的小夜晚`
      : generateTitle(role, theme, style),
    role: role,
    theme: theme,
    style: style,
    paragraphs: paragraphs,
    isContinue: isContinue,
    continueCount: continueCount,
    duration: isContinue ? Math.max(60, 180 - continueCount * 60) : (isYounger ? 200 : 260)
  };
}

// ===== 主故事生成（4段结构：开场/发展/转折/收尾）=====
function generateMainStory(role, theme, style, age, nickname) {
  const paragraphs = [];
  const name = role.name;
  const setting = role.setting;
  const themeName = theme.name;
  const behaviors = theme.behaviors;
  const nicknameText = nickname ? `（${nickname}也可以一起想一想哦）` : '';

  // ===== 开场：介绍主角，建立安全感 =====
  const opener = `${setting}，住着${name}。${role.trait}。${nicknameText}\n\n今天是一个安安静静的夜晚，月亮像一块圆圆的小饼干，挂在天上。星星们也都乖乖地，一闪一闪地发着温柔的光。`;
  paragraphs.push(opener);

  // ===== 发展：遇到一个很小的问题 =====
  let development = '';
  if (theme.key === 'patience') {
    development = `${name}听说，森林最里面有一盏星星灯，只要安安静静地等一等，灯就会慢慢亮起来。\n\n${name}来到了森林里，看见星星灯安安静静地挂在树枝上，一点光亮都没有。${name}心里有点着急，想用力摇一摇树枝，让灯快一点亮起来。`;
  } else if (theme.key === 'bravery') {
    development = `${name}听说，小山后面有一条小小的路，晚上走的时候，月亮会跟着一起走。\n\n${name}站在小路口，心里有一点点紧张。这条路看起来有点陌生，树影也轻轻晃着。${name}想：要不要回去呢？`;
  } else if (theme.key === 'sharing') {
    development = `${name}今天收到了一份小小的礼物——三块香香的小饼干，装在软软的小袋子里。\n\n${name}闻了闻，好香呀。${name}想：真好吃，我要一个人慢慢吃光。可是走着走着，${name}看见了坐在石头上的小鸟，小鸟看起来有点饿。`;
  } else if (theme.key === 'honesty') {
    development = `${name}今天帮妈妈拿小瓷瓶，可是手一滑，小瓷瓶摔到了地上，盖子滚了出来。\n\n${name}吓了一跳。心里扑通扑通地跳。怎么办呢？要不要装作没看见？可是${name}知道，这是不对的。`;
  } else if (theme.key === 'politeness') {
    development = `${name}今天要去森林里的小邮局，寄一张画给远方的奶奶。\n\n路上，${name}遇到了正在搬小石子的小蚂蚁。小蚂蚁走得很慢很慢，${name}差点从它身边跑过去。可是${name}停了下来。`;
  } else if (theme.key === 'persistence') {
    development = `${name}今天想要种一颗小小的种子，把它种在小院子里。\n\n${name}挖了一个小坑，把种子放进去，盖了一层薄薄的土。第一天过去了，土里什么也没有。第二天过去了，还是什么也没有。第三天，土里依然安安静静。`;
  } else if (theme.key === 'kindness') {
    development = `${name}今天在森林里散步，听见草丛里有轻轻的声音。\n\n${name}走过去一看，原来是一只小鸟，它的翅膀受了点小伤，飞不起来了。小鸟缩在草丛里，眼睛亮亮的，看起来有点害怕。${name}蹲下来，不知道该怎么办。`;
  } else if (theme.key === 'independence') {
    development = `${name}今天想给自己搭一个小书架，可是以前都是妈妈帮忙搭的。\n\n${name}看着地上的小木板和钉子，心里有点没底。要不要等妈妈回来帮忙呢？可是${name}又想：我已经长大了，也许可以自己试一试。`;
  } else if (theme.key === 'gratitude') {
    development = `${name}今天回到家，发现桌上摆着一碗热热的汤，旁边有一张小纸条：给${name}的，喝完早点睡。——妈妈。\n\n${name}端起碗，汤暖暖的，一直暖到心里。${name}突然想起来，妈妈每天都会悄悄为自己做很多事，可是自己好像从来没有认真注意过。`;
  } else if (theme.key === 'friendship') {
    development = `${name}今天和好朋友小松鼠吵了一架。因为小松鼠不小心弄坏了${name}最喜欢的小树叶书签。\n\n${name}生气地跑回了家，关上门不说话。可是回到家以后，${name}心里一点也不开心，反而觉得空空的。窗外的小松鼠，也一个人坐在树枝上，低着头。`;
  } else {
    // 自定义主题通用发展段：基于主题名和core动态生成
    development = `${name}今天遇到了一件小小的事情。\n\n这件事和${themeName}有关。${name}心里有点不确定，不知道该怎么做才好。月光从窗外照进来，${name}坐在小床上，安安静静地想了想。`;
  }
  paragraphs.push(development);

  // ===== 转折：主角通过行为体现主题 =====
  let twist = '';
  const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];

  if (theme.key === 'patience') {
    twist = `这时候，${name}想起妈妈说过的话：有些事情急不得，需要慢慢等一等。\n\n于是${name}坐在了树下的小草丛上，不摇，也不催。${name}只是安静地坐着，看着天上的月亮。\n\n${randomBehavior}。\n\n过了一会儿，${name}看见星星灯轻轻闪了一下。然后又闪了一下。再一下……\n\n星星灯真的亮起来了！它一点一点地亮，越亮越温柔，像一颗慢慢苏醒的小星星。`;
  } else if (theme.key === 'bravery') {
    twist = `这时候，${name}听见一个小小的声音：要不要陪我走一小段路呀？\n\n原来是一只小小的萤火虫，它的光一闪一闪的，看起来也有点害怕。\n\n${randomBehavior}。${name}轻轻点了点头，陪着萤火虫一起往前走。\n\n一步。两步。三步。\n\n${name}发现，原来黑黑的路上有月亮照着，也不是那么可怕。小路弯弯曲曲的，走起来反而很舒服。`;
  } else if (theme.key === 'sharing') {
    twist = `${name}站在原地想了一会儿。\n\n${randomBehavior}。${name}从小袋子里拿出一块小饼干，轻轻放在了小鸟面前。\n\n小鸟闻了闻，然后开开心心地吃起来。它抬头看着${name}，轻轻叫了一声，好像在说谢谢。\n\n${name}把第二块饼干也分了一半给小鸟。看着小鸟吃得那么开心，${name}觉得心里暖暖的，比自己吃光三块饼干还要满足。`;
  } else if (theme.key === 'honesty') {
    twist = `${name}蹲下来，把盖子捡起来，轻轻地放回小瓷瓶上。\n\n${randomBehavior}。\n\n${name}走到妈妈身边，用小小的声音说：妈妈，对不起，我刚才不小心把小瓷瓶弄掉了。\n\n妈妈蹲下来，轻轻摸了摸${name}的头：谢谢你告诉妈妈。东西坏了没关系，下次我们小心一点就好。\n\n${name}听完，心里那块小小的石头终于落地了。原来诚实地说出来，心里会这么轻松。`;
  } else if (theme.key === 'politeness') {
    twist = `${name}停了下来，没有跑过去。\n\n${randomBehavior}。${name}轻轻地说：小蚂蚁，你好呀。你要去哪里呀？\n\n小蚂蚁抬起头，慢悠悠地说：我要把这颗小石子搬到家里去，我已经走了一整个下午了。\n\n${name}蹲下来，陪着小蚂蚁走了一小段路。分开的时候，小蚂蚁轻轻说了一声：谢谢你陪我走。${name}心里暖暖的，好像被月光轻轻地抱了一下。`;
  } else if (theme.key === 'persistence') {
    twist = `${name}有点泄气了，想把土挖开，看看种子是不是坏了。\n\n可是${name}没有。\n\n${randomBehavior}。${name}还是每天给它浇一点点水，轻轻地说声晚安。\n\n第四天早上，${name}来到院子里，看见土里冒出了一个小小的绿芽！\n\n它小小的，嫩嫩的，但是直直地站在那里，看起来那么认真。${name}笑了，原来一点一点地坚持，真的会有惊喜呀。`;
  } else if (theme.key === 'kindness') {
    twist = `${name}想了想，轻轻伸出手，把小鸟捧了起来。\n\n${randomBehavior}。${name}找来一片软软的叶子，轻轻盖在小鸟的翅膀上。小鸟不抖了，眼睛也慢慢闭上了。\n\n${name}就这样捧着小鸟，坐在月光下，一动也不动。过了一会儿，小鸟轻轻动了动翅膀，好像没那么疼了。\n\n小鸟抬头看着${name}，轻轻叫了一声，好像在说谢谢。${name}心里暖暖的，原来帮助一个小生命，是这种感觉呀。`;
  } else if (theme.key === 'independence') {
    twist = `${name}深吸一口气，决定自己试一试。\n\n${randomBehavior}。${name}先把木板一块一块摆好，然后小心地把钉子敲进去。一开始有点歪，${name}拆了重来，又敲了一次。\n\n一步。两步。三步。虽然慢一点，但${name}发现，自己其实可以做得到。\n\n过了好久，小书架搭好了！虽然有点歪歪扭扭的，但它是${name}自己一个人完成的。${name}摸着小书架，心里满满的成就感。原来自己试试，也是一种成长。`;
  } else if (theme.key === 'gratitude') {
    twist = `${name}放下碗，悄悄走到妈妈房间门口。\n\n妈妈正在叠衣服，背对着门。${name}看见妈妈的背影，突然发现妈妈好像有点累了。\n\n${randomBehavior}。${name}没有说话，只是轻轻走过去，从背后抱了抱妈妈。\n\n妈妈转过身，有点惊讶：怎么啦？\n\n${name}把头埋在妈妈怀里，轻轻说：妈妈，谢谢你。谢谢你每天为我做那么多事。\n\n妈妈笑了，轻轻摸了摸${name}的头：傻孩子，妈妈愿意的。但${name}能发现，妈妈很开心。`;
  } else if (theme.key === 'friendship') {
    twist = `${name}坐在窗边，看着小松鼠一个人在树上，心里越来越不舒服。\n\n${randomBehavior}。${name}找了一张新的小树叶，画了一幅画，上面画着${name}和小松鼠手拉手。\n\n${name}悄悄走到小松鼠家门前，把画放在门口，轻轻敲了敲门，然后躲到了树后面。\n\n小松鼠打开门，看见那张画，眼睛一下子亮了。它抬头四处看，看见了躲在树后面的${name}。\n\n小松鼠跑过来，轻轻拉了拉${name}的手：对不起，我不该弄坏你的书签。${name}也笑了：没关系，我们还是好朋友。`;
  } else {
    // 自定义主题通用转折段
    twist = `${name}想了想，决定试一试。\n\n${randomBehavior}。${name}慢慢地做，一点一点地做。虽然有点难，但${name}没有放弃。\n\n过了一会儿，${name}发现，原来做到${themeName}的感觉，是心里暖暖的。月亮从窗外照进来，好像在轻轻地说：你做得很好。`;
  }
  paragraphs.push(twist);

  // ===== 收尾：回到安全感，进入晚安 =====
  let ending = '';
  if (theme.key === 'patience') {
    ending = `星星灯发着温柔的黄光，把${name}的小脸蛋也照得暖暖的。\n\n${name}明白了：有些事情不需要着急，只要愿意等一等，美好的光就会亮起来。\n\n夜深了。${name}抱着软软的小毯子，回到了家里。星星灯继续在森林里亮着，它知道，今晚又有一个小朋友，学会了慢慢等一等。\n\n${name}闭上眼睛，慢慢地，慢慢地，进入了梦乡。晚安。`;
  } else if (theme.key === 'bravery') {
    ending = `萤火虫的光一闪一闪，和天上的月亮一起陪着${name}走到了小路的尽头。\n\n${name}回头看了看小路，心里想：原来带着一点害怕，也可以往前走一小步。\n\n月亮越升越高，夜色越来越温柔。${name}回到了温暖的小窝，钻进了软软的被子里。\n\n今晚的${name}，带着一点点小小的勇气，慢慢地，慢慢地，睡着了。晚安。`;
  } else if (theme.key === 'sharing') {
    ending = `剩下的一块半饼干，${name}和小鸟一起坐在石头上，慢慢慢慢吃完了。\n\n${name}发现原来分享不是少了，而是快乐变成了两份——一份给小鸟，一份给自己。\n\n月亮悄悄地变圆了一点，晚风也轻轻吹着。${name}抱着软软的毯子，躺到了自己的小床上。\n\n今晚的${name}，心里装着满满的温暖，慢慢地，慢慢地，睡着了。晚安。`;
  } else if (theme.key === 'honesty') {
    ending = `妈妈陪着${name}一起，把小瓷瓶放回了架子上。\n\n"下次我们一起小心一点拿。"妈妈轻轻地说。\n\n${name}点了点头，心里那块小小的石头，终于不见了。\n\n月亮安安静静地挂在天上，${name}躺在小床上，觉得整个世界都很温柔。因为说了真话，心里就像被洗过一样，轻轻的，松松的。\n\n慢慢地，慢慢地，${name}睡着了。晚安。`;
  } else if (theme.key === 'politeness') {
    ending = `${name}继续走到了小邮局，把画寄给了奶奶。画上面画着一个大大的月亮，和一个小小的、温柔的问候。\n\n晚上回到家，${name}躺在床上，想起了今天对小蚂蚁说的那一声你好。\n\n原来小小的问候，也可以让一整天都变得暖暖的。温柔的话说给别人听，也会轻轻地回到自己心里。\n\n月亮慢慢地移动，夜色也越来越深。${name}抱着软软的小毯子，慢慢地，慢慢地，睡着了。晚安。`;
  } else if (theme.key === 'persistence') {
    ending = `${name}蹲在小绿芽旁边看了好久好久。\n\n小绿芽虽然小，但它直直地站着，好像在说：你看，我也在慢慢努力呢。\n\n${name}明白了：很多事情不是一下子就能成功的，要一点一点地坚持，等一等，再等一等，美好的事情就会慢慢长出来。\n\n夜色越来越深，月亮也越升越高。${name}躺在小床上，心里想着那株小小的绿芽。\n\n慢慢地，慢慢地，${name}睡着了。晚安。`;
  } else if (theme.key === 'kindness') {
    ending = `小鸟的翅膀好了，它轻轻拍了拍，飞到了树枝上。\n\n小鸟回头看了看${name}，叫了两声，好像在说：谢谢你，我记住你了。\n\n${name}站在月光下，心里暖暖的。原来一个小小的善意，可以让世界温柔一点点。\n\n月亮越升越高，夜色越来越温柔。${name}回到了温暖的小窝，钻进了软软的被子里。\n\n今晚的${name}，心里装着满满的温柔，慢慢地，慢慢地，睡着了。晚安。`;
  } else if (theme.key === 'independence') {
    ending = `${name}把最喜欢的小书一本一本放到新书架上。\n\n虽然书架有点歪，但${name}看着它，心里满满的骄傲。原来自己也可以做到，不用总是等别人帮忙。\n\n月亮从窗外照进来，把小书架照得暖暖的。${name}钻进被窝，抱着软软的小毯子。\n\n今晚的${name}，带着自己完成一件事的小小成就感，慢慢地，慢慢地，睡着了。晚安。`;
  } else if (theme.key === 'gratitude') {
    ending = `妈妈陪着${name}回到了小床上。\n\n${name}躺下来，妈妈轻轻盖好被子。${name}拉着妈妈的手，心里暖暖的。\n\n原来感恩不需要说出来，只要记在心里，就会让心里变得很温暖。\n\n月亮安安静静地挂在天上，好像也在温柔地看着${name}。${name}闭上眼睛，想着妈妈每天为自己做的那些小事。\n\n慢慢地，慢慢地，${name}睡着了。晚安。`;
  } else if (theme.key === 'friendship') {
    ending = `${name}和小松鼠手拉手，一起坐在树枝上看月亮。\n\n月亮圆圆的，亮亮的，照在两个好朋友身上。${name}想：原来友谊不是不吵架，而是吵完以后，还愿意拉起手来。\n\n小松鼠靠在${name}肩膀上，两个好朋友都不说话，只是安安静静地坐着。\n\n夜深了，${name}回到了自己的小窝，钻进了软软的被子里。心里暖暖的，因为知道明天还可以和小松鼠一起玩。\n\n慢慢地，慢慢地，${name}睡着了。晚安。`;
  } else {
    // 自定义主题通用收尾段
    ending = `${name}回到了温暖的小窝，钻进了软软的被子里。\n\n今晚的${name}，学会了${themeName}。${theme.core}。\n\n月亮安安静静地挂在天上，好像在温柔地看着${name}。${name}闭上眼睛，心里暖暖的。\n\n慢慢地，慢慢地，${name}睡着了。晚安。`;
  }
  paragraphs.push(ending);

  return paragraphs;
}

// ===== 继续讲故事（更短、更安静、无冲突）=====
function generateContinueStory(role, theme, age, continueCount) {
  const name = role.name;
  const paragraphs = [];

  // 第1次继续：更短的安抚故事
  // 第2次继续：极短的安抚
  // 第3次+：进入白噪音/晚安

  if (continueCount === 1) {
    paragraphs.push(
      `${name}回到了温暖的小窝。\n\n小窝里安安静静的，只有窗外的月亮在慢慢地走。${name}把小鞋子摆好，把小外套挂起来，然后爬到了软软的小床上。`
    );
    paragraphs.push(
      `小毯子盖好了，小枕头也很舒服。\n\n${name}闭上眼睛，听见窗外有轻轻的风吹过树叶的声音。沙沙沙。沙沙沙。\n\n好像谁在轻轻哼着歌一样。`
    );
    paragraphs.push(
      `${name}的呼吸慢慢慢了下来。\n\n一下。两下。三下。\n\n眼皮越来越沉，身体也越来越放松，像一块小小的云朵，慢慢飘在软软的夜里。\n\n晚安了，${name}。晚安。`
    );
  } else if (continueCount === 2) {
    paragraphs.push(
      `夜已经很深很深了。\n\n月亮静悄悄地挂在天上，星星也都安安静静地发着光。`
    );
    paragraphs.push(
      `${name}的眼睛快要闭上啦。\n\n呼吸轻轻地。一下。一下。又一下。\n\n像小小的海浪，慢慢地上来，又慢慢地退下去。`
    );
    paragraphs.push(
      `全世界都安静了。\n\n慢慢地。慢慢地。睡着了。\n\n晚安。`
    );
  } else {
    // 第三次之后进入白噪音尾声
    paragraphs.push(
      `……\n\n轻轻的。轻轻的。\n\n……\n\n晚安。`
    );
  }

  return paragraphs;
}

// ===== 今日故事推荐（基于角色类型+主题）=====
// ===== 基于性别的加权角色选择 =====
// 权重规则：匹配性别 3 票 | 中性 2 票 | 不匹配 1 票
// 不硬性排除任何角色，只调整被选中的概率
function pickRoleByGender(roles, gender) {
  if (!gender || gender === 'neutral') {
    return roles[Math.floor(Math.random() * roles.length)];
  }

  // 构建加权池
  const weightedPool = [];
  roles.forEach(role => {
    const pref = role.genderPref || 'neutral';
    let weight = 2; // 中性默认 2 票
    if (pref === gender) {
      weight = 3; // 匹配性别 3 票
    } else if (pref === 'neutral') {
      weight = 2;
    } else {
      weight = 1; // 不匹配 1 票
    }
    for (let i = 0; i < weight; i++) {
      weightedPool.push(role);
    }
  });

  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

function recommendTonight(roleType, themeKey, age, nickname, gender, customRoleName, customTheme) {
  // 如果有自定义主题，使用自定义主题对象
  let theme;
  if (customTheme) {
    theme = customTheme;
  } else {
    theme = { key: themeKey, ...THEME_LIBRARY[themeKey] };
  }

  const style = { key: 'gentle', ...STYLE_LIBRARY.gentle };

  // 如果是自定义角色且用户输入了角色名，使用 generateCustomStory 生成
  if (roleType === 'custom' && customRoleName) {
    // 临时构造一个主题对象传给 generateCustomStory
    const story = generateCustomStoryWithTheme(customRoleName, theme, age, nickname);
    const genderHint = gender === 'male' ? '男孩' : gender === 'female' ? '女孩' : '孩子';
    const themeLabel = customTheme ? `自定义主题「${customTheme.name}」` : `${theme.name}主题`;
    return {
      story: story,
      recommendReason: `基于${genderHint}自定义角色「${customRoleName}」和${themeLabel}推荐`
    };
  }

  // 否则从角色库中按性别加权选择
  const roles = ROLE_LIBRARY[roleType] || ROLE_LIBRARY.animal;
  const role = pickRoleByGender(roles, gender);

  const story = generateStory(role, theme, style, age, nickname, false, 0);

  // 生成推荐理由（体现性别偏好）
  const roleTypeLabel = roleType === 'animal' ? '小动物' : roleType === 'robot' ? '机器人角色' : roleType === 'kid' ? '小朋友主角' : '自定义角色';
  const genderHint = gender === 'male' ? '男孩' : gender === 'female' ? '女孩' : '孩子';
  const themeLabel = customTheme ? `自定义主题「${customTheme.name}」` : `${theme.name}主题`;
  return {
    story: story,
    recommendReason: `基于${genderHint}偏好、${roleTypeLabel}和${themeLabel}推荐`
  };
}

// 带自定义主题的自定义角色故事生成
function generateCustomStoryWithTheme(customRoleName, theme, age, nickname) {
  // 从角色库中匹配或创建自定义角色
  let role = null;
  for (const key in ROLE_LIBRARY) {
    const found = ROLE_LIBRARY[key].find(r => customRoleName.includes(r.name.replace(/小|子/g, '')) || r.name.includes(customRoleName));
    if (found) { role = found; break; }
  }

  if (!role) {
    role = {
      name: customRoleName,
      emoji: '✨',
      trait: '温柔又有点好奇',
      setting: '住在安静的小森林里'
    };
  }

  const style = { key: 'gentle', ...STYLE_LIBRARY.gentle };
  return generateStory(role, theme, style, age, nickname, false, 0);
}

// ===== 自定义故事（指定角色名）=====
function generateCustomStory(customRoleName, themeKey, age, nickname) {
  // 从角色库中匹配或创建自定义角色
  let role = null;
  for (const key in ROLE_LIBRARY) {
    const found = ROLE_LIBRARY[key].find(r => customRoleName.includes(r.name.replace(/小|子/g, '')) || r.name.includes(customRoleName));
    if (found) { role = found; break; }
  }

  if (!role) {
    // 创建一个自定义角色
    role = {
      name: customRoleName,
      emoji: '✨',
      trait: '温柔又有点好奇',
      setting: '住在安静的小森林里'
    };
  }

  const theme = { key: themeKey, ...THEME_LIBRARY[themeKey] };
  const style = { key: 'gentle', ...STYLE_LIBRARY.gentle };

  return generateStory(role, theme, style, age, nickname, false, 0);
}

// ===== 继续讲 =====
function generateContinue(baseRole, theme, age, continueCount) {
  const style = { key: 'gentle', ...STYLE_LIBRARY.gentle };
  return generateStory(baseRole, theme, style, age, null, true, continueCount);
}

// ===== 获取角色列表（用于微调）=====
function getRolesByType(roleType) {
  return ROLE_LIBRARY[roleType] || ROLE_LIBRARY.animal;
}

// ===== 获取所有高频主题 =====
function getAllThemes() {
  return Object.keys(THEME_LIBRARY).map(key => ({
    key: key,
    ...THEME_LIBRARY[key]
  }));
}

// ===== 获取所有风格 =====
function getAllStyles() {
  return Object.keys(STYLE_LIBRARY).map(key => ({
    key: key,
    ...STYLE_LIBRARY[key]
  }));
}

// ===== 故事库初始示例数据 =====
const DEMO_FAVORITE_STORIES = [
  {
    id: 'fav_1',
    title: '小恐龙和森林里的星星灯',
    emoji: '🦖✨',
    theme: '耐心',
    time: '昨天',
    savedAt: Date.now() - 86400000
  },
  {
    id: 'fav_2',
    title: '小兔子和月亮饼干',
    emoji: '🐰🌙',
    theme: '分享',
    time: '3天前',
    savedAt: Date.now() - 86400000 * 3
  }
];

const DEMO_RECENT_STORIES = [
  {
    id: 'recent_1',
    title: '小机器人和晚安的小星星',
    emoji: '🤖⭐',
    theme: '坚持',
    time: '今晚',
    savedAt: Date.now()
  },
  {
    id: 'recent_2',
    title: '小恐龙和森林里的星星灯',
    emoji: '🦖✨',
    theme: '耐心',
    time: '昨天',
    savedAt: Date.now() - 86400000
  },
  {
    id: 'recent_3',
    title: '小鸭子和说真话的勇气',
    emoji: '🦆💎',
    theme: '诚实',
    time: '2天前',
    savedAt: Date.now() - 86400000 * 2
  }
];

const DEMO_SIMILAR_STORIES = [
  {
    id: 'similar_1',
    title: '小恐龙和慢慢开放的花',
    emoji: '🦖🌸',
    theme: '耐心',
    time: '相似推荐',
    savedAt: Date.now()
  },
  {
    id: 'similar_2',
    title: '小兔子和需要等一等的礼物',
    emoji: '🐰🎁',
    theme: '耐心',
    time: '相似推荐',
    savedAt: Date.now()
  }
];

// ===== 情绪疗愈故事库 =====
const EMOTION_LIBRARY = {
  dark: {
    name: '怕黑',
    emoji: '🌙',
    desc: '孩子对黑暗感到害怕，需要建立夜晚的安全感',
    preview: '小鸭子发现夜晚其实很温柔，月亮是一盏大灯，星星是许多小灯，它们都在陪着她...',
    storyTitle: '小鸭子和温柔的夜晚',
    paragraphs: [
      '小鸭子今晚有点害怕。灯一关，房间里黑黑的，什么也看不见了。小鸭子把被子拉到下巴，心里扑通扑通地跳。',
      '这时候，窗外的月亮悄悄亮了起来。月光从窗帘缝里溜进来，在地上铺了一条银色的小路。小鸭子发现，原来夜晚不是全黑的，月亮就像一盏大大的灯，挂在天上。',
      '星星们也一颗一颗地亮了。它们一闪一闪的，好像在对小鸭子眨眼睛。小鸭子想：原来夜晚有这么多小灯陪着我呀。',
      '小鸭子慢慢地不那么害怕了。她闭上眼睛，听见风轻轻吹过树叶的声音，沙沙沙，像谁在轻轻哼着歌。月亮和星星都在窗外陪着她，夜晚其实很温柔。慢慢地，慢慢地，小鸭子睡着了。晚安。'
    ]
  },
  separation: {
    name: '分离焦虑',
    emoji: '🤗',
    desc: '孩子不愿和妈妈分开，需要理解"还会回来"',
    preview: '小熊发现妈妈出门后，时间会慢慢走，妈妈一定会回来。等待的时候，有温柔的东西陪着...',
    storyTitle: '小熊和会回来的妈妈',
    paragraphs: [
      '今天早上，妈妈要出门了。小熊站在门口，眼睛红红的，不想让妈妈走。妈妈蹲下来，轻轻抱了抱小熊：妈妈很快就回来，你先和奶奶在家里玩好不好？',
      '小熊点点头，可是心里还是有点难过。妈妈走了以后，小熊坐在窗边，看着妈妈的背影越来越小，越来越小，最后拐了个弯，看不见了。',
      '小熊拿出一个小毯子，是妈妈昨天给他盖过的。小毯子上还有妈妈的味道，暖暖的。小熊把小毯子抱在怀里，好像妈妈还在身边一样。',
      '奶奶陪小熊搭积木，又陪小熊看了一本画册。小熊发现，时间一点一点地走，也没有那么慢。太阳慢慢移到了天空的另一边，门铃响了——妈妈回来了！小熊跑过去，紧紧抱住妈妈。原来，分开一会儿也没关系，妈妈一定会回来的。慢慢地，慢慢地，小熊安心地睡着了。晚安。'
    ]
  },
  angry: {
    name: '生气',
    emoji: '😤',
    desc: '孩子今天发了脾气，需要学会和生气相处',
    preview: '小狐狸发现生气的时候，可以先深呼吸，等一等，生气就会慢慢变小...',
    storyTitle: '小狐狸和慢慢变小的生气',
    paragraphs: [
      '今天小狐狸生气了。因为好朋友小兔子不小心碰倒了他搭的积木城堡。哗啦一声，城堡全倒了。小狐狸的脸涨得红红的，拳头攥得紧紧的。',
      '小狐狸想大声喊，想跺脚。可是他想起妈妈说过：生气的时候，可以先深呼吸。小狐狸闭上眼睛，吸一口气——呼——吸一口气——呼——',
      '一下。两下。三下。小狐狸觉得，心里那团火，好像小了一点点。他又深呼吸了几次，生气慢慢变小了，变小了，像一只小气球，慢慢地瘪了下去。',
      '小兔子轻轻说：对不起，我不是故意的。小狐狸睁开眼睛，点了点头：没关系，我们一起重新搭吧。原来生气不可怕，深呼吸，等一等，它就会慢慢变小。慢慢地，慢慢地，小狐狸睡着了。晚安。'
    ]
  },
  sad: {
    name: '难过',
    emoji: '💧',
    desc: '孩子今天哭了，需要让情绪被接纳',
    preview: '小鸭子的铃铛被风吹走了，她很难过。风轻轻吹过来，好像在说：难过一会儿也没关系...',
    storyTitle: '小鸭子和他的铃铛',
    paragraphs: [
      '小鸭子最喜欢的铃铛被风吹走了。小鸭子找了很久很久，也没有找到。她坐在河边，难过得不行，眼泪一颗一颗地掉下来。',
      '河边的风轻轻吹过来，好像在说：没关系，难过一会儿也没关系。小鸭子就坐在那里，让眼泪流了一会儿。',
      '过了一会儿，小鸭子听见草丛里有轻轻的声音——叮铃，叮铃。她抬起头，看见铃铛挂在一片草叶上，轻轻摇晃着。它没有丢，只是被风吹到了另一个地方。',
      '小鸭子把铃铛捡回来，抱在怀里。她知道，有些东西不会真的离开，就像难过也不会一直都在。铃铛叮铃叮铃地响，像在说：我还在呢。慢慢地，慢慢地，小鸭子睡着了。晚安。'
    ]
  },
  jealous: {
    name: '嫉妒',
    emoji: '💚',
    desc: '孩子看到别人好时心里不舒服，需要发现自己的好',
    preview: '小兔子发现，别人有别人的好，自己也有自己的好，不需要比较...',
    storyTitle: '小兔子和自己的好',
    paragraphs: [
      '今天小兔子心里有点不舒服。因为好朋友小猫有了一条漂亮的新围巾，大家都围着小猫看。小兔子低着头，想：为什么我没有呢？',
      '小兔子回到家，坐在窗边。窗台上有一盆小兔子自己种的花，开得正好。小兔子每天给它浇水，陪它晒太阳，它才开得这么漂亮。',
      '小兔子想：小猫有漂亮的围巾，我有漂亮的花。小猫有软软的毛，我有长长的耳朵。每个人都有自己的好，不需要一样。',
      '想到这里，小兔子心里舒服多了。她给花浇了一点水，轻轻说：你很好，我也很好。原来不用和别人比，自己就有自己的好。慢慢地，慢慢地，小兔子睡着了。晚安。'
    ]
  }
};

// ===== 每周主题计划 =====
const WEEKLY_PLAN = [
  { day: '周一', theme: '善良', emoji: '🌸', role: '小恐龙' },
  { day: '周二', theme: '勇敢', emoji: '🦁', role: '奥特曼' },
  { day: '周三', theme: '耐心', emoji: '🌱', role: '小猪佩奇' },
  { day: '周四', theme: '分享', emoji: '🎁', role: '爱莎' },
  { day: '周五', theme: '诚实', emoji: '💎', role: '小机器人' },
  { day: '周六', theme: '坚持', emoji: '🌟', role: '孩子自选' },
  { day: '周日', theme: '复习周', emoji: '📖', role: '回顾本周最爱' }
];

// ===== 故事对比数据 =====
const COMPARE_DATA = {
  bad: {
    title: '普通 AI 故事生成器',
    badge: '⚠️ 通用生成',
    content: '小兔子被大灰狼追，跑进了山洞躲起来。大灰狼在洞口守着，小兔子很害怕。后来猎人来了，把大灰狼赶跑了。小兔子得救了！',
    tags: ['高刺激情节', '暴力冲突', '兴奋结尾', '直接说教', '不适合睡前']
  },
  good: {
    title: '晚安鸭',
    badge: '✓ 睡前专用',
    content: '小兔子发现胡萝卜田被风吹乱了，一根一根地捡回来。捡着捡着，月亮升起来了，小兔子把最后一根胡萝卜排整齐，盖好小被子，慢慢地闭上了眼睛。',
    tags: ['低冲突', '无暴力', '安静结尾', '不说教', '适合睡前', '安全自检通过']
  }
};
