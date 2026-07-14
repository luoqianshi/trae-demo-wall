import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

// ============================================================
// 负面提示词：排除低质量、人物、过饱和、过度特效、生物/怪兽风格等
// ============================================================
const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai';

// ============================================================
// 干净清爽日系动漫插画风格（适合中小学生审美）
// 核心：柔和色彩、干净构图、适度细节、不花哨
// ============================================================
const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks, no humans, no people, no characters';

// ============================================================
// 分类风格模板（干净清爽版，聚焦任务内容本身）
// ============================================================
const CATEGORY_STYLES: Record<string, string> = {
  science: 'clean laboratory scene with glass beakers and test tubes, simple chemical reactions with soft colors, science equipment neatly arranged, bright classroom lab with window light, simple educational illustration style',
  nature: 'soft natural scenery, green leaves and plants, gentle sunlight filtering through trees, cute small animals, clear streams and flowers, Ghibli-inspired gentle nature, warm outdoor light',
  creative: 'colorful art supplies and handmade crafts arranged neatly, warm craft room with wooden desk, paper, scissors, paint and glue, cozy creative atmosphere, soft warm light',
  programming: 'colorful computer screen with code blocks, friendly robot companion, desk with keyboard and monitor, simple tech illustration style, warm soft blue tones, playful digital elements',
  humanities: 'warm soft tones, traditional Chinese cultural elements, ancient books and scrolls, historical artifacts, gentle storytelling atmosphere, museum-like display, warm lantern light',
  life: 'cozy everyday scenes, home-cooked food with soft steam, tidy room with warm sunlight, kitchen with cooking ingredients, friendly neighborhood atmosphere, slice-of-life anime style',
};

// 根据任务数据动态构建prompt（聚焦任务内容，无人物）
function buildPrompt(task: any): string {
  const visualPrompt = task.visual_prompt || `Anime illustration of ${task.title}, educational scene`;
  const categoryStyle = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.science;
  return `${visualPrompt}, ${categoryStyle}, ${STYLE_SUFFIX}`;
}

async function generateAllCovers(): Promise<void> {
  // 查询所有缺少封面图的任务，倒序生成（让最新的任务先有图，首页先显示）
  const tasks = db.prepare(
    "SELECT id, title, category FROM tasks WHERE cover_image = '' OR cover_image IS NULL ORDER BY id DESC"
  ).all() as any[];

  if (tasks.length === 0) {
    console.log('所有任务已有封面图，无需生成');
    return;
  }

  // 从JSON文件加载visual_prompt数据
  const fs = require('fs');
  const path = require('path');
  const tasksData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'tasks_v3.json'), 'utf-8')
  ) as any[];

  // 构建visual_prompt映射
  const visualPromptMap: Record<string, string> = {};
  for (const t of tasksData) {
    visualPromptMap[t.title] = t.visual_prompt || '';
  }

  console.log(`需要生成封面的任务数: ${tasks.length}`);

  const updateStmt = db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const visualPrompt = visualPromptMap[task.title] || '';
    const taskWithPrompt = { ...task, visual_prompt: visualPrompt };
    const prompt = buildPrompt(taskWithPrompt);

    console.log(`[${i + 1}/${tasks.length}] 生成: ${task.title}`);

    // 首次尝试
    let result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `task_cover_${task.id}`,
      negative_prompt: NEGATIVE_PROMPT,
    });

    // 失败后重试一次（等待3秒）
    if (!result.success) {
      console.log(`  首次失败: ${result.error}，3秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      result = await generateImage({
        prompt,
        size: '1024x768',
        filename: `task_cover_${task.id}`,
        negative_prompt: NEGATIVE_PROMPT,
      });
    }

    if (result.success && result.url) {
      updateStmt.run(result.url, task.id);
      success++;
      console.log(`  成功: ${result.url}`);
    } else {
      failed++;
      console.log(`  失败: ${result.error}`);
    }

    // 间隔1秒避免API限流
    if (i < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n封面生成完成: 成功 ${success}, 失败 ${failed}`);
}

generateAllCovers().catch(console.error);