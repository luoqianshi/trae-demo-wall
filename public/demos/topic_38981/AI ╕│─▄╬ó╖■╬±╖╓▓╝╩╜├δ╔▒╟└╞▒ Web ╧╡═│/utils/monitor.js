const logger = require('./logger');

class Monitor {
  constructor() {
    this.alerts = [];
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        rate: []
      },
      orders: {
        total: 0,
        success: 0,
        failed: 0,
        pending: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0
      },
      risk: {
        totalLogs: 0,
        highRiskUsers: 0,
        blockedIPs: 0
      }
    };

    this.thresholds = {
      requestsPerSecond: 100,
      errorRate: 10,
      memoryUsagePercent: 80,
      cpuUsagePercent: 80,
      pendingOrders: 100
    };

    this.alertHistory = [];
    this.maxAlerts = 100;

    setInterval(() => this.collectMetrics(), 5000);
    setInterval(() => this.checkThresholds(), 10000);
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();

    this.metrics.system.memoryUsage = Math.round((memUsage.heapUsed / totalMem) * 100);
    this.metrics.system.uptime = process.uptime();

    try {
      const cpus = require('os').cpus();
      const totalIdle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
      const total = cpus.reduce((sum, cpu) => sum + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0);
      this.metrics.system.cpuUsage = Math.round(((total - totalIdle) / total) * 100);
    } catch (e) {
      this.metrics.system.cpuUsage = 0;
    }
  }

  recordRequest(success) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
    }

    this.metrics.requests.rate.push({
      time: Date.now(),
      success
    });

    if (this.metrics.requests.rate.length > 60) {
      this.metrics.requests.rate.shift();
    }
  }

  recordOrder(status) {
    this.metrics.orders.total++;
    if (status === 'success' || status === 'paid') {
      this.metrics.orders.success++;
    } else if (status === 'failed') {
      this.metrics.orders.failed++;
    } else if (status === 'pending') {
      this.metrics.orders.pending++;
    }
  }

  updatePendingOrders(count) {
    this.metrics.orders.pending = count;
  }

  updateRiskStats(logs, highRiskUsers, blockedIPs) {
    this.metrics.risk.totalLogs = logs;
    this.metrics.risk.highRiskUsers = highRiskUsers;
    this.metrics.risk.blockedIPs = blockedIPs;
  }

  checkThresholds() {
    const alerts = [];
    const now = Date.now();

    const recentRate = this.metrics.requests.rate.filter(r => now - r.time < 10000).length;
    if (recentRate > this.thresholds.requestsPerSecond) {
      alerts.push({
        level: 'warning',
        type: 'request_rate',
        message: `请求频率过高: ${recentRate}/秒`,
        threshold: this.thresholds.requestsPerSecond
      });
    }

    const errorRate = this.metrics.requests.total > 0
      ? Math.round((this.metrics.requests.error / this.metrics.requests.total) * 100)
      : 0;
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        level: 'error',
        type: 'error_rate',
        message: `错误率过高: ${errorRate}%`,
        threshold: `${this.thresholds.errorRate}%`
      });
    }

    if (this.metrics.system.memoryUsage > this.thresholds.memoryUsagePercent) {
      alerts.push({
        level: 'warning',
        type: 'memory_usage',
        message: `内存使用率过高: ${this.metrics.system.memoryUsage}%`,
        threshold: `${this.thresholds.memoryUsagePercent}%`
      });
    }

    if (this.metrics.system.cpuUsage > this.thresholds.cpuUsagePercent) {
      alerts.push({
        level: 'warning',
        type: 'cpu_usage',
        message: `CPU使用率过高: ${this.metrics.system.cpuUsage}%`,
        threshold: `${this.thresholds.cpuUsagePercent}%`
      });
    }

    if (this.metrics.orders.pending > this.thresholds.pendingOrders) {
      alerts.push({
        level: 'error',
        type: 'pending_orders',
        message: `待处理订单过多: ${this.metrics.orders.pending}`,
        threshold: this.thresholds.pendingOrders
      });
    }

    alerts.forEach(alert => {
      const alertId = `${alert.type}_${now}`;
      if (!this.alertHistory.find(a => a.type === alert.type && now - a.timestamp < 60000)) {
        this.alertHistory.unshift({
          id: alertId,
          ...alert,
          timestamp: now
        });

        if (this.alertHistory.length > this.maxAlerts) {
          this.alertHistory.pop();
        }

        this.sendAlert(alert);
      }
    });
  }

  sendAlert(alert) {
    const level = alert.level.toUpperCase();
    logger[alert.level](`ALERT [${alert.type}]: ${alert.message}`, {
      threshold: alert.threshold,
      timestamp: alert.timestamp
    });

    if (global.io) {
      global.io.to('monitor-room').emit('alert', {
        ...alert,
        timestamp: alert.timestamp
      });
    }
  }

  getMetrics() {
    const errorRate = this.metrics.requests.total > 0
      ? Math.round((this.metrics.requests.error / this.metrics.requests.total) * 100)
      : 0;

    return {
      ...this.metrics,
      errorRate,
      uptimeFormatted: this.formatUptime(this.metrics.system.uptime),
      alerts: this.alerts
    };
  }

  getAlertHistory() {
    return this.alertHistory;
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }

  getStatus() {
    const alerts = this.getActiveAlerts();
    let status = 'healthy';
    
    if (alerts.some(a => a.level === 'error')) {
      status = 'critical';
    } else if (alerts.some(a => a.level === 'warning')) {
      status = 'warning';
    }

    return {
      status,
      alerts: alerts.length,
      uptime: this.formatUptime(this.metrics.system.uptime)
    };
  }

  getActiveAlerts() {
    return this.alertHistory.filter(a => Date.now() - a.timestamp < 300000);
  }

  acknowledgeAlert(alertId) {
    const index = this.alertHistory.findIndex(a => a.id === alertId);
    if (index !== -1) {
      this.alertHistory[index].acknowledged = true;
      return { success: true, message: '告警已确认' };
    }
    return { success: false, message: '告警不存在' };
  }
}

const monitor = new Monitor();

module.exports = {
  Monitor,
  monitor
};