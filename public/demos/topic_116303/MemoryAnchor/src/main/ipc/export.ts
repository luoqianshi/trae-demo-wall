// Export IPC Handler
// Handles export-related IPC communication

import { ipcMain, dialog } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type { ExportResultData, ImportResultData } from '../../shared/types/ipc';
import { exportService, type ExportOptions } from '../../services/ExportService';

/**
 * 注册 Export IPC 处理器
 */
export function registerExportHandlers(): void {
  // 导出为 JSON
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_JSON,
    wrapIpcHandler<ExportResultData>(
      IPC_CHANNELS.EXPORT_JSON,
      async (_event: unknown, collectionIds: string[], options?: ExportOptions) => {
        logger.debug('IPC', 'Exporting to JSON', { collectionIds, options });
        validateOrThrow({ collectionIds }, {
          required: ['collectionIds'],
          types: { collectionIds: 'object' },
        });

        const result = await dialog.showSaveDialog({
          title: 'Export Collections as JSON',
          defaultPath: 'collections.json',
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });

        if (result.canceled || !result.filePath) {
          throw new Error('Export canceled by user');
        }

        const exportResult = await exportService.exportJson(collectionIds, result.filePath, options);

        if (!exportResult.success) {
          throw new Error(exportResult.error || 'Export failed');
        }

        return {
          success: true,
          filePath: exportResult.filePath,
          itemCount: exportResult.itemCount,
          size: exportResult.size,
        };
      }
    )
  );

  // 导出为 Markdown
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_MARKDOWN,
    wrapIpcHandler<ExportResultData>(
      IPC_CHANNELS.EXPORT_MARKDOWN,
      async (_event: unknown, collectionIds: string[], options?: ExportOptions) => {
        logger.debug('IPC', 'Exporting to Markdown', { collectionIds, options });
        validateOrThrow({ collectionIds }, {
          required: ['collectionIds'],
          types: { collectionIds: 'object' },
        });

        const result = await dialog.showSaveDialog({
          title: 'Export Collections as Markdown',
          defaultPath: options?.singleFile ? 'collections.md' : 'collections',
          filters: [{ name: 'Markdown', extensions: ['md'] }],
        });

        if (result.canceled || !result.filePath) {
          throw new Error('Export canceled by user');
        }

        const exportResult = await exportService.exportMarkdown(collectionIds, result.filePath, options);

        if (!exportResult.success) {
          throw new Error(exportResult.error || 'Export failed');
        }

        return {
          success: true,
          filePath: exportResult.filePath,
          itemCount: exportResult.itemCount,
          size: exportResult.size,
        };
      }
    )
  );

  // 导出为 HTML
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_HTML,
    wrapIpcHandler<ExportResultData>(
      IPC_CHANNELS.EXPORT_HTML,
      async (_event: unknown, collectionIds: string[], options?: ExportOptions) => {
        logger.debug('IPC', 'Exporting to HTML', { collectionIds, options });
        validateOrThrow({ collectionIds }, {
          required: ['collectionIds'],
          types: { collectionIds: 'object' },
        });

        const result = await dialog.showSaveDialog({
          title: 'Export Collections as HTML',
          defaultPath: 'collections.html',
          filters: [{ name: 'HTML', extensions: ['html'] }],
        });

        if (result.canceled || !result.filePath) {
          throw new Error('Export canceled by user');
        }

        const exportResult = await exportService.exportHtml(collectionIds, result.filePath, options);

        if (!exportResult.success) {
          throw new Error(exportResult.error || 'Export failed');
        }

        return {
          success: true,
          filePath: exportResult.filePath,
          itemCount: exportResult.itemCount,
          size: exportResult.size,
        };
      }
    )
  );

  logger.debug('IPC', 'Export handlers registered');
}

/**
 * 注册 Import IPC 处理器
 */
export function registerImportHandlers(): void {
  // 导入 JSON
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_JSON,
    wrapIpcHandler<ImportResultData>(
      IPC_CHANNELS.IMPORT_JSON,
      async (_event: unknown, filePath?: string) => {
        logger.debug('IPC', 'Importing from JSON', { filePath });

        // If no path was supplied, prompt the user to pick a file.
        let importFilePath = filePath;
        if (!importFilePath) {
          const result = await dialog.showOpenDialog({
            title: 'Import Collections from JSON',
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile'],
          });
          if (result.canceled || result.filePaths.length === 0) {
            throw new Error('Import canceled by user');
          }
          importFilePath = result.filePaths[0];
        }

        const importResult = await exportService.importJson(importFilePath);

        return {
          success: importResult.success,
          itemCount: importResult.itemCount,
          errors: importResult.errors,
        };
      }
    )
  );

  logger.debug('IPC', 'Import handlers registered');
}
