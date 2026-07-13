// IPC Response Wrapper
// Utilities for wrapping IPC responses and handling errors

import { IpcResponse } from '../../shared/types/ipc';
import { logger } from './logger';
import { isAllowedIpcChannel, IpcWhitelistError, validateIpcParams } from './security';

/**
 * 成功响应包装器
 */
export function ipcSuccess<T>(data: T): IpcResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 错误响应包装器
 */
export function ipcError<T = never>(error: string | Error, code?: string): IpcResponse<T> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? 'Error' : error.name;

  return {
    success: false,
    error: errorMessage,
    code: code || errorName,
  };
}

/**
 * 异步 IPC 处理器包装器
 * 自动处理错误并返回统一格式
 */
export function wrapIpcHandler<T, A extends unknown[] = never[]>(
  channel: string,
  handler: (...args: A) => Promise<T>
): (...args: unknown[]) => Promise<IpcResponse<T>> {
  return async (...args: unknown[]): Promise<IpcResponse<T>> => {
    try {
      // 验证 IPC 通道白名单
      if (!isAllowedIpcChannel(channel)) {
        throw new IpcWhitelistError(channel);
      }

      // 执行处理器
      const result = await handler(...(args as A));

      logger.debug('IPC', `Handler executed successfully: ${channel}`);
      return ipcSuccess(result);
    } catch (error) {
      logger.error('IPC', `Handler error in ${channel}:`, error);

      if (error instanceof IpcWhitelistError) {
        return ipcError<T>(error, 'WHITELIST_ERROR');
      }

      return ipcError<T>(error as Error);
    }
  };
}

/**
 * 同步 IPC 处理器包装器
 * 自动处理错误并返回统一格式
 */
export function wrapSyncIpcHandler<T, A extends unknown[] = never[]>(
  channel: string,
  handler: (...args: A) => T
): (...args: unknown[]) => Promise<IpcResponse<T>> {
  return async (...args: unknown[]): Promise<IpcResponse<T>> => {
    try {
      // 验证 IPC 通道白名单
      if (!isAllowedIpcChannel(channel)) {
        throw new IpcWhitelistError(channel);
      }

      // 执行处理器
      const result = handler(...(args as A));

      logger.debug('IPC', `Handler executed successfully: ${channel}`);
      return ipcSuccess(result);
    } catch (error) {
      logger.error('IPC', `Handler error in ${channel}:`, error);

      if (error instanceof IpcWhitelistError) {
        return ipcError<T>(error, 'WHITELIST_ERROR');
      }

      return ipcError<T>(error as Error);
    }
  };
}

/**
 * 参数验证错误
 */
export class ValidationError extends Error {
  constructor(errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * 验证参数并抛出错误
 */
export function validateOrThrow(params: unknown, schema: {
  required?: string[];
  optional?: string[];
  types?: Record<string, string>;
}): void {
  const result = validateIpcParams(params, schema);

  if (!result.valid) {
    throw new ValidationError(result.errors);
  }
}