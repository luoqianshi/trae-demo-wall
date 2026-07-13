import { describe, it, expect } from 'vitest';
import { chunkText } from './textChunk';

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    expect(chunkText('hello world')).toEqual(['hello world']);
  });

  it('returns nothing for empty/whitespace text', () => {
    expect(chunkText('   \n  ')).toEqual([]);
    expect(chunkText('')).toEqual([]);
  });

  it('splits long text into multiple overlapping chunks within the size bound', () => {
    const text = 'a'.repeat(5000);
    const chunks = chunkText(text, 1600, 200);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1600);
    // Overlap: consecutive windows advance by (max - overlap), so coverage is complete.
    expect(chunks.join('').length).toBeGreaterThanOrEqual(5000);
  });

  it('prefers a sentence boundary near the window edge', () => {
    const sentence = 'This is a sentence. ';
    const text = sentence.repeat(200); // ~4000 chars
    const chunks = chunkText(text, 1600, 200);
    // Every chunk (except possibly the last) should end at a sentence boundary.
    for (const c of chunks.slice(0, -1)) {
      expect(c.endsWith('.') || c.endsWith('. ')).toBe(true);
    }
  });

  it('caps the number of chunks for very long text', () => {
    const text = 'word '.repeat(100000); // ~500k chars
    const chunks = chunkText(text, 1600, 200, 60);
    expect(chunks.length).toBeLessThanOrEqual(60);
  });
});
