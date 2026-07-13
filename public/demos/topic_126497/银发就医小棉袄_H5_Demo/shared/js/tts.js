<!-- @trae-gen TTS-Engine V1.1 -->
/**
 * 银发就医小棉袄 TTS 语音播报引擎 V1.1
 * 双通道合成：优先播放预生成的高音质 mp3 音频，回退到浏览器 Web Speech API
 *
 * 用法:
 *   // 1. 优先播放预生成音频文件（推荐），失败自动回退到 Web Speech API
 *   SilverTTS.speakFromFile('health_reminder_morning', '早上好，张秀兰...');
 *
 *   // 2. 直接合成文本（动态内容）
 *   SilverTTS.speak('张奶奶，该吃降压药了');
 *
 *   // 3. 紧急播报（打断当前队列）
 *   SilverTTS.speakUrgent('检测到药物相互作用，请立即咨询医生');
 *   SilverTTS.stop();
 *
 * 预生成音频：
 *   - 目录：assets/audio/
 *   - 工具：test/generate_tts_audio.py（基于 edge-tts，zh-CN-XiaoyiNeural 女声）
 *   - 参数：rate=0.9, volume=0.8, pitch=1.0（与 TTS 规格文档一致）
 *
 * 默认参数（适合老年人收听）:
 *   - 语言: zh-CN
 *   - 语速: 1.1（稍快，避免拖沓）
 *   - 音量: 0.8
 *   - 音高: 1.0
 */
(function() {
  'use strict';

  var synth = window.speechSynthesis;
  var state = 'idle';          // idle / speaking / paused
  var queue = [];              // 普通播报队列
  var currentUtterance = null; // 当前正在播报的实例
  var selectedVoiceURI = null; // 用户指定的语音
  var defaultVoice = null;     // 自动选择的中文语音
  var currentAudio = null;     // 当前正在播放的 <audio> 元素（预生成音频模式）

  // ===== 预生成音频基础路径 =====
  // 自动推断：从 shared/js/tts.js 推导到 h5_demo/assets/audio/
  // shared/js/tts.js → ../assets/audio/
  var AUDIO_BASE = (function() {
    var scripts = document.getElementsByTagName('script');
    var currentSrc = '';
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('tts.js') >= 0) {
        currentSrc = scripts[i].src;
        break;
      }
    }
    // 兜底：使用相对路径（适用于 html/me/、html/family/、html/common/ 二级目录的页面）
    return '../../assets/audio/';
  })();

  // 默认播报参数（适合老年用户）
  var DEFAULT_OPTIONS = {
    rate: 1.1,     // 语速稍快，避免拖沓
    volume: 0.8,   // 音量适中
    pitch: 1.0,    // 标准音高
    lang: 'zh-CN'
  };

  /**
   * 检查浏览器是否支持 Web Speech API
   */
  function isSupported() {
    return !!(synth && typeof SpeechSynthesisUtterance !== 'undefined');
  }

  /**
   * 从语音列表中选择最佳中文语音
   * 优先级: zh-CN > zh-*> > zh
   */
  function pickChineseVoice(voices) {
    if (!voices || !voices.length) return null;
    // 优先精确匹配 zh-CN
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang === 'zh-CN') return voices[i];
    }
    // 其次匹配 zh 开头
    for (var j = 0; j < voices.length; j++) {
      if (voices[j].lang && voices[j].lang.indexOf('zh') === 0) return voices[j];
    }
    return null;
  }

  /**
   * 加载并缓存默认中文语音
   */
  function loadDefaultVoice() {
    if (!isSupported()) return;
    var voices = synth.getVoices();
    defaultVoice = pickChineseVoice(voices);
  }

  // 部分浏览器异步加载语音列表，需要监听 voiceschanged 事件
  if (isSupported()) {
    loadDefaultVoice();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.addEventListener('voiceschanged', loadDefaultVoice);
    }
  } else {
    console.warn('[SilverTTS] 当前浏览器不支持 Web Speech API，语音播报功能已禁用');
  }

  /**
   * 获取当前应使用的语音
   */
  function getActiveVoice() {
    if (selectedVoiceURI) {
      var voices = synth.getVoices();
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].voiceURI === selectedVoiceURI) return voices[i];
      }
    }
    return defaultVoice;
  }

  /**
   * 合并用户传入的 options 与默认配置
   */
  function mergeOptions(options) {
    var merged = {};
    var key;
    for (key in DEFAULT_OPTIONS) {
      merged[key] = DEFAULT_OPTIONS[key];
    }
    if (options) {
      for (key in options) {
        if (options.hasOwnProperty(key)) {
          merged[key] = options[key];
        }
      }
    }
    return merged;
  }

  /**
   * 实际发起一次播报
   */
  function speakNow(text, options) {
    if (!isSupported()) return;
    var utter = new SpeechSynthesisUtterance(text);
    var opts = mergeOptions(options);
    utter.rate = opts.rate;
    utter.volume = opts.volume;
    utter.pitch = opts.pitch;
    utter.lang = opts.lang;

    var voice = getActiveVoice();
    if (voice) utter.voice = voice;

    utter.onstart = function() {
      state = 'speaking';
    };
    utter.onend = function() {
      currentUtterance = null;
      if (queue.length > 0) {
        // 继续播报下一条
        var next = queue.shift();
        if (next.audioKey) {
          playAudioFile(next.audioKey, next.fallbackText);
        } else {
          speakNow(next.text, next.options);
        }
      } else {
        state = 'idle';
      }
    };
    utter.onerror = function() {
      currentUtterance = null;
      state = 'idle';
    };

    currentUtterance = utter;
    synth.speak(utter);
  }

  /**
   * 通过 <audio> 元素播放预生成音频文件
   * @param {string} audioKey - 音频文件名（不带扩展名，如 'health_reminder_morning'）
   * @param {string} [fallbackText] - 音频加载失败时的回退文本（用 Web Speech API 合成）
   * @param {Object} [options] - 可选播报参数（仅用于回退合成）
   */
  function playAudioFile(audioKey, fallbackText, options) {
    // 停止当前播放
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) {}
      currentAudio = null;
    }

    var audio = new Audio();
    audio.src = AUDIO_BASE + audioKey + '.mp3';
    audio.volume = DEFAULT_OPTIONS.volume;
    audio.preload = 'auto';

    var settled = false;

    audio.addEventListener('canplaythrough', function() {
      if (settled) return;
      settled = true;
      state = 'speaking';
      currentAudio = audio;
    });

    audio.addEventListener('error', function() {
      if (settled) return;
      settled = true;
      state = 'idle';
    });

    // 播放结束：继续队列
    audio.addEventListener('ended', function() {
      currentAudio = null;
      if (queue.length > 0) {
        var next = queue.shift();
        if (next.audioKey) {
          playAudioFile(next.audioKey, next.fallbackText);
        }
      } else {
        state = 'idle';
      }
    });

    // 立即播放（必须在用户交互上下文中，不能在事件回调中延迟播放）
    state = 'speaking';
    currentAudio = audio;
    audio.play().catch(function() {
      if (!settled) {
        settled = true;
        state = 'idle';
        currentAudio = null;
      }
    });

    // 超时保护：3 秒内未加载成功则静默放弃
    setTimeout(function() {
      if (!settled && (!currentAudio || currentAudio !== audio)) {
        // 已经被其他操作替换，忽略
        return;
      }
      if (!settled) {
        settled = true;
        if (fallbackText && isSupported()) {
          speakNow(fallbackText, options);
        } else {
          state = 'idle';
        }
      }
    }, 3000);
  }

  /**
   * 播放预生成音频文件（推荐用法）
   * 优先播放高音质 mp3，加载失败自动回退到 Web Speech API 合成
   * @param {string} audioKey - 音频文件名（不带扩展名）
   *   可用值：health_reminder_morning/noon/all_taken, medication_all_taken/untaken/untaken_one,
   *           drug_taken_metoprolol/atovastatin, notification_medication, summary_diagnosis,
   *           safety_warning_grapefruit/dose, ui_welcome/saved/recorded/photo_taken/shared/error/offline
   * @param {string} [fallbackText] - 音频加载失败时的回退文本
   * @param {Object} [options] - 可选播报参数（仅用于回退合成）
   */
  function speakFromFile(audioKey, fallbackText, options) {
    if (!audioKey) return;

    // 避免重复播报相同音频
    if (currentAudio && currentAudio.src && currentAudio.src.indexOf(audioKey) >= 0) return;
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].audioKey === audioKey) return;
    }

    if (state === 'speaking' || state === 'paused') {
      queue.push({ audioKey: audioKey, fallbackText: fallbackText, options: options });
    } else {
      playAudioFile(audioKey, fallbackText, options);
    }
  }

  // ===== 文本→预生成音频 key 映射表 =====
  // 仅使用预生成的高质量 TTS 音频，不播放机械合成音
  var TEXT_AUDIO_MAP = {
    '欢迎使用银发就医小棉袄': 'ui_welcome',
    '您好，我是小棉袄': 'onboarding_welcome',
    '已保存': 'ui_saved',
    '已录音，正在识别': 'ui_recorded',
    '已拍照，正在识别': 'ui_photo_taken',
    '已分享给家人': 'ui_shared',
    '操作失败，请重试': 'ui_error',
    '网络不可用': 'ui_offline',
    '今天吃什么药': 'medication_reminder',
    '上次看病医生说啥': 'summary_diagnosis',
    '我不舒服，记一下': 'health_record_reminder',
    '今天血压怎样': 'health_summary_reminder',
    '检测到紧急症状': 'safety_warning',
    '今天该吃两种药': 'medication_reminder',
    '上次是6月27日': 'summary_diagnosis',
    '最近血压148偏高': 'health_summary_reminder',
    '早上好，张秀兰': 'health_reminder_morning',
    '点击这里，说出今天头晕': 'onboarding_step1',
    'AI 自动整理为健康日志': 'onboarding_step1',
    '这里显示医生开的药': 'onboarding_medical_record',
    '切换到亲人页': 'onboarding_step3',
    '子女可远程查看': 'onboarding_step3',
    '切换到就医页': 'onboarding_step2',
    '记录每次看病': 'onboarding_step2',
    '专为老年人设计的': 'onboarding_intro',
    '说话就能记健康': 'onboarding_intro',
    '现在您可以开始使用': 'onboarding_closing'
  };

  /**
   * 将文本模糊匹配到预生成音频 key
   */
  function matchAudioKey(text) {
    if (!text) return null;
    // 精确匹配
    for (var key in TEXT_AUDIO_MAP) {
      if (text === key) return TEXT_AUDIO_MAP[key];
    }
    // 模糊匹配：文本包含关键词
    for (var key in TEXT_AUDIO_MAP) {
      if (text.indexOf(key) >= 0) return TEXT_AUDIO_MAP[key];
    }
    return null;
  }

  /**
   * 播报文本（仅使用预生成优质音频，不播放机械合成音）
   * @param {string} text - 待播报文本
   * @param {Object} [options] - 可选参数 {rate, volume, pitch, lang}
   */
  function speak(text, options) {
    if (!text || typeof text !== 'string') return;

    // 避免重复播报
    if (currentUtterance && currentUtterance.text === text) return;
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].text === text || (queue[i].audioKey && queue[i].text === text)) return;
    }

    // 尝试匹配预生成音频 key
    var audioKey = matchAudioKey(text);
    if (audioKey) {
      speakFromFile(audioKey, text, options);
      return;
    }

    // 无匹配预生成音频 → 不播放（拒绝机械合成音）
    console.log('[SilverTTS] 无预生成音频匹配，跳过播报:', text.substring(0, 30));
  }

  /**
   * 紧急播报（打断当前播报，清空队列后立即播放）
   * @param {string} text - 紧急播报文本
   * @param {string} [audioKey] - 可选预生成音频 key（如 'safety_warning_grapefruit'）
   */
  function speakUrgent(text, audioKey) {
    if (!text && !audioKey) return;

    // 清空普通队列
    queue = [];

    // 停止 Web Speech API
    if (isSupported() && (synth.speaking || synth.pending)) {
      synth.cancel();
    }
    currentUtterance = null;

    // 停止音频文件
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) {}
      currentAudio = null;
    }

    state = 'idle';

    // 优先用预生成音频
    if (audioKey) {
      playAudioFile(audioKey, text);
    } else if (text && isSupported()) {
      speakNow(text);
    } else if (text) {
      console.warn('[SilverTTS] 浏览器不支持语音播报，跳过紧急播报:', text);
    }
  }

  /**
   * 停止所有播报并清空队列
   */
  function stop() {
    queue = [];
    if (isSupported() && (synth.speaking || synth.pending)) {
      synth.cancel();
    }
    currentUtterance = null;
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) {}
      currentAudio = null;
    }
    state = 'idle';
  }

  /**
   * 暂停当前播报
   */
  function pause() {
    if (state === 'speaking') {
      if (currentAudio) {
        currentAudio.pause();
      } else if (isSupported()) {
        synth.pause();
      }
      state = 'paused';
    }
  }

  /**
   * 恢复已暂停的播报
   */
  function resume() {
    if (state === 'paused') {
      if (currentAudio) {
        currentAudio.play().catch(function() {});
      } else if (isSupported()) {
        synth.resume();
      }
      state = 'speaking';
    }
  }

  /**
   * 获取可用的语音列表
   */
  function getVoices() {
    if (!isSupported()) return [];
    return synth.getVoices();
  }

  /**
   * 设置指定语音（通过 voiceURI）
   * @param {string} voiceURI
   */
  function setVoice(voiceURI) {
    selectedVoiceURI = voiceURI || null;
  }

  /**
   * 获取当前播报状态
   * @returns {string} idle / speaking / paused / unsupported
   */
  function getState() {
    if (!isSupported() && !currentAudio) return 'unsupported';
    return state;
  }

  // 暴露 API 到全局
  window.SilverTTS = {
    speak: speak,
    speakFromFile: speakFromFile,
    speakUrgent: speakUrgent,
    stop: stop,
    pause: pause,
    resume: resume,
    isSupported: isSupported,
    getVoices: getVoices,
    setVoice: setVoice,
    getState: getState
  };
})();
