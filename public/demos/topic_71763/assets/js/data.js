/**
 * Project: 隐私守护 - 酒店针孔摄像头举报与查询平台
 * Author: Schinx
 * Description: 共享数据与工具函数
 */

// 共享数据与工具函数

// Mock 数据
const MOCK_HOTELS = [
  {
    id: 1,
    name: '城市之星大酒店',
    address: '北京市朝阳区建国路88号',
    city: '北京',
    province: '北京市',
    longitude: 116.480881,
    latitude: 39.914912,
    source: 'gaode',
    external_id: 'B000A83M61',
    risk_score: 3,
    report_count: 5,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop'
  },
  {
    id: 2,
    name: '海景花园民宿',
    address: '厦门市思明区鼓浪屿路126号',
    city: '厦门',
    province: '福建省',
    longitude: 118.089425,
    latitude: 24.448044,
    source: 'ctrip',
    external_id: 'CT_350203_001',
    risk_score: 1,
    report_count: 1,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop'
  },
  {
    id: 3,
    name: '锦江之星商务酒店',
    address: '上海市浦东新区陆家嘴环路100号',
    city: '上海',
    province: '上海市',
    longitude: 121.508458,
    latitude: 31.239703,
    source: 'qunar',
    external_id: 'QN_310115_002',
    risk_score: 2,
    report_count: 3,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop'
  },
  {
    id: 4,
    name: '竹林精品民宿',
    address: '杭州市西湖区灵隐路58号',
    city: '杭州',
    province: '浙江省',
    longitude: 120.113853,
    latitude: 30.246722,
    source: 'meituan',
    external_id: 'MT_330106_003',
    risk_score: 4,
    report_count: 7,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop'
  },
  {
    id: 5,
    name: '如家快捷酒店',
    address: '广州市天河区体育西路200号',
    city: '广州',
    province: '广东省',
    longitude: 113.328774,
    latitude: 23.138566,
    source: 'ctrip',
    external_id: 'CT_440106_004',
    risk_score: 2,
    report_count: 2,
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop'
  },
  {
    id: 6,
    name: '香格里拉大酒店',
    address: '深圳市福田区益田路1001号',
    city: '深圳',
    province: '广东省',
    longitude: 114.059528,
    latitude: 22.542883,
    source: 'gaode',
    external_id: 'B02F80O7LJ',
    risk_score: 1,
    report_count: 0,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop'
  }
];

const MOCK_REPORTS = [
  {
    id: 1,
    user_id: 1,
    user_name: '安小暖',
    user_verified: true,
    user_verify_type: 'alipay',
    hotel_id: 1,
    hotel_name: '城市之星大酒店',
    description: '在床头板上方的烟雾报警器内发现针孔摄像头，正对床铺位置。已报警处理。',
    photo_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=400&fit=crop',
    police_case_id: '京朝公(建)受案字[2024]第1234号',
    risk_score: 4,
    rectification_feedback: '酒店已拆除设备并进行全面排查',
    incident_date: '2024-12-15',
    created_at: '2024-12-15T10:30:00Z',
    status: '已处理'
  },
  {
    id: 2,
    user_id: 1,
    user_name: '安小暖',
    user_verified: true,
    user_verify_type: 'alipay',
    hotel_id: 4,
    hotel_name: '竹林精品民宿',
    description: '浴室镜子发现双面镜，后方藏有摄像头设备。',
    photo_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&h=400&fit=crop',
    police_case_id: '',
    risk_score: 5,
    rectification_feedback: '',
    incident_date: '2025-01-20',
    created_at: '2025-01-20T14:20:00Z',
    status: '处理中'
  },
  {
    id: 3,
    user_id: 2,
    user_name: '旅行的鱼',
    user_verified: true,
    user_verify_type: 'taobao',
    hotel_id: 1,
    hotel_name: '城市之星大酒店',
    description: '电视柜内发现隐蔽摄像头，镜头朝向沙发区域。',
    photo_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&h=400&fit=crop',
    police_case_id: '京朝公(建)受案字[2025]第0567号',
    risk_score: 3,
    rectification_feedback: '已整改并加强安保巡查',
    incident_date: '2025-02-10',
    created_at: '2025-02-10T09:15:00Z',
    status: '已处理'
  },
  {
    id: 4,
    user_id: 3,
    user_name: '柠檬不萌',
    user_verified: true,
    user_verify_type: 'alipay',
    hotel_id: 2,
    hotel_name: '海景花园民宿',
    description: '空调出风口内发现微型摄像头。',
    photo_url: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&h=400&fit=crop',
    police_case_id: '',
    risk_score: 2,
    rectification_feedback: '民宿主已拆除并道歉',
    incident_date: '2025-03-05',
    created_at: '2025-03-05T16:45:00Z',
    status: '已处理'
  },
  {
    id: 5,
    user_id: 1,
    user_name: '安小暖',
    user_verified: true,
    user_verify_type: 'alipay',
    hotel_id: 4,
    hotel_name: '竹林精品民宿',
    description: '客厅台灯底座发现隐藏摄像头。',
    photo_url: '',
    police_case_id: '',
    risk_score: 3,
    rectification_feedback: '',
    incident_date: '2025-04-12',
    created_at: '2025-04-12T11:00:00Z',
    status: '待审核'
  }
];

const MOCK_KNOWLEDGE_CATEGORIES = [
  { id: 1, name: '识别技巧', icon: '🔍' },
  { id: 2, name: '常见设备', icon: '📷' },
  { id: 3, name: '检查方法', icon: '🛠️' },
  { id: 4, name: '维权指南', icon: '⚖️' }
];

const MOCK_KNOWLEDGE_ARTICLES = [
  {
    id: 1,
    category_id: 1,
    title: '如何快速识别针孔摄像头',
    content: `
      <h3>一、肉眼观察法</h3>
      <p>仔细检查房间内可能隐藏摄像头的位置：烟雾报警器、电源插座、吹风机、电视机、音响、台灯、空调出风口、天花板等。</p>
      <h3>二、手机检测法</h3>
      <p>1. 关闭房间灯光，拉上窗帘，使房间处于黑暗状态</p>
      <p>2. 打开手机相机，但不要开闪光灯</p>
      <p>3. 用手机摄像头扫描房间各个角落</p>
      <p>4. 如果屏幕上出现红色或紫色光点，可能是摄像头的红外补光灯</p>
      <h3>三、专业设备检测</h3>
      <p>可以购买专业的无线电波探测器或红外探测器，这些设备能更准确地检测隐藏摄像头。</p>
    `
  },
  {
    id: 2,
    category_id: 2,
    title: '常见针孔摄像头伪装方式',
    content: `
      <h3>常见伪装物品</h3>
      <ul>
        <li><strong>烟雾报警器</strong> - 天花板上的烟雾报警器是最常见的藏点之一</li>
        <li><strong>电源插座/排插</strong> - 插座的小孔中可能藏有摄像头</li>
        <li><strong>路由器/电视机顶盒</strong> - 电子设备内部容易隐藏</li>
        <li><strong>镜子</strong> - 双面镜后可能安装摄像头</li>
        <li><strong>装饰摆件/花瓶</strong> - 装饰品的缝隙中可能藏有镜头</li>
        <li><strong>沐浴露/洗发水</strong> - 浴室的洗漱用品瓶可能被改造</li>
        <li><strong>消防喷淋头</strong> - 天花板喷淋装置内可能藏有摄像头</li>
        <li><strong>空调出风口</strong> - 出风口格栅后面是常见位置</li>
      </ul>
    `
  },
  {
    id: 3,
    category_id: 3,
    title: '入住酒店安全检查步骤',
    content: `
      <h3>入住检查清单</h3>
      <h4>第一步：整体观察</h4>
      <p>进入房间后，先整体扫视一遍，注意是否有异常的设备或装饰。</p>
      <h4>第二步：重点区域排查</h4>
      <p>1. 检查床头区域：床头柜、床头板、台灯、闹钟</p>
      <p>2. 检查浴室：镜子、沐浴用品、吹风机、通风口</p>
      <p>3. 检查客厅/电视区：电视机、机顶盒、路由器、音响</p>
      <p>4. 检查天花板：烟雾报警器、消防喷淋、灯具</p>
      <h4>第三步：技术检测</h4>
      <p>使用手机摄像头或专业设备进行红外检测。</p>
      <h4>第四步：隐私保护</h4>
      <p>发现可疑物品时，先拍照留证，然后联系酒店前台或报警。</p>
    `
  },
  {
    id: 4,
    category_id: 4,
    title: '发现针孔摄像头后如何维权',
    content: `
      <h3>一、立即取证</h3>
      <p>1. 不要移动或破坏可疑设备</p>
      <p>2. 用手机拍照、录像记录现场情况</p>
      <p>3. 记录发现时间、地点、设备位置等详细信息</p>
      <h3>二、报警处理</h3>
      <p>立即拨打 110 报警，要求警方出警调查。警方会收集证据并依法处理。</p>
      <h3>三、联系平台/酒店</h3>
      <p>如果是通过平台预订的，及时联系平台客服投诉，要求协助处理。</p>
      <h3>四、法律维权</h3>
      <p>根据《民法典》和《治安管理处罚法》，偷窥、偷拍属于违法行为，可以要求民事赔偿。情节严重的，可能构成刑事犯罪。</p>
      <h3>五、保留证据</h3>
      <p>保留好所有证据：照片、视频、报警回执、住宿记录、沟通记录等，以备后续维权使用。</p>
    `
  }
];

const MOCK_USER = {
  id: 1,
  username: '安全达人',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=safety',
  phone: '138****8888',
  report_count: 3,
  favorite_count: 5
};

// 存储工具函数
const Storage = {
  // 获取酒店列表
  getHotels() {
    const stored = localStorage.getItem('hotels');
    if (!stored) {
      localStorage.setItem('hotels', JSON.stringify(MOCK_HOTELS));
      return MOCK_HOTELS;
    }
    return JSON.parse(stored);
  },

  // 获取单个酒店
  getHotel(id) {
    const hotels = this.getHotels();
    return hotels.find(h => h.id === parseInt(id));
  },

  // 搜索酒店
  searchHotels(keyword) {
    const hotels = this.getHotels();
    if (!keyword) return hotels;
    keyword = keyword.toLowerCase();
    return hotels.filter(h =>
      h.name.toLowerCase().includes(keyword) ||
      h.city.toLowerCase().includes(keyword) ||
      h.address.toLowerCase().includes(keyword)
    );
  },

  // 获取举报列表
  getReports(hotelId = null) {
    const stored = localStorage.getItem('reports');
    let reports;
    if (!stored) {
      localStorage.setItem('reports', JSON.stringify(MOCK_REPORTS));
      reports = MOCK_REPORTS;
    } else {
      reports = JSON.parse(stored);
    }
    if (hotelId) {
      return reports.filter(r => r.hotel_id === parseInt(hotelId));
    }
    return reports;
  },

  // 获取单个举报
  getReport(id) {
    const reports = this.getReports();
    return reports.find(r => r.id === parseInt(id));
  },

  // 添加举报
  addReport(report) {
    const reports = this.getReports();
    const user = this.getCurrentUser() || {};
    const newReport = {
      id: reports.length + 1,
      user_id: user.id || 1,
      user_name: user.username || '匿名用户',
      user_verified: !!user.verified,
      user_verify_type: user.verifyType || 'alipay',
      status: '待审核',
      created_at: new Date().toISOString(),
      ...report
    };
    reports.unshift(newReport);
    localStorage.setItem('reports', JSON.stringify(reports));

    // 更新酒店风险评分
    const hotels = this.getHotels();
    const hotel = hotels.find(h => h.id === report.hotel_id);
    if (hotel) {
      hotel.report_count = (hotel.report_count || 0) + 1;
      const hotelReports = reports.filter(r => r.hotel_id === hotel.id);
      const totalScore = hotelReports.reduce((sum, r) => sum + (r.risk_score || 3), 0);
      hotel.risk_score = Math.round(totalScore / hotelReports.length);
      localStorage.setItem('hotels', JSON.stringify(hotels));
    }

    // 添加到我的举报
    const myReports = this.getMyReports();
    myReports.unshift(newReport);
    localStorage.setItem('myReports', JSON.stringify(myReports));

    return newReport;
  },

  // 获取我的举报
  getMyReports() {
    const stored = localStorage.getItem('myReports');
    const currentUser = this.getCurrentUser();
    if (!stored) {
      // 如果用户已登录，默认返回所有模拟举报数据作为演示
      const myReports = currentUser ? MOCK_REPORTS : MOCK_REPORTS.filter(r => r.user_id === 1);
      localStorage.setItem('myReports', JSON.stringify(myReports));
      return myReports;
    }
    return JSON.parse(stored);
  },

  // 更新举报状态
  updateReportStatus(reportId, status) {
    // 更新总举报列表
    const reports = this.getReports();
    const report = reports.find(r => r.id === parseInt(reportId));
    if (report) {
      report.status = status;
      localStorage.setItem('reports', JSON.stringify(reports));
    }

    // 更新我的举报列表
    const myReports = this.getMyReports();
    const myReport = myReports.find(r => r.id === parseInt(reportId));
    if (myReport) {
      myReport.status = status;
      localStorage.setItem('myReports', JSON.stringify(myReports));
    }

    return report;
  },

  // 获取知识库分类
  getKnowledgeCategories() {
    return MOCK_KNOWLEDGE_CATEGORIES;
  },

  // 获取知识库文章
  getKnowledgeArticles(categoryId = null) {
    if (categoryId) {
      return MOCK_KNOWLEDGE_ARTICLES.filter(a => a.category_id === parseInt(categoryId));
    }
    return MOCK_KNOWLEDGE_ARTICLES;
  },

  // 获取单篇文章
  getKnowledgeArticle(id) {
    return MOCK_KNOWLEDGE_ARTICLES.find(a => a.id === parseInt(id));
  },

  // 获取当前用户
  getCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  },

  // 登录
  login(username) {
    const user = { ...MOCK_USER, username };
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  // 登出
  logout() {
    localStorage.removeItem('currentUser');
  },

  // 获取收藏列表
  getFavorites() {
    const stored = localStorage.getItem('favorites');
    const currentUser = this.getCurrentUser();
    if (!stored) {
      // 登录状态下默认展示更多收藏作为演示
      const defaultFavs = currentUser ? [1, 2, 4] : [1, 3];
      localStorage.setItem('favorites', JSON.stringify(defaultFavs));
      return defaultFavs;
    }
    return JSON.parse(stored);
  },

  // 添加收藏
  addFavorite(hotelId) {
    const favs = this.getFavorites();
    if (!favs.includes(hotelId)) {
      favs.push(hotelId);
      localStorage.setItem('favorites', JSON.stringify(favs));
    }
    return favs;
  },

  // 取消收藏
  removeFavorite(hotelId) {
    const favs = this.getFavorites().filter(id => id !== hotelId);
    localStorage.setItem('favorites', JSON.stringify(favs));
    return favs;
  },

  // 是否已收藏
  isFavorite(hotelId) {
    return this.getFavorites().includes(hotelId);
  }
};

// 工具函数
const Utils = {
  // 风险等级文字与颜色
  getRiskLevel(score) {
    if (score <= 1) return { text: '安全', color: 'text-green-600', bg: 'bg-green-100' };
    if (score <= 2) return { text: '低风险', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score <= 3) return { text: '中风险', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (score <= 4) return { text: '高风险', color: 'text-red-500', bg: 'bg-red-100' };
    return { text: '极高风险', color: 'text-red-700', bg: 'bg-red-200' };
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  },

  // Toast 提示
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 opacity-0`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('opacity-0'), 10);
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  // 生成星星评分
  renderStars(score, max = 5) {
    let stars = '';
    for (let i = 1; i <= max; i++) {
      if (i <= score) {
        stars += '<span class="text-yellow-400">★</span>';
      } else {
        stars += '<span class="text-gray-300">★</span>';
      }
    }
    return stars;
  },

  // 脱敏用户名（保留首尾，中间用*代替）
  maskUserName(name) {
    if (!name) return '匿名用户';
    if (name.length <= 1) return name + '*';
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*'.repeat(Math.min(name.length - 2, 3)) + name[name.length - 1];
  },

  // 获取认证来源文字
  getVerifySource(type) {
    const map = {
      alipay: '支付宝认证',
      taobao: '淘宝认证'
    };
    return map[type] || '实名认证';
  }
};
