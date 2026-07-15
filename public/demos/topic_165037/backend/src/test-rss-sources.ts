import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const rssSources = [
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: '科技' },
  { name: 'Ars Technica - Science', url: 'https://feeds.arstechnica.com/arstechnica/science', category: '科学' },
  { name: 'Ars Technica - Tech', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: '科技' },
  { name: 'Ars Technica - Health', url: 'https://feeds.arstechnica.com/arstechnica/science/medical', category: '健康' },
  { name: 'NASA Breaking News', url: 'https://www.nasa.gov/news-release/feed/', category: '科学' },
  { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: '科学' },
  { name: 'Healthline', url: 'https://www.healthline.com/rss/all', category: '健康' },
  { name: 'Medpage Today', url: 'https://www.medpagetoday.com/rss/allnews.xml', category: '健康' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: '科技' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: '科技' },
  { name: 'Reuters Tech', url: 'https://www.reutersagency.com/feed/?best-topics=technology&post_type=best', category: '科技' },
  { name: 'Reuters Health', url: 'https://www.reutersagency.com/feed/?best-topics=health&post_type=best', category: '健康' },
  { name: 'BBC Science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: '科学' },
  { name: 'CNN Tech', url: 'http://rss.cnn.com/rss/edition_technology.rss', category: '科技' },
  { name: 'CNN Health', url: 'http://rss.cnn.com/rss/edition_health.rss', category: '健康' },
];

async function testRSS(url: string, name: string): Promise<{ hasFullText: boolean; contentLength: number; success: boolean }> {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)',
      },
    });
    
    const xml = res.data;
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    if (items.length === 0) return { hasFullText: false, contentLength: 0, success: false };
    
    const firstItem = items[0];
    
    let maxContentLength = 0;
    let hasFullText = false;
    
    for (const item of items.slice(0, 3)) {
      const contentMatch = item.match(/<content:encoded>(.*?)<\/content:encoded>/s) ||
                          item.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/s);
      if (contentMatch) {
        const content = contentMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (content.length > maxContentLength) {
          maxContentLength = content.length;
        }
        if (content.length > 500) {
          hasFullText = true;
        }
      }
    }
    
    return { hasFullText, contentLength: maxContentLength, success: true };
  } catch (err: any) {
    return { hasFullText: false, contentLength: 0, success: false };
  }
}

async function main() {
  console.log('测试 RSS 源内容完整性...\n');
  console.log('名称'.padEnd(30) + '状态'.padEnd(10) + '完整正文'.padEnd(10) + '最长长度');
  console.log('-'.repeat(70));
  
  const goodSources: typeof rssSources = [];
  
  for (const source of rssSources) {
    const result = await testRSS(source.url, source.name);
    const status = result.success ? '✅' : '❌';
    const fullText = result.hasFullText ? '是' : '否';
    console.log(`${source.name.padEnd(30)}${status.padEnd(10)}${fullText.padEnd(10)}${result.contentLength}`);
    
    if (result.success && result.hasFullText) {
      goodSources.push(source);
    }
  }
  
  console.log('\n========== 推荐源 ==========');
  for (const s of goodSources) {
    console.log(`  ${s.name} (${s.category})`);
    console.log(`    ${s.url}`);
  }
}

main();
