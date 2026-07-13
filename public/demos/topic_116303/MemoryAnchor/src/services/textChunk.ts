// Content chunking for semantic vectorization. Kept dependency-free so it's
// unit-testable without pulling in Electron/DB modules.

// ~1600 chars ≈ ~400 tokens per passage, with overlap so a sentence spanning a
// boundary still lands whole in one chunk.
export const CHUNK_MAX_CHARS = 1600;
export const CHUNK_OVERLAP = 200;
export const CHUNK_MAX_COUNT = 60; // bound cost for very long articles (~90k chars)

/**
 * Split text into overlapping passages, preferring to break at sentence /
 * paragraph / whitespace boundaries near the window edge.
 */
export function chunkText(
  text: string,
  maxChars: number = CHUNK_MAX_CHARS,
  overlap: number = CHUNK_OVERLAP,
  maxChunks: number = CHUNK_MAX_COUNT
): string[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length && chunks.length < maxChunks) {
    let end = Math.min(start + maxChars, clean.length);
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      // Prefer a natural boundary in the latter half of the window.
      const boundary = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('。'),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf('! '),
        slice.lastIndexOf('? '),
      );
      if (boundary > maxChars * 0.5) end = start + boundary + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}
