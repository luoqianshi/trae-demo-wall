/* ============================================================
   坏情绪粉碎机 · AI 配置管理模块
   支持多配置切换，密钥 Base64 简单编码存储
   ============================================================ */

(function () {
  'use strict';

  const KEY_CONFIGS = 'mc_ai_configs';
  const KEY_ACTIVE = 'mc_ai_active';
  const KEY_ENABLED = 'mc_ai_enabled';

  // 简单编码（防控制台随手复制，非高强度加密）
  function encode(str) {
    try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return str; }
  }
  function decode(str) {
    try { return decodeURIComponent(escape(atob(str))); } catch (e) { return str; }
  }

  function defaultConfig() {
    return {
      id: 'cfg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: '默认配置',
      provider: 'openai',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      enabled: true,
    };
  }

  function loadConfigs() {
    try {
      const v = localStorage.getItem(KEY_CONFIGS);
      if (!v) return [];
      const configs = JSON.parse(v);
      // 解码 apiKey
      return configs.map(c => ({ ...c, apiKey: c.apiKey ? decode(c.apiKey) : '' }));
    } catch (e) { return []; }
  }

  function saveConfigs(configs) {
    try {
      // 编码 apiKey 后存储
      const toSave = configs.map(c => ({ ...c, apiKey: c.apiKey ? encode(c.apiKey) : '' }));
      localStorage.setItem(KEY_CONFIGS, JSON.stringify(toSave));
    } catch (e) { /* quota */ }
  }

  function getActiveId() {
    return localStorage.getItem(KEY_ACTIVE) || null;
  }

  function setActiveId(id) {
    localStorage.setItem(KEY_ACTIVE, id || '');
  }

  // 获取所有配置
  function getConfigs() {
    return loadConfigs();
  }

  // 新增配置
  function addConfig(cfg) {
    const configs = loadConfigs();
    const newCfg = { ...defaultConfig(), ...cfg, id: 'cfg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) };
    configs.push(newCfg);
    saveConfigs(configs);
    return newCfg;
  }

  // 更新配置
  function updateConfig(id, patch) {
    const configs = loadConfigs();
    const idx = configs.findIndex(c => c.id === id);
    if (idx < 0) return null;
    configs[idx] = { ...configs[idx], ...patch, id }; // 保证 id 不被 patch 覆盖
    saveConfigs(configs);
    return configs[idx];
  }

  // 删除配置
  function deleteConfig(id) {
    const configs = loadConfigs().filter(c => c.id !== id);
    saveConfigs(configs);
    // 如果删除的是活跃配置，清除活跃状态
    if (getActiveId() === id) setActiveId(null);
  }

  // 获取当前活跃配置
  function getActiveConfig() {
    const id = getActiveId();
    if (!id) return null;
    const configs = loadConfigs();
    return configs.find(c => c.id === id) || null;
  }

  // 切换活跃配置
  function setActiveConfig(id) {
    setActiveId(id);
  }

  // AI 功能总开关
  function isAIEnabled() {
    return localStorage.getItem(KEY_ENABLED) !== 'false';
  }

  function setAIEnabled(enabled) {
    localStorage.setItem(KEY_ENABLED, enabled ? 'true' : 'false');
  }

  // 掩码显示密钥（只显示后4位）
  function maskKey(key) {
    if (!key || key.length < 4) return '****';
    return '****' + key.slice(-4);
  }

  window.MCAIConfig = {
    getConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    getActiveConfig,
    setActiveConfig,
    isAIEnabled,
    setAIEnabled,
    maskKey,
    KEY_ENABLED,
  };
})();
