// ==================== 飞书数据同步管理器 ====================

class FeishuSyncManager {
  constructor() {
    this.config = this.loadConfig();
    this.syncStatus = {
      lastSyncTime: null,
      nextSyncTime: null,
      isSyncing: false,
      status: 'idle' // idle | syncing | success | error
    };
    this.syncTimer = null;
  }

  // ========== 配置管理 ==========
  getDefaultConfig() {
    return {
      appId: '',
      appSecret: '',
      bitableAppToken: '',
      tableName: '星巴克成本数据',
      syncMode: 'manual',
      syncFrequency: 'daily',
      notifications: [
        { type: 'daily', enabled: true, time: '20:00', storeId: 'all' },
        { type: 'weekly', enabled: true, day: 'monday', time: '09:00', storeId: 'all' },
        { type: 'monthly', enabled: false, day: 1, time: '10:00', storeId: 'all' }
      ]
    };
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('feishu_sync_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultConfig(), ...parsed };
      }
    } catch (e) {
      console.error('[飞书同步] 加载配置失败:', e);
    }
    return this.getDefaultConfig();
  }

  saveConfig(config) {
    try {
      localStorage.setItem('feishu_sync_config', JSON.stringify(config));
      this.config = config;
      return true;
    } catch (e) {
      console.error('[飞书同步] 保存配置失败:', e);
      return false;
    }
  }

  resetConfig() {
    this.config = this.getDefaultConfig();
    localStorage.removeItem('feishu_sync_config');
  }

  // ========== 数据同步 ==========
  async startAutoSync() {
    this.stopAutoSync();
    const freq = this.config.syncFrequency;
    let intervalMs;

    switch (freq) {
      case 'hourly': intervalMs = 60 * 60 * 1000; break;
      case 'daily': intervalMs = 24 * 60 * 60 * 1000; break;
      case 'weekly': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
      default: intervalMs = 24 * 60 * 60 * 1000;
    }

    this.updateNextSyncTime(intervalMs);

    this.syncTimer = setInterval(() => {
      this.performAutoSync();
    }, intervalMs);

    console.log('[飞书同步] 自动同步已启动，频率:', freq);
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncStatus.nextSyncTime = null;
  }

  updateNextSyncTime(intervalMs) {
    this.syncStatus.nextSyncTime = new Date(Date.now() + intervalMs).toLocaleString('zh-CN');
  }

  async performAutoSync() {
    console.log('[飞书同步] 自动同步触发');
    await this.callFeishuAPI('auto_sync', { timestamp: new Date().toISOString() });
    this.syncStatus.lastSyncTime = new Date().toLocaleString('zh-CN');
    this.updateNextSyncTime(
      this.config.syncFrequency === 'hourly' ? 3600000 :
      this.config.syncFrequency === 'daily' ? 86400000 : 604800000
    );
  }

  async manualSync(syncData) {
    this.syncStatus.isSyncing = true;
    this.syncStatus.status = 'syncing';

    try {
      // 模拟同步延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await this.callFeishuAPI('manual_sync', syncData);

      this.syncStatus.isSyncing = false;
      this.syncStatus.status = 'success';
      this.syncStatus.lastSyncTime = new Date().toLocaleString('zh-CN');

      return { success: true, syncTime: this.syncStatus.lastSyncTime, message: '数据同步成功（模拟）' };
    } catch (error) {
      this.syncStatus.isSyncing = false;
      this.syncStatus.status = 'error';
      return { success: false, message: error.message };
    }
  }

  // ========== 数据打包 ==========
  prepareSyncData(storeId, kpis, productData, channelStats) {
    return {
      storeId,
      syncTime: new Date().toISOString(),
      kpis: {
        totalRevenue: kpis.totalRevenue,
        totalCost: kpis.totalCost,
        grossProfit: kpis.grossProfit,
        profitMargin: kpis.profitMargin,
        totalCups: kpis.totalCups
      },
      products: productData.map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue,
        cost: p.cost,
        grossProfit: p.grossProfit,
        profitMargin: p.profitMargin
      })),
      channels: channelStats
    };
  }

  // ========== 消息提醒预览 ==========
  getNotificationPreview(rule, storeName, kpis) {
    const typeLabels = { daily: '日报', weekly: '周报', monthly: '月报' };
    const now = new Date();

    let preview = `📊 ${storeName} ${typeLabels[rule.type] || '报告'}\n`;
    preview += `📅 ${now.toLocaleDateString('zh-CN')}\n\n`;
    preview += `💰 总收入: ¥${kpis?.totalRevenue?.toLocaleString('zh-CN', { maximumFractionDigits: 0 }) || '--'}\n`;
    preview += `📈 毛利率: ${kpis?.profitMargin?.toFixed(1) || '--'}%\n`;
    preview += `☕ 总销量: ${kpis?.totalCups || '--'} 杯\n\n`;
    preview += `数据由星巴克成本核算系统自动推送`;

    return preview;
  }

  // ========== 核心预留接口 ==========
  async callFeishuAPI(endpoint, data) {
    console.log('[飞书API预留] endpoint:', endpoint);
    console.log('[飞书API预留] data:', JSON.stringify(data, null, 2));
    console.log('[飞书API预留] 提示: 当前为前端模拟模式，实际使用时需替换为真实飞书API调用');
    console.log('[飞书API预留] 可通过 lark-cli base +record-batch-create 写入多维表格');
    console.log('[飞书API预留] 可通过 lark-cli im +messages-send 发送消息提醒');

    return {
      success: true,
      message: '接口预留，未实际调用飞书API',
      endpoint,
      timestamp: new Date().toISOString()
    };
  }

  // ========== 状态管理 ==========
  getStatusText() {
    switch (this.syncStatus.status) {
      case 'syncing': return '同步中...';
      case 'success': return '同步成功';
      case 'error': return '同步失败';
      default: return this.config.appId ? '已配置' : '未配置';
    }
  }

  getStatusColor() {
    switch (this.syncStatus.status) {
      case 'syncing': return 'bg-blue-400';
      case 'success': return 'bg-green-400';
      case 'error': return 'bg-red-400';
      default: return this.config.appId ? 'bg-green-300' : 'bg-gray-300';
    }
  }
}
