/**
 * 智学伴侣 — App交互Demo
 * 纯前端模拟演示，零外部依赖
 */

const ZhiXueApp = (function() {
  'use strict';

  // ===================== 常量 =====================
  const COLORS = {
    mastered: { fill: '#00e5a0', glow: 'rgba(0,229,160,0.4)', text: '#0a0e1a' },
    learning: { fill: '#fdcb6e', glow: 'rgba(253,203,110,0.4)', text: '#0a0e1a' },
    unlocked: { fill: '#6c5ce7', glow: 'rgba(108,92,231,0.3)', text: '#f0f0f5' },
    locked:   { fill: '#2a2a35', stroke: '#444', glow: null, text: 'rgba(240,240,245,0.35)' }
  };

  const STATUS_LABELS = {
    mastered: '已掌握',
    learning: '学习中',
    unlocked: '已解锁',
    locked:   '未解锁'
  };

  const NODE_RADIUS = { normal: 28, locked: 24 };
  const EDGE_COLOR = 'rgba(255,255,255,0.06)';
  const EDGE_HIGHLIGHT = 'rgba(0,229,160,0.25)';
  const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // ===================== 状态 =====================
  const state = {
    currentTab: 'page-graph',
    graph: {
      nodes: [],
      edges: [],
      viewport: { offsetX: 0, offsetY: 0, scale: 1 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      hoveredNode: null,
      selectedNode: null,
      frameCount: 0,
      frozen: false,
      canvas: null,
      ctx: null,
      dpr: 1,
      width: 0,
      height: 0
    },
    timer: {
      mode: 'work',
      status: 'idle',
      timeRemaining: 1500,
      WORK_DURATION: 1500,
      BREAK_DURATION: 300,
      intervalId: null,
      pomodorosCompleted: 0,
      totalFocusToday: 0,
      whiteNoiseEnabled: false,
      audioCtx: null,
      noiseNode: null,
      gainNode: null
    }
  };

  // ===================== 数据 =====================
  const KnowledgeGraphData = {
    subject: '前端开发',
    nodes: [
      { id: 'html',    label: 'HTML5',      layer: 0, status: 'mastered', deps: [],           duration: '约 20 小时', progress: 100, tip: '熟练掌握语义化标签和表单控件是进阶的基础。' },
      { id: 'css',     label: 'CSS3',       layer: 0, status: 'mastered', deps: [],           duration: '约 30 小时', progress: 95,  tip: '重点掌握 Flexbox、Grid 和现代布局技术。' },
      { id: 'js',      label: 'JavaScript', layer: 0, status: 'learning', deps: [],           duration: '约 50 小时', progress: 45,  tip: '深入理解闭包、原型链和异步编程模型。' },
      { id: 'dom',     label: 'DOM操作',    layer: 1, status: 'mastered', deps: ['html','js'], duration: '约 15 小时', progress: 88,  tip: '掌握选择器、事件委托和性能优化技巧。' },
      { id: 'es6',     label: 'ES6+语法',   layer: 1, status: 'learning', deps: ['js'],        duration: '约 20 小时', progress: 60,  tip: '箭头函数、解构、Promise、模块化是核心。' },
      { id: 'layout',  label: '布局系统',   layer: 1, status: 'mastered', deps: ['css'],       duration: '约 12 小时', progress: 92,  tip: '响应式设计和移动端适配是实际项目必备。' },
      { id: 'react',   label: 'React',      layer: 2, status: 'unlocked', deps: ['es6','dom'], duration: '约 40 小时', progress: 0,   tip: '从组件化思维入手，理解状态管理和Hooks。' },
      { id: 'vue',     label: 'Vue.js',     layer: 2, status: 'locked',   deps: ['es6','dom'], duration: '约 35 小时', progress: 0,   tip: '先掌握响应式原理，再深入组合式API。' },
      { id: 'ts',      label: 'TypeScript', layer: 2, status: 'locked',   deps: ['js'],        duration: '约 25 小时', progress: 0,   tip: '从类型注解开始，逐步掌握泛型和类型体操。' },
      { id: 'webpack', label: 'Webpack',    layer: 3, status: 'locked',   deps: ['js'],        duration: '约 20 小时', progress: 0,   tip: '理解入口、输出、Loader和Plugin的工作机制。' },
      { id: 'vite',    label: 'Vite',       layer: 3, status: 'locked',   deps: ['es6'],       duration: '约 10 小时', progress: 0,   tip: '关注原生 ESM 和即时热更新的实现原理。' },
      { id: 'testing', label: '单元测试',   layer: 3, status: 'locked',   deps: ['js'],        duration: '约 15 小时', progress: 0,   tip: '先学 Jest，再掌握 React Testing Library。' }
    ]
  };

  // ===================== 工具函数 =====================
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
  function dist(x1, y1, x2, y2) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2); }
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function formatMinutes(seconds) {
    return Math.floor(seconds / 60) + ' 分钟';
  }
  function getStorageKey() {
    return 'zhixue_focus_' + new Date().toISOString().slice(0,10);
  }

  // ===================== 导航模块 =====================
  const NavModule = {
    init() {
      const tabs = document.querySelectorAll('.tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetId = tab.dataset.tab;
          this.switchTab(targetId);
        });
      });
    },

    switchTab(tabId) {
      if (state.currentTab === tabId) return;

      // 更新页面
      document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('page-active');
        p.hidden = true;
      });
      const targetPage = document.getElementById(tabId);
      targetPage.hidden = false;
      // 强制reflow以触发动画
      void targetPage.offsetWidth;
      targetPage.classList.add('page-active');
      targetPage.focus({ preventScroll: true });

      // 更新Tab按钮
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('tab-btn-active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      });

      state.currentTab = tabId;

      // 更新header subtitle
      const subtitle = document.querySelector('.app-subtitle');
      if (tabId === 'page-graph') {
        subtitle.textContent = '前端开发 · 知识图谱';
      } else if (tabId === 'page-timer') {
        subtitle.textContent = '专注计时 · 番茄钟';
      } else if (tabId === 'page-stats') {
        subtitle.textContent = '学习统计 · 数据看板';
      } else {
        subtitle.textContent = '智能学习规划 · 周计划';
      }

      // 激活规划页时刷新数据
      if (tabId === 'page-plan') {
        PlanModule.onActivate();
      }
      // 激活统计页时刷新数据
      if (tabId === 'page-stats') {
        StatsModule.onActivate();
      }
    }
  };

  // ===================== 图谱模块 =====================
  const GraphModule = {
    init() {
      this.loadData();
      this.initCanvas();
      this.computeLayout();
      this.bindEvents();
      this.startRenderLoop();
    },

    loadData() {
      // 深拷贝并添加运行时属性
      state.graph.nodes = KnowledgeGraphData.nodes.map(n => ({
        ...n,
        x: 0, y: 0, vx: 0, vy: 0,
        radius: n.status === 'locked' ? NODE_RADIUS.locked : NODE_RADIUS.normal
      }));
      // 构建边
      state.graph.edges = [];
      state.graph.nodes.forEach(node => {
        node.deps.forEach(depId => {
          state.graph.edges.push({ source: depId, target: node.id });
        });
      });
    },

    initCanvas() {
      const canvas = document.getElementById('graph-canvas');
      const wrapper = canvas.parentElement;
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      state.graph.canvas = canvas;
      state.graph.ctx = ctx;
      state.graph.dpr = dpr;
      state.graph.width = rect.width;
      state.graph.height = rect.height;
    },

    computeLayout() {
      const { nodes, width, height } = state.graph;
      const layers = {};
      nodes.forEach(n => {
        if (!layers[n.layer]) layers[n.layer] = [];
        layers[n.layer].push(n);
      });

      const layerCount = Object.keys(layers).length;
      const layerWidth = width / (layerCount + 1);

      Object.entries(layers).forEach(([layerIndex, layerNodes]) => {
        const x = layerWidth * (parseInt(layerIndex) + 1);
        const spacing = height / (layerNodes.length + 1);
        layerNodes.forEach((node, i) => {
          node.x = x;
          node.y = spacing * (i + 1);
        });
      });

      // 居中偏移
      const offsetX = 0;
      const offsetY = 0;
      state.graph.viewport.offsetX = offsetX;
      state.graph.viewport.offsetY = offsetY;
    },

    applyForces() {
      if (state.graph.frozen) return;
      const { nodes, edges, width, height } = state.graph;
      const kRepel = 2000;
      const kAttract = 0.003;
      const centerStrength = 0.02;

      // 斥力
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx*dx + dy*dy) || 1;
          const f = kRepel / (d * d);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      // 引力（边）
      edges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.source);
        const b = nodes.find(n => n.id === edge.target);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx*dx + dy*dy) || 1;
        const f = (d - 100) * kAttract;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });

      // 中心力 + 边界
      const cx = width / 2;
      const cy = height / 2;
      nodes.forEach(n => {
        n.vx += (cx - n.x) * centerStrength;
        n.vy += (cy - n.y) * centerStrength;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.8;
        n.vy *= 0.8;
      });

      state.graph.frameCount++;
      if (state.graph.frameCount > 120) {
        state.graph.frozen = true;
      }
    },

    worldToScreen(x, y) {
      const vp = state.graph.viewport;
      return {
        x: (x + vp.offsetX) * vp.scale,
        y: (y + vp.offsetY) * vp.scale
      };
    },

    screenToWorld(x, y) {
      const vp = state.graph.viewport;
      return {
        x: x / vp.scale - vp.offsetX,
        y: y / vp.scale - vp.offsetY
      };
    },

    getNodeAtScreen(x, y) {
      const world = this.screenToWorld(x, y);
      for (const node of state.graph.nodes) {
        const r = node.radius * state.graph.viewport.scale;
        if (dist(world.x, world.y, node.x, node.y) <= r + 4) {
          return node;
        }
      }
      return null;
    },

    render() {
      const { ctx, width, height, nodes, edges, viewport, hoveredNode, selectedNode } = state.graph;
      ctx.clearRect(0, 0, width, height);

      // 边
      edges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.source);
        const b = nodes.find(n => n.id === edge.target);
        if (!a || !b) return;
        const sa = this.worldToScreen(a.x, a.y);
        const sb = this.worldToScreen(b.x, b.y);

        const isHighlighted = selectedNode && (selectedNode.id === a.id || selectedNode.id === b.id);

        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.strokeStyle = isHighlighted ? EDGE_HIGHLIGHT : EDGE_COLOR;
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      });

      // 节点
      nodes.forEach(node => {
        const s = this.worldToScreen(node.x, node.y);
        const style = COLORS[node.status];
        const r = node.radius * viewport.scale;

        // 发光
        if (style.glow) {
          ctx.save();
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = 20 * viewport.scale;
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.fillStyle = style.fill;
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.fillStyle = style.fill;
          ctx.fill();
          if (style.stroke) {
            ctx.strokeStyle = style.stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 文字
        ctx.fillStyle = style.text;
        ctx.font = `${700 * viewport.scale}px "Noto Sans SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.max(10, 13 * viewport.scale);
        ctx.font = `${node.status === 'locked' ? 400 : 700} ${fontSize}px "Noto Sans SC", sans-serif`;
        ctx.fillText(node.label, s.x, s.y);
      });
    },

    startRenderLoop() {
      const loop = () => {
        this.applyForces();
        this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },

    bindEvents() {
      const canvas = state.graph.canvas;
      const tooltip = document.getElementById('graph-tooltip');

      // Resize
      window.addEventListener('resize', () => {
        this.initCanvas();
        this.computeLayout();
        state.graph.frameCount = 0;
        state.graph.frozen = false;
      });

      // Mouse / Touch helpers
      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
      };

      // Hover / tooltip
      canvas.addEventListener('mousemove', (e) => {
        if (state.graph.isDragging) return;
        const pos = getPos(e);
        const node = this.getNodeAtScreen(pos.x, pos.y);

        if (node !== state.graph.hoveredNode) {
          state.graph.hoveredNode = node;
          canvas.style.cursor = node ? 'pointer' : 'grab';

          if (node) {
            tooltip.textContent = node.label + ' — ' + STATUS_LABELS[node.status];
            tooltip.classList.add('visible');
            tooltip.style.left = (pos.x + 12) + 'px';
            tooltip.style.top = (pos.y - 8) + 'px';
          } else {
            tooltip.classList.remove('visible');
          }
        } else if (node) {
          tooltip.style.left = (pos.x + 12) + 'px';
          tooltip.style.top = (pos.y - 8) + 'px';
        }
      });

      canvas.addEventListener('mouseleave', () => {
        state.graph.hoveredNode = null;
        tooltip.classList.remove('visible');
      });

      // Click
      canvas.addEventListener('click', (e) => {
        if (state.graph.isDragging) return;
        const pos = getPos(e);
        const node = this.getNodeAtScreen(pos.x, pos.y);
        if (node) {
          this.openSheet(node);
        }
      });

      // Drag pan
      canvas.addEventListener('mousedown', (e) => {
        const pos = getPos(e);
        const node = this.getNodeAtScreen(pos.x, pos.y);
        if (!node) {
          state.graph.isDragging = false; // 先设为false，区分click和drag
          state.graph.dragStart = { x: e.clientX, y: e.clientY, ox: state.graph.viewport.offsetX, oy: state.graph.viewport.offsetY };
          const onMove = (ev) => {
            const dx = ev.clientX - state.graph.dragStart.x;
            const dy = ev.clientY - state.graph.dragStart.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
              state.graph.isDragging = true;
            }
            state.graph.viewport.offsetX = state.graph.dragStart.ox + dx / state.graph.viewport.scale;
            state.graph.viewport.offsetY = state.graph.dragStart.oy + dy / state.graph.viewport.scale;
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            setTimeout(() => { state.graph.isDragging = false; }, 50);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }
      });

      // Wheel zoom
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const pos = getPos(e);
        const worldBefore = this.screenToWorld(pos.x, pos.y);
        const delta = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = clamp(state.graph.viewport.scale * delta, 0.4, 3);
        state.graph.viewport.scale = newScale;
        const worldAfter = this.screenToWorld(pos.x, pos.y);
        state.graph.viewport.offsetX += worldAfter.x - worldBefore.x;
        state.graph.viewport.offsetY += worldAfter.y - worldBefore.y;
      }, { passive: false });

      // Touch support
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          state.graph.dragStart = { x: t.clientX, y: t.clientY, ox: state.graph.viewport.offsetX, oy: state.graph.viewport.offsetY };
          state.graph.isDragging = false;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          const t = e.touches[0];
          const dx = t.clientX - state.graph.dragStart.x;
          const dy = t.clientY - state.graph.dragStart.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            state.graph.isDragging = true;
          }
          state.graph.viewport.offsetX = state.graph.dragStart.ox + dx / state.graph.viewport.scale;
          state.graph.viewport.offsetY = state.graph.dragStart.oy + dy / state.graph.viewport.scale;
        }
      }, { passive: false });

      canvas.addEventListener('touchend', () => {
        setTimeout(() => { state.graph.isDragging = false; }, 50);
      });

      // Sheet close
      document.getElementById('sheet-close').addEventListener('click', () => this.closeSheet());
      document.getElementById('sheet-overlay').addEventListener('click', () => this.closeSheet());
      document.getElementById('sheet-action-btn').addEventListener('click', () => this.onSheetAction());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeSheet();
      });

      // Reset data
      document.getElementById('btn-reset-data').addEventListener('click', () => {
        if (confirm('确定要重置所有演示数据吗？')) {
          localStorage.removeItem(getStorageKey());
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('zhixue_plan_')) {
              localStorage.removeItem(key);
            }
          });
          location.reload();
        }
      });
    },

    openSheet(node) {
      state.graph.selectedNode = node;
      const sheet = document.getElementById('node-sheet');
      const overlay = document.getElementById('sheet-overlay');

      document.getElementById('sheet-title').textContent = node.label;

      const statusEl = document.getElementById('sheet-status');
      statusEl.textContent = STATUS_LABELS[node.status];
      statusEl.className = 'sheet-status status-' + node.status;

      const depLabels = node.deps.map(depId => {
        const dep = state.graph.nodes.find(n => n.id === depId);
        return dep ? dep.label : depId;
      });
      document.getElementById('sheet-deps').textContent = depLabels.length > 0 ? depLabels.join('、') : '无前置知识';
      document.getElementById('sheet-duration').textContent = node.duration;

      const progressBar = '■'.repeat(Math.floor(node.progress / 10)) + '□'.repeat(10 - Math.floor(node.progress / 10));
      document.getElementById('sheet-progress').textContent = node.progress > 0 ? `${progressBar} ${node.progress}%` : '尚未开始';
      document.getElementById('sheet-tip').textContent = node.tip;

      const actionBtn = document.getElementById('sheet-action-btn');
      if (node.status === 'locked') {
        actionBtn.textContent = '前置知识未满足';
        actionBtn.disabled = true;
        actionBtn.style.opacity = '0.5';
      } else if (node.status === 'mastered') {
        actionBtn.textContent = '复习巩固';
        actionBtn.disabled = false;
        actionBtn.style.opacity = '1';
      } else {
        actionBtn.textContent = '开始学习';
        actionBtn.disabled = false;
        actionBtn.style.opacity = '1';
      }

      overlay.classList.add('visible');
      sheet.classList.add('visible');
      sheet.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
    },

    closeSheet() {
      state.graph.selectedNode = null;
      document.getElementById('node-sheet').classList.remove('visible');
      document.getElementById('sheet-overlay').classList.remove('visible');
      document.getElementById('node-sheet').setAttribute('aria-hidden', 'true');
      document.getElementById('sheet-overlay').setAttribute('aria-hidden', 'true');
    },

    onSheetAction() {
      const node = state.graph.selectedNode;
      if (!node) return;
      // 演示行为：显示提示并关闭弹窗
      this.closeSheet();
      if (node.status === 'locked') return;
      const label = node.status === 'mastered' ? '复习巩固' : '开始学习';
      this.showToast('已触发「' + label + '」：' + node.label);
    },

    showToast(msg) {
      // 简单 toast 提示，复用计时器通知区域
      const label = document.getElementById('timer-status-label');
      if (label) {
        const prev = label.textContent;
        label.textContent = msg;
        setTimeout(() => { label.textContent = prev; }, 2500);
      }
    }
  };

  // ===================== 学习规划模块 =====================
  const PlanModule = {
    // 周计划数据
    weeklyPlan: {
      '2026-07-06': {
        tasks: [
          { id: 'task-0601', topic: 'js',     title: '闭包与作用域链深入理解', completed: false },
          { id: 'task-0602', topic: 'es6',    title: 'Promise 与 async/await 实战', completed: false },
          { id: 'task-0603', topic: 'layout', title: 'CSS Grid 布局综合练习',        completed: true },
          { id: 'task-0604', topic: 'dom',    title: '事件委托模式重构旧代码',       completed: false }
        ]
      },
      '2026-07-07': {
        tasks: [
          { id: 'task-0701', topic: 'js',   title: '原型链与继承模式总结',        completed: false },
          { id: 'task-0702', topic: 'es6',  title: '模块化方案对比（ESM vs CJS）', completed: false },
          { id: 'task-0703', topic: 'react',title: 'React Hooks 入门：useState、useEffect', completed: false },
          { id: 'task-0704', topic: 'js',   title: '手写防抖与节流函数',          completed: false },
          { id: 'task-0705', topic: 'css',  title: 'CSS 动画与过渡效果实践',       completed: false }
        ]
      },
      '2026-07-08': {
        tasks: [
          { id: 'task-0801', topic: 'es6',   title: '解构赋值与展开运算符深入',      completed: false },
          { id: 'task-0802', topic: 'layout', title: '响应式设计断点策略',            completed: false },
          { id: 'task-0803', topic: 'dom',   title: '虚拟 DOM 原理简析',             completed: false },
          { id: 'task-0804', topic: 'js',    title: 'Event Loop 与微任务/宏任务',    completed: false }
        ]
      },
      '2026-07-09': {
        tasks: [
          { id: 'task-0901', topic: 'react', title: '组件生命周期深入理解',   completed: false },
          { id: 'task-0902', topic: 'react', title: 'Hooks 最佳实践总结',      completed: false },
          { id: 'task-0903', topic: 'css',   title: 'CSS 变量与设计系统构建',  completed: false },
          { id: 'task-0904', topic: 'ts',    title: '类型体操基础练习',         completed: false }
        ]
      },
      '2026-07-10': {
        tasks: [
          { id: 'task-1001', topic: 'webpack', title: 'Loader 和 Plugin 原理', completed: false },
          { id: 'task-1002', topic: 'vite',    title: '为什么 Vite 更快', completed: false },
          { id: 'task-1003', topic: 'testing', title: 'Jest 匹配器使用', completed: false }
        ]
      },
      '2026-07-11': {
        tasks: [
          { id: 'task-1101', topic: 'vue',  title: '响应式原理核心', completed: false },
          { id: 'task-1102', topic: 'react', title: 'React vs Vue 对比思考', completed: false },
          { id: 'task-1103', topic: 'css',  title: 'CSS-in-JS 方案比较', completed: false }
        ]
      },
      '2026-07-12': {
        tasks: [
          { id: 'task-1201', topic: 'project', title: '个人项目代码重构', completed: false },
          { id: 'task-1202', topic: 'review', title: '本周知识点回顾整理', completed: false }
        ]
      }
    },

    getWeekDates() {
      const dates = [];
      const today = new Date();
      const day = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - day);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      state.plan.weekDates = dates;
      return dates;
    },

    getTodayStr() {
      return new Date().toISOString().slice(0, 10);
    },

    getPlanStorageKey(dateStr) {
      return 'zhixue_plan_' + dateStr;
    },

    loadCompletionForDay(dateStr) {
      const key = this.getPlanStorageKey(dateStr);
      const raw = localStorage.getItem(key);
      if (raw) {
        try { return JSON.parse(raw); } catch(e) { return {}; }
      }
      return {};
    },

    saveCompletionForDay(dateStr) {
      const key = this.getPlanStorageKey(dateStr);
      localStorage.setItem(key, JSON.stringify(state.plan.taskCompletion));
    },

    init() {
      state.plan = {
        currentDate: '',
        taskCompletion: {},
        weekDates: []
      };
      this.getWeekDates();
      const today = this.getTodayStr();
      state.plan.currentDate = today;
      state.plan.taskCompletion = this.loadCompletionForDay(today);
      this.bindEvents();
      this.render();
    },

    onActivate() {
      // 刷新番茄数统计（可能在其它页面被修改）
      this.renderPomodoroStat();
      this.render();
    },

    bindEvents() {
      // 日期点击委托
      document.getElementById('plan-date-strip').addEventListener('click', (e) => {
        const btn = e.target.closest('.plan-date-btn');
        if (btn) {
          this.onDateSelect(btn.dataset.date);
        }
      });
      // 任务点击委托
      document.getElementById('plan-task-list').addEventListener('click', (e) => {
        const card = e.target.closest('.plan-task-card');
        if (card) {
          this.onTaskToggle(card.dataset.taskId);
        }
      });
    },

    render() {
      this.renderDateStrip();
      this.renderTaskList();
      this.renderProgressRing();
      this.renderRecommendations();
      this.renderPomodoroStat();
    },

    renderDateStrip() {
      const container = document.getElementById('plan-date-strip');
      container.innerHTML = '';
      const today = this.getTodayStr();

      state.plan.weekDates.forEach(dateStr => {
        const d = new Date(dateStr);
        const dateNum = d.getDate();
        const dayName = WEEK_DAYS[d.getDay()];
        const isSelected = dateStr === state.plan.currentDate;
        const isToday = dateStr === today;

        const btn = document.createElement('button');
        btn.className = 'plan-date-btn' + (isSelected ? ' plan-date-selected' : '') + (isToday ? ' plan-date-today' : '');
        btn.dataset.date = dateStr;
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', String(isSelected));
        btn.innerHTML = `<span class="plan-date-num">${dateNum}</span><span class="plan-date-day">${dayName}</span>`;
        container.appendChild(btn);
      });

      // 滚动到当前日期
      if (state.plan.currentDate === today) {
        const selectedBtn = container.querySelector('.plan-date-selected');
        if (selectedBtn) {
          selectedBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      }
    },

    renderTaskList() {
      const container = document.getElementById('plan-task-list');
      container.innerHTML = '';
      const tasks = this.weeklyPlan[state.plan.currentDate]?.tasks || [];
      const completion = state.plan.taskCompletion;

      tasks.forEach(task => {
        const isCompleted = completion[task.id] || false;
        const topicNode = KnowledgeGraphData.nodes.find(n => n.id === task.topic);
        const topicLabel = topicNode ? topicNode.label : '前端开发';

        const card = document.createElement('button');
        card.className = 'plan-task-card' + (isCompleted ? ' completed' : '');
        card.dataset.taskId = task.id;
        card.setAttribute('aria-pressed', String(isCompleted));
        card.setAttribute('aria-label', `${isCompleted ? '已完成' : '未完成'}：${task.title}`);

        const checkSvg = `
          <div class="plan-task-check">
            <svg viewBox="0 0 20 20" fill="none" stroke="${isCompleted ? 'var(--bg-deep)' : 'currentColor'}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 11 8 16 17 4"/></polyline>
          </svg>
          </div>
        `;

        card.innerHTML = `
          ${checkSvg}
          <span class="plan-task-title">${task.title}</span>
          <span class="plan-task-badge">${topicLabel}</span>
        `;

        container.appendChild(card);
      });

      if (tasks.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">暂无计划</div>';
      }
    },

    renderProgressRing() {
      const tasks = this.weeklyPlan[state.plan.currentDate]?.tasks || [];
      const completion = state.plan.taskCompletion;
      const completedCount = tasks.filter(t => completion[t.id]).length;
      const total = tasks.length;
      const progress = total > 0 ? completedCount / total : 0;

      const circumference = 2 * Math.PI * 50; // r=50
      const offset = circumference * (1 - progress);
      document.getElementById('plan-progress-ring').style.strokeDashoffset = offset;
      document.getElementById('plan-progress-text').textContent = `${completedCount}/${total}`;
    },

    renderRecommendations() {
      const container = document.getElementById('plan-recommend-list');
      container.innerHTML = '';

      // 优先取学习中 → 再取已解锁 → 最后取已掌握，最多3个
      const candidates = [];
      KnowledgeGraphData.nodes.forEach(n => {
        if (candidates.length >= 3) return;
        if (n.status === 'learning') candidates.push(n);
      });
      KnowledgeGraphData.nodes.forEach(n => {
        if (candidates.length >= 3) return;
        if (n.status === 'unlocked') candidates.push(n);
      });
      KnowledgeGraphData.nodes.forEach(n => {
        if (candidates.length >= 3) return;
        if (n.status === 'mastered') candidates.push(n);
      });

      const statusClassMap = {
        mastered: 'rec-status-mastered',
        learning: 'rec-status-learning',
        unlocked: 'rec-status-unlocked'
      };

      candidates.forEach(node => {
        const card = document.createElement('div');
        card.className = 'plan-recommend-card';
        card.innerHTML = `
          <div class="rec-label">${node.label}</div>
          <div class="rec-status ${statusClassMap[node.status]}">${STATUS_LABELS[node.status]}</div>
          <div class="rec-bar">
            <div class="rec-bar-fill" style="width: ${node.progress}%;"></div>
          </div>
        `;
        container.appendChild(card);
      });

      if (candidates.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 10px;">暂无推荐</div>';
      }
    },

    renderPomodoroStat() {
      document.getElementById('plan-pomodoro-count').textContent = String(state.timer.pomodorosCompleted);
    },

    onDateSelect(dateStr) {
      state.plan.currentDate = dateStr;
      // 加载当前日期的完成状态
      state.plan.taskCompletion = this.loadCompletionForDay(dateStr);
      this.render();
    },

    onTaskToggle(taskId) {
      const completion = state.plan.taskCompletion;
      completion[taskId] = !completion[taskId];
      this.saveCompletionForDay(state.plan.currentDate);
      this.renderTaskList();
      this.renderProgressRing();
    }
  };

  // ===================== 学习统计模块 =====================
  const StatsModule = {
    DAY_NAMES: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],

    init() {
      this.bindEvents();
      this.render();
    },

    onActivate() {
      this.render();
    },

    // ========== 数据获取 ==========

    getWeekDates() {
      const dates = [];
      const today = new Date();
      const day = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - day);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      return dates;
    },

    getFocusDataForWeek() {
      const dates = this.getWeekDates();
      return dates.map(dateStr => {
        const key = 'zhixue_focus_' + dateStr;
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            return {
              date: dateStr,
              pomodoros: data.pomodoros || 0,
              focusMinutes: Math.floor((data.focusTime || 0) / 60)
            };
          } catch(e) { /* fallback */ }
        }
        return { date: dateStr, pomodoros: 0, focusMinutes: 0 };
      });
    },

    getPlanCompletionDataForWeek() {
      const dates = this.getWeekDates();
      return dates.map(dateStr => {
        const key = 'zhixue_plan_' + dateStr;
        const raw = localStorage.getItem(key);
        let completed = 0;
        if (raw) {
          try {
            const data = JSON.parse(raw);
            completed = Object.values(data).filter(v => v === true).length;
          } catch(e) { /* fallback */ }
        }
        const total = (PlanModule.weeklyPlan[dateStr] && PlanModule.weeklyPlan[dateStr].tasks || []).length;
        return { date: dateStr, completed, total };
      });
    },

    getMasteryStats() {
      const nodes = KnowledgeGraphData.nodes;
      const counts = { mastered: 0, learning: 0, unlocked: 0, locked: 0 };
      nodes.forEach(n => {
        if (counts.hasOwnProperty(n.status)) counts[n.status]++;
      });
      const total = nodes.length;
      const rate = total > 0 ? Math.round((counts.mastered / total) * 100) : 0;
      return { ...counts, total, rate };
    },

    // ========== 渲染 ==========

    render() {
      this.renderSummary();
      this.renderMastery();
      this.renderTrendChart();
      this.renderTimeChart();
    },

    renderSummary() {
      const todayMinutes = Math.floor(state.timer.totalFocusToday / 60);
      document.getElementById('stats-today-time').textContent = todayMinutes + ' 分钟';
      document.getElementById('stats-total-pomodoros').textContent =
        String(state.timer.pomodorosCompleted);
      const mastery = this.getMasteryStats();
      document.getElementById('stats-mastery-rate').textContent = mastery.rate + '%';
    },

    renderMastery() {
      const mastery = this.getMasteryStats();
      const circumference = 2 * Math.PI * 50;
      const offset = circumference * (1 - mastery.rate / 100);
      document.getElementById('stats-mastery-ring').style.strokeDashoffset = offset;
      document.getElementById('stats-mastery-text').textContent = mastery.rate + '%';

      const detail = document.getElementById('stats-mastery-detail');
      const items = [
        { label: '已掌握', count: mastery.mastered, color: '#00e5a0' },
        { label: '学习中', count: mastery.learning, color: '#fdcb6e' },
        { label: '已解锁', count: mastery.unlocked, color: '#6c5ce7' },
        { label: '未解锁', count: mastery.locked, color: '#555' }
      ];
      detail.innerHTML = items.map(item =>
        '<div class="mastery-item">' +
          '<span class="mastery-name">' +
            '<span class="mastery-dot" style="background:' + item.color + '"></span>' + item.label +
          '</span>' +
          '<span class="mastery-count">' + item.count + '</span>' +
        '</div>'
      ).join('');
    },

    // ========== Canvas 图表渲染 ==========

    setupCanvas(canvasId) {
      const canvas = document.getElementById(canvasId);
      const wrapper = canvas.parentElement;
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      return { canvas, ctx, width: rect.width, height: rect.height };
    },

    renderTrendChart() {
      const { ctx, width, height } = this.setupCanvas('stats-trend-canvas');
      const data = this.getPlanCompletionDataForWeek();
      const padding = { top: 20, right: 20, bottom: 30, left: 30 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      ctx.clearRect(0, 0, width, height);

      const maxVal = Math.max(1, ...data.map(d => d.total));

      // 网格
      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartH / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const val = Math.round(maxVal - (maxVal / gridLines) * i);
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), padding.left - 8, y);
      }

      if (data.length > 0) {
        const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

        // 总任务数虚线
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        data.forEach((d, i) => {
          const x = padding.left + stepX * i;
          const y = padding.top + chartH - (d.total / maxVal) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // 已完成实线 + 渐变填充
        ctx.beginPath();
        const firstX = padding.left;
        const firstY = padding.top + chartH - (data[0].completed / maxVal) * chartH;
        ctx.moveTo(firstX, firstY);
        data.forEach((d, i) => {
          const x = padding.left + stepX * i;
          const y = padding.top + chartH - (d.completed / maxVal) * chartH;
          ctx.lineTo(x, y);
        });

        const lastX = padding.left + stepX * (data.length - 1);
        ctx.lineTo(lastX, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(0,229,160,0.2)');
        gradient.addColorStop(1, 'rgba(0,229,160,0.0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // 已完成实线（重绘覆盖填充）
        ctx.beginPath();
        ctx.moveTo(firstX, firstY);
        data.forEach((d, i) => {
          const x = padding.left + stepX * i;
          const y = padding.top + chartH - (d.completed / maxVal) * chartH;
          ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#00e5a0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 数据点
        data.forEach((d, i) => {
          const x = padding.left + stepX * i;
          const y = padding.top + chartH - (d.completed / maxVal) * chartH;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#00e5a0';
          ctx.fill();
          ctx.strokeStyle = '#0a0e1a';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // X轴标签
      data.forEach((d, i) => {
        const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;
        const x = padding.left + stepX * i;
        const day = new Date(d.date + 'T00:00:00').getDay();
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.DAY_NAMES[day], x, padding.top + chartH + 8);
      });
    },

    renderTimeChart() {
      const { ctx, width, height } = this.setupCanvas('stats-time-canvas');
      const data = this.getFocusDataForWeek();
      const padding = { top: 20, right: 20, bottom: 30, left: 30 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      ctx.clearRect(0, 0, width, height);

      const maxVal = Math.max(1, ...data.map(d => d.focusMinutes));

      // 网格
      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartH / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const val = Math.round(maxVal - (maxVal / gridLines) * i);
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), padding.left - 8, y);
      }

      // 柱状图
      const barCount = data.length;
      const barWidth = (chartW / barCount) * 0.5;
      const barGap = (chartW / barCount) * 0.5;

      data.forEach((d, i) => {
        const barH = (d.focusMinutes / maxVal) * chartH;
        const x = padding.left + (chartW / barCount) * i + barGap / 2;
        const y = padding.top + chartH - barH;

        const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH);
        gradient.addColorStop(0, '#6c5ce7');
        gradient.addColorStop(1, 'rgba(108,92,231,0.3)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = Math.min(4, barWidth / 2);
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        if (d.focusMinutes > 0) {
          ctx.fillStyle = 'rgba(240,240,245,0.8)';
          ctx.font = '10px "Noto Sans SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(d.focusMinutes), x + barWidth / 2, y - 4);
        }
      });

      // X轴标签
      data.forEach((d, i) => {
        const x = padding.left + (chartW / barCount) * i + barGap / 2 + barWidth / 2;
        const day = new Date(d.date + 'T00:00:00').getDay();
        ctx.fillStyle = 'rgba(240,240,245,0.4)';
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.DAY_NAMES[day], x, padding.top + chartH + 8);
      });
    },

    // ========== 事件绑定 ==========

    bindEvents() {
      window.addEventListener('resize', () => {
        if (state.currentTab === 'page-stats') {
          this.render();
        }
      });
    }
  };

  // ===================== 计时器模块 =====================
  const TimerModule = {
    init() {
      this.loadFromStorage();
      this.bindEvents();
      this.updateDisplay();
      this.updateStats();
    },

    loadFromStorage() {
      const key = getStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          state.timer.pomodorosCompleted = data.pomodoros || 0;
          state.timer.totalFocusToday = data.focusTime || 0;
        } catch (e) {
          // ignore
        }
      }
    },

    saveToStorage() {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify({
        pomodoros: state.timer.pomodorosCompleted,
        focusTime: state.timer.totalFocusToday
      }));
    },

    bindEvents() {
      document.getElementById('btn-start').addEventListener('click', () => this.toggleTimer());
      document.getElementById('btn-reset').addEventListener('click', () => this.resetTimer());
      document.getElementById('btn-skip').addEventListener('click', () => this.skipTimer());
      document.getElementById('btn-white-noise').addEventListener('click', () => this.toggleWhiteNoise());

      // Page Visibility API
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.timer.status === 'running') {
          this.pauseTimer();
        }
      });
    },

    toggleTimer() {
      if (state.timer.status === 'running') {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    },

    startTimer() {
      if (state.timer.status === 'running') return;
      state.timer.status = 'running';
      this.updateStartButton();
      this.updateStatusLabel();

      state.timer.intervalId = setInterval(() => {
        state.timer.timeRemaining--;
        this.updateDisplay();
        if (state.timer.timeRemaining <= 0) {
          this.onTimerComplete();
        }
      }, 1000);
    },

    pauseTimer() {
      state.timer.status = 'paused';
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
      this.updateStartButton();
      this.updateStatusLabel();
    },

    resetTimer() {
      this.pauseTimer();
      state.timer.status = 'idle';
      state.timer.timeRemaining = state.timer.mode === 'work'
        ? state.timer.WORK_DURATION
        : state.timer.BREAK_DURATION;
      this.updateDisplay();
      this.updateStartButton();
      this.updateStatusLabel();
    },

    skipTimer() {
      this.pauseTimer();
      this.onTimerComplete();
    },

    onTimerComplete() {
      if (state.timer.mode === 'work') {
        state.timer.pomodorosCompleted++;
        state.timer.totalFocusToday += state.timer.WORK_DURATION;
        this.saveToStorage();
        this.showNotification('专注完成！休息 5 分钟');
        state.timer.mode = 'break';
        state.timer.timeRemaining = state.timer.BREAK_DURATION;
      } else {
        this.showNotification('休息结束，开始下一轮专注');
        state.timer.mode = 'work';
        state.timer.timeRemaining = state.timer.WORK_DURATION;
      }
      state.timer.status = 'idle';
      this.updateDisplay();
      this.updateStartButton();
      this.updateStatusLabel();
      this.updateStats();
      this.updateModeIndicator();
    },

    updateDisplay() {
      const t = state.timer;
      document.getElementById('timer-display').textContent = formatTime(t.timeRemaining);

      const total = t.mode === 'work' ? t.WORK_DURATION : t.BREAK_DURATION;
      const circumference = 2 * Math.PI * 120; // r=120
      const offset = circumference * (1 - t.timeRemaining / total);
      const ring = document.getElementById('timer-progress-ring');
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = t.mode === 'work' ? 'var(--accent)' : 'var(--accent-secondary)';
    },

    updateStartButton() {
      const btn = document.getElementById('btn-start');
      const t = state.timer;
      if (t.status === 'running') {
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>暂停`;
        btn.setAttribute('aria-label', '暂停计时器');
      } else {
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始专注`;
        btn.setAttribute('aria-label', '开始专注');
      }
    },

    updateStatusLabel() {
      const label = document.getElementById('timer-status-label');
      const t = state.timer;
      if (t.status === 'running') {
        label.textContent = t.mode === 'work' ? '专注中…' : '休息中…';
      } else if (t.status === 'paused') {
        label.textContent = '已暂停';
      } else {
        label.textContent = '准备开始';
      }
    },

    updateModeIndicator() {
      const dot = document.getElementById('mode-dot');
      const text = document.getElementById('mode-text');
      if (state.timer.mode === 'work') {
        dot.style.background = 'var(--accent)';
        text.textContent = '专注模式';
      } else {
        dot.style.background = 'var(--accent-secondary)';
        text.textContent = '休息模式';
      }
    },

    updateStats() {
      document.getElementById('stat-pomodoros').textContent = state.timer.pomodorosCompleted;
      document.getElementById('stat-focus-time').textContent = formatMinutes(state.timer.totalFocusToday);
    },

    showNotification(msg) {
      const label = document.getElementById('timer-status-label');
      label.textContent = msg;
      setTimeout(() => this.updateStatusLabel(), 3000);
    },

    toggleWhiteNoise() {
      const btn = document.getElementById('btn-white-noise');
      const indicator = document.getElementById('noise-indicator');
      const enabled = btn.getAttribute('aria-pressed') === 'true';

      if (!enabled) {
        // 开启
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          state.timer.audioCtx = new AudioCtx();
          const bufferSize = 2 * state.timer.audioCtx.sampleRate;
          const buffer = state.timer.audioCtx.createBuffer(1, bufferSize, state.timer.audioCtx.sampleRate);
          const data = buffer.getChannelData(0);

          // 粉红噪声近似
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11;
            b6 = white * 0.115926;
          }

          state.timer.noiseNode = state.timer.audioCtx.createBufferSource();
          state.timer.noiseNode.buffer = buffer;
          state.timer.noiseNode.loop = true;
          state.timer.gainNode = state.timer.audioCtx.createGain();
          state.timer.gainNode.gain.value = 0.04;
          state.timer.noiseNode.connect(state.timer.gainNode);
          state.timer.gainNode.connect(state.timer.audioCtx.destination);
          state.timer.noiseNode.start();
        } catch (e) {
          console.warn('Web Audio API 不可用');
          return;
        }

        btn.setAttribute('aria-pressed', 'true');
        indicator.textContent = '开启';
      } else {
        // 关闭
        if (state.timer.noiseNode) {
          try { state.timer.noiseNode.stop(); } catch(e){}
          state.timer.noiseNode = null;
        }
        if (state.timer.audioCtx) {
          try { state.timer.audioCtx.close(); } catch(e){}
          state.timer.audioCtx = null;
        }
        btn.setAttribute('aria-pressed', 'false');
        indicator.textContent = '关闭';
      }
    }
  };

  // ===================== 初始化 =====================
  function init() {
    NavModule.init();
    GraphModule.init();
    TimerModule.init();
    PlanModule.init();
    StatsModule.init();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', ZhiXueApp.init);
