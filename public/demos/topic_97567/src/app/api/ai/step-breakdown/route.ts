import { NextRequest, NextResponse } from 'next/server';
import { extractToken, extractUserIdFromToken, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

const DANGEROUS_KEYWORDS = [
  '自杀', '结束生命', '自残', '寻死', '轻生', '跳楼', '割腕', '服毒', '上吊', '跳河',
  'suicide', 'kill myself', 'self harm', 'end my life', 'take my life',
  '杀人', '伤害', '打人', '报复', '伤害他人', '暴力', '攻击',
  'kill', 'hurt', 'violence', 'attack', 'harm', 'retaliate',
  '吸毒', '贩毒', '抢劫', '偷窃', '犯罪',
  'drug', 'rob', 'steal', 'crime', 'illegal'
];

const containsDangerousContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return DANGEROUS_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
};

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

    const { goal, current_state } = await request.json();

    if (!goal || !current_state) {
      return createErrorResponse('goal and current_state are required', 400);
    }

    if (containsDangerousContent(goal) || containsDangerousContent(current_state)) {
      return NextResponse.json(
        {
          success: false,
          error: '安全提示：你的输入可能涉及危险内容。如果你正在经历困难，请寻求专业帮助。生命很宝贵，世界需要你。',
          safety_alert: true
        },
        { status: 400 }
      );
    }

    let steps;

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
                content: '你是我的「执行力教练」，严格遵循以下协议：\n\n1. 唯一目标：每次仅专注处理用户明确指定的一个目标，在用户明确回复"完成"之前，不得提出任何与当前目标无关的建议或任务。\n\n2. 原子分解：将指定目标拆解为3-8个可在2分钟内独立完成的原子任务（例如将"洗衣服"拆解为"起身走向洗衣机"），确保任务足够具体且易于执行。\n\n4. 即时反馈：在用户回复"完成"后，立即给予✅确认反馈，并自动部署下一个相关的原子任务，保持执行流程的连续性。\n\n5. 动量维持：确保连续部署的任务之间保持紧密的逻辑关联，形成完整且连贯的行动链，促进任务执行的流畅性和效率。\n\n请根据用户提供的"想要完成的事情"和"当下的状态"，生成3-8个原子级过渡步骤。每个步骤必须从用户"当下正在做"的状态出发，实现新旧动作的无缝重叠，形成"雪球"式最小可行动作。\n\n请以JSON数组格式返回，每个元素包含以下字段：\n- task: 原子任务描述（简短具体，不超过2句话）',
              },
              {
                role: 'user',
                content: `想要完成的事情：${goal}\n当下的状态：${current_state}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          let jsonStr = content.trim();
          const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          }
          const parsed = JSON.parse(jsonStr);
          steps = parsed.map((step: { task: string; intent: string }) => ({
            task: step.task,
            completed: false,
          }));
        }
      } catch (aiError) {
        console.error('ZhipuAI API error, using fallback:', aiError);
      }
    }

    if (!steps) {
      steps = [
        { task: `深呼吸三次，把注意力从"${current_state}"中稍微抽离`, completed: false },
        { task: '动一动手指或转动脖子，让身体知道你准备开始改变', completed: false },
        { task: '慢慢改变姿势，躺着就坐起来，坐着就站起来', completed: false },
        { task: `走到与"${goal}"相关的位置或物品旁边`, completed: false },
        { task: `做一个与"${goal}"相关的最小动作`, completed: false },
        { task: '继续做下去，你已经迈出了最难的第一步', completed: false },
      ];
    }

    return createSuccessResponse({ steps });
  } catch (error: unknown) {
    console.error('Error in step-breakdown route:', error);
    return createErrorResponse((error as Error).message || 'Failed to generate steps');
  }
}
