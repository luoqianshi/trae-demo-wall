import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createJsonStorage } from '../json-storage';

describe('JsonStorage', () => {
  const dataFile = path.join(process.cwd(), 'data', '.test-storage.json');
  // Tests use varying data shapes ({items},{users}); `any` avoids over-constraining
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storage: any;

  beforeEach(() => {
    cleanup();
    storage = createJsonStorage(dataFile, { lockTimeout: 2000, retryInterval: 20 });
  });
  afterEach(() => {
    cleanup();
  });

  function cleanup() {
    [dataFile, `${dataFile}.wal`, `${dataFile}.bak`, `${dataFile}.lock`].forEach((f) => {
      try { fs.unlinkSync(f); } catch { /* not present */ }
    });
  }

  it('should return empty object when file missing', () => {
    const data = storage.read();
    expect(data).toEqual({});
  });

  it('should persist writes atomically', () => {
    storage.write({ items: [1, 2, 3] });
    const raw = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    expect(raw.items).toEqual([1, 2, 3]);
  });

  it('should cache reads after first load', () => {
    storage.write({ items: [1] });
    const d1 = storage.read();
    const d2 = storage.read();
    expect(d1).toBe(d2); // same reference (cached)
  });

  it('should rollback transaction on error', () => {
    storage.write({ items: [1] });
    expect(() => {
      storage.withTransaction((tx) => {
        tx.data.items.push(2);
        throw new Error('simulated failure');
      });
    }).toThrow();
    const data = storage.read();
    expect(data.items).toEqual([1]); // unchanged
  });

  it('should auto-commit transaction on success', () => {
    storage.write({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      return tx.data;
    });
    const data = storage.read();
    expect(data.items).toEqual([1, 2]);
  });

  it('should support explicit commit inside transaction', () => {
    storage.write({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      tx.commit();
    });
    const data = storage.read();
    expect(data.items).toEqual([1, 2]);
  });

  it('should support explicit rollback inside transaction', () => {
    storage.write({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      tx.rollback();
    });
    const data = storage.read();
    expect(data.items).toEqual([1]); // rolled back
  });

  it('should recover from WAL on restart', () => {
    storage.write({ items: [1] });
    // Simulate crash: write WAL but do not update main file
    const walFile = `${dataFile}.wal`;
    fs.writeFileSync(walFile, JSON.stringify({
      op: 'replace',
      data: { items: [1, 2, 3] },
      timestamp: new Date().toISOString(),
    }));
    // Recreate storage (simulates process restart)
    storage = createJsonStorage(dataFile, { lockTimeout: 2000, retryInterval: 20 });
    const data = storage.read();
    expect(data.items).toEqual([1, 2, 3]);
    expect(fs.existsSync(walFile)).toBe(false); // WAL cleared after replay
  });

  it('should backup before write', () => {
    storage.write({ items: [1] });
    storage.write({ items: [1, 2] });
    expect(fs.existsSync(`${dataFile}.bak`)).toBe(true);
    const bak = JSON.parse(fs.readFileSync(`${dataFile}.bak`, 'utf-8'));
    expect(bak.items).toEqual([1]); // previous content
  });

  it('should recover from .bak when main file is corrupt', () => {
    storage.write({ items: [1] });
    storage.write({ items: [1, 2] }); // .bak now has {items:[1]}
    // Corrupt the main file
    fs.writeFileSync(dataFile, 'not-valid-json{');
    storage._resetCache();
    const data = storage.read();
    expect(data.items).toEqual([1]); // recovered from .bak
  });

  it('should throw when both main and backup are corrupt', () => {
    storage.write({ items: [1] });
    fs.writeFileSync(dataFile, 'not-valid-json{');
    fs.writeFileSync(`${dataFile}.bak`, 'also-corrupt{');
    storage._resetCache();
    expect(() => storage.read()).toThrow(/corrupted/);
  });

  it('should handle nested transaction data mutations', () => {
    storage.write({ users: [] });
    storage.withTransaction((tx) => {
      tx.data.users.push({ id: 1, name: 'Alice' });
      tx.data.users.push({ id: 2, name: 'Bob' });
      tx.data.users[0].name = 'Alice Updated';
    });
    const data = storage.read();
    expect(data.users).toHaveLength(2);
    expect(data.users[0].name).toBe('Alice Updated');
    expect(data.users[1].name).toBe('Bob');
  });

  // L-1: Nested transaction rollback/commit semantics
  it('should throw when nested transaction calls rollback', () => {
    storage.write({ items: [1] });
    expect(() => {
      storage.withTransaction((tx) => {
        tx.data.items.push(2);
        storage.withTransaction((nestedTx) => {
          nestedTx.data.items.push(3);
          nestedTx.rollback(); // should throw
        });
      });
    }).toThrow(/Cannot rollback nested transaction/);
    // Outer transaction should have rolled back due to the thrown error
    const data = storage.read();
    expect(data.items).toEqual([1]);
  });

  it('should roll back outer transaction when nested transaction throws', () => {
    storage.write({ items: [1] });
    expect(() => {
      storage.withTransaction((tx) => {
        tx.data.items.push(2);
        storage.withTransaction((nestedTx) => {
          nestedTx.data.items.push(3);
          throw new Error('nested failure');
        });
      });
    }).toThrow(/nested failure/);
    const data = storage.read();
    expect(data.items).toEqual([1]); // both mutations rolled back
  });

  it('should treat nested commit as no-op (outer transaction commits)', () => {
    storage.write({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      storage.withTransaction((nestedTx) => {
        nestedTx.data.items.push(3);
        nestedTx.commit(); // no-op, outer transaction still commits
      });
    });
    const data = storage.read();
    expect(data.items).toEqual([1, 2, 3]);
  });

  // L-2: Reference counting — read/write inside transaction must not release lock early
  it('should not release lock when read() is called inside transaction', () => {
    storage.write({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      // Calling read() inside a transaction should use the same lock (reference counted)
      const innerData = storage.read();
      expect(innerData.items).toEqual([1, 2]); // sees uncommitted changes from cache
      tx.data.items.push(3);
    });
    const data = storage.read();
    expect(data.items).toEqual([1, 2, 3]); // all changes committed
  });

  it('should release lock after transaction with internal read() completes', () => {
    storage.write({ items: [1] });
    storage.withTransaction((tx) => {
      tx.data.items.push(2);
      storage.read(); // internal read increments then decrements lock count
    });
    // After transaction, lock should be fully released — a new write should succeed
    storage.write({ items: [10] });
    const data = storage.read();
    expect(data.items).toEqual([10]);
  });

  // 写入保护：防止空数据覆盖有数据文件
  it('should warn when write would reduce records count significantly', () => {
    storage.write({ records: [{ id: 1 }, { id: 2 }, { id: 3 }], scoreEvents: [{ id: 1 }] });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 尝试用空 records 覆盖
    storage.write({ records: [], scoreEvents: [{ id: 1 }] });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[JsonStorage] Warning: write would reduce')
    );

    // 数据仍然被写入（保护是警告而非阻止，因为合法的清空操作可能存在）
    const data = storage.read();
    expect(data.records).toEqual([]);

    consoleSpy.mockRestore();
  });
});
