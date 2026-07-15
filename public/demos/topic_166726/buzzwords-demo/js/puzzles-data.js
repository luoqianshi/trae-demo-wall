/**
 * @file 谜题数据定义 - 3道完整谜题（赋能/闭环/对齐），每道4关
 * 每关包含多个推理步骤，玩家需逐步完成推理才能解锁中间答案
 */

/**
 * 单个推理步骤的数据结构
 * @typedef {Object} PuzzleStep
 * @property {string} prompt - 步骤提示文字
 * @property {string} [content] - 可选的展示内容（HTML字符串）
 * @property {'number'|'text'|'choice'} inputType - 输入类型
 * @property {string[]} accept - 接受的答案数组（不区分大小写）
 * @property {string} feedback - 答对后的反馈文字
 * @property {Array<{label:string,value:string}>} [choices] - 选择题选项
 */

/**
 * 单个关卡的数据结构
 * @typedef {Object} PuzzleLevel
 * @property {string} type - 谜题类型标识
 * @property {string} typeName - 谜题类型中文名
 * @property {string} title - 关卡标题
 * @property {PuzzleStep[]} steps - 推理步骤数组
 * @property {string} answer - 本关中间答案
 * @property {string} answerDisplay - 中间答案的展示形式
 * @property {string} hint - 提示文字
 */

/**
 * 单道谜题的数据结构
 * @typedef {Object} Puzzle
 * @property {string} id - 谜题唯一标识
 * @property {string} word - 目标黑话词语
 * @property {string} category - 分类
 * @property {number} toxicity - 浓度评级 1-5
 * @property {Object} knowledgeCard - 知识卡数据
 * @property {string} knowledgeCard.example - 人间真实例句
 * @property {string} knowledgeCard.abuse - 滥用场景
 * @property {PuzzleLevel[]} levels - 4个关卡
 */

/** 全部谜题数据 */
const PUZZLES = [
  // ==================== 谜题 1：赋能 ====================
  {
    id: 'funeng',
    word: '赋能',
    selectHint: '听起来像给了什么，其实什么都没给',
    category: '管理类',
    toxicity: 4,
    knowledgeCard: {
      example: '"我们要赋能一线员工，让大家放手去干。"\n\n翻译：你们自己想办法，但锅我替你们背了名义。',
      abuse: '常见于管理层发言和 OKR 文档中，用来美化"给任务但不给资源"的行为。说的人觉得自己在授权，听的人知道自己被放养。'
    },
    levels: [
      // --- 关 1：数字逻辑推理 ---
      {
        type: 'number-logic',
        typeName: '数字逻辑推理',
        title: '关 1 · 数字逻辑推理',
        answer: '2',
        answerDisplay: '2',
        hint: '序列是奇数序列，缺失的数字是 9。然后看"取笔画数"——把数字转为中文汉字，数笔画。',
        steps: [
          {
            prompt: '观察下方数字序列，找出规律并填入缺失的数字',
            content: 'sequence-odd',
            inputType: 'number',
            accept: ['9'],
            feedback: '序列补全为 9（1, 3, 5, 7, 9 — 奇数序列）。但下方还标注了"取笔画数"，这意味着……'
          },
          {
            prompt: '下方标注"取笔画数"。将数字 9 转为中文"九"，这个字有几画？',
            inputType: 'number',
            accept: ['2'],
            feedback: '推理正确！"九"有 2 画。中间答案为 2，暗示目标词语为 2 个字。'
          }
        ]
      },
      // --- 关 2：符号方程 ---
      {
        type: 'symbol-equation',
        typeName: '符号方程',
        title: '关 2 · 符号方程',
        answer: '贝',
        answerDisplay: '贝',
        hint: '阳光 + 雨水 = 生长，这个等式表达的是"给予"的关系。古代用什么作为货币？',
        steps: [
          {
            prompt: '观察下方符号等式，它表达了什么关系？',
            content: 'equation-sun-rain',
            inputType: 'choice',
            choices: [
              { label: 'A. 太阳和雨水等于植物', value: 'A' },
              { label: 'B. 给予促进生长', value: 'B' },
              { label: 'C. 天气影响农业', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！☀️（阳光）给予能量，🌧️（雨水）给予养分，结果是🌱（生长）。这个等式表达的是"给予促生长"的关系。'
          },
          {
            prompt: '等式下方出现了一个古代象形符号——贝壳的象形图。在古代，贝壳代表什么？',
            content: 'shell-glyph',
            inputType: 'text',
            accept: ['贝', '贝壳', '货币', '财富'],
            feedback: '正确！贝壳在古代是货币，代表财富和"给予"。中间答案为"贝"。'
          }
        ]
      },
      // --- 关 3：图形变换链 ---
      {
        type: 'graphic-transform',
        typeName: '图形变换链',
        title: '关 3 · 图形变换链',
        answer: '⚡→↑',
        answerDisplay: '⚡→↑',
        hint: '观察电池图形的变换过程：充电→满电→输出→箭头上升。这表达了"能量输入使事物变强"的概念。',
        steps: [
          {
            prompt: '观察下方电池图形的变换序列，它表达了什么概念？',
            content: 'battery-transform',
            inputType: 'choice',
            choices: [
              { label: 'A. 充电过程', value: 'A' },
              { label: 'B. 能量输入使事物变强', value: 'B' },
              { label: 'C. 电池耗尽', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！电池经历充电→满电→输出能量→箭头上升，表达了"能量输入使事物变强"的概念。'
          },
          {
            prompt: '用符号表示这个概念（从能量到上升）',
            inputType: 'text',
            accept: ['⚡→↑', '⚡->↑', '⚡->上', '⚡到↑'],
            feedback: '正确！符号表达 ⚡→↑，即"能量输入→上升变强"。中间答案为 ⚡→↑。'
          }
        ]
      },
      // --- 关 4：多维度缩窄 ---
      {
        type: 'multi-narrow',
        typeName: '多维度缩窄 · 组合还原',
        title: '关 4 · 多维度缩窄',
        answer: '赋能',
        answerDisplay: '赋能',
        hint: '"2"限定词语长度，"贝"指向贝字旁+给予义，"⚡→↑"指向能量变强。组合起来是哪个词？',
        steps: [
          {
            prompt: '将前 3 关的中间答案与对应的语义维度匹配。\n线索 1：数字 2',
            inputType: 'choice',
            choices: [
              { label: 'A. 词语长度为 2 个字', value: 'A' },
              { label: 'B. 笔画数为 2', value: 'B' },
              { label: 'C. 序号为 2', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！"2"限定目标词为 2 个字。'
          },
          {
            prompt: '线索 2：贝',
            inputType: 'choice',
            choices: [
              { label: 'A. 颜色名称', value: 'A' },
              { label: 'B. 古代货币/给予 + 贝字旁', value: 'B' },
              { label: 'C. 方向标识', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"贝"指向"贝字旁 + 给予"的含义，推导出一个字可能是"赋"（贝字旁 + 给予义）。'
          },
          {
            prompt: '线索 3：⚡→↑',
            inputType: 'choice',
            choices: [
              { label: 'A. 速度变快', value: 'A' },
              { label: 'B. 能量输入使事物变强', value: 'B' },
              { label: 'C. 时间流逝', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"⚡→↑"指向"能量/能力变强"，推导出另一个字可能是"能"。'
          },
          {
            prompt: '综合三条线索：2个字 + 贝字旁(赋) + 能量变强(能)，目标词语是？',
            inputType: 'text',
            accept: ['赋能', '賦能'],
            feedback: '完美！"赋"（给予）+ "能"（能量/能力）= 赋能！'
          }
        ]
      }
    ]
  },

  // ==================== 谜题 2：闭环 ====================
  {
    id: 'bihuan',
    word: '闭环',
    selectHint: '做完一件事后绕回起点，听起来很完整',
    category: '流程类',
    toxicity: 3,
    knowledgeCard: {
      example: '"这个项目我们需要形成闭环，确保每个环节都有始有终。"\n\n翻译：出了问题别找我，流程上都转过了。',
      abuse: '常用于项目复盘和流程文档中，将简单的"做完一件事检查一遍"包装成高深的管理概念。实际上大多数"闭环"只是"收尾"的换皮说法。'
    },
    levels: [
      // --- 关 1：序列推理 ---
      {
        type: 'sequence-reasoning',
        typeName: '序列推理',
        title: '关 1 · 序列推理',
        answer: '0',
        answerDisplay: '0',
        hint: '序列 0→1→2→3→0→1→2→3→? 是一个循环，循环节长度为 4。第 9 个位置回到起点。',
        steps: [
          {
            prompt: '观察下方图形序列，找出规律并填入下一个元素',
            content: 'sequence-cycle',
            inputType: 'number',
            accept: ['0'],
            feedback: '正确！序列 0→1→2→3→0→1→2→3→0，循环节长度为 4，下一个元素回到起点 0。'
          },
          {
            prompt: '数字 0 在这个循环序列中代表什么概念？',
            inputType: 'choice',
            choices: [
              { label: 'A. 没有/空', value: 'A' },
              { label: 'B. 回到起点/循环', value: 'B' },
              { label: 'C. 失败/结束', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！0 代表"回到起点"，是循环序列中首尾相接的关键。中间答案为 0。'
          }
        ]
      },
      // --- 关 2：文字密码链 ---
      {
        type: 'character-cipher',
        typeName: '文字密码链',
        title: '关 2 · 文字密码链',
        answer: '门',
        answerDisplay: '门',
        hint: '"闭"字可以拆成两部分。"才"的本义是"木之初"，那么"门"代表什么？',
        steps: [
          {
            prompt: '将"闭"字拆解为两个部件',
            content: 'decompose-bi',
            inputType: 'choice',
            choices: [
              { label: 'A. 门 + 才', value: 'A' },
              { label: 'B. 门 + 木', value: 'B' },
              { label: 'C. 口 + 才', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！"闭" = 门 + 才。'
          },
          {
            prompt: '"才"字的甲骨文形似一棵刚冒出的嫩芽，本义是什么？',
            inputType: 'choice',
            choices: [
              { label: 'A. 能力', value: 'A' },
              { label: 'B. 木之初 / 刚开始', value: 'B' },
              { label: 'C. 金钱', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"才"本义为"木之初"，引申为"刚刚开始"。'
          },
          {
            prompt: '既然"才"代表"刚开始"，那么"门"在"闭"字中承担什么意象？',
            inputType: 'choice',
            choices: [
              { label: 'A. 出入口', value: 'A' },
              { label: 'B. 关闭 / 封口', value: 'B' },
              { label: 'C. 建筑', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"门"在这里代表"关闭/封口"的意象。中间答案为"门"。'
          }
        ]
      },
      // --- 关 3：谐音拆字迷宫 ---
      {
        type: 'homophone-maze',
        typeName: '谐音拆字迷宫',
        title: '关 3 · 谐音拆字迷宫',
        answer: '环',
        answerDisplay: '环',
        hint: '"还"（hái）和"环"（huán）读音相近。"环"可以拆为"王"和"不"，代表什么？',
        steps: [
          {
            prompt: '从"还"（hái）出发，找出读音相近的字',
            content: 'homophone-huan',
            inputType: 'choice',
            choices: [
              { label: 'A. 回 (huí)', value: 'A' },
              { label: 'B. 环 (huán)', value: 'B' },
              { label: 'C. 画 (huà)', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"还"（hái）与"环"（huán）读音相近，可谐音关联。'
          },
          {
            prompt: '将"环"字拆解为两个部件',
            inputType: 'choice',
            choices: [
              { label: 'A. 王 + 不', value: 'A' },
              { label: 'B. 王 + 寸', value: 'B' },
              { label: 'C. 土 + 不', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！"环" = 王 + 不。'
          },
          {
            prompt: '"王"代表完整，"不"代表缺口。两者组合代表什么意象？',
            inputType: 'choice',
            choices: [
              { label: 'A. 帝王不同意', value: 'A' },
              { label: 'B. 完整 + 缺口被填补 = 环形 / 首尾相接', value: 'B' },
              { label: 'C. 玉石断裂', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"王"（完整）+ "不"（缺口被填补）= 环形/首尾相接的意象。中间答案为"环"。'
          }
        ]
      },
      // --- 关 4：多维度缩窄 ---
      {
        type: 'multi-narrow',
        typeName: '多维度缩窄 · 组合还原',
        title: '关 4 · 多维度缩窄',
        answer: '闭环',
        answerDisplay: '闭环',
        hint: '"0"=循环/回到起点，"门"=关闭/封口，"环"=首尾相接。组合起来是什么词？',
        steps: [
          {
            prompt: '将前 3 关的中间答案与对应的语义维度匹配。\n线索 1：0',
            inputType: 'choice',
            choices: [
              { label: 'A. 数字大小', value: 'A' },
              { label: 'B. 循环 / 回到起点', value: 'B' },
              { label: 'C. 空无一物', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"0"代表循环、回到起点。'
          },
          {
            prompt: '线索 2：门',
            inputType: 'choice',
            choices: [
              { label: 'A. 建筑物', value: 'A' },
              { label: 'B. 封口 / 关闭', value: 'B' },
              { label: 'C. 方向', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"门"代表封口、关闭。'
          },
          {
            prompt: '线索 3：环',
            inputType: 'choice',
            choices: [
              { label: 'A. 首尾相接 / 环形', value: 'A' },
              { label: 'B. 装饰品', value: 'B' },
              { label: 'C. 环境保护', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！"环"代表首尾相接、环形。'
          },
          {
            prompt: '综合三条线索：循环 + 关闭 + 环形，目标词语是？',
            inputType: 'text',
            accept: ['闭环', '閉環'],
            feedback: '完美！"闭"（关闭/封口）+ "环"（环形/首尾相接）= 闭环！'
          }
        ]
      }
    ]
  },

  // ==================== 谜题 3：对齐 ====================
  {
    id: 'duiqi',
    word: '对齐',
    selectHint: '让所有人的想法朝同一个方向看',
    category: '沟通类',
    toxicity: 3,
    knowledgeCard: {
      example: '"我们先对齐一下认知，确保大家在同一频道上。"\n\n翻译：你们没按我的想法来，重新听我说一遍。',
      abuse: '常出现在跨部门沟通和项目启动会中，把简单的"统一意见"包装成军事级的协同操作。实际上"对齐"之后往往什么都没改变。'
    },
    levels: [
      // --- 关 1：符号方程 ---
      {
        type: 'symbol-equation',
        typeName: '符号方程',
        title: '关 1 · 符号方程',
        answer: '2',
        answerDisplay: '2',
        hint: '两条平行线代表"同向"，箭头代表"方向一致"。这是几个事物之间的关系？',
        steps: [
          {
            prompt: '观察下方交通符号等式，它表达了什么含义？',
            content: 'equation-traffic',
            inputType: 'choice',
            choices: [
              { label: 'A. 两条线同向行驶 / 方向一致', value: 'A' },
              { label: 'B. 平行停车', value: 'B' },
              { label: 'C. 道路合并', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！两条平行线（同向）+ 箭头（方向一致），表达"两条线方向一致"的关系。'
          },
          {
            prompt: '"两条线方向一致"对应数字几？',
            inputType: 'number',
            accept: ['2'],
            feedback: '正确！"两条"线方向一致，对应数字 2，代表"两个事物达成一致"。中间答案为 2。'
          }
        ]
      },
      // --- 关 2：数字逻辑推理 ---
      {
        type: 'number-logic',
        typeName: '数字逻辑推理',
        title: '关 2 · 数字逻辑推理',
        answer: '一',
        answerDisplay: '一',
        hint: '偏差值序列 5→3→1→? 在收敛，下一个是 0。偏差归零意味着"归一/统一"。',
        steps: [
          {
            prompt: '观察下方偏差值序列，找出规律并填入下一个数字',
            content: 'sequence-deviation',
            inputType: 'number',
            accept: ['0'],
            feedback: '正确！序列 5→3→1→0，偏差值在递减收敛，最终归零。'
          },
          {
            prompt: '偏差值归零意味着什么？',
            inputType: 'choice',
            choices: [
              { label: 'A. 完全失败', value: 'A' },
              { label: 'B. 归一 / 统一', value: 'B' },
              { label: 'C. 重新开始', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！偏差归零 = 所有事物达到同一标准 = 归一/统一。'
          },
          {
            prompt: '用哪个汉字表示"归一/统一"的概念？',
            inputType: 'text',
            accept: ['一', '壹'],
            feedback: '正确！"一"代表归一、统一。中间答案为"一"。'
          }
        ]
      },
      // --- 关 3：文字密码链 ---
      {
        type: 'character-cipher',
        typeName: '文字密码链',
        title: '关 3 · 文字密码链',
        answer: '齐',
        answerDisplay: '齐',
        hint: '"齐"的繁体"齊"由三个"禾"组成。三棵禾苗等高排列代表"整齐/一致"。',
        steps: [
          {
            prompt: '观察"齊"字（"齐"的繁体），它由几个"禾"（禾苗）组成？',
            content: 'decompose-qi',
            inputType: 'number',
            accept: ['3', '三'],
            feedback: '正确！"齊"由三个"禾"组成。'
          },
          {
            prompt: '三棵禾苗等高排列，在古义中代表什么？',
            inputType: 'choice',
            choices: [
              { label: 'A. 丰收', value: 'A' },
              { label: 'B. 整齐 / 一致 / 等高', value: 'B' },
              { label: 'C. 农田', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！三棵禾苗等高排列 = 整齐、一致、等高。'
          },
          {
            prompt: '这个字的简体形式是？',
            inputType: 'text',
            accept: ['齐', '齊'],
            feedback: '正确！简体形式为"齐"。中间答案为"齐"。'
          }
        ]
      },
      // --- 关 4：多维度缩窄 ---
      {
        type: 'multi-narrow',
        typeName: '多维度缩窄 · 组合还原',
        title: '关 4 · 多维度缩窄',
        answer: '对齐',
        answerDisplay: '对齐',
        hint: '"2"=两个事物，"一"=统一/归一，"齐"=等高/整齐。组合起来是什么词？',
        steps: [
          {
            prompt: '将前 3 关的中间答案与对应的语义维度匹配。\n线索 1：2',
            inputType: 'choice',
            choices: [
              { label: 'A. 两个事物之间的关系', value: 'A' },
              { label: 'B. 序号', value: 'B' },
              { label: 'C. 数量', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！"2"代表两个事物之间的关系。'
          },
          {
            prompt: '线索 2：一',
            inputType: 'choice',
            choices: [
              { label: 'A. 第一名', value: 'A' },
              { label: 'B. 统一 / 归一 / 达到同一标准', value: 'B' },
              { label: 'C. 单独', value: 'C' }
            ],
            accept: ['B'],
            feedback: '正确！"一"代表统一、归一、达到同一标准。'
          },
          {
            prompt: '线索 3：齐',
            inputType: 'choice',
            choices: [
              { label: 'A. 等高 / 整齐 / 相同水平', value: 'A' },
              { label: 'B. 一起', value: 'B' },
              { label: 'C. 全部', value: 'C' }
            ],
            accept: ['A'],
            feedback: '正确！"齐"代表等高、整齐、相同水平。'
          },
          {
            prompt: '综合三条线索：两个事物 + 统一 + 等高，目标词语是？',
            inputType: 'text',
            accept: ['对齐', '對齊'],
            feedback: '完美！"对"（相对/两个事物）+ "齐"（等高/整齐）= 对齐！'
          }
        ]
      }
    ]
  }
];
