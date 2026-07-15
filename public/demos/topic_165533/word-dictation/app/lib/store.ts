// localStorage 存储：听写历史 + 错词本 + 设置

export type WordItem = { word: string; meaning: string };

export type Session = {
  id: string;
  date: string; // ISO
  words: WordItem[];
  wrongWords: string[];
};

export type WrongEntry = WordItem & { count: number };

export type Settings = {
  repeats: number; // 每个单词读几遍
  interval: number; // 单词之间间隔秒数
  readMeaning: boolean; // 是否朗读中文释义
  rate: number; // 语速
};

export const DEFAULT_SETTINGS: Settings = {
  repeats: 2,
  interval: 5,
  readMeaning: false,
  rate: 0.9,
};

const SESSIONS_KEY = "wd:sessions";
const WRONG_KEY = "wd:wrongbook";
const SETTINGS_KEY = "wd:settings";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储满或隐私模式，忽略
  }
}

export function loadSessions(): Session[] {
  return load<Session[]>(SESSIONS_KEY, []);
}

export function addSession(session: Session) {
  const all = loadSessions();
  all.unshift(session);
  save(SESSIONS_KEY, all.slice(0, 100));
}

export function loadWrongBook(): WrongEntry[] {
  return load<WrongEntry[]>(WRONG_KEY, []);
}

export function mergeWrongBook(items: WordItem[]) {
  const book = loadWrongBook();
  for (const item of items) {
    const key = item.word.toLowerCase();
    const existing = book.find((e) => e.word.toLowerCase() === key);
    if (existing) {
      existing.count += 1;
      if (!existing.meaning && item.meaning) existing.meaning = item.meaning;
    } else {
      book.push({ ...item, count: 1 });
    }
  }
  save(WRONG_KEY, book);
}

export function removeFromWrongBook(word: string) {
  const book = loadWrongBook().filter(
    (e) => e.word.toLowerCase() !== word.toLowerCase()
  );
  save(WRONG_KEY, book);
}

export function clearWrongBook() {
  save(WRONG_KEY, []);
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(s: Settings) {
  save(SETTINGS_KEY, s);
}
