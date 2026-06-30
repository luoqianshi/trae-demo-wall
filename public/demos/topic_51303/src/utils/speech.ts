/**
 * 语音播报工具，基于浏览器 SpeechSynthesis API。
 * 老人友好：关键信息（温度、诊断结果、AI 回答）支持一键听语音。
 */

let voicesCache: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      voicesCache = existing;
      resolve(existing);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache);
    };
  });
}

let supported: boolean | null = null;
export function isSpeechSupported(): boolean {
  if (supported === null) {
    supported = typeof window !== "undefined" && "speechSynthesis" in window;
  }
  return supported;
}

/** 播报中文文本 */
export async function speak(text: string): Promise<void> {
  if (!isSpeechSupported()) return;
  const voices = voicesCache.length ? voicesCache : await loadVoices();
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.95;
  utter.pitch = 1;
  const zh = voices.find((v) => v.lang.startsWith("zh"));
  if (zh) utter.voice = zh;
  window.speechSynthesis.speak(utter);
}

/** 停止播报 */
export function stopSpeak(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
