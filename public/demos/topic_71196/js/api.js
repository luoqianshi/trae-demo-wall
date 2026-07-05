// ===== 导路 - AI API模块 =====

var API_CONFIG_KEY = 'daolu_api_config';
var KB_KEY = 'daolu_knowledge_base';

// 默认知识库内容
var defaultKnowledgeBase = `《学生学业预警管理办法》关键条款

第五条 学业预警分为三个等级：
（一）红色预警：学生出现以下情况之一的，给予红色预警：
1. 学期累计缺勤超过总课时30%的；
2. 学期平均成绩低于60分的；
3. 连续两周以上无故缺勤的。
（二）橙色预警：学生出现以下情况之一的，给予橙色预警：
1. 学期累计缺勤超过总课时20%但不足30%的；
2. 学期平均成绩低于70分的；
3. 单次重要考试不及格的。
（三）蓝色关注：学生出现以下情况之一的，给予蓝色关注：
1. 学期累计缺勤超过总课时10%但不足20%的；
2. 学期平均成绩低于75分的；
3. 学习态度出现明显松懈的。

第六条 预警处理流程：
1. 预警信息由教务系统自动生成，辅导员应在收到预警后3个工作日内核实；
2. 红色预警学生须在5个工作日内安排一对一谈话；
3. 橙色预警学生须在10个工作日内安排谈话或小组辅导；
4. 蓝色关注学生可通过班会、群消息等方式进行提醒。

第七条 干预措施：
1. 一对一面谈：了解学生困难，制定改进计划；
2. 学习帮扶：安排成绩优秀学生结对帮扶；
3. 家校联系：必要时联系家长共同关注；
4. 心理咨询：对存在心理问题的学生转介心理咨询中心。

第八条 预警解除：
学生连续两周出勤正常、作业按时完成、测验成绩达标的，可申请解除预警。辅导员核实后报教务处审批。

《奖学金评定细则》关键条款

第二条 评定条件：
1. 热爱社会主义祖国，拥护中国共产党的领导；
2. 遵守宪法和法律，遵守学校规章制度，无违纪记录；
3. 学习成绩优异，社会实践、创新能力、综合素质突出。

第三条 成绩要求：
1. 一等奖学金：学期平均成绩85分以上，且单科不低于75分；
2. 二等奖学金：学期平均成绩80分以上，且单科不低于70分；
3. 三等奖学金：学期平均成绩75分以上，且单科不低于65分。

第四条 出勤要求：
学期出勤率不低于95%，无无故旷课记录。

第五条 综合测评：
奖学金评定综合考虑学业成绩（占70%）、德育表现（占15%）和综合素质（占15%）。

《学生考勤管理规定》

第三条 考勤范围包括课堂教学、实验实训、实习、军训及学校组织的其他教育教学活动。

第四条 学生因病、因事不能参加教育教学活动的，应当事先办理请假手续。
1. 请假1天以内由班长批准；
2. 请假1-3天由辅导员批准；
3. 请假3天以上由学院分管领导批准。

第五条 迟到、早退累计3次按缺勤1次计算。

第六条 无故缺勤的处理：
1. 累计缺勤达10学时，给予通报批评；
2. 累计缺勤达20学时，给予警告处分；
3. 累计缺勤达30学时，给予严重警告处分；
4. 累计缺勤达40学时，给予记过处分；
5. 累计缺勤达50学时以上，按照学籍管理规定处理。
`;

// 加载知识库
function loadKnowledgeBase() {
  try {
    var raw = localStorage.getItem(KB_KEY);
    if (raw) return raw;
  } catch(e) {}
  return defaultKnowledgeBase;
}

// 保存知识库
function saveKnowledgeBase(text) {
  try {
    if (text && text.trim()) {
      localStorage.setItem(KB_KEY, text.trim());
      showToast('success', '知识库已保存');
    } else {
      localStorage.removeItem(KB_KEY);
      showToast('info', '已清空知识库，恢复默认内容');
    }
  } catch(e) {
    showToast('error', '保存失败');
  }
}

// 检索知识库（简单关键词匹配）
function searchKnowledgeBase(query) {
  var kb = loadKnowledgeBase();
  if (!kb || !query) return [];
  var paragraphs = kb.split(/\n\n+/).filter(function(p) { return p.trim().length > 10; });
  var queryWords = query.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 1; });
  if (queryWords.length === 0) queryWords = [query.toLowerCase()];

  var scored = paragraphs.map(function(p) {
    var pLower = p.toLowerCase();
    var score = 0;
    queryWords.forEach(function(w) {
      if (pLower.indexOf(w) > -1) score += 1;
      // 标题行权重更高
      var lines = p.split('\n');
      if (lines[0] && lines[0].toLowerCase().indexOf(w) > -1) score += 2;
    });
    // 额外加分：包含数字条款的段落
    if (/第[一二三四五六七八九十\d]+条/.test(p)) score += 0.5;
    return { text: p, score: score };
  });

  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.filter(function(s) { return s.score > 0; }).slice(0, 3).map(function(s) { return s.text; });
}

// 浏览器指纹
function getBrowserFingerprint() {
  var nav = navigator;
  var scr = window.screen;
  var seed = [
    nav.userAgent,
    nav.language,
    scr.colorDepth,
    scr.width + 'x' + scr.height,
    new Date().getTimezoneOffset()
  ].join('|');
  var hash = 0;
  for (var i = 0; i < seed.length; i++) {
    var ch = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// XOR加密
function xorEncrypt(text, key) {
  if (!text) return '';
  var result = '';
  for (var i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(cipher, key) {
  if (!cipher) return '';
  try {
    var text = atob(cipher);
    var result = '';
    for (var i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch(e) { return ''; }
}

function getCryptoKey() {
  return getBrowserFingerprint() + '_daolu_salt_v1';
}

function getApiConfig() {
  try {
    var raw = localStorage.getItem(API_CONFIG_KEY);
    if (!raw) return { type: 'none' };
    var parsed = JSON.parse(raw);
    if (parsed.keyCipher) {
      parsed.key = xorDecrypt(parsed.keyCipher, getCryptoKey());
      delete parsed.keyCipher;
    }
    return parsed;
  } catch(e) {
    return { type: 'none' };
  }
}

function saveApiConfig(config) {
  try {
    var toSave = {};
    for (var k in config) toSave[k] = config[k];
    if (toSave.key) {
      toSave.keyCipher = xorEncrypt(toSave.key, getCryptoKey());
      delete toSave.key;
    }
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(toSave));
  } catch(e) {}
}

function openApiSettings() {
  document.getElementById('apiModal').style.display = 'flex';
  var config = getApiConfig();
  document.getElementById('apiType').value = config.type || 'none';
  document.getElementById('apiUrl').value = config.url || '';
  document.getElementById('apiKey').value = config.key || '';
  document.getElementById('apiModel').value = config.model || '';
  document.getElementById('apiSystemPrompt').value = config.systemPrompt || '';
  document.getElementById('apiUseProxy').checked = config.useProxy || false;
  // 加载知识库
  var kbTextarea = document.getElementById('knowledgeBaseText');
  if (kbTextarea) kbTextarea.value = loadKnowledgeBase();
  onApiTypeChange();
}

function testKnowledgeBase() {
  var queryInput = document.getElementById('kbTestQuery');
  var resultDiv = document.getElementById('kbTestResult');
  if (!queryInput || !resultDiv) return;
  var query = queryInput.value.trim();
  if (!query) {
    showToast('error', '请输入测试查询内容');
    return;
  }
  var results = searchKnowledgeBase(query);
  resultDiv.style.display = 'block';
  if (results.length === 0) {
    resultDiv.innerHTML = '<div style="padding:10px 14px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);font-size:13px;color:var(--red)"><i class="fa-solid fa-circle-info"></i> 未找到相关内容</div>';
    return;
  }
  var html = '<div style="padding:10px 14px;border-radius:8px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);font-size:13px;color:var(--green);margin-bottom:8px"><i class="fa-solid fa-check-circle"></i> 找到 ' + results.length + ' 条相关内容</div>';
  results.forEach(function(r, i) {
    html += '<div style="padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;font-size:13px;line-height:1.7"><strong style="color:var(--accent)">结果 ' + (i + 1) + '：</strong><br>' + r.replace(/\n/g, '<br>') + '</div>';
  });
  resultDiv.innerHTML = html;
}

function closeApiSettings() {
  document.getElementById('apiModal').style.display = 'none';
}

// AI模型预设配置
var apiPresets = {
  custom: { url: '', model: '', name: '自定义OpenAI兼容API' },
  deepseek: { url: 'https://api.deepseek.com/v1', model: 'deepseek-chat', name: 'DeepSeek' },
  qwen: { url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo', name: '通义千问' },
  zhipu: { url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', name: '智谱AI' },
  doubao: { url: 'https://ark.cn-beijing.volces.com/api/v3', model: '', name: '豆包' }
};

function onApiTypeChange() {
  var type = document.getElementById('apiType').value;
  document.getElementById('apiFields').style.display = type === 'none' ? 'none' : 'block';
  // 预设模式自动填充
  if (type !== 'none' && apiPresets[type]) {
    var preset = apiPresets[type];
    document.getElementById('apiUrl').value = preset.url || '';
    document.getElementById('apiModel').value = preset.model || '';
    // 豆包需要手动选择模型，显示提示
    var modelInput = document.getElementById('apiModel');
    var hintEl = document.getElementById('apiModelHint');
    if (type === 'doubao') {
      modelInput.placeholder = '请填写豆包模型名称（如 doubao-pro-32k）';
      if (hintEl) hintEl.style.display = 'block';
    } else {
      modelInput.placeholder = preset.model || 'deepseek-chat / qwen-turbo';
      if (hintEl) hintEl.style.display = 'none';
    }
  }
}

function saveApiSettings() {
  var config = {
    type: document.getElementById('apiType').value,
    url: document.getElementById('apiUrl').value.replace(/\/+$/, ''),
    key: document.getElementById('apiKey').value,
    model: document.getElementById('apiModel').value,
    systemPrompt: document.getElementById('apiSystemPrompt').value,
    useProxy: document.getElementById('apiUseProxy').checked
  };
  if (config.type !== 'none' && (!config.url || !config.key || !config.model)) {
    showApiTestResult('error', '请填写完整的API信息');
    return;
  }
  saveApiConfig(config);
  showApiTestResult('success', '设置已保存！' + (config.type !== 'none' ? 'AI功能将使用实时分析。' : '将使用预设模拟数据。'));
  updateApiStatusIndicator();
  showToast('success', 'API设置已保存');
  setTimeout(function() { closeApiSettings(); }, 1500);
}

function testApiConnection() {
  var config = {
    type: document.getElementById('apiType').value,
    url: document.getElementById('apiUrl').value.replace(/\/+$/, ''),
    key: document.getElementById('apiKey').value,
    model: document.getElementById('apiModel').value,
    systemPrompt: document.getElementById('apiSystemPrompt').value,
    useProxy: document.getElementById('apiUseProxy').checked
  };
  if (config.type === 'none') {
    showApiTestResult('info', '当前为模拟模式，无需测试连接。');
    return;
  }
  if (!config.url || !config.key || !config.model) {
    showApiTestResult('error', '请先填写完整的API信息');
    return;
  }
  showApiTestResult('info', '正在测试连接...');
  var url = config.url + '/chat/completions';
  if (config.useProxy) {
    url = 'https://corsproxy.io/?' + encodeURIComponent(url);
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt || '你是一个AI助手。' },
        { role: 'user', content: '请回复"连接成功"四个字。' }
      ],
      max_tokens: 50
    })
  }).then(function(resp) {
    if (resp.ok) {
      return resp.json().then(function(data) {
        var msg = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '连接成功';
        showApiTestResult('success', '连接成功！模型回复：' + msg);
      });
    } else {
      return resp.text().then(function(errText) {
        showApiTestResult('error', '连接失败（HTTP ' + resp.status + '）：' + errText.substring(0, 200));
      });
    }
  }).catch(function(e) {
    showApiTestResult('error', '连接失败：' + e.message + '。请检查API地址是否正确，以及是否支持跨域访问（CORS）。可尝试勾选CORS代理。');
  });
}

function showApiTestResult(type, msg) {
  var el = document.getElementById('apiTestResult');
  el.style.display = 'block';
  var colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue)' };
  var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  var bg, border;
  if (type === 'error') { bg = 'rgba(239,68,68,.1)'; border = 'rgba(239,68,68,.3)'; }
  else if (type === 'success') { bg = 'rgba(16,185,129,.1)'; border = 'rgba(16,185,129,.3)'; }
  else { bg = 'rgba(59,130,246,.1)'; border = 'rgba(59,130,246,.3)'; }
  el.innerHTML = '<div style="padding:10px 14px;border-radius:8px;background:' + bg + ';border:1px solid ' + border + ';font-size:13px;color:' + colors[type] + '"><i class="fa-solid ' + icons[type] + '"></i> ' + msg + '</div>';
}

function updateApiStatusIndicator() {
  var config = getApiConfig();
  var existing = document.getElementById('apiStatusDot');
  if (existing) existing.remove();
  var navRight = document.querySelector('.nav-user');
  if (navRight && config.type !== 'none') {
    navRight.insertAdjacentHTML('afterbegin',
      '<span id="apiStatusDot" style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block;margin-right:6px;animation:pulse-dot 2s infinite" title="AI API已连接"></span>');
    if (!document.getElementById('pulseDotStyle')) {
      var style = document.createElement('style');
      style.id = 'pulseDotStyle';
      style.textContent = '@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}';
      document.head.appendChild(style);
    }
  }
}

// AI调用（支持history和role参数）
function callAI(prompt, context, history, role) {
  var config = getApiConfig();
  if (config.type === 'none' || !config.url || !config.key) {
    return Promise.resolve(getMockResponse(prompt, context, history));
  }
  var messages = [];
  // 确定system prompt：如果用户自定义了则用自定义的，否则根据role选择
  var systemPrompt = config.systemPrompt;
  if (!systemPrompt && typeof aiRoles !== 'undefined' && role && aiRoles[role]) {
    systemPrompt = aiRoles[role].systemPrompt;
  } else if (!systemPrompt && typeof aiRoles !== 'undefined' && typeof currentChatRole !== 'undefined' && aiRoles[currentChatRole]) {
    systemPrompt = aiRoles[currentChatRole].systemPrompt;
  }
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  // 添加历史对话上下文
  if (history && history.length > 0) {
    for (var i = 0; i < history.length; i++) {
      if (history[i].role === 'user') messages.push({ role: 'user', content: history[i].content });
      else if (history[i].role === 'assistant') messages.push({ role: 'assistant', content: history[i].content });
    }
  }
  var finalPrompt = context ? context + '\n\n' + prompt : prompt;
  // RAG检索：将相关知识附加到prompt
  var ragResults = searchKnowledgeBase(prompt + ' ' + (context || ''));
  if (ragResults.length > 0) {
    finalPrompt = '参考以下学校制度：\n' + ragResults.join('\n\n') + '\n\n---\n\n' + finalPrompt;
  }
  messages.push({ role: 'user', content: finalPrompt });
  var url = config.url + '/chat/completions';
  if (config.useProxy) url = 'https://corsproxy.io/?' + encodeURIComponent(url);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
    body: JSON.stringify({ model: config.model, messages: messages, max_tokens: 2000, temperature: 0.7 })
  }).then(function(resp) {
    if (resp.ok) {
      return resp.json().then(function(data) {
        return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || 'AI暂时无法回复，请稍后重试。';
      });
    }
    return 'AI接口请求失败（HTTP ' + resp.status + '），已切换为模拟回复。\n' + getMockResponse(prompt, context, history);
  }).catch(function(e) {
    return 'AI接口连接失败：' + e.message + '。\n已切换为模拟回复。\n' + getMockResponse(prompt, context, history);
  });
}

// AI流式调用（SSE流式输出，支持role参数）
function callAIStream(prompt, callbacks, context, history, role) {
  var config = getApiConfig();
  // 模拟模式或无API时，使用前端模拟打字机效果
  if (config.type === 'none' || !config.url || !config.key) {
    var fullText = getMockResponse(prompt, context, history);
    simulateTypewriter(fullText, callbacks);
    return;
  }
  var messages = [];
  // 确定system prompt：如果用户自定义了则用自定义的，否则根据role选择
  var systemPrompt = config.systemPrompt;
  if (!systemPrompt && typeof aiRoles !== 'undefined' && role && aiRoles[role]) {
    systemPrompt = aiRoles[role].systemPrompt;
  } else if (!systemPrompt && typeof aiRoles !== 'undefined' && typeof currentChatRole !== 'undefined' && aiRoles[currentChatRole]) {
    systemPrompt = aiRoles[currentChatRole].systemPrompt;
  }
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  // 添加历史对话上下文
  if (history && history.length > 0) {
    for (var i = 0; i < history.length; i++) {
      if (history[i].role === 'user') messages.push({ role: 'user', content: history[i].content });
      else if (history[i].role === 'assistant') messages.push({ role: 'assistant', content: history[i].content });
    }
  }
  var finalPrompt = context ? context + '\n\n' + prompt : prompt;
  // RAG检索：将相关知识附加到prompt
  var ragResults = searchKnowledgeBase(prompt + ' ' + (context || ''));
  if (ragResults.length > 0) {
    finalPrompt = '参考以下学校制度：\n' + ragResults.join('\n\n') + '\n\n---\n\n' + finalPrompt;
  }
  messages.push({ role: 'user', content: finalPrompt });
  var url = config.url + '/chat/completions';
  if (config.useProxy) url = 'https://corsproxy.io/?' + encodeURIComponent(url);

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
    body: JSON.stringify({ model: config.model, messages: messages, max_tokens: 2000, temperature: 0.7, stream: true })
  }).then(function(resp) {
    if (!resp.ok) {
      var fallbackText = 'AI接口请求失败（HTTP ' + resp.status + '），已切换为模拟回复。\n' + getMockResponse(prompt, context, history);
      simulateTypewriter(fallbackText, callbacks);
      return;
    }
    // 检查是否返回流式数据（SSE）
    var contentType = resp.headers.get('content-type') || '';
    if (contentType.indexOf('text/event-stream') > -1 || contentType.indexOf('stream') > -1) {
      // 真正的SSE流式解析
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var accumulated = '';
      var buffer = '';

      function processStream() {
        reader.read().then(function(result) {
          if (result.done) {
            callbacks.onDone(accumulated);
            return;
          }
          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop(); // 保留不完整的行
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.indexOf('data: ') === 0) {
              var dataStr = line.substring(6);
              if (dataStr === '[DONE]') {
                callbacks.onDone(accumulated);
                return;
              }
              try {
                var data = JSON.parse(dataStr);
                var delta = data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content;
                if (delta) {
                  accumulated += delta;
                  callbacks.onChunk(delta);
                }
              } catch(e) {
                // 解析失败，忽略
              }
            }
          }
          processStream();
        }).catch(function(e) {
          if (accumulated) {
            callbacks.onDone(accumulated);
          } else {
            callbacks.onError(e.message);
          }
        });
      }
      processStream();
    } else {
      // API不支持流式，降级为普通请求后模拟打字机
      resp.json().then(function(data) {
        var fullText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || 'AI暂时无法回复，请稍后重试。';
        simulateTypewriter(fullText, callbacks);
      }).catch(function(e) {
        var fallbackText = 'AI接口解析失败，已切换为模拟回复。\n' + getMockResponse(prompt, context, history);
        simulateTypewriter(fallbackText, callbacks);
      });
    }
  }).catch(function(e) {
    var fallbackText = 'AI接口连接失败：' + e.message + '。\n已切换为模拟回复。\n' + getMockResponse(prompt, context, history);
    simulateTypewriter(fallbackText, callbacks);
  });
}

// 前端模拟打字机效果
function simulateTypewriter(fullText, callbacks) {
  var index = 0;
  var timer = setInterval(function() {
    if (index < fullText.length) {
      var chunk = fullText.charAt(index);
      callbacks.onChunk(chunk);
      index++;
    } else {
      clearInterval(timer);
      callbacks.onDone(fullText);
    }
  }, 30);
}

// 预设模拟回复（支持history参数）
function getMockResponse(prompt, context, history) {
  if (context && context.indexOf('预警分析') > -1) {
    var name = extractField(context, '姓名') || '该生';
    return '【AI预警分析】\n\n' + name + '同学的学业数据出现异常波动，主要原因如下：\n\n' +
      '1. 近两周出勤率降至' + (Math.floor(Math.random()*15)+55) + '%，低于班级平均水平\n' +
      '2. 最近三次作业中有两次未按时提交\n' +
      '3. 课堂测验成绩呈下降趋势\n\n' +
      '【干预建议】\n' +
      '1. 尽快安排一次一对一面谈，了解近期是否存在生活或心理困扰\n' +
      '2. 联系班级辅导员了解该生的日常表现\n' +
      '3. 安排学习伙伴结对帮扶，提升出勤和作业完成率\n' +
      '4. 建议每周跟进一次，持续关注两周';
  }
  if (context && context.indexOf('谈心提纲') > -1) {
    var name2 = extractField(context, '姓名') || '该生';
    return '【AI个性化谈心提纲】\n\n' +
      '开场（破冰）：最近课程学习感觉怎么样？有没有觉得哪些内容比较难跟上？\n\n' +
      '核心问题探索：\n' +
      '1. 我注意到最近出勤有些波动，是不是有什么事情影响了上课？\n' +
      '2. 上次作业没交是什么原因？需要我提供帮助吗？\n' +
      '3. 目前有没有遇到什么学习上的困难？\n\n' +
      '支持与资源：\n' +
      '4. 学校有免费课后辅导，要不要帮你预约？\n' +
      '5. 有没有想和同学们一起组成学习小组？\n\n' +
      '总结与行动计划：\n' +
      '6. 我们一起定个小目标，这周争取全勤+按时交作业，下周我再看看你的进步，好吗？';
  }
  if (context && context.indexOf('职业画像') > -1) {
    return '【AI职业画像分析】\n\n根据' + (extractField(context, '专业') || '本专业') +
      '的就业数据和学生个人能力评估：\n\n' +
      '推荐方向1：临床护理（匹配度92%）- 适合专业技能突出的学生\n' +
      '推荐方向2：社区卫生服务（匹配度85%）- 适合综合能力均衡的学生\n' +
      '推荐方向3：康复护理（匹配度78%）- 适合有耐心和沟通能力的学生\n\n' +
      '建议证书：护士执业资格证、BLS/ACLS急救证书、专科护士培训证书\n\n' +
      '发展路径：实习护士 → 注册护士 → 专科护士 → 护理主管';
  }
  // 如果有历史对话上下文，生成更智能的回复
  if (history && history.length > 0) {
    var historyHint = '';
    for (var i = 0; i < history.length; i++) {
      if (history[i].role === 'user') historyHint += '用户问过：' + history[i].content.substring(0, 50) + '... ';
    }
    if (historyHint) {
      return '结合我们之前的讨论（' + historyHint + '），关于您当前的问题"' + (prompt.substring(0, 30)) + '"，我的建议是：\n\n' +
        '1. 根据之前的分析基础，当前情况需要综合考虑多个因素\n2. 建议从学生个人特点出发，制定更有针对性的方案\n3. 可以结合之前讨论的方法，持续跟踪和反馈\n\n如果您需要更具体的建议，请告诉我具体的场景和学生信息。';
    }
  }
  var responses = [
    '感谢你的咨询。作为AI学业导师助手，我建议：\n1. 首先关注学生的出勤率和作业完成情况，这是最基础也是最重要的指标\n2. 对于预警学生，及时安排一对一沟通，了解背后的原因\n3. 建立"早发现-早干预-持续跟进"的工作机制',
    '理解你的需求。基于当前学生数据，我的建议是：\n1. 先解决最紧急的红色预警学生，本周内完成约谈\n2. 对橙色预警学生制定关注计划，每两周检查一次进展\n3. 对蓝色关注学生通过班级群消息提醒，保持关注即可',
    '这是一个很好的问题。从学生发展的角度：\n1. 学业成绩固然重要，但更重要的是培养学习能力和职业素养\n2. 建议多给予正向反馈，帮助学生建立自信\n3. 结合学生的职业兴趣，有针对性地引导专业学习'
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function extractField(text, field) {
  var regex = new RegExp(field + '[:：]?(\\S+)', 'i');
  var match = text.match(regex);
  return match ? match[1] : null;
}

// ========== AI结构化输出 ==========
function callAIStructured(prompt, context, schema) {
  var config = getApiConfig();
  // 构造schema描述字符串
  var schemaDesc = JSON.stringify(schema, null, 2);
  var structuredPrompt = prompt + '\n\n请严格按以下JSON格式返回结果（不要包含任何其他文字或markdown标记）：\n' + schemaDesc;

  // 模拟模式下返回预设结构化数据
  if (config.type === 'none' || !config.url || !config.key) {
    return Promise.resolve(getMockStructuredResponse(context, schema));
  }

  var messages = [];
  if (config.systemPrompt) messages.push({ role: 'system', content: config.systemPrompt });
  messages.push({ role: 'user', content: structuredPrompt });
  var url = config.url + '/chat/completions';
  if (config.useProxy) url = 'https://corsproxy.io/?' + encodeURIComponent(url);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
    body: JSON.stringify({ model: config.model, messages: messages, max_tokens: 1500, temperature: 0.3 })
  }).then(function(resp) {
    if (resp.ok) {
      return resp.json().then(function(data) {
        var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
        return parseStructuredResponse(content, schema);
      });
    }
    // 请求失败，返回null，让调用方fallback
    return null;
  }).catch(function(e) {
    return null;
  });
}

// 从AI返回内容中解析JSON结构
function parseStructuredResponse(content, schema) {
  if (!content) return null;
  try {
    // 先尝试直接解析
    return JSON.parse(content.trim());
  } catch(e) {
    // 尝试从markdown代码块中提取
    var codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch(e2) {}
    }
    // 尝试找到第一个 { 和最后一个 } 之间的内容
    var firstBrace = content.indexOf('{');
    var lastBrace = content.lastIndexOf('}');
    if (firstBrace > -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.substring(firstBrace, lastBrace + 1));
      } catch(e3) {}
    }
    return null;
  }
}

// 模拟模式下的结构化响应
function getMockStructuredResponse(context, schema) {
  if (context && context.indexOf('预警分析') > -1) {
    // 根据context推断预警等级
    var level = 'blue';
    var score = 45;
    var risk = '低';
    if (context.indexOf('红色预警') > -1) { level = 'red'; score = 85 + Math.floor(Math.random() * 10); risk = '高'; }
    else if (context.indexOf('橙色预警') > -1) { level = 'orange'; score = 65 + Math.floor(Math.random() * 15); risk = '中高'; }
    else if (context.indexOf('蓝色关注') > -1) { level = 'blue'; score = 35 + Math.floor(Math.random() * 20); risk = '中'; }
    else { level = 'green'; score = 10 + Math.floor(Math.random() * 20); risk = '低'; }

    var reasons = [];
    var suggestions = [];
    if (context.indexOf('出勤率') > -1) {
      var attMatch = context.match(/出勤率[：:]?\s*(\d+)/);
      if (attMatch && parseInt(attMatch[1]) < 80) reasons.push('出勤率' + attMatch[1] + '%，低于80%阈值');
    }
    if (context.indexOf('平均成绩') > -1 || context.indexOf('平均分') > -1) {
      var avgMatch = context.match(/平均(?:成绩|分)[：:]?\s*(\d+)/);
      if (avgMatch && parseInt(avgMatch[1]) < 60) reasons.push('平均成绩' + avgMatch[1] + '分，未达标');
    }
    if (reasons.length === 0) reasons.push('近期数据波动需要关注');
    if (level === 'red' || level === 'orange') {
      reasons.push('成绩持续下滑趋势');
      suggestions.push('尽快约谈，了解具体原因');
      suggestions.push('安排学习伙伴结对帮扶');
      suggestions.push('每周跟进一次，持续两周');
    } else {
      suggestions.push('保持定期关注');
      suggestions.push('两周后复查数据');
    }

    return { level: level, score: score, reasons: reasons, suggestions: suggestions, risk: risk };
  }

  if (context && context.indexOf('干预评估') > -1) {
    var effScore = 60 + Math.floor(Math.random() * 30);
    var effectiveness = effScore >= 80 ? '有效' : effScore >= 60 ? '部分有效' : '需要调整';
    var nextSteps = effScore >= 80
      ? ['继续保持当前帮扶措施', '两周后复查数据']
      : ['加强一对一辅导频率', '联系辅导员协同关注', '两周后复查效果'];
    return { effectiveness: effectiveness, score: effScore, nextSteps: nextSteps };
  }

  return null;
}
