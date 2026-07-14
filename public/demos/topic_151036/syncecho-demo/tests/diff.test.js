/**
 * Diff 算法测试 — RED 阶段
 * 测试 diffVersions、charDiff 的正确性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit } from './setup.js';

describe('Diff 算法', () => {
  let window;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    window.confirm = () => true;
    await waitForInit(500);
  });

  describe('diffVersions', () => {
    function makeVersion(blocks) {
      return { blocks: blocks.map(b => ({ ...b })) };
    }

    it('应正确识别新增的 block', () => {
      const v1 = makeVersion([
        { id: 'b_1', content: 'A', position: 0 },
      ]);
      const v2 = makeVersion([
        { id: 'b_1', content: 'A', position: 0 },
        { id: 'b_2', content: 'B', position: 1 },
      ]);

      const changes = window.diffVersions(v1, v2);
      const added = changes.filter(c => c.type === 'added');
      expect(added.length).toBe(1);
      expect(added[0].block.id).toBe('b_2');
    });

    it('应正确识别删除的 block', () => {
      const v1 = makeVersion([
        { id: 'b_1', content: 'A', position: 0 },
        { id: 'b_2', content: 'B', position: 1 },
      ]);
      const v2 = makeVersion([
        { id: 'b_1', content: 'A', position: 0 },
      ]);

      const changes = window.diffVersions(v1, v2);
      const deleted = changes.filter(c => c.type === 'deleted');
      expect(deleted.length).toBe(1);
      expect(deleted[0].block.id).toBe('b_2');
    });

    it('应正确识别修改的 block', () => {
      const v1 = makeVersion([
        { id: 'b_1', content: '旧内容', position: 0 },
      ]);
      const v2 = makeVersion([
        { id: 'b_1', content: '新内容', position: 0 },
      ]);

      const changes = window.diffVersions(v1, v2);
      const modified = changes.filter(c => c.type === 'modified');
      expect(modified.length).toBe(1);
      expect(modified[0].oldBlock.content).toBe('旧内容');
      expect(modified[0].newBlock.content).toBe('新内容');
    });

    it('应正确识别移动的 block（内容不变但位置改变）', () => {
      const v1 = makeVersion([
        { id: 'b_1', content: 'A', position: 0 },
        { id: 'b_2', content: 'B', position: 1 },
      ]);
      const v2 = makeVersion([
        { id: 'b_2', content: 'B', position: 0 },
        { id: 'b_1', content: 'A', position: 1 },
      ]);

      const changes = window.diffVersions(v1, v2);
      const moved = changes.filter(c => c.type === 'moved');
      expect(moved.length).toBe(2);
    });

    it('v1.blocks 为 undefined 应返回空数组而非崩溃', () => {
      // Bug: v1.blocks.map 会抛 TypeError
      expect(() => {
        const result = window.diffVersions({ blocks: undefined }, { blocks: [] });
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });

    it('v2.blocks 为 null 应返回空数组而非崩溃', () => {
      expect(() => {
        const result = window.diffVersions({ blocks: [] }, { blocks: null });
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });

    it('v1 和 v2 都无 blocks 应返回空数组', () => {
      expect(() => {
        const result = window.diffVersions({}, {});
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      }).not.toThrow();
    });

    it('v1 或 v2 为 null 应返回空数组', () => {
      expect(() => {
        const result1 = window.diffVersions(null, { blocks: [] });
        const result2 = window.diffVersions({ blocks: [] }, null);
        expect(Array.isArray(result1)).toBe(true);
        expect(Array.isArray(result2)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('charDiff', () => {
    it('应正确识别字符级新增', () => {
      const result = window.charDiff('abc', 'abcd');
      const added = result.filter(c => c.type === 'add');
      expect(added.length).toBe(1);
      expect(added[0].char).toBe('d');
    });

    it('应正确识别字符级删除', () => {
      const result = window.charDiff('abcd', 'abc');
      const deleted = result.filter(c => c.type === 'del');
      expect(deleted.length).toBe(1);
      expect(deleted[0].char).toBe('d');
    });

    it('应正确识别字符级修改', () => {
      const result = window.charDiff('hello', 'hallo');
      const changed = result.filter(c => c.type === 'del' || c.type === 'add');
      // e -> a: 1 del + 1 add
      expect(changed.length).toBe(2);
      const dels = changed.filter(c => c.type === 'del');
      const adds = changed.filter(c => c.type === 'add');
      expect(dels[0].char).toBe('e');
      expect(adds[0].char).toBe('a');
    });

    it('相同字符串应全部为 same', () => {
      const result = window.charDiff('hello', 'hello');
      const same = result.filter(c => c.type === 'same');
      expect(same.length).toBe(5);
    });

    it('空字符串到非空应全部为 add', () => {
      const result = window.charDiff('', 'abc');
      const added = result.filter(c => c.type === 'add');
      expect(added.length).toBe(3);
    });
  });

  describe('renderCharDiff', () => {
    it('应生成包含 span 标签的 HTML', () => {
      const html = window.renderCharDiff('abc', 'abcd');
      expect(html).toContain('<span');
      expect(html).toContain('d');
    });
  });
});
