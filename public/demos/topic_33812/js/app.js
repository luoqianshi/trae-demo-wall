
/* ══════════════════════════════════════
   Pixel Studio — 像素动画编辑器
   ══════════════════════════════════════ */

// ── 状态 ──
let canvasW = 16, canvasH = 16;
let pixelSize = 20;
let frames = []; // Array of { layers: [{ data, name, visible, opacity }], duration: number }
let currentFrame = 0;
let activeLayerIndex = 0;
let primaryColor = '#222222';
let secondaryColor = '#ffffff';
let currentTool = 'pencil';
let onionMode = 'prev';
let onionFrameCount = 1;
let onionOpacity = 40;
let fps = 8;
let isPlaying = false;
let playTimer = null;
let panX = 0, panY = 0;
let spacePressed = false;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let panStartPanX = 0, panStartPanY = 0;
let brushSize = 1;
let showGrid = true;
let cursorPixelX = -1, cursorPixelY = -1;
let mouseOnCanvas = false;
let undoStack = [];
let redoStack = [];
const MAX_UNDO = 100;
let moveOffsetX = 0, moveOffsetY = 0;
let shapeFill = false;
let shapePreview = null;
let shapeStartX = -1, shapeStartY = -1;
let shapeDragging = false;
let shapeColor = '#222222';
let shapeErase = false;
let symmetryMode = 'none';
let selection = { active: false, x: 0, y: 0, w: 0, h: 0, data: null, originalData: null, offsetX: 0, offsetY: 0, creating: false, dragging: false, isCut: false, startX: 0, startY: 0, rotation: 0, scaleX: 1, scaleY: 1, handleDragging: null, handleStartX: 0, handleStartY: 0, handleStartRotation: 0, handleStartScaleX: 1, handleStartScaleY: 1, handleStartOffsetX: 0, handleStartOffsetY: 0, handleStartW: 0, handleStartH: 0, cutX: 0, cutY: 0, cutW: 0, cutH: 0 };
let marchingAntsOffset = 0;
let marchingAntsTimer = null;
let clipboard = null;
let customColors = [];
let tilePreview = false;
let tileCount = 3;
let referenceImage = null;
let referenceOpacity = 0.3;
// 帧多选状态(Task 2)
let selectedFrameIndices = new Set();
let lastFrameClickIndex = -1;
// 悬浮预览窗状态
let floatingPreviewVisible = false;
let floatingPreviewW = 320, floatingPreviewH = 320;
let floatingPreviewX = 100, floatingPreviewY = 100;

// ── DOM ──
const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');
const canvasArea = document.getElementById('canvasArea');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

// ── 预设调色板 ──
const paletteColors = [
  '#000000','#ffffff','#9d9d9d','#be2633','#e06f8b','#493c2b','#a46422','#eb8931',
  '#f7e26b','#2f484e','#44891a','#a3ce27','#1b2632','#005784','#31a2f2','#b2dcef',
  '#3a2c2b','#602a1f','#b53226','#f58970','#fac8b3','#283e32','#407345','#60b04e',
  '#8cd75f','#cfe88e','#272744','#4e4f8b','#7475cd','#9da3e5','#c8bee3','#dde2ff',
];

function buildPalette() {
  const grid = document.getElementById('paletteGrid');
  grid.innerHTML = '';
  paletteColors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'swatch';
    div.style.background = c;
    if (c === primaryColor) div.classList.add('active');
    div.onclick = () => setPrimaryColor(c);
    div.oncontextmenu = e => { e.preventDefault(); secondaryColor = c; updateColorSwatches(); };
    grid.appendChild(div);
  });
  customColors.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'swatch custom-color';
    div.style.background = c;
    if (c === primaryColor) div.classList.add('active');
    div.onclick = () => setPrimaryColor(c);
    div.oncontextmenu = e => { e.preventDefault(); if (confirm('删除自定义颜色 "' + c + '"？')) removeCustomColor(i); };
    div.title = c + ' (右键删除)';
    grid.appendChild(div);
  });
}

function addCustomColor() {
  if (customColors.includes(primaryColor)) { toast('该颜色已在自定义调色板中'); return; }
  customColors.push(primaryColor);
  saveCustomColors();
  buildPalette();
  toast('已添加自定义颜色');
}

function removeCustomColor(index) {
  customColors.splice(index, 1);
  saveCustomColors();
  buildPalette();
  toast('已删除自定义颜色');
}

function saveCustomColors() {
  try { localStorage.setItem('pixelStudio_customColors', JSON.stringify(customColors)); } catch(e) {}
}

function loadCustomColors() {
  try { const d = localStorage.getItem('pixelStudio_customColors'); if (d) customColors = JSON.parse(d); } catch(e) { customColors = []; }
}

function setPrimaryColor(c) {
  primaryColor = c;
  document.getElementById('colorPicker').value = c;
  updateColorSwatches();
  buildPalette();
}

function updateColorSwatches() {
  document.getElementById('primarySwatch').style.background = primaryColor;
  document.getElementById('secondarySwatch').style.background = secondaryColor;
}

// ── 帧数据结构 ──
function createEmptyData(w, h) { return new Uint8ClampedArray(w * h * 4); }

function createFrame(w, h, fillColor) {
  const data = createEmptyData(w, h);
  if (fillColor) {
    const [r, g, b] = hexToRgb(fillColor);
    for (let i = 0; i < w * h; i++) { data[i*4]=r; data[i*4+1]=g; data[i*4+2]=b; data[i*4+3]=255; }
  }
  return { layers: [{ data, name: 'Layer 1', visible: true, opacity: 1 }], duration: 1 };
}

function cloneFrame(frame) {
  return {
    layers: frame.layers.map(l => ({ data: new Uint8ClampedArray(l.data), name: l.name, visible: l.visible, opacity: l.opacity })),
    duration: frame.duration
  };
}

function compositeFrame(frameIdx) {
  const frame = frames[frameIdx];
  const w = canvasW, h = canvasH;
  const result = createEmptyData(w, h);
  for (let li = 0; li < frame.layers.length; li++) {
    const layer = frame.layers[li];
    if (!layer.visible) continue;
    const opacity = layer.opacity;
    const ld = layer.data;
    for (let i = 0; i < w * h; i++) {
      const si = i * 4;
      const srcA = ld[si + 3] / 255 * opacity;
      if (srcA === 0) continue;
      const dstA = result[si + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA === 0) continue;
      result[si]     = (ld[si]     * srcA + result[si]     * dstA * (1 - srcA)) / outA;
      result[si + 1] = (ld[si + 1] * srcA + result[si + 1] * dstA * (1 - srcA)) / outA;
      result[si + 2] = (ld[si + 2] * srcA + result[si + 2] * dstA * (1 - srcA)) / outA;
      result[si + 3] = outA * 255;
    }
  }
  return result;
}

function currentLayerData() {
  const frame = frames[currentFrame];
  if (!frame || !frame.layers[activeLayerIndex]) return null;
  return frame.layers[activeLayerIndex].data;
}

function hexToRgb(hex) { const v = parseInt(hex.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }

function initFrames(w, h) {
  frames = [createFrame(w, h)];
  currentFrame = 0;
  activeLayerIndex = 0;
  moveOffsetX = 0; moveOffsetY = 0;
  clearHistory();
}

function clearHistory() { undoStack = []; redoStack = []; }

function pushHistory() {
  undoStack.push({ frameIndex: currentFrame, frame: cloneFrame(frames[currentFrame]), activeLayerIndex });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
}

// ── 图层管理 ──
function addLayer() {
  pushHistory();
  const frame = frames[currentFrame];
  frame.layers.splice(activeLayerIndex + 1, 0, { data: createEmptyData(canvasW, canvasH), name: 'Layer ' + (frame.layers.length + 1), visible: true, opacity: 1 });
  activeLayerIndex++;
  render();
  toast('已添加图层');
}

function deleteLayer() {
  const frame = frames[currentFrame];
  if (frame.layers.length <= 1) { toast('至少保留一个图层'); return; }
  pushHistory();
  frame.layers.splice(activeLayerIndex, 1);
  if (activeLayerIndex >= frame.layers.length) activeLayerIndex = frame.layers.length - 1;
  render();
  toast('已删除图层');
}

function moveLayerUp() {
  const frame = frames[currentFrame];
  if (activeLayerIndex >= frame.layers.length - 1) return;
  pushHistory();
  [frame.layers[activeLayerIndex], frame.layers[activeLayerIndex + 1]] = [frame.layers[activeLayerIndex + 1], frame.layers[activeLayerIndex]];
  activeLayerIndex++;
  render();
}

function moveLayerDown() {
  if (activeLayerIndex <= 0) return;
  pushHistory();
  const frame = frames[currentFrame];
  [frame.layers[activeLayerIndex], frame.layers[activeLayerIndex - 1]] = [frame.layers[activeLayerIndex - 1], frame.layers[activeLayerIndex]];
  activeLayerIndex--;
  render();
}

function mergeDown() {
  if (activeLayerIndex <= 0) { toast('没有下方图层可合并'); return; }
  pushHistory();
  const frame = frames[currentFrame];
  const upper = frame.layers[activeLayerIndex];
  const lower = frame.layers[activeLayerIndex - 1];
  const w = canvasW, h = canvasH;
  for (let i = 0; i < w * h; i++) {
    const si = i * 4;
    const srcA = upper.data[si + 3] / 255 * upper.opacity;
    if (srcA === 0) continue;
    const dstA = lower.data[si + 3] / 255 * lower.opacity;
    const outA = srcA + dstA * (1 - srcA);
    if (outA === 0) continue;
    lower.data[si]     = (upper.data[si]     * srcA + lower.data[si]     * dstA * (1 - srcA)) / outA;
    lower.data[si + 1] = (upper.data[si + 1] * srcA + lower.data[si + 1] * dstA * (1 - srcA)) / outA;
    lower.data[si + 2] = (upper.data[si + 2] * srcA + lower.data[si + 2] * dstA * (1 - srcA)) / outA;
    lower.data[si + 3] = outA * 255;
  }
  lower.opacity = 1;
  frame.layers.splice(activeLayerIndex, 1);
  activeLayerIndex--;
  render();
  toast('已向下合并图层');
}

function toggleLayerVisibility(layerIdx) {
  frames[currentFrame].layers[layerIdx].visible = !frames[currentFrame].layers[layerIdx].visible;
  render();
}

function setLayerOpacity(layerIdx, opacity) {
  frames[currentFrame].layers[layerIdx].opacity = opacity;
  render();
}

function setActiveLayer(idx) {
  if (idx >= 0 && idx < frames[currentFrame].layers.length) { activeLayerIndex = idx; render(); }
}

function updateLayerList() {
  const list = document.getElementById('layerList');
  list.innerHTML = '';
  const frame = frames[currentFrame];
  if (!frame) return;
  for (let i = frame.layers.length - 1; i >= 0; i--) {
    const layer = frame.layers[i];
    const div = document.createElement('div');
    div.className = 'layer-item' + (i === activeLayerIndex ? ' active' : '');
    div.onclick = (e) => { if (e.target.classList.contains('layer-vis') || e.target.tagName === 'INPUT') return; setActiveLayer(i); };
    const vis = document.createElement('button');
    vis.className = 'layer-vis' + (layer.visible ? '' : ' hidden');
    vis.textContent = layer.visible ? '👁' : '—';
    vis.onclick = (e) => { e.stopPropagation(); toggleLayerVisibility(i); };
    div.appendChild(vis);
    const nameInput = document.createElement('input');
    nameInput.className = 'layer-name';
    nameInput.value = layer.name;
    nameInput.onchange = function() { layer.name = this.value; };
    nameInput.onclick = (e) => e.stopPropagation();
    div.appendChild(nameInput);
    const opSlider = document.createElement('input');
    opSlider.type = 'range'; opSlider.className = 'layer-opacity-slider';
    opSlider.min = 0; opSlider.max = 100; opSlider.value = Math.round(layer.opacity * 100);
    opSlider.oninput = function() { setLayerOpacity(i, +this.value / 100); };
    opSlider.onclick = (e) => e.stopPropagation();
    div.appendChild(opSlider);
    list.appendChild(div);
  }
}

// ── 帧翻转/旋转 ──
function flipFrameH() {
  pushHistory();
  const w = canvasW, h = canvasH;
  frames[currentFrame].layers.forEach(layer => {
    const data = layer.data, copy = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = (y*w+x)*4, di = (y*w+(w-1-x))*4;
      data[di]=copy[si]; data[di+1]=copy[si+1]; data[di+2]=copy[si+2]; data[di+3]=copy[si+3];
    }
  });
  render(); toast('已水平翻转');
}

function flipFrameV() {
  pushHistory();
  const w = canvasW, h = canvasH;
  frames[currentFrame].layers.forEach(layer => {
    const data = layer.data, copy = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = (y*w+x)*4, di = ((h-1-y)*w+x)*4;
      data[di]=copy[si]; data[di+1]=copy[si+1]; data[di+2]=copy[si+2]; data[di+3]=copy[si+3];
    }
  });
  render(); toast('已垂直翻转');
}

function rotateFrameCW() {
  pushHistory();
  const oldW = canvasW, oldH = canvasH, newW = oldH, newH = oldW;

  // Rotate current frame's layers
  const frame = frames[currentFrame];
  frame.layers.forEach(layer => {
    const newData = createEmptyData(newW, newH);
    for (let y = 0; y < oldH; y++) for (let x = 0; x < oldW; x++) {
      const si = (y * oldW + x) * 4, di = (x * newW + (oldH - 1 - y)) * 4;
      newData[di] = layer.data[si]; newData[di+1] = layer.data[si+1]; newData[di+2] = layer.data[si+2]; newData[di+3] = layer.data[si+3];
    }
    layer.data = newData;
  });

  // If dimensions changed, resize other frames (keep content in top-left)
  if (newW !== oldW || newH !== oldH) {
    canvasW = newW; canvasH = newH;
    frames.forEach((f, i) => {
      if (i === currentFrame) return; // already rotated
      f.layers.forEach(layer => {
        const newData = createEmptyData(newW, newH);
        const minW = Math.min(oldW, newW), minH = Math.min(oldH, newH);
        for (let y = 0; y < minH; y++) for (let x = 0; x < minW; x++) {
          const si = (y * oldW + x) * 4, di = (y * newW + x) * 4;
          newData[di] = layer.data[si]; newData[di+1] = layer.data[si+1]; newData[di+2] = layer.data[si+2]; newData[di+3] = layer.data[si+3];
        }
        layer.data = newData;
      });
    });
    document.getElementById('canvasW').value = canvasW;
    document.getElementById('canvasH').value = canvasH;
  }

  activeLayerIndex = Math.min(activeLayerIndex, frame.layers.length - 1);
  render(); toast('已顺时针旋转90°');
}

function rotateFrameCCW() {
  pushHistory();
  const oldW = canvasW, oldH = canvasH, newW = oldH, newH = oldW;

  // Rotate current frame's layers
  const frame = frames[currentFrame];
  frame.layers.forEach(layer => {
    const newData = createEmptyData(newW, newH);
    for (let y = 0; y < oldH; y++) for (let x = 0; x < oldW; x++) {
      const si = (y * oldW + x) * 4, di = ((oldW - 1 - x) * newW + y) * 4;
      newData[di] = layer.data[si]; newData[di+1] = layer.data[si+1]; newData[di+2] = layer.data[si+2]; newData[di+3] = layer.data[si+3];
    }
    layer.data = newData;
  });

  // If dimensions changed, resize other frames (keep content in top-left)
  if (newW !== oldW || newH !== oldH) {
    canvasW = newW; canvasH = newH;
    frames.forEach((f, i) => {
      if (i === currentFrame) return; // already rotated
      f.layers.forEach(layer => {
        const newData = createEmptyData(newW, newH);
        const minW = Math.min(oldW, newW), minH = Math.min(oldH, newH);
        for (let y = 0; y < minH; y++) for (let x = 0; x < minW; x++) {
          const si = (y * oldW + x) * 4, di = (y * newW + x) * 4;
          newData[di] = layer.data[si]; newData[di+1] = layer.data[si+1]; newData[di+2] = layer.data[si+2]; newData[di+3] = layer.data[si+3];
        }
        layer.data = newData;
      });
    });
    document.getElementById('canvasW').value = canvasW;
    document.getElementById('canvasH').value = canvasH;
  }

  activeLayerIndex = Math.min(activeLayerIndex, frame.layers.length - 1);
  render(); toast('已逆时针旋转90°');
}

// ── 对称模式 ──
function getSymmetryPoints(x, y) {
  const points = [{x, y}];
  if (symmetryMode === 'horizontal' || symmetryMode === 'quad') points.push({x: canvasW - 1 - x, y});
  if (symmetryMode === 'vertical' || symmetryMode === 'quad') points.push({x, y: canvasH - 1 - y});
  if (symmetryMode === 'quad') points.push({x: canvasW - 1 - x, y: canvasH - 1 - y});
  const seen = new Set();
  return points.filter(p => { const key = p.x+','+p.y; if (seen.has(key)) return false; seen.add(key); return true; });
}

function setSymmetryMode(mode) {
  symmetryMode = mode;
  document.getElementById('symNoneBtn').classList.toggle('active', mode==='none');
  document.getElementById('symHBtn').classList.toggle('active', mode==='horizontal');
  document.getElementById('symVBtn').classList.toggle('active', mode==='vertical');
  document.getElementById('symQBtn').classList.toggle('active', mode==='quad');
  const labels = {none:'镜像关', horizontal:'水平镜像', vertical:'垂直镜像', quad:'四向镜像'};
  toast('🪞 ' + labels[mode]);
  render();
}

function toggleShapeFill() { shapeFill = !shapeFill; const btn = document.getElementById('shapeFillBtn'); btn.textContent = shapeFill ? '◼' : '◻'; btn.classList.toggle('active', shapeFill); }

// ── 形状像素计算 ──
function getLinePixels(x0, y0, x1, y1) {
  const pixels = [], dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
  const sx = x0<x1?1:-1, sy = y0<y1?1:-1; let err = dx-dy, cx=x0, cy=y0;
  while (true) { pixels.push({x:cx,y:cy}); if (cx===x1&&cy===y1) break; const e2=2*err; if(e2>-dy){err-=dy;cx+=sx;} if(e2<dx){err+=dx;cy+=sy;} }
  return pixels;
}

function getRectPixels(x0, y0, x1, y1, filled) {
  const pixels = [], minX=Math.min(x0,x1), maxX=Math.max(x0,x1), minY=Math.min(y0,y1), maxY=Math.max(y0,y1);
  if (filled) { for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) pixels.push({x,y}); }
  else { for(let x=minX;x<=maxX;x++){pixels.push({x,y:minY});if(minY!==maxY)pixels.push({x,y:maxY});} for(let y=minY+1;y<maxY;y++){pixels.push({x:minX,y});if(minX!==maxX)pixels.push({x:maxX,y});} }
  return pixels;
}

function getCirclePixels(cx, cy, rx, ry, filled) {
  const pixels = [], set = new Set();
  function addPixel(x,y){const key=x+','+y;if(!set.has(key)){set.add(key);pixels.push({x,y});}}
  rx=Math.abs(rx);ry=Math.abs(ry);
  if(rx===0&&ry===0){addPixel(cx,cy);return pixels;}
  if(rx===0){for(let y=-ry;y<=ry;y++)addPixel(cx,cy+y);return pixels;}
  if(ry===0){for(let x=-rx;x<=rx;x++)addPixel(cx+x,cy);return pixels;}
  if(filled){for(let y=-ry;y<=ry;y++){const yy=y/ry;const xE=rx*Math.sqrt(Math.max(0,1-yy*yy));for(let x=Math.round(-xE);x<=Math.round(xE);x++)addPixel(cx+x,cy+y);}}
  else{const steps=Math.max(rx,ry)*8;for(let i=0;i<steps;i++){const a=(2*Math.PI*i)/steps;addPixel(cx+Math.round(rx*Math.cos(a)),cy+Math.round(ry*Math.sin(a)));}}
  return pixels;
}

function calculateShapePixels(tool, x0, y0, x1, y1, filled) {
  if(tool==='line')return getLinePixels(x0,y0,x1,y1);
  if(tool==='rect')return getRectPixels(x0,y0,x1,y1,filled);
  if(tool==='circle'){const cx=Math.round((x0+x1)/2),cy=Math.round((y0+y1)/2),rx=Math.round(Math.abs(x1-x0)/2),ry=Math.round(Math.abs(y1-y0)/2);return getCirclePixels(cx,cy,Math.max(0,rx),Math.max(0,ry),filled);}
  return [];
}

// ── 选区工具 ──
function extractSelectionData(frameData, selX, selY, selW, selH) {
  const data = new Uint8ClampedArray(selW * selH * 4);
  for (let y=0;y<selH;y++) for(let x=0;x<selW;x++){const fx=selX+x,fy=selY+y;if(fx>=0&&fy>=0&&fx<canvasW&&fy<canvasH){const si=(fy*canvasW+fx)*4,di=(y*selW+x)*4;data[di]=frameData[si];data[di+1]=frameData[si+1];data[di+2]=frameData[si+2];data[di+3]=frameData[si+3];}}
  return data;
}

function finalizeSelection(x1, y1, x2, y2) {
  const sx=Math.min(x1,x2),sy=Math.min(y1,y2),sw=Math.abs(x2-x1)+1,sh=Math.abs(y2-y1)+1;
  if(sw<1||sh<1)return;
  const cx=Math.max(0,sx),cy=Math.max(0,sy),cw=Math.min(sw,canvasW-cx),ch=Math.min(sh,canvasH-cy);
  if(cw<1||ch<1)return;
  const layerData = currentLayerData();
  if(!layerData)return;
  // Extract selection data FIRST
  selection.x=cx;selection.y=cy;selection.w=cw;selection.h=ch;selection.offsetX=0;selection.offsetY=0;
  selection.cutX=cx;selection.cutY=cy;selection.cutW=cw;selection.cutH=ch;
  selection.data=extractSelectionData(layerData,cx,cy,cw,ch);
  selection.originalData=new Uint8ClampedArray(selection.data);
  // Apply cut IMMEDIATELY: clear the source area in the layer so transforms don't leave ghosts
  for(let y=cy;y<cy+ch;y++) for(let x=cx;x<cx+cw;x++){const idx=(y*canvasW+x)*4;layerData[idx]=0;layerData[idx+1]=0;layerData[idx+2]=0;layerData[idx+3]=0;}
  selection.active=true;selection.creating=false;selection.isCut=true;
  selection.rotation=0;selection.scaleX=1;selection.scaleY=1;selection.handleDragging=null;
  document.getElementById('selectionToolbar').style.display='flex';
  updateSelectionToolbar();startMarchingAnts();render();
}

function isInsideSelection(px,py){
  if(!selection.active)return false;
  // Transform the point into the selection's local coordinate system
  const ox=selection.x+selection.offsetX,oy=selection.y+selection.offsetY;
  const cx=ox+selection.w/2, cy=oy+selection.h/2;
  const rad=-selection.rotation*Math.PI/180;
  const cos=Math.cos(rad),sin=Math.sin(rad);
  const dx=px-cx, dy=py-cy;
  const localX=dx*cos-dy*sin;
  const localY=dx*sin+dy*cos;
  const halfW=selection.w*selection.scaleX/2, halfH=selection.h*selection.scaleY/2;
  return localX>=-halfW && localX<=halfW && localY>=-halfH && localY<=halfH;
}

function confirmSelection() {
  if(!selection.active)return;pushHistory();
  // Apply rotation/scale transform first
  applySelectionTransform();
  // The cut area was already cleared in finalizeSelection, so just paste the (possibly transformed) data
  const data=currentLayerData();
  const ox=selection.x+selection.offsetX,oy=selection.y+selection.offsetY;
  for(let y=0;y<selection.h;y++)for(let x=0;x<selection.w;x++){const fx=ox+x,fy=oy+y;if(fx>=0&&fy>=0&&fx<canvasW&&fy<canvasH){const si=(y*selection.w+x)*4,di=(fy*canvasW+fx)*4;if(selection.data[si+3]>0){data[di]=selection.data[si];data[di+1]=selection.data[si+1];data[di+2]=selection.data[si+2];data[di+3]=selection.data[si+3];}}}
  clearSelectionState();render();
}

function cancelSelection(){
  if(!selection.active)return;
  // If the layer was already cut during finalize, restore the original data at the cut position
  if(selection.isCut && selection.originalData && selection.cutW>0 && selection.cutH>0){
    const data=currentLayerData();
    if(data){
      const ox=selection.cutX,oy=selection.cutY,ow=selection.cutW,oh=selection.cutH;
      for(let y=0;y<oh;y++) for(let x=0;x<ow;x++){
        const fx=ox+x,fy=oy+y;
        if(fx>=0&&fy>=0&&fx<canvasW&&fy<canvasH){
          const si=(y*ow+x)*4,di=(fy*canvasW+fx)*4;
          data[di]=selection.originalData[si];
          data[di+1]=selection.originalData[si+1];
          data[di+2]=selection.originalData[si+2];
          data[di+3]=selection.originalData[si+3];
        }
      }
    }
  }
  clearSelectionState();render();
}

function clearSelectionState(){
  selection.active=false;selection.creating=false;selection.dragging=false;selection.data=null;selection.originalData=null;
  selection.rotation=0;selection.scaleX=1;selection.scaleY=1;selection.handleDragging=null;
  document.getElementById('selectionToolbar').style.display='none';
  const bar=document.getElementById('selectionNudgeBar'); if(bar) bar.style.display='none';
  stopMarchingAnts();
}

function showSelectionNudgeBar(){
  const bar=document.getElementById('selectionNudgeBar'); if(bar) bar.style.display='inline-flex';
  const info=document.getElementById('selInfo');
  if(info) info.textContent=`选区 ${selection.w}×${selection.h}`;
}

// Move selection by exact pixel amount (positive/negative dx,dy)
function nudgeSelection(dx, dy){
  if(!selection.active||!selection.data)return;
  selection.x += dx;
  selection.y += dy;
  updateSelectionToolbar();
  render();
}

function nudgeSelectionBig(dx, dy){
  if(!selection.active||!selection.data)return;
  selection.x += dx * 8;
  selection.y += dy * 8;
  updateSelectionToolbar();
  render();
}

// Generic scale function (factor)
function scaleSelection(factor){
  if(!selection.active||!selection.data)return;
  const r=scaleSelectionData(selection.data,selection.w,selection.h,factor);
  selection.x+=Math.round((selection.w-r.w)/2);
  selection.y+=Math.round((selection.h-r.h)/2);
  selection.w=r.w;selection.h=r.h;selection.data=r.data;
  selection.rotation=0;selection.scaleX=1;selection.scaleY=1;
  updateSelectionToolbar();render();
}

// 90° rotation (data-level)
function rotateSelection90(){
  if(!selection.active||!selection.data)return;
  const oW=selection.w,oH=selection.h,nW=oH,nH=oW;
  const nd=new Uint8ClampedArray(nW*nH*4);
  for(let y=0;y<oH;y++)for(let x=0;x<oW;x++){
    const si=(y*oW+x)*4,di=(x*nW+(oH-1-y))*4;
    nd[di]=selection.data[si];nd[di+1]=selection.data[si+1];nd[di+2]=selection.data[si+2];nd[di+3]=selection.data[si+3];
  }
  selection.x+=Math.round((selection.w-nW)/2);
  selection.y+=Math.round((selection.h-nH)/2);
  selection.w=nW;selection.h=nH;selection.data=nd;
  selection.rotation=0;selection.scaleX=1;selection.scaleY=1;
  updateSelectionToolbar();render();
}

function rotateSelectionNeg90(){
  if(!selection.active||!selection.data)return;
  const oW=selection.w,oH=selection.h,nW=oH,nH=oW;
  const nd=new Uint8ClampedArray(nW*nH*4);
  for(let y=0;y<oH;y++)for(let x=0;x<oW;x++){
    const si=(y*oW+x)*4,di=((nH-1-x)*nW+y)*4;
    nd[di]=selection.data[si];nd[di+1]=selection.data[si+1];nd[di+2]=selection.data[si+2];nd[di+3]=selection.data[si+3];
  }
  selection.x+=Math.round((selection.w-nW)/2);
  selection.y+=Math.round((selection.h-nH)/2);
  selection.w=nW;selection.h=nH;selection.data=nd;
  selection.rotation=0;selection.scaleX=1;selection.scaleY=1;
  updateSelectionToolbar();render();
}

// Fine rotation: add degrees to the preview rotation (baked on confirm by applySelectionTransform)
function rotateSelectionBy(degrees){
  if(!selection.active||!selection.data)return;
  selection.rotation = (selection.rotation + degrees) % 360;
  if(selection.rotation < 0) selection.rotation += 360;
  updateSelectionToolbar();render();
}

function resetSelectionRotation(){
  if(!selection.active||!selection.data)return;
  if(selection.rotation === 0) return;
  selection.rotation = 0;
  updateSelectionToolbar();render();
}

function flipSelectionH(){if(!selection.active||!selection.data)return;const w=selection.w,h=selection.h,copy=new Uint8ClampedArray(selection.data);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const si=(y*w+x)*4,di=(y*w+(w-1-x))*4;selection.data[di]=copy[si];selection.data[di+1]=copy[si+1];selection.data[di+2]=copy[si+2];selection.data[di+3]=copy[si+3];}selection.rotation=0;selection.scaleX=1;selection.scaleY=1;updateSelectionToolbar();render();}

function flipSelectionV(){if(!selection.active||!selection.data)return;const w=selection.w,h=selection.h,copy=new Uint8ClampedArray(selection.data);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const si=(y*w+x)*4,di=((h-1-y)*w+x)*4;selection.data[di]=copy[si];selection.data[di+1]=copy[si+1];selection.data[di+2]=copy[si+2];selection.data[di+3]=copy[si+3];}selection.rotation=0;selection.scaleX=1;selection.scaleY=1;updateSelectionToolbar();render();}

function scaleSelectionData(sdata,sw,sh,scale){const nW=Math.max(1,Math.round(sw*scale)),nH=Math.max(1,Math.round(sh*scale));const nd=new Uint8ClampedArray(nW*nH*4);for(let y=0;y<nH;y++)for(let x=0;x<nW;x++){const srcX=Math.min(Math.floor(x/scale),sw-1),srcY=Math.min(Math.floor(y/scale),sh-1);const si=(srcY*sw+srcX)*4,di=(y*nW+x)*4;nd[di]=sdata[si];nd[di+1]=sdata[si+1];nd[di+2]=sdata[si+2];nd[di+3]=sdata[si+3];}return{data:nd,w:nW,h:nH};}

function scaleSelection2x(){if(!selection.active||!selection.data)return;const r=scaleSelectionData(selection.data,selection.w,selection.h,2);selection.x+=Math.round((selection.w-r.w)/2);selection.y+=Math.round((selection.h-r.h)/2);selection.w=r.w;selection.h=r.h;selection.data=r.data;selection.rotation=0;selection.scaleX=1;selection.scaleY=1;updateSelectionToolbar();render();}

function scaleSelection05x(){if(!selection.active||!selection.data)return;if(selection.w<=1&&selection.h<=1)return;const r=scaleSelectionData(selection.data,selection.w,selection.h,0.5);selection.x+=Math.round((selection.w-r.w)/2);selection.y+=Math.round((selection.h-r.h)/2);selection.w=r.w;selection.h=r.h;selection.data=r.data;selection.rotation=0;selection.scaleX=1;selection.scaleY=1;updateSelectionToolbar();render();}

function startMarchingAnts(){if(marchingAntsTimer)return;marchingAntsTimer=setInterval(()=>{marchingAntsOffset=(marchingAntsOffset+1)%16;render(true);},80);}
function stopMarchingAnts(){if(marchingAntsTimer){clearInterval(marchingAntsTimer);marchingAntsTimer=null;}}

function copySelection(){if(!selection.active||!selection.data)return;clipboard={data:new Uint8ClampedArray(selection.data),w:selection.w,h:selection.h};toast('已复制选区');}

function pasteSelection(){if(!clipboard)return;if(selection.active)confirmSelection();pushHistory();const px=Math.max(0,Math.floor((canvasW-clipboard.w)/2)),py=Math.max(0,Math.floor((canvasH-clipboard.h)/2));selection.x=px;selection.y=py;selection.w=clipboard.w;selection.h=clipboard.h;selection.offsetX=0;selection.offsetY=0;selection.data=new Uint8ClampedArray(clipboard.data);selection.originalData=new Uint8ClampedArray(clipboard.data);selection.active=true;selection.creating=false;selection.dragging=false;selection.isCut=false;selection.rotation=0;selection.scaleX=1;selection.scaleY=1;selection.handleDragging=null;document.getElementById('selectionToolbar').style.display='flex';updateSelectionToolbar();startMarchingAnts();render();toast('已粘贴选区');}

// ── 选区控制 ──
// No more canvas handles — use bottom toolbar buttons (selectionNudgeBar) for precise control.

// Get the 4 corners of the selection in canvas-internal coordinates (for drawing on canvas context)
// Note: despite the function name, these are canvas-internal coordinates, NOT viewport/screen coordinates
function getSelectionScreenCorners() {
  const sz = pixelSize;
  const ox = selection.x + selection.offsetX;
  const oy = selection.y + selection.offsetY;
  const w = selection.w;
  const h = selection.h;
  const cx = (ox + w / 2) * sz;
  const cy = (oy + h / 2) * sz;
  const rad = selection.rotation * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const sx = selection.scaleX, sy = selection.scaleY;

  // Local corners in canvas-internal pixels (must match ctx.drawImage's selW*sz units)
  const localCorners = [
    { lx: -w / 2 * sx * sz, ly: -h / 2 * sy * sz }, // top-left
    { lx:  w / 2 * sx * sz, ly: -h / 2 * sy * sz }, // top-right
    { lx:  w / 2 * sx * sz, ly:  h / 2 * sy * sz }, // bottom-right
    { lx: -w / 2 * sx * sz, ly:  h / 2 * sy * sz }, // bottom-left
  ];

  return localCorners.map(c => ({
    x: cx + c.lx * cos - c.ly * sin,
    y: cy + c.lx * sin + c.ly * cos
  }));
}

// Convert canvas-internal coordinates to screen (viewport) coordinates
function canvasToScreen(cx, cy) {
  const rect = drawCanvas.getBoundingClientRect();
  const cssScaleX = rect.width / drawCanvas.width;
  const cssScaleY = rect.height / drawCanvas.height;
  return { x: rect.left + cx * cssScaleX, y: rect.top + cy * cssScaleY };
}

// Convert screen (viewport) coordinates to canvas-internal coordinates
function screenToCanvas(sx, sy) {
  const rect = drawCanvas.getBoundingClientRect();
  const cssScaleX = rect.width / drawCanvas.width;
  const cssScaleY = rect.height / drawCanvas.height;
  return { x: (sx - rect.left) / cssScaleX, y: (sy - rect.top) / cssScaleY };
}

// Hit test: returns handle type or null. With bottom toolbar, no canvas handles exist.
function hitTestHandles(screenX, screenY) {
  return null;
}

// Convert screen coordinates to pixel coordinates
function screenToPixel(screenX, screenY) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = (canvasW * pixelSize) / rect.width;
  const scaleY = (canvasH * pixelSize) / rect.height;
  return {
    x: Math.floor((screenX - rect.left) * scaleX / pixelSize),
    y: Math.floor((screenY - rect.top) * scaleY / pixelSize)
  };
}

// Convert pixel coordinates to screen coordinates
function pixelToScreen(px, py) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = rect.width / (canvasW * pixelSize);
  const scaleY = rect.height / (canvasH * pixelSize);
  return {
    x: rect.left + px * pixelSize * scaleX,
    y: rect.top + py * pixelSize * scaleY
  };
}


// Update toolbar displays for rotation and scale
function updateSelectionToolbar() {
  const info = document.getElementById('selInfo');
  if (info) {
    const rot = selection.rotation || 0;
    const rotStr = rot === 0 ? '' : ` ∠${rot}°`;
    info.textContent = `选区 ${selection.w}×${selection.h} @ (${selection.x},${selection.y})${rotStr}`;
  }
  showSelectionNudgeBar();
}

// Apply rotation and scaling to the selection pixel data
function applySelectionTransform() {
  if (selection.rotation === 0 && selection.scaleX === 1 && selection.scaleY === 1) return;

  const sw = selection.w, sh = selection.h;
  const sx = selection.scaleX, sy = selection.scaleY;
  const rot = selection.rotation;

  // Create source canvas from selection data
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = sw; srcCanvas.height = sh;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.putImageData(new ImageData(new Uint8ClampedArray(selection.data), sw, sh), 0, 0);

  // Calculate the bounding box of the transformed content
  const rad = rot * Math.PI / 180;
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  const scaledW = sw * Math.abs(sx), scaledH = sh * Math.abs(sy);
  const maxDim = Math.ceil(scaledW * cos + scaledH * sin);
  const maxDimH = Math.ceil(scaledW * sin + scaledH * cos);
  const totalW = Math.max(1, maxDim);
  const totalH = Math.max(1, maxDimH);

  // Create temp canvas large enough
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = totalW; tmpCanvas.height = totalH;
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.imageSmoothingEnabled = false;

  // Apply transforms centered
  tmpCtx.translate(totalW / 2, totalH / 2);
  tmpCtx.rotate(rad);
  tmpCtx.scale(sx, sy);
  tmpCtx.drawImage(srcCanvas, -sw / 2, -sh / 2);

  // Read back pixels, find bounding box of non-transparent content
  const imgData = tmpCtx.getImageData(0, 0, totalW, totalH);
  const d = imgData.data;
  let minX = totalW, minY = totalH, maxX = -1, maxY = -1;
  for (let y = 0; y < totalH; y++) {
    for (let x = 0; x < totalW; x++) {
      if (d[(y * totalW + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    // All transparent - reset
    selection.data = new Uint8ClampedArray(sw * sh * 4);
    selection.rotation = 0; selection.scaleX = 1; selection.scaleY = 1;
    return;
  }

  const newW = maxX - minX + 1;
  const newH = maxY - minY + 1;
  const newData = new Uint8ClampedArray(newW * newH * 4);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const si = (y * totalW + x) * 4;
      const di = ((y - minY) * newW + (x - minX)) * 4;
      newData[di] = d[si]; newData[di+1] = d[si+1]; newData[di+2] = d[si+2]; newData[di+3] = d[si+3];
    }
  }

  // Adjust position to keep center consistent
  const oldCx = selection.x + selection.offsetX + sw / 2;
  const oldCy = selection.y + selection.offsetY + sh / 2;
  selection.w = newW;
  selection.h = newH;
  selection.data = newData;
  selection.x = Math.round(oldCx - newW / 2);
  selection.y = Math.round(oldCy - newH / 2);
  selection.offsetX = 0;
  selection.offsetY = 0;
  selection.rotation = 0;
  selection.scaleX = 1;
  selection.scaleY = 1;
}

// ══════════════════════════════════════
// 渲染
// ══════════════════════════════════════
function render(skipFrameList) {
  const w = canvasW, h = canvasH, sz = pixelSize;

  if (tilePreview) {
    const tc = tileCount;
    drawCanvas.width = w * tc * sz; drawCanvas.height = h * tc * sz;
    ctx.imageSmoothingEnabled = false;
    const areaRect = canvasArea.getBoundingClientRect();
    drawCanvas.style.left = ((areaRect.width - w*tc*sz)/2 + panX) + 'px';
    drawCanvas.style.top = ((areaRect.height - h*tc*sz)/2 + panY) + 'px';

    ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.fillStyle = '#1e1e30';
    for (let ty=0;ty<tc;ty++) for(let tx=0;tx<tc;tx++) for(let y=0;y<h;y++) for(let x=0;x<w;x++){if((x+y)%2===0)ctx.fillRect(tx*w*sz+x*sz,ty*h*sz+y*sz,sz,sz);}

    if (referenceImage) { ctx.save(); ctx.globalAlpha = referenceOpacity; for(let ty=0;ty<tc;ty++) for(let tx=0;tx<tc;tx++) ctx.drawImage(referenceImage,tx*w*sz,ty*h*sz,w*sz,h*sz); ctx.restore(); }

    const compData = compositeFrame(currentFrame);
    const tmp = document.createElement('canvas'); tmp.width=w; tmp.height=h;
    const tctx = tmp.getContext('2d');
    tctx.putImageData(new ImageData(new Uint8ClampedArray(compData),w,h),0,0);
    for(let ty=0;ty<tc;ty++) for(let tx=0;tx<tc;tx++) ctx.drawImage(tmp,tx*w*sz,ty*h*sz,w*sz,h*sz);

    if (showGrid) {
      ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=0.5;
      for(let ty=0;ty<tc;ty++) for(let tx=0;tx<tc;tx++){const ox=tx*w*sz,oy=ty*h*sz;for(let y=0;y<=h;y++){ctx.beginPath();ctx.moveTo(ox,oy+y*sz);ctx.lineTo(ox+w*sz,oy+y*sz);ctx.stroke();}for(let x=0;x<=w;x++){ctx.beginPath();ctx.moveTo(ox+x*sz,oy);ctx.lineTo(ox+x*sz,oy+h*sz);ctx.stroke();}}
      ctx.strokeStyle='rgba(233,69,96,0.3)';ctx.lineWidth=1;
      for(let i=1;i<tc;i++){ctx.beginPath();ctx.moveTo(i*w*sz,0);ctx.lineTo(i*w*sz,tc*h*sz);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*h*sz);ctx.lineTo(tc*w*sz,i*h*sz);ctx.stroke();}
    }
  } else {
    drawCanvas.width = w * sz; drawCanvas.height = h * sz;
    ctx.imageSmoothingEnabled = false;
    const areaRect = canvasArea.getBoundingClientRect();
    drawCanvas.style.left = ((areaRect.width - w*sz)/2 + panX) + 'px';
    drawCanvas.style.top = ((areaRect.height - h*sz)/2 + panY) + 'px';

    ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.fillStyle = '#1e1e30';
    for (let y=0;y<h;y++) for(let x=0;x<w;x++){if((x+y)%2===0)ctx.fillRect(x*sz,y*sz,sz,sz);}

    if (referenceImage) { ctx.save(); ctx.globalAlpha = referenceOpacity; ctx.imageSmoothingEnabled = false; ctx.drawImage(referenceImage, 0, 0, w*sz, h*sz); ctx.restore(); }

    if (onionMode !== 'off' && frames.length > 1) {
      const baseAlpha = onionOpacity / 100;
      const maxSteps = Math.min(onionFrameCount, 5);
      for (let step=1;step<=maxSteps;step++) {
        const alpha = baseAlpha * (1 - (step-1)/maxSteps);
        if (alpha <= 0) continue;
        if (onionMode==='prev'||onionMode==='both'){const idx=currentFrame-step;if(idx>=0)drawFrameData(compositeFrame(idx),w,h,sz,alpha);}
        if (onionMode==='next'||onionMode==='both'){const idx=currentFrame+step;if(idx<frames.length)drawFrameData(compositeFrame(idx),w,h,sz,alpha);}
      }
    }

    drawFrameData(compositeFrame(currentFrame), w, h, sz, 1);

    if (selection.active && selection.data) {
      const ox=selection.x+selection.offsetX,oy=selection.y+selection.offsetY,selW=selection.w,selH=selection.h;
      // The source area was already cleared in finalizeSelection, so no ghost after transforms.
      // Draw selection content (apply rotation/scale transform during preview for accurate feedback)
      const tmp=document.createElement('canvas');tmp.width=selW;tmp.height=selH;const tctx=tmp.getContext('2d');
      tctx.putImageData(new ImageData(new Uint8ClampedArray(selection.data),selW,selH),0,0);
      ctx.save();
      ctx.imageSmoothingEnabled=false;
      ctx.beginPath();ctx.rect(0,0,w*sz,h*sz);ctx.clip();
      if (selection.rotation !== 0 || selection.scaleX !== 1 || selection.scaleY !== 1) {
        const cx=(ox+selW/2)*sz, cy=(oy+selH/2)*sz;
        ctx.translate(cx,cy);
        ctx.rotate(selection.rotation*Math.PI/180);
        ctx.scale(selection.scaleX,selection.scaleY);
        ctx.drawImage(tmp,-selW*sz/2,-selH*sz/2,selW*sz,selH*sz);
      } else {
        ctx.drawImage(tmp,ox*sz,oy*sz,selW*sz,selH*sz);
      }
      ctx.restore();

      // Draw bounding box only (no handles — use bottom toolbar for precise control)
      const corners = getSelectionScreenCorners();

      // Bounding box (marching ants)
      ctx.save();
      ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.lineDashOffset=-marchingAntsOffset;
      ctx.beginPath();
      ctx.moveTo(corners[0].x,corners[0].y);
      for(let i=1;i<4;i++) ctx.lineTo(corners[i].x,corners[i].y);
      ctx.closePath();ctx.stroke();
      ctx.strokeStyle='#000';ctx.lineDashOffset=-marchingAntsOffset+4;
      ctx.beginPath();
      ctx.moveTo(corners[0].x,corners[0].y);
      for(let i=1;i<4;i++) ctx.lineTo(corners[i].x,corners[i].y);
      ctx.closePath();ctx.stroke();
      ctx.restore();
    }

    if (selection.creating && selection.data === null) {
      const sx=Math.min(selection.startX,cursorPixelX),sy=Math.min(selection.startY,cursorPixelY),sw=Math.abs(cursorPixelX-selection.startX)+1,sh=Math.abs(cursorPixelY-selection.startY)+1;
      ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.lineDashOffset=-marchingAntsOffset;ctx.strokeRect(sx*sz,sy*sz,sw*sz,sh*sz);ctx.strokeStyle='#000';ctx.lineDashOffset=-marchingAntsOffset+4;ctx.strokeRect(sx*sz,sy*sz,sw*sz,sh*sz);ctx.restore();
    }

    if (shapePreview && shapePreview.length > 0) {
      const [sr,sg,sb]=hexToRgb(shapeColor);
      shapePreview.forEach(p=>{const points=getSymmetryPoints(p.x,p.y);points.forEach(pt=>{if(pt.x>=0&&pt.y>=0&&pt.x<w&&pt.y<h){ctx.fillStyle=shapeErase?'rgba(255,100,100,0.35)':`rgba(${sr},${sg},${sb},0.7)`;ctx.fillRect(pt.x*sz,pt.y*sz,sz,sz);}});});
    }

    if (showGrid) {
      ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=0.5;
      for(let y=0;y<=h;y++){ctx.beginPath();ctx.moveTo(0,y*sz);ctx.lineTo(w*sz,y*sz);ctx.stroke();}
      for(let x=0;x<=w;x++){ctx.beginPath();ctx.moveTo(x*sz,0);ctx.lineTo(x*sz,h*sz);ctx.stroke();}
    }

    if (symmetryMode !== 'none') {
      ctx.save();
      ctx.strokeStyle='#e94560';ctx.setLineDash([6,4]);ctx.lineWidth=1.5;
      if(symmetryMode==='horizontal'||symmetryMode==='quad'){const lx=w*sz/2;ctx.beginPath();ctx.moveTo(lx,0);ctx.lineTo(lx,h*sz);ctx.stroke();}
      if(symmetryMode==='vertical'||symmetryMode==='quad'){const ly=h*sz/2;ctx.beginPath();ctx.moveTo(0,ly);ctx.lineTo(w*sz,ly);ctx.stroke();}
      // Center marker dot for quad mode
      if(symmetryMode==='quad'){ctx.fillStyle='#e94560';ctx.beginPath();ctx.arc(w*sz/2,h*sz/2,3,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }

    if (mouseOnCanvas && (currentTool==='pencil'||currentTool==='eraser') && brushSize>1) {
      const half=Math.floor(brushSize/2);
      const drawBrushBox = (px,py) => { ctx.strokeStyle='rgba(233,69,96,0.8)';ctx.lineWidth=1;ctx.strokeRect((px-half)*sz,(py-half)*sz,brushSize*sz,brushSize*sz); };
      drawBrushBox(cursorPixelX,cursorPixelY);
      // Mirror previews: show where the symmetric copy will land
      if (symmetryMode !== 'none') {
        ctx.save();
        ctx.strokeStyle='rgba(233,69,96,0.5)';ctx.setLineDash([3,3]);ctx.lineWidth=1;
        const mirrors = getSymmetryPoints(cursorPixelX, cursorPixelY);
        mirrors.forEach(pt => { if (pt.x!==cursorPixelX || pt.y!==cursorPixelY) drawBrushBox(pt.x, pt.y); });
        ctx.restore();
      }
    }
  }

  if (!skipFrameList) { updateFrameList(); updateLayerList(); }
  updateFrameInfo();
}

function drawFrameData(data, w, h, sz, alpha) {
  if (alpha === 0) return;
  const tmp = document.createElement('canvas'); tmp.width=w; tmp.height=h;
  const tctx = tmp.getContext('2d');
  tctx.putImageData(new ImageData(new Uint8ClampedArray(data),w,h),0,0);
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp,0,0,w*sz,h*sz); ctx.restore();
}

// ── 帧列表 UI ──
function updateFrameList() {
  const list = document.getElementById('frameList'); list.innerHTML = '';
  frames.forEach((frame, i) => {
    const div = document.createElement('div');
    const isActive = i === currentFrame;
    const isSelected = selectedFrameIndices.has(i);
    div.className = 'frame-item' + (isActive ? ' active' : '') + (isSelected ? ' selected' : '');
    div.dataset.frameIndex = i;
    const thumb = document.createElement('canvas'); thumb.className='thumb'; thumb.width=canvasW; thumb.height=canvasH;
    const tctx = thumb.getContext('2d'); const compData = compositeFrame(i);
    tctx.putImageData(new ImageData(new Uint8ClampedArray(compData),canvasW,canvasH),0,0);
    div.appendChild(thumb);
    const num = document.createElement('span'); num.className='num'; num.textContent=i+1; div.appendChild(num);
    const durBadge = document.createElement('span'); durBadge.className='duration-badge'; durBadge.textContent='×'+frame.duration; durBadge.title='点击增加时长，右键减少';
    durBadge.onclick=(e)=>{e.stopPropagation();frame.duration=Math.min(8,frame.duration+1);render();};
    durBadge.oncontextmenu=(e)=>{e.preventDefault();e.stopPropagation();frame.duration=Math.max(1,frame.duration-1);render();};
    div.appendChild(durBadge);
    div.onclick=(e)=>{
      if(e.target.classList.contains('del-btn')||e.target.classList.contains('duration-badge'))return;
      if(selection.active)confirmSelection();
      // 多选逻辑(Task 2)
      if(e.shiftKey && lastFrameClickIndex >= 0){
        const lo = Math.min(lastFrameClickIndex, i);
        const hi = Math.max(lastFrameClickIndex, i);
        selectedFrameIndices.clear();
        for(let k = lo; k <= hi; k++) selectedFrameIndices.add(k);
      } else if(e.ctrlKey || e.metaKey){
        if(selectedFrameIndices.has(i)) selectedFrameIndices.delete(i);
        else selectedFrameIndices.add(i);
        lastFrameClickIndex = i;
      } else {
        selectedFrameIndices.clear();
        selectedFrameIndices.add(i);
        lastFrameClickIndex = i;
      }
      currentFrame=i;
      activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);
      moveOffsetX=0;moveOffsetY=0;
      render();
    };
    // 右键弹出帧操作菜单(Task: 用户反馈找不到清空/删除按钮)
    div.oncontextmenu=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      showFrameContextMenu(e, i);
    };
    if(frames.length>1){const del=document.createElement('button');del.className='del-btn';del.textContent='×';del.onclick=(e)=>{e.stopPropagation();deleteFrame(i);};div.appendChild(del);}
    list.appendChild(div);
  });
  // 同步多选悬浮工具条
  updateFrameSelectionBar();
}

function updateFrameInfo() { document.getElementById('frameInfo').textContent = `帧 ${currentFrame+1}/${frames.length}`; }

// ── 帧操作 ──
function addFrame(){pushHistory();frames.splice(currentFrame+1,0,createFrame(canvasW,canvasH));currentFrame++;activeLayerIndex=0;moveOffsetX=0;moveOffsetY=0;render();}
function duplicateFrame(){pushHistory();const dup=cloneFrame(frames[currentFrame]);frames.splice(currentFrame+1,0,dup);currentFrame++;render();}
function deleteFrame(idx){if(frames.length<=1)return;pushHistory();frames.splice(idx,1);if(currentFrame>=frames.length)currentFrame=frames.length-1;activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);render();}
function nextFrame(){if(frames.length===1)return;if(selection.active)confirmSelection();currentFrame=(currentFrame+1)%frames.length;activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);moveOffsetX=0;moveOffsetY=0;render();}
function prevFrame(){if(frames.length===1)return;if(selection.active)confirmSelection();currentFrame=(currentFrame-1+frames.length)%frames.length;activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);moveOffsetX=0;moveOffsetY=0;render();}
function goFirstFrame(){if(selection.active)confirmSelection();currentFrame=0;activeLayerIndex=Math.min(activeLayerIndex,frames[0].layers.length-1);moveOffsetX=0;moveOffsetY=0;render();}
function goLastFrame(){if(selection.active)confirmSelection();currentFrame=frames.length-1;activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);moveOffsetX=0;moveOffsetY=0;render();}
function moveFrameLeft(){if(currentFrame<=0)return;pushHistory();[frames[currentFrame],frames[currentFrame-1]]=[frames[currentFrame-1],frames[currentFrame]];currentFrame--;render();}
function moveFrameRight(){if(currentFrame>=frames.length-1)return;pushHistory();[frames[currentFrame],frames[currentFrame+1]]=[frames[currentFrame+1],frames[currentFrame]];currentFrame++;render();}
function clearFrame(){pushHistory();frames[currentFrame]=createFrame(canvasW,canvasH);activeLayerIndex=0;render();toast('已清空当前帧');}
function clearSelectedFrames(){
  if(selectedFrameIndices.size===0){toast('请先选中要清空的帧(普通点击单选,Ctrl/Cmd+点击加选,Shift+点击连选)');return;}
  if(!confirm('确定要清空选中的 ' + selectedFrameIndices.size + ' 帧吗?'))return;
  pushHistory();
  selectedFrameIndices.forEach(idx => {
    if(idx<0||idx>=frames.length)return;
    const f = frames[idx];
    f.layers.forEach(layer => {
      if(layer.data){
        // 重置为透明 RGBA
        for(let p = 0; p < layer.data.length; p += 4){
          layer.data[p]=0; layer.data[p+1]=0; layer.data[p+2]=0; layer.data[p+3]=0;
        }
      }
    });
  });
  selectedFrameIndices.clear();
  lastFrameClickIndex = -1;
  render();
  toast('已清空选中帧');
}

// 批量删除选中帧(至少保留 1 帧)
function deleteSelectedFrames(){
  if(selectedFrameIndices.size===0){toast('请先选中要删除的帧(普通点击单选,Ctrl/Cmd+点击加选,Shift+点击连选)');return;}
  if(frames.length - selectedFrameIndices.size < 1){toast('至少保留 1 帧,无法全部删除');return;}
  if(!confirm('确定删除选中的 ' + selectedFrameIndices.size + ' 帧吗?'))return;
  pushHistory();
  // 从大到小排序,避免索引错位
  const sorted = [...selectedFrameIndices].sort((a, b) => b - a);
  sorted.forEach(idx => {
    if(idx>=0 && idx<frames.length) frames.splice(idx, 1);
  });
  selectedFrameIndices.clear();
  lastFrameClickIndex = -1;
  if(currentFrame >= frames.length) currentFrame = frames.length - 1;
  if(currentFrame < 0) currentFrame = 0;
  activeLayerIndex = 0;
  render();
  toast('已删除选中帧');
}

// 批量复制选中帧(按原顺序,每个副本插在原帧之后)
function duplicateSelectedFrames(){
  if(selectedFrameIndices.size===0){toast('请先选中要复制的帧');return;}
  pushHistory();
  // 按索引升序,逐个 splice,新副本索引自动 +1,后续原帧索引不变
  const sorted = [...selectedFrameIndices].sort((a, b) => a - b);
  sorted.forEach(idx => {
    if(idx<0 || idx>=frames.length) return;
    const copy = cloneFrame(frames[idx]);
    frames.splice(idx + 1, 0, copy);
  });
  selectedFrameIndices.clear();
  lastFrameClickIndex = -1;
  render();
  toast('已复制选中帧');
}

// 全选所有帧
function selectAllFrames(){
  selectedFrameIndices.clear();
  for(let i = 0; i < frames.length; i++) selectedFrameIndices.add(i);
  lastFrameClickIndex = frames.length - 1;
  render();
}

// 取消所有选择
function clearFrameSelection(){
  selectedFrameIndices.clear();
  lastFrameClickIndex = -1;
  render();
}

// 显示帧右键菜单
function showFrameContextMenu(event, frameIndex){
  const menu = document.getElementById('frameContextMenu');
  if(!menu) return;
  // 自动把右键的那一帧加入选中
  if(!selectedFrameIndices.has(frameIndex)){
    selectedFrameIndices.add(frameIndex);
  }
  if(currentFrame !== frameIndex){
    currentFrame = frameIndex;
    activeLayerIndex = Math.min(activeLayerIndex, frames[currentFrame].layers.length - 1);
  }
  updateFrameSelectionBar();
  // 定位
  let x = event.clientX, y = event.clientY;
  menu.style.display = 'block';
  // 防止菜单超出视口
  const rect = menu.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  if(x + rect.width > vw) x = Math.max(4, vw - rect.width - 4);
  if(y + rect.height > vh) y = Math.max(4, vh - rect.height - 4);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  // 重渲染以更新 .selected 高亮
  render();
}

function hideFrameContextMenu(){
  const menu = document.getElementById('frameContextMenu');
  if(menu) menu.style.display = 'none';
}

// 帧右键菜单的统一入口
function frameContextAction(action){
  hideFrameContextMenu();
  if(action === 'clear'){
    clearSelectedFrames();
  } else if(action === 'delete'){
    deleteSelectedFrames();
  } else if(action === 'duplicate'){
    duplicateSelectedFrames();
  } else if(action === 'select-all'){
    selectAllFrames();
  } else if(action === 'select-none'){
    clearFrameSelection();
  }
}

// 根据选中帧数显示 / 隐藏悬浮工具条
function updateFrameSelectionBar(){
  const bar = document.getElementById('frameSelectionBar');
  const count = document.getElementById('frameSelectionCount');
  if(!bar) return;
  if(selectedFrameIndices.size > 0){
    bar.style.display = 'flex';
    if(count) count.textContent = '已选 ' + selectedFrameIndices.size + ' 帧';
  } else {
    bar.style.display = 'none';
  }
}
function setOnionMode(mode){onionMode=mode;render();}

function resizeCanvas() {
  const nw=parseInt(document.getElementById('canvasW').value)||16, nh=parseInt(document.getElementById('canvasH').value)||16;
  if(nw<4||nh<4||nw>128||nh>128)return;if(nw===canvasW&&nh===canvasH)return;
  const oldFrames=frames.map(f=>cloneFrame(f));
  frames=oldFrames.map(f=>{
    const nd=createFrame(nw,nh);const minW=Math.min(canvasW,nw),minH=Math.min(canvasH,nh);
    f.layers.forEach((ol,li)=>{
      const nl={data:createEmptyData(nw,nh),name:ol.name,visible:ol.visible,opacity:ol.opacity};
      for(let y=0;y<minH;y++)for(let x=0;x<minW;x++){const oi=(y*canvasW+x)*4,ni=(y*nw+x)*4;nl.data[ni]=ol.data[oi];nl.data[ni+1]=ol.data[oi+1];nl.data[ni+2]=ol.data[oi+2];nl.data[ni+3]=ol.data[oi+3];}
      if(li===0){nd.layers[0]=nl;}else{nd.layers.push(nl);}
    });
    nd.duration=f.duration;return nd;
  });
  canvasW=nw;canvasH=nh;currentFrame=Math.min(currentFrame,frames.length-1);activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);
  moveOffsetX=0;moveOffsetY=0;if(selection.active)clearSelectionState();clearHistory();render();toast(`画布调整为 ${nw}×${nh}`);
}

function setTool(tool,btn){
  if(selection.active&&tool!=='selection'&&tool!=='move')confirmSelection();
  currentTool=tool;shapePreview=null;shapeDragging=false;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  // Move tool: auto-select non-transparent content if no selection exists
  if(tool==='move'&&!selection.active){
    autoSelectContent();
  }
  render();
}

// Find bounding box of non-transparent pixels in current layer
function findContentBounds(data) {
  if (!data) return null;
  let minX = canvasW, minY = canvasH, maxX = -1, maxY = -1;
  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      if (data[(y * canvasW + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Auto-select non-transparent content in the current layer
function autoSelectContent() {
  const data = currentLayerData();
  if (!data) return;
  const bounds = findContentBounds(data);
  if (!bounds) return;
  // Create selection from the bounding box
  selection.x = bounds.x;
  selection.y = bounds.y;
  selection.w = bounds.w;
  selection.h = bounds.h;
  selection.offsetX = 0;
  selection.offsetY = 0;
  selection.data = extractSelectionData(data, bounds.x, bounds.y, bounds.w, bounds.h);
  selection.originalData = new Uint8ClampedArray(selection.data);
  selection.active = true;
  selection.creating = false;
  selection.dragging = false;
  selection.isCut = true;
  selection.rotation = 0;
  selection.scaleX = 1;
  selection.scaleY = 1;
  selection.handleDragging = null;
  document.getElementById('selectionToolbar').style.display = 'flex';
  updateSelectionToolbar();
  startMarchingAnts();
}

// ── 鼠标绘制 ──
let isDrawing=false, lastX=-1, lastY=-1, drawStartX=-1, drawStartY=-1;

function pixelFromEvent(e) {
  const rect = drawCanvas.getBoundingClientRect();
  if (tilePreview) {
    const tc=tileCount,totalW=canvasW*tc*pixelSize,totalH=canvasH*tc*pixelSize;
    const scaleX=totalW/rect.width,scaleY=totalH/rect.height;
    const mx=(e.clientX-rect.left)*scaleX,my=(e.clientY-rect.top)*scaleY;
    const px=Math.floor(mx/pixelSize),py=Math.floor(my/pixelSize);
    return {x:((px%canvasW)+canvasW)%canvasW, y:((py%canvasH)+canvasH)%canvasH};
  }
  const scaleX=(canvasW*pixelSize)/rect.width,scaleY=(canvasH*pixelSize)/rect.height;
  return {x:Math.floor((e.clientX-rect.left)*scaleX/pixelSize), y:Math.floor((e.clientY-rect.top)*scaleY/pixelSize)};
}

function getPixel(x,y,data){if(x<0||y<0||x>=canvasW||y>=canvasH)return null;const i=(y*canvasW+x)*4;return{r:data[i],g:data[i+1],b:data[i+2],a:data[i+3]};}
function setPixel(x,y,r,g,b,a,data){if(x<0||y<0||x>=canvasW||y>=canvasH)return;const i=(y*canvasW+x)*4;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=a;}
function colorsEqual(c1,c2){if(!c1&&!c2)return true;if(!c1||!c2)return false;return c1.r===c2.r&&c1.g===c2.g&&c1.b===c2.b&&c1.a===c2.a;}

function floodFill(sx,sy,targetColor,fillR,fillG,fillB,fillA,data){
  if(sx<0||sy<0||sx>=canvasW||sy>=canvasH)return;const start=getPixel(sx,sy,data);if(!start)return;
  if(colorsEqual(start,{r:fillR,g:fillG,b:fillB,a:fillA}))return;
  const stack=[[sx,sy]],visited=new Set();
  while(stack.length>0){const[x,y]=stack.pop();const key=x+','+y;if(visited.has(key))continue;visited.add(key);const p=getPixel(x,y,data);if(!p||!colorsEqual(p,targetColor))continue;setPixel(x,y,fillR,fillG,fillB,fillA,data);if(x>0)stack.push([x-1,y]);if(x<canvasW-1)stack.push([x+1,y]);if(y>0)stack.push([x,y-1]);if(y<canvasH-1)stack.push([x,y+1]);}
}

drawCanvas.addEventListener('mousedown', e => {
  if(isPlaying)return;const pos=pixelFromEvent(e),btn=e.button||0;
  if(btn===1){e.preventDefault();isPanning=true;panStartX=e.clientX;panStartY=e.clientY;panStartPanX=panX;panStartPanY=panY;return;}
  if(spacePressed&&btn===0){isPanning=true;panStartX=e.clientX;panStartY=e.clientY;panStartPanX=panX;panStartPanY=panY;return;}

  if(currentTool==='selection'){
    if(selection.active){if(isInsideSelection(pos.x,pos.y)){selection.dragging=true;selection.startX=pos.x;selection.startY=pos.y;isDrawing=true;return;}else{confirmSelection();}}
    selection.creating=true;selection.startX=pos.x;selection.startY=pos.y;isDrawing=true;startMarchingAnts();return;
  }

  if(currentTool==='eyedropper'){const compData=compositeFrame(currentFrame);const p=getPixel(pos.x,pos.y,compData);if(p)setPrimaryColor(rgbToHex(p.r,p.g,p.b));return;}

  const data=currentLayerData();if(!data)return;

  if(currentTool==='fill'){pushHistory();const target=getPixel(pos.x,pos.y,data);const fillErase=btn===2;const[fr,fg,fb]=hexToRgb(fillErase?'#000000':primaryColor);const fa=fillErase?0:255;if(target)floodFill(pos.x,pos.y,target,fr,fg,fb,fa,data);render();return;}

  if(currentTool==='move'){
    if(selection.active && isInsideSelection(pos.x,pos.y)){
      selection.dragging=true;selection.startX=pos.x;selection.startY=pos.y;isDrawing=true;return;
    }
    if(!selection.active) {
      autoSelectContent();
      if(selection.active && isInsideSelection(pos.x, pos.y)){
        selection.dragging=true;selection.startX=pos.x;selection.startY=pos.y;isDrawing=true;return;
      }
    }
    isDrawing=true;return;
  }

  if(currentTool==='line'||currentTool==='rect'||currentTool==='circle'){isDrawing=true;shapeDragging=true;shapeStartX=pos.x;shapeStartY=pos.y;const isRight=(e.button||0)===2;shapeErase=isRight;shapeColor=isRight?secondaryColor:primaryColor;pushHistory();shapePreview=[];render();return;}

  isDrawing=true;pushHistory();const isRight=(e.button||0)===2;const erase=currentTool==='eraser'||isRight;const col=erase?'#000000':primaryColor;const[r,g,b]=hexToRgb(col);const a=erase?0:255;
  drawBrushPixels(pos.x,pos.y,r,g,b,a,data);lastX=pos.x;lastY=pos.y;render();
});

drawCanvas.addEventListener('mousemove', e => {
  const pos=pixelFromEvent(e);cursorPixelX=pos.x;cursorPixelY=pos.y;
  if(isPanning){panX=panStartPanX+(e.clientX-panStartX);panY=panStartPanY+(e.clientY-panStartY);render();return;}
  if(!isDrawing||isPlaying){
    if (mouseOnCanvas && (currentTool === 'selection' || currentTool === 'move') && selection.active && selection.data) {
      if (isInsideSelection(pos.x, pos.y)) {
        drawCanvas.style.cursor = 'move';
      } else {
        drawCanvas.style.cursor = 'crosshair';
      }
    }
    if(mouseOnCanvas&&(currentTool==='pencil'||currentTool==='eraser')&&brushSize>1)render();
    return;
  }

  if(currentTool==='selection'){
    if(selection.dragging){const dx=pos.x-selection.startX,dy=pos.y-selection.startY;selection.offsetX+=dx;selection.offsetY+=dy;selection.startX=pos.x;selection.startY=pos.y;render();return;}
    if(selection.creating){render();return;}
  }

  if(shapeDragging){shapePreview=calculateShapePixels(currentTool,shapeStartX,shapeStartY,pos.x,pos.y,shapeFill);render();return;}

  if(currentTool==='move'){
    if(selection.dragging){const dx=pos.x-selection.startX,dy=pos.y-selection.startY;selection.offsetX+=dx;selection.offsetY+=dy;selection.startX=pos.x;selection.startY=pos.y;render();return;}
    return;
  }

  if(pos.x===lastX&&pos.y===lastY)return;
  const data=currentLayerData();if(!data)return;
  const isRight=(e.button||0)===2;const erase=currentTool==='eraser'||isRight;const col=erase?'#000000':primaryColor;const[r,g,b]=hexToRgb(col);const a=erase?0:255;
  drawLine(lastX,lastY,pos.x,pos.y,r,g,b,a);lastX=pos.x;lastY=pos.y;render();
});

function drawBrushPixels(cx,cy,r,g,b,a,data){const half=Math.floor(brushSize/2);for(let dy=0;dy<brushSize;dy++)for(let dx=0;dx<brushSize;dx++){const px=cx-half+dx,py=cy-half+dy;const points=getSymmetryPoints(px,py);points.forEach(pt=>setPixel(pt.x,pt.y,r,g,b,a,data));}}

function drawLine(x0,y0,x1,y1,r,g,b,a){const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);const sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx-dy;const data=currentLayerData();if(!data)return;while(true){drawBrushPixels(x0,y0,r,g,b,a,data);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>-dy){err-=dy;x0+=sx;}if(e2<dx){err+=dx;y0+=sy;}}}

function shiftFrameData(data,dx,dy){if(dx===0&&dy===0)return;const copy=new Uint8ClampedArray(data);for(let i=0;i<canvasW*canvasH*4;i++)data[i]=0;for(let y=0;y<canvasH;y++)for(let x=0;x<canvasW;x++){const si=(y*canvasW+x)*4;const nx=((x+dx)%canvasW+canvasW)%canvasW,ny=((y+dy)%canvasH+canvasH)%canvasH;const di=(ny*canvasW+nx)*4;data[di]=copy[si];data[di+1]=copy[si+1];data[di+2]=copy[si+2];data[di+3]=copy[si+3];}}

window.addEventListener('mouseup', e => {
  if(isPanning){isPanning=false;return;}
  if(currentTool==='selection'&&isDrawing){
    if(selection.dragging){selection.dragging=false;isDrawing=false;return;}
    if(selection.creating){const pos=pixelFromEvent(e);finalizeSelection(selection.startX,selection.startY,pos.x,pos.y);isDrawing=false;return;}
  }
  if(shapeDragging&&isDrawing){if(shapePreview&&shapePreview.length>0){const data=currentLayerData();if(data){const[r,g,b]=hexToRgb(shapeColor);const a=shapeErase?0:255;shapePreview.forEach(p=>{const points=getSymmetryPoints(p.x,p.y);points.forEach(pt=>setPixel(pt.x,pt.y,r,g,b,a,data));});}}shapePreview=null;shapeDragging=false;isDrawing=false;lastX=-1;lastY=-1;render();return;}
  if(currentTool==='move'&&isDrawing){
    if(selection.dragging){selection.dragging=false;isDrawing=false;return;}
    isDrawing=false;return;
  }
  isDrawing=false;lastX=-1;lastY=-1;
});

drawCanvas.addEventListener('contextmenu', e => e.preventDefault());
drawCanvas.addEventListener('mouseenter', () => { mouseOnCanvas = true; });
drawCanvas.addEventListener('mouseleave', () => { mouseOnCanvas = false; render(); });

canvasArea.addEventListener('wheel', e => {
  e.preventDefault();const oldSize=pixelSize;const step=2;
  if(e.deltaY<0)pixelSize=Math.min(64,pixelSize+step);else pixelSize=Math.max(2,pixelSize-step);
  if(pixelSize===oldSize)return;
  const rect=canvasArea.getBoundingClientRect();const mouseX=e.clientX-rect.left,mouseY=e.clientY-rect.top;
  const canvasCenterX=(rect.width-canvasW*oldSize)/2+panX,canvasCenterY=(rect.height-canvasH*oldSize)/2+panY;
  const relX=mouseX-canvasCenterX,relY=mouseY-canvasCenterY;const scale=pixelSize/oldSize;
  panX=mouseX-relX*scale-(rect.width-canvasW*pixelSize)/2;panY=mouseY-relY*scale-(rect.height-canvasH*pixelSize)/2;
  document.getElementById('zoomSlider').value=pixelSize;render();
}, { passive: false });

function zoomIn() { pixelSize = Math.min(64, pixelSize + 2); document.getElementById('zoomSlider').value = pixelSize; render(); }
function zoomOut() { pixelSize = Math.max(2, pixelSize - 2); document.getElementById('zoomSlider').value = pixelSize; render(); }

// ── 撤销/重做 ──
function undo(){if(undoStack.length===0)return;const act=undoStack.pop();redoStack.push({frameIndex:currentFrame,frame:cloneFrame(frames[currentFrame]),activeLayerIndex});frames[act.frameIndex]=cloneFrame(act.frame);currentFrame=act.frameIndex;activeLayerIndex=act.activeLayerIndex!==undefined?act.activeLayerIndex:0;activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);render();}
function redo(){if(redoStack.length===0)return;const act=redoStack.pop();undoStack.push({frameIndex:currentFrame,frame:cloneFrame(frames[currentFrame]),activeLayerIndex});frames[act.frameIndex]=cloneFrame(act.frame);currentFrame=act.frameIndex;activeLayerIndex=act.activeLayerIndex!==undefined?act.activeLayerIndex:0;activeLayerIndex=Math.min(activeLayerIndex,frames[currentFrame].layers.length-1);render();}

// ── 播放动画 ──
function togglePlay(){if(isPlaying)stopPlay();else startPlay();}
function startPlay(){if(frames.length<=1)return;if(selection.active)confirmSelection();isPlaying=true;const playBtn=document.getElementById('playBtn');playBtn.textContent='⏸ 停止';playBtn.classList.add('playing');['firstFrameBtn','prevFrameBtn','nextFrameBtn','lastFrameBtn'].forEach(id=>{const btn=document.getElementById(id);if(btn)btn.style.opacity='0.4';});currentFrame=0;render();scheduleNext();}
function scheduleNext(){if(!isPlaying)return;const duration=frames[currentFrame].duration||1;playTimer=setTimeout(()=>{currentFrame=(currentFrame+1)%frames.length;render();scheduleNext();},(1000/fps)*duration);}
function stopPlay(){isPlaying=false;if(playTimer)clearTimeout(playTimer);const playBtn=document.getElementById('playBtn');playBtn.textContent='▶ 播放';playBtn.classList.remove('playing');['firstFrameBtn','prevFrameBtn','nextFrameBtn','lastFrameBtn'].forEach(id=>{const btn=document.getElementById(id);if(btn)btn.style.opacity='';});}
function updateFpsLabel(){document.getElementById('fpsLabel').textContent=fps;if(isPlaying){stopPlay();startPlay();}}

// ── 预览窗口 ──
let previewFrame=0,previewLastTime=0,previewAccumulator=0,previewAnimRunning=false;
function initPreview(){previewCanvas.width=canvasW;previewCanvas.height=canvasH;previewFrame=0;previewLastTime=0;previewAccumulator=0;if(!previewAnimRunning){previewAnimRunning=true;requestAnimationFrame(animatePreview);}}
function animatePreview(timestamp){
  if(!previewLastTime)previewLastTime=timestamp;
  const delta=timestamp-previewLastTime;
  previewLastTime=timestamp;
  // Task 4 修复:边界检查 - 帧被删除后索引越界
  if(previewFrame >= frames.length) previewFrame = 0;
  if(frames.length>0){
    previewAccumulator+=delta;
    const duration=frames[previewFrame].duration||1;
    const frameDuration=(1000/fps)*duration;
    if(previewAccumulator>=frameDuration){
      previewAccumulator-=frameDuration;
      previewFrame=(previewFrame+1)%frames.length;
    }
    renderPreview();
  } else {
    // Task 4 修复:无帧时显示提示
    renderPreviewEmpty();
  }
  requestAnimationFrame(animatePreview);
}
function renderPreview(){
  if(frames.length===0){renderPreviewEmpty();return;}
  previewCanvas.width=canvasW;
  previewCanvas.height=canvasH;
  previewCtx.imageSmoothingEnabled=false;
  previewCtx.clearRect(0,0,canvasW,canvasH);
  // Task 4 修复:再次边界检查
  const safeIdx = Math.min(previewFrame, frames.length-1);
  const compData=compositeFrame(safeIdx);
  previewCtx.putImageData(new ImageData(new Uint8ClampedArray(compData),canvasW,canvasH),0,0);
}
function renderPreviewEmpty(){
  // Task 4 修复:0帧时显示提示文字
  const hint = '请先添加帧';
  previewCanvas.width = canvasW;
  previewCanvas.height = canvasH;
  previewCtx.imageSmoothingEnabled = false;
  // 棋盘格背景
  const cell = Math.max(2, Math.floor(Math.min(canvasW, canvasH) / 12));
  for(let y=0;y<canvasH;y+=cell){
    for(let x=0;x<canvasW;x+=cell){
      const c = ((Math.floor(x/cell)+Math.floor(y/cell)) % 2 === 0) ? 230 : 200;
      previewCtx.fillStyle = 'rgb(' + c + ',' + c + ',' + c + ')';
      previewCtx.fillRect(x, y, cell, cell);
    }
  }
  // 文字 - 用最大字号适配画布
  const fontSize = Math.max(6, Math.floor(Math.min(canvasW, canvasH) / hint.length * 1.4));
  previewCtx.fillStyle = '#666';
  previewCtx.font = 'bold ' + fontSize + 'px sans-serif';
  previewCtx.textAlign = 'center';
  previewCtx.textBaseline = 'middle';
  previewCtx.fillText(hint, canvasW/2, canvasH/2);
}

// ── 悬浮预览窗 ──
function toggleFloatingPreview(){
  const el = document.getElementById('floatingPreview');
  const btn = document.getElementById('previewMaxBtn');
  if(!el) return;
  if(floatingPreviewVisible){
    closeFloatingPreview();
  } else {
    openFloatingPreview();
  }
}

function openFloatingPreview(){
  const el = document.getElementById('floatingPreview');
  const btn = document.getElementById('previewMaxBtn');
  if(!el) return;
  floatingPreviewVisible = true;
  // 默认居中定位
  if(floatingPreviewX < 0) floatingPreviewX = Math.max(10, (window.innerWidth - floatingPreviewW) / 2);
  if(floatingPreviewY < 0) floatingPreviewY = Math.max(10, (window.innerHeight - floatingPreviewH) / 2);
  el.style.display = 'flex';
  el.style.width = floatingPreviewW + 'px';
  el.style.height = floatingPreviewH + 'px';
  el.style.left = floatingPreviewX + 'px';
  el.style.top = floatingPreviewY + 'px';
  if(btn) btn.classList.add('active');
  updateFloatingPreviewSize();
  floatingPreviewLastTime = 0;
  floatingPreviewFrame = 0;
  floatingPreviewAccumulator = 0;
  requestAnimationFrame(animateFloatingPreview);
}

function closeFloatingPreview(){
  const el = document.getElementById('floatingPreview');
  const btn = document.getElementById('previewMaxBtn');
  floatingPreviewVisible = false;
  if(el) el.style.display = 'none';
  if(btn) btn.classList.remove('active');
}

let floatingPreviewFrame = 0, floatingPreviewLastTime = 0, floatingPreviewAccumulator = 0;

function animateFloatingPreview(timestamp){
  if(!floatingPreviewVisible) return;
  if(!floatingPreviewLastTime) floatingPreviewLastTime = timestamp;
  const delta = timestamp - floatingPreviewLastTime;
  floatingPreviewLastTime = timestamp;
  if(floatingPreviewFrame >= frames.length) floatingPreviewFrame = 0;
  if(frames.length > 0){
    floatingPreviewAccumulator += delta;
    const duration = frames[floatingPreviewFrame].duration || 1;
    const frameDuration = (1000 / fps) * duration;
    if(floatingPreviewAccumulator >= frameDuration){
      floatingPreviewAccumulator -= frameDuration;
      floatingPreviewFrame = (floatingPreviewFrame + 1) % frames.length;
    }
    renderFloatingPreview();
  }
  requestAnimationFrame(animateFloatingPreview);
}

function renderFloatingPreview(){
  const cv = document.getElementById('floatingPreviewCanvas');
  if(!cv || frames.length === 0) return;
  // 用实际容器尺寸作为 canvas 的 css 尺寸,内部保持画布尺寸用于 pixelated 渲染
  const body = document.querySelector('.floating-preview-body');
  const maxW = body ? body.clientWidth - 16 : 280;
  const maxH = body ? body.clientHeight - 16 : 280;
  const scale = Math.min(maxW / canvasW, maxH / canvasH, 32);
  cv.width = canvasW;
  cv.height = canvasH;
  cv.style.width = (canvasW * scale) + 'px';
  cv.style.height = (canvasH * scale) + 'px';
  const fctx = cv.getContext('2d');
  fctx.imageSmoothingEnabled = false;
  fctx.clearRect(0, 0, canvasW, canvasH);
  const safeIdx = Math.min(floatingPreviewFrame, frames.length - 1);
  const compData = compositeFrame(safeIdx);
  fctx.putImageData(new ImageData(new Uint8ClampedArray(compData), canvasW, canvasH), 0, 0);
}

function updateFloatingPreviewSize(){
  const el = document.getElementById('floatingPreviewSize');
  if(el) el.textContent = canvasW + '×' + canvasH;
}

// ── 导出 ──
function exportSpritesheet(scale){scale=scale||1;const w=canvasW*scale,h=canvasH*scale,total=frames.length;const sheet=document.createElement('canvas');sheet.width=w*total;sheet.height=h;const sctx=sheet.getContext('2d');sctx.imageSmoothingEnabled=false;frames.forEach((f,i)=>{const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const tctx=tmp.getContext('2d');tctx.imageSmoothingEnabled=false;const rawData=compositeFrame(i);const imgData=new ImageData(new Uint8ClampedArray(rawData),canvasW,canvasH);const src=document.createElement('canvas');src.width=canvasW;src.height=canvasH;const sctx2=src.getContext('2d');sctx2.putImageData(imgData,0,0);tctx.drawImage(src,0,0,w,h);sctx.drawImage(tmp,i*w,0);});downloadCanvas(sheet,`spritesheet_${canvasW}x${canvasH}_${total}frames.png`);toast('序列帧已导出！');}

function exportFramesWithScale(scale){const w=canvasW*scale,h=canvasH*scale;frames.forEach((f,i)=>{const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const tctx=tmp.getContext('2d');tctx.imageSmoothingEnabled=false;const rawData=compositeFrame(i);const imgData=new ImageData(new Uint8ClampedArray(rawData),canvasW,canvasH);const src=document.createElement('canvas');src.width=canvasW;src.height=canvasH;const sctx=src.getContext('2d');sctx.putImageData(imgData,0,0);tctx.drawImage(src,0,0,w,h);setTimeout(()=>downloadCanvas(tmp,`frame_${String(i+1).padStart(3,'0')}.png`),i*100);});toast(`正在导出 ${frames.length} 个单帧...`);}
function exportFrames(){exportFramesWithScale(1);}

function downloadCanvas(canvas,filename){const a=document.createElement('a');a.download=filename;a.href=canvas.toDataURL('image/png');a.click();}
function downloadBlob(blob,filename){const a=document.createElement('a');a.download=filename;a.href=URL.createObjectURL(blob);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

// ── GIF 编码器 ──
const GifEncoder = {
  encode(framesInput, width, height, fps, transparent, loopCount, onProgress, scale) {
    // Task 6 修复:每帧从最新 frames 实时合成,保证不含陈旧数据
    const compFrames = framesInput.map((f, i) => ({ data: compositeFrame(i), duration: f.duration }));
    const delay = Math.round(100 / fps);
    const colorMap = new Map(), colorList = []; let transpIndex = 0;
    const usedColors = new Set();
    for (const frame of compFrames) { const d = frame.data; for (let i = 0; i < d.length; i += 4) { if (d[i+3] < 128) continue; usedColors.add(`${d[i]},${d[i+1]},${d[i+2]}`); } }
    if (transparent) { let sentinel = [0,0,0]; if(usedColors.has('0,0,0'))sentinel=[0,0,1]; if(usedColors.has(`${sentinel[0]},${sentinel[1]},${sentinel[2]}`))sentinel=[1,0,1]; if(usedColors.has(`${sentinel[0]},${sentinel[1]},${sentinel[2]}`))sentinel=[1,1,0]; colorMap.set(`${sentinel[0]},${sentinel[1]},${sentinel[2]}`,0); colorList.push(sentinel[0],sentinel[1],sentinel[2]); transpIndex=0; }
    for (const frame of compFrames) { const d = frame.data; for (let i = 0; i < d.length; i += 4) { const a = d[i+3]; if(a<128)continue; const key=`${d[i]},${d[i+1]},${d[i+2]}`; if(!colorMap.has(key)){if(colorMap.size>=256)continue;colorMap.set(key,colorMap.size);colorList.push(d[i],d[i+1],d[i+2]);}} }
    let ctSize=2;while(ctSize<colorMap.size)ctSize*=2;ctSize=Math.max(2,ctSize);const ctBits=Math.log2(ctSize);
    const gct=new Uint8Array(ctSize*3);for(let i=0;i<colorList.length;i++)gct[i]=colorList[i];
    const indexedFrames=compFrames.map(frame=>{const d=frame.data;const indices=new Uint8Array(width*height);for(let i=0;i<width*height;i++){const a=d[i*4+3];if(a<128){indices[i]=transpIndex;}else{const key=`${d[i*4]},${d[i*4+1]},${d[i*4+2]}`;indices[i]=colorMap.has(key)?colorMap.get(key):transpIndex;}}return indices;});
    scale=scale||1;const scaledW=width*scale,scaledH=height*scale;const scaledIndexedFrames=indexedFrames.map(indices=>{const scaled=new Uint8Array(scaledW*scaledH);for(let y=0;y<height;y++){for(let x=0;x<width;x++){const val=indices[y*width+x];for(let dy=0;dy<scale;dy++){for(let dx=0;dx<scale;dx++){scaled[(y*scale+dy)*scaledW+(x*scale+dx)]=val;}}}}return scaled;});
    const buf=[];const writeByte=b=>buf.push(b&0xff);const writeShort=s=>{buf.push(s&0xff);buf.push((s>>8)&0xff);};const writeString=s=>{for(let i=0;i<s.length;i++)buf.push(s.charCodeAt(i));};const writeBytes=arr=>{for(let i=0;i<arr.length;i++)buf.push(arr[i]);};
    writeString('GIF89a');writeShort(scaledW);writeShort(scaledH);writeByte(0x80|((ctBits-1)<<4)|(ctBits-1));writeByte(transparent?transpIndex:0);writeByte(0);writeBytes(gct);
    if(loopCount>=0){writeByte(0x21);writeByte(0xff);writeByte(11);writeString('NETSCAPE2.0');writeByte(3);writeByte(1);writeShort(loopCount);writeByte(0);}
    // Task 6 修复:disposal method 设为 2 (Restore to background)
    // 防止上一帧内容残留在本帧透明区域,等价于每帧前 clearRect
    // 若不需要透明,使用 disposal 1 (Do not dispose) 保持文件更小
    const disposal = transparent ? 2 : 1;
    for(let f=0;f<compFrames.length;f++){if(onProgress)onProgress(f/compFrames.length,`编码帧 ${f+1}/${compFrames.length}...`);const frameDelay=Math.round((compFrames[f].duration||1)*delay);writeByte(0x21);writeByte(0xf9);writeByte(4);writeByte((disposal<<2)|(transparent?1:0));writeShort(frameDelay);writeByte(transparent?transpIndex:0);writeByte(0);writeByte(0x2c);writeShort(0);writeShort(0);writeShort(scaledW);writeShort(scaledH);writeByte(0);const minCodeSize=Math.max(2,ctBits);const lzwData=this.lzwEncode(scaledIndexedFrames[f],minCodeSize);writeByte(minCodeSize);let offset=0;while(offset<lzwData.length){const blockSize=Math.min(255,lzwData.length-offset);writeByte(blockSize);for(let i=0;i<blockSize;i++)writeByte(lzwData[offset+i]);offset+=blockSize;}writeByte(0);}
    writeByte(0x3b);if(onProgress)onProgress(1,'编码完成！');return new Blob([new Uint8Array(buf)],{type:'image/gif'});
  },
  lzwEncode(indices, minCodeSize) {
    const clearCode=1<<minCodeSize,eoiCode=clearCode+1;let codeSize=minCodeSize+1,nextCode=eoiCode+1;const maxCode=4096;
    let codeTable=new Map();for(let i=0;i<clearCode;i++)codeTable.set(String(i),i);
    const output=[];let bitBuffer=0,bitCount=0;
    function writeBits(code,size){bitBuffer|=(code<<bitCount);bitCount+=size;while(bitCount>=8){output.push(bitBuffer&0xff);bitBuffer>>=8;bitCount-=8;}}
    writeBits(clearCode,codeSize);let current=String(indices[0]);
    for(let i=1;i<indices.length;i++){const next=String(indices[i]);const combined=current+','+next;if(codeTable.has(combined)){current=combined;}else{writeBits(codeTable.get(current),codeSize);if(nextCode<maxCode){codeTable.set(combined,nextCode);nextCode++;if(nextCode>(1<<codeSize)&&codeSize<12)codeSize++;}else{writeBits(clearCode,codeSize);codeTable=new Map();for(let j=0;j<clearCode;j++)codeTable.set(String(j),j);nextCode=eoiCode+1;codeSize=minCodeSize+1;}current=next;}}
    writeBits(codeTable.get(current),codeSize);writeBits(eoiCode,codeSize);if(bitCount>0)output.push(bitBuffer&0xff);return output;
  }
};

// ── GIF 导出对话框 ──
function showGifExportDialog(){document.getElementById('gifFps').value=fps;document.getElementById('gifTransparent').checked=true;document.getElementById('gifLoop').value=0;document.getElementById('gifScale').value='4';document.getElementById('gifProgress').style.display='none';document.getElementById('gifProgressFill').style.width='0%';document.getElementById('gifStatus').textContent='';document.getElementById('gifExportBtn').disabled=false;document.getElementById('gifExportDialog').style.display='flex';}
function closeGifExportDialog(){document.getElementById('gifExportDialog').style.display='none';}
function doGifExport(){const gifFps=Math.max(1,Math.min(30,parseInt(document.getElementById('gifFps').value)||8));const transparent=document.getElementById('gifTransparent').checked;const loopCount=Math.max(0,parseInt(document.getElementById('gifLoop').value)||0);const scale=Math.max(1,Math.min(32,parseInt(document.getElementById('gifScale').value)||4));document.getElementById('gifExportBtn').disabled=true;document.getElementById('gifProgress').style.display='block';setTimeout(()=>{try{const blob=GifEncoder.encode(frames,canvasW,canvasH,gifFps,transparent,loopCount,(progress,status)=>{document.getElementById('gifProgressFill').style.width=Math.round(progress*100)+'%';document.getElementById('gifStatus').textContent=status;},scale);document.getElementById('gifProgressFill').style.width='100%';document.getElementById('gifStatus').textContent='导出完成！';downloadBlob(blob,`animation_${canvasW}x${canvasH}_${frames.length}frames.gif`);toast('GIF 已导出！');setTimeout(()=>closeGifExportDialog(),500);}catch(err){document.getElementById('gifStatus').textContent='导出失败: '+err.message;document.getElementById('gifExportBtn').disabled=false;}},50);}

// ── PNG 单帧导出 ──
function showPngExportDialog(){document.getElementById('pngScale').value='4';document.getElementById('pngStatus').textContent='';document.getElementById('pngExportDialog').style.display='flex';}
function closePngExportDialog(){document.getElementById('pngExportDialog').style.display='none';}
function doPngExport(){const scale=Math.max(1,Math.min(32,parseInt(document.getElementById('pngScale').value)||4));closePngExportDialog();exportFramesWithScale(scale);}

// ── 序列帧导出 ──
function showSpritesheetDialog(){document.getElementById('sheetCols').value=0;document.getElementById('sheetSpacing').value=0;document.getElementById('sheetScale').value='4';document.getElementById('sheetJson').checked=false;document.getElementById('sheetStatus').textContent='';document.getElementById('spritesheetDialog').style.display='flex';}
function closeSpritesheetDialog(){document.getElementById('spritesheetDialog').style.display='none';}
function calcSheetLayout(frameCount,colsInput){let cols=colsInput;if(!cols||cols<=0)cols=Math.ceil(Math.sqrt(frameCount));cols=Math.max(1,Math.min(cols,frameCount));return{cols,rows:Math.ceil(frameCount/cols)};}
function buildSpritesheetCanvas(cols,rows,spacing,scale){scale=scale||1;const w=canvasW*scale,h=canvasH*scale;const sheetW=cols*(w+spacing)-spacing,sheetH=rows*(h+spacing)-spacing;const sheet=document.createElement('canvas');sheet.width=Math.max(1,sheetW);sheet.height=Math.max(1,sheetH);const sctx=sheet.getContext('2d');sctx.imageSmoothingEnabled=false;frames.forEach((f,i)=>{const col=i%cols,row=Math.floor(i/cols);const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const tctx=tmp.getContext('2d');tctx.imageSmoothingEnabled=false;const rawData=compositeFrame(i);const imgData=new ImageData(new Uint8ClampedArray(rawData),canvasW,canvasH);const src=document.createElement('canvas');src.width=canvasW;src.height=canvasH;const sctx2=src.getContext('2d');sctx2.putImageData(imgData,0,0);tctx.drawImage(src,0,0,w,h);sctx.drawImage(tmp,col*(w+spacing),row*(h+spacing));});return sheet;}
function doSpritesheetExport(){const colsInput=parseInt(document.getElementById('sheetCols').value)||0,spacing=parseInt(document.getElementById('sheetSpacing').value)||0,scale=Math.max(1,Math.min(32,parseInt(document.getElementById('sheetScale').value)||4)),exportJson=document.getElementById('sheetJson').checked;const{cols,rows}=calcSheetLayout(frames.length,colsInput);const sheet=buildSpritesheetCanvas(cols,rows,spacing,scale);downloadCanvas(sheet,`spritesheet_${canvasW}x${canvasH}_${frames.length}frames.png`);document.getElementById('sheetStatus').textContent='序列帧 PNG 已导出！';if(exportJson){const sw=canvasW*scale,sh=canvasH*scale;const metadata={width:canvasW,height:canvasH,frameWidth:canvasW,frameHeight:canvasH,frameCount:frames.length,fps:fps,columns:cols,rows:rows,spacing:spacing,frames:frames.map((f,i)=>({index:i,x:(i%cols)*(sw+spacing),y:Math.floor(i/cols)*(sh+spacing),duration:f.duration||1}))};downloadBlob(new Blob([JSON.stringify(metadata,null,2)],{type:'application/json'}),`spritesheet_${canvasW}x${canvasH}_metadata.json`);document.getElementById('sheetStatus').textContent='序列帧 PNG + JSON 已导出！';}toast('序列帧已导出！');setTimeout(()=>closeSpritesheetDialog(),800);}

// ── CSS 精灵导出 ──
function showCssSpriteDialog(){document.getElementById('cssCols').value=0;document.getElementById('cssSpacing').value=0;document.getElementById('cssSpriteStatus').textContent='';document.getElementById('cssSpriteDialog').style.display='flex';}
function closeCssSpriteDialog(){document.getElementById('cssSpriteDialog').style.display='none';}
function doCssSpriteExport(){const colsInput=parseInt(document.getElementById('cssCols').value)||0,spacing=parseInt(document.getElementById('cssSpacing').value)||0;const{cols,rows}=calcSheetLayout(frames.length,colsInput);const sheet=buildSpritesheetCanvas(cols,rows,spacing);downloadCanvas(sheet,`css_sprite_${canvasW}x${canvasH}.png`);const pngDataUrl=sheet.toDataURL('image/png');const totalDuration=(frames.length/fps).toFixed(3);let css=`/* CSS Sprite — Pixel Studio 自动生成 */\n/* 画布: ${canvasW}x${canvasH}, 帧数: ${frames.length}, FPS: ${fps} */\n\n.sprite {\n  display: inline-block;\n  width: ${canvasW}px;\n  height: ${canvasH}px;\n  background-image: url('${pngDataUrl}');\n  background-repeat: no-repeat;\n  image-rendering: pixelated;\n}\n\n`;frames.forEach((f,i)=>{const col=i%cols,row=Math.floor(i/cols);css+=`.sprite-frame-${i} {\n  background-position: -${col*(canvasW+spacing)}px -${row*(canvasH+spacing)}px;\n}\n\n`;});css+=`@keyframes sprite-animation {\n`;frames.forEach((f,i)=>{css+=`  ${((i/frames.length)*100).toFixed(2)}% { background-position: -${(i%cols)*(canvasW+spacing)}px -${Math.floor(i/cols)*(canvasH+spacing)}px; }\n`;});css+=`  100% { background-position: 0px 0px; }\n}\n\n.sprite-animated {\n  animation: sprite-animation ${totalDuration}s steps(${frames.length}) infinite;\n}\n`;downloadBlob(new Blob([css],{type:'text/css'}),`css_sprite_${canvasW}x${canvasH}.css`);document.getElementById('cssSpriteStatus').textContent='PNG + CSS 已导出！';toast('CSS 精灵已导出！');setTimeout(()=>closeCssSpriteDialog(),800);}

// ── Data URI 导出 ──
function showDataUriDialog(){document.getElementById('dataUriScope').value='current';document.getElementById('dataUriText').value='';document.getElementById('dataUriStatus').textContent='';document.getElementById('dataUriDialog').style.display='flex';}
function closeDataUriDialog(){document.getElementById('dataUriDialog').style.display='none';}
function generateDataUri(){const scope=document.getElementById('dataUriScope').value;let canvas;if(scope==='current'){canvas=document.createElement('canvas');canvas.width=canvasW;canvas.height=canvasH;const tctx=canvas.getContext('2d');tctx.putImageData(new ImageData(new Uint8ClampedArray(compositeFrame(currentFrame)),canvasW,canvasH),0,0);}else{const{cols,rows}=calcSheetLayout(frames.length,0);canvas=buildSpritesheetCanvas(cols,rows,0);}const dataUri=canvas.toDataURL('image/png');document.getElementById('dataUriText').value=dataUri;document.getElementById('dataUriStatus').textContent=`已生成 (${(dataUri.length/1024).toFixed(1)} KB)`;}
function copyDataUri(){const text=document.getElementById('dataUriText').value;if(!text){toast('请先生成 Data URI');return;}navigator.clipboard.writeText(text).then(()=>{toast('已复制到剪贴板！');document.getElementById('dataUriStatus').textContent='已复制到剪贴板！';}).catch(()=>{document.getElementById('dataUriText').select();document.execCommand('copy');toast('已复制到剪贴板！');});}

// ── 保存/载入项目 ──
function saveProject() {
  const project = {
    version: 3, canvasW, canvasH, pixelSize, fps, onionMode, onionFrameCount, onionOpacity, customColors,
    frames: frames.map(f => ({
      layers: f.layers.map(l => ({ data: Array.from(l.data), name: l.name, visible: l.visible, opacity: l.opacity })),
      duration: f.duration
    }))
  };
  const json = JSON.stringify(project);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a'); a.download = 'pixel_project.json'; a.href = URL.createObjectURL(blob); a.click();
  toast('项目已保存！');
}

function loadFramesFromProject(proj) {
  return proj.frames.map(f => {
    if (f.layers) {
      return { layers: f.layers.map(l => ({ data: new Uint8ClampedArray(l.data), name: l.name||'Layer 1', visible: l.visible!==false, opacity: l.opacity!==undefined?l.opacity:1 })), duration: f.duration||1 };
    } else if (Array.isArray(f)) {
      return { layers: [{ data: new Uint8ClampedArray(f), name: 'Layer 1', visible: true, opacity: 1 }], duration: 1 };
    } else {
      return { layers: [{ data: new Uint8ClampedArray(f.data), name: 'Layer 1', visible: true, opacity: 1 }], duration: f.duration||1 };
    }
  });
}

function loadProjectPrompt() {
  const input = document.createElement('input'); input.type='file'; input.accept='.json'; input.multiple=false;
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const proj = JSON.parse(ev.target.result);
        canvasW = proj.canvasW; canvasH = proj.canvasH;
        pixelSize = proj.pixelSize || 20; fps = proj.fps || 8;
        onionMode = proj.onionMode || (proj.onionSkinEnabled !== false ? 'prev' : 'off');
        onionFrameCount = proj.onionFrameCount || 1; onionOpacity = proj.onionOpacity || 40;
        if (proj.customColors) customColors = proj.customColors;
        frames = loadFramesFromProject(proj);
        currentFrame = 0; activeLayerIndex = 0;
        moveOffsetX = 0; moveOffsetY = 0;
        if (selection.active) clearSelectionState();
        clearHistory();
        document.getElementById('canvasW').value = canvasW; document.getElementById('canvasH').value = canvasH;
        document.getElementById('zoomSlider').value = pixelSize; document.getElementById('fpsSlider').value = fps;
        document.getElementById('onionOpacity').value = onionOpacity; document.getElementById('onionMode').value = onionMode;
        document.getElementById('onionFrameCount').value = onionFrameCount;
        saveCustomColors(); buildPalette(); updateFpsLabel(); initPreview(); render();
        toast('项目已载入！');
      } catch (err) { toast('载入失败：JSON文件格式错误'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── 图片导入 ──
let importImages = []; // array of { img: Image, name: string }
let importPreviewIndex = 0; // which image is currently shown in preview
let importImageData = null; // current preview image (for processImageToPixels compatibility)

function onImportTargetModeChange() {
  const mode = document.getElementById('importTargetMode').value;
  const btn = document.getElementById('importConfirmBtn');
  if (mode === 'newFrames') {
    btn.textContent = '确认导入 → 每张图作为新帧';
  } else {
    btn.textContent = '确认导入 → 当前帧';
  }
}

function showImportDialog() {
  const dlg = document.getElementById('importDialog'); dlg.style.display = 'flex';
  document.getElementById('importMode').value = 'keep';
  document.getElementById('importSizeMode').value = 'original';
  document.getElementById('importTargetMode').value = 'currentFrame';
  document.getElementById('posterizeRow').style.display = 'none';
  document.getElementById('previewRow').style.display = 'none';
  document.getElementById('importFileList').style.display = 'none';
  document.getElementById('importFileList').innerHTML = '';
  importImages = [];
  importImageData = null;
  importPreviewIndex = 0;
  document.getElementById('fileDrop').classList.remove('has-file');
  document.getElementById('fileDropText').textContent = '点击选择图片 或拖拽到此处（支持多选）';
  document.getElementById('importFile').value = '';
  onImportTargetModeChange();
  document.getElementById('importMode').onchange = function() { document.getElementById('posterizeRow').style.display = this.value==='posterize'?'flex':'none'; previewImport(); };
  const drop = document.getElementById('fileDrop');
  drop.ondragover = e => { e.preventDefault(); drop.style.borderColor = '#e94560'; };
  drop.ondragleave = () => { drop.style.borderColor = ''; };
  drop.ondrop = e => { e.preventDefault(); drop.style.borderColor = ''; const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); if (files.length > 0) loadImageFiles(files); };
  // Note: <label> wrapping the <input> already triggers the file picker on click,
  // so do NOT add drop.onclick here or it will open the picker twice.
}

function closeImportDialog() { document.getElementById('importDialog').style.display = 'none'; importImages = []; importImageData = null; }
function onFileSelected(input) { const files = Array.from(input.files); if (files.length > 0) loadImageFiles(files); }

function loadImageFiles(files) {
  let loaded = 0;
  const total = files.length;
  importImages = [];
  importPreviewIndex = 0;
  files.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        importImages[idx] = { img, name: file.name };
        loaded++;
        if (loaded === total) {
          // All loaded
          importImageData = importImages[0].img;
          const count = importImages.length;
          document.getElementById('fileDrop').classList.add('has-file');
          document.getElementById('fileDropText').textContent = '✅ 已选择 ' + count + ' 张图片';
          buildImportFileList();
          previewImport();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function buildImportFileList() {
  const list = document.getElementById('importFileList');
  list.innerHTML = '';
  if (importImages.length <= 1) {
    list.style.display = 'none';
    return;
  }
  list.style.display = 'flex';
  importImages.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'import-file-item' + (idx === importPreviewIndex ? ' active' : '');
    const thumb = document.createElement('canvas');
    thumb.width = 48; thumb.height = 48;
    const tctx = thumb.getContext('2d');
    tctx.imageSmoothingEnabled = true;
    const sc = Math.min(48 / item.img.width, 48 / item.img.height);
    const dw = item.img.width * sc, dh = item.img.height * sc;
    tctx.drawImage(item.img, (48 - dw) / 2, (48 - dh) / 2, dw, dh);
    div.appendChild(thumb);
    const indexLabel = document.createElement('span');
    indexLabel.className = 'file-index';
    indexLabel.textContent = idx + 1;
    div.appendChild(indexLabel);
    div.onclick = () => {
      importPreviewIndex = idx;
      importImageData = importImages[idx].img;
      document.querySelectorAll('.import-file-item').forEach((el, i) => el.classList.toggle('active', i === idx));
      previewImport();
    };
    list.appendChild(div);
  });
}

function previewImport() {
  if (!importImageData) return;
  document.getElementById('previewRow').style.display = 'flex';
  const sizeMode = document.getElementById('importSizeMode').value;

  const origCv = document.getElementById('previewOrig'); const octx = origCv.getContext('2d'); origCv.width=80;origCv.height=80;octx.imageSmoothingEnabled=true;
  const sc=Math.min(80/importImageData.width,80/importImageData.height);const dw=importImageData.width*sc,dh=importImageData.height*sc;octx.clearRect(0,0,80,80);octx.drawImage(importImageData,(80-dw)/2,(80-dh)/2,dw,dh);

  if (sizeMode === 'original') {
    // Original size preview: show image at its display size within the canvas
    const displaySize = getOriginalDisplaySize(importImageData);
    const pxCv=document.getElementById('previewPixel');
    const previewScale = Math.min(160 / canvasW, 160 / canvasH, 10);
    pxCv.width=Math.round(canvasW * previewScale); pxCv.height=Math.round(canvasH * previewScale);
    const pctx=pxCv.getContext('2d'); pctx.imageSmoothingEnabled=false;
    // Draw checkerboard background
    pctx.fillStyle='#2a2a3e'; pctx.fillRect(0,0,pxCv.width,pxCv.height);
    pctx.fillStyle='#1e1e30';
    for(let y=0;y<canvasH;y++) for(let x=0;x<canvasW;x++) { if((x+y)%2===0) pctx.fillRect(x*previewScale,y*previewScale,previewScale,previewScale); }
    // Draw image at display size centered
    const ox = Math.max(0, Math.floor((canvasW - displaySize.w) / 2));
    const oy = Math.max(0, Math.floor((canvasH - displaySize.h) / 2));
    const tmp=document.createElement('canvas');tmp.width=displaySize.w;tmp.height=displaySize.h;const tctx=tmp.getContext('2d');
    tctx.imageSmoothingEnabled=false;
    tctx.drawImage(importImageData,0,0,displaySize.w,displaySize.h);
    pctx.imageSmoothingEnabled=false;
    pctx.drawImage(tmp, ox*previewScale, oy*previewScale, displaySize.w*previewScale, displaySize.h*previewScale);
  } else {
    // Pixel mode preview
    const pxCv=document.getElementById('previewPixel');pxCv.width=canvasW*10;pxCv.height=canvasH*10;const pctx=pxCv.getContext('2d');pctx.imageSmoothingEnabled=false;
    // Draw checkerboard background for transparency
    pctx.fillStyle='#2a2a3e';pctx.fillRect(0,0,pxCv.width,pxCv.height);
    pctx.fillStyle='#1e1e30';const sz2 = 10;
    for(let y=0;y<canvasH;y++)for(let x=0;x<canvasW;x++){if((x+y)%2===0)pctx.fillRect(x*sz2,y*sz2,sz2,sz2);}
    const data=processImageToPixels();if(!data)return;
    const tmp=document.createElement('canvas');tmp.width=canvasW;tmp.height=canvasH;const tctx=tmp.getContext('2d');tctx.putImageData(new ImageData(data,canvasW,canvasH),0,0);pctx.drawImage(tmp,0,0,canvasW*10,canvasH*10);
  }
}

// Calculate display size for original-size import
function getOriginalDisplaySize(img) {
  let w = img.width, h = img.height;
  // If image is larger than canvas, scale down to fit while maintaining aspect ratio
  if (w > canvasW || h > canvasH) {
    const scaleW = canvasW / w;
    const scaleH = canvasH / h;
    const scale = Math.min(scaleW, scaleH);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  w = Math.max(1, Math.min(w, canvasW));
  h = Math.max(1, Math.min(h, canvasH));
  return { w, h };
}

// Process image for original-size import: returns { data, w, h }
function processImageOriginalSize(img, colorMode) {
  const displaySize = getOriginalDisplaySize(img);
  const tmp = document.createElement('canvas');
  tmp.width = displaySize.w; tmp.height = displaySize.h;
  const tctx = tmp.getContext('2d');
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(img, 0, 0, displaySize.w, displaySize.h);
  const imgData = tctx.getImageData(0, 0, displaySize.w, displaySize.h);
  const d = imgData.data;
  // Apply color processing
  const mode = colorMode || (document.getElementById('importMode') ? document.getElementById('importMode').value : 'keep');
  for (let i = 0; i < displaySize.w * displaySize.h; i++) {
    const idx = i * 4;
    const a = d[idx + 3];
    if (a < 128) { d[idx] = 0; d[idx + 1] = 0; d[idx + 2] = 0; d[idx + 3] = 0; continue; }
    const r = d[idx], g = d[idx + 1], b = d[idx + 2];
    if (mode === 'palette') {
      const hex = closestPaletteColor(r, g, b);
      const [pr, pg, pb] = hexToRgb(hex);
      d[idx] = pr; d[idx + 1] = pg; d[idx + 2] = pb; d[idx + 3] = 255;
    } else if (mode === 'posterize') {
      const lvEl = document.getElementById('posterizeLevels');
      const lv = lvEl ? parseInt(lvEl.value) : 6;
      d[idx] = posterizeVal(r, lv); d[idx + 1] = posterizeVal(g, lv); d[idx + 2] = posterizeVal(b, lv); d[idx + 3] = 255;
    } else {
      d[idx + 3] = 255;
    }
  }
  return { data: d, w: displaySize.w, h: displaySize.h };
}

// Import image at 1:1 pixel size — resize canvas to match image dimensions
function processImageOriginalToCanvas(img, asNewFrame) {
  const imgW = img.width, imgH = img.height;
  // Resize canvas to image dimensions
  canvasW = imgW; canvasH = imgH;
  document.getElementById('canvasW').value = canvasW;
  document.getElementById('canvasH').value = canvasH;
  moveOffsetX = 0; moveOffsetY = 0;
  // Draw image at 1:1 onto a temp canvas to extract pixel data
  const tmp = document.createElement('canvas');
  tmp.width = imgW; tmp.height = imgH;
  const tctx = tmp.getContext('2d');
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(img, 0, 0, imgW, imgH);
  const imgData = tctx.getImageData(0, 0, imgW, imgH);
  const d = imgData.data;
  // Apply color processing
  const mode = document.getElementById('importMode').value;
  for (let i = 0; i < imgW * imgH; i++) {
    const idx = i * 4;
    const a = d[idx + 3];
    if (a < 128) { d[idx] = 0; d[idx + 1] = 0; d[idx + 2] = 0; d[idx + 3] = 0; continue; }
    const r = d[idx], g = d[idx + 1], b = d[idx + 2];
    if (mode === 'palette') {
      const hex = closestPaletteColor(r, g, b);
      const [pr, pg, pb] = hexToRgb(hex);
      d[idx] = pr; d[idx + 1] = pg; d[idx + 2] = pb; d[idx + 3] = 255;
    } else if (mode === 'posterize') {
      const lvEl = document.getElementById('posterizeLevels');
      const lv = lvEl ? parseInt(lvEl.value) : 6;
      d[idx] = posterizeVal(r, lv); d[idx + 1] = posterizeVal(g, lv); d[idx + 2] = posterizeVal(b, lv); d[idx + 3] = 255;
    } else { d[idx + 3] = 255; }
  }
  if (asNewFrame) {
    // Create a new frame at the new canvas size with image data
    const newFrame = createFrame(imgW, imgH);
    newFrame.layers[0].data = new Uint8ClampedArray(d);
    frames.splice(currentFrame + 1, 0, newFrame);
    // Resize all existing frames to match new canvas size
    frames.forEach((f, i) => {
      if (i !== currentFrame + 1) {
        const oldData = f.layers[0].data;
        const newData = new Uint8ClampedArray(imgW * imgH * 4);
        // Copy old data as much as possible into new-sized buffer
        const oldW = Math.min(imgW, Math.sqrt(oldData.length / 4));
        const oldH = Math.min(imgH, oldData.length / 4 / oldW);
        for (let y = 0; y < oldH; y++) {
          for (let x = 0; x < oldW; x++) {
            const si = (y * oldW + x) * 4;
            const di = (y * imgW + x) * 4;
            newData[di] = oldData[si];
            newData[di + 1] = oldData[si + 1];
            newData[di + 2] = oldData[si + 2];
            newData[di + 3] = oldData[si + 3];
          }
        }
        f.layers[0].data = newData;
      }
    });
    buildPalette(); updateFpsLabel(); initPreview();
  } else {
    // Floating selection: place entire image as selection
    // CRITICAL: Resize existing frame's layer data to match new canvas size
    frames.forEach(f => {
      f.layers.forEach(layer => {
        const oldData = layer.data;
        const newData = new Uint8ClampedArray(imgW * imgH * 4);
        const oldW = Math.min(imgW, Math.sqrt(oldData.length / 4));
        const oldH = Math.min(imgH, oldData.length / 4 / oldW);
        for (let y = 0; y < oldH; y++) {
          for (let x = 0; x < oldW; x++) {
            const si = (y * oldW + x) * 4;
            const di = (y * imgW + x) * 4;
            newData[di] = oldData[si];
            newData[di + 1] = oldData[si + 1];
            newData[di + 2] = oldData[si + 2];
            newData[di + 3] = oldData[si + 3];
          }
        }
        layer.data = newData;
      });
    });
    selection.x = 0; selection.y = 0;
    selection.w = imgW; selection.h = imgH;
    selection.offsetX = 0; selection.offsetY = 0;
    selection.data = new Uint8ClampedArray(d);
    selection.originalData = new Uint8ClampedArray(d);
    selection.active = true; selection.creating = false; selection.dragging = false;
    selection.isCut = false;
    selection.rotation = 0; selection.scaleX = 1; selection.scaleY = 1;
    selection.handleDragging = null;
    document.getElementById('selectionToolbar').style.display = 'flex';
    updateSelectionToolbar(); startMarchingAnts();
    setTool('selection', document.querySelector('[data-tool="selection"]'));
    buildPalette(); updateFpsLabel(); initPreview();
  }
}

function processImageToPixels(img) {
  const source = img || importImageData;
  if (!source) return null;
  const tmp=document.createElement('canvas');tmp.width=canvasW;tmp.height=canvasH;const tctx=tmp.getContext('2d');tctx.imageSmoothingEnabled=false;
  const ia=source.width/source.height,ca=canvasW/canvasH;let sx,sy,sw,sh;
  if(ia>ca){sh=source.height;sw=sh*ca;sx=(source.width-sw)/2;sy=0;}else{sw=source.width;sh=sw/ca;sx=0;sy=(source.height-sh)/2;}
  tctx.drawImage(source,sx,sy,sw,sh,0,0,canvasW,canvasH);
  const imgData=tctx.getImageData(0,0,canvasW,canvasH);const d=imgData.data;const mode=document.getElementById('importMode').value;
  for(let i=0;i<canvasW*canvasH;i++){const idx=i*4;const a=d[idx+3];if(a<128){d[idx]=0;d[idx+1]=0;d[idx+2]=0;d[idx+3]=0;continue;}const r=d[idx],g=d[idx+1],b=d[idx+2];
  if(mode==='palette'){const hex=closestPaletteColor(r,g,b);const[pr,pg,pb]=hexToRgb(hex);d[idx]=pr;d[idx+1]=pg;d[idx+2]=pb;d[idx+3]=255;}
  else if(mode==='posterize'){const lv=parseInt(document.getElementById('posterizeLevels').value);d[idx]=posterizeVal(r,lv);d[idx+1]=posterizeVal(g,lv);d[idx+2]=posterizeVal(b,lv);d[idx+3]=255;}
  else{d[idx+3]=255;}}return d;
}

function closestPaletteColor(r,g,b){let best=paletteColors[0],bestDist=Infinity;for(const hex of paletteColors){const[pr,pg,pb]=hexToRgb(hex);const dist=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(dist<bestDist){bestDist=dist;best=hex;}}return best;}
function posterizeVal(v,levels){const step=255/(levels-1);return Math.round(Math.round(v/step)*step);}

function doImport() {
  if (importImages.length === 0) { toast('请先选择图片'); return; }
  const mode = document.getElementById('importTargetMode').value;
  const sizeMode = document.getElementById('importSizeMode').value;

  // Original size + import to current frame → resize canvas to image, floating selection
  if (sizeMode === 'original' && mode === 'currentFrame') {
    if (selection.active) confirmSelection();
    pushHistory();
    importImageData = importImages[0].img;
    // Use image's actual pixel dimensions at 1:1 (no scaling)
    processImageOriginalToCanvas(importImageData);
    closeImportDialog(); render();
    toast('图片已作为浮动选区导入，可拖动/缩放/旋转后确认');
    return;
  }

  // Import as new frames (original or pixel mode)
  if (mode === 'newFrames') {
    pushHistory();
    importImages.forEach((item, idx) => {
      if (sizeMode === 'original') {
        // Resize canvas to image dimensions, import 1:1 as new frame
        processImageOriginalToCanvas(item.img, true);
      } else {
        const pixelData = processImageToPixels(item.img);
        if (!pixelData) return;
        const newFrame = createFrame(canvasW, canvasH);
        newFrame.layers[0].data = new Uint8ClampedArray(pixelData);
        frames.splice(currentFrame + 1 + idx, 0, newFrame);
      }
    });
    if (sizeMode === 'original') {
      currentFrame = currentFrame + 1;
    }
    closeImportDialog(); render();
    toast(`已导入 ${importImages.length} 张图片为新帧`);
    return;
  }

  // Import to current frame (pixel mode, original handled above)
  pushHistory();
  const pixelData = processImageToPixels(importImages[0].img);
  const data = currentLayerData();
  if (data && pixelData) {
    for (let i = 0; i < canvasW * canvasH * 4; i++) data[i] = pixelData[i];
  } else if (pixelData) {
    frames[currentFrame].layers[activeLayerIndex].data = new Uint8ClampedArray(pixelData);
  }
  closeImportDialog(); render();
  toast('图片已导入当前图层！');
}

// ── 平铺预览 ──
function toggleTilePreview() {
  tilePreview = !tilePreview;
  document.getElementById('tilePreviewBtn').classList.toggle('active', tilePreview);
  document.getElementById('tileCountLabel').style.display = tilePreview ? 'flex' : 'none';
  render();
}

// ── 参考图 ──
function loadReferenceImage() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        referenceImage = img;
        document.getElementById('refOpacityLabel').style.display = 'flex';
        document.getElementById('refClearBtn').style.display = '';
        render();
        toast('参考图已加载');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function clearReferenceImage() {
  referenceImage = null;
  document.getElementById('refOpacityLabel').style.display = 'none';
  document.getElementById('refClearBtn').style.display = 'none';
  render();
  toast('参考图已清除');
}

// ── Toast ──
function toast(msg){const existing=document.querySelector('.toast');if(existing)existing.remove();const div=document.createElement('div');div.className='toast';div.textContent=msg;document.body.appendChild(div);setTimeout(()=>div.remove(),2000);}

// ══════════════════════════════════════════════
// ── 新手引导 ──
// ══════════════════════════════════════════════
const TUT_STEPS = [
  { icon: '👋', title: '欢迎使用 Yerpx 像素工坊', desc: '这是一个免费、开箱即用的在线像素动画编辑器。<br>所有作品都存在你的浏览器本地,无需注册即可使用。', hint: '💡 随时按 F1 可重看本教程' },
  { icon: '🛠', title: '左侧工具栏', desc: '<b>🖌 铅笔</b> 画像素 · <b>🩹 橡皮</b> 擦除<br><b>📦 选区</b> 矩形选择 · <b>✋ 移动</b> 平移画布<br><b>🪣 填充</b> 桶填充 · <b>🖱 吸管</b> 取色', hint: '快捷键: P 铅笔 / E 橡皮 / S 选区 / V 移动 / G 填充 / I 吸管' },
  { icon: '🎨', title: '右侧调色板和图层', desc: '上方是<b>调色板</b>,点击颜色即可选色,画笔将使用该颜色。<br>下方是<b>图层</b>和<b>帧</b>管理,可以叠加图层、添加动画帧。', hint: '💡 鼠标右键点击调色板可添加自定义颜色' },
  { icon: '⌨️', title: '快捷键大全', desc: '<b>Ctrl+Z</b> 撤销 · <b>Ctrl+Y</b> 重做<br><b>Ctrl+C/V</b> 复制/粘贴选区<br><b>方向键</b> 1像素移动(选区),8像素(Shift+方向键)<br><b>空格+拖动</b> 平移画布 · <b>滚轮</b> 缩放', hint: '⚙️ 右下角"快捷键"面板随时可查' },
  { icon: '🚀', title: '开始创作吧!', desc: '你可以:<br>1️⃣ 点击右上 <b>📚 示例</b> 加载一个示例作品学习<br>2️⃣ 点击 <b>📷 导入</b> 上传图片转像素<br>3️⃣ 直接在画布上开画,记得用 <b>💾 保存</b> 留档', hint: '🎉 祝创作愉快!' }
];

let tutStep = 0;
function showTutorial(force) {
  if (!force) {
    // Auto-show only on first visit
    if (localStorage.getItem('yerpx-tutorial-seen') === '1') return;
  }
  tutStep = 0;
  document.getElementById('tutorialOverlay').style.display = 'block';
  renderTutStep();
  if (force) localStorage.setItem('yerpx-tutorial-seen', '0');
}
function renderTutStep() {
  const s = TUT_STEPS[tutStep];
  const total = TUT_STEPS.length;
  document.getElementById('tutStepNum').textContent = `第 ${tutStep+1} 步 / ${total} 步`;
  document.getElementById('tutIcon').textContent = s.icon;
  document.getElementById('tutTitle').textContent = s.title;
  document.getElementById('tutDesc').innerHTML = s.desc;
  const hint = document.getElementById('tutHint');
  if (s.hint) { hint.style.display = 'inline-block'; hint.textContent = s.hint; }
  else { hint.style.display = 'none'; }
  // Progress dots
  const prog = document.getElementById('tutProgress');
  prog.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'tutorial-dot' + (i === tutStep ? ' active' : (i < tutStep ? ' done' : ''));
    prog.appendChild(d);
  }
  document.getElementById('tutPrev').style.display = tutStep > 0 ? 'inline-block' : 'none';
  document.getElementById('tutNext').textContent = tutStep === total - 1 ? '开始创作 🎨' : '下一步 →';
}
function tutNext() {
  if (tutStep === TUT_STEPS.length - 1) { tutSkip(); return; }
  tutStep++;
  renderTutStep();
}
function tutPrev() {
  if (tutStep > 0) { tutStep--; renderTutStep(); }
}
function tutSkip() {
  document.getElementById('tutorialOverlay').style.display = 'none';
  localStorage.setItem('yerpx-tutorial-seen', '1');
}

// ══════════════════════════════════════════════
// ── 示例作品 ──
// ══════════════════════════════════════════════
// Pixel definitions use a palette map. Each pixel in the grid is a single char
// that maps to a color in the palette. '.' = transparent.
function _buildDemoFrame(w, h, rows, palette) {
  // rows: array of strings, each row is w chars long
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const row = rows[y] || '';
    for (let x = 0; x < w && x < row.length; x++) {
      const c = row[x];
      if (c === '.' || c === ' ') continue;
      const color = palette[c];
      if (!color) continue;
      const di = (y * w + x) * 4;
      data[di] = color[0]; data[di+1] = color[1]; data[di+2] = color[2]; data[di+3] = 255;
    }
  }
  return data;
}

// 形状辅助: 在字符网格上绘制形状,返回行字符串数组
// shapes: [{type:'circle'|'rect'|'tri', cx,cy,r| x,y,w,h, color:'K'}, ...]
// type: circle(圆心+半径), rect(左上+宽高), tri(等腰三角形底边中心+高+朝向'top'|'bottom')
function _makeFrameRows(w, h, shapes) {
  const grid = Array.from({length: h}, () => Array(w).fill('.'));
  shapes.forEach(s => {
    const key = s.color || 'K';
    if (s.type === 'rect') {
      const rx = s.x|0, ry = s.y|0, rw = s.w|0, rh = s.h|0;
      for (let dy = 0; dy < rh; dy++) {
        for (let dx = 0; dx < rw; dx++) {
          const px = rx + dx, py = ry + dy;
          if (px >= 0 && px < w && py >= 0 && py < h) grid[py][px] = key;
        }
      }
    } else if (s.type === 'circle') {
      const cx = s.cx, cy = s.cy, r = s.r;
      const r2 = r * r;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dy * dy <= r2 + r * 0.5) {
            const px = (cx + dx)|0, py = (cy + dy)|0;
            if (px >= 0 && px < w && py >= 0 && py < h) grid[py][px] = key;
          }
        }
      }
    } else if (s.type === 'tri') {
      // 等腰三角形, base 在底部, apex 在顶部 (朝向 'top') 或反过来 ('bottom')
      const bx = s.cx|0, by = s.cy|0, half = (s.w / 2)|0, ht = s.h|0;
      const dir = s.dir === 'bottom' ? 1 : -1;
      for (let row = 0; row < ht; row++) {
        const curHalf = Math.ceil(half * (row / ht));
        for (let dx = -curHalf; dx <= curHalf; dx++) {
          const px = bx + dx, py = by + row * dir;
          if (px >= 0 && px < w && py >= 0 && py < h) grid[py][px] = key;
        }
      }
    }
  });
  return grid.map(row => row.join(''));
}

const DEMO_PROJECTS = [
  {
    name: '🟢 弹弹史莱姆',
    desc: '64x64 二头身可爱史莱姆弹跳',
    info: '3帧 · 6 FPS',
    canvasW: 64, canvasH: 64, fps: 6,
    palette: {
      'G': [100, 200, 80],
      'D': [50, 140, 40],
      'H': [140, 230, 110],
      'W': [255, 255, 255],
      'K': [30, 30, 30],
      'P': [255, 150, 180],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:34, r:22, color:'G'},
        {type:'circle', cx:32, cy:35, r:20, color:'D'},
        {type:'circle', cx:32, cy:38, r:16, color:'G'},
        {type:'circle', cx:26, cy:28, r:6, color:'H'},
        {type:'circle', cx:28, cy:30, r:4, color:'G'},
        {type:'circle', cx:25, cy:33, r:6, color:'W'},
        {type:'circle', cx:39, cy:33, r:6, color:'W'},
        {type:'circle', cx:25, cy:33, r:3, color:'K'},
        {type:'circle', cx:39, cy:33, r:3, color:'K'},
        {type:'circle', cx:24, cy:32, r:1, color:'W'},
        {type:'circle', cx:38, cy:32, r:1, color:'W'},
        {type:'circle', cx:19, cy:37, r:3, color:'P'},
        {type:'circle', cx:45, cy:37, r:3, color:'P'},
        {type:'rect', x:20, y:52, w:10, h:6, color:'G'},
        {type:'rect', x:34, y:52, w:10, h:6, color:'G'},
        {type:'rect', x:21, y:55, w:8, h:4, color:'D'},
        {type:'rect', x:35, y:55, w:8, h:4, color:'D'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:38, r:22, color:'G'},
        {type:'circle', cx:32, cy:40, r:20, color:'D'},
        {type:'circle', cx:32, cy:42, r:14, color:'G'},
        {type:'circle', cx:26, cy:32, r:5, color:'H'},
        {type:'circle', cx:28, cy:34, r:3, color:'G'},
        {type:'circle', cx:26, cy:37, r:5, color:'W'},
        {type:'circle', cx:38, cy:37, r:5, color:'W'},
        {type:'circle', cx:26, cy:37, r:3, color:'K'},
        {type:'circle', cx:38, cy:37, r:3, color:'K'},
        {type:'circle', cx:25, cy:36, r:1, color:'W'},
        {type:'circle', cx:37, cy:36, r:1, color:'W'},
        {type:'circle', cx:20, cy:41, r:3, color:'P'},
        {type:'circle', cx:44, cy:41, r:3, color:'P'},
        {type:'rect', x:14, y:54, w:12, h:5, color:'G'},
        {type:'rect', x:38, y:54, w:12, h:5, color:'G'},
        {type:'rect', x:15, y:56, w:10, h:3, color:'D'},
        {type:'rect', x:39, y:56, w:10, h:3, color:'D'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:28, r:18, color:'G'},
        {type:'circle', cx:32, cy:30, r:16, color:'D'},
        {type:'circle', cx:34, cy:22, r:7, color:'H'},
        {type:'circle', cx:33, cy:24, r:4, color:'G'},
        {type:'circle', cx:26, cy:28, r:7, color:'W'},
        {type:'circle', cx:38, cy:28, r:7, color:'W'},
        {type:'circle', cx:26, cy:28, r:3, color:'K'},
        {type:'circle', cx:38, cy:28, r:3, color:'K'},
        {type:'circle', cx:25, cy:27, r:1, color:'W'},
        {type:'circle', cx:37, cy:27, r:1, color:'W'},
        {type:'circle', cx:21, cy:33, r:3, color:'P'},
        {type:'circle', cx:43, cy:33, r:3, color:'P'},
        {type:'rect', x:22, y:44, w:8, h:5, color:'G'},
        {type:'rect', x:34, y:44, w:8, h:5, color:'G'},
        {type:'rect', x:23, y:46, w:6, h:3, color:'D'},
        {type:'rect', x:35, y:46, w:6, h:3, color:'D'},
      ]),
    ]
  },
  {
    name: '🧒 小豆丁挥手',
    desc: '64x64 大头娃娃挥手打招呼',
    info: '4帧 · 6 FPS',
    canvasW: 64, canvasH: 64, fps: 6,
    palette: {
      'S': [255, 215, 175],
      'H': [90, 55, 40],
      'E': [50, 50, 60],
      'W': [255, 255, 255],
      'P': [255, 160, 180],
      'B': [70, 130, 220],
      'D': [50, 100, 180],
      'R': [233, 80, 80],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:18, r:18, color:'S'},
        {type:'circle', cx:32, cy:10, r:15, color:'H'},
        {type:'circle', cx:32, cy:13, r:14, color:'H'},
        {type:'circle', cx:32, cy:20, r:14, color:'S'},
        {type:'circle', cx:27, cy:18, r:4, color:'W'},
        {type:'circle', cx:37, cy:18, r:4, color:'W'},
        {type:'circle', cx:27, cy:18, r:2, color:'E'},
        {type:'circle', cx:37, cy:18, r:2, color:'E'},
        {type:'circle', cx:26, cy:17, r:1, color:'W'},
        {type:'circle', cx:36, cy:17, r:1, color:'W'},
        {type:'rect', x:29, y:25, w:7, h:2, color:'R'},
        {type:'rect', x:28, y:25, w:2, h:3, color:'R'},
        {type:'rect', x:35, y:25, w:2, h:3, color:'R'},
        {type:'circle', cx:22, cy:22, r:3, color:'P'},
        {type:'circle', cx:42, cy:22, r:3, color:'P'},
        {type:'rect', x:22, y:34, w:20, h:18, color:'B'},
        {type:'rect', x:22, y:34, w:20, h:4, color:'D'},
        {type:'rect', x:18, y:36, w:6, h:14, color:'S'},
        {type:'rect', x:40, y:36, w:6, h:14, color:'S'},
        {type:'rect', x:22, y:51, w:8, h:6, color:'H'},
        {type:'rect', x:34, y:51, w:8, h:6, color:'H'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:18, r:18, color:'S'},
        {type:'circle', cx:32, cy:10, r:15, color:'H'},
        {type:'circle', cx:32, cy:13, r:14, color:'H'},
        {type:'circle', cx:32, cy:20, r:14, color:'S'},
        {type:'circle', cx:27, cy:18, r:4, color:'W'},
        {type:'circle', cx:37, cy:18, r:4, color:'W'},
        {type:'circle', cx:27, cy:18, r:2, color:'E'},
        {type:'circle', cx:37, cy:18, r:2, color:'E'},
        {type:'circle', cx:26, cy:17, r:1, color:'W'},
        {type:'circle', cx:36, cy:17, r:1, color:'W'},
        {type:'rect', x:29, y:24, w:7, h:2, color:'R'},
        {type:'circle', cx:22, cy:22, r:3, color:'P'},
        {type:'circle', cx:42, cy:22, r:3, color:'P'},
        {type:'rect', x:22, y:34, w:20, h:18, color:'B'},
        {type:'rect', x:22, y:34, w:20, h:4, color:'D'},
        {type:'rect', x:18, y:36, w:6, h:14, color:'S'},
        {type:'rect', x:38, y:30, w:5, h:8, color:'S'},
        {type:'circle', cx:41, cy:29, r:5, color:'S'},
        {type:'rect', x:22, y:51, w:8, h:6, color:'H'},
        {type:'rect', x:34, y:51, w:8, h:6, color:'H'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:18, r:18, color:'S'},
        {type:'circle', cx:32, cy:10, r:15, color:'H'},
        {type:'circle', cx:32, cy:13, r:14, color:'H'},
        {type:'circle', cx:32, cy:20, r:14, color:'S'},
        {type:'circle', cx:27, cy:18, r:4, color:'W'},
        {type:'circle', cx:37, cy:18, r:4, color:'W'},
        {type:'circle', cx:27, cy:18, r:2, color:'E'},
        {type:'circle', cx:37, cy:18, r:2, color:'E'},
        {type:'circle', cx:26, cy:17, r:1, color:'W'},
        {type:'circle', cx:36, cy:17, r:1, color:'W'},
        {type:'rect', x:28, y:26, w:9, h:2, color:'R'},
        {type:'rect', x:28, y:25, w:2, h:3, color:'R'},
        {type:'rect', x:35, y:25, w:2, h:3, color:'R'},
        {type:'circle', cx:22, cy:22, r:3, color:'P'},
        {type:'circle', cx:42, cy:22, r:3, color:'P'},
        {type:'rect', x:22, y:34, w:20, h:18, color:'B'},
        {type:'rect', x:22, y:34, w:20, h:4, color:'D'},
        {type:'rect', x:18, y:36, w:6, h:14, color:'S'},
        {type:'rect', x:40, y:24, w:4, h:10, color:'S'},
        {type:'circle', cx:42, cy:23, r:5, color:'S'},
        {type:'rect', x:22, y:51, w:8, h:6, color:'H'},
        {type:'rect', x:34, y:51, w:8, h:6, color:'H'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:18, r:18, color:'S'},
        {type:'circle', cx:32, cy:10, r:15, color:'H'},
        {type:'circle', cx:32, cy:13, r:14, color:'H'},
        {type:'circle', cx:32, cy:20, r:14, color:'S'},
        {type:'circle', cx:27, cy:18, r:4, color:'W'},
        {type:'circle', cx:37, cy:18, r:4, color:'W'},
        {type:'circle', cx:27, cy:18, r:2, color:'E'},
        {type:'circle', cx:37, cy:18, r:2, color:'E'},
        {type:'circle', cx:26, cy:17, r:1, color:'W'},
        {type:'circle', cx:36, cy:17, r:1, color:'W'},
        {type:'rect', x:29, y:25, w:7, h:2, color:'R'},
        {type:'circle', cx:22, cy:22, r:3, color:'P'},
        {type:'circle', cx:42, cy:22, r:3, color:'P'},
        {type:'rect', x:22, y:34, w:20, h:18, color:'B'},
        {type:'rect', x:22, y:34, w:20, h:4, color:'D'},
        {type:'rect', x:18, y:36, w:6, h:14, color:'S'},
        {type:'rect', x:40, y:28, w:5, h:7, color:'S'},
        {type:'circle', cx:43, cy:27, r:5, color:'S'},
        {type:'rect', x:22, y:51, w:8, h:6, color:'H'},
        {type:'rect', x:34, y:51, w:8, h:6, color:'H'},
      ]),
    ]
  },
  {
    name: '🌟 小星星眨眼',
    desc: '64x64 闪烁星星一闪一闪亮晶晶',
    info: '3帧 · 4 FPS',
    canvasW: 64, canvasH: 64, fps: 4,
    palette: {
      'Y': [255, 230, 80],
      'H': [255, 250, 180],
      'O': [255, 180, 40],
      'W': [255, 255, 255],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:32, r:8, color:'Y'},
        {type:'circle', cx:32, cy:32, r:5, color:'H'},
        {type:'rect', x:30, y:8, w:4, h:18, color:'Y'},
        {type:'rect', x:31, y:6, w:2, h:4, color:'H'},
        {type:'rect', x:30, y:38, w:4, h:18, color:'Y'},
        {type:'rect', x:31, y:54, w:2, h:4, color:'H'},
        {type:'rect', x:8, y:30, w:18, h:4, color:'Y'},
        {type:'rect', x:6, y:31, w:4, h:2, color:'H'},
        {type:'rect', x:38, y:30, w:18, h:4, color:'Y'},
        {type:'rect', x:54, y:31, w:4, h:2, color:'H'},
        {type:'rect', x:14, y:14, w:3, h:12, color:'O'},
        {type:'rect', x:12, y:16, w:12, h:3, color:'O'},
        {type:'rect', x:47, y:14, w:3, h:12, color:'O'},
        {type:'rect', x:40, y:16, w:12, h:3, color:'O'},
        {type:'rect', x:14, y:38, w:3, h:12, color:'O'},
        {type:'rect', x:12, y:45, w:12, h:3, color:'O'},
        {type:'rect', x:47, y:38, w:3, h:12, color:'O'},
        {type:'rect', x:40, y:45, w:12, h:3, color:'O'},
        {type:'circle', cx:30, cy:30, r:2, color:'W'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:32, r:6, color:'O'},
        {type:'circle', cx:32, cy:32, r:3, color:'Y'},
        {type:'rect', x:31, y:16, w:2, h:12, color:'O'},
        {type:'rect', x:31, y:36, w:2, h:12, color:'O'},
        {type:'rect', x:16, y:31, w:12, h:2, color:'O'},
        {type:'rect', x:36, y:31, w:12, h:2, color:'O'},
        {type:'rect', x:20, y:20, w:2, h:8, color:'O'},
        {type:'rect', x:18, y:22, w:8, h:2, color:'O'},
        {type:'rect', x:42, y:20, w:2, h:8, color:'O'},
        {type:'rect', x:38, y:22, w:8, h:2, color:'O'},
        {type:'rect', x:20, y:36, w:2, h:8, color:'O'},
        {type:'rect', x:18, y:40, w:8, h:2, color:'O'},
        {type:'rect', x:42, y:36, w:2, h:8, color:'O'},
        {type:'rect', x:38, y:40, w:8, h:2, color:'O'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:32, r:10, color:'Y'},
        {type:'circle', cx:32, cy:32, r:7, color:'H'},
        {type:'circle', cx:32, cy:32, r:4, color:'W'},
        {type:'rect', x:30, y:4, w:4, h:22, color:'Y'},
        {type:'rect', x:31, y:2, w:2, h:4, color:'H'},
        {type:'rect', x:30, y:38, w:4, h:22, color:'Y'},
        {type:'rect', x:31, y:58, w:2, h:4, color:'H'},
        {type:'rect', x:4, y:30, w:22, h:4, color:'Y'},
        {type:'rect', x:2, y:31, w:4, h:2, color:'H'},
        {type:'rect', x:38, y:30, w:22, h:4, color:'Y'},
        {type:'rect', x:58, y:31, w:4, h:2, color:'H'},
        {type:'rect', x:12, y:12, w:3, h:14, color:'Y'},
        {type:'rect', x:10, y:14, w:14, h:3, color:'Y'},
        {type:'rect', x:49, y:12, w:3, h:14, color:'Y'},
        {type:'rect', x:40, y:14, w:14, h:3, color:'Y'},
        {type:'rect', x:12, y:38, w:3, h:14, color:'Y'},
        {type:'rect', x:10, y:47, w:14, h:3, color:'Y'},
        {type:'rect', x:49, y:38, w:3, h:14, color:'Y'},
        {type:'rect', x:40, y:47, w:14, h:3, color:'Y'},
      ]),
    ]
  },
  {
    name: '🍄 蘑菇弹弹',
    desc: '64x64 Q版蘑菇头小精灵蹦跶',
    info: '3帧 · 5 FPS',
    canvasW: 64, canvasH: 64, fps: 5,
    palette: {
      'R': [220, 60, 60],
      'W': [255, 250, 240],
      'K': [40, 40, 40],
      'S': [240, 210, 170],
      'B': [180, 130, 80],
      'P': [255, 150, 170],
      'D': [180, 40, 40],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:20, r:22, color:'R'},
        {type:'circle', cx:32, cy:22, r:20, color:'D'},
        {type:'circle', cx:32, cy:18, r:20, color:'R'},
        {type:'circle', cx:22, cy:14, r:5, color:'W'},
        {type:'circle', cx:42, cy:14, r:5, color:'W'},
        {type:'circle', cx:32, cy:8, r:4, color:'W'},
        {type:'circle', cx:18, cy:22, r:3, color:'W'},
        {type:'circle', cx:46, cy:22, r:3, color:'W'},
        {type:'rect', x:10, y:30, w:44, h:4, color:'R'},
        {type:'rect', x:18, y:34, w:28, h:16, color:'S'},
        {type:'circle', cx:26, cy:40, r:4, color:'W'},
        {type:'circle', cx:38, cy:40, r:4, color:'W'},
        {type:'circle', cx:26, cy:40, r:2, color:'K'},
        {type:'circle', cx:38, cy:40, r:2, color:'K'},
        {type:'circle', cx:25, cy:39, r:1, color:'W'},
        {type:'circle', cx:37, cy:39, r:1, color:'W'},
        {type:'rect', x:29, y:45, w:6, h:2, color:'K'},
        {type:'circle', cx:21, cy:44, r:3, color:'P'},
        {type:'circle', cx:43, cy:44, r:3, color:'P'},
        {type:'rect', x:20, y:50, w:8, h:6, color:'B'},
        {type:'rect', x:36, y:50, w:8, h:6, color:'B'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:24, r:24, color:'R'},
        {type:'circle', cx:32, cy:26, r:22, color:'D'},
        {type:'circle', cx:32, cy:22, r:22, color:'R'},
        {type:'circle', cx:20, cy:18, r:5, color:'W'},
        {type:'circle', cx:44, cy:18, r:5, color:'W'},
        {type:'circle', cx:32, cy:12, r:4, color:'W'},
        {type:'circle', cx:16, cy:26, r:3, color:'W'},
        {type:'circle', cx:48, cy:26, r:3, color:'W'},
        {type:'rect', x:8, y:36, w:48, h:4, color:'R'},
        {type:'rect', x:16, y:40, w:32, h:12, color:'S'},
        {type:'circle', cx:26, cy:46, r:4, color:'W'},
        {type:'circle', cx:38, cy:46, r:4, color:'W'},
        {type:'circle', cx:26, cy:46, r:2, color:'K'},
        {type:'circle', cx:38, cy:46, r:2, color:'K'},
        {type:'rect', x:29, y:50, w:6, h:2, color:'K'},
        {type:'circle', cx:21, cy:49, r:3, color:'P'},
        {type:'circle', cx:43, cy:49, r:3, color:'P'},
        {type:'rect', x:16, y:52, w:10, h:6, color:'B'},
        {type:'rect', x:38, y:52, w:10, h:6, color:'B'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:16, r:20, color:'R'},
        {type:'circle', cx:32, cy:18, r:18, color:'D'},
        {type:'circle', cx:32, cy:14, r:18, color:'R'},
        {type:'circle', cx:22, cy:10, r:5, color:'W'},
        {type:'circle', cx:42, cy:10, r:5, color:'W'},
        {type:'circle', cx:32, cy:4, r:4, color:'W'},
        {type:'circle', cx:16, cy:18, r:3, color:'W'},
        {type:'circle', cx:48, cy:18, r:3, color:'W'},
        {type:'rect', x:12, y:26, w:40, h:4, color:'R'},
        {type:'rect', x:20, y:30, w:24, h:14, color:'S'},
        {type:'circle', cx:26, cy:36, r:4, color:'W'},
        {type:'circle', cx:38, cy:36, r:4, color:'W'},
        {type:'circle', cx:26, cy:36, r:2, color:'K'},
        {type:'circle', cx:38, cy:36, r:2, color:'K'},
        {type:'circle', cx:25, cy:35, r:1, color:'W'},
        {type:'circle', cx:37, cy:35, r:1, color:'W'},
        {type:'rect', x:29, y:41, w:6, h:2, color:'K'},
        {type:'circle', cx:21, cy:40, r:3, color:'P'},
        {type:'circle', cx:43, cy:40, r:3, color:'P'},
        {type:'rect', x:22, y:44, w:8, h:5, color:'B'},
        {type:'rect', x:34, y:44, w:8, h:5, color:'B'},
      ]),
    ]
  },
  {
    name: '🐰 兔叽蹦跶',
    desc: '64x64 圆滚滚小兔子蹦蹦跳跳',
    info: '3帧 · 6 FPS',
    canvasW: 64, canvasH: 64, fps: 6,
    palette: {
      'W': [250, 245, 240],
      'P': [255, 180, 190],
      'K': [50, 40, 40],
      'E': [255, 255, 255],
      'N': [255, 140, 150],
      'G': [200, 195, 190],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:36, r:18, color:'W'},
        {type:'circle', cx:32, cy:38, r:16, color:'G'},
        {type:'circle', cx:32, cy:20, r:16, color:'W'},
        {type:'rect', x:22, y:2, w:6, h:16, color:'W'},
        {type:'rect', x:36, y:2, w:6, h:16, color:'W'},
        {type:'circle', cx:25, cy:4, r:4, color:'W'},
        {type:'circle', cx:39, cy:4, r:4, color:'W'},
        {type:'rect', x:23, y:4, w:4, h:12, color:'P'},
        {type:'rect', x:37, y:4, w:4, h:12, color:'P'},
        {type:'circle', cx:25, cy:5, r:2, color:'P'},
        {type:'circle', cx:39, cy:5, r:2, color:'P'},
        {type:'circle', cx:27, cy:20, r:5, color:'E'},
        {type:'circle', cx:37, cy:20, r:5, color:'E'},
        {type:'circle', cx:27, cy:20, r:2, color:'K'},
        {type:'circle', cx:37, cy:20, r:2, color:'K'},
        {type:'circle', cx:26, cy:19, r:1, color:'E'},
        {type:'circle', cx:36, cy:19, r:1, color:'E'},
        {type:'circle', cx:32, cy:25, r:2, color:'N'},
        {type:'rect', x:30, y:28, w:2, h:2, color:'K'},
        {type:'rect', x:33, y:28, w:2, h:2, color:'K'},
        {type:'circle', cx:22, cy:24, r:3, color:'P'},
        {type:'circle', cx:42, cy:24, r:3, color:'P'},
        {type:'circle', cx:50, cy:38, r:5, color:'W'},
        {type:'circle', cx:24, cy:48, r:5, color:'W'},
        {type:'circle', cx:40, cy:48, r:5, color:'W'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:30, r:16, color:'W'},
        {type:'circle', cx:32, cy:32, r:14, color:'G'},
        {type:'circle', cx:32, cy:14, r:14, color:'W'},
        {type:'rect', x:22, y:0, w:6, h:14, color:'W'},
        {type:'rect', x:36, y:0, w:6, h:14, color:'W'},
        {type:'circle', cx:25, cy:1, r:4, color:'W'},
        {type:'circle', cx:39, cy:1, r:4, color:'W'},
        {type:'rect', x:23, y:2, w:4, h:10, color:'P'},
        {type:'rect', x:37, y:2, w:4, h:10, color:'P'},
        {type:'circle', cx:25, cy:3, r:2, color:'P'},
        {type:'circle', cx:39, cy:3, r:2, color:'P'},
        {type:'circle', cx:27, cy:14, r:6, color:'E'},
        {type:'circle', cx:37, cy:14, r:6, color:'E'},
        {type:'circle', cx:27, cy:14, r:3, color:'K'},
        {type:'circle', cx:37, cy:14, r:3, color:'K'},
        {type:'circle', cx:26, cy:13, r:1, color:'E'},
        {type:'circle', cx:36, cy:13, r:1, color:'E'},
        {type:'circle', cx:32, cy:19, r:2, color:'N'},
        {type:'circle', cx:22, cy:18, r:3, color:'P'},
        {type:'circle', cx:42, cy:18, r:3, color:'P'},
        {type:'circle', cx:48, cy:32, r:5, color:'W'},
        {type:'circle', cx:24, cy:44, r:4, color:'W'},
        {type:'circle', cx:40, cy:44, r:4, color:'W'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:38, r:20, color:'W'},
        {type:'circle', cx:32, cy:40, r:18, color:'G'},
        {type:'circle', cx:32, cy:24, r:16, color:'W'},
        {type:'rect', x:18, y:12, w:6, h:14, color:'W'},
        {type:'rect', x:40, y:12, w:6, h:14, color:'W'},
        {type:'circle', cx:20, cy:24, r:4, color:'W'},
        {type:'circle', cx:44, cy:24, r:4, color:'W'},
        {type:'rect', x:19, y:14, w:4, h:10, color:'P'},
        {type:'rect', x:41, y:14, w:4, h:10, color:'P'},
        {type:'circle', cx:27, cy:24, r:4, color:'E'},
        {type:'circle', cx:37, cy:24, r:4, color:'E'},
        {type:'circle', cx:27, cy:24, r:2, color:'K'},
        {type:'circle', cx:37, cy:24, r:2, color:'K'},
        {type:'circle', cx:32, cy:29, r:2, color:'N'},
        {type:'circle', cx:22, cy:28, r:3, color:'P'},
        {type:'circle', cx:42, cy:28, r:3, color:'P'},
        {type:'circle', cx:52, cy:40, r:5, color:'W'},
        {type:'circle', cx:20, cy:52, r:6, color:'W'},
        {type:'circle', cx:44, cy:52, r:6, color:'W'},
      ]),
    ]
  },
  {
    name: '🍒 樱桃弹弹',
    desc: '64x64 两颗Q版樱桃弹跳晃动',
    info: '3帧 · 5 FPS',
    canvasW: 64, canvasH: 64, fps: 5,
    palette: {
      'R': [220, 50, 60],
      'D': [170, 30, 40],
      'H': [255, 120, 130],
      'G': [80, 160, 60],
      'L': [120, 200, 80],
      'K': [40, 40, 40],
      'W': [255, 255, 255],
      'P': [255, 150, 170],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'rect', x:24, y:4, w:3, h:16, color:'G'},
        {type:'rect', x:37, y:4, w:3, h:16, color:'G'},
        {type:'rect', x:30, y:2, w:4, h:6, color:'G'},
        {type:'circle', cx:34, cy:4, r:6, color:'L'},
        {type:'circle', cx:30, cy:3, r:4, color:'L'},
        {type:'circle', cx:22, cy:34, r:14, color:'R'},
        {type:'circle', cx:22, cy:36, r:12, color:'D'},
        {type:'circle', cx:22, cy:32, r:12, color:'R'},
        {type:'circle', cx:18, cy:28, r:4, color:'H'},
        {type:'circle', cx:19, cy:34, r:4, color:'W'},
        {type:'circle', cx:25, cy:34, r:4, color:'W'},
        {type:'circle', cx:19, cy:34, r:2, color:'K'},
        {type:'circle', cx:25, cy:34, r:2, color:'K'},
        {type:'circle', cx:18, cy:33, r:1, color:'W'},
        {type:'circle', cx:24, cy:33, r:1, color:'W'},
        {type:'circle', cx:14, cy:38, r:3, color:'P'},
        {type:'rect', x:20, y:40, w:4, h:2, color:'K'},
        {type:'circle', cx:42, cy:34, r:14, color:'R'},
        {type:'circle', cx:42, cy:36, r:12, color:'D'},
        {type:'circle', cx:42, cy:32, r:12, color:'R'},
        {type:'circle', cx:38, cy:28, r:4, color:'H'},
        {type:'circle', cx:39, cy:34, r:4, color:'W'},
        {type:'circle', cx:45, cy:34, r:4, color:'W'},
        {type:'circle', cx:39, cy:34, r:2, color:'K'},
        {type:'circle', cx:45, cy:34, r:2, color:'K'},
        {type:'circle', cx:38, cy:33, r:1, color:'W'},
        {type:'circle', cx:44, cy:33, r:1, color:'W'},
        {type:'circle', cx:50, cy:38, r:3, color:'P'},
        {type:'rect', x:40, y:40, w:4, h:2, color:'K'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'rect', x:20, y:4, w:3, h:16, color:'G'},
        {type:'rect', x:40, y:4, w:3, h:16, color:'G'},
        {type:'rect', x:28, y:2, w:8, h:6, color:'G'},
        {type:'circle', cx:36, cy:4, r:6, color:'L'},
        {type:'circle', cx:30, cy:3, r:4, color:'L'},
        {type:'circle', cx:18, cy:36, r:14, color:'R'},
        {type:'circle', cx:18, cy:38, r:12, color:'D'},
        {type:'circle', cx:18, cy:34, r:12, color:'R'},
        {type:'circle', cx:14, cy:30, r:4, color:'H'},
        {type:'circle', cx:15, cy:36, r:4, color:'W'},
        {type:'circle', cx:21, cy:36, r:4, color:'W'},
        {type:'circle', cx:15, cy:36, r:2, color:'K'},
        {type:'circle', cx:21, cy:36, r:2, color:'K'},
        {type:'circle', cx:14, cy:35, r:1, color:'W'},
        {type:'circle', cx:20, cy:35, r:1, color:'W'},
        {type:'circle', cx:10, cy:40, r:3, color:'P'},
        {type:'rect', x:16, y:42, w:4, h:2, color:'K'},
        {type:'circle', cx:44, cy:32, r:14, color:'R'},
        {type:'circle', cx:44, cy:34, r:12, color:'D'},
        {type:'circle', cx:44, cy:30, r:12, color:'R'},
        {type:'circle', cx:40, cy:26, r:4, color:'H'},
        {type:'circle', cx:41, cy:32, r:4, color:'W'},
        {type:'circle', cx:47, cy:32, r:4, color:'W'},
        {type:'circle', cx:41, cy:32, r:2, color:'K'},
        {type:'circle', cx:47, cy:32, r:2, color:'K'},
        {type:'circle', cx:40, cy:31, r:1, color:'W'},
        {type:'circle', cx:46, cy:31, r:1, color:'W'},
        {type:'circle', cx:52, cy:36, r:3, color:'P'},
        {type:'rect', x:42, y:38, w:4, h:2, color:'K'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'rect', x:28, y:4, w:3, h:16, color:'G'},
        {type:'rect', x:38, y:4, w:3, h:16, color:'G'},
        {type:'rect', x:28, y:2, w:8, h:6, color:'G'},
        {type:'circle', cx:32, cy:4, r:6, color:'L'},
        {type:'circle', cx:28, cy:3, r:4, color:'L'},
        {type:'circle', cx:26, cy:32, r:14, color:'R'},
        {type:'circle', cx:26, cy:34, r:12, color:'D'},
        {type:'circle', cx:26, cy:30, r:12, color:'R'},
        {type:'circle', cx:22, cy:26, r:4, color:'H'},
        {type:'circle', cx:23, cy:32, r:4, color:'W'},
        {type:'circle', cx:29, cy:32, r:4, color:'W'},
        {type:'circle', cx:23, cy:32, r:2, color:'K'},
        {type:'circle', cx:29, cy:32, r:2, color:'K'},
        {type:'circle', cx:22, cy:31, r:1, color:'W'},
        {type:'circle', cx:28, cy:31, r:1, color:'W'},
        {type:'circle', cx:18, cy:36, r:3, color:'P'},
        {type:'rect', x:24, y:38, w:4, h:2, color:'K'},
        {type:'circle', cx:40, cy:36, r:14, color:'R'},
        {type:'circle', cx:40, cy:38, r:12, color:'D'},
        {type:'circle', cx:40, cy:34, r:12, color:'R'},
        {type:'circle', cx:36, cy:30, r:4, color:'H'},
        {type:'circle', cx:37, cy:36, r:4, color:'W'},
        {type:'circle', cx:43, cy:36, r:4, color:'W'},
        {type:'circle', cx:37, cy:36, r:2, color:'K'},
        {type:'circle', cx:43, cy:36, r:2, color:'K'},
        {type:'circle', cx:36, cy:35, r:1, color:'W'},
        {type:'circle', cx:42, cy:35, r:1, color:'W'},
        {type:'circle', cx:48, cy:40, r:3, color:'P'},
        {type:'rect', x:38, y:42, w:4, h:2, color:'K'},
      ]),
    ]
  },
  {
    name: '🐧 企鹅摇摇',
    desc: '64x64 Q版胖企鹅左右摇摆走路',
    info: '3帧 · 5 FPS',
    canvasW: 64, canvasH: 64, fps: 5,
    palette: {
      'B': [40, 50, 70],
      'W': [240, 240, 245],
      'O': [255, 160, 40],
      'K': [30, 30, 30],
      'E': [255, 255, 255],
      'P': [255, 150, 170],
    },
    frames: [
      _makeFrameRows(64, 64, [
        {type:'circle', cx:32, cy:34, r:20, color:'B'},
        {type:'circle', cx:32, cy:36, r:18, color:'B'},
        {type:'circle', cx:32, cy:36, r:14, color:'W'},
        {type:'circle', cx:32, cy:16, r:14, color:'B'},
        {type:'circle', cx:27, cy:16, r:5, color:'E'},
        {type:'circle', cx:37, cy:16, r:5, color:'E'},
        {type:'circle', cx:27, cy:16, r:2, color:'K'},
        {type:'circle', cx:37, cy:16, r:2, color:'K'},
        {type:'circle', cx:26, cy:15, r:1, color:'E'},
        {type:'circle', cx:36, cy:15, r:1, color:'E'},
        {type:'rect', x:28, y:22, w:8, h:3, color:'O'},
        {type:'rect', x:29, y:21, w:6, h:2, color:'O'},
        {type:'circle', cx:22, cy:20, r:3, color:'P'},
        {type:'circle', cx:42, cy:20, r:3, color:'P'},
        {type:'rect', x:10, y:28, w:6, h:18, color:'B'},
        {type:'rect', x:48, y:28, w:6, h:18, color:'B'},
        {type:'rect', x:20, y:52, w:10, h:4, color:'O'},
        {type:'rect', x:34, y:52, w:10, h:4, color:'O'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:30, cy:34, r:20, color:'B'},
        {type:'circle', cx:30, cy:36, r:18, color:'B'},
        {type:'circle', cx:30, cy:36, r:14, color:'W'},
        {type:'circle', cx:30, cy:16, r:14, color:'B'},
        {type:'circle', cx:25, cy:16, r:5, color:'E'},
        {type:'circle', cx:35, cy:16, r:5, color:'E'},
        {type:'circle', cx:25, cy:16, r:2, color:'K'},
        {type:'circle', cx:35, cy:16, r:2, color:'K'},
        {type:'circle', cx:24, cy:15, r:1, color:'E'},
        {type:'circle', cx:34, cy:15, r:1, color:'E'},
        {type:'rect', x:26, y:22, w:8, h:3, color:'O'},
        {type:'rect', x:27, y:21, w:6, h:2, color:'O'},
        {type:'circle', cx:20, cy:20, r:3, color:'P'},
        {type:'circle', cx:40, cy:20, r:3, color:'P'},
        {type:'rect', x:6, y:26, w:8, h:16, color:'B'},
        {type:'rect', x:46, y:30, w:6, h:16, color:'B'},
        {type:'rect', x:16, y:52, w:10, h:4, color:'O'},
        {type:'rect', x:34, y:52, w:10, h:4, color:'O'},
      ]),
      _makeFrameRows(64, 64, [
        {type:'circle', cx:34, cy:34, r:20, color:'B'},
        {type:'circle', cx:34, cy:36, r:18, color:'B'},
        {type:'circle', cx:34, cy:36, r:14, color:'W'},
        {type:'circle', cx:34, cy:16, r:14, color:'B'},
        {type:'circle', cx:29, cy:16, r:5, color:'E'},
        {type:'circle', cx:39, cy:16, r:5, color:'E'},
        {type:'circle', cx:29, cy:16, r:2, color:'K'},
        {type:'circle', cx:39, cy:16, r:2, color:'K'},
        {type:'circle', cx:28, cy:15, r:1, color:'E'},
        {type:'circle', cx:38, cy:15, r:1, color:'E'},
        {type:'rect', x:30, y:22, w:8, h:3, color:'O'},
        {type:'rect', x:31, y:21, w:6, h:2, color:'O'},
        {type:'circle', cx:24, cy:20, r:3, color:'P'},
        {type:'circle', cx:44, cy:20, r:3, color:'P'},
        {type:'rect', x:12, y:30, w:6, h:16, color:'B'},
        {type:'rect', x:50, y:26, w:8, h:16, color:'B'},
        {type:'rect', x:20, y:52, w:10, h:4, color:'O'},
        {type:'rect', x:38, y:52, w:10, h:4, color:'O'},
      ]),
    ]
  },
];

// Task 7: 首屏引导动画(INTRO_DEMO)
// 4 帧 16x16 闪烁箭头,提示用户「点这里开始」
function _buildIntroFrame(w, h, cursorX, cursorY, color) {
  const data = new Uint8ClampedArray(w * h * 4);
  // 画一个对角箭头 (5x5),从 (5,5) 开始
  const arrowShape = [
    'X....',
    'XX...',
    'X.X..',
    'X..X.',
    'X...X'
  ];
  const ac = color || [233, 69, 96];
  for (let y = 0; y < arrowShape.length; y++) {
    for (let x = 0; x < arrowShape[y].length; x++) {
      if (arrowShape[y][x] === 'X') {
        const px = cursorX + x;
        const py = cursorY + y;
        if (px < w && py < h) {
          const di = (py * w + px) * 4;
          data[di] = ac[0]; data[di+1] = ac[1]; data[di+2] = ac[2]; data[di+3] = 255;
        }
      }
    }
  }
  return data;
}

function loadIntroDemo() {
  // 4 帧:箭头在不同位置闪烁
  if (selection.active) confirmSelection();
  const w = 16, h = 16;
  const positions = [
    [4, 4],
    [5, 5],
    [6, 6],
    [5, 5]
  ];
  const colors = [
    [233, 69, 96],
    [233, 69, 96],
    [233, 69, 96],
    [180, 180, 180]
  ];
  const newFrames = positions.map((pos, i) => {
    const data = _buildIntroFrame(w, h, pos[0], pos[1], colors[i]);
    return {
      duration: i === 2 ? 2 : 1,  // 第 3 帧停留稍长
      layers: [{ name: 'Intro', data, visible: true, opacity: 1 }]
    };
  });
  pushHistory();
  canvasW = w; canvasH = h;
  pixelSize = 24;
  fps = 6;
  frames = newFrames;
  currentFrame = 0;
  activeLayerIndex = 0;
  if (selection.active) clearSelectionState();
  panX = 0; panY = 0;
  moveOffsetX = 0; moveOffsetY = 0;
  // 同步 UI 输入
  const cwInput = document.getElementById('canvasW'); if (cwInput) cwInput.value = canvasW;
  const chInput = document.getElementById('canvasH'); if (chInput) chInput.value = canvasH;
  const fpsInput = document.getElementById('fpsSlider'); if (fpsInput) fpsInput.value = fps;
  const zoomInput = document.getElementById('zoomSlider'); if (zoomInput) zoomInput.value = pixelSize;
  clearHistory();
  if (typeof initPreview === 'function') initPreview();
  updateFpsLabel();
  render();
  toast('👋 欢迎使用 Pixel Studio!点击画布开始绘制');
}

function showDemoGallery() {
  const gallery = document.getElementById('demoGallery');
  gallery.innerHTML = '';
  DEMO_PROJECTS.forEach((demo, idx) => {
    const card = document.createElement('div');
    card.className = 'demo-card';
    card.onclick = () => loadDemoProject(idx);

    // Render thumbnail (frame 1) onto a canvas
    const thumb = document.createElement('canvas');
    thumb.className = 'demo-thumb';
    thumb.width = demo.canvasW;
    thumb.height = demo.canvasH;
    // Display size: keep 1:1 with image-rendering:pixelated
    const scale = Math.max(1, Math.floor(120 / Math.max(demo.canvasW, demo.canvasH)));
    thumb.style.width = (demo.canvasW * scale) + 'px';
    thumb.style.height = (demo.canvasH * scale) + 'px';
    thumb.style.margin = '0 auto';
    const tctx = thumb.getContext('2d');
    const data = _buildDemoFrame(demo.canvasW, demo.canvasH, demo.frames[0], demo.palette);
    tctx.putImageData(new ImageData(data, demo.canvasW, demo.canvasH), 0, 0);

    card.appendChild(thumb);
    const name = document.createElement('div'); name.className = 'demo-card-name'; name.textContent = demo.name; card.appendChild(name);
    const desc = document.createElement('div'); desc.className = 'demo-card-desc'; desc.textContent = demo.desc; card.appendChild(desc);
    const info = document.createElement('div'); info.className = 'demo-card-info'; info.textContent = demo.info; card.appendChild(info);

    gallery.appendChild(card);
  });
  document.getElementById('demoDialog').style.display = 'flex';
}

function closeDemoGallery() {
  document.getElementById('demoDialog').style.display = 'none';
}

function loadDemoProject(idx) {
  if (selection.active) confirmSelection();
  if (!confirm(`加载示例 "${DEMO_PROJECTS[idx].name}" 将替换当前画布,确定吗?`)) return;
  closeDemoGallery();
  const demo = DEMO_PROJECTS[idx];
  pushHistory();
  canvasW = demo.canvasW;
  canvasH = demo.canvasH;
  fps = demo.fps;
  // Build frames
  frames = demo.frames.map(rows => {
    const data = _buildDemoFrame(demo.canvasW, demo.canvasH, rows, demo.palette);
    return {
      duration: 1,
      layers: [{ name: 'Layer 1', data, visible: true, opacity: 1 }]
    };
  });
  currentFrame = 0;
  activeLayerIndex = 0;
  // Reset selection/view
  if (selection.active) clearSelectionState();
  // Center canvas (preserve current zoom if any)
  // Reset pan so the new canvas is centered
  panX = 0; panY = 0;
  // Update UI inputs
  const cwInput = document.getElementById('canvasW'); if (cwInput) cwInput.value = canvasW;
  const chInput = document.getElementById('canvasH'); if (chInput) chInput.value = canvasH;
  const fpsInput = document.getElementById('fpsSlider'); if (fpsInput) fpsInput.value = fps;
  // Rebuild preview anim
  if (typeof initPreview === 'function') initPreview();
  // Clear history (don't undo into previous user state)
  clearHistory();
  render();
  toast(`已加载: ${demo.name}`);
}

// ── 键盘快捷键 ──
window.addEventListener('keydown', e => {
  if(e.target.tagName==='INPUT'&&e.target.type!=='range')return;
  // F1 始终触发,无论焦点位置
  if(e.key==='F1'){e.preventDefault();showTutorial(true);return;}
  if(e.key==='Enter'&&selection.active){e.preventDefault();confirmSelection();return;}
  if(e.key==='Escape'&&selection.active){e.preventDefault();cancelSelection();return;}
  if(e.ctrlKey&&e.key==='c'){if(selection.active){e.preventDefault();copySelection();return;}}
  if(e.ctrlKey&&e.key==='v'){e.preventDefault();pasteSelection();return;}
  if(e.key===' '){if(!e.repeat){spacePressed=true;drawCanvas.style.cursor='grab';}if(!isDrawing&&!isPanning){e.preventDefault();togglePlay();}return;}
  if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo();}
  else if(e.ctrlKey&&e.key==='y'){e.preventDefault();redo();}
  else if(e.key==='p'){setTool('pencil',document.querySelector('[data-tool="pencil"]'));}
  else if(e.key==='e'){setTool('eraser',document.querySelector('[data-tool="eraser"]'));}
  else if(e.key==='g'){setTool('fill',document.querySelector('[data-tool="fill"]'));}
  else if(e.key==='i'){setTool('eyedropper',document.querySelector('[data-tool="eyedropper"]'));}
  else if(e.key==='v'){setTool('move',document.querySelector('[data-tool="move"]'));}
  else if(e.key==='s'&&!e.ctrlKey){setTool('selection',document.querySelector('[data-tool="selection"]'));}
  else if(e.key==='l'){setTool('line',document.querySelector('[data-tool="line"]'));}
  else if(e.key==='r'){setTool('rect',document.querySelector('[data-tool="rect"]'));}
  else if(e.key==='o'){setTool('circle',document.querySelector('[data-tool="circle"]'));}
  else if(e.key==='ArrowLeft'){
    e.preventDefault();
    if(selection.active && selection.data) {
      nudgeSelection(e.shiftKey?-8:-1, 0);
    } else {
      prevFrame();
    }
  }
  else if(e.key==='ArrowRight'){
    e.preventDefault();
    if(selection.active && selection.data) {
      nudgeSelection(e.shiftKey?8:1, 0);
    } else {
      nextFrame();
    }
  }
  else if(e.key==='ArrowUp'){
    e.preventDefault();
    if(selection.active && selection.data) {
      nudgeSelection(0, e.shiftKey?-8:-1);
    }
  }
  else if(e.key==='ArrowDown'){
    e.preventDefault();
    if(selection.active && selection.data) {
      nudgeSelection(0, e.shiftKey?8:1);
    }
  }
  else if(e.key==='n'){e.preventDefault();addFrame();}
  else if(e.key==='m'||e.key==='M'){
    e.preventDefault();
    const order = ['none','horizontal','vertical','quad'];
    const next = order[(order.indexOf(symmetryMode)+1) % order.length];
    setSymmetryMode(next);
  }
});

window.addEventListener('keyup', e => { if(e.key===' '){spacePressed=false;drawCanvas.style.cursor='crosshair';} });

// ── 网格切换 ──
function toggleGrid(){showGrid=!showGrid;document.getElementById('gridBtn').classList.toggle('active');localStorage.setItem('pixelStudio_showGrid',showGrid?'1':'0');render();}

// ── 顶栏高级区折叠 ──
function toggleAdvancedTools() {
  const advanced = document.getElementById('topbarAdvanced');
  const btn = document.getElementById('toggleAdvancedBtn');
  if (!advanced || !btn) return;
  const isExpanded = advanced.classList.toggle('expanded');
  btn.textContent = isExpanded ? '⚙ 收起 ▲' : '⚙ 更多工具 ▾';
}

// ── 右栏面板折叠 ──
function toggleSection(headerEl) {
  const group = headerEl.parentElement;
  if (group) group.classList.toggle('collapsed');
}

// ── 自动保存 ──
function autoSave() {
  const project = {
    version: 3, canvasW, canvasH, pixelSize, fps, onionMode, onionFrameCount, onionOpacity, showGrid, customColors,
    frames: frames.map(f => ({
      layers: f.layers.map(l => ({ data: Array.from(l.data), name: l.name, visible: l.visible, opacity: l.opacity })),
      duration: f.duration
    }))
  };
  try { localStorage.setItem('pixelStudio_autosave', JSON.stringify(project)); } catch (e) {}
}

function checkAutoSaveRecovery() {
  const data = localStorage.getItem('pixelStudio_autosave');
  if (!data) return;
  try {
    const proj = JSON.parse(data);
    if (!proj.frames || !proj.canvasW) return;
    document.getElementById('recoveryInfo').textContent = `画布大小: ${proj.canvasW}×${proj.canvasH}，帧数: ${proj.frames.length}`;
    document.getElementById('recoveryDialog').style.display = 'flex';
  } catch (e) {}
}

function recoverAutoSave() {
  const data = localStorage.getItem('pixelStudio_autosave');
  if (!data) { dismissRecovery(); return; }
  try {
    const proj = JSON.parse(data);
    canvasW = proj.canvasW; canvasH = proj.canvasH;
    pixelSize = proj.pixelSize || 20; fps = proj.fps || 8;
    onionMode = proj.onionMode || (proj.onionSkinEnabled !== false ? 'prev' : 'off');
    onionFrameCount = proj.onionFrameCount || 1; onionOpacity = proj.onionOpacity || 40;
    showGrid = proj.showGrid !== false;
    if (proj.customColors) customColors = proj.customColors;
    frames = loadFramesFromProject(proj);
    currentFrame = 0; activeLayerIndex = 0;
    moveOffsetX = 0; moveOffsetY = 0; panX = 0; panY = 0;
    if (selection.active) clearSelectionState();
    clearHistory();
    document.getElementById('canvasW').value = canvasW; document.getElementById('canvasH').value = canvasH;
    document.getElementById('zoomSlider').value = pixelSize; document.getElementById('fpsSlider').value = fps;
    document.getElementById('onionOpacity').value = onionOpacity; document.getElementById('onionMode').value = onionMode;
    document.getElementById('onionFrameCount').value = onionFrameCount;
    document.getElementById('brushSlider').value = brushSize; document.getElementById('brushVal').textContent = brushSize;
    if (showGrid) document.getElementById('gridBtn').classList.add('active'); else document.getElementById('gridBtn').classList.remove('active');
    saveCustomColors(); buildPalette(); updateFpsLabel(); initPreview(); render();
    toast('已恢复自动保存的项目！');
  } catch (e) { toast('恢复失败：数据格式错误'); }
  dismissRecovery();
}

function dismissRecovery() { document.getElementById('recoveryDialog').style.display = 'none'; localStorage.removeItem('pixelStudio_autosave'); }

// ── 启动 ──
const savedGrid = localStorage.getItem('pixelStudio_showGrid');
if (savedGrid !== null) { showGrid = savedGrid === '1'; if (!showGrid) document.getElementById('gridBtn').classList.remove('active'); }

loadCustomColors();
initFrames(canvasW, canvasH);
buildPalette();
updateColorSwatches();
document.getElementById('fpsSlider').value = fps;
updateFpsLabel();
render();
initPreview();

// ── Task 3: 动态注入「清空选中」按钮 ──
(function injectClearSelectedBtn(){
  const clearBtn = [...document.querySelectorAll('button')].find(b => b.textContent && b.textContent.includes('清空') && (b.getAttribute('onclick')||'').includes('clearFrame'));
  if(!clearBtn)return;
  const newBtn = document.createElement('button');
  newBtn.textContent = '🧹 清空选中';
  newBtn.title = '清空选中的多帧(Ctrl/Shift+点击 多选)';
  newBtn.onclick = clearSelectedFrames;
  clearBtn.parentNode.insertBefore(newBtn, clearBtn.nextSibling);
})();

// ── 悬浮预览窗拖拽与缩放 ──
(function initFloatingPreviewDrag(){
  // 拖拽
  const header = document.getElementById('floatingPreviewHeader');
  const el = document.getElementById('floatingPreview');
  if(!header || !el) return;
  let dragging = false, dragStartX = 0, dragStartY = 0, elStartX = 0, elStartY = 0;
  header.addEventListener('mousedown', function(e){
    if(e.target.tagName === 'BUTTON') return;
    dragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    elStartX = el.offsetLeft; elStartY = el.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(!dragging) return;
    floatingPreviewX = elStartX + (e.clientX - dragStartX);
    floatingPreviewY = elStartY + (e.clientY - dragStartY);
    el.style.left = floatingPreviewX + 'px';
    el.style.top = floatingPreviewY + 'px';
  });
  document.addEventListener('mouseup', function(){ dragging = false; });

  // 右下角拖拽缩放
  const handle = document.getElementById('floatingPreviewResize');
  if(!handle) return;
  let resizing = false, resizeStartX = 0, resizeStartY = 0, resizeStartW = 0, resizeStartH = 0;
  handle.addEventListener('mousedown', function(e){
    resizing = true;
    resizeStartX = e.clientX; resizeStartY = e.clientY;
    resizeStartW = el.offsetWidth; resizeStartH = el.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('mousemove', function(e){
    if(!resizing) return;
    const nw = Math.max(160, resizeStartW + (e.clientX - resizeStartX));
    const nh = Math.max(160, resizeStartH + (e.clientY - resizeStartY));
    floatingPreviewW = nw; floatingPreviewH = nh;
    el.style.width = nw + 'px';
    el.style.height = nh + 'px';
    renderFloatingPreview();
  });
  document.addEventListener('mouseup', function(){ resizing = false; });
})();

// ── 帧右键菜单:点击其它地方关闭 ──
document.addEventListener('click', (e) => {
  const menu = document.getElementById('frameContextMenu');
  if(!menu || menu.style.display === 'none') return;
  // 点菜单内部不关
  if(e.target.closest('#frameContextMenu')) return;
  hideFrameContextMenu();
});

// 帧右键菜单按钮:事件代理(因为菜单是静态 HTML)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#frameContextMenu button[data-action]');
  if(!btn) return;
  e.preventDefault();
  const action = btn.getAttribute('data-action');
  frameContextAction(action);
});

// 阻止右键菜单本身的默认行为(否则浏览器自带菜单会盖住)
document.addEventListener('contextmenu', (e) => {
  const menu = document.getElementById('frameContextMenu');
  if(!menu) return;
  // 如果点击的不是 .frame-item 且菜单开着,关闭菜单
  if(!e.target.closest('.frame-item') && menu.style.display !== 'none'){
    hideFrameContextMenu();
  }
});

setInterval(autoSave, 30000);
checkAutoSaveRecovery();

// ── 首次访问自动显示新手引导 ──
if (localStorage.getItem('yerpx-tutorial-seen') !== '1') {
  setTimeout(() => showTutorial(), 800);
}

// ── Task 7: 首屏引导动画(INTRO_DEMO) ──
// 首次访问且无自动保存可恢复时,加载示例动画引导用户
if (localStorage.getItem('yerpx-tutorial-seen') !== '1' && !localStorage.getItem('pixelStudio_autosave')) {
  setTimeout(() => loadIntroDemo(), 1500);
  // 用户开始绘制时自动停止引导(标记 tutorial-seen 让下次不再显示)
  const stopIntro = () => {
    localStorage.setItem('yerpx-tutorial-seen', '1');
    drawCanvas.removeEventListener('mousedown', stopIntro);
  };
  drawCanvas.addEventListener('mousedown', stopIntro, { once: true });
}
