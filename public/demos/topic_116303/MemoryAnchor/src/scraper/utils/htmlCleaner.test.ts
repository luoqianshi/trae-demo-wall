import { describe, it, expect } from 'vitest';
import {
  cleanHtml,
  stripHtml,
  extractText,
  removeScriptsAndStyles,
  getWordCount,
  estimateReadingTime,
  truncateText,
  htmlToMarkdown,
} from './htmlCleaner';

describe('cleanHtml', () => {
  it('removes script, style and iframe blocks', () => {
    const html = '<div>keep<script>evil()</script><style>.x{}</style><iframe src="x"></iframe></div>';
    const out = cleanHtml(html);
    expect(out).toContain('keep');
    expect(out).not.toContain('evil');
    expect(out).not.toContain('.x{}');
    expect(out).not.toContain('<iframe');
  });
  it('strips inline event handlers and style attributes', () => {
    const html = `<button onclick="hack()" style="color:red">x</button>`;
    const out = cleanHtml(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('style=');
  });
});

describe('stripHtml', () => {
  it('removes tags, decodes entities, collapses whitespace', () => {
    expect(stripHtml('<p>Hello&nbsp;&amp;   world</p>')).toBe('Hello & world');
  });
});

describe('extractText', () => {
  it('converts block elements to newlines and decodes entities', () => {
    const out = extractText('<h1>Title</h1><p>Para one</p><p>Para two</p>');
    expect(out).toContain('Title');
    expect(out).toContain('Para one');
    expect(out).toContain('Para two');
    expect(out).toMatch(/Para one\n\nPara two/);
  });
  it('drops script content entirely', () => {
    expect(extractText('<p>ok</p><script>secret</script>')).not.toContain('secret');
  });
});

describe('removeScriptsAndStyles', () => {
  it('removes scripts, styles and stylesheet links', () => {
    const html = '<script>a</script><style>b</style><link rel="stylesheet" href="c.css"><p>keep</p>';
    const out = removeScriptsAndStyles(html);
    expect(out).toBe('<p>keep</p>');
  });
});

describe('getWordCount', () => {
  it('counts words split on whitespace', () => {
    expect(getWordCount('one two three')).toBe(3);
  });
  it('returns 0 for blank input', () => {
    expect(getWordCount('   ')).toBe(0);
    expect(getWordCount('')).toBe(0);
  });
});

describe('estimateReadingTime', () => {
  it('returns 0 for non-positive counts', () => {
    expect(estimateReadingTime(0)).toBe(0);
    expect(estimateReadingTime(-5)).toBe(0);
  });
  it('rounds up to whole minutes at 200 wpm', () => {
    expect(estimateReadingTime(200)).toBe(1);
    expect(estimateReadingTime(201)).toBe(2);
    expect(estimateReadingTime(400)).toBe(2);
  });
  it('honors a custom wpm', () => {
    expect(estimateReadingTime(100, 100)).toBe(1);
  });
});

describe('truncateText', () => {
  it('leaves short text unchanged', () => {
    expect(truncateText('short', 20)).toBe('short');
  });
  it('truncates and appends the suffix within maxLength', () => {
    const out = truncateText('abcdefghij', 5);
    expect(out).toBe('ab...');
    expect(out).toHaveLength(5);
  });
});

describe('htmlToMarkdown', () => {
  it('converts headings and inline emphasis', () => {
    expect(htmlToMarkdown('<h1>Title</h1>')).toContain('# Title');
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
    expect(htmlToMarkdown('<em>it</em>')).toBe('*it*');
  });
  it('converts links and images', () => {
    expect(htmlToMarkdown('<a href="https://x.com">link</a>')).toBe('[link](https://x.com)');
    expect(htmlToMarkdown('<img src="a.png" alt="cap">')).toBe('![cap](a.png)');
  });
  it('converts unordered and ordered lists', () => {
    expect(htmlToMarkdown('<ul><li>a</li><li>b</li></ul>')).toContain('- a');
    expect(htmlToMarkdown('<ol><li>a</li><li>b</li></ol>')).toContain('1. a');
    expect(htmlToMarkdown('<ol><li>a</li><li>b</li></ol>')).toContain('2. b');
  });
});
