/* ================================================================
   守护卡片控制面板 · 应用逻辑
   - Tab 切换
   - 高德地图懒加载（首次切到位置 Tab 时初始化）
   - 按钮交互
   ================================================================ */

(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  // 模拟坐标（北京某居民区附近）
  var HOME_LNG  = 116.4550;
  var HOME_LAT  = 39.9200;
  var PARK_LNG  = 116.4700;
  var PARK_LAT  = 39.9250;
  var FENCE_RADIUS = 100; // 电子围栏半径（米）

  /* ---------- 状态 ---------- */
  var mapInstance  = null;
  var mapInited    = false;
  var currentTab   = 'guard';

  /* ---------- DOM ---------- */
  var dockItems    = document.querySelectorAll('.dock-item');
  var tabContents  = document.querySelectorAll('.tab-content');
  var mapLoading   = document.getElementById('map-loading');
  var toastEl      = document.getElementById('toast');
  var toastTimer   = null;

  /* ================================================================
     Tab 切换
     ================================================================ */
  function switchTab(tabName) {
    if (tabName === currentTab) return;
    currentTab = tabName;

    // 更新 Tab 内容显示
    tabContents.forEach(function (tab) {
      tab.classList.remove('active');
    });
    var target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');

    // 更新 Dock 高亮
    dockItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 地图懒加载
    if (tabName === 'location') {
      // 延迟一帧确保容器已渲染
      setTimeout(function () {
        if (!mapInited) {
          initMap();
        } else if (mapInstance) {
          // 已初始化，刷新地图尺寸并回到中心
          mapInstance.setCenter([HOME_LNG, HOME_LAT]);
          mapInstance.setZoom(15);
        }
      }, 100);
    }
  }

  dockItems.forEach(function (item) {
    item.addEventListener('click', function () {
      switchTab(item.dataset.tab);
    });
  });

  /* ================================================================
     高德地图初始化
     ================================================================ */
  function initMap() {
    // 等待 AMap 脚本就绪
    if (typeof AMap === 'undefined') {
      setTimeout(initMap, 300);
      return;
    }

    mapInstance = new AMap.Map('map-container', {
      zoom: 15,
      center: [HOME_LNG, HOME_LAT],
      mapStyle: 'amap://styles/whitesmoke',  // 淡色风格搭配玻璃 UI
      resizeEnable: true,
      viewMode: '2D'
    });

    // 地图加载完成回调
    mapInstance.on('complete', function () {
      if (mapLoading) mapLoading.classList.add('hidden');
      mapInited = true;
    });

    // 超时兜底（5s 后仍无 complete 则隐藏 loading）
    setTimeout(function () {
      if (mapLoading) mapLoading.classList.add('hidden');
      mapInited = true;
    }, 5000);

    /* ---- 电子围栏（安全区域圆形） ---- */
    var fenceCircle = new AMap.Circle({
      center: [HOME_LNG, HOME_LAT],
      radius: FENCE_RADIUS,
      fillOpacity: 0.12,
      fillColor: '#34c759',
      strokeColor: '#34c759',
      strokeWeight: 2,
      strokeOpacity: 0.7,
      strokeStyle: 'dashed'
    });
    mapInstance.add(fenceCircle);

    /* ---- 家标记 ---- */
    var homeMarker = new AMap.Marker({
      position: [HOME_LNG, HOME_LAT],
      content: markerHtml('🏠', '#34c759'),
      offset: new AMap.Pixel(-22, -22),
      title: '家'
    });
    mapInstance.add(homeMarker);

    // 家的信息窗
    var homeInfo = new AMap.InfoWindow({
      content: infoHtml('家', '📍 当前位置', '#34c759'),
      offset: new AMap.Pixel(0, -36)
    });
    homeMarker.on('click', function () {
      homeInfo.open(mapInstance, [HOME_LNG, HOME_LAT]);
    });

    /* ---- 公园标记 ---- */
    var parkMarker = new AMap.Marker({
      position: [PARK_LNG, PARK_LAT],
      content: markerHtml('🌳', '#ff9500'),
      offset: new AMap.Pixel(-22, -22),
      title: '公园'
    });
    mapInstance.add(parkMarker);

    var parkInfo = new AMap.InfoWindow({
      content: infoHtml('公园', '10:10 到达', '#ff9500'),
      offset: new AMap.Pixel(0, -36)
    });
    parkMarker.on('click', function () {
      parkInfo.open(mapInstance, [PARK_LNG, PARK_LAT]);
    });

    /* ---- 出门标记 ---- */
    var outMarker = new AMap.Marker({
      position: [HOME_LNG + 0.002, HOME_LAT + 0.001],
      content: markerHtml('🚶', '#007aff', true),
      offset: new AMap.Pixel(-18, -18),
      title: '出门'
    });
    mapInstance.add(outMarker);

    // 自动打开家的信息窗
    homeInfo.open(mapInstance, [HOME_LNG, HOME_LAT]);

    // 调整视野包含所有标记和围栏
    mapInstance.setFitView([fenceCircle], false, [60, 60, 60, 60]);
    // 但保持以家为中心
    mapInstance.setCenter([HOME_LNG, HOME_LAT]);
  }

  /* ---- 生成自定义标记 HTML ---- */
  function markerHtml(emoji, color, small) {
    var size = small ? 36 : 44;
    return '<div style="'
      + 'width:' + size + 'px;height:' + size + 'px;'
      + 'background:' + color + ';'
      + 'border-radius:50%;'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'font-size:' + (small ? 18 : 22) + 'px;'
      + 'border:3px solid #fff;'
      + 'box-shadow:0 2px 8px rgba(0,0,0,0.25);'
      + '">'
      + emoji
      + '</div>';
  }

  /* ---- 生成信息窗 HTML ---- */
  function infoHtml(title, subtitle, color) {
    return '<div style="padding:6px 4px;min-width:100px;text-align:center;">'
      + '<div style="font-size:16px;font-weight:700;color:' + color + ';">' + title + '</div>'
      + '<div style="font-size:12px;color:#999;margin-top:2px;">' + subtitle + '</div>'
      + '</div>';
  }

  /* ================================================================
     按钮交互
     ================================================================ */

  // 定位 — 切换到位置 Tab
  var btnLocate = document.getElementById('btn-locate');
  if (btnLocate) {
    btnLocate.addEventListener('click', function () {
      switchTab('location');
    });
  }

  // 呼叫
  var btnCall = document.getElementById('btn-call');
  if (btnCall) {
    btnCall.addEventListener('click', function () {
      showToast('📞 正在呼叫爷爷…', 'call');
    });
  }

  // SOS 测试
  var btnSos = document.getElementById('btn-sos');
  if (btnSos) {
    btnSos.addEventListener('click', function () {
      showToast('🆘 SOS 测试信号已发送！紧急联系人将收到通知', 'sos');
    });
  }

  /* ================================================================
     设置项点击交互 — 打开子页面
     ================================================================ */
  var settingsItems = document.querySelectorAll('.tab-content .settings-item[data-id]');

  settingsItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var id = item.dataset.id;
      openSubpage(id);
    });
  });

  // 用户卡片点击 — 打开账号设置子页面
  var profileCard = document.querySelector('.settings-profile-card');
  if (profileCard) {
    profileCard.addEventListener('click', function () {
      openSubpage('help');
    });
  }

  /* ---------- 子页面系统 ---------- */
  var subpages = document.querySelectorAll('.subpage');
  var backButtons = document.querySelectorAll('[data-back]');

  function openSubpage(id) {
    var target = document.getElementById('subpage-' + id);
    if (target) {
      target.classList.add('active');
      // 滚动到顶部
      target.scrollTop = 0;
    }
  }

  function closeSubpage() {
    subpages.forEach(function (sp) {
      sp.classList.remove('active');
    });
  }

  backButtons.forEach(function (btn) {
    btn.addEventListener('click', closeSubpage);
  });

  // 子页面内的设置项也可点击
  var subSettingsItems = document.querySelectorAll('.subpage .settings-item');
  subSettingsItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var text = item.querySelector('.settings-item-text');
      if (text) {
        showToast(text.textContent + ' · 开发中');
      }
    });
  });

  /* ---------- Toggle 开关交互 ---------- */
  document.querySelectorAll('.toggle-switch').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
    });
  });

  /* ---------- 设备操作按钮交互 ---------- */
  var deviceActions = document.querySelectorAll('.device-btn[data-action]');
  var actionMessages = {
    'reconnect': '🔄 正在重新连接设备…',
    'reboot':    '🔁 正在重启设备…',
    'firmware':  '⬆️ 正在检查固件更新…',
    'unbind':    '📵 确认要解绑设备吗？',
    'export':    '📥 正在导出数据…',
    'delete':    '🗑️ 确认要删除所有数据吗？此操作不可逆'
  };

  deviceActions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.action;
      var msg = actionMessages[action] || '操作执行中…';
      var type = (action === 'unbind' || action === 'delete') ? 'sos' : '';
      showToast(msg, type);
    });
  });

  // 添加联系人按钮
  var addContactBtn = document.querySelector('.btn-add-contact');
  if (addContactBtn) {
    addContactBtn.addEventListener('click', function () {
      showToast('添加家庭成员 · 开发中');
    });
  }

  // 添加用药提醒按钮
  var medAddBtn = document.querySelector('.med-add-btn');
  if (medAddBtn) {
    medAddBtn.addEventListener('click', function () {
      showToast('添加用药提醒 · 开发中');
    });
  }

  /* ================================================================
     Toast 通知
     ================================================================ */
  function showToast(message, type) {
    if (!toastEl) return;

    // 清除上一个定时器
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastEl.textContent = message;
    toastEl.className = 'toast show';

    if (type === 'sos') {
      toastEl.classList.add('toast-sos');
    }

    // 自动消失
    var duration = type === 'sos' ? 4000 : 2500;
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
      // 延迟移除 class 以等动画结束
      setTimeout(function () {
        toastEl.className = 'toast';
      }, 400);
    }, duration);
  }

  /* ================================================================
     键盘快捷键（PC 端体验）
     ================================================================ */
  var tabKeys = { '1': 'guard', '2': 'location', '3': 'health', '4': 'more' };
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var tab = tabKeys[e.key];
    if (tab) {
      e.preventDefault();
      switchTab(tab);
    }
  });

})();
