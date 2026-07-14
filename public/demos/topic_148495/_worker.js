/**
 * Cloudflare Pages _worker.js — 统一处理静态文件 + AI 代理
 * 路径: /api/proxy → DeepSeek API
 * 其他: 静态文件
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // AI 代理
    if (url.pathname === '/api/proxy' && request.method === 'POST') {
      try {
        const proxyReq = await request.json();
        if (!proxyReq || !proxyReq.target_url) {
          return new Response(JSON.stringify({ error: 'Invalid proxy request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const apiRes = await fetch(proxyReq.target_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': proxyReq.auth || '',
          },
          body: JSON.stringify(proxyReq.body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await apiRes.json();

        return new Response(JSON.stringify(data), {
          status: apiRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'AI 服务暂时不可用，请稍后再试' }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', ai_api: 'connected' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 其余请求交给 Pages 静态资源
    return env.ASSETS.fetch(request);
  }
};