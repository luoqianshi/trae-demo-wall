/**
 * WebMotion 默认项目 — 浮空岛开放日
 * 5 场景 · 16 秒 · 暗金奢华 MG 动画
 * 打开 WebMotion 时自动加载，展示完整设计系统能力
 * v2: 粒子系统 + 光效 + VisualEditor 元素 + 动态背景
 */
const DEFAULT_PROJECT = {
  name: '浮空岛开放日',
  scenes: [
    {
      name: '开场标题',
      duration: 3,
      transition: 'fade',
      transitionDuration: 0.5,
      code: `
// === 开场标题 · 浮空岛开放日 ===
const gold = '#c9a96e', goldDim = 'rgba(201,169,110,0.14)', goldGlow = 'rgba(201,169,110,0.28)';
const rose = '#fb7185', roseDim = 'rgba(251,113,133,0.12)';
const ink = '#f0ece4', inkMid = 'rgba(240,236,228,0.60)', inkLow = 'rgba(240,236,228,0.38)';
const bgVoid = '#06060e', bgDeep = '#0a0c18';

function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function easeOutBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
function easeOutExpo(t){return t===1?1:1-Math.pow(2,-10*t)}
function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function easeInOutSine(t){return -(Math.cos(Math.PI*t)-1)/2}

const fs = utils.fontSize ? (s,w)=>utils.fontSize(s,w) : (s,w)=>Math.round(s*(w/1920));
const lt = t / 3;

// ── 动态极光背景 ──
const auroraGrad = ctx.createLinearGradient(0, 0, width, height);
const auroraPhase = lt * 0.5;
const r1 = Math.sin(auroraPhase) * 20 + 17, g1 = Math.cos(auroraPhase * 0.7) * 15 + 21, b1 = 34;
const r2 = Math.sin(auroraPhase + 2) * 10 + 10, g2 = Math.cos(auroraPhase + 1) * 8 + 12, b2 = 24;
const r3 = 6, g3 = 6, b3 = 14;
auroraGrad.addColorStop(0, 'rgba('+r1+','+g1+','+b1+',1)');
auroraGrad.addColorStop(0.5, 'rgba('+r2+','+g2+','+b2+',1)');
auroraGrad.addColorStop(1, 'rgba('+r3+','+g3+','+b3+',1)');
ctx.fillStyle = auroraGrad;
ctx.fillRect(0, 0, width, height);

// ── 流动光带 ──
for (let band = 0; band < 3; band++) {
  const bandY = height * 0.3 + band * height * 0.25 + Math.sin(lt * 2 + band * 1.5) * 60;
  const bandGrad = ctx.createLinearGradient(0, bandY - 80, 0, bandY + 80);
  const bandAlpha = 0.04 + Math.sin(lt * 3 + band) * 0.02;
  bandGrad.addColorStop(0, 'rgba(201,169,110,0)');
  bandGrad.addColorStop(0.5, 'rgba(201,169,110,'+bandAlpha+')');
  bandGrad.addColorStop(1, 'rgba(201,169,110,0)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY - 80, width, 160);
}

// ── 旋转光线 ──
const rayCount = 12;
ctx.save();
ctx.translate(width/2, height/2);
ctx.rotate(lt * 0.3);
for (let i = 0; i < rayCount; i++) {
  const angle = (i / rayCount) * Math.PI * 2;
  const rayAlpha = 0.03 + Math.sin(lt * 4 + i * 0.8) * 0.02;
  const rayLen = width * 0.8;
  const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
  rayGrad.addColorStop(0, 'rgba(201,169,110,'+rayAlpha+')');
  rayGrad.addColorStop(1, 'rgba(201,169,110,0)');
  ctx.strokeStyle = rayGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
  ctx.stroke();
}
ctx.restore();

// ── 金色粒子场 ──
const particles = 60;
for (let i = 0; i < particles; i++) {
  const seed = i * 137.5;
  const px = ((seed * 9301 + 49297) % width + width) % width;
  const pyBase = ((seed * 49297 + 9301) % height + height) % height;
  const py = (pyBase - lt * 80 * (1 + (i % 5) * 0.3)) % height;
  const pY = py < 0 ? py + height : py;
  const pSize = 1 + (i % 3) * 0.8;
  const pAlpha = 0.15 + Math.sin(lt * 6 + i * 0.5) * 0.1;
  const pPulse = Math.sin(lt * 3 + i) * 0.5 + 0.5;
  ctx.fillStyle = 'rgba(201,169,110,'+(pAlpha * pPulse)+')';
  ctx.beginPath();
  ctx.arc(px, pY, pSize * pPulse, 0, Math.PI * 2);
  ctx.fill();
}

// ── 中心光环扩散 ──
const ringP = easeOutExpo(clamp(lt * 1.2, 0, 1));
const ringR = lerp(100, width * 0.55, ringP);
ctx.save();
ctx.strokeStyle = 'rgba(201,169,110,'+(0.25 * (1 - ringP))+')';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(width/2, height/2, ringR, 0, Math.PI * 2);
ctx.stroke();
ctx.restore();

// 内环
const ringR2 = lerp(50, width * 0.35, easeOutExpo(clamp(lt * 1.5 - 0.2, 0, 1)));
ctx.save();
ctx.strokeStyle = 'rgba(251,113,133,'+(0.15 * (1 - ringP))+')';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.arc(width/2, height/2, ringR2, 0, Math.PI * 2);
ctx.stroke();
ctx.restore();

// ── 主标题 · 弹性入场 + 辉光 ──
const titleP = easeOutBack(clamp(lt * 1.5, 0, 1));
const titleY = lerp(height + 120, height/2 - 40, titleP);
const titleAlpha = clamp(lt * 3, 0, 1);
const titleScale = lerp(0.7, 1, titleP);
ctx.save();
ctx.globalAlpha = titleAlpha;
ctx.translate(width/2, titleY);
ctx.scale(titleScale, titleScale);
ctx.font = '700 '+fs(104,width)+'px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
// 多层辉光
ctx.shadowColor = goldGlow;
ctx.shadowBlur = fs(40, width);
ctx.fillStyle = gold;
ctx.fillText('浮空岛开放日', 0, 0);
ctx.shadowBlur = fs(20, width);
ctx.fillText('浮空岛开放日', 0, 0);
ctx.shadowBlur = 0;
ctx.restore();

// ── 副标题 ──
const subP = easeOutCubic(clamp((lt - 0.35) * 2, 0, 1));
if (subP > 0) {
  ctx.save();
  ctx.globalAlpha = subP;
  ctx.font = '400 '+fs(32,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = inkMid;
  ctx.fillText('预约通道正式开启', width/2, height/2 + 70);
  ctx.restore();
}

// ── 装饰线 ──
const lineP = easeOutCubic(clamp((lt - 0.55) * 2.5, 0, 1));
if (lineP > 0) {
  ctx.save();
  ctx.globalAlpha = lineP * 0.7;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  const lw = 240 * lineP;
  ctx.beginPath();
  ctx.moveTo(width/2 - lw, height/2 + 120);
  ctx.lineTo(width/2 + lw, height/2 + 120);
  ctx.stroke();
  // 端点光点
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(width/2 - lw, height/2 + 120, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width/2 + lw, height/2 + 120, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── 底部飘带粒子 ──
for (let i = 0; i < 20; i++) {
  const sx = width * 0.1 + (width * 0.8) * (i / 20);
  const sy = height - 40 + Math.sin(lt * 4 + i * 0.8) * 20;
  const sa = 0.2 + Math.sin(lt * 2 + i) * 0.1;
  ctx.fillStyle = 'rgba(201,169,110,'+sa+')';
  ctx.beginPath();
  ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// ── 出场淡出 ──
const fo = clamp((lt - 0.85) / 0.15, 0, 1);
if (fo > 0) {
  ctx.fillStyle = 'rgba(6,6,14,'+easeInOutCubic(fo)+')';
  ctx.fillRect(0, 0, width, height);
}
`,
      elements: [
        { type: 'star', x: 160, y: 140, w: 40, h: 40, fillColor: 'transparent', strokeColor: '#c9a96e', strokeWidth: 1.5, opacity: 0.4, rotation: 0, animIn: 'scale', animInDuration: 1, animInDelay: 0.2, animOut: 'fade', animOutDuration: 0.5, role: 'background' },
        { type: 'circle', x: 1720, y: 180, w: 24, h: 24, fillColor: 'transparent', strokeColor: '#fb7185', strokeWidth: 1, opacity: 0.3, animIn: 'scale', animInDuration: 0.8, animInDelay: 0.5, role: 'background' },
        { type: 'circle', x: 200, y: 900, w: 16, h: 16, fillColor: 'rgba(201,169,110,0.14)', strokeColor: 'transparent', opacity: 0.5, animIn: 'fade', animInDuration: 1, animInDelay: 0.8, role: 'background' },
        { type: 'line', x: 1640, y: 880, w: 80, h: 2, x2: 80, y2: 0, color: '#c9a96e', strokeWidth: 1, opacity: 0.25, animIn: 'slideRight', animInDuration: 1, animInDelay: 0.6, role: 'background' }
      ]
    },
    {
      name: '免费名额',
      duration: 3,
      transition: 'zoom',
      transitionDuration: 0.5,
      code: `
// === 免费名额今天开抢 ===
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function easeOutBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function easeOutElastic(t){const c4=(2*Math.PI)/3;if(t===0)return 0;if(t===1)return 1;return Math.pow(2,-10*t)*Math.sin((t*10-0.75)*c4)+1}

const fs = utils.fontSize ? (s,w)=>utils.fontSize(s,w) : (s,w)=>Math.round(s*(w/1920));
const lt = t / 3;

// ── 动态背景 ──
const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.8);
const bgPulse = Math.sin(lt * 2) * 0.5 + 0.5;
bgGrad.addColorStop(0, 'rgba(22,18,38,'+(0.8+bgPulse*0.1)+')');
bgGrad.addColorStop(0.5, 'rgba(12,10,26,1)');
bgGrad.addColorStop(1, 'rgba(6,6,14,1)');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, width, height);

// ── 脉冲冲击波 ──
for (let wave = 0; wave < 3; wave++) {
  const waveDelay = wave * 0.4;
  const waveP = easeOutCubic(clamp((lt - waveDelay) * 1.5, 0, 1));
  if (waveP <= 0) continue;
  const waveR = waveP * width * 0.7;
  const waveAlpha = 0.12 * (1 - waveP) * (1 - wave * 0.2);
  ctx.save();
  ctx.strokeStyle = 'rgba(251,113,133,'+waveAlpha+')';
  ctx.lineWidth = 3 - wave;
  ctx.beginPath();
  ctx.arc(width/2, height/2 - 30, waveR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── 粒子爆发 ──
const burstCount = 40;
for (let i = 0; i < burstCount; i++) {
  const angle = (i / burstCount) * Math.PI * 2 + Math.sin(lt) * 0.5;
  const speed = 80 + (i % 7) * 40;
  const dist = Math.min(lt * speed, 300 + (i % 5) * 60);
  const bx = width/2 + Math.cos(angle) * dist;
  const by = height/2 - 30 + Math.sin(angle) * dist;
  const bSize = Math.max(1, 3 - lt * 2);
  const bAlpha = Math.max(0, 0.6 - lt * 0.5 - (dist / 600));
  if (bAlpha > 0) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(251,113,133,'+bAlpha+')' : 'rgba(201,169,110,'+bAlpha+')';
    ctx.beginPath();
    ctx.arc(bx, by, bSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── 主标题 · 弹性缩放 ──
const titleP = easeOutElastic(clamp(lt * 1.8, 0, 1));
ctx.save();
ctx.globalAlpha = clamp(lt * 4, 0, 1);
const sc = lerp(0.3, 1, titleP);
ctx.translate(width/2, height/2 - 30);
ctx.scale(sc, sc);
ctx.font = '700 '+fs(96,width)+'px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.shadowColor = 'rgba(251,113,133,0.4)';
ctx.shadowBlur = fs(35, width);
ctx.fillStyle = '#fb7185';
ctx.fillText('免费名额', 0, 0);
ctx.shadowBlur = 0;
ctx.restore();

// ── 副标题 ──
const subP = easeOutCubic(clamp((lt - 0.3) * 2.5, 0, 1));
if (subP > 0) {
  ctx.save();
  ctx.globalAlpha = subP;
  ctx.font = '600 '+fs(52,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0ece4';
  ctx.fillText('今天开抢', width/2, height/2 + 70);
  ctx.restore();
}

// ── 提示 ──
const hintP = easeOutCubic(clamp((lt - 0.55) * 2, 0, 1));
if (hintP > 0) {
  ctx.save();
  ctx.globalAlpha = hintP * 0.8;
  ctx.font = '400 '+fs(26,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(240,236,228,0.60)';
  ctx.fillText('潍坊的运动爱好者注意了！', width/2, height/2 + 160);
  ctx.restore();
}

// ── 角落装饰粒子 ──
for (let i = 0; i < 15; i++) {
  const cx = width * 0.05 + Math.random() * width * 0.9;
  const cy = height * 0.05 + Math.random() * height * 0.9;
  const cs = Math.sin(lt * 5 + i * 2) * 0.5 + 0.5;
  ctx.fillStyle = 'rgba(201,169,110,'+(0.1 * cs)+')';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

// ── 淡出 ──
const fo = clamp((lt - 0.85) / 0.15, 0, 1);
if (fo > 0) {
  ctx.fillStyle = 'rgba(6,6,14,'+easeInOutCubic(fo)+')';
  ctx.fillRect(0, 0, width, height);
}
`,
      elements: [
        { type: 'circle', x: 960, y: 510, w: 200, h: 200, fillColor: 'transparent', strokeColor: '#fb7185', strokeWidth: 1, opacity: 0.2, animIn: 'scale', animInDuration: 1.2, animInDelay: 0, role: 'background' },
        { type: 'circle', x: 960, y: 510, w: 280, h: 280, fillColor: 'transparent', strokeColor: '#fb7185', strokeWidth: 0.5, opacity: 0.1, animIn: 'scale', animInDuration: 1.5, animInDelay: 0.2, role: 'background' },
        { type: 'star', x: 120, y: 960, w: 30, h: 30, fillColor: 'transparent', strokeColor: '#c9a96e', strokeWidth: 1, opacity: 0.35, rotation: 0, animIn: 'fade', animInDuration: 1, animInDelay: 0.8, role: 'background' },
        { type: 'polygon', x: 1820, y: 100, w: 28, h: 28, sides: 6, fillColor: 'transparent', strokeColor: '#a78bfa', strokeWidth: 1, opacity: 0.3, animIn: 'scale', animInDuration: 0.8, animInDelay: 0.5, role: 'background' }
      ]
    },
    {
      name: '核心卖点',
      duration: 4,
      transition: 'slideUp',
      transitionDuration: 0.5,
      code: `
// === 核心卖点 · 三大体验 ===
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function easeOutBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}

const fs = utils.fontSize ? (s,w)=>utils.fontSize(s,w) : (s,w)=>Math.round(s*(w/1920));
function roundRect(x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
}

const lt = t / 4;

// ── 动态网格背景 ──
ctx.fillStyle = '#06060e';
ctx.fillRect(0, 0, width, height);
const gridGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.7);
gridGrad.addColorStop(0, 'rgba(17,21,34,1)');
gridGrad.addColorStop(0.6, 'rgba(10,12,24,1)');
gridGrad.addColorStop(1, 'rgba(6,6,14,1)');
ctx.fillStyle = gridGrad;
ctx.fillRect(0, 0, width, height);

// 细网格线
ctx.save();
ctx.strokeStyle = 'rgba(201,169,110,0.03)';
ctx.lineWidth = 0.5;
const gridSize = 60;
for (let gx = 0; gx < width; gx += gridSize) {
  ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
}
for (let gy = 0; gy < height; gy += gridSize) {
  ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
}
ctx.restore();

// ── 场景标题 ──
const tp = easeOutCubic(clamp(lt * 3, 0, 1));
ctx.save();
ctx.globalAlpha = tp;
ctx.font = '400 '+fs(32,width)+'px sans-serif';
ctx.textAlign = 'center';
ctx.fillStyle = 'rgba(240,236,228,0.60)';
ctx.fillText('浮空岛 · 三大核心体验', width/2, 130);
ctx.restore();

// ── 卡片数据 ──
const cards = [
  {icon:'◎',title:'网红气膜建筑',desc:'打卡地标级运动空间',col:'#c9a96e',dim:'rgba(201,169,110,0.14)'},
  {icon:'◆',title:'职业级场地',desc:'网球 · 羽毛球专业标准',col:'#5eead4',dim:'rgba(94,234,212,0.12)'},
  {icon:'❋',title:'五恒环境',desc:'全年恒温恒湿恒氧',col:'#a78bfa',dim:'rgba(167,139,250,0.12)'}
];
const cw = 440, ch = 300, gap = 36;
const tw = cw * 3 + gap * 2, sx = (width - tw) / 2, cy = height/2 - ch/2 + 40;

// 玻璃面板绘制
function glassPanel(x,y,w,h,alpha,col){
  ctx.save();
  ctx.fillStyle = 'rgba(17,21,34,'+alpha+')';
  roundRect(x,y,w,h,fs(12,width)); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = col ? col.replace(')', ',0.04)').replace('rgb', 'rgba') : 'rgba(255,255,255,0.03)';
  ctx.beginPath(); ctx.moveTo(x+1,y+1); ctx.lineTo(x+w-1,y+1); ctx.stroke();
  ctx.restore();
}

// 连接线（卡片之间）
const connectP = easeOutCubic(clamp((lt - 1) * 2, 0, 1));
if (connectP > 0) {
  ctx.save();
  ctx.globalAlpha = connectP * 0.3;
  ctx.strokeStyle = '#c9a96e';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let i = 0; i < 2; i++) {
    const x1 = sx + cw + i * (cw + gap);
    const y1 = cy + ch/2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + gap, y1);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

cards.forEach((card,i)=>{
  const delay = 0.15 + i * 0.18;
  const cp = easeOutBack(clamp((lt - delay) * 2.2, 0, 1));
  if (cp <= 0) return;
  const x = sx + i * (cw + gap), oy = lerp(100, 0, cp);
  const alpha = clamp((lt - delay) * 3.5, 0, 1);
  const cardScale = lerp(0.85, 1, cp);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + cw/2, cy + ch/2 + oy);
  ctx.scale(cardScale, cardScale);
  ctx.translate(-cw/2, -ch/2);

  glassPanel(0, 0, cw, ch, 0.5, card.dim);

  // 顶部色条
  ctx.fillStyle = card.col;
  roundRect(0, 0, cw, 4, 2); ctx.fill();

  // 图标
  ctx.font = '400 '+fs(52,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = card.col;
  ctx.shadowColor = card.dim;
  ctx.shadowBlur = 20;
  ctx.fillText(card.icon, cw/2, 80);
  ctx.shadowBlur = 0;

  // 标题
  ctx.font = '700 '+fs(34,width)+'px sans-serif';
  ctx.fillStyle = '#f0ece4';
  ctx.fillText(card.title, cw/2, 155);

  // 描述
  ctx.font = '400 '+fs(21,width)+'px sans-serif';
  ctx.fillStyle = 'rgba(240,236,228,0.60)';
  ctx.fillText(card.desc, cw/2, 205);

  // 装饰线
  ctx.strokeStyle = card.dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cw/2 - 50, 245);
  ctx.lineTo(cw/2 + 50, 245);
  ctx.stroke();

  ctx.restore();
});

// ── 底部提示 ──
const footP = easeOutCubic(clamp((lt - 1.1) * 2, 0, 1));
if (footP > 0) {
  ctx.save();
  ctx.globalAlpha = footP * 0.7;
  ctx.font = '400 '+fs(22,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(240,236,228,0.38)';
  ctx.fillText('不用花钱就能进馆 · 全程免费体验', width/2, height - 90);
  ctx.restore();
}

// ── 浮动粒子装饰 ──
for (let i = 0; i < 25; i++) {
  const px = sx + (i / 25) * tw;
  const py = cy - 30 + Math.sin(lt * 3 + i * 0.7) * 20;
  const pa = 0.15 + Math.sin(lt * 4 + i) * 0.08;
  ctx.fillStyle = 'rgba(201,169,110,'+pa+')';
  ctx.beginPath();
  ctx.arc(px, py, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// ── 淡出 ──
const fo = clamp((lt - 0.88) / 0.12, 0, 1);
if (fo > 0) {
  ctx.fillStyle = 'rgba(6,6,14,'+easeInOutCubic(fo)+')';
  ctx.fillRect(0, 0, width, height);
}
`,
      elements: [
        { type: 'circle', x: 224, y: 580, w: 20, h: 20, fillColor: 'rgba(201,169,110,0.1)', strokeColor: 'transparent', opacity: 0.5, animIn: 'scale', animInDuration: 0.8, animInDelay: 0.3, role: 'background' },
        { type: 'circle', x: 1676, y: 580, w: 16, h: 16, fillColor: 'rgba(94,234,212,0.1)', strokeColor: 'transparent', opacity: 0.4, animIn: 'scale', animInDuration: 0.8, animInDelay: 0.5, role: 'background' },
        { type: 'line', x: 304, y: 410, w: 1312, h: 2, x2: 1312, y2: 0, color: 'rgba(201,169,110,0.15)', strokeWidth: 1, opacity: 0.5, animIn: 'slideLeft', animInDuration: 1.2, animInDelay: 0.8, role: 'background' },
        { type: 'star', x: 960, y: 760, w: 24, h: 24, fillColor: 'transparent', strokeColor: '#a78bfa', strokeWidth: 1, opacity: 0.3, rotation: 0, animIn: 'fade', animInDuration: 1, animInDelay: 1.2, role: 'background' }
      ]
    },
    {
      name: '信任承诺',
      duration: 3,
      transition: 'wipe',
      transitionDuration: 0.5,
      code: `
// === 信任承诺 · 透明无套路 ===
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function easeOutBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}

const fs = utils.fontSize ? (s,w)=>utils.fontSize(s,w) : (s,w)=>Math.round(s*(w/1920));
const lt = t / 3;

// ── 背景 ──
const g = ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,width*0.7);
g.addColorStop(0,'rgba(17,21,34,1)');g.addColorStop(0.6,'rgba(10,12,24,1)');g.addColorStop(1,'rgba(6,6,14,1)');
ctx.fillStyle=g;ctx.fillRect(0,0,width,height);

// ── 浮动光点 ──
for (let i = 0; i < 30; i++) {
  const fx = ((i * 137.5) % width + width) % width;
  const fyBase = ((i * 49297) % height + height) % height;
  const fy = (fyBase - lt * 50 * (1 + (i % 4) * 0.2)) % height;
  const fY = fy < 0 ? fy + height : fy;
  const fAlpha = 0.1 + Math.sin(lt * 5 + i * 0.6) * 0.08;
  ctx.fillStyle = 'rgba(201,169,110,'+fAlpha+')';
  ctx.beginPath();
  ctx.arc(fx, fY, 1 + (i % 2), 0, Math.PI * 2);
  ctx.fill();
}

const items=[{text:'无套路',col:'#c9a96e',desc:'真诚透明'},{text:'无强制消费',col:'#5eead4',desc:'自由体验'},{text:'全区域开放',col:'#a78bfa',desc:'尽情探索'}];
const spacing=320,sx=width/2-spacing;

items.forEach((item,i)=>{
  const delay=i*0.18;
  const p=easeOutBack(clamp((lt-delay)*2.5,0,1));
  if(p<=0)return;
  const x=sx+i*spacing,alpha=clamp((lt-delay)*4,0,1);
  const sc=lerp(0.3,1,p);
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,height/2);ctx.scale(sc,sc);

  // 外环发光
  ctx.save();
  ctx.strokeStyle = item.col + '20';
  ctx.lineWidth = 20;
  ctx.beginPath();ctx.arc(0,0,70,0,Math.PI*2);ctx.stroke();
  ctx.restore();

  // 主圆环
  ctx.strokeStyle=item.col;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,0,60,0,Math.PI*2);ctx.stroke();

  // 填充背景
  ctx.fillStyle=item.col+'18';
  ctx.beginPath();ctx.arc(0,0,57,0,Math.PI*2);ctx.fill();

  // 对勾绘制动画
  const checkP = clamp((lt - delay - 0.2) * 3, 0, 1);
  if (checkP > 0) {
    ctx.save();
    ctx.strokeStyle = item.col;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const checkEased = easeOutCubic(checkP);
    ctx.beginPath();
    if (checkEased < 0.5) {
      const seg = checkEased * 2;
      ctx.moveTo(-20, 0);
      ctx.lineTo(-20 + (-2 - (-20)) * seg, 0 + (14 - 0) * seg);
    } else {
      ctx.moveTo(-20, 0);
      ctx.lineTo(-2, 14);
      const seg = (checkEased - 0.5) * 2;
      ctx.lineTo(-2 + (24 - (-2)) * seg, 14 + (-14 - 14) * seg);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 文字
  ctx.font='600 '+fs(34,width)+'px sans-serif';
  ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#f0ece4';
  ctx.shadowColor=item.col+'30';ctx.shadowBlur=12;
  ctx.fillText(item.text,0,95);ctx.shadowBlur=0;

  // 小字
  ctx.font='400 '+fs(18,width)+'px sans-serif';
  ctx.fillStyle = item.col + '90';
  ctx.fillText(item.desc, 0, 138);

  ctx.restore();
});

// ── 底部说明 ──
const footP=easeOutCubic(clamp((lt-0.75)*2,0,1));
if(footP>0){
  ctx.save();ctx.globalAlpha=footP;
  ctx.font='400 '+fs(26,width)+'px sans-serif';
  ctx.textAlign='center';ctx.fillStyle='rgba(240,236,228,0.60)';
  ctx.fillText('所有公共区域全部开放，透明承诺',width/2,height-140);
  ctx.restore();
}

// ── 底部信任徽章 ──
const badgeP = easeOutCubic(clamp((lt - 1) * 3, 0, 1));
if (badgeP > 0) {
  ctx.save();
  ctx.globalAlpha = badgeP * 0.6;
  const bw = 200, bh = 36, bx = width/2 - bw/2, by = height - 100;
  ctx.fillStyle = 'rgba(201,169,110,0.1)';
  ctx.strokeStyle = 'rgba(201,169,110,0.2)';
  ctx.lineWidth = 1;
  roundRect(bx, by, bw, bh, 18);
  ctx.fill();
  ctx.stroke();
  ctx.font = '500 '+fs(16,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#c9a96e';
  ctx.fillText('✓ 官方认证 · 真实有效', width/2, by + bh/2);
  ctx.restore();
}

// ── 淡出 ──
const fo=clamp((lt-0.85)/0.15,0,1);
if(fo>0){ctx.fillStyle='rgba(6,6,14,'+easeInOutCubic(fo)+')';ctx.fillRect(0,0,width,height);}
`,
      elements: [
        { type: 'circle', x: 960, y: 540, w: 180, h: 180, fillColor: 'transparent', strokeColor: '#c9a96e', strokeWidth: 0.5, opacity: 0.15, animIn: 'scale', animInDuration: 1.5, animInDelay: 0, role: 'background' },
        { type: 'circle', x: 960, y: 540, w: 260, h: 260, fillColor: 'transparent', strokeColor: '#5eead4', strokeWidth: 0.5, opacity: 0.1, animIn: 'scale', animInDuration: 1.8, animInDelay: 0.3, role: 'background' },
        { type: 'line', x: 100, y: 540, w: 120, h: 2, x2: 120, y2: 0, color: 'rgba(201,169,110,0.2)', strokeWidth: 1, opacity: 0.5, animIn: 'slideLeft', animInDuration: 1, animInDelay: 0.5, role: 'background' },
        { type: 'line', x: 1700, y: 540, w: 120, h: 2, x2: 120, y2: 0, color: 'rgba(167,139,250,0.2)', strokeWidth: 1, opacity: 0.5, animIn: 'slideRight', animInDuration: 1, animInDelay: 0.5, role: 'background' }
      ]
    },
    {
      name: '行动号召',
      duration: 3,
      transition: 'fade',
      transitionDuration: 0.5,
      code: `
// === 行动号召 · 留言抢名额 ===
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function easeOutBack(t){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}

const fs = utils.fontSize ? (s,w)=>utils.fontSize(s,w) : (s,w)=>Math.round(s*(w/1920));
function roundRect(x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
}

const lt = t / 3;

// ── 动态背景 ──
const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.7);
const bgShift = Math.sin(lt * 1.5) * 0.5 + 0.5;
bgGrad.addColorStop(0, 'rgba(20,16,32,'+(0.9+bgShift*0.1)+')');
bgGrad.addColorStop(0.6, 'rgba(10,12,24,1)');
bgGrad.addColorStop(1, 'rgba(6,6,14,1)');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, width, height);

// ── 底部光晕 ──
const bottomGlow = ctx.createRadialGradient(width/2, height, 0, width/2, height, width*0.5);
bottomGlow.addColorStop(0, 'rgba(201,169,110,0.08)');
bottomGlow.addColorStop(1, 'rgba(201,169,110,0)');
ctx.fillStyle = bottomGlow;
ctx.fillRect(0, height*0.5, width, height*0.5);

// ── 闪烁箭头 ──
const arrowP = easeOutCubic(clamp(lt * 2, 0, 1));
const blink = Math.sin(lt * Math.PI * 6) * 0.3 + 0.7;
ctx.save();
ctx.globalAlpha = arrowP * 0.6 * blink;
ctx.strokeStyle = '#c9a96e';
ctx.lineWidth = 2.5;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
const ay = height/2 - 130;
ctx.beginPath();
ctx.moveTo(width/2 - 24, ay - 12);
ctx.lineTo(width/2, ay + 12);
ctx.lineTo(width/2 + 24, ay - 12);
ctx.stroke();
ctx.restore();

// ── 主标题 · 渐变文字 ──
const titleP = easeOutBack(clamp(lt * 1.6, 0, 1));
ctx.save();
ctx.globalAlpha = clamp(lt * 3, 0, 1);
const sc = lerp(0.6, 1, titleP);
ctx.translate(width/2, height/2 - 20);
ctx.scale(sc, sc);
const grad = ctx.createLinearGradient(-250, -50, 250, 50);
grad.addColorStop(0, '#c9a96e');
grad.addColorStop(0.5, '#f59e0b');
grad.addColorStop(1, '#c9a96e');
ctx.font = '700 '+fs(88,width)+'px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.shadowColor = 'rgba(201,169,110,0.35)';
ctx.shadowBlur = fs(35, width);
ctx.fillStyle = grad;
ctx.fillText('留言抢名额', 0, 0);
ctx.shadowBlur = 0;
ctx.restore();

// ── 副标题 ──
const subP = easeOutCubic(clamp((lt - 0.35) * 2.5, 0, 1));
if (subP > 0) {
  ctx.save();
  ctx.globalAlpha = subP;
  ctx.font = '600 '+fs(44,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fb7185';
  ctx.shadowColor = 'rgba(251,113,133,0.35)';
  ctx.shadowBlur = 18;
  ctx.fillText('手慢无哦～', width/2, height/2 + 75);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── CTA 按钮 · 呼吸脉冲 ──
const ctaP = easeOutCubic(clamp((lt - 0.65) * 2.5, 0, 1));
if (ctaP > 0) {
  ctx.save();
  ctx.globalAlpha = ctaP;
  const bw = 380, bh = 68, bx = width/2 - bw/2, by = height/2 + 170;
  const pulse = Math.sin(lt * Math.PI * 4) * 0.06 + 1;
  ctx.translate(width/2, by + bh/2);
  ctx.scale(pulse, pulse);
  ctx.translate(-width/2, -(by + bh/2));

  // 外发光
  ctx.save();
  ctx.shadowColor = 'rgba(201,169,110,0.35)';
  ctx.shadowBlur = 30;
  const bgrad = ctx.createLinearGradient(bx, by, bx+bw, by+bh);
  bgrad.addColorStop(0, '#c9a96e');
  bgrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = bgrad;
  roundRect(bx, by, bw, bh, 34);
  ctx.fill();
  ctx.restore();

  // 按钮主体
  const bgrad2 = ctx.createLinearGradient(bx, by, bx+bw, by+bh);
  bgrad2.addColorStop(0, '#c9a96e');
  bgrad2.addColorStop(1, '#f59e0b');
  ctx.fillStyle = bgrad2;
  roundRect(bx, by, bw, bh, 34);
  ctx.fill();

  // 文字
  ctx.font = '600 '+fs(28,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#06060e';
  ctx.fillText('立即留言 · 抢免费名额', width/2, by + bh/2);
  ctx.restore();
}

// ── 浮动文字粒子 ──
const words = ['抢', '名', '额', '免', '费', '来'];
for (let i = 0; i < words.length; i++) {
  const wx = width * 0.15 + (width * 0.7) * (i / words.length) + Math.sin(lt * 3 + i * 1.2) * 30;
  const wy = height * 0.15 + Math.cos(lt * 2 + i * 0.8) * 40;
  const wa = 0.06 + Math.sin(lt * 4 + i) * 0.03;
  ctx.save();
  ctx.globalAlpha = wa;
  ctx.font = '700 '+fs(20,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c9a96e';
  ctx.fillText(words[i], wx, wy);
  ctx.restore();
}

// ── 品牌水印 ──
const wp = easeOutCubic(clamp((lt - 1) * 2, 0, 1));
if (wp > 0) {
  ctx.save();
  ctx.globalAlpha = wp * 0.35;
  ctx.font = '400 '+fs(16,width)+'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c9a96e';
  ctx.fillText('浮空岛 · FLOATING ISLAND', width/2, height - 55);
  ctx.restore();
}

// ── 淡出 ──
const fo = clamp((lt - 0.88) / 0.12, 0, 1);
if (fo > 0) {
  ctx.fillStyle = 'rgba(6,6,14,'+easeInOutCubic(fo)+')';
  ctx.fillRect(0, 0, width, height);
}
`,
      elements: [
        { type: 'circle', x: 960, y: 740, w: 400, h: 400, fillColor: 'transparent', strokeColor: 'rgba(201,169,110,0.08)', strokeWidth: 1, opacity: 0.5, animIn: 'scale', animInDuration: 1.5, animInDelay: 0.2, role: 'background' },
        { type: 'star', x: 140, y: 160, w: 24, h: 24, fillColor: 'transparent', strokeColor: '#fb7185', strokeWidth: 1, opacity: 0.3, rotation: 0, animIn: 'scale', animInDuration: 0.8, animInDelay: 0.5, role: 'background' },
        { type: 'polygon', x: 1800, y: 940, w: 22, h: 22, sides: 6, fillColor: 'transparent', strokeColor: '#5eead4', strokeWidth: 1, opacity: 0.25, animIn: 'scale', animInDuration: 0.8, animInDelay: 0.7, role: 'background' },
        { type: 'circle', x: 180, y: 980, w: 12, h: 12, fillColor: 'rgba(201,169,110,0.15)', strokeColor: 'transparent', opacity: 0.6, animIn: 'fade', animInDuration: 1, animInDelay: 0.9, role: 'background' }
      ]
    }
  ]
};

// 向后兼容
if (typeof window !== 'undefined') {
  window.DEFAULT_PROJECT = DEFAULT_PROJECT;
}
