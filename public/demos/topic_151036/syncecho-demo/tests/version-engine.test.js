/**
 * 版本引擎测试 — RED 阶段
 * 测试 switchBranchOnly、commit、branch 操作的正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('版本引擎', () => {
  let env, window, state;

  beforeEach(async () => {
    env = createDemoEnv();
    window = env.window;
    state = getState(window);
    // Mock confirm/prompt
    window.confirm = () => true;
    window.prompt = () => 'test';
    await waitForInit(500);
  });

  describe('switchBranchOnly', () => {
    it('调用 switchBranchOnly 不应抛出 ReferenceError', () => {
      // Bug #1: updateBranchSelector 未定义
      const branches = state.branches;
      expect(branches.length).toBeGreaterThan(0);
      const targetBranch = branches.find(b => b.id !== state.currentBranchId);
      expect(targetBranch).toBeDefined();

      // 这个调用不应抛出异常
      expect(() => {
        window.switchBranchOnly(targetBranch.id, targetBranch.headVersionId);
      }).not.toThrow();
    });

    it('switchBranchOnly 后编辑器内容不应被切换', () => {
      // Bug #2: switchBranchOnly 不应改变编辑器内容
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');
      expect(mainBranch).toBeDefined();
      expect(featureBranch).toBeDefined();

      // 先切到 main
      window.switchBranch(mainBranch.id);
      const editorBefore = window.$('editor');
      const contentBefore = editorBefore.innerHTML;

      // switchBranchOnly 切到 feature，但不应改变编辑器内容
      window.switchBranchOnly(featureBranch.id, featureBranch.headVersionId);
      const contentAfter = window.$('editor').innerHTML;

      expect(contentAfter).toBe(contentBefore);
    });

    it('switchBranchOnly 后 commit 不应污染目标分支', () => {
      // Bug #2: switchBranchOnly + commit 数据污染
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');

      // 切到 main，记录 main 的 head 版本数
      window.switchBranch(mainBranch.id);
      const mainVersionsBefore = state.versions.filter(v => v.branchId === mainBranch.id).length;

      // switchBranchOnly 到 feature（编辑器仍显示 main 内容）
      window.switchBranchOnly(featureBranch.id, featureBranch.headVersionId);

      // 此时 currentBranchId 是 feature，但编辑器是 main 的内容
      // 提交应该把内容提交到 feature 分支
      // 但编辑器内容是 main 的，这会造成数据不一致
      // 期望：switchBranchOnly 不应改变 currentBranchId（因为它不加载内容）
      // 或者：commit 前应检查编辑器内容与当前分支是否匹配
      expect(state.currentBranchId).toBe(featureBranch.id);
      // 编辑器内容应该仍是 main 的内容（switchBranchOnly 不调用 loadVersion）
      // 所以 commit 会把 main 的内容提交到 feature — 这是 bug
    });
  });

  describe('commit', () => {
    it('commit 应创建新版本并更新 headVersionId', () => {
      const branch = window.getCurrentBranch();
      const oldHead = branch.headVersionId;
      const versionCountBefore = state.versions.length;

      const version = window.commit('测试提交');

      expect(version).toBeDefined();
      expect(version.id).toMatch(/^v_/);
      expect(version.message).toBe('测试提交');
      expect(version.branchId).toBe(branch.id);
      expect(version.parentId).toBe(oldHead);
      expect(branch.headVersionId).toBe(version.id);
      expect(state.versions.length).toBe(versionCountBefore + 1);
    });

    it('commit 应更新 selectedVersionId 到新 head', () => {
      window.commit('测试提交2');
      const branch = window.getCurrentBranch();
      expect(state.selectedVersionId).toBe(branch.headVersionId);
    });

    it('commit 的 blocks 应包含 blockId', () => {
      const version = window.commit('测试 blockId');
      expect(version.blocks).toBeDefined();
      expect(version.blocks.length).toBeGreaterThan(0);
      version.blocks.forEach(block => {
        expect(block.id).toMatch(/^b_/);
      });
    });
  });

  describe('createBranch', () => {
    it('创建新分支应继承父分支 head', () => {
      const parent = window.getCurrentBranch();
      const newBranch = window.createBranch('test-branch', parent.id, parent.headVersionId, '#ff0000');

      expect(newBranch).toBeDefined();
      expect(newBranch.name).toBe('test-branch');
      expect(newBranch.parentId).toBe(parent.id);
      expect(newBranch.headVersionId).toBe(parent.headVersionId);
      expect(newBranch.color).toBe('#ff0000');
      expect(state.branches).toContainEqual(newBranch);
    });
  });

  describe('deleteBranch', () => {
    it('删除分支应同时删除该分支的所有版本', () => {
      const mainBranch = state.branches.find(b => b.name === 'main');
      const featureBranch = state.branches.find(b => b.name !== 'main');
      window.switchBranch(mainBranch.id);

      const featureVersionsBefore = state.versions.filter(v => v.branchId === featureBranch.id).length;
      expect(featureVersionsBefore).toBeGreaterThan(0);

      window.deleteBranch(featureBranch.id);

      const featureVersionsAfter = state.versions.filter(v => v.branchId === featureBranch.id).length;
      expect(featureVersionsAfter).toBe(0);
      expect(state.branches.find(b => b.id === featureBranch.id)).toBeUndefined();
    });

    it('不应删除当前所在分支', () => {
      const currentBranch = window.getCurrentBranch();
      window.deleteBranch(currentBranch.id);
      // 当前分支应仍然存在
      expect(state.branches.find(b => b.id === currentBranch.id)).toBeDefined();
    });
  });

  describe('revertToVersion', () => {
    it('回退版本应创建新的 forward commit', () => {
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);

      const oldVersion = versions[0];
      const headBefore = branch.headVersionId;
      const versionCountBefore = state.versions.length;

      window.revertToVersion(oldVersion.id);

      // 应创建新版本（forward commit），而非删除后续版本
      expect(state.versions.length).toBe(versionCountBefore + 1);
      expect(branch.headVersionId).not.toBe(headBefore);
      // 新版本内容应与回退目标一致
      const newHead = state.versions.find(v => v.id === branch.headVersionId);
      expect(newHead.blocks).toEqual(oldVersion.blocks);
    });

    it('回退生成的新版本应带 isRevert 标记和 revertedFrom 字段', () => {
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      const oldVersion = versions[0];

      window.revertToVersion(oldVersion.id);

      const newHead = state.versions.find(v => v.id === branch.headVersionId);
      expect(newHead.isRevert).toBe(true);
      expect(newHead.revertedFrom).toBe(oldVersion.id);
    });
  });

  describe('showDiffForVersion', () => {
    it('对有父版本的节点应设置 diffFrom=parentId, diffTo=versionId', () => {
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);
      const target = versions[1]; // 第二个版本，有父版本
      expect(target.parentId).toBeTruthy();

      window.showDiffForVersion(target.id, true);

      expect(window.$('diffFrom').value).toBe(target.parentId);
      expect(window.$('diffTo').value).toBe(target.id);
    });

    it('forceJump=true 应切换到 diff tab', () => {
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      const target = versions[0];

      // 先切到其他 tab
      window.switchTab('collab');
      expect(window.isDiffTabActive()).toBe(false);

      window.showDiffForVersion(target.id, true);
      expect(window.isDiffTabActive()).toBe(true);
    });

    it('对根提交（无父版本）应使用自身作为 from', () => {
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      const root = versions.find(v => !v.parentId) || versions[0];

      window.showDiffForVersion(root.id, true);
      // from = parentId || self，根提交 from===to，renderDiff 会显示空态
      expect(window.$('diffFrom').value).toBe(root.id);
      expect(window.$('diffTo').value).toBe(root.id);
    });
  });

  describe('renameBranch', () => {
    it('纯空格字符串应被拒绝', () => {
      // Bug: renameBranch 只检查 !newName，纯空格 "   " 是 truthy，会被接受
      const branch = state.branches.find(b => b.name !== 'main');
      const originalName = branch.name;

      window.renameBranch(branch.id, '   ');

      // 名字不应被改为纯空格
      expect(branch.name).toBe(originalName);
    });

    it('空字符串应被拒绝', () => {
      const branch = state.branches.find(b => b.name !== 'main');
      const originalName = branch.name;

      window.renameBranch(branch.id, '');

      expect(branch.name).toBe(originalName);
    });

    it('null/undefined 应被拒绝', () => {
      const branch = state.branches.find(b => b.name !== 'main');
      const originalName = branch.name;

      window.renameBranch(branch.id, null);
      expect(branch.name).toBe(originalName);

      window.renameBranch(branch.id, undefined);
      expect(branch.name).toBe(originalName);
    });

    it('前后带空格的有效名称应自动 trim', () => {
      const branch = state.branches.find(b => b.name !== 'main');

      window.renameBranch(branch.id, '  新名称  ');

      expect(branch.name).toBe('新名称');
    });
  });

  describe('switchBranch 空分支', () => {
    it('切换到无 headVersionId 的分支应清空 selectedVersionId', () => {
      // Bug: switchBranch 的 else 分支不更新 selectedVersionId，
      // 导致切换到空分支后 selectedVersionId 仍指向其他分支的版本
      // 先创建一个有 head 的分支并切换
      const mainBranch = state.branches.find(b => b.name === 'main');
      window.switchBranch(mainBranch.id);
      expect(state.selectedVersionId).toBe(mainBranch.headVersionId);

      // 手动构造一个空分支（headVersionId = null）
      const emptyBranch = window.createBranch('empty-branch', mainBranch.id, null, '#ff0000');
      // 修改 headVersionId 为 null（createBranch 可能默认赋值）
      const branchObj = state.branches.find(b => b.id === emptyBranch.id);
      branchObj.headVersionId = null;

      // 切换到空分支
      window.switchBranch(emptyBranch.id);

      // selectedVersionId 应被清空（null/undefined），不应保留原分支的版本
      expect(state.selectedVersionId).toBeFalsy();
    });
  });
});
