// script.js - 今日剧本模块
// 24 段每段可填一行"此时该做什么",按日期分桶存 localStorage
// 默认值:康雍乾起居注节选 + 通用建议

const Script = (() => {
  // 与 timeline.js STAGES 一一对应,key = stage.id
  // 用户自填 = 优先生效;空 = 回退到 default
  const DEFAULTS = {
    'zi-chu':     { label: '夜半安寝', text: '就寝' },
    'zi-zheng':   { label: '夜半安寝', text: '就寝' },
    'chou-chu':   { label: '鸡鸣深眠', text: '深眠' },
    'chou-zheng': { label: '鸡鸣深眠', text: '深眠' },
    'yin-chu':    { label: '内侍备驾', text: '准备起身' },
    'yin-zheng':  { label: '御驾起身', text: '寅正 4 点起' },
    'mao-chu':    { label: '御书房早读', text: '早读经典' },
    'mao-zheng':  { label: '御书房早读', text: '御书房功课' },
    'chen-chu':   { label: '御膳早膳', text: '御膳早膳' },
    'chen-zheng': { label: '御膳早膳', text: '理政预备' },
    'si-chu':     { label: '御门听政', text: '御门听政' },
    'si-zheng':   { label: '御门听政', text: '批阅奏章' },
    'wu-chu':     { label: '午朝议事', text: '午朝议事' },
    'wu-zheng':   { label: '午膳休憩', text: '午膳休憩' },
    'wei-chu':    { label: '书房理政', text: '书房理政' },
    'wei-zheng':  { label: '书房理政', text: '书房理政' },
    'shen-chu':   { label: '御批奏章', text: '御批奏章' },
    'shen-zheng': { label: '御批奏章', text: '御批奏章' },
    'you-chu':    { label: '晚课静修', text: '晚课静修' },
    'you-zheng':  { label: '晚课静修', text: '晚课静修' },
    'xu-chu':     { label: '宫闱休闲', text: '宫闱休闲' },
    'xu-zheng':   { label: '宫闱休闲', text: '宫闱休闲' },
    'hai-chu':    { label: '安寝就寝', text: '准备就寝' },
    'hai-zheng':  { label: '安寝就寝', text: '安寝' }
  };

  function getDateKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getDefaults() { return DEFAULTS; }

  function getDefault(stageId) {
    const d = DEFAULTS[stageId];
    return d ? d.text : '';
  }

  // 读当日所有用户的自填文本(stageId → text),缺省空
  function _getTodayMap(date) {
    const key = getDateKey(date);
    const all = Storage.get(Storage.KEYS.SCRIPT, {}) || {};
    return all[key] || {};
  }

  function _writeTodayMap(map, date) {
    const key = getDateKey(date);
    const all = Storage.get(Storage.KEYS.SCRIPT, {}) || {};
    all[key] = map;
    Storage.set(Storage.KEYS.SCRIPT, all);
  }

  // 单段文本:用户自填优先,空则默认
  function getStageText(stageId, date) {
    const map = _getTodayMap(date);
    if (map[stageId] != null && String(map[stageId]).trim() !== '') {
      return String(map[stageId]);
    }
    return getDefault(stageId);
  }

  // 返回 24 段剧本快照:[{id, label, text, source:'user'|'default'}]
  function getToday(date) {
    const map = _getTodayMap(date);
    return Object.keys(DEFAULTS).map(id => {
      const d = DEFAULTS[id];
      const userText = map[id];
      const has = userText != null && String(userText).trim() !== '';
      return {
        id,
        label: d.label,
        text: has ? String(userText) : d.text,
        source: has ? 'user' : 'default'
      };
    });
  }

  function setStageText(stageId, text, date) {
    const map = _getTodayMap(date);
    const t = (text == null ? '' : String(text));
    if (t.trim() === '') {
      delete map[stageId]; // 空值 = 删除(回退到默认)
    } else {
      map[stageId] = t;
    }
    _writeTodayMap(map, date);
  }

  // 清空当日所有自填,恢复默认(同时清空合并状态)
  function restoreDefaults(date) {
    _writeTodayMap({}, date);
    _writeMergedMap({}, date);
  }

  // 统计自填率
  function getStats(date) {
    const map = _getTodayMap(date);
    const userCount = Object.keys(map).filter(k => map[k] != null && String(map[k]).trim() !== '').length;
    return { userCount, total: Object.keys(DEFAULTS).length };
  }

  // ====== 合并状态(merged groups)======
  // 存储: { dateKey: { 'primaryId': ['mergedId1', 'mergedId2', ...] } }
  // primaryId 是显示在时间轴/弹窗中的代表行;其它 id 都"被合并"到它里面
  function _getMergedMap(date) {
    const key = getDateKey(date);
    const all = Storage.get(Storage.KEYS.SCRIPT_MERGED, {}) || {};
    return all[key] || {};
  }

  function _writeMergedMap(map, date) {
    const key = getDateKey(date);
    const all = Storage.get(Storage.KEYS.SCRIPT_MERGED, {}) || {};
    all[key] = map;
    Storage.set(Storage.KEYS.SCRIPT_MERGED, all);
  }

  function getMergedGroups(date) {
    return _getMergedMap(date);
  }

  function setMergedGroups(groups, date) {
    _writeMergedMap(groups || {}, date);
  }

  // 给定 stageId,返回它所在的合并组(包括自己),{ primary, members:[] }
  // 若未被合并,返回 null
  function getGroupOf(stageId, date) {
    const groups = _getMergedMap(date);
    for (const primary in groups) {
      if (primary === stageId) return { primary, members: groups[primary] || [] };
      if ((groups[primary] || []).indexOf(stageId) >= 0) return { primary, members: groups[primary] || [] };
    }
    return null;
  }

  // 是否是合并组的主(primary)
  function isPrimary(stageId, date) {
    const g = getGroupOf(stageId, date);
    return g ? g.primary === stageId : true;
  }

  // 启动时验证 storage 可用
  function warmup() {
    try {
      const k = getDateKey();
      const all = Storage.get(Storage.KEYS.SCRIPT, {}) || {};
      if (!all[k]) {
        // 当日空,不动(让用户首次使用看到默认)
      }
      return true;
    } catch (e) {
      console.warn('Script.warmup 失败', e);
      return false;
    }
  }

  return {
    getDefaults,
    getDefault,
    getStageText,
    setStageText,
    getToday,
    restoreDefaults,
    getStats,
    getDateKey,
    getMergedGroups,
    setMergedGroups,
    getGroupOf,
    isPrimary,
    warmup
  };
})();
