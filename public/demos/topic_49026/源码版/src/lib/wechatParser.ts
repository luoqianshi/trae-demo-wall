export interface ParsedWeChatMessage {
  /** 消息时间戳（UTC 毫秒） */
  timestamp: number;
  /** 发送者昵称 */
  sender: string;
  /** 消息正文（已 trim，多行内容保留换行） */
  content: string;
  /** 是否由当前用户「我」发送 */
  isMe: boolean;
}

export interface ParsedWeChatChat {
  /** 聊天对象名称 */
  contactName: string;
  /** 该聊天对象的消息列表 */
  messages: ParsedWeChatMessage[];
}

export interface WeChatParseResult {
  /** 解析出的所有聊天对象 */
  chats: ParsedWeChatChat[];
  /** 消息总数 */
  totalMessages: number;
  /** 解析过程中产生的错误信息 */
  errors: string[];
}

const CHAT_HEADER_RE = /^聊天对象[：:]\s*(.+)$/;
const MESSAGE_HEADER_RE =
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+(.+)$/;

/**
 * 解析微信 PC 端导出的 TXT 聊天记录。
 *
 * 支持的格式示例：
 * ```
 * 聊天对象：张三
 *
 * 2024-05-01 09:00:00 我
 * 早上好
 *
 * 2024-05-01 09:01:00 张三
 * 早啊
 * 这是续行的第二行
 * ```
 */
export function parseWeChatTxt(text: string): ParsedWeChatChat[] {
  const chats: ParsedWeChatChat[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const headerMatch = lines[i].match(CHAT_HEADER_RE);
    if (headerMatch) {
      const contactName = headerMatch[1].trim();
      const chat: ParsedWeChatChat = { contactName, messages: [] };
      i += 1;

      while (i < lines.length && !CHAT_HEADER_RE.test(lines[i])) {
        const messageMatch = lines[i].match(MESSAGE_HEADER_RE);
        if (messageMatch) {
          const [, year, month, day, hour, minute, second, sender] = messageMatch;
          const senderName = sender.trim();
          const timestamp = Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second)
          );

          i += 1;
          const contentLines: string[] = [];
          while (i < lines.length) {
            const nextLine = lines[i];
            if (MESSAGE_HEADER_RE.test(nextLine) || CHAT_HEADER_RE.test(nextLine)) {
              break;
            }
            contentLines.push(nextLine);
            i += 1;
          }

          chat.messages.push({
            timestamp,
            sender: senderName,
            content: contentLines.join('\n').trim(),
            isMe: senderName === '我',
          });
        } else {
          i += 1;
        }
      }

      chats.push(chat);
    } else {
      i += 1;
    }
  }

  return chats;
}

/**
 * 读取并解析微信聊天记录文件。
 */
export async function parseWeChatFile(file: File): Promise<WeChatParseResult> {
  try {
    const text = await file.text();
    const chats = parseWeChatTxt(text);
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
    return { chats, totalMessages, errors: [] };
  } catch (error) {
    return {
      chats: [],
      totalMessages: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
