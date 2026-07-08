import { NextResponse } from 'next/server';
import type { GenerationRequest, GeneratedScenario } from '@/types/generation';
import scenariosData from '@/app/data/scenarios.json';

// ============================================================
// 扩展预置题库：覆盖 14 个兴趣，每个兴趣 3 道题
// 训练主题（兼容新旧两种命名）：
//   新：看懂心情、轮流说话、开始聊天、处理变化
//   旧：看懂心情、轮流玩、看懂表情和动作、遇到不开心的时候
// 难度：easy（轻松）、medium（中等）、hard（挑战）
// ============================================================

// 新旧 topic 名称映射
const TOPIC_ALIASES: Record<string, string[]> = {
  '看懂心情': ['看懂心情'],
  '轮流说话': ['轮流说话', '轮流玩'],
  '开始聊天': ['开始聊天', '看懂表情和动作'],
  '处理变化': ['处理变化', '遇到不开心的时候'],
};

type SkillTag = '看懂心情' | '轮流说话' | '开始聊天' | '处理变化' | '轮流玩' | '看懂表情和动作' | '遇到不开心的时候';

interface ExtendedScenario extends GeneratedScenario {
  interest: string;  // 关联的兴趣关键词
  skillTag2: SkillTag;  // 训练主题
  difficulty: 'easy' | 'medium' | 'hard';  // 难度等级
}

// 从旧题 skillTag 推断 topic
function inferTopicFromSkillTag(skillTag: string | undefined): SkillTag {
  if (!skillTag) return '看懂心情';
  const lower = skillTag.toLowerCase();
  if (lower.includes('轮流') || lower.includes('等待')) return '轮流说话';
  if (lower.includes('表情') || lower.includes('身体语言') || lower.includes('读懂')) return '开始聊天';
  if (lower.includes('冲突') || lower.includes('边界') || lower.includes('变化')) return '处理变化';
  return '看懂心情';
}

// 从 scenarios.json 转换题目为 ExtendedScenario 格式
// 兼容旧题格式：旧题没有 topic/difficulty 字段，根据 skillTag 推断 topic，difficulty 默认为 medium
function convertFromScenariosJson(scenario: Record<string, unknown>): ExtendedScenario | null {
  const interest = scenario.interest as string;
  const topic = scenario.topic as string;
  const difficulty = scenario.difficulty as string;
  
  if (!interest) {
    return null;
  }
  
  // 旧题没有 topic/difficulty，根据 skillTag 推断
  const inferredTopic = topic || inferTopicFromSkillTag(scenario.skillTag as string);
  const inferredDifficulty = difficulty || 'medium';
  
  return {
    interest,
    scene: scenario.scene as string,
    question: scenario.question as string,
    sceneIcon: (scenario.sceneIcon as string) || '💬',
    options: scenario.options as GeneratedScenario['options'],
    skillTag: scenario.skillTag as string || inferredTopic,
    skillTag2: inferredTopic as SkillTag,
    difficulty: inferredDifficulty as 'easy' | 'medium' | 'hard',
    socialRule: (scenario.socialRule as string) || '和大家好好相处。',
    parentTip: (scenario.parentTip as string) || '平时多和孩子练习。',
  };
}

// 从 scenarios.json 获取所有题目
function getScenariosFromJson(): ExtendedScenario[] {
  const scenarios = scenariosData.scenarios as Record<string, unknown>[];
  return scenarios
    .map(convertFromScenariosJson)
    .filter((s): s is ExtendedScenario => s !== null);
}

// 检查 topic 是否匹配（包括别名）
function isTopicMatch(scenarioTopic: string, targetTopic: string): boolean {
  if (scenarioTopic === targetTopic) return true;
  const aliases = TOPIC_ALIASES[targetTopic];
  if (aliases && aliases.includes(scenarioTopic)) return true;
  const scenarioAliases = Object.entries(TOPIC_ALIASES).find(([_, aliases]) => aliases.includes(scenarioTopic));
  if (scenarioAliases && scenarioAliases[0] === targetTopic) return true;
  return false;
}

const EXTENDED_SCENARIOS: ExtendedScenario[] = [
  // ===== 地铁 =====
  {
    interest: '地铁',
    scene: '地铁到站了，你站在站台边等下一班列车。旁边一位阿姨笑着问你："小朋友，你也喜欢地铁吗？你知道这条线路经过哪些站吗？"',
    question: '面对阿姨的提问，你会怎么做？',
    sceneIcon: '🚇',
    options: [
      { text: '笑着点点头，说"对！我最喜欢地铁了，我还知道2号线经过哪些站呢……"', icon: '😊', isRecommended: true, feedback: '你愿意开口分享自己喜欢的事情，这真的很棒！阿姨会觉得你是个很有趣的孩子，你们说不定还能聊起来。这就叫"用分享交朋友"。' },
      { text: '低头不看她，继续专心看地铁进站', icon: '🤫', isRecommended: false, feedback: '有时候就是不想说话，只想好好看地铁，这种感觉很正常。不过阿姨可能会有点失落。下次如果不想多说，也可以轻轻点点头笑一笑，这就够了。' },
      { text: '转身走到站台的另一边', icon: '🚶', isRecommended: false, feedback: '想换到一个让自己更舒服的地方，这是你在照顾自己，没关系。不过阿姨只是想聊聊天。下次可以试试看笑一下再走开，这样对方不会觉得你不喜欢她。' },
    ],
    skillTag: '情绪识别·与陌生人对话',
    skillTag2: '看懂心情',
    difficulty: 'easy',
    socialRule: '有人主动跟你说话，点头、微笑或说一句话，都是在说"我听到你了"。',
    parentTip: '平时在站台、公园遇到熟人打招呼，帮孩子想一句简短的"默认回复"（比如对阿姨笑笑说一句话），练得多了就不紧张。',
  },
  {
    interest: '地铁',
    scene: '地铁车厢里人很多，你站在门口，旁边一位叔叔手里拿着一杯咖啡。你不小心轻轻碰了他一下，咖啡洒出来一点点。叔叔回头看了你一眼，没有说话。',
    question: '这时候你会怎么做？',
    sceneIcon: '☕',
    options: [
      { text: '小声说"对不起"，然后往旁边挪了挪', icon: '🙇', isRecommended: true, feedback: '你马上说了对不起，还让出空间，这真的很有礼貌！叔叔会马上明白你不是故意的，他会放松下来。这就叫"为自己的不小心道歉"。' },
      { text: '低着头装作没看见，不说话', icon: '😶', isRecommended: false, feedback: '你可能有点紧张，不知道该说什么，这种感觉我懂。不过叔叔可能会想"他是不是没觉得抱歉"。下次只要说一句"对不起"，哪怕声音很小，也比什么都不说好。' },
      { text: '大声说"不是我！是地铁晃的！"', icon: '😤', isRecommended: false, feedback: '你想解释不是自己故意的，这是想保护自己的反应，完全可以理解。但这样说听起来有点凶，叔叔可能会生气。下次可以先说"对不起"，再说"地铁有点晃"，一句话就解决了。' },
    ],
    skillTag: '轮流等待·礼貌道歉',
    skillTag2: '遇到不开心的时候',
    difficulty: 'medium',
    socialRule: '不小心碰到别人，先说"对不起"。',
    parentTip: '在家和孩子玩"假装碰了一杯水"的演练，让他自己说一句道歉话，比只听我们讲道理管用得多。',
  },
  {
    interest: '地铁',
    scene: '地铁上，你正在看窗外的风景，旁边的小朋友突然凑过来要看你的书，还伸手要抢过去。',
    question: '你会怎么做？',
    sceneIcon: '📖',
    options: [
      { text: '把书稍微挪开一点，平静地说"我还没看完，你可以等我一下吗"', icon: '✋', isRecommended: true, feedback: '你既保护了自己的书，又用很礼貌的话把需要说出来，真的太厉害了！对方会停下来想一想。这就叫"好好保护自己的东西"。' },
      { text: '用力把书护在胸前，不说话', icon: '🛡️', isRecommended: false, feedback: '你知道要保护自己的书，这个直觉很对。不过只用动作不说一句话，对方可能不明白你想什么。下次可以再加上一句"我还没看完哦"，一句话就够了。' },
      { text: '直接把书给了他，自己转过身去', icon: '😔', isRecommended: false, feedback: '你很愿意分享，这是你很大方的地方。不过有时候你想自己看，这也是你的权利。下次可以试着说"等我看完这一页好吗"，这样既不吵架也保护了自己想做的事。' },
    ],
    skillTag: '应对冲突·保护边界',
    skillTag2: '遇到不开心的时候',
    difficulty: 'hard',
    socialRule: '我的东西我做主，但要说出来，而不是直接抢或直接让开。',
    parentTip: '在家可以和孩子玩"想借他的玩具"的演练，让他练习说"等我玩好给你"，这比在外面临时被抢更容易练熟。',
  },

  // ===== 恐龙 =====
  {
    interest: '恐龙',
    scene: '课间休息时，你正在给大家讲霸王龙的特征。旁边的小明说："我更喜欢腕龙！"然后他开始讲腕龙。你想继续讲霸王龙，但小明一直在说话。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🦖',
    options: [
      { text: '等小明说完，然后说"你说的腕龙也很有意思！让我也说说霸王龙吧"', icon: '🤝', isRecommended: true, feedback: '你愿意等别人说完，还夸了他一下，这真的很高级！小明会觉得自己被听到了，然后他也会愿意听你讲。这就叫"你说一句我说一句"。' },
      { text: '大声说"腕龙一点都不酷，霸王龙才是最厉害的！"', icon: '😠', isRecommended: false, feedback: '你很想让大家听到你喜欢的恐龙，这种想分享的心情我完全懂。但直接说对方不喜欢的话，小明可能会生气，然后你们就聊不下去了。下次可以先说一句"腕龙也很有意思！",再说你自己的部分。' },
      { text: '不说话，低下头不听了', icon: '😶', isRecommended: false, feedback: '你可能觉得"他们根本不想听我"，心里有点委屈，对吗？这很正常。不过不说一句话就低头，别人可能不知道你也想讲。下次可以试试说"我也知道一个关于霸王龙的事"，一开口，机会就来了。' },
    ],
    skillTag: '情绪识别·轮流对话',
    skillTag2: '轮流玩',
    difficulty: 'easy',
    socialRule: '大家都可以讲自己喜欢的东西，但要你一句我一句，不打断也不贬低。',
    parentTip: '和孩子聊天时故意讲几句他可能不太喜欢的话题，然后问他"你怎么把自己喜欢的东西加进来"，这是很好的轮流对话练习。',
  },
  {
    interest: '恐龙',
    scene: '恐龙主题活动中，老师让大家轮流介绍自己最喜欢的恐龙。轮到你说了，但前面的同学说了很久还没结束，你已经等了一会儿了。',
    question: '你会怎么做？',
    sceneIcon: '⏳',
    options: [
      { text: '安静等待，不出声，等老师来提醒', icon: '🧘', isRecommended: true, feedback: '你忍住着急安静地等，这非常不容易！老师和同学都看得到你的耐心，等下你说的时候大家也会更认真听。这就叫"耐心等待轮次"。' },
      { text: '小声说"怎么还不完啊"', icon: '😣', isRecommended: false, feedback: '等得有点不耐烦了，对吗？这种感觉很正常。不过说出来的话，周围同学可能会被你影响。下次可以试试在心里数到十，或想一想等下要说什么，这样更能坚持下去。' },
      { text: '直接站起来说"轮到我了"', icon: '✋', isRecommended: false, feedback: '你很想轮到自己，这种着急我能理解。不过直接打断会让前面的同学很难受，他可能还没说完。下次可以举手让老师知道你在等，由老师来提醒他，这样最公平。' },
    ],
    skillTag: '轮流等待·耐心',
    skillTag2: '看懂心情',
    difficulty: 'medium',
    socialRule: '轮到自己之前，安静等，不打断。',
    parentTip: '晚餐时全家玩"每人说一件今天的事"，严格不能打断——这是生活中最自然的轮流练习。',
  },
  {
    interest: '恐龙',
    scene: '你和同学在讨论恐龙，你说完自己的观点后，同学皱了皱眉，停顿了一下，然后说"这个好像不太对吧……"他的表情看起来有点困惑。',
    question: '你会怎么做？',
    sceneIcon: '🤔',
    options: [
      { text: '问问他"哪里不对呢？能告诉我吗？"然后认真听他说', icon: '👂', isRecommended: true, feedback: '你没急着反驳，反而想知道他在想什么，这说明你会读别人的表情和语气，真的很厉害！他说的不一定全对，但你会先听。这就叫"先听别人怎么想"。' },
      { text: '皱起眉头说"我说的就是对的！"然后走开', icon: '😤', isRecommended: false, feedback: '你很相信自己知道的，这份自信是好事！不过恐龙确实有很多不同说法。直接说别人不对，对方会觉得你不听他的想法。下次可以说"我看到书上这么说，你看到的是什么样呢"，聊下去就会有新东西。' },
      { text: '低着头不说话，不知道说什么', icon: '😶', isRecommended: false, feedback: '被人质疑时脑袋会突然一片空白，这种感觉真的很不舒服，我懂。没关系，这次不说也完全可以。下次遇到类似情况，可以先说一句"哦？那你看到的是怎样的"，给双方一个继续聊下去的小台阶。' },
    ],
    skillTag: '读懂身体语言·接受不同意见',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '别人有不同想法时，先听再回应，不急着反驳。',
    parentTip: '在家故意和孩子唱反调（用轻松方式），问他"你怎么回应我"，这是非常低成本的辩论练习。',
  },

  // ===== 乐高 =====
  {
    interest: '乐高',
    scene: '你在用乐高搭一个很酷的宇宙飞船，旁边的小美说"哇，好漂亮！你能帮我看看我搭的是什么吗？"她看起来很开心。',
    question: '你会怎么做？',
    sceneIcon: '🧩',
    options: [
      { text: '点点头，去看看她的作品，说"你搭的是什么呀？"', icon: '👀', isRecommended: true, feedback: '你停下自己玩的东西去看看别人的，这就是关心别人！小美会很开心被你注意到。这就叫"关注一下别人"。' },
      { text: '说"你自己看吧，我要继续搭"', icon: '😐', isRecommended: false, feedback: '你正玩到最有意思的地方，不想被打断，这种心情我完全懂。不过一句简短的拒绝，会让小美好一会儿不敢再跟你说话。下次可以说"等我搭完这一块就来看"，这样她就知道你只是还没忙完。' },
      { text: '低着头假装没听见', icon: '🤫', isRecommended: false, feedback: '有时候就是不想说话，只想专心搭，这种感觉完全正常。不过完全不理会，别人可能会想"他是不是不喜欢我"。下次哪怕只是点点头或者说一句"等我一下"，就不会让人误会了。' },
    ],
    skillTag: '情绪识别·关注他人',
    skillTag2: '看懂心情',
    difficulty: 'easy',
    socialRule: '别人想分享时，给一点注意力，哪怕只是一眼或一句话。',
    parentTip: '当孩子在玩而身边有别人分享东西时，提醒他"用眼睛听"——不一定要放下玩具，但眼神要去给对方一个回应。',
  },
  {
    interest: '乐高',
    scene: '你在搭一个很复杂的大型乐高城堡，需要很多步骤。旁边的小刚说"给我一块乐高嘛，我也要搭！"你想继续搭城堡，但他一直在说。',
    question: '你会怎么做？',
    sceneIcon: '🏰',
    options: [
      { text: '递给他一块乐高，说"你先搭个底座，我教你"', icon: '🤝', isRecommended: true, feedback: '你愿意从自己手头上分出一块给别人，这就是大方！小刚会很高兴参与进来，你们说不定还能一起搭更大的东西。这就叫"邀请别人一起玩"。' },
      { text: '把乐高捂紧，说"不行，这是我搭城堡用的"', icon: '🛡️', isRecommended: false, feedback: '你很想好好保护自己的材料和计划，这种专注是对的。不过直接说"不行"会让小刚很难受，他可能就不想跟你玩了。下次可以说"这是我要用到的，等下这部分搭完就分你一些"，先给对方一点希望。' },
      { text: '不说话，把头转过去不看他', icon: '😶', isRecommended: false, feedback: '你可能觉得被打扰有点烦，这种感觉我能理解。但完全不回应的话，对方会很困惑"他有没有听到我说话？"下次可以简单地说一句"等我一下"，对方就知道你听到了，只是现在还没忙完。' },
    ],
    skillTag: '轮流等待·分享资源',
    skillTag2: '轮流玩',
    difficulty: 'medium',
    socialRule: '有人想参与时，不要直接拒绝，先想想能不能分一点或等一下。',
    parentTip: '在家准备一些"公共材料"（比如积木、彩笔），故意让孩子练习"等别人用完"或"一起用"，这是非常真实的共享练习。',
  },
  {
    interest: '乐高',
    scene: '搭乐高时，你发现旁边同学的表情有点着急——他皱着眉，手里拿着乐高块但没动，嘴巴在动但没声音。',
    question: '你会怎么做？',
    sceneIcon: '😟',
    options: [
      { text: '轻声问他"你怎么了？需要帮忙吗？"', icon: '💬', isRecommended: true, feedback: '你注意到他皱眉头、没动，还主动过去问，这就是会读别人的"身体小信号"！他可能会告诉你他卡住了，你也刚好帮上他。这就叫"先发现，再问一问"。' },
      { text: '继续搭自己的，不去管他', icon: '😶', isRecommended: false, feedback: '你可能在想"我自己的事还没做完"，这完全可以理解。不过看一眼他的脸色，说不定他真的需要帮忙。下次可以多等 3 秒再决定要不要过去，就像慢动作一样观察一下他的脸。' },
      { text: '大声说"你干嘛皱着眉啊，好丑！"', icon: '😬', isRecommended: false, feedback: '你可能只是觉得他表情有点怪，想提醒一下，这个想法很单纯。但是说一个人"好丑"会让他真的受伤——他本来就已经够着急的了。下次可以把"好丑"换成"你好像在想事情"，语气就温柔很多。' },
    ],
    skillTag: '读懂身体语言·识别情绪',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '别人皱眉头、没说话，可能需要帮忙，先开口问一问。',
    parentTip: '出门时指一指路人的表情让孩子猜，"你觉得他是开心还是着急？"——练习读表情，是社交敏锐度的基础训练。',
  },

  // ===== 天文 =====
  {
    interest: '天文',
    scene: '科学课上，老师问大家"谁对天文感兴趣？"你高高举起了手。老师笑着说"那你来给大家讲讲你最喜欢的星球吧！"你有点紧张但也很开心。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🔭',
    options: [
      { text: '站起来，慢慢地讲你喜欢的那颗星球', icon: '🎤', isRecommended: true, feedback: '你愿意在大家面前分享自己喜欢的天文知识，这真的很勇敢！同学们都会认真地听你讲。这就是"把喜欢的事情说出来"。' },
      { text: '犹豫着举起手，又放下来', icon: '😟', isRecommended: false, feedback: '想举手但又有点害怕，这种感觉我完全懂。不过既然已经举起来了，放下去可能会有点可惜。下次可以试着先举起手，不确定的话可以先深吸一口气给自己加油。' },
      { text: '低着头不举手，等别人讲', icon: '🤫', isRecommended: false, feedback: '你可能觉得"我讲不好"或者"大家会不会觉得无聊"，这种担心很常见。不过每个喜欢天文的小朋友都可以分享，说不定你的故事正是别人想听的。下次可以试着在心里准备好一句话，慢慢来。' },
    ],
    skillTag: '开始聊天·主动分享',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '被点名分享时，慢慢说、看着大家，你的声音大家都想听。',
    parentTip: '在家可以让孩子对着镜子练习"介绍自己喜欢的东西"，让他习惯看着"别人"说话的感觉。',
  },
  {
    interest: '天文',
    scene: '课间时，你正在看一本关于宇宙的书，旁边的小强凑过来问"你在看什么呀？能给我讲讲吗？"他的眼神看起来很好奇。',
    question: '你会怎么做？',
    sceneIcon: '📚',
    options: [
      { text: '点点头，翻到一页说"你看，这是土星，它有一个很漂亮的光环"', icon: '👆', isRecommended: true, feedback: '你愿意和别人分享天文知识，还找到了一个好看的页面给他看，这真的很棒！小强会觉得你是天文小专家。这就叫"用共同话题交朋友"。' },
      { text: '说"这是宇宙的书，很复杂的，你听不懂"', icon: '😕', isRecommended: false, feedback: '你觉得内容太难怕别人听不懂，这种为别人着想的心意很好。不过这样说可能会让小强觉得你在"拒绝"他，他可能就不想再问你了。下次可以换个说法"这是关于宇宙的书，有一页特别有意思，你想看吗？"' },
      { text: '不说话，继续低头看书', icon: '🤫', isRecommended: false, feedback: '你可能正看到有意思的地方，不想被打断，这种感觉完全正常。不过完全不理人的话，小强可能会觉得"他是不是不喜欢我"。下次可以抬起头说一句"等我看完这一页"，他会理解的。' },
    ],
    skillTag: '开始聊天·分享兴趣',
    skillTag2: '看懂表情和动作',
    difficulty: 'medium',
    socialRule: '有人问你在做什么，可以停一下，翻到一页给他看。',
    parentTip: '当孩子沉浸在自己的书或玩具里时，可以轻轻提醒他"抬头看一眼"，练习在被打断时也能有一点点回应。',
  },
  {
    interest: '天文',
    scene: '你正在给同学讲火星和地球的区别，同学突然说"其实我觉得太阳系里最酷的是木星！"然后开始讲木星，你有点被打断的感觉。',
    question: '你会怎么做？',
    sceneIcon: '🌟',
    options: [
      { text: '等他说完，然后说"你说得对，木星确实很酷！其实火星也有一个特别的地方……"', icon: '🤝', isRecommended: true, feedback: '你愿意听别人分享，还把他的想法和你的接起来，这真的很厉害！这样的对话会越来越有意思，大家都愿意继续聊。这就叫"把话题接起来"。' },
      { text: '继续讲你的，不管他说什么', icon: '😤', isRecommended: false, feedback: '你正在讲重要的内容，不想被打断，这种想法我完全懂。不过如果一直不管别人说什么，对方可能会觉得"他根本不听我说话"。下次可以先说一句"嗯，木星很酷！"再继续讲你的，这样两边的话都能被听到。' },
      { text: '皱起眉头不说话，等他闭嘴', icon: '😶', isRecommended: false, feedback: '被打断可能会让你有点烦躁，这种感觉很正常。不过皱眉头不说话，对方可能不知道你在等他说完。下次可以试着说一句"你先说完，我再说"，让对方知道你只是还没轮到你。' },
    ],
    skillTag: '轮流说话·话题接龙',
    skillTag2: '轮流玩',
    difficulty: 'hard',
    socialRule: '别人说话时先听，然后把自己想说的接上去。',
    parentTip: '家庭对话时练习"接话游戏"：一个人说一句话，下一个人要先说"对，而且……"再接自己的内容，这是很好的轮流练习。',
  },

  // ===== 绘画 =====
  {
    interest: '绘画',
    scene: '美术课上，你画了一幅自己最喜欢的城堡，旁边的小美说"哇，你画得好漂亮！能教教我吗？"她看起来很想学。',
    question: '你会怎么做？',
    sceneIcon: '🎨',
    options: [
      { text: '点点头，说"好呀！你看，这里要先画一个三角形……"', icon: '👆', isRecommended: true, feedback: '你愿意教别人，这说明你不仅会画，还懂得怎么讲出来，这就更厉害了！小美会很开心，你们可能还会一起画出更好看的作品。这就叫"会做也会教"。' },
      { text: '说"画画这种事教不了的，你自己慢慢练吧"', icon: '😕', isRecommended: false, feedback: '你觉得画画是"感觉"的东西，很难用话说清楚，这个想法我懂。不过这样说可能会让小美觉得你在拒绝她。下次可以试着说"我可以示范一下，你看好了"，即使只是简单说几个步骤，她也会很感激的。' },
      { text: '低着头继续画，不理她', icon: '🤫', isRecommended: false, feedback: '你可能正画到最专注的时候，不想被打断，这种感觉完全正常。不过小美可能会觉得"她是不是不想教我"。下次可以先抬头说一句"等我画完这一块"，这样她会知道你在乎她说的话。' },
    ],
    skillTag: '开始聊天·分享技能',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '有人想向你学习时，试着说一两个小步骤。',
    parentTip: '平时让孩子当"小老师"，教你画他喜欢的东西，练习"说出来"比"做出来"更重要。',
  },
  {
    interest: '绘画',
    scene: '你画了一幅很漂亮的太空图，旁边的小刚说"这个飞船画得不对，飞船不是这样的！"他的语气听起来有点挑剔。',
    question: '你会怎么做？',
    sceneIcon: '🚀',
    options: [
      { text: '问问他"你觉得飞船应该是什么样的？能给我看看吗？"', icon: '👂', isRecommended: true, feedback: '你没有急着反驳，而是想知道他是怎么想的，这说明你会听别人说话！他可能会给你看他的想法，或者你们可以一起讨论哪种飞船更好看。这就叫"先问再答"。' },
      { text: '说"我画的是我想象中的飞船，它就是这样的！"', icon: '😊', isRecommended: false, feedback: '你觉得自己的想法很重要，这份坚持是好的！不过这样说可能让小刚觉得你在"反驳"他。下次可以加一句"你觉得怎么画会更好看？"把对话继续下去。' },
      { text: '不说话，把画收起来不想给他看了', icon: '😔', isRecommended: false, feedback: '被批评时会有点难过，这种感觉我懂。把画收起来是保护自己的方式，不过小刚可能只是想说他的想法，不是要否定你的画。下次可以试着问一句"你能给我看看你画的飞船吗？"把话题转成正向的讨论。' },
    ],
    skillTag: '处理变化·接受建议',
    skillTag2: '遇到不开心的时候',
    difficulty: 'medium',
    socialRule: '有人提出不同意见时，可以先问问他怎么想。',
    parentTip: '当孩子分享作品时，先说"我觉得这里很棒"，再问"你是怎么想到的"，这样即使有不同意见，孩子也更容易接受。',
  },
  {
    interest: '绘画',
    scene: '你正在画一幅森林的画，需要用到绿色和棕色的蜡笔。但这两支笔正好在小刚手里，他正在用它画自己的人物。',
    question: '你会怎么做？',
    sceneIcon: '🖍️',
    options: [
      { text: '说"小刚，我能用一下绿色彩笔吗？用完就还你"', icon: '💬', isRecommended: true, feedback: '你用礼貌的方式说出了自己的需要，这真的很棒！小刚会明白你是认真想借的，通常都会愿意轮流用。这就叫"有礼貌地说出需要"。' },
      { text: '等他自己用完，不出声', icon: '⏳', isRecommended: false, feedback: '你很有耐心，愿意等别人，这很好！不过如果等太久，你可能就画不完了。下次可以试着说"你用完可以给我用一下吗？"这样小刚知道你需要，也知道你愿意等。' },
      { text: '直接伸手去拿他手里的笔', icon: '✋', isRecommended: false, feedback: '你可能真的很着急想画画，这种心情我懂！不过直接去拿别人的东西，会让小刚吓一跳，他可能会生气。下次先说一句话，哪怕只是"借一下"，也比直接拿好得多。' },
    ],
    skillTag: '轮流等待·礼貌请求',
    skillTag2: '轮流玩',
    difficulty: 'hard',
    socialRule: '想借别人的东西，先说一声，等他答应再拿。',
    parentTip: '在家玩"借东西"的游戏，故意让孩子来问你借，强化"先说再拿"的习惯。',
  },

  // ===== 动物 =====
  {
    interest: '动物',
    scene: '在动物园里，你正在看大熊猫吃竹子。旁边的一位小朋友问"大熊猫为什么只吃竹子呀？"看起来他很想知道答案。',
    question: '你会怎么做？',
    sceneIcon: '🐼',
    options: [
      { text: '把你知道的大熊猫知识讲给他听', icon: '🎤', isRecommended: true, feedback: '你愿意和别人分享你知道的动物知识，这真的很棒！他一定会觉得你是"动物小专家"。你们可能还会一起看到更多有趣的动物。这就叫"用知识交朋友"。' },
      { text: '说"我也不知道，你可以去问那边的管理员叔叔"', icon: '👆', isRecommended: false, feedback: '你很诚实，不会的问题就说不知道，这很好！不过你其实可以和他一起去找管理员，这样你们两个都能学到知识，说不定还能成为朋友。下次可以试着说"我也不知道，我们一起去问问吧！"' },
      { text: '继续看大熊猫，不理他', icon: '🤫', isRecommended: false, feedback: '你可能正看入迷了，不想被打断，这种感觉我懂。不过这个小朋友看起来很想交动物朋友，你可以边看边说一句"大熊猫吃竹子好可爱呀"，这样你们就可以一起看了。' },
    ],
    skillTag: '开始聊天·分享知识',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '有人问问题时，可以说说你知道的，一起聊。',
    parentTip: '去动物园或看动物纪录片时，鼓励孩子"找一个人跟他讲你最喜欢的动物"，练习主动开口。',
  },
  {
    interest: '动物',
    scene: '你和同学在讨论谁最喜欢的动物最厉害。同学说"老虎才是最厉害的！"你说"大象才是最厉害的！"你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🐘',
    options: [
      { text: '说"你说得对，老虎也很厉害！其实大象有个很厉害的地方……"', icon: '🤝', isRecommended: true, feedback: '你先肯定了对方的想法，然后再说自己的，这真的很高级！这样讨论会变得很友好，大家都会觉得自己被听到了。这就叫"先夸再讲"。' },
      { text: '大声说"大象比老虎厉害一百倍！"', icon: '😤', isRecommended: false, feedback: '你很想让大家知道大象有多厉害，这份热情我完全懂！不过这样说会让同学觉得你在"吵架"，他可能就不想继续聊了。下次可以说"我觉得大象有一个地方特别厉害，你想听吗？"这样更有说服力。' },
      { text: '皱起眉头不说话，觉得他不懂', icon: '😶', isRecommended: false, feedback: '你觉得他说的不对，心里可能有点不服气，这种感觉我懂。不过皱眉头不说话，别人可能不知道你在想什么。下次可以试着说"我不同意，但我知道老虎也很厉害，你想听听大象的故事吗？"把对话继续下去。' },
    ],
    skillTag: '看懂心情·接受不同观点',
    skillTag2: '看懂心情',
    difficulty: 'medium',
    socialRule: '讨论时先说"你说得对"，再讲自己的想法。',
    parentTip: '家庭讨论时练习"先听再说"：轮流发言，轮到你时先复述对方说了什么，再说自己的观点。',
  },
  {
    interest: '动物',
    scene: '科学课上，老师让大家介绍自己最喜欢的动物。轮到你说了，但前面的同学说了很久，你已经等了一会儿了。',
    question: '你会怎么做？',
    sceneIcon: '🦁',
    options: [
      { text: '安静等待，可以在心里想等下要说什么', icon: '🧘', isRecommended: true, feedback: '你忍住着急安静地等，这非常不容易！而且你还在心里准备要说的话，这说明你很认真。老师和同学都会看到你的耐心，等下你说的时候大家也会更认真听。这就叫"耐心等轮次"。' },
      { text: '小声说"怎么这么久"', icon: '😣', isRecommended: false, feedback: '等得有点不耐烦了，对吗？这种感觉很正常。不过小声嘀咕可能会打扰到正在说话的同学，他可能会觉得你在催他。下次可以试试在心里数数，或者想象等下要说的动物长什么样子。' },
      { text: '直接站起来说"该我了吧"', icon: '✋', isRecommended: false, feedback: '你很想轮到自己，这种着急我能理解。不过直接打断会让正在说话的同学很难受，他可能还没说完。下次可以举手让老师知道你在等，老师会帮你提醒的，这样最公平。' },
    ],
    skillTag: '轮流等待·课堂发言',
    skillTag2: '轮流玩',
    difficulty: 'hard',
    socialRule: '课堂发言要等同学说完，轮到你再站起来。',
    parentTip: '在家练习"课堂发言"：用玩偶或家庭成员扮演同学，让孩子练习等待和轮流的规则。',
  },

  // ===== 机器人 =====
  {
    interest: '机器人',
    scene: '机器人课上，老师让两人一组合作完成一个编程任务。你的搭档小刚说"我来编程，你来搭机器人吧！"你想一起编程。',
    question: '你会怎么做？',
    sceneIcon: '🤖',
    options: [
      { text: '说"我们轮流编程吧，我先编一会儿，然后换你"', icon: '🤝', isRecommended: true, feedback: '你提出了一个让大家都满意的办法，这说明你会想办法解决问题！小刚应该会同意的。这就叫"想一个对大家都公平的办法"。' },
      { text: '说"不行，我要编程，你来搭"', icon: '😤', isRecommended: false, feedback: '你很想学编程，这很正常！不过直接说"不行"可能会让小刚不高兴，他可能会觉得你在命令他。下次可以试着说"我也很想学编程，我们可以轮流吗？"这样小刚会更容易接受。' },
      { text: '不说话，闷闷不乐地开始搭机器人', icon: '😔', isRecommended: false, feedback: '不能学编程可能会让你有点不开心，这种感觉我懂。不过闷闷不乐不说话，小刚可能不知道你不开心，也不知道为什么。下次可以试着说一句"其实我有点想学编程"，让他知道你的想法。' },
    ],
    skillTag: '轮流合作·表达需求',
    skillTag2: '轮流玩',
    difficulty: 'easy',
    socialRule: '合作时有想法要说出来，想轮流就提出轮流。',
    parentTip: '团队活动前和孩子约定"轮流规则"，让他练习在任务中主动说出自己的需要。',
  },
  {
    interest: '机器人',
    scene: '你正在给同学展示你设计的机器人，同学突然说"我觉得你这个机器人设计得不太对，它应该有两个手臂而不是一个！"他的语气听起来像是在批评你。',
    question: '你会怎么做？',
    sceneIcon: '🔧',
    options: [
      { text: '问他"你觉得两个手臂可以做什么？这个手臂有什么特别的？"', icon: '👂', isRecommended: true, feedback: '你没有急着反驳，而是想知道他的想法，这说明你会听别人说话！他可能会说出一些你没想过的好主意。这就叫"先问再答"。' },
      { text: '说"我设计的机器人就是这样的，我觉得一个手臂就够了"', icon: '😊', isRecommended: false, feedback: '你坚持自己的想法，这是好的！不过这样说可能会让同学觉得你在"拒绝"他的想法。下次可以加一句"你觉得两个手臂可以做什么？"把对话变成好玩的讨论。' },
      { text: '不说话，把机器人收起来不想给他看了', icon: '😔', isRecommended: false, feedback: '被批评时会有点难过，这种感觉我懂。不过把机器人收起来，同学可能不知道你为什么生气了。下次可以试着问一句"你能给我看看你觉得应该怎么设计吗？"这样你们可以一起想办法。' },
    ],
    skillTag: '处理变化·接受建议',
    skillTag2: '遇到不开心的时候',
    difficulty: 'medium',
    socialRule: '有人提建议时，先问问他怎么想。',
    parentTip: '当孩子分享作品时，先说"我觉得这里很棒"，再问"你是怎么想到的"，这样即使有不同意见，孩子也更容易接受。',
  },
  {
    interest: '机器人',
    scene: '你的机器人比赛作品第一次运行失败了，旁边的小美说"没关系，我第一次也失败了，后来我检查了一下代码就好了！"她的表情看起来很友善。',
    question: '你会怎么做？',
    sceneIcon: '💡',
    options: [
      { text: '说"谢谢！能教我怎么检查代码吗？"', icon: '😊', isRecommended: true, feedback: '你愿意接受别人的帮助，还主动问她怎么做的，这真的很棒！小美会很开心帮到你，你们可能还会成为很好的朋友。这就叫"接受帮助也要说谢谢"。' },
      { text: '说"不用了，我自己会弄"', icon: '😤', isRecommended: false, feedback: '你想自己解决问题，这很独立！不过小美已经主动来帮你了，拒绝她可能会让她觉得"他不需要我"。下次可以试着说"谢谢你想帮我，不过我想先自己试试看"，这样既保持独立，也尊重了她的好意。' },
      { text: '低着头不说话，继续看失败的机器人', icon: '🤫', isRecommended: false, feedback: '失败可能会有点沮丧，这种感觉我懂。不过低着头不说话，小美可能不知道你在想什么，也不知道她可以帮到你。下次可以试着说一句"谢谢你"，或者"我正在想哪里出了问题"。' },
    ],
    skillTag: '看懂心情·接受帮助',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '有人来帮忙时，说一句谢谢，这会让别人很开心。',
    parentTip: '当孩子遇到困难时，练习让他先说"谢谢你来找我"，然后再说自己的想法。',
  },

  // ===== 汽车 =====
  {
    interest: '汽车',
    scene: '你正在给大家讲你最喜欢的汽车，旁边的小刚说"我最喜欢的汽车是卡车！"然后开始讲卡车，你想继续讲你的汽车。',
    question: '你会怎么做？',
    sceneIcon: '🚗',
    options: [
      { text: '等他说完，然后说"卡车也很酷！不过我最喜欢的汽车有一个特别的地方……"', icon: '🤝', isRecommended: true, feedback: '你愿意等别人说完再讲自己的，这真的很高级！小刚会觉得自己被听到了，然后他也会愿意听你讲。这就叫"你说一句我说一句"。' },
      { text: '大声说"我先说的，让我讲完！"', icon: '😤', isRecommended: false, feedback: '你很想让大家听到你喜欢的汽车，这种想分享的心情我完全懂。但大声喊会让小刚很不舒服，他可能会生气然后不想听你说了。下次可以先说一句"你说的卡车很有意思！"然后说"我也想说说我的汽车"。' },
      { text: '低下头不说了', icon: '😔', isRecommended: false, feedback: '被打断时可能会有点委屈，这种感觉我懂。不过不说一句话就低下头，别人可能不知道你也想讲。下次可以等他说一两句，然后说"我也有一个关于汽车的事情想说"，这样你就有机会了。' },
    ],
    skillTag: '轮流说话·话题接龙',
    skillTag2: '轮流玩',
    difficulty: 'easy',
    socialRule: '别人说话时先听，然后把自己想说的接上去。',
    parentTip: '家庭对话时练习"接话游戏"：一个人说完，下一个人要先说"对"或"有意思"，再接自己的内容。',
  },
  {
    interest: '汽车',
    scene: '你和同学在玩汽车游戏，同学说"你的汽车应该走这条路！"你想走另一条路。你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🛣️',
    options: [
      { text: '说"要不我们轮流选路，一人走一次？"', icon: '🤝', isRecommended: true, feedback: '你想到了一个让大家都满意的办法，这说明你有很强的解决问题能力！同学应该会同意的。这就叫"想一个对大家都公平的办法"。' },
      { text: '说"不行，听我的，我的汽车我做主！"', icon: '😤', isRecommended: false, feedback: '你想按自己的想法玩，这很正常！不过直接说"听我的"可能会让同学不高兴，他可能会不想跟你玩了。下次可以试着说"我想走这条路是因为……"然后问他"你觉得呢？"' },
      { text: '不说话，闷闷不乐地跟着他走', icon: '😔', isRecommended: false, feedback: '不能按自己的想法玩可能会有点不开心，这种感觉我懂。不过闷闷不乐地跟着走，同学可能不知道你不开心。下次可以试着说一句"我想下次轮到我选，好吗？"' },
    ],
    skillTag: '轮流合作·公平游戏',
    skillTag2: '轮流玩',
    difficulty: 'medium',
    socialRule: '游戏时轮流做决定，不同意时可以提出轮流。',
    parentTip: '玩桌面游戏时严格执行"轮流"规则，让孩子在游戏中练习等待和轮流。',
  },
  {
    interest: '汽车',
    scene: '你正在看一本关于汽车的书，旁边的小美问"你在看什么呀？里面有消防车吗？"她的表情看起来很期待。',
    question: '你会怎么做？',
    sceneIcon: '🚒',
    options: [
      { text: '翻到一页说"你看，这里有消防车！它有一个很长很长的梯子"', icon: '👆', isRecommended: true, feedback: '你不仅回答了她的问题，还找到一页给她看，这真的很棒！小美会很开心。这就叫"分享你看的东西给别人"。' },
      { text: '说"这是关于赛车的书，里面没有消防车"', icon: '😕', isRecommended: false, feedback: '你很诚实，这是好的！不过这样说可能会让小美有点失望。下次可以加一句"不过我知道哪里有消防车的书，你想看吗？"这样你帮她找到了另一个资源。' },
      { text: '继续低头看书，不理她', icon: '🤫', isRecommended: false, feedback: '你可能正看到有意思的地方，不想被打断，这种感觉完全正常。不过完全不理会，小美可能会觉得"他不想跟我说话"。下次可以先说一句"等我看完了告诉你"，这样她会知道你在乎她说的话。' },
    ],
    skillTag: '开始聊天·分享发现',
    skillTag2: '看懂表情和动作',
    difficulty: 'hard',
    socialRule: '有人问你在做什么，可以翻到一页给他看。',
    parentTip: '当孩子沉浸在书或玩具里时，轻轻提醒他"抬头看一眼"，练习在被打断时也能有一点点回应。',
  },

  // ===== 音乐 =====
  {
    interest: '音乐',
    scene: '音乐课上，老师让大家介绍自己最喜欢的歌曲。你高高举起了手，老师笑着说"那你来给大家唱几句吧！"你有点紧张但也很开心。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🎵',
    options: [
      { text: '站起来，慢慢地唱几句你最喜欢的歌', icon: '🎤', isRecommended: true, feedback: '你愿意在大家面前唱几句自己喜欢的歌，这真的很勇敢！同学们都会认真地听你唱。这就是"把喜欢的事情分享给大家"。' },
      { text: '犹豫着举起手，又放下来', icon: '😟', isRecommended: false, feedback: '想举手但又有点害怕，这种感觉我完全懂。不过既然已经举起来了，放下去可能会有点可惜。下次可以试着先深吸一口气，在心里先想好要唱什么，然后再举。' },
      { text: '低着头不举手，等别人唱', icon: '🤫', isRecommended: false, feedback: '你可能觉得"我唱得不好"或者"大家会不会觉得无聊"，这种担心很常见。不过唱自己喜欢的歌不需要唱得好不好，重要的是你愿意分享。下次可以试着在心里准备好一句歌词，不一定要唱完整首歌。' },
    ],
    skillTag: '开始聊天·勇敢表现',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '被点名表演时，慢慢来，你的声音大家都想听。',
    parentTip: '在家可以让孩子对着家人练习"唱一首歌"，从一句开始，慢慢增加到几句。',
  },
  {
    interest: '音乐',
    scene: '你正在用钢琴弹一首曲子，旁边的小刚说"你弹得好棒！我也想学！你能教教我吗？"他的眼神看起来很认真。',
    question: '你会怎么做？',
    sceneIcon: '🎹',
    options: [
      { text: '点点头，说"好呀！我教你弹一个简单的音"', icon: '👆', isRecommended: true, feedback: '你愿意教别人弹琴，这说明你弹得好还能讲出来，这就更厉害了！小刚会很开心。这就叫"会弹也会教"。' },
      { text: '说"钢琴很难的，你可能学不会"', icon: '😕', isRecommended: false, feedback: '你觉得钢琴需要练习很久才能学会，这个想法我懂。不过这样说可能会让小刚觉得你在"拒绝"他。下次可以试着说"钢琴有一个很简单的地方，你想试试吗？"这样他就有机会先试试看。' },
      { text: '低着头继续弹琴，不理他', icon: '🤫', isRecommended: false, feedback: '你可能正弹到最有感觉的地方，不想被打断，这种感觉完全正常。不过小刚可能会觉得"他不想教我"。下次可以先说一句"等我弹完这一段"，这样他会知道你只是还没忙完。' },
    ],
    skillTag: '开始聊天·分享技能',
    skillTag2: '看懂表情和动作',
    difficulty: 'medium',
    socialRule: '有人想向你学习时，试着说一两个小步骤。',
    parentTip: '让孩子当"小老师"，教你弹他喜欢的曲子，练习"说出来"比"做出来"更重要。',
  },
  {
    interest: '音乐',
    scene: '你和同学在讨论谁最喜欢的歌最好听。同学说"我觉得那首歌最好听！"你说"我觉得我喜欢的这首才是最好听的！"你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🎧',
    options: [
      { text: '说"你的歌也很好听！要不我唱几句我的歌，你听听看？"', icon: '🤝', isRecommended: true, feedback: '你先肯定了对方的想法，这真的很高级！然后你提议让对方听听你的歌，这样你们可以互相分享。这就叫"先夸再分享"。' },
      { text: '大声说"我的歌才是最棒的！"', icon: '😤', isRecommended: false, feedback: '你很想让大家知道你的歌有多好听，这份热情我完全懂！不过这样说可能会让同学觉得你在"吵架"，他可能就不想继续聊了。下次可以说"我真的很喜欢我的歌，你想听我唱几句吗？"这样更有礼貌。' },
      { text: '皱起眉头不说话', icon: '😶', isRecommended: false, feedback: '你有自己的想法但又不想说出来，这种感觉我懂。不过皱眉头不说话，别人可能不知道你在想什么。下次可以试着说一句"我也有我喜欢的歌，你想听吗？"把对话继续下去。' },
    ],
    skillTag: '看懂心情·接受不同喜好',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '讨论喜好时先说"你说得对"，再分享自己的想法。',
    parentTip: '家庭讨论音乐时练习"各有所爱"：先说"你觉得好听很正常"，再说"我觉得这首歌好在……"',
  },

  // ===== 游戏 =====
  {
    interest: '游戏',
    scene: '课间时，你正在和同学聊一个你很喜欢的电子游戏。旁边的小强问"你们在聊什么呀？能带上我吗？"他看起来很想加入。',
    question: '你会怎么做？',
    sceneIcon: '🎮',
    options: [
      { text: '点点头，说"我们在聊这个游戏，你也玩过吗？"', icon: '👋', isRecommended: true, feedback: '你愿意让小强加入，这说明你很大方！他可能会成为你们的新伙伴，或者他玩的游戏正好你们都可以一起玩。这就叫"让新朋友加入"。' },
      { text: '说"这是大人的游戏，小孩子不能玩"', icon: '😕', isRecommended: false, feedback: '你可能觉得这个游戏不适合小强，这个想法我懂。不过这样说可能会让小强觉得你在"拒绝"他，他可能会难过。下次可以试着说"我们玩的是一个有点难的游戏，你玩过类似的游戏吗？"这样你既没有拒绝他，也让他知道游戏的难度。' },
      { text: '继续和同学聊，假装没听到', icon: '🤫', isRecommended: false, feedback: '你可能正聊到有意思的地方，不想被打断，这种感觉完全正常。不过假装没听到，小强可能会觉得"他们不想带我玩"。下次可以先说一句"我们在聊游戏，等我一下"，这样他会知道你在乎他说的话。' },
    ],
    skillTag: '开始聊天·接纳他人',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '有人想加入时，可以问问他有没有类似的经验。',
    parentTip: '当孩子和朋友聊天时，有新朋友想加入，提前说好"让他说一句就能加入"的规则。',
  },
  {
    interest: '游戏',
    scene: '你和同学在玩游戏，同学说"我觉得应该这样玩！"但你想按另一种方式玩。你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🕹️',
    options: [
      { text: '说"我们试试你的方法玩一次，再试试我的方法，然后选一个最有趣的"', icon: '🤝', isRecommended: true, feedback: '你想到了一个让大家都满意的办法，这说明你有很强的解决问题能力！同学应该会同意的。这就叫"两个方法都试试看"。' },
      { text: '说"不行，按我的方法来！"', icon: '😤', isRecommended: false, feedback: '你想按自己的想法玩，这很正常！不过直接说"不行"可能会让同学不高兴，他可能会不想跟你玩了。下次可以试着说"我觉得我的方法有一个好处……"然后问他"你觉得呢？"' },
      { text: '不说话，闷闷不乐地按他的方法玩', icon: '😔', isRecommended: false, feedback: '不能按自己的想法玩可能会有点不开心，这种感觉我懂。不过闷闷不乐地玩，同学可能不知道你不开心，他可能会觉得你喜欢这样玩。下次可以试着说一句"我想下次轮到我选方法，好吗？"' },
    ],
    skillTag: '轮流合作·公平游戏',
    skillTag2: '轮流玩',
    difficulty: 'medium',
    socialRule: '游戏规则不同时，可以轮流试不同的方法。',
    parentTip: '玩桌面游戏时严格执行"轮流定规则"：每人一局可以提议改规则，然后大家投票。',
  },
  {
    interest: '游戏',
    scene: '你正在给大家讲一个游戏里的有趣故事，旁边的小美说"我不想听这个，太无聊了！"她的语气听起来有点不耐烦。',
    question: '你会怎么做？',
    sceneIcon: '📱',
    options: [
      { text: '问她"你觉得什么样的故事有意思？你想听什么？"', icon: '👂', isRecommended: true, feedback: '你没有生气，反而想知道她想听什么，这说明你会听别人说话！她可能会告诉你她喜欢什么样的故事，你们可以聊得更开心。这就叫"先问再继续"。' },
      { text: '皱起眉头说"明明很有趣的！你不懂！"', icon: '😤', isRecommended: false, feedback: '你的故事被说无聊可能会有点生气，这种感觉我懂！不过这样说会让小美更不想听你说话，她可能会觉得你不关心她的想法。下次可以试着问她"你觉得什么故事有意思？"把对话变成双向的。' },
      { text: '低下头不说了', icon: '😔', isRecommended: false, feedback: '被拒绝时可能会有点难过，这种感觉我懂。不过低着头不说话，小美可能不知道你为什么不说话了，她可能会觉得你在生她的气。下次可以试着说一句"好吧，那我们聊点别的？"把话题转一下。' },
    ],
    skillTag: '处理变化·话题转移',
    skillTag2: '遇到不开心的时候',
    difficulty: 'hard',
    socialRule: '别人不想听时，可以问问他想聊什么。',
    parentTip: '练习"换话题"：当对方表示不感兴趣时，练习说"那你喜欢什么？"而不是生气或沉默。',
  },

  // ===== 风扇 =====
  {
    interest: '风扇',
    scene: '科学课上，老师让大家介绍自己感兴趣的东西。你举起手说"我最喜欢研究风扇！"老师说"那给我们讲讲风扇是怎么转的吧！"你有点紧张但也很开心。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🌀',
    options: [
      { text: '站起来，慢慢地讲风扇是怎么转的', icon: '🎤', isRecommended: true, feedback: '你愿意在大家面前讲你喜欢的东西，这真的很勇敢！同学们都会认真地听你讲。这就是"把喜欢的事情讲给大家听"。' },
      { text: '犹豫着举起手，又放下来', icon: '😟', isRecommended: false, feedback: '想举手但又有点害怕，这种感觉我完全懂。不过既然已经举起来了，放下去可能会有点可惜。下次可以试着先深吸一口气，在心里先想好要讲什么，然后再举。' },
      { text: '低着头不举手，等别人讲', icon: '🤫', isRecommended: false, feedback: '你可能觉得"我讲不好"或者"大家会不会觉得无聊"，这种担心很常见。不过讲自己喜欢的东西不需要讲得好不好，重要的是你愿意分享。下次可以试着在心里准备好一两个小知识点，不一定要讲很多。' },
    ],
    skillTag: '开始聊天·勇敢表现',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '被点名分享时，慢慢说，你懂的东西大家都想听。',
    parentTip: '在家可以让孩子对着镜子练习"介绍我最喜欢的东西"，从一句话开始。',
  },
  {
    interest: '风扇',
    scene: '你正在给同学展示你带来的小风扇，旁边的小刚问"这个风扇为什么吹出来的是凉风呀？"他看起来很好奇。',
    question: '你会怎么做？',
    sceneIcon: '💨',
    options: [
      { text: '说"因为风吹到皮肤上，带走了热量，所以感觉凉凉的！我可以演示给你看"', icon: '👆', isRecommended: true, feedback: '你不仅回答了他的问题，还愿意演示给他看，这真的很棒！小刚一定会学到新知识，你们可能还会成为朋友。这就叫"用知识交朋友"。' },
      { text: '说"这是科学，很复杂的，你不懂的"', icon: '😕', isRecommended: false, feedback: '你觉得风扇的工作原理很复杂，这个想法我懂。不过这样说可能会让小刚觉得你在"拒绝"他，他可能会难过。下次可以试着说"这个有点复杂，不过简单来说就是……"然后用一个简单的比喻解释一下。' },
      { text: '继续低头玩风扇，不理他', icon: '🤫', isRecommended: false, feedback: '你可能正玩风扇玩得开心，不想被打断，这种感觉完全正常。不过完全不理会，小刚可能会觉得"他不想跟我说话"。下次可以先说一句"等我看完了告诉你"，这样他会知道你只是还没忙完。' },
    ],
    skillTag: '开始聊天·分享知识',
    skillTag2: '看懂表情和动作',
    difficulty: 'medium',
    socialRule: '有人问问题时，可以试着用简单的话解释。',
    parentTip: '平时练习"用一句话解释"：当孩子讲一个复杂的知识时，问他"能用一句话跟弟弟妹妹说吗？"',
  },
  {
    interest: '风扇',
    scene: '你和同学在讨论谁带来的风扇更好。同学说"我的风扇风力更大！"你说"我的风扇更安静！"你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🌬️',
    options: [
      { text: '说"你的风扇风力大，我的好安静，我们可以把优点结合起来就好了！"', icon: '🤝', isRecommended: true, feedback: '你先肯定了对方的想法，然后把两个优点结合起来，这真的很高级！你们可以一起想想有没有办法同时做到又大风又安静。这就叫"把优点合在一起"。' },
      { text: '大声说"我的风扇才是最棒的！"', icon: '😤', isRecommended: false, feedback: '你很想让大家知道你的风扇有多好，这份热情我完全懂！不过这样说可能会让同学觉得你在"吵架"，他可能就不想继续聊了。下次可以说"我的风扇有一个特别的地方，你想听听吗？"这样更有礼貌。' },
      { text: '皱起眉头不说话', icon: '😶', isRecommended: false, feedback: '你有自己的想法但又不想说出来，这种感觉我懂。不过皱眉头不说话，同学可能不知道你在想什么。下次可以试着说一句"我也有我喜欢的风扇，你想看看吗？"把对话继续下去。' },
    ],
    skillTag: '看懂心情·接受不同观点',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '讨论时先说"你说得对"，再讲自己的想法。',
    parentTip: '家庭讨论时练习"各有所长"：先说"你觉得你的好我觉得我的好"，再说"其实我们可以互相学习"。',
  },

  // ===== 篮球 =====
  {
    interest: '篮球',
    scene: '体育课上，老师让大家介绍自己喜欢的运动。你举起手说"我喜欢打篮球！"老师说"那你来给大家讲讲打篮球有什么好处吧！"你有点紧张但也很开心。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🏀',
    options: [
      { text: '站起来，慢慢地讲打篮球有什么好处', icon: '🎤', isRecommended: true, feedback: '你愿意在大家面前讲自己喜欢的运动，这真的很勇敢！同学们都会认真地听你讲。这就是"把喜欢的事情讲给大家听"。' },
      { text: '犹豫着举起手，又放下来', icon: '😟', isRecommended: false, feedback: '想举手但又有点害怕，这种感觉我完全懂。不过既然已经举起来了，放下去可能会有点可惜。下次可以试着先深吸一口气，在心里先想好要讲什么，然后再举。' },
      { text: '低着头不举手，等别人讲', icon: '🤫', isRecommended: false, feedback: '你可能觉得"我讲不好"或者"大家会不会觉得无聊"，这种担心很常见。不过讲自己喜欢的运动不需要讲得好不好，重要的是你愿意分享。下次可以试着在心里准备好一两个要点，不一定要讲很多。' },
    ],
    skillTag: '开始聊天·勇敢表现',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '被点名分享时，慢慢说，你喜欢的事情大家都想听。',
    parentTip: '在家可以让孩子对着家人练习"介绍我最喜欢的运动"，从一两个要点开始。',
  },
  {
    interest: '篮球',
    scene: '你和同学在打球，同学传球给你，但你没接住，球掉了。同学说"你怎么没接住啊！"他的语气听起来有点着急。',
    question: '你会怎么做？',
    sceneIcon: '🤾',
    options: [
      { text: '说"对不起，我再努力一点！你再传给我试试"', icon: '🙇', isRecommended: true, feedback: '你马上说了对不起，还表示会再努力，这真的很有礼貌！同学会知道你在认真对待，他应该会再给你传球的机会。这就叫"道歉并表示会改进"。' },
      { text: '说"球太快了，不是我的问题"', icon: '😤', isRecommended: false, feedback: '你可能觉得不是自己的错，这种想法我懂。不过这样说可能会让同学更着急，他可能会觉得你在"找借口"。下次可以先说"对不起，我再试试"，然后集中注意力接下一个球。' },
      { text: '低着头不说话，有点不好意思', icon: '😶', isRecommended: false, feedback: '没接住球可能会有点不好意思，这种感觉我懂。不过低着头不说话，同学可能不知道你在想什么，他可能会以为你不在意。下次可以先说"对不起，我再试试"，然后集中注意力。' },
    ],
    skillTag: '处理变化·接受失误',
    skillTag2: '遇到不开心的时候',
    difficulty: 'medium',
    socialRule: '没做好时先说对不起，再说"我再试试"。',
    parentTip: '运动时练习"失误后说对不起"：不是要责怪自己，而是让队友知道你理解他的感受。',
  },
  {
    interest: '篮球',
    scene: '比赛时，你想去投篮，但队友说"把球传给我！"你想自己投篮。',
    question: '你会怎么做？',
    sceneIcon: '⛹️',
    options: [
      { text: '说"你准备好了我就传给你！"然后传球', icon: '🤝', isRecommended: true, feedback: '你愿意把球传给队友，这说明你知道团队合作很重要！队友会很开心你们配合好了。这就叫"团队配合"。' },
      { text: '说"不行，我要投篮！"然后自己投了', icon: '😤', isRecommended: false, feedback: '你想投篮的心情我完全懂！不过如果队友准备好了，把球传给他会让团队配合得更好，他可能会投进。下次可以先问"你准备好了吗？"如果他说好了，就把球传给他。' },
      { text: '不说话，犹豫着不知道该传给谁', icon: '🤔', isRecommended: false, feedback: '犹豫时队友可能会有点着急，不知道你要做什么。下次可以先说一句"我看到了，你准备好了我就传！"，让队友知道你注意到他了。' },
    ],
    skillTag: '轮流合作·团队配合',
    skillTag2: '轮流玩',
    difficulty: 'hard',
    socialRule: '团队运动时，互相配合，一起努力。',
    parentTip: '玩团队游戏时练习"问好了再行动"：传球前先问"你准备好了吗？"或说"我看到了你"。',
  },

  // ===== 海洋 =====
  {
    interest: '海洋',
    scene: '科学课上，老师让大家介绍自己喜欢的东西。你举起手说"我喜欢海洋！"老师说"那给我们讲讲海洋里有什么有趣的东西吧！"你有点紧张但也很开心。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🌊',
    options: [
      { text: '站起来，慢慢地讲海洋里有什么有趣的东西', icon: '🎤', isRecommended: true, feedback: '你愿意在大家面前讲自己喜欢的海洋，这真的很勇敢！同学们都会认真地听你讲。这就是"把喜欢的事情讲给大家听"。' },
      { text: '犹豫着举起手，又放下来', icon: '😟', isRecommended: false, feedback: '想举手但又有点害怕，这种感觉我完全懂。不过既然已经举起来了，放下去可能会有点可惜。下次可以试着先深吸一口气，在心里先想好要讲什么，然后再举。' },
      { text: '低着头不举手，等别人讲', icon: '🤫', isRecommended: false, feedback: '你可能觉得"我讲不好"或者"大家会不会觉得无聊"，这种担心很常见。不过讲自己喜欢的海洋不需要讲得好不好，重要的是你愿意分享。下次可以试着在心里准备好一两个海洋知识，不一定要讲很多。' },
    ],
    skillTag: '开始聊天·勇敢表现',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '被点名分享时，慢慢说，你懂的东西大家都想听。',
    parentTip: '在家可以让孩子对着家人练习"介绍我最喜欢的海洋知识"，从一句话开始。',
  },
  {
    interest: '海洋',
    scene: '你正在给大家讲海洋里的鲸鱼，旁边的小美问"鲸鱼是鱼吗？"她看起来很好奇。',
    question: '你会怎么做？',
    sceneIcon: '🐋',
    options: [
      { text: '说"不是的，鲸鱼是哺乳动物！它是用肺呼吸的，跟鱼不一样"', icon: '👆', isRecommended: true, feedback: '你用简单的语言解释了鲸鱼不是鱼，这真的很棒！小美一定会学到新知识。这就叫"用简单的知识交朋友"。' },
      { text: '说"这太复杂了，你不懂的"', icon: '😕', isRecommended: false, feedback: '你觉得这个知识有点复杂，这个想法我懂。不过这样说可能会让小美觉得你在"拒绝"她。下次可以试着说"这个有点复杂，简单来说就是……"然后用一个简单的比喻解释一下。' },
      { text: '继续低头讲，不理她', icon: '🤫', isRecommended: false, feedback: '你可能正讲得开心，不想被打断，这种感觉完全正常。不过小美可能会觉得"他不想回答我的问题"。下次可以先说一句"等一下我讲完这个就回答你"，这样她会知道你听到了她的问题。' },
    ],
    skillTag: '开始聊天·分享知识',
    skillTag2: '看懂表情和动作',
    difficulty: 'medium',
    socialRule: '有人问问题时，可以试着用简单的话回答。',
    parentTip: '平时练习"用一句话解释"：当孩子讲一个复杂的知识时，问他"能用一句话跟小朋友说吗？"',
  },
  {
    interest: '海洋',
    scene: '你和同学在讨论海洋生物。同学说"鲨鱼是最可怕的！"你说"海豚才最可爱！"你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🐬',
    options: [
      { text: '说"你说得对，鲨鱼确实很特别！不过海豚也很可爱，你知道为什么吗？"', icon: '🤝', isRecommended: true, feedback: '你先肯定了对方的想法，这真的很高级！然后你又分享了自己喜欢海豚的原因，这样讨论会变得很友好。这就叫"先夸再分享"。' },
      { text: '大声说"海豚才是最棒的！"', icon: '😤', isRecommended: false, feedback: '你很想让大家知道你有多喜欢海豚，这份热情我完全懂！不过这样说可能会让同学觉得你在"吵架"，他可能就不想继续聊了。下次可以说"我真的很喜欢海豚，你想听我讲讲吗？"这样更有礼貌。' },
      { text: '皱起眉头不说话', icon: '😶', isRecommended: false, feedback: '你有自己的想法但又不想说出来，这种感觉我懂。不过皱眉头不说话，同学可能不知道你在想什么。下次可以试着说一句"我也有我喜欢的动物，你想听听吗？"把对话继续下去。' },
    ],
    skillTag: '看懂心情·接受不同喜好',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '讨论时先说"你说得对"，再讲自己的想法。',
    parentTip: '家庭讨论时练习"各有所爱"：先说"你觉得这个好我觉得那个好"，然后互相讲讲为什么。',
  },

  // ===== 太空 =====
  {
    interest: '太空',
    scene: '天文课上，老师让大家介绍自己感兴趣的东西。你举起手说"我喜欢太空！"老师说"那给我们讲讲太空里有什么吧！"你有点紧张但也很开心。',
    question: '面对这种情况，你会怎么做？',
    sceneIcon: '🚀',
    options: [
      { text: '站起来，慢慢地讲太空里有什么有趣的东西', icon: '🎤', isRecommended: true, feedback: '你愿意在大家面前讲自己喜欢的太空，这真的很勇敢！同学们都会认真地听你讲。这就是"把喜欢的事情讲给大家听"。' },
      { text: '犹豫着举起手，又放下来', icon: '😟', isRecommended: false, feedback: '想举手但又有点害怕，这种感觉我完全懂。不过既然已经举起来了，放下去可能会有点可惜。下次可以试着先深吸一口气，在心里先想好要讲什么，然后再举。' },
      { text: '低着头不举手，等别人讲', icon: '🤫', isRecommended: false, feedback: '你可能觉得"我讲不好"或者"大家会不会觉得无聊"，这种担心很常见。不过讲自己喜欢的太空不需要讲得好不好，重要的是你愿意分享。下次可以试着在心里准备好一两个太空知识，不一定要讲很多。' },
    ],
    skillTag: '开始聊天·勇敢表现',
    skillTag2: '看懂表情和动作',
    difficulty: 'easy',
    socialRule: '被点名分享时，慢慢说，你懂的东西大家都想听。',
    parentTip: '在家可以让孩子对着家人练习"介绍我最喜欢的太空知识"，从一句话开始。',
  },
  {
    interest: '太空',
    scene: '你正在给大家讲火箭是怎么飞上太空的，旁边的小刚问"火箭为什么会飞那么高呀？"他看起来很好奇。',
    question: '你会怎么做？',
    sceneIcon: '🛸',
    options: [
      { text: '说"因为火箭下面有推进器，它喷出很多气体，气体往下推，火箭就往上飞了"', icon: '👆', isRecommended: true, feedback: '你用简单的语言解释了火箭飞行的原理，这真的很棒！小刚一定会学到新知识。这就叫"用简单的知识交朋友"。' },
      { text: '说"这太复杂了，你不懂的"', icon: '😕', isRecommended: false, feedback: '你觉得这个知识有点复杂，这个想法我懂。不过这样说可能会让小刚觉得你在"拒绝"他。下次可以试着说"这个有点复杂，简单来说就是……"然后用一个简单的比喻解释一下。' },
      { text: '继续低头讲，不理他', icon: '🤫', isRecommended: false, feedback: '你可能正讲得开心，不想被打断，这种感觉完全正常。不过小刚可能会觉得"他不想回答我的问题"。下次可以先说一句"等一下我讲完这个就回答你"，这样他会知道你听到了他的问题。' },
    ],
    skillTag: '开始聊天·分享知识',
    skillTag2: '看懂表情和动作',
    difficulty: 'medium',
    socialRule: '有人问问题时，可以试着用简单的话回答。',
    parentTip: '平时练习"用一句话解释"：当孩子讲一个复杂的知识时，问他"能用一句话跟小朋友说吗？"',
  },
  {
    interest: '太空',
    scene: '你和同学在讨论太阳系。同学说"火星上可以住人！"你说"不行，火星太冷了，住不了人！"你们都有点激动。',
    question: '你会怎么做？',
    sceneIcon: '🌍',
    options: [
      { text: '说"你说得对，火星确实很特别！不过要住人的话，还需要解决一些问题……"', icon: '🤝', isRecommended: true, feedback: '你先肯定了对方的想法，这真的很高级！然后你分享了更多关于火星的知识，这样讨论会变得很有意思。这就叫"先夸再分享"。' },
      { text: '大声说"你错了！火星根本住不了人！"', icon: '😤', isRecommended: false, feedback: '你想让大家知道正确的知识，这份热情我完全懂！不过这样说可能会让同学觉得你在"吵架"，他可能就不想继续聊了。下次可以说"这个很有趣，你知道为什么吗？"然后解释你的想法。' },
      { text: '皱起眉头不说话', icon: '😶', isRecommended: false, feedback: '你有自己的想法但又不想说出来，这种感觉我懂。不过皱眉头不说话，同学可能不知道你在想什么。下次可以试着说一句"这个很有趣，你想听我讲讲吗？"把对话继续下去。' },
    ],
    skillTag: '看懂心情·接受不同观点',
    skillTag2: '看懂心情',
    difficulty: 'hard',
    socialRule: '讨论时先说"你说得对"，再讲自己的想法。',
    parentTip: '家庭讨论时练习"先听再说"：先说"你讲得有道理"，然后说"我也想补充一下"。',
  },
];

// ============================================================
// 兴趣关键词映射（支持多关键词匹配）
// ============================================================
const INTEREST_KEYWORDS: Record<string, string[]> = {
  '地铁': ['地铁', '火车', '铁轨', '站台', '列车'],
  '恐龙': ['恐龙', '霸王龙', '腕龙', '三角龙', '化石', '侏罗纪'],
  '乐高': ['乐高', '积木', '拼搭', '拼装', 'lego'],
  '天文': ['天文', '星星', '行星', '宇宙', '银河'],
  '绘画': ['绘画', '画画', '画画', '美术', '涂鸦'],
  '动物': ['动物', '小猫', '小狗', '宠物', '动物园'],
  '机器人': ['机器人', '编程', '机械', '代码'],
  '汽车': ['汽车', '卡车', '赛车', '车', '交通'],
  '音乐': ['音乐', '唱歌', '乐器', '钢琴', '吉他'],
  '游戏': ['游戏', '电子游戏', '玩', '打游戏'],
  '风扇': ['风扇', '电风扇', '空调', '风力'],
  '篮球': ['篮球', '打球', '投篮', '运动'],
  '海洋': ['海洋', '海', '鲸鱼', '海豚', '沙滩'],
  '太空': ['太空', '火箭', '飞船', '航天'],
};

// 获取兴趣的映射关键词
function getInterestKeywords(interest: string): string[] {
  const normalized = interest.trim().toLowerCase();
  for (const [key, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return [key, ...keywords.filter(k => normalized.includes(k.toLowerCase()))];
      }
    }
  }
  return [interest.trim()];
}

// ============================================================
// 获取匹配的预置情景（支持 scenarios.json 和 EXTENDED_SCENARIOS）
// 匹配优先级：
//   1. 精确匹配：interest + topic + difficulty（从 scenarios.json）
//   2. topic 匹配：interest + topic（从 scenarios.json）
//   3. difficulty 匹配：interest + difficulty（从 scenarios.json）
//   4. interest 匹配（从 scenarios.json）
//   5. 精确匹配（从 EXTENDED_SCENARIOS，含 topic 别名）
//   6. fallback（从 EXTENDED_SCENARIOS）
// ============================================================
function findMatchingScenarios(
  interest: string,
  topic: string,
  difficulty: string
): { scenarios: ExtendedScenario[]; usedInterest: string } | null {
  const keywords = getInterestKeywords(interest);
  const primaryInterest = keywords[0];

  // 优先从 scenarios.json 匹配（有 topic/difficulty 字段的题目）
  const jsonScenarios = getScenariosFromJson();
  const jsonByInterest = jsonScenarios.filter((s) => s.interest === primaryInterest);

  if (jsonByInterest.length > 0) {
    // 1. 精确匹配：interest + topic + difficulty
    const exactMatch = jsonByInterest.filter(
      (s) => isTopicMatch(s.skillTag2, topic) && s.difficulty === difficulty
    );

    // 2. topic 匹配：interest + topic
    const topicMatch = jsonByInterest.filter(
      (s) => isTopicMatch(s.skillTag2, topic) && s.difficulty !== difficulty
    );

    // 3. difficulty 匹配：interest + difficulty
    const diffMatch = jsonByInterest.filter(
      (s) => !isTopicMatch(s.skillTag2, topic) && s.difficulty === difficulty
    );

    // 4. 其他题（仅 interest 匹配）
    const others = jsonByInterest.filter(
      (s) => !isTopicMatch(s.skillTag2, topic) && s.difficulty !== difficulty
    );

    const combined = [...exactMatch, ...topicMatch, ...diffMatch, ...others];
    
    if (combined.length > 0) {
      return { scenarios: combined, usedInterest: primaryInterest };
    }
  }

  // fallback：从 EXTENDED_SCENARIOS 匹配（使用 topic 别名）
  const allByInterest = EXTENDED_SCENARIOS.filter((s) => s.interest === primaryInterest);

  if (allByInterest.length === 0) {
    return null;
  }

  // 1. 精确匹配：interest + topic + difficulty
  const exactMatch = allByInterest.filter(
    (s) => isTopicMatch(s.skillTag2, topic) && s.difficulty === difficulty
  );

  // 2. topic 匹配（含别名）
  const topicMatch = allByInterest.filter(
    (s) => isTopicMatch(s.skillTag2, topic) && s.difficulty !== difficulty
  );

  // 3. difficulty 匹配
  const diffMatch = allByInterest.filter(
    (s) => !isTopicMatch(s.skillTag2, topic) && s.difficulty === difficulty
  );

  // 4. 其他题
  const others = allByInterest.filter(
    (s) => !isTopicMatch(s.skillTag2, topic) && s.difficulty !== difficulty
  );

  const combined = [...exactMatch, ...topicMatch, ...diffMatch, ...others];

  return { scenarios: combined, usedInterest: primaryInterest };
}

// 从匹配列表中按索引轮选取一道题
function pickScenarioByIndex(
  scenarios: ExtendedScenario[],
  sceneIndex: number
): ExtendedScenario {
  if (scenarios.length === 0) {
    throw new Error('空列表无法取题');
  }
  const idx = ((sceneIndex % scenarios.length) + scenarios.length) % scenarios.length;
  return scenarios[idx];
}

// ============================================================
// 生成通用兜底情景（包含用户原始兴趣）
// ============================================================
function generateGenericFallback(interest: string, topic: string, difficulty: string): { scenario: ExtendedScenario; usedInterest: string } {
  const validTopics: SkillTag[] = ['看懂心情', '轮流玩', '看懂表情和动作', '遇到不开心的时候'];
  const skillTag = validTopics.includes(topic as SkillTag) ? (topic as SkillTag) : '看懂心情';
  const validDifficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const diff = validDifficulties.includes(difficulty as 'easy' | 'medium' | 'hard') ? (difficulty as 'easy' | 'medium' | 'hard') : 'medium';

  const fallbackScenario: ExtendedScenario = {
    interest: interest,
    scene: `你正在和同学聊天，讲起了自己最喜欢的${interest}。旁边的同学问："${interest}有什么好玩的呀？能给我讲讲吗？"他看起来很好奇。`,
    question: '你会怎么做？',
    sceneIcon: '💬',
    options: [
      {
        text: `点点头，说"${interest}真的很有趣！你知道吗……"然后给他讲讲你喜欢的地方`,
        icon: '😊',
        isRecommended: true,
        feedback: `你愿意和别人分享自己喜欢的${interest}，这真的很棒！同学一定会觉得你很有趣。这就叫"把喜欢的事情分享给别人"。`,
      },
      {
        text: `说"${interest}很复杂，你不懂的"然后继续自己做自己的事`,
        icon: '😕',
        isRecommended: false,
        feedback: `你觉得${interest}可能对别人来说太难了，这个想法我懂。不过这样说可能会让同学觉得你在"拒绝"他。下次可以试着说"这个有点复杂，不过简单来说就是……"然后用一个简单的比喻介绍一下。`,
      },
      {
        text: '低着头继续做自己的事，不理他',
        icon: '🤫',
        isRecommended: false,
        feedback: '你可能正忙着自己的事，不想被打断，这种感觉完全正常。不过完全不理会，同学可能会觉得"他不想跟我说话"。下次可以先说一句"等我一下"，这样他会知道你只是还没忙完。',
      },
    ],
    skillTag: `${skillTag}·分享兴趣`,
    skillTag2: skillTag,
    difficulty: diff,
    socialRule: '有人对你的兴趣感兴趣时，可以试着说一两句。',
    parentTip: `平时让孩子练习"介绍我喜欢的东西"：用一句话跟别人说说${interest}有什么好玩的。`,
  };

  return { scenario: fallbackScenario, usedInterest: interest };
}

// ============================================================
// 判断是否为演示模式
// ============================================================
function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === 'true') return true;
  const hasApiKey = !!process.env.ARK_API_KEY;
  return !hasApiKey;
}

// ============================================================
// 火山方舟 ARK API 客户端
// ============================================================
interface ArkOutput {
  type: string;
  role?: string;
  content?: Array<{ type: string; text?: string }>;
  status?: string;
  id?: string;
}

interface ArkResponse {
  output: ArkOutput[];
  status: string;
  id?: string;
  error?: { message: string } | string;
  usage?: { total_tokens: number };
}

async function callArk(interest: string, topic: string, difficulty: string): Promise<string> {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) throw new Error('请设置 ARK_API_KEY 环境变量');

  const model = process.env.ARK_MODEL || 'doubao-seed-2-0-mini-260428';
  const difficultyDesc = {
    easy: '简单（情景直接，社交线索明显，人物只做一个动作）',
    medium: '中等（情景稍复杂，人物有情绪变化，需要观察表情）',
    hard: '困难（情景复杂，人物多，需要读懂微妙的语气和表情）',
  }[difficulty] || '中等';

  const systemPrompt = `你是一位专门为孤独症谱系（阿斯伯格）儿童设计社交训练的特教老师，精通"社交故事（Social Stories）"方法。
你的任务是：为一个约7–8岁、痴迷于某个特定兴趣的孩子，生成一道社交情景练习题。

【输出格式】严格只输出 JSON。输出的 JSON 必须包含以下 6 个字段，一个都不能少，不能简化，不能更改字段名：

{
  "scene": "2-3句话，描述与孩子兴趣相关的具体情景，要有其他人物，有明确的社交线索。",
  "question": "这时候你会怎么做？",
  "sceneIcon": "一个贴合情景的 emoji，如 🚇 🦖 🧩 🚂 🌊 🚀",
  "options": [
    {"text": "选项A的文字描述","icon":"贴合该选项动作的小 emoji","isRecommended": true,"feedback": "温暖鼓励的反馈，2-3句口语"},
    {"text": "选项B的文字描述","icon":"贴合该选项动作的小 emoji","isRecommended": false,"feedback": "温暖鼓励的反馈"},
    {"text": "选项C的文字描述","icon":"贴合该选项动作的小 emoji","isRecommended": false,"feedback": "温暖鼓励的反馈"}
  ],
  "skillTag": "4-12个字标注练习的技能",
  "socialRule": "8-35个字的完整句子，以句号结尾。",
  "parentTip": "一句话，告诉家长在家怎么练这个技能。"
}

【严格格式要求】
- options 必须是对象数组，每个对象必须包含 text（字符串）、icon（emoji 字符串）、isRecommended（布尔值）、feedback（字符串）四个字段。
- 恰好有 1 个 isRecommended=true，其他 2 个为 false。
- icon 字段必须是单个 emoji，长度为 1 个字符。
- 不要把 options 写成字符串数组，必须是对象数组。
- 所有字段必须同时存在，不能只输出部分字段。
- socialRule 必须8-35个中文字符，且以中文句号"。"结尾。
- 只输出一个 JSON 对象，不要输出任何其他文字、注释、解释、markdown 代码块。

只输出 JSON。`;

  const userPrompt = `孩子的特殊兴趣：${interest}
训练主题：${topic}
难度：${difficultyDesc}

请严格按系统提示的格式与语言风格，生成一道高质量的社交情景练习题。
重点是：反馈必须温暖、具体、指向一个可操作的小动作。
只输出 JSON，不要任何额外内容。`;

  // 15 秒超时控制（ARK API 响应较慢）
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        store: false,
        max_output_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 不抛出具体错误信息，统一回落
      throw new Error(`API请求失败`);
    }

    const data: ArkResponse = await response.json();

    if (data.status === 'in_progress') throw new Error('模型生成中');
    if (data.error) {
      throw new Error('API返回错误');
    }

    const assistantMsg = data.output?.find(
      (o) => o.type === 'message' && o.role === 'assistant'
    );
    if (!assistantMsg || !assistantMsg.content) throw new Error('未找到响应内容');

    const textContent = assistantMsg.content
      .filter((c) => c.type === 'output_text' && c.text)
      .map((c) => c.text)
      .join('\n')
      .trim();

    if (!textContent) throw new Error('响应内容为空');
    return textContent;
  } catch (err) {
    clearTimeout(timeoutId);
    // 超时或任何网络错误，统一抛出简单错误
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw new Error('网络请求失败');
  }
}

// ============================================================
// 健壮 JSON 解析
// ============================================================
function extractJSON(raw: string): GeneratedScenario | null {
  try {
    const obj = JSON.parse(raw);
    if (validateScenario(obj)) return obj as GeneratedScenario;
  } catch { /* ignore */ }

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    try {
      const obj = JSON.parse(fencedMatch[1].trim());
      if (validateScenario(obj)) return obj as GeneratedScenario;
    } catch { /* ignore */ }
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = raw.substring(firstBrace, lastBrace + 1);
      const obj = JSON.parse(candidate);
      if (validateScenario(obj)) return obj as GeneratedScenario;
    } catch { /* ignore */ }
  }

  console.warn('JSON 解析失败，原始内容:', raw.slice(0, 200));
  return null;
}

// ============================================================
// 校验情景数据（统一标准：8-35 字，以。结尾）
// ============================================================
function validateScenario(data: any): boolean {
  if (!data) return false;
  if (typeof data.scene !== 'string' || !data.scene.trim()) return false;
  if (typeof data.question !== 'string' || !data.question.trim()) return false;
  if (!Array.isArray(data.options) || data.options.length !== 3) return false;
  let recommendedCount = 0;
  for (const opt of data.options) {
    if (typeof opt.text !== 'string' || !opt.text.trim()) return false;
    if (typeof opt.feedback !== 'string' || !opt.feedback.trim()) return false;
    if (typeof opt.isRecommended !== 'boolean') return false;
    if (opt.isRecommended) recommendedCount++;
  }
  if (recommendedCount !== 1) return false;
  if (typeof data.skillTag !== 'string' || !data.skillTag.trim()) return false;
  if (typeof data.parentTip !== 'string' || !data.parentTip.trim()) return false;
  // socialRule 校验：8-35 个中文字符，以句号结尾
  if (typeof data.socialRule !== 'string') return false;
  const trimmedRule = data.socialRule.trim();
  const ruleLen = Array.from(trimmedRule).length;
  if (ruleLen < 8 || ruleLen > 35) return false;
  if (!trimmedRule.endsWith('。')) return false;
  return true;
}

// ============================================================
// Route Handler
// ============================================================
export async function POST(request: Request) {
  try {
    const body: GenerationRequest = await request.json();
    const { interest, topic, difficulty } = body;
    const sceneIndex = typeof body.sceneIndex === 'number' ? body.sceneIndex : 0;

    if (!interest || !topic) {
      return NextResponse.json(
        { error: '缺少必要参数: interest 和 topic' },
        { status: 400 }
      );
    }

    // ===== 演示模式：使用本地题库（scenarios.json + EXTENDED_SCENARIOS）=====
    if (isDemoMode()) {
      // 尝试匹配
      const matchResult = findMatchingScenarios(interest, topic, difficulty || 'medium');
      if (matchResult) {
        const { scenarios, usedInterest } = matchResult;
        const scenario = pickScenarioByIndex(scenarios, sceneIndex);
        // 移除扩展字段后返回
        const { interest: _i, skillTag2: _st2, difficulty: _d, ...result } = scenario;
        // 判断数据来源
        const source = scenarios.some(s => s.interest === usedInterest && s.skillTag2 === topic) ? 'local' : 'pregen';
        return NextResponse.json({
          success: true,
          data: result,
          source,
          usedInterest,
          originalInterest: interest,
          topic,
          difficulty: difficulty || 'medium',
          totalScenarios: scenarios.length,
          sceneIndex: ((sceneIndex % scenarios.length) + scenarios.length) % scenarios.length,
        });
      }

      // 找不到匹配，生成通用兜底（包含用户原始兴趣）
      const fallback = generateGenericFallback(interest, topic, difficulty || 'medium');
      const { interest: _i, skillTag2: _st2, difficulty: _d, ...result } = fallback.scenario;
      return NextResponse.json({
        success: true,
        data: result,
        source: 'generic-fallback',
        usedInterest: fallback.usedInterest,
        originalInterest: interest,
        topic,
        difficulty: difficulty || 'medium',
        totalScenarios: 1,
        sceneIndex: 0,
      });
    }

    // ===== ARK API 模式 =====
    const maxAttempts = 2;
    let finalScenario: GeneratedScenario | null = null;
    let usedFallback = false;
    let usedInterest = interest;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const raw = await callArk(interest, topic, difficulty || 'medium');
        const parsed = extractJSON(raw);
        if (parsed) {
          finalScenario = parsed;
          usedInterest = interest;
          break;
        }
      } catch (err) {
        if (attempt === maxAttempts - 1) {
          console.warn('ARK API 最后一次调用失败，准备回落:', err);
        }
      }
    }

    // 两次调用+解析都失败，回落到预置数据
    if (!finalScenario) {
      console.warn('ARK 两次调用均失败或返回无效数据，已回落到预置情景');
      const matchResult = findMatchingScenarios(interest, topic, difficulty || 'medium');
      if (matchResult) {
        const { scenarios, usedInterest: ui } = matchResult;
        const scenario = pickScenarioByIndex(scenarios, sceneIndex);
        const { interest: _i, skillTag2: _st2, difficulty: _d, ...result } = scenario;
        return NextResponse.json({
          success: true,
          data: result,
          source: 'pregen',
          usedInterest: ui,
          originalInterest: interest,
          topic,
          difficulty: difficulty || 'medium',
          totalScenarios: scenarios.length,
          sceneIndex: ((sceneIndex % scenarios.length) + scenarios.length) % scenarios.length,
        });
      }

      // 生成通用兜底
      const fallback = generateGenericFallback(interest, topic, difficulty || 'medium');
      const { interest: _i, skillTag2: _st2, difficulty: _d, ...result } = fallback.scenario;
      return NextResponse.json({
        success: true,
        data: result,
        source: 'generic-fallback',
        usedInterest: fallback.usedInterest,
        originalInterest: interest,
        topic,
        difficulty: difficulty || 'medium',
        totalScenarios: 1,
        sceneIndex: 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: finalScenario,
      source: 'ark',
      usedInterest,
      originalInterest: interest,
      topic,
      difficulty: difficulty || 'medium',
    });
  } catch (error) {
    // 任何异常都至少返回一个情景，保证用户永远能看到内容
    console.error('API 处理错误:', error);
    try {
      const body = await request.json().catch(() => ({ interest: '地铁', topic: '看懂心情' }));
      const interest = body.interest || '地铁';
      const topic = body.topic || '看懂心情';
      const difficulty = body.difficulty || 'medium';
      const si = typeof body.sceneIndex === 'number' ? body.sceneIndex : 0;

      const matchResult = findMatchingScenarios(interest, topic, difficulty);
      if (matchResult) {
        const { scenarios, usedInterest } = matchResult;
        const scenario = pickScenarioByIndex(scenarios, si);
        const { interest: _i, skillTag2: _st2, difficulty: _d, ...result } = scenario;
        return NextResponse.json({
          success: true,
          data: result,
          source: 'pregen',
          usedInterest,
          originalInterest: interest,
          topic,
          difficulty,
          totalScenarios: scenarios.length,
          sceneIndex: ((si % scenarios.length) + scenarios.length) % scenarios.length,
        });
      }

      const fallback = generateGenericFallback(interest, topic, difficulty);
      const { interest: _i, skillTag2: _st2, difficulty: _d, ...result } = fallback.scenario;
      return NextResponse.json({
        success: true,
        data: result,
        source: 'generic-fallback',
        usedInterest: fallback.usedInterest,
        originalInterest: interest,
        topic,
        difficulty,
        totalScenarios: 1,
        sceneIndex: 0,
      });
    } catch {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '服务器内部错误' },
        { status: 500 }
      );
    }
  }
}

export const dynamic = 'force-dynamic';
