export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hash = '';
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

export function getProtocol(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol.replace(':', '');
  } catch {
    return '';
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);
  return domain1 === domain2 && domain1 !== '';
}

export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
  } catch {
    return '';
  }
}

export function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {
    return '';
  }
}

export function isHttpUrl(url: string): boolean {
  const protocol = getProtocol(url);
  return protocol === 'http' || protocol === 'https';
}

export function ensureProtocol(url: string, defaultProtocol: string = 'https'): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${defaultProtocol}://${url}`;
}

export function extractUrls(html: string, baseUrl: string): string[] {
  const urls: Set<string> = new Set();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

    try {
      const absoluteUrl = new URL(href, baseUrl).toString();
      if (isHttpUrl(absoluteUrl)) {
        urls.add(absoluteUrl);
      }
    } catch {
      continue;
    }
  }

  return Array.from(urls);
}
