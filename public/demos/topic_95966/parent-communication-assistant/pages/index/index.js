const { getHistory } = require('../../services/storage');
const { SCENES } = require('../../utils/constants');

Page({
  data: {
    quickActions: [
      { id: 'generate', name: '生成话术', icon: '✏️', desc: '根据学生情况快速生成沟通话术', color: '#4A90D9' },
      { id: 'history', name: '历史记录', icon: '📜', desc: '查看和管理沟通历史', color: '#FA8C16' }
    ],
    recentHistory: [],
    todayCount: 0,
    totalCount: 0,
    showModal: false,
    selectedItem: null
  },

  onLoad() {
  },

  onShow() {
    this.loadStats();
    this.loadRecentHistory();
  },

  getSceneName(sceneId) {
    const scene = SCENES.find(s => s.id === sceneId);
    return scene ? scene.name : sceneId;
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      return `周${days[date.getDay()]}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  loadStats() {
    const history = getHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = history.filter(h => new Date(h.timestamp) >= today).length;
    
    this.setData({
      todayCount,
      totalCount: history.length
    });
  },

  loadRecentHistory() {
    const history = getHistory();
    const recent = history.slice(0, 5).map(item => ({
      ...item,
      sceneName: this.getSceneName(item.scene),
      timeStr: this.formatTime(item.timestamp)
    }));
    this.setData({ recentHistory: recent });
  },

  onQuickAction(e) {
    const { id } = e.currentTarget.dataset;
    const pageMap = {
      'generate': '/pages/generate/generate',
      'history': '/pages/history/history'
    };
    
    wx.switchTab({
      url: pageMap[id]
    });
  },

  onNavigateToGenerate() {
    wx.switchTab({
      url: '/pages/generate/generate'
    });
  },

  onHistoryItemTap(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.recentHistory.find(h => h.id === id);
    if (item) {
      this.setData({ showModal: true, selectedItem: item });
    }
  },

  onCloseModal() {
    this.setData({ showModal: false, selectedItem: null });
  },

  onCopyContent() {
    if (!this.data.selectedItem) return;
    wx.setClipboardData({
      data: this.data.selectedItem.content,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
        this.onCloseModal();
      }
    });
  }
});
