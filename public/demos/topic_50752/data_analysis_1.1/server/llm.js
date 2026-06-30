/**
 * OpenAI 兼容的 Chat Completions 客户端。
 * 支持流式输出与工具调用（function calling）增量解析。
 */

function normalizeBaseUrl(baseUrl) {
  let url = (baseUrl || "").trim().replace(/\/+$/, "");
  if (!url) url = "https://api.openai.com/v1";
  if (!/\/(v1|chat|completions|openai)/i.test(url) && /^https?:\/\/[^/]+$/.test(url)) {
    url += "/v1";
  }
  return url;
}

export async function streamChat(config, messages, tools, handlers = {}, signal = null) {
  const base = normalizeBaseUrl(config.baseUrl);
  const endpoint = `${base}/chat/completions`;

  const body = {
    model: config.model,
    messages,
    stream: true,
    temperature: config.temperature ?? 0.2,
  };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey || ""}`,
    },
    body: JSON.stringify(body),
    signal: signal ?? undefined,
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`LLM 接口错误 ${resp.status}: ${text.slice(0, 500)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  let content = "";
  const toolCallsMap = new Map();
  let finishReason = null;

  const handleEvent = (dataStr) => {
    if (dataStr === "[DONE]") return;
    let json;
    try { json = JSON.parse(dataStr); } catch { return; }
    const choice = json.choices?.[0];
    if (!choice) return;
    const delta = choice.delta || {};

    if (delta.content) {
      content += delta.content;
      handlers.onContentDelta?.(delta.content);
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolCallsMap.has(idx)) {
          toolCallsMap.set(idx, { id: tc.id || "", name: "", argsStr: "" });
        }
        const entry = toolCallsMap.get(idx);
        if (tc.id) entry.id = tc.id;
        if (tc.function?.name) entry.name += tc.function.name;
        if (tc.function?.arguments) entry.argsStr += tc.function.arguments;
      }
    }

    if (choice.finish_reason) finishReason = choice.finish_reason;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      let line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("data:")) {
        const dataStr = line.slice(5).trim();
        handleEvent(dataStr);
      }
    }
  }

  const toolCalls = [...toolCallsMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({
      id: v.id || `call_${Math.random().toString(36).slice(2, 10)}`,
      type: "function",
      function: { name: v.name, arguments: v.argsStr || "{}" },
    }));

  return { content, toolCalls, finishReason };
}

export async function testConfig(config) {
  const base = normalizeBaseUrl(config.baseUrl);
  const endpoint = `${base}/chat/completions`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey || ""}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: "ping，请只回复 pong" }],
      stream: false,
      max_tokens: 16,
    }),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${text.slice(0, 300)}`);
  }
  let reply = "";
  try {
    reply = JSON.parse(text).choices?.[0]?.message?.content || "";
  } catch { /* ignore */ }
  return reply;
}