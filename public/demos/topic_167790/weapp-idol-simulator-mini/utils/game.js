// utils/game.js — 星耀 · 偶像成长手账 · 共享逻辑
const app = getApp();

const ACTIVITIES = {
  sing_train:  { name: '声乐训练',  emo: '🎤', loc: 'B 栋 3 楼 · 录音棚',    delta: { sing: +5, mood: -3 } },
  dance_train: { name: '舞蹈练习',  emo: '💃', loc: 'A 栋 1 楼 · 练习室',    delta: { dance: +5, mood: -3 } },
  variety:     { name: '综艺录制',  emo: '📺', loc: '外景 · XX 摄影棚',       delta: { pop: +6, mood: -3, sing: +1 } },
  photoshoot:  { name: '杂志拍摄',  emo: '📸', loc: 'Studio 5 · 造型间',     delta: { pop: +5, mood: -1 } },
  meeting:     { name: '团队会议',  emo: '🗣️', loc: '会议室 · 长桌',         delta: { pop: +2, mood: -1 } },
  class:       { name: '偶像课程',  emo: '📚', loc: '教学楼 · 阶梯教室',      delta: { sing: +2, dance: +2, mood: +2 } },
  livestream:  { name: '粉丝直播',  emo: '🎙️', loc: '直播室 · 1 号间',       delta: { pop: +4, mood: +3 } }
};

// 自由时间选项 (午休时段,玩家自己选)
const FREE_CHOICES = {
  free_dance: { name: '自主练舞', emo: '💃', loc: 'A 栋 1 楼 · 练习室',  delta: { dance: +4, mood: -1 } },
  free_sing:  { name: '自主练歌', emo: '🎵', loc: 'B 栋 3 楼 · 录音棚',  delta: { sing: +4, mood: -1 } },
  free_rest:  { name: '好好休息', emo: '😴', loc: '宿舍 · 公共休息区',    delta: { mood: +8 } },
  free_play:  { name: '出门游玩', emo: '🎮', loc: '商场 · 电玩城',       delta: { mood: +6, pop: +2 } }
};

const ROOM_FANS = ['小琪','阿鹿','七七','昭昭','沐晴','南风','云兮','禾禾','落落','初音','夏沫','千寻','柚子','念念','拾光','北辰'];

// ===== Helpers =====
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmtTime(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uid() { return 'm' + Math.random().toString(36).slice(2, 9); }
function fakeName() {
  const surnames = ['林','陈','苏','何','王','李','周','吴','徐','孙','朱','高','罗','宋'];
  const givens = ['星辰','念念','夏沫','初音','千寻','柚子','南风','拾光','昭昭','落落','北辰','沐晴','云兮','禾禾'];
  return pick(surnames) + pick(givens);
}
function fanMsg() {
  // 兼容旧调用,默认走房间消息
  return roomFanMsg();
}
// ===== 翻牌私信 (1v1,更私密/个人化/提问型) =====
// exclude: 已用过的文本集合,避免重复
function fanMailMsg(exclude) {
  const g = app.globalData;
  const s = g.stats;
  const cur = currentItem();
  const actKey = cur ? cur.key : '';
  function pickUnique(arr) {
    const avail = arr.filter(function(t) { return !exclude || exclude.indexOf(t) < 0; });
    const pool = avail.length > 0 ? avail : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // 根据当前行程生成私信
  if (actKey === 'sing_train') return pickUnique([
    '姐姐练歌辛苦了,能给我们唱一小段吗? 🎵',
    '听说今天录了新歌,好期待!',
    '练高音的时候要保护嗓子呀~',
    '偷偷问一句,今天练了哪首歌?',
    '练歌的时候记得多喝温水!',
    '什么时候能听到完整版?等不及了',
    '今天的练习曲能哼两句吗?'
  ]);
  if (actKey === 'dance_train') return pickUnique([
    '编舞视频什么时候发呀?等好久了 💃',
    '练舞注意膝盖!别太拼了',
    '上次那个 wave 动作太绝了,再教教我们呗',
    '今天练舞流了多少汗?心疼ing',
    '新编舞的走位好复杂,姐姐加油!',
    '练舞视频能不能发个慢速版?想学',
    '舞蹈室的镜子照片好好看!'
  ]);
  if (actKey === 'variety') return pickUnique([
    '综艺几点播呀?我已经定好闹钟了 📺',
    '今天录制顺利吗?有没有好玩的环节',
    '看完综艺了!姐姐太搞笑了哈哈哈哈',
    '综艺里的那个游戏环节我也想玩!',
    '综艺里你的反应太可爱了!',
    '有没有未播花絮?想看',
    '下一期什么时候录?期待!'
  ]);
  if (actKey === 'photoshoot') return pickUnique([
    '今天的造型什么时候发?蹲一个 📸',
    '杂志到了!买了三本!姐姐太好看了',
    '拍摄花絮能不能放出来呀~',
    '今天的妆造绝了,造型师加鸡腿!',
    '封面选哪张好?我觉得第二张!',
    '拍摄那天累不累?记得拉伸',
    '造型图存了当壁纸,太好看了'
  ]);
  if (actKey === 'livestream') return pickUnique([
    '直播几点开始呀?直播间等你 🎙️',
    '上次直播唱的歌我录屏反复看了',
    '直播里能不能给我们读个故事呀~',
    '弹幕太多刷不到我的话,先在这里说:爱你!',
    '下次直播能不能教我们跳舞?',
    '直播时的素颜也太好看了',
    '直播间抽奖我没中…下次还有吗?'
  ]);
  if (actKey === 'free') return pickUnique([
    '姐姐午休在干嘛呀?有空回信吗? 💌',
    '自由时间!能偷偷给我们唱一句吗?',
    '午休别太累呀,记得吃东西~',
    '趁姐姐休息,我赶紧来翻牌了!',
    '午休有没有偷偷吃零食?哈哈',
    '休息的时候在看什么?推荐一下',
    '自由时间也记得回粉丝消息呀~'
  ]);
  if (actKey === 'meeting' || actKey === 'class') return pickUnique([
    '最近课程紧不紧?注意休息呀',
    '今天的偶像课学了什么?好奇!',
    '会议开完了?给你带了奶茶(虚拟的哈哈)',
    '偶像课考试过了吗?加油!',
    '会议上有没有好玩的事?'
  ]);
  // 属性驱动
  if (s.mood <= 35) return pickUnique([
    '姐姐今天心情不好吗?可以跟我说说 🌙',
    '虽然不认识你,但我能感觉到你今天有点累',
    '如果难过的话,就看看我们的应援吧',
    '私信你只是想说:不管怎样我们都在',
    '不开心的时候记得有我们陪你',
    '今天辛苦了,抱抱姐姐'
  ]);
  if (s.mood >= 85) return pickUnique([
    '今天姐姐心情好好!隔着屏幕都感染到我了',
    '能感受到你的快乐!今天发生了什么好事?',
    '姐姐开心我就开心!今天给你画了张小漫画~',
    '你的笑容治愈了我一整天!',
    '心情好就多发自拍吧!爱看'
  ]);
  if (s.pop <= 25) return pickUnique([
    '别在意排名,我一个人的应援顶 100 个人 💪',
    '我把你的视频发到 5 个群了!帮你拉票',
    '虽然人少但我们是最忠实的,永远在',
    '姐姐,我朋友被我安利成功了!又多一个粉',
    '人少不怕,我们的爱不少!',
    '今天又安利了两个同学,有进展!',
    '默默打投中,姐姐加油'
  ]);
  if (s.pop >= 80) return pickUnique([
    '姐姐现在好火呀!骄傲但有点舍不得 😢',
    '新粉太多了,但我可是老粉!认证一下',
    '能不能给我们老粉一些专属福利呀~',
    '今天又上热搜了!厉害了我的姐姐',
    '新粉好多,姐姐别忘了我这个老粉呀',
    '热搜第一!太骄傲了'
  ]);
  // 通用私信
  return pickUnique([
    '姐姐今天翻牌运势怎么样?帮我看看',
    '能给我回一句鼓励的话吗?最近考试压力大 📚',
    '偷偷告诉你,我把你的照片设成了壁纸',
    '姐姐有没有什么推荐的歌?最近歌荒',
    '今天也是想你的一天~什么时候有线下活动?',
    '我做了你的手幅!等线下见面的时候举给你看',
    '姐姐,你的口头禅是啥?我学来用用 😂',
    '最近有没有想吃的?我给你寄(虚拟的)',
    '今天的自拍什么时候发?蹲守中',
    '你以前的舞台视频又看了一遍,还是好帅',
    '有没有什么护肤心得?想学',
    '姐姐养的猫叫什么来着?好可爱'
  ]);
}

// ===== 房间群聊 (更热闹/群体互动/应援/讨论) =====
function roomFanMsg(exclude) {
  const g = app.globalData;
  const s = g.stats;
  const cur = currentItem();
  const actKey = cur ? cur.key : '';
  function pickUnique(arr) {
    const avail = arr.filter(function(t) { return !exclude || exclude.indexOf(t) < 0; });
    const pool = avail.length > 0 ? avail : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // 根据当前行程生成群聊
  if (actKey === 'sing_train') return pickUnique([
    '有没有人录到姐姐进录音棚的视频?',
    '今天练歌！猜猜练的是哪首',
    '坐等新歌！我先排个队 🎵',
    '姐姐高音yyds!上次那个E5我跪了',
    '练歌的时候会不会偷吃润喉糖哈哈',
    '录音棚的隔音效果好奇',
    '有没有人听到姐姐哼歌?羡慕'
  ]);
  if (actKey === 'dance_train') return pickUnique([
    '舞蹈练习室的视频呢!催更催更 💃',
    '今天编舞老师是不是又加了新动作',
    '谁来分析一下上次那个走位?太帅了',
    '练舞的素颜照也好看!服了',
    '舞蹈室空调够不够呀?心疼姐姐流汗',
    '听说今天加了难度,加油姐姐',
    '有没有练舞的偷拍?想看'
  ]);
  if (actKey === 'variety') return pickUnique([
    '今晚综艺必看!群里有追的吗 📺',
    '综艺预告片看了!姐姐镜头好多',
    '有没有人做表情包?等综艺截图',
    '上次综艺那个梗我笑了一周 😂',
    '综艺几点?我设了3个闹钟!',
    '这次综艺嘉宾有谁?期待',
    '综艺回放在哪看?错过了'
  ]);
  if (actKey === 'photoshoot') return pickUnique([
    '杂志什么时候出?我已经预定了 📸',
    '花絮图先来一张呗!求求了',
    '今天的造型师是哪位?封神了',
    '谁能帮我代购?我这里买不到 😭',
    '封面选哪张好?大家投票!',
    '这次风格好高级,爱了',
    '有没有幕后花絮视频?'
  ]);
  if (actKey === 'livestream') return pickUnique([
    '直播马上开始!都来了吗 🎙️',
    '弹幕刷起来!让姐姐看到我们',
    '直播间人数破万了!冲冲冲',
    '姐姐直播唱的那首我循环了一晚上',
    '谁能截个图?弹幕太快了刷不到',
    '直播间BGM是什么歌?好听',
    '下次直播什么时候?等不及了'
  ]);
  if (actKey === 'free') return pickUnique([
    '姐姐午休时间!大家别吵 🤫',
    '趁姐姐午休,我们来刷应援吧',
    '自由时间!大家来聊聊入坑原因',
    '姐姐午休会做什么呢?好奇',
    '安静等姐姐回来~',
    '趁姐姐不在,我们来玩游戏吧',
    '午休时间到!大家有序排队聊天'
  ]);
  // 属性驱动
  if (s.pop >= 80) return pickUnique([
    '姐姐今天也超闪亮!🌟',
    '我朋友都被我安利入坑了!',
    '今天的图我存爆了相册!',
    '粉丝群又涨了 200 人!太强了',
    '姐姐话题又上热搜了!速来',
    '新粉报道!姐姐好棒!',
    '数据组速来!今天冲一波'
  ]);
  if (s.pop <= 25) return pickUnique([
    '我们一起帮你拉票!💪',
    '姐姐别灰心,我们都在!',
    '大家多多安利起来呀~',
    '虽然人少但战斗力最强!',
    '今天打投了吗姐妹们?冲!',
    '人少不怕,慢慢来',
    '我们是最忠实的!永远在'
  ]);
  if (s.mood <= 35) return pickUnique([
    '姐姐好好休息,我们永远支持你 🌙',
    '看到你不开心我们也会心疼',
    '今天别太拼了,要爱自己啊',
    '谁让姐姐不开心了?出来挨打',
    '发个应援视频给姐姐看吧!',
    '姐姐不难过,我们抱抱你',
    '今天安静应援,不打扰姐姐'
  ]);
  if (s.mood >= 85) return pickUnique([
    '今天心情好好!笑容好甜!',
    '姐姐这个状态太可了!',
    '快乐是会传染的~',
    '看到姐姐开心我就放心了',
    '今天姐姐像个小太阳 ☀️',
    '心情好就多发点动态吧!',
    '姐姐笑起来全世界都亮了'
  ]);
  if (s.sing >= 80) return pickUnique([
    '姐姐今天的高音破了个人记录!😭✨',
    '这一句我反复听了一晚上',
    '音准太稳了!专业!',
    '谁来扒一下谱?我想学',
    '这个转音也太丝滑了吧',
    '声乐老师是不是夸姐姐了?'
  ]);
  if (s.dance >= 80) return pickUnique([
    '这个舞蹈也太绝了吧!',
    '姐姐进步好大!舞担认证!',
    '今天的编舞我存了!',
    '谁来做个舞蹈解析?',
    '这个wave我能看一百遍',
    '舞蹈力度控制太好了'
  ]);
  // 通用群聊
  return pickUnique([
    '姐姐今天也很棒!继续加油~',
    '期待下一次舞台!',
    '今天的自拍也太好看了吧',
    '翻牌了吗?什么运势?',
    '姐姐早点休息呀 🌙',
    '有没有人做了姐姐的表情包?分享一下',
    '应援词复习一下:星耀星耀,最闪最亮!',
    '谁来聊聊姐姐最出圈的名场面?',
    '今天又是为姐姐心动的一天',
    '有人存了姐姐今天的路透吗?',
    '大家晚安!明天继续支持姐姐',
    '应援群今天的任务都完成了没?',
    '今天给姐姐的应援花准备了吗?',
    '有没有姐妹线下见过姐姐?说说体验'
  ]);
}

// ===== 翻牌快捷回复 (根据粉丝来信内容动态生成 4 条) =====
function genMailReplies(mailText) {
  const t = mailText || '';
  const topic = [];
  if (/歌|唱|高音|嗓子|录音|新歌|练歌/.test(t)) topic.push(
    { text: '🎤 最近在练新歌,等我!', delta: { sing: +2, pop: +1 } },
    { text: '🎵 高音部分有挑战,会加油的', delta: { sing: +3, mood: +1 } },
    { text: '练完偷偷吃了润喉糖哈哈', delta: { mood: +3 } }
  );
  if (/舞|编舞|wave|走位|膝盖|练舞/.test(t)) topic.push(
    { text: '💃 编舞老师也夸我进步了!', delta: { dance: +2, mood: +2 } },
    { text: '新动作有点难,但我会练好', delta: { dance: +3 } },
    { text: '膝盖没事啦,有做防护~', delta: { mood: +2, pop: +1 } }
  );
  if (/综艺|节目|录制|搞笑|游戏环节/.test(t)) topic.push(
    { text: '📺 综艺超好玩!你们看了吗', delta: { pop: +3, mood: +2 } },
    { text: '那个游戏环节我笑到肚子疼', delta: { mood: +3 } },
    { text: '导演说下次还找我,嘿嘿', delta: { pop: +2, mood: +2 } }
  );
  if (/杂志|拍摄|造型|花絮|封面|妆造|照片/.test(t)) topic.push(
    { text: '📸 花絮图我存了几张,下次发', delta: { pop: +2 } },
    { text: '造型师确实很厉害!', delta: { mood: +2 } },
    { text: '拍摄那天化了2小时妆', delta: { mood: +1 } }
  );
  if (/直播|弹幕|直播间/.test(t)) topic.push(
    { text: '🎙️ 下次直播给你们唱歌!', delta: { pop: +2, sing: +1 } },
    { text: '弹幕太多刷不过来,但都看到了', delta: { mood: +3 } },
    { text: '直播间破万了好开心!', delta: { pop: +3, mood: +2 } }
  );
  if (/礼物|奶茶|漫画|手幅|壁纸|照片|设成/.test(t)) topic.push(
    { text: '🎀 谢谢你的礼物!太感动了', delta: { mood: +4, pop: +1 } },
    { text: '壁纸收到了!画得太好了', delta: { mood: +3 } },
    { text: '手幅我线下一定举给你看!', delta: { pop: +3, mood: +2 } }
  );
  if (/爱|喜欢|永远|忠实|老粉|安利|入坑/.test(t)) topic.push(
    { text: '💕 双向奔赴!我也爱你们', delta: { pop: +3, mood: +3 } },
    { text: '老粉我都记得,谢谢一路陪伴', delta: { pop: +2, mood: +4 } },
    { text: '你安利辛苦了!给你加鸡腿', delta: { mood: +2, pop: +1 } }
  );
  if (/难过|累|压力|辛苦|心疼|心情不好|不开心/.test(t)) topic.push(
    { text: '🥺 看到你的话好温暖', delta: { mood: +5, pop: +1 } },
    { text: '有你们在我就不累了', delta: { mood: +4, pop: +2 } },
    { text: '今天有点累,但会调整的', delta: { mood: +3 } }
  );
  if (/开心|快乐|笑|甜|太阳|感染/.test(t)) topic.push(
    { text: '😊 今天确实心情很好!', delta: { mood: +3, pop: +1 } },
    { text: '你们的应援就是我的快乐源泉', delta: { mood: +4, pop: +2 } },
    { text: '嘿嘿,被你发现了', delta: { mood: +2 } }
  );
  if (/晚安|睡觉|好梦|明天见/.test(t)) topic.push(
    { text: '🌙 晚安,做个好梦~', delta: { mood: +3 } },
    { text: '明天见!你也早点休息', delta: { mood: +2 } }
  );
  if (/考试|压力|学习|歌荒|推荐|口头禅/.test(t)) topic.push(
    { text: '📚 考试加油!你一定行的', delta: { pop: +2, mood: +2 } },
    { text: '推荐你听《追光》,很适合现在', delta: { pop: +1 } },
    { text: '别太拼了,也要照顾自己', delta: { mood: +3 } }
  );
  if (/翻牌|运势|运气/.test(t)) topic.push(
    { text: '🍀 今天翻牌运势不错!', delta: { mood: +3 } },
    { text: '希望好运传给你~', delta: { pop: +2, mood: +2 } }
  );
  if (/午休|自由时间|休息/.test(t)) topic.push(
    { text: '😴 正在休息,偷偷回你', delta: { mood: +3 } },
    { text: '午休时间也不能闲着哈哈', delta: { mood: +2 } }
  );
  if (/排名|拉票|安利|人少/.test(t)) topic.push(
    { text: '💪 有你一个人顶100个!', delta: { pop: +2, mood: +3 } },
    { text: '别在意排名,我们一起努力', delta: { mood: +3 } }
  );
  if (/热搜|火了|太火|新粉|骄傲/.test(t)) topic.push(
    { text: '💕 谢谢你们一直陪着!', delta: { pop: +2, mood: +2 } },
    { text: '老粉永远是最重要的', delta: { pop: +1, mood: +4 } }
  );
  // 通用回复池 (含正面 + 扣分选项)
  const general = [
    { text: '🌸 谢谢宝宝的支持!', delta: { pop: +2, mood: +2 } },
    { text: '🌟 有你们在就够了', delta: { mood: +5, pop: +1 } },
    { text: '💪 我会继续加油的!', delta: { pop: +1, mood: +1 } },
    { text: '😋 下次给你们更厉害的!', delta: { pop: +3 } },
    { text: '📸 拍了好看的自拍,下次发', delta: { pop: +2 } },
    { text: '🌙 晚安,明天见', delta: { mood: +3 } },
    // ↓ 扣分选项 (有风险)
    { text: '😤 今天状态不好,别烦我', delta: { pop: -5, mood: -3 } },
    { text: '🙄 这种问题也要问?', delta: { pop: -4, mood: -2 } },
    { text: '🥱 好无聊啊…', delta: { pop: -3, mood: -1 } }
  ];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  shuffle(topic);
  shuffle(general);
  const take = Math.min(topic.length, 3);
  return shuffle(topic.slice(0, take).concat(general.slice(0, 4 - take))).slice(0, 4);
}

// ===== 房间快捷回复 (6 分类 + 作死,每条不同分类,共 3 条) =====
function genRoomReplies(fanText) {
  const t = fanText || '';
  const ALL = [
    { text: '🌸 谢谢你们,有你们真好', cat: '暖心', delta: { mood: +3, pop: +1 } },
    { text: '💗 看到你们的应援好感动', cat: '暖心', delta: { mood: +4, pop: +1 } },
    { text: '🥰 你们就是我的动力', cat: '暖心', delta: { mood: +3, pop: +2 } },
    { text: '🌙 早点休息,别熬夜等我', cat: '暖心', delta: { mood: +2 } },
    { text: '💪 一起努力!我们最棒', cat: '打气', delta: { pop: +2, mood: +2 } },
    { text: '✨ 下次舞台一定更厉害', cat: '打气', delta: { pop: +2, mood: +1 } },
    { text: '🏆 一起冲向更好的自己!', cat: '打气', delta: { pop: +3, mood: +1 } },
    { text: '🔥 今天也全力以赴了!', cat: '打气', delta: { pop: +2, mood: +2 } },
    { text: '🙈 还有很多要学习的地方', cat: '谦虚', delta: { mood: +1, pop: +1 } },
    { text: '🙏 谢谢夸奖,继续努力', cat: '谦虚', delta: { pop: +1, mood: +2 } },
    { text: '😌 没那么厉害啦,运气好', cat: '谦虚', delta: { mood: +2 } },
    { text: '📝 比起前辈还差很远', cat: '谦虚', delta: { mood: +1, sing: +1 } },
    { text: '😝 偷偷告诉你们一个秘密', cat: '俏皮', delta: { mood: +3, pop: +1 } },
    { text: '🤪 今天吃太多了,嘘', cat: '俏皮', delta: { mood: +2 } },
    { text: '😎 今天也是帅气的一天', cat: '俏皮', delta: { mood: +2, pop: +1 } },
    { text: '😆 你们猜我今天遇见了谁', cat: '俏皮', delta: { mood: +3 } },
    { text: '🎤 最近在打磨高音技巧', cat: '专业', delta: { sing: +2 } },
    { text: '💃 编舞走位又优化了', cat: '专业', delta: { dance: +2 } },
    { text: '📚 偶像课笔记记了三页', cat: '专业', delta: { sing: +1, dance: +1 } },
    { text: '🎬 下次拍摄会尝试新风格', cat: '专业', delta: { pop: +1 } },
    { text: '🥺 今天练舞好累…', cat: '示弱', delta: { mood: -2, pop: +1 } },
    { text: '😢 最近压力有点大', cat: '示弱', delta: { mood: -1, pop: +2 } },
    { text: '😪 没睡好,黑眼圈要出来了', cat: '示弱', delta: { mood: -1 } },
    { text: '😓 高音部分还没完全突破', cat: '示弱', delta: { mood: -1, sing: +1 } },
    // ↓ 作死选项 (扣分,偶尔出现)
    { text: '😤 今天不想营业', cat: '作死', delta: { pop: -5, mood: -3 } },
    { text: '🙄 你们能不能别刷屏了', cat: '作死', delta: { pop: -4, mood: -2 } },
    { text: '🥱 好困,没什么好说的', cat: '作死', delta: { pop: -3, mood: -1 } },
    { text: '😏 我觉得另一个成员更厉害', cat: '作死', delta: { pop: -6 } }
  ];
  // 根据粉丝消息筛选合适分类 (第3条有概率换成作死)
  let cats;
  if (/累|辛苦|压力|心疼|难过|不开心/.test(t)) cats = ['暖心', '示弱', '俏皮'];
  else if (/加油|冲|安利|拉票|排名/.test(t)) cats = ['打气', '暖心', '谦虚'];
  else if (/歌|唱|高音|音准|谱/.test(t)) cats = ['专业', '谦虚', '示弱'];
  else if (/舞|编舞|走位|舞蹈/.test(t)) cats = ['专业', '俏皮', '示弱'];
  else if (/开心|快乐|笑|甜|太阳/.test(t)) cats = ['俏皮', '打气', '暖心'];
  else if (/好看|美|帅|造型|封面/.test(t)) cats = ['谦虚', '俏皮', '暖心'];
  else if (/直播|弹幕/.test(t)) cats = ['俏皮', '打气', '专业'];
  else if (/综艺|节目|搞笑/.test(t)) cats = ['俏皮', '暖心', '打气'];
  else cats = ['暖心', '打气', '俏皮'];
  // 30% 概率第3条换成作死
  if (Math.random() < 0.3) cats[2] = '作死';
  const picked = [];
  cats.forEach(function(c) {
    const pool = ALL.filter(function(r) { return r.cat === c; });
    if (pool.length > 0) picked.push(pool[Math.floor(Math.random() * pool.length)]);
  });
  return picked;
}

// ===== Schedule =====
function buildTodaySchedule() {
  const g = app.globalData;
  if (g.todayDate === g.day && g.todaySeason === g.season) return;
  g.todayDate = g.day;
  g.todaySeason = g.season;
  let seed = g.day * 17 + g.season * 113 + 1;
  function srand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  const segCount = 2 + Math.floor(srand() * 4);
  let cur = app.DAY_START_MIN;
  const slots = [], durs = [];
  for (let k = 0; k < segCount; k++) {
    if (k === segCount - 1) {
      const remaining = app.DAY_END_MIN - cur - 30;
      let lastDur = Math.max(60, Math.min(180, remaining));
      lastDur = Math.round(lastDur / 30) * 30;
      slots.push(cur); durs.push(lastDur);
    } else {
      const dur = 90 + Math.floor(srand() * 4) * 30;
      slots.push(cur); durs.push(dur);
      cur += dur + 30;
    }
  }
  const must = ['sing_train', 'variety'];
  const rest = ['dance_train', 'photoshoot', 'class', 'livestream', 'meeting'];
  // 直播固定放最后一段(晚上),其余打乱
  const others = must.concat(rest.filter(function(k) { return k !== 'livestream'; }));
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(srand() * (i + 1));
    const t = others[i]; others[i] = others[j]; others[j] = t;
  }
  const keys = others.concat(['livestream']);
  const list = [];
  // 随机选一个时段作为"自由时间"(不安排公司活动),但不能选最后一段(直播)
  const freeSlotIdx = Math.floor(srand() * Math.max(1, slots.length - 1));
  for (let m2 = 0; m2 < slots.length; m2++) {
    const isFree = (m2 === freeSlotIdx);
    if (isFree) {
      list.push({
        minute: slots[m2], endMin: slots[m2] + durs[m2],
        key: 'free', name: '自由时间', emo: '🆓', loc: '你自己决定',
        delta: {}, done: false, skipped: false, isFree: true, freeChoice: null
      });
    } else {
      const a = ACTIVITIES[keys[m2 % keys.length]];
      list.push({
        minute: slots[m2], endMin: slots[m2] + durs[m2],
        key: keys[m2 % keys.length], name: a.name, emo: a.emo, loc: a.loc, delta: a.delta,
        done: false, skipped: false, isFree: false, freeChoice: null
      });
    }
  }
  g.todaySchedule = list;
  g.minute = app.DAY_START_MIN;
  g.paused = false;
  app.save();
}

function currentItem() {
  const g = app.globalData;
  return g.todaySchedule.find(s => !s.done && s.minute <= g.minute)
    || g.todaySchedule.find(s => !s.done);
}
function allDone() {
  const g = app.globalData;
  return g.todaySchedule.length > 0 && g.todaySchedule.every(s => s.done);
}
// 自动跳过已过期的行程 (当前时间 > 行程结束时间 且未完成)
function autoExpireSchedule() {
  const g = app.globalData;
  let changed = false;
  g.todaySchedule.forEach(function(s) {
    if (!s.done && g.minute > s.endMin) {
      s.done = true;
      s.skipped = true;
      s.missed = true;
      // 错过行程有隐形惩罚
      g.stats.pop = clamp(g.stats.pop - 3, 0, 100);
      changed = true;
    }
  });
  if (changed) app.save();
  return changed;
}

// ===== Mail =====
function ensureMails() {
  const g = app.globalData;
  if (g._mailsGenDay === g.day && g._mailsGenSeason === g.season) return;
  g._mailsGenDay = g.day;
  g._mailsGenSeason = g.season;
  const n = 1 + Math.floor(Math.random() * 4);  // 每天 1-4 封私信
  const usedTexts = [];
  for (let i = 0; i < n; i++) {
    const text = fanMailMsg(usedTexts);
    usedTexts.push(text);
    g.mails.unshift({
      id: uid(),
      from: fakeName(),
      avatar: pick(['小琪','阿鹿','七七','绵绵','昭昭','沐晴','安安']),
      text: text,
      time: pick(['刚刚','1 分钟前','5 分钟前','今天','昨天']),
      read: false,
      reply: null,
      createdDay: g.day,
      expiresDay: g.day + app.MAIL_TTL_DAYS
    });
  }
  app.save();
}
function expireOldMails() {
  const g = app.globalData;
  const lost = [];
  g.mails = g.mails.filter(m => {
    if (m.reply) return true;
    if (g.day > m.expiresDay) { lost.push(m); return false; }
    return true;
  });
  return lost;
}

// ===== Room =====
function genFanLine() {
  const g = app.globalData;
  // 收集最近 10 条粉丝消息作为排除集
  const recent = g.roomLog.slice(-10).filter(function(m) { return !m.me; }).map(function(m) { return m.text; });
  return { who: pick(ROOM_FANS), text: roomFanMsg(recent) };
}
function pushRoom(who, text, me) {
  app.globalData.roomLog.push({
    who, text, me: !!me,
    min: app.globalData.minute,
    day: app.globalData.day,
    season: app.globalData.season
  });
}
function chatTimeLabel(m) {
  const g = app.globalData;
  if (m.day !== g.day || m.season !== g.season) {
    if (m.season === g.season) return '第 ' + m.day + ' 天 ' + fmtTime(m.min);
    return '第 ' + m.season + ' 季·第 ' + m.day + ' 天 ' + fmtTime(m.min);
  }
  const diff = g.minute - m.min;
  if (diff < 1) return '刚刚';
  if (diff < 60) return diff + ' 分钟前';
  return fmtTime(m.min);
}
function seedRoomLog() {
  const g = app.globalData;
  const seed = g.day + g.season * 7;
  const n = 3 + (seed % 3);
  for (let i = 0; i < n; i++) {
    const line = genFanLine();
    const offset = 6 + i * 4 + (seed % 5);
    pushRoom(line.who, line.text, false);
    g.roomLog[g.roomLog.length - 1].min = Math.max(app.DAY_START_MIN, g.minute - offset);
  }
  g.lastRoomSpawnMin = g.minute;
}
function tryAutoRoomSpawn() {
  const g = app.globalData;
  if (g.minute - g.lastRoomSpawnMin < 2) return;
  if (g.roomLog.length === 0) { seedRoomLog(); return; }
  const baseRate = (g.stats.mood >= 70 || g.stats.pop >= 60) ? 0.22 : 0.12;
  if (Math.random() > baseRate) return;
  g.lastRoomSpawnMin = g.minute;
  const line = genFanLine();
  pushRoom(line.who, line.text, false);
}
function pickRoomChatterText(myText) {
  if (/累|压力|辛苦/.test(myText)) return pick(['抱抱姐姐 🌸','心疼你~','好好休息呀!']);
  if (/哈哈|笑|开心|快乐/.test(myText)) return pick(['哈哈哈哈同感!','笑死我了 😂','快乐的我停不下来']);
  if (/晚安|睡觉/.test(myText)) return pick(['姐姐晚安!🌙','做个好梦~','明天见!']);
  if (/谢|爱/.test(myText)) return pick(['姐姐我们爱你!','双向奔赴最戳了 😭','永远支持你!']);
  if (/翻牌|运势/.test(myText)) return pick(['我今天翻到了 ⭐⭐⭐!','我也来翻!','求好运!']);
  return pick(['收到收到!','姐姐好棒!','继续冲!','爱你!','我粉了!']);
}

// ===== Game actions =====
// 属性变化加随机: 基础值 ±50% 浮动, 20% 概率反转(正变负/负变正)
function rollDelta(delta) {
  const result = {};
  Object.keys(delta).forEach(function(k) {
    const base = delta[k];
    if (base === 0) { result[k] = 0; return; }
    // ±50% 浮动
    let v = base * (0.5 + Math.random());
    v = Math.round(v);
    // 20% 概性反转
    if (Math.random() < 0.2) v = -v;
    // 原本正的至少保留 +1, 原本负的至少保留 -1
    if (base > 0 && v === 0) v = 1;
    if (base < 0 && v === 0) v = -1;
    result[k] = v;
  });
  return result;
}

function applyDelta(stats, delta) {
  Object.keys(delta).forEach(function(k) { stats[k] = clamp(stats[k] + delta[k], 0, 100); });
}

function doActivity(skipMode) {
  const g = app.globalData;
  if (g.busy || g.paused) return null;
  const cur = currentItem();
  if (!cur || cur.done) return null;
  g.busy = true;
  const newMin = Math.min(app.DAY_END_MIN, cur.endMin);
  g.minute = newMin;
  if (skipMode) {
    g.stats.pop = clamp(g.stats.pop - 5, 0, 100);
    g.stats.mood = clamp(g.stats.mood + 5, 0, 100);
    g.skipCount = (g.skipCount || 0) + 1;
    cur.skipped = true;
  } else {
    const rolled = rollDelta(cur.delta);
    applyDelta(g.stats, rolled);
    cur.actualDelta = rolled;
    cur.skipped = false;
  }
  cur.done = true;
  app.save();
  g.busy = false;
  return cur;
}

// ===== 自由时间选择 (午休时段 4 选 1) =====
function doFreeChoice(choiceKey) {
  const g = app.globalData;
  if (g.busy || g.paused) return null;
  const cur = currentItem();
  if (!cur || cur.done || !cur.isFree) return null;
  const choice = FREE_CHOICES[choiceKey];
  if (!choice) return null;
  g.busy = true;
  const newMin = Math.min(app.DAY_END_MIN, cur.endMin);
  g.minute = newMin;
  const rolled = rollDelta(choice.delta);
  applyDelta(g.stats, rolled);
  cur.actualDelta = rolled;
  cur.done = true;
  cur.skipped = false;
  cur.freeChoice = choiceKey;
  cur.name = choice.name;
  cur.emo = choice.emo;
  cur.loc = choice.loc;
  cur.delta = choice.delta;
  app.save();
  g.busy = false;
  return cur;
}

function continueFreeTime() {
  const g = app.globalData;
  g.paused = false;
  app.save();
}
function finishDay() {
  const g = app.globalData;
  g.paused = true;
  const lost = expireOldMails();
  ensureMails();
  app.save();
  // 1.4s 后切下一天
  setTimeout(() => {
    g.day += 1;
    if (g.day > app.DAY_IN_SEASON) {
      g.day = 1;
      doRanking();
      return;
    }
    g.todayDate = -1;
    g.minute = app.DAY_START_MIN;
    g.paused = false;
    buildTodaySchedule();
    app.save();
  }, 1400);
  return lost;
}

function doRanking() {
  const g = app.globalData;
  const s = g.stats;
  // 玩家综合分: 加权平均 (0-100), 人气权重最高
  const myScore = s.sing * 0.2 + s.dance * 0.2 + s.pop * 0.4 + s.mood * 0.2 + (Math.random() * 8 - 4);
  // NPC 分数: 同为 0-100 量级, 随季数递增难度
  const seasonBonus = (g.season - 1) * 3;
  const npcs = [];
  for (let i = 0; i < app.PLAYER_COUNT - 1; i++) {
    const base = 25 + Math.pow(Math.random(), 1.4) * 55 + seasonBonus;
    npcs.push({ name: fakeName(), score: Math.min(100, base + (Math.random() * 12 - 6)) });
  }
  npcs.push({ name: '⭐ 你', score: Math.min(100, myScore), isMe: true });
  npcs.sort((a, b) => b.score - a.score);
  const meIdx = npcs.findIndex(n => n.isMe);
  g.seasonRank = meIdx + 1;
  g._rankNpcs = npcs;
  g._rankScore = myScore;
  g._rankMeIdx = meIdx;
  app.save();
  return { meIdx, myScore, npcs, isTop: meIdx < app.TOP_RANK };
}

function nextSeason() {
  const g = app.globalData;
  if (g.season >= app.MAX_SEASON) return 'graduated';
  g.season += 1;
  g.stats.pop = clamp(g.stats.pop + 5, 0, 100);
  g.stats.mood = clamp(g.stats.mood - 3, 20, 100);
  g.busy = false;
  g.todayDate = -1;
  g.minute = app.DAY_START_MIN;
  g.paused = false;
  buildTodaySchedule();
  app.save();
  return 'next';
}
function quitGame() { app.globalData.quit = true; app.save(); }
function graduate() { app.globalData.graduated = true; app.save(); }
function restart() {
  const g = app.globalData;
  g.season = 1; g.day = 1; g.minute = app.DAY_START_MIN;
  g.stats = { sing: 30, dance: 30, pop: 20, mood: 60, fans: 60 };
  g.seasonRank = null; g.quit = false; g.graduated = false;
  g.busy = false; g.mails = []; g.roomLog = [];
  g.todaySchedule = []; g.todayDate = -1; g.skipCount = 0; g.paused = false;
  g._mailsGenDay = -1; g._mailsGenSeason = -1; g.lastRoomSpawnMin = -1;
  buildTodaySchedule();
  app.save();
}

module.exports = {
  ACTIVITIES, FREE_CHOICES, ROOM_FANS,
  pad, fmtTime, clamp, pick, uid, fakeName, fanMsg, fanMailMsg, roomFanMsg,
  genMailReplies, genRoomReplies,
  buildTodaySchedule, currentItem, allDone, autoExpireSchedule,
  ensureMails, expireOldMails,
  genFanLine, pushRoom, chatTimeLabel, seedRoomLog, tryAutoRoomSpawn, pickRoomChatterText,
  doActivity, doFreeChoice, continueFreeTime, finishDay, doRanking,
  nextSeason, quitGame, graduate, restart
};
