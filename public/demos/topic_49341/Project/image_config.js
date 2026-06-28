// 图片配置系统
// 优先级：本地图片文件 > 在线URL > SVG占位图
// 如果 ./images/ 目录下有对应文件，自动使用；否则使用精美的SVG占位图

window.USE_LOCAL_IMAGES = true;

(function() {
  const base = './images/';
  
  // ========== 生成精美SVG占位图 ==========
  function createSceneSVG(type, sceneName, index) {
    const palettes = {
      home: {
        night: ['#1a1a2e', '#16213e', '#0f3460'],
        warm:  ['#2d2440', '#3d2c4a', '#4a3552'],
        sad:   ['#1e1e2f', '#252540', '#2a2a48']
      },
      school: {
        morning: ['#1a2a3a', '#2a3a4a', '#3a4a5a'],
        golden:  ['#3d3020', '#4a3c28', '#584830'],
        blue:    ['#1e2a38', '#283848', '#324858']
      },
      people: {
        sunset: ['#2a1a2e', '#3d2040', '#4a2850'],
        orange: ['#4a2818', '#5a3020', '#6a3828'],
        purple: ['#2a1e3a', '#3a284a', '#4a3058']
      }
    };
    
    const patterns = {
      stars: (c) => {
        let stars = '';
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * 800;
          const y = Math.random() * 600;
          const r = Math.random() * 1.5 + 0.5;
          const o = Math.random() * 0.5 + 0.3;
          stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="${o.toFixed(2)}"/>`;
        }
        return stars;
      },
      window: (c) => `
        <rect x="520" y="80" width="200" height="280" fill="${c[2]}" opacity="0.5"/>
        <line x1="620" y1="80" x2="620" y2="360" stroke="${c[1]}" stroke-width="3"/>
        <line x1="520" y1="220" x2="720" y2="220" stroke="${c[1]}" stroke-width="3"/>
        <circle cx="620" cy="200" r="80" fill="#ffe4b5" opacity="0.15"/>
      `,
      lamp: (c) => `
        <ellipse cx="200" cy="450" rx="120" ry="30" fill="#ffd700" opacity="0.15"/>
        <rect x="185" y="320" width="30" height="130" fill="${c[2]}" opacity="0.6"/>
        <ellipse cx="200" cy="320" rx="40" ry="15" fill="#ffd700" opacity="0.3"/>
      `,
      silhouette: (c) => `
        <path d="M100,900 Q120,700 150,600 L200,550 Q250,520 300,550 L350,600 Q380,700 400,900 Z" fill="${c[2]}" opacity="0.4"/>
      `,
      moon: (c) => `
        <circle cx="650" cy="150" r="50" fill="#fffacd" opacity="0.3"/>
        <circle cx="635" cy="140" r="45" fill="${c[0]}" opacity="0.8"/>
      `,
      chalkboard: (c) => `
        <rect x="100" y="80" width="600" height="250" fill="#2a4a3a" opacity="0.5"/>
        <rect x="100" y="80" width="600" height="250" fill="none" stroke="${c[2]}" stroke-width="6"/>
        <text x="400" y="180" text-anchor="middle" fill="#a8d5ba" font-size="48" font-family="serif" opacity="0.2">数学</text>
        <text x="400" y="250" text-anchor="middle" fill="#a8d5ba" font-size="28" font-family="serif" opacity="0.15">x + y = ?</text>
      `,
      desks: (c) => {
        let desks = '';
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 4; col++) {
            const x = 80 + col * 170;
            const y = 400 + row * 150;
            desks += `<rect x="${x}" y="${y}" width="120" height="80" fill="${c[2]}" opacity="${0.25 + row * 0.1}"/>`;
          }
        }
        return desks;
      },
      sunlight: (c) => `
        <polygon points="0,0 250,0 600,1200 0,1200" fill="#ffe4b5" opacity="0.05"/>
        <polygon points="150,0 350,0 700,1200 150,1200" fill="#ffe4b5" opacity="0.03"/>
      `,
      bleachers: (c) => {
        let steps = '';
        for (let i = 0; i < 8; i++) {
          const y = 500 + i * 50;
          const w = 600 - i * 40;
          const x = (800 - w) / 2;
          steps += `<rect x="${x}" y="${y}" width="${w}" height="10" fill="${c[2]}" opacity="${0.3 + i * 0.05}"/>`;
        }
        return steps;
      },
      sunset: (c) => `
        <circle cx="400" cy="500" r="120" fill="#ff6b35" opacity="0.4"/>
        <circle cx="400" cy="500" r="80" fill="#ff8c42" opacity="0.5"/>
      `,
      clouds: (c) => `
        <ellipse cx="200" cy="150" rx="80" ry="25" fill="${c[2]}" opacity="0.3"/>
        <ellipse cx="550" cy="100" rx="100" ry="30" fill="${c[2]}" opacity="0.25"/>
        <ellipse cx="680" cy="180" rx="60" ry="20" fill="${c[2]}" opacity="0.2"/>
      `,
      phone: (c) => `
        <rect x="340" y="350" width="120" height="220" rx="15" fill="${c[2]}" opacity="0.5"/>
        <rect x="350" y="370" width="100" height="180" rx="5" fill="#5a9fd4" opacity="0.2"/>
        <rect x="360" y="390" width="80" height="15" rx="3" fill="white" opacity="0.2"/>
        <rect x="360" y="415" width="60" height="10" rx="2" fill="white" opacity="0.15"/>
      `,
      path: (c) => `
        <path d="M400,1200 L400,700 Q400,500 500,400 Q600,300 600,150" stroke="${c[2]}" stroke-width="30" fill="none" opacity="0.3"/>
      `,
      seed: (c) => `
        <ellipse cx="400" cy="750" rx="60" ry="20" fill="${c[2]}" opacity="0.3"/>
        <path d="M400,750 Q400,700 385,680 Q370,660 380,640 Q390,620 400,600" stroke="#7cb342" stroke-width="4" fill="none" opacity="0.5"/>
        <ellipse cx="395" cy="600" rx="15" ry="25" fill="#8bc34a" opacity="0.4"/>
      `
    };
    
    let palette = palettes.home.night;
    let bgPatterns = [];
    
    if (type === 'home') {
      if (sceneName.includes('poem') && index === 0) {
        palette = palettes.home.warm;
        bgPatterns = ['lamp', 'stars', 'window'];
      } else if (sceneName.includes('poem') && index === 1) {
        palette = palettes.home.night;
        bgPatterns = ['stars', 'silhouette'];
      } else if (sceneName.includes('poem') && index === 2) {
        palette = palettes.home.sad;
        bgPatterns = ['stars', 'moon', 'path'];
      } else if (sceneName.includes('narrative1') || sceneName.includes('narrative2')) {
        palette = palettes.home.night;
        bgPatterns = ['stars', 'lamp', 'window'];
      } else if (sceneName.includes('positive')) {
        palette = palettes.home.warm;
        bgPatterns = ['stars', 'lamp'];
      } else if (sceneName.includes('negative')) {
        palette = palettes.home.sad;
        bgPatterns = ['stars', 'moon'];
      } else if (sceneName.includes('choice')) {
        palette = palettes.home.night;
        bgPatterns = ['stars', 'window'];
      } else if (sceneName.includes('reflection') || sceneName.includes('end')) {
        palette = palettes.home.warm;
        bgPatterns = ['stars', 'moon', 'window'];
      } else {
        palette = palettes.home.night;
        bgPatterns = ['stars', 'lamp'];
      }
    } else if (type === 'school') {
      if (sceneName.includes('poem') && index === 0) {
        palette = palettes.school.morning;
        bgPatterns = ['chalkboard', 'sunlight'];
      } else if (sceneName.includes('poem') && index === 1) {
        palette = palettes.school.blue;
        bgPatterns = ['desks', 'chalkboard'];
      } else if (sceneName.includes('poem') && index === 2) {
        palette = palettes.school.golden;
        bgPatterns = ['sunlight', 'desks'];
      } else if (sceneName.includes('narrative1')) {
        palette = palettes.school.morning;
        bgPatterns = ['chalkboard', 'sunlight', 'desks'];
      } else if (sceneName.includes('narrative2')) {
        palette = palettes.school.blue;
        bgPatterns = ['desks', 'chalkboard'];
      } else if (sceneName.includes('positive')) {
        palette = palettes.school.golden;
        bgPatterns = ['sunlight', 'desks'];
      } else if (sceneName.includes('negative')) {
        palette = palettes.school.blue;
        bgPatterns = ['desks'];
      } else if (sceneName.includes('choice')) {
        palette = palettes.school.morning;
        bgPatterns = ['chalkboard', 'desks'];
      } else if (sceneName.includes('reflection') || sceneName.includes('end')) {
        palette = palettes.school.golden;
        bgPatterns = ['sunlight', 'desks'];
      } else {
        palette = palettes.school.morning;
        bgPatterns = ['chalkboard', 'sunlight'];
      }
    } else if (type === 'people') {
      if (sceneName.includes('poem') && index === 0) {
        palette = palettes.people.orange;
        bgPatterns = ['sunset', 'bleachers'];
      } else if (sceneName.includes('poem') && index === 1) {
        palette = palettes.people.sunset;
        bgPatterns = ['sunset', 'phone'];
      } else if (sceneName.includes('poem') && index === 2) {
        palette = palettes.people.purple;
        bgPatterns = ['stars', 'moon', 'phone'];
      } else if (sceneName.includes('narrative1') || sceneName.includes('narrative2')) {
        palette = palettes.people.orange;
        bgPatterns = ['sunset', 'bleachers'];
      } else if (sceneName.includes('positive')) {
        palette = palettes.people.sunset;
        bgPatterns = ['sunset', 'seed'];
      } else if (sceneName.includes('negative')) {
        palette = palettes.people.purple;
        bgPatterns = ['stars', 'bleachers'];
      } else if (sceneName.includes('choice')) {
        palette = palettes.people.orange;
        bgPatterns = ['sunset', 'phone'];
      } else if (sceneName.includes('reflection') || sceneName.includes('end') || sceneName.includes('ending')) {
        palette = palettes.people.sunset;
        bgPatterns = ['sunset', 'seed', 'clouds'];
      } else {
        palette = palettes.people.orange;
        bgPatterns = ['sunset', 'bleachers'];
      }
    }
    
    const [c1, c2, c3] = palette;
    let patternSVG = '';
    bgPatterns.forEach(p => {
      if (patterns[p]) {
        patternSVG += patterns[p](palette);
      }
    });
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="50%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c3}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="1200" fill="url(#bg)"/>
      ${patternSVG}
      <rect width="800" height="1200" fill="url(#glow)"/>
    </svg>`;
    
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }
  
  // ========== 构建图片映射表 ==========
  const imageMap = {};
  
  // 第一幕：家
  const homeScenes = {
    poem: [0, 1, 2],
    narrative1: [0, 1, 2, 3],
    narrative2: [0, 1, 2, 3],
    choice1: [0],
    consequence1_pos: [0, 1, 2, 3],
    after1_pos: [0, 1, 2, 3],
    consequence1_neg: [0, 1, 2, 3],
    after1_neg: [0, 1, 2, 3],
    choice2: [0],
    consequence2_pos: [0, 1, 2, 3],
    end_pos: [0, 1, 2, 3],
    consequence2_neg: [0, 1, 2, 3],
    end_neg: [0, 1, 2, 3],
    reflection: [0]
  };
  
  Object.entries(homeScenes).forEach(([scene, indices]) => {
    indices.forEach(i => {
      // 构造本地路径
      const localPath = base + 'home/' + scene + (indices.length > 1 ? '_' + (i+1) : '') + '.jpg';
      // 构造占位SVG
      const placeholder = createSceneSVG('home', scene, i);
      
      // 先存本地路径
      imageMap['__home_' + scene + '_' + i] = { localPath, placeholder };
    });
  });
  
  // 第二幕：校
  const schoolScenes = {
    poem: [0, 1, 2],
    narrative1: [0, 1, 2, 3, 4],
    narrative2: [0, 1, 2, 3, 4],
    choice1: [0],
    consequence1_pos: [0, 1, 2, 3],
    after1_pos: [0, 1, 2, 3],
    consequence1_neg: [0, 1, 2, 3],
    after1_neg: [0, 1, 2, 3],
    choice2: [0],
    consequence2_pos: [0, 1, 2, 3],
    after2_pos: [0, 1, 2, 3],
    consequence2_neg: [0, 1, 2, 3],
    after2_neg: [0, 1, 2, 3],
    reflection: [0]
  };
  
  Object.entries(schoolScenes).forEach(([scene, indices]) => {
    indices.forEach(i => {
      const localPath = base + 'school/' + scene + (indices.length > 1 ? '_' + (i+1) : '') + '.jpg';
      const placeholder = createSceneSVG('school', scene, i);
      imageMap['__school_' + scene + '_' + i] = { localPath, placeholder };
    });
  });
  
  // 第三幕：人
  const peopleScenes = {
    poem: [0, 1, 2],
    narrative1: [0, 1, 2, 3, 4],
    narrative2: [0, 1, 2, 3, 4],
    choice1: [0],
    consequence1_pos: [0, 1, 2, 3],
    after1_pos: [0, 1, 2, 3],
    consequence1_neg: [0, 1, 2, 3],
    after1_neg: [0, 1, 2, 3],
    choice2: [0],
    consequence2_pos: [0, 1, 2, 3],
    end_pos: [0, 1, 2, 3],
    consequence2_neg: [0, 1, 2, 3],
    end_neg: [0, 1, 2, 3],
    ending: [0]
  };
  
  Object.entries(peopleScenes).forEach(([scene, indices]) => {
    indices.forEach(i => {
      const localPath = base + 'people/' + scene + (indices.length > 1 ? '_' + (i+1) : '') + '.jpg';
      const placeholder = createSceneSVG('people', scene, i);
      imageMap['__people_' + scene + '_' + i] = { localPath, placeholder };
    });
  });
  
  // ========== prompt 到内部key的映射 ==========
  const promptToKey = {};
  
  // 家 - poem
  const homePoemPrompts = [
    'anime style desk lamp closeup, warm golden light, pencil shadow on paper, late night study, cozy melancholic atmosphere, detailed anime still life, soft focus',
    'anime style bedroom door, shadow of mother under door crack, tense atmosphere, dim warm light, detailed anime interior scene, dramatic lighting',
    'anime style foggy crossroads, single figure silhouette, distant faint light, mysterious hopeful atmosphere, detailed anime background, soft dreamy style'
  ];
  homePoemPrompts.forEach((p, i) => { promptToKey[p] = '__home_poem_' + i; });
  
  // 家 - narrative1
  const homeN1Prompts = [
    'anime style bedroom at night, wide shot, desk lamp warm glow, window with starry sky, cozy melancholic atmosphere, detailed anime background art, soft lighting',
    'anime style desk closeup, math workbook open, pencil hovering, desk lamp warm light, late night study, detailed anime still life',
    'anime style closeup of eyes staring at paper, tired expression, reflection of math equations, warm lamp light, detailed anime character art',
    'anime style pencil tip on blank paper, shadow stretching, eraser crumbs nearby, warm desk lamp, detailed anime closeup'
  ];
  homeN1Prompts.forEach((p, i) => { promptToKey[p] = '__home_narrative1_' + i; });
  
  // 家 - narrative2
  const homeN2Prompts = [
    'anime style bedroom window, night sky with stars, curtain slightly moving, warm indoor light, detailed anime background',
    'anime style bedroom wall, shadow of TV flickering, distant muffled sound, warm dim light, detailed anime interior',
    'anime style phone face down on desk corner, dark screen, lamp glow, shadow patterns, late night study scene, detailed anime interior',
    'anime style hand reaching toward phone then pulling back, indecisive, desk lamp warm light, detailed anime closeup'
  ];
  homeN2Prompts.forEach((p, i) => { promptToKey[p] = '__home_narrative2_' + i; });
  
  // 家 - choice1
  promptToKey['anime style bedroom door view, door slightly ajar, warm hallway light seeping in, shadow of mother figure outside, tense atmosphere, detailed anime scene, dramatic lighting'] = '__home_choice1_0';
  
  // 家 - consequence1_pos
  const homeC1PosPrompts = [
    'anime style hand reaching for door handle, trembling slightly, warm hallway light under door, detailed anime closeup',
    'anime style bedroom door opening, mother standing in hallway, warm light behind her, surprised expression, detailed anime character art',
    'anime style teenage girl looking down, tears forming in eyes, vulnerable expression, warm lamp light, detailed anime character art',
    'anime style mother and daughter talking by bedside, soft warm lighting, gentle expression, emotional moment, detailed anime character art, intimate scene'
  ];
  homeC1PosPrompts.forEach((p, i) => { promptToKey[p] = '__home_consequence1_pos_' + i; });
  
  // 家 - after1_pos
  const homeA1PosPrompts = [
    'anime style mother sitting on bed, hand on daughter shoulder, soft expression, warm bedroom light, detailed anime character art',
    'anime style closeup of mother hand patting daughters back, gentle motion, warm light, detailed anime closeup',
    'anime style two silhouettes by window, night scene, warm indoor light, peaceful atmosphere, detailed anime background',
    'anime style girl smiling through tears, relieved expression, warm lamp glow, detailed anime character art'
  ];
  homeA1PosPrompts.forEach((p, i) => { promptToKey[p] = '__home_after1_pos_' + i; });
  
  // 家 - consequence1_neg
  const homeC1NegPrompts = [
    'anime style hand quickly turning off lamp switch, shadow moving fast, dim bedroom, detailed anime closeup',
    'anime style person hiding under blanket, only eyes visible, dark bedroom, moonlight through curtains, detailed anime scene',
    'anime style shadow of feet under door crack, standing still, tense atmosphere, dim warm light, detailed anime interior',
    'anime style dark bedroom, person staring at ceiling, shadow of door frame, lonely atmosphere, night scene, detailed anime illustration, melancholic mood'
  ];
  homeC1NegPrompts.forEach((p, i) => { promptToKey[p] = '__home_consequence1_neg_' + i; });
  
  // 家 - after1_neg
  const homeA1NegPrompts = [
    'anime style alarm clock closeup, ticking hands, red digits glowing, dark bedroom, detailed anime closeup',
    'anime style person turning in bed, face buried in pillow, messy hair, dim moonlight, detailed anime scene',
    'anime style tear drop on pillowcase, dark room, faint moonlight, emotional detail, detailed anime closeup',
    'anime style girl silhouette by window, lonely pose, night scene, starlight, melancholic atmosphere, detailed anime illustration'
  ];
  homeA1NegPrompts.forEach((p, i) => { promptToKey[p] = '__home_after1_neg_' + i; });
  
  // 家 - choice2
  promptToKey['anime style bedroom at night, girl lying in bed staring at ceiling, moonlight through curtains, peaceful yet troubled atmosphere, detailed anime background, soft blue lighting'] = '__home_choice2_0';
  
  // 家 - consequence2_pos
  const homeC2PosPrompts = [
    'anime style hand writing on paper, pencil moving, math problem being copied, warm desk lamp, detailed anime closeup',
    'anime style notebook page with handwritten math problems, neat handwriting, desk lamp light, detailed anime closeup',
    'anime style night window view, soft wind blowing curtains, summer night, gentle moonlight, hopeful atmosphere, detailed anime scene, serene mood',
    'anime style girl closing eyes with small smile, peaceful expression, moonlight on face, detailed anime character art'
  ];
  homeC2PosPrompts.forEach((p, i) => { promptToKey[p] = '__home_consequence2_pos_' + i; });
  
  // 家 - end_pos
  const homeEPosPrompts = [
    'anime style curtain gently blowing in wind, summer night, firefly outside window, detailed anime scene',
    'anime style closeup of desk with open book, warm lamp turned off, moonlight, peaceful atmosphere, detailed anime still life',
    'anime style girl sleeping peacefully, small smile, moonbeam on face, detailed anime character art',
    'anime style sunrise through window, soft golden light, bedroom awakening, hopeful atmosphere, detailed anime background'
  ];
  homeEPosPrompts.forEach((p, i) => { promptToKey[p] = '__home_end_pos_' + i; });
  
  // 家 - consequence2_neg
  const homeC2NegPrompts = [
    'anime style hand shoving workbook into school bag, messy desk, dark bedroom, detailed anime closeup',
    'anime style school bag on floor, half-open, workbook peeking out, dim room, detailed anime scene',
    'anime style person lying in bed, eyes closed, troubled expression, moonlight, detailed anime character art',
    'anime style nightmare scene, floating math equations, worried expression, dark bedroom, anxiety dream, detailed anime illustration, tense atmosphere'
  ];
  homeC2NegPrompts.forEach((p, i) => { promptToKey[p] = '__home_consequence2_neg_' + i; });
  
  // 家 - end_neg
  const homeENegPrompts = [
    'anime style clock showing late hour, red digits, dark room, detailed anime closeup',
    'anime style girl tossing and turning in bed, messy sheets, dim moonlight, detailed anime scene',
    'anime style dream sequence, floating numbers and equations, dark background, anxious feeling, detailed anime illustration',
    'anime style shadow of disappointed mother, dark hallway, blurred figure, melancholic mood, detailed anime scene'
  ];
  homeENegPrompts.forEach((p, i) => { promptToKey[p] = '__home_end_neg_' + i; });
  
  // 家 - reflection（和诗歌第三张共用同一张图）
  promptToKey['anime style foggy crossroads, single figure silhouette, distant faint light, mysterious hopeful atmosphere, detailed anime background, soft dreamy style'] = '__home_poem_2';
  
  // ========== 第二幕：校 ==========
  const schoolPoemPrompts = [
    'anime style chalkboard with math equations, chalk dust in sunlight beams, classroom morning, nostalgic atmosphere, detailed anime school background, warm lighting',
    'anime style teacher podium, empty classroom, sunlight through windows, quiet contemplation, detailed anime school scene, soft golden hour',
    'anime style school hallway after class, two friends walking away, sunset light streaming in, warm friendship atmosphere, detailed anime background, golden lighting'
  ];
  schoolPoemPrompts.forEach((p, i) => { promptToKey[p] = '__school_poem_' + i; });
  
  const schoolN1Prompts = [
    'anime style school building exterior, morning sunlight, cherry blossoms falling, peaceful atmosphere, detailed anime background',
    'anime style classroom morning, sunlight streaming through windows, chalk dust particles in light, math equations on blackboard, warm golden hour, detailed anime school background',
    'anime style chalkboard closeup, math equations written in chalk, chalk dust floating in sunbeam, detailed anime school scene',
    'anime style student perspective, looking at textbook, eyes unfocused, blurred writing, classroom background, detailed anime POV shot',
    'anime style closeup of confused expression, furrowed brows, sunlight on face, detailed anime character art'
  ];
  schoolN1Prompts.forEach((p, i) => { promptToKey[p] = '__school_narrative1_' + i; });
  
  const schoolN2Prompts = [
    'anime style classmate notebook, neat handwriting, filled pages, detailed anime closeup',
    'anime style students nodding in class, engaged expressions, sunlight, detailed anime classroom scene',
    'anime style view from back row, empty notebook in foreground, other students blurred, feeling invisible, detailed anime school scene',
    'anime style lonely student at desk, surrounded by blurry classmates, feeling invisible, soft sunlight, detailed anime illustration',
    'anime style empty classroom feeling, single desk isolated, warm light, lonely atmosphere, detailed anime school background'
  ];
  schoolN2Prompts.forEach((p, i) => { promptToKey[p] = '__school_narrative2_' + i; });
  
  promptToKey['anime style teacher at front of class, hand raised question, classroom scene, dramatic lighting, detailed anime school illustration, tense moment'] = '__school_choice1_0';
  
  const schoolC1PosPrompts = [
    'anime style hand slowly raising, trembling slightly, classroom background, detailed anime closeup',
    'anime style student raising hand in class, nervous expression, teacher looking gently, warm sunlight, hopeful moment, detailed anime character art',
    'anime style closeup of face, blushing, eyes looking down, embarrassed but determined, detailed anime character art',
    'anime teacher at blackboard, explaining patiently, chalk in hand, warm expression, detailed anime character art'
  ];
  schoolC1PosPrompts.forEach((p, i) => { promptToKey[p] = '__school_consequence1_pos_' + i; });
  
  const schoolA1PosPrompts = [
    'anime style student sitting down, hand still shaking, small relieved smile, detailed anime character art',
    'anime style closeup of notebook, pencil writing down notes, sunlight on paper, detailed anime closeup',
    'anime style window view, sunlight, floating dust particles, hopeful atmosphere, detailed anime background',
    'anime style girl with small determined smile, sunlight on face, classroom background, detailed anime character art'
  ];
  schoolA1PosPrompts.forEach((p, i) => { promptToKey[p] = '__school_after1_pos_' + i; });
  
  const schoolC1NegPrompts = [
    'anime style head bowing down, hair covering face, classroom background, detailed anime character art',
    'anime style closeup of hands clutching desk, knuckles white, detailed anime closeup',
    'anime style teacher gaze moving past, blurred student in foreground, feeling invisible, detailed anime classroom scene',
    'anime style student looking down, empty expression, classroom background, melancholic mood, detailed anime character art'
  ];
  schoolC1NegPrompts.forEach((p, i) => { promptToKey[p] = '__school_consequence1_neg_' + i; });
  
  const schoolA1NegPrompts = [
    'anime style blurred chalkboard, out of focus equations, tired eyes perspective, detailed anime POV shot',
    'anime style closeup of eyes, unfocused gaze, classroom blurred in background, detailed anime closeup',
    'anime style scratch paper with handwritten words "I dont understand", then crossed out, detailed anime closeup',
    'anime style hand crossing out words aggressively, pencil breaking point, detailed anime closeup'
  ];
  schoolA1NegPrompts.forEach((p, i) => { promptToKey[p] = '__school_after1_neg_' + i; });
  
  promptToKey['anime style classroom during break, students chatting in groups, lonely student at desk, contrast of noise and silence, detailed anime school scene, warm afternoon light'] = '__school_choice2_0';
  
  const schoolC2PosPrompts = [
    'anime style hands clutching workbook, nervous fingers, classroom background, detailed anime closeup',
    'anime style student turning to classmate, nervous expression, holding workbook, detailed anime character art',
    'anime style speech bubble with question mark, classroom setting, detailed anime scene',
    'anime two students studying together, sharing textbook, warm sunlight through window, friendship moment, detailed anime character art, gentle mood'
  ];
  schoolC2PosPrompts.forEach((p, i) => { promptToKey[p] = '__school_consequence2_pos_' + i; });
  
  const schoolA2PosPrompts = [
    'anime style closeup of two heads bent over textbook, pointing at problem, warm sunlight, detailed anime scene',
    'anime style notebook page with solved problem, helpful notes, sunlight, detailed anime closeup',
    'anime style sunlight through window, dust particles floating, warm glow, peaceful classroom, detailed anime background',
    'anime style girl smiling shyly, hopeful expression, classroom sunset light, detailed anime character art'
  ];
  schoolA2PosPrompts.forEach((p, i) => { promptToKey[p] = '__school_after2_pos_' + i; });
  
  const schoolC2NegPrompts = [
    'anime style arms on desk, head buried, classroom background, detailed anime character art',
    'anime style blurred classroom background, students chatting, out of focus, feeling isolated, detailed anime scene',
    'anime style closeup of eyes peeking through arms, watching classmates, lonely expression, detailed anime closeup',
    'anime style single tear drop falling on desk, warm afternoon light, emotional moment, detailed anime closeup'
  ];
  schoolC2NegPrompts.forEach((p, i) => { promptToKey[p] = '__school_consequence2_neg_' + i; });
  
  const schoolA2NegPrompts = [
    'anime style clock on wall, slow ticking, classroom setting, detailed anime closeup',
    'anime style closeup of closed eyes, counting silently, detailed anime closeup',
    'anime style empty classroom hallway, quiet, sunset light, detailed anime background',
    'anime style lonely silhouette by window, classroom, sunset, melancholic mood, detailed anime illustration'
  ];
  schoolA2NegPrompts.forEach((p, i) => { promptToKey[p] = '__school_after2_neg_' + i; });
  
  promptToKey['anime style school hallway after class, two friends walking away, sunset light streaming in, warm friendship atmosphere, detailed anime background, golden lighting'] = '__school_reflection_0';
  
  // ========== 第三幕：人 ==========
  const peoplePoemPrompts = [
    'anime style sports bleachers at golden hour, empty seats, sunset sky, peaceful solitude, detailed anime background, warm orange light',
    'anime style phone screen closeup, message from older brother, sunset background, warm glow, emotional moment, detailed anime illustration, golden hour',
    'anime style bedroom at night, phone glowing softly, starry sky through window, distant connection, detailed anime interior, dreamy lighting'
  ];
  peoplePoemPrompts.forEach((p, i) => { promptToKey[p] = '__people_poem_' + i; });
  
  const peopleN1Prompts = [
    'anime style school gate after class, students walking out, sunset light, detailed anime background',
    'anime style school bleachers at sunset, girl sitting alone, basketball court in distance, golden hour lighting, peaceful yet sad atmosphere, detailed anime background',
    'anime style sunset sky, orange and pink clouds, wide shot, peaceful atmosphere, detailed anime background',
    'anime style basketball court in distance, blurry figures playing, warm sunset, detailed anime background',
    'anime style wind blowing hair, sunset backlight, peaceful expression, detailed anime character art'
  ];
  peopleN1Prompts.forEach((p, i) => { promptToKey[p] = '__people_narrative1_' + i; });
  
  const peopleN2Prompts = [
    'anime style girl hugging knees on bleachers, sunset glow, distant laughter blurred, introspective mood, detailed anime character art, warm orange light',
    'anime style closeup of face, head buried in arms, sad expression, sunset light, detailed anime character art',
    'anime style math textbook, open page with confused notes, sunset light on page, detailed anime closeup',
    'anime style two students blurred in background, walking together, warm sunset, foreground empty seat, detailed anime scene',
    'anime style girl sitting alone, shadow stretching long, sunset, melancholic mood, detailed anime illustration'
  ];
  peopleN2Prompts.forEach((p, i) => { promptToKey[p] = '__people_narrative2_' + i; });
  
  promptToKey['anime style phone screen closeup, message from older brother, sunset background, warm glow, emotional moment, detailed anime illustration, golden hour'] = '__people_choice1_0';
  
  const peopleC1PosPrompts = [
    'anime style hands typing on phone, sunset background, detailed anime closeup',
    'anime style phone screen with long text message, emotional typing, sunset glow, detailed anime closeup',
    'anime style phone face down on lap, hands trembling, sunset light, detailed anime closeup',
    'anime style girl sitting on bleachers, hand on chest, feeling heartbeat, sunset backlight, detailed anime character art'
  ];
  peopleC1PosPrompts.forEach((p, i) => { promptToKey[p] = '__people_consequence1_pos_' + i; });
  
  const peopleA1PosPrompts = [
    'anime style phone vibrating, notification popping up, sunset light, detailed anime closeup',
    'anime style phone screen with long message from brother, warm glow, emotional moment, detailed anime closeup',
    'anime style girl reading phone, eyes wide, surprised expression, sunset glow on face, detailed anime character art',
    'anime style tear drop on phone screen, sunset reflection, emotional moment, detailed anime closeup'
  ];
  peopleA1PosPrompts.forEach((p, i) => { promptToKey[p] = '__people_after1_pos_' + i; });
  
  const peopleC1NegPrompts = [
    'anime style hands typing "fine" on phone, fake smile emoji, sunset background, detailed anime closeup',
    'anime style finger hovering over send button, hesitant, sunset light, detailed anime closeup',
    'anime style phone being put on silent, screen dimming, sunset glow, detailed anime closeup',
    'anime style girl staring at sunset, empty expression, lonely mood, detailed anime character art'
  ];
  peopleC1NegPrompts.forEach((p, i) => { promptToKey[p] = '__people_consequence1_neg_' + i; });
  
  const peopleA1NegPrompts = [
    'anime style phone vibrating quietly, sunset light, detailed anime closeup',
    'anime style phone screen showing message: "really? you can talk to me", warm glow, detailed anime closeup',
    'anime style closeup of eyes, tears forming, sunset reflection, detailed anime closeup',
    'anime style girl covering mouth with hand, tears, sunset backlight, emotional moment, detailed anime character art'
  ];
  peopleA1NegPrompts.forEach((p, i) => { promptToKey[p] = '__people_after1_neg_' + i; });
  
  promptToKey['anime style bleachers at dusk, purple and orange sky, girl standing up, silhouette against sunset, moment of decision, detailed anime scene, atmospheric lighting'] = '__people_choice2_0';
  
  const peopleC2PosPrompts = [
    'anime style girl standing up from bleachers, stretching, sunset sky, detailed anime character art',
    'anime style closeup of breath being exhaled, visible in cool air, sunset light, detailed anime closeup',
    'anime style hand holding phone, typing "thank you", sunset glow, detailed anime closeup',
    'anime style girl walking toward sunset, phone in hand, hopeful expression, warm golden light, newfound strength, detailed anime character art'
  ];
  peopleC2PosPrompts.forEach((p, i) => { promptToKey[p] = '__people_consequence2_pos_' + i; });
  
  const peopleEPosPrompts = [
    'anime style hand typing "thank you gege" on phone, sunset background, detailed anime closeup',
    'anime style sunset path, girl walking away from camera, golden light, long shadow, detailed anime scene',
    'anime style closeup of wind blowing hair, gentle smile, sunset backlight, detailed anime character art',
    'anime style small seed sprouting, soft glow, sunset background, hopeful metaphor, detailed anime illustration'
  ];
  peopleEPosPrompts.forEach((p, i) => { promptToKey[p] = '__people_end_pos_' + i; });
  
  const peopleC2NegPrompts = [
    'anime style girl standing up, slinging backpack over shoulder, dusk sky, detailed anime character art',
    'anime style walking toward school gate, dusk sky, tired posture, detailed anime scene',
    'anime style closeup of hands in pockets, looking down, dusk light, detailed anime closeup',
    'anime style girl walking away from school, hands in pockets, dusk sky, tired expression, detailed anime illustration, somber mood'
  ];
  peopleC2NegPrompts.forEach((p, i) => { promptToKey[p] = '__people_consequence2_neg_' + i; });
  
  const peopleENegPrompts = [
    'anime style school gate at dusk, girl looking back at playground, detailed anime scene',
    'anime style view of empty bleachers, last sunlight, peaceful, detailed anime background',
    'anime style sunset last light, orange glow on clouds, detailed anime sky',
    'anime style girl walking into dusk, silhouette, uncertain future, melancholic mood, detailed anime illustration'
  ];
  peopleENegPrompts.forEach((p, i) => { promptToKey[p] = '__people_end_neg_' + i; });
  
  promptToKey['anime style beautiful sunrise over mountains, golden light, hope and new beginnings, dreamy atmosphere, soft clouds, warm glow, detailed anime background art'] = '__people_ending_0';
  
  // ========== 暴露全局 ==========
  window.IMAGE_MAP = imageMap;
  window.PROMPT_TO_KEY = promptToKey;
  
})();
