import { SCENES, STYLES, CHANNELS } from './constants';

const SYSTEM_PROMPT = `你是一位经验丰富的中小学班主任，擅长与家长进行专业、得体的沟通。
请根据以下要求生成家校沟通话术：
1. 语气专业、尊重家长，避免使用指责性语言
2. 客观陈述学生情况，既反映问题也肯定优点
3. 提供具体、可执行的建议，而非空泛评价
4. 注意保护学生隐私和自尊心
5. 根据不同风格调整语气：温和鼓励型以正面为主；专业直接型陈述事实；建设性建议型侧重方案；关怀提醒型委婉提示
6. 格式要求：用 **加粗** 标记需要重点突出的内容（如关键数据、重要建议等），换行分段使结构清晰`;

const SCENE_DESCRIPTIONS = {
  'progress': '学生近期成绩有进步，请生成鼓励性反馈话术，肯定孩子的努力并鼓励继续保持',
  'regress': '学生近期成绩出现下滑，请生成关切性沟通话术，客观分析原因并提出改进建议',
  'homework': '需要反馈学生作业完成情况，请生成针对性话术，说明作业完成质量并提出期望',
  'classroom': '需要反馈学生课堂表现，请生成沟通话术，描述课堂行为并给出正面引导或改进建议',
  'knowledge': '学生某知识点掌握薄弱，请生成辅导建议话术，定位薄弱点并给出具体辅导方向',
  'cooperation': '需要家长配合某项教育工作，请生成请求话术，说明事项意义并委婉请求配合'
};

const STYLE_INSTRUCTIONS = {
  'gentle': '温和鼓励型：以正面表达和鼓励为主，多使用肯定性语言，让家长感受到希望和信心',
  'professional': '专业直接型：以客观陈述事实为主，简洁清晰，不添加过多情感色彩，给出明确建议',
  'constructive': '建设性建议型：侧重提出具体可执行的改进方案，给出明确的行动步骤和预期效果',
  'caring': '关怀提醒型：以关心学生发展为切入点，语气委婉，委婉提示问题，避免让家长感到被指责'
};

const CHANNEL_INSTRUCTIONS = {
  'wechat': '微信消息格式：简洁自然，段落分明，可适当使用表情符号点缀，控制在300字以内',
  'sms': '短信格式：极度精简，去除一切修饰词，只保留核心信息，控制在200字以内',
  'email': '邮件格式：包含称呼和落款，正文分段清晰，语气正式但不过于生硬，可适当展开说明',
  'phone': '电话要点格式：采用要点式结构，每点一句话，便于口头表达，附沟通注意事项'
};

/**
 * 构建 AI 生成 Prompt
 * @param {Object} params - 生成参数
 * @param {string} params.scene - 场景ID
 * @param {string} params.style - 风格ID
 * @param {string} params.channel - 渠道ID
 * @param {string} params.description - 学生表现描述
 * @returns {string} 完整的 Prompt 文本
 */
export function buildPrompt(params) {
  const { scene, style, channel, description } = params;
  
  const sceneDesc = SCENE_DESCRIPTIONS[scene] || SCENE_DESCRIPTIONS['progress'];
  const styleDesc = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS['gentle'];
  const channelDesc = CHANNEL_INSTRUCTIONS[channel] || CHANNEL_INSTRUCTIONS['wechat'];
  
  return `${SYSTEM_PROMPT}

【沟通场景】${sceneDesc}
【输出风格】${styleDesc}
【输出格式】${channelDesc}

学生具体情况：${description || '请根据场景生成一段通用的沟通话术模板'}

要求：
1. 称呼统一使用"XX家长您好"（不需要替换为真实姓名）
2. 内容要具体、有针对性，避免空泛套话
3. 根据不同渠道控制字数
4. 直接在正文中包含称呼，不需要额外的主题行或落款说明`;
}

