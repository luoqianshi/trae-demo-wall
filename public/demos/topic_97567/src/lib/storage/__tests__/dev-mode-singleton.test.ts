import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * 验证 storage 在 dev mode 热重载下保持单例。
 *
 * 模拟 Next.js Turbopack 在 dev mode 下重新加载模块的场景：
 * 1. 首次加载 base.ts 创建 storage 实例
 * 2. 通过 vi.resetModules() 清除模块缓存（模拟热重载）
 * 3. 再次加载 base.ts，应该复用 globalThis 上的同一个 storage 实例
 *
 * 如果没有 globalThis 单例保护，第二次加载会创建新实例，
 * 其 cache 为空，可能用空数据覆盖文件中的有效数据。
 */
describe('Storage singleton in dev mode (HMR simulation)', () => {
  const globalKey = '__snowballStorage__';

  beforeEach(() => {
    // 清理 globalThis 上的 storage 单例
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>)[globalKey]) {
      delete (globalThis as Record<string, unknown>)[globalKey];
    }
    // 清除模块缓存，确保每次测试都重新加载 base.ts
    vi.resetModules();
  });

  it('should preserve the same storage instance across module reloads (HMR simulation)', async () => {
    // 第一次加载 base 模块 - 创建 storage 实例并存储到 globalThis
    const baseModule1 = await import('../../repositories/base');
    const storage1 = baseModule1.storage;

    // 验证实例已存储到 globalThis
    expect((globalThis as Record<string, unknown>)[globalKey]).toBeDefined();
    expect((globalThis as Record<string, unknown>)[globalKey]).toBe(storage1);

    // 模拟 HMR：清除模块缓存（这是 Turbopack 热重载的关键行为）
    vi.resetModules();

    // 第二次加载 base 模块 - 由于 globalThis 保留了实例，应该复用同一实例
    const baseModule2 = await import('../../repositories/base');
    const storage2 = baseModule2.storage;

    // 关键断言：两次加载应该获得同一个 storage 实例
    // 如果没有 globalThis 保护，这里会失败（不同实例）
    expect(storage2).toBe(storage1);
    expect((globalThis as Record<string, unknown>)[globalKey]).toBe(storage1);
  });

  it('should have read and write methods on the singleton storage', async () => {
    const { storage } = await import('../../repositories/base');

    // 验证 storage 实例具有必要的方法
    expect(typeof storage.read).toBe('function');
    expect(typeof storage.write).toBe('function');
    expect(typeof storage.withTransaction).toBe('function');
  });

  it('should not lose data when module is reloaded (critical regression test)', async () => {
    // 这是一个端到端的回归测试，验证 HMR 场下数据不丢失
    // 1. 第一次加载，写入一些数据
    const baseModule1 = await import('../../repositories/base');
    const { writeData, readData } = baseModule1;
    writeData({
      ...baseModule1.getDefaultData(),
      records: [{ id: 'test-1', content: 'HMR regression test' } as never],
    });

    // 验证写入成功
    const data1 = readData();
    expect(data1.records).toHaveLength(1);

    // 2. 模拟 HMR：清除模块缓存
    vi.resetModules();

    // 3. 重新加载模块，读取数据 - 应该仍然存在
    const baseModule2 = await import('../../repositories/base');
    const data2 = baseModule2.readData();

    // 关键断言：HMR 后数据不应该丢失
    expect(data2.records).toHaveLength(1);
    expect(data2.records[0]).toMatchObject({ id: 'test-1', content: 'HMR regression test' });

    // 清理：删除测试数据
    baseModule2.resetData();
  });

  it('should reuse the same storage instance across module reloads (cache consistency)', async () => {
    // 验证 storage 实例通过 globalThis 共享，且写入的数据在 reload 后可读
    // 注意：不依赖 cache 引用相等，因为 readInternal 在文件不存在时返回新对象
    const baseModule1 = await import('../../repositories/base');
    const { storage: storage1 } = baseModule1;

    // 写入一些数据以填充 cache
    const testData = { testKey: 'cache-consistency' } as never;
    storage1.write(testData);

    vi.resetModules();

    // 重新加载，storage 实例应该相同（globalThis 共享）
    const baseModule2 = await import('../../repositories/base');
    const { storage: storage2 } = baseModule2;
    const data2 = storage2.read();

    // 实例相同，且写入的数据可读
    expect(storage2).toBe(storage1);
    expect(data2).toMatchObject({ testKey: 'cache-consistency' });

    // 清理测试数据
    baseModule2.resetData();
  });
});
