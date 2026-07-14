import db from '../config/database';

// ============================================================
// 批量生成B站搜索链接并更新到数据库
// 使用方式:
//   npx ts-node src/scripts/batchUpdateVideos.ts            -- 实际写入
//   npx ts-node src/scripts/batchUpdateVideos.ts --dry-run  -- 预览不写入
// ============================================================

const BILIBILI_SEARCH_BASE = 'https://search.bilibili.com/all?keyword=';

function generateSearchUrl(title: string): string {
  // 为任务标题添加"实验教程"关键词，生成B站搜索链接
  const keyword = encodeURIComponent(`${title} 实验教程`);
  return `${BILIBILI_SEARCH_BASE}${keyword}`;
}

async function batchUpdateVideos(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  // 查询所有 external_video_url 为空的任务
  const tasks = db.prepare(
    "SELECT id, title, category, external_video_url FROM tasks WHERE external_video_url = '' OR external_video_url IS NULL"
  ).all() as any[];

  if (tasks.length === 0) {
    console.log('所有任务已有视频链接，无需更新');
    return;
  }

  console.log(`需要生成视频链接的任务数: ${tasks.length}`);
  if (isDryRun) {
    console.log('【DRY RUN 模式】仅预览，不写入数据库\n');
  }

  const updateStmt = db.prepare('UPDATE tasks SET external_video_url = ? WHERE id = ?');

  let updated = 0;
  for (const task of tasks) {
    const url = generateSearchUrl(task.title);
    console.log(`[${task.id}] ${task.title}`);
    console.log(`  -> ${url}`);

    if (!isDryRun) {
      updateStmt.run(url, task.id);
      updated++;
    }
  }

  if (isDryRun) {
    console.log(`\n【DRY RUN】共 ${tasks.length} 个任务需要更新，未实际写入`);
  } else {
    console.log(`\n视频链接更新完成: 已更新 ${updated} 个任务`);
  }
}

batchUpdateVideos().catch(console.error);