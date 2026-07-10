import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

const KEYWORD_MAP: Record<string, { type: string; tags: string[] }> = {
  success: {
    type: 'success',
    tags: ['小成功'],
  },
  habit: {
    type: 'habit',
    tags: ['好习惯'],
  },
  progress: {
    type: 'progress',
    tags: ['进步'],
  },
  reflection: {
    type: 'reflection',
    tags: ['感悟'],
  },
};

const TYPE_KEYWORDS: Record<string, string[]> = {
  success: ['成功', '完成', '做到', '搞定', '实现', '达成', '赢', '突破', '第一次', '终于'],
  habit: ['坚持', '习惯', '每天', '打卡', '早起', '运动', '阅读', '冥想', '练习', '规律'],
  progress: ['进步', '提升', '学会', '掌握', '更好', '提高', '前进', '成长', '改善', '升级'],
  reflection: ['感悟', '思考', '明白', '意识到', '发现', '领悟', '体会', '理解', '反思', '觉得'],
};

function classifyByKeywords(content: string): { type: string; tags: string[] } {
  let bestType = 'success';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  const tags: string[] = [];
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (content.includes(keyword) && tags.length < 3) {
        if (!tags.includes(keyword)) {
          tags.push(keyword);
        }
      }
    }
  }

  if (tags.length === 0) {
    tags.push(...KEYWORD_MAP[bestType].tags);
  }

  return { type: bestType, tags: tags.slice(0, 3) };
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

    let result: { type: string; tags: string[] } | null = null;

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
                content: `你是一个日记分类助手。根据用户记录的内容，将其分类为以下四种类型之一：
- success: 小成功、成就、完成的事情
- habit: 好习惯、坚持做的事情、日常打卡
- progress: 进步、提升、学习成长
- reflection: 感悟、思考、心得体会

同时生成1-3个相关标签，标签应该简洁（2-4个字）。

请严格以JSON格式返回：{"type": "分类", "tags": ["标签1", "标签2"]}`,
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
        const aiContent = data.choices?.[0]?.message?.content;

        if (aiContent) {
          let jsonStr = aiContent.trim();
          const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          }
          const parsed = JSON.parse(jsonStr);

          const validTypes = ['success', 'habit', 'progress', 'reflection'];
          if (parsed.type && validTypes.includes(parsed.type) && Array.isArray(parsed.tags)) {
            result = {
              type: parsed.type,
              tags: parsed.tags.slice(0, 3),
            };
          }
        }
      } catch (aiError) {
        console.error('ZhipuAI auto-tag error, using fallback:', aiError);
      }
    }

    if (!result) {
      result = classifyByKeywords(content);
    }

    return NextResponse.json({ success: true, type: result.type, tags: result.tags }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in auto-tag route:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to auto-tag' }, { status: 500 });
  }
}
