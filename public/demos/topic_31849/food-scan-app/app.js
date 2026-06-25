/**
 * 食光知味 - AI 食物营养扫描 App
 * 核心逻辑：用户管理 + 扫描分析 + 本地存储
 */

// ===== 状态管理 =====
const state = {
  users: [],
  currentUserId: null,
  history: [],
  editingUserId: null
};

// ===== 健康知识库 =====
const HEALTH_RULES = {
  // 疾病 -> 需关注的成分/风险
  '糖尿病': {
    watch: ['白砂糖', '果葡糖浆', '麦芽糖', '葡萄糖', '蜂蜜', '蔗糖', '冰糖'],
    riskLevel: 'high',
    advice: '糖尿病患者应严格控制糖分摄入，建议选择无糖或低糖食品（每100g含糖量<5g）。'
  },
  '高血压': {
    watch: ['食盐', '氯化钠', '钠', '酱油', '味精', '谷氨酸钠'],
    riskLevel: 'high',
    advice: '高血压患者需控制钠摄入，每日食盐量应少于5g，注意隐形盐（酱油、味精等）。'
  },
  '高血脂': {
    watch: ['反式脂肪酸', '氢化植物油', '植脂末', '代可可脂', '饱和脂肪酸', '动物油', '猪油'],
    riskLevel: 'high',
    advice: '高血脂患者应减少饱和脂肪和反式脂肪摄入，选择低脂食品。'
  },
  '骨质疏松': {
    watch: ['咖啡因', '磷酸', '碳酸饮料', '高盐'],
    riskLevel: 'medium',
    advice: '骨质疏松患者需注意钙吸收，避免过量咖啡因和磷酸，多选择高钙食品。'
  },
  '胃炎': {
    watch: ['辣椒', '辛辣', '酸性', '柠檬酸', '防腐剂', '山梨酸钾', '苯甲酸钠', '脱氢乙酸钠'],
    riskLevel: 'high',
    advice: '胃炎患者应避免辛辣、酸性、刺激性成分，选择温和易消化的食品。'
  },
  '胃溃疡': {
    watch: ['辣椒', '辛辣', '酸性', '咖啡因', '酒精', '防腐剂'],
    riskLevel: 'high',
    advice: '胃溃疡患者需严格避免刺激性食物，选择清淡、软质食品。'
  },
  '肠易激综合征': {
    watch: ['乳糖', '果糖', '山梨糖醇', '木糖醇', '高FODMAP', '辛辣', '咖啡因'],
    riskLevel: 'medium',
    advice: '肠易激综合征患者应避免高FODMAP食物和人工甜味剂，选择低敏配方食品。'
  },
  '便秘': {
    watch: ['精制面粉', '低纤维', '高脂肪'],
    riskLevel: 'medium',
    advice: '便秘人群应多摄入膳食纤维，选择全谷物、高纤维食品。'
  },
  '腹泻': {
    watch: ['乳糖', '果糖', '辛辣', '高纤维', '咖啡因', '酒精'],
    riskLevel: 'medium',
    advice: '易腹泻人群应避免乳糖、果糖和高纤维食品，选择低敏、易消化配方。'
  },
  '失眠': {
    watch: ['咖啡因', '茶碱', '可可碱', '兴奋剂'],
    riskLevel: 'medium',
    advice: '失眠人群下午后应避免咖啡因摄入，选择无咖啡因食品。'
  },
  '焦虑抑郁': {
    watch: ['咖啡因', '酒精', '人工色素', '阿斯巴甜'],
    riskLevel: 'medium',
    advice: '焦虑抑郁人群应避免咖啡因和酒精，选择富含色氨酸、B族维生素的食品。'
  },
  '乳糖不耐受': {
    watch: ['乳糖', '奶粉', '乳清', '牛奶'],
    riskLevel: 'high',
    advice: '乳糖不耐受者应选择无乳糖或植物基替代品。'
  },
  '痛风': {
    watch: ['嘌呤', '酵母', '啤酒', '内脏', '海鲜', '果糖'],
    riskLevel: 'high',
    advice: '痛风患者需严格控制嘌呤和果糖摄入，避免高嘌呤食品。'
  },
  '肾病': {
    watch: ['钠', '钾', '磷', '蛋白质', '盐'],
    riskLevel: 'high',
    advice: '肾病患者需根据病情控制钠、钾、磷和蛋白质摄入，建议遵医嘱。'
  },
  '肝病': {
    watch: ['酒精', '高脂肪', '防腐剂', '人工色素'],
    riskLevel: 'high',
    advice: '肝病患者应避免酒精和高脂肪食品，选择清淡、易消化的食品。'
  },
  '过敏': {
    watch: ['花生', '坚果', '麸质', '小麦', '大豆', '鸡蛋', '牛奶', '海鲜', '虾', '蟹'],
    riskLevel: 'high',
    advice: '过敏体质者需仔细查看过敏原标识，避免已知过敏成分。'
  }
};

// 高风险添加剂
const HIGH_RISK_ADDITIVES = [
  '阿斯巴甜', '糖精', '甜蜜素', '安赛蜜',
  '脱氢乙酸钠', '苯甲酸钠', '山梨酸钾',
  '亚硝酸盐', '亚硝酸钠',
  '人工色素', '柠檬黄', '日落黄', '胭脂红',
  '反式脂肪酸', '氢化植物油', '植脂末', '代可可脂',
  '味精', '谷氨酸钠', '呈味核苷酸二钠'
];

// 中风险添加剂
const MEDIUM_RISK_ADDITIVES = [
  '卡拉胶', '黄原胶', '瓜尔胶',
  '磷酸盐', '三聚磷酸钠', '焦磷酸钠',
  '香精', '食用香精', '香料'
];

// ===== 初始化 =====
function init() {
  loadData();
  renderUserCard();
  renderUserMenu();
  renderHistory();

  // 点击外部关闭用户菜单
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const btn = document.getElementById('currentUserBtn');
    if (menu.style.display !== 'none' && !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}

// ===== 本地存储 =====
function loadData() {
  try {
    const usersData = localStorage.getItem('shiguang_users');
    const currentId = localStorage.getItem('shiguang_current_user');
    const historyData = localStorage.getItem('shiguang_history');
    if (usersData) state.users = JSON.parse(usersData);
    if (currentId) state.currentUserId = currentId;
    if (historyData) state.history = JSON.parse(historyData);
  } catch (e) {
    console.error('加载数据失败', e);
  }
}

function saveUsers() {
  localStorage.setItem('shiguang_users', JSON.stringify(state.users));
  if (state.currentUserId) {
    localStorage.setItem('shiguang_current_user', state.currentUserId);
  }
}

function saveHistory() {
  localStorage.setItem('shiguang_history', JSON.stringify(state.history.slice(0, 50)));
}

// ===== 用户管理 =====
function getCurrentUser() {
  return state.users.find(u => u.id === state.currentUserId) || null;
}

function getAvatarText(name) {
  if (!name) return '?';
  return name.charAt(0);
}

function renderUserCard() {
  const user = getCurrentUser();
  const avatarEl = document.getElementById('userAvatarLarge');
  const nameEl = document.getElementById('userName');
  const metaEl = document.getElementById('userMeta');
  const tagsEl = document.getElementById('healthTags');
  const avatarBtn = document.getElementById('currentUserAvatar');

  if (!user) {
    avatarEl.textContent = '?';
    nameEl.textContent = '未选择用户';
    metaEl.textContent = '请先添加用户信息';
    tagsEl.innerHTML = '<p class="empty-hint">暂无健康信息</p>';
    avatarBtn.textContent = '?';
    return;
  }

  avatarEl.textContent = getAvatarText(user.name);
  nameEl.textContent = user.name;
  metaEl.textContent = `${user.age}岁 · ${user.gender || '未知'}`;
  avatarBtn.textContent = getAvatarText(user.name);

  // 渲染健康标签
  let tagsHtml = '';
  if (user.conditions && user.conditions.length > 0) {
    user.conditions.forEach(cond => {
      const rule = HEALTH_RULES[cond];
      const cls = rule ? (rule.riskLevel === 'high' ? 'danger' : 'warning') : 'info';
      tagsHtml += `<span class="health-tag ${cls}">${cond}</span>`;
    });
  }
  if (user.notes) {
    tagsHtml += `<span class="health-tag info">${user.notes.substring(0, 20)}${user.notes.length > 20 ? '...' : ''}</span>`;
  }
  if (!tagsHtml) {
    tagsHtml = '<p class="empty-hint">暂无健康信息</p>';
  }
  tagsEl.innerHTML = tagsHtml;
}

function renderUserMenu() {
  const listEl = document.getElementById('userList');
  if (state.users.length === 0) {
    listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:0.85rem;">暂无用户，请先添加</div>';
    return;
  }

  listEl.innerHTML = state.users.map(u => {
    const isActive = u.id === state.currentUserId;
    const conditionsText = u.conditions && u.conditions.length > 0
      ? u.conditions.slice(0, 2).join('、') + (u.conditions.length > 2 ? `等${u.conditions.length}项` : '')
      : '无特殊状况';
    return `
      <div class="user-list-item ${isActive ? 'active' : ''}" onclick="switchUser('${u.id}')">
        <div class="user-list-avatar">${getAvatarText(u.name)}</div>
        <div class="user-list-info">
          <div class="user-list-name">${u.name}</div>
          <div class="user-list-meta">${u.age}岁 · ${conditionsText}</div>
        </div>
        <button class="user-list-delete" onclick="event.stopPropagation();deleteUser('${u.id}')">删除</button>
      </div>
    `;
  }).join('');
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  if (menu.style.display === 'block') renderUserMenu();
}

function switchUser(userId) {
  state.currentUserId = userId;
  saveUsers();
  renderUserCard();
  document.getElementById('userMenu').style.display = 'none';
}

function deleteUser(userId) {
  if (!confirm('确定要删除该用户吗？')) return;
  state.users = state.users.filter(u => u.id !== userId);
  if (state.currentUserId === userId) {
    state.currentUserId = state.users.length > 0 ? state.users[0].id : null;
  }
  saveUsers();
  renderUserCard();
  renderUserMenu();
}

// ===== 用户编辑弹窗 =====
function openUserModal(isEdit = false) {
  state.editingUserId = isEdit ? state.currentUserId : null;
  const modal = document.getElementById('userModal');
  const title = document.getElementById('modalTitle');

  // 重置表单
  document.getElementById('formName').value = '';
  document.getElementById('formAge').value = '';
  document.getElementById('formGender').value = '';
  document.getElementById('formNotes').value = '';
  document.querySelectorAll('#healthConditions input').forEach(cb => cb.checked = false);

  if (isEdit) {
    const user = getCurrentUser();
    if (!user) return;
    title.textContent = '编辑用户';
    document.getElementById('formName').value = user.name || '';
    document.getElementById('formAge').value = user.age || '';
    document.getElementById('formGender').value = user.gender || '';
    document.getElementById('formNotes').value = user.notes || '';
    if (user.conditions) {
      user.conditions.forEach(cond => {
        const cb = document.querySelector(`#healthConditions input[value="${cond}"]`);
        if (cb) cb.checked = true;
      });
    }
  } else {
    title.textContent = '添加用户';
  }

  modal.style.display = 'flex';
  document.getElementById('userMenu').style.display = 'none';
}

function closeUserModal() {
  document.getElementById('userModal').style.display = 'none';
  state.editingUserId = null;
}

function saveUser() {
  const name = document.getElementById('formName').value.trim();
  const age = parseInt(document.getElementById('formAge').value);
  const gender = document.getElementById('formGender').value;
  const notes = document.getElementById('formNotes').value.trim();

  if (!name) { alert('请输入姓名'); return; }
  if (!age || age < 1 || age > 120) { alert('请输入有效的年龄'); return; }

  const conditions = Array.from(document.querySelectorAll('#healthConditions input:checked'))
    .map(cb => cb.value);

  const userData = {
    id: state.editingUserId || Date.now().toString(),
    name,
    age,
    gender,
    conditions,
    notes
  };

  if (state.editingUserId) {
    const idx = state.users.findIndex(u => u.id === state.editingUserId);
    if (idx >= 0) state.users[idx] = userData;
  } else {
    state.users.push(userData);
  }

  state.currentUserId = userData.id;
  saveUsers();
  renderUserCard();
  closeUserModal();
}

// ===== 扫描功能 =====
function openCamera() {
  const user = getCurrentUser();
  if (!user) {
    alert('请先添加用户信息');
    openUserModal();
    return;
  }

  // 优先尝试调用 getUserMedia 获取摄像头实时画面
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    openLiveCamera();
    return;
  }

  // 降级：使用 capture="camera" 的文件输入
  document.getElementById('cameraInput').click();
}

// 实时摄像头预览
let cameraStream = null;
function openLiveCamera() {
  // 创建摄像头预览弹窗
  let cameraModal = document.getElementById('cameraModal');
  if (!cameraModal) {
    cameraModal = document.createElement('div');
    cameraModal.id = 'cameraModal';
    cameraModal.className = 'modal-overlay';
    cameraModal.innerHTML = `
      <div class="modal" style="max-height:95vh;">
        <div class="modal-header">
          <h3>拍照扫描</h3>
          <button class="modal-close" onclick="closeLiveCamera()">&times;</button>
        </div>
        <div class="modal-body" style="padding:0;display:flex;flex-direction:column;align-items:center;background:#000;">
          <video id="cameraVideo" autoplay playsinline style="width:100%;max-height:60vh;object-fit:cover;"></video>
          <canvas id="cameraCanvas" style="display:none;"></canvas>
        </div>
        <div class="modal-footer" style="justify-content:center;">
          <button class="btn primary" style="width:80px;height:80px;border-radius:50%;font-size:0;" onclick="takePhoto()">
            <span style="display:inline-block;width:60px;height:60px;border-radius:50%;border:3px solid #fff;background:var(--accent);"></span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(cameraModal);
  }

  cameraModal.style.display = 'flex';

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      cameraStream = stream;
      const video = document.getElementById('cameraVideo');
      video.srcObject = stream;
    })
    .catch(err => {
      console.warn('getUserMedia 失败，降级到文件选择', err);
      closeLiveCamera();
      document.getElementById('cameraInput').click();
    });
}

function closeLiveCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const modal = document.getElementById('cameraModal');
  if (modal) modal.style.display = 'none';
}

function takePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  if (!video || !video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const imageData = canvas.toDataURL('image/jpeg', 0.9);
  closeLiveCamera();
  analyzeFood(imageData);
}

function triggerFileInput() {
  const user = getCurrentUser();
  if (!user) {
    alert('请先添加用户信息');
    openUserModal();
    return;
  }
  document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const imageData = e.target.result;
    analyzeFood(imageData);
  };
  reader.readAsDataURL(file);

  // 清空 input 以便重复选择同一文件
  event.target.value = '';
}

// ===== AI 分析（模拟） =====
function analyzeFood(imageData) {
  const user = getCurrentUser();
  if (!user) return;

  showLoading(true);

  // 模拟 AI 分析延迟
  setTimeout(() => {
    const result = generateMockAnalysis(user);
    result.image = imageData;
    result.timestamp = Date.now();

    // 保存到历史
    state.history.unshift(result);
    saveHistory();
    renderHistory();

    showLoading(false);
    showResult(result);
  }, 1500 + Math.random() * 1000);
}

function generateMockAnalysis(user) {
  // 模拟识别出的食品信息
  const mockProducts = [
    {
      name: '猴菇酥性饼干',
      brand: '某品牌',
      ingredients: ['小麦粉', '白砂糖', '植物油', '猴头菇粉(1.2%)', '食用盐', '碳酸氢钠', '山梨酸钾', '食用香精'],
      nutrition: { energy: '2150kJ', protein: '6.5g', fat: '28g', carbs: '58g', sugar: '18g', sodium: '320mg' }
    },
    {
      name: '乳酸菌饮品（原味）',
      brand: '某品牌优酸乳',
      ingredients: ['水', '白砂糖', '全脂乳粉', '乳酸菌', '柠檬酸', '食用香精', '卡拉胶', '琼脂'],
      nutrition: { energy: '280kJ', protein: '1.0g', fat: '1.2g', carbs: '12g', sugar: '11.5g', sodium: '60mg' }
    },
    {
      name: '原味薯片',
      brand: '某品牌',
      ingredients: ['马铃薯', '植物油', '食用盐', '味精', '呈味核苷酸二钠', '抗氧化剂'],
      nutrition: { energy: '2300kJ', protein: '5g', fat: '35g', carbs: '52g', sugar: '1g', sodium: '580mg' }
    },
    {
      name: '全麦面包',
      brand: '某烘焙品牌',
      ingredients: ['全麦粉', '水', '酵母', '食用盐', '植物油', '蜂蜜'],
      nutrition: { energy: '1050kJ', protein: '9g', fat: '3.5g', carbs: '45g', sugar: '6g', sodium: '380mg', fiber: '6g' }
    },
    {
      name: '无糖豆浆粉',
      brand: '某豆奶品牌',
      ingredients: ['非转基因大豆', '麦芽糊精'],
      nutrition: { energy: '1650kJ', protein: '18g', fat: '9g', carbs: '28g', sugar: '2g', sodium: '120mg' }
    }
  ];

  const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];

  // 分析风险
  const risks = [];
  let overallLevel = 'safe';

  // 1. 根据用户健康状况分析
  if (user.conditions) {
    user.conditions.forEach(condition => {
      const rule = HEALTH_RULES[condition];
      if (!rule) return;

      const foundWatch = rule.watch.filter(w =>
        product.ingredients.some(ing => ing.includes(w))
      );

      if (foundWatch.length > 0) {
        risks.push({
          level: rule.riskLevel,
          title: `${condition}风险`,
          desc: `含有${foundWatch.join('、')}，${rule.advice}`
        });
        if (rule.riskLevel === 'high') overallLevel = 'danger';
        else if (rule.riskLevel === 'medium' && overallLevel !== 'danger') overallLevel = 'warning';
      }
    });
  }

  // 2. 分析添加剂
  const foundHighRisk = HIGH_RISK_ADDITIVES.filter(a =>
    product.ingredients.some(ing => ing.includes(a))
  );
  const foundMediumRisk = MEDIUM_RISK_ADDITIVES.filter(a =>
    product.ingredients.some(ing => ing.includes(a))
  );

  if (foundHighRisk.length > 0) {
    risks.push({
      level: 'high',
      title: '高风险添加剂',
      desc: `含有${foundHighRisk.join('、')}，长期过量摄入可能对健康产生不良影响。`
    });
    overallLevel = 'danger';
  }
  if (foundMediumRisk.length > 0) {
    risks.push({
      level: 'warning',
      title: '需注意添加剂',
      desc: `含有${foundMediumRisk.join('、')}，建议适量食用。`
    });
    if (overallLevel === 'safe') overallLevel = 'warning';
  }

  // 3. 糖分分析
  const sugarMatch = product.nutrition.sugar.match(/(\d+(\.\d+)?)/);
  const sugarValue = sugarMatch ? parseFloat(sugarMatch[1]) : 0;
  if (sugarValue > 10) {
    risks.push({
      level: 'warning',
      title: '含糖量偏高',
      desc: `每100g含糖${sugarValue}g，相当于约${Math.round(sugarValue / 4)}块方糖。${user.conditions && user.conditions.includes('糖尿病') ? '糖尿病患者应严格控制。' : '建议控制摄入量。'}`
    });
    if (overallLevel === 'safe') overallLevel = 'warning';
  }

  // 4. 钠含量分析
  const sodiumMatch = product.nutrition.sodium.match(/(\d+)/);
  const sodiumValue = sodiumMatch ? parseInt(sodiumMatch[1]) : 0;
  if (sodiumValue > 400) {
    risks.push({
      level: 'warning',
      title: '钠含量偏高',
      desc: `每100g含钠${sodiumValue}mg，约占每日推荐摄入量的${Math.round(sodiumValue / 2000 * 100)}%。${user.conditions && user.conditions.includes('高血压') ? '高血压患者需特别注意。' : ''}`
    });
    if (overallLevel === 'safe') overallLevel = 'warning';
  }

  // 生成建议
  const advices = [];
  if (overallLevel === 'danger') {
    advices.push('该产品对您当前的健康状况存在较高风险，建议谨慎食用或选择替代品。');
  } else if (overallLevel === 'warning') {
    advices.push('该产品含有部分需要注意的成分，建议适量食用，不要过量。');
  } else {
    advices.push('该产品整体较为安全，可以适量食用。');
  }

  if (user.conditions && user.conditions.includes('糖尿病') && sugarValue > 5) {
    advices.push('建议选择无糖或低糖替代品。');
  }
  if (user.conditions && user.conditions.includes('胃炎')) {
    advices.push('胃炎患者建议选择无防腐剂、低刺激的温和食品。');
  }
  if (user.age >= 60) {
    advices.push('建议老年人选择低盐、低糖、易消化的食品。');
  }

  // 计算每日建议食用量
  const dailyAmount = calculateDailyAmount(product, user, overallLevel, sugarValue, sodiumValue);

  return {
    id: Date.now().toString(),
    productName: product.name,
    brand: product.brand,
    ingredients: product.ingredients,
    nutrition: product.nutrition,
    overallLevel,
    risks,
    advices,
    dailyAmount,
    userId: user.id,
    userName: user.name
  };
}

// 计算每日建议食用量
function calculateDailyAmount(product, user, overallLevel, sugarValue, sodiumValue) {
  // 基础建议量（根据食品类型）
  let baseAmount = 30; // 默认30g
  let unit = 'g';

  if (product.name.includes('饼干')) { baseAmount = 25; unit = 'g（约3-4片）'; }
  else if (product.name.includes('饮品') || product.name.includes('酸奶') || product.name.includes('乳')) { baseAmount = 100; unit = 'ml（约半杯）'; }
  else if (product.name.includes('薯片')) { baseAmount = 15; unit = 'g（约10片）'; }
  else if (product.name.includes('面包')) { baseAmount = 50; unit = 'g（约1片）'; }
  else if (product.name.includes('豆浆') || product.name.includes('粉')) { baseAmount = 30; unit = 'g（约3勺）'; }

  // 根据风险等级调整
  if (overallLevel === 'danger') {
    return { amount: '不建议食用', unit: '', reason: '该产品对您存在较高健康风险' };
  }

  // 根据用户健康状况进一步调整
  let adjustedAmount = baseAmount;
  let reasons = [];

  if (user.conditions) {
    if (user.conditions.includes('糖尿病') && sugarValue > 5) {
      adjustedAmount = Math.min(adjustedAmount, 15);
      reasons.push('糖尿病患者需严格控制糖分');
    }
    if (user.conditions.includes('高血压') && sodiumValue > 300) {
      adjustedAmount = Math.min(adjustedAmount, 20);
      reasons.push('高血压患者需控制钠摄入');
    }
    if (user.conditions.includes('胃炎')) {
      adjustedAmount = Math.min(adjustedAmount, 20);
      reasons.push('胃炎患者宜少量食用');
    }
    if (user.conditions.includes('高血脂') && product.nutrition.fat) {
      const fatMatch = product.nutrition.fat.match(/(\d+)/);
      const fatValue = fatMatch ? parseInt(fatMatch[1]) : 0;
      if (fatValue > 20) {
        adjustedAmount = Math.min(adjustedAmount, 15);
        reasons.push('脂肪含量较高，需控制摄入量');
      }
    }
    if (user.conditions.includes('痛风')) {
      adjustedAmount = Math.min(adjustedAmount, 20);
      reasons.push('痛风患者需控制嘌呤和果糖摄入');
    }
    if (user.conditions.includes('肾病')) {
      adjustedAmount = Math.min(adjustedAmount, 15);
      reasons.push('肾病患者需严格控制饮食');
    }
  }

  // 根据年龄调整
  if (user.age >= 65) {
    adjustedAmount = Math.round(adjustedAmount * 0.8);
    reasons.push('老年人消化能力较弱，建议减量');
  } else if (user.age <= 12) {
    adjustedAmount = Math.round(adjustedAmount * 0.6);
    reasons.push('儿童每日摄入量应适当减少');
  }

  // 根据糖分进一步调整
  if (sugarValue > 15) {
    adjustedAmount = Math.min(adjustedAmount, 20);
    reasons.push('含糖量较高，建议少量食用');
  }

  // 根据钠含量进一步调整
  if (sodiumValue > 500) {
    adjustedAmount = Math.min(adjustedAmount, 15);
    reasons.push('钠含量较高，建议少量食用');
  }

  const reasonText = reasons.length > 0 ? reasons.join('；') : '根据您的健康状况评估';

  return {
    amount: `${adjustedAmount}${unit}`,
    unit: '',
    reason: reasonText
  };
}

// ===== 结果展示 =====
function showResult(result) {
  const body = document.getElementById('resultBody');

  const levelConfig = {
    danger: { icon: '!', title: '高风险 - 不建议食用', desc: '该产品对您的健康存在明显风险', cls: 'danger' },
    warning: { icon: '?', title: '中等风险 - 需谨慎', desc: '含有部分需要注意的成分', cls: 'warning' },
    safe: { icon: 'OK', title: '低风险 - 可以食用', desc: '整体较为安全，适量即可', cls: 'safe' }
  };
  const cfg = levelConfig[result.overallLevel];

  const risksHtml = result.risks.map(r => `
    <div class="risk-item ${r.level}">
      <div class="risk-item-icon">${r.level === 'danger' ? '!' : r.level === 'warning' ? '?' : 'OK'}</div>
      <div class="risk-item-text">
        <h6>${r.title}</h6>
        <p>${r.desc}</p>
      </div>
    </div>
  `).join('');

  const nutritionHtml = Object.entries(result.nutrition).map(([k, v]) => {
    const labels = { energy: '能量', protein: '蛋白质', fat: '脂肪', carbs: '碳水化合物', sugar: '糖', sodium: '钠', fiber: '膳食纤维' };
    return `<span style="display:inline-block;padding:4px 10px;background:var(--bg);border-radius:6px;font-size:0.78rem;margin:3px;"><strong>${labels[k] || k}</strong> ${v}</span>`;
  }).join('');

  body.innerHTML = `
    <div class="result-image-wrap">
      <img src="${result.image}" alt="扫描图片">
    </div>
    <div class="result-content">
      <div class="result-overall ${cfg.cls}">
        <div class="result-overall-icon">${cfg.icon}</div>
        <div class="result-overall-text">
          <h4>${cfg.title}</h4>
          <p>${cfg.desc}</p>
        </div>
      </div>

      <div class="result-section">
        <h5>识别结果</h5>
        <p style="font-size:0.9rem;font-weight:600;margin-bottom:6px;">${result.brand} ${result.productName}</p>
        <p style="font-size:0.82rem;color:var(--muted);">配料：${result.ingredients.join('、')}</p>
      </div>

      <div class="result-section">
        <h5>营养成分</h5>
        <div>${nutritionHtml}</div>
      </div>

      ${risksHtml ? `
      <div class="result-section">
        <h5>风险提示</h5>
        ${risksHtml}
      </div>
      ` : ''}

      <div class="result-section">
        <div class="advice-box" style="background:linear-gradient(135deg,#E8F5EC,#F0F7F2);border-left-color:var(--accent);">
          <h6>每日建议食用量</h6>
          <p style="font-size:1.1rem;font-weight:700;color:var(--accent);margin-bottom:6px;">${result.dailyAmount.amount}</p>
          <p style="font-size:0.8rem;color:var(--muted);">${result.dailyAmount.reason}</p>
        </div>
      </div>

      <div class="result-section">
        <div class="advice-box">
          <h6>专属建议</h6>
          <ul>
            ${result.advices.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;

  document.getElementById('resultModal').style.display = 'flex';
}

function closeResultModal() {
  document.getElementById('resultModal').style.display = 'none';
}

// ===== 历史记录 =====
function renderHistory() {
  const section = document.getElementById('historySection');
  const listEl = document.getElementById('historyList');

  const userHistory = state.history.filter(h => h.userId === state.currentUserId);

  if (userHistory.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  listEl.innerHTML = userHistory.slice(0, 10).map(h => {
    const levelText = h.overallLevel === 'danger' ? '高风险' : h.overallLevel === 'warning' ? '中风险' : '低风险';
    const timeStr = new Date(h.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item" onclick="showHistoryResult('${h.id}')">
        <img class="history-thumb" src="${h.image}" alt="">
        <div class="history-info">
          <div class="history-name">${h.brand} ${h.productName}</div>
          <div class="history-meta">${timeStr} · ${h.risks.length}项风险</div>
        </div>
        <span class="history-risk ${h.overallLevel}">${levelText}</span>
      </div>
    `;
  }).join('');
}

function showHistoryResult(id) {
  const result = state.history.find(h => h.id === id);
  if (result) showResult(result);
}

function clearHistory() {
  if (!confirm('确定清空当前用户的扫描历史吗？')) return;
  state.history = state.history.filter(h => h.userId !== state.currentUserId);
  saveHistory();
  renderHistory();
}

// ===== 加载动画 =====
function showLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', init);
