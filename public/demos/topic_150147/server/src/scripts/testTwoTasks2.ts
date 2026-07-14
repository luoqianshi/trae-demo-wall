import axios from 'axios';
import * as cheerio from 'cheerio';

const BILIBILI_SEARCH_BASE = 'https://search.bilibili.com/all?keyword=';

const BLACKLIST_KEYWORDS = [
  '沉浸式', '治愈', '解压', 'ASMR', '助眠', '白噪音',
  '搞笑', '整活', '鬼畜', '恶搞', '沙雕',
  'vlog', '日常', '分享', '测评', '开箱',
  '吃播', '美食', '游戏', '直播', 'reaction',
  '盘点', '合集', '混剪', '剪辑',
  '我的世界', '原神', '王者', '荣耀', '英雄联盟',
  '小说', '推文', '故事', '影视', '电影', '电视剧',
  '帅哥', '美女', '小姐姐', '小哥哥',
];

const WHITELIST_KEYWORDS = [
  '教程', '教学', '讲解', '原理', '实验',
  '科学', '小学生', '儿童', '少儿', '启蒙',
  '入门', '基础', '知识', '科普',
  '怎么做', '如何做', '制作方法', '步骤',
  '手工', 'DIY', '小制作', '小发明',
];

function calculateScore(title: string, taskTitle: string): number {
  let score = 0;
  const cleanTitle = title.toLowerCase();

  for (const kw of BLACKLIST_KEYWORDS) {
    if (cleanTitle.includes(kw.toLowerCase())) {
      score -= 100;
    }
  }

  for (const kw of WHITELIST_KEYWORDS) {
    if (cleanTitle.includes(kw.toLowerCase())) {
      score += 10;
    }
  }

  const uniqueTaskChars = [...new Set(taskTitle.replace(/\s+/g, ''))].filter(c => c.length > 0);
  let matchCount = 0;
  for (const char of uniqueTaskChars) {
    if (cleanTitle.includes(char.toLowerCase())) {
      matchCount++;
    }
  }
  const matchRatio = uniqueTaskChars.length > 0 ? matchCount / uniqueTaskChars.length : 0;
  score += Math.floor(matchRatio * 50);

  const corePhrases = [
    taskTitle,
    taskTitle.replace(/实验/g, ''),
    taskTitle.replace(/小/g, ''),
    taskTitle.replace(/的/g, ''),
  ].filter(p => p.length >= 3);
  
  for (const phrase of corePhrases) {
    if (cleanTitle.includes(phrase.toLowerCase())) {
      score += 30;
      break;
    }
  }

  return score;
}

function cleanTitle(title: string): string {
  return title.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function searchBilibili(keyword: string): Promise<any[]> {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `${BILIBILI_SEARCH_BASE}${encodedKeyword}`;

    const response = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: any[] = [];
    const seenBvids = new Set<string>();

    $('.bili-video-card').each((_, card) => {
      const link = $(card).find('a[href*="/video/"]').first();
      const href = link.attr('href');
      if (!href) return;

      const match = href.match(/\/video\/([^/?]+)/);
      if (!match) return;

      const bvid = match[1];
      if (seenBvids.has(bvid)) return;
      seenBvids.add(bvid);

      const titleEl = $(card).find('h3, .bili-video-card__info--tit, .title');
      let title = titleEl.attr('title') || titleEl.text().trim() || link.attr('title') || '';
      title = cleanTitle(title);
      if (!title || title.length < 3) return;

      let videoUrl = href;
      if (videoUrl.startsWith('//')) {
        videoUrl = 'https:' + videoUrl;
      } else if (!videoUrl.startsWith('http')) {
        videoUrl = 'https://www.bilibili.com' + videoUrl;
      }

      results.push({ bvid, title, url: videoUrl });
    });

    return results.slice(0, 20);
  } catch (error) {
    console.error(`  搜索失败: ${keyword} - ${(error as Error).message.slice(0, 60)}`);
    return [];
  }
}

async function testTask(taskTitle: string, keywords: string[]) {
  console.log(`\n========== 测试: ${taskTitle} ==========`);

  const allResults: any[] = [];
  const seenBvids = new Set<string>();

  for (const kw of keywords) {
    const results = await searchBilibili(kw);
    for (const r of results) {
      if (!seenBvids.has(r.bvid)) {
        seenBvids.add(r.bvid);
        allResults.push(r);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  const scored = allResults
    .map(r => ({ ...r, score: calculateScore(r.title, taskTitle) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log(`\n--- TOP 5 (共${scored.length}个候选) ---`);
  scored.slice(0, 5).forEach((r, i) => {
    console.log(`  [${i + 1}] (${r.score}分) ${r.title}`);
    console.log(`       ${r.url}`);
  });
}

async function main() {
  await testTask('植物喝水实验', [
    '植物喝水实验 实验 原理 小学生',
    '植物喝水实验 科学实验 教程',
    '毛细现象 实验 小学生',
  ]);

  await testTask('水果电池', [
    '水果电池 实验 原理 小学生',
    '水果电池 科学实验 教程',
    '水果电池 儿童 科普',
  ]);
}

main().catch(console.error);
