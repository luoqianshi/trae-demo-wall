import { generateImage } from '../services/imageGenerator';
import db from '../config/database';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, human, person, people, face, hands, portrait, character, monster, creature, animal';

const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids, educational and inspiring mood, no text, no watermarks';

const prompt = `Top view of a wooden desk with a sudoku puzzle book, pencil, eraser, and a small desk lamp casting warm light. The sudoku grid is partially filled with numbers, focus on the pencil tip hovering over the puzzle, thinking moment, cozy study corner, warm afternoon sunlight from window, educational puzzle theme for children. ${STYLE_SUFFIX}`;

async function main() {
  console.log('重新生成 #124 趣味数独挑战 封面');
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`  第 ${attempt} 次尝试...`);
    const result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `task_cover_124_v${7 + attempt}`,
      negative_prompt: NEGATIVE_PROMPT,
    });
    if (result.success && result.url) {
      db.prepare('UPDATE tasks SET cover_image = ? WHERE id = 124').run(result.url);
      console.log(`  成功: ${result.url.split('/').pop()}`);
      return;
    }
    console.log(`  失败: ${result.error}`);
    await new Promise(r => setTimeout(r, 3000));
  }
}

main().catch(console.error);
