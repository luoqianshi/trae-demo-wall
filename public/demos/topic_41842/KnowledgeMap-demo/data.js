// 知识地图数据
const knowledgeTrees = [
  {
    id: 'math',
    name: '数学',
    root: {
      id: 'math-root',
      name: '数学',
      description: '研究数量、结构、变化以及空间等概念的一门学科，是自然科学的基础工具，广泛应用于科学、工程、医学和经济学等领域。',
      books: [
        { title: '数学分析', author: '华东师范大学', desc: '经典数学分析教材' },
        { title: '线性代数及其应用', author: 'David C. Lay', desc: '通俗易懂的线性代数入门' }
      ],
      videos: [
        { title: '3Blue1Brown 线性代数', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', desc: '可视化理解线性代数' }
      ],
      links: [
        { title: 'Khan Academy 数学', url: 'https://www.khanacademy.org/math', desc: '免费在线数学课程' }
      ],
      children: [
        {
          id: 'linear-algebra',
          name: '线性代数',
          description: '研究向量空间、线性映射以及矩阵理论的数学分支，是现代数学和应用数学的重要基础。',
          books: [
            { title: '线性代数入门', author: 'Gilbert Strang', desc: 'MIT 经典教材' }
          ],
          videos: [
            { title: 'Essence of linear algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', desc: '3Blue1Brown 精品课程' }
          ],
          children: [
            { id: 'vector', name: '向量', description: '具有大小和方向的量，是线性代数的基本研究对象。', children: [
              { id: 'vector-space', name: '向量空间', description: '向量和标量构成的空间。', children: [] },
              { id: 'vector-operation', name: '向量运算', description: '加法、数乘、内积、外积。', children: [] }
            ]},
            { id: 'matrix', name: '矩阵', description: '以矩形阵列排列的数或符号，用于表示线性变换。', children: [
              { id: 'matrix-operation', name: '矩阵运算', description: '加法、乘法、转置、逆矩阵。', children: [] },
              { id: 'matrix-types', name: '特殊矩阵', description: '对称矩阵、正交矩阵、稀疏矩阵。', children: [] }
            ]},
            { id: 'determinant', name: '行列式', description: '与方阵相关联的标量值，可用于判断矩阵是否可逆。', children: [
              { id: 'det-property', name: '行列式性质', description: '行列式的基本性质和计算规则。', children: [] }
            ]},
            { id: 'eigenvalue', name: '特征值', description: '描述线性变换不变方向的重要概念。', children: [
              { id: 'eigenvector', name: '特征向量', description: '与特征值对应的非零向量。', children: [] },
              { id: 'char-poly', name: '特征多项式', description: '用于求解特征值的多项式。', children: [] }
            ]}
          ]
        },
        {
          id: 'calculus',
          name: '微积分',
          description: '研究函数的极限、微分、积分以及无穷级数的数学分支，是现代科学的基础工具。',
          books: [
            { title: '托马斯微积分', author: 'Thomas', desc: '最受欢迎的微积分教材' }
          ],
          videos: [
            { title: '微积分的本质', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr', desc: '3Blue1Brown 微积分系列' }
          ],
          children: [
            { id: 'limit', name: '极限', description: '描述函数或数列在某一过程中趋近于某个确定值的概念。', children: [
              { id: 'sequence-limit', name: '数列极限', description: '数列的收敛性。', children: [] },
              { id: 'function-limit', name: '函数极限', description: '函数的极限存在性。', children: [] }
            ]},
            { id: 'derivative', name: '导数', description: '描述函数在某一点的瞬时变化率，是微分学的核心概念。', children: [
              { id: 'derivative-rule', name: '求导法则', description: '链式法则、乘积法则、商法则。', children: [] },
              { id: 'partial-derivative', name: '偏导数', description: '多元函数的导数。', children: [] }
            ]},
            { id: 'integral', name: '积分', description: '导数的逆运算，用于计算面积、体积等累积量。', children: [
              { id: 'indefinite-integral', name: '不定积分', description: '原函数和积分常数。', children: [] },
              { id: 'definite-integral', name: '定积分', description: '有上下限的积分。', children: [] },
              { id: 'multiple-integral', name: '多重积分', description: '二重积分、三重积分。', children: [] }
            ]},
            { id: 'differential-equation', name: '微分方程', description: '含有未知函数及其导数的方程。', children: [
              { id: 'ode', name: '常微分方程', description: '单变量函数的微分方程。', children: [] },
              { id: 'pde', name: '偏微分方程', description: '多变量函数的微分方程。', children: [] }
            ]}
          ]
        },
        {
          id: 'geometry',
          name: '几何',
          description: '研究空间结构及性质的数学分支，从欧氏几何到现代微分几何。',
          books: [
            { title: '几何原本', author: '欧几里得', desc: '西方数学史上第一部系统化公理化著作' }
          ],
          children: [
            { id: 'euclidean-geometry', name: '欧氏几何', description: '基于欧几里得公理体系的经典几何学。', children: [
              { id: 'plane-geometry', name: '平面几何', description: '二维平面上的几何图形。', children: [] },
              { id: 'solid-geometry', name: '立体几何', description: '三维空间中的几何体。', children: [] }
            ]},
            { id: 'analytic-geometry', name: '解析几何', description: '用代数方法研究几何问题。', children: [
              { id: 'coordinate-system', name: '坐标系', description: '笛卡尔坐标系、极坐标系。', children: [] },
              { id: 'conic-section', name: '圆锥曲线', description: '椭圆、双曲线、抛物线。', children: [] }
            ]},
            { id: 'differential-geometry', name: '微分几何', description: '用微积分方法研究曲线、曲面。', children: [
              { id: 'curve-theory', name: '曲线理论', description: '曲线的曲率、切向量。', children: [] },
              { id: 'surface-theory', name: '曲面理论', description: '曲面的第一、第二基本形式。', children: [] }
            ]}
          ]
        },
        {
          id: 'probability',
          name: '概率论',
          description: '研究随机现象数量规律的数学分支，是统计学的基础。',
          books: [
            { title: '概率论与数理统计', author: '盛骤', desc: '国内经典概率论教材' }
          ],
          videos: [
            { title: '统计学入门', url: 'https://www.khanacademy.org/math/statistics-probability', desc: 'Khan Academy 统计课程' }
          ],
          children: [
            { id: 'random-variable', name: '随机变量', description: '将随机试验结果数值化的函数。', children: [
              { id: 'discrete-rv', name: '离散随机变量', description: '取值有限的随机变量。', children: [] },
              { id: 'continuous-rv', name: '连续随机变量', description: '取值在区间的随机变量。', children: [] }
            ]},
            { id: 'distribution', name: '概率分布', description: '描述随机变量取值概率的函数。', children: [
              { id: 'binom-dist', name: '二项分布', description: 'n次伯努利试验的概率分布。', children: [] },
              { id: 'normal-dist', name: '正态分布', description: '最重要的连续分布。', children: [] },
              { id: 'poisson-dist', name: '泊松分布', description: '描述单位时间内随机事件发生次数。', children: [] }
            ]},
            { id: 'expectation', name: '期望与方差', description: '描述随机变量集中趋势和离散程度。', children: [
              { id: 'mean', name: '均值', description: '随机变量的期望值。', children: [] },
              { id: 'variance', name: '方差', description: '随机变量偏离均值的程度。', children: [] }
            ]}
          ]
        }
      ]
    }
  },
  {
    id: 'software-engineering',
    name: '软件工程',
    root: {
      id: 'se-root',
      name: '软件工程',
      description: '应用工程化方法开发、运行和维护软件的学科，涵盖编程语言、算法、系统设计等多个领域。',
      books: [
        { title: '代码大全', author: 'Steve McConnell', desc: '软件构建的完整指南' },
        { title: '人月神话', author: 'Frederick Brooks', desc: '软件工程经典名著' }
      ],
      links: [
        { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: '前端开发权威文档' }
      ],
      children: [
        {
          id: 'programming',
          name: '核心编程技能',
          description: '软件开发的基础能力，包括编程语言掌握和代码编写能力。',
          books: [
            { title: 'Clean Code', author: 'Robert C. Martin', desc: '代码整洁之道' },
            { title: '重构', author: 'Martin Fowler', desc: '改善既有代码的设计' }
          ],
          children: [
            { id: 'programming-languages', name: '编程语言', description: 'Java、Python、C++、JavaScript等主流编程语言。', children: [
              { id: 'language-paradigm', name: '编程范式', description: '面向对象、函数式、命令式。', children: [] },
              { id: 'language-feature', name: '语言特性', description: '类型系统、内存管理、并发模型。', children: [] }
            ]},
            { id: 'script-languages', name: '脚本语言', description: 'Shell、Python等用于自动化任务的脚本语言。', children: [
              { id: 'shell-script', name: 'Shell脚本', description: 'Bash、PowerShell自动化。', children: [] },
              { id: 'python-script', name: 'Python脚本', description: '数据处理、工具脚本。', children: [] }
            ]},
            { id: 'code-quality', name: '代码质量', description: '代码规范、重构技巧、代码审查等提升代码质量的实践。', children: [
              { id: 'code-review', name: '代码审查', description: '同行评审和代码检查。', children: [] },
              { id: 'refactoring', name: '代码重构', description: '改善代码结构的技巧。', children: [] }
            ]}
          ]
        },
        {
          id: 'algorithms',
          name: '数据结构与算法',
          description: '程序设计的核心基础，决定程序的效率和性能。',
          books: [
            { title: '算法导论', author: 'Thomas H. Cormen', desc: '算法领域的经典教材' },
            { title: '剑指Offer', author: '何海涛', desc: '程序员面试算法题精讲' }
          ],
          videos: [
            { title: '算法可视化', url: 'https://visualgo.net/zh', desc: '算法数据结构可视化学习' }
          ],
          links: [
            { title: 'LeetCode', url: 'https://leetcode-cn.com', desc: '在线编程题库' }
          ],
          children: [
            { id: 'basic-structures', name: '基础数据结构', description: '数组、链表、栈、队列等基本数据组织形式。', children: [
              { id: 'array', name: '数组', description: '连续内存的线性结构。', children: [] },
              { id: 'linked-list', name: '链表', description: '通过指针连接的节点序列。', children: [] },
              { id: 'stack-queue', name: '栈与队列', description: 'LIFO和FIFO数据结构。', children: [] }
            ]},
            { id: 'trees-graphs', name: '树与图', description: '非线性数据结构，用于表示层次关系和网络关系。', children: [
              { id: 'binary-tree', name: '二叉树', description: '每个节点最多两个子节点。', children: [] },
              { id: 'bst', name: '二叉搜索树', description: '有序的二叉树结构。', children: [] },
              { id: 'graph', name: '图', description: '由顶点和边构成的结构。', children: [] }
            ]},
            { id: 'sorting-searching', name: '排序与搜索', description: '经典算法问题，是算法学习的基础。', children: [
              { id: 'comparison-sort', name: '比较排序', description: '快速排序、归并排序、堆排序。', children: [] },
              { id: 'linear-sort', name: '线性排序', description: '计数排序、基数排序。', children: [] },
              { id: 'search-algorithm', name: '搜索算法', description: '二分搜索、哈希查找。', children: [] }
            ]},
            { id: 'dynamic-programming', name: '动态规划', description: '通过子问题重叠解决复杂问题的算法策略。', children: [
              { id: 'dp基础', name: 'DP基础', description: '状态定义和转移方程。', children: [] },
              { id: 'dp优化', name: 'DP优化', description: '空间优化、斜率优化。', children: [] }
            ]}
          ]
        },
        {
          id: 'system-design',
          name: '系统设计',
          description: '构建大规模软件系统的架构设计能力。',
          books: [
            { title: '系统设计面试', author: 'Alex Xu', desc: '大型系统设计指南' }
          ],
          links: [
            { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', desc: '系统设计学习资源汇总' }
          ],
          children: [
            { id: 'database', name: '数据库', description: '关系型数据库、NoSQL、数据库设计原则。', children: [
              { id: 'rdbms', name: '关系型数据库', description: 'MySQL、PostgreSQL、Oracle。', children: [] },
              { id: 'nosql', name: 'NoSQL数据库', description: 'MongoDB、Redis、Cassandra。', children: [] },
              { id: 'db-design', name: '数据库设计', description: '范式、索引、事务。', children: [] }
            ]},
            { id: 'distributed-systems', name: '分布式系统', description: '分布式架构、一致性协议、负载均衡等技术。', children: [
              { id: 'consistency', name: '一致性协议', description: 'CAP定理、Raft、Paxos。', children: [] },
              { id: 'load-balancing', name: '负载均衡', description: '轮询、最少连接、IP哈希。', children: [] },
              { id: 'message-queue', name: '消息队列', description: 'Kafka、RabbitMQ、ActiveMQ。', children: [] }
            ]},
            { id: 'api-design', name: 'API设计', description: 'RESTful API、GraphQL等接口设计原则。', children: [
              { id: 'rest-api', name: 'RESTful API', description: 'REST架构风格。', children: [] },
              { id: 'graphql', name: 'GraphQL', description: '查询语言和运行时。', children: [] },
              { id: 'api-security', name: 'API安全', description: '认证、授权、限流。', children: [] }
            ]},
            { id: 'caching', name: '缓存策略', description: 'Redis、Memcached等缓存技术应用。', children: [
              { id: 'cache-strategy', name: '缓存策略', description: 'Cache-aside、Read-through。', children: [] },
              { id: 'cache-invalidation', name: '缓存失效', description: 'LRU、TTL、主动失效。', children: [] }
            ]}
          ]
        },
        {
          id: 'engineering-practice',
          name: '工程实践',
          description: '软件开发过程中的最佳实践和工具使用。',
          books: [
            { title: 'Git权威指南', author: '蒋鑫', desc: 'Git使用全面指南' }
          ],
          videos: [
            { title: 'Git教程', url: 'https://git-scm.com/video/what-is-git', desc: 'Git官方视频教程' }
          ],
          links: [
            { title: 'GitHub Learning Lab', url: 'https://lab.github.com', desc: 'GitHub官方学习平台' }
          ],
          children: [
            { id: 'version-control', name: '版本控制', description: 'Git等版本控制工具的使用和工作流。', children: [
              { id: 'git-workflow', name: 'Git工作流', description: 'Git Flow、GitHub Flow。', children: [] },
              { id: 'branch-strategy', name: '分支策略', description: '主分支、开发分支、功能分支。', children: [] }
            ]},
            { id: 'testing', name: '软件测试', description: '单元测试、集成测试、端到端测试等测试方法。', children: [
              { id: 'unit-test', name: '单元测试', description: 'Jest、JUnit、Pytest。', children: [] },
              { id: 'integration-test', name: '集成测试', description: '组件间交互测试。', children: [] },
              { id: 'e2e-test', name: '端到端测试', description: 'Selenium、Cypress。', children: [] }
            ]},
            { id: 'ci-cd', name: '持续集成', description: '自动化构建、测试和部署流程。', children: [
              { id: 'ci-pipeline', name: 'CI流水线', description: 'Jenkins、GitHub Actions。', children: [] },
              { id: 'deployment', name: '部署策略', description: '蓝绿部署、金丝雀发布。', children: [] }
            ]},
            { id: 'monitoring', name: '监控与运维', description: '系统监控、日志管理、故障排查等运维技能。', children: [
              { id: 'logging', name: '日志管理', description: 'ELK Stack、Splunk。', children: [] },
              { id: 'metrics', name: '指标监控', description: 'Prometheus、Grafana。', children: [] }
            ]}
          ]
        }
      ]
    }
  },
  {
    id: 'psychology',
    name: '心理学',
    root: {
      id: 'psych-root',
      name: '心理学',
      description: '研究人类心理现象及其行为规律的科学，涵盖认知、发展、社会等多个分支。',
      books: [
        { title: '心理学与生活', author: '理查德·格里格', desc: '心理学入门经典读物' },
        { title: '社会心理学', author: '戴维·迈尔斯', desc: '社心领域权威教材' }
      ],
      children: [
        {
          id: 'cognitive-psych',
          name: '认知心理学',
          description: '研究人类认知过程的心理学分支，包括注意、记忆、思维等。',
          books: [
            { title: '认知心理学', author: 'Robert Sternberg', desc: '认知心理学教材' }
          ],
          children: [
            { id: 'memory', name: '记忆', description: '信息编码、存储和提取的心理过程。', children: [
              { id: 'encoding', name: '编码', description: '感觉记忆、工作记忆、长时记忆。', children: [] },
              { id: 'storage', name: '存储', description: '记忆的保持和巩固。', children: [] },
              { id: 'retrieval', name: '提取', description: '回忆和再认。', children: [] }
            ]},
            { id: 'attention', name: '注意力', description: '心理资源在特定信息上的集中过程。', children: [
              { id: 'selective-attention', name: '选择性注意', description: '过滤和选择信息。', children: [] },
              { id: 'divided-attention', name: '分配性注意', description: '同时关注多个任务。', children: [] }
            ]},
            { id: 'language', name: '语言', description: '人类语言的理解、产生和习得过程。', children: [
              { id: 'language-comprehension', name: '语言理解', description: '词汇、句法、语义加工。', children: [] },
              { id: 'language-production', name: '语言产生', description: '说话和写作的心理过程。', children: [] }
            ]},
            { id: 'thinking', name: '思维与推理', description: '问题解决、决策制定等高级认知过程。', children: [
              { id: 'problem-solving', name: '问题解决', description: '算法和启发式策略。', children: [] },
              { id: 'decision-making', name: '决策', description: '风险和不确定性下的选择。', children: [] },
              { id: 'reasoning', name: '推理', description: '演绎推理和归纳推理。', children: [] }
            ]}
          ]
        },
        {
          id: 'developmental-psych',
          name: '发展心理学',
          description: '研究人一生心理发展规律和特点的心理学分支。',
          books: [
            { title: '发展心理学', author: 'David Shaffer', desc: '发展心理学经典教材' }
          ],
          children: [
            { id: 'child-development', name: '儿童发展', description: '从婴儿到儿童期的认知、情感和社会发展。', children: [
              { id: 'infant-development', name: '婴儿期发展', description: '0-2岁的发展特点。', children: [] },
              { id: 'early-childhood', name: '幼儿期发展', description: '2-6岁的发展特点。', children: [] },
              { id: 'middle-childhood', name: '童年期发展', description: '6-12岁的发展特点。', children: [] }
            ]},
            { id: 'adolescent-development', name: '青少年发展', description: '青春期身心发展特点和规律。', children: [
              { id: 'puberty', name: '青春期生理', description: '身体变化和激素。', children: [] },
              { id: 'identity-formation', name: '自我同一性', description: '我是谁的问题。', children: [] }
            ]},
            { id: 'adult-development', name: '成人发展', description: '成年期和老年期的心理发展变化。', children: [
              { id: 'early-adulthood', name: '成年早期', description: '职业和亲密关系。', children: [] },
              { id: 'middle-adulthood', name: '中年期', description: '职业转型和空巢。', children: [] },
              { id: 'late-adulthood', name: '老年期', description: '退休和适应老年生活。', children: [] }
            ]}
          ]
        },
        {
          id: 'social-psych',
          name: '社会心理学',
          description: '研究个体在社会情境中的心理和行为的学科。',
          books: [
            { title: '乌合之众', author: '古斯塔夫·勒庞', desc: '群体心理学的开创性著作' }
          ],
          videos: [
            { title: 'TED 心理学演讲', url: 'https://www.ted.com/topics/psychology', desc: '心理学相关TED演讲' }
          ],
          children: [
            { id: 'conformity', name: '从众与服从', description: '个体受群体影响而改变行为的现象。', children: [
              { id: 'normative-influence', name: '规范性影响', description: '被社会接受的愿望。', children: [] },
              { id: 'informational-influence', name: '信息性影响', description: '他人作为信息源。', children: [] }
            ]},
            { id: 'group-behavior', name: '群体行为', description: '群体对个体心理和行为的影响。', children: [
              { id: 'group-polarization', name: '群体极化', description: '讨论使观点更强。', children: [] },
              { id: 'social-loafing', name: '社会懈怠', description: '群体中个人努力减少。', children: [] }
            ]},
            { id: 'attitude', name: '态度与说服', description: '态度的形成、改变及其影响因素。', children: [
              { id: 'attitude-formation', name: '态度形成', description: '直接经验和间接经验。', children: [] },
              { id: 'persuasion', name: '说服', description: '说服的路径和策略。', children: [] }
            ]},
            { id: 'interpersonal', name: '人际关系', description: '人际吸引、亲密关系等社会关系研究。', children: [
              { id: 'attraction', name: '人际吸引', description: '喜欢和爱的心理学。', children: [] },
              { id: 'intimacy', name: '亲密关系', description: '依恋和亲密感。', children: [] },
              { id: 'conflict', name: '人际冲突', description: '冲突的来源和解决。', children: [] }
            ]}
          ]
        },
        {
          id: 'clinical-psych',
          name: '临床心理学',
          description: '应用心理学原理评估、诊断和治疗心理障碍。',
          books: [
            { title: '异常心理学', author: 'James Morrison', desc: 'DSM-5诊断指南配套读物' }
          ],
          links: [
            { title: '心理健康资源', url: 'https://www.psychology.org', desc: '美国心理学会官网' }
          ],
          children: [
            { id: 'psychological-assessment', name: '心理评估', description: '使用测验和访谈评估心理状态。', children: [
              { id: 'personality-test', name: '人格测验', description: 'MMPI、16PF等。', children: [] },
              { id: 'intelligence-test', name: '智力测验', description: '韦氏成人智力量表。', children: [] }
            ]},
            { id: 'psychotherapy', name: '心理治疗', description: '认知行为疗法、精神分析等治疗方法。', children: [
              { id: 'cbt', name: '认知行为疗法', description: '改变不合理认知。', children: [] },
              { id: 'psychoanalysis', name: '精神分析', description: '探索潜意识。', children: [] },
              { id: 'humanistic-therapy', name: '人本主义疗法', description: '罗杰斯来访者中心。', children: [] }
            ]},
            { id: 'mental-disorders', name: '心理障碍', description: '焦虑、抑郁、人格障碍等心理疾病的认识。', children: [
              { id: 'anxiety-disorders', name: '焦虑障碍', description: '惊恐障碍、社交焦虑。', children: [] },
              { id: 'mood-disorders', name: '心境障碍', description: '抑郁症、双相障碍。', children: [] },
              { id: 'personality-disorders', name: '人格障碍', description: '边缘型、反社会型。', children: [] }
            ]}
          ]
        }
      ]
    }
  },
  {
    id: 'finance',
    name: '理财',
    root: {
      id: 'finance-root',
      name: '理财',
      description: '管理个人或家庭财务的知识体系，包括收入管理、投资规划、风险控制等方面。',
      books: [
        { title: '富爸爸穷爸爸', author: '罗伯特·清崎', desc: '财商教育经典入门书' },
        { title: '小狗钱钱', author: '博多·舍费尔', desc: '简单易懂的理财启蒙书' }
      ],
      children: [
        {
          id: 'basic-finance',
          name: '理财基础',
          description: '理财入门知识和基本概念。',
          books: [
            { title: '财务自由之路', author: '博多·舍费尔', desc: '实现财务自由的实用指南' }
          ],
          children: [
            { id: 'financial-goals', name: '财务目标', description: '设定短期、中期、长期财务目标的方法。', children: [
              { id: 'short-term-goals', name: '短期目标', description: '3-12个月内的财务计划。', children: [] },
              { id: 'medium-term-goals', name: '中期目标', description: '1-5年的财务规划。', children: [] },
              { id: 'long-term-goals', name: '长期目标', description: '5年以上的财务愿景。', children: [] }
            ]},
            { id: 'budgeting', name: '预算管理', description: '收入支出规划、记账方法、现金流管理。', children: [
              { id: 'expense-tracking', name: '支出追踪', description: '记录和分析支出习惯。', children: [] },
              { id: 'saving-rate', name: '储蓄率', description: '收入中用于储蓄的比例。', children: [] },
              { id: 'cash-flow', name: '现金流管理', description: '收入与支出的平衡。', children: [] }
            ]},
            { id: 'emergency-fund', name: '应急基金', description: '建立应急储备金的重要性和方法。', children: [
              { id: 'fund-size', name: '基金规模', description: '3-6个月生活费用的建议。', children: [] },
              { id: 'fund-location', name: '资金存放', description: '高流动性、低风险的存储方式。', children: [] }
            ]}
          ]
        },
        {
          id: 'investment',
          name: '投资理财',
          description: '通过投资实现财富增值的知识和技能。',
          books: [
            { title: '聪明的投资者', author: '本杰明·格雷厄姆', desc: '价值投资经典之作' },
            { title: '漫步华尔街', author: '伯顿·马尔基尔', desc: '投资学入门必读' }
          ],
          videos: [
            { title: '投资基础课程', url: 'https://www.coursera.org/learn/finvestment', desc: 'CFA协会投资课程' }
          ],
          children: [
            { id: 'stocks', name: '股票投资', description: '股票市场基础知识、分析方法、投资策略。', children: [
              { id: 'stock-analysis', name: '股票分析', description: '基本面分析和技术分析。', children: [] },
              { id: 'stock-selection', name: '选股策略', description: '价值投资、成长投资、指数投资。', children: [] },
              { id: 'stock-trading', name: '股票交易', description: '开户、下单、交割流程。', children: [] }
            ]},
            { id: 'funds', name: '基金投资', description: '公募基金、私募基金的类型和选择方法。', children: [
              { id: 'fund-types', name: '基金类型', description: '股票型、债券型、混合型、指数型。', children: [] },
              { id: 'fund-selection', name: '选基方法', description: '基金评级、经理业绩、费率比较。', children: [] },
              { id: 'fund-investing', name: '基金定投', description: '定期定额投资的策略和优势。', children: [] }
            ]},
            { id: 'bonds', name: '债券投资', description: '国债、企业债等固定收益类投资产品。', children: [
              { id: 'bond-types', name: '债券类型', description: '国债、地方债、企业债、可转债。', children: [] },
              { id: 'bond-analysis', name: '债券分析', description: '久期、信用评级、收益率。', children: [] }
            ]},
            { id: 'real-estate', name: '房地产投资', description: '房产投资的策略和注意事项。', children: [
              { id: 'property-selection', name: '选房要点', description: '地段、户型、配套分析。', children: [] },
              { id: 'rental-income', name: '租金收益', description: '出租管理和租金回报率。', children: [] },
              { id: 'reits', name: 'REITs', description: '房地产投资信托基金。', children: [] }
            ]}
          ]
        },
        {
          id: 'risk-management',
          name: '风险管理',
          description: '识别、评估和应对财务风险的策略。',
          books: [
            { title: '风险管理与金融机构', author: 'John C. Hull', desc: '金融风险管理教材' }
          ],
          children: [
            { id: 'insurance', name: '保险规划', description: '人寿、健康、财产保险的配置原则。', children: [
              { id: 'life-insurance', name: '人寿保险', description: '定期寿险、终身寿险、分红险。', children: [] },
              { id: 'health-insurance', name: '健康保险', description: '医疗险、重疾险、意外险。', children: [] },
              { id: 'property-insurance', name: '财产保险', description: '车险、家财险。', children: [] }
            ]},
            { id: 'diversification', name: '资产配置', description: '分散投资降低风险的策略。', children: [
              { id: 'asset-allocation', name: '资产配置', description: '股票、债券、现金的比例分配。', children: [] },
              { id: 'correlation', name: '相关性分析', description: '不同资产的相关性。', children: [] },
              { id: 'rebalancing', name: '再平衡', description: '定期调整资产比例。', children: [] }
            ]},
            { id: 'risk-assessment', name: '风险评估', description: '评估自身风险承受能力的方法。', children: [
              { id: 'risk-tolerance', name: '风险偏好', description: '保守型、平衡型、进取型。', children: [] },
              { id: 'stress-test', name: '压力测试', description: '极端情况下的资产表现。', children: [] }
            ]}
          ]
        },
        {
          id: 'retirement',
          name: '养老规划',
          description: '为退休生活做财务准备的长远规划。',
          books: [
            { title: '退休规划指南', author: '考克斯', desc: '系统化退休规划方法' }
          ],
          children: [
            { id: 'pension', name: '养老金', description: '社会养老保险、企业年金等养老保障。', children: [
              { id: 'social-pension', name: '社保养老金', description: '基本养老保险的计算和领取。', children: [] },
              { id: 'occupational-pension', name: '企业年金', description: '职业年金和补充养老保险。', children: [] },
              { id: 'personal-pension', name: '个人养老金', description: '个人养老账户的规划。', children: [] }
            ]},
            { id: 'retirement-planning', name: '退休规划', description: '计算退休所需资金、制定储蓄计划。', children: [
              { id: 'retirement-needs', name: '退休需求分析', description: '估算退休后的生活费用。', children: [] },
              { id: 'savings-plan', name: '储蓄计划', description: '退休储蓄的计算和实施。', children: [] },
              { id: 'withdrawal-strategy', name: '提取策略', description: '退休后如何提取和使用养老金。', children: [] }
            ]}
          ]
        }
      ]
    }
  },
  {
    id: 'philosophy',
    name: '哲学',
    root: {
      id: 'phil-root',
      name: '哲学',
      description: '对存在、知识、价值、理性等基本问题进行系统性思考的学科，是人类思想的结晶。',
      books: [
        { title: '苏菲的世界', author: '乔斯坦·贾德', desc: '哲学入门最佳读物' },
        { title: '大问题', author: '罗伯特·所罗门', desc: '哲学导论经典教材' }
      ],
      links: [
        { title: '斯坦福哲学百科', url: 'https://plato.stanford.edu', desc: '权威哲学资源' }
      ],
      children: [
        {
          id: 'metaphysics',
          name: '形而上学',
          description: '研究存在本质、实在结构的哲学分支。',
          books: [
            { title: '纯粹理性批判', author: '伊曼努尔·康德', desc: '康德哲学核心著作' }
          ],
          children: [
            { id: 'ontology', name: '本体论', description: '研究存在本身及其基本范畴。', children: [
              { id: 'being', name: '存在与存在者', description: 'Being与beings的区分。', children: [] },
              { id: 'categories', name: '范畴', description: '存在的基本分类。', children: [] }
            ]},
            { id: 'mind-body', name: '心身问题', description: '心灵与身体关系的哲学探讨。', children: [
              { id: 'dualism', name: '二元论', description: '心灵与身体是两种实体。', children: [] },
              { id: 'physicalism', name: '物理主义', description: '一切都是物理的。', children: [] },
              { id: 'functionalism', name: '功能主义', description: '心灵是功能组织。', children: [] }
            ]},
            { id: 'free-will', name: '自由意志', description: '人的意志是否自由、决定论与自由意志的争论。', children: [
              { id: 'determinism', name: '决定论', description: '一切事件都有原因。', children: [] },
              { id: 'libertarianism', name: '自由意志论', description: '意志是自由的。', children: [] },
              { id: 'compatibilism', name: '兼容论', description: '自由与决定论可以并存。', children: [] }
            ]}
          ]
        },
        {
          id: 'epistemology',
          name: '认识论',
          description: '研究知识的本质、来源和限度的哲学分支。',
          books: [
            { title: '知识论', author: '陈嘉映', desc: '中文知识论导论' }
          ],
          children: [
            { id: 'knowledge-nature', name: '知识的本质', description: '什么是知识？知识需要满足哪些条件？', children: [
              { id: 'justified-true-belief', name: 'JTB理论', description: '知识是确证的真信念。', children: [] },
              { id: 'gettier-problems', name: '葛梯尔问题', description: 'JTB理论的反例。', children: [] }
            ]},
            { id: 'skepticism', name: '怀疑论', description: '对知识可能性的质疑及其回应。', children: [
              { id: 'cartesian-skepticism', name: '笛卡尔怀疑', description: '我思故我在的论证。', children: [] },
              { id: 'moorean-response', name: '摩尔式回应', description: '常识的反驳。', children: [] }
            ]},
            { id: 'truth', name: '真理理论', description: '符合论、融贯论、实用主义等真理观。', children: [
              { id: 'correspondence', name: '符合论', description: '真理在于与事实符合。', children: [] },
              { id: 'coherence', name: '融贯论', description: '真理在于信念系统的融贯。', children: [] },
              { id: 'pragmatism', name: '实用主义', description: '真理是有用。', children: [] }
            ]}
          ]
        },
        {
          id: 'ethics',
          name: '伦理学',
          description: '研究道德原则和价值判断的哲学分支。',
          books: [
            { title: '尼各马可伦理学', author: '亚里士多德', desc: '西方伦理学的奠基之作' }
          ],
          children: [
            { id: 'normative-ethics', name: '规范伦理学', description: '功利主义、义务论、德性伦理学等道德理论。', children: [
              { id: 'consequentialism', name: '功利主义', description: '最大多数人的最大幸福。', children: [] },
              { id: 'deontology', name: '义务论', description: '行为的道德价值在于动机。', children: [] },
              { id: 'virtue-ethics', name: '德性伦理学', description: '关注人的品格和美德。', children: [] }
            ]},
            { id: 'applied-ethics', name: '应用伦理学', description: '生命伦理、商业伦理、环境伦理等具体领域。', children: [
              { id: 'bioethics', name: '生命伦理', description: '堕胎、安乐死、克隆等。', children: [] },
              { id: 'business-ethics', name: '商业伦理', description: '企业道德和社会责任。', children: [] },
              { id: 'environmental-ethics', name: '环境伦理', description: '人与自然的关系。', children: [] }
            ]},
            { id: 'meta-ethics', name: '元伦理学', description: '道德语言、道德事实、道德相对主义等问题。', children: [
              { id: 'moral-realism', name: '道德实在论', description: '道德事实是客观存在的。', children: [] },
              { id: 'moral-relativism', name: '道德相对主义', description: '道德判断是相对的。', children: [] }
            ]}
          ]
        },
        {
          id: 'logic',
          name: '逻辑学',
          description: '研究有效推理和论证形式的学科。',
          books: [
            { title: '逻辑学基础', author: '王路', desc: '中文逻辑学教材' }
          ],
          children: [
            { id: 'formal-logic', name: '形式逻辑', description: '命题逻辑、谓词逻辑的形式系统。', children: [
              { id: 'propositional-logic', name: '命题逻辑', description: '简单命题及其联结词。', children: [] },
              { id: 'predicate-logic', name: '谓词逻辑', description: '个体、谓词和量词。', children: [] }
            ]},
            { id: 'informal-logic', name: '非形式逻辑', description: '论证分析、谬误识别等日常推理技能。', children: [
              { id: 'argument-analysis', name: '论证分析', description: '识别论证结构。', children: [] },
              { id: 'fallacies', name: '谬误', description: '非形式谬误的类型。', children: [] }
            ]},
            { id: 'philosophical-logic', name: '哲学逻辑', description: '模态逻辑、时态逻辑等扩展逻辑系统。', children: [
              { id: 'modal-logic', name: '模态逻辑', description: '可能性与必然性。', children: [] },
              { id: 'deontic-logic', name: '道义逻辑', description: '义务与许可。', children: [] }
            ]}
          ]
        },
        {
          id: 'history-philosophy',
          name: '哲学史',
          description: '哲学思想发展的历史脉络。',
          books: [
            { title: '西方哲学史', author: '罗素', desc: '西方哲学通史' },
            { title: '中国哲学史', author: '冯友兰', desc: '中国哲学经典教材' }
          ],
          children: [
            { id: 'ancient-phil', name: '古代哲学', description: '古希腊哲学、先秦哲学等早期哲学思想。', children: [
              { id: 'presocratic', name: '前苏格拉底', description: '自然哲学学派。', children: [] },
              { id: 'classical-greek', name: '古典希腊', description: '苏格拉底、柏拉图、亚里士多德。', children: [] },
              { id: 'chinese-classical', name: '先秦诸子', description: '儒、道、墨、法等流派。', children: [] }
            ]},
            { id: 'medieval-phil', name: '中世纪哲学', description: '基督教哲学、伊斯兰哲学。', children: [
              { id: 'patristics', name: '教父哲学', description: '奥古斯丁等。', children: [] },
              { id: 'scholasticism', name: '经院哲学', description: '托马斯·阿奎那等。', children: [] }
            ]},
            { id: 'modern-phil', name: '近代哲学', description: '笛卡尔到康德的近代哲学发展。', children: [
              { id: 'rationalism', name: '理性主义', description: '笛卡尔、斯宾诺莎、莱布尼茨。', children: [] },
              { id: 'empiricism', name: '经验主义', description: '洛克、贝克莱、休谟。', children: [] },
              { id: 'german-idealism', name: '德国观念论', description: '康德、费希特、黑格尔。', children: [] }
            ]},
            { id: 'contemporary-phil', name: '当代哲学', description: '分析哲学、现象学、存在主义等20世纪哲学流派。', children: [
              { id: 'analytic-phil', name: '分析哲学', description: '弗雷格、罗素、维特根斯坦。', children: [] },
              { id: 'phenomenology', name: '现象学', description: '胡塞尔、海德格尔、梅洛-庞蒂。', children: [] },
              { id: 'existentialism', name: '存在主义', description: '萨特、加缪。', children: [] }
            ]}
          ]
        }
      ]
    }
  },
  {
    id: 'physics',
    name: '物理学',
    root: {
      id: 'physics-root',
      name: '物理学',
      description: '研究物质、能量、空间、时间及其相互作用的自然科学，是理解自然规律的基础学科。',
      books: [
        { title: '费曼物理学讲义', author: '理查德·费曼', desc: '物理学经典教材' },
        { title: '物理学的进化', author: '爱因斯坦', desc: '物理学思想发展史' }
      ],
      videos: [
        { title: 'MIT开放课程物理', url: 'https://ocw.mit.edu/courses/physics', desc: 'MIT物理课程' }
      ],
      children: [
        {
          id: 'mechanics',
          name: '力学',
          description: '研究物体运动和力的作用的物理学分支。',
          books: [
            { title: '经典力学', author: 'Goldstein', desc: '理论力学经典教材' }
          ],
          children: [
            { id: 'kinematics', name: '运动学', description: '描述物体运动的几何性质，不涉及力的作用。', children: [
              { id: 'linear-motion', name: '直线运动', description: '位移、速度、加速度。', children: [] },
              { id: 'projectile-motion', name: '抛体运动', description: '平抛、斜抛运动。', children: [] },
              { id: 'circular-motion', name: '圆周运动', description: '角速度、向心加速度。', children: [] }
            ]},
            { id: 'dynamics', name: '动力学', description: '研究力与运动的关系，牛顿运动定律。', children: [
              { id: 'newton-laws', name: '牛顿定律', description: '惯性、力、加速度、反作用。', children: [] },
              { id: 'momentum', name: '动量', description: '动量守恒定律。', children: [] },
              { id: 'energy', name: '能量', description: '动能、势能、功。', children: [] }
            ]},
            { id: 'gravitation', name: '万有引力', description: '天体运动和引力理论。', children: [
              { id: 'newton-gravitation', name: '牛顿万有引力', description: '万有引力定律。', children: [] },
              { id: 'orbital-motion', name: '轨道运动', description: '开普勒定律。', children: [] },
              { id: 'general-relativity', name: '广义相对论', description: '时空弯曲。', children: [] }
            ]}
          ]
        },
        {
          id: 'electromagnetism',
          name: '电磁学',
          description: '研究电场、磁场及其相互作用的物理学分支。',
          books: [
            { title: '电磁学', author: 'Griffiths', desc: '电磁学标准教材' }
          ],
          children: [
            { id: 'electrostatics', name: '静电学', description: '研究静止电荷产生的电场。', children: [
              { id: 'coulomb-law', name: '库仑定律', description: '电荷间作用力。', children: [] },
              { id: 'electric-field', name: '电场', description: '电场的概念和计算。', children: [] },
              { id: 'gauss-law', name: '高斯定理', description: '电通量与电荷。', children: [] }
            ]},
            { id: 'magnetism', name: '磁学', description: '研究磁场和磁性材料。', children: [
              { id: 'magnetic-field', name: '磁场', description: '磁感应强度。', children: [] },
              { id: 'ampere-law', name: '安培定律', description: '电流产生磁场。', children: [] },
              { id: 'magnetic-materials', name: '磁性材料', description: '顺磁、抗磁、铁磁。', children: [] }
            ]},
            { id: 'electromagnetic-induction', name: '电磁感应', description: '变化的磁场产生电场。', children: [
              { id: 'faraday-law', name: '法拉第定律', description: '感应电动势。', children: [] },
              { id: 'lenz-law', name: '楞次定律', description: '感应电流方向。', children: [] },
              { id: 'inductance', name: '电感', description: '自感、互感。', children: [] }
            ]},
            { id: 'electromagnetic-waves', name: '电磁波', description: '电磁辐射的传播和应用。', children: [
              { id: 'maxwell-equations', name: '麦克斯韦方程组', description: '电磁场基本方程。', children: [] },
              { id: 'wave-properties', name: '波动性质', description: '波长、频率、速度。', children: [] },
              { id: 'spectrum', name: '电磁波谱', description: '从射电到伽马射线。', children: [] }
            ]}
          ]
        },
        {
          id: 'thermodynamics',
          name: '热力学',
          description: '研究热现象和能量转换规律的物理学分支。',
          books: [
            { title: '热力学与统计物理', author: '汪志诚', desc: '热力学教材' }
          ],
          children: [
            { id: 'thermo-laws', name: '热力学定律', description: '热力学四大定律及其应用。', children: [
              { id: 'zeroth-law', name: '热力学第零定律', description: '热平衡的传递性。', children: [] },
              { id: 'first-law', name: '热力学第一定律', description: '能量守恒。', children: [] },
              { id: 'second-law', name: '热力学第二定律', description: '熵增原理。', children: [] },
              { id: 'third-law', name: '热力学第三定律', description: '绝对零度不可达。', children: [] }
            ]},
            { id: 'statistical-mechanics', name: '统计力学', description: '从微观粒子运动解释宏观热现象。', children: [
              { id: 'kinetic-theory', name: '分子动理论', description: '气体分子运动论。', children: [] },
              { id: 'ensemble', name: '统计系综', description: '微正则、正则、巨正则系综。', children: [] },
              { id: 'phase-transition', name: '相变', description: '物态变化。', children: [] }
            ]},
            { id: 'heat-transfer', name: '热传递', description: '热传导、对流、辐射三种传热方式。', children: [
              { id: 'conduction', name: '热传导', description: '傅里叶定律。', children: [] },
              { id: 'convection', name: '热对流', description: '牛顿冷却定律。', children: [] },
              { id: 'radiation', name: '热辐射', description: '黑体辐射。', children: [] }
            ]}
          ]
        },
        {
          id: 'quantum-physics',
          name: '量子物理',
          description: '研究微观粒子行为的现代物理学分支。',
          books: [
            { title: '量子力学概论', author: 'Griffiths', desc: '量子力学入门教材' }
          ],
          videos: [
            { title: '量子力学课程', url: 'https://ocw.mit.edu/courses/physics/8-04-quantum-physics-i-spring-2016', desc: 'MIT量子力学课程' }
          ],
          children: [
            { id: 'quantum-mechanics', name: '量子力学', description: '波粒二象性、不确定性原理等基本概念。', children: [
              { id: 'wave-function', name: '波函数', description: '量子态的描述。', children: [] },
              { id: 'schrodinger-equation', name: '薛定谔方程', description: '量子动力学基本方程。', children: [] },
              { id: 'uncertainty-principle', name: '不确定性原理', description: '海森堡原理。', children: [] }
            ]},
            { id: 'quantum-applications', name: '量子应用', description: '量子计算、量子通信等前沿应用。', children: [
              { id: 'quantum-computing', name: '量子计算', description: '量子比特、量子门。', children: [] },
              { id: 'quantum-cryptography', name: '量子密码', description: '量子密钥分发。', children: [] },
              { id: 'quantum-sensing', name: '量子传感', description: '精密测量应用。', children: [] }
            ]}
          ]
        }
      ]
    }
  },
  {
    id: 'trae',
    name: 'TRAE IDE',
    root: {
      id: 'trae-root',
      name: 'TRAE IDE',
      description: '一款深度融合 AI 能力的开发工具，提供从代码编写、项目理解、调试运行到变更管理的完整开发体验。支持 IDE 模式和 SOLO 模式，可根据任务复杂度灵活切换。',
      books: [
        { title: 'TRAE IDE 官方文档', author: 'TRAE', url: 'https://docs.trae.cn', desc: 'TRAE IDE 完整使用指南' }
      ],
      links: [
        { title: 'TRAE IDE 官网', url: 'https://www.trae.cn', desc: 'TRAE IDE 官方网站' },
        { title: 'TRAE IDE 下载', url: 'https://www.trae.cn/ide/download', desc: '下载 TRAE IDE' },
        { title: 'TRAE Work', url: 'https://work.trae.cn', desc: 'TRAE Work 网页版' }
      ],
      children: [
        {
          id: 'trae-overview',
          name: '产品概述',
          description: 'TRAE IDE 的基本概念和定位。',
          children: [
            { id: 'trae-introduction', name: '什么是 TRAE IDE', description: '深度融合 AI 能力的开发工具，提供完整的开发体验。', children: [
              { id: 'trae-definition', name: '产品定义', description: '从代码编写到变更管理的完整开发体验。', children: [] },
              { id: 'trae-goal', name: '设计目标', description: '让 AI 参与需求拆解、代码生成、问题排查、重构优化和变更管理。', children: [] }
            ]},
            { id: 'trae-products', name: '产品体系', description: 'TRAE IDE 的多个版本和客户端。', children: [
              { id: 'trae-ide', name: 'TRAE IDE', description: '传统 IDE 模式的开发工具。', children: [] },
              { id: 'trae-work', name: 'TRAE Work', description: '提供 Work 与 Code 双模式的客户端。', children: [] },
              { id: 'trae-clients', name: '多端支持', description: '网页版、桌面版和移动版三种客户端。', children: [] }
            ]}
          ]
        },
        {
          id: 'trae-modes',
          name: '双重开发模式',
          description: 'IDE 模式与 SOLO 模式的详细介绍。',
          children: [
            { id: 'ide-mode',
              name: 'IDE 模式',
              description: '保留熟悉的编辑器、终端、调试、插件、源代码管理等工作流。',
              children: [
                { id: 'ide-editor', name: '编辑器', description: '支持主流编程语言的代码编辑。', children: [] },
                { id: 'ide-terminal', name: '终端', description: '集成终端方便执行命令。', children: [] },
                { id: 'ide-debug', name: '调试', description: '完整的调试功能。', children: [] },
                { id: 'ide-plugin', name: '插件系统', description: '支持丰富的插件扩展。', children: [] },
                { id: 'ide-git', name: 'Git 集成', description: '内置完整的 Git 工作流。', children: [] }
              ]
            },
            { id: 'solo-mode',
              name: 'SOLO 模式',
              description: '以 AI 为主导，通过自然语言描述或语音输入需求，AI 自动规划并执行任务。',
              children: [
                { id: 'solo-input', name: '输入方式', description: '支持自然语言和语音输入。', children: [] },
                { id: 'solo-auto-plan', name: '自动规划', description: 'AI 自动分解任务并制定计划。', children: [] },
                { id: 'solo-auto-execute', name: '自动执行', description: 'AI 推进代码生成、测试、预览等步骤。', children: [] },
                { id: 'solo-summary', name: '变更总结', description: '完成后自动总结变更内容。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'trae-ai',
          name: 'AI 编程能力',
          description: 'TRAE IDE 的核心 AI 功能。',
          children: [
            { id: 'trae-model', name: '模型支持', description: '内置多种先进模型，支持自定义模型接入。', children: [
              { id: 'built-in-models', name: '内置模型', description: '多种先进的内置模型可供选择。', children: [] },
              { id: 'custom-models', name: '自定义模型', description: '通过 API Key 接入自定义模型。', children: [] },
              { id: 'model-selection', name: '模型选择', description: '根据任务类型、性能和偏好选择模型。', children: [] }
            ]},
            { id: 'trae-agent',
              name: '智能体',
              description: '通过自然语言定义任务，AI 智能体可理解需求、检索代码库、制定多步骤计划。',
              children: [
                { id: 'agent-capability', name: '智能体能力', description: '理解需求、检索代码、制定计划、调用工具。', children: [] },
                { id: 'agent-creation', name: '创建智能体', description: '创建自定义智能体。', children: [] },
                { id: 'agent-config', name: '智能体配置', description: '配置提示词、MCP Server 和工具集。', children: [] }
              ]
            },
            { id: 'trae-cue',
              name: 'CUE 代码补全',
              description: '智能代码补全和编辑辅助功能。',
              children: [
                { id: 'cue-completion', name: '代码补全', description: '智能代码补全建议。', children: [] },
                { id: 'cue-chain', name: '链式补全', description: '多行代码连续补全。', children: [] },
                { id: 'cue-multiline', name: '多行修改', description: '批量修改多行代码。', children: [] },
                { id: 'cue-prediction', name: '修改点预测', description: '预测并展示可能的修改。', children: [] },
                { id: 'cue-smart-import', name: '智能导入', description: 'Python、TypeScript、Golang 项目中辅助导入依赖。', children: [] },
                { id: 'cue-smart-rename', name: '智能重命名', description: '重命名时自动更新所有引用。', children: [] }
              ]
            },
            { id: 'trae-context',
              name: '上下文',
              description: '提供多种上下文类型，让 AI 基于更完整的信息工作。',
              children: [
                { id: 'context-file', name: '文件上下文', description: '将文件作为上下文。', children: [] },
                { id: 'context-folder', name: '文件夹上下文', description: '将文件夹作为上下文。', children: [] },
                { id: 'context-snippet', name: '代码片段', description: '将代码片段作为上下文。', children: [] },
                { id: 'context-terminal', name: '终端输出', description: '将终端输出作为上下文。', children: [] },
                { id: 'context-repo', name: '代码仓库', description: '将整个代码仓库作为上下文。', children: [] },
                { id: 'context-web', name: '网页', description: '将网页内容作为上下文。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'trae-tools',
          name: '开发工具链',
          description: '完整的 IDE 基础开发能力。',
          children: [
            { id: 'trae-editor-debug',
              name: '代码编辑与调试',
              description: '支持主流编程语言和开发框架，集成编辑、运行、调试等基础能力。',
              children: [
                { id: 'language-support', name: '语言支持', description: '对多种编程语言的语法高亮、代码提示。', children: [] },
                { id: 'framework-support', name: '框架支持', description: '主流开发框架的集成。', children: [] },
                { id: 'debugging', name: '调试功能', description: '断点、变量监视、调用栈等。', children: [] }
              ]
            },
            { id: 'trae-git',
              name: '源代码管理',
              description: '内置完整的 Git 工作流。',
              children: [
                { id: 'git-operations', name: 'Git 操作', description: '提交、拉取、推送等基本操作。', children: [] },
                { id: 'branch-management', name: '分支管理', description: '创建、切换、合并分支。', children: [] },
                { id: 'ai-commit', name: 'AI 生成 Commit', description: '利用 AI 生成规范的 Commit Message。', children: [] }
              ]
            },
            { id: 'trae-review',
              name: '智能代码审查',
              description: '对代码变更进行总结和审查。',
              children: [
                { id: 'review-uncommitted', name: '未提交变更审查', description: '审查工作区的变更。', children: [] },
                { id: 'review-commit', name: '提交审查', description: '审查单次提交的内容。', children: [] },
                { id: 'review-diff', name: '分支差异审查', description: '审查分支间的差异。', children: [] },
                { id: 'review-output', name: '审查输出', description: '摘要、流程图和 diff 视图辅助理解代码改动。', children: [] }
              ]
            },
            {
              id: 'trae-remote',
              name: '远程开发',
              description: '支持通过 Remote SSH 或 WSL 连接远程主机。',
              children: [
                { id: 'remote-ssh', name: 'Remote SSH', description: '通过 SSH 连接远程服务器。', children: [] },
                { id: 'remote-wsl', name: 'WSL 支持', description: '支持 Windows Subsystem for Linux。', children: [] },
                { id: 'remote-workflow', name: '远程工作流', description: '在远程环境中完成开发。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'trae-security',
          name: '安全能力',
          description: '隐私保护和沙箱运行能力。',
          children: [
            { id: 'trae-privacy',
              name: '隐私模式',
              description: '开启后不会将对话内容、代码片段及 AI 输出用于数据分析或模型训练。',
              children: [
                { id: 'privacy-chat', name: '对话隐私', description: '对话内容不会被用于数据分析。', children: [] },
                { id: 'privacy-code', name: '代码隐私', description: '代码片段不会被用于训练。', children: [] },
                { id: 'privacy-local', name: '本地存储', description: '代码库文件始终保存在本地设备上。', children: [] }
              ]
            },
            { id: 'trae-sandbox',
              name: '沙箱运行',
              description: '智能体生成的命令可以在受限环境中执行。',
              children: [
                { id: 'sandbox-file', name: '文件访问控制', description: '限制文件访问权限。', children: [] },
                { id: 'sandbox-command', name: '命令拦截', description: '高风险命令拦截策略。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'trae-usecases',
          name: '使用场景',
          description: 'TRAE IDE 的典型使用场景。',
          children: [
            { id: 'trae-create-project',
              name: '从 0 到 1 创建项目',
              description: '通过自然语言描述需求，让智能体协助完成需求拆解、代码生成、运行验证和结果预览。',
              children: [
                { id: 'requirement-breakdown', name: '需求拆解', description: 'AI 理解需求并分解任务。', children: [] },
                { id: 'code-generation', name: '代码生成', description: '根据需求自动生成代码。', children: [] },
                { id: 'run-verify', name: '运行验证', description: '运行代码并验证结果。', children: [] }
              ]
            },
            { id: 'trae-maintain',
              name: '维护已有代码库',
              description: '基于项目上下文定位相关文件，理解依赖关系，围绕已有实现进行修改、重构或排查问题。',
              children: [
                { id: 'code-locating', name: '代码定位', description: '快速定位相关文件。', children: [] },
                { id: 'dependency-understanding', name: '依赖理解', description: '理解代码依赖关系。', children: [] },
                { id: 'code-modification', name: '代码修改', description: '修改、重构或排查问题。', children: [] }
              ]
            },
            { id: 'trae-efficiency',
              name: '提升编码效率',
              description: '使用 CUE 获取代码补全、多行修改、修改点预测、智能导入和智能重命名等建议。',
              children: [
                { id: 'efficiency-completion', name: '代码补全', description: '智能补全提升编写速度。', children: [] },
                { id: 'efficiency-modification', name: '批量修改', description: '多行修改提高效率。', children: [] },
                { id: 'efficiency-import', name: '智能导入', description: '自动导入依赖。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'trae-fastpass',
          name: '高峰期加速',
          description: '"速通"权益帮助在高峰期加速体验。',
          children: [
            { id: 'fastpass-overview', name: '"速通"权益', description: '当模型负载较高时，使用速通权益加速本次 Query。', children: [] },
            { id: 'fastpass-benefit', name: '权益优势', description: '关键开发任务中更快获得模型响应，减少等待。', children: [] }
          ]
        },
        {
          id: 'trae-getting-started',
          name: '快速开始',
          description: '开始使用 TRAE IDE 的基本步骤。',
          children: [
            { id: 'trae-install', name: '安装', description: '下载并安装 TRAE IDE。', children: [] },
            { id: 'trae-setup', name: '环境配置', description: '配置开发环境。', children: [] },
            { id: 'trae-first-project', name: '创建第一个项目', description: '开始使用 TRAE IDE 开发项目。', children: [] }
          ]
        }
      ]
    }
  }
];

// 导出数据供 tree.html 使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = knowledgeTrees;
}
