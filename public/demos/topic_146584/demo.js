// ==================== 真实文献数据 ====================

const mockPapers = [
  { id: 1, title: 'Attention Is All You Need', authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'], year: 2017, source: 'arXiv', abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.', relevance: 'strong', citations: 130000, category: 'deep-learning', downloadUrl: 'https://arxiv.org/abs/1706.03762', downloadDate: '2026-06-15', doi: '10.48550/arXiv.1706.03762' },
  { id: 2, title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'], year: 2019, source: 'arXiv', abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.', relevance: 'strong', citations: 85000, category: 'nlp', downloadUrl: 'https://arxiv.org/abs/1810.04805', downloadDate: '2026-06-20', doi: '10.18653/v1/N19-1423' },
  { id: 3, title: 'Graph Attention Networks', authors: ['Petar Veličković', 'Guillem Cucurull', 'Arantxa Casanova', 'Adriana Romero', 'Pietro Liò', 'Yoshua Bengio'], year: 2018, source: 'arXiv', abstract: 'We present graph attention networks (GATs), novel neural network architectures that operate on graph-structured data, leveraging masked self-attentional layers to address the shortcomings of prior methods based on graph convolutions or their approximations.', relevance: 'strong', citations: 19000, category: 'deep-learning', downloadUrl: 'https://arxiv.org/abs/1710.10903', downloadDate: '2026-06-10', doi: '10.48550/arXiv.1710.10903' },
  { id: 4, title: 'Deep Residual Learning for Image Recognition', authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'], year: 2016, source: 'IEEE', abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.', relevance: 'strong', citations: 170000, category: 'cv', downloadUrl: 'https://arxiv.org/abs/1512.03385', downloadDate: '2026-05-28', doi: '10.1109/CVPR.2016.90' },
  { id: 5, title: 'A Survey on Image Data Augmentation for Deep Learning', authors: ['Connor Shorten', 'Taghi M. Khoshgoftaar'], year: 2019, source: 'Journal of Big Data', abstract: 'Deep convolutional neural networks perform considerably better in image recognition tasks when trained on a large dataset. However, data augmentation techniques can be used to expand the size of training datasets and prevent overfitting. We survey traditional and modern data augmentation techniques.', relevance: 'medium', citations: 5200, category: 'cv', downloadUrl: 'https://journalofbigdata.springeropen.com/articles/10.1186/s40537-019-0197-0', downloadDate: '2026-06-22', doi: '10.1186/s40537-019-0197-0' },
  { id: 6, title: 'Generative Adversarial Nets', authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'], year: 2014, source: 'arXiv', abstract: 'We propose a new framework for generative adversarial networks. In our framework, we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.', relevance: 'medium', citations: 55000, category: 'deep-learning', downloadUrl: 'https://arxiv.org/abs/1406.2661', downloadDate: '2026-06-05', doi: '10.48550/arXiv.1406.2661' },
  { id: 7, title: 'GPT-4 Technical Report', authors: ['OpenAI'], year: 2023, source: 'arXiv', abstract: 'GPT-4 is a large multimodal model that can accept image and text inputs and emit text outputs. It exhibits human-level performance on various professional and academic benchmarks. We report on the development of GPT-4, a large-scale multimodal model.', relevance: 'medium', citations: 8500, category: 'nlp', downloadUrl: 'https://arxiv.org/abs/2303.08774', downloadDate: '2026-06-25', doi: '10.48550/arXiv.2303.08774' },
  { id: 8, title: 'A Survey on Large Language Model based Autonomous Agents', authors: ['Lei Wang', 'Chen Ma', 'Xueyang Feng', 'Zeyu Zhang', 'Hao Yang', 'Jingsen Zhang', 'Zhiyuan Chen', 'Jiakai Tang', 'Xu Chen', 'Yankai Lin', 'Wayne Xin Zhao', 'Zhewei Wei', 'Ji-Rong Wen'], year: 2024, source: 'arXiv', abstract: 'Autonomous agents have long been a research focus in academic and industry communities. With the emergence of large language models (LLMs), LLM-based autonomous agents have shown tremendous potential. This paper provides a comprehensive survey on LLM-based autonomous agents.', relevance: 'medium', citations: 1200, category: 'nlp', downloadUrl: 'https://arxiv.org/abs/2308.11432', downloadDate: '2026-06-25', doi: '10.48550/arXiv.2308.11432' },
  { id: 9, title: 'Playing Atari with Deep Reinforcement Learning', authors: ['Volodymyr Mnih', 'Koray Kavukcuoglu', 'David Silver', 'Alex Graves', 'Ioannis Antonoglou', 'Daan Wierstra', 'Martin Riedmiller'], year: 2013, source: 'arXiv', abstract: 'We present the first deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning. Our model is a convolutional neural network, trained with a variant of Q-learning, whose input is raw pixels and whose output is a value function estimating future rewards.', relevance: 'medium', citations: 18000, category: 'deep-learning', downloadUrl: 'https://arxiv.org/abs/1312.5602', downloadDate: '2026-06-12', doi: '10.48550/arXiv.1312.5602' },
  { id: 10, title: 'A Survey on Transfer Learning', authors: ['Sinno Jialin Pan', 'Qiang Yang'], year: 2010, source: 'IEEE', abstract: 'A major assumption in many machine learning and data mining algorithms is that the training and future data must be in the same feature space and have the same distribution. However, in many real-world applications, this assumption does not hold. In this survey, we focus on transfer learning.', relevance: 'weak', citations: 14000, category: 'deep-learning', downloadUrl: 'https://ieeexplore.ieee.org/document/5288526', downloadDate: '2026-05-20', doi: '10.1109/TKDE.2009.191' },
  { id: 11, title: 'You Only Look Once: Unified, Real-Time Object Detection', authors: ['Joseph Redmon', 'Santosh Divvala', 'Ross Girshick', 'Ali Farhadi'], year: 2016, source: 'IEEE', abstract: 'We present YOLO, a new approach to object detection. Prior work on object detection repurposes classifiers to perform detection. Instead, we frame object detection as a regression problem to spatially separated bounding boxes and associated class probabilities.', relevance: 'weak', citations: 40000, category: 'cv', downloadUrl: 'https://arxiv.org/abs/1506.02640', downloadDate: '2026-06-01', doi: '10.1109/CVPR.2016.91' },
  { id: 12, title: 'Prototypical Networks for Few-shot Learning', authors: ['Jake Snell', 'Kevin Swersky', 'Richard S. Zemel'], year: 2017, source: 'arXiv', abstract: 'We propose prototypical networks for the problem of few-shot classification. Prototypical networks learn a metric space in which classification can be performed by computing distances to prototype representations of each class. Compared to recent meta-learning approaches, prototypical networks are simpler and more efficient.', relevance: 'weak', citations: 6500, category: 'deep-learning', downloadUrl: 'https://arxiv.org/abs/1703.05175', downloadDate: '2026-06-18', doi: '10.48550/arXiv.1703.05175' },
  { id: 13, title: 'Deep Learning for Generic Object Detection: A Survey', authors: ['Li Liu', 'Wanli Ouyang', 'Xiaogang Wang', 'Paul Fieguth', 'Jie Chen', 'Xinwang Liu', 'Matti Pietikäinen'], year: 2020, source: 'IJCV', abstract: 'Generic object detection is a core problem in computer vision. With the rapid development of deep learning, tremendous progress has been achieved in object detection. This paper provides a comprehensive survey on deep learning based generic object detection.', relevance: 'weak', citations: 3800, category: 'cv', downloadUrl: 'https://link.springer.com/article/10.1007/s11263-019-01247-4', downloadDate: '2026-06-14', doi: '10.1007/s11263-019-01247-4' },
  { id: 14, title: 'Semi-Supervised Classification with Graph Convolutional Networks', authors: ['Thomas N. Kipf', 'Max Welling'], year: 2017, source: 'arXiv', abstract: 'We present a scalable approach for semi-supervised learning on graph-structured data that is based on an efficient variant of convolutional neural networks which operate directly on graphs. The motivation for this choice of convolutional architecture is a localized first-order approximation of spectral graph convolutions.', relevance: 'strong', citations: 30000, category: 'deep-learning', downloadUrl: 'https://arxiv.org/abs/1609.02907', downloadDate: '2026-05-25', doi: '10.48550/arXiv.1609.02907' },
  { id: 15, title: 'Federated Learning: Challenges, Methods, and Future Directions', authors: ['Tian Li', 'Anit Kumar Sahu', 'Ameet Talwalkar', 'Virginia Smith'], year: 2020, source: 'IEEE Signal Processing Magazine', abstract: 'Federated learning is a distributed machine learning paradigm that enables training on decentralized data while preserving privacy. We discuss the unique challenges and characteristics of federated learning, and provide a broad overview of current methods.', relevance: 'medium', citations: 4200, category: 'nlp', downloadUrl: 'https://arxiv.org/abs/1908.07873', downloadDate: '2026-06-07', doi: '10.1109/MSP.2020.2985749' },
  { id: 16, title: 'ImageNet Classification with Deep Convolutional Neural Networks', authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey E. Hinton'], year: 2012, source: 'arXiv', abstract: 'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes. On the test data, we achieved top-1 and top-5 error rates of 37.5% and 17.0%, respectively.', relevance: 'strong', citations: 120000, category: 'cv', downloadUrl: 'https://arxiv.org/abs/1206.5538', downloadDate: '2026-05-25', doi: '10.1145/3065386' },
  { id: 17, title: 'A Comprehensive Survey on Graph Neural Networks', authors: ['Zonghan Wu', 'Shirui Pan', 'Fengwen Chen', 'Guodong Long', 'Chengqi Zhang', 'S Yu Philip'], year: 2021, source: 'IEEE TNNLS', abstract: 'Deep learning has revolutionized many machine learning tasks in recent years, ranging from image classification and video processing to speech recognition and natural language understanding. This paper provides a comprehensive survey of graph neural networks (GNNs) in the deep learning era.', relevance: 'strong', citations: 8000, category: 'deep-learning', downloadUrl: 'https://ieeexplore.ieee.org/document/9046288', downloadDate: '2026-06-19', doi: '10.1109/TNNLS.2020.2978386' },
  { id: 18, title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', authors: ['Alexey Dosovitskiy', 'Lucas Beyer', 'Alexander Kolesnikov', 'Dirk Weissenborn', 'Xiaohua Zhai', 'Thomas Unterthiner', 'Mostafa Dehghani', 'Matthias Minderer', 'Georg Heigold', 'Sylvain Gelly', 'Jakob Uszkoreit', 'Neil Houlsby'], year: 2021, source: 'arXiv', abstract: 'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications in computer vision remain limited. In vision, attention is either used in conjunction with convolutional networks, or used to replace certain components. We show that this reliance on CNNs is not necessary.', relevance: 'medium', citations: 22000, category: 'cv', downloadUrl: 'https://arxiv.org/abs/2010.11929', downloadDate: '2026-06-19', doi: '10.48550/arXiv.2010.11929' }
];

const mockTasks = [
  { id: 1, keyword: 'graph neural network', sites: ['arxiv', 'semantic'], interval: 'weekly', intervalText: '每周', runTime: '08:00', enabled: true, maxDownload: 10, nextRun: '2026-07-10 08:00:00', lastRun: '2026-07-03 08:02:15', lastNewCount: 5, totalNewCount: 28, runCount: 6, createdAt: '2026-05-20 14:30:00' },
  { id: 2, keyword: 'large language model medical', sites: ['arxiv', 'pubmed', 'semantic'], interval: 'daily', intervalText: '每天', runTime: '07:30', enabled: true, maxDownload: 15, nextRun: '2026-07-04 07:30:00', lastRun: '2026-07-03 07:31:42', lastNewCount: 3, totalNewCount: 45, runCount: 30, createdAt: '2026-06-03 09:15:00' },
  { id: 3, keyword: 'vision transformer', sites: ['arxiv'], interval: '3days', intervalText: '每3天', runTime: '10:00', enabled: false, maxDownload: 8, nextRun: '2026-07-06 10:00:00', lastRun: '2026-07-01 10:01:20', lastNewCount: 2, totalNewCount: 12, runCount: 4, createdAt: '2026-06-15 16:45:00' },
  { id: 4, keyword: 'reinforcement learning robotics', sites: ['semantic', 'arxiv'], interval: 'monthly', intervalText: '每月', runTime: '09:00', enabled: true, maxDownload: 20, nextRun: '2026-08-01 09:00:00', lastRun: '2026-07-01 09:03:10', lastNewCount: 8, totalNewCount: 24, runCount: 2, createdAt: '2026-05-01 11:00:00' }
];

const mockHistory = [
  { id: 1, keyword: 'graph neural network', date: '2026-07-03 14:20', count: 12 },
  { id: 2, keyword: 'transformer survey', date: '2026-07-02 10:15', count: 18 },
  { id: 3, keyword: 'medical image segmentation', date: '2026-06-30 16:45', count: 9 },
  { id: 4, keyword: 'few-shot learning', date: '2026-06-28 09:30', count: 7 },
  { id: 5, keyword: 'sentiment analysis deep learning', date: '2026-06-25 11:20', count: 14 },
  { id: 6, keyword: 'federated learning privacy', date: '2026-06-20 13:10', count: 6 }
];

// ==================== 状态管理 ====================

let sites = [
  { id: 'arxiv', name: 'arXiv', baseUrl: 'https://arxiv.org', searchUrl: 'https://arxiv.org/search/?query={keyword}', icon: '📄', requiresLogin: false, loginUrl: null, enabled: true, isBuiltIn: true, loginStatus: 'none', selectors: {} },
  { id: 'semantic', name: 'Semantic Scholar', baseUrl: 'https://www.semanticscholar.org', searchUrl: 'https://www.semanticscholar.org/search?q={keyword}', icon: '🔬', requiresLogin: false, loginUrl: null, enabled: true, isBuiltIn: true, loginStatus: 'none', selectors: {} },
  { id: 'pubmed', name: 'PubMed', baseUrl: 'https://pubmed.ncbi.nlm.nih.gov', searchUrl: 'https://pubmed.ncbi.nlm.nih.gov/?term={keyword}', icon: '🧬', requiresLogin: false, loginUrl: null, enabled: true, isBuiltIn: true, loginStatus: 'none', selectors: {} },
  { id: 'ieee', name: 'IEEE Xplore', baseUrl: 'https://ieeexplore.ieee.org', searchUrl: 'https://ieeexplore.ieee.org/search/searchresult.jsp?queryText={keyword}', icon: '⚡', requiresLogin: true, loginUrl: 'https://ieeexplore.ieee.org/servlet/Login', enabled: true, isBuiltIn: true, loginStatus: 'logged_out', selectors: { resultItem: '.List-results-items', title: '.result-item-title a', authors: '.author span', pdfLink: 'a.pdf-btn-link', year: '.description' } },
  { id: 'cnki', name: '中国知网', baseUrl: 'https://www.cnki.net', searchUrl: 'https://kns.cnki.net/kns8/defaultresult/index?kw={keyword}', icon: '📚', requiresLogin: true, loginUrl: 'https://login.cnki.net/login/', enabled: false, isBuiltIn: true, loginStatus: 'logged_out', selectors: {} }
];

let categories = [
  { id: 'deep-learning', name: '深度学习', icon: '🧠', color: '#9333ea' },
  { id: 'nlp', name: '自然语言处理', icon: '💬', color: '#3b82f6' },
  { id: 'cv', name: '计算机视觉', icon: '👁️', color: '#10b981' }
];

let tasks = [...mockTasks];
let papers = [...mockPapers];
let history = [...mockHistory];

let currentPage = 'search';
let searchMode = 'multi';
let currentCategory = 'all';
let currentFilter = 'all';
let currentSort = 'date';
let searchSort = 'relevance';
let searchResults = [];
let editingTaskId = null;
let editingSiteId = null;
let editingCategoryId = null;
let movingPaperId = null;
let selectedIcon = '📁';
let selectedColor = '#9333ea';
let simulatedTab = null;

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearchMode();
  initSearch();
  initScheduler();
  initLibrary();
  initSettings();
  initSiteModal();
  initCategoryModal();
  initMovePaperModal();
  initAiFeatures();
  initHighlightCards();
  initModalClosers();
  renderHistory();
  renderSearchSiteCheckboxes();
  renderTaskSiteCheckboxes();
});

// ==================== 导航 ====================

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });
}

// ==================== 搜索模式切换 ====================

function initSearchMode() {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      searchMode = tab.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
      });
      document.getElementById('multiSearchPanel').style.display = searchMode === 'multi' ? 'block' : 'none';
      document.getElementById('currentTabPanel').style.display = searchMode === 'current' ? 'block' : 'none';
      // 隐藏搜索结果
      document.getElementById('searchResults').style.display = 'none';
    });
  });

  // 当前标签页按钮
  document.getElementById('detectTabBtn').addEventListener('click', detectCurrentTab);
  document.getElementById('scrapeTabBtn').addEventListener('click', scrapeCurrentTab);
  document.getElementById('simulateCnkiBtn').addEventListener('click', () => simulateOpenTab('cnki'));
  document.getElementById('simulateIeeeBtn').addEventListener('click', () => simulateOpenTab('ieee'));
}

// ==================== 当前标签页抓取（核心：复用已登录会话） ====================

function detectCurrentTab() {
  const btn = document.getElementById('detectTabBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span><span>检测中...</span>';

  document.getElementById('siteDetectStatus').textContent = '检测中...';
  document.getElementById('loginDetectStatus').textContent = '检测中...';
  document.getElementById('pageTypeStatus').textContent = '检测中...';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<span>🔄</span><span>检测当前标签页</span>';

    if (!simulatedTab) {
      document.getElementById('currentTabTitle').textContent = '未检测到学术网站';
      document.getElementById('currentTabUrl').textContent = '请先打开一个学术网站（如知网、IEEE、arXiv等）的检索结果页面';
      document.getElementById('siteDetectStatus').innerHTML = '<span class="status-tag status-tag-gray">未识别</span>';
      document.getElementById('loginDetectStatus').innerHTML = '<span class="status-tag status-tag-gray">-</span>';
      document.getElementById('pageTypeStatus').innerHTML = '<span class="status-tag status-tag-gray">-</span>';
      document.getElementById('scrapeTabBtn').disabled = true;
      showToast('未检测到学术网站，请先在浏览器中打开学术网站', 'error');
      return;
    }

    const site = sites.find(s => s.id === simulatedTab.siteId);
    if (!site) return;

    // 更新检测信息
    document.getElementById('currentTabTitle').textContent = `${site.icon} ${site.name} - 检索结果`;
    document.getElementById('currentTabUrl').textContent = simulatedTab.url;

    document.getElementById('siteDetectStatus').innerHTML = `<span class="status-tag status-tag-green">✅ ${site.name}</span>`;

    if (site.requiresLogin) {
      // 模拟检测登录状态（通过Cookie）
      if (simulatedTab.loggedIn) {
        document.getElementById('loginDetectStatus').innerHTML = '<span class="status-tag status-tag-green">✅ 已登录（Cookie会话有效）</span>';
      } else {
        document.getElementById('loginDetectStatus').innerHTML = '<span class="status-tag status-tag-red">❌ 未登录</span>';
      }
    } else {
      document.getElementById('loginDetectStatus').innerHTML = '<span class="status-tag status-tag-blue">无需登录</span>';
    }

    document.getElementById('pageTypeStatus').innerHTML = '<span class="status-tag status-tag-green">✅ 检索结果页</span>';

    // 启用抓取按钮
    const canScrape = !site.requiresLogin || simulatedTab.loggedIn;
    document.getElementById('scrapeTabBtn').disabled = !canScrape;

    if (canScrape) {
      showToast(`检测到 ${site.name}，登录状态有效，可以抓取`, 'success');
    } else {
      showToast(`检测到 ${site.name}，但未登录，请先在浏览器中登录`, 'error');
    }
  }, 1200);
}

function simulateOpenTab(siteId) {
  const site = sites.find(s => s.id === siteId);
  if (!site) return;

  simulatedTab = {
    siteId: siteId,
    url: site.searchUrl.replace('{keyword}', 'deep learning graph neural network'),
    loggedIn: site.requiresLogin ? Math.random() > 0.3 : true, // 模拟：70%概率已登录
    title: `${site.name} - 检索结果`
  };

  showToast(`已模拟打开 ${site.name} 检索页面（${simulatedTab.loggedIn ? '已登录' : '未登录'}）`, 'info');
  detectCurrentTab();
}

function scrapeCurrentTab() {
  if (!simulatedTab) return;

  const site = sites.find(s => s.id === simulatedTab.siteId);
  if (!site) return;

  document.getElementById('searchLoading').style.display = 'block';
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('loadingText').textContent = `正在从 ${site.name} 抓取文献...`;
  document.getElementById('loadingSubtext').textContent = '复用当前标签页登录会话，注入抓取脚本...';

  const loadingTexts = [
    `正在注入内容脚本到 ${site.name} 页面...`,
    '正在解析页面DOM结构...',
    `正在提取文献信息（标题、作者、PDF链接）...`,
    '正在检测文献唯一标识，进行去重...',
    '抓取完成，正在整理结果...'
  ];

  let step = 0;
  const loadingInterval = setInterval(() => {
    if (step < loadingTexts.length) {
      document.getElementById('loadingSubtext').textContent = loadingTexts[step];
      step++;
    }
  }, 500);

  setTimeout(() => {
    clearInterval(loadingInterval);
    // 生成模拟抓取结果（从当前页面抓取到的文献）
    searchResults = generateScrapeResults(site);
    addToHistory(`${site.name} 页面抓取`, searchResults.length);

    document.getElementById('searchLoading').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('loadingText').textContent = '正在检索文献，请稍候...';
    renderSearchResults();

    showToast(`成功从 ${site.name} 抓取 ${searchResults.length} 篇文献`, 'success');
  }, 2800);
}

function generateScrapeResults(site) {
  // 根据网站类型生成不同的模拟结果
  const count = Math.floor(Math.random() * 5) + 8;
  const shuffled = [...mockPapers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((paper, index) => {
    let relevance;
    if (index < 3) relevance = 'strong';
    else if (index < 6) relevance = 'medium';
    else relevance = 'weak';
    return { ...paper, source: site.name, relevance, id: Date.now() + index };
  });
}

// ==================== 多站检索 ====================

function initSearch() {
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('searchKeyword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('searchKeyword').value = btn.dataset.keyword;
      performSearch();
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderSearchResults();
    });
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      searchSort = btn.dataset.sort;
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b === btn));
      // 仅相关性排序时显示相关性筛选
      document.getElementById('relevanceFilter').style.display = searchSort === 'relevance' ? 'flex' : 'none';
      renderSearchResults();
    });
  });
}

function performSearch() {
  const keyword = document.getElementById('searchKeyword').value.trim();
  if (!keyword) { showToast('请输入搜索关键词', 'error'); return; }

  const checkedSites = Array.from(document.querySelectorAll('#searchSiteCheckboxes input:checked')).map(cb => cb.value);
  if (checkedSites.length === 0) { showToast('请至少选择一个网站', 'error'); return; }

  document.getElementById('searchLoading').style.display = 'block';
  document.getElementById('searchResults').style.display = 'none';

  const siteNames = checkedSites.map(id => sites.find(s => s.id === id)?.name || id);
  const loadingTexts = siteNames.map(s => `正在检索 ${s}...`).concat(['正在分析结果相关性...', '正在去重排序...']);

  let step = 0;
  const loadingInterval = setInterval(() => {
    if (step < loadingTexts.length) {
      document.getElementById('loadingSubtext').textContent = loadingTexts[step];
      step++;
    }
  }, 400);

  setTimeout(() => {
    clearInterval(loadingInterval);
    searchResults = generateSearchResults(keyword);
    addToHistory(keyword, searchResults.length);
    document.getElementById('searchLoading').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
    renderSearchResults();
  }, 2000);
}

function generateSearchResults(keyword) {
  const shuffled = [...mockPapers].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 6) + 8;
  return shuffled.slice(0, count).map((paper, index) => {
    let relevance;
    if (index < 3) relevance = 'strong';
    else if (index < 6) relevance = 'medium';
    else relevance = 'weak';
    return { ...paper, relevance };
  });
}

function renderSearchResults() {
  if (searchResults.length === 0) {
    document.getElementById('strongSection').style.display = 'none';
    document.getElementById('mediumSection').style.display = 'none';
    document.getElementById('weakSection').style.display = 'none';
    document.getElementById('sortedSection').style.display = 'none';
    document.getElementById('resultsCount').textContent = '0 篇';
    const container = document.querySelector('.search-results');
    let emptyEl = container.querySelector('.empty-state');
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'empty-state';
      emptyEl.innerHTML = `
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">未找到相关文献</div>
        <div class="empty-state-desc">尝试更换关键词或使用 AI 扩展关键词</div>`;
      container.appendChild(emptyEl);
    }
    return;
  }

  const existingEmpty = document.querySelector('.search-results .empty-state');
  if (existingEmpty) existingEmpty.remove();

  document.getElementById('resultsCount').textContent = `${searchResults.length} 篇`;

  // 按时间或引用数排序：显示统一列表，隐藏相关性分组
  if (searchSort === 'year' || searchSort === 'citations') {
    document.getElementById('strongSection').style.display = 'none';
    document.getElementById('mediumSection').style.display = 'none';
    document.getElementById('weakSection').style.display = 'none';
    document.getElementById('sortedSection').style.display = 'block';

    const sorted = [...searchResults].sort((a, b) => {
      if (searchSort === 'year') return b.year - a.year;
      return b.citations - a.citations;
    });

    const badge = document.getElementById('sortedBadge');
    badge.textContent = searchSort === 'year' ? '按时间排序（新→旧）' : '按引用数排序（高→低）';
    document.getElementById('sortedCount').textContent = `${sorted.length} 篇`;
    document.getElementById('sortedResults').innerHTML = sorted.map(p => createPaperCard(p)).join('');
    bindPaperCardEvents();
    return;
  }

  // 按相关性排序：显示分组，隐藏统一列表
  document.getElementById('sortedSection').style.display = 'none';

  const strong = searchResults.filter(p => p.relevance === 'strong');
  const medium = searchResults.filter(p => p.relevance === 'medium');
  const weak = searchResults.filter(p => p.relevance === 'weak');

  document.getElementById('strongCount').textContent = `${strong.length} 篇`;
  document.getElementById('mediumCount').textContent = `${medium.length} 篇`;
  document.getElementById('weakCount').textContent = `${weak.length} 篇`;

  document.getElementById('strongSection').style.display = (currentFilter === 'all' || currentFilter === 'strong') ? 'block' : 'none';
  document.getElementById('mediumSection').style.display = (currentFilter === 'all' || currentFilter === 'medium') ? 'block' : 'none';
  document.getElementById('weakSection').style.display = (currentFilter === 'all' || currentFilter === 'weak') ? 'block' : 'none';

  document.getElementById('strongResults').innerHTML = strong.map(p => createPaperCard(p)).join('');
  document.getElementById('mediumResults').innerHTML = medium.map(p => createPaperCard(p)).join('');
  document.getElementById('weakResults').innerHTML = weak.map(p => createPaperCard(p)).join('');
  bindPaperCardEvents();
}

// 统一绑定文献卡片事件（避免重复代码）
function bindPaperCardEvents() {
  document.querySelectorAll('.paper-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const paperId = parseInt(btn.dataset.id);
      downloadPaper(paperId);
    });
  });

  document.querySelectorAll('.paper-ai-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const paperId = parseInt(btn.dataset.id);
      showAISummary(paperId, 'search');
    });
  });

  document.querySelectorAll('.paper-open-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const paperId = parseInt(btn.dataset.id);
      openPaperUrl(paperId, 'search');
    });
  });

  document.querySelectorAll('.paper-title-link').forEach(title => {
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const paperId = parseInt(title.dataset.id);
      openPaperUrl(paperId, 'search');
    });
  });
}

function createPaperCard(paper) {
  const isDownloaded = papers.some(p => p.id === paper.id);
  return `
    <div class="paper-card">
      <div class="paper-header">
        <div class="paper-title paper-title-link" data-id="${paper.id}" title="点击查看原文">
          ${paper.title}
          <span class="paper-link-icon">🔗</span>
        </div>
        <div class="paper-actions">
          <button class="paper-open-btn" data-id="${paper.id}" title="在新标签页打开">
            <span>🌐</span><span>打开网页</span>
          </button>
          <button class="paper-ai-btn" data-id="${paper.id}" title="AI 智能摘要">
            <span>🤖</span><span>AI 总结</span>
          </button>
          <button class="paper-download ${isDownloaded ? 'downloaded' : ''}" data-id="${paper.id}">
            <span>${isDownloaded ? '✅' : '⬇️'}</span>
            <span>${isDownloaded ? '已下载' : '下载'}</span>
          </button>
        </div>
      </div>
      <div class="paper-meta">
        <span class="paper-meta-item"><span>👤</span><span class="paper-authors">${paper.authors.join(', ')}</span></span>
        <span class="paper-meta-item"><span>📅</span><span class="paper-year">${paper.year}</span></span>
        <span class="paper-meta-item"><span class="paper-source">${paper.source}</span></span>
        <span class="paper-meta-item"><span>⭐</span><span>${paper.citations.toLocaleString()} 引用</span></span>
      </div>
      <div class="paper-abstract">${paper.abstract}</div>
    </div>
  `;
}

// 打开文献对应网页
function openPaperUrl(paperId, source) {
  const paper = source === 'search' ? searchResults.find(p => p.id === paperId) : papers.find(p => p.id === paperId);
  if (!paper) {
    showToast('未找到该文献', 'error');
    return;
  }

  const url = buildPaperUrl(paper);
  showToast(`正在打开 ${paper.source} 页面...`, 'info');
  window.open(url, '_blank');
}

// 根据文献来源构建对应网页URL
function buildPaperUrl(paper) {
  // 优先使用文献自身的真实链接
  if (paper.downloadUrl && paper.downloadUrl !== '#') {
    return paper.downloadUrl;
  }
  const title = encodeURIComponent(paper.title);
  const sourceMap = {
    'arXiv': `https://arxiv.org/search/?query=${title}&searchtype=all`,
    'Semantic Scholar': `https://www.semanticscholar.org/search?q=${title}`,
    'PubMed': `https://pubmed.ncbi.nlm.nih.gov/?term=${title}`,
    'IEEE': `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${title}`,
    'IEEE TNNLS': `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${title}`,
    'IEEE Signal Processing Magazine': `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${title}`,
    'Journal of Big Data': `https://journalofbigdata.springeropen.com/search?q=${title}`,
    'IJCV': `https://link.springer.com/search?query=${title}`,
    '中国知网': `https://kns.cnki.net/kns8/defaultresult/index?kw=${title}`,
    'CNKI': `https://kns.cnki.net/kns8/defaultresult/index?kw=${title}`
  };
  return sourceMap[paper.source] || `https://www.google.com/search?q=${title}+${paper.source}`;
}

function downloadPaper(paperId) {
  const paper = searchResults.find(p => p.id === paperId);
  if (!paper) return;

  if (papers.some(p => p.id === paperId)) {
    showToast('该文献已下载', 'info');
    return;
  }

  showToast(`开始下载：${paper.title.substring(0, 30)}...`, 'success');
  setTimeout(() => {
    papers.unshift({ ...paper, downloadDate: new Date().toLocaleString('zh-CN').replace(/\//g, '-') });
    renderSearchResults();
    showToast('下载完成！文献已添加到文献库', 'success');
  }, 1000);
}

// ==================== 定时任务 ====================

function initScheduler() {
  document.getElementById('addTaskBtn').addEventListener('click', openAddTaskModal);
  document.getElementById('taskModalConfirm').addEventListener('click', confirmTask);
  renderTasks();
  updateTaskStats();
}

function openAddTaskModal() {
  editingTaskId = null;
  document.getElementById('taskModalTitle').textContent = '新建定时任务';
  document.getElementById('taskKeyword').value = '';
  document.getElementById('taskInterval').value = 'weekly';
  document.getElementById('taskTime').value = '08:00';
  document.getElementById('taskMaxDownload').value = '10';
  document.querySelectorAll('#taskSiteCheckboxes input').forEach((cb, i) => cb.checked = i < 2);
  document.getElementById('taskModalConfirm').textContent = '确认创建';
  openModal('taskModal');
}

function openEditTaskModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  editingTaskId = taskId;
  document.getElementById('taskModalTitle').textContent = '编辑定时任务';
  document.getElementById('taskKeyword').value = task.keyword;
  document.getElementById('taskInterval').value = task.interval;
  document.getElementById('taskTime').value = task.runTime;
  document.getElementById('taskMaxDownload').value = task.maxDownload;
  document.querySelectorAll('#taskSiteCheckboxes input').forEach(cb => cb.checked = task.sites.includes(cb.value));
  document.getElementById('taskModalConfirm').textContent = '确认修改';
  openModal('taskModal');
}

function confirmTask() {
  const keyword = document.getElementById('taskKeyword').value.trim();
  const siteChecks = Array.from(document.querySelectorAll('#taskSiteCheckboxes input:checked')).map(cb => cb.value);
  const interval = document.getElementById('taskInterval').value;
  const runTime = document.getElementById('taskTime').value;
  const maxDownload = parseInt(document.getElementById('taskMaxDownload').value);

  if (!keyword) { showToast('请输入关键词', 'error'); return; }
  if (siteChecks.length === 0) { showToast('请至少选择一个网站', 'error'); return; }

  const intervalMap = { 'daily': '每天', '3days': '每3天', 'weekly': '每周', 'monthly': '每月' };

  if (editingTaskId) {
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
      task.keyword = keyword;
      task.sites = siteChecks;
      task.interval = interval;
      task.intervalText = intervalMap[interval];
      task.runTime = runTime;
      task.maxDownload = maxDownload;
    }
    showToast('任务修改成功', 'success');
  } else {
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    tasks.push({
      id: newId, keyword, sites: siteChecks, interval, intervalText: intervalMap[interval],
      runTime, enabled: true, maxDownload, nextRun: calculateNextRun(interval, runTime),
      lastRun: null, lastNewCount: 0, totalNewCount: 0, runCount: 0, createdAt: new Date().toLocaleString('zh-CN')
    });
    showToast('任务创建成功', 'success');
  }
  closeModal('taskModal');
  renderTasks();
  updateTaskStats();
}

function calculateNextRun(interval, runTime) {
  const [hours, minutes] = runTime.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  const days = { daily: 1, '3days': 3, weekly: 7, monthly: 30 }[interval] || 1;
  if (next <= now) next.setDate(next.getDate() + days);
  return next.toLocaleString('zh-CN');
}

function renderTasks() {
  const container = document.getElementById('taskList');
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏰</div>
        <div class="empty-state-title">暂无定时任务</div>
        <div class="empty-state-desc">创建定时任务，自动检索关键词相关文献</div>
        <button class="btn btn-primary" onclick="openAddTaskModal()"><span>➕</span><span>新建任务</span></button>
      </div>`;
    return;
  }
  container.innerHTML = tasks.map(createTaskCard).join('');

  document.querySelectorAll('.task-toggle').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleTask(parseInt(btn.dataset.id)); }));
  document.querySelectorAll('.task-run-now').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); runTaskNow(parseInt(btn.dataset.id)); }));
  document.querySelectorAll('.task-edit').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openEditTaskModal(parseInt(btn.dataset.id)); }));
  document.querySelectorAll('.task-delete').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); deleteTask(parseInt(btn.dataset.id)); }));
}

function createTaskCard(task) {
  const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));
  return `
    <div class="task-card">
      <div class="task-header">
        <div class="task-info">
          <div class="task-keyword">${task.keyword}</div>
          <div class="task-sites">${task.sites.map(s => `<span class="task-site">${siteMap[s] || s}</span>`).join('')}</div>
        </div>
        <div class="task-status ${task.enabled ? 'active' : 'disabled'}">
          <span>${task.enabled ? '●' : '○'}</span><span>${task.enabled ? '运行中' : '已禁用'}</span>
        </div>
      </div>
      <div class="task-details">
        <div class="task-detail-item"><span class="detail-label">执行间隔</span><span class="detail-value">${task.intervalText}</span></div>
        <div class="task-detail-item"><span class="detail-label">下次运行</span><span class="detail-value">${task.nextRun}</span></div>
        <div class="task-detail-item"><span class="detail-label">上次运行</span><span class="detail-value">${task.lastRun || '从未'}</span></div>
        <div class="task-detail-item"><span class="detail-label">累计新增</span><span class="detail-value">${task.totalNewCount} 篇</span></div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn task-toggle" data-id="${task.id}"><span>${task.enabled ? '⏸️' : '▶️'}</span><span>${task.enabled ? '禁用' : '启用'}</span></button>
        <button class="task-action-btn task-run-now" data-id="${task.id}"><span>⚡</span><span>立即运行</span></button>
        <button class="task-action-btn task-edit" data-id="${task.id}"><span>✏️</span><span>编辑</span></button>
        <button class="task-action-btn danger task-delete" data-id="${task.id}"><span>🗑️</span><span>删除</span></button>
      </div>
    </div>`;
}

function toggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) { task.enabled = !task.enabled; renderTasks(); updateTaskStats(); showToast(task.enabled ? '任务已启用' : '任务已禁用', 'success'); }
}

function runTaskNow(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  showToast(`正在执行任务：${task.keyword}`, 'info');
  setTimeout(() => {
    const newPapers = Math.floor(Math.random() * 5) + 1;
    task.lastRun = new Date().toLocaleString('zh-CN');
    task.lastNewCount = newPapers;
    task.totalNewCount += newPapers;
    task.runCount++;
    task.nextRun = calculateNextRun(task.interval, task.runTime);
    renderTasks();
    updateTaskStats();
    showToast(`任务完成！新增 ${newPapers} 篇文献`, 'success');
  }, 1500);
}

function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task && confirm(`确定要删除任务"${task.keyword}"吗？`)) {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
    updateTaskStats();
    showToast('任务已删除', 'success');
  }
}

function updateTaskStats() {
  document.getElementById('totalTasks').textContent = tasks.length;
  document.getElementById('activeTasks').textContent = tasks.filter(t => t.enabled).length;
  document.getElementById('totalPapers').textContent = tasks.reduce((sum, t) => sum + t.totalNewCount, 0);
}

// ==================== 文献库 ====================

function initLibrary() {
  document.getElementById('librarySearch').addEventListener('input', renderLibraryPapers);
  document.getElementById('librarySort').addEventListener('change', e => { currentSort = e.target.value; renderLibraryPapers(); });
  document.getElementById('addCategoryBtn').addEventListener('click', openAddCategoryModal);
  renderCategories();
  renderLibraryPapers();
}

function renderCategories() {
  const allCount = papers.length;
  const uncategorizedCount = papers.filter(p => !p.category).length;
  let html = `
    <div class="category-item ${currentCategory === 'all' ? 'active' : ''}" data-id="all">
      <span class="category-icon">📦</span>
      <span class="category-name">全部文献</span>
      <span class="category-count">${allCount}</span>
    </div>`;

  html += categories.map(cat => {
    const count = papers.filter(p => p.category === cat.id).length;
    return `
      <div class="category-item ${currentCategory === cat.id ? 'active' : ''}" data-id="${cat.id}">
        <span class="category-color-dot" style="background: ${cat.color};"></span>
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">${cat.name}</span>
        <span class="category-count">${count}</span>
        <div class="category-actions">
          <button class="cat-action-btn" data-action="edit" data-id="${cat.id}" title="编辑">✏️</button>
          <button class="cat-action-btn" data-action="delete" data-id="${cat.id}" title="删除">🗑️</button>
        </div>
      </div>`;
  }).join('');

  html += `
    <div class="category-item ${currentCategory === 'uncategorized' ? 'active' : ''}" data-id="uncategorized">
      <span class="category-icon">📁</span>
      <span class="category-name">未分类</span>
      <span class="category-count">${uncategorizedCount}</span>
    </div>`;

  document.getElementById('categoryList').innerHTML = html;

  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.cat-action-btn')) return;
      currentCategory = item.dataset.id;
      renderCategories();
      renderLibraryPapers();
    });
  });

  document.querySelectorAll('.cat-action-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const catId = btn.dataset.id;
      if (action === 'edit') openEditCategoryModal(catId);
      else if (action === 'delete') deleteCategory(catId);
    });
  });
}

function renderLibraryPapers() {
  const searchTerm = document.getElementById('librarySearch').value.toLowerCase();
  let filtered = [...papers];

  if (currentCategory === 'all') {
    // 全部
  } else if (currentCategory === 'uncategorized') {
    filtered = filtered.filter(p => !p.category || !categories.some(c => c.id === p.category));
  } else {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  if (searchTerm) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(searchTerm) ||
      p.authors.some(a => a.toLowerCase().includes(searchTerm))
    );
  }

  if (currentSort === 'date') filtered.sort((a, b) => (b.downloadDate || '').localeCompare(a.downloadDate || ''));
  else if (currentSort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (currentSort === 'author') filtered.sort((a, b) => a.authors[0].localeCompare(b.authors[0]));

  const container = document.getElementById('libraryPapers');
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">暂无文献</div>
        <div class="empty-state-desc">${searchTerm ? '未找到匹配的文献，试试其他关键词' : '前往检索页面下载文献到文献库'}</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(paper => {
    const cat = categories.find(c => c.id === paper.category);
    return `
      <div class="library-paper-card">
        <div class="library-paper-header">
          <div class="library-paper-title">${paper.title}</div>
          <div class="library-paper-actions">
            <button class="paper-action-btn paper-action-ai" data-action="ai" data-id="${paper.id}" title="AI 智能摘要">🤖</button>
            <button class="paper-action-btn" data-action="move" data-id="${paper.id}" title="移动分类">📂</button>
            <button class="paper-action-btn" data-action="open" data-id="${paper.id}" title="打开">🔗</button>
            <button class="paper-action-btn danger" data-action="delete" data-id="${paper.id}" title="删除">🗑️</button>
          </div>
        </div>
        <div class="library-paper-meta">
          <span>${paper.authors.slice(0, 2).join(', ')}${paper.authors.length > 2 ? ' 等' : ''}</span>
          <span>·</span><span>${paper.year}</span>
          <span>·</span><span>${paper.source}</span>
          <span>·</span><span>${paper.citations.toLocaleString()} 引用</span>
          ${cat ? `<span>·</span><span class="paper-cat-badge" style="background: ${cat.color}20; color: ${cat.color};">${cat.icon} ${cat.name}</span>` : ''}
        </div>
        ${paper.downloadDate ? `<div class="library-paper-date">下载时间：${paper.downloadDate}</div>` : ''}
      </div>`;
  }).join('');

  document.querySelectorAll('.paper-action-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const paperId = parseInt(btn.dataset.id);
      if (action === 'move') openMovePaperModal(paperId);
      else if (action === 'ai') showAISummary(paperId, 'library');
      else if (action === 'open') openPaperUrl(paperId, 'library');
      else if (action === 'delete') deletePaper(paperId);
    });
  });
}

// ==================== 分类CRUD ====================

function openAddCategoryModal() {
  editingCategoryId = null;
  document.getElementById('categoryModalTitle').textContent = '新建分类';
  document.getElementById('categoryName').value = '';
  selectedIcon = '📁';
  selectedColor = '#9333ea';
  document.querySelectorAll('.icon-option').forEach(o => o.classList.toggle('active', o.dataset.icon === selectedIcon));
  document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('active', o.dataset.color === selectedColor));
  document.getElementById('categoryModalConfirm').textContent = '确认创建';
  openModal('categoryModal');
}

function openEditCategoryModal(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  editingCategoryId = catId;
  document.getElementById('categoryModalTitle').textContent = '编辑分类';
  document.getElementById('categoryName').value = cat.name;
  selectedIcon = cat.icon;
  selectedColor = cat.color;
  document.querySelectorAll('.icon-option').forEach(o => o.classList.toggle('active', o.dataset.icon === selectedIcon));
  document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('active', o.dataset.color === selectedColor));
  document.getElementById('categoryModalConfirm').textContent = '确认修改';
  openModal('categoryModal');
}

function deleteCategory(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  if (confirm(`确定要删除分类"${cat.name}"吗？该分类下的文献将变为未分类。`)) {
    categories = categories.filter(c => c.id !== catId);
    papers.forEach(p => { if (p.category === catId) p.category = null; });
    if (currentCategory === catId) currentCategory = 'all';
    renderCategories();
    renderLibraryPapers();
    showToast('分类已删除', 'success');
  }
}

function initCategoryModal() {
  document.querySelectorAll('.icon-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedIcon = opt.dataset.icon;
      document.querySelectorAll('.icon-option').forEach(o => o.classList.toggle('active', o === opt));
    });
  });
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedColor = opt.dataset.color;
      document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('active', o === opt));
    });
  });
  document.getElementById('categoryModalConfirm').addEventListener('click', () => {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) { showToast('请输入分类名称', 'error'); return; }

    if (editingCategoryId) {
      const cat = categories.find(c => c.id === editingCategoryId);
      if (cat) { cat.name = name; cat.icon = selectedIcon; cat.color = selectedColor; }
      showToast('分类修改成功', 'success');
    } else {
      const newId = 'cat_' + Date.now();
      categories.push({ id: newId, name, icon: selectedIcon, color: selectedColor });
      showToast('分类创建成功', 'success');
    }
    closeModal('categoryModal');
    renderCategories();
    renderLibraryPapers();
  });
}

// ==================== 移动文献 ====================

function openMovePaperModal(paperId) {
  movingPaperId = paperId;
  const paper = papers.find(p => p.id === paperId);
  document.getElementById('movePaperTitle').textContent = `选择目标分类（当前：${paper?.title.substring(0, 30)}...）`;

  let html = `<div class="move-category-item ${!paper?.category ? 'active' : ''}" data-id="null">
    <span class="category-icon">📁</span><span>未分类</span>
  </div>`;
  html += categories.map(cat => `
    <div class="move-category-item ${paper?.category === cat.id ? 'active' : ''}" data-id="${cat.id}">
      <span class="category-icon">${cat.icon}</span><span>${cat.name}</span>
    </div>`).join('');

  document.getElementById('moveCategoryList').innerHTML = html;
  document.querySelectorAll('.move-category-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.id === 'null' ? null : item.dataset.id;
      const p = papers.find(p => p.id === movingPaperId);
      if (p) { p.category = targetId; }
      closeModal('movePaperModal');
      renderCategories();
      renderLibraryPapers();
      showToast('文献已移动', 'success');
    });
  });
  openModal('movePaperModal');
}

function initMovePaperModal() {}

function deletePaper(paperId) {
  const paper = papers.find(p => p.id === paperId);
  if (paper && confirm(`确定要删除"${paper.title.substring(0, 40)}..."吗？`)) {
    papers = papers.filter(p => p.id !== paperId);
    renderCategories();
    renderLibraryPapers();
    showToast('文献已删除', 'success');
  }
}

// ==================== 设置 - 网站管理 ====================

function initSettings() {
  document.getElementById('addSiteBtn').addEventListener('click', openAddSiteModal);
  // 通用设置保存
  ['settingDefaultLimit', 'settingAutoDedup', 'settingNotify', 'settingSavePath', 'settingNamingRule'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => showToast('设置已保存', 'success'));
  });
  renderSiteList();
}

function renderSiteList() {
  document.getElementById('siteList').innerHTML = sites.map(site => {
    let loginBadge = '';
    if (!site.requiresLogin) {
      loginBadge = '<span class="status-tag status-tag-blue">无需登录</span>';
    } else if (site.loginStatus === 'logged_in') {
      loginBadge = '<span class="status-tag status-tag-green">✅ 已登录</span>';
    } else {
      loginBadge = '<span class="status-tag status-tag-red">❌ 未登录</span>';
    }

    return `
      <div class="site-item">
        <div class="site-info">
          <div class="site-icon">${site.icon}</div>
          <div>
            <div class="site-name-row">
              ${site.name}
              ${site.isBuiltIn ? '<span class="site-badge">内置</span>' : '<span class="site-badge site-badge-custom">自定义</span>'}
            </div>
            <div class="site-url">${site.baseUrl}</div>
          </div>
        </div>
        <div class="site-controls">
          ${loginBadge}
          ${site.requiresLogin && site.loginStatus !== 'logged_in' ? `<button class="btn btn-secondary btn-sm site-login-btn" data-id="${site.id}">前往登录</button>` : ''}
          <label class="toggle-switch">
            <input type="checkbox" class="site-toggle" data-id="${site.id}" ${site.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          ${!site.isBuiltIn ? `
            <button class="btn-icon-only site-edit-btn" data-id="${site.id}" title="编辑">✏️</button>
            <button class="btn-icon-only site-delete-btn" data-id="${site.id}" title="删除">🗑️</button>
          ` : ''}
        </div>
      </div>`;
  }).join('');

  // 绑定事件
  document.querySelectorAll('.site-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const site = sites.find(s => s.id === toggle.dataset.id);
      if (site) {
        site.enabled = toggle.checked;
        showToast(`${site.name} 已${site.enabled ? '启用' : '禁用'}`, 'success');
        renderSearchSiteCheckboxes();
        renderTaskSiteCheckboxes();
      }
    });
  });

  document.querySelectorAll('.site-login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = sites.find(s => s.id === btn.dataset.id);
      if (site) {
        showToast(`正在打开 ${site.name} 登录页面...\n请在浏览器中完成登录，登录后插件会自动复用会话`, 'info');
        setTimeout(() => {
          site.loginStatus = 'logged_in';
          renderSiteList();
          showToast(`${site.name} 登录成功！现在可以使用「当前页面抓取」模式`, 'success');
        }, 2000);
      }
    });
  });

  document.querySelectorAll('.site-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditSiteModal(btn.dataset.id));
  });

  document.querySelectorAll('.site-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const site = sites.find(s => s.id === btn.dataset.id);
      if (site && confirm(`确定要删除自定义网站"${site.name}"吗？`)) {
        sites = sites.filter(s => s.id !== site.id);
        renderSiteList();
        renderSearchSiteCheckboxes();
        renderTaskSiteCheckboxes();
        showToast('网站已删除', 'success');
      }
    });
  });
}

function renderSearchSiteCheckboxes() {
  const enabledSites = sites.filter(s => s.enabled);
  document.getElementById('searchSiteCheckboxes').innerHTML = enabledSites.map(site => `
    <label class="site-checkbox">
      <input type="checkbox" value="${site.id}" checked>
      <span class="checkbox-custom"></span>
      <span class="site-name">${site.icon} ${site.name}</span>
    </label>`).join('');
}

function renderTaskSiteCheckboxes() {
  const enabledSites = sites.filter(s => s.enabled);
  document.getElementById('taskSiteCheckboxes').innerHTML = enabledSites.map(site => `
    <label class="form-checkbox">
      <input type="checkbox" value="${site.id}" checked>
      <span class="checkbox-custom"></span>
      <span>${site.icon} ${site.name}</span>
    </label>`).join('');
}

// ==================== 网站CRUD弹窗 ====================

function openAddSiteModal() {
  editingSiteId = null;
  document.getElementById('siteModalTitle').textContent = '添加自定义网站';
  document.getElementById('siteModalConfirm').textContent = '确认添加';
  ['siteName', 'siteBaseUrl', 'siteSearchUrl', 'siteIcon', 'siteLoginUrl', 'selectorResultItem', 'selectorTitle', 'selectorAuthors', 'selectorPdfLink'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('siteRequiresLogin').checked = false;
  document.getElementById('loginUrlGroup').style.display = 'none';
  openModal('siteModal');
}

function openEditSiteModal(siteId) {
  const site = sites.find(s => s.id === siteId);
  if (!site) return;
  editingSiteId = siteId;
  document.getElementById('siteModalTitle').textContent = '编辑自定义网站';
  document.getElementById('siteModalConfirm').textContent = '确认修改';
  document.getElementById('siteName').value = site.name;
  document.getElementById('siteBaseUrl').value = site.baseUrl;
  document.getElementById('siteSearchUrl').value = site.searchUrl;
  document.getElementById('siteIcon').value = site.icon;
  document.getElementById('siteRequiresLogin').checked = site.requiresLogin;
  document.getElementById('siteLoginUrl').value = site.loginUrl || '';
  document.getElementById('loginUrlGroup').style.display = site.requiresLogin ? 'block' : 'none';
  document.getElementById('selectorResultItem').value = site.selectors?.resultItem || '';
  document.getElementById('selectorTitle').value = site.selectors?.title || '';
  document.getElementById('selectorAuthors').value = site.selectors?.authors || '';
  document.getElementById('selectorPdfLink').value = site.selectors?.pdfLink || '';
  openModal('siteModal');
}

function initSiteModal() {
  document.getElementById('siteRequiresLogin').addEventListener('change', e => {
    document.getElementById('loginUrlGroup').style.display = e.target.checked ? 'block' : 'none';
  });

  document.getElementById('siteModalConfirm').addEventListener('click', () => {
    const name = document.getElementById('siteName').value.trim();
    const baseUrl = document.getElementById('siteBaseUrl').value.trim();
    const searchUrl = document.getElementById('siteSearchUrl').value.trim();
    if (!name) { showToast('请输入网站名称', 'error'); return; }
    if (!baseUrl) { showToast('请输入网站地址', 'error'); return; }
    if (!searchUrl) { showToast('请输入搜索URL模板', 'error'); return; }

    const icon = document.getElementById('siteIcon').value.trim() || '📄';
    const requiresLogin = document.getElementById('siteRequiresLogin').checked;
    const loginUrl = document.getElementById('siteLoginUrl').value.trim();
    const selectors = {
      resultItem: document.getElementById('selectorResultItem').value.trim(),
      title: document.getElementById('selectorTitle').value.trim(),
      authors: document.getElementById('selectorAuthors').value.trim(),
      pdfLink: document.getElementById('selectorPdfLink').value.trim(),
    };

    if (editingSiteId) {
      const site = sites.find(s => s.id === editingSiteId);
      if (site) {
        Object.assign(site, { name, baseUrl, searchUrl, icon, requiresLogin, loginUrl, selectors });
      }
      showToast('网站修改成功', 'success');
    } else {
      const newId = 'custom_' + Date.now();
      sites.push({
        id: newId, name, baseUrl, searchUrl, icon, requiresLogin, loginUrl,
        enabled: true, isBuiltIn: false,
        loginStatus: requiresLogin ? 'logged_out' : 'none',
        selectors
      });
      showToast('网站添加成功', 'success');
    }
    closeModal('siteModal');
    renderSiteList();
    renderSearchSiteCheckboxes();
    renderTaskSiteCheckboxes();
  });
}

// ==================== 检索历史 ====================

function renderHistory() {
  const container = document.getElementById('historyList');
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state empty-state-inline">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-desc">暂无检索历史</div>
      </div>`;
    return;
  }
  container.innerHTML = history.map(item => `
    <div class="history-item" data-keyword="${item.keyword}">
      <span class="history-keyword">🔍 ${item.keyword}</span>
      <div class="history-meta">
        <span class="history-date">${item.date}</span>
        <span class="history-count">${item.count} 篇</span>
      </div>
    </div>`).join('');

  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('searchKeyword').value = item.dataset.keyword;
      navigateTo('search');
      performSearch();
    });
  });
}

function addToHistory(keyword, count) {
  const existing = history.find(h => h.keyword === keyword);
  const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
  if (existing) {
    existing.date = now;
    existing.count = count;
    history = history.filter(h => h.keyword !== keyword);
    history.unshift(existing);
  } else {
    history.unshift({ id: Date.now(), keyword, date: now, count });
    if (history.length > 20) history.pop();
  }
  renderHistory();
}

// ==================== 亮点卡片与使用场景跳转 ====================

function initHighlightCards() {
  // 亮点卡片点击
  document.querySelectorAll('.highlight-card[data-action]').forEach(card => {
    card.addEventListener('click', () => handleHighlightAction(card.dataset.action));
  });
  // 使用场景点击
  document.querySelectorAll('.use-case-item[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'preset-search') {
        document.getElementById('searchKeyword').value = item.dataset.keyword;
        performSearch();
      } else {
        handleHighlightAction(action);
      }
    });
  });
}

function handleHighlightAction(action) {
  switch (action) {
    case 'ai-expand':
      // 聚焦搜索框，高亮 AI 扩展按钮
      document.getElementById('searchKeyword').focus();
      const keyword = document.getElementById('searchKeyword').value.trim();
      if (!keyword) {
        showToast('请先输入关键词，再点击 AI 扩展', 'info');
        return;
      }
      expandKeywordsWithAI();
      // 高亮闪烁 AI 按钮
      const aiBtn = document.getElementById('aiExpandBtn');
      aiBtn.style.animation = 'highlightPulse 0.6s ease 3';
      setTimeout(() => { aiBtn.style.animation = ''; }, 1800);
      break;
    case 'current-tab':
      // 切换到当前页面抓取模式
      document.querySelector('.mode-tab[data-mode="current"]').click();
      document.getElementById('currentTabPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('已切换到「当前页面抓取」模式', 'info');
      break;
    case 'goto-scheduler':
      navigateTo('scheduler');
      showToast('已跳转到定时任务页面', 'info');
      break;
    case 'goto-library':
      navigateTo('library');
      showToast('已跳转到文献库页面', 'info');
      break;
  }
}

// ==================== TRAE AI 能力集成 ====================

function initAiFeatures() {
  // AI 关键词扩展
  document.getElementById('aiExpandBtn').addEventListener('click', expandKeywordsWithAI);
  document.getElementById('closeAiPanel').addEventListener('click', () => {
    document.getElementById('aiExpandPanel').style.display = 'none';
  });
  // AI 智能分类
  document.getElementById('aiCategorizeBtn').addEventListener('click', smartCategorizeWithAI);
}

// AI 智能关键词扩展
function expandKeywordsWithAI() {
  const keyword = document.getElementById('searchKeyword').value.trim();
  if (!keyword) {
    showToast('请先输入关键词，AI 再为您智能扩展', 'error');
    return;
  }

  const btn = document.getElementById('aiExpandBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span><span>AI 分析中...</span>';

  const panel = document.getElementById('aiExpandPanel');
  const result = document.getElementById('aiExpandResult');
  panel.style.display = 'block';
  result.innerHTML = `
    <div class="ai-loading">
      <div class="ai-loading-dots"><span></span><span></span><span></span></div>
      <p>TRAE AI 正在分析关键词并智能扩展...</p>
    </div>`;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<span>🤖</span><span>AI 扩展</span>';

    // 模拟 AI 扩展结果
    const expansions = generateAIKeywordExpansions(keyword);
    result.innerHTML = `
      <div class="ai-expand-section">
        <div class="ai-section-title">📋 同义词扩展 <span class="ai-section-hint">点击标签直接搜索</span></div>
        <div class="ai-keyword-tags">${expansions.synonyms.map(k => `<span class="ai-keyword-tag" data-keyword="${k}">${k}</span>`).join('')}</div>
      </div>
      <div class="ai-expand-section">
        <div class="ai-section-title">🔗 相关技术 <span class="ai-section-hint">点击标签直接搜索</span></div>
        <div class="ai-keyword-tags">${expansions.related.map(k => `<span class="ai-keyword-tag" data-keyword="${k}">${k}</span>`).join('')}</div>
      </div>
      <div class="ai-expand-section">
        <div class="ai-section-title">📈 前沿方向 <span class="ai-section-hint">点击标签直接搜索</span></div>
        <div class="ai-keyword-tags">${expansions.frontier.map(k => `<span class="ai-keyword-tag" data-keyword="${k}">${k}</span>`).join('')}</div>
      </div>
      <div class="ai-expand-section">
        <div class="ai-section-title">✨ 推荐组合检索式</div>
        <div class="ai-combined-query">${expansions.combined}</div>
        <div class="ai-expand-actions">
          <button class="btn btn-primary btn-sm" id="useCombinedQuery"><span>🔍</span><span>使用此检索式搜索</span></button>
          <button class="btn btn-secondary btn-sm" id="addAllKeywords"><span>➕</span><span>全部加入并搜索</span></button>
        </div>
      </div>`;

    // 点击关键词标签直接触发搜索
    document.querySelectorAll('.ai-keyword-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.getElementById('searchKeyword').value = tag.dataset.keyword;
        panel.style.display = 'none';
        performSearch();
        showToast(`正在搜索：${tag.dataset.keyword}`, 'success');
      });
    });
    // 使用组合检索式搜索
    document.getElementById('useCombinedQuery').addEventListener('click', () => {
      document.getElementById('searchKeyword').value = expansions.combined;
      panel.style.display = 'none';
      performSearch();
    });
    // 全部关键词加入搜索（用 OR 连接）
    document.getElementById('addAllKeywords').addEventListener('click', () => {
      const allKeywords = [...expansions.synonyms.slice(0, 3), ...expansions.related.slice(0, 2)].join(' OR ');
      document.getElementById('searchKeyword').value = allKeywords;
      panel.style.display = 'none';
      performSearch();
      showToast('已组合多个关键词搜索', 'success');
    });

    showToast('AI 关键词扩展完成，点击任意标签即可搜索', 'success');
  }, 1500);
}

function generateAIKeywordExpansions(keyword) {
  const kw = keyword.toLowerCase();
  if (kw.includes('graph') || kw.includes('gnn')) {
    return {
      synonyms: ['graph neural network', 'GNN', 'graph convolution', '图神经网络', 'graph attention network', 'GAT', 'GCN'],
      related: ['node classification', 'graph embedding', 'knowledge graph', 'message passing', 'graph transformer'],
      frontier: ['heterogeneous graph', 'temporal graph network', 'graph contrastive learning', 'large graph model', 'graph pre-training'],
      combined: 'graph neural network AND (survey OR review) AND (2023 OR 2024)'
    };
  } else if (kw.includes('transformer') || kw.includes('attention')) {
    return {
      synonyms: ['transformer', 'self-attention', 'multi-head attention', '注意力机制', 'vision transformer', 'ViT'],
      related: ['BERT', 'GPT', 'encoder-decoder', 'positional encoding', 'attention mechanism'],
      frontier: ['efficient transformer', 'linear attention', 'flash attention', 'multimodal transformer', 'transformer compression'],
      combined: 'transformer AND (survey OR architecture) AND recent advances'
    };
  } else {
    return {
      synonyms: [keyword, keyword + ' survey', keyword + ' review', keyword + ' 综述', keyword + ' advances'],
      related: ['deep learning', 'machine learning', 'neural network', 'optimization', 'representation learning'],
      frontier: [keyword + ' 2024', keyword + ' latest', keyword + ' SOTA', keyword + ' benchmark', keyword + ' large model'],
      combined: `${keyword} AND (survey OR review OR advances) AND (2023 OR 2024)`
    };
  }
}

// AI 论文智能摘要
function showAISummary(paperId, source) {
  const paper = source === 'search' ? searchResults.find(p => p.id === paperId) : papers.find(p => p.id === paperId);
  if (!paper) return;

  // 记录当前摘要对应的论文，供操作按钮使用
  window.currentAISummaryPaper = paper;
  window.currentAISummarySource = source;

  document.getElementById('aiSummaryPaperTitle').textContent = paper.title;
  document.getElementById('aiSummaryContent').innerHTML = `
    <div class="ai-loading">
      <div class="ai-loading-dots"><span></span><span></span><span></span></div>
      <p>TRAE AI 正在深度分析论文...</p>
    </div>`;
  openModal('aiSummaryModal');

  setTimeout(() => {
    const summary = generateAISummary(paper);
    document.getElementById('aiSummaryContent').innerHTML = summary;
    bindAISummaryActions(paper, source);
  }, 1800);
}

function bindAISummaryActions(paper, source) {
  // 搜索相关文献：提取标题关键词进行搜索
  document.getElementById('aiSummarySearchRelated')?.addEventListener('click', () => {
    const searchTerms = paper.title.split(/[::,]/).slice(0, 2).join(' ').trim();
    closeModal('aiSummaryModal');
    navigateTo('search');
    // 确保在多站检索模式
    document.querySelector('.mode-tab[data-mode="multi"]').click();
    document.getElementById('searchKeyword').value = searchTerms;
    performSearch();
    showToast(`正在搜索相关文献：${searchTerms.substring(0, 30)}...`, 'info');
  });

  // 复制摘要
  document.getElementById('aiSummaryCopy')?.addEventListener('click', () => {
    const summaryText = `【${paper.title}】\n来源：${paper.source} (${paper.year})\n引用：${paper.citations.toLocaleString()}\n\n摘要：${paper.abstract}\n\nAI 分析：${paper.relevance === 'strong' ? '强相关，建议精读' : paper.relevance === 'medium' ? '中相关，建议选读' : '弱相关，可快速浏览'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText).then(() => {
        showToast('摘要已复制到剪贴板', 'success');
      }).catch(() => {
        showToast('复制失败，请手动选择文本复制', 'error');
      });
    } else {
      showToast('当前浏览器不支持自动复制', 'error');
    }
  });

  // 下载文献（如果在搜索结果中）
  document.getElementById('aiSummaryDownload')?.addEventListener('click', () => {
    if (source === 'search') {
      downloadPaper(paper.id);
      closeModal('aiSummaryModal');
    } else {
      showToast('该文献已在文献库中', 'info');
    }
  });

  // 移动到分类（如果在文献库中）
  document.getElementById('aiSummaryMove')?.addEventListener('click', () => {
    if (source === 'library') {
      closeModal('aiSummaryModal');
      openMovePaperModal(paper.id);
    } else {
      // 先下载再移动
      downloadPaper(paper.id);
      closeModal('aiSummaryModal');
      setTimeout(() => {
        navigateTo('library');
        openMovePaperModal(paper.id);
      }, 1200);
    }
  });
}

function generateAISummary(paper) {
  const keyPoints = [
    `本文发表于 ${paper.year} 年，来自 ${paper.source}，已被引用 ${paper.citations.toLocaleString()} 次，影响力${paper.citations > 5000 ? '极高' : paper.citations > 1000 ? '较高' : '中等'}。`,
    `研究主题聚焦于${paper.title.split(':')[0]}领域，主要贡献在于${paper.abstract.substring(0, 60)}...`,
    `核心技术路线采用${['深度学习方法', '神经网络架构', '端到端学习框架', '多模态融合策略'][paper.id % 4]}，在多个基准数据集上取得了显著性能提升。`
  ];

  const isDownloaded = papers.some(p => p.id === paper.id);
  const sourceLabel = window.currentAISummarySource === 'library' ? '文献库' : '搜索结果';

  return `
    <div class="ai-summary-section">
      <div class="ai-section-title">📝 一句话总结</div>
      <p class="ai-summary-text">${paper.abstract.substring(0, 120)}...</p>
    </div>
    <div class="ai-summary-section">
      <div class="ai-section-title">🔍 核心要点</div>
      <ul class="ai-key-points">
        ${keyPoints.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
    <div class="ai-summary-section">
      <div class="ai-section-title">💡 研究价值</div>
      <p class="ai-summary-text">该论文在相关领域具有${paper.relevance === 'strong' ? '重要的理论和实践参考价值，建议精读' : paper.relevance === 'medium' ? '一定的参考价值，建议选读核心章节' : '辅助参考价值，可快速浏览了解趋势'}。</p>
    </div>
    <div class="ai-summary-section">
      <div class="ai-section-title">🏷️ AI 推荐标签</div>
      <div class="ai-keyword-tags">
        <span class="ai-keyword-tag">${paper.year}年发表</span>
        <span class="ai-keyword-tag">${paper.source}</span>
        <span class="ai-keyword-tag">${paper.citations > 1000 ? '高引文献' : '新兴文献'}</span>
        <span class="ai-keyword-tag">${paper.relevance === 'strong' ? '强相关' : paper.relevance === 'medium' ? '中相关' : '弱相关'}</span>
      </div>
    </div>
    <div class="ai-summary-actions">
      <button class="btn btn-ai btn-sm" id="aiSummarySearchRelated"><span>🔍</span><span>搜索相关文献</span></button>
      <button class="btn btn-secondary btn-sm" id="aiSummaryCopy"><span>📋</span><span>复制摘要</span></button>
      ${window.currentAISummarySource === 'search' && !isDownloaded
        ? `<button class="btn btn-primary btn-sm" id="aiSummaryDownload"><span>⬇️</span><span>下载此文献</span></button>`
        : ''}
      <button class="btn btn-secondary btn-sm" id="aiSummaryMove"><span>📂</span><span>${window.currentAISummarySource === 'library' ? '移动分类' : '下载并分类'}</span></button>
    </div>`;
}

// AI 智能分类
function smartCategorizeWithAI() {
  const uncategorized = papers.filter(p => !p.category || !categories.some(c => c.id === p.category));
  if (uncategorized.length === 0) {
    showToast('所有文献已分类，无需 AI 智能分类', 'info');
    return;
  }

  const btn = document.getElementById('aiCategorizeBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span><span>AI 分析中...</span>';
  showToast(`TRAE AI 正在为 ${uncategorized.length} 篇未分类文献智能匹配分类...`, 'info');

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<span>🤖</span><span>AI 智能分类</span>';

    const results = [];
    uncategorized.forEach(paper => {
      const matched = matchPaperToCategory(paper);
      if (matched) {
        paper.category = matched;
        paper.aiCategorized = true;
        results.push({ paper, categoryId: matched });
      }
    });

    renderCategories();
    renderLibraryPapers();
    // 高亮被 AI 分类的文献
    highlightAICategorizedPapers(results);
    // 显示分类结果摘要
    showCategorizationResult(results);
  }, 2000);
}

function highlightAICategorizedPapers(results) {
  results.forEach(({ paper }) => {
    const card = document.querySelector(`.paper-action-btn[data-id="${paper.id}"]`)?.closest('.library-paper-card');
    if (card) {
      card.classList.add('ai-categorized-highlight');
      // 添加 AI 分类标记
      if (!card.querySelector('.ai-cat-badge')) {
        const badge = document.createElement('div');
        badge.className = 'ai-cat-badge';
        badge.innerHTML = '<span class="ai-badge">🤖 AI</span>';
        card.querySelector('.library-paper-header')?.appendChild(badge);
      }
    }
  });
  // 3秒后移除高亮
  setTimeout(() => {
    document.querySelectorAll('.ai-categorized-highlight').forEach(el => {
      el.classList.remove('ai-categorized-highlight');
    });
  }, 5000);
}

function showCategorizationResult(results) {
  if (results.length === 0) {
    showToast('AI 未能匹配分类，请先创建分类', 'error');
    return;
  }
  // 按分类统计
  const stats = {};
  results.forEach(({ categoryId }) => {
    stats[categoryId] = (stats[categoryId] || 0) + 1;
  });
  const summary = Object.entries(stats).map(([catId, count]) => {
    const cat = categories.find(c => c.id === catId);
    return `${cat?.icon} ${cat?.name}: ${count} 篇`;
  }).join('，');
  showToast(`AI 智能分类完成！共 ${results.length} 篇\n${summary}`, 'success');
}

function matchPaperToCategory(paper) {
  const text = (paper.title + ' ' + paper.abstract).toLowerCase();
  if (categories.length === 0) return null;
  const rules = {
    'deep-learning': ['deep learning', 'neural network', 'cnn', 'rnn', 'gan', 'transformer', 'attention', 'bert', 'embedding', '深度学习', '神经网络'],
    'nlp': ['language', 'text', 'translation', 'summarization', 'sentiment', 'nlp', 'bert', 'gpt', 'machine translation', '自然语言', '文本'],
    'cv': ['image', 'vision', 'object detection', 'segmentation', 'visual', 'convolutional', '图像', '视觉', '检测']
  };
  for (const cat of categories) {
    if (rules[cat.id]) {
      if (rules[cat.id].some(kw => text.includes(kw))) return cat.id;
    }
  }
  return categories[0].id;
}

// ==================== 弹窗管理 ====================

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function initModalClosers() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      overlay.parentElement.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-footer .btn-secondary').forEach(btn => {
    if (btn.dataset.modal) btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
}

// ==================== 工具函数 ====================

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}
