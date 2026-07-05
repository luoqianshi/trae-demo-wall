/**
 * 今天吃什么 - 应用主逻辑
 * 外卖平台风格：网格展示 + 老虎机随机高亮 + 详情弹层 + 图片上传
 */

(function() {
  'use strict';

  // ========== 状态 ==========
  var state = {
    filters: { mealType: [], cuisine: [] },
    searchQuery: '',
    isAnimating: false,
    recentResults: [],
    currentFood: null,
    allFoods: window.foodDatabase || [],
    filteredFoods: []
  };

  // ========== DOM 引用 ==========
  var dom = {
    cuisineTags: document.getElementById('cuisineTags'),
    foodGrid: document.getElementById('foodGrid'),
    foodCount: document.getElementById('foodCount'),
    searchInput: document.getElementById('searchInput'),
    randomBtn: document.getElementById('randomBtn'),
    detailModal: document.getElementById('detailModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    modalImage: document.getElementById('modalImage'),
    modalPlaceholder: document.getElementById('modalPlaceholder'),
    modalName: document.getElementById('modalName'),
    modalPrice: document.getElementById('modalPrice'),
    modalDesc: document.getElementById('modalDesc'),
    modalTags: document.getElementById('modalTags'),
    rerollBtn: document.getElementById('rerollBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadTextBtn: document.getElementById('uploadTextBtn'),
    fileInput: document.getElementById('fileInput'),
    mealCategories: document.getElementById('mealCategories'),
    mapBtn: document.getElementById('mapBtn'),
    mapModal: document.getElementById('mapModal'),
    mapOverlay: document.getElementById('mapOverlay'),
    mapClose: document.getElementById('mapClose')
  };

  // ========== 初始化 ==========
  function init() {
    if (window.loadUploadMap) {
      loadUploadMap().then(function() {
        applyFilters();
        renderCuisineTags();
        renderFoodGrid();
        bindEvents();
      });
    } else {
      applyFilters();
      renderCuisineTags();
      renderFoodGrid();
      bindEvents();
    }
  }

  // ========== 筛选逻辑 ==========
  function applyFilters() {
    var query = state.searchQuery.toLowerCase().trim();
    state.filteredFoods = state.allFoods.filter(function(food) {
      var mealMatch = state.filters.mealType.length === 0 ||
        state.filters.mealType.some(function(t) { return food.mealType.indexOf(t) >= 0; });
      var cuisineMatch = state.filters.cuisine.length === 0 ||
        state.filters.cuisine.indexOf(food.cuisine) >= 0;
      var searchMatch = !query ||
        food.name.toLowerCase().indexOf(query) >= 0 ||
        food.description.toLowerCase().indexOf(query) >= 0 ||
        food.tags.some(function(t) { return t.toLowerCase().indexOf(query) >= 0; });
      return mealMatch && cuisineMatch && searchMatch;
    });
  }

  // ========== 渲染菜系标签 ==========
  function renderCuisineTags() {
    if (!window.filterConfig) return;
    var cuisines = filterConfig.cuisine.options;
    dom.cuisineTags.innerHTML = cuisines.map(function(c) {
      var active = state.filters.cuisine.indexOf(c) >= 0 ? 'active' : '';
      return '<button class="filter-tag ' + active + '" data-type="cuisine" data-value="' + c + '">' + c + '</button>';
    }).join('');
  }

  // ========== 渲染食物网格 ==========
  function renderFoodGrid() {
    var foods = state.filteredFoods;
    dom.foodCount.textContent = foods.length + ' 道';

    if (foods.length === 0) {
      dom.foodGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">没有找到匹配的美食 😅</div>';
      return;
    }

    dom.foodGrid.innerHTML = foods.map(function(food) {
      var imgUrl = window.getFoodImageUrl ? getFoodImageUrl(food.id) : '';
      var imgHtml = '';
      if (imgUrl) {
        imgHtml = '<img src="' + imgUrl + '" alt="' + food.name + '" loading="lazy">';
      }
      return `
        <div class="food-card" data-food-id="${food.id}">
          <div class="card-image-wrap">
            <div class="card-image-placeholder">${food.emoji}</div>
            ${imgHtml}
            <span class="card-badge">${food.cuisine}</span>
          </div>
          <div class="card-body">
            <div class="card-name">${food.name}</div>
            <div class="card-desc">${food.description}</div>
            <div class="card-footer">
              <div class="card-price">¥${food.price}<small> 起</small></div>
              <button class="card-add" data-food-id="${food.id}">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========== 切换筛选 ==========
  function toggleFilter(type, value) {
    var arr = state.filters[type];
    var idx = arr.indexOf(value);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(value);
    }
    applyFilters();
    if (type === 'cuisine') renderCuisineTags();
    renderFoodGrid();
  }

  // ========== 老虎机随机高亮 ==========
  function doRandomPick() {
    if (state.isAnimating) return;
    var candidates = state.filteredFoods;
    if (candidates.length === 0) {
      alert('当前筛选条件下没有美食，试试放宽条件？');
      return;
    }

    state.isAnimating = true;
    dom.randomBtn.disabled = true;
    dom.randomBtn.innerHTML = '<span class="fab-icon">🎲</span><span class="fab-text">选择中...</span>';

    // 排除最近3次
    var pool = candidates.filter(function(f) {
      return state.recentResults.indexOf(f.id) < 0;
    });
    if (pool.length === 0) pool = candidates;

    var finalFood = pool[Math.floor(Math.random() * pool.length)];
    state.recentResults.push(finalFood.id);
    if (state.recentResults.length > 3) state.recentResults.shift();

    // 高亮动画
    var duration = 2000;
    var start = performance.now();
    var lastIdx = -1;

    function animate(now) {
      var elapsed = now - start;
      var progress = elapsed / duration;

      // 清除之前的高亮
      document.querySelectorAll('.food-card.highlight').forEach(function(c) {
        c.classList.remove('highlight');
      });

      if (progress < 1) {
        // 速度逐渐减慢
        var delay = progress < 0.6 ? 80 : (progress < 0.85 ? 200 : 400);
        if (Math.floor(elapsed / delay) !== lastIdx) {
          lastIdx = Math.floor(elapsed / delay);
          var randIdx = Math.floor(Math.random() * candidates.length);
          var card = dom.foodGrid.children[randIdx];
          if (card) card.classList.add('highlight');
        }
        requestAnimationFrame(animate);
      } else {
        // 最终定格
        document.querySelectorAll('.food-card.highlight').forEach(function(c) {
          c.classList.remove('highlight');
        });
        state.isAnimating = false;
        dom.randomBtn.disabled = false;
        dom.randomBtn.innerHTML = '<span class="fab-icon">🎲</span><span class="fab-text">随机推荐</span>';
        showFoodDetail(finalFood);
      }
    }

    requestAnimationFrame(animate);
  }

  // ========== 显示详情弹层 ==========
  function showFoodDetail(food) {
    state.currentFood = food;
    var imgUrl = window.getFoodImageUrl ? getFoodImageUrl(food.id) : '';

    dom.modalPlaceholder.textContent = food.emoji;
    dom.modalImage.src = imgUrl || '';
    dom.modalImage.style.display = imgUrl ? 'block' : 'none';
    dom.modalName.textContent = food.name;
    dom.modalPrice.textContent = '¥' + food.price;
    dom.modalDesc.textContent = food.description;
    dom.modalTags.innerHTML = food.tags.map(function(t) {
      return '<span class="modal-tag">' + t + '</span>';
    }).join('');

    dom.detailModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    dom.detailModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ========== 商家地图弹层 ==========
  function openMapModal() {
    if (!state.currentFood) return;

    dom.mapModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // 初始化地图（延迟确保容器已渲染）
    setTimeout(function() {
      if (window.FoodMap && FoodMap.init) {
        FoodMap.init('mapContainer');

        var keywords = [state.currentFood.name].concat(state.currentFood.searchKeywords || []);
        var listContainer = document.getElementById('mapShopList');
        if (listContainer) {
          listContainer.innerHTML = '<div class="map-shop-loading">正在搜索附近商家...</div>';
        }

        FoodMap.searchNearby(keywords, state.currentFood.cuisine)
          .then(function(shops) {
            FoodMap.renderMarkers(shops);
            FoodMap.renderShopList(shops, 'mapShopList');
          })
          .catch(function() {
            if (listContainer) {
              listContainer.innerHTML = '<div class="map-shop-empty">搜索失败，请检查网络连接</div>';
            }
          });
      }
    }, 50);
  }

  function closeMapModal() {
    dom.mapModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ========== 图片上传 ==========
  function triggerUpload() {
    dom.fileInput.click();
  }

  function handleFileSelect(e) {
    var file = e.target.files[0];
    if (!file || !state.currentFood) return;

    if (window.uploadFoodImage) {
      uploadFoodImage(state.currentFood.id, file)
        .then(function(res) {
          if (res.success) {
            // 更新弹层图片
            dom.modalImage.src = res.url;
            dom.modalImage.style.display = 'block';
            // 更新网格中的对应卡片
            var card = document.querySelector('.food-card[data-food-id="' + state.currentFood.id + '"]');
            if (card) {
              var wrap = card.querySelector('.card-image-wrap');
              var img = wrap.querySelector('img');
              if (img) {
                img.src = res.url;
              } else {
                img = document.createElement('img');
                img.src = res.url;
                img.alt = state.currentFood.name;
                img.loading = 'lazy';
                wrap.appendChild(img);
              }
            }
            // 刷新映射缓存
            if (window.loadUploadMap) loadUploadMap();
          }
        })
        .catch(function(err) {
          alert('上传失败: ' + (err.message || '未知错误'));
        });
    }
    dom.fileInput.value = '';
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    // 用餐时段分类点击
    dom.mealCategories.addEventListener('click', function(e) {
      var item = e.target.closest('.category-item');
      if (!item) return;
      var type = item.dataset.type;
      var value = item.dataset.value;
      item.classList.toggle('active');
      toggleFilter(type, value);
    });

    // 菜系标签点击
    dom.cuisineTags.addEventListener('click', function(e) {
      var tag = e.target.closest('.filter-tag');
      if (!tag) return;
      toggleFilter(tag.dataset.type, tag.dataset.value);
    });

    // 搜索框
    dom.searchInput.addEventListener('input', function(e) {
      state.searchQuery = e.target.value;
      applyFilters();
      renderFoodGrid();
    });

    // 随机推荐按钮
    dom.randomBtn.addEventListener('click', doRandomPick);

    // 食物卡片点击（打开详情）
    dom.foodGrid.addEventListener('click', function(e) {
      var card = e.target.closest('.food-card');
      if (!card) return;
      var foodId = parseInt(card.dataset.foodId);
      var food = state.allFoods.find(function(f) { return f.id === foodId; });
      if (food) showFoodDetail(food);
    });

    // 详情弹层关闭
    dom.modalClose.addEventListener('click', closeModal);
    dom.modalOverlay.addEventListener('click', closeModal);

    // 弹层内"换一个"
    dom.rerollBtn.addEventListener('click', function() {
      closeModal();
      setTimeout(doRandomPick, 300);
    });

    // 上传按钮
    dom.uploadBtn.addEventListener('click', triggerUpload);
    dom.uploadTextBtn.addEventListener('click', triggerUpload);
    dom.fileInput.addEventListener('change', handleFileSelect);

    // 地图按钮
    dom.mapBtn.addEventListener('click', openMapModal);
    dom.mapClose.addEventListener('click', closeMapModal);
    dom.mapOverlay.addEventListener('click', closeMapModal);

    // ESC关闭弹层
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (dom.mapModal.classList.contains('open')) {
          closeMapModal();
        } else {
          closeModal();
        }
      }
    });
  }

  // ========== 启动 ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
