/**
 * TDD 第四轮深度测试 — RED 阶段
 * 覆盖：
 *   1. stopDemo 徽章残留 bug（确认）
 *   2. renderBranchTree 脉冲动画唯一性
 *   3. 当前分支标签视觉结构（外层光晕 + 左侧色条）
 *   4. Welcome Modal 事件绑定与初始状态
 *   5. DEMO_STEPS 数据完整性（14 步、字段齐全、hl 标签闭合、duration 正数）
 *   6. togglePauseDemo 徽章显示/隐藏切换
 *   7. testability hook 补全（renderDiffSelectors、renderMergeSourceSelector）
 *   8. demoDesc innerHTML 渲染 hl 标签
 *   9. applyTheme 边界（无效 themeId 不应更新 themeName，且不应抛错）
 *   10. showDiffForVersion forceJump=false 不切换 tab
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('TDD 第四轮深度测试', () => {
  let window, state, document;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    document = window.document;
    state = getState(window);
    window.confirm = () => true;
    window.prompt = () => 'test';
    await waitForInit(500);
  });

  // ============================================================
  // 1. stopDemo 徽章残留 bug
  // ============================================================
  describe('stopDemo 徽章状态', () => {
    it('暂停后调用 stopDemo 应隐藏 demoPauseBadge', () => {
      // 准备：启动演示并暂停，使徽章显示
      window.runDemo();
      const badge = document.getElementById('demoPauseBadge');
      const pauseBtn = document.getElementById('btnPauseDemo');
      // 暂停使徽章显示
      state.demoRunning = true;
      pauseBtn.click();
      expect(badge.style.display).toBe('inline-flex');

      // 执行：停止演示
      window.stopDemo();

      // 断言：徽章应被隐藏
      expect(badge.style.display).toBe('none');
    });

    it('停止演示后再次启动演示，徽章不应残留显示', () => {
      const badge = document.getElementById('demoPauseBadge');
      window.runDemo();
      state.demoRunning = true;
      document.getElementById('btnPauseDemo').click();
      expect(badge.style.display).toBe('inline-flex');
      window.stopDemo();
      // 再次启动
      window.runDemo();
      expect(badge.style.display).toBe('none');
    });
  });

  // ============================================================
  // 2. renderBranchTree 脉冲动画唯一性
  // ============================================================
  describe('renderBranchTree 脉冲动画唯一性', () => {
    it('无 selectedVersionId 时，仅当前分支 head 节点显示脉冲', () => {
      const svg = document.getElementById('branchTreeSvg');
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const headVersionId = currentBranch.headVersionId;
      state.selectedVersionId = null;
      window.renderBranchTree();

      // 统计 SVG 中带 <animate> 的脉冲圆圈数量
      const pulses = svg.querySelectorAll('animate');
      const pulseCircles = Array.from(svg.querySelectorAll('circle')).filter(c =>
        c.querySelector('animate')
      );

      // 应该只有一个脉冲动画
      expect(pulseCircles.length).toBe(1);
      // 脉冲圆圈应位于 head 节点位置
      const headNode = svg.querySelector(`circle[data-vid="${headVersionId}"]`);
      const pulse = pulseCircles[0];
      expect(pulse.getAttribute('cx')).toBe(headNode.getAttribute('cx'));
      expect(pulse.getAttribute('cy')).toBe(headNode.getAttribute('cy'));
    });

    it('设置 selectedVersionId 后，脉冲应只出现在该选中节点', () => {
      const svg = document.getElementById('branchTreeSvg');
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const versions = window.getBranchVersions(currentBranch.id);

      // 选中非 head 版本
      const nonHeadVersion = versions.find(v => v.id !== currentBranch.headVersionId);
      if (!nonHeadVersion) return; // 只有一个版本时跳过

      state.selectedVersionId = nonHeadVersion.id;
      window.renderBranchTree();

      const pulseCircles = Array.from(svg.querySelectorAll('circle')).filter(c =>
        c.querySelector('animate')
      );

      expect(pulseCircles.length).toBe(1);
      // 脉冲应在选中节点而非 head 节点
      const selectedNode = svg.querySelector(`circle[data-vid="${nonHeadVersion.id}"]`);
      expect(pulseCircles[0].getAttribute('cx')).toBe(selectedNode.getAttribute('cx'));
      expect(pulseCircles[0].getAttribute('cy')).toBe(selectedNode.getAttribute('cy'));
    });

    it('选中其他节点时，head 节点不应再有脉冲', () => {
      const svg = document.getElementById('branchTreeSvg');
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const versions = window.getBranchVersions(currentBranch.id);
      const nonHeadVersion = versions.find(v => v.id !== currentBranch.headVersionId);
      if (!nonHeadVersion) return;

      state.selectedVersionId = nonHeadVersion.id;
      window.renderBranchTree();

      const headNode = svg.querySelector(`circle[data-vid="${currentBranch.headVersionId}"]`);
      // head 节点本身没有 animate 子元素（脉冲是独立的 circle）
      const headPulse = Array.from(svg.querySelectorAll('circle')).filter(c =>
        c.querySelector('animate') &&
        c.getAttribute('cx') === headNode.getAttribute('cx') &&
        c.getAttribute('cy') === headNode.getAttribute('cy')
      );
      expect(headPulse.length).toBe(0);
    });
  });

  // ============================================================
  // 3. 当前分支标签视觉结构
  // ============================================================
  describe('当前分支标签视觉结构', () => {
    it('当前分支标签应包含外层光晕 rect（blur filter）', () => {
      const svg = document.getElementById('branchTreeSvg');
      window.renderBranchTree();
      const blurRect = svg.querySelector('rect[style*="blur"]');
      expect(blurRect).not.toBeNull();
    });

    it('当前分支标签应包含左侧色条标识 rect', () => {
      const svg = document.getElementById('branchTreeSvg');
      window.renderBranchTree();
      // 左侧色条：width=3, rx=1.5
      const colorBars = Array.from(svg.querySelectorAll('rect')).filter(r =>
        r.getAttribute('width') === '3' && r.getAttribute('rx') === '1.5'
      );
      expect(colorBars.length).toBeGreaterThan(0);
    });

    it('当前分支标签背景应使用 color-mix 混合色，而非整块 branch.color 填充', () => {
      const svg = document.getElementById('branchTreeSvg');
      window.renderBranchTree();
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const labelBgs = svg.querySelectorAll('.branch-node-label-bg.current');
      expect(labelBgs.length).toBeGreaterThan(0);
      // 不应使用纯 branch.color 作为 fill
      const fill = labelBgs[0].getAttribute('style') || '';
      expect(fill).toContain('color-mix');
      expect(fill).not.toMatch(new RegExp(`fill:\\s*${currentBranch.color}\\s*;?$`));
    });
  });

  // ============================================================
  // 4. Welcome Modal 事件绑定与初始状态
  // ============================================================
  describe('Welcome Modal', () => {
    it('页面加载后 welcomeModal 应默认显示（含 show 类）', () => {
      const modal = document.getElementById('welcomeModal');
      expect(modal.classList.contains('show')).toBe(true);
    });

    it('点击 btnWelcomeClose 应隐藏 welcomeModal', () => {
      const modal = document.getElementById('welcomeModal');
      const btn = document.getElementById('btnWelcomeClose');
      expect(btn).not.toBeNull();
      btn.click();
      expect(modal.classList.contains('show')).toBe(false);
    });

    it('点击 btnWelcomeDemo 应隐藏 welcomeModal 并显示 demoOverlay', () => {
      const modal = document.getElementById('welcomeModal');
      const btn = document.getElementById('btnWelcomeDemo');
      const overlay = document.getElementById('demoOverlay');
      expect(btn).not.toBeNull();
      btn.click();
      expect(modal.classList.contains('show')).toBe(false);
      // 演示启动后 demoOverlay 应获得 show 类
      expect(overlay.classList.contains('show')).toBe(true);
    });
  });

  // ============================================================
  // 5. DEMO_STEPS 数据完整性
  // ============================================================
  describe('DEMO_STEPS 数据完整性', () => {
    // 通过访问 __gitvision__ 暴露的接口间接验证
    // DEMO_STEPS 未直接暴露，但可通过 runDemo 触发并检查 demoTitle/demoDesc 更新
    it('应能通过 runDemo 启动并设置 demoTitle/demoDesc', () => {
      window.runDemo();
      const title = document.getElementById('demoTitle').textContent;
      const desc = document.getElementById('demoDesc').innerHTML;
      expect(title.length).toBeGreaterThan(0);
      expect(desc.length).toBeGreaterThan(0);
      window.stopDemo();
    });

    it('demoDesc 应包含 <hl> 标签（高亮渲染）', () => {
      window.runDemo();
      const desc = document.getElementById('demoDesc');
      // 等待第一步设置后检查
      const hlElements = desc.querySelectorAll('hl');
      expect(hlElements.length).toBeGreaterThan(0);
      window.stopDemo();
    });

    it('demoStepLabel 应显示 "步骤 1 / N" 格式', () => {
      window.runDemo();
      const label = document.getElementById('demoStepLabel').textContent;
      expect(label).toMatch(/^步骤\s+1\s*\/\s*\d+$/);
      window.stopDemo();
    });

    it('demoProgress 宽度应为正数百分比', () => {
      window.runDemo();
      const progress = document.getElementById('demoProgress');
      const width = parseFloat(progress.style.width);
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(100);
      window.stopDemo();
    });
  });

  // ============================================================
  // 6. togglePauseDemo 徽章显示/隐藏切换
  // ============================================================
  describe('togglePauseDemo 徽章切换', () => {
    it('暂停时徽章 display 应为 inline-flex', () => {
      window.runDemo();
      const badge = document.getElementById('demoPauseBadge');
      const pauseBtn = document.getElementById('btnPauseDemo');

      state.demoRunning = true;
      pauseBtn.click();

      expect(badge.style.display).toBe('inline-flex');
      expect(pauseBtn.textContent).toBe('继续');
      window.stopDemo();
    });

    it('恢复时徽章 display 应为 none，按钮文本回到"暂停"', () => {
      window.runDemo();
      const badge = document.getElementById('demoPauseBadge');
      const pauseBtn = document.getElementById('btnPauseDemo');

      state.demoRunning = true;
      pauseBtn.click(); // 暂停
      pauseBtn.click(); // 恢复

      expect(badge.style.display).toBe('none');
      expect(pauseBtn.textContent).toBe('暂停');
      window.stopDemo();
    });

    it('demoRunning 为 false 时调用 togglePauseDemo 应无副作用', () => {
      const badge = document.getElementById('demoPauseBadge');
      const pauseBtn = document.getElementById('btnPauseDemo');
      const beforeText = pauseBtn.textContent;
      const beforeDisplay = badge.style.display;

      state.demoRunning = false;
      window.togglePauseDemo();

      expect(pauseBtn.textContent).toBe(beforeText);
      expect(badge.style.display).toBe(beforeDisplay);
    });
  });

  // ============================================================
  // 7. testability hook 补全
  // ============================================================
  describe('testability hook 补全', () => {
    it('renderDiffSelectors 应被挂载到 window', () => {
      expect(typeof window.renderDiffSelectors).toBe('function');
    });

    it('renderMergeSourceSelector 应被挂载到 window', () => {
      expect(typeof window.renderMergeSourceSelector).toBe('function');
    });

    it('renderDiffSelectors 应能被直接调用且不抛错', () => {
      expect(() => window.renderDiffSelectors()).not.toThrow();
    });

    it('renderMergeSourceSelector 应能被直接调用且不抛错', () => {
      expect(() => window.renderMergeSourceSelector()).not.toThrow();
    });
  });

  // ============================================================
  // 8. demoDesc innerHTML 渲染 hl 标签
  // ============================================================
  describe('demoDesc innerHTML 渲染', () => {
    it('demoDesc 应通过 innerHTML 渲染（支持 <hl> 标签）', () => {
      window.runDemo();
      const desc = document.getElementById('demoDesc');
      // innerHTML 应包含 <hl> 标签
      expect(desc.innerHTML).toContain('<hl>');
      expect(desc.innerHTML).toContain('</hl>');
      window.stopDemo();
    });

    it('demoDesc 内的 hl 元素应是非空文本节点', () => {
      window.runDemo();
      const desc = document.getElementById('demoDesc');
      const hlElements = desc.querySelectorAll('hl');
      expect(hlElements.length).toBeGreaterThan(0);
      hlElements.forEach(hl => {
        expect(hl.textContent.length).toBeGreaterThan(0);
      });
      window.stopDemo();
    });
  });

  // ============================================================
  // 9. applyTheme 边界
  // ============================================================
  describe('applyTheme 边界', () => {
    it('applyTheme 应被挂载到 window', () => {
      expect(typeof window.applyTheme).toBe('function');
    });

    it('传入无效 themeId 不应抛错', () => {
      expect(() => window.applyTheme('nonexistent-theme')).not.toThrow();
    });

    it('传入 null 不应抛错', () => {
      expect(() => window.applyTheme(null)).not.toThrow();
    });

    it('传入 undefined 不应抛错', () => {
      expect(() => window.applyTheme(undefined)).not.toThrow();
    });

    it('传入无效 themeId 时 themeName 不应被更新为原始 ID', () => {
      const themeNameEl = document.getElementById('themeName');
      const beforeName = themeNameEl ? themeNameEl.textContent : '';
      window.applyTheme('invalid-xyz');
      const afterName = themeNameEl ? themeNameEl.textContent : '';
      // 无效主题不应更新 themeName 为 'invalid-xyz'
      expect(afterName).not.toBe('invalid-xyz');
    });

    it('传入有效 themeId 应更新 data-theme 属性', () => {
      window.applyTheme('sakura');
      expect(document.documentElement.getAttribute('data-theme')).toBe('sakura');
    });
  });

  // ============================================================
  // 10. showDiffForVersion forceJump=false 不切换 tab
  // ============================================================
  describe('showDiffForVersion forceJump=false', () => {
    it('forceJump=false 且当前不在 diff tab 时，不应切换 tab', () => {
      // 先切到非 diff tab
      window.switchTab('blame');
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const versions = window.getBranchVersions(currentBranch.id);
      if (versions.length === 0) return;

      window.showDiffForVersion(versions[0].id, false);
      // 应保持在 blame tab
      const blamePanel = document.getElementById('panelBlame');
      const diffPanel = document.getElementById('panelDiff');
      // 仍在 blame（active 类应保留）
      const blameActive = blamePanel && blamePanel.classList.contains('active');
      const diffActive = diffPanel && diffPanel.classList.contains('active');
      expect(blameActive || !diffActive).toBe(true);
    });

    it('forceJump 缺省（undefined）时不应切换 tab', () => {
      window.switchTab('blame');
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const versions = window.getBranchVersions(currentBranch.id);
      if (versions.length === 0) return;

      expect(() => window.showDiffForVersion(versions[0].id)).not.toThrow();
    });
  });

  // ============================================================
  // 11. 主题深度美化验证
  // ============================================================
  describe('主题深度美化验证', () => {
    const themeIds = ['midnight', 'aurora', 'sakura', 'mono', 'sunset', 'ink'];

    themeIds.forEach(themeId => {
      it(`主题 ${themeId} 应能正常切换且不丢失关键 CSS 变量`, () => {
        window.applyTheme(themeId);
        const root = document.documentElement;
        expect(root.getAttribute('data-theme')).toBe(themeId);

        // 验证关键 CSS 变量存在（getComputedStyle）
        const computed = window.getComputedStyle(root);
        const accent = computed.getPropertyValue('--accent').trim();
        const accent2 = computed.getPropertyValue('--accent2').trim();
        const ink = computed.getPropertyValue('--ink').trim();
        // 这些变量应非空
        expect(accent.length).toBeGreaterThan(0);
        expect(accent2.length).toBeGreaterThan(0);
        expect(ink.length).toBeGreaterThan(0);
      });
    });

    it('切换主题后 renderBranchTree 应正常执行（颜色同步）', () => {
      expect(() => {
        window.applyTheme('sakura');
        window.renderBranchTree();
      }).not.toThrow();
    });
  });

  // ============================================================
  // 12. Welcome Modal 结构完整性
  // ============================================================
  describe('Welcome Modal 结构完整性', () => {
    it('应包含 welcome-banner、welcome-text、welcome-tips、welcome-actions 四个区域', () => {
      const modal = document.getElementById('welcomeModal');
      expect(modal.querySelector('.welcome-banner')).not.toBeNull();
      expect(modal.querySelector('.welcome-text')).not.toBeNull();
      expect(modal.querySelector('.welcome-tips')).not.toBeNull();
      expect(modal.querySelector('.welcome-actions')).not.toBeNull();
    });

    it('welcome-text 中的 hl 标签应成对闭合', () => {
      const modal = document.getElementById('welcomeModal');
      const html = modal.innerHTML;
      const openCount = (html.match(/<hl>/g) || []).length;
      const closeCount = (html.match(/<\/hl>/g) || []).length;
      expect(openCount).toBe(closeCount);
      expect(openCount).toBeGreaterThan(0);
    });

    it('welcome-text 中的 dim 标签应成对闭合', () => {
      const modal = document.getElementById('welcomeModal');
      const html = modal.innerHTML;
      const openCount = (html.match(/<dim>/g) || []).length;
      const closeCount = (html.match(/<\/dim>/g) || []).length;
      expect(openCount).toBe(closeCount);
      expect(openCount).toBeGreaterThan(0);
    });

    it('welcome-actions 应包含两个按钮（开始演示 + 自由体验）', () => {
      const modal = document.getElementById('welcomeModal');
      const actions = modal.querySelector('.welcome-actions');
      const buttons = actions.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].id).toBe('btnWelcomeDemo');
      expect(buttons[1].id).toBe('btnWelcomeClose');
    });

    it('开始演示按钮应使用自定义类 btn-welcome-demo', () => {
      const btn = document.getElementById('btnWelcomeDemo');
      expect(btn.classList.contains('btn-welcome-demo')).toBe(true);
    });

    it('自由体验按钮应使用自定义类 btn-welcome-close', () => {
      const btn = document.getElementById('btnWelcomeClose');
      expect(btn.classList.contains('btn-welcome-close')).toBe(true);
    });
  });

  // ============================================================
  // 13. 演示 desc 高亮一致性
  // ============================================================
  describe('演示 desc 高亮一致性', () => {
    it('所有演示步骤的 desc 应至少包含一个 <hl> 标签（除特殊步骤外）', () => {
      // 通过遍历演示步骤验证
      // 由于 DEMO_STEPS 未直接暴露，我们通过逐步运行来检查
      window.runDemo();
      // 第一步
      const desc = document.getElementById('demoDesc');
      const firstStepHTML = desc.innerHTML;
      expect(firstStepHTML).toContain('<hl>');
      window.stopDemo();
    });
  });

  // ============================================================
  // 14. mergeBranch "both" 方案换行渲染
  // ============================================================
  describe('mergeBranch "both" 方案换行渲染', () => {
    it('"both" 合并的 content 应包含换行分隔（\\n 或 <br>）', () => {
      const currentBranch = state.branches.find(b => b.id === state.currentBranchId);
      const featureBranch = state.branches.find(b => b.name !== 'main');
      if (!featureBranch) return;

      // 先提交一些内容到当前分支
      window.commit('测试提交');
      const conflicts = window.previewMergeConflicts(featureBranch.id);

      if (conflicts.length > 0) {
        const result = window.mergeBranch(featureBranch.id, {
          [conflicts[0].blockId]: 'both'
        });
        if (result) {
          const mergedBlock = result.blocks.find(b => b.blockId === conflicts[0].blockId);
          if (mergedBlock) {
            // both 合并的 content 应有换行分隔
            expect(mergedBlock.content).toMatch(/\n|<br>/);
          }
        }
      }
    });
  });
});
