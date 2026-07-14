// ===== 全局变量 =====
let currentImageData = null;
let mediaStream = null;
let facingMode = 'environment';
let currentReport = null;
let imageFeatures = null; // 图片分析结果

// ============================================================
// ===== 图片视觉特征分析 =====
// ============================================================

function analyzeImage(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 缩小到合适尺寸以提高分析速度
      const maxSize = 200;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxSize) { h = h * maxSize / w; w = maxSize; }
      } else {
        if (h > maxSize) { w = w * maxSize / h; h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      
      // 初始化统计变量
      let totalR = 0, totalG = 0, totalB = 0;
      let totalBrightness = 0;
      let brightPixels = 0;
      let darkPixels = 0;
      
      // 区域分析：上、下、左、右、中
      const regions = {
        top: { r:0, g:0, b:0, count:0, brightness:0 },
        bottom: { r:0, g:0, b:0, count:0, brightness:0 },
        left: { r:0, g:0, b:0, count:0, brightness:0 },
        right: { r:0, g:0, b:0, count:0, brightness:0 },
        center: { r:0, g:0, b:0, count:0, brightness:0 }
      };
      
      // 颜色分量统计
      let redPixels = 0, greenPixels = 0, bluePixels = 0;
      let yellowPixels = 0, whitePixels = 0, blackPixels = 0;
      
      const totalPixels = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        totalR += r;
        totalG += g;
        totalB += b;
        totalBrightness += brightness;
        
        if (brightness > 200) brightPixels++;
        if (brightness < 60) darkPixels++;
        
        // 颜色分类
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const diff = maxVal - minVal;
        
        if (brightness > 200 && diff < 30) {
          whitePixels++;
        } else if (brightness < 40 && diff < 30) {
          blackPixels++;
        } else if (r > g && r > b && r - g > 20 && r - b > 20) {
          redPixels++;
        } else if (g > r && g > b && g - r > 15 && g - b > 15) {
          greenPixels++;
        } else if (b > r && b > g && b - r > 20 && b - g > 20) {
          bluePixels++;
        } else if (r > 200 && g > 180 && b < 120) {
          yellowPixels++;
        }
        
        // 区域分析
        const pixelIdx = i / 4;
        const x = pixelIdx % w;
        const y = Math.floor(pixelIdx / w);
        const centerX = w / 2;
        const centerY = h / 2;
        const isCenter = Math.abs(x - centerX) < w * 0.2 && Math.abs(y - centerY) < h * 0.2;
        
        if (y < h * 0.3) {
          addToRegion(regions.top, r, g, b, brightness);
        } else if (y > h * 0.7) {
          addToRegion(regions.bottom, r, g, b, brightness);
        }
        
        if (x < w * 0.25) {
          addToRegion(regions.left, r, g, b, brightness);
        } else if (x > w * 0.75) {
          addToRegion(regions.right, r, g, b, brightness);
        }
        
        if (isCenter) {
          addToRegion(regions.center, r, g, b, brightness);
        }
      }
      
      function addToRegion(region, r, g, b, brightness) {
        region.r += r;
        region.g += g;
        region.b += b;
        region.brightness += brightness;
        region.count++;
      }
      
      // 计算平均值
      const avgR = Math.round(totalR / totalPixels);
      const avgG = Math.round(totalG / totalPixels);
      const avgB = Math.round(totalB / totalPixels);
      const avgBrightness = totalBrightness / totalPixels;
      const brightRatio = brightPixels / totalPixels;
      const darkRatio = darkPixels / totalPixels;
      
      // 计算各区域平均亮度
      Object.keys(regions).forEach(key => {
        const reg = regions[key];
        if (reg.count > 0) {
          reg.avgBrightness = reg.brightness / reg.count;
          reg.avgR = Math.round(reg.r / reg.count);
          reg.avgG = Math.round(reg.g / reg.count);
          reg.avgB = Math.round(reg.b / reg.count);
        } else {
          reg.avgBrightness = 0;
        }
      });
      
      // 判断主色调
      const colorRatios = {
        red: redPixels / totalPixels,
        green: greenPixels / totalPixels,
        blue: bluePixels / totalPixels,
        yellow: yellowPixels / totalPixels,
        white: whitePixels / totalPixels,
        black: blackPixels / totalPixels
      };
      
      // 找出最突出的颜色
      let dominantColor = 'neutral';
      let maxRatio = 0;
      const colorMap = { red: '火', green: '木', blue: '水', yellow: '土', white: '金', black: '水' };
      Object.keys(colorRatios).forEach(color => {
        if (colorRatios[color] > maxRatio && colorRatios[color] > 0.08) {
          maxRatio = colorRatios[color];
          dominantColor = colorMap[color];
        }
      });
      
      // 判断五行强弱
      const wuxingStrength = {
        金: colorRatios.white * 100 + (avgR > 200 && avgG > 200 ? 10 : 0),
        木: colorRatios.green * 100 + (avgG > avgR && avgG > avgB ? 5 : 0),
        水: colorRatios.black * 100 + colorRatios.blue * 50 + (avgB > avgR && avgB > avgG ? 5 : 0),
        火: colorRatios.red * 100 + colorRatios.yellow * 30 + (avgR > 150 && avgR > avgG + 20 ? 5 : 0),
        土: colorRatios.yellow * 80 + ((avgR > 180 && avgG > 150 && avgB < 130) ? 8 : 0)
      };
      
      // 找出最旺和最弱的五行
      let strongElement = '土';
      let weakElement = '金';
      let maxStrength = 0;
      let minStrength = 999;
      Object.keys(wuxingStrength).forEach(el => {
        if (wuxingStrength[el] > maxStrength) {
          maxStrength = wuxingStrength[el];
          strongElement = el;
        }
        if (wuxingStrength[el] < minStrength) {
          minStrength = wuxingStrength[el];
          weakElement = el;
        }
      });
      
      // 龙虎分析（左青龙右白虎）
      const leftBright = regions.left.avgBrightness;
      const rightBright = regions.right.avgBrightness;
      let longHuBalance = 'balanced';
      if (leftBright - rightBright > 20) longHuBalance = 'longStrong';
      else if (rightBright - leftBright > 20) longHuBalance = 'huStrong';
      
      // 明堂分析（前方/上方是否开阔）
      const topBright = regions.top.avgBrightness;
      const bottomBright = regions.bottom.avgBrightness;
      let mingtang = 'normal';
      if (topBright - bottomBright > 25) mingtang = 'open';
      else if (bottomBright - topBright > 25) mingtang = 'blocked';
      
      // 中心区域分析
      const centerBright = regions.center.avgBrightness;
      let centerStatus = 'normal';
      if (centerBright < avgBrightness - 20) centerStatus = 'dark';
      else if (centerBright > avgBrightness + 20) centerStatus = 'bright';
      
      // 整体采光评级
      let lightingLevel;
      if (avgBrightness > 180) lightingLevel = 'excellent';
      else if (avgBrightness > 140) lightingLevel = 'good';
      else if (avgBrightness > 100) lightingLevel = 'medium';
      else if (avgBrightness > 70) lightingLevel = 'low';
      else lightingLevel = 'dark';
      
      // 对比度
      const contrast = brightRatio + darkRatio;
      
      // 色彩丰富度
      const colorVariety = (colorRatios.red + colorRatios.green + colorRatios.blue + colorRatios.yellow) * 100;
      
      const features = {
        width: img.width,
        height: img.height,
        avgR, avgG, avgB,
        avgBrightness,
        brightRatio,
        darkRatio,
        lightingLevel,
        dominantColor,
        colorRatios,
        wuxingStrength,
        strongElement,
        weakElement,
        regions,
        longHuBalance,
        mingtang,
        centerStatus,
        contrast,
        colorVariety
      };
      
      resolve(features);
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

// ============================================================
// ===== 风水专业知识库 =====
// ============================================================

const FengShuiKnowledge = {
  // 煞气类型库（带触发条件）
  shaTypes: [
    {
      name: '穿堂煞',
      level: 'high',
      desc: '大门与窗户或后门成一直线，形成「前通后通，人财两空」之局，气流直冲而出，财气难以聚集，主财运起伏不定，守财不易。',
      cause: '入户门正对窗户/阳台/后门，前后通透无遮挡',
      impact: '财运 · 健康',
      trigger: (f) => f.brightRatio > 0.4 && f.contrast > 0.35 && f.mingtang === 'open',
      solutions: [
        '在入户门与窗户之间设置玄关或屏风，形成回旋之气',
        '摆放高大绿植（发财树、金钱树）遮挡煞气',
        '设置水晶帘或厚重窗帘减缓气流速度',
        '在玄关处放置鞋柜或置物柜，形成缓冲空间'
      ],
      items: ['屏风', '玄关柜', '水晶帘', '发财树']
    },
    {
      name: '门冲煞',
      level: 'high',
      desc: '两扇门相对而立，气流相冲，易导致口舌是非、家庭不和，若为卧室门则影响夫妻关系，若为厕所门则晦气冲人。',
      cause: '卧室门对大门/厕所门对卧室门/厨房门对大门',
      impact: '家庭运 · 健康运',
      trigger: (f) => f.colorVariety > 15 && f.longHuBalance !== 'balanced',
      solutions: [
        '经常关闭其中一扇门，避免气流直冲',
        '在门楣上悬挂珠帘或白玉葫芦化解',
        '两门之间放置绿植或矮柜作为缓冲',
        '可在门上贴门神或福字增加气场'
      ],
      items: ['珠帘', '白玉葫芦', '绿植', '门神']
    },
    {
      name: '横梁压顶',
      level: 'high',
      desc: '座位、卧床或炉灶上方有横梁横跨，形成压迫之感，主压力大、运势受阻、有志难伸，长期处于其下易引发头痛、失眠等问题。',
      cause: '沙发/床/办公桌上方有横梁或低矮吊顶',
      impact: '事业运 · 健康运',
      trigger: (f) => f.mingtang === 'blocked' && f.darkRatio > 0.15,
      solutions: [
        '将沙发或床位移离横梁正下方',
        '用吊顶或假天花将横梁隐藏起来',
        '在横梁两端悬挂五帝钱或铜葫芦化解',
        '梁下放置爬藤类植物向上生长分散煞气'
      ],
      items: ['五帝钱', '铜葫芦', '吊顶', '爬藤植物']
    },
    {
      name: '尖角煞',
      level: 'medium',
      desc: '室内有墙角、家具尖角或装饰锐角正对常坐之处，如刀劈斧砍，主意外损伤、是非口舌，长期受冲易引发血光之灾。',
      cause: '墙角/家具尖角正对沙发/床/书桌，棱角分明',
      impact: '健康运 · 家庭运',
      trigger: (f) => f.contrast > 0.4 && f.colorVariety > 20,
      solutions: [
        '调整家具位置，避开尖角直冲',
        '在尖角处摆放圆润的绿植或装饰品化解',
        '用窗帘、布幔等软性装饰遮挡尖角',
        '可在尖角方向放置圆形饰物缓冲煞气'
      ],
      items: ['圆形摆件', '多肉植物', '布幔装饰']
    },
    {
      name: '厕占中宫',
      level: 'high',
      desc: '卫生间位于房屋中心位置，污秽之气弥漫全屋，犹如心脏受污，主家人健康受损、财运衰败，是风水大忌之一。',
      cause: '房屋正中央区域偏暗偏湿，疑似卫生间位于中宫',
      impact: '健康运 · 整体运势',
      trigger: (f) => f.centerStatus === 'dark' && f.darkRatio > 0.2,
      solutions: [
        '保持厕所门常闭，安装排气扇保持干爽',
        '在厕所内放置盐水或活性炭吸附秽气',
        '门口悬挂长明灯或五帝钱阻挡晦气外泄',
        '摆放虎尾兰、芦荟等净化空气的植物'
      ],
      items: ['五帝钱', '活性炭', '虎尾兰', '长明灯']
    },
    {
      name: '厨房冲门',
      level: 'medium',
      desc: '厨房门正对大门或卧室门，火气直冲，主脾气暴躁、家庭纷争，财库外露，钱财难守，对女主人健康尤为不利。',
      cause: '厨房门正对入户门/卧室门，火气外泄',
      impact: '家庭运 · 财运',
      trigger: (f) => f.wuxingStrength['火'] > 15 && f.mingtang === 'open',
      solutions: [
        '在厨房门挂帘或经常关闭厨房门',
        '门口摆放绿植形成气场屏障',
        '厨房内放置粗盐净化火气',
        '可在厨房悬挂葫芦吸纳燥气'
      ],
      items: ['门帘', '绿植', '粗盐', '葫芦']
    },
    {
      name: '明镜高悬',
      level: 'medium',
      desc: '卧室或客厅中镜子/反光物体过多，正对床铺或大门，会反射气场、干扰睡眠，主精神恍惚、夫妻不和，半夜易受惊吓。',
      cause: '镜面/反光物体正对人常处之处，反光强烈',
      impact: '健康运 · 家庭运',
      trigger: (f) => f.brightRatio > 0.45 && f.contrast > 0.4,
      solutions: [
        '调整镜子位置，避免正对人常处之处',
        '卧室镜子用布帘遮盖，用时再掀开',
        '可改用磨砂玻璃或贴纸减少反射',
        '在镜子旁摆放绿植缓冲反射之气'
      ],
      items: ['镜帘', '磨砂贴纸', '绿植']
    },
    {
      name: '背门而坐',
      level: 'medium',
      desc: '沙发、办公桌等主要座位背对门或窗而放，背后无靠，主人心不安、缺乏安全感，事业上易遇小人暗算、难得贵人相助。',
      cause: '主要座位背对门窗方向，背后无实墙可靠',
      impact: '事业运 · 贵人运',
      trigger: (f) => f.longHuBalance === 'huStrong' && f.mingtang === 'blocked',
      solutions: [
        '调整座位方向，使其背靠实墙',
        '若无法调整，可在背后放置矮柜或靠山画',
        '座椅选择高背款，增加心理安全感',
        '在左手边（青龙位）摆放绿植提升贵人运'
      ],
      items: ['靠山图', '高背椅', '矮柜', '绿植']
    },
    {
      name: '财位受压',
      level: 'medium',
      desc: '客厅对角线的明财位堆放杂物、重物或被梁柱压制，财运受阻，赚钱辛苦，积蓄难增，有财来财去之象。',
      cause: '财位区域昏暗杂乱，有重物压制或堆放杂物',
      impact: '财运',
      trigger: (f) => f.colorVariety > 25 && f.lightingLevel === 'low',
      solutions: [
        '彻底清理财位区域，保持干净明亮',
        '在财位摆放聚宝盆、貔貅、招财猫等',
        '安装长明灯保持财位光亮',
        '可放置聚宝盆或紫水晶洞聚气招财'
      ],
      items: ['聚宝盆', '貔貅', '紫水晶洞', '长明灯']
    },
    {
      name: '床头悬空',
      level: 'low',
      desc: '床头不靠实墙或靠窗太近，谓之「床头悬空」，主睡眠不稳、精神不济、易做噩梦，长期如此影响健康与判断力。',
      cause: '床头靠窗/不靠墙，后方空虚',
      impact: '健康运 · 事业运',
      trigger: (f) => f.mingtang === 'blocked' && f.brightRatio < 0.2,
      solutions: [
        '将床位移至背靠实墙的位置',
        '若靠窗，可用厚窗帘遮挡并紧闭窗户',
        '床头板选择厚实稳重的款式',
        '床头两侧放置床头柜增加稳定感'
      ],
      items: ['厚窗帘', '床头柜', '厚实床头板']
    },
    {
      name: '水火相冲',
      level: 'medium',
      desc: '厨房内灶台与水槽相对或紧邻，水火不容，主家庭口舌是非、财运反复，亦影响女主人健康与情绪稳定。',
      cause: '灶台与水槽正对/紧邻，水气相战',
      impact: '家庭运 · 财运',
      trigger: (f) => f.wuxingStrength['水'] > 8 && f.wuxingStrength['火'] > 8,
      solutions: [
        '在灶台与水槽之间放置砧板或绿植缓冲',
        '调整厨房布局使水火分开',
        '可在中间放置木属性物品调和水火',
        '灶台背后要有实墙，避免背后空虚'
      ],
      items: ['木质砧板', '绿植', '木柜']
    },
    {
      name: '开口煞',
      level: 'low',
      desc: '入户门正对电梯口或楼梯口，气流频繁流动扰动宅气，主财运不稳、人事纷争，若为下行楼梯则财气下泄更甚。',
      cause: '大门正对电梯/楼梯，气口不稳',
      impact: '财运 · 事业运',
      trigger: (f) => f.mingtang === 'open' && f.longHuBalance === 'balanced',
      solutions: [
        '在玄关设置屏风或鞋柜阻挡煞气',
        '门口摆放一对石狮或铜麒麟镇宅',
        '门内悬挂五帝钱或铜葫芦化解',
        '保持玄关整洁明亮，增强入门气场'
      ],
      items: ['五帝钱', '铜麒麟', '屏风', '绿植']
    },
    {
      name: '阴盛阳衰',
      level: 'high',
      desc: '室内光线昏暗、采光不足，阴气过重阳气不足，主家人精神萎靡、财运低迷、易招小人，长期居住不利身心健康。',
      cause: '室内采光不足，整体偏暗，阴气较重',
      impact: '健康运 · 整体运势',
      trigger: (f) => f.lightingLevel === 'dark' || f.lightingLevel === 'low',
      solutions: [
        '增加室内照明，多使用暖光灯补充阳气',
        '打开窗帘，尽量让自然光进入室内',
        '墙面使用浅色明亮的色调',
        '可在客厅悬挂红太阳或八骏图增加阳气'
      ],
      items: ['长明灯', '暖光灯具', '浅色窗帘', '红太阳画']
    },
    {
      name: '宅气涣散',
      level: 'medium',
      desc: '空间过于空旷或门窗过多，气场难以凝聚，主财来财去、难以积蓄，家人容易心浮气躁、缺乏耐心。',
      cause: '空间过于开阔，门窗多，聚气不足',
      impact: '财运 · 家庭运',
      trigger: (f) => f.brightRatio > 0.5 && f.colorVariety < 10,
      solutions: [
        '增加家具陈设，让空间更有层次感',
        '使用屏风、博古架等划分空间',
        '摆放高大绿植帮助聚气',
        '可在角落放置重物或摆件稳定气场'
      ],
      items: ['屏风', '博古架', '绿植', '重物摆件']
    }
  ],

  // 吉位分析库
  luckyPositions: [
    {
      name: '财位（明财位）',
      direction: '客厅对角线',
      element: '金',
      meaning: '掌管一家人的财运与积蓄，财位宜亮、宜静、宜生，忌暗、忌动、忌压。',
      enhance: '摆放聚宝盆、貔貅、招财树、紫水晶洞，保持干净明亮',
      icon: '💰',
      goodTrigger: (f) => f.lightingLevel === 'good' || f.lightingLevel === 'excellent',
      badTrigger: (f) => f.lightingLevel === 'dark' || f.lightingLevel === 'low'
    },
    {
      name: '文昌位',
      direction: '东南方（巽位）',
      element: '木',
      meaning: '主学业、事业、名声与智慧，旺文昌则思维敏捷、考试顺利、事业升迁有望。',
      enhance: '摆放文昌塔、文竹、毛笔架，适合设置书房或书桌',
      icon: '📚',
      goodTrigger: (f) => f.wuxingStrength['木'] > 8,
      badTrigger: (f) => f.wuxingStrength['木'] < 3
    },
    {
      name: '桃花位',
      direction: '正西方（兑位）',
      element: '金',
      meaning: '主人际关系、姻缘感情与社交魅力，旺桃花则人缘佳、感情顺遂。',
      enhance: '摆放鲜花、粉晶、鸳鸯饰物，保持整洁明亮',
      icon: '🌸',
      goodTrigger: (f) => f.colorRatios.red > 0.05 || f.colorVariety > 15,
      badTrigger: (f) => f.lightingLevel === 'dark'
    },
    {
      name: '天医位',
      direction: '东北方（艮位）',
      element: '土',
      meaning: '主健康与贵人运，天医位得位则身体健康、少灾少病、常遇贵人相助。',
      enhance: '摆放葫芦、长寿摆件、健康绿植，适合作为卧室',
      icon: '🏥',
      goodTrigger: (f) => f.avgBrightness > 120 && f.darkRatio < 0.2,
      badTrigger: (f) => f.darkRatio > 0.25
    },
    {
      name: '延年位',
      direction: '正南方（离位）',
      element: '火',
      meaning: '主福寿与事业稳定，延年位旺则事业有成、人脉广阔、健康长寿。',
      enhance: '摆放寿桃、松鹤摆件、红色饰物，宜做客厅或主卧',
      icon: '🐦',
      goodTrigger: (f) => f.wuxingStrength['火'] > 10,
      badTrigger: (f) => f.wuxingStrength['火'] < 3
    },
    {
      name: '生气位',
      direction: '正东方（震位）',
      element: '木',
      meaning: '为第一大吉位，主生发之气、事业发展与贵人运，旺之则蒸蒸日上。',
      enhance: '摆放绿植、发财树、龙摆件，适合作为办公或经营场所',
      icon: '🌱',
      goodTrigger: (f) => f.mingtang === 'open' && f.lightingLevel !== 'dark',
      badTrigger: (f) => f.mingtang === 'blocked'
    },
    {
      name: '伏位',
      direction: '西北方（乾位）',
      element: '金',
      meaning: '主安稳与蓄势，伏位得位则家宅平安、稳中有进，适合休养生息。',
      enhance: '保持安静整洁，可放储物或作为书房',
      icon: '⛰️',
      goodTrigger: (f) => f.longHuBalance === 'longStrong' || f.longHuBalance === 'balanced',
      badTrigger: (f) => f.longHuBalance === 'huStrong'
    }
  ],

  // 五行分析
  wuxingAnalysis: {
    elements: [
      { name: '金', color: '白色/金色', direction: '西/西北', organ: '肺/大肠', season: '秋' },
      { name: '木', color: '绿色/青色', direction: '东/东南', organ: '肝/胆', season: '春' },
      { name: '水', color: '黑色/蓝色', direction: '北', organ: '肾/膀胱', season: '冬' },
      { name: '火', color: '红色/紫色', direction: '南', organ: '心/小肠', season: '夏' },
      { name: '土', color: '黄色/棕色', direction: '中央/西南/东北', organ: '脾/胃', season: '长夏' }
    ]
  },

  // 流年运势
  getLiuNian: function() {
    const year = new Date().getFullYear();
    const ganzhi = ['甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯','甲辰','乙巳'];
    const idx = (year - 2014) % 12;
    const directions = ['中宫','西北','正西','东北','正南','正北','西南','正东','东南','中央','西北','正西'];
    return {
      year: year,
      ganzhi: ganzhi[idx] + '年',
      taiSui: directions[idx],
      posCai: '正西方',
      posWenChang: '东北方',
      posJiuZi: '正南方',
      posWuHuang: '中宫',
      posErHei: '西北方',
      tip: '本年' + ganzhi[idx] + '年，太岁在' + directions[idx] + '，此方宜静不宜动。'
    };
  },

  // 格局类型（带触发条件）
  patterns: [
    { 
      name: '藏风聚气', 
      score: 90, 
      desc: '格局方正，门窗相对位置合理，气场回旋有聚，主家宅安宁、财运亨通。',
      trigger: (f) => f.lightingLevel === 'good' && f.brightRatio > 0.3 && f.brightRatio < 0.5 && f.centerStatus !== 'dark'
    },
    { 
      name: '青龙抬头', 
      score: 85, 
      desc: '左手边（青龙位）开阔有力，主贵人运旺、事业顺遂、易得提携。',
      trigger: (f) => f.longHuBalance === 'longStrong'
    },
    { 
      name: '明堂开阔', 
      score: 82, 
      desc: '宅前空间开阔明亮，主人心胸宽广、前途光明、事业发展空间大。',
      trigger: (f) => f.mingtang === 'open' && f.lightingLevel === 'excellent'
    },
    { 
      name: '背山面水', 
      score: 88, 
      desc: '背后有靠、前方有景，格局上佳，主有贵人扶持、财源广进。',
      trigger: (f) => f.mingtang === 'open' && f.longHuBalance === 'balanced' && f.lightingLevel === 'good'
    },
    { 
      name: '四平八稳', 
      score: 75, 
      desc: '房屋方正、布局均衡，无大起大落，主安稳度日、渐入佳境。',
      trigger: (f) => f.longHuBalance === 'balanced' && f.centerStatus === 'normal'
    },
    { 
      name: '先苦后甜', 
      score: 68, 
      desc: '入门略窄而内里开阔，初入看似平常，越深入越有乾坤，主晚年运佳。',
      trigger: (f) => f.mingtang === 'blocked' && f.centerStatus === 'bright'
    },
    { 
      name: '龙强虎弱', 
      score: 78, 
      desc: '青龙位长而白虎位短，男主人运势较强，女主需注意健康。',
      trigger: (f) => f.longHuBalance === 'longStrong' && f.mingtang !== 'open'
    },
    { 
      name: '虎强龙弱', 
      score: 72, 
      desc: '白虎位强于青龙位，女主人当家，男主运势稍弱，注意协调。',
      trigger: (f) => f.longHuBalance === 'huStrong'
    }
  ],

  // 专业评语库
  comments: {
    good: [
      '此宅格局方正，气场流通有序，藏风纳气，主家宅安宁、财运稳进。',
      '室内布局得法，吉位得力，凶位有制，整体运势呈上升之势。',
      '生气位得位，文昌有力，主事业学业两旺，贵人相助。',
      '财位明净，天医有靠，主财运与健康俱佳，福寿双全。',
      '五行调和，阴阳平衡，居住其中身心舒畅，运势蒸蒸日上。'
    ],
    medium: [
      '格局尚可，吉中带凶，关键方位稍有不足，调整后可转好。',
      '整体运势平稳，但局部煞气未化，需注意化解以防后患。',
      '财运中等，健康尚可，唯事业运稍弱，宜加强文昌位布局。',
      '宅气尚算平和，唯需注意人际关系与口舌是非之扰。',
      '基础格局不差，但细节处有瑕疵，微调后运势可更上一层楼。'
    ],
    bad: [
      '煞气较重，多处犯忌，若不化解，恐影响健康与财运。',
      '格局略有偏差，凶位得力而吉位不显，建议尽早调整。',
      '宅气浑浊，阴阳失衡，长期居住易致身心俱疲。',
      '财来财去之象明显，守财不易，宜先稳固财位。',
      '是非口舌较多，家庭关系易生摩擦，需注意化解门冲。'
    ]
  }
};

// ============================================================
// ===== 报告生成引擎（基于图片特征） =====
// ============================================================

function generateReport(features) {
  if (!features) {
    // 兜底：如果没有特征，生成默认报告
    features = {
      avgBrightness: 130,
      lightingLevel: 'medium',
      brightRatio: 0.3,
      darkRatio: 0.1,
      wuxingStrength: { '金': 10, '木': 10, '水': 10, '火': 10, '土': 10 },
      strongElement: '土',
      weakElement: '金',
      longHuBalance: 'balanced',
      mingtang: 'normal',
      centerStatus: 'normal',
      contrast: 0.3,
      colorVariety: 15,
      colorRatios: { red: 0.05, green: 0.05, blue: 0.05, yellow: 0.05, white: 0.1, black: 0.05 }
    };
  }
  
  // 基础分数（基于采光和色彩丰富度）
  let baseScore = 65;
  
  // 采光加分
  if (features.lightingLevel === 'excellent') baseScore += 12;
  else if (features.lightingLevel === 'good') baseScore += 8;
  else if (features.lightingLevel === 'medium') baseScore += 3;
  else if (features.lightingLevel === 'low') baseScore -= 5;
  else if (features.lightingLevel === 'dark') baseScore -= 12;
  
  // 明堂开阔加分
  if (features.mingtang === 'open') baseScore += 5;
  else if (features.mingtang === 'blocked') baseScore -= 5;
  
  // 龙虎平衡加分
  if (features.longHuBalance === 'balanced') baseScore += 4;
  
  // 中心明亮加分
  if (features.centerStatus === 'bright') baseScore += 3;
  else if (features.centerStatus === 'dark') baseScore -= 6;
  
  // 色彩丰富度加分（适度最好）
  if (features.colorVariety > 10 && features.colorVariety < 25) baseScore += 3;
  else if (features.colorVariety > 30) baseScore -= 2;
  
  // 龙虎不平衡扣分
  if (features.longHuBalance !== 'balanced') baseScore -= 3;
  
  // 根据触发条件选择煞气
  const shas = [];
  const triggeredShas = FengShuiKnowledge.shaTypes.filter(sha => {
    try {
      return sha.trigger(features);
    } catch(e) { return false; }
  });
  
  // 随机打乱，取前2-4个
  triggeredShas.sort(() => Math.random() - 0.5);
  const shaCount = Math.min(triggeredShas.length, Math.floor(Math.random() * 3) + 2);
  for (let i = 0; i < shaCount; i++) {
    shas.push(triggeredShas[i]);
  }
  
  // 如果触发的煞气太少，补充一些通用的
  if (shas.length < 2) {
    const remaining = FengShuiKnowledge.shaTypes.filter(s => !shas.includes(s));
    remaining.sort(() => Math.random() - 0.5);
    while (shas.length < 2 && remaining.length > 0) {
      shas.push(remaining.pop());
    }
  }
  
  // 计算煞气减分
  let penalty = 0;
  shas.forEach(sha => {
    if (sha.level === 'high') penalty += Math.floor(Math.random() * 4) + 4;
    else if (sha.level === 'medium') penalty += Math.floor(Math.random() * 3) + 2;
    else penalty += Math.floor(Math.random() * 2) + 1;
  });
  
  const totalScore = Math.max(52, Math.min(96, baseScore - penalty + Math.floor(Math.random() * 6) - 3));
  
  // 确定格局 - 优先匹配触发的
  let pattern = null;
  const triggeredPatterns = FengShuiKnowledge.patterns.filter(p => {
    try { return p.trigger(features); } catch(e) { return false; }
  });
  
  if (triggeredPatterns.length > 0) {
    pattern = triggeredPatterns[Math.floor(Math.random() * triggeredPatterns.length)];
  } else {
    // 兜底：根据分数选择
    if (totalScore >= 85) {
      const goodPatterns = FengShuiKnowledge.patterns.filter(p => p.score >= 82);
      pattern = goodPatterns[Math.floor(Math.random() * goodPatterns.length)];
    } else if (totalScore >= 70) {
      const midPatterns = FengShuiKnowledge.patterns.filter(p => p.score >= 68 && p.score < 85);
      pattern = midPatterns[Math.floor(Math.random() * midPatterns.length)];
    } else {
      pattern = FengShuiKnowledge.patterns[FengShuiKnowledge.patterns.length - 1];
    }
  }
  
  // 确定吉位状态 - 基于特征判断
  const luckyPositions = [];
  const luckyCount = Math.floor(Math.random() * 2) + 3;
  const availableLucky = [...FengShuiKnowledge.luckyPositions];
  availableLucky.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < luckyCount && availableLucky.length > 0; i++) {
    const pos = availableLucky.splice(Math.floor(Math.random() * availableLucky.length), 1)[0];
    
    let status = '尚可';
    try {
      if (pos.goodTrigger && pos.goodTrigger(features)) {
        status = '得位';
      } else if (pos.badTrigger && pos.badTrigger(features)) {
        status = '待加强';
      }
    } catch(e) {}
    
    // 分数影响概率
    if (totalScore >= 82 && status === '尚可' && Math.random() > 0.5) status = '得位';
    if (totalScore < 65 && status === '尚可' && Math.random() > 0.5) status = '待加强';
    
    luckyPositions.push({ ...pos, status });
  }
  
  // 各维度运势分数（基于特征）
  const dimensions = {
    wealth: calculateWealthScore(features, totalScore),
    health: calculateHealthScore(features, totalScore),
    career: calculateCareerScore(features, totalScore),
    family: calculateFamilyScore(features, totalScore)
  };
  
  // 五行分析
  const strongElement = { name: features.strongElement };
  const weakElement = { name: features.weakElement };
  const elementsData = FengShuiKnowledge.wuxingAnalysis.elements;
  const strongData = elementsData.find(e => e.name === features.strongElement);
  const weakData = elementsData.find(e => e.name === features.weakElement);
  if (strongData) Object.assign(strongElement, strongData);
  if (weakData) Object.assign(weakElement, weakData);
  
  // 流年信息
  const liuNian = FengShuiKnowledge.getLiuNian();
  
  // 总体评语
  let comments;
  if (totalScore >= 82) {
    comments = FengShuiKnowledge.comments.good[Math.floor(Math.random() * FengShuiKnowledge.comments.good.length)];
  } else if (totalScore >= 68) {
    comments = FengShuiKnowledge.comments.medium[Math.floor(Math.random() * FengShuiKnowledge.comments.medium.length)];
  } else {
    comments = FengShuiKnowledge.comments.bad[Math.floor(Math.random() * FengShuiKnowledge.comments.bad.length)];
  }
  
  return {
    totalScore,
    pattern,
    shas,
    luckyPositions,
    dimensions,
    strongElement,
    weakElement,
    liuNian,
    comments,
    features: {
      lightingLevel: features.lightingLevel,
      avgBrightness: Math.round(features.avgBrightness),
      dominantColor: features.dominantColor,
      longHuBalance: features.longHuBalance,
      mingtang: features.mingtang
    }
  };
}

function calculateWealthScore(f, base) {
  let score = base + Math.floor(Math.random() * 8) - 4;
  if (f.mingtang === 'open') score += 5;
  if (f.mingtang === 'blocked') score -= 6;
  if (f.lightingLevel === 'excellent') score += 4;
  if (f.lightingLevel === 'dark') score -= 8;
  if (f.wuxingStrength['金'] > 10) score += 3;
  return Math.max(52, Math.min(98, score));
}

function calculateHealthScore(f, base) {
  let score = base + Math.floor(Math.random() * 6) - 2;
  if (f.lightingLevel === 'good' || f.lightingLevel === 'excellent') score += 4;
  if (f.lightingLevel === 'dark' || f.lightingLevel === 'low') score -= 7;
  if (f.centerStatus === 'dark') score -= 6;
  if (f.darkRatio > 0.25) score -= 5;
  return Math.max(52, Math.min(98, score));
}

function calculateCareerScore(f, base) {
  let score = base + Math.floor(Math.random() * 8) - 4;
  if (f.mingtang === 'open') score += 4;
  if (f.longHuBalance === 'longStrong') score += 3;
  if (f.longHuBalance === 'huStrong') score -= 3;
  if (f.wuxingStrength['木'] > 8) score += 3;
  return Math.max(52, Math.min(98, score));
}

function calculateFamilyScore(f, base) {
  let score = base + Math.floor(Math.random() * 8) - 4;
  if (f.longHuBalance === 'balanced') score += 4;
  if (f.colorVariety > 20) score -= 3;
  if (f.wuxingStrength['火'] > 15) score -= 4;
  if (f.centerStatus === 'bright') score += 3;
  return Math.max(52, Math.min(98, score));
}

// ============================================================
// ===== 页面渲染 =====
// ============================================================

function renderReport(report) {
  // 综合评分
  document.getElementById('totalScore').textContent = report.totalScore;
  document.getElementById('scoreBarFill').style.width = '0%';
  setTimeout(() => {
    document.getElementById('scoreBarFill').style.width = report.totalScore + '%';
  }, 100);
  
  // 等级
  let levelText, levelClass;
  if (report.totalScore >= 85) {
    levelText = '优秀 · 上佳格局';
    levelClass = 'good';
  } else if (report.totalScore >= 75) {
    levelText = '中上 · 格局尚可';
    levelClass = 'good';
  } else if (report.totalScore >= 65) {
    levelText = '中等 · 有吉有凶';
    levelClass = 'warning';
  } else {
    levelText = '偏差 · 需多注意';
    levelClass = 'bad';
  }
  const levelTag = document.getElementById('scoreLevel');
  levelTag.textContent = levelText;
  levelTag.className = 'level-tag ' + levelClass;
  document.getElementById('scoreDesc').textContent = report.comments;
  
  // 渲染各项运势
  renderDimensions(report.dimensions);
  
  // 渲染煞气问题
  renderIssues(report.shas);
  
  // 渲染吉位
  renderLuckyPositions(report.luckyPositions);
  
  // 渲染化解建议
  renderSuggestions(report.shas, report.luckyPositions);
  
  // 渲染方位分析
  renderDirections(report);
  
  // 渲染五行分析
  renderWuxing(report);
  
  // 渲染流年
  renderLiuNian(report);
  
  // 渲染推荐商品
  renderRecommendProducts(report);
}

function renderDimensions(dimensions) {
  const dimMap = [
    { key: 'wealth', name: '财运', icon: '💰' },
    { key: 'health', name: '健康运', icon: '❤️' },
    { key: 'career', name: '事业运', icon: '💼' },
    { key: 'family', name: '家庭运', icon: '👨‍👩‍👧' }
  ];
  
  const grid = document.querySelector('.dimension-grid');
  if (!grid) return;
  
  grid.innerHTML = dimMap.map(dim => {
    const score = dimensions[dim.key];
    const desc = getScoreDesc(score, dim.key);
    const colorClass = score >= 80 ? 'good' : '';
    return `
      <div class="dim-card">
        <div class="dim-icon">${dim.icon}</div>
        <div class="dim-info">
          <div class="dim-header">
            <span class="dim-name">${dim.name}</span>
            <span class="dim-score">${score}分</span>
          </div>
          <div class="dim-bar"><div class="dim-fill ${colorClass}" data-target="${score}" style="width:0%"></div></div>
          <p class="dim-desc">${desc}</p>
        </div>
      </div>
    `;
  }).join('');
}

function getScoreDesc(score, type) {
  const descs = {
    wealth: [
      '财库丰盈，正财偏财皆旺',
      '财运亨通，收入稳定增长',
      '财运尚可，稳中有进',
      '财运平平，量入为出',
      '财来财去，注意守财'
    ],
    health: [
      '身心康泰，精力充沛',
      '身体康健，气色红润',
      '健康尚可，注意作息',
      '体质一般，多加保养',
      '健康偏弱，注意调理'
    ],
    career: [
      '事业腾飞，步步高升',
      '事业顺遂，贵人相助',
      '事业平稳，蓄势待发',
      '事业一般，需多努力',
      '事业受阻，耐心等待'
    ],
    family: [
      '家庭和睦，其乐融融',
      '家宅安宁，亲情融洽',
      '家庭和谐，偶有摩擦',
      '家运一般，多些沟通',
      '是非较多，注意化解'
    ]
  };
  const arr = descs[type] || descs.wealth;
  if (score >= 88) return arr[0];
  if (score >= 78) return arr[1];
  if (score >= 70) return arr[2];
  if (score >= 62) return arr[3];
  return arr[4];
}

function renderIssues(shas) {
  const list = document.querySelector('.issue-list');
  if (!list) return;
  
  const levelMap = { high: '严重', medium: '中等', low: '轻微' };
  
  list.innerHTML = shas.map(sha => `
    <div class="issue-item">
      <div class="issue-level ${sha.level}">${levelMap[sha.level]}</div>
      <div class="issue-content">
        <h4>${sha.name}</h4>
        <p><strong>成因：</strong>${sha.cause}</p>
        <p style="margin-top: 4px;">${sha.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderSuggestions(shas, luckyPositions) {
  const list = document.querySelector('.suggestion-list');
  if (!list) return;
  
  let html = '';
  let num = 1;
  
  // 煞气化解建议
  shas.slice(0, 3).forEach(sha => {
    const solution = sha.solutions[Math.floor(Math.random() * sha.solutions.length)];
    const tags = sha.items.slice(0, 3).map(i => `<span class="tag">${i}</span>`).join('');
    html += `
      <div class="suggestion-item">
        <div class="suggestion-num">${num}</div>
        <div class="suggestion-content">
          <h4>化解「${sha.name}」</h4>
          <p>${solution}</p>
          <div class="suggestion-items">${tags}</div>
        </div>
      </div>
    `;
    num++;
  });
  
  // 吉位增强建议
  const weakPositions = luckyPositions.filter(p => p.status === '待加强' || p.status === '尚可');
  if (weakPositions.length > 0 && num <= 5) {
    const pos = weakPositions[0];
    html += `
      <div class="suggestion-item">
        <div class="suggestion-num">${num}</div>
        <div class="suggestion-content">
          <h4>增强${pos.name}</h4>
          <p>${pos.enhance}，可有效提升运势。</p>
          <div class="suggestion-items">
            <span class="tag">${pos.direction}</span>
            <span class="tag">${pos.element}属性</span>
          </div>
        </div>
      </div>
    `;
    num++;
  }
  
  list.innerHTML = html;
}

function renderLuckyPositions(positions) {
  const detail = document.querySelector('.direction-detail');
  if (!detail) return;
  
  let html = '';
  positions.forEach(pos => {
    let statusClass, statusText;
    if (pos.status === '得位') {
      statusClass = 'good';
      statusText = '得位 · 吉';
    } else if (pos.status === '尚可') {
      statusClass = 'neutral';
      statusText = '尚可 · 平';
    } else {
      statusClass = 'warning';
      statusText = '待加强';
    }
    html += `
      <div class="detail-item ${statusClass}">
        <span class="dot ${statusClass}"></span>
        <strong>${pos.icon} ${pos.name}</strong> — ${pos.direction}，${statusText}
      </div>
    `;
  });
  
  html += `
    <div class="detail-item neutral">
      <span class="dot neutral"></span>
      <strong>其余方位</strong> — 格局平稳，无大凶大吉
    </div>
  `;
  
  detail.innerHTML = html;
}

function renderDirections(report) {
  // 方位图标记
  const directions = document.querySelectorAll('.direction');
}

function renderWuxing(report) {
  let card = document.querySelector('.wuxing-card');
  if (!card) {
    const dirCard = document.querySelector('.direction-card');
    if (dirCard) {
      const wuxingDiv = document.createElement('div');
      wuxingDiv.className = 'wuxing-card';
      wuxingDiv.innerHTML = `
        <h3 class="card-title">☯️ 五行气场分析</h3>
        <div class="wuxing-content">
          <div class="wuxing-items"></div>
          <div class="wuxing-summary"></div>
        </div>
      `;
      dirCard.after(wuxingDiv);
    }
  }
  
  const itemsContainer = document.querySelector('.wuxing-items');
  const summaryContainer = document.querySelector('.wuxing-summary');
  
  if (itemsContainer) {
    const elements = FengShuiKnowledge.wuxingAnalysis.elements;
    itemsContainer.innerHTML = elements.map(el => {
      let status = '平衡';
      let statusClass = 'neutral';
      if (el.name === report.strongElement.name) {
        status = '偏旺';
        statusClass = 'warning';
      } else if (el.name === report.weakElement.name) {
        status = '偏弱';
        statusClass = 'bad';
      }
      return `
        <div class="wuxing-item">
          <div class="wuxing-name">${el.name}</div>
          <div class="wuxing-dir">${el.direction}</div>
          <div class="wuxing-status ${statusClass}">${status}</div>
        </div>
      `;
    }).join('');
  }
  
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <p><strong>气场特点：</strong>图像主色调偏${report.features.dominantColor || '中性'}，${report.strongElement.name}气偏旺，${report.weakElement.name}气稍弱。</p>
      <p style="margin-top: 8px;"><strong>调理建议：</strong>可通过${report.weakElement.color}色系的装饰、朝向${report.weakElement.direction}方位的布局来增强${report.weakElement.name}气，使五行趋于平衡。</p>
    `;
  }
}

function renderLiuNian(report) {
  let card = document.querySelector('.liunian-card');
  if (!card) {
    const wuxingCard = document.querySelector('.wuxing-card');
    if (wuxingCard) {
      const lnDiv = document.createElement('div');
      lnDiv.className = 'liunian-card';
      lnDiv.innerHTML = `
        <h3 class="card-title">📅 流年运势（${report.liuNian.year}年）</h3>
        <div class="liunian-content"></div>
      `;
      wuxingCard.after(lnDiv);
    }
  }
  
  const content = document.querySelector('.liunian-content');
  if (content) {
    content.innerHTML = `
      <div class="liunian-badge">${report.liuNian.ganzhi}</div>
      <p class="liunian-tip">${report.liuNian.tip}</p>
      <div class="liunian-grid">
        <div class="liunian-item">
          <span class="liunian-label">🧧 财位</span>
          <span class="liunian-value">${report.liuNian.posCai}</span>
        </div>
        <div class="liunian-item">
          <span class="liunian-label">📖 文昌位</span>
          <span class="liunian-value">${report.liuNian.posWenChang}</span>
        </div>
        <div class="liunian-item">
          <span class="liunian-label">⭐ 九紫星</span>
          <span class="liunian-value">${report.liuNian.posJiuZi}</span>
        </div>
        <div class="liunian-item">
          <span class="liunian-label">⚠️ 五黄位</span>
          <span class="liunian-value warn">${report.liuNian.posWuHuang}</span>
        </div>
      </div>
    `;
  }
}

// ============================================================
// ===== 页面切换 =====
// ============================================================

function showPage(pageName) {
  if (pageName === 'about') {
    document.getElementById('aboutModal').classList.add('active');
    return;
  }
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageName);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function hidePage(pageName) {
  if (pageName === 'about') {
    document.getElementById('aboutModal').classList.remove('active');
  }
}

function closeModal(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
}

function goHome() {
  stopCamera();
  imageFeatures = null;
  currentReport = null;
  showPage('home');
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
}

// ===== Tab切换 =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  
  document.querySelectorAll('.upload-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  
  if (tab !== 'camera') {
    stopCamera();
  }
}

// ===== 文件上传 =====
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showToast('请上传图片文件');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    currentImageData = e.target.result;
    // 先分析图片，再启动分析流程
    analyzeImage(currentImageData).then(features => {
      imageFeatures = features;
      startAnalysis();
    }).catch(() => {
      imageFeatures = null;
      startAnalysis();
    });
  };
  reader.readAsDataURL(file);
}

// 拖拽上传
document.addEventListener('DOMContentLoaded', function() {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    uploadArea.classList.add('dragover');
  }
  
  function unhighlight() {
    uploadArea.classList.remove('dragover');
  }
  
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        currentImageData = ev.target.result;
        analyzeImage(currentImageData).then(features => {
          imageFeatures = features;
          startAnalysis();
        }).catch(() => {
          imageFeatures = null;
          startAnalysis();
        });
      };
      reader.readAsDataURL(file);
    } else {
      showToast('请上传图片文件');
    }
  }
});

// ===== 相机功能 =====
async function startCamera() {
  try {
    const video = document.getElementById('cameraVideo');
    const startBtn = document.getElementById('startCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const switchBtn = document.getElementById('switchCameraBtn');
    
    if (mediaStream) {
      stopCamera();
    }
    
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = mediaStream;
    
    startBtn.hidden = true;
    captureBtn.hidden = false;
    switchBtn.hidden = false;
    
  } catch (err) {
    console.error('Camera error:', err);
    showToast('无法访问相机，请检查权限设置');
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  
  const video = document.getElementById('cameraVideo');
  if (video) video.srcObject = null;
  
  const startBtn = document.getElementById('startCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const switchBtn = document.getElementById('switchCameraBtn');
  if (startBtn) startBtn.hidden = false;
  if (captureBtn) captureBtn.hidden = true;
  if (switchBtn) switchBtn.hidden = true;
}

function switchCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  if (mediaStream) {
    startCamera();
  }
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  
  if (!video.videoWidth) {
    showToast('相机尚未就绪');
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  currentImageData = canvas.toDataURL('image/jpeg', 0.9);
  stopCamera();
  
  // 分析图片
  analyzeImage(currentImageData).then(features => {
    imageFeatures = features;
    startAnalysis();
  }).catch(() => {
    imageFeatures = null;
    startAnalysis();
  });
}

// ===== 分析流程 =====
function startAnalysis() {
  if (!currentImageData) {
    showToast('请先选择或拍摄照片');
    return;
  }
  
  showPage('analyzing');
  
  // 预生成报告（基于图片特征）
  currentReport = generateReport(imageFeatures);
  
  const steps = [
    { text: '识别图像特征中...', progress: 15, step: 1 },
    { text: '分析色彩与采光...', progress: 30, step: 1 },
    { text: '测算方位格局中...', progress: 45, step: 2 },
    { text: '诊断煞气凶位中...', progress: 60, step: 2 },
    { text: '推演五行气场中...', progress: 75, step: 3 },
    { text: '生成分析报告中...', progress: 100, step: 4 }
  ];
  
  let currentStep = 0;
  
  function nextStep() {
    if (currentStep >= steps.length) {
      setTimeout(() => {
        showResult();
      }, 500);
      return;
    }
    
    const step = steps[currentStep];
    
    document.getElementById('analyzingStep').textContent = step.text;
    document.getElementById('progressFill').style.width = step.progress + '%';
    document.getElementById('progressPercent').textContent = step.progress;
    
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById('step' + i);
      if (i <= step.step) {
        stepEl.classList.add('active');
        if (i < step.step) {
          stepEl.querySelector('.step-dot').textContent = '✓';
        }
      } else {
        stepEl.classList.remove('active');
      }
    }
    
    currentStep++;
    setTimeout(nextStep, 500 + Math.random() * 400);
  }
  
  // 重置
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressPercent').textContent = '0';
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById('step' + i);
    stepEl.classList.remove('active');
    stepEl.querySelector('.step-dot').textContent = i;
  }
  document.getElementById('step1').classList.add('active');
  
  setTimeout(nextStep, 600);
}

// ===== 显示结果 =====
function showResult() {
  // 设置结果图片
  const resultImg = document.getElementById('resultImage');
  if (resultImg && currentImageData) {
    resultImg.src = currentImageData;
  }
  
  // 渲染报告
  if (currentReport) {
    renderReport(currentReport);
  }
  
  showPage('result');
  
  // 触发动画
  setTimeout(animateScoreBars, 400);
}

function animateScoreBars() {
  const fills = document.querySelectorAll('.dim-fill');
  fills.forEach(fill => {
    const target = fill.dataset.target || 70;
    fill.style.width = target + '%';
  });
}

// ===== 分享功能 =====
function shareReport() {
  if (navigator.share) {
    navigator.share({
      title: '我的风水查勘报告',
      text: '我用风水智鉴测了家里的风水，综合评分' + (currentReport?.totalScore || 78) + '分，快来看看吧！',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('链接已复制到剪贴板');
    }).catch(() => {
      showToast('分享功能暂不可用');
    });
  }
}

// ===== Toast提示 =====
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ============================================================
// ===== 商城系统 =====
// ============================================================

// 商品数据库
const products = [
  // 招财类
  {
    id: 1,
    name: '开光金貔貅摆件',
    icon: '🦄',
    category: 'wealth',
    price: 298,
    originalPrice: 398,
    badge: 'hot',
    badgeText: '热销',
    desc: '招财守财，镇宅化煞，适合摆放于财位',
    features: ['天然黑曜石材质', '大师开光加持', '招财进宝，只进不出', '镇宅化煞，守护家宅'],
    detail: '貔貅为中国古代五大瑞兽之一，以财为食，纳食四方之财，且只进不出。此款金貔貅摆件采用天然黑曜石精雕细琢，经高僧开光加持，摆放于家中财位或办公室，可招财纳福、镇宅辟邪。'
  },
  {
    id: 2,
    name: '聚宝盆风水摆件',
    icon: '💰',
    category: 'wealth',
    price: 168,
    originalPrice: 228,
    badge: 'hot',
    badgeText: '爆款',
    desc: '聚财纳福，财源滚滚，财位必备',
    features: ['纯铜材质', '聚财旺财', '提升财运', '精工细作'],
    detail: '聚宝盆是中国传统风水吉祥物，寓意聚财纳福、财源广进。此款纯铜聚宝盆，工艺精湛，造型饱满，摆放于客厅明财位，可助财运亨通、家宅富足。'
  },
  {
    id: 3,
    name: '紫水晶洞',
    icon: '💎',
    category: 'wealth',
    price: 588,
    originalPrice: 788,
    badge: '',
    badgeText: '',
    desc: '聚气招财，净化磁场，提升贵人运',
    features: ['天然乌拉圭紫晶', '聚气招财', '净化负能量', '提升人缘'],
    detail: '紫水晶洞被誉为"风水石之王"，具有强大的聚气招财能量。天然形成的晶洞如同聚宝盆，可聚集财气、净化负面磁场，摆放于家中或办公室，有助提升财运与人缘。'
  },
  {
    id: 4,
    name: '发财树盆栽',
    icon: '🌳',
    category: 'wealth',
    price: 128,
    originalPrice: 168,
    badge: 'new',
    badgeText: '新品',
    desc: '生机勃勃，招财进宝，旺宅必备',
    features: ['寓意招财', '净化空气', '易养易活', '美观大方'],
    detail: '发财树寓意招财进宝、兴旺发达，是最受欢迎的风水绿植之一。其叶片如掌，有"掌握财富"之意，摆放于客厅或办公室东南角（财位），可助财运、添生机。'
  },
  // 健康类
  {
    id: 5,
    name: '铜葫芦风水摆件',
    icon: '🫙',
    category: 'health',
    price: 198,
    originalPrice: 268,
    badge: 'hot',
    badgeText: '热销',
    desc: '化病消灾，健康长寿，天医位首选',
    features: ['纯铜精工', '化煞去病', '增福添寿', '可开口装藏'],
    detail: '葫芦谐音"福禄"，是风水中最常用的健康吉祥物。铜葫芦可吸收病气、化解煞气，特别适合摆放于卧室或天医位，有助家人身体健康、平安长寿。'
  },
  {
    id: 6,
    name: '五帝钱真品',
    icon: '🪙',
    category: 'health',
    price: 88,
    originalPrice: 128,
    badge: '',
    badgeText: '',
    desc: '挡煞辟邪，化解煞气，随身携带',
    features: ['清代五帝古钱', '挡煞辟邪', '招财纳福', '随身携带'],
    detail: '五帝钱是指清朝顺治、康熙、雍正、乾隆、嘉庆五个朝代的铜钱，经百年流传，凝聚了天、地、人三才之气，具有强大的辟邪化煞功效。可悬挂于车内、床头或随身携带。'
  },
  {
    id: 7,
    name: '虎尾兰净化绿植',
    icon: '🌿',
    category: 'health',
    price: 68,
    originalPrice: 98,
    badge: '',
    badgeText: '',
    desc: '净化空气，吸收秽气，化煞生旺',
    features: ['净化空气', '吸收甲醛', '易养耐旱', '风水化煞'],
    detail: '虎尾兰叶片挺拔如剑，有"斩煞"之意，是极佳的化煞绿植。同时它能强效净化空气，吸收甲醛等有害物质，特别适合摆放在卫生间附近或阴气较重的角落。'
  },
  // 事业类
  {
    id: 8,
    name: '文昌塔九层',
    icon: '🗼',
    category: 'career',
    price: 158,
    originalPrice: 218,
    badge: 'hot',
    badgeText: '热销',
    desc: '旺文启智，学业事业，步步高升',
    features: ['九层文昌塔', '旺文启智', '助学业事业', '纯铜材质'],
    detail: '文昌塔为最常用的旺学业、旺事业的风水吉祥物。九层文昌塔寓意步步高升、九天之上，摆放于书房或办公桌上的文昌位，可助思维敏捷、考试顺利、事业升迁。'
  },
  {
    id: 9,
    name: '龙龟摆件',
    icon: '🐢',
    category: 'career',
    price: 268,
    originalPrice: 358,
    badge: '',
    badgeText: '',
    desc: '贵人扶持，事业稳定，长寿吉祥',
    features: ['龙头龟身', '招贵人运', '事业稳定', '长寿吉祥'],
    detail: '龙龟是龙与龟的结合，为风水四大神兽之一。龙头象征尊贵与权威，龟象征长寿与稳重。摆放于办公桌上，可招贵人、稳事业、化小人，助您职场顺遂。'
  },
  {
    id: 10,
    name: '文竹盆栽',
    icon: '🎋',
    category: 'career',
    price: 48,
    originalPrice: 68,
    badge: 'new',
    badgeText: '新品',
    desc: '文雅脱俗，文昌有助，书房必备',
    features: ['文雅清新', '助文昌运', '净化空气', '好养易活'],
    detail: '文竹身姿优雅，有"文雅之竹"的美誉，是书房最经典的风水绿植。它能提升文昌运势，有助学业与事业，摆放于书桌旁，可增添文气、提升专注力。'
  },
  // 感情类
  {
    id: 11,
    name: '粉水晶球',
    icon: '🔮',
    category: 'love',
    price: 238,
    originalPrice: 318,
    badge: 'hot',
    badgeText: '爆款',
    desc: '招桃花旺姻缘，人缘和合，感情甜蜜',
    features: ['天然粉水晶', '招桃花', '旺人缘', '增进感情'],
    detail: '粉水晶又称"爱情石"，是最经典的招桃花、旺姻缘的水晶。天然粉水晶球能量均匀柔和，摆放于卧室或桃花位，可增强个人魅力、招正桃花、增进感情甜蜜。'
  },
  {
    id: 12,
    name: '鸳鸯戏水摆件',
    icon: '🦆',
    category: 'love',
    price: 188,
    originalPrice: 258,
    badge: '',
    badgeText: '',
    desc: '夫妻和睦，百年好合，感情稳固',
    features: ['一对鸳鸯', '促夫妻和睦', '百年好合', '精美彩绘'],
    detail: '鸳鸯自古就是爱情与忠贞的象征，"只羡鸳鸯不羡仙"。鸳鸯摆件寓意夫妻恩爱、百年好合，特别适合新婚夫妇或希望增进感情的夫妻摆放于卧室。'
  },
  {
    id: 13,
    name: '红玫瑰花束（永生花）',
    icon: '🌹',
    category: 'love',
    price: 168,
    originalPrice: 228,
    badge: 'new',
    badgeText: '新品',
    desc: '爱情红火，桃花运旺，增进感情',
    features: ['永生玫瑰', '永不凋谢', '爱情红火', '精美礼盒'],
    detail: '红玫瑰是爱情的象征，永生玫瑰寓意爱情永不凋谢。在风水中，红色属火，可增强桃花运势。摆放于卧室或客厅桃花位，有助感情升温、桃花运旺。'
  },
  // 化煞类
  {
    id: 14,
    name: '铜麒麟一对',
    icon: '🦌',
    category: 'resolve',
    price: 368,
    originalPrice: 498,
    badge: 'hot',
    badgeText: '热销',
    desc: '镇宅化煞，送子旺丁，吉祥瑞兽',
    features: ['一对麒麟', '镇宅化煞', '送子旺丁', '纯铜精工'],
    detail: '麒麟为中国古代五大瑞兽之首，主太平、长寿、吉祥。铜麒麟一对摆放于门口或客厅，可镇宅化煞、辟邪挡灾、旺丁送子，是风水中功能最全面的吉祥物之一。'
  },
  {
    id: 15,
    name: '八卦镜凸面',
    icon: '🪞',
    category: 'resolve',
    price: 58,
    originalPrice: 88,
    badge: '',
    badgeText: '',
    desc: '反射煞气，化解冲煞，门外必备',
    features: ['凸面八卦镜', '反射煞气', '化解冲煞', '铜制镜面'],
    detail: '八卦凸镜是风水中最常用的化煞工具之一，专门用于化解来自室外的煞气（如尖角煞、天斩煞、路冲等）。镜面凸起可将煞气反射回去，挂于门外或窗外，守护家宅平安。'
  },
  {
    id: 16,
    name: '山海镇挂画',
    icon: '🖼️',
    category: 'resolve',
    price: 128,
    originalPrice: 168,
    badge: '',
    badgeText: '',
    desc: '化解各种形煞，镇宅平安，化煞神器',
    features: ['山海真形图', '化解百煞', '镇宅平安', '宣纸印制'],
    detail: '山海镇是一幅包含山、海、八卦、日月等图案的风水挂画，有"化百煞"之功效。无论尖角煞、天斩煞、路冲煞等各种形煞，悬挂山海镇皆可化解，是居家必备的化煞神器。'
  },
  {
    id: 17,
    name: '风水屏风摆件',
    icon: '🪟',
    category: 'resolve',
    price: 458,
    originalPrice: 598,
    badge: 'new',
    badgeText: '新品',
    desc: '挡煞聚气，化解穿堂，玄关必备',
    features: ['实木框架', '挡煞聚气', '化解穿堂煞', '装饰性强'],
    detail: '屏风是中国传统风水家具，有"挡煞聚气"的重要作用。特别适合大门正对窗户或阳台（穿堂煞）的户型，放置于玄关处，可阻挡煞气直冲、帮助藏风聚气。'
  },
  {
    id: 18,
    name: '桃木剑挂件',
    icon: '⚔️',
    category: 'resolve',
    price: 78,
    originalPrice: 108,
    badge: '',
    badgeText: '',
    desc: '辟邪镇宅，斩除晦气，保家平安',
    features: ['天然桃木', '辟邪镇宅', '斩除晦气', '手工雕刻'],
    detail: '桃木自古被称为"五木之精"，有辟邪镇宅的神奇功效。桃木剑挂件悬挂于家中，可斩除晦气、驱散阴邪、守护家宅平安，特别适合家宅不安或阴气较重的居所。'
  }
];

// 购物车数据（从localStorage读取）
let cart = JSON.parse(localStorage.getItem('fengshui_cart') || '[]');
let currentCategory = 'all';
let currentProduct = null;

// 保存购物车
function saveCart() {
  localStorage.setItem('fengshui_cart', JSON.stringify(cart));
  updateCartBadge();
}

// 更新购物车角标
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (total > 0) {
    badge.style.display = 'flex';
    badge.textContent = total > 99 ? '99+' : total;
  } else {
    badge.style.display = 'none';
  }
}

// 显示商城
function showShop() {
  showPage('shop');
  if (currentCategory === 'all') {
    renderProducts(products);
  } else {
    filterProducts(currentCategory);
  }
}

// 显示购物车
function showCart() {
  showPage('cart');
  renderCart();
}

// 商品分类筛选
function filterProducts(category) {
  currentCategory = category;
  
  // 更新按钮状态
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.cat === category) {
      btn.classList.add('active');
    }
  });
  
  // 筛选商品
  let filtered;
  if (category === 'all') {
    filtered = products;
  } else {
    filtered = products.filter(p => p.category === category);
  }
  
  renderProducts(filtered);
}

// 渲染商品列表
function renderProducts(productList) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  grid.innerHTML = productList.map(p => `
    <div class="product-card" onclick="openProductDetail(${p.id})">
      <div class="product-image">
        ${p.badge ? `<span class="product-badge ${p.badge}">${p.badgeText}</span>` : ''}
        ${p.icon}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-bottom">
          <div class="product-price"><small>¥</small>${p.price}</div>
          <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// 打开商品详情
function openProductDetail(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  currentProduct = product;
  const modal = document.getElementById('productModal');
  const detail = document.getElementById('productDetail');
  
  detail.innerHTML = `
    <div class="pd-image">
      ${product.badge ? `<span class="product-badge ${product.badge}">${product.badgeText}</span>` : ''}
      ${product.icon}
    </div>
    <div class="pd-info">
      <h2 class="pd-name">${product.name}</h2>
      <div class="pd-price">
        <small>¥</small>${product.price}
        <span style="font-size:0.85rem; color:var(--muted); text-decoration:line-through; font-weight:400; margin-left:8px;">
          ¥${product.originalPrice}
        </span>
      </div>
      <p class="pd-desc">${product.detail}</p>
      <div class="pd-features">
        <h5>✨ 产品特点</h5>
        <ul>
          ${product.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      <div class="pd-actions">
        <button class="btn-secondary-lg" onclick="addToCart(${product.id}); closeProductModal();">加入购物车</button>
        <button class="btn-primary-lg" onclick="buyNow(${product.id})">立即购买</button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

// 关闭商品详情
function closeProductModal(event) {
  if (event && event.target && !event.target.classList.contains('modal')) return;
  document.getElementById('productModal').classList.remove('active');
  currentProduct = null;
}

// 加入购物车
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      icon: product.icon,
      price: product.price,
      quantity: 1
    });
  }
  
  saveCart();
  showToast(`已添加「${product.name}」到购物车`);
}

// 立即购买
function buyNow(id) {
  addToCart(id);
  closeProductModal();
  showCart();
}

// 渲染购物车
function renderCart() {
  const emptyEl = document.getElementById('cartEmpty');
  const contentEl = document.getElementById('cartContent');
  const listEl = document.getElementById('cartList');
  
  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    contentEl.style.display = 'none';
    return;
  }
  
  emptyEl.style.display = 'none';
  contentEl.style.display = 'block';
  
  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">${item.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">¥${item.price}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-text">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          <span class="cart-item-remove" onclick="removeFromCart(${item.id})">删除</span>
        </div>
      </div>
    </div>
  `).join('');
  
  // 计算总价
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 199 ? 0 : 12;
  const total = subtotal + shipping;
  
  document.getElementById('cartSubtotal').textContent = '¥' + subtotal;
  document.getElementById('cartShipping').textContent = shipping === 0 ? '免运费' : '¥' + shipping;
  document.getElementById('cartTotal').textContent = '¥' + total;
}

// 修改数量
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }
  
  saveCart();
  renderCart();
}

// 删除商品
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
}

// 结算
function checkout() {
  if (cart.length === 0) return;
  showToast('正在跳转到支付页面...');
  setTimeout(() => {
    showToast('演示版本，暂不支持实际支付');
  }, 1500);
}

// 渲染推荐商品（基于报告诊断结果）
function renderRecommendProducts(report) {
  const container = document.getElementById('recommendProducts');
  if (!container || !report) return;
  
  let recommendIds = [];
  
  // 根据煞气类型推荐化煞商品
  const shaResolveMap = {
    '穿堂煞': [17, 1],
    '门冲煞': [6, 15],
    '横梁压顶': [5, 6],
    '尖角煞': [15, 16],
    '厕占中宫': [7, 5],
    '厨房冲门': [5, 3],
    '明镜高悬': [14, 5],
    '背门而坐': [9, 8],
    '财位受压': [2, 3],
    '床头悬空': [5, 11],
    '水火相冲': [9, 7],
    '开口煞': [14, 6],
    '阴盛阳衰': [14, 1],
    '宅气涣散': [17, 2]
  };
  
  if (report.shas && report.shas.length > 0) {
    report.shas.forEach(sha => {
      const ids = shaResolveMap[sha.name];
      if (ids) {
        recommendIds.push(...ids);
      }
    });
  }
  
  // 根据五行偏弱推荐
  const wuxingMap = {
    '金': [6, 1],
    '木': [10, 7],
    '水': [11, 15],
    '火': [13, 8],
    '土': [2, 5]
  };
  if (report.weakElement) {
    const ids = wuxingMap[report.weakElement.name || report.weakElement];
    if (ids) recommendIds.push(...ids);
  }
  
  // 去重
  recommendIds = [...new Set(recommendIds)];
  
  // 如果不够，补充热门商品
  if (recommendIds.length < 3) {
    const hotProducts = products.filter(p => p.badge === 'hot').map(p => p.id);
    hotProducts.forEach(id => {
      if (!recommendIds.includes(id)) recommendIds.push(id);
    });
  }
  
  // 取前3个
  recommendIds = recommendIds.slice(0, 3);
  
  const recommendProducts = recommendIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  
  container.innerHTML = recommendProducts.map(p => `
    <div class="recommend-product" onclick="openProductDetail(${p.id})">
      <div class="rec-icon">${p.icon}</div>
      <div class="rec-name">${p.name}</div>
      <div class="rec-price">¥${p.price}</div>
    </div>
  `).join('');
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  showPage('home');
  updateCartBadge();
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
  });
});
