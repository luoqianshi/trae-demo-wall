class OrderQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxQueueSize = 1000;
    this.maxConcurrent = 10;
    this.currentProcessing = 0;
    this.running = true;
    
    this.stats = {
      totalReceived: 0,
      totalProcessed: 0,
      totalFailed: 0,
      queuePeak: 0,
      avgProcessingTime: 0,
      processingTimes: []
    };
    
    this.startProcessing();
  }

  enqueue(task) {
    if (!this.running) {
      return { success: false, message: '队列已停止' };
    }

    if (this.queue.length >= this.maxQueueSize) {
      return { success: false, message: '队列已满，请稍后重试' };
    }

    this.stats.totalReceived++;
    
    const taskWithTimestamp = {
      ...task,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      enqueueTime: Date.now(),
      status: 'pending'
    };
    
    this.queue.push(taskWithTimestamp);
    
    if (this.queue.length > this.stats.queuePeak) {
      this.stats.queuePeak = this.queue.length;
    }

    return { success: true, taskId: taskWithTimestamp.id, queueSize: this.queue.length };
  }

  async processNext() {
    if (this.processing || this.queue.length === 0 || this.currentProcessing >= this.maxConcurrent) {
      return;
    }

    this.processing = true;
    
    while (this.running && this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) continue;

      this.currentProcessing++;
      task.status = 'processing';
      
      const startTime = Date.now();
      
      try {
        await task.handler();
        task.status = 'completed';
        this.stats.totalProcessed++;
      } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        this.stats.totalFailed++;
      }
      
      const processingTime = Date.now() - startTime;
      this.stats.processingTimes.push(processingTime);
      if (this.stats.processingTimes.length > 100) {
        this.stats.processingTimes.shift();
      }
      this.stats.avgProcessingTime = Math.round(
        this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length
      );
      
      this.currentProcessing--;
    }
    
    this.processing = false;
  }

  startProcessing() {
    const processLoop = async () => {
      while (this.running) {
        await this.processNext();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    };
    processLoop().catch(console.error);
  }

  stop() {
    this.running = false;
  }

  getStats() {
    return {
      ...this.stats,
      currentQueueSize: this.queue.length,
      currentProcessing: this.currentProcessing,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize
    };
  }
}

class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 100;
    this.windowMs = options.windowMs || 60000;
    this.store = new Map();
    this.blockedIPs = new Set();
    this.blockDuration = options.blockDuration || 300000;
  }

  check(ip) {
    if (this.blockedIPs.has(ip)) {
      return { allowed: false, blocked: true, message: 'IP已被临时封禁' };
    }

    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry) {
      this.store.set(ip, {
        count: 1,
        startTime: now
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (now - entry.startTime > this.windowMs) {
      this.store.set(ip, {
        count: 1,
        startTime: now
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (entry.count >= this.maxRequests) {
      this.blockedIPs.add(ip);
      setTimeout(() => {
        this.blockedIPs.delete(ip);
      }, this.blockDuration);
      return { allowed: false, blocked: true, message: '请求过于频繁，IP已被临时封禁' };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count };
  }

  getStats() {
    return {
      totalIPs: this.store.size,
      blockedIPs: this.blockedIPs.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs
    };
  }
}

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 50;
    this.successThreshold = options.successThreshold || 10;
    this.timeoutMs = options.timeoutMs || 30000;
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.totalRequests = 0;
    this.totalFailures = 0;
  }

  execute(fn) {
    return new Promise((resolve, reject) => {
      this.totalRequests++;

      if (this.state === 'open') {
        if (Date.now() - this.lastFailureTime > this.timeoutMs) {
          this.state = 'half_open';
          this.failureCount = 0;
        } else {
          this.totalFailures++;
          return reject(new Error('服务暂时不可用，请稍后重试'));
        }
      }

      fn().then(result => {
        this.onSuccess();
        resolve(result);
      }).catch(error => {
        this.onFailure();
        reject(error);
      });
    });
  }

  onSuccess() {
    if (this.state === 'half_open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.failureCount = 0;
    }
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      failureRate: this.totalRequests > 0 ? 
        Math.round((this.totalFailures / this.totalRequests) * 100) : 0
    };
  }
}

const orderQueue = new OrderQueue();
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  blockDuration: 300000
});
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 50,
  successThreshold: 10,
  timeoutMs: 30000
});

module.exports = {
  OrderQueue,
  RateLimiter,
  CircuitBreaker,
  orderQueue,
  rateLimiter,
  circuitBreaker
};