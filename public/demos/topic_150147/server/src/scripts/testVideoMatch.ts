import axios from 'axios';
import * as cheerio from 'cheerio';

const BILIBILI_SEARCH_BASE = 'https://search.bilibili.com/all?keyword=';

interface VideoResult {
  bvid: string;
  title: string;
  url: string;
}

const BLACKLIST_KEYWORDS = [
  '沉浸式', '治愈', '解压', 'ASMR', '助眠', '白噪音',
  '搞笑', '整活', '鬼畜', '恶搞', '沙雕',
  'vlog', '日常', '分享', '测评', '开箱',
  '吃播', '美食', '游戏', '直播', 'reaction',
  '盘点', '合集', '混剪', '剪辑',
];

const WHITELIST_KEYWORDS = [
  '教程', '教学', '讲解', '原理', '实验',
  '科学', '小学生', '儿童', '少儿', '启蒙',
  '入门', '基础', '知识', '科普',
  '怎么做', '如何做', '制作方法', '步骤',
];

function calculateScore(title: string): number {
  let score = 0;
  const lowerTitle = title.toLowerCase();

  for (const kw of BLACKLIST_KEYWORDS) {
    if (lowerTitle.includes(kw.toLowerCase())) {
      score -= 100;
    }
  }

  for (const kw of WHITELIST_KEYWORDS) {
    if (lowerTitle.includes(kw.toLowerCase())) {
      score += 10;
    }
  }

  if (lowerTitle.includes('小学')) score += 5;
  if (lowerTitle.includes('实验')) score += 5;
  if (lowerTitle.includes('原理')) score += 5;
  if (lowerTitle.includes('教程')) score += 3;
  if (lowerTitle.includes('教学')) score += 3;

  return score;
}

async function searchBilibili(keyword: string): Promise<VideoResult[]> {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `${BILIBILI_SEARCH_BASE}${encodedKeyword}&order=click&duration=1`;

    const response = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: VideoResult[] = [];

    $('a[href*="/video/"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (!href) return;

      const match = href.match(/\/video\/([^/?]+)/);
      if (!match) return;

      const bvid = match[1];
      const title = $(elem).attr('title') || $(elem).text().trim();
      if (!title || title.length < 3) return;

      let videoUrl = href;
      if (videoUrl.startsWith('//')) {
        videoUrl = 'https:' + videoUrl;
      } else if (!videoUrl.startsWith('http')) {
        videoUrl = 'https://www.bilibili.com' + videoUrl;
      }

      if (results.some(r => r.bvid === bvid)) return;

      results.push({
        bvid,
        title: title.replace(/\s+/g, ' ').trim(),
        url: videoUrl,
      });
    });

    return results.slice(0, 15);
  } catch (error) {
    console.error(`  搜索失败: ${keyword} - ${(error as Error).message.slice(0, 60)}`);
    return [];
  }
}

async function testTask(title: string, category: string) {
  console.log(`\n========== 测试: ${title} (${category}) ==========`);

  const keywords: string[] = [
    `${title} 实验 原理 小学生`,
    `${title} 科学实验 教程`,
    `${title} 儿童 科普`,
  ];

  const allResults: VideoResult[] = [];
  const seenBvids = new Set<string>();

  for (const kw of keywords) {
    console.log(`\n搜索: ${kw}`);
    const results = await searchBilibili(kw);
    console.log(`  找到 ${results.length} 条结果`);
    results.slice(0, 5).forEach((r, i) => {
      console.log(`    [${i + 1}] ${r.title.slice(0, 50)}`);
    });

    for (const r of results) {
      if (!seenBvids.has(r.bvid)) {
        seenBvids.add(r.bvid);
        allResults.push(r);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const scored = allResults
    .map(r => ({ ...r, score: calculateScore(r.title) }))
    .filter(r => r.score > -50)
    .sort((a, b) => b.score - a.score);

  console.log(`\n--- 排序后的 TOP 5 ---`);
  scored.slice(0, 5).forEach((r, i) => {
    console.log(`  [${i + 1}] (${r.score}分) ${r.title}`);
    console.log(`       ${r.url}`);
  });

  if (scored.length > 0) {
    console.log(`\n✓ 最佳匹配: ${scored[0].title}`);
    console.log(`   URL: ${scored[0].url}`);
  } else {
    console.log(`\n✗ 未找到合适视频`);
  }
}

async function main() {
  await testTask('植物喝水实验', 'science');
  await testTask('水果电池', 'science');
}

main().catch(console.error);
