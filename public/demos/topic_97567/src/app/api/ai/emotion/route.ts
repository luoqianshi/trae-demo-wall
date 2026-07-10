import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

export type EmotionType = 'positive' | 'neutral' | 'negative' | 'anxious' | 'depressed';

const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  positive: ['开心', '高兴', '成功', '棒', '厉害', '骄傲', '自豪', '兴奋', '满意', '幸福'],
  anxious: ['焦虑', '担心', '害怕', '紧张', '不安', '压力', '烦躁'],
  depressed: ['难过', '沮丧', '失望', '低落', '崩溃', '绝望', '痛苦', '无力', '没用', '做不好'],
  neutral: [],
  negative: [],
};

function classifyByKeywords(content: string): { emotion: EmotionType; confidence: number } {
  for (const keyword of EMOTION_KEYWORDS.depressed) {
    if (content.includes(keyword)) {
      return { emotion: 'depressed', confidence: 0.5 };
    }
  }

  for (const keyword of EMOTION_KEYWORDS.anxious) {
    if (content.includes(keyword)) {
      return { emotion: 'anxious', confidence: 0.5 };
    }
  }

  for (const keyword of EMOTION_KEYWORDS.positive) {
    if (content.includes(keyword)) {
      return { emotion: 'positive', confidence: 0.5 };
    }
  }

  const negativeWords = ['不好', '失败', '差', '糟', '烦', '累', '讨厌', '后悔'];
  for (const keyword of negativeWords) {
    if (content.includes(keyword)) {
      return { emotion: 'negative', confidence: 0.5 };
    }
  }

  return { emotion: 'neutral', confidence: 0.5 };
}

export async function analyzeEmotion(content: string): Promise<{ emotion: EmotionType; confidence: number }> {
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
            {
              role: 'system',
              content: '你是一个情绪分析专家。分析用户输入的文本情绪，返回以下类别之一：positive（积极）、neutral（中性）、negative（消极）、anxious（焦虑）、depressed（低落）。只返回类别名称，不要其他内容。',
            },
            {
              role: 'user',
              content: content,
            },
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content?.trim().toLowerCase();

      if (aiContent) {
        const validEmotions: EmotionType[] = ['positive', 'neutral', 'negative', 'anxious', 'depressed'];
        const emotionMap: Record<string, EmotionType> = {
          'positive': 'positive',
          '积极': 'positive',
          'neutral': 'neutral',
          '中性': 'neutral',
          'negative': 'negative',
          '消极': 'negative',
          'anxious': 'anxious',
          '焦虑': 'anxious',
          'depressed': 'depressed',
          '低落': 'depressed',
        };

        const matchedEmotion = emotionMap[aiContent];
        if (matchedEmotion && validEmotions.includes(matchedEmotion)) {
          return { emotion: matchedEmotion, confidence: 0.8 };
        }

        for (const [key, emotion] of Object.entries(emotionMap)) {
          if (aiContent.includes(key) && validEmotions.includes(emotion)) {
            return { emotion, confidence: 0.8 };
          }
        }
      }
    } catch (aiError) {
      console.error('ZhipuAI emotion analysis error, using keyword fallback:', aiError);
    }
  }

  return classifyByKeywords(content);
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const result = await analyzeEmotion(content);

    return NextResponse.json({
      success: true,
      emotion: result.emotion,
      confidence: result.confidence,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in emotion analysis route:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to analyze emotion' }, { status: 500 });
  }
}
