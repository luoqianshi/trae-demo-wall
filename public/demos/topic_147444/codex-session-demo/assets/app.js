// App logic: rendering + interactions
// Uses mock data from data.js

(function() {
  'use strict';

  const { projects, sessions } = MOCK_DATA;

  // ===== State =====
  let activeProjects = new Set(projects.map(p => p.name)); // all selected by default
  let sortOrder = 'desc'; // 'desc' or 'asc'
  let activeSessionId = null;
  let searchQuery = '';

  // ===== Helpers =====
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  function debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function formatDate(dateStr) {
    return dateStr;
  }

  // ===== Stats =====
  function updateStats() {
    const filtered = getFilteredSessions();
    const projectsActive = activeProjects.size;
    const msgCount = filtered.reduce((sum, s) => sum + s.messageCount, 0);
    document.getElementById('projectCount').textContent = projectsActive;
    document.getElementById('sessionCount').textContent = filtered.length;
    document.getElementById('messageCount').textContent = msgCount;
  }

  // ===== Filtering =====
  function getFilteredSessions() {
    let result = sessions.filter(s => activeProjects.has(s.project));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        // Match in preview
        if (s.preview.toLowerCase().includes(q)) return true;
        // Match in any message content
        return s.messages.some(m => {
          if (m.content && m.content.toLowerCase().includes(q)) return true;
          if (m.tool && m.tool.toLowerCase().includes(q)) return true;
          if (m.input && String(m.input).toLowerCase().includes(q)) return true;
          if (m.file && m.file.toLowerCase().includes(q)) return true;
          return false;
        });
      });
    }

    // Sort
    result.sort((a, b) => {
      const ta = new Date(a.startTime.replace(' ', 'T')).getTime();
      const tb = new Date(b.startTime.replace(' ', 'T')).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    });

    return result;
  }

  // ===== Render: Projects =====
  function renderProjects() {
    const container = document.getElementById('projectList');
    container.innerHTML = projects.map(p => {
      const isActive = activeProjects.has(p.name);
      const count = sessions.filter(s => s.project === p.name).length;
      return `
        <div class="project-item ${isActive ? 'active' : ''}" data-project="${p.name}">
          <div class="project-checkbox">${isActive ? '✓' : ''}</div>
          <div class="project-name">${escapeHtml(p.name)}</div>
          <div class="project-count">${count}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.project-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.dataset.project;
        if (activeProjects.has(name)) {
          activeProjects.delete(name);
        } else {
          activeProjects.add(name);
        }
        render();
      });
    });
  }

  // ===== Render: Session List =====
  function renderSessions() {
    const container = document.getElementById('sessionList');
    const filtered = getFilteredSessions();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding: 2rem 1.25rem; text-align: center; color: var(--muted); font-size: 0.85rem;">
          没有匹配的 session
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => {
      const isActive = s.id === activeSessionId;
      const preview = highlight(s.preview, searchQuery);
      return `
        <div class="session-item ${isActive ? 'active' : ''}" data-session="${s.id}">
          <div class="session-meta">
            <span class="session-project">${escapeHtml(s.project)}</span>
            <span>${formatDate(s.startTime)}</span>
          </div>
          <div class="session-preview">${preview}</div>
          <div class="session-stats">
            <span class="session-stat">💬 ${s.messageCount}</span>
            <span class="session-stat">⚙️ ${s.toolCallCount}</span>
            <span class="session-stat">📝 ${s.fileChangeCount}</span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.session-item').forEach(el => {
      el.addEventListener('click', () => {
        activeSessionId = el.dataset.session;
        render();
        // Scroll detail to top
        document.getElementById('detailPanel').scrollTop = 0;
      });
    });
  }

  // ===== Render: Detail =====
  function renderDetail() {
    const container = document.getElementById('detailPanel');
    if (!activeSessionId) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <div>选择左侧的 session 查看对话详情</div>
        </div>
      `;
      return;
    }

    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;

    const messagesHtml = session.messages.map(m => {
      const avatar = m.role === 'user' ? 'U' : 'C';
      const contentHtml = renderMessageContent(m);
      return `
        <div class="message ${m.role}">
          <div class="avatar">${avatar}</div>
          <div class="message-body">${contentHtml}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-project">${escapeHtml(session.projectPath)}</div>
        <div class="detail-title">${highlight(session.preview, searchQuery)}</div>
        <div class="detail-meta">
          <span>🕒 ${formatDate(session.startTime)} → ${formatDate(session.endTime)}</span>
          <span>💬 ${session.messageCount} 条消息</span>
          <span>⚙️ ${session.toolCallCount} 次工具调用</span>
          <span>📝 ${session.fileChangeCount} 个文件改动</span>
        </div>
      </div>
      <div>${messagesHtml}</div>
    `;
  }

  function renderMessageContent(m) {
    if (m.type === 'text') {
      return `<p>${highlight(m.content, searchQuery)}</p>`;
    }
    if (m.type === 'code') {
      return `
        <p>${highlight(m.content.split('\n')[0], searchQuery)}</p>
        <div class="code-block">
          <span class="lang">${m.lang}</span>
          <pre style="margin:0; white-space:pre-wrap;">${escapeHtml(m.content)}</pre>
        </div>
      `;
    }
    if (m.type === 'tool_call') {
      return `
        <div class="tool-call">
          <div class="tool-call-label">⚙ ${m.tool}</div>
          <div class="tool-call-content">${highlight(m.input, searchQuery)}</div>
        </div>
      `;
    }
    if (m.type === 'file_change') {
      const diffLines = (m.diff || '').split('\n').map(line => {
        if (line.startsWith('+')) return `<span class="file-change-add">${escapeHtml(line)}</span>`;
        if (line.startsWith('-')) return `<span class="file-change-del">${escapeHtml(line)}</span>`;
        return escapeHtml(line);
      }).join('<br>');
      return `
        <div class="file-change">
          <div class="file-change-label">📝 ${escapeHtml(m.file)}</div>
          <div>${diffLines}</div>
        </div>
      `;
    }
    return '';
  }

  // ===== Render: All =====
  function render() {
    renderProjects();
    renderSessions();
    renderDetail();
    updateStats();
  }

  // ===== Search =====
  const handleSearch = debounce((query) => {
    searchQuery = query.trim();
    renderSessions();
    renderDetail();
    updateStats();
  }, 250);

  document.getElementById('searchInput').addEventListener('input', e => {
    handleSearch(e.target.value);
  });

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.target.value = '';
      searchQuery = '';
      renderSessions();
      renderDetail();
      updateStats();
    }
  });

  // ===== Sort =====
  document.getElementById('sortBtn').addEventListener('click', () => {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    document.getElementById('sortBtn').textContent = sortOrder === 'desc' ? '↓ 时间倒序' : '↑ 时间正序';
    renderSessions();
  });

  // ===== Init =====
  render();
})();
