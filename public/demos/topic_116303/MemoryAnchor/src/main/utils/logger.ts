// Logger Utility
// Centralized logging for the main process

import { app } from 'electron';
import log from 'electron-log';
import path from 'path';
import fs from 'fs';

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// 日志配置
interface LoggerConfig {
  level: LogLevel;
  file: boolean;
  console: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logDir: string;

  constructor() {
    // 获取日志目录
    this.logDir = app.getPath('logs');

    // 确保日志目录存在
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // 配置 electron-log（v5：resolvePath 已废弃，改用 resolvePathFn）
    log.transports.file.resolvePathFn = () => path.join(this.logDir, 'main.log');
    log.transports.file.level = 'info';
    log.transports.console.level = 'debug';

    // 默认配置
    this.config = {
      level: LogLevel.INFO,
      file: true,
      console: process.env.NODE_ENV === 'development',
    };
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
    log.transports.file.level = level;
    log.transports.console.level = level;
  }

  /**
   * 启用/禁用文件日志
   */
  enableFileLogging(enabled: boolean): void {
    this.config.file = enabled;
    log.transports.file.level = enabled ? this.config.level : false;
  }

  /**
   * 启用/禁用控制台日志
   */
  enableConsoleLogging(enabled: boolean): void {
    this.config.console = enabled;
    log.transports.console.level = enabled ? this.config.level : false;
  }

  /**
   * 获取日志目录路径
   */
  getLogDir(): string {
    return this.logDir;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(module: string, message: string): string {
    return `[${module}] ${message}`;
  }

  private parseArgs(firstArg: string, ...rest: unknown[]): { msg: string; args: unknown[] } {
    if (rest.length > 0 && typeof rest[0] === 'string') {
      return { msg: this.formatMessage(firstArg, rest[0]), args: rest.slice(1) };
    }
    return { msg: firstArg, args: rest };
  }

  /**
   * 调试日志
   */
  debug(messageOrModule: string, ...args: unknown[]): void {
    if (this.config.console) {
      const { msg, args: rest } = this.parseArgs(messageOrModule, ...args);
      log.debug(msg, ...rest);
    }
  }

  /**
   * 信息日志
   */
  info(messageOrModule: string, ...args: unknown[]): void {
    const { msg, args: rest } = this.parseArgs(messageOrModule, ...args);
    log.info(msg, ...rest);
  }

  /**
   * 警告日志
   */
  warn(messageOrModule: string, ...args: unknown[]): void {
    const { msg, args: rest } = this.parseArgs(messageOrModule, ...args);
    log.warn(msg, ...rest);
  }

  /**
   * 错误日志
   */
  error(messageOrModule: string, ...args: unknown[]): void {
    const { msg, args: rest } = this.parseArgs(messageOrModule, ...args);
    const error = rest[0];
    if (error instanceof Error) {
      log.error(msg, error.message, error.stack);
    } else {
      log.error(msg, ...rest);
    }
  }

  /**
   * 清理旧日志文件
   */
  async cleanOldLogs(daysToKeep: number = 7): Promise<void> {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const msInDay = 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > daysToKeep * msInDay) {
          fs.unlinkSync(filePath);
          this.info('Logger', `Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Logger', 'Failed to clean old logs', error);
    }
  }
}

// 导出单例实例
export const logger = new Logger();

// 便捷方法
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);