/**
 * Block 管理 & 编辑器测试 — RED 阶段
 * 测试 getEditorBlocks、ensureBlockIds、嵌套元素处理
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit, getState } from './setup.js';

describe('Block 管理', () => {
  let window, state;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    state = getState(window);
    window.confirm = () => true;
    await waitForInit(500);
  });

  describe('getEditorBlocks', () => {
    it('应提取编辑器中的所有 block', () => {
      const blocks = window.getEditorBlocks();
      expect(blocks.length).toBeGreaterThan(0);
      blocks.forEach(block => {
        expect(block.id).toMatch(/^b_/);
        expect(block.content).toBeDefined();
        expect(block.position).toBeGreaterThanOrEqual(0);
      });
    });

    it('不应重复计数嵌套元素（blockquote 内的 p）', () => {
      // Bug #4: getEditorBlocks 会同时匹配 blockquote 和其内部的 p
      const editor = window.$('editor');
      editor.innerHTML = '';

      // 创建嵌套结构：blockquote > p
      const blockquote = window.document.createElement('blockquote');
      blockquote.setAttribute('data-block-id', 'b_quote1');
      blockquote.textContent = '引用文字';
      const innerP = window.document.createElement('p');
      innerP.setAttribute('data-block-id', 'b_inner1');
      innerP.textContent = '引用内的段落';
      blockquote.appendChild(innerP);
      editor.appendChild(blockquote);

      // 创建一个独立段落
      const standaloneP = window.document.createElement('p');
      standaloneP.setAttribute('data-block-id', 'b_standalone');
      standaloneP.textContent = '独立段落';
      editor.appendChild(standaloneP);

      const blocks = window.getEditorBlocks();

      // 应该只有 2 个 block：blockquote 和 standalone p
      // 不应包含 blockquote 内部的 p（避免重复计数）
      expect(blocks.length).toBe(2);
      const ids = blocks.map(b => b.id);
      expect(ids).toContain('b_quote1');
      expect(ids).toContain('b_standalone');
      expect(ids).not.toContain('b_inner1');
    });
  });

  describe('ensureBlockIds', () => {
    it('应为没有 blockId 的元素分配 ID', () => {
      const editor = window.$('editor');
      editor.innerHTML = '';
      const p = window.document.createElement('p');
      p.textContent = '无 ID 段落';
      editor.appendChild(p);

      expect(p.getAttribute('data-block-id')).toBeNull();

      const count = window.ensureBlockIds();
      expect(count).toBe(1);
      expect(p.getAttribute('data-block-id')).toMatch(/^b_/);
    });
  });

  describe('renderInitialContent', () => {
    it('应渲染初始内容并分配 blockId', () => {
      window.renderInitialContent();
      const editor = window.$('editor');
      const blocks = editor.querySelectorAll('p, h1, h2, h3, li, blockquote');
      expect(blocks.length).toBeGreaterThan(0);
      blocks.forEach(block => {
        expect(block.getAttribute('data-block-id')).toMatch(/^b_/);
      });
    });
  });
});
