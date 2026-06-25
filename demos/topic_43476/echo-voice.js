/**
 * Echo Voice Module
 * Web Speech API wrapper for Speech-to-Text (STT) and Text-to-Speech (TTS)
 * Provides push-to-talk voice input and voice output for Echo's responses
 */

class EchoVoice {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStateChange = null;
    this.voiceEnabled = false;
    this.selectedVoice = null;

    this._initRecognition();
    this._initVoices();
  }

  /**
   * Initialize SpeechRecognition
   */
  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[EchoVoice] SpeechRecognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalText && this.onResultCallback) {
        this.onResultCallback(finalText.trim(), true);
      } else if (interimText && this.onResultCallback) {
        this.onResultCallback(interimText.trim(), false);
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this._notifyStateChange();
      if (this.onErrorCallback) {
        const errorMessages = {
          'no-speech': '没有检测到语音，请重试',
          'audio-capture': '无法访问麦克风，请检查权限',
          'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
          'network': '语音识别需要网络连接',
          'aborted': '语音识别已取消',
        };
        this.onErrorCallback(errorMessages[event.error] || `语音识别错误: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.isListening = false;
        this._notifyStateChange();
      }
    };
  }

  /**
   * Initialize TTS voices
   */
  _initVoices() {
    if (!this.synthesis) {
      console.warn('[EchoVoice] speechSynthesis not supported');
      return;
    }

    const loadVoices = () => {
      const voices = this.synthesis.getVoices();
      // Prefer Chinese voice
      this.selectedVoice = voices.find(v => v.lang.startsWith('zh')) ||
                           voices.find(v => v.lang.startsWith('cmn')) ||
                           voices[0] || null;
    };

    loadVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Check if STT is supported
   */
  isSTTSupported() {
    return this.recognition !== null;
  }

  /**
   * Check if TTS is supported
   */
  isTTSSupported() {
    return this.synthesis !== null;
  }

  /**
   * Start listening for voice input
   * @param {function} onResult - callback(text, isFinal)
   * @param {function} onError - callback(errorMessage)
   */
  startListening(onResult, onError) {
    if (!this.recognition) {
      if (onError) onError('当前浏览器不支持语音识别，请使用 Chrome 或 Edge');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    // Stop any ongoing speech
    this.stopSpeaking();

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      this.recognition.start();
      this.isListening = true;
      this._notifyStateChange();
    } catch (e) {
      if (onError) onError('启动语音识别失败，请重试');
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
      this._notifyStateChange();
    }
  }

  /**
   * Speak text using TTS
   * @param {string} text - text to speak
   * @param {function} onEnd - callback when speech ends
   */
  speak(text, onEnd) {
    if (!this.synthesis) {
      if (onEnd) onEnd();
      return;
    }

    // Stop any ongoing speech
    this.synthesis.cancel();

    // Clean text: remove markdown and HTML
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' 代码块 ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/[#*`_~]/g, '')
      .replace(/\n{2,}/g, '。')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.currentUtterance = utterance;
      this._notifyStateChange();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this._notifyStateChange();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this._notifyStateChange();
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this._notifyStateChange();
  }

  /**
   * Enable/disable voice mode (auto-speak Echo responses)
   */
  setVoiceEnabled(enabled) {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  /**
   * Get current voice state
   */
  getVoiceState() {
    return {
      listening: this.isListening,
      speaking: this.isSpeaking,
      voiceEnabled: this.voiceEnabled,
      sttSupported: this.isSTTSupported(),
      ttsSupported: this.isTTSSupported(),
    };
  }

  /**
   * Register state change callback
   */
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  /**
   * Notify state change
   */
  _notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getVoiceState());
    }
  }
}

// Export as global
window.EchoVoice = EchoVoice;
