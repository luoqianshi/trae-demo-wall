import { useCallback } from 'react';
import * as Speech from 'expo-speech';

let lastSpokenText = '';

export function useSpeech() {
  const speak = useCallback((text, options = {}) => {
    lastSpokenText = text;
    Speech.stop();
    Speech.speak(text, {
      language: 'zh-CN',
      rate: 0.9,
      pitch: 1.0,
      ...options,
    });
  }, []);

  const replay = useCallback(() => {
    if (lastSpokenText) {
      Speech.stop();
      Speech.speak(lastSpokenText, { language: 'zh-CN', rate: 0.9 });
    }
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
  }, []);

  return { speak, replay, stop };
}