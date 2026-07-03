/**
 * 行动力 — AI 行为设计方案库
 * 由 TRAE AI 生成，基于福格行为模型 (B=MAP)
 * 覆盖 20 个目标类型 × 3 种障碍 × 3 个难度 = 180 个方案
 */

const PLAN_LIBRARY = {
  // ===== 1. 跑步/运动 =====
  "跑步/运动": {
    keywords: ["跑", "运动", "健身", "锻炼", "训练", "体能", "有氧", "燃脂"],
    motivation: {
      easy: {
        behavior: "打开运动App看10秒",
        anchor: "每天早上穿衣服后",
        environment: "把手机壁纸换成运动励志图",
        celebrate: "对自己说：我正在变得更好"
      },
      medium: {
        behavior: "换上运动鞋站在门口",
        anchor: "下班到家放下包后",
        environment: "把运动鞋放在门口最显眼的位置",
        celebrate: "拍一张运动鞋的照片发朋友圈"
      },
      standard: {
        behavior: "出门走2分钟",
        anchor: "吃完晚饭后",
        environment: "提前把运动服铺在床头",
        celebrate: "听一首喜欢的歌庆祝"
      }
    },
    ability: {
      easy: {
        behavior: "原地踏步10下",
        anchor: "看电视广告时间",
        environment: '在客厅画一个小圈作为"运动区"',
        celebrate: "喝一杯水，感受身体的活力"
      },
      medium: {
        behavior: "做一个深蹲",
        anchor: "每次去洗手间后",
        environment: '在办公桌旁贴"深蹲挑战"便利贴',
        celebrate: "伸个懒腰，感受肌肉的发力"
      },
      standard: {
        behavior: "绕客厅走一圈",
        anchor: "每坐1小时后",
        environment: "把椅子移远一点，增加起身难度",
        celebrate: "深呼吸3次，享受运动后的清爽"
      }
    },
    prompt: {
      easy: {
        behavior: "看一眼窗外的风景",
        anchor: "手机弹出提醒时",
        environment: '在门上贴"今天运动了吗？"',
        celebrate: "对着镜子给自己一个微笑"
      },
      medium: {
        behavior: "站起来伸个懒腰",
        anchor: "闹钟响时（设置每天固定时间）",
        environment: "把运动App放在手机首屏",
        celebrate: "记录今天的感受，哪怕只有一句话"
      },
      standard: {
        behavior: "出门走50米",
        anchor: "刷完牙后",
        environment: '在门口放一张"出发！"的便签',
        celebrate: "感受阳光照在脸上的温度"
      }
    }
  },

  // ===== 2. 读书/阅读 =====
  "读书/阅读": {
    keywords: ["读", "书", "阅读", "看书", "学习", "知识", "文学"],
    motivation: {
      easy: {
        behavior: "翻开书看一行字",
        anchor: "想刷手机的时候",
        environment: "把最喜欢的书放在枕头边",
        celebrate: "轻轻合上书，感受内心的平静"
      },
      medium: {
        behavior: "读一段书（约200字）",
        anchor: "喝咖啡时",
        environment: "在床头安装一个小书架",
        celebrate: "在书页上贴一个小便签标记进度"
      },
      standard: {
        behavior: "读1页书",
        anchor: "睡前15分钟",
        environment: "把手机放在另一个房间充电",
        celebrate: "关灯后回想刚才读到的内容"
      }
    },
    ability: {
      easy: {
        behavior: "用手摸一下书的封面",
        anchor: "经过书桌时",
        environment: "把书摊开放在桌上",
        celebrate: "欣赏书的封面设计"
      },
      medium: {
        behavior: "读1句话",
        anchor: "等电梯时",
        environment: "随身携带一本轻薄的小书",
        celebrate: "在心里默念这句喜欢的话"
      },
      standard: {
        behavior: "读5分钟",
        anchor: "午休时",
        environment: "准备一个舒适的阅读角",
        celebrate: "摘抄一句有感触的话"
      }
    },
    prompt: {
      easy: {
        behavior: "看一眼书的标题",
        anchor: "坐下的瞬间",
        environment: "把书放在你经常坐的地方",
        celebrate: "想象书中的世界"
      },
      medium: {
        behavior: "打开书翻到上次读的地方",
        anchor: "晚饭后",
        environment: "设置每天同一个闹钟提醒阅读",
        celebrate: "用书签标记今天的进度"
      },
      standard: {
        behavior: "读1页",
        anchor: "刷牙后",
        environment: '在冰箱上贴"今天读书了吗"',
        celebrate: "和家人分享今天读到的一个观点"
      }
    }
  },

  // ===== 3. 早起 =====
  "早起": {
    keywords: ["早", "起", "起床", "早起", "作息", "晨间", "morning"],
    motivation: {
      easy: {
        behavior: "闹钟响后眼睛睁开5秒",
        anchor: "闹钟响时",
        environment: "把窗帘留一条缝让晨光进来",
        celebrate: "深呼吸感受新的一天的开始"
      },
      medium: {
        behavior: "闹钟响后坐起来",
        anchor: "第一个闹钟响时",
        environment: "把闹钟放在必须起身才能关掉的地方",
        celebrate: "对自己说：又是美好的一天"
      },
      standard: {
        behavior: "起床后喝1杯水",
        anchor: "关掉闹钟后",
        environment: "床头放一杯昨晚倒好的水",
        celebrate: "感受水流过喉咙的清爽"
      }
    },
    ability: {
      easy: {
        behavior: "比平时早起1分钟",
        anchor: "闹钟响时",
        environment: "把闹钟时间只调早1分钟",
        celebrate: "享受多出来的1分钟宁静"
      },
      medium: {
        behavior: "闹钟响后打开灯",
        anchor: "第一个闹钟响时",
        environment: "安装智能灯泡，设置自动渐亮",
        celebrate: "感受光明带来的清醒"
      },
      standard: {
        behavior: "早起5分钟做1次深呼吸",
        anchor: "关掉闹钟后",
        environment: "提前准备好第二天要穿的衣服",
        celebrate: "站在窗前看外面的天空"
      }
    },
    prompt: {
      easy: {
        behavior: "睡前把闹钟放到手边",
        anchor: "睡觉前",
        environment: '手机闹钟标签改成"早起奖励！"',
        celebrate: "躺平感受完成任务后的轻松"
      },
      medium: {
        behavior: "睡前设定2个闹钟（间隔5分钟）",
        anchor: "睡前准备时",
        environment: "在床头贴一张早晨想做的事清单",
        celebrate: "想象明天早起后要做的事"
      },
      standard: {
        behavior: "早起后打开窗户通通风",
        anchor: "起床穿衣后",
        environment: "睡前把手机放在另一个房间",
        celebrate: "呼吸一口新鲜空气"
      }
    }
  },

  // ===== 4. 学英语 =====
  "学英语": {
    keywords: ["英语", "英文", "学", "背单词", "听力", "口语", "foreign", "language"],
    motivation: {
      easy: {
        behavior: "打开英语学习App看1秒",
        anchor: "想刷短视频的时候",
        environment: "把学习App图标换成最喜欢的颜色",
        celebrate: "对自己说：我又靠近目标一点点"
      },
      medium: {
        behavior: "听10秒英语音频",
        anchor: "通勤路上",
        environment: "订阅一个有趣的英语播客",
        celebrate: "听懂一个词就给自己一个赞"
      },
      standard: {
        behavior: "学1个新单词",
        anchor: "早饭后",
        environment: "在冰箱上贴昨天学的单词",
        celebrate: "用这个新单词造一个句子"
      }
    },
    ability: {
      easy: {
        behavior: "看1个英语单词（不用记）",
        anchor: "打开手机时",
        environment: "把手机壁纸换成英语单词表",
        celebrate: "欣赏这个单词的拼写"
      },
      medium: {
        behavior: "跟读1句英语（模仿发音）",
        anchor: "刷牙时",
        environment: "在洗手间贴一张常用句型",
        celebrate: "录下来听自己的发音"
      },
      standard: {
        behavior: "看1分钟英语短视频",
        anchor: "午休时",
        environment: "收藏几个有趣的英语学习账号",
        celebrate: "在评论区用英语回复一个表情"
      }
    },
    prompt: {
      easy: {
        behavior: "看一眼昨天学的单词",
        anchor: "打开手机锁屏时",
        environment: "把学习App放在手机首屏",
        celebrate: "在脑海中回忆这个单词的意思"
      },
      medium: {
        behavior: "打开英语学习App",
        anchor: "设定每天固定时间（如早8点）",
        environment: '在书桌贴一张"英语时间到！"',
        celebrate: "完成打卡后奖励自己一颗糖"
      },
      standard: {
        behavior: "跟读1句英语",
        anchor: "晚饭前",
        environment: "设置手机每天定时提醒",
        celebrate: '对着镜子用英语说一句"I did it!"'
      }
    }
  },

  // ===== 5. 写作/日记 =====
  "写作/日记": {
    keywords: ["写", "日记", "写作", "记录", "笔记", "文字", "创作"],
    motivation: {
      easy: {
        behavior: "打开日记App或笔记本",
        anchor: "想吐槽的时候",
        environment: "准备一个特别好看的笔记本",
        celebrate: "抚摸笔记本的封面"
      },
      medium: {
        behavior: "写1个日期",
        anchor: "睡前",
        environment: "在床头放一支顺手的笔",
        celebrate: "欣赏自己的字迹"
      },
      standard: {
        behavior: "写1句话今天的心情",
        anchor: "洗完澡后",
        environment: '准备一个专属的"心情角落"',
        celebrate: "读一遍自己写的话"
      }
    },
    ability: {
      easy: {
        behavior: "在纸上画1个圈",
        anchor: "坐下时",
        environment: "在桌上永远放一张纸和笔",
        celebrate: "欣赏这个圈的圆润"
      },
      medium: {
        behavior: "写1个词描述今天",
        anchor: "等电梯时",
        environment: "随身携带小便签本",
        celebrate: "把这个词念出声"
      },
      standard: {
        behavior: "写3行今天的流水账",
        anchor: "午饭后",
        environment: "设置一个5分钟计时器",
        celebrate: "数一数自己写了多少字"
      }
    },
    prompt: {
      easy: {
        behavior: "看一眼日记本/App",
        anchor: "躺下准备睡觉时",
        environment: "把日记本放在枕头边",
        celebrate: "想象明天要记录什么"
      },
      medium: {
        behavior: "打开手机备忘录",
        anchor: "每天晚上固定时间",
        environment: "设置一个温柔的提醒闹钟",
        celebrate: "保存后听一下保存的声音"
      },
      standard: {
        behavior: "写1件今天开心的事",
        anchor: "刷牙后",
        environment: '在浴室镜子贴"今天有什么值得记录的？"',
        celebrate: "微笑着回忆这件开心的事"
      }
    }
  },

  // ===== 6. 喝水 =====
  "喝水": {
    keywords: ["水", "喝水", "饮水", " hydration", "杯"],
    motivation: {
      easy: {
        behavior: "看一眼水杯",
        anchor: "经过厨房时",
        environment: "买一个自己喜欢的水杯",
        celebrate: "欣赏水杯的颜色"
      },
      medium: {
        behavior: "拿起水杯",
        anchor: "每次坐下时",
        environment: "在桌上放一个装满水的水杯",
        celebrate: "感受杯子的温度"
      },
      standard: {
        behavior: "喝1口水",
        anchor: "每小时闹钟响时",
        environment: '在电脑上贴"喝水时间"便利贴',
        celebrate: "感受水流过喉咙的滋润"
      }
    },
    ability: {
      easy: {
        behavior: "摸一下水杯",
        anchor: "看到水杯时",
        environment: "把水杯放在手边最显眼的位置",
        celebrate: "感谢水杯的存在"
      },
      medium: {
        behavior: "把水杯拿起来放回去",
        anchor: "起身时",
        environment: "使用带吸管的水杯（更容易喝）",
        celebrate: "听水杯放下时的轻响"
      },
      standard: {
        behavior: "喝半杯水",
        anchor: "每顿饭前",
        environment: "提前准备好常温水",
        celebrate: "观察水位下降"
      }
    },
    prompt: {
      easy: {
        behavior: "注意到水杯的存在",
        anchor: "眼睛看到水杯时",
        environment: '在房门上贴"记得喝水"',
        celebrate: "给自己一个善意的提醒"
      },
      medium: {
        behavior: "把水杯放到嘴边",
        anchor: "手机每小时提醒时",
        environment: "使用有刻度的水杯",
        celebrate: '完成一次"举杯"动作'
      },
      standard: {
        behavior: "喝完一杯水",
        anchor: "起床后、饭前、睡前",
        environment: "在冰箱上贴喝水打卡表",
        celebrate: "画一个✓记录今天的第一杯"
      }
    }
  },

  // ===== 7. 早睡/改善睡眠 =====
  "早睡/改善睡眠": {
    keywords: ["睡", "早睡", "睡眠", "休息", "bed", "sleep"],
    motivation: {
      easy: {
        behavior: '睡前想一下"明天要早起"',
        anchor: "感到困的时候",
        environment: "把床整理得特别舒服",
        celebrate: "躺平感受床垫的支撑"
      },
      medium: {
        behavior: "睡前放下手机1秒钟",
        anchor: "看时间发现晚了的时候",
        environment: "把手机充电器放在另一个房间",
        celebrate: "闭上眼睛感受宁静"
      },
      standard: {
        behavior: "睡前做1次深呼吸",
        anchor: "设定好的睡觉闹钟响时",
        environment: "准备一个睡前香薰",
        celebrate: "感受身体逐渐放松"
      }
    },
    ability: {
      easy: {
        behavior: "比平时早睡1分钟",
        anchor: "觉得困的时候",
        environment: "把闹钟提前1分钟",
        celebrate: "感恩多出来的1分钟睡眠"
      },
      medium: {
        behavior: "睡前调暗灯光",
        anchor: "睡前30分钟",
        environment: "准备一个小夜灯",
        celebrate: "享受暖光带来的困意"
      },
      standard: {
        behavior: "睡前10分钟不看屏幕",
        anchor: "睡前闹钟响后",
        environment: "把手机放到够不着的地方",
        celebrate: "在黑暗中感受自己的呼吸"
      }
    },
    prompt: {
      easy: {
        behavior: "看一眼床",
        anchor: "感到累的时候",
        environment: '在客厅贴"该睡觉了"便签',
        celebrate: "想象躺在床上的舒适感"
      },
      medium: {
        behavior: "开始睡前准备（洗脸/刷牙）",
        anchor: "设定固定时间的睡前闹钟",
        environment: "设置手机自动开启勿扰模式",
        celebrate: "完成准备后对着镜子微笑"
      },
      standard: {
        behavior: "按时上床躺下",
        anchor: "完成所有睡前准备后",
        environment: '在床头放一个"晚安"小摆件',
        celebrate: "对自己说：今天辛苦了，晚安"
      }
    }
  },

  // ===== 8. 冥想/正念 =====
  "冥想/正念": {
    keywords: ["冥想", "正念", "静心", "呼吸", "放松", "meditation"],
    motivation: {
      easy: {
        behavior: "闭上眼睛1秒",
        anchor: "感到烦躁的时候",
        environment: "准备一个舒适的坐垫",
        celebrate: "感受眼睑闭合的温柔"
      },
      medium: {
        behavior: "做1次深呼吸",
        anchor: "等红灯时",
        environment: '在办公桌放一个小摆件作为"正念锚点"',
        celebrate: "感受腹部起伏"
      },
      standard: {
        behavior: "闭眼深呼吸3次",
        anchor: "每天固定时间（如午饭后）",
        environment: "找一个安静的角落",
        celebrate: "慢慢睁开眼睛，感受清晰"
      }
    },
    ability: {
      easy: {
        behavior: "注意自己的一次呼吸",
        anchor: "任何时候",
        environment: "不需要准备，随时随地",
        celebrate: '觉察到"我在呼吸"的瞬间'
      },
      medium: {
        behavior: "专注呼吸10秒",
        anchor: "坐下时",
        environment: "设置一个10秒计时器",
        celebrate: "感谢自己给了大脑10秒休息"
      },
      standard: {
        behavior: "静坐1分钟",
        anchor: "每天固定时间",
        environment: "准备一个定时器",
        celebrate: "感受1分钟带来的平静"
      }
    },
    prompt: {
      easy: {
        behavior: '注意到"我可以呼吸"',
        anchor: "任何时候想起",
        environment: "在手机上设一个温柔的文字提醒",
        celebrate: "感恩这个觉察的瞬间"
      },
      medium: {
        behavior: "停下来做1次深呼吸",
        anchor: "手机每小时提醒时",
        environment: '在电脑旁贴"呼吸"便利贴',
        celebrate: "感受氧气进入身体"
      },
      standard: {
        behavior: "进行1分钟正念练习",
        anchor: "睡前",
        environment: "使用冥想App的提醒功能",
        celebrate: "带着平静入睡"
      }
    }
  },

  // ===== 9. 健康饮食 =====
  "健康饮食": {
    keywords: ["吃", "饮食", "健康", "减肥", "减脂", "蔬菜", "营养", "diet"],
    motivation: {
      easy: {
        behavior: '想一下"我想吃得更健康"',
        anchor: "看到食物的时候",
        environment: "在冰箱上贴健康食物的图片",
        celebrate: "感谢食物给身体带来的能量"
      },
      medium: {
        behavior: "饭前看一眼食物的成分",
        anchor: "拿起筷子前",
        environment: "准备一个健康食谱收藏夹",
        celebrate: "为自己关注健康的选择点赞"
      },
      standard: {
        behavior: "每顿饭多吃1口蔬菜",
        anchor: "吃饭时",
        environment: "把蔬菜放在碗的最上面",
        celebrate: "感受蔬菜的新鲜口感"
      }
    },
    ability: {
      easy: {
        behavior: "喝1口水代替零食",
        anchor: "想吃零食的时候",
        environment: "把零食放到看不见的地方",
        celebrate: "感受水带来的饱腹感"
      },
      medium: {
        behavior: "把零食分成小份",
        anchor: "买零食回来后",
        environment: "准备小分装袋",
        celebrate: "欣赏自己有条理的分装"
      },
      standard: {
        behavior: "饭前喝1杯水",
        anchor: "每顿饭前",
        environment: "在餐桌上永远放一杯水",
        celebrate: "完成一个健康的餐前仪式"
      }
    },
    prompt: {
      easy: {
        behavior: "看到冰箱时想一下健康目标",
        anchor: "打开冰箱时",
        environment: '在冰箱门贴"健康选择"便签',
        celebrate: "为每一次有意识的选择庆祝"
      },
      medium: {
        behavior: "饭前拍照记录",
        anchor: "摆好碗筷后",
        environment: "手机设一个饭前提醒",
        celebrate: "翻看自己记录的健康饮食"
      },
      standard: {
        behavior: "每餐减少1口主食",
        anchor: "盛饭时",
        environment: "换一个小一点的碗",
        celebrate: "感受身体的轻盈"
      }
    }
  },

  // ===== 10. 背单词 =====
  "背单词": {
    keywords: ["单词", "背", "词汇", "记忆", "英语单词", "vocabulary"],
    motivation: {
      easy: {
        behavior: "打开背单词App",
        anchor: "想玩手机的时候",
        environment: "把App放在手机首屏",
        celebrate: "欣赏App的打开动画"
      },
      medium: {
        behavior: "看1个单词（不用背）",
        anchor: "等电梯/等公交时",
        environment: "下载一个有精美界面的背单词App",
        celebrate: "赞叹这个单词的拼写"
      },
      standard: {
        behavior: "学1个新单词并读出来",
        anchor: "每天早上",
        environment: "准备一个单词本放在包里",
        celebrate: "用这个单词造一个句子"
      }
    },
    ability: {
      easy: {
        behavior: "看1个认识的单词",
        anchor: "任何时候",
        environment: "在手机便签里建一个单词列表",
        celebrate: "回忆这个单词的意思"
      },
      medium: {
        behavior: "读1个单词的发音",
        anchor: "刷牙时",
        environment: "在洗手间贴几个常用单词",
        celebrate: "模仿发音时的口型"
      },
      standard: {
        behavior: "背1个新单词（看拼写+读+意思）",
        anchor: "早饭后",
        environment: "使用带发音功能的App",
        celebrate: "闭眼在心里拼写这个单词"
      }
    },
    prompt: {
      easy: {
        behavior: "看一眼单词App的图标",
        anchor: "打开手机时",
        environment: "把背单词App和最喜欢的App放在一起",
        celebrate: "对自己说：我随时可以开始"
      },
      medium: {
        behavior: "打开单词App看今日推荐",
        anchor: "设定固定时间",
        environment: "设置每天同一个提醒",
        celebrate: '完成今天的"看一眼"任务'
      },
      standard: {
        behavior: "完成App里的1个单词任务",
        anchor: "每天固定时间",
        environment: '在书桌贴"单词时间"',
        celebrate: "查看连续打卡天数"
      }
    }
  },

  // ===== 11. 练乐器 =====
  "练乐器": {
    keywords: ["乐器", "琴", "吉他", "钢琴", "练", "音乐", "practice"],
    motivation: {
      easy: {
        behavior: "看一眼乐器",
        anchor: "路过乐器时",
        environment: "把乐器放在客厅显眼位置",
        celebrate: "欣赏乐器的外观"
      },
      medium: {
        behavior: "摸一下乐器",
        anchor: "坐下休息时",
        environment: "把乐器放在沙发旁边",
        celebrate: "感受乐器的质感"
      },
      standard: {
        behavior: "弹/吹1个音",
        anchor: "晚饭后",
        environment: "把乐谱放在琴架上",
        celebrate: "听这个音在房间里回响"
      }
    },
    ability: {
      easy: {
        behavior: "拿起乐器再放下",
        anchor: "看到乐器时",
        environment: "保持乐器随时可以拿起来",
        celebrate: '完成"拿起"这个动作'
      },
      medium: {
        behavior: "练习1个简单的音阶",
        anchor: "有空的时候",
        environment: "准备一张简单的练习谱",
        celebrate: "顺畅弹完一遍"
      },
      standard: {
        behavior: "练习5分钟",
        anchor: "每天固定时间",
        environment: "设置一个5分钟沙漏",
        celebrate: "录制一小段自己的演奏"
      }
    },
    prompt: {
      easy: {
        behavior: "看到乐器时想起练习",
        anchor: "目光扫过乐器时",
        environment: "把乐器从盒子里拿出来放着",
        celebrate: "想象自己演奏的画面"
      },
      medium: {
        behavior: "调音/检查乐器状态",
        anchor: "设定固定时间",
        environment: "在乐器上贴一个练习时间表",
        celebrate: "调好音后的成就感"
      },
      standard: {
        behavior: "完整练习1首短曲",
        anchor: "每天固定时间",
        environment: "设置手机提醒",
        celebrate: "录下来发给朋友听"
      }
    }
  },

  // ===== 12. 画画/创作 =====
  "画画/创作": {
    keywords: ["画", "画画", "创作", "art", "draw", "sketch", "creative"],
    motivation: {
      easy: {
        behavior: "看一眼画具",
        anchor: "想放松的时候",
        environment: "把画笔放在桌上",
        celebrate: "欣赏画具的色彩"
      },
      medium: {
        behavior: "在纸上画1条线",
        anchor: "午休时",
        environment: "准备一本素描本随时带着",
        celebrate: "看着这条线发呆"
      },
      standard: {
        behavior: "画1个简单的图形（圆/方）",
        anchor: "每天固定时间",
        environment: "准备一个专属的创作角落",
        celebrate: "给这个图形起个名字"
      }
    },
    ability: {
      easy: {
        behavior: "拿起画笔再放下",
        anchor: "看到画具时",
        environment: "把画具放在容易拿到的地方",
        celebrate: '完成"拿起"动作'
      },
      medium: {
        behavior: "涂鸦1分钟",
        anchor: "打电话时",
        environment: "在手边放一张纸",
        celebrate: "欣赏无意识涂鸦的图案"
      },
      standard: {
        behavior: "完成1幅小画（5分钟）",
        anchor: "周末或固定时间",
        environment: "准备一个计时器",
        celebrate: "拍照保存到相册"
      }
    },
    prompt: {
      easy: {
        behavior: "看到画具时想起创作",
        anchor: "目光扫过画具时",
        environment: "把画具放在经常坐的桌上",
        celebrate: "想象要画的内容"
      },
      medium: {
        behavior: "打开素描本翻到空白页",
        anchor: "设定固定时间",
        environment: "在本子上贴便利贴提醒",
        celebrate: "空白页带来的无限可能"
      },
      standard: {
        behavior: "完成今天的创作",
        anchor: "每天固定时间",
        environment: "设置创作时间提醒",
        celebrate: "签上自己的名字和日期"
      }
    }
  },

  // ===== 13. 整理/收纳 =====
  "整理/收纳": {
    keywords: ["整理", "收纳", "收拾", "打扫", "清洁", "organize", "tidy"],
    motivation: {
      easy: {
        behavior: "看一眼需要整理的地方",
        anchor: "感到烦躁的时候",
        environment: "保持桌面只有必需品",
        celebrate: "欣赏整洁的一角"
      },
      medium: {
        behavior: "把1样东西放回原位",
        anchor: "用完东西后",
        environment: '给每样东西指定一个"家"',
        celebrate: "看着东西各归其位"
      },
      standard: {
        behavior: "整理1个抽屉/区域",
        anchor: "每周固定时间",
        environment: "准备收纳盒",
        celebrate: "拍一张整理后的对比照"
      }
    },
    ability: {
      easy: {
        behavior: "拿起1样杂物",
        anchor: "看到杂物时",
        environment: "准备一个临时收纳篮",
        celebrate: '完成"拿起"的动作'
      },
      medium: {
        behavior: "分类3样物品",
        anchor: "有空的时候",
        environment: "准备几个分类盒",
        celebrate: "看着分类后的整齐"
      },
      standard: {
        behavior: "整理10分钟",
        anchor: "每天固定时间",
        environment: "准备一个计时器",
        celebrate: "感受空间的扩大"
      }
    },
    prompt: {
      easy: {
        behavior: "看到乱的地方时想起整理",
        anchor: "目光扫过凌乱区域时",
        environment: '在显眼处贴"先归位"便签',
        celebrate: "为自己的觉察点赞"
      },
      medium: {
        behavior: "每天睡前归位5样东西",
        anchor: "睡前",
        environment: "设置睡前提醒",
        celebrate: "看着整洁的桌面入睡"
      },
      standard: {
        behavior: "完成当天的整理任务",
        anchor: "每天固定时间",
        environment: "在日历上标记整理日",
        celebrate: "享受整洁带来的平静"
      }
    }
  },

  // ===== 14. 学习编程 =====
  "学习编程": {
    keywords: ["编程", "代码", "学习", "coding", "program", "开发", "技术"],
    motivation: {
      easy: {
        behavior: "打开编程学习网站/App",
        anchor: "想刷手机的时候",
        environment: "把学习网站设成浏览器首页",
        celebrate: "欣赏代码编辑器的界面"
      },
      medium: {
        behavior: "看1行代码（不用理解）",
        anchor: "等编译/加载时",
        environment: "关注一个有趣的编程博主",
        celebrate: "发现代码中的某个符号"
      },
      standard: {
        behavior: "写/改1行代码",
        anchor: "每天固定时间",
        environment: "准备一个练习项目",
        celebrate: "运行成功后的成就感"
      }
    },
    ability: {
      easy: {
        behavior: "复制粘贴1段示例代码",
        anchor: "想动手的时候",
        environment: "收藏几个入门教程",
        celebrate: "看着代码在编辑器里"
      },
      medium: {
        behavior: "修改1个参数看效果",
        anchor: "有10分钟空闲时",
        environment: "准备一个可在线运行的编辑器",
        celebrate: "看到修改后的变化"
      },
      standard: {
        behavior: "完成1个小练习（15分钟）",
        anchor: "每天固定时间",
        environment: "准备一个学习计划表",
        celebrate: "提交代码并通过测试"
      }
    },
    prompt: {
      easy: {
        behavior: "看到电脑时想起编程",
        anchor: "打开电脑时",
        environment: "桌面背景设为编程相关",
        celebrate: "想象自己写出酷酷的程序"
      },
      medium: {
        behavior: "打开编程学习平台",
        anchor: "设定固定时间",
        environment: "浏览器书签置顶学习网站",
        celebrate: '完成今天的"打开"任务'
      },
      standard: {
        behavior: "完成当天的学习任务",
        anchor: "每天固定时间",
        environment: "设置学习提醒闹钟",
        celebrate: "记录今天学到的新知识点"
      }
    }
  },

  // ===== 15. 记账/理财 =====
  "记账/理财": {
    keywords: ["钱", "记账", "理财", "储蓄", "消费", "budget", "money"],
    motivation: {
      easy: {
        behavior: "打开记账App",
        anchor: "花钱后",
        environment: "把记账App放在首屏",
        celebrate: "欣赏App的统计图表"
      },
      medium: {
        behavior: "记录1笔支出（金额+类别）",
        anchor: "每次消费后",
        environment: "设置自动记账提醒",
        celebrate: "看着账目越来越清晰"
      },
      standard: {
        behavior: "回顾本周支出",
        anchor: "每周固定时间",
        environment: "准备一个理财手账",
        celebrate: "发现可以优化的地方"
      }
    },
    ability: {
      easy: {
        behavior: "看一眼钱包/余额",
        anchor: "想花钱的时候",
        environment: "把记账App设快捷方式",
        celebrate: "感谢自己关注财务状况"
      },
      medium: {
        behavior: "记录1笔收入",
        anchor: "发工资/收到钱时",
        environment: "设置工资日提醒",
        celebrate: "感受收入的正向反馈"
      },
      standard: {
        behavior: "设置1个储蓄目标",
        anchor: "每月初",
        environment: "准备一个储蓄罐或专用账户",
        celebrate: "看到目标进度条前进"
      }
    },
    prompt: {
      easy: {
        behavior: "看到账单时想起记账",
        anchor: "收到账单/小票时",
        environment: '在钱包里放一张"记账"便签',
        celebrate: "为每一笔记录鼓掌"
      },
      medium: {
        behavior: "每天睡前记当天支出",
        anchor: "睡前",
        environment: "设置每晚提醒",
        celebrate: "完成今天的财务盘点"
      },
      standard: {
        behavior: "完成月度财务复盘",
        anchor: "每月固定日期",
        environment: "在日历上标记复盘日",
        celebrate: "为下一个月制定更好的计划"
      }
    }
  },

  // ===== 16. 护肤 =====
  "护肤": {
    keywords: ["护肤", "皮肤", "保养", "洗脸", "美容", "skincare"],
    motivation: {
      easy: {
        behavior: "看一眼护肤品",
        anchor: "看到镜子时",
        environment: "把护肤品放在镜子前",
        celebrate: "欣赏护肤品的包装"
      },
      medium: {
        behavior: "涂1样护肤品",
        anchor: "洗完脸后",
        environment: "把护肤品按使用顺序排列",
        celebrate: "感受护肤品的质地"
      },
      standard: {
        behavior: "完成基础护肤步骤",
        anchor: "每天早晚",
        environment: "准备一套完整的护肤流程图",
        celebrate: "照镜子欣赏自己的状态"
      }
    },
    ability: {
      easy: {
        behavior: "拿起护肤品再放下",
        anchor: "看到护肤品时",
        environment: "把护肤品放在容易拿到的地方",
        celebrate: '完成"拿起"动作'
      },
      medium: {
        behavior: "洗脸后拍1下爽肤水",
        anchor: "洗完脸后",
        environment: "把爽肤水放在洗手台",
        celebrate: "感受爽肤水的清凉"
      },
      standard: {
        behavior: "完成3步护肤（清洁+保湿+防晒）",
        anchor: "出门前/睡前",
        environment: "准备分装瓶方便携带",
        celebrate: "完成一套流程的满足感"
      }
    },
    prompt: {
      easy: {
        behavior: "看到镜子时想起护肤",
        anchor: "目光扫过镜子时",
        environment: '在镜子贴"记得护肤"便签',
        celebrate: "为关注自己的皮肤点赞"
      },
      medium: {
        behavior: "洗完脸后自动护肤",
        anchor: "洗完脸后（绑定已有习惯）",
        environment: "把护肤品放在毛巾旁边",
        celebrate: "享受护肤的仪式感"
      },
      standard: {
        behavior: "完成早晚完整护肤",
        anchor: "早晚各一次",
        environment: "设置早晚提醒",
        celebrate: "拍一张素颜照记录变化"
      }
    }
  },

  // ===== 17. 拉伸/瑜伽 =====
  "拉伸/瑜伽": {
    keywords: ["拉伸", "瑜伽", "柔韧", "放松", "stretch", "yoga"],
    motivation: {
      easy: {
        behavior: '想一下"我想更柔韧"',
        anchor: "感到身体僵硬时",
        environment: "准备一个瑜伽垫放在显眼处",
        celebrate: "想象身体变柔软的画面"
      },
      medium: {
        behavior: "做1个伸展动作",
        anchor: "坐久了起来时",
        environment: "在办公桌下放一个小瑜伽垫",
        celebrate: "感受肌肉被拉开的舒畅"
      },
      standard: {
        behavior: "完成5分钟拉伸",
        anchor: "每天固定时间",
        environment: "准备一个拉伸动作清单",
        celebrate: "感受身体变得轻盈"
      }
    },
    ability: {
      easy: {
        behavior: "转动一下脖子/手腕",
        anchor: "感觉累的时候",
        environment: "不需要准备，随时随地",
        celebrate: "听到关节轻轻响的声音"
      },
      medium: {
        behavior: "做1个简单的拉伸动作",
        anchor: "每小时站起来时",
        environment: "在墙上贴几个拉伸动作图",
        celebrate: "感受紧绷的肌肉放松"
      },
      standard: {
        behavior: "完成一套基础拉伸（10分钟）",
        anchor: "睡前或运动后",
        environment: "准备一个拉伸视频",
        celebrate: "躺下感受全身的放松"
      }
    },
    prompt: {
      easy: {
        behavior: "看到瑜伽垫时想起拉伸",
        anchor: "目光扫过瑜伽垫时",
        environment: "把瑜伽垫铺在客厅",
        celebrate: "想象自己像猫一样伸展"
      },
      medium: {
        behavior: "每小时起身伸展1次",
        anchor: "每小时闹钟响时",
        environment: "设置久坐提醒",
        celebrate: "感受血液重新流动"
      },
      standard: {
        behavior: "完成当天的拉伸练习",
        anchor: "每天固定时间",
        environment: "在日历上标记练习日",
        celebrate: "拍一张拉伸时的照片"
      }
    }
  },

  // ===== 18. 联系家人/朋友 =====
  "联系家人/朋友": {
    keywords: ["联系", "家人", "朋友", "打电话", "社交", "关系", "connect"],
    motivation: {
      easy: {
        behavior: '想一下"我想TA了"',
        anchor: "看到和TA相关的物品时",
        environment: "把手机通讯录置顶重要的人",
        celebrate: "回忆和TA的美好时光"
      },
      medium: {
        behavior: "打开和TA的聊天框",
        anchor: "有空的时候",
        environment: "把重要联系人放聊天列表置顶",
        celebrate: "看到之前的聊天记录"
      },
      standard: {
        behavior: "发1条消息/表情给TA",
        anchor: "每周固定时间",
        environment: "设置定期联系提醒",
        celebrate: "收到TA的回复"
      }
    },
    ability: {
      easy: {
        behavior: "在心里默念TA的名字",
        anchor: "任何时候",
        environment: "不需要准备",
        celebrate: "感受对TA的思念"
      },
      medium: {
        behavior: "存下TA的电话/地址",
        anchor: "想到的时候",
        environment: "更新联系人信息",
        celebrate: '完成一件"为TA做的事"'
      },
      standard: {
        behavior: "打1个简短的电话",
        anchor: "设定固定时间",
        environment: "准备一个通话话题清单",
        celebrate: "听到TA的声音"
      }
    },
    prompt: {
      easy: {
        behavior: "看到手机时想起联系TA",
        anchor: "拿起手机时",
        environment: "把TA的照片设为锁屏",
        celebrate: "感受关心和被关心的温暖"
      },
      medium: {
        behavior: "给TA的朋友圈点个赞",
        anchor: "刷朋友圈时",
        environment: "设置特别关注",
        celebrate: "一个小小的互动也是联系"
      },
      standard: {
        behavior: "完成当天的联系任务",
        anchor: "每天/每周固定时间",
        environment: "在日历上标记联系日",
        celebrate: "和对方约定下次联系的时间"
      }
    }
  },

  // ===== 19. 学习新技能 =====
  "学习新技能": {
    keywords: ["技能", "学习", "新", "提升", "成长", "skill", "learn"],
    motivation: {
      easy: {
        behavior: '想一下"我想学XX"',
        anchor: "感到无聊的时候",
        environment: "在墙上贴技能学习愿景板",
        celebrate: "想象掌握技能后的自己"
      },
      medium: {
        behavior: "看1个相关视频/文章",
        anchor: "有空的时候",
        environment: "收藏几个优质学习资源",
        celebrate: "发现一个新知识点"
      },
      standard: {
        behavior: "练习15分钟",
        anchor: "每天固定时间",
        environment: "准备学习资料和工具",
        celebrate: "记录今天的学习进度"
      }
    },
    ability: {
      easy: {
        behavior: "搜索一下这个技能是什么",
        anchor: "任何时候",
        environment: "不需要准备",
        celebrate: "了解一个新领域"
      },
      medium: {
        behavior: "跟着教程做1步",
        anchor: "有10分钟时",
        environment: "准备一个入门教程",
        celebrate: "完成教程的第一个例子"
      },
      standard: {
        behavior: "完成1个小项目/练习",
        anchor: "每周固定时间",
        environment: "准备一个练习计划",
        celebrate: "展示自己的成果"
      }
    },
    prompt: {
      easy: {
        behavior: "看到相关事物时想起学习",
        anchor: "遇到相关场景时",
        environment: "在常去的地方放相关物品",
        celebrate: "为自己的好奇心点赞"
      },
      medium: {
        behavior: "打开学习资源",
        anchor: "设定固定时间",
        environment: "设置学习提醒",
        celebrate: '完成今天的"打开"任务'
      },
      standard: {
        behavior: "完成当天的学习计划",
        anchor: "每天固定时间",
        environment: "在学习区贴进度表",
        celebrate: "在进度表上打勾"
      }
    }
  },

  // ===== 20. 减少手机使用 =====
  "减少手机使用": {
    keywords: ["手机", "少", "减少", "戒", "屏幕", "时间", "phone", "screen"],
    motivation: {
      easy: {
        behavior: "注意一下自己正在看手机",
        anchor: "无意识地拿起手机时",
        environment: "把手机屏幕朝下放",
        celebrate: '觉察到"我在看手机"的瞬间'
      },
      medium: {
        behavior: "把手机放下1秒钟",
        anchor: "注意到自己在刷手机时",
        environment: "设置屏幕使用时间提醒",
        celebrate: "感受放下手机的轻松"
      },
      standard: {
        behavior: '设定1个"无手机时段"',
        anchor: "每天固定时间",
        environment: "准备一个实体闹钟代替手机",
        celebrate: "享受没有手机的宁静"
      }
    },
    ability: {
      easy: {
        behavior: "把手机放到需要起身才能拿到的地方",
        anchor: "坐下时",
        environment: "准备一个手机收纳盒",
        celebrate: "增加拿手机的难度"
      },
      medium: {
        behavior: "删除1个不常用的App",
        anchor: "整理手机时",
        environment: "把手机首屏只留下必要App",
        celebrate: '感受手机的"轻量"'
      },
      standard: {
        behavior: "开启手机专注模式1小时",
        anchor: "需要专注的时候",
        environment: "设置自动专注模式",
        celebrate: "完成专注时段后的成就感"
      }
    },
    prompt: {
      easy: {
        behavior: "看到手机屏幕亮起时觉察",
        anchor: "通知弹出时",
        environment: "关闭大部分App的通知",
        celebrate: "少被打扰的平静"
      },
      medium: {
        behavior: "把手机放另一个房间",
        anchor: "吃饭/睡前",
        environment: "准备充电站在卧室外",
        celebrate: "享受不被手机占据的时光"
      },
      standard: {
        behavior: '完成当天的"数字排毒"',
        anchor: "每天固定时段",
        environment: "设定屏幕使用时间目标",
        celebrate: "查看今天节省了多少时间"
      }
    }
  }
};

// ===== 智能匹配算法 =====
const PlanMatcher = {
  // 根据用户输入匹配目标类别
  matchCategory(input) {
    const inputLower = input.toLowerCase();
    for (const [category, data] of Object.entries(PLAN_LIBRARY)) {
      if (data.keywords.some(k => inputLower.includes(k.toLowerCase()))) {
        return category;
      }
    }
    return null;
  },

  // 根据诊断结果获取方案
  getPlan(category, barrier, difficulty = 'medium') {
    if (!category || !PLAN_LIBRARY[category]) return null;
    const cat = PLAN_LIBRARY[category];
    const b = barrier === 'motivation' ? 'motivation' :
                barrier === 'ability' ? 'ability' : 'prompt';
    if (!cat[b] || !cat[b][difficulty]) return null;
    return cat[b][difficulty];
  },

  // 生成完整的行为设计建议
  generateRecommendation(goal, diagnosis) {
    const category = this.matchCategory(goal);
    if (!category) {
      // 兜底：通用建议
      return {
        category: '通用',
        behavior: '做1分钟这个目标的"最小版本"',
        anchor: '每天固定时间',
        environment: '把相关物品放在显眼位置',
        celebrate: '完成后的自我肯定',
        insight: '任何目标都可以从"小到不可能失败"开始。'
      };
    }

    const plan = this.getPlan(category, diagnosis.barrier, 'medium');
    const insight = diagnosis.insight || '找到障碍是关键，针对性设计微习惯。';

    return {
      category,
      ...plan,
      insight
    };
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLAN_LIBRARY, PlanMatcher };
}
