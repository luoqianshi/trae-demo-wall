// repositories/app-settings-repository.js
// 应用设置仓库（单例）

const storageManager = require('../storage/storage-manager.js');
const STORAGE_KEYS = require('../storage/storage-keys.js');
const AppSettings = require('../models/app-settings.js');

const appSettingsRepository = {
  /**
   * 读取设置，未保存时返回默认设置实例
   * @returns {AppSettings}
   */
  getSettings() {
    const obj = storageManager.get(STORAGE_KEYS.APP_SETTINGS, null);
    return AppSettings.fromObject(obj);
  },

  /**
   * 仅读取一次（async 包装，便于上层 await）
   * @returns {Promise<AppSettings>}
   */
  async getSettingsOnce() {
    try {
      return this.getSettings();
    } catch (e) {
      console.error('[appSettingsRepository.getSettingsOnce] error', e);
      return AppSettings.fromObject(null);
    }
  },

  /**
   * 持久化设置
   * @param {AppSettings|object} settings
   * @returns {AppSettings|null}
   */
  saveSettings(settings) {
    if (!settings) return null;
    const inst = settings instanceof AppSettings ? settings : AppSettings.fromObject(settings);
    if (!inst) return null;
    if (inst.id == null) inst.id = 1;
    storageManager.set(STORAGE_KEYS.APP_SETTINGS, inst.toObject());
    return inst;
  },

  /**
   * 标记引导完成。保留 async 关键字以兼容上层 await 调用风格。
   * @returns {Promise<AppSettings>}
   */
  async setOnboardingCompleted() {
    const current = this.getSettings();
    current.hasCompletedOnboarding = true;
    this.saveSettings(current);
    return current;
  },

  /**
   * 判断是否已完成引导。
   * @returns {Promise<boolean>}
   */
  async hasCompletedOnboarding() {
    const s = this.getSettings();
    return !!(s && s.hasCompletedOnboarding);
  }
};

module.exports = appSettingsRepository;
