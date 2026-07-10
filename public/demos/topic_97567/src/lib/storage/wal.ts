// Write-Ahead Log (WAL) for crash recovery
//
// Writes go to WAL first, then to main file. On restart, if WAL exists,
// it is replayed to the main file. This guarantees durability even if the
// process crashes between WAL write and main file write.

import * as fs from 'fs';
import * as path from 'path';
import type { WALEntry } from './types';

/**
 * Write a WAL entry atomically (tmp + rename).
 */
export function writeWAL(walFile: string, entry: Omit<WALEntry, 'timestamp'>): void {
  const dir = path.dirname(walFile);
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* dir exists */ }

  const fullEntry: WALEntry = { ...entry, timestamp: new Date().toISOString() };
  const tmp = `${walFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(fullEntry), 'utf-8');
  fs.renameSync(tmp, walFile);
}

/**
 * Check if a WAL file exists (indicates a possible crash during last write).
 */
export function walExists(walFile: string): boolean {
  return fs.existsSync(walFile);
}

/**
 * Replay WAL to the main file, then clear the WAL.
 * If replay fails, back up the corrupt WAL and clear it.
 */
export function replayWAL(walFile: string, mainFile: string): void {
  if (!fs.existsSync(walFile)) return;

  try {
    const raw = fs.readFileSync(walFile, 'utf-8');
    const entry: WALEntry = JSON.parse(raw);

    if (entry.op === 'replace') {
      const dir = path.dirname(mainFile);
      try { fs.mkdirSync(dir, { recursive: true }); } catch { /* dir exists */ }

      // Atomic write to main file
      const tmp = `${mainFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(entry.data, null, 2), 'utf-8');
      fs.renameSync(tmp, mainFile);
    }

    clearWAL(walFile);
  } catch (e) {
    console.error('[WAL] replay failed:', e);
    // Preserve corrupt WAL for post-mortem analysis
    try { fs.copyFileSync(walFile, `${walFile}.corrupt-${Date.now()}`); } catch { /* ignore */ }
    clearWAL(walFile);
  }
}

/**
 * Remove the WAL file (called after successful commit to main file).
 */
export function clearWAL(walFile: string): void {
  try { fs.unlinkSync(walFile); } catch { /* already absent */ }
}
