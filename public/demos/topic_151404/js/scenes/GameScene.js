/**
 * 游戏主场景
 * 整合地图、玩家、摄像机、HUD，处理游戏循环更新逻辑
 * 负责游戏核心玩法的调度和管理
 */

(function() {

class GameScene extends Scene {
    /**
     * 构造函数
     * @param {Game} game - 游戏主类实例
     */
    constructor(game) {
        super(game);
        
        // 游戏地图
        this.gameMap = null;
        
        // 玩家角色
        this.player = null;
        
        // 摄像机
        this.camera = null;
        
        // HUD 界面
        this.hud = null;
        
        // 地图容器（用于摄像机移动）
        this.worldContainer = null;
        
        // 夜晚遮罩
        this.nightOverlay = null;
        
        // 瓦片大小（像素）
        this.tileSize = 32;
        
        // 地图尺寸（格子数）
        this.mapWidth = 60;
        this.mapHeight = 50;
        
        // 游戏统计数据
        this.stats = {
            resourcesCollected: 0,
            itemsCrafted: 0,
            survivalTime: 0
        };
    }

    /**
     * 初始化场景（仅调用一次）
     * 创建游戏世界、玩家、HUD 等
     * @protected
     */
    _init() {
        this._createWorldContainer();
        this._createMap();
        this._createPlayer();
        this._createCamera();
        this._createNightOverlay();
        this._createHUD();
        this._setupInteraction();
    }

    /**
     * 创建世界容器
     * 所有游戏世界对象都放在这个容器中，便于摄像机控制
     * @private
     */
    _createWorldContainer() {
        this.worldContainer = new PIXI.Container();
        this.container.addChild(this.worldContainer);
    }

    /**
     * 创建游戏地图
     * 生成地形和资源
     * @private
     */
    _createMap() {
        // 检查是否有 GameMap 类
        if (typeof GameMap !== 'undefined') {
            this.gameMap = new GameMap(this.mapWidth, this.mapHeight, this.tileSize);
            this.worldContainer.addChild(this.gameMap);
            // 将地图引用设置到全局游戏管理器
            gameManager.setGameMap(this.gameMap);
        } else {
            // 降级方案：绘制简单的测试地图
            this._createSimpleMap();
        }
    }

    /**
     * 创建简单测试地图（当 GameMap 类不可用时）
     * @private
     */
    _createSimpleMap() {
        const mapGraphics = new PIXI.Graphics();
        const tileSize = this.tileSize;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                // 简单的同心圆形地形
                const centerX = this.mapWidth / 2;
                const centerY = this.mapHeight / 2;
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                const maxDist = Math.min(centerX, centerY);
                const ratio = dist / maxDist + (Math.random() - 0.5) * 0.15;
                
                let color;
                if (ratio > 0.9) color = 0x1a4d7a;           // 深海
                else if (ratio > 0.75) color = 0x4A90D9;    // 浅海
                else if (ratio > 0.65) color = 0xF4D35E;    // 沙滩
                else if (ratio > 0.4) color = 0x7CB342;     // 草地
                else if (ratio > 0.2) color = 0x0A8754;     // 森林
                else color = 0x9E9E9E;                      // 岩石区
                
                mapGraphics.beginFill(color);
                mapGraphics.drawRect(x * tileSize, y * tileSize, tileSize, tileSize);
                mapGraphics.endFill();
            }
        }
        
        this.worldContainer.addChild(mapGraphics);
    }

    /**
     * 创建玩家角色
     * @private
     */
    _createPlayer() {
        const startX = this.mapWidth / 2 + 0.5;
        const startY = this.mapHeight / 2 + 0.5;
        
        if (typeof Player !== 'undefined') {
            this.player = new Player(startX, startY);
            this.worldContainer.addChild(this.player);
        } else {
            this.player = this._createSimplePlayer();
            this.player.tileX = startX;
            this.player.tileY = startY;
            if (this.player.sprite) {
                this.player.sprite.x = this.player.tileX * this.tileSize;
                this.player.sprite.y = this.player.tileY * this.tileSize;
                this.worldContainer.addChild(this.player.sprite);
            }
        }
        
        // 将玩家引用设置到全局游戏管理器（供系统模块访问）
        gameManager.setPlayer(this.player);
    }

    /**
     * 创建简单玩家（当 Player 类不可用时）
     * @returns {object} 玩家对象
     * @private
     */
    _createSimplePlayer() {
        const g = new PIXI.Graphics();
        
        // 身体
        g.beginFill(0xffcc99);
        g.drawRect(-8, -16, 16, 24);
        g.endFill();
        
        // 头发
        g.beginFill(0x8B4513);
        g.drawRect(-7, -20, 14, 8);
        g.endFill();
        
        // 眼睛
        g.beginFill(0x333333);
        g.drawRect(-4, -12, 2, 2);
        g.drawRect(2, -12, 2, 2);
        g.endFill();
        
        return {
            sprite: g,
            tileX: 0,       // 统一使用 tileX/tileY 格子坐标
            tileY: 0,
            speed: 3,
            inventory: {},
            stats: {
                hunger: 100,
                thirst: 100,
                energy: 100
            }
        };
    }

    /**
     * 创建摄像机
     * 跟随玩家移动，使用全局 Camera 类
     * @private
     */
    _createCamera() {
        // 检查是否有全局 Camera 类
        if (typeof Camera !== 'undefined') {
            // 使用全局 Camera 类
            this.camera = new Camera(this.worldContainer, this.viewWidth, this.viewHeight, this.tileSize);
            // 设置跟随目标（玩家）
            this.camera.follow(this.player);
            // 设置地图边界（格子数）
            this.camera.setMapBounds(this.mapWidth, this.mapHeight);
        } else {
            // 降级方案：简单的摄像机对象
            this.camera = {
                target: this.player,
                container: this.worldContainer,
                viewWidth: this.viewWidth,
                viewHeight: this.viewHeight,
                tileSize: this.tileSize,
                
                update() {
                    const targetX = this.target.tileX * this.tileSize;
                    const targetY = this.target.tileY * this.tileSize;
                    
                    let camX = targetX - this.viewWidth / 2;
                    let camY = targetY - this.viewHeight / 2;
                    
                    // 限制摄像机范围
                    const maxX = 60 * this.tileSize - this.viewWidth;
                    const maxY = 50 * this.tileSize - this.viewHeight;
                    camX = Math.max(0, Math.min(camX, maxX));
                    camY = Math.max(0, Math.min(camY, maxY));
                    
                    this.container.x = -camX;
                    this.container.y = -camY;
                }
            };
        }
    }

    /**
     * 创建夜晚遮罩
     * 实现昼夜循环视觉效果
     * @private
     */
    _createNightOverlay() {
        this.nightOverlay = new PIXI.Graphics();
        this.nightOverlay.interactive = false;
        this.container.addChild(this.nightOverlay);
        this._updateNightOverlay(12); // 默认中午
    }

    /**
     * 更新夜晚遮罩
     * @param {number} hour - 当前游戏小时（0-24）
     * @private
     */
    _updateNightOverlay(hour) {
        let t; // 0 = 夜晚, 1 = 白天
        
        if (hour >= 6 && hour < 18) {
            if (hour < 8) {
                t = (hour - 6) / 2;      // 日出过渡
            } else if (hour > 16) {
                t = (18 - hour) / 2;     // 日落过渡
            } else {
                t = 1;                     // 白天
            }
        } else {
            t = 0;                         // 夜晚
        }
        
        const nightAlpha = 0.6 * (1 - t);
        
        this.nightOverlay.clear();
        this.nightOverlay.beginFill(0x0a0a2a, nightAlpha);
        this.nightOverlay.drawRect(0, 0, this.viewWidth, this.viewHeight);
        this.nightOverlay.endFill();
    }

    /**
     * 创建 HUD 界面
     * @private
     */
    _createHUD() {
        if (typeof HUD !== 'undefined') {
            this.hud = new HUD();
        }
    }

    /**
     * 设置交互事件监听
     * 处理鼠标点击地图事件，将屏幕坐标转换为世界坐标并设置点击目标
     * @private
     */
    _setupInteraction() {
        if (!this.app || !this.app.renderer) return;

        const renderer = this.app.renderer;
        
        this._onClick = (e) => {
            if (!this.player || !this.gameMap) return;

            const rect = renderer.view.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            const worldX = (screenX - this.worldContainer.x) / this.tileSize;
            const worldY = (screenY - this.worldContainer.y) / this.tileSize;

            const tileX = Math.floor(worldX);
            const tileY = Math.floor(worldY);

            if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
                return;
            }

            if (!this.gameMap.isWalkable(tileX + 0.5, tileY + 0.5)) {
                return;
            }

            this.gameMap.setHighlightedTile(tileX, tileY);

            inputManager.setClickTarget(worldX, worldY);
        };

        renderer.view.addEventListener('click', this._onClick);
    }

    /**
     * 进入场景时的回调
     * 重置游戏状态、显示 HUD
     * @protected
     */
    _onEnter() {
        // 显示 HUD
        if (this.hud && this.hud.show) {
            this.hud.show();
        }
        
        // 重置时间系统（使用全局单例）
        if (typeof timeSystem !== 'undefined') {
            timeSystem.reset();
        }
        
        // 重置事件系统（使用全局单例）
        if (typeof eventSystem !== 'undefined') {
            eventSystem.reset();
        }
        
        // 重置游戏管理器统计数据
        gameManager.resetStats();
        
        // 重置玩家状态
        if (this.player && this.player.stats) {
            this.player.stats.hunger = 100;
            this.player.stats.thirst = 100;
            this.player.stats.energy = 100;
        }
        
        // 重置玩家位置（使用 tileX/tileY 统一坐标属性）
        if (this.player) {
            const startX = this.mapWidth / 2 + 0.5;
            const startY = this.mapHeight / 2 + 0.5;
            if (typeof this.player.setPosition === 'function') {
                this.player.setPosition(startX, startY);
            } else {
                this.player.tileX = startX;
                this.player.tileY = startY;
                if (this.player.sprite) {
                    this.player.sprite.x = startX * this.tileSize;
                    this.player.sprite.y = startY * this.tileSize;
                }
            }
        }
        
        if (this.gameMap && typeof this.gameMap.clearHighlightedTile === 'function') {
            this.gameMap.clearHighlightedTile();
        }
        
        // 重置背包
        if (this.player) {
            if (typeof this.player.clearInventory === 'function') {
                this.player.clearInventory();
            } else if (this.player.inventory) {
                this.player.inventory = {};
            }
        }
    }

    /**
     * 退出场景时的回调
     * 隐藏 HUD，清理事件监听
     * @protected
     */
    _onExit() {
        if (this.hud && this.hud.hide) {
            this.hud.hide();
        }
        
        if (this.app && this.app.renderer && this._onClick) {
            this.app.renderer.view.removeEventListener('click', this._onClick);
            this._onClick = null;
        }
    }

    /**
     * 更新回调
     * 游戏主循环逻辑
     * @param {number} dt - 帧间隔时间（秒），由 main.js 从 PIXI delta 转换而来
     * @protected
     */
    _onUpdate(dt) {
        
        // 1. 更新时间系统
        this._updateTimeSystem(dt);
        
        // 2. 更新生存系统
        this._updateSurvivalSystem(dt);
        
        // 3. 更新玩家
        this._updatePlayer(dt);
        
        // 4. 更新摄像机
        this._updateCamera(dt);
        
        // 5. 更新事件系统
        this._updateEventSystem();
        
        // 6. 更新 HUD
        this._updateHUD();
        
        // 7. 检查游戏结束
        this._checkGameEnd();
    }

    /**
     * 更新时间系统
     * @param {number} dt - 时间增量（秒）
     * @private
     */
    _updateTimeSystem(dt) {
        if (typeof timeSystem !== 'undefined') {
            // 使用全局单例 timeSystem
            timeSystem.update(dt);
            this._updateNightOverlay(timeSystem.getHourOfDay());
            // 从 gameManager 获取统计数据
            this.stats.survivalTime = gameManager.getStats().survivalTime;
        }
    }

    /**
     * 更新生存系统
     * @param {number} dt - 时间增量（秒）
     * @private
     */
    _updateSurvivalSystem(dt) {
        if (typeof survivalSystem !== 'undefined') {
            // 使用全局单例 survivalSystem
            survivalSystem.update(dt);
        }
    }

    /**
     * 更新玩家
     * @param {number} dt - 时间增量（秒）
     * @private
     */
    _updatePlayer(dt) {
        if (!this.player) return;
        
        const wasMoving = this.player.isMoving && this.player.isMoving();
        
        if (typeof this.player.update === 'function') {
            this.player.update(dt, inputManager, this.gameMap);
        } else {
            this._simplePlayerMove(dt);
        }
        
        const isMoving = this.player.isMoving && this.player.isMoving();
        if (wasMoving && !isMoving && this.gameMap && this.gameMap._highlightedTile) {
            const playerTileX = Math.floor(this.player.tileX);
            const playerTileY = Math.floor(this.player.tileY);
            if (playerTileX === this.gameMap._highlightedTile.x && 
                playerTileY === this.gameMap._highlightedTile.y) {
                setTimeout(() => {
                    if (this.gameMap) {
                        this.gameMap.clearHighlightedTile();
                    }
                }, 200);
            }
        }
        
        if (this.player.sprite) {
            this.player.sprite.x = this.player.tileX * this.tileSize;
            this.player.sprite.y = this.player.tileY * this.tileSize;
        }
        
        if (this.gameMap && typeof this.gameMap.update === 'function') {
            this.gameMap.update(dt);
        }
    }

    /**
     * 简单的玩家移动（当 Player 类不可用时）
     * @param {number} dt - 时间增量（秒）
     * @private
     */
    _simplePlayerMove(dt) {
        const clickTarget = inputManager.getClickTarget();
        
        if (clickTarget) {
            this.player._targetPos = {
                x: Math.floor(clickTarget.x) + 0.5,
                y: Math.floor(clickTarget.y) + 0.5
            };
            inputManager.clearClickTarget();
        }

        if (this.player._targetPos) {
            const dx = this.player._targetPos.x - this.player.tileX;
            const dy = this.player._targetPos.y - this.player.tileY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 0.05) {
                this.player.tileX = this.player._targetPos.x;
                this.player.tileY = this.player._targetPos.y;
                this.player._targetPos = null;
                return;
            }

            const speed = this.player.speed || 3;
            const moveSpeed = speed * dt;

            if (dist <= moveSpeed) {
                this.player.tileX = this.player._targetPos.x;
                this.player.tileY = this.player._targetPos.y;
                this.player._targetPos = null;
            } else {
                const vx = (dx / dist) * moveSpeed;
                const vy = (dy / dist) * moveSpeed;

                const newX = this.player.tileX + vx;
                const newY = this.player.tileY + vy;

                if (this.gameMap && typeof this.gameMap.isWalkable === 'function') {
                    if (this.gameMap.isWalkable(newX, this.player.tileY)) {
                        this.player.tileX = newX;
                    }
                    if (this.gameMap.isWalkable(this.player.tileX, newY)) {
                        this.player.tileY = newY;
                    }
                } else {
                    if (newX > 1 && newX < this.mapWidth - 1) {
                        this.player.tileX = newX;
                    }
                    if (newY > 1 && newY < this.mapHeight - 1) {
                        this.player.tileY = newY;
                    }
                }
            }
            return;
        }

        let dx = 0, dy = 0;
        
        if (inputManager.isKeyDown('KeyW') || inputManager.isKeyDown('ArrowUp')) dy -= 1;
        if (inputManager.isKeyDown('KeyS') || inputManager.isKeyDown('ArrowDown')) dy += 1;
        if (inputManager.isKeyDown('KeyA') || inputManager.isKeyDown('ArrowLeft')) dx -= 1;
        if (inputManager.isKeyDown('KeyD') || inputManager.isKeyDown('ArrowRight')) dx += 1;
        
        // 归一化
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        
        const speed = this.player.speed || 3;
        const newX = this.player.tileX + dx * speed * dt;
        const newY = this.player.tileY + dy * speed * dt;
        
        // 边界检测（使用 gameMap 的 isWalkable 方法，如果可用）
        if (this.gameMap && typeof this.gameMap.isWalkable === 'function') {
            if (this.gameMap.isWalkable(newX, this.player.tileY)) {
                this.player.tileX = newX;
            }
            if (this.gameMap.isWalkable(this.player.tileX, newY)) {
                this.player.tileY = newY;
            }
        } else {
            // 简单边界检测
            if (newX > 1 && newX < this.mapWidth - 1) {
                this.player.tileX = newX;
            }
            if (newY > 1 && newY < this.mapHeight - 1) {
                this.player.tileY = newY;
            }
        }
    }

    /**
     * 更新摄像机
     * @param {number} dt - 时间增量（秒）
     * @private
     */
    _updateCamera(dt) {
        if (this.camera && typeof this.camera.update === 'function') {
            this.camera.update(dt);
        }
    }

    /**
     * 更新事件系统
     * @private
     */
    _updateEventSystem() {
        if (typeof eventSystem !== 'undefined' && typeof timeSystem !== 'undefined') {
            // 使用全局单例 eventSystem，传入当前游戏时间
            eventSystem.update(timeSystem.gameTime);
        }
    }

    /**
     * 更新 HUD
     * @private
     */
    _updateHUD() {
        if (this.hud && typeof this.hud.update === 'function') {
            this.hud.update();
        }
    }

    /**
     * 检查游戏结束条件
     * 胜利：存活100小时
     * 失败：饥饿或口渴归零
     * @private
     */
    _checkGameEnd() {
        let isVictory = false;
        let isGameOver = false;
        
        // 检查胜利条件（使用全局 timeSystem）
        if (typeof timeSystem !== 'undefined') {
            isVictory = timeSystem.isVictory();
        }
        
        // 检查失败条件（使用全局 gameManager）
        if (gameManager.isGameOver()) {
            isGameOver = true;
        } else if (this.player && this.player.stats) {
            isGameOver = this.player.stats.hunger <= 0 || this.player.stats.thirst <= 0;
        }
        
        if (isVictory || isGameOver) {
            // 从 gameManager 获取统计数据，并映射字段名保持兼容
            const gmStats = gameManager.getStats();
            const gameResult = {
                victory: isVictory,
                stats: {
                    survivalTime: gmStats.survivalTime || 0,
                    resourcesCollected: gmStats.totalResourcesCollected || 0,
                    itemsCrafted: gmStats.totalItemsCrafted || 0
                },
                finalStats: this.player ? { ...this.player.stats } : null
            };
            // 存储到 window 上供 EndScene 使用
            window.gameResult = gameResult;
            
            // 切换到结算场景
            this.changeScene('end');
        }
    }
}

window.GameScene = GameScene;

})();
