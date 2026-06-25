/**
 * Memory Loop Frontend
 */

const API = '';
let currentView = 'memory';
let memoryData = null;
let schemaData = null;
let browserPath = [];

// ===== API helpers =====
async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ===== Toast =====
function toast(message, type = '') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ===== View switching =====
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');
  document.getElementById('pageTitle').textContent = t('nav.' + view);

  if (view === 'memory') loadMemory();
  if (view === 'archive') loadArchive();
  if (view === 'schema') loadSchema();
  if (view === 'projects') loadProjects();
}

function refreshCurrentView() {
  if (currentView === 'memory') loadMemory();
  if (currentView === 'archive') loadArchive();
  if (currentView === 'schema') loadSchema();
  if (currentView === 'projects') loadProjects();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

// ===== Theme =====
function initTheme() {
  const saved = localStorage.getItem('memory-loop-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('memory-loop-theme', next);
});

// ===== Language toggle =====
document.getElementById('langToggle').addEventListener('click', toggleLang);

// ===== State =====
async function loadState() {
  try {
    const state = await api('/api/state');
    if (state.currentProject) {
      updateProjectBadge(state.currentProject);
    } else {
      updateProjectBadge(null);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
}

function updateProjectBadge(path) {
  const badge = document.getElementById('projectBadge');
  const name = document.getElementById('projectName');
  if (path) {
    badge.classList.remove('no-project');
    name.textContent = path.split(/[\\/]/).pop();
    name.title = path;
  } else {
    badge.classList.add('no-project');
    name.textContent = t('project.none');
  }
}

// ===== Memory View =====
async function loadMemory() {
  const grid = document.getElementById('memoryGrid');
  try {
    const data = await api('/api/memory');
    memoryData = data;
    renderMemory(data);
    updateStats(data.stats);
  } catch (e) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M4 4h16v16H4z M4 9h16 M9 4v16"/>
          </svg>
        </div>
        <h2>${t('empty.noProject')}</h2>
        <p>${escapeHtml(e.message)}</p>
        <button class="btn-primary" onclick="switchView('projects')">${t('empty.browse')}</button>
      </div>`;
  }
}

function renderMemory(data) {
  const grid = document.getElementById('memoryGrid');
  const sections = data.sections;
  const sectionNames = Object.keys(sections).filter(k => k !== '_header');

  if (sectionNames.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h2>${t('empty.memoryEmpty')}</h2>
        <p>${t('empty.noSections')}</p>
      </div>`;
    return;
  }

  grid.innerHTML = sectionNames.map(name => {
    const content = sections[name] || '';
    const isCompressible = schemaData?.parsed?.hot_layer?.sections?.find(s => s.name === name)?.compressible;
    const tag = isCompressible
      ? `<span class="card-tag compressible">${t('card.compressible')}</span>`
      : `<span class="card-tag hot">${t('card.hot')}</span>`;

    return `
      <div class="memory-card" data-section="${escapeAttr(name)}">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-icon"></div>
            ${escapeHtml(name)}
          </div>
          <div class="card-actions">
            <button class="card-action-btn" onclick="editSection('${escapeAttr(name)}')" title="${t('card.edit')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4v16h16v-7 M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>
              </svg>
            </button>
            <button class="card-action-btn" onclick="saveSection('${escapeAttr(name)}')" title="${t('card.save')}" style="display:none" data-save>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="card-content" data-content>${escapeHtml(content)}</div>
        <div class="card-meta">
          ${tag}
          <span>${content.length} ${t('card.chars')}</span>
        </div>
      </div>`;
  }).join('');
}

function editSection(name) {
  const card = document.querySelector(`.memory-card[data-section="${CSS.escape(name)}"]`);
  if (!card) return;
  const contentEl = card.querySelector('[data-content]');
  const editBtn = card.querySelector('.card-action-btn[title="' + t('card.edit') + '"]');
  const saveBtn = card.querySelector('[data-save]');

  card.classList.add('editing');
  contentEl.classList.add('editing');
  contentEl.setAttribute('contenteditable', 'true');
  contentEl.focus();
  if (editBtn) editBtn.style.display = 'none';
  if (saveBtn) saveBtn.style.display = 'flex';
}

async function saveSection(name) {
  const card = document.querySelector(`.memory-card[data-section="${CSS.escape(name)}"]`);
  if (!card) return;
  const contentEl = card.querySelector('[data-content]');

  const newContent = contentEl.innerText;

  if (!memoryData) return;
  const sections = { ...memoryData.sections };
  sections[name] = newContent;
  const rebuilt = rebuildMemoryMd(sections);
  memoryData.raw = rebuilt;

  try {
    const data = await api('/api/memory', {
      method: 'POST',
      body: JSON.stringify({ raw: rebuilt }),
    });
    memoryData.sections = data.sections;
    memoryData.stats = data.stats;
    renderMemory(memoryData);
    updateStats(data.stats);
    toast(t('card.saved'), 'success');
  } catch (e) {
    toast(t('card.saveFail') + e.message, 'error');
  }
}

function rebuildMemoryMd(sections) {
  let out = sections._header || '# Project Memory\n\n';
  for (const [name, content] of Object.entries(sections)) {
    if (name === '_header') continue;
    out += `\n## ${name}\n\n${content}\n`;
  }
  return out;
}

// ===== Stats =====
function updateStats(stats) {
  if (!stats) return;
  document.getElementById('tokenCount').textContent = stats.tokens.toLocaleString();
  const threshold = schemaData?.parsed?.compression?.trigger_tokens || 3000;
  document.getElementById('threshold').textContent = threshold.toLocaleString();
  const pct = Math.min(100, (stats.tokens / threshold) * 100);
  const fill = document.getElementById('statBarFill');
  fill.style.width = pct + '%';
  fill.className = 'stat-bar-fill';
  if (pct > 90) fill.classList.add('danger');
  else if (pct > 70) fill.classList.add('warning');
}

// ===== Archive View =====
async function loadArchive() {
  const el = document.getElementById('archiveContent');
  try {
    const data = await api('/api/archive');
    el.textContent = data.raw || '';
    if (!data.raw || data.raw.trim() === '# Archive' || data.raw.trim().length < 20) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M3 7h18 M5 7v13h14V7 M9 11h6"/>
            </svg>
          </div>
          <h2>${t('archive.empty')}</h2>
          <p>${t('archive.emptyDesc')}</p>
        </div>`;
    }
  } catch (e) {
    el.textContent = t('archive.loadFail') + e.message;
  }
}

document.getElementById('archiveSearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const content = document.getElementById('archiveContent');
  if (!query) {
    loadArchive();
    return;
  }
  const text = content.textContent;
  const lines = text.split('\n');
  const matched = lines.filter(l => l.toLowerCase().includes(query));
  content.innerHTML = matched.map(l => {
    const idx = l.toLowerCase().indexOf(query);
    return escapeHtml(l.substring(0, idx)) +
      '<mark style="background:var(--accent-light);color:var(--accent);padding:1px 2px;border-radius:2px">' +
      escapeHtml(l.substring(idx, idx + query.length)) + '</mark>' +
      escapeHtml(l.substring(idx + query.length));
  }).join('\n') || t('archive.noMatch');
});

// ===== Schema View =====
async function loadSchema() {
  try {
    const data = await api('/api/schema');
    schemaData = data;
    document.getElementById('schemaEditor').value = data.raw;
    updateStats(memoryData?.stats);
  } catch (e) {
    toast(t('schema.loadFail') + e.message, 'error');
  }
}

document.getElementById('saveSchemaBtn').addEventListener('click', async () => {
  const raw = document.getElementById('schemaEditor').value;
  try {
    const data = await api('/api/schema', {
      method: 'POST',
      body: JSON.stringify({ raw }),
    });
    schemaData = data;
    toast(t('schema.saved'), 'success');
    if (memoryData) updateStats(memoryData.stats);
  } catch (e) {
    toast(t('schema.saveFail') + e.message, 'error');
  }
});

document.getElementById('resetSchemaBtn').addEventListener('click', async () => {
  if (!confirm(t('schema.confirmReset'))) return;
  try {
    const res = await fetch('/templates/memory-schema.yaml');
    const raw = await res.text();
    document.getElementById('schemaEditor').value = raw;
    toast(t('schema.resetDone'), 'warning');
  } catch {
    toast(t('schema.resetFail'), 'error');
  }
});

// ===== Projects View =====
async function loadProjects() {
  const el = document.getElementById('recentProjects');
  try {
    const data = await api('/api/projects');
    if (!data.projects || data.projects.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M3 7h18 M5 7v13h14V7"/>
            </svg>
          </div>
          <h2>${t('project.noneYet')}</h2>
          <p>${t('project.openToTrack')}</p>
        </div>`;
      return;
    }
    el.innerHTML = data.projects.map(p => `
      <div class="project-card ${p.path === data.current ? 'active' : ''}" onclick="openProject('${escapeAttr(p.path)}')">
        <div class="project-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 7h18 M5 7v13h14V7 M9 11h6"/>
          </svg>
        </div>
        <div class="project-card-info">
          <div class="project-card-name">${escapeHtml(p.name)}</div>
          <div class="project-card-path">${escapeHtml(p.path)}</div>
        </div>
        <div class="project-card-stats">
          ${p.hasMemory
            ? `<span class="stat-pill has-memory">${p.stats?.tokens || 0} ${t('stat.tokens')}</span>`
            : `<span class="stat-pill">${t('project.noMemory')}</span>`}
          ${p.lastModified ? `<span>${formatDate(p.lastModified)}</span>` : ''}
        </div>
      </div>`).join('');
  } catch (e) {
    toast(t('project.loadFail') + e.message, 'error');
  }
}

async function openProject(path) {
  // Guard against invalid paths (DRIVES view, empty, etc.)
  if (!path || path === 'DRIVES' || path === '\\\\' || path.length < 3) {
    toast(t('project.openFail') + t('browser.noFolders'), 'error');
    return;
  }
  try {
    const data = await api('/api/project/open', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
    updateProjectBadge(path);
    toast(data.message, 'success');
    await loadSchema();
    await loadMemory();
    switchView('memory');
  } catch (e) {
    toast(t('project.openFail') + e.message, 'error');
  }
}

// ===== File Browser =====
document.getElementById('openProjectBtn').addEventListener('click', async () => {
  await browseTo('');
  document.getElementById('browserModal').classList.add('active');
});

async function browseTo(relPath) {
  try {
    const data = await api('/api/browse', {
      method: 'POST',
      body: JSON.stringify({ path: relPath || undefined }),
    });
    browserPath = data.path;
    // Display path: show friendly name for DRIVES view
    const pathDisplay = data.isDrivesView ? t('browser.drives') : data.path;
    document.getElementById('browserPath').textContent = pathDisplay;
    const list = document.getElementById('browserList');

    // Disable "Select This Folder" button in drives view (can't select drives as project)
    const selectBtn = document.getElementById('selectFolderBtn');
    if (data.isDrivesView) {
      selectBtn.disabled = true;
      selectBtn.style.opacity = '0.4';
      selectBtn.style.cursor = 'not-allowed';
    } else {
      selectBtn.disabled = false;
      selectBtn.style.opacity = '1';
      selectBtn.style.cursor = 'pointer';
    }

    // Show toast if this was a fallback
    if (data.fallback) {
      toast(t('browser.fallback'), 'warning');
    }

    let html = '';

    // Parent navigation
    if (data.isDrivesView) {
      // At drives view, no parent — this is the root
    } else if (data.isDriveRoot) {
      // At drive root (C:\), parent goes to DRIVES
      html += `<div class="browser-item up" onclick="browseTo('DRIVES')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5 M5 12l7-7 7 7"/></svg>
        <span>${t('browser.drives')}</span>
      </div>`;
    } else {
      // Normal directory — compute parent
      const sep = data.path.includes('\\') ? '\\' : '/';
      const parts = data.path.split(sep).filter(Boolean);
      const parentPath = parts.length > 1 ? data.path.substring(0, data.path.length - parts[parts.length - 1].length - 1) : data.path;
      if (data.path !== parentPath && data.path.length > 3) {
        html += `<div class="browser-item up" onclick="browseTo('${escapeAttr(parentPath)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5 M5 12l7-7 7 7"/></svg>
          <span>${t('browser.parent')}</span>
        </div>`;
      }
    }

    // Render entries
    html += data.entries
      .filter(e => e.isDirectory)
      .map(e => {
        const driveIcon = e.isDrive
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18 M5 7v13h14V7"/></svg>';
        return `
        <div class="browser-item folder ${e.hasMemory ? 'has-memory' : ''}" onclick="browseTo('${escapeAttr(e.path)}')">
          ${driveIcon}
          <span>${escapeHtml(e.name)}</span>
        </div>`;
      }).join('');

    list.innerHTML = html || `<div style="padding:20px;text-align:center;color:var(--text-tertiary)">${t('browser.noFolders')}</div>`;
  } catch (e) {
    toast(t('browser.fail') + e.message, 'error');
  }
}

document.getElementById('selectFolderBtn').addEventListener('click', () => {
  closeBrowser();
  openProject(browserPath);
});

function closeBrowser() {
  document.getElementById('browserModal').classList.remove('active');
}

// ===== Compress =====
document.getElementById('compressBtn').addEventListener('click', async () => {
  try {
    const data = await api('/api/compress', { method: 'POST' });
    if (data.needsCompression) {
      toast(t('compress.needed', { cur: data.currentTokens, trigger: data.triggerTokens }), 'warning');
    } else {
      toast(t('compress.notNeeded', { cur: data.currentTokens, trigger: data.triggerTokens }), 'success');
    }
  } catch (e) {
    toast(t('compress.fail') + e.message, 'error');
  }
});

// ===== Helpers =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(s) {
  return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return t('time.justNow');
  if (diff < 3600) return Math.floor(diff / 60) + t('time.mAgo');
  if (diff < 86400) return Math.floor(diff / 3600) + t('time.hAgo');
  if (diff < 604800) return Math.floor(diff / 86400) + t('time.dAgo');
  return date.toLocaleDateString();
}

// ===== Init =====
initTheme();
initLang();
loadState().then(() => {
  api('/api/state').then(state => {
    if (state.currentProject) {
      loadSchema().then(() => loadMemory());
    }
  });
});
