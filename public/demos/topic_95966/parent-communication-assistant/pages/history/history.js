const { getHistory, deleteHistoryItem, clearHistory, exportHistory } = require('../../services/storage');
const { SCENES, STYLES, CHANNELS } = require('../../utils/constants');

Page({
  data: {
    history: [],
    filteredHistory: [],
    searchKeyword: '',
    selectedScenes: [],
    showFilterPanel: false,
    showDetailModal: false,
    selectedItem: null,
    sceneOptions: SCENES
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const { searchKeyword, selectedScenes } = this.data;
    const options = {};
    
    if (searchKeyword) {
      options.keyword = searchKeyword;
    }
    
    const history = getHistory(options);
    
    // 格式化显示
    const formatted = history.map(item => ({
      ...item,
      sceneName: this.getSceneName(item.scene),
      styleName: this.getStyleName(item.style),
      channelName: this.getChannelName(item.channel),
      timeStr: this.formatTime(item.timestamp)
    }));
    
    // 多场景筛选
    let filtered = formatted;
    if (selectedScenes.length > 0) {
      filtered = filtered.filter(item => selectedScenes.includes(item.scene));
    }
    
    this.setData({ 
      history: formatted,
      filteredHistory: filtered
    });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value }, () => {
      this.loadHistory();
    });
  },

  onToggleFilterPanel() {
    this.setData({ showFilterPanel: !this.data.showFilterPanel });
  },

  onSceneFilter(e) {
    const { scene } = e.currentTarget.dataset;
    let { selectedScenes } = this.data;
    const index = selectedScenes.indexOf(scene);
    
    if (index >= 0) {
      selectedScenes.splice(index, 1);
    } else {
      selectedScenes.push(scene);
    }
    
    this.setData({ selectedScenes }, () => {
      this.loadHistory();
    });
  },

  onClearFilter() {
    this.setData({ selectedScenes: [] }, () => {
      this.loadHistory();
    });
  },

  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.filteredHistory.find(h => h.id === id);
    
    if (!item) return;
    
    this.setData({ showDetailModal: true, selectedItem: item });
  },

  onCloseDetailModal() {
    this.setData({ showDetailModal: false, selectedItem: null });
  },

  onCopyContent() {
    if (!this.data.selectedItem) return;
    wx.setClipboardData({
      data: this.data.selectedItem.content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
        this.onCloseDetailModal();
      }
    });
  },

  onCopyFromList(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.filteredHistory.find(h => h.id === id);
    if (!item) return;
    
    wx.setClipboardData({
      data: item.content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  regenerate(item) {
    const app = getApp();
    app.globalData.regenerateParams = {
      scene: item.scene,
      style: item.style,
      channel: item.channel,
      studentName: item.studentName
    };
    
    wx.switchTab({
      url: '/pages/generate/generate'
    });
  },

  onRegenerateFromDetail() {
    const item = this.data.selectedItem;
    if (!item) return;
    this.onCloseDetailModal();
    this.regenerate(item);
  },

  onRegenerateFromList(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.filteredHistory.find(h => h.id === id);
    if (!item) return;
    this.regenerate(item);
  },

  deleteItem(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          deleteHistoryItem(id);
          this.loadHistory();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  onClearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          clearHistory();
          this.loadHistory();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  onExport() {
    const content = exportHistory();
    
    if (!content) {
      wx.showToast({ title: '暂无记录可导出', icon: 'none' });
      return;
    }
    
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  getSceneName(sceneId) {
    const scene = SCENES.find(s => s.id === sceneId);
    return scene ? scene.name : sceneId;
  },

  getStyleName(styleId) {
    const style = STYLES.find(s => s.id === styleId);
    return style ? style.name : styleId;
  },

  getChannelName(channelId) {
    const channel = CHANNELS.find(c => c.id === channelId);
    return channel ? channel.name : channelId;
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    
    // 7天内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      return `周${days[date.getDay()]}`;
    }
    
    // 更早
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
});
