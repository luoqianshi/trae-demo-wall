const plants = [
  {
    id: 'p001',
    name: '发财树',
    nameEn: 'Money Tree',
    category: '招财',
    effects: ['wealth', 'home'],
    difficulty: 'easy',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=lucky%20money%20tree%20plant%20with%20golden%20coins%20on%20elegant%20white%20background%20Chinese%20style%20minimalist&image_size=square',
    description: '发财树又名马拉巴栗，叶片宽大圆润，四季常青。它不仅名字讨喜，在风水里更是象征广纳财气、福气不散的吉祥植物。',
    meaning: '💰 广纳财气，福气不散。叶片如聚宝盆，茎干粗壮象征根基稳固，财运立得住。',
    placement: '宜放客厅明财位（入户门对角线），花盆用红色或金色，忌放阴暗角落和大门正对面。',
    careGuide: {
      light: '喜散射光，每天2-3小时光照',
      water: '耐旱，7-10天浇一次，宁干勿湿',
      temperature: '18-30℃，忌低于5℃',
      fertilizer: '春夏每月施一次稀薄液肥'
    },
    price: 68,
    rating: 4.9,
    reviews: 3280
  },
  {
    id: 'p002',
    name: '富贵竹',
    nameEn: 'Lucky Bamboo',
    category: '招财',
    effects: ['wealth', 'career'],
    difficulty: 'easy',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=elegant%20lucky%20bamboo%20plant%20in%20glass%20vase%20water%20cultivation%20Chinese%20style%20minimalist&image_size=square',
    description: '富贵竹水培即可，茎干细长挺拔，叶片翠绿清秀。"竹"谐音"足"，象征富贵有余，是办公室和家居的热门选择。',
    meaning: '🎋 富贵有余，财运步步高。竹茎一节一节向上生长，寓意财路正、不跑偏，水为财更添灵动之气。',
    placement: '宜放光线柔和处如电视柜旁、茶几上，水位勿没过竹节，忌放横梁下。',
    careGuide: {
      light: '喜散光，忌强光直射',
      water: '每周换水一次，用静置过的水',
      temperature: '15-25℃，忌低于10℃',
      fertilizer: '每月滴几滴专用营养液'
    },
    price: 38,
    rating: 4.8,
    reviews: 5620
  },
  {
    id: 'p003',
    name: '金钱树',
    nameEn: 'Zamioculcas',
    category: '招财',
    effects: ['wealth', 'home'],
    difficulty: 'easy',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=zamioculcas%20zamiifolia%20money%20tree%20plant%20with%20shiny%20leaves%20pot%20Chinese%20style&image_size=square',
    description: '金钱树叶片对生，像一串串铜钱。地下块茎如埋在土里的元宝，象征财气藏于内不外露，适合想稳财守财的家庭。',
    meaning: '🪙 财源滚滚，稳财守财。叶片厚实持久不落叶，寓意财气持久不散，地下块茎象征财富根基深厚。',
    placement: '宜放沙发背后当靠山，忌放卫生间和厨房旁，保持干燥通风。',
    careGuide: {
      light: '耐阴，散射光即可',
      water: '10-15天浇一次，忌积水',
      temperature: '20-32℃，忌低于10℃',
      fertilizer: '生长期每月施一次复合肥'
    },
    price: 88,
    rating: 4.7,
    reviews: 2150
  },
  {
    id: 'p004',
    name: '绿萝',
    nameEn: 'Golden Pothos',
    category: '健康',
    effects: ['health', 'home'],
    difficulty: 'easy',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=golden%20pothos%20plant%20trailing%20vine%20green%20leaves%20hanging%20basket%20Chinese%20style&image_size=square',
    description: '绿萝生命力极强，有水就能活。它不仅是空气净化能手，还象征着生命力旺盛、事业蒸蒸日上。',
    meaning: '🌿 生命力旺盛，事业长青。绿萝遇水即活，寓意事业如绿色藤蔓般不断攀升，家庭充满生机。',
    placement: '适应性强，可放客厅、卧室、书房，忌阳光直射。',
    careGuide: {
      light: '耐阴，任何光照都能适应',
      water: '保持盆土湿润，3-5天浇一次',
      temperature: '15-30℃，忌低于5℃',
      fertilizer: '每月施一次薄肥'
    },
    price: 28,
    rating: 4.9,
    reviews: 8920
  },
  {
    id: 'p005',
    name: '虎皮兰',
    nameEn: 'Snake Plant',
    category: '健康',
    effects: ['health', 'home'],
    difficulty: 'easy',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=snake%20plant%20sansevieria%20with%20striped%20leaves%20modern%20pot%20Chinese%20style%20minimalist&image_size=square',
    description: '虎皮兰叶片直立如剑，夜间释放氧气，是卧室的最佳伴侣。它还能吸收甲醛等有害物质，净化空气能力超强。',
    meaning: '🗡️ 避邪挡煞，守护健康。叶片坚挺如剑，象征坚韧不拔，能化解室内不良气场，守护家人健康。',
    placement: '宜放卧室、卫生间，忌放潮湿积水处。',
    careGuide: {
      light: '耐阴也喜光，适应性强',
      water: '2-3周浇一次，忌积水',
      temperature: '15-28℃，忌低于10℃',
      fertilizer: '春夏季节每月施一次'
    },
    price: 45,
    rating: 4.8,
    reviews: 4560
  },
  {
    id: 'p006',
    name: '文竹',
    nameEn: 'Asparagus Fern',
    category: '学业',
    effects: ['study', 'career'],
    difficulty: 'medium',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=elegant%20asparagus%20fern%20bonsai%20delicate%20leaves%20Chinese%20traditional%20style&image_size=square',
    description: '文竹姿态优雅，叶片纤细如丝，是书房的经典绿植。它象征文思泉涌、学业有成，对读书人的运势有加持作用。',
    meaning: '📚 文思泉涌，学业有成。文竹文雅清秀，寓意才华横溢，适合放在书房助文昌运。',
    placement: '宜放书房书桌或书架旁，忌阳光直射和干燥环境。',
    careGuide: {
      light: '喜散射光，忌强光',
      water: '保持盆土湿润，每日喷水',
      temperature: '15-25℃，忌低于5℃',
      fertilizer: '每月施一次稀薄液肥'
    },
    price: 58,
    rating: 4.6,
    reviews: 1890
  },
  {
    id: 'p007',
    name: '鸿运当头',
    nameEn: 'Bromeliad',
    category: '招财',
    effects: ['wealth', 'home'],
    difficulty: 'medium',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=red%20bromeliad%20plant%20flower%20tropical%20elegant%20pot%20Chinese%20festive%20style&image_size=square',
    description: '鸿运当头花如其名，红色花朵鲜艳夺目，象征好运连连、红红火火。它是年宵花的热门选择。',
    meaning: '🔴 鸿运当头，好运连连。红色花朵象征红红火火，寓意事业蒸蒸日上，家庭和睦幸福。',
    placement: '宜放客厅显眼处，忌放阴暗角落。',
    careGuide: {
      light: '喜明亮散射光',
      water: '保持叶杯有水，盆土微湿',
      temperature: '18-28℃，忌低于10℃',
      fertilizer: '花期停止施肥'
    },
    price: 98,
    rating: 4.7,
    reviews: 2340
  },
  {
    id: 'p008',
    name: '琴叶榕',
    nameEn: 'Fiddle Leaf Fig',
    category: '事业',
    effects: ['career', 'home'],
    difficulty: 'hard',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=fiddle%20leaf%20fig%20tree%20large%20leaves%20modern%20interior%20design%20Chinese%20style&image_size=square',
    description: '琴叶榕叶片宽大如提琴，造型独特，是网红绿植的代表。它象征事业发展顺利、前途广阔。',
    meaning: '🎻 事业顺利，前途广阔。叶片宽大舒展，寓意事业如大树般蓬勃发展，前途无量。',
    placement: '宜放客厅或办公室采光好的位置，忌空调直吹。',
    careGuide: {
      light: '喜明亮散射光，忌暴晒',
      water: '干透浇透，10-15天一次',
      temperature: '20-30℃，忌低于15℃',
      fertilizer: '春夏每月施一次'
    },
    price: 168,
    rating: 4.5,
    reviews: 1250
  }
];

const posts = [
  {
    id: 'post001',
    userId: 'u001',
    userName: '绿植达人小美',
    userAvatar: '👩',
    plantId: 'p001',
    title: '养了发财树后，真的升职加薪了！',
    content: '去年买了一盆发财树放在办公室东南方位，没想到半年后就升职加薪了！现在这棵树已经长得很高大，叶子油亮油亮的。同事都说我这棵树养得好，财气旺！',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=money%20tree%20plant%20in%20office%20desk%20bright%20environment%20professional%20setting&image_size=landscape_4_3',
    likes: 234,
    comments: 45,
    createdAt: '2025-01-15',
    tags: ['#发财树', '#转运', '#办公室绿植']
  },
  {
    id: 'post002',
    userId: 'u002',
    userName: '佛系养植',
    userAvatar: '🧑',
    plantId: 'p004',
    title: '绿萝真的是懒人福音！',
    content: '作为一个养什么死什么的植物杀手，绿萝真的是我的救星！随便插水里就能活，放在家里不仅好看，还能净化空气。现在家里已经有五盆绿萝了，感觉空气都清新了很多。',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=multiple%20golden%20pothos%20plants%20in%20home%20interior%20cozy%20living%20room&image_size=landscape_4_3',
    likes: 567,
    comments: 89,
    createdAt: '2025-01-14',
    tags: ['#绿萝', '#新手入门', '#懒人植物']
  },
  {
    id: 'post003',
    userId: 'u003',
    userName: '玄学爱好者',
    userAvatar: '👧',
    plantId: 'p002',
    title: '富贵竹的摆放讲究，你知道吗？',
    content: '富贵竹最好养5支或9支，放在客厅明财位效果最好。水培时水位不要没过竹节，否则寓意财路断了。我家的富贵竹已经养了两年了，叶子还是翠绿翠绿的！',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=lucky%20bamboo%205%20stems%20in%20elegant%20glass%20vase%20living%20room%20decoration&image_size=landscape_4_3',
    likes: 892,
    comments: 156,
    createdAt: '2025-01-13',
    tags: ['#富贵竹', '#风水', '#招财']
  },
  {
    id: 'post004',
    userId: 'u004',
    userName: '职场新人',
    userAvatar: '👦',
    plantId: 'p006',
    title: '文竹助我通过考试！',
    content: '备考期间在书桌放了一盆文竹，听说能助文昌运。没想到真的顺利通过了职业资格考试！现在这盆文竹成了我的吉祥物，每天都会给它浇水。',
    image: 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=asparagus%20fern%20on%20study%20desk%20with%20books%20lamp%20cozy%20study%20room&image_size=landscape_4_3',
    likes: 345,
    comments: 67,
    createdAt: '2025-01-12',
    tags: ['#文竹', '#学业', '#考试']
  }
];

const careTips = [
  {
    title: '发财树浇水秘诀',
    content: '发财树耐旱不耐涝，一定要遵循"宁干勿湿"的原则。浇水前先用手指插入土壤2厘米，如果感觉干燥再浇水。'
  },
  {
    title: '富贵竹防烂根技巧',
    content: '水培富贵竹要用静置过24小时的水，每周换水一次，换水时顺便清理瓶壁上的青苔，保持水质清澈。'
  },
  {
    title: '金钱树施肥注意',
    content: '金钱树喜肥但忌浓肥，生长期每月施一次稀薄的复合肥即可。冬季休眠期停止施肥。'
  },
  {
    title: '绿萝快速繁殖方法',
    content: '绿萝繁殖很简单，剪一段枝条插入水中，1-2周就能生根。生根后可以水培也可以土培。'
  }
];

const achievements = [
  { id: 'ach001', icon: '🌱', name: '新手园丁' },
  { id: 'ach002', icon: '💧', name: '浇水达人' },
  { id: 'ach003', icon: '🏆', name: '植物大师' },
  { id: 'ach004', icon: '✨', name: '转运锦鲤' },
  { id: 'ach005', icon: '❤️', name: '爱心养护' },
  { id: 'ach006', icon: '📸', name: '晒图达人' }
];

let currentUser = {
  id: 'u000',
  nickname: '灵植新手',
  gender: '',
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  needs: [],
  level: 1,
  title: '植物爱好者'
};

let myGarden = [];
let currentPage = 'home';
let currentFilter = 'all';

function init() {
  loadUserData();
  loadGardenData();
  updateDateDisplay();
  renderFeed();
  renderPlants();
  renderGarden();
  renderTips();
  renderAchievements();
  updateProfile();
  
  setTimeout(() => {
    if (!currentUser.birthDate) {
      showEditProfileModal();
    }
  }, 1000);

  document.getElementById('editProfileForm').addEventListener('submit', handleProfileSubmit);
}

function loadUserData() {
  const saved = localStorage.getItem('lingzhi_user');
  if (saved) {
    currentUser = JSON.parse(saved);
  }
}

function saveUserData() {
  localStorage.setItem('lingzhi_user', JSON.stringify(currentUser));
}

function loadGardenData() {
  const saved = localStorage.getItem('lingzhi_garden');
  if (saved) {
    myGarden = JSON.parse(saved);
  }
}

function saveGardenData() {
  localStorage.setItem('lingzhi_garden', JSON.stringify(myGarden));
}

function updateDateDisplay() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  
  document.getElementById('currentDate').textContent = dateStr + ' ' + weekDay;
  document.getElementById('heroDate').textContent = dateStr;
  document.getElementById('heroLunar').textContent = '农历正月初一';
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const pageElement = document.getElementById(`page-${page}`);
  if (pageElement) {
    pageElement.classList.remove('hidden');
  }
  
  const navIndex = { 'home': 0, 'plants': 1, 'care': 2, 'profile': 3 };
  if (navIndex[page] !== undefined) {
    document.querySelectorAll('.nav-item')[navIndex[page]].classList.add('active');
  }
  
  currentPage = page;
  
  if (page === 'plants') {
    renderPlants();
  } else if (page === 'care') {
    renderGarden();
  } else if (page === 'profile') {
    updateProfile();
  }
}

function filterPlants(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderPlants();
}

function renderPlants() {
  const grid = document.getElementById('plantsGrid');
  let filteredPlants = plants;
  
  if (currentFilter !== 'all') {
    filteredPlants = plants.filter(p => p.effects.includes(currentFilter));
  }
  
  grid.innerHTML = filteredPlants.map(plant => `
    <div class="plant-card" onclick="showPlantDetail('${plant.id}')">
      <img src="${plant.image}" alt="${plant.name}" class="plant-card-img">
      <div class="plant-card-body">
        <div class="plant-card-name">${plant.name}</div>
        <div class="plant-card-meaning">${plant.meaning}</div>
        <div class="plant-card-tags">
          ${plant.effects.map(e => {
            const effectMap = { 'wealth': '招财', 'health': '健康', 'career': '事业', 'love': '感情', 'study': '学业', 'home': '家宅' };
            return `<span class="plant-card-tag">${effectMap[e] || e}</span>`;
          }).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function showPlantDetail(plantId) {
  const plant = plants.find(p => p.id === plantId);
  if (!plant) return;
  
  navigateTo('plant-detail');
  
  const content = document.getElementById('plantDetailContent');
  content.innerHTML = `
    <div class="detail-header">
      <img src="${plant.image}" alt="${plant.name}" class="detail-img">
      <div class="detail-info">
        <h1 class="detail-name">${plant.name}</h1>
        <p class="detail-meaning">${plant.meaning}</p>
        <div class="detail-tags">
          ${plant.effects.map(e => {
            const effectMap = { 'wealth': '招财', 'health': '健康', 'career': '事业', 'love': '感情', 'study': '学业', 'home': '家宅' };
            return `<span class="detail-tag">${effectMap[e] || e}</span>`;
          }).join('')}
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h3 class="detail-section-title">🌿 植物故事</h3>
      <p class="detail-section-content">${plant.description}</p>
    </div>
    
    <div class="detail-section">
      <h3 class="detail-section-title">🔮 玄学寓意</h3>
      <p class="detail-section-content">${plant.meaning}</p>
    </div>
    
    <div class="detail-section">
      <h3 class="detail-section-title">📍 摆放指南</h3>
      <p class="detail-section-content">${plant.placement}</p>
    </div>
    
    <div class="detail-section">
      <h3 class="detail-section-title">💡 养护指南</h3>
      <div class="care-guide-grid">
        <div class="care-guide-item">
          <div class="care-guide-label">☀️ 光照</div>
          <div class="care-guide-value">${plant.careGuide.light}</div>
        </div>
        <div class="care-guide-item">
          <div class="care-guide-label">💧 浇水</div>
          <div class="care-guide-value">${plant.careGuide.water}</div>
        </div>
        <div class="care-guide-item">
          <div class="care-guide-label">🌡️ 温度</div>
          <div class="care-guide-value">${plant.careGuide.temperature}</div>
        </div>
        <div class="care-guide-item">
          <div class="care-guide-label">🌿 施肥</div>
          <div class="care-guide-value">${plant.careGuide.fertilizer}</div>
        </div>
      </div>
    </div>
    
    <div class="detail-actions">
      <button class="detail-btn secondary" onclick="addPlantToGarden('${plant.id}')">🌱 添加到花园</button>
      <button class="detail-btn primary" onclick="buyPlant('${plant.id}')">🛒 立即购买</button>
    </div>
  `;
}

function buyPlant(plantId) {
  const plant = plants.find(p => p.id === plantId);
  alert(`已加入购物车：${plant.name} ¥${plant.price}`);
}

function addPlantToGarden(plantId) {
  if (!plantId) {
    alert('请先选择一株植物');
    return;
  }
  
  const plant = plants.find(p => p.id === plantId);
  if (!plant) return;
  
  const exists = myGarden.find(g => g.plantId === plantId);
  if (exists) {
    alert('这株植物已经在您的花园里了');
    return;
  }
  
  const newPlant = {
    id: `g${Date.now()}`,
    plantId: plant.id,
    nickname: plant.name,
    addedAt: new Date().toISOString(),
    status: 'healthy'
  };
  
  myGarden.push(newPlant);
  saveGardenData();
  renderGarden();
  updateProfile();
  
  alert(`🌱 ${plant.name} 已添加到您的花园！`);
}

function renderGarden() {
  const list = document.getElementById('gardenList');
  
  if (myGarden.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🪴</div>
        <div class="empty-title">我的花园空空如也</div>
        <div class="empty-desc">快去灵植库挑选心仪的植物吧</div>
      </div>
    `;
    return;
  }
  
  list.innerHTML = myGarden.map(item => {
    const plant = plants.find(p => p.id === item.plantId);
    return `
      <div class="garden-card">
        <img src="${plant?.image || ''}" alt="${item.nickname}" class="garden-avatar">
        <div class="garden-info">
          <div class="garden-name">${item.nickname}</div>
          <div class="garden-status">
            <span class="status-dot ${item.status}"></span>
            ${item.status === 'healthy' ? '状态良好' : item.status === 'warning' ? '需要关注' : '需要抢救'}
          </div>
        </div>
        <div class="garden-actions">
          <button class="garden-action-btn" onclick="waterPlant('${item.id}')">💧 浇水</button>
          <button class="garden-action-btn" onclick="removePlant('${item.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function waterPlant(gardenId) {
  const item = myGarden.find(g => g.id === gardenId);
  if (item) {
    item.status = 'healthy';
    item.lastWatered = new Date().toISOString();
    saveGardenData();
    renderGarden();
    alert('💧 浇水成功！植物状态已更新');
  }
}

function removePlant(gardenId) {
  if (confirm('确定要移除这株植物吗？')) {
    myGarden = myGarden.filter(g => g.id !== gardenId);
    saveGardenData();
    renderGarden();
    updateProfile();
  }
}

function renderTips() {
  const list = document.getElementById('tipsList');
  list.innerHTML = careTips.map(tip => `
    <div class="tip-card">
      <div class="tip-title">${tip.title}</div>
      <div class="tip-content">${tip.content}</div>
    </div>
  `).join('');
}

function renderFeed() {
  const list = document.getElementById('feedList');
  list.innerHTML = posts.map(post => `
    <div class="feed-card">
      <div class="feed-header">
        <div class="feed-avatar">${post.userAvatar}</div>
        <div class="feed-user-info">
          <div class="feed-username">${post.userName}</div>
          <div class="feed-time">${post.createdAt}</div>
        </div>
      </div>
      <div class="feed-content">
        <div class="feed-title">${post.title}</div>
        <div class="feed-desc">${post.content}</div>
      </div>
      <img src="${post.image}" alt="${post.title}" class="feed-image">
      <div class="feed-tags">
        ${post.tags.map(tag => `<span class="feed-tag">${tag}</span>`).join('')}
      </div>
      <div class="feed-actions">
        <div class="feed-action">❤️ ${post.likes}</div>
        <div class="feed-action">💬 ${post.comments}</div>
        <div class="feed-action">🔗 分享</div>
      </div>
    </div>
  `).join('');
}

function renderAchievements() {
  const list = document.getElementById('achievementsList');
  list.innerHTML = achievements.map(achievement => `
    <div class="achievement-item">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.name}</div>
    </div>
  `).join('');
}

function editProfile() {
  showEditProfileModal();
}

function showEditProfileModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-container').classList.remove('hidden');
  document.getElementById('modal-plant-detail').classList.add('hidden');
  document.getElementById('modal-edit-profile').classList.remove('hidden');
  
  document.getElementById('editNickname').value = currentUser.nickname || '';
  document.getElementById('editBirthDate').value = currentUser.birthDate || '';
  document.getElementById('editBirthTime').value = currentUser.birthTime || '';
  document.getElementById('editBirthPlace').value = currentUser.birthPlace || '';
  
  if (currentUser.gender) {
    document.querySelector(`input[name="gender"][value="${currentUser.gender}"]`).checked = true;
  }
  
  document.querySelectorAll('input[name="needs"]').forEach(cb => {
    cb.checked = currentUser.needs.includes(cb.value);
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-container').classList.add('hidden');
}

function handleProfileSubmit(e) {
  e.preventDefault();
  
  currentUser.nickname = document.getElementById('editNickname').value || '灵植新手';
  currentUser.gender = document.querySelector('input[name="gender"]:checked')?.value || '';
  currentUser.birthDate = document.getElementById('editBirthDate').value || '';
  currentUser.birthTime = document.getElementById('editBirthTime').value || '';
  currentUser.birthPlace = document.getElementById('editBirthPlace').value || '';
  
  currentUser.needs = Array.from(document.querySelectorAll('input[name="needs"]:checked'))
    .map(cb => cb.value);
  
  saveUserData();
  updateProfile();
  closeModal();
  
  alert('🎉 恭喜！您的灵植档案已完善');
}

function updateProfile() {
  document.getElementById('profileName').textContent = currentUser.nickname || '灵植新手';
  document.getElementById('profileTitle').textContent = currentUser.title || '植物爱好者';
  
  document.getElementById('statPlants').textContent = myGarden.length;
  document.getElementById('statDays').textContent = 0;
  document.getElementById('statAchieve').textContent = 0;
  
  document.getElementById('profileBirthDate').textContent = currentUser.birthDate || '未填写';
  document.getElementById('profileGender').textContent = currentUser.gender === 'male' ? '男' : currentUser.gender === 'female' ? '女' : '未填写';
  
  const needsMap = { 'wealth': '招财', 'health': '健康', 'career': '事业', 'love': '感情', 'study': '学业', 'home': '家宅' };
  const needsText = currentUser.needs.length > 0 
    ? currentUser.needs.map(n => needsMap[n] || n).join('、') 
    : '未设置';
  document.getElementById('profileNeeds').textContent = needsText;
}

function showNotification() {
  alert('🔔 暂无新通知');
}

document.addEventListener('DOMContentLoaded', init);