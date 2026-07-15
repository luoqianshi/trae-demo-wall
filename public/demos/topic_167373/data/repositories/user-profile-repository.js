// repositories/user-profile-repository.js
// 用户档案仓库（单例）

const storageManager = require('../storage/storage-manager.js');
const STORAGE_KEYS = require('../storage/storage-keys.js');
const UserProfile = require('../models/user-profile.js');

const userProfileRepository = {
  /**
   * 读取档案
   * @returns {UserProfile|null}
   */
  getProfile() {
    const obj = storageManager.get(STORAGE_KEYS.USER_PROFILE, null);
    return UserProfile.fromObject(obj);
  },

  /**
   * 保存档案。允许直接传入对象，会被规范化为 UserProfile 实例。
   * @param {UserProfile|object|null} profile
   */
  saveProfile(profile) {
    if (!profile) {
      storageManager.remove(STORAGE_KEYS.USER_PROFILE);
      return null;
    }
    const inst = profile instanceof UserProfile ? profile : UserProfile.fromObject(profile);
    if (!inst) return null;
    // 保持单例主键
    if (inst.id == null) inst.id = 1;
    storageManager.set(STORAGE_KEYS.USER_PROFILE, inst.toObject());
    return inst;
  },

  /**
   * 清空档案
   */
  clear() {
    storageManager.remove(STORAGE_KEYS.USER_PROFILE);
  }
};

module.exports = userProfileRepository;
