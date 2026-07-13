import { describe, it, expect } from 'vitest';
import {
  isValidUrl,
  normalizeUrl,
  getDomain,
  getProtocol,
  isSameDomain,
  getFaviconUrl,
  getBaseUrl,
  isHttpUrl,
  ensureProtocol,
  extractUrls,
} from './urlUtils';

describe('isValidUrl', () => {
  it('accepts well-formed urls', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path?q=1')).toBe(true);
  });
  it('rejects malformed urls', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('strips the hash fragment', () => {
    expect(normalizeUrl('https://example.com/a#section')).toBe('https://example.com/a');
  });
  it('removes a trailing slash from non-root paths', () => {
    expect(normalizeUrl('https://example.com/a/')).toBe('https://example.com/a');
  });
  it('keeps the root path slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });
  it('returns the input unchanged when not a url', () => {
    expect(normalizeUrl('garbage')).toBe('garbage');
  });
});

describe('getDomain / getProtocol / getBaseUrl', () => {
  it('extracts the hostname', () => {
    expect(getDomain('https://sub.example.com/x')).toBe('sub.example.com');
  });
  it('extracts the protocol without colon', () => {
    expect(getProtocol('https://example.com')).toBe('https');
  });
  it('builds the base url', () => {
    expect(getBaseUrl('https://example.com/a/b?c=1')).toBe('https://example.com');
  });
  it('returns empty string on invalid input', () => {
    expect(getDomain('nope')).toBe('');
    expect(getProtocol('nope')).toBe('');
    expect(getBaseUrl('nope')).toBe('');
  });
});

describe('isSameDomain', () => {
  it('is true for same host', () => {
    expect(isSameDomain('https://example.com/a', 'http://example.com/b')).toBe(true);
  });
  it('is false for different hosts', () => {
    expect(isSameDomain('https://a.com', 'https://b.com')).toBe(false);
  });
  it('is false when either is invalid (empty domain)', () => {
    expect(isSameDomain('bad', 'also-bad')).toBe(false);
  });
});

describe('getFaviconUrl', () => {
  it('points at /favicon.ico on the host', () => {
    expect(getFaviconUrl('https://example.com/deep/page')).toBe('https://example.com/favicon.ico');
  });
  it('returns empty string on invalid input', () => {
    expect(getFaviconUrl('nope')).toBe('');
  });
});

describe('isHttpUrl', () => {
  it('accepts http and https', () => {
    expect(isHttpUrl('http://x.com')).toBe(true);
    expect(isHttpUrl('https://x.com')).toBe(true);
  });
  it('rejects other schemes', () => {
    expect(isHttpUrl('ftp://x.com')).toBe(false);
    expect(isHttpUrl('mailto:a@b.com')).toBe(false);
  });
});

describe('ensureProtocol', () => {
  it('leaves urls that already have a protocol', () => {
    expect(ensureProtocol('http://x.com')).toBe('http://x.com');
    expect(ensureProtocol('https://x.com')).toBe('https://x.com');
  });
  it('prepends the default protocol', () => {
    expect(ensureProtocol('x.com')).toBe('https://x.com');
    expect(ensureProtocol('x.com', 'http')).toBe('http://x.com');
  });
});

describe('extractUrls', () => {
  it('extracts absolute http(s) links and dedupes', () => {
    const html = `
      <a href="https://a.com/1">one</a>
      <a href="/rel">rel</a>
      <a href="https://a.com/1">dup</a>
      <a href="#frag">frag</a>
      <a href="javascript:void(0)">js</a>
    `;
    const urls = extractUrls(html, 'https://a.com');
    expect(urls).toContain('https://a.com/1');
    expect(urls).toContain('https://a.com/rel');
    expect(urls.filter((u) => u === 'https://a.com/1')).toHaveLength(1);
    expect(urls.some((u) => u.startsWith('javascript'))).toBe(false);
  });
});
