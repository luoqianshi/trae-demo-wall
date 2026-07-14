/**
 * Blame 算法测试 — RED 阶段
 * 测试 blameBlock 的历史追踪正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('Blame 算法', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    await waitForInit(500);
  });

  it('blameBlock 应返回 block 的修改历史', () => {
    const branch = window.getCurrentBranch();
    const versions = window.getBranchVersions(branch.id);
    const latestVersion = versions[versions.length - 1];
    const firstBlock = latestVersion.blocks[0];

    const history = window.blameBlock(firstBlock.id);

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it('blameBlock 的"创建"标签应在最旧版本上，而非最新版本', () => {
    // Bug #3: blameBlock 倒序遍历导致"创建"标签出现在最新版本
    const branch = window.getCurrentBranch();
    const versions = window.getBranchVersions(branch.id);
    expect(versions.length).toBeGreaterThanOrEqual(2);

    // 修改一个 block 的内容并提交，产生"修改"记录
    const editor = window.$('editor');
    const firstP = editor.querySelector('p');
    if (firstP) {
      firstP.textContent = '这是修改后的内容，用于测试 blame';
      window.commit('修改测试');
    }

    const updatedVersions = window.getBranchVersions(branch.id);
    const latestVersion = updatedVersions[updatedVersions.length - 1];
    const firstBlock = latestVersion.blocks[0];

    const history = window.blameBlock(firstBlock.id);
    expect(history.length).toBeGreaterThan(0);

    // 找到"创建"标签
    const createdEntry = history.find(h => h.action === '创建');
    if (createdEntry) {
      // "创建"应该是最早的版本，不是最新的
      const createdVersionIdx = updatedVersions.findIndex(v => v.id === createdEntry.versionId);
      const latestVersionIdx = updatedVersions.length - 1;
      // "创建"版本的索引应小于最新版本的索引
      expect(createdVersionIdx).toBeLessThan(latestVersionIdx);
    }
  });

  it('blameBlock 应追踪 block 内容的修改', () => {
    const branch = window.getCurrentBranch();
    const versions = window.getBranchVersions(branch.id);
    const latestVersion = versions[versions.length - 1];
    const firstBlock = latestVersion.blocks[0];
    const originalContent = firstBlock.content;

    // 修改 block 内容
    const editor = window.$('editor');
    const blockEl = editor.querySelector(`[data-block-id="${firstBlock.id}"]`);
    if (blockEl) {
      blockEl.textContent = '完全不同的修改内容';
      window.commit('Blame 测试修改');
    }

    const history = window.blameBlock(firstBlock.id);
    // 应至少有"创建"和"修改"两条记录
    const actions = history.map(h => h.action);
    // 最新的历史记录应该是"修改"
    expect(actions).toContain('修改');
  });
});
