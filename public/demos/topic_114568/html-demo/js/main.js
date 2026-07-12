// ========== 主入口 ==========
// 初始化所有模块，处理导入/导出/预览交互
class App {
  constructor() {
    this.iframeManager = null;
    this.annotator = null;
    this.selection = null;
    this.inlineEditor = null;
    this.undoRedo = null;
    this.propertyPanel = null;
    this.exporter = null;
    this.layoutDetector = null;
    this.elementFactory = null;
    this.dragManager = null;
    this.isPreview = false;
    this.currentBreakpoint = 'desktop';
  }

  init() {
    // 初始化模块实例
    this.iframeManager = new IframeManager(bus);
    this.undoRedo = new UndoRedoManager(bus);
    this.annotator = new DomAnnotator(bus, this.iframeManager);
    this.inlineEditor = new InlineEditor(bus, this.iframeManager, this.undoRedo);
    this.layoutDetector = new LayoutDetector(bus, this.iframeManager);

    // 选中管理器（在 iframe 加载后才完全工作）
    const iframeEl = document.getElementById('editor-iframe');
    this.iframeManager.init(iframeEl);

    // 属性面板
    this.propertyPanel = new PropertyPanel(bus, this.iframeManager, this.annotator, this.undoRedo);

    // 导出器
    this.exporter = new Exporter(bus, this.iframeManager, this.annotator);

    // 选中管理器（需要最后初始化，依赖其他模块）
    this.selection = new SelectionManager(bus, this.iframeManager, this.annotator, this.undoRedo);

    // 元素工厂
    this.elementFactory = new ElementFactory(this.annotator, this.iframeManager);

    // 拖拽管理器（素材面板拖放 + 画布内重排序）
    this.dragManager = new DragManager(bus, this.iframeManager, this.annotator, this.undoRedo, this.elementFactory, this.selection);

    // 监听编辑态变化
    bus.on('editing-state-changed', ({ editing }) => {
      this.selection.setEditingState(editing);
    });

    // AI 助手按钮 — 当前显示提示，未来可扩展为对话面板
    bus.on('ai-assistant-requested', (data) => {
      if (data && data.element) {
        const eid = data.element.getAttribute('data-eid') || '';
        const tag = data.element.tagName.toLowerCase();
        const text = (data.element.textContent || '').substring(0, 50);
        this._showToast(`AI 助手：已选中 <${tag}> ${text}... (功能开发中)`);
      } else {
        this._showToast('AI 助手功能开发中，敬请期待');
      }
    });

    // 监听撤销/重做按钮
    this._initToolbar();

    // 监听导入页
    this._initImportPage();

    // 监听导出/分享
    this._initExportShare();

    // 监听断点切换
    this._initBreakpoints();

    // 监听预览
    this._initPreview();

    // 监听面板折叠
    this._initPanelToggles();

    // 检查 URL hash 是否有分享链接
    this._checkSharedLink();

    // 初始化属性面板为空状态
    this.propertyPanel.renderEmpty();
  }

  _initToolbar() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    undoBtn.addEventListener('click', () => this.undoRedo.undo());
    redoBtn.addEventListener('click', () => this.undoRedo.redo());

    bus.on('history-changed', ({ canUndo, canRedo }) => {
      undoBtn.classList.toggle('disabled', !canUndo);
      redoBtn.classList.toggle('disabled', !canRedo);
    });
  }

  _initImportPage() {
    const importPage = document.getElementById('importPage');
    const textarea = document.getElementById('importTextarea');
    const startBtn = document.getElementById('startEditBtn');
    const demoBtn = document.getElementById('loadDemoBtn');
    const fileBtn = document.getElementById('uploadFileBtn');
    const fileInput = document.getElementById('fileInput');

    startBtn.addEventListener('click', () => {
      const html = textarea.value.trim();
      if (!html) {
        this._showToast('请粘贴 HTML 代码或点击「加载示例」');
        return;
      }
      this._startEditing(html);
    });

    demoBtn.addEventListener('click', () => {
      textarea.value = this._getDemoHTML();
    });

    fileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        textarea.value = ev.target.result;
      };
      reader.readAsText(file);
    });

    // 支持拖拽文件到输入框
    textarea.addEventListener('dragover', (e) => { e.preventDefault(); });
    textarea.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
        const reader = new FileReader();
        reader.onload = (ev) => { textarea.value = ev.target.result; };
        reader.readAsText(file);
      }
    });

    // URL 导入
    const urlInput = document.getElementById('urlInput');
    const urlImportBtn = document.getElementById('urlImportBtn');
    if (urlImportBtn) {
      urlImportBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
          this._showToast('请输入网页 URL');
          return;
        }
        urlImportBtn.textContent = '导入中...';
        urlImportBtn.disabled = true;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const html = await response.text();
          textarea.value = html;
          this._showToast('URL 内容已加载，点击「开始编辑」');
          urlInput.value = '';
        } catch (err) {
          // fetch 可能因 CORS 失败，提示用户手动复制
          this._showToast('无法直接获取（可能跨域限制），请手动复制网页源代码粘贴');
        } finally {
          urlImportBtn.textContent = 'URL 导入';
          urlImportBtn.disabled = false;
        }
      });

      // Enter 键触发导入
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          urlImportBtn.click();
        }
      });
    }
  }

  _startEditing(htmlString, sourceUrl) {
    const importPage = document.getElementById('importPage');
    importPage.classList.add('hidden');

    // 清空撤销/重做栈
    this.undoRedo.clear();
    this.annotator.reset();

    // 加载 HTML 到 iframe
    this.iframeManager.loadHTML(htmlString, sourceUrl);

    // iframe 加载完成后标注 DOM
    bus.on('iframe-loaded', () => {
      const doc = this.iframeManager.getDocument();
      if (doc) {
        // 标注 DOM
        const count = this.annotator.annotate(doc.body);

        // 更新标注状态
        const metaEl = document.getElementById('annotationCount');
        if (metaEl) metaEl.textContent = `已标注 ${count} 个元素`;

        // 显示 toast
        this._showToast(`已加载页面，共标注 ${count} 个元素`);
      }
    });

    // 隐藏覆盖层直到 iframe 加载
    document.getElementById('overlay').style.pointerEvents = 'auto';
  }

  _initExportShare() {
    const exportBtn = document.getElementById('exportBtn');
    const shareBtn = document.getElementById('shareBtn');

    // 导出下拉菜单
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('exportMenu');
      menu.classList.toggle('show');
    });

    document.getElementById('exportDownload').addEventListener('click', () => {
      this.exporter.download();
      document.getElementById('exportMenu').classList.remove('show');
      this._showToast('文件已下载');
    });

    document.getElementById('exportCopy').addEventListener('click', async () => {
      await this.exporter.copyToClipboard();
      document.getElementById('exportMenu').classList.remove('show');
      this._showToast('代码已复制到剪贴板');
    });

    document.getElementById('exportHandoff').addEventListener('click', () => {
      this.exporter.exportAIHandoff();
      document.getElementById('exportMenu').classList.remove('show');
      this._showToast('AI 交接文件已下载');
    });

    // 分享
    shareBtn.addEventListener('click', async () => {
      const url = await this.exporter.shareLink();
      if (url) {
        try {
          await navigator.clipboard.writeText(url);
          this._showToast('分享链接已复制到剪贴板');
        } catch (e) {
          this._showToast('分享链接: ' + url);
        }
      } else {
        this._showToast('分享失败，请重试');
      }
    });

    // 点击外部关闭菜单
    document.addEventListener('click', () => {
      document.getElementById('exportMenu').classList.remove('show');
    });
  }

  _initBreakpoints() {
    const buttons = document.querySelectorAll('.bp-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const bp = btn.getAttribute('data-bp');
        this.currentBreakpoint = bp;

        const wrapper = document.getElementById('iframeWrapper');
        const sizes = { desktop: '1280px', tablet: '768px', mobile: '375px' };
        wrapper.style.maxWidth = sizes[bp];

        // 更新尺寸显示
        const dimEl = document.getElementById('canvasDimensions');
        if (dimEl) {
          dimEl.textContent = `${sizes[bp].replace('px','')} × 自动`;
        }
      });
    });
  }

  _initPreview() {
    const previewBtn = document.getElementById('previewBtn');
    const badge = document.getElementById('previewBadge');

    const enterPreview = () => {
      this.isPreview = true;
      const overlay = document.getElementById('overlay');
      const leftPanel = document.getElementById('leftPanel');
      const rightPanel = document.getElementById('rightPanel');
      const infoBar = document.getElementById('canvasInfoBar');

      overlay.style.display = 'none';
      badge.style.display = 'flex';
      leftPanel.style.display = 'none';
      rightPanel.style.display = 'none';
      infoBar.style.display = 'none';
      previewBtn.classList.add('active');
      this.selection.deselect();
      this.iframeManager.enablePreview();
    };

    const exitPreview = () => {
      this.isPreview = false;
      const overlay = document.getElementById('overlay');
      const leftPanel = document.getElementById('leftPanel');
      const rightPanel = document.getElementById('rightPanel');
      const infoBar = document.getElementById('canvasInfoBar');

      overlay.style.display = 'block';
      badge.style.display = 'none';
      leftPanel.style.display = 'flex';
      rightPanel.style.display = 'flex';
      infoBar.style.display = 'flex';
      previewBtn.classList.remove('active');

      // Re-enable edit mode with sandbox reload
      this.iframeManager.disablePreview();

      // Re-annotate after iframe reloads
      // Event bus doesn't support { once: true }, so manually remove listener
      const onIframeLoaded = (data) => {
        bus.off('iframe-loaded', onIframeLoaded);
        const doc = this.iframeManager.getDocument();
        if (doc) {
          this.annotator.annotate(doc.body);
        }
      };
      bus.on('iframe-loaded', onIframeLoaded);
    };

    previewBtn.addEventListener('click', () => {
      if (this.isPreview) exitPreview();
      else enterPreview();
    });

    badge.addEventListener('click', () => {
      previewBtn.click();
    });
  }

  _initPanelToggles() {
    const leftToggle = document.getElementById('leftPanelToggle');
    const leftPanel = document.getElementById('leftPanel');
    if (leftToggle) {
      leftToggle.addEventListener('click', () => {
        leftPanel.classList.toggle('collapsed');
        if (leftPanel.classList.contains('collapsed')) {
          leftToggle.classList.add('floating');
          leftToggle.setAttribute('title', '展开素材面板');
        } else {
          leftToggle.classList.remove('floating');
          leftToggle.setAttribute('title', '收起素材面板');
        }
      });
    }

    const rightToggle = document.getElementById('rightPanelToggle');
    const rightPanel = document.getElementById('rightPanel');
    if (rightToggle) {
      rightToggle.addEventListener('click', () => {
        rightPanel.classList.toggle('collapsed');
        if (rightPanel.classList.contains('collapsed')) {
          rightToggle.classList.add('floating-right');
          rightToggle.setAttribute('title', '展开属性面板');
        } else {
          rightToggle.classList.remove('floating-right');
          rightToggle.setAttribute('title', '收起属性面板');
        }
      });
    }
  }

  _checkSharedLink() {
    const hash = window.location.hash;
    if (hash.startsWith('#view=')) {
      const contentId = hash.substring(6);
      this.exporter.loadSharedPage(contentId).then(html => {
        if (html) {
          // 直接进入预览模式
          this._startEditing(html);
          setTimeout(() => {
            document.getElementById('previewBtn').click();
          }, 500);
        }
      });
    }
  }

  _showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px;
        background: var(--bg-elevated, #2a2724);
        color: var(--text-primary, #e8e4df);
        border: 1px solid var(--border-strong, #4a4540);
        border-radius: 6px; padding: 10px 16px;
        font-size: 12px; z-index: 9999;
        opacity: 0; transition: opacity 0.3s, transform 0.3s;
        transform: translateY(10px);
        max-width: 400px; word-wrap: break-word;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2500);
  }

  _getDemoHTML() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,sans-serif;color:#1a1a1a;background:#fff;}
.hero{text-align:center;padding:80px 40px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;}
.hero h1{font-size:48px;font-weight:700;margin-bottom:16px;}
.hero p{font-size:18px;opacity:0.9;margin-bottom:32px;}
.hero button{background:#fff;color:#764ba2;border:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;}
.features{display:flex;justify-content:center;gap:40px;padding:60px 40px;}
.feature{text-align:center;max-width:200px;}
.feature h3{font-size:20px;margin-bottom:8px;color:#333;}
.feature p{font-size:14px;color:#666;line-height:1.6;}
.footer{text-align:center;padding:40px;color:#999;font-size:13px;border-top:1px solid #eee;}
</style>
</head>
<body>
<div class="hero">
  <h1>欢迎来到课程</h1>
  <p>用 AI 快速生成精美教学页面</p>
  <button>立即报名</button>
</div>
<div class="features">
  <div class="feature">
    <h3>快速生成</h3>
    <p>AI 一键生成教学课件 HTML</p>
  </div>
  <div class="feature">
    <h3>可视化编辑</h3>
    <p>像改 PPT 一样修改每个细节</p>
  </div>
  <div class="feature">
    <h3>一键分享</h3>
    <p>生成链接或导出独立文件</p>
  </div>
</div>
<div class="footer">© 2026 课程平台 · 保留所有权利</div>
</body>
</html>`;
  }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.app = app;
});
