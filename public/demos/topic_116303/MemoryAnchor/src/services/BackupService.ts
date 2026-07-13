// Backup Service
// Business logic for backup operations

import fs from 'fs';
import path from 'path';
import { database } from '../database/sqlite';
import { pathManager } from '../main/utils/path';
import { logger } from '../main/utils/logger';

export interface BackupInfo {
  id: string;
  path: string;
  size: number;
  createdAt: string;
  itemCount: number;
}

export class BackupService {
  private static instance: BackupService | null = null;

  private constructor() {}

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  async createBackup(destinationPath: string): Promise<BackupInfo> {
    try {
      await database.backup(destinationPath);

      const stats = fs.statSync(destinationPath);
      const backupId = path.basename(destinationPath, path.extname(destinationPath));

      logger.info('BackupService', `Backup created at ${destinationPath}, size: ${stats.size} bytes`);

      return {
        id: backupId,
        path: destinationPath,
        size: stats.size,
        createdAt: new Date().toISOString(),
        itemCount: 0,
      };
    } catch (error) {
      logger.error('BackupService', 'Failed to create backup:', error);
      throw error;
    }
  }

  async restoreBackup(sourcePath: string): Promise<void> {
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Backup file not found: ${sourcePath}`);
      }

      database.close();

      const dbPath = pathManager.getDatabasePath();
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      fs.copyFileSync(sourcePath, dbPath);

      logger.info('BackupService', `Backup restored from ${sourcePath} to ${dbPath}`);

      database.open();
      await database.migrate();
    } catch (error) {
      logger.error('BackupService', 'Failed to restore backup:', error);
      if (!database.db) {
        database.open();
      }
      throw error;
    }
  }

  listBackups(): BackupInfo[] {
    try {
      const backupDir = pathManager.getBackupPath();
      if (!fs.existsSync(backupDir)) {
        return [];
      }

      const files = fs.readdirSync(backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (path.extname(file) === '.db' || path.extname(file) === '.backup' || path.extname(file) === '.zip') {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            backups.push({
              id: path.basename(file, path.extname(file)),
              path: filePath,
              size: stats.size,
              createdAt: stats.mtime.toISOString(),
              itemCount: 0,
            });
          }
        }
      }

      return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      logger.error('BackupService', 'Failed to list backups:', error);
      return [];
    }
  }
}

export const backupService = BackupService.getInstance();
