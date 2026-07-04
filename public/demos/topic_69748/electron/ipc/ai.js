/**
 * AI 功能 IPC 处理器
 */
let _getDb = null;

function registerAiHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('get-ai-config', () => {
    const db = _getDb();
    const r = db.prepare('SELECT * FROM ai_config WHERE id = ?').get('default');
    return r || null;
  });

  ipcMain.handle('save-ai-config', (_, data) => {
    const db = _getDb();
    const exists = db.prepare('SELECT COUNT(*) as c FROM ai_config WHERE id = ?').get('default');
    if (exists.c > 0) {
      db.prepare('UPDATE ai_config SET apiUrl = ?, apiKey = ?, model = ?, promptTemplate = ? WHERE id = ?')
        .run(data.apiUrl || '', data.apiKey || '', data.model || '', data.promptTemplate || '', 'default');
    } else {
      db.prepare('INSERT INTO ai_config (id, apiUrl, apiKey, model, promptTemplate) VALUES (?, ?, ?, ?, ?)')
        .run('default', data.apiUrl || '', data.apiKey || '', data.model || '', data.promptTemplate || '');
    }
    return { ok: true };
  });

  ipcMain.handle('run-ai-extract', async (_, chatText) => {
    const db = _getDb();
    const cfg = db.prepare('SELECT * FROM ai_config WHERE id = ?').get('default');
    if (!cfg || !cfg.apiUrl || !cfg.apiKey || !cfg.model) {
      return { ok: false, error: '请先在设置页配置 AI API 地址、密钥和模型' };
    }
    const prompt = (cfg.promptTemplate || '').replace('{chat_records}', chatText || '（暂无聊天记录）');
    try {
      const resp = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: '你是一个项目进展分析助手。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });
      if (!resp.ok) {
        return { ok: false, error: `AI API 请求失败: ${resp.status} ${resp.statusText}` };
      }
      const respData = await resp.json();
      const text = respData && respData.choices && respData.choices[0] && respData.choices[0].message && respData.choices[0].message.content || '';
      let jsonText = text.trim();
      const m = jsonText.match(/\{[\s\S]*\}/);
      if (m) jsonText = m[0];
      let structured = null;
      try {
        structured = JSON.parse(jsonText);
      } catch (e) {
        structured = null;
      }
      return { ok: true, raw: text, structured, chatText: chatText || '' };
    } catch (e) {
      return { ok: false, error: '调用 AI 失败: ' + e.message };
    }
  });
}

module.exports = { registerAiHandlers };
