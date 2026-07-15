/* === 轻作智排 — 主逻辑 v5.6 === */
/* v5.6: 重命名LitePlanner + 字号增大 + 复制粘贴 + 页面布局模式 + 点坐标编辑 */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PX_PER_MM = 72 / 25.4;
  var PRESETS = {
    'A4-h':{w:297,h:210}, 'A4-v':{w:210,h:297},
    'A3-h':{w:420,h:297}, 'A3-v':{w:297,h:420},
    'A2-h':{w:594,h:420}, 'A2-v':{w:420,h:594},
    'A1-h':{w:841,h:594}, 'A1-v':{w:594,h:841},
    '2440x1220':{w:2440,h:1220}, '1220x610':{w:1220,h:610},
    '1830x915':{w:1830,h:915}, '1525x1525':{w:1525,h:1525},
    '600x400':{w:600,h:400}, '1200x800':{w:1200,h:800}
  };
  var COLORS = ['#6B9E3F','#4A7A2A','#D4A017','#3A7BD5','#9B59B6','#E67E22','#1ABC9C','#E74C3C'];
  var UNIT_FACTORS = { mm:1, cm:10, m:1000 }; // 内部统一mm，显示时转换
  var $ = function(s){ return document.querySelector(s); };
  function svgEl(t,a){ var e=document.createElementNS(SVG_NS,t); if(a)for(var k in a)e.setAttribute(k,a[k]); return e; }

  // ───── 全局状态 ─────
  var unit = 'cm'; // 当前显示单位（默认厘米）

  var nest = {
    sheetW:297, sheetH:210, zoom:1, panX:0, panY:0,
    parts:[], instances:[], selId:null, nextPartId:1, nextInstId:1,
    mouseMM:{x:0,y:0},
    dragging:false, dragType:null, dragInstId:null, dragStart:null,
    nesting:false,
    pages:[], currentPage:0, // 多页支持
    pageLayout:'single', // 'single'|'horizontal'|'vertical'
    pageGap:20, // 多页模式时间距(mm)
    clipboard:null, // 复制粘贴剪贴板
  };
  var draw = {
    open:false, tool:'line', // 'line'=画线, 'edit'=选择编辑, 'select'=选区
    lines:[], // 线段数组 {x1,y1,x2,y2}
    activeStart:null, // 当前正在画的线的起点
    mouseMM:{x:0,y:0},
    zoom:1, panX:0, panY:0,
    canvasW:50, canvasH:50,
    dragging:false, dragLineIdx:null, dragEnd:null, // 拖拽线段端点 ('1'/'2'/'body')
    dragStartMM:null, dragInitLine:null, // 拖拽线段整体时的初始状态
    selectedLine:null, // 选中的线段索引（编辑模式）
    selectedEnd:null, // 选中的端点编号 '1'|'2'（编辑模式）
    selectedRegions:[], // 选中的区域多边形顶点数组（支持多选）
    snapToGrid:false, gridStep:1,
    snapToEndpoint:true, // 端点吸附开关
    snapRadius:3, // 吸附半径(mm)
    history:[], // 撤销历史栈
    historyIdx:-1, // 当前历史位置（-1表示在最新状态）
    hoverEp:null, // 鼠标悬停的端点 {lidx, end}（画线模式下高亮显示）
  };

  // ───── 单位转换 ─────
  function toDisplay(mm) { return mm / UNIT_FACTORS[unit]; }
  function fromDisplay(val) { return val * UNIT_FACTORS[unit]; }
  function fmtVal(mm, decimals) {
    var d = decimals===undefined ? 1 : decimals;
    return toDisplay(mm).toFixed(d);
  }
  function unitSuffix() { return unit; }
  function updateAllUnitLabels() {
    var labels = document.querySelectorAll('.unit, .size-unit');
    labels.forEach(function(l){ l.textContent = unit; });
    // 更新输入框中的值
    $('#sheet-width').value = toDisplay(nest.sheetW).toFixed(1);
    $('#sheet-height').value = toDisplay(nest.sheetH).toFixed(1);
    $('#nest-spacing').value = toDisplay(2).toFixed(1);
    // 更新属性面板
    if (nest.selId) {
      var inst = getInst(nest.selId);
      if (inst) {
        $('#prop-x').value = fmtVal(inst.tx);
        $('#prop-y').value = fmtVal(inst.ty);
      }
    }
    // 更新绘图弹窗尺寸显示
    $('#draw-canvas-w').value = toDisplay(draw.canvasW).toFixed(1);
    $('#draw-canvas-h').value = toDisplay(draw.canvasH).toFixed(1);
    // 更新绘图参数面板单位
    var dpU1 = $('#dp-unit-1'); if (dpU1) dpU1.textContent = unit;
  }

  // ───── 几何工具 ─────
  function rotPt(x,y,deg){ var r=deg*Math.PI/180,c=Math.cos(r),s=Math.sin(r); return {x:x*c-y*s, y:x*s+y*c}; }
  function polyArea(v){ var a=0,n=v.length; for(var i=0;i<n;i++){var j=(i+1)%n; a+=v[i].x*v[j].y-v[j].x*v[i].y;} return Math.abs(a)/2; }
  function bbox(v){ var mx=1e9,my=1e9,Mx=-1e9,My=-1e9; v.forEach(function(p){ if(p.x<mx)mx=p.x; if(p.y<my)my=p.y; if(p.x>Mx)Mx=p.x; if(p.y>My)My=p.y; }); return {minX:mx,minY:my,maxX:Mx,maxY:My}; }
  function ptInPoly(pt,poly){ var x=pt.x,y=pt.y,inside=false,n=poly.length; for(var i=0,j=n-1;i<n;j=i++){ var xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y; if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside; } return inside; }
  function dist(a,b){ return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2); }
  function angleBetween(a,b,c){ // 角度 at b, between a-b-c
    var v1={x:a.x-b.x,y:a.y-b.y}, v2={x:c.x-b.x,y:c.y-b.y};
    var dot=v1.x*v2.x+v1.y*v2.y, mag=Math.sqrt(v1.x**2+v1.y**2)*Math.sqrt(v2.x**2+v2.y**2);
    if(mag===0) return 0;
    var ang=Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI;
    return ang;
  }

  // ───── DOM ─────
  var nestSVG = $('#nest-svg');
  var nestContainer = $('#canvas-container');
  var dotGrid = $('#dot-grid');
  var dotCtx = dotGrid.getContext('2d');
  var drawSVG = $('#draw-svg');
  var drawWrap = $('.modal-canvas-wrap');
  var drawDotGrid = $('#draw-dot-grid');
  var drawDotCtx = drawDotGrid.getContext('2d');

  // ===========================
  //  点状网格
  // ===========================
  function drawDotGridCanvas(canvas, ctx, zoom, panX, panY) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    ctx.clearRect(0,0,w,h);
    var gridMM = 10;
    if (zoom < 0.3) gridMM = 50; else if (zoom < 0.7) gridMM = 20; else if (zoom > 4) gridMM = 5;
    var step = gridMM * zoom;
    var sx = panX % step, sy = panY % step;
    ctx.fillStyle = '#C8C0B0';
    var dotR = zoom > 1.5 ? 1.5 : 1.0;
    for (var x=sx; x<w; x+=step) {
      for (var y=sy; y<h; y+=step) {
        ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // ===========================
  //  排布画布
  // ===========================
  function getPageOffset(pageIdx) {
    if (nest.pageLayout === 'horizontal') {
      return { dx: pageIdx * (nest.sheetW + nest.pageGap), dy: 0 };
    } else if (nest.pageLayout === 'vertical') {
      return { dx: 0, dy: pageIdx * (nest.sheetH + nest.pageGap) };
    }
    return { dx: 0, dy: 0 };
  }
  function getTotalContentSize() {
    var numPages = Math.max(1, nest.pages.length);
    if (nest.pageLayout === 'horizontal') {
      return { w: numPages * nest.sheetW + (numPages - 1) * nest.pageGap, h: nest.sheetH };
    } else if (nest.pageLayout === 'vertical') {
      return { w: nest.sheetW, h: numPages * nest.sheetH + (numPages - 1) * nest.pageGap };
    }
    return { w: nest.sheetW, h: nest.sheetH };
  }
  function nestFit() {
    var cw = nestContainer.clientWidth, ch = nestContainer.clientHeight;
    var content = getTotalContentSize();
    var sx = cw / content.w, sy = ch / content.h;
    nest.zoom = Math.min(sx, sy) * 0.85;
    nest.panX = (cw - content.w * nest.zoom) / 2;
    nest.panY = (ch - content.h * nest.zoom) / 2;
    nestRender();
  }
  function nestScreenToMM(sx, sy) { return { x:(sx-nest.panX)/nest.zoom, y:(sy-nest.panY)/nest.zoom }; }
  function detectPage(worldMM) {
    if (nest.pageLayout === 'single' || nest.pages.length <= 1) return 0;
    var numPages = nest.pages.length;
    if (nest.pageLayout === 'horizontal') {
      var pIdx = Math.floor(worldMM.x / (nest.sheetW + nest.pageGap));
      return Math.max(0, Math.min(numPages - 1, pIdx));
    } else if (nest.pageLayout === 'vertical') {
      var pIdxV = Math.floor(worldMM.y / (nest.sheetH + nest.pageGap));
      return Math.max(0, Math.min(numPages - 1, pIdxV));
    }
    return 0;
  }
  function worldToLocal(worldMM, pageIdx) {
    var off = getPageOffset(pageIdx);
    return { x: worldMM.x - off.dx, y: worldMM.y - off.dy };
  }

  function nestRender() {
    drawDotGridCanvas(dotGrid, dotCtx, nest.zoom, nest.panX, nest.panY);
    nestSVG.innerHTML = '';
    var g = svgEl('g', { transform: 'translate('+nest.panX+','+nest.panY+') scale('+nest.zoom+')' });
    nestSVG.appendChild(g);
    var multiPage = nest.pageLayout !== 'single' && nest.pages.length > 1;
    // 单页模式：显示当前页；多页模式：显示全部页
    var startPage = multiPage ? 0 : nest.currentPage;
    var pagesToShow = multiPage ? nest.pages.length : 1;

    for (var pgIdx = 0; pgIdx < pagesToShow; pgIdx++) {
      var pg = startPage + pgIdx;
      var off = multiPage ? getPageOffset(pg) : {dx:0, dy:0};
      var isActive = !multiPage || pg === nest.currentPage;
      // 板材矩形
      g.appendChild(svgEl('rect', { x:off.dx, y:off.dy, width:nest.sheetW, height:nest.sheetH, class: isActive ? 'sheet-rect' : 'sheet-rect-inactive' }));
      // 页码标注
      var pLabel = svgEl('text', { x:(off.dx+nest.sheetW-2).toFixed(2), y:(off.dy+nest.sheetH-1).toFixed(2), 'font-size':3, 'text-anchor':'end', fill: isActive?'#ccc':'#ddd', 'pointer-events':'none' });
      pLabel.textContent = '第 '+(pg+1)+' 页 / '+(nest.pages.length||1)+' 页';
      g.appendChild(pLabel);
      // 渲染该页实例
      var pageInsts = nest.instances.filter(function(i){ return i.page === pg; });
      pageInsts.forEach(function(inst) {
        var part = getPart(inst.partId); if (!part) return;
        var s = inst.scale||1;
        var cls = 'inst-poly' + (inst.nested?' nested':'') + (nest.selId===inst.id?' selected':'');
        var fillClr = inst.nested?'rgba(212,160,23,.10)':'rgba('+hexToRgb(part.color)+',.10)';
        var strokeClr = inst.nested?'#D4A017':part.color;
        if (part.holes && part.holes.length > 0) {
          // 带孔洞零件：使用 path + fill-rule:evenodd
          var d = 'M' + part.vertices.map(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); return (r.x+inst.tx+off.dx).toFixed(2)+','+(r.y+inst.ty+off.dy).toFixed(2); }).join('L') + 'Z';
          part.holes.forEach(function(hole) {
            d += 'M' + hole.map(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); return (r.x+inst.tx+off.dx).toFixed(2)+','+(r.y+inst.ty+off.dy).toFixed(2); }).join('L') + 'Z';
          });
          var pathEl = svgEl('path', { d:d, class:cls, 'data-iid':inst.id, 'data-page':pg, fill:fillClr, stroke:strokeClr, 'fill-rule':'evenodd' });
          g.appendChild(pathEl);
        } else {
          var pts = part.vertices.map(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); return (r.x+inst.tx+off.dx).toFixed(2)+','+(r.y+inst.ty+off.dy).toFixed(2); }).join(' ');
          var polyEl = svgEl('polygon', { points:pts, class:cls, 'data-iid':inst.id, 'data-page':pg, fill:fillClr, stroke:strokeClr });
          g.appendChild(polyEl);
        }
      });
    }

    if (nest.selId) {
      var si = getInst(nest.selId); var sp = si?getPart(si.partId):null;
      if (si && sp) {
        var selOff = multiPage ? getPageOffset(si.page||0) : {dx:0, dy:0};
        var bb = getInstBBox(sp, si);
        var cx = ((bb.minX+bb.maxX)/2 + selOff.dx).toFixed(2), hy = (bb.minY-12 + selOff.dy).toFixed(2);
        g.appendChild(svgEl('line', { x1:cx, y1:(bb.minY-2 + selOff.dy).toFixed(2), x2:cx, y2:hy, class:'rot-line' }));
        g.appendChild(svgEl('circle', { cx:cx, cy:hy, class:'rot-circle', 'data-action':'rotate', 'data-iid':si.id }));
      }
    }
    updateStatusBar();
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return r+','+g+','+b;
  }
  function getInstBBox(part, inst) {
    var s = inst.scale||1;
    var mx=1e9,my=1e9,Mx=-1e9,My=-1e9;
    part.vertices.forEach(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); var px=r.x+inst.tx,py=r.y+inst.ty; if(px<mx)mx=px; if(py<my)my=py; if(px>Mx)Mx=px; if(py>My)My=py; });
    return {minX:mx,minY:my,maxX:Mx,maxY:My};
  }
  function updateStatusBar() {
    $('#st-coords').textContent = 'X: '+fmtVal(nest.mouseMM.x)+'  Y: '+fmtVal(nest.mouseMM.y)+' '+unitSuffix();
    $('#st-zoom').textContent = '缩放: '+(nest.zoom*100).toFixed(0)+'%';
    var multiPage = nest.pageLayout !== 'single' && nest.pages.length > 1;
    if (multiPage) {
      var total = nest.instances.length;
      $('#st-count').textContent = '零件: '+total+' (共'+nest.pages.length+'页)';
    } else {
      var pageInsts = nest.instances.filter(function(i){ return i.page === nest.currentPage; });
      $('#st-count').textContent = '零件: '+pageInsts.length + (nest.pages.length>1?' (第'+(nest.currentPage+1)+'页)':'');
    }
    updatePageInfo();
  }
  function updatePageInfo() {
    var total = Math.max(1, nest.pages.length);
    $('#page-info').textContent = '第 '+(nest.currentPage+1)+' / '+total+' 页';
  }

  // ───── 数据操作 ─────
  function getPart(id) { return nest.parts.find(function(p){return p.id===id;}); }
  function getInst(id) { return nest.instances.find(function(i){return i.id===id;}); }
  function getInsts(partId) { return nest.instances.filter(function(i){return i.partId===partId;}); }

  function addPart(vertices, name, holes) {
    var id = nest.nextPartId++;
    var bb = bbox(vertices);
    var norm = vertices.map(function(v){ return {x:v.x-bb.minX, y:v.y-bb.minY}; });
    var normHoles = (holes||[]).map(function(h){ return h.map(function(v){ return {x:v.x-bb.minX, y:v.y-bb.minY}; }); });
    var part = { id:id, name:name||('零件 '+id), vertices:norm, holes:normHoles, color:COLORS[(id-1)%COLORS.length], qty:1 };
    nest.parts.push(part);
    updatePartsList();
    return part;
  }
  function addInstToCanvas(partId, tx, ty, rot, page) {
    var id = nest.nextInstId++;
    var inst = { id:id, partId:partId, tx:tx||0, ty:ty||0, rotation:rot||0, scale:1, nested:false, page: page!==undefined?page:nest.currentPage };
    nest.instances.push(inst);
    return inst;
  }

  // 根据形状的qty，确保画布上有对应数量的实例
  function syncPartInstances(partId) {
    var part = getPart(partId); if (!part) return;
    var insts = getInsts(partId);
    var diff = part.qty - insts.length;
    if (diff > 0) {
      for (var i=0; i<diff; i++) {
        var off = (nest.instances.length % 8) * 12;
        addInstToCanvas(partId, 5+off, 5+off, 0);
      }
    } else if (diff < 0) {
      // 移除多余的实例
      var toRemove = insts.slice(0, -diff);
      toRemove.forEach(function(inst) {
        nest.instances = nest.instances.filter(function(i){return i.id!==inst.id;});
      });
    }
    nestRender(); updatePartsList();
  }

  function selectInst(id) {
    nest.selId = id;
    var inst = id?getInst(id):null, part = inst?getPart(inst.partId):null;
    if (inst && part) {
      $('#props-panel').style.display = '';
      // 显示零件编号（组内序号）
      var instsOfPart = getInsts(inst.partId);
      var idx = instsOfPart.findIndex(function(i){return i.id===id;});
      $('#prop-inst-label').textContent = part.name + ' #' + (idx+1);
      $('#prop-name').value = part.name;
      $('#prop-x').value = fmtVal(inst.tx);
      $('#prop-y').value = fmtVal(inst.ty);
      $('#prop-rot').value = inst.rotation.toFixed(0);
      $('#prop-scale').value = (inst.scale||1).toFixed(1);
    } else { $('#props-panel').style.display = 'none'; }
    nestRender(); updatePartsList();
  }
  function deleteInst(id) {
    nest.instances = nest.instances.filter(function(i){return i.id!==id;});
    if (nest.selId===id) selectInst(null);
    nestRender(); updatePartsList();
  }
  function deletePart(id) {
    nest.parts = nest.parts.filter(function(p){return p.id!==id;});
    nest.instances = nest.instances.filter(function(i){return i.partId!==id;});
    if (nest.selId && getInst(nest.selId) && getInst(nest.selId).partId===id) selectInst(null);
    nestRender(); updatePartsList();
  }

  // ───── 零件库 UI（分组+数量管理+实例列表） ─────
  function updatePartsList() {
    var list = $('#parts-list');
    if (nest.parts.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无零件<br>点击下方按钮绘制或导入</div>';
      return;
    }
    list.innerHTML = '';
    nest.parts.forEach(function(part) {
      var insts = getInsts(part.id);
      var bb = bbox(part.vertices);
      var w = toDisplay(bb.maxX-bb.minX).toFixed(1), h = toDisplay(bb.maxY-bb.minY).toFixed(1);
      var thumbShape;
      if (part.holes && part.holes.length > 0) {
        var d = 'M' + part.vertices.map(function(v){return v.x.toFixed(1)+','+v.y.toFixed(1);}).join('L') + 'Z';
        part.holes.forEach(function(hole) {
          d += 'M' + hole.map(function(v){return v.x.toFixed(1)+','+v.y.toFixed(1);}).join('L') + 'Z';
        });
        thumbShape = '<path d="'+d+'" fill="rgba('+hexToRgb(part.color)+',.15)" stroke="'+part.color+'" stroke-width="1" fill-rule="evenodd"/>';
      } else {
        thumbShape = '<polygon points="'+part.vertices.map(function(v){return v.x.toFixed(1)+','+v.y.toFixed(1);}).join(' ')+'" fill="rgba('+hexToRgb(part.color)+',.15)" stroke="'+part.color+'" stroke-width="1"/>';
      }
      var thumb = '<svg viewBox="'+(bb.minX-1)+' '+(bb.minY-1)+' '+(bb.maxX-bb.minX+2)+' '+(bb.maxY-bb.minY+2)+'" width="28" height="28" preserveAspectRatio="xMidYMid meet">'+thumbShape+'</svg>';
      var group = document.createElement('div');
      group.className = 'part-group';
      group.setAttribute('data-pid', part.id);

      // 形状头部
      var header = document.createElement('div');
      header.className = 'part-item';
      header.draggable = true;
      header.setAttribute('data-pid', part.id);
      header.innerHTML = '<div class="part-thumb">'+thumb+'</div>'+
        '<div class="part-info"><div class="pname">'+part.name+'</div>'+
        '<div class="pmeta">'+w+'×'+h+unitSuffix()+' · 共'+insts.length+'个</div></div>'+
        '<div class="part-qty">'+
          '<button class="part-qty-btn" data-act="dec">−</button>'+
          '<span class="part-qty-val">'+part.qty+'</span>'+
          '<button class="part-qty-btn" data-act="inc">+</button>'+
        '</div>'+
        '<button class="part-del" title="删除">×</button>';
      group.appendChild(header);

      // 实例列表（组内编号）
      if (insts.length > 0) {
        var instList = document.createElement('div');
        instList.className = 'inst-list';
        insts.forEach(function(inst, idx) {
          var isSel = nest.selId === inst.id;
          var instItem = document.createElement('div');
          instItem.className = 'inst-item' + (isSel?' selected':'');
          instItem.setAttribute('data-iid', inst.id);
          instItem.innerHTML = '<span class="inst-num">#'+(idx+1)+'</span>'+
            '<span class="inst-info">'+fmtVal(inst.tx)+','+fmtVal(inst.ty)+' '+unitSuffix()+' · '+(inst.rotation||0).toFixed(0)+'°'+(inst.scale&&inst.scale!==1?' · '+(inst.scale.toFixed(1))+'×':'')+'</span>'+
            '<span class="inst-page-p">P'+((inst.page||0)+1)+'</span>';
          instItem.addEventListener('click', function() {
            // 切换到该实例所在页
            nest.currentPage = inst.page || 0;
            selectInst(inst.id);
            nestFit();
          });
          instList.appendChild(instItem);
        });
        group.appendChild(instList);
      }

      // 事件绑定
      header.addEventListener('dblclick', function() {
        var off = (nest.instances.length % 5) * 15;
        var inst = addInstToCanvas(part.id, 5+off, 5+off, 0);
        part.qty++;
        selectInst(inst.id);
        nestRender();
        showToast('已添加 "'+part.name+'" 到画布');
      });
      header.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', part.id); header.classList.add('dragging'); });
      header.addEventListener('dragend', function(){ header.classList.remove('dragging'); });
      header.querySelector('[data-act="inc"]').addEventListener('click', function(e){
        e.stopPropagation(); part.qty++; syncPartInstances(part.id);
      });
      header.querySelector('[data-act="dec"]').addEventListener('click', function(e){
        e.stopPropagation(); if (part.qty>0) { part.qty--; syncPartInstances(part.id); }
      });
      header.querySelector('.part-del').addEventListener('click', function(e){ e.stopPropagation(); deletePart(part.id); });
      list.appendChild(group);
    });
  }

  // ===========================
  //  排布画布 — 交互
  // ===========================
  nestContainer.addEventListener('mousedown', function(e) {
    var pos = getMousePos(nestContainer, e);
    var mm = nestScreenToMM(pos.x, pos.y);
    if (e.button===1 || (e.button===0 && e.altKey)) {
      nest.dragging=true; nest.dragType='pan'; nest.dragStart={x:e.clientX,y:e.clientY};
      nestContainer.style.cursor='grabbing'; e.preventDefault(); return;
    }
    if (e.button!==0) return;
    var tgt = e.target;
    if (tgt.getAttribute('data-action')==='rotate') {
      var iid = parseInt(tgt.getAttribute('data-iid'));
      var inst = getInst(iid); var part = inst?getPart(inst.partId):null;
      if (inst && part) {
        var bb = getInstBBox(part, inst);
        nest.dragging=true; nest.dragType='rotate'; nest.dragInstId=iid;
        nest.dragStart={ mx:mm.x, my:mm.y, cx:(bb.minX+bb.maxX)/2, cy:(bb.minY+bb.maxY)/2, origRot:inst.rotation };
      } return;
    }
    if (tgt.classList.contains('v-handle')) {
      // 形状不可变：顶点不可拖拽
      return;
    }
    if (tgt.classList.contains('inst-poly')) {
      var iid3 = parseInt(tgt.getAttribute('data-iid'));
      selectInst(iid3);
      var inst3 = getInst(iid3);
      nest.dragging=true; nest.dragType='part'; nest.dragInstId=iid3;
      nest.dragStart={ mx:mm.x, my:mm.y, origTx:inst3?inst3.tx:0, origTy:inst3?inst3.ty:0 };
      nestContainer.style.cursor='move'; return;
    }
    selectInst(null);
  });

  nestContainer.addEventListener('mousemove', function(e) {
    var pos = getMousePos(nestContainer, e);
    nest.mouseMM = nestScreenToMM(pos.x, pos.y);
    if (nest.dragging) {
      var mmv = nest.mouseMM;
      if (nest.dragType==='pan') {
        nest.panX += e.clientX - nest.dragStart.x;
        nest.panY += e.clientY - nest.dragStart.y;
        nest.dragStart = {x:e.clientX, y:e.clientY};
        nestRender(); return;
      }
      if (nest.dragType==='part') {
        var inst = getInst(nest.dragInstId);
        if (inst) {
          var multiPage = nest.pageLayout !== 'single' && nest.pages.length > 1;
          if (multiPage) {
            // 多页模式：检测鼠标所在的页面
            var newPage = detectPage(mmv);
            var localMM = worldToLocal(mmv, newPage);
            var origPage = detectPage({x: nest.dragStart.mx, y: nest.dragStart.my});
            var origLocal = worldToLocal({x: nest.dragStart.mx, y: nest.dragStart.my}, origPage);
            inst.tx = nest.dragStart.origTx + (localMM.x - origLocal.x);
            inst.ty = nest.dragStart.origTy + (localMM.y - origLocal.y);
            if (inst.page !== newPage) {
              inst.page = newPage;
              updatePartsList();
            }
          } else {
            inst.tx = nest.dragStart.origTx + (mmv.x - nest.dragStart.mx);
            inst.ty = nest.dragStart.origTy + (mmv.y - nest.dragStart.my);
          }
          inst.nested = false;
          $('#prop-x').value = fmtVal(inst.tx);
          $('#prop-y').value = fmtVal(inst.ty);
          nestRender();
        } return;
      }
      if (nest.dragType==='vertex') {
        // 形状不可变：顶点不可拖拽
        return;
      }
      if (nest.dragType==='rotate') {
        var inst3 = getInst(nest.dragInstId);
        if (inst3) {
          var a1 = Math.atan2(nest.dragStart.my - nest.dragStart.cy, nest.dragStart.mx - nest.dragStart.cx);
          var a2 = Math.atan2(mmv.y - nest.dragStart.cy, mmv.x - nest.dragStart.cx);
          inst3.rotation = (nest.dragStart.origRot + (a2-a1)*180/Math.PI) % 360;
          if (inst3.rotation<0) inst3.rotation += 360;
          inst3.nested = false;
          $('#prop-rot').value = inst3.rotation.toFixed(0);
          nestRender();
        } return;
      }
    }
    updateStatusBar();
  });

  nestContainer.addEventListener('mouseup', function() {
    if (nest.dragging) {
      nest.dragging=false; nest.dragType=null;
      nestContainer.style.cursor='default';
      updatePartsList();
    }
  });

  nestContainer.addEventListener('wheel', function(e) {
    e.preventDefault();
    var pos = getMousePos(nestContainer, e);
    var mmBefore = nestScreenToMM(pos.x, pos.y);
    var f = e.deltaY<0 ? 1.12 : 1/1.12;
    nest.zoom = Math.max(0.05, Math.min(50, nest.zoom*f));
    nest.panX = pos.x - mmBefore.x * nest.zoom;
    nest.panY = pos.y - mmBefore.y * nest.zoom;
    nestRender();
  }, { passive:false });

  nestContainer.addEventListener('dragover', function(e){ e.preventDefault(); });
  nestContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    var pid = parseInt(e.dataTransfer.getData('text/plain'));
    if (!pid) return;
    var part = getPart(pid); if (!part) return;
    var pos = getMousePos(nestContainer, e);
    var mm = nestScreenToMM(pos.x, pos.y);
    var inst = addInstToCanvas(pid, mm.x, mm.y, 0);
    part.qty++;
    selectInst(inst.id);
    nestRender();
    showToast('已添加 "'+part.name+'"');
  });

  function getMousePos(el, e) {
    var r = el.getBoundingClientRect();
    return { x: e.clientX-r.left, y: e.clientY-r.top };
  }

  // ───── 单位切换 ─────
  $('#unit-select').addEventListener('change', function(){
    unit = this.value;
    updateAllUnitLabels();
    nestRender();
    if (draw.open) drawRender();
  });

  // ───── 顶部工具按钮 ─────
  document.querySelectorAll('.tool-btn[data-tool]').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.tool-btn[data-tool]').forEach(function(b){b.classList.remove('active');});
      this.classList.add('active');
    });
  });

  // ───── 属性面板 ─────
  ['prop-name','prop-x','prop-y','prop-rot','prop-scale'].forEach(function(id){
    $('#'+id).addEventListener('change', function(){
      var inst = getInst(nest.selId); if (!inst) return;
      var part = getPart(inst.partId);
      if (id==='prop-name' && part) { part.name = this.value||part.name; updatePartsList(); }
      if (id==='prop-x') inst.tx = fromDisplay(parseFloat(this.value)||0);
      if (id==='prop-y') inst.ty = fromDisplay(parseFloat(this.value)||0);
      if (id==='prop-rot') inst.rotation = parseFloat(this.value)||0;
      if (id==='prop-scale') inst.scale = Math.max(0.1, parseFloat(this.value)||1);
      inst.nested = false; nestRender();
    });
  });
  // 快速旋转按钮
  document.querySelectorAll('.prop-rot-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var inst = getInst(nest.selId); if (!inst) return;
      inst.rotation = parseFloat(this.getAttribute('data-rot'))||0;
      inst.nested = false;
      $('#prop-rot').value = inst.rotation.toFixed(0);
      nestRender();
    });
  });
  $('#btn-delete-inst').addEventListener('click', function(){ if (nest.selId) deleteInst(nest.selId); });

  // ───── 板材设置 ─────
  $('#sheet-preset').addEventListener('change', function(){
    var p = PRESETS[this.value];
    if (p) { nest.sheetW=p.w; nest.sheetH=p.h; $('#sheet-width').value=toDisplay(p.w).toFixed(1); $('#sheet-height').value=toDisplay(p.h).toFixed(1); nestFit(); }
  });
  $('#sheet-width').addEventListener('change', function(){ nest.sheetW=fromDisplay(parseFloat(this.value)||210); $('#sheet-preset').value='custom'; nestFit(); });
  $('#sheet-height').addEventListener('change', function(){ nest.sheetH=fromDisplay(parseFloat(this.value)||297); $('#sheet-preset').value='custom'; nestFit(); });

  $('#btn-clear').addEventListener('click', function(){
    if (nest.instances.length===0) return;
    nest.instances=[]; nest.selId=null; nest.pages=[]; nest.currentPage=0;
    $('#props-panel').style.display='none';
    $('#st-util').textContent='利用率: --';
    nestRender(); updatePartsList(); showToast('画布已清空');
  });

  // ───── 纸张切换 ─────
  $('#prev-page').addEventListener('click', function(){
    if (nest.currentPage > 0) { nest.currentPage--; selectInst(null); nestFit(); }
  });
  $('#next-page').addEventListener('click', function(){
    if (nest.currentPage < nest.pages.length-1) { nest.currentPage++; selectInst(null); nestFit(); }
  });
  $('#add-page').addEventListener('click', function(){
    nest.pages.push({ id: nest.pages.length });
    nest.currentPage = nest.pages.length - 1;
    selectInst(null); nestFit();
    showToast('已添加第 '+(nest.currentPage+1)+' 页');
  });
  $('#page-layout-mode').addEventListener('change', function(){
    nest.pageLayout = this.value;
    if (nest.pageLayout !== 'single' && nest.pages.length === 0) {
      nest.pages = [{ id: 0 }];
    }
    selectInst(null); nestFit();
  });

  // ───── SVG 导入/导出 ─────
  $('#btn-import').addEventListener('click', function(){ $('#svg-file-input').click(); });
  $('#btn-import-2').addEventListener('click', function(){ $('#svg-file-input').click(); });
  $('#svg-file-input').addEventListener('change', function(e){
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){ parseSVG(ev.target.result); };
    reader.readAsText(file);
    e.target.value = '';
  });

  function parseSVG(text) {
    var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    var root = doc.querySelector('svg'); if (!root) { showToast('无法解析SVG'); return; }
    var hasMM = (root.getAttribute('width')||'').indexOf('mm')>-1;
    var scale = hasMM ? 1 : 1/PX_PER_MM;
    var count = 0;
    root.querySelectorAll('polygon').forEach(function(pg){
      var pts = pg.getAttribute('points'); if (!pts) return;
      var verts = parsePoints(pts, scale); if (verts.length<3) return;
      var p = addPart(verts, '导入'+(++count));
      addInstToCanvas(p.id, 5+count*15, 5+count*15, 0);
    });
    root.querySelectorAll('path').forEach(function(p){
      var d = p.getAttribute('d'); if (!d) return;
      var verts = parsePathD(d, scale); if (verts.length<3) return;
      var pp = addPart(verts, '导入'+(++count));
      addInstToCanvas(pp.id, 5+count*15, 5+count*15, 0);
    });
    if (count>0) { showToast('导入 '+count+' 个零件'); nestRender(); }
    else showToast('未找到可用路径');
  }
  function parsePoints(pts, s) {
    return pts.trim().split(/[\s,]+/).reduce(function(a,v,i){ if(i%2===0)a.push({x:parseFloat(v)*s,y:0}); else a[a.length-1].y=parseFloat(v)*s; return a; },[]);
  }
  function parsePathD(d, s) {
    var v=[], cmds=d.replace(/([MLZ])/gi,' $1 ').split(/[\s,]+/).filter(Boolean), i=0;
    while(i<cmds.length){
      var c=cmds[i].toUpperCase();
      if(c==='M'){v.push({x:parseFloat(cmds[i+1])*s,y:parseFloat(cmds[i+2])*s});i+=3;}
      else if(c==='L'){v.push({x:parseFloat(cmds[i+1])*s,y:parseFloat(cmds[i+2])*s});i+=3;}
      else if(c==='Z'){break;} else i++;
    } return v;
  }

  $('#btn-export').addEventListener('click', function(){
    if (nest.instances.length===0) { showToast('画布上没有零件'); return; }
    var L = ['<?xml version="1.0" encoding="UTF-8"?>'];
    L.push('<svg width="'+nest.sheetW+'mm" height="'+nest.sheetH+'mm" viewBox="0 0 '+nest.sheetW+' '+nest.sheetH+'" xmlns="http://www.w3.org/2000/svg">');
    L.push('<rect x="0" y="0" width="'+nest.sheetW+'" height="'+nest.sheetH+'" fill="none" stroke="#999" stroke-width="0.5"/>');
    nest.instances.forEach(function(inst){
      var part = getPart(inst.partId); if (!part) return;
      var s = inst.scale||1;
      if (part.holes && part.holes.length > 0) {
        var d = 'M' + part.vertices.map(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); return (r.x+inst.tx).toFixed(2)+','+(r.y+inst.ty).toFixed(2); }).join('L') + 'Z';
        part.holes.forEach(function(hole) {
          d += 'M' + hole.map(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); return (r.x+inst.tx).toFixed(2)+','+(r.y+inst.ty).toFixed(2); }).join('L') + 'Z';
        });
        L.push('<path d="'+d+'" fill="none" stroke="#000" stroke-width="0.5" fill-rule="evenodd"/>');
      } else {
        var pts = part.vertices.map(function(v){ var sx=v.x*s, sy=v.y*s; var r=rotPt(sx,sy,inst.rotation); return (r.x+inst.tx).toFixed(2)+','+(r.y+inst.ty).toFixed(2); }).join(' ');
        L.push('<polygon points="'+pts+'" fill="none" stroke="#000" stroke-width="0.5"/>');
      }
      var bb = getInstBBox(part, inst);
      L.push('<text x="'+((bb.minX+bb.maxX)/2).toFixed(2)+'" y="'+((bb.minY+bb.maxY)/2).toFixed(2)+'" font-size="3" text-anchor="middle" fill="#999">'+part.name+'</text>');
    });
    L.push('</svg>');
    var blob = new Blob([L.join('\n')], {type:'image/svg+xml'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href=url; a.download='liteplanner-'+nest.sheetW+'x'+nest.sheetH+'.svg'; a.click();
    URL.revokeObjectURL(url);
    showToast('SVG 已导出');
  });

  // ───── 自动排样 ─────
  $('#btn-nest').addEventListener('click', startNest);
  $('#btn-stop-nest').addEventListener('click', function(){ stopNest(); });

  function startNest() {
    if (nest.instances.length===0) { showToast('请先添加零件'); return; }
    var rots = [];
    if ($('#rot-0').checked) rots.push(0);
    if ($('#rot-45').checked) rots.push(45);
    if ($('#rot-90').checked) rots.push(90);
    if (rots.length===0) { showToast('请选择旋转角度'); return; }
    var spacingRaw = parseFloat($('#nest-spacing').value);
    var spacing = fromDisplay(isNaN(spacingRaw) ? 2 : spacingRaw);
    nest.nesting = true;
    $('#btn-nest').style.display='none'; $('#btn-stop-nest').style.display='';
    var prog = document.createElement('div'); prog.className='nest-progress'; prog.id='nest-prog';
    prog.innerHTML = '<div class="spinner"></div><p>正在排样...</p>';
    nestContainer.appendChild(prog);
    setTimeout(function(){
      try {
        var result = greedyNest(spacing, rots);
        // 确定总页数
        var maxPage = 0;
        result.forEach(function(r){ if (r.page > maxPage) maxPage = r.page; });
        // 创建页面数组
        nest.pages = [];
        for (var p=0; p<=maxPage; p++) nest.pages.push({ id:p });
        // 应用结果
        result.forEach(function(r){ var i=getInst(r.iid); if(i){ i.tx=r.tx; i.ty=r.ty; i.rotation=r.rot; i.nested=true; i.page=r.page; } });
        // 切换到第1页
        nest.currentPage = 0;
        // 计算利用率（第1页）
        var totalA = 0;
        var page0Insts = nest.instances.filter(function(i){ return i.page===0; });
        page0Insts.forEach(function(i){ var p2=getPart(i.partId); if(p2){ var s=i.scale||1; var a=polyArea(p2.vertices)*s*s; if(p2.holes){p2.holes.forEach(function(h){a-=polyArea(h)*s*s;});} totalA+=a; } });
        var util = nest.sheetW*nest.sheetH>0 ? totalA/(nest.sheetW*nest.sheetH)*100 : 0;
        $('#st-util').textContent = '利用率: '+util.toFixed(1)+'% ('+nest.pages.length+'页)';
        var pe = document.getElementById('nest-prog'); if(pe) pe.remove();
        nest.nesting=false; $('#btn-nest').style.display=''; $('#btn-stop-nest').style.display='none';
        selectInst(null); nestFit();
        showToast('排样完成，共 '+nest.pages.length+' 页，第1页利用率 '+util.toFixed(1)+'%');
      } catch(err) {
        console.error('排样错误:', err);
        var pe = document.getElementById('nest-prog'); if(pe) pe.remove();
        nest.nesting=false; $('#btn-nest').style.display=''; $('#btn-stop-nest').style.display='none';
        showToast('排样出错: ' + (err.message || err));
      }
    }, 200);
  }
  function stopNest() {
    nest.nesting=false; var pe=document.getElementById('nest-prog'); if(pe)pe.remove();
    $('#btn-nest').style.display=''; $('#btn-stop-nest').style.display='none';
  }

  function greedyNest(spacing, rots) {
    var W=nest.sheetW, H=nest.sheetH;
    var sorted = nest.instances.slice().sort(function(a,b){
      var pa=getPart(a.partId),pb=getPart(b.partId);
      if(!pa||!pb) return 0;
      return polyArea(pb.vertices)-polyArea(pa.vertices);
    });
    var results=[]; var placed=[]; var pageNum=0;

    sorted.forEach(function(inst){
      var part = getPart(inst.partId); if (!part) return;
      var s = inst.scale || 1;
      var found = false;

      // 预计算所有旋转角度的数据
      var rotData = rots.map(function(rot) {
        var rv = part.vertices.map(function(v){ var sx=v.x*s, sy=v.y*s; return rotPt(sx,sy,rot); });
        var rvHoles = (part.holes||[]).map(function(h){ return h.map(function(v){ var sx=v.x*s, sy=v.y*s; return rotPt(sx,sy,rot); }); });
        var bb = bbox(rv);
        var partW = bb.maxX-bb.minX, partH = bb.maxY-bb.minY;
        var pW = partW+spacing, pH = partH+spacing;
        return { rot:rot, rv:rv, rvHoles:rvHoles, bb:bb, partW:partW, partH:partH, pW:pW, pH:pH, fits: pW<=W && pH<=H };
      });

      // 收集所有已放置零件的孔洞信息（顶点 + 包围盒，已平移到画布坐标）
      var holeInfos = [];
      placed.forEach(function(p) {
        if (p.holes && p.holes.length > 0) {
          p.holes.forEach(function(hole) {
            var verts = hole.map(function(v){ return {x:v.x+p.tx, y:v.y+p.ty}; });
            var hBB = bbox(verts);
            holeInfos.push({ verts:verts, minX:hBB.minX, minY:hBB.minY, maxX:hBB.maxX, maxY:hBB.maxY });
          });
        }
      });

      // 阶段1：所有旋转角度 × 孔洞内放置（优先放入孔洞）
      for (var ri=0; ri<rotData.length && !found; ri++) {
        var rd = rotData[ri];
        if (!rd.fits) continue;
        var bb = rd.bb, rv = rd.rv, rvHoles = rd.rvHoles, rot = rd.rot;
        var partW2 = rd.partW, partH2 = rd.partH;

        // 检查函数：给定位置是否可放置
        function tryPlaceHole(tx, ty) {
          if (found) return;
          if (bb.minX+tx < -0.01 || bb.minY+ty < -0.01 || bb.maxX+tx > W+0.01 || bb.maxY+ty > H+0.01) return;
          for (var hp=0; hp<placed.length; hp++) {
            if (aabbOverlap(rv,tx,ty,placed[hp].v,placed[hp].tx,placed[hp].ty,spacing,rvHoles,placed[hp].holes)) return;
          }
          placed.push({v:rv, holes:rvHoles, tx:tx, ty:ty});
          results.push({iid:inst.id, tx:tx, ty:ty, rot:rot, page:pageNum});
          found = true;
        }

        for (var hc=0; hc<holeInfos.length && !found; hc++) {
          var hi = holeInfos[hc];

          // 1a. 顶点对齐：将零件每个顶点对齐到孔洞每个顶点（精确匹配形状）
          //     适用于"三角形放入对应大小的三角形孔洞"——顶点完全重合
          for (var rv_i=0; rv_i<rv.length && !found; rv_i++) {
            for (var hv_i=0; hv_i<hi.verts.length && !found; hv_i++) {
              tryPlaceHole(hi.verts[hv_i].x - rv[rv_i].x, hi.verts[hv_i].y - rv[rv_i].y);
            }
          }

          // 1b. 网格扫描孔洞区域：覆盖整个孔洞包围盒
          //     允许多个小零件依次放入同一个大孔洞
          if (!found) {
            var step = Math.max(0.5, Math.min(partW2, partH2) * 0.15);
            // 扫描范围：孔洞bbox ± 零件半尺寸（允许零件部分超出孔洞但中心在孔洞附近）
            var pad = Math.max(partW2, partH2) * 0.3;
            for (var gy=hi.minY-pad; gy<=hi.maxY+pad && !found; gy+=step) {
              for (var gx=hi.minX-pad; gx<=hi.maxX+pad && !found; gx+=step) {
                tryPlaceHole(gx - (bb.minX+bb.maxX)/2, gy - (bb.minY+bb.maxY)/2);
              }
            }
          }
        }
      }

      // 阶段2：所有旋转角度 × 共边贴合 + 网格扫描
      for (var ri2=0; ri2<rotData.length && !found; ri2++) {
        var rd2 = rotData[ri2];
        if (!rd2.fits) continue;
        var bb2 = rd2.bb, rv2 = rd2.rv, rvHoles2 = rd2.rvHoles, rot2 = rd2.rot;
        var partW2 = rd2.partW, partH2 = rd2.partH, pW2 = rd2.pW, pH2 = rd2.pH;

        var xMin = spacing, xMax = W - pW2 + spacing;
        var yMin = spacing, yMax = H - pH2 + spacing;

        // 共边贴合候选位置
        var snapX = [spacing], snapY = [spacing];
        placed.forEach(function(p) {
          var pBB = bbox(p.v);
          snapX.push(pBB.maxX + p.tx + spacing);
          snapX.push(pBB.minX + p.tx - spacing - partW2);
          snapY.push(pBB.maxY + p.ty + spacing);
          snapY.push(pBB.minY + p.ty - spacing - partH2);
        });
        snapX = snapX.filter(function(v){ return v >= xMin-0.01 && v <= xMax+0.01; })
                     .sort(function(a,b){return a-b;})
                     .filter(function(v,i,arr){ return i===0 || Math.abs(v-arr[i-1])>0.01; });
        snapY = snapY.filter(function(v){ return v >= yMin-0.01 && v <= yMax+0.01; })
                     .sort(function(a,b){return a-b;})
                     .filter(function(v,i,arr){ return i===0 || Math.abs(v-arr[i-1])>0.01; });

        for (var yi=0; yi<snapY.length && !found; yi++) {
          for (var xi=0; xi<snapX.length && !found; xi++) {
            var tx = snapX[xi] - bb2.minX, ty = snapY[yi] - bb2.minY;
            var overlap = false;
            for (var p=0; p<placed.length; p++) {
              if (aabbOverlap(rv2,tx,ty,placed[p].v,placed[p].tx,placed[p].ty,spacing,rvHoles2,placed[p].holes)) { overlap=true; break; }
            }
            if (!overlap) {
              placed.push({v:rv2, holes:rvHoles2, tx:tx, ty:ty});
              results.push({iid:inst.id, tx:tx, ty:ty, rot:rot2, page:pageNum});
              found = true;
            }
          }
        }

        // 网格扫描
        if (!found) {
          var step = Math.max(0.5, Math.min(pW2,pH2)*0.05);
          for (var y=spacing; y<=yMax && !found; y+=step) {
            for (var x=spacing; x<=xMax && !found; x+=step) {
              var tx2 = x-bb2.minX, ty2 = y-bb2.minY;
              var overlap2 = false;
              for (var p2=0; p2<placed.length; p2++) {
                if (aabbOverlap(rv2,tx2,ty2,placed[p2].v,placed[p2].tx,placed[p2].ty,spacing,rvHoles2,placed[p2].holes)) { overlap2=true; break; }
              }
              if (!overlap2) {
                placed.push({v:rv2, holes:rvHoles2, tx:tx2, ty:ty2});
                results.push({iid:inst.id, tx:tx2, ty:ty2, rot:rot2, page:pageNum});
                found = true;
              }
            }
          }
        }
      }

      // 当前页放不下，新开一页
      if (!found) {
        pageNum++;
        placed = [];
        for (var ri3=0; ri3<rotData.length; ri3++) {
          var rd3 = rotData[ri3];
          if (!rd3.fits) continue;
          var tx3 = spacing - rd3.bb.minX, ty3 = spacing - rd3.bb.minY;
          placed.push({v:rd3.rv, holes:rd3.rvHoles, tx:tx3, ty:ty3});
          results.push({iid:inst.id, tx:tx3, ty:ty3, rot:rd3.rot, page:pageNum});
          found = true;
          break;
        }
        if (!found) {
          var rot0 = rots[0] || 0;
          var rv0 = part.vertices.map(function(v){ var sx=v.x*s, sy=v.y*s; return rotPt(sx,sy,rot0); });
          var bb0 = bbox(rv0);
          var tx0 = spacing - bb0.minX, ty0 = spacing - bb0.minY;
          results.push({iid:inst.id, tx:tx0, ty:ty0, rot:rot0, page:pageNum});
        }
      }
    });
    return results;
  }
  function aabbOverlap(va,txa,tya,vb,txb,tyb,sp,holesA,holesB) {
    var ba=bbox(va), bb=bbox(vb);
    var aMinX=ba.minX+txa-sp, aMinY=ba.minY+tya-sp, aMaxX=ba.maxX+txa+sp, aMaxY=ba.maxY+tya+sp;
    var bMinX=bb.minX+txb-sp, bMinY=bb.minY+tyb-sp, bMaxX=bb.maxX+txb+sp, bMaxY=bb.maxY+tyb+sp;
    if (aMaxX<bMinX||aMinX>bMaxX||aMaxY<bMinY||aMinY>bMaxY) return false;
    var wa=va.map(function(v){return{x:v.x+txa,y:v.y+tya};});
    var wb=vb.map(function(v){return{x:v.x+txb,y:v.y+tyb};});
    var wHolesA=(holesA||[]).map(function(h){return h.map(function(v){return{x:v.x+txa,y:v.y+tya};});});
    var wHolesB=(holesB||[]).map(function(h){return h.map(function(v){return{x:v.x+txb,y:v.y+tyb};});});
    // 间距为0时允许共线（共用切割路径），使用严格检测
    var strict = sp <= 0.001;
    var eps = strict ? 0.001 : 0;
    // 顶点包含检测（使用实体区域：外轮廓内且不在孔洞内）
    for (var i=0;i<wa.length;i++) if (ptInPolySolid(wa[i],wb,wHolesB,strict,eps)) return true;
    for (var j=0;j<wb.length;j++) if (ptInPolySolid(wb[j],wa,wHolesA,strict,eps)) return true;
    // 边相交检测（仅检测外轮廓边，孔洞边不参与碰撞）
    for (var e1=0;e1<wa.length;e1++) {
      var a1=wa[e1], a2=wa[(e1+1)%wa.length];
      for (var e2=0;e2<wb.length;e2++) {
        var b1=wb[e2], b2=wb[(e2+1)%wb.length];
        if (strict ? segIntersectStrict(a1.x,a1.y,a2.x,a2.y,b1.x,b1.y,b2.x,b2.y) : segIntersect(a1.x,a1.y,a2.x,a2.y,b1.x,b1.y,b2.x,b2.y)) return true;
      }
    }
    // 严格模式额外检测：边中点是否在对方实体内部（捕获共边重叠的情况）
    if (strict) {
      for (var m1=0;m1<wa.length;m1++) {
        var ma1=wa[m1], ma2=wa[(m1+1)%wa.length];
        var midA={x:(ma1.x+ma2.x)/2, y:(ma1.y+ma2.y)/2};
        if (ptInPolySolid(midA,wb,wHolesB,true,eps)) return true;
      }
      for (var m2=0;m2<wb.length;m2++) {
        var mb1=wb[m2], mb2=wb[(m2+1)%wb.length];
        var midB={x:(mb1.x+mb2.x)/2, y:(mb1.y+mb2.y)/2};
        if (ptInPolySolid(midB,wa,wHolesA,true,eps)) return true;
      }
      // 内偏移边采样检测（捕获完全重叠：两个相同零件放在同一位置时，所有顶点和边中点都在边界上）
      // 对每条边计算中点，沿内向法线偏移一小段距离，检查偏移点是否在对方实体内
      // 需要根据多边形方向确定内向法线：CCW→(-dy,dx)，CW→(dy,-dx)
      var offset = 0.1; // 0.1mm 向内偏移
      var sgnA = polySign(wa), sgnB = polySign(wb);
      for (var s1=0;s1<wa.length;s1++) {
        var sa1=wa[s1], sa2=wa[(s1+1)%wa.length];
        var sdx=sa2.x-sa1.x, sdy=sa2.y-sa1.y;
        var slen=Math.sqrt(sdx*sdx+sdy*sdy);
        if (slen < 1e-6) continue;
        var inX=-sdy/slen*sgnA, inY=sdx/slen*sgnA; // CCW: sgn=1→(-dy,dx); CW: sgn=-1→(dy,-dx)
        var innerPt={x:(sa1.x+sa2.x)/2+inX*offset, y:(sa1.y+sa2.y)/2+inY*offset};
        if (ptInPolySolid(innerPt,wb,wHolesB,true,eps)) return true;
      }
      for (var s2=0;s2<wb.length;s2++) {
        var sb1=wb[s2], sb2=wb[(s2+1)%wb.length];
        var sdx2=sb2.x-sb1.x, sdy2=sb2.y-sb1.y;
        var slen2=Math.sqrt(sdx2*sdx2+sdy2*sdy2);
        if (slen2 < 1e-6) continue;
        var inX2=-sdy2/slen2*sgnB, inY2=sdx2/slen2*sgnB;
        var innerPt2={x:(sb1.x+sb2.x)/2+inX2*offset, y:(sb1.y+sb2.y)/2+inY2*offset};
        if (ptInPolySolid(innerPt2,wa,wHolesA,true,eps)) return true;
      }
    }
    // 非严格模式：检查最小边距是否小于间距（强制间距，防止零件间距小于设定值）
    if (sp > 0.001) {
      for (var d1=0;d1<wa.length;d1++) {
        var da1=wa[d1], da2=wa[(d1+1)%wa.length];
        for (var d2=0;d2<wb.length;d2++) {
          var db1=wb[d2], db2=wb[(d2+1)%wb.length];
          if (segMinDist(da1,da2,db1,db2) < sp - 0.01) return true;
        }
      }
    }
    return false;
  }
  // 实体区域包含检测：点在外轮廓内且不在任何孔洞内
  function ptInPolySolid(pt,poly,holes,strict,eps) {
    if (strict ? !ptInPolyStrict(pt,poly,eps) : !ptInPoly(pt,poly)) return false;
    if (holes) {
      for (var h=0; h<holes.length; h++) {
        if (ptInPoly(pt, holes[h])) return false;
      }
    }
    return true;
  }
  // 有符号面积方向：CCW→1, CW→-1
  function polySign(v){ var a=0,n=v.length; for(var i=0;i<n;i++){var j=(i+1)%n; a+=v[i].x*v[j].y-v[j].x*v[i].y;} return a>0?1:-1; }
  // 严格点在多边形内检测（排除边界）
  function ptInPolyStrict(pt,poly,eps) {
    eps = eps || 0;
    var x=pt.x,y=pt.y,inside=false,n=poly.length;
    for (var i=0,j=n-1;i<n;j=i++){
      var xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;
      // 检查点是否在边上（在边上不算重叠）
      var dx=xj-xi, dy=yj-yi;
      var len2=dx*dx+dy*dy;
      if (len2>1e-10) {
        var t=((x-xi)*dx+(y-yi)*dy)/len2;
        if (t>=-eps && t<=1+eps) {
          var px=xi+t*dx, py=yi+t*dy;
          if (Math.sqrt((x-px)**2+(y-py)**2) < 0.01+eps) return false; // 在边上
        }
      }
      if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
    }
    return inside;
  }
  // 严格线段相交检测（排除端点接触，仅检测实际穿越）
  function segIntersectStrict(x1,y1,x2,y2,x3,y3,x4,y4) {
    var d=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3);
    if (Math.abs(d)<1e-10) return false; // 平行或共线
    var t=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/d;
    var u=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/d;
    // 严格：排除端点接触（t、u 都在 (0,1) 开区间内才算穿越）
    return t>0.001&&t<0.999&&u>0.001&&u<0.999;
  }
  function segIntersect(x1,y1,x2,y2,x3,y3,x4,y4) {
    var d=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3);
    if (Math.abs(d)<1e-10) return false;
    var t=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/d;
    var u=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/d;
    return t>=0&&t<=1&&u>=0&&u<=1;
  }
  function segMinDist(a1,a2,b1,b2) {
    // 计算两条线段之间的最短距离
    var d1=ptToSegDist(a1,b1,b2), d2=ptToSegDist(a2,b1,b2);
    var d3=ptToSegDist(b1,a1,a2), d4=ptToSegDist(b2,a1,a2);
    return Math.min(d1,d2,d3,d4);
  }
  function ptToSegDist(p,a,b) {
    var dx=b.x-a.x, dy=b.y-a.y;
    var len2=dx*dx+dy*dy;
    if (len2<1e-10) return Math.sqrt((p.x-a.x)**2+(p.y-a.y)**2);
    var t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2));
    var px=a.x+t*dx, py=a.y+t*dy;
    return Math.sqrt((p.x-px)**2+(p.y-py)**2);
  }

  // ===========================
  //  绘图弹窗 — 独立逻辑
  // ===========================
  function openDrawModal() {
    draw.open = true;
    draw.lines = [];
    draw.activeStart = null;
    draw.selectedRegions = [];
    draw.selectedLine = null;
    draw.tool = 'line';
    $('#draw-modal').style.display = '';
    $('#draw-name').value = '零件 ' + nest.nextPartId;
    $('#draw-hint').textContent = '点击画布放置线段起点，移动后再次点击放置终点';
    $('#draw-canvas-w').value = toDisplay(draw.canvasW).toFixed(0);
    $('#draw-canvas-h').value = toDisplay(draw.canvasH).toFixed(0);
    updateDrawToolButtons();
    updateDrawCursor();
    setTimeout(function(){ drawFit(); }, 50);
  }
  function closeDrawModal() {
    draw.open = false;
    $('#draw-modal').style.display = 'none';
    $('#draw-coord-tip').style.display = 'none';
  }
  function drawFit() {
    var w = drawWrap.clientWidth, h = drawWrap.clientHeight;
    var margin = 30;
    var fitW = w - margin*2, fitH = h - margin*2;
    draw.zoom = Math.min(fitW/draw.canvasW, fitH/draw.canvasH);
    draw.panX = (w - draw.canvasW * draw.zoom) / 2;
    draw.panY = (h - draw.canvasH * draw.zoom) / 2;
    drawRender();
  }
  function drawScreenToMM(sx, sy) { return { x:(sx-draw.panX)/draw.zoom, y:(sy-draw.panY)/draw.zoom }; }
  function updateDrawToolButtons() {
    document.querySelectorAll('.dtool-btn[data-dtool]').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-dtool')===draw.tool);
    });
  }
  function snapVal(v) {
    if (!draw.snapToGrid) return v;
    return Math.round(v / draw.gridStep) * draw.gridStep;
  }

  // 端点吸附：检查鼠标位置是否靠近已有线段端点，返回吸附后的坐标
  function snapToEndpoint(mm) {
    if (!draw.snapToEndpoint) return mm;
    var r = draw.snapRadius;
    var bestPt = null, bestDist = r;
    draw.lines.forEach(function(ln) {
      var pts = [{x:ln.x1, y:ln.y1}, {x:ln.x2, y:ln.y2}];
      pts.forEach(function(pt) {
        var d = dist(mm, pt);
        if (d < bestDist) { bestDist = d; bestPt = {x:pt.x, y:pt.y}; }
      });
    });
    return bestPt || mm;
  }

  // 根据工具切换画布光标
  function updateDrawCursor() {
    if (draw.tool==='line') drawSVG.style.cursor = 'crosshair';
    else if (draw.tool==='edit') drawSVG.style.cursor = 'default';
    else if (draw.tool==='select') drawSVG.style.cursor = 'pointer';
  }

  // ───── 撤销/重做 ─────
  function pushHistory() {
    // 截断当前历史位置之后的所有记录（重做分支被新操作覆盖）
    draw.history = draw.history.slice(0, draw.historyIdx + 1);
    // 深拷贝当前线段状态
    var snapshot = draw.lines.map(function(ln) {
      return {x1:ln.x1, y1:ln.y1, x2:ln.x2, y2:ln.y2};
    });
    draw.history.push(snapshot);
    // 限制历史栈大小
    if (draw.history.length > 50) draw.history.shift();
    else draw.historyIdx++;
  }
  function undoDraw() {
    if (draw.historyIdx < 0) { showToast('没有可撤销的操作'); return; }
    // 如果当前状态与历史不同，先保存当前状态用于重做
    if (draw.historyIdx >= draw.history.length - 1) {
      var current = draw.lines.map(function(ln) { return {x1:ln.x1, y1:ln.y1, x2:ln.x2, y2:ln.y2}; });
      draw.history.push(current); // 暂存当前状态用于重做
    }
    var snapshot = draw.history[draw.historyIdx];
    draw.lines = snapshot.map(function(ln) { return {x1:ln.x1, y1:ln.y1, x2:ln.x2, y2:ln.y2}; });
    draw.historyIdx--;
    draw.selectedRegions = [];
    drawRender();
    showToast('已撤销');
  }
  function redoDraw() {
    if (draw.historyIdx + 2 >= draw.history.length) { showToast('没有可重做的操作'); return; }
    draw.historyIdx++;
    var snapshot = draw.history[draw.historyIdx + 1];
    if (snapshot) {
      draw.lines = snapshot.map(function(ln) { return {x1:ln.x1, y1:ln.y1, x2:ln.x2, y2:ln.y2}; });
      draw.selectedRegions = [];
      drawRender();
      showToast('已重做');
    }
  }

  function drawRender() {
    drawDotGridCanvas(drawDotGrid, drawDotCtx, draw.zoom, draw.panX, draw.panY);
    drawSVG.innerHTML = '';
    var g = svgEl('g', { transform:'translate('+draw.panX+','+draw.panY+') scale('+draw.zoom+')' });
    drawSVG.appendChild(g);

    // 画布边界矩形
    g.appendChild(svgEl('rect', { x:0, y:0, width:draw.canvasW, height:draw.canvasH,
      fill:'rgba(255,255,255,0.8)', stroke:'#ccc', 'stroke-width':0.5/draw.zoom, 'stroke-dasharray':(2/draw.zoom)+','+(2/draw.zoom) }));

    // 尺寸标注
    var fs = (12/draw.zoom).toFixed(2);
    var fsSm = (10/draw.zoom).toFixed(2);
    var textAttr = 'paint-order:stroke; stroke:#fff; stroke-width:'+(3/draw.zoom).toFixed(3);
    var vtxR = (0.8/draw.zoom).toFixed(2); // 绘图点尺寸缩小至1/3
    var hitR = (4/draw.zoom).toFixed(2); // 拖拽响应区域稍大
    var wLabel = svgEl('text', { x:(draw.canvasW/2).toFixed(2), y:(-3/draw.zoom).toFixed(2), 'font-size':fs, 'text-anchor':'middle', fill:'#888', 'pointer-events':'none', style:textAttr });
    wLabel.textContent = toDisplay(draw.canvasW).toFixed(0)+unitSuffix();
    g.appendChild(wLabel);
    var hLabel = svgEl('text', { x:(-4/draw.zoom).toFixed(2), y:(draw.canvasH/2).toFixed(2), 'font-size':fs, 'text-anchor':'middle', fill:'#888', 'pointer-events':'none', style:textAttr, transform:'rotate(-90 '+(-4/draw.zoom)+' '+(draw.canvasH/2)+')' });
    hLabel.textContent = toDisplay(draw.canvasH).toFixed(0)+unitSuffix();
    g.appendChild(hLabel);

    // 渲染选中区域（支持多选，带孔洞使用 path+evenodd）
    draw.selectedRegions.forEach(function(reg, regIdx) {
      if (reg && reg.outer && reg.outer.length>=3) {
        var colors = ['rgba(107,158,63,0.2)', 'rgba(58,123,213,0.15)', 'rgba(212,160,23,0.15)', 'rgba(155,89,182,0.15)'];
        var strokeColors = ['#6B9E3F', '#3A7BD5', '#D4A017', '#9B59B6'];
        var ci = regIdx % colors.length;
        // 构建 path：外轮廓 + 孔洞子路径，使用 fill-rule:evenodd
        var d = 'M' + reg.outer.map(function(v){return v.x.toFixed(2)+','+v.y.toFixed(2);}).join('L') + 'Z';
        reg.holes.forEach(function(hole) {
          d += 'M' + hole.map(function(v){return v.x.toFixed(2)+','+v.y.toFixed(2);}).join('L') + 'Z';
        });
        g.appendChild(svgEl('path', { d:d, fill:colors[ci], stroke:strokeColors[ci], 'fill-rule':'evenodd', 'stroke-width':(1.5/draw.zoom).toFixed(3), 'stroke-dasharray':(3/draw.zoom)+','+(2/draw.zoom) }));
        // 区域编号标注（基于外轮廓质心）
        var rcx = reg.outer.reduce(function(s,v){return s+v.x;},0)/reg.outer.length;
        var rcy = reg.outer.reduce(function(s,v){return s+v.y;},0)/reg.outer.length;
        var regLabel = svgEl('text', { x:rcx.toFixed(2), y:rcy.toFixed(2), 'font-size':fs, fill:strokeColors[ci], 'text-anchor':'middle', 'pointer-events':'none', style:textAttr });
        regLabel.textContent = '#'+(regIdx+1);
        g.appendChild(regLabel);
      }
    });

    // 渲染已绘制的线段 — 分两轮：先画所有线段本体，再画所有端点（确保端点在最上层）
    var epHitR = (6/draw.zoom).toFixed(2); // 端点判定/显示半径（增大范围）
    // 第一轮：线段命中区 + 可见线段 + 标注
    draw.lines.forEach(function(ln, idx) {
      var isSel = draw.selectedLine === idx;
      var lineColor = isSel ? '#D4A017' : '#3A7BD5';
      var sw = isSel ? (2.5/draw.zoom).toFixed(3) : (1.2/draw.zoom).toFixed(3);
      // 编辑模式：添加透明粗线作为点击命中区域
      if (draw.tool==='edit') {
        g.appendChild(svgEl('line', { x1:ln.x1.toFixed(2), y1:ln.y1.toFixed(2), x2:ln.x2.toFixed(2), y2:ln.y2.toFixed(2), stroke:'transparent', 'stroke-width':(6/draw.zoom).toFixed(3), 'data-lidx':idx, class:'draw-line-hit', style:'cursor:pointer' }));
      }
      g.appendChild(svgEl('line', { x1:ln.x1.toFixed(2), y1:ln.y1.toFixed(2), x2:ln.x2.toFixed(2), y2:ln.y2.toFixed(2), stroke:lineColor, 'stroke-width':sw, 'data-lidx':idx, class:'draw-line'+(isSel?' selected':''), style:'pointer-events:none' }));
      // 长度标注
      var ldx=ln.x2-ln.x1, ldy=ln.y2-ln.y1;
      var llen=Math.sqrt(ldx*ldx+ldy*ldy);
      var lmx=(ln.x1+ln.x2)/2, lmy=(ln.y1+ln.y2)/2;
      var llen2=Math.sqrt(ldx*ldx+ldy*ldy);
      var lnx=0, lny=-4/draw.zoom;
      if (llen2>0.001) { lnx=(-ldy/llen2)*4/draw.zoom; lny=(ldx/llen2)*4/draw.zoom; }
      var lt = svgEl('text', { x:(lmx+lnx).toFixed(2), y:(lmy+lny).toFixed(2), 'font-size':fs, fill:lineColor, 'text-anchor':'middle', 'pointer-events':'none', style:textAttr });
      lt.textContent = fmtVal(llen)+' '+unitSuffix();
      g.appendChild(lt);
      // 角度标注
      var lang = Math.atan2(ldy, ldx) * 180 / Math.PI;
      var lat = svgEl('text', { x:(ln.x2+3/draw.zoom).toFixed(2), y:(ln.y2+3/draw.zoom).toFixed(2), 'font-size':fsSm, fill:'#8B5E3C', 'pointer-events':'none', style:textAttr });
      lat.textContent = lang.toFixed(0)+'°';
      g.appendChild(lat);
    });
    // 第二轮：收集唯一端点位置并渲染（去重，避免共端点时重叠遮挡）
    var epMap = {}; // key: "x,y" → {x, y, lidx, end}
    draw.lines.forEach(function(ln, idx) {
      var k1 = ln.x1.toFixed(2)+','+ln.y1.toFixed(2);
      if (!epMap[k1]) epMap[k1] = {x:ln.x1, y:ln.y1, lidx:idx, end:'1'};
      var k2 = ln.x2.toFixed(2)+','+ln.y2.toFixed(2);
      if (!epMap[k2]) epMap[k2] = {x:ln.x2, y:ln.y2, lidx:idx, end:'2'};
    });
    Object.keys(epMap).forEach(function(key) {
      var ep = epMap[key];
      var isHover = draw.hoverEp && Math.abs(draw.hoverEp.x - ep.x) < 0.5 && Math.abs(draw.hoverEp.y - ep.y) < 0.5;
      var epR = isHover ? (4/draw.zoom).toFixed(2) : (2.5/draw.zoom).toFixed(2);
      var epColor = isHover ? '#D4A017' : '#3A7BD5';
      // 命中区（编辑模式下可点击，始终在最上层）
      if (draw.tool==='edit') {
        g.appendChild(svgEl('circle', { cx:ep.x.toFixed(2), cy:ep.y.toFixed(2), r:epHitR, fill:'transparent', 'data-lidx':ep.lidx, 'data-end':ep.end, class:'draw-ep-hit', style:'cursor:grab' }));
      }
      // 可见端点（pointer-events:none，不拦截事件）
      g.appendChild(svgEl('circle', { cx:ep.x.toFixed(2), cy:ep.y.toFixed(2), r:epR, fill:epColor, stroke:'#fff', 'stroke-width':(0.8/draw.zoom).toFixed(3), class:'draw-ep'+(isHover?' hover':''), style:'pointer-events:none' }));
    });

    // 渲染正在绘制的线段预览
    if (draw.tool==='line' && draw.activeStart) {
      g.appendChild(svgEl('line', { x1:draw.activeStart.x.toFixed(2), y1:draw.activeStart.y.toFixed(2), x2:draw.mouseMM.x.toFixed(2), y2:draw.mouseMM.y.toFixed(2), stroke:'#3A7BD5', 'stroke-width':(0.8/draw.zoom).toFixed(3), 'stroke-dasharray':(2/draw.zoom)+','+(2/draw.zoom), opacity:0.6 }));
      g.appendChild(svgEl('circle', { cx:draw.activeStart.x.toFixed(2), cy:draw.activeStart.y.toFixed(2), r:vtxR, fill:'#D4A017' }));
      // 预览线参数
      var pdx=draw.mouseMM.x-draw.activeStart.x, pdy=draw.mouseMM.y-draw.activeStart.y;
      var plen=Math.sqrt(pdx*pdx+pdy*pdy);
      var pmx=(draw.activeStart.x+draw.mouseMM.x)/2, pmy=(draw.activeStart.y+draw.mouseMM.y)/2;
      var plen2=Math.sqrt(pdx*pdx+pdy*pdy);
      var pnx=0, pny=-4/draw.zoom;
      if (plen2>0.001) { pnx=(-pdy/plen2)*4/draw.zoom; pny=(pdx/plen2)*4/draw.zoom; }
      var pt2 = svgEl('text', { x:(pmx+pnx).toFixed(2), y:(pmy+pny).toFixed(2), 'font-size':fs, fill:'#4A7A2A', 'text-anchor':'middle', 'pointer-events':'none', style:textAttr });
      pt2.textContent = fmtVal(plen)+' '+unitSuffix();
      g.appendChild(pt2);
      var pang = Math.atan2(pdy, pdx) * 180 / Math.PI;
      var pat = svgEl('text', { x:(draw.mouseMM.x+3/draw.zoom).toFixed(2), y:(draw.mouseMM.y-3/draw.zoom).toFixed(2), 'font-size':fsSm, fill:'#8B5E3C', 'pointer-events':'none', style:textAttr });
      pat.textContent = pang.toFixed(0)+'°';
      g.appendChild(pat);
    }

    var lineCount = draw.lines.length;
    var hasRegions = draw.selectedRegions.length > 0;
    $('#draw-info').textContent = '线段: '+lineCount+(hasRegions?' | 已选区域 '+draw.selectedRegions.length+'个':'')+(draw.selectedLine!==null?' | 已选线段 #'+(draw.selectedLine+1):'');

    // 更新端点坐标输入框
    var dpPx = $('#dp-px'), dpPy = $('#dp-py'), dpApplyPt = $('#dp-apply-pt');
    if (draw.selectedLine !== null && draw.lines[draw.selectedLine]) {
      var selLn2 = draw.lines[draw.selectedLine];
      var selEnd = draw.selectedEnd || '1';
      var px = selEnd === '1' ? selLn2.x1 : selLn2.x2;
      var py = selEnd === '1' ? selLn2.y1 : selLn2.y2;
      if (document.activeElement !== dpPx) dpPx.value = fmtVal(px, 1);
      if (document.activeElement !== dpPy) dpPy.value = fmtVal(py, 1);
      dpApplyPt.style.display = '';
    } else if (draw.tool==='line' && draw.activeStart) {
      if (document.activeElement !== dpPx) dpPx.value = fmtVal(draw.activeStart.x, 1);
      if (document.activeElement !== dpPy) dpPy.value = fmtVal(draw.activeStart.y, 1);
      dpApplyPt.style.display = '';
    } else {
      if (document.activeElement !== dpPx) dpPx.value = '';
      if (document.activeElement !== dpPy) dpPy.value = '';
      dpApplyPt.style.display = 'none';
    }

    // 实时更新参数面板
    var dpLen = $('#dp-length'), dpAng = $('#dp-angle');
    if (draw.tool==='line' && draw.activeStart) {
      var ddx=draw.mouseMM.x-draw.activeStart.x, ddy=draw.mouseMM.y-draw.activeStart.y;
      var dlen=Math.sqrt(ddx*ddx+ddy*ddy);
      var dang=Math.atan2(ddy, ddx) * 180 / Math.PI;
      if (document.activeElement!==dpLen) dpLen.value = fmtVal(dlen, 1);
      if (document.activeElement!==dpAng) dpAng.value = dang.toFixed(0);
    } else if (draw.tool==='edit' && draw.selectedLine!==null) {
      // 编辑模式：显示选中线段的参数
      var selLn = draw.lines[draw.selectedLine];
      if (selLn) {
        var sldx=selLn.x2-selLn.x1, sldy=selLn.y2-selLn.y1;
        var slen=Math.sqrt(sldx*sldx+sldy*sldy);
        var sang=Math.atan2(sldy, sldx) * 180 / Math.PI;
        if (document.activeElement!==dpLen) dpLen.value = fmtVal(slen, 1);
        if (document.activeElement!==dpAng) dpAng.value = sang.toFixed(0);
      }
    } else if (draw.tool==='line' && draw.lines.length>0) {
      var lastLn = draw.lines[draw.lines.length-1];
      var lldx=lastLn.x2-lastLn.x1, lldy=lastLn.y2-lastLn.y1;
      var llen3=Math.sqrt(lldx*lldx+lldy*lldy);
      var lang3=Math.atan2(lldy, lldx) * 180 / Math.PI;
      if (document.activeElement!==dpLen) dpLen.value = fmtVal(llen3, 1);
      if (document.activeElement!==dpAng) dpAng.value = lang3.toFixed(0);
    } else {
      if (document.activeElement!==dpLen) dpLen.value = '';
      if (document.activeElement!==dpAng) dpAng.value = '';
    }
  }

  // ───── 线段交点计算 ─────
  function segCross(x1,y1,x2,y2,x3,y3,x4,y4) {
    var d = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (Math.abs(d) < 1e-10) return null;
    var t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / d;
    var u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / d;
    if (t >= -0.001 && t <= 1+0.001 && u >= -0.001 && u <= 1+0.001) {
      return {x: x1 + t*(x2-x1), y: y1 + t*(y2-y1)};
    }
    return null;
  }

  // ───── 区域检测：平面图面片追踪算法 ─────
  function findRegionAt(cx, cy) {
    // 1. 收集所有线段（绘制线 + 画布边界）
    var boundary = [
      {x1:0, y1:0, x2:draw.canvasW, y2:0},
      {x1:draw.canvasW, y1:0, x2:draw.canvasW, y2:draw.canvasH},
      {x1:draw.canvasW, y1:draw.canvasH, x2:0, y2:draw.canvasH},
      {x1:0, y1:draw.canvasH, x2:0, y2:0}
    ];
    // 1a. 预处理：端点吸附到附近线段上（处理绘制精度误差，确保三角形顶点落在正方形边上）
    //     如果端点距离另一条线段<0.3mm，将端点移动到线段上最近点
    var processedLines = draw.lines.map(function(l){return{x1:l.x1,y1:l.y1,x2:l.x2,y2:l.y2};});
    var checkSegs = [];
    draw.lines.forEach(function(l,i){checkSegs.push({x1:l.x1,y1:l.y1,x2:l.x2,y2:l.y2,src:i});});
    boundary.forEach(function(b){checkSegs.push({x1:b.x1,y1:b.y1,x2:b.x2,y2:b.y2,src:-1});});
    processedLines.forEach(function(l,lidx){
      [{p:'1',x:l.x1,y:l.y1},{p:'2',x:l.x2,y:l.y2}].forEach(function(ep){
        var bestD=0.3,bestPt=null;
        checkSegs.forEach(function(s){
          if(s.src===lidx) return; // 跳过自身
          var dx=s.x2-s.x1,dy=s.y2-s.y1;
          var len2=dx*dx+dy*dy;
          if(len2<1e-10) return;
          var t=Math.max(0,Math.min(1,((ep.x-s.x1)*dx+(ep.y-s.y1)*dy)/len2));
          var px=s.x1+t*dx,py=s.y1+t*dy;
          var d=Math.sqrt((ep.x-px)*(ep.x-px)+(ep.y-py)*(ep.y-py));
          if(d<bestD&&d>0.001){bestD=d;bestPt={x:px,y:py};}
        });
        if(bestPt){
          if(ep.p==='1'){l.x1=bestPt.x;l.y1=bestPt.y;}
          else{l.x2=bestPt.x;l.y2=bestPt.y;}
        }
      });
    });
    var allSegs = processedLines.concat(boundary);

    // 2. 计算所有线段之间的交点，用于分割线段
    var segPts = allSegs.map(function(s) { return [{x:s.x1,y:s.y1}, {x:s.x2,y:s.y2}]; });
    for (var i=0; i<allSegs.length; i++) {
      for (var j=i+1; j<allSegs.length; j++) {
        var pt = segCross(allSegs[i].x1,allSegs[i].y1,allSegs[i].x2,allSegs[i].y2,
                           allSegs[j].x1,allSegs[j].y1,allSegs[j].x2,allSegs[j].y2);
        if (pt) {
          // 2a. 将接近任一线段端点的交点吸附到该端点（处理绘制精度误差）
          var epCands = [
            {x:allSegs[i].x1, y:allSegs[i].y1}, {x:allSegs[i].x2, y:allSegs[i].y2},
            {x:allSegs[j].x1, y:allSegs[j].y1}, {x:allSegs[j].x2, y:allSegs[j].y2}
          ];
          var minD = Infinity, snapC = null;
          for (var ci=0; ci<epCands.length; ci++) {
            var cd = Math.sqrt((pt.x-epCands[ci].x)**2 + (pt.y-epCands[ci].y)**2);
            if (cd < minD) { minD = cd; snapC = epCands[ci]; }
          }
          if (minD < 0.15) { pt.x = snapC.x; pt.y = snapC.y; }
          segPts[i].push(pt); segPts[j].push(pt);
        }
      }
    }

    // 3. 沿线段排序交点，生成子边
    var edges = [];
    for (var i=0; i<allSegs.length; i++) {
      var s = allSegs[i], pts = segPts[i];
      var dx=s.x2-s.x1, dy=s.y2-s.y1;
      pts.sort(function(a,b) {
        return ((a.x-s.x1)*dx+(a.y-s.y1)*dy) - ((b.x-s.x1)*dx+(b.y-s.y1)*dy);
      });
      for (var k=0; k<pts.length-1; k++) {
        if (dist(pts[k], pts[k+1]) > 0.01) {
          edges.push({a:{x:pts[k].x,y:pts[k].y}, b:{x:pts[k+1].x,y:pts[k+1].y}});
        }
      }
    }

    // 4. 构建顶点表（去重）
    var vertices = [], vMap = {};
    function getVId(pt) {
      var key = pt.x.toFixed(2)+','+pt.y.toFixed(2);
      if (vMap[key] !== undefined) return vMap[key];
      var id = vertices.length;
      vertices.push({x:pt.x, y:pt.y, neighbors:[]});
      vMap[key] = id;
      return id;
    }
    for (var i=0; i<edges.length; i++) {
      var va = getVId(edges[i].a), vb = getVId(edges[i].b);
      if (va !== vb) {
        if (vertices[va].neighbors.indexOf(vb) === -1) vertices[va].neighbors.push(vb);
        if (vertices[vb].neighbors.indexOf(va) === -1) vertices[vb].neighbors.push(va);
      }
    }

    // 5. 每个顶点的邻居按角度排序（逆时针）
    for (var i=0; i<vertices.length; i++) {
      var v = vertices[i];
      v.neighbors.sort(function(a,b) {
        return Math.atan2(vertices[a].y-v.y, vertices[a].x-v.x) - Math.atan2(vertices[b].y-v.y, vertices[b].x-v.x);
      });
    }

    // 6. 面片追踪：对每条有向边，在到达顶点处"右转"（取逆时针序列中前一个邻居）
    var faces = [], visited = {};
    for (var vi=0; vi<vertices.length; vi++) {
      for (var ni=0; ni<vertices[vi].neighbors.length; ni++) {
        var vj = vertices[vi].neighbors[ni];
        var ekey = vi+'-'+vj;
        if (visited[ekey]) continue;
        var face = [], curV = vi, nextV = vj, safety = 0;
        while (safety < 500) {
          visited[curV+'-'+nextV] = true;
          face.push(curV);
          var nbrs = vertices[nextV].neighbors;
          var pos = nbrs.indexOf(curV);
          if (pos === -1) break;
          var newV = nbrs[(pos - 1 + nbrs.length) % nbrs.length];
          curV = nextV; nextV = newV;
          if (curV === vi && nextV === vj) break;
          safety++;
        }
        if (face.length >= 3) {
          var poly = face.map(function(v) { return {x:vertices[v].x, y:vertices[v].y}; });
          // 只保留有正值有符号面积的面（内部面），排除外部面
          var sa = 0;
          for (var si=0; si<poly.length; si++) {
            var sj = (si+1) % poly.length;
            sa += poly[si].x * poly[sj].y - poly[sj].x * poly[si].y;
          }
          if (sa > 0) faces.push(poly);
        }
      }
    }

    // 7. 找到包含点击点的所有面，按面积从小到大排序
    var containingFaces = [];
    for (var i=0; i<faces.length; i++) {
      if (ptInPoly({x:cx, y:cy}, faces[i])) {
        containingFaces.push({face: faces[i], area: polyArea(faces[i]), idx: i});
      }
    }
    if (containingFaces.length === 0) return null;
    containingFaces.sort(function(a,b) { return a.area - b.area; });

    // 最小面 = 用户实际点击的面（可能是三角形内部，或外框区域）
    var clickedFace = containingFaces[0];

    // 查找完全在 clickedFace 内部的其他面（孔洞）
    var holes = [];
    for (var i=0; i<faces.length; i++) {
      if (i === clickedFace.idx) continue;
      var allInside = true;
      for (var v=0; v<faces[i].length; v++) {
        if (!ptInPoly(faces[i][v], clickedFace.face)) { allInside = false; break; }
      }
      if (allInside && polyArea(faces[i]) < clickedFace.area) {
        holes.push(faces[i]);
      }
    }

    // 返回 {outer, holes} 结构：外轮廓 + 孔洞列表（可能为空）
    // 渲染时使用 SVG path + fill-rule:evenodd，无需桥接边
    return { outer: clickedFace.face, holes: holes };
  }

  // 绘图弹窗事件
  // 右键取消当前绘制
  drawSVG.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    if (draw.activeStart) {
      draw.activeStart = null;
      $('#draw-hint').textContent = '已取消当前线段绘制。点击画布重新开始。';
      drawRender();
    }
  });

  drawSVG.addEventListener('mousedown', function(e) {
    // 中键拖拽画布
    if (e.button===1) {
      e.preventDefault();
      draw.dragging = false;
      draw._panning = true;
      draw._panStart = {x: e.clientX, y: e.clientY};
      draw._panOrig = {x: draw.panX, y: draw.panY};
      return;
    }
    if (e.button!==0) return;
    var pos = getMousePos(drawWrap, e);
    var mm = drawScreenToMM(pos.x, pos.y);
    // v5.4: 允许线段超出画布边界（不再限制坐标范围）

    if (draw.tool==='line') {
      // 画线模式：仅画线，不允许拖拽端点（端点吸附 snapToEndpoint 保证精确连接）
      if (!draw.activeStart) {
        var snappedStart = snapToEndpoint(mm);
        draw.activeStart = {x: snapVal(snappedStart.x), y: snapVal(snappedStart.y)};
        $('#draw-hint').textContent = '移动鼠标预览线段，再次点击放置终点。靠近已有端点会自动吸附。';
      } else {
        var snappedEnd = snapToEndpoint(mm);
        var x2 = snapVal(snappedEnd.x), y2 = snapVal(snappedEnd.y);
        if (dist(draw.activeStart, {x:x2,y:y2}) > 0.5) {
          draw.lines.push({x1:draw.activeStart.x, y1:draw.activeStart.y, x2:x2, y2:y2});
        }
        draw.activeStart = null;
        $('#draw-hint').textContent = '线段已添加。点击画布继续画线，或切换到「调整」编辑线段。';
      }
      drawRender();
      return;
    }

    if (draw.tool==='edit') {
      var tgt2 = e.target;
      // 点击端点 → 拖拽端点（联动所有共端点线段），不改变线条选中状态
      if (tgt2.classList.contains('draw-ep-hit')) {
        var lidx2 = parseInt(tgt2.getAttribute('data-lidx'));
        var endP2 = tgt2.getAttribute('data-end');
        draw.dragging = true; draw.dragLineIdx = lidx2; draw.dragEnd = endP2;
        // 保存撤销历史（拖拽前的状态）
        pushHistory();
        // 记录被拖拽端点的原始坐标，用于查找共端点线段
        var dragLn = draw.lines[lidx2];
        var origPt = endP2==='1' ? {x:dragLn.x1, y:dragLn.y1} : {x:dragLn.x2, y:dragLn.y2};
        draw.dragOrigPt = origPt;
        draw.dragLinked = []; // 记录所有需要联动的 {lidx, end} 对
        // 查找所有与该端点坐标相同的其他线段端点
        draw.lines.forEach(function(dl, di) {
          if (di === lidx2) return; // 跳过自身
          if (Math.abs(dl.x1 - origPt.x) < 0.01 && Math.abs(dl.y1 - origPt.y) < 0.01) {
            draw.dragLinked.push({lidx: di, end: '1'});
          }
          if (Math.abs(dl.x2 - origPt.x) < 0.01 && Math.abs(dl.y2 - origPt.y) < 0.01) {
            draw.dragLinked.push({lidx: di, end: '2'});
          }
        });
        // 延迟渲染，避免在 mousedown 事件中销毁 DOM 导致拖拽中断
        requestAnimationFrame(drawRender);
        return;
      }
      // 点击线段本体 → 选中并准备拖拽整条线段
      if (tgt2.classList.contains('draw-line') || tgt2.classList.contains('draw-line-hit')) {
        var lidx3 = parseInt(tgt2.getAttribute('data-lidx'));
        draw.selectedLine = lidx3;
        draw.selectedEnd = '1'; // 默认选中端点1，方便坐标微调
        var ln3 = draw.lines[lidx3];
        draw.dragging = true; draw.dragLineIdx = lidx3; draw.dragEnd = 'body';
        draw.dragStartMM = {x:mm.x, y:mm.y};
        draw.dragInitLine = {x1:ln3.x1, y1:ln3.y1, x2:ln3.x2, y2:ln3.y2};
        // 保存撤销历史
        pushHistory();
        $('#draw-hint').textContent = '拖拽移动线段，或拖拽端点调整长度/角度。';
        // 延迟渲染
        requestAnimationFrame(drawRender);
        return;
      }
      // 点击空白 → 取消选中
      draw.selectedLine = null;
      draw.selectedEnd = null;
      $('#draw-hint').textContent = '点击线段选中后拖拽调整，或切换模式画线/选区。';
      drawRender();
      return;
    }

    if (draw.tool==='select') {
      // 选区模式：点击画布检测闭合区域（支持多选）
      var region = findRegionAt(mm.x, mm.y);
      if (region && region.outer && region.outer.length>=3) {
        // 检查是否已选中该区域（通过比较外轮廓质心位置）
        var centroid = {x: region.outer.reduce(function(s,v){return s+v.x;},0)/region.outer.length, y: region.outer.reduce(function(s,v){return s+v.y;},0)/region.outer.length};
        var existingIdx = draw.selectedRegions.findIndex(function(r) {
          if (!r || !r.outer || r.outer.length < 3) return false;
          var rc = {x: r.outer.reduce(function(s,v){return s+v.x;},0)/r.outer.length, y: r.outer.reduce(function(s,v){return s+v.y;},0)/r.outer.length};
          return dist(centroid, rc) < 0.5;
        });
        if (existingIdx >= 0) {
          // 已选中 → 取消选中
          draw.selectedRegions.splice(existingIdx, 1);
          $('#draw-hint').textContent = '已取消选中区域。当前已选 '+draw.selectedRegions.length+' 个区域。';
        } else {
          // 新选中 → 添加到列表
          draw.selectedRegions.push(region);
          var holeStr = region.holes.length > 0 ? '（含'+region.holes.length+'个孔洞）' : '';
          $('#draw-hint').textContent = '已选中区域（'+region.outer.length+'边'+holeStr+'）。当前已选 '+draw.selectedRegions.length+' 个区域。点击其他区域继续添加，或点击「保存到零件库」批量保存。';
        }
      } else {
        // 点击空白 → 清除所有选中
        if (draw.selectedRegions.length > 0) {
          draw.selectedRegions = [];
          $('#draw-hint').textContent = '已清除所有选中区域。点击画布内闭合区域来选择。';
        } else {
          $('#draw-hint').textContent = '未检测到闭合区域，请先画线划分区域。';
        }
      }
      drawRender();
      return;
    }
  });

  drawSVG.addEventListener('mousemove', function(e) {
    // 中键拖拽画布
    if (draw._panning) {
      draw.panX = draw._panOrig.x + (e.clientX - draw._panStart.x);
      draw.panY = draw._panOrig.y + (e.clientY - draw._panStart.y);
      drawRender();
      return;
    }
    var pos = getMousePos(drawWrap, e);
    draw.mouseMM = drawScreenToMM(pos.x, pos.y);

    // 坐标提示
    var tipEl = $('#draw-coord-tip');
    var cx = draw.mouseMM.x, cy = draw.mouseMM.y;
    tipEl.style.display = '';
    tipEl.style.left = pos.x + 'px';
    tipEl.style.top = pos.y + 'px';
    tipEl.innerHTML = '<span class="coord-label">X:</span> '+fmtVal(cx)+' <span class="coord-label">Y:</span> '+fmtVal(cy)+' '+unitSuffix();

    if (draw.dragging && draw.dragLineIdx!==null) {
      var ln = draw.lines[draw.dragLineIdx];
      if (ln) {
        if (draw.dragEnd==='1' || draw.dragEnd==='2') {
          // 拖拽端点：不自动吸附（避免干扰手动对齐），仅应用网格对齐
          var nx = snapVal(cx), ny = snapVal(cy);
          if (draw.dragEnd==='1') { ln.x1=nx; ln.y1=ny; }
          else { ln.x2=nx; ln.y2=ny; }
          // 联动更新所有共享该端点的线段
          if (draw.dragLinked && draw.dragLinked.length > 0) {
            draw.dragLinked.forEach(function(link) {
              var ll = draw.lines[link.lidx];
              if (ll) {
                if (link.end==='1') { ll.x1=nx; ll.y1=ny; }
                else { ll.x2=nx; ll.y2=ny; }
              }
            });
          }
          draw.selectedRegions = [];
          drawRender();
        }
        else if (draw.dragEnd==='body' && draw.dragInitLine && draw.dragStartMM) {
          // 拖拽整条线段（不限制画布边界）
          var ddx = cx - draw.dragStartMM.x, ddy = cy - draw.dragStartMM.y;
          ln.x1 = draw.dragInitLine.x1 + ddx;
          ln.y1 = draw.dragInitLine.y1 + ddy;
          ln.x2 = draw.dragInitLine.x2 + ddx;
          ln.y2 = draw.dragInitLine.y2 + ddy;
          draw.selectedRegions = [];
          drawRender();
        }
      }
      return;
    }
    // 检测鼠标是否悬停在已有端点附近（所有模式均高亮显示）
    if (!draw.dragging) {
      var oldHover = draw.hoverEp;
      draw.hoverEp = null;
      var hoverR = 4; // 悬停检测半径(mm)
      draw.lines.forEach(function(dl, di) {
        if (Math.abs(dl.x1 - cx) < hoverR && Math.abs(dl.y1 - cy) < hoverR) {
          if (Math.sqrt((dl.x1-cx)**2+(dl.y1-cy)**2) < hoverR) draw.hoverEp = {x:dl.x1, y:dl.y1};
        }
        if (Math.abs(dl.x2 - cx) < hoverR && Math.abs(dl.y2 - cy) < hoverR) {
          if (Math.sqrt((dl.x2-cx)**2+(dl.y2-cy)**2) < hoverR) draw.hoverEp = {x:dl.x2, y:dl.y2};
        }
      });
      if (draw.activeStart || oldHover || draw.hoverEp) {
        drawRender();
      }
    }
  });

  drawSVG.addEventListener('mouseup', function(e) {
    draw.dragging=false; draw.dragLineIdx=null; draw.dragEnd=null;
    draw.dragStartMM=null; draw.dragInitLine=null;
    draw.dragOrigPt=null; draw.dragLinked=null;
    draw._panning=false; draw._panStart=null; draw._panOrig=null;
  });
  drawSVG.addEventListener('mouseleave', function(){ $('#draw-coord-tip').style.display='none'; draw._panning=false; });

  drawSVG.addEventListener('wheel', function(e) {
    e.preventDefault();
    var pos = getMousePos(drawWrap, e);
    var mmBefore = drawScreenToMM(pos.x, pos.y);
    var f = e.deltaY<0 ? 1.12 : 1/1.12;
    draw.zoom = Math.max(0.1, Math.min(20, draw.zoom*f));
    draw.panX = pos.x - mmBefore.x*draw.zoom;
    draw.panY = pos.y - mmBefore.y*draw.zoom;
    drawRender();
  }, { passive:false });

  // 绘图工具按钮
  document.querySelectorAll('.dtool-btn[data-dtool]').forEach(function(btn){
    btn.addEventListener('click', function(){
      draw.tool = this.getAttribute('data-dtool');
      draw.activeStart = null;
      if (draw.tool !== 'edit') draw.selectedLine = null;
      updateDrawToolButtons();
      updateDrawCursor();
      if (draw.tool==='line') {
        $('#draw-hint').textContent = '点击画布放置线段起点，移动后再次点击放置终点';
      } else if (draw.tool==='edit') {
        $('#draw-hint').textContent = '点击线段选中，拖拽端点调整长度/角度，拖拽线段本体移动位置';
      } else if (draw.tool==='select') {
        $('#draw-hint').textContent = '点击画布内闭合区域来选择（可多选），选中后可批量保存为零件';
      }
      drawRender();
    });
  });

  $('#btn-undo-vertex').addEventListener('click', function(){
    undoDraw();
  });
  $('#btn-redo-vertex').addEventListener('click', function(){
    redoDraw();
  });
  $('#btn-clear-draw').addEventListener('click', function(){
    draw.lines=[]; draw.activeStart=null; draw.selectedRegions=[]; draw.selectedLine=null; draw.tool='line';
    draw.history=[]; draw.historyIdx=-1;
    updateDrawToolButtons();
    updateDrawCursor();
    $('#draw-hint').textContent = '点击画布放置线段起点，移动后再次点击放置终点';
    drawRender();
  });
  $('#btn-close-draw').addEventListener('click', closeDrawModal);
  $('#btn-cancel-draw').addEventListener('click', closeDrawModal);
  $('#btn-open-draw').addEventListener('click', openDrawModal);
  $('#btn-new-part').addEventListener('click', openDrawModal);

  // 画布尺寸设置
  $('#btn-apply-size').addEventListener('click', function(){
    var w = fromDisplay(parseFloat($('#draw-canvas-w').value)||50);
    var h = fromDisplay(parseFloat($('#draw-canvas-h').value)||50);
    draw.canvasW = Math.max(1, w);
    draw.canvasH = Math.max(1, h);
    drawFit();
  });
  document.querySelectorAll('.preset-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var size = fromDisplay(parseFloat(this.getAttribute('data-size')));
      draw.canvasW = size; draw.canvasH = size;
      $('#draw-canvas-w').value = this.getAttribute('data-size');
      $('#draw-canvas-h').value = this.getAttribute('data-size');
      drawFit();
    });
  });

  $('#btn-save-part').addEventListener('click', function(){
    if (!draw.selectedRegions || draw.selectedRegions.length===0) {
      showToast('请先在「选区」模式下选择至少一个闭合区域');
      return;
    }
    var baseName = $('#draw-name').value || ('零件 ' + nest.nextPartId);
    var saved = 0;
    draw.selectedRegions.forEach(function(reg, idx) {
      if (reg && reg.outer && reg.outer.length>=3) {
        var name = draw.selectedRegions.length > 1 ? baseName + '-' + (idx+1) : baseName;
        var part = addPart(reg.outer.slice(), name, reg.holes.map(function(h){return h.slice();}));
        var inst = addInstToCanvas(part.id, 5 + (idx % 5) * 12, 5 + Math.floor(idx / 5) * 12, 0);
        saved++;
      }
    });
    if (saved > 0) {
      selectInst(nest.instances[nest.instances.length - 1].id);
      nestRender();
      closeDrawModal();
      showToast('已保存 ' + saved + ' 个零件到零件库');
    }
  });

  // 绘图参数面板 — 按长度+角度调整线段
  $('#dp-apply').addEventListener('click', function(){
    var len = fromDisplay(parseFloat($('#dp-length').value)||0);
    var ang = parseFloat($('#dp-angle').value)||0;
    if (len<=0) { showToast('请输入有效长度'); return; }
    var rad = ang * Math.PI / 180;
    if (draw.tool==='line' && draw.activeStart) {
      // 正在画线：按参数放置终点（不限制画布边界）
      var nx = draw.activeStart.x + len * Math.cos(rad);
      var ny = draw.activeStart.y + len * Math.sin(rad);
      draw.lines.push({x1:draw.activeStart.x, y1:draw.activeStart.y, x2:nx, y2:ny});
      draw.activeStart = null;
      draw.selectedRegions = [];
      drawRender();
      showToast('已放置线段: '+fmtVal(len)+unitSuffix()+'，'+ang.toFixed(0)+'°');
    } else if (draw.tool==='edit' && draw.selectedLine!==null) {
      // 编辑模式：修改选中线段（保持起点不变，按参数重设终点，不限制画布边界）
      pushHistory();
      var selLn = draw.lines[draw.selectedLine];
      selLn.x2 = selLn.x1 + len * Math.cos(rad);
      selLn.y2 = selLn.y1 + len * Math.sin(rad);
      draw.selectedRegions = [];
      drawRender();
      showToast('已调整线段 #'+(draw.selectedLine+1)+': '+fmtVal(len)+unitSuffix()+'，'+ang.toFixed(0)+'°');
    } else if (draw.tool==='line' && draw.lines.length>0) {
      // 画线模式：修改最后一条线的长度和角度（保持起点不变，不限制画布边界）
      pushHistory();
      var lastLn = draw.lines[draw.lines.length-1];
      lastLn.x2 = lastLn.x1 + len * Math.cos(rad);
      lastLn.y2 = lastLn.y1 + len * Math.sin(rad);
      draw.selectedRegions = [];
      drawRender();
      showToast('已调整最后线段: '+fmtVal(len)+unitSuffix()+'，'+ang.toFixed(0)+'°');
    } else {
      showToast('请先点击画布放置线段起点');
    }
  });
  $('#dp-angle').addEventListener('keydown', function(e){
    if (e.key==='Enter') { e.preventDefault(); $('#dp-apply').click(); }
  });
  $('#dp-length').addEventListener('keydown', function(e){
    if (e.key==='Enter') { e.preventDefault(); $('#dp-angle').focus(); }
  });
  // 端点坐标应用
  $('#dp-apply-pt').addEventListener('click', function(){
    var nx = fromDisplay(parseFloat($('#dp-px').value)||0);
    var ny = fromDisplay(parseFloat($('#dp-py').value)||0);
    if (draw.tool==='edit' && draw.selectedLine!==null) {
      var ln = draw.lines[draw.selectedLine];
      if (ln) {
        pushHistory(); // 保存撤销历史
        var end = draw.selectedEnd || '1';
        var origPt = end==='1' ? {x:ln.x1, y:ln.y1} : {x:ln.x2, y:ln.y2};
        if (end==='1') { ln.x1=nx; ln.y1=ny; }
        else { ln.x2=nx; ln.y2=ny; }
        // 联动更新所有共享该端点的线段
        draw.lines.forEach(function(dl, di) {
          if (di === draw.selectedLine) return;
          if (Math.abs(dl.x1 - origPt.x) < 0.01 && Math.abs(dl.y1 - origPt.y) < 0.01) { dl.x1=nx; dl.y1=ny; }
          if (Math.abs(dl.x2 - origPt.x) < 0.01 && Math.abs(dl.y2 - origPt.y) < 0.01) { dl.x2=nx; dl.y2=ny; }
        });
        draw.selectedRegions = [];
        drawRender();
        showToast('已修改端点坐标: '+fmtVal(nx)+', '+fmtVal(ny)+' '+unitSuffix());
      }
    } else if (draw.tool==='line' && draw.activeStart) {
      draw.activeStart.x = nx;
      draw.activeStart.y = ny;
      drawRender();
      showToast('已修改起点坐标: '+fmtVal(nx)+', '+fmtVal(ny)+' '+unitSuffix());
    } else {
      showToast('请先选中线段端点');
    }
  });
  $('#dp-px').addEventListener('keydown', function(e){
    if (e.key==='Enter') { e.preventDefault(); $('#dp-py').focus(); }
  });
  $('#dp-py').addEventListener('keydown', function(e){
    if (e.key==='Enter') { e.preventDefault(); $('#dp-apply-pt').click(); }
  });

  // ───── Toast ─────
  function showToast(msg) {
    var ex = document.querySelector('.toast'); if (ex) ex.remove();
    var el = document.createElement('div'); el.className='toast'; el.textContent=msg;
    document.body.appendChild(el);
    setTimeout(function(){ if(el.parentNode) el.remove(); }, 2600);
  }

  // ───── 键盘 ─────
  document.addEventListener('keydown', function(e) {
    if (draw.open) {
      if (e.key==='Escape') closeDrawModal();
      if (e.key==='z' && e.ctrlKey) { e.preventDefault(); undoDraw(); }
      if (e.key==='y' && e.ctrlKey) { e.preventDefault(); redoDraw(); }
      return;
    }
    // Ctrl+C 复制选中零件
    if (e.key==='c' && e.ctrlKey && nest.selId) {
      var ci = getInst(nest.selId);
      if (ci) {
        nest.clipboard = { partId: ci.partId, rotation: ci.rotation, scale: ci.scale||1 };
        showToast('已复制零件');
        e.preventDefault();
      }
    }
    // Ctrl+V 粘贴零件
    if (e.key==='v' && e.ctrlKey && nest.clipboard) {
      var cb = nest.clipboard;
      var off = (nest.instances.length % 8) * 15;
      var newInst = addInstToCanvas(cb.partId, 10+off, 10+off, cb.rotation, nest.currentPage);
      newInst.scale = cb.scale;
      newInst.nested = false;
      selectInst(newInst.id);
      nestRender();
      updatePartsList();
      showToast('已粘贴零件');
      e.preventDefault();
    }
    if (e.key==='Escape') { selectInst(null); nestRender(); }
    if ((e.key==='Delete'||e.key==='Backspace') && nest.selId) { deleteInst(nest.selId); }
  });

  window.addEventListener('resize', function(){ nestFit(); if(draw.open) drawFit(); });

  // ───── 初始化 ─────
  function init() {
    updateAllUnitLabels();
    nestFit();
    updatePartsList();
    showToast('欢迎使用轻作智排！');
  }
  init();
})();