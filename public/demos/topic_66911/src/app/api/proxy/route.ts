import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const getAllowedOrigin = (origin: string | null): string => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  if (!origin || allowedOrigins.includes(origin)) {
    return origin || allowedOrigins[0];
  }
  return allowedOrigins[0];
};

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);

    const { targetUrl, headers, body, isOllama } = await request.json();

    if (!targetUrl) {
      return NextResponse.json(
        { error: { message: '缺少目标 API URL' } },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    console.log('代理请求目标:', targetUrl);
    console.log('代理请求头:', JSON.stringify(headers).replace(/Bearer [^"]+/, 'Bearer [REDACTED]'));
    console.log('代理请求体:', JSON.stringify(body, null, 2));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);

      const requestBody = isOllama ? {
        model: body.model || 'llama2',
        prompt: Array.isArray(body.messages) ? body.messages[body.messages.length - 1].content : body.prompt,
        system: Array.isArray(body.messages) ? body.messages[0]?.content : undefined,
        format: 'json',
        stream: false
      } : body;

      let requestUrl = targetUrl;
      if (isOllama && !targetUrl.includes('/api/generate')) {
        const baseUrl = targetUrl.includes('/api/')
          ? targetUrl.substring(0, targetUrl.indexOf('/api/'))
          : targetUrl;
        requestUrl = `${baseUrl}/api/generate`;
      }

      console.log('最终请求 URL:', requestUrl);

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
        const errMsg = e instanceof Error ? e.message : String(e);
        console.warn('初次 fetch 失败，准备回退:', errMsg);
        if (requestUrl.includes('localhost')) {
          const altIpv4 = requestUrl.replace('localhost', '127.0.0.1');
          try {
            console.log('尝试 IPv4 回退 URL:', altIpv4);
            response = await fetch(altIpv4, fetchOptions);
            requestUrl = altIpv4;
          } catch (e2) {
            const altIpv6 = requestUrl.replace('http://localhost', 'http://[::1]').replace('https://localhost', 'https://[::1]');
            console.log('尝试 IPv6 回退 URL:', altIpv6);
            response = await fetch(altIpv6, fetchOptions);
            requestUrl = altIpv6;
          }
        } else {
          throw e;
        }
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('代理请求响应错误:', response.status, errorText);
        throw new Error(`服务器返回错误：${response.status} ${errorText}`);
      }

      if (isOllama) {
        const ollamaResponse = await response.json();
        console.log('Ollama 原始响应:', JSON.stringify(ollamaResponse));

        let content = ollamaResponse.response || '无内容生成';

        try {
          if (typeof content === 'string' && content.trim().startsWith('{')) {
            const parsedContent = JSON.parse(content);

            if (parsedContent.article && parsedContent.article.content) {
              if (Array.isArray(parsedContent.article.content)) {
                content = parsedContent.article.content.join('\n\n');
              } else {
                content = parsedContent.article.content.toString();
              }
            } else if (parsedContent.content) {
              if (Array.isArray(parsedContent.content)) {
                content = parsedContent.content.join('\n\n');
              } else {
                content = parsedContent.content.toString();
              }
            } else if (parsedContent.text) {
              content = parsedContent.text.toString();
            } else if (parsedContent.title && typeof parsedContent.title === 'string') {
              content = `# ${parsedContent.title}`;
              if (parsedContent.content) {
                content += `\n\n${Array.isArray(parsedContent.content) ? parsedContent.content.join('\n\n') : parsedContent.content.toString()}`;
              }
            }
          }

          content = content.replace(/[#*`_~]/g, '');

          if (typeof content !== 'string') {
            content = String(content);
          }
        } catch (e) {
          console.log('解析Ollama响应内容失败，使用原始响应:', e);
          content = String(ollamaResponse.response || '无内容生成');
        }

        return NextResponse.json({
          id: 'ollama-' + Date.now(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: body.model || 'llama2',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: content
            },
            finish_reason: ollamaResponse.done_reason || 'stop'
          }],
          usage: {
            prompt_tokens: ollamaResponse.prompt_eval_count || 0,
            completion_tokens: ollamaResponse.eval_count || 0,
            total_tokens: (ollamaResponse.prompt_eval_count || 0) + (ollamaResponse.eval_count || 0)
          }
        });
      }

      const responseData = await response.json();
      return NextResponse.json(responseData, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (fetchError) {
      console.error('代理请求失败:', fetchError);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: { message: '请求超时，请稍后重试' } },
          {
            status: 504,
            headers: {
              'Access-Control-Allow-Origin': allowedOrigin,
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      if (fetchError instanceof Error && fetchError.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: { message: '无法连接到服务，请确保服务正在运行并且端口正确' } },
          {
            status: 502,
            headers: {
              'Access-Control-Allow-Origin': allowedOrigin,
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }

      return NextResponse.json(
        {
          error: {
            message: fetchError instanceof Error ? fetchError.message : '代理请求失败',
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
            cause: fetchError instanceof Error ? String(fetchError.cause) : undefined
          }
        },
        {
          status: 502,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
  } catch (error) {
    console.error('API 代理错误:', error);
    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);

    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '代理请求失败' } },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
