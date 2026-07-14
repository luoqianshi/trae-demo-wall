import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, cartoon character, anime character, game character, fantasy beast, weird creature, any text at bottom, numbers, labels, captions, english text, random letters, gibberish text, misspelled characters';

const STYLE_SUFFIX = 'clean educational illustration, soft and pleasant color palette, clean and simple composition, soft natural lighting, warm and inviting atmosphere, high quality, suitable for kids, educational and inspiring mood, no humans, no people, no characters, no animals, no text labels, no numbers, no captions';

async function main() {
  const taskId = 291;
  console.log('重新生成 #111 汉字寻根之旅 封面 v6 - 鱼字演变极简版...');

  const prompt = `A minimalist educational illustration showing the evolution of Chinese character "fish" through five historical stages, arranged horizontally from left to right with small arrows between stages:
1. Leftmost: a simple pictographic fish symbol carved on an oracle turtle shell fragment, ancient bone script style, abstract geometric fish shape
2. Second: bronze vessel surface with a fish-shaped decorative pattern in jinwen style, more structured and symmetrical
3. Middle: bamboo slips with seal script fish character, smooth curved lines and balanced composition
4. Fourth: traditional regular script fish character on old rice paper, clear standard strokes
5. Rightmost: modern simplified fish character on white paper, clean and simple
Warm beige background with subtle paper texture, traditional Chinese scholarly atmosphere, soft lighting, ${STYLE_SUFFIX}`;

  const result = await generateImage({
    prompt,
    size: '1024x768',
    filename: `task_${taskId}_cover_v6`,
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
