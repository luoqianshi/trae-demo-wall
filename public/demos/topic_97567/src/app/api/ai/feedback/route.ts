import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmotion, EmotionType } from '@/app/api/ai/emotion/route';
import { buildUserProfile, buildProfileSummary, ProfileRecord } from '@/lib/user-profile';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';
import { discover } from '@/lib/discovery-engine';

const FOLLOW_UP_TEMPLATES = [
  '嘿嘿，能多说说吗？我很好奇呢~ 🌬️',
  '这件事让你有什么感受呢？想听听你的想法 ☁️',
  '哇，听起来不错！具体做了什么呢？🌱',
  '好想知道更多细节，能分享一下吗？✨',
];

const DANGER_KEYWORDS = ['自杀', '不想活', '结束', '跳楼', '割腕', '吃药死', '活不下去', '死了算了'];

const CRISIS_HOTLINE = '如果你正在经历困难时刻，请拨打心理援助热线：400-161-9995（全国24小时）❤️';

type FeedbackLevel = 'micro' | 'deep' | 'insight';

async function getUserRecentRecords(userId: string): Promise<ProfileRecord[]> {
  const records = db.getRecords(userId);
  return records.map(r => ({
    content: r.content,
    tags: r.tags || [],
    mood: r.mood || 'neutral',
    created_at: r.created_at,
  }));
}

function checkEmotionSafetyNet(recentRecords: ProfileRecord[], currentEmotion: EmotionType): {
  isTriggered: boolean;
  isSevere: boolean;
} {
  let isSevere = false;
  if (currentEmotion === 'depressed') {
    for (const record of recentRecords.slice(0, 3)) {
      for (const keyword of DANGER_KEYWORDS) {
        if (record.content.includes(keyword)) {
          isSevere = true;
          break;
        }
      }
      if (isSevere) break;
    }
  }

  const depressedMoods = ['sad', 'depressed', 'low'];
  const last3Records = recentRecords.slice(0, 3);

  if (last3Records.length >= 3 && currentEmotion === 'depressed') {
    const allDepressed = last3Records.every(r => depressedMoods.includes(r.mood?.toLowerCase() || ''));
    if (allDepressed) {
      return { isTriggered: true, isSevere };
    }
  }

  if (isSevere) {
    return { isTriggered: true, isSevere: true };
  }

  return { isTriggered: false, isSevere: false };
}

function buildSystemPrompt(
  emotion: EmotionType,
  feedbackLevel: FeedbackLevel,
  profileSummary: string | null,
  safetyNet: { isTriggered: boolean; isSevere: boolean },
): string {
  const SNOWBALL_PREFIX = '你是雪球，一个活泼撒娇的雪球精灵，用户的成长伙伴。';
  let systemPrompt = '';

  if (emotion === 'anxious') {
    systemPrompt = '我是雪球！用户现在感到焦虑，请先安抚情绪，然后给出一个具体的小行动建议。用我的口吻说话，回复温暖简短，2-3句话。例如："别急，慢慢来，我在呢~"';
  } else if (emotion === 'depressed') {
    systemPrompt = '我是雪球！用户现在情绪低落，请给予温暖的陪伴和低门槛的引导。不要说教，不要催促。用我的口吻说话，回复温暖简短，1-2句话。例如："今天能来就好，我在~"';
  } else {
    systemPrompt = '我是雪球，用户的成长伙伴！根据用户的记录内容，给出积极、鼓励性的反馈。用第一人称说话，语气活泼撒娇，偶尔撒娇但不过分，比如"哇！我又变大啦！嘿嘿~"。用雪球滚动的比喻来激励用户。回复简洁温暖。';
  }

  if (feedbackLevel === 'micro') {
    systemPrompt += ' 回复1句话+1个emoji即可，简洁温暖。';
  } else if (feedbackLevel === 'deep') {
    if (profileSummary) {
      systemPrompt += ` 根据用户画像：${profileSummary}，给出2-3句个性化的鼓励。`;
    } else {
      systemPrompt += ' 给出2-3句个性化的鼓励。';
    }
  } else if (feedbackLevel === 'insight') {
    systemPrompt = '你是一个温暖的成长伙伴。分析用户最近7天的记录，发现一个行为模式或成长趋势，用2-3句话分享这个洞察。语气温暖，像朋友聊天一样。';
    if (profileSummary) {
      systemPrompt += ` 用户画像：${profileSummary}。`;
    }
  }

  if (safetyNet.isTriggered) {
    if (safetyNet.isSevere) {
      systemPrompt += ` 用户可能正在经历严重的情绪困扰，请在反馈末尾自然地附上危机热线信息："${CRISIS_HOTLINE}"。语气要温柔，不要突兀。`;
    } else {
      systemPrompt += ' 用户连续几天情绪低落，请在反馈中自然地加入温暖的关怀，并建议一个非常低门槛的小行动，例如"今天试试给自己倒杯温水"。不要说教。';
    }
  }

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const {
      record_content,
      goal_title,
      goal_progress,
      feedback_level = 'micro',
      record_id,
      follow_up_question,
      follow_up_answer,
    } = await request.json();

    if (follow_up_question && follow_up_answer && record_id) {
      let feedback: string | null = null;

      if (process.env.ZHIPU_API_KEY) {
        try {
          const systemPrompt = '我是雪球！用户刚刚回答了我的追问，请根据他们的回答给出简短、温暖的反馈。用第一人称说话，回复1-2句话即可，语气像朋友聊天一样自然。例如："原来是这样！谢谢你告诉我~"';

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
                { role: 'user', content: `追问：${follow_up_question}\n用户回答：${follow_up_answer}` },
              ],
              temperature: 0.8,
            }),
          });

          const data = await response.json();
          feedback = data.choices?.[0]?.message?.content?.trim();
        } catch (aiError) {
          console.error('ZhipuAI follow-up answer error:', aiError);
        }
      }

      if (!feedback) {
        const FEEDBACK_TEMPLATES = [
          '原来是这样！谢谢你告诉我更多细节，这让我的故事更丰富了 ✨',
          '听到了！你的描述让我更理解这个时刻对你的意义 🌟',
          '感谢你展开说，这样的记录让我更有温度了 ❄️',
          '太棒了！这样的细节让我更加充实 💪',
        ];
        feedback = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
      }

      db.createConversation({ record_id, role: 'user', content: follow_up_answer });
      db.createConversation({ record_id, role: 'assistant', content: feedback });

      return createSuccessResponse({
        is_follow_up: false,
        is_follow_up_answer: true,
        feedback,
      });
    }

    if (!record_content) {
      return createErrorResponse('record_content is required', 400);
    }

    const validLevels: FeedbackLevel[] = ['micro', 'deep', 'insight'];
    const level: FeedbackLevel = validLevels.includes(feedback_level) ? feedback_level : 'micro';

    const emotionResult = await analyzeEmotion(record_content);
    const emotion: EmotionType = emotionResult.emotion;

    const recentRecords = await getUserRecentRecords(userId);

    const profile = buildUserProfile(recentRecords);
    const profileSummary = buildProfileSummary(profile);

    const safetyNet = checkEmotionSafetyNet(recentRecords, emotion);

    const contentLength = record_content.length;
    const hasMinimalInfo = !/[。！？!？~～]$/.test(record_content.trim());
    const shouldFollowUp = contentLength < 15 ||
                           (contentLength < 30 && hasMinimalInfo) ||
                           (contentLength >= 30 && Math.random() < 0.25);

    if (shouldFollowUp) {
      let followUp: string | null = null;

      if (process.env.ZHIPU_API_KEY) {
        try {
          let followUpSystemPrompt = '我是雪球！用户刚刚简短地记录了一件事，请温和地追问一个具体的问题，帮助用户展开描述。用第一人称说话，追问要自然、温暖，不超过2句话。例如："嘿嘿，能多说说吗？"';
          if (emotion === 'depressed') {
            followUpSystemPrompt = '我是雪球！用户刚刚简短地记录了一件事，且情绪似乎不太好。请温和地表达关心，可以轻柔地问问感受，不要追问太多。用第一人称说话，1句话即可。例如："今天还好吗？我在呢~"';
          } else if (emotion === 'anxious') {
            followUpSystemPrompt = '我是雪球！用户刚刚简短地记录了一件事，且似乎有些焦虑。请先安抚，再温和地追问一个简单的问题。用第一人称说话，1-2句话。例如："别急~能告诉我发生了什么吗？"';
          }

          const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'glm-4-flash',
              messages: [
                { role: 'system', content: followUpSystemPrompt },
                { role: 'user', content: `用户记录了：${record_content}` },
              ],
              temperature: 0.8,
            }),
          });

          const data = await response.json();
          followUp = data.choices?.[0]?.message?.content?.trim();
        } catch (aiError) {
          console.error('ZhipuAI follow-up error, using fallback:', aiError);
        }
      }

      if (!followUp) {
        followUp = FOLLOW_UP_TEMPLATES[Math.floor(Math.random() * FOLLOW_UP_TEMPLATES.length)];
      }

      return createSuccessResponse({
        is_follow_up: true,
        follow_up: followUp,
        emotion,
      });
    }

    let effectiveLevel = level;
    if (level === 'micro' && record_content.length > 20) {
      effectiveLevel = 'deep';
    }

    const systemPrompt = buildSystemPrompt(emotion, effectiveLevel, profileSummary, safetyNet);

    let userMessage = '';
    if (effectiveLevel === 'insight') {
      const recentContent = recentRecords.slice(0, 7).map((r, i) => `${i + 1}. ${r.content}`).join('\n');
      userMessage = `用户最近7天的记录：\n${recentContent}\n\n当前记录：${record_content}`;
    } else {
      userMessage = `我记录了一个小成功：${record_content}${goal_title ? `，属于目标：${goal_title}` : ''}${goal_progress !== undefined ? `，目标进度：${goal_progress}%` : ''}`;
    }

    let feedback: string | null = null;

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
              { role: 'user', content: userMessage },
            ],
            temperature: 0.8,
          }),
        });

        const data = await response.json();
        feedback = data.choices?.[0]?.message?.content?.trim();
      } catch (aiError) {
        console.error('ZhipuAI feedback error, trying OpenAI:', aiError);
      }
    }

    if (!feedback && process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.8,
          }),
        });

        const data = await response.json();
        feedback = data.choices?.[0]?.message?.content;
      } catch (openaiError) {
        console.error('OpenAI API error, using fallback:', openaiError);
      }
    }

    if (!feedback) {
      if (effectiveLevel === 'micro') {
        const microTemplates = [
          '每一步都让我变得更大！🌟',
          '嘿嘿，我又长大了一点点！❄️',
          '你做到了！我又变强了！💪',
          '继续滚起来！我越来越大了！⛄',
        ];
        feedback = microTemplates[Math.floor(Math.random() * microTemplates.length)];
      } else if (effectiveLevel === 'insight') {
        feedback = '从你最近的记录来看，你在持续积累小成功，这种坚持本身就是最大的成长。我又长大了一圈！🌟';
      } else {
        const emotionTemplates: Record<string, string[]> = {
          positive: [
            `哇！你记录了"${record_content}"，我又变大了一圈！每一步小小的成功都在让我越滚越大。嘿嘿~继续保持！`,
            `你做得很好！"${record_content}"——这样的小成功值得被记住。我会一直陪着你长大的！`,
          ],
          anxious: [
            `别急，慢慢来~你已经在面对了，这本身就是勇气。现在能做的一件小事是什么？先完成它，我就会开始滚动。🌬️`,
            `焦虑的时候，试试只关注当下这一步。你已经记录了"${record_content}"，这就是行动。一步一步来就好，我在呢~🌱`,
          ],
          depressed: [
            '今天能来就已经很棒了，我在呢~哪怕只滚了一点点，也是在前进。☁️',
            '你不需要做到完美，存在本身就值得被看见。慢慢来，我会一直陪着你。🤍',
          ],
          negative: [
            `即使今天不顺利，你依然选择了记录，这份觉察力很珍贵。明天又是新的开始，我不会因为一天的停顿而消失。🌱`,
            `记录本身就是一种力量。"${record_content}"——你正在面对，这比逃避勇敢得多。我又为你骄傲了一点点~💪`,
          ],
          neutral: [
            `又一个小成功被记录下来了！"${record_content}"说明你正在稳步前进。每一个大成就都是由这样的小成功组成的！我又长大了一点~`,
            `记录下这一刻，就是给我添上了一层新雪。继续前进，我会越来越大！❄️`,
          ],
        };
        const templates = emotionTemplates[emotion] || emotionTemplates.neutral;
        feedback = templates[Math.floor(Math.random() * templates.length)];
      }
    }

    if (safetyNet.isSevere && !feedback.includes('400-161-9995')) {
      feedback = `${feedback}\n\n${CRISIS_HOTLINE}`;
    } else if (safetyNet.isTriggered && !safetyNet.isSevere) {
      if (!feedback.includes('温水') && !feedback.includes('小事') && !feedback.includes('试试')) {
        feedback = `${feedback} 今天试试给自己倒杯温水吧。🤍`;
      }
    }

    const discoveryResult = discover(recentRecords);

    return createSuccessResponse({
      is_follow_up: false,
      feedback,
      emotion,
      feedback_level: effectiveLevel,
      discovery: discoveryResult.hasDiscovery ? discoveryResult.discovery : undefined,
    });
  } catch (error: unknown) {
    console.error('Error in feedback route:', error);
    return createErrorResponse((error as Error).message || 'Failed to generate feedback');
  }
}
