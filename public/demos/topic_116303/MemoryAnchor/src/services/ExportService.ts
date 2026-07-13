// Export Service
// Business logic for data export operations

import fs from 'fs';
import { collectionService } from './CollectionService';
import { logger } from '../main/utils/logger';

export interface ExportOptions {
  singleFile?: boolean;
  includeContent?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath: string;
  itemCount: number;
  size: number;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  itemCount: number;
  errors: string[];
}

export class ExportService {
  private static instance: ExportService | null = null;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportJson(collectionIds: string[], filePath: string, options?: ExportOptions): Promise<ExportResult> {
    try {
      const collections = collectionIds
        .map(id => collectionService.getCollection(id))
        .filter((c): c is NonNullable<typeof c> => c !== null);

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        collections: collections.map(c => ({
          id: c.id,
          url: c.url,
          title: c.title,
          description: c.description,
          content: options?.includeContent !== false ? c.content : undefined,
          tags: c.tags,
          notes: c.notes,
          isFavorite: c.isFavorite,
          isRead: c.isRead,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      };

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      const stats = fs.statSync(filePath);

      logger.info('ExportService', `Exported ${collections.length} collections to ${filePath}`);
      return {
        success: true,
        filePath,
        itemCount: collections.length,
        size: stats.size,
      };
    } catch (error) {
      logger.error('ExportService', 'Export failed:', error);
      return {
        success: false,
        filePath,
        itemCount: 0,
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  async exportMarkdown(collectionIds: string[], filePath: string, options?: ExportOptions): Promise<ExportResult> {
    try {
      const collections = collectionIds
        .map(id => collectionService.getCollection(id))
        .filter((c): c is NonNullable<typeof c> => c !== null);

      let markdown = '# Memory Anchor Collections\n\n';
      markdown += `Exported at: ${new Date().toISOString()}\n\n`;

      for (const collection of collections) {
        markdown += `## ${collection.title}\n\n`;
        markdown += `- URL: ${collection.url}\n`;
        if (collection.description) markdown += `- Description: ${collection.description}\n`;
        if (collection.tags.length > 0) markdown += `- Tags: ${collection.tags.join(', ')}\n`;
        markdown += `- Created: ${collection.createdAt}\n\n`;
        if (options?.includeContent !== false && collection.content) {
          markdown += `${collection.content}\n\n`;
        }
        markdown += '---\n\n';
      }

      fs.writeFileSync(filePath, markdown, 'utf-8');
      const stats = fs.statSync(filePath);

      logger.info('ExportService', `Exported ${collections.length} collections to Markdown at ${filePath}`);
      return {
        success: true,
        filePath,
        itemCount: collections.length,
        size: stats.size,
      };
    } catch (error) {
      logger.error('ExportService', 'Markdown export failed:', error);
      return {
        success: false,
        filePath,
        itemCount: 0,
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  async exportHtml(collectionIds: string[], filePath: string, options?: ExportOptions): Promise<ExportResult> {
    try {
      const collections = collectionIds
        .map(id => collectionService.getCollection(id))
        .filter((c): c is NonNullable<typeof c> => c !== null);

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Memory Anchor Collections</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .collection { border-bottom: 1px solid #eee; padding: 20px 0; }
    h1 { color: #333; }
    h2 { color: #444; }
    .meta { color: #666; font-size: 0.9em; }
    .tags { margin-top: 10px; }
    .tag { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 5px; font-size: 0.8em; }
  </style>
</head>
<body>
  <h1>Memory Anchor Collections</h1>
  <p>Exported at: ${new Date().toISOString()}</p>
`;

      for (const collection of collections) {
        html += `<div class="collection">
  <h2><a href="${collection.url}">${collection.title}</a></h2>
  <div class="meta">
    <p>URL: ${collection.url}</p>
    ${collection.description ? `<p>${collection.description}</p>` : ''}
    <p>Created: ${collection.createdAt}</p>
  </div>
  ${collection.tags.length > 0 ? `<div class="tags">${collection.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
  ${options?.includeContent !== false && collection.content ? `<div class="content">${collection.content}</div>` : ''}
</div>`;
      }

      html += `</body>
</html>`;

      fs.writeFileSync(filePath, html, 'utf-8');
      const stats = fs.statSync(filePath);

      logger.info('ExportService', `Exported ${collections.length} collections to HTML at ${filePath}`);
      return {
        success: true,
        filePath,
        itemCount: collections.length,
        size: stats.size,
      };
    } catch (error) {
      logger.error('ExportService', 'HTML export failed:', error);
      return {
        success: false,
        filePath,
        itemCount: 0,
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  async importJson(filePath: string): Promise<ImportResult> {
    const errors: string[] = [];
    let importedCount = 0;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw) as {
        collections?: Array<{
          url?: string;
          title?: string;
          description?: string;
          tags?: string[];
          notes?: string;
        }>;
      };

      if (!data.collections || !Array.isArray(data.collections)) {
        throw new Error('Invalid JSON format: missing collections array');
      }

      for (const item of data.collections) {
        try {
          if (!item.url) {
            errors.push(`Skipping item without URL: ${item.title || 'unknown'}`);
            continue;
          }
          const existing = collectionService.getCollectionByUrl(item.url);
          if (existing) {
            errors.push(`Skipping existing URL: ${item.url}`);
            continue;
          }
          await collectionService.createCollection({
            url: item.url,
            title: item.title,
            description: item.description,
            tags: item.tags,
            notes: item.notes,
            autoScrape: false,
          });
          importedCount++;
        } catch (err) {
          errors.push(`Failed to import ${item.url}: ${err instanceof Error ? err.message : 'unknown error'}`);
        }
      }

      logger.info('ExportService', `Imported ${importedCount} collections from ${filePath}`);
      return {
        success: true,
        itemCount: importedCount,
        errors,
      };
    } catch (error) {
      logger.error('ExportService', 'Import failed:', error);
      return {
        success: false,
        itemCount: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
      };
    }
  }
}

export const exportService = ExportService.getInstance();
