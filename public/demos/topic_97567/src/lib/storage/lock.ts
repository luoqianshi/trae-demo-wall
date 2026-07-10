// File lock implementation with TTL and retry
// Prevents concurrent writes from corrupting the JSON database.

import * as fs from 'fs';
import * as path from 'path';
import type { LockHandle, LockOptions } from './types';

/**
 * Acquire an exclusive file lock with retry and stale-lock detection.
 *
 * Behavior:
 * - Uses a lockfile containing { pid, acquiredAt } metadata
 * - Retries every retryInterval ms until timeout
 * - Stale locks (older than staleTtl) are preempted
 * - Acquisition is atomic via tmp-file + rename
 *
 * @param lockFile Absolute path to the lockfile
 * @param opts     Lock options (timeout, retryInterval, staleTtl)
 * @returns LockHandle whose release() removes the lockfile
 */
export function acquireLock(lockFile: string, opts: LockOptions): LockHandle {
  const staleTtl = opts.staleTtl ?? 30000;
  const deadline = Date.now() + opts.timeout;

  while (true) {
    if (tryAcquire(lockFile, staleTtl)) {
      return {
        release: () => {
          try { fs.unlinkSync(lockFile); } catch { /* already released */ }
        },
      };
    }
    if (Date.now() >= deadline) {
      throw new Error(`Failed to acquire lock on ${lockFile} within ${opts.timeout}ms`);
    }
    sleep(opts.retryInterval);
  }
}

function tryAcquire(lockFile: string, staleTtl: number): boolean {
  const dir = path.dirname(lockFile);
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* dir exists */ }

  if (fs.existsSync(lockFile)) {
    try {
      const raw = fs.readFileSync(lockFile, 'utf-8');
      const meta = JSON.parse(raw);
      // Lock still valid → wait
      if (Date.now() - meta.acquiredAt < staleTtl) return false;
      // Lock stale → preempt
    } catch {
      // Lock file corrupted → preempt
    }
  }

  // Atomic acquisition via tmp-file + rename
  try {
    const tmp = `${lockFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ pid: process.pid, acquiredAt: Date.now() }));
    fs.renameSync(tmp, lockFile);
    return true;
  } catch {
    return false; // race lost
  }
}

function sleep(ms: number): void {
  // Synchronous sleep for lock retry (operations are short-lived)
  const start = Date.now();
  while (Date.now() - start < ms) { /* busy wait */ }
}
