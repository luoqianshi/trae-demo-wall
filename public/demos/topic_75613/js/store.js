/**
 * 政策通状态管理 - localStorage 持久化
 *
 * 所有用户数据存储到 localStorage，键名统一使用 `policymate_` 前缀。
 * 通过 window.PolicyMateStore 暴露 API，不使用 ES modules。
 */
(function () {
  'use strict';

  // ============ PII 简易混淆（非加密，仅防肉眼窥探） ============
  const XOR_KEY = 'policymate2025';
  function obfuscate(str) {
    if (!str) return str;
    let encoded = '';
    for (let i = 0; i < str.length; i++) {
      encoded += String.fromCharCode(str.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
    }
    return btoa(unescape(encodeURIComponent(encoded)));
  }
  function deobfuscate(str) {
    if (!str) return str;
    try {
      const decoded = decodeURIComponent(escape(atob(str)));
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
      }
      return result;
    } catch (e) {
      // 无法解混淆，返回原值（兼容旧数据）
      return str;
    }
  }

  /** 解混淆画像的 PII 字段 */
  function deobfuscateProfile(p) {
    if (p.ageRange) p.ageRange = deobfuscate(p.ageRange);
    if (p.incomeRange) p.incomeRange = deobfuscate(p.incomeRange);
    if (p.identity) p.identity = p.identity.map(function (v) { return deobfuscate(v); });
    return p;
  }

  // ============ 存储键定义 ============
  const KEYS = {
    PROFILES: 'policymate_profiles',                  // 用户画像数组
    CURRENT_PROFILE_ID: 'policymate_current_profile_id', // 当前画像 ID
    FAVORITES: 'policymate_favorites',                // 收藏政策 ID 数组
    LIST_STATUS: 'policymate_list_status',            // 政策状态映射 { <policyId>: 'pending'|'applied'|'approved'|'not_applicable' }
    MATCH_RESULTS: 'policymate_match_results',        // 最近一次匹配结果（修复原 Next.js 版未持久化的 bug）
    RECOMMENDATIONS: 'policymate_recommendations',    // 最近一次推荐结果
    A11Y: 'policymate_a11y'                           // 适老化设置 { fontSize, highContrast, largeButton }
  };

  // ============ 通用工具 ============

  /**
   * 从 localStorage 读取并解析 JSON
   * @param {string} key 存储键
   * @param {*} defaultValue 解析失败或不存在时返回的默认值
   */
  function readJSON(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse', key, e);
      return defaultValue;
    }
  }

  /**
   * 将值序列化为 JSON 并写入 localStorage
   * @param {string} key 存储键
   * @param {*} value 任意可序列化值
   * @returns {boolean} 是否写入成功
   */
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Failed to write', key, e);
      return false;
    }
  }

  // ============ Profiles 用户画像管理 ============

  /** 获取全部用户画像（读取后解混淆 PII） */
  function getProfiles() {
    const profiles = readJSON(KEYS.PROFILES, []);
    profiles.forEach(deobfuscateProfile);
    return profiles;
  }

  /**
   * 保存用户画像（新增或更新）
   * - 无 id 时生成新 id 并添加
   * - 有 id 时更新对应画像
   * 保存后自动切换 currentProfileId 到该画像
   * @param {Object} profile 画像对象
   * @returns {Object} 保存后的画像
   */
  function saveProfile(profile) {
    const profiles = getProfiles();

    // 在写入前对 PII 字段做混淆
    const obfuscatedProfile = Object.assign({}, profile);
    if (obfuscatedProfile.ageRange) obfuscatedProfile.ageRange = obfuscate(obfuscatedProfile.ageRange);
    if (obfuscatedProfile.incomeRange) obfuscatedProfile.incomeRange = obfuscate(obfuscatedProfile.incomeRange);
    if (obfuscatedProfile.identity) obfuscatedProfile.identity = obfuscatedProfile.identity.map(function (v) { return obfuscate(v); });

    if (!obfuscatedProfile.id) {
      obfuscatedProfile.id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      obfuscatedProfile.createdAt = new Date().toISOString();
      profiles.push(obfuscatedProfile);
    } else {
      let idx = -1;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].id === obfuscatedProfile.id) { idx = i; break; }
      }
      if (idx >= 0) {
        profiles[idx] = Object.assign({}, profiles[idx], obfuscatedProfile, { updatedAt: new Date().toISOString() });
      } else {
        profiles.push(obfuscatedProfile);
      }
    }
    writeJSON(KEYS.PROFILES, profiles);
    // 切换 currentProfileId 到该画像
    setCurrentProfile(obfuscatedProfile.id);
    return profile;
  }

  /** 获取当前选中的画像，无则返回 null */
  function getCurrentProfile() {
    const currentId = localStorage.getItem(KEYS.CURRENT_PROFILE_ID);
    if (!currentId) return null;
    const profiles = getProfiles();
    for (let i = 0; i < profiles.length; i++) {
      if (profiles[i].id === currentId) return profiles[i];
    }
    return null;
  }

  /** 设置当前画像 ID */
  function setCurrentProfile(id) {
    localStorage.setItem(KEYS.CURRENT_PROFILE_ID, id);
  }

  /**
   * 删除指定画像
   * 若删除的是当前画像，则切换到第一个；若已无画像，则移除 currentProfileId
   */
  function deleteProfile(id) {
    const profiles = getProfiles().filter(function (p) { return p.id !== id; });
    writeJSON(KEYS.PROFILES, profiles);
    const currentId = localStorage.getItem(KEYS.CURRENT_PROFILE_ID);
    if (currentId === id) {
      if (profiles.length > 0) {
        setCurrentProfile(profiles[0].id);
      } else {
        localStorage.removeItem(KEYS.CURRENT_PROFILE_ID);
      }
    }
  }

  // ============ Favorites 收藏 ============

  /** 获取收藏政策 ID 数组 */
  function getFavorites() {
    return readJSON(KEYS.FAVORITES, []);
  }

  /** 判断指定政策是否已收藏 */
  function isFavorite(policyId) {
    return getFavorites().indexOf(policyId) >= 0;
  }

  /**
   * 切换某政策的收藏状态
   * @returns {boolean} 切换后的收藏状态（true=已收藏）
   */
  function toggleFavorite(policyId) {
    const favorites = getFavorites();
    const idx = favorites.indexOf(policyId);
    if (idx >= 0) {
      favorites.splice(idx, 1);
    } else {
      favorites.push(policyId);
    }
    writeJSON(KEYS.FAVORITES, favorites);
    return isFavorite(policyId); // 返回新状态（true=已收藏）
  }

  // ============ ListStatus 政策状态追踪 ============

  /**
   * 获取某政策的处理状态
   * @returns {'pending'|'applied'|'approved'|'not_applicable'|null}
   */
  function getListStatus(policyId) {
    const all = readJSON(KEYS.LIST_STATUS, {});
    return all[policyId] || null; // null 表示未设置
  }

  /**
   * 设置某政策的处理状态
   * status 传入 null/undefined 时移除该政策的记录
   */
  function setListStatus(policyId, status) {
    const all = readJSON(KEYS.LIST_STATUS, {});
    if (status === null || status === undefined) {
      delete all[policyId];
    } else {
      all[policyId] = status;
    }
    writeJSON(KEYS.LIST_STATUS, all);
  }

  /** 获取全部政策的处理状态映射 */
  function getAllListStatus() {
    return readJSON(KEYS.LIST_STATUS, {});
  }

  // ============ MatchResults 匹配结果 ============

  /**
   * 保存最近一次匹配结果
   * @param {Array} results 匹配结果数组 [{ policy, score, reason }]
   * @param {Array} recommendations 推荐数组 [{ policy, reason }]
   * @param {Object} profile 匹配使用的画像
   * @param {'high'|'medium'|'low'} confidence 置信度
   */
  function saveMatchResults(results, recommendations, profile, confidence) {
    const data = {
      results: results,
      recommendations: recommendations,
      profile: profile,
      confidence: confidence,
      filledFields: profile ? PolicyMateMatcher.countFilledFields(profile) : 0,
      totalFields: 5,
      timestamp: Date.now()
    };
    writeJSON(KEYS.MATCH_RESULTS, data);
    // 同时单独存储 recommendations 以便单独读取
    writeJSON(KEYS.RECOMMENDATIONS, recommendations);
  }

  /** 获取最近一次匹配结果，无则返回 null */
  function getMatchResults() {
    return readJSON(KEYS.MATCH_RESULTS, null);
  }

  /** 获取最近一次推荐结果数组，无则返回空数组 */
  function getRecommendations() {
    return readJSON(KEYS.RECOMMENDATIONS, []);
  }

  /** 清除匹配结果与推荐结果 */
  function clearMatchResults() {
    localStorage.removeItem(KEYS.MATCH_RESULTS);
    localStorage.removeItem(KEYS.RECOMMENDATIONS);
  }

  // ============ A11y 适老化设置 ============

  /**
   * 获取适老化设置
   * @returns {{fontSize:string, highContrast:boolean, largeButton:boolean}}
   */
  function getA11y() {
    return readJSON(KEYS.A11Y, {
      fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
      highContrast: false,
      largeButton: false
    });
  }

  /**
   * 更新适老化设置（合并写入）
   * @param {Object} settings 待合并的字段
   * @returns {Object} 更新后的完整设置
   */
  function setA11y(settings) {
    const current = getA11y();
    const updated = Object.assign({}, current, settings);
    writeJSON(KEYS.A11Y, updated);
    return updated;
  }

  // ============ 对外暴露 API ============
  window.PolicyMateStore = {
    KEYS: KEYS,
    // Profiles
    getProfiles: getProfiles,
    saveProfile: saveProfile,
    getCurrentProfile: getCurrentProfile,
    setCurrentProfile: setCurrentProfile,
    deleteProfile: deleteProfile,
    // Favorites
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    // ListStatus
    getListStatus: getListStatus,
    setListStatus: setListStatus,
    getAllListStatus: getAllListStatus,
    // MatchResults
    saveMatchResults: saveMatchResults,
    getMatchResults: getMatchResults,
    getRecommendations: getRecommendations,
    clearMatchResults: clearMatchResults,
    // A11y
    getA11y: getA11y,
    setA11y: setA11y
  };
})();
