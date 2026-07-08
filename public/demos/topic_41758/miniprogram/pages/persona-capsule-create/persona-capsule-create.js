// pages/persona-capsule-create/persona-capsule-create.js
const mock = require('../../utils/mock.js');

Page({
  data: {
    // Step 1
    capsuleName: '',
    capsuleDesc: '',
    personaType: 'self',

    // Step 2 - memory sources
    photoGroups: [],
    moments: [],
    chats: [],
    bottles: [],

    // Selection state (set of ids)
    selectedPhotoIds: [],
    selectedMomentIds: [],
    selectedChatIds: [],
    selectedBottleIds: [],

    // Precomputed counts
    photoGroupsCount: 0,
    momentsCount: 0,
    chatsCount: 0,
    bottlesCount: 0,
    selectedPhotoCount: 0,
    selectedMomentCount: 0,
    selectedChatCount: 0,
    selectedBottleCount: 0,
    totalSelectedCount: 0,

    // Step 3 - AI preview
    showPreview: false,
    previewLoading: false,
    previewTraits: [],
    previewGreeting: '',

    // Submit
    submitting: false
  },

  onLoad() {
    this.loadMockData();
  },

  async loadMockData() {
    // Photo groups (week granularity)
    const photoRes = await mock.mockRequest('GET', '/api/photos/groups?granularity=week&page=1&size=6');
    const photoGroups = (photoRes.data && photoRes.data.items) || [];

    // Moments
    const momentRes = await mock.mockRequest('GET', '/api/moments?page=1&size=8');
    const moments = (momentRes.data && momentRes.data.items) || [];

    // Chat conversations
    const chatRes = await mock.mockRequest('GET', '/api/chats/conversations');
    const chats = (chatRes.data && chatRes.data.items) || [];

    // Bottles (capsules)
    const bottleRes = await mock.mockRequest('GET', '/api/capsules?status=all&page=1&size=6');
    const bottles = (bottleRes.data && bottleRes.data.items) || [];

    this.setData({
      photoGroups: photoGroups,
      moments: moments,
      chats: chats,
      bottles: bottles,
      photoGroupsCount: photoGroups.length,
      momentsCount: moments.length,
      chatsCount: chats.length,
      bottlesCount: bottles.length
    });
  },

  // Step 1 handlers
  onNameInput(e) {
    this.setData({ capsuleName: e.detail.value });
    this.updatePreviewState();
  },

  onDescInput(e) {
    this.setData({ capsuleDesc: e.detail.value });
  },

  selectPersonaType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ personaType: type });
  },

  // Step 2 handlers
  togglePhoto(e) {
    const id = e.currentTarget.dataset.id;
    const selected = new Set(this.data.selectedPhotoIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    const arr = Array.from(selected);
    this.setData({ selectedPhotoIds: arr, selectedPhotoCount: arr.length });
    this.updateTotalSelected();
  },

  toggleMoment(e) {
    const id = e.currentTarget.dataset.id;
    const selected = new Set(this.data.selectedMomentIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    const arr = Array.from(selected);
    this.setData({ selectedMomentIds: arr, selectedMomentCount: arr.length });
    this.updateTotalSelected();
  },

  toggleChat(e) {
    const id = e.currentTarget.dataset.id;
    const selected = new Set(this.data.selectedChatIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    const arr = Array.from(selected);
    this.setData({ selectedChatIds: arr, selectedChatCount: arr.length });
    this.updateTotalSelected();
  },

  toggleBottle(e) {
    const id = e.currentTarget.dataset.id;
    const selected = new Set(this.data.selectedBottleIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    const arr = Array.from(selected);
    this.setData({ selectedBottleIds: arr, selectedBottleCount: arr.length });
    this.updateTotalSelected();
  },

  updateTotalSelected() {
    const total = this.data.selectedPhotoCount + this.data.selectedMomentCount +
                  this.data.selectedChatCount + this.data.selectedBottleCount;
    this.setData({ totalSelectedCount: total });
    this.updatePreviewState();
  },

  updatePreviewState() {
    const hasName = this.data.capsuleName.trim().length > 0;
    const hasMemories = this.data.totalSelectedCount > 0;
    const shouldShow = hasName && hasMemories;

    if (shouldShow && !this.data.showPreview) {
      this.setData({ showPreview: true, previewLoading: true });
      this.generatePreview();
    } else if (!shouldShow) {
      this.setData({ showPreview: false, previewLoading: false });
    }
  },

  generatePreview() {
    const self = this;
    // Simulate AI analysis delay
    setTimeout(function() {
      const type = self.data.personaType;
      const traits = type === 'self'
        ? ['热爱旅行', '喜欢记录', '感性细腻', '坚持跑步', '咖啡爱好者', '重视友情']
        : ['开朗健谈', '关心他人', '幽默风趣', '生活达人', '音乐爱好者', '美食探索家'];
      const greetings = type === 'self'
        ? '你好，我是由你的记忆构成的 AI 分身。我了解你喜欢的每一座城市、每一段对话、每一个深夜的思绪。今天想聊点什么？'
        : '嗨，我是基于你选中记忆构建的 AI 形象。我熟悉那些聊天记录里的语气、朋友圈里的心情、还有一起走过的风景。有什么想聊的吗？';
      self.setData({
        previewLoading: false,
        previewTraits: traits,
        previewGreeting: greetings
      });
    }, 1500);
  },

  // Submit
  submit() {
    if (this.data.submitting) return;
    if (!this.data.capsuleName.trim()) {
      wx.showToast({ title: '请填写胶囊名称', icon: 'none' });
      return;
    }
    if (this.data.totalSelectedCount === 0) {
      wx.showToast({ title: '请至少选择一项记忆', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const payload = {
      name: this.data.capsuleName.trim(),
      description: this.data.capsuleDesc,
      persona_type: this.data.personaType,
      photo_group_ids: this.data.selectedPhotoIds,
      moment_ids: this.data.selectedMomentIds,
      chat_ids: this.data.selectedChatIds,
      bottle_ids: this.data.selectedBottleIds
    };

    const self = this;
    // Try cloud database, fallback to mock success
    try {
      const db = wx.cloud.database();
      db.collection('persona_capsules').add({
        data: payload,
        success: function(res) {
          self.showSuccess(res._id);
        },
        fail: function() {
          self.showSuccess('pc_' + Date.now());
        }
      });
    } catch (err) {
      self.showSuccess('pc_' + Date.now());
    }
  },

  showSuccess(id) {
    const self = this;
    wx.showModal({
      title: '记忆胶囊已封存',
      content: '你的 AI 人设胶囊「' + self.data.capsuleName + '」已成功创建，共封装 ' + self.data.totalSelectedCount + ' 条记忆。',
      showCancel: false,
      confirmText: '查看',
      success: function(res) {
        self.setData({ submitting: false });
        if (res.confirm) {
          wx.redirectTo({ url: '/pages/persona-capsule-detail/persona-capsule-detail?id=' + id });
        } else {
          wx.navigateBack();
        }
      }
    });
  }
});
