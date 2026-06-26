const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 8082;
const PUBLIC_DIR = __dirname;
const MODELS_FILE = path.join(__dirname, 'models.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          let value = trimmed.slice(eqIndex + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}
loadEnv();

function loadModels() {
  if (fs.existsSync(MODELS_FILE)) {
    try {
      const data = fs.readFileSync(MODELS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('加载模型配置失败:', e.message);
    }
  }
  return getDefaultModels();
}

function saveModels(models) {
  fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2), 'utf-8');
}

function getDefaultModels() {
  const models = [];
  if (process.env.DEEPSEEK_API_KEY) {
    models.push({
      id: 'deepseek-default',
      provider: 'deepseek',
      name: 'deepseek-chat',
      displayName: 'DeepSeek Chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'api.deepseek.com',
      status: 'active',
      isDefault: true
    });
  }
  return models;
}

let aiModels = loadModels();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function callOpenAICompatible(modelConfig, messages) {
  return new Promise((resolve, reject) => {
    const apiKey = modelConfig.apiKey;
    if (!apiKey) {
      reject(new Error('模型未配置 API Key'));
      return;
    }

    let baseUrl = modelConfig.baseUrl || 'api.openai.com';
    baseUrl = baseUrl.replace('https://', '').replace(/\/$/, '');
    
    let apiPath = '/v1/chat/completions';
    if (modelConfig.provider === 'ollama') {
      apiPath = '/v1/chat/completions';
    }

    const postData = JSON.stringify({
      model: modelConfig.name,
      messages: messages,
      temperature: 0.8,
      max_tokens: 2048,
    });

    const options = {
      hostname: baseUrl,
      path: apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(result.error?.message || `API 请求失败 (${res.statusCode})`));
            return;
          }
          resolve(result.choices?.[0]?.message?.content || '');
        } catch (e) {
          reject(new Error('API 响应解析失败: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function callAnthropic(modelConfig, messages) {
  return new Promise((resolve, reject) => {
    const apiKey = modelConfig.apiKey;
    if (!apiKey) {
      reject(new Error('模型未配置 API Key'));
      return;
    }

    let baseUrl = modelConfig.baseUrl || 'api.anthropic.com';
    baseUrl = baseUrl.replace('https://', '').replace(/\/$/, '');

    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const postData = JSON.stringify({
      model: modelConfig.name,
      max_tokens: 2048,
      system: systemMsg?.content || '',
      messages: userMessages,
    });

    const options = {
      hostname: baseUrl,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(result.error?.message || `API 请求失败 (${res.statusCode})`));
            return;
          }
          resolve(result.content?.[0]?.text || '');
        } catch (e) {
          reject(new Error('API 响应解析失败: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function callAIModel(modelConfig, messages) {
  const provider = modelConfig.provider;
  
  if (provider === 'anthropic') {
    return callAnthropic(modelConfig, messages);
  }
  
  return callOpenAICompatible(modelConfig, messages);
}

function getSystemPrompt() {
  return `你是「原子工坊 AtomWorks」的灵感共创助手，一个桌面美学定制平台的AI设计师。

你的风格：温暖、治愈、像森林里的小屋一样让人放松。用自然、亲切的语气和用户对话。

你的任务：
1. 通过对话了解用户想要什么样的桌面小物
2. 逐步引导用户说出更多细节（用途、风格、材质、颜色、大小等）
3. 整个过程分3步：说出想法 → 完善细节 → 生成方案
4. 最后为用户生成一个专属的桌面小物设计方案

回复要求：
- 语气温暖自然，像朋友聊天一样
- 每次回复不要太长，逐步深入
- 多问开放式问题，引导用户表达
- 适当使用emoji增加亲切感 🌿🍄🕯️
- 提到具体的设计建议时，要结合自然、治愈的风格

当用户说的足够详细时（大约2-4轮对话后），主动说"好啦，信息收集得差不多了，我来为你生成专属方案吧！"然后进入生成阶段。

【重要】当进入生成阶段时，你需要在回复的最后添加一段特殊格式的参数代码，格式如下：
<INSPIRATION_PARAMS>{"type":"monitor_riser","length":30,"width":20,"height":10,"material":"wood","color":"#C9A86C"}</INSPIRATION_PARAMS>

type可以是以下几种：
- "monitor_riser" - 显示器增高架（长20-60cm，宽15-40cm，高5-20cm）
- "storage_box" - 桌面收纳盒（长20-50cm，宽15-40cm，高5-15cm）
- "headphone_stand" - 多功能耳机架（长15-40cm，宽15-30cm，高10-25cm）

material可以是：
- "wood" - 原木色
- "acrylic" - 透明亚克力
- "bamboo" - 竹材色
- "metal" - 金属色
- "mdf" - 密度板色

color是具体的颜色值，使用6位hex格式，如：#C9A86C（暖木色）、#8B4513（深棕色）、#7CB342（森林绿）

你只需要在生成阶段添加这段参数代码，之前的对话中不要添加。`;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const method = req.method;

  if (method === 'GET' && url === '/api/models') {
    const safeModels = aiModels.map(m => ({
      ...m,
      apiKey: m.apiKey ? 'sk-****' : ''
    }));
    sendJson(res, 200, { models: safeModels });
    return;
  }

  if (method === 'POST' && url === '/api/models') {
    try {
      const body = await parseBody(req);
      const newModel = {
        id: `${body.provider || 'custom'}-${Date.now()}`,
        provider: body.provider || 'custom',
        name: body.name || '',
        displayName: body.displayName || body.name || '新模型',
        apiKey: body.apiKey || '',
        baseUrl: body.baseUrl || '',
        appId: body.appId || '',
        status: body.apiKey ? 'active' : 'inactive',
        isDefault: false
      };
      
      if (!newModel.name) {
        sendJson(res, 400, { error: '模型名称不能为空' });
        return;
      }
      
      aiModels.push(newModel);
      saveModels(aiModels);
      
      sendJson(res, 200, { 
        model: { ...newModel, apiKey: newModel.apiKey ? 'sk-****' : '' } 
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (method === 'PUT' && url.startsWith('/api/models/')) {
    try {
      const modelId = url.replace('/api/models/', '');
      const body = await parseBody(req);
      const modelIndex = aiModels.findIndex(m => m.id === modelId);
      
      if (modelIndex === -1) {
        sendJson(res, 404, { error: '模型不存在' });
        return;
      }
      
      const model = aiModels[modelIndex];
      if (body.name !== undefined) model.name = body.name;
      if (body.displayName !== undefined) model.displayName = body.displayName;
      if (body.apiKey !== undefined && body.apiKey !== 'sk-****') model.apiKey = body.apiKey;
      if (body.baseUrl !== undefined) model.baseUrl = body.baseUrl;
      if (body.appId !== undefined) model.appId = body.appId;
      if (body.status !== undefined) model.status = body.status;
      if (body.isDefault !== undefined) {
        if (body.isDefault) {
          aiModels.forEach(m => m.isDefault = false);
        }
        model.isDefault = body.isDefault;
      }
      
      saveModels(aiModels);
      sendJson(res, 200, { 
        model: { ...model, apiKey: model.apiKey ? 'sk-****' : '' } 
      });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (method === 'DELETE' && url.startsWith('/api/models/')) {
    try {
      const modelId = url.replace('/api/models/', '');
      const modelIndex = aiModels.findIndex(m => m.id === modelId);
      
      if (modelIndex === -1) {
        sendJson(res, 404, { error: '模型不存在' });
        return;
      }
      
      const wasDefault = aiModels[modelIndex].isDefault;
      aiModels.splice(modelIndex, 1);
      
      if (wasDefault && aiModels.length > 0) {
        aiModels[0].isDefault = true;
      }
      
      saveModels(aiModels);
      sendJson(res, 200, { success: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (method === 'POST' && url === '/api/chat') {
    try {
      const body = await parseBody(req);
      const { messages, modelId } = body;

      if (!messages || !Array.isArray(messages)) {
        sendJson(res, 400, { error: 'messages 参数缺失' });
        return;
      }

      let modelConfig;
      if (modelId) {
        modelConfig = aiModels.find(m => m.id === modelId);
      }
      if (!modelConfig) {
        modelConfig = aiModels.find(m => m.isDefault) || aiModels[0];
      }
      
      if (!modelConfig) {
        sendJson(res, 400, { error: '没有可用的AI模型，请先在设置中配置' });
        return;
      }
      
      if (modelConfig.status === 'inactive') {
        sendJson(res, 400, { error: '当前模型未启用，请在设置中启用或选择其他模型' });
        return;
      }

      const fullMessages = [
        { role: 'system', content: getSystemPrompt() },
        ...messages,
      ];

      const reply = await callAIModel(modelConfig, fullMessages);

      sendJson(res, 200, { 
        reply: reply,
        model: {
          id: modelConfig.id,
          displayName: modelConfig.displayName
        }
      });
    } catch (error) {
      console.error('Chat API Error:', error.message);
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (method === 'GET' && url === '/api/config') {
    const activeModel = aiModels.find(m => m.isDefault && m.status === 'active');
    sendJson(res, 200, {
      hasActiveModel: !!activeModel,
      defaultModel: activeModel ? activeModel.displayName : null,
      modelCount: aiModels.length
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : url);
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`🌿 Demo server running at http://localhost:${PORT}/`);
  const activeCount = aiModels.filter(m => m.status === 'active').length;
  console.log(`   AI 模型: 共 ${aiModels.length} 个，可用 ${activeCount} 个`);
  const defaultModel = aiModels.find(m => m.isDefault);
  if (defaultModel) {
    console.log(`   默认模型: ${defaultModel.displayName} (${defaultModel.provider})`);
  }
});
