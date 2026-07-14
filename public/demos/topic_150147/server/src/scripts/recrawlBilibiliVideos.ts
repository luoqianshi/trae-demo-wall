import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../config/database';

const BILIBILI_SEARCH_BASE = 'https://search.bilibili.com/all?keyword=';

interface VideoResult {
  bvid: string;
  title: string;
  url: string;
}

const SCIENCE_KEYWORDS = [
  '植物', '动物', '水', '火', '电', '光', '声', '力', '磁', '热', '冷',
  '空气', '气压', '浮力', '重力', '密度', '张力', '摩擦', '惯性', '能量',
  '化学', '反应', '酸碱', '淀粉', '碘酒', '蛋壳', '火山', '晶体', '金属',
  '生锈', '肥皂', '汽水', '二氧化碳', '氧气', '燃烧', '细胞', '骨骼',
  '毛细', '蒸腾', '光合', '生态', '进化', '遗传', '微生物', '细菌',
  '太阳', '月亮', '地球', '天气', '气候', '季节', '彩虹', '折射',
  '弹簧', '降落伞', '潜望镜', '万花筒', '温度计', '指南针', '显微镜',
  '电动机', '火箭', '净水器', '非牛顿', '法老之蛇', '水果电池',
  '葡萄干', '密度塔', '毛细现象', '表面张力', '大气压', '热胀冷缩',
  '杠杆', '斜面', '回声', '静电',
];

const BLACKLIST_KEYWORDS = [
  '沉浸式', '治愈', '解压', 'ASMR', '助眠', '白噪音',
  '搞笑', '整活', '鬼畜', '恶搞', '沙雕',
  'vlog', '日常', '分享', '测评', '开箱',
  '吃播', '美食', '游戏', '直播', 'reaction',
  '盘点', '合集', '混剪', '剪辑',
  '我的世界', '原神', '王者', '荣耀', '英雄联盟',
  '小说', '推文', '故事', '影视', '电影', '电视剧',
  '帅哥', '美女', '小姐姐', '小哥哥',
  '水精灵', '水宝宝', '海绵宝宝',
];

const WHITELIST_KEYWORDS = [
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

  for (const kw of BLACKLIST_KEYWORDS) {
    if (vt.includes(kw.toLowerCase())) {
      score -= 200;
    }
  }

  for (const kw of WHITELIST_KEYWORDS) {
    if (vt.includes(kw.toLowerCase())) {
      score += 8;
    }
  }

  if (vt.includes(tt)) {
    score += 50;
  }

  const titleNoExp = tt.replace(/实验/g, '').trim();
  if (titleNoExp.length >= 3 && vt.includes(titleNoExp)) {
    score += 40;
  }

  const keyNouns = extractKeyNouns(taskTitle);
  let nounHits = 0;
  for (const noun of keyNouns) {
    if (vt.includes(noun.toLowerCase())) {
      nounHits++;
      score += 20;
    }
  }

  if (keyNouns.length > 0) {
    score += Math.floor((nounHits / keyNouns.length) * 30);
  }

  return score;
}

function extractKeyNouns(title: string): string[] {
  const nouns = new Set<string>();

  for (const kw of SCIENCE_KEYWORDS) {
    if (title.includes(kw)) {
      nouns.add(kw);
    }
  }

  const clean = title.replace(/[（）()的小大与之·]/g, '');
  const commonWords = ['实验', '制作', '探秘', '探索', '研究', '学习', '挑战', '日记', '记录', '观察', '入门', '基础', '认知', '认识', '趣味', '简单', '自制', '大比拼', '小实验'];

  for (const w of commonWords) {
    if (clean.includes(w)) {
      nouns.add(w);
    }
  }

  if (nouns.size < 2) {
    for (let i = 0; i < clean.length - 1; i++) {
      const gram = clean.substring(i, i + 2);
      if (gram.trim().length === 2 && !/^\d+$/.test(gram)) {
        nouns.add(gram);
        if (nouns.size >= 5) break;
      }
    }
  }

  return [...nouns];
}

function cleanTitle(title: string): string {
  return title.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function searchBilibili(keyword: string): Promise<VideoResult[]> {
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
    const results: VideoResult[] = [];
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

function buildSearchKeywords(task: any): string[] {
  const title = task.title;
  const category = task.category;

  const keywords: string[] = [];

  switch (category) {
    case 'science':
    case 'physics':
    case 'chemistry':
    case 'biology':
      keywords.push(`${title} 实验 原理 小学生`);
      keywords.push(`${title} 科学实验 教程`);
      keywords.push(`${title} 儿童 科普`);
      break;
    case 'creative':
      keywords.push(`${title} 制作教程 手工`);
      keywords.push(`${title} 小学生 手工制作`);
      keywords.push(`${title} 怎么做`);
      break;
    case 'programming':
    case 'computer':
    case 'ai':
      keywords.push(`${title} 入门教程 儿童`);
      keywords.push(`${title} 教学 少儿`);
      keywords.push(`${title} 零基础`);
      break;
    case 'nature':
      keywords.push(`${title} 科普 小学生`);
      keywords.push(`${title} 科学 儿童`);
      keywords.push(`${title} 知识`);
      break;
    case 'humanities':
    case 'history':
    case 'geography':
    case 'politics':
    case 'chinese':
      keywords.push(`${title} 小学生 科普`);
      keywords.push(`${title} 儿童 知识`);
      keywords.push(`${title} 教学`);
      break;
    case 'life':
      keywords.push(`${title} 教学 儿童`);
      keywords.push(`${title} 小学生 安全知识`);
      keywords.push(`${title} 教程`);
      break;
    case 'math':
      keywords.push(`${title} 小学生 数学`);
      keywords.push(`${title} 儿童 数学启蒙`);
      keywords.push(`${title} 趣味数学`);
      break;
    case 'english':
      keywords.push(`${title} 儿童 英语启蒙`);
      keywords.push(`${title} 少儿英语 教学`);
      keywords.push(`${title} 小学英语`);
      break;
    default:
      keywords.push(`${title} 教程 小学生`);
      keywords.push(`${title} 儿童 科普`);
  }

  return keywords;
}

async function findBestVideo(task: any): Promise<VideoResult | null> {
  const keywords = buildSearchKeywords(task);
  const allResults: VideoResult[] = [];
  const seenBvids = new Set<string>();

  for (const keyword of keywords) {
    const results = await searchBilibili(keyword);

    for (const r of results) {
      if (!seenBvids.has(r.bvid)) {
        seenBvids.add(r.bvid);
        allResults.push(r);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 600));
  }

  if (allResults.length === 0) return null;

  const scored = allResults
    .map(r => ({ ...r, score: calculateScore(r.title, task.title) }))
    .filter(r => r.score > 20)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  console.log(`  候选数: ${scored.length}，TOP 3:`);
  scored.slice(0, 3).forEach((r, i) => {
    console.log(`    [${i + 1}] (${r.score}分) ${r.title.slice(0, 50)}`);
  });

  return scored[0];
}

async function recrawlAllVideos(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  const tasks = db.prepare(
    "SELECT id, title, category, external_video_url FROM tasks ORDER BY id"
  ).all() as any[];

  console.log(`总任务数: ${tasks.length}`);
  if (isDryRun) {
    console.log('【DRY RUN 模式】仅预览，不写入数据库\n');
  }

  const updateStmt = db.prepare('UPDATE tasks SET external_video_url = ? WHERE id = ?');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] ${task.title} (${task.category})`);
    console.log(`  原视频: ${task.external_video_url}`);

    const best = await findBestVideo(task);

    if (best) {
      console.log(`  ✓ 新视频: ${best.title}`);
      console.log(`     URL: ${best.url}`);
      if (!isDryRun) {
        updateStmt.run(best.url, task.id);
      }
      success++;
    } else {
      console.log(`  ✗ 未找到合适视频，保留原视频`);
      failed++;
    }

    if (i < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  console.log(`\n===== 视频重匹配完成 =====`);
  console.log(`成功更新: ${success}`);
  console.log(`未找到更好的: ${failed}`);
  console.log(`总计: ${tasks.length}`);
}

recrawlAllVideos().catch(console.error);
