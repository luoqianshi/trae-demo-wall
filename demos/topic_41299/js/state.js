    // ===== 2. 状态管理 =====
    const state = {
      ocs: [],
      achievements: [],
      stats: { totalInteractions: 0 },
      commissions: [],
      artists: [],
      copyrightSettings: {
        defaultWatermark: true,
        defaultDisableDownload: true,
        defaultLicense: 'CC-BY',
        defaultAuthor: ''
      },
      // 社区数据
      topics: [],           // 话题列表
      comments: [],         // 所有评论（按 targetType+targetId 关联）
      userLikes: [],        // 用户点赞记录（如 'topic_xxx'、'oc_xxx'）
      userFavorites: [],    // 用户收藏记录
      userAdoptions: [],    // 用户领养的 OC 记录列表，每项：{ ocId, originalOcId, adoptedAt, originalCreator, license, adoptionType, price }
      events: [],           // 活动赛事列表
      eventParticipations: [], // 活动参与记录
      adoptMarket: [],      // 领养市场列表（其他用户上架的可领养 OC）
      currentRoute: '#/garden',
      currentOCId: null,
      currentTab: 'basic',
      currentCommissionTab: 'commissions',
      currentCommunityFilter: 'all',  // 话题分类筛选
      currentCommunitySort: 'latest', // 话题排序
      currentCommunityTab: 'topics',  // 社区 Tab（topics/events）
      currentAdoptFilter: 'all',      // 领养市场筛选（all/free/fixed/raffle/mine）
      // 幻象广场数据
      plazaPosts: [],                 // 广场帖子列表（OC 自主发帖）
      plazaDialogs: [],               // OC 间私聊对话记录
      plazaStats: { totalPosts: 0, totalDialogs: 0, activeOCs: 0 },
      currentPlazaView: 'god',        // 广场视图（god/posts/dialogs）
      plazaAutoRun: false,            // 是否自动演化
      plazaRunning: false             // 是否正在执行一轮交流（防重入，不持久化）
    };

    function loadState() {
      const data = Store.get();
      if (data) {
        // 兼容旧数据：补充 OC 的 copyright 字段
        state.ocs = (data.ocs || []).map(oc => {
          if (!oc.copyright) {
            oc.copyright = { author:'', license:'CC-BY', registeredAt:null, watermarkEnabled:true, watermarkText:'', disableDownload:true };
          }
          if (!oc.relations) {
            oc.relations = [];
          }
          if (!oc.gallery) {
            oc.gallery = [];
          }
          if (!oc.whispers) {
            oc.whispers = [];
          }
          return oc;
        });
        state.achievements = data.achievements || [];
        state.stats = data.stats || { totalInteractions: 0 };
        state.commissions = data.commissions || [];
        state.artists = data.artists || [];
        state.copyrightSettings = Object.assign(
          { defaultWatermark:true, defaultDisableDownload:true, defaultLicense:'CC-BY', defaultAuthor:'' },
          data.copyrightSettings || {}
        );
        // 社区数据（含兼容处理）
        state.topics = data.topics || [];
        state.comments = data.comments || [];
        state.userLikes = data.userLikes || [];
        state.userFavorites = data.userFavorites || [];
        // 兼容旧数据：userAdoptions 可能是 ID 字符串数组，转换为对象数组
        state.userAdoptions = (data.userAdoptions || []).map(item => {
          if (typeof item === 'string') {
            return { ocId: item, originalOcId: null, adoptedAt: Date.now(), originalCreator: '未知', license: 'CC-BY', adoptionType: 'free', price: 0 };
          }
          return item;
        });
        state.events = data.events || [];
        state.eventParticipations = data.eventParticipations || [];
        state.adoptMarket = data.adoptMarket || [];
        // 幻象广场数据（含兼容默认值）
        state.plazaPosts = data.plazaPosts || [];
        state.plazaDialogs = data.plazaDialogs || [];
        state.plazaStats = Object.assign({ totalPosts: 0, totalDialogs: 0, activeOCs: 0 }, data.plazaStats || {});
        state.currentPlazaView = data.currentPlazaView || 'god';
        state.plazaAutoRun = data.plazaAutoRun || false;
        state.plazaRunning = false;  // 运行状态不持久化
      }
    }

    function saveState() {
      Store.set({
        ocs: state.ocs,
        achievements: state.achievements,
        stats: state.stats,
        commissions: state.commissions,
        artists: state.artists,
        copyrightSettings: state.copyrightSettings,
        topics: state.topics,
        comments: state.comments,
        userLikes: state.userLikes,
        userFavorites: state.userFavorites,
        userAdoptions: state.userAdoptions,
        events: state.events,
        eventParticipations: state.eventParticipations,
        adoptMarket: state.adoptMarket,
        plazaPosts: state.plazaPosts,
        plazaDialogs: state.plazaDialogs,
        plazaStats: state.plazaStats,
        currentPlazaView: state.currentPlazaView,
        plazaAutoRun: state.plazaAutoRun
      });
    }

    // 预设示例画师数据
    function getSampleArtists() {
      const now = Date.now();
      return [
        { id:'artist_sample_1', name:'星河画师', type:'画师', specialties:['二次元立绘','Q版头像'], priceRange:'50-300元', contact:'微博@星河画师', platform:'微博', rating:5, notes:'画风精致，出图速度快', isSample:true, createdAt:now },
        { id:'artist_sample_2', name:'墨言写手', type:'写手', specialties:['角色背景故事','世界观设定'], priceRange:'30-200元/千字', contact:'邮箱 moyan@example.com', platform:'米画师', rating:4, notes:'文笔细腻，擅长奇幻题材', isSample:true, createdAt:now },
        { id:'artist_sample_3', name:'岚风插画', type:'画师', specialties:['场景插画','人物立绘','CG'], priceRange:'200-1500元', contact:'QQ 123456789', platform:'半次元', rating:5, notes:'商业级品质，适合重要作品', isSample:true, createdAt:now },
        { id:'artist_sample_4', name:'青鸟文坊', type:'写手', specialties:['对话脚本','剧情设计'], priceRange:'50-500元', contact:'微信 qingniao_wx', platform:'微信', rating:4, notes:'对话自然，角色塑造到位', isSample:true, createdAt:now },
        { id:'artist_sample_5', name:'月华工坊', type:'两者', specialties:['立绘','人设文案'], priceRange:'100-800元', contact:'米画师@月华工坊', platform:'米画师', rating:5, notes:'画文双修，一站式服务', isSample:true, createdAt:now },
        { id:'artist_sample_6', name:'雪兔画铺', type:'画师', specialties:['萌系头像','表情包','Q版'], priceRange:'20-150元', contact:'微博@雪兔画铺', platform:'微博', rating:4, notes:'价格亲民，风格可爱', isSample:true, createdAt:now }
      ];
    }

    // 预设示例社区数据
    function getSampleCommunityData() {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const topics = [
        {
          id: 'topic_sample_1',
          title: '星海联邦世界观设定分享',
          content: '星海联邦是由三个星系组成的松散联盟，成立于银河历 2847 年。联邦内有人类、机械族、光翼族三大种族共存。\n\n核心设定：\n1. 政治体制：议会制，每颗有人居住的星球派代表参加\n2. 经济：以"星晶"为通用货币\n3. 科技：超光速跃迁技术由古代遗迹逆向工程而来\n4. 文化：鼓励种族交融，但保守派仍坚持纯血主义\n\n欢迎大家一起完善这个世界观！',
          author: '星河造梦师',
          authorAvatar: '🌌',
          category: 'worldview',
          tags: ['科幻', '星际', '联盟', '多种族'],
          relatedOCId: 'oc_sample_hoshino',
          likes: 42,
          comments: 8,
          createdAt: now - 5 * day,
          isSample: true
        },
        {
          id: 'topic_sample_2',
          title: '精灵族角色设计心得：如何让耳朵不违和',
          content: '画精灵族 OC 时，耳朵是最容易翻车的部分。分享几个我总结的技巧：\n\n1. 耳朵长度与脸型匹配：圆脸配短耳，瓜子脸配长耳\n2. 耳朵角度：向外倾斜 15-20 度最自然\n3. 颜色过渡：耳尖颜色比耳根略深，增加层次感\n4. 饰品点缀：耳环、链条能大幅提升精致度\n\n附上我家精灵 OC 的设计图，欢迎大家参考交流～',
          author: '岚风插画',
          authorAvatar: '🍃',
          category: 'race',
          tags: ['精灵族', '设计技巧', '耳朵', '画法'],
          relatedOCId: null,
          likes: 67,
          comments: 12,
          createdAt: now - 3 * day,
          isSample: true
        },
        {
          id: 'topic_sample_3',
          title: '立绘约稿避坑指南：从沟通到收稿全流程',
          content: '约稿三年踩过无数坑，整理出这份避坑指南：\n\n【约稿前】\n- 看画师过往作品，确认风格稳定\n- 明确用途（自用/商用）影响价格\n- 准备详细的人设文档\n\n【沟通中】\n- 一定要签合同或保留聊天记录\n- 分阶段确认：草稿→线稿→上色→成稿\n- 每个阶段都要截图确认\n\n【收稿后】\n- 检查分辨率（至少 300dpi）\n- 索要分层文件\n- 确认版权归属\n\n希望大家的约稿都顺利！',
          author: '月华工坊',
          authorAvatar: '🎨',
          category: 'creation',
          tags: ['约稿', '避坑', '立绘', '流程'],
          relatedOCId: null,
          likes: 89,
          comments: 23,
          createdAt: now - 2 * day,
          isSample: true
        },
        {
          id: 'topic_sample_4',
          title: '我家 OC 星野的成长日记',
          content: '从创建星野到现在已经半年了，记录一下她的成长轨迹：\n\n【幼年期】刚出生时只是个简单的银发少女设定，性格也很扁平\n\n【少年期】给她加了"失忆"的设定，性格变得神秘起来，开始有了自己的故事线\n\n【成年期】最近完成了完整的世界观融入，她现在是星海联邦的跃迁导航员，性格也变得开朗自信\n\n养成 OC 真的很有成就感，看着她一点点丰满起来～',
          author: '星河造梦师',
          authorAvatar: '🌌',
          category: 'showcase',
          tags: ['成长日记', 'OC展示', '养成'],
          relatedOCId: 'oc_sample_hoshino',
          likes: 35,
          comments: 6,
          createdAt: now - 1 * day,
          isSample: true
        },
        {
          id: 'topic_sample_5',
          title: '机械族设定讨论：他们有感情吗？',
          content: '在构建星海联邦世界观时遇到一个设定难题：机械族到底有没有感情？\n\n目前有两种思路：\nA. 完全无感情：纯逻辑驱动，但这样很难写出有趣的故事\nB. 模拟感情：通过算法模拟情绪反应，但本质还是数据\n\n我倾向于 B，但想听听大家的意见。你们的世界观里是怎么处理类似问题的？',
          author: '墨言写手',
          authorAvatar: '✒️',
          category: 'worldview',
          tags: ['机械族', '设定', '感情', '讨论'],
          relatedOCId: null,
          likes: 28,
          comments: 15,
          createdAt: now - 12 * 60 * 60 * 1000,
          isSample: true
        },
        {
          id: 'topic_sample_6',
          title: 'Q版头像绘制教程：5分钟学会萌系画法',
          content: '今天分享一个超简单的 Q 版头像画法：\n\n1. 头身比 1:1 或 1:1.5\n2. 眼睛占脸部 1/3，瞳孔大而亮\n3. 鼻子用一个小点代替\n4. 嘴巴简化为小三角或弧线\n5. 头发分组画，不要一根根画\n\n工具推荐：SAI 或 Procreate 都可以，新手建议先用铅笔工具起稿。',
          author: '雪兔画铺',
          authorAvatar: '🐰',
          category: 'creation',
          tags: ['Q版', '教程', '萌系', '头像'],
          relatedOCId: null,
          likes: 54,
          comments: 9,
          createdAt: now - 6 * 60 * 60 * 1000,
          isSample: true
        }
      ];

      const comments = [
        { id: 'comment_sample_1', targetType: 'topic', targetId: 'topic_sample_1', author: '墨言写手', authorAvatar: '✒️', content: '世界观设定很完整！想问一下星晶货币的设定有具体来源吗？', createdAt: now - 4 * day, isSample: true },
        { id: 'comment_sample_2', targetType: 'topic', targetId: 'topic_sample_1', author: '岚风插画', authorAvatar: '🍃', content: '多种族共存的世界观很棒，期待看到更多角色设计', createdAt: now - 3 * day, isSample: true },
        { id: 'comment_sample_3', targetType: 'topic', targetId: 'topic_sample_2', author: '雪兔画铺', authorAvatar: '🐰', content: '耳朵角度那个技巧太实用了！以前总是画得很僵硬', createdAt: now - 2 * day, isSample: true },
        { id: 'comment_sample_4', targetType: 'topic', targetId: 'topic_sample_3', author: '青鸟文坊', authorAvatar: '📝', content: '分阶段确认这点太重要了，我之前就是因为没确认草稿结果成稿完全不是想要的', createdAt: now - 1 * day, isSample: true },
        { id: 'comment_sample_5', targetType: 'topic', targetId: 'topic_sample_3', author: '星河造梦师', authorAvatar: '🌌', content: '收藏了！下次约稿一定按这个流程来', createdAt: now - 20 * 60 * 60 * 1000, isSample: true },
        { id: 'comment_sample_6', targetType: 'topic', targetId: 'topic_sample_4', author: '月华工坊', authorAvatar: '🎨', content: '看着 OC 成长真的很有成就感，养成系统的魅力就在这里', createdAt: now - 18 * 60 * 60 * 1000, isSample: true },
        { id: 'comment_sample_7', targetType: 'topic', targetId: 'topic_sample_5', author: '星河造梦师', authorAvatar: '🌌', content: '我选 B，模拟感情能写出更多戏剧冲突。可以设定"感情模块"出故障的剧情', createdAt: now - 10 * 60 * 60 * 1000, isSample: true },
        { id: 'comment_sample_8', targetType: 'topic', targetId: 'topic_sample_6', author: '岚风插画', authorAvatar: '🍃', content: '头身比那个建议很关键，新手最容易画成大头娃娃', createdAt: now - 5 * 60 * 60 * 1000, isSample: true }
      ];

      const events = [
        {
          id: 'event_sample_1',
          title: '第一届 OC 选美大赛',
          type: 'beauty',
          description: '展示你家最美的 OC，由社区投票选出前三名！获奖 OC 将获得"明星 OC"称号。提交截止后进入投票阶段。',
          status: 'ongoing',
          startDate: now - 2 * day,
          endDate: now + 5 * day,
          participants: 24,
          isSample: true
        },
        {
          id: 'event_sample_2',
          title: '星海联邦故事接龙',
          type: 'relay',
          description: '以星海联邦为背景，每人接龙 200-500 字，共同创作一个完整的星际冒险故事。接龙顺序按报名先后排列。',
          status: 'ongoing',
          startDate: now - 1 * day,
          endDate: now + 7 * day,
          participants: 8,
          isSample: true
        },
        {
          id: 'event_sample_3',
          title: '机械族设定挑战赛',
          type: 'challenge',
          description: '主题：设计一个有"感情缺陷"的机械族 OC。要求包含完整人设、背景故事和感情缺陷的具体表现。优秀作品将收录进世界观设定集。',
          status: 'upcoming',
          startDate: now + 3 * day,
          endDate: now + 10 * day,
          participants: 0,
          isSample: true
        },
        {
          id: 'event_sample_4',
          title: '春季萌系 OC 创作周',
          type: 'challenge',
          description: '以"春日花海"为主题创作萌系 OC，形式不限（立绘/Q版/文字）。本次活动已圆满结束，共收到 36 件作品。',
          status: 'ended',
          startDate: now - 30 * day,
          endDate: now - 16 * day,
          participants: 36,
          isSample: true
        }
      ];

      return { topics, comments, events };
    }

    // 预设示例领养市场数据
    function getSampleAdoptMarket() {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      return [
        {
          id: 'adopt_market_1',
          name: '小萤',
          avatar: '🧚',
          gender: '女', age: '16', race: '光妖',
          worldview: '萤火森林',
          background: '森林深处的光妖，尾巴上的萤光能照亮黑暗。性格温柔胆小，喜欢收集发光的小东西。',
          colors: ['#00ff88', '#00d4ff', '#F0F0FF'],
          creator: '岚风插画',
          creatorAvatar: '🍃',
          type: 'free',
          price: 0,
          license: 'CC-BY-NC',
          description: '希望领养后能给她画更多立绘～不要转卖',
          listedAt: now - 2 * day,
          isAdopted: false,
          isSample: true
        },
        {
          id: 'adopt_market_2',
          name: '赤狼',
          avatar: '🐺',
          gender: '男', age: '19', race: '兽人',
          worldview: '荒野边境',
          background: '荒野中的独狼战士，左眼有刀疤。沉默寡言但重情义，擅长双刀流。',
          colors: ['#dc2626', '#991b1b', '#fef2f2'],
          creator: '月华工坊',
          creatorAvatar: '🎨',
          type: 'fixed',
          price: 88,
          license: 'CC-BY',
          description: '一口价 88 元，含完整人设和线稿。可商用。',
          listedAt: now - 1 * day,
          isAdopted: false,
          isSample: true
        },
        {
          id: 'adopt_market_3',
          name: '星璃',
          avatar: '💎',
          gender: '无', age: '未知', race: '水晶族',
          worldview: '地脉深处',
          background: '由地脉水晶孕育而生的生命体，身体透明折射彩虹光芒。没有性别概念，通过共振交流。',
          colors: ['#00f0ff', '#7c3aed', '#F0F0FF'],
          creator: '星河造梦师',
          creatorAvatar: '🌌',
          type: 'raffle',
          price: 0,
          license: 'CC-BY-NC',
          description: '抽奖领养，参与即有机会。希望领养者能完善水晶族的世界观设定。',
          listedAt: now - 12 * 60 * 60 * 1000,
          isAdopted: false,
          isSample: true
        },
        {
          id: 'adopt_market_4',
          name: '茶茶',
          avatar: '🐱',
          gender: '女', age: '15', race: '猫又',
          worldview: '现代都市',
          background: '咖啡店打工的猫又少女，耳朵和尾巴会随心情变化。喜欢在午后的阳光下打盹。',
          colors: ['#ffe600', '#ff6bb5', '#F0F0FF'],
          creator: '雪兔画铺',
          creatorAvatar: '🐰',
          type: 'free',
          price: 0,
          license: 'CC-BY-NC',
          description: '无偿领养，希望领养后能多画日常向的图～',
          listedAt: now - 6 * 60 * 60 * 1000,
          isAdopted: false,
          isSample: true
        },
        {
          id: 'adopt_market_5',
          name: '苍穹',
          avatar: '⚔️',
          gender: '男', age: '25', race: '人类',
          worldview: '破灭纪元',
          background: '末世中的流浪剑客，背负着灭村之仇。左手是机械义肢，持有一把能斩断魔力的古剑。',
          colors: ['#0891b2', '#155e75', '#ecfeff'],
          creator: '岚风插画',
          creatorAvatar: '🍃',
          type: 'fixed',
          price: 168,
          license: '商用授权',
          description: '一口价 168 元，含完整人设、立绘和背景故事。允许商用。',
          listedAt: now - 3 * day,
          isAdopted: true,
          adoptedBy: '其他用户',
          adoptedAt: now - 1 * day,
          isSample: true
        }
      ];
    }
