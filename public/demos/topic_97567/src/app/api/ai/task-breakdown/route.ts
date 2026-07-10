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

    const { task_id, goal_title, goal_description } = await request.json();

    if (!task_id || !goal_title) {
      return createErrorResponse('task_id and goal_title are required', 400);
    }

    let tasks;

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
                content: '你是一个任务分解专家。请根据用户的目标，生成5个循序渐进的任务。每个任务包含title、description、difficulty(1-5)、order字段。请以JSON数组格式返回。',
              },
              {
                role: 'user',
                content: `请为以下目标生成5个任务：\n目标标题：${goal_title}\n目标描述：${goal_description || '无'}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        tasks = JSON.parse(content);
      } catch (openaiError) {
        console.error('OpenAI API error, using fallback:', openaiError);
      }
    }

    if (!tasks) {
      tasks = [
        { title: `了解${goal_title}的基础概念`, description: `开始了解${goal_title}的基本知识和概念`, difficulty: 1, order: 1, status: 'pending' },
        { title: `学习${goal_title}的核心方法`, description: `深入学习${goal_title}的核心方法和技巧`, difficulty: 2, order: 2, status: 'pending' },
        { title: `${goal_title}的实践练习`, description: `通过实践来巩固${goal_title}的知识`, difficulty: 3, order: 3, status: 'pending' },
        { title: `${goal_title}的进阶学习`, description: `进一步深入学习${goal_title}的高级内容`, difficulty: 4, order: 4, status: 'pending' },
        { title: `${goal_title}的综合应用`, description: `将${goal_title}的知识综合应用到实际中`, difficulty: 5, order: 5, status: 'pending' },
      ];
    }

    const savedTasks = tasks.map((task: { title: string; description: string; difficulty: number; status?: string }) =>
      db.createTask({
        user_id: userId,
        goal_id: null,
        title: task.title,
        description: task.description,
        priority: task.difficulty <= 2 ? 'low' : task.difficulty <= 4 ? 'medium' : 'high',
        status: task.status || 'pending',
      })
    );

    return createSuccessResponse({ tasks: savedTasks }, 201);
  } catch (error: unknown) {
    console.error('Error in task-breakdown route:', error);
    return createErrorResponse((error as Error).message || 'Failed to breakdown task');
  }
}
