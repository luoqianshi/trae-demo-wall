import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const rssSources = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition_world.rss' },
];

async function testRSS(url: string, name: string) {
  console.log(`\n========== ${name} ==========`);
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)',
      },
    });
    
    const xml = res.data;
    
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`文章数量: ${items.length}`);
    
    if (items.length > 0) {
      const firstItem = items[0];
      
      const titleMatch = firstItem.match(/<title>(.*?)<\/title>/s) || 
                         firstItem.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s);
      console.log(`标题: ${titleMatch?.[1]?.substring(0, 60)}...`);
      
      const contentMatch = firstItem.match(/<content:encoded>(.*?)<\/content:encoded>/s) ||
                          firstItem.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/s);
      if (contentMatch) {
        const content = contentMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`content:encoded 长度: ${content.length}`);
        console.log(`前100字: ${content.substring(0, 100)}...`);
      } else {
        console.log(`没有 content:encoded`);
      }
      
      const descMatch = firstItem.match(/<description>(.*?)<\/description>/s) ||
                       firstItem.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s);
      if (descMatch) {
        const desc = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`description 长度: ${desc.length}`);
      }
    }
  } catch (err: any) {
    console.log(`失败: ${err.message}`);
  }
}

async function main() {
  for (const source of rssSources) {
    await testRSS(source.url, source.name);
  }
}

main();
