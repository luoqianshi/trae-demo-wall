// 标书协作平台 - 前端逻辑

import { basicSetup, EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorView as EV } from '@codemirror/view';

// —— 全局状态 ——
let currentEntryId = null;
let editor = null;
let saveTimer = null;
let isDirty = false;
let catalogData = null;

// —— DOM 元素 ——
const projectNameEl = document.getElementById('project-name');
const saveStatusEl = document.getElementById('save-status');
const treeContainer = document.getElementById('tree-container');
const breadcrumbEl = document.getElementById('breadcrumb');
const editorEl = document.getElementById('editor');
const noSelectionEl = document.getElementById('no-selection');
const exportBtn = document.getElementById('export-btn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const sidebarEl = document.getElementById('sidebar');

// —— 初始化 ——
init();

async function init() {
  await loadCatalog();
  bindEvents();
}

// —— 事件绑定 ——
function bindEvents() {
  exportBtn.addEventListener('click', handleExport);
  toggleSidebarBtn.addEventListener('click', () => {
    sidebarEl.classList.toggle('collapsed');
  });
}

// —— 加载目录 ——
async function loadCatalog() {
  try {
    const res = await fetch('/api/catalog');
    catalogData = await res.json();
    projectNameEl.textContent = catalogData.project.name || '标书项目';
    renderTree(catalogData.tree);
  } catch (e) {
    treeContainer.innerHTML = '<div class="tree-loading">目录加载失败，请检查 catalog.yaml</div>';
    console.error('加载目录失败:', e);
  }
}

// —— 渲染目录树 ——
function renderTree(nodes) {
  treeContainer.innerHTML = '';
  if (!nodes || nodes.length === 0) {
    treeContainer.innerHTML = '<div class="tree-loading">暂无目录数据，请运行 npm run init 初始化项目</div>';
    return;
  }
  const treeRoot = document.createElement('div');
  treeRoot.className = 'tree-node';
  for (const node of nodes) {
    treeRoot.appendChild(renderTreeNode(node, 0));
  }
  treeContainer.appendChild(treeRoot);
}

function renderTreeNode(node, depth) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-node';

  const item = document.createElement('div');
  item.className = 'tree-item';
  item.style.paddingLeft = `${12 + depth * 16}px`;
  item.textContent = node.title;
  item.dataset.id = node.id;

  const hasChildren = node.children && node.children.length > 0;
  if (hasChildren) {
    item.classList.add('has-children');
  } else {
    item.classList.add('no-children');
  }

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hasChildren) {
      item.classList.toggle('expanded');
      const next = wrapper.querySelector('.tree-children');
      if (next) next.classList.toggle('expanded');
    }
    selectNode(node.id);
  });

  wrapper.appendChild(item);

  if (hasChildren) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children expanded';
    item.classList.add('expanded');
    for (const child of node.children) {
      childrenContainer.appendChild(renderTreeNode(child, depth + 1));
    }
    wrapper.appendChild(childrenContainer);
  }

  return wrapper;
}

// —— 选择节点 ——
async function selectNode(id) {
  // 切换前保存未落盘内容
  if (isDirty && currentEntryId) {
    clearTimeout(saveTimer);
    await doSave();
  }

  // 更新目录树选中状态
  document.querySelectorAll('.tree-item.active').forEach((el) => el.classList.remove('active'));
  const activeItem = document.querySelector(`.tree-item[data-id="${id}"]`);
  if (activeItem) activeItem.classList.add('active');

  currentEntryId = id;
  await loadContent(id);
}

// —— 加载内容 ——
async function loadContent(id) {
  try {
    const res = await fetch(`/api/content/${id}`);
    if (!res.ok) {
      const err = await res.json();
      showNoSelection(`加载失败: ${err.error || '未知错误'}`);
      return;
    }
    const data = await res.json();

    // 渲染面包屑
    renderBreadcrumb(data.path);

    if (!data.file) {
      showNoSelection('该节点无关联文件');
      currentEntryId = null;
      return;
    }

    hideNoSelection();
    initEditor(data.content);
  } catch (e) {
    showNoSelection('内容加载失败');
    console.error(e);
  }
}

// —— 渲染面包屑 ——
function renderBreadcrumb(pathArr) {
  breadcrumbEl.innerHTML = '';
  if (!pathArr || pathArr.length === 0) {
    breadcrumbEl.textContent = '';
    return;
  }
  pathArr.forEach((p, i) => {
    const span = document.createElement('span');
    span.textContent = p;
    breadcrumbEl.appendChild(span);
    if (i < pathArr.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'crumb-sep';
      sep.textContent = '›';
      breadcrumbEl.appendChild(sep);
    }
  });
}

// —— 初始化编辑器 ——
function initEditor(doc) {
  // 销毁旧编辑器
  if (editor) {
    editor.destroy();
    editor = null;
  }

  editor = new EditorView({
    state: EditorState.create({
      doc: doc,
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            scheduleSave();
          }
        }),
      ],
    }),
    parent: editorEl,
  });
}

// —— 防抖保存（1 秒）——
function scheduleSave() {
  isDirty = true;
  setStatus('editing');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 1000);
}

async function doSave() {
  if (!currentEntryId || !editor) return;

  setStatus('saving');
  const content = editor.state.doc.toString();

  try {
    const res = await fetch(`/api/content/${currentEntryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus('error', `保存失败: ${err.error}`);
      return;
    }

    isDirty = false;
    setStatus('saved');
  } catch (e) {
    setStatus('error', '网络错误，保存失败');
    console.error('保存失败:', e);
  }
}

// —— 状态显示 ——
function setStatus(state, msg) {
  saveStatusEl.className = '';
  switch (state) {
    case 'saved':
      saveStatusEl.textContent = '已保存';
      saveStatusEl.classList.add('status-saved');
      break;
    case 'saving':
      saveStatusEl.textContent = '保存中...';
      saveStatusEl.classList.add('status-saving');
      break;
    case 'editing':
      saveStatusEl.textContent = '编辑中...';
      saveStatusEl.classList.add('status-editing');
      break;
    case 'error':
      saveStatusEl.textContent = msg || '保存失败';
      saveStatusEl.style.background = 'rgba(244, 67, 54, 0.2)';
      saveStatusEl.style.color = '#ef9a9a';
      break;
  }
}

// —— 导出 Word ——
async function handleExport() {
  // 先保存未落盘内容
  if (isDirty && currentEntryId) {
    clearTimeout(saveTimer);
    await doSave();
  }

  exportBtn.disabled = true;
  exportBtn.textContent = '导出中...';

  try {
    // 触发下载
    window.location.href = '/api/export';
  } catch (e) {
    alert('导出失败: ' + String(e));
  } finally {
    setTimeout(() => {
      exportBtn.disabled = false;
      exportBtn.textContent = '导出 Word';
    }, 2000);
  }
}

// —— 辅助函数 ——
function showNoSelection(msg) {
  noSelectionEl.innerHTML = `<p>${msg || '请从左侧目录选择一个章节'}</p>`;
  noSelectionEl.classList.remove('hidden');
  editorEl.style.display = 'none';
}

function hideNoSelection() {
  noSelectionEl.classList.add('hidden');
  editorEl.style.display = 'block';
}
