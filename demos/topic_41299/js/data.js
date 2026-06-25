    // ===== 1. 数据层 =====
    const STORAGE_KEY = 'oc_garden_data_v1';

    const Store = {
      get() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (e) {
          console.error('读取数据失败:', e);
          return null;
        }
      },
      set(data) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return true;
        } catch (e) {
          console.error('保存数据失败:', e);
          return false;
        }
      },
      clear() {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    // 默认 OC 数据结构
    function createDefaultOC(data = {}) {
      const now = Date.now();
      return {
        id: 'oc_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
        name: '',
        gender: '',
        age: '',
        race: '',
        worldview: '',
        catchphrase: '',
        avatar: '🌸',
        colors: ['#ff2e97', '#00f0ff', '#ffe600'],
        outfit: '',
        features: '',
        // 细分外观字段
        hairStyle: '',
        eyeColor: '',
        skinTone: '',
        height: '',
        bodyType: '',
        // 背景故事与能力设定
        background: '',
        occupation: '',
        abilities: '',
        likes: [],
        dislikes: [],
        // 图片字段
        portraitImage: '',
        avatarImage: '',
        portraitPrompt: '',
        gallery: [],              // 画廊图片数组：{ id, src, thumbnail, category, title, uploadedAt }
        mbti: '',
        personalityTags: [],
        relations: [],
        timeline: [],
        whispers: [],             // 碎碎念数组：{ id, content, mood, createdAt }
        chatHistory: [],
        copyright: {
          author: '',
          license: 'CC-BY',
          registeredAt: null,
          watermarkEnabled: true,
          watermarkText: '',
          disableDownload: true
        },
        adoptable: {
          isListed: false,          // 是否上架到领养市场
          type: 'free',             // 领养形式：'free'(无偿) | 'fixed'(一口价) | 'raffle'(抽奖)
          price: 0,                 // 一口价金额（type='fixed' 时有效）
          license: 'CC-BY',         // 领养授权条款
          description: '',          // 领养说明
          listedAt: null,           // 上架时间
          adoptedBy: null,          // 领养者名称
          adoptedAt: null,          // 领养时间
          originalCreator: '',      // 原创建者署名（领养副本中保留）
          isAdopted: false          // 是否已被领养
        },
        nurturing: {
          mood: 70,
          exp: 0,
          stage: '幼年',
          lastInteract: now,
          lastCheckIn: '',
          interactCount: 0
        },
        privacy: 'private',
        createdAt: now,
        updatedAt: now,
        ...data,
        nurturing: {
          mood: 70,
          exp: 0,
          stage: '幼年',
          lastInteract: now,
          lastCheckIn: '',
          interactCount: 0,
          ...(data.nurturing || {})
        },
        chatHistory: data.chatHistory || [],
        copyright: Object.assign(
          { author:'', license:'CC-BY', registeredAt:null, watermarkEnabled:true, watermarkText:'', disableDownload:true },
          data.copyright || {}
        ),
        adoptable: Object.assign(
          { isListed:false, type:'free', price:0, license:'CC-BY', description:'', listedAt:null, adoptedBy:null, adoptedAt:null, originalCreator:'', isAdopted:false },
          data.adoptable || {}
        )
      };
    }

    // 示例 OC 数据
    function getSampleOCs() {
      const now = Date.now();
      const id1 = 'oc_sample_hoshino';
      const id2 = 'oc_sample_kaen';
      const id3 = 'oc_sample_tsukimi';
      return [
        {
          id: id1,
          name: '星野绫',
          gender: '女',
          age: '17',
          race: '星灵族',
          worldview: '镜界·星海联邦',
          catchphrase: '今晚的月色，像融化的银。',
          avatar: '🌸',
          colors: ['#7c3aed', '#ff003c', '#00ff88'],
          outfit: '白色长袍，缀有星形饰品，腰间系银色丝带',
          features: '左眼下方有星形胎记，发尾渐变紫色，瞳孔中有星光闪烁',
          hairStyle: '银紫色长发及腰，发尾渐变紫色',
          eyeColor: '紫色，瞳孔中有星光闪烁',
          skinTone: '白皙透亮',
          height: '162cm',
          bodyType: '纤细',
          background: '出生于星海联邦边境的观星台，自幼能听见星辰的低语。父母是联邦的天文学家，在她觉醒星灵能力后送她进入星海学院进修。性格内向温柔，常在夜晚独自观星写诗。',
          occupation: '星海学院学生',
          abilities: '星灵能力（操控星光、预知梦境）',
          likes: ['观星', '诗歌', '银色饰品', '夜晚'],
          dislikes: ['嘈杂', '暴力', '清晨'],
          portraitImage: '',
          avatarImage: '',
          portraitPrompt: '',
          mbti: 'INFP',
          personalityTags: ['温柔', '内向', '浪漫', '理想主义', '诗意'],
          relations: [
            { targetId: id2, type: '朋友', desc: '青梅竹马，虽然性格迥异却彼此信任' }
          ],
          timeline: [
            { date: '星历3042年', event: '出生于星海联邦边境的观星台' },
            { date: '星历3052年', event: '与赤焰凯相遇，结为玩伴' },
            { date: '星历3059年', event: '觉醒星灵能力，能听见星辰的低语' },
            { date: '星历3060年', event: '进入星海学院进修' }
          ],
          nurturing: {
            mood: 85,
            exp: 180,
            stage: '少年',
            lastInteract: now - 3600000,
            lastCheckIn: '',
            interactCount: 12
          },
          privacy: 'public',
          createdAt: now - 86400000 * 30,
          updatedAt: now - 3600000
        },
        {
          id: id2,
          name: '赤焰凯',
          gender: '男',
          age: '18',
          race: '龙族',
          worldview: '镜界·星海联邦',
          catchphrase: '火焰不会熄灭，只会更烈！',
          avatar: '🔥',
          colors: ['#ff003c', '#ffe600', '#0d0221'],
          outfit: '黑色战甲，肩部有龙形纹饰，披风如燃烧的火焰',
          features: '右臂有龙鳞纹路，眼睛是琥珀色，发色如烈焰',
          hairStyle: '烈焰红色短发，向后梳起',
          eyeColor: '琥珀色',
          skinTone: '小麦色',
          height: '185cm',
          bodyType: '健壮',
          background: '出生于龙族火山部落，自幼接受严酷的战斗训练。部落迁徙至星海联邦后遇见星野绫，成为她的守护者。性格热血冲动，但极重义气，对认定的人会拼死保护。',
          occupation: '龙族战士',
          abilities: '龙息（火焰吐息）、龙鳞硬化、超强体能',
          likes: ['战斗', '烤肉', '高海拔', '挑战强者'],
          dislikes: ['欺骗', '胆怯', '寒冷', '等待'],
          portraitImage: '',
          avatarImage: '',
          portraitPrompt: '',
          mbti: 'ESTP',
          personalityTags: ['热血', '冲动', '直率', '勇敢', '护短'],
          relations: [
            { targetId: id1, type: '朋友', desc: '青梅竹马，默默守护着星野绫' },
            { targetId: id3, type: '敌对', desc: '理念不合，多次交锋' }
          ],
          timeline: [
            { date: '星历3041年', event: '出生于龙族火山部落' },
            { date: '星历3052年', event: '部落迁徙至星海联邦，遇见星野绫' },
            { date: '星历3058年', event: '完成龙族成年礼，获得战甲' },
            { date: '星历3060年', event: '与月见夜首次交锋' }
          ],
          nurturing: {
            mood: 65,
            exp: 320,
            stage: '成年',
            lastInteract: now - 7200000,
            lastCheckIn: '',
            interactCount: 25
          },
          privacy: 'public',
          createdAt: now - 86400000 * 45,
          updatedAt: now - 7200000
        },
        {
          id: id3,
          name: '月见夜',
          gender: '女',
          age: '20',
          race: '暗精灵',
          worldview: '镜界·星海联邦',
          catchphrase: '黑夜从不撒谎。',
          avatar: '🌙',
          colors: ['#00d4ff', '#0d0221', '#ff2e97'],
          outfit: '深紫色斗篷，遮蔽半张脸，手持银色短刃',
          features: '肤色苍白，耳朵尖长，瞳孔如紫色深渊',
          hairStyle: '银白色长发，常以斗篷遮掩',
          eyeColor: '深紫色',
          skinTone: '苍白',
          height: '170cm',
          bodyType: '纤瘦',
          background: '出生于暗精灵隐村，自幼学习暗影术与情报收集。因不满隐村的封闭传统而离开，独自游历星海联邦。理性冷静，认为赤焰凯的冲动会带来灾难，多次与之交锋。',
          occupation: '游侠 / 情报商',
          abilities: '暗影潜行、暗杀术、情报网络',
          likes: ['独处', '真相', '银色月光', '古籍'],
          dislikes: ['谎言', '喧闹', '被束缚', '强光'],
          portraitImage: '',
          avatarImage: '',
          portraitPrompt: '',
          mbti: 'INTJ',
          personalityTags: ['神秘', '冷静', '理性', '孤僻', '洞察'],
          relations: [
            { targetId: id2, type: '敌对', desc: '认为赤焰凯的冲动是危险的' }
          ],
          timeline: [
            { date: '星历3039年', event: '出生于暗精灵隐村' },
            { date: '星历3055年', event: '离开隐村，独自游历' },
            { date: '星历3060年', event: '与赤焰凯因理念冲突而对立' }
          ],
          nurturing: {
            mood: 50,
            exp: 95,
            stage: '幼年',
            lastInteract: now - 86400000,
            lastCheckIn: '',
            interactCount: 5
          },
          privacy: 'followers',
          createdAt: now - 86400000 * 15,
          updatedAt: now - 86400000
        }
      ];
    }

    // 成就定义
    const ACHIEVEMENTS = {
      first_oc: { icon: '🌱', name: '初芽', desc: '创建第一个 OC' },
      three_oc: { icon: '🌸', name: '小花园', desc: '拥有 3 个 OC' },
      first_interact: { icon: '💫', name: '初次互动', desc: '第一次与 OC 互动' },
      checkin_3days: { icon: '⭐', name: '坚持陪伴', desc: '连续 3 天签到' },
      grow_up: { icon: '💎', name: '成长见证', desc: '见证 OC 长大成人' },
      ten_interacts: { icon: '🎯', name: '热心园丁', desc: '累计互动 10 次' }
    };
