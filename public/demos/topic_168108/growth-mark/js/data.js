/**
 * 成长印记 · 预置演示数据
 * 用于 Demo 阶段展示完整功能体验
 * 设计原则：数据真实可信，覆盖完整场景，包含"困难→突破"与"跨领域关联"典型成长故事
 *
 * 注：路线（paths）概念已与标签合并，演进路线视图改为按标签聚合的时间轴。
 *     类型（insightType）也已合并到标签中，主分类(工作/学习/项目/情绪/成长)作为第一个标签附加。
 *     标签颜色由 Store._tagColor 基于标签名 hash 生成，无需在此预置。
 */

// ============================================================
// 成长印记数据
// 22 条记录，覆盖约 2 个月时间跨度（2026年5月中旬 - 7月中旬）
// 记录结构：{ id, createdAt, displayDate, originalContent, understanding, warmResponse, milestone }
// understanding: { title, summary, tags }（类型已合并到标签中，主分类作为第一个标签）
// milestone: 'first_step' | 'breakthrough' | 'cross_node' | null（由 mockAI.checkMilestone 判断）
// 标签策略：集中在 前端开发、数据分析、数据看板、阅读、健身、增长策略 几个核心方向
// ============================================================
const PRESET_RECORDS = [
  // ========== 第1-2周：起步阶段 ==========
  {
    id: '#001',
    createdAt: new Date('2026-05-12T19:20:00').getTime(),
    displayDate: '2026年5月12日 19:20',
    originalContent: '今天正式开始学习React。跟着官方教程走了一遍，学会了组件、props和state的基本概念。写了第一个TodoList组件，虽然很简单，但跑起来那一刻还是挺有成就感的。前端开发这条路，我算是迈出了第一步。',
    understanding: {
      title: 'React入门：第一个组件跑起来了',
      summary: '通过官方教程学习了React基础概念，完成了第一个TodoList组件，正式开启前端开发学习之路。',
      tags: ['学习', '前端开发', 'React', '入门']
    },
    warmResponse: '万事开头难，你已经迈出去了。前端开发这个方向上，你正站在起点——但起点本身就是值得被记住的一步。',
    milestone: 'first_step',
    relations: { upstream: [], crossLinks: [] }
  },
  {
    id: '#002',
    createdAt: new Date('2026-05-15T07:00:00').getTime(),
    displayDate: '2026年5月15日 07:00',
    originalContent: '今天早起去跑步了。虽然只跑了两公里就喘得不行，但总算是启动了。之前总说要锻炼身体，一直拖着。从今天开始，每天早上早起半小时跑步，希望能坚持下去。',
    understanding: {
      title: '晨跑计划启动：第一天2公里',
      summary: '正式启动晨跑计划，第一天跑了2公里，虽然很累但迈出了第一步，希望能形成习惯。',
      tags: ['成长', '健身', '晨跑', '习惯养成']
    },
    warmResponse: '新的方向开始了，第一步很重要。',
    milestone: 'first_step',
    relations: { upstream: [], crossLinks: [] }
  },
  {
    id: '#017',
    createdAt: new Date('2026-05-18T14:00:00').getTime(),
    displayDate: '2026年5月18日 14:00',
    originalContent: '今天和 mentor 一对一沟通。他建议我除了写代码，还要多关注业务指标。技术本身只是手段，最终目标是解决业务问题。还推荐我看《精益数据分析》。这次谈话让我意识到，自己之前太关注技术细节，忽略了业务价值。转变一下思路。',
    understanding: {
      title: 'Mentor一对一：从技术思维到业务思维',
      summary: '和mentor沟通后意识到不能只关注技术，要多理解业务指标和业务价值，调整了工作思路。',
      tags: ['工作', 'mentor', '业务理解', '反思']
    },
    warmResponse: null,
    milestone: null,
    relations: { upstream: [], crossLinks: [] }
  },

  // ========== 第3-4周：遇到困难，阅读启发 ==========
  {
    id: '#003',
    createdAt: new Date('2026-05-20T22:10:00').getTime(),
    displayDate: '2026年5月20日 22:10',
    originalContent: 'React Hooks好难啊，useEffect的依赖数组老是搞不对。要么就是无限循环，要么就是捕获了旧值。看了好几篇文章，还是一知半解。写个搜索组件写了一晚上，bug一个接一个。感觉自己是不是不适合做前端。',
    understanding: {
      title: 'React Hooks：useEffect依赖数组搞不定',
      summary: '在React Hooks的学习上遇到困难，useEffect依赖数组问题反复出现，产生了挫败感。',
      tags: ['情绪', '前端开发', 'React Hooks', '挫败感']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#001', type: 'same_topic_deepen', reason: '同样在探索「前端开发」' }
      ],
      crossLinks: []
    }
  },
  {
    id: '#004',
    createdAt: new Date('2026-05-24T20:30:00').getTime(),
    displayDate: '2026年5月24日 20:30',
    originalContent: '读完了《原子习惯》。收获最大的一句话是：习惯不是达成目标的手段，习惯本身就是目标。以前总觉得要做大事，现在才明白，每天一点点的小改变，累积起来才是最可怕的。决定从明天开始，每天睡前读15分钟书，先坚持30天看看。',
    understanding: {
      title: '《原子习惯》读后感：小习惯的力量',
      summary: '读完《原子习惯》，理解了习惯累积的力量，决定从每天15分钟阅读开始培养习惯。',
      tags: ['成长', '阅读', '习惯养成', '反思']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#002', type: 'same_topic_deepen', reason: '同样在探索「习惯养成」' }
      ],
      crossLinks: []
    }
  },
  {
    id: '#005',
    createdAt: new Date('2026-05-28T15:00:00').getTime(),
    displayDate: '2026年5月28日 15:00',
    originalContent: '参加了Q2总结和Q3规划会。产品经理说Q3的核心目标是提升用户留存和活跃度，讨论了好几个方案，最后定了做社区裂变和数据驱动运营。我被分到了数据看板组——需要做一个能实时看用户行为数据的看板。虽然是第一次做这种项目，但感觉是个好机会。',
    understanding: {
      title: 'Q3规划：数据看板项目立项',
      summary: '参与Q3规划会，确定了数据驱动运营的方向，自己将负责数据看板项目，期待新的挑战。',
      tags: ['工作', '增长策略', '数据看板', '需求评审']
    },
    warmResponse: null,
    milestone: null,
    relations: { upstream: [], crossLinks: [] }
  },
  {
    id: '#018',
    createdAt: new Date('2026-05-30T10:00:00').getTime(),
    displayDate: '2026年5月30日 10:00',
    originalContent: 'Q3目标定下来了，压力好大。数据看板只是其中一个模块，还有社区裂变、运营活动好几个并行项目。导师说新人不要贪多，先把手头的事做好。道理都懂，但看到其他同事同时在推进多个项目，还是有点焦虑，担心自己进度落后。',
    understanding: {
      title: 'Q3目标压力：多项目并行焦虑',
      summary: '面对Q3多项目并行的压力感到焦虑，导师建议专注当下，但自己仍担心进度落后。',
      tags: ['情绪', '工作压力', '焦虑', '项目压力']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#005', type: 'same_topic_deepen', reason: '同样在探索「工作」' }
      ],
      crossLinks: []
    }
  },

  // ========== 第5-6周：突破与新项目 ==========
  {
    id: '#006',
    createdAt: new Date('2026-06-03T23:45:00').getTime(),
    displayDate: '2026年6月3日 23:45',
    originalContent: '终于搞懂useEffect了！原来关键不是记住依赖数组怎么写，而是理解"副作用"和"闭包捕获"的概念。今天重写了那个搜索组件，一次就跑通了。而且顺便把useCallback和useMemo也搞明白了。两周前还觉得React Hooks像天书一样，现在居然能用得挺顺手了。这种从卡住到突破的感觉，真的太爽了。',
    understanding: {
      title: 'React Hooks：从卡住到彻底搞懂',
      summary: '通过理解副作用和闭包捕获的概念，终于突破了React Hooks的学习瓶颈，感受到学习的正向反馈。',
      tags: ['学习', '前端开发', 'React Hooks', '突破']
    },
    warmResponse: '从"好难"到"搞定"，这一步值得被看见。十四天前你还在为useEffect沮丧，现在你已经站在另一边了。这种感觉，是成长最好的证明。',
    milestone: 'breakthrough',
    relations: {
      upstream: [
        { recordId: '#003', type: 'emotion_arc', reason: '从「React Hooks：useEffect依赖数组搞不定」到突破' }
      ],
      crossLinks: []
    }
  },
  {
    id: '#007',
    createdAt: new Date('2026-06-07T16:30:00').getTime(),
    displayDate: '2026年6月7日 16:30',
    originalContent: '数据看板的方案设计初稿完成了。画了两版线框图：第一版是核心指标看板（DAU、留存、转化率），第二版加上了用户行为漏斗和裂变路径分析。和产品经理讨论后，决定第一期先做核心指标和漏斗，裂变分析放到第二期。下周开始写代码。',
    understanding: {
      title: '数据看板方案设计：两版迭代确定方向',
      summary: '完成数据看板方案设计，经历两版迭代，确定分阶段交付策略，下周开始开发。',
      tags: ['项目', '数据看板', '方案设计', '迭代']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#005', type: 'cause_effect', reason: '从「Q3规划：数据看板项目立项」到「数据看板方案设计」' }
      ],
      crossLinks: []
    }
  },
  {
    id: '#008',
    createdAt: new Date('2026-06-11T07:30:00').getTime(),
    displayDate: '2026年6月11日 07:30',
    originalContent: '晨跑坚持了四周了！从最开始的两公里喘得不行，到现在能轻松跑五公里。体重虽然没怎么变，但感觉整个人精神状态好了很多，白天工作也不容易犯困了。原来习惯养成就像滚雪球，一开始很难，一旦动起来就越来越顺。',
    understanding: {
      title: '晨跑四周：从2公里到5公里',
      summary: '晨跑坚持了四周，从2公里进步到5公里，精神状态明显改善，体会到习惯养成的滚雪球效应。',
      tags: ['成长', '健身', '晨跑', '坚持']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#002', type: 'same_topic_deepen', reason: '同样在探索「健身」' }
      ],
      crossLinks: [
        { recordId: '#004', sharedTag: '习惯养成', otherTag: '阅读' }
      ]
    }
  },
  {
    id: '#009',
    createdAt: new Date('2026-06-14T10:00:00').getTime(),
    displayDate: '2026年6月14日 10:00',
    originalContent: '因为要做数据看板，开始学习SQL和数据分析。学了基础的SELECT、WHERE、GROUP BY，然后学了JOIN和窗口函数。把公司的用户行为数据导出来练手，写了几个查询语句算留存率，发现比Excel快太多了。数据这东西，一旦会用SQL，感觉就像打开了新世界的大门。',
    understanding: {
      title: 'SQL入门：从Excel到数据库',
      summary: '为项目需要学习SQL基础，掌握了JOIN和窗口函数，体会到数据分析的效率和价值。',
      tags: ['学习', '数据分析', 'SQL', '数据库']
    },
    warmResponse: '万事开头难，你已经迈出去了。数据分析这条路上，你正站在起点——但起点本身就是值得被记住的一步。',
    milestone: 'first_step',
    relations: { upstream: [], crossLinks: [] }
  },
  {
    id: '#019',
    createdAt: new Date('2026-06-17T20:00:00').getTime(),
    displayDate: '2026年6月17日 20:00',
    originalContent: '看 React 文档的 Suspense 和 Error Boundary 章节，看了两遍还是不太理解。脑子里好像有个墙，一碰到这些概念就绕不过去。怀疑是不是自己的理解方式有问题。有点焦虑，但不想放弃。明天换个教程试试。',
    understanding: {
      title: 'React进阶：Suspense和Error Boundary卡住',
      summary: '在React进阶学习中遇到困难，Suspense和Error Boundary概念难以理解，产生焦虑但不愿放弃。',
      tags: ['情绪', '前端开发', '学习卡点', '焦虑']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#006', type: 'same_topic_deepen', reason: '同样在探索「前端开发」' }
      ],
      crossLinks: []
    }
  },

  // ========== 第7-8周：深入与跨领域 ==========
  {
    id: '#010',
    createdAt: new Date('2026-06-19T17:00:00').getTime(),
    displayDate: '2026年6月19日 17:00',
    originalContent: '今天开增长策略会，产品问我能不能从数据角度分析一下不同渠道的用户留存差异。我用刚学的SQL写了个查询，按渠道分组算7日留存和30日留存，还做了个 cohort 分析。结果发现内容渠道的留存比渠道投放高两倍多，这个结论直接影响了下周的预算分配。没想到数据分析这么快就能用到实际业务上，还真的能产生影响。',
    understanding: {
      title: '增长策略会：数据分析驱动决策',
      summary: '在增长策略会上用SQL做了渠道留存分析，得出的结论直接影响了预算分配，实现了数据分析的业务价值。',
      tags: ['工作', '增长策略', '数据分析', 'SQL']
    },
    warmResponse: '有意思，你把SQL数据分析用到了增长策略上。跨领域的连接往往最有价值——你刚刚做了一个。',
    milestone: 'cross_node',
    relations: {
      upstream: [
        { recordId: '#009', type: 'method_transfer', reason: '将「数据分析」的方法迁移到新领域' }
      ],
      crossLinks: [
        { recordId: '#005', sharedTag: '增长策略', otherTag: '需求评审' }
      ]
    }
  },
  {
    id: '#020',
    createdAt: new Date('2026-06-22T11:00:00').getTime(),
    displayDate: '2026年6月22日 11:00',
    originalContent: '周会上汇报了数据看板V1的进度。虽然功能基本完成了，但数据加载速度有点慢。导师说性能优化也很重要，建议我加缓存。虽然项目没延期，但自己觉得还可以做得更好。记录下来，提醒自己不要只关注功能完成。',
    understanding: {
      title: '周会汇报：数据看板V1进度与性能反思',
      summary: '在周会上汇报数据看板V1进度，导师指出性能优化方向，提醒自己不能只关注功能完成。',
      tags: ['工作', '数据看板', '性能优化', '反思']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#007', type: 'same_topic_deepen', reason: '同样在探索「数据看板」' }
      ],
      crossLinks: [
        { recordId: '#010', sharedTag: '工作', otherTag: '增长策略' }
      ]
    }
  },

  {
    id: '#011',
    createdAt: new Date('2026-06-23T19:45:00').getTime(),
    displayDate: '2026年6月23日 19:45',
    originalContent: '数据看板第一版终于上线了！前端用ECharts做了折线图和漏斗图，后端接了MySQL做实时查询。导师review的时候说，一个新人能在三周内做出这样的东西，超出预期。虽然还有很多可以优化的地方，但总算是从0到1独立完成了一个项目。',
    understanding: {
      title: '数据看板V1上线：从0到1的交付',
      summary: '独立完成数据看板第一版开发并上线，包含ECharts可视化和MySQL后端，获得导师认可。',
      tags: ['项目', '数据看板', 'ECharts', '交付']
    },
    warmResponse: '从Q3规划里的"负责数据看板"，到今天真正交付初版——这一步，你走了26天，做到了。',
    milestone: 'first_step',
    relations: {
      upstream: [
        { recordId: '#007', type: 'cause_effect', reason: '从「数据看板方案设计」到「数据看板V1上线」' },
        { recordId: '#005', type: 'cause_effect', reason: '从「Q3规划」到「数据看板V1上线」' }
      ],
      crossLinks: [
        { recordId: '#010', sharedTag: '数据看板', otherTag: '增长策略' }
      ]
    }
  },
  {
    id: '#012',
    createdAt: new Date('2026-06-27T21:15:00').getTime(),
    displayDate: '2026年6月27日 21:15',
    originalContent: '这周读完了《深度工作》。书里说，深度工作是在无干扰的状态下专注进行职业活动，使个人的认知能力达到极限。反思了一下自己，每天上班大部分时间都在回消息、开各种会，真正专注写代码的时间可能不到两小时。决定从下周开始，每天上午留两小时"深度工作时间"，不看消息不参会。',
    understanding: {
      title: '《深度工作》读后感：专注的价值',
      summary: '读完《深度工作》，反思自己的工作状态，决定每天设置两小时深度工作时间来提升效率。',
      tags: ['成长', '阅读', '工作方法', '反思']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#004', type: 'same_topic_deepen', reason: '同样在探索「阅读」' }
      ],
      crossLinks: []
    }
  },
  {
    id: '#013',
    createdAt: new Date('2026-06-30T23:00:00').getTime(),
    displayDate: '2026年6月30日 23:00',
    originalContent: '开始学TypeScript了。之前写JavaScript的时候觉得挺自由的，加了类型之后反而有点束手束脚。特别是interface和泛型，看了半天还是迷迷糊糊的。不过也能理解为什么大项目都用TS——类型系统确实能避免很多低级bug。慢慢来，先从给现有代码加类型开始。',
    understanding: {
      title: 'TypeScript入门：类型系统初体验',
      summary: '开始学习TypeScript，对类型系统和泛型还不太适应，但理解了TS在大型项目中的价值。',
      tags: ['学习', '前端开发', 'TypeScript', '类型系统']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#006', type: 'same_topic_deepen', reason: '同样在探索「前端开发」' }
      ],
      crossLinks: []
    }
  },
  {
    id: '#021',
    createdAt: new Date('2026-07-01T21:00:00').getTime(),
    displayDate: '2026年7月1日 21:00',
    originalContent: '今天读完了《非暴力沟通》。最大的收获是，沟通的关键不是说服对方，而是表达自己的需求。联想到之前几次和mentor的对话，发现自己确实不太会表达真实的想法。以后每次沟通前，先想想自己的需求是什么，而不是急于解释。',
    understanding: {
      title: '《非暴力沟通》读后感：表达需求而非说服',
      summary: '读完《非暴力沟通》，理解了沟通的本质是表达需求而非说服，反思了自己在职场沟通中的不足。',
      tags: ['成长', '阅读', '沟通', '反思']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#012', type: 'same_topic_deepen', reason: '同样在探索「阅读」' }
      ],
      crossLinks: [
        { recordId: '#017', sharedTag: '反思', otherTag: '工作' }
      ]
    }
  },

  // ========== 第9-10周：整合与复盘 ==========
  {
    id: '#014',
    createdAt: new Date('2026-07-04T18:30:00').getTime(),
    displayDate: '2026年7月4日 18:30',
    originalContent: '用TypeScript重构了数据看板的核心组件。一开始改的时候各种类型报错，改到怀疑人生。但改完之后发现，代码的可读性和可维护性真的提升了很多——以前要看半天才知道一个函数接收什么参数，现在看类型定义就清楚了。而且重构过程中还发现了两个隐藏的bug，TS真香。',
    understanding: {
      title: 'TypeScript重构：代码质量上了一个台阶',
      summary: '用TypeScript重构了数据看板核心组件，虽然初期痛苦，但重构后代码可读性和可维护性大幅提升。',
      tags: ['项目', '前端开发', 'TypeScript', '重构']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#013', type: 'cause_effect', reason: '从「TypeScript入门」到实战重构' }
      ],
      crossLinks: [
        { recordId: '#011', sharedTag: '数据看板', otherTag: '交付' }
      ]
    }
  },
  {
    id: '#022',
    createdAt: new Date('2026-07-05T15:00:00').getTime(),
    displayDate: '2026年7月5日 15:00',
    originalContent: '数据看板的性能优化方案完成了。加了前端缓存，用 ECharts 的 dataZoom 做了分页加载，还优化了 SQL 查询。导师说这次优化方案写得很专业，考虑到了各个层面。虽然只是一个小优化，但感觉自己的思考方式越来越系统了。',
    understanding: {
      title: '数据看板性能优化：方案完成',
      summary: '完成数据看板性能优化方案，包含前端缓存、分页加载和SQL优化，获得导师认可。',
      tags: ['工作', '数据看板', '性能优化', '交付']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#020', type: 'cause_effect', reason: '从「数据看板V1进度汇报」到「性能优化完成」' }
      ],
      crossLinks: [
        { recordId: '#014', sharedTag: '数据看板', otherTag: '前端开发' }
      ]
    }
  },

  {
    id: '#015',
    createdAt: new Date('2026-07-08T16:00:00').getTime(),
    displayDate: '2026年7月8日 16:00',
    originalContent: '数据看板V2上线了！这次加上了用户行为漏斗和裂变路径分析，还做了数据导出功能。产品经理说运营团队用了之后，效率提升了很多，不用再天天找数据团队提数了。听到这话还挺有成就感的——自己写的代码真的在帮别人提高效率。',
    understanding: {
      title: '数据看板V2上线：漏斗分析+数据导出',
      summary: '数据看板V2成功上线，新增漏斗分析和数据导出功能，获得运营团队好评，感受到工作的价值。',
      tags: ['项目', '数据看板', '交付', '迭代']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#011', type: 'same_topic_deepen', reason: '同样在探索「数据看板」' }
      ],
      crossLinks: [
        { recordId: '#010', sharedTag: '增长策略', otherTag: '数据分析' }
      ]
    }
  },
  {
    id: '#016',
    createdAt: new Date('2026-07-15T22:00:00').getTime(),
    displayDate: '2026年7月15日 22:00',
    originalContent: '两个月的时间，回头看看变化还挺大的。技术上：从React入门到能独立做项目，还学了SQL和TypeScript。项目上：从0到1做了数据看板，还迭代到了V2。生活上：晨跑坚持了快两个月，读完了两本书，工作方法也改进了。最关键的是，感觉自己从一个"学习者"变成了一个"创造者"——不再只是学东西，而是能用学到的东西创造价值了。继续加油。',
    understanding: {
      title: '两个月成长复盘：从学习者到创造者',
      summary: '回顾两个月的成长，技术、项目、生活各方面都有收获，最大的转变是从学习者变为创造者。',
      tags: ['成长', '复盘', '前端开发', '数据看板']
    },
    warmResponse: null,
    milestone: null,
    relations: {
      upstream: [
        { recordId: '#001', type: 'same_topic_deepen', reason: '从「React入门」到两个月后的全面成长' }
      ],
      crossLinks: [
        { recordId: '#015', sharedTag: '数据看板', otherTag: '交付' }
      ]
    }
  }
];

// ============================================================
// 时光回顾（基于 PRESET_RECORDS 生成）
// 注意：Store.init 会调用 resetReviewToNearestWeek 重新生成 review，
//       此处的 PRESET_REVIEW 仅作为结构参考与兜底，实际运行时不直接使用。
// 合并后：pathProgress → tagProgress，activePathCount → activeTagCount
// 趋势分析：trend（recordTrend, tagTrends, sufficientData）由 _buildTrendData 实时计算
// 个性化建议：suggestions（规则驱动，0-3条）由 _buildSuggestions 实时计算
// ============================================================
const PRESET_REVIEW = {
  id: 'review-week-2026-07-14',
  timeRange: {
    start: new Date('2026-07-14T00:00:00').getTime(),
    end: new Date('2026-07-20T23:59:59').getTime(),
    label: '2026年7月14日 - 7月20日'
  },
  totalRecords: 1,
  activeTagCount: 2,
  highlights: [
    { recordId: '#016', title: '两个月成长复盘：从学习者到创造者', summary: '回顾两个月成长，技术、项目、生活各方面都有收获' }
  ],
  tagProgress: [
    { tag: '成长', newCount: 1, totalCount: 6 },
    { tag: '前端开发', newCount: 1, totalCount: 7 }
  ],
  comparison: {
    recordsDelta: -2,
    tagsDelta: -2,
    highlightsText: '比上周少 2 条记录'
  },
  warmResponse: '这周你留下了 1 个成长印记。\n\n在 2 个方向上都有进展——成长、前端开发。\n\n其中 1 条值得回看——两个月成长复盘。\n\n从React入门到独立交付项目，从学习者到创造者——这两个月，你走了很远。'
};

// ============================================================
// 导出（供 store.js 初始化使用）
// ============================================================
const PresetData = {
  records: PRESET_RECORDS,
  review: PRESET_REVIEW
};
