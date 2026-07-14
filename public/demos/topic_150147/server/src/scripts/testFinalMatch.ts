import axios from 'axios';
import * as cheerio from 'cheerio';

const BILIBILI_SEARCH_BASE = 'https://search.bilibili.com/all?keyword=';

// 明确的核心词表：任务标题中可能出现的关键实词
const SCIENCE_KEYWORDS = [
  '植物', '动物', '水', '火', '电', '光', '声', '力', '磁', '热', '冷',
  '空气', '气压', '浮力', '重力', '密度', '张力', '摩擦', '惯性', '能量',
  '化学', '反应', '酸碱', '淀粉', '碘酒', '蛋壳', '火山', '晶体', '金属',
  '生锈', '肥皂', '汽水', '二氧化碳', '氧气', '燃烧', '细胞', '骨骼',
  '毛细', '蒸腾', '光合', '生态', '进化', '遗传', '微生物', '细菌',
  '太阳', '月亮', '地球', '天气', '气候', '季节',
];

const BLACKLIST = [
  '沉浸式', '治愈', '解压', 'ASMR', '助眠', '白噪音',
  '搞笑', '整活', '鬼畜', '恶搞', '沙雕',
  'vlog', '日常', '分享', '测评', '开箱',
  '吃播', '美食', '游戏', '直播', 'reaction',
  '盘点', '合集', '混剪', '剪辑',
  '我的世界', '原神', '王者', '荣耀', '英雄联盟',
  '小说', '推文', '故事', '影视', '电影', '电视剧',
  '帅哥', '美女', '小姐姐', '小哥哥',
];

const WHITELIST = [
  '教程', '教学', '讲解', '原理', '实验',
  '科学', '小学生', '儿童', '少儿', '启蒙',
  '入门', '基础', '知识', '科普',
  '怎么做', '如何做', '制作方法', '步骤',
  '手工', 'DIY', '小制作', '小发明',
];

function calculateScore(videoTitle: string, taskTitle: string): number {
  let score = 0;
  const vt = videoTitle.toLowerCase();
  const tt = taskTitle.toLowerCase();

  // 黑名单扣分（直接排除娱乐类视频）
  for (const kw of BLACKLIST) {
    if (vt.includes(kw.toLowerCase())) {
      score -= 200;
    }
  }

  // 白名单加分（教学类视频加分）
  for (const kw of WHITELIST) {
    if (vt.includes(kw.toLowerCase())) {
      score += 8;
    }
  }

  // 任务标题完整匹配（最高优先级）
  if (vt.includes(tt)) {
    score += 50;
  }

  // 任务标题去"实验"后匹配
  const titleNoExp = tt.replace(/实验/g, '').trim();
  if (titleNoExp.length >= 3 && vt.includes(titleNoExp)) {
    score += 40;
  }

  // 核心实词人肉匹配：从任务标题中提取关键名词
  const keyNouns = extractKeyNouns(taskTitle);
  let nounHits = 0;
  for (const noun of keyNouns) {
    if (vt.includes(noun.toLowerCase())) {
      nounHits++;
      score += 20; // 每个核心名词20分
    }
  }

  // 核心名词命中率
  if (keyNouns.length > 0) {
    score += Math.floor((nounHits / keyNouns.length) * 30);
  }

  return score;
}

function extractKeyNouns(title: string): string[] {
  // 从任务标题中提取关键名词
  const nouns = new Set<string>();
  
  // 从预置科学关键词中匹配
  for (const kw of SCIENCE_KEYWORDS) {
    if (title.includes(kw)) {
      nouns.add(kw);
    }
  }

  // 简单的2字词组提取（排除常见后缀/前缀）
  const clean = title.replace(/[（）()的小大与之·]/g, '');
  const commonWords = ['实验', '制作', '探秘', '探索', '研究', '学习', '挑战', '日记', '记录', '观察', '入门', '基础', '认知', '认识', '趣味', '简单', '自制'];
  
  for (const w of commonWords) {
    if (clean.includes(w)) {
      nouns.add(w);
    }
  }

  // 如果关键词太少，补充一些2字词组
  if (nouns.size < 2) {
    for (let i = 0; i < clean.length - 1; i++) {
      const gram = clean.substring(i, i + 2);
      if (gram.trim().length === 2 && !/^\d+$/.test(gram)) {
        nouns.add(gram);
        if (nouns.size >= 4) break;
      }
    }
  }

  return [...nouns];
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

async function testTask(taskTitle: string, category: string) {
  console.log(`\n========== 测试: ${taskTitle} (${category}) ==========`);
  console.log(`核心名词: ${extractKeyNouns(taskTitle).join(', ')}`);

  const keywords = [
    `${taskTitle} 实验 原理 小学生`,
    `${taskTitle} 科学实验 教程`,
    `${taskTitle} 儿童 科普`,
  ];

  const allResults: any[] = [];
  const seenBvids = new Set<string>();

  for (const kw of keywords) {
    console.log(`\n搜索: ${kw}`);
    const results = await searchBilibili(kw);
    console.log(`  找到 ${results.length} 条`);

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
    .filter(r => r.score > 20)
    .sort((a, b) => b.score - a.score);

  console.log(`\n--- TOP 5 (共${scored.length}个合格候选) ---`);
  scored.slice(0, 5).forEach((r, i) => {
    console.log(`  [${i + 1}] (${r.score}分) ${r.title}`);
    console.log(`       ${r.url}`);
  });
}

async function main() {
  await testTask('植物喝水实验', 'science');
  await testTask('水果电池', 'science');
  await testTask('会跳舞的葡萄干', 'science');
  await testTask('自制火山喷发', 'science');
}

main().catch(console.error);
