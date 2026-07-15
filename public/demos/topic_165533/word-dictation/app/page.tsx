"use client";

import { useEffect, useRef, useState } from "react";
import { loadVoices, pickVoice, speak, stopSpeaking } from "./lib/tts";
import {
  WordItem,
  Settings,
  loadSettings,
  saveSettings,
  loadSessions,
  addSession,
  Session,
  loadWrongBook,
  mergeWrongBook,
  removeFromWrongBook,
  clearWrongBook,
  WrongEntry,
} from "./lib/store";

type View =
  | "home"
  | "confirm"
  | "dictate"
  | "check"
  | "result"
  | "wrongbook"
  | "history";

function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

// HEIC/HEIF（iPhone 默认格式）浏览器 canvas 无法解码，用 heic2any（libheif wasm）转成 JPEG。
// 动态 import，只有真遇到 HEIC 时才加载这个较大的库。
async function heicToJpegBlob(file: Blob): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
}

function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };
    img.onload = () => done(() => resolve(img));
    img.onerror = () => done(() => reject(new Error("DECODE_FAILED")));
    // 某些图片既不触发 onload 也不触发 onerror，加超时兜底，避免"卡住无反应"
    setTimeout(() => done(() => reject(new Error("DECODE_TIMEOUT"))), 8000);
    img.src = dataUrl;
  });
}

// 把用户选的图片处理成 GLM-OCR 接受的 JPEG data URL（最长边 1600px）。
// 支持所有主流格式：JPG/PNG/WebP/GIF/BMP 走原生 canvas；HEIC/HEIF 先用 heic2any 转 JPEG。
async function compressImage(file: File): Promise<string> {
  const isHeic =
    /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

  // HEIC 先转 JPEG，其它格式直接用原文件
  let source: Blob = file;
  if (isHeic) {
    try {
      source = await heicToJpegBlob(file);
    } catch {
      throw new Error(`「${file.name}」HEIC 转换失败，请重试或换一张图`);
    }
  }

  let img: HTMLImageElement | null = null;
  try {
    img = await decodeImage(await readAsDataURL(source));
  } catch {
    // 兜底：没被识别成 HEIC 但 canvas 也解不了（个别设备 HEIC 的 type/后缀为空），再尝试转一次
    if (!isHeic) {
      try {
        const jpeg = await heicToJpegBlob(file);
        img = await decodeImage(await readAsDataURL(jpeg));
      } catch {
        img = null;
      }
    }
  }
  if (!img) {
    throw new Error(
      `「${file.name}」无法读取，请换一张常见格式的照片（支持 JPG / PNG / HEIC / WebP 等）`
    );
  }

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持图片处理");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [images, setImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [words, setWords] = useState<WordItem[]>([]);
  const [settings, setSettings] = useState<Settings>({
    repeats: 2,
    interval: 5,
    readMeaning: false,
    rate: 0.9,
  });
  const [wrongBook, setWrongBook] = useState<WrongEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // 听写状态
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const runIdRef = useRef(0);
  const voicesRef = useRef<{
    en: SpeechSynthesisVoice | null;
    zh: SpeechSynthesisVoice | null;
  }>({ en: null, zh: null });

  // 对答案状态
  const [wrongSet, setWrongSet] = useState<Set<string>>(new Set());
  const [lastWrong, setLastWrong] = useState<WordItem[]>([]);

  useEffect(() => {
    setSettings(loadSettings());
    setWrongBook(loadWrongBook());
    setSessions(loadSessions());
    loadVoices().then((voices) => {
      voicesRef.current = {
        en: pickVoice(voices, "en"),
        zh: pickVoice(voices, "zh"),
      };
    });
  }, []);

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  // ---------- 拍照识别 ----------

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    setProcessing(true);
    // 逐张独立处理：一张失败不影响其他，成功的立刻显示，失败的收集提示
    const ok: string[] = [];
    const failed: string[] = [];
    for (const file of files) {
      try {
        ok.push(await compressImage(file));
      } catch (err) {
        failed.push(err instanceof Error ? err.message : `「${file.name}」处理失败`);
      }
    }
    if (ok.length > 0) {
      setImages((prev) => [...prev, ...ok].slice(0, 6));
    }
    if (failed.length > 0) {
      setError(failed.join("\n"));
    }
    setProcessing(false);
  }

  async function recognize() {
    if (images.length === 0) return;
    setRecognizing(true);
    setError("");
    setElapsed(0);
    const startedAt = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAt) / 1000)),
      1000
    );
    // 兜底：60s 还没回就中断，给出提示而不是无限等待
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "识别失败");
      if (!json.words?.length)
        throw new Error("没有识别到单词，请换张更清晰的照片");
      setWords(json.words);
      setView("confirm");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("识别超时（超过 60 秒），请检查网络后重试，或换一张更清晰的照片");
      } else {
        setError(e instanceof Error ? e.message : "识别失败，请重试");
      }
    } finally {
      clearInterval(timer);
      clearTimeout(abortTimer);
      setRecognizing(false);
    }
  }

  // ---------- 听写引擎 ----------

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function playFrom(index: number, list: WordItem[] = words) {
    const runId = ++runIdRef.current;
    const alive = () => runIdRef.current === runId;
    stopSpeaking();
    setPlaying(true);
    for (let i = index; i < list.length; i++) {
      if (!alive()) return;
      setCurrent(i);
      const w = list[i];
      for (let r = 0; r < settings.repeats; r++) {
        await speak(w.word, voicesRef.current.en, "en", settings.rate);
        if (!alive()) return;
        await delay(700);
        if (!alive()) return;
      }
      if (settings.readMeaning && w.meaning) {
        await speak(w.meaning, voicesRef.current.zh, "zh", 1);
        if (!alive()) return;
      }
      if (i < list.length - 1) {
        await delay(settings.interval * 1000);
        if (!alive()) return;
      }
    }
    if (!alive()) return;
    setPlaying(false);
    await delay(800);
    if (!alive()) return;
    startCheck();
  }

  function pause() {
    runIdRef.current++;
    stopSpeaking();
    setPlaying(false);
  }

  function jumpTo(index: number) {
    if (index < 0 || index >= words.length) return;
    playFrom(index);
  }

  function startDictation() {
    runIdRef.current++;
    stopSpeaking();
    setCurrent(0);
    setPlaying(false);
    setView("dictate");
  }

  function exitDictation() {
    pause();
    startCheck();
  }

  // ---------- 对答案 ----------

  function startCheck() {
    runIdRef.current++;
    stopSpeaking();
    setWrongSet(new Set());
    setView("check");
  }

  function toggleWrong(word: string) {
    setWrongSet((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  function saveResult() {
    const wrong = words.filter((w) => wrongSet.has(w.word));
    setLastWrong(wrong);
    mergeWrongBook(wrong);
    addSession({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      words,
      wrongWords: wrong.map((w) => w.word),
    });
    setWrongBook(loadWrongBook());
    setSessions(loadSessions());
    setView("result");
  }

  function dictateList(list: WordItem[]) {
    if (list.length === 0) return;
    setWords(list);
    runIdRef.current++;
    stopSpeaking();
    setCurrent(0);
    setPlaying(false);
    setView("dictate");
  }

  function goHome() {
    runIdRef.current++;
    stopSpeaking();
    setImages([]);
    setWords([]);
    setError("");
    setView("home");
  }

  // ---------- UI ----------

  const btn =
    "rounded-2xl font-semibold active:scale-95 transition-transform select-none";
  const btnPrimary = `${btn} bg-blue-600 text-white shadow-lg shadow-blue-200`;
  const btnGhost = `${btn} bg-white text-gray-700 border border-gray-200`;

  function Header({ title, onBack }: { title: string; onBack?: () => void }) {
    return (
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-2xl text-gray-500 -ml-1 px-1"
          >
            ‹
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    );
  }

  if (view === "home") {
    return (
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto px-5 pb-10">
        <div className="pt-14 pb-8 text-center">
          <div className="text-5xl mb-3">📸</div>
          <h1 className="text-2xl font-bold">拍照听写</h1>
          <p className="text-gray-500 mt-2 text-sm">
            拍下单词表，自动识别并按顺序听写
          </p>
        </div>

        <label
          className={`${btnPrimary} block text-center text-lg py-4 ${
            processing ? "opacity-60 pointer-events-none" : "cursor-pointer"
          }`}
        >
          {processing ? "正在处理图片…" : "📷 拍照 / 选择图片"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={processing}
            onChange={onPickImages}
          />
        </label>

        {images.length > 0 && (
          <div className="mt-5">
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`第${i + 1}张`}
                    className="rounded-xl w-full h-24 object-cover border border-gray-200"
                  />
                  <button
                    onClick={() =>
                      setImages(images.filter((_, j) => j !== i))
                    }
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-6 h-6 text-sm leading-6"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={recognize}
              disabled={recognizing}
              className={`${btnPrimary} w-full py-4 text-lg mt-4 disabled:opacity-60`}
            >
              {recognizing
                ? `识别中，请稍候…${elapsed > 0 ? ` ${elapsed}s` : ""}`
                : `开始识别（${images.length} 张）`}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-600 text-sm bg-red-50 rounded-xl p-3 whitespace-pre-line">
            {error}
          </p>
        )}

        <div className="mt-auto pt-10 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setWrongBook(loadWrongBook());
              setView("wrongbook");
            }}
            className={`${btnGhost} py-4`}
          >
            📕 错词本
            {wrongBook.length > 0 && (
              <span className="ml-1 text-red-500">({wrongBook.length})</span>
            )}
          </button>
          <button
            onClick={() => {
              setSessions(loadSessions());
              setView("history");
            }}
            className={`${btnGhost} py-4`}
          >
            🕐 历史记录
          </button>
        </div>
      </main>
    );
  }

  if (view === "confirm") {
    return (
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto pb-8">
        <Header title={`确认单词（${words.length} 个）`} onBack={goHome} />
        <div className="flex-1 px-5 space-y-2">
          {words.map((w, i) => (
            <div
              key={`${w.word}-${i}`}
              className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5"
            >
              <span className="text-gray-400 text-sm w-6 text-right shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{w.word}</div>
                <div className="text-sm text-gray-500 truncate">
                  {w.meaning}
                </div>
              </div>
              <button
                onClick={() => {
                  if (i > 0) {
                    const next = [...words];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    setWords(next);
                  }
                }}
                className="text-gray-400 px-1.5 text-lg"
              >
                ↑
              </button>
              <button
                onClick={() => {
                  if (i < words.length - 1) {
                    const next = [...words];
                    [next[i], next[i + 1]] = [next[i + 1], next[i]];
                    setWords(next);
                  }
                }}
                className="text-gray-400 px-1.5 text-lg"
              >
                ↓
              </button>
              <button
                onClick={() => setWords(words.filter((_, j) => j !== i))}
                className="text-red-400 px-1.5 text-lg"
              >
                ×
              </button>
            </div>
          ))}

          <AddWordRow onAdd={(w) => setWords([...words, w])} />

          <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4 space-y-4">
            <div className="font-semibold text-sm text-gray-600">听写设置</div>
            <SettingRow label="每个单词读几遍">
              <Stepper
                value={settings.repeats}
                min={1}
                max={3}
                onChange={(v) => updateSettings({ repeats: v })}
              />
            </SettingRow>
            <SettingRow label="单词间隔（秒）">
              <Stepper
                value={settings.interval}
                min={3}
                max={15}
                onChange={(v) => updateSettings({ interval: v })}
              />
            </SettingRow>
            <SettingRow label="朗读中文释义">
              <button
                onClick={() =>
                  updateSettings({ readMeaning: !settings.readMeaning })
                }
                className={`w-12 h-7 rounded-full transition-colors ${
                  settings.readMeaning ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.readMeaning ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </SettingRow>
            <SettingRow label="语速">
              <Stepper
                value={settings.rate}
                min={0.5}
                max={1.2}
                step={0.1}
                onChange={(v) =>
                  updateSettings({ rate: Math.round(v * 10) / 10 })
                }
              />
            </SettingRow>
          </div>
        </div>
        <div className="px-5 pt-4">
          <button
            onClick={startDictation}
            disabled={words.length === 0}
            className={`${btnPrimary} w-full py-4 text-lg disabled:opacity-50`}
          >
            🎧 开始听写
          </button>
        </div>
      </main>
    );
  }

  if (view === "dictate") {
    return (
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto pb-8">
        <Header title="听写中" />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="text-gray-400 text-sm mb-2">当前进度</div>
          <div className="text-6xl font-bold tabular-nums">
            {current + 1}
            <span className="text-2xl text-gray-400"> / {words.length}</span>
          </div>
          <div className="mt-8 h-16 flex items-center">
            {playing ? (
              <div className="flex gap-1.5 items-end h-8">
                <span className="w-1.5 bg-blue-500 rounded animate-pulse h-4" />
                <span className="w-1.5 bg-blue-500 rounded animate-pulse h-8 [animation-delay:150ms]" />
                <span className="w-1.5 bg-blue-500 rounded animate-pulse h-5 [animation-delay:300ms]" />
                <span className="w-1.5 bg-blue-500 rounded animate-pulse h-7 [animation-delay:450ms]" />
              </div>
            ) : (
              <div className="text-gray-400">
                {current === 0 ? "点下方按钮开始" : "已暂停"}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => jumpTo(current - 1)}
              disabled={current === 0}
              className={`${btnGhost} py-4 disabled:opacity-40`}
            >
              ⏮ 上一个
            </button>
            <button
              onClick={() => jumpTo(current)}
              className={`${btnGhost} py-4`}
            >
              🔁 重听
            </button>
            <button
              onClick={() => jumpTo(current + 1)}
              disabled={current >= words.length - 1}
              className={`${btnGhost} py-4 disabled:opacity-40`}
            >
              下一个 ⏭
            </button>
          </div>
          <button
            onClick={() => (playing ? pause() : playFrom(current))}
            className={`${btnPrimary} w-full py-4 text-lg`}
          >
            {playing ? "⏸ 暂停" : current === 0 ? "▶️ 开始播放" : "▶️ 继续"}
          </button>
          <button onClick={exitDictation} className={`${btnGhost} w-full py-3`}>
            结束听写，去对答案
          </button>
        </div>
      </main>
    );
  }

  if (view === "check") {
    return (
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto pb-8">
        <Header title="对答案" />
        <p className="px-5 text-sm text-gray-500 -mt-1 pb-3">
          对照纸上的听写，写错的点一下标红
        </p>
        <div className="flex-1 px-5 space-y-2">
          {words.map((w, i) => {
            const wrong = wrongSet.has(w.word);
            return (
              <button
                key={`${w.word}-${i}`}
                onClick={() => toggleWrong(w.word)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  wrong ? "bg-red-50 border-red-300" : "bg-white border-gray-200"
                }`}
              >
                <span className="text-gray-400 text-sm w-6 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold ${wrong ? "text-red-600" : ""}`}
                  >
                    {w.word}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {w.meaning}
                  </div>
                </div>
                <span className="text-xl">{wrong ? "❌" : "✅"}</span>
              </button>
            );
          })}
        </div>
        <div className="px-5 pt-4">
          <button
            onClick={saveResult}
            className={`${btnPrimary} w-full py-4 text-lg`}
          >
            保存结果（错 {wrongSet.size} 个）
          </button>
        </div>
      </main>
    );
  }

  if (view === "result") {
    const total = words.length;
    const wrongCount = lastWrong.length;
    const right = total - wrongCount;
    return (
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto px-5 pb-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">{wrongCount === 0 ? "🎉" : "💪"}</div>
          <div className="text-3xl font-bold">
            {right} / {total}
          </div>
          <p className="text-gray-500 mt-2">
            {wrongCount === 0
              ? "全对！太棒了！"
              : `写错 ${wrongCount} 个，已加入错词本`}
          </p>
        </div>
        <div className="space-y-3">
          {wrongCount > 0 && (
            <button
              onClick={() => dictateList(lastWrong)}
              className={`${btnPrimary} w-full py-4 text-lg`}
            >
              🔁 马上重听错词（{wrongCount} 个）
            </button>
          )}
          <button onClick={goHome} className={`${btnGhost} w-full py-4`}>
            返回首页
          </button>
        </div>
      </main>
    );
  }

  if (view === "wrongbook") {
    return (
      <main className="flex-1 flex flex-col max-w-md w-full mx-auto pb-8">
        <Header title={`错词本（${wrongBook.length}）`} onBack={goHome} />
        <div className="flex-1 px-5 space-y-2">
          {wrongBook.length === 0 && (
            <p className="text-gray-400 text-center pt-20">
              还没有错词，继续保持！
            </p>
          )}
          {wrongBook.map((w) => (
            <div
              key={w.word}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{w.word}</div>
                <div className="text-sm text-gray-500 truncate">
                  {w.meaning}
                </div>
              </div>
              <span className="text-xs text-red-400 shrink-0">
                错 {w.count} 次
              </span>
              <button
                onClick={() => {
                  removeFromWrongBook(w.word);
                  setWrongBook(loadWrongBook());
                }}
                className="text-gray-400 px-1 text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {wrongBook.length > 0 && (
          <div className="px-5 pt-4 space-y-3">
            <button
              onClick={() =>
                dictateList(
                  wrongBook.map(({ word, meaning }) => ({ word, meaning }))
                )
              }
              className={`${btnPrimary} w-full py-4 text-lg`}
            >
              🎧 听写全部错词
            </button>
            <button
              onClick={() => {
                if (confirm("确定清空错词本吗？")) {
                  clearWrongBook();
                  setWrongBook([]);
                }
              }}
              className={`${btnGhost} w-full py-3 text-red-500`}
            >
              清空错词本
            </button>
          </div>
        )}
      </main>
    );
  }

  // history
  return (
    <main className="flex-1 flex flex-col max-w-md w-full mx-auto pb-8">
      <Header title="历史记录" onBack={goHome} />
      <div className="flex-1 px-5 space-y-2">
        {sessions.length === 0 && (
          <p className="text-gray-400 text-center pt-20">还没有听写记录</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {new Date(s.date).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm text-gray-500">
                共 {s.words.length} 个 · 错 {s.wrongWords.length} 个
              </div>
            </div>
            <button
              onClick={() => dictateList(s.words)}
              className={`${btnGhost} px-4 py-2 text-sm shrink-0`}
            >
              再听写
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
        className="w-8 h-8 rounded-full bg-gray-100 text-lg leading-none"
      >
        −
      </button>
      <span className="w-8 text-center font-semibold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}
        className="w-8 h-8 rounded-full bg-gray-100 text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}

function AddWordRow({ onAdd }: { onAdd: (w: WordItem) => void }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-300 px-3 py-2">
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="补充单词"
        className="flex-1 min-w-0 bg-transparent outline-none text-base py-1"
      />
      <input
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        placeholder="释义（可选）"
        className="w-24 bg-transparent outline-none text-sm py-1"
      />
      <button
        onClick={() => {
          if (!word.trim()) return;
          onAdd({ word: word.trim(), meaning: meaning.trim() });
          setWord("");
          setMeaning("");
        }}
        className="text-blue-600 font-semibold px-1"
      >
        添加
      </button>
    </div>
  );
}
