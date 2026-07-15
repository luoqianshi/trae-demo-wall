/* ============================================================
   mock-data.js — 示例文稿与 Mock 数据
   ============================================================ */

const MockData = (() => {
  /* 示例文稿 */
  const sampleScripts = [
    {
      id: 'demo-01',
      title: '政策解读类',
      text: `【主持人】
各位观众大家好，欢迎收看今天的快讯解读。

今天我们要重点解读的是刚刚发布的《数字经济发展三年行动计划（2024-2026）》。

这份文件的核心观点是：到2026年，我国数字经济核心产业增加值占GDP比重将达到10%以上。值得注意的是，文件首次明确提出"数据要素市场化配置"的改革方向，这意味着数据将像土地、劳动力一样成为重要的生产要素。

从具体数据来看，2023年我国数字经济规模已达到50.2万亿元，占GDP比重为41.5%。其中，数字产业化规模为9.2万亿元，产业数字化规模为41万亿元。综上所述，产业数字化仍然是数字经济的主战场。

在重点任务方面，文件提出了七大行动，包括：数字基础设施升级、数据要素价值释放、数字技术创新突破、产业数字化转型、数字公共服务普惠化、数字经济治理体系完善、数字经济国际合作深化。

其中，最值得关注的是"数据要素价值释放"行动，文件提出要在2024年底前完成公共数据授权运营试点，并在2025年初步建立数据产权制度。

以上就是今天的政策解读，感谢收看。`,
    },
    {
      id: 'demo-02',
      title: '数据新闻类',
      text: `【主持人】
用数据说话，欢迎收看今天的数说新闻。

首先来看一组引人注目的数据：据国家统计局最新发布，2024年第一季度全国居民人均可支配收入为11539元，同比增长6.2%。其中，城镇居民人均可支配收入为15150元，增长5.3%；农村居民人均可支配收入为6596元，增长7.7%。

值得关注的是，农村居民收入增速已连续三个季度超过城镇居民，城乡收入比从去年同期的2.35:1缩小至2.30:1。

在消费方面，一季度社会消费品零售总额达到12.03万亿元，同比增长4.7%。其中，网上零售额3.31万亿元，增长12.4%，占社零总额的27.5%。

从行业来看，新能源车市场表现亮眼。一季度新能源汽车销量达209万辆，同比增长31.8%，市场渗透率达到31.1%。这已经是连续第8个月渗透率超过30%。

在进出口方面，一季度货物贸易进出口总值10.17万亿元，同比增长5.0%，创历史同期新高。其中，出口5.74万亿元，增长4.9%；进口4.43万亿元，增长5.1%。

总结来说，一季度经济开局良好，消费、出口、新质生产力三大引擎同步发力，为全年经济增长奠定了坚实基础。`,
    },
    {
      id: 'demo-03',
      title: '热点追踪类',
      text: `【主持人】
热点追踪，直击现场。今天我们要关注的是刚刚发生的科技圈大事件。

就在今天上午，全球最大的AI芯片制造商宣布了其最新一代GPU架构，性能较上一代提升高达300%。这一消息一经发布，立即引发了全球科技界的广泛关注。

回顾这家公司的发展历程：2020年，首次推出面向AI计算的专用GPU；2022年，市场份额突破80%；2023年，市值突破万亿美元大关；2024年，成为全球市值最高的半导体公司。

而今天发布的这一代产品，据官方介绍，在训练大型语言模型方面，能效比提升了整整5倍。这意味着训练一个千亿参数的大模型，从原来的三个月时间可以缩短到不到三周。

值得注意的是，该公司同时宣布了全新的软件生态战略，将向开发者社区开放更多底层接口和优化工具。业界普遍认为，这标志着AI芯片竞争从单纯的硬件性能比拼，进入了"硬件+生态"的全方位竞争时代。

最后，让我们总结一下今天的三个关键信息：第一，新一代GPU性能提升300%；第二，AI训练能效比提升5倍；第三，公司宣布开放软件生态战略。这三件事将深刻影响未来2-3年的AI产业发展格局。

以上就是今天的热点追踪，我们明天见。`,
    },
  ];

  /* 模板定义 */
  const templateDefinitions = {
    quote_highlight_v1: {
      name: '观点花字',
      category: 'highlight',
      defaultParams: { mainText: '', subText: '' },
    },
    data_card_v1: {
      name: '数据卡片',
      category: 'data',
      defaultParams: { mainText: '', subText: '', number: '' },
    },
    timeline_node_v1: {
      name: '时间轴',
      category: 'timeline',
      defaultParams: { events: [] },
    },
    title_card_v1: {
      name: '标题卡片',
      category: 'title',
      defaultParams: { mainText: '', subText: '' },
    },
  };

  /* 模拟 AI 识别结果 */
  function generateMockResults(scriptText) {
    // 基于字数生成 2-6 个模拟结果
    const count = Math.min(6, Math.max(2, Math.floor(scriptText.length / 150)));
    const allTypes = [
      { type: 'data_card', template: 'data_card_v1', prefix: '数据卡片' },
      { type: 'quote_highlight', template: 'quote_highlight_v1', prefix: '观点花字' },
      { type: 'timeline_node', template: 'timeline_node_v1', prefix: '时间轴节点' },
      { type: 'title_card', template: 'title_card_v1', prefix: '标题卡片' },
    ];

    const sentences = scriptText.split(/[。！？\n]+/).filter(s => s.trim().length > 5);
    const results = [];

    for (let i = 0; i < count; i++) {
      const typeInfo = allTypes[i % allTypes.length];
      const sentence = sentences[Math.floor(Math.random() * sentences.length)] || '示例文本片段';
      const excerpt = sentence.trim().slice(0, 60) + (sentence.trim().length > 60 ? '...' : '');

      results.push({
        id: 'result-' + (i + 1) + '-' + Date.now(),
        text: excerpt,
        type: typeInfo.type,
        confidence: 0.75 + Math.random() * 0.2,
        startIndex: i * 100,
        endIndex: i * 100 + excerpt.length,
        suggestedTemplate: typeInfo.template,
        extractedData: {
          mainText: excerpt.slice(0, 20),
          subText: excerpt.slice(0, 10),
          number: (Math.floor(Math.random() * 100) + 1) + '%',
        },
      });
    }

    return results;
  }

  return { sampleScripts, templateDefinitions, generateMockResults };
})();

window.MockData = MockData;