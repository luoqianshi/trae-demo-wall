import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { acquireLock } from '../lock';

describe('FileLock', () => {
  const lockFile = path.join(process.cwd(), 'data', '.test.lock');

  beforeEach(() => {
    try { fs.unlinkSync(lockFile); } catch { /* not present */ }
  });
  afterEach(() => {
    try { fs.unlinkSync(lockFile); } catch { /* not present */ }
  });

  it('should acquire lock successfully', () => {
    const handle = acquireLock(lockFile, { timeout: 1000, retryInterval: 50 });
    expect(handle).toBeDefined();
    expect(fs.existsSync(lockFile)).toBe(true);
    handle.release();
    expect(fs.existsSync(lockFile)).toBe(false);
  });

  it('should throw when lock cannot be acquired within timeout', () => {
    const h1 = acquireLock(lockFile, { timeout: 1000, retryInterval: 50 });
    expect(() => acquireLock(lockFile, { timeout: 200, retryInterval: 50 }))
      .toThrow(/Failed to acquire lock/);
    h1.release();
  });

  it('should auto-release stale lock after TTL', () => {
    // Simulate a stale lock acquired 60s ago
    fs.writeFileSync(lockFile, JSON.stringify({ pid: 99999, acquiredAt: Date.now() - 60000 }));
    const handle = acquireLock(lockFile, { timeout: 1000, retryInterval: 50, staleTtl: 5000 });
    expect(handle).toBeDefined();
    handle.release();
  });

  it('should preempt when lock file is corrupted', () => {
    fs.writeFileSync(lockFile, 'not-json{');
    const handle = acquireLock(lockFile, { timeout: 1000, retryInterval: 50, staleTtl: 5000 });
    expect(handle).toBeDefined();
    handle.release();
  });

  it('should be re-acquirable after release', () => {
    const h1 = acquireLock(lockFile, { timeout: 1000, retryInterval: 50 });
    h1.release();
    const h2 = acquireLock(lockFile, { timeout: 1000, retryInterval: 50 });
    expect(h2).toBeDefined();
    h2.release();
  });
});
