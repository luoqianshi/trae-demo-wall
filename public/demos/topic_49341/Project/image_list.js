// 图片清单 - 列出所有需要的图片prompt
// 实际生成图片时，请将AI生成的图片URL填入 imageMap 中
// 或者将图片保存到 ./images/ 目录中，命名为对应编号

const IMAGE_LIST = {
  // 第一幕：家
  'home': {
    poem: [
      'anime style desk lamp closeup, warm golden light, pencil shadow on paper, late night study, cozy melancholic atmosphere, detailed anime still life, soft focus',
      'anime style bedroom door, shadow of mother under door crack, tense atmosphere, dim warm light, detailed anime interior scene, dramatic lighting',
      'anime style foggy crossroads, single figure silhouette, distant faint light, mysterious hopeful atmosphere, detailed anime background, soft dreamy style'
    ],
    scenes: {
      narrative1: [
        'anime style bedroom at night, wide shot, desk lamp warm glow, window with starry sky, cozy melancholic atmosphere, detailed anime background art, soft lighting',
        'anime style desk closeup, math workbook open, pencil hovering, desk lamp warm light, late night study, detailed anime still life',
        'anime style closeup of eyes staring at paper, tired expression, reflection of math equations, warm lamp light, detailed anime character art',
        'anime style pencil tip on blank paper, shadow stretching, eraser crumbs nearby, warm desk lamp, detailed anime closeup'
      ],
      narrative2: [
        'anime style bedroom window, night sky with stars, curtain slightly moving, warm indoor light, detailed anime background',
        'anime style bedroom wall, shadow of TV flickering, distant muffled sound, warm dim light, detailed anime interior',
        'anime style phone face down on desk corner, dark screen, lamp glow, shadow patterns, late night study scene, detailed anime interior',
        'anime style hand reaching toward phone then pulling back, indecisive, desk lamp warm light, detailed anime closeup'
      ],
      choice1: 'anime style bedroom door view, door slightly ajar, warm hallway light seeping in, shadow of mother figure outside, tense atmosphere, detailed anime scene, dramatic lighting',
      consequence1_positive: [
        'anime style hand reaching for door handle, trembling slightly, warm hallway light under door, detailed anime closeup',
        'anime style bedroom door opening, mother standing in hallway, warm light behind her, surprised expression, detailed anime character art',
        'anime style teenage girl looking down, tears forming in eyes, vulnerable expression, warm lamp light, detailed anime character art',
        'anime style mother and daughter talking by bedside, soft warm lighting, gentle expression, emotional moment, detailed anime character art, intimate scene'
      ],
      narrative_after1_positive: [
        'anime style mother sitting on bed, hand on daughter shoulder, soft expression, warm bedroom light, detailed anime character art',
        'anime style closeup of mother hand patting daughters back, gentle motion, warm light, detailed anime closeup',
        'anime style two silhouettes by window, night scene, warm indoor light, peaceful atmosphere, detailed anime background',
        'anime style girl smiling through tears, relieved expression, warm lamp glow, detailed anime character art'
      ],
      consequence1_negative: [
        'anime style hand quickly turning off lamp switch, shadow moving fast, dim bedroom, detailed anime closeup',
        'anime style person hiding under blanket, only eyes visible, dark bedroom, moonlight through curtains, detailed anime scene',
        'anime style shadow of feet under door crack, standing still, tense atmosphere, dim warm light, detailed anime interior',
        'anime style dark bedroom, person staring at ceiling, shadow of door frame, lonely atmosphere, night scene, detailed anime illustration, melancholic mood'
      ],
      narrative_after1_negative: [
        'anime style alarm clock closeup, ticking hands, red digits glowing, dark bedroom, detailed anime closeup',
        'anime style person turning in bed, face buried in pillow, messy hair, dim moonlight, detailed anime scene',
        'anime style tear drop on pillowcase, dark room, faint moonlight, emotional detail, detailed anime closeup',
        'anime style girl silhouette by window, lonely pose, night scene, starlight, melancholic atmosphere, detailed anime illustration'
      ],
      choice2: 'anime style bedroom at night, girl lying in bed staring at ceiling, moonlight through curtains, peaceful yet troubled atmosphere, detailed anime background, soft blue lighting',
      consequence2_positive: [
        'anime style hand writing on paper, pencil moving, math problem being copied, warm desk lamp, detailed anime closeup',
        'anime style notebook page with handwritten math problems, neat handwriting, desk lamp light, detailed anime closeup',
        'anime style night window view, soft wind blowing curtains, summer night, gentle moonlight, hopeful atmosphere, detailed anime scene, serene mood',
        'anime style girl closing eyes with small smile, peaceful expression, moonlight on face, detailed anime character art'
      ],
      narrative_end_positive: [
        'anime style curtain gently blowing in wind, summer night, firefly outside window, detailed anime scene',
        'anime style closeup of desk with open book, warm lamp turned off, moonlight, peaceful atmosphere, detailed anime still life',
        'anime style girl sleeping peacefully, small smile, moonbeam on face, detailed anime character art',
        'anime style sunrise through window, soft golden light, bedroom awakening, hopeful atmosphere, detailed anime background'
      ],
      consequence2_negative: [
        'anime style hand shoving workbook into school bag, messy desk, dark bedroom, detailed anime closeup',
        'anime style school bag on floor, half-open, workbook peeking out, dim room, detailed anime scene',
        'anime style person lying in bed, eyes closed, troubled expression, moonlight, detailed anime character art',
        'anime style nightmare scene, floating math equations, worried expression, dark bedroom, anxiety dream, detailed anime illustration, tense atmosphere'
      ],
      narrative_end_negative: [
        'anime style clock showing late hour, red digits, dark room, detailed anime closeup',
        'anime style girl tossing and turning in bed, messy sheets, dim moonlight, detailed anime scene',
        'anime style dream sequence, floating numbers and equations, dark background, anxious feeling, detailed anime illustration',
        'anime style shadow of disappointed mother, dark hallway, blurred figure, melancholic mood, detailed anime scene'
      ],
      reflection: 'anime style foggy crossroads, single figure silhouette, distant faint light, mysterious hopeful atmosphere, detailed anime background, soft dreamy style'
    }
  },
  // 第二幕：校
  'school': {
    poem: [
      'anime style chalkboard with math equations, chalk dust in sunlight beams, classroom morning, nostalgic atmosphere, detailed anime school background, warm lighting',
      'anime style teacher podium, empty classroom, sunlight through windows, quiet contemplation, detailed anime school scene, soft golden hour',
      'anime style school hallway after class, two friends walking away, sunset light streaming in, warm friendship atmosphere, detailed anime background, golden lighting'
    ],
    scenes: {
      narrative1: [
        'anime style school building exterior, morning sunlight, cherry blossoms falling, peaceful atmosphere, detailed anime background',
        'anime style classroom morning, sunlight streaming through windows, chalk dust particles in light, math equations on blackboard, warm golden hour, detailed anime school background',
        'anime style chalkboard closeup, math equations written in chalk, chalk dust floating in sunbeam, detailed anime school scene',
        'anime style student perspective, looking at textbook, eyes unfocused, blurred writing, classroom background, detailed anime POV shot',
        'anime style closeup of confused expression, furrowed brows, sunlight on face, detailed anime character art'
      ],
      narrative2: [
        'anime style classmate notebook, neat handwriting, filled pages, detailed anime closeup',
        'anime style students nodding in class, engaged expressions, sunlight, detailed anime classroom scene',
        'anime style view from back row, empty notebook in foreground, other students blurred, feeling invisible, detailed anime school scene',
        'anime style lonely student at desk, surrounded by blurry classmates, feeling invisible, soft sunlight, detailed anime illustration',
        'anime style empty classroom feeling, single desk isolated, warm light, lonely atmosphere, detailed anime school background'
      ],
      choice1: 'anime style teacher at front of class, hand raised question, classroom scene, dramatic lighting, detailed anime school illustration, tense moment',
      consequence1_positive: [
        'anime style hand slowly raising, trembling slightly, classroom background, detailed anime closeup',
        'anime style student raising hand in class, nervous expression, teacher looking gently, warm sunlight, hopeful moment, detailed anime character art',
        'anime style closeup of face, blushing, eyes looking down, embarrassed but determined, detailed anime character art',
        'anime teacher at blackboard, explaining patiently, chalk in hand, warm expression, detailed anime character art'
      ],
      narrative_after1_positive: [
        'anime style student sitting down, hand still shaking, small relieved smile, detailed anime character art',
        'anime style closeup of notebook, pencil writing down notes, sunlight on paper, detailed anime closeup',
        'anime style window view, sunlight, floating dust particles, hopeful atmosphere, detailed anime background',
        'anime style girl with small determined smile, sunlight on face, classroom background, detailed anime character art'
      ],
      consequence1_negative: [
        'anime style head bowing down, hair covering face, classroom background, detailed anime character art',
        'anime style closeup of hands clutching desk, knuckles white, detailed anime closeup',
        'anime style teacher gaze moving past, blurred student in foreground, feeling invisible, detailed anime classroom scene',
        'anime style student looking down, empty expression, classroom background, melancholic mood, detailed anime character art'
      ],
      narrative_after1_negative: [
        'anime style blurred chalkboard, out of focus equations, tired eyes perspective, detailed anime POV shot',
        'anime style closeup of eyes, unfocused gaze, classroom blurred in background, detailed anime closeup',
        'anime style scratch paper with handwritten words "I dont understand", then crossed out, detailed anime closeup',
        'anime style hand crossing out words aggressively, pencil breaking point, detailed anime closeup'
      ],
      choice2: 'anime style classroom during break, students chatting in groups, lonely student at desk, contrast of noise and silence, detailed anime school scene, warm afternoon light',
      consequence2_positive: [
        'anime style hands clutching workbook, nervous fingers, classroom background, detailed anime closeup',
        'anime style student turning to classmate, nervous expression, holding workbook, detailed anime character art',
        'anime style speech bubble with question mark, classroom setting, detailed anime scene',
        'anime two students studying together, sharing textbook, warm sunlight through window, friendship moment, detailed anime character art, gentle mood'
      ],
      narrative_after2_positive: [
        'anime style closeup of two heads bent over textbook, pointing at problem, warm sunlight, detailed anime scene',
        'anime style notebook page with solved problem, helpful notes, sunlight, detailed anime closeup',
        'anime style sunlight through window, dust particles floating, warm glow, peaceful classroom, detailed anime background',
        'anime style girl smiling shyly, hopeful expression, classroom sunset light, detailed anime character art'
      ],
      consequence2_negative: [
        'anime style arms on desk, head buried, classroom background, detailed anime character art',
        'anime style blurred classroom background, students chatting, out of focus, feeling isolated, detailed anime scene',
        'anime style closeup of eyes peeking through arms, watching classmates, lonely expression, detailed anime closeup',
        'anime style single tear drop falling on desk, warm afternoon light, emotional moment, detailed anime closeup'
      ],
      narrative_after2_negative: [
        'anime style clock on wall, slow ticking, classroom setting, detailed anime closeup',
        'anime style closeup of closed eyes, counting silently, detailed anime closeup',
        'anime style empty classroom hallway, quiet, sunset light, detailed anime background',
        'anime style lonely silhouette by window, classroom, sunset, melancholic mood, detailed anime illustration'
      ],
      reflection: 'anime style school hallway after class, two friends walking away, sunset light streaming in, warm friendship atmosphere, detailed anime background, golden lighting'
    }
  },
  // 第三幕：人
  'people': {
    poem: [
      'anime style sports bleachers at golden hour, empty seats, sunset sky, peaceful solitude, detailed anime background, warm orange light',
      'anime style phone screen closeup, message from older brother, sunset background, warm glow, emotional moment, detailed anime illustration, golden hour',
      'anime style bedroom at night, phone glowing softly, starry sky through window, distant connection, detailed anime interior, dreamy lighting'
    ],
    scenes: {
      narrative1: [
        'anime style school gate after class, students walking out, sunset light, detailed anime background',
        'anime style school bleachers at sunset, girl sitting alone, basketball court in distance, golden hour lighting, peaceful yet sad atmosphere, detailed anime background',
        'anime style sunset sky, orange and pink clouds, wide shot, peaceful atmosphere, detailed anime background',
        'anime style basketball court in distance, blurry figures playing, warm sunset, detailed anime background',
        'anime style wind blowing hair, sunset backlight, peaceful expression, detailed anime character art'
      ],
      narrative2: [
        'anime style girl hugging knees on bleachers, sunset glow, distant laughter blurred, introspective mood, detailed anime character art, warm orange light',
        'anime style closeup of face, head buried in arms, sad expression, sunset light, detailed anime character art',
        'anime style math textbook, open page with confused notes, sunset light on page, detailed anime closeup',
        'anime style two students blurred in background, walking together, warm sunset, foreground empty seat, detailed anime scene',
        'anime style girl sitting alone, shadow stretching long, sunset, melancholic mood, detailed anime illustration'
      ],
      choice1: 'anime style phone screen closeup, message from older brother, sunset background, warm glow, emotional moment, detailed anime illustration, golden hour',
      consequence1_positive: [
        'anime style hands typing on phone, sunset background, detailed anime closeup',
        'anime style phone screen with long text message, emotional typing, sunset glow, detailed anime closeup',
        'anime style phone face down on lap, hands trembling, sunset light, detailed anime closeup',
        'anime style girl sitting on bleachers, hand on chest, feeling heartbeat, sunset backlight, detailed anime character art'
      ],
      narrative_after1_positive: [
        'anime style phone vibrating, notification popping up, sunset light, detailed anime closeup',
        'anime style phone screen with long message from brother, warm glow, emotional moment, detailed anime closeup',
        'anime style girl reading phone, eyes wide, surprised expression, sunset glow on face, detailed anime character art',
        'anime style tear drop on phone screen, sunset reflection, emotional moment, detailed anime closeup'
      ],
      consequence1_negative: [
        'anime style hands typing "fine" on phone, fake smile emoji, sunset background, detailed anime closeup',
        'anime style finger hovering over send button, hesitant, sunset light, detailed anime closeup',
        'anime style phone being put on silent, screen dimming, sunset glow, detailed anime closeup',
        'anime style girl staring at sunset, empty expression, lonely mood, detailed anime character art'
      ],
      narrative_after1_negative: [
        'anime style phone vibrating quietly, sunset light, detailed anime closeup',
        'anime style phone screen showing message: "really? you can talk to me", warm glow, detailed anime closeup',
        'anime style closeup of eyes, tears forming, sunset reflection, detailed anime closeup',
        'anime style girl covering mouth with hand, tears, sunset backlight, emotional moment, detailed anime character art'
      ],
      choice2: 'anime style bleachers at dusk, purple and orange sky, girl standing up, silhouette against sunset, moment of decision, detailed anime scene, atmospheric lighting',
      consequence2_positive: [
        'anime style girl standing up from bleachers, stretching, sunset sky, detailed anime character art',
        'anime style closeup of breath being exhaled, visible in cool air, sunset light, detailed anime closeup',
        'anime style hand holding phone, typing "thank you", sunset glow, detailed anime closeup',
        'anime style girl walking toward sunset, phone in hand, hopeful expression, warm golden light, newfound strength, detailed anime character art'
      ],
      narrative_end_positive: [
        'anime style hand typing "thank you gege" on phone, sunset background, detailed anime closeup',
        'anime style sunset path, girl walking away from camera, golden light, long shadow, detailed anime scene',
        'anime style closeup of wind blowing hair, gentle smile, sunset backlight, detailed anime character art',
        'anime style small seed sprouting, soft glow, sunset background, hopeful metaphor, detailed anime illustration'
      ],
      consequence2_negative: [
        'anime style girl standing up, slinging backpack over shoulder, dusk sky, detailed anime character art',
        'anime style walking toward school gate, dusk sky, tired posture, detailed anime scene',
        'anime style closeup of hands in pockets, looking down, dusk light, detailed anime closeup',
        'anime style girl walking away from school, hands in pockets, dusk sky, tired expression, detailed anime illustration, somber mood'
      ],
      narrative_end_negative: [
        'anime style school gate at dusk, girl looking back at playground, detailed anime scene',
        'anime style view of empty bleachers, last sunlight, peaceful, detailed anime background',
        'anime style sunset last light, orange glow on clouds, detailed anime sky',
        'anime style girl walking into dusk, silhouette, uncertain future, melancholic mood, detailed anime illustration'
      ],
      ending: 'anime style beautiful sunrise over mountains, golden light, hope and new beginnings, dreamy atmosphere, soft clouds, warm glow, detailed anime background art'
    }
  }
};

// 统计总数
let totalCount = 0;
Object.values(IMAGE_LIST).forEach(act => {
  totalCount += act.poem.length;
  Object.values(act.scenes).forEach(scene => {
    if (Array.isArray(scene)) {
      totalCount += scene.length;
    } else {
      totalCount += 1;
    }
  });
});
console.log(`图片总数: ${totalCount}`);
