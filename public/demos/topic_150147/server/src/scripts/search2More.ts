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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);
    const results: any[] = [];
    const seen = new Set<string>();
    $('.bili-video-card').each((_, card) => {
      const link = $(card).find('a[href*="/video/"]').first();
      const href = link.attr('href');
      if (!href) return;
      const match = href.match(/\/video\/([^/?]+)/);
      if (!match) return;
      const bvid = match[1];
      if (seen.has(bvid)) return;
      seen.add(bvid);
      const titleEl = $(card).find('h3, .bili-video-card__info--tit, .title');
      let title = titleEl.attr('title') || titleEl.text().trim() || link.attr('title') || '';
      title = cleanTitle(title);
      if (!title || title.length < 3) return;
      let videoUrl = href;
      if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
      else if (!videoUrl.startsWith('http')) videoUrl = 'https://www.bilibili.com' + videoUrl;
      results.push({ bvid, title, url: videoUrl });
    });
    return results.slice(0, 5);
  } catch (error) {
    console.error(`  搜索失败: ${(error as Error).message.slice(0, 50)}`);
    return [];
  }
}

async function main() {
  const tasks = [
    { num: '#122', kws: ['认识人民币 微课 小学数学', '人民币 购物 小学 动画', '一年级 人民币 认识 短'] },
    { num: '#123', kws: ['时间管理 儿童 小学生', '做时间的小主人 儿童', '珍惜时间 小学生 动画'] },
  ];

  for (const task of tasks) {
    console.log(`\n========== ${task.num} ==========`);
    for (const kw of task.kws) {
      console.log(`\n  搜索: ${kw}`);
      const r = await searchBilibili(kw);
      r.forEach((x, i) => console.log(`  [${i+1}] ${x.title.slice(0, 70)}\n       ${x.bvid}/`));
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

main().catch(console.error);
