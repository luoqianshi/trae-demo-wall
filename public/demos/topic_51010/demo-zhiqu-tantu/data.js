const DOMAINS = {
  python: {
    id: 'python',
    name: 'Python 入门',
    description: '零基础到能写小项目的完整学习路径',
    nodeCount: 18,
    estimatedHours: 20,
    nodes: [
  {
    id: 'py-01',
    title: '环境安装与第一行代码',
    difficulty: 1,
    prerequisites: [],
    summary: '安装 Python，运行你的第一行代码',
    content: 'Python 是一门简单易学但功能强大的编程语言。首先，你需要在电脑上安装 Python 解释器。安装完成后，打开终端或命令行，输入 `python` 进入交互模式。尝试输入 `print("Hello, World!")`，如果看到输出，恭喜你，你已经写出了人生第一行 Python 代码！',
    content_simple: '想象 Python 是一位翻译官，你把指令用"人话"写给它，它帮电脑听懂并执行。第一步就是请这位翻译官到你的电脑里"上班"——安装 Python。装好后，打开一个叫"终端"的黑框框，输入 `print("Hello, World!")`，按回车。看到文字跳出来？这就是你和电脑说的第一句话！',
    resource: { title: '菜鸟教程 - Python 环境搭建', url: 'https://www.runoob.com/python/python-install.html' },
    quiz: { question: '以下哪个是合法的 Python 变量名？', options: ['2name', 'my_var', 'my-var', 'class'], answer: 1 }
  },
  {
    id: 'py-02',
    title: '变量与数据类型',
    difficulty: 1,
    prerequisites: ['py-01'],
    summary: '认识数字、字符串、布尔值等基本数据类型',
    content: '变量就像一个贴了标签的盒子，用来存放数据。Python 中常见的数据类型有：整数（int，如 42）、浮点数（float，如 3.14）、字符串（str，如 "hello"）、布尔值（bool，True 或 False）。你不需要提前声明类型，Python 会自动识别。',
    content_simple: '变量就是给数据起个"外号"。比如 `age = 18`，就是把数字 18 放进一个叫 age 的盒子里。Python 里的数据有四种"性格"：整数（不带小数的数字）、浮点数（带小数的，比如价格）、字符串（文字，用引号包起来）、布尔值（只有 True/False 两种，像开关）。',
    resource: { title: '菜鸟教程 - Python 变量类型', url: 'https://www.runoob.com/python/python-variable-types.html' },
    quiz: { question: '执行 x = "5" + "3" 后，x 的值是？', options: ['8', '"53"', 'Error', '"8"'], answer: 1 }
  },
  {
    id: 'py-03',
    title: '运算符与表达式',
    difficulty: 1,
    prerequisites: ['py-02'],
    summary: '加减乘除、比较运算和逻辑运算',
    content: '运算符是对数据进行操作的符号。算术运算符包括 +、-、*、/、//（整除）、%（取余）、**（幂运算）。比较运算符包括 ==、!=、>、<、>=、<=，返回布尔值。逻辑运算符 and、or、not 用于组合多个条件。',
    content_simple: '运算符就像计算器上的按键。`+ - * /` 和数学课一样。特别记住三个新朋友：`//` 是"去掉小数部分的除法"（比如 7//2=3），`%` 是"求余数"（7%2=1），`**` 是"几次方"（2**3=8）。比较运算符就是问"是不是、大不大"，回答只有 True（是）或 False（不是）。',
    resource: { title: '菜鸟教程 - Python 运算符', url: 'https://www.runoob.com/python/python-operators.html' },
    quiz: { question: '7 // 2 的结果是？', options: ['3.5', '3', '1', '4'], answer: 1 }
  },
  {
    id: 'py-04',
    title: '条件判断 if/else',
    difficulty: 2,
    prerequisites: ['py-03'],
    summary: '让程序根据条件做出不同选择',
    content: 'if/else 是编程中最基础的控制结构。当条件为真时执行 if 块中的代码，否则执行 else 块。你还可以用 elif（else if）处理多个条件分支。注意 Python 使用缩进来表示代码块，而不是花括号。',
    content_simple: 'if/else 就是程序里的"分岔路口"。比如：如果外面在下雨，就带伞；否则，就不带。写成代码就是 `if 下雨: 带伞() else: 不带伞()`。elif 是"再不然看看这个条件"，可以有很多个岔路。记住 Python 用缩进（按 Tab 或空格）来区分"属于谁"的代码。',
    resource: { title: '菜鸟教程 - Python 条件语句', url: 'https://www.runoob.com/python/python-if-statement.html' },
    quiz: { question: 'if 3 > 5: print("A") else: print("B") 输出什么？', options: ['A', 'B', 'Error', '无输出'], answer: 1 }
  },
  {
    id: 'py-05',
    title: '循环 for/while',
    difficulty: 2,
    prerequisites: ['py-04'],
    summary: '让代码自动重复执行',
    content: '循环让程序能够重复执行某些操作。for 循环用于遍历序列（如列表、字符串），while 循环在条件为真时持续执行。break 用于提前退出循环，continue 用于跳过当前迭代。理解循环是掌握编程的关键一步。',
    content_simple: '循环就是"重复做同样的事"。for 循环像点人数：一排同学，一个一个数过去。while 循环像等公交："只要车还没来，就继续等"。`break` 是"不等了，我走了"；`continue` 是"这个人跳过，数下一个"。循环让程序替你干重复的活。',
    resource: { title: '菜鸟教程 - Python 循环语句', url: 'https://www.runoob.com/python/python-loops.html' },
    quiz: { question: 'for i in range(3): print(i) 的输出是？', options: ['0 1 2', '1 2 3', '0 1 2 3', '1 2'], answer: 0 }
  },
  {
    id: 'py-06',
    title: '字符串操作',
    difficulty: 2,
    prerequisites: ['py-02'],
    summary: '切片、拼接、查找、替换等常用操作',
    content: '字符串是 Python 中使用最频繁的数据类型之一。常用操作包括：索引访问（s[0]）、切片（s[1:4]）、拼接（+）、重复（*）、查找（in）、替换（replace）、分割（split）、去除空白（strip）。字符串是不可变对象，修改会返回新字符串。',
    content_simple: '字符串就是文字，Python 提供了超多好用的"文字工具"。`s[0]` 取第一个字；`s[1:4]` 取第2到第4个字；`+` 把两段文字粘一起；`split()` 像剪刀，按空格把句子剪成单词列表。记住：字符串一旦创建就不能改，所有"修改"其实是生成了一段新文字。',
    resource: { title: '菜鸟教程 - Python 字符串', url: 'https://www.runoob.com/python/python-strings.html' },
    quiz: { question: '"hello"[1:4] 的结果是？', options: ['"hell"', '"ell"', '"ello"', '"el"'], answer: 1 }
  },
  {
    id: 'py-07',
    title: '列表与元组',
    difficulty: 2,
    prerequisites: ['py-03'],
    summary: '有序集合：可变的列表和不可变的元组',
    content: '列表（list）用方括号定义，元素可以增删改，是最常用的序列类型。元组（tuple）用圆括号定义，元素不可变，适合存储固定数据。两者都支持索引、切片、遍历等操作。列表方法包括 append、pop、sort、reverse 等。',
    content_simple: '列表像一个可变长的抽屉柜，每个抽屉放一样东西，用 `[1, 2, 3]` 表示。你可以随时加抽屉（append）、拿走抽屉（pop）、重新排列（sort）。元组像焊死的抽屉柜 `(1, 2, 3)`，东西放进去就不能动了——适合存坐标、日期这种"定了就不改"的数据。',
    resource: { title: '菜鸟教程 - Python 列表', url: 'https://www.runoob.com/python/python-lists.html' },
    quiz: { question: '执行 a = [1,2]; a.append(3) 后，a 是？', options: ['[1,2]', '[1,2,3]', '[3,1,2]', 'Error'], answer: 1 }
  },
  {
    id: 'py-08',
    title: '字典与集合',
    difficulty: 2,
    prerequisites: ['py-07'],
    summary: '键值对字典和无序不重复集合',
    content: '字典（dict）用花括号定义，存储键值对，通过键快速查找值，如 `{"name": "Tom", "age": 20}`。集合（set）是无序不重复元素的集合，支持并集、交集、差集等数学运算。字典的键必须是不可变类型。',
    content_simple: '字典像一本真正的字典：左边是"关键词"（键），右边是"解释"（值），一查就找到。`{"名字":"小明", "年龄":18}`。集合像一个"只留 unique 款的收纳箱"，自动去掉重复的东西，而且东西放进去就乱序了。适合做"去重"和"找共同好友"这种事。',
    resource: { title: '菜鸟教程 - Python 字典', url: 'https://www.runoob.com/python/python-dictionary.html' },
    quiz: { question: 'd = {"a":1}; d["b"] = 2; print(d) 输出？', options: ['{"a":1}', '{"a":1, "b":2}', 'Error', '{"b":2}'], answer: 1 }
  },
  {
    id: 'py-09',
    title: '函数定义与调用',
    difficulty: 3,
    prerequisites: ['py-05', 'py-07'],
    summary: '把代码打包成可复用的功能块',
    content: '函数是组织好的、可重复使用的代码块。使用 def 关键字定义，可以接收参数并返回值。函数让代码更模块化、更易维护。参数可以有默认值，支持可变参数（*args, **kwargs）。理解作用域（局部变量 vs 全局变量）是掌握函数的关键。',
    content_simple: '函数就像厨房里的"菜谱"。你写好一次"怎么做番茄炒蛋"的步骤，以后每次想吃，只要喊一声"做番茄炒蛋()"就行了，不用每次都重写步骤。函数可以"带配料"（参数），也可以"端出菜"（返回值）。`*args` 是"配料随便放多少"，`**kwargs` 是"配料还带名字标签"。',
    resource: { title: '菜鸟教程 - Python 函数', url: 'https://www.runoob.com/python/python-functions.html' },
    quiz: { question: 'def f(x=1): return x*2; print(f()) 输出？', options: ['1', '2', 'Error', 'None'], answer: 1 }
  },
  {
    id: 'py-10',
    title: '文件读写',
    difficulty: 3,
    prerequisites: ['py-09'],
    summary: '读写文本文件和 CSV 文件',
    content: '使用 open() 函数打开文件，支持读（r）、写（w）、追加（a）等模式。with 语句可以自动关闭文件。read() 读取全部内容，readline() 逐行读取，readlines() 返回列表。写入使用 write() 或 writelines()。',
    content_simple: '文件读写就是"打开笔记本，看看写了什么，或者写点新东西"。`with open("笔记.txt", "r") as f:` 是标准打开方式，with 会自动帮你合上笔记本（关闭文件），不会忘。`"r"` 是只看，`"w"` 是重写，`"a"` 是在后面接着写。',
    resource: { title: '菜鸟教程 - Python 文件操作', url: 'https://www.runoob.com/python/python-files-io.html' },
    quiz: { question: 'with open("a.txt","w") as f: f.write("hi") 会？', options: ['创建/覆盖 a.txt', '报错', '追加内容', '无操作'], answer: 0 }
  },
  {
    id: 'py-11',
    title: '异常处理',
    difficulty: 3,
    prerequisites: ['py-09'],
    summary: '用 try/except 优雅地处理错误',
    content: '程序运行中难免出错，异常处理让程序能够优雅地应对错误而不是直接崩溃。try 块中放可能出错的代码，except 块中放出错后的处理逻辑。可以捕获特定异常类型，也可以使用 else（无异常时执行）和 finally（无论是否异常都执行）。',
    content_simple: '异常处理就是"做最坏的打算"。比如你要打开一个文件，但万一文件不存在呢？程序直接崩掉太难看了。用 try/except 包裹："试试看能不能打开，打不开也没关系，告诉我一声就行"。finally 是"不管成不成，最后都要做的事"（比如关门）。',
    resource: { title: '菜鸟教程 - Python 异常处理', url: 'https://www.runoob.com/python/python-exceptions.html' },
    quiz: { question: 'try: 1/0 except ZeroDivisionError: print("0") 输出？', options: ['报错', '0', '无输出', 'Infinity'], answer: 1 }
  },
  {
    id: 'py-12',
    title: '模块与包',
    difficulty: 3,
    prerequisites: ['py-09'],
    summary: 'import 导入标准库和第三方库',
    content: '模块是包含 Python 代码的 .py 文件，包是包含多个模块的目录。使用 import 导入模块，from ... import ... 导入特定内容。Python 自带丰富的标准库（如 os、sys、json、datetime），第三方库可通过 pip 安装。',
    content_simple: '模块就是"借用别人的工具箱"。你自己造锤子太慢了，直接 `import 锤子` 拿来用。标准库是 Python 自带的工具箱（比如 `json` 帮你处理数据格式，`random` 生成随机数）。pip 是去"工具店"买新工具的地方。',
    resource: { title: '菜鸟教程 - Python 模块', url: 'https://www.runoob.com/python/python-modules.html' },
    quiz: { question: 'import random; random.randint(1,3) 可能返回？', options: ['0', '1', '4', '3.5'], answer: 1 }
  },
  {
    id: 'py-13',
    title: '列表推导式',
    difficulty: 3,
    prerequisites: ['py-05', 'py-07'],
    summary: '一行代码生成列表的优雅写法',
    content: '列表推导式是一种简洁的创建列表的方式，语法为 `[表达式 for 变量 in 可迭代对象 if 条件]`。它比普通 for 循环更简洁、更高效。适用于对序列进行筛选、转换等操作。字典和集合也有类似的推导式。',
    content_simple: '列表推导式是 Python 的"偷懒神器"。原来写三行的 for 循环，现在一行搞定。`[x*2 for x in range(5)]` 就是"把 0 到 4 每个数乘 2，装进新列表"。还能加条件：`[x for x in range(10) if x%2==0]` 只装偶数。简洁又酷。',
    resource: { title: '菜鸟教程 - Python 列表推导式', url: 'https://www.runoob.com/python/python-lists.html' },
    quiz: { question: '[x for x in range(4) if x>1] 的结果是？', options: ['[0,1,2,3]', '[2,3]', '[1,2,3]', '[0,1]'], answer: 1 }
  },
  {
    id: 'py-14',
    title: '面向对象基础',
    difficulty: 4,
    prerequisites: ['py-09'],
    summary: '类、对象、属性和方法',
    content: '面向对象编程（OOP）将数据和操作数据的方法封装在一起。使用 class 定义类，__init__ 是构造方法，self 代表实例本身。类可以继承父类的属性和方法，实现代码复用。理解类和对象的关系是 OOP 的核心。',
    content_simple: '类就像一个"模具"，对象是用模具造出来的"产品"。比如"猫"是一个类（有名字、会叫、会跑），你家的"橘猫大福"就是一个对象。`class Cat:` 定义模具，`__init__` 是"出厂设置"，`self` 就是"这只猫自己"。继承就是"橘猫继承了猫的一切，还会额外撒娇"。',
    resource: { title: '菜鸟教程 - Python 面向对象', url: 'https://www.runoob.com/python/python-object.html' },
    quiz: { question: 'class A: def __init__(self): self.x=1; a=A(); print(a.x) 输出？', options: ['Error', '1', 'None', '0'], answer: 1 }
  },
  {
    id: 'py-15',
    title: '正则表达式入门',
    difficulty: 4,
    prerequisites: ['py-06', 'py-09'],
    summary: '用模式匹配搜索和替换文本',
    content: '正则表达式是一种强大的文本模式匹配工具。Python 通过 re 模块提供支持。常用功能包括 search（搜索）、match（从头匹配）、findall（找出所有匹配）、sub（替换）。元字符如 .（任意字符）、*（0次或多次）、+（1次或多次）、\d（数字）等构成匹配规则。',
    content_simple: '正则表达式就像"文字里的搜索引擎"。你想在一堆文字里找"所有手机号"？手动找太麻烦了。用正则：`\d{11}` 就是"找连续 11 个数字"。`.` 是"任意一个字"，`*` 是"前面的东西出现任意次"，`\d` 是"数字"。re.search 是"找到第一个"，re.findall 是"全都找出来"。',
    resource: { title: '菜鸟教程 - Python 正则表达式', url: 'https://www.runoob.com/python/python-reg-expressions.html' },
    quiz: { question: 're.findall(r"\\d+", "a1b23c") 的结果是？', options: [['1','23'], ['1','2','3'], ['a','b','c'], ['1','2','3','23']], answer: 0 }
  },
  {
    id: 'py-16',
    title: '常用标准库（os/json/time）',
    difficulty: 3,
    prerequisites: ['py-12'],
    summary: '文件系统、JSON 数据和时间处理',
    content: 'os 模块提供操作系统交互功能（路径、文件、环境变量）。json 模块用于 JSON 数据的编码（dump/dumps）和解码（load/loads）。time 和 datetime 模块处理日期和时间。掌握这三个库可以处理绝大多数日常编程任务。',
    content_simple: '这三个库是 Python 的"瑞士军刀"。`os` 帮你和电脑操作系统聊天（"帮我看看这个文件夹里有什么"）。`json` 是"翻译官"，把 Python 数据变成网络通用的 JSON 格式字符串。`datetime` 就是"日历+时钟"，算日期差、格式化时间全靠它。',
    resource: { title: '菜鸟教程 - Python 标准库概览', url: 'https://www.runoob.com/python/python-stdlib.html' },
    quiz: { question: 'json.dumps({"a":1}) 返回的类型是？', options: ['dict', 'list', 'str', 'int'], answer: 2 }
  },
  {
    id: 'py-17',
    title: '小项目：命令行待办清单',
    difficulty: 4,
    prerequisites: ['py-10', 'py-11', 'py-16'],
    summary: '综合运用文件读写和异常处理做一个小工具',
    content: '本项目综合运用前面学到的知识：用列表存储任务、用文件持久化数据、用函数组织代码、用异常处理提升健壮性。功能包括：添加任务、查看列表、标记完成、删除任务。数据存储在 JSON 文件中，程序退出后数据不丢失。',
    content_simple: '你终于要做第一个"真东西"了！这是一个命令行里的"备忘录"：可以添加任务、打勾完成、删掉、查看列表。用到的知识：列表存任务、文件读写保存数据（关掉程序也不丢）、函数把代码组织整齐、异常处理防止手滑输错字就崩掉。',
    resource: { title: 'Python 实战项目 - ToDo List', url: 'https://www.runoob.com/python3/python3-examples.html' },
    quiz: { question: '待办清单项目主要练习哪些知识？', options: ['仅循环', '文件+异常+函数', '仅字符串', '仅列表'], answer: 1 }
  },
  {
    id: 'py-18',
    title: '小项目：数据统计脚本',
    difficulty: 4,
    prerequisites: ['py-08', 'py-10', 'py-16'],
    summary: '读取数据文件并进行统计分析',
    content: '本项目读取 CSV 或 JSON 格式的数据文件，进行基本的统计分析：计算平均值、最大值、最小值、筛选符合条件的记录。综合运用字典、列表、文件读写和标准库，是数据处理能力的集中演练。',
    content_simple: '第二个项目：做一个"迷你数据分析师"。给它一个 Excel 导出或 JSON 格式的数据文件，它能自动算出平均数、最大最小值，还能帮你筛选（比如"只显示成绩大于 80 分的同学"）。用到的知识：字典统计频数、文件读取、json 模块解析数据。',
    resource: { title: 'Python 数据分析入门', url: 'https://www.runoob.com/python3/python3-examples.html' },
    quiz: { question: '数据统计脚本项目主要使用哪种文件格式？', options: ['TXT 纯文本', 'CSV / JSON', '图片', '视频'], answer: 1 }
  }
  ],
  },
  psychology: {
    id: 'psychology',
    name: '心理学入门',
    description: '探索人类心理与行为的科学之旅',
    nodeCount: 16,
    estimatedHours: 16,
    nodes: [
  {
    id: 'psy-01',
    title: '心理学是什么',
    difficulty: 1,
    prerequisites: [],
    summary: '认识心理学的科学本质和主要分支',
    content: '心理学是研究人类心理活动和行为的科学。它探索思维、情感、动机、认知、人格等心理现象的规律。心理学不是读心术，而是基于科学方法（实验、观察、调查）来理解人类行为背后的机制。现代心理学分为多个分支，如临床心理学、认知心理学、社会心理学、发展心理学等。',
    content_simple: '心理学不是"算命"也不是"读心术"，它是一门正经的科学，研究的是"人为什么会这样想、那样做"。比如为什么你会紧张？为什么记忆会遗忘？心理学家就像侦探，用实验和观察来找规律。心理学有几十种"流派"，有的帮人解决心理问题，有的研究大脑怎么工作，有的研究人与人之间的关系。',
    resource: { title: '网易公开课 - 心理学导论', url: 'https://open.163.com/' },
    quiz: { question: '以下关于心理学的说法，正确的是？', options: ['心理学是读心术', '心理学基于科学方法', '心理学只研究病人', '心理学无法验证'], answer: 1 }
  },
  {
    id: 'psy-02',
    title: '心理学的研究方法',
    difficulty: 1,
    prerequisites: ['psy-01'],
    summary: '实验、观察、调查和案例研究',
    content: '心理学研究依赖科学方法，主要包括：实验法（控制变量探究因果关系）、观察法（在自然或实验室环境中记录行为）、调查法（问卷和访谈收集数据）、案例研究法（深入分析个体或群体）。每种方法各有优劣，研究者需要根据问题选择合适的方法。',
    content_simple: '心理学家怎么知道"人在压力下会变笨"？他们不是瞎猜的，而是用科学方法去验证。实验法就像做对照实验：一组人给压力，一组不给，看谁表现差。观察法是"悄悄看、认真记"。调查法是发问卷问大家的想法。案例法是深入研究一个人，把他当成一本书来读。方法用对了，结论才靠谱。',
    resource: { title: '中国大学MOOC - 心理学研究方法', url: 'https://www.icourse163.org/' },
    quiz: { question: '想探究"睡眠不足是否影响记忆力"，最合适的方法是？', options: ['纯观察', '实验法', '算命', '猜'], answer: 1 }
  },
  {
    id: 'psy-03',
    title: '感知与感觉',
    difficulty: 1,
    prerequisites: ['psy-02'],
    summary: '感官如何接收和解读外界信息',
    content: '感觉是个体通过感官（眼、耳、鼻、舌、皮肤）接收外界刺激的过程。知觉是在感觉基础上对信息的组织和解释。感觉负责"接收信号"，知觉负责"理解信号"。例如，眼睛接收到光线（感觉），大脑识别出"这是一只猫"（知觉）。注意、错觉等现象揭示了感知过程的复杂性。',
    content_simple: '感觉是你的"硬件"在工作——眼睛看到光、耳朵听到声。知觉是你的"软件"在解读——大脑说"这是一只猫，不是老虎"。有时候硬件没坏，但软件会出错，这就是"错觉"。比如两条一样长的线，因为箭头方向不同，看起来一长一短。感知是个神奇的过程，它让我们"看见"的世界，其实是大脑加工后的版本。',
    resource: { title: '网易公开课 - 感知与知觉', url: 'https://open.163.com/' },
    quiz: { question: '"眼睛看到光"属于感觉还是知觉？', options: ['感觉', '知觉', '两者都是', '两者都不是'], answer: 0 }
  },
  {
    id: 'psy-04',
    title: '记忆与学习',
    difficulty: 2,
    prerequisites: ['psy-03'],
    summary: '记忆的三阶段和遗忘曲线',
    content: '记忆分为编码、存储、提取三个阶段。感觉记忆（毫秒级）、短时记忆（秒级，容量 7±2）、长时记忆（持久存储）。遗忘曲线揭示：遗忘在学习后20分钟开始，先快后慢。学习策略如间隔重复、深度加工、联想记忆能有效提升记忆效果。',
    content_simple: '记忆就像"拍照→存相册→翻相册"三步。但你的相册很奇怪：刚拍的照片（短时记忆）只能存几秒钟，最多存 7 样东西。只有特别重要的才会被"精修"后存入大相册（长时记忆）。艾宾浩斯发现：学完东西 20 分钟后就忘了一半！对抗遗忘的秘诀是"间隔重复"——今天学、明天复习、三天后再复习。',
    resource: { title: '网易公开课 - 记忆与学习', url: 'https://open.163.com/' },
    quiz: { question: '短时记忆的容量大约是？', options: ['3±2', '7±2', '15±2', '无限'], answer: 1 }
  },
  {
    id: 'psy-05',
    title: '情绪与动机',
    difficulty: 2,
    prerequisites: ['psy-03'],
    summary: '情绪的本质和推动行为的内在力量',
    content: '情绪是人对客观事物的主观体验和生理反应，包括喜、怒、哀、惧等基本情绪。动机是推动行为的内在力量，分为生理动机（饥饿、口渴）和心理动机（成就、归属）。情绪智力（EQ）指识别、理解和管理自己及他人情绪的能力。',
    content_simple: '情绪就是心里的"天气"——有时晴、有时雨、有时雷暴。它不是"矫情"，而是大脑在告诉你"这件事对我很重要"。动机是"推着你做事的那股劲"：饿了想吃饭、想赢比赛、想被朋友喜欢。情商高的人不是"不生气"，而是"知道自己正在生气，然后选择怎么表达"。',
    resource: { title: '网易公开课 - 情绪心理学', url: 'https://open.163.com/' },
    quiz: { question: '以下哪个属于心理动机？', options: ['饥饿', '口渴', '成就需求', '困倦'], answer: 2 }
  },
  {
    id: 'psy-06',
    title: '人格与自我',
    difficulty: 2,
    prerequisites: ['psy-04'],
    summary: '人格理论和自我概念',
    content: '人格是个体稳定的行为模式和心理特征总和。经典理论包括：大五人格（开放性、尽责性、外向性、宜人性、神经质）、MBTI（基于荣格理论）、弗洛伊德的精神分析理论。自我概念是个体对自己的认知和评价，影响行为和心理健康。',
    content_simple: '人格就是你身上的"稳定标签"——有人天生爱热闹，有人天生喜安静，有人做事一丝不苟，有人随性洒脱。心理学家把人分成五类大性格（大五人格），或者十六种类型（MBTI）。但记住：人格测试只是参考，不是"算命"。人格会变，只是变化很慢。',
    resource: { title: '中国大学MOOC - 人格心理学', url: 'https://www.icourse163.org/' },
    quiz: { question: '大五人格不包括以下哪个维度？', options: ['开放性', '尽责性', '完美性', '宜人性'], answer: 2 }
  },
  {
    id: 'psy-07',
    title: '认知心理学基础',
    difficulty: 3,
    prerequisites: ['psy-04', 'psy-05'],
    summary: '注意力、思维和决策',
    content: '认知心理学研究人类如何获取、加工、存储和使用信息。核心主题包括：注意力（选择性注意、分配注意）、思维（概念、推理、问题解决）、决策（启发式、偏差）。认知负荷理论指出，工作记忆容量有限，信息过载会降低学习效率。',
    content_simple: '认知心理学研究的是"大脑这台电脑怎么工作"。注意力就像聚光灯，只能照亮一小块地方——你不可能同时认真听两个人说话。思维就是"大脑做运算"——归类、推理、解决问题。但大脑很容易"偷懒"，用直觉代替思考，这就会产生偏见。认知负荷的意思是：一次塞太多信息，大脑会死机。',
    resource: { title: '网易公开课 - 认知心理学', url: 'https://open.163.com/' },
    quiz: { question: '认知负荷理论认为，什么会限制学习效率？', options: ['学习时间', '工作记忆容量', '书本厚度', '教室大小'], answer: 1 }
  },
  {
    id: 'psy-08',
    title: '社会心理学',
    difficulty: 3,
    prerequisites: ['psy-05', 'psy-06'],
    summary: '从众、服从、归因和群体影响',
    content: '社会心理学研究个体在社会情境中的心理和行为。核心概念包括：从众（阿希实验）、服从（米尔格拉姆实验）、归因（内归因 vs 外归因）、态度与说服、群体动力学。社会影响无处不在，理解这些机制有助于更好地认识自己和他人。',
    content_simple: '社会心理学研究的是"人在人群中会变成什么样"。经典实验：阿希发现，即使答案明显错误，大多数人也会跟着别人选。米尔格拉姆发现，普通人竟然会服从权威去伤害别人。还有"基本归因错误"——我们总觉得别人犯错是性格问题，自己犯错是环境问题。了解了这些，你会对很多社会现象恍然大悟。',
    resource: { title: '网易公开课 - 社会心理学', url: 'https://open.163.com/' },
    quiz: { question: '米尔格拉姆实验主要研究的是？', options: ['从众', '服从权威', '记忆', '情绪'], answer: 1 }
  },
  {
    id: 'psy-09',
    title: '发展心理学',
    difficulty: 3,
    prerequisites: ['psy-06'],
    summary: '从出生到老年，心理如何发展变化',
    content: '发展心理学研究个体从出生到老年的心理发展规律。皮亚杰的认知发展阶段理论（感知运动期、前运算期、具体运算期、形式运算期）是重要框架。埃里克森的心理社会发展理论提出人生八阶段的发展任务。理解发展规律对教育、育儿和自我成长都有重要意义。',
    content_simple: '发展心理学回答"人是怎样一点点变成今天这样的"。皮亚杰说，小孩的思维和大人完全不同：2 岁前靠摸和咬认识世界，7 岁前还不会逻辑思考，12 岁后才有抽象思维能力。埃里克森说，每个年龄段都有"人生功课"：婴儿期要建立信任，青春期要找自我认同。不是"长大了就自然懂了"，每个阶段都有特定的成长任务。',
    resource: { title: '中国大学MOOC - 发展心理学', url: 'https://www.icourse163.org/' },
    quiz: { question: '皮亚杰认为，7-12岁儿童处于哪个认知阶段？', options: ['感知运动期', '前运算期', '具体运算期', '形式运算期'], answer: 2 }
  },
  {
    id: 'psy-10',
    title: '心理障碍与应对',
    difficulty: 3,
    prerequisites: ['psy-08'],
    summary: '常见心理障碍和科学的应对方式',
    content: '心理障碍是指显著影响个体思维、情绪或行为的功能障碍。常见类型包括：焦虑障碍、抑郁障碍、双相情感障碍、强迫症、创伤后应激障碍（PTSD）。应对策略包括：寻求专业帮助（心理咨询/治疗）、认知行为疗法（CBT）、正念练习、社会支持。去污名化和早期干预非常重要。',
    content_simple: '心理障碍就像"心理感冒了"——不是"矫情"，不是"想太多"，而是大脑真的需要休息和治疗。焦虑症是"警报器太敏感"，抑郁症是"快乐开关暂时失灵"。最有效的应对是：不硬扛、不羞耻、早点找专业人士。认知行为疗法（CBT）就像"给大脑换个看事情的角度"，正念练习就像"给大脑做按摩"。',
    resource: { title: '网易公开课 - 心理健康', url: 'https://open.163.com/' },
    quiz: { question: '以下哪种是应对心理障碍的正确方式？', options: ['硬扛过去', '感到羞耻隐瞒', '寻求专业帮助', '自己乱吃药'], answer: 2 }
  },
  {
    id: 'psy-11',
    title: '心理测量与评估',
    difficulty: 3,
    prerequisites: ['psy-07', 'psy-09'],
    summary: '用科学工具测量心理特质',
    content: '心理测量是用标准化工具评估心理特质的方法。常用工具包括：智力测验（韦氏智力量表）、人格测验（大五人格量表、MBTI）、情绪量表（抑郁量表 PHQ-9、焦虑量表 GAD-7）。信度（测量的一致性）和效度（测量的准确性）是评估工具质量的核心指标。',
    content_simple: '心理测量就是"给心理称重"。智商测试测的是"解决问题的速度快不快"，人格量表测的是"你是个什么样的人"，情绪量表测的是"你最近心情怎么样"。但网上的测试很多不靠谱！真正有效的心理测验需要满足两个标准：信度（测十次结果差不多）和效度（真的测到了想测的东西）。',
    resource: { title: '网易公开课 - 心理测量学', url: 'https://open.163.com/' },
    quiz: { question: '评估心理测验质量的两个核心指标是？', options: ['难度和区分度', '信度和效度', '长度和价格', '颜值和口碑'], answer: 1 }
  },
  {
    id: 'psy-12',
    title: '心理咨询基础',
    difficulty: 4,
    prerequisites: ['psy-10'],
    summary: '心理咨询的流派和核心原则',
    content: '心理咨询是专业人员运用心理学理论和技术帮助来访者解决心理困扰的过程。主要流派包括：精神分析（探索潜意识）、认知行为（改变不合理信念）、人本主义（提供无条件积极关注）、家庭治疗（关注系统互动）。咨询关系（信任、共情、保密）是起效的关键因素。',
    content_simple: '心理咨询不是"给答案"，而是"陪你一起找答案"。咨询师不会告诉你"该怎么做"，而是帮你理清思路、看到盲区、找到力量。常见流派：精神分析像"考古"，挖潜意识里的童年创伤；认知行为像"装修"，把不合理的想法换成合理的；人本主义像"阳光"，给你无条件的接纳和支持。',
    resource: { title: '中国大学MOOC - 心理咨询', url: 'https://www.icourse163.org/' },
    quiz: { question: '心理咨询的核心关系要素不包括？', options: ['信任', '共情', '保密', '说教'], answer: 3 }
  },
  {
    id: 'psy-13',
    title: '压力管理与正念',
    difficulty: 4,
    prerequisites: ['psy-08', 'psy-10'],
    summary: '科学应对压力，学会正念冥想',
    content: '压力是身体对挑战的生理和心理反应。急性压力有助于应对危机，慢性压力则损害健康。压力管理策略包括：时间管理、运动、社交支持、认知重构、正念冥想。正念（Mindfulness）是指有意识地关注当下，不加评判地觉察。研究表明，正念练习能有效降低焦虑、提升专注力和情绪调节能力。',
    content_simple: '压力就像弓弦——太松射不远，太紧会断掉。短期的压力让人爆发，长期的压力让人崩溃。应对压力不是"消灭压力"，而是"和压力做朋友"。正念就是"活在当下"：吃饭时只吃饭，走路时只走路，不刷手机、不想明天。每天 10 分钟正念，相当于给大脑充电。',
    resource: { title: '网易公开课 - 正念与压力管理', url: 'https://open.163.com/' },
    quiz: { question: '正念练习的核心理念是？', options: ['逃避现实', '活在当下不加评判', '反复回忆过去', '担忧未来'], answer: 1 }
  },
  {
    id: 'psy-14',
    title: '沟通心理学',
    difficulty: 4,
    prerequisites: ['psy-08'],
    summary: '非言语沟通和冲突解决',
    content: '沟通心理学研究人际交流中的心理过程。核心概念包括：非言语沟通（肢体语言、面部表情、语调）、积极倾听、共情（Empathy）、冲突解决、说服力。萨提亚的沟通模式（讨好型、指责型、超理智型、打岔型、一致型）揭示了不同沟通风格背后的心理需求。',
    content_simple: '沟通不只是"说话"，还包括眼神、表情、姿势、语调。心理学发现，7% 的信息来自语言内容，38% 来自语调，55% 来自肢体语言！积极倾听不是"嗯嗯啊啊"，而是真正理解对方在说什么、感受到了什么。萨提亚说有五种沟通姿态，最健康的是"一致型"——既表达自己，又尊重对方。',
    resource: { title: '网易公开课 - 人际沟通', url: 'https://open.163.com/' },
    quiz: { question: '沟通中信息传递占比最大的是？', options: ['语言内容', '语调', '肢体语言', '衣着'], answer: 2 }
  },
  {
    id: 'psy-15',
    title: '小项目：设计一份心理问卷',
    difficulty: 4,
    prerequisites: ['psy-11', 'psy-12'],
    summary: '综合运用测量学知识设计问卷',
    content: '设计一份有效的心理问卷需要：明确测量目标、编写清晰的问题、使用适当的量表（如李克特 5 点量表）、进行预测试、分析信度和效度。问卷设计要避免引导性问题、双重问题和社会赞许性偏差。本项目综合运用测量学知识和批判性思维。',
    content_simple: '你终于要做自己的"心理测验"了！目标是设计一份"大学生学习压力调查问卷"。步骤：先想清楚你要测什么→写 10-15 个问题→让朋友试填→看看结果是否合理。记住：问题不能带倾向（"你不觉得压力太大了吗？"这样问不对），要让人愿意说真话。',
    resource: { title: '网易公开课 - 问卷设计', url: 'https://open.163.com/' },
    quiz: { question: '问卷设计应避免的问题是？', options: ['引导性问题', '封闭式问题', '量表问题', '选择题'], answer: 0 }
  },
  {
    id: 'psy-16',
    title: '案例分析：解读一个行为',
    difficulty: 4,
    prerequisites: ['psy-07', 'psy-13', 'psy-14'],
    summary: '多角度综合分析行为背后的心理机制',
    content: '综合运用发展心理学、社会心理学、认知心理学和人格理论，分析一个真实或虚构的行为案例。从多角度解读行为背后的原因：生理因素、心理因素、社会因素。培养批判性思维，避免单一归因。通过案例分析，将理论知识转化为实际分析能力。',
    content_simple: '最后一个挑战：给你一个案例——"小明最近总是上课走神，成绩下滑，也不爱和朋友玩了"。请你用学过的所有心理学知识，从多个角度分析"小明怎么了"。可能是认知问题（注意力涣散）？可能是情绪问题（抑郁倾向）？可能是环境问题（家庭变故）？综合分析，给出你的判断和建议。',
    resource: { title: '中国大学MOOC - 心理学案例分析', url: 'https://www.icourse163.org/' },
    quiz: { question: '案例分析时应避免？', options: ['多角度分析', '单一归因', '结合理论', '考虑环境'], answer: 1 }
  }
  ]
}
};
