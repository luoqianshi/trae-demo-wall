import db from '../config/database';
import { generateImage } from '../services/imageGenerator';
import fs from 'fs';
import path from 'path';

// 超强负面提示词
const NEGATIVE_PROMPT = 'human, person, people, man, woman, girl, boy, child, kid, baby, student, teacher, face, hands, portrait, character, human figure, person silhouette, anime girl, anime boy, cartoon person, any person, any human, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai, reptile, lizard, serpent, snake animal, cat, dog, bird, fish, rabbit, bear, panda, fox, wolf, tiger, lion, elephant, giraffe, any animal, any living creature, any beast, any pet, any wildlife, insect, butterfly, ant, ladybug, bee, spider, dinosaur, low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon';

const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks, no humans, no people, no characters, no animals, no creatures, object-focused, scene-only, item still life';

// 所有需要重新生成的高风险任务的精准prompt
// 全部纯物品/场景，绝对不出现人物和动物
const FIX_PROMPTS: Record<string, string> = {
  // ========== 语文素养 (chinese) ==========
  '成语故事小剧场': 'Open comic book with four-panel Chinese idiom story illustrations, colorful cartoon artwork on white pages, book lying flat on a wooden desk with ink brush and ink stone nearby, traditional Chinese stationery, no people',
  '古诗配画创作': 'Traditional Chinese ink wash painting of mountain and river landscape at night with moon, bamboo trees and misty hills, classical Chinese art style, scroll painting on a wooden desk with brush and ink, no people',
  '汉字寻根之旅': 'Chinese character evolution chart showing oracle bone script, bronze script, seal script, clerical script, regular script, five stages of character development arranged horizontally, educational poster on parchment background, no people',
  '寓言故事新编': 'Open storybook with fable illustration on pages, moral tale artwork featuring inanimate objects and nature scenes, book on a wooden table with reading glasses, warm cozy reading nook, no people no animals',
  '小小书法家': 'Chinese calligraphy tools arranged neatly on a wooden desk, brush, ink stone, rice paper, ink bottle, seal, paperweight, traditional writing stationery, a half-finished character on paper, top-down view, no people',
  '我的第一本日记': 'Colorful notebook with handwritten diary pages and small doodles, pen, pencil, stickers, and a cup on a wooden desk, cozy journaling setup, warm desk lamp light, no people',
  '绕口令大挑战': 'Colorful speech bubbles floating with Chinese text, playful typography design, bright vibrant colors, microphone and sound waves, speech bubble shapes in pink blue yellow, no people',
  '童谣创编小达人': 'Musical notes floating around an open songbook, colorful music notation, nursery rhyme book on a table with toy instruments, xylophone and tambourine, cheerful music theme, no people no animals',

  // ========== 英语启蒙 (english) ==========
  '英语绘本小读者': 'Open English picture book with colorful animal-free illustrations, bright storybook pages lying flat on a cozy blanket, book with vibrant artwork, childrens story book, no people',
  '字母创意画': 'Creative alphabet letter art, letter A shaped like an apple, letter B like a butterfly-free shape, colorful artistic letters, ABC letters with creative object designs, educational alphabet poster, no people no animals',
  '英语歌曲小歌手': 'Musical notes and song lyrics floating in colorful bubbles, headphones and microphone on a table, music player with sound waves, karaoke microphone setup, no people',
  '我的英语自我介绍': 'Hello my name is speech bubble with text, colorful name tags and flashcards, English greeting words, name tag design on bright background, no people',
  '英语单词卡片DIY': 'Stack of colorful English vocabulary flashcards with pictures of objects, apple ball cat flash cards, educational word cards spread on a table, learning materials, no people',
  '英语情景对话': 'Restaurant menu and shopping basket with speech bubbles, dialogue bubbles with English text, food menu and shopping items, everyday conversation theme, no people no animals',
  '英语国家文化探索': 'World map with flags of English speaking countries, UK USA Australia Canada flags, cultural symbols like big ben statue of liberty opera house, travel and geography theme, no people',

  // ========== 历史探秘 (history) ==========
  '恐龙时代探秘': 'Various dinosaur fossils and skeletons arranged in a museum display, prehistoric bones and skulls, natural history museum exhibit, fossils and rocks, no living dinosaurs no people',
  '秦始皇兵马俑': 'Rows of terracotta warrior statues in a museum hall, ancient Chinese clay soldier figures standing in formation, archaeological site with pottery warriors, museum lighting, no living people',
  '长城的故事': 'The Great Wall of China winding across green mountain ridges, ancient stone fortification stretching far into the distance, historical landmark, mountain landscape, no people',
  '历史名人小传': 'Open history book with portrait silhouettes and timeline, ancient Chinese artifacts and scrolls, historical relics arranged on a table, bronze vessels and jade, no people',
  '郑和下西洋': 'Ancient Chinese treasure ship sailing on the ocean, Ming dynasty junk boat with red sails, maritime exploration vessel on calm blue sea, historical nautical scene, no people',
  '古代兵器大观': 'Collection of ancient Chinese weapons arranged on display stands, bronze swords, spears, bows, shields, halberds, museum exhibit of ancient weaponry, historical artifacts, no people',

  // ========== 人文社科 (humanities) ==========
  '我的家族故事': 'Open photo album with old photographs and mementos, family tree chart, vintage photos and keepsakes on a wooden table, memory book, nostalgia theme, no visible faces no people',
  '古诗词里的四季': 'Four seasonal landscape paintings arranged in a row, spring flowers summer lotus autumn leaves winter snow, traditional Chinese painting of four seasons, scroll art, no people',
  '家乡非遗小调查': 'Traditional Chinese handicrafts and folk art, paper cutting, shadow puppets, embroidery, clay figurines, cultural heritage crafts displayed on a table, no people',
  '我家老物件博物馆': 'Vintage household items and antiques on display shelves, old radio, pocket watch, abacus, ceramic bowl, traditional Chinese objects, museum-style arrangement, no people',
  '创作一本绘本': 'Blank open book with colorful illustrations and drawings, art supplies scattered around, paintbrushes watercolors crayons, childrens book creation workspace, no people',
  '中国传统节日研究': 'Chinese traditional festival symbols arranged together, red lanterns, mooncake, zongzi dumplings, Spring Festival couplets, festival decorations, cultural celebration items, no people',
  '中国汉字演变': 'Evolution of Chinese characters from oracle bone to modern, five styles of writing arranged chronologically, educational chart with calligraphy samples, no people',
  '中国茶文化': 'Traditional Chinese tea ceremony setup, clay teapot, teacups, tea leaves, bamboo tea tray, gongfu tea arrangement on a wooden table, elegant tea set, no people',
  '丝绸之路地图': 'Ancient silk road map with caravan route marked, camel silhouettes, desert and mountains, historical trade route illustration, parchment map style, no people',
  '二十四节气研究': 'Twenty-four solar terms wheel chart, Chinese traditional calendar with seasonal icons, agricultural calendar, circular diagram with nature symbols, no people',
  '古代四大发明研究': 'Four great inventions of ancient China, compass, paper making, printing, gunpowder represented by historical artifacts, sinan compass, paper, woodblock, firecrackers, no people',
  '地方方言收集': 'Audio recording equipment and handwritten notes, old cassette player, microphone, notebooks with dialect words, language research materials on a desk, no people',

  // ========== 道德法治 (politics) ==========
  '认识国旗国徽': 'Chinese five-star red flag and national emblem displayed together, red flag with yellow stars, golden national emblem with Tiananmen, patriotic symbols on blue background, no people',
  '我是环保小卫士': 'Recycling bins with sorted waste, green earth, trees and clean environment, eco-friendly concept, recycling center with colored bins, environmental protection theme, no people',
  '诚信小故事': 'Open storybook with moral tale illustration, golden key and honest scale, truth and integrity symbols, storybook on a table, no people no animals',
  '团结合作的力量': 'Puzzle pieces fitting together, building blocks forming a tower, team work concept with interlocking shapes, collaboration symbol, colorful puzzle, no people',
  '校园文明公约': 'Classroom rules poster with icons and text, school supplies arranged neatly, colorful classroom decorations, bulletin board design, empty classroom, no people',
  '小小志愿者': 'Volunteer symbols like helping hands, heart icon, donation box, community service tools, cleaning supplies and gardening tools, charity and kindness theme, no people',

  // ========== 生活实践 (life) ==========
  '包饺子': 'Chinese dumpling making ingredients and tools, flour, rolling pin, dumpling wrappers, filling bowl, wooden board, traditional jiaozi preparation on kitchen table, no people',
  '心肺复苏(CPR)学习': 'CPR training mannequin and first aid kit, rescue dummy on the floor with emergency equipment, AED device, first aid supplies, medical training scene, no people',
  '防溺水安全教育': 'Swimming pool safety equipment, lifebuoy, floatation ring, pool fence, warning signs, water safety gear, swimming pool scene, no people',
  '火灾逃生我知道': 'Fire safety equipment, fire extinguisher, smoke alarm, exit sign, emergency evacuation plan on a wall, firefighting gear, safety equipment, no people',
  '校园防欺凌': 'Anti-bullying poster with kind words and peace symbols, school safety signs, friendship and kindness icons, colorful classroom posters, no people',
  '学做菜': 'Cooking ingredients and kitchen tools arranged on a counter, cutting board with vegetables, chef knife, mixing bowls, recipe book, kitchen preparation scene, no people',
  '网络安全小卫士': 'Computer security concept, lock icon on screen, shield and firewall symbols, laptop with security icons, digital safety theme, no people',
  '情绪管理小达人': 'Emotion chart with colorful faces and feeling icons, mood tracker, emotion wheel, mindfulness and breathing exercise icons, mental health concept, no people',
  '刷牙好习惯': 'Toothbrush, toothpaste, dental floss, mouthwash, and a big smiling teeth model, oral hygiene products, dental care items on a bathroom counter, no people',
  '自行车安全': 'Bicycle with helmet, reflectors, bell, safety gear, bike maintenance tools, cycling equipment, street safety scene, no people',
  '营养均衡餐盘': 'Balanced meal on a plate with food groups divided, healthy eating plate diagram, vegetables grains protein fruits dairy, nutrition chart, food pyramid, no people',

  // ========== AI初体验 (ai) ==========
  '什么是人工智能': 'Futuristic AI concept, circuit board brain pattern, glowing neural network, digital technology background, robot brain illustration, tech blue theme, no people',
  'AI绘画体验': 'Digital art tablet with stylus, AI generated artwork on screen, drawing pen, creative technology, digital illustration setup, no people',
  '语音助手初体验': 'Smart speaker with sound waves, voice assistant device on a table, microphone icon, audio technology, voice recognition concept, no people',
  'AI与生活': 'Smart home devices connected in a network, smartphone, thermostat, security camera, lights, IoT concept, connected home technology, no people',

  // ========== 计算机基础 (computer) ==========
  '认识计算机硬件': 'Computer components arranged on a desk, CPU chip, motherboard, RAM stick, hard drive, graphics card, hardware parts, PC building components, no people',
  '文件管理小能手': 'Colorful folder icons organized in rows, file manager interface, organized folders with labels, digital file organization, clean desktop metaphor, no people',
  '搜索引擎大比拼': 'Search bar with magnifying glass, search results on a screen, web browser window, information retrieval concept, internet search theme, no people',
  '演示文稿制作': 'Presentation slides on a laptop screen, colorful slide designs with charts and graphs, PowerPoint-style presentation, slide deck with graphics, no people',

  // ========== 编程入门 (programming) ==========
  '我的第一个动画故事': 'Animation software on computer screen, timeline with frames, cartoon scenes in motion, digital animation creation, storytelling with frames, no people no animals',
  '迷宫小游戏': 'Top-down view of a maze puzzle with start and end points, classic labyrinth game, path finding puzzle, maze with green walls and yellow path, game level design, no people no animals',
  '英语单词记忆器': 'Vocabulary flashcard app on screen, word matching game, memory cards with letters and objects, language learning interface, educational software, no people',
  '电子相册制作': 'Photo gallery app interface with image thumbnails, digital photo album on screen, picture collection grid, photo organizing software, no visible faces no people',
  '数学图形绘制': 'Geometric shapes on screen, triangles circles squares polygons, coordinate system with graphs, math visualization software, geometry drawing program, no people',
  '打字练习小能手': 'Computer keyboard with fingers position guide, typing practice software on screen, keyboarding tutorial, touch typing practice, keys highlighted, no people',
  '猜数字大挑战': 'Number guessing game interface, digital display with question marks, calculator and number tiles, logic puzzle game, brain teaser theme, no people',
};

async function regenerateRisky(): Promise<void> {
  const tasks = db.prepare(
    'SELECT id, title, category FROM tasks ORDER BY id'
  ).all() as any[];

  const toFix = tasks.filter(t => FIX_PROMPTS[t.title]);
  console.log(`需要修复的任务数: ${toFix.length} / ${tasks.length}`);

  const updateStmt = db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toFix.length; i++) {
    const task = toFix[i];
    const prompt = `${FIX_PROMPTS[task.title]}, ${STYLE_SUFFIX}`;

    console.log(`[${i + 1}/${toFix.length}] 重生成: ${task.title} (id=${task.id}) [${task.category}]`);

    let result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `task_cover_${task.id}_v5`,
      negative_prompt: NEGATIVE_PROMPT,
    });

    if (!result.success) {
      console.log(`  首次失败: ${result.error}，3秒后重试...`);
      await new Promise(r => setTimeout(r, 3000));
      result = await generateImage({
        prompt,
        size: '1024x768',
        filename: `task_cover_${task.id}_v5`,
        negative_prompt: NEGATIVE_PROMPT,
      });
    }

    if (result.success && result.url) {
      updateStmt.run(result.url, task.id);
      success++;
      console.log(`  ✅ 成功`);
    } else {
      failed++;
      console.log(`  ❌ 失败: ${result.error}`);
    }

    if (i < toFix.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  console.log(`\n修复完成: 成功 ${success}, 失败 ${failed}`);
}

regenerateRisky().catch(console.error);
