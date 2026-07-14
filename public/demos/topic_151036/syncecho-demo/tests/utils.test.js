/**
 * 工具函数测试 — RED 阶段
 * 测试 escapeHtml、shortHash、fmtDateTime、uuid 的健壮性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDemoEnv, waitForInit } from './setup.js';

describe('工具函数', () => {
  let window;

  beforeEach(async () => {
    const env = createDemoEnv();
    window = env.window;
    window.confirm = () => true;
    await waitForInit(500);
  });

  describe('escapeHtml', () => {
    it('应转义 < > &', () => {
      const result = window.escapeHtml('<script>alert("x")</script>&amp;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
    });

    it('应转义双引号（用于属性值时防 XSS）', () => {
      // Bug: 当前实现使用 textContent/innerHTML，不转义引号
      // 当 escapeHtml 结果被插入到 HTML 属性中（如 data-vid="..."）时，
      // 用户输入的 " 会破坏属性边界，造成 XSS
      const result = window.escapeHtml('a"b');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('"');
    });

    it('应转义单引号（用于属性值时防 XSS）', () => {
      const result = window.escapeHtml("a'b");
      expect(result).toContain('&#39;');
      expect(result).not.toContain("'");
    });

    it('null/undefined 应返回空字符串', () => {
      expect(window.escapeHtml(null)).toBe('');
      expect(window.escapeHtml(undefined)).toBe('');
    });
  });

  describe('shortHash', () => {
    it('应返回长度恰好为 6 的字符串', () => {
      const h = window.shortHash();
      expect(typeof h).toBe('string');
      expect(h.length).toBe(6);
    });

    it('多次调用应稳定返回 6 位', () => {
      // Bug: Math.random().toString(16).slice(2,8) 在极端情况下
      // （数字非常小，toString(16) 小数部分不足 6 位）会返回短于 6 位的字符串
      for (let i = 0; i < 100; i++) {
        const h = window.shortHash();
        expect(h.length).toBe(6);
      }
    });

    it('应只包含十六进制字符', () => {
      for (let i = 0; i < 50; i++) {
        const h = window.shortHash();
        expect(h).toMatch(/^[0-9a-f]{6}$/);
      }
    });
  });

  describe('fmtDateTime', () => {
    it('应格式化有效时间戳为 MM-DD HH:mm', () => {
      const ts = new Date('2026-07-13T14:30:00').getTime();
      const result = window.fmtDateTime(ts);
      expect(result).toBe('07-13 14:30');
    });

    it('对无效时间戳应返回占位符而非 "NaN-NaN NaN:NaN"', () => {
      // Bug: 当前实现无 isNaN 校验，输出 "NaN-NaN NaN:NaN"
      const result = window.fmtDateTime('not-a-date');
      expect(result).not.toContain('NaN');
      expect(result.length).toBeGreaterThan(0);
    });

    it('对 null/undefined 应返回占位符', () => {
      const r1 = window.fmtDateTime(null);
      const r2 = window.fmtDateTime(undefined);
      expect(r1).not.toContain('NaN');
      expect(r2).not.toContain('NaN');
    });
  });

  describe('uuid', () => {
    it('应返回 b_ 前缀的字符串', () => {
      const id = window.uuid();
      expect(id).toMatch(/^b_/);
    });

    it('应返回稳定长度', () => {
      for (let i = 0; i < 50; i++) {
        const id = window.uuid();
        // b_ + 8 位 = 10 字符
        expect(id.length).toBe(10);
      }
    });
  });
});
