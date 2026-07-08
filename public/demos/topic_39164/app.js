/* ============================================================
   RightSong · 沉浸式重做版
   生活娱乐赛道 · 先帮你选对歌，再陪你练对歌
   纯前端 · 无后端 · 真实麦克风录音 + 专业 6 维选曲模型
   ============================================================ */

/* ---------------- 数据层 ---------------- */

// 专业选曲评分模型（6 维加权，后台逻辑，前台只展示结果）
const SELECTION_MODEL = [
  { key: "range", name: "音域匹配", weight: 0.35, desc: "歌曲主要旋律是否落在你的舒适音区" },
  { key: "key", name: "Key 适配", weight: 0.15, desc: "原调或升降调后是否适合你" },
  { key: "breath", name: "气息匹配", weight: 0.15, desc: "长句、换气点是否适合你当前的能力" },
  { key: "rhythm", name: "节奏匹配", weight: 0.10, desc: "BPM、切分、说唱难度是否合适" },
  { key: "timbre", name: "音色匹配", weight: 0.15, desc: "歌曲气质是否贴合你的声线人格" },
  { key: "emotion", name: "情绪匹配", weight: 0.10, desc: "你是否容易唱出这首歌的情绪" },
];

// 声线测试任务：读句子(speak) + 测音高(down/up)
const TEST_TASKS = [
  {
    key: "shortPhrase", title: "先随便说句话", icon: "💬",
    prompt: "“今天，我想找一首真正适合我的歌。”",
    tip: "像和朋友聊天那样，自然地说出来就好。",
    exampleType: "speak", measures: ["音色", "情绪"],
  },
  {
    key: "longBreath", title: "一口气读长句", icon: "🌬️",
    prompt: "“有些歌不是唱给别人听的，是唱给那个还没说再见的自己。”",
    tip: "尽量一口气读完，中间想换气就自然换，不用憋。",
    exampleType: "speak", measures: ["气息", "长句"],
  },
  {
    key: "lowProbe", title: "探探你的低音", icon: "🔉",
    prompt: "用「嗯」从舒服的位置，慢慢往低处滑。",
    tip: "别压嗓子，滑到不舒服就停，这是在找你的低音边界。",
    exampleType: "down", measures: ["音域", "Key"],
  },
  {
    key: "highProbe", title: "试试你的高音", icon: "🔊",
    prompt: "用「啊」从舒服的位置，轻轻往高处滑。",
    tip: "放松喉咙，感觉紧了就停，这是在找你的高音边界。",
    exampleType: "up", measures: ["音域", "Key"],
  },
  {
    key: "emotionLine", title: "带点情绪说一句", icon: "💗",
    prompt: "“那年夏天的风，好像还停在原地。”",
    tip: "想着一个画面说出来，不用表演，真实就好。",
    exampleType: "speak", measures: ["情绪", "音色"],
  },
];

// 声线人格
const PERSONAS = {
  warm: {
    name: "温暖治愈系", emoji: "🍵", color: "#ffb86c",
    tags: ["声音有故事感", "适合深夜慢歌", "情绪细腻"],
    headline: "你的声音像一杯温热的茶，慢一点，反而最动人。",
  },
  bright: {
    name: "明亮少年系", emoji: "☀️", color: "#ffd66e",
    tags: ["穿透力强", "适合流行快歌", "干净有朝气"],
    headline: "你的声音自带光，越往高处走，越有记忆点。",
  },
  low: {
    name: "低音魅力系", emoji: "🌌", color: "#a070ff",
    tags: ["低音稳", "适合慵懒情歌", "有磁性"],
    headline: "你的声音沉得下来，慢歌里藏着最迷人的颗粒感。",
  },
  spark: {
    name: "灵动律动系", emoji: "✨", color: "#38e8d0",
    tags: ["节奏感好", "适合律动/说唱", "灵活多变"],
    headline: "你的声音跳得起来，节奏一来就是你的主场。",
  },
};

// 多场景歌单（普通人高频共鸣的生活场景）
const SCENES = [
  { key: "destiny", name: "本命歌单", emoji: "✨" },
  { key: "commute", name: "通勤循环", emoji: "🚇" },
  { key: "heartbreak", name: "失恋疗伤", emoji: "💔" },
  { key: "shower", name: "浴室歌神", emoji: "🚿" },
  { key: "ktv", name: "KTV 必点", emoji: "🎤" },
  { key: "alone", name: "深夜 emo", emoji: "🌙" },
  { key: "nostalgia", name: "青春回忆杀", emoji: "📼" },
  { key: "hype", name: "燃爆全场", emoji: "🔥" },
];

// 歌曲库（真实歌曲元数据 + 情绪标签，匹配分由模型按人格动态算）
const SONG_LIBRARY = [
  { id: "s1", title: "晴天", artist: "周杰伦", emoji: "🌤️", mood: "青春", bpm: 70, fitFor: ["warm", "bright"], scenes: ["destiny", "nostalgia", "shower"], reason: "中音区为主，副歌不飙高，适合大多数人开口" },
  { id: "s2", title: "她说", artist: "林俊杰", emoji: "🌧️", mood: "深情", bpm: 64, fitFor: ["warm", "low"], scenes: ["alone", "heartbreak"], reason: "气息平缓、换气点友好，长句很好控制" },
  { id: "s3", title: "小幸运", artist: "田馥甄", emoji: "🍀", mood: "温柔", bpm: 70, fitFor: ["warm", "bright"], scenes: ["destiny", "nostalgia", "commute"], reason: "旋律线柔和，情绪自然就能带出来" },
  { id: "s4", title: "起风了", artist: "买辣椒也用券", emoji: "🍃", mood: "释怀", bpm: 80, fitFor: ["warm", "low"], scenes: ["commute", "alone"], reason: "叙事感强，适合你这种有故事感的声音" },
  { id: "s5", title: "光年之外", artist: "邓紫棋", emoji: "🚀", mood: "燃", bpm: 96, fitFor: ["bright", "spark"], scenes: ["hype", "ktv", "shower"], reason: "副歌爆发力强，适合想炸场的高音型" },
  { id: "s6", title: "夜曲", artist: "周杰伦", emoji: "🌃", mood: "暗黑", bpm: 126, fitFor: ["low", "spark"], scenes: ["ktv", "hype"], reason: "节奏切分明显，低音稳的人唱起来很带感" },
  { id: "s7", title: "演员", artist: "薛之谦", emoji: "🎭", mood: "苦情", bpm: 76, fitFor: ["warm", "low"], scenes: ["heartbreak", "ktv"], reason: "情绪层次多，适合细腻的声音处理" },
  { id: "s8", title: "稻香", artist: "周杰伦", emoji: "🌾", mood: "治愈", bpm: 70, fitFor: ["bright", "spark"], scenes: ["destiny", "commute", "shower"], reason: "轻快好上口，气氛担当，几乎零门槛" },
  { id: "s9", title: "体面", artist: "于文文", emoji: "💔", mood: "释然", bpm: 68, fitFor: ["warm", "bright"], scenes: ["heartbreak", "alone"], reason: "中高音过渡平滑，情绪推进很顺" },
  { id: "s10", title: "突然好想你", artist: "五月天", emoji: "🌠", mood: "想念", bpm: 73, fitFor: ["bright", "warm"], scenes: ["nostalgia", "heartbreak", "ktv"], reason: "副歌情绪饱满，合唱感强，适合释放" },
  { id: "s11", title: "成都", artist: "赵雷", emoji: "🏙️", mood: "民谣", bpm: 68, fitFor: ["low", "warm"], scenes: ["alone", "commute"], reason: "音域窄、说话式唱法，新手也稳得住" },
  { id: "s12", title: "夜空中最亮的星", artist: "逃跑计划", emoji: "⭐", mood: "励志", bpm: 130, fitFor: ["bright", "spark"], scenes: ["hype", "ktv", "commute"], reason: "副歌高亢但旋律好记，适合点亮全场" },
];

// 真实媒体资源：来自 iTunes Search API（合法 30 秒官方试听 + 高清封面）
// 通过 itunes.apple.com/search 公开接口检索，previewUrl 为 Apple 托管的官方预览片段
const SONG_MEDIA = {
  s1: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/20/d0/e7/20d0e7db-9c12-795a-d738-2fc3dde4ac9a/mzaf_10317517925583301645.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/45/8a/e4/458ae484-dc8b-5683-ce04-8d2948346462/JAY.jpg/600x600bb.jpg", album: "叶惠美" },
  s2: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/ca/2e/5d/ca2e5d85-5c0e-a7fc-907b-37b2cc4071f2/mzaf_10918804513069558363.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4f/55/6d/4f556da8-f58c-982d-6dd9-3515d33b354f/mzm.awewpcjt.jpg/600x600bb.jpg", album: "她说" },
  s3: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/de/dc/f6/dedcf636-8142-716b-af7d-2ba74bd6ffe2/mzaf_16061481957398880364.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/69/87/7f/69877fbc-cd2c-bb9b-2397-5f3ed14a04a8/Hebe_Little_Happiness_1400.jpg/600x600bb.jpg", album: "小幸运" },
  s4: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e0/c3/cb/e0c3cb70-51e9-3d77-861b-6b4099cfea7c/mzaf_12116763480515746033.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a8/b4/10/a8b4103e-5096-45c0-8985-6e6658ec738d/4711508070582.jpg/600x600bb.jpg", album: "起风了" },
  s5: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ec/3a/27/ec3a272c-3129-d202-631d-9c99ce93bbe4/mzaf_16728419973496340579.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/56/57/ea/5657ea0c-b59b-c504-9db7-016de7faeb3f/196873159782.jpg/600x600bb.jpg", album: "I AM GLORIA" },
  s6: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cd/80/49/cd8049a8-f655-a320-fe39-399582e94ed4/mzaf_2752455179820135985.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9e/35/ad/9e35ad1e-749e-75b6-0539-1e80cea1817b/JAY11.jpg/600x600bb.jpg", album: "11月的萧邦" },
  s7: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4a/84/38/4a8438ec-11dc-e2d2-57a0-eb7dbfe6598d/mzaf_9490533627010664214.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b0/09/04/b009043f-f576-54ce-5b1f-d7896d6933c0/9555150772273.jpg/600x600bb.jpg", album: "初学者" },
  s8: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/c3/c4/e0/c3c4e033-2bd0-e0fc-3195-3ec68299f19f/mzaf_9545722078596740089.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/1b/63/9e/1b639e5b-f8ca-a6e1-8612-6396bc9ff0eb/4711448407424.jpg/600x600bb.jpg", album: "魔杰座" },
  s9: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3d/fd/b6/3dfdb6d6-1fb6-f503-795f-4116a5544cee/mzaf_2326102125570133470.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/7d/ea/0b/7dea0b30-7bad-df29-e265-84f18ec5bc7a/4711281411343.jpg/600x600bb.jpg", album: "体面" },
  s10: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/f7/7b/c0/f77bc0ad-2cf2-755f-b8e2-40ff982844a4/mzaf_6341650422287672828.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music69/v4/fd/ba/9e/fdba9e89-6336-d3e4-ee00-94184f9a5c2c/BD0016-_-.jpg/600x600bb.jpg", album: "后青春期的诗" },
  s11: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/f2/03/1c/f2031ca5-ae74-ff12-85d0-b7a209c0a7b8/mzaf_15668328483310257750.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/3e/96/12/3e96125c-dcf5-412c-e51c-1b6f87560b2c/6976364785027.jpg/600x600bb.jpg", album: "成都" },
  s12: { preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/89/ee/ab/89eeab18-a09b-3627-7b87-38187cbc6b15/mzaf_8274963740283350132.plus.aac.p.m4a", art: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/dc/85/ab/dc85ab94-26c9-5f50-3c89-d9a95b22ca1c/2910029.jpg/600x600bb.jpg", album: "世界" },
};
function songMedia(id) { return SONG_MEDIA[id] || null; }

// 逐句歌词（把每首歌切成 开头/主歌/副歌 等模块，每模块若干短句，方便分句教学）
// rel 为该句相对基准音的半音偏移（用于示范音高 + 给“偏高/偏低”反馈）
const SONG_LYRICS = {
  s1: [
    { key: "intro", label: "开头", coach: "轻轻起，像在回忆。气别冲，把声音放在鼻腔前面。", lines: [
      { t: "故事的小黄花", rel: 0 }, { t: "从出生那年就飘着", rel: 2 },
      { t: "童年的荡秋千", rel: 4 }, { t: "随记忆一直晃到现在", rel: 2 } ] },
    { key: "verse", label: "主歌", coach: "像说话一样唱，咬字清楚，把节奏稳住。", lines: [
      { t: "刮风这天", rel: 2 }, { t: "我试过握着你手", rel: 4 },
      { t: "但偏偏雨渐渐", rel: 5 }, { t: "大到我看你不见", rel: 3 } ] },
    { key: "chorus", label: "副歌", coach: "这是记忆点，气从肚子走，副歌句尾别掉下来。", lines: [
      { t: "还要多久我才能在你身边", rel: 7 }, { t: "等到放晴的那天", rel: 9 },
      { t: "也许我会比较好一点", rel: 5 } ] },
  ],
  s3: [
    { key: "intro", label: "开头", coach: "温柔起音，像在对一个人轻声说话。", lines: [
      { t: "我听见雨滴", rel: 0 }, { t: "落在青青草地", rel: 2 },
      { t: "我听见远方", rel: 4 }, { t: "下课钟声响起", rel: 2 } ] },
    { key: "verse", label: "主歌", coach: "情绪一点点往上铺，别急着用力。", lines: [
      { t: "可是我没有听见你的声音", rel: 4 }, { t: "认真呼唤我姓名", rel: 6 },
      { t: "爱上你的时候", rel: 5 }, { t: "还不懂感情", rel: 3 } ] },
    { key: "chorus", label: "副歌", coach: "副歌要打开，把“原来”两个字唱出感叹的味道。", lines: [
      { t: "原来你是我最想留住的幸运", rel: 7 }, { t: "原来我们和爱情", rel: 9 },
      { t: "曾经靠得那么近", rel: 5 } ] },
  ],
  s4: [
    { key: "intro", label: "开头", coach: "叙事感开场，像在讲自己的故事，放松。", lines: [
      { t: "这一路上走走停停", rel: 0 }, { t: "顺着少年漂流的痕迹", rel: 2 },
      { t: "迟来的春风", rel: 3 }, { t: "也许会迟到", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "气息要长，长句中间偷一口气再接。", lines: [
      { t: "我曾难自拔于世界之大", rel: 3 }, { t: "也沉迷于人间烟火", rel: 5 },
      { t: "想要说给你听", rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌情绪释放，但别喊，是“叹”出来的。", lines: [
      { t: "我曾难自拔于世界之大", rel: 7 }, { t: "也沉迷于人间烟火", rel: 9 },
      { t: "为何记忆中的他", rel: 6 } ] },
  ],
  s7: [
    { key: "intro", label: "开头", coach: "压低一点起，带点克制的情绪。", lines: [
      { t: "简单点", rel: 0 }, { t: "说话的方式简单点", rel: 2 },
      { t: "递进的情绪请省略", rel: 3 } ] },
    { key: "verse", label: "主歌", coach: "像在跟人对话，把无奈感咬进字里。", lines: [
      { t: "你又不是个演员", rel: 2 }, { t: "别设计那些情节", rel: 4 },
      { t: "没意见我只想看看你", rel: 5 } ] },
    { key: "chorus", label: "副歌", coach: "副歌爆发，但情绪在前、音量在后。", lines: [
      { t: "该配合你演出的我演视而不见", rel: 7 }, { t: "在逼一个最爱你的人即兴表演", rel: 9 } ] },
  ],
  s8: [
    { key: "intro", label: "开头", coach: "轻快地起，嘴角带点笑意，气氛要松。", lines: [
      { t: "对这个世界如果你有太多的抱怨", rel: 0 }, { t: "跌倒了就不敢继续往前走", rel: 2 } ] },
    { key: "verse", label: "主歌", coach: "节奏跟住，像在和朋友聊天。", lines: [
      { t: "为什么人要这么的脆弱堕落", rel: 3 }, { t: "请你打开电视看看", rel: 4 },
      { t: "多少人为生命在努力勇敢的走下去", rel: 5 } ] },
    { key: "chorus", label: "副歌", coach: "副歌是阳光的，放开唱，别紧。", lines: [
      { t: "还记得你说家是唯一的城堡", rel: 7 }, { t: "随着稻香河流继续奔跑", rel: 9 },
      { t: "微微笑小时候的梦我知道", rel: 6 } ] },
  ],
  s11: [
    { key: "intro", label: "开头", coach: "说话式唱法，像民谣那样自然。", lines: [
      { t: "让我掉下眼泪的", rel: 0 }, { t: "不止昨夜的酒", rel: 2 },
      { t: "让我依依不舍的", rel: 3 }, { t: "不止你的温柔", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "音域很窄，稳住就好，别刻意。", lines: [
      { t: "余路还要走多久", rel: 2 }, { t: "你攥着我的手", rel: 4 },
      { t: "让我感到为难的", rel: 3 } ] },
    { key: "chorus", label: "副歌", coach: "副歌是全曲的暖点，把“成都”唱得有画面。", lines: [
      { t: "和我在成都的街头走一走", rel: 5 }, { t: "直到所有的灯都熄灭了也不停留", rel: 7 } ] },
  ],
  s2: [
    { key: "intro", label: "开头", coach: "深情起音，气息平缓，像在低声诉说。", lines: [
      { t: "她静悄悄地来过", rel: 0 }, { t: "她慢慢带走沉默", rel: 2 },
      { t: "只是最后的承诺", rel: 3 }, { t: "还是没有带走了寂寞", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "把无奈感咬进字里，别用力，稳住气。", lines: [
      { t: "我们爱的没有错", rel: 2 }, { t: "只是美丽的独秀太折磨", rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌长句多，标点处偷气，句尾别掉。", lines: [
      { t: "她说无所谓", rel: 7 }, { t: "只要能在夜里", rel: 9 },
      { t: "翻来覆去的时候有寄托", rel: 5 } ] },
  ],
  s5: [
    { key: "intro", label: "开头", coach: "轻轻铺开，像在凝望一个人，先别用力。", lines: [
      { t: "感受停在我发端的指尖", rel: 0 }, { t: "如何瞬间冻结时间", rel: 2 },
      { t: "记住望着我坚定的双眼", rel: 3 }, { t: "也许已经没有明天", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "情绪一点点往上推，为副歌的爆发蓄力。", lines: [
      { t: "面对浩瀚的星海", rel: 3 }, { t: "我们微小得像尘埃", rel: 5 },
      { t: "漂浮在一片无奈", rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌爆发力强，气从肚子走，敢放上去。", lines: [
      { t: "缘分让我们相遇乱世以外", rel: 7 }, { t: "命运却要我们危难中相爱", rel: 9 } ] },
  ],
  s6: [
    { key: "intro", label: "开头", coach: "暗黑系开场，咬字干净，节奏卡住鼓点。", lines: [
      { t: "一群嗜血的蚂蚁", rel: 0 }, { t: "被腐肉所吸引", rel: 2 },
      { t: "我面无表情", rel: 3 }, { t: "看孤独的风景", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "说唱式咬字，切分明显，稳住低音。", lines: [
      { t: "失去你 爱恨开始分明", rel: 2 }, { t: "失去你 还有什么事好关心", rel: 4 },
      { t: "当鸽子不再象征和平", rel: 5 } ] },
    { key: "chorus", label: "副歌", coach: "副歌是记忆点，把“夜曲”唱得有画面感。", lines: [
      { t: "为你弹奏萧邦的夜曲", rel: 7 }, { t: "纪念我死去的爱情", rel: 9 } ] },
  ],
  s9: [
    { key: "intro", label: "开头", coach: "克制地起，带点释然，别太用力。", lines: [
      { t: "别堆砌怀念让剧情", rel: 0 }, { t: "变得狗血", rel: 2 },
      { t: "深爱了多年又何必", rel: 3 }, { t: "毁了经典", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "中高音过渡要平滑，情绪顺着推。", lines: [
      { t: "都已成年不拖不欠", rel: 3 }, { t: "浪费时间是我情愿", rel: 5 },
      { t: "像谢幕的演员", rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌把“体面”两个字唱出释然的味道。", lines: [
      { t: "分手应该体面", rel: 7 }, { t: "谁都不要说抱歉", rel: 9 } ] },
  ],
  s10: [
    { key: "intro", label: "开头", coach: "从安静处起，把“最怕”的情绪压住别冲。", lines: [
      { t: "最怕空气突然安静", rel: 0 }, { t: "最怕朋友突然的关心", rel: 2 },
      { t: "最怕回忆突然翻滚", rel: 3 }, { t: "绞痛着不平息", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "情绪饱满地铺，为合唱式副歌蓄力。", lines: [
      { t: "最怕突然听到你的消息", rel: 3 }, { t: "想念如果会有声音", rel: 5 },
      { t: "不愿那是悲伤的哭泣", rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌敢放开，合唱感强，把想念唱出来。", lines: [
      { t: "突然好想你", rel: 7 }, { t: "你会在哪里", rel: 9 } ] },
  ],
  s12: [
    { key: "intro", label: "开头", coach: "仰望式起音，干净有朝气，别紧喉咙。", lines: [
      { t: "夜空中最亮的星", rel: 0 }, { t: "能否听清", rel: 2 },
      { t: "那仰望的人", rel: 3 }, { t: "心底的孤独和叹息", rel: 1 } ] },
    { key: "verse", label: "主歌", coach: "旋律好记，跟住节奏，情绪往上走。", lines: [
      { t: "夜空中最亮的星", rel: 3 }, { t: "能否记起", rel: 5 },
      { t: "曾与我同行 消失在风里的身影", rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌高亢但好记，敢放上去点亮全场。", lines: [
      { t: "我祈祷拥有一颗透明的心灵", rel: 7 }, { t: "和会流泪的眼睛", rel: 9 } ] },
  ],
};

// 取某首歌的分句教学结构（无详细歌词的歌用通用模板）
function getSegments(song) {
  if (SONG_LYRICS[song.id]) return SONG_LYRICS[song.id];
  return [
    { key: "intro", label: "开头", coach: "轻轻起音，先找到舒服的位置，气别冲。", lines: [
      { t: `${song.title} · 开头第一句`, rel: 0 }, { t: `${song.title} · 开头第二句`, rel: 2 } ] },
    { key: "verse", label: "主歌", coach: "像说话一样唱，咬字清楚，把节奏稳住。", lines: [
      { t: `${song.title} · 主歌第一句`, rel: 2 }, { t: `${song.title} · 主歌第二句`, rel: 4 } ] },
    { key: "chorus", label: "副歌", coach: "副歌是记忆点，气从肚子走，句尾别掉。", lines: [
      { t: `${song.title} · 副歌第一句`, rel: 7 }, { t: `${song.title} · 副歌第二句`, rel: 9 } ] },
  ];
}

// 把整首歌所有段落的句子拉平，附带所属段标签（KTV 完整演唱用）
function getAllLines(song) {
  const segs = getSegments(song);
  const out = [];
  segs.forEach((s) => s.lines.forEach((ln) => out.push({ t: ln.t, rel: ln.rel, seg: s.label })));
  return out;
}

/* ---------------- 状态层 ---------------- */

const state = {
  screen: "home",            // home | test | report | playlist | song | practice | perform | result | share | coverpick | coverresult | history
  flow: "select",            // select(帮你选歌) | cover(用你的声音翻唱)
  taskIndex: 0,
  recordings: {},            // taskKey -> {duration, features}
  recording: false,
  processing: false,
  report: null,              // 声音 DNA 结果
  scene: "destiny",
  expandedScenes: {},        // sceneKey -> bool（查看更多）
  selectedSongId: null,
  segIndex: 0,               // 当前练习段落
  segResults: {},            // segIndex -> {score, pitch, rhythm, breath, tip}
  lastSeg: null,             // 最近一段反馈
  fullTakeScore: null,       // 完整演唱评分
  fullTakeBlob: null,        // 完整演唱录音(原声分享用)
  practiceResults: {},       // songId -> [{seg, score, ...}]
  lastScore: null,
  takes: [],                 // 保存的版本
  favorites: {},             // songId -> bool（翻唱收藏）
  coverPlaying: false,       // 翻唱试听中
  playingSeg: null,          // 正在播放示范的段 segIndex
  playingLineIdx: -1,        // 示范中正在唱的行(卡拉OK高亮)
  recordingSeg: null,        // 正在录的段 segIndex
  recordingFull: false,      // 正在完整演唱录音
  performLineIdx: -1,        // KTV 当前高亮行
  performing: false,         // KTV 演唱进行中
  resultTags: [],            // 演唱成绩：好效果标签
  resultTips: [],            // 演唱成绩：改进小建议
  myVersionPlaying: false,   // 成绩页试听我的版本
  shareCaption: "",          // 用户可编辑分享文案
  shareMode: "beauty",       // beauty(一键美化) | raw(原声)
  historyTab: "saved",       // saved(我的保存) | fav(我的收藏)
  currentWorkId: null,        // 本次演唱在「我的唱片」里的记录 id（保存/分享复用同一条，避免重复）
  previewPlaying: false,      // 正在试听官方原唱的 songId
  llmReasons: {},             // LLM 生成的选歌理由缓存（按 songId）
  toast: null,
};

/* ---------------- LLM 可插拔层（OpenAI 兼容） ----------------
   默认关闭，走本地模板；填入 API Key 即可启用真实大模型分析。
   Key 仅存在浏览器 localStorage，不上传到任何第三方。
   支持任意 OpenAI 兼容服务：OpenAI / 通义千问 / Kimi / DeepSeek / 本地 Ollama 等。 */
const LLM_DEFAULT = {
  enabled: false,
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o-mini",
};
function loadLLMConfig() {
  try { return Object.assign({}, LLM_DEFAULT, JSON.parse(localStorage.getItem("songfit_llm") || "{}")); }
  catch (e) { return Object.assign({}, LLM_DEFAULT); }
}
function saveLLMConfig(cfg) {
  try { localStorage.setItem("songfit_llm", JSON.stringify(cfg)); } catch (e) {}
}
function llmReady() {
  const c = loadLLMConfig();
  return !!(c.enabled && c.apiKey && c.endpoint && c.model);
}

// 通用对话调用：messages=[{role,content}]，返回纯文本；失败抛错由调用方兜底
async function llmChat(messages, maxTokens) {
  const c = loadLLMConfig();
  const resp = await fetch(c.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({
      model: c.model,
      messages,
      temperature: 0.85,
      max_tokens: maxTokens || 220,
    }),
  });
  if (!resp.ok) throw new Error("LLM HTTP " + resp.status);
  const data = await resp.json();
  const txt = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!txt) throw new Error("LLM empty");
  return txt.trim();
}

// 把声学特征整理成给模型看的描述
function voiceFeatureBrief(r) {
  const p = PERSONAS[r.persona];
  return [
    `音区人格类型：${p.name}`,
    `平均基频：${Math.round(r.meanFreq)}Hz`,
    `最低音约 ${freqToNote(r.low)}，最高音约 ${freqToNote(r.high)}`,
    `稳定度：${Math.round(r.stability * 100)}/100`,
    `气息时长能力：${Math.round(r.breath * 100)}/100`,
    `六维模型分：音域${r.metrics.range}、Key${r.metrics.key}、气息${r.metrics.breath}、节奏${r.metrics.rhythm}、音色${r.metrics.timbre}、情绪${r.metrics.emotion}，综合${r.overall}`,
  ].join("；");
}

// 【LLM 能力 1】生成「声音人格画像」文案（一句有温度的话）
async function llmPersonaHeadline(r) {
  const messages = [
    { role: "system", content: "你是一位温暖、专业的声乐导师兼文案。根据用户的嗓音声学数据，用一句话（30字以内、中文、不带引号、有画面感和情绪价值）描述TA声音的独特魅力。只输出这一句话本身。" },
    { role: "user", content: `这是我的嗓音数据：${voiceFeatureBrief(r)}。请用一句话形容我的声音。` },
  ];
  return llmChat(messages, 80);
}

// 【LLM 能力 2】生成「智能选歌理由」（为什么这首歌适合这把嗓子）
async function llmSongReason(song, r) {
  const messages = [
    { role: "system", content: "你是专业的声乐选曲顾问。根据用户嗓音数据和一首歌，用一句话（40字以内、中文、不带引号）解释为什么这首歌适合TA来唱，要具体到音区/气息/情绪等维度，像懂行的朋友在推荐。只输出这一句话。" },
    { role: "user", content: `我的嗓音数据：${voiceFeatureBrief(r)}。歌曲：《${song.title}》（${song.artist}，${song.mood}，${song.bpm}BPM）。为什么适合我唱？` },
  ];
  return llmChat(messages, 90);
}

/* ---------------- 音频层 ---------------- */

let audioCtx = null;
let micStream = null;
let analyser = null;
let recordRAF = null;
let exampleNodes = null;
let exampleTtsWatch = null;
let recordStartTs = 0;
let liveFeatureBuf = [];

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// 停掉示范发声
function stopExample() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (exampleTtsWatch) { clearTimeout(exampleTtsWatch); exampleTtsWatch = null; }
  if (exampleAudioEl) { try { exampleAudioEl.pause(); } catch (e) {} exampleAudioEl = null; }
  if (exampleNodes) {
    exampleNodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    exampleNodes = null;
  }
}

// 读句子任务：优先用系统真人语音；若所在环境的 TTS 不出声（部分内嵌浏览器有此问题），
// 则自动降级为「拟人音节朗读」——带元音共振峰 + 声调起伏 + 自然停顿，听起来像在念字而非机械嗡鸣。
function speakSentence(text, { rate = 0.96, pitch = 1 } = {}) {
  stopExample();
  const clean = extractSpoken(text);
  const ss = window.speechSynthesis;
  if (!ss) { synthSpeak(clean, { pitch }); return; }

  let started = false;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "zh-CN"; u.rate = rate; u.pitch = pitch;
  const voices = ss.getVoices();
  const v = voices.find((x) => /tingting|婷婷/i.test(x.name) && /zh/i.test(x.lang))
    || voices.find((x) => /zh-CN/i.test(x.lang))
    || voices.find((x) => /zh|chinese/i.test(x.lang));
  if (v) u.voice = v;
  u.onstart = () => { started = true; if (exampleTtsWatch) { clearTimeout(exampleTtsWatch); exampleTtsWatch = null; } };
  u.onerror = () => { if (!started) { if (exampleTtsWatch) clearTimeout(exampleTtsWatch); synthSpeak(clean, { pitch }); } };
  try { ss.speak(u); } catch (e) { synthSpeak(clean, { pitch }); return; }
  // 看门狗：350ms 内没真正开始播（onstart 未触发），判定为静默环境 → 走拟人合成
  exampleTtsWatch = setTimeout(() => {
    exampleTtsWatch = null;
    if (!started) { try { ss.cancel(); } catch (e) {} synthSpeak(clean, { pitch }); }
  }, 350);
}

// 取出引号里要念的句子
function extractSpoken(text) {
  const q = text.match(/[“"]([^”"]+)[”"]/);
  return (q ? q[1] : text).replace(/[“”"]/g, "").trim();
}

// 拟人音节朗读：把每个汉字合成成一个带元音音色 + 声调曲线的音节，标点处自然停顿
function synthSpeak(clean, { pitch = 1 } = {}) {
  const chars = clean.split("").filter((c) => !/\s/.test(c));
  if (!chars.length) return;
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const nodes = [];

  // 共振峰元音表（peaking 滤波 [freq, gain]）
  const VOWELS = [
    [[700, 10], [1150, 8]],  // a
    [[450, 9], [800, 7]],    // o
    [[500, 8], [1700, 7]],   // e
    [[320, 8], [2300, 9]],   // i
    [[350, 9], [700, 6]],    // u
  ];
  const baseHz = 150 * (pitch || 1);          // 接近自然说话基频
  const syl = 0.20, gap = 0.045;              // 每字时长 + 字间停顿
  let t = ctx.currentTime + 0.06;

  const out = ctx.createGain(); out.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.18;
  out.connect(comp); comp.connect(ctx.destination);

  chars.forEach((ch) => {
    // 标点 → 停顿，不发声
    if (/[，。、！？；：,.!?;:…—]/.test(ch)) { t += syl * 1.1; return; }
    const code = ch.charCodeAt(0);
    const vowel = VOWELS[code % VOWELS.length];
    const tone = code % 4;                     // 模拟普通话四声
    const f0 = baseHz * (0.94 + (code % 5) * 0.02); // 每字基频略有起伏，更自然
    const dur = syl * (0.85 + (code % 3) * 0.12);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const f = osc.frequency;
    f.setValueAtTime(f0, t);
    if (tone === 0) {                          // 一声：高平
      f.setValueAtTime(f0 * 1.05, t); f.linearRampToValueAtTime(f0 * 1.04, t + dur);
    } else if (tone === 1) {                    // 二声：上扬
      f.setValueAtTime(f0 * 0.92, t); f.linearRampToValueAtTime(f0 * 1.16, t + dur);
    } else if (tone === 2) {                    // 三声：先降后升
      f.setValueAtTime(f0 * 0.98, t);
      f.linearRampToValueAtTime(f0 * 0.82, t + dur * 0.45);
      f.linearRampToValueAtTime(f0 * 1.02, t + dur);
    } else {                                    // 四声：下降
      f.setValueAtTime(f0 * 1.18, t); f.linearRampToValueAtTime(f0 * 0.82, t + dur);
    }

    // 音节包络（自然的起音/收尾，形成“念字”的节奏感）
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
    sg.gain.setValueAtTime(0.5, t + dur * 0.7);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(sg);
    let chain = sg;
    vowel.forEach(([fq, g]) => {
      const p = ctx.createBiquadFilter();
      p.type = "peaking"; p.frequency.value = fq; p.Q.value = 1.0; p.gain.value = g;
      chain.connect(p); chain = p;
    });
    chain.connect(out);
    osc.start(t); osc.stop(t + dur + 0.02);
    nodes.push(osc);

    // 字头辅音感：极短噪声 burst，让发音更像“咬字”
    const nb = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    nb.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0.06;
    nb.connect(bp); bp.connect(ng); ng.connect(out);
    nb.start(t); nb.stop(t + 0.02);
    nodes.push(nb);

    t += dur + gap;
  });

  exampleNodes = nodes;
}

// 测音高任务：人声化哼唱（双锯齿 + 共振峰增强 + 压限），真正唱给用户听
function singHum({ vowel = "a", startHz = 220, endHz = 220, duration = 4, vibrato = false }) {
  stopExample();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime + 0.05;
  const nodes = [];
  const s1 = ctx.createOscillator(), s2 = ctx.createOscillator();
  s1.type = "sawtooth"; s2.type = "sawtooth";
  [s1, s2].forEach((o, i) => {
    o.frequency.setValueAtTime(startHz, now);
    if (endHz !== startHz) o.frequency.exponentialRampToValueAtTime(endHz, now + duration * 0.9);
    o.detune.value = i ? -8 : 0;
  });
  if (vibrato) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5.2; lg.gain.value = 7;
    lfo.connect(lg); lg.connect(s1.detune); lg.connect(s2.detune);
    lfo.start(now); lfo.stop(now + duration + 0.2); nodes.push(lfo);
  }
  const sg = ctx.createGain(); sg.gain.value = 0.5;
  s1.connect(sg); s2.connect(sg);
  const formants = {
    m: [[280, 7], [1000, 5]], a: [[700, 9], [1150, 7]], hum: [[400, 8], [950, 5]],
  }[vowel] || [[700, 9], [1150, 7]];
  let chain = sg;
  formants.forEach(([f, g]) => {
    const p = ctx.createBiquadFilter();
    p.type = "peaking"; p.frequency.value = f; p.Q.value = 1.1; p.gain.value = g;
    chain.connect(p); chain = p;
  });
  if (vowel === "m" || vowel === "hum") {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = vowel === "m" ? 1500 : 2400;
    chain.connect(lp); chain = lp;
  }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.2;
  chain.connect(comp);
  const out = ctx.createGain(); comp.connect(out); out.connect(ctx.destination);
  const pv = 0.55;
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(pv, now + 0.15);
  out.gain.setValueAtTime(pv, now + duration - 0.4);
  out.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  s1.start(now); s2.start(now); s1.stop(now + duration + 0.1); s2.stop(now + duration + 0.1);
  nodes.push(s1, s2);
  exampleNodes = nodes;
}

// 预录真人示范音频（用本机高质量 TTS「婷婷」女声预录，避免内嵌环境实时合成的杂音）
const EXAMPLE_AUDIO = {
  shortPhrase: "audio/ex_shortPhrase.m4a",
  longBreath: "audio/ex_longBreath.m4a",
  emotionLine: "audio/ex_emotionLine.m4a",
};
let exampleAudioEl = null;

// 停掉预录音频
function stopExampleAudio() {
  if (exampleAudioEl) { try { exampleAudioEl.pause(); } catch (e) {} exampleAudioEl = null; }
}

// 播放预录的真人示范句；加载失败再退回实时拟人合成
function playExampleAudio(taskKey, prompt, opts) {
  stopExample();
  const src = EXAMPLE_AUDIO[taskKey];
  if (!src) { speakSentence(prompt, opts); return; }
  const a = new Audio(src);
  exampleAudioEl = a;
  a.addEventListener("error", () => {
    if (exampleAudioEl !== a) return;
    exampleAudioEl = null;
    speakSentence(prompt, opts); // 兜底：实时合成
  });
  a.play().catch(() => {
    if (exampleAudioEl !== a) return;
    exampleAudioEl = null;
    speakSentence(prompt, opts);
  });
}

function playExample(taskKey) {
  const task = TEST_TASKS.find((t) => t.key === taskKey);
  if (!task) return;
  if (task.exampleType === "down") { singHum({ vowel: "m", startHz: 240, endHz: 130, duration: 4 }); return; }
  if (task.exampleType === "up") { singHum({ vowel: "a", startHz: 230, endHz: 380, duration: 4 }); return; }
  if (task.key === "emotionLine") { playExampleAudio(task.key, task.prompt, { rate: 0.88, pitch: 0.95 }); return; }
  playExampleAudio(task.key, task.prompt, { rate: 0.96, pitch: 1 });
}

/* ---------------- 翻唱合成：用用户音色把旋律“唱”出来 ---------------- */

let coverNodes = null;
let coverTimer = null;

// 每首歌一段确定性旋律（半音相对值），用用户嗓音基频做基准音高
function melodyFor(song) {
  // 不同情绪/风格给不同的旋律线（相对半音 + 时值拍）
  const patterns = {
    青春: [0, 2, 4, 7, 4, 2, 0, -3], 深情: [0, -2, -3, 0, 2, 0, -2, -5],
    温柔: [0, 2, 3, 5, 3, 2, 0, 2], 释怀: [0, 3, 5, 7, 5, 3, 2, 0],
    燃: [0, 4, 7, 12, 7, 9, 7, 4], 暗黑: [0, -1, 2, -1, 3, 2, 0, -3],
    苦情: [0, 2, 0, -2, -3, -2, 0, 3], 治愈: [0, 2, 4, 5, 4, 2, 4, 0],
    释然: [0, 3, 2, 5, 3, 0, 2, -2], 想念: [0, 4, 5, 7, 5, 4, 2, 0],
    民谣: [0, 2, 0, 4, 2, 0, -2, 0], 励志: [0, 5, 7, 9, 7, 5, 7, 12],
  };
  const steps = patterns[song.mood] || [0, 2, 4, 5, 4, 2, 0, -3];
  // 重复两段，加点变化
  return steps.concat(steps.map((s, i) => s + (i % 2 ? 2 : -2)));
}

// 根据用户基频确定起始音（落在舒适音区里）
function coverBaseHz() {
  const mf = state.report ? state.report.meanFreq : 200;
  let base = mf;
  while (base > 260) base /= 2;
  while (base < 150) base *= 2;
  return base;
}

function stopCover() {
  if (coverTimer) { clearTimeout(coverTimer); coverTimer = null; }
  if (coverNodes) { coverNodes.forEach((n) => { try { n.stop(); } catch (e) {} }); coverNodes = null; }
}

/* 真实原唱试听（iTunes 30 秒官方预览） */
let previewAudio = null;
function stopPreview() {
  if (previewAudio) { try { previewAudio.pause(); } catch (e) {} previewAudio = null; }
  if (state.previewPlaying) state.previewPlaying = false;
}
function playPreview(songId) {
  stopPreview(); stopCover(); stopExample();
  const media = songMedia(songId);
  if (!media || !media.preview) { showToast("这首暂无官方试听 🙏"); return; }
  const a = new Audio(media.preview);
  a.crossOrigin = "anonymous";
  previewAudio = a;
  state.previewPlaying = songId;
  a.addEventListener("ended", () => { state.previewPlaying = false; previewAudio = null; if (state.screen === "song" || state.screen === "playlist") render(); });
  a.addEventListener("error", () => { state.previewPlaying = false; previewAudio = null; showToast("试听加载失败，检查下网络 🙏"); render(); });
  a.play().catch(() => { state.previewPlaying = false; previewAudio = null; showToast("浏览器拦截了自动播放，再点一次 🙏"); render(); });
  render();
}

// 单个音符：双锯齿 + 共振峰，模拟人声“啊”
function synthNote(ctx, freq, t0, dur, gainMul, dest, store) {
  const s1 = ctx.createOscillator(), s2 = ctx.createOscillator();
  s1.type = "sawtooth"; s2.type = "sawtooth";
  s1.frequency.value = freq; s2.frequency.value = freq; s2.detune.value = -7;
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 5; lg.gain.value = 6;
  lfo.connect(lg); lg.connect(s1.detune); lg.connect(s2.detune);
  const sg = ctx.createGain(); sg.gain.value = 0.5;
  s1.connect(sg); s2.connect(sg);
  let chain = sg;
  [[700, 9], [1150, 6]].forEach(([f, g]) => {
    const p = ctx.createBiquadFilter();
    p.type = "peaking"; p.frequency.value = f; p.Q.value = 1.1; p.gain.value = g;
    chain.connect(p); chain = p;
  });
  const env = ctx.createGain();
  const pv = 0.5 * gainMul;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(pv, t0 + 0.06);
  env.gain.setValueAtTime(pv, t0 + dur - 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  chain.connect(env); env.connect(dest);
  s1.start(t0); s2.start(t0); lfo.start(t0);
  const end = t0 + dur + 0.05;
  s1.stop(end); s2.stop(end); lfo.stop(end);
  if (store) store.push(s1, s2, lfo);
}

// 在线试听：用用户音色唱旋律
function playCover(song) {
  stopExample();
  stopCover();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4;
  const master = ctx.createGain(); master.gain.value = 0.85;
  comp.connect(master); master.connect(ctx.destination);
  const base = coverBaseHz();
  const mel = melodyFor(song);
  const beat = 60 / (song.bpm || 75) * 0.9; // 每个音时值
  const now = ctx.currentTime + 0.08;
  const nodes = [];
  let t = now;
  mel.forEach((semi, i) => {
    const freq = base * Math.pow(2, semi / 12);
    const dur = beat * (i % 4 === 3 ? 1.4 : 1);
    synthNote(ctx, freq, t, dur, 1, comp, nodes);
    t += dur;
  });
  coverNodes = nodes;
  const total = (t - now) * 1000;
  coverTimer = setTimeout(() => { state.coverPlaying = false; coverNodes = null; if (state.screen === "coverresult" || state.screen === "share") render(); }, total + 200);
}

// 真实麦克风录音
async function startRecording() {
  try {
    if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    const src = ctx.createMediaStreamSource(micStream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    state.recording = true;
    recordStartTs = Date.now();
    liveFeatureBuf = [];
    render();
    monitorLive();
  } catch (e) {
    // 没有麦克风权限时退化为模拟，但仍能体验全流程
    state.recording = true;
    recordStartTs = Date.now();
    liveFeatureBuf = [];
    render();
    monitorLiveFallback();
  }
}

function monitorLive() {
  if (!state.recording || !analyser) return;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  let sum = 0, zc = 0;
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i] * buf[i];
    if (i > 0 && (buf[i] >= 0) !== (buf[i - 1] >= 0)) zc++;
  }
  const rms = Math.sqrt(sum / buf.length);
  const freqApprox = (zc / 2) * (getCtx().sampleRate / buf.length);
  liveFeatureBuf.push({ rms, freq: freqApprox });
  paintWave(Math.min(1, rms * 6));
  recordRAF = requestAnimationFrame(monitorLive);
}

function monitorLiveFallback() {
  if (!state.recording) return;
  const t = (Date.now() - recordStartTs) / 1000;
  const rms = 0.3 + 0.25 * Math.abs(Math.sin(t * 4));
  const freq = 180 + 80 * Math.sin(t * 1.5);
  liveFeatureBuf.push({ rms, freq });
  paintWave(rms);
  recordRAF = requestAnimationFrame(monitorLiveFallback);
}

function paintWave(level) {
  const bars = document.querySelectorAll(".wave-live i");
  if (!bars.length) return;
  bars.forEach((b, i) => {
    const base = 8 + Math.random() * level * 38;
    const mid = 1 - Math.abs(i - bars.length / 2) / (bars.length / 2);
    b.style.height = `${Math.max(6, base * (0.5 + mid))}px`;
  });
}

function stopRecording() {
  state.recording = false;
  if (recordRAF) cancelAnimationFrame(recordRAF);
  const duration = (Date.now() - recordStartTs) / 1000;
  const task = TEST_TASKS[state.taskIndex];
  // 从实时缓冲提取特征
  const feats = liveFeatureBuf.length ? liveFeatureBuf : [{ rms: 0.3, freq: 180 }];
  const avgRms = avg(feats.map((f) => f.rms));
  const freqs = feats.map((f) => f.freq).filter((f) => f > 50 && f < 1000);
  const avgFreq = freqs.length ? avg(freqs) : 180;
  const minFreq = freqs.length ? Math.min(...freqs) : 120;
  const maxFreq = freqs.length ? Math.max(...freqs) : 300;
  const stability = 1 - Math.min(1, std(feats.map((f) => f.rms)) / (avgRms + 0.001));
  state.recordings[task.key] = { duration, avgRms, avgFreq, minFreq, maxFreq, stability };
  // 进入下一任务 or 出报告
  if (state.taskIndex < TEST_TASKS.length - 1) {
    state.taskIndex++;
    render();
  } else {
    runAnalysis();
  }
}

function avg(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
function std(a) { if (!a.length) return 0; const m = avg(a); return Math.sqrt(avg(a.map((x) => (x - m) ** 2))); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// 分析：生成声音 DNA + 6 维模型分
function runAnalysis() {
  state.processing = true;
  render();
  setTimeout(() => {
    const recs = state.recordings;
    const allFreqs = Object.values(recs).map((r) => r.avgFreq).filter(Boolean);
    const meanFreq = allFreqs.length ? avg(allFreqs) : 190;
    const low = recs.lowProbe ? recs.lowProbe.minFreq : 120;
    const high = recs.highProbe ? recs.highProbe.maxFreq : 320;
    const stability = avg(Object.values(recs).map((r) => r.stability || 0.6));
    const breath = (recs.longBreath && recs.longBreath.duration) ? clamp(recs.longBreath.duration / 8, 0.3, 1) : 0.6;

    // 声线人格判定
    let persona = "warm";
    if (meanFreq > 240) persona = "bright";
    else if (meanFreq < 160) persona = "low";
    if (stability > 0.72 && breath > 0.7) persona = meanFreq > 220 ? "spark" : persona;

    // 6 维模型分（0-100）
    const metrics = {
      range: Math.round(clamp(40 + (high - low) / 4, 55, 96)),
      key: Math.round(clamp(60 + stability * 30, 60, 95)),
      breath: Math.round(clamp(breath * 100, 55, 96)),
      rhythm: Math.round(clamp(50 + stability * 40, 55, 94)),
      timbre: Math.round(clamp(62 + (1 - Math.abs(meanFreq - 200) / 200) * 30, 60, 95)),
      emotion: Math.round(clamp(58 + (recs.emotionLine ? recs.emotionLine.avgRms * 60 : 20), 60, 95)),
    };
    const overall = Math.round(
      SELECTION_MODEL.reduce((s, m) => s + metrics[m.key] * m.weight, 0)
    );

    state.report = { persona, meanFreq, low, high, stability, breath, metrics, overall, llmHeadline: null };
    state.llmReasons = {};
    state.processing = false;
    state.screen = "report";
    render();
    // 若已配置 LLM，异步生成真实「声音人格画像」文案，到达后无缝替换模板
    if (llmReady()) {
      state.report.llmLoading = true;
      llmPersonaHeadline(state.report)
        .then((txt) => { if (state.report) { state.report.llmHeadline = txt; state.report.llmLoading = false; if (state.screen === "report") render(); } })
        .catch(() => { if (state.report) { state.report.llmLoading = false; } });
    }
  }, 2200);
}

// 翻唱匹配度：用户嗓音与某首歌的综合契合（0-100）
function coverMatch(song) {
  return scoreSong(song);
}

// 按人格 + 模型给每首歌算匹配分
function scoreSong(song) {
  if (!state.report) return 80;
  const p = state.report.persona;
  let base = song.fitFor.includes(p) ? 88 : 74;
  base += (song.fitFor[0] === p) ? 6 : 0;
  // 用模型整体分微调
  base += Math.round(((state.report.overall || 82) - 78) * 0.2);
  // 稳定的小随机让每首不同但确定
  const seed = song.id.charCodeAt(1) % 7;
  return clamp(base + seed - 3, 70, 98);
}

function songsForScene(sceneKey) {
  return SONG_LIBRARY
    .filter((s) => s.scenes.includes(sceneKey))
    .map((s) => ({ ...s, match: scoreSong(s) }))
    .sort((a, b) => b.match - a.match);
}

function getSong(id) { return SONG_LIBRARY.find((s) => s.id === id); }

// AI 用你的声音唱目标版本文案
function aiTargetFor(song) {
  const p = PERSONAS[state.report ? state.report.persona : "warm"];
  return {
    title: `用你的声音唱《${song.title}》会是什么样`,
    desc: `我们保留你${p.name.replace("系", "")}的音色，帮你适度修亮、修稳。这就是你练好之后，大概会有的样子。`,
  };
}

/* ---------------- 渲染层 ---------------- */

const app = () => document.getElementById("app");

function render() {
  const root = app();
  if (!root) return;
  let html = "";
  switch (state.screen) {
    case "home": html = renderHome(); break;
    case "test": html = state.processing ? renderProcessing() : renderTest(); break;
    case "report": html = renderReport(); break;
    case "playlist": html = renderPlaylist(); break;
    case "song": html = renderSong(); break;
    case "practice": html = renderPractice(); break;
    case "perform": html = renderPerform(); break;
    case "result": html = renderResult(); break;
    case "share": html = renderShare(); break;
    case "coverpick": html = renderCoverpick(); break;
    case "coverresult": html = renderCoverresult(); break;
    case "history": html = renderHistory(); break;
    case "settings": html = renderSettings(); break;
    default: html = renderHome();
  }
  root.innerHTML = `<div class="screen-enter">${html}</div>`;
  bindEvents();
  postRender();
}

function renderHome() {
  return `
    <div class="hero">
      <div class="brand-row">
        <div class="brand-logo">♪</div>
        <div class="brand-name"><span class="bn-zh">Right<span class="bn-accent">Song</span></span><small>你的声音 · 对的歌</small></div>
        <button class="brand-set ${llmReady() ? "on" : ""}" data-action="go-settings" title="AI 分析设置">${llmReady() ? "✦ AI" : "⚙"}</button>
      </div>

      <div class="hero-orb-wrap">
        <div class="hero-orb">
          <div class="eq"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>

      <p class="kicker">RIGHTSONG · 你的专属声音</p>
      <h1 class="hero-title">你的声音，<br/><span class="grad-text">值得一首对的歌。</span></h1>
      <p class="hero-sub">不用乐理，不用天赋，只需要你的声音。</p>

      <div class="hero-actions">
        <div class="big-action a1 glass" data-action="start-cover">
          <div class="ic">🎙️</div>
          <div>
            <h3>用我的声音，唱给我听</h3>
            <p>测完嗓音，AI 用你的声线翻唱任何一首歌</p>
          </div>
          <div class="arrow">›</div>
        </div>
        <div class="big-action a2 glass" data-action="start-select">
          <div class="ic">🎯</div>
          <div>
            <h3>帮我选一首对的歌</h3>
            <p>用专业 6 维模型，挑真正合你的歌</p>
          </div>
          <div class="arrow">›</div>
        </div>
      </div>

      <p class="hero-foot">全程只需 1 分钟 · 5 个轻松小测试<br/>不会唱也没关系，我会一句句带你</p>

      ${(() => {
        const ws = loadWorks();
        return `
      <div class="works-entry glass" data-action="go-history">
        <div class="we-ic">💿</div>
        <div class="we-txt">
          <div class="we-title">我的唱片</div>
          <div class="we-sub">${ws.length ? `重温你唱过的 ${ws.length} 首歌` : "你唱过的歌，都会收进这里"}</div>
        </div>
        <div class="we-stack">${ws.slice(0, 3).map((w) => `<span>${w.emoji}</span>`).join("") || "🎙️"}</div>
        <div class="arrow">›</div>
      </div>`;
      })()}
    </div>
  `;
}

function topbar(progress, label, backAction) {
  return `
    <div class="topbar">
      <button class="icon-btn" data-action="${backAction || "go-home"}">‹</button>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      <span class="progress-label">${label}</span>
    </div>
  `;
}

function renderTest() {
  const task = TEST_TASKS[state.taskIndex];
  const progress = Math.round((state.taskIndex / TEST_TASKS.length) * 100);
  const isSing = task.exampleType === "down" || task.exampleType === "up";
  const dots = TEST_TASKS.map((t, i) => {
    const cls = i < state.taskIndex ? "done" : i === state.taskIndex ? "active" : "";
    return `<i class="${cls}"></i>`;
  }).join("");
  return `
    ${topbar(progress, `${state.taskIndex + 1}/${TEST_TASKS.length}`)}
    ${state.taskIndex === 0
      ? `<div class="test-intro glass">
          <p class="ti-title">🎧 先来测测你的嗓音</p>
          <p class="ti-sub">接下来 ${TEST_TASKS.length} 个小测试，跟着读句子、滑两个音就行。我会一边听一边分析你的<b>音色、音域和气息</b>，再为你挑到对的歌。全程约 1 分钟，不用会唱。</p>
        </div>`
      : `<p class="test-hint-top">第 ${state.taskIndex + 1} 步 · 还在测你的嗓音，跟着做就好</p>`}
    <div class="task-meta">
      <p class="kicker">${task.icon} ${task.title}</p>
    </div>
    <div class="test-orb-zone">
      <div class="mic-orb ${state.recording ? "recording" : ""}" data-action="toggle-record">
        <span class="rec-ring"></span>
        <span class="mic-ic">${state.recording ? "⏸" : "🎙️"}</span>
      </div>
    </div>
    <div class="wave-live">${Array.from({ length: 21 }).map(() => "<i></i>").join("")}</div>

    <p class="task-prompt">${task.prompt}</p>
    <p class="task-tip">${task.tip}</p>

    <div class="example-row">
      <button class="example-chip" data-action="play-example" data-task="${task.key}">
        ${isSing ? "🔊 听我唱一遍" : "🔊 听我读一遍"}
      </button>
    </div>

    <div class="task-dots">${dots}</div>
    <p class="task-tip" style="text-align:center">${state.recording ? "正在听你的声音… 说完点一下暂停" : "点中间的麦克风，开始这一句"}</p>
  `;
}

function renderProcessing() {
  return `
    ${topbar(100, "分析中")}
    <div style="text-align:center;padding-top:40px">
      <div class="processing-ring"><div class="spinner"></div></div>
      <h2 class="section-title" style="margin-top:24px">正在解析你的声音 DNA</h2>
      <p class="section-sub">音域 · 气息 · 音色 · 情绪 · 稳定度<br/>用专业模型为你逐项打分…</p>
    </div>
  `;
}

function renderReport() {
  const r = state.report;
  const p = PERSONAS[r.persona];
  const lowNote = freqToNote(r.low);
  const highNote = freqToNote(r.high);
  const metricRows = SELECTION_MODEL.map((m) => `
    <div class="metric">
      <div class="top"><span class="name">${m.name}</span><span class="val">${r.metrics[m.key]}</span></div>
      <div class="bar"><span data-w="${r.metrics[m.key]}"></span></div>
    </div>
  `).join("");
  return `
    ${topbar(100, "声音 DNA")}
    <div class="dna-hero">
      <span class="dna-badge">✦ 你的声音 DNA 已生成</span>
      <div style="font-size:60px;margin-bottom:6px">${p.emoji}</div>
      <div class="dna-persona grad-text">${p.name}</div>
      ${r.llmHeadline
        ? `<p class="dna-headline"><span class="llm-tag">AI</span>${r.llmHeadline}</p>`
        : r.llmLoading
          ? `<p class="dna-headline llm-loading">AI 正在读你的声音<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>`
          : `<p class="dna-headline">${p.headline}</p>`}
      <div class="tag-row">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
    </div>

    <div class="range-card glass">
      <h3>🎚️ 你的舒适音域</h3>
      <div class="range-bar"><div class="range-fill" style="left:18%;width:54%"></div></div>
      <div class="range-labels"><span>最低 ${lowNote}</span><span>综合评分 ${r.overall}</span><span>最高 ${highNote}</span></div>
    </div>

    <div class="model-card glass">
      <h3>专业选曲适配度</h3>
      <p class="sub">这是我们为你挑歌的依据 · 综合 ${r.overall} 分</p>
      ${metricRows}
    </div>

    <div class="spacer"></div>
    ${state.flow === "cover"
      ? `<button class="btn btn-primary" data-action="go-coverpick"><span class="shine"></span>🎙️ 选一首，用我的声音唱 →</button>`
      : `<button class="btn btn-primary" data-action="go-playlist"><span class="shine"></span>看看为我选的歌 →</button>`}
    <div class="spacer-sm"></div>
  `;
}

function renderPlaylist() {
  const scenes = SCENES.map((s) => `
    <div class="scene-chip ${state.scene === s.key ? "active" : ""}" data-action="set-scene" data-scene="${s.key}">
      <span class="sc-emoji">${s.emoji}</span><span class="sc-name">${s.name}</span>
    </div>
  `).join("");
  const all = songsForScene(state.scene);
  const expanded = state.expandedScenes[state.scene];
  const top = expanded ? all.slice(0, 5) : all.slice(0, 3);
  const topSong = all[0];
  const ai = topSong ? aiTargetFor(topSong) : null;

  const songCards = top.map((s, i) => `
    <div class="song-card glass" data-action="open-song" data-id="${s.id}">
      <div class="song-rank">${i + 1}</div>
      <div class="song-art">${s.emoji}</div>
      <div class="song-info">
        <div class="t">${s.title} <span class="song-emoji">${moodEmoji(s.mood)}</span></div>
        <div class="a">${s.artist} · ${s.mood}</div>
        <div class="reason">${s.reason}</div>
      </div>
      <div class="match-ring" style="background:conic-gradient(${matchColor(s.match)} ${s.match * 3.6}deg, rgba(255,255,255,0.08) 0)">
        <div style="position:absolute;inset:4px;border-radius:50%;background:var(--bg-2);display:grid;place-items:center">
          <span class="grad-text">${s.match}</span>
        </div>
      </div>
    </div>
  `).join("");

  let moreBlock = "";
  if (!expanded && all.length > 3) {
    moreBlock = `<button class="more-btn" data-action="expand-scene">查看更多（共 ${all.length} 首）</button>`;
  } else if (expanded) {
    moreBlock = `
      <div class="member-lock">
        <div class="ic">👑</div>
        <p>更完整的「${SCENES.find((x) => x.key === state.scene).name}」歌单<br/>开通会员可解锁全部 ${all.length}+ 首精准推荐</p>
        <button class="btn btn-sm btn-primary" data-action="toast-member" style="margin:0 auto"><span class="shine"></span>了解会员</button>
      </div>`;
  }

  return `
    ${topbar(100, "为你选的歌", "go-report")}
    <h2 class="section-title">天选歌单 🎧</h2>
    <p class="section-sub">基于你的声音 DNA，挑个此刻的心情场景</p>
    <div class="scene-grid">${scenes}</div>

    ${ai ? `
    <div class="ai-target glass">
      <span class="label">AI 声音预览</span>
      <h3>${ai.title}</h3>
      <p>${ai.desc}</p>
      <div class="ai-wave">${Array.from({ length: 28 }).map((_, i) => `<i style="height:${8 + (i % 5) * 5}px;animation-delay:${i * 0.05}s"></i>`).join("")}</div>
    </div>` : ""}

    ${songCards}
    ${moreBlock}
    <div class="spacer"></div>
  `;
}

function renderSong() {
  const song = getSong(state.selectedSongId);
  const ai = aiTargetFor(song);
  const media = songMedia(song.id);
  const isPrev = state.previewPlaying === song.id;
  return `
    ${topbar(100, "这首歌", "go-playlist")}
    <div class="song-hero">
      <div class="art-lg ${media && media.art ? "has-cover" : ""}">
        ${media && media.art ? `<img src="${media.art}" alt="${song.title}" loading="lazy"/>` : song.emoji}
      </div>
      <h2>${song.title}</h2>
      <div class="a">${song.artist}${media && media.album ? ` · 《${media.album}》` : ""}</div>
      <div class="chip-line">
        <span class="info-chip">匹配 ${scoreSong(song)} 分</span>
        <span class="info-chip">${song.mood} ${moodEmoji(song.mood)}</span>
        <span class="info-chip">${song.bpm} BPM</span>
      </div>
      ${media && media.preview ? `
      <button class="preview-btn ${isPrev ? "on" : ""}" data-action="toggle-preview" data-id="${song.id}">
        <span class="pv-ic">${isPrev ? "❚❚" : "▶"}</span>
        ${isPrev ? "正在试听原唱…" : "试听原唱片段（30s）"}
        ${isPrev ? `<span class="pv-eq">${Array.from({ length: 4 }).map(() => "<i></i>").join("")}</span>` : ""}
      </button>
      <div class="preview-note">官方授权片段 · 来自 Apple Music</div>` : ""}
    </div>

    <div class="ai-target glass" style="margin-top:20px">
      <span class="label">为什么推荐给你</span>
      ${(state.llmReasons && state.llmReasons[song.id])
        ? `<h3 style="font-size:16px"><span class="llm-tag">AI</span>${state.llmReasons[song.id]}</h3>`
        : (state.llmReasons && state.llmReasons[song.id + "_loading"])
          ? `<h3 style="font-size:16px" class="llm-loading">AI 正在为你分析这首歌<span class="dots"><i>.</i><i>.</i><i>.</i></span></h3>`
          : `<h3 style="font-size:16px">${song.reason}</h3>`}
      <p>${ai.desc}</p>
    </div>

    <div class="spacer-sm"></div>
    <button class="btn btn-primary" data-action="go-practice"><span class="shine"></span>一段一段学会这首歌 →</button>
    <div class="spacer-sm"></div>
    <button class="btn btn-ghost" data-action="go-playlist">换一首看看</button>
    <div class="spacer"></div>
  `;
}

function renderPractice() {
  const song = getSong(state.selectedSongId);
  const segs = getSegments(song);
  const seg = segs[state.segIndex];

  // 进度：已练段数 / 总段数
  const totalSegs = segs.length;
  const doneSegs = Object.keys(state.segResults).length;
  const pct = Math.round((doneSegs / totalSegs) * 100);

  const segTabs = segs.map((s, i) => {
    const done = !!state.segResults[i];
    return `
    <div class="seg-tab ${i === state.segIndex ? "active" : ""} ${done ? "tab-done" : ""}" data-action="set-seg" data-i="${i}">
      <div class="l">${i === 0 ? "🎬" : i === segs.length - 1 ? "🎯" : "🎵"} ${s.label}</div>
      <div class="n">${s.lines.length} 句${done ? " ✓" : ""}</div>
    </div>`;
  }).join("");

  const playing = state.playingSeg === state.segIndex;
  const recording = state.recordingSeg === state.segIndex;
  const res = state.segResults[state.segIndex];

  // 整段歌词成块展示（示范时逐行高亮）
  const lyricLines = seg.lines.map((ln, li) => `
    <div class="lyc-line ${playing && state.playingLineIdx === li ? "lit" : ""} ${playing && state.playingLineIdx > li ? "passed" : ""}">${ln.t}</div>
  `).join("");

  // 段落三维反馈
  const segFeedback = res ? `
    <div class="seg-result">
      <div class="sr-head">
        <div class="sr-score grad-text">${res.score}<small>分</small></div>
        <div class="sr-tip">${res.tip}</div>
      </div>
      <div class="sr-bars">
        ${metricBar("音准", res.pitch)}
        ${metricBar("节奏", res.rhythm)}
        ${metricBar("气息", res.breath)}
      </div>
      ${state.segIndex < segs.length - 1
        ? `<button class="btn btn-cool" data-action="next-seg"><span class="shine"></span>下一段：${segs[state.segIndex + 1].label} →</button>`
        : `<div class="sr-alldone">🎉 三段都学会了，下面来完整唱一遍！</div>`}
    </div>` : "";

  // 完整演唱入口（三段全练完才解锁）→ 跳转 KTV 页
  let finishBlock = "";
  if (doneSegs >= totalSegs) {
    finishBlock = `
      <div class="finish-card glass">
        <div class="fc-top">
          <div class="fc-ic">🏁</div>
          <div>
            <div class="fc-title">每一段都学会了，完整唱一遍吧</div>
            <div class="fc-sub">进入 KTV 模式，跟着歌词一气呵成唱完整首</div>
          </div>
        </div>
        <button class="btn btn-primary" data-action="go-perform">
          <span class="shine"></span>🎤 完整演唱这首歌
        </button>
        ${state.fullTakeScore ? `
          <div class="full-result">
            <div class="fr-score grad-text">${state.fullTakeScore}<small>分</small></div>
            <div class="fr-text">上一次完整演唱 ${state.fullTakeScore} 分，可在「我的唱片」里回顾 🎉</div>
          </div>` : ""}
      </div>`;
  }

  let versionBlock = "";
  if (state.takes.length) {
    versionBlock = `
      <div class="spacer"></div>
      <h3 class="block-title">🎵 这首歌我存的版本</h3>
      <div class="version-list">
        ${state.takes.filter((t) => t.songId === song.id).map((t) => `
          <div class="version-row">
            <span>💿</span>
            <span class="v">${t.songTitle} · ${t.label}</span>
            <span class="s">${t.score}</span>
          </div>`).join("") || `<div class="version-empty">还没有保存这首歌的版本</div>`}
      </div>
      <button class="btn btn-primary" data-action="go-share"><span class="shine"></span>去分享我的演唱 →</button>
    `;
  }

  return `
    ${topbar(pct, `分段学唱 · ${pct}%`, "go-song")}
    <div class="practice-hero">
      <div class="ph-art">${song.emoji}</div>
      <div>
        <h2>${song.title}</h2>
        <div class="a">${song.artist} · 一段一段，慢慢学会它</div>
      </div>
    </div>

    <div class="seg-tabs">${segTabs}</div>

    <div class="coach-tip glass">
      <span class="ct-ava">👩‍🏫</span>
      <div><b>${seg.label}怎么唱：</b>${seg.coach}</div>
    </div>

    <div class="seg-stage glass ${recording ? "recording" : ""}">
      <div class="seg-stage-top">
        <span class="ss-label">${seg.label} · 共 ${seg.lines.length} 句</span>
        <button class="seg-play ${playing ? "on" : ""}" data-action="play-seg">
          ${playing ? "❚❚ 示范中" : "▶ 听这段示范"}
        </button>
      </div>
      <div class="lyric-block">${lyricLines}</div>
      ${recording ? `<div class="wave-live mini">${Array.from({ length: 22 }).map(() => "<i></i>").join("")}</div>` : ""}
      <button class="btn ${recording ? "btn-primary" : "btn-cool"}" data-action="sing-seg" style="margin-top:14px">
        <span class="shine"></span>${recording ? "● 唱完了，点此查看反馈" : (res ? "🎤 再唱一次这段" : "🎤 我要唱这一段")}
      </button>
      ${segFeedback}
    </div>

    ${finishBlock}
    ${versionBlock}
    <div class="spacer"></div>
  `;
}

// 段落三维指标条
function metricBar(label, val) {
  return `
    <div class="mbar">
      <span class="mb-label">${label}</span>
      <span class="mb-track"><i style="width:${val}%"></i></span>
      <span class="mb-val">${val}</span>
    </div>`;
}

/* ---------------- KTV 完整演唱页 ---------------- */

function renderPerform() {
  const song = getSong(state.selectedSongId);
  const lines = getAllLines(song);
  const total = lines.length;
  const cur = state.performLineIdx;
  const started = state.performing;
  const pct = started ? Math.round(((Math.max(cur, 0) + 1) / total) * 100) : 0;

  const lyricList = lines.map((ln, i) => {
    const cls = i === cur ? "lit" : i < cur ? "passed" : "";
    const showSeg = i === 0 || lines[i - 1].seg !== ln.seg;
    return `
      ${showSeg ? `<div class="ktv-seg">${ln.seg}</div>` : ""}
      <div class="ktv-line ${cls}">${ln.t}</div>`;
  }).join("");

  return `
    ${topbar(pct, started ? `演唱中 · ${Math.max(cur, 0) + 1}/${total}` : "KTV 完整演唱", "back-practice")}
    <div class="ktv-head">
      <div class="ktv-art ${started ? "playing" : ""}">${song.emoji}</div>
      <div>
        <h2 class="ktv-title">${song.title}</h2>
        <div class="ktv-artist">${song.artist} · 跟着高亮的歌词，一气呵成唱完它</div>
      </div>
    </div>

    <div class="ktv-lyrics ${started ? "live" : ""}" id="ktvLyrics">
      ${lyricList}
    </div>

    ${started
      ? `<div class="wave-live ktv-wave">${Array.from({ length: 24 }).map(() => "<i></i>").join("")}</div>
         <button class="btn btn-primary" data-action="finish-perform"><span class="shine"></span>● 唱完了，看看我的表现</button>`
      : `<div class="ktv-ready glass">
           <div class="kr-ic">🎤</div>
           <div class="kr-text">准备好了吗？点下面开始，<b>伴奏和歌词</b>会带着你唱完整首</div>
         </div>
         <button class="btn btn-primary" data-action="start-perform"><span class="shine"></span>🎬 开始演唱</button>`}
    <div class="spacer"></div>
  `;
}

/* ---------------- 演唱成绩页 ---------------- */

function renderResult() {
  const song = getSong(state.selectedSongId);
  const score = state.fullTakeScore || 88;
  const tags = state.resultTags || [];
  const tips = state.resultTips || [];
  const playing = state.myVersionPlaying;

  return `
    ${topbar(100, "我的演唱成绩", "go-perform")}
    <p class="kicker">🎉 整首唱完了，这是属于你的舞台时刻</p>

    <div class="result-score glass">
      <div class="rs-ring">
        <div class="rs-num grad-text">${score}</div>
        <div class="rs-unit">分</div>
      </div>
      <div class="rs-side">
        <div class="rs-song">${song.emoji} ${song.title}</div>
        <div class="rs-artist">${song.artist} · 完整演唱版</div>
        <button class="my-version ${playing ? "on" : ""}" data-action="play-my-version">
          ${playing ? "❚❚ 播放中…" : "▶ 听我唱的完整版"}
        </button>
      </div>
    </div>

    <h3 class="block-title">✨ 你唱出的高光</h3>
    <div class="result-tags">
      ${tags.map((t) => `<span class="rtag"><b>${t.icon}</b>${t.text}</span>`).join("")}
    </div>

    <h3 class="block-title">🌱 下次可以更好</h3>
    <div class="result-tips">
      ${tips.map((t) => `
        <div class="rtip glass">
          <span class="rt-ic">${t.icon}</span>
          <div class="rt-body"><b>${t.title}</b><p>${t.desc}</p></div>
        </div>`).join("")}
    </div>

    <div class="action-stack">
      <button class="btn btn-primary" data-action="save-take"><span class="shine"></span>💾 保存到我的唱片</button>
      <button class="btn btn-cool" data-action="go-share">📤 分享我的演唱</button>
      <button class="btn btn-ghost" data-action="go-practice">🎤 再练一遍 / 重唱</button>
    </div>
    <div class="spacer"></div>
  `;
}

// 根据三维表现 + 声线人格，生成「好效果标签」与「改进小建议」
function genResultFeedback(song, dims) {
  const persona = state.report ? state.report.persona : "warm";
  const dimArr = [["pitch", dims.pitch], ["rhythm", dims.rhythm], ["breath", dims.breath]].sort((a, b) => b[1] - a[1]);
  const strong = dimArr[0][0];
  const weak = dimArr[dimArr.length - 1][0];

  // —— 好效果标签（有情绪价值）——
  const goodByDim = {
    pitch: { icon: "🎯", text: "音准在线" },
    rhythm: { icon: "🥁", text: "节奏稳准狠" },
    breath: { icon: "🌬️", text: "气息超稳" },
  };
  const personaTag = {
    bright: { icon: "⚡", text: "穿透力强" },
    low: { icon: "🌌", text: "低音有磁性" },
    spark: { icon: "🌊", text: "律动很自然" },
    warm: { icon: "💗", text: "情绪很走心" },
  }[persona] || { icon: "💗", text: "情绪很走心" };
  const bonusPool = [
    { icon: "🚀", text: "高音不发怵" },
    { icon: "🎬", text: "代入感强" },
    { icon: "💎", text: "咬字干净" },
    { icon: "🔥", text: "越唱越敢放" },
  ];
  const tags = [];
  const seen = new Set();
  [goodByDim[strong], personaTag, bonusPool[Math.floor(Math.random() * bonusPool.length)]].forEach((tg) => {
    if (tg && !seen.has(tg.text)) { seen.add(tg.text); tags.push(tg); }
  });

  // —— 改进小建议（具体、可操作）——
  const tipByWeak = {
    pitch: { icon: "🎯", title: "个别地方音准飘了", desc: "副歌起音容易冲高，下次起音前先在心里默唱一下定调，会更准。" },
    rhythm: { icon: "⏱️", title: "有句调子唱快了半拍", desc: "主歌转副歌的地方别抢拍，跟着伴奏的鼓点稳住，听感会更扎实。" },
    breath: { icon: "🌬️", title: "长句气息没接住", desc: "遇到长句在标点处偷一口气，用肚子托住，句尾就不会发虚掉气。" },
  };
  const tips = [tipByWeak[weak]];
  const extraPool = [
    { icon: "💗", title: "情绪可以再放开一点", desc: "副歌是记忆点，敢把音量和情绪推上去，会更有感染力。" },
    { icon: "🎙️", title: "咬字可以更清楚", desc: "快歌部分有些字含糊了，咬字再清晰一点，整体更高级。" },
  ];
  tips.push(extraPool[Math.floor(Math.random() * extraPool.length)]);
  return { tags, tips };
}

// AI 分析设置页：配置 OpenAI 兼容 LLM
function renderSettings() {
  const c = loadLLMConfig();
  const ready = llmReady();
  return `
    ${topbar(100, "AI 分析设置", "go-home")}
    <div class="set-hero">
      <div class="set-ic ${ready ? "on" : ""}">${ready ? "✦" : "🤖"}</div>
      <h2>接入大模型，真分析你的音色</h2>
      <p>${ready ? "已启用 · 测嗓和选歌将由真实大模型生成文案" : "默认走本地分析；填入任意 OpenAI 兼容服务的 Key 即可启用真分析"}</p>
    </div>

    <div class="set-form glass">
      <label class="set-row">
        <span class="sl">启用 LLM 分析</span>
        <button class="switch ${c.enabled ? "on" : ""}" data-action="toggle-llm"><i></i></button>
      </label>
      <div class="set-field">
        <span class="sf-label">服务地址 Endpoint</span>
        <input class="sf-input" id="llmEndpoint" type="text" value="${c.endpoint}" placeholder="https://api.openai.com/v1/chat/completions"/>
      </div>
      <div class="set-field">
        <span class="sf-label">模型 Model</span>
        <input class="sf-input" id="llmModel" type="text" value="${c.model}" placeholder="gpt-4o-mini"/>
      </div>
      <div class="set-field">
        <span class="sf-label">API Key（仅存本地浏览器，不上传）</span>
        <input class="sf-input" id="llmKey" type="password" value="${c.apiKey}" placeholder="sk-..."/>
      </div>
      <div class="set-presets">
        <span class="sp-label">快速填充：</span>
        <button class="sp-chip" data-action="llm-preset" data-preset="openai">OpenAI</button>
        <button class="sp-chip" data-action="llm-preset" data-preset="qwen">通义千问</button>
        <button class="sp-chip" data-action="llm-preset" data-preset="kimi">Kimi</button>
        <button class="sp-chip" data-action="llm-preset" data-preset="deepseek">DeepSeek</button>
      </div>
    </div>

    <button class="btn btn-primary" data-action="save-llm"><span class="shine"></span>保存设置</button>
    <div class="spacer-sm"></div>
    <button class="btn btn-cool" data-action="test-llm">⚡ 测试连接</button>
    ${state.llmTestMsg ? `<div class="set-test ${state.llmTestOk ? "ok" : "err"}">${state.llmTestMsg}</div>` : ""}

    <div class="set-note glass">
      <b>说明</b>
      <p>本设置为「可插拔」演示：声学特征（基频/音域/稳定度/气息）始终在你的浏览器本地实时计算；启用后，仅把这些<b>数值</b>发给大模型，由它生成更有温度的「声音人格画像」和「选歌理由」。录音本身不会上传。</p>
    </div>
    <div class="spacer"></div>
  `;
}

function renderShare() {
  const song = getSong(state.selectedSongId);
  const r = state.report;
  const p = PERSONAS[r.persona];
  const best = state.takes.length ? Math.max(...state.takes.map((t) => t.score)) : (state.fullTakeScore || (state.lastScore ? state.lastScore.score : 85));
  const back = state.flow === "cover" ? "go-coverresult" : "go-practice";
  const beauty = state.shareMode === "beauty";
  const defaultCaption = `🎙️ 我用自己的声音唱了《${song.title}》！我的声线是「${p.name}」${p.emoji}，匹配度 ${coverMatch(song)}%。`;
  const caption = state.shareCaption || defaultCaption;
  return `
    ${topbar(100, "我的唱片", back)}
    <p class="kicker">你的声音，已刻成一张唱片 💿</p>

    <div class="vinyl-card" id="poster">
      <div class="vinyl-stage">
        <div class="vinyl-disc ${state.coverPlaying ? "spinning" : ""}">
          <div class="vinyl-groove"></div>
          <div class="vinyl-label"><div class="vl-emoji">${song.emoji}</div></div>
          <div class="vinyl-hole"></div>
        </div>
        <div class="vinyl-sleeve"><div class="vs-emoji">${p.emoji}</div></div>
      </div>
      <div class="vinyl-meta">
        <div class="vm-track">${song.title}<span class="vm-cover">${beauty ? "AI MASTER" : "RAW 原声"}</span></div>
        <div class="vm-artist">${p.emoji} ${p.name} · 我的演唱</div>
        <div class="vm-tags">
          <span>${p.tags[0]}</span><span>匹配 ${coverMatch(song)}</span><span>评分 ${best}</span>
        </div>
        <div class="vm-bars">${Array.from({ length: 26 }).map((_, i) => `<i style="height:${6 + (i % 6) * 4}px;animation-delay:${i * 0.04}s"></i>`).join("")}</div>
      </div>
      <div class="vinyl-foot">♪ RIGHTSONG · 用你的声音，唱给世界听</div>
    </div>

    <div class="share-mode">
      <button class="sm-tab ${beauty ? "on" : ""}" data-action="set-sharemode" data-mode="beauty">✨ 一键美化版</button>
      <button class="sm-tab ${!beauty ? "on" : ""}" data-action="set-sharemode" data-mode="raw">🎙️ 我的原声版</button>
    </div>
    <p class="sm-hint">${beauty ? "AI 已帮你修音修亮，更适合发朋友圈" : "保留你最真实的原唱，有的人就爱这一口真"}</p>

    <div class="caption-box glass">
      <div class="cap-head"><span>📝 我的分享文案</span><span class="cap-edit">点下方可编辑</span></div>
      <textarea class="cap-input" data-role="caption" rows="3" placeholder="写点此刻的心情，比如：练了三天，终于敢发出来了…">${caption}</textarea>
    </div>

    <div class="action-stack">
      <button class="btn btn-primary" data-action="${beauty ? "download-poster" : "download-cover"}"><span class="shine"></span>${beauty ? "📥 保存美化版唱片" : "🎧 保存我的原声"}</button>
      <button class="btn btn-cool" data-action="do-share">📤 ${beauty ? "一键美化并分享" : "分享我的原声"}</button>
      <button class="btn btn-ghost" data-action="go-home">🏠 回到首页，再玩一次</button>
    </div>
    <div class="spacer"></div>
  `;
}

/* ---------------- 我的过往大作（历史） ---------------- */

function renderHistory() {
  const works = loadWorks();
  const favs = loadFavs();
  const tab = state.historyTab;

  const tabs = `
    <div class="hist-tabs">
      <button class="hist-tab ${tab === "saved" ? "on" : ""}" data-action="set-histtab" data-tab="saved">💾 我的保存<span class="ht-n">${works.length}</span></button>
      <button class="hist-tab ${tab === "fav" ? "on" : ""}" data-action="set-histtab" data-tab="fav">❤️ 我的收藏<span class="ht-n">${favs.length}</span></button>
    </div>`;

  // 我的保存：自己唱的版本
  const savedBody = works.length ? works.map((w) => `
    <div class="work-card glass">
      <div class="work-disc ${state.coverPlaying && state.selectedSongId === w.songId ? "spinning" : ""}" data-action="replay-work" data-id="${w.id}">
        <div class="vinyl-groove"></div>
        <div class="wd-art">${w.emoji}</div>
        <div class="vinyl-hole"></div>
        <div class="wd-play">▶</div>
      </div>
      <div class="work-info" data-action="replay-work" data-id="${w.id}">
        <div class="wt">${w.songTitle}</div>
        <div class="wa">${w.personaName} · ${w.label}</div>
        <div class="wmeta"><span class="wscore">${w.score}分</span><span class="wdate">${w.date}</span><span class="wmode">${w.mode === "raw" ? "原声" : "美化"}</span></div>
      </div>
      <div class="work-ops">
        <button class="work-op" data-action="reshare-work" data-id="${w.id}" title="再次分享">📤</button>
        <button class="work-op del" data-action="del-work" data-id="${w.id}" title="删除">🗑️</button>
      </div>
    </div>
  `).join("") : emptyState("🎙️", "还没有保存的作品<br/>去唱一首，把你的高光留在这里");

  // 我的收藏：AI 用我的音色唱的歌
  const favBody = favs.length ? favs.map((f) => `
    <div class="work-card glass">
      <div class="work-disc ${state.coverPlaying && state.selectedSongId === f.songId ? "spinning" : ""}" data-action="replay-fav" data-id="${f.songId}">
        <div class="vinyl-groove"></div>
        <div class="wd-art">${f.emoji}</div>
        <div class="vinyl-hole"></div>
        <div class="wd-play">▶</div>
      </div>
      <div class="work-info" data-action="replay-fav" data-id="${f.songId}">
        <div class="wt">${f.songTitle} <span class="ai-badge">AI 翻唱</span></div>
        <div class="wa">${f.personaName} · 用我的音色生成</div>
        <div class="wmeta"><span class="wscore">匹配 ${f.match}%</span><span class="wdate">${f.date}</span></div>
      </div>
      <div class="work-ops">
        <button class="work-op" data-action="reshare-fav" data-id="${f.songId}" title="分享">📤</button>
        <button class="work-op del" data-action="del-fav" data-id="${f.songId}" title="取消收藏">🗑️</button>
      </div>
    </div>
  `).join("") : emptyState("💗", "还没有收藏的翻唱<br/>去「用我的声音唱给我听」，把喜欢的收进来");

  const list = tab === "saved" ? savedBody : favBody;
  const curCount = tab === "saved" ? works.length : favs.length;

  return `
    ${topbar(100, "我的唱片", "go-home")}
    <div class="history-hero">
      <h2>💿 我的唱片</h2>
      <p>${works.length + favs.length ? `这里收着你唱过、和 AI 替你唱过的每一首` : "你的每一次开口，都值得被记住"}</p>
    </div>
    ${tabs}
    ${curCount ? "" : ""}
    <div class="work-list">${list}</div>
    <div class="spacer"></div>
  `;
}

function emptyState(ic, text) {
  return `
    <div class="history-empty glass">
      <div class="he-ic">${ic}</div>
      <p>${text}</p>
      <button class="btn btn-primary" data-action="go-home"><span class="shine"></span>去首页 →</button>
    </div>`;
}

/* localStorage 作品存取 */
function loadWorks() {
  try { return JSON.parse(localStorage.getItem("songfit_works") || "[]"); }
  catch (e) { return []; }
}
function saveWork(work) {
  const works = loadWorks();
  works.unshift(work);
  try { localStorage.setItem("songfit_works", JSON.stringify(works.slice(0, 30))); } catch (e) {}
}
function deleteWork(id) {
  const works = loadWorks().filter((w) => w.id !== id);
  try { localStorage.setItem("songfit_works", JSON.stringify(works)); } catch (e) {}
}

/* localStorage 收藏（AI 用我的音色唱的歌）存取 */
function loadFavs() {
  try { return JSON.parse(localStorage.getItem("songfit_favs") || "[]"); }
  catch (e) { return []; }
}
function saveFav(fav) {
  const favs = loadFavs().filter((f) => f.songId !== fav.songId);
  favs.unshift(fav);
  try { localStorage.setItem("songfit_favs", JSON.stringify(favs.slice(0, 30))); } catch (e) {}
}
function deleteFav(songId) {
  const favs = loadFavs().filter((f) => f.songId !== songId);
  try { localStorage.setItem("songfit_favs", JSON.stringify(favs)); } catch (e) {}
}
function isFav(songId) { return loadFavs().some((f) => f.songId === songId); }

/* ---------------- 翻唱流程：选歌 + AI 翻唱结果 ---------------- */

function renderCoverpick() {
  const ranked = SONG_LIBRARY
    .map((s) => ({ ...s, match: coverMatch(s) }))
    .sort((a, b) => b.match - a.match);
  const cards = ranked.map((s) => {
    const lv = s.match >= 90 ? "高度契合" : s.match >= 82 ? "很合适" : "可挑战";
    return `
    <div class="cover-song glass" data-action="pick-cover" data-id="${s.id}">
      <div class="song-art">${s.emoji}</div>
      <div class="song-info">
        <div class="t">${s.title}</div>
        <div class="a">${s.artist} · ${s.mood}</div>
      </div>
      <div class="fit-badge fit-${matchLevel(s.match)}">
        <span class="fit-ic">🎤</span>
        <span class="fit-num">${s.match}<small>%</small></span>
        <span class="fit-lv">${lv}</span>
      </div>
    </div>`;
  }).join("");
  return `
    ${topbar(100, "选一首来翻唱", "go-report")}
    <h2 class="section-title">用你的声音，唱哪首？🎙️</h2>
    <p class="section-sub">每首歌右侧是「你的嗓音 × 这首歌」的综合匹配度<br/>选一首，我用你的声音把它唱出来</p>
    <div class="fit-hint">
      <span class="d high"></span>90+ 高度契合
      <span class="d mid"></span>82+ 很合适
      <span class="d low"></span>可挑战
    </div>
    <div class="spacer-sm"></div>
    ${cards}
    <div class="spacer"></div>
  `;
}

function renderCoverresult() {
  const song = getSong(state.selectedSongId);
  const p = PERSONAS[state.report.persona];
  const match = coverMatch(song);
  const fav = isFav(song.id);
  return `
    ${topbar(100, "你的翻唱", "go-coverpick")}
    <p class="kicker">AI 已用你的声音唱好了 ✨</p>

    <div class="cover-stage">
      <div class="cover-disc ${state.coverPlaying ? "spinning" : ""}" data-action="toggle-cover-play">
        <div class="vinyl-groove"></div>
        <div class="cover-art">${song.emoji}</div>
        <div class="vinyl-hole"></div>
        <div class="cover-play-ic">${state.coverPlaying ? "⏸" : "▶"}</div>
      </div>
    </div>

    <div class="cover-titlebox">
      <h2>${song.title} <span class="cover-tag">我的翻唱</span></h2>
      <div class="cover-artist">${p.emoji} ${p.name} · 由你的声音生成</div>
    </div>

    <div class="cover-matchbar glass">
      <div class="cmb-left">
        <div class="cmb-num grad-text">${match}<small>%</small></div>
        <div class="cmb-lab">嗓音综合匹配度</div>
      </div>
      <div class="cmb-bars">${Array.from({ length: 30 }).map((_, i) => `<i class="${state.coverPlaying ? "live" : ""}" style="height:${6 + (i % 7) * 4}px;animation-delay:${i * 0.05}s"></i>`).join("")}</div>
    </div>

    <p class="cover-note">${coverNote(song, match)}</p>

    <div class="spacer-sm"></div>
    <button class="btn btn-primary" data-action="toggle-cover-play"><span class="shine"></span>${state.coverPlaying ? "⏸ 暂停试听" : "▶ 播放我的翻唱"}</button>
    <div class="cover-actions">
      <button class="cover-act" data-action="go-practice-from-cover"><span class="ci">🎤</span>我要去唱</button>
      <button class="cover-act ${fav ? "on" : ""}" data-action="fav-cover"><span class="ci">${fav ? "❤️" : "🤍"}</span>${fav ? "已收藏" : "收藏"}</button>
      <button class="cover-act" data-action="download-cover"><span class="ci">⬇️</span>下载</button>
      <button class="cover-act" data-action="go-share"><span class="ci">📤</span>分享</button>
    </div>
    <div class="spacer-sm"></div>
    <button class="btn btn-ghost" data-action="go-coverpick">← 换一首翻唱</button>
    <div class="spacer"></div>
  `;
}

function coverNote(song, match) {
  if (match >= 90) return `这首《${song.title}》几乎是为你的声音写的——音域、气息、情绪全都贴合，听起来就像你的原唱。`;
  if (match >= 82) return `用你的声音唱《${song.title}》很自然，副歌部分会特别动听，值得收藏一版。`;
  return `《${song.title}》对你来说略有挑战，但你的音色会唱出一种独特的味道，试试看～`;
}

function matchLevel(m) { return m >= 90 ? "high" : m >= 82 ? "mid" : "low"; }

/* ---------------- 工具 ---------------- */

function freqToNote(f) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  if (!f || f < 40) f = 130;
  const n = Math.round(12 * Math.log2(f / 440) + 69);
  const name = names[(n % 12 + 12) % 12];
  const oct = Math.floor(n / 12) - 1;
  return `${name}${oct}`;
}
function moodEmoji(mood) {
  const m = { 青春: "🌤️", 深情: "💧", 温柔: "🍀", 释怀: "🍃", 燃: "🔥", 暗黑: "🌃", 苦情: "🎭", 治愈: "🌿", 释然: "🕊️", 想念: "🌠", 民谣: "🎸", 励志: "⭐" };
  return m[mood] || "🎵";
}
function matchColor(m) {
  if (m >= 90) return "#38e8d0";
  if (m >= 82) return "#a070ff";
  return "#ff5fa2";
}

function showToast(msg) {
  state.toast = msg;
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); state.toast = null; }, 2200);
}

// 唱片封面海报导出（canvas 9:16，黑胶质感）
function downloadPoster() {
  const song = getSong(state.selectedSongId);
  const r = state.report;
  const p = PERSONAS[r.persona];
  const match = coverMatch(song);
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1920;
  const ctx = c.getContext("2d");
  // 背景
  const g = ctx.createLinearGradient(0, 0, 1080, 1920);
  g.addColorStop(0, "#1a0f33"); g.addColorStop(0.5, "#2a1147"); g.addColorStop(1, "#3d1240");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
  // 顶部标题
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("S O N G F I T   ·   我 的 翻 唱", 540, 180);
  // 黑胶唱片
  const cx = 540, cy = 760, R = 360;
  for (let i = R; i > 150; i -= 6) {
    ctx.beginPath(); ctx.arc(cx, cy, i, 0, Math.PI * 2);
    ctx.strokeStyle = i % 12 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.55)";
    ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fill();
  for (let i = R; i > 150; i -= 6) {
    ctx.beginPath(); ctx.arc(cx, cy, i, 0, Math.PI * 2);
    ctx.strokeStyle = i % 12 === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2; ctx.stroke();
  }
  // 中心标签
  const lg = ctx.createLinearGradient(cx - 150, cy - 150, cx + 150, cy + 150);
  lg.addColorStop(0, "#a070ff"); lg.addColorStop(1, "#ff5fa2");
  ctx.beginPath(); ctx.arc(cx, cy, 150, 0, Math.PI * 2); ctx.fillStyle = lg; ctx.fill();
  ctx.font = "100px sans-serif"; ctx.fillText(song.emoji, cx, cy + 36);
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fillStyle = "#1a0f33"; ctx.fill();
  // 歌名信息
  ctx.fillStyle = "#fff"; ctx.font = "bold 76px sans-serif";
  ctx.fillText(song.title, 540, 1320);
  ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "38px sans-serif";
  ctx.fillText(`${p.emoji} ${p.name} · 我的翻唱`, 540, 1400);
  // 匹配度
  ctx.fillStyle = "#ffd66e"; ctx.font = "bold 64px sans-serif";
  ctx.fillText(`嗓音匹配度 ${match}%`, 540, 1530);
  // 标签
  ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "34px sans-serif";
  ctx.fillText(p.tags.join("  ·  "), 540, 1610);
  // 底部
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "32px sans-serif";
  ctx.fillText("♪ 用你的声音，唱给世界听 · RightSong", 540, 1820);
  ctx.textAlign = "left";
  const url = c.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = `rightsong-vinyl-${song.title}.png`; a.click();
  showToast("唱片封面已保存 ✨");
}

// 翻唱音频离线渲染并导出 WAV
function downloadCover() {
  const song = getSong(state.selectedSongId);
  showToast("正在生成你的翻唱音频… 🎧");
  const sr = 44100;
  const base = coverBaseHz();
  const mel = melodyFor(song);
  const beat = 60 / (song.bpm || 75) * 0.9;
  let total = 0.2;
  mel.forEach((_, i) => { total += beat * (i % 4 === 3 ? 1.4 : 1); });
  total += 0.4;
  const off = new OfflineAudioContext(1, Math.ceil(sr * total), sr);
  const comp = off.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4;
  const master = off.createGain(); master.gain.value = 0.85;
  comp.connect(master); master.connect(off.destination);
  let t = 0.1;
  mel.forEach((semi, i) => {
    const freq = base * Math.pow(2, semi / 12);
    const dur = beat * (i % 4 === 3 ? 1.4 : 1);
    synthNote(off, freq, t, dur, 1, comp, null);
    t += dur;
  });
  off.startRendering().then((buffer) => {
    const wav = bufferToWav(buffer);
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rightsong-cover-${song.title}.wav`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast("翻唱音频已下载 ⬇️");
  }).catch(() => showToast("生成失败，请重试"));
}

// AudioBuffer -> WAV (16bit PCM)
function bufferToWav(buffer) {
  const numCh = 1;
  const sr = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const len = data.length;
  const ab = new ArrayBuffer(44 + len * 2);
  const view = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); view.setUint32(4, 36 + len * 2, true); ws(8, "WAVE");
  ws(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true); ws(36, "data"); view.setUint32(40, len * 2, true);
  let o = 44;
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return ab;
}

/* ---------------- 分段教学引擎 ---------------- */

let lineNodes = null;
let lineTimer = null;
let segLineTimers = [];
let segAudio = null;

// 进入练唱页前重置进度状态
function resetPractice() {
  stopLine();
  if (typeof stopPerform === "function") stopPerform();
  state.segIndex = 0;
  state.segResults = {};
  state.lastSeg = null;
  state.fullTakeScore = null;
  state.recordingSeg = null;
  state.recordingFull = false;
  state.recording = false;
  state.performing = false;
  state.performLineIdx = -1;
}

// 停止示范播放 / 录音监听
function stopLine() {
  if (lineTimer) { clearTimeout(lineTimer); lineTimer = null; }
  segLineTimers.forEach((id) => clearTimeout(id));
  segLineTimers = [];
  if (lineNodes) { lineNodes.forEach((n) => { try { n.stop(); } catch (e) {} }); lineNodes = null; }
  if (segAudio) { try { segAudio.pause(); } catch (e) {} segAudio = null; }
  if (recordRAF) { cancelAnimationFrame(recordRAF); recordRAF = null; }
  state.playingSeg = null;
  state.playingLineIdx = -1;
}

// 播放整段的「原唱示范」：优先用 iTunes 官方原唱片段（按段落切片 + 估算卡拉OK高亮），无原唱时退化为合成旋律
function playSeg(segIdx) {
  stopExample(); stopCover(); stopPreview();
  const song = getSong(state.selectedSongId);
  const segs = getSegments(song);
  const seg = segs[segIdx];
  if (!seg) return;

  const media = songMedia(song.id);
  if (media && media.preview) { playSegReal(seg, segIdx, segs.length, media); return; }
  playSegSynth(song, seg);
}

// 用真实原唱片段播放某一段：从 30s 预览里切出属于该段的窗口，行高亮按窗口均分估算
function playSegReal(seg, segIdx, segCount, media) {
  const a = new Audio(media.preview);
  a.crossOrigin = "anonymous";
  segAudio = a;
  state.playingLineIdx = 0;
  segLineTimers = [];

  const start = () => {
    const dur = (a.duration && isFinite(a.duration)) ? a.duration : 28;
    const win = Math.max(5, Math.min(9, (dur - 1) / segCount)); // 每段窗口 5~9s
    const span = Math.max(0, dur - win - 0.5);
    const offset = segCount > 1 ? (segIdx / (segCount - 1)) * span : 0;
    a.currentTime = offset;
    // 行高亮：把窗口时间均分给该段每一行
    const per = win / Math.max(1, seg.lines.length);
    seg.lines.forEach((line, idx) => {
      segLineTimers.push(setTimeout(() => {
        state.playingLineIdx = idx;
        if (state.screen === "practice") render();
      }, idx * per * 1000));
    });
    // 窗口结束自动停
    lineTimer = setTimeout(() => {
      state.playingSeg = null; state.playingLineIdx = -1;
      if (segAudio) { try { segAudio.pause(); } catch (e) {} segAudio = null; }
      if (state.screen === "practice") render();
    }, win * 1000 + 150);
    a.play().catch(() => {
      // 自动播放被拦截 → 退化为合成
      stopLine();
      playSegSynth(getSong(state.selectedSongId), seg);
      state.playingSeg = segIdx;
      if (state.screen === "practice") render();
    });
  };

  a.addEventListener("error", () => {
    // 原唱加载失败 → 退化为合成，体验不中断
    if (segAudio !== a) return;
    segAudio = null;
    playSegSynth(getSong(state.selectedSongId), seg);
  });
  if (a.readyState >= 1 && a.duration) start();
  else a.addEventListener("loadedmetadata", start, { once: true });
}

// 合成示范（无官方原唱时的兜底）：逐行合成旋律，并同步卡拉OK高亮
function playSegSynth(song, seg) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4;
  const master = ctx.createGain(); master.gain.value = 0.9;
  comp.connect(master); master.connect(ctx.destination);

  const contour = [0, 2, 0, -1, 1, 2, 0, -2, 0];
  const beat = 60 / (song.bpm || 75) * 0.78;
  const now = ctx.currentTime + 0.1;
  const nodes = [];
  let t = now;
  segLineTimers = [];
  state.playingLineIdx = 0;

  seg.lines.forEach((line, idx) => {
    const lineStartMs = (t - now) * 1000;
    // 到这一行时高亮它
    segLineTimers.push(setTimeout(() => {
      state.playingLineIdx = idx;
      if (state.screen === "practice") render();
    }, lineStartMs));
    const base = coverBaseHz() * Math.pow(2, line.rel / 12);
    const chars = Math.max(3, Math.min(9, (line.t || "").replace(/[，。、！？\s]/g, "").length));
    for (let i = 0; i < chars; i++) {
      const semi = contour[i % contour.length];
      const freq = base * Math.pow(2, semi / 12);
      const dur = beat * (i === chars - 1 ? 1.5 : 1);
      synthNote(ctx, freq, t, dur, 1, comp, nodes);
      t += dur;
    }
    t += beat * 0.4; // 行间停顿
  });
  lineNodes = nodes;
  const total = (t - now) * 1000;
  lineTimer = setTimeout(() => {
    state.playingSeg = null; state.playingLineIdx = -1; lineNodes = null;
    if (state.screen === "practice") render();
  }, total + 200);
}

// 开始录这一段
async function startSegRecord(segIdx) {
  stopLine();
  state.recordingSeg = segIdx;
  liveFeatureBuf = [];
  recordStartTs = Date.now();
  try {
    if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    const src = ctx.createMediaStreamSource(micStream);
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
    render();
    monitorLine(true);
  } catch (e) {
    analyser = null;
    render();
    monitorLine(false);
  }
}

// 录音电平监听（真麦 / 模拟通用）
function monitorLine(real) {
  if (state.recordingSeg === null && !state.recordingFull) return;
  if (real && analyser) {
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0, zc = 0;
    for (let i = 0; i < buf.length; i++) {
      sum += buf[i] * buf[i];
      if (i > 0 && (buf[i] >= 0) !== (buf[i - 1] >= 0)) zc++;
    }
    const rms = Math.sqrt(sum / buf.length);
    const freq = (zc / 2) * (getCtx().sampleRate / buf.length);
    liveFeatureBuf.push({ rms, freq });
    paintWave(Math.min(1, rms * 6));
  } else {
    const t = (Date.now() - recordStartTs) / 1000;
    const rms = 0.32 + 0.22 * Math.abs(Math.sin(t * 4));
    const freq = 190 + 70 * Math.sin(t * 1.4);
    liveFeatureBuf.push({ rms, freq });
    paintWave(rms);
  }
  recordRAF = requestAnimationFrame(() => monitorLine(real));
}

// 结束录这一段 → 生成 音准/节奏/气息 三维反馈
function finishSeg(segIdx) {
  if (recordRAF) { cancelAnimationFrame(recordRAF); recordRAF = null; }
  state.recordingSeg = null;
  const song = getSong(state.selectedSongId);
  const segs = getSegments(song);
  const seg = segs[segIdx];
  const targetRel = avg(seg.lines.map((l) => l.rel));
  const target = coverBaseHz() * Math.pow(2, targetRel / 12);
  const freqs = liveFeatureBuf.map((f) => f.freq).filter((f) => f > 60 && f < 900);
  const rmsArr = liveFeatureBuf.map((f) => f.rms);
  const measured = freqs.length > 2 ? 12 * Math.log2(avg(freqs) / target) : 0;
  const bias = ((segIdx * 7 + 3) % 5) - 2;
  const diff = clamp(measured * 0.5 + bias * 0.7, -4.5, 4.5);

  // 三维分数
  const pitch = clamp(Math.round(96 - Math.abs(diff) * 6 + (Math.random() * 4 - 2)), 70, 99);
  // 节奏：用电平的稳定度近似
  const rmsStd = rmsArr.length ? Math.sqrt(avg(rmsArr.map((x) => (x - avg(rmsArr)) ** 2))) : 0.15;
  const rhythm = clamp(Math.round(94 - rmsStd * 60 + (Math.random() * 6 - 2)), 70, 99);
  // 气息：用平均电平强度近似
  const breath = clamp(Math.round(78 + avg(rmsArr) * 40 + (Math.random() * 6 - 2)), 70, 99);
  const score = Math.round((pitch + rhythm + breath) / 3);

  // 主建议：取最弱的一项给针对性提示
  let tip;
  const weakest = Math.min(pitch, rhythm, breath);
  if (weakest === pitch) {
    tip = diff > 0.8 ? "整体偏高了，下次起音压低一点 ↓" : diff < -0.8 ? "整体偏低了，可以再亮一点 ↑" : "音准不错，继续保持";
  } else if (weakest === rhythm) {
    tip = "节奏有点飘，跟着示范的拍子再稳一遍";
  } else {
    tip = "气息再沉一点，长句中间记得偷气";
  }

  state.segResults[segIdx] = { score, pitch, rhythm, breath, tip };
  state.lastSeg = { seg: segIdx, score, tip };
  showToast(`${seg.label} ${score} 分 · ${tip}`);
  render();
}

// 完整演唱
function startFullRecord() {
  stopLine();
  state.recordingFull = true;
  state.recordingSeg = null;
  liveFeatureBuf = [];
  recordStartTs = Date.now();
  (async () => {
    try {
      if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = getCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const src = ctx.createMediaStreamSource(micStream);
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
      render();
      monitorLine(true);
    } catch (e) {
      analyser = null;
      render();
      monitorLine(false);
    }
  })();
}

function finishFull() {
  if (recordRAF) { cancelAnimationFrame(recordRAF); recordRAF = null; }
  state.recordingFull = false;
  const results = Object.values(state.segResults);
  const baseAvg = results.length ? avg(results.map((r) => r.score)) : 84;
  // 完整唱一遍有连贯性加成
  state.fullTakeScore = clamp(Math.round(baseAvg + 2 + Math.random() * 3), 75, 99);
  showToast(`完整演唱 ${state.fullTakeScore} 分，太棒了 🎉`);
  render();
}

/* ---------------- KTV 完整演唱引擎 ---------------- */
let performTimers = [];
let performNodes = null;
let performEndTimer = null;
let performAudio = null;

function stopPerform() {
  performTimers.forEach((id) => clearTimeout(id));
  performTimers = [];
  if (performEndTimer) { clearTimeout(performEndTimer); performEndTimer = null; }
  if (performNodes) { performNodes.forEach((n) => { try { n.stop(); } catch (e) {} }); performNodes = null; }
  if (performAudio) { try { performAudio.pause(); } catch (e) {} performAudio = null; }
  if (recordRAF) { cancelAnimationFrame(recordRAF); recordRAF = null; }
}

// 开始 KTV 演唱：伴奏 + 逐行卡拉OK高亮 + 真实录音监听
function startPerform() {
  stopLine(); stopExample(); stopCover(); stopPerform();
  const song = getSong(state.selectedSongId);
  const lines = getAllLines(song);
  state.performing = true;
  state.performLineIdx = 0;
  liveFeatureBuf = [];
  recordStartTs = Date.now();
  // 开录（真麦优先，失败退化模拟）
  (async () => {
    try {
      if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = getCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const src = ctx.createMediaStreamSource(micStream);
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
      state.recordingFull = true;
      monitorLine(true);
    } catch (e) {
      analyser = null;
      state.recordingFull = true;
      monitorLine(false);
    }
  })();

  // 伴奏：优先真实原唱片段，否则退化为合成伴奏
  const media = songMedia(song.id);
  if (media && media.preview) { performBackingReal(lines, media); return; }
  performBackingSynth(song, lines);
}

// KTV 真实原唱伴奏：整段 30s 预览垫底，逐行高亮按预览总时长均分估算
function performBackingReal(lines, media) {
  const a = new Audio(media.preview);
  a.crossOrigin = "anonymous";
  a.volume = 0.85;
  performAudio = a;
  performTimers = [];

  const start = () => {
    const dur = (a.duration && isFinite(a.duration)) ? a.duration : 28;
    const usable = Math.max(6, dur - 0.4);
    const per = usable / Math.max(1, lines.length);
    lines.forEach((line, idx) => {
      performTimers.push(setTimeout(() => {
        state.performLineIdx = idx;
        if (state.screen === "perform") render();
      }, idx * per * 1000));
    });
    performEndTimer = setTimeout(() => {
      if (state.screen === "perform" && state.performing) finishPerform();
    }, usable * 1000 + 200);
    a.play().catch(() => {
      stopPerform();
      performBackingSynth(getSong(state.selectedSongId), lines);
    });
  };

  a.addEventListener("error", () => {
    if (performAudio !== a) return;
    performAudio = null;
    performBackingSynth(getSong(state.selectedSongId), lines);
  });
  if (a.readyState >= 1 && a.duration) start();
  else a.addEventListener("loadedmetadata", start, { once: true });
}

// 合成伴奏兜底
function performBackingSynth(song, lines) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4;
  const master = ctx.createGain(); master.gain.value = 0.42; // 伴奏垫底，让用户成主角
  comp.connect(master); master.connect(ctx.destination);

  const contour = [0, 2, 0, -1, 1, 2, 0, -2, 0];
  const beat = 60 / (song.bpm || 75) * 0.7;
  const now = ctx.currentTime + 0.15;
  const nodes = [];
  let t = now;
  performTimers = [];

  lines.forEach((line, idx) => {
    const lineStartMs = (t - now) * 1000;
    performTimers.push(setTimeout(() => {
      state.performLineIdx = idx;
      if (state.screen === "perform") render();
    }, lineStartMs));
    const base = coverBaseHz() * Math.pow(2, line.rel / 12);
    const chars = Math.max(3, Math.min(10, (line.t || "").replace(/[，。、！？\s]/g, "").length));
    for (let i = 0; i < chars; i++) {
      const semi = contour[i % contour.length];
      const freq = base * Math.pow(2, semi / 12);
      const dur = beat * (i === chars - 1 ? 1.4 : 1);
      synthNote(ctx, freq, t, dur, 0.85, comp, nodes);
      t += dur;
    }
    t += beat * 0.35;
  });
  performNodes = nodes;
  const totalMs = (t - now) * 1000;
  // 伴奏放完自动收尾进入成绩页
  performEndTimer = setTimeout(() => {
    if (state.screen === "perform" && state.performing) finishPerform();
  }, totalMs + 300);
}

// 结束 KTV 演唱 → 三维评分 + 生成标签/建议 → 成绩页
function finishPerform() {
  stopPerform();
  state.performing = false;
  state.recordingFull = false;
  state.performLineIdx = -1;
  state.currentWorkId = null; // 新的一次完整演唱 → 在唱片里独立成一条
  const song = getSong(state.selectedSongId);

  // 三维评分：优先用真实录音特征，否则用已练段落均值
  const rmsArr = liveFeatureBuf.map((f) => f.rms).filter((x) => x > 0);
  const freqs = liveFeatureBuf.map((f) => f.freq).filter((f) => f > 60 && f < 900);
  const segRes = Object.values(state.segResults);
  const segAvg = segRes.length ? avg(segRes.map((r) => r.score)) : 85;

  let pitch, rhythm, breath;
  if (freqs.length > 4) {
    const rmsStd = rmsArr.length ? std(rmsArr) : 0.15;
    pitch = clamp(Math.round(86 + (Math.random() * 10 - 4)), 72, 99);
    rhythm = clamp(Math.round(92 - rmsStd * 55 + (Math.random() * 6 - 2)), 72, 99);
    breath = clamp(Math.round(80 + avg(rmsArr) * 38 + (Math.random() * 6 - 2)), 72, 99);
  } else {
    pitch = clamp(Math.round(segAvg + (Math.random() * 8 - 3)), 72, 99);
    rhythm = clamp(Math.round(segAvg + (Math.random() * 8 - 4)), 72, 99);
    breath = clamp(Math.round(segAvg + (Math.random() * 8 - 4)), 72, 99);
  }
  const dims = { pitch, rhythm, breath };
  // 完整唱一遍连贯性加成
  state.fullTakeScore = clamp(Math.round((pitch + rhythm + breath) / 3 + 2), 75, 99);

  const fb = genResultFeedback(song, dims);
  state.resultTags = fb.tags;
  state.resultTips = fb.tips;
  state.myVersionPlaying = false;
  state.screen = "result";
  render();
}

// 成绩页：用用户音色把整首「唱」出来（试听我的完整版）
function playMyVersion() {
  const song = getSong(state.selectedSongId);
  stopExample(); stopCover(); stopPerform();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4;
  const master = ctx.createGain(); master.gain.value = 0.9;
  comp.connect(master); master.connect(ctx.destination);

  const lines = getAllLines(song);
  const contour = [0, 2, 0, -1, 1, 2, 0, -2, 0];
  const beat = 60 / (song.bpm || 75) * 0.7;
  const now = ctx.currentTime + 0.1;
  const nodes = [];
  let t = now;
  lines.forEach((line) => {
    const base = coverBaseHz() * Math.pow(2, line.rel / 12);
    const chars = Math.max(3, Math.min(10, (line.t || "").replace(/[，。、！？\s]/g, "").length));
    for (let i = 0; i < chars; i++) {
      const freq = base * Math.pow(2, contour[i % contour.length] / 12);
      const dur = beat * (i === chars - 1 ? 1.4 : 1);
      synthNote(ctx, freq, t, dur, 1, comp, nodes);
      t += dur;
    }
    t += beat * 0.35;
  });
  performNodes = nodes;
  const totalMs = (t - now) * 1000;
  performEndTimer = setTimeout(() => {
    state.myVersionPlaying = false;
    performNodes = null;
    if (state.screen === "result") render();
  }, totalMs + 200);
}

// 把一个版本存进「我的唱片」
function persistWork(song, score, label, mode) {
  const p = PERSONAS[state.report ? state.report.persona : "warm"];
  const d = new Date();
  const date = `${d.getMonth() + 1}月${d.getDate()}日`;
  // 同一次演唱：保存与分享复用同一条记录，避免「我的保存」里出现重复唱片
  if (state.currentWorkId) {
    const works = loadWorks();
    const w = works.find((x) => x.id === state.currentWorkId);
    if (w) {
      w.score = score || w.score;
      w.label = label || w.label;
      w.mode = mode || w.mode;
      w.date = date;
      try { localStorage.setItem("songfit_works", JSON.stringify(works)); } catch (e) {}
      return;
    }
    // 记录已被用户删除 → 落到新建分支
  }
  const id = "w" + Date.now() + Math.floor(Math.random() * 1000);
  state.currentWorkId = id;
  persistWorkSave({
    id,
    emoji: song.emoji,
    songTitle: song.title,
    songId: song.id,
    personaName: p ? p.name : "我的声音",
    label: label || "演唱版",
    score: score || 85,
    date,
    mode: mode || "beauty",
  });
}
function persistWorkSave(work) { saveWork(work); }

/* ---------------- 事件 ---------------- */

function bindEvents() {
  app().querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const action = el.getAttribute("data-action");
      handleAction(action, el, e);
    });
  });
}

function handleAction(action, el) {
  switch (action) {
    case "go-home": stopExample(); stopCover(); stopPerform(); stopPreview(); state.screen = "home"; state.taskIndex = 0; state.recordings = {}; state.myVersionPlaying = false; state.performing = false; render(); break;
    case "start-select": stopExample(); state.flow = "select"; state.screen = "test"; state.taskIndex = 0; state.recordings = {}; state.processing = false; render(); break;
    case "start-cover": stopExample(); state.flow = "cover"; state.screen = "test"; state.taskIndex = 0; state.recordings = {}; state.processing = false; render(); break;
    case "go-test": stopExample(); state.screen = "test"; state.taskIndex = 0; state.recordings = {}; state.processing = false; render(); break;
    case "toggle-record": if (state.recording) stopRecording(); else startRecording(); break;
    case "play-example": {
      stopExample();
      document.querySelectorAll(".example-chip").forEach((c) => c.classList.remove("playing"));
      el.classList.add("playing");
      playExample(el.getAttribute("data-task"));
      setTimeout(() => el.classList.remove("playing"), 4200);
      break;
    }
    case "go-report": stopExample(); state.screen = "report"; render(); break;
    case "go-playlist": stopExample(); stopPreview(); state.screen = "playlist"; render(); break;
    case "set-scene": state.scene = el.getAttribute("data-scene"); render(); break;
    case "expand-scene": state.expandedScenes[state.scene] = true; render(); break;
    case "toast-member": showToast("会员功能仅为 Demo 演示 👑"); break;
    case "open-song": {
      stopPreview();
      const sid = el.getAttribute("data-id");
      state.selectedSongId = sid;
      state.screen = "song";
      resetPractice();
      render();
      // 已配置 LLM 且未缓存过 → 异步生成真实选歌理由
      if (llmReady() && state.report && state.llmReasons && !state.llmReasons[sid]) {
        state.llmReasons[sid + "_loading"] = true;
        render();
        llmSongReason(getSong(sid), state.report)
          .then((txt) => { delete state.llmReasons[sid + "_loading"]; state.llmReasons[sid] = txt; if (state.screen === "song" && state.selectedSongId === sid) render(); })
          .catch(() => { delete state.llmReasons[sid + "_loading"]; });
      }
      break;
    }
    case "toggle-preview": {
      const id = el.getAttribute("data-id");
      if (state.previewPlaying === id) { stopPreview(); render(); }
      else { playPreview(id); }
      break;
    }
    case "go-song": stopLine(); state.screen = "song"; render(); break;
    case "go-practice": stopPreview(); state.screen = "practice"; resetPractice(); render(); break;
    case "back-practice": stopPerform(); state.performing = false; state.performLineIdx = -1; state.screen = "practice"; render(); break;
    case "set-seg": stopLine(); state.segIndex = parseInt(el.getAttribute("data-i"), 10); render(); break;
    case "next-seg": {
      stopLine();
      const segs = getSegments(getSong(state.selectedSongId));
      if (state.segIndex < segs.length - 1) state.segIndex++;
      render();
      break;
    }
    case "play-seg": {
      if (state.playingSeg === state.segIndex) { stopLine(); render(); }
      else { state.playingSeg = state.segIndex; state.playingLineIdx = 0; render(); playSeg(state.segIndex); }
      break;
    }
    case "sing-seg": {
      if (state.recordingSeg === state.segIndex) { finishSeg(state.segIndex); }
      else { startSegRecord(state.segIndex); }
      break;
    }
    case "sing-full": {
      if (state.recordingFull) { finishFull(); }
      else { startFullRecord(); }
      break;
    }
    case "go-perform": {
      stopLine();
      state.screen = "perform";
      state.performing = false;
      state.performLineIdx = -1;
      render();
      break;
    }
    case "start-perform": startPerform(); render(); break;
    case "finish-perform": finishPerform(); break;
    case "play-my-version": {
      if (state.myVersionPlaying) { stopPerform(); state.myVersionPlaying = false; render(); }
      else { state.myVersionPlaying = true; render(); playMyVersion(); }
      break;
    }
    case "save-take": {
      const song = getSong(state.selectedSongId);
      const score = state.fullTakeScore || (state.lastSeg ? state.lastSeg.score : 85);
      const label = state.fullTakeScore ? "完整版" : "片段版";
      state.takes.push({ songId: song.id, songTitle: song.title, label, score });
      persistWork(song, score, label, "beauty");
      showToast("已保存到「我的唱片」💾");
      render();
      break;
    }
    case "go-history": stopExample(); stopCover(); stopLine(); state.screen = "history"; render(); break;
    case "go-settings": stopExample(); stopCover(); stopPreview(); state.llmTestMsg = null; state.screen = "settings"; render(); break;
    case "toggle-llm": {
      const cfg = loadLLMConfig();
      // 切换前先保存表单里已填的内容，避免丢失
      const ep = document.getElementById("llmEndpoint");
      const md = document.getElementById("llmModel");
      const ky = document.getElementById("llmKey");
      if (ep) cfg.endpoint = ep.value.trim();
      if (md) cfg.model = md.value.trim();
      if (ky) cfg.apiKey = ky.value.trim();
      cfg.enabled = !cfg.enabled;
      saveLLMConfig(cfg);
      render();
      break;
    }
    case "llm-preset": {
      const cfg = loadLLMConfig();
      const presets = {
        openai: { endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
        qwen: { endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-plus" },
        kimi: { endpoint: "https://api.moonshot.cn/v1/chat/completions", model: "moonshot-v1-8k" },
        deepseek: { endpoint: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
      };
      const p = presets[el.getAttribute("data-preset")];
      if (p) {
        const ky = document.getElementById("llmKey");
        if (ky) cfg.apiKey = ky.value.trim();
        cfg.endpoint = p.endpoint; cfg.model = p.model;
        saveLLMConfig(cfg); render();
        showToast("已填入服务地址，记得填 Key 🔑");
      }
      break;
    }
    case "save-llm": {
      const cfg = loadLLMConfig();
      cfg.endpoint = (document.getElementById("llmEndpoint") || {}).value || cfg.endpoint;
      cfg.model = (document.getElementById("llmModel") || {}).value || cfg.model;
      cfg.apiKey = (document.getElementById("llmKey") || {}).value || "";
      cfg.endpoint = cfg.endpoint.trim(); cfg.model = cfg.model.trim(); cfg.apiKey = cfg.apiKey.trim();
      if (cfg.apiKey && !cfg.enabled) cfg.enabled = true;
      saveLLMConfig(cfg);
      showToast(llmReady() ? "已保存，AI 分析已启用 ✦" : "已保存（未填 Key，仍走本地分析）");
      render();
      break;
    }
    case "test-llm": {
      const cfg = loadLLMConfig();
      cfg.endpoint = ((document.getElementById("llmEndpoint") || {}).value || cfg.endpoint).trim();
      cfg.model = ((document.getElementById("llmModel") || {}).value || cfg.model).trim();
      cfg.apiKey = ((document.getElementById("llmKey") || {}).value || "").trim();
      saveLLMConfig(cfg);
      state.llmTestMsg = "正在测试连接…"; state.llmTestOk = true; render();
      llmChat([{ role: "user", content: "回复两个字：在线" }], 10)
        .then((txt) => { state.llmTestMsg = "✅ 连接成功，模型已响应：" + txt.slice(0, 20); state.llmTestOk = true; render(); })
        .catch((e) => { state.llmTestMsg = "❌ 连接失败：" + (e && e.message ? e.message : "请检查地址/Key/模型"); state.llmTestOk = false; render(); });
      break;
    }
    case "replay-work": {
      const w = loadWorks().find((x) => x.id === el.getAttribute("data-id"));
      if (w) {
        state.selectedSongId = w.songId;
        if (state.coverPlaying) { stopCover(); state.coverPlaying = false; render(); }
        else { state.coverPlaying = true; render(); playCover(getSong(w.songId)); }
      }
      break;
    }
    case "reshare-work": {
      const w = loadWorks().find((x) => x.id === el.getAttribute("data-id"));
      if (w) { state.selectedSongId = w.songId; state.shareMode = w.mode || "beauty"; state.screen = "share"; render(); }
      break;
    }
    case "set-histtab": stopCover(); state.coverPlaying = false; state.historyTab = el.getAttribute("data-tab"); render(); break;
    case "del-work": {
      stopCover(); state.coverPlaying = false;
      deleteWork(el.getAttribute("data-id"));
      showToast("已从「我的保存」删除 🗑️");
      render();
      break;
    }
    case "replay-fav": {
      const id = el.getAttribute("data-id");
      state.selectedSongId = id;
      if (state.coverPlaying) { stopCover(); state.coverPlaying = false; render(); }
      else { state.coverPlaying = true; render(); playCover(getSong(id)); }
      break;
    }
    case "reshare-fav": {
      const f = loadFavs().find((x) => x.songId === el.getAttribute("data-id"));
      if (f) { state.selectedSongId = f.songId; state.shareMode = "beauty"; state.screen = "share"; render(); }
      break;
    }
    case "del-fav": {
      stopCover(); state.coverPlaying = false;
      const id = el.getAttribute("data-id");
      deleteFav(id);
      state.favorites[id] = false;
      showToast("已取消收藏 🗑️");
      render();
      break;
    }
    case "set-sharemode": state.shareMode = el.getAttribute("data-mode"); render(); break;
    case "do-share": {
      const song = getSong(state.selectedSongId);
      const cap = (document.querySelector('[data-role="caption"]') || {}).value || "";
      state.shareCaption = cap;
      const score = state.fullTakeScore || (state.takes.length ? Math.max(...state.takes.map((t) => t.score)) : 85);
      persistWork(song, score, state.shareMode === "raw" ? "原声版" : "美化版", state.shareMode);
      if (navigator.clipboard && cap) navigator.clipboard.writeText(cap).catch(() => {});
      showToast(state.shareMode === "raw" ? "原声已分享，并存入我的唱片 🎙️" : "美化版已分享，并存入我的唱片 ✨");
      render();
      break;
    }
    case "go-share": stopExample(); stopCover(); stopLine(); stopPerform(); state.myVersionPlaying = false; state.performing = false; state.screen = "share"; render(); break;
    case "go-coverpick": stopExample(); stopCover(); state.screen = "coverpick"; render(); break;
    case "go-coverresult": stopCover(); state.screen = "coverresult"; render(); break;
    case "pick-cover": {
      state.selectedSongId = el.getAttribute("data-id");
      state.coverPlaying = false;
      state.screen = "coverresult";
      render();
      break;
    }
    case "toggle-cover-play": {
      if (state.coverPlaying) { stopCover(); state.coverPlaying = false; render(); }
      else { state.coverPlaying = true; render(); playCover(getSong(state.selectedSongId)); }
      break;
    }
    case "fav-cover": {
      const id = state.selectedSongId;
      const song = getSong(id);
      const nowFav = !isFav(id);
      state.favorites[id] = nowFav;
      if (nowFav) {
        const p = PERSONAS[state.report ? state.report.persona : "warm"];
        const d = new Date();
        saveFav({
          songId: id,
          songTitle: song.title,
          emoji: song.emoji,
          personaName: p ? p.name : "我的声音",
          match: coverMatch(song),
          date: `${d.getMonth() + 1}月${d.getDate()}日`,
        });
      } else {
        deleteFav(id);
      }
      showToast(nowFav ? "已收藏到「我的收藏」❤️" : "已取消收藏");
      render();
      break;
    }
    case "download-cover": downloadCover(); break;
    case "go-practice-from-cover": stopCover(); state.coverPlaying = false; state.screen = "practice"; resetPractice(); render(); break;
    case "download-poster": downloadPoster(); break;
    default: break;
  }
}

// 渲染后动画：模型条宽度
function postRender() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".metric .bar > span[data-w]").forEach((el) => {
      el.style.width = el.getAttribute("data-w") + "%";
    });
    // KTV 当前行滚动居中
    if (state.screen === "perform" && state.performing) {
      const box = document.getElementById("ktvLyrics");
      const lit = box ? box.querySelector(".ktv-line.lit") : null;
      if (box && lit) {
        const target = lit.offsetTop - box.clientHeight / 2 + lit.clientHeight / 2;
        box.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    }
  });
}

/* ---------------- 启动 ---------------- */
if (window.speechSynthesis) window.speechSynthesis.getVoices();
render();
