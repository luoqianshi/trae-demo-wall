import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ollamaUrl } = await request.json();
    
    const baseUrl = ollamaUrl.includes('/api/')
      ? ollamaUrl.substring(0, ollamaUrl.indexOf('/api/'))
      : ollamaUrl;
    const tagsUrl = `${baseUrl}/api/tags`;

    console.log('获取 Ollama 模型列表:', tagsUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(tagsUrl, { signal: controller.signal });
    } catch (e) {
      if (tagsUrl.includes('localhost')) {
        const altIpv4 = tagsUrl.replace('localhost', '127.0.0.1');
        response = await fetch(altIpv4, { signal: controller.signal });
      } else {
        throw e;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.status}`);
    }

    const data = await response.json();
    
    let modelsList: string[] = [];
    if (data.models && Array.isArray(data.models)) {
      modelsList = data.models.map((model: Record<string, unknown>) => 
        typeof model.name === 'string' ? model.name : ''
      ).filter(Boolean);
    }

    return NextResponse.json({ models: modelsList });
  } catch (error) {
    console.error('获取 Ollama 模型列表失败:', error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }
}