// ============================================
// 掌勺 AI - 菜品数据
// 说明：本数据是五大技能协同输出的结果
// 技能：量化 + 分步 + 检查 + 补救 + 可视化
// 可视化技能：根据其他技能输出生成状态参照图
// ============================================

window.DEMO_DISHES = {
  // ========== 主菜：蒜蓉粉丝蒸虾 ==========
  "garlic-shrimp": {
    id: "garlic-shrimp",
    name: "蒜蓉粉丝蒸虾",
    emoji: "🦐",
    difficulty: 2,
    time: 30,
    tags: ["海鲜", "宴客", "高颜值"],
    description: "鲜嫩多汁的虾配上香浓的蒜蓉，粉丝吸收汤汁超入味，宴客必备硬菜",
    
    // 封面成品图（最终展示用）
    // 注：图片由可视化技能离线生成，Demo 只负责读取 assets/images/generated/ 中的结果图
    coverVisual: {
      src: "assets/images/generated/garlic-shrimp-cover.jpg",
      purpose: "展示这道菜做成功后是什么样，增强视觉冲击力，吸引用户尝试",
      prompt: "一盘精美的蒜蓉粉丝蒸虾，红色的虾整齐排列在白色圆盘里，上面铺着金黄色的蒜蓉和翠绿的葱花，粉丝在下面晶莹剔透，热气腾腾，美食摄影，高画质，暖色调",
      description: "成品：虾身通红弯曲成U形、蒜蓉金黄、粉丝透明、撒上葱花点缀",
      colors: ["虾红色", "蒜蓉金黄", "粉丝透明", "葱花绿色"]
    },
    
    safety: {
      allergen: ["虾类过敏者禁食"],
      warnings: [
        "确保虾新鲜：虾壳有光泽、虾肉紧实、无腥臭味",
        "一定要蒸熟后再食用",
        "蒸好的菜请在2小时内食用完毕"
      ]
    },
    ingredients: [
      { name: "鲜虾", amount: "10只", detail: "约300g，选择鲜活虾" },
      { name: "粉丝", amount: "1把", detail: "约50g，绿豆粉丝最佳" },
      { name: "大蒜", amount: "5瓣", detail: "约25g，选饱满的蒜瓣" },
      { name: "小葱", amount: "2根", detail: "约10g，用葱绿部分" },
      { name: "生抽", amount: "2勺", detail: "约30ml，普通汤匙两平勺" },
      { name: "蚝油", amount: "1勺", detail: "约15ml，普通汤匙一平勺" },
      { name: "食用油", amount: "2勺", detail: "约30ml" },
      { name: "盐", amount: "少许", detail: "约1g，根据口味调整" }
    ],
    
    steps: [
      {
        id: 1,
        title: "准备食材",
        icon: "📋",
        
        // 【量化技能】输出：食材清单
        ingredients: [
          "鲜虾 10只（约300g）",
          "粉丝 1把（约50g）",
          "大蒜 5瓣（约25g）",
          "小葱 2根（约10g）"
        ],
        
        // 【分步技能】输出：动作
        actions: [
          "鲜虾10只洗净备用",
          "粉丝1把用温水泡软（约10分钟）",
          "大蒜5瓣、小葱2根洗净"
        ],
        time: "10分钟",
        
        // 【检查技能】输出：检查点
        checkpoints: [
          "所有食材都已准备齐全",
          "粉丝已用温水泡软",
          "大蒜和小葱已洗净"
        ],
        
        // 【补救技能】输出：常见错误
        mistakes: [
          { problem: "粉丝用热水泡了", solution: "没关系，泡软就行，只是口感会稍软一些" },
          { problem: "没有粉丝", solution: "可以用金针菇或细面条代替" }
        ],
        
        // 【可视化技能】输出：材料准备图
        // 服务于：量化技能 - 帮助看清需要准备什么食材
        visual: {
          type: "ingredient_prep",  // 类型：材料准备图
          src: "assets/images/generated/garlic-shrimp-01-ingredients-ready.png",
          purpose: "帮助看清这道菜需要哪些食材，以及它们应该是什么样子",
          prompt: "木质厨房台面上整齐摆放着新鲜食材：10只青色的鲜虾、一把透明的粉丝、五瓣大蒜、两根小葱、一小碟生抽和蚝油，旁边有一个陶瓷碗，自然光，干净整洁，美食摄影风格",
          description: "台面上整齐摆放：青色鲜虾、泡软的粉丝、大蒜、小葱、生抽蚝油",
          forCheckpoints: ["所有食材都已准备齐全"],
          colors: ["虾青色", "粉丝透明", "蒜白色", "葱绿色"]
        },
        
        safety_tip: "选购鲜虾：虾壳有光泽、虾身挺括、无腥臭味"
      },
      
      {
        id: 2,
        title: "处理虾",
        icon: "🔪",
        
        // 【分步技能】输出：动作
        actions: [
          "用剪刀剪去虾须和虾脚",
          "用牙签从虾背第二节挑出虾线",
          "再次冲洗干净，沥干水分"
        ],
        time: "5分钟",
        
        // 【检查技能】输出：检查点
        checkpoints: [
          "虾须虾脚已剪干净",
          "虾线已完整挑出",
          "虾身冲洗干净，无残留杂质"
        ],
        
        // 【补救技能】输出：常见错误
        mistakes: [
          { problem: "虾线挑断了", solution: "用刀尖轻轻挑出残留部分，或从虾头再挑一次" },
          { problem: "虾壳剥破了", solution: "没关系，不影响口感，只是外观稍差" }
        ],
        
        // 【可视化技能】输出：关键步骤示意图
        // 服务于：分步技能 - 帮助看清关键动作怎么操作
        visual: {
          type: "step_illustration",  // 类型：关键步骤示意图
          src: "assets/images/generated/garlic-shrimp-step2-action.jpg",
          purpose: "帮助看清处理虾的关键动作：用牙签从虾背第二节挑出虾线",
          prompt: "特写镜头：一只手用牙签从虾背第二节挑出黑色虾线，旁边放着剪好虾须的青色鲜虾，白色砧板，干净卫生的厨房场景，美食制作过程摄影",
          description: "特写：用牙签从虾背第二节挑虾线的动作",
          forCheckpoints: ["虾线已完整挑出"],
          colors: ["虾青灰色", "虾线黑色"]
        },
        
        // 【可视化技能】输出：检查点参考图
        // 服务于：检查技能 - 帮助判断虾处理完成是什么样子
        checkVisual: {
          src: "assets/images/generated/garlic-shrimp-01-ingredients-ready.png",
          purpose: "帮助判断虾处理完成应该是什么样子：虾身干净、无虾线",
          prompt: "处理好的青色鲜虾，虾身干净完整，虾线已去除，虾须虾脚已剪掉，放在白色盘子里，旁边有牙签，美食摄影",
          description: "处理完成的虾：干净、无虾线、虾身完整",
          forCheckpoints: ["虾须虾脚已剪干净", "虾线已完整挑出"],
          colors: ["虾青灰色"]
        },
        
        safety_tip: "处理完生虾后，请洗净双手再接触其他食材"
      },
      
      {
        id: 3,
        title: "炒蒜蓉",
        icon: "🔥",
        
        // 【分步技能】输出：动作
        actions: [
          "大蒜切成蒜末（尽量切细）",
          "锅中倒油，油温五成热",
          "放入蒜末，小火翻炒约1分钟"
        ],
        
        // 【量化技能】输出：火候
        fire: "小火（燃气灶外圈火 / 电磁炉档位3）",
        time: "约1分钟",
        fire_detail: "油温五成热判断：筷子插进去，周围冒小泡",
        
        // 【检查技能】输出：检查点
        checkpoints: [
          "蒜末变成均匀金黄色",
          "能闻到浓郁的蒜香味",
          "没有焦黑色出现"
        ],
        
        // 【补救技能】输出：常见错误
        mistakes: [
          { problem: "蒜蓉炒黑了", solution: "把黑的蒜蓉挑出来，重新炒一点新的撒在上面，或加点糖中和苦味" },
          { problem: "蒜末不香", solution: "小火再烘30秒，或加一点点姜末提香" }
        ],
        
        // 【可视化技能】输出：检查点参考图
        // 服务于：检查技能 - 帮助判断蒜蓉炒到什么程度算金黄
        visual: {
          type: "checkpoint_reference",  // 类型：检查点参考图
          src: "assets/images/generated/garlic-shrimp-final.png",
          purpose: "帮助判断蒜末是否变成均匀金黄色：这是正确的颜色",
          prompt: "炒锅中金黄色的蒜末在油中翻滚，细密的油泡，蒜香四溢的感觉，燃气灶小火，旁边放着一碗切好的蒜末，暖色调，美食烹饪过程摄影，高画质",
          description: "正确状态：蒜末均匀金黄色、油亮、细密油泡",
          forCheckpoints: ["蒜末变成均匀金黄色", "能闻到浓郁的蒜香味"],
          colors: ["金黄色", "油亮"]
        },
        
        // 【可视化技能】输出：错误对比图
        // 服务于：补救技能 - 帮助判断蒜蓉是否炒过头了
        mistakeVisual: {
          src: "assets/images/generated/garlic-shrimp-step3-burnt.jpg",
          purpose: "帮助判断蒜蓉是否炒过头了：这是炒黑/炒焦的错误状态",
          prompt: "炒锅中有些焦黑色的蒜蓉，对比旁边金黄色的正常蒜蓉，展示炒过头的失败状态，美食教学对比图",
          description: "错误状态：蒜末有焦黑色、颜色不均匀",
          forMistakes: ["蒜蓉炒黑了"],
          colors: ["焦黑色", "金黄色"]
        },
        
        tip: "蒜末分两次放，一半炒金黄，一半最后放生的，风味更丰富"
      },
      
      {
        id: 4,
        title: "调味摆盘",
        icon: "🍽️",
        
        // 【量化技能】输出：用量
        ingredients: [
          "生抽 2勺（30ml）",
          "蚝油 1勺（15ml）"
        ],
        
        // 【分步技能】输出：动作
        actions: [
          "蒜蓉中加入生抽2勺、蚝油1勺，拌匀",
          "盘底铺上泡好的粉丝",
          "虾整齐摆在粉丝上（虾背朝上）",
          "将蒜蓉酱均匀铺在虾上"
        ],
        time: "3分钟",
        
        // 【检查技能】输出：检查点
        checkpoints: [
          "蒜蓉酱已调味拌匀",
          "粉丝均匀铺在盘底",
          "虾背朝上整齐摆放",
          "蒜蓉酱均匀覆盖在每只虾上"
        ],
        
        // 【补救技能】输出：常见错误
        mistakes: [
          { problem: "蒜蓉酱太咸", solution: "可以多铺一层粉丝，或再加一勺清水稀释" },
          { problem: "虾摆得不整齐", solution: "没关系，只要虾背朝上就行，蒸出来都好看" }
        ],
        
        // 【可视化技能】输出：关键步骤示意图
        // 服务于：分步技能 - 帮助看清摆盘的正确方式
        visual: {
          type: "step_illustration",  // 类型：关键步骤示意图
          src: "assets/images/generated/garlic-shrimp-cover.jpg",
          purpose: "帮助看清摆盘方式：虾背朝上、整齐排列、蒜蓉覆盖",
          prompt: "白色圆盘里铺着半透明的粉丝，上面整齐排列着青色的鲜虾，虾背朝上，上面铺着金黄色的蒜蓉酱，准备放入蒸锅，精致摆盘，美食摄影，俯视角度",
          description: "正确摆盘：粉丝在底、虾背朝上、蒜蓉覆盖",
          forCheckpoints: ["粉丝均匀铺在盘底", "虾背朝上整齐摆放", "蒜蓉酱均匀覆盖在每只虾上"],
          colors: ["粉丝透明", "虾青灰", "蒜蓉金黄"]
        },
        
        safety_tip: null
      },
      
      {
        id: 5,
        title: "上锅蒸",
        icon: "⏰",
        
        // 【量化技能】输出：火候
        fire: "大火（燃气灶最大火 / 电磁炉档位9）",
        time: "5分钟",
        fire_detail: "水沸腾后再放虾，蒸的时候不要掀盖",
        
        // 【分步技能】输出：动作
        actions: [
          "锅中加水，大火烧开",
          "放入摆好的盘子，盖紧锅盖",
          "大火蒸5分钟"
        ],
        
        // 【检查技能】输出：检查点（这是最关键的检查点！）
        checkpoints: [
          "水已完全沸腾（大量冒泡）",
          "锅盖盖紧，不漏气",
          "蒸够5分钟",
          "虾身完全变红，弯曲成U形"
        ],
        
        // 【补救技能】输出：常见错误
        mistakes: [
          { problem: "蒸的时间太长，虾老了", solution: "肉质会紧实一些，但还是能吃，下次减少1分钟" },
          { problem: "虾还没完全变红", solution: "再蒸1-2分钟，直到虾身完全变红" }
        ],
        
        // 【可视化技能】输出：检查点参考图（核心！）
        // 服务于：检查技能 - 帮助判断虾是否蒸熟了
        // 这是最重要的可视化输出！因为"虾变红弯成U形=熟了"是这道菜的核心判断
        visual: {
          type: "checkpoint_reference",  // 类型：检查点参考图
          src: "assets/images/generated/garlic-shrimp-step5-cooked.jpg",
          purpose: "【最关键！】帮助判断虾是否蒸熟了：看这里！虾身完全变红 + 弯曲成U形",
          prompt: "蒸锅中刚蒸好的蒜蓉粉丝蒸虾，虾身完全变红，弯曲成漂亮的U形，金黄色蒜蓉，热气腾腾，白色蒸盘，美食摄影，高画质，暖光",
          description: "【熟了的标志】虾身通红 + 弯曲成U形 = 熟了！",
          forCheckpoints: ["虾身完全变红，弯曲成U形"],
          colors: ["虾红色", "蒜蓉金黄", "粉丝透明"],
          highlight: "虾身变红程度、弯曲程度"  // 高亮提示
        },
        
        // 【可视化技能】输出：错误对比图
        mistakeVisual: {
          src: "assets/images/generated/garlic-shrimp-step2-action.jpg",
          purpose: "帮助判断虾是否还没熟：这是还没完全变红的状态",
          prompt: "还没完全蒸熟的虾，身躯还是淡粉色，没有完全变红，弯曲程度不够，旁边是蒸熟变红的虾对比，美食教学图",
          description: "错误状态：虾还没完全变红，还没熟",
          forMistakes: ["虾还没完全变红"],
          colors: ["淡粉色", "红色"]
        },
        
        safety_tip: "虾身完全变红+弯曲成U形=熟透了，可以放心食用"
      },
      
      {
        id: 6,
        title: "出锅装盘",
        icon: "🎉",
        
        // 【分步技能】输出：动作
        actions: [
          "关火，小心取出盘子（注意烫手）",
          "撒上葱花点缀",
          "可以再淋一勺热油激发香气（可选）"
        ],
        time: "2分钟",
        
        // 【检查技能】输出：检查点
        checkpoints: [
          "虾身通红，弯曲成U形",
          "蒜蓉金黄，香气扑鼻",
          "粉丝吸满汤汁，晶莹剔透"
        ],
        
        // 【补救技能】输出：常见错误
        mistakes: [
          { problem: "汤汁太多", solution: "可以倒掉一点，或开大火收一下汁" },
          { problem: "没有葱花", solution: "用香菜或枸杞代替，也很好看" }
        ],
        
        // 【可视化技能】输出：成品图（最终展示）
        // 服务于：完成页 - 展示最终效果，增强成就感
        visual: {
          type: "final_dish",  // 类型：成品图
          src: "assets/images/generated/garlic-shrimp-final.png",
          purpose: "展示这道菜的最终效果，增强成就感和食欲",
          prompt: "一盘精美的蒜蓉粉丝蒸虾成品图，红色的大虾整齐排列在白色瓷盘里，铺着金黄的蒜蓉，撒上翠绿的葱花，粉丝晶莹剔透，冒着热气，美食摄影，高画质，45度角，暖光，让人食欲大开",
          description: "成品：红虾金蒜绿葱，粉丝透明，热气腾腾",
          colors: ["虾红色", "蒜蓉金黄", "葱花绿色", "粉丝透明"],
          plating: "撒上葱花，红绿黄三色搭配，拍照更好看；粉丝在下面吸满汤汁，超级入味"
        },
        
        final_tip: "趁热吃最好吃！凉了虾肉会变硬，粉丝也会结块"
      }
    ]
  },

  // ========== 辅菜：番茄炒蛋 ==========
  "tomato-egg": {
    id: "tomato-egg",
    name: "番茄炒蛋",
    emoji: "🍳",
    difficulty: 1,
    time: 10,
    tags: ["家常", "新手必学", "快手菜"],
    description: "国民家常菜，酸甜可口，简单易做，新手也能一次成功",
    
    // 封面成品图
    coverVisual: {
      src: "assets/images/generated/tomato-egg-final.jpg",
      purpose: "展示这道菜做成功后是什么样，增强视觉冲击力",
      prompt: "一盘色香味俱全的番茄炒蛋，金黄色的鸡蛋块和红色的番茄块混合在一起，撒上翠绿的葱花，冒着热气，白色圆盘，美食摄影，高画质，家常温馨风格",
      description: "成品：金黄鸡蛋+红番茄+绿葱花，汤汁浓郁",
      colors: ["鸡蛋金黄", "番茄红色", "葱花绿色"]
    },
    
    safety: {
      allergen: ["鸡蛋过敏者禁食"],
      warnings: [
        "鸡蛋要充分加热后食用",
        "番茄要彻底洗净表皮"
      ]
    },
    ingredients: [
      { name: "番茄", amount: "2个", detail: "约200g，选熟透的番茄" },
      { name: "鸡蛋", amount: "3个", detail: "约150g，常温鸡蛋更好打" },
      { name: "葱花", amount: "少许", detail: "约5g" },
      { name: "盐", amount: "1/2茶匙", detail: "约3g" },
      { name: "白糖", amount: "1茶匙", detail: "约5g，提鲜用" },
      { name: "食用油", amount: "3勺", detail: "约45ml" }
    ],
    
    steps: [
      {
        id: 1,
        title: "准备食材",
        icon: "📋",
        
        ingredients: [
          "番茄 2个（约200g）",
          "鸡蛋 3个（约150g）",
          "葱花 少许"
        ],
        actions: [
          "番茄2个洗净，顶部划十字",
          "鸡蛋3个打入碗中",
          "切少许葱花备用"
        ],
        time: "3分钟",
        checkpoints: [
          "番茄已洗净",
          "鸡蛋已打入碗中，无蛋壳",
          "葱花已切好"
        ],
        mistakes: [
          { problem: "蛋壳掉进碗里", solution: "用半个蛋壳轻轻捞出来，或用筷子夹出来" },
          { problem: "番茄不红", solution: "没关系，只是酸味稍淡，可以多加一点番茄酱" }
        ],
        
        // 【可视化技能】输出：材料准备图
        visual: {
          type: "ingredient_prep",
          src: "assets/images/generated/tomato-egg-01-ingredients-ready.png",
          purpose: "帮助看清这道菜需要哪些食材",
          prompt: "木质厨房台面上摆放着新鲜食材：两个红色的番茄、三个棕色的鸡蛋、一小碗葱花、一小碟盐和糖，旁边有一个玻璃碗，干净整洁，自然光，美食摄影风格，家常温馨",
          description: "台面食材：红番茄、棕鸡蛋、葱花、盐糖",
          forCheckpoints: ["番茄已洗净", "鸡蛋已打入碗中"],
          colors: ["番茄红色", "鸡蛋棕色", "葱花绿色"]
        },
        
        safety_tip: "番茄表皮可能有农药残留，请用流动水彻底清洗"
      },
      
      {
        id: 2,
        title: "处理食材",
        icon: "🔪",
        
        actions: [
          "鸡蛋加少许盐，打散成蛋液",
          "番茄切成小块（去皮口感更好）",
          "葱切葱花，葱白葱绿分开"
        ],
        time: "3分钟",
        checkpoints: [
          "蛋液已打散，蛋清蛋黄混合均匀",
          "番茄已切成小块，大小均匀",
          "葱白葱绿已分开"
        ],
        mistakes: [
          { problem: "鸡蛋打不匀", solution: "多打一会儿，或用筷子快速搅拌30秒" },
          { problem: "番茄汁流太多", solution: "连汁一起倒进锅，汤汁更浓郁" }
        ],
        
        // 【可视化技能】输出：关键步骤示意图
        visual: {
          type: "step_illustration",
          src: "assets/images/generated/tomato-egg-step1-ingredients.jpg",
          purpose: "帮助看清处理好的食材是什么样子",
          prompt: "白色砧板上切好的番茄块和一碗打散的金黄色蛋液，旁边放着切好的葱花，干净的厨房场景，俯视角度，美食制作过程摄影",
          description: "处理好的食材：金黄蛋液、红番茄块、绿葱花",
          forCheckpoints: ["蛋液已打散", "番茄已切成小块"],
          colors: ["蛋液金黄", "番茄红色", "葱花绿色"]
        },
        
        tip: "番茄去皮小技巧：用开水烫30秒，皮就很容易剥掉了"
      },
      
      {
        id: 3,
        title: "炒鸡蛋",
        icon: "🔥",
        
        actions: [
          "锅烧热，倒油（比平时多一点）",
          "油温六成热时倒入蛋液",
          "蛋液凝固后快速划散，盛出备用"
        ],
        fire: "中火（燃气灶中火 / 电磁炉档位5-6）",
        time: "约2分钟",
        fire_detail: "油温六成热：筷子插进去冒密泡，或手放在锅上方能感觉到明显热气",
        checkpoints: [
          "鸡蛋表面金黄，内部熟透",
          "鸡蛋块大小均匀",
          "没有炒糊的地方"
        ],
        mistakes: [
          { problem: "鸡蛋炒老了", solution: "没关系，只是口感稍硬，和番茄一起炖一会儿就软了" },
          { problem: "鸡蛋太碎了", solution: "下次等蛋液凝固更多再翻动，这次就这样，一样好吃" }
        ],
        
        // 【可视化技能】输出：检查点参考图
        visual: {
          type: "checkpoint_reference",
          src: "assets/images/generated/tomato-egg-02-eggs-done-check.png",
          purpose: "帮助判断鸡蛋炒好了是什么样子：金黄色、蓬松、块型饱满",
          prompt: "炒锅中金黄色蓬松的炒鸡蛋，嫩黄色，块型饱满，冒着热气，燃气灶中火，旁边放着一碗蛋液，美食烹饪过程摄影，暖色调，高画质",
          description: "正确的鸡蛋：金黄色、蓬松、块型饱满",
          forCheckpoints: ["鸡蛋表面金黄", "鸡蛋块大小均匀"],
          colors: ["金黄色", "蓬松"]
        },
        
        tip: "想让鸡蛋更嫩？蛋液里加一勺清水，炒的时候火不要太大"
      },
      
      {
        id: 4,
        title: "炒番茄",
        icon: "🍅",
        
        actions: [
          "锅中留底油，下葱白爆香",
          "倒入番茄块，中小火翻炒",
          "炒出番茄汁，加入糖和盐调味"
        ],
        fire: "中小火（燃气灶中小火 / 电磁炉档位4）",
        time: "约3分钟",
        checkpoints: [
          "番茄变软，出汁了",
          "汤汁呈红色，浓稠状",
          "味道酸甜适中"
        ],
        mistakes: [
          { problem: "番茄不出汁", solution: "加一点点水，盖上锅盖焖1分钟，番茄就出汁了" },
          { problem: "番茄太酸", solution: "再加半勺糖，或加一点点番茄酱" }
        ],
        
        // 【可视化技能】输出：检查点参考图
        visual: {
          type: "checkpoint_reference",
          src: "assets/images/generated/tomato-egg-eggs-overcooked.jpg",
          purpose: "帮助判断番茄炒好了是什么样子：软烂、出汁、汤汁浓稠",
          prompt: "炒锅中软烂出汁的红色番茄，汤汁浓郁，冒着热气，中小火，旁边放着一碗炒好的鸡蛋，美食烹饪过程摄影，暖光，高画质",
          description: "正确的番茄：软烂、出汁、汤汁红色浓稠",
          forCheckpoints: ["番茄变软，出汁了", "汤汁呈红色，浓稠状"],
          colors: ["番茄红色", "汤汁浓稠"]
        },
        
        safety_tip: "鸡蛋要充分加热，沙门氏菌在70℃以上才能被杀灭"
      },
      
      {
        id: 5,
        title: "混合出锅",
        icon: "🎉",
        
        actions: [
          "倒入炒好的鸡蛋",
          "快速翻炒均匀，让鸡蛋吸满番茄汁",
          "撒上葱花，出锅装盘"
        ],
        fire: "大火快炒（燃气灶大火 / 电磁炉档位8）",
        time: "约1分钟",
        checkpoints: [
          "鸡蛋和番茄已混合均匀",
          "鸡蛋吸满了番茄汁",
          "味道酸甜适中"
        ],
        mistakes: [
          { problem: "汤汁太多", solution: "开大火收一下汁，或加一点点水淀粉勾芡" },
          { problem: "味道太淡", solution: "再加一点点盐，或几滴生抽提鲜" }
        ],
        
        // 【可视化技能】输出：成品图
        visual: {
          type: "final_dish",
          src: "assets/images/generated/tomato-egg-final.jpg",
          purpose: "展示最终成品，增强成就感和食欲",
          prompt: "一盘家常番茄炒蛋成品，金黄色的鸡蛋块和红色的番茄块混合，撒上翠绿的葱花，汤汁浓郁，冒着热气，白色圆盘，温馨的家常风格，美食摄影，高画质，45度角",
          description: "成品：金黄鸡蛋+红番茄+绿葱花，汤汁浓郁",
          colors: ["鸡蛋金黄", "番茄红色", "葱花绿色"],
          plating: "盛在白盘子里，红绿黄三色搭配，简单又好看"
        },
        
        final_tip: "趁热吃最好！配米饭超级下饭，汤汁都能拌饭吃"
      }
    ]
  }
};