// ====== 问答 API 路由 ======
// POST /api/ask — 接收 AskRequest，调用 runAgentPipeline，返回 AskResult
// 支持流式更新：stream=true 或 Accept: text/event-stream 时通过 SSE 推送 Agent 步骤
import type { AskRequest, AgentStep } from '@/lib/types';
import { runAgentPipeline } from '@/app/api/agents';

/** POST /api/ask — 普通模式返回完整 JSON，流式模式通过 SSE 逐步推送 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as AskRequest;
    const { query, scene } = body;

    if (!query || query.trim().length === 0) {
      return Response.json(
        { error: '参数错误', message: 'query 不能为空' },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const wantsStream =
      url.searchParams.get('stream') === 'true' ||
      request.headers.get('accept')?.includes('text/event-stream');

    if (wantsStream) {
      return handleStreamResponse(query, scene);
    }

    const result = await runAgentPipeline(query, scene);
    return Response.json(result);
  } catch (error) {
    console.error('[API /ask] 错误:', error);
    return Response.json(
      { error: '服务器内部错误', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}

/** 处理流式响应（SSE）：逐步推送 Agent 步骤，最后推送完整结果 */
function handleStreamResponse(query: string, scene?: AskRequest['scene']): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await runAgentPipeline(query, scene, (step: AgentStep) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'step', step })}\n\n`));
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`));
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : '未知错误',
        })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
