import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createJsonStorage } from '../json-storage';

describe('Concurrency', () => {
  const dataFile = path.join(process.cwd(), 'data', '.concurrent-test.json');

  beforeEach(() => {
    try { fs.unlinkSync(dataFile); } catch { /* not present */ }
    try { fs.unlinkSync(`${dataFile}.lock`); } catch { /* not present */ }
    try { fs.unlinkSync(`${dataFile}.wal`); } catch { /* not present */ }
    try { fs.unlinkSync(`${dataFile}.bak`); } catch { /* not present */ }
  });
  afterEach(() => {
    try { fs.unlinkSync(dataFile); } catch { /* not present */ }
    try { fs.unlinkSync(`${dataFile}.lock`); } catch { /* not present */ }
    try { fs.unlinkSync(`${dataFile}.wal`); } catch { /* not present */ }
    try { fs.unlinkSync(`${dataFile}.bak`); } catch { /* not present */ }
  });

  it('should handle 50 sequential-ish writes via setTimeout without data loss', async () => {
    const storage = createJsonStorage<{ counter: number }>(dataFile, {
      lockTimeout: 5000,
      retryInterval: 10,
    });
    storage.write({ counter: 0 });

    // Node.js is single-threaded; true parallelism requires worker threads.
    // Here we simulate interleaved transactions via setTimeout, which exercises
    // the lock re-entrancy and transaction snapshot logic.
    const N = 50;
    const promises = Array.from({ length: N }, (_, i) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          storage.withTransaction((tx) => {
            tx.data.counter = tx.data.counter + 1;
          });
          resolve();
        }, Math.random() * 30);
      }),
    );

    await Promise.all(promises);
    const result = storage.read<{ counter: number }>();
    expect(result.counter).toBe(N);
  }, 30000);

  it('should handle synchronous rapid writes without corruption', () => {
    const storage = createJsonStorage<{ value: number; history: number[] }>(dataFile, {
      lockTimeout: 5000,
      retryInterval: 10,
    });
    storage.write({ value: 0, history: [] });

    for (let i = 1; i <= 20; i++) {
      storage.withTransaction((tx) => {
        tx.data.value = i;
        tx.data.history.push(i);
      });
    }

    const result = storage.read<{ value: number; history: number[] }>();
    expect(result.value).toBe(20);
    expect(result.history).toHaveLength(20);
    expect(result.history[19]).toBe(20);

    // Verify file on disk is consistent
    const raw = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    expect(raw.value).toBe(20);
    expect(raw.history).toHaveLength(20);
  });

  it('should maintain data integrity when transaction throws mid-way', () => {
    const storage = createJsonStorage<{ items: number[]; counter: number }>(dataFile, {
      lockTimeout: 5000,
      retryInterval: 10,
    });
    storage.write({ items: [1, 2, 3], counter: 0 });

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        storage.withTransaction((tx) => {
          tx.data.counter += 1;
          tx.data.items.push(tx.data.counter * 10);
          if (attempt < 3) {
            throw new Error('simulated failure');
          }
        });
      } catch { /* expected */ }
    }

    const result = storage.read<{ items: number[]; counter: number }>();
    // Only the last 2 attempts should have committed
    expect(result.counter).toBe(2);
    expect(result.items).toEqual([1, 2, 3, 10, 20]);
  });
});
