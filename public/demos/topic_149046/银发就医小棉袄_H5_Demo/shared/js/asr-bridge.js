/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

// ==========================================================================
// ASR 桥接模块：连接真实 ASR 引擎 (localhost:28020)
// 支持文件识别（POST /api/v1/asr/recognize）和流式识别（WebSocket）
// 当 ASR 引擎不可用时，自动降级到 Mock 模式
// ==========================================================================

var ASR_CONFIG = {
  BASE_URL: 'http://localhost:28020',
  HEALTH_TIMEOUT: 3000,
  RECOGNIZE_TIMEOUT: 30000,
  WS_RECONNECT_INTERVAL: 2000,
  WS_MAX_RETRIES: 3
};

var asrAvailable = null; // null=未检测, true=可用, false=不可用

// ==========================================================================
// 健康检查：检测 ASR 引擎是否可用
// ==========================================================================
async function checkASRHealth() {
  if (asrAvailable !== null) return asrAvailable;
  try {
    var resp = await fetch(ASR_CONFIG.BASE_URL + '/health', {
      signal: AbortSignal.timeout ? AbortSignal.timeout(ASR_CONFIG.HEALTH_TIMEOUT) : undefined
    });
    if (!resp.ok) { asrAvailable = false; return false; }
    var data = await resp.json();
    asrAvailable = !!(data.status === 'ok' && data.model_loaded);
    return asrAvailable;
  } catch (e) {
    console.warn('[asr-bridge] ASR引擎不可用:', e.message);
    asrAvailable = false;
    return false;
  }
}

// ==========================================================================
// 文件识别：上传音频文件，返回识别文本
// ==========================================================================
async function recognizeAudioFile(audioBlob, hotwords) {
  var healthy = await checkASRHealth();
  if (!healthy) {
    console.warn('[asr-bridge] ASR不可用，返回空文本');
    return { text: '', source: 'unavailable', confidence: 0 };
  }

  try {
    var formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    var url = ASR_CONFIG.BASE_URL + '/api/v1/asr/recognize?language=中文&itn=true';
    if (hotwords && hotwords.length > 0) {
      url += '&hotwords=' + encodeURIComponent(hotwords.join(','));
    }

    var resp = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout ? AbortSignal.timeout(ASR_CONFIG.RECOGNIZE_TIMEOUT) : undefined
    });

    if (!resp.ok) {
      throw new Error('ASR响应异常: ' + resp.status);
    }

    var data = await resp.json();
    return {
      text: data.text || '',
      source: 'asr-engine',
      confidence: data.confidence || 0,
      durationMs: data.duration_ms || 0,
      inferMs: data.infer_ms || 0,
      segments: data.segments || [],
      hallucinationCount: data.hallucination_count || 0
    };
  } catch (e) {
    console.error('[asr-bridge] 识别失败:', e);
    return { text: '', source: 'error', confidence: 0, error: e.message };
  }
}

// ==========================================================================
// 流式识别：WebSocket 实时音频流
// ==========================================================================
function createStreamingRecognizer(sessionId, onPartial, onFinal, onError) {
  var ws = null;
  var retries = 0;
  var closed = false;

  function connect() {
    var url = ASR_CONFIG.BASE_URL.replace('http', 'ws') + '/ws/v1/asr/' + sessionId;
    ws = new WebSocket(url);

    ws.onopen = function() {
      console.log('[asr-bridge] WebSocket已连接, session=' + sessionId);
      retries = 0;
    };

    ws.onmessage = function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.error_code) {
          if (onError) onError(data);
          return;
        }
        if (data.is_final) {
          if (onFinal) onFinal(data);
        } else {
          if (onPartial) onPartial(data);
        }
      } catch (e) {
        console.error('[asr-bridge] 解析消息失败:', e);
      }
    };

    ws.onerror = function(e) {
      console.error('[asr-bridge] WebSocket错误:', e);
      if (!closed && retries < ASR_CONFIG.WS_MAX_RETRIES) {
        retries++;
        setTimeout(connect, ASR_CONFIG.WS_RECONNECT_INTERVAL);
      } else if (onError) {
        onError({ error_code: 'WS_ERROR', message: 'WebSocket连接失败' });
      }
    };

    ws.onclose = function() {
      console.log('[asr-bridge] WebSocket已关闭');
    };
  }

  connect();

  return {
    sendAudio: function(pcmData) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(pcmData);
      }
    },
    sendConfig: function(config) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(config));
      }
    },
    sendHeartbeat: function() {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    },
    close: function() {
      closed = true;
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    isOpen: function() {
      return ws && ws.readyState === WebSocket.OPEN;
    }
  };
}

// ==========================================================================
// 热词生成：从方言映射表和药品库生成医疗热词列表
// ==========================================================================
function buildMedicalHotwords() {
  var hotwords = [
    // 常见药品名
    '美托洛尔', '阿托伐他汀', '二甲双胍', '硝苯地平', '氯吡格雷',
    '阿司匹林', '华法林', '地高辛', '呋塞米', '奥美拉唑',
    // 常见诊断
    '冠心病', '高血压', '糖尿病', '高脂血症', '心功能不全',
    // 常见科室
    '心内科', '内分泌科', '神经内科', '骨科', '呼吸科',
    // 常见医学术语
    '每日两次', '每日一次', '睡前服用', '饭后服用', '随餐服用'
  ];

  // 从方言映射表添加标准术语
  if (typeof DIALECT_MAP !== 'undefined' && Array.isArray(DIALECT_MAP)) {
    DIALECT_MAP.forEach(function(entry) {
      if (hotwords.indexOf(entry.standard) === -1) {
        hotwords.push(entry.standard);
      }
    });
  }

  // ASR引擎最多支持20个热词，取前20个
  return hotwords.slice(0, 20);
}

// ==========================================================================
// 重置可用性检测（用于手动重试）
// ==========================================================================
function resetASRCheck() {
  asrAvailable = null;
}

// ==========================================================================
// 全局导出
// ==========================================================================
if (typeof window !== 'undefined') {
  window.ASR_CONFIG = ASR_CONFIG;
  window.checkASRHealth = checkASRHealth;
  window.recognizeAudioFile = recognizeAudioFile;
  window.createStreamingRecognizer = createStreamingRecognizer;
  window.buildMedicalHotwords = buildMedicalHotwords;
  window.resetASRCheck = resetASRCheck;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ASR_CONFIG: ASR_CONFIG,
    checkASRHealth: checkASRHealth,
    recognizeAudioFile: recognizeAudioFile,
    createStreamingRecognizer: createStreamingRecognizer,
    buildMedicalHotwords: buildMedicalHotwords,
    resetASRCheck: resetASRCheck
  };
}
