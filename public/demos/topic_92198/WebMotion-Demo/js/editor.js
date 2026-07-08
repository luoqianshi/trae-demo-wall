/**
 * WebMotion - 编辑器管理模块
 * 负责代码编辑器的标签切换、内容管理和代码获取
 */
const Editor = (function() {
  let activeTab = 'js';
  const editors = {};

  function init() {
    // 获取所有 textarea
    editors.js = document.getElementById('code-js');
    editors.html = document.getElementById('code-html');
    editors.css = document.getElementById('code-css');

    // 标签切换
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Tab 键插入空格
    Object.values(editors).forEach(textarea => {
      if (textarea) textarea.addEventListener('keydown', handleTabKey);
    });

    // 加载默认模板
    loadTemplate(TEMPLATES[0]);
  }

  function handleTabKey(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 2;
    }
  }

  function switchTab(tabName) {
    activeTab = tabName;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.editor-wrap').forEach(w => {
      w.classList.remove('active');
    });
    const editorWrap = document.getElementById('editor-' + tabName);
    if (editorWrap) editorWrap.classList.add('active');
  }

  function getCode() {
    return {
      js: editors.js.value,
      html: editors.html.value,
      css: editors.css.value
    };
  }

  function setCode(code) {
    if (code.js !== undefined) editors.js.value = code.js;
    if (code.html !== undefined) editors.html.value = code.html;
    if (code.css !== undefined) editors.css.value = code.css;
  }

  function loadTemplate(template) {
    editors.js.value = template.js || '';
    editors.html.value = template.html || '';
    editors.css.value = template.css || '';
  }

  function getActiveTab() {
    return activeTab;
  }

  return {
    init,
    getCode,
    setCode,
    loadTemplate,
    switchTab,
    getActiveTab
  };
})();
