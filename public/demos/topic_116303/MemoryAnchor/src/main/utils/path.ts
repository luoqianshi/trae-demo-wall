// Path Utility
// Path-related utilities for the main process

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

class PathManager {
  private userDataPath: string;
  private appPath: string;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.appPath = app.getAppPath();
  }

  /**
   * 获取用户数据目录
   */
  getUserDataPath(): string {
    return this.userDataPath;
  }

  /**
   * 获取应用目录
   */
  getAppPath(): string {
    return this.appPath;
  }

  /**
   * 获取数据库文件路径
   */
  getDatabasePath(): string {
    const dbDir = path.join(this.userDataPath, 'data');
    this.ensureDir(dbDir);
    return path.join(dbDir, 'memory-anchor.db');
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    const configDir = path.join(this.userDataPath, 'config');
    this.ensureDir(configDir);
    return path.join(configDir, 'config.json');
  }

  /**
   * 获取缓存目录
   */
  getCachePath(): string {
    const cachePath = path.join(this.userDataPath, 'cache');
    this.ensureDir(cachePath);
    return cachePath;
  }

  /**
   * 获取日志目录
   */
  getLogPath(): string {
    return app.getPath('logs');
  }

  /**
   * 获取临时文件目录
   */
  getTempPath(): string {
    const tempPath = path.join(this.userDataPath, 'temp');
    this.ensureDir(tempPath);
    return tempPath;
  }

  /**
   * 获取备份目录
   */
  getBackupPath(): string {
    const backupPath = path.join(this.userDataPath, 'backups');
    this.ensureDir(backupPath);
    return backupPath;
  }

  /**
   * 获取导出目录
   */
  getExportPath(): string {
    const exportPath = path.join(this.userDataPath, 'exports');
    this.ensureDir(exportPath);
    return exportPath;
  }

  /**
   * 获取插件目录
   */
  getPluginsPath(): string {
    const pluginsPath = path.join(this.userDataPath, 'plugins');
    this.ensureDir(pluginsPath);
    return pluginsPath;
  }

  /**
   * 获取资源文件路径（用于打包后的资源）
   */
  getResourcePath(resourceName: string): string {
    if (process.env.NODE_ENV === 'development') {
      return path.join(this.appPath, 'resources', resourceName);
    }
    return path.join(process.resourcesPath, resourceName);
  }

  /**
   * 确保目录存在
   */
  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 获取相对路径
   */
  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * 获取绝对路径
   */
  absolute(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.resolve(this.userDataPath, relativePath);
  }

  /**
   * 连接路径片段
   */
  join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * 获取文件名（包含扩展名）
   */
  basename(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * 获取文件扩展名
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * 获取目录名
   */
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 检查路径是否存在
   */
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * 获取窗口状态文件路径
   */
  getWindowStatePath(): string {
    const configDir = path.join(this.userDataPath, 'config');
    this.ensureDir(configDir);
    return path.join(configDir, 'window-state.json');
  }
}

// 导出单例实例
export const pathManager = new PathManager();