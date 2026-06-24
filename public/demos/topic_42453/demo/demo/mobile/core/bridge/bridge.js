/* =========================================================================
 * 「知行」App 本体 Demo —— 跨 tab 闭环数据桥（bridge.js）
 * -------------------------------------------------------------------------
 * 目的：让 5 个 tab 不再是孤岛，形成真实数据联动的闭环
 * 闭环路径：笔记本→发布→广场(置顶)→关注作者→好友(出现)→个人(我的创作)→回编辑器
 * 设计：
 *   · published  —— 已发布笔记（publish 写入；square 置顶读取；profile 创作读取）
 *   · following  —— 关注的作者 id（square follow 写入；friends 伙伴列表读取）
 *   · switchTab  —— 跨 tab 跳转（复制 shell route 逻辑，避免改 shell.js）
 *   · 事件系统   —— 各 tab 订阅 'publish'/'follow' 事件，实时刷新
 * 数据格式：published 笔记与 ZX_MOCK.notes 兼容，可直接喂给 square 的 renderXhsCard
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 运行时状态 ----------------------------- */
  var published = [];     /* [{id, title, summary, authorId:'u-me', stream, tags, likes, debates, _bridge}] */
  var following = [];     /* [authorId] */
  var listeners = {};     /* {event: [fn]} */

  /* ---- 笔记本域状态（Phase 0 新增：notes / tasks / convos） ----
   * notes：编辑器 autosave 写、总览读、新建笔记 unshift
   * tasks：notebook TASKS 搬迁，可增删改状态（懒加载，首次 getTasks 从 notebook 拉取）
   * convos：{id, kind:'main'|'task'|'sub', title, msgs:[], agentId?}
   */
  var notes = [];
  var tasks = null;
  var convos = {};
  var portfolios = [];   /* 工作区皆文件：作品集 */
  var notebooks = [];    /* 工作区皆文件：笔记本 */
  var files = [];        /* 统一文件模型：note/template/workflow/code/plugin（运行时写入） */

  /* ----------------------------- 内部工具 ----------------------------- */
  function nowLabel() {
    var d = new Date();
    return '刚刚';
  }

  /* ----------------------------- 发布（写） ----------------------------- */
  function publish(noteData) {
    noteData = noteData || {};
    var n = {
      id: 'br-' + Date.now(),
      title: noteData.title || '无标题笔记',
      summary: noteData.excerpt || noteData.summary || '我刚发布的笔记，欢迎讨论。',
      authorId: 'u-me',
      stream: noteData.stream || 'knowledge',
      tags: noteData.tags && noteData.tags.length ? noteData.tags : ['我的发布'],
      likes: noteData.likes != null ? noteData.likes : 3,
      /* 给一点初始讨论数据，让广场卡片不显得空 */
      debates: noteData.debates || [
        { stance: 'pro', count: 2 },
        { stance: 'con', count: 1 }
      ],
      time: nowLabel(),
      template: noteData.template || 'doc',
      visibility: noteData.visibility || 'public',
      _bridge: true
    };
    published.unshift(n);
    emit('publish', n);
    return n;
  }

  function getPublishedNotes() { return published.slice(); }

  function getNoteById(id) {
    for (var i = 0; i < published.length; i++) { if (published[i].id === id) return published[i]; }
    return null;
  }

  /* ----------------------------- 关注（写） ----------------------------- */
  function follow(authorId) {
    if (!authorId || following.indexOf(authorId) >= 0) return false;
    following.push(authorId);
    emit('follow', authorId);
    return true;
  }
  function unfollow(authorId) {
    var i = following.indexOf(authorId);
    if (i < 0) return false;
    following.splice(i, 1);
    emit('unfollow', authorId);
    return true;
  }
  function isFollowing(authorId) { return following.indexOf(authorId) >= 0; }
  function getFollowingIds() { return following.slice(); }

  /* ----------------------------- tab 切换（复制 shell route） ----------------------------- */
  function switchTab(name) {
    var tabs = document.querySelectorAll('.zx-tab');
    var pages = document.querySelectorAll('.zx-page');
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    pages.forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-page') === name);
    });
    /* 与 shell.js route 对齐：派发 zx-tab-active 事件让各 tab 刷新 */
    try { window.dispatchEvent(new CustomEvent('zx-tab-active', { detail: { tab: name } })); } catch (e) {}
  }

  /* ----------------------------- 用编辑器打开笔记（闭环终点） -----------------------------
   * 个人页"我的创作"点击 → 切 notebook tab → 开编辑器加载该笔记
   */
  function openNoteInEditor(noteId) {
    var n = getNoteById(noteId);
    switchTab('notebook');
    setTimeout(function () {
      if (window.ZX_OVERVIEW && window.ZX_OVERVIEW.isOpen && window.ZX_OVERVIEW.isOpen()) {
        window.ZX_OVERVIEW.close();
      }
      if (window.ZX_EDITOR) {
        window.ZX_EDITOR.open(n ? (n.template || 'doc') : 'doc', {
          noteId: noteId,
          title: n ? n.title : '我的笔记'
        });
      }
    }, 140);
  }

  /* ----------------------------- 事件系统 ----------------------------- */
  function on(event, fn) {
    (listeners[event] = listeners[event] || []).push(fn);
  }
  function off(event, fn) {
    var arr = listeners[event];
    if (!arr) return;
    if (!fn) { listeners[event] = []; return; }
    var i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  }
  function emit(event, data) {
    (listeners[event] || []).forEach(function (fn) {
      try { fn(data); } catch (e) { /* 静默，避免一个 tab 的错影响其它 */ }
    });
  }

  /* ----------------------------- 笔记本域状态（notes）API ----------------------------- */
  function getNotes() { return notes.slice(); }

  /* getNoteById：内部调 getFileById，返回时把 content.* 展开到顶层（兼容旧代码读 note.spec） */
  function getNoteById(id) {
    var n = getFileById(id);
    if (!n) return null;
    /* 兼容：把 content.* 展开到顶层（旧代码读 note.spec / note.body 等） */
    if (n.content && (n.type === 'note' || !n.type)) {
      if (n.content.spec != null && n.spec == null) n.spec = n.content.spec;
      if (n.content.refs != null && n.refs == null) n.refs = n.content.refs;
      if (n.content.aiCo != null && n.aiCo == null) n.aiCo = n.content.aiCo;
      if (n.content.body != null && n.body == null) n.body = n.content.body;
      if (n.content.blocks != null && n.blocks == null) n.blocks = n.content.blocks;
      if (n.content.outline != null && n.outline == null) n.outline = n.content.outline;
      if (n.content.template != null && n.template == null) n.template = n.content.template;
    }
    /* name → title 兼容 */
    if (n.name != null && n.title == null) n.title = n.name;
    return n;
  }

  function newVersion(at, aiCo, snippet) {
    return { v: 0, at: at || '刚刚', aiCo: !!aiCo, snippet: snippet || '' };
  }

  /* upsertFile：统一写入；若传旧 note 字段（如 {id,title,spec,notebookId}）自动包装为 type='note' 的 File */
  function upsertFile(file) {
    file = file || {};
    /* 自动检测 type：无 type 视为 note（兼容旧 upsertNote 调用） */
    if (!file.type) file.type = 'note';

    /* 非笔记类型：直接 upsert 到 files 数组 */
    if (file.type !== 'note') {
      var fid = file.id || ('f-' + Date.now());
      var fExisting = null;
      for (var fi = 0; fi < files.length; fi++) { if (files[fi].id === fid) { fExisting = files[fi]; break; } }
      if (fExisting) {
        fExisting.name = file.name != null ? file.name : fExisting.name;
        fExisting.content = file.content || fExisting.content;
        fExisting.path = file.path || fExisting.path;
        fExisting.notebookId = file.notebookId || fExisting.notebookId;
        fExisting.updatedAt = '刚刚';
        return fExisting;
      }
      var fEntry = {
        id: fid,
        name: file.name || '未命名文件',
        type: file.type,
        path: file.path || '',
        content: file.content || {},
        notebookId: file.notebookId || 'nb-default',
        updatedAt: '刚刚'
      };
      files.push(fEntry);
      emit('file-upsert', fEntry);
      return fEntry;
    }

    /* note 路径：保留原 upsertNote 逻辑（版本跟踪等）+ 同步统一 File 字段 */
    var id = file.id || ('n-' + Date.now());
    var existing = getNoteById(id);
    var snippet = (file.body ? String(file.body).replace(/<[^>]+>/g, '').slice(0, 40) : '') ||
                  (file.blocks && file.blocks.length ? file.blocks[0].text.slice(0, 40) : '') ||
                  (file.outline ? file.outline.text.slice(0, 40) : '') || '';
    var ver = newVersion('刚刚', file.aiCo, snippet);
    if (existing) {
      ver.v = (existing.versions ? existing.versions.length : 0) + 1;
      existing.title = file.title != null ? file.title : existing.title;
      existing.template = file.template || existing.template;
      existing.body = file.body != null ? file.body : existing.body;
      existing.blocks = file.blocks || existing.blocks;
      existing.links = file.links || existing.links;
      existing.outline = file.outline || existing.outline;
      existing.notebookId = file.notebookId || existing.notebookId || 'nb-default';
      existing.spec = file.spec || existing.spec;
      existing.refs = file.refs || existing.refs;
      existing.modified = '刚刚';
      existing.aiCo = file.aiCo || existing.aiCo;
      existing.versions = existing.versions || [];
      existing.versions.unshift(ver);
      /* 同步统一 File 字段 */
      existing.name = existing.title;
      existing.type = 'note';
      existing.content = {
        spec: existing.spec,
        refs: existing.refs || [],
        aiCo: existing.aiCo || false,
        body: existing.body,
        blocks: existing.blocks,
        outline: existing.outline,
        template: existing.template
      };
      existing.updatedAt = '刚刚';
      return existing;
    }
    ver.v = 1;
    var n = {
      id: id,
      title: file.title || '无标题笔记',
      template: file.template || 'doc',
      notebookId: file.notebookId || 'nb-default',
      spec: file.spec || null,
      refs: file.refs || [],
      body: file.body || '',
      blocks: file.blocks || [],
      links: file.links || [],
      outline: file.outline || null,
      modified: '刚刚',
      aiCo: !!file.aiCo,
      versions: [ver]
    };
    /* 统一 File 字段 */
    n.name = n.title;
    n.type = 'note';
    n.content = {
      spec: n.spec,
      refs: n.refs,
      aiCo: n.aiCo,
      body: n.body,
      blocks: n.blocks,
      outline: n.outline,
      template: n.template
    };
    n.updatedAt = '刚刚';
    notes.unshift(n);
    /* 同步到 files（去重） */
    var exists = false;
    for (var ei = 0; ei < files.length; ei++) { if (files[ei].id === n.id) { exists = true; break; } }
    if (!exists) files.push(n);
    emit('note-upsert', n);
    return n;
  }

  /* upsertNote：兼容包装 → upsertFile */
  function upsertNote(note) {
    return upsertFile(note);
  }

  function addVersion(id, meta) {
    var n = getNoteById(id);
    if (!n) return null;
    var ver = newVersion(meta && meta.at, meta && meta.aiCo, meta && meta.snippet);
    ver.v = (n.versions ? n.versions.length : 0) + 1;
    n.versions = n.versions || [];
    n.versions.unshift(ver);
    return ver;
  }

  /* ----------------------------- 笔记本域状态（tasks）API ----------------------------- */
  function getTasks() {
    if (tasks) return tasks;
    /* 懒加载：首次访问时从 notebook 拉取（notebook init 前为空，由 notebook 主动 setTasks） */
    if (window.ZX && typeof window.ZX.exportTasks === 'function') {
      tasks = window.ZX.exportTasks();
    } else {
      tasks = { doing: [], todo: [], done: [] };
    }
    return tasks;
  }
  function setTasks(obj) { tasks = obj; emit('tasks-change', tasks); }
  function moveTask(id, fromCol, toCol) {
    if (!tasks || !tasks[fromCol] || !tasks[toCol]) return false;
    var idx = -1, t = null;
    for (var i = 0; i < tasks[fromCol].length; i++) { if (tasks[fromCol][i].id === id) { idx = i; t = tasks[fromCol][i]; break; } }
    if (idx < 0) return false;
    tasks[fromCol].splice(idx, 1);
    tasks[toCol].unshift(t);
    emit('tasks-change', tasks);
    return true;
  }
  function updateTask(id, patch) {
    if (!tasks) return false;
    var keys = ['doing', 'todo', 'done'];
    for (var k = 0; k < keys.length; k++) {
      var arr = tasks[keys[k]];
      for (var i = 0; i < arr.length; i++) { if (arr[i].id === id) { for (var p in patch) arr[i][p] = patch[p]; emit('tasks-change', tasks); return true; } }
    }
    return false;
  }

  /* ----------------------------- 笔记本域状态（convos）API ----------------------------- */
  function getConvo(id) { return convos[id] || null; }
  function putConvo(id, convo) { convos[id] = convo; emit('convo-change', convo); return convo; }
  function listConvos(filter) {
    var arr = [];
    for (var k in convos) { if (convos.hasOwnProperty(k)) { if (!filter || convos[k].kind === filter.kind) arr.push(convos[k]); } }
    return arr;
  }

  /* ----------------------------- 工作区皆文件 API ----------------------------- */
  function getPortfolios() { return portfolios.slice(); }

  function getNotebooks(portfolioId) {
    if (!portfolioId) return notebooks.slice();
    return notebooks.filter(function (nb) { return nb.portfolioId === portfolioId; });
  }

  /* ----------------------------- 统一文件模型 API ----------------------------- */
  /* getFileById：按 id 查任何类型的文件（含 notes/published 兜底） */
  function getFileById(id) {
    var i;
    for (i = 0; i < files.length; i++) { if (files[i].id === id) return files[i]; }
    if (window.ZX_MOCK && window.ZX_MOCK.files) {
      for (i = 0; i < window.ZX_MOCK.files.length; i++) { if (window.ZX_MOCK.files[i].id === id) return window.ZX_MOCK.files[i]; }
    }
    /* 兼容：运行时 notes（可能未同步到 files） */
    for (i = 0; i < notes.length; i++) { if (notes[i].id === id) return notes[i]; }
    /* 兼容：published */
    for (i = 0; i < published.length; i++) { if (published[i].id === id) return published[i]; }
    return null;
  }

  /* getFilesByNotebook：返回笔记本下的文件，type 可选过滤 */
  function getFilesByNotebook(nbId, type) {
    var result = [];
    var seen = {};
    var i, f, n;
    /* 运行时 files */
    for (i = 0; i < files.length; i++) {
      f = files[i];
      if (seen[f.id]) continue;
      if ((f.notebookId || 'nb-default') !== nbId) continue;
      if (type && f.type !== type) continue;
      seen[f.id] = 1;
      result.push(f);
    }
    /* 运行时 notes（兼容，视为 type='note'） */
    if (!type || type === 'note') {
      for (i = 0; i < notes.length; i++) {
        n = notes[i];
        if (seen[n.id]) continue;
        if ((n.notebookId || 'nb-default') !== nbId) continue;
        seen[n.id] = 1;
        result.push(n);
      }
    }
    /* ZX_MOCK.files（含迁移后的 notes + 各类型示例） */
    if (window.ZX_MOCK && window.ZX_MOCK.files) {
      for (i = 0; i < window.ZX_MOCK.files.length; i++) {
        f = window.ZX_MOCK.files[i];
        if (seen[f.id]) continue;
        if ((f.notebookId || 'nb-default') !== nbId) continue;
        if (type && f.type !== type) continue;
        seen[f.id] = 1;
        result.push(f);
      }
    }
    return result;
  }

  /* getFilesByType：全局按类型过滤 */
  function getFilesByType(type) {
    var result = [];
    var seen = {};
    var i, f;
    for (i = 0; i < files.length; i++) {
      f = files[i];
      if (!seen[f.id] && f.type === type) { seen[f.id] = 1; result.push(f); }
    }
    if (window.ZX_MOCK && window.ZX_MOCK.files) {
      for (i = 0; i < window.ZX_MOCK.files.length; i++) {
        f = window.ZX_MOCK.files[i];
        if (!seen[f.id] && f.type === type) { seen[f.id] = 1; result.push(f); }
      }
    }
    /* 兼容：运行时 notes 视为 type='note' */
    if (type === 'note') {
      for (i = 0; i < notes.length; i++) {
        if (!seen[notes[i].id]) { seen[notes[i].id] = 1; result.push(notes[i]); }
      }
    }
    return result;
  }

  /* getTemplateFiles：返回指定笔记本（或全局）下的 template 文件 */
  function getTemplateFiles(nbId) {
    if (nbId) return getFilesByNotebook(nbId, 'template');
    return getFilesByType('template');
  }

  /* getNotesByNotebook：兼容别名 → getFilesByNotebook(nbId, 'note') */
  function getNotesByNotebook(nbId) {
    return getFilesByNotebook(nbId, 'note');
  }

  function upsertNotebook(nb) {
    nb = nb || {};
    var id = nb.id || ('nb-' + Date.now());
    for (var i = 0; i < notebooks.length; i++) {
      if (notebooks[i].id === id) {
        notebooks[i].name = nb.name || notebooks[i].name;
        notebooks[i].portfolioId = nb.portfolioId || notebooks[i].portfolioId;
        return notebooks[i];
      }
    }
    var entry = { id: id, name: nb.name || '未命名笔记本', portfolioId: nb.portfolioId || 'p-default' };
    notebooks.push(entry);
    emit('notebook-upsert', entry);
    return entry;
  }

  function upsertPortfolio(p) {
    p = p || {};
    var id = p.id || ('p-' + Date.now());
    for (var i = 0; i < portfolios.length; i++) {
      if (portfolios[i].id === id) {
        portfolios[i].name = p.name || portfolios[i].name;
        return portfolios[i];
      }
    }
    var entry = { id: id, name: p.name || '未命名作品集' };
    portfolios.push(entry);
    emit('portfolio-upsert', entry);
    return entry;
  }

  function refNote(noteId, refBy) {
    var n = getNoteById(noteId);
    if (!n) return null;
    n.refs = n.refs || [];
    var entry = { by: refBy || 'unknown', at: nowLabel() };
    n.refs.push(entry);
    return entry;
  }

  /* 删除：笔记本删除后，其下笔记归到默认笔记本（不丢失） */
  function deletePortfolio(id) {
    if (portfolios.length <= 1) return false;
    /* 先把该作品集下的笔记本迁到第一个保留的作品集 */
    var keepId = null;
    for (var i = 0; i < portfolios.length; i++) { if (portfolios[i].id !== id) { keepId = portfolios[i].id; break; } }
    for (var j = 0; j < notebooks.length; j++) { if (notebooks[j].portfolioId === id) notebooks[j].portfolioId = keepId; }
    portfolios = portfolios.filter(function (p) { return p.id !== id; });
    emit('portfolio-delete', id);
    return true;
  }

  function deleteNotebook(id) {
    notebooks = notebooks.filter(function (nb) { return nb.id !== id; });
    /* 其下文件归到默认笔记本 */
    var i;
    for (i = 0; i < notes.length; i++) { if ((notes[i].notebookId || 'nb-default') === id) notes[i].notebookId = 'nb-default'; }
    for (i = 0; i < files.length; i++) { if ((files[i].notebookId || 'nb-default') === id) files[i].notebookId = 'nb-default'; }
    if (window.ZX_MOCK && window.ZX_MOCK.notes) {
      for (i = 0; i < window.ZX_MOCK.notes.length; i++) { if ((window.ZX_MOCK.notes[i].notebookId || 'nb-default') === id) window.ZX_MOCK.notes[i].notebookId = 'nb-default'; }
    }
    if (window.ZX_MOCK && window.ZX_MOCK.files) {
      for (i = 0; i < window.ZX_MOCK.files.length; i++) { if ((window.ZX_MOCK.files[i].notebookId || 'nb-default') === id) window.ZX_MOCK.files[i].notebookId = 'nb-default'; }
    }
    emit('notebook-delete', id);
    return true;
  }

  /* ----------------------------- 笔记本域 seed -----------------------------
   * 说明：曾在广场 feed 置顶预置一条"我"的假发布（br-seed-1），但这会让广场
   * 开箱就显示自己的笔记、且点进详情因 noteById 查不到而卡死。已移除该假发布。
   * 真实发布流程（publish tab commit）仍会写入 published 并在广场置顶显示。
   * 此处仅保留笔记本域 seed（让总览"最近笔记"开箱有内容）。
   */
  function seed() {
    /* 工作区皆文件：从 ZX_MOCK 拉取 portfolios / notebooks */
    if (window.ZX_MOCK) {
      if (window.ZX_MOCK.portfolios) {
        window.ZX_MOCK.portfolios.forEach(function (p) {
          if (!portfolios.some(function (x) { return x.id === p.id; })) portfolios.push(p);
        });
      }
      if (window.ZX_MOCK.notebooks) {
        window.ZX_MOCK.notebooks.forEach(function (nb) {
          if (!notebooks.some(function (x) { return x.id === nb.id; })) notebooks.push(nb);
        });
      }
    }
    /* 冷启动兜底：portfolios 为空时自动建默认作品集 + 默认笔记本 */
    if (portfolios.length === 0) {
      portfolios.push({ id: 'p-default', name: '我的作品集', isDefault: true });
      if (!notebooks.some(function (nb) { return nb.id === 'nb-default'; })) {
        notebooks.push({ id: 'nb-default', name: '随笔', portfolioId: 'p-default', isDefault: true });
      }
    }

    /* 预置分区：我的小程序 / 我的工作流 / 我的Skills */
    if (!portfolios.some(function (p) { return p.id === 'p-miniapp'; })) {
      portfolios.push({ id: 'p-miniapp', name: '我的小程序', icon: '🧩' });
      notebooks.push({ id: 'nb-miniapp', name: '已构建', portfolioId: 'p-miniapp' });
      files.push({ id: 'ma1', type: 'miniapp', name: '习惯打卡', notebookId: 'nb-miniapp',
        content: { template: 'habit-tracker', components: ['容器', '标题栏', '习惯卡片', '打卡按钮', '统计条'], builtAt: '昨天' } });
      files.push({ id: 'ma2', type: 'miniapp', name: '读书清单', notebookId: 'nb-miniapp',
        content: { template: 'reading-list', components: ['容器', '标题栏', '书籍列表', '进度条'], builtAt: '3 天前' } });
    }
    if (!portfolios.some(function (p) { return p.id === 'p-workflow'; })) {
      portfolios.push({ id: 'p-workflow', name: '我的工作流', icon: '⚡' });
      notebooks.push({ id: 'nb-workflow', name: '已配置', portfolioId: 'p-workflow' });
      files.push({ id: 'wf1', type: 'workflow', name: '论文精读流水线', notebookId: 'nb-workflow',
        content: { steps: [{ name: '检索' }, { name: '精读' }, { name: '卡片' }, { name: '归档' }, { name: '复盘' }], agents: 4, status: 'active' } });
      files.push({ id: 'wf2', type: 'workflow', name: '周报自动生成', notebookId: 'nb-workflow',
        content: { steps: [{ name: '收集' }, { name: '归纳' }, { name: '生成' }], agents: 2, status: 'active' } });
    }
    if (!portfolios.some(function (p) { return p.id === 'p-skills'; })) {
      portfolios.push({ id: 'p-skills', name: '我的Skills', icon: '🛠' });
      notebooks.push({ id: 'nb-skills', name: '已安装', portfolioId: 'p-skills' });
      files.push({ id: 'sk1', type: 'skill', name: '论文检索技能', notebookId: 'nb-skills',
        content: { version: '1.2.0', capabilities: ['search', 'cite'] } });
      files.push({ id: 'sk2', type: 'skill', name: '图表生成技能', notebookId: 'nb-skills',
        content: { version: '2.0.1', capabilities: ['bar', 'line', 'pie'] } });
    }

    if (published.length === 0) {
      /* 不再预置假发布数据；广场开箱只展示社区 feed */
    }
    /* 笔记本域 seed：与 note-overview 的 n1/n2 对齐，让总览"最近笔记"开箱有内容 */
    if (notes.length === 0) {
      var n1 = {
        id: 'n1', title: '硫化物 5 大优势', template: 'doc',
        body: '<p>硫化物电解质具备高室温电导率（10⁻³ S/cm 级），是当前全固态路线的有力候选。</p><p>五大优势：① 高电导率 ② 可塑性好 ③ 低温优 ④ 与锂兼容可改善 ⑤ 易薄膜化。</p>',
        blocks: [], links: [], outline: null,
        notebookId: 'nb-research',
        modified: '2h 前', aiCo: false,
        versions: [{ v: 3, at: '2h 前', aiCo: true, snippet: '硫化物电解质具备高室温电导率…' }, { v: 2, at: '昨天', aiCo: false, snippet: '补充低温性能' }, { v: 1, at: '3 天前', aiCo: false, snippet: '新建笔记' }]
      };
      var n2 = {
        id: 'n2', title: '界面阻抗分析', template: 'outline',
        body: '', blocks: [], links: [],
        outline: { id: 'o0', type: 'opinion', text: '界面阻抗是核心瓶颈', collapsed: false, children: [] },
        notebookId: 'nb-research',
        modified: '昨天', aiCo: true,
        versions: [{ v: 5, at: '昨天', aiCo: true, snippet: '加入四电极复测结论' }, { v: 4, at: '2 天前', aiCo: false, snippet: '修正阻抗数值' }]
      };
      /* 迁移旧字段 → spec 块树（演示 migrateLegacyNote） */
      if (window.ZX && typeof window.ZX.migrateLegacyNote === 'function') {
        window.ZX.migrateLegacyNote(n1);
        window.ZX.migrateLegacyNote(n2);
      }
      notes.push(n1);
      notes.push(n2);
      /* 同步统一 File 字段并 push 到 files（让 getFilesByNotebook 能查到） */
      [n1, n2].forEach(function (n) {
        n.name = n.title;
        n.type = 'note';
        n.content = {
          spec: n.spec, refs: n.refs || [], aiCo: n.aiCo || false,
          body: n.body, blocks: n.blocks, outline: n.outline, template: n.template
        };
        n.updatedAt = n.modified || '刚刚';
        files.push(n);
      });
    }
  }
  seed();

  /* ----------------------------- 导出 ----------------------------- */
  window.ZX_BRIDGE = {
    publish: publish,
    getPublishedNotes: getPublishedNotes,
    getNoteById: getNoteById,
    follow: follow,
    unfollow: unfollow,
    isFollowing: isFollowing,
    getFollowingIds: getFollowingIds,
    switchTab: switchTab,
    openNoteInEditor: openNoteInEditor,
    on: on,
    off: off,
    /* 笔记本域（Phase 0） */
    getNotes: getNotes,
    upsertNote: upsertNote,
    addVersion: addVersion,
    getTasks: getTasks,
    setTasks: setTasks,
    moveTask: moveTask,
    updateTask: updateTask,
    getConvo: getConvo,
    putConvo: putConvo,
    listConvos: listConvos,
    /* 工作区皆文件 */
    getPortfolios: getPortfolios,
    getNotebooks: getNotebooks,
    getNotesByNotebook: getNotesByNotebook,
    upsertNotebook: upsertNotebook,
    upsertPortfolio: upsertPortfolio,
    deleteNotebook: deleteNotebook,
    deletePortfolio: deletePortfolio,
    refNote: refNote,
    /* 统一文件模型 API（workspace-unified-files） */
    getFileById: getFileById,
    getFilesByNotebook: getFilesByNotebook,
    getFilesByType: getFilesByType,
    getTemplateFiles: getTemplateFiles,
    upsertFile: upsertFile
  };
})();
