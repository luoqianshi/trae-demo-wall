// ========== Data Store ==========
const Store = {
  preferences: JSON.parse(localStorage.getItem('csm_preferences') || '{}'),
  health: JSON.parse(localStorage.getItem('csm_health') || '{}'),
  medicines: JSON.parse(localStorage.getItem('csm_medicines') || '[]'),
  ratings: JSON.parse(localStorage.getItem('csm_ratings') || '{}'),
  records: JSON.parse(localStorage.getItem('csm_records') || '[]'),
  glucose: JSON.parse(localStorage.getItem('csm_glucose') || '[]'),
  scores: JSON.parse(localStorage.getItem('csm_scores') || '{}'),
  pinOrders: JSON.parse(localStorage.getItem('csm_pinOrders') || '[]'),
  tuiRecommends: JSON.parse(localStorage.getItem('csm_tuiRecommends') || '[]'),
  customDishes: JSON.parse(localStorage.getItem('csm_customDishes') || '[]'),
  dishVariants: JSON.parse(localStorage.getItem('csm_dishVariants') || '{}'),
  currentMealType: 'lunch',
  currentDish: null,
  photoDish: null,
  selectedScoreMeal: null,
  currentRecipeDishId: null,

  save() {
    localStorage.setItem('csm_preferences', JSON.stringify(this.preferences));
    localStorage.setItem('csm_health', JSON.stringify(this.health));
    localStorage.setItem('csm_medicines', JSON.stringify(this.medicines));
    localStorage.setItem('csm_ratings', JSON.stringify(this.ratings));
    localStorage.setItem('csm_records', JSON.stringify(this.records));
    localStorage.setItem('csm_glucose', JSON.stringify(this.glucose));
    localStorage.setItem('csm_scores', JSON.stringify(this.scores));
    localStorage.setItem('csm_pinOrders', JSON.stringify(this.pinOrders));
    localStorage.setItem('csm_tuiRecommends', JSON.stringify(this.tuiRecommends));
    localStorage.setItem('csm_customDishes', JSON.stringify(this.customDishes));
    localStorage.setItem('csm_dishVariants', JSON.stringify(this.dishVariants));
  }
};

// ========== Dish Database ==========
const DISH_DB = [
  { id: 1, name: '西红柿炒鸡蛋', cuisine: 'home', taste: 'both', time: 10, cal: 120, protein: 8, fat: 9, carb: 6, tags: ['quick','healthy'], meal: ['breakfast','lunch','dinner'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 120, protein: 8, fat: 9, carb: 6, fiber: 1.2, sodium: 280 },
    steps: ['西红柿切块，鸡蛋打散备用','热锅凉油，倒入蛋液炒散盛出','锅中留底油，炒西红柿出汁','倒入鸡蛋翻炒均匀，加盐调味'] },
  { id: 2, name: '宫保鸡丁', cuisine: 'sichuan', taste: 'salty', time: 25, cal: 280, protein: 22, fat: 16, carb: 12, tags: ['spicy','quick'], meal: ['lunch','dinner'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 280, protein: 22, fat: 16, carb: 12, fiber: 2, sodium: 580 },
    steps: ['鸡胸肉切丁，加料酒、生抽、淀粉腌制','花生米炸酥备用','调酱汁：生抽、醋、糖、淀粉、水','热锅炒香干辣椒花椒，下鸡丁滑散','倒入酱汁翻炒，加花生米拌匀'] },
  { id: 3, name: '清蒸鲈鱼', cuisine: 'cantonese', taste: 'salty', time: 20, cal: 180, protein: 28, fat: 6, carb: 2, tags: ['healthy','quick'], meal: ['lunch','dinner'], image: 'assets/dish-dinner.jpg',
    nutrition: { calories: 180, protein: 28, fat: 6, carb: 2, fiber: 0, sodium: 320 },
    steps: ['鲈鱼处理干净，两面划刀','盘底铺姜片葱段，放鱼','水开后蒸8-10分钟','倒掉蒸鱼水，铺葱丝姜丝','淋蒸鱼豉油，浇热油'] },
  { id: 4, name: '红烧肉', cuisine: 'shanghai', taste: 'sweet', time: 60, cal: 450, protein: 18, fat: 35, carb: 15, tags: ['sweet'], meal: ['lunch','dinner'], image: 'assets/dish-dinner.jpg',
    nutrition: { calories: 450, protein: 18, fat: 35, carb: 15, fiber: 0.5, sodium: 420 },
    steps: ['五花肉切块焯水','小火炒糖色','下肉块翻炒上色','加生抽、老抽、料酒、八角','加水没过肉，小火炖45分钟','大火收汁'] },
  { id: 5, name: '麻婆豆腐', cuisine: 'sichuan', taste: 'salty', time: 15, cal: 220, protein: 12, fat: 14, carb: 10, tags: ['spicy','quick','vegetarian'], meal: ['lunch','dinner'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 220, protein: 12, fat: 14, carb: 10, fiber: 2.5, sodium: 620 },
    steps: ['豆腐切块焯水','热锅炒香肉末','加豆瓣酱炒出红油','加水煮开，下豆腐','勾芡，撒花椒粉、葱花'] },
  { id: 6, name: '小笼包', cuisine: 'jiangsu', taste: 'salty', time: 40, cal: 320, protein: 14, fat: 14, carb: 36, tags: [], meal: ['breakfast','tea'], image: 'assets/dish-breakfast.jpg',
    nutrition: { calories: 320, protein: 14, fat: 14, carb: 36, fiber: 1.5, sodium: 380 },
    steps: ['肉馅加皮冻、调料拌匀','面皮擀薄包入肉馅','放入蒸笼，水开后蒸8分钟'] },
  { id: 7, name: '皮蛋瘦肉粥', cuisine: 'cantonese', taste: 'salty', time: 30, cal: 200, protein: 12, fat: 6, carb: 28, tags: ['healthy'], meal: ['breakfast','supper'], image: 'assets/dish-breakfast.jpg',
    nutrition: { calories: 200, protein: 12, fat: 6, carb: 28, fiber: 0.8, sodium: 350 },
    steps: ['大米淘洗浸泡','瘦肉切丝腌制','煮粥至粘稠','加入肉丝、皮蛋碎','调味撒葱花'] },
  { id: 8, name: '糖醋排骨', cuisine: 'jiangsu', taste: 'sweet', time: 45, cal: 380, protein: 20, fat: 22, carb: 28, tags: ['sweet'], meal: ['lunch','dinner'], image: 'assets/dish-dinner.jpg',
    nutrition: { calories: 380, protein: 20, fat: 22, carb: 28, fiber: 0.3, sodium: 360 },
    steps: ['排骨切段焯水','炸至金黄','调糖醋汁：糖、醋、生抽、番茄酱','倒入排骨翻炒裹汁'] },
  { id: 9, name: '蒜蓉西兰花', cuisine: 'home', taste: 'salty', time: 8, cal: 80, protein: 4, fat: 4, carb: 8, tags: ['healthy','quick','vegetarian'], meal: ['lunch','dinner'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 80, protein: 4, fat: 4, carb: 8, fiber: 3.2, sodium: 180 },
    steps: ['西兰花切小朵焯水','蒜末爆香','下西兰花翻炒','加盐调味'] },
  { id: 10, name: '蛋挞', cuisine: 'cantonese', taste: 'sweet', time: 25, cal: 280, protein: 5, fat: 18, carb: 24, tags: ['sweet'], meal: ['tea','snack'], image: 'assets/dish-tea.jpg',
    nutrition: { calories: 280, protein: 5, fat: 18, carb: 24, fiber: 0.2, sodium: 120 },
    steps: ['蛋挞皮解冻','牛奶、糖、蛋黄混合均匀','过筛倒入蛋挞皮','烤箱200度烤20分钟'] },
  { id: 11, name: '麻辣小龙虾', cuisine: 'hunan', taste: 'salty', time: 35, cal: 320, protein: 24, fat: 18, carb: 12, tags: ['spicy'], meal: ['supper','dinner'], image: 'assets/dish-supper.jpg',
    nutrition: { calories: 320, protein: 24, fat: 18, carb: 12, fiber: 1, sodium: 720 },
    steps: ['小龙虾刷洗干净','过油炸红','炒香花椒、干辣椒、豆瓣酱','下小龙虾翻炒','加啤酒焖煮15分钟'] },
  { id: 12, name: '豆浆油条', cuisine: 'north', taste: 'both', time: 5, cal: 350, protein: 10, fat: 18, carb: 38, tags: ['quick'], meal: ['breakfast'], image: 'assets/dish-breakfast.jpg',
    nutrition: { calories: 350, protein: 10, fat: 18, carb: 38, fiber: 1, sodium: 280 },
    steps: ['豆浆加热','油条复炸酥脆','搭配食用'] },
  { id: 13, name: '白切鸡', cuisine: 'cantonese', taste: 'salty', time: 30, cal: 200, protein: 30, fat: 8, carb: 0, tags: ['healthy'], meal: ['lunch','dinner'], image: 'assets/dish-dinner.jpg',
    nutrition: { calories: 200, protein: 30, fat: 8, carb: 0, fiber: 0, sodium: 260 },
    steps: ['整鸡洗净','水开后下锅，三提三放','小火浸煮20分钟','冰水浸泡','斩件配姜葱蘸料'] },
  { id: 14, name: '酸辣汤', cuisine: 'sichuan', taste: 'salty', time: 15, cal: 120, protein: 6, fat: 5, carb: 14, tags: ['spicy','quick','vegetarian'], meal: ['lunch','dinner'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 120, protein: 6, fat: 5, carb: 14, fiber: 2, sodium: 520 },
    steps: ['豆腐、木耳、香菇切丝','水开下食材','加醋、胡椒粉、生抽调味','勾芡，淋蛋液','撒香菜'] },
  { id: 15, name: '烤串拼盘', cuisine: 'north', taste: 'salty', time: 20, cal: 400, protein: 22, fat: 28, carb: 8, tags: ['spicy'], meal: ['supper','snack'], image: 'assets/dish-supper.jpg',
    nutrition: { calories: 400, protein: 22, fat: 28, carb: 8, fiber: 0.5, sodium: 580 },
    steps: ['肉串腌制','炭火烤制','撒孜然、辣椒粉','刷油继续烤'] },
  { id: 16, name: '扬州炒饭', cuisine: 'jiangsu', taste: 'salty', time: 12, cal: 380, protein: 14, fat: 16, carb: 44, tags: ['quick'], meal: ['lunch','dinner'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 380, protein: 14, fat: 16, carb: 44, fiber: 1.2, sodium: 340 },
    steps: ['鸡蛋炒散备用','火腿、虾仁、豌豆焯水','炒饭至粒粒分明','加入配料翻炒均匀'] },
  { id: 17, name: '凉拌黄瓜', cuisine: 'home', taste: 'salty', time: 5, cal: 45, protein: 1, fat: 2, carb: 6, tags: ['quick','healthy','vegetarian'], meal: ['lunch','dinner','snack'], image: 'assets/dish-lunch.jpg',
    nutrition: { calories: 45, protein: 1, fat: 2, carb: 6, fiber: 1.5, sodium: 200 },
    steps: ['黄瓜拍碎切段','加蒜末、盐、醋、香油','拌匀即可'] },
  { id: 18, name: '虾仁蒸蛋', cuisine: 'cantonese', taste: 'salty', time: 12, cal: 160, protein: 18, fat: 8, carb: 4, tags: ['healthy','quick'], meal: ['breakfast','lunch','dinner'], image: 'assets/dish-dinner.jpg',
    nutrition: { calories: 160, protein: 18, fat: 8, carb: 4, fiber: 0, sodium: 280 },
    steps: ['鸡蛋打散，加1.5倍温水','过筛去泡','加入虾仁','水开后蒸8分钟','淋生抽、香油'] },
  { id: 19, name: '水果沙拉', cuisine: 'home', taste: 'sweet', time: 5, cal: 150, protein: 2, fat: 3, carb: 32, tags: ['healthy','quick','vegetarian'], meal: ['breakfast','tea','snack'], image: 'assets/dish-tea.jpg',
    nutrition: { calories: 150, protein: 2, fat: 3, carb: 32, fiber: 4, sodium: 20 },
    steps: ['水果切块','加酸奶或沙拉酱','拌匀即可'] },
  { id: 20, name: '牛肉拉面', cuisine: 'north', taste: 'salty', time: 40, cal: 420, protein: 22, fat: 14, carb: 52, tags: [], meal: ['lunch','dinner','supper'], image: 'assets/dish-supper.jpg',
    nutrition: { calories: 420, protein: 22, fat: 14, carb: 52, fiber: 2, sodium: 680 },
    steps: ['牛肉焯水炖汤','和面拉面','煮面','浇牛肉汤，放牛肉片','撒香菜、辣椒油'] },
];

const CUISINE_NAMES = {
  sichuan: '川菜', cantonese: '粤菜', shandong: '鲁菜', jiangsu: '苏菜',
  zhejiang: '浙菜', hunan: '湘菜', anhui: '徽菜', fujian: '闽菜',
  northeast: '东北菜', north: '北方菜', south: '南方菜', shanghai: '上海菜', home: '家常菜', other: '其他'
};

const MEDICINE_FOOD_MAP = {
  '二甲双胍': { forbidden: ['高糖食物','酒精'], reason: '可能引起低血糖或乳酸酸中毒' },
  '胰岛素': { forbidden: ['高糖食物','酒精','空腹运动'], reason: '需配合饮食控制' },
  '华法林': { forbidden: ['菠菜','西兰花','绿茶'], reason: '富含维生素K，影响药效' },
  '降压药': { forbidden: ['高盐食物','葡萄柚'], reason: '影响血压控制' },
  '他汀类': { forbidden: ['葡萄柚','酒精'], reason: '增加副作用风险' },
  '阿司匹林': { forbidden: ['酒精','辛辣食物'], reason: '增加胃出血风险' },
};

// ========== Mock Users for Tui ==========
const MOCK_USERS = [
  { id: 'u1', name: '小吃货', avatar: '\ud83d\ude0b', taste: 'sweet', region: ['cantonese'], spicy: 'none', diet: ['balanced'], signature: '爱吃甜食的广东人' },
  { id: 'u2', name: '辣妹子', avatar: '\ud83c\udf36\ufe0f', taste: 'salty', region: ['sichuan','hunan'], spicy: 'hot', diet: ['meat'], signature: '无辣不欢，川菜湘菜都爱' },
  { id: 'u3', name: '养生达人', avatar: '\ud83e\udd57', taste: 'both', region: ['home'], spicy: 'mild', diet: ['vegetarian','healthy'], signature: '清淡为主，追求健康' },
  { id: 'u4', name: '肉食动物', avatar: '\ud83c\udf56', taste: 'salty', region: ['northeast','north'], spicy: 'medium', diet: ['meat'], signature: '大口吃肉，豪爽东北风' },
  { id: 'u5', name: '江南小厨', avatar: '\ud83c\udf5c', taste: 'sweet', region: ['jiangsu','zhejiang'], spicy: 'none', diet: ['balanced','seafood'], signature: '精致江浙菜爱好者' },
];

// ========== Navigation ==========
function goToPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { 'page-home': 0, 'page-recommend': 1, 'page-record': 2, 'page-score': 3 };
  const navIdx = navMap[pageId];
  if (navIdx !== undefined) {
    document.querySelectorAll('.nav-item')[navIdx].classList.add('active');
  }

  if (pageId === 'page-home') updateHomeSummary();
  if (pageId === 'page-record') updateRecordPage();
  if (pageId === 'page-score') updateScorePage();
  if (pageId === 'page-preference') initPreferencePage();
  if (pageId === 'page-health') initHealthPage();
  if (pageId === 'page-pin') initPinPage();
  if (pageId === 'page-tui') initTuiPage();
  if (pageId === 'page-zuo') initZuoPage();
  window.scrollTo(0, 0);
}

// ========== Tabs ==========
function switchTab(tabId) {
  const parent = document.querySelector('[data-tab="' + tabId + '"]').closest('.page');
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  parent.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
  parent.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const content = parent.querySelector('#' + tabId);
  if (content) content.style.display = 'block';
}

function switchModalTab(tabId) {
  const modal = document.getElementById('dish-modal');
  modal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  modal.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
  modal.querySelectorAll('.modal-tab-content').forEach(c => c.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
}

// ========== Toast ==========
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ========== Option Chips ==========
function initOptionChips() {
  document.querySelectorAll('.option-group').forEach(group => {
    group.querySelectorAll('.option-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const isMulti = ['diet-type','allergens','health-issues','region-pref','zuo-cuisine','zuo-taste'].includes(group.id);
        if (!isMulti) {
          group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
        }
        if (isMulti && chip.dataset.value === 'none') {
          group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
        } else if (isMulti) {
          const noneChip = group.querySelector('[data-value="none"]');
          if (noneChip) noneChip.classList.remove('selected');
        }
        chip.classList.toggle('selected');
      });
    });
  });
}

function getSelectedValues(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return [];
  return Array.from(group.querySelectorAll('.option-chip.selected')).map(c => c.dataset.value);
}

function setSelectedValues(groupId, values) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.option-chip').forEach(c => {
    c.classList.toggle('selected', values.includes(c.dataset.value));
  });
}

// ========== Preference Page ==========
function initPreferencePage() {
  const p = Store.preferences;
  if (p.taste) setSelectedValues('taste-pref', [p.taste]);
  if (p.tomatoEgg) setSelectedValues('tomato-egg', [p.tomatoEgg]);
  if (p.tofuBrain) setSelectedValues('tofu-brain', [p.tofuBrain]);
  if (p.region) setSelectedValues('region-pref', p.region);
  if (p.spicy) setSelectedValues('spicy-level', [p.spicy]);
  if (p.diet) setSelectedValues('diet-type', p.diet);
  if (p.allergens) setSelectedValues('allergens', p.allergens);

  renderRatingList();
}

function savePreferences() {
  Store.preferences = {
    taste: getSelectedValues('taste-pref')[0] || '',
    tomatoEgg: getSelectedValues('tomato-egg')[0] || '',
    tofuBrain: getSelectedValues('tofu-brain')[0] || '',
    region: getSelectedValues('region-pref'),
    spicy: getSelectedValues('spicy-level')[0] || '',
    diet: getSelectedValues('diet-type'),
    allergens: getSelectedValues('allergens'),
  };
  Store.save();
  showToast('偏好已保存！');
}

// ========== Rating with specific dishes ==========
function renderRatingList() {
  const container = document.getElementById('rating-list');
  if (!container) return;

  // Pick 10 random dishes from DB for rating
  const shuffled = [...DISH_DB].sort(() => 0.5 - Math.random());
  const ratingDishes = shuffled.slice(0, 10);

  container.innerHTML = ratingDishes.map(dish => {
    const saved = Store.ratings['dish_' + dish.id] || 0;
    const stars = [1,2,3,4,5].map(s =>
      '<span class="rating-star ' + (s <= saved ? 'active' : '') + '" onclick="rateDish(' + dish.id + ', ' + s + ')">★</span>'
    ).join('');
    const labels = ['没吃过','一般','还行','喜欢','超爱'];
    const label = saved > 0 ? labels[saved-1] : '点击评分';
    return `
      <div class="food-rating-card">
        <div class="food-name">${dish.name}</div>
        <div class="food-cuisine">${CUISINE_NAMES[dish.cuisine] || dish.cuisine} · ${dish.cal}千卡</div>
        <div class="rating-group" style="justify-content:center;">
          ${stars}
          <span class="rating-label">${label}</span>
        </div>
        <button class="skip-btn" onclick="rateDish(${dish.id}, 0)">没吃过</button>
      </div>
    `;
  }).join('');
}

function rateDish(dishId, score) {
  Store.ratings['dish_' + dishId] = score;
  Store.save();
  renderRatingList();
}

function saveRatings() {
  Store.save();
  showToast('口味打分已保存！');
}

// ========== Health Page ==========
function initHealthPage() {
  const h = Store.health;
  if (h.height) document.getElementById('height').value = h.height;
  if (h.weight) document.getElementById('weight').value = h.weight;
  if (h.bodyfat) document.getElementById('bodyfat').value = h.bodyfat;
  if (h.age) document.getElementById('age').value = h.age;
  if (h.gender) setSelectedValues('gender', [h.gender]);
  if (h.bloodSugar) setSelectedValues('blood-sugar', [h.bloodSugar]);
  if (h.bloodLipid) setSelectedValues('blood-lipid', [h.bloodLipid]);
  if (h.bloodPressure) setSelectedValues('blood-pressure', [h.bloodPressure]);
  if (h.issues) setSelectedValues('health-issues', h.issues);

  renderMedicineList();
  updateForbiddenFoods();
  renderGlucoseChart();
}

function saveHealth() {
  Store.health = {
    height: document.getElementById('height').value,
    weight: document.getElementById('weight').value,
    bodyfat: document.getElementById('bodyfat').value,
    age: document.getElementById('age').value,
    gender: getSelectedValues('gender')[0] || '',
    bloodSugar: getSelectedValues('blood-sugar')[0] || '',
    bloodLipid: getSelectedValues('blood-lipid')[0] || '',
    bloodPressure: getSelectedValues('blood-pressure')[0] || '',
    issues: getSelectedValues('health-issues'),
  };
  Store.save();
  showToast('健康信息已保存！');
}

function renderMedicineList() {
  const container = document.getElementById('medicine-list');
  if (!container) return;
  if (Store.medicines.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm">暂无用药记录</p>';
    return;
  }
  container.innerHTML = Store.medicines.map((med, idx) => `
    <div class="record-item">
      <div class="record-meal">
        <div class="record-meal-name">${med.name}</div>
        <div class="record-meal-dishes">${med.dose} · ${med.frequency}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="removeMedicine(${idx})">删除</button>
    </div>
  `).join('');
}

// ========== Inline Medicine Form (replaces prompt) ==========
function addMedicine() {
  const container = document.getElementById('medicine-list');
  if (!container) return;

  // Check if form already exists
  if (document.getElementById('medicine-inline-form')) return;

  const formHtml = `
    <div id="medicine-inline-form" class="card" style="margin:12px 0;padding:16px;">
      <div class="form-group">
        <label class="form-label">药物名称</label>
        <input type="text" class="form-input" id="med-name" placeholder="例如：二甲双胍">
      </div>
      <div class="form-group">
        <label class="form-label">剂量</label>
        <input type="text" class="form-input" id="med-dose" placeholder="例如：500mg">
      </div>
      <div class="form-group">
        <label class="form-label">服用频率</label>
        <input type="text" class="form-input" id="med-freq" placeholder="例如：每日两次">
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary btn-sm" onclick="cancelAddMedicine()">取消</button>
        <button class="btn btn-primary btn-sm" onclick="confirmAddMedicine()">确认添加</button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('afterbegin', formHtml);
}

function cancelAddMedicine() {
  const form = document.getElementById('medicine-inline-form');
  if (form) form.remove();
}

function confirmAddMedicine() {
  const name = document.getElementById('med-name').value.trim();
  const dose = document.getElementById('med-dose').value.trim();
  const freq = document.getElementById('med-freq').value.trim();

  if (!name) {
    showToast('请输入药物名称');
    return;
  }

  Store.medicines.push({ name, dose, frequency: freq });
  Store.save();
  cancelAddMedicine();
  renderMedicineList();
  updateForbiddenFoods();
  showToast('药物添加成功！');
}

function removeMedicine(idx) {
  Store.medicines.splice(idx, 1);
  Store.save();
  renderMedicineList();
  updateForbiddenFoods();
}

function updateForbiddenFoods() {
  const container = document.getElementById('forbidden-foods');
  if (!container) return;
  const foods = new Set();
  const reasons = [];
  Store.medicines.forEach(med => {
    const info = MEDICINE_FOOD_MAP[med.name];
    if (info) {
      info.forbidden.forEach(f => foods.add(f));
      reasons.push(med.name + '：' + info.reason);
    }
  });
  if (foods.size === 0) {
    container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px;">添加用药后，这里会显示不推荐的食物</p>';
    return;
  }
  container.innerHTML = `
    <div class="dish-card-tags" style="margin-bottom:12px;">
      ${Array.from(foods).map(f => '<span class="dish-tag spicy">' + f + '</span>').join('')}
    </div>
    <div style="font-size:13px;color:var(--muted);">
      ${reasons.map(r => '<p style="margin-bottom:6px;">• ' + r + '</p>').join('')}
    </div>
  `;
}

// ========== Glucose Monitor ==========
function simulateGlucoseConnect() {
  const val = (Math.random() * 3 + 4).toFixed(1);
  document.getElementById('glucose-value').textContent = val;
  const statusEl = document.getElementById('glucose-status');
  if (val < 3.9) {
    statusEl.textContent = '血糖偏低';
    statusEl.className = 'glucose-status low';
  } else if (val > 6.1) {
    statusEl.textContent = '血糖偏高';
    statusEl.className = 'glucose-status high';
  } else {
    statusEl.textContent = '血糖正常';
    statusEl.className = 'glucose-status normal';
  }
  recordGlucoseValue(parseFloat(val), 'fasting');
  showToast('血糖仪已连接，读取成功！');
}

function recordGlucose() {
  const val = parseFloat(document.getElementById('manual-glucose').value);
  const time = document.getElementById('glucose-time').value;
  if (!val || isNaN(val)) {
    showToast('请输入有效的血糖值');
    return;
  }
  recordGlucoseValue(val, time);
  document.getElementById('manual-glucose').value = '';
  showToast('血糖记录成功！');
}

function recordGlucoseValue(val, timeType) {
  Store.glucose.push({
    value: val,
    time: timeType,
    date: new Date().toISOString(),
  });
  Store.save();
  renderGlucoseChart();
}

function renderGlucoseChart() {
  const chartDom = document.getElementById('glucose-chart');
  if (!chartDom || typeof echarts === 'undefined') return;
  const data = Store.glucose.slice(-14);
  const xData = data.map((g, i) => '' + (i+1));
  const yData = data.map(g => g.value);

  const chart = echarts.init(chartDom, null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    grid: { top: 20, right: 10, bottom: 30, left: 40 },
    xAxis: { type: 'category', data: xData, axisLine: { lineStyle: { color: '#E8E8F0' } }, axisLabel: { color: '#8A8AA3', fontSize: 11 } },
    yAxis: { type: 'value', min: 3, max: 9, axisLine: { show: false }, splitLine: { lineStyle: { color: '#E8E8F0' } }, axisLabel: { color: '#8A8AA3', fontSize: 11 } },
    series: [{
      data: yData,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#FF6B35', width: 2 },
      itemStyle: { color: '#FF6B35' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,107,53,0.2)' }, { offset: 1, color: 'rgba(255,107,53,0)' }] } },
    }],
  });
  window.addEventListener('resize', () => chart.resize());
}

// ========== Recommend Page ==========
function selectMealType(meal) {
  Store.currentMealType = meal;
  document.querySelectorAll('.meal-type-item').forEach(el => el.classList.remove('selected'));
  document.querySelector('[data-meal="' + meal + '"]').classList.add('selected');
}

function generateRecommendations() {
  const method = getSelectedValues('cook-method')[0] || 'cook';
  const maxTime = method === 'cook' ? parseInt(document.getElementById('cook-time').value) || 999 : 999;
  const meal = Store.currentMealType;

  let candidates = DISH_DB.filter(d => d.meal.includes(meal) && d.time <= maxTime);

  // Filter by health
  const health = Store.health;
  if (health.bloodSugar === 'high' || health.bloodSugar === 'diabetes') {
    candidates = candidates.filter(d => d.carb < 30 && d.cal < 350);
  }
  if (health.bloodLipid === 'high') {
    candidates = candidates.filter(d => d.fat < 18);
  }
  if (health.bloodPressure === 'high') {
    candidates = candidates.filter(d => d.nutrition.sodium < 500);
  }
  if (health.issues && health.issues.includes('gout')) {
    candidates = candidates.filter(d => d.name !== '麻辣小龙虾');
  }

  // Filter by allergens
  const allergens = Store.preferences.allergens || [];
  if (allergens.includes('peanut')) candidates = candidates.filter(d => d.name !== '宫保鸡丁');
  if (allergens.includes('shellfish')) candidates = candidates.filter(d => d.name !== '麻辣小龙虾' && d.name !== '虾仁蒸蛋');
  if (allergens.includes('egg')) candidates = candidates.filter(d => d.name !== '西红柿炒鸡蛋' && d.name !== '蛋挞' && d.name !== '虾仁蒸蛋');
  if (allergens.includes('milk')) candidates = candidates.filter(d => d.name !== '水果沙拉');
  if (allergens.includes('gluten')) candidates = candidates.filter(d => d.name !== '小笼包' && d.name !== '牛肉拉面');
  if (allergens.includes('soy')) candidates = candidates.filter(d => d.name !== '麻婆豆腐');

  // Filter by medicine
  Store.medicines.forEach(med => {
    const info = MEDICINE_FOOD_MAP[med.name];
    if (info) {
      info.forbidden.forEach(f => {
        if (f.indexOf('糖') >= 0) candidates = candidates.filter(d => d.tags.indexOf('sweet') < 0);
        if (f.indexOf('盐') >= 0 || f.indexOf('钠') >= 0) candidates = candidates.filter(d => d.nutrition.sodium < 400);
      });
    }
  });

  // Sort by preference
  const prefs = Store.preferences;
  const ratings = Store.ratings;
  candidates.sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    if (prefs.taste && a.taste === prefs.taste) scoreA += 3;
    if (prefs.taste && b.taste === prefs.taste) scoreB += 3;
    if (prefs.region && prefs.region.indexOf(a.cuisine) >= 0) scoreA += 2;
    if (prefs.region && prefs.region.indexOf(b.cuisine) >= 0) scoreB += 2;
    const rA = ratings['dish_' + a.id] || ratings[a.cuisine] || 3;
    const rB = ratings['dish_' + b.id] || ratings[b.cuisine] || 3;
    scoreA += rA;
    scoreB += rB;
    return scoreB - scoreA;
  });

  const results = candidates.slice(0, 4);
  const container = document.getElementById('recommend-list');
  document.getElementById('recommend-results').style.display = 'block';

  if (results.length === 0) {
    container.innerHTML = '<p class="text-center text-muted" style="padding:20px;">没有找到符合条件的菜肴，请调整筛选条件</p>';
    return;
  }

  container.innerHTML = results.map(dish => `
    <div class="dish-card" onclick="openDishModal(${dish.id})">
      <img src="${dish.image}" alt="${dish.name}" class="dish-card-image">
      <div class="dish-card-body">
        <div class="dish-card-title">${dish.name}</div>
        <div class="dish-card-meta">
          <span>${dish.cal}千卡</span>
          <span>${dish.time}分钟</span>
          <span>${CUISINE_NAMES[dish.cuisine] || dish.cuisine}</span>
        </div>
        <div class="dish-card-tags">
          ${dish.tags.map(t => '<span class="dish-tag ' + t + '">' + tagName(t) + '</span>').join('')}
        </div>
        <div class="btn-group mt-12">
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();swapDish(${dish.id})">🔄 换一个</button>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();eatDish(${dish.id})">🍽️ 吃这个</button>
        </div>
      </div>
    </div>
  `).join('');
}

function tagName(tag) {
  const map = { sweet: '甜口', salty: '咸口', spicy: '辣', healthy: '健康', quick: '快手', vegetarian: '素食' };
  return map[tag] || tag;
}

function swapDish(dishId) {
  generateRecommendations();
}

function eatDish(dishId) {
  const dish = DISH_DB.find(d => d.id === dishId);
  if (!dish) return;
  const meal = Store.currentMealType;
  const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', tea: '下午茶', supper: '夜宵', snack: '零食' };
  Store.records.push({
    dishId: dish.id,
    dishName: dish.name,
    meal: meal,
    mealName: mealNames[meal],
    cal: dish.cal,
    protein: dish.protein,
    fat: dish.fat,
    carb: dish.carb,
    date: new Date().toISOString(),
  });
  Store.save();
  showToast('已记录' + mealNames[meal] + '：' + dish.name);
  updateHomeSummary();
}

// ========== Dish Modal ==========
function openDishModal(dishId) {
  const dish = DISH_DB.find(d => d.id === dishId);
  if (!dish) return;
  Store.currentDish = dish;
  document.getElementById('modal-dish-name').textContent = dish.name;
  document.getElementById('modal-dish-image').src = dish.image;
  document.getElementById('modal-dish-tags').innerHTML = dish.tags.map(t => '<span class="dish-tag ' + t + '">' + tagName(t) + '</span>').join('');

  const nutri = dish.nutrition;
  document.getElementById('modal-nutrition-grid').innerHTML = `
    <div class="nutrition-item"><div class="nutri-value">${nutri.calories}</div><div class="nutri-label">千卡</div></div>
    <div class="nutrition-item"><div class="nutri-value">${nutri.protein}g</div><div class="nutri-label">蛋白质</div></div>
    <div class="nutrition-item"><div class="nutri-value">${nutri.fat}g</div><div class="nutri-label">脂肪</div></div>
    <div class="nutrition-item"><div class="nutri-value">${nutri.carb}g</div><div class="nutri-label">碳水</div></div>
    <div class="nutrition-item"><div class="nutri-value">${nutri.fiber}g</div><div class="nutri-label">纤维</div></div>
    <div class="nutrition-item"><div class="nutri-value">${nutri.sodium}mg</div><div class="nutri-label">钠</div></div>
  `;

  document.getElementById('modal-recipe-steps').innerHTML = dish.steps.map((step, i) => `
    <div class="recipe-step">
      <div class="step-number">${i+1}</div>
      <div class="step-content">${step}</div>
    </div>
  `).join('');

  switchModalTab('modal-nutrition');
  document.getElementById('dish-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('dish-modal').classList.remove('active');
}

function addToRecordFromModal() {
  if (Store.currentDish) {
    eatDish(Store.currentDish.id);
    closeModal();
  }
}

// ========== Recipe Variants Modal ==========
function openRecipeModal(dishId) {
  const dish = DISH_DB.find(d => d.id === dishId);
  const variants = Store.dishVariants[dishId] || [];
  Store.currentRecipeDishId = dishId;

  document.getElementById('recipe-modal-title').textContent = (dish ? dish.name : '') + ' - 更多做法';

  const allRecipes = [];
  if (dish) {
    allRecipes.push({
      name: '经典做法',
      steps: dish.steps,
      difficulty: 2,
      recommend: 95,
      author: '官方',
    });
  }
  variants.forEach((v, i) => {
    allRecipes.push({
      name: v.name || '做法' + (i+1),
      steps: v.steps,
      difficulty: v.difficulty || 2,
      recommend: v.recommend || 80,
      author: v.author || '用户',
    });
  });

  document.getElementById('recipe-variants-list').innerHTML = allRecipes.map((r, i) => `
    <div class="card" style="margin:12px 0;">
      <div class="flex items-center justify-between" style="margin-bottom:8px;">
        <span class="font-bold" style="font-size:15px;">${r.name}</span>
        <span class="text-sm text-muted">by ${r.author}</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <span class="dish-tag ${r.difficulty <= 1 ? 'healthy' : r.difficulty >= 3 ? 'spicy' : 'quick'}">
          ${'⭐'.repeat(r.difficulty)} ${r.difficulty === 1 ? '简单' : r.difficulty === 2 ? '中等' : '困难'}
        </span>
        <span class="dish-tag healthy">推荐度 ${r.recommend}%</span>
      </div>
      <div style="font-size:13px;color:var(--muted);">
        ${r.steps.map((s, si) => '<p style="margin-bottom:4px;">' + (si+1) + '. ' + s + '</p>').join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('recipe-modal').classList.add('active');
}

function closeRecipeModal() {
  document.getElementById('recipe-modal').classList.remove('active');
}

// ========== Record Page ==========
function updateRecordPage() {
  document.getElementById('record-date').textContent = new Date().toLocaleDateString('zh-CN');
  updateHomeSummary();

  const today = new Date().toDateString();
  const todayRecords = Store.records.filter(r => new Date(r.date).toDateString() === today);

  const list = document.getElementById('record-list');
  const noRecords = document.getElementById('no-records');

  if (todayRecords.length === 0) {
    list.innerHTML = '';
    noRecords.style.display = 'block';
  } else {
    noRecords.style.display = 'none';
    list.innerHTML = todayRecords.map(r => `
      <div class="record-item">
        <div class="record-time">${r.mealName}</div>
        <div class="record-meal">
          <div class="record-meal-name">${r.dishName}</div>
          <div class="record-meal-dishes">蛋白质${r.protein}g · 脂肪${r.fat}g · 碳水${r.carb}g</div>
        </div>
        <div class="record-cal">${r.cal}</div>
      </div>
    `).join('');
  }

  // Nutrition advice
  const totals = todayRecords.reduce((sum, r) => ({
    cal: sum.cal + r.cal,
    protein: sum.protein + r.protein,
    fat: sum.fat + r.fat,
    carb: sum.carb + r.carb,
  }), { cal: 0, protein: 0, fat: 0, carb: 0 });

  const adviceEl = document.getElementById('nutrition-advice');
  const adviceContent = document.getElementById('advice-content');
  const advice = [];
  if (totals.protein < 50) advice.push('蛋白质摄入不足，建议补充鸡蛋、鱼肉或豆制品');
  if (totals.fat > 60) advice.push('脂肪摄入偏多，建议减少油腻食物');
  if (totals.carb < 100) advice.push('碳水化合物偏低，可适当增加主食');
  if (totals.cal < 1200) advice.push('今日热量偏低，记得按时吃饭哦');
  if (totals.cal > 2500) advice.push('今日热量偏高，晚餐建议清淡一些');
  if (advice.length === 0) advice.push('今日营养摄入均衡，继续保持！');

  if (todayRecords.length > 0) {
    adviceEl.style.display = 'block';
    adviceContent.innerHTML = advice.map(a => '<p style="font-size:14px;margin-bottom:8px;">• ' + a + '</p>').join('');
  } else {
    adviceEl.style.display = 'none';
  }
}

function simulatePhotoUpload() {
  const dishes = DISH_DB.filter(d => d.meal.indexOf('lunch') >= 0 || d.meal.indexOf('dinner') >= 0);
  const dish = dishes[Math.floor(Math.random() * dishes.length)];
  Store.photoDish = dish;
  document.getElementById('photo-dish-name').textContent = dish.name;
  document.getElementById('photo-dish-tags').innerHTML = dish.tags.map(t => '<span class="dish-tag ' + t + '">' + tagName(t) + '</span>').join('');
  document.getElementById('photo-result').style.display = 'block';
  showToast('识别成功：' + dish.name);
}

function addPhotoDish() {
  if (Store.photoDish) {
    Store.records.push({
      dishId: Store.photoDish.id,
      dishName: Store.photoDish.name,
      meal: 'snack',
      mealName: '加餐',
      cal: Store.photoDish.cal,
      protein: Store.photoDish.protein,
      fat: Store.photoDish.fat,
      carb: Store.photoDish.carb,
      date: new Date().toISOString(),
    });
    Store.save();
    document.getElementById('photo-result').style.display = 'none';
    Store.photoDish = null;
    showToast('已添加到记录');
    updateRecordPage();
  }
}

// ========== Score Page - Auto Scoring ==========
function updateScorePage() {
  const today = new Date().toDateString();
  const todayRecords = Store.records.filter(r => new Date(r.date).toDateString() === today);

  // Auto meal scoring based on nutrition
  const scoreList = document.getElementById('score-meal-list');
  if (todayRecords.length === 0) {
    scoreList.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px;">今日暂无记录</p>';
  } else {
    scoreList.innerHTML = todayRecords.map((r, idx) => {
      const autoScore = calculateAutoMealScore(r);
      const stars = [1,2,3,4,5].map(s =>
        '<span class="rating-star ' + (s <= autoScore ? 'active' : '') + '">★</span>'
      ).join('');
      const scoreText = autoScore >= 4 ? '营养优秀' : autoScore >= 3 ? '营养良好' : autoScore >= 2 ? '营养一般' : '需改善';
      return `
        <div class="record-item" style="padding:12px 0;">
          <div class="record-meal">
            <div class="record-meal-name">${r.mealName} · ${r.dishName}</div>
            <div class="rating-group mt-8">${stars}</div>
            <p class="text-sm text-muted mt-8">自动评分：${scoreText} (${r.cal}千卡 · 蛋白质${r.protein}g)</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Day score
  const totals = todayRecords.reduce((sum, r) => ({
    cal: sum.cal + r.cal, protein: sum.protein + r.protein, fat: sum.fat + r.fat, carb: sum.carb + r.carb,
  }), { cal: 0, protein: 0, fat: 0, carb: 0 });

  let dayScore = 0;
  if (todayRecords.length > 0) {
    const calScore = Math.min(100, Math.max(0, 100 - Math.abs(totals.cal - 2000) / 20));
    const proteinScore = Math.min(100, totals.protein * 2);
    const fatScore = Math.min(100, Math.max(0, 100 - Math.max(0, totals.fat - 60) * 2));
    dayScore = Math.round((calScore + proteinScore + fatScore) / 3);
  }

  document.getElementById('day-score-value').textContent = todayRecords.length > 0 ? dayScore : '--';
  document.getElementById('day-score-circle').style.setProperty('--score-pct', todayRecords.length > 0 ? dayScore + '%' : '0%');
  document.getElementById('day-score-desc').textContent = todayRecords.length > 0 ? (dayScore >= 80 ? '营养均衡，继续保持！' : dayScore >= 60 ? '还可以更好哦' : '注意饮食搭配') : '记录饮食后自动计算';

  const detail = document.getElementById('day-nutrition-detail');
  detail.innerHTML = `
    <div class="nutrition-grid">
      <div class="nutrition-item"><div class="nutri-value">${totals.cal}</div><div class="nutri-label">千卡</div></div>
      <div class="nutrition-item"><div class="nutri-value">${totals.protein}g</div><div class="nutri-label">蛋白质</div></div>
      <div class="nutrition-item"><div class="nutri-value">${totals.fat}g</div><div class="nutri-label">脂肪</div></div>
      <div class="nutrition-item"><div class="nutri-value">${totals.carb}g</div><div class="nutri-label">碳水</div></div>
    </div>
    <div class="progress-bar mt-12"><div class="progress-fill" style="width:${Math.min(100, totals.cal/2500*100)}%"></div></div>
    <p class="text-center text-sm text-muted mt-8">已摄入 ${Math.round(totals.cal/2500*100)}% 推荐热量</p>
  `;

  // Week chart
  renderWeekChart();
}

function calculateAutoMealScore(record) {
  let score = 3; // base score
  // Protein bonus
  if (record.protein >= 20) score += 1;
  if (record.protein >= 30) score += 1;
  // Fat penalty
  if (record.fat > 25) score -= 1;
  if (record.fat > 35) score -= 1;
  // Calorie balance
  if (record.cal >= 300 && record.cal <= 600) score += 0.5;
  if (record.cal > 800) score -= 1;
  // Healthy tags bonus
  const dish = DISH_DB.find(d => d.id === record.dishId);
  if (dish && dish.tags.indexOf('healthy') >= 0) score += 0.5;
  return Math.max(1, Math.min(5, Math.round(score)));
}

function renderWeekChart() {
  const chartDom = document.getElementById('week-chart');
  if (!chartDom || typeof echarts === 'undefined') return;

  const days = [];
  const scores = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    days.push(d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    const recs = Store.records.filter(r => new Date(r.date).toDateString() === ds);
    if (recs.length === 0) {
      scores.push(null);
    } else {
      const totals = recs.reduce((sum, r) => ({ cal: sum.cal + r.cal, protein: sum.protein + r.protein, fat: sum.fat + r.fat }),
        { cal: 0, protein: 0, fat: 0 });
      const calScore = Math.min(100, Math.max(0, 100 - Math.abs(totals.cal - 2000) / 20));
      const proteinScore = Math.min(100, totals.protein * 2);
      const fatScore = Math.min(100, Math.max(0, 100 - Math.max(0, totals.fat - 60) * 2));
      scores.push(Math.round((calScore + proteinScore + fatScore) / 3));
    }
  }

  const validScores = scores.filter(s => s !== null);
  const avg = validScores.length > 0 ? Math.round(validScores.reduce((a,b) => a+b, 0) / validScores.length) : '--';
  document.getElementById('week-score-value').textContent = avg;
  document.getElementById('week-score-circle').style.setProperty('--score-pct', avg !== '--' ? avg + '%' : '0%');

  const chart = echarts.init(chartDom, null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    grid: { top: 20, right: 10, bottom: 30, left: 40 },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#E8E8F0' } }, axisLabel: { color: '#8A8AA3', fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: '#E8E8F0' } }, axisLabel: { color: '#8A8AA3', fontSize: 11 } },
    series: [{
      data: scores,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#4ECDC4', width: 2 },
      itemStyle: { color: '#4ECDC4' },
      connectNulls: false,
    }],
  });
  window.addEventListener('resize', () => chart.resize());
}

// ========== Home Summary ==========
function updateHomeSummary() {
  const today = new Date().toDateString();
  const todayRecords = Store.records.filter(r => new Date(r.date).toDateString() === today);
  const totals = todayRecords.reduce((sum, r) => ({
    cal: sum.cal + r.cal, protein: sum.protein + r.protein, fat: sum.fat + r.fat, carb: sum.carb + r.carb,
  }), { cal: 0, protein: 0, fat: 0, carb: 0 });

  document.getElementById('home-cal').textContent = totals.cal;
  document.getElementById('home-protein').textContent = totals.protein + 'g';
  document.getElementById('home-fat').textContent = totals.fat + 'g';
  document.getElementById('home-carb').textContent = totals.carb + 'g';
  const pct = Math.min(100, Math.round(totals.cal / 2500 * 100));
  document.getElementById('home-progress').style.width = pct + '%';
  document.getElementById('home-pct').textContent = pct + '%';
}

// ========== PINHAOFAN ==========
function initPinPage() {
  renderPinOrders();
  renderMyPinOrders();
}

function renderPinOrders() {
  const container = document.getElementById('pin-orders-list');
  if (!container) return;

  // Seed demo data if empty
  if (Store.pinOrders.length === 0) {
    Store.pinOrders = [
      { id: 'p1', restaurant: '海底捞', dishes: '双人套餐', location: '万达广场', time: '2026-06-23T18:00', people: 2, budget: 80, note: '想吃麻辣锅，有人一起吗？', joined: 1, creator: '小吃货', created: new Date().toISOString() },
      { id: 'p2', restaurant: '肯德基', dishes: '全家桶', location: '公司楼下', time: '2026-06-23T12:00', people: 3, budget: 30, note: '午餐拼单，AA制', joined: 2, creator: '辣妹子', created: new Date().toISOString() },
      { id: 'p3', restaurant: '星巴克', dishes: '下午茶套餐', location: '国贸中心', time: '2026-06-23T15:00', people: 2, budget: 50, note: '想找人一起喝下午茶聊天', joined: 0, creator: '江南小厨', created: new Date().toISOString() },
    ];
    Store.save();
  }

  const activeOrders = Store.pinOrders.filter(o => o.joined < o.people);
  if (activeOrders.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px;">暂无正在拼的饭，快去发起一个吧！</p>';
    return;
  }

  container.innerHTML = activeOrders.map(o => `
    <div class="card">
      <div class="flex items-center justify-between" style="margin-bottom:8px;">
        <span class="font-bold" style="font-size:16px;">${o.restaurant}</span>
        <span class="dish-tag quick">${o.joined}/${o.people}人</span>
      </div>
      <p style="font-size:14px;margin-bottom:6px;">🍴 ${o.dishes}</p>
      <p style="font-size:13px;color:var(--muted);margin-bottom:4px;">📍 ${o.location} · 💰 ${o.budget}元内</p>
      <p style="font-size:13px;color:var(--muted);margin-bottom:8px;">🕐 ${new Date(o.time).toLocaleString('zh-CN')}</p>
      ${o.note ? '<p style="font-size:13px;color:var(--accent);margin-bottom:10px;">💬 ' + o.note + '</p>' : ''}
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted">发起人：${o.creator}</span>
        <button class="btn btn-primary btn-sm" onclick="joinPinOrder('${o.id}')">加入拼饭</button>
      </div>
    </div>
  `).join('');
}

function renderMyPinOrders() {
  const container = document.getElementById('pin-my-list');
  if (!container) return;
  const myOrders = Store.pinOrders.filter(o => o.creator === '我' || (o.joinedBy && o.joinedBy.indexOf('我') >= 0));
  if (myOrders.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px;">你还没有参与任何拼饭</p>';
    return;
  }
  container.innerHTML = myOrders.map(o => `
    <div class="card">
      <div class="flex items-center justify-between" style="margin-bottom:8px;">
        <span class="font-bold" style="font-size:16px;">${o.restaurant}</span>
        <span class="dish-tag ${o.joined >= o.people ? 'healthy' : 'quick'}">${o.joined >= o.people ? '拼成' : '拼饭中'}</span>
      </div>
      <p style="font-size:13px;color:var(--muted);">🍴 ${o.dishes} · 📍 ${o.location}</p>
      <p style="font-size:13px;color:var(--muted);">🕐 ${new Date(o.time).toLocaleString('zh-CN')}</p>
    </div>
  `).join('');
}

function createPinOrder() {
  const restaurant = document.getElementById('pin-restaurant').value;
  const dishes = document.getElementById('pin-dishes').value;
  const location = document.getElementById('pin-location').value;
  const time = document.getElementById('pin-time').value;
  const people = parseInt(getSelectedValues('pin-people')[0]) || 2;
  const budget = parseInt(getSelectedValues('pin-budget')[0]) || 30;
  const note = document.getElementById('pin-note').value;

  if (!restaurant || !dishes || !location || !time) {
    showToast('请填写完整信息');
    return;
  }

  Store.pinOrders.push({
    id: 'p' + Date.now(),
    restaurant,
    dishes,
    location,
    time,
    people,
    budget,
    note,
    joined: 1,
    creator: '我',
    joinedBy: ['我'],
    created: new Date().toISOString(),
  });
  Store.save();
  showToast('拼饭发起成功！');

  document.getElementById('pin-restaurant').value = '';
  document.getElementById('pin-dishes').value = '';
  document.getElementById('pin-location').value = '';
  document.getElementById('pin-time').value = '';
  document.getElementById('pin-note').value = '';

  switchTab('pin-list');
  renderPinOrders();
  renderMyPinOrders();
}

function joinPinOrder(orderId) {
  const order = Store.pinOrders.find(o => o.id === orderId);
  if (!order) return;
  if (order.joined >= order.people) {
    showToast('该拼饭已满员');
    return;
  }
  order.joined++;
  if (!order.joinedBy) order.joinedBy = [];
  order.joinedBy.push('我');
  Store.save();
  showToast('成功加入' + order.restaurant + '的拼饭！');
  renderPinOrders();
  renderMyPinOrders();
}

// ========== TUIHAOFAN ==========
function initTuiPage() {
  renderTuiUsers();
  renderTuiRecommends();

  const select = document.getElementById('tui-dish-select');
  if (select) {
    const allDishes = DISH_DB.concat(Store.customDishes);
    select.innerHTML = allDishes.map(d => '<option value="' + d.id + '">' + d.name + '</option>').join('');
  }

  const section = document.getElementById('tui-recommend-section');
  if (section) section.style.display = 'block';
}

function renderTuiUsers() {
  const container = document.getElementById('tui-users-list');
  if (!container) return;

  const myPrefs = Store.preferences;
  const scoredUsers = MOCK_USERS.map(u => {
    let score = 0;
    if (myPrefs.taste && u.taste === myPrefs.taste) score += 3;
    if (myPrefs.spicy && u.spicy === myPrefs.spicy) score += 2;
    if (myPrefs.region && myPrefs.region.some(r => u.region.indexOf(r) >= 0)) score += 2;
    if (myPrefs.diet && myPrefs.diet.some(d => u.diet.indexOf(d) >= 0)) score += 1;
    return Object.assign({}, u, { matchScore: score });
  }).sort((a, b) => b.matchScore - a.matchScore);

  container.innerHTML = scoredUsers.map(u => `
    <div class="card">
      <div class="flex items-center gap-12" style="margin-bottom:10px;">
        <span style="font-size:36px;">${u.avatar}</span>
        <div style="flex:1;">
          <div class="flex items-center justify-between">
            <span class="font-bold" style="font-size:16px;">${u.name}</span>
            <span class="dish-tag healthy">匹配度 ${Math.min(100, u.matchScore * 15)}%</span>
          </div>
          <p style="font-size:13px;color:var(--muted);margin-top:2px;">${u.signature}</p>
        </div>
      </div>
      <div class="dish-card-tags" style="margin-bottom:8px;">
        ${u.region.map(r => '<span class="dish-tag salty">' + (CUISINE_NAMES[r] || r) + '</span>').join('')}
        <span class="dish-tag ${u.spicy === 'none' ? 'healthy' : u.spicy === 'hot' ? 'spicy' : 'quick'}">
          ${u.spicy === 'none' ? '不吃辣' : u.spicy === 'mild' ? '微辣' : u.spicy === 'medium' ? '中辣' : '重辣'}
        </span>
      </div>
      <button class="btn btn-outline btn-sm" onclick="showToast('已向${u.name}发送关注请求')">👤 关注饭友</button>
    </div>
  `).join('');
}

function renderTuiRecommends() {
  const container = document.getElementById('tui-users-list');
  if (!container) return;

  const myPrefs = Store.preferences;
  const similarUsers = MOCK_USERS.filter(u => {
    if (myPrefs.taste && u.taste === myPrefs.taste) return true;
    if (myPrefs.region && myPrefs.region.some(r => u.region.indexOf(r) >= 0)) return true;
    return false;
  });

  if (similarUsers.length === 0) return;

  const recs = similarUsers.slice(0, 2).map(u => {
    const recDish = DISH_DB.find(d => d.cuisine === u.region[0]) || DISH_DB[0];
    return { user: u, dish: recDish };
  });

  const recHtml = `
    <div class="card" style="background:linear-gradient(135deg,#FFF0E8,#E8FAF8);">
      <div class="card-title"><span class="icon">💡</span>饭友推荐</div>
      ${recs.map(r => `
        <div class="record-item" style="border-bottom:1px solid var(--rule);padding:10px 0;">
          <div class="record-meal">
            <div class="record-meal-name">${r.user.name} 推荐：${r.dish.name}</div>
            <div class="record-meal-dishes">${r.user.signature}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="eatDish(${r.dish.id});showToast('已添加到记录')">试试</button>
        </div>
      `).join('')}
    </div>
  `;

  let recSection = document.getElementById('tui-rec-section');
  if (!recSection) {
    recSection = document.createElement('div');
    recSection.id = 'tui-rec-section';
    container.parentNode.insertBefore(recSection, container.nextSibling);
  }
  recSection.innerHTML = recHtml;
}

function submitTuiRecommend() {
  const dishId = document.getElementById('tui-dish-select').value;
  const reason = document.getElementById('tui-reason').value;
  const dish = DISH_DB.concat(Store.customDishes).find(d => d.id == dishId);
  if (!dish) return;

  Store.tuiRecommends.push({
    dishId: dish.id,
    dishName: dish.name,
    reason: reason || '这道菜超好吃，推荐给大家！',
    author: '我',
    date: new Date().toISOString(),
  });
  Store.save();
  showToast('推荐发布成功！');
  document.getElementById('tui-reason').value = '';
}

// ========== ZUOHAOFAN ==========
function initZuoPage() {
  renderZuoHall();
  renderZuoMy();
}

function renderZuoHall() {
  const container = document.getElementById('zuo-hall-list');
  if (!container) return;

  // Seed demo custom dishes if empty
  if (Store.customDishes.length === 0) {
    Store.customDishes = [
      { id: 101, name: '秘制红烧肉', cuisine: 'shanghai', taste: 'sweet', time: 90, cal: 480, protein: 20, fat: 38, carb: 18, tags: ['sweet'], difficulty: 3, recommend: 92, author: '肉食动物', steps: ['五花肉切块焯水','炒糖色至枣红色','下肉块翻炒','加料酒生抽老抽','小火慢炖60分钟','大火收汁装盘'], date: new Date().toISOString() },
      { id: 102, name: '快手酸辣粉', cuisine: 'sichuan', taste: 'salty', time: 10, cal: 350, protein: 8, fat: 12, carb: 52, tags: ['spicy','quick'], difficulty: 1, recommend: 88, author: '辣妹子', steps: ['红薯粉泡软','调酸辣汤底','煮粉至熟','捞出加汤底','放花生碎香菜'], date: new Date().toISOString() },
      { id: 103, name: '清蒸蛋羹', cuisine: 'home', taste: 'salty', time: 15, cal: 120, protein: 10, fat: 6, carb: 4, tags: ['healthy','quick'], difficulty: 1, recommend: 85, author: '养生达人', steps: ['鸡蛋打散','加温水搅匀','过筛去泡','盖保鲜膜蒸10分钟','淋生抽香油'], date: new Date().toISOString() },
    ];
    Store.save();
  }

  const allDishes = Store.customDishes.slice().sort((a, b) => (b.recommend || 0) - (a.recommend || 0));

  container.innerHTML = allDishes.map(d => `
    <div class="dish-card">
      <div class="dish-card-body">
        <div class="flex items-center justify-between" style="margin-bottom:6px;">
          <span class="dish-card-title">${d.name}</span>
          <span class="dish-tag healthy">${d.recommend || 80}%推荐</span>
        </div>
        <div class="dish-card-meta">
          <span>${d.cal}千卡</span>
          <span>${d.time}分钟</span>
          <span>${CUISINE_NAMES[d.cuisine] || d.cuisine}</span>
        </div>
        <div class="dish-card-tags">
          ${d.tags.map(t => '<span class="dish-tag ' + t + '">' + tagName(t) + '</span>').join('')}
          <span class="dish-tag ${d.difficulty === 1 ? 'healthy' : d.difficulty === 3 ? 'spicy' : 'quick'}">
            ${'⭐'.repeat(d.difficulty || 2)} ${d.difficulty === 1 ? '简单' : d.difficulty === 2 ? '中等' : '困难'}
          </span>
        </div>
        <div class="flex items-center justify-between mt-12">
          <span class="text-sm text-muted">by ${d.author || '匿名'}</span>
          <button class="btn btn-outline btn-sm" onclick="showToast('已收藏${d.name}')">❤️ 收藏</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderZuoMy() {
  const container = document.getElementById('zuo-my-list');
  if (!container) return;
  const myDishes = Store.customDishes.filter(d => d.author === '我');
  if (myDishes.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px;">你还没有录入菜谱，快去添加吧！</p>';
    return;
  }
  container.innerHTML = myDishes.map(d => `
    <div class="dish-card">
      <div class="dish-card-body">
        <div class="dish-card-title">${d.name}</div>
        <div class="dish-card-meta">
          <span>${d.cal}千卡</span>
          <span>${d.time}分钟</span>
          <span>推荐度 ${d.recommend || 80}%</span>
        </div>
        <div class="btn-group mt-12">
          <button class="btn btn-outline btn-sm" onclick="deleteCustomDish(${d.id})">删除</button>
          <button class="btn btn-primary btn-sm" onclick="showToast('已发布到菜品大厅')">发布</button>
        </div>
      </div>
    </div>
  `).join('');
}

function addCustomDish() {
  const name = document.getElementById('zuo-name').value;
  const cuisine = getSelectedValues('zuo-cuisine')[0] || 'home';
  const taste = getSelectedValues('zuo-taste')[0] || 'salty';
  const difficulty = parseInt(getSelectedValues('zuo-difficulty')[0]) || 2;
  const time = parseInt(document.getElementById('zuo-time').value) || 30;
  const stepsText = document.getElementById('zuo-steps').value;

  if (!name || !stepsText) {
    showToast('请填写菜品名称和做法步骤');
    return;
  }

  const steps = stepsText.split('\n').filter(s => s.trim());
  const newDish = {
    id: 1000 + Date.now(),
    name,
    cuisine,
    taste,
    time,
    cal: Math.floor(Math.random() * 300 + 100),
    protein: Math.floor(Math.random() * 20 + 5),
    fat: Math.floor(Math.random() * 20 + 5),
    carb: Math.floor(Math.random() * 40 + 10),
    tags: [taste === 'sweet' ? 'sweet' : taste === 'spicy' ? 'spicy' : 'salty'],
    difficulty,
    recommend: Math.floor(Math.random() * 20 + 75),
    author: '我',
    steps,
    date: new Date().toISOString(),
  };

  Store.customDishes.push(newDish);
  Store.save();
  showToast('菜谱录入成功！');

  document.getElementById('zuo-name').value = '';
  document.getElementById('zuo-time').value = '';
  document.getElementById('zuo-steps').value = '';

  switchTab('zuo-hall');
  renderZuoHall();
  renderZuoMy();
}

function deleteCustomDish(dishId) {
  Store.customDishes = Store.customDishes.filter(d => d.id !== dishId);
  Store.save();
  renderZuoHall();
  renderZuoMy();
  showToast('菜谱已删除');
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  initOptionChips();
  selectMealType('lunch');
  updateHomeSummary();

  // Cook method toggle
  document.querySelectorAll('#cook-method .option-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = document.getElementById('cook-method');
      group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      document.getElementById('time-input-group').style.display = chip.dataset.value === 'cook' ? 'block' : 'none';
    });
  });
});
