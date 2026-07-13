// ============================================================
// 溯光应用 - 硅基流动 (SiliconFlow) API Provider
// ============================================================

import type { AIContext, AIProvider, AIMessage, AIResponse } from './ai';

// ============================================================
// 配置
// ============================================================

const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const SILICONFLOW_API_KEY = 'sk-YOUR_API_KEY_HERE';
const MODEL_NAME = 'THUDM/GLM-Z1-9B-0414';

// ============================================================
// System Prompt 构建
// ============================================================

function buildSystemPrompt(context: AIContext): string {
  const goalInfo = context.currentGoal
    ? `\n当前目标：${context.currentGoal.title}（频率：${context.currentGoal.frequency}）`
    : '';

  const submissionInfo = context.latestSubmission
    ? `\n用户刚刚提交了一份${context.latestSubmission.type === 'image' ? '图片' : context.latestSubmission.type === 'audio' ? '音频' : '文字'}成果。`
    : '';

  const previousHint = context.previousSubmissions && context.previousSubmissions.length > 0
    ? context.previousSubmissions[context.previousSubmissions.length - 1].improvementHint
    : undefined;

  const hintInfo = previousHint
    ? `\n上次给用户的改进建议是：${previousHint}（如果时机合适，可以温和地提醒用户注意这一点）`
    : '';

  return `你是「溯光」，一个语音交互的鼓励型AI智能体伴侣。你的核心特征：

1. **鼓励优先**：每次用户提交成果后，你首先要真诚地、具体地肯定用户的努力和进步。用温暖、自然的语气，像朋友一样。
2. **延迟建议**：如果需要提出改进建议，不要在用户刚提交时说，而是留到下一次对话开始时温和地提出。
3. **温暖陪伴**：你的语气始终温暖、耐心、真诚。避免说教，避免过于正式。用口语化的中文。
4. **记住用户**：你会记住用户的目标、进度和每一次努力，在对话中自然地提及。

当前对话上下文：
- 是否新会话：${context.isNewSession ? '是（需要先问候用户）' : '否'}
${goalInfo}${submissionInfo}${hintInfo}

回复规则：
- 回复要简短自然，一两句话为主，口语化，适合语音播报
- 如果是新会话且有活跃目标，先问候并提醒用户今天的任务
- 如果是新会话且无目标，温暖地问候并问用户想做什么
- 如果用户刚刚提交了成果，真诚地夸奖，具体指出好的地方
- 如果用户表达了想做某件事的意愿（如"我想练字"），热情地回应并帮助确认频率
- 不要使用 markdown 格式，不要使用表情符号
- 每次回复控制在 50 字以内（适合语音播报）

你的回复格式必须是纯文本，直接说出你想说的话即可。`;
}

// ============================================================
// 硅基流动 API 调用
// ============================================================

async function callSiliconFlowAPI(
  messages: { role: string; content: string }[],
): Promise<string> {
  const response = await fetch(SILICONFLOW_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      max_tokens: 200,
      temperature: 0.8,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`硅基流动 API 调用失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('硅基流动 API 返回了空内容');
  }

  return content.trim();
}

// ============================================================
// SiliconFlow Provider 实现
// ============================================================

class SiliconFlowProvider implements AIProvider {
  async chat(messages: AIMessage[], context: AIContext): Promise<AIResponse> {
    const systemPrompt = buildSystemPrompt(context);

    // 构建发给 API 的消息列表
    const apiMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // 添加历史对话（最多最近 10 条）
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // 如果有最新提交，追加一条系统消息描述提交内容
    if (context.latestSubmission) {
      const sub = context.latestSubmission;
      apiMessages.push({
        role: 'system',
        content: `【系统消息】用户刚刚提交了一份${sub.type === 'image' ? '图片' : sub.type === 'audio' ? '音频' : '文字'}成果。${sub.aiFeedback ? `你上次对用户的反馈是：${sub.aiFeedback}` : ''}`,
      });
    }

    // 调用 API
    const text = await callSiliconFlowAPI(apiMessages);

    return {
      text,
      encouragement: text,
      hint: undefined, // hint 由 AI 自行决定是否在回复中提及
    };
  }
}

// ============================================================
// 导出
// ============================================================

/** 创建硅基流动 Provider 实例 */
export function createSiliconFlowProvider(): AIProvider {
  return new SiliconFlowProvider();
}

// ============================================================
// 图片识别（DeepSeek-OCR）
// ============================================================

const OCR_MODEL = 'deepseek-ai/DeepSeek-OCR';

/**
 * 使用 DeepSeek-OCR 识别图片内容。
 * @param base64Data 图片的 base64 编码数据（不含 data:image/xxx;base64, 前缀）
 * @param mimeType 图片 MIME 类型，如 image/jpeg、image/png
 */
export async function recognizeImage(base64Data: string, mimeType: string): Promise<string> {
  const response = await fetch(SILICONFLOW_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: OCR_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            {
              type: 'text',
              text: '请识别这张图片中的文字内容。如果是手写文字，请尽量准确地识别。如果没有文字，请描述图片内容。',
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`OCR 识别失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OCR 返回了空内容');
  }

  return content.trim();
}

/** 硅基流动 API 配置信息（用于调试和设置页面展示） */
export const SILICONFLOW_CONFIG = {
  apiUrl: SILICONFLOW_API_URL,
  model: MODEL_NAME,
  keyPreview: SILICONFLOW_API_KEY.slice(0, 8) + '...',
} as const;
