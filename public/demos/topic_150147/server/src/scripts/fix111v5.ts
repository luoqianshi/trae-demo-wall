import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai';

const STYLE_SUFFIX = 'clean educational illustration, soft and pleasant color palette, clean and simple composition, soft natural lighting, warm and inviting atmosphere, high quality, suitable for kids, educational and inspiring mood, no humans, no people, no characters';

async function main() {
  const taskId = 291;
  console.log('重新生成 #111 汉字寻根之旅 封面 v5 - 鱼字演变...');

  const prompt = `Evolution of Chinese character "fish" (yu) shown in five stages horizontally from left to right, demonstrating how the character evolved from a pictogram to modern writing:
Stage 1 - leftmost: a simple fish drawing pictogram on oracle bone / turtle shell, ancient bone script style
Stage 2: oracle bone script fish character carved on turtle plastron, ancient pictographic symbol
Stage 3: bronze script (jinwen) fish character on a bronze ding vessel surface, elaborate decorative style
Stage 4: small seal script (xiaozhuan) fish character written on bamboo slips, elegant curved lines
Stage 5 - rightmost: regular script (kaishu) fish character on rice paper, clear modern standard writing
Each stage shows the fish character in its proper historical script style, arranged side by side with arrows pointing from left to right showing evolution flow, Chinese cultural education theme, warm soft tones, ancient Chinese artifacts, ${STYLE_SUFFIX}`;

  const result = await generateImage({
    prompt,
    size: '1024x768',
    filename: `task_${taskId}_cover_v5`,
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
