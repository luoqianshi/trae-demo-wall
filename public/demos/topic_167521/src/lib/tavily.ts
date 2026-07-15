// Tavily 搜索 API（浏览器直调，CORS 已确认支持）

export interface TavilySearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function tavilySearch(query: string, apiKey: string): Promise<TavilySearchResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: 5,
      search_depth: 'basic',
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Tavily 搜索失败 (${response.status})${errorText ? ': ' + errorText.slice(0, 200) : ''}`);
  }

  const data = await response.json();
  const results: TavilySearchResult[] = (data.results || []).map((r: any) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.content || '',
  }));

  return results;
}
