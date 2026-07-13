import { ipcMain } from 'electron';
import { wrapIpcHandler, validateOrThrow } from '../utils/ipc';
import { logger } from '../utils/logger';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type {
  ScraperTaskData,
} from '../../shared/types/ipc';
import { scraperService } from '../../services/ScraperService';
import { ScrapeStatus, type ScrapeOptions, type ScrapeTask } from '../../scraper/types';

function getTaskProgress(task: ScrapeTask): number {
  if (task.status === ScrapeStatus.COMPLETED) return 100;
  if (task.status === ScrapeStatus.FAILED || task.status === ScrapeStatus.CANCELLED) return 0;
  if (task.status === ScrapeStatus.SCRAPING || task.status === ScrapeStatus.PROCESSING) return 50;
  return 0;
}

function getTaskStatusString(task: ScrapeTask): 'pending' | 'running' | 'completed' | 'failed' {
  if (task.status === ScrapeStatus.COMPLETED) return 'completed';
  if (task.status === ScrapeStatus.FAILED || task.status === ScrapeStatus.CANCELLED) return 'failed';
  if (task.status === ScrapeStatus.PENDING) return 'pending';
  return 'running';
}

export function registerScraperHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.SCRAPER_SCRAPE,
    wrapIpcHandler<ScraperTaskData>(
      IPC_CHANNELS.SCRAPER_SCRAPE,
      async (_event: unknown, url: string, options?: Partial<ScrapeOptions>) => {
        logger.debug('IPC', 'Scraping URL', { url, options });
        validateOrThrow({ url }, {
          required: ['url'],
          types: { url: 'string' },
        });

        const task = await scraperService.scrape(url, options);

        return {
          taskId: task.id,
          status: getTaskStatusString(task),
          progress: getTaskProgress(task),
          url: task.url,
          error: task.error,
        };
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.SCRAPER_SCRAPE_BATCH,
    wrapIpcHandler<ScraperTaskData[]>(
      IPC_CHANNELS.SCRAPER_SCRAPE_BATCH,
      async (_event: unknown, urls: string[], options?: Partial<ScrapeOptions>) => {
        logger.debug('IPC', 'Scraping batch URLs', { urls });
        validateOrThrow({ urls }, {
          required: ['urls'],
          types: { urls: 'object' },
        });

        const tasks = await scraperService.scrapeBatch(urls, options);

        return tasks.map(task => ({
          taskId: task.id,
          status: getTaskStatusString(task),
          progress: getTaskProgress(task),
          url: task.url,
          error: task.error,
        }));
      }
    )
  );

  ipcMain.handle(
    IPC_CHANNELS.SCRAPER_GET_STATUS,
    wrapIpcHandler<ScraperTaskData>(
      IPC_CHANNELS.SCRAPER_GET_STATUS,
      async (_event: unknown, taskId: string) => {
        logger.debug('IPC', 'Getting scraper task status', { taskId });
        validateOrThrow({ taskId }, {
          required: ['taskId'],
          types: { taskId: 'string' },
        });

        const task = scraperService.getTaskStatus(taskId);
        if (!task) {
          throw new Error(`Task not found: ${taskId}`);
        }

        return {
          taskId: task.id,
          status: getTaskStatusString(task),
          progress: getTaskProgress(task),
          url: task.url,
          error: task.error,
        };
      }
    )
  );

  logger.debug('IPC', 'Scraper handlers registered');
}
