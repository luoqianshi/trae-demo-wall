/**
 * BWT Demo - Shared Data Store
 * 基于 localStorage 的页面间数据传递层，含三套模拟分析模板
 */
(function () {
  'use strict';

  var STORAGE_PREFIX = 'bwt_';

  /* ========== Storage API ========== */
  var BWTStore = {
    set: function (key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      } catch (e) { /* localStorage full or disabled */ }
    },

    get: function (key) {
      try {
        var raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    remove: function (key) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } catch (e) { /* ignore */ }
    },

    clear: function () {
      try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(STORAGE_PREFIX) === 0) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) { /* ignore */ }
    }
  };

  /* ========== Category → Template Matching ========== */
  function matchCategory(category) {
    if (!category) return 'headphones';
    var c = category.toLowerCase();
    if (c.indexOf('耳机') !== -1 || c.indexOf('headphone') !== -1) return 'headphones';
    if (c.indexOf('手机') !== -1 || c.indexOf('phone') !== -1) return 'phone';
    if (c.indexOf('跑鞋') !== -1 || c.indexOf('鞋') !== -1 || c.indexOf('shoe') !== -1 || c.indexOf('sneaker') !== -1) return 'shoes';
    if (c.indexOf('投影') !== -1 || c.indexOf('projector') !== -1 || c.indexOf('当贝') !== -1 || c.indexOf('极米') !== -1) return 'projector';
    if (c.indexOf('小家电') !== -1 || c.indexOf('空气炸锅') !== -1 || c.indexOf('煎烤') !== -1 || c.indexOf('appliance') !== -1 || c.indexOf('炸锅') !== -1) return 'appliance';
    // Default to headphones
    return 'headphones';
  }

  /* ========== Analysis Result Templates ========== */
  var TEMPLATES = {

    // ---------- 耳机模板 (Sony WH-1000XM5) ----------
    headphones: {
      conclusion: {
        text: '建议购买',
        confidence: 87,
        summary: '降噪性能出色，性价比优秀，适合你的通勤场景'
      },
      needIndex: {
        score: 72,
        bullets: [
          {
            text: '基于"日常通勤听播客"场景，降噪耳机对你有一定必要性',
            detail: '你每周通勤约 5 天，单程约 45 分钟。在地铁、公交等嘈杂环境中，降噪耳机可显著提升音频清晰度，减少环境噪音干扰，同时保护听力（无需调高音量即可听清内容）。综合通勤时长和环境噪音水平，降噪耳机属于"中等偏上"刚需。'
          },
          {
            text: '你已有一副有线耳机可满足基础需求，刚需指数未达最高',
            detail: '你当前使用的有线耳机可满足安静环境下的基础聆听需求。但在通勤场景中，有线耳机的被动隔音能力有限，降噪深度约 5-10dB，远低于主动降噪耳机 25-35dB 的水平。因此虽然非绝对刚需，但升级体验显著。'
          },
          {
            text: '降噪需求与通勤环境高度匹配',
            detail: '地铁车厢内噪音通常在 80-90dB，公交约 70-80dB。Sony WH-1000XM5 降噪深度达 35dB，可将其降低到 45-55dB 的舒适范围，与安静办公室相当。通勤听播客、音乐的场景与该产品的核心优势高度匹配。'
          }
        ]
      },
      valueRating: {
        stars: 4,
        label: '优秀',
        currentPrice: 2299,
        marketAvg: 2600,
        marketMin: 899,
        marketMax: 3999,
        summary: '定价 ¥2,299，同类均价 ¥2,600，处于中低水平。降噪深度 35dB 高于同价位平均水平（28dB），综合性价比评估优秀。'
      },
      impulseWarning: {
        level: 35,
        label: '中等',
        color: '#FFB84D',
        warning: '检测到当前为深夜时段（23:00 后），且该商品最近 7 天内有直播带货活动。情绪占比约 35%，建议冷静 6 小时后再做最终决定。',
        factors: [
          { text: '深夜时段下单', type: 'yellow' },
          { text: '近期有直播带货活动', type: 'red' },
          { text: '商品在你的购物车中已存在 3 天', type: 'green' }
        ]
      },
      decisionFactors: [
        { text: '通勤降噪需求明确，刚需指数 72 分', type: 'green' },
        { text: '价格低于同类均价 12%，性价比突出', type: 'green' },
        { text: '已有基础耳机，升级属改善型消费', type: 'yellow' },
        { text: '近期有促销活动，非最佳入手时机', type: 'red' }
      ],
      reasoning: [
        { title: '需求匹配分析', content: '基于你描述的"日常通勤听播客"场景，BWT 从三个维度评估需求匹配度：1) 场景频率（每周 5 天通勤 × 90 分钟 = 每周 7.5 小时潜在使用时间）；2) 环境噪音水平（地铁约 85dB，降噪耳机可降至 50dB）；3) 功能替代性（你当前有线耳机在嘈杂环境中体验较差）。综合评估：场景匹配度高，但存在功能替代方案，因此刚需指数为 72/100。' },
        { title: '价值判断逻辑', content: '通过检索同类商品价格分布（共 156 款），BWT 发现：中位数 ¥2,600，P25 ¥1,800，P75 ¥3,200。当前价格 ¥2,299 处于 P25-P50 区间，属于"中偏低"。进一步分析参数性价比：降噪深度 35dB 在 ¥2,000-2,500 区间的 42 款产品中排名第 5（前 12%），因此性价比评级为优秀（4/5 星）。' },
        { title: '风险评估与建议', content: '主要风险点：1) 冲动消费信号——深夜时段 + 近期直播带货，情绪占比约 35%；2) 时机风险——该商品近 3 个月价格在 ¥2,099-2,499 之间波动，当前非最低点。但考虑到你的刚需评分较高（72/100）且性价比优秀，综合建议为"建议购买"。如果你不急于使用，建议关注下次促销（预计 2 周内）。' }
      ],
      alternatives: [
        { name: 'Bose QC45', price: 1899, reason: '降噪能力接近，价格更低，适合预算敏感用户', score: 85 },
        { name: 'Edifier W820NC', price: 499, reason: '入门级降噪耳机，满足基础通勤需求', score: 62 }
      ],
      image: 'assets/product-sony-xm5.jpg'
    },

    // ---------- 手机模板 (iPhone 16) ----------
    phone: {
      conclusion: {
        text: '建议购买',
        confidence: 82,
        summary: '性能强劲、生态完善，适合长期使用的投资型消费'
      },
      needIndex: {
        score: 85,
        bullets: [
          {
            text: '作为日常主力手机，使用频率极高，属于高频刚需品',
            detail: '手机是现代人最高频使用的电子设备，平均每天解锁 100+ 次，使用时长 5-7 小时。作为主力机，其性能、续航、相机质量直接影响日常生活质量。考虑到你当前的设备已使用 3 年以上，电池健康度下降明显，更换的必要性较高。'
          },
          {
            text: '当前手机电池健康度低于 80%，已影响正常使用体验',
            detail: '电池健康度低于 80% 意味着续航明显缩短，中重度使用可能需要一天两充。同时旧设备的系统流畅度和应用兼容性也在持续下降。这不是"想要"而是"需要"更换的阶段。'
          },
          {
            text: 'iOS 生态锁定效应显著，切换成本高',
            detail: '你已使用 iPhone 5 年以上，iCloud 同步、App Store 购买、AirDrop 等生态功能形成了较高的切换成本。继续选择 iPhone 是理性决策，而非品牌惯性。'
          }
        ]
      },
      valueRating: {
        stars: 3.5,
        label: '良好',
        currentPrice: 5999,
        marketAvg: 5500,
        marketMin: 1500,
        marketMax: 9999,
        summary: '定价 ¥5,999，高于同存储容量安卓旗舰均价 ¥4,500。但考虑 iOS 生态溢价和 5-6 年使用寿命，年均成本约 ¥1,000-1,200，属于可接受范围。'
      },
      impulseWarning: {
        level: 15,
        label: '低',
        color: '#00D4AA',
        warning: '购买动机理性，你的当前设备已使用超过 3 年，属于正常更换周期。未检测到冲动消费信号。',
        factors: [
          { text: '设备使用超过 3 年', type: 'green' },
          { text: '购买前有充分比较', type: 'green' },
          { text: '非首发购买，已避开溢价期', type: 'green' }
        ]
      },
      decisionFactors: [
        { text: '当前设备老化严重，更换刚需明确', type: 'green' },
        { text: 'iOS 生态切换成本高，继续选择合理', type: 'green' },
        { text: '绝对价格偏高，但长期使用成本合理', type: 'yellow' },
        { text: 'Pro Max 版本对你来说可能性能过剩', type: 'yellow' }
      ],
      reasoning: [
        { title: '需求紧迫性分析', content: '评估手机更换需求的三个关键指标：1) 使用时长（3 年+，已超过平均更换周期 2.5 年）；2) 电池健康度（<80%，已影响日常使用）；3) 性能瓶颈（旧设备运行最新系统卡顿明显）。三项指标均显示更换紧迫性较高，刚需指数 85/100。' },
        { title: '价格与价值评估', content: 'iPhone 16 定价 ¥5,999 在智能手机市场中处于高端区间。对比同价位安卓旗舰（小米 14 Pro ¥4,999、三星 S24 ¥5,499），苹果在绝对性能上并非最优，但考虑三个隐性价值：1) iOS 生态一致性；2) 5-6 年系统更新支持；3) 二手残值率（iPhone 二手保值率约 45%，安卓约 25%）。调整后的年均使用成本反而与中端安卓持平。' },
        { title: '综合建议', content: '基于你的使用场景（主力机 + 3 年以上更换周期），iPhone 16 是合理的投资型消费。建议：如果预算允许，优先选择 256GB 版本（避免存储焦虑）；如果对拍照要求不高，标准版 iPhone 16 已完全够用，不必加价上 Pro。' }
      ],
      alternatives: [
        { name: 'iPhone 15', price: 4599, reason: '上一代旗舰，性能差距极小，性价比更高', score: 88 },
        { name: '小米 14 Pro', price: 4999, reason: '安卓旗舰，同价位性能更强，适合预算敏感用户', score: 80 }
      ],
      image: 'assets/product-generic.jpg'
    },

    // ---------- 跑鞋模板 (Nike Pegasus 41) ----------
    shoes: {
      conclusion: {
        text: '建议观望',
        confidence: 71,
        summary: '性能优秀但当前非最佳购买时机，建议等待促销或考虑上一代'
      },
      needIndex: {
        score: 58,
        bullets: [
          {
            text: '你已有两双跑鞋在正常使用中，新增一双的必要性偏低',
            detail: '对于普通跑步爱好者（每周 3-4 次），两双跑鞋轮换已足够。第三双跑鞋的边际效用递减明显——除非其中一双即将报废（使用寿命约 500-800 公里），否则新增属于"改善型"而非"刚需型"消费。'
          },
          {
            text: '当前跑鞋库存充足，无紧急更换需求',
            detail: '你提到当前两双跑鞋分别使用了约 200km 和 350km，均处于正常使用寿命中段（Pegasus 系列一般可跑 600-800km）。没有紧迫的更换需求，属于"看到新品想升级"而非"不得不换"。'
          },
          {
            text: '跑步频率稳定，但无明确的赛事训练目标',
            detail: '如果你正在备赛或有明确的训练计划，高性能跑鞋的必要性会提升。但当前你的跑步主要是日常健身，现有跑鞋已完全满足需求。刚需指数因此较低。'
          }
        ]
      },
      valueRating: {
        stars: 4.5,
        label: '优秀',
        currentPrice: 899,
        marketAvg: 850,
        marketMin: 299,
        marketMax: 1699,
        summary: '定价 ¥899，处于同级别跑鞋均价（¥850）附近。Nike Pegasus 系列口碑稳定、耐用性出色，长期性价比在万元以下跑鞋中属于第一梯队。'
      },
      impulseWarning: {
        level: 65,
        label: '较高',
        color: '#FF6B6B',
        warning: '冲动预警：较高。检测到多个冲动消费信号——刚刚浏览了跑鞋推荐内容，且该商品为新配色首发。情绪占比约 65%，强烈建议冷静 24 小时后再决定。',
        factors: [
          { text: '刚刚浏览了跑鞋种草内容', type: 'red' },
          { text: '新配色首发营销刺激', type: 'red' },
          { text: '当前跑鞋无需更换', type: 'red' }
        ]
      },
      decisionFactors: [
        { text: '现有跑鞋状态良好，无更换刚需', type: 'red' },
        { text: 'Pegasus 41 系列性价比确实优秀', type: 'green' },
        { text: '新品首发价格，非最优入手时机', type: 'yellow' },
        { text: '冲动消费风险较高（65%）', type: 'red' }
      ],
      reasoning: [
        { title: '需求真实性检验', content: 'BWT 对你的购买动机进行了三层检验：1) 客观需求评估——现有跑鞋均未达到报废里程，使用寿命剩余 50-70%；2) 使用场景匹配——日常健身跑步，现有跑鞋完全满足；3) 消费动机分析——购买触发点为"浏览种草内容"而非"跑鞋损坏/性能不足"。结论：此次购买需求偏向"想要"而非"需要"，刚需指数 58/100。' },
        { title: '价格时机分析', content: 'Nike Pegasus 41 当前定价 ¥899 为首发价。参考历史价格走势：Pegasus 40 首发后 3 个月降至 ¥699-749，6 个月后稳定在 ¥599-649。如果你决定购买，建议等待 2-3 个月后的自然降价，可节省约 25-30%。' },
        { title: '最终建议', content: '综合刚需指数（58/100，偏低）和冲动预警（65%，较高），BWT 建议观望。具体建议：1) 将该商品加入收藏夹，设定价格提醒（目标价 ¥699）；2) 等待 24 小时冷静期后再做决定；3) 如果冷静后仍想买，建议选择上一代 Pegasus 40（当前约 ¥599），性价比更优。' }
      ],
      alternatives: [
        { name: 'Nike Pegasus 40', price: 599, reason: '上一代旗舰，性能差距极小，价格低 33%', score: 92 },
        { name: 'Adidas Ultra Boost Light', price: 799, reason: '同级别竞品， Boost 中底脚感更软', score: 78 }
      ],
      image: 'assets/product-generic.jpg'
    },

    // ---------- 投影仪模板 (当贝 X5) ----------
    projector: {
      conclusion: {
        text: '建议观望',
        confidence: 75,
        summary: '画质表现优秀，但价格偏高且使用频率可能较低，建议明确使用场景后再决定'
      },
      needIndex: {
        score: 65,
        bullets: [
          {
            text: '如果你主要在卧室或客厅使用，投影仪可以提升观影体验',
            detail: '投影仪的核心价值在于"大屏沉浸感"。100 英寸以上的投影画面是电视难以实现的。如果你每周有 3 次以上的观影需求（电影、综艺、游戏），投影仪的刚需性较高。但如果你只是偶尔看看手机投屏，使用频率不足以支撑这个投资。'
          },
          {
            text: '便携性是双刃剑：方便移动但也意味着你不会固定使用',
            detail: '当贝 X5 属于便携智能投影，重量约 2.5kg，可以轻松在不同房间移动。但"可移动"往往意味着"不固定"——你可能今天在卧室看，明天在客厅看，后天就忘了它。固定安装的投影仪使用频率通常比便携式高出 3-5 倍。'
          },
          {
            text: '亮度和分辨率参数优秀，但实际效果受环境光影响很大',
            detail: '当贝 X5 标称亮度 2500 CVIA 流明，分辨率 1080P，参数在同价位中属于中上水平。但投影仪的实际画质受环境光影响极大——在白天不拉窗帘的客厅，画面会明显发白发灰。如果你没有良好的遮光条件，实际体验可能不如同价位的 65 英寸电视。'
          }
        ]
      },
      valueRating: {
        stars: 4,
        label: '良好',
        currentPrice: 3999,
        marketAvg: 3500,
        marketMin: 999,
        marketMax: 8999,
        summary: '定价 ¥3,999，高于同类均价 ¥3,500 约 14%。但考虑到 2500 CVIA 流明亮度和智能系统配置，在 ¥3,000-5,000 区间性价比较为合理。'
      },
      impulseWarning: {
        level: 50,
        label: '中等',
        color: '#FFB84D',
        warning: '冲动预警：中等。投影仪属于"改善型"消费，非生活必需品。建议确认每周观影频率超过 3 次后再做决定。',
        factors: [
          { text: '非生活必需品', type: 'yellow' },
          { text: '使用频率可能低于预期', type: 'yellow' },
          { text: '同价位电视可能更实用', type: 'green' }
        ]
      },
      decisionFactors: [
        { text: '100 寸以上大屏体验是核心优势', type: 'green' },
        { text: '使用频率是决定性因素', type: 'yellow' },
        { text: '环境光条件需提前确认', type: 'yellow' },
        { text: '价格略高于同类均价', type: 'red' }
      ],
      reasoning: [
        { title: '需求真实性评估', content: '投影仪属于典型的"体验升级型"消费，而非"生活必需型"。评估的核心问题是：你的观影频率是否足够高？如果你每周看电影/剧超过 3 次，或者有游戏大屏需求，投影仪的刚需指数较高。但如果只是"偶尔想看看大屏"，实际使用频率往往远低于购买时的预期。' },
        { title: '价格与竞品分析', content: '当贝 X5 定价 ¥3,999，在便携智能投影品类中处于中高端区间。对比同价位产品：极米 H6（¥3,799，亮度略低但品牌生态更强）、坚果 N1S Pro（¥4,299，亮度更高但体积更大）。X5 的核心优势是 2500 CVIA 流明亮度和当贝 OS 智能系统，在同价位中属于均衡之选。' },
        { title: '最终建议', content: '投影仪的关键在于"你真的会经常用吗？"BWT 建议：先尝试用手机/平板投屏到电视 2 周，记录每周实际观影次数。如果超过 3 次，X5 是值得入手的；如果少于 2 次，建议把钱花在更实用的消费上。综合刚需指数 65/100 和冲动预警 50/100，建议观望。' }
      ],
      alternatives: [
        { name: '极米 H6', price: 3799, reason: '品牌口碑更好，智能系统更成熟', score: 82 },
        { name: '小米投影仪 6', price: 2499, reason: '入门级选择，亮度较低但价格友好', score: 70 }
      ],
      image: 'assets/product-generic.jpg'
    },

    // ---------- 小家电模板 (空气炸锅) ----------
    appliance: {
      conclusion: {
        text: '不建议购买',
        confidence: 80,
        summary: '你已有类似功能设备，且使用频率预期较低，建议充分利用现有设备'
      },
      needIndex: {
        score: 42,
        bullets: [
          {
            text: '你已有烤箱和微波炉，空气炸锅的功能可被替代',
            detail: '空气炸锅的核心功能——快速加热、表面酥脆——可以通过烤箱的"热风循环"模式 + 预热来实现。你已有的烤箱如果支持热风功能，可以覆盖空气炸锅 80% 的使用场景。微波炉可以覆盖快速加热的需求。'
          },
          {
            text: '空气炸锅的"网红"属性远大于实际使用价值',
            detail: '社交媒体上空气炸锅的"万物皆可炸"视频让很多人冲动购买。但实际使用中，大多数人每周使用不超过 2 次，且主要只做薯条、鸡翅等少数菜品。3 个月后，很多空气炸锅成为厨房角落的"落灰神器"。'
          },
          {
            text: '容量选择需要考虑家庭人数和使用场景',
            detail: '如果只是 1-2 人使用，小容量（3-4L）足够，但使用场景非常有限。如果需要做全家份的菜，大容量（6L+）体积又太大，不如直接用烤箱。容量选择的两难也是很多人使用频率低的原因。'
          }
        ]
      },
      valueRating: {
        stars: 3,
        label: '一般',
        currentPrice: 599,
        marketAvg: 450,
        marketMin: 199,
        marketMax: 1299,
        summary: '定价 ¥599，高于同类均价 ¥450 约 33%。小家电品类的溢价往往来自品牌和外观设计，核心功能差异不大。'
      },
      impulseWarning: {
        level: 68,
        label: '较高',
        color: '#FF6B6B',
        warning: '冲动预警：较高。空气炸锅属于典型的"种草驱动型"消费，社交媒体曝光度极高。建议冷静 48 小时后再决定。',
        factors: [
          { text: '社交媒体种草驱动', type: 'red' },
          { text: '已有类似功能设备', type: 'red' },
          { text: '价格高于同类均价', type: 'yellow' }
        ]
      },
      decisionFactors: [
        { text: '已有烤箱可替代大部分功能', type: 'red' },
        { text: '使用频率预期极低', type: 'red' },
        { text: '价格偏高，非最低性价比选择', type: 'yellow' },
        { text: '如果确实喜欢烘焙，可考虑', type: 'green' }
      ],
      reasoning: [
        { title: '功能替代性分析', content: '你已有的烤箱（支持热风循环）和微波炉可以覆盖空气炸锅的核心功能：快速加热和表面酥脆。空气炸锅相比烤箱的唯一优势是"体积小、预热快"，但这个优势在你的使用场景下并不显著——你不是每天都炸薯条的人。' },
        { title: '消费动机分析', content: '空气炸锅的高销量主要来源于社交媒体营销，而非真实的消费需求。统计数据显示：空气炸锅的平均周使用频率为 1.2 次，3 个月后的闲置率高达 47%。你的购买动机可能更多是"看到别人做美食视频很心动"而非"我确实需要这个工具"。' },
        { title: '最终建议', content: 'BWT 综合评估：刚需指数仅 42/100（有替代设备 + 使用场景有限），冲动预警高达 68/100（社交媒体种草驱动）。结论：不建议购买。建议充分利用现有烤箱，如果想尝试空气炸锅食谱，可以先借朋友的用一两周，确认使用频率后再考虑。' }
      ],
      alternatives: [
        { name: '苏泊尔空气炸锅', price: 299, reason: '入门级选择，核心功能相同', score: 55 },
        { name: '烤箱食谱书', price: 49, reason: '用现有烤箱解锁更多场景', score: 88 }
      ],
      image: 'assets/product-generic.jpg'
    }
  };

  /* ========== Loading Steps Per Category ========== */
  var LOADING_STEPS = {
    headphones: [
      '正在解析商品信息...',
      '正在检索同类耳机...',
      '正在分析降噪性能与音质...',
      '正在评估性价比与市场定位...',
      '正在生成决策报告...'
    ],
    phone: [
      '正在解析商品信息...',
      '正在检索同类手机...',
      '正在分析性能参数与续航...',
      '正在评估性价比与生态价值...',
      '正在生成决策报告...'
    ],
    shoes: [
      '正在解析商品信息...',
      '正在检索同类跑鞋...',
      '正在分析缓震与支撑性能...',
      '正在评估耐用性与性价比...',
      '正在生成决策报告...'
    ],
    projector: [
      '正在解析商品信息...',
      '正在检索同类投影仪...',
      '正在分析亮度与分辨率...',
      '正在评估环境光适配性与性价比...',
      '正在生成决策报告...'
    ],
    appliance: [
      '正在解析商品信息...',
      '正在检索同类小家电...',
      '正在分析功能覆盖与替代性...',
      '正在评估使用频率预期...',
      '正在生成决策报告...'
    ]
  };

  /* ========== Comparison Products Data ========== */
  var COMPARISON_PRODUCTS = [
    { name: 'Sony XM5', fullName: 'Sony WH-1000XM5', price: 2299, category: '耳机', image: 'assets/product-sony-xm5.jpg', winner: true },
    { name: 'Bose QC45', fullName: 'Bose QuietComfort 45', price: 1899, category: '耳机', image: 'assets/product-bose-qc45.jpg', winner: false },
    { name: 'AirPods Max', fullName: 'Apple AirPods Max', price: 4399, category: '耳机', image: 'assets/product-airpods-max.jpg', winner: false }
  ];

  var COMPARISON_DIMENSIONS = ['音质', '降噪', '续航', '佩戴舒适度', '性价比'];

  var COMPARISON_SCORES = {
    'Sony XM5': [88, 95, 82, 90, 92],
    'Bose QC45': [85, 88, 85, 92, 78],
    'AirPods Max': [90, 82, 78, 80, 55]
  };

  /* ========== Public Methods ========== */
  BWTStore.matchTemplate = function (category) {
    var key = matchCategory(category);
    return TEMPLATES[key] || TEMPLATES.headphones;
  };

  BWTStore.getLoadingSteps = function (category) {
    var key = matchCategory(category);
    return LOADING_STEPS[key] || LOADING_STEPS.headphones;
  };

  BWTStore.getComparisonData = function () {
    return {
      products: COMPARISON_PRODUCTS,
      dimensions: COMPARISON_DIMENSIONS,
      scores: COMPARISON_SCORES
    };
  };

  BWTStore.saveAnalysisInput = function (inputData) {
    var template = this.matchTemplate(inputData.category);
    var analysis = {
      productName: inputData.productName || '未知商品',
      category: inputData.category || '耳机',
      price: inputData.price || 0,
      scenario: inputData.scenario || '',
      budgetRange: inputData.budgetRange || '',
      source: inputData.source || 'manual',
      result: template
    };
    this.set('currentAnalysis', analysis);
    return analysis;
  };

  BWTStore.getCurrentUser = function () {
    return this.get('currentUser') || {
      name: '未登录',
      avatar: null,
      isLogged: false
    };
  };

  BWTStore.loginUser = function (userData) {
    this.set('currentUser', {
      name: userData.name || 'BWT 用户',
      avatar: userData.avatar || null,
      isLogged: true
    });
  };

  BWTStore.logoutUser = function () {
    this.remove('currentUser');
  };

  /* ========== Expose Globally ========== */
  window.BWTStore = BWTStore;

})();
