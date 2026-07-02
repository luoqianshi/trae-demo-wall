import { Opportunity, Trend, IdeaValidation, SourceDistribution } from '../types';

export const calculateSourceDistribution = (sources: { platformType: string }[]): SourceDistribution[] => {
  const typeCount: Record<string, number> = {};
  sources.forEach(s => {
    typeCount[s.platformType] = (typeCount[s.platformType] || 0) + 1;
  });
  
  const typeLabels: Record<string, string> = {
    social: '社交平台',
    video: '视频平台',
    news: '新闻媒体',
    developer: '开发者社区',
    ecommerce: '电商平台',
    blog: '博客论坛',
    forum: '问答社区',
    live: '直播平台',
    search: '搜索引擎'
  };
  
  const typeColors: Record<string, string> = {
    social: 'bg-blue-500',
    video: 'bg-purple-500',
    news: 'bg-orange-500',
    developer: 'bg-green-500',
    ecommerce: 'bg-yellow-500',
    blog: 'bg-pink-500',
    forum: 'bg-indigo-500',
    live: 'bg-red-500',
    search: 'bg-gray-500'
  };
  
  const total = sources.length;
  return Object.entries(typeCount).map(([type, count]) => ({
    type,
    typeLabel: typeLabels[type] || type,
    count,
    percentage: Math.round((count / total) * 100),
    color: typeColors[type] || 'bg-gray-500'
  }));
};

export const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'AI驱动的社交媒体内容自动发布工具',
    description: '用户希望一个工具能自动将内容发布到多个社交媒体平台，并根据各个平台的特点优化内容格式。',
    painLevel: 87,
    competitionLevel: 45,
    competitionLabel: 'medium',
    validationScore: 94,
    potential: 'very_high',
    category: '营销工具',
    tags: ['AI', '社交媒体', '自动化'],
    mentions: 1847,
    createdAt: '2026-06-28T10:00:00Z',
    dataSources: [
      { platform: 'Reddit', platformIcon: 'reddit', platformType: 'social', url: 'https://reddit.com/r/startups/comments/xyz', postDate: '2026-06-28', author: 'u/social_media_marketer', engagement: { comments: 245, likes: 1234, shares: 567 }, sentiment: 'negative', excerpt: '我花了太多时间在不同平台间切换发布内容，真的需要这个工具！' },
      { platform: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com/item/12345', postDate: '2026-06-27', author: '@内容创作者小王', engagement: { comments: 892, likes: 5623, shares: 1234 }, sentiment: 'negative', excerpt: '每次发小红书和抖音都要改格式，太累了，求一个一键发布工具！' },
      { platform: 'Twitter', platformIcon: 'twitter', platformType: 'social', url: 'https://twitter.com/dev/status/12345', postDate: '2026-06-26', author: '@digital_marketer', engagement: { comments: 156, likes: 876, shares: 245 }, sentiment: 'negative', excerpt: 'Social media scheduling tools are all too expensive or too limited. Need something better.' },
      { platform: 'B站', platformIcon: 'video', platformType: 'video', url: 'https://bilibili.com/video/av12345', postDate: '2026-06-25', author: 'UP主：科技探索者', engagement: { comments: 1234, likes: 8923, shares: 2567 }, sentiment: 'negative', excerpt: '有没有工具能自动把我的视频分发到B站、抖音、快手？手动发太麻烦了！' },
      { platform: '抖音', platformIcon: 'video', platformType: 'video', url: 'https://douyin.com/video/67890', postDate: '2026-06-24', author: '@短视频创作者', engagement: { comments: 2345, likes: 15678, shares: 4532 }, sentiment: 'negative', excerpt: '每天要发抖音、快手、视频号，三个平台格式都不一样，太折磨人了！' },
      { platform: 'TikTok', platformIcon: 'video', platformType: 'video', url: 'https://tiktok.com/@creator/video/78901', postDate: '2026-06-24', author: '@tiktok_marketer', engagement: { comments: 1345, likes: 8765, shares: 2345 }, sentiment: 'negative', excerpt: 'TikTok和Instagram的格式要求不一样，每次都要重新做，求一个跨平台发布工具！' },
      { platform: 'YouTube', platformIcon: 'video', platformType: 'video', url: 'https://youtube.com/watch?v=abc123', postDate: '2026-06-23', author: '@content_creator', engagement: { comments: 456, likes: 3456, shares: 890 }, sentiment: 'negative', excerpt: 'YouTube Shorts和长视频的格式完全不同，分发太麻烦了。' },
      { platform: '快手', platformIcon: 'video', platformType: 'video', url: 'https://kuaishou.com/video/12345', postDate: '2026-06-22', author: '@快手创作者', engagement: { comments: 789, likes: 4567, shares: 1234 }, sentiment: 'negative', excerpt: '快手和抖音的受众差异很大，需要不同策略，但发布太费时间。' },
      { platform: '视频号', platformIcon: 'video', platformType: 'video', url: 'https://mp.weixin.qq.com/s/abc', postDate: '2026-06-21', author: '@视频号创作者', engagement: { comments: 567, likes: 3456, shares: 1234 }, sentiment: 'negative', excerpt: '视频号和抖音格式差异大，每次发布都要调整，太费时间了！' },
      { platform: 'Twitch', platformIcon: 'video', platformType: 'live', url: 'https://twitch.tv/streamer/video/12345', postDate: '2026-06-20', author: '@twitch_streamer', engagement: { comments: 1456, likes: 8765, shares: 2345 }, sentiment: 'negative', excerpt: '直播内容还要手动发布到其他平台，希望有自动分发工具！' },
      { platform: '虎牙', platformIcon: 'video', platformType: 'live', url: 'https://huya.com/live/12345', postDate: '2026-06-19', author: '@虎牙主播', engagement: { comments: 234, likes: 1234, shares: 456 }, sentiment: 'negative', excerpt: '直播精彩片段手动剪辑发布太麻烦了，急需自动化工具！' },
      { platform: '斗鱼', platformIcon: 'video', platformType: 'live', url: 'https://douyu.com/video/12345', postDate: '2026-06-18', author: '@斗鱼主播', engagement: { comments: 345, likes: 2345, shares: 567 }, sentiment: 'negative', excerpt: '每次直播完都要花几个小时剪辑分发，有没有人懂我的痛！' },
      { platform: '36氪', platformIcon: 'newspaper', platformType: 'news', url: 'https://36kr.com/p/12345', postDate: '2026-06-17', author: '科技观察员', engagement: { comments: 123, likes: 567, shares: 234 }, sentiment: 'negative', excerpt: '企业营销人员面临多平台发布难题，急需智能化解决方案。' },
      { platform: '虎嗅', platformIcon: 'newspaper', platformType: 'news', url: 'https://huxiu.com/article/12345', postDate: '2026-06-16', author: '科技编辑', engagement: { comments: 89, likes: 345, shares: 123 }, sentiment: 'negative', excerpt: '内容创业者最大的痛点：如何在多个平台高效分发内容？' },
      { platform: '新浪科技', platformIcon: 'newspaper', platformType: 'news', url: 'https://tech.sina.com.cn/12345', postDate: '2026-06-15', author: '科技记者', engagement: { comments: 67, likes: 234, shares: 89 }, sentiment: 'negative', excerpt: 'AI工具解决内容分发难题，成为创业新风口。' },
      { platform: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com/question/12345', postDate: '2026-06-14', author: '@知乎用户', engagement: { comments: 345, likes: 1567, shares: 456 }, sentiment: 'negative', excerpt: '有没有支持多平台自动发布的工具推荐？' },
      { platform: 'Quora', platformIcon: 'book-open', platformType: 'forum', url: 'https://quora.com/question/12345', postDate: '2026-06-13', author: '@quora_user', engagement: { comments: 123, likes: 456, shares: 145 }, sentiment: 'negative', excerpt: 'What is the best tool for cross-platform social media posting?' },
      { platform: 'Medium', platformIcon: 'newspaper', platformType: 'blog', url: 'https://medium.com/@author/post', postDate: '2026-06-12', author: '@content_strategist', engagement: { comments: 89, likes: 345, shares: 123 }, sentiment: 'negative', excerpt: 'Publishing to multiple platforms is a nightmare. Need an all-in-one solution.' },
      { platform: 'Substack', platformIcon: 'newspaper', platformType: 'blog', url: 'https://substack.com/@writer/post/12345', postDate: '2026-06-11', author: '@substack_writer', engagement: { comments: 56, likes: 234, shares: 78 }, sentiment: 'negative', excerpt: 'Writing once, publishing everywhere should be easier.' },
      { platform: 'GitHub', platformIcon: 'code', platformType: 'developer', url: 'https://github.com/repo/issues/123', postDate: '2026-06-10', author: '@github_dev', engagement: { comments: 45, likes: 123, shares: 34 }, sentiment: 'negative', excerpt: 'Looking for an open source social media scheduler that supports multiple platforms.' },
      { platform: 'Stack Overflow', platformIcon: 'code', platformType: 'developer', url: 'https://stackoverflow.com/questions/12345', postDate: '2026-06-09', author: '@developer123', engagement: { comments: 67, likes: 234, shares: 56 }, sentiment: 'negative', excerpt: 'Is there a good API for posting to multiple social platforms at once?' },
      { platform: 'CSDN', platformIcon: 'code', platformType: 'developer', url: 'https://csdn.net/article/12345', postDate: '2026-06-08', author: '@csdn_blogger', engagement: { comments: 89, likes: 345, shares: 78 }, sentiment: 'negative', excerpt: '开发者需要一个能同时发布到掘金、CSDN、知乎的工具。' },
      { platform: '掘金', platformIcon: 'code', platformType: 'developer', url: 'https://juejin.cn/post/12345', postDate: '2026-06-07', author: '@掘金作者', engagement: { comments: 123, likes: 567, shares: 145 }, sentiment: 'negative', excerpt: '每次写技术文章都要手动同步到多个平台，太麻烦了！' },
      { platform: 'Product Hunt', platformIcon: 'zap', platformType: 'social', url: 'https://producthunt.com/posts/12345', postDate: '2026-06-06', author: '@maker', engagement: { comments: 234, likes: 1567, shares: 345 }, sentiment: 'negative', excerpt: 'Anyone built a tool to automatically cross-post content to multiple platforms?' },
      { platform: 'Google搜索趋势', platformIcon: 'search', platformType: 'search', url: 'https://trends.google.com', postDate: '2026-06-05', author: '数据分析', engagement: { comments: 0, likes: 0, shares: 0 }, sentiment: 'neutral', excerpt: '社交媒体管理工具搜索量同比上涨180%，市场需求强烈。' },
    ],
    implementationSteps: [
      {
        phase: 'validation',
        phaseName: '验证阶段',
        duration: '1-2周',
        steps: [
          {
            number: 1,
            title: '市场调研与用户访谈',
            description: '通过问卷和访谈收集目标用户（内容创作者、社媒运营者）的真实痛点，了解当前工具的不足之处',
            tools: [
              { name: 'SurveyMonkey', type: '问卷调查', url: 'https://surveymonkey.com', cost: '免费-$99/月', description: '在线问卷工具，可快速收集用户反馈，支持多种题型和逻辑跳转' },
              { name: 'Typeform', type: '问卷调查', url: 'https://typeform.com', cost: '免费-$89/月', description: '美观的在线问卷工具，交互体验好，用户更愿意完成问卷' },
              { name: 'Calendly', type: '预约安排', url: 'https://calendly.com', cost: '免费-$12/月', description: '快速安排用户访谈时间，自动发送邀请链接' },
            ],
            resources: [
              'https://www.producthunt.com/search?q=social%20media%20scheduler - Product Hunt上相关产品列表',
              'https://www.capterra.com/categories/social-media-management/ - Capterra工具对比评测',
              'https://www.g2.com/categories/social-media-management - G2社交媒体管理工具排名'
            ],
          },
          {
            number: 2,
            title: '竞品分析',
            description: '分析Top 10竞品的功能、定价、用户评价、技术架构，找出差异化机会',
            tools: [
              { name: 'Similarweb', type: '流量分析', url: 'https://similarweb.com', cost: '免费-$299/月', description: '网站流量和竞品分析，了解竞品月访问量、用户来源' },
              { name: 'App Annie', type: '应用分析', url: 'https://appannie.com', cost: '免费-$249/月', description: 'App Store数据和竞品分析，查看评分、下载量趋势' },
              { name: 'SEMrush', type: '竞品分析', url: 'https://semrush.com', cost: '$119.95-$449.95/月', description: '竞品SEO和营销策略分析' },
            ],
            resources: [
              'https://www.appbrain.com/ - Google Play应用分析',
              'https://www.sensortower.com/ - App Store排名和竞品数据'
            ],
          },
          {
            number: 3,
            title: 'MVP着陆页验证',
            description: '创建产品着陆页，使用SEO和社交媒体广告引流，收集邮箱订阅验证付费意愿',
            tools: [
              { name: 'Carrd', type: '着陆页', url: 'https://carrd.co', cost: '免费-$19/年', description: '简单快速创建单页着陆页，支持自定义域名' },
              { name: 'Mailchimp', type: '邮件营销', url: 'https://mailchimp.com', cost: '免费-$299/月', description: '邮件列表管理和自动发送，支持订阅表单嵌入' },
              { name: 'Figma', type: '原型设计', url: 'https://figma.com', cost: '免费-$12/月', description: '快速制作着陆页原型，与用户验证设计' },
            ],
            resources: [
              'https://www.nocode.tech/ - 无代码工具资源库',
              'https://www.landingfolio.com/ - 着陆页设计参考'
            ],
          },
        ],
      },
      {
        phase: 'mvp',
        phaseName: 'MVP阶段',
        duration: '2-4周',
        steps: [
          {
            number: 1,
            title: '技术架构设计',
            description: '确定技术栈、第三方API、数据库架构，确保可扩展性',
            tools: [
              { name: 'React', type: '前端框架', url: 'https://react.dev', cost: '免费', description: 'Facebook开发的前端框架，生态丰富' },
              { name: 'Next.js', type: '全栈框架', url: 'https://nextjs.org', cost: '免费', description: 'React全栈框架，支持SSR和API Routes' },
              { name: 'Node.js', type: '后端运行时', url: 'https://nodejs.org', cost: '免费', description: 'JavaScript运行时，适合IO密集型任务' },
              { name: 'PostgreSQL', type: '数据库', url: 'https://postgresql.org', cost: '免费', description: '开源关系型数据库，稳定性高' },
              { name: 'Prisma', type: 'ORM', url: 'https://prisma.io', cost: '免费', description: 'Node.js ORM，类型安全，开发体验好' },
            ],
            resources: [
              'https://www.prisma.io/docs - Prisma官方文档',
              'https://platform.openai.com/docs/api-reference - OpenAI API文档'
            ],
          },
          {
            number: 2,
            title: '核心功能开发',
            description: '实现社交媒体账号授权、内容编辑、多平台发布队列、AI格式优化',
            tools: [
              { name: 'OpenAI API', type: 'AI服务', url: 'https://openai.com/api', cost: '按用量付费(约$0.002/1K tokens)', description: 'GPT模型API，用于AI内容重写和格式优化' },
              { name: 'Buffer API', type: '社交API', url: 'https://buffer.com/api', cost: '$15-$65/月', description: '社交媒体发布API，支持多平台' },
              { name: 'PubPub', type: '内容管理', url: 'https://pubpub.org', cost: '免费', description: '开源内容管理平台，可参考架构' },
              { name: 'Express', type: '后端框架', url: 'https://expressjs.com', cost: '免费', description: 'Node.js后端框架，简单易用' },
            ],
            resources: [
              'https://platform.openai.com/docs/guides/text-generation - GPT使用指南',
              'https://developer.twitter.com/en/docs - Twitter API文档',
              'https://developers.facebook.com/docs/instagram-api - Instagram API'
            ],
          },
          {
            number: 3,
            title: '用户界面开发',
            description: '设计简洁易用的仪表盘，包含内容预览、发布队列、效果分析',
            tools: [
              { name: 'Figma', type: '设计工具', url: 'https://figma.com', cost: '免费-$12/月', description: '在线协作设计工具，支持组件和设计系统' },
              { name: 'Tailwind CSS', type: 'CSS框架', url: 'https://tailwindcss.com', cost: '免费', description: '原子化CSS框架，快速构建美观界面' },
              { name: 'Headless UI', type: 'UI组件', url: 'https://headlessui.com', cost: '免费', description: '无样式React组件，与Tailwind完美配合' },
              { name: 'Vercel', type: '部署平台', url: 'https://vercel.com', cost: '免费-$20/月', description: '前端部署平台，自动预览部署' },
            ],
            resources: [
              'https://www.figma.com/community/ - Figma社区资源',
              'https://tailwindui.com/ - Tailwind官方组件库'
            ],
          },
        ],
      },
      {
        phase: 'growth',
        phaseName: '增长阶段',
        duration: '持续优化',
        steps: [
          {
            number: 1,
            title: '产品发布与初期获客',
            description: '在Product Hunt、Hacker News、技术社区发布，与早期用户建立联系',
            tools: [
              { name: 'Product Hunt', type: '产品发布', url: 'https://producthunt.com', cost: '免费', description: '全球最大的产品发布社区，获取早期用户反馈' },
              { name: 'Hacker News', type: '技术社区', url: 'https://news.ycombinator.com', cost: '免费', description: '技术圈影响力最大的新闻社区，适合开发者产品' },
              { name: 'Reddit', type: '社区', url: 'https://reddit.com/r/SideProject', cost: '免费', description: '独立开发者社区，可分享产品' },
            ],
            resources: [
              'https://www.producthunt.com/posts/how-to-launch-on-product-hunt - PH发布指南',
              'https://news.ycombinator.com/showhn.html - Show HN发布规范'
            ],
          },
          {
            number: 2,
            title: '内容营销与SEO',
            description: '发布教程、案例分析、工具对比文章，建立行业影响力',
            tools: [
              { name: 'Notion', type: '内容管理', url: 'https://notion.so', cost: '免费-$8/月', description: '内容策划和团队协作' },
              { name: 'Ahrefs', type: 'SEO工具', url: 'https://ahrefs.com', cost: '$99-$999/月', description: '全面SEO工具，关键词研究、竞品分析' },
              { name: 'Google Search Console', type: 'SEO', url: 'https://search.google.com/search-console', cost: '免费', description: 'Google官方SEO工具，监控网站收录' },
            ],
            resources: [
              'https://contentmarketinginstitute.com/ - 内容营销学院',
              'https://moz.com/beginners-guide-to-seo - SEO入门指南'
            ],
          },
          {
            number: 3,
            title: '付费获客与转化优化',
            description: '通过Google Ads、社交媒体广告获客，优化落地页和注册转化率',
            tools: [
              { name: 'Google Ads', type: '广告平台', url: 'https://ads.google.com', cost: '按点击付费', description: 'Google搜索广告，精准触达需求用户' },
              { name: 'Facebook Ads', type: '广告平台', url: 'https://facebook.com/business', cost: '按点击付费', description: '社交媒体广告，精准定向' },
              { name: 'Hotjar', type: '用户行为', url: 'https://hotjar.com', cost: '免费-$99/月', description: '用户行为分析，优化转化率' },
            ],
            resources: [
              'https://neilpatel.com/ - 转化率优化指南',
              'https://www.conversion rate .com/ - CRO资源库'
            ],
          },
        ],
      },
    ],
    marketDetail: {
      size: 'large',
      sizeDescription: '全球社交媒体管理工具市场规模达400亿美元，年增长率15%',
      targetUsers: ['社交媒体营销人员', '内容创作者', '自媒体博主', '中小企业市场部', '数字营销机构'],
      demographics: {
        ageRange: '25-45岁',
        location: ['美国', '中国', '印度', '东南亚', '欧洲'],
        incomeLevel: ['$30K-50K', '$50K-100K', '$100K+'],
      },
      growthRate: 15,
      marketValue: '400亿美元',
      keyStatistics: [
        { label: '全球社交媒体用户', value: '4.9', unit: '亿', source: 'Statista 2026' },
        { label: '企业社交媒体营销预算', value: '120', unit: '亿美元', source: 'eMarketer' },
        { label: '内容创作者数量', value: '5000', unit: '万', source: 'Influencer Marketing Hub' },
        { label: '日均社交媒体使用时长', value: '2.5', unit: '小时', source: 'GlobalWebIndex' },
      ],
    },
    monetizationDetail: {
      strategies: [
        {
          name: '订阅制（推荐）',
          description: '按月或按年收取订阅费用，提供不同功能档位',
          implementationSteps: ['设置价格档位（免费/专业/企业）', '集成Stripe或Paddle支付', '实现订阅周期管理', '设置续费提醒邮件'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '全球领先的在线支付平台，支持订阅制' },
            { name: 'Paddle', type: '支付', url: 'https://paddle.com', cost: '5%+$0.50/笔', description: '专为SaaS设计的支付平台，处理税务合规' },
            { name: 'Chargebee', type: '订阅管理', url: 'https://chargebee.com', cost: '$249+/月', description: '订阅计费管理平台，支持多种计费模型' },
          ],
          expectedConversion: '3-5%',
          pros: ['稳定可预测的收入', '高客户生命周期价值(LTV)', '便于财务预测和规划'],
          cons: ['需要持续提供价值防止流失', '用户可能随时取消'],
        },
        {
          name: '按发布次数收费',
          description: '按用户发布的内容数量收费，适合轻度使用者',
          implementationSteps: ['设计计费单位（如每条内容$0.5）', '实现用量计量系统', '设置预付费套餐', '集成支付'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '在线支付平台' },
            { name: 'Lemonsqueezy', type: '支付', url: 'https://lemonsqueezy.com', cost: '5%+50¢/笔', description: '软件销售平台，专注独立开发者' },
          ],
          expectedConversion: '5-8%',
          pros: ['低门槛吸引试用', '灵活定价用户接受度高', '适合偶尔使用用户'],
          cons: ['收入不稳定波动大', '需要持续获客'],
        },
        {
          name: '企业定制版',
          description: '为大型企业和代理机构提供定制化解决方案',
          implementationSteps: ['建立企业销售团队', '开发私有化部署能力', '建立客户成功团队', '设计企业许可证体系'],
          tools: [
            { name: 'HubSpot', type: 'CRM', url: 'https://hubspot.com', cost: '免费-$3200/月', description: '企业CRM和营销自动化' },
            { name: 'ZoomInfo', type: '销售情报', url: 'https://zoominfo.com', cost: '按需付费', description: '企业联系人数据库，辅助销售' },
            { name: 'Salesforce', type: 'CRM', url: 'https://salesforce.com', cost: '$25-$300/用户/月', description: '全球领先的CRM平台' },
          ],
          expectedConversion: '0.5-1%',
          pros: ['高单价合同', '高利润率和续约率', '长期稳定合作'],
          cons: ['销售周期长（3-6个月）', '需要更多资源和人力'],
        },
      ],
      pricingModel: {
        tiers: [
          { name: '免费版', price: '$0', features: ['3个社交平台', '每月50次发布', '基础分析报告', '社区支持'], targetUsers: '个人创作者、初学者' },
          { name: '专业版', price: '$29/月', features: ['10个社交平台', '无限发布', 'AI内容优化', '详细分析报告', '优先客户支持', '团队协作(3人)'], targetUsers: '专业创作者、中小企业' },
          { name: '企业版', price: '$99/月', features: ['无限平台', '团队协作(不限人数)', '私有化部署', '定制集成', 'API访问', '专属客户成功经理', 'SLA保障'], targetUsers: '大型企业、营销机构' },
        ],
        recommendedTier: '专业版',
      },
      expectedRevenue: {
        month1: '$500',
        month3: '$5,000',
        month6: '$15,000',
        month12: '$50,000',
        assumptions: ['用户月增长率30%', '免费用户付费转化率5%', '平均客单价$30', '月流失率7%'],
      },
    },
    comments: [
      { id: 'c1', author: 'u/social_media_marketer', content: '我花了太多时间在不同平台间切换发布内容，真的需要这个工具！', sentiment: 'negative', createdAt: '2026-06-28T10:30:00Z' },
      { id: 'c2', author: 'u/small_business_owner', content: '现在的工具都太复杂了，希望有个简单易用的版本。', sentiment: 'negative', createdAt: '2026-06-28T11:00:00Z' },
    ],
  },
  {
    id: '2',
    title: 'AI代码审查助手 - 实时发现潜在问题',
    description: '开发者希望在编码过程中就能得到AI的实时代码审查建议，而不是等到提交PR之后。',
    painLevel: 78,
    competitionLevel: 72,
    competitionLabel: 'high',
    validationScore: 87,
    potential: 'high',
    category: '开发者工具',
    tags: ['AI', '代码审查', '开发工具'],
    mentions: 892,
    createdAt: '2026-06-27T14:00:00Z',
    dataSources: [
      { platform: 'Twitter', platformIcon: 'twitter', platformType: 'social', url: 'https://twitter.com/dev/status/12345', postDate: '2026-06-27', author: '@fullstack_dev', engagement: { comments: 123, likes: 567, shares: 234 }, sentiment: 'negative', excerpt: 'Code reviews are so time-consuming. Wish there was AI that could catch issues in real-time!' },
      { platform: 'Hacker News', platformIcon: 'newspaper', platformType: 'news', url: 'https://news.ycombinator.com/item?id=12345', postDate: '2026-06-26', author: 'hn_user_123', engagement: { comments: 456, likes: 2345, shares: 567 }, sentiment: 'negative', excerpt: 'Looking for an AI-powered code review tool that integrates with VS Code and catches bugs as I type.' },
      { platform: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com/question/12345', postDate: '2026-06-25', author: '程序员小李', engagement: { comments: 345, likes: 1567, shares: 456 }, sentiment: 'negative', excerpt: '每次代码审查都要等到PR提交后，能不能在写代码的时候就发现问题？' },
      { platform: 'GitHub', platformIcon: 'code', platformType: 'developer', url: 'https://github.com/repo/issues/123', postDate: '2026-06-24', author: '@github_dev', engagement: { comments: 123, likes: 456, shares: 123 }, sentiment: 'negative', excerpt: 'Need an AI code review tool that works in real-time, not just on PRs.' },
      { platform: 'Stack Overflow', platformIcon: 'code', platformType: 'developer', url: 'https://stackoverflow.com/questions/12345', postDate: '2026-06-23', author: '@developer123', engagement: { comments: 67, likes: 234, shares: 56 }, sentiment: 'negative', excerpt: 'Is there a VS Code extension for real-time AI code review?' },
      { platform: '掘金', platformIcon: 'code', platformType: 'developer', url: 'https://juejin.cn/post/12345', postDate: '2026-06-22', author: '@掘金作者', engagement: { comments: 189, likes: 678, shares: 145 }, sentiment: 'negative', excerpt: '希望有工具能在编码过程中实时给出代码优化建议。' },
      { platform: 'CSDN', platformIcon: 'code', platformType: 'developer', url: 'https://csdn.net/article/12345', postDate: '2026-06-21', author: '@csdn_blogger', engagement: { comments: 56, likes: 234, shares: 45 }, sentiment: 'negative', excerpt: '代码审查太耗时，希望AI能自动发现潜在问题。' },
      { platform: 'Medium', platformIcon: 'newspaper', platformType: 'blog', url: 'https://medium.com/@author/post', postDate: '2026-06-20', author: '@tech_writer', engagement: { comments: 45, likes: 123, shares: 34 }, sentiment: 'negative', excerpt: 'Real-time AI code review could save developers hours every week.' },
      { platform: 'Dev.to', platformIcon: 'newspaper', platformType: 'blog', url: 'https://dev.to/author/post', postDate: '2026-06-19', author: '@dev_author', engagement: { comments: 56, likes: 234, shares: 67 }, sentiment: 'negative', excerpt: 'What if AI could review your code as you write it?' },
      { platform: 'Product Hunt', platformIcon: 'zap', platformType: 'social', url: 'https://producthunt.com/posts/12345', postDate: '2026-06-18', author: '@maker', engagement: { comments: 89, likes: 456, shares: 123 }, sentiment: 'negative', excerpt: 'Building an AI code review tool. Would love feedback from developers!' },
    ],
    implementationSteps: [
      {
        phase: 'validation',
        phaseName: '验证阶段',
        duration: '1周',
        steps: [
          {
            number: 1,
            title: '开发者社区调研',
            description: '通过GitHub Issues、开发者社区收集需求，了解代码审查痛点',
            tools: [
              { name: 'GitHub', type: '代码托管', url: 'https://github.com', cost: '免费', description: '全球最大代码托管平台，查看相关仓库的Issue和Discussion' },
              { name: 'Stack Overflow', type: '问答社区', url: 'https://stackoverflow.com', cost: '免费', description: '开发者问答社区，搜索相关问题' },
              { name: 'Discourse', type: '社区论坛', url: 'https://discourse.org', cost: '免费-$99/月', description: '开源社区论坛，可自建开发者社区' },
            ],
            resources: ['https://github.com/topics/ai-tools - AI工具话题', 'https://github.com/topics/vscode-extension - VSCode扩展话题'],
          },
          {
            number: 2,
            title: 'MVP原型验证',
            description: '使用Chrome扩展或VS Code扩展原型，收集早期用户反馈',
            tools: [
              { name: 'Chrome Web Store', type: '扩展发布', url: 'https://chrome.google.com/webstore', cost: '一次性$5', description: 'Chrome插件商店，发布扩展供用户测试' },
              { name: 'VS Code Extension API', type: '扩展开发', url: 'https://code.visualstudio.com/api', cost: '免费', description: 'VS Code官方扩展API文档' },
              { name: 'TypeScript', type: '语言', url: 'https://www.typescriptlang.org', cost: '免费', description: 'JavaScript超集，提供类型检查' },
            ],
            resources: ['https://developer.chrome.com/docs/extensions/ - Chrome扩展开发文档', 'https://code.visualstudio.com/api/get-started/your-first-extension - VS Code扩展入门'],
          },
        ],
      },
      {
        phase: 'mvp',
        phaseName: 'MVP阶段',
        duration: '3-4周',
        steps: [
          {
            number: 1,
            title: 'IDE扩展开发',
            description: '开发VS Code插件，实现实时代码分析和AI建议',
            tools: [
              { name: 'VS Code Extension API', type: 'API', url: 'https://code.visualstudio.com/api', cost: '免费', description: 'VS Code扩展API，支持语言服务器协议' },
              { name: 'OpenAI API', type: 'AI服务', url: 'https://openai.com/api', cost: '按用量付费', description: 'GPT模型API，提供代码审查建议' },
              { name: 'TypeScript', type: '开发语言', url: 'https://www.typescriptlang.org', cost: '免费', description: 'VS Code本身使用TypeScript开发' },
            ],
            resources: ['https://microsoft.github.io/language-server-protocol/ - LSP协议', 'https://tree-sitter.github.io/tree-sitter/ - 代码解析工具'],
          },
          {
            number: 2,
            title: '代码分析引擎',
            description: '集成静态代码分析和AI模型，提供多维度代码质量检测',
            tools: [
              { name: 'ESLint', type: '代码检查', url: 'https://eslint.org', cost: '免费', description: 'JavaScript代码检查工具，可自定义规则' },
              { name: 'SonarQube', type: '代码质量', url: 'https://sonarqube.org', cost: '免费-$299/月', description: '代码质量分析平台，支持多语言' },
              { name: 'CodeClimate', type: '代码质量', url: 'https://codeclimate.com', cost: '免费-$124/月', description: 'GitHub集成的代码质量分析' },
            ],
            resources: ['https://eslint.org/docs/developer-guide/nodejs-api - ESLint API', 'https://pmd.github.io/ - PMD Java代码分析'],
          },
        ],
      },
      {
        phase: 'growth',
        phaseName: '增长阶段',
        duration: '持续',
        steps: [
          {
            number: 1,
            title: '开发者社区推广',
            description: '在GitHub、Dev.to、掘金等技术社区分享，建立影响力',
            tools: [
              { name: 'GitHub', type: '代码托管', url: 'https://github.com', cost: '免费', description: '开源项目托管，可提交Featured列表' },
              { name: 'Dev.to', type: '技术博客', url: 'https://dev.to', cost: '免费', description: '开发者社区博客，SEO效果好' },
              { name: '掘金', type: '技术博客', url: 'https://juejin.cn', cost: '免费', description: '国内开发者社区，用户活跃度高' },
            ],
            resources: ['https://github.com/topics/ai-tools - AI工具话题', 'https://dev.to/t/tutorial - 教程标签'],
          },
          {
            number: 2,
            title: '技术集成生态',
            description: '与主流开发工具链集成，扩大用户覆盖',
            tools: [
              { name: 'GitHub Actions', type: 'CI/CD', url: 'https://github.com/features/actions', cost: '免费-2000分钟/月', description: 'GitHub官方CI/CD，可集成代码审查' },
              { name: 'GitLab', type: 'DevOps', url: 'https://gitlab.com', cost: '免费', description: '与GitLab CI/CD集成' },
              { name: 'JetBrains', type: 'IDE', url: 'https://jetbrains.com', cost: '免费-$249/年', description: 'IntelliJ等IDE插件市场' },
            ],
            resources: ['https://github.com/marketplace - GitHub Actions市场', 'https://plugins.jetbrains.com/ - JetBrains插件市场'],
          },
        ],
      },
    ],
    marketDetail: {
      size: 'large',
      sizeDescription: '全球开发者工具市场规模达200亿美元，AI代码助手快速增长',
      targetUsers: ['软件开发者', '技术团队', 'CTO/技术总监', '编程学习者', '代码审查者'],
      demographics: {
        ageRange: '20-40岁',
        location: ['美国', '印度', '中国', '欧洲', '东南亚'],
        incomeLevel: ['$50K-100K', '$100K-200K', '$200K+'],
      },
      growthRate: 30,
      marketValue: '200亿美元',
      keyStatistics: [
        { label: '全球开发者数量', value: '2800', unit: '万', source: 'Stack Overflow 2026' },
        { label: 'AI代码助手渗透率', value: '45', unit: '%', source: 'Gartner' },
        { label: '代码审查时间占比', value: '20', unit: '%', source: 'CodeStream' },
        { label: '开发者年均工具支出', value: '1200', unit: '美元', source: 'JetBrains' },
      ],
    },
    monetizationDetail: {
      strategies: [
        {
          name: '订阅制（推荐）',
          description: '按月收取订阅费用，提供个人和团队版本',
          implementationSteps: ['设置价格档位', '集成Stripe支付', '实现许可证管理系统', '设置使用量限制'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '在线支付平台' },
            { name: 'Clood', type: '许可证管理', url: 'https://clood.com', cost: '免费', description: '软件许可证管理平台' },
          ],
          expectedConversion: '8-12%',
          pros: ['稳定收入', '高付费意愿用户群体'],
          cons: ['竞争激烈，需差异化'],
        },
        {
          name: '企业授权',
          description: '为企业提供团队许可证和私有化部署',
          implementationSteps: ['建立企业销售团队', '开发许可证管理后台', '提供技术支持服务'],
          tools: [
            { name: 'Okta', type: 'SSO', url: 'https://okta.com', cost: '按需付费', description: '企业身份认证和SSO' },
            { name: 'Salesforce', type: 'CRM', url: 'https://salesforce.com', cost: '$25-$300/用户/月', description: '企业CRM管理销售流程' },
          ],
          expectedConversion: '1-2%',
          pros: ['高单价', '长期合同'],
          cons: ['销售周期长', '需要更多资源'],
        },
      ],
      pricingModel: {
        tiers: [
          { name: '免费版', price: '$0', features: ['基础代码检查', '每月50次AI分析', '单文件支持'], targetUsers: '个人开发者、学生' },
          { name: '专业版', price: '$19/月', features: ['无限AI分析', '多文件项目支持', '团队协作(5人)', '优先客户支持'], targetUsers: '专业开发者' },
          { name: '企业版', price: '$99/月/用户', features: ['私有化部署', '自定义规则', 'SLA保障', '专属客户成功经理', 'SSO集成'], targetUsers: '企业开发团队' },
        ],
        recommendedTier: '专业版',
      },
      expectedRevenue: {
        month1: '$300',
        month3: '$3,000',
        month6: '$10,000',
        month12: '$35,000',
        assumptions: ['用户月增长率25%', '付费转化率8%', '平均客单价$20', '月流失率5%'],
      },
    },
    comments: [
      { id: 'c3', author: 'u/fullstack_dev', content: '代码审查太耗时了，如果能实时发现问题会节省很多时间！', sentiment: 'negative', createdAt: '2026-06-27T14:30:00Z' },
    ],
  },
  {
    id: '3',
    title: '个人知识管理工具 - AI自动整理笔记',
    description: '用户积累了大量笔记但缺乏有效整理，希望AI能自动分类、提取关键信息并建立知识关联。',
    painLevel: 92,
    competitionLevel: 38,
    competitionLabel: 'low',
    validationScore: 91,
    potential: 'very_high',
    category: '生产力工具',
    tags: ['AI', '知识管理', '笔记'],
    mentions: 2340,
    createdAt: '2026-06-27T09:00:00Z',
    dataSources: [
      { platform: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com/item/12345', postDate: '2026-06-27', author: '@学霸笔记', engagement: { comments: 2345, likes: 15678, shares: 4567 }, sentiment: 'negative', excerpt: '笔记堆了几千条，根本找不到需要的内容，太痛苦了！希望有AI能帮我整理。' },
      { platform: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com/question/67890', postDate: '2026-06-26', author: '知识工作者', engagement: { comments: 892, likes: 4567, shares: 1234 }, sentiment: 'negative', excerpt: 'Notion很好但整理还是要手动，希望有AI能自动帮我建立知识关联。' },
      { platform: '抖音', platformIcon: 'video', platformType: 'video', url: 'https://douyin.com/video/12345', postDate: '2026-06-25', author: '@效率达人', engagement: { comments: 3456, likes: 23456, shares: 5678 }, sentiment: 'negative', excerpt: '笔记整理太花时间了，有没有AI工具能一键搞定？' },
      { platform: 'B站', platformIcon: 'video', platformType: 'video', url: 'https://bilibili.com/video/av12345', postDate: '2026-06-24', author: 'UP主：学习方法', engagement: { comments: 1234, likes: 8765, shares: 2345 }, sentiment: 'negative', excerpt: '看了很多教程但知识还是零散的，希望有工具能帮我串联起来。' },
      { platform: '微信公众号', platformIcon: 'message-circle', platformType: 'social', url: 'https://mp.weixin.qq.com/s/abc', postDate: '2026-06-23', author: '@效率公众号', engagement: { comments: 456, likes: 2345, shares: 567 }, sentiment: 'negative', excerpt: '收藏了很多文章但从来没看过，希望AI能帮我整理成知识库。' },
      { platform: '简书', platformIcon: 'book-open', platformType: 'blog', url: 'https://jianshu.com/p/12345', postDate: '2026-06-22', author: '@简书作者', engagement: { comments: 67, likes: 234, shares: 45 }, sentiment: 'negative', excerpt: '写了很多文章但没有形成体系，需要AI帮我建立知识网络。' },
      { platform: 'Medium', platformIcon: 'newspaper', platformType: 'blog', url: 'https://medium.com/@author/post', postDate: '2026-06-21', author: '@writer', engagement: { comments: 56, likes: 234, shares: 67 }, sentiment: 'negative', excerpt: 'My notes are a mess. Need AI to organize them and find connections.' },
      { platform: 'Substack', platformIcon: 'newspaper', platformType: 'blog', url: 'https://substack.com/@writer/post/12345', postDate: '2026-06-20', author: '@substack_writer', engagement: { comments: 34, likes: 123, shares: 34 }, sentiment: 'negative', excerpt: 'AI-powered note organization is the next big thing.' },
      { platform: 'Reddit', platformIcon: 'reddit', platformType: 'social', url: 'https://reddit.com/r/productivity/comments/abc', postDate: '2026-06-19', author: 'u/knowledge_seeker', engagement: { comments: 234, likes: 876, shares: 234 }, sentiment: 'negative', excerpt: 'Looking for a note-taking app that uses AI to automatically organize and connect my notes.' },
      { platform: 'Twitter', platformIcon: 'twitter', platformType: 'social', url: 'https://twitter.com/dev/status/12345', postDate: '2026-06-18', author: '@productivity_hacker', engagement: { comments: 89, likes: 456, shares: 123 }, sentiment: 'negative', excerpt: 'Anyone else struggling with note chaos? Need AI to help organize everything.' },
      { platform: '虎嗅', platformIcon: 'newspaper', platformType: 'news', url: 'https://huxiu.com/article/12345', postDate: '2026-06-17', author: '科技观察员', engagement: { comments: 67, likes: 234, shares: 56 }, sentiment: 'negative', excerpt: 'AI知识管理工具成为新风口，解决信息过载难题。' },
      { platform: '36氪', platformIcon: 'newspaper', platformType: 'news', url: 'https://36kr.com/p/12345', postDate: '2026-06-16', author: '创业观察', engagement: { comments: 89, likes: 345, shares: 78 }, sentiment: 'negative', excerpt: '知识管理赛道火热，AI能否成为终极解决方案？' },
    ],
    implementationSteps: [
      {
        phase: 'validation',
        phaseName: '验证阶段',
        duration: '1-2周',
        steps: [
          {
            number: 1,
            title: '用户调研与需求分析',
            description: '通过问卷和访谈了解用户的笔记整理痛点和使用习惯',
            tools: [
              { name: 'Notion', type: '笔记工具', url: 'https://notion.so', cost: '免费-$8/月', description: '强大的笔记工具，用户基数大，便于调研' },
              { name: 'Evernote', type: '笔记工具', url: 'https://evernote.com', cost: '免费-$7.99/月', description: '老牌笔记工具，用户痛点明显' },
              { name: 'Airtable', type: '数据管理', url: 'https://airtable.com', cost: '免费-$20/月', description: '灵活的数据库工具，可做问卷结果分析' },
            ],
            resources: ['https://www.producthunt.com/search?q=note%20taking - Product Hunt笔记工具', 'https://alternativeto.net/ - 工具替代品对比'],
          },
          {
            number: 2,
            title: 'MVP原型验证',
            description: '创建Web应用原型，测试AI整理功能的核心概念',
            tools: [
              { name: 'Streamlit', type: '快速原型', url: 'https://streamlit.io', cost: '免费-$29/月', description: 'Python快速原型框架，3天可上线MVP' },
              { name: 'OpenAI API', type: 'AI服务', url: 'https://openai.com/api', cost: '按用量付费', description: 'GPT模型API，实现AI分类和总结' },
              { name: 'Gradio', type: '快速原型', url: 'https://gradio.app', cost: '免费', description: 'Python机器学习界面快速构建' },
            ],
            resources: ['https://streamlit.io/gallery - Streamlit示例', 'https://platform.openai.com/docs/guides/text-analysis - 文本分析指南'],
          },
        ],
      },
      {
        phase: 'mvp',
        phaseName: 'MVP阶段',
        duration: '3-4周',
        steps: [
          {
            number: 1,
            title: '核心功能开发',
            description: '实现笔记导入、AI自动分类、关键词提取、知识图谱构建',
            tools: [
              { name: 'React', type: '前端框架', url: 'https://react.dev', cost: '免费', description: '灵活的前端框架，组件生态丰富' },
              { name: 'Next.js', type: '全栈框架', url: 'https://nextjs.org', cost: '免费', description: 'React全栈框架，支持SSR和API Routes' },
              { name: 'Supabase', type: '后端服务', url: 'https://supabase.com', cost: '免费-$25/月', description: '开源Firebase替代，提供数据库和认证' },
              { name: 'OpenAI API', type: 'AI服务', url: 'https://openai.com/api', cost: '按用量付费', description: 'GPT-4用于语义分析和知识提取' },
            ],
            resources: ['https://supabase.com/docs - Supabase文档', 'https://platform.openai.com/docs/guides/embeddings - 向量嵌入指南'],
          },
          {
            number: 2,
            title: '知识图谱可视化',
            description: '实现笔记间关联的可视化展示，支持点击跳转',
            tools: [
              { name: 'D3.js', type: '数据可视化', url: 'https://d3js.org', cost: '免费', description: '强大的数据可视化库' },
              { name: 'Neo4j', type: '图数据库', url: 'https://neo4j.com', cost: '免费-$99/月', description: '专业图数据库，存储知识关联' },
              { name: 'AntV G6', type: '图可视化', url: 'https://g6.antv.vision', cost: '免费', description: '阿里开源的图可视化引擎，适合知识图谱' },
            ],
            resources: ['https://d3js.org/examples/ - D3示例', 'https://neo4j.com/developer/graph-database/ - Neo4j开发指南'],
          },
          {
            number: 3,
            title: '多平台导入',
            description: '支持从Notion、印象笔记、Chrome收藏夹等多平台导入',
            tools: [
              { name: 'Notion API', type: 'API', url: 'https://developers.notion.com', cost: '免费', description: 'Notion官方API，支持读取笔记' },
              { name: 'Puppeteer', type: '浏览器自动化', url: 'https://pptr.dev', cost: '免费', description: '无头浏览器自动化，抓取网页内容' },
              { name: 'PDF.js', type: '文档解析', url: 'https://mozilla.github.io/pdf.js/', cost: '免费', description: 'Mozilla开源PDF解析库' },
            ],
            resources: ['https://developers.notion.com/reference/intro - Notion API入门', 'https://github.com/awesome-selfhosted/awesome-selfhosted - 自托管方案汇总'],
          },
        ],
      },
      {
        phase: 'growth',
        phaseName: '增长阶段',
        duration: '持续优化',
        steps: [
          {
            number: 1,
            title: '产品发布与增长',
            description: '在Product Hunt、小红书等技术社区发布，启动增长飞轮',
            tools: [
              { name: 'Product Hunt', type: '产品发布', url: 'https://producthunt.com', cost: '免费', description: '全球最大产品发布社区' },
              { name: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com', cost: '免费', description: '国内内容社区，年轻用户多' },
              { name: '即刻', platformIcon: 'message-circle', platformType: 'social', url: 'https://web.okjike.com', cost: '免费', description: '国内优质创作者社区' },
            ],
            resources: ['https://www.producthunt.com/posts/how-to-launch-on-product-hunt - 发布指南'],
          },
          {
            number: 2,
            title: '内容营销与SEO',
            description: '发布知识管理方法论、效率技巧等文章，建立行业权威',
            tools: [
              { name: 'Notion', type: '内容管理', url: 'https://notion.so', cost: '免费-$8/月', description: '内容策划和知识库建设' },
              { name: 'Ahrefs', type: 'SEO工具', url: 'https://ahrefs.com', cost: '$99-$999/月', description: '关键词研究和内容规划' },
            ],
            resources: ['https://contentmarketinginstitute.com/ - 内容营销资源'],
          },
        ],
      },
    ],
    marketDetail: {
      size: 'large',
      sizeDescription: '全球笔记应用市场规模达80亿美元，AI知识管理是新兴趋势',
      targetUsers: ['学生', '知识工作者', '研究人员', '创业者', '终身学习者'],
      demographics: {
        ageRange: '18-45岁',
        location: ['中国', '美国', '日本', '欧洲', '东南亚'],
        incomeLevel: ['$10K-30K', '$30K-50K', '$50K+'],
      },
      growthRate: 25,
      marketValue: '80亿美元',
      keyStatistics: [
        { label: '全球笔记应用用户', value: '5', unit: '亿', source: 'Statista 2026' },
        { label: '日均笔记创建量', value: '20', unit: '亿条', source: 'Evernote' },
        { label: '知识管理搜索增长', value: '180', unit: '%', source: 'Google Trends' },
        { label: '用户平均笔记数量', value: '250', unit: '条', source: 'Notion内部数据' },
      ],
    },
    monetizationDetail: {
      strategies: [
        {
          name: '订阅制（推荐）',
          description: '按月收取订阅费用，提供不同存储空间和功能档位',
          implementationSteps: ['设置价格档位', '集成Stripe支付', '实现存储配额管理', '设置免费试用期'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '全球支付平台' },
            { name: 'Cloudflare R2', type: '存储', url: 'https://cloudflare.com/r2', cost: '$0/存储+传输付费', description: '低成本对象存储' },
          ],
          expectedConversion: '6-10%',
          pros: ['稳定收入', '高用户粘性'],
          cons: ['需持续提供价值'],
        },
        {
          name: '一次性购买',
          description: '买断制收费模式，降低用户决策门槛',
          implementationSteps: ['设置一次性价格', '集成LemonSqueezy支付', '提供终身更新承诺'],
          tools: [
            { name: 'Lemonsqueezy', type: '支付', url: 'https://lemonsqueezy.com', cost: '5%+50¢/笔', description: '专注独立开发者的支付平台' },
          ],
          expectedConversion: '10-15%',
          pros: ['高单次收入', '低决策门槛'],
          cons: ['无持续收入', '需持续维护成本'],
        },
      ],
      pricingModel: {
        tiers: [
          { name: '免费版', price: '$0', features: ['1000条笔记', '基础AI整理', '3个知识图谱'], targetUsers: '个人用户入门' },
          { name: '专业版', price: '$15/月', features: ['无限笔记', '高级AI分析', '无限知识图谱', '多设备同步', '优先支持'], targetUsers: '专业用户' },
          { name: '终身版', price: '$199', features: ['专业版所有功能终身使用', '优先新功能体验', '终身技术支持'], targetUsers: '长期用户' },
        ],
        recommendedTier: '专业版',
      },
      expectedRevenue: {
        month1: '$800',
        month3: '$8,000',
        month6: '$25,000',
        month12: '$80,000',
        assumptions: ['用户月增长率35%', '付费转化率8%', '平均客单价$25', '月流失率6%'],
      },
    },
    comments: [
      { id: 'c4', author: 'u/student_life', content: '笔记堆了几千条，根本找不到需要的内容，太痛苦了！', sentiment: 'negative', createdAt: '2026-06-27T09:30:00Z' },
      { id: 'c5', author: 'u/professional', content: 'Notion很好但整理还是要手动，希望有AI帮忙。', sentiment: 'neutral', createdAt: '2026-06-27T10:00:00Z' },
    ],
  },
  {
    id: '4',
    title: 'AI视频剪辑自动化工具',
    description: '内容创作者希望AI能自动识别精彩片段、添加字幕、调整节奏，减少手动剪辑时间。',
    painLevel: 95,
    competitionLevel: 32,
    competitionLabel: 'low',
    validationScore: 93,
    potential: 'very_high',
    category: '创意工具',
    tags: ['AI', '视频剪辑', '内容创作'],
    mentions: 3120,
    createdAt: '2026-06-26T12:00:00Z',
    dataSources: [
      { platform: 'B站', platformIcon: 'video', platformType: 'video', url: 'https://bilibili.com/video/av12345', postDate: '2026-06-26', author: 'UP主：视频达人', engagement: { comments: 2345, likes: 15678, shares: 4567 }, sentiment: 'negative', excerpt: '剪辑一个视频要花好几个小时，真希望能自动化！特别是字幕和精彩片段剪辑。' },
      { platform: '抖音', platformIcon: 'video', platformType: 'video', url: 'https://douyin.com/video/67890', postDate: '2026-06-25', author: '@短视频创作者', engagement: { comments: 5678, likes: 34567, shares: 8901 }, sentiment: 'negative', excerpt: '字幕自动生成是刚需，现在的工具都不够智能，还需要手动校对很多。' },
      { platform: 'YouTube', platformIcon: 'video', platformType: 'video', url: 'https://youtube.com/watch?v=abc123', postDate: '2026-06-24', author: '@content_creator', engagement: { comments: 1234, likes: 8765, shares: 2345 }, sentiment: 'negative', excerpt: 'Spending 8+ hours editing videos every week. Need AI to automate the boring parts!' },
      { platform: 'TikTok', platformIcon: 'video', platformType: 'video', url: 'https://tiktok.com/@creator/video/12345', postDate: '2026-06-23', author: '@tiktok_creator', engagement: { comments: 3456, likes: 23456, shares: 5678 }, sentiment: 'negative', excerpt: 'Wish there was an AI tool that could automatically cut my long videos into short clips for TikTok.' },
      { platform: '快手', platformIcon: 'video', platformType: 'video', url: 'https://kuaishou.com/video/12345', postDate: '2026-06-22', author: '@快手创作者', engagement: { comments: 1234, likes: 8765, shares: 2345 }, sentiment: 'negative', excerpt: '直播剪辑太费时间了，有没有办法自动化处理？' },
      { platform: '虎牙', platformIcon: 'video', platformType: 'live', url: 'https://huya.com/live/12345', postDate: '2026-06-21', author: '@虎牙主播', engagement: { comments: 567, likes: 3456, shares: 890 }, sentiment: 'negative', excerpt: '每次直播完剪辑精彩片段要花3-4小时，太折磨人了！' },
      { platform: '斗鱼', platformIcon: 'video', platformType: 'live', url: 'https://douyu.com/video/12345', postDate: '2026-06-20', author: '@斗鱼主播', engagement: { comments: 456, likes: 2345, shares: 678 }, sentiment: 'negative', excerpt: '有没有工具能自动识别游戏直播中的精彩操作并剪辑出来？' },
      { platform: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com/item/12345', postDate: '2026-06-19', author: '@vlog博主', engagement: { comments: 1234, likes: 7890, shares: 2345 }, sentiment: 'negative', excerpt: 'vlog剪辑太耗时了，求一个AI剪辑工具！' },
      { platform: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com/question/12345', postDate: '2026-06-18', author: '视频创业者', engagement: { comments: 456, likes: 2345, shares: 567 }, sentiment: 'negative', excerpt: 'AI视频剪辑工具哪家强？有没有真正智能的？' },
      { platform: '36氪', platformIcon: 'newspaper', platformType: 'news', url: 'https://36kr.com/p/12345', postDate: '2026-06-17', author: '科技编辑', engagement: { comments: 123, likes: 678, shares: 234 }, sentiment: 'negative', excerpt: 'AI视频工具赛道的最新动向：自动化剪辑成为新热点。' },
      { platform: 'Twitter', platformIcon: 'twitter', platformType: 'social', url: 'https://twitter.com/dev/status/12345', postDate: '2026-06-16', author: '@video_editor', engagement: { comments: 234, likes: 1234, shares: 345 }, sentiment: 'negative', excerpt: 'AI video editing is getting scary good. The future of content creation is here!' },
    ],
    implementationSteps: [
      {
        phase: 'validation',
        phaseName: '验证阶段',
        duration: '1周',
        steps: [
          {
            number: 1,
            title: '创作者调研',
            description: '通过B站、抖音评论区和小红书收集创作者的剪辑痛点',
            tools: [
              { name: '蝉妈妈', type: '数据分析', url: 'https://chanmama.com', cost: '免费-$99/月', description: '抖音数据分析工具，了解热门内容' },
              { name: '飞瓜数据', type: '数据分析', url: 'https://feigua.com', cost: '免费-$199/月', description: '短视频数据分析平台' },
              { name: '新榜', type: '数据工具', url: 'https://newbang.cn', cost: '免费-$299/月', description: '国内新媒体数据工具' },
            ],
            resources: ['https://www.bilibili.com/read/cv/ - B站专栏文章', 'https://抖音开放平台.com - 抖音开发者平台'],
          },
          {
            number: 2,
            title: '竞品分析',
            description: '分析现有AI视频工具的功能和定价，找出差异化点',
            tools: [
              { name: 'Synthesia', type: '竞品', url: 'https://synthesia.io', cost: '$30-$150/月', description: 'AI视频生成头部产品' },
              { name: 'Runway', type: '竞品', url: 'https://runwayml.com', cost: '$15-$95/月', description: 'AI视频编辑工具' },
              { name: 'Pictory', type: '竞品', url: 'https://pictory.ai', cost: '$19-$99/月', description: 'AI视频摘要工具' },
            ],
            resources: ['https://alternativeto.net - 竞品替代品对比'],
          },
        ],
      },
      {
        phase: 'mvp',
        phaseName: 'MVP阶段',
        duration: '4-6周',
        steps: [
          {
            number: 1,
            title: '核心AI功能开发',
            description: '实现AI字幕生成、精彩片段识别、视频自动剪辑',
            tools: [
              { name: 'Whisper API', type: '语音识别', url: 'https://openai.com/research/whisper', cost: '按用量付费', description: 'OpenAI语音转文字模型，支持多语言' },
              { name: 'FFmpeg', type: '视频处理', url: 'https://ffmpeg.org', cost: '免费', description: '开源视频处理工具，命令行调用' },
              { name: 'PyTorch', type: 'AI框架', url: 'https://pytorch.org', cost: '免费', description: '深度学习框架，用于模型训练' },
              { name: 'MoviePy', type: 'Python视频', url: 'https://zulko.github.io/moviepy/', cost: '免费', description: 'Python视频编辑库' },
            ],
            resources: ['https://platform.openai.com/docs/guides/speech-to-text - Whisper文档', 'https://github.com/awesome-ai-video - AI视频工具汇总'],
          },
          {
            number: 2,
            title: '用户界面开发',
            description: '设计简洁易用的视频剪辑界面，支持拖拽操作',
            tools: [
              { name: 'React', type: '前端框架', url: 'https://react.dev', cost: '免费', description: '前端UI框架' },
              { name: 'Tailwind CSS', type: 'CSS框架', url: 'https://tailwindcss.com', cost: '免费', description: '快速构建美观界面' },
              { name: 'Video.js', type: '视频播放器', url: 'https://videojs.com', cost: '免费', description: '开源视频播放器' },
            ],
            resources: ['https://tailwindui.com/ - Tailwind组件库', 'https://www.pexels.com - 免费视频素材'],
          },
          {
            number: 3,
            title: '云端渲染服务',
            description: '搭建视频渲染后端，支持大规模并发处理',
            tools: [
              { name: 'AWS EC2', type: '云服务', url: 'https://aws.amazon.com/ec2', cost: '按需付费', description: '云端服务器' },
              { name: 'Render', type: '云服务', url: 'https://render.com', cost: '免费-$25/月', description: '便捷的云端部署平台' },
              { name: 'Cloudflare', type: 'CDN', url: 'https://cloudflare.com', cost: '免费-$200/月', description: '全球CDN加速' },
            ],
            resources: ['https://aws.amazon.com/ec2/instance-types/ - AWS实例类型'],
          },
        ],
      },
      {
        phase: 'growth',
        phaseName: '增长阶段',
        duration: '持续优化',
        steps: [
          {
            number: 1,
            title: '创作者社区推广',
            description: '与B站、抖音知名创作者合作，进行产品试用和推荐',
            tools: [
              { name: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com', cost: '免费', description: '内容种草社区' },
              { name: '微博', platformIcon: 'message-circle', platformType: 'social', url: 'https://weibo.com', cost: '免费', description: '社交媒体平台' },
              { name: '新榜', type: '数据工具', url: 'https://newbang.cn', cost: '免费', description: 'KOL数据平台' },
            ],
            resources: ['https://www.xiaohongshu.com/explore - 小红书内容分类'],
          },
          {
            number: 2,
            title: '平台合作与API开放',
            description: '与视频平台合作，提供嵌入式服务，开放API吸引开发者',
            tools: [
              { name: '抖音开放平台', type: 'API', url: 'https://open.douyin.com', cost: '免费', description: '抖音官方开放平台' },
              { name: 'B站开放平台', type: 'API', url: 'https://open.bilibili.com', cost: '免费', description: 'B站官方开放平台' },
            ],
            resources: ['https://developers.google.com/youtube - YouTube API'],
          },
        ],
      },
    ],
    marketDetail: {
      size: 'large',
      sizeDescription: '全球视频编辑软件市场规模达50亿美元，AI视频工具快速增长',
      targetUsers: ['内容创作者', '自媒体博主', '企业营销人员', '教育工作者', '游戏主播'],
      demographics: {
        ageRange: '18-40岁',
        location: ['中国', '美国', '印度', '东南亚', '巴西'],
        incomeLevel: ['$10K-30K', '$30K-50K', '$50K+'],
      },
      growthRate: 45,
      marketValue: '50亿美元',
      keyStatistics: [
        { label: '全球视频创作者', value: '1.2', unit: '亿', source: 'Statista 2026' },
        { label: '日均视频上传量', value: '500', unit: '万', source: 'YouTube' },
        { label: 'AI视频工具搜索增长', value: '300', unit: '%', source: 'Google Trends' },
        { label: '短视频用户日均使用时长', value: '105', unit: '分钟', source: 'App Annie' },
      ],
    },
    monetizationDetail: {
      strategies: [
        {
          name: '订阅制（推荐）',
          description: '按月收取订阅费用，提供不同视频处理时长档位',
          implementationSteps: ['设置价格档位', '集成Stripe支付', '实现用量计量', '设置超量提醒'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '全球支付平台' },
            { name: 'AWS', type: '云服务', url: 'https://aws.amazon.com', cost: '按需付费', description: '视频渲染云服务' },
          ],
          expectedConversion: '5-8%',
          pros: ['稳定收入', '用户粘性高'],
          cons: ['需持续计算资源成本'],
        },
        {
          name: '按使用量付费',
          description: '按视频处理时长收费，适合轻度用户',
          implementationSteps: ['设计计费方案(每分钟$0.1)', '实现计量系统', '设置预付费套餐'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '在线支付平台' },
          ],
          expectedConversion: '8-12%',
          pros: ['低门槛', '用户按需付费'],
          cons: ['收入不稳定'],
        },
      ],
      pricingModel: {
        tiers: [
          { name: '免费版', price: '$0', features: ['每月10分钟视频处理', '基础字幕生成', '720p导出'], targetUsers: '入门创作者' },
          { name: '专业版', price: '$29/月', features: ['无限视频处理', 'AI精彩剪辑', '高级字幕(多语言)', '1080p导出无水印', '优先渲染'], targetUsers: '专业创作者' },
          { name: '企业版', price: '$99/月', features: ['无限处理', '4K导出', '团队协作', 'API访问', '私有化部署', '专属客户成功'], targetUsers: '企业/工作室' },
        ],
        recommendedTier: '专业版',
      },
      expectedRevenue: {
        month1: '$1,000',
        month3: '$10,000',
        month6: '$35,000',
        month12: '$120,000',
        assumptions: ['用户月增长率40%', '付费转化率6%', '平均客单价$35', '月流失率5%'],
      },
    },
    comments: [
      { id: 'c7', author: 'u/youtube_creator', content: '剪辑一个视频要花好几个小时，真希望能自动化！', sentiment: 'negative', createdAt: '2026-06-26T12:30:00Z' },
      { id: 'c8', author: 'u/tiktok_maker', content: '字幕自动生成是刚需，现在的工具都不够智能。', sentiment: 'negative', createdAt: '2026-06-26T13:00:00Z' },
    ],
  },
  {
    id: '5',
    title: 'AI驱动的简历优化工具',
    description: '求职者希望根据职位描述自动优化简历，提高通过率。',
    painLevel: 85,
    competitionLevel: 58,
    competitionLabel: 'medium',
    validationScore: 88,
    potential: 'high',
    category: '求职工具',
    tags: ['AI', '简历', '求职'],
    mentions: 1780,
    createdAt: '2026-06-25T11:00:00Z',
    dataSources: [
      { platform: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com/item/67890', postDate: '2026-06-25', author: '@求职达人', engagement: { comments: 1567, likes: 8901, shares: 2345 }, sentiment: 'negative', excerpt: '投了几十份简历都没回应，肯定是简历有问题！希望有AI能帮我优化。' },
      { platform: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com/question/abc', postDate: '2026-06-24', author: '应届毕业生', engagement: { comments: 678, likes: 3456, shares: 890 }, sentiment: 'negative', excerpt: '简历改了无数版还是没面试，求一个能匹配JD的AI工具！' },
      { platform: 'LinkedIn', platformIcon: 'briefcase', platformType: 'social', url: 'https://linkedin.com/posts/12345', postDate: '2026-06-23', author: '@job_seeker', engagement: { comments: 234, likes: 1234, shares: 345 }, sentiment: 'negative', excerpt: 'Spent hours tailoring resumes but still no callbacks. Need AI to help match job descriptions.' },
      { platform: '微信公众号', platformIcon: 'message-circle', platformType: 'social', url: 'https://mp.weixin.qq.com/s/abc', postDate: '2026-06-22', author: '@求职助手', engagement: { comments: 345, likes: 1567, shares: 456 }, sentiment: 'negative', excerpt: '简历优化的市场需求巨大，AI能否成为解决方案？' },
      { platform: 'B站', platformIcon: 'video', platformType: 'video', url: 'https://bilibili.com/video/av12345', postDate: '2026-06-21', author: 'UP主：职场技巧', engagement: { comments: 567, likes: 2345, shares: 678 }, sentiment: 'negative', excerpt: '如何用AI工具快速优化简历，提高面试邀请率？' },
      { platform: '抖音', platformIcon: 'video', platformType: 'video', url: 'https://douyin.com/video/12345', postDate: '2026-06-20', author: '@求职博主', engagement: { comments: 890, likes: 4567, shares: 1234 }, sentiment: 'negative', excerpt: 'AI写简历真的太香了！投了10家收到8个面试！' },
      { platform: '微博', platformIcon: 'message-circle', platformType: 'social', url: 'https://weibo.com/post/12345', postDate: '2026-06-19', author: '@职场博主', engagement: { comments: 234, likes: 1234, shares: 345 }, sentiment: 'negative', excerpt: '简历优化这个赛道，AI大有可为！' },
      { platform: '36氪', platformIcon: 'newspaper', platformType: 'news', url: 'https://36kr.com/p/12345', postDate: '2026-06-18', author: '创业观察', engagement: { comments: 89, likes: 456, shares: 123 }, sentiment: 'negative', excerpt: 'AI简历优化工具成为求职市场新热点。' },
    ],
    implementationSteps: [
      {
        phase: 'validation',
        phaseName: '验证阶段',
        duration: '1周',
        steps: [
          {
            number: 1,
            title: '求职市场调研',
            description: '分析求职者痛点和招聘市场需求，收集简历优化需求',
            tools: [
              { name: 'Boss直聘', type: '招聘平台', url: 'https://www.zhipin.com', cost: '免费', description: '国内招聘平台，了解JD特点' },
              { name: '智联招聘', type: '招聘平台', url: 'https://zhaopin.com', cost: '免费', description: '国内招聘平台' },
              { name: 'LinkedIn', type: '招聘平台', url: 'https://linkedin.com', cost: '免费', description: '国际招聘平台' },
            ],
            resources: ['https://www.51job.com/ - 前程无忧', 'https://www.lagou.com/ - 拉勾网'],
          },
          {
            number: 2,
            title: '竞品分析',
            description: '分析现有简历优化工具的功能和定价',
            tools: [
              { name: 'Resume.io', type: '竞品', url: 'https://resume.io', cost: '$14.95-$29.95/月', description: '国外简历制作工具' },
              { name: 'Kickresume', type: '竞品', url: 'https://kickresume.com', cost: '$14-$48/月', description: 'AI简历工具' },
            ],
            resources: ['https://alternativeto.net/category/resume-builder - 简历工具对比'],
          },
        ],
      },
      {
        phase: 'mvp',
        phaseName: 'MVP阶段',
        duration: '2-3周',
        steps: [
          {
            number: 1,
            title: '核心功能开发',
            description: '实现简历解析、JD匹配分析、AI优化建议生成',
            tools: [
              { name: 'OpenAI API', type: 'AI服务', url: 'https://openai.com/api', cost: '按用量付费', description: 'GPT-4用于简历分析和优化' },
              { name: 'PyPDF2', type: 'PDF解析', url: 'https://pypdf2.readthedocs.io', cost: '免费', description: 'PDF文件解析库' },
              { name: 'React', type: '前端框架', url: 'https://react.dev', cost: '免费', description: '前端界面开发' },
            ],
            resources: ['https://platform.openai.com/docs/guides/gpt - GPT使用指南'],
          },
          {
            number: 2,
            title: '简历模板设计',
            description: '设计专业美观的简历模板，支持一键导出',
            tools: [
              { name: 'Figma', type: '设计工具', url: 'https://figma.com', cost: '免费-$12/月', description: '简历模板设计' },
              { name: 'html2pdf', type: 'PDF转换', url: 'https://github.com/niklasvh/html2canvas', cost: '免费', description: 'HTML转PDF库' },
            ],
            resources: ['https://templates.radiohits.net - 简历模板参考'],
          },
        ],
      },
      {
        phase: 'growth',
        phaseName: '增长阶段',
        duration: '持续优化',
        steps: [
          {
            number: 1,
            title: '校园推广与合作',
            description: '与高校就业中心合作推广，锁定应届生市场',
            tools: [
              { name: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com', cost: '免费', description: '学生聚集的内容平台' },
              { name: '微信公众号', type: '内容平台', url: 'https://mp.weixin.qq.com', cost: '免费', description: '内容传播平台' },
            ],
            resources: ['https://mp.weixin.qq.com/ - 微信公众号平台'],
          },
          {
            number: 2,
            title: '求职社区运营',
            description: '在知乎、牛客网等求职社区建立品牌',
            tools: [
              { name: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com', cost: '免费', description: '问答社区运营' },
              { name: '牛客网', type: '求职社区', url: 'https://nowcoder.com', cost: '免费', description: '技术求职社区' },
            ],
            resources: ['https://www.zhihu.com/topic - 知乎话题运营'],
          },
        ],
      },
    ],
    marketDetail: {
      size: 'medium',
      sizeDescription: '全球求职工具市场规模达30亿美元，AI简历优化是新兴细分',
      targetUsers: ['应届毕业生', '职场跳槽者', '海外求职者', '职业规划师', '猎头'],
      demographics: {
        ageRange: '22-35岁',
        location: ['中国', '美国', '印度', '欧洲'],
        incomeLevel: ['$10K-30K', '$30K-50K'],
      },
      growthRate: 20,
      marketValue: '30亿美元',
      keyStatistics: [
        { label: '全球求职者数量', value: '1.5', unit: '亿', source: 'ILO 2026' },
        { label: '简历投递成功率', value: '5', unit: '%', source: 'Glassdoor' },
        { label: 'AI求职工具搜索增长', value: '250', unit: '%', source: 'Google Trends' },
        { label: '求职者平均投递简历数', value: '27', unit: '份', source: 'LinkedIn' },
      ],
    },
    monetizationDetail: {
      strategies: [
        {
          name: '单次付费（推荐）',
          description: '按简历优化次数收费，降低用户决策门槛',
          implementationSteps: ['设置单次价格($9.9)', '集成微信支付/支付宝', '实现订单管理系统'],
          tools: [
            { name: '微信支付', type: '支付', url: 'https://pay.weixin.qq.com', cost: '0.6%', description: '国内主流支付方式' },
            { name: '支付宝', type: '支付', url: 'https://open.alipay.com', cost: '0.6%', description: '国内主流支付方式' },
          ],
          expectedConversion: '10-15%',
          pros: ['低门槛', '高转化率', '适合求职场景'],
          cons: ['收入不稳定'],
        },
        {
          name: '订阅制',
          description: '月度/年度会员，享受无限次优化',
          implementationSteps: ['设置订阅价格', '集成Stripe支付(海外)', '实现会员管理系统'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '海外支付平台' },
          ],
          expectedConversion: '3-5%',
          pros: ['稳定收入', '高用户生命周期价值'],
          cons: ['用户流失风险'],
        },
      ],
      pricingModel: {
        tiers: [
          { name: '单次优化', price: '$9.9/次', features: ['1次简历优化', '基础匹配分析', 'PDF导出'], targetUsers: '偶尔使用用户' },
          { name: '月度会员', price: '$29/月', features: ['无限优化', '高级分析报告', '职位推荐', '面试问题预测'], targetUsers: '频繁求职者' },
          { name: '年度会员', price: '$199/年', features: ['月度会员所有功能', '职业咨询(1次)', '优先新功能体验'], targetUsers: '长期求职者' },
        ],
        recommendedTier: '单次优化',
      },
      expectedRevenue: {
        month1: '$500',
        month3: '$5,000',
        month6: '$15,000',
        month12: '$45,000',
        assumptions: ['用户月增长率25%', '付费转化率8%', '平均客单价$15', '月流失率7%'],
      },
    },
    comments: [
      { id: 'c9', author: 'u/job_seeker', content: '投了几十份简历都没回应，肯定是简历有问题！', sentiment: 'negative', createdAt: '2026-06-25T11:30:00Z' },
    ],
  },
  {
    id: '6',
    title: 'AI辅助的电商产品描述生成器',
    description: '电商卖家需要快速生成吸引人的产品描述，但写作能力有限。',
    painLevel: 79,
    competitionLevel: 65,
    competitionLabel: 'medium',
    validationScore: 85,
    potential: 'high',
    category: '电商工具',
    tags: ['AI', '电商', '文案'],
    mentions: 670,
    createdAt: '2026-06-26T16:00:00Z',
    dataSources: [
      { platform: 'Product Hunt', platformIcon: 'zap', platformType: 'social', url: 'https://producthunt.com/posts/ai-description', postDate: '2026-06-26', author: '@shop_owner', engagement: { comments: 234, likes: 1234, shares: 345 }, sentiment: 'negative', excerpt: '写产品描述是我最头疼的事，能有AI帮忙就太好了！' },
      { platform: '淘宝', platformIcon: 'shopping-bag', platformType: 'ecommerce', url: 'https://taobao.com/item/12345', postDate: '2026-06-25', author: '淘宝卖家小李', engagement: { comments: 123, likes: 0, shares: 45 }, sentiment: 'negative', excerpt: '每次上新都要写一堆产品描述，有没有AI能帮我写？' },
      { platform: '亚马逊', platformIcon: 'shopping-bag', platformType: 'ecommerce', url: 'https://amazon.com/dp/12345', postDate: '2026-06-24', author: '@amazon_seller', engagement: { comments: 67, likes: 0, shares: 23 }, sentiment: 'negative', excerpt: 'Writing product descriptions takes too much time. Need AI to generate SEO-friendly copy.' },
      { platform: '拼多多', platformIcon: 'shopping-bag', platformType: 'ecommerce', url: 'https://pinduoduo.com/goods/12345', postDate: '2026-06-23', author: '@拼多多商家', engagement: { comments: 89, likes: 0, shares: 34 }, sentiment: 'negative', excerpt: '拼多多商品描述要求独特，AI能帮我写吗？' },
      { platform: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com/item/12345', postDate: '2026-06-22', author: '@种草达人', engagement: { comments: 345, likes: 1567, shares: 456 }, sentiment: 'negative', excerpt: '种草文案怎么写？有没有AI工具能帮忙？' },
      { platform: '知乎', platformIcon: 'book-open', platformType: 'forum', url: 'https://zhihu.com/question/12345', postDate: '2026-06-21', author: '电商创业者', engagement: { comments: 123, likes: 567, shares: 145 }, sentiment: 'negative', excerpt: 'AI写文案工具哪家强？电商卖家求推荐！' },
      { platform: '抖音', platformIcon: 'video', platformType: 'video', url: 'https://douyin.com/video/12345', postDate: '2026-06-20', author: '@带货主播', engagement: { comments: 234, likes: 1234, shares: 345 }, sentiment: 'negative', excerpt: '直播带货脚本能不能用AI写？太费脑子了！' },
      { platform: '36氪', platformIcon: 'newspaper', platformType: 'news', url: 'https://36kr.com/p/12345', postDate: '2026-06-19', author: '电商观察', engagement: { comments: 56, likes: 234, shares: 67 }, sentiment: 'negative', excerpt: 'AI正在改变电商：智能文案工具成新热点。' },
    ],
    implementationSteps: [
      {
        phase: 'validation',
        phaseName: '验证阶段',
        duration: '1周',
        steps: [
          {
            number: 1,
            title: '电商卖家调研',
            description: '通过淘宝、拼多多卖家社区收集需求',
            tools: [
              { name: '千牛', type: '卖家工具', url: 'https://qianniu.taobao.com', cost: '免费', description: '淘宝卖家工作台' },
              { name: '多多情报', type: '数据分析', url: 'https://www.duoduoqibao.com', cost: '免费-$99/月', description: '拼多多数据分析' },
            ],
            resources: ['https://bbs.pinduoduo.com/ - 拼多多卖家论坛', 'https://bbs.taobao.com/ - 淘宝卖家论坛'],
          },
          {
            number: 2,
            title: '竞品分析',
            description: '分析现有AI文案工具的功能和定价',
            tools: [
              { name: 'Jasper', type: '竞品', url: 'https://jasper.ai', cost: '$40-$82/月', description: 'AI文案头部产品' },
              { name: 'Copy.ai', type: '竞品', url: 'https://copy.ai', cost: '免费-$49/月', description: 'AI文案工具' },
            ],
            resources: ['https://alternativeto.net - 竞品替代对比'],
          },
        ],
      },
      {
        phase: 'mvp',
        phaseName: 'MVP阶段',
        duration: '2-3周',
        steps: [
          {
            number: 1,
            title: '核心功能开发',
            description: '实现产品信息输入、AI文案生成、多平台适配',
            tools: [
              { name: 'OpenAI API', type: 'AI服务', url: 'https://openai.com/api', cost: '按用量付费', description: 'GPT-4用于文案生成' },
              { name: 'React', type: '前端框架', url: 'https://react.dev', cost: '免费', description: '前端界面开发' },
              { name: 'Tailwind CSS', type: 'CSS框架', url: 'https://tailwindcss.com', cost: '免费', description: '界面样式' },
            ],
            resources: ['https://platform.openai.com/docs/guides/text-generation - 文本生成指南'],
          },
          {
            number: 2,
            title: '多平台模板开发',
            description: '开发淘宝、亚马逊、速卖通等平台适配的文案模板',
            tools: [
              { name: 'Figma', type: '设计工具', url: 'https://figma.com', cost: '免费-$12/月', description: '模板设计' },
            ],
            resources: ['https://www.amazon.com/selling-programs - 亚马逊卖家计划'],
          },
        ],
      },
      {
        phase: 'growth',
        phaseName: '增长阶段',
        duration: '持续优化',
        steps: [
          {
            number: 1,
            title: '电商平台推广',
            description: '在淘宝、拼多多卖家社区推广',
            tools: [
              { name: '淘宝论坛', type: '社区', url: 'https://bbs.taobao.com', cost: '免费', description: '淘宝卖家论坛' },
              { name: '小红书', platformIcon: 'book-open', platformType: 'social', url: 'https://xiaohongshu.com', cost: '免费', description: '种草内容平台' },
            ],
            resources: ['https://xiaohongshu.com/explore/电商 - 电商内容'],
          },
          {
            number: 2,
            title: 'KOL合作',
            description: '与电商卖家KOL合作推广',
            tools: [
              { name: '蝉妈妈', type: '数据工具', url: 'https://chanmama.com', cost: '免费', description: 'KOL数据平台' },
            ],
            resources: ['https://www.newbang.cn - 新榜KOL数据'],
          },
        ],
      },
    ],
    marketDetail: {
      size: 'large',
      sizeDescription: '全球电商市场规模达6万亿美元，产品文案是刚需',
      targetUsers: ['淘宝卖家', '拼多多卖家', '亚马逊卖家', '独立站卖家', '跨境电商'],
      demographics: {
        ageRange: '25-45岁',
        location: ['中国', '美国', '欧洲', '东南亚'],
        incomeLevel: ['$10K-30K', '$30K-50K', '$50K+'],
      },
      growthRate: 15,
      marketValue: '6万亿美元',
      keyStatistics: [
        { label: '全球电商卖家', value: '3000', unit: '万', source: 'eMarketer 2026' },
        { label: '日均上新商品', value: '100', unit: '万', source: '淘宝' },
        { label: 'AI文案工具搜索增长', value: '180', unit: '%', source: 'Google Trends' },
        { label: '跨境电商市场规模', value: '6.5', unit: '万亿美元', source: 'Shopify' },
      ],
    },
    monetizationDetail: {
      strategies: [
        {
          name: '按字数付费（推荐）',
          description: '按生成的文案字数收费，适合轻度使用',
          implementationSteps: ['设计计费方案(每100字$0.1)', '实现用量计量', '设置预付费套餐'],
          tools: [
            { name: '微信支付', type: '支付', url: 'https://pay.weixin.qq.com', cost: '0.6%', description: '国内支付' },
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '海外支付' },
          ],
          expectedConversion: '10-15%',
          pros: ['低门槛', '灵活付费'],
          cons: ['收入不稳定'],
        },
        {
          name: '订阅制',
          description: '月度会员无限使用',
          implementationSteps: ['设置订阅价格', '集成支付', '实现会员管理'],
          tools: [
            { name: 'Stripe', type: '支付', url: 'https://stripe.com', cost: '2.9%+30¢/笔', description: '支付平台' },
          ],
          expectedConversion: '5-8%',
          pros: ['稳定收入'],
          cons: ['用户流失风险'],
        },
      ],
      pricingModel: {
        tiers: [
          { name: '免费版', price: '$0', features: ['每月5000字', '基础模板(5个)'], targetUsers: '小卖家/试用' },
          { name: '专业版', price: '$19/月', features: ['无限字数', '多平台模板(50+)', 'SEO优化', '批量生成', '优先支持'], targetUsers: '专业卖家' },
          { name: '企业版', price: '$99/月', features: ['专业版所有功能', '团队协作', '定制模板', 'API访问', '专属客户成功'], targetUsers: '大型商家/工作室' },
        ],
        recommendedTier: '专业版',
      },
      expectedRevenue: {
        month1: '$400',
        month3: '$4,000',
        month6: '$12,000',
        month12: '$40,000',
        assumptions: ['用户月增长率20%', '付费转化率6%', '平均客单价$20', '月流失率7%'],
      },
    },
    comments: [
      { id: 'c6', author: 'u/shop_owner', content: '写产品描述是我最头疼的事，能有AI帮忙就太好了！', sentiment: 'negative', createdAt: '2026-06-26T16:30:00Z' },
    ],
  },
];

export const mockTrends: Trend[] = [
  { id: 't1', title: 'AI智能体（Agent）应用爆发', category: 'AI', growthRate: 350, volume: 125000, startDate: '2026-01-01', keywords: ['AI Agent', '智能体', '自动化', '自主AI'] },
  { id: 't2', title: 'AI视频生成与编辑', category: '视频', growthRate: 280, volume: 98000, startDate: '2026-02-01', keywords: ['AI视频', '视频生成', 'AI剪辑', '生成式视频'] },
  { id: 't3', title: 'AI教育个性化学习', category: '教育', growthRate: 150, volume: 72000, startDate: '2026-01-01', keywords: ['AI教育', '个性化学习', '智能辅导', '自适应学习'] },
  { id: 't4', title: 'AI健康与医疗辅助', category: '健康', growthRate: 180, volume: 65000, startDate: '2026-03-01', keywords: ['AI医疗', '健康助手', 'AI诊断', '健康管理'] },
  { id: 't5', title: 'AI编程辅助工具', category: '开发者工具', growthRate: 120, volume: 89000, startDate: '2026-01-01', keywords: ['AI编程', '代码助手', 'AI开发', '智能IDE'] },
];

export const mockValidationResult: IdeaValidation = {
  idea: 'AI驱动的社交媒体内容自动发布工具',
  validationScore: 92,
  competitionAnalysis: { existingSolutions: 15, avgRating: 3.2, gaps: ['跨平台格式优化不足', '缺乏AI内容重写能力', '分析报告不够直观'] },
  marketSize: 'large',
  mvpFeasibility: 85,
  suggestedFeatures: ['一键发布到5+平台', 'AI自动调整内容格式', '发布时间智能推荐', '效果分析仪表盘'],
  monetizationStrategy: ['订阅制', '按发布次数收费', '企业定制版'],
};

export const platformIcons: Record<string, string> = {
  reddit: 'reddit', xiaohongshu: 'book-open', twitter: 'twitter', producthunt: 'zap', bilibili: 'video',
  douyin: 'video', tiktok: 'video', youtube: 'video', zhihu: 'book-open', hackernews: 'newspaper',
  linkedin: 'briefcase', taobao: 'shopping-bag', amazon: 'shopping-bag', twitch: 'video', medium: 'newspaper',
  substack: 'newspaper', github: 'github', stackoverflow: 'stack-overflow', figma: 'figma', '36kr': 'newspaper',
  huxiu: 'newspaper', sinakeji: 'newspaper', quora: 'message-circle', kuaishou: 'video', shipinhao: 'video',
  wechat: 'message-circle', jianshu: 'book-open', csdn: 'code', juejin: 'code', itjuzi: 'newspaper',
  lieyunwang: 'newspaper', huya: 'video', douyu: 'video', pinduoduo: 'shopping-bag',
};

export const sourceNames: Record<string, string> = {
  reddit: 'Reddit', xiaohongshu: '小红书', twitter: 'Twitter', producthunt: 'Product Hunt', bilibili: 'B站',
  douyin: '抖音', tiktok: 'TikTok', youtube: 'YouTube', zhihu: '知乎', hackernews: 'Hacker News',
  linkedin: 'LinkedIn', taobao: '淘宝', amazon: '亚马逊', twitch: 'Twitch', medium: 'Medium',
  substack: 'Substack', github: 'GitHub', stackoverflow: 'Stack Overflow', figma: 'Figma', '36kr': '36氪',
  huxiu: '虎嗅', sinakeji: '新浪科技', quora: 'Quora', kuaishou: '快手', shipinhao: '视频号',
  wechat: '微信', jianshu: '简书', csdn: 'CSDN', juejin: '掘金', itjuzi: 'IT桔子',
  lieyunwang: '猎云网', huya: '虎牙', douyu: '斗鱼', pinduoduo: '拼多多',
};

export const sourceTypeNames: Record<string, string> = {
  social: '社交平台', video: '视频平台', news: '新闻媒体', developer: '开发者社区',
  ecommerce: '电商平台', blog: '博客论坛', forum: '问答社区', live: '直播平台', search: '搜索引擎'
};
