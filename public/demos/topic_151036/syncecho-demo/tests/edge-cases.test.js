/**
 * 边界容错测试 — RED 阶段第二轮
 * 测试 switchTab、blameBlock、revertToVersion、charDiff、renderCharDiff 的边界容错
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('边界容错（第二轮）', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    window.prompt = () => 'test';
    await waitForInit(500);
  });

  describe('switchTab 边界', () => {
    it('无效 tabName 不应崩溃', () => {
      // Bug: querySelector 返回 null，classList 抛 TypeError
      expect(() => window.switchTab('nonexistent')).not.toThrow();
    });

    it('null/undefined tabName 不应崩溃', () => {
      expect(() => window.switchTab(null)).not.toThrow();
      expect(() => window.switchTab(undefined)).not.toThrow();
    });
  });

  describe('blameBlock 边界', () => {
    it('currentBranchId 为 null 时不应崩溃', () => {
      // Bug: getCurrentBranch() 返回 undefined，branch.id 抛 TypeError
      state.currentBranchId = null;
      expect(() => window.blameBlock('b_test')).not.toThrow();
      expect(window.blameBlock('b_test')).toEqual([]);
    });

    it('不存在的 blockId 应返回空历史', () => {
      const result = window.blameBlock('b_nonexistent_xyz');
      expect(Array.isArray(result)).toBe(true);
      // 可能返回 [] 或包含创建记录，但不应崩溃
    });

    it('null/undefined blockId 应返回空数组', () => {
      expect(() => {
        const r1 = window.blameBlock(null);
        const r2 = window.blameBlock(undefined);
        expect(Array.isArray(r1)).toBe(true);
        expect(Array.isArray(r2)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('revertToVersion 边界', () => {
    it('回退到不存在的版本应静默返回', () => {
      const versionsBefore = state.versions.length;
      expect(() => window.revertToVersion('v_nonexistent')).not.toThrow();
      // 不应创建新版本
      expect(state.versions.length).toBe(versionsBefore);
    });

    it('回退到当前 head 版本不应创建空提交', () => {
      // Bug: 回退到当前 head 会创建内容相同的无意义空提交
      const branch = window.getCurrentBranch();
      const headBefore = branch.headVersionId;
      const versionsBefore = state.versions.length;

      window.revertToVersion(headBefore);

      // 如果 head 没变，说明没有创建新提交（或创建了但 head 指向新版本）
      // 关键：不应创建与 head 内容完全相同的无意义提交
      const newHead = branch.headVersionId;
      if (newHead !== headBefore) {
        // 如果创建了新提交，新提交内容应与目标一致（这是正确的回退行为）
        const newHeadVersion = state.versions.find(v => v.id === newHead);
        const targetVersion = state.versions.find(v => v.id === headBefore);
        // 但回退到自身不应创建新提交（这是无意义的）
        // 期望：回退到 head 时应直接返回，不创建新版本
        expect(state.versions.length).toBe(versionsBefore);
      }
    });

    it('null/undefined versionId 应静默返回', () => {
      const versionsBefore = state.versions.length;
      expect(() => window.revertToVersion(null)).not.toThrow();
      expect(() => window.revertToVersion(undefined)).not.toThrow();
      expect(state.versions.length).toBe(versionsBefore);
    });
  });

  describe('charDiff 边界', () => {
    it('null 输入应返回空数组而非崩溃', () => {
      // Bug: [...null] 抛 TypeError
      expect(() => {
        const r = window.charDiff(null, 'abc');
        expect(Array.isArray(r)).toBe(true);
      }).not.toThrow();
    });

    it('undefined 输入应返回空数组而非崩溃', () => {
      expect(() => {
        const r = window.charDiff(undefined, undefined);
        expect(Array.isArray(r)).toBe(true);
      }).not.toThrow();
    });

    it('非字符串输入（number）应被转为字符串处理', () => {
      expect(() => {
        const r = window.charDiff(123, 456);
        expect(Array.isArray(r)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('renderCharDiff 边界', () => {
    it('null 输入应返回空字符串而非崩溃', () => {
      expect(() => {
        const r = window.renderCharDiff(null, null);
        expect(typeof r).toBe('string');
      }).not.toThrow();
    });

    it('undefined 输入应返回空字符串而非崩溃', () => {
      expect(() => {
        const r = window.renderCharDiff(undefined, undefined);
        expect(typeof r).toBe('string');
      }).not.toThrow();
    });
  });
});
