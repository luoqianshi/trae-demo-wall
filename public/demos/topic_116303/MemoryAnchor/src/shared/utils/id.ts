// ID Utility
// UUID generation and ID-related utilities

import { randomUUID } from 'crypto';

/**
 * 生成 UUID
 * 使用 Node.js crypto 模块的 randomUUID 函数
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * 生成短 ID（用于某些场景）
 * 格式：时间戳 + 随机数
 */
export function generateShortId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * 验证是否为有效的 UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}