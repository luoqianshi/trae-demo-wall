import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 验证 base.ts 中的生产环境保护和 resetData 行为。
 *
 * 覆盖审查报告 M-3 指出的测试缺口：
 * 1. resetData() 在 production 环境下抛错
 * 2. resetData() 清理 globalThis 单例
 * 3. ensureInitialData() 在测试环境下跳过自动初始化
 */
describe('base.ts production protection and resetData behavior', () => {
  const globalKey = '__snowballStorage__';
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    // 清理 globalThis 单例
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[globalKey]) {
      delete (globalThis as Record<string, unknown>)[globalKey];
    }
  });

  afterEach(() => {
    // 恢复 NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('resetData() production protection', () => {
    it('should throw error when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      const { resetData } = await import('../../repositories/base');

      expect(() => resetData()).toThrow(/Refusing to reset data in production/);
    });

    it('should NOT throw when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      const { resetData } = await import('../../repositories/base');

      // 应该正常执行，不抛错
      expect(() => resetData()).not.toThrow();
    });

    it('should NOT throw when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      const { resetData } = await import('../../repositories/base');

      expect(() => resetData()).not.toThrow();
    });
  });

  describe('resetData() globalThis cleanup', () => {
    it('should clear globalThis storage singleton after reset', async () => {
      process.env.NODE_ENV = 'test';
      const baseModule = await import('../../repositories/base');

      // storage 应该存在于 globalThis
      expect((globalThis as Record<string, unknown>)[globalKey]).toBeDefined();

      baseModule.resetData();

      // resetData 后 globalThis 单例应被清理
      expect((globalThis as Record<string, unknown>)[globalKey]).toBeUndefined();
    });

    it('should allow creating a fresh storage instance after reset', async () => {
      process.env.NODE_ENV = 'test';
      const baseModule1 = await import('../../repositories/base');
      const storage1 = baseModule1.storage;

      baseModule1.resetData();
      vi.resetModules();

      // 重新加载模块，应该创建新实例
      const baseModule2 = await import('../../repositories/base');
      const storage2 = baseModule2.storage;

      // 由于 globalThis 已清理，新实例应该是不同的对象
      expect(storage2).not.toBe(storage1);
    });
  });

  describe('ensureInitialData() test environment skip', () => {
    const testDataFile = path.resolve(process.cwd(), 'data', '.test-ensure-initial.json');

    beforeEach(() => {
      // 清理测试文件
      [testDataFile, `${testDataFile}.bak`, `${testDataFile}.wal`, `${testDataFile}.lock`].forEach((f) => {
        try { fs.unlinkSync(f); } catch { /* not present */ }
      });
    });

    afterEach(() => {
      [testDataFile, `${testDataFile}.bak`, `${testDataFile}.wal`, `${testDataFile}.lock`].forEach((f) => {
        try { fs.unlinkSync(f); } catch { /* not present */ }
      });
    });

    it('should skip auto-initialization in test environment', async () => {
      process.env.NODE_ENV = 'test';
      process.env.LOCAL_DB_FILE = testDataFile;

      // 清理 globalThis 确保重新创建
      if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[globalKey]) {
        delete (globalThis as Record<string, unknown>)[globalKey];
      }
      vi.resetModules();

      // 文件不存在的情况下加载模块
      expect(fs.existsSync(testDataFile)).toBe(false);

      await import('../../repositories/base');

      // 测试环境下 ensureInitialData 应该跳过，文件不应该被创建
      expect(fs.existsSync(testDataFile)).toBe(false);

      // 恢复环境变量
      process.env.LOCAL_DB_FILE = path.resolve(process.cwd(), 'data', '.test-local-db.json');
    });
  });
});
