import { NextRequest } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { targetUrl, headers, body, isOllama } = await request.json();

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: { message: '缺少目标 API URL' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('流式代理请求目标:', targetUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    let requestUrl = targetUrl;
    if (isOllama && !targetUrl.includes('/api/generate')) {
      const baseUrl = targetUrl.includes('/api/')
        ? targetUrl.substring(0, targetUrl.indexOf('/api/'))
        : targetUrl;
      requestUrl = `${baseUrl}/api/generate`;
    }

    const requestBody = isOllama ? {
      model: body.model || 'llama2',
      prompt: Array.isArray(body.messages) ? body.messages[body.messages.length - 1].content : body.prompt,
      system: Array.isArray(body.messages) ? body.messages[0]?.content : undefined,
      format: 'json',
      stream: true
    } : { ...body, stream: true };

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isOllama ? {} : headers),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    };

    let response: Response;
    try {
      response = await fetch(requestUrl, fetchOptions);
    } catch (e) {
      if (requestUrl.includes('localhost')) {
        const altIpv4 = requestUrl.replace('localhost', '127.0.0.1');
        response = await fetch(altIpv4, fetchOptions);
      } else {
        throw e;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`服务器返回错误：${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取流式响应');
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }

            if (isOllama) {
              const decoder = new TextDecoder();
              const chunk = decoder.decode(value);
              
              try {
                const data = JSON.parse(chunk);
                if (data.response) {
                  const formattedChunk = `data: ${JSON.stringify({
                    choices: [{ delta: { content: data.response }, finish_reason: data.done ? 'stop' : null }]
                  })}\n\n`;
                  controller.enqueue(encoder.encode(formattedChunk));
                }
                if (data.done) {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }
              } catch {
                controller.enqueue(value);
              }
            } else {
              controller.enqueue(value);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('流式代理错误:', error);
    return new Response(JSON.stringify({
      error: { message: error instanceof Error ? error.message : '流式代理请求失败' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}