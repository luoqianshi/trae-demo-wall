import db from '../config/database';
import { generateImage } from '../services/imageGenerator';

// ============================================================
// 超强负面提示词：彻底排除人物、动物、生物、怪兽等一切不相关元素
// ============================================================
const NEGATIVE_PROMPT = 'human, person, people, man, woman, girl, boy, child, kid, baby, student, teacher, face, hands, portrait, character, human figure, person silhouette, anime girl, anime boy, cartoon person, any person, any human, pokemon, monster, creature, animal, dragon, snake creature, cartoon character, anime character, game character, fantasy beast, weird creature, anthropomorphic, furry, pokemon style, digimon, yokai, reptile, lizard, serpent, snake animal, snake head, snake eyes, snake tongue, snake scales, living snake, snake body, cobra, python, viper, cat, dog, bird, fish, rabbit, bear, panda, fox, wolf, tiger, lion, elephant, giraffe, any animal, any living creature, any beast, any pet, any wildlife, low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, oversaturated, neon glow, excessive sparkles, too many particles, magical aura overload, too bright, glowing everything, rainbow everywhere, holographic overload, cyberpunk neon';

// ============================================================
// 风格后缀：无人物、无动物、纯场景/物品
// ============================================================
const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids and teens, educational and inspiring mood, no text, no watermarks, no humans, no people, no characters, no animals, no creatures, object-focused, scene-only, item still life';

// ============================================================
// 72个任务的精准英文 visual_prompt
// 全部纯英文、纯物品/场景描述，绝对不出现人物、动物、生物
// ============================================================
const TASK_PROMPTS: Record<string, string> = {
  // ========== 科学实验 (16个) ==========
  '会跳舞的葡萄干': 'Clear glass of sparkling soda water with raisins floating inside, tiny carbon dioxide bubbles clinging to the raisins, some raisins rising and some sinking, refreshing bubbly beverage close-up on a clean wooden table',
  '自制火山喷发': 'Clay volcano model on a metal tray, red bubbling foam erupting from the crater and overflowing down the sides, baking soda and vinegar reaction, messy colorful foam splash, kitchen table background',
  '彩虹密度塔': 'Tall clear glass with five distinct liquid layers stacked vertically, each layer a different vibrant color, sugar water density gradient experiment, on a white lab table',
  '植物喝水实验': 'Three white carnation flowers in three glasses of colored water, the flower petals slowly changing color, transpiration experiment, on a bright windowsill',
  '水果电池': 'Potato with zinc and copper nails inserted into it, connected with alligator clips to a small LED light bulb glowing softly, homemade battery science experiment on a wooden desk',
  '自制显微镜': 'Simple DIY microscope made from a drop of water on a plastic sheet over a paper frame, examining tiny objects, optics experiment on a clean desk',
  '非牛顿流体实验': 'Bowl of thick oobleck cornstarch and water mixture on a kitchen counter, a spoon pressing into the gooey substance creating ripples, white creamy goopy fluid, hands-free scene',
  '自制净水器': 'Clear plastic bottle cut in half, inverted and layered with filtration materials, dirty water pouring in, clean water dripping out, water purification experiment',
  '鸡蛋浮力实验': 'Two clear glasses side by side on a wooden table, one egg sinking in plain water, one egg floating in salt water, density and buoyancy demonstration',
  '水火箭': 'Plastic bottle water rocket with paper fins launching upward from a simple launch pad, water spraying downward as thrust, outdoor grassy background',
  '自制电动机': 'Simple DIY electric motor made from copper wire coil, AA battery, and neodymium magnets, the coil spinning, neatly arranged on a clean wooden desk',
  '法老之蛇': 'Black carbon foam rising from burning sugar and baking soda mixture in a glass dish, serpentine ash column formed by chemical reaction, long porous black substance growing upward from white powder on sand',
  '磁铁探秘': 'Bar magnet on a wooden table with iron filings scattered around showing magnetic field lines pattern, paper clips and nails being attracted to the magnet, compass pointing north, various metal and non-metal objects being tested',
  '光的折射与彩虹': 'Glass of water with a pencil appearing bent at the water line, a small mirror placed diagonally in water creating a rainbow spectrum on white paper, CD disc reflecting rainbow colors, prism splitting white light',
  '简单电路': 'Simple electric circuit on a wooden table, battery connected to wires and a small light bulb through a switch, the bulb glowing softly, two circuits showing series and parallel connections, hands-free scene',
  '认识人体器官': 'Human body anatomy educational chart, outline of human body with major organs labeled and color-coded, brain heart lungs liver stomach kidneys intestines, bright colorful educational illustration for children',

  // ========== 创意制作 (7个) ==========
  '纸杯传声筒': 'Two paper cups connected by a long string stretched tight between them, classic tin can telephone craft, simple sound wave experiment, on a wooden craft table',
  '风力小车': 'Small DIY wind-powered car made from a plastic bottle body, four bottle cap wheels, and a paper pinwheel on top, wind energy toy, on a wooden floor',
  '橡皮筋动力船': 'Homemade rubber band powered boat made from a foam board hull and a plastic paddle wheel, floating in a tub of water, simple mechanical energy craft',
  '太阳能烤箱': 'DIY solar cooker made from a cardboard box lined with aluminum foil, a plastic sheet cover, and a small bowl inside, solar energy experiment, sitting outdoors in sunlight',
  '乐高机械手臂': 'Lego technic robotic arm with a gripper claw, built from colorful lego bricks and gears, resting on a blue lego base plate, mechanical engineering build',
  '自制指南针': 'DIY compass made from a magnetized sewing needle floating on a small piece of foam in a bowl of water, the needle pointing north, a real compass next to it for comparison, craft table setup',
  '自制温度计': 'DIY thermometer made from a small glass bottle with colored water and a straw sealed with clay, the liquid column rising in hot water and falling in cold water, two bowls of water, science experiment on a table',

  // ========== 自然探索 (12个) ==========
  '树叶拓印画': 'Autumn leaves of various shapes and colors arranged on white paper, crayon leaf rubbing art, leaf prints in green orange and brown, nature craft on a wooden table with crayons',
  '昆虫观察日记': 'Magnifying glass examining a small ladybug on a green leaf, nature observation scene, butterfly net and a notebook with pencil on a grassy ground, outdoor exploration setup',
  '种子发芽观察': 'Bean seeds sprouting in a clear glass jar with wet paper towel, roots growing downward and shoots growing upward, seed germination experiment, on a bright windowsill',
  '岩石矿物收集': 'Collection of various rocks and minerals displayed in a wooden box with compartments, different colors and textures, geology collection with magnifying glass',
  '鸟窝搭建观察': 'Bird nest made from twigs and grass in the branches of a tree, small woven nest with eggs inside, forest scene with soft sunlight filtering through leaves',
  '蝴蝶生命周期': 'Four stages of butterfly life cycle displayed in a row, egg on leaf, green caterpillar, chrysalis, and adult monarch butterfly with orange wings, metamorphosis illustration',
  '水循环实验': 'DIY water cycle in a sealed glass jar, water evaporating and condensing on the lid then dripping back down, miniature water cycle experiment, on a windowsill',
  '土壤分层实验': 'Clear glass jar filled with soil and water, settled into distinct layers from bottom to top, gravel sand silt clay and water, soil composition experiment, on a wooden table',
  '花朵解剖观察': 'Flower dissection on a white paper plate, cross-section of a lily showing petals sepals stamens and pistil, magnifying glass and tweezers nearby, botany lesson',
  '天气播报小专家': 'Weather observation station setup, thermometer on a windowsill, notebook with weather symbols and temperature records, blue sky with different cloud types labeled, bright outdoor educational scene',
  '认识方向与地图': 'Compass on a wooden table pointing north, a simple hand-drawn map with roads and landmarks, sun position showing east direction, compass rose with cardinal directions, bright outdoor scene',
  '自制雨量器': 'DIY rain gauge made from a clear plastic bottle with measurement markings, sitting outside in the rain collecting water drops, weather measurement instrument, rainy day scene',

  // ========== 编程技术 (10个) ==========
  'Scratch小猫动画': 'Computer screen showing Scratch programming interface with colorful code blocks, block-based coding for kids, green flag and stop sign buttons, visual programming',
  '简易计算器编程': 'Simple calculator app displayed on a computer screen, with number buttons and a display showing numbers, beginner coding project, code visible on the side',
  '打字练习小能手': 'Computer keyboard with colored key zones showing different finger assignments, home row keys F and J highlighted, typing practice screen with falling letters game, clean modern tech workspace',
  '迷宫游戏编程': 'Computer screen showing a top-down maze game with corridors, puzzle game with walls and a goal flag, game development project, code editor in background',
  '数字绘画入门': 'Graphics tablet and stylus pen on a desk, computer screen showing digital painting software with colorful artwork, drawing program interface with brush tools and color palette',
  'PPT动画制作': 'Computer screen showing presentation software with slide transitions and animations, colorful slides with text and images, PowerPoint-style animation timeline',
  '小小网页设计师': 'Web browser displaying a colorful kid-friendly website, HTML code visible in another window, web design project with bright buttons and fun graphics, responsive webpage layout',
  '机器人编程入门': 'Small educational robot with colorful lights and wheels, programming blocks on a tablet screen connected to the robot, STEM robotics kit for kids',
  '数据统计与图表': 'Computer screen showing colorful charts and graphs, bar chart pie chart line graph, data visualization project, spreadsheet with numbers and chart tools',
  '密码学小侦探': 'Encrypted message written in symbols and numbers, decoder wheel cipher tool, magnifying glass and detective notebook, cryptography puzzle, secret code investigation scene',

  // ========== 人文社科 (13个) ==========
  '我的家族故事': 'Old family photo album open on a wooden table, with faded photographs, handwritten letters, and a vintage pocket watch, genealogy and family history research, warm sepia tones',
  '古诗词里的四季': 'Traditional Chinese scroll painting showing four seasons, spring blossoms summer lotus autumn leaves winter snow, classical Chinese poetry illustration, ink wash painting style',
  '家乡非遗小调查': 'Traditional Chinese handicraft display, paper cutting shadow puppets clay figurines and embroidered silk, intangible cultural heritage collection, folk art exhibition',
  '我家老物件博物馆': 'Vintage household items arranged on wooden shelves, old radio gramophone abacus porcelain vase, antique collection, nostalgic museum display, warm lighting',
  '创作一本绘本': 'Open children picture book with colorful illustrations, watercolor paints and paintbrushes on a wooden desk, blank pages and storyboard sketches, book creation process',
  '中国传统节日研究': 'Traditional Chinese festival decorations arranged on a table, red lanterns dumplings mooncakes spring couplets and paper cuttings, festive red and gold colors',
  '中国汉字演变': 'Chinese character evolution displayed from ancient to modern, oracle bone script bronze script seal script clerical script regular script, calligraphy brushes and ink stone',
  '中国茶文化': 'Traditional Chinese tea ceremony setup, clay teapot small teacups tea leaves in a bamboo scoop, peaceful tea arrangement, warm earth tones',
  '丝绸之路地图': 'Ancient silk road map scroll laid out on a wooden table, with camel caravans desert oases and ancient cities marked along the trade route, historical map',
  '二十四节气研究': 'Chinese 24 solar terms wheel chart showing all seasons and solar terms, with corresponding natural phenomena and farming activities, traditional calendar',
  '古代四大发明研究': 'Four great inventions of ancient China displayed together, paper making compass woodblock printing and gunpowder fireworks, historical inventions collection',
  '认识中国地图': 'Colorful China map on a wooden table, provinces colored in different colors, the rooster-like shape of China, blue Yangtze River and Yellow River marked, Beijing marked with a red star, bright educational illustration',

  // ========== 生活实践 (14个) ==========
  '一周零花钱管理': 'Piggy bank with coins and banknotes around it, a notebook with budget tracking and expense categories written down, calculator and coin sorter, money management for kids',
  '垃圾分类小能手': 'Four color-coded trash bins for waste sorting, blue for recyclable green for kitchen waste red for hazardous gray for other waste, each with clear labels and icons',
  '包饺子': 'Flour dusted wooden table with dumpling wrappers, bowls of filling, and a plate of finished dumplings arranged neatly, dumpling making ingredients and tools, cooking preparation scene',
  '家庭逃生路线': 'Floor plan of a house drawn on paper with red arrows showing emergency exit routes, smoke detector and fire extinguisher icons marked, home fire safety plan',
  '阳台小菜园': 'Balcony garden with various potted herbs and vegetables, tomato plant basil mint and lettuce in colorful pots, small watering can and gardening tools, urban gardening sunny balcony',
  '营养餐盘': 'Balanced meal on a white plate divided into sections, colorful vegetables whole grain rice lean protein and fruit, healthy eating nutrition guide, food pyramid diagram nearby',
  '心肺复苏(CPR)学习': 'CPR training manikin dummy on the floor, first aid kit open with gloves and mask, instruction poster showing chest compression steps, emergency medical training, hands-free scene',
  '节约用水行动': 'Faucet with a single drop of water falling into a measuring cup, water conservation poster showing tips, eco-friendly bathroom scene, water saving awareness',
  '红绿灯与交通规则': 'Traffic light with red yellow green lights on a pole, crosswalk zebra stripes on the road, various traffic signs like stop sign and pedestrian crossing sign, bright and clear illustration',
  '地震逃生我知道': 'Earthquake safety education scene, a sturdy table with safe zone underneath, emergency backpack with flashlight water and first aid kit, floor plan with red escape route arrows, safety poster',
  '食品安全我最懂': 'Food packaging inspection scene, several snack packages with ingredient labels visible, magnifying glass examining food labels, nutrition facts table close-up, healthy food vs junk food chart',
  '用电安全我知道': 'Electrical safety education scene, electrical outlet with safety cover, household appliances with safety labels, diagram showing conductor vs insulator materials, danger warning signs',
  '防溺水安全教育': 'Water safety education scene, a swimming pool with safety ring and life jacket, warning signs near water body, diagram showing water rescue methods, bright summer day with blue water',
  '认识人民币': 'Chinese RMB banknotes of different denominations arranged neatly on a wooden table, coins, a piggy bank, calculator, notebook with price calculations, bright educational illustration',

  // ========== 第二批新增 (36个) ==========
  '酸碱指示剂（红甘蓝实验）': 'Purple cabbage juice in several clear glasses showing different colors, red in vinegar glass, blue in baking soda glass, purple in plain water, various test liquids, pH test experiment on a wooden table',
  '表面张力与肥皂泡': 'Surface tension science experiment, bowl of water with pepper flakes scattering away from a soapy finger, shiny soap bubbles floating, a coin covered with water droplets, bubble wand on a table',
  '杠杆与简单机械': 'Simple lever experiment, a ruler balanced on an eraser as a fulcrum, coins stacked on one end, diagram showing force arm and resistance arm, scissors and bottle opener as examples',
  '摩擦力大比拼': 'Friction experiment on a tilted wooden board, a small block sliding down different surfaces, sandpaper rough surface, smooth plastic surface, towel fabric, angle ruler measuring slope',
  '声音的传播': 'Sound wave experiment, two paper cups connected by a long string as tin can telephone, tuning fork vibrating in water creating ripples, ear pressed against a wooden table, sound wave diagram',
  '大气压的威力': 'Atmospheric pressure experiment, an upside-down glass of water covered by a card with water not spilling, egg being sucked into a bottle, two suction cups stuck together, physics experiment',
  '水的三态变化': 'States of water experiment, ice cubes melting in a bowl, pot of boiling water with steam rising, glass of hot water with condensation droplets, water cycle diagram with solid liquid gas',
  '燃烧的条件': 'Combustion experiment, a candle burning under a clear glass jar being deprived of oxygen, candle on a metal plate, fire triangle diagram, fire safety poster, clean educational illustration',
  '食物链与生态网': 'Food chain and food web diagram, arrows showing energy flow from grass to rabbit to fox, producer consumer decomposer icons, forest ecosystem illustration with plants animals and fungi',
  '树叶分类图鉴': 'Leaf classification collection, various leaves of different shapes arranged on white paper, ginkgo fan-shaped leaf, maple palm-shaped leaf, pine needle leaf, magnifying glass, nature craft',
  '自制堆肥': 'DIY compost bin made from a plastic container, layered with brown dry leaves green vegetable scraps and soil, garden trowel, thermometer in compost, rich dark compost soil, outdoor gardening',
  '池塘微生物观察': 'Microscope on a desk with a drop of pond water on a glass slide, magnified view showing tiny microorganisms, notebook with sketches of microbes, pond water sample jar, biology experiment',
  '风的测量': 'DIY wind vane and anemometer made from paper cups and straws, wind direction arrow on a pencil stand, paper cup anemometer spinning, weather observation tools, blue sky with clouds',
  '化石制作': 'DIY fossil making, plaster cast with leaf or shell imprint, paint and brushes for coloring, real fossil examples nearby, rocks and excavation tools, craft scene on a table',
  '火灾逃生我知道': 'Fire safety education scene, house floor plan with red escape route arrows, smoke detector, fire extinguisher, wet towel, emergency exit sign, fire safety poster, no people',
  '网络安全我知道': 'Internet safety education poster, computer screen with shield and lock icon, password strength meter, do not share warning signs for personal information, safe browsing illustration',
  '认识细菌与正确洗手': 'Hand washing experiment, three sealed bags with bread slices showing different mold growth, seven-step hand washing method diagram, soap and hand sanitizer, sink with running water',
  '学做一道简单的菜': 'Simple cooking scene, kitchen counter with ingredients for scrambled eggs with tomatoes, cutting board with vegetables, frying pan on stove, cooking utensils, recipe card, no people',
  '校园防欺凌': 'Anti-bullying education poster, stop sign with hand symbol, colorful friendly school illustration, hearts and helping hands, kindness and respect messages, no people',
  '认识与表达情绪': 'Emotional awareness chart, emotion thermometer from 0 to 10 with different color zones, six basic emotion faces as simple icons, calm-down toolbox with coping strategy cards, no people',
  '正确刷牙护牙齿': 'Tooth brushing education, egg in glass of vinegar showing shell dissolving, tooth structure diagram, toothbrush at 45-degree angle, brushing chart with checkmarks, dental hygiene',
  '自行车安全骑行': 'Bicycle safety education scene, bicycle with helmet and reflective gear, hand signals diagram for turning and stopping, bicycle parts labeled, safety checklist poster, traffic signs',
  '认识世界地图': 'Colorful world map on a table, seven continents colored in different colors, four oceans labeled in blue, China highlighted, compass rose, world landmarks icons, geography illustration',
  '中国建筑之美': 'Chinese traditional architecture, courtyard house with central garden, white-walled Jiangnan water town, round Fujian tulou earth building, cave dwellings, architecture styles',
  '京剧脸谱艺术': 'Beijing opera facial makeup art, blank masks painted with traditional Chinese opera face patterns in red black white blue, paintbrushes and paint pots, cultural craft scene',
  '中国画入门': 'Chinese ink painting setup, brush pen and ink stick on ink stone, rice paper with simple bamboo painting, Chinese painting colors and palette, scroll painting style, traditional art supplies',
  '认识中国朝代': 'Chinese dynasty timeline on a long scroll, each dynasty marked with different color and representative icon, Qin terracotta warrior, Tang poem, Song compass, Ming ship, historical illustration',
  '纸桥承重大挑战': 'Paper bridge engineering challenge, several paper bridges of different shapes spanning between two books, flat paper corrugated paper tubes and arch-shaped paper, coins stacked as weights',
  '自制万花筒': 'DIY kaleidoscope made from cardboard tube, mirror strips inside forming triangular prism, colorful beads and confetti, beautiful symmetrical patterns, craft supplies on a table',
  '自制潜望镜': 'DIY periscope made from long cardboard box with two mirrors at 45-degree angles, light ray diagram showing reflection path, scissors and tape, optics experiment on craft table',
  '简易降落伞': 'DIY parachute made from plastic bag with strings and a small toy figure, floating gently downward, air resistance diagram, craft supplies, outdoor scene with blue sky',
  '自制弹簧秤': 'DIY spring scale made from ruler with rubber bands, paper cup basket attached with paper clips, coins inside as weights, measurement markings on ruler, physics experiment',
  '英文单词记忆器': 'Scratch programming interface on computer screen, vocabulary quiz game showing English word with four Chinese answer choices, colorful code blocks, score counter, green flag',
  '电子相册制作': 'Digital photo album on computer screen, colorful photos in slideshow format, navigation buttons for next and previous, photo album cover page with title, clean modern tech',
  '天气查询小工具': 'Weather query tool on computer screen, search box with city name input, weather result showing temperature and weather icon, clothing suggestion, clean modern tech interface',
  '数学图形绘制': 'Scratch programming interface showing geometric shape drawing, colorful square triangle circle and star drawn on stage, Scratch code blocks with repeat loops and turn degrees',
};

function buildPrompt(task: any): string {
  const visualPrompt = TASK_PROMPTS[task.title] || task.visual_prompt || `Educational illustration of ${task.title}, no humans`;
  return `${visualPrompt}, ${STYLE_SUFFIX}`;
}

async function regenerateAll(): Promise<void> {
  const tasks = db.prepare(
    'SELECT id, title, category FROM tasks ORDER BY id ASC'
  ).all() as any[];

  console.log(`总任务数: ${tasks.length}`);

  const updateStmt = db.prepare('UPDATE tasks SET cover_image = ? WHERE id = ?');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const prompt = buildPrompt(task);

    console.log(`[${i + 1}/${tasks.length}] 生成: ${task.title} (id=${task.id}) [${task.category}]`);

    let result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `task_cover_${task.id}_v4`,
      negative_prompt: NEGATIVE_PROMPT,
    });

    if (!result.success) {
      console.log(`  首次失败: ${result.error}，3秒后重试...`);
      await new Promise(r => setTimeout(r, 3000));
      result = await generateImage({
        prompt,
        size: '1024x768',
        filename: `task_cover_${task.id}_v4`,
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

    if (i < tasks.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  console.log(`\n全部生成完成: 成功 ${success}, 失败 ${failed}`);
}

regenerateAll().catch(console.error);