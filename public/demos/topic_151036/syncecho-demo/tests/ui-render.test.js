/**
 * UI 渲染函数测试 — RED 阶段
 * 测试 renderDiffSelectors、renderMergeSourceSelector、commit 边界、createBranch 边界
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('UI 渲染与边界', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    window.prompt = () => 'test';
    await waitForInit(500);
  });

  describe('renderDiffSelectors', () => {
    it('应填充 from/to 选择器', () => {
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);

      // renderDiffSelectors 在 updateUI 中已被调用，检查选择器有值
      const fromSel = window.$('diffFrom');
      const toSel = window.$('diffTo');
      expect(fromSel.value).toBeTruthy();
      expect(toSel.value).toBeTruthy();
    });

    it('用户手动选择版本后再次渲染不应重置用户选择', () => {
      // Bug: renderDiffSelectors 总是重置为默认值，覆盖用户手动选择
      const branch = window.getCurrentBranch();
      const versions = window.getBranchVersions(branch.id);
      if (versions.length < 3) return; // 不足 3 个版本无法测试

      const fromSel = window.$('diffFrom');
      const toSel = window.$('diffTo');

      // 模拟用户手动选择中间两个版本
      const userFrom = versions[1].id;
      const userTo = versions[2].id;
      fromSel.value = userFrom;
      toSel.value = userTo;

      // 再次渲染（模拟 updateUI 触发）
      window.renderDiffSelectors();

      // 应保留用户选择，而非重置为默认
      expect(fromSel.value).toBe(userFrom);
      expect(toSel.value).toBe(userTo);
    });
  });

  describe('renderMergeSourceSelector', () => {
    it('不应列出空分支（headVersionId 为 null）', () => {
      // Bug: renderMergeSourceSelector 只过滤当前分支，未过滤无 head 的空分支
      const mainBranch = state.branches.find(b => b.name === 'main');
      // 创建一个空分支（headVersionId = null）
      const emptyBranch = window.createBranch('empty-branch', mainBranch.id, null, '#ff0000');
      // 确保是空分支
      expect(emptyBranch.headVersionId).toBeNull();

      window.renderMergeSourceSelector();

      const sel = window.$('mergeSource');
      const options = Array.from(sel.options);
      const emptyOption = options.find(o => o.value === emptyBranch.id);
      // 空分支不应出现在合并源列表中
      expect(emptyOption).toBeUndefined();
    });
  });

  describe('commit message 边界', () => {
    it('纯空格 message 应回退到默认值', () => {
      // Bug: commit 使用 message || '更新文档'，纯空格 "   " 是 truthy，会通过
      const version = window.commit('   ');
      expect(version.message).toBe('更新文档');
    });

    it('空字符串 message 应回退到默认值', () => {
      const version = window.commit('');
      expect(version.message).toBe('更新文档');
    });

    it('null message 应回退到默认值', () => {
      const version = window.commit(null);
      expect(version.message).toBe('更新文档');
    });

    it('带空格的有效 message 应自动 trim', () => {
      const version = window.commit('  正常提交  ');
      expect(version.message).toBe('正常提交');
    });
  });

  describe('createBranch name 边界', () => {
    it('纯空格 name 应被拒绝或使用默认名', () => {
      // Bug: createBranch 不校验 name，允许纯空格
      const mainBranch = state.branches.find(b => b.name === 'main');
      const branch = window.createBranch('   ', mainBranch.id, mainBranch.headVersionId, '#ff0000');
      // 名字不应是纯空格
      expect(branch.name).not.toBe('   ');
    });

    it('带空格的有效 name 应自动 trim', () => {
      const mainBranch = state.branches.find(b => b.name === 'main');
      const branch = window.createBranch('  feature-x  ', mainBranch.id, mainBranch.headVersionId, '#ff0000');
      expect(branch.name).toBe('feature-x');
    });
  });

  describe('getCurrentBranch 边界', () => {
    it('currentBranchId 为 null 时应安全返回 undefined 而非崩溃', () => {
      // 测试 getCurrentBranch 的容错性
      state.currentBranchId = null;
      expect(() => window.getCurrentBranch()).not.toThrow();
      expect(window.getCurrentBranch()).toBeUndefined();
    });
  });
});
