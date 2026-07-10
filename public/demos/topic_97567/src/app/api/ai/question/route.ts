import { NextRequest, NextResponse } from 'next/server';
import { extractToken, extractUserIdFromToken, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

type QuestionType = 'morning' | 'noon' | 'evening';

function getQuestionTypeByTime(): QuestionType {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'noon';
  return 'evening';
}

const FALLBACK_QUESTIONS: Record<QuestionType, string[]> = {
  morning: [
    '今天有什么小事是你想做到的？',
    '新的一天，有什么小目标想试试？',
    '今天想给自己一个小挑战吗？',
  ],
  noon: [
    '上午有没有哪个瞬间让你觉得还不错？',
    '中午了，今天有什么小进展吗？',
    '休息一下，回想今天有什么值得记录的？',
  ],
  evening: [
    '今天最让你自己惊喜的一件小事是什么？',
    '今天有没有做到一件让自己开心的事？',
    '睡前回顾，今天有什么小成功想记住？',
  ],
};

const INACTIVE_FALLBACK_QUESTIONS: string[] = [
  '今天有没有喝到一杯好喝的咖啡？这也算哦！☕',
  '有没有看到一朵好看的云？小事情也值得记住 ☁️',
  '今天有没有一个瞬间，让你觉得还不错？哪怕很小 🌱',
];

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);

    if (!token) {
      return createErrorResponse('Authorization token required', 401);
    }

    const userId = extractUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const { question_type, recent_tags, days_since_last_record } = body as {
      question_type?: QuestionType;
      recent_tags?: string[];
      days_since_last_record?: number;
    };

    const type: QuestionType = question_type || getQuestionTypeByTime();
    const isInActive = typeof days_since_last_record === 'number' && days_since_last_record >= 3;

    let systemPrompt = '你是一个温暖的成长伙伴"雪球"。根据时间段生成一个引导用户发现微小成功的问题。';

    if (type === 'morning') {
      systemPrompt += '早上问意图（今天有什么小事是你想做到的？）。';
    } else if (type === 'noon') {
      systemPrompt += '中午问发现（上午有没有哪个瞬间让你觉得还不错？）。';
    } else {
      systemPrompt += '晚上问回顾（今天最让你自己惊喜的一件小事是什么？）。';
    }

    systemPrompt += '问题要温暖、低压力、具体。一句话即可。';

    if (recent_tags && recent_tags.length > 0) {
      const tagsStr = recent_tags.join('、');
      systemPrompt += `用户最近常记录关于${tagsStr}的内容，可以围绕这个方向提问。`;
    }

    if (isInActive) {
      const days = days_since_last_record!;
      systemPrompt += `用户已经${days}天没有记录了，请用更温暖、更低门槛的方式提问，让用户觉得任何小事都值得记录。例如："今天有没有喝到一杯好喝的咖啡？这也算哦！"`;
    }

    let question: string | null = null;

    if (process.env.ZHIPU_API_KEY) {
      try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '请生成一个问题。' },
            ],
            temperature: 0.9,
          }),
        });

        const data = await response.json();
        question = data.choices?.[0]?.message?.content?.trim();
      } catch (aiError) {
        console.error('ZhipuAI question generation error, using fallback:', aiError);
      }
    }

    if (!question) {
      if (isInActive) {
        question = INACTIVE_FALLBACK_QUESTIONS[Math.floor(Math.random() * INACTIVE_FALLBACK_QUESTIONS.length)];
      } else {
        const templates = FALLBACK_QUESTIONS[type];
        question = templates[Math.floor(Math.random() * templates.length)];
      }
    }

    return createSuccessResponse({
      question,
      question_type: type,
    });
  } catch (error: unknown) {
    console.error('Error in question route:', error);
    return createErrorResponse((error as Error).message || 'Failed to generate question');
  }
}
