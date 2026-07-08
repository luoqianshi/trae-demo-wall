/**
 * WebMotion - 主应用控制器
 * 整合 AI 生成、代码编辑、可视化编辑三种模式
 */
const App = (function() {
  let isUpdatingFromScene = 0; // 防止 loadProject 触发 onChange 的冗余渲染（支持嵌套调用）
  let lastActiveSceneIndex = -1; // 跟踪上次的活动场景索引，用于检测场景切换时自动 seek

  /** 渲染当前帧（消除 Timeline.getCurrentTime + Preview.renderFrame 的重复） */
  function renderCurrentFrame() {
    Preview.renderFrame(Timeline.getCurrentTime());
  }

  /** 获取当前项目快照（用于撤销/重做） */
  function getProjectSnapshot() {
    return UndoManager.snapshot(SceneManager.exportProject());
  }

  /** 推送撤销状态并更新按钮 */
  function pushUndoState() {
    UndoManager.push(getProjectSnapshot());
    updateUndoRedoButtons();
  }

  /** 更新撤销/重做按钮可用状态 */
  function updateUndoRedoButtons() {
    const state = UndoManager.getState();
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.classList.toggle('disabled', !state.canUndo);
    if (btnRedo) btnRedo.classList.toggle('disabled', !state.canRedo);
  }

  /** 执行撤销 */
  function performUndo() {
    const restored = UndoManager.undo(getProjectSnapshot());
    if (restored) {
      isUpdatingFromScene++;
      SceneManager.loadProject(restored);
      Preview.invalidateCache();
      syncActiveScene();
      renderSceneTimeline(); // 撤销后刷新场景时间轴 UI
      Timeline.seekTo(0);
      isUpdatingFromScene--;
      updateUndoRedoButtons();
      showToast('已撤销', 'info');
    }
  }

  /** 执行重做 */
  function performRedo() {
    const restored = UndoManager.redo(getProjectSnapshot());
    if (restored) {
      isUpdatingFromScene++;
      SceneManager.loadProject(restored);
      Preview.invalidateCache();
      syncActiveScene();
      renderSceneTimeline(); // 重做后刷新场景时间轴 UI
      Timeline.seekTo(0);
      isUpdatingFromScene--;
      updateUndoRedoButtons();
      showToast('已重做', 'info');
    }
  }

  /** 加载项目数据的统一流程 */
  function loadProjectData(data) {
    SceneManager.loadProject(data);
    Preview.invalidateCache();
    syncActiveScene();
    Timeline.seekTo(0); // seekTo 触发 onTickCallback，自动渲染
  }

  function init() {
    // 初始化各模块
    AI.loadConfig();
    AssetManager.init();
    SceneManager.init();
    Editor.init();
    Preview.init();
    VisualEditor.init();
    Timeline.init();
    BrandKit.init();
    bindEvents();
    bindSceneChanges();
    bindIterateEdit();
    bindBrandKit();
    updateAIStatus();
    renderSceneTimeline();
    Preview.renderFrame(0);
    restoreEffectStates(); // 在首次渲染后恢复，避免渲染过程清除 canvas CSS 类

    window.addEventListener('resize', () => Preview.fitCanvasToStage());

    // 时间轴回调
    Timeline.setOnTick(t => {
      Preview.renderFrame(t);
    });

    // 代码编辑器自动编译
    let compileTimer = null;
    document.getElementById('code-js').addEventListener('input', () => {
      clearTimeout(compileTimer);
      compileTimer = setTimeout(() => {
        const scene = SceneManager.getActiveScene();
        if (scene) {
          SceneManager.updateActiveScene({ code: document.getElementById('code-js').value });
          renderCurrentFrame();
        }
      }, 300);
    });

    console.log('%cWebMotion 已启动（增强版）', 'color: #c9a96e; font-size: 16px; font-weight: bold;');
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    // 面板折叠/展开
    document.querySelectorAll('.panel-section h3').forEach(h3 => {
      h3.addEventListener('click', () => {
        h3.parentElement.classList.toggle('collapsed');
      });
    });

    // 分辨率
    document.getElementById('select-resolution').addEventListener('change', e => {
      const [w, h] = e.target.value.split('x').map(Number);
      Preview.setResolution(w, h);
      renderCurrentFrame();
    });

    // 导出
    document.getElementById('btn-export').addEventListener('click', () => showModal('export-modal'));
    document.getElementById('btn-close-export').addEventListener('click', () => hideModal('export-modal'));
    document.getElementById('btn-cancel-export').addEventListener('click', () => hideModal('export-modal'));
    document.getElementById('btn-start-export').addEventListener('click', startExport);

    // 导出格式切换时显示/隐藏 GIF 背景色选项
    document.querySelectorAll('input[name="format"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const isGif = document.querySelector('input[name="format"]:checked').value === 'gif';
        document.getElementById('gif-bg-option').style.display = isGif ? 'flex' : 'none';
      });
    });

    // 设置
    document.getElementById('btn-settings').addEventListener('click', openSettings);
    document.getElementById('btn-close-settings').addEventListener('click', () => hideModal('settings-modal'));
    document.getElementById('btn-cancel-settings').addEventListener('click', () => hideModal('settings-modal'));
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

    // 历史记录
    document.getElementById('btn-history').addEventListener('click', () => { renderHistoryList(); showModal('history-modal'); });
    document.getElementById('btn-close-history').addEventListener('click', () => hideModal('history-modal'));
    document.getElementById('btn-clear-history').addEventListener('click', () => {
      ProjectHistory.clearAll();
      renderHistoryList();
      showToast('历史记录已清空', 'info');
    });
    document.getElementById('btn-import-project').addEventListener('click', () => document.getElementById('file-import-project').click());
    document.getElementById('file-import-project').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = await ProjectHistory.importFromFile(file);
        loadProjectData(data);
        hideModal('history-modal');
        showToast(`已导入项目（${data.scenes.length} 个场景）`, 'success');
      } catch (err) {
        showToast('导入失败: ' + err.message, 'error');
      }
      e.target.value = ''; // 重置以便重复导入同一文件
    });

    // AI 生成
    document.getElementById('btn-ai-generate').addEventListener('click', () => generateFromAI());
    document.getElementById('btn-ai-assist').addEventListener('click', aiAssistSingle);

    // 3D 模式切换（含容错提示）
    document.getElementById('chk-3d-mode').addEventListener('change', (e) => {
      const scene = SceneManager.getActiveScene();
      if (scene) {
        if (e.target.checked && !ThreeRenderer.isAvailable()) {
          // Three.js 不可用 — 提示用户并回退
          e.target.checked = false;
          const err = ThreeRenderer.getInitError ? ThreeRenderer.getInitError() : 'Three.js 未加载';
          showToast('3D 模式不可用：' + err + '，已保持 2D 模式', 'error');
          return;
        }
        pushUndoState(); // 在修改前推送撤销状态
        SceneManager.updateActiveScene({ is3D: e.target.checked });
        Preview.invalidateCache();
        renderCurrentFrame();
        showToast(e.target.checked ? '已启用 3D 模式' : '已切换到 2D 模式', 'info');
      }
    });

    // 预览背景切换（跳过效果开关按钮：noise/glow/hue-rotate）
    document.querySelectorAll('.bg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.dataset.bg) return; // 效果开关按钮自带 onclick，不参与背景互斥
        document.querySelectorAll('.bg-btn').forEach(b => {
          if (b.dataset.bg) b.classList.remove('active');
        });
        btn.classList.add('active');
        const wrapper = document.getElementById('canvas-wrapper');
        wrapper.classList.remove('bg-black', 'bg-white');
        if (btn.dataset.bg === 'black') wrapper.classList.add('bg-black');
        else if (btn.dataset.bg === 'white') wrapper.classList.add('bg-white');
      });
    });

    // 场景管理
    document.getElementById('btn-add-scene').addEventListener('click', () => {
      pushUndoState();
      SceneManager.addScene({ name: `场景 ${SceneManager.getScenes().length + 1}`, code: '', duration: 3 });
      showToast('已添加新场景', 'success');
    });

    // 项目保存/加载
    document.getElementById('btn-save-project').addEventListener('click', saveProject);
    document.getElementById('btn-load-project').addEventListener('click', loadProject);

    // 撤销/重做按钮
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.addEventListener('click', performUndo);
    if (btnRedo) btnRedo.addEventListener('click', performRedo);

    // Modal 背景关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
    });

    // 键盘快捷键
    document.addEventListener('keydown', e => {
      if (isInEditor(e.target)) {
        // 在编辑器中仍允许 Ctrl+Z / Ctrl+Y
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
          // 让编辑器原生撤销优先，不阻止默认行为
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
          return;
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) performRedo();
        else performUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        performRedo();
      } else if (e.code === 'Space') {
        e.preventDefault();
        Timeline.isPlayingState() ? Timeline.pause() : Timeline.play();
      } else if (e.code === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (Timeline.isPlayingState()) Timeline.pause();
        const fps = Timeline.getFps();
        Timeline.seekTo(Math.max(0, Timeline.getCurrentTime() - 1 / fps));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (Timeline.isPlayingState()) Timeline.pause();
        const fps = Timeline.getFps();
        Timeline.seekTo(Timeline.getCurrentTime() + 1 / fps);
      }
    });
  }

  function isInEditor(el) {
    return el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';
  }

  /** 同步当前场景到 UI */
  function syncActiveScene() {
    const scene = SceneManager.getActiveScene();
    if (scene) {
      document.getElementById('code-js').value = scene.code || '';
      document.getElementById('chk-3d-mode').checked = scene.is3D || false;
    }
    Preview.invalidateCache();
    renderCurrentFrame();
  }

  // ===== 对话式迭代编辑 =====
  function bindIterateEdit() {
    const btn = document.getElementById('btn-iterate');
    const input = document.getElementById('iterate-input');
    if (!btn || !input) return;

    btn.addEventListener('click', async () => {
      const instruction = input.value.trim();
      if (!instruction) {
        showToast('请输入迭代指令', 'warning');
        return;
      }
      const scene = SceneManager.getActiveScene();
      if (!scene) {
        showToast('没有活动场景', 'warning');
        return;
      }
      if (!scene.code || !scene.code.trim()) {
        showToast('当前场景没有代码，无法迭代', 'warning');
        return;
      }
      if (!AI.isConfigured()) {
        showToast('请先在设置中配置 AI API Key', 'warning');
        return;
      }

      btn.disabled = true;
      btn.textContent = '迭代中...';
      input.disabled = true;

      try {
        const newCode = await AI.iterateScene(scene.code, instruction, {
          is3D: scene.is3D,
          duration: scene.duration
        });
        // 更新场景代码
        SceneManager.updateActiveScene({ code: newCode });
        document.getElementById('code-js').value = newCode;
        Preview.invalidateCache();
        renderCurrentFrame();
        showToast('迭代修改完成', 'success');
        input.value = '';
      } catch (e) {
        showToast('迭代失败: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '迭代修改';
        input.disabled = false;
      }
    });

    // 回车触发
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }

  // ===== 品牌套件 =====
  function bindBrandKit() {
    const btnOpen = document.getElementById('btn-brand-kit');
    const btnClose = document.getElementById('btn-close-brand-kit');
    const modal = document.getElementById('brand-kit-modal');
    if (!btnOpen || !modal) return;

    btnOpen.addEventListener('click', () => {
      renderBrandKitUI();
      showModal('brand-kit-modal');
    });
    if (btnClose) btnClose.addEventListener('click', () => hideModal('brand-kit-modal'));

    // 添加颜色
    const btnAddColor = document.getElementById('btn-add-brand-color');
    const colorPicker = document.getElementById('brand-color-picker');
    const hexInput = document.getElementById('brand-color-hex');
    if (btnAddColor) {
      btnAddColor.addEventListener('click', () => {
        const hex = (hexInput.value.trim() || colorPicker.value).toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(hex)) {
          BrandKit.addColor(hex);
          hexInput.value = '';
          renderBrandKitUI();
        }
      });
    }

    // 主色选择
    const primaryPicker = document.getElementById('brand-primary-picker');
    if (primaryPicker) {
      primaryPicker.addEventListener('input', () => {
        BrandKit.setPrimaryColor(primaryPicker.value);
        document.getElementById('brand-primary-text').textContent = primaryPicker.value;
      });
    }

    // 字体
    const fontInput = document.getElementById('brand-font-input');
    if (fontInput) {
      fontInput.addEventListener('change', () => {
        BrandKit.setFont(fontInput.value.trim());
      });
    }

    // 一键换色
    const btnApplyAll = document.getElementById('btn-apply-brand-all');
    if (btnApplyAll) {
      btnApplyAll.addEventListener('click', () => {
        const kit = BrandKit.getKit();
        if (!kit.colors || kit.colors.length === 0) {
          showToast('请先添加品牌颜色', 'warning');
          return;
        }
        BrandKit.applyToAllScenes();
        Preview.invalidateCache();
        renderCurrentFrame();
        // 同步代码编辑器
        const scene = SceneManager.getActiveScene();
        if (scene) document.getElementById('code-js').value = scene.code || '';
        showToast('已应用到全部场景', 'success');
      });
    }

    // 仅当前场景
    const btnApplyCurrent = document.getElementById('btn-apply-brand-current');
    if (btnApplyCurrent) {
      btnApplyCurrent.addEventListener('click', () => {
        const idx = SceneManager.getActiveIndex();
        const kit = BrandKit.getKit();
        if (!kit.colors || kit.colors.length === 0) {
          showToast('请先添加品牌颜色', 'warning');
          return;
        }
        BrandKit.applyToScene(idx);
        Preview.invalidateCache();
        renderCurrentFrame();
        const scene = SceneManager.getActiveScene();
        if (scene) document.getElementById('code-js').value = scene.code || '';
        showToast('已应用到当前场景', 'success');
      });
    }

    // 导出品牌套件
    const btnExport = document.getElementById('btn-export-brand-kit');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const json = BrandKit.exportKit();
        const blob = new Blob([json], { type: 'application/json' });
        Utils.downloadBlob(blob, 'brand-kit.json');
        showToast('品牌套件已导出', 'success');
      });
    }

    // 导入品牌套件
    const btnImport = document.getElementById('btn-import-brand-kit');
    const fileImport = document.getElementById('file-import-brand-kit');
    if (btnImport && fileImport) {
      btnImport.addEventListener('click', () => fileImport.click());
      fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (BrandKit.importKit(ev.target.result)) {
            renderBrandKitUI();
            showToast('品牌套件已导入', 'success');
          } else {
            showToast('导入失败：格式错误', 'error');
          }
        };
        reader.readAsText(file);
        fileImport.value = '';
      });
    }
  }

  /** 渲染品牌套件 UI */
  function renderBrandKitUI() {
    const kit = BrandKit.getKit();
    const list = document.getElementById('brand-colors-list');
    if (!list) return;
    list.innerHTML = '';
    if (!kit.colors || kit.colors.length === 0) {
      list.innerHTML = '<span style="color:var(--muted);font-size:12px;padding:4px;">暂无品牌颜色</span>';
    } else {
      kit.colors.forEach((color) => {
        const swatch = document.createElement('div');
        swatch.style.cssText = `width:28px;height:28px;border-radius:4px;background:${color};cursor:pointer;border:2px solid rgba(255,255,255,0.2);position:relative;`;
        swatch.title = color + ' (点击删除)';
        swatch.addEventListener('click', () => {
          BrandKit.removeColor(color);
          renderBrandKitUI();
        });
        list.appendChild(swatch);
      });
    }
    const primaryPicker = document.getElementById('brand-primary-picker');
    const primaryText = document.getElementById('brand-primary-text');
    if (primaryPicker && kit.primaryColor) {
      primaryPicker.value = kit.primaryColor;
      primaryText.textContent = kit.primaryColor;
    }
    const fontInput = document.getElementById('brand-font-input');
    if (fontInput) fontInput.value = kit.font || '';
  }

  // ===== 场景管理 =====
  function bindSceneChanges() {
    SceneManager.onChange(() => {
      // 跳过由 onElementsChange 触发的反馈循环
      if (isUpdatingFromScene > 0) return;

      // 检测活动场景切换：自动 seek 到新场景起始时间，避免 renderCurrentFrame
      // 渲染错误场景导致 VisualEditor 元素被覆盖清空
      const currentIdx = SceneManager.getActiveIndex();
      if (currentIdx !== lastActiveSceneIndex) {
        lastActiveSceneIndex = currentIdx;
        Timeline.seekTo(SceneManager.getSceneStartTime(currentIdx));
      }

      renderSceneTimeline();
      Timeline.updateDisplay ? Timeline.updateDisplay() : null;
      renderCurrentFrame();

      // 始终同步代码编辑器
      const scene = SceneManager.getActiveScene();
      if (scene) {
        document.getElementById('code-js').value = scene.code || '';
        document.getElementById('chk-3d-mode').checked = scene.is3D || false;
      }
    });


  }

  // 场景转场图标映射
  const TRANSITION_ICONS = {
    'none': '⏸️',
    'fade': '🌗',
    'slideLeft': '⬅️',
    'slideRight': '➡️',
    'slideUp': '⬆️',
    'slideDown': '⬇️',
    'wipe': '🧹',
    'zoom': '🔍',
    'iris': '⭕'
  };
  const TRANSITION_ORDER = ['none', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'wipe', 'zoom', 'iris'];
  const TRANSITION_NAMES = {
    'none': '无转场',
    'fade': '淡入淡出',
    'slideLeft': '左滑',
    'slideRight': '右滑',
    'slideUp': '上滑',
    'slideDown': '下滑',
    'wipe': '擦除',
    'zoom': '缩放',
    'iris': '圆形展开'
  };

  function getTransitionIcon(transition) {
    return TRANSITION_ICONS[transition] || TRANSITION_ICONS['fade'];
  }

  function renderSceneTimeline() {
    const track = document.getElementById('scene-track');
    const scenes = SceneManager.getScenes();
    const activeIdx = SceneManager.getActiveIndex();
    track.innerHTML = '';

    scenes.forEach((scene, i) => {
      const block = document.createElement('div');
      block.className = 'scene-block' + (i === activeIdx ? ' active' : '');
      block.draggable = true;
      block.dataset.index = i;
      block.innerHTML = `
        <div class="scene-name" title="双击重命名">${scene.name}</div>
        <div class="scene-meta">
          <span class="scene-duration" title="双击编辑时长">${scene.duration}s</span>
          <span class="scene-transition-btn" title="点击切换转场效果" data-index="${i}">${getTransitionIcon(scene.transition)}</span>
          ${scene.is3D ? '<span class="scene-3d-badge">3D</span>' : ''}
        </div>
        <div class="scene-actions">
          <span class="scene-duplicate" title="复制场景">⧉</span>
          ${scenes.length > 1 ? '<span class="scene-delete" title="删除">✕</span>' : ''}
        </div>
      `;

      // 点击选中场景
      block.addEventListener('click', e => {
        if (e.target.classList.contains('scene-delete')) {
          pushUndoState();
          SceneManager.removeScene(i);
          return;
        }
        if (e.target.classList.contains('scene-duplicate')) {
          pushUndoState();
          duplicateScene(i);
          return;
        }
        if (e.target.classList.contains('scene-transition-btn')) {
          pushUndoState();
          // 循环切换转场效果
          const currentTrans = scene.transition || 'fade';
          const currentIdx = TRANSITION_ORDER.indexOf(currentTrans);
          const nextIdx = (currentIdx + 1) % TRANSITION_ORDER.length;
          const nextTrans = TRANSITION_ORDER[nextIdx];
          SceneManager.updateScene(i, { transition: nextTrans });
          showToast(`转场: ${TRANSITION_NAMES[nextTrans]}`, 'info');
          return;
        }
        if (e.target.classList.contains('scene-name') || e.target.classList.contains('scene-duration')) {
          return; // 由 dblclick 处理
        }
        // 先 seekTo 再 setActiveIndex，确保 onChange 回调中的 renderCurrentFrame
        // 使用正确的时间点渲染，避免在旧时间渲染错误场景导致元素被清空
        Timeline.seekTo(SceneManager.getSceneStartTime(i));
        SceneManager.setActiveIndex(i);
      });

      // 双击重命名
      const nameEl = block.querySelector('.scene-name');
      nameEl.addEventListener('dblclick', e => {
        e.stopPropagation();
        showPrompt('场景名称', scene.name, (newName) => {
          if (newName && newName.trim()) {
            SceneManager.updateScene(i, { name: newName.trim() });
          }
        });
      });

      // 双击编辑时长
      const durEl = block.querySelector('.scene-duration');
      durEl.addEventListener('dblclick', e => {
        e.stopPropagation();
        showPrompt('场景时长（秒）', String(scene.duration), (newDur) => {
          if (newDur) {
            const dur = parseFloat(newDur);
            if (dur > 0 && dur <= 60) {
              SceneManager.updateScene(i, { duration: dur });
              Timeline.seekTo(Timeline.getCurrentTime());
            } else {
              showToast('时长必须在 0-60 秒之间', 'error');
            }
          }
        });
      });

      // 拖拽排序
      block.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', i);
        block.style.opacity = '0.5';
      });
      block.addEventListener('dragend', () => {
        block.style.opacity = '1';
      });
      block.addEventListener('dragover', e => {
        e.preventDefault();
        block.style.borderTop = '2px solid var(--accent)';
      });
      block.addEventListener('dragleave', () => {
        block.style.borderTop = '';
      });
      block.addEventListener('drop', e => {
        e.preventDefault();
        block.style.borderTop = '';
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        const toIdx = i;
        if (fromIdx !== toIdx) {
          pushUndoState();
          SceneManager.moveScene(fromIdx, toIdx);
          Timeline.seekTo(0); // 拖拽排序后重置时间轴，避免游标指向错误场景
        }
      });

      track.appendChild(block);
    });
  }

  function duplicateScene(index) {
    const scenes = SceneManager.getScenes();
    const source = scenes[index];
    if (!source) return;
    SceneManager.insertScene(index + 1, {
      name: source.name + ' 副本',
      code: source.code,
      is3D: source.is3D,
      duration: source.duration,
      elements: JSON.parse(JSON.stringify(source.elements || [])),
      description: source.description,
      transition: source.transition,
      transitionDuration: source.transitionDuration
    });
    showToast('已复制场景', 'success');
  }

  // ===== AI 生成 =====
  async function generateFromAI() {
    const text = document.getElementById('ai-text-input').value.trim();
    if (!text) { showToast('请输入文案', 'error'); return; }

    if (!AI.isConfigured()) {
      showToast('请先在设置中配置 AI API Key', 'error');
      return;
    }

    // 在修改前推送撤销状态
    pushUndoState();

    const sceneCount = document.getElementById('ai-scene-count').value;
    const style = document.getElementById('ai-style').value;
    const btn = document.getElementById('btn-ai-generate');

    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
      const result = await AI.generateAnimation(text, { sceneCount, style }, (msg) => {
        btn.textContent = msg;
      });

      // 清空现有场景，加载 AI 生成的场景
      SceneManager.clearAll();
      result.scenes.forEach((s, i) => {
        const sceneData = {
          name: s.name, code: s.code, duration: s.duration,
          description: s.description, is3D: s.is3D || false,
          transition: s.transition || 'fade',
          transitionDuration: s.transitionDuration || 0.5,
          elements: s.elements || []
        };
        if (i === 0) {
          SceneManager.updateScene(0, sceneData);
        } else {
          SceneManager.addScene(sceneData);
        }
      });

      // AI 生成后同步编辑器
      SceneManager.setActiveIndex(0);
      syncActiveScene();
      Timeline.seekTo(0);
      Timeline.play();

      // 自动保存到历史记录（含缩略图）
      try {
        const projectData = SceneManager.exportProject();
        const thumbnail = Preview.captureThumbnail();
        ProjectHistory.save(projectData, text, result.summary, thumbnail);
      } catch (e) {
        console.warn('自动保存历史失败:', e);
      }

      showToast(`AI 生成了 ${result.scenes.length} 个场景！`, 'success');

    } catch (e) {
      showToast('生成失败: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '生成 MG 动画';
    }
  }

  async function aiAssistSingle() {
    if (!AI.isConfigured()) {
      showToast('请先在设置中配置 AI API', 'error');
      return;
    }

    showPrompt('描述你想要的动画效果', '', async (description) => {
      if (!description) return;

      showToast('AI 生成中...', 'info');
      try {
        const code = await AI.generateSingleAnimation(description);
        document.getElementById('code-js').value = code;
        SceneManager.updateActiveScene({ code });
        Preview.compileUserCode(code);
        renderCurrentFrame();
        showToast('AI 已生成动画代码！', 'success');
      } catch (e) {
        showToast('生成失败: ' + e.message, 'error');
      }
    });
  }

  // ===== 设置 =====
  function openSettings() {
    const config = AI.getConfig();
    document.getElementById('setting-baseurl').value = config.baseUrl;
    document.getElementById('setting-apikey').value = config.apiKey;
    document.getElementById('setting-model').value = config.model;
    document.getElementById('setting-temp').value = config.temperature;
    showModal('settings-modal');
  }

  function saveSettings() {
    AI.setConfig({
      baseUrl: document.getElementById('setting-baseurl').value,
      apiKey: document.getElementById('setting-apikey').value,
      model: document.getElementById('setting-model').value,
      temperature: parseFloat(document.getElementById('setting-temp').value) || 0.7
    });
    updateAIStatus();
    hideModal('settings-modal');
    showToast('设置已保存', 'success');
  }

  function updateAIStatus() {
    const status = document.getElementById('ai-status');
    const hint = document.getElementById('ai-config-hint');
    if (AI.isConfigured()) {
      status.classList.add('configured');
      status.querySelector('.status-text').textContent = 'API 已配置';
      hint.textContent = `模型: ${AI.getConfig().model}`;
    } else {
      status.classList.remove('configured');
      status.querySelector('.status-text').textContent = '未配置 API';
      hint.textContent = '点击右上角「设置」配置 AI API Key';
    }
  }

  // ===== 导出 =====
  async function startExport() {
    const formatRadio = document.querySelector('input[name="format"]:checked');
    if (!formatRadio) {
      showToast('请选择导出格式', 'error');
      return;
    }
    const format = formatRadio.value;
    const allScenes = document.getElementById('chk-all-scenes').checked;
    const progressDiv = document.getElementById('export-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const btnStart = document.getElementById('btn-start-export');

    // 预估帧数和时间
    const { width, height } = Preview.getSize();
    const fps = Timeline.getFps();
    const scenes = allScenes ? SceneManager.getScenes() : [SceneManager.getActiveScene()];
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));
    const useWebCodecs = (format === 'webm' && Exporter.isWebCodecsSupported());
    const estimatedSeconds = Exporter.estimateExportTime(format, totalFrames, useWebCodecs);

    // 显示预估值
    progressDiv.style.display = 'block';
    progressText.textContent = `准备导出 ${totalFrames} 帧（约 ${estimatedSeconds} 秒）${useWebCodecs ? ' [WebCodecs 加速]' : ''}`;
    btnStart.disabled = true;
    btnStart.textContent = '导出中...';
    Timeline.pause();

    const exportStartTime = performance.now();

    try {
      const onProgress = (ratio, current, total) => {
        progressFill.style.width = (ratio * 100) + '%';
        const elapsed = (performance.now() - exportStartTime) / 1000;
        const speed = current > 0 ? (current / elapsed).toFixed(1) : '0';
        progressText.textContent = `渲染中... ${current} / ${total} 帧 (${Math.round(ratio * 100)}%) | 速度: ${speed} fps`;
      };

      let blob, filename;
      const filmGrain = document.getElementById('chk-film-grain') ? document.getElementById('chk-film-grain').checked : false;
      const noise = NoiseOverlay.isEnabled();

      if (format === 'png') {
        blob = await Exporter.exportPNGSequence(allScenes, onProgress, { filmGrain, noise });
        filename = `webmotion_${Date.now()}.zip`;
      } else if (format === 'webm') {
        // 优先使用 WebCodecs（更快），不支持时回退到 MediaRecorder
        if (useWebCodecs) {
          try {
            blob = await Exporter.exportWebCodecs(allScenes, onProgress, { filmGrain, noise });
          } catch (wcErr) {
            console.warn('WebCodecs 导出失败，回退到 MediaRecorder:', wcErr.message);
            progressText.textContent = 'WebCodecs 不可用，使用 MediaRecorder...';
            blob = await Exporter.exportWebM(allScenes, onProgress, { filmGrain, noise });
          }
        } else {
          blob = await Exporter.exportWebM(allScenes, onProgress, { filmGrain, noise });
        }
        filename = `webmotion_${Date.now()}.webm`;
      } else {
        const bgColor = document.getElementById('gif-bg-color').value;
        blob = await Exporter.exportGIF(allScenes, onProgress, { bgColor, filmGrain, noise });
        filename = `webmotion_${Date.now()}.gif`;
      }

      const actualSeconds = ((performance.now() - exportStartTime) / 1000).toFixed(1);
      progressText.textContent = '下载中...';
      Utils.downloadBlob(blob, filename);
      progressFill.style.width = '100%';
      progressText.textContent = `导出完成！耗时 ${actualSeconds} 秒（预估 ${estimatedSeconds} 秒）`;
      showToast(`导出成功！耗时 ${actualSeconds} 秒`, 'success');

      setTimeout(() => {
        hideModal('export-modal');
        progressDiv.style.display = 'none';
        progressFill.style.width = '0%';
      }, 2500);

    } catch (e) {
      progressText.textContent = '导出失败: ' + e.message;
      showToast('导出失败: ' + e.message, 'error');
    } finally {
      btnStart.disabled = false;
      btnStart.textContent = '开始导出';
    }
  }

  // ===== 项目保存/加载 =====
  function saveProject() {
    const data = SceneManager.exportProject();
    const thumbnail = Preview.captureThumbnail();
    ProjectHistory.exportToFile(data, `webmotion_project_${Date.now()}`);
    ProjectHistory.save(data, '', '手动保存', thumbnail);
    showToast('项目已保存到文件和历史记录', 'success');
  }

  function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.webmotion.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      ProjectHistory.importFromFile(file).then(data => {
        loadProjectData(data);
        showToast('项目已加载', 'success');
      }).catch(err => {
        showToast('加载失败: ' + err.message, 'error');
      });
    };
    input.click();
  }

  // ===== 历史记录 =====
  function renderHistoryList() {
    const list = document.getElementById('history-list');
    const history = ProjectHistory.getAll();

    if (history.length === 0) {
      list.innerHTML = '<p class="panel-hint" style="text-align:center;padding:40px 0;">暂无历史记录<br>AI 生成动画后会自动保存到这里</p>';
      return;
    }

    list.innerHTML = history.map(r => {
      const date = new Date(r.createdAt);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      const thumbHtml = r.thumbnail
        ? `<div class="history-item-thumb"><img src="${r.thumbnail}" alt="预览" loading="lazy"></div>`
        : '<div class="history-item-thumb history-item-nothumb"><span>🎬</span></div>';
      return `
        <div class="history-item" data-id="${r.id}">
          ${thumbHtml}
          <div class="history-item-info">
            <div class="history-item-name">${r.name || '未命名'}</div>
            <div class="history-item-meta">${dateStr} · ${r.sceneCount || 0} 个场景${r.summary ? ' · ' + r.summary : ''}</div>
          </div>
          <div class="history-item-actions">
            <button class="btn btn-small btn-ghost" data-action="load">加载</button>
            <button class="btn btn-small btn-ghost" data-action="export">导出</button>
            <button class="btn btn-small btn-ghost" data-action="delete">删除</button>
          </div>
        </div>
      `;
    }).join('');

    // 绑定按钮事件
    list.querySelectorAll('.history-item').forEach(item => {
      const id = item.dataset.id;
      item.querySelector('[data-action="load"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const record = ProjectHistory.getAll().find(r => r.id === id);
        if (record && record.project) {
          loadProjectData(record.project);
          hideModal('history-modal');
          showToast(`已加载: ${record.name}`, 'success');
        }
      });
      item.querySelector('[data-action="export"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const record = ProjectHistory.getAll().find(r => r.id === id);
        if (record && record.project) {
          ProjectHistory.exportToFile(record.project, record.name || 'project');
          showToast('已导出文件', 'success');
        }
      });
      item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        ProjectHistory.remove(id);
        renderHistoryList();
        showToast('已删除', 'info');
      });
    });
  }

  // ===== 工具函数（委托给 UIHelpers 模块） =====
  const showModal = UIHelpers.showModal;
  const hideModal = UIHelpers.hideModal;
  const showToast = UIHelpers.showToast;
  const showPrompt = UIHelpers.showPrompt;

  /** 切换胶片噪点效果 */
  function toggleNoise() {
    const btn = document.getElementById('btn-noise');
    const isOn = NoiseOverlay.isEnabled();
    NoiseOverlay.setEnabled(!isOn);
    if (!isOn) {
      btn.classList.add('active');
      showToast('胶片噪点已开启 (5%)', 'info');
    } else {
      btn.classList.remove('active');
      showToast('胶片噪点已关闭', 'info');
    }
    saveEffectStates();
    renderCurrentFrame();
  }

  /** 切换动态配色（hue-rotate 色相偏移） */
  function toggleHueRotate() {
    const btn = document.getElementById('btn-hue-rotate');
    const canvas = document.getElementById('preview-canvas');
    const isOn = canvas.classList.contains('hue-rotate-on');
    if (!isOn) {
      canvas.classList.add('hue-rotate-on');
      btn.classList.add('active');
      showToast('动态配色已开启', 'info');
    } else {
      canvas.classList.remove('hue-rotate-on');
      btn.classList.remove('active');
      showToast('动态配色已关闭', 'info');
    }
    saveEffectStates();
  }

  /** 切换辉光效果 */
  function toggleGlow() {
    const btn = document.getElementById('btn-glow');
    const isOn = VisualEditor.isGlowEnabled();
    VisualEditor.setGlowEnabled(!isOn);
    // 同时切换 canvas 级 CSS 辉光滤镜，使 AI 代码内容也生效
    const canvas = document.getElementById('preview-canvas');
    if (!isOn) {
      btn.classList.add('active');
      canvas.classList.add('glow-on');
      showToast('辉光效果已开启', 'info');
    } else {
      btn.classList.remove('active');
      canvas.classList.remove('glow-on');
      showToast('辉光效果已关闭', 'info');
    }
    saveEffectStates();
    renderCurrentFrame();
  }

  /** 保存特效开关状态到 localStorage */
  function saveEffectStates() {
    try {
      const canvas = document.getElementById('preview-canvas');
      const states = {
        noise: NoiseOverlay.isEnabled(),
        glow: VisualEditor.isGlowEnabled(),
        hueRotate: canvas.classList.contains('hue-rotate-on')
      };
      localStorage.setItem('webmotion_effects', JSON.stringify(states));
    } catch (e) {}
  }

  /** 从 localStorage 恢复特效开关状态 */
  function restoreEffectStates() {
    try {
      const saved = localStorage.getItem('webmotion_effects');
      if (!saved) return;
      const states = JSON.parse(saved);
      const canvas = document.getElementById('preview-canvas');
      const btnNoise = document.getElementById('btn-noise');
      const btnGlow = document.getElementById('btn-glow');
      const btnHue = document.getElementById('btn-hue-rotate');

      // 噪点
      NoiseOverlay.setEnabled(!!states.noise);
      if (states.noise && btnNoise) btnNoise.classList.add('active');
      else if (btnNoise) btnNoise.classList.remove('active');

      // 辉光
      VisualEditor.setGlowEnabled(!!states.glow);
      if (states.glow) {
        if (btnGlow) btnGlow.classList.add('active');
        canvas.classList.add('glow-on');
      } else {
        if (btnGlow) btnGlow.classList.remove('active');
        canvas.classList.remove('glow-on');
      }

      // 动态配色
      if (states.hueRotate) {
        canvas.classList.add('hue-rotate-on');
        if (btnHue) btnHue.classList.add('active');
      } else {
        canvas.classList.remove('hue-rotate-on');
        if (btnHue) btnHue.classList.remove('active');
      }
    } catch (e) {}
  }

  return { init, showToast, syncActiveScene, showPrompt, toggleNoise, toggleGlow, toggleHueRotate, performUndo, performRedo };
})();

document.addEventListener('DOMContentLoaded', App.init);
