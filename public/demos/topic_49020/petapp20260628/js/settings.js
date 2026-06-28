/* settings.js — 设置面板逻辑（全局单例 Settings） */

const Settings = {
  modal: null,
  fields: {},

  init() {
    this.modal = document.getElementById('settings-modal');
    this.fields = {
      baseUrl: document.getElementById('cfg-baseUrl'),
      apiKey: document.getElementById('cfg-apiKey'),
      chatModel: document.getElementById('cfg-chatModel'),
      actionModel: document.getElementById('cfg-actionModel'),
      temperature: document.getElementById('cfg-temperature'),
      actionTemperature: document.getElementById('cfg-actionTemperature'),
      mode: document.getElementById('cfg-mode'),
      chatPrompt: document.getElementById('cfg-chatPrompt'),
      actionPrompt: document.getElementById('cfg-actionPrompt')
    };

    // 打开
    document.getElementById('settings-btn').addEventListener('click', () => this.open());

    // 取消
    document.getElementById('settings-cancel').addEventListener('click', () => this.close());

    // 点击遮罩关闭
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // 保存
    document.getElementById('settings-save').addEventListener('click', () => this.save());

    // 显示/隐藏 Key
    document.getElementById('toggle-key').addEventListener('click', () => {
      const inp = this.fields.apiKey;
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // 清空记忆
    document.getElementById('clear-memory-btn').addEventListener('click', () => {
      if (confirm('确定要清空所有对话记忆吗？此操作不可恢复。')) {
        Memory.clear();
        ChatUI.clearAll();
        ChatUI.addSystemMessage('记忆已清空~');
        this.close();
      }
    });
  },

  open() {
    this._fillForm();
    this.modal.style.display = 'flex';
  },

  close() {
    this.modal.style.display = 'none';
  },

  _fillForm() {
    const d = Config.data;
    this.fields.baseUrl.value = d.baseUrl || '';
    this.fields.apiKey.value = d.apiKey || '';
    this.fields.chatModel.value = d.chatModel || '';
    this.fields.actionModel.value = d.actionModel || '';
    this.fields.temperature.value = d.temperature;
    this.fields.actionTemperature.value = d.actionTemperature;
    this.fields.mode.value = d.mode || 'parallel';
    this.fields.chatPrompt.value = d.chatSystemPrompt || '';
    this.fields.actionPrompt.value = d.actionSystemPrompt || '';
  },

  save() {
    const d = Config.data;
    d.baseUrl = this.fields.baseUrl.value.trim() || Config.defaults.baseUrl;
    d.apiKey = this.fields.apiKey.value.trim();
    d.chatModel = this.fields.chatModel.value.trim() || Config.defaults.chatModel;
    d.actionModel = this.fields.actionModel.value.trim() || Config.defaults.actionModel;
    d.temperature = parseFloat(this.fields.temperature.value) || 0;
    d.actionTemperature = parseFloat(this.fields.actionTemperature.value) || 0;
    d.mode = this.fields.mode.value;
    const newChatPrompt = this.fields.chatPrompt.value.trim() || Config.defaults.chatSystemPrompt;
    d.chatSystemPrompt = newChatPrompt;
    d.actionSystemPrompt = this.fields.actionPrompt.value.trim() || Config.defaults.actionSystemPrompt;

    Config.save();

    // 同步记忆顶部的 system 提示词
    Memory.updateSystemPrompt(newChatPrompt);

    this.close();
    ChatUI.addSystemMessage('设置已保存 ✓');
  }
};
