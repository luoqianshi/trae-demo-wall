const logger = require('./logger');

class MessageQueue {
  constructor(options = {}) {
    this.queues = {};
    this.processing = {};
    this.maxWorkers = options.maxWorkers || 5;
    this.maxRetries = options.maxRetries || 3;
    this.delayMs = options.delayMs || 100;
    this.running = true;

    this.stats = {
      totalMessages: 0,
      processedMessages: 0,
      failedMessages: 0,
      retryMessages: 0,
      queues: {}
    };

    this.startProcessing();
  }

  createQueue(name, options = {}) {
    if (!this.queues[name]) {
      this.queues[name] = {
        messages: [],
        processors: [],
        options: {
          maxWorkers: options.maxWorkers || this.maxWorkers,
          maxRetries: options.maxRetries || this.maxRetries,
          delayMs: options.delayMs || this.delayMs,
          ...options
        },
        stats: {
          total: 0,
          processed: 0,
          failed: 0
        }
      };
      this.stats.queues[name] = this.queues[name].stats;
    }
    return this.queues[name];
  }

  enqueue(queueName, message, options = {}) {
    if (!this.running) {
      return { success: false, message: '队列已停止' };
    }

    if (!this.queues[queueName]) {
      this.createQueue(queueName);
    }

    const queue = this.queues[queueName];
    const messageId = `${queueName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const wrappedMessage = {
      id: messageId,
      payload: message,
      retries: 0,
      maxRetries: options.maxRetries || queue.options.maxRetries,
      createdAt: Date.now(),
      status: 'pending',
      priority: options.priority || 0
    };

    queue.messages.push(wrappedMessage);
    queue.messages.sort((a, b) => b.priority - a.priority);
    queue.stats.total++;
    this.stats.totalMessages++;

    logger.debug(`Message enqueued: ${messageId}`, { queue: queueName });

    return { success: true, messageId, queueSize: queue.messages.length };
  }

  async processQueue(queueName) {
    const queue = this.queues[queueName];
    if (!queue || !this.running) return;

    const maxWorkers = queue.options.maxWorkers;
    const currentWorkers = this.processing[queueName] || 0;

    if (currentWorkers >= maxWorkers || queue.messages.length === 0) return;

    this.processing[queueName] = currentWorkers + 1;

    const message = queue.messages.shift();
    if (!message) {
      this.processing[queueName]--;
      return;
    }

    message.status = 'processing';

    try {
      const processor = queue.processors[0];
      if (!processor) {
        throw new Error('No processor registered for queue');
      }

      await processor(message.payload, message);

      message.status = 'completed';
      message.completedAt = Date.now();
      queue.stats.processed++;
      this.stats.processedMessages++;

      logger.debug(`Message processed: ${message.id}`, { queue: queueName });
    } catch (error) {
      message.status = 'failed';
      message.error = error.message;
      message.retries++;

      logger.error(`Message failed: ${message.id}`, {
        queue: queueName,
        error: error.message,
        retries: message.retries
      });

      if (message.retries < message.maxRetries) {
        message.status = 'pending';
        queue.messages.push(message);
        this.stats.retryMessages++;

        setTimeout(() => {
          this.triggerProcessing(queueName);
        }, queue.options.delayMs * Math.pow(2, message.retries));
      } else {
        queue.stats.failed++;
        this.stats.failedMessages++;
        logger.error(`Message permanently failed: ${message.id}`, { queue: queueName });
      }
    } finally {
      this.processing[queueName]--;
      this.triggerProcessing(queueName);
    }
  }

  triggerProcessing(queueName) {
    setImmediate(() => this.processQueue(queueName));
  }

  registerProcessor(queueName, processor) {
    if (!this.queues[queueName]) {
      this.createQueue(queueName);
    }
    this.queues[queueName].processors.push(processor);
    logger.info(`Processor registered for queue: ${queueName}`);
  }

  startProcessing() {
    const processAllQueues = () => {
      if (!this.running) return;

      Object.keys(this.queues).forEach(queueName => {
        for (let i = 0; i < this.queues[queueName].options.maxWorkers; i++) {
          this.triggerProcessing(queueName);
        }
      });

      setTimeout(processAllQueues, this.delayMs);
    };

    processAllQueues();
  }

  stop() {
    this.running = false;
    logger.info('Message queue stopped');
  }

  getStats() {
    return {
      ...this.stats,
      queues: Object.keys(this.queues).reduce((acc, name) => {
        acc[name] = {
          ...this.queues[name].stats,
          pending: this.queues[name].messages.filter(m => m.status === 'pending').length,
          processing: this.queues[name].messages.filter(m => m.status === 'processing').length
        };
        return acc;
      }, {})
    };
  }

  getQueueStats(queueName) {
    if (!this.queues[queueName]) {
      return null;
    }

    const queue = this.queues[queueName];
    return {
      ...queue.stats,
      pending: queue.messages.filter(m => m.status === 'pending').length,
      processing: queue.messages.filter(m => m.status === 'processing').length,
      failed: queue.messages.filter(m => m.status === 'failed' && m.retries >= m.maxRetries).length
    };
  }

  purgeQueue(queueName) {
    if (!this.queues[queueName]) {
      return { success: false, message: '队列不存在' };
    }

    const count = this.queues[queueName].messages.length;
    this.queues[queueName].messages = [];
    this.queues[queueName].stats = { total: 0, processed: 0, failed: 0 };

    logger.info(`Queue purged: ${queueName} (${count} messages)`);
    return { success: true, message: `已清除 ${count} 条消息` };
  }
}

const messageQueue = new MessageQueue({
  maxWorkers: 5,
  maxRetries: 3,
  delayMs: 100
});

messageQueue.createQueue('order_notifications', {
  maxWorkers: 3,
  maxRetries: 3
});

messageQueue.createQueue('stock_updates', {
  maxWorkers: 2,
  maxRetries: 2
});

messageQueue.createQueue('risk_analysis', {
  maxWorkers: 4,
  maxRetries: 2
});

module.exports = {
  MessageQueue,
  messageQueue
};