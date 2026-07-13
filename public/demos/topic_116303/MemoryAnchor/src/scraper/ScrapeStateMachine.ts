import { ScrapeStatus, ScrapeTask } from './types';

type StateTransitionMap = Partial<Record<ScrapeStatus, ScrapeStatus[]>>;

const VALID_TRANSITIONS: StateTransitionMap = {
  [ScrapeStatus.PENDING]: [
    ScrapeStatus.SCRAPING,
    ScrapeStatus.CANCELLED,
  ],
  [ScrapeStatus.SCRAPING]: [
    ScrapeStatus.SCRAPED,
    ScrapeStatus.FAILED,
    ScrapeStatus.CANCELLED,
  ],
  [ScrapeStatus.SCRAPED]: [
    ScrapeStatus.PROCESSING,
    ScrapeStatus.FAILED,
    ScrapeStatus.CANCELLED,
  ],
  [ScrapeStatus.PROCESSING]: [
    ScrapeStatus.COMPLETED,
    ScrapeStatus.FAILED,
    ScrapeStatus.CANCELLED,
  ],
  [ScrapeStatus.FAILED]: [
    ScrapeStatus.PENDING,
    ScrapeStatus.CANCELLED,
  ],
  [ScrapeStatus.COMPLETED]: [],
  [ScrapeStatus.CANCELLED]: [],
};

export type StateChangeListener = (
  task: ScrapeTask,
  oldStatus: ScrapeStatus,
  newStatus: ScrapeStatus
) => void | Promise<void>;

export class ScrapeStateMachine {
  private listeners: Set<StateChangeListener> = new Set();

  canTransition(from: ScrapeStatus, to: ScrapeStatus): boolean {
    const validTransitions = VALID_TRANSITIONS[from];
    if (!validTransitions) return false;
    return validTransitions.includes(to);
  }

  transition(task: ScrapeTask, newStatus: ScrapeStatus): ScrapeTask {
    const oldStatus = task.status;

    if (!this.canTransition(oldStatus, newStatus)) {
      throw new Error(
        `Invalid state transition: ${oldStatus} -> ${newStatus} for task ${task.id}`
      );
    }

    const updatedTask: ScrapeTask = {
      ...task,
      status: newStatus,
    };

    if (newStatus === ScrapeStatus.SCRAPING && !updatedTask.startedAt) {
      updatedTask.startedAt = new Date().toISOString();
    }

    if (
      (newStatus === ScrapeStatus.COMPLETED ||
        newStatus === ScrapeStatus.FAILED ||
        newStatus === ScrapeStatus.CANCELLED) &&
      !updatedTask.completedAt
    ) {
      updatedTask.completedAt = new Date().toISOString();
    }

    this.notifyListeners(updatedTask, oldStatus, newStatus);

    return updatedTask;
  }

  addListener(listener: StateChangeListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: StateChangeListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(
    task: ScrapeTask,
    oldStatus: ScrapeStatus,
    newStatus: ScrapeStatus
  ): void {
    for (const listener of this.listeners) {
      try {
        const result = listener(task, oldStatus, newStatus);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error('State change listener error:', error);
          });
        }
      } catch (error) {
        console.error('State change listener error:', error);
      }
    }
  }

  isFinalState(status: ScrapeStatus): boolean {
    return (
      status === ScrapeStatus.COMPLETED ||
      status === ScrapeStatus.FAILED ||
      status === ScrapeStatus.CANCELLED
    );
  }

  isActiveState(status: ScrapeStatus): boolean {
    return (
      status === ScrapeStatus.PENDING ||
      status === ScrapeStatus.SCRAPING ||
      status === ScrapeStatus.SCRAPED ||
      status === ScrapeStatus.PROCESSING
    );
  }

  getValidTransitions(status: ScrapeStatus): ScrapeStatus[] {
    return VALID_TRANSITIONS[status] || [];
  }

  startScraping(task: ScrapeTask): ScrapeTask {
    return this.transition(task, ScrapeStatus.SCRAPING);
  }

  completeScraping(task: ScrapeTask): ScrapeTask {
    return this.transition(task, ScrapeStatus.SCRAPED);
  }

  startProcessing(task: ScrapeTask): ScrapeTask {
    return this.transition(task, ScrapeStatus.PROCESSING);
  }

  complete(task: ScrapeTask): ScrapeTask {
    return this.transition(task, ScrapeStatus.COMPLETED);
  }

  fail(task: ScrapeTask, error?: string): ScrapeTask {
    const failedTask = this.transition(task, ScrapeStatus.FAILED);
    if (error) {
      failedTask.error = error;
    }
    return failedTask;
  }

  cancel(task: ScrapeTask): ScrapeTask {
    return this.transition(task, ScrapeStatus.CANCELLED);
  }

  retry(task: ScrapeTask): ScrapeTask {
    if (task.retryCount >= task.maxRetries) {
      throw new Error(`Task ${task.id} has reached max retries`);
    }

    const retriedTask = this.transition(task, ScrapeStatus.PENDING);
    retriedTask.retryCount += 1;
    retriedTask.startedAt = undefined;
    retriedTask.completedAt = undefined;
    retriedTask.error = undefined;
    retriedTask.result = undefined;

    return retriedTask;
  }
}

export const scrapeStateMachine = new ScrapeStateMachine();
