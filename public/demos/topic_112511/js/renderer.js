// Canvas 渲染引擎 - 大地图 + 相机系统
class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // 视口尺寸
    this.vw = GAME_CONFIG.viewportWidth;
    this.vh = GAME_CONFIG.viewportHeight;

    // 地图尺寸
    this.mw = GAME_CONFIG.mapWidth;
    this.mh = GAME_CONFIG.mapHeight;

    // 相机位置（跟随主角）
    this.cameraX = 0;
    this.cameraY = 0;

    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
  }

  setupCanvas() {
    this.canvas.width = this.vw;
    this.canvas.height = this.vh;

    // CSS 缩放以适应屏幕
    const scale = Math.min(
      window.innerWidth / this.vw,
      window.innerHeight / this.vh
    ) * 0.95;

    this.canvas.style.width = `${this.vw * scale}px`;
    this.canvas.style.height = `${this.vh * scale}px`;

    this.ctx.imageSmoothingEnabled = false;
  }

  // 更新相机位置（跟随目标，限制在地图范围内）
  updateCamera(targetX, targetY) {
    // 相机中心跟随目标
    this.cameraX = targetX - this.vw / 2;
    this.cameraY = targetY - this.vh / 2;

    // 限制在地图边界内
    this.cameraX = Math.max(0, Math.min(this.mw - this.vw, this.cameraX));
    this.cameraY = Math.max(0, Math.min(this.mh - this.vh, this.cameraY));
  }

  clear() {
    this.ctx.clearRect(0, 0, this.vw, this.vh);
  }

  // 坐标转换：世界坐标 -> 屏幕坐标
  worldToScreen(wx, wy) {
    return {
      x: Math.round(wx - this.cameraX),
      y: Math.round(wy - this.cameraY)
    };
  }

  // 检查是否在视口内（用于裁剪）
  isInViewport(wx, wy, w, h) {
    return (
      wx + w >= this.cameraX &&
      wx <= this.cameraX + this.vw &&
      wy + h >= this.cameraY &&
      wy <= this.cameraY + this.vh
    );
  }

  // 绘制大地图
  drawMap(gameState, currentLocationId) {
    const mc = GAME_CONFIG.mapColors;

    // 1. 绘制草地背景
    this.ctx.fillStyle = mc.grass;
    for (let y = 0; y < this.mh; y += 50) {
      for (let x = 0; x < this.mw; x += 50) {
        if (!this.isInViewport(x, y, 50, 50)) continue;
        const s = this.worldToScreen(x, y);
        // 随机草色变化
        const shade = ((x + y) % 3 === 0) ? mc.grassLight : ((x + y) % 5 === 0) ? mc.grassDark : mc.grass;
        this.ctx.fillStyle = shade;
        this.ctx.fillRect(s.x, s.y, 50, 50);
      }
    }

    // 2. 绘制水域
    for (const water of WATERS) {
      if (!this.isInViewport(water.x, water.y, water.w, water.h)) continue;
      const s = this.worldToScreen(water.x, water.y);
      this.ctx.fillStyle = mc.water;
      this.ctx.fillRect(s.x, s.y, water.w, water.h);
      // 水波纹效果
      const time = Date.now() / 1000;
      this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 0; i < 3; i++) {
        const wx = s.x + 12 + i * 45;
        const wy = s.y + 12 + Math.sin(time + i) * 5;
        this.ctx.fillRect(wx, wy, 25, 5);
      }
    }

    // 3. 绘制道路
    for (const road of ROADS) {
      if (!this.isInViewport(
        Math.min(road.x1, road.x2),
        Math.min(road.y1, road.y2),
        Math.abs(road.x2 - road.x1) + road.w,
        Math.abs(road.y2 - road.y1) + road.w
      )) continue;

      const s1 = this.worldToScreen(road.x1, road.y1);
      const s2 = this.worldToScreen(road.x2, road.y2);

      // 道路主体
      this.ctx.strokeStyle = mc.road;
      this.ctx.lineWidth = road.w;
      this.ctx.lineCap = 'square';
      this.ctx.beginPath();
      this.ctx.moveTo(s1.x, s1.y);
      this.ctx.lineTo(s2.x, s2.y);
      this.ctx.stroke();

      // 道路高光
      this.ctx.strokeStyle = mc.roadLight;
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.moveTo(s1.x, s1.y);
      this.ctx.lineTo(s2.x, s2.y);
      this.ctx.stroke();

      // 道路中线（虚线效果）
      if (road.w >= 50) {
        this.ctx.strokeStyle = mc.roadMarking;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(s1.x, s1.y);
        this.ctx.lineTo(s2.x, s2.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    }

    // 4. 绘制人行道（地点周围）
    for (const key in LOCATIONS) {
      const loc = LOCATIONS[key];
      if (!this.isInViewport(loc.x - 10, loc.y - 10, loc.w + 20, loc.h + 20)) continue;
      const s = this.worldToScreen(loc.x - 10, loc.y - 10);
      this.ctx.fillStyle = mc.sidewalk;
      this.ctx.fillRect(s.x, s.y, loc.w + 20, loc.h + 20);
    }

    // 5. 绘制装饰物
    for (const dec of DECORATIONS) {
      if (!this.isInViewport(dec.x - 20, dec.y - 40, 40, 50)) continue;
      const s = this.worldToScreen(dec.x, dec.y);
      this.drawDecoration(dec, s.x, s.y);
    }

    // 6. 绘制地点建筑
    for (const key in LOCATIONS) {
      const loc = LOCATIONS[key];
      if (!this.isInViewport(loc.x, loc.y, loc.w, loc.h)) continue;
      const s = this.worldToScreen(loc.x, loc.y);
      const isCurrent = key === currentLocationId;
      this.drawBuilding(loc, s.x, s.y, isCurrent);
    }

    // 7. 绘制时间效果覆盖层
    this.drawTimeEffect(gameState);
  }

  drawDecoration(dec, sx, sy) {
    const mc = GAME_CONFIG.mapColors;

    if (dec.type === 'tree') {
      // 树干
      this.ctx.fillStyle = mc.treeTrunk;
      this.ctx.fillRect(sx, sy + 15, 10, 20);
      // 树冠（多层）
      this.ctx.fillStyle = mc.tree;
      this.ctx.fillRect(sx - 10, sy - 5, 30, 25);
      this.ctx.fillStyle = '#3a8a3a';
      this.ctx.fillRect(sx - 5, sy - 15, 20, 20);
    }

    if (dec.type === 'bench') {
      this.ctx.fillStyle = '#8a6a4a';
      this.ctx.fillRect(sx, sy + 5, 40, 10);
      this.ctx.fillStyle = '#6a4a2a';
      this.ctx.fillRect(sx + 5, sy + 15, 5, 10);
      this.ctx.fillRect(sx + 30, sy + 15, 5, 10);
    }

    if (dec.type === 'fountain') {
      const time = Date.now() / 500;
      this.ctx.fillStyle = '#888';
      this.ctx.fillRect(sx, sy + 15, 35, 10);
      this.ctx.fillStyle = mc.water;
      this.ctx.fillRect(sx + 5, sy + 5, 25, 15);
      // 水花
      this.ctx.fillStyle = '#add8e6';
      this.ctx.fillRect(sx + 13, sy - 5 + Math.sin(time) * 5, 10, 10);
    }
  }

  drawBuilding(loc, sx, sy, isCurrent) {
    const colors = GAME_CONFIG.locationColors[loc.id] || GAME_CONFIG.locationColors.home;

    // 建筑主体
    this.ctx.fillStyle = colors.primary;
    this.ctx.fillRect(sx, sy, loc.w, loc.h);

    // 屋顶
    this.ctx.fillStyle = colors.roof;
    this.ctx.fillRect(sx - 8, sy - 10, loc.w + 15, 15);
    this.ctx.fillRect(sx, sy - 20, loc.w, 10);

    // 建筑边框
    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(sx, sy, loc.w, loc.h);

    // 门
    this.ctx.fillStyle = colors.door;
    this.ctx.fillRect(sx + loc.w / 2 - 15, sy + loc.h - 35, 30, 35);
    // 门把手
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillRect(sx + loc.w / 2 + 5, sy + loc.h - 20, 5, 5);

    // 窗户（根据建筑大小调整）
    this.ctx.fillStyle = '#add8e6';
    const winW = 25;
    const winH = 20;
    const winCols = Math.floor((loc.w - 25) / 45);
    const winRows = Math.floor((loc.h - 50) / 35);
    for (let r = 0; r < winRows; r++) {
      for (let c = 0; c < winCols; c++) {
        const wx = sx + 15 + c * 45;
        const wy = sy + 15 + r * 35;
        if (wy + winH < loc.h - 35) {
          this.ctx.fillRect(wx, wy, winW, winH);
          // 窗框
          this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          this.ctx.strokeRect(wx, wy, winW, winH);
        }
      }
    }

    // 地点名称标签
    this.ctx.fillStyle = isCurrent ? '#ffd700' : 'rgba(255,255,255,0.9)';
    this.ctx.font = '18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(loc.name, sx + loc.w / 2, sy - 25);

    // 当前地点高亮效果
    if (isCurrent) {
      const time = Date.now() / 800;
      const glow = Math.sin(time) * 0.2 + 0.3;
      this.ctx.fillStyle = `rgba(255,215,0,${glow})`;
      this.ctx.fillRect(sx - 5, sy - 5, loc.w + 10, loc.h + 10);
    }
  }

  drawTimeEffect(gameState) {
    const slot = GAME_CONFIG.timeSlots.find(
      s => gameState.hour >= s.startHour && gameState.hour < s.endHour
    );

    if (slot && slot.sky) {
      const r = parseInt(slot.sky.slice(1, 3), 16);
      const g = parseInt(slot.sky.slice(3, 5), 16);
      const b = parseInt(slot.sky.slice(5, 7), 16);

      let alpha = 0;
      if (slot.id === 'midnight') alpha = 0.35;
      else if (slot.id === 'night') alpha = 0.25;
      else if (slot.id === 'evening') alpha = 0.12;
      else if (slot.id === 'early_morning') alpha = 0.08;

      if (alpha > 0) {
        this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        this.ctx.fillRect(0, 0, this.vw, this.vh);
      }
    }
  }

  // 在视口内绘制玩家（坐标已经是屏幕坐标）
  drawPlayer(player) {
    player.draw(this.ctx);
  }

  // 绘制事件选择面板
  drawEventPanel(events, playerState, selectedIndex) {
    const panelY = this.vh - 120;
    const panelHeight = 120;

    // 面板背景
    this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this.ctx.fillRect(0, panelY, this.vw, panelHeight);
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(0, panelY, this.vw, panelHeight);

    // 标题
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('可用事件（按数字键选择 / 空格执行）:', 13, panelY + 25);

    // 事件列表
    let x = 13;
    events.forEach((event, i) => {
      if (x + 190 > this.vw) return; // 超出视口不绘制

      const isSelected = i === selectedIndex;
      const isAvailable = this.checkEventAvailable(event, playerState);

      this.ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
      if (!isAvailable) this.ctx.fillStyle = 'rgba(100,100,100,0.3)';
      this.ctx.fillRect(x, panelY + 35, 190, 75);
      this.ctx.strokeStyle = isSelected ? '#fff' : '#666';
      this.ctx.strokeRect(x, panelY + 35, 190, 75);

      this.ctx.fillStyle = isAvailable ? '#fff' : '#888';
      this.ctx.font = '18px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${i + 1}.${event.name}`, x + 95, panelY + 60);

      this.ctx.font = '15px monospace';
      let preview = '';
      if (event.effects.goldDelta > 0) preview += `+${event.effects.goldDelta}G `;
      if (event.effects.goldDelta < 0) preview += `${event.effects.goldDelta}G `;
      if (event.effects.energyDelta < 0) preview += `${event.effects.energyDelta}E`;
      this.ctx.fillText(preview, x + 95, panelY + 85);

      this.ctx.fillText(`${event.durationMinutes}分钟`, x + 95, panelY + 100);

      x += 200;
    });
  }

  // 绘制小地图（右上角下方）
  drawMinimap(player, currentLocationId) {
    const mmW = 160;
    const mmH = 86;
    const mmX = this.vw - mmW - 10;
    const mmY = 10;
    const scaleX = mmW / this.mw;
    const scaleY = mmH / this.mh;

    // 小地图背景
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.fillRect(mmX, mmY, mmW, mmH);
    this.ctx.strokeStyle = '#666';
    this.ctx.strokeRect(mmX, mmY, mmW, mmH);

    // 绘制地点
    for (const key in LOCATIONS) {
      const loc = LOCATIONS[key];
      const lx = mmX + loc.x * scaleX;
      const ly = mmY + loc.y * scaleY;
      const lw = Math.max(4, loc.w * scaleX);
      const lh = Math.max(3, loc.h * scaleY);

      this.ctx.fillStyle = key === currentLocationId ? '#ffd700' : '#666';
      this.ctx.fillRect(lx, ly, lw, lh);
    }

    // 绘制玩家位置
    const px = mmX + player.x * scaleX;
    const py = mmY + player.y * scaleY;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(px - 2, py - 2, 6, 6);

    // 视口框
    const vx = mmX + this.cameraX * scaleX;
    const vy = mmY + this.cameraY * scaleY;
    const vw = this.vw * scaleX;
    const vh = this.vh * scaleY;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(vx, vy, vw, vh);
  }

  checkEventAvailable(event, playerState) {
    if (!event.prerequisites) return true;
    const pre = event.prerequisites;
    if (pre.minHealth && playerState.health < pre.minHealth) return false;
    if (pre.minEnergy && playerState.energy < pre.minEnergy) return false;
    if (pre.minGold && playerState.gold < pre.minGold) return false;
    return true;
  }
}
