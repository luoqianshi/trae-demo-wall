// ==================== 主应用逻辑 ====================

class App {
  constructor() {
    this.calculator = null;
    this.chartRenderer = new ChartRenderer();
    this.excelHandler = new ExcelHandler();
    this.feishuSync = new FeishuSyncManager();
    this.aiPredictor = new AIPredictor();
    this.currentPeriod = 'day';
    this.currentStoreId = null;
    this.stores = STORES;
    this.promotions = PROMOTIONS;
    this.materials = [];
    this.recipes = [];
    this.sales = [];
    this.currentChannelFilter = 'all';
  }

  // 初始化
  init() {
    this.renderStoreSelector();
    this.setCurrentDate();

    // 默认选择第一家门店
    if (this.stores.length > 0) {
      this.switchStore(this.stores[0].store_id);
    }

    this.bindEvents();
  }

  // 设置当前日期
  setCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('zh-CN', options);
  }

  // 渲染门店选择器
  renderStoreSelector() {
    const storeList = document.getElementById('store-list');
    if (!storeList) return;

    let html = '';
    this.stores.forEach(store => {
      html += `
        <div class="store-option p-3 rounded-xl cursor-pointer hover:bg-sb-green/5 transition-all" data-store-id="${store.store_id}">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sb-green/20 to-sb-green/5 flex items-center justify-center">
                <svg class="w-5 h-5 text-sb-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-800">${store.name}</div>
                <div class="text-xs text-gray-400">${store.address}</div>
                <div class="text-xs text-sb-green mt-0.5">${store.phone}</div>
              </div>
            </div>
            <div class="store-check hidden" data-store-id="${store.store_id}">
              <svg class="w-5 h-5 text-sb-green" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            </div>
          </div>
        </div>
      `;
    });

    storeList.innerHTML = html;

    // 绑定门店选择事件
    storeList.querySelectorAll('.store-option').forEach(option => {
      option.addEventListener('click', () => {
        const storeId = option.dataset.storeId;
        this.switchStore(storeId);
        this.toggleStoreDropdown(false);
      });
    });
  }

  // 切换门店
  switchStore(storeId) {
    const store = this.stores.find(s => s.store_id === storeId);
    if (!store) return;

    this.currentStoreId = storeId;
    this.materials = store.materials;
    this.recipes = store.recipes;
    this.sales = store.sales;

    // 更新UI
    document.getElementById('current-store-name').textContent = store.name;
    document.getElementById('welcome-store-name').textContent = store.name;
    document.getElementById('welcome-store-address').textContent = store.address;
    document.getElementById('welcome-store-phone').textContent = store.phone;

    // 更新选中状态
    document.querySelectorAll('.store-check').forEach(check => {
      check.classList.toggle('hidden', check.dataset.storeId !== storeId);
    });

    // 重新初始化计算器并渲染
    this.calculator = new CostCalculator(this.materials, this.recipes, this.sales);
    this.renderDashboard();

    this.showToast(`已切换至 ${store.name}`, 'success');
  }

  // 切换下拉菜单显示
  toggleStoreDropdown(show) {
    const dropdown = document.getElementById('store-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden', !show);
    }
  }

  // 渲染仪表盘
  renderDashboard() {
    // KPI
    const kpis = this.calculator.getKPIs();
    this.chartRenderer.renderKPIs(kpis, 'kpi-container');

    // 热销品
    this.renderHotProducts();

    // 折扣活动
    this.renderPromotions();

    // 线上渠道
    this.renderOnlineChannels();

    // 线下渠道
    this.renderOfflineChannels();

    // 趋势图
    const dailyData = this.calculator.aggregateByDay();
    const weeklyData = this.calculator.aggregateByWeek();
    const monthlyData = this.calculator.aggregateByMonth();

    let trendData;
    if (this.currentPeriod === 'day') trendData = dailyData;
    else if (this.currentPeriod === 'week') trendData = weeklyData;
    else trendData = monthlyData;

    this.chartRenderer.renderTrendChart(trendData, 'trend-chart', this.currentPeriod);

    // 产品排行
    const productData = this.calculator.aggregateByProduct();
    this.chartRenderer.renderProductRanking(productData, 'ranking-chart');

    // 产品对比
    this.chartRenderer.renderProductComparison(productData, 'comparison-chart');

    // 渠道占比（线上vs线下）
    this.chartRenderer.renderChannelPie(this.sales, 'channel-chart');

    // 数据表格
    this.renderDataTable(productData);

    // 飞书专区
    this.renderFeishuSection();
  }

  // 渲染热销品
  renderHotProducts() {
    const container = document.getElementById('hot-products');
    if (!container) return;

    const productData = this.calculator.aggregateByProduct();
    const top3 = productData.slice(0, 3);

    const rankClasses = ['rank-badge', 'rank-badge-2', 'rank-badge-3'];
    const rankLabels = ['1st', '2nd', '3rd'];
    const rankNames = ['冠军', '亚军', '季军'];

    let html = '';
    top3.forEach((p, index) => {
      const recipe = this.recipes.find(r => r.product_id === p.productId);
      const emoji = recipe ? recipe.emoji : '☕';
      const color = recipe ? recipe.color : '#C4A77D';

      html += `
        <div class="hot-product-card rounded-2xl p-5 relative overflow-hidden">
          <div class="absolute top-4 right-4 ${rankClasses[index]} w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold">
            ${rankLabels[index]}
          </div>
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center" style="background: linear-gradient(135deg, ${color}30 0%, ${color}15 100%);">
              ${recipe?.image_url
                ? `<img src="${recipe.image_url}" alt="${recipe.name}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="hidden w-full h-full items-center justify-center text-3xl">${emoji}</div>`
                : `<span class="text-3xl">${emoji}</span>`
              }
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-400 mb-0.5">${rankNames[index]}</div>
              <div class="text-lg font-bold text-gray-800">${p.name}</div>
              <div class="text-xs text-gray-500">${recipe ? recipe.category : ''}</div>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3">
            <div class="text-center">
              <div class="text-lg font-bold text-sb-green">${p.quantity}</div>
              <div class="text-[10px] text-gray-400">销量(杯)</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-amber-600">¥${p.grossProfit.toLocaleString('zh-CN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
              <div class="text-[10px] text-gray-400">毛利</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-sb-blue">${p.profitMargin.toFixed(1)}%</div>
              <div class="text-[10px] text-gray-400">毛利率</div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 渲染折扣活动
  renderPromotions() {
    const container = document.getElementById('promotions');
    if (!container) return;

    let html = '';
    this.promotions.forEach(promo => {
      const borderColor = promo.badge_color;
      const productNames = promo.products.map(pid => {
        const recipe = this.recipes.find(r => r.product_id === pid);
        return recipe ? recipe.name : pid;
      }).join('、');

      html += `
        <div class="promo-card rounded-2xl p-5" style="border-left-color: ${borderColor};">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="text-sm font-bold text-gray-800">${promo.name}</div>
              <div class="text-[10px] text-gray-400 mt-0.5">${promo.name_en}</div>
            </div>
            <span class="px-2 py-1 rounded-lg text-xs font-bold text-white" style="background: ${borderColor};">
              ${promo.badge}
            </span>
          </div>
          <p class="text-xs text-gray-600 mb-3">${promo.description}</p>
          <div class="flex items-center justify-between text-[10px] text-gray-400">
            <span>参与: ${productNames}</span>
            <span>${promo.start_date.substring(5)} - ${promo.end_date.substring(5)}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 渲染线上渠道专区
  renderOnlineChannels() {
    const container = document.getElementById('online-channels');
    if (!container) return;

    const channelStats = this.calculator.aggregateByOnlineChannel();

    let html = '';
    ONLINE_CHANNELS.forEach(channel => {
      const stats = channelStats[channel] || { revenue: 0, cost: 0, quantity: 0 };
      const meta = CHANNEL_META[channel] || { icon: '📦', color: '#666', bg: '#f5f5f5' };
      const profit = stats.revenue - stats.cost;
      const margin = stats.revenue > 0 ? (profit / stats.revenue * 100) : 0;

      html += `
        <div class="channel-card rounded-2xl p-5" style="background: linear-gradient(135deg, ${meta.bg} 0%, rgba(255,255,255,0.9) 100%);">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: ${meta.color}20;">
                ${meta.icon}
              </div>
              <div>
                <div class="text-sm font-bold text-gray-800">${channel}</div>
                <div class="text-[10px] text-gray-400">ONLINE CHANNEL</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold" style="color: ${meta.color};">${stats.quantity}</div>
              <div class="text-[10px] text-gray-400">销量</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center p-2 rounded-lg bg-white/60">
              <div class="text-sm font-bold text-gray-700">¥${stats.revenue.toLocaleString('zh-CN', {maximumFractionDigits: 0})}</div>
              <div class="text-[10px] text-gray-400">收入</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-white/60">
              <div class="text-sm font-bold text-sb-blue">¥${profit.toLocaleString('zh-CN', {maximumFractionDigits: 0})}</div>
              <div class="text-[10px] text-gray-400">毛利</div>
            </div>
            <div class="text-center p-2 rounded-lg bg-white/60">
              <div class="text-sm font-bold text-sb-green">${margin.toFixed(1)}%</div>
              <div class="text-[10px] text-gray-400">毛利率</div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 渲染线下渠道专区
  renderOfflineChannels() {
    const container = document.getElementById('offline-channels');
    if (!container) return;

    const channelStats = this.calculator.aggregateByOfflineChannel();

    let html = '';
    OFFLINE_CHANNELS.forEach(channel => {
      const stats = channelStats[channel] || { revenue: 0, cost: 0, quantity: 0 };
      const meta = CHANNEL_META[channel] || { icon: '🏪', color: '#00704A', bg: '#E8F5E9' };
      const profit = stats.revenue - stats.cost;
      const margin = stats.revenue > 0 ? (profit / stats.revenue * 100) : 0;

      html += `
        <div class="channel-card rounded-2xl p-5" style="background: linear-gradient(135deg, ${meta.bg} 0%, rgba(255,255,255,0.9) 100%);">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style="background: ${meta.color}20;">
                ${meta.icon}
              </div>
              <div>
                <div class="text-base font-bold text-gray-800">${channel}</div>
                <div class="text-[10px] text-gray-400">OFFLINE CHANNEL</div>
              </div>
            </div>
            <div class="flex space-x-6">
              <div class="text-center">
                <div class="text-xl font-bold text-gray-800">${stats.quantity}</div>
                <div class="text-[10px] text-gray-400">销量(杯)</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-gray-700">¥${stats.revenue.toLocaleString('zh-CN', {maximumFractionDigits: 0})}</div>
                <div class="text-[10px] text-gray-400">收入</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-sb-blue">¥${profit.toLocaleString('zh-CN', {maximumFractionDigits: 0})}</div>
                <div class="text-[10px] text-gray-400">毛利</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-sb-green">${margin.toFixed(1)}%</div>
                <div class="text-[10px] text-gray-400">毛利率</div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 渲染数据表格
  renderDataTable(productData) {
    const container = document.getElementById('data-table');
    if (!container) return;

    const formatMoney = (num) => '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 根据渠道筛选过滤销售数据
    let filteredSales = this.sales;
    if (this.currentChannelFilter !== 'all') {
      if (this.currentChannelFilter === 'online') {
        filteredSales = this.sales.filter(s => ONLINE_CHANNELS.includes(s.channel));
      } else if (this.currentChannelFilter === 'offline') {
        filteredSales = this.sales.filter(s => OFFLINE_CHANNELS.includes(s.channel));
      } else {
        filteredSales = this.sales.filter(s => s.channel === this.currentChannelFilter);
      }
    }

    // 重新计算筛选后的产品数据
    const filteredProductStats = {};
    filteredSales.forEach(sale => {
      if (!filteredProductStats[sale.product_id]) {
        const recipe = this.recipes.find(r => r.product_id === sale.product_id);
        filteredProductStats[sale.product_id] = {
          productId: sale.product_id,
          name: recipe.name,
          category: recipe.category,
          price: recipe.price,
          unitCost: this.calculator.calculateUnitCost(sale.product_id),
          quantity: 0,
          revenue: 0,
          cost: 0
        };
      }
      const stat = filteredProductStats[sale.product_id];
      const unitCost = this.calculator.calculateUnitCost(sale.product_id);
      stat.quantity += sale.quantity;
      stat.revenue += sale.revenue;
      stat.cost += unitCost * sale.quantity;
    });

    const filteredData = Object.values(filteredProductStats).map(stat => {
      stat.grossProfit = stat.revenue - stat.cost;
      stat.profitMargin = stat.revenue > 0 ? (stat.grossProfit / stat.revenue * 100) : 0;
      stat.profitPerUnit = stat.price - stat.unitCost;
      return stat;
    }).sort((a, b) => b.grossProfit - a.grossProfit);

    let html = `
      <table class="data-table min-w-full divide-y divide-gray-100">
        <thead>
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">产品</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">售价</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">单杯成本</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">单杯利润</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">销量</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">收入</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">成本</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">毛利</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">毛利率</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
    `;

    filteredData.forEach(p => {
      const recipe = this.recipes.find(r => r.product_id === p.productId);
      html += `
        <tr class="transition-colors">
          <td class="px-4 py-3 whitespace-nowrap">
            <div class="flex items-center space-x-2">
              ${recipe?.image_url
                ? `<div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"><img src="${recipe.image_url}" alt="${recipe.name}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><span class="hidden text-lg">${recipe.emoji}</span></div>`
                : `<span class="text-lg">${recipe ? recipe.emoji : '☕'}</span>`
              }
              <div>
                <div class="text-sm font-semibold text-gray-800">${p.name}</div>
                <div class="text-[10px] text-gray-400">${recipe ? recipe.category : ''}</div>
              </div>
            </div>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">${formatMoney(p.price)}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-red-500">${formatMoney(p.unitCost)}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-sb-green font-medium">${formatMoney(p.profitPerUnit)}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">${p.quantity}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-sb-green font-medium">${formatMoney(p.revenue)}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-red-500">${formatMoney(p.cost)}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-sb-blue">${formatMoney(p.grossProfit)}</td>
          <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-sb-green">${p.profitMargin.toFixed(2)}%</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // 绑定事件
  bindEvents() {
    // 门店选择器下拉
    const storeBtn = document.getElementById('store-selector-btn');
    const storeDropdown = document.getElementById('store-dropdown');

    if (storeBtn) {
      storeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleStoreDropdown(storeDropdown.classList.contains('hidden'));
      });
    }

    // 点击外部关闭下拉
    document.addEventListener('click', () => {
      this.toggleStoreDropdown(false);
    });

    if (storeDropdown) {
      storeDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // 周期切换
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-btn').forEach(b => {
          b.classList.remove('active');
          b.classList.add('text-gray-600');
        });
        e.target.classList.remove('text-gray-600');
        e.target.classList.add('active');
        this.currentPeriod = e.target.dataset.period;
        this.renderDashboard();
      });
    });

    // 渠道筛选
    const channelFilter = document.getElementById('channel-filter');
    if (channelFilter) {
      channelFilter.addEventListener('change', (e) => {
        this.currentChannelFilter = e.target.value;
        const productData = this.calculator.aggregateByProduct();
        this.renderDataTable(productData);
      });
    }

    // Excel上传 - 材料成本
    const materialsInput = document.getElementById('materials-file');
    if (materialsInput) {
      materialsInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          this.showLoading(true);
          const materials = await this.excelHandler.parseMaterialsFile(file);
          this.materials = materials;
          this.calculator = new CostCalculator(this.materials, this.recipes, this.sales);
          this.renderDashboard();
          this.showToast('材料成本数据上传成功！', 'success');
        } catch (error) {
          this.showToast(error.message, 'error');
        } finally {
          this.showLoading(false);
          materialsInput.value = '';
        }
      });
    }

    // Excel上传 - 销售数据
    const salesInput = document.getElementById('sales-file');
    if (salesInput) {
      salesInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          this.showLoading(true);
          const sales = await this.excelHandler.parseSalesFile(file);
          this.sales = sales;
          this.calculator = new CostCalculator(this.materials, this.recipes, this.sales);
          this.renderDashboard();
          this.showToast('销售数据上传成功！', 'success');
        } catch (error) {
          this.showToast(error.message, 'error');
        } finally {
          this.showLoading(false);
          salesInput.value = '';
        }
      });
    }

    // 下载模板
    document.getElementById('download-materials-template')?.addEventListener('click', () => {
      this.excelHandler.exportTemplate('materials');
    });

    document.getElementById('download-sales-template')?.addEventListener('click', () => {
      this.excelHandler.exportTemplate('sales');
    });

    // 导出结果
    document.getElementById('export-results')?.addEventListener('click', () => {
      const productData = this.calculator.aggregateByProduct();
      this.excelHandler.exportResults(productData);
      this.showToast('核算结果已导出！', 'success');
    });

    // 配置模板模态框
    document.getElementById('config-template')?.addEventListener('click', () => {
      this.openColumnMappingModal();
    });

    document.getElementById('close-modal')?.addEventListener('click', () => {
      this.closeColumnMappingModal();
    });

    document.getElementById('cancel-mapping')?.addEventListener('click', () => {
      this.closeColumnMappingModal();
    });

    document.getElementById('save-mapping')?.addEventListener('click', () => {
      this.saveColumnMapping();
    });

    document.getElementById('reset-mapping')?.addEventListener('click', () => {
      this.excelHandler.resetColumnMap();
      this.renderColumnMappingModal();
      this.showToast('已重置为默认配置', 'success');
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.chartRenderer.resize();
    });

    // ========== 飞书同步事件 ==========
    // 同步模式切换
    document.querySelectorAll('.feishu-sync-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.feishu-sync-mode-btn').forEach(b => {
          b.classList.remove('active');
          b.classList.add('text-gray-600', 'bg-gray-100');
        });
        e.target.classList.add('active');
        e.target.classList.remove('text-gray-600', 'bg-gray-100');
        const mode = e.target.dataset.mode;
        this.feishuSync.config.syncMode = mode;
        document.getElementById('feishu-auto-settings').classList.toggle('hidden', mode !== 'auto');
        document.getElementById('feishu-manual-section').classList.toggle('hidden', mode !== 'manual');
      });
    });

    // 同步频率选择
    document.querySelectorAll('.feishu-freq-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.feishu-freq-btn').forEach(b => {
          b.classList.remove('active');
          b.classList.add('text-gray-600', 'bg-gray-100');
        });
        e.target.classList.add('active');
        e.target.classList.remove('text-gray-600', 'bg-gray-100');
        this.feishuSync.config.syncFrequency = e.target.dataset.freq;
      });
    });

    // 手动同步
    document.getElementById('feishu-manual-sync-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('feishu-manual-sync-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>同步中...</span>';
      btn.disabled = true;

      const kpis = this.calculator.getKPIs();
      const productData = this.calculator.aggregateByProduct();
      const syncData = this.feishuSync.prepareSyncData(this.currentStoreId, kpis, productData, {});
      const result = await this.feishuSync.manualSync(syncData);

      btn.innerHTML = originalText;
      btn.disabled = false;
      this.updateFeishuStatus();
      this.showToast(result.success ? result.message : '同步失败: ' + result.message, result.success ? 'success' : 'error');
    });

    // 保存飞书配置
    document.getElementById('feishu-save-btn')?.addEventListener('click', () => {
      this.feishuSync.config.appId = document.getElementById('feishu-app-id').value.trim();
      this.feishuSync.config.appSecret = document.getElementById('feishu-app-secret').value.trim();
      this.feishuSync.config.bitableAppToken = document.getElementById('feishu-table-token').value.trim();
      this.feishuSync.config.tableName = document.getElementById('feishu-table-name').value.trim();
      this.feishuSync.saveConfig(this.feishuSync.config);
      this.updateFeishuStatus();
      this.showToast('飞书配置已保存！', 'success');
    });

    // 重置飞书配置
    document.getElementById('feishu-reset-btn')?.addEventListener('click', () => {
      this.feishuSync.resetConfig();
      document.getElementById('feishu-app-id').value = '';
      document.getElementById('feishu-app-secret').value = '';
      document.getElementById('feishu-table-token').value = '';
      document.getElementById('feishu-table-name').value = '星巴克成本数据';
      this.updateFeishuStatus();
      this.showToast('飞书配置已重置', 'success');
    });

    // 消息预览
    document.getElementById('feishu-preview-btn')?.addEventListener('click', () => {
      const preview = document.getElementById('feishu-message-preview');
      preview.classList.toggle('hidden');
      if (!preview.classList.contains('hidden')) {
        const store = this.stores.find(s => s.store_id === this.currentStoreId);
        const kpis = this.calculator.getKPIs();
        const rule = this.feishuSync.config.notifications[0];
        preview.textContent = this.feishuSync.getNotificationPreview(rule, store?.name || '门店', kpis);
      }
    });

    // ========== AI预测事件 ==========
    // API配置面板
    document.getElementById('ai-config-btn')?.addEventListener('click', () => {
      document.getElementById('ai-config-panel').classList.toggle('hidden');
    });

    document.getElementById('ai-config-close')?.addEventListener('click', () => {
      document.getElementById('ai-config-panel').classList.add('hidden');
    });

    // 提供商联动
    document.getElementById('ai-provider')?.addEventListener('change', (e) => {
      const presets = this.aiPredictor.getProviderPresets();
      const preset = presets[e.target.value];
      if (preset) {
        document.getElementById('ai-base-url').value = preset.baseUrl;
        document.getElementById('ai-model').value = preset.model;
      }
    });

    // 保存AI配置
    document.getElementById('ai-config-save')?.addEventListener('click', () => {
      this.aiPredictor.saveApiConfig({
        provider: document.getElementById('ai-provider').value,
        apiKey: document.getElementById('ai-api-key').value.trim(),
        baseUrl: document.getElementById('ai-base-url').value.trim(),
        model: document.getElementById('ai-model').value.trim()
      });
      this.showToast('AI API 配置已保存！', 'success');
    });

    // 测试AI连接
    document.getElementById('ai-config-test')?.addEventListener('click', async () => {
      const btn = document.getElementById('ai-config-test');
      btn.textContent = '测试中...';
      btn.disabled = true;
      // 先临时保存配置用于测试
      this.aiPredictor.apiConfig = {
        provider: document.getElementById('ai-provider').value,
        apiKey: document.getElementById('ai-api-key').value.trim(),
        baseUrl: document.getElementById('ai-base-url').value.trim(),
        model: document.getElementById('ai-model').value.trim()
      };
      const result = await this.aiPredictor.testConnection();
      btn.textContent = '测试连接';
      btn.disabled = false;
      this.showToast(result.success ? '连接成功！' : '连接失败: ' + result.message, result.success ? 'success' : 'error');
    });

    // 重新分析
    document.getElementById('ai-refresh-btn')?.addEventListener('click', () => {
      this.runAIAnalysis();
    });
  }

  // 打开列映射模态框
  openColumnMappingModal() {
    this.renderColumnMappingModal();
    document.getElementById('column-mapping-modal').classList.add('active');
  }

  // 关闭列映射模态框
  closeColumnMappingModal() {
    document.getElementById('column-mapping-modal').classList.remove('active');
  }

  // 渲染列映射模态框内容
  renderColumnMappingModal() {
    const materialsContainer = document.getElementById('materials-mapping');
    const salesContainer = document.getElementById('sales-mapping');

    if (materialsContainer) {
      const materialsMap = this.excelHandler.columnMap.materials;
      materialsContainer.innerHTML = Object.entries(materialsMap).map(([key, value]) => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-gray-50">
          <span class="text-xs font-medium text-gray-600">${key}</span>
          <input type="text" class="mapping-input text-xs px-2 py-1 rounded border border-gray-200 w-32" 
                 data-type="materials" data-field="${key}" value="${value.join(', ')}" 
                 placeholder="列名, 别名...">
        </div>
      `).join('');
    }

    if (salesContainer) {
      const salesMap = this.excelHandler.columnMap.sales;
      salesContainer.innerHTML = Object.entries(salesMap).map(([key, value]) => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-gray-50">
          <span class="text-xs font-medium text-gray-600">${key}</span>
          <input type="text" class="mapping-input text-xs px-2 py-1 rounded border border-gray-200 w-32" 
                 data-type="sales" data-field="${key}" value="${value.join(', ')}" 
                 placeholder="列名, 别名...">
        </div>
      `).join('');
    }
  }

  // 保存列映射配置
  saveColumnMapping() {
    const inputs = document.querySelectorAll('.mapping-input');
    const newMap = { materials: {}, sales: {} };

    inputs.forEach(input => {
      const type = input.dataset.type;
      const field = input.dataset.field;
      const values = input.value.split(',').map(v => v.trim()).filter(v => v);
      newMap[type][field] = values;
    });

    this.excelHandler.setColumnMap(newMap);
    this.closeColumnMappingModal();
    this.showToast('模板配置已保存！', 'success');
  }

  // 显示/隐藏加载状态
  showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  // 显示提示
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success'
      ? 'bg-gradient-to-r from-sb-green to-sb-greenLight'
      : type === 'error'
        ? 'bg-gradient-to-r from-red-500 to-red-600'
        : 'bg-gradient-to-r from-sb-blue to-sb-blueLight';
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 动画进入
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========== 飞书专区渲染 ==========
  renderFeishuSection() {
    const config = this.feishuSync.config;
    document.getElementById('feishu-app-id').value = config.appId || '';
    document.getElementById('feishu-app-secret').value = config.appSecret || '';
    document.getElementById('feishu-table-token').value = config.bitableAppToken || '';
    document.getElementById('feishu-table-name').value = config.tableName || '星巴克成本数据';

    // 同步模式
    const isAuto = config.syncMode === 'auto';
    document.querySelectorAll('.feishu-sync-mode-btn').forEach(btn => {
      const isActive = (btn.dataset.mode === config.syncMode);
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('text-gray-600', !isActive);
      btn.classList.toggle('bg-gray-100', !isActive);
    });
    document.getElementById('feishu-auto-settings').classList.toggle('hidden', !isAuto);
    document.getElementById('feishu-manual-section').classList.toggle('hidden', isAuto);

    // 频率
    document.querySelectorAll('.feishu-freq-btn').forEach(btn => {
      const isActive = (btn.dataset.freq === config.syncFrequency);
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('text-gray-600', !isActive);
      btn.classList.toggle('bg-gray-100', !isActive);
    });

    // 同步时间
    document.getElementById('feishu-last-sync').textContent = this.feishuSync.syncStatus.lastSyncTime || '--';
    document.getElementById('feishu-next-sync').textContent = this.feishuSync.syncStatus.nextSyncTime || '--';

    this.updateFeishuStatus();
  }

  updateFeishuStatus() {
    const dot = document.getElementById('feishu-status-dot');
    const text = document.getElementById('feishu-status-text');
    dot.className = `w-2 h-2 rounded-full ${this.feishuSync.getStatusColor()} ${this.feishuSync.syncStatus.status === 'syncing' ? 'syncing-indicator' : ''}`;
    text.textContent = this.feishuSync.getStatusText();
  }

  // ========== AI预测渲染 ==========
  async runAIAnalysis() {
    const kpis = this.calculator.getKPIs();
    const productData = this.calculator.aggregateByProduct();

    // 设置加载状态
    ['ai-hot-products', 'ai-store-analysis', 'ai-promotion-analysis'].forEach(id => {
      document.getElementById(id).innerHTML = '<div class="text-xs text-gray-400 text-center py-4 ai-loading">分析中...</div>';
    });

    try {
      // 尝试真实AI调用
      if (this.aiPredictor.apiConfig.apiKey) {
        const [hotResult, storeResult, promoResult] = await Promise.all([
          this.aiPredictor.predictHotProducts(this.sales, this.recipes),
          this.aiPredictor.analyzeStore(kpis, {}, this.promotions, this.sales),
          this.aiPredictor.analyzePromotions(this.sales, this.recipes, this.promotions)
        ]);
        if (hotResult) this.renderHotProductPrediction(hotResult);
        else this.renderHotProductPrediction(this.aiPredictor.getMockHotProducts(this.recipes));
        if (storeResult) this.renderStoreAnalysis(storeResult);
        else this.renderStoreAnalysis(this.aiPredictor.getMockStoreAnalysis(kpis));
        if (promoResult) this.renderPromotionAnalysis(promoResult);
        else this.renderPromotionAnalysis(this.aiPredictor.getMockPromotionAnalysis(this.promotions));
      } else {
        // 无API Key，使用Mock数据
        this.renderHotProductPrediction(this.aiPredictor.getMockHotProducts(this.recipes));
        this.renderStoreAnalysis(this.aiPredictor.getMockStoreAnalysis(kpis));
        this.renderPromotionAnalysis(this.aiPredictor.getMockPromotionAnalysis(this.promotions));
        this.showToast('AI分析使用模拟数据（未配置API Key）', 'info');
      }
    } catch (error) {
      console.error('[AI分析] 错误:', error);
      this.renderHotProductPrediction(this.aiPredictor.getMockHotProducts(this.recipes));
      this.renderStoreAnalysis(this.aiPredictor.getMockStoreAnalysis(kpis));
      this.renderPromotionAnalysis(this.aiPredictor.getMockPromotionAnalysis(this.promotions));
      this.showToast('AI分析出错，已使用模拟数据', 'error');
    }
  }

  renderHotProductPrediction(data) {
    const container = document.getElementById('ai-hot-products');
    if (!data?.predictions) { container.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">暂无数据</div>'; return; }

    const trendIcons = { up: '📈', stable: '➡️', down: '📉' };
    const trendColors = { up: 'text-green-500', stable: 'text-gray-500', down: 'text-red-500' };

    container.innerHTML = data.predictions.slice(0, 5).map((p, i) => `
      <div class="flex items-center justify-between p-2 rounded-lg ${i === 0 ? 'bg-amber-50/80 border border-amber-200/50' : 'bg-gray-50/50'}">
        <div class="flex items-center space-x-2">
          <span class="text-xs font-bold ${i === 0 ? 'text-amber-600' : 'text-gray-600'}">#${i + 1}</span>
          <span class="text-xs font-medium text-gray-700">${p.name}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs ${trendColors[p.trend]}">${trendIcons[p.trend]}</span>
          <span class="text-xs font-bold text-gray-700">${p.predictedQty}杯</span>
        </div>
      </div>
      ${p.reason ? `<div class="text-[10px] text-gray-400 mt-1 pl-2 border-l-2 border-gray-200">${p.reason}</div>` : ''}
    `).join('');
  }

  renderStoreAnalysis(data) {
    const container = document.getElementById('ai-store-analysis');
    if (!data) { container.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">暂无数据</div>'; return; }

    const scoreColor = data.score >= 85 ? 'ai-score-excellent' : data.score >= 70 ? 'ai-score-good' : 'ai-score-warning';
    const levelColor = data.score >= 85 ? 'text-green-600 bg-green-100' : data.score >= 70 ? 'text-blue-600 bg-blue-100' : 'text-amber-600 bg-amber-100';

    container.innerHTML = `
      <div class="flex items-center space-x-4 mb-3">
        <div class="ai-score-ring ${scoreColor}" style="--score: ${data.score}%">
          <span class="relative z-10">${data.score}</span>
        </div>
        <div>
          <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${levelColor}">${data.level}</span>
          <div class="text-[10px] text-gray-400 mt-1">综合运营评分</div>
        </div>
      </div>
      ${data.highlights?.length ? `
        <div class="mb-2">
          <div class="text-[10px] font-semibold text-green-600 mb-1">✅ 亮点</div>
          ${data.highlights.map(h => `<div class="text-[10px] text-gray-600 mb-0.5">• ${h}</div>`).join('')}
        </div>
      ` : ''}
      ${data.suggestions?.length ? `
        <div class="mb-2">
          <div class="text-[10px] font-semibold text-blue-600 mb-1">💡 建议</div>
          ${data.suggestions.map(s => `<div class="text-[10px] text-gray-600 mb-0.5">• ${s}</div>`).join('')}
        </div>
      ` : ''}
      ${data.dataSupport?.length ? `
        <div class="border-t border-gray-100 pt-1 mt-1">
          <div class="text-[10px] font-semibold text-gray-500 mb-1">📊 数据支撑</div>
          ${data.dataSupport.map(d => `<div class="text-[10px] text-gray-400 mb-0.5">• ${d}</div>`).join('')}
        </div>
      ` : ''}
    `;
  }

  renderPromotionAnalysis(data) {
    const container = document.getElementById('ai-promotion-analysis');
    if (!data?.promotions) { container.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">暂无数据</div>'; return; }

    const effectColors = { '高': 'text-green-600 bg-green-100', '中': 'text-amber-600 bg-amber-100', '低': 'text-red-600 bg-red-100' };

    container.innerHTML = data.promotions.map(p => `
      <div class="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-semibold text-gray-700">${p.name}</span>
          <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${effectColors[p.effectiveness] || effectColors['中']}">${p.effectiveness}</span>
        </div>
        <div class="flex items-center space-x-3 mb-1.5">
          <span class="text-[10px] text-gray-500">ROI: <strong class="text-gray-700">${p.roi}</strong></span>
        </div>
        ${p.suggestions ? `<div class="text-[10px] text-blue-600 mb-1">💡 ${p.suggestions}</div>` : ''}
        ${p.dataSupport ? `<div class="text-[10px] text-gray-400 border-t border-gray-100 pt-1 mt-1">📊 ${p.dataSupport}</div>` : ''}
      </div>
    `).join('');
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
