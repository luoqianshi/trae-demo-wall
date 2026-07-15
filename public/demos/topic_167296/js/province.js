/**
 * 省份详情页逻辑
 * 从 URL 参数获取省份名称，渲染该省美景、美食、文化信息
 */

/**
 * 从 URL 查询参数中获取省份名称
 * @returns {string|null} 省份名称
 */
function getProvinceNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('name');
}

/**
 * 生成美景卡片的不同渐变色（让卡片更有层次感）
 * @param {number} index - 卡片索引
 * @returns {string} CSS 渐变色
 */
function getSceneryGradient(index) {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  ];
  return gradients[index % gradients.length];
}

/**
 * 渲染美景区域
 * @param {Array} sceneryList - 美景列表
 * @returns {string} HTML 字符串
 */
function renderScenerySection(sceneryList) {
  const cardsHTML = sceneryList.map((scenery, index) => `
    <div class="scenery-card">
      <div class="scenery-card-img">
        <img src="${scenery.img}" alt="${scenery.name}" crossorigin="anonymous" />
      </div>
      <div class="scenery-card-body">
        <h3>${scenery.name}</h3>
        <p>${scenery.desc}</p>
      </div>
    </div>
  `).join('');

  return `
    <div class="section-title scenery">
      <span class="icon">景</span>
      <span>绝美风光</span>
    </div>
    <div class="card-grid">
      ${cardsHTML}
    </div>
  `;
}

/**
 * 根据美景名称返回对应的图标符号
 * @param {string} name - 美景名称
 * @returns {string} 图标字符
 */
function getSceneryIcon(name) {
  if (name.includes('山') || name.includes('峰') || name.includes('岳')) return '⛰';
  if (name.includes('湖') || name.includes('泉') || name.includes('潭')) return '🌊';
  if (name.includes('寺') || name.includes('佛') || name.includes('塔')) return '🏯';
  if (name.includes('古') || name.includes('城') || name.includes('街')) return '🏛';
  if (name.includes('海') || name.includes('滩') || name.includes('岛')) return '🏖';
  if (name.includes('园') || name.includes('林')) return '🌿';
  if (name.includes('窟') || name.includes('洞')) return '🕳';
  if (name.includes('瀑')) return '💧';
  if (name.includes('草')) return '🌲';
  if (name.includes('雪') || name.includes('冰')) return '❄';
  return '🏔';
}

/**
 * 渲染美食区域
 * @param {Array} foodList - 美食列表
 * @returns {string} HTML 字符串
 */
function renderFoodSection(foodList) {
  const cardsHTML = foodList.map(food => `
    <div class="food-card">
      <div class="food-card-img">
        <img src="${food.img}" alt="${food.name}" crossorigin="anonymous" />
      </div>
      <div class="food-card-body">
        <h3>${food.name}</h3>
        <p>${food.desc}</p>
      </div>
    </div>
  `).join('');

  return `
    <div class="section-title food">
      <span class="icon">食</span>
      <span>舌尖美味</span>
    </div>
    <div class="card-grid">
      ${cardsHTML}
    </div>
  `;
}

/**
 * 渲染文化区域
 * @param {string} culture - 文化介绍文本
 * @returns {string} HTML 字符串
 */
function renderCultureSection(culture) {
  return `
    <div class="section-title culture">
      <span class="icon">文</span>
      <span>人文底蕴</span>
    </div>
    <div class="culture-box">
      <p>${culture}</p>
    </div>
  `;
}

/**
 * 渲染省份综合介绍（右侧框内展示）
 * @param {Array} sections - 介绍板块列表
 * @returns {string} HTML 字符串
 */
function renderOverviewSections(sections, provinceName) {
  const itemsHTML = sections.map((s, i) => `
    <div class="overview-section-item">
      <h3>${s.title}</h3>
      <p>${s.content}</p>
    </div>
  `).join('');
  const title = provinceName ? `${provinceName}简介` : '\u7701\u4efd\u7b80\u4ecb';
  return `<div class="overview-sections"><h2 class="overview-title">${title}</h2>${itemsHTML}</div>`;
}

/**
 * 渲染城市攻略区域（广东专属模板）
 * @param {Array} cityGuide - 城市攻略列表
 * @returns {string} HTML 字符串
 */
function renderCityGuideSection(cityGuide) {
  const citiesHTML = cityGuide.map((city, index) => `
    <div class="city-guide-card">
      <div class="city-guide-header">
        <div class="city-guide-number">${index + 1}</div>
        <div class="city-guide-title">
          <h3>${city.city}</h3>
          <span class="city-guide-rank">${city.rank}</span>
        </div>
      </div>
      <p class="city-guide-intro">${city.intro}</p>
      <div class="city-guide-content">
        <div class="city-guide-attractions">
          <h4>必游景点</h4>
          ${city.attractions.map(a => `
            <div class="city-guide-item">
              <span class="city-guide-item-name">${a.name}</span>
              <span class="city-guide-item-desc">${a.desc}</span>
            </div>
          `).join('')}
        </div>
        <div class="city-guide-foods">
          <h4>必尝美食</h4>
          ${city.foods.map(f => `
            <div class="city-guide-item">
              <span class="city-guide-item-name">${f.name}</span>
              <span class="city-guide-item-desc">${f.desc}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="section-title city-guide">
      <span class="icon">城</span>
      <span>城市攻略</span>
    </div>
    <div class="city-guide-list">
      ${citiesHTML}
    </div>
  `;
}

/**
 * 渲染整个省份详情页
 * @param {string} provinceName - 省份名称
 * @param {Object} data - 省份数据
 */
function renderProvincePage(provinceName, data) {
  const pageContainer = document.getElementById('provincePage');

  // 如果有城市攻略，使用横屏布局模板
  const useCityGuide = !!data.cityGuide;

  if (useCityGuide) {
    const cityGuideHTML = renderCityGuideSection(data.cityGuide);
    const overviewHTML = data.overviewSections ? renderOverviewSections(data.overviewSections, provinceName) : '';

    // 构建海报+介绍区域：有banner时渲染左右分栏；无banner但有介绍时只渲染介绍框；否则跳过
    let splitHTML = '';
    if (data.banner) {
      splitHTML = `
        <div class="province-overview-split">
          <div class="overview-poster">
            <img src="${data.banner}" alt="${provinceName}旅游海报" />
          </div>
          <div class="overview-info">
            ${overviewHTML}
          </div>
        </div>
      `;
    } else if (overviewHTML) {
      splitHTML = `
        <div class="province-overview-split" style="flex-direction:column;align-items:center;">
          <div class="overview-info" style="width:100%;max-width:800px;">
            ${overviewHTML}
          </div>
        </div>
      `;
    }

    pageContainer.innerHTML = `
      <!-- 返回按钮 -->
      <button class="back-btn" onclick="window.location.href='index.html'">返回地图</button>

      <!-- 省份头部横幅 -->
      <div class="province-hero">
        <h1>${provinceName}</h1>
        <p class="subtitle">${data.shortDesc}</p>
        <div class="season-info">最佳旅游时间：${data.bestSeason}</div>
      </div>

      ${splitHTML}

      <!-- 城市攻略 -->
      <div class="province-content">
        ${cityGuideHTML}
      </div>
    `;

    // 自动检测布局：根据显示区域宽度决定左右并排还是上下堆叠
    // 核心逻辑：当海报实际渲染宽度太窄（<200px）或容器宽度不足时，切换为上下布局
    // 上下布局下海报居中显示，文本全宽展示，视觉更舒适
    if (data.banner) {
      const checkLayout = () => {
        const split = document.querySelector('.province-overview-split');
        const poster = document.querySelector('.overview-poster');
        const posterImg = document.querySelector('.overview-poster img');
        const info = document.querySelector('.overview-info');
        if (!split || !poster || !info) return;

        // 核心策略：先重置为左右并排布局（CSS 默认状态），再进行测量和判断。
        // 避免「在上下布局状态下测量尺寸，再用该尺寸判断是否要切回左右布局」的循环依赖问题。
        split.style.flexDirection = 'row';
        split.style.alignItems = 'flex-start';
        split.style.gap = '16px';
        poster.style.flex = '0 0 31.5%';
        poster.style.width = '';
        poster.style.maxWidth = '';
        poster.style.display = '';
        poster.style.justifyContent = '';
        info.style.width = '';
        info.style.maxWidth = '';
        info.style.flex = '';

        // 在左右布局下测量真实尺寸
        const posterH = posterImg ? posterImg.getBoundingClientRect().height : 0;
        const posterW = poster.getBoundingClientRect().width;
        const containerW = split.getBoundingClientRect().width;

        // 海报未加载完时跳过
        if (posterH <= 0) return;

        // 判断是否需要上下布局（依据用户指定规则）：
        // 1. 海报实际渲染宽度 < 220px → 上下布局，并放大海报到合适尺寸（海报太窄被挤压，不好看）
        // 2. 容器总宽度 < 768px → 上下布局（空间不足，并排拥挤）
        // 3. 若上下布局时海报高度 >= 视口高度 → 强制左右并排（避免海报过高挡住下方文本）
        // 4. 其余情况 → 左右并排
        const posterTooNarrow = posterW < 220;
        const containerTooNarrow = containerW < 768;
        const posterTooTall = posterH >= window.innerHeight;
        const shouldStack = (posterTooNarrow || containerTooNarrow) && !posterTooTall;

        if (shouldStack) {
          // 切换为上下布局：海报居中，文本全宽
          split.style.flexDirection = 'column';
          split.style.alignItems = 'center';
          split.style.gap = '10px';
          poster.style.flex = 'none';
          poster.style.display = 'flex';
          poster.style.justifyContent = 'center';
          info.style.width = '100%';
          info.style.maxWidth = '800px';
          info.style.flex = 'none';

          if (posterTooNarrow) {
            // 海报太窄时，在竖排模式下放大到合适大小（给图片足够的展示空间）
            poster.style.width = '100%';
            poster.style.maxWidth = '500px';
          } else {
            // 仅容器太窄时，海报保持自然尺寸即可
            poster.style.width = 'auto';
          }
        }
        // 否则保持上面已设置的左右并排布局，无需额外操作
      };

      // 图片已加载完成时立即检测
      if (document.querySelector('.overview-poster img').complete) {
        requestAnimationFrame(checkLayout);
      } else {
        document.querySelector('.overview-poster img').addEventListener('load', () => {
          requestAnimationFrame(checkLayout);
        });
      }

      // 备用：图片可能已缓存，延迟再检测一次
      setTimeout(() => requestAnimationFrame(checkLayout), 200);

      // 浏览器窗口大小变化时即時重新检测（使用 requestAnimationFrame 确保与渲染同步）
      window.addEventListener('resize', () => {
        requestAnimationFrame(checkLayout);
      });
    }
  } else {
    pageContainer.innerHTML = `
      <!-- 返回按钮 -->
      <button class="back-btn" onclick="window.location.href='index.html'">返回地图</button>

      <!-- 省份头部横幅 -->
      <div class="province-hero">
        <h1>${provinceName}</h1>
        <p class="subtitle">${data.shortDesc}</p>
        <div class="season-info">最佳旅游时间：${data.bestSeason}</div>
      </div>

      <!-- 内容区 -->
      <div class="province-content">
        ${renderScenerySection(data.scenery)}
        ${renderFoodSection(data.food)}
      </div>
    `;
  }

  // 滚动到顶部
  window.scrollTo(0, 0);
}

/**
 * 渲染错误页面（省份未找到时显示）
 */
function renderErrorPage() {
  const pageContainer = document.getElementById('provincePage');
  pageContainer.innerHTML = `
    <div class="error-page">
      <h1>404</h1>
      <p>未找到该省份信息</p>
      <a href="index.html">返回首页</a>
    </div>
  `;
}

/**
 * 页面初始化入口
 */
function init() {
  const provinceName = getProvinceNameFromURL();

  if (!provinceName || !PROVINCE_DATA[provinceName]) {
    renderErrorPage();
    return;
  }

  // 渲染省份详情页
  renderProvincePage(provinceName, PROVINCE_DATA[provinceName]);

  // 更新页面标题
  document.title = `${provinceName} - 华夏览胜`;
}

// 启动页面初始化
init();
