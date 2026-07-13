import { describe, it, expect } from 'vitest';
import { generateId, generateShortId, isValidUUID } from './id';

describe('generateId', () => {
  it('produces a valid UUID v4', () => {
    const id = generateId();
    expect(isValidUUID(id)).toBe(true);
  });

  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('generateShortId', () => {
  it('matches timestamp-random format', () => {
    expect(generateShortId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });

  it('produces different values on successive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateShortId()));
    // random suffix should keep collisions near zero
    expect(ids.size).toBeGreaterThan(45);
  });
});

describe('isValidUUID', () => {
  it('accepts a canonical v4 uuid', () => {
    expect(isValidUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isValidUUID('123E4567-E89B-42D3-A456-426614174000')).toBe(true);
  });

  it('rejects non-v4 version digits', () => {
    // third group must start with 4
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
  });

  it('rejects malformed strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('123e4567e89b42d3a456426614174000')).toBe(false);
  });
});
