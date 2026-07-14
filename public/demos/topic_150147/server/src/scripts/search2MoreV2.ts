import axios from 'axios';
import * as cheerio from 'cheerio';

function cleanTitle(title: string): string {
  return title.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function searchBilibili(keyword: string): Promise<any[]> {
  try {
    const url = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`;
    const response = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      },
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);
    const results: any[] = [];
    const seen = new Set<string>();
    $('a[href*="/video/BV"]').each((_, link) => {
      const href = $(link).attr('href');
      if (!href) return;
      const match = href.match(/\/video\/(BV[a-zA-Z0-9]+)/);
      if (!match) return;
      const bvid = match[1];
      if (seen.has(bvid)) return;
      seen.add(bvid);
      let title = $(link).attr('title') || $(link).text().trim() || '';
      title = cleanTitle(title);
      if (!title || title.length < 5) return;
      results.push({ bvid, title });
    });
    return results.slice(0, 5);
  } catch (error) {
    console.error(`  搜索失败: ${(error as Error).message.slice(0, 60)}`);
    return [];
  }
}

async function main() {
  const tasks = [
    { num: '#122', kws: ['认识人民币 小学', '购物 数学 一年级', '人民币兑换 儿童'] },
    { num: '#123', kws: ['时间管理 小学生', '做时间的小主人', '认识时间 管理 儿童'] },
  ];

  for (const task of tasks) {
    console.log(`\n========== ${task.num} ==========`);
    for (const kw of task.kws) {
      console.log(`\n  搜索: ${kw}`);
      const r = await searchBilibili(kw);
      r.forEach((x, i) => console.log(`  [${i+1}] ${x.title.slice(0, 70)}\n       ${x.bvid}/`));
      await new Promise(r => setTimeout(r, 800));
    }
  }
}

main().catch(console.error);
