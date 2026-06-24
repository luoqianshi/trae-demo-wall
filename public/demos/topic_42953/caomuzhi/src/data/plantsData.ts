import { Plant } from '@/types';
import { getPlantImageUrl } from '@/utils/imageUtils';

const generateImageUrl = (name: string, index: number = 1): string => {
  return getPlantImageUrl(name, index, 800, 600);
};

export const plantsData: Plant[] = [
  {
    id: 1,
    name: "银杏",
    latinName: "Ginkgo biloba",
    aliases: ["白果树", "公孙树", "鸭脚树"],
    family: "银杏科",
    genus: "银杏属",
    category: "乔木",
    tags: ["药用", "观赏", "行道树"],
    image: generateImageUrl("ginkgo"),
    images: [generateImageUrl("ginkgo", 1), generateImageUrl("ginkgo", 2), generateImageUrl("ginkgo", 3)],
    overview: {
      description: "银杏是现存种子植物中最古老的孑遗植物，被称为\"活化石\"。",
      habitat: "喜温暖湿润气候，耐寒性强，耐旱，对土壤适应性强",
      distribution: "中国特有，广泛栽培于世界各地",
      features: "落叶大乔木，树皮灰褐色，叶片扇形，秋季变黄",
      floweringPeriod: "3-4月"
    },
    value: {
      medicinal: "叶提取物用于改善心脑血管循环，治疗记忆力衰退",
      edible: "种仁可食用，需去毒处理，不可多食",
      ecological: "抗污染能力强，是优良的行道树和庭荫树",
      ornamental: "树形优美，秋叶金黄，极具观赏价值"
    },
    culture: {
      meaning: "长寿、坚韧、永恒的爱",
      poem: "满地翻黄银杏叶，忽惊天地告成功 —— 王安石",
      story: "银杏寿命极长，中国有数千年树龄的银杏树，被视为长寿象征"
    },
    ancient: {
      benCaoGangMu: {
        original: "银杏，生食引疳解酒，熟食益人，温肺益气，定喘嗽，缩小便，止白浊。",
        translation: "银杏生着吃可以驱虫解酒，煮熟食用对人有益，能温养肺部、补益气血、平定咳嗽、减少小便、止住白带。",
        usage: "熟食温肺益气，生食降痰解酒",
        volume: "果部"
      },
      shenNongBenCao: {
        original: "（神农本草经未单独记载银杏，明代始入本草）",
        grade: "",
        property: "甘、苦、涩，平，有毒",
        efficacy: "敛肺定喘，止带缩尿"
      }
    }
  },
  {
    id: 2,
    name: "人参",
    latinName: "Panax ginseng",
    aliases: ["神草", "地精", "黄精"],
    family: "五加科",
    genus: "人参属",
    category: "草本",
    tags: ["药用", "珍稀"],
    image: generateImageUrl("ginseng"),
    images: [generateImageUrl("ginseng", 1), generateImageUrl("ginseng", 2)],
    overview: {
      description: "人参是五加科人参属植物的干燥根和根茎，被誉为\"百草之王\"。",
      habitat: "喜阴凉湿润气候，耐寒，适宜生长在排水良好的肥沃土壤",
      distribution: "主产中国东北吉林、辽宁、黑龙江等地",
      features: "多年生草本，主根肉质，圆柱形或纺锤形，须根细长",
      floweringPeriod: "5-6月"
    },
    value: {
      medicinal: "大补元气，复脉固脱，益气摄血，用于体虚欲脱等",
      edible: "可煲汤、泡茶、泡酒，需遵医嘱适量食用",
      ecological: "野生人参已列为国家保护植物",
      ornamental: "叶片掌状复叶，形态优美"
    },
    culture: {
      meaning: "长寿、健康、吉祥",
      poem: "人参生北方，名重医家用 —— 李时珍",
      story: "人参在古代被视为神药，传说可以起死回生"
    },
    ancient: {
      benCaoGangMu: {
        original: "人参，味甘微寒，主补五脏，安精神，定魂魄，止惊悸，除邪气，明目，开心益智。",
        translation: "人参味道甘甜，性微寒。主要功效是滋补五脏、安定精神、稳定魂魄、止住惊慌心悸、驱除病邪、明亮眼睛、愉悦心情、增强智力。",
        usage: "煎汤内服，3-9克",
        volume: "草部"
      },
      shenNongBenCao: {
        original: "人参，味甘微寒。主补五脏，安精神，定魂魄，止惊悸，除邪气，明目，开心益智。久服，轻身延年。",
        grade: "上品",
        property: "甘、微寒",
        efficacy: "大补元气，复脉固脱"
      }
    }
  },
  {
    id: 3,
    name: "玫瑰",
    latinName: "Rosa rugosa",
    aliases: ["刺玫花", "徘徊花", "刺客"],
    family: "蔷薇科",
    genus: "蔷薇属",
    category: "花卉",
    tags: ["观赏", "药用", "芳香"],
    image: generateImageUrl("rose"),
    images: [generateImageUrl("rose", 1), generateImageUrl("rose", 2), generateImageUrl("rose", 3)],
    overview: {
      description: "玫瑰是蔷薇科蔷薇属的落叶灌木，花朵艳丽，香气浓郁。",
      habitat: "喜阳光充足，耐寒，耐旱，适宜排水良好的土壤",
      distribution: "原产中国，世界各地广泛栽培",
      features: "茎密生刺，奇数羽状复叶，花单生或簇生",
      floweringPeriod: "5-6月"
    },
    value: {
      medicinal: "理气解郁，活血散瘀，用于肝胃气痛，食少呕恶",
      edible: "花瓣可泡茶、制作果酱、玫瑰酒",
      ecological: "蜜源植物，吸引蜜蜂和蝴蝶",
      ornamental: "花色丰富，花型优美，是著名的观赏花卉"
    },
    culture: {
      meaning: "爱情、热情、美丽",
      poem: "赠人玫瑰，手有余香",
      story: "玫瑰在西方文化中象征爱情，情人节必备花卉"
    },
    ancient: {
      benCaoGangMu: {
        original: "玫瑰，气味甘香，性温。理气解郁，活血散瘀。",
        translation: "玫瑰气味甘甜芳香，性温。主要功效是理气解郁、活血散瘀。",
        usage: "泡茶或煎汤",
        volume: "花部"
      }
    }
  },
  {
    id: 4,
    name: "薄荷",
    latinName: "Mentha haplocalyx",
    aliases: ["银丹草", "夜息香"],
    family: "唇形科",
    genus: "薄荷属",
    category: "草本",
    tags: ["药用", "食用", "芳香"],
    image: generateImageUrl("mint"),
    images: [generateImageUrl("mint", 1), generateImageUrl("mint", 2)],
    overview: {
      description: "薄荷是唇形科薄荷属植物，具有清凉芳香的气味。",
      habitat: "喜温暖湿润环境，适应性强，易于种植",
      distribution: "原产欧洲，中国各地均有栽培",
      features: "多年生草本，茎直立，叶对生，有清凉香气",
      floweringPeriod: "7-9月"
    },
    value: {
      medicinal: "疏散风热，清利头目，利咽，透疹，疏肝行气",
      edible: "可泡茶、烹饪调味、制作薄荷糖",
      ecological: "蜜源植物，驱蚊效果好",
      ornamental: "叶片翠绿，香气清新"
    },
    culture: {
      meaning: "清新、凉爽、活力",
      poem: "薄荷花开蝶翅翻，风枝露叶弄秋妍 —— 杨万里",
      story: "薄荷在古代被用于提神醒脑，是重要的药材和香料"
    },
    ancient: {
      benCaoGangMu: {
        original: "薄荷，气温，味辛，无毒。主贼风伤寒，发汗，恶气，心腹胀满，霍乱，宿食不消，下气。",
        translation: "薄荷性温，味辛，无毒。主要治疗外感风寒、发汗、驱除恶气、心腹胀满、霍乱、消化不良、下气。",
        usage: "煎汤或泡茶",
        volume: "草部"
      },
      shenNongBenCao: {
        original: "薄荷，味辛温。主贼风伤寒，发汗，恶气，心腹胀满，霍乱，宿食不消，下气。",
        grade: "中品",
        property: "辛、温",
        efficacy: "疏散风热，清利头目"
      }
    }
  },
  {
    id: 5,
    name: "菊花",
    latinName: "Chrysanthemum morifolium",
    aliases: ["黄花", "寿客", "秋菊"],
    family: "菊科",
    genus: "菊属",
    category: "花卉",
    tags: ["观赏", "药用", "食用"],
    image: generateImageUrl("chrysanthemum"),
    images: [generateImageUrl("chrysanthemum", 1), generateImageUrl("chrysanthemum", 2), generateImageUrl("chrysanthemum", 3)],
    overview: {
      description: "菊花是菊科菊属植物，为中国传统名花之一。",
      habitat: "喜阳光充足，耐寒，适宜肥沃疏松的土壤",
      distribution: "原产中国，世界各地广泛栽培",
      features: "多年生草本，头状花序，花色丰富",
      floweringPeriod: "9-11月"
    },
    value: {
      medicinal: "散风清热，平肝明目，清热解毒",
      edible: "可泡茶、煮粥、制作菊花酒",
      ecological: "蜜源植物，秋季重要花卉",
      ornamental: "花型多样，色彩丰富，是著名观赏花卉"
    },
    culture: {
      meaning: "高洁、长寿、吉祥",
      poem: "采菊东篱下，悠然见南山 —— 陶渊明",
      story: "菊花在中国文化中象征高洁，重阳节有赏菊的传统"
    },
    ancient: {
      benCaoGangMu: {
        original: "菊花，味苦甘，性微寒。主风眩，头肿痛，目欲脱，泪出，皮肤死肌，恶风，湿痹。",
        translation: "菊花味苦甘，性微寒。主要治疗风眩、头部肿痛、眼睛干涩欲脱、流泪、皮肤麻木、恶风、湿痹。",
        usage: "泡茶或煎汤",
        volume: "花部"
      },
      shenNongBenCao: {
        original: "菊花，味苦甘平。主风头眩，肿痛，目欲脱，泪出，皮肤死肌，恶风，湿痹。",
        grade: "上品",
        property: "苦、甘、微寒",
        efficacy: "散风清热，平肝明目"
      }
    }
  },
  {
    id: 6,
    name: "竹子",
    latinName: "Bambusoideae",
    aliases: ["竹", "君子竹", "岁寒三友"],
    family: "禾本科",
    genus: "竹属",
    category: "竹类",
    tags: ["观赏", "材用", "食用"],
    image: generateImageUrl("bamboo"),
    images: [generateImageUrl("bamboo", 1), generateImageUrl("bamboo", 2), generateImageUrl("bamboo", 3)],
    overview: {
      description: "竹子是禾本科竹亚科植物，生长迅速，用途广泛。",
      habitat: "喜温暖湿润气候，适应性强",
      distribution: "主要分布在亚洲热带和亚热带地区",
      features: "多年生常绿植物，茎中空，有节",
      floweringPeriod: "不定期"
    },
    value: {
      medicinal: "竹叶清热除烦，生津利尿；竹茹清热化痰",
      edible: "竹笋可食用，营养丰富",
      ecological: "保持水土，净化空气",
      ornamental: "姿态优美，四季常青，是重要的园林植物"
    },
    culture: {
      meaning: "君子、正直、坚韧",
      poem: "咬定青山不放松，立根原在破岩中 —— 郑板桥",
      story: "竹子与梅、松并称\"岁寒三友\"，象征君子品格"
    },
    ancient: {
      benCaoGangMu: {
        original: "竹，味苦，性寒。主咳逆上气，溢筋，急恶疡，杀小虫。",
        translation: "竹子味苦，性寒。主要治疗咳嗽气喘、筋脉拘挛、恶疮、杀虫。",
        usage: "竹叶煎汤",
        volume: "木部"
      }
    }
  },
  {
    id: 7,
    name: "桂花",
    latinName: "Osmanthus fragrans",
    aliases: ["木犀", "岩桂", "九里香"],
    family: "木犀科",
    genus: "木犀属",
    category: "灌木",
    tags: ["观赏", "芳香", "食用"],
    image: generateImageUrl("osmanthus"),
    images: [generateImageUrl("osmanthus", 1), generateImageUrl("osmanthus", 2)],
    overview: {
      description: "桂花是木犀科木犀属植物，香气浓郁，是中国传统名花。",
      habitat: "喜温暖湿润气候，耐寒，适宜肥沃土壤",
      distribution: "原产中国，广泛栽培于南方各地",
      features: "常绿灌木或小乔木，花小而密集，香气浓郁",
      floweringPeriod: "9-10月"
    },
    value: {
      medicinal: "化痰止咳，暖胃止痛",
      edible: "可制作桂花糕、桂花酒、桂花茶",
      ecological: "蜜源植物，香气可净化空气",
      ornamental: "树形优美，花香四溢"
    },
    culture: {
      meaning: "富贵、吉祥、团圆",
      poem: "桂子月中落，天香云外飘 —— 宋之问",
      story: "桂花象征富贵吉祥，中秋节有赏桂的传统"
    },
    ancient: {
      benCaoGangMu: {
        original: "桂花，气温，味辛甘，无毒。主温中散寒，暖胃止痛，化痰止咳。",
        translation: "桂花性温，味辛甘，无毒。主要功效是温中散寒、暖胃止痛、化痰止咳。",
        usage: "泡茶或煮粥",
        volume: "花部"
      }
    }
  },
  {
    id: 8,
    name: "枸杞",
    latinName: "Lycium chinense",
    aliases: ["苟起子", "甜菜子", "地骨子"],
    family: "茄科",
    genus: "枸杞属",
    category: "灌木",
    tags: ["药用", "食用"],
    image: generateImageUrl("goji"),
    images: [generateImageUrl("goji", 1), generateImageUrl("goji", 2)],
    overview: {
      description: "枸杞是茄科枸杞属植物，果实红色，营养丰富。",
      habitat: "喜阳光充足，耐寒耐旱，适应性强",
      distribution: "主产中国西北各省",
      features: "落叶灌木，浆果卵形，红色",
      floweringPeriod: "6-7月"
    },
    value: {
      medicinal: "滋补肝肾，益精明目",
      edible: "可直接食用、泡茶、煲汤",
      ecological: "耐旱植物，适合沙漠绿化",
      ornamental: "果实鲜红，观赏性强"
    },
    culture: {
      meaning: "长寿、健康",
      poem: "枸杞实甘平，滋肾益精名 —— 李时珍",
      story: "枸杞在古代被视为长寿之果，道家常用作养生"
    },
    ancient: {
      benCaoGangMu: {
        original: "枸杞，味苦寒。主五内邪气，热中消渴，周痹。久服，坚筋骨，轻身不老。",
        translation: "枸杞味苦性寒。主要治疗五脏邪气、内热消渴、周身痹痛。长期服用，可强健筋骨、轻身不老。",
        usage: "煎汤或生食",
        volume: "木部"
      },
      shenNongBenCao: {
        original: "枸杞，味苦寒。主五内邪气，热中消渴，周痹。久服，坚筋骨，轻身不老。",
        grade: "上品",
        property: "苦、寒",
        efficacy: "滋补肝肾，益精明目"
      }
    }
  },
  {
    id: 9,
    name: "牡丹",
    latinName: "Paeonia suffruticosa",
    aliases: ["花王", "富贵花", "洛阳花"],
    family: "毛茛科",
    genus: "芍药属",
    category: "花卉",
    tags: ["观赏", "药用"],
    image: generateImageUrl("peony"),
    images: [generateImageUrl("peony", 1), generateImageUrl("peony", 2), generateImageUrl("peony", 3)],
    overview: {
      description: "牡丹是毛茛科芍药属植物，花朵硕大，色彩艳丽，被誉为\"花中之王\"。",
      habitat: "喜阳光充足，耐寒，适宜肥沃排水良好的土壤",
      distribution: "原产中国，以河南洛阳、山东菏泽最为著名",
      features: "落叶灌木，花单生枝顶，花型多样",
      floweringPeriod: "4-5月"
    },
    value: {
      medicinal: "清热凉血，活血化瘀",
      edible: "花瓣可食用，制作牡丹糕",
      ecological: "蜜源植物",
      ornamental: "花型优美，色彩丰富，是中国传统名花"
    },
    culture: {
      meaning: "富贵、吉祥、繁荣",
      poem: "唯有牡丹真国色，花开时节动京城 —— 刘禹锡",
      story: "牡丹在中国文化中象征富贵，唐代最为盛行"
    },
    ancient: {
      benCaoGangMu: {
        original: "牡丹，味辛寒。主寒热，中风瘈疭，痉，惊痫，邪气，除症坚瘀血留舍肠胃，安五脏，疗痈疮。",
        translation: "牡丹味辛寒。主要治疗寒热往来、中风抽搐、痉挛、惊痫、邪气、瘀血积聚、安定五脏、治疗痈疮。",
        usage: "煎汤内服",
        volume: "草部"
      },
      shenNongBenCao: {
        original: "牡丹，味辛寒。主寒热，中风瘈疭，痉，惊痫，邪气，除症坚瘀血留舍肠胃，安五脏，疗痈疮。",
        grade: "中品",
        property: "辛、寒",
        efficacy: "清热凉血，活血化瘀"
      }
    }
  },
  {
    id: 10,
    name: "松树",
    latinName: "Pinus",
    aliases: ["青松", "松柏", "岁寒三友"],
    family: "松科",
    genus: "松属",
    category: "乔木",
    tags: ["观赏", "材用", "药用"],
    image: generateImageUrl("pine"),
    images: [generateImageUrl("pine", 1), generateImageUrl("pine", 2), generateImageUrl("pine", 3)],
    overview: {
      description: "松树是松科松属植物，四季常青，生命力顽强。",
      habitat: "喜阳光充足，耐寒耐旱，适应性强",
      distribution: "广泛分布于北半球",
      features: "常绿乔木，针叶束生，球果卵形",
      floweringPeriod: "3-5月"
    },
    value: {
      medicinal: "松针可祛风活血，安神明目",
      edible: "松子可食用，营养丰富",
      ecological: "保持水土，防风固沙",
      ornamental: "树形优美，四季常青"
    },
    culture: {
      meaning: "坚韧、长寿、不屈",
      poem: "大雪压青松，青松挺且直 —— 陈毅",
      story: "松树与梅、竹并称\"岁寒三友\"，象征坚韧不拔的精神"
    },
    ancient: {
      benCaoGangMu: {
        original: "松，味苦温。主风湿痹痛，生肌止痛，明目安神。",
        translation: "松树味苦温。主要治疗风湿痹痛、生肌止痛、明目安神。",
        usage: "松针煎汤或泡茶",
        volume: "木部"
      }
    }
  },
  {
    id: 11,
    name: "梧桐",
    latinName: "Firmiana simplex",
    aliases: ["青桐", "中国梧桐"],
    family: "梧桐科",
    genus: "梧桐属",
    category: "乔木",
    tags: ["观赏", "行道树"],
    image: generateImageUrl("wutong"),
    images: [generateImageUrl("wutong", 1), generateImageUrl("wutong", 2)],
    overview: {
      description: "梧桐是梧桐科梧桐属植物，树干端直，叶大优美。",
      habitat: "喜温暖湿润气候，耐寒性较强",
      distribution: "原产中国，广泛栽培",
      features: "落叶乔木，树皮青绿色，叶掌状分裂",
      floweringPeriod: "6-7月"
    },
    value: {
      medicinal: "树皮可祛风除湿，清热解毒",
      edible: "种子可食用",
      ecological: "优良的行道树和庭荫树",
      ornamental: "树形优美，叶大荫浓"
    },
    culture: {
      meaning: "高洁、吉祥",
      poem: "梧桐更兼细雨，到黄昏、点点滴滴 —— 李清照",
      story: "梧桐在中国文化中象征高洁，有\"凤凰栖梧桐\"的传说"
    },
    ancient: {
      benCaoGangMu: {
        original: "梧桐，味甘平。主祛风除湿，清热解毒，健脾消食。",
        translation: "梧桐味甘平。主要功效是祛风除湿、清热解毒、健脾消食。",
        usage: "树皮煎汤",
        volume: "木部"
      }
    }
  },
  {
    id: 12,
    name: "枫树",
    latinName: "Acer",
    aliases: ["槭树", "红叶"],
    family: "槭树科",
    genus: "槭属",
    category: "乔木",
    tags: ["观赏", "材用"],
    image: generateImageUrl("maple"),
    images: [generateImageUrl("maple", 1), generateImageUrl("maple", 2), generateImageUrl("maple", 3)],
    overview: {
      description: "枫树是槭树科槭属植物，秋季红叶艳丽。",
      habitat: "喜阳光充足，适应性强",
      distribution: "广泛分布于北半球",
      features: "落叶乔木，叶掌状分裂，秋季变红",
      floweringPeriod: "4-5月"
    },
    value: {
      medicinal: "根可祛风止痛",
      edible: "嫩叶可食用",
      ecological: "优良的观赏树",
      ornamental: "秋季红叶美不胜收"
    },
    culture: {
      meaning: "热情、思念",
      poem: "停车坐爱枫林晚，霜叶红于二月花 —— 杜牧",
      story: "枫叶象征秋天，也是加拿大的国树"
    }
  },
  {
    id: 13,
    name: "榕树",
    latinName: "Ficus microcarpa",
    aliases: ["细叶榕", "万年青"],
    family: "桑科",
    genus: "榕属",
    category: "乔木",
    tags: ["观赏", "行道树"],
    image: generateImageUrl("banyan"),
    images: [generateImageUrl("banyan", 1), generateImageUrl("banyan", 2)],
    overview: {
      description: "榕树是桑科榕属植物，树形庞大，气根发达。",
      habitat: "喜温暖湿润气候，不耐寒",
      distribution: "主要分布在热带和亚热带地区",
      features: "常绿乔木，树冠庞大，气根下垂",
      floweringPeriod: "5-6月"
    },
    value: {
      medicinal: "气根可祛风清热，活血解毒",
      edible: "果实可食用",
      ecological: "优良的行道树和庭荫树",
      ornamental: "树形奇特，极具观赏价值"
    },
    culture: {
      meaning: "长寿、繁荣",
      poem: "榕树参天须拂地，菩提荫浓叶蔽天",
      story: "榕树生命力旺盛，象征长寿和繁荣"
    }
  },
  {
    id: 14,
    name: "樟树",
    latinName: "Cinnamomum camphora",
    aliases: ["香樟", "樟木"],
    family: "樟科",
    genus: "樟属",
    category: "乔木",
    tags: ["观赏", "材用", "药用"],
    image: generateImageUrl("camphor"),
    images: [generateImageUrl("camphor", 1), generateImageUrl("camphor", 2)],
    overview: {
      description: "樟树是樟科樟属植物，香气浓郁，材质优良。",
      habitat: "喜温暖湿润气候，耐寒性较强",
      distribution: "主要分布在长江以南各省",
      features: "常绿乔木，树皮黄褐色，有樟脑香气",
      floweringPeriod: "4-5月"
    },
    value: {
      medicinal: "樟脑可通窍辟秽，温中止痛",
      edible: "樟叶可提取香料",
      ecological: "优良的行道树，抗污染能力强",
      ornamental: "树形优美，四季常青"
    },
    culture: {
      meaning: "坚韧、长寿",
      poem: "樟树参天覆地浓，四时不改绿葱葱",
      story: "樟树是江南地区常见的行道树，象征坚韧不拔"
    },
    ancient: {
      benCaoGangMu: {
        original: "樟，味辛温。主心腹冷痛，霍乱吐泻，杀虫止痒。",
        translation: "樟树味辛温。主要治疗心腹冷痛、霍乱吐泻、杀虫止痒。",
        usage: "樟脑外用",
        volume: "木部"
      }
    }
  },
  {
    id: 15,
    name: "柳树",
    latinName: "Salix",
    aliases: ["杨柳", "垂柳"],
    family: "杨柳科",
    genus: "柳属",
    category: "乔木",
    tags: ["观赏", "行道树"],
    image: generateImageUrl("willow"),
    images: [generateImageUrl("willow", 1), generateImageUrl("willow", 2), generateImageUrl("willow", 3)],
    overview: {
      description: "柳树是杨柳科柳属植物，枝条柔软下垂，姿态优美。",
      habitat: "喜温暖湿润气候，耐水湿",
      distribution: "广泛分布于北半球",
      features: "落叶乔木，枝条柔软，叶狭长",
      floweringPeriod: "3-4月"
    },
    value: {
      medicinal: "柳枝可祛风利湿，消肿止痛",
      edible: "嫩芽可食用",
      ecological: "优良的护岸树种",
      ornamental: "枝条垂拂，姿态优美"
    },
    culture: {
      meaning: "柔美、思念",
      poem: "碧玉妆成一树高，万条垂下绿丝绦 —— 贺知章",
      story: "柳树在中国文化中象征柔美，折柳送别是传统习俗"
    },
    ancient: {
      benCaoGangMu: {
        original: "柳，味苦寒。主祛风利湿，消肿止痛，清热解毒。",
        translation: "柳树味苦寒。主要功效是祛风利湿、消肿止痛、清热解毒。",
        usage: "柳枝煎汤",
        volume: "木部"
      }
    }
  },
  {
    id: 16,
    name: "杨树",
    latinName: "Populus",
    aliases: ["白杨", "胡杨"],
    family: "杨柳科",
    genus: "杨属",
    category: "乔木",
    tags: ["材用", "防风"],
    image: generateImageUrl("poplar"),
    images: [generateImageUrl("poplar", 1), generateImageUrl("poplar", 2)],
    overview: {
      description: "杨树是杨柳科杨属植物，生长迅速，适应性强。",
      habitat: "喜阳光充足，耐寒耐旱",
      distribution: "广泛分布于北半球",
      features: "落叶乔木，树干通直，叶片宽大",
      floweringPeriod: "3-4月"
    },
    value: {
      medicinal: "树皮可祛风利湿，消肿止痛",
      edible: "嫩叶可食用",
      ecological: "优良的防风固沙树种",
      ornamental: "树形挺拔"
    },
    culture: {
      meaning: "正直、向上",
      poem: "白杨多悲风，萧萧愁杀人 —— 《古诗十九首》",
      story: "杨树象征正直向上，是北方常见的绿化树种"
    }
  },
  {
    id: 17,
    name: "槐树",
    latinName: "Sophora japonica",
    aliases: ["国槐", "家槐"],
    family: "豆科",
    genus: "槐属",
    category: "乔木",
    tags: ["观赏", "行道树", "药用"],
    image: generateImageUrl("locust"),
    images: [generateImageUrl("locust", 1), generateImageUrl("locust", 2)],
    overview: {
      description: "槐树是豆科槐属植物，树形端正，是中国传统的庭院树。",
      habitat: "喜阳光充足，耐寒，适应性强",
      distribution: "原产中国，广泛栽培",
      features: "落叶乔木，树皮灰褐色，圆锥花序",
      floweringPeriod: "6-8月"
    },
    value: {
      medicinal: "槐花可凉血止血，清肝泻火",
      edible: "槐花可食用，制作槐花糕",
      ecological: "优良的行道树",
      ornamental: "树形端正，花白色芳香"
    },
    culture: {
      meaning: "吉祥、长寿",
      poem: "槐树荫中开野径，芭蕉叶上见秋光",
      story: "槐树在中国文化中象征吉祥，是传统的庭院树"
    },
    ancient: {
      benCaoGangMu: {
        original: "槐，味苦平。主五内邪气热，止涎唾，补绝伤，五痔，火疮，妇人乳瘕，子藏急痛。",
        translation: "槐树味苦平。主要治疗五脏邪气热、止涎唾、补绝伤、痔疮、火疮、妇人乳房肿块、子宫急痛。",
        usage: "槐花煎汤",
        volume: "木部"
      },
      shenNongBenCao: {
        original: "槐实，味苦酸咸寒。主五内邪气热，止涎唾，补绝伤，五痔，火疮，妇人乳瘕，子藏急痛。",
        grade: "上品",
        property: "苦、酸、咸、寒",
        efficacy: "凉血止血，清肝泻火"
      }
    }
  },
  {
    id: 18,
    name: "月季",
    latinName: "Rosa chinensis",
    aliases: ["月月红", "长春花"],
    family: "蔷薇科",
    genus: "蔷薇属",
    category: "花卉",
    tags: ["观赏", "药用"],
    image: generateImageUrl("chinese_rose"),
    images: [generateImageUrl("chinese_rose", 1), generateImageUrl("chinese_rose", 2), generateImageUrl("chinese_rose", 3)],
    overview: {
      description: "月季是蔷薇科蔷薇属植物，花期长，被誉为\"花中皇后\"。",
      habitat: "喜阳光充足，耐寒，适应性强",
      distribution: "原产中国，世界各地广泛栽培",
      features: "落叶或半常绿灌木，花大色艳，四季开花",
      floweringPeriod: "全年"
    },
    value: {
      medicinal: "活血调经，消肿解毒",
      edible: "花瓣可食用",
      ecological: "蜜源植物",
      ornamental: "花大色艳，花期长"
    },
    culture: {
      meaning: "美丽、爱情、永恒",
      poem: "只道花无十日红，此花无日不春风 —— 杨万里",
      story: "月季是中国十大名花之一，象征永恒的爱情"
    },
    ancient: {
      benCaoGangMu: {
        original: "月季，味甘温。主活血调经，消肿解毒。",
        translation: "月季味甘温。主要功效是活血调经、消肿解毒。",
        usage: "花瓣煎汤",
        volume: "花部"
      }
    }
  },
  {
    id: 19,
    name: "杜鹃",
    latinName: "Rhododendron",
    aliases: ["映山红", "山踯躅"],
    family: "杜鹃花科",
    genus: "杜鹃属",
    category: "灌木",
    tags: ["观赏", "有毒"],
    image: generateImageUrl("azalea"),
    images: [generateImageUrl("azalea", 1), generateImageUrl("azalea", 2), generateImageUrl("azalea", 3)],
    overview: {
      description: "杜鹃是杜鹃花科杜鹃属植物，花色艳丽，种类繁多。",
      habitat: "喜凉爽湿润气候，忌烈日暴晒",
      distribution: "广泛分布于亚洲、欧洲和北美洲",
      features: "落叶或常绿灌木，花簇生，色彩丰富",
      floweringPeriod: "4-5月"
    },
    value: {
      medicinal: "根可活血止痛，祛风除湿",
      edible: "部分品种有毒，不可食用",
      ecological: "优良的山地绿化植物",
      ornamental: "花色艳丽，极具观赏价值"
    },
    culture: {
      meaning: "热情、思念",
      poem: "杜鹃花发映山红，韶光觉正浓 —— 朱淑真",
      story: "杜鹃花开时满山红艳，象征热情和思念"
    },
    ancient: {
      benCaoGangMu: {
        original: "杜鹃，味酸平，有毒。主活血止痛，祛风除湿，清热解毒。",
        translation: "杜鹃味酸平，有毒。主要功效是活血止痛、祛风除湿、清热解毒。",
        usage: "外用适量",
        volume: "木部"
      }
    }
  },
  {
    id: 20,
    name: "茉莉",
    latinName: "Jasminum sambac",
    aliases: ["茉莉花", "抹厉"],
    family: "木犀科",
    genus: "素馨属",
    category: "灌木",
    tags: ["观赏", "芳香", "食用"],
    image: generateImageUrl("jasmine"),
    images: [generateImageUrl("jasmine", 1), generateImageUrl("jasmine", 2)],
    overview: {
      description: "茉莉是木犀科素馨属植物，花朵洁白，香气浓郁。",
      habitat: "喜温暖湿润气候，不耐寒",
      distribution: "原产印度，中国南方广泛栽培",
      features: "常绿灌木，花白色，香气浓郁",
      floweringPeriod: "5-8月"
    },
    value: {
      medicinal: "理气开郁，辟秽和中",
      edible: "可制作茉莉花茶",
      ecological: "蜜源植物",
      ornamental: "花朵洁白，香气迷人"
    },
    culture: {
      meaning: "纯洁、高雅",
      poem: "好一朵美丽的茉莉花，芬芳美丽满枝桠",
      story: "茉莉花是中国著名的香花，象征纯洁高雅"
    },
    ancient: {
      benCaoGangMu: {
        original: "茉莉，味辛温。主理气开郁，辟秽和中。",
        translation: "茉莉花味辛温。主要功效是理气开郁、辟秽和中。",
        usage: "泡茶或煎汤",
        volume: "花部"
      }
    }
  }
];

const categories = ["乔木", "灌木", "草本", "花卉", "药用", "果树", "竹类", "藤本"];
const tags = ["药用", "观赏", "食用", "行道树", "材用", "芳香", "珍稀", "有毒", "蜜源"];
const families = ["松科", "杉科", "柏科", "杨柳科", "桦木科", "壳斗科", "榆科", "桑科", "木兰科", "樟科", "蔷薇科", "豆科", "芸香科", "大戟科", "漆树科", "冬青科", "卫矛科", "槭树科", "无患子科", "木犀科", "茜草科", "忍冬科", "唇形科", "菊科", "禾本科", "百合科", "兰科"];

const plantNames = {
  乔木: ["雪松", "马尾松", "油松", "白皮松", "华山松", "黑松", "水杉", "池杉", "落羽杉", "侧柏", "圆柏", "龙柏", "刺柏", "银杏", "白榆", "榔榆", "朴树", "桑树", "构树", "榕树", "玉兰", "广玉兰", "木兰", "樟树", "阴香", "楠木", "枇杷", "石楠", "山楂", "海棠", "苹果", "梨", "桃", "李", "梅", "樱花", "合欢", "紫荆", "皂荚", "国槐", "刺槐", "黄檀", "臭椿", "香椿", "苦楝", "乌桕", "栾树", "无患子", "槭树", "梧桐"],
  灌木: ["迎春", "连翘", "金钟花", "蜡梅", "绣球", "溲疏", "锦带花", "海仙花", "木槿", "木芙蓉", "扶桑", "石榴", "紫薇", "丁香", "茉莉", "桂花", "女贞", "小叶女贞", "金叶女贞", "夹竹桃", "栀子", "龙船花", "六月雪", "杜鹃", "月季", "玫瑰", "蔷薇", "棣棠", "火棘", "枸骨", "冬青", "黄杨", "雀舌黄杨", "瓜子黄杨", "红继木", "金叶假连翘", "紫叶小檗", "十大功劳", "南天竹", "八角金盘"],
  草本: ["菊花", "牡丹", "芍药", "玉簪", "萱草", "鸢尾", "美人蕉", "大丽花", "一串红", "万寿菊", "孔雀草", "百日草", "鸡冠花", "凤仙花", "石竹", "虞美人", "三色堇", "矮牵牛", "长春花", "藿香", "薄荷", "紫苏", "薰衣草", "迷迭香", "百里香", "罗勒", "艾草", "蒲公英", "马齿苋", "车前草", "鱼腥草", "金银花", "蒲公英", "苍耳", "苦苣菜", "荠菜", "苜蓿", "三叶草", "酢浆草", "麦冬"],
  花卉: ["玫瑰", "月季", "牡丹", "菊花", "兰花", "荷花", "梅花", "桂花", "杜鹃", "山茶", "茉莉", "栀子", "海棠", "玉兰", "紫薇", "丁香", "樱花", "桃花", "梨花", "杏花", "郁金香", "百合", "康乃馨", "向日葵", "薰衣草", "满天星", "勿忘我", "风信子", "水仙花", "仙客来", "蝴蝶兰", "君子兰", "绿萝", "吊兰", "龟背竹", "发财树", "幸福树", "平安树", "文竹", "多肉"],
  药用: ["人参", "黄芪", "当归", "白术", "茯苓", "甘草", "川芎", "白芍", "熟地", "山药", "百合", "麦冬", "沙参", "党参", "枸杞", "菊花", "薄荷", "藿香", "紫苏", "蒲公英", "马齿苋", "金银花", "连翘", "板蓝根", "大青叶", "鱼腥草", "车前草", "益母草", "丹参", "三七", "天麻", "杜仲", "厚朴", "黄柏", "黄连", "黄芩", "大黄", "何首乌", "川贝母", "浙贝母"],
  果树: ["苹果", "梨", "桃", "李", "杏", "樱桃", "草莓", "蓝莓", "葡萄", "石榴", "柿子", "枣", "山楂", "核桃", "板栗", "银杏", "柑橘", "橙子", "柚子", "柠檬", "芒果", "香蕉", "菠萝", "荔枝", "龙眼", "枇杷", "杨梅", "猕猴桃", "西瓜", "甜瓜", "木瓜", "无花果", "火龙果", "榴莲", "山竹", "椰子", "橄榄", "腰果", "开心果"],
  竹类: ["毛竹", "刚竹", "紫竹", "斑竹", "罗汉竹", "佛肚竹", "龟甲竹", "孝顺竹", "凤尾竹", "青皮竹", "黄竹", "金竹", "绿竹", "麻竹", "甜龙竹"],
  藤本: ["紫藤", "葡萄", "爬山虎", "常春藤", "凌霄", "金银花", "猕猴桃", "百香果", "南瓜", "黄瓜", "丝瓜", "苦瓜", "豆角", "豌豆", "牵牛花", "茑萝", "铁线莲", "木香", "络石", "薜荔", "五味子", "猕猴桃", "葡萄", "啤酒花", "爬山虎", "五叶地锦", "三叶地锦", "常春藤", "凌霄", "炮仗花", "珊瑚藤", "紫藤", "木香"]
};

for (let i = 21; i <= 200; i++) {
  let category = categories[Math.floor(Math.random() * categories.length)];
  let categoryPlants = plantNames[category as keyof typeof plantNames] || plantNames.乔木;
  let name = categoryPlants[Math.floor(Math.random() * categoryPlants.length)];
  let family = families[Math.floor(Math.random() * families.length)];
  let genus = name + "属";
  
  let plantTags: string[] = [];
  if (Math.random() > 0.5) plantTags.push("观赏");
  if (Math.random() > 0.5) plantTags.push("药用");
  if (category === "乔木" && Math.random() > 0.5) plantTags.push("行道树");
  
  plantsData.push({
    id: i,
    name,
    latinName: `${family} ${genus}`,
    aliases: [],
    family,
    genus,
    category,
    tags: plantTags.length > 0 ? plantTags : ["观赏"],
    image: generateImageUrl(name),
    images: [generateImageUrl(name, 1), generateImageUrl(name, 2)],
    overview: {
      description: `${name}是${family}${genus}植物，具有较高的观赏和药用价值。`,
      habitat: "喜温暖湿润气候，适应性强",
      distribution: "广泛分布于中国各地",
      features: "多年生植物，生长良好",
      floweringPeriod: "4-5月"
    },
    value: {
      medicinal: "具有一定的药用价值",
      edible: "部分品种可食用",
      ecological: "对环境有良好的适应性",
      ornamental: "具有较高的观赏价值"
    },
    culture: {
      meaning: "美丽、自然",
      poem: "",
      story: ""
    }
  });
}

export const searchPlants = (keyword: string): Plant[] => {
  const lowerKeyword = keyword.toLowerCase();
  return plantsData.filter(plant => 
    plant.name.toLowerCase().includes(lowerKeyword) ||
    plant.aliases.some(alias => alias.toLowerCase().includes(lowerKeyword)) ||
    plant.latinName.toLowerCase().includes(lowerKeyword) ||
    plant.family.toLowerCase().includes(lowerKeyword)
  );
};

export const filterByCategory = (category: string): Plant[] => {
  if (category === "全部") return plantsData;
  return plantsData.filter(plant => plant.category === category);
};

export const filterByTag = (tag: string): Plant[] => {
  return plantsData.filter(plant => plant.tags.includes(tag));
};

export const getRandomPlants = (n: number): Plant[] => {
  const shuffled = [...plantsData].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

export const getPlantById = (id: number): Plant | undefined => {
  return plantsData.find(plant => plant.id === id);
};

export const getRelatedPlants = (plantId: number, category?: string, limit: number = 6): Plant[] => {
  const plant = getPlantById(plantId);
  if (!plant) return getRandomPlants(limit);
  
  return plantsData
    .filter(p => p.id !== plantId && (p.family === plant.family || p.category === plant.category))
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
};

export const getPlantsWithAncient = (): Plant[] => {
  return plantsData.filter(plant => plant.ancient);
};

export const getCategories = (): string[] => {
  return [...new Set(plantsData.map(plant => plant.category))];
};

export const getTags = (): string[] => {
  return [...new Set(plantsData.flatMap(plant => plant.tags))];
};

export const getTotalCount = (): number => {
  return plantsData.length;
};

export const getAncientCount = (): number => {
  return getPlantsWithAncient().length;
};
