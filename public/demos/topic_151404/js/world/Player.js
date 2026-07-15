/**
 * Player - 玩家角色类
 * 继承 PIXI.Container，负责玩家角色的显示、移动、背包和生存数值
 * 
 * 功能特性：
 * - 鼠标点击移动控制
 * - 自动拾取附近资源
 * - 地形碰撞检测
 * - 背包物品管理
 * - 生存数值（饥饿、口渴、体力）
 * - 像素风格角色绘制
 * - 简单的行走动画
 * 
 * 坐标系统：
 * - 使用格子坐标（支持小数）
 * - 每格32像素
 * - 角色位置以格子中心为基准
 */

(function() {

class Player extends PIXI.Container {
    /**
     * 构造函数
     * @param {number} startX - 初始x坐标（格子）
     * @param {number} startY - 初始y坐标（格子）
     */
    constructor(startX = 30, startY = 25) {
        super();

        // ============== 位置与移动 ==============
        this.tileX = startX;        // 格子x坐标
        this.tileY = startY;        // 格子y坐标
        this.tileSize = 32;         // 每格像素大小
        this.speed = 14;            // 移动速度（格子/秒）
        this.facing = 'down';       // 朝向：up/down/left/right

        // 移动状态
        this._isMoving = false;     // 是否正在移动
        this._moveTime = 0;         // 移动动画时间
        
        // 鼠标点击移动目标
        this._targetPos = null;     // 目标格子坐标 {x, y}
        this._moveProgress = 0;     // 当前格子移动进度 0-1

        // ============== 背包系统 ==============
        this.inventory = {};        // 背包物品 {itemId: count}
        this.maxInventorySlots = 20;  // 最大背包格子数

        // ============== 生存数值 ==============
        this.stats = {
            hunger: 100,    // 饥饿值 0-100
            thirst: 100,    // 口渴值 0-100
            energy: 100     // 体力值 0-100
        };

        // 数值下降速率（每秒）
        this.statsDecay = {
            hunger: 0.15,
            thirst: 0.2,
            energy: 0.08
        };

        // ============== 显示相关 ==============
        this._characterSprite = null;   // 角色精灵
        this._shadowSprite = null;      // 阴影精灵

        // 初始化角色图形
        this._initGraphics();

        // 更新像素位置
        this._updatePixelPosition();
    }

    /**
     * 初始化角色图形
     * 使用 PIXI.Graphics 绘制像素风格角色
     */
    _initGraphics() {
        // 阴影
        this._shadowSprite = new PIXI.Graphics();
        this._shadowSprite.beginFill(0x000000, 0.3);
        this._shadowSprite.drawEllipse(0, 12, 10, 4);
        this._shadowSprite.endFill();
        this.addChild(this._shadowSprite);

        // 角色主体
        this._characterSprite = new PIXI.Container();
        this._drawCharacter(this._characterSprite);
        this.addChild(this._characterSprite);
    }

    /**
     * 绘制像素风格角色
     * @param {PIXI.Container} container - 容器
     */
    _drawCharacter(container) {
        const g = new PIXI.Graphics();

        // 角色尺寸
        const bodyW = 14;
        const bodyH = 16;
        const headSize = 10;

        // 身体
        g.beginFill(0x4a90d9);  // 蓝色上衣
        g.drawRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
        g.endFill();

        // 头部
        g.beginFill(0xffcc99);  // 肤色
        g.drawRect(-headSize / 2, -bodyH / 2 - headSize + 2, headSize, headSize);
        g.endFill();

        // 头发
        g.beginFill(0x5d4037);  // 棕色头发
        g.drawRect(-headSize / 2 - 1, -bodyH / 2 - headSize + 1, headSize + 2, 4);
        g.drawRect(-headSize / 2, -bodyH / 2 - headSize, headSize, 2);
        g.endFill();

        // 眼睛（根据朝向变化）
        this._drawEyes(g, headSize, bodyH);

        // 裤子
        g.beginFill(0x5d4037);  // 棕色裤子
        g.drawRect(-bodyW / 2, bodyH / 2 - 6, bodyW, 6);
        g.endFill();

        // 腿部
        g.beginFill(0x3e2723);  // 深棕色
        g.drawRect(-bodyW / 2 + 1, bodyH / 2, 5, 4);
        g.drawRect(bodyW / 2 - 6, bodyH / 2, 5, 4);
        g.endFill();

        // 手臂
        g.beginFill(0xffcc99);  // 肤色手臂
        g.drawRect(-bodyW / 2 - 3, -bodyH / 2 + 4, 3, 8);
        g.drawRect(bodyW / 2, -bodyH / 2 + 4, 3, 8);
        g.endFill();

        container.addChild(g);
    }

    /**
     * 绘制眼睛
     * @param {PIXI.Graphics} g - Graphics对象
     * @param {number} headSize - 头部大小
     * @param {number} bodyH - 身体高度
     */
    _drawEyes(g, headSize, bodyH) {
        const eyeY = -bodyH / 2 - headSize / 2;
        g.beginFill(0x333333);  // 黑色眼睛

        switch (this.facing) {
            case 'down':
                // 正面：左右眼
                g.drawRect(-3, eyeY - 1, 2, 2);
                g.drawRect(1, eyeY - 1, 2, 2);
                break;
            case 'up':
                // 背面：看不到眼睛，画后脑勺
                g.endFill();
                g.beginFill(0x5d4037);
                g.drawRect(-headSize / 2 + 1, -bodyH / 2 - headSize + 3, headSize - 2, 3);
                break;
            case 'left':
                // 左侧面
                g.drawRect(-2, eyeY - 1, 2, 2);
                break;
            case 'right':
                // 右侧面
                g.drawRect(0, eyeY - 1, 2, 2);
                break;
        }
        g.endFill();
    }

    /**
     * 更新像素位置
     * 将格子坐标转换为像素坐标
     */
    _updatePixelPosition() {
        this.x = this.tileX * this.tileSize;
        this.y = this.tileY * this.tileSize;
    }

    /**
     * 每帧更新
     * @param {number} delta - 帧时间增量（秒）
     * @param {object} input - 输入管理器
     * @param {GameMap} gameMap - 地图对象
     */
    update(delta, input, gameMap) {
        // 更新生存数值
        this._updateStats(delta);

        // 处理移动输入
        this._handleMovement(delta, input, gameMap);

        // 处理交互输入（拾取资源）
        this._handleInteraction(input, gameMap);

        // 更新行走动画
        this._updateAnimation(delta);

        // 更新像素位置
        this._updatePixelPosition();
    }

    /**
     * 更新生存数值
     * @param {number} delta - 时间增量（秒）
     */
    _updateStats(delta) {
        // 数值自然下降
        this.stats.hunger = Math.max(0, this.stats.hunger - this.statsDecay.hunger * delta);
        this.stats.thirst = Math.max(0, this.stats.thirst - this.statsDecay.thirst * delta);

        // 体力：移动时消耗更多，静止时缓慢恢复
        if (this._isMoving) {
            this.stats.energy = Math.max(0, this.stats.energy - this.statsDecay.energy * 2 * delta);
        } else {
            this.stats.energy = Math.min(100, this.stats.energy + this.statsDecay.energy * 0.3 * delta);
        }
    }

    /**
     * 处理移动输入
     * 实现鼠标点击移动：点击地图位置，玩家自动移动到目标点
     * @param {number} delta - 时间增量
     * @param {object} input - 输入管理器
     * @param {GameMap} gameMap - 地图对象
     */
    _handleMovement(delta, input, gameMap) {
        if (!input) return;

        const clickTarget = input.getClickTarget();
        
        if (clickTarget) {
            this._targetPos = {
                x: Math.floor(clickTarget.x) + 0.5,
                y: Math.floor(clickTarget.y) + 0.5
            };
            input.clearClickTarget();
        }

        if (!this._targetPos) {
            this._isMoving = false;
            return;
        }

        const dx = this._targetPos.x - this.tileX;
        const dy = this._targetPos.y - this.tileY;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.05) {
            this.tileX = this._targetPos.x;
            this.tileY = this._targetPos.y;
            this._targetPos = null;
            this._isMoving = false;
            return;
        }

        const moveSpeed = this.speed * delta * this._getSpeedModifier();

        if (dist <= moveSpeed) {
            this.tileX = this._targetPos.x;
            this.tileY = this._targetPos.y;
            this._targetPos = null;
        } else {
            const vx = (dx / dist) * moveSpeed;
            const vy = (dy / dist) * moveSpeed;

            const newX = this.tileX + vx;
            const newY = this.tileY + vy;

            if (gameMap && gameMap.isWalkable(newX, this.tileY)) {
                this.tileX = newX;
            }
            if (gameMap && gameMap.isWalkable(this.tileX, newY)) {
                this.tileY = newY;
            }
        }

        this._updateFacing(dx, dy);
        this._isMoving = true;
    }

    /**
     * 根据移动方向更新朝向
     * @param {number} dx - x方向增量
     * @param {number} dy - y方向增量
     */
    _updateFacing(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            this.facing = dy > 0 ? 'down' : 'up';
        }
        this._updateFacingVisual();
    }

    /**
     * 获取速度修正系数（基于体力）
     * @returns {number} 速度系数 0.5-1.0
     */
    _getSpeedModifier() {
        const energy = this.stats.energy;
        if (energy < 30) {
            // 体力不足时速度减慢
            return 0.5 + (energy / 30) * 0.4;
        }
        return 1.0;
    }

    /**
     * 处理交互输入（拾取资源）
     * 当玩家靠近资源时自动拾取
     * @param {object} input - 输入管理器
     * @param {GameMap} gameMap - 地图对象
     */
    _handleInteraction(input, gameMap) {
        if (!input || !gameMap) return;

        const resourcesNear = gameMap.getResourcesNear(this.tileX, this.tileY, 1.2);
        
        if (resourcesNear.length === 0) return;

        const closest = resourcesNear.reduce((prev, curr) => {
            const prevDist = Math.sqrt(Math.pow(prev.tileX - this.tileX, 2) + Math.pow(prev.tileY - this.tileY, 2));
            const currDist = Math.sqrt(Math.pow(curr.tileX - this.tileX, 2) + Math.pow(curr.tileY - this.tileY, 2));
            return currDist < prevDist ? curr : prev;
        });

        this._collectResource(closest, gameMap);
    }

    /**
     * 拾取资源并添加到背包
     * @param {Resource} resource - 要拾取的资源对象
     * @param {GameMap} gameMap - 地图对象
     */
    _collectResource(resource, gameMap) {
        // 添加到背包
        if (this.inventory[resource.type]) {
            this.inventory[resource.type]++;
        } else {
            this.inventory[resource.type] = 1;
        }

        // 移除地图上的资源
        gameMap.removeResource(resource);

        // 更新游戏统计
        if (typeof gameManager !== 'undefined') {
            gameManager.addResourceCollected();
            if (resource.isDrift) {
                gameManager.addDriftItemCollected();
            }
        }

        // 显示拾取提示
        this._showCollectMessage(resource.getName());
    }

    /**
     * 显示拾取提示信息
     * @param {string} itemName - 物品名称
     */
    _showCollectMessage(itemName) {
        if (typeof hud !== 'undefined' && hud.showHint) {
            hud.showHint(`拾取了 ${itemName}`, 1500);
        } else {
            console.log(`拾取了 ${itemName}`);
        }
    }

    /**
     * 更新朝向视觉效果
     */
    _updateFacingVisual() {
        // 重新绘制角色以更新朝向
        if (this._characterSprite) {
            this._characterSprite.removeChildren();
            this._drawCharacter(this._characterSprite);
        }
    }

    /**
     * 更新行走动画
     * @param {number} delta - 时间增量
     */
    _updateAnimation(delta) {
        if (this._isMoving) {
            this._moveTime += delta;
            // 上下轻微弹跳
            const bounce = Math.sin(this._moveTime * 12) * 1.5;
            this._characterSprite.y = bounce;

            // 阴影大小随弹跳变化
            const scale = 1 - Math.abs(bounce) * 0.03;
            this._shadowSprite.scale.set(scale, scale);
        } else {
            // 静止时缓慢复位
            this._characterSprite.y = 0;
            this._shadowSprite.scale.set(1, 1);
            this._moveTime = 0;
        }
    }

    // ============== 背包系统方法 ==============

    /**
     * 添加物品到背包
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     * @returns {boolean} 是否添加成功
     */
    addItem(itemId, count = 1) {
        // 检查背包是否已满（不同物品占不同格子）
        const currentSlots = Object.keys(this.inventory).length;
        if (!this.inventory[itemId] && currentSlots >= this.maxInventorySlots) {
            return false;  // 背包已满
        }

        if (this.inventory[itemId]) {
            this.inventory[itemId] += count;
        } else {
            this.inventory[itemId] = count;
        }
        return true;
    }

    /**
     * 从背包移除物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     * @returns {boolean} 是否移除成功
     */
    removeItem(itemId, count = 1) {
        if (!this.hasItem(itemId, count)) return false;

        this.inventory[itemId] -= count;
        if (this.inventory[itemId] <= 0) {
            delete this.inventory[itemId];
        }
        return true;
    }

    /**
     * 检查是否有足够物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 需要的数量
     * @returns {boolean} 是否有足够物品
     */
    hasItem(itemId, count = 1) {
        return this.inventory[itemId] !== undefined && this.inventory[itemId] >= count;
    }

    /**
     * 获取物品数量
     * @param {string} itemId - 物品ID
     * @returns {number} 物品数量
     */
    getItemCount(itemId) {
        return this.inventory[itemId] || 0;
    }

    /**
     * 获取背包中所有物品
     * @returns {{itemId: string, count: number}[]} 物品列表
     */
    getAllItems() {
        const items = [];
        for (const [itemId, count] of Object.entries(this.inventory)) {
            items.push({ itemId, count });
        }
        return items;
    }

    /**
     * 清空背包
     */
    clearInventory() {
        this.inventory = {};
    }

    // ============== 生存数值方法 ==============

    /**
     * 恢复饥饿值
     * @param {number} amount - 恢复量
     */
    restoreHunger(amount) {
        this.stats.hunger = Math.min(100, this.stats.hunger + amount);
    }

    /**
     * 恢复口渴值
     * @param {number} amount - 恢复量
     */
    restoreThirst(amount) {
        this.stats.thirst = Math.min(100, this.stats.thirst + amount);
    }

    /**
     * 恢复体力
     * @param {number} amount - 恢复量
     */
    restoreEnergy(amount) {
        this.stats.energy = Math.min(100, this.stats.energy + amount);
    }

    /**
     * 消耗体力
     * @param {number} amount - 消耗量
     */
    consumeEnergy(amount) {
        this.stats.energy = Math.max(0, this.stats.energy - amount);
    }

    /**
     * 检查是否游戏结束（饥饿或口渴为0）
     * @returns {boolean} 是否游戏结束
     */
    isGameOver() {
        return this.stats.hunger <= 0 || this.stats.thirst <= 0;
    }

    /**
     * 获取生存状态描述
     * @returns {string} 状态描述
     */
    getStatusDescription() {
        const { hunger, thirst, energy } = this.stats;
        const statuses = [];

        if (hunger < 20) statuses.push('非常饥饿');
        else if (hunger < 50) statuses.push('有点饿');

        if (thirst < 20) statuses.push('非常口渴');
        else if (thirst < 50) statuses.push('有点渴');

        if (energy < 20) statuses.push('精疲力竭');
        else if (energy < 50) statuses.push('有点累');

        return statuses.length > 0 ? statuses.join('、') : '状态良好';
    }

    // ============== 位置相关方法 ==============

    /**
     * 设置位置
     * @param {number} x - 格子x坐标
     * @param {number} y - 格子y坐标
     */
    setPosition(x, y) {
        this.tileX = x;
        this.tileY = y;
        this._updatePixelPosition();
    }

    /**
     * 获取格子坐标
     * @returns {{x: number, y: number}} 格子坐标
     */
    getTilePosition() {
        return {
            x: Math.floor(this.tileX),
            y: Math.floor(this.tileY)
        };
    }

    /**
     * 检查是否在移动中
     * @returns {boolean} 是否在移动
     */
    isMoving() {
        return this._isMoving;
    }

    /**
     * 获取移动速度（含体力修正）
     * @returns {number} 当前速度
     */
    getCurrentSpeed() {
        return this.speed * this._getSpeedModifier();
    }

    /**
     * 销毁玩家对象
     */
    destroy() {
        if (this._characterSprite) {
            this._characterSprite.destroy({ children: true });
            this._characterSprite = null;
        }
        if (this._shadowSprite) {
            this._shadowSprite.destroy();
            this._shadowSprite = null;
        }
        super.destroy({ children: true });
    }
}

// 导出到全局作用域
window.Player = Player;

})();
