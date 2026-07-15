(function() {
﻿let fenceDetailCreated = false;
let fenceAreas = [
  { id: 'home', name: '家', type: 'circle', radius: 500, color: '#34C759', address: '朝阳区幸福小区', enabled: true,
    center: { x: 120, y: 90 }, points: [] },
  { id: 'hospital', name: '人民医院', type: 'circle', radius: 800, color: '#FF3B30', address: '海淀区中关村大街', enabled: true,
    center: { x: 260, y: 120 }, points: [] },
  { id: 'community', name: '社区服务中心', type: 'polygon', radius: 0, color: '#007AFF', address: '西城区长安街', enabled: true,
    center: { x: 180, y: 160 }, points: [
      { x: 150, y: 140 }, { x: 210, y: 140 }, { x: 220, y: 180 }, { x: 140, y: 190 }
    ] }
];
let editingArea = null;
let isDrawing = false;
let tempPoints = [];
let drawMode = 'polygon';

function createFenceDetailPage() {
  if (fenceDetailCreated) return;
  var html = '';
  html += '<div class="screen" id="fenceDetailScreen" style="background:#F2F2F7;display:none;flex-direction:column;overflow:hidden;">';
  
  // 顶部导航栏
  html += '<div style="background:rgba(255,255,255,0.92);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);padding:10px 16px;padding-top:55px;border-bottom:0.5px solid rgba(0,0,0,0.06);display:flex;align-items:center;position:relative;z-index:20;">';
  html += '<div onclick="hideFenceDetail()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#007AFF;cursor:pointer;border-radius:50%;" role="button" aria-label="返回"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>';
  html += '<span style="flex:1;text-align:center;font-size:17px;font-weight:600;color:#1D1D1F;">安全围栏</span>';
  html += '<div id="fenceMainSw" onclick="toggleFenceMain()" style="width:48px;height:28px;background:#34C759;border-radius:14px;position:relative;cursor:pointer;transition:all 0.3s ease;" role="switch" aria-checked="true" aria-label="安全围栏总开关"><div style="width:24px;height:24px;background:#fff;border-radius:50%;position:absolute;top:2px;left:22px;box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:all 0.3s ease;"></div></div>';
  html += '</div>';
  
  // 主内容区
  html += '<div style="flex:1;overflow-y:auto;padding-bottom:20px;">';
  
  // 地图区域 - 可交互绘制
  html += '<div style="margin:12px;background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
  html += '<div id="fenceMapContainer" style="height:280px;position:relative;background:linear-gradient(135deg,#E8F4FD 0%,#F0F9F0 100%);overflow:hidden;cursor:crosshair;" onclick="handleMapClick(event)">';
  
  // 地图网格背景
  html += '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(0,122,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,122,255,0.06) 1px,transparent 1px);background-size:30px 30px;pointer-events:none;"></div>';
  
  // SVG 图层 - 绘制围栏
  html += '<svg id="fenceSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" xmlns="http://www.w3.org/2000/svg">';
  // 所有围栏区域将通过 JS 动态绘制
  html += '</svg>';
  
  // 临时绘制点
  html += '<div id="tempPointsContainer" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div>';
  
  // 当前位置标记
  html += '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;">';
  html += '<div class="fence-pulse" style="width:32px;height:32px;border-radius:50%;background:rgba(0,122,255,0.3);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>';
  html += '<div style="width:12px;height:12px;border-radius:50%;background:#007AFF;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,122,255,0.4);position:relative;z-index:1;"></div></div>';
  
  // 绘制模式提示
  html += '<div id="drawHint" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;display:none;z-index:10;backdrop-filter:blur(10px);">点击地图添加顶点，双击完成绘制</div>';
  
  html += '</div>';
  
  // 地图工具栏
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#FAFAFA;border-top:0.5px solid #E5E5EA;">';
  html += '<div style="display:flex;align-items:center;gap:8px;">';
  html += '<span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8E8E93;"><i style="width:8px;height:8px;border-radius:50%;display:inline-block;background:#34C759;"></i>安全区域</span>';
  html += '<span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8E8E93;"><i style="width:8px;height:8px;border-radius:50%;display:inline-block;background:#007AFF;"></i>当前位置</span>';
  html += '</div>';
  html += '<div id="drawModeToggle" style="display:flex;gap:6px;">';
  html += '<button onclick="setDrawMode(\'polygon\')" id="btnPolygon" style="padding:5px 10px;border-radius:8px;border:none;font-size:11px;font-weight:500;cursor:pointer;background:#007AFF;color:#fff;">多边形</button>';
  html += '<button onclick="setDrawMode(\'circle\')" id="btnCircle" style="padding:5px 10px;border-radius:8px;border:none;font-size:11px;font-weight:500;cursor:pointer;background:#E5E5EA;color:#3C3C43;">圆形</button>';
  html += '</div></div></div>';
  
  // 操作按钮区
  html += '<div style="margin:0 12px 12px;display:flex;gap:8px;">';
  html += '<button onclick="startDrawFence()" id="btnAddFence" style="flex:1;height:44px;background:#007AFF;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 8px rgba(0,122,255,0.25);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>框选新区域</button>';
  html += '<button onclick="cancelDraw()" id="btnCancelDraw" style="width:44px;height:44px;background:#F2F2F7;border:none;border-radius:12px;cursor:pointer;display:none;align-items:center;justify-content:center;color:#8E8E93;" aria-label="取消绘制"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  html += '<button onclick="finishDraw()" id="btnFinishDraw" style="width:44px;height:44px;background:#34C759;border:none;border-radius:12px;cursor:pointer;display:none;align-items:center;justify-content:center;color:#fff;box-shadow:0 2px 8px rgba(52,199,89,0.3);" aria-label="完成绘制"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>';
  html += '</div>';
  
  // 围栏名称设置弹窗（绘制完成后显示）
  html += '<div id="fenceNameDialog" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:none;align-items:center;justify-content:center;z-index:100;">';
  html += '<div style="background:#fff;border-radius:16px;width:280px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);">';
  html += '<div style="padding:16px 16px 12px;text-align:center;"><div style="font-size:16px;font-weight:600;color:#1D1D1F;margin-bottom:4px;">命名安全区域</div>';
  html += '<div style="font-size:12px;color:#8E8E93;">给这个安全区域起个名字</div></div>';
  html += '<div style="padding:0 16px 16px;"><input type="text" id="fenceNameInput" placeholder="例如：公司、学校、公园" style="width:100%;height:40px;border:1px solid #E5E5EA;border-radius:10px;padding:0 12px;font-size:14px;color:#1D1D1F;outline:none;box-sizing:border-box;background:#F2F2F7;" oninput="this.style.borderColor=this.value?\'#007AFF\':\'#E5E5EA\'"></div>';
  html += '<div style="display:flex;border-top:0.5px solid #E5E5EA;"><button onclick="cancelNameDialog()" style="flex:1;height:48px;background:transparent;border:none;border-right:0.5px solid #E5E5EA;color:#8E8E93;font-size:15px;cursor:pointer;">取消</button>';
  html += '<button onclick="confirmNameDialog()" style="flex:1;height:48px;background:transparent;border:none;color:#007AFF;font-size:15px;font-weight:600;cursor:pointer;">确定</button></div></div></div>';
  
  // 安全区域列表
  html += '<div style="margin:12px;background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">安全区域</span><span id="fenceCount" style="font-size:12px;color:#8E8E93;">' + fenceAreas.length + ' 个区域</span></div>';
  html += '<div id="fenceAreaList"></div>';
  html += '</div>';
  
  // 提醒设置
  html += '<div style="margin:12px;background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">提醒设置</span></div>';
  html += '<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;cursor:pointer;" onclick="toggleReminderMethod()"><div style="flex:1;min-width:0;"><div style="font-size:15px;color:#1D1D1F;margin-bottom:2px;">越界提醒方式</div><div style="font-size:12px;color:#8E8E93;">家人离开安全区域时提醒</div></div><div id="reminderMethodLabel" style="font-size:13px;color:#8E8E93;margin-right:6px;">语音 + 推送</div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';
  html += '<div style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;" onclick="toggleBoundaryWarning(this)"><div style="flex:1;min-width:0;"><div style="font-size:15px;color:#1D1D1F;margin-bottom:2px;">接近边界预警</div><div style="font-size:12px;color:#8E8E93;">靠近围栏边界时提前提醒</div></div><div class="mini-sw active" style="width:48px;height:28px;background:#34C759;border-radius:14px;position:relative;cursor:pointer;transition:all 0.3s ease;"><div style="width:24px;height:24px;background:#fff;border-radius:50%;position:absolute;top:2px;left:22px;box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:all 0.3s ease;"></div></div></div>';
  html += '</div>';
  
  // 越界记录
  html += '<div style="margin:12px;background:#fff;border-radius:16px;overflow:hidden;border:0.5px solid #E5E5EA;box-shadow:0 1px 3px rgba(0,0,0,0.04);">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid #F2F2F7;"><span style="font-size:15px;font-weight:600;color:#1D1D1F;">越界记录</span><span style="font-size:13px;color:#007AFF;cursor:pointer;">查看全部</span></div>';
  html += '<div style="padding:30px 16px;text-align:center;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><div style="font-size:13px;color:#8E8E93;margin-top:8px;">今日暂无越界记录</div></div></div>';
  
  html += '<div style="height:30px;"></div></div></div>';
  
  var style = document.createElement('style');
  style.textContent = `
    @keyframes fencePulseAnim { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
    .fence-pulse { animation: fencePulseAnim 2s ease-out infinite; }
    .fence-vertex { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2.5px solid #007AFF; position: absolute; transform: translate(-50%, -50%); box-shadow: 0 2px 6px rgba(0,122,255,0.3); cursor: move; z-index: 5; }
    .fence-vertex.first { border-color: #FF9500; box-shadow: 0 2px 6px rgba(255,149,0,0.4); }
    .fence-vertex-line { position: absolute; height: 1.5px; background: rgba(0,122,255,0.6); transform-origin: left center; pointer-events: none; }
    .fence-area-item { transition: all 0.2s ease; }
    .fence-area-item:active { background: #F2F2F7; }
    #fenceMapContainer:active { cursor: crosshair; }
  `;
  document.head.appendChild(style);
  
  var temp = document.createElement('div');
  temp.innerHTML = html;
  var el = temp.firstElementChild;
  var myScreen = document.getElementById('myScreen');
  myScreen.parentNode.insertBefore(el, myScreen);
  fenceDetailCreated = true;
  
  setTimeout(function() {
    renderAllFences();
    renderFenceList();
  }, 50);
}

function renderAllFences() {
  var svg = document.getElementById('fenceSvg');
  if (!svg) return;
  var html = '';
  for (var i = 0; i < fenceAreas.length; i++) {
    var area = fenceAreas[i];
    if (!area.enabled) continue;
    if (area.type === 'circle') {
      html += '<circle cx="' + area.center.x + '" cy="' + area.center.y + '" r="' + (area.radius / 8) + '" fill="' + area.color + '" fill-opacity="0.15" stroke="' + area.color + '" stroke-width="1.5" stroke-opacity="0.5"/>';
      html += '<circle cx="' + area.center.x + '" cy="' + area.center.y + '" r="10" fill="' + area.color + '" opacity="0.9"/>';
      html += '<text x="' + area.center.x + '" y="' + (area.center.y + 4) + '" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">' + area.name.charAt(0) + '</text>';
    } else if (area.type === 'polygon' && area.points.length >= 3) {
      var pts = '';
      for (var j = 0; j < area.points.length; j++) {
        pts += area.points[j].x + ',' + area.points[j].y + ' ';
      }
      html += '<polygon points="' + pts.trim() + '" fill="' + area.color + '" fill-opacity="0.15" stroke="' + area.color + '" stroke-width="1.5" stroke-opacity="0.5" stroke-linejoin="round"/>';
      var cx = 0, cy = 0;
      for (var k = 0; k < area.points.length; k++) { cx += area.points[k].x; cy += area.points[k].y; }
      cx /= area.points.length; cy /= area.points.length;
      html += '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="' + area.color + '" opacity="0.9"/>';
      html += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">' + area.name.charAt(0) + '</text>';
    }
  }
  svg.innerHTML = html;
}

function renderFenceList() {
  var list = document.getElementById('fenceAreaList');
  if (!list) return;
  var html = '';
  for (var i = 0; i < fenceAreas.length; i++) {
    var a = fenceAreas[i];
    var last = i === fenceAreas.length - 1 ? '' : 'border-bottom:0.5px solid #F2F2F7;';
    var typeLabel = a.type === 'circle' ? '半径' + a.radius + '米' : '多边形 · ' + a.points.length + '个顶点';
    html += '<div class="fence-area-item" style="display:flex;align-items:center;padding:12px 16px;' + last + 'cursor:pointer;" onclick="editFenceArea(\'' + a.id + '\')">';
    html += '<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;background:' + a.color + ';">';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>';
    html += '<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:500;color:#1D1D1F;margin-bottom:2px;">' + a.name + '</div><div style="font-size:12px;color:#8E8E93;">' + a.address + ' · ' + typeLabel + '</div></div>';
    html += '<div onclick="event.stopPropagation();toggleFenceAreaEnabled(\'' + a.id + '\', this)" style="width:44px;height:28px;background:' + (a.enabled ? '#34C759' : '#E5E5EA') + ';border-radius:14px;position:relative;cursor:pointer;transition:all 0.3s ease;margin-right:4px;" role="switch" aria-checked="' + a.enabled + '">';
    html += '<div style="width:24px;height:24px;background:#fff;border-radius:50%;position:absolute;top:2px;left:' + (a.enabled ? '18px' : '2px') + ';box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:all 0.3s ease;"></div></div>';
    html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';
  }
  list.innerHTML = html;
  
  var countEl = document.getElementById('fenceCount');
  if (countEl) countEl.textContent = fenceAreas.length + ' 个区域';
}

function setDrawMode(mode) {
  drawMode = mode;
  var btnP = document.getElementById('btnPolygon');
  var btnC = document.getElementById('btnCircle');
  if (btnP && btnC) {
    if (mode === 'polygon') {
      btnP.style.background = '#007AFF'; btnP.style.color = '#fff';
      btnC.style.background = '#E5E5EA'; btnC.style.color = '#3C3C43';
    } else {
      btnC.style.background = '#007AFF'; btnC.style.color = '#fff';
      btnP.style.background = '#E5E5EA'; btnP.style.color = '#3C3C43';
    }
  }
}

function startDrawFence() {
  isDrawing = true;
  tempPoints = [];
  var hint = document.getElementById('drawHint');
  var btnAdd = document.getElementById('btnAddFence');
  var btnCancel = document.getElementById('btnCancelDraw');
  var btnFinish = document.getElementById('btnFinishDraw');
  var toggle = document.getElementById('drawModeToggle');
  if (hint) {
    hint.style.display = 'block';
    hint.textContent = drawMode === 'polygon' ? '点击地图添加顶点，3个点以上可完成' : '点击地图设置圆心';
  }
  if (btnAdd) btnAdd.style.display = 'none';
  if (btnCancel) btnCancel.style.display = 'flex';
  if (btnFinish) btnFinish.style.display = 'flex';
  if (toggle) toggle.style.display = 'flex';
  clearTempPoints();
  speak('开始框选安全区域，点击地图添加顶点');
  triggerHaptic('light');
}

function cancelDraw() {
  isDrawing = false;
  tempPoints = [];
  clearTempPoints();
  var hint = document.getElementById('drawHint');
  var btnAdd = document.getElementById('btnAddFence');
  var btnCancel = document.getElementById('btnCancelDraw');
  var btnFinish = document.getElementById('btnFinishDraw');
  if (hint) hint.style.display = 'none';
  if (btnAdd) btnAdd.style.display = 'flex';
  if (btnCancel) btnCancel.style.display = 'none';
  if (btnFinish) btnFinish.style.display = 'none';
  speak('已取消绘制');
  triggerHaptic('light');
}

function finishDraw() {
  if (drawMode === 'polygon' && tempPoints.length < 3) {
    speak('至少需要3个顶点才能完成多边形围栏');
    showFeedback('至少需要3个顶点', 'warning');
    return;
  }
  if (drawMode === 'circle' && tempPoints.length < 1) {
    speak('请先点击地图设置圆心');
    showFeedback('请先设置圆心', 'warning');
    return;
  }
  isDrawing = false;
  var dialog = document.getElementById('fenceNameDialog');
  if (dialog) {
    dialog.style.display = 'flex';
    var input = document.getElementById('fenceNameInput');
    if (input) { input.value = ''; setTimeout(function() { input.focus(); }, 100); }
  }
  var hint = document.getElementById('drawHint');
  if (hint) hint.style.display = 'none';
  speak('绘制完成，请输入区域名称');
  triggerHaptic('medium');
}

function cancelNameDialog() {
  var dialog = document.getElementById('fenceNameDialog');
  if (dialog) dialog.style.display = 'none';
  cancelDraw();
}

function confirmNameDialog() {
  var input = document.getElementById('fenceNameInput');
  var name = input ? input.value.trim() : '';
  if (!name) {
    showFeedback('请输入区域名称', 'warning');
    return;
  }
  var dialog = document.getElementById('fenceNameDialog');
  if (dialog) dialog.style.display = 'none';
  
  var colors = ['#34C759', '#007AFF', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#30B0C7', '#FFCC00'];
  var colorIdx = fenceAreas.length % colors.length;
  
  var newArea = {
    id: 'fence_' + Date.now(),
    name: name,
    type: drawMode,
    radius: drawMode === 'circle' ? 500 : 0,
    color: colors[colorIdx],
    address: '自定义区域',
    enabled: true,
    center: drawMode === 'circle' ? { x: tempPoints[0].x, y: tempPoints[0].y } : null,
    points: drawMode === 'polygon' ? tempPoints.slice() : []
  };
  fenceAreas.push(newArea);
  renderAllFences();
  renderFenceList();
  clearTempPoints();
  
  var btnAdd = document.getElementById('btnAddFence');
  var btnCancel = document.getElementById('btnCancelDraw');
  var btnFinish = document.getElementById('btnFinishDraw');
  if (btnAdd) btnAdd.style.display = 'flex';
  if (btnCancel) btnCancel.style.display = 'none';
  if (btnFinish) btnFinish.style.display = 'none';
  
  speak('已添加安全区域：' + name);
  triggerHaptic('success');
  showFeedback('已添加 ' + name, 'success');
}

function clearTempPoints() {
  var container = document.getElementById('tempPointsContainer');
  if (container) container.innerHTML = '';
}

function handleMapClick(event) {
  if (!isDrawing) return;
  var map = document.getElementById('fenceMapContainer');
  if (!map) return;
  var rect = map.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  
  if (drawMode === 'circle') {
    tempPoints = [{ x: x, y: y }];
    drawTempCircle(x, y, 60);
  } else {
    tempPoints.push({ x: x, y: y });
    drawTempPoints();
  }
  triggerHaptic('light');
}

function drawTempCircle(cx, cy, r) {
  var container = document.getElementById('tempPointsContainer');
  if (!container) return;
  container.innerHTML = '';
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;');
  var circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', cy);
  circle.setAttribute('r', r);
  circle.setAttribute('fill', '#007AFF');
  circle.setAttribute('fill-opacity', '0.15');
  circle.setAttribute('stroke', '#007AFF');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('stroke-dasharray', '6,4');
  svg.appendChild(circle);
  var center = document.createElementNS(svgNS, 'circle');
  center.setAttribute('cx', cx);
  center.setAttribute('cy', cy);
  center.setAttribute('r', '7');
  center.setAttribute('fill', '#007AFF');
  center.setAttribute('stroke', '#fff');
  center.setAttribute('stroke-width', '2.5');
  svg.appendChild(center);
  container.appendChild(svg);
}

function drawTempPoints() {
  var container = document.getElementById('tempPointsContainer');
  if (!container || tempPoints.length === 0) return;
  container.innerHTML = '';
  
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;');
  
  if (tempPoints.length >= 2) {
    var line = document.createElementNS(svgNS, 'polyline');
    var pts = '';
    for (var i = 0; i < tempPoints.length; i++) {
      pts += tempPoints[i].x + ',' + tempPoints[i].y + ' ';
    }
    line.setAttribute('points', pts.trim());
    line.setAttribute('fill', tempPoints.length >= 3 ? 'rgba(0,122,255,0.15)' : 'none');
    line.setAttribute('stroke', '#007AFF');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);
  }
  
  for (var j = 0; j < tempPoints.length; j++) {
    var pt = tempPoints[j];
    var dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', pt.x);
    dot.setAttribute('cy', pt.y);
    dot.setAttribute('r', '7');
    dot.setAttribute('fill', '#fff');
    dot.setAttribute('stroke', j === 0 ? '#FF9500' : '#007AFF');
    dot.setAttribute('stroke-width', '2.5');
    svg.appendChild(dot);
  }
  
  container.appendChild(svg);
}

function toggleFenceAreaEnabled(id, el) {
  var area = null;
  for (var i = 0; i < fenceAreas.length; i++) {
    if (fenceAreas[i].id === id) { area = fenceAreas[i]; break; }
  }
  if (!area) return;
  area.enabled = !area.enabled;
  var thumb = el.querySelector('div');
  if (area.enabled) {
    el.style.background = '#34C759';
    thumb.style.left = '18px';
    speak(area.name + '围栏已启用');
  } else {
    el.style.background = '#E5E5EA';
    thumb.style.left = '2px';
    speak(area.name + '围栏已关闭');
  }
  el.setAttribute('aria-checked', area.enabled);
  renderAllFences();
  triggerHaptic('light');
}

function editFenceArea(id) {
  var area = null;
  for (var i = 0; i < fenceAreas.length; i++) {
    if (fenceAreas[i].id === id) { area = fenceAreas[i]; break; }
  }
  if (!area) return;
  speak('编辑' + area.name + '围栏设置');
  triggerHaptic('light');
  
  var action = confirm(area.name + '\n\n选择操作：\n确定 = 删除此区域\n取消 = 仅查看');
  if (action) {
    if (confirm('确定要删除「' + area.name + '」安全区域吗？')) {
      for (var j = 0; j < fenceAreas.length; j++) {
        if (fenceAreas[j].id === id) {
          fenceAreas.splice(j, 1);
          break;
        }
      }
      renderAllFences();
      renderFenceList();
      speak('已删除' + area.name + '围栏');
      showFeedback('已删除 ' + area.name, 'info');
    }
  }
}

function toggleFenceMain() {
  var sw = document.getElementById('fenceMainSw');
  sw.classList.toggle('active');
  var thumb = sw.querySelector('div');
  var isActive = sw.classList.contains('active');
  if (isActive) {
    sw.style.background = '#34C759'; thumb.style.left = '22px';
    sw.setAttribute('aria-checked', 'true');
    speak('安全围栏已开启');
  } else {
    sw.style.background = '#E5E5EA'; thumb.style.left = '2px';
    sw.setAttribute('aria-checked', 'false');
    speak('安全围栏已关闭');
  }
  triggerHaptic('light');
}

function toggleBoundaryWarning(el) {
  var sw = el.querySelector('.mini-sw');
  if (!sw) return;
  sw.classList.toggle('active');
  var thumb = sw.querySelector('div');
  if (sw.classList.contains('active')) {
    sw.style.background = '#34C759'; thumb.style.left = '22px';
    speak('接近边界预警已开启');
  } else {
    sw.style.background = '#E5E5EA'; thumb.style.left = '2px';
    speak('接近边界预警已关闭');
  }
  triggerHaptic('light');
}

function toggleReminderMethod() {
  var label = document.getElementById('reminderMethodLabel');
  if (!label) return;
  var current = label.textContent;
  if (current === '语音 + 推送') {
    label.textContent = '仅语音';
    speak('越界提醒方式：仅语音');
  } else if (current === '仅语音') {
    label.textContent = '仅推送';
    speak('越界提醒方式：仅推送');
  } else {
    label.textContent = '语音 + 推送';
    speak('越界提醒方式：语音加推送');
  }
  triggerHaptic('light');
}

function showFenceDetail() {
  createFenceDetailPage();
  var f = document.getElementById('fenceDetailScreen');
  if (f) { f.style.display = 'flex'; f.classList.add('active'); }
  speak('安全围栏，您可以手动框选安全区域');
  triggerHaptic('light');
}

function hideFenceDetail() {
  var f = document.getElementById('fenceDetailScreen');
  if (f) { f.style.display = 'none'; f.classList.remove('active'); }
  triggerHaptic('light');
}

function showFeedback(text, type) {
  var fb = document.getElementById('gestureFeedback');
  if (!fb) return;
  fb.textContent = text;
  fb.classList.add('show');
  setTimeout(function() { fb.classList.remove('show'); }, 1500);
}

function triggerHaptic(type) {
  if (navigator.vibrate) {
    if (type === 'light') navigator.vibrate(10);
    else if (type === 'medium') navigator.vibrate(30);
    else if (type === 'success') navigator.vibrate([10, 30, 10]);
  }
}

function speak(text) {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e) {}
  }
}


  window.showFenceDetail = showFenceDetail;
  window.hideFenceDetail = hideFenceDetail;
  window.setDrawMode = setDrawMode;
  window.startDrawFence = startDrawFence;
  window.cancelDraw = cancelDraw;
  window.finishDraw = finishDraw;
  window.handleMapClick = handleMapClick;
  window.cancelNameDialog = cancelNameDialog;
  window.confirmNameDialog = confirmNameDialog;
  window.toggleFenceAreaEnabled = toggleFenceAreaEnabled;
  window.editFenceArea = editFenceArea;
  window.toggleFenceMain = toggleFenceMain;
  window.toggleBoundaryWarning = toggleBoundaryWarning;
  window.toggleReminderMethod = toggleReminderMethod;
})();