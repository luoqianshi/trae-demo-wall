// ===== 菜品知识库 =====
const dishDB = {
  '红烧肉': {
    main: ['五花肉 500g'],
    veg: ['生姜 3片', '大葱 2段', '八角 2个', '桂皮 1小块'],
    sauce: ['生抽 2勺', '老抽 1勺', '冰糖 30g', '料酒 2勺', '盐 适量'],
    desc: '肥而不腻，入口即化的经典家常菜',
    tags: ['咸鲜', '经典', '下饭'],
    difficulty: '中等',
    time: '60分钟'
  },
  '麻婆豆腐': {
    main: ['嫩豆腐 400g', '猪肉末 100g'],
    veg: ['蒜末 1勺', '姜末 1勺', '葱花 适量', '花椒粉 1勺'],
    sauce: ['豆瓣酱 1.5勺', '生抽 1勺', '料酒 1勺', '淀粉水 适量', '盐 少许'],
    desc: '麻辣鲜香，豆腐嫩滑入味',
    tags: ['麻辣', '川菜', '下饭'],
    difficulty: '简单',
    time: '20分钟'
  },
  '番茄炒蛋': {
    main: ['鸡蛋 3个', '番茄 2个'],
    veg: ['葱花 适量'],
    sauce: ['盐 1小勺', '糖 1小勺', '番茄酱 1勺（可选）'],
    desc: '酸甜可口，最经典的家常快手菜',
    tags: ['酸甜', '快手', '经典'],
    difficulty: '简单',
    time: '10分钟'
  },
  '可乐鸡翅': {
    main: ['鸡翅中 10个'],
    veg: ['姜片 3片', '蒜末 1勺', '葱花 适量'],
    sauce: ['可乐 1罐', '生抽 2勺', '老抽 半勺', '料酒 1勺', '盐 少许'],
    desc: '甜中带咸，鸡翅软嫩入味',
    tags: ['甜味', '网红', '简单'],
    difficulty: '简单',
    time: '30分钟'
  },
  '酸辣土豆丝': {
    main: ['土豆 2个'],
    veg: ['干辣椒 5个', '蒜末 1勺', '葱花 适量', '花椒 10粒'],
    sauce: ['白醋 2勺', '盐 1小勺', '糖 半小勺'],
    desc: '酸辣爽脆，开胃下饭',
    tags: ['酸辣', '快手', '素食'],
    difficulty: '简单',
    time: '10分钟'
  },
  '清蒸鲈鱼': {
    main: ['鲈鱼 1条（约500g）'],
    veg: ['姜丝 适量', '葱丝 适量', '红椒丝 少许'],
    sauce: ['蒸鱼豉油 2勺', '料酒 1勺', '食用油 2勺', '盐 少许'],
    desc: '鲜嫩清淡，保留鱼肉原汁原味',
    tags: ['清淡', '健康', '粤菜'],
    difficulty: '中等',
    time: '15分钟'
  },
  '宫保鸡丁': {
    main: ['鸡胸肉 300g', '花生米 50g'],
    veg: ['干辣椒 8个', '花椒 1勺', '蒜末 1勺', '姜末 1勺', '葱段 适量'],
    sauce: ['生抽 2勺', '醋 2勺', '糖 2勺', '料酒 1勺', '淀粉 1勺', '盐 少许'],
    desc: '酸甜微辣，花生酥脆，鸡肉嫩滑',
    tags: ['酸甜', '川菜', '下饭'],
    difficulty: '中等',
    time: '25分钟'
  },
  '糖醋排骨': {
    main: ['猪肋排 500g'],
    veg: ['姜片 3片', '蒜末 1勺', '白芝麻 适量', '葱花 适量'],
    sauce: ['白糖 3勺', '白醋 2勺', '生抽 2勺', '料酒 1勺', '番茄酱 2勺', '盐 少许'],
    desc: '外酥里嫩，酸甜开胃',
    tags: ['酸甜', '经典', '下饭'],
    difficulty: '中等',
    time: '45分钟'
  },
  '水煮肉片': {
    main: ['猪里脊 300g', '豆芽 200g', '生菜 100g'],
    veg: ['干辣椒 10个', '花椒 2勺', '蒜末 2勺', '姜末 1勺', '葱花 适量'],
    sauce: ['豆瓣酱 2勺', '火锅底料 1小块', '生抽 1勺', '料酒 1勺', '淀粉 1勺', '盐 适量'],
    desc: '麻辣鲜香，肉片滑嫩，配菜丰富',
    tags: ['麻辣', '川菜', '重口味'],
    difficulty: '中等',
    time: '30分钟'
  },
  '蒜蓉粉丝蒸虾': {
    main: ['鲜虾 12只', '粉丝 1把'],
    veg: ['蒜末 3勺', '葱花 适量', '红椒末 少许'],
    sauce: ['生抽 2勺', '料酒 1勺', '蚝油 1勺', '食用油 2勺', '盐 少许'],
    desc: '蒜香浓郁，虾肉鲜甜，粉丝吸满汤汁',
    tags: ['清淡', '海鲜', '健康'],
    difficulty: '简单',
    time: '15分钟'
  },
  '回锅肉': {
    main: ['五花肉 400g'],
    veg: ['青椒 2个', '蒜苗 3根', '姜片 3片', '蒜末 1勺'],
    sauce: ['豆瓣酱 1.5勺', '甜面酱 1勺', '生抽 1勺', '料酒 1勺', '白糖 半勺'],
    desc: '肉片焦香，配菜爽脆，川菜经典',
    tags: ['咸鲜', '川菜', '下饭'],
    difficulty: '中等',
    time: '25分钟'
  },
  '地三鲜': {
    main: ['土豆 1个', '茄子 1个', '青椒 2个'],
    veg: ['蒜末 2勺', '姜末 1勺', '葱花 适量'],
    sauce: ['生抽 2勺', '蚝油 1勺', '糖 1勺', '淀粉 1勺', '盐 适量'],
    desc: '东北经典，三种蔬菜各有风味',
    tags: ['咸鲜', '东北菜', '素食'],
    difficulty: '简单',
    time: '20分钟'
  },
  '蜜汁叉烧肉': {
    main: ['梅花肉 500g'],
    veg: ['蒜末 2勺', '姜末 1勺', '葱花 适量'],
    sauce: ['叉烧酱 3勺', '蜂蜜 2勺', '生抽 1勺', '料酒 1勺', '五香粉 半勺'],
    desc: '甜香浓郁，外焦里嫩，港式风味',
    tags: ['甜味', '港式', '烤箱'],
    difficulty: '中等',
    time: '50分钟'
  },
  '酸菜鱼': {
    main: ['草鱼 1条', '酸菜 200g'],
    veg: ['泡椒 5个', '蒜末 2勺', '姜末 1勺', '葱花 适量', '花椒 1勺'],
    sauce: ['料酒 2勺', '盐 适量', '白胡椒粉 1勺', '淀粉 2勺', '蛋清 1个'],
    desc: '酸辣开胃，鱼片滑嫩，汤鲜味美',
    tags: ['酸辣', '川菜', '重口味'],
    difficulty: '较难',
    time: '40分钟'
  },
  '蒜蓉西兰花': {
    main: ['西兰花 1颗'],
    veg: ['蒜末 3勺', '红椒片 少许'],
    sauce: ['生抽 1勺', '蚝油 1勺', '盐 适量', '食用油 适量'],
    desc: '清爽健康，蒜香四溢，减脂首选',
    tags: ['清淡', '健康', '素食'],
    difficulty: '简单',
    time: '8分钟'
  },
  '东坡肉': {
    main: ['五花肉 800g'],
    veg: ['小葱 1把', '姜片 5片', '八角 2个'],
    sauce: ['黄酒 200ml', '生抽 3勺', '老抽 1勺', '冰糖 50g', '盐 少许'],
    desc: '肥而不腻，酥烂入味，杭帮经典',
    tags: ['咸甜', '经典', '慢炖'],
    difficulty: '较难',
    time: '120分钟'
  },
  '口水鸡': {
    main: ['鸡腿 2个'],
    veg: ['蒜末 2勺', '姜末 1勺', '葱花 适量', '花生碎 2勺', '芝麻 1勺'],
    sauce: ['辣椒油 3勺', '生抽 2勺', '醋 1勺', '糖 1勺', '花椒油 1勺', '芝麻酱 1勺'],
    desc: '麻辣鲜香，鸡肉嫩滑，凉菜之王',
    tags: ['麻辣', '凉菜', '川菜'],
    difficulty: '中等',
    time: '30分钟'
  },
  '蛋炒饭': {
    main: ['米饭 2碗', '鸡蛋 2个'],
    veg: ['葱花 适量', '胡萝卜丁 适量', '青豆 适量', '火腿丁 适量'],
    sauce: ['盐 1小勺', '生抽 1勺', '白胡椒粉 少许'],
    desc: '粒粒分明，蛋香四溢，解决剩米饭',
    tags: ['咸鲜', '快手', '主食'],
    difficulty: '简单',
    time: '8分钟'
  },
  '干煸豆角': {
    main: ['四季豆 400g', '猪肉末 100g'],
    veg: ['干辣椒 6个', '花椒 1勺', '蒜末 2勺', '姜末 1勺'],
    sauce: ['生抽 1勺', '料酒 1勺', '盐 适量', '糖 半勺'],
    desc: '豆角干香，肉末酥香，下饭神器',
    tags: ['麻辣', '川菜', '下饭'],
    difficulty: '中等',
    time: '20分钟'
  },
  '白切鸡': {
    main: ['三黄鸡 1只'],
    veg: ['姜片 5片', '葱段 3段', '蒜末 2勺', '葱花 适量'],
    sauce: ['生抽 3勺', '香油 1勺', '盐 适量', '料酒 2勺'],
    desc: '皮爽肉滑，原汁原味，粤菜经典',
    tags: ['清淡', '粤菜', '健康'],
    difficulty: '中等',
    time: '40分钟'
  }
};

// 口味分类映射
const tasteMap = {
  spicy: { label: '辣味', dishes: ['麻婆豆腐', '水煮肉片', '干煸豆角', '口水鸡', '宫保鸡丁'] },
  sweet: { label: '甜味', dishes: ['可乐鸡翅', '蜜汁叉烧肉', '糖醋排骨', '番茄炒蛋'] },
  light: { label: '清淡', dishes: ['清蒸鲈鱼', '蒜蓉粉丝蒸虾', '蒜蓉西兰花', '白切鸡'] },
  salty: { label: '咸鲜', dishes: ['红烧肉', '回锅肉', '地三鲜', '蛋炒饭'] },
  sour: { label: '酸甜', dishes: ['番茄炒蛋', '糖醋排骨', '宫保鸡丁', '酸菜鱼'] },
  heavy: { label: '重口味', dishes: ['水煮肉片', '酸菜鱼', '口水鸡', '红烧肉', '麻婆豆腐'] }
};

// 热门菜品数据
const hotDishes = [
  { name: '淄博烧烤', desc: '2024年全网爆火的烧烤吃法，小饼卷肉加葱', tag: '网红爆款' },
  { name: '螺蛳粉', desc: '臭香臭香的广西特色，越吃越上瘾', tag: '热搜第一' },
  { name: '空气炸锅烤红薯', desc: '秋冬必备，香甜软糯零失败', tag: '季节限定' },
  { name: '懒人焖饭', desc: '一锅出，饭菜俱全，上班族救星', tag: '快手菜' },
  { name: '酸汤肥牛', desc: '酸辣开胃，肥牛嫩滑，汤都能喝完', tag: '新晋热门' },
  { name: '蒜蓉烤生蚝', desc: '夜市之王，蒜香浓郁，鲜嫩多汁', tag: '夜宵首选' },
  { name: '黄焖鸡米饭', desc: '外卖顶流，自己做更香更实惠', tag: '经典复刻' },
  { name: '番茄牛腩', desc: '酸甜浓郁，牛腩软烂，拌饭一绝', tag: '下饭神器' }
];

// ===== Tab 切换 =====
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('tab-' + target).classList.remove('hidden');
    if (target === 'hot') renderHotDishes();
  });
});

// ===== 设置输入框 =====
function setInput(val) {
  document.getElementById('dishInput').value = val;
  generateList();
}

// ===== 生成买菜清单 =====
function generateList() {
  const input = document.getElementById('dishInput').value.trim();
  const resultDiv = document.getElementById('listResult');
  if (!input) { resultDiv.innerHTML = ''; return; }

  resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>AI正在分析菜品...</div>';

  setTimeout(() => {
    const dish = findDish(input);
    if (dish) {
      resultDiv.innerHTML = renderDishCard(dish.name, dish.data);
    } else {
      // 模糊匹配或生成通用清单
      const generic = generateGenericList(input);
      resultDiv.innerHTML = renderDishCard(input, generic, true);
    }
  }, 800);
}

function findDish(input) {
  for (const name in dishDB) {
    if (input.includes(name) || name.includes(input)) {
      return { name, data: dishDB[name] };
    }
  }
  return null;
}

function generateGenericList(name) {
  return {
    main: [`${name}所需主料（建议根据具体食谱准备）`],
    veg: ['生姜 适量', '大蒜 适量', '葱花 适量'],
    sauce: ['生抽 适量', '料酒 适量', '盐 适量', '食用油 适量'],
    desc: `一道美味的${name}，建议搜索具体食谱获取详细配料`,
    tags: ['自定义'],
    difficulty: '未知',
    time: '未知'
  };
}

function renderDishCard(name, data, isGeneric = false) {
  const mainItems = data.main.map(i => renderIngredientItem(i)).join('');
  const vegItems = data.veg.map(i => renderIngredientItem(i)).join('');
  const sauceItems = data.sauce.map(i => renderIngredientItem(i)).join('');

  return `
    <div class="result-card">
      <div class="result-header">
        <h3>${isGeneric ? '' : ''}${name}</h3>
        <span class="meta">${data.difficulty} · ${data.time}</span>
      </div>
      <p style="color:var(--muted);margin-bottom:1rem;font-size:0.9rem;">${data.desc}</p>
      <div class="ingredient-category">
        <h4>🥩 主料</h4>
        <div class="ingredient-items">${mainItems}</div>
      </div>
      <div class="ingredient-category">
        <h4>🥬 辅料</h4>
        <div class="ingredient-items">${vegItems}</div>
      </div>
      <div class="ingredient-category">
        <h4>🧂 调料</h4>
        <div class="ingredient-items">${sauceItems}</div>
      </div>
      <div style="margin-top:1rem;padding-top:1rem;border-top:1px dashed var(--rule);display:flex;gap:0.5rem;flex-wrap:wrap;">
        ${data.tags.map(t => `<span style="padding:0.2rem 0.6rem;background:var(--accent-bg);color:var(--accent);border-radius:6px;font-size:0.78rem;">${t}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderIngredientItem(name) {
  const id = 'ing_' + Math.random().toString(36).substr(2, 9);
  return `
    <label class="ingredient-item" for="${id}">
      <input type="checkbox" id="${id}" onchange="toggleCheck(this)">
      <span>${name}</span>
    </label>
  `;
}

function toggleCheck(cb) {
  cb.closest('.ingredient-item').classList.toggle('checked', cb.checked);
}

// ===== 口味推荐 =====
function recommendByTaste(taste) {
  const resultDiv = document.getElementById('recommendResult');
  const info = tasteMap[taste];

  resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>正在为你推荐...</div>';

  setTimeout(() => {
    let html = `<div class="section-title"><span class="icon">🍽️</span>${info.label}口味推荐</div><div class="recommend-grid">`;
    info.dishes.forEach(dishName => {
      const dish = dishDB[dishName];
      if (dish) {
        html += `
          <div class="recommend-card" onclick="showDishDetail('${dishName}')">
            <div class="dish-name">${dishName}</div>
            <div class="dish-tags">
              ${dish.tags.map(t => `<span class="dish-tag tag-${getTagClass(t)}">${t}</span>`).join('')}
            </div>
            <div class="dish-desc">${dish.desc}</div>
            <div class="dish-action">点击查看买菜清单 →</div>
          </div>
        `;
      }
    });
    html += '</div>';
    resultDiv.innerHTML = html;
  }, 600);
}

function getTagClass(tag) {
  if (tag.includes('辣')) return 'spicy';
  if (tag.includes('甜')) return 'sweet';
  if (tag.includes('清淡') || tag.includes('健康')) return 'light';
  if (tag.includes('咸')) return 'salty';
  return 'hot';
}

function showDishDetail(name) {
  document.getElementById('dishInput').value = name;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'list');
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById('tab-list').classList.remove('hidden');
  generateList();
}

// ===== 盲盒 =====
function openBlindBox() {
  const resultDiv = document.getElementById('blindboxResult');
  const dishes = Object.keys(dishDB);

  resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>正在打开盲盒...</div>';

  setTimeout(() => {
    const randomDish = dishes[Math.floor(Math.random() * dishes.length)];
    const dish = dishDB[randomDish];
    resultDiv.innerHTML = `
      <div class="result-card" style="border:2px solid var(--accent);">
        <div class="result-header">
          <h3>🎁 盲盒揭晓：${randomDish}</h3>
          <span class="meta">${dish.difficulty} · ${dish.time}</span>
        </div>
        <p style="color:var(--muted);margin-bottom:1rem;font-size:0.9rem;">${dish.desc}</p>
        <div class="ingredient-category">
          <h4>🥩 主料</h4>
          <div class="ingredient-items">${dish.main.map(i => renderIngredientItem(i)).join('')}</div>
        </div>
        <div class="ingredient-category">
          <h4>🥬 辅料</h4>
          <div class="ingredient-items">${dish.veg.map(i => renderIngredientItem(i)).join('')}</div>
        </div>
        <div class="ingredient-category">
          <h4>🧂 调料</h4>
          <div class="ingredient-items">${dish.sauce.map(i => renderIngredientItem(i)).join('')}</div>
        </div>
        <div style="margin-top:1rem;text-align:center;">
          <button class="btn-primary" onclick="openBlindBox()" style="margin-right:0.5rem;">再开一个</button>
          <button class="btn-primary" onclick="showDishDetail('${randomDish}')" style="background:var(--green);">去生成清单</button>
        </div>
      </div>
    `;
  }, 1200);
}

// ===== 热门菜品 =====
function renderHotDishes() {
  const resultDiv = document.getElementById('hotResult');
  if (resultDiv.dataset.loaded) return;

  resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>正在获取热门数据...</div>';

  setTimeout(() => {
    let html = '';
    hotDishes.forEach((dish, idx) => {
      html += `
        <div class="hot-dish-item" onclick="showDishDetail('${dish.name}')">
          <div class="hot-rank ${idx < 3 ? 'top3' : 'normal'}">${idx + 1}</div>
          <div class="hot-info">
            <div class="hot-name">${dish.name}</div>
            <div class="hot-desc">${dish.desc}</div>
          </div>
          <div class="hot-tag">${dish.tag}</div>
        </div>
      `;
    });
    resultDiv.innerHTML = html;
    resultDiv.dataset.loaded = 'true';
  }, 800);
}

// ===== 回车触发 =====
document.getElementById('dishInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') generateList();
});
