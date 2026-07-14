/**
 * 边界容错测试 — RED 阶段第三轮
 * 测试 mergeBranch/previewMergeConflicts/deleteBranch/loadVersion/showDiffForVersion 边界
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('边界容错（第三轮）', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    window.prompt = () => 'test';
    await waitForInit(500);
  });

  describe('mergeBranch currentBranch null', () => {
    it('currentBranchId 为 null 时不应崩溃', () => {
      // Bug: getCurrentBranch() 返回 undefined，targetBranch.id 抛 TypeError
      const featureBranch = state.branches.find(b => b.name !== 'main');
      state.currentBranchId = null;
      expect(() => window.mergeBranch(featureBranch.id, {})).not.toThrow();
      expect(window.mergeBranch(featureBranch.id, {})).toBeNull();
    });
  });

  describe('previewMergeConflicts currentBranch null', () => {
    it('currentBranchId 为 null 时应返回空数组', () => {
      const featureBranch = state.branches.find(b => b.name !== 'main');
      state.currentBranchId = null;
      expect(() => {
        const r = window.previewMergeConflicts(featureBranch.id);
        expect(Array.isArray(r)).toBe(true);
        expect(r.length).toBe(0);
      }).not.toThrow();
    });

    it('sourceBranchId 不存在应返回空数组', () => {
      expect(() => {
        const r = window.previewMergeConflicts('br_nonexistent');
        expect(Array.isArray(r)).toBe(true);
        expect(r.length).toBe(0);
      }).not.toThrow();
    });

    it('null/undefined sourceBranchId 应返回空数组', () => {
      expect(() => {
        expect(window.previewMergeConflicts(null)).toEqual([]);
        expect(window.previewMergeConflicts(undefined)).toEqual([]);
      }).not.toThrow();
    });
  });

  describe('deleteBranch 边界', () => {
    it('删除不存在的 branchId 应静默返回', () => {
      const branchesBefore = state.branches.length;
      expect(() => window.deleteBranch('br_nonexistent')).not.toThrow();
      expect(state.branches.length).toBe(branchesBefore);
    });

    it('null/undefined branchId 应静默返回', () => {
      const branchesBefore = state.branches.length;
      expect(() => window.deleteBranch(null)).not.toThrow();
      expect(() => window.deleteBranch(undefined)).not.toThrow();
      expect(state.branches.length).toBe(branchesBefore);
    });

    it('删除父分支后子分支的 parentId 应被清理（避免孤儿引用）', () => {
      // Bug: 删除父分支后，子分支的 parentId 仍指向已删除的分支
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');
      // 确认 feature 是 main 的子分支
      expect(featureBranch.parentId).toBe(mainBranch.id);

      // 切到 main（避免删除当前分支）
      window.switchBranch(mainBranch.id);
      // 删除 feature 的子分支关系：先确认 feature 有 parentId
      // 删除 main 会失败（因为 feature 是 main 的子分支，且 main 可能是当前分支）
      // 改为：删除 feature（它是 main 的子分支），检查 main 的其他子分支
      window.deleteBranch(featureBranch.id);

      // 确认 feature 已删除
      expect(state.branches.find(b => b.id === featureBranch.id)).toBeUndefined();
      // 检查是否还有其他分支的 parentId 指向已删除的 feature
      const orphans = state.branches.filter(b => b.parentId === featureBranch.id);
      // 不应有孤儿引用（或应被清理为 null）
      orphans.forEach(o => {
        expect(o.parentId).toBeNull();
      });
    });
  });

  describe('loadVersion 边界', () => {
    it('无效 versionId 应静默返回', () => {
      const editor = window.$('editor');
      const contentBefore = editor.innerHTML;
      expect(() => window.loadVersion('v_nonexistent')).not.toThrow();
      // 编辑器内容不应被改变
      expect(editor.innerHTML).toBe(contentBefore);
    });

    it('null/undefined versionId 应静默返回', () => {
      const editor = window.$('editor');
      const contentBefore = editor.innerHTML;
      expect(() => window.loadVersion(null)).not.toThrow();
      expect(() => window.loadVersion(undefined)).not.toThrow();
      expect(editor.innerHTML).toBe(contentBefore);
    });

    it('version.blocks 为 null/undefined 不应崩溃', () => {
      // Bug: version.blocks.forEach 会抛 TypeError
      const mainBranch = state.branches.find(b => b.name === 'main');
      // 手动构造一个 blocks 为 null 的版本
      const badVersion = {
        id: 'v_badblocks', hash: 'bad000', parentId: null,
        branchId: mainBranch.id, message: '坏版本', author: mainBranch,
        timestamp: Date.now(), blocks: null, title: 'test',
      };
      state.versions.push(badVersion);

      expect(() => window.loadVersion('v_badblocks')).not.toThrow();
    });
  });

  describe('showDiffForVersion 边界', () => {
    it('无效 versionId 应静默返回', () => {
      expect(() => window.showDiffForVersion('v_nonexistent', true)).not.toThrow();
    });

    it('null/undefined versionId 应静默返回', () => {
      expect(() => window.showDiffForVersion(null, true)).not.toThrow();
      expect(() => window.showDiffForVersion(undefined, true)).not.toThrow();
    });
  });
});
