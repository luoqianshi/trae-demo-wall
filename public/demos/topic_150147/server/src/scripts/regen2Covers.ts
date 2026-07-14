import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, cartoon character, anime character';

const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks';

const tasks = [
  {
    id: 124, title: '趣味数独挑战',
    prompt: 'A wooden desk with a 9x9 sudoku puzzle book open, pencil and eraser beside it, some numbers filled in correctly forming a valid sudoku puzzle with numbers 1 through 9, clean math puzzle illustration, warm soft light, educational theme',
  },
  {
    id: 131, title: '英语国家文化探索',
    prompt: 'An open world map book on a wooden desk, with famous landmarks from English-speaking countries arranged around it - Big Ben of London, Statue of Liberty of New York, Sydney Opera House of Australia, Big Ben clock tower, Eiffel Tower is NOT included, only UK USA Australia Canada landmarks, travel and culture exploration theme, warm desk light',
  },
];

async function main() {
  const updateStmt = db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?');

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const fullPrompt = `${task.prompt}, ${STYLE_SUFFIX}`;
    console.log(`[${i + 1}/${tasks.length}] #${task.id} ${task.title}`);

    let result = await generateImage({
      prompt: fullPrompt,
      size: '1024x768',
      filename: `task_cover_${task.id}_v7`,
      negative_prompt: NEGATIVE_PROMPT,
    });

    if (!result.success) {
      console.log(`  失败，重试: ${result.error}`);
      await new Promise(r => setTimeout(r, 3000));
      result = await generateImage({
        prompt: fullPrompt,
        size: '1024x768',
        filename: `task_cover_${task.id}_v7`,
        negative_prompt: NEGATIVE_PROMPT,
      });
    }

    if (result.success && result.url) {
      updateStmt.run(result.url, task.id);
      console.log(`  成功: ${result.url.split('/').pop()}`);
    } else {
      console.log(`  失败: ${result.error}`);
    }

    if (i < tasks.length - 1) await new Promise(r => setTimeout(r, 1500));
  }
  console.log('\n完成');
}

main().catch(console.error);
