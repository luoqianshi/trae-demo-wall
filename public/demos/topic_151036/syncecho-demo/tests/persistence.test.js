/**
 * 持久化测试 — RED 阶段
 * 测试 persistState/loadState、branchUserX 持久化
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('持久化', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    await waitForInit(500);
  });

  describe('persistState / loadState', () => {
    it('persistState 应将状态写入 IndexedDB', async () => {
      await window.persistState();
      const snap = await window.dbGet('snapshot');
      expect(snap).toBeTruthy();
      expect(snap.branches).toBeDefined();
      expect(snap.versions).toBeDefined();
      expect(snap.currentBranchId).toBeDefined();
    });

    it('loadState 应从 IndexedDB 恢复状态', async () => {
      await window.persistState();
      // 清空 state 模拟刷新
      const savedBranches = state.branches.length;
      state.branches = [];
      state.versions = [];
      state.currentBranchId = null;

      const snap = await window.loadState();
      expect(snap).toBeTruthy();
      expect(state.branches.length).toBe(savedBranches);
    });

    it('persistState 应保存 selectedVersionId', async () => {
      state.selectedVersionId = 'test-selected-id';
      await window.persistState();
      const snap = await window.dbGet('snapshot');
      expect(snap.selectedVersionId).toBe('test-selected-id');
    });

    it('loadState 应恢复 selectedVersionId', async () => {
      // 使用真实存在的 versionId 以同时验证"恢复"与"有效性校验"两条逻辑
      const realVersionId = state.versions[0].id;
      state.selectedVersionId = realVersionId;
      await window.persistState();

      state.selectedVersionId = null;
      await window.loadState();
      expect(state.selectedVersionId).toBe(realVersionId);
    });

    it('loadState 对无效的 selectedVersionId 应回退到当前分支 head', async () => {
      // 保存一个不存在的 selectedVersionId，loadState 应回退而非恢复原值
      state.selectedVersionId = 'invalid-id-not-exist';
      await window.persistState();

      state.selectedVersionId = null;
      await window.loadState();
      const branch = window.getCurrentBranch();
      expect(state.selectedVersionId).toBe(branch.headVersionId);
    });

    it('persistState 应保存 branchUserX', async () => {
      // Bug #7: branchUserX 未持久化
      const branchId = state.branches[0].id;
      state.branchUserX = { [branchId]: 350 };
      await window.persistState();
      const snap = await window.dbGet('snapshot');
      expect(snap.branchUserX).toBeDefined();
      expect(snap.branchUserX[branchId]).toBe(350);
    });

    it('loadState 应恢复 branchUserX', async () => {
      // Bug #7: branchUserX 未恢复
      const branchId = state.branches[0].id;
      state.branchUserX = { [branchId]: 400 };
      await window.persistState();

      state.branchUserX = {};
      await window.loadState();
      expect(state.branchUserX[branchId]).toBe(400);
    });
  });

  describe('loadVersion 状态同步', () => {
    it('loadVersion 后应更新 selectedVersionId', () => {
      // Bug #5: loadVersion 不更新 selectedVersionId
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      if (versions.length >= 2) {
        const oldVersion = versions[0];
        window.loadVersion(oldVersion.id);
        expect(state.selectedVersionId).toBe(oldVersion.id);
      }
    });
  });
});
