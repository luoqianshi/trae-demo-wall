import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

// ============================================================
// 负面提示词：大幅扩展，排除生物/怪兽/人物等不相关风格
// ============================================================
const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon, human, person, people, face, hands, portrait, character, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai, reptile, lizard, serpent, snake animal, snake head, snake eyes, snake tongue, snake scales, living snake, snake body, cobra, python, viper, any living creature with eyes, any animal, any beast';

// ============================================================
// 干净清爽日系动漫插画风格（适合中小学生审美）
// ============================================================
const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks, no humans, no people, no characters, no animals, no creatures';

// ============================================================
// 分类风格模板
// ============================================================
const CATEGORY_STYLES: Record<string, string> = {
  science: 'clean laboratory scene with glass beakers and test tubes, simple chemical reactions with soft colors, science equipment neatly arranged, bright classroom lab with window light, simple educational illustration style',
  nature: 'soft natural scenery, green leaves and plants, gentle sunlight filtering through trees, cute small animals, clear streams and flowers, Ghibli-inspired gentle nature, warm outdoor light',
  creative: 'colorful art supplies and handmade crafts arranged neatly, warm craft room with wooden desk, paper, scissors, paint and glue, cozy creative atmosphere, soft warm light',
  programming: 'colorful computer screen with code blocks, friendly robot companion, desk with keyboard and monitor, simple tech illustration style, warm soft blue tones, playful digital elements',
  humanities: 'warm soft tones, traditional Chinese cultural elements, ancient books and scrolls, historical artifacts, gentle storytelling atmosphere, museum-like display, warm lantern light',
  life: 'cozy everyday scenes, home-cooked food with soft steam, tidy room with warm sunlight, kitchen with cooking ingredients, friendly neighborhood atmosphere, slice-of-life anime style',
};

// ============================================================
// 针对容易有歧义的任务，提供更精准的 visual_prompt
// ============================================================
const CUSTOM_VISUAL_PROMPTS: Record<string, string> = {
  '法老之蛇': 'Black carbon foam rising from burning sugar and baking soda mixture in a glass dish, serpentine ash column formed by chemical reaction, long porous black substance growing upward from white powder on sand, classic chemistry experiment, laboratory table with goggles and matchbox, educational scientific demonstration',
  '自制电动机': 'Homemade simple electric motor experiment, a small coil of copper wire spinning between two magnets on a battery, neatly arranged on a wooden desk, physics experiment setup with wires and alligator clips',
  '水果电池': 'Fruit battery science experiment, a potato with zinc and copper nails connected to a small LED light bulb and alligator clips, the LED glowing softly, on a clean wooden desk',
  '会跳舞的葡萄干': 'Dancing raisins experiment, clear glass of soda water with raisins floating up and down, tiny carbon dioxide bubbles clinging to the raisins, refreshing carbonated beverage close-up',
  '彩虹密度塔': 'Rainbow density tower experiment, a tall clear glass with five distinct colorful liquid layers stacked on top of each other (red, orange, yellow, green, blue), vibrant sugar water gradient, lab table background',
  '自制火山喷发': 'Homemade volcano eruption experiment, a clay volcano model on a tray with red foam erupting from the crater, baking soda and vinegar reaction, messy bubbling overflow, kitchen table',
  '鸡蛋浮力实验': 'Egg buoyancy experiment, two glasses of water side by side, one egg sinking in plain water, one egg floating in salt water, clear demonstration of density and buoyancy principle',
  '水火箭': 'Water rocket launch experiment, a plastic bottle rocket with fins spraying water upward from a launch pad, physics demonstration of air pressure and thrust, outdoor scene',
  '自制净水器': 'Homemade water filter experiment, a clear plastic bottle layered with sand, activated carbon, cotton balls and pebbles, dirty water pouring in from the top, clean water dripping out the bottom',
  '非牛顿流体实验': 'Non-Newtonian fluid experiment, a bowl of oobleck (cornstarch and water mixture), a spoon pressing into the thick goopy substance, hands playing with the strange fluid, kitchen counter',
  '自制显微镜': 'Homemade simple microscope, a small lens made from a drop of water on a plastic sheet over a paper frame, examining tiny objects, DIY optics experiment on a desk',
  '植物喝水实验': 'Plant drinking water experiment, white carnation flowers in colored water glasses showing the stem sucking up dye, celery stalk with colored veins, transpiration demonstration',
  '水晶种植': 'Crystal growing experiment, a string hanging in a jar growing colorful crystals, saturated salt or sugar solution, chemistry experiment with beautiful crystal formations',
  '静电实验': 'Static electricity experiment, a balloon rubbed on hair picking up small pieces of paper, hair standing up from static charge, physics demonstration on a wooden table',
  '自制指南针': 'Homemade compass experiment, a magnetized needle floating on a piece of cork in a bowl of water, pointing north, DIY navigation science project',
  '表面张力实验': 'Surface tension experiment, a water strider insect standing on the water surface, or a paperclip floating on water due to surface tension, droplets of water on a leaf',
  '大气压实验': 'Atmospheric pressure experiment, a glass of water upside down with a card covering the top, the card staying in place without water spilling, amazing air pressure demonstration',
  '声音振动实验': 'Sound vibration experiment, rice grains dancing on a drum skin being played, sound waves visible through movement, or salt on a speaker membrane vibrating with music',
  '太阳能实验': 'Solar energy experiment, a small solar panel connected to a mini fan spinning in sunlight, clean renewable energy demonstration on a windowsill',
  '指纹提取': 'Fingerprint lifting experiment, dusting powder on a glass surface revealing invisible fingerprints, forensic science setup with brush and tape, detective style',
  '纸桥承重': 'Paper bridge engineering challenge, a folded paper bridge spanning between two books holding coins on top, simple structural engineering experiment',
  '降落伞制作': 'Homemade parachute experiment, a small plastic bag parachute with strings carrying a toy figure slowly falling through the air, air resistance and gravity demonstration',
  '自制弹弓': 'Homemade slingshot craft, a wooden stick Y-shape with rubber bands and a leather pouch, simple mechanical energy toy, safe DIY version with soft materials',
  '迷宫实验': 'Maze experiment, a paper maze with a small marble being navigated through the paths, or a maze drawn with pencil, problem solving and spatial reasoning challenge',
};

// 构建 prompt
function buildPrompt(task: any): string {
  // 优先使用自定义 prompt
  const visualPrompt = CUSTOM_VISUAL_PROMPTS[task.title] || task.visual_prompt || `Educational science illustration of ${task.title}, no humans`;
  const categoryStyle = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.science;
  return `${visualPrompt}, ${categoryStyle}, ${STYLE_SUFFIX}`;
}

// 获取需要重新生成的任务
function getTasksToRegen(): any[] {
  // 方式1: 指定标题列表
  const titles = Object.keys(CUSTOM_VISUAL_PROMPTS);
  const placeholders = titles.map(() => '?').join(',');
  const tasks = db.prepare(
    `SELECT id, title, category FROM tasks WHERE title IN (${placeholders}) ORDER BY id ASC`
  ).all(...titles) as any[];
  return tasks;
}

async function regenerateTaskCovers(): Promise<void> {
  const tasks = getTasksToRegen();

  if (tasks.length === 0) {
    console.log('没有需要重新生成的任务');
    return;
  }

  console.log(`需要重新生成封面的任务数: ${tasks.length}`);

  const updateStmt = db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const prompt = buildPrompt(task);

    console.log(`[${i + 1}/${tasks.length}] 重新生成: ${task.title} (id=${task.id})`);
    console.log(`  prompt: ${prompt.substring(0, 100)}...`);

    // 首次尝试
    let result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `task_cover_${task.id}_v2`,
      negative_prompt: NEGATIVE_PROMPT,
    });

    // 失败后重试一次
    if (!result.success) {
      console.log(`  首次失败: ${result.error}，3秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      result = await generateImage({
        prompt,
        size: '1024x768',
        filename: `task_cover_${task.id}_v2`,
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

    // 间隔1.5秒避免限流
    if (i < tasks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  console.log(`\n封面重新生成完成: 成功 ${success}, 失败 ${failed}`);
}

regenerateTaskCovers().catch(console.error);