import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, watermark, signature, logo, messy composition, oversaturated, neon glow, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, cartoon character, anime character, game character, fantasy beast, weird creature, numbers, labels, captions, english text, random letters, gibberish, wrong characters, misspelled';

const STYLE_SUFFIX = 'warm scholarly atmosphere, traditional Chinese style, soft warm lighting, high quality illustration, educational and cultural feeling, no humans, no people, no animals, no text labels, no numbers, no captions';

async function main() {
  const taskId = 291;
  console.log('重新生成 #111 汉字寻根之旅 封面 v8 - 概念氛围版...');

  const prompt = `A conceptual illustration about the origin and evolution of Chinese characters, featuring:
- An ancient bamboo scroll unfurled in the foreground, with elegant Chinese calligraphy brush strokes
- A turtle shell with oracle bone script symbols in the background left
- A bronze ding vessel fragment with ancient patterns in the background right
- A calligraphy brush and ink stone resting beside the scroll
- Stacked ancient books and rice paper
- Warm golden light illuminating the scene, traditional Chinese study room atmosphere
- The theme of "tracing the roots of Chinese characters" conveyed through historical artifacts and writing tools
Soft beige and warm brown color palette, ${STYLE_SUFFIX}`;

  const result = await generateImage({
    prompt,
    size: '1024x768',
    filename: `task_${taskId}_cover_v8`,
    negative_prompt: NEGATIVE_PROMPT,
  });

  if (result.success && result.url) {
    db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?').run(result.url, taskId);
    console.log('✓ 成功:', result.url);
  } else {
    console.log('✗ 失败:', result.error);
  }
}

main().catch(console.error);
