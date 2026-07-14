/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

/**
 * 银发就医小棉袄 - 拍照记录 OCR 识别与分类处理
 * 功能：
 *   1. 拍照 / 相册选择 / 示例演示
 *   2. Tesseract.js（CDN 动态加载）识别图片文字
 *   3. 调用后端 LLM 分析（失败时降级到前端正则解析）
 *   4. 处方安全检查（复用 SafetyEngine）
 *   5. 生成用药提醒并存储（复用 storage.js）
 *   6. 图片压缩（canvas，避免 localStorage 溢出）
 *   7. 拍照记录存储
 *
 * 依赖：storage.js / safety-engine.js / toast.js
 * 零本地依赖，Tesseract.js 通过 CDN 动态加载。
 */
(function () {
  'use strict';

  // ============ 后端地址 ============
  var BACKEND_URL = 'http://localhost:29070';
  var ANALYZE_ENDPOINT = BACKEND_URL + '/api/medical/analyze-image';
  // Tesseract.js CDN（v5）
  var TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

  // ============ 示例处方 OCR 文本（评审演示用） ============
  var DEMO_PRESCRIPTION_OCR = 'XX市人民医院 门诊处方\n' +
    '姓名：张秀兰 性别：女 年龄：72岁\n' +
    '诊断：冠心病、高脂血症\n' +
    'Rp:\n' +
    '1. 美托洛尔片 25mg × 14片\n' +
    '   用法：半片 每日2次 饭后口服\n' +
    '2. 阿托伐他汀钙片 20mg × 7片\n' +
    '   用法：1片 每日1次 睡前口服\n' +
    '   注意：避免与西柚汁同服\n' +
    '复诊：1个月后复查肝功能+心电图\n' +
    '医师：李医生 日期：2026-06-30';

  // ============ 示例化验单 OCR 文本 ============
  var DEMO_LAB_REPORT_OCR = 'XX市人民医院 检验报告单\n' +
    '姓名：张秀兰 年龄：72岁\n' +
    '项目          结果    参考范围\n' +
    '空腹血糖      7.2↑   3.9-6.1 mmol/L\n' +
    '总胆固醇      5.8↑   3.1-5.2 mmol/L\n' +
    '低密度脂蛋白  3.9↑   1.9-3.6 mmol/L\n' +
    '甘油三酯      2.1↑   0.4-1.7 mmol/L\n' +
    '肝功能ALT     35     5-40 U/L\n' +
    '日期：2026-06-28';

  // ============ 工具：动态加载 script ============
  function loadScript(src, timeout) {
    return new Promise(function (resolve, reject) {
      // 已加载则直接返回
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      var timer = setTimeout(function () {
        reject(new Error('脚本加载超时：' + src));
      }, timeout || 15000);
      script.onload = function () {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = function () {
        clearTimeout(timer);
        reject(new Error('脚本加载失败：' + src));
      };
      document.head.appendChild(script);
    });
  }

  // ============ 1. 拍照功能 ============

  /**
   * 启动摄像头并在指定 video 元素中预览。
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<MediaStream>}
   */
  async function startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('当前浏览器不支持摄像头');
    }
    var stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.setAttribute('playsinline', 'true');
      await videoElement.play();
    }
    return stream;
  }

  /**
   * 关闭摄像头流。
   * @param {MediaStream} stream
   * @param {HTMLVideoElement} videoElement
   */
  function stopCamera(stream, videoElement) {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  /**
   * 从 video 元素拍照，返回 base64（已压缩）。
   * 同步在 canvas 上完成缩放与压缩（视频帧已就绪，无需异步加载图片）。
   * @param {HTMLVideoElement} videoElement
   * @returns {string} base64 图片（data URL，jpeg）
   */
  function capturePhoto(videoElement) {
    if (!videoElement) return '';
    var srcW = videoElement.videoWidth || 720;
    var srcH = videoElement.videoHeight || 960;
    // 按最大宽度 800 等比缩放
    var w = srcW, h = srcH;
    if (w > 800) {
      h = Math.round(h * (800 / w));
      w = 800;
    }
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  /**
   * 从相册选择文件，返回 Promise<string>（base64，已压缩）。
   * @param {File} file
   * @returns {Promise<string>}
   */
  function handleFileSelect(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }
      if (!/^image\//.test(file.type)) {
        reject(new Error('请选择图片文件'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var raw = e.target.result;
        resolve(compressImage(raw, 800, 0.7));
      };
      reader.onerror = function () {
        reject(new Error('读取文件失败'));
      };
      reader.readAsDataURL(file);
    });
  }

  // ============ 2. OCR 识别（Tesseract.js） ============

  /**
   * 识别图片中的文字（中文 chi_sim）。
   * @param {string} imageBase64 data URL
   * @param {function(number)} onProgress 进度回调（0-100）
   * @returns {Promise<string>} 识别文本
   */
  async function recognizeImage(imageBase64, onProgress) {
    // 动态加载 Tesseract.js
    await loadScript(TESSERACT_CDN);
    if (typeof Tesseract === 'undefined') {
      throw new Error('Tesseract.js 加载失败');
    }
    // 创建 worker（chi_sim 简体中文）
    var worker = await Tesseract.createWorker('chi_sim', 1, {
      logger: function (m) {
        if (m.status === 'recognizing text' && typeof onProgress === 'function') {
          onProgress(Math.round((m.progress || 0) * 100));
        }
      }
    });
    try {
      var result = await worker.recognize(imageBase64);
      return (result && result.data && result.data.text) || '';
    } finally {
      await worker.terminate();
    }
  }

  // ============ 3. 后端 LLM 分析 ============

  /**
   * 调用后端 LLM 分析 OCR 文本，失败时降级到前端解析。
   * @param {string} ocrText
   * @returns {Promise<Object>} 结构化结果
   */
  async function analyzeDocument(ocrText) {
    try {
      var resp = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocr_text: ocrText, session_id: 'photo-' + Date.now() }),
        // 短超时，便于快速降级
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      });
      if (!resp.ok) throw new Error('后端响应异常：' + resp.status);
      var data = await resp.json();
      // 后端返回 doc_type/doc_type_label/structured_data，映射为前端统一格式
      if (data && data.doc_type) {
        var result = {
          type: data.doc_type,                              // prescription|lab_report|registration|other
          typeLabel: data.doc_type_label || '',             // 处方|化验单|挂号单|其他
          confidence: data.confidence || 0,
          ocrText: data.raw_text || ocrText,
          source: 'backend'
        };
        // 将 structured_data 的字段展开到顶层
        var sd = data.structured_data || {};
        Object.keys(sd).forEach(function (k) { result[k] = sd[k]; });
        return result;
      }
      // 后端返回格式不符，降级
      return fallbackParse(ocrText);
    } catch (err) {
      // 降级到前端解析
      console.warn('[photo-ocr] 后端不可用，降级到前端解析：', err);
      return fallbackParse(ocrText);
    }
  }

  // ============ 4. 前端降级解析（正则 + 药物库匹配） ============

  /**
   * 前端降级解析：关键词判断文档类型，匹配药物库药品名。
   * @param {string} ocrText
   * @returns {Object} 结构化结果
   */
  function fallbackParse(ocrText) {
    var text = ocrText || '';
    var type = detectDocumentType(text);
    var result = {
      type: type,
      ocrText: text,
      source: 'fallback',
      hospital: extractField(text, /([^\s]{2,}医院|[^\s]{2,}卫生院|XX市人民医院)/) || '',
      doctor: extractField(text, /医\s*师[：:]\s*([^\s日期]+)/) || '',
      date: extractField(text, /日期[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/) || ''
    };

    if (type === 'prescription') {
      result.diagnosis = extractField(text, /诊断[：:]\s*([^\n\r]+)/) || '';
      result.medications = extractMedications(text);
      result.followUp = extractField(text, /复诊[：:]\s*([^\n\r]+)/) || '';
    } else if (type === 'lab_report') {
      result.labItems = extractLabItems(text);
    } else if (type === 'registration') {
      result.department = extractField(text, /(科室|诊室)[：:]\s*([^\s]+)/) || '';
    } else {
      result.summary = text.substring(0, 120);
    }
    return result;
  }

  /** 关键词判断文档类型 */
  function detectDocumentType(text) {
    if (/处方|Rp|用法[：:]|每日\d次|睡前口服|饭后口服/.test(text)) return 'prescription';
    if (/检验报告|化验单|参考范围|mmol\/L|U\/L|↑|↓/.test(text)) return 'lab_report';
    if (/挂号|就诊序号|科室|门诊号/.test(text)) return 'registration';
    return 'other';
  }

  /** 正则提取第一个捕获组 */
  function extractField(text, regex) {
    var m = text.match(regex);
    return m ? (m[1] || m[2] || '').trim() : '';
  }

  /** 从处方文本提取药品（匹配 SafetyEngine 药物库 + 常见用法） */
  function extractMedications(text) {
    var meds = [];
    var drugDb = (window.SafetyEngine && SafetyEngine._rules && SafetyEngine._rules.drugDatabase) || [];
    // 用药物库的通用名/商品名做关键词匹配
    drugDb.forEach(function (d) {
      if (text.indexOf(d.generic) !== -1 || text.indexOf(d.brand) !== -1) {
        var name = text.indexOf(d.generic) !== -1 ? d.generic : d.brand;
        // 提取该药品附近的用法
        var dosage = extractNearby(text, name, /\d+(\.\d+)?\s*mg/) || d.usage || '';
        var frequency = extractNearby(text, name, /每日\d次|每日1次|每日2次|每日3次/) || '';
        var usage = extractNearby(text, name, /(饭前|饭后|睡前|空腹)[口服]/) || '';
        meds.push({
          name: name,
          generic: d.generic,
          brand: d.brand,
          dosage: dosage,
          frequency: frequency,
          usage: usage,
          note: d.note || ''
        });
      }
    });
    return meds;
  }

  /** 提取关键词附近匹配的文本 */
  function extractNearby(text, keyword, regex) {
    var idx = text.indexOf(keyword);
    if (idx === -1) return '';
    // 取关键词后 80 字符范围内匹配
    var snippet = text.substring(idx, idx + 80);
    var m = snippet.match(regex);
    return m ? m[0] : '';
  }

  /** 从化验单文本提取指标项 */
  function extractLabItems(text) {
    var items = [];
    var lines = text.split(/[\n\r]+/);
    lines.forEach(function (line) {
      // 匹配 "项目  数值  参考范围" 形式
      var m = line.match(/([^\s\d]{2,})\s+([\d.]+)\s*(↑|↓)?\s*([\d.]+-[\d.]+)?\s*(mmol\/L|U\/L|g\/L|mg\/dL)?/);
      if (m) {
        items.push({
          name: m[1],
          value: m[2],
          status: m[3] ? (m[3] === '↑' ? 'high' : 'low') : 'normal',
          reference: (m[4] || '') + (m[5] ? ' ' + m[5] : '')
        });
      }
    });
    return items;
  }

  // ============ 5. 安全检查（处方类） ============

  /**
   * 处方安全检查：调用 SafetyEngine.checkDrugInteraction。
   * @param {Array} medications 药品列表（含 name 字段）
   * @returns {Object} { level, message, details }
   */
  function checkPrescriptionSafety(medications) {
    if (typeof SafetyEngine === 'undefined') {
      return { level: 'green', message: '安全引擎未加载，跳过检查', details: [] };
    }
    var names = (medications || []).map(function (m) {
      return typeof m === 'string' ? m : (m.generic || m.name || m.brand);
    });
    return SafetyEngine.checkDrugInteraction(names);
  }

  // ============ 6. 生成用药提醒 ============

  /**
   * 根据结构化结果与安全检查结果生成用药提醒，存入 localStorage。
   * 复用 storage.js 的 addVisitRecord / getReminderSettings / saveReminderSettings。
   * @param {Object} structuredData analyzeDocument/fallbackParse 返回的结构化结果
   * @param {Object} safetyResult checkPrescriptionSafety 返回的安全检查结果
   * @returns {Object} 已存储的就诊记录
   */
  function generateMedicationReminder(structuredData, safetyResult) {
    var data = structuredData || {};
    var today = (typeof getTodayStr === 'function') ? getTodayStr() : '';

    // 构造就诊记录（与 me_summary.html 引用结构一致）
    var record = {
      id: 'photo_' + Date.now(),
      date: data.date || today,
      hospital: data.hospital || '',
      department: data.department || '',
      doctor: data.doctor || '',
      source: 'photo',
      diagnosis: {
        text: data.diagnosis || '',
        confidence: 80
      },
      medications: (data.medications || []).map(function (m) {
        return {
          generic: m.generic || m.name || '',
          brand: m.brand || '',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          time: m.usage || '',
          amount: m.amount || '',
          confidence: 80
        };
      }),
      medication_rules: (data.medications || [])
        .filter(function (m) { return m.note; })
        .map(function (m) {
          return { rule: m.note, confidence: 75 };
        }),
      follow_up: data.followUp ? {
        items: data.followUp,
        date: '',
        confidence: 70
      } : null,
      safety: safetyResult || { level: 'green', message: '', details: [] }
    };

    // 存入就诊记录
    if (typeof addVisitRecord === 'function') {
      addVisitRecord(record);
    }
    // 同步开启用药提醒
    if (typeof getReminderSettings === 'function' && typeof saveReminderSettings === 'function') {
      var settings = getReminderSettings();
      settings.medication = true;
      saveReminderSettings(settings);
    }
    return record;
  }

  // ============ 7. 图片压缩（canvas） ============

  /**
   * 压缩 base64 图片，避免 localStorage 溢出。
   * @param {string} base64 data URL
   * @param {number} maxWidth 最大宽度（默认 800）
   * @param {number} quality jpeg 质量 0-1（默认 0.7）
   * @returns {Promise<string>} 压缩后的 data URL
   */
  function compressImage(base64, maxWidth, quality) {
    maxWidth = maxWidth || 800;
    quality = (typeof quality === 'number') ? quality : 0.7;
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () {
        // 压缩失败则返回原图
        resolve(base64);
      };
      img.src = base64;
    });
  }

  // ============ 8. 拍照记录存储 ============

  /** 获取拍照记录列表 */
  function getPhotoRecords() {
    try {
      return JSON.parse(localStorage.getItem('my_photo_records') || '[]');
    } catch (e) {
      return [];
    }
  }

  /** 新增一条拍照记录（最新在前） */
  function addPhotoRecord(record) {
    var records = getPhotoRecords();
    records.unshift(record);
    // 限制最多 20 条，避免 localStorage 溢出
    if (records.length > 20) records = records.slice(0, 20);
    localStorage.setItem('my_photo_records', JSON.stringify(records));
  }

  // ============ 暴露 API（兼容全局函数与命名空间） ============
  window.DEMO_PRESCRIPTION_OCR = DEMO_PRESCRIPTION_OCR;
  window.DEMO_LAB_REPORT_OCR = DEMO_LAB_REPORT_OCR;

  // 全局函数（与 storage.js 风格一致）
  window.startCamera = startCamera;
  window.stopCamera = stopCamera;
  window.capturePhoto = capturePhoto;
  window.handleFileSelect = handleFileSelect;
  window.recognizeImage = recognizeImage;
  window.analyzeDocument = analyzeDocument;
  window.fallbackParse = fallbackParse;
  window.checkPrescriptionSafety = checkPrescriptionSafety;
  window.generateMedicationReminder = generateMedicationReminder;
  window.compressImage = compressImage;
  window.getPhotoRecords = getPhotoRecords;
  window.addPhotoRecord = addPhotoRecord;

  // 命名空间（便于批量引用）
  window.PhotoOCR = {
    BACKEND_URL: BACKEND_URL,
    ANALYZE_ENDPOINT: ANALYZE_ENDPOINT,
    DEMO_PRESCRIPTION_OCR: DEMO_PRESCRIPTION_OCR,
    DEMO_LAB_REPORT_OCR: DEMO_LAB_REPORT_OCR,
    startCamera: startCamera,
    stopCamera: stopCamera,
    capturePhoto: capturePhoto,
    handleFileSelect: handleFileSelect,
    recognizeImage: recognizeImage,
    analyzeDocument: analyzeDocument,
    fallbackParse: fallbackParse,
    checkPrescriptionSafety: checkPrescriptionSafety,
    generateMedicationReminder: generateMedicationReminder,
    compressImage: compressImage,
    getPhotoRecords: getPhotoRecords,
    addPhotoRecord: addPhotoRecord
  };
})();
