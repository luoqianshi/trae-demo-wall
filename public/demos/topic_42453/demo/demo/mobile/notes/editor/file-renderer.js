/* =========================================================================
 * 「知行」App 本体 Demo —— 统一文件多渲染器（file-renderer.js）
 * -------------------------------------------------------------------------
 * 对应 spec：workspace-unified-files / Task 2 多渲染器
 * 作用：按 File.type 分发到对应渲染器，返回完整 HTML 字符串
 * 挂载：window.ZX_FILE（renderFile / highlightCode / 各类型渲染器）
 * 依赖：
 *   · window.ZX_EDITOR.BlockRenderer.renderSpec —— 复用块树渲染（note/template）
 *   · window.ZX_MOCK / window.ZX_BRIDGE —— 数据解析（可选）
 * 风格：纯 JS IIFE，与 note-editor.js 保持一致；不引入外部高亮库
 * XSS 防护：highlightCode 先转义 HTML（< > & " '）再做正则高亮替换
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function escapeAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

  /* 文件类型 → 标签 / 图标（与 spec 树视图图标对齐） */
  var TYPE_LABELS = {
    note: '笔记', template: '模板', workflow: '工作流', code: '代码', plugin: '插件', chat: '对话'
  };
  var TYPE_ICONS = {
    note: '📝', template: '🎨', workflow: '⚙️', code: '📦', plugin: '🔌', chat: '💬'
  };

  /* =====================================================================
   * 共用语法高亮函数（SubTask 2.4 + 2.6 共用）
   * -----------------------------------------------------------------
   * 步骤：先按 token 切分（注释 / 字符串 / 数字 / 关键字），每段单独转义 HTML，
   * 再包裹 <span class="ne-code__xxx">。其它文本走 escapeHtml 批量转义。
   * 这样先转义再高亮的 XSS 防护得以保证：每个 token 的原始文本都经过 escapeHtml。
   * 使用 sticky 正则（y 标志）做单趟扫描，避免关键字落在字符串/注释内被二次高亮。
   * ===================================================================*/

  /* 关键字表（覆盖 JS 常见关键字 + 模块系统 + 字面量） */
  var KEYWORDS = [
    'function', 'var', 'return', 'const', 'let', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this', 'typeof', 'instanceof',
    'void', 'delete', 'in', 'of', 'class', 'extends', 'super', 'import', 'export',
    'from', 'default', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
    'module', 'exports', 'require', 'null', 'undefined', 'true', 'false', 'NaN'
  ];
  var KEYWORD_RE = new RegExp('\\b(?:' + KEYWORDS.join('|') + ')\\b', 'y');

  /* token 模式表：顺序即优先级（注释 > 字符串 > 数字 > 关键字） */
  var TOKEN_PATTERNS = [
    { type: 'comment', re: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/y },
    { type: 'string',  re: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/y },
    { type: 'number',  re: /\b\d+(?:\.\d+)?\b/y },
    { type: 'keyword', re: KEYWORD_RE }
  ];

  function highlightCode(code, language) {
    if (code == null) return '';
    var src = String(code);
    if (!src) return '';
    var result = '';
    var buf = '';
    var i = 0;
    var len = src.length;

    function flushBuf() {
      if (buf) { result += escapeHtml(buf); buf = ''; }
    }

    while (i < len) {
      var matched = false;
      for (var p = 0; p < TOKEN_PATTERNS.length; p++) {
        var re = TOKEN_PATTERNS[p].re;
        re.lastIndex = i;
        var m = re.exec(src);
        if (m && m.index === i && m[0].length > 0) {
          flushBuf();
          result += '<span class="ne-code__' + TOKEN_PATTERNS[p].type + '">' + escapeHtml(m[0]) + '</span>';
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        buf += src[i];
        i++;
      }
    }
    flushBuf();
    return result;
  }

  /* =====================================================================
   * SubTask 2.1：renderFile 统一入口
   * 按 file.type 分发到 NoteRenderer / TemplateRenderer / WorkflowRenderer
   * / CodeRenderer / PluginRenderer，返回完整 HTML 字符串（含 .ne-file-view 容器）
   * 顶部显示文件类型标签 + 文件名 + 路径
   * ===================================================================*/

  function renderFile(file) {
    if (!file) return '';
    var type = file.type || 'note';
    var body;
    switch (type) {
      case 'note':     body = renderNote(file); break;
      case 'template': body = renderTemplate(file); break;
      case 'workflow': body = renderWorkflow(file); break;
      case 'code':     body = renderCode(file); break;
      case 'plugin':   body = renderPlugin(file); break;
      case 'chat':     body = renderChat(file); break;
      default:
        body = '<div class="ne-file__empty">未知文件类型：' + escapeHtml(type) + '</div>';
    }
    return '<div class="ne-file-view ne-file-view--' + escapeAttr(type) + '"' +
      ' data-file-id="' + escapeAttr(file.id) + '"' +
      ' data-file-type="' + escapeAttr(type) + '">' +
      renderFileHeader(file) + body +
      '</div>';
  }

  /* 顶部头部：类型标签 + 文件名 + 路径 */
  function renderFileHeader(file) {
    var type = file.type || 'note';
    var label = TYPE_LABELS[type] || type;
    var icon = TYPE_ICONS[type] || '';
    return '<div class="ne-file__header">' +
      '<span class="ne-file__type">' + icon + ' ' + escapeHtml(label) + '</span>' +
      '<span class="ne-file__name">' + escapeHtml(file.name || '未命名文件') + '</span>' +
      (file.path ? '<span class="ne-file__path">' + escapeHtml(file.path) + '</span>' : '') +
      (file.updatedAt ? '<span class="ne-file__updated">' + escapeHtml(file.updatedAt) + '</span>' : '') +
    '</div>';
  }

  /* 通用操作按钮容器 */
  function renderActions(btnHtml) {
    return '<div class="ne-file__actions">' + btnHtml + '</div>';
  }

  /* =====================================================================
   * NoteRenderer（= BlockRenderer.renderSpec(file.content.spec)）
   * 渲染笔记块树，只读模式
   * ===================================================================*/

  function renderNote(file) {
    var content = file.content || {};
    var spec = content.spec || file.spec;
    var body;
    if (spec && window.ZX_EDITOR && window.ZX_EDITOR.BlockRenderer) {
      body = window.ZX_EDITOR.BlockRenderer.renderSpec(spec, { editable: false });
    } else {
      body = '<div class="ne-file__empty">（空笔记）</div>';
    }
    return '<div class="ne-file__body ne-file__body--note">' + body + '</div>';
  }

  /* =====================================================================
   * SubTask 2.2：TemplateRenderer
   * 预览 content.spec 块树（复用 BlockRenderer.renderSpec，只读模式）
   * 底部"用此模板新建笔记"按钮（data-action="file-use-template" data-id="模板id"）
   * 显示模板 icon + desc
   * ===================================================================*/

  function renderTemplate(file) {
    var content = file.content || {};
    var spec = content.spec;
    var preview;
    if (spec && window.ZX_EDITOR && window.ZX_EDITOR.BlockRenderer) {
      preview = window.ZX_EDITOR.BlockRenderer.renderSpec(spec, { editable: false });
    } else {
      preview = '<div class="ne-file__empty">（无预览内容）</div>';
    }
    var meta =
      '<div class="ne-tpl__meta">' +
        '<span class="ne-tpl__icon">' + escapeHtml(content.icon || '🎨') + '</span>' +
        '<div class="ne-tpl__meta-text">' +
          '<div class="ne-tpl__desc">' + escapeHtml(content.desc || '模板预览') + '</div>' +
          '<div class="ne-tpl__hint">只读预览 · 点击下方按钮以此模板创建新笔记</div>' +
        '</div>' +
      '</div>';
    var btn =
      '<button class="ne-file__btn ne-file__btn--primary" data-action="file-use-template" data-id="' + escapeAttr(file.id) + '">' +
        '用此模板新建笔记' +
      '</button>';
    return '<div class="ne-file__body ne-file__body--template">' +
      meta +
      '<div class="ne-tpl__preview">' + preview + '</div>' +
      renderActions(btn) +
    '</div>';
  }

  /* =====================================================================
   * SubTask 2.3：WorkflowRenderer
   * 渲染 content.steps 列表：每步显示 步骤名 + 输入 → 输出
   * 步骤之间用箭头连接（↓ 表示数据流向）
   * 底部"触发工作流"按钮（data-action="file-run-workflow" data-id="工作流id"）
   * 样式：卡片式步骤 + 连线
   * ===================================================================*/

  function renderWorkflow(file) {
    var content = file.content || {};
    var steps = content.steps || [];
    var stepsHtml;
    if (!steps.length) {
      stepsHtml = '<div class="ne-file__empty">（无步骤）</div>';
    } else {
      stepsHtml = steps.map(function (s, i) {
        var isLast = i === steps.length - 1;
        return '<div class="ne-wf__step" data-step="' + i + '">' +
          '<div class="ne-wf__step-head">' +
            '<span class="ne-wf__step-idx">' + (i + 1) + '</span>' +
            '<span class="ne-wf__step-name">' + escapeHtml(s.name || ('步骤 ' + (i + 1))) + '</span>' +
          '</div>' +
          '<div class="ne-wf__step-io">' +
            '<span class="ne-wf__io ne-wf__io--in">' +
              '<span class="ne-wf__io-label">输入</span>' +
              '<span class="ne-wf__io-value">' + escapeHtml(s.input || '—') + '</span>' +
            '</span>' +
            '<span class="ne-wf__io-arrow" aria-hidden="true">→</span>' +
            '<span class="ne-wf__io ne-wf__io--out">' +
              '<span class="ne-wf__io-label">输出</span>' +
              '<span class="ne-wf__io-value">' + escapeHtml(s.output || '—') + '</span>' +
            '</span>' +
          '</div>' +
        '</div>' + (isLast ? '' : '<div class="ne-wf__connector" aria-hidden="true">↓</div>');
      }).join('');
    }
    var btn =
      '<button class="ne-file__btn ne-file__btn--primary" data-action="file-run-workflow" data-id="' + escapeAttr(file.id) + '">' +
        '触发工作流' +
      '</button>';
    return '<div class="ne-file__body ne-file__body--workflow">' +
      '<div class="ne-wf__steps">' + stepsHtml + '</div>' +
      renderActions(btn) +
    '</div>';
  }

  /* =====================================================================
   * SubTask 2.4：CodeRenderer
   * 语法高亮代码视图（轻量正则高亮，复用 highlightCode）
   * 顶部语言标签（如 "JavaScript"）
   * 代码区域可滚动，等宽字体
   * 用 <pre><code> 包裹，span 标记高亮
   * ===================================================================*/

  /* 语言代码 → 显示名映射 */
  var LANG_LABELS = {
    javascript: 'JavaScript', js: 'JavaScript', typescript: 'TypeScript', ts: 'TypeScript',
    python: 'Python', py: 'Python', java: 'Java', c: 'C', cpp: 'C++', csharp: 'C#',
    go: 'Go', rust: 'Rust', ruby: 'Ruby', php: 'PHP', shell: 'Shell', bash: 'Bash',
    sh: 'Shell', html: 'HTML', css: 'CSS', json: 'JSON', yaml: 'YAML', xml: 'XML',
    markdown: 'Markdown', md: 'Markdown', sql: 'SQL', text: 'Text'
  };

  function langLabel(language) {
    var key = String(language || 'text').toLowerCase();
    return LANG_LABELS[key] || language || 'Text';
  }

  function renderCode(file) {
    var content = file.content || {};
    var language = content.language || 'text';
    var code = content.code != null ? String(content.code) : '';
    var label = langLabel(language);
    var highlighted = highlightCode(code, language);
    return '<div class="ne-file__body ne-file__body--code">' +
      '<div class="ne-code__wrap">' +
        '<div class="ne-code__lang">' + escapeHtml(label) + '</div>' +
        '<pre class="ne-code__pre"><code>' + highlighted + '</code></pre>' +
      '</div>' +
    '</div>';
  }

  /* =====================================================================
   * SubTask 2.5：PluginRenderer
   * 上方 manifest 元信息卡片：名称 / 版本 / 描述
   * 下方 CodeRenderer 渲染 content.code
   * 底部"安装插件"按钮（data-action="file-install-plugin" data-id="插件id"）
   * ===================================================================*/

  function renderPlugin(file) {
    var content = file.content || {};
    var manifest = content.manifest || {};
    var manifestCard =
      '<div class="ne-plg__manifest">' +
        '<div class="ne-plg__name">' + escapeHtml(manifest.name || file.name || '未命名插件') + '</div>' +
        '<div class="ne-plg__row">' +
          '<span class="ne-plg__label">版本</span>' +
          '<span class="ne-plg__value">' + escapeHtml(manifest.version || '—') + '</span>' +
        '</div>' +
        '<div class="ne-plg__row">' +
          '<span class="ne-plg__label">描述</span>' +
          '<span class="ne-plg__value">' + escapeHtml(manifest.desc || '—') + '</span>' +
        '</div>' +
      '</div>';
    /* 复用 CodeRenderer 渲染代码区 */
    var codeView = renderCode(file);
    var btn =
      '<button class="ne-file__btn ne-file__btn--primary" data-action="file-install-plugin" data-id="' + escapeAttr(file.id) + '">' +
        '安装插件' +
      '</button>';
    return '<div class="ne-file__body ne-file__body--plugin">' +
      manifestCard +
      codeView +
      renderActions(btn) +
    '</div>';
  }

  /* =====================================================================
   * ChatRenderer
   * 渲染对话历史：顶部元信息（消息数/归档时间）+ AI 摘要 + 消息列表
   * content.msgs: [{role:'ai'|'user', text, time, attach?}]
   * content.summary: AI 生成的对话摘要
   * ===================================================================*/

  function sparkIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>';
  }

  function renderChat(file) {
    var content = file.content || {};
    var msgs = content.msgs || [];
    var summary = content.summary || '';

    if (!msgs.length) {
      return '<div class="ne-file__body ne-chat-view"><div class="ne-chat__empty">（空对话）</div></div>';
    }

    /* 元信息条 */
    var aiCount = msgs.filter(function (m) { return m.role === 'ai'; }).length;
    var userCount = msgs.filter(function (m) { return m.role === 'user'; }).length;
    var metaHtml =
      '<div class="ne-chat__meta">' +
        sparkIcon() +
        '<span>共 ' + msgs.length + ' 条消息（AI ' + aiCount + ' / 用户 ' + userCount + '）</span>' +
        (content.archivedAt ? '<span>· 归档于 ' + escapeHtml(content.archivedAt) + '</span>' : '') +
        (content.auto ? '<span>· 自动保存</span>' : '') +
      '</div>';

    /* AI 摘要 */
    var summaryHtml = '';
    if (summary) {
      summaryHtml =
        '<div class="ne-chat__summary">' +
          '<div class="ne-chat__summary-title">' + sparkIcon() + ' AI 摘要</div>' +
          escapeHtml(summary) +
        '</div>';
    }

    /* 消息列表 */
    var msgsHtml = msgs.map(function (m) {
      var role = m.role === 'user' ? 'user' : 'ai';
      var avatar = m.role === 'user' ? '我' : sparkIcon();
      var attachHtml = m.attach ? '<div class="ne-chat__attach">' + escapeHtml(m.attach) + '</div>' : '';
      return '<div class="ne-chat__msg ne-chat__msg--' + role + '">' +
        '<span class="ne-chat__avatar">' + avatar + '</span>' +
        '<div>' +
          '<div class="ne-chat__bubble">' + escapeHtml(m.text || '') + attachHtml + '</div>' +
          (m.time ? '<div class="ne-chat__time">' + escapeHtml(m.time) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="ne-file__body ne-chat-view">' +
      metaHtml +
      summaryHtml +
      '<div class="ne-chat__msgs">' + msgsHtml + '</div>' +
    '</div>';
  }

  /* =====================================================================
   * demo 级 toast + 按钮事件委托
   * 复用页面内 [data-toast] 元素（与 note-editor.js / notebook.js 一致）；
   * 若不存在则临时创建一个轻量 toast 节点挂到 body。
   * ===================================================================*/

  var toastTimer = null;
  var tmpToastNode = null;

  function toast(msg) {
    var t = document.querySelector('[data-toast]');
    if (t) {
      t.classList.remove('nb-toast--undo');
      t.innerHTML = '<span>' + escapeHtml(msg) + '</span>';
      t.classList.add('is-show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 1900);
      return;
    }
    /* 兜底：临时创建 */
    if (!tmpToastNode) {
      tmpToastNode = document.createElement('div');
      tmpToastNode.className = 'ne-file__toast';
      document.body.appendChild(tmpToastNode);
    }
    tmpToastNode.textContent = msg;
    if (toastTimer) clearTimeout(toastTimer);
    /* 强制重排再加 is-show，确保过渡生效 */
    tmpToastNode.classList.remove('is-show');
    void tmpToastNode.offsetWidth;
    tmpToastNode.classList.add('is-show');
    toastTimer = setTimeout(function () {
      tmpToastNode.classList.remove('is-show');
    }, 1900);
  }

  /* 事件委托：监听 data-action="file-use-template|file-run-workflow|file-install-plugin" */
  function findActionTarget(target) {
    var el = target;
    while (el && el !== document) {
      if (el.nodeType === 1 && el.getAttribute && el.getAttribute('data-action')) return el;
      el = el.parentNode;
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var btn = findActionTarget(e.target);
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');
    if (action === 'file-use-template') {
      toast('已从模板创建新笔记（demo）');
    } else if (action === 'file-run-workflow') {
      toast('工作流「' + (id || '') + '」已触发（demo）');
    } else if (action === 'file-install-plugin') {
      toast('插件「' + (id || '') + '」安装中…（demo）');
    }
  });

  /* ----------------------------- 导出 ----------------------------- */
  window.ZX_FILE = {
    renderFile: renderFile,
    highlightCode: highlightCode,
    /* 各渲染器单独暴露，便于外部按需调用 / 桌面端复用 */
    renderNote: renderNote,
    renderTemplate: renderTemplate,
    renderWorkflow: renderWorkflow,
    renderCode: renderCode,
    renderPlugin: renderPlugin,
    renderChat: renderChat,
    /* 工具 */
    langLabel: langLabel,
    toast: toast
  };
})();
