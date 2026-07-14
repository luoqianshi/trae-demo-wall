/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

/**
 * 方言→标准医学术语映射表
 *
 * 覆盖四种方言：四川话、粤语、上海话、东北话
 * 分类覆盖：症状、身体部位、用药、检查、饮食、日常表达
 * 重点服务于医疗场景（症状描述、身体不适、用药方式、检查项目等）
 */
const DIALECT_MAP = [
  // ===================== 四川话（57 条） =====================
  // —— 症状 ——
  { dialect: '四川话', original: '脑壳昏', standard: '头晕', category: '症状' },
  { dialect: '四川话', original: '心口闷', standard: '胸闷', category: '症状' },
  { dialect: '四川话', original: '肚皮痛', standard: '腹痛', category: '症状' },
  { dialect: '四川话', original: '拉肚子', standard: '腹泻', category: '症状' },
  { dialect: '四川话', original: '吐清口水', standard: '反酸', category: '症状' },
  { dialect: '四川话', original: '脚耙手软', standard: '四肢无力', category: '症状' },
  { dialect: '四川话', original: '脸巴儿红', standard: '面色潮红', category: '症状' },
  { dialect: '四川话', original: '眼冒金星', standard: '眼花', category: '症状' },
  { dialect: '四川话', original: '气不过来', standard: '气短', category: '症状' },
  { dialect: '四川话', original: '脑壳痛', standard: '头痛', category: '症状' },
  { dialect: '四川话', original: '咳得凶', standard: '咳嗽剧烈', category: '症状' },
  { dialect: '四川话', original: '喉咙干', standard: '咽干', category: '症状' },
  { dialect: '四川话', original: '鼻子堵', standard: '鼻塞', category: '症状' },
  { dialect: '四川话', original: '流清鼻子', standard: '流鼻涕', category: '症状' },
  { dialect: '四川话', original: '发高烧', standard: '高热', category: '症状' },
  { dialect: '四川话', original: '打冷噤', standard: '畏寒', category: '症状' },
  { dialect: '四川话', original: '身上软', standard: '乏力', category: '症状' },
  { dialect: '四川话', original: '肚皮胀', standard: '腹胀', category: '症状' },
  { dialect: '四川话', original: '干呕', standard: '恶心', category: '症状' },
  { dialect: '四川话', original: '吐了', standard: '呕吐', category: '症状' },
  { dialect: '四川话', original: '解不出大便', standard: '便秘', category: '症状' },
  { dialect: '四川话', original: '屙黑屎', standard: '黑便', category: '症状' },
  { dialect: '四川话', original: '尿多', standard: '尿频', category: '症状' },
  { dialect: '四川话', original: '尿痛', standard: '尿痛', category: '症状' },
  { dialect: '四川话', original: '腰杆痛', standard: '腰痛', category: '症状' },
  { dialect: '四川话', original: '背心冷', standard: '背寒', category: '症状' },
  { dialect: '四川话', original: '睡不着', standard: '失眠', category: '症状' },
  { dialect: '四川话', original: '瞌睡多', standard: '嗜睡', category: '症状' },
  { dialect: '四川话', original: '出虚汗', standard: '盗汗', category: '症状' },
  { dialect: '四川话', original: '脑壳昏沉沉', standard: '头昏沉', category: '症状' },
  { dialect: '四川话', original: '耳朵嗡嗡响', standard: '耳鸣', category: '症状' },
  { dialect: '四川话', original: '嘴巴苦', standard: '口苦', category: '症状' },
  { dialect: '四川话', original: '嘴巴干', standard: '口干', category: '症状' },
  { dialect: '四川话', original: '吃不下', standard: '食欲不振', category: '症状' },
  { dialect: '四川话', original: '心慌', standard: '心悸', category: '症状' },
  { dialect: '四川话', original: '喘气', standard: '气喘', category: '症状' },
  { dialect: '四川话', original: '脚肿', standard: '下肢水肿', category: '症状' },
  { dialect: '四川话', original: '手抖', standard: '手抖', category: '症状' },
  { dialect: '四川话', original: '咳血', standard: '咯血', category: '症状' },
  { dialect: '四川话', original: '流鼻血', standard: '鼻出血', category: '症状' },
  { dialect: '四川话', original: '眼屎多', standard: '眼部分泌物增多', category: '症状' },
  // —— 身体部位 ——
  { dialect: '四川话', original: '脑壳', standard: '头部', category: '身体部位' },
  { dialect: '四川话', original: '心口', standard: '胸部', category: '身体部位' },
  { dialect: '四川话', original: '肚皮', standard: '腹部', category: '身体部位' },
  { dialect: '四川话', original: '腰杆', standard: '腰部', category: '身体部位' },
  { dialect: '四川话', original: '手杆', standard: '手臂', category: '身体部位' },
  // —— 用药 ——
  { dialect: '四川话', original: '吃药', standard: '服药', category: '用药' },
  { dialect: '四川话', original: '打吊针', standard: '静脉输液', category: '用药' },
  { dialect: '四川话', original: '擦药膏', standard: '外用药涂抹', category: '用药' },
  // —— 检查 ——
  { dialect: '四川话', original: '照X光', standard: 'X光检查', category: '检查' },
  { dialect: '四川话', original: '抽血化验', standard: '血液检查', category: '检查' },
  // —— 饮食 ——
  { dialect: '四川话', original: '忌口', standard: '饮食禁忌', category: '饮食' },
  { dialect: '四川话', original: '莫吃得太咸', standard: '低盐饮食', category: '饮食' },
  { dialect: '四川话', original: '吃清淡点', standard: '清淡饮食', category: '饮食' },
  // —— 日常表达 ——
  { dialect: '四川话', original: '去医院看下', standard: '就诊', category: '日常表达' },
  { dialect: '四川话', original: '再去看一趟', standard: '复诊', category: '日常表达' },
  { dialect: '四川话', original: '住几天院', standard: '住院治疗', category: '日常表达' },

  // ===================== 粤语（56 条） =====================
  // —— 症状 ——
  { dialect: '粤语', original: '头晕转', standard: '头晕', category: '症状' },
  { dialect: '粤语', original: '心口翳', standard: '胸闷', category: '症状' },
  { dialect: '粤语', original: '肚痛', standard: '腹痛', category: '症状' },
  { dialect: '粤语', original: '屙呕', standard: '上吐下泻', category: '症状' },
  { dialect: '粤语', original: '周身唔舒服', standard: '全身不适', category: '症状' },
  { dialect: '粤语', original: '眼花', standard: '视力模糊', category: '症状' },
  { dialect: '粤语', original: '喉咙痛', standard: '咽喉痛', category: '症状' },
  { dialect: '粤语', original: '冇精神', standard: '乏力', category: '症状' },
  { dialect: '粤语', original: '作闷', standard: '恶心', category: '症状' },
  { dialect: '粤语', original: '头痛', standard: '头痛', category: '症状' },
  { dialect: '粤语', original: '咳', standard: '咳嗽', category: '症状' },
  { dialect: '粤语', original: '发烧', standard: '发热', category: '症状' },
  { dialect: '粤语', original: '冇胃口', standard: '食欲不振', category: '症状' },
  { dialect: '粤语', original: '瞓唔着', standard: '失眠', category: '症状' },
  { dialect: '粤语', original: '屙肚', standard: '腹泻', category: '症状' },
  { dialect: '粤语', original: '屙唔出', standard: '便秘', category: '症状' },
  { dialect: '粤语', original: '作呕', standard: '恶心', category: '症状' },
  { dialect: '粤语', original: '呕', standard: '呕吐', category: '症状' },
  { dialect: '粤语', original: '鼻塞', standard: '鼻塞', category: '症状' },
  { dialect: '粤语', original: '流鼻水', standard: '流鼻涕', category: '症状' },
  { dialect: '粤语', original: '周身骨痛', standard: '全身酸痛', category: '症状' },
  { dialect: '粤语', original: '脚软', standard: '下肢无力', category: '症状' },
  { dialect: '粤语', original: '手震', standard: '手抖', category: '症状' },
  { dialect: '粤语', original: '心跳快', standard: '心悸', category: '症状' },
  { dialect: '粤语', original: '气喘', standard: '气喘', category: '症状' },
  { dialect: '粤语', original: '气促', standard: '气短', category: '症状' },
  { dialect: '粤语', original: '头晕晕哋', standard: '头昏沉', category: '症状' },
  { dialect: '粤语', original: '眼涩', standard: '眼疲劳', category: '症状' },
  { dialect: '粤语', original: '口干', standard: '口干', category: '症状' },
  { dialect: '粤语', original: '口苦', standard: '口苦', category: '症状' },
  { dialect: '粤语', original: '肚胀', standard: '腹胀', category: '症状' },
  { dialect: '粤语', original: '肚疴', standard: '腹泻', category: '症状' },
  { dialect: '粤语', original: '屙血', standard: '便血', category: '症状' },
  { dialect: '粤语', original: '尿频', standard: '尿频', category: '症状' },
  { dialect: '粤语', original: '尿痛', standard: '尿痛', category: '症状' },
  { dialect: '粤语', original: '夜晚尿多', standard: '夜尿增多', category: '症状' },
  { dialect: '粤语', original: '腰痛', standard: '腰痛', category: '症状' },
  { dialect: '粤语', original: '背痛', standard: '背痛', category: '症状' },
  { dialect: '粤语', original: '手脚冻', standard: '四肢发冷', category: '症状' },
  { dialect: '粤语', original: '面青', standard: '面色苍白', category: '症状' },
  { dialect: '粤语', original: '咳血', standard: '咯血', category: '症状' },
  { dialect: '粤语', original: '流鼻血', standard: '鼻出血', category: '症状' },
  // —— 身体部位 ——
  { dialect: '粤语', original: '心口', standard: '胸部', category: '身体部位' },
  { dialect: '粤语', original: '个头', standard: '头部', category: '身体部位' },
  { dialect: '粤语', original: '对脚', standard: '下肢', category: '身体部位' },
  { dialect: '粤语', original: '只手', standard: '上肢', category: '身体部位' },
  // —— 用药 ——
  { dialect: '粤语', original: '食药', standard: '服药', category: '用药' },
  { dialect: '粤语', original: '打点滴', standard: '静脉输液', category: '用药' },
  // —— 检查 ——
  { dialect: '粤语', original: '验血', standard: '血液检查', category: '检查' },
  { dialect: '粤语', original: '照肺', standard: '胸部X光检查', category: '检查' },
  // —— 饮食 ——
  { dialect: '粤语', original: '戒口', standard: '饮食禁忌', category: '饮食' },
  { dialect: '粤语', original: '食得清淡啲', standard: '清淡饮食', category: '饮食' },
  { dialect: '粤语', original: '饮多啲水', standard: '多饮水', category: '饮食' },
  // —— 日常表达 ——
  { dialect: '粤语', original: '睇医生', standard: '就诊', category: '日常表达' },
  { dialect: '粤语', original: '覆诊', standard: '复诊', category: '日常表达' },
  { dialect: '粤语', original: '入医院', standard: '住院治疗', category: '日常表达' },

  // ===================== 上海话（29 条） =====================
  // —— 症状 ——
  { dialect: '上海话', original: '脑子晕', standard: '头晕', category: '症状' },
  { dialect: '上海话', original: '胸口头闷', standard: '胸闷', category: '症状' },
  { dialect: '上海话', original: '肚皮痛', standard: '腹痛', category: '症状' },
  { dialect: '上海话', original: '浑身没劲', standard: '乏力', category: '症状' },
  { dialect: '上海话', original: '眼睛花', standard: '视力模糊', category: '症状' },
  { dialect: '上海话', original: '喉咙痛', standard: '咽喉痛', category: '症状' },
  { dialect: '上海话', original: '头痛', standard: '头痛', category: '症状' },
  { dialect: '上海话', original: '咳嗽', standard: '咳嗽', category: '症状' },
  { dialect: '上海话', original: '发寒热', standard: '发热', category: '症状' },
  { dialect: '上海话', original: '打恶心', standard: '恶心', category: '症状' },
  { dialect: '上海话', original: '呕吐', standard: '呕吐', category: '症状' },
  { dialect: '上海话', original: '肚皮胀', standard: '腹胀', category: '症状' },
  { dialect: '上海话', original: '便秘', standard: '便秘', category: '症状' },
  { dialect: '上海话', original: '拉肚子', standard: '腹泻', category: '症状' },
  { dialect: '上海话', original: '鼻子塞', standard: '鼻塞', category: '症状' },
  { dialect: '上海话', original: '流鼻涕', standard: '流鼻涕', category: '症状' },
  { dialect: '上海话', original: '腰酸', standard: '腰痛', category: '症状' },
  { dialect: '上海话', original: '心跳', standard: '心悸', category: '症状' },
  { dialect: '上海话', original: '气急', standard: '气短', category: '症状' },
  { dialect: '上海话', original: '困不着', standard: '失眠', category: '症状' },
  { dialect: '上海话', original: '冒冷汗', standard: '冷汗', category: '症状' },
  { dialect: '上海话', original: '脚肿', standard: '下肢水肿', category: '症状' },
  { dialect: '上海话', original: '吃不落', standard: '食欲不振', category: '症状' },
  // —— 身体部位 ——
  { dialect: '上海话', original: '胸口头', standard: '胸部', category: '身体部位' },
  // —— 用药 ——
  { dialect: '上海话', original: '吃药', standard: '服药', category: '用药' },
  // —— 饮食 ——
  { dialect: '上海话', original: '忌口', standard: '饮食禁忌', category: '饮食' },
  { dialect: '上海话', original: '吃口清淡点', standard: '清淡饮食', category: '饮食' },
  // —— 日常表达 ——
  { dialect: '上海话', original: '看医生去', standard: '就诊', category: '日常表达' },
  { dialect: '上海话', original: '再去复查一趟', standard: '复诊', category: '日常表达' },

  // ===================== 东北话（29 条） =====================
  // —— 症状 ——
  { dialect: '东北话', original: '脑袋迷糊', standard: '头晕', category: '症状' },
  { dialect: '东北话', original: '心口堵', standard: '胸闷', category: '症状' },
  { dialect: '东北话', original: '肚子疼', standard: '腹痛', category: '症状' },
  { dialect: '东北话', original: '浑身没劲', standard: '乏力', category: '症状' },
  { dialect: '东北话', original: '眼睛发花', standard: '视力模糊', category: '症状' },
  { dialect: '东北话', original: '嗓子疼', standard: '咽喉痛', category: '症状' },
  { dialect: '东北话', original: '头疼', standard: '头痛', category: '症状' },
  { dialect: '东北话', original: '咳嗽', standard: '咳嗽', category: '症状' },
  { dialect: '东北话', original: '发烧', standard: '发热', category: '症状' },
  { dialect: '东北话', original: '打激灵', standard: '畏寒', category: '症状' },
  { dialect: '东北话', original: '恶心', standard: '恶心', category: '症状' },
  { dialect: '东北话', original: '吐了', standard: '呕吐', category: '症状' },
  { dialect: '东北话', original: '肚子胀', standard: '腹胀', category: '症状' },
  { dialect: '东北话', original: '大便干燥', standard: '便秘', category: '症状' },
  { dialect: '东北话', original: '拉稀', standard: '腹泻', category: '症状' },
  { dialect: '东北话', original: '鼻子不通气', standard: '鼻塞', category: '症状' },
  { dialect: '东北话', original: '流鼻涕', standard: '流鼻涕', category: '症状' },
  { dialect: '东北话', original: '腰疼', standard: '腰痛', category: '症状' },
  { dialect: '东北话', original: '心慌', standard: '心悸', category: '症状' },
  { dialect: '东北话', original: '喘不上气', standard: '气短', category: '症状' },
  { dialect: '东北话', original: '睡不着觉', standard: '失眠', category: '症状' },
  { dialect: '东北话', original: '冒虚汗', standard: '盗汗', category: '症状' },
  { dialect: '东北话', original: '腿肿', standard: '下肢水肿', category: '症状' },
  // —— 身体部位 ——
  { dialect: '东北话', original: '脑袋', standard: '头部', category: '身体部位' },
  // —— 用药 ——
  { dialect: '东北话', original: '吃药', standard: '服药', category: '用药' },
  // —— 饮食 ——
  { dialect: '东北话', original: '忌口', standard: '饮食禁忌', category: '饮食' },
  { dialect: '东北话', original: '吃清淡点', standard: '清淡饮食', category: '饮食' },
  // —— 日常表达 ——
  { dialect: '东北话', original: '上医院瞧病', standard: '就诊', category: '日常表达' },
  { dialect: '东北话', original: '再回去复查', standard: '复诊', category: '日常表达' }
]

/**
 * 按方言分组查询
 * @param {string} dialect 方言名称（如 "四川话" / "粤语" / "上海话" / "东北话"）
 * @returns {Array<Object>} 该方言下的所有映射条目
 */
function getDialectEntries (dialect) {
  if (!dialect || typeof dialect !== 'string') return []
  return DIALECT_MAP.filter(function (item) {
    return item.dialect === dialect
  })
}

/**
 * 按关键词搜索方言映射
 * 关键词会同时在 original、standard、dialect、category 四个字段中做包含匹配（不区分大小写）
 * @param {string} keyword 搜索关键词
 * @returns {Array<Object>} 命中的映射条目
 */
function searchDialect (keyword) {
  if (!keyword || typeof keyword !== 'string') return []
  var key = keyword.trim().toLowerCase()
  if (!key) return []
  return DIALECT_MAP.filter(function (item) {
    return (
      (item.original && item.original.toLowerCase().indexOf(key) !== -1) ||
      (item.standard && item.standard.toLowerCase().indexOf(key) !== -1) ||
      (item.dialect && item.dialect.toLowerCase().indexOf(key) !== -1) ||
      (item.category && item.category.toLowerCase().indexOf(key) !== -1)
    )
  })
}

// 挂载到全局对象，兼容浏览器（window）和 Node.js（global / module.exports）
;(function (global) {
  global.DIALECT_MAP = DIALECT_MAP
  global.getDialectEntries = getDialectEntries
  global.searchDialect = searchDialect

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DIALECT_MAP: DIALECT_MAP, getDialectEntries: getDialectEntries, searchDialect: searchDialect }
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this))
