import { NextRequest } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

const FEEDBACK_TEMPLATES = [
  '原来是这样！谢谢你分享更多细节，这让你的小成功更加生动了 ✨',
  '听到了！你的描述让我更理解这个时刻对你的意义 🌟',
  '感谢你展开说，这样的记录更有温度了 ❄️',
  '太棒了！这样的细节让雪球更加充实 💪',
];

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('record_id');

  if (!recordId) {
    return createErrorResponse('record_id is required', 400);
  }

  // 修复 R2-F6: 校验 record 归属
  const record = db.getRecord(recordId);
  if (!record || record.user_id !== userId) {
    return createErrorResponse('Record not found', 404);
  }

  try {
    const conversations = db.getConversations(recordId);
    return createSuccessResponse({ conversations });
  } catch (error: unknown) {
    console.error('Error in follow-up route:', error);
    return createErrorResponse((error as Error).message || 'Failed to get conversations');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const body = await request.json();
    const { record_id, role, content, answer, follow_up_question } = body;

    if (role && content && !answer) {
      if (!record_id) {
        return createErrorResponse('record_id is required', 400);
      }

      // 修复 R2-F6: 校验 record 归属
      const record = db.getRecord(record_id);
      if (!record || record.user_id !== userId) {
        return createErrorResponse('Record not found', 404);
      }

      const conversation = db.createConversation({ record_id, role, content });
      return createSuccessResponse({ conversation });
    }

    if (!record_id || !answer) {
      return createErrorResponse('record_id and answer are required', 400);
    }

    // 修复 R2-F6: 校验 record 归属
    const record = db.getRecord(record_id);
    if (!record || record.user_id !== userId) {
      return createErrorResponse('Record not found', 404);
    }

    let feedback: string | null = null;

    if (process.env.ZHIPU_API_KEY) {
      try {
        const systemPrompt = '你是一个温暖的成长伙伴。用户刚刚回答了你的追问，请根据他们的回答给出简短、温暖的反馈。回复1-2句话即可，语气像朋友聊天一样自然。';

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
              { role: 'user', content: `追问：${follow_up_question || '能多说一点吗？'}\n用户回答：${answer}` },
            ],
            temperature: 0.8,
          }),
        });

        const data = await response.json();
        feedback = data.choices?.[0]?.message?.content?.trim();
      } catch (aiError) {
        console.error('ZhipuAI feedback error:', aiError);
      }
    }

    if (!feedback) {
      feedback = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
    }

    db.createConversation({ record_id, role: 'user', content: answer });
    const aiConversation = db.createConversation({ record_id, role: 'assistant', content: feedback });
    return createSuccessResponse({ conversation: aiConversation, feedback });
  } catch (error: unknown) {
    console.error('Error in follow-up route:', error);
    return createErrorResponse((error as Error).message || 'Failed to submit answer');
  }
}
