import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai, reptile, lizard, serpent, snake animal, snake head, snake eyes, snake tongue, snake scales, living snake, snake body, cobra, python, viper, any living creature with eyes, any animal, any beast';

const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks, no humans, no people, no characters, no animals, no creatures';

const PROMPT = 'Black carbon foam rising from burning sugar and baking soda mixture in a glass dish, serpentine ash column formed by chemical reaction, long porous black substance growing upward from white powder on sand, classic chemistry experiment, laboratory table with goggles and matchbox, educational scientific demonstration, clean laboratory scene with glass beakers and test tubes, simple chemical reactions with soft colors, science equipment neatly arranged, bright classroom lab with window light, simple educational illustration style';

const TASK_TITLE = '法老之蛇';

async function regenSingle(): Promise<void> {
  const task = db.prepare('SELECT id, title FROM tasks WHERE title = ?').get(TASK_TITLE) as any;
  if (!task) {
    console.log('未找到任务');
    return;
  }

  console.log(`重新生成: ${task.title} (id=${task.id})`);
  console.log(`prompt: ${PROMPT}`);

  const fullPrompt = `${PROMPT}, ${STYLE_SUFFIX}`;

  let result = await generateImage({
    prompt: fullPrompt,
    size: '1024x768',
    filename: `task_cover_${task.id}_v3`,
    negative_prompt: NEGATIVE_PROMPT,
  });

  if (!result.success) {
    console.log(`首次失败: ${result.error}，3秒后重试...`);
    await new Promise(r => setTimeout(r, 3000));
    result = await generateImage({
      prompt: fullPrompt,
      size: '1024x768',
      filename: `task_cover_${task.id}_v3`,
      negative_prompt: NEGATIVE_PROMPT,
    });
  }

  if (result.success && result.url) {
    db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?').run(result.url, task.id);
    console.log(`成功: ${result.url}`);
  } else {
    console.log(`失败: ${result.error}`);
  }
}

regenSingle().catch(console.error);