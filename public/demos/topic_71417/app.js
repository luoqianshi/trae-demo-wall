// ==================== 言炼AI输入助手 Demo ====================

// ============ 状态管理 ============
const state = {
  currentMode: 'refine',
  currentScenario: 'chat',
  currentStyle: 'balanced',
  isOptimizing: false,
  debounceTimer: null,
  currentOptimizedText: '',
  originalText: '',
  currentVersion: 0, // 当前是第几个版本（用于"换一个"）
  currentExampleKey: null, // 当前使用的示例key
  stats: {
    count: 0,
    savedTokens: 0,
    totalOriginal: 0,
    totalOptimized: 0
  },
  // 每个场景的独立对话历史
  scenarioMessages: {
    chat: [],
    code: [],
    email: [],
    doc: [],
    creative: []
  }
};

// ============ 场景配置 ============
const scenarios = {
  chat: {
    name: 'AI对话',
    icon: '💬',
    phrases: ['请用中文回答', '分点说明', '给出具体例子', '通俗易懂', '深入分析', '总结一下'],
    greeting: '你好！我是AI对话助手，有什么可以帮你的？',
    examples: [
      { key: 'study1', label: '解释一下什么是Transformer' }
    ]
  },
  code: {
    name: '编程开发',
    icon: '💻',
    phrases: ['TypeScript', 'React Hooks', '完整错误处理', '添加中文注释', 'Tailwind CSS', '响应式布局', '性能优化'],
    greeting: '你好！我是编程助手，可以帮你写代码、调bug、解释技术问题。',
    examples: [
      { key: 'code1', label: '写Python批量处理图片脚本' },
      { key: 'code2', label: '写React登录页面组件' }
    ]
  },
  email: {
    name: '邮件写作',
    icon: '📧',
    phrases: ['语气正式', '商务礼貌', '简洁明了', '结尾致意', '主题明确', '分段清晰'],
    greeting: '你好！我是邮件写作助手，可以帮你撰写各类商务邮件。',
    examples: [
      { key: 'email1', label: '给张总写邮件说项目延期' }
    ]
  },
  doc: {
    name: '文档撰写',
    icon: '📝',
    phrases: ['结构清晰', '逻辑严谨', '数据支撑', '案例说明', '专业术语', '参考资料'],
    greeting: '你好！我是文档写作助手，可以帮你撰写报告、方案、技术文档等。',
    examples: []
  },
  creative: {
    name: '创意写作',
    icon: '🎨',
    phrases: ['有趣生动', '引人入胜', '金句频出', '故事化表达', '情感共鸣', '独特视角'],
    greeting: '你好！我是创意写作助手，可以帮你写文案、故事、广告语等。',
    examples: []
  }
};

// ============ 预设示例数据 ============
// 每个示例包含：原文 + 3种风格 × 3个版本的优化结果
const exampleData = {
  // ========== 编程场景 ==========
  code1: {
    original: '那个，我想请问一下哈，你能不能帮我写一个Python的脚本啊，就是那种可以批量处理图片的脚本。具体来说呢，就是我有一个文件夹，里面有好多好多图片，我想要把它们都统一调整成一样的大小，然后呢，最好还能加上水印，水印的文字就是我公司的名字对吧。然后处理完的图片要保存到另外一个文件夹里，不要覆盖原图。还有哦，最好能处理一下出错的情况，比如有些图片可能打不开什么的，就跳过它，不要让整个脚本都崩掉了，那样就不太好了。你明白我的意思吧？',
    refine: {
      strict: [
        'Python脚本：批量处理图片\n1. 读取文件夹所有图片\n2. 统一调整尺寸\n3. 添加文字水印（公司名）\n4. 输出到新文件夹\n5. 异常跳过，不中断',
        '写Python图片批处理脚本：\n• 遍历指定文件夹图片\n• 统一resize到目标尺寸\n• 加公司名文字水印\n• 保存到输出目录\n• 异常捕获，单张失败不影响整体',
        'Python图片批处理脚本：\n功能：批量resize + 水印 + 异常跳过\n输入：源文件夹路径\n输出：目标文件夹\n要求：单张出错不中断整个流程'
      ],
      balanced: [
        '帮我写一个Python批量处理图片的脚本，需要实现以下功能：\n1. 读取指定文件夹中的所有图片\n2. 统一调整到指定尺寸\n3. 添加公司名称文字水印\n4. 处理后的图片保存到新文件夹，不覆盖原图\n5. 异常处理：单张图片读取失败时跳过，不中断整体流程',
        '请写一个Python图片批量处理脚本，功能包括：\n- 批量读取文件夹中的图片文件\n- 统一调整图片大小到指定尺寸\n- 为每张图片添加文字水印（公司名称）\n- 结果输出到独立文件夹，避免覆盖原图\n- 做好异常处理，遇到无法读取的图片直接跳过',
        'Python脚本需求：批量图片处理工具\n\n功能清单：\n1. 遍历源文件夹所有图片\n2. 统一调整图片尺寸\n3. 添加公司名文字水印\n4. 保存到指定输出目录\n5. 异常容错：单张失败不影响其他图片处理'
      ],
      safe: [
        '你好，请帮我写一个Python脚本，用于批量处理图片。\n\n具体需求如下：\n1. 输入：指定一个包含图片的文件夹路径\n2. 处理内容：将文件夹中所有图片统一调整为指定的大小（尺寸可配置）\n3. 附加功能：在处理后的图片上添加文字水印，水印内容为公司名称\n4. 输出：处理完成的图片保存到另一个指定文件夹中，请确保不要覆盖原始图片\n5. 异常处理：请考虑容错机制，如果某张图片无法读取或处理失败，请跳过该图片继续处理其他图片，不要让整个脚本崩溃\n\n请确保代码有适当的注释，方便后续维护。谢谢！',
        '请帮我编写一个Python脚本，实现批量图片处理功能。\n\n详细需求：\n- 脚本需要能够处理指定文件夹中的所有图片文件\n- 支持将所有图片统一调整为指定的尺寸大小\n- 每张图片需要添加文字水印，水印内容是公司名称\n- 处理后的图片请保存到一个单独的输出文件夹中，避免覆盖原图\n- 需要有完善的错误处理机制，当遇到无法打开的图片文件时，能够自动跳过继续处理下一张，保证整个批处理过程不会中断\n\n代码请写得清晰易懂，加上必要的注释说明。',
        '您好，我需要一个Python图片批量处理脚本，麻烦帮我写一下。\n\n功能描述：\n1. 读取源文件夹内的全部图片文件\n2. 所有图片统一调整到目标尺寸（可配置）\n3. 每张图片添加公司名称文字水印\n4. 处理结果保存到目标文件夹，不修改原图\n5. 异常情况处理：如果个别图片损坏或无法读取，请跳过该文件继续处理，不要让整个程序停止运行\n\n希望代码结构清晰，有注释说明，方便后续修改和扩展。非常感谢！'
      ]
    },
    generate: {
      strict: [''], // 生成模式的结果在generateCode函数中
      balanced: [''],
      safe: ['']
    }
  },
  
  code2: {
    original: '那个，我想请你帮我写一个React的登录页面组件行不行。需要有用户名和密码的输入框对吧，然后还要有记住我和忘记密码的功能。登录按钮点击之后呢要调用API去验证，验证成功了就跳转到首页，失败的话就显示错误提示。样式的话要用Tailwind CSS来写，还要有表单验证，比如用户名不能为空啊密码不能少于6位什么的。',
    refine: {
      strict: [
        'React登录页组件（Tailwind CSS）\n功能：\n1. 用户名/密码输入\n2. 记住我 + 忘记密码\n3. 登录调API验证\n4. 成功跳首页，失败显错误\n5. 表单验证：用户名为空检测，密码≥6位',
        '写React登录组件：\n• 表单：用户名、密码\n• 选项：记住我、忘记密码\n• 提交：调登录API\n• 跳转：成功→首页\n• 验证：用户名必填、密码≥6位\n• 样式：Tailwind CSS',
        'React登录页面实现：\n技术栈：React + Tailwind CSS\n功能点：登录表单、记住我、忘记密码、API调用、路由跳转、错误提示、表单校验'
      ],
      balanced: [
        '请帮我写一个React登录页面组件，使用Tailwind CSS样式。\n\n需要包含以下功能：\n1. 用户名和密码输入框\n2. 「记住我」复选框和「忘记密码」链接\n3. 点击登录按钮调用API进行验证\n4. 验证成功后跳转到首页\n5. 验证失败显示错误提示信息\n6. 表单验证：用户名不能为空，密码长度不能少于6位',
        '写一个React登录页面组件，要求如下：\n- 使用Tailwind CSS进行样式开发\n- 包含用户名、密码两个输入框\n- 有「记住我」勾选框和「忘记密码」链接\n- 点击登录按钮后调用后端API验证身份\n- 验证通过跳转到首页，失败则显示错误提示\n- 前端表单校验：用户名必填，密码至少6位',
        'React登录页面组件开发需求：\n\n技术栈：React + Tailwind CSS\n\n功能列表：\n1. 登录表单（用户名 + 密码）\n2. 记住我复选框 + 忘记密码入口\n3. 登录按钮调用验证API\n4. 成功跳转首页 / 失败显示错误\n5. 前端表单验证（用户名非空、密码≥6位）\n6. 使用Tailwind CSS实现响应式布局'
      ],
      safe: [
        '你好，请帮我实现一个React的登录页面组件，样式使用Tailwind CSS来写。\n\n具体功能需求如下：\n\n1. 表单字段：\n   - 用户名输入框\n   - 密码输入框\n\n2. 辅助功能：\n   - 「记住我」复选框选项\n   - 「忘记密码」文字链接\n\n3. 登录逻辑：\n   - 点击登录按钮后，调用后端API进行身份验证\n   - 验证成功的话，跳转到系统首页\n   - 验证失败的话，在页面上显示错误提示信息\n\n4. 表单验证：\n   - 用户名为空时不能提交，提示请输入用户名\n   - 密码长度少于6位时不能提交，提示密码至少6位\n\n5. 样式要求：\n   - 使用Tailwind CSS实现\n   - 页面居中，美观大方\n   - 适配移动端显示\n\n请写得详细一些，方便我直接使用。谢谢！',
        '请帮我开发一个React登录页面组件，使用Tailwind CSS做样式。\n\n详细需求说明：\n\n一、页面元素\n- 用户名输入框（带标签）\n- 密码输入框（带标签，密码隐藏显示）\n- 记住我复选框\n- 忘记密码链接\n- 登录提交按钮\n\n二、交互逻辑\n- 点击登录按钮，调用登录API接口\n- API返回成功：跳转到首页路由\n- API返回失败：在表单上方显示错误信息\n\n三、表单校验\n- 提交前校验用户名是否为空\n- 提交前校验密码长度是否≥6位\n- 校验不通过显示对应提示\n\n四、样式要求\n- 使用Tailwind CSS框架\n- 卡片式登录框，页面垂直水平居中\n- 响应式设计，支持移动端\n- 按钮hover、focus等交互状态\n\n请提供完整可运行的组件代码。',
        '您好，需要一个React登录页面组件，用Tailwind CSS写样式。麻烦帮我实现一下。\n\n完整需求：\n\n【界面部分】\n- 居中的登录卡片\n- 标题：欢迎登录\n- 用户名输入框 + 标签\n- 密码输入框 + 标签\n- 记住我复选框 + 忘记密码链接（左右排列）\n- 登录按钮（全宽）\n\n【功能部分】\n- 表单状态管理（受控组件）\n- 点击登录调用API（用fetch示例）\n- 登录成功：useNavigate跳转首页\n- 登录失败：显示错误提示文字\n\n【验证部分】\n- 用户名：必填，空值提示\n- 密码：必填，至少6位\n- 实时校验或提交时校验均可\n\n【样式部分】\n- Tailwind CSS实现\n- 现代简洁风格\n- 响应式布局\n- 按钮加载状态（可选）\n\n代码请加上注释，谢谢！'
      ]
    },
    generate: {
      strict: [''],
      balanced: [''],
      safe: ['']
    }
  },
  
  // ========== 邮件场景 ==========
  email1: {
    original: '张总您好啊，我想跟您说个事，就是关于我们现在这个项目的进展情况。本来呢我们预计是这个月底就能完成的对吧，但是现在呢可能要推迟一下下。为什么呢，主要是因为之前需求有一些变更，然后团队里面还有两个人请假了，所以进度就受到了一些影响。我们现在评估了一下，大概要推迟两周左右吧，也就是下个月中旬的样子才能完成。您看这样行不行啊？有什么问题的话随时跟我说哈。',
    refine: {
      strict: [
        '张总：\n项目原计划月底完成，因需求变更+2人请假，进度受影响。\n预估延期两周，下月中旬完成。\n妥否，请批示。',
        '张总您好：\n汇报项目进展：原计划月底交付，因需求变更及人员请假，预计延期两周（下月中旬完成）。\n请知悉，有问题随时沟通。',
        '张总：\n项目延期汇报：\n原因：需求变更、2人请假\n影响：预计延期2周\n新交付时间：下月中旬\n请批示。'
      ],
      balanced: [
        '张总您好：\n\n现就项目进展向您汇报：\n\n项目原计划本月底完成，但受两方面因素影响，交付时间需要调整：\n1. 前期需求发生部分变更，增加了开发工作量\n2. 团队有两名成员请假，对项目进度造成一定影响\n\n经团队重新评估，预计项目将延期两周，即下月中旬可完成交付。\n\n给您带来的不便深表歉意。如有疑问，请随时与我沟通。\n\n此致',
        '张总：\n\n您好！关于项目进展情况，向您做一个简要汇报。\n\n原计划本月底完成的项目，目前遇到一些情况：一方面前期需求有所调整，增加了工作量；另一方面团队近期有两人请假，人力安排受到影响。综合以上因素，项目进度需要顺延。\n\n经过重新评估排期，新的预计完成时间为下月中旬，整体延期约两周。\n\n我们会全力推进项目，确保质量不受影响。如您有任何意见或问题，欢迎随时沟通。\n\n祝工作顺利！',
        '张总您好：\n\n项目进展汇报：\n\n原定于本月底交付的项目，因以下原因需要延期：\n1. 需求变更：项目过程中部分需求进行了调整，增加了开发内容\n2. 人员因素：团队两名成员近期请假，影响了整体进度\n\n经过重新评估和排期调整，预计项目可于下月中旬完成，延期约两周时间。\n\n我们将优化剩余工作安排，尽量追赶进度。如有问题，请随时联系。\n\n谢谢！'
      ],
      safe: [
        '张总：\n\n您好！\n\n今天写这封邮件，主要是想向您汇报一下目前项目的进展情况，以及我们对后续交付时间的评估。\n\n首先说明一下，按照最初的计划，这个项目应该是在本月底就可以完成交付的。但是在实际执行过程中，我们遇到了一些之前没有完全预料到的情况，对项目进度造成了一定的影响。\n\n具体来说，主要有两个方面的原因：\n第一，项目进行到中期的时候，需求方面有一些调整和变更，这部分新增的需求需要额外的开发时间来完成；\n第二，最近团队里面有两位同事因为个人原因请假了，人手方面相对紧张，对整体的推进速度有一定影响。\n\n鉴于以上情况，我们团队对剩余工作重新做了评估和排期。目前来看，项目大概需要推迟两周左右的时间，也就是到下个月中旬的样子可以完成全部开发工作并交付。\n\n虽然时间上有所推迟，但请您放心，我们会严格把控质量关，确保交付的产品符合要求。同时团队也会在力所能及的范围内尽量优化流程、提高效率，争取把延误的时间压缩到最小。\n\n以上就是项目的最新进展情况，想先跟您通个气，看看您这边有没有什么意见或者建议。如果有任何问题，您随时都可以找我沟通。\n\n给您带来的不便还请谅解！\n\n祝工作顺利，身体健康！',
        '张总您好：\n\n冒昧打扰，想跟您汇报一下当前项目的进展和后续安排。\n\n先回顾一下原计划：项目启动时我们约定的交付时间是这个月底。团队一直在按这个目标推进，但是近期有两个因素叠加，对进度产生了比较大的影响，我觉得有必要及时跟您同步一下。\n\n第一个因素是需求方面的变化。项目进行过程中，我们根据实际业务情况对部分需求做了调整和补充。这些调整虽然对最终产品质量有帮助，但确实也增加了不少开发工作量，相应地需要更多时间来完成。\n\n第二个因素是团队人员的变动。最近团队里有两位同事因为个人事务请假了，这在一定程度上影响了我们的人力安排和开发节奏。虽然我们做了相应的调整和分担，但整体进度还是受到了一些影响。\n\n基于这两方面的情况，我们团队最近重新梳理了剩余的工作任务，并做了新的排期评估。综合来看，项目整体需要延后大约两周时间，新的预计完成时间是下个月中旬。\n\n对于这个延期，我们团队也在积极想办法应对。一方面是优化现有的工作流程，提高开发效率；另一方面也在考虑是否可以通过调整优先级的方式，先交付核心功能，后续再补充其他部分。如果您对这个方案有什么想法，也欢迎提出来讨论。\n\n质量方面请您放心，虽然时间紧，但我们不会因为赶进度而放松对质量的要求。每一项功能都会经过充分的测试，确保交付的产品是稳定可靠的。\n\n以上就是目前的情况，先跟您汇报一下，也想听听您的意见。如果有任何问题或者需要进一步沟通的地方，您随时联系我就好。\n\n谢谢张总！\n\n祝好！',
        '张总：\n\n您好！\n\n今天想和您聊聊项目进展的事。说起来有点不好意思，项目可能要比原定计划晚一些才能交付，我先跟您详细说明一下情况。\n\n按照最初的时间表，我们是打算这个月底把项目做完交付的。这段时间团队也一直在朝这个目标努力。但事情总是赶不上变化，最近出现了两个情况，加在一起对进度影响还挺大的。\n\n先说第一个，就是需求的问题。做项目的过程中，我们一边做一边和业务方沟通，发现有些地方之前想得不够周全，需要补充和调整一些功能。这些调整从产品角度来说是好事，能让最终的效果更好，但客观上确实增加了开发量，需要更多时间来实现。\n\n然后第二个情况，就是团队这边最近有两个同事请假了。一个是因为家里有事，另一个是身体不太舒服需要休息。这两位都是项目的核心成员，他们一请假，很多工作的推进速度就慢下来了。虽然我们也做了安排，让其他同事尽量分担，但效果还是有限的。\n\n这两个事情碰到一起，我们就不得不重新评估一下剩余的工作量和需要的时间。团队这边仔细算了算，觉得大概需要多两周的时间比较稳妥，也就是说，到下个月中旬应该可以全部做完并交付给您。\n\n说实话，延期这件事我们也挺着急的，也在想各种办法尽量追赶。比如调整一下优先级，把最核心的功能先做出来，其他的可以后面再补；比如大家这段时间加加班，尽量把落下的进度赶回来一些。具体怎么安排，也想听听您的意见，看看您这边对优先级是怎么考虑的。\n\n质量方面您不用担心，我们不会因为赶时间就敷衍了事。该做的测试、该走的流程，一样都不会少。延期总比交付一个有问题的产品要好，这个道理我们懂。\n\n所以今天写这封邮件，主要就是把情况跟您说清楚，让您心里有个数。如果您有什么想法、或者有什么更好的建议，随时找我聊都可以。我们一起商量着来，争取把这件事处理好。\n\n给您添麻烦了，实在抱歉！\n\n祝好！'
      ]
    },
    generate: {
      strict: [''],
      balanced: [''],
      safe: ['']
    }
  },
  
  // ========== 学习/对话场景 ==========
  study1: {
    original: '那个，我想了解一下什么是Transformer来着，就是那个在自然语言处理里面特别火的模型对吧。我之前其实学过RNN还有LSTM什么的，但是Transformer好像跟它们不太一样的样子。你能不能用那种通俗易懂的方式给我解释一下啊，它的核心思想到底是什么呢，为什么效果这么好啊，还有那个self-attention到底是怎么工作的呀，最好能举个简单的例子说明一下就更好了。',
    refine: {
      strict: [
        '解释Transformer模型：\n1. 是什么\n2. 和RNN/LSTM区别\n3. 核心思想\n4. 为何效果好\n5. self-attention工作原理\n6. 举例说明\n通俗解释',
        'Transformer通俗解释：\n• 是什么（NLP热门模型）\n• 与RNN/LSTM的不同\n• 核心思想\n• 效果好的原因\n• self-attention原理\n• 举个简单例子',
        '请通俗解释Transformer：\n1. 基本概念\n2. 相比RNN/LSTM的差异\n3. 核心机制（self-attention）\n4. 优势何在\n5. 简单示例'
      ],
      balanced: [
        '请用通俗易懂的方式解释一下Transformer模型：\n\n1. Transformer到底是什么？为什么在NLP领域这么火？\n2. 它和我之前学过的RNN、LSTM有什么不一样？\n3. Transformer的核心思想是什么？\n4. 为什么它的效果这么好？\n5. self-attention是怎么工作的？\n6. 最好能举一个简单的例子来说明',
        '想了解一下Transformer模型，麻烦用通俗的语言解释一下：\n\n- Transformer是什么，为什么在自然语言处理中这么热门？\n- 和传统的RNN、LSTM相比，主要区别在哪里？\n- 它的核心设计思想是什么？\n- 为什么效果比之前的模型好？\n- self-attention机制的工作原理是怎样的？\n- 能不能举个简单的例子帮助理解？',
        '请通俗讲解Transformer模型：\n\n背景：我学过RNN和LSTM，了解基本的深度学习概念。\n\n请回答以下问题：\n1. Transformer是什么？为什么在NLP领域影响这么大？\n2. 和RNN/LSTM相比，核心差异是什么？\n3. Transformer的核心思想是什么？\n4. 为什么它的效果这么出色？\n5. self-attention具体是怎么工作的？\n6. 举一个简单易懂的例子'
      ],
      safe: [
        '你好，我想学习一下Transformer模型，但是看了很多资料还是感觉不太懂，能不能麻烦你用比较通俗易懂的方式给我解释一下呀？\n\n我先说说我的背景吧：之前学过一些基础的深度学习知识，对RNN和LSTM有一定了解，知道它们是用来处理序列数据的。但是Transformer出来之后好像完全不一样了，而且效果特别好，在自然语言处理里面几乎到处都在用，所以我也想好好学一下。\n\n我想了解的问题主要有这几个方面：\n\n第一，Transformer到底是什么？它为什么在NLP领域这么火，感觉现在什么地方都在用它？\n\n第二，它和我之前学的RNN、LSTM这些模型相比，最主要的区别在哪里？为什么说它是一个很大的突破？\n\n第三，Transformer的核心思想到底是什么？我经常听到说"注意力机制"是关键，但具体是怎么回事还是不太清楚。\n\n第四，为什么Transformer的效果这么好？相比之前的模型，它的优势主要体现在哪些地方？\n\n第五，self-attention到底是怎么工作的？这个我最困惑了，看了公式还是不太理解实际是怎么运作的。\n\n最后，如果你能举一个简单的例子来说明就最好了，这样我更容易理解。\n\n麻烦你讲得尽量通俗一点，不要太多公式和数学推导，我主要想先理解概念和原理。谢谢啦！',
        '您好！想向您请教一下Transformer模型的相关知识。\n\n我目前的情况是这样的：我正在学习自然语言处理，之前已经了解了RNN、LSTM这些传统的循环神经网络模型，对序列建模有基本的概念。但是最近在学习Transformer的时候，感觉和之前的模型思路完全不一样，理解起来有点困难。\n\n所以想请您用比较通俗易懂的方式，帮我系统地梳理一下Transformer的相关知识。具体来说，我希望您能帮我解答以下几个问题：\n\n1. Transformer究竟是一个什么样的模型？它为什么能在NLP领域引起这么大的反响，几乎成为了标配？\n\n2. 与传统的RNN和LSTM相比，Transformer在架构设计上有什么根本的不同？这些不同带来了什么优势？\n\n3. Transformer的核心设计思想是什么？注意力机制（Attention）在里面扮演了什么角色？\n\n4. 为什么Transformer的效果普遍比之前的模型要好？它解决了之前模型的哪些痛点问题？\n\n5. self-attention（自注意力）具体是怎么工作的？这个概念我一直有点模糊，能不能详细解释一下它的计算过程？\n\n6. 能不能举一个简单具体的例子，说明self-attention在实际中是怎么应用的？这样我可能更容易理解。\n\n如果您在解释的时候能够尽量少用复杂的数学公式，多用生活化的例子和类比来说明，那就更好了。我现在的阶段主要是想把概念理解清楚，还没到深入数学推导的程度。\n\n非常感谢您的耐心解答！',
        '你好，我最近在学Transformer，但是有很多地方不太明白，想请你帮我讲一讲。\n\n先介绍一下我的基础吧：我之前学过神经网络的基础知识，也了解RNN和LSTM是什么，知道它们是用来处理像文本这样的序列数据的。但是Transformer出来之后，好像整个NLP领域都变天了，各种模型都开始用Transformer，效果也特别好。我就很好奇，想搞明白它到底厉害在哪里。\n\n但是看了一些论文和教程之后，我发现Transformer的概念还是挺抽象的，特别是那个self-attention，看了好几遍还是似懂非懂的。所以想请你用更通俗的方式给我解释一下，最好能少点公式，多点生活化的例子，这样我比较容易理解。\n\n具体来说，我有这么几个问题想搞清楚：\n\n第一个问题：Transformer到底是个什么东西？为什么它一出来就这么火，现在做NLP的好像都在用它？\n\n第二个问题：它跟RNN、LSTM比起来，到底有什么不一样的地方？为什么说它是一个很大的进步？\n\n第三个问题：Transformer的核心想法到底是什么？为什么叫"注意力"机制，这个"注意力"到底指的是什么？\n\n第四个问题：为什么Transformer效果这么好？它到底解决了之前模型的什么问题？\n\n第五个问题：self-attention是怎么运作的？我一直没太搞明白，自己跟自己注意是什么意思？能不能举个具体的例子说明一下？\n\n最后，如果可以的话，能不能用一个简单的例子从头到尾演示一下Transformer是怎么处理一句话的？这样可能我就一下子明白了。\n\n麻烦你解释的时候尽量说得直白一点，不要太学术化，最好能打比方、举例子。非常感谢！'
      ]
    },
    generate: {
      strict: [''],
      balanced: [''],
      safe: ['']
    }
  }
};

// ============ 生成模式的预设结果 ============
function generateEmail() {
  return `主题：关于项目延期的汇报

张总：

    您好！

    现就项目进展情况向您汇报如下：

    项目原计划于本月底完成交付，但受以下两方面因素影响，进度需要调整：

    一、需求变更：项目推进过程中，部分需求根据实际情况进行了调整和补充，新增了一定的开发工作量。

    二、人员因素：近期团队有两名核心成员因个人原因请假，对整体开发节奏造成一定影响。

    经团队重新评估排期并优化剩余工作安排，预计项目可于下月中旬完成交付，整体延期约两周时间。

    我们将继续全力推进项目，在保证质量的前提下尽量追赶进度。给您带来的不便深表歉意。

    如有任何疑问，请随时沟通。

                                          此致
                                          敬礼`;
}

function generateCode(exampleKey) {
  if (exampleKey === 'code1') {
    return `import os
from PIL import Image, ImageDraw, ImageFont

def batch_process_images(input_dir, output_dir, target_size=(800, 600), watermark_text=''):
    """
    批量处理图片：调整大小 + 添加水印
    
    Args:
        input_dir: 输入文件夹路径
        output_dir: 输出文件夹路径
        target_size: 目标尺寸 (width, height)
        watermark_text: 水印文字
    """
    # 创建输出目录
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 支持的图片格式
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff')
    
    success_count = 0
    failed_count = 0
    
    # 遍历输入文件夹
    for filename in os.listdir(input_dir):
        # 跳过非图片文件
        if not filename.lower().endswith(valid_extensions):
            continue
            
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, f'processed_{filename}')
        
        try:
            # 打开图片
            with Image.open(input_path) as img:
                # 调整大小
                img = img.resize(target_size, Image.Resampling.LANCZOS)
                
                # 添加水印
                if watermark_text:
                    draw = ImageDraw.Draw(img)
                    # 使用默认字体
                    font = ImageFont.load_default()
                    # 水印位置：左下角
                    text_bbox = draw.textbbox((0, 0), watermark_text, font=font)
                    text_width = text_bbox[2] - text_bbox[0]
                    text_height = text_bbox[3] - text_bbox[1]
                    position = (10, img.height - text_height - 10)
                    # 半透明白色文字
                    draw.text(position, watermark_text, fill=(255, 255, 255, 128), font=font)
                
                # 保存图片
                img.save(output_path)
                success_count += 1
                print(f'[成功] {filename}')
                
        except Exception as e:
            failed_count += 1
            print(f'[失败] {filename}: {str(e)}')
            continue
    
    # 打印统计
    print(f'\\n处理完成：成功 {success_count} 张，失败 {failed_count} 张')
    return success_count, failed_count


# 使用示例
if __name__ == '__main__':
    batch_process_images(
        input_dir='./input_images',
        output_dir='./output_images', 
        target_size=(800, 600),
        watermark_text='公司名称'
    )`;
  } else if (exampleKey === 'code2') {
    return `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 登录页面组件
 * 使用 Tailwind CSS 样式
 */
export default function LoginPage() {
  const navigate = useNavigate();
  
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  
  // UI 状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  // 表单验证
  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!value.trim()) return '请输入用户名';
        return '';
      case 'password':
        if (!value) return '请输入密码';
        if (value.length < 6) return '密码长度不能少于6位';
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const errors = {};
    errors.username = validateField('username', formData.username);
    errors.password = validateField('password', formData.password);
    return errors;
  };

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // 清除对应字段错误
    if (error) setError('');
  };

  // 处理失焦
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  // 提交登录
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 标记所有字段为已触碰
    setTouched({ username: true, password: true });
    
    // 验证
    const errors = validateAll();
    if (errors.username || errors.password) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 调用登录API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // 保存token
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', data.token);
        // 跳转到首页
        navigate('/dashboard');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || '用户名或密码错误');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const usernameError = touched.username ? validateField('username', formData.username) : '';
  const passwordError = touched.password ? validateField('password', formData.password) : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            欢迎登录
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={'appearance-none rounded-lg relative block w-full px-3 py-2 border ' +
                  (usernameError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500') +
                  ' placeholder-gray-400 text-gray-900 focus:outline-none focus:z-10 sm:text-sm'}
                placeholder="请输入用户名"
              />
              {usernameError && (
                <p className="mt-1 text-sm text-red-600">{usernameError}</p>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={'appearance-none rounded-lg relative block w-full px-3 py-2 border ' +
                  (passwordError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500') +
                  ' placeholder-gray-400 text-gray-900 focus:outline-none focus:z-10 sm:text-sm'}
                placeholder="请输入密码（至少6位）"
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
          </div>

          {/* 记住我 & 忘记密码 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                记住我
              </label>
            </div>

            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                忘记密码？
              </a>
            </div>
          </div>

          {/* 登录按钮 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
  }
  return '// 代码生成结果';
}

// ============ 核心优化函数 ============

// 获取示例对应的key（通过匹配原文内容）
function matchExample(text) {
  for (const [key, data] of Object.entries(exampleData)) {
    // 计算相似度（简单匹配：原文包含示例的前20个字符）
    if (text.includes(data.original.slice(5, 20))) {
      return key;
    }
  }
  return null;
}

// 获取优化结果
function getOptimizedResult(text, style, scenario, version = 0) {
  // 先尝试匹配预设示例
  const exampleKey = matchExample(text);
  
  if (exampleKey && exampleData[exampleKey]) {
    const data = exampleData[exampleKey];
    const results = data.refine[style];
    if (results && results.length > 0) {
      const idx = version % results.length;
      return {
        text: results[idx],
        isPreset: true,
        exampleKey: exampleKey
      };
    }
  }
  
  // 没有匹配到预设，使用规则引擎做基础精简
  return {
    text: basicRefine(text, style),
    isPreset: false,
    exampleKey: null
  };
}

// 基础规则精简（用于自由输入）
function basicRefine(text, style) {
  let result = text.trim();
  
  // 去除常见口语词
  const fillers = ['那个', '这个', '就是', '然后', '就是说', '我觉得', '我想', 
                   '嗯', '啊', '吧', '呢', '嘛', '啦', '哦', '哈',
                   '其实', '说实话', '老实说', '基本上', '大概', '可能',
                   '一下', '一些', '有点', '有些', '的话', '什么的', '之类的'];
  
  fillers.forEach(word => {
    result = result.replace(new RegExp(word + '，', 'g'), '');
    result = result.replace(new RegExp('，' + word + '，', 'g'), '，');
    if (result.startsWith(word + '，')) {
      result = result.slice(word.length + 1);
    }
  });
  
  // 简单压缩
  result = result.replace(/因为/g, '因');
  result = result.replace(/所以/g, '故');
  result = result.replace(/但是/g, '但');
  result = result.replace(/如果/g, '若');
  result = result.replace(/而且/g, '且');
  result = result.replace(/能不能/g, '能否');
  result = result.replace(/可不可以/g, '能');
  
  // 风格差异
  if (style === 'strict') {
    result = result.replace(/，/g, '、');
    result = result.replace(/非常/g, '极');
    result = result.replace(/十分/g, '极');
    result = result.replace(/特别/g, '甚');
    result = result.replace(/比较/g, '较');
  }
  
  // 清理
  result = result.replace(/，+/g, '，');
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/。 /g, '。\n');
  
  return result;
}

// ============ UI 交互逻辑 ============

const el = {};

function initElements() {
  el.chatInput = document.getElementById('chatInput');
  el.yanlianBar = document.getElementById('yanlianBar');
  el.resultText = document.getElementById('resultText');
  el.resultLoading = document.getElementById('resultLoading');
  el.originalCount = document.getElementById('originalCount');
  el.optimizedCount = document.getElementById('optimizedCount');
  el.savePercent = document.getElementById('savePercent');
  el.savePill = document.getElementById('savePill');
  el.ylAcceptBtn = document.getElementById('ylAcceptBtn');
  el.ylRegenerateBtn = document.getElementById('ylRegenerateBtn');
  el.sendBtn = document.getElementById('sendBtn');
  el.chatMessages = document.getElementById('chatMessages');
  el.yanlianModeLabel = document.getElementById('yanlianModeLabel');
  
  // 统计
  el.statCount = document.getElementById('statCount');
  el.statTokens = document.getElementById('statTokens');
  el.statAvg = document.getElementById('statAvg');
  el.statMoney = document.getElementById('statMoney');
}

// 自动调整输入框高度
function autoResizeTextarea() {
  el.chatInput.style.height = 'auto';
  el.chatInput.style.height = Math.min(el.chatInput.scrollHeight, 200) + 'px';
}

// 防抖触发优化
function triggerOptimize() {
  clearTimeout(state.debounceTimer);
  
  const text = el.chatInput.value;
  
  // 文字太少不优化
  if (text.trim().length < 15) {
    hideYanlianBar();
    return;
  }
  
  state.debounceTimer = setTimeout(() => {
    showOptimizing(text);
  }, 500);
}

// 显示优化中状态
function showOptimizing(text) {
  state.originalText = text;
  state.isOptimizing = true;
  state.currentVersion = 0;
  
  // 检测是否是预设示例
  const exampleKey = matchExample(text);
  state.currentExampleKey = exampleKey;
  
  el.yanlianBar.style.display = 'block';
  el.resultLoading.style.display = 'flex';
  el.resultText.style.display = 'none';
  el.originalCount.textContent = text.length;
  el.yanlianModeLabel.textContent = state.currentMode === 'refine' ? '精简中' : '生成中';
  
  // 模拟AI处理延迟
  const delay = exampleKey ? 800 : 600;
  
  setTimeout(() => {
    let result;
    if (state.currentMode === 'refine') {
      const opt = getOptimizedResult(text, state.currentStyle, state.currentScenario, 0);
      result = opt.text;
    } else {
      // 生成模式
      if (exampleKey && (state.currentScenario === 'code' || state.currentScenario === 'email')) {
        result = state.currentScenario === 'code' ? generateCode(exampleKey) : generateEmail();
      } else {
        result = '基于您的需求，以下是生成的内容...\n\n（生成模式演示效果，实际使用中会调用AI生成完整内容）';
      }
    }
    
    state.currentOptimizedText = result;
    showResult(result);
  }, delay + Math.random() * 400);
}

// 显示优化结果（带打字机效果）
function showResult(result) {
  state.isOptimizing = false;
  
  el.resultLoading.style.display = 'none';
  el.resultText.style.display = 'block';
  
  // 判断是否是代码
  const isCode = state.currentScenario === 'code' && state.currentMode === 'generate';
  el.resultText.classList.toggle('code', isCode);
  
  // 打字机效果
  let i = 0;
  const speed = isCode ? 1 : Math.max(8, Math.floor(1500 / Math.max(result.length, 20)));
  el.resultText.textContent = '';
  
  const typeInterval = setInterval(() => {
    if (i < result.length) {
      el.resultText.textContent += result.charAt(i);
      i++;
      
      // 更新字数统计
      if (i % 10 === 0 || i === result.length) {
        el.optimizedCount.textContent = i;
        if (state.currentMode === 'refine') {
          const originalLen = state.originalText.length;
          const saved = Math.max(0, originalLen - i);
          const percent = Math.round((saved / originalLen) * 100);
          el.savePercent.textContent = percent + '%';
        }
      }
    } else {
      clearInterval(typeInterval);
      
      // 最终统计
      const originalLen = state.originalText.length;
      const optimizedLen = result.length;
      
      el.optimizedCount.textContent = optimizedLen;
      
      if (state.currentMode === 'refine') {
        const saved = Math.max(0, originalLen - optimizedLen);
        const percent = Math.round((saved / originalLen) * 100);
        el.savePercent.textContent = percent + '%';
        el.savePill.style.display = 'inline-block';
        animateSavePill();
      } else {
        el.savePill.style.display = 'none';
      }
    }
  }, speed);
}

// 节省徽章动画
function animateSavePill() {
  el.savePill.style.transform = 'scale(1.1)';
  el.savePill.style.transition = 'transform 0.2s ease';
  setTimeout(() => {
    el.savePill.style.transform = 'scale(1)';
  }, 200);
}

// 隐藏优化条
function hideYanlianBar() {
  el.yanlianBar.style.display = 'none';
  state.isOptimizing = false;
  state.currentExampleKey = null;
  clearTimeout(state.debounceTimer);
}

// 采纳优化结果
function acceptResult() {
  if (!state.currentOptimizedText) return;
  
  el.chatInput.value = state.currentOptimizedText;
  autoResizeTextarea();
  
  // 更新统计（只有精简模式算节省）
  if (state.currentMode === 'refine') {
    updateStats();
  }
  
  // 成功动画
  el.chatInput.classList.add('accept-success');
  setTimeout(() => {
    el.chatInput.classList.remove('accept-success');
  }, 400);
  
  hideYanlianBar();
  el.chatInput.focus();
  el.chatInput.selectionStart = el.chatInput.value.length;
  el.chatInput.selectionEnd = el.chatInput.value.length;
}

// 重新生成（换一个）
function regenerate() {
  if (!state.originalText) return;
  
  state.currentVersion++;
  
  // 如果是预设示例，切换到下一个版本
  if (state.currentExampleKey && exampleData[state.currentExampleKey] && state.currentMode === 'refine') {
    showOptimizingNewVersion();
    return;
  }
  
  // 否则重新触发优化
  showOptimizing(state.originalText);
}

// 显示新版本（预设示例的换一个）
function showOptimizingNewVersion() {
  el.resultLoading.style.display = 'flex';
  el.resultText.style.display = 'none';
  
  setTimeout(() => {
    const data = exampleData[state.currentExampleKey];
    const results = data.refine[state.currentStyle];
    const idx = state.currentVersion % results.length;
    const result = results[idx];
    
    state.currentOptimizedText = result;
    showResult(result);
  }, 500 + Math.random() * 300);
}

// 更新统计
function updateStats() {
  state.stats.count++;
  const saved = Math.max(0, state.originalText.length - state.currentOptimizedText.length);
  state.stats.savedTokens += saved;
  state.stats.totalOriginal += state.originalText.length;
  state.stats.totalOptimized += state.currentOptimizedText.length;
  
  el.statCount.textContent = state.stats.count;
  el.statTokens.textContent = state.stats.savedTokens;
  
  if (state.stats.totalOriginal > 0) {
    const avg = Math.round((state.stats.savedTokens / state.stats.totalOriginal) * 100);
    el.statAvg.textContent = avg + '%';
  }
  
  // 估算节省金额（按 GPT-4o-mini 约 ¥0.018 / 1k tokens 计算，1字≈1.5token）
  const savedTokensApprox = Math.round(state.stats.savedTokens * 1.5);
  const savedMoney = (savedTokensApprox / 1000 * 0.018).toFixed(2);
  el.statMoney.textContent = '¥' + savedMoney;
}

// 发送消息
function sendMessage() {
  const text = el.chatInput.value.trim();
  if (!text) return;
  
  // 添加用户消息到当前场景
  addMessage(text, 'user');
  
  // 清空输入
  el.chatInput.value = '';
  autoResizeTextarea();
  hideYanlianBar();
  
  // 模拟AI回复
  setTimeout(() => {
    const reply = generateReply(text);
    addMessage(reply, 'ai');
  }, 1000 + Math.random() * 1000);
}

// 添加消息
function addMessage(text, type) {
  const isUser = type === 'user';
  const avatar = isUser ? '👤' : '🤖';
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
  
  msgDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <p style="white-space: pre-wrap;">${escapeHtml(text)}</p>
    </div>
  `;
  
  el.chatMessages.appendChild(msgDiv);
  el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  
  // 保存到场景历史
  state.scenarioMessages[state.currentScenario].push({
    type: type,
    text: text
  });
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 模拟AI回复
function generateReply(userText) {
  const replies = [
    '好的，我来帮您处理这个问题。根据您的需求，我建议...',
    '这个问题很有意思，让我来详细解释一下...',
    '收到您的需求，我已经理解了。以下是我的建议：',
    '非常好的问题！让我从几个方面来分析...',
    '明白了，我来帮您解决这个问题。首先...'
  ];
  
  return replies[Math.floor(Math.random() * replies.length)] + '\n\n（这是Demo演示的模拟回复，实际使用中会调用真实AI接口）';
}

// 切换模式
function switchMode(mode) {
  state.currentMode = mode;
  
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  el.yanlianModeLabel.textContent = mode === 'refine' ? '精简中' : '生成中';
  
  // 如果当前有文字，重新触发优化
  if (el.chatInput.value.trim().length >= 15) {
    triggerOptimize();
  }
}

// 切换场景
function switchScenario(scenario) {
  if (scenario === state.currentScenario) return;
  
  // 保存当前场景的消息（已经在addMessage时保存了）
  
  // 切换场景
  state.currentScenario = scenario;
  
  document.querySelectorAll('.scenario-item').forEach(item => {
    item.classList.toggle('active', item.dataset.scenario === scenario);
  });
  
  // 清空当前对话显示
  el.chatMessages.innerHTML = '';
  
  // 清空输入框
  el.chatInput.value = '';
  autoResizeTextarea();
  hideYanlianBar();
  
  // 加载该场景的历史消息
  const messages = state.scenarioMessages[scenario];
  if (messages.length === 0) {
    // 如果没有历史消息，显示欢迎语
    addMessage(scenarios[scenario].greeting, 'ai');
    
    // 如果有示例，显示快速体验
    const exps = scenarios[scenario].examples;
    if (exps.length > 0) {
      let exampleHtml = '<p><strong>快速体验：</strong>点击下方示例，一键填入体验</p><div class="example-chips">';
      exps.forEach(exp => {
        exampleHtml += `<span class="example-chip" data-example="${exp.key}">${exp.label}</span>`;
      });
      exampleHtml += '</div>';
      
      const lastMsg = el.chatMessages.lastElementChild;
      if (lastMsg) {
        const contentDiv = lastMsg.querySelector('.message-content');
        if (contentDiv) {
          contentDiv.innerHTML += exampleHtml;
          // 重新绑定点击事件
          contentDiv.querySelectorAll('.example-chip').forEach(chip => {
            chip.addEventListener('click', () => fillExample(chip.dataset.example));
          });
        }
      }
    }
  } else {
    // 恢复历史消息
    messages.forEach(msg => {
      const isUser = msg.type === 'user';
      const avatar = isUser ? '👤' : '🤖';
      const msgDiv = document.createElement('div');
      msgDiv.className = 'message ' + (isUser ? 'user-message' : 'ai-message');
      msgDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <p style="white-space: pre-wrap;">${escapeHtml(msg.text)}</p>
        </div>
      `;
      el.chatMessages.appendChild(msgDiv);
    });
  }
  
  el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

// 切换风格
function switchStyle(style) {
  state.currentStyle = style;
  
  document.querySelectorAll('.style-item').forEach(item => {
    item.classList.toggle('active', item.dataset.style === style);
  });
  
  // 如果当前有预设示例且是精简模式，重新生成对应风格的结果
  if (state.currentExampleKey && state.currentMode === 'refine' && el.chatInput.value.trim().length >= 15) {
    state.currentVersion = 0;
    showOptimizingNewVersion();
  } else if (el.chatInput.value.trim().length >= 15) {
    triggerOptimize();
  }
}

// 填充示例
function fillExample(key) {
  const data = exampleData[key];
  if (!data) return;
  
  const text = data.original;
  el.chatInput.value = text;
  autoResizeTextarea();
  state.currentExampleKey = key;
  state.currentVersion = 0;
  triggerOptimize();
  el.chatInput.focus();
}

// ============ 快捷键支持 ============

function handleKeydown(e) {
  // Tab 键采纳
  if (e.key === 'Tab' && !e.shiftKey && state.currentOptimizedText && el.yanlianBar.style.display !== 'none') {
    e.preventDefault();
    acceptResult();
    return;
  }
  
  // Shift+Tab 换一个
  if (e.key === 'Tab' && e.shiftKey && el.yanlianBar.style.display !== 'none') {
    e.preventDefault();
    regenerate();
    return;
  }
  
  // Esc 关闭
  if (e.key === 'Escape' && el.yanlianBar.style.display !== 'none') {
    e.preventDefault();
    hideYanlianBar();
    return;
  }
  
  // Ctrl/Cmd + Enter 发送
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
    return;
  }
}

// ============ 初始化 ============

function init() {
  initElements();
  
  // 输入事件
  el.chatInput.addEventListener('input', () => {
    autoResizeTextarea();
    triggerOptimize();
  });
  
  // 键盘事件
  el.chatInput.addEventListener('keydown', handleKeydown);
  
  // 采纳按钮
  el.ylAcceptBtn.addEventListener('click', acceptResult);
  
  // 换一个按钮
  el.ylRegenerateBtn.addEventListener('click', regenerate);
  
  // 发送按钮
  el.sendBtn.addEventListener('click', sendMessage);
  
  // 模式切换
  document.getElementById('modeRefine').addEventListener('click', () => switchMode('refine'));
  document.getElementById('modeGenerate').addEventListener('click', () => switchMode('generate'));
  
  // 场景切换
  document.querySelectorAll('.scenario-item').forEach(item => {
    item.addEventListener('click', () => switchScenario(item.dataset.scenario));
  });
  
  // 风格切换
  document.querySelectorAll('.style-item').forEach(item => {
    item.addEventListener('click', () => switchStyle(item.dataset.style));
  });
  
  // 示例点击
  document.querySelectorAll('.example-chip').forEach(chip => {
    chip.addEventListener('click', () => fillExample(chip.dataset.example));
  });
  
  // 初始化第一条欢迎消息
  addMessage(scenarios[state.currentScenario].greeting, 'ai');
}

// 启动
document.addEventListener('DOMContentLoaded', init);
