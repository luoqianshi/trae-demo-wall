/**
 * 溯光应用 — 语音交互引擎
 *
 * 基于 Web Speech API 封装，提供两个 React Hook（语音识别 & 语音合成）
 * 以及一个浏览器兼容性检测工具函数。
 *
 * @module lib/speech
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** useSpeechRecognition 返回值 */
export interface SpeechRecognitionResult {
  /** 当前识别到的文本（包含中间结果） */
  transcript: string;
  /** 是否正在监听 */
  isListening: boolean;
  /** 开始监听 */
  startListening: () => void;
  /** 停止监听 */
  stopListening: () => void;
  /** 错误信息，无错误时为 null */
  error: string | null;
}

/** useSpeechSynthesis 返回值 */
export interface SpeechSynthesisResult {
  /** 朗读指定文本 */
  speak: (text: string) => void;
  /** 停止当前朗读 */
  stop: () => void;
  /** 是否正在朗读 */
  isSpeaking: boolean;
}

/** 语音支持情况 */
export interface SpeechSupport {
  /** 浏览器是否支持语音识别（STT） */
  stt: boolean;
  /** 浏览器是否支持语音合成（TTS） */
  tts: boolean;
}

// ---------------------------------------------------------------------------
// 浏览器兼容性
// ---------------------------------------------------------------------------

/**
 * 检测当前浏览器是否支持语音识别（STT）和语音合成（TTS）。
 *
 * @returns 包含 stt 和 tts 两个布尔值的对象
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = any;

export function checkSpeechSupport(): SpeechSupport {
  const hasSTT = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  return {
    stt: hasSTT,
    tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}

// ---------------------------------------------------------------------------
// useSpeechRecognition hook
// ---------------------------------------------------------------------------

/**
 * 语音识别（STT）Hook。
 *
 * 基于 Web Speech API 的 SpeechRecognition，提供实时语音转文字能力。
 * 默认配置：中文（zh-CN）、持续监听、返回中间结果。
 *
 * @example
 * ```tsx
 * const { transcript, isListening, startListening, stopListening, error } = useSpeechRecognition();
 * ```
 *
 * @returns 语音识别状态和控制方法
 */
export function useSpeechRecognition(): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionCtor | null>(null);

  useEffect(() => {
    // 仅在客户端执行
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor =
      (window as unknown as Record<string, SpeechRecognitionCtor>).SpeechRecognition ??
      (window as unknown as Record<string, SpeechRecognitionCtor>).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    /** 识别结果回调 */
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // 优先显示最终结果，再拼接中间结果
      setTranscript(finalTranscript || interimTranscript);
    };

    /** 开始监听 */
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    /** 停止监听 */
    recognition.onend = () => {
      setIsListening(false);
    };

    /** 错误处理 */
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);

      switch (event.error) {
        case 'no-speech':
          setError('没有检测到语音输入，请再试一次');
          break;
        case 'audio-capture':
          setError('无法访问麦克风，请检查设备权限');
          break;
        case 'not-allowed':
          setError('麦克风权限被拒绝，请在浏览器设置中允许');
          break;
        case 'network':
          setError('网络连接失败，语音识别需要网络支持');
          break;
        case 'aborted':
          // 用户主动取消，不视为错误
          setError(null);
          break;
        default:
          setError(`语音识别出错：${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  /** 开始语音识别 */
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
    } else {
      setError('语音识别未初始化，请检查浏览器兼容性');
    }
  }, []);

  /** 停止语音识别 */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { transcript, isListening, startListening, stopListening, error };
}

// ---------------------------------------------------------------------------
// useSpeechSynthesis hook
// ---------------------------------------------------------------------------

/**
 * 语音合成（TTS）Hook。
 *
 * 基于 Web Speech API 的 SpeechSynthesis，提供文字转语音朗读能力。
 * 默认配置：中文（zh-CN）、语速 0.9（稍慢，更温暖自然）。
 *
 * @example
 * ```tsx
 * const { speak, stop, isSpeaking } = useSpeechSynthesis();
 * speak('你好，今天辛苦啦！');
 * ```
 *
 * @returns 语音合成控制方法
 */
export function useSpeechSynthesis(): SpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleEnd = () => setIsSpeaking(false);
    window.speechSynthesis.addEventListener('end', handleEnd);
    window.speechSynthesis.addEventListener('error', handleEnd);

    return () => {
      window.speechSynthesis.removeEventListener('end', handleEnd);
      window.speechSynthesis.removeEventListener('error', handleEnd);
    };
  }, []);

  /**
   * 朗读指定文本。
   * 每次调用会先取消上一条朗读，确保不会叠加。
   *
   * @param text - 要朗读的文本
   */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // 取消之前的朗读
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9; // 稍慢，更温暖
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  /** 停止当前朗读 */
  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
