const App = {
  currentPage: 'overview',
  currentPhase: null,
  chatHistory: [],
  currentChatTask: null,
  onboardingStep: 0,

  init() {
    this.renderSidebar();
    this.renderPage('overview');
    this.updateHeaderProgress();
    this.bindEvents();
    this.loadConfigPresets();
    this.renderConfigList();
    
    if (!Storage.isOnboardingDone()) {
      this.showOnboarding();
    }
  },

  bindEvents() {
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('addConfigBtn').addEventListener('click', () => this.openConfigForm());
    document.getElementById('configForm').addEventListener('submit', (e) => this.saveConfig(e));
    document.getElementById('configPreset').addEventListener('change', (e) => this.applyPreset(e.target.value));
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
    document.getElementById('importFileInput').addEventListener('change', (e) => this.handleImportFile(e));
    document.getElementById('localPackFolderInput')?.addEventListener('change', (e) => this.handleLocalPackFiles(e, { fromFolder: true }));
    document.getElementById('localPackFilesInput')?.addEventListener('change', (e) => this.handleLocalPackFiles(e, { fromFolder: false }));
    document.getElementById('resetProgressBtn').addEventListener('click', () => this.resetProgress());
    document.getElementById('resetOnboardingBtn').addEventListener('click', () => this.resetOnboarding());
    document.getElementById('copyDebugBtn')?.addEventListener('click', () => this.copyDebugLog());
    document.getElementById('clearDebugBtn')?.addEventListener('click', () => this.clearDebugLog());
    document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
    document.getElementById('stopChatBtn').addEventListener('click', () => this.stopChat());
    document.getElementById('copyChatBtn').addEventListener('click', () => this.copyChatResult());
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
    document.getElementById('onboardingNextBtn').addEventListener('click', () => this.nextOnboardingStep());
    document.getElementById('onboardingSkipBtn').addEventListener('click', () => this.skipOnboarding());
    document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleSidebar());

    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.renderPage(page);
        this.toggleSidebar(false);
      });
    });
  },

  renderSidebar() {
    const nav = document.getElementById('phaseNav');
    nav.innerHTML = WorkflowData.phases.map(phase => {
      const progress = Storage.getPhaseProgress(phase.id);
      return `
        <button class="sidebar-item w-full text-left" data-phase="${phase.id}" onclick="App.renderPhase('${phase.id}')">
          <div class="sidebar-item-icon" style="background: ${phase.color}20; color: ${phase.color}">
            <i class="fas ${phase.icon}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate">${phase.name}</p>
            <p class="text-xs opacity-70">${progress.completed}/${progress.total} 完成</p>
          </div>
        </button>
      `;
    }).join('');
  },

  updateSidebarActive(phaseId) {
    document.querySelectorAll('[data-phase]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.phase === phaseId);
    });
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.classList.remove('active');
    });
  },

  updateNavActive(page) {
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
    document.querySelectorAll('[data-phase]').forEach(btn => {
      btn.classList.remove('active');
    });
  },

  renderPage(page) {
    this.currentPage = page;
    this.updateNavActive(page);
    
    const main = document.getElementById('mainContent');
    main.classList.remove('animate-fadeIn');
    void main.offsetWidth;
    main.classList.add('animate-fadeIn');
    
    switch (page) {
      case 'overview':
        this.renderOverview();
        break;
      case 'tools':
        this.renderToolLibrary();
        break;
      case 'templates':
        this.renderTemplates();
        break;
    }
  },

  renderOverview() {
    const main = document.getElementById('mainContent');
    const overall = Storage.getOverallProgress();
    const activePack = Storage.getActivePackId();
    let packLabel = null;
    if (activePack) {
      try {
        const savedName = localStorage.getItem('manhua_drama_active_pack_name');
        if (savedName) packLabel = savedName;
      } catch (_) { /* ignore */ }
      if (!packLabel) {
        if (typeof ProjectPack !== 'undefined' && activePack === ProjectPack.id) {
          packLabel = ProjectPack.name;
        } else if (String(activePack).startsWith('local_')) {
          packLabel = '本地导入剧本';
        } else {
          packLabel = activePack;
        }
      }
    }

    main.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="mb-8 animate-slideInUp">
          <h1 class="text-2xl font-bold text-text-primary mb-2">漫剧制作全流程 🌸</h1>
          <p class="text-text-secondary">六个阶段，一步步带你做出属于你的AI漫剧</p>
        </div>

        <div class="bg-white rounded-2xl p-6 mb-6 border border-border-light shadow-sm animate-slideInUp" style="animation-delay: 0.05s">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-semibold text-text-primary mb-1">剧本导入 · 快速开工</h2>
              <p class="text-text-secondary text-sm">
                可选内置《球场心跳》，或从本地文件夹导入你的剧本文档，自动填入各阶段任务笔记，再点「开始执行」。
              </p>
              ${packLabel ? `<p class="text-xs text-primary-dark mt-2"><i class="fas fa-check-circle mr-1"></i>当前已导入：${this.escapeHtml(packLabel)}</p>` : ''}
            </div>
            <div class="flex flex-wrap gap-2 flex-shrink-0">
              <button class="btn btn-secondary btn-sm" onclick="App.openImportProjectModal()">
                <i class="fas fa-file-import mr-1"></i>
                一键导入
              </button>
              <button class="btn btn-primary btn-sm" onclick="App.startImportedProject()">
                <i class="fas fa-play mr-1"></i>
                开始执行
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 mb-8 border border-border-light shadow-sm animate-slideInUp" style="animation-delay: 0.1s">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 class="text-lg font-semibold text-text-primary mb-1">你的进度</h2>
              <p class="text-text-secondary text-sm">已完成 ${overall.completed} / ${overall.total} 个任务</p>
              <p class="text-xs text-text-light mt-1">已填笔记 ${overall.withNotes || 0} 个 · 进度按「勾选完成」计算</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="relative w-24 h-24">
                <svg class="w-24 h-24 progress-ring" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#FFE4E1" stroke-width="8" fill="none"/>
                  <circle class="progress-ring-circle" cx="50" cy="50" r="40" stroke="url(#grad2)" stroke-width="8" fill="none" stroke-linecap="round" style="stroke-dashoffset: ${251.2 - (251.2 * overall.percentage / 100)}"/>
                  <defs>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#FFB6C1"/>
                      <stop offset="100%" style="stop-color:#FF69B4"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-2xl font-bold text-gradient">${overall.percentage}%</span>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <button class="btn btn-primary btn-sm" onclick="App.exportScript()">
                  <i class="fas fa-file-export mr-1"></i>
                  导出剧本
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.exportAllData()">
                  <i class="fas fa-download mr-1"></i>
                  导出数据
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${WorkflowData.phases.map((phase, index) => {
            const progress = Storage.getPhaseProgress(phase.id);
            return `
              <div class="card phase-card cursor-pointer overflow-hidden animate-slideInUp"
                   style="animation-delay: ${0.1 * (index + 1)}s"
                   onclick="App.renderPhase('${phase.id}')">
                <div class="h-1" style="background: linear-gradient(90deg, ${phase.color}80, ${phase.color})"></div>
                <div class="p-5">
                  <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style="background: ${phase.color}15; color: ${phase.color}">
                      <i class="fas ${phase.icon}"></i>
                    </div>
                    <span class="badge badge-pink">${progress.percentage}%</span>
                  </div>
                  <h3 class="text-lg font-semibold text-text-primary mb-2">${phase.name}</h3>
                  <p class="text-sm text-text-secondary mb-4 line-clamp-2">${phase.description}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-text-light">${progress.completed}/${progress.total} 完成 · ${progress.withNotes || 0} 有笔记</span>
                    <span class="text-primary-dark text-sm font-medium">
                      查看详情 <i class="fas fa-arrow-right ml-1 text-xs"></i>
                    </span>
                  </div>
                  <div class="mt-3 progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress.percentage}%; background: linear-gradient(90deg, ${phase.color}80, ${phase.color})"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="mt-10 bg-gradient-to-br from-accent-2 to-white rounded-2xl p-6 border border-border-light animate-slideInUp" style="animation-delay: 0.7s">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl flex-shrink-0">
              <i class="fas fa-lightbulb"></i>
            </div>
            <div>
              <h3 class="font-semibold text-text-primary mb-2">新手建议</h3>
              <p class="text-text-secondary text-sm mb-3">
                想快速体验？点「一键导入」选《球场心跳》或导入本地剧本，再「开始执行」。
                也可以从编剧阶段空白开写——填笔记保存后会自动计入进度。
              </p>
              <div class="flex flex-wrap gap-2">
                <button class="btn btn-primary btn-sm" onclick="App.openImportProjectModal()">
                  <i class="fas fa-file-import mr-1"></i>
                  导入剧本
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.renderPhase('writing')">
                  <i class="fas fa-pen mr-1"></i>
                  从编剧空白开始
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderPhase(phaseId) {
    this.currentPhase = phaseId;
    this.currentPage = 'phase';
    this.updateSidebarActive(phaseId);
    
    const phase = WorkflowData.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const progress = Storage.getPhaseProgress(phaseId);
    const main = document.getElementById('mainContent');
    
    main.classList.remove('animate-fadeIn');
    void main.offsetWidth;
    main.classList.add('animate-fadeIn');
    
    main.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <button class="text-text-secondary hover:text-primary-dark transition mb-4" onclick="App.renderPage('overview')">
            <i class="fas fa-arrow-left mr-2"></i>
            返回总览
          </button>
          
          <div class="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
            <div class="flex items-start gap-4 flex-wrap">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style="background: ${phase.color}15; color: ${phase.color}">
                <i class="fas ${phase.icon}"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl font-bold text-text-primary mb-1">${phase.name}</h1>
                <p class="text-text-secondary">${phase.description}</p>
                <div class="mt-3 flex items-center gap-4">
                  <span class="badge badge-pink">${progress.completed}/${progress.total} 完成</span>
                  <div class="flex-1 max-w-xs progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress.percentage}%; background: ${phase.color}"></div>
                  </div>
                  <span class="text-sm font-medium" style="color: ${phase.color}">${progress.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          ${phase.tasks.map((task, index) => {
            const isCompleted = Storage.isTaskCompleted(task.id);
            const note = Storage.getNote(task.id);
            const hasNote = !!(note || '').trim();
            return `
              <div class="card overflow-hidden animate-slideInUp" style="animation-delay: ${index * 0.05}s">
                <div class="p-4">
                  <div class="flex items-start gap-4">
                    <div class="task-checkbox ${isCompleted ? 'checked' : ''}"
                         onclick="App.toggleTask('${task.id}')"
                         title="${isCompleted ? '取消完成' : '标记完成'}">
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <h3 class="font-semibold text-text-primary ${isCompleted ? 'line-through text-text-light' : ''}">
                          <span class="text-sm text-text-light mr-2">${index + 1}.</span>
                          ${task.name}
                          ${hasNote ? '<span class="ml-2 text-xs font-normal text-primary-dark no-underline" style="text-decoration:none"><i class="fas fa-sticky-note"></i> 已有笔记</span>' : ''}
                        </h3>
                        ${task.promptType ? `
                          <button class="btn btn-primary btn-sm flex-shrink-0" onclick="event.stopPropagation(); App.openAIChat('${task.id}')">
                            <i class="fas fa-magic mr-1"></i>
                            AI生成
                          </button>
                        ` : ''}
                      </div>
                      <p class="text-sm text-text-secondary mb-3">${task.shortDesc}</p>

                      <div id="task-detail-${task.id}" class="hidden">
                        <div class="space-y-4 mt-4 pt-4 border-t border-border-light">
                          <div>
                            <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                              <i class="fas fa-info-circle text-primary-dark"></i>
                              任务说明
                            </h4>
                            <p class="text-sm text-text-secondary">${task.description}</p>
                          </div>

                          <div>
                            <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                              <i class="fas fa-star text-primary-dark"></i>
                              为什么重要
                            </h4>
                            <p class="text-sm text-text-secondary">${task.whyImportant}</p>
                          </div>

                          <div>
                            <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                              <i class="fas fa-list-ol text-primary-dark"></i>
                              操作步骤
                            </h4>
                            <ol class="text-sm text-text-secondary space-y-1">
                              ${task.steps.map((step, i) => `<li><span class="text-primary-dark font-medium mr-2">${i + 1}.</span>${step}</li>`).join('')}
                            </ol>
                          </div>

                          ${task.tools && task.tools.length > 0 ? `
                            <div>
                              <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                <i class="fas fa-toolbox text-primary-dark"></i>
                                推荐工具
                              </h4>
                              <div class="flex flex-wrap gap-2">
                                ${task.tools.map(toolId => {
                                  const tool = WorkflowData.tools.find(t => t.id === toolId);
                                  return tool ? `<span class="tag cursor-pointer" onclick="App.renderToolDetail('${tool.id}')">${tool.name}</span>` : '';
                                }).join('')}
                              </div>
                            </div>
                          ` : ''}

                          <div>
                            <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                              <i class="fas fa-file-alt text-primary-dark"></i>
                              产出物
                            </h4>
                            <p class="text-sm text-text-secondary">${task.output}</p>
                          </div>

                          <div>
                            <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                              <i class="fas fa-eye text-primary-dark"></i>
                              产出物示例
                            </h4>
                            <div class="bg-accent-2 rounded-lg p-3 text-sm text-text-primary font-mono whitespace-pre-wrap text-xs">${task.outputExample}</div>
                          </div>

                          <div>
                            <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                              <i class="fas fa-sticky-note text-primary-dark"></i>
                              我的笔记
                              ${hasNote ? '<span class="text-xs font-normal text-text-light">（失焦自动保存；有内容会勾选完成）</span>' : ''}
                            </h4>
                            <textarea
                              class="input-field text-sm"
                              rows="${hasNote ? 10 : 3}"
                              placeholder="在这里记录你的想法、灵感、产出物链接… 保存后自动计入进度"
                              onblur="App.saveNote('${task.id}', this.value)"
                            >${this.escapeHtml(note)}</textarea>
                          </div>
                        </div>
                      </div>

                      <button class="text-sm text-primary-dark mt-1" onclick="App.toggleTaskDetail('${task.id}')">
                        <span id="toggle-text-${task.id}">展开详情</span>
                        <i id="toggle-icon-${task.id}" class="fas fa-chevron-down ml-1 text-xs transition-transform"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  toggleTask(taskId) {
    const completed = !Storage.isTaskCompleted(taskId);
    Storage.updateTaskProgress(taskId, completed);
    this.updateHeaderProgress();
    this.renderSidebar();

    if (this.currentPhase) {
      this.renderPhase(this.currentPhase);
    } else if (this.currentPage === 'overview') {
      this.renderOverview();
    }

    if (completed) {
      this.showToast('太棒了！又完成一个任务 🎉', 'success');
    } else {
      this.showToast('已取消完成标记', 'info');
    }
  },

  toggleTaskDetail(taskId) {
    const detail = document.getElementById(`task-detail-${taskId}`);
    const text = document.getElementById(`toggle-text-${taskId}`);
    const icon = document.getElementById(`toggle-icon-${taskId}`);
    
    if (detail.classList.contains('hidden')) {
      detail.classList.remove('hidden');
      text.textContent = '收起详情';
      icon.style.transform = 'rotate(180deg)';
    } else {
      detail.classList.add('hidden');
      text.textContent = '展开详情';
      icon.style.transform = 'rotate(0deg)';
    }
  },

  saveNote(taskId, value) {
    Storage.saveNote(taskId, value);

    // 有实质内容则自动勾选完成；清空笔记则取消完成（避免「填了还是 0%」）
    const hasContent = !!(value || '').trim();
    const wasCompleted = Storage.isTaskCompleted(taskId);
    if (hasContent && !wasCompleted) {
      Storage.updateTaskProgress(taskId, true);
      this.refreshProgressUI();
      this.showToast('笔记已保存，任务已标记完成', 'success');
    } else if (!hasContent && wasCompleted) {
      Storage.updateTaskProgress(taskId, false);
      this.refreshProgressUI();
      this.showToast('笔记已清空，任务取消完成', 'info');
    } else {
      this.refreshProgressUI();
      this.showToast('笔记已保存', 'success');
    }
  },

  /**
   * 刷新顶栏 + 侧栏进度；若在阶段页则重渲染阶段（保留展开状态较难，仅刷新数字场景用轻量更新）
   */
  refreshProgressUI(options = {}) {
    this.updateHeaderProgress();
    this.renderSidebar();
    if (options.rerenderPhase && this.currentPhase) {
      this.renderPhase(this.currentPhase);
    } else if (options.rerenderOverview && this.currentPage === 'overview') {
      this.renderOverview();
    } else if (this.currentPage === 'overview') {
      this.renderOverview();
    } else if (this.currentPhase && this.currentPage === 'phase') {
      // 轻量更新阶段页顶栏进度条数字
      this.patchPhaseProgressHeader(this.currentPhase);
    }
  },

  patchPhaseProgressHeader(phaseId) {
    const progress = Storage.getPhaseProgress(phaseId);
    const phase = WorkflowData.phases.find(p => p.id === phaseId);
    if (!phase) return;
    const root = document.getElementById('mainContent');
    if (!root) return;
    const badge = root.querySelector('.badge.badge-pink');
    if (badge) badge.textContent = `${progress.completed}/${progress.total} 完成`;
    const fill = root.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = `${progress.percentage}%`;
    const pct = root.querySelector('.text-sm.font-medium');
    if (pct && phase) pct.textContent = `${progress.percentage}%`;
  },

  /**
   * 打开导入选择：内置示例 / 本地文件夹 / 多文件
   */
  openImportProjectModal() {
    const modal = document.getElementById('importProjectModal');
    if (!modal) {
      this.showToast('导入面板未找到，请刷新页面', 'error');
      return;
    }
    modal.classList.remove('hidden');
  },

  chooseBuiltinProject() {
    const result = this.importBuiltinProjectPack({ force: false });
    if (result) {
      this.closeModal('importProjectModal');
    }
  },

  getImportMarkCompleted() {
    const el = document.getElementById('importMarkCompleted');
    return el ? !!el.checked : true;
  },

  pickLocalProjectFolder() {
    const input = document.getElementById('localPackFolderInput');
    if (!input) {
      this.showToast('当前浏览器不支持文件夹选择', 'error');
      return;
    }
    input.value = '';
    input.click();
  },

  pickLocalProjectFiles() {
    const input = document.getElementById('localPackFilesInput');
    if (!input) return;
    input.value = '';
    input.click();
  },

  async handleLocalPackFiles(e, options = {}) {
    const files = e.target?.files;
    if (!files || !files.length) return;

    this.closeModal('importProjectModal');
    this.showToast(options.fromFolder ? '正在解析文件夹…' : '正在解析文件…', 'info');

    try {
      if (typeof ProjectPacks === 'undefined' || !ProjectPacks.buildFromFileList) {
        this.showToast('本地导入模块未加载，请刷新页面', 'error');
        return;
      }

      const built = await ProjectPacks.buildFromFileList(files, {
        markCompleted: this.getImportMarkCompleted()
      });

      if (!built.ok) {
        this.showToast(built.error || '导入失败', 'error');
        return;
      }

      const hasAny = Object.keys(Storage.loadAllNotes()).length > 0;
      if (hasAny) {
        const ok = confirm(
          `将导入「${built.pack.name}」到 ${built.taskCount} 个任务笔记（读取 ${built.fileCount} 个文件）。\n` +
          `会覆盖同名任务已有笔记。\n\n确定导入吗？`
        );
        if (!ok) return;
      }

      const result = ProjectPacks.apply(built.pack, {
        overwrite: true,
        markCompleted: this.getImportMarkCompleted()
      });

      Storage.saveActivePackId(built.pack.id || `local_${Date.now()}`);
      // 记住最近本地包名，方便总览展示
      try {
        localStorage.setItem('manhua_drama_active_pack_name', built.pack.name || '本地剧本');
      } catch (_) { /* ignore */ }

      this.refreshProgressUI({ rerenderOverview: true, rerenderPhase: true });
      const overall = Storage.getOverallProgress();
      this.showToast(
        `本地导入成功：${result.filled} 个任务 · 进度 ${overall.completed}/${overall.total}`,
        'success'
      );
    } catch (err) {
      console.error(err);
      this.showToast(`导入失败：${err.message || err}`, 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  },

  /**
   * 一键导入内置示例全案（《球场心跳》）到各任务笔记，并勾选进度
   */
  importBuiltinProjectPack(options = {}) {
    if (typeof ProjectPack === 'undefined' || !ProjectPack?.notes) {
      this.showToast('未找到示例项目包 project-pack.js', 'error');
      return null;
    }

    const overwrite = options.overwrite !== false;
    const markCompleted = options.markCompleted !== undefined
      ? options.markCompleted
      : this.getImportMarkCompleted();

    if (overwrite && !options.force) {
      const hasAny = Object.keys(Storage.loadAllNotes()).length > 0;
      if (hasAny) {
        const ok = confirm(
          `将导入「${ProjectPack.name}」到全部 ${Object.keys(ProjectPack.notes).length} 个任务笔记。\n` +
          `默认会覆盖已有笔记，并把对应任务勾选为完成。\n\n确定导入吗？`
        );
        if (!ok) return null;
      }
    }

    const applyFn = (typeof ProjectPacks !== 'undefined' && ProjectPacks.apply)
      ? ProjectPacks.apply
      : (pack, opts) => ProjectPack.applyToStorage(opts);

    const result = applyFn(ProjectPack, { overwrite, markCompleted });
    Storage.saveActivePackId(ProjectPack.id);
    try {
      localStorage.setItem('manhua_drama_active_pack_name', ProjectPack.name);
    } catch (_) { /* ignore */ }

    this.refreshProgressUI({ rerenderOverview: true, rerenderPhase: true });

    const overall = Storage.getOverallProgress();
    this.showToast(
      `已导入 ${result.filled} 个任务笔记${result.skipped ? `（跳过 ${result.skipped}）` : ''} · 进度 ${overall.completed}/${overall.total}`,
      'success'
    );
    return result;
  },

  /**
   * 导入后跳到第一个阶段/任务，方便「开始执行」
   */
  startImportedProject() {
    const packId = Storage.getActivePackId();
    if (!packId) {
      // 尚未导入：打开选择面板，而不是强行灌内置
      this.openImportProjectModal();
      this.showToast('请先选择内置示例或本地剧本导入', 'info');
      return;
    }

    let startPhase = 'writing';
    if (typeof ProjectPack !== 'undefined' && packId === ProjectPack.id && ProjectPack.startPhaseId) {
      startPhase = ProjectPack.startPhaseId;
    }

    this.renderPhase(startPhase);

    const phase = WorkflowData.phases.find(p => p.id === startPhase);
    if (phase?.tasks?.length) {
      const firstOpen = phase.tasks.find(t => !Storage.isTaskCompleted(t.id)) || phase.tasks[0];
      setTimeout(() => {
        const detail = document.getElementById(`task-detail-${firstOpen.id}`);
        if (detail?.classList.contains('hidden')) {
          this.toggleTaskDetail(firstOpen.id);
        }
        detail?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }

    this.showToast('已进入执行流程，展开任务详情可查看导入内容', 'info');
  },

  renderToolLibrary() {
    const main = document.getElementById('mainContent');
    const categories = [
      { id: 'writing', name: 'AI写作', icon: 'fa-pen-fancy' },
      { id: 'drawing', name: 'AI绘画', icon: 'fa-palette' },
      { id: 'dubbing', name: 'AI配音/音乐', icon: 'fa-microphone' },
      { id: 'editing', name: '视频剪辑', icon: 'fa-film' },
      { id: 'publish', name: '设计/发布', icon: 'fa-rocket' },
      { id: 'all', name: '全部工具', icon: 'fa-toolbox' }
    ];
    
    main.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-text-primary mb-2">工具库 🛠️</h1>
          <p class="text-text-secondary">漫剧制作各环节推荐工具，小白也能快速上手</p>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-6">
          ${categories.map((cat, i) => `
            <button class="btn ${i === categories.length - 1 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App.filterTools('${cat.id}', this)">
              <i class="fas ${cat.icon} mr-1"></i>
              ${cat.name}
            </button>
          `).join('')}
        </div>
        
        <div id="toolGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this.renderToolCards(WorkflowData.tools)}
        </div>
      </div>
    `;
  },

  renderToolCards(tools) {
    return tools.map((tool, index) => `
      <div class="card card-lift cursor-pointer animate-slideInUp" style="animation-delay: ${index * 0.05}s" onclick="App.showToolDetail('${tool.id}')">
        <div class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-accent-2 flex items-center justify-center text-xl text-primary-dark">
              <i class="fas ${this.getToolIcon(tool.type)}"></i>
            </div>
            <span class="badge badge-pink">${tool.type}</span>
          </div>
          <h3 class="font-semibold text-text-primary mb-2">${tool.name}</h3>
          <p class="text-sm text-text-secondary line-clamp-2 mb-3">${tool.description}</p>
          <div class="flex items-center justify-between text-xs">
            <span class="text-text-light">
              <i class="fas fa-signal mr-1"></i>
              难度: ${'⭐'.repeat(tool.difficulty)}
            </span>
            <span class="text-text-light">
              <i class="fas fa-tag mr-1"></i>
              ${tool.freeLevel}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  },

  getToolIcon(type) {
    const icons = {
      'AI写作': 'fa-pen-fancy',
      'AI绘画': 'fa-palette',
      'AI配音': 'fa-microphone',
      'AI音乐': 'fa-music',
      '素材库': 'fa-folder-open',
      '视频剪辑': 'fa-film',
      '特效合成': 'fa-magic',
      '音频编辑': 'fa-sliders-h',
      '抠图工具': 'fa-cut',
      '图像处理': 'fa-image',
      '设计工具': 'fa-paint-brush'
    };
    return icons[type] || 'fa-tool';
  },

  filterTools(category, btn) {
    document.querySelectorAll('#toolGrid + button, #toolGrid ~ button').forEach(b => {
      // handled by re-render
    });
    
    let filtered = WorkflowData.tools;
    if (category !== 'all') {
      filtered = WorkflowData.tools.filter(t => t.category === category || t.phases.includes(category));
    }
    
    const grid = document.getElementById('toolGrid');
    grid.innerHTML = this.renderToolCards(filtered);
    
    document.querySelectorAll('.flex.flex-wrap.gap-2.mb-6 .btn').forEach(b => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
    });
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  },

  showToolDetail(toolId) {
    const tool = WorkflowData.tools.find(t => t.id === toolId);
    if (!tool) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'toolDetailModal';
    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal('toolDetailModal');
    };
    
    modal.innerHTML = `
      <div class="modal-content w-full max-w-lg">
        <div class="modal-header">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-accent-2 flex items-center justify-center text-primary-dark">
              <i class="fas ${this.getToolIcon(tool.type)}"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-text-primary">${tool.name}</h2>
              <span class="text-xs text-text-secondary">${tool.type}</span>
            </div>
          </div>
          <button class="modal-close" onclick="App.closeModal('toolDetailModal')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-text-secondary mb-4">${tool.description}</p>
          
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="badge badge-pink">难度: ${'⭐'.repeat(tool.difficulty)}</span>
            <span class="badge badge-green">${tool.freeLevel}</span>
          </div>
          
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text-primary mb-2">功能亮点</h4>
            <div class="flex flex-wrap gap-1">
              ${tool.features.map(f => `<span class="tag">${f}</span>`).join('')}
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text-primary mb-2">使用教程</h4>
            <div class="bg-accent-2 rounded-lg p-4 text-sm text-text-secondary whitespace-pre-line">${tool.tutorial}</div>
          </div>
          
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text-primary mb-2">小贴士</h4>
            <p class="text-sm text-text-secondary">${tool.tips}</p>
          </div>
          
          <a href="${tool.url}" target="_blank" class="btn btn-primary w-full">
            <i class="fas fa-external-link-alt mr-2"></i>
            打开官网
          </a>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  renderToolDetail(toolId) {
    this.renderPage('tools');
    setTimeout(() => this.showToolDetail(toolId), 100);
  },

  renderTemplates() {
    const main = document.getElementById('mainContent');
    const allTemplates = [];
    Object.entries(WorkflowData.templates).forEach(([phase, templates]) => {
      const phaseData = WorkflowData.phases.find(p => p.id === phase);
      templates.forEach(t => {
        allTemplates.push({ phase, phaseName: phaseData?.name || phase, ...t });
      });
    });
    
    main.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-text-primary mb-2">产出物模板 📄</h1>
          <p class="text-text-secondary">各阶段文档模板，一键复制直接用</p>
        </div>
        
        <div class="space-y-6">
          ${WorkflowData.phases.map(phase => {
            const phaseTemplates = WorkflowData.templates[phase.id] || [];
            if (phaseTemplates.length === 0) return '';
            
            return `
              <div>
                <h2 class="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <i class="fas ${phase.icon}" style="color: ${phase.color}"></i>
                  ${phase.name}
                </h2>
                <div class="space-y-3">
                  ${phaseTemplates.map((template, i) => `
                    <div class="card overflow-hidden">
                      <div class="p-4">
                        <div class="flex items-center justify-between mb-3">
                          <h3 class="font-medium text-text-primary">${template.name}</h3>
                          <button class="btn btn-primary btn-sm" onclick="App.copyTemplate(this)">
                            <i class="fas fa-copy mr-1"></i>
                            复制模板
                          </button>
                        </div>
                        <pre class="bg-accent-2 rounded-lg p-4 text-xs text-text-primary overflow-x-auto" style="max-height: 300px; overflow-y: auto;">${template.content}</pre>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  copyTemplate(btn) {
    const pre = btn.closest('.card').querySelector('pre');
    navigator.clipboard.writeText(pre.textContent).then(() => {
      this.showToast('模板已复制到剪贴板', 'success');
    });
  },

  updateHeaderProgress() {
    const overall = Storage.getOverallProgress();
    const ring = document.getElementById('headerProgressRing');
    const text = document.getElementById('headerProgressText');
    const detail = document.getElementById('headerProgressDetail');
    
    if (ring) {
      ring.style.strokeDashoffset = 251.2 - (251.2 * overall.percentage / 100);
    }
    if (text) {
      text.textContent = `${overall.percentage}%`;
    }
    if (detail) {
      detail.textContent = `${overall.completed} / ${overall.total} 任务`;
    }
  },

  openSettings() {
    this.renderConfigList();
    this.refreshDebugLogView();
    document.getElementById('settingsModal').classList.remove('hidden');
  },

  refreshDebugLogView() {
    const view = document.getElementById('debugLogView');
    if (!view) return;
    view.textContent = LLMChat.getLastDebugText();
  },

  copyDebugLog() {
    const text = LLMChat.getLastDebugText();
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('调试日志已复制', 'success');
    }).catch(() => {
      this.showToast('复制失败，请手动选择日志文本', 'error');
    });
  },

  clearDebugLog() {
    LLMChat.lastDebug = null;
    LLMChat.debugEntries = [];
    this.refreshDebugLogView();
    this.showToast('调试日志已清空', 'success');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
    const toolModal = document.getElementById('toolDetailModal');
    if (toolModal && modalId === 'toolDetailModal') {
      toolModal.remove();
    }
  },

  loadConfigPresets() {
    const select = document.getElementById('configPreset');
    select.innerHTML = '<option value="">选择预设...</option>' + 
      LLMConfig.presets.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  },

  applyPreset(presetId) {
    if (!presetId) return;
    const preset = LLMConfig.getPreset(presetId);
    if (!preset) return;

    document.getElementById('configBaseUrl').value = preset.baseUrl;
    document.getElementById('configModel').value = preset.model;
    document.getElementById('configRequestFormat').value = preset.requestFormat || 'auto';

    const modelInput = document.getElementById('configModel');
    if (presetId === 'doubao') {
      modelInput.placeholder = 'ep-xxxxxxxxx（火山引擎Ark推理点ID）';
    } else if (presetId === 'coding_plan_aliyun') {
      modelInput.placeholder = 'qwen3.5-plus / glm-5 / kimi-k2.5 等套餐模型';
    } else {
      modelInput.placeholder = preset.model || '模型名称';
    }

    if (!document.getElementById('configName').value) {
      document.getElementById('configName').value = preset.name;
    }
  },

  openConfigForm(configId = null) {
    const form = document.getElementById('configForm');
    form.reset();
    document.getElementById('configId').value = '';
    document.getElementById('configFormTitle').textContent = '添加配置';
    document.getElementById('configMaxTokens').value = '';
    document.getElementById('configRequestFormat').value = 'auto';

    if (configId) {
      const config = LLMConfig.getConfigs().find(c => c.id === configId);
      if (config) {
        document.getElementById('configId').value = config.id;
        document.getElementById('configName').value = config.name;
        document.getElementById('configBaseUrl').value = config.baseUrl;
        document.getElementById('configModel').value = config.model;
        document.getElementById('configApiKey').value = config.apiKey;
        document.getElementById('configMaxTokens').value = config.maxTokens || '';
        document.getElementById('configRequestFormat').value = config.requestFormat || 'auto';
        document.getElementById('configFormTitle').textContent = '编辑配置';
      }
    }

    document.getElementById('configFormModal').classList.remove('hidden');
  },

  saveConfig(e) {
    e.preventDefault();

    const id = document.getElementById('configId').value;
    const maxTokensRaw = document.getElementById('configMaxTokens').value.trim();
    const config = {
      name: document.getElementById('configName').value,
      baseUrl: document.getElementById('configBaseUrl').value.trim(),
      model: document.getElementById('configModel').value.trim(),
      apiKey: document.getElementById('configApiKey').value.trim(),
      maxTokens: maxTokensRaw ? parseInt(maxTokensRaw, 10) : null,
      requestFormat: document.getElementById('configRequestFormat').value || 'auto'
    };

    const validation = LLMConfig.validateConfig(config);
    if (!validation.valid) {
      this.showToast(validation.errors[0], 'error');
      return;
    }

    if (id) {
      LLMConfig.updateConfig(id, config);
      this.showToast('配置已更新', 'success');
    } else {
      const newConfig = { id: `config_${Date.now()}`, ...config, createdAt: new Date().toISOString() };
      LLMConfig.addConfig(newConfig);

      const configs = LLMConfig.getConfigs();
      if (configs.length === 1) {
        LLMConfig.setDefaultConfig(newConfig.id);
      }

      this.showToast('配置已添加', 'success');
    }

    this.closeModal('configFormModal');
    this.renderConfigList();
  },

  renderConfigList() {
    const configs = LLMConfig.getConfigs();
    const defaultConfig = LLMConfig.getDefaultConfig();
    const defaultId = defaultConfig?.id || Storage.getDefaultConfigId();
    const container = document.getElementById('configList');
    
    if (configs.length === 0) {
      container.innerHTML = `
        <div class="empty-state py-8">
          <i class="fas fa-robot text-4xl text-primary opacity-30 mb-3"></i>
          <p class="text-text-secondary">还没有配置大模型</p>
          <p class="text-sm text-text-light mt-1">点击"添加配置"开始使用AI创作</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = configs.map(config => `
      <div class="border border-border-light rounded-xl p-4 ${config.id === defaultId ? 'bg-accent-2/50 border-primary' : ''}">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-text-primary">${config.name}</h4>
            ${config.id === defaultId ? '<span class="badge badge-pink">默认</span>' : ''}
          </div>
          <div class="flex gap-1">
            <button class="p-1.5 hover:bg-green-50 rounded-lg text-green-500" onclick="App.testConfigConnection('${config.id}', this)" title="测试连接">
              <i class="fas fa-plug text-sm"></i>
            </button>
            ${config.id !== defaultId ? `<button class="p-1.5 hover:bg-accent-2 rounded-lg text-text-secondary" onclick="App.setDefaultConfig('${config.id}')" title="设为默认"><i class="fas fa-star text-sm"></i></button>` : ''}
            <button class="p-1.5 hover:bg-accent-2 rounded-lg text-text-secondary" onclick="App.editConfig('${config.id}')"><i class="fas fa-edit text-sm"></i></button>
            <button class="p-1.5 hover:bg-red-50 rounded-lg text-red-400" onclick="App.deleteConfig('${config.id}')"><i class="fas fa-trash text-sm"></i></button>
          </div>
        </div>
        <p class="text-xs text-text-secondary truncate">模型: ${config.model}</p>
        <p class="text-xs text-text-light truncate">${config.baseUrl}</p>
      </div>
    `).join('');
  },

  async testConfigConnection(configId, btn) {
    const config = LLMConfig.getConfigs().find(c => c.id === configId);
    if (!config) return;

    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
    btn.disabled = true;
    btn.classList.add('opacity-50');

    this.showToast('正在测试连接...（详情见设置里的调试日志）', 'info');

    const result = await LLMChat.testConfig(config);

    btn.innerHTML = originalIcon;
    btn.disabled = false;
    btn.classList.remove('opacity-50');

    this.renderConfigList();
    this.refreshDebugLogView();

    if (result.success) {
      const hint = result.hint ? `（${result.hint}）` : '';
      const reply = String(result.response || '').slice(0, 80);
      this.showToast(`连接成功！模型回复："${reply}"${hint}`, 'success');
    } else {
      // 错误可能很长，toast 截断，完整内容在调试日志
      const shortErr = String(result.error || '未知错误').slice(0, 180);
      this.showToast(`连接失败：${shortErr}\n完整日志见设置 → 调试日志`, 'error');
    }
  },

  setDefaultConfig(id) {
    LLMConfig.setDefaultConfig(id);
    this.renderConfigList();
    this.showToast('已设为默认配置', 'success');
  },

  editConfig(id) {
    this.openConfigForm(id);
  },

  deleteConfig(id) {
    if (!confirm('确定要删除这个配置吗？')) return;
    LLMConfig.deleteConfig(id);
    this.renderConfigList();
    this.showToast('配置已删除', 'success');
  },

  exportData() {
    const data = Storage.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `漫剧陪跑数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('数据已导出', 'success');
  },

  exportScript() {
    let md = '# 漫剧剧本\n\n';
    md += `> 导出时间：${new Date().toLocaleString()}\n\n`;
    md += '---\n\n';

    let hasContent = false;

    WorkflowData.phases.forEach(phase => {
      const phaseNotes = [];
      phase.tasks.forEach(task => {
        const note = Storage.getNote(task.id);
        if (note && note.trim()) {
          phaseNotes.push({ task, note });
        }
      });

      if (phaseNotes.length > 0) {
        hasContent = true;
        md += `## ${phase.icon} ${phase.name}\n\n`;
        phaseNotes.forEach(({ task, note }) => {
          md += `### ${task.name}\n\n`;
          md += `${note}\n\n`;
        });
        md += '---\n\n';
      }
    });

    if (!hasContent) {
      this.showToast('还没有笔记内容，先去填写任务笔记吧～', 'warning');
      return;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `漫剧剧本_${new Date().toLocaleDateString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('剧本已导出为 Markdown 文件', 'success');
  },

  importData() {
    document.getElementById('importFileInput').click();
  },

  handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = Storage.importAllData(event.target.result);
      if (success) {
        this.showToast('数据导入成功', 'success');
        this.updateHeaderProgress();
        this.renderSidebar();
        if (this.currentPhase) {
          this.renderPhase(this.currentPhase);
        } else {
          this.renderPage(this.currentPage);
        }
      } else {
        this.showToast('导入失败，请检查文件格式', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  resetProgress() {
    if (!confirm('确定要重置所有进度和笔记吗？此操作不可恢复。')) return;
    Storage.clearProgress();
    this.updateHeaderProgress();
    this.renderSidebar();
    if (this.currentPhase) {
      this.renderPhase(this.currentPhase);
    } else {
      this.renderPage(this.currentPage);
    }
    this.showToast('进度已重置', 'success');
  },

  resetOnboarding() {
    Storage.resetOnboarding();
    this.showToast('已重置新手引导', 'success');
    this.closeModal('settingsModal');
    this.showOnboarding();
  },

  openAIChat(taskId) {
    const task = LLMChat.findTaskById(taskId);
    if (!task) return;
    
    this.currentChatTask = taskId;
    this.chatHistory = [];
    
    const defaultConfig = LLMConfig.getDefaultConfig();
    if (!defaultConfig) {
      this.showToast('请先在设置中配置大模型API', 'warning');
      this.openSettings();
      return;
    }
    
    document.getElementById('chatTitle').textContent = `AI生成：${task.name}`;
    document.getElementById('chatSubtitle').textContent = task.shortDesc;
    
    const select = document.getElementById('promptTypeSelect');
    const promptList = Prompts.getPromptList();
    select.innerHTML = '<option value="general">自由对话</option>' + 
      promptList.map(p => `<option value="${p.id}" ${p.id === task.promptType ? 'selected' : ''}>${p.name}</option>`).join('');
    
    document.getElementById('chatMessages').innerHTML = `
      <div class="chat-message ai">
        <div class="chat-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="chat-bubble">
          <p>你好！我来帮你完成「${task.name}」这个任务 🎨</p>
          <p class="mt-2">告诉我你的想法，我来帮你生成内容～</p>
        </div>
      </div>
    `;
    
    document.getElementById('chatInput').value = '';
    document.getElementById('aiChatModal').classList.remove('hidden');
    document.getElementById('chatInput').focus();
  },

  sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    const defaultConfig = LLMConfig.getDefaultConfig();
    if (!defaultConfig) {
      this.showToast('请先配置大模型API', 'error');
      return;
    }
    
    const promptType = document.getElementById('promptTypeSelect').value;
    
    this.addChatMessage('user', message);
    input.value = '';
    
    const typingId = this.addTypingIndicator();
    
    document.getElementById('sendChatBtn').classList.add('hidden');
    document.getElementById('stopChatBtn').classList.remove('hidden');
    
    const userMsg = { role: 'user', content: message };
    this.chatHistory.push(userMsg);
    
    const messages = this.buildChatMessages(promptType, message);
    
    let fullText = '';
    LLMChat.streamChat(
      defaultConfig,
      messages,
      promptType,
      (chunk, text) => {
        fullText = text;
        // text 可能是思考状态（chunk 为空时）或累积正文
        this.updateLastAIMessage(typingId, text || '⏳ 生成中…');
      },
      () => {
        if (!fullText || !String(fullText).trim()) {
          this.updateLastAIMessage(
            typingId,
            '⚠️ 模型没有返回正文。可打开设置 → 调试日志查看详情，或再试一次 / 换模型。'
          );
        } else {
          this.chatHistory.push({ role: 'assistant', content: fullText });
          this.updateLastAIMessage(typingId, fullText);
        }
        document.getElementById('sendChatBtn').classList.remove('hidden');
        document.getElementById('stopChatBtn').classList.add('hidden');
      },
      (error) => {
        this.updateLastAIMessage(typingId, `❌ ${error.message}`);
        document.getElementById('sendChatBtn').classList.remove('hidden');
        document.getElementById('stopChatBtn').classList.add('hidden');
        this.showToast(`AI 调用失败：${String(error.message || '').slice(0, 120)}`, 'error');
      }
    );
  },

  buildChatMessages(promptType, userInput) {
    if (this.chatHistory.length <= 1) {
      return Prompts.buildMessages(promptType, { user_input: userInput });
    }
    
    const systemMsg = Prompts.buildMessages(promptType, { user_input: '' })[0];
    return [
      systemMsg,
      ...this.chatHistory
    ];
  },

  addChatMessage(role, content) {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role} animate-slideInUp`;
    msgDiv.innerHTML = `
      <div class="chat-avatar">
        <i class="fas ${role === 'ai' ? 'fa-robot' : 'fa-user'}"></i>
      </div>
      <div class="chat-bubble">
        <div class="whitespace-pre-wrap">${this.escapeHtml(content)}</div>
      </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return msgDiv;
  },

  addTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ai';
    msgDiv.id = 'ai-typing-' + Date.now();
    msgDiv.innerHTML = `
      <div class="chat-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="chat-bubble">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    return msgDiv.id;
  },

  updateLastAIMessage(typingId, content) {
    const typingEl = document.getElementById(typingId);
    if (!typingEl) return;
    
    const bubble = typingEl.querySelector('.chat-bubble');
    if (bubble) {
      bubble.innerHTML = `<div class="whitespace-pre-wrap">${this.escapeHtml(content)}</div>`;
    }
    
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
  },

  stopChat() {
    LLMChat.stopGeneration();
    document.getElementById('sendChatBtn').classList.remove('hidden');
    document.getElementById('stopChatBtn').classList.add('hidden');
    this.showToast('已停止生成', 'warning');
  },

  copyChatResult() {
    const messages = document.querySelectorAll('#chatMessages .chat-message.ai .chat-bubble');
    if (messages.length === 0) return;
    
    const lastMsg = messages[messages.length - 1];
    const text = lastMsg.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('已复制到剪贴板', 'success');
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showOnboarding() {
    this.onboardingStep = 0;
    this.updateOnboardingUI();
    document.getElementById('onboardingModal').classList.remove('hidden');
  },

  nextOnboardingStep() {
    const totalSteps = WorkflowData.onboardingSteps.length;
    this.onboardingStep++;
    
    if (this.onboardingStep >= totalSteps) {
      this.finishOnboarding();
    } else {
      this.updateOnboardingUI();
    }
  },

  updateOnboardingUI() {
    const step = WorkflowData.onboardingSteps[this.onboardingStep];
    if (!step) return;
    
    document.getElementById('onboardingTitle').textContent = step.title;
    document.getElementById('onboardingDesc').textContent = step.description;
    
    const dots = document.querySelectorAll('.onboarding-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('bg-primary', i <= this.onboardingStep);
      dot.classList.toggle('bg-border-light', i > this.onboardingStep);
    });
    
    const nextBtn = document.getElementById('onboardingNextBtn');
    if (this.onboardingStep === WorkflowData.onboardingSteps.length - 1) {
      nextBtn.innerHTML = '开始使用 <i class="fas fa-check ml-1"></i>';
    } else {
      nextBtn.innerHTML = '下一步 <i class="fas fa-arrow-right ml-1"></i>';
    }
  },

  skipOnboarding() {
    this.finishOnboarding();
  },

  finishOnboarding() {
    Storage.setOnboardingDone();
    document.getElementById('onboardingModal').classList.add('hidden');
  },

  toggleSidebar(force) {
    const sidebar = document.getElementById('sidebar');
    if (typeof force === 'boolean') {
      sidebar.classList.toggle('open', force);
    } else {
      sidebar.classList.toggle('open');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // 保证容器始终在 body 最末尾，避免被后续插入的 modal 盖住
    if (container.parentElement !== document.body || container.nextSibling) {
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas ${this.getToastIcon(type)}"></i>
        <span class="text-sm text-text-primary">${this.escapeHtml(String(message ?? ''))}</span>
      </div>
    `;
    container.appendChild(toast);

    const duration = type === 'error' ? 4500 : 2500;
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  getToastIcon(type) {
    const icons = {
      success: 'fa-check-circle text-green-500',
      error: 'fa-exclamation-circle text-red-500',
      warning: 'fa-exclamation-triangle text-yellow-500',
      info: 'fa-info-circle text-primary-dark'
    };
    return icons[type] || icons.info;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

document.addEventListener('click', (e) => {
  const modal = e.target.closest('.modal-overlay');
  if (modal && e.target === modal) {
    const id = modal.id;
    if (id === 'toolDetailModal') {
      modal.remove();
    } else {
      modal.classList.add('hidden');
    }
  }
});
