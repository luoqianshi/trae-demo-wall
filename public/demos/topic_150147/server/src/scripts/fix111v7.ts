import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, watermark, signature, logo, messy composition, oversaturated, neon glow, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, cartoon character, anime character, game character, fantasy beast, weird creature, text at bottom, numbers, labels, captions, english text, random letters, gibberish, realistic fish photo, detailed fish scales, realistic animal';

const STYLE_SUFFIX = 'flat educational illustration style, warm soft earth tones, beige paper texture background, simple and clean, high quality, suitable for elementary school textbook, no humans, no people, no animals, no text labels, no numbers, no captions';

async function main() {
  const taskId = 291;
  console.log('重新生成 #111 汉字寻根之旅 封面 v7 - 图形演变版...');

  const prompt = `Educational illustration showing the evolution of Chinese character from pictogram to modern writing, five stages arranged horizontally left to right with small arrows between them:
1. Leftmost: a realistic side-view fish drawing (pictogram origin), simple outline style on stone tablet surface
2. Second stage: stylized geometric fish symbol carved on oracle bone, simplified into angular lines, less detailed, more symbolic
3. Middle stage: even more abstract symmetrical fish pattern on bronze vessel surface, decorative and structured, seal script style curves
4. Fourth stage: simplified fish character on bamboo scroll, composed of clean brush strokes, clerical script style
5. Rightmost: modern square fish character on white paper, regular script style with clear straight strokes
Each stage gradually transforms from a picture of a fish into a written character symbol, showing the evolutionary process clearly, ${STYLE_SUFFIX}`;

  const result = await generateImage({
    prompt,
    size: '1024x768',
    filename: `task_${taskId}_cover_v7`,
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
