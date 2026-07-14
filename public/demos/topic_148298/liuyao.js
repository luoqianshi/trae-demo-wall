/**
 * 六爻核心算法模块
 * 万物皆可卦 - 数据驱动的玄学运势推算
 */

// ==================== 64卦数据库 ====================
const GUA_DATABASE = {
  // 乾宫
  "111111": {
    name: "乾为天",
    symbol: "☰☰",
    keyword: "刚健",
    fortune: {
      career: { score: 95, text: "天行健，君子以自强不息。事业正值上升期，宜主动出击，大胆推进项目。" },
      love: { score: 70, text: "乾卦主刚，感情中宜适当柔和，过于强势易生摩擦。" },
      study: { score: 90, text: "思维清晰，学习效率极高，适合攻克难题。" },
      health: { score: 85, text: "精力充沛，但需注意过劳，适当休息。" },
      social: { score: 80, text: "领导力凸显，适合组织活动，但需注意倾听他人。" }
    },
    future: "未来七日运势持续强劲，宜把握机遇推进重要事项。第三日可能遇到小阻碍，保持刚健中正即可化解。",
    advice: "宜：积极进取、锻炼身体、公开演讲 \n忌：傲慢固执、独断专行、过度劳累"
  },
  "111110": {
    name: "天风姤",
    symbol: "☰☴",
    keyword: "邂逅",
    fortune: {
      career: { score: 75, text: "机遇突然出现，但需谨慎评估，不可贸然投入。" },
      love: { score: 85, text: "桃花暗藏，可能有意外的邂逅，保持开放心态。" },
      study: { score: 70, text: "新的学习机会出现，但需辨别真伪。" },
      health: { score: 65, text: "注意突发的小病小痛，预防胜于治疗。" },
      social: { score: 80, text: "可能结识重要人物，保持礼貌和真诚。" }
    },
    future: "机遇与风险并存的一周。第四日左右可能遇到关键人物或机会，需快速判断。",
    advice: "宜：社交拓展、把握机会、学习新知 \n忌：贸然决策、轻信他人、忽视细节"
  },
  "111100": {
    name: "天山遁",
    symbol: "☰☶",
    keyword: "退避",
    fortune: {
      career: { score: 60, text: "时机不利，宜退守自保，不宜冒进。保存实力为上。" },
      love: { score: 55, text: "感情进入冷淡期，给彼此空间比紧逼更有效。" },
      study: { score: 65, text: "遇到瓶颈，暂时退一步，调整方法再出发。" },
      health: { score: 60, text: "身体需要休息，减少高强度运动，多静养。" },
      social: { score: 50, text: "避免卷入纷争，低调行事为佳。" }
    },
    future: "未来一周运势低迷，宜守不宜攻。第二、五日需特别注意，避免重大决策。",
    advice: "宜：静思冥想、整理复盘、休养生息 \n忌：强行推进、参与纷争、大额投资"
  },
  "111000": {
    name: "天地否",
    symbol: "☰☷",
    keyword: "闭塞",
    fortune: {
      career: { score: 45, text: "天地不交，事业受阻。沟通不畅，项目推进困难。" },
      love: { score: 40, text: "双方理解有偏差，需加强沟通，避免误会加深。" },
      study: { score: 50, text: "学习效率低下，思路不开阔，需寻求外力帮助。" },
      health: { score: 55, text: "气血不畅，注意消化系统和呼吸系统。" },
      social: { score: 45, text: "人际关系紧张，容易被人误解。" }
    },
    future: "运势低迷的一周，旧有问题可能浮现。第五日后稍有转机，但总体宜守。",
    advice: "宜：内省修身、读书充电、陪伴家人 \n忌：争执辩论、签约合作、远行冒险"
  },
  "111001": {
    name: "风地观",
    symbol: "☴☷",
    keyword: "观瞻",
    fortune: {
      career: { score: 70, text: "宜观察时势，学习他人长处。不宜急于表现。" },
      love: { score: 65, text: "静观其变，了解对方真实想法后再行动。" },
      study: { score: 80, text: "观察力敏锐，适合观摩学习、参观考察。" },
      health: { score: 75, text: "状态平稳，适合观察身体信号，调整作息。" },
      social: { score: 70, text: "适合参加观摩性活动，学习社交技巧。" }
    },
    future: "观察学习的一周。第三、四日可能有值得学习的榜样出现。",
    advice: "宜：观察学习、参观考察、倾听他人 \n忌：急于表现、盲目跟风、主观臆断"
  },
  "111011": {
    name: "山地剥",
    symbol: "☶☷",
    keyword: "剥落",
    fortune: {
      career: { score: 40, text: "小人当道，事业受损。需防微杜渐，保存核心实力。" },
      love: { score: 45, text: "感情有裂痕，需及时修补，避免问题扩大。" },
      study: { score: 50, text: "基础不牢，需回归课本，夯实基本功。" },
      health: { score: 45, text: "身体虚弱，需特别注意营养和休息。" },
      social: { score: 40, text: "可能遭遇背叛或误解，信任需谨慎。" }
    },
    future: "运势下滑的一周，旧有问题逐渐暴露。第六日后开始触底反弹。",
    advice: "宜：巩固基础、休养生息、清理旧物 \n忌：扩张投资、轻信他人、忽视细节"
  },
  "111010": {
    name: "火地晋",
    symbol: "☲☷",
    keyword: "晋升",
    fortune: {
      career: { score: 85, text: "旭日东升，事业有晋升之机。保持谦逊，继续努力。" },
      love: { score: 75, text: "感情升温，关系有望更进一步。" },
      study: { score: 80, text: "学业进步明显，考试运佳。" },
      health: { score: 75, text: "状态回升，但仍需注意循序渐进。" },
      social: { score: 80, text: "人缘上升，适合拓展人脉。" }
    },
    future: "运势上升的一周，第二日后渐入佳境。第五日可能有好消息。",
    advice: "宜：积极进取、展示才华、拓展人脉 \n忌：骄傲自满、急功近利、忽视健康"
  },
  "111101": {
    name: "火天大有",
    symbol: "☲☰",
    keyword: "大有",
    fortune: {
      career: { score: 90, text: "大有收获，事业丰收在望。把握时机，乘胜追击。" },
      love: { score: 80, text: "感情美满，彼此欣赏，关系稳固。" },
      study: { score: 85, text: "学有所成，之前的努力即将开花结果。" },
      health: { score: 80, text: "状态良好，适合挑战更高目标。" },
      social: { score: 85, text: "人气旺盛，适合组织大型活动。" }
    },
    future: "运势大旺的一周，第四日左右可能有重大收获或突破。",
    advice: "宜：把握机遇、扩大战果、分享成果 \n忌：挥霍浪费、独吞利益、骄傲自大"
  },

  // 兑宫
  "011111": {
    name: "泽天夬",
    symbol: "☱☰",
    keyword: "决断",
    fortune: {
      career: { score: 80, text: "当断则断，事业需要做出重要决策。果断行动，不留后患。" },
      love: { score: 70, text: "需要做出感情上的决断，拖泥带水只会更痛苦。" },
      study: { score: 75, text: "面临选择，需明确方向，集中精力攻其一点。" },
      health: { score: 70, text: "身体发出信号，需正视问题，及时处理。" },
      social: { score: 75, text: "可能需要与某段关系做个了断。" }
    },
    future: "决断之周。第三日左右需要做出重要选择，早做决断早轻松。",
    advice: "宜：果断决策、清理旧账、明确边界 \n忌：优柔寡断、逃避问题、反复无常"
  },
  "011110": {
    name: "泽风大过",
    symbol: "☱☴",
    keyword: "大过",
    fortune: {
      career: { score: 55, text: "压力过大，超出承受范围。需寻求帮助，分担压力。" },
      love: { score: 50, text: "感情负担过重，需调整期望，给彼此减压。" },
      study: { score: 55, text: "学习强度过大，需调整节奏，避免 burnout。" },
      health: { score: 45, text: "身心俱疲，必须立即休息，否则可能生病。" },
      social: { score: 50, text: "社交压力过大，适当减少应酬。" }
    },
    future: "压力集中的一周。第二、四日压力最大，第六日后开始缓解。",
    advice: "宜：减负放松、寻求帮助、调整节奏 \n忌：硬撑到底、过度承诺、忽视身体"
  },
  "011100": {
    name: "泽山咸",
    symbol: "☱☶",
    keyword: "感应",
    fortune: {
      career: { score: 75, text: "心有灵犀，与同事配合默契。团队合作效率高。" },
      love: { score: 90, text: "感情感应强烈，心有灵犀一点通。表白成功率极高。" },
      study: { score: 70, text: "直觉敏锐，适合需要灵感的创造性学习。" },
      health: { score: 75, text: "身心感应良好，适合瑜伽、冥想等身心练习。" },
      social: { score: 80, text: "人际感应力强，能敏锐捕捉他人情绪。" }
    },
    future: "感应强烈的一周，第三、五日适合重要的人际互动。",
    advice: "宜：表达情感、团队合作、身心练习 \n忌：封闭自己、忽视直觉、理性过度"
  },
  "011000": {
    name: "泽地萃",
    symbol: "☱☷",
    keyword: "聚集",
    fortune: {
      career: { score: 80, text: "众人拾柴火焰高，团队合作带来好结果。" },
      love: { score: 75, text: "感情在聚会中升温，共同活动增进感情。" },
      study: { score: 75, text: "小组学习效果好，集思广益，取长补短。" },
      health: { score: 70, text: "适合团体运动，如球类、舞蹈等。" },
      social: { score: 85, text: "聚会运佳，适合组织或参加集体活动。" }
    },
    future: "聚集之周，第四日左右的聚会或会议可能带来重要收获。",
    advice: "宜：参加聚会、团队合作、组织活动 \n忌：独来独往、拒绝邀请、孤立自己"
  },
  "011001": {
    name: "水地比",
    symbol: "☵☷",
    keyword: "亲近",
    fortune: {
      career: { score: 75, text: "得贵人相助，事业顺遂。保持良好关系，互利共赢。" },
      love: { score: 80, text: "感情亲密，彼此依赖。适合深入交流，增进了解。" },
      study: { score: 70, text: "找到学习伙伴，互相帮助，共同进步。" },
      health: { score: 70, text: "状态平稳，有人陪伴心情更好。" },
      social: { score: 85, text: "人缘极佳，容易获得他人好感和支持。" }
    },
    future: "人际关系甜蜜的一周，第五日可能得到贵人帮助。",
    advice: "宜：维护关系、寻求合作、互帮互助 \n忌：过河拆桥、忘恩负义、单打独斗"
  },
  "011011": {
    name: "水山蹇",
    symbol: "☵☶",
    keyword: "艰难",
    fortune: {
      career: { score: 50, text: "前路艰难，进展缓慢。需耐心等待，不可强求。" },
      love: { score: 55, text: "感情遇阻，沟通困难。给彼此时间和空间。" },
      study: { score: 55, text: "学习遇到瓶颈，需换种方法或寻求帮助。" },
      health: { score: 50, text: "身体不适，需静养，不宜剧烈运动。" },
      social: { score: 50, text: "社交遇冷，可能被误解或忽视。" }
    },
    future: "艰难之周，但困境中有转机。第六日后阻碍开始减小。",
    advice: "宜：耐心等待、寻求帮助、调整方法 \n忌：硬闯蛮干、怨天尤人、放弃努力"
  },
  "011010": {
    name: "地山谦",
    symbol: "☷☶",
    keyword: "谦逊",
    fortune: {
      career: { score: 80, text: "谦虚使人进步，低调做事反而获得更多认可。" },
      love: { score: 75, text: "谦逊的态度让感情更加和谐，避免争强好胜。" },
      study: { score: 80, text: "虚心求教，不耻下问，学习效率反而更高。" },
      health: { score: 75, text: "状态良好，谦逊的心态有助于身心平衡。" },
      social: { score: 85, text: "谦和的态度赢得众人好感，人缘极佳。" }
    },
    future: "谦逊受福的一周，第三、四日可能因谦虚态度获得意外之喜。",
    advice: "宜：谦虚待人、虚心学习、低调行事 \n忌：炫耀张扬、争强好胜、自以为是"
  },
  "011101": {
    name: "雷山小过",
    symbol: "☳☶",
    keyword: "小过",
    fortune: {
      career: { score: 60, text: "小有偏差，需及时调整。不宜做重大决策。" },
      love: { score: 60, text: "感情有小波折，及时沟通即可化解。" },
      study: { score: 65, text: "学习有偏差，需及时纠正方向。" },
      health: { score: 60, text: "身体有小恙，注意休息即可恢复。" },
      social: { score: 60, text: "社交中有小误会，及时解释清楚。" }
    },
    future: "小有波折的一周，问题不大，但需及时修正。第四日左右需特别注意。",
    advice: "宜：及时修正、保持谨慎、从小处着手 \n忌：忽视小问题、盲目乐观、大意失荆州"
  },

  // 离宫
  "101111": {
    name: "火天大有",
    symbol: "☲☰",
    keyword: "大有",
    fortune: {
      career: { score: 90, text: "大有收获，事业丰收在望。把握时机，乘胜追击。" },
      love: { score: 80, text: "感情美满，彼此欣赏，关系稳固。" },
      study: { score: 85, text: "学有所成，之前的努力即将开花结果。" },
      health: { score: 80, text: "状态良好，适合挑战更高目标。" },
      social: { score: 85, text: "人气旺盛，适合组织大型活动。" }
    },
    future: "运势大旺的一周，第四日左右可能有重大收获或突破。",
    advice: "宜：把握机遇、扩大战果、分享成果 \n忌：挥霍浪费、独吞利益、骄傲自大"
  },
  "101110": {
    name: "火风鼎",
    symbol: "☲☴",
    keyword: "鼎新",
    fortune: {
      career: { score: 85, text: "革故鼎新，事业迎来转型良机。勇于创新，破旧立新。" },
      love: { score: 75, text: "感情进入新阶段，需调整心态，接受变化。" },
      study: { score: 80, text: "适合学习新知识、新技能，开拓视野。" },
      health: { score: 75, text: "适合尝试新的运动方式或养生方法。" },
      social: { score: 80, text: "人脉更新，可能结识新圈子里的朋友。" }
    },
    future: "革新之周，第三日左右可能有新机会或新想法出现。",
    advice: "宜：创新尝试、破旧立新、学习新知 \n忌：因循守旧、抗拒变化、固步自封"
  },
  "101100": {
    name: "火山旅",
    symbol: "☲☶",
    keyword: "旅行",
    fortune: {
      career: { score: 65, text: "漂泊不定，事业暂无根基。宜外出寻找机会。" },
      love: { score: 60, text: "聚少离多，感情需靠沟通维系。" },
      study: { score: 70, text: "适合外出学习、考察、参加培训。" },
      health: { score: 65, text: "旅途劳顿，注意休息，避免过度劳累。" },
      social: { score: 70, text: "旅途中可能结识新朋友。" }
    },
    future: "变动之周，第二、五日可能有出行或变动。保持灵活心态。",
    advice: "宜：外出走走、参加培训、保持灵活 \n忌：固守一地、拒绝变动、过度操劳"
  },
  "101000": {
    name: "火地晋",
    symbol: "☲☷",
    keyword: "晋升",
    fortune: {
      career: { score: 85, text: "旭日东升，事业有晋升之机。保持谦逊，继续努力。" },
      love: { score: 75, text: "感情升温，关系有望更进一步。" },
      study: { score: 80, text: "学业进步明显，考试运佳。" },
      health: { score: 75, text: "状态回升，但仍需注意循序渐进。" },
      social: { score: 80, text: "人缘上升，适合拓展人脉。" }
    },
    future: "运势上升的一周，第二日后渐入佳境。第五日可能有好消息。",
    advice: "宜：积极进取、展示才华、拓展人脉 \n忌：骄傲自满、急功近利、忽视健康"
  },
  "101001": {
    name: "雷地豫",
    symbol: "☳☷",
    keyword: "和乐",
    fortune: {
      career: { score: 75, text: "心情愉悦，工作效率高。适合创意类工作。" },
      love: { score: 80, text: "感情甜蜜，适合约会、出游，增进感情。" },
      study: { score: 75, text: "心情好学习效率自然高，适合轻松愉快的学习方式。" },
      health: { score: 80, text: "身心愉悦，状态极佳。适合户外运动。" },
      social: { score: 80, text: "聚会运佳，适合组织欢乐聚会。" }
    },
    future: "欢乐之周，第三、四日可能有愉快的聚会或活动。",
    advice: "宜：享受当下、组织聚会、户外运动 \n忌：乐极生悲、过度放纵、得意忘形"
  },
  "101011": {
    name: "雷火丰",
    symbol: "☳☲",
    keyword: "丰盛",
    fortune: {
      career: { score: 90, text: "丰盛昌盛，事业达到高峰。把握时机，大展宏图。" },
      love: { score: 85, text: "感情丰盛，彼此给予，关系饱满。" },
      study: { score: 85, text: "学习成果丰硕，之前的积累爆发。" },
      health: { score: 80, text: "精力充沛，但需注意劳逸结合。" },
      social: { score: 85, text: "人脉丰盛，左右逢源。" }
    },
    future: "丰盛之周，第四日左右可能达到顶峰，之后需防盛极而衰。",
    advice: "宜：大展宏图、分享成果、感恩他人 \n忌：得意忘形、奢侈浪费、忽视隐患"
  },
  "101010": {
    name: "离为火",
    symbol: "☲☲",
    keyword: "光明",
    fortune: {
      career: { score: 85, text: "光明磊落，事业蒸蒸日上。适合公开演讲、展示。" },
      love: { score: 80, text: "感情热烈，彼此吸引。但需注意不要过于炽热。" },
      study: { score: 80, text: "思维活跃，适合创造性学习。" },
      health: { score: 75, text: "状态活跃，但需注意心脏和血压。" },
      social: { score: 80, text: "成为焦点，人气高涨。" }
    },
    future: "光明之周，运势持续走高。第三日可能有展示自我的机会。",
    advice: "宜：展示才华、公开演讲、积极社交 \n忌：过于张扬、骄傲自满、忽视健康"
  },
  "101101": {
    name: "风火家人",
    symbol: "☴☲",
    keyword: "家人",
    fortune: {
      career: { score: 75, text: "家和万事兴，家庭支持是事业后盾。" },
      love: { score: 85, text: "家庭和睦，感情稳定。适合见家长或谈婚论嫁。" },
      study: { score: 75, text: "家庭环境利于学习，家人支持是动力。" },
      health: { score: 80, text: "家庭氛围好，身心愉悦。" },
      social: { score: 75, text: "家庭聚会增进感情，亲情浓厚。" }
    },
    future: "家庭为重的一周，第四、五日适合家庭聚会或处理家事。",
    advice: "宜：陪伴家人、处理家事、营造温馨 \n忌：忽视家庭、工作狂、冷落亲人"
  },

  // 震宫
  "001111": {
    name: "雷天大壮",
    symbol: "☳☰",
    keyword: "大壮",
    fortune: {
      career: { score: 80, text: "气势正盛，事业有冲劲。但需防过刚易折。" },
      love: { score: 70, text: "感情冲动，需控制情绪，避免争吵。" },
      study: { score: 75, text: "冲劲十足，适合攻克难关。但需持之以恒。" },
      health: { score: 70, text: "精力旺盛，但运动需适度，避免受伤。" },
      social: { score: 75, text: "气势逼人，可能让人觉得有压迫感。" }
    },
    future: "冲劲十足的一周，第二、四日可能遇到需要决断的事。",
    advice: "宜：勇往直前、挑战自我、锻炼身体 \n忌：冲动行事、过刚易折、忽视他人"
  },
  "001110": {
    name: "雷风恒",
    symbol: "☳☴",
    keyword: "恒久",
    fortune: {
      career: { score: 80, text: "持之以恒，事业根基稳固。坚持就是胜利。" },
      love: { score: 85, text: "感情持久，细水长流。平淡中见真情。" },
      study: { score: 80, text: "日积月累，量变引起质变。坚持每日学习。" },
      health: { score: 80, text: "坚持运动，身体渐入佳境。" },
      social: { score: 75, text: "老朋友关系稳固，新友谊需时间培养。" }
    },
    future: "稳定之周，适合按部就班推进计划。第五日可能看到坚持的回报。",
    advice: "宜：坚持不懈、维护老客户、规律作息 \n忌：三心二意、半途而废、急于求成"
  },
  "001100": {
    name: "雷水解",
    symbol: "☳☵",
    keyword: "解脱",
    fortune: {
      career: { score: 75, text: "困境解除，事业迎来转机。雨过天晴。" },
      love: { score: 75, text: "误会冰释，感情回暖。坦诚沟通是关键。" },
      study: { score: 75, text: "难题迎刃而解，豁然开朗。" },
      health: { score: 75, text: "身体康复，精神状态好转。" },
      social: { score: 75, text: "旧怨化解，人际关系改善。" }
    },
    future: "解脱之周，第三日后运势明显好转，之前的困扰逐渐消散。",
    advice: "宜：主动和解、释放压力、迎接新生 \n忌：旧事重提、耿耿于怀、错失新机"
  },
  "001000": {
    name: "雷地豫",
    symbol: "☳☷",
    keyword: "和乐",
    fortune: {
      career: { score: 75, text: "心情愉悦，工作效率高。适合创意类工作。" },
      love: { score: 80, text: "感情甜蜜，适合约会、出游，增进感情。" },
      study: { score: 75, text: "心情好学习效率自然高，适合轻松愉快的学习方式。" },
      health: { score: 80, text: "身心愉悦，状态极佳。适合户外运动。" },
      social: { score: 80, text: "聚会运佳，适合组织欢乐聚会。" }
    },
    future: "欢乐之周，第三、四日可能有愉快的聚会或活动。",
    advice: "宜：享受当下、组织聚会、户外运动 \n忌：乐极生悲、过度放纵、得意忘形"
  },
  "001001": {
    name: "震为雷",
    symbol: "☳☳",
    keyword: "震动",
    fortune: {
      career: { score: 70, text: "变动突至，事业有震动。保持冷静，从容应对。" },
      love: { score: 65, text: "感情有波动，可能吵架或突然的变化。保持冷静。" },
      study: { score: 70, text: "学习节奏被打乱，需快速调整适应。" },
      health: { score: 65, text: "注意突发状况，避免危险运动。" },
      social: { score: 70, text: "社交圈有变动，可能有人离开或加入。" }
    },
    future: "变动之周，第二、五日可能有突发消息或变化。保持冷静应对。",
    advice: "宜：保持冷静、快速适应、备份计划 \n忌：惊慌失措、抗拒变化、冲动决策"
  },
  "001011": {
    name: "雷火丰",
    symbol: "☳☲",
    keyword: "丰盛",
    fortune: {
      career: { score: 90, text: "丰盛昌盛，事业达到高峰。把握时机，大展宏图。" },
      love: { score: 85, text: "感情丰盛，彼此给予，关系饱满。" },
      study: { score: 85, text: "学习成果丰硕，之前的积累爆发。" },
      health: { score: 80, text: "精力充沛，但需注意劳逸结合。" },
      social: { score: 85, text: "人脉丰盛，左右逢源。" }
    },
    future: "丰盛之周，第四日左右可能达到顶峰，之后需防盛极而衰。",
    advice: "宜：大展宏图、分享成果、感恩他人 \n忌：得意忘形、奢侈浪费、忽视隐患"
  },
  "001010": {
    name: "泽雷随",
    symbol: "☱☳",
    keyword: "随从",
    fortune: {
      career: { score: 70, text: "顺势而为，不宜强出头。跟随大趋势，借力打力。" },
      love: { score: 70, text: "随遇而安，感情顺其自然发展。" },
      study: { score: 70, text: "跟随老师或前辈的指导，学习效果佳。" },
      health: { score: 70, text: "跟随身体的节奏，不要强求。" },
      social: { score: 75, text: "随和的态度让你受欢迎。" }
    },
    future: "顺势之周，第三、四日适合跟随他人行动，不宜做领头羊。",
    advice: "宜：顺势而为、跟随学习、借力打力 \n忌：逆势而行、强出头、固执己见"
  },
  "001101": {
    name: "天雷无妄",
    symbol: "☰☳",
    keyword: "无妄",
    fortune: {
      career: { score: 75, text: "脚踏实地，不存妄想。稳步前进，自然有收获。" },
      love: { score: 70, text: "感情务实，不追求虚幻。真诚待人。" },
      study: { score: 75, text: "实事求是，不投机取巧。扎实学习。" },
      health: { score: 75, text: "身体无大碍，保持规律生活即可。" },
      social: { score: 70, text: "真诚待人，不虚伪做作。" }
    },
    future: "务实之周，第五日可能看到踏实努力的回报。",
    advice: "宜：脚踏实地、真诚待人、规律生活 \n忌：投机取巧、虚伪做作、妄想捷径"
  },

  // 巽宫
  "010111": {
    name: "风天小畜",
    symbol: "☴☰",
    keyword: "小蓄",
    fortune: {
      career: { score: 65, text: "小有积蓄，事业稳步积累。不宜急于求成。" },
      love: { score: 65, text: "感情小有进展，需耐心培养。" },
      study: { score: 70, text: "知识逐渐积累，量变等待质变。" },
      health: { score: 70, text: "身体状态平稳，持续保养即可。" },
      social: { score: 65, text: "人脉小有扩展，维护好现有关系。" }
    },
    future: "积累之周，适合储蓄、学习、稳步前进。第四日可能有小收获。",
    advice: "宜：积累储蓄、稳步前进、耐心培养 \n忌：急于求成、大手大脚、忽视积累"
  },
  "010110": {
    name: "风火家人",
    symbol: "☴☲",
    keyword: "家人",
    fortune: {
      career: { score: 75, text: "家和万事兴，家庭支持是事业后盾。" },
      love: { score: 85, text: "家庭和睦，感情稳定。适合见家长或谈婚论嫁。" },
      study: { score: 75, text: "家庭环境利于学习，家人支持是动力。" },
      health: { score: 80, text: "家庭氛围好，身心愉悦。" },
      social: { score: 75, text: "家庭聚会增进感情，亲情浓厚。" }
    },
    future: "家庭为重的一周，第四、五日适合家庭聚会或处理家事。",
    advice: "宜：陪伴家人、处理家事、营造温馨 \n忌：忽视家庭、工作狂、冷落亲人"
  },
  "010100": {
    name: "风山渐",
    symbol: "☴☶",
    keyword: "渐进",
    fortune: {
      career: { score: 75, text: "循序渐进，事业稳步上升。不急不躁，水到渠成。" },
      love: { score: 75, text: "感情渐入佳境，循序渐进，自然发展。" },
      study: { score: 80, text: "循序渐进，基础扎实，进步稳定。" },
      health: { score: 75, text: "身体逐渐好转，坚持就是胜利。" },
      social: { score: 70, text: "人脉渐进扩展，新友谊慢慢培养。" }
    },
    future: "渐进之周，每日都有小进步。第六日可能看到明显变化。",
    advice: "宜：循序渐进、稳扎稳打、耐心培养 \n忌：急于求成、跳跃发展、半途而废"
  },
  "010000": {
    name: "风地观",
    symbol: "☴☷",
    keyword: "观瞻",
    fortune: {
      career: { score: 70, text: "宜观察时势，学习他人长处。不宜急于表现。" },
      love: { score: 65, text: "静观其变，了解对方真实想法后再行动。" },
      study: { score: 80, text: "观察力敏锐，适合观摩学习、参观考察。" },
      health: { score: 75, text: "状态平稳，适合观察身体信号，调整作息。" },
      social: { score: 70, text: "适合参加观摩性活动，学习社交技巧。" }
    },
    future: "观察学习的一周。第三、四日可能有值得学习的榜样出现。",
    advice: "宜：观察学习、参观考察、倾听他人 \n忌：急于表现、盲目跟风、主观臆断"
  },
  "010001": {
    name: "水风井",
    symbol: "☵☴",
    keyword: "井养",
    fortune: {
      career: { score: 70, text: "源头活水，事业需不断注入新能量。保持学习。" },
      love: { score: 70, text: "感情需持续投入，如井水需不断汲取。" },
      study: { score: 75, text: "知识如井水，越汲越新。保持求知欲。" },
      health: { score: 75, text: "多喝水，保持身体水分平衡。" },
      social: { score: 70, text: "如井水养人，你的存在对他人很重要。" }
    },
    future: "滋养之周，第三、四日可能有需要你的人出现。",
    advice: "宜：持续学习、帮助他人、保持活力 \n忌：闭门造车、停止学习、忽视他人"
  },
  "010011": {
    name: "巽为风",
    symbol: "☴☴",
    keyword: "顺从",
    fortune: {
      career: { score: 70, text: "如风随行，事业需灵活应变。顺势而为。" },
      love: { score: 70, text: "感情需温柔以待，如春风拂面。" },
      study: { score: 75, text: "学习需灵活变通，不可死板。" },
      health: { score: 70, text: "注意呼吸系统，保持空气流通。" },
      social: { score: 75, text: "如风般随和，人际关系顺畅。" }
    },
    future: "灵活之周，第二、五日可能有需要随机应变的情况。",
    advice: "宜：灵活应变、温柔待人、顺势而为 \n忌：固执己见、强硬对抗、死板教条"
  },
  "010010": {
    name: "泽风大过",
    symbol: "☱☴",
    keyword: "大过",
    fortune: {
      career: { score: 55, text: "压力过大，超出承受范围。需寻求帮助，分担压力。" },
      love: { score: 50, text: "感情负担过重，需调整期望，给彼此减压。" },
      study: { score: 55, text: "学习强度过大，需调整节奏，避免 burnout。" },
      health: { score: 45, text: "身心俱疲，必须立即休息，否则可能生病。" },
      social: { score: 50, text: "社交压力过大，适当减少应酬。" }
    },
    future: "压力集中的一周。第二、四日压力最大，第六日后开始缓解。",
    advice: "宜：减负放松、寻求帮助、调整节奏 \n忌：硬撑到底、过度承诺、忽视身体"
  },
  "010101": {
    name: "天风姤",
    symbol: "☰☴",
    keyword: "邂逅",
    fortune: {
      career: { score: 75, text: "机遇突然出现，但需谨慎评估，不可贸然投入。" },
      love: { score: 85, text: "桃花暗藏，可能有意外的邂逅，保持开放心态。" },
      study: { score: 70, text: "新的学习机会出现，但需辨别真伪。" },
      health: { score: 65, text: "注意突发的小病小痛，预防胜于治疗。" },
      social: { score: 80, text: "可能结识重要人物，保持礼貌和真诚。" }
    },
    future: "机遇与风险并存的一周。第四日左右可能遇到关键人物或机会，需快速判断。",
    advice: "宜：社交拓展、把握机会、学习新知 \n忌：贸然决策、轻信他人、忽视细节"
  },

  // 坎宫
  "100111": {
    name: "水天需",
    symbol: "☵☰",
    keyword: "等待",
    fortune: {
      career: { score: 65, text: "时机未到，需耐心等待。准备充分，待时而动。" },
      love: { score: 60, text: "感情需时间培养，不可操之过急。" },
      study: { score: 70, text: "学习需积累，量变引起质变。保持耐心。" },
      health: { score: 70, text: "身体恢复需要时间，耐心等待。" },
      social: { score: 65, text: "人脉拓展需时间，不可强求。" }
    },
    future: "等待之周，第三、五日后可能有转机。保持耐心，做好准备。",
    advice: "宜：耐心等待、做好准备、充实自我 \n忌：操之过急、贸然行动、灰心丧气"
  },
  "100110": {
    name: "水风井",
    symbol: "☵☴",
    keyword: "井养",
    fortune: {
      career: { score: 70, text: "源头活水，事业需不断注入新能量。保持学习。" },
      love: { score: 70, text: "感情需持续投入，如井水需不断汲取。" },
      study: { score: 75, text: "知识如井水，越汲越新。保持求知欲。" },
      health: { score: 75, text: "多喝水，保持身体水分平衡。" },
      social: { score: 70, text: "如井水养人，你的存在对他人很重要。" }
    },
    future: "滋养之周，第三、四日可能有需要你的人出现。",
    advice: "宜：持续学习、帮助他人、保持活力 \n忌：闭门造车、停止学习、忽视他人"
  },
  "100100": {
    name: "水山蹇",
    symbol: "☵☶",
    keyword: "艰难",
    fortune: {
      career: { score: 50, text: "前路艰难，进展缓慢。需耐心等待，不可强求。" },
      love: { score: 55, text: "感情遇阻，沟通困难。给彼此时间和空间。" },
      study: { score: 55, text: "学习遇到瓶颈，需换种方法或寻求帮助。" },
      health: { score: 50, text: "身体不适，需静养，不宜剧烈运动。" },
      social: { score: 50, text: "社交遇冷，可能被误解或忽视。" }
    },
    future: "艰难之周，但困境中有转机。第六日后阻碍开始减小。",
    advice: "宜：耐心等待、寻求帮助、调整方法 \n忌：硬闯蛮干、怨天尤人、放弃努力"
  },
  "100000": {
    name: "水地比",
    symbol: "☵☷",
    keyword: "亲近",
    fortune: {
      career: { score: 75, text: "得贵人相助，事业顺遂。保持良好关系，互利共赢。" },
      love: { score: 80, text: "感情亲密，彼此依赖。适合深入交流，增进了解。" },
      study: { score: 70, text: "找到学习伙伴，互相帮助，共同进步。" },
      health: { score: 70, text: "状态平稳，有人陪伴心情更好。" },
      social: { score: 85, text: "人缘极佳，容易获得他人好感和支持。" }
    },
    future: "人际关系甜蜜的一周，第五日可能得到贵人帮助。",
    advice: "宜：维护关系、寻求合作、互帮互助 \n忌：过河拆桥、忘恩负义、单打独斗"
  },
  "100001": {
    name: "坎为水",
    symbol: "☵☵",
    keyword: "险陷",
    fortune: {
      career: { score: 45, text: "危机四伏，事业陷入困境。需谨慎行事，步步为营。" },
      love: { score: 45, text: "感情危机，可能陷入冷战或误会。需主动沟通。" },
      study: { score: 50, text: "学习困难，思路不清。需寻求帮助，调整方法。" },
      health: { score: 45, text: "身体虚弱，需特别注意肾脏和泌尿系统。" },
      social: { score: 45, text: "人际危机，可能被人误解或中伤。" }
    },
    future: "艰难之周，但险中有救。第三、六日可能有贵人相助，帮渡过难关。",
    advice: "宜：谨慎行事、寻求帮助、保持信心 \n忌：冒险行动、自暴自弃、孤军奋战"
  },
  "100011": {
    name: "水泽节",
    symbol: "☵☱",
    keyword: "节制",
    fortune: {
      career: { score: 70, text: "适可而止，事业需把握分寸。过犹不及。" },
      love: { score: 70, text: "感情需节制，给彼此空间。过紧则崩。" },
      study: { score: 75, text: "学习需劳逸结合，不可过度疲劳。" },
      health: { score: 75, text: "节制饮食和运动，保持平衡。" },
      social: { score: 70, text: "社交需节制，避免过度应酬。" }
    },
    future: "节制之周，第四日左右可能需要做出取舍，把握分寸。",
    advice: "宜：适可而止、把握分寸、劳逸结合 \n忌：过度放纵、贪得无厌、不懂节制"
  },
  "100010": {
    name: "泽水困",
    symbol: "☱☵",
    keyword: "困厄",
    fortune: {
      career: { score: 40, text: "陷入困境，事业受阻。需寻求帮助，不可硬撑。" },
      love: { score: 45, text: "感情困厄，可能陷入僵局。需外力打破。" },
      study: { score: 45, text: "学习困难，卡在某个点。需换思路或请教他人。" },
      health: { score: 40, text: "身体不适，需休息调养。" },
      social: { score: 45, text: "社交困厄，可能被孤立或误解。" }
    },
    future: "困厄之周，但困中有救。第五日后可能有转机出现。",
    advice: "宜：寻求帮助、改变思路、休养生息 \n忌：硬撑到底、固执己见、封闭自己"
  },
  "100101": {
    name: "天水讼",
    symbol: "☰☵",
    keyword: "争讼",
    fortune: {
      career: { score: 50, text: "争端四起，事业有口舌是非。需冷静处理，避免激化。" },
      love: { score: 45, text: "感情有争执，口舌之争伤感情。退一步海阔天空。" },
      study: { score: 55, text: "可能与同学或老师有分歧，需理性沟通。" },
      health: { score: 55, text: "情绪波动大，注意调节心情。" },
      social: { score: 45, text: "易与人发生口角，谨言慎行。" }
    },
    future: "口舌是非之周，第二、四日需特别注意，避免与人争执。",
    advice: "宜：冷静沟通、避免争执、寻求调解 \n忌：意气用事、激化矛盾、诉讼官司"
  },

  // 艮宫
  "110111": {
    name: "山天大畜",
    symbol: "☶☰",
    keyword: "大蓄",
    fortune: {
      career: { score: 85, text: "积蓄丰厚，事业基础扎实。适合大展宏图。" },
      love: { score: 75, text: "感情基础稳固，可以考虑更进一步。" },
      study: { score: 85, text: "知识积累丰厚，融会贯通，学以致用。" },
      health: { score: 80, text: "身体底子好，适合挑战高强度运动。" },
      social: { score: 80, text: "人脉积累丰厚，资源丰富。" }
    },
    future: "积蓄爆发之周，第四日左右可能看到长期积累的回报。",
    advice: "宜：大展宏图、学以致用、分享资源 \n忌：固步自封、守财奴、不愿分享"
  },
  "110110": {
    name: "山风蛊",
    symbol: "☶☴",
    keyword: "蛊惑",
    fortune: {
      career: { score: 55, text: "积弊已久，事业需革新。破旧立新，方能重生。" },
      love: { score: 55, text: "感情有旧问题需解决，逃避只会让问题更严重。" },
      study: { score: 60, text: "学习方法陈旧，需革新方法，提高效率。" },
      health: { score: 55, text: "旧疾可能复发，需及时调理。" },
      social: { score: 55, text: "人际关系有隐患，需及时处理。" }
    },
    future: "革新之周，第三日左右发现问题所在，第五日开始革新。",
    advice: "宜：革新除弊、清理旧账、改变方法 \n忌：因循守旧、逃避问题、粉饰太平"
  },
  "110100": {
    name: "艮为山",
    symbol: "☶☶",
    keyword: "止静",
    fortune: {
      career: { score: 60, text: "适可而止，事业需停顿休整。知止而后有定。" },
      love: { score: 60, text: "感情需暂停，给彼此空间思考。" },
      study: { score: 65, text: "学习需停顿，消化吸收已学知识。" },
      health: { score: 70, text: "适合静止养生，如冥想、瑜伽、太极。" },
      social: { score: 55, text: "社交需减少，独处静思为佳。" }
    },
    future: "静止之周，适合休整、反思、规划。第五日后可考虑重新出发。",
    advice: "宜：静思冥想、休养生息、反思总结 \n忌：盲目行动、过度社交、不知止足"
  },
  "110000": {
    name: "山地剥",
    symbol: "☶☷",
    keyword: "剥落",
    fortune: {
      career: { score: 40, text: "小人当道，事业受损。需防微杜渐，保存核心实力。" },
      love: { score: 45, text: "感情有裂痕，需及时修补，避免问题扩大。" },
      study: { score: 50, text: "基础不牢，需回归课本，夯实基本功。" },
      health: { score: 45, text: "身体虚弱，需特别注意营养和休息。" },
      social: { score: 40, text: "可能遭遇背叛或误解，信任需谨慎。" }
    },
    future: "运势下滑的一周，旧有问题逐渐暴露。第六日后开始触底反弹。",
    advice: "宜：巩固基础、休养生息、清理旧物 \n忌：扩张投资、轻信他人、忽视细节"
  },
  "110001": {
    name: "地山谦",
    symbol: "☷☶",
    keyword: "谦逊",
    fortune: {
      career: { score: 80, text: "谦虚使人进步，低调做事反而获得更多认可。" },
      love: { score: 75, text: "谦逊的态度让感情更加和谐，避免争强好胜。" },
      study: { score: 80, text: "虚心求教，不耻下问，学习效率反而更高。" },
      health: { score: 75, text: "状态良好，谦逊的心态有助于身心平衡。" },
      social: { score: 85, text: "谦和的态度赢得众人好感，人缘极佳。" }
    },
    future: "谦逊受福的一周，第三、四日可能因谦虚态度获得意外之喜。",
    advice: "宜：谦虚待人、虚心学习、低调行事 \n忌：炫耀张扬、争强好胜、自以为是"
  },
  "110011": {
    name: "雷山小过",
    symbol: "☳☶",
    keyword: "小过",
    fortune: {
      career: { score: 60, text: "小有偏差，需及时调整。不宜做重大决策。" },
      love: { score: 60, text: "感情有小波折，及时沟通即可化解。" },
      study: { score: 65, text: "学习有偏差，需及时纠正方向。" },
      health: { score: 60, text: "身体有小恙，注意休息即可恢复。" },
      social: { score: 60, text: "社交中有小误会，及时解释清楚。" }
    },
    future: "小有波折的一周，问题不大，但需及时修正。第四日左右需特别注意。",
    advice: "宜：及时修正、保持谨慎、从小处着手 \n忌：忽视小问题、盲目乐观、大意失荆州"
  },
  "110010": {
    name: "泽山咸",
    symbol: "☱☶",
    keyword: "感应",
    fortune: {
      career: { score: 75, text: "心有灵犀，与同事配合默契。团队合作效率高。" },
      love: { score: 90, text: "感情感应强烈，心有灵犀一点通。表白成功率极高。" },
      study: { score: 70, text: "直觉敏锐，适合需要灵感的创造性学习。" },
      health: { score: 75, text: "身心感应良好，适合瑜伽、冥想等身心练习。" },
      social: { score: 80, text: "人际感应力强，能敏锐捕捉他人情绪。" }
    },
    future: "感应强烈的一周，第三、五日适合重要的人际互动。",
    advice: "宜：表达情感、团队合作、身心练习 \n忌：封闭自己、忽视直觉、理性过度"
  },
  "110101": {
    name: "天山遁",
    symbol: "☰☶",
    keyword: "退避",
    fortune: {
      career: { score: 60, text: "时机不利，宜退守自保，不宜冒进。保存实力为上。" },
      love: { score: 55, text: "感情进入冷淡期，给彼此空间比紧逼更有效。" },
      study: { score: 65, text: "遇到瓶颈，暂时退一步，调整方法再出发。" },
      health: { score: 60, text: "身体需要休息，减少高强度运动，多静养。" },
      social: { score: 50, text: "避免卷入纷争，低调行事为佳。" }
    },
    future: "未来一周运势低迷，宜守不宜攻。第二、五日需特别注意，避免重大决策。",
    advice: "宜：静思冥想、整理复盘、休养生息 \n忌：强行推进、参与纷争、大额投资"
  },

  // 坤宫
  "000111": {
    name: "地天泰",
    symbol: "☷☰",
    keyword: "通泰",
    fortune: {
      career: { score: 90, text: "天地交泰，事业亨通。上下沟通顺畅，项目推进顺利。" },
      love: { score: 85, text: "感情和谐，天地交而万物通。彼此理解，关系融洽。" },
      study: { score: 85, text: "学习状态极佳，融会贯通，举一反三。" },
      health: { score: 85, text: "身心安泰，状态极佳。" },
      social: { score: 85, text: "人际关系和谐，左右逢源。" }
    },
    future: "通泰之周，运势极佳。第三、四日可能有意外之喜。",
    advice: "宜：大展宏图、沟通交流、合作共赢 \n忌：闭门造车、固步自封、骄傲自满"
  },
  "000110": {
    name: "地风升",
    symbol: "☷☴",
    keyword: "上升",
    fortune: {
      career: { score: 85, text: "步步高升，事业蒸蒸日上。把握机遇，更上层楼。" },
      love: { score: 75, text: "感情升温，关系逐步深入。" },
      study: { score: 80, text: "学业进步，成绩稳步提升。" },
      health: { score: 75, text: "状态回升，适合循序渐进增加运动量。" },
      social: { score: 80, text: "社交层次提升，结识更高层次的朋友。" }
    },
    future: "上升之周，运势逐日走高。第五日可能达到新的高度。",
    advice: "宜：积极进取、把握机遇、拓展视野 \n忌：安于现状、不思进取、错失良机"
  },
  "000100": {
    name: "地山谦",
    symbol: "☷☶",
    keyword: "谦逊",
    fortune: {
      career: { score: 80, text: "谦虚使人进步，低调做事反而获得更多认可。" },
      love: { score: 75, text: "谦逊的态度让感情更加和谐，避免争强好胜。" },
      study: { score: 80, text: "虚心求教，不耻下问，学习效率反而更高。" },
      health: { score: 75, text: "状态良好，谦逊的心态有助于身心平衡。" },
      social: { score: 85, text: "谦和的态度赢得众人好感，人缘极佳。" }
    },
    future: "谦逊受福的一周，第三、四日可能因谦虚态度获得意外之喜。",
    advice: "宜：谦虚待人、虚心学习、低调行事 \n忌：炫耀张扬、争强好胜、自以为是"
  },
  "000000": {
    name: "坤为地",
    symbol: "☷☷",
    keyword: "厚德",
    fortune: {
      career: { score: 80, text: "厚德载物，事业根基稳固。包容并蓄，终将大成。" },
      love: { score: 80, text: "感情包容，彼此扶持。细水长流，平淡是真。" },
      study: { score: 80, text: "厚积薄发，基础扎实。持续努力，必有收获。" },
      health: { score: 80, text: "状态平稳，厚德载物，身心安宁。" },
      social: { score: 85, text: "包容大度，人缘极佳。众人拾柴火焰高。" }
    },
    future: "平稳之周，运势稳定。适合打基础、做积累。第五日可能有小收获。",
    advice: "宜：包容他人、打牢基础、持续努力 \n忌：急躁冒进、斤斤计较、半途而废"
  },
  "000001": {
    name: "地雷复",
    symbol: "☷☳",
    keyword: "复兴",
    fortune: {
      career: { score: 75, text: "否极泰来，事业开始复苏。保持希望，继续努力。" },
      love: { score: 75, text: "感情回暖，破镜重圆有望。给彼此重新开始的机会。" },
      study: { score: 75, text: "学习状态回升，之前的困难逐渐克服。" },
      health: { score: 75, text: "身体开始康复，坚持治疗，不要放弃。" },
      social: { score: 75, text: "人际关系修复，主动示好，化解误会。" }
    },
    future: "复兴之周，运势逐日好转。第三日后明显回升，第六日可能有好消息。",
    advice: "宜：重新开始、修复关系、保持希望 \n忌：沉溺过去、放弃努力、重蹈覆辙"
  },
  "000011": {
    name: "地泽临",
    symbol: "☷☱",
    keyword: "临近",
    fortune: {
      career: { score: 80, text: "好事将近，事业有望突破。做好准备，迎接机遇。" },
      love: { score: 80, text: "感情即将有进展，保持积极心态。" },
      study: { score: 80, text: "考试或考核临近，做好准备，必有好成绩。" },
      health: { score: 75, text: "状态良好，适合为即将到来的挑战做准备。" },
      social: { score: 80, text: "重要社交活动临近，做好准备，展现最佳一面。" }
    },
    future: "好事临近之周，第四、五日可能有重要机遇或好消息。",
    advice: "宜：做好准备、迎接机遇、保持积极 \n忌：临阵磨枪、消极等待、错失良机"
  },
  "000010": {
    name: "地水师",
    symbol: "☷☵",
    keyword: "行师",
    fortune: {
      career: { score: 70, text: "团队协作，事业需集体力量。听从指挥，配合团队。" },
      love: { score: 65, text: "感情中需有主见，但也需尊重对方。" },
      study: { score: 70, text: "团队学习效果好，互相帮助，共同进步。" },
      health: { score: 70, text: "适合团体运动，如球类、健身操等。" },
      social: { score: 75, text: "团队活动增进感情，集体荣誉感强。" }
    },
    future: "团队之周，第三、四日可能有团队活动或项目需要协作完成。",
    advice: "宜：团队协作、服从指挥、集体活动 \n忌：个人主义、不服管教、独来独往"
  },
  "000101": {
    name: "地天泰",
    symbol: "☷☰",
    keyword: "通泰",
    fortune: {
      career: { score: 90, text: "天地交泰，事业亨通。上下沟通顺畅，项目推进顺利。" },
      love: { score: 85, text: "感情和谐，天地交而万物通。彼此理解，关系融洽。" },
      study: { score: 85, text: "学习状态极佳，融会贯通，举一反三。" },
      health: { score: 85, text: "身心安泰，状态极佳。" },
      social: { score: 85, text: "人际关系和谐，左右逢源。" }
    },
    future: "通泰之周，运势极佳。第三、四日可能有意外之喜。",
    advice: "宜：大展宏图、沟通交流、合作共赢 \n忌：闭门造车、固步自封、骄傲自满"
  }
};

// 如果卦象不在数据库中，使用通用解读
defaultGua = {
  name: "变卦",
  symbol: "◐◑",
  keyword: "变化",
  fortune: {
    career: { score: 70, text: "运势变化中，保持灵活应对。" },
    love: { score: 70, text: "感情有变化，顺其自然发展。" },
    study: { score: 70, text: "学习状态变化，调整方法适应。" },
    health: { score: 70, text: "身体状态变化，注意观察调整。" },
    social: { score: 70, text: "人际关系变化，保持开放心态。" }
  },
  future: "变化之周，保持灵活心态，随机应变。",
  advice: "宜：灵活应变、保持开放、观察变化 \n忌：固执己见、抗拒变化、墨守成规"
};

// ==================== 数据映射配置 ====================

// Strava 骑行数据 → 六爻映射
const STRAVA_MAPPING = {
  dimensions: [
    { name: "骑行距离", unit: "km", defaultThreshold: 20, highDesc: "动力充沛", lowDesc: "蓄势待发" },
    { name: "平均速度", unit: "km/h", defaultThreshold: 22, highDesc: "节奏稳健", lowDesc: "悠然自得" },
    { name: "心率峰值", unit: "bpm", defaultThreshold: 160, highDesc: "激情澎湃", lowDesc: "从容不迫" },
    { name: "爬升海拔", unit: "m", defaultThreshold: 200, highDesc: "攀登高峰", lowDesc: "平川缓行" },
    { name: "卡路里消耗", unit: "kcal", defaultThreshold: 500, highDesc: "能量释放", lowDesc: "内敛守中" },
    { name: "骑行时长", unit: "min", defaultThreshold: 60, highDesc: "持久不息", lowDesc: "短兵相接" }
  ],
  /**
   * 根据历史数据计算个性化基准值
   * @param {Array} history - 近7天的历史数据
   * @returns {Object} 每个维度的个性化基准值
   */
  calculatePersonalThresholds: function(history) {
    const thresholds = {};
    this.dimensions.forEach(dim => {
      const values = history.map(h => h.data[dim.name]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        // 使用中位数作为基准（比平均值更稳定，不受极端值影响）
        values.sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        thresholds[dim.name] = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      } else {
        // 如果没有历史数据，使用默认基准值
        thresholds[dim.name] = dim.defaultThreshold;
      }
    });
    return thresholds;
  },
  /**
   * 数据映射为六爻（使用个性化基准值）
   * @param {Object} todayData - 今日数据
   * @param {Object} personalThresholds - 个性化基准值
   * @param {string} thresholdSource - 基准值来源说明
   */
  mapToYao: function(todayData, personalThresholds, thresholdSource) {
    return this.dimensions.map((dim, index) => {
      const value = todayData[dim.name];
      // 使用个性化基准值，如果没有则用默认值
      const threshold = personalThresholds[dim.name] || dim.defaultThreshold;
      const isYang = value >= threshold;
      return {
        position: index + 1, // 1-6，从下到上
        name: dim.name,
        value: value,
        unit: dim.unit,
        threshold: threshold,
        thresholdSource: thresholdSource || '系统默认基准',
        isYang: isYang,
        desc: isYang ? dim.highDesc : dim.lowDesc,
        yaoSymbol: isYang ? "━" : "━ ━"
      };
    });
  }
};

// 华为运动健康 → 六爻映射
const HUAWEI_MAPPING = {
  dimensions: [
    { name: "步数", unit: "步", defaultThreshold: 8000, highDesc: "步履不停", lowDesc: "静思养神" },
    { name: "心率均值", unit: "bpm", defaultThreshold: 75, highDesc: "心血充盈", lowDesc: "心静如水" },
    { name: "睡眠时长", unit: "h", defaultThreshold: 7, highDesc: "养精蓄锐", lowDesc: "惜时如金" },
    { name: "压力指数", unit: "分", defaultThreshold: 50, highDesc: "压力催进", lowDesc: "云淡风轻" },
    { name: "运动类型强度", unit: "级", defaultThreshold: 3, highDesc: "多元挑战", lowDesc: "专一精进" },
    { name: "血氧饱和度", unit: "%", defaultThreshold: 95, highDesc: "气血旺盛", lowDesc: "内敛调息" }
  ],
  calculatePersonalThresholds: function(history) {
    const thresholds = {};
    this.dimensions.forEach(dim => {
      const values = history.map(h => h.data[dim.name]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        values.sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        thresholds[dim.name] = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      } else {
        thresholds[dim.name] = dim.defaultThreshold;
      }
    });
    return thresholds;
  },
  mapToYao: function(todayData, personalThresholds, thresholdSource) {
    return this.dimensions.map((dim, index) => {
      const value = todayData[dim.name];
      const threshold = personalThresholds[dim.name] || dim.defaultThreshold;
      const isYang = value >= threshold;
      return {
        position: index + 1,
        name: dim.name,
        value: value,
        unit: dim.unit,
        threshold: threshold,
        thresholdSource: thresholdSource || '系统默认基准',
        isYang: isYang,
        desc: isYang ? dim.highDesc : dim.lowDesc,
        yaoSymbol: isYang ? "━" : "━ ━"
      };
    });
  }
};

// 苹果健康 → 六爻映射
const APPLE_MAPPING = {
  dimensions: [
    { name: "活动能量", unit: "kcal", defaultThreshold: 400, highDesc: "活力四射", lowDesc: "蓄力待发" },
    { name: "运动分钟", unit: "min", defaultThreshold: 30, highDesc: "动则生阳", lowDesc: "静以修身" },
    { name: "站立小时", unit: "h", defaultThreshold: 8, highDesc: "立身中正", lowDesc: "安坐沉思" },
    { name: "心率变异", unit: "ms", defaultThreshold: 40, highDesc: "心性灵动", lowDesc: "心绪平稳" },
    { name: "步数", unit: "步", defaultThreshold: 8000, highDesc: "行稳致远", lowDesc: "静观其变" },
    { name: "睡眠时长", unit: "h", defaultThreshold: 7, highDesc: "养精蓄锐", lowDesc: "惜时奋进" }
  ],
  calculatePersonalThresholds: function(history) {
    const thresholds = {};
    this.dimensions.forEach(dim => {
      const values = history.map(h => h.data[dim.name]).filter(v => v !== undefined && v !== null);
      if (values.length > 0) {
        values.sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        thresholds[dim.name] = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      } else {
        thresholds[dim.name] = dim.defaultThreshold;
      }
    });
    return thresholds;
  },
  mapToYao: function(todayData, personalThresholds, thresholdSource) {
    return this.dimensions.map((dim, index) => {
      const value = todayData[dim.name];
      const threshold = personalThresholds[dim.name] || dim.defaultThreshold;
      const isYang = value >= threshold;
      return {
        position: index + 1,
        name: dim.name,
        value: value,
        unit: dim.unit,
        threshold: threshold,
        thresholdSource: thresholdSource || '系统默认基准',
        isYang: isYang,
        desc: isYang ? dim.highDesc : dim.lowDesc,
        yaoSymbol: isYang ? "━" : "━ ━"
      };
    });
  }
};

// ==================== 核心算法 ====================

/**
 * 数据 → 卦象
 * @param {string} source - 数据源: 'strava' | 'huawei' | 'apple'
 * @param {object} todayData - 今日运动数据
 * @param {Array} history - 近7天历史数据（用于计算个性化基准值）
 * @returns {object} 卦象结果
 */
function calculateGua(source, todayData, history) {
  let mapping;
  switch(source) {
    case 'strava': mapping = STRAVA_MAPPING; break;
    case 'huawei': mapping = HUAWEI_MAPPING; break;
    case 'apple': mapping = APPLE_MAPPING; break;
    default: mapping = STRAVA_MAPPING;
  }

  // 计算个性化基准值
  let personalThresholds = {};
  let thresholdSource = '系统默认基准';

  if (history && history.length > 0) {
    personalThresholds = mapping.calculatePersonalThresholds(history);
    // 判断基准值来源
    const hasValidHistory = Object.keys(personalThresholds).length > 0;
    if (hasValidHistory) {
      thresholdSource = `个人近${history.length}天中位数`;
    }
  }

  // 生成六爻
  const yaoList = mapping.mapToYao(todayData, personalThresholds, thresholdSource);

  // 生成卦象二进制码（从下到上：初爻到上爻）
  // 阳爻=1，阴爻=0
  const guaCode = yaoList.map(y => y.isYang ? '1' : '0').join('');

  // 查找卦象解读
  const guaInfo = GUA_DATABASE[guaCode] || defaultGua;

  // 构建上下卦信息
  const lowerYao = yaoList.slice(0, 3); // 初、二、三爻 → 下卦
  const upperYao = yaoList.slice(3, 6); // 四、五、上爻 → 上卦

  const lowerCode = lowerYao.map(y => y.isYang ? '1' : '0').join('');
  const upperCode = upperYao.map(y => y.isYang ? '1' : '0').join('');

  return {
    source: source,
    yaoList: yaoList,
    guaCode: guaCode,
    lowerCode: lowerCode,
    upperCode: upperCode,
    name: guaInfo.name,
    symbol: guaInfo.symbol,
    keyword: guaInfo.keyword,
    fortune: guaInfo.fortune,
    future: guaInfo.future,
    advice: guaInfo.advice,
    thresholdSource: thresholdSource,
    // 计算综合运势分
    overallScore: Math.round(
      (guaInfo.fortune.career.score +
       guaInfo.fortune.love.score +
       guaInfo.fortune.study.score +
       guaInfo.fortune.health.score +
       guaInfo.fortune.social.score) / 5
    )
  };
}

/**
 * 获取卦象的Unicode符号
 */
function getGuaUnicode(lowerCode, upperCode) {
  const trigramMap = {
    '111': '☰', // 乾
    '000': '☷', // 坤
    '001': '☳', // 震
    '010': '☵', // 坎
    '100': '☶', // 艮
    '011': '☱', // 兑
    '101': '☲', // 离
    '110': '☴'  // 巽
  };
  return (trigramMap[upperCode] || '◐') + (trigramMap[lowerCode] || '◑');
}

/**
 * 根据测算维度调整运势评分
 * 使选中的维度更加突出
 */
function adjustFortuneByDimension(guaResult, dimension) {
  const adjusted = JSON.parse(JSON.stringify(guaResult));
  const dimMap = {
    'career': '事业',
    'love': '爱情',
    'study': '学业',
    'health': '健康',
    'social': '人际'
  };

  // 提升选中维度20%权重
  if (adjusted.fortune[dimension]) {
    const originalScore = adjusted.fortune[dimension].score;
    adjusted.fortune[dimension].score = Math.min(100, Math.round(originalScore * 1.1));
    adjusted.fortune[dimension].text += "\n【今日主求】此卦象特别有利于" + dimMap[dimension] + "方面的探索。";
  }

  // 重新计算综合分
  adjusted.overallScore = Math.round(
    (adjusted.fortune.career.score +
     adjusted.fortune.love.score +
     adjusted.fortune.study.score +
     adjusted.fortune.health.score +
     adjusted.fortune.social.score) / 5
  );

  adjusted.focusDimension = dimension;
  return adjusted;
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateGua, getGuaUnicode, adjustFortuneByDimension, GUA_DATABASE };
}
