// 研途助手 - 核心功能逻辑

// 岗位技能数据（带权重）
const positionSkills = {
    'product-manager': {
        name: '产品经理',
        skills: [
            { name: '产品思维', weight: 1.0, level: '核心', description: '用户视角，理解需求并转化为产品功能', learningSuggestion: '多阅读产品分析文章，培养产品sense，推荐《人人都是产品经理》' },
            { name: '数据分析', weight: 0.9, level: '核心', description: '使用Excel、SQL等工具进行数据收集、整理和分析', learningSuggestion: '推荐学习SQL基础课程和数据分析方法论' },
            { name: '需求管理', weight: 0.85, level: '核心', description: '收集、整理、优先级排序需求', learningSuggestion: '学习Jira、禅道等项目管理工具，掌握KANO模型、MoSCoW法则' },
            { name: '原型设计', weight: 0.8, level: '重要', description: '使用Axure、Figma等工具绘制原型', learningSuggestion: 'Figma是目前主流，推荐学习Figma基础操作' },
            { name: '沟通协调', weight: 0.85, level: '核心', description: '跨部门沟通，协调开发、设计、测试资源', learningSuggestion: '提升结构化表达能力，学习会议纪要技巧' },
            { name: '市场分析', weight: 0.7, level: '重要', description: '竞品分析、市场调研、用户研究', learningSuggestion: '学习SWOT分析法，关注行业报告' },
            { name: '项目管理', weight: 0.75, level: '重要', description: '敏捷开发、Scrum流程管理', learningSuggestion: '考取PMP证书或学习Scrum Master知识' },
            { name: '文档能力', weight: 0.7, level: '重要', description: 'BRD、PRD、MRD等文档撰写', learningSuggestion: '参考BAT等大厂产品文档规范' }
        ]
    },
    'frontend-developer': {
        name: '前端开发工程师',
        skills: [
            { name: 'HTML/CSS', weight: 1.0, level: '核心', description: '页面结构与样式布局', learningSuggestion: 'MDN Web Docs是最佳学习资源' },
            { name: 'JavaScript', weight: 1.0, level: '核心', description: '页面交互与逻辑处理', learningSuggestion: '深入学习ES6+，推荐《JavaScript高级程序设计》' },
            { name: '框架Vue/React', weight: 0.95, level: '核心', description: '主流前端框架应用', learningSuggestion: 'Vue3+Composition API或React18+Hooks' },
            { name: 'TypeScript', weight: 0.85, level: '重要', description: '类型安全的JavaScript超集', learningSuggestion: 'TypeScript官方文档配合实践' },
            { name: 'Node.js', weight: 0.75, level: '重要', description: '后端开发与工程化', learningSuggestion: '学习Express或Koa框架' },
            { name: '前端工程化', weight: 0.8, level: '核心', description: 'Webpack、Vite等构建工具', learningSuggestion: '学习Vite，它已成为新标准' },
            { name: 'Git版本控制', weight: 0.8, level: '重要', description: '代码管理与协作开发', learningSuggestion: '掌握Git Flow工作流' },
            { name: '浏览器原理', weight: 0.7, level: '基础', description: '渲染机制、性能优化', learningSuggestion: '学习Chrome DevTools和性能优化技巧' }
        ]
    },
    'backend-developer': {
        name: '后端开发工程师',
        skills: [
            { name: 'Java/Go/Python', weight: 1.0, level: '核心', description: '主流后端编程语言', learningSuggestion: 'Java适合大型系统，Go适合云原生' },
            { name: '数据库MySQL', weight: 0.95, level: '核心', description: '关系型数据库设计与SQL', learningSuggestion: '学习索引优化、事务隔离级别' },
            { name: 'Redis缓存', weight: 0.85, level: '重要', description: '缓存设计与分布式缓存', learningSuggestion: '学习Redis数据结构和大厂实践' },
            { name: '微服务架构', weight: 0.85, level: '核心', description: '服务拆分、API网关、服务治理', learningSuggestion: '学习Spring Cloud或Go Micro' },
            { name: 'Linux服务器', weight: 0.8, level: '重要', description: 'Linux操作与Shell脚本', learningSuggestion: '鸟哥的Linux私房菜' },
            { name: 'Docker容器', weight: 0.8, level: '重要', description: '容器化部署与环境隔离', learningSuggestion: 'Docker官方教程配合实践' },
            { name: 'API设计', weight: 0.85, level: '核心', description: 'RESTful API设计与文档', learningSuggestion: '学习OpenAPI规范和Swagger' },
            { name: '安全基础', weight: 0.75, level: '基础', description: 'SQL注入、XSS、CSRF防护', learningSuggestion: '学习OWASP Top 10' }
        ]
    },
    'operation': {
        name: '运营专员',
        skills: [
            { name: '内容运营', weight: 0.9, level: '核心', description: '内容策划、编辑、发布', learningSuggestion: '关注馒头商学院、姑婆那些事' },
            { name: '用户运营', weight: 0.95, level: '核心', description: '用户拉新、促活、留存、转化', learningSuggestion: '学习AARRR模型和用户画像' },
            { name: '数据分析', weight: 0.85, level: '核心', description: '数据监控、效果分析、策略调整', learningSuggestion: 'Excel高级函数和数据可视化' },
            { name: '活动策划', weight: 0.8, level: '重要', description: '活动方案、执行、复盘', learningSuggestion: '学习活动运营全流程' },
            { name: '新媒体运营', weight: 0.75, level: '重要', description: '双微一抖运营', learningSuggestion: '学习各平台规则和算法' },
            { name: '社群运营', weight: 0.8, level: '重要', description: '微信群、QQ群运营', learningSuggestion: '学习社群SOP搭建' },
            { name: '产品运营', weight: 0.7, level: '基础', description: '产品体验优化、需求反馈', learningSuggestion: '理解产品工作流' },
            { name: '渠道推广', weight: 0.75, level: '重要', description: 'ASO、SEO、广点通投放', learningSuggestion: '学习广告投放基础' }
        ]
    },
    'ui-designer': {
        name: 'UI设计师',
        skills: [
            { name: '设计软件Figma', weight: 1.0, level: '核心', description: 'UI设计主力工具', learningSuggestion: 'Figma官方教程+B站设计教程' },
            { name: '视觉设计', weight: 0.95, level: '核心', description: '配色、排版、图标设计', learningSuggestion: '学习设计基础理论：色彩、构图、字体' },
            { name: '交互设计', weight: 0.9, level: '核心', description: '交互流程、动效、微交互', learningSuggestion: '学习交互设计原则和iOS/Android设计规范' },
            { name: '设计规范', weight: 0.85, level: '重要', description: '设计系统、组件库', learningSuggestion: '学习Ant Design、Material Design' },
            { name: '用户研究', weight: 0.75, level: '基础', description: '用户调研、可用性测试', learningSuggestion: '学习用户访谈技巧' },
            { name: '手绘基础', weight: 0.6, level: '基础', description: 'Sketch手绘能力', learningSuggestion: '可选修，但非必须' },
            { name: '动效设计', weight: 0.7, level: '基础', description: 'AE交互动效', learningSuggestion: 'Principle或AE' },
            { name: '设计作品集', weight: 0.8, level: '重要', description: '作品集整理与展示', learningSuggestion: '学习如何讲故事和包装' }
        ]
    }
};

// 热门岗位数据（带直达链接）
const hotJobs = [
    // 产品经理类
    { 
        company: '字节跳动', 
        position: '产品经理实习生', 
        location: '北京/上海', 
        directLink: 'https://job.toutiao.com/s/JeR5G1m', 
        salary: '400-600/天',
        category: 'product'
    },
    { 
        company: '腾讯', 
        position: '产品运营实习生', 
        location: '深圳', 
        directLink: 'https://careers.tencent.com/search.html?query=%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86', 
        salary: '250-400/天',
        category: 'product'
    },
    { 
        company: '美团', 
        position: '产品经理实习生', 
        location: '北京', 
        directLink: 'https://campus.meituan.com/jobs?jobType=2&key=%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86', 
        salary: '300-500/天',
        category: 'product'
    },
    { 
        company: '小红书', 
        position: '产品经理实习生', 
        location: '上海', 
        directLink: 'https://job.xiaohongshu.com/search?keyword=%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86', 
        salary: '350-550/天',
        category: 'product'
    },
    { 
        company: '拼多多', 
        position: '产品管培生', 
        location: '上海', 
        directLink: 'https://www.pinduoduo.com/campus.html', 
        salary: '300-500/天',
        category: 'product'
    },
    // 前端开发类
    { 
        company: '腾讯', 
        position: '前端开发实习生', 
        location: '深圳', 
        directLink: 'https://careers.tencent.com/search.html?query=%E5%89%8D%E7%AB%AF%E5%AE%9E%E4%B9%A0', 
        salary: '200-400/天',
        category: 'frontend'
    },
    { 
        company: '阿里巴巴', 
        position: '前端开发实习生', 
        location: '杭州', 
        directLink: 'https://campus.alibaba.com/#/position?category=96&type=2', 
        salary: '300-500/天',
        category: 'frontend'
    },
    { 
        company: '网易', 
        position: '前端开发工程师', 
        location: '杭州', 
        directLink: 'https://campus.163.com/app/recruit/list?name=前端', 
        salary: '300-500/天',
        category: 'frontend'
    },
    { 
        company: '字节跳动', 
        position: '前端开发实习生', 
        location: '北京', 
        directLink: 'https://job.toutiao.com/s/JeR5G1m', 
        salary: '400-600/天',
        category: 'frontend'
    },
    { 
        company: '蚂蚁集团', 
        position: '前端开发实习生', 
        location: '杭州', 
        directLink: 'https://campus.alipay.com/', 
        salary: '350-550/天',
        category: 'frontend'
    },
    // 后端开发类
    { 
        company: '阿里巴巴', 
        position: '后端开发实习生', 
        location: '杭州', 
        directLink: 'https://campus.alibaba.com/#/position?category=96&type=2', 
        salary: '300-500/天',
        category: 'backend'
    },
    { 
        company: '字节跳动', 
        position: '后端开发实习生', 
        location: '北京/上海', 
        directLink: 'https://job.toutiao.com/s/JeR5G1m', 
        salary: '400-600/天',
        category: 'backend'
    },
    { 
        company: '腾讯', 
        position: '后台开发实习生', 
        location: '深圳', 
        directLink: 'https://careers.tencent.com/search.html?query=%E5%90%8E%E7%AB%AF%E5%BC%80%E5%8F%91', 
        salary: '250-450/天',
        category: 'backend'
    },
    { 
        company: '美团', 
        position: '后端开发实习生', 
        location: '北京', 
        directLink: 'https://campus.meituan.com/jobs?jobType=2&key=%E5%90%8E%E7%AB%AF%E5%BC%80%E5%8F%91', 
        salary: '250-400/天',
        category: 'backend'
    },
    { 
        company: '京东', 
        position: 'Java开发实习生', 
        location: '北京', 
        directLink: 'https://zhaopin.jd.com/web/job/job_list?job_category_id=1509&job_type=2', 
        salary: '200-400/天',
        category: 'backend'
    },
    // 运营类
    { 
        company: '美团', 
        position: '产品运营实习生', 
        location: '北京', 
        directLink: 'https://campus.meituan.com/jobs?jobType=2&key=%E8%BF%90%E8%90%A5', 
        salary: '200-300/天',
        category: 'operation'
    },
    { 
        company: '小红书', 
        position: '内容运营实习生', 
        location: '上海', 
        directLink: 'https://job.xiaohongshu.com/search?keyword=%E8%BF%90%E8%90%A5', 
        salary: '250-400/天',
        category: 'operation'
    },
    { 
        company: '哔哩哔哩', 
        position: '运营实习生', 
        location: '上海', 
        directLink: 'https://jobs.bilibili.com/', 
        salary: '200-350/天',
        category: 'operation'
    },
    { 
        company: '网易', 
        position: '游戏运营实习生', 
        location: '广州', 
        directLink: 'https://campus.163.com/app/recruit/list?name=运营', 
        salary: '250-400/天',
        category: 'operation'
    },
    { 
        company: '快手', 
        position: '用户运营实习生', 
        location: '北京', 
        directLink: 'https://zhaopin.kuaishou.cn/', 
        salary: '250-400/天',
        category: 'operation'
    },
    // UI设计类
    { 
        company: '京东', 
        position: 'UI设计实习生', 
        location: '北京', 
        directLink: 'https://zhaopin.jd.com/web/job/job_list?job_category_id=1509&job_type=2', 
        salary: '250-400/天',
        category: 'design'
    },
    { 
        company: '字节跳动', 
        position: 'UI设计师实习生', 
        location: '北京', 
        directLink: 'https://job.toutiao.com/s/JeR5G1m', 
        salary: '400-600/天',
        category: 'design'
    },
    { 
        company: '腾讯', 
        position: '视觉设计实习生', 
        location: '深圳', 
        directLink: 'https://careers.tencent.com/search.html?query=UI%E8%AE%BE%E8%AE%A1', 
        salary: '250-450/天',
        category: 'design'
    },
    { 
        company: '网易', 
        position: '交互设计实习生', 
        location: '杭州', 
        directLink: 'https://campus.163.com/app/recruit/list?name=设计', 
        salary: '300-500/天',
        category: 'design'
    },
    { 
        company: '阿里巴巴', 
        position: '体验设计实习生', 
        location: '杭州', 
        directLink: 'https://campus.alibaba.com/#/position?category=96&type=2', 
        salary: '350-550/天',
        category: 'design'
    }
];

// 学校数据库（常见高校，按层次分类）
const schoolDatabase = [
    // 清北复交浙（Top 5）
    { name: '清华大学', level: 'top2' },
    { name: '北京大学', level: 'top2' },
    { name: '复旦大学', level: 'top2' },
    { name: '上海交通大学', level: 'top2' },
    { name: '浙江大学', level: 'top2' },
    // C9联盟其他高校
    { name: '南京大学', level: 'c9' },
    { name: '中国科学技术大学', level: 'c9' },
    { name: '哈尔滨工业大学', level: 'c9' },
    { name: '西安交通大学', level: 'c9' },
    // 985工程高校
    { name: '中国人民大学', level: '985' },
    { name: '北京航空航天大学', level: '985' },
    { name: '北京理工大学', level: '985' },
    { name: '北京师范大学', level: '985' },
    { name: '南开大学', level: '985' },
    { name: '天津大学', level: '985' },
    { name: '大连理工大学', level: '985' },
    { name: '东北大学', level: '985' },
    { name: '吉林大学', level: '985' },
    { name: '同济大学', level: '985' },
    { name: '华东师范大学', level: '985' },
    { name: '东南大学', level: '985' },
    { name: '厦门大学', level: '985' },
    { name: '山东大学', level: '985' },
    { name: '武汉大学', level: '985' },
    { name: '华中科技大学', level: '985' },
    { name: '湖南大学', level: '985' },
    { name: '中南大学', level: '985' },
    { name: '中山大学', level: '985' },
    { name: '华南理工大学', level: '985' },
    { name: '四川大学', level: '985' },
    { name: '重庆大学', level: '985' },
    { name: '电子科技大学', level: '985' },
    { name: '西北工业大学', level: '985' },
    { name: '兰州大学', level: '985' },
    { name: '中国农业大学', level: '985' },
    { name: '北京协和医学院', level: '985' },
    { name: '国防科技大学', level: '985' },
    { name: '中央民族大学', level: '985' },
    { name: '华东师范大学', level: '985' },
    // 211工程高校
    { name: '北京交通大学', level: '211' },
    { name: '北京工业大学', level: '211' },
    { name: '北京科技大学', level: '211' },
    { name: '北京化工大学', level: '211' },
    { name: '北京邮电大学', level: '211' },
    { name: '北京林业大学', level: '211' },
    { name: '北京中医药大学', level: '211' },
    { name: '北京外国语大学', level: '211' },
    { name: '中国传媒大学', level: '211' },
    { name: '中央财经大学', level: '211' },
    { name: '对外经济贸易大学', level: '211' },
    { name: '上海外国语大学', level: '211' },
    { name: '上海财经大学', level: '211' },
    { name: '南京航空航天大学', level: '211' },
    { name: '南京理工大学', level: '211' },
    { name: '中国矿业大学', level: '211' },
    { name: '河海大学', level: '211' },
    { name: '江南大学', level: '211' },
    { name: '南京农业大学', level: '211' },
    { name: '武汉理工大学', level: '211' },
    { name: '华中农业大学', level: '211' },
    { name: '华中师范大学', level: '211' },
    { name: '中南财经政法大学', level: '211' },
    { name: '西南交通大学', level: '211' },
    { name: '西南大学', level: '211' },
    { name: '西安电子科技大学', level: '211' },
    { name: '长安大学', level: '211' },
    { name: '暨南大学', level: '211' },
    { name: '苏州大学', level: '211' },
    { name: '东北师范大学', level: '211' },
    { name: '东北林业大学', level: '211' },
    { name: '哈尔滨工程大学', level: '211' },
    { name: '安徽大学', level: '211' },
    { name: '福州大学', level: '211' },
    { name: '南昌大学', level: '211' },
    { name: '郑州大学', level: '211' },
    { name: '湖南师范大学', level: '211' },
    { name: '华南师范大学', level: '211' },
    { name: '广西大学', level: '211' },
    { name: '四川农业大学', level: '211' },
    { name: '贵州大学', level: '211' },
    { name: '云南大学', level: '211' },
    { name: '西北大学', level: '211' },
    { name: '新疆大学', level: '211' },
    { name: '宁夏大学', level: '211' },
    { name: '青海大学', level: '211' },
    { name: '海南大学', level: '211' },
    { name: '西藏大学', level: '211' },
    { name: '内蒙古大学', level: '211' },
    { name: '大连海事大学', level: '211' },
    // 双一流高校（非211）
    { name: '中国科学院大学', level: 'double-first' },
    { name: '中国社会科学院大学', level: 'double-first' },
    { name: '首都师范大学', level: 'double-first' },
    { name: '天津工业大学', level: 'double-first' },
    { name: '天津医科大学', level: 'double-first' },
    { name: '河北工业大学', level: 'double-first' },
    { name: '山西大学', level: 'double-first' },
    { name: '内蒙古大学', level: 'double-first' },
    { name: '辽宁大学', level: 'double-first' },
    { name: '大连海事大学', level: 'double-first' },
    { name: '延边大学', level: 'double-first' },
    { name: '东北农业大学', level: 'double-first' },
    { name: '上海海洋大学', level: 'double-first' },
    { name: '上海中医药大学', level: 'double-first' },
    { name: '上海体育学院', level: 'double-first' },
    { name: '上海音乐学院', level: 'double-first' },
    { name: '南京邮电大学', level: 'double-first' },
    { name: '南京林业大学', level: 'double-first' },
    { name: '南京信息工程大学', level: 'double-first' },
    { name: '南京中医药大学', level: 'double-first' },
    { name: '中国药科大学', level: 'double-first' },
    { name: '杭州电子科技大学', level: 'double-first' },
    { name: '浙江工业大学', level: 'double-first' },
    { name: '宁波大学', level: 'double-first' },
    { name: '安徽大学', level: 'double-first' },
    { name: '合肥工业大学', level: 'double-first' },
    { name: '福州大学', level: 'double-first' },
    { name: '南昌大学', level: 'double-first' },
    { name: '河南大学', level: 'double-first' },
    { name: '武汉科技大学', level: 'double-first' },
    { name: '湖北大学', level: 'double-first' },
    { name: '中南民族大学', level: 'double-first' },
    { name: '湘潭大学', level: 'double-first' },
    { name: '湖南农业大学', level: 'double-first' },
    { name: '广州中医药大学', level: 'double-first' },
    { name: '广东工业大学', level: 'double-first' },
    { name: '广州大学', level: 'double-first' },
    { name: '广西大学', level: 'double-first' },
    { name: '海南大学', level: 'double-first' },
    { name: '重庆邮电大学', level: 'double-first' },
    { name: '西南石油大学', level: 'double-first' },
    { name: '成都理工大学', level: 'double-first' },
    { name: '四川农业大学', level: 'double-first' },
    { name: '成都中医药大学', level: 'double-first' },
    { name: '西南财经大学', level: 'double-first' },
    { name: '贵州大学', level: 'double-first' },
    { name: '云南大学', level: 'double-first' },
    { name: '西藏大学', level: 'double-first' },
    { name: '西北大学', level: 'double-first' },
    { name: '西安建筑科技大学', level: 'double-first' },
    { name: '西安理工大学', level: 'double-first' },
    { name: '陕西科技大学', level: 'double-first' },
    { name: '兰州大学', level: 'double-first' },
    { name: '青海大学', level: 'double-first' },
    { name: '宁夏大学', level: 'double-first' },
    { name: '新疆大学', level: 'double-first' },
    { name: '石河子大学', level: 'double-first' },
    { name: '中国人民公安大学', level: 'double-first' },
    { name: '外交学院', level: 'double-first' },
    { name: '中国人民解放军国防大学', level: 'double-first' },
    // 省属重点本科（热门）
    { name: '深圳大学', level: 'key' },
    { name: '南方科技大学', level: 'key' },
    { name: '上海科技大学', level: 'key' },
    { name: '北京信息科技大学', level: 'key' },
    { name: '北京建筑大学', level: 'key' },
    { name: '北京第二外国语学院', level: 'key' },
    { name: '天津师范大学', level: 'key' },
    { name: '天津财经大学', level: 'key' },
    { name: '河北大学', level: 'key' },
    { name: '燕山大学', level: 'key' },
    { name: '山西大学', level: 'key' },
    { name: '中北大学', level: 'key' },
    { name: '辽宁大学', level: 'key' },
    { name: '沈阳工业大学', level: 'key' },
    { name: '大连交通大学', level: 'key' },
    { name: '吉林大学', level: 'key' },
    { name: '长春理工大学', level: 'key' },
    { name: '黑龙江大学', level: 'key' },
    { name: '哈尔滨理工大学', level: 'key' },
    { name: '上海大学', level: 'key' },
    { name: '上海理工大学', level: 'key' },
    { name: '上海师范大学', level: 'key' },
    { name: '华东政法大学', level: 'key' },
    { name: '江苏大学', level: 'key' },
    { name: '扬州大学', level: 'key' },
    { name: '南京工业大学', level: 'key' },
    { name: '南京师范大学', level: 'key' },
    { name: '浙江师范大学', level: 'key' },
    { name: '浙江理工大学', level: 'key' },
    { name: '安徽师范大学', level: 'key' },
    { name: '福建师范大学', level: 'key' },
    { name: '华侨大学', level: 'key' },
    { name: '江西师范大学', level: 'key' },
    { name: '江西财经大学', level: 'key' },
    { name: '山东师范大学', level: 'key' },
    { name: '山东科技大学', level: 'key' },
    { name: '青岛大学', level: 'key' },
    { name: '河南师范大学', level: 'key' },
    { name: '河南理工大学', level: 'key' },
    { name: '湖北大学', level: 'key' },
    { name: '武汉工程大学', level: 'key' },
    { name: '长沙理工大学', level: 'key' },
    { name: '湖南科技大学', level: 'key' },
    { name: '华南农业大学', level: 'key' },
    { name: '广东外语外贸大学', level: 'key' },
    { name: '广西师范大学', level: 'key' },
    { name: '重庆交通大学', level: 'key' },
    { name: '重庆师范大学', level: 'key' },
    { name: '西华大学', level: 'key' },
    { name: '四川师范大学', level: 'key' },
    { name: '贵州师范大学', level: 'key' },
    { name: '云南师范大学', level: 'key' },
    { name: '西安科技大学', level: 'key' },
    { name: '西安石油大学', level: 'key' },
    { name: '陕西师范大学', level: 'key' },
    { name: '兰州交通大学', level: 'key' },
    { name: '兰州理工大学', level: 'key' },
    { name: '新疆师范大学', level: 'key' },
    // 普通本科
    { name: '北京印刷学院', level: 'ordinary' },
    { name: '北京服装学院', level: 'ordinary' },
    { name: '北京石油化工学院', level: 'ordinary' },
    { name: '天津科技大学', level: 'ordinary' },
    { name: '天津理工大学', level: 'ordinary' },
    { name: '河北科技大学', level: 'ordinary' },
    { name: '河北经贸大学', level: 'ordinary' },
    { name: '太原科技大学', level: 'ordinary' },
    { name: '内蒙古工业大学', level: 'ordinary' },
    { name: '辽宁科技大学', level: 'ordinary' },
    { name: '辽宁石油化工大学', level: 'ordinary' },
    { name: '沈阳化工大学', level: 'ordinary' },
    { name: '吉林化工学院', level: 'ordinary' },
    { name: '黑龙江科技大学', level: 'ordinary' },
    { name: '上海应用技术大学', level: 'ordinary' },
    { name: '上海第二工业大学', level: 'ordinary' },
    { name: '江苏科技大学', level: 'ordinary' },
    { name: '常州大学', level: 'ordinary' },
    { name: '南通大学', level: 'ordinary' },
    { name: '盐城工学院', level: 'ordinary' },
    { name: '徐州工程学院', level: 'ordinary' },
    { name: '浙江海洋大学', level: 'ordinary' },
    { name: '浙江农林大学', level: 'ordinary' },
    { name: '温州大学', level: 'ordinary' },
    { name: '绍兴文理学院', level: 'ordinary' },
    { name: '安徽工业大学', level: 'ordinary' },
    { name: '安徽理工大学', level: 'ordinary' },
    { name: '安徽工程大学', level: 'ordinary' },
    { name: '福建农林大学', level: 'ordinary' },
    { name: '集美大学', level: 'ordinary' },
    { name: '东华理工大学', level: 'ordinary' },
    { name: '南昌航空大学', level: 'ordinary' },
    { name: '山东建筑大学', level: 'ordinary' },
    { name: '山东轻工业学院', level: 'ordinary' },
    { name: '青岛科技大学', level: 'ordinary' },
    { name: '郑州轻工业学院', level: 'ordinary' },
    { name: '河南工业大学', level: 'ordinary' },
    { name: '武汉纺织大学', level: 'ordinary' },
    { name: '湖北工业大学', level: 'ordinary' },
    { name: '湖南工业大学', level: 'ordinary' },
    { name: '五邑大学', level: 'ordinary' },
    { name: '广东石油化工学院', level: 'ordinary' },
    { name: '广西科技大学', level: 'ordinary' },
    { name: '重庆文理学院', level: 'ordinary' },
    { name: '重庆三峡学院', level: 'ordinary' },
    { name: '西南科技大学', level: 'ordinary' },
    { name: '西华师范大学', level: 'ordinary' },
    { name: '贵州民族大学', level: 'ordinary' },
    { name: '云南民族大学', level: 'ordinary' },
    { name: '西藏民族大学', level: 'ordinary' },
    { name: '延安大学', level: 'ordinary' },
    { name: '陕西理工大学', level: 'ordinary' },
    { name: '青海师范大学', level: 'ordinary' },
    { name: '宁夏师范学院', level: 'ordinary' },
    { name: '喀什大学', level: 'ordinary' },
    { name: '伊犁师范大学', level: 'ordinary' }
];

// 学习资源（真实链接）
const learningResources = {
    '产品经理': [
        { title: '人人都是产品经理', url: 'https://www.woshipm.com/' },
        { title: '产品经理社区', url: 'https://www.pmcaff.com/' },
        { title: 'Axure中文网', url: 'https://www.axure.com.cn/' }
    ],
    '前端开发工程师': [
        { title: 'MDN Web文档', url: 'https://developer.mozilla.org/zh-CN/' },
        { title: 'Vue3官方文档', url: 'https://cn.vuejs.org/' },
        { title: 'React官方文档', url: 'https://react.dev/' }
    ],
    '后端开发工程师': [
        { title: 'MySQL教程', url: 'https://www.runoob.com/mysql/mysql-tutorial.html' },
        { title: 'Redis中文文档', url: 'https://www.redis.cn/' },
        { title: 'Docker入门', url: 'https://www.runoob.com/docker/docker-tutorial.html' }
    ],
    '运营专员': [
        { title: '运营派', url: 'https://www.yunyingpai.com/' },
        { title: '姑婆那些事儿', url: 'https://www.gupowang.com/' },
        { title: '鸟哥笔记', url: 'https://www.niaogebiji.com/' }
    ],
    'UI设计师': [
        { title: 'Figma官方教程', url: 'https://www.figma.com/resources/learn-design/' },
        { title: 'UI中国', url: 'https://www.ui.cn/' },
        { title: 'Dribbble', url: 'https://dribbble.com/' }
    ]
};

// 全局变量
let skillChart = null;
let applications = JSON.parse(localStorage.getItem('applications')) || [];
let currentEducationLevel = '';

// 页面导航
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    window.scrollTo(0, 0);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定导航栏点击事件
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            navigateTo(pageId);
        });
    });
    
    // 绑定简历上传事件
    const uploadArea = document.getElementById('upload-area');
    const resumeFile = document.getElementById('resume-file');
    
    if (uploadArea && resumeFile) {
        uploadArea.addEventListener('click', function() {
            resumeFile.click();
        });
        
        resumeFile.addEventListener('change', function(e) {
            handleFileUpload(e.target.files[0]);
        });
        
        // 拖拽上传
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
            uploadArea.style.background = 'var(--bg-light)';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'transparent';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.background = 'transparent';
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }
    
    loadApplications();
    renderHotJobs();
    loadLearningProgress();
});

// 更新技能复选框
function updateSkillCheckboxes() {
    const targetPosition = document.getElementById('target-position').value;
    const container = document.getElementById('skill-checkboxes');
    container.innerHTML = '';
    
    if (!targetPosition) return;
    
    const positionData = positionSkills[targetPosition];
    positionData.skills.forEach((skill, index) => {
        const weightClass = skill.weight >= 0.9 ? 'weight-high' : (skill.weight >= 0.75 ? 'weight-medium' : 'weight-low');
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <div class="skill-checkbox-row">
                <label class="checkbox-label">
                    <input type="checkbox" class="skill-checkbox" value="${skill.name}" data-weight="${skill.weight}">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-weight-badge ${weightClass}">${skill.level} ${(skill.weight * 100).toFixed(0)}%</span>
                </label>
                <button class="btn btn-small" onclick="toggleSkillDetails(${index})">详情</button>
            </div>
            <div class="skill-details" id="details-${index}" style="display: none;">
                <p class="skill-desc">${skill.description}</p>
                <div class="skill-self-rating">
                    <label>自评掌握程度：</label>
                    <div class="rating-slider">
                        <input type="range" min="0" max="100" value="50" class="skill-rating-input" id="rating-${index}" oninput="updateRatingDisplay(${index})">
                        <span class="rating-value" id="rating-value-${index}">50%</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(skillItem);
    });
}

function toggleSkillDetails(index) {
    const details = document.getElementById(`details-${index}`);
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

function updateRatingDisplay(index) {
    const value = document.getElementById(`rating-${index}`).value;
    document.getElementById(`rating-value-${index}`).textContent = value + '%';
}

// 生成技能报告
function generateSkillReport() {
    const targetPosition = document.getElementById('target-position').value;
    if (!targetPosition) {
        alert('请先选择目标岗位');
        return;
    }
    
    const positionData = positionSkills[targetPosition];
    const selectedSkills = [];
    const allCheckboxes = document.querySelectorAll('.skill-checkbox');
    
    allCheckboxes.forEach((cb, skillIndex) => {
        const ratingValue = document.getElementById(`rating-${skillIndex}`).value;
        if (cb.checked || ratingValue > 0) {
            selectedSkills.push({
                name: cb.value,
                score: cb.checked ? ratingValue : '0',
                weight: parseFloat(cb.dataset.weight)
            });
        }
    });
    
    if (selectedSkills.length === 0) {
        alert('请至少选择一项技能或调整自评分数');
        return;
    }
    
    // 计算加权得分
    const totalWeight = positionData.skills.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = positionData.skills.reduce((sum, s) => {
        const userSkill = selectedSkills.find(ss => ss.name === s.name);
        const score = userSkill ? parseFloat(userSkill.score) : 0;
        return sum + (score * s.weight);
    }, 0);
    const score = Math.round(weightedScore / totalWeight);
    
    document.getElementById('skill-score').textContent = score;
    
    // 绘制雷达图
    drawRadarChart(positionData.skills, selectedSkills);
    
    // 生成详细分析
    generateDetailedAnalysis(positionData, selectedSkills, score);
    
    document.getElementById('skill-report').style.display = 'block';
}

// 绘制雷达图
function drawRadarChart(allSkills, selectedSkills) {
    const ctx = document.getElementById('skillRadarChart').getContext('2d');
    
    if (skillChart) {
        skillChart.destroy();
    }
    
    const labels = allSkills.map(s => s.name);
    
    // 用户技能数据（未勾选的也显示为0，保证完整的多边形）
    const userScoreData = allSkills.map(s => {
        const selected = selectedSkills.find(ss => ss.name === s.name);
        return selected ? parseFloat(selected.score) : 0;
    });
    
    // 岗位重要性数据（权重 * 100）
    const importanceData = allSkills.map(s => s.weight * 100);
    
    const gradient1 = ctx.createRadialGradient(150, 150, 0, 150, 150, 150);
    gradient1.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    gradient1.addColorStop(0.5, 'rgba(99, 102, 241, 0.3)');
    gradient1.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
    
    const gradient2 = ctx.createRadialGradient(150, 150, 0, 150, 150, 150);
    gradient2.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradient2.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
    gradient2.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
    
    skillChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '你的技能水平',
                    data: userScoreData,
                    backgroundColor: gradient1,
                    borderColor: '#6366f1',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2.5,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#4f46e5',
                    tension: 0,
                    fill: true
                },
                {
                    label: '岗位重要程度',
                    data: importanceData,
                    backgroundColor: gradient2,
                    borderColor: '#10b981',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2.5,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#059669',
                    tension: 0,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    circular: true,
                    ticks: {
                        stepSize: 20,
                        font: { size: 11, weight: '500' },
                        color: '#94a3b8',
                        backdropColor: 'transparent',
                        z: 10
                    },
                    pointLabels: {
                        font: { size: 13, weight: '600', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' },
                        color: '#1e293b',
                        padding: 18
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.25)',
                        lineWidth: 1,
                        circular: true
                    },
                    angleLines: {
                        color: 'rgba(148, 163, 184, 0.18)',
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 25,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 13, weight: '500' },
                        color: '#475569',
                        boxWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 13 },
                    padding: 14,
                    cornerRadius: 10,
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    callbacks: {
                        label: function(context) {
                            return '  ' + context.dataset.label + ': ' + context.raw.toFixed(0) + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            elements: {
                line: {
                    borderJoinStyle: 'round'
                }
            }
        }
    });
}

// 生成详细分析
function generateDetailedAnalysis(positionData, selectedSkills, overallScore) {
    const container = document.getElementById('skill-analysis-content');
    let html = '';
    
    // 用户画像
    html += '<div class="analysis-card">';
    html += '<h5>👤 用户画像分析</h5>';
    html += '<p>你的目标岗位是 <strong>' + positionData.name + '</strong>。';
    
    if (overallScore >= 85) {
        html += '目前技能水平优秀，具备很强的竞争力，属于第一梯队候选人。建议保持优势，在细分领域深入发展。</p>';
    } else if (overallScore >= 70) {
        html += '目前处于中上水平，核心技能掌握较好，但部分技能还有提升空间。建议重点强化薄弱的核心技能。</p>';
    } else if (overallScore >= 55) {
        html += '目前处于中等水平，有一定基础但核心技能还需加强。建议制定2-3个月的系统学习计划。</p>';
    } else if (overallScore >= 40) {
        html += '目前处于入门到进阶阶段，基础还不扎实。建议从核心基础技能开始，系统学习并结合项目实践。</p>';
    } else {
        html += '目前基础较为薄弱，建议从最基础的核心技能开始入门，先建立完整的知识体系。</p>';
    }
    html += '</div>';
    
    // 核心技能差距分析
    html += '<div class="analysis-card">';
    html += '<h5>📊 技能差距分析（按重要程度排序）</h5>';
    
    // 按权重排序所有技能
    const sortedSkills = [...positionData.skills].sort((a, b) => b.weight - a.weight);
    
    sortedSkills.forEach(skill => {
        const userSkill = selectedSkills.find(ss => ss.name === skill.name);
        const userScore = userSkill ? parseFloat(userSkill.score) : 0;
        const targetScore = skill.weight * 100;
        const gap = Math.round(targetScore - userScore);
        const gapClass = gap > 30 ? 'gap-high' : (gap > 15 ? 'gap-medium' : 'gap-low');
        const gapText = gap <= 0 ? '已达标' : '差' + gap + '%';
        
        html += '<div class="skill-gap-item">';
        html += '<div class="skill-gap-header">';
        html += '<span class="skill-gap-name">' + skill.name + ' <span class="skill-level-tag">' + skill.level + '</span></span>';
        html += '<span class="skill-gap-score">当前: ' + userScore + '% | 目标: ' + targetScore.toFixed(0) + '%</span>';
        html += '</div>';
        html += '<div class="skill-gap-bar">';
        html += '<div class="skill-gap-fill ' + gapClass + '" style="width: ' + userScore + '%"></div>';
        html += '<div class="skill-gap-target" style="left: ' + targetScore + '%"></div>';
        html += '</div>';
        html += '<p class="skill-gap-tip"><strong>建议：</strong>' + skill.learningSuggestion + '</p>';
        html += '</div>';
    });
    html += '</div>';
    
    // 学习路径建议
    html += '<div class="analysis-card">';
    html += '<h5>🎯 推荐学习路线</h5>';
    html += '<p class="learning-path-intro">根据你的画像，建议按以下优先级学习（核心技能优先）：</p>';
    html += '<ol class="learning-steps">';
    
    const highPrioritySkills = sortedSkills.filter(s => s.weight >= 0.85);
    highPrioritySkills.forEach((skill, idx) => {
        html += '<li><strong>第' + (idx + 1) + '阶段：' + skill.name + '</strong><br>';
        html += '<span class="step-desc">' + skill.learningSuggestion + '</span></li>';
    });
    
    html += '</ol>';
    html += '</div>';
    
    container.innerHTML = html;
}

// 学校搜索功能
function searchSchools() {
    const input = document.getElementById('school-search').value.toLowerCase();
    const suggestionsDiv = document.getElementById('school-suggestions');
    
    if (!input) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    const matches = schoolDatabase.filter(s => s.name.toLowerCase().includes(input)).slice(0, 10);
    
    if (matches.length > 0) {
        const levelMap = {
            'top2': 'Top5名校',
            'c9': 'C9联盟',
            '985': '985高校',
            '211': '211高校',
            'double-first': '双一流',
            'key': '省重点',
            'ordinary': '普通本科'
        };
        suggestionsDiv.innerHTML = matches.map(school => 
            '<div class="school-suggestion-item" onclick="selectSchool(\'' + school.name + '\', \'' + school.level + '\')">' +
            '<span class="school-name">' + school.name + '</span>' +
            '<span class="school-level-badge ' + school.level + '">' + (levelMap[school.level] || '') + '</span>' +
            '</div>'
        ).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.innerHTML = '<div class="school-suggestion-item no-match">未找到匹配学校，可在下方学校层次选择</div>';
        suggestionsDiv.style.display = 'block';
    }
}

function selectSchool(schoolName, level) {
    document.getElementById('school-search').value = schoolName;
    document.getElementById('school-suggestions').style.display = 'none';
    
    if (level) {
        document.getElementById('education-level').value = level;
        currentEducationLevel = level;
    }
}

// 简历分析
function analyzeResume() {
    const targetPosition = document.getElementById('target-position-resume').value;
    const degreeLevel = document.getElementById('degree-level').value;
    const educationLevel = document.getElementById('education-level').value;
    const companySize = document.getElementById('target-company-size').value;
    const resumeText = document.getElementById('resume-text').value;
    const schoolName = document.getElementById('school-search').value;
    
    if (!targetPosition || !degreeLevel || !educationLevel) {
        alert('请填写目标岗位、学历和学校层次');
        return;
    }
    
    const suggestions = [];
    let score = 50;
    
    // 学历加分
    const degreeMap = {
        'phd': { score: 20, text: '博士研究生学历具有极强的竞争力，尤其是科研岗和算法岗，建议突出科研成果和论文发表' },
        'master': { score: 15, text: '硕士研究生学历在求职竞争中具有明显优势，尤其是大厂和研发岗' },
        'bachelor': { score: 8, text: '本科学历满足大部分岗位的基本门槛要求，建议重点突出实习和项目经历' },
        'college': { score: 3, text: '专科学历建议重点突出实操技能和项目经验，降低学历影响' },
        'highschool': { score: 0, text: '高中及以下学历，建议通过职业技能培训和项目经验积累来提升竞争力' }
    };
    
    const degreeInfo = degreeMap[degreeLevel] || degreeMap['bachelor'];
    score += degreeInfo.score;
    suggestions.push({ type: degreeInfo.score >= 15 ? 'positive' : 'suggestion', text: degreeInfo.text });
    
    // 学校层次加分
    const schoolLabel = schoolName || '该校';
    const educationLevelMap = {
        'top2': { score: 20, label: 'Top5名校', type: 'positive', text: '顶尖名校（' + schoolLabel + '）背景极具竞争力，简历筛选通过率极高' },
        'c9': { score: 18, label: 'C9联盟', type: 'positive', text: 'C9联盟高校（' + schoolLabel + '）背景非常有竞争力，深受大厂青睐' },
        '985': { score: 15, label: '985高校', type: 'positive', text: '985工程院校（' + schoolLabel + '）背景为简历加分不少，校招资源丰富' },
        '211': { score: 10, label: '211高校', type: 'positive', text: '211工程院校（' + schoolLabel + '）背景具备较强竞争力，建议突出实习经历' },
        'double-first': { score: 8, label: '双一流', type: 'positive', text: '双一流高校（' + schoolLabel + '）背景良好，建议重点展示专业能力' },
        'key': { score: 5, label: '省重点', type: 'suggestion', text: '省属重点院校（' + schoolLabel + '），建议通过丰富的项目经历和实习经验提升竞争力' },
        'ordinary': { score: 3, label: '普通本科', type: 'suggestion', text: '普通本科背景，建议通过丰富项目经历和实习经验来弥补学校差距' },
        'vocational': { score: 0, label: '专科/高职', type: 'suggestion', text: '专科背景，建议重点突出实操技能和项目经验，降低学历影响' }
    };
    
    const levelInfo = educationLevelMap[educationLevel] || educationLevelMap['ordinary'];
    score += levelInfo.score;
    suggestions.push({ type: levelInfo.type, text: levelInfo.text });
    
    // 公司类型要求
    if (companySize === 'big-tech') {
        score -= 8;
        suggestions.push({ type: 'suggestion', text: '互联网大厂竞争激烈，建议重点展示：1）量化的项目成果数据；2）技术/业务深度；3）知名实习经历' });
    } else if (companySize === 'foreign') {
        score -= 5;
        suggestions.push({ type: 'suggestion', text: '外企注重英文能力和跨文化沟通，建议提前准备英文简历和面试' });
    } else if (companySize === 'startup') {
        score += 3;
        suggestions.push({ type: 'positive', text: '初创公司更看重实战能力和快速学习，你的技能栈很重要' });
    } else if (companySize === 'state') {
        score += 2;
        suggestions.push({ type: 'suggestion', text: '国企/央企重视学历和政治面貌，建议完善相关信息' });
    }
    
    // 内容丰富度
    if (resumeText.length > 500) {
        score += 12;
        suggestions.push({ type: 'positive', text: '简历内容充实，信息量充足' });
    } else if (resumeText.length > 200) {
        score += 6;
        suggestions.push({ type: 'suggestion', text: '简历内容尚可，建议补充更多项目细节和量化成果' });
    } else if (resumeText.length > 0) {
        suggestions.push({ type: 'warning', text: '简历内容偏少，建议详细展开项目经历，用STAR法则描述' });
    } else {
        suggestions.push({ type: 'warning', text: '未检测到简历内容，以上为基于你背景的通用建议' });
    }
    
    // 关键词匹配
    if (resumeText.length > 0) {
        const keywords = positionSkills[targetPosition].skills.map(s => s.name);
        let matchedKeywords = 0;
        keywords.forEach(kw => {
            if (resumeText.includes(kw)) {
                matchedKeywords++;
            }
        });
        
        if (matchedKeywords >= 5) {
            score += 10;
            suggestions.push({ type: 'positive', text: '简历中包含多个目标岗位核心技能关键词，ATS通过率高' });
        } else if (matchedKeywords >= 3) {
            score += 5;
            suggestions.push({ type: 'suggestion', text: '简历中有部分岗位关键词，建议增加更多核心技能描述' });
        } else {
            suggestions.push({ type: 'warning', text: '简历中目标岗位关键词较少，建议融入相关技能描述' });
        }
    }
    
    score = Math.min(100, Math.max(0, Math.round(score)));
    
    // 渲染建议
    const listContainer = document.getElementById('suggestions-list');
    listContainer.innerHTML = suggestions.map(s => {
        const icon = s.type === 'positive' ? '✅' : (s.type === 'warning' ? '⚠️' : '💡');
        return '<div class="suggestion-item ' + s.type + '">' + icon + ' ' + s.text + '</div>';
    }).join('');
    
    document.getElementById('resume-score-value').textContent = score;
    document.getElementById('resume-suggestions').style.display = 'block';
}

// 渲染热门岗位
function renderHotJobs() {
    const container = document.getElementById('hot-jobs-grid');
    if (!container) return;
    
    const shuffled = [...hotJobs].sort(() => Math.random() - 0.5);
    const displayJobs = shuffled.slice(0, 6);
    
    container.innerHTML = displayJobs.map(job => `
        <div class="hot-job-card">
            <div class="hot-job-header">
                <span class="hot-job-company">${job.company}</span>
                <span class="hot-job-salary">${job.salary}</span>
            </div>
            <div class="hot-job-position">${job.position}</div>
            <div class="hot-job-location">📍 ${job.location}</div>
            <div class="hot-job-actions">
                <a href="${job.directLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary hot-job-btn" onclick="copyJobInfo('${job.company}', '${job.position}')">直达投递 →</a>
                <button class="btn btn-small btn-secondary hot-job-copy-btn" onclick="copyJobInfo('${job.company}', '${job.position}')" title="复制岗位信息">📋 复制</button>
            </div>
        </div>
    `).join('');
}

// 复制岗位信息
function copyJobInfo(company, position) {
    const text = `${company} - ${position}`;
    navigator.clipboard.writeText(text).then(() => {
        // 显示复制成功提示
        showToast('岗位信息已复制，可粘贴到招聘平台搜索');
    }).catch(() => {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('岗位信息已复制，可粘贴到招聘平台搜索');
    });
}

// 显示提示消息
function showToast(message) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10000; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastFadeIn 0.3s ease;';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function refreshHotJobs() {
    const container = document.getElementById('hot-jobs-grid');
    container.style.opacity = '0.5';
    setTimeout(() => {
        renderHotJobs();
        container.style.opacity = '1';
    }, 300);
}

// 加载投递记录
function loadApplications() {
    applications = JSON.parse(localStorage.getItem('applications')) || [];
    renderApplications();
    updateApplicationSummary();
}

// 保存投递记录
function saveApplication() {
    const company = document.getElementById('company-name').value;
    const position = document.getElementById('position-name').value;
    const salary = document.getElementById('salary-info').value;
    const date = document.getElementById('application-date').value;
    const status = document.getElementById('application-status').value;
    const notes = document.getElementById('application-notes').value;
    
    if (!company || !position) {
        alert('请填写公司名称和岗位名称');
        return;
    }
    
    applications.push({
        id: Date.now(),
        company,
        position,
        salary: salary || '面议',
        date: date || new Date().toISOString().split('T')[0],
        status,
        notes
    });
    
    localStorage.setItem('applications', JSON.stringify(applications));
    closeModal();
    loadApplications();
}

// 删除投递记录
function deleteApplication(id) {
    if (confirm('确定删除这条投递记录？')) {
        applications = applications.filter(app => app.id !== id);
        localStorage.setItem('applications', JSON.stringify(applications));
        loadApplications();
    }
}

// 筛选投递记录
function filterApplications() {
    renderApplications();
}

// 渲染投递记录
function renderApplications() {
    const filter = document.getElementById('status-filter').value;
    const container = document.getElementById('application-list');
    
    const filtered = filter === 'all' ? applications : applications.filter(app => app.status === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无投递记录，点击上方按钮添加或从热门岗位中投递</p>';
        return;
    }
    
    const statusMap = {
        'submitted': { text: '已投递', class: 'status-submitted' },
        'interview': { text: '面试中', class: 'status-interview' },
        'offer': { text: '已录取', class: 'status-offer' },
        'rejected': { text: '未通过', class: 'status-rejected' }
    };
    
    container.innerHTML = `
        <div class="application-table-container">
            <table class="application-table">
                <thead>
                    <tr>
                        <th>公司</th>
                        <th>岗位</th>
                        <th>薪资</th>
                        <th>投递日期</th>
                        <th>状态</th>
                        <th>备注</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(app => `
                        <tr>
                            <td><strong>${app.company}</strong></td>
                            <td>${app.position}</td>
                            <td>${app.salary || '-'}</td>
                            <td>${app.date}</td>
                            <td><span class="status-badge ${statusMap[app.status].class}">${statusMap[app.status].text}</span></td>
                            <td class="notes-cell">${app.notes || '-'}</td>
                            <td><button class="btn btn-small btn-danger" onclick="deleteApplication(${app.id})">删除</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 更新投递汇总
function updateApplicationSummary() {
    document.getElementById('total-applications').textContent = applications.length;
    document.getElementById('interview-count').textContent = applications.filter(a => a.status === 'interview').length;
    document.getElementById('offer-count').textContent = applications.filter(a => a.status === 'offer').length;
    document.getElementById('rejected-count').textContent = applications.filter(a => a.status === 'rejected').length;
}

// 打开添加弹窗
function openAddApplicationModal() {
    document.getElementById('add-application-modal').style.display = 'flex';
    document.getElementById('company-name').value = '';
    document.getElementById('position-name').value = '';
    document.getElementById('salary-info').value = '';
    document.getElementById('application-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('application-status').value = 'submitted';
    document.getElementById('application-notes').value = '';
}

// 关闭弹窗
function closeModal() {
    document.getElementById('add-application-modal').style.display = 'none';
}

// 生成学习路径
function generateLearningPath() {
    const target = document.getElementById('learning-target').value;
    const currentLevel = document.getElementById('current-level').value;
    const duration = document.getElementById('learning-duration').value;
    
    if (!target) {
        alert('请选择学习目标');
        return;
    }
    
    const durationMap = { '1month': 1, '3months': 3, '6months': 6, '1year': 12 };
    const months = durationMap[duration];
    const steps = generateStepsForTarget(target, currentLevel, months);
    
    // 加载已保存的进度
    const key = 'learning_' + target;
    const savedProgress = JSON.parse(localStorage.getItem(key)) || {};
    Object.keys(savedProgress).forEach(i => {
        if (savedProgress[i] && steps[parseInt(i)]) {
            steps[parseInt(i)].completed = true;
        }
    });
    
    renderLearningPath(steps, target);
    document.getElementById('learning-path-result').style.display = 'block';
}

// 生成学习步骤
function generateStepsForTarget(target, currentLevel, months) {
    const baseSteps = {
        'product-manager': [
            { title: '产品基础认知', hours: 25, resources: ['人人都是产品经理', '产品思维入门'], completed: false },
            { title: '需求分析与用户研究', hours: 35, resources: ['用户调研方法论', '需求文档模板'], completed: false },
            { title: '原型设计工具精通', hours: 30, resources: ['Figma官方教程', 'Axure实战案例'], completed: false },
            { title: '数据分析与SQL', hours: 40, resources: ['SQL基础入门', 'Excel数据透视表'], completed: false },
            { title: '项目实战与作品集', hours: 50, resources: ['完整项目复盘', '作品集包装'], completed: false }
        ],
        'frontend-developer': [
            { title: 'HTML/CSS基础精通', hours: 30, resources: ['MDN Web文档', 'CSS布局实战'], completed: false },
            { title: 'JavaScript核心进阶', hours: 45, resources: ['ES6+新特性', 'JS设计模式'], completed: false },
            { title: '主流框架Vue/React', hours: 50, resources: ['Vue3组合式API', 'React Hooks'], completed: false },
            { title: '工程化与TypeScript', hours: 35, resources: ['Vite构建工具', 'TypeScript入门'], completed: false },
            { title: '综合项目实战', hours: 60, resources: ['完整项目开发', '部署上线优化'], completed: false }
        ],
        'backend-developer': [
            { title: '编程语言核心', hours: 50, resources: ['Java/Go核心', '数据结构算法'], completed: false },
            { title: '数据库与缓存', hours: 40, resources: ['MySQL索引优化', 'Redis五种结构'], completed: false },
            { title: '微服务与框架', hours: 45, resources: ['Spring Cloud', 'Docker容器化'], completed: false },
            { title: 'API设计与安全', hours: 30, resources: ['RESTful规范', 'JWT认证'], completed: false },
            { title: '项目实战与性能调优', hours: 60, resources: ['高并发架构', '数据库调优'], completed: false }
        ],
        'operation': [
            { title: '运营思维与基础', hours: 25, resources: ['运营派专栏', 'AARRR模型'], completed: false },
            { title: '内容与用户运营', hours: 40, resources: ['内容选题方法', '用户分层运营'], completed: false },
            { title: '数据分析能力', hours: 35, resources: ['Excel高级函数', '数据可视化'], completed: false },
            { title: '活动策划执行', hours: 30, resources: ['活动SOP流程', '复盘方法论'], completed: false },
            { title: '求职作品集', hours: 25, resources: ['案例整理', '数据报告输出'], completed: false }
        ],
        'ui-designer': [
            { title: '设计基础理论', hours: 30, resources: ['色彩搭配原理', '版式设计基础'], completed: false },
            { title: 'Figma工具精通', hours: 40, resources: ['Figma官方教程', '组件库搭建'], completed: false },
            { title: '交互设计原则', hours: 35, resources: ['iOS HIG', 'Material Design'], completed: false },
            { title: '视觉设计提升', hours: 45, resources: ['插画风格', '品牌设计'], completed: false },
            { title: '作品集打造', hours: 40, resources: ['项目包装', '设计叙事'], completed: false }
        ]
    };
    
    return baseSteps[target] || [];
}

// 渲染学习路径
function renderLearningPath(steps, target) {
    const totalHours = steps.reduce((sum, s) => sum + s.hours, 0);
    const completedSteps = steps.filter(s => s.completed);
    const completedHours = completedSteps.reduce((sum, s) => sum + s.hours, 0);
    const progress = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;
    
    document.getElementById('completed-count').textContent = completedSteps.length;
    document.getElementById('total-count').textContent = steps.length;
    document.getElementById('completed-hours').textContent = completedHours;
    document.getElementById('total-hours').textContent = totalHours;
    document.getElementById('progress-fill').style.width = progress + '%';
    
    // 渲染流程图
    renderRoadmapSVG(steps);
    
    // 渲染时间线
    const timeline = document.getElementById('path-timeline');
    const resources = learningResources[positionSkills[target]?.name || target] || [];
    
    let timelineHTML = '';
    steps.forEach((step, index) => {
        const stepResources = resources.slice(0, 3);
        timelineHTML += `
            <div class="timeline-item ${step.completed ? 'completed' : ''}">
                <div class="timeline-marker">${index + 1}</div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4>${step.title}</h4>
                        <span class="timeline-hours">⏱️ ${step.hours} 小时</span>
                    </div>
                    <div class="timeline-resources">
                        <p class="resources-label">📚 推荐学习资源：</p>
                        <ul class="resource-list">
                            ${stepResources.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title}</a></li>`).join('')}
                        </ul>
                    </div>
                    <button class="btn btn-small ${step.completed ? 'btn-secondary' : 'btn-primary'}" onclick="toggleStepCompletion(${index}, '${target}')">
                        ${step.completed ? '✓ 已完成' : '标记完成'}
                    </button>
                </div>
            </div>
        `;
    });
    timeline.innerHTML = timelineHTML;
}

// 渲染流程图SVG
function renderRoadmapSVG(steps) {
    const container = document.getElementById('roadmap-svg');
    const stepCount = steps.length;
    const width = Math.max(700, stepCount * 170);
    const height = 140;
    
    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="roadmap-svg" preserveAspectRatio="xMidYMid meet">`;
    
    // 箭头定义
    svg += `<defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8"/>
        </marker>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#10b981"/>
            <stop offset="100%" style="stop-color:#34d399"/>
        </linearGradient>
    </defs>`;
    
    // 主连接线
    const startX = 70;
    const endX = width - 70;
    const lineY = 70;
    svg += `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>`;
    
    // 节点
    const stepSpacing = (endX - startX) / (stepCount - 1 || 1);
    
    steps.forEach((step, index) => {
        const x = startX + index * stepSpacing;
        const y = lineY;
        const radius = step.completed ? 24 : 22;
        const fillColor = step.completed ? 'url(#progressGrad)' : '#6366f1';
        const strokeColor = step.completed ? '#059669' : '#4f46e5';
        
        svg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fillColor}" stroke="#fff" stroke-width="4" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"/>`;
        
        if (step.completed) {
            svg += `<path d="M${x - 8},${y} L${x - 2},${y + 6} L${x + 10},${y - 6}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
            svg += `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">${index + 1}</text>`;
        }
        
        svg += `<text x="${x}" y="${y + 48}" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="500">${step.title.substring(0, 6)}${step.title.length > 6 ? '...' : ''}</text>`;
        svg += `<text x="${x}" y="${y + 65}" text-anchor="middle" fill="#64748b" font-size="11">${step.hours}h</text>`;
        
        if (index < steps.length - 1) {
            const nextX = startX + (index + 1) * stepSpacing;
            const lineStartX = x + radius + 5;
            const lineEndX = nextX - radius - 15;
            if (step.completed && steps[index + 1].completed) {
                svg += `<line x1="${lineStartX}" y1="${y}" x2="${lineEndX}" y2="${y}" stroke="url(#progressGrad)" stroke-width="4" marker-end="url(#arrowhead)"/>`;
            } else {
                svg += `<line x1="${lineStartX}" y1="${y}" x2="${lineEndX}" y2="${y}" stroke="#94a3b8" stroke-width="3" marker-end="url(#arrowhead)" stroke-dasharray="${step.completed ? '0' : '5,5'}"/>`;
            }
        }
    });
    
    svg += '</svg>';
    container.innerHTML = svg;
}

// 切换步骤完成状态
function toggleStepCompletion(index, target) {
    const key = 'learning_' + target;
    let progress = JSON.parse(localStorage.getItem(key)) || {};
    
    progress[index] = !progress[index];
    localStorage.setItem(key, JSON.stringify(progress));
    
    const steps = generateStepsForTarget(target, 'beginner', 6);
    Object.keys(progress).forEach(i => {
        if (progress[i] && steps[parseInt(i)]) {
            steps[parseInt(i)].completed = true;
        }
    });
    
    renderLearningPath(steps, target);
}

// 加载学习进度
function loadLearningProgress() {
    // 预留：可以在页面加载时恢复学习进度
}

// 文件上传处理
function handleFileUpload(file) {
    if (!file) return;
    
    document.getElementById('uploaded-file-name').textContent = file.name;
    document.getElementById('uploaded-file-info').style.display = 'flex';
    document.getElementById('upload-area').style.display = 'none';
    
    const reader = new FileReader();
    
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.onload = function(e) {
            const text = e.target.result;
            document.getElementById('resume-text').value = text;
            smartParseResume(text);
        };
        reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        document.getElementById('resume-text').value = '【PDF简历已上传】\n\n由于纯前端限制，无法直接解析PDF内容。\n\n建议：\n1. 请手动复制简历内容粘贴到下方文本框\n2. 或在上方手动填写你的学历、学校等信息\n3. 填写完成后点击"开始分析"获取优化建议\n\n文件名：' + file.name + '\n文件大小：' + (file.size / 1024).toFixed(1) + ' KB';
    } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        document.getElementById('resume-text').value = '【Word简历已上传】\n\n由于纯前端限制，无法直接解析Word文档内容。\n\n建议：\n1. 请手动复制简历内容粘贴到下方文本框\n2. 或在上方手动填写你的学历、学校等信息\n3. 填写完成后点击"开始分析"获取优化建议\n\n文件名：' + file.name + '\n文件大小：' + (file.size / 1024).toFixed(1) + ' KB';
    } else {
        document.getElementById('resume-text').value = '【简历文件已上传】\n文件名：' + file.name + '\n\n请手动粘贴简历内容到此处，或填写上方表单信息后点击"开始分析"。';
    }
}

function removeFile() {
    document.getElementById('resume-file').value = '';
    document.getElementById('uploaded-file-info').style.display = 'none';
    document.getElementById('upload-area').style.display = 'flex';
    document.getElementById('resume-text').value = '';
}

// 智能解析简历内容
function smartParseResume(text) {
    if (!text) return;
    
    // 解析学历
    const degreePatterns = [
        { pattern: /博士|博士生|博士研究生|PhD|Ph\.D|doctor/i, value: 'phd' },
        { pattern: /硕士|硕士生|硕士研究生|研究生|Masters|Master/i, value: 'master' },
        { pattern: /本科|学士|学士学位|Bachelor|本科毕业/i, value: 'bachelor' },
        { pattern: /专科|大专|高职|专科毕业|College/i, value: 'college' }
    ];
    
    for (const deg of degreePatterns) {
        if (deg.pattern.test(text)) {
            document.getElementById('degree-level').value = deg.value;
            break;
        }
    }
    
    // 解析学校
    const schoolMatches = [];
    for (const school of schoolDatabase) {
        if (text.includes(school.name)) {
            schoolMatches.push(school);
        }
    }
    
    if (schoolMatches.length > 0) {
        schoolMatches.sort((a, b) => b.name.length - a.name.length);
        const matchedSchool = schoolMatches[0];
        document.getElementById('school-search').value = matchedSchool.name;
        document.getElementById('education-level').value = matchedSchool.level;
        document.getElementById('school-suggestions').style.display = 'none';
    }
}

// 点击外部关闭学校建议
document.addEventListener('click', function(e) {
    if (!e.target.closest('#school-search') && !e.target.closest('#school-suggestions')) {
        document.getElementById('school-suggestions').style.display = 'none';
    }
});

// 阻止弹窗背景滚动
document.getElementById('add-application-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});
