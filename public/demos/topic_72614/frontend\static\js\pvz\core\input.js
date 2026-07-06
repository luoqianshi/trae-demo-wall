const CELL_SIZE = 100;
const HUD_HEIGHT = 120;
const GRID_OFFSET_X = 100;   // left margin for lawn mowers
const GRID_OFFSET_Y = HUD_HEIGHT; // grid starts below HUD

export class InputManager {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;

    this.selectedPlant = null;
    this.mouseX = 0;
    this.mouseY = 0;

    // Bound handlers for cleanup
    this._onClick = this._onClick.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
  }

  init() {
    this.canvas.addEventListener('click', this._onClick);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
  }

  destroy() {
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
  }

  _onClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 720 / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    this.handleClick(x, y);
  }

  _onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 720 / rect.height;
    this.mouseX = (event.clientX - rect.left) * scaleX;
    this.mouseY = (event.clientY - rect.top) * scaleY;
    
    // Update hover highlight if plant is selected
    if (this.selectedPlant && this.game.renderer) {
      const gridPos = this.getGridPosition(this.mouseX, this.mouseY);
      const isValid = this._canPlacePlant(gridPos.row, gridPos.col);
      this.game.renderer.updateHoverHighlight(gridPos.row, gridPos.col, isValid, this.selectedPlant);
    }
  }

  _onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 1000 / rect.width;
      const scaleY = 720 / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      this.mouseX = x;
      this.mouseY = y;
      this.handleClick(x, y);
    }
  }

  _onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 1000 / rect.width;
      const scaleY = 720 / rect.height;
      this.mouseX = (touch.clientX - rect.left) * scaleX;
      this.mouseY = (touch.clientY - rect.top) * scaleY;
    }
  }

  handleClick(x, y) {
    // Check if click is in HUD area (top 100px)
    if (y < HUD_HEIGHT) {
      this._handleHUDClick(x, y);
      return;
    }

    // swap_doll 遗物：选择两个植物交换位置
    if (this.game._swapDollMode) {
      const gridPos = this.getGridPosition(x, y);
      const inGrid = gridPos.row >= 0 && gridPos.row < 5 &&
          gridPos.col >= 0 && gridPos.col < 9;
      if (inGrid) {
        const plant = this.game.grid[gridPos.row][gridPos.col];
        if (plant) {
          if (!this.game._swapDollFirstPlant) {
            this.game._swapDollFirstPlant = plant;
            // 视觉反馈：放大 + 金色高亮
            if (plant.sprite) {
              plant.sprite.scale.multiplyScalar(1.15);
              plant.sprite.material.color.set(0xffdd44);
            }
            // 浮动提示
            if (this.game.showFloatingMessage) {
              this.game.showFloatingMessage('请选择第二株植物进行交换', 'info');
            }
          } else if (this.game._swapDollFirstPlant !== plant) {
            // 执行交换
            const result = this.game.useSwapDoll(this.game._swapDollFirstPlant, plant);
            // 还原第一个植物缩放 + 颜色
            if (this.game._swapDollFirstPlant.sprite) {
              this.game._swapDollFirstPlant.sprite.scale.multiplyScalar(1/1.15);
              this.game._swapDollFirstPlant.sprite.material.color.set(0xffffff);
            }
            this.game._swapDollMode = false;
            this.game._swapDollFirstPlant = null;
          }
        } else {
          // 点击空格子：取消选择，恢复高亮
          if (this.game._swapDollFirstPlant && this.game._swapDollFirstPlant.sprite) {
            this.game._swapDollFirstPlant.sprite.scale.multiplyScalar(1/1.15);
            this.game._swapDollFirstPlant.sprite.material.color.set(0xffffff);
          }
          this.game._swapDollFirstPlant = null;
          if (this.game.showFloatingMessage) {
            this.game.showFloatingMessage('已取消选择，请重新选择第一株植物', 'info');
          }
        }
      }
      return;
    }

    // Check if a plant is selected and click is on the grid
    if (this.selectedPlant) {
      const gridPos = this.getGridPosition(x, y);
      if (gridPos.row >= 0 && gridPos.row < 5 &&
          gridPos.col >= 0 && gridPos.col < 9) {
        const placed = this.game.placePlant(this.selectedPlant, gridPos.row, gridPos.col);
        if (placed) {
          this.deselectPlant();
        } else {
          // Show visual feedback for failed placement
          this._showPlacementFeedback(x, y, gridPos);
        }
      }
      return;
    }

    // Check if clicking on a sun
    this._handleSunClick(x, y);
  }

  _showPlacementFeedback(screenX, screenY, gridPos) {
    const game = this.game;
    const data = game._getPlantData(this.selectedPlant);
    if (!data) return;

    let message = '';
    let color = '#ff4444';

    if (game.grid[gridPos.row][gridPos.col]) {
      message = '已有植物';
    } else if (game.sun < data.cost) {
      message = `阳光不足 (需要${data.cost})`;
      color = '#ffaa00';
    } else {
      // Check aquatic requirement
      const isWaterRow = game.sceneConfig && game.sceneConfig.waterRows && game.sceneConfig.waterRows.includes(gridPos.row);
      if (data.is_aquatic && !isWaterRow && this.selectedPlant !== 'lilypad') {
        message = '只能种在水中';
      } else if (!data.is_aquatic && isWaterRow && this.selectedPlant !== 'lilypad' && this.selectedPlant !== 'tangle_kelp' && this.selectedPlant !== 'sea_shroom') {
        message = '无法种在水中';
      } else {
        message = '无法放置';
      }
    }

    if (message && game.renderer && game.renderer.showPlacementFeedback) {
      game.renderer.showPlacementFeedback(screenX, screenY, message, color);
    }
  }

  _handleHUDClick(x, y) {
    // Card bar is positioned at top: 52px in CSS, but canvas is 720x500
    // Cards start around x=80 (after lawn mowers), each card is ~62px wide
    const cardWidth = 62;
    const cardStartX = 80;
    const cardY = 52;
    const cardHeight = 72;

    // Check if click is in card bar area
    if (y >= cardY && y <= cardY + cardHeight) {
      const cardIndex = Math.floor((x - cardStartX) / cardWidth);
      const loadout = this.game.loadout;
      if (cardIndex >= 0 && cardIndex < loadout.length) {
        const plantId = loadout[cardIndex];
        this.selectPlant(plantId);
        return;
      }
    }

    // Check if clicking on sun (below card bar)
    if (y > cardY + cardHeight) {
      this._handleSunClick(x, y);
      return;
    }

    // Click elsewhere in HUD deselects
    this.deselectPlant();
  }

  _handleSunClick(x, y) {
    // Check proximity to any sun
    // 大幅增大可拾取的点击范围（从 40 → 85），让阳光更容易被点中
    const SUN_CLICK_RADIUS = 85;
    const worldPos = this.getWorldPosition(x, y);
    // 优先拾取距离最近且在范围内的阳光
    let bestIndex = -1;
    let bestDist = SUN_CLICK_RADIUS;
    for (let i = this.game.suns.length - 1; i >= 0; i--) {
      const sun = this.game.suns[i];
      const dx = worldPos.x - sun.x;
      const dy = worldPos.y - sun.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0) {
      this.game.collectSun(bestIndex);
    }
  }

  getGridPosition(screenX, screenY) {
    const col = Math.floor((screenX - GRID_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((screenY - GRID_OFFSET_Y) / CELL_SIZE);
    return { row, col };
  }

  getWorldPosition(screenX, screenY) {
    return { x: screenX, y: screenY };
  }

  selectPlant(plantId) {
    this.selectedPlant = plantId;
  }

  deselectPlant() {
    this.selectedPlant = null;
  }

  getSelectedPlant() {
    return this.selectedPlant;
  }

  isPlantSelected() {
    return this.selectedPlant !== null;
  }

  _canPlacePlant(row, col) {
    const game = this.game;
    if (row < 0 || row >= 5 || col < 0 || col >= 9) return false;
    if (game.grid[row][col]) return false;

    const data = game._getPlantData(this.selectedPlant);
    if (!data) return false;
    if (game.sun < data.cost) return false;

    // Check aquatic requirement
    const isWaterRow = game.sceneConfig && game.sceneConfig.waterRows && game.sceneConfig.waterRows.includes(row);
    if (data.is_aquatic && !isWaterRow && this.selectedPlant !== 'lilypad') return false;
    if (!data.is_aquatic && isWaterRow && this.selectedPlant !== 'lilypad' && this.selectedPlant !== 'tangle_kelp' && this.selectedPlant !== 'sea_shroom') return false;

    return true;
  }
}
