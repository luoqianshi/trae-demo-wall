import { describe, it, expect } from 'vitest';
import {
  extractMetadata,
  extractMainContent,
  extractContent,
  calculateContentQuality,
  ExtractedContent,
} from './contentExtractor';

describe('extractMetadata', () => {
  it('reads title, description and og image', () => {
    const html = `
      <html lang="en">
        <head>
          <title>My Title</title>
          <meta name="description" content="A description">
          <meta property="og:image" content="https://x.com/img.png">
          <meta name="author" content="Jane">
          <meta name="keywords" content="a, b, c">
        </head>
      </html>`;
    const meta = extractMetadata(html, 'https://x.com/page');
    expect(meta.title).toBe('My Title');
    expect(meta.description).toBe('A description');
    expect(meta.thumbnail).toBe('https://x.com/img.png');
    expect(meta.author).toBe('Jane');
    expect(meta.language).toBe('en');
    expect(meta.tags).toEqual(['a', 'b', 'c']);
  });

  it('falls back to og:title and derives favicon + siteName', () => {
    const html = `<meta property="og:title" content="OG Title">`;
    const meta = extractMetadata(html, 'https://example.com/deep');
    expect(meta.title).toBe('OG Title');
    expect(meta.favicon).toBe('https://example.com/favicon.ico');
    expect(meta.siteName).toBe('example.com');
  });
});

describe('extractMainContent', () => {
  it('drops nav/header/footer/aside chrome and keeps body text', () => {
    const html = `
      <nav>navigation</nav>
      <header>site header</header>
      <main><p>Real content here</p></main>
      <footer>site footer</footer>`;
    const { content } = extractMainContent(html);
    expect(content).toContain('Real content here');
    expect(content).not.toContain('navigation');
    expect(content).not.toContain('site footer');
  });
});

describe('extractContent', () => {
  it('assembles title, text, markdown and derived metadata', () => {
    const html = `
      <html>
        <head><title>Doc</title></head>
        <body><main><p>Hello world of content.</p></main></body>
      </html>`;
    const result = extractContent(html, 'https://x.com/doc');
    expect(result.title).toBe('Doc');
    expect(result.textContent).toContain('Hello world of content.');
    expect(result.metadata.wordCount).toBeGreaterThan(0);
    expect(result.metadata.readingTime).toBeGreaterThanOrEqual(1);
  });

  it('falls back to the url as title when none present', () => {
    const result = extractContent('<p>no title here</p>', 'https://x.com/notitle');
    expect(result.title).toBe('https://x.com/notitle');
  });
});

describe('calculateContentQuality', () => {
  it('scores richer content higher and caps at 100', () => {
    const rich: ExtractedContent = {
      title: 'Title',
      description: 'desc',
      content: 'x'.repeat(6000),
      htmlContent: '<p>' + 'x'.repeat(6000) + '</p>',
      textContent: 'x'.repeat(6000),
      metadata: {
        description: 'desc',
        wordCount: 1200,
        thumbnail: 'https://x/i.png',
        author: 'Jane',
      },
    };
    const poor: ExtractedContent = {
      title: '',
      content: '',
      htmlContent: '',
      textContent: '',
      metadata: {},
    };
    const richScore = calculateContentQuality(rich);
    const poorScore = calculateContentQuality(poor);
    expect(richScore).toBeGreaterThan(poorScore);
    expect(richScore).toBeLessThanOrEqual(100);
    expect(poorScore).toBe(0);
  });
});
