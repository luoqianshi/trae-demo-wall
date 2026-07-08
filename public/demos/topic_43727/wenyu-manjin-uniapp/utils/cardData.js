/**
 * 文瑜慢浸 - 卡片主题数据
 * 包含各文物主题的故事、静心引导、瑜珈体式等内容
 */

export const themes = {
  bronze: {
    name: '青铜器',
    icon: '🏺',
    image: '/static/assets/bronze.jpg',
    tagColor: '#8B6914',
    story: {
      title: '青铜器的故事',
      content: '青铜器，是中华文明最早的辉煌印记。三千多年前的工匠们，用泥范铸造法，将铜、锡、铅熔为一体，浇铸出庄重威严的礼器。每一件青铜器上，都镌刻着那个时代对天地神灵的敬畏。鼎、簋、爵、觚——它们不仅是器物，更是沟通人神的媒介。当你凝视那些斑驳的铜绿，仿佛能听见远古铸铜工坊里叮叮当当的锤击声，感受到先民对美的极致追求。'
    },
    meditation: {
      title: '静心引导',
      content: '请找一个舒适的坐姿，轻轻闭上眼睛。想象你面前有一件古老的青铜鼎，它经历了三千年的岁月沉淀。感受那份沉稳与厚重，让这种力量从你的心底升起。吸气时，想象青铜器上精美的纹饰在你心中绽放；呼气时，让所有杂念如铜绿般缓缓褪去。在这份古老而深沉的宁静中，与自己的内心对话。'
    },
    yoga: [
      {
        id: 'tadasana',
        nameZh: '山式',
        nameEn: 'Tadasana',
        icon: '🏔️',
        duration: '60秒',
        props: '瑜伽砖（可选）',
        description: '双脚并拢站立，脚趾展开踩实地面。大腿肌肉向上收紧，尾骨微微内收。双臂自然垂于身体两侧，掌心朝前。肩膀放松下沉，胸腔打开。头顶向天花板方向延伸。如需辅助，可在脚下放置瑜伽砖帮助重心稳定。'
      },
      {
        id: 'virabhadrasana2',
        nameZh: '战士二式',
        nameEn: 'Virabhadrasana II',
        icon: '⚔️',
        duration: '每侧45秒',
        props: '瑜伽砖',
        description: '双脚大步分开，前脚朝前，后脚外转90度。前膝弯曲至大腿平行地面，膝盖不超过脚尖。双臂向两侧平举，与肩同高，掌心朝下。目光看向前方指尖。感受双腿如青铜器般稳固有力。可在手下放置瑜伽砖辅助平衡。'
      },
      {
        id: 'vrikshasana',
        nameZh: '树式',
        nameEn: 'Vrikshasana',
        icon: '🌳',
        duration: '每侧45秒',
        props: '墙壁',
        description: '单脚站立，另一脚掌抵于大腿内侧（避开膝盖）。双手合十于胸前，或向上伸展如树枝。目光固定在前方一点，保持专注。如需辅助可靠近墙壁练习。感受身体如古树般扎根大地，向上生长。'
      },
      {
        id: 'prasarita',
        nameZh: '双角式',
        nameEn: 'Prasarita Padottanasana',
        icon: '🦅',
        duration: '60秒',
        props: '瑜伽砖、墙壁',
        description: '双脚大步分开，双脚平行朝前。从髋部折叠前屈，双手触地或放在瑜伽砖上。头部自然下垂，放松颈部。如需辅助可靠墙练习，双手扶墙。感受脊柱如青铜器纹饰般优雅延展。'
      }
    ],
    safety: [
      '练习前请确保身体状态良好，如有不适请暂停',
      '关节疼痛时切勿强行拉伸，可使用辅具降低难度',
      '保持自然呼吸，不要憋气',
      '练习环境应安静、通风、地面平整'
    ]
  },
  porcelain: {
    name: '瓷器',
    icon: '🫖',
    image: '/static/assets/porcelain.jpg',
    tagColor: '#4A90D9',
    story: {
      title: '瓷器的故事',
      content: '中国瓷器，是火与土的艺术结晶。从商代的原始青瓷，到宋代五大名窑的巅峰之作，再到明清时期精美的彩瓷，每一件瓷器都凝聚着匠人数月乃至数年的心血。釉色如天青、如月白、如豇豆红——那些看似简单的色彩，背后是无数次窑火的淬炼与失败。瓷器之美，在于它的温润如玉，在于它的通透纯净，更在于它承载的千年匠心。'
    },
    meditation: {
      title: '静心引导',
      content: '请找一个安静的角落，舒适地坐好。想象你面前有一件温润如玉的青花瓷瓶，釉面光滑如镜，青花在白瓷上缓缓绽放。感受那份纯净与通透，让这种澄澈渗透你的心灵。吸气时，想象清新的釉色浸润你的全身；呼气时，让内心的浑浊如窑烟般飘散。在这份纯净中，找回内心的清明。'
    },
    yoga: [
      {
        id: 'sukhasana',
        nameZh: '简易坐',
        nameEn: 'Sukhasana',
        icon: '🧘',
        duration: '120秒',
        props: '瑜伽砖、毛毯',
        description: '盘腿坐于地面，臀部下方可垫瑜伽砖或折叠的毛毯以保持骨盆前倾。双手自然放于膝盖上，掌心朝上或朝下。脊柱自然挺直，肩膀放松。闭上眼睛，关注呼吸。如膝盖不适可在膝盖下垫毛毯。'
      },
      {
        id: 'baddha',
        nameZh: '束角式',
        nameEn: 'Baddha Konasana',
        icon: '🦋',
        duration: '90秒',
        props: '瑜伽砖、毛毯',
        description: '坐姿，双脚脚掌相对，膝盖向两侧打开。双手握住脚掌，肘部轻压大腿外侧。保持脊柱挺直，从髋部折叠前屈。可在膝盖下垫瑜伽砖支撑，或在臀部下垫毛毯抬高坐骨。'
      },
      {
        id: 'upavistha',
        nameZh: '坐角式',
        nameEn: 'Upavistha Konasana',
        icon: '🦢',
        duration: '90秒',
        props: '瑜伽砖',
        description: '坐姿，双腿向两侧打开呈V字形。保持脊柱挺直，从髋部缓慢前屈，双手向前伸展。可在前方放置瑜伽砖支撑额头或双手。感受双腿如瓷器裂纹般优雅延展。'
      },
      {
        id: 'paschimottanasana',
        nameZh: '坐立前屈',
        nameEn: 'Paschimottanasana',
        icon: '🌊',
        duration: '90秒',
        props: '瑜伽砖、瑜伽带',
        description: '坐姿，双腿向前伸直。从髋部折叠前屈，双手抓住脚掌或使用瑜伽带辅助。如够不到脚，可在脚上套瑜伽带，或在膝盖上放瑜伽砖。感受背部如瓷釉般平滑延展。'
      }
    ],
    safety: [
      '前屈时从髋部折叠，不要弓背',
      '膝盖有不适时请使用辅具支撑',
      '坐骨神经痛者请谨慎前屈',
      '保持均匀呼吸，不要在体式中憋气'
    ]
  },
  buddha: {
    name: '佛像造像',
    icon: '🙏',
    image: '/static/assets/buddha.jpg',
    tagColor: '#D4A843',
    story: {
      title: '佛像造像的故事',
      content: '中国佛像造像艺术，融合了印度佛教文化与中华审美精髓。从北魏云冈石窟的雄浑壮阔，到唐代龙门石窟的丰腴端庄，再到宋代大足石刻的世俗温情，每一尊佛像都诉说着不同时代的信仰与美学。佛像的面容总是宁静安详，半闭的双眸似在俯瞰众生，又似在向内观照。那份超然物外的平静，穿越千年，依然能触动我们内心最柔软的角落。'
    },
    meditation: {
      title: '静心引导',
      content: '请找一个安静的空间，以舒适的坐姿坐下。想象你面前有一尊古老的佛像，面容安详，双眸微闭，嘴角带着淡淡的微笑。感受那份超然与宁静，让这种平和的力量流入你的心田。吸气时，想象金色的佛光笼罩全身；呼气时，放下所有的执念与烦恼。在这份慈悲与智慧中，找到内心的安宁。'
    },
    yoga: [
      {
        id: 'padmasana',
        nameZh: '莲花坐',
        nameEn: 'Padmasana',
        icon: '🪷',
        duration: '120秒',
        props: '毛毯、 meditation cushion',
        description: '坐姿，右脚放在左大腿上，左脚放在右大腿上（如无法完成可使用半莲花）。双手结禅定印放于膝上。脊柱自然挺直，下巴微收。可在臀部下垫毛毯或冥想坐垫。如膝盖不适请使用简易坐替代。'
      },
      {
        id: 'balasana',
        nameZh: '婴儿式',
        nameEn: 'Balasana',
        icon: '👶',
        duration: '90秒',
        props: '毛毯、抱枕',
        description: '跪坐，大脚趾相触，膝盖分开。身体前倾，额头触地，双臂向前伸展或放于身体两侧。可在额头下垫毛毯，或在胸腹下放抱枕增加舒适度。感受全身如婴儿般柔软放松。'
      },
      {
        id: 'marichyasana',
        nameZh: '马里奇一式',
        nameEn: 'Marichyasana I',
        icon: '🌀',
        duration: '每侧45秒',
        props: '瑜伽带',
        description: '坐姿，右腿弯曲，右脚掌贴近左大腿内侧。吸气伸展脊柱，呼气从髋部前屈，双手向左脚方向伸展。如够不到可使用瑜伽带辅助。感受躯干的扭转如佛像衣纹般流畅。'
      },
      {
        id: 'shavasana',
        nameZh: '摊尸式',
        nameEn: 'Shavasana',
        icon: '😌',
        duration: '180秒',
        props: '毛毯、眼罩',
        description: '仰卧，双腿自然分开，脚尖外八。双臂放于身体两侧，掌心朝上。闭上眼睛，全身放松。可在身体下垫毛毯保暖，或使用眼罩遮光。让身体完全沉入大地，感受佛像般的宁静与安详。'
      }
    ],
    safety: [
      '莲花坐对膝盖要求较高，有不适请使用简易坐',
      '冥想过程中如有头晕请缓慢睁眼',
      '摊尸式时注意保暖，避免着凉',
      '如有高血压，头低于心脏的体式请谨慎'
    ]
  },
  calligraphy: {
    name: '书法',
    icon: '🖌️',
    image: '/static/assets/calligraphy.jpg',
    tagColor: '#2C2C2C',
    story: {
      title: '书法的故事',
      content: '中国书法，是以笔墨为媒介的灵魂之舞。从甲骨文的古朴稚拙，到钟鼎文的庄重浑厚；从王羲之《兰亭序》的飘逸灵动，到颜真卿《祭侄文稿》的悲愤激昂——每一笔每一划，都承载着书写者的情感与品格。书法讲究"意在笔先"，下笔之前，心中已有完整的构图。这种心手合一的境界，与瑜珈中身心合一的追求不谋而合。'
    },
    meditation: {
      title: '静心引导',
      content: '请舒适地坐好，想象你面前铺开一张宣纸，墨香四溢。想象你手持毛笔，蘸满浓墨，准备书写。感受笔尖触纸的那一刻——沉稳、笃定、从容。吸气时，想象笔画在纸上流畅游走；呼气时，让内心的浮躁如墨汁在水中缓缓散去。在这份专注与宁静中，体会"心正则笔正"的深意。'
    },
    yoga: [
      {
        id: 'parvatasana',
        nameZh: '山式（坐姿手臂上举）',
        nameEn: 'Parvatasana',
        icon: '⛰️',
        duration: '60秒',
        props: '瑜伽砖',
        description: '盘腿坐姿，吸气时双臂从体侧上举至头顶，掌心相对。伸展整个侧腰，感受脊柱向上延伸。呼气时双臂缓慢放下。如需辅助可在臀部下垫瑜伽砖。感受手臂如毛笔般挺拔有力。'
      },
      {
        id: 'gomukhasana',
        nameZh: '牛面式手臂',
        nameEn: 'Gomukhasana Arms',
        icon: '🐄',
        duration: '每侧45秒',
        props: '瑜伽带',
        description: '右臂上举弯曲，手肘指向天花板，右手放在背后肩胛骨之间。左臂从下方弯曲，左手抓住右手。如双手无法互握，可使用瑜伽带辅助。感受肩部的打开如书法中的撇捺般舒展。'
      },
      {
        id: 'ustrasana',
        nameZh: '骆驼式',
        nameEn: 'Ustrasana',
        icon: '🐫',
        duration: '45秒',
        props: '瑜伽砖、墙壁',
        description: '跪姿，双膝与髋同宽。双手放在后腰或脚跟上，胸腔向上打开，头部自然后仰。如 flexibility 不足，可将双手放在瑜伽砖上。可靠墙练习增加安全感。感受胸腔如宣纸般展开。'
      },
      {
        id: 'matsyasana',
        nameZh: '鱼式',
        nameEn: 'Matsyasana',
        icon: '🐟',
        duration: '45秒',
        props: '瑜伽砖、毛毯',
        description: '仰卧，在背部放置瑜伽砖支撑（一块在肩胛骨下方，一块在头部下方）。胸腔向上打开，双臂向两侧伸展或放于身体两侧。可在头部下垫毛毯增加舒适度。感受喉部的打开如书法中的横画般舒展。'
      }
    ],
    safety: [
      '后弯体式请量力而行，不要强迫',
      '颈椎不适者头部后仰幅度减小',
      '肩部有伤者牛面式手臂请使用瑜伽带辅助',
      '保持呼吸顺畅，不要在体式中屏气'
    ]
  },
  flower: {
    name: '花鸟画',
    icon: '🌸',
    image: '/static/assets/flower.jpg',
    tagColor: '#E88BA7',
    story: {
      title: '花鸟画的故事',
      content: '中国花鸟画，以花木鸟禽为题材，寄托画者的情怀与哲思。宋代花鸟画追求"写生"的极致真实，一花一叶皆精心描绘；明清文人画则注重"写意"，寥寥数笔便传达出神韵。徐渭的泼墨大写意、八大山人的孤傲白眼、吴昌硕的苍劲古拙——每一幅花鸟画都是画家内心世界的映射。画中一枝梅花，不仅是花，更是坚韧不拔的品格象征。'
    },
    meditation: {
      title: '静心引导',
      content: '请找一个舒适的位置坐好，轻轻闭上眼睛。想象你走进一座宋代园林，庭院中花开满园，鸟鸣声声。一枝海棠从墙头探出，花瓣上还挂着晨露。感受那份自然之美，让这份生机注入你的心灵。吸气时，想象花香充满你的全身；呼气时，让疲惫如落花般轻轻飘落。在这份自然与美好中，感受生命的绽放。'
    },
    yoga: [
      {
        id: 'padangusthasana',
        nameZh: '手抓大脚趾式',
        nameEn: 'Padangusthasana',
        icon: '🦶',
        duration: '60秒',
        props: '瑜伽带',
        description: '站立，双脚与髋同宽。弯腰前屈，用食指和中指抓住大脚趾。吸气时抬头伸展背部，呼气时加深前屈。如够不到脚趾可使用瑜伽带辅助。感受身体如花茎般柔韧延展。'
      },
      {
        id: 'utthita',
        nameZh: '三角式',
        nameEn: 'Utthita Trikonasana',
        icon: '📐',
        duration: '每侧45秒',
        props: '瑜伽砖、墙壁',
        description: '双脚大步分开，前脚朝前。双臂平举，身体向一侧侧弯，下方手放在小腿、脚踝或瑜伽砖上。上方手臂向天花板方向伸展，目光看向上方指尖。可靠墙练习增加稳定。感受侧腰如花瓣般优雅展开。'
      },
      {
        id: 'ardha',
        nameZh: '半月式',
        nameEn: 'Ardha Chandrasana',
        icon: '🌙',
        duration: '每侧30秒',
        props: '瑜伽砖、墙壁',
        description: '从三角式进入，下方手放在瑜伽砖上。重心移至前脚，后脚缓慢抬离地面。身体打开朝向侧面，上方手臂向天花板伸展。如需辅助可靠墙练习。感受身体如新月般轻盈优雅。'
      },
      {
        id: 'malasana',
        nameZh: '花环式',
        nameEn: 'Malasana',
        icon: '💐',
        duration: '60秒',
        props: '瑜伽砖、毛毯',
        description: '双脚与肩同宽或略宽，脚尖外展。缓慢下蹲，双脚脚掌完全踩实地面。双手合十于胸前，肘部轻推膝盖向外打开。如脚跟无法踩地可在脚下垫折叠的毛毯。感受身体如花环般圆满绽放。'
      }
    ],
    safety: [
      '平衡体式请确保周围有足够空间',
      '膝盖下蹲时如疼痛请在脚下垫辅具',
      '侧弯时保持胸腔打开，不要向前倾',
      '头晕时请缓慢起身，避免突然站起'
    ]
  },
  landscape: {
    name: '山水画',
    icon: '🏔️',
    image: '/static/assets/landscape.jpg',
    tagColor: '#5B8C5A',
    story: {
      title: '山水画的故事',
      content: '中国山水画，是文人精神的最高寄托。范宽《溪山行旅图》中巍峨的远山、马远《山径春行图》中留白的意境、倪瓒笔下荒寒的江岸——山水画不追求形似，而追求"气韵生动"。画家以墨色的浓淡干湿表现山石的阴阳向背，以留白营造云雾缥缈的空间感。观山水画，如入山林，如临溪涧，那份超脱尘世的意境，正是中国文人千年不灭的精神家园。'
    },
    meditation: {
      title: '静心引导',
      content: '请舒适地坐好，闭上眼睛。想象你走进一幅宋代山水画中——远处群山叠嶂，云雾缭绕；近处溪水潺潺，松柏苍翠。你站在山间小径上，呼吸着清新的山间空气。感受大自然的壮阔与宁静，让山水的力量浸润你的心灵。吸气时，想象清泉流过心田；呼气时，让烦忧如山间云雾般消散。在这份山水之间，找到内心的自在。'
    },
    yoga: [
      {
        id: 'tadasana_mountain',
        nameZh: '山式',
        nameEn: 'Tadasana',
        icon: '🏔️',
        duration: '60秒',
        props: '瑜伽砖（可选）',
        description: '双脚并拢站立，感受双脚如山基般稳固扎根大地。双腿肌肉收紧，脊柱向上延伸如山峰。双臂自然下垂，掌心朝前。肩膀放松，胸腔打开。感受身体如巍峨山峰般坚定沉稳。可在脚下放瑜伽砖辅助重心。'
      },
      {
        id: 'adho',
        nameZh: '下犬式',
        nameEn: 'Adho Mukha Svanasana',
        icon: '🐕',
        duration: '60秒',
        props: '瑜伽砖、墙壁',
        description: '双手双脚撑地，身体呈倒V字形。手指张开，双手与肩同宽。脚跟尽量踩地（可使用瑜伽砖辅助）。脊柱延展，坐骨向天花板方向推高。如 flexibility 不足可屈膝练习或靠墙练习。感受身体如山脊般舒展。'
      },
      {
        id: 'anjaneyasana',
        nameZh: '低弓步',
        nameEn: 'Anjaneyasana',
        icon: '🏹',
        duration: '每侧45秒',
        props: '瑜伽砖、毛毯',
        description: '右脚前弓步，左膝跪地（可在膝盖下垫毛毯）。双手放在右膝上或向上伸展。髋部下沉，感受髋屈肌的拉伸。可在双手下方放瑜伽砖。感受身体如山谷般开阔舒展。'
      },
      {
        id: 'setubandhasana',
        nameZh: '桥式',
        nameEn: 'Setu Bandhasana',
        icon: '🌉',
        duration: '60秒',
        props: '瑜伽砖',
        description: '仰卧，双膝弯曲，双脚踩地与髋同宽。双脚靠近坐骨。吸气时抬起髋部，胸腔打开。可在骶骨下方放置瑜伽砖支撑。双手自然放于身体两侧或撑住腰部。感受身体如拱桥般稳固有力。'
      }
    ],
    safety: [
      '下犬式时手腕不适可在前臂下垫毛毯或使用前臂支撑',
      '弓步时后膝不适请垫毛毯保护',
      '桥式时颈部放松，不要转头',
      '高血压者避免头部低于心脏的体式'
    ]
  },
  textile: {
    name: '丝绸织物',
    icon: '🧵',
    image: '/static/assets/textile.jpg',
    tagColor: '#C75B7A',
    story: {
      title: '丝绸织物',
      content: '中国丝绸，是世界上最古老的纺织奇迹。从嫘祖养蚕缫丝的传说，到丝绸之路上的驼铃声声，丝绸承载着中华文明最柔美的记忆。一件精美的缂丝作品，匠人可能需要数月甚至数年才能完成——每一根丝线都经过精心安排，正反两面呈现不同的图案。丝绸之美，在于它的轻盈如梦，在于它的光泽流转，更在于它背后那份经年累月的耐心与执着。'
    },
    meditation: {
      title: '静心引导',
      content: '请找一个舒适的坐姿，轻轻闭上眼睛。想象你手中有一匹上好的丝绸，触感柔滑细腻，在光线下泛着温润的光泽。感受那份柔软与细腻，让这种温柔的力量包裹你的全身。吸气时，想象丝绸般的光滑能量流过你的身体；呼气时，让紧张如丝线般一根根松开。在这份柔美与宁静中，感受身心的柔软与放松。'
    },
    yoga: [
      {
        id: 'supta',
        nameZh: '仰卧束角式',
        nameEn: 'Supta Baddha Konasana',
        icon: '🦋',
        duration: '120秒',
        props: '瑜伽砖、抱枕、毛毯',
        description: '仰卧，双脚脚掌相对，膝盖向两侧打开。在背部下方放置抱枕支撑，头部垫毛毯。可在膝盖下各放一个瑜伽砖。双臂自然放于身体两侧，掌心朝上。感受全身如丝绸般柔软放松。'
      },
      {
        id: 'janusirshasana',
        nameZh: '头碰膝式',
        nameEn: 'Janu Sirsasana',
        icon: '🧎',
        duration: '每侧60秒',
        props: '瑜伽砖、瑜伽带、毛毯',
        description: '坐姿，右腿弯曲，右脚掌抵于左大腿内侧。左腿伸直。从髋部前屈，双手向左脚方向伸展。可使用瑜伽带辅助，或在额头下垫瑜伽砖。可在臀部下垫毛毯。感受侧腰如丝线般柔韧延展。'
      },
      {
        id: 'upavistha_konasana',
        nameZh: '坐角式',
        nameEn: 'Upavistha Konasana',
        icon: '🦢',
        duration: '90秒',
        props: '瑜伽砖、抱枕',
        description: '坐姿，双腿向两侧打开。从髋部缓慢前屈，双手向前伸展。可在前方放置抱枕支撑上半身，或在膝盖下垫瑜伽砖。感受双腿如丝绸般柔软展开。'
      },
      {
        id: 'viparita',
        nameZh: '倒箭式',
        nameEn: 'Viparita Karani',
        icon: '🏹',
        duration: '120秒',
        props: '瑜伽砖、墙壁、毛毯',
        description: '臀部靠近墙壁，双腿向上靠在墙上，身体呈L形。可在骶骨下方放瑜伽砖，腰部垫毛毯。双臂自然放于身体两侧，掌心朝上。闭上眼睛，感受双腿的轻松与血液的回流。'
      }
    ],
    safety: [
      '开髋体式请循序渐进，不要强迫',
      '倒箭式时如有颈部不适请调整支撑高度',
      '膝盖不适时请在膝盖下垫辅具',
      '经期倒箭式可适当缩短时间'
    ]
  },
  furniture: {
    name: '古典家具',
    icon: '🪑',
    image: '/static/assets/furniture.jpg',
    tagColor: '#8B4513',
    story: {
      title: '古典家具的故事',
      content: '中国古典家具，以明式家具为巅峰。一件明式圈椅，线条简洁流畅，结构精密严谨，不用一钉一铆，仅靠榫卯结构便能历经数百年而不散。黄花梨的温润纹理、紫檀的深沉色泽——每一种木材都有其独特的性格。匠人因材施艺，将木材天然的美感发挥到极致。古典家具之美，在于它的实用与审美的完美统一，在于它对"少即是多"的深刻诠释。'
    },
    meditation: {
      title: '静心引导',
      content: '请找一个舒适的坐姿，闭上眼睛。想象你坐在一把古老的明式圈椅上，椅面光滑温润，椅背弧度完美贴合你的脊柱。感受那份被恰到好处地支撑与包裹的舒适感。吸气时，感受脊柱如椅背般挺拔；呼气时，让身体如坐于圈椅般安定放松。在这份安定与支撑中，感受内心的踏实与从容。'
    },
    yoga: [
      {
        id: 'dandasana',
        nameZh: '手杖式',
        nameEn: 'Dandasana',
        icon: '📏',
        duration: '60秒',
        props: '瑜伽砖、毛毯',
        description: '坐姿，双腿向前伸直并拢。脊柱挺直，双手放在臀部两侧的地面上，指尖朝前。胸腔打开，肩膀放松。如背部无法挺直可在臀部下垫瑜伽砖或毛毯。感受脊柱如椅背般挺拔有力。'
      },
      {
        id: 'purvottanasana',
        nameZh: '反板式',
        nameEn: 'Purvottanasana',
        icon: '🔄',
        duration: '30秒',
        props: '椅子、瑜伽砖',
        description: '坐姿，双腿伸直，双手放在身后约30厘米处，指尖朝前。吸气时抬起髋部，身体呈桌面状。如力量不足可在双手下方放椅子或瑜伽砖。感受身体如家具般稳固端正。'
      },
      {
        id: 'bhujangasana',
        nameZh: '眼镜蛇式',
        nameEn: 'Bhujangasana',
        icon: '🐍',
        duration: '45秒',
        props: '椅子',
        description: '俯卧，双手放在胸部两侧。吸气时抬起胸腔，手臂微弯。目光看向天花板方向。如背部力量不足，可将双手放在椅子坐面上辅助。感受脊柱如家具弧线般优雅延展。'
      },
      {
        id: 'salabhasana',
        nameZh: '蝗虫式',
        nameEn: 'Salabhasana',
        icon: '🦗',
        duration: '30秒',
        props: '椅子、毛毯',
        description: '俯卧，双手放于身体两侧。吸气时同时抬起双腿、胸腔和双手。可在椅子边缘练习，上半身搭在椅面上减轻负担。可在腹部下垫毛毯保护。感受背部如家具结构般坚实有力。'
      }
    ],
    safety: [
      '后弯体式请量力而行，不要强迫脊柱',
      '手腕不适时请使用辅具减轻手腕压力',
      '俯卧体式时注意保护腰椎',
      '如有腰椎间盘问题请谨慎后弯'
    ]
  }
}

/**
 * 根据主题key获取主题数据
 * @param {string} themeKey - 主题key
 * @returns {object} 主题数据
 */
export function getThemeData(themeKey) {
  return themes[themeKey] || themes.bronze
}

/**
 * 获取所有主题列表
 * @returns {Array} 主题列表
 */
export function getThemeList() {
  return Object.keys(themes).map(key => ({
    key,
    ...themes[key]
  }))
}

/**
 * 生成卡片数据
 * @param {string} themeKey - 主题key
 * @param {object} options - 配置选项
 * @returns {object} 卡片数据
 */
export function generateCard(themeKey, options = {}) {
  const theme = getThemeData(themeKey)
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

  return {
    id: `card_${Date.now()}`,
    date: dateStr,
    theme: themeKey,
    themeName: theme.name,
    themeIcon: theme.icon,
    image: theme.image,
    tagColor: theme.tagColor,
    duration: options.duration || '20分钟',
    bodyState: options.bodyState || '日常放松',
    story: theme.story,
    meditation: theme.meditation,
    yoga: theme.yoga,
    safety: theme.safety,
    feeling: '',
    createdAt: today.toISOString()
  }
}

// 兼容导出：主题列表（数组格式，供页面遍历使用）
export const themeList = getThemeList()

// 身体状态选项
export const statuses = [
  '精神不错', '肩颈紧', '腰背酸', '睡眠一般', '有点疲劳',
  '心情平静', '工作压力大', '元气满满', '充满期待',
  '身心轻盈', '能量充足', '状态在线', '享受当下'
]

// 练习时长选项
export const durations = [
  { id: '5', name: '5分钟', icon: '⏱️' },
  { id: '10', name: '10分钟', icon: '⏲️' },
  { id: '15', name: '15分钟', icon: '🕐' }
]

// 卡片模板（兼容旧格式引用）
export const cardTemplates = themes
