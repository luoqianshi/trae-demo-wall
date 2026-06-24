/**
 * Memory Loop i18n — Chinese / English
 */

const I18N = {
  en: {
    'logo.subtitle': 'Project Memory',
    'nav.memory': 'Memory',
    'nav.archive': 'Archive',
    'nav.schema': 'Schema',
    'nav.projects': 'Projects',
    'compress.btn': 'Compress',
    'stat.tokens': 'tokens',
    'stat.threshold': 'threshold',
    'theme.toggle': 'Toggle theme',
    'lang.toggle': 'Switch language',

    'project.none': 'No project',
    'project.open': 'Open Project',
    'project.noneYet': 'No Projects Yet',
    'project.openToTrack': 'Open a project folder to start tracking memory',
    'project.noMemory': 'No memory',

    'empty.noProject': 'No Project Open',
    'empty.openToView': 'Open a project to view its memory',
    'empty.browse': 'Browse Projects',
    'empty.memoryEmpty': 'Memory Empty',
    'empty.noSections': 'No sections found in MEMORY.md',

    'archive.search': 'Search archive...',
    'archive.empty': 'Archive Empty',
    'archive.emptyDesc': 'Compressed history will appear here',
    'archive.loadFail': 'Failed to load archive: ',
    'archive.noMatch': 'No matches',

    'schema.title': 'Memory Schema',
    'schema.desc': 'Define the structure of your project memory. Changes apply on next save.',
    'schema.reset': 'Reset to Default',
    'schema.save': 'Save Schema',
    'schema.saved': 'Schema saved',
    'schema.saveFail': 'Save failed: ',
    'schema.loadFail': 'Failed to load schema: ',
    'schema.confirmReset': 'Reset schema to default? This will overwrite your current schema.',
    'schema.resetDone': 'Schema reset to default. Click Save to apply.',
    'schema.resetFail': 'Could not load default schema',

    'browser.title': 'Browse Folder',
    'browser.cancel': 'Cancel',
    'browser.select': 'Select This Folder',
    'browser.parent': '.. (parent)',
    'browser.drives': 'All Drives',
    'browser.noFolders': 'No folders found',
    'browser.fail': 'Browse failed: ',
    'browser.fallback': 'Path not found, showing all drives instead',

    'card.edit': 'Edit',
    'card.save': 'Save',
    'card.compressible': 'compressible',
    'card.hot': 'hot',
    'card.chars': 'chars',
    'card.saved': 'Section saved',
    'card.saveFail': 'Save failed: ',

    'compress.needed': 'Compression needed: {cur} > {trigger} tokens. Trigger memory-compressor agent.',
    'compress.notNeeded': 'No compression needed: {cur} / {trigger} tokens',
    'compress.fail': 'Compression check failed: ',

    'project.openFail': 'Failed to open project: ',
    'project.loadFail': 'Failed to load projects: ',

    'time.justNow': 'just now',
    'time.mAgo': 'm ago',
    'time.hAgo': 'h ago',
    'time.dAgo': 'd ago',
  },

  zh: {
    'logo.subtitle': '项目记忆',
    'nav.memory': '记忆',
    'nav.archive': '归档',
    'nav.schema': 'Schema',
    'nav.projects': '项目',
    'compress.btn': '压缩',
    'stat.tokens': 'tokens',
    'stat.threshold': '阈值',
    'theme.toggle': '切换主题',
    'lang.toggle': '切换语言',

    'project.none': '未打开项目',
    'project.open': '打开项目',
    'project.noneYet': '暂无项目',
    'project.openToTrack': '打开一个项目文件夹以开始记录记忆',
    'project.noMemory': '无记忆',

    'empty.noProject': '未打开项目',
    'empty.openToView': '打开一个项目以查看其记忆',
    'empty.browse': '浏览项目',
    'empty.memoryEmpty': '记忆为空',
    'empty.noSections': 'MEMORY.md 中未找到任何 section',

    'archive.search': '搜索归档...',
    'archive.empty': '归档为空',
    'archive.emptyDesc': '压缩后的历史将显示在这里',
    'archive.loadFail': '加载归档失败：',
    'archive.noMatch': '无匹配',

    'schema.title': '记忆 Schema',
    'schema.desc': '定义项目记忆的结构。保存后生效。',
    'schema.reset': '恢复默认',
    'schema.save': '保存 Schema',
    'schema.saved': 'Schema 已保存',
    'schema.saveFail': '保存失败：',
    'schema.loadFail': '加载 Schema 失败：',
    'schema.confirmReset': '恢复默认 Schema？这将覆盖当前 Schema。',
    'schema.resetDone': 'Schema 已恢复默认。点击保存以应用。',
    'schema.resetFail': '无法加载默认 Schema',

    'browser.title': '浏览文件夹',
    'browser.cancel': '取消',
    'browser.select': '选择此文件夹',
    'browser.parent': '.. (上一级)',
    'browser.drives': '所有驱动器',
    'browser.noFolders': '未找到文件夹',
    'browser.fail': '浏览失败：',
    'browser.fallback': '路径不存在，已切换到所有驱动器视图',

    'card.edit': '编辑',
    'card.save': '保存',
    'card.compressible': '可压缩',
    'card.hot': '热层',
    'card.chars': '字符',
    'card.saved': '已保存',
    'card.saveFail': '保存失败：',

    'compress.needed': '需要压缩：{cur} > {trigger} tokens。请触发 memory-compressor agent。',
    'compress.notNeeded': '无需压缩：{cur} / {trigger} tokens',
    'compress.fail': '压缩检查失败：',

    'project.openFail': '打开项目失败：',
    'project.loadFail': '加载项目失败：',

    'time.justNow': '刚刚',
    'time.mAgo': '分钟前',
    'time.hAgo': '小时前',
    'time.dAgo': '天前',
  },
};

let currentLang = 'en';

function t(key, vars) {
  let str = (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en && I18N.en[key]) || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
    }
  }
  return str;
}

function applyTranslations() {
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // Attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Lang label shows the OTHER language (what you'll switch to)
  const label = document.getElementById('langLabel');
  if (label) label.textContent = currentLang === 'en' ? '中' : 'EN';
  // Update html lang
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

function initLang() {
  const saved = localStorage.getItem('memory-loop-lang');
  // Default to zh for Chinese users, detect browser language
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const defaultLang = saved || (browserLang.startsWith('zh') ? 'zh' : 'en');
  currentLang = defaultLang;
  applyTranslations();
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('memory-loop-lang', currentLang);
  applyTranslations();
  // Re-render current view to update dynamic text
  if (typeof refreshCurrentView === 'function') refreshCurrentView();
}
