import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { writeWAL, replayWAL, clearWAL, walExists } from '../wal';

describe('WAL', () => {
  const walFile = path.join(process.cwd(), 'data', '.test.wal');
  const mainFile = path.join(process.cwd(), 'data', '.test-main.json');

  beforeEach(() => {
    try { fs.unlinkSync(walFile); } catch { /* not present */ }
    try { fs.unlinkSync(mainFile); } catch { /* not present */ }
  });
  afterEach(() => {
    try { fs.unlinkSync(walFile); } catch { /* not present */ }
    try { fs.unlinkSync(mainFile); } catch { /* not present */ }
  });

  it('should write WAL entry and detect its existence', () => {
    writeWAL(walFile, { op: 'replace', data: { foo: 1 } });
    expect(walExists(walFile)).toBe(true);
  });

  it('should replay WAL to main file', () => {
    fs.writeFileSync(mainFile, JSON.stringify({ foo: 0 }));
    writeWAL(walFile, { op: 'replace', data: { foo: 999 } });
    replayWAL(walFile, mainFile);
    const result = JSON.parse(fs.readFileSync(mainFile, 'utf-8'));
    expect(result.foo).toBe(999);
    expect(walExists(walFile)).toBe(false); // replay clears WAL
  });

  it('should clear WAL without replay', () => {
    writeWAL(walFile, { op: 'replace', data: {} });
    clearWAL(walFile);
    expect(walExists(walFile)).toBe(false);
  });

  it('should be a no-op when WAL does not exist', () => {
    expect(walExists(walFile)).toBe(false);
    replayWAL(walFile, mainFile); // should not throw
    clearWAL(walFile); // should not throw
  });

  it('should handle corrupt WAL by backing it up and clearing', () => {
    fs.writeFileSync(walFile, 'not-valid-json{');
    replayWAL(walFile, mainFile);
    expect(walExists(walFile)).toBe(false);
  });
});
