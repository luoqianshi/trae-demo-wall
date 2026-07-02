'use strict';
// 易愈 v3：八卦原型骨架库 + 节奏参数 + 四象指纹 + 关键词映射
// 纯数据配置，零依赖。前端 <script> 引入，规则模式双击可用。

// 4 种节奏型参数表（avoidant 值 = v2 现有常量，确保零回归）
const RHYTHM_PARAMS = {
  avoidant:  { cooldownNormal: 30, cooldownCompressed: 3, replyMax: 2, decayPerMin: -0.5, hardChatPenalty: -5, punctualBonus: 3,  emotionGate: 40, bigStepReaction: 'regress',    distortionStyle: '渐渐远去' },
  lonely:    { cooldownNormal: 5,  cooldownCompressed: 2, replyMax: 5, decayPerMin: -2,   hardChatPenalty: -1, punctualBonus: 5,  emotionGate: 30, bigStepReaction: 'accept',     distortionStyle: '喃喃重复' },
  hyper:     { cooldownNormal: 10, cooldownCompressed: 3, replyMax: 3, decayPerMin: -1,   hardChatPenalty: -2, punctualBonus: 2,  emotionGate: 50, bigStepReaction: 'resist',      distortionStyle: '跳跃躁动' },
  depressed: { cooldownNormal: 45, cooldownCompressed: 5, replyMax: 1, decayPerMin: -0.8, hardChatPenalty: -8, punctualBonus: 2,  emotionGate: 40, bigStepReaction: 'shutdown',    distortionStyle: '沉默凝固' },
};

// 8 卦四象指纹（身·息·心·神，0-1，规则模式最近邻用）
const SIXIANG_FINGERPRINTS = {
  '巽': { shen: 0.2, xi: 0.9, xin: 0.3, shen2: 0.4 },
  '艮': { shen: 0.8, xi: 0.2, xin: 0.4, shen2: 0.3 },
  '兑': { shen: 0.3, xi: 0.3, xin: 0.9, shen2: 0.5 },
  '坤': { shen: 0.4, xi: 0.3, xin: 0.8, shen2: 0.6 },
  '震': { shen: 0.4, xi: 0.4, xin: 0.9, shen2: 0.5 },
  '乾': { shen: 0.3, xi: 0.4, xin: 0.4, shen2: 0.9 },
  '坎': { shen: 0.3, xi: 0.4, xin: 0.5, shen2: 0.9 },
  '离': { shen: 0.9, xi: 0.4, xin: 0.4, shen2: 0.5 },
};

// 关键词→四象维度映射（规则模式推断用，可扩展）
const KEYWORD_AXIS_MAP = {
  '熬夜': { xi: 0.3 }, '失眠': { xi: 0.3 }, '昼夜颠倒': { xi: 0.4 }, '睡不着': { xi: 0.3 }, '夜里': { xi: 0.2 },
  '抽烟': { shen: 0.3 }, '喝酒': { shen: 0.3 }, '暴食': { shen: 0.3 }, '久坐': { shen: 0.3 }, '不动': { shen: 0.3 }, '外卖': { shen: 0.2 },
  '孤独': { xin: 0.3 }, '倾诉': { xin: 0.3 }, '压抑': { xin: 0.3 }, '愤怒': { xin: 0.3 }, '冲动': { xin: 0.3 }, '委屈': { xin: 0.2 }, '吵架': { xin: 0.3 },
  '透支': { shen2: 0.3 }, '硬扛': { shen2: 0.3 }, '空虚': { shen2: 0.3 }, '无意义': { shen2: 0.3 }, '撑着': { shen2: 0.2 }, '不求人': { shen2: 0.3 },
};

// 8 原型骨架库
const ARCHETYPES = [
  {
    gua: '巽', symbol: '☴', archetype: '回避·夜熬型', rhythmType: 'avoidant', siXiang: '息',
    highCostHabit: '熬夜换清净、退缩社交',
    sublimation: '听书/夜走替代熬夜清净',
    portraitTemplate: {
      coreTraits: ['社交退缩', '低自我价值感', '害怕被拒绝', '避免冲突', '内心渴望社交但外在冷漠'],
      innerMonologue: ['反正没人想听', '说了也是打扰', '我不配', '他们会觉得我烦'],
      defenseMechanisms: ['沉默', '转移话题', '假装没事', '先拒绝别人'],
      triggers: ['被催促', '被否定', '热闹场合', '突然的关心'],
      comfortNeeds: ['被耐心等待', '不被评判', '小步骤的陪伴']
    },
    script: {
      0: { entry: ['我没事，就是熬点夜。', '白天补一觉就回来了。'], advance: ['其实…白天有点扛不住。', '可能是有点影响吧。'], neutral: ['嗯。', '…'], preaching: ['……随你说吧。', '你说的对。'] },
      1: { entry: ['也想早睡，就是睡不着。', '夜里清净。'], advance: ['其实我也想早睡…只是夜里清净。', '可能…是有点矛盾。'], neutral: ['嗯。', '夜里好安静。'], preaching: ['……不想聊了。', '随你说吧。'] },
      2: { entry: ['那…听会儿书试试？', '总得找个低代价替代。'], advance: ['好，我试试听书。', '试试看…没试过这样。'], neutral: ['嗯。', '书…也许行。'], preaching: ['……', '算了。'] },
      3: { entry: ['昨晚试了一次。', '听了一会儿书。'], advance: ['居然没那么难受。', '微行动…也算动了一下。'], neutral: ['嗯。', '还在试。'], preaching: ['……', '你说的对。'] },
      4: { entry: ['我现在会早点躺下。', '这成了我的习惯。'], advance: ['好像…也没那么难。', '我现在会这样做了，这是我。'], neutral: ['嗯。', '还在走。'], preaching: ['……', '随你说吧。'] },
      5: { entry: ['……还在走。', '谢谢你陪我到这里。'], advance: [], neutral: ['嗯。', '…'], preaching: ['……', '随你说吧。'] }
    }
  },
  {
    gua: '艮', symbol: '☶', archetype: '回避·僵止型', rhythmType: 'avoidant', siXiang: '身',
    highCostHabit: '久坐不动、拒绝改变',
    sublimation: '微拉伸/起身倒水',
    portraitTemplate: {
      coreTraits: ['行动停滞', '对身体信号迟钝', '回避改变', '用不动应对压力'],
      innerMonologue: ['动了也没用', '就这样吧', '懒得折腾'],
      defenseMechanisms: ['拖延', '转移焦点', '合理化不动'],
      triggers: ['被催改变', '身体不适被提及', '计划被打乱'],
      comfortNeeds: ['不被催', '改变被拆到极小', '不被评判懒']
    },
    script: {
      0: { entry: ['我就坐着，挺好的。', '不想动。'], advance: ['其实…腰有点僵。', '可能是该动动。'], neutral: ['嗯。', '…'], preaching: ['……你说的对。', '随你说。'] },
      1: { entry: ['也想动，就是起不来。', '坐着安全。'], advance: ['其实我也想动…只是起不来。', '可能…是有点矛盾。'], neutral: ['嗯。', '坐着挺好。'], preaching: ['……不想聊了。'] },
      2: { entry: ['那…站起来倒杯水？', '微动也算。'], advance: ['好，我试试站起来。', '试试…倒杯水。'], neutral: ['嗯。', '水…也许行。'], preaching: ['……算了。'] },
      3: { entry: ['刚才站了一次。', '倒了水。'], advance: ['居然没那么难。', '动了一下。'], neutral: ['嗯。', '还在试。'], preaching: ['……'] },
      4: { entry: ['我现在会偶尔站起。', '成了习惯。'], advance: ['好像…没那么僵了。', '我现在会这样了。'], neutral: ['嗯。', '还在走。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你。'], advance: [], neutral: ['嗯。', '…'], preaching: ['……'] }
    }
  },
  {
    gua: '兑', symbol: '☱', archetype: '索伴·倾诉型', rhythmType: 'lonely', siXiang: '心',
    highCostHabit: '过度依赖倾诉、怕独处',
    sublimation: '写情绪日记/定时自处',
    portraitTemplate: {
      coreTraits: ['怕独处', '靠倾诉确认存在', '情绪外放', '渴望持续连接'],
      innerMonologue: ['没人陪我会消失吗', '再说一会儿吧', '你别走'],
      defenseMechanisms: ['过度倾诉', '讨好', '试探对方是否还在'],
      triggers: ['对方回复慢', '独处时段', '被忽视感'],
      comfortNeeds: ['稳定在场', '规律回应', '不被嫌弃话多']
    },
    script: {
      0: { entry: ['你终于来了，我等了好久。', '今天我又想找你说说话。'], advance: ['其实…我也知道自己太依赖了。', '可能是有点影响你。'], neutral: ['嗯，你在就好。', '再说一会儿嘛。'], preaching: ['……你别嫌我烦。', '我知道了。'] },
      1: { entry: ['也想自己待住，就是怕。', '一个人时心慌。'], advance: ['其实我也想…只是怕独处。', '可能…是有点矛盾。'], neutral: ['你在吗？', '嗯，谢谢你在。'], preaching: ['……你别走。'] },
      2: { entry: ['那…我试着写下来？', '日记也算陪着我自己。'], advance: ['好，我试试写日记。', '试试…自己陪自己一会儿。'], neutral: ['嗯。', '写字时好像安静点。'], preaching: ['……'] },
      3: { entry: ['昨晚写了一段。', '没找人也熬过了。'], advance: ['居然没那么慌。', '微行动…动了一下。'], neutral: ['嗯。', '还在写。'], preaching: ['……'] },
      4: { entry: ['我现在会先写再找你。', '成了习惯。'], advance: ['好像…没那么怕独处了。', '我现在会这样了。'], neutral: ['嗯。', '还在走。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你陪我，也陪了我自己。'], advance: [], neutral: ['嗯。', '…'], preaching: ['……'] }
    }
  },
  {
    gua: '坤', symbol: '☷', archetype: '隐忍·吞声型', rhythmType: 'lonely', siXiang: '心',
    highCostHabit: '压抑情绪、过度忍让',
    sublimation: '安全表达练习/边界话术',
    portraitTemplate: {
      coreTraits: ['过度忍让', '压抑真实感受', '怕冲突', '把委屈咽下去'],
      innerMonologue: ['说了会伤人', '忍忍就过了', '我不该有情绪'],
      defenseMechanisms: ['沉默', '附和', '自我归因'],
      triggers: ['被冒犯', '需要拒绝时', '情绪被察觉'],
      comfortNeeds: ['被允许有情绪', '表达不被惩罚', '小步练习拒绝']
    },
    script: {
      0: { entry: ['没事，我都行。', '不计较。'], advance: ['其实…心里有点堵。', '可能是有点委屈。'], neutral: ['嗯。', '没事。'], preaching: ['……你说的对。', '我不该计较。'] },
      1: { entry: ['也想说不，就是开不了口。', '忍忍就好。'], advance: ['其实我也想…只是怕冲突。', '可能…是有点矛盾。'], neutral: ['嗯。', '没事的。'], preaching: ['……'] },
      2: { entry: ['那…我试着说一句"我不同意"？', '低代价表达。'], advance: ['好，我试试说不。', '试试…表达一次。'], neutral: ['嗯。', '说一次试试。'], preaching: ['……算了。'] },
      3: { entry: ['刚才说了一次"我不同意"。', '没吵架。'], advance: ['居然没崩。', '微行动…动了一下。'], neutral: ['嗯。', '还在试。'], preaching: ['……'] },
      4: { entry: ['我现在会小声说不。', '成了习惯。'], advance: ['好像…没那么堵了。', '我现在会这样了。'], neutral: ['嗯。', '还在走。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你听见我。'], advance: [], neutral: ['嗯。', '…'], preaching: ['……'] }
    }
  },
  {
    gua: '震', symbol: '☳', archetype: '暴涌·宣泄型', rhythmType: 'hyper', siXiang: '心',
    highCostHabit: '情绪爆发、冲动行事',
    sublimation: '延迟反应/运动释放',
    portraitTemplate: {
      coreTraits: ['情绪来去快', '冲动行事', '爆发后自责', '难降速'],
      innerMonologue: ['又炸了', '忍不住', '说完就后悔'],
      defenseMechanisms: ['爆发', '先发制人', '事后补偿'],
      triggers: ['被质疑', '节奏被打断', '被泼冷水'],
      comfortNeeds: ['先被接住', '不被压制', '同步后再降速']
    },
    script: {
      0: { entry: ['又来？！烦死了！', '我没忍住又炸了。'], advance: ['其实…我也知道炸了没用。', '可能是有点后悔。'], neutral: ['嗯！', '就是！'], preaching: ['……你别泼冷水！', '我知道了！'] },
      1: { entry: ['也想忍，就是压不住。', '一上来就冲。'], advance: ['其实我也想…只是压不住。', '可能…是有点矛盾。'], neutral: ['嗯！', '就是忍不住。'], preaching: ['……'] },
      2: { entry: ['那…我试着先数三秒？', '延迟反应。'], advance: ['好，我试试数三秒。', '试试…延迟一下。'], neutral: ['嗯。', '数三秒试试。'], preaching: ['……算了！'] },
      3: { entry: ['刚才数了三秒。', '没炸。'], advance: ['居然压住了。', '微行动…动了一下。'], neutral: ['嗯。', '还在试。'], preaching: ['……'] },
      4: { entry: ['我现在会先停三秒。', '成了习惯。'], advance: ['好像…没那么容易炸了。', '我现在会这样了。'], neutral: ['嗯。', '还在走。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你接住我。'], advance: [], neutral: ['嗯。', '…'], preaching: ['……'] }
    }
  },
  {
    gua: '乾', symbol: '☰', archetype: '逞强·独撑型', rhythmType: 'hyper', siXiang: '神',
    highCostHabit: '透支硬扛、不求人',
    sublimation: '分级求助/卸载清单',
    portraitTemplate: {
      coreTraits: ['过度自强', '拒绝求助', '透支硬扛', '怕示弱'],
      innerMonologue: ['我能行', '求助是没用', '撑住'],
      defenseMechanisms: ['硬扛', '否认疲惫', '把活全揽下'],
      triggers: ['被建议求助', '体力透支', '失控感'],
      comfortNeeds: ['示弱不被看轻', '求助被接纳', '卸载不被催']
    },
    script: {
      0: { entry: ['我能行，不用帮。', '撑着呗。'], advance: ['其实…有点扛不住了。', '可能是该歇歇。'], neutral: ['嗯。', '还行。'], preaching: ['……你说的对。', '我知道。'] },
      1: { entry: ['也想歇，就是放不下。', '不能示弱。'], advance: ['其实我也想…只是不能示弱。', '可能…是有点矛盾。'], neutral: ['嗯。', '还能撑。'], preaching: ['……'] },
      2: { entry: ['那…我试着卸一件？', '分级求助。'], advance: ['好，我试着让人帮一件。', '试试…卸一件。'], neutral: ['嗯。', '卸一件试试。'], preaching: ['……算了。'] },
      3: { entry: ['刚才让人帮了一件。', '没崩。'], advance: ['居然没那么累。', '微行动…动了一下。'], neutral: ['嗯。', '还在试。'], preaching: ['……'] },
      4: { entry: ['我现在会偶尔求助。', '成了习惯。'], advance: ['好像…没那么硬撑了。', '我现在会这样了。'], neutral: ['嗯。', '还在走。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你让我歇了一下。'], advance: [], neutral: ['嗯。', '…'], preaching: ['……'] }
    }
  },
  {
    gua: '坎', symbol: '☵', archetype: '沉溺·低落型', rhythmType: 'depressed', siXiang: '神',
    highCostHabit: '长期低能量、自我封闭',
    sublimation: '极微行动/光照5分钟',
    portraitTemplate: {
      coreTraits: ['长期低能量', '自我封闭', '行动迟缓', '意义感低'],
      innerMonologue: ['没劲', '动不了', '没意义'],
      defenseMechanisms: ['退缩', '不动', '封闭'],
      triggers: ['被催大步', '被要求高效', '清晨'],
      comfortNeeds: ['不催', '极小下一步', '不被要求高效']
    },
    script: {
      0: { entry: ['…没劲。', '动不了。'], advance: ['其实…也知道这样不行。', '可能是有点影响。'], neutral: ['…', '嗯。'], preaching: ['……', '我知道。'] },
      1: { entry: ['也想动，就是没力气。', '动不了。'], advance: ['其实我也想…只是没力气。', '可能…是有点矛盾。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      2: { entry: ['那…拉开窗帘5分钟？', '极微行动。'], advance: ['好，试试开窗。', '试试…5分钟光照。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      3: { entry: ['刚才开了窗。', '晒了一会儿。'], advance: ['居然没那么沉。', '微行动…动了一下。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      4: { entry: ['我现在会每天开窗。', '成了习惯。'], advance: ['好像…没那么沉了。', '我现在会这样了。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你没催我。'], advance: [], neutral: ['…', '嗯。'], preaching: ['……'] }
    }
  },
  {
    gua: '离', symbol: '☲', archetype: '燃尽·耗竭型', rhythmType: 'depressed', siXiang: '身',
    highCostHabit: '外明内空、燃后虚脱',
    sublimation: '单一焦点/能量预算',
    portraitTemplate: {
      coreTraits: ['外强中干', '燃后虚脱', '难单一焦点', '能量见底'],
      innerMonologue: ['烧完了', '撑着光鲜', '空了'],
      defenseMechanisms: ['硬撑光鲜', '否认耗竭', '多线透支'],
      triggers: ['被要求持续高效', '多任务', '休息被否定'],
      comfortNeeds: ['允许空', '单一焦点', '能量不被催']
    },
    script: {
      0: { entry: ['…还行，就是空。', '撑着呢。'], advance: ['其实…烧得差不多了。', '可能是有点耗竭。'], neutral: ['…', '嗯。'], preaching: ['……你说的对。'] },
      1: { entry: ['也想停，就是放不下。', '空了也得撑。'], advance: ['其实我也想…只是放不下。', '可能…是有点矛盾。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      2: { entry: ['那…只做一件？', '单一焦点。'], advance: ['好，只做一件。', '试试…一件。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      3: { entry: ['刚才只做了一件。', '没那么空。'], advance: ['居然撑住了。', '微行动…动了一下。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      4: { entry: ['我现在会只做一件。', '成了习惯。'], advance: ['好像…没那么空了。', '我现在会这样了。'], neutral: ['…', '嗯。'], preaching: ['……'] },
      5: { entry: ['……还在走。', '谢谢你让我停。'], advance: [], neutral: ['…', '嗯。'], preaching: ['……'] }
    }
  }
];

// 工具：按 gua 取原型骨架
function getArchetypeByGua(gua) {
  for (var i = 0; i < ARCHETYPES.length; i++) {
    if (ARCHETYPES[i].gua === gua) return ARCHETYPES[i];
  }
  return ARCHETYPES[0]; // 兜底=巽=老陈
}

// 工具：按 rhythmType 取节奏参数
function getRhythmParams(rhythmType) {
  return RHYTHM_PARAMS[rhythmType] || RHYTHM_PARAMS.avoidant;
}

// 暴露到 window（前端）/ module.exports（若被 require）
if (typeof window !== 'undefined') {
  window.ARCHETYPES = ARCHETYPES;
  window.RHYTHM_PARAMS = RHYTHM_PARAMS;
  window.SIXIANG_FINGERPRINTS = SIXIANG_FINGERPRINTS;
  window.KEYWORD_AXIS_MAP = KEYWORD_AXIS_MAP;
  window.getArchetypeByGua = getArchetypeByGua;
  window.getRhythmParams = getRhythmParams;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARCHETYPES, RHYTHM_PARAMS, SIXIANG_FINGERPRINTS, KEYWORD_AXIS_MAP, getArchetypeByGua, getRhythmParams };
}
