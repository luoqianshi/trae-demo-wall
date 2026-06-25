/**
 * 吾滴孩儿 - 官方渠道新闻聚合服务 v3
 *
 * ═════════════════════════════════════════════════════
 *
 * 数据来源 — 全部为政府官方渠道：
 *
 * ┌────┬──────────────────────────┬────────────────────────────────────┐
 * │ #  │ 部门                    │ 用途                               │
 * ├────┼──────────────────────────┼────────────────────────────────────┤
 * │ 1  │ 国家市场监督管理总局     │ 产品召回（消费品、汽车）           │
 * │    │ www.samr.gov.cn         │ 召回中心 www.samrdprc.org.cn       │
 * ├────┼──────────────────────────┼────────────────────────────────────┤
 * │ 2  │ 国家卫生健康委员会       │ 政策法规、新闻发布会               │
 * │    │ www.nhc.gov.cn          │ 儿童健康、托育服务                 │
 * ├────┼──────────────────────────┼────────────────────────────────────┤
 * │ 3  │ 中国疾病预防控制中心     │ 健康预警、传染病防控               │
 * │    │ www.chinacdc.cn         │ 儿童疫苗接种日                     │
 * ├────┼──────────────────────────┼────────────────────────────────────┤
 * │ 4  │ 国家药品监督管理局       │ 药品/疫苗召回、质量通告            │
 * │    │ www.nmpa.gov.cn         │ 不符合规定药品通告                  │
 * └────┴──────────────────────────┴────────────────────────────────────┘
 *
 * 技术方案：
 * - Vite devServer proxy 代理请求政府网站HTML页面
 * - DOMParser 解析结构化HTML提取新闻条目
 * - 每条新闻的 externalLink 指向 gov.cn 原始页面
 * - localStorage 缓存（30分钟TTL）
 * - 静态模板数据作为降级兜底
 *
 * ═════════════════════════════════════════════════════
 */

import type { NewsItem } from '../data/news';

// ==================== 类型定义 ====================

interface CachedData<T> {
  data: T;
  fetchedAt: number;
  ttl: number;
}

/** 数据来源类型（纯官方模式） */
export type DataSourceType = 'official';

/** 官方来源配置 */
interface OfficialSource {
  /** 来源ID */
  id: string;
  /** 部门全称（必须真实，不可臆造） */
  name: string;
  /** 部门简称 */
  shortName: string;
  /** 官网首页URL */
  homepageUrl: string;
  /** 数据页面的代理路径 */
  proxyPath: string;
  /** 对应的新闻分类 */
  category: NewsItem['category'];
  /** 图标 */
  icon: string;
  /** 说明文字 */
  description: string;
}

// ==================== 配置常量 ====================

const CACHE_PREFIX = 'wdhr_news_';
const AGGREGATE_CACHE_KEY = 'aggregated_v3';
const DEFAULT_TTL = 30 * 60 * 1000; // 30分钟缓存
const FETCH_TIMEOUT = 12000; // 12秒超时（政府网站可能较慢）

/**
 * ★ 官方数据源配置表
 *
 * 每个来源均为中国政府部门的官方网站，
 * 所有信息均可追溯到 gov.cn / org.cn 域名。
 */
const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    id: 'samr_recall',
    name: '国家市场监督管理总局',
    shortName: '市场监管总局',
    homepageUrl: 'https://www.samr.gov.cn',
    proxyPath: '/api-official/samr/recall',
    category: 'recall',
    icon: '🏛️',
    description: '缺陷产品召回信息（消费品、儿童用品等）',
  },
  {
    id: 'samr_center',
    name: '国家市场监督管理总局缺陷产品召回技术中心',
    shortName: '召回中心',
    homepageUrl: 'https://www.samrdprc.org.cn',
    proxyPath: '/api-official/samrdprc/consumer',
    category: 'recall',
    icon: '🏛️',
    description: '国内消费品召回信息（含儿童用品）',
  },
  {
    id: 'nhc_policy',
    name: '国家卫生健康委员会',
    shortName: '国家卫健委',
    homepageUrl: 'https://www.nhc.gov.cn',
    proxyPath: '/api-official/nhc/news',
    category: 'policy',
    icon: '🏥',
    description: '卫生健康政策、儿童健康服务',
  },
  {
    id: 'cdc_alert',
    name: '中国疾病预防控制中心',
    shortName: '中国疾控中心',
    homepageUrl: 'https://www.chinacdc.cn',
    proxyPath: '/api-official/cdc/news',
    category: 'alert',
    icon: '🔬',
    description: '疾病防控预警、儿童疫苗接种',
  },
  {
    id: 'nmpa_drug',
    name: '国家药品监督管理局',
    shortName: '国家药监局',
    homepageUrl: 'https://www.nmpa.gov.cn',
    proxyPath: '/api-official/nmpa/recall',
    category: 'alert',
    icon: '💊',
    description: '药品/医疗器械/化妆品召回信息',
  },
];

// ==================== 缓存工具 ====================

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached: CachedData<T> = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > cached.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return cached.data;
  } catch { return null; }
}

function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  try {
    const cached: CachedData<T> = { data, fetchedAt: Date.now(), ttl };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cached));
  } catch { /* ignore */ }
}

// ==================== 工具函数 ====================

function truncateText(text: string | undefined, maxLen: number): string {
  if (!text) return '';
  text = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  // 尝试解析各种日期格式
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* ignore */ }
  // 如果是 YYYY-MM-DD 格式直接返回
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
  return dateStr.slice(0, 10);
}

/** 从标题推断紧急度 */
function detectUrgency(title: string): NewsItem['urgency'] {
  if (/紧急|召回|下架|不合格|死亡|致命/.test(title)) return 'high';
  if (/重要|提醒|注意|通报|通告/.test(title)) return 'medium';
  return 'low';
}

/** 提取标签 */
function extractTags(title: string): string[] {
  const keywords = [
    '奶粉', '疫苗', '玩具', '召回', '安全', '儿童用品', '婴儿',
    '药品', '食品', '传染病', '接种', 'DHA', '睡眠', '喂养',
    '辅食', '过敏', '湿疹', '手足口', '流感',
  ];
  return keywords.filter(k => title.includes(k));
}

function getCategoryLabel(key: string): string {
  const map: Record<string, string> = {
    recall: '产品召回', alert: '安全预警', policy: '政策法规',
    research: '研究发现', incident: '事件通报',
  };
  return map[key] || key;
}

// ==================== HTML 解析器 ====================

/**
 * 解析 SAMR 召回动态页面
 * URL: https://www.samr.gov.cn:8080/zlfzj/qxcpzh/zhdt/index.html
 *
 * 页面结构：ul > li > a (标题链接) + span (日期)
 */
function parseSamrRecallHtml(html: string, source: OfficialSource): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items: NewsItem[] = [];

    // 查找所有新闻链接
    const links = doc.querySelectorAll('a[href*="art/"]');
    links.forEach((link, index) => {
      const title = link.textContent?.trim();
      const href = link.getAttribute('href');
      if (!title || !href || index >= 15) return; // 最多取15条

      // 构建完整URL
      let fullUrl = href;
      if (href.startsWith('/')) {
        fullUrl = `https://www.samr.gov.cn${href}`;
      } else if (!href.startsWith('http')) {
        fullUrl = `${source.homepageUrl}/${href}`;
      }

      // 查找相邻的日期元素
      const parent = link.closest('li') || link.parentElement;
      const dateEl = parent?.querySelector('span, .date, .time');
      const date = dateEl?.textContent?.trim() || new Date().toISOString().slice(0, 10);

      items.push({
        id: `${source.id}_${index}_${Date.now()}`,
        title,
        summary: truncateText(title, 120),
        category: source.category,
        categoryLabel: getCategoryLabel(source.category),
        source: source.name, // ★ 真实部门名称
        date: formatDate(date),
        urgency: detectUrgency(title),
        tags: extractTags(title),
        content: title,
        safetyTips: [],
        externalLink: fullUrl, // ★ 指向 gov.cn 原始页面
        _isOfficial: true as const,
        _officialSource: source.name,
        _officialUrl: fullUrl,
      });
    });

    return items;
  } catch (e) {
    console.warn(`[OfficialNews] 解析 ${source.name} 失败:`, e);
    return [];
  }
}

/**
 * 解析 NHC 新闻发布页面
 * URL: https://www.nhc.gov.cn/xcs/c100122/new_list.shtml
 *
 * 页面结构：列表项包含标题链接和发布时间
 */
function parseNhcNewsHtml(html: string, source: OfficialSource): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items: NewsItem[] = [];

    // NHC 的新闻通常在特定容器中
    const allLinks = doc.querySelectorAll('a[href*=".shtml"], a[href*="/xcs/"]');
    allLinks.forEach((link, index) => {
      const title = link.textContent?.trim();
      const href = link.getAttribute('href');
      if (!title || !href || title.length < 5 || index >= 12) return;

      let fullUrl = href;
      if (href.startsWith('/') && !href.startsWith('//')) {
        fullUrl = `https://www.nhc.gov.cn${href}`;
      }

      items.push({
        id: `${source.id}_${index}_${Date.now()}`,
        title,
        summary: truncateText(title, 120),
        category: source.category,
        categoryLabel: getCategoryLabel(source.category),
        source: source.name,
        date: new Date().toISOString().slice(0, 10), // NHC页面日期格式不固定
        urgency: detectUrgency(title),
        tags: extractTags(title),
        content: title,
        safetyTips: [],
        externalLink: fullUrl,
        _isOfficial: true as const,
        _officialSource: source.name,
        _officialUrl: fullUrl,
      });
    });

    return items;
  } catch (e) {
    console.warn(`[OfficialNews] 解析 ${source.name} 失败:`, e);
    return [];
  }
}

/**
 * 解析 CDC 中心要闻页面
 * URL: https://www.chinacdc.cn/zxyw/
 *
 * 页面结构：新闻列表包含标题和发布日期
 */
function parseCdcNewsHtml(html: string, source: OfficialSource): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items: NewsItem[] = [];

    const allLinks = doc.querySelectorAll('a[href*=".html"]');
    allLinks.forEach((link, index) => {
      const title = link.textContent?.trim();
      const href = link.getAttribute('href');
      if (!title || !href || title.length < 6 || index >= 12) return;

      let fullUrl = href;
      if (href.startsWith('/') && !href.startsWith('//')) {
        fullUrl = `https://www.chinacdc.cn${href}`;
      }

      items.push({
        id: `${source.id}_${index}_${Date.now()}`,
        title,
        summary: truncateText(title, 120),
        category: source.category,
        categoryLabel: getCategoryLabel(source.category),
        source: source.name,
        date: new Date().toISOString().slice(0, 10),
        urgency: detectUrgency(title),
        tags: extractTags(title),
        content: title,
        safetyTips: [],
        externalLink: fullUrl,
        _isOfficial: true as const,
        _officialSource: source.name,
        _officialUrl: fullUrl,
      });
    });

    return items;
  } catch (e) {
    console.warn(`[OfficialNews] 解析 ${source.name} 失败:`, e);
    return [];
  }
}

/**
 * 解析 NMPA 产品召回页面
 * URL: https://www.nmpa.gov.cn/xxgk/chpzhh/index.html
 *
 * 页面结构：召回列表（医疗器械/药品）
 */
function parseNmpaRecallHtml(html: string, source: OfficialSource): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items: NewsItem[] = [];

    const allLinks = doc.querySelectorAll('a[href*=".html"]');
    allLinks.forEach((link, index) => {
      const title = link.textContent?.trim();
      const href = link.getAttribute('href');
      if (!title || !href || title.length < 5 || index >= 12) return;

      let fullUrl = href;
      if (href.startsWith('/') && !href.startsWith('//')) {
        fullUrl = `https://www.nmpa.gov.cn${href}`;
      }

      items.push({
        id: `${source.id}_${index}_${Date.now()}`,
        title,
        summary: truncateText(title, 120),
        category: source.category,
        categoryLabel: getCategoryLabel(source.category),
        source: source.name,
        date: new Date().toISOString().slice(0, 10),
        urgency: detectUrgency(title),
        tags: extractTags(title),
        content: title,
        safetyTips: [],
        externalLink: fullUrl,
        _isOfficial: true as const,
        _officialSource: source.name,
        _officialUrl: fullUrl,
      });
    });

    return items;
  } catch (e) {
    console.warn(`[OfficialNews] 解析 ${source.name} 失败:`, e);
    return [];
  }
}

// ==================== 核心获取逻辑 ====================

/** 带超时的 fetch */
async function fetchWithTimeout(url: string, timeout: number = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

/**
 * 从单个官方源获取新闻
 */
async function fetchFromOfficialSource(source: OfficialSource): Promise<{
  items: NewsItem[];
  status: 'ok' | 'error';
  errorMsg?: string;
}> {
  try {
    console.log(`[OfficialNews] 正在从 ${source.name} 获取数据...`);
    const response = await fetchWithTimeout(source.proxyPath);

    if (!response.ok) {
      return {
        items: [],
        status: 'error',
        errorMsg: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();

    // 根据不同来源使用不同的解析器
    let items: NewsItem[];
    switch (source.id) {
      case 'samr_recall':
        items = parseSamrRecallHtml(html, source);
        break;
      case 'samr_center':
        items = parseSamrRecallHtml(html, source); // 结构类似
        break;
      case 'nhc_policy':
        items = parseNhcNewsHtml(html, source);
        break;
      case 'cdc_alert':
        items = parseCdcNewsHtml(html, source);
        break;
      case 'nmpa_drug':
        items = parseNmpaRecallHtml(html, source);
        break;
      default:
        items = parseSamrRecallHtml(html, source);
    }

    console.log(`[OfficialNews] ${source.name}: 获取到 ${items.length} 条`);
    return { items, status: 'ok' };

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[OfficialNews] ${source.name} 获取失败:`, msg);
    return {
      items: [],
      status: 'error',
      errorMsg: msg.slice(0, 80),
    };
  }
}

// ==================== 公开接口类型 ====================

export interface NewsAggregatorResult {
  newsList: NewsItem[];
  urgentList: NewsItem[];
  sources: {
    name: string;
    fullName: string;
    count: number;
    status: 'ok' | 'error';
    errorMsg?: string;
    homepageUrl: string;
  }[];
  dataSourceType: DataSourceType;
  isFromCache: boolean;
  fetchedAt: string;
  officialCount: number;
}

// ==================== 核心聚合逻辑 ====================

export async function aggregateRealNews(): Promise<NewsAggregatorResult> {
  const cached = getCache<NewsAggregatorResult>(AGGREGATE_CACHE_KEY);
  if (cached) {
    refreshInBackground();
    return { ...cached, isFromCache: true };
  }
  return await doAggregate();
}

async function doAggregate(): Promise<NewsAggregatorResult> {
  const sources: NewsAggregatorResult['sources'] = [];
  let allOfficialNews: NewsItem[] = [];

  // 并行请求所有官方源
  const promises = OFFICIAL_SOURCES.map(async (source) => {
    const result = await fetchFromOfficialSource(source);
    sources.push({
      name: source.shortName,
      fullName: source.name,
      count: result.items.length,
      status: result.status,
      errorMsg: result.errorMsg,
      homepageUrl: source.homepageUrl,
    });
    return result.items;
  });

  const results = await Promise.allSettled(promises);
  results.forEach(result => {
    if (result.status === 'fulfilled') allOfficialNews.push(...result.value);
  });

  // 数据来源类型固定为官方
  const dataSourceType: DataSourceType = 'official';

  // 去重
  const deduped = deduplicateNews(allOfficialNews);

  // 排序（最新在前）
  deduped.sort((a, b) => b.date.localeCompare(a.date));

  // 分离紧急新闻
  const urgentList = deduped.filter(n => n.urgency === 'high');

  const result: NewsAggregatorResult = {
    newsList: deduped,
    urgentList,
    sources,
    dataSourceType,
    isFromCache: false,
    fetchedAt: new Date().toISOString(),
    officialCount: allOfficialNews.length,
  };

  setCache(AGGREGATE_CACHE_KEY, result);
  return result;
}

function refreshInBackground(): void {
  doAggregate()
    .then(result => setCache(AGGREGATE_CACHE_KEY, result))
    .catch(() => {});
}

function deduplicateNews(news: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return news.filter(item => {
    const key = item.title.slice(0, 20).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ==================== 分类查询 ====================

export async function getRealNewsByCategory(category: string): Promise<NewsItem[]> {
  const result = await aggregateRealNews();
  if (category === 'all') return result.newsList;
  return result.newsList.filter(n => n.category === category);
}

export async function getRealUrgentNews(): Promise<NewsItem[]> {
  const result = await aggregateRealNews();
  return result.urgentList;
}

export function getAggregatorStatus(): NewsAggregatorResult | null {
  return getCache<NewsAggregatorResult>(AGGREGATE_CACHE_KEY);
}

export async function forceRefreshNews(): Promise<NewsAggregatorResult> {
  try {
    localStorage.removeItem(CACHE_PREFIX + AGGREGATE_CACHE_KEY);
  } catch { /* ignore */ }
  return await doAggregate();
}

/**
 * 获取官方来源列表（用于UI展示）
 */
export function getOfficialSourcesList(): { name: string; fullName: string; url: string; icon: string; desc: string }[] {
  return OFFICIAL_SOURCES.map(s => ({
    name: s.shortName,
    fullName: s.name,
    url: s.homepageUrl,
    icon: s.icon,
    desc: s.description,
  }));
}
