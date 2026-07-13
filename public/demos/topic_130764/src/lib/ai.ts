// ============================================================
// 溯光应用 - AI 对话与鼓励策略引擎
// ============================================================
// 当前使用本地模拟逻辑，可通过 setAIProvider 替换为真实 API。
// ============================================================

import type { Goal, Submission } from '../types';

// ============================================================
// 公共类型
// ============================================================

/** 对话消息 */
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** AI 回复 */
export interface AIResponse {
  /** AI 的回复文本 */
  text: string;
  /** 提取的鼓励内容 */
  encouragement: string;
  /** 改进建议（可选，留到下次提醒时使用） */
  hint?: string;
}

/** 生成回复所需的上下文 */
export interface AIContext {
  /** 当前活跃目标 */
  currentGoal?: Goal;
  /** 最新一次提交 */
  latestSubmission?: Submission;
  /** 历史提交记录 */
  previousSubmissions?: Submission[];
  /** 是否是新一轮对话（用于问候和提醒） */
  isNewSession: boolean;
}

/** AI Provider 接口 —— 用于替换为真实 API */
export interface AIProvider {
  chat(messages: AIMessage[], context: AIContext): Promise<AIResponse>;
}

// ============================================================
// 回复模板
// ============================================================

/** 场景 1：新会话问候 —— 有活跃目标 */
const GREETING_WITH_GOAL: string[] = [
  '嗨！你今天的{goal}还没完成哦，写完拍给我看看吧～',
  '早上好呀！今天也来练习{goal}吧，我等着看你的成果～',
  '嘿！新的一天开始了，今天的{goal}准备好了吗？',
  '你好呀！又到{goal}的时间啦，做完记得告诉我哦～',
  '哈喽！今天的{goal}打卡还没做呢，加油加油！',
  '嗨嗨！别忘记今天的{goal}哦，我相信你可以的！',
  '来啦！今天的{goal}任务等着你呢，冲冲冲！',
];

/** 场景 1：新会话问候 —— 无目标 */
const GREETING_NO_GOAL: string[] = [
  '嗨！告诉我，你想开始做什么？',
  '你好呀！有什么想养成的好习惯吗？告诉我吧～',
  '嗨！今天想尝试点什么新东西吗？',
  '哈喽！来制定一个小目标吧，我来帮你坚持！',
  '你好！想做什么都可以告诉我哦，我会一直陪着你的～',
  '嗨！没有目标也没关系，随时可以开始一个新的冒险！',
  '嘿！说说看，最近有什么想做的事情吗？',
  '你好呀！新的一天，要不要给自己一个小目标？',
];

/** 场景 1：新会话问候 —— 有上次未提交（使用 previousSubmissions） */
const GREETING_HAS_PREVIOUS: string[] = [
  '你上次的{goal}做得很好，这周继续吗？',
  '上次的{goal}完成得很棒呢！要不要再来一轮？',
  '嘿！上次你的{goal}成果我还在看呢，这次也一起加油吧～',
  '欢迎回来！上次的{goal}做得很出色，继续坚持好不好？',
  '你上次的{goal}让我印象很深呢！这次想继续还是换个新目标？',
  '回来了呀！上次{goal}的表现很不错的，今天再接再厉吧～',
];

/** 场景 2：创建目标 */
const CREATE_GOAL_RESPONSES: string[] = [
  '太好了！你想多久练一次呢？每天、每周、还是自己定？',
  '不错嘛！那你想定一个什么频率？每天还是每周几次？',
  '好呀！你打算多久做一次呢？我来帮你记住～',
  '很棒的选择！你希望多久练习一次呢？',
  '开始行动了耶！来定个频率吧，每天、每周还是按自己的节奏来？',
  '好嘞！那说说你打算多久做一次？',
  '决定了就去做！你希望我多久提醒你一次呢？',
  '听起来很棒！你想要每天坚持还是每周几次？',
];

/** 场景 3：设定频率确认 */
const FREQUENCY_CONFIRM: string[] = [
  '好的，我记住了！{freq}。到时候我会提醒你的！',
  '没问题！{freq}，我已经帮你安排好了～',
  '收到！{freq}，我会准时叫你的！',
  '好嘞，设定好了：{freq}。坚持住哦！',
  '记下来啦！{freq}，到时候别忘了哦～',
  '完美！{freq}，我们一起坚持下去！',
  '设定成功！{freq}，我会好好监督你的～',
];

/** 场景 4：提交成果后鼓励 —— image 类型 */
const ENCOURAGE_IMAGE: string[] = [
  '写得真认真！比上次进步了很多！',
  '哇，拍得不错呢！看得出来你很用心！',
  '这个成果很棒呀！继续保持这个状态！',
  '好认真！能感受到你的努力，加油！',
  '真不错！看得出来你下了功夫的～',
  '很棒！每一次都能看到你的进步呢！',
  '太厉害了！这次的完成度很高哦！',
  '优秀！我能看到你一直在进步，继续加油！',
];

/** 场景 4：提交成果后鼓励 —— audio 类型 */
const ENCOURAGE_AUDIO: string[] = [
  '听到了！你的声音越来越有底气了呢！',
  '好好听！比之前流利多了，进步很大！',
  '真棒！能听出来你练习得很认真！',
  '不错不错！这次的效果比上次更好哦～',
  '听到你的练习成果了，很棒！继续加油！',
  '有进步！气息更稳了，继续练！',
  '很好！你的练习录音让我很惊喜呢！',
  '太赞了！这次的录音质量很高哦！',
];

/** 场景 4：提交成果后鼓励 —— text 类型 */
const ENCOURAGE_TEXT: string[] = [
  '写得很用心呢！你的文字越来越好了！',
  '好认真！能感受到你的努力！',
  '真不错！继续坚持，你会越来越好的！',
  '写得很好呀！我看到了你的进步！',
  '很棒！每一天都在变得更好呢～',
  '好厉害！这段文字很有力量！',
  '真用心！你一直在进步，别停下来哦！',
  '优秀！文字里有你的坚持和努力！',
];

/** 场景 4：提交成果后的改进建议 hint */
const HINT_POOL: string[] = [
  '下次可以试试放慢速度，把细节做得更精细哦',
  '试着注意一下整体的节奏感',
  '可以多花一点时间在开头部分',
  '下次试试换一种方式，说不定会有新收获',
  '注意一下中间的过渡部分，会更流畅的',
  '试着加上一些自己的风格，会更出彩',
  '下次可以挑战一下难度稍高一点的',
  '保持这个状态，同时注意一下细节就更好了',
  '试着多做一次，第二次往往会更好哦',
  '可以关注一下收尾部分，让它更完整',
];

/** 场景 5：提醒 + 上次 hint */
const REMIND_WITH_HINT: string[] = [
  '{goal}日到啦！上次你做得特别好，这周试试注意一下{hint}？',
  '又到了{goal}的时间！上次的建议还记得吗？{hint}～',
  '嘿，{goal}时间到！上次我给的小建议：{hint}，试试看？',
  '打卡时间！上次你的{goal}很棒，这次试试{hint}？',
  '{goal}提醒！上次你说要试试{hint}，今天来实践一下吧～',
  '到点了！{goal}时间！上次我提到的{hint}，今天要不要试一下？',
  '提醒你啦！{goal}时间到了。上次的小建议是{hint}，加油！',
];

/** 场景 6：通用对话 */
const GENERAL_RESPONSES: string[] = [
  '嗯嗯，我在听。还有什么想告诉我的吗？',
  '好的好的，我明白啦～继续说说？',
  '嗯，我听到啦！你继续说，我一直在呢～',
  '了解了！还有什么想聊的吗？',
  '好的！我在认真听呢，继续吧～',
  '嗯嗯，说得挺好的！还想聊点什么？',
  '听到啦！你说的我都记在心里了～',
  '好的好的，不管怎样我都在这里支持你哦！',
];

// ============================================================
// 工具函数
// ============================================================

/** 从数组中随机取一个元素 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 星期几数字（0=周日 ... 6=周六）转中文 */
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 构建频率描述文本 */
export function buildFrequencyText(frequency: Goal['frequency'], customDays?: number[]): string {
  if (!frequency) return '按你自己的节奏来';

  if (frequency === 'daily') {
    return '每天一次';
  }

  if (frequency === 'weekly') {
    return '每周一次';
  }

  if (frequency === 'custom' && customDays && customDays.length > 0) {
    const days = customDays.map(d => DAY_NAMES[d]).join('、');
    return `每周${days}`;
  }

  return '按你自己的节奏来';
}

/** 检测用户输入是否包含"想/要/打算" + 动词 的模式（创建目标意图） */
function detectGoalCreation(input: string): string | null {
  const patterns = [
    /(?:我想|我要|我打算|我准备|我希望|我想开始|我想学|我想练|我要练|我要学)\s*(.+)/,
    /(?:帮我|一起|来)(?:制定|设定|安排)(?:一个|一下)?\s*(.+)/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      // 提取核心目标，去除多余的修饰词
      let goal = match[1].trim();
      // 截取到第一个标点或句尾
      goal = goal.replace(/[,，。！？、].*/, '').trim();
      if (goal.length > 0 && goal.length <= 20) {
        return goal;
      }
    }
  }
  return null;
}

/** 检测用户输入中的频率设定信息 */
function detectFrequency(input: string): { type: 'daily' | 'weekly' | 'custom'; timesPerWeek?: number; daysOfWeek?: number[]; description: string } | null {
  // 每天
  if (/每天|每天都|daily/i.test(input)) {
    return { type: 'daily', description: '每天一次' };
  }

  // 每周 N 次
  const weeklyTimesMatch = input.match(/每[周星期]\s*(\d+)\s*次/);
  if (weeklyTimesMatch) {
    return { type: 'weekly', timesPerWeek: parseInt(weeklyTimesMatch[1], 10), description: `每周${weeklyTimesMatch[1]}次` };
  }

  // 指定星期几
  const dayMap: Record<string, number> = {
    '周一': 1, '星期一': 1, '礼拜一': 1,
    '周二': 2, '星期二': 2, '礼拜二': 2,
    '周三': 3, '星期三': 3, '礼拜三': 3,
    '周四': 4, '星期四': 4, '礼拜四': 4,
    '周五': 5, '星期五': 5, '礼拜五': 5,
    '周六': 6, '星期六': 6, '礼拜六': 6,
    '周日': 0, '星期日': 0, '礼拜日': 0, '星期天': 0, '礼拜天': 0,
  };

  const daysOfWeek: number[] = [];
  for (const [name, num] of Object.entries(dayMap)) {
    if (input.includes(name)) {
      daysOfWeek.push(num);
    }
  }

  if (daysOfWeek.length > 0) {
    const description = `${daysOfWeek.length}次，${daysOfWeek.map(d => DAY_NAMES[d]).join('、')}`;
    return { type: 'weekly', timesPerWeek: daysOfWeek.length, daysOfWeek, description };
  }

  // 每周（无具体天数）
  if (/每[周星期]/.test(input)) {
    return { type: 'weekly', timesPerWeek: 1, description: '每周一次' };
  }

  return null;
}

// ============================================================
// 本地模拟 Provider
// ============================================================

/** 本地模拟 AI Provider */
class LocalAIProvider implements AIProvider {
  async chat(messages: AIMessage[], context: AIContext): Promise<AIResponse> {
    // 取用户最新一条消息
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userInput = lastUserMessage?.content ?? '';

    // 模拟网络延迟（300-800ms）
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // ---- 场景判定 ----

    // 优先级 1：新会话问候
    if (context.isNewSession && (!lastUserMessage || lastUserMessage === messages[0])) {
      return this.handleNewSession(context);
    }

    // 优先级 2：提交成果后鼓励
    if (context.latestSubmission) {
      return this.handleSubmission(context);
    }

    // 优先级 3：提醒 + 上次 hint
    if (
      context.previousSubmissions &&
      context.previousSubmissions.length > 0 &&
      context.currentGoal
    ) {
      const lastPrev = context.previousSubmissions[context.previousSubmissions.length - 1];
      if (lastPrev?.improvementHint) {
        return this.handleRemindWithHint(context, lastPrev.improvementHint);
      }
    }

    // 优先级 4：创建目标意图检测
    const goalName = detectGoalCreation(userInput);
    if (goalName) {
      return this.handleCreateGoal(goalName);
    }

    // 优先级 5：频率设定检测
    const freq = detectFrequency(userInput);
    if (freq) {
      return this.handleSetFrequency(freq);
    }

    // 优先级 6：通用对话
    return this.handleGeneral();
  }

  /** 场景 1：新会话问候 */
  private handleNewSession(context: AIContext): AIResponse {
    let text: string;

    if (context.currentGoal) {
      text = pickRandom(GREETING_WITH_GOAL).replace('{goal}', context.currentGoal.title);
    } else if (context.previousSubmissions && context.previousSubmissions.length > 0) {
      // 有历史提交但没有活跃目标
      text = pickRandom(GREETING_HAS_PREVIOUS).replace(
        '{goal}',
        String(context.previousSubmissions[context.previousSubmissions.length - 1].goalId)
      );
    } else {
      text = pickRandom(GREETING_NO_GOAL);
    }

    return {
      text,
      encouragement: text,
    };
  }

  /** 场景 2：创建目标 */
  private handleCreateGoal(goalName: string): AIResponse {
    const text = pickRandom(CREATE_GOAL_RESPONSES);
    return {
      text,
      encouragement: `好棒！想要开始${goalName}！`,
    };
  }

  /** 场景 3：设定频率确认 */
  private handleSetFrequency(freq: { description: string }): AIResponse {
    const text = pickRandom(FREQUENCY_CONFIRM).replace('{freq}', freq.description);
    return {
      text,
      encouragement: '目标设定好了，一起坚持吧！',
    };
  }

  /** 场景 4：提交成果后鼓励 */
  private handleSubmission(context: AIContext): AIResponse {
    const submission = context.latestSubmission!;
    let encouragement: string;

    switch (submission.type) {
      case 'image':
        encouragement = pickRandom(ENCOURAGE_IMAGE);
        break;
      case 'audio':
        encouragement = pickRandom(ENCOURAGE_AUDIO);
        break;
      case 'text':
      default:
        encouragement = pickRandom(ENCOURAGE_TEXT);
        break;
    }

    // 随机生成一个 hint，留到下次提醒时使用
    const hint = pickRandom(HINT_POOL);

    return {
      text: encouragement,
      encouragement,
      hint,
    };
  }

  /** 场景 5：提醒 + 上次 hint */
  private handleRemindWithHint(context: AIContext, hint: string): AIResponse {
    const goal = context.currentGoal!;
    const text = pickRandom(REMIND_WITH_HINT)
      .replace('{goal}', goal.title)
      .replace('{hint}', hint);

    return {
      text,
      encouragement: `又到了${goal.title}的时间，你一定可以做到的！`,
    };
  }

  /** 场景 6：通用对话 */
  private handleGeneral(): AIResponse {
    const text = pickRandom(GENERAL_RESPONSES);
    return {
      text,
      encouragement: '',
    };
  }
}

// ============================================================
// 模块状态与导出
// ============================================================

/** 当前使用的 AI Provider（默认本地模拟） */
let currentProvider: AIProvider = new LocalAIProvider();

/** 生成 AI 回复（主入口函数） */
export async function generateResponse(
  messages: AIMessage[],
  context: AIContext,
): Promise<AIResponse> {
  return currentProvider.chat(messages, context);
}

/**
 * 替换 AI Provider。
 *
 * 默认使用本地模拟 provider，调用此函数可替换为真实 API 调用，例如：
 *
 * ```ts
 * import { setAIProvider } from '@/lib/ai';
 *
 * setAIProvider({
 *   async chat(messages, context) {
 *     const res = await fetch('/api/ai/chat', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ messages, context }),
 *     });
 *     return res.json();
 *   },
 * });
 * ```
 */
export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider;
}

/** 获取当前 AI Provider（便于测试或检查） */
export function getAIProvider(): AIProvider {
  return currentProvider;
}
