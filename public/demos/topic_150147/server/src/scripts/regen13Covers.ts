import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai, reptile, lizard, serpent';

const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks, no humans, no people, no characters';

interface RegenTask {
  id: number;
  title: string;
  category: string;
  prompt: string;
}

const tasksToRegen: RegenTask[] = [
  {
    id: 122, title: '购物小达人', category: 'math',
    prompt: 'Colorful shopping scene, Chinese yuan banknotes and coins scattered on a wooden counter, a small shopping basket filled with fruits and stationery items, price tags and a calculator, warm bright supermarket atmosphere, children shopping math game theme',
  },
  {
    id: 123, title: '时间管理员', category: 'math',
    prompt: 'A beautiful round analog clock with colorful numbers on a wooden desk, hourglass timer, calendar, alarm clock, and a small daily schedule planner, time management theme for children, warm soft light, clock hands clearly showing time',
  },
  {
    id: 124, title: '趣味数独挑战', category: 'math',
    prompt: 'A 9x9 sudoku puzzle grid on paper with colorful numbers filled in correctly, pencil and eraser beside it, wooden desk background, math puzzle game for kids, clean logical layout, numbers from 1 to 9 properly placed',
  },
  {
    id: 128, title: '我的英语自我介绍', category: 'english',
    prompt: 'A decorative greeting card with Hello written on it, speech bubbles with simple words like name age hobby, small flag icons of different countries, English learning theme for children, bright cheerful design, decorative stars and hearts',
  },
  {
    id: 129, title: '英语单词卡片DIY', category: 'english',
    prompt: 'Colorful flashcards with simple pictures on each card - apple, cat, sun, tree, book, hand-drawn style, scissors, colored paper, glue stick on a craft table, DIY English word card making activity for kids, warm creative atmosphere',
  },
  {
    id: 130, title: '英语情景对话', category: 'english',
    prompt: 'Two colorful speech bubbles floating in friendly conversation, small icons of daily scenes - school park home shop, English dialogue practice theme, bright cheerful colors, decorative elements like stars and balloons, no text inside bubbles',
  },
  {
    id: 131, title: '英语国家文化探索', category: 'english',
    prompt: 'A world map on a desk surrounded by cultural icons from English-speaking countries - Big Ben, Statue of Liberty, Sydney Opera House, maple leaf, tea cup, small national flags, travel and culture exploration theme for kids',
  },
  {
    id: 135, title: '历史名人小传', category: 'history',
    prompt: 'An open ancient book on a wooden table, surrounded by historical artifacts - ink brush, ancient scroll, bronze vessel, ink stone, traditional Chinese history theme, warm soft light, classical scholarly atmosphere',
  },
  {
    id: 143, title: '气候与四季', category: 'geography',
    prompt: 'Four seasons scene composition - spring flowers blooming, summer sun and beach, autumn leaves and harvest, winter snowflakes and pine tree, arranged in a circle showing the cycle of seasons, colorful children geography illustration',
  },
  {
    id: 146, title: '诚信小故事', category: 'politics',
    prompt: 'A storybook open on a desk, showing an illustration of a child returning a wallet, heart symbol and handshake icon, moral education theme, warm gentle colors, children virtue learning illustration',
  },
  {
    id: 147, title: '团结合作的力量', category: 'politics',
    prompt: 'Multiple hands stacking together in a team huddle gesture, puzzle pieces fitting together, building blocks forming a tower, teamwork and cooperation theme, warm bright colors, children social education illustration',
  },
  {
    id: 148, title: '校园文明公约', category: 'politics',
    prompt: 'A colorful poster board on a school bulletin board, decorated with small icons of school rules - raising hand, queuing, helping, friendly greeting, campus civilization theme, bright cheerful school atmosphere',
  },
  {
    id: 153, title: '回声探秘', category: 'physics',
    prompt: 'Sound waves bouncing off a mountain cliff, visible curved sound wave lines echoing in a valley, a small megaphone and ear icon, physics of sound and echo demonstration, colorful educational science illustration',
  },
];

async function main() {
  console.log(`共 ${tasksToRegen.length} 个任务需要重新生成封面\n`);

  const updateStmt = db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?');
  let success = 0;
  let failed = 0;

  for (let i = 0; i < tasksToRegen.length; i++) {
    const task = tasksToRegen[i];
    const fullPrompt = `${task.prompt}, ${STYLE_SUFFIX}`;

    console.log(`[${i + 1}/${tasksToRegen.length}] #${task.id} ${task.title}`);

    let result = await generateImage({
      prompt: fullPrompt,
      size: '1024x768',
      filename: `task_cover_${task.id}_v6`,
      negative_prompt: NEGATIVE_PROMPT,
    });

    if (!result.success) {
      console.log(`  首次失败: ${result.error}，3秒后重试...`);
      await new Promise(r => setTimeout(r, 3000));
      result = await generateImage({
        prompt: fullPrompt,
        size: '1024x768',
        filename: `task_cover_${task.id}_v6`,
        negative_prompt: NEGATIVE_PROMPT,
      });
    }

    if (result.success && result.url) {
      updateStmt.run(result.url, task.id);
      success++;
      console.log(`  成功: ${result.url.split('/').pop()}`);
    } else {
      failed++;
      console.log(`  失败: ${result.error}`);
    }

    if (i < tasksToRegen.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n完成: 成功 ${success}, 失败 ${failed}`);
}

main().catch(console.error);
