import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/local-db';
import { extractToken, extractUserIdFromToken, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

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

    const { time_range = 'week' } = await request.json();

    const growthData = db.getGrowthData(userId);
    const records = db.getRecords(userId);
    const tasks = db.getTasks(userId);

    let report;

    if (process.env.OPENAI_API_KEY) {
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
              {
                role: 'system',
                content: '你是一个成长分析专家。根据用户的成长数据，生成一份详细的成长报告。使用Markdown格式，包含总体情况、数据概览、鼓励与建议等部分。用雪球滚动的比喻来描述成长。',
              },
              {
                role: 'user',
                content: `请为我生成一份成长报告（时间范围：${time_range === 'week' ? '本周' : time_range === 'month' ? '本月' : '全部时间'}）：\n雪球大小：${growthData?.snowball_size || 0}\n完成任务数：${growthData?.tasks_completed || 0}\n记录数：${growthData?.records_count || 0}\n成就数：${growthData?.achievements_count || 0}\n最近记录：${records.slice(0, 5).map((r: { content: string }) => r.content).join('、')}\n任务列表：${tasks.map((t: { title: string; status: string }) => `${t.title}(${t.status})`).join('、')}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        report = data.choices?.[0]?.message?.content;
      } catch (openaiError) {
        console.error('OpenAI API error, using fallback:', openaiError);
      }
    }

    if (!report) {
      report = `# 成长报告（${time_range === 'week' ? '本周' : time_range === 'month' ? '本月' : '全部时间'}）\n\n` +
        `## 总体情况\n` +
        `你的雪球已经成长到 ${growthData?.snowball_size || 0} 的大小！\n\n` +
        `## 数据概览\n` +
        `- 完成任务数：${growthData?.tasks_completed || 0}\n` +
        `- 记录数：${growthData?.records_count || 0}\n` +
        `- 成就数：${growthData?.achievements_count || 0}\n\n` +
        `## 鼓励与建议\n` +
        `你正在稳步前进！每一次记录和任务完成都在让你的雪球越滚越大。建议继续保持记录的习惯，设定更多小目标，让成长可视化！\n\n` +
        `继续加油，你做得很棒！🌟`;
    }

    return createSuccessResponse({ report });
  } catch (error: unknown) {
    console.error('Error in growth-report route:', error);
    return createErrorResponse((error as Error).message || 'Failed to generate growth report');
  }
}
