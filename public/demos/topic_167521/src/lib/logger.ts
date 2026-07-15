// 统一日志系统：内存环形缓冲 + console 同步输出

export type LogCategory = 'llm' | 'stage' | 'interrupt' | 'error' | 'question' | 'schedule';

export interface LogEntry {
  id: number;
  timestamp: Date;
  category: LogCategory;
  message: string;
  data?: unknown;
}

const MAX_ENTRIES = 500;
let buffer: LogEntry[] = [];
let counter = 0;

const categoryPrefix: Record<LogCategory, string> = {
  llm: '[LLM]',
  stage: '[STAGE]',
  interrupt: '[INTERRUPT]',
  error: '[ERROR]',
  question: '[QUESTION]',
  schedule: '[SCHEDULE]',
};

export function log(category: LogCategory, message: string, data?: unknown): void {
  const entry: LogEntry = {
    id: ++counter,
    timestamp: new Date(),
    category,
    message,
    data,
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer = buffer.slice(-MAX_ENTRIES);
  }
  const prefix = categoryPrefix[category];
  const timeStr = entry.timestamp.toLocaleTimeString('zh-CN', { hour12: false });
  if (data !== undefined) {
    console.log(`${prefix} ${timeStr} ${message}`, data);
  } else {
    console.log(`${prefix} ${timeStr} ${message}`);
  }
}

export function getLogs(): LogEntry[] {
  return [...buffer];
}

export function clearLogs(): void {
  buffer = [];
  counter = 0;
}

export function formatLogsForExport(): string {
  return buffer.map(e => {
    const timeStr = e.timestamp.toLocaleTimeString('zh-CN', { hour12: false });
    const dataStr = e.data !== undefined ? ` ${JSON.stringify(e.data)}` : '';
    return `[${e.category}] ${timeStr} ${e.message}${dataStr}`;
  }).join('\n');
}
