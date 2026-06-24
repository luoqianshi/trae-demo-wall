/* ============================================
   AI 立体回忆馆 — 主应用逻辑
   ============================================ */

const App = {
  currentPage: 'home',
  uploadedFile: null,
  uploadedDataURL: null,
  lastGeneratedModel: null,
  currentView: 'grid',

  init() {
    this._bindNavigation();
    this._bindGeneratePage();
    this._bindViewerPage();
    this._bindGalleryPage();
    this._bindSettingsPage();
    this._initRevealAnimations();
    this._initParticles();

    // Navigate to hash or home
    const hash = window.location.hash.replace('#', '') || 'home';
    this.navigateTo(hash);
  },

  // === Navigation ===

  _bindNavigation() {
    // Nav links
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.getAttribute('data-page');
        this.navigateTo(page);
      });
    });

    // Mobile toggle
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('open');
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
      });
    }

    // Hash change
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      this.navigateTo(hash, false);
    });

    // Scroll navbar effect
    window.addEventListener('scroll', Utils.debounce(() => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
      }
    }, 50));
  },

  navigateTo(page, updateHash = true) {
    if (updateHash) {
      window.location.hash = page;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('show', 'animating');
    });

    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) {
      // Small delay for transition
      requestAnimationFrame(() => {
        target.classList.add('show');
        requestAnimationFrame(() => {
          target.classList.add('animating');
        });
      });
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    // Close mobile menu
    const links = document.getElementById('nav-links');
    if (links) links.classList.remove('open');

    this.currentPage = page;

    // Page-specific init
    if (page === 'viewer') {
      setTimeout(() => Viewer3D.init(), 100);
    }
    if (page === 'gallery') {
      this._renderGallery();
    }
    if (page === 'home') {
      this._initRevealAnimations();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // === Generate Page ===

  _bindGeneratePage() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const clearBtn = document.getElementById('clear-upload');
    const generateBtn = document.getElementById('generate-btn');
    const engineSelect = document.getElementById('engine-select');

    if (!uploadZone || !fileInput) return;

    // Click to upload
    uploadZone.addEventListener('click', (e) => {
      if (e.target.closest('#clear-upload')) return;
      fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this._handleFileUpload(file);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this._handleFileUpload(file);
      }
    });

    // Clear upload
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._clearUpload();
      });
    }

    // Engine select - show/hide options
    if (engineSelect) {
      engineSelect.addEventListener('change', () => {
        this._updateEngineOptions(engineSelect.value);
      });
    }

    // Generate button - use mousedown to ensure it fires even after disabled state change
    if (generateBtn) {
      generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._startGeneration();
      });
    }
  },

  _handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
      Utils.showToast('请上传图片文件（JPG、PNG、WEBP）');
      return;
    }

    this.uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedDataURL = e.target.result;
      const preview = document.getElementById('upload-preview');
      const placeholder = document.getElementById('upload-placeholder');
      const clearBtn = document.getElementById('clear-upload');
      const generateBtn = document.getElementById('generate-btn');

      if (preview) {
        preview.src = this.uploadedDataURL;
        preview.classList.remove('hidden');
      }
      if (placeholder) placeholder.classList.add('hidden');
      if (clearBtn) clearBtn.classList.remove('hidden');
      if (generateBtn) generateBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  },

  _clearUpload() {
    this.uploadedFile = null;
    this.uploadedDataURL = null;

    const preview = document.getElementById('upload-preview');
    const placeholder = document.getElementById('upload-placeholder');
    const clearBtn = document.getElementById('clear-upload');
    const generateBtn = document.getElementById('generate-btn');
    const fileInput = document.getElementById('file-input');

    if (preview) { preview.src = ''; preview.classList.add('hidden'); }
    if (placeholder) placeholder.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    if (generateBtn) generateBtn.disabled = true;
    if (fileInput) fileInput.value = '';
  },

  _updateEngineOptions(engine) {
    // Hide all engine-specific options
    ['hunyuan-options', 'meshy-options', 'tripo-options'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    const apiKeyGroup = document.getElementById('api-key-group');

    // Show relevant options
    if (engine === 'hunyuan') {
      const el = document.getElementById('hunyuan-options');
      if (el) el.style.display = 'block';
      if (apiKeyGroup) apiKeyGroup.style.display = 'block';
    } else if (engine === 'meshy') {
      const el = document.getElementById('meshy-options');
      if (el) el.style.display = 'block';
      if (apiKeyGroup) apiKeyGroup.style.display = 'block';
    } else if (engine === 'tripo') {
      const el = document.getElementById('tripo-options');
      if (el) el.style.display = 'block';
      if (apiKeyGroup) apiKeyGroup.style.display = 'block';
    } else {
      if (apiKeyGroup) apiKeyGroup.style.display = 'none';
    }
  },

  async _startGeneration() {
    if (!this.uploadedFile) {
      Utils.showToast('请先上传照片');
      return;
    }

    const engine = document.getElementById('engine-select').value;
    const style = document.getElementById('mock-style').value;
    const statusCard = document.getElementById('status-card');
    const progressOverlay = document.getElementById('progress-overlay');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressStatus = document.getElementById('progress-status');
    const progressDetail = document.getElementById('progress-detail');
    const generateBtn = document.getElementById('generate-btn');

    // Show progress
    if (statusCard) statusCard.classList.add('hidden');
    if (progressOverlay) progressOverlay.classList.remove('hidden');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.querySelector('.btn-text').textContent = '生成中...';
    }

    const onProgress = (percent, status, detail) => {
      if (progressBar) {
        const circumference = 2 * Math.PI * 60;
        const offset = circumference * (1 - percent / 100);
        progressBar.style.strokeDashoffset = offset;
      }
      if (progressText) progressText.textContent = Math.round(percent) + '%';
      if (progressStatus) progressStatus.textContent = status;
      if (progressDetail) progressDetail.textContent = detail;
    };

    try {
      const client = APIConfig.getClient(engine);
      const options = engine === 'mock' ? { style } : {};

      // For non-mock engines, get API key
      if (engine !== 'mock') {
        const keyInput = document.getElementById('api-key');
        const key = keyInput ? keyInput.value.trim() : '';
        if (key) APIConfig.setApiKey(engine, key);
      }

      const result = await client.generate(this.uploadedFile, options, onProgress);
      this.lastGeneratedModel = result;

      Utils.showToast('3D 模型生成成功！');

      // Navigate to viewer after short delay
      setTimeout(() => {
        this.navigateTo('viewer');
        // Load model in viewer - wait for page transition and Three.js init
        setTimeout(() => {
          if (!Viewer3D.isInitialized) Viewer3D.init();
          Viewer3D.loadModel(result);
        }, 600);
      }, 800);

    } catch (err) {
      Utils.showToast(err.message || '生成失败，请重试');
      console.error('Generation error:', err);
      // Reset UI
      if (statusCard) statusCard.classList.remove('hidden');
      if (progressOverlay) progressOverlay.classList.add('hidden');
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = '开始生成';
      }
    }
  },

  // === Viewer Page ===

  _bindViewerPage() {
    // Reset camera
    const resetBtn = document.getElementById('reset-camera');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Viewer3D.resetCamera();
        Utils.showToast('视角已重置');
      });
    }

    // Wireframe toggle
    const wireBtn = document.getElementById('toggle-wireframe');
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        const isWire = Viewer3D.toggleWireframe();
        wireBtn.textContent = isWire ? '实体模式' : '线框模式';
      });
    }

    // Auto rotate
    const rotateBtn = document.getElementById('toggle-auto-rotate');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        const isAuto = Viewer3D.toggleAutoRotate();
        rotateBtn.textContent = isAuto ? '停止旋转' : '自动旋转';
      });
    }

    // Light controls
    const ambientRange = document.getElementById('ambient-intensity');
    const dirRange = document.getElementById('directional-intensity');
    const backRange = document.getElementById('backlight-intensity');

    if (ambientRange) ambientRange.addEventListener('input', (e) => Viewer3D.setAmbientIntensity(parseFloat(e.target.value)));
    if (dirRange) dirRange.addEventListener('input', (e) => Viewer3D.setDirectionalIntensity(parseFloat(e.target.value)));
    if (backRange) backRange.addEventListener('input', (e) => Viewer3D.setBacklightIntensity(parseFloat(e.target.value)));

    // Background options
    document.querySelectorAll('.bg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Viewer3D.setBackground(btn.getAttribute('data-bg'));
      });
    });

    // Export buttons
    const exportObj = document.getElementById('export-obj');
    const exportGlb = document.getElementById('export-glb');
    const exportStl = document.getElementById('export-stl');

    if (exportObj) exportObj.addEventListener('click', () => Viewer3D.exportOBJ());
    if (exportGlb) exportGlb.addEventListener('click', () => Viewer3D.exportGLB());
    if (exportStl) exportStl.addEventListener('click', () => Viewer3D.exportSTL());

    // Add to gallery
    const addGalleryBtn = document.getElementById('add-to-gallery');
    if (addGalleryBtn) {
      addGalleryBtn.addEventListener('click', () => this._addToGallery());
    }
  },

  _addToGallery() {
    if (!this.lastGeneratedModel) {
      Utils.showToast('没有可添加的模型');
      return;
    }

    // Simple theme selector via inline prompt
    const themes = ['family', 'pet', 'travel', 'item', 'other'];
    const themeNames = ['家人', '宠物', '旅行', '物品', '其他'];
    const theme = prompt(
      '选择展柜主题（输入编号）：\n1. 家人\n2. 宠物\n3. 旅行\n4. 物品\n5. 其他',
      '5'
    );

    const themeIndex = parseInt(theme) - 1;
    const selectedTheme = (themeIndex >= 0 && themeIndex < themes.length) ? themes[themeIndex] : 'other';

    const item = Gallery.add(this.lastGeneratedModel, selectedTheme);
    Utils.showToast(`已添加到「${Gallery.getThemeName(selectedTheme)}」展柜`);
  },

  // === Gallery Page ===

  _bindGalleryPage() {
    // Theme tabs
    document.querySelectorAll('.gallery-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderGallery(tab.getAttribute('data-theme'));
      });
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.getAttribute('data-view');
        this._renderGallery();
      });
    });
  },

  _renderGallery(theme) {
    const currentTheme = theme || (document.querySelector('.gallery-tab.active')?.getAttribute('data-theme') || 'all');
    const items = Gallery.getByTheme(currentTheme);
    const emptyEl = document.getElementById('gallery-empty');
    const gridEl = document.getElementById('gallery-grid');
    const shelfEl = document.getElementById('gallery-shelf');

    if (items.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (gridEl) gridEl.classList.add('hidden');
      if (shelfEl) shelfEl.classList.add('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    if (this.currentView === 'grid') {
      if (gridEl) {
        gridEl.classList.remove('hidden');
        gridEl.innerHTML = '';
        items.forEach(item => {
          const el = this._createGalleryItem(item);
          gridEl.appendChild(el);
        });
        // Render thumbnails
        setTimeout(() => {
          items.forEach((item, i) => {
            const canvas = gridEl.querySelectorAll('.gallery-item-thumb canvas')[i];
            if (canvas) {
              Viewer3D.renderThumbnail(item, canvas, 280, 210);
            }
          });
        }, 100);
      }
      if (shelfEl) shelfEl.classList.add('hidden');
    } else {
      if (shelfEl) {
        shelfEl.classList.remove('hidden');
        shelfEl.innerHTML = '';
        // Group by theme
        const grouped = {};
        items.forEach(item => {
          const t = item.theme || 'other';
          if (!grouped[t]) grouped[t] = [];
          grouped[t].push(item);
        });
        Object.entries(grouped).forEach(([theme, themeItems]) => {
          const row = document.createElement('div');
          row.className = 'shelf-row';
          row.innerHTML = `<div class="shelf-row-label">${Gallery.getThemeName(theme)}</div>`;
          const inner = document.createElement('div');
          inner.style.display = 'flex';
          inner.style.gap = '1rem';
          inner.style.overflowX = 'auto';
          themeItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'shelf-item';
            el.innerHTML = `
              <div class="shelf-item-thumb"><canvas></canvas></div>
              <div class="shelf-item-name">${item.name}</div>
            `;
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => this._viewGalleryItem(item));
            inner.appendChild(el);
          });
          row.appendChild(inner);
          shelfEl.appendChild(row);

          // Render thumbnails
          setTimeout(() => {
            const canvases = inner.querySelectorAll('canvas');
            themeItems.forEach((item, i) => {
              if (canvases[i]) {
                Viewer3D.renderThumbnail(item, canvases[i], 200, 150);
              }
            });
          }, 100);
        });
      }
      if (gridEl) gridEl.classList.add('hidden');
    }
  },

  _createGalleryItem(item) {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.innerHTML = `
      <div class="gallery-item-thumb">
        <canvas></canvas>
      </div>
      <div class="gallery-item-info">
        <div class="gallery-item-name">${item.name}</div>
        <div class="gallery-item-meta">
          <span>${Gallery.getThemeName(item.theme)}</span>
          <span>${item.createdAt}</span>
        </div>
      </div>
      <div class="gallery-item-actions">
        <button class="btn btn-primary btn-sm" data-action="view">查看</button>
        <button class="btn btn-ghost btn-sm" data-action="delete">删除</button>
      </div>
    `;

    el.querySelector('[data-action="view"]').addEventListener('click', () => this._viewGalleryItem(item));
    el.querySelector('[data-action="delete"]').addEventListener('click', () => {
      Gallery.remove(item.id);
      Utils.showToast('已从展柜移除');
      this._renderGallery();
    });

    return el;
  },

  _viewGalleryItem(item) {
    this.lastGeneratedModel = item;
    this.navigateTo('viewer');
    setTimeout(() => {
      Viewer3D.loadModel(item);
    }, 300);
  },

  // === Settings Page ===

  _bindSettingsPage() {
    // Load saved settings
    const defaultEngine = APIConfig.getDefaultEngine();
    const engineSelect = document.getElementById('default-engine');
    if (engineSelect) engineSelect.value = defaultEngine;

    // Load saved keys
    ['hunyuan', 'meshy', 'tripo'].forEach(engine => {
      const input = document.getElementById(`setting-${engine}-key`);
      if (input) {
        input.value = APIConfig.getApiKey(engine);
      }
    });

    // Save settings
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const engine = document.getElementById('default-engine')?.value;
        if (engine) APIConfig.setDefaultEngine(engine);

        ['hunyuan', 'meshy', 'tripo'].forEach(e => {
          const input = document.getElementById(`setting-${e}-key`);
          if (input) APIConfig.setApiKey(e, input.value.trim());
        });

        Utils.showToast('设置已保存');
      });
    }

    // Clear all keys
    const clearBtn = document.getElementById('clear-settings');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有 API Key 吗？')) {
          APIConfig.clearAllKeys();
          ['hunyuan', 'meshy', 'tripo'].forEach(e => {
            const input = document.getElementById(`setting-${e}-key`);
            if (input) input.value = '';
          });
          Utils.showToast('所有 API Key 已清除');
        }
      });
    }
  },

  // === Reveal Animations ===

  _initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('visible');
      observer.observe(el);
    });
  },

  // === Particle Background ===

  _initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let mouseX = -1000, mouseY = -1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 200));

    // Track mouse
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Create particles
    const count = Math.min(60, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.3,
        color: Math.random() > 0.5 ? '#E87040' : '#C49A6C'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        // Mouse attraction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          p.vx += dx / dist * 0.02;
          p.vy += dy / dist * 0.02;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
