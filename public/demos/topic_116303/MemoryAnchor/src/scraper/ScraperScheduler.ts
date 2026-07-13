import {
  ScrapeTask,
  ScrapeOptions,
  ScrapeResult,
  ScrapeStatus,
  ScrapePriority,
  QueueConfig,
  QueueStats,
  ScrapeProgressCallback,
  ScrapeCompleteCallback,
  ScrapeErrorCallback,
} from './types';
import { ScraperEngineService } from './ScraperEngineService';
import { ScrapeStateMachine } from './ScrapeStateMachine';
import { generateId } from '../shared/utils/id';

const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  concurrency: 3,
  defaultTimeout: 30,
  defaultMaxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
};

export class ScraperScheduler {
  private queue: ScrapeTask[] = [];
  private processingTasks: Map<string, ScrapeTask> = new Map();
  private completedTasks: Map<string, ScrapeTask> = new Map();
  private config: QueueConfig;
  private engineService: ScraperEngineService;
  private stateMachine: ScrapeStateMachine;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  private progressCallbacks: Set<ScrapeProgressCallback> = new Set();
  private completeCallbacks: Set<ScrapeCompleteCallback> = new Set();
  private errorCallbacks: Set<ScrapeErrorCallback> = new Set();

  constructor(
    engineService: ScraperEngineService,
    stateMachine: ScrapeStateMachine,
    config: Partial<QueueConfig> = {}
  ) {
    this.engineService = engineService;
    this.stateMachine = stateMachine;
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  setConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): QueueConfig {
    return { ...this.config };
  }

  addTask(options: ScrapeOptions): ScrapeTask {
    const task: ScrapeTask = {
      id: generateId(),
      url: options.url,
      status: ScrapeStatus.PENDING,
      priority: options.priority ?? ScrapePriority.NORMAL,
      engine: options.engine,
      options,
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.defaultMaxRetries,
      createdAt: new Date().toISOString(),
    };

    this.insertTaskByPriority(task);
    void this.processQueue();

    return task;
  }

  addBatch(urls: string[], options: Partial<ScrapeOptions> = {}): ScrapeTask[] {
    const tasks: ScrapeTask[] = [];

    for (const url of urls) {
      const task: ScrapeTask = {
        id: generateId(),
        url,
        status: ScrapeStatus.PENDING,
        priority: options.priority ?? ScrapePriority.NORMAL,
        engine: options.engine,
        options: { ...options, url },
        retryCount: 0,
        maxRetries: options.maxRetries ?? this.config.defaultMaxRetries,
        createdAt: new Date().toISOString(),
      };
      tasks.push(task);
      this.insertTaskByPriority(task);
    }

    void this.processQueue();

    return tasks;
  }

  private insertTaskByPriority(task: ScrapeTask): void {
    const index = this.queue.findIndex(
      (t) => t.priority < task.priority
    );

    if (index === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(index, 0, task);
    }
  }

  cancelTask(taskId: string): boolean {
    const queuedIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queuedIndex !== -1) {
      const task = this.queue[queuedIndex];
      this.queue.splice(queuedIndex, 1);
      try {
        const cancelledTask = this.stateMachine.cancel(task);
        this.completedTasks.set(taskId, cancelledTask);
        return true;
      } catch {
        return false;
      }
    }

    const processingTask = this.processingTasks.get(taskId);
    if (processingTask) {
      try {
        const cancelledTask = this.stateMachine.cancel(processingTask);
        this.processingTasks.delete(taskId);
        this.completedTasks.set(taskId, cancelledTask);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  retryTask(taskId: string): boolean {
    const task = this.completedTasks.get(taskId);
    if (!task) return false;

    if (task.status !== ScrapeStatus.FAILED) return false;

    if (task.retryCount >= task.maxRetries) return false;

    try {
      const retriedTask = this.stateMachine.retry(task);
      this.completedTasks.delete(taskId);
      this.insertTaskByPriority(retriedTask);
      void this.processQueue();
      return true;
    } catch {
      return false;
    }
  }

  getTask(taskId: string): ScrapeTask | undefined {
    const queued = this.queue.find((t) => t.id === taskId);
    if (queued) return queued;

    const processing = this.processingTasks.get(taskId);
    if (processing) return processing;

    return this.completedTasks.get(taskId);
  }

  getStats(): QueueStats {
    const pending = this.queue.length;
    const processing = this.processingTasks.size;
    const completed = Array.from(this.completedTasks.values()).filter(
      (t) => t.status === ScrapeStatus.COMPLETED
    ).length;
    const failed = Array.from(this.completedTasks.values()).filter(
      (t) => t.status === ScrapeStatus.FAILED || t.status === ScrapeStatus.CANCELLED
    ).length;

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
    };
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    void this.processQueue();
  }

  clearCompleted(): void {
    this.completedTasks.clear();
  }

  clearAll(): void {
    this.queue = [];
    this.completedTasks.clear();
  }

  onProgress(callback: ScrapeProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  onComplete(callback: ScrapeCompleteCallback): () => void {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  onError(callback: ScrapeErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused) return;

    this.isProcessing = true;

    try {
      while (
        this.queue.length > 0 &&
        this.processingTasks.size < this.config.concurrency
      ) {
        const task = this.queue.shift();
        if (task) {
          void this.executeTask(task);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: ScrapeTask): Promise<void> {
    try {
      const scrapingTask = this.stateMachine.startScraping(task);
      this.processingTasks.set(task.id, scrapingTask);

      this.notifyProgress(scrapingTask, 0);

      const result = await this.engineService.scrape(task.options);

      const currentTask = this.processingTasks.get(task.id) || scrapingTask;

      if (result.status === ScrapeStatus.COMPLETED) {
        const scrapedTask = this.stateMachine.completeScraping(currentTask);
        const processedTask = this.stateMachine.startProcessing(scrapedTask);
        this.processingTasks.set(task.id, processedTask);

        this.notifyProgress(processedTask, 80);

        const completedTask = this.stateMachine.complete(processedTask);
        completedTask.result = result;

        this.processingTasks.delete(task.id);
        this.completedTasks.set(task.id, completedTask);

        this.notifyProgress(completedTask, 100);
        this.notifyComplete(completedTask, result);
      } else {
        const errorMessage = result.error || 'Scrape failed';
        const failedTask = this.stateMachine.fail(currentTask, errorMessage);
        failedTask.result = result;

        this.processingTasks.delete(task.id);

        if (this.shouldRetry(failedTask)) {
          this.scheduleRetry(failedTask);
        } else {
          this.completedTasks.set(task.id, failedTask);
          this.notifyError(failedTask, new Error(errorMessage));
        }
      }
    } catch (error) {
      const currentTask = this.processingTasks.get(task.id) || task;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      try {
        const failedTask = this.stateMachine.fail(currentTask, errorMessage);
        this.processingTasks.delete(task.id);

        if (this.shouldRetry(failedTask)) {
          this.scheduleRetry(failedTask);
        } else {
          this.completedTasks.set(task.id, failedTask);
          this.notifyError(failedTask, error instanceof Error ? error : new Error(errorMessage));
        }
      } catch (transitionError) {
        this.processingTasks.delete(task.id);
        console.error('Error transitioning task to failed state:', transitionError);
      }
    } finally {
      void this.processQueue();
    }
  }

  private shouldRetry(task: ScrapeTask): boolean {
    return task.retryCount < task.maxRetries;
  }

  private scheduleRetry(task: ScrapeTask): void {
    const delay = this.calculateRetryDelay(task.retryCount);

    setTimeout(() => {
      try {
        const retriedTask = this.stateMachine.retry(task);
        this.insertTaskByPriority(retriedTask);
        void this.processQueue();
      } catch (error) {
        console.error('Error scheduling retry:', error);
        this.completedTasks.set(task.id, task);
      }
    }, delay);
  }

  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    return Math.min(exponentialDelay, this.config.maxRetryDelayMs);
  }

  private notifyProgress(task: ScrapeTask, progress: number): void {
    for (const callback of this.progressCallbacks) {
      try {
        callback(task, progress);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    }
  }

  private notifyComplete(task: ScrapeTask, result: ScrapeResult): void {
    for (const callback of this.completeCallbacks) {
      try {
        callback(task, result);
      } catch (error) {
        console.error('Complete callback error:', error);
      }
    }
  }

  private notifyError(task: ScrapeTask, error: Error): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(task, error);
      } catch (callbackError) {
        console.error('Error callback error:', callbackError);
      }
    }
  }
}
