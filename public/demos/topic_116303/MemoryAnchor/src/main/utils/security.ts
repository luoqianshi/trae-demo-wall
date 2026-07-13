// Security Utility
// Security-related utilities (IPC validation, sanitization, etc.)

import { URL } from 'url';
import path from 'path';
import crypto from 'crypto';

/**
 * 允许加载的协议
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'file:'];

/**
 * 允许打开的外部域名白名单
 */
const ALLOWED_EXTERNAL_DOMAINS = [
  'github.com',
  'memoryanchor.com',
  'localhost',
];

/**
 * 验证 URL 是否安全
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证是否为允许的外部链接
 */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // 检查协议
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }

    // 检查域名白名单
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_EXTERNAL_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * 清理用户输入，防止注入攻击
 */
export function sanitizeInput(input: string): string {
  // 移除潜在的脚本标签
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 移除事件处理器
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // 移除 javascript: 协议
  sanitized = sanitized.replace(/javascript:/gi, '');

  // 移除 data: 协议（防止 data URI 攻击）
  sanitized = sanitized.replace(/data:/gi, '');

  return sanitized.trim();
}

/**
 * 验证 ID 格式
 */
export function isValidId(id: string): boolean {
  // ID 应该是字母数字字符串，可能包含连字符和下划线
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(id) && id.length > 0 && id.length <= 255;
}

/**
 * 验证文件路径是否安全（防止路径遍历攻击）
 */
export function isSafePath(filePath: string, basePath: string): boolean {
  const resolvedPath = path.resolve(basePath, filePath);
  return resolvedPath.startsWith(basePath);
}

/**
 * 验证邮件地址格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证颜色值格式（CSS 颜色）
 */
export function isValidColor(color: string): boolean {
  // 支持 hex、rgb、rgba、hsl、hsla
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/;
  const hslRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
  const hslaRegex = /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*(0|1|0?\.\d+)\s*\)$/;

  return (
    hexRegex.test(color) ||
    rgbRegex.test(color) ||
    rgbaRegex.test(color) ||
    hslRegex.test(color) ||
    hslaRegex.test(color)
  );
}

/**
 * 转义 HTML 特殊字符
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * 解析 HTML 实体
 */
export function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return text.replace(/&(amp|lt|gt|quot|#039);/g, (entity) => map[entity]);
}

/**
 * 验证 JSON 字符串
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成安全的随机令牌
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 哈希字符串（用于安全存储）
 */
export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * 验证 IPC 请求参数
 */
export function validateIpcParams(params: unknown, schema: {
  required?: string[];
  optional?: string[];
  types?: Record<string, string>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof params !== 'object' || params === null) {
    return { valid: false, errors: ['Params must be an object'] };
  }

  // 检查必需参数
  if (schema.required) {
    for (const key of schema.required) {
      if (!(key in params)) {
        errors.push(`Missing required parameter: ${key}`);
      }
    }
  }

  // 检查参数类型
  if (schema.types) {
    for (const [key, type] of Object.entries(schema.types)) {
      if (key in params) {
        const value = (params as Record<string, unknown>)[key];
        const actualType = typeof value;

        if (actualType !== type) {
          errors.push(`Parameter ${key} must be of type ${type}, got ${actualType}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * IPC 白名单验证
 */

import { IPC_CHANNELS, IPC_EVENT_CHANNELS } from '../../shared/types/ipc';

/**
 * 允许的 IPC 调用通道白名单
 */
const ALLOWED_IPC_CHANNELS: readonly string[] = Object.values(IPC_CHANNELS);

/**
 * 允许的 IPC 事件通道白名单
 */
const ALLOWED_EVENT_CHANNELS: readonly string[] = Object.values(IPC_EVENT_CHANNELS);

/**
 * 验证 IPC 通道是否在白名单中
 */
export function isAllowedIpcChannel(channel: string): boolean {
  return ALLOWED_IPC_CHANNELS.includes(channel);
}

/**
 * 验证 IPC 事件通道是否在白名单中
 */
export function isAllowedEventChannel(channel: string): boolean {
  return ALLOWED_EVENT_CHANNELS.includes(channel);
}

/**
 * 获取允许的 IPC 通道列表
 */
export function getAllowedIpcChannels(): readonly string[] {
  return ALLOWED_IPC_CHANNELS;
}

/**
 * 获取允许的事件通道列表
 */
export function getAllowedEventChannels(): readonly string[] {
  return ALLOWED_EVENT_CHANNELS;
}

/**
 * IPC 白名单验证错误
 */
export class IpcWhitelistError extends Error {
  constructor(channel: string) {
    super(`IPC channel '${channel}' is not in the whitelist`);
    this.name = 'IpcWhitelistError';
  }
}