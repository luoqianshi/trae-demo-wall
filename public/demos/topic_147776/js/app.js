/**
 * 主入口逻辑
 */

(async function() {
  let salesData = [];
  let previousKPIs = null;

  // 初始化粒子背景
  const particleBg = new ParticleBackground('particles-canvas');
  particleBg.init();

  // 初始化联动引擎
  const engine = new LinkageEngine();
  window.linkageEngine = engine;

  // 加载数据 - 从API获取
  try {
    const response = await fetch('http://localhost:3000/api/sales');
    salesData = await response.json();
    engine.setData(salesData);

    // 计算上一年 KPI 作为对比基准
    const currentYear = Math.max(...salesData.map(d => d.year));
    const previousYear = currentYear - 1;
    const previousData = salesData.filter(d => d.year === previousYear);
    previousKPIs = engine.calculateKPIs(previousData);

    console.log(`加载数据完成：${salesData.length} 条记录`);
  } catch (error) {
    console.error('数据加载失败:', error);
    alert('数据加载失败，请确保后端服务已启动 (node server.js)');
    return;
  }

  // 初始化图表
  ChartManager.initCharts();

  // 初始化数据表格
  const dataTable = new DataTable('data-table', 'table-header-row', 'table-body');
  window.dataTable = dataTable;

  // 加载中国地图 GeoJSON
  try {
    const mapResponse = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
    const mapJson = await mapResponse.json();
    echarts.registerMap('china', mapJson);
  } catch (error) {
    console.warn('中国地图加载失败，将使用备用方案:', error);
  }

  // 注册联动监听器
  engine.addListener((filteredData, filterState) => {
    const kpis = engine.calculateKPIs(filteredData);
    ChartManager.updateKPICards(kpis, previousKPIs);
    ChartManager.renderTimeTrend(engine, filteredData);
    ChartManager.renderRegionMap(engine, filteredData);
    ChartManager.renderSalesRank(engine, filteredData);
    ChartManager.renderCustomerAnalysis(engine, filteredData);
    ChartManager.renderProductAnalysis(engine, filteredData);
    ChartManager.renderIndustryChart(engine, filteredData);
    ChartManager.updateBreadcrumb(engine.getDrillPath());
    ChartManager.updateFilterSelects(filterState);
    
    // 更新数据表格
    dataTable.setData(filteredData);
  });

  // 初始渲染
  engine.notifyListeners();

  // 绑定筛选器事件
  document.getElementById('filter-year').addEventListener('change', (e) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    engine.updateFilter('year', value);
  });

  document.getElementById('filter-category').addEventListener('change', (e) => {
    const value = e.target.value || null;
    engine.updateFilter('productCategory', value);
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    engine.resetAllFilters();
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-category').value = '';
  });

  // 更新时间显示
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    document.getElementById('header-time').textContent = timeStr;
  }

  updateTime();
  setInterval(updateTime, 1000);

  // WebSocket 连接 - 实时数据更新
  try {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('✓ WebSocket 连接成功');
      updateConnectionStatus(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'sales_update') {
          console.log(`收到 ${message.data.length} 条新销售数据`);
          
          // 将新数据添加到现有数据中
          salesData = [...salesData, ...message.data];
          engine.setData(salesData);
          
          // 重新触发联动更新
          engine.notifyListeners();
          
          // 显示更新提示
          showUpdateNotification(message.data.length);
        }
      } catch (error) {
        console.error('处理 WebSocket 消息失败:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      updateConnectionStatus(false);
    };
    
    ws.onclose = () => {
      console.log('✗ WebSocket 连接关闭');
      updateConnectionStatus(false);
    };
    
    window.ws = ws;
  } catch (error) {
    console.error('WebSocket 连接失败:', error);
    updateConnectionStatus(false);
  }

  // 更新连接状态显示
  function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.textContent = connected ? '实时连接' : '连接断开';
      statusElement.className = connected ? 'status-connected' : 'status-disconnected';
    }
  }

  // 显示数据更新通知
  function showUpdateNotification(count) {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <span class="notification-icon">📊</span>
      <span class="notification-text">新增 ${count} 条销售数据</span>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  console.log('销售 BI 大屏初始化完成');
})();
