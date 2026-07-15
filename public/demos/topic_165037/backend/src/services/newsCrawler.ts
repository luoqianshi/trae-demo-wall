import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { processNewArticle } from './aiService';

const decodeHtml = (html: string): string => {
  return html
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
};

const prisma = new PrismaClient();

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';
const DEFAULT_LANGUAGE = process.env.NEWS_LANGUAGE || 'en';
const DEFAULT_COUNTRY = process.env.NEWS_COUNTRY || 'us';
const DEFAULT_CATEGORIES = (process.env.NEWS_CATEGORIES || 'technology,health,science,world').split(',');

const CATEGORY_MAP: Record<string, string> = {
  technology: '科技',
  health: '健康',
  science: '科学',
  world: '国际',
  nation: '国内',
  business: '财经',
  entertainment: '娱乐',
  sports: '体育',
};

const RSS_SOURCES = [
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: '科技',
    fullText: true,
  },
  {
    name: 'Ars Technica - Science',
    url: 'https://feeds.arstechnica.com/arstechnica/science',
    category: '科学',
    fullText: true,
  },
  {
    name: 'Ars Technica - Tech',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    category: '科技',
    fullText: true,
  },
  {
    name: 'NASA',
    url: 'https://www.nasa.gov/news-release/feed/',
    category: '科学',
    fullText: true,
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: '科技',
    fullText: false,
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: '科技',
    fullText: false,
  },
  {
    name: 'Engadget',
    url: 'https://www.engadget.com/rss.xml',
    category: '科技',
    fullText: false,
  },
];

interface NewsArticle {
  title: string;
  content: string;
  description?: string;
  url: string;
  sourceName: string;
  category: string;
  publishedAt?: string;
}

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

const parseRSS = (xml: string): NewsArticle[] => {
  const articles: NewsArticle[] = [];
  
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  for (const item of items) {
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || 
                       item.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || 
                      item.match(/<description>([\s\S]*?)<\/description>/);
    const linkMatch = item.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) ||
                      item.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) ||
                         item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
    
    if (titleMatch) {
      let content = '';
      
      if (contentMatch) {
        content = stripHtml(contentMatch[1]);
      }
      
      if (content.length < 200 && descMatch) {
        const descContent = stripHtml(descMatch[1]);
        if (descContent.length > content.length) {
          content = descContent;
        }
      }
      
      articles.push({
        title: stripHtml(titleMatch[1]),
        description: descMatch ? stripHtml(descMatch[1]) : undefined,
        content: content,
        url: linkMatch ? linkMatch[1].trim() : '',
        sourceName: '',
        category: '',
        publishedAt: pubDateMatch ? pubDateMatch[1].trim() : undefined,
      });
    }
  }
  
  return articles;
};

const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

const fetchRSSFeed = async (url: string): Promise<NewsArticle[]> => {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YuezhiAI/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    return parseRSS(response.data);
  } catch (error: any) {
    console.error('  RSS抓取失败:', url.split('/')[2]);
    return [];
  }
};

const fetchGNewsByCategory = async (
  category: string,
  max: number = 5
): Promise<GNewsArticle[]> => {
  if (!GNEWS_API_KEY || GNEWS_API_KEY === 'your-gnews-api-key') {
    return [];
  }

  try {
    const response = await axios.get<GNewsResponse>(
      `${GNEWS_BASE_URL}/top-headlines`,
      {
        params: {
          token: GNEWS_API_KEY,
          category,
          lang: DEFAULT_LANGUAGE,
          country: DEFAULT_COUNTRY,
          max,
        },
        timeout: 20000,
      }
    );
    return response.data.articles;
  } catch (error: any) {
    console.error(`  [GNews ${category}] 获取失败:`, error.message);
    return [];
  }
};

const collectFromRSS = async (): Promise<NewsArticle[]> => {
  console.log('📡 从 RSS 源收集新闻...');
  
  const allArticles: NewsArticle[] = [];
  const usedTitles = new Set<string>();
  
  for (const source of RSS_SOURCES) {
    console.log(`  抓取: ${source.name}`);
    const articles = await fetchRSSFeed(source.url);
    
    for (const article of articles.slice(0, 3)) {
      if (!usedTitles.has(article.title)) {
        usedTitles.add(article.title);
        article.sourceName = source.name;
        article.category = source.category;
        allArticles.push(article);
      }
    }
  }
  
  console.log(`  RSS 共获取 ${allArticles.length} 篇文章`);
  return allArticles;
};

const collectFromGNews = async (): Promise<NewsArticle[]> => {
  console.log('📰 从 GNews API 收集新闻...');
  
  const allArticles: NewsArticle[] = [];
  
  for (const category of DEFAULT_CATEGORIES) {
    const articles = await fetchGNewsByCategory(category, 3);
    
    for (const gnewsArticle of articles) {
      let content = gnewsArticle.content || gnewsArticle.description;
      
      if (content.length < 200 && gnewsArticle.description) {
        content = gnewsArticle.description + '\n\n' + content;
      }
      
      allArticles.push({
        title: gnewsArticle.title,
        description: gnewsArticle.description,
        content: content,
        url: gnewsArticle.url,
        sourceName: gnewsArticle.source.name,
        category: CATEGORY_MAP[category] || category,
        publishedAt: gnewsArticle.publishedAt,
      });
    }
  }
  
  console.log(`  GNews 共获取 ${allArticles.length} 篇文章`);
  return allArticles;
};

const saveArticle = async (article: NewsArticle): Promise<boolean> => {
  const decodedTitle = decodeHtml(article.title);
  
  const existing = await prisma.article.findFirst({
    where: { title: decodedTitle },
  });

  if (existing) {
    return false;
  }

  const content = decodeHtml(article.content || article.description || article.title);

  if (content.length < 500) {
    return false;
  }

  await prisma.article.create({
    data: {
      title: decodedTitle,
      sourceUrl: article.url,
      sourceName: article.sourceName,
      category: article.category,
      originalContent: content,
    },
  });

  return true;
};

const collectNews = async () => {
  console.log('========================================');
  console.log('📰 开始每日新闻收集...');
  console.log('========================================');

  let newCount = 0;
  let skipCount = 0;
  let aiProcessed = 0;

  try {
    let allArticles: NewsArticle[] = [];
    
    const rssArticles = await collectFromRSS();
    allArticles = [...allArticles, ...rssArticles];
    
    if (GNEWS_API_KEY && GNEWS_API_KEY !== 'your-gnews-api-key') {
      const gnewsArticles = await collectFromGNews();
      allArticles = [...allArticles, ...gnewsArticles];
    }
    
    const seenTitles = new Set<string>();
    const uniqueArticles: NewsArticle[] = [];
    
    for (const article of allArticles) {
      const normalizedTitle = article.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueArticles.push(article);
      }
    }
    
    console.log(`\n📝 共获取 ${uniqueArticles.length} 篇去重后的文章`);
    console.log('\n💾 开始入库...\n');
    
    for (const article of uniqueArticles) {
      const isNew = await saveArticle(article);
      
      if (isNew) {
        newCount++;
        console.log(`  ✅ [${article.category}] ${article.title.slice(0, 50)}...`);
        
        try {
          const savedArticle = await prisma.article.findFirst({
            where: { title: article.title },
          });
          if (savedArticle) {
            await processNewArticle(savedArticle.id, savedArticle.originalContent);
            aiProcessed++;
          }
        } catch (err: any) {
          console.error('     文章处理失败:', err.message);
        }
      } else {
        skipCount++;
      }
    }
    
    console.log('\n========================================');
    console.log('📊 收集结果:');
    console.log(`   ✅ 新增: ${newCount} 篇`);
    console.log(`   ⏭️  跳过: ${skipCount} 篇`);
    if (aiProcessed > 0) {
      console.log(`   🤖 AI处理: ${aiProcessed} 篇`);
    }
    console.log('========================================');
    console.log('✅ 新闻收集完成');
  } catch (error: any) {
    console.error('❌ 新闻收集失败:', error.message);
  }

  return { newCount, skipCount, aiProcessed };
};

export const startCronJobs = () => {
  if (process.env.NODE_ENV === 'test') return;

  console.log('⏰ 定时任务已启动');
  console.log('   每日凌晨2点自动收集新闻');

  cron.schedule(
    '0 2 * * *',
    () => {
      console.log('⏰ 触发每日新闻收集任务');
      collectNews();
    },
    {
      timezone: 'Asia/Shanghai',
    }
  );
};

export { collectNews, fetchRSSFeed, fetchGNewsByCategory };
