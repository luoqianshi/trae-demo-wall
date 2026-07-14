import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../config/database';

const BILIBILI_SEARCH_BASE = 'https://search.bilibili.com/all?keyword=';
const BILIBILI_VIDEO_BASE = 'https://www.bilibili.com/video/';

interface SearchResult {
  videoId: string;
  title: string;
  url: string;
}

async function searchBilibili(keyword: string): Promise<SearchResult | null> {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `${BILIBILI_SEARCH_BASE}${encodedKeyword}`;
    
    const response = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    const $ = cheerio.load(response.data);
    
    const videoLink = $('a[href*="/video/"]').first();
    if (videoLink.length === 0) {
      return null;
    }

    const href = videoLink.attr('href');
    if (!href) {
      return null;
    }

    const match = href.match(/\/video\/([^/?]+)/);
    if (!match) {
      return null;
    }

    const videoId = match[1];
    let videoUrl = href;
    if (videoUrl.startsWith('//')) {
      videoUrl = 'https:' + videoUrl;
    } else if (!videoUrl.startsWith('http')) {
      videoUrl = 'https://www.bilibili.com' + videoUrl;
    }

    return {
      videoId,
      title: videoLink.attr('title') || '',
      url: videoUrl,
    };
  } catch (error) {
    console.error(`搜索失败: ${keyword} - ${error}`);
    return null;
  }
}

async function crawlVideos(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  const tasks = db.prepare(
    "SELECT id, title, category, external_video_url FROM tasks WHERE external_video_url LIKE '%search.bilibili%' OR external_video_url = '' OR external_video_url IS NULL"
  ).all() as any[];

  if (tasks.length === 0) {
    console.log('所有任务已有具体视频链接，无需更新');
    return;
  }

  console.log(`需要获取具体视频链接的任务数: ${tasks.length}`);
  if (isDryRun) {
    console.log('【DRY RUN 模式】仅预览，不写入数据库\n');
  }

  const updateStmt = db.prepare('UPDATE tasks SET external_video_url = ? WHERE id = ?');

  let success = 0;
  let failed = 0;

  for (const task of tasks) {
    console.log(`[${task.id}] ${task.title}`);
    
    const result = await searchBilibili(`${task.title} 教程`);
    
    if (result) {
      console.log(`  -> ${result.url}`);
      if (!isDryRun) {
        updateStmt.run(result.url, task.id);
      }
      success++;
    } else {
      console.log(`  -> 未找到视频`);
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (isDryRun) {
    console.log(`\n【DRY RUN】共 ${tasks.length} 个任务，成功 ${success} 个，失败 ${failed} 个`);
  } else {
    console.log(`\n视频链接更新完成: 成功 ${success} 个，失败 ${failed} 个`);
  }
}

crawlVideos().catch(console.error);