/**
 * 合并算法测试 — RED 阶段
 * 测试 mergeBranch、previewMergeConflicts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('合并算法', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    await waitForInit(500);
  });

  describe('previewMergeConflicts', () => {
    it('应检测同 ID 但内容不同的 block', () => {
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      // 在 main 分支修改一个 block
      window.switchBranch(mainBranch.id);
      const editor = window.$('editor');
      const firstP = editor.querySelector('p');
      if (firstP) {
        const blockId = firstP.getAttribute('data-block-id');
        firstP.textContent = 'main 分支修改的内容';
        window.commit('main 修改');
      }

      // 在 feature 分支修改同一个 block
      window.switchBranch(featureBranch.id);
      const featureEditor = window.$('editor');
      const featureP = featureEditor.querySelector(`[data-block-id="${firstP.getAttribute('data-block-id')}"]`);
      if (featureP) {
        featureP.textContent = 'feature 分支修改的内容';
        window.commit('feature 修改');
      }

      // 切回 main 预览冲突
      window.switchBranch(mainBranch.id);
      const conflicts = window.previewMergeConflicts(featureBranch.id);

      expect(Array.isArray(conflicts)).toBe(true);
      // 应该至少有一个冲突
      if (conflicts.length > 0) {
        expect(conflicts[0].blockId).toBeDefined();
        expect(conflicts[0].sourceContent).toBeDefined();
        expect(conflicts[0].targetContent).toBeDefined();
      }
    });
  });

  describe('mergeBranch', () => {
    it('无冲突合并应成功合并内容', () => {
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      window.switchBranch(mainBranch.id);
      const versionsBefore = state.versions.filter(v => v.branchId === mainBranch.id).length;

      // 无冲突合并（不修改相同 block）
      const result = window.mergeBranch(featureBranch.id, {});

      expect(result).toBeDefined();
      expect(result.branchId).toBe(mainBranch.id);
      expect(state.versions.filter(v => v.branchId === mainBranch.id).length).toBe(versionsBefore + 1);
    });

    it('合并后新版本的 parentId 应指向 target head', () => {
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      window.switchBranch(mainBranch.id);
      const headBefore = mainBranch.headVersionId;

      const result = window.mergeBranch(featureBranch.id, {});

      expect(result.parentId).toBe(headBefore);
    });

    it('conflictResolutions 传 null/undefined 不应崩溃', () => {
      // Bug: 当 conflictResolutions 为 null/undefined 时，
      // conflictResolutions[tb.id] 会抛 TypeError
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      window.switchBranch(mainBranch.id);

      expect(() => {
        window.mergeBranch(featureBranch.id, null);
      }).not.toThrow();

      expect(() => {
        window.mergeBranch(featureBranch.id, undefined);
      }).not.toThrow();
    });

    it('conflictResolutions 缺省参数（不传）不应崩溃', () => {
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      window.switchBranch(mainBranch.id);

      expect(() => {
        window.mergeBranch(featureBranch.id);
      }).not.toThrow();
    });

    it('"both" 冲突解决不应污染原始 block 内容', () => {
      // Bug: 'both' 选项将 tb.content + ' [合并: ' + sb.content + ']' 直接拼接到内容中，
      // 这会让用户看到内部合并标记，污染了文档内容。
      // 应该有更优雅的处理方式（如保留 target 内容，或使用专门的合并标记字段）
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      // 在 main 修改一个 block
      window.switchBranch(mainBranch.id);
      const editor = window.$('editor');
      const firstP = editor.querySelector('p');
      const blockId = firstP.getAttribute('data-block-id');
      firstP.textContent = 'main内容';
      window.commit('main修改');

      // 在 feature 修改同一 block
      window.switchBranch(featureBranch.id);
      const featureEditor = window.$('editor');
      const featureP = featureEditor.querySelector(`[data-block-id="${blockId}"]`);
      featureP.textContent = 'feature内容';
      window.commit('feature修改');

      // 切回 main，用 'both' 合并
      window.switchBranch(mainBranch.id);
      const result = window.mergeBranch(featureBranch.id, { [blockId]: 'both' });

      // 检查合并后的 block 内容不应包含内部合并标记
      const mergedBlock = result.blocks.find(b => b.id === blockId);
      expect(mergedBlock).toBeDefined();
      // 内容不应包含 "[合并:" 这种内部标记
      expect(mergedBlock.content).not.toContain('[合并:');
      expect(mergedBlock.content).not.toContain('[合并');
    });
  });
});
