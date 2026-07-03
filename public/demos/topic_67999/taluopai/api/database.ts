import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tarot.db')
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDatabase(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nameEn TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('major', 'minor')),
      suit TEXT CHECK(suit IN ('wands', 'cups', 'swords', 'pentacles')),
      number INTEGER NOT NULL,
      keywords TEXT NOT NULL,
      meaningUpright TEXT NOT NULL,
      meaningReversed TEXT NOT NULL,
      element TEXT,
      zodiac TEXT,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spreadType TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drawing_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drawingId INTEGER NOT NULL,
      cardId INTEGER NOT NULL,
      position INTEGER NOT NULL,
      isReversed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (drawingId) REFERENCES drawings(id) ON DELETE CASCADE,
      FOREIGN KEY (cardId) REFERENCES cards(id)
    );
  `)

  // Check if cards already seeded
  const count = database.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number }
  if (count.count > 0) return

  // Seed all 78 cards
  const insertCard = database.prepare(`
    INSERT INTO cards (name, nameEn, type, suit, number, keywords, meaningUpright, meaningReversed, element, zodiac, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const seedData: Array<{
    name: string; nameEn: string; type: 'major' | 'minor';
    suit?: string; number: number; keywords: string;
    meaningUpright: string; meaningReversed: string;
    element?: string; zodiac?: string; description: string;
  }> = [
    // ==================== Major Arcana (22 cards) ====================
    { name: '愚者', nameEn: 'The Fool', type: 'major', suit: undefined, number: 0, keywords: '开始, 冒险, 天真', meaningUpright: '新的开始, 自由精神, 无限可能', meaningReversed: '鲁莽, 冒险, 愚蠢', element: '风', zodiac: '天王星', description: '愚者代表着新的开始和无限的可能性。他站在悬崖边，怀揣着天真和勇气，准备踏上未知的旅程。这张牌象征着冒险精神、自由意志和对生命的信任。' },
    { name: '魔术师', nameEn: 'The Magician', type: 'major', suit: undefined, number: 1, keywords: '创造, 意志, 技能', meaningUpright: '创造力, 技能, 意志力', meaningReversed: '欺骗, 操纵, 能力不足', element: '风', zodiac: '水星', description: '魔术师象征着创造力、意志力和将想法转化为现实的能力。他拥有四元素作为工具，能够将潜力转化为行动，将梦想变为现实。' },
    { name: '女祭司', nameEn: 'The High Priestess', type: 'major', suit: undefined, number: 2, keywords: '直觉, 潜意识, 神秘', meaningUpright: '直觉, 智慧, 神秘', meaningReversed: '隐藏的秘密, 情感封闭', element: '水', zodiac: '月亮', description: '女祭司是直觉和潜意识的守护者。她坐在知识之门的前方，守护着深层的智慧和奥秘。这张牌鼓励我们倾听内心的声音，相信直觉的指引。' },
    { name: '皇后', nameEn: 'The Empress', type: 'major', suit: undefined, number: 3, keywords: '丰饶, 母性, 自然', meaningUpright: '丰收, 创造力, 母性', meaningReversed: '依赖, 创造力受阻', element: '土', zodiac: '金星', description: '皇后象征着丰饶、母性和自然的创造力。她代表着生命的孕育和滋养，是大地的母亲。这张牌预示着丰收、繁荣和感官的满足。' },
    { name: '皇帝', nameEn: 'The Emperor', type: 'major', suit: undefined, number: 4, keywords: '权威, 稳定, 领导力', meaningUpright: '权威, 秩序, 领导力', meaningReversed: '暴政, 失控, 专横', element: '火', zodiac: '白羊座', description: '皇帝代表着权威、秩序和稳定。他坐在王座上，掌控着世俗的权力。这张牌象征着领导力、纪律和建立稳固基础的能力。' },
    { name: '教皇', nameEn: 'The Hierophant', type: 'major', suit: undefined, number: 5, keywords: '传统, 信仰, 教育', meaningUpright: '传统智慧, 精神指引', meaningReversed: '墨守成规, 反叛', element: '土', zodiac: '金牛座', description: '教皇是传统、信仰和教育精神的象征。他代表着既定的制度、礼仪和传承的智慧。这张牌鼓励我们寻求精神指引，遵循传统价值观。' },
    { name: '恋人', nameEn: 'The Lovers', type: 'major', suit: undefined, number: 6, keywords: '爱情, 选择, 和谐', meaningUpright: '真爱, 和谐, 重要选择', meaningReversed: '分离, 不和谐, 错误选择', element: '风', zodiac: '双子座', description: '恋人代表着爱情、和谐和重要的选择。这张牌象征着深刻的情感连接和价值观的抉择。它提醒我们在爱中保持真诚，做出符合内心的选择。' },
    { name: '战车', nameEn: 'The Chariot', type: 'major', suit: undefined, number: 7, keywords: '胜利, 意志, 决心', meaningUpright: '胜利, 意志力, 前进', meaningReversed: '失控, 失败, 侵略', element: '水', zodiac: '巨蟹座', description: '战车象征着胜利、意志力和决心。它代表着通过坚强的意志驾驭对立的力量，勇往直前。这张牌预示着克服困难后的成功和前进的动力。' },
    { name: '力量', nameEn: 'Strength', type: 'major', suit: undefined, number: 8, keywords: '勇气, 耐心, 内在力量', meaningUpright: '内在力量, 勇气, 耐心', meaningReversed: '软弱, 自我怀疑, 恐惧', element: '火', zodiac: '狮子座', description: '力量代表着内在的勇气和耐心。它并非以暴制暴，而是用温柔和坚韧驯服内心的野兽。这张牌鼓励我们以爱心和耐心面对挑战。' },
    { name: '隐士', nameEn: 'The Hermit', type: 'major', suit: undefined, number: 9, keywords: '内省, 孤独, 指引', meaningUpright: '内省, 智慧, 独处', meaningReversed: '孤立, 孤独, 逃避', element: '土', zodiac: '处女座', description: '隐士象征着内省和寻求内在智慧。他手持灯笼，在黑暗中寻找真理。这张牌提醒我们需要独处的时间来反思和寻找内心的指引。' },
    { name: '命运之轮', nameEn: 'Wheel of Fortune', type: 'major', suit: undefined, number: 10, keywords: '命运, 转折, 循环', meaningUpright: '好运, 命运转折, 机遇', meaningReversed: '厄运, 阻碍, 轮回', element: '火', zodiac: '木星', description: '命运之轮代表着生命的循环和命运的转折。它象征着好运、机遇和不可预测的变化。这张牌提醒我们命运在转动，好运即将来临。' },
    { name: '正义', nameEn: 'Justice', type: 'major', suit: undefined, number: 11, keywords: '公正, 真相, 因果', meaningUpright: '公正, 真相, 平衡', meaningReversed: '不公, 偏见, 逃避责任', element: '风', zodiac: '天秤座', description: '正义象征着公正、真相和因果报应。她手持天平和宝剑，代表着客观的判断和公平的结果。这张牌提醒我们为自己的行为负责。' },
    { name: '倒吊人', nameEn: 'The Hanged Man', type: 'major', suit: undefined, number: 12, keywords: '牺牲, 暂停, 新视角', meaningUpright: '放手, 新视角, 牺牲', meaningReversed: '停滞, 固执, 无谓牺牲', element: '水', zodiac: '海王星', description: '倒吊人代表着暂停、牺牲和新的视角。他倒挂在树上，从不同的角度看待世界。这张牌鼓励我们放下执念，接受暂时的停顿，以获得新的领悟。' },
    { name: '死神', nameEn: 'Death', type: 'major', suit: undefined, number: 13, keywords: '结束, 转变, 重生', meaningUpright: '转变, 结束, 新生', meaningReversed: '抗拒改变, 停滞', element: '水', zodiac: '天蝎座', description: '死神并非字面意义上的死亡，而是象征着结束、转变和重生。旧的事物必须结束，新的才能开始。这张牌预示着深刻的变革和生命的更新。' },
    { name: '节制', nameEn: 'Temperance', type: 'major', suit: undefined, number: 14, keywords: '平衡, 耐心, 调和', meaningUpright: '平衡, 和谐, 耐心', meaningReversed: '失衡, 过度, 急躁', element: '火', zodiac: '射手座', description: '节制代表着平衡、耐心和调和。天使将两杯水混合，象征着对立元素的融合。这张牌鼓励我们寻找中庸之道，保持内心的平静与和谐。' },
    { name: '恶魔', nameEn: 'The Devil', type: 'major', suit: undefined, number: 15, keywords: '束缚, 欲望, 物质', meaningUpright: '束缚, 物质主义, 欲望', meaningReversed: '解脱, 觉醒, 摆脱', element: '土', zodiac: '摩羯座', description: '恶魔象征着物质世界的束缚和欲望的枷锁。它提醒我们注意那些限制我们自由的事物——无论是物质成瘾、不健康的关系还是负面的思维模式。' },
    { name: '高塔', nameEn: 'The Tower', type: 'major', suit: undefined, number: 16, keywords: '剧变, 崩溃, 启示', meaningUpright: '突然改变, 崩溃, 觉醒', meaningReversed: '逃避改变, 恐惧', element: '火', zodiac: '火星', description: '高塔代表着突然的剧变和崩溃。雷击高塔，旧的结构被摧毁。这张牌虽然看起来可怕，但它预示着虚假结构的崩塌和真相的揭示，是重建的前奏。' },
    { name: '星星', nameEn: 'The Star', type: 'major', suit: undefined, number: 17, keywords: '希望, 灵感, 宁静', meaningUpright: '希望, 灵感, 治愈', meaningReversed: '绝望, 失去信心', element: '风', zodiac: '水瓶座', description: '星星是希望和灵感的象征。在经历高塔的震荡后，星星带来了宁静与治愈。她倒出生命之水，滋养大地。这张牌预示着希望、信心和灵魂的安宁。' },
    { name: '月亮', nameEn: 'The Moon', type: 'major', suit: undefined, number: 18, keywords: '幻觉, 恐惧, 潜意识', meaningUpright: '直觉, 梦境, 潜意识', meaningReversed: '恐惧消散, 真相浮现', element: '水', zodiac: '双鱼座', description: '月亮象征着潜意识、梦境和幻觉。月光下，事物变得模糊不清。这张牌提醒我们面对内心的恐惧，穿越迷雾，辨别真伪。' },
    { name: '太阳', nameEn: 'The Sun', type: 'major', suit: undefined, number: 19, keywords: '快乐, 成功, 活力', meaningUpright: '快乐, 成功, 活力', meaningReversed: '暂时的挫折, 阴霾', element: '火', zodiac: '太阳', description: '太阳是塔罗牌中最积极正面的牌之一。它代表着快乐、成功和生命力。阳光普照，万物生长。这张牌预示着美好的时光、成就和纯粹的喜悦。' },
    { name: '审判', nameEn: 'Judgement', type: 'major', suit: undefined, number: 20, keywords: '重生, 觉醒, 召唤', meaningUpright: '觉醒, 重生, 召唤', meaningReversed: '自我怀疑, 拒绝召唤', element: '火', zodiac: '冥王星', description: '审判代表着觉醒、重生和来自更高层次的召唤。天使吹响号角，死者从坟墓中复活。这张牌象征着深刻的自我觉醒和生命的新阶段。' },
    { name: '世界', nameEn: 'The World', type: 'major', suit: undefined, number: 21, keywords: '完成, 圆满, 成就', meaningUpright: '完成, 圆满, 成就', meaningReversed: '未完成, 缺失, 延迟', element: '土', zodiac: '土星', description: '世界是大阿尔卡纳的最后一张牌，代表着完成、圆满和成就。舞者在花环中舞蹈，象征着宇宙的和谐与完整。这张牌预示着目标的达成和生命的圆满。' },

    // ==================== Wands (权杖) - 火元素 ====================
    { name: '权杖王牌', nameEn: 'Ace of Wands', type: 'minor', suit: 'wands', number: 1, keywords: '创意, 灵感, 新开始', meaningUpright: '新的创意, 灵感迸发, 新开始', meaningReversed: '延误, 缺乏动力, 创意枯竭', element: '火', description: '权杖王牌代表着新的创意和灵感的迸发。一只手从云中伸出，握着发芽的权杖，象征着创造力的萌发和无限潜力。' },
    { name: '权杖二', nameEn: 'Two of Wands', type: 'minor', suit: 'wands', number: 2, keywords: '规划, 未来展望, 决策', meaningUpright: '规划未来, 做出决策, 扩大视野', meaningReversed: '犹豫不决, 计划受阻, 缺乏远见', element: '火', description: '权杖二代表着规划和决策。一个人站在城堡高处，手持地球仪，思考着未来的方向。这张牌鼓励我们制定计划，勇敢迈出下一步。' },
    { name: '权杖三', nameEn: 'Three of Wands', type: 'minor', suit: 'wands', number: 3, keywords: '扩张, 远见, 合作', meaningUpright: '事业扩张, 远见卓识, 成功在望', meaningReversed: '挫折, 延误, 计划失败', element: '火', description: '权杖三代表着扩张和远见。一个人站在悬崖边，眺望着远方的船只。这张牌预示着计划正在顺利进行，成功即将到来。' },
    { name: '权杖四', nameEn: 'Four of Wands', type: 'minor', suit: 'wands', number: 4, keywords: '庆祝, 稳定, 和谐', meaningUpright: '庆祝, 稳定基础, 和谐家园', meaningReversed: '不稳定, 缺乏支持, 庆祝延迟', element: '火', description: '权杖四代表着庆祝和稳定。四根权杖支撑着花环，人们在其中欢庆。这张牌预示着一个阶段的完成和值得庆祝的时刻。' },
    { name: '权杖五', nameEn: 'Five of Wands', type: 'minor', suit: 'wands', number: 5, keywords: '竞争, 冲突, 挑战', meaningUpright: '良性竞争, 挑战, 多样性', meaningReversed: '恶性竞争, 冲突升级, 争吵', element: '火', description: '权杖五代表着竞争和冲突。五个人手持权杖互相较量。这张牌暗示着竞争和挑战，但也提醒我们竞争中可以有成长的机会。' },
    { name: '权杖六', nameEn: 'Six of Wands', type: 'minor', suit: 'wands', number: 6, keywords: '胜利, 认可, 成功', meaningUpright: '胜利, 公众认可, 自信', meaningReversed: '失败, 缺乏认可, 自负', element: '火', description: '权杖六代表着胜利和公众的认可。一位骑马者戴着桂冠，受到众人的欢呼。这张牌预示着成功和来自他人的肯定。' },
    { name: '权杖七', nameEn: 'Seven of Wands', type: 'minor', suit: 'wands', number: 7, keywords: '坚持, 防御, 勇气', meaningUpright: '坚持立场, 勇敢面对, 坚守阵地', meaningReversed: '放弃, 被压倒, 优柔寡断', element: '火', description: '权杖七代表着坚持和防御。一个人站在高处，用权杖抵挡来自下方的攻击。这张牌鼓励我们坚守自己的立场，勇敢面对挑战。' },
    { name: '权杖八', nameEn: 'Eight of Wands', type: 'minor', suit: 'wands', number: 8, keywords: '行动, 快速, 进展', meaningUpright: '快速行动, 进展顺利, 消息传来', meaningReversed: '延误, 混乱, 停滞不前', element: '火', description: '权杖八代表着快速行动和进展。八根权杖在空中飞行，象征着事情正在迅速推进。这张牌预示着好消息即将到来，事情会快速发展。' },
    { name: '权杖九', nameEn: 'Nine of Wands', type: 'minor', suit: 'wands', number: 9, keywords: '坚韧, 坚持, 最后防线', meaningUpright: '坚韧不拔, 坚持到最后, 积累经验', meaningReversed: '筋疲力尽, 放弃抵抗, 过度防御', element: '火', description: '权杖九代表着坚韧和最后的坚持。一个人受伤但依然站立，守护着身后的八根权杖。这张牌鼓励我们在疲惫时继续坚持，胜利就在眼前。' },
    { name: '权杖十', nameEn: 'Ten of Wands', type: 'minor', suit: 'wands', number: 10, keywords: '负担, 责任, 压力', meaningUpright: '承担责任, 努力工作, 即将完成', meaningReversed: '负担过重, 逃避责任, 无法承受', element: '火', description: '权杖十代表着责任和负担。一个人抱着十根权杖艰难前行。这张牌提醒我们注意过重的负担，学会委派和释放。' },
    { name: '权杖侍从', nameEn: 'Page of Wands', type: 'minor', suit: 'wands', number: 11, keywords: '探索, 热情, 新消息', meaningUpright: '探索新事物, 充满热情, 好消息', meaningReversed: '缺乏方向, 坏消息, 热情消退', element: '火', description: '权杖侍从代表着探索和热情。一个年轻人手持权杖，充满好奇地凝视着它。这张牌象征着对新事物的热情和探索精神。' },
    { name: '权杖骑士', nameEn: 'Knight of Wands', type: 'minor', suit: 'wands', number: 12, keywords: '行动, 冒险, 冲动', meaningUpright: '勇敢行动, 追求冒险, 充满活力', meaningReversed: '鲁莽, 冲动, 半途而废', element: '火', description: '权杖骑士代表着行动和冒险精神。骑士骑在马上，手持权杖冲锋。这张牌鼓励我们勇敢追求目标，但也要注意不要过于冲动。' },
    { name: '权杖王后', nameEn: 'Queen of Wands', type: 'minor', suit: 'wands', number: 13, keywords: '自信, 热情, 领导力', meaningUpright: '自信满满, 温暖热情, 独立自主', meaningReversed: '缺乏自信, 嫉妒, 控制欲强', element: '火', description: '权杖王后代表着自信和热情。她坐在宝座上，手持权杖，充满力量和魅力。这张牌象征着独立、自信和温暖的人格魅力。' },
    { name: '权杖国王', nameEn: 'King of Wands', type: 'minor', suit: 'wands', number: 14, keywords: '领导, 远见, 创业', meaningUpright: '英明领导, 远见卓识, 创业精神', meaningReversed: '专横, 缺乏远见, 独裁', element: '火', description: '权杖国王代表着领导力和远见。他坐在宝座上，手持权杖，象征着成熟的领导力和创业精神。这张牌鼓励我们发挥领导才能，勇于开拓。' },

    // ==================== Cups (圣杯) - 水元素 ====================
    { name: '圣杯王牌', nameEn: 'Ace of Cups', type: 'minor', suit: 'cups', number: 1, keywords: '爱, 情感, 新感情', meaningUpright: '新的感情, 爱意涌现, 情感满足', meaningReversed: '情感空虚, 爱的缺失, 压抑情感', element: '水', description: '圣杯王牌代表着新的感情和爱的开始。一只圣杯从云中溢出五道水流，象征着情感的丰盈和心灵的满足。' },
    { name: '圣杯二', nameEn: 'Two of Cups', type: 'minor', suit: 'cups', number: 2, keywords: '伴侣, 结合, 和谐', meaningUpright: '灵魂伴侣, 和谐关系, 相互吸引', meaningReversed: '分离, 不信任, 关系破裂', element: '水', description: '圣杯二代表着伴侣关系和和谐的结合。两个人交换圣杯，象征着平等的关系和深刻的情感连接。' },
    { name: '圣杯三', nameEn: 'Three of Cups', type: 'minor', suit: 'cups', number: 3, keywords: '庆祝, 友谊, 欢乐', meaningUpright: '友谊欢庆, 团聚, 快乐时光', meaningReversed: '过度放纵, 流言, 孤独', element: '水', description: '圣杯三代表着友谊和庆祝。三位女子高举圣杯共舞，象征着欢乐的聚会和深厚的情谊。' },
    { name: '圣杯四', nameEn: 'Four of Cups', type: 'minor', suit: 'cups', number: 4, keywords: '沉思, 不满, 冷漠', meaningUpright: '沉思, 重新评估, 内心反省', meaningReversed: '新的动力, 抓住机会, 醒悟', element: '水', description: '圣杯四代表着沉思和不满。一个人坐在树下，对面前的三只圣杯视而不见，天上又伸出一只圣杯。这张牌提醒我们不要忽视眼前的机会。' },
    { name: '圣杯五', nameEn: 'Five of Cups', type: 'minor', suit: 'cups', number: 5, keywords: '失落, 悲伤, 遗憾', meaningUpright: '失落, 悲伤, 专注失去', meaningReversed: '接受, 向前看, 新的希望', element: '水', description: '圣杯五代表着失落和悲伤。一个人低头看着倒下的三只圣杯，却没有注意到身后还有两只立着的圣杯。这张牌提醒我们在悲伤中不要忘记还有希望。' },
    { name: '圣杯六', nameEn: 'Six of Cups', type: 'minor', suit: 'cups', number: 6, keywords: '回忆, 怀旧, 纯真', meaningUpright: '美好回忆, 怀旧, 纯真, 善意的礼物', meaningReversed: '沉溺过去, 无法前进, 脱离现实', element: '水', description: '圣杯六代表着回忆和怀旧。一个孩子将花朵插在圣杯中送给另一个孩子，画面充满了纯真和温暖。这张牌唤起美好的童年回忆和纯真的情感。' },
    { name: '圣杯七', nameEn: 'Seven of Cups', type: 'minor', suit: 'cups', number: 7, keywords: '幻想, 选择, 迷惑', meaningUpright: '多种选择, 幻想, 想象力', meaningReversed: '清晰, 做出决定, 面对现实', element: '水', description: '圣杯七代表着幻想和选择。七只圣杯漂浮在空中，各自装着不同的幻想之物。这张牌提醒我们面对众多选择时要保持清醒，不要被幻象迷惑。' },
    { name: '圣杯八', nameEn: 'Eight of Cups', type: 'minor', suit: 'cups', number: 8, keywords: '离开, 放弃, 寻找', meaningUpright: '离开, 放弃不满足的, 寻找更高意义', meaningReversed: '恐惧改变, 停滞, 无法离开', element: '水', description: '圣杯八代表着离开和追寻。一个人转身离开堆积的八只圣杯，走向远方。这张牌象征着放弃不满足的现状，去寻找更高层次的意义。' },
    { name: '圣杯九', nameEn: 'Nine of Cups', type: 'minor', suit: 'cups', number: 9, keywords: '满足, 愿望实现, 幸福', meaningUpright: '愿望实现, 满足, 幸福快乐', meaningReversed: '不满足, 贪婪, 物质主义', element: '水', description: '圣杯九代表着愿望的实现和满足。一个人坐在九只圣杯前，脸上洋溢着满足的笑容。这张牌是愿望成真之牌，预示着幸福和满足。' },
    { name: '圣杯十', nameEn: 'Ten of Cups', type: 'minor', suit: 'cups', number: 10, keywords: '家庭幸福, 圆满, 和谐', meaningUpright: '家庭幸福, 情感圆满, 和谐美满', meaningReversed: '家庭不和, 破碎的家庭, 不和谐', element: '水', description: '圣杯十代表着家庭幸福和情感圆满。一对夫妇和两个孩子仰望天空中的十只圣杯，彩虹横跨天际。这张牌预示着美满的家庭生活和情感的终极满足。' },
    { name: '圣杯侍从', nameEn: 'Page of Cups', type: 'minor', suit: 'cups', number: 11, keywords: '创意, 直觉, 浪漫', meaningUpright: '创意灵感, 直觉敏锐, 浪漫消息', meaningReversed: '情感不成熟, 创意受阻, 不切实际', element: '水', description: '圣杯侍从代表着创意和直觉。一个年轻人手持圣杯，一条鱼从中探出头来。这张牌象征着创意灵感的涌现和浪漫的消息。' },
    { name: '圣杯骑士', nameEn: 'Knight of Cups', type: 'minor', suit: 'cups', number: 12, keywords: '浪漫, 追求, 理想', meaningUpright: '浪漫追求, 理想主义, 深情款款', meaningReversed: '不切实际, 情绪化, 虚假承诺', element: '水', description: '圣杯骑士代表着浪漫和理想的追求。骑士骑在白马上，手持圣杯缓缓前行。这张牌象征着浪漫的追求和理想主义的情感。' },
    { name: '圣杯王后', nameEn: 'Queen of Cups', type: 'minor', suit: 'cups', number: 13, keywords: '同情, 直觉, 温暖', meaningUpright: '富有同情心, 直觉强, 温暖关怀', meaningReversed: '情感依赖, 过度敏感, 情绪化', element: '水', description: '圣杯王后代表着同情和温暖。她坐在宝座上，凝视着手中精美的圣杯。这张牌象征着深沉的同情心、直觉力和温暖的人格魅力。' },
    { name: '圣杯国王', nameEn: 'King of Cups', type: 'minor', suit: 'cups', number: 14, keywords: '情感成熟, 宽容, 艺术', meaningUpright: '情感成熟, 宽容大度, 艺术气质', meaningReversed: '情绪失控, 操纵情感, 压抑', element: '水', description: '圣杯国王代表着情感的成熟和宽容。他坐在宝座上，手持圣杯和权杖，掌控着自己的情感世界。这张牌象征着成熟的情感智慧。' },

    // ==================== Swords (宝剑) - 风元素 ====================
    { name: '宝剑王牌', nameEn: 'Ace of Swords', type: 'minor', suit: 'swords', number: 1, keywords: '清晰, 真理, 新思维', meaningUpright: '思维清晰, 真理, 新的认知', meaningReversed: '混乱, 错误判断, 真相被掩盖', element: '风', description: '宝剑王牌代表着清晰的思维和真理。一只手从云中伸出，握着一把宝剑，剑尖戴着皇冠。这张牌象征着新的认知和思维上的突破。' },
    { name: '宝剑二', nameEn: 'Two of Swords', type: 'minor', suit: 'swords', number: 2, keywords: '抉择, 僵局, 平衡', meaningUpright: '艰难抉择, 暂时平衡, 需要信息', meaningReversed: '做出决定, 打破僵局, 真相大白', element: '风', description: '宝剑二代表着艰难的抉择和僵局。一个蒙眼女子手持两把宝剑交叉在胸前，暗示着需要在两个选择中做出决定。' },
    { name: '宝剑三', nameEn: 'Three of Swords', type: 'minor', suit: 'swords', number: 3, keywords: '心碎, 悲伤, 伤害', meaningUpright: '心碎, 悲伤, 情感伤害', meaningReversed: '恢复, 释怀, 原谅', element: '风', description: '宝剑三代表着心碎和悲伤。三把宝剑刺穿一颗心，天空乌云密布。这张牌象征着情感上的痛苦和伤害，但也是疗愈的开始。' },
    { name: '宝剑四', nameEn: 'Four of Swords', type: 'minor', suit: 'swords', number: 4, keywords: '休息, 恢复, 冥想', meaningUpright: '休息, 恢复, 冥想, 反思', meaningReversed: '重新出发, 焦躁不安, 无法休息', element: '风', description: '宝剑四代表着休息和恢复。一个人躺在教堂中，三把宝剑挂在墙上，一把放在身边。这张牌提醒我们需要休息和反思来恢复精力。' },
    { name: '宝剑五', nameEn: 'Five of Swords', type: 'minor', suit: 'swords', number: 5, keywords: '冲突, 失败, 胜利', meaningUpright: '冲突, 空洞的胜利, 争执', meaningReversed: '和解, 放下, 结束冲突', element: '风', description: '宝剑五代表着冲突和空洞的胜利。一个人手持三把宝剑，露出得意的笑容，另两人转身离去。这张牌提醒我们有些胜利是得不偿失的。' },
    { name: '宝剑六', nameEn: 'Six of Swords', type: 'minor', suit: 'swords', number: 6, keywords: '过渡, 前进, 疗愈', meaningUpright: '过渡时期, 继续前进, 疗愈之旅', meaningReversed: '停滞, 无法前进, 回到过去', element: '风', description: '宝剑六代表着过渡和前进。一条船载着六把宝剑缓缓驶向彼岸。这张牌预示着从困难中走出来，向更好的未来过渡。' },
    { name: '宝剑七', nameEn: 'Seven of Swords', type: 'minor', suit: 'swords', number: 7, keywords: '策略, 欺骗, 隐秘', meaningUpright: '策略, 隐秘行动, 巧妙的计划', meaningReversed: '暴露, 欺骗被发现, 错误策略', element: '风', description: '宝剑七代表着策略和隐秘行动。一个人蹑手蹑脚地抱着五把宝剑离开营地，身后还有两把插在地上。这张牌提醒我们需要智慧和策略，但要小心不要欺骗。' },
    { name: '宝剑八', nameEn: 'Eight of Swords', type: 'minor', suit: 'swords', number: 8, keywords: '束缚, 限制, 无能为力', meaningUpright: '感到束缚, 自我限制, 无力感', meaningReversed: '突破限制, 自由, 新的视角', element: '风', description: '宝剑八代表着束缚和自我限制。一个蒙眼女子被绑在八把宝剑中间，但其实她并非完全无法挣脱。这张牌提醒我们很多限制来自于自己的思维。' },
    { name: '宝剑九', nameEn: 'Nine of Swords', type: 'minor', suit: 'swords', number: 9, keywords: '焦虑, 噩梦, 恐惧', meaningUpright: '焦虑, 噩梦, 过度担忧', meaningReversed: '释怀, 希望, 焦虑减轻', element: '风', description: '宝剑九代表着焦虑和噩梦。一个人在深夜惊醒，九把宝剑挂在墙上。这张牌象征着内心的恐惧和焦虑，但往往实际的情况并没有那么糟。' },
    { name: '宝剑十', nameEn: 'Ten of Swords', type: 'minor', suit: 'swords', number: 10, keywords: '结束, 背叛, 低谷', meaningUpright: '结束, 触底, 无法更糟', meaningReversed: '恢复, 反弹, 看到希望', element: '风', description: '宝剑十代表着结束和最低点。一个人倒在地上，十把宝剑插在背上。虽然画面令人绝望，但这张牌也意味着事情已经触底，只能向上走了。' },
    { name: '宝剑侍从', nameEn: 'Page of Swords', type: 'minor', suit: 'swords', number: 11, keywords: '好奇, 求知, 沟通', meaningUpright: '好奇心旺盛, 新想法, 智力探索', meaningReversed: '流言蜚语, 肤浅, 欺骗', element: '风', description: '宝剑侍从代表着好奇心和求知欲。一个年轻人手持宝剑，充满警觉。这张牌象征着对新知识的渴望和敏锐的思维。' },
    { name: '宝剑骑士', nameEn: 'Knight of Swords', type: 'minor', suit: 'swords', number: 12, keywords: '果断, 行动, 快速', meaningUpright: '果断行动, 快速决策, 勇往直前', meaningReversed: '鲁莽, 冲动, 不考虑后果', element: '风', description: '宝剑骑士代表着果断和快速行动。骑士骑在马上冲锋，宝剑高举。这张牌鼓励我们果断行动，但也要注意方向是否正确。' },
    { name: '宝剑王后', nameEn: 'Queen of Swords', type: 'minor', suit: 'swords', number: 13, keywords: '理性, 独立, 智慧', meaningUpright: '理性智慧, 独立自主, 清晰判断', meaningReversed: '冷酷, 刻薄, 过度理性', element: '风', description: '宝剑王后代表着理性和智慧。她坐在宝座上，手持宝剑，目光坚定。这张牌象征着清晰的思维、独立的判断力和智慧的力量。' },
    { name: '宝剑国王', nameEn: 'King of Swords', type: 'minor', suit: 'swords', number: 14, keywords: '权威, 智慧, 公正', meaningUpright: '权威智慧, 公正判断, 理性领导', meaningReversed: '滥用权力, 独裁, 不公正', element: '风', description: '宝剑国王代表着权威和智慧。他坐在宝座上，手持宝剑，象征着理性的领导和公正的判断。这张牌鼓励我们运用智慧和权威做出正确的决定。' },

    // ==================== Pentacles (星币) - 土元素 ====================
    { name: '星币王牌', nameEn: 'Ace of Pentacles', type: 'minor', suit: 'pentacles', number: 1, keywords: '财富, 机遇, 新起点', meaningUpright: '新的财富机会, 物质丰盛, 新起点', meaningReversed: '错失机会, 财务问题, 贪婪', element: '土', description: '星币王牌代表着新的财富机会和物质的丰盛。一只手从云中伸出，托着一枚星币。这张牌预示着新的财务机会和物质层面的好消息。' },
    { name: '星币二', nameEn: 'Two of Pentacles', type: 'minor', suit: 'pentacles', number: 2, keywords: '平衡, 灵活, 适应', meaningUpright: '平衡多个事务, 灵活应变, 适应变化', meaningReversed: '失衡, 混乱, 财务困难', element: '土', description: '星币二代表着平衡和灵活。一个人玩弄着两枚星币，形成无限符号。这张牌提醒我们需要在多个事务之间找到平衡，保持灵活性。' },
    { name: '星币三', nameEn: 'Three of Pentacles', type: 'minor', suit: 'pentacles', number: 3, keywords: '合作, 技能, 建设', meaningUpright: '团队合作, 专业技能, 精益求精', meaningReversed: '缺乏合作, 工作质量差, 不协调', element: '土', description: '星币三代表着合作和技能。三位工匠在教堂中讨论图纸，展示着各自的专业技能。这张牌象征着团队合作和精益求精的态度。' },
    { name: '星币四', nameEn: 'Four of Pentacles', type: 'minor', suit: 'pentacles', number: 4, keywords: '守财, 控制, 安全', meaningUpright: '储蓄, 安全感, 自我保护', meaningReversed: '吝啬, 过度控制, 失去', element: '土', description: '星币四代表着守财和控制。一个人紧紧抱着四枚星币，头上顶着一枚，脚下踩着两枚。这张牌提醒我们注意过度守财的倾向，学会适度分享。' },
    { name: '星币五', nameEn: 'Five of Pentacles', type: 'minor', suit: 'pentacles', number: 5, keywords: '贫困, 艰难, 孤立', meaningUpright: '财务困难, 艰难时期, 精神寻求', meaningReversed: '恢复, 找到帮助, 走出困境', element: '土', description: '星币五代表着贫困和艰难。两个人在雪夜中经过教堂，虽然处境艰难，但教堂的灯光暗示着帮助就在身边。这张牌提醒我们困境中也要寻求帮助。' },
    { name: '星币六', nameEn: 'Six of Pentacles', type: 'minor', suit: 'pentacles', number: 6, keywords: '给予, 接受, 慷慨', meaningUpright: '慷慨给予, 分享财富, 慈善', meaningReversed: '自私, 不平等, 债务', element: '土', description: '星币六代表着给予和慷慨。一个富人手持天平，将星币分给两个穷人。这张牌象征着慷慨和公平的分配，提醒我们分享的重要性。' },
    { name: '星币七', nameEn: 'Seven of Pentacles', type: 'minor', suit: 'pentacles', number: 7, keywords: '等待, 评估, 耐心', meaningUpright: '耐心等待, 评估进展, 持续努力', meaningReversed: '不耐烦, 半途而废, 投资失败', element: '土', description: '星币七代表着等待和评估。一个人看着星币生长在植物上，思考着收获。这张牌提醒我们耐心等待成果，同时评估进展。' },
    { name: '星币八', nameEn: 'Eight of Pentacles', type: 'minor', suit: 'pentacles', number: 8, keywords: '勤奋, 技能, 专注', meaningUpright: '勤奋工作, 磨练技能, 专注投入', meaningReversed: '缺乏动力, 敷衍了事, 工作倦怠', element: '土', description: '星币八代表着勤奋和技能的磨练。一个工匠专注地雕刻星币，墙上挂满了他的作品。这张牌象征着通过勤奋努力提升技能的过程。' },
    { name: '星币九', nameEn: 'Nine of Pentacles', type: 'minor', suit: 'pentacles', number: 9, keywords: '富足, 独立, 享受', meaningUpright: '物质富足, 独立自主, 享受生活', meaningReversed: '物质依赖, 孤独, 过度消费', element: '土', description: '星币九代表着物质富足和独立。一位优雅的女子在花园中漫步，九枚星币环绕着她。这张牌象征着通过自身努力获得的富足和独立。' },
    { name: '星币十', nameEn: 'Ten of Pentacles', type: 'minor', suit: 'pentacles', number: 10, keywords: '传承, 财富, 家族', meaningUpright: '家族财富, 传承, 长期稳定', meaningReversed: '家族纠纷, 遗产问题, 财务不稳定', element: '土', description: '星币十代表着家族财富和传承。十枚星币排列在拱门上，几代人共同生活。这张牌象征着长期的财富积累和家族的传承。' },
    { name: '星币侍从', nameEn: 'Page of Pentacles', type: 'minor', suit: 'pentacles', number: 11, keywords: '学习, 实践, 务实', meaningUpright: '学习新技能, 务实态度, 脚踏实地', meaningReversed: '缺乏动力, 学习障碍, 不切实际', element: '土', description: '星币侍从代表着学习者和务实的态度。一个年轻人专注地捧着一枚星币。这张牌象征着对新技能的学习热情和脚踏实地的态度。' },
    { name: '星币骑士', nameEn: 'Knight of Pentacles', type: 'minor', suit: 'pentacles', number: 12, keywords: '勤奋, 可靠, 耐心', meaningUpright: '勤奋可靠, 耐心坚持, 务实行动', meaningReversed: '停滞, 懒惰, 缺乏动力', element: '土', description: '星币骑士代表着勤奋和可靠。骑士骑在黑马上，手持星币，静静站立。这张牌象征着踏实可靠的品质和持之以恒的努力。' },
    { name: '星币王后', nameEn: 'Queen of Pentacles', type: 'minor', suit: 'pentacles', number: 13, keywords: '务实, 温暖, 富足', meaningUpright: '务实能干, 温暖关怀, 物质富足', meaningReversed: '物质主义, 忽视家庭, 不安全感', element: '土', description: '星币王后代表着务实和温暖。她坐在宝座上，怀抱星币，周围繁花似锦。这张牌象征着将物质与情感完美结合的能力。' },
    { name: '星币国王', nameEn: 'King of Pentacles', type: 'minor', suit: 'pentacles', number: 14, keywords: '财富, 成功, 稳定', meaningUpright: '财富成功, 稳定可靠, 商业头脑', meaningReversed: '贪婪, 腐败, 物质主义', element: '土', description: '星币国王代表着财富和成功。他坐在宝座上，手持星币和权杖，象征着商业上的成功和物质的丰盛。这张牌预示着财务上的稳定和成功。' },
  ]

  const insertMany = database.transaction((cards: typeof seedData) => {
    for (const card of cards) {
      insertCard.run(
        card.name, card.nameEn, card.type, card.suit ?? null, card.number,
        card.keywords, card.meaningUpright, card.meaningReversed,
        card.element ?? null, card.zodiac ?? null, card.description,
      )
    }
  })

  insertMany(seedData)
  console.log(`Seeded ${seedData.length} tarot cards.`)
}