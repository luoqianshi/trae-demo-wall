/**
 * 本地兜底模板
 * 当 AI 服务不可用时，提供基于场景的本地模板，确保核心功能可用
 */

const FALLBACK_TEMPLATES = {
  'progress': {
    'gentle': '{studentName}家长您好！很高兴和您分享一个好消息，最近{studentName}在学习上付出了很多努力，也取得了明显的进步。这离不开孩子自身的坚持，也感谢您的悉心陪伴。希望我们能继续保持这份势头，一起为孩子的成长加油！',
    'professional': '{studentName}家长您好，{studentName}近期成绩较上次有所提升，反映出孩子在该阶段的学习态度较为端正。建议继续保持当前的学习节奏，同时关注薄弱环节的巩固，争取稳步提升。',
    'constructive': '{studentName}家长您好！{studentName}近期进步明显，建议在家继续保持良好的学习习惯。针对{description}方面，可以适当增加练习量，每天固定时间复习巩固。坚持一段时间，相信会有更好的效果。',
    'caring': '{studentName}家长您好，很高兴看到{studentName}最近的努力有了回报。学习是一个需要长期坚持的过程，孩子的每一点进步都值得被看见。让我们继续陪伴和鼓励，一起静待花开。'
  },
  'regress': {
    'gentle': '{studentName}家长您好，想和您聊聊{studentName}最近的学习情况。这段时间孩子的成绩出现了一些波动，可能是遇到了一些困难。作为家长和老师，我们可以一起找找原因，给予孩子更多的支持和鼓励。',
    'professional': '{studentName}家长您好，{studentName}本次考试成绩较上次有所下滑，建议您关注孩子的学习状态。可能的原因包括知识点掌握不牢、学习方法需要调整等。建议与孩子沟通了解具体情况，必要时我们一起制定改进计划。',
    'constructive': '{studentName}家长您好！针对{studentName}近期成绩下滑的情况，建议采取以下措施：1. 与孩子沟通，了解具体困难点；2. 针对{description}加强练习；3. 调整学习计划，合理分配时间；4. 定期复习巩固。我们一起帮助孩子尽快调整状态。',
    'caring': '{studentName}家长您好，最近{studentName}的学习状态可能需要我们的关注。成绩波动是正常现象，关键是帮助孩子建立信心。建议您多和孩子交流，倾听他们的想法，给予温暖的鼓励，我们一起陪孩子度过这个阶段。'
  },
  'homework': {
    'gentle': '{studentName}家长您好！想和您反馈一下{studentName}最近的作业完成情况。大部分作业孩子都能认真完成，偶尔有一些地方需要加强。相信在您的督促下，孩子会越来越棒的！',
    'professional': '{studentName}家长您好，{studentName}近期作业完成情况如下：基本能够按时提交，但在完成质量方面还有提升空间。建议您关注孩子作业中的错题，督促及时订正，养成良好的作业习惯。',
    'constructive': '{studentName}家长您好！针对{studentName}的作业情况，建议您在家做好以下几点：1. 固定作业时间，培养专注力；2. 作业完成后检查一遍；3. 错题及时订正并归类整理；4. 遇到难题先独立思考，再寻求帮助。坚持一段时间，效果会很明显。',
    'caring': '{studentName}家长您好，想和您说说{studentName}的作业情况。孩子大部分时候都能完成作业，但偶尔会出现拖欠或质量不高的情况。建议您每天抽几分钟问问孩子的作业进度，给予适当的提醒和鼓励，帮助孩子养成好的学习习惯。'
  },
  'classroom': {
    'gentle': '{studentName}家长您好！{studentName}在课堂上大多数时候表现不错，能够认真听讲。偶尔会有走神或小声讲话的情况，相信通过我们的共同引导，孩子会越来越专注的。',
    'professional': '{studentName}家长您好，{studentName}近期课堂表现整体良好，能够参与课堂互动。但存在注意力不够集中的情况，建议您在家和孩子沟通，强调课堂纪律的重要性，帮助提高专注力。',
    'constructive': '{studentName}家长您好！针对{studentName}的课堂表现，建议您在家采取以下措施：1. 和孩子约定课堂纪律目标；2. 通过专注力训练小游戏提升注意力；3. 保证充足睡眠，避免因疲劳走神；4. 多肯定孩子的进步，建立正向反馈。',
    'caring': '{studentName}家长您好，想和您聊聊{studentName}在课堂上的情况。孩子是个聪明的孩子，但有时注意力容易分散。建议您在家多和孩子聊聊课堂上的趣事，激发学习兴趣，同时提醒孩子上课要专心听讲。我们一起帮助孩子成长。'
  },
  'knowledge': {
    'gentle': '{studentName}家长您好！想和您沟通一下{studentName}在{description}方面的学习情况。这个知识点孩子掌握得还不够扎实，但只要我们在家多给孩子一些练习机会，相信孩子一定能攻克这个难关的。',
    'professional': '{studentName}家长您好，{studentName}在{description}这一知识点的掌握上存在薄弱环节，建议加强针对性练习。可以让孩子每天做几道相关题目，并及时总结错题，逐步巩固。',
    'constructive': '{studentName}家长您好！针对{studentName}在{description}方面的薄弱点，建议按以下步骤进行辅导：1. 先复习相关基础概念；2. 从简单例题入手，建立信心；3. 逐步增加难度；4. 建立错题本，定期回顾。每天坚持20分钟，效果会很明显。',
    'caring': '{studentName}家长您好，{studentName}在{description}这个知识点上还需要加把劲。学习遇到瓶颈是正常的，关键是不要让孩子丧失信心。建议您在家耐心地陪孩子一起梳理思路，多用鼓励的方式，让孩子感受到进步的快乐。'
  },
  'cooperation': {
    'gentle': '{studentName}家长您好！学校最近组织了一项教育活动，想和您沟通一下。这项活动对孩子的成长很有帮助，希望您能在百忙之中给予支持。您的配合对孩子来说是最好的鼓励！',
    'professional': '{studentName}家长您好，学校近期将开展一项教育活动，需要家长的配合与支持。活动的目的是促进孩子的全面发展，希望您能积极参与。具体事项如下，请您查阅并给予回复。',
    'constructive': '{studentName}家长您好！学校近期活动需要您的配合，请您协助做好以下事项：1. 确认孩子的参与意向；2. 准备相关物品或材料；3. 提醒孩子注意安全事项；4. 活动后与孩子交流心得。您的支持对孩子的成长非常重要。',
    'caring': '{studentName}家长您好，想和您说说学校近期的活动安排。这些活动都是为了让孩子有更好的成长体验，希望您能在方便的时候给予支持。孩子的成长离不开家校共同努力，感谢您的理解与配合！'
  }
};

/**
 * 获取兜底模板
 * @param {string} scene - 场景ID
 * @param {string} style - 风格ID
 * @param {string} studentName - 学生姓名
 * @param {string} description - 表现描述
 * @returns {string} 兜底话术
 */
export function getFallbackTemplate(scene, style, studentName, description = '') {
  const sceneTemplates = FALLBACK_TEMPLATES[scene] || FALLBACK_TEMPLATES['progress'];
  const template = sceneTemplates[style] || sceneTemplates['gentle'];
  
  return template
    .replace(/{studentName}/g, studentName)
    .replace(/{description}/g, description || '相关知识点');
}

