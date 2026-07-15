// 浏览器 Web Speech API 封装。iOS 上首次播放必须由用户手势触发。

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const got = window.speechSynthesis.getVoices();
    if (got.length > 0) return resolve(got);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = finish;
    setTimeout(finish, 1500);
  });
}

const EN_PREFERRED = ["Samantha", "Google US English", "Alex", "Karen", "Daniel"];
const ZH_PREFERRED = ["Tingting", "Ting-Ting", "婷婷", "Google 普通话"];

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: "en" | "zh"
): SpeechSynthesisVoice | null {
  const preferred = lang === "en" ? EN_PREFERRED : ZH_PREFERRED;
  for (const name of preferred) {
    const v = voices.find((v) => v.name.includes(name));
    if (v) return v;
  }
  const prefix = lang === "en" ? "en-US" : "zh-CN";
  return (
    voices.find((v) => v.lang.replace("_", "-").startsWith(prefix)) ??
    voices.find((v) => v.lang.startsWith(lang)) ??
    null
  );
}

export function speak(
  text: string,
  voice: SpeechSynthesisVoice | null,
  lang: "en" | "zh",
  rate: number
): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? (lang === "en" ? "en-US" : "zh-CN");
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
}
