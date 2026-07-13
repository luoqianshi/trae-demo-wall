import { extractText, getWordCount, estimateReadingTime, cleanHtml, htmlToMarkdown } from './htmlCleaner';
import { getDomain, getFaviconUrl } from './urlUtils';
import { ScrapeMetadata } from '../types';

export interface ExtractedContent {
  title: string;
  description?: string;
  content: string;
  htmlContent: string;
  textContent: string;
  markdown?: string;
  metadata: ScrapeMetadata;
}

export function extractMetadata(html: string, url: string): ScrapeMetadata {
  const metadata: ScrapeMetadata = {};

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (metaDescription) {
    metadata.description = metaDescription[1].trim();
  }

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitle && !metadata.title) {
    metadata.title = ogTitle[1].trim();
  }

  const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  if (ogDescription && !metadata.description) {
    metadata.description = ogDescription[1].trim();
  }

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImage) {
    metadata.thumbnail = ogImage[1].trim();
  }

  const ogSiteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (ogSiteName) {
    metadata.siteName = ogSiteName[1].trim();
  }

  const authorMeta = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
  if (authorMeta) {
    metadata.author = authorMeta[1].trim();
  }

  const articleAuthor = html.match(/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i);
  if (articleAuthor && !metadata.author) {
    metadata.author = articleAuthor[1].trim();
  }

  const pubDate = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i);
  if (pubDate) {
    metadata.publishedAt = pubDate[1].trim();
  }

  const modDate = html.match(/<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']+)["']/i);
  if (modDate) {
    metadata.updatedAt = modDate[1].trim();
  }

  const ogLocale = html.match(/<meta[^>]+property=["']og:locale["'][^>]+content=["']([^"']+)["']/i);
  if (ogLocale) {
    metadata.language = ogLocale[1].trim();
  }

  const htmlLang = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  if (htmlLang && !metadata.language) {
    metadata.language = htmlLang[1].trim();
  }

  const keywordsMeta = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
  if (keywordsMeta) {
    metadata.tags = keywordsMeta[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  metadata.favicon = getFaviconUrl(url);
  metadata.siteName = metadata.siteName || getDomain(url);

  return metadata;
}

export function extractMainContent(html: string): { content: string; htmlContent: string } {
  const cleanedHtml = cleanHtmlForMainContent(html);
  const textContent = extractText(cleanedHtml);

  return {
    content: textContent,
    htmlContent: cleanedHtml,
  };
}

function cleanHtmlForMainContent(html: string): string {
  let result = html;

  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  result = result.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  result = result.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  result = result.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  result = result.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  result = result.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  result = result.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  result = result.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');

  result = result.replace(/\s+class=["'][^"']*["']/gi, '');
  result = result.replace(/\s+id=["'][^"']*["']/gi, '');
  result = result.replace(/\s+style=["'][^"']*["']/gi, '');

  return result;
}

export function extractContent(html: string, url: string, extractMainOnly: boolean = true): ExtractedContent {
  const metadata = extractMetadata(html, url);
  const { htmlContent } = extractMainOnly ? extractMainContent(html) : { htmlContent: html };
  const textContent = extractText(htmlContent);
  const wordCount = getWordCount(textContent);
  const readingTime = estimateReadingTime(wordCount);

  const markdown = htmlToMarkdown(htmlContent);

  return {
    title: metadata.title || url,
    description: metadata.description,
    content: textContent,
    htmlContent: cleanHtml(htmlContent),
    textContent,
    markdown,
    metadata: {
      ...metadata,
      wordCount,
      readingTime,
    },
  };
}

export function calculateContentQuality(content: ExtractedContent): number {
  let score = 0;

  if (content.title && content.title.length > 0) {
    score += 10;
  }

  if (content.textContent && content.textContent.length > 100) {
    score += 20;
  }
  if (content.textContent && content.textContent.length > 1000) {
    score += 20;
  }
  if (content.textContent && content.textContent.length > 5000) {
    score += 10;
  }

  if (content.metadata.description) {
    score += 10;
  }

  if (content.metadata.wordCount && content.metadata.wordCount > 100) {
    score += 10;
  }

  if (content.htmlContent && content.htmlContent.includes('<p>')) {
    score += 10;
  }

  if (content.metadata.thumbnail) {
    score += 5;
  }

  if (content.metadata.author) {
    score += 5;
  }

  return Math.min(score, 100);
}
