/**
 * Camera - 摄像机类
 * 负责实现摄像机跟随玩家移动的效果
 * 
 * 实现原理：
 * - 不直接移动摄像机，而是通过反向移动地图容器来实现摄像机效果
 * - 支持平滑跟随（缓动效果）
 * - 支持边界限制，防止摄像机移出地图范围
 * - 支持视口居中
 * 
 * 坐标系统：
 * - 游戏世界使用格子坐标
 * - 每格32像素
 * - 摄像机通过移动容器的 x/y 实现视角变化
 */

(function() {

class Camera {
    /**
     * 构造函数
     * @param {PIXI.Container} targetContainer - 要移动的容器（通常是地图容器）
     * @param {number} viewWidth - 视口宽度（像素）
     * @param {number} viewHeight - 视口高度（像素）
     * @param {number} tileSize - 每格像素大小，默认32
     */
    constructor(targetContainer, viewWidth, viewHeight, tileSize = 32) {
        // 目标容器（摄像机通过移动此容器实现视角变化）
        this.container = targetContainer;

        // 视口尺寸
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;

        // 格子大小
        this.tileSize = tileSize;

        // 摄像机位置（世界坐标，像素）
        this.x = 0;
        this.y = 0;

        // 跟随目标（通常是玩家）
        this._followTarget = null;

        // 是否启用平滑跟随
        this.smoothFollow = true;

        // 平滑系数（0-1，值越小跟随越慢越平滑）
        this.smoothFactor = 0.1;

        // 地图边界限制
        this._mapWidth = 0;       // 地图宽度（像素）
        this._mapHeight = 0;      // 地图高度（像素）
        this._boundToMap = true;  // 是否限制在地图范围内

        // 缩放
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.0;

        // 震动效果
        this._shakeTime = 0;
        this._shakeIntensity = 0;
        this._shakeX = 0;
        this._shakeY = 0;
    }

    /**
     * 设置跟随目标
     * @param {object} target - 跟随目标，需要有 tileX 和 tileY 属性（格子坐标）
     */
    follow(target) {
        this._followTarget = target;
        // 立即对齐到目标位置
        if (target) {
            this.x = target.tileX * this.tileSize;
            this.y = target.tileY * this.tileSize;
            this._applyPosition();
        }
    }

    /**
     * 设置地图边界
     * @param {number} mapWidth - 地图宽度（格子数）
     * @param {number} mapHeight - 地图高度（格子数）
     */
    setMapBounds(mapWidth, mapHeight) {
        this._mapWidth = mapWidth * this.tileSize;
        this._mapHeight = mapHeight * this.tileSize;
    }

    /**
     * 启用/禁用地图边界限制
     * @param {boolean} enabled 
     */
    setBoundsEnabled(enabled) {
        this._boundToMap = enabled;
    }

    /**
     * 设置缩放
     * @param {number} zoom - 缩放值
     */
    setZoom(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this._applyPosition();
    }

    /**
     * 放大
     * @param {number} delta - 变化量
     */
    zoomIn(delta = 0.1) {
        this.setZoom(this.zoom + delta);
    }

    /**
     * 缩小
     * @param {number} delta - 变化量
     */
    zoomOut(delta = 0.1) {
        this.setZoom(this.zoom - delta);
    }

    /**
     * 摄像机震动效果
     * @param {number} intensity - 震动强度（像素）
     * @param {number} duration - 持续时间（秒）
     */
    shake(intensity = 5, duration = 0.2) {
        this._shakeIntensity = intensity;
        this._shakeTime = duration;
    }

    /**
     * 每帧更新
     * @param {number} delta - 帧时间增量（秒）
     */
    update(delta) {
        // 更新震动
        this._updateShake(delta);

        // 跟随目标
        if (this._followTarget) {
            this._updateFollow(delta);
        }

        // 应用位置到容器
        this._applyPosition();
    }

    /**
     * 更新跟随逻辑
     * @param {number} delta - 时间增量
     */
    _updateFollow(delta) {
        if (!this._followTarget) return;

        // 目标位置（像素坐标）
        const targetX = this._followTarget.tileX * this.tileSize;
        const targetY = this._followTarget.tileY * this.tileSize;

        if (this.smoothFollow) {
            // 平滑跟随（线性插值）
            // 使用 delta 时间归一化，保证不同帧率下效果一致
            const t = 1 - Math.pow(1 - this.smoothFactor, delta * 60);
            this.x += (targetX - this.x) * t;
            this.y += (targetY - this.y) * t;
        } else {
            // 立即跟随
            this.x = targetX;
            this.y = targetY;
        }

        // 边界限制
        if (this._boundToMap && this._mapWidth > 0 && this._mapHeight > 0) {
            this._clampToBounds();
        }
    }

    /**
     * 将摄像机限制在地图边界内
     */
    _clampToBounds() {
        // 考虑缩放和视口大小
        const halfViewW = (this.viewWidth / 2) / this.zoom;
        const halfViewH = (this.viewHeight / 2) / this.zoom;

        // 最小/最大摄像机位置
        const minX = halfViewW;
        const minY = halfViewH;
        const maxX = this._mapWidth - halfViewW;
        const maxY = this._mapHeight - halfViewH;

        // 如果地图比视口小，居中显示
        if (this._mapWidth < this.viewWidth / this.zoom) {
            this.x = this._mapWidth / 2;
        } else {
            this.x = Math.max(minX, Math.min(maxX, this.x));
        }

        if (this._mapHeight < this.viewHeight / this.zoom) {
            this.y = this._mapHeight / 2;
        } else {
            this.y = Math.max(minY, Math.min(maxY, this.y));
        }
    }

    /**
     * 更新震动效果
     * @param {number} delta - 时间增量
     */
    _updateShake(delta) {
        if (this._shakeTime > 0) {
            this._shakeTime -= delta;
            if (this._shakeTime > 0) {
                // 随机震动偏移
                const t = this._shakeTime;
                const intensity = this._shakeIntensity * (t / Math.max(t, 0.001));
                this._shakeX = (Math.random() - 0.5) * intensity * 2;
                this._shakeY = (Math.random() - 0.5) * intensity * 2;
            } else {
                this._shakeX = 0;
                this._shakeY = 0;
            }
        }
    }

    /**
     * 应用摄像机位置到容器
     * 通过反向移动容器实现摄像机效果
     */
    _applyPosition() {
        if (!this.container) return;

        // 应用缩放
        this.container.scale.set(this.zoom);

        // 计算容器位置（摄像机居中 + 震动偏移）
        // 摄像机看向 (x, y)，所以容器要反向移动
        const containerX = -this.x * this.zoom + this.viewWidth / 2 + this._shakeX;
        const containerY = -this.y * this.zoom + this.viewHeight / 2 + this._shakeY;

        this.container.x = containerX;
        this.container.y = containerY;
    }

    /**
     * 直接设置摄像机位置（格子坐标）
     * @param {number} tileX - 格子x坐标
     * @param {number} tileY - 格子y坐标
     */
    setPosition(tileX, tileY) {
        this.x = tileX * this.tileSize;
        this.y = tileY * this.tileSize;
        this._applyPosition();
    }

    /**
     * 获取摄像机中心的格子坐标
     * @returns {{x: number, y: number}} 格子坐标
     */
    getTilePosition() {
        return {
            x: this.x / this.tileSize,
            y: this.y / this.tileSize
        };
    }

    /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界x坐标（像素）
     * @param {number} worldY - 世界y坐标（像素）
     * @returns {{x: number, y: number}} 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.x) * this.zoom + this.viewWidth / 2 + this._shakeX;
        const screenY = (worldY - this.y) * this.zoom + this.viewHeight / 2 + this._shakeY;
        return { x: screenX, y: screenY };
    }

    /**
     * 屏幕坐标转世界坐标
     * @param {number} screenX - 屏幕x坐标
     * @param {number} screenY - 屏幕y坐标
     * @returns {{x: number, y: number}} 世界坐标（像素）
     */
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.viewWidth / 2 - this._shakeX) / this.zoom + this.x;
        const worldY = (screenY - this.viewHeight / 2 - this._shakeY) / this.zoom + this.y;
        return { x: worldX, y: worldY };
    }

    /**
     * 屏幕坐标转格子坐标
     * @param {number} screenX - 屏幕x坐标
     * @param {number} screenY - 屏幕y坐标
     * @returns {{x: number, y: number}} 格子坐标
     */
    screenToTile(screenX, screenY) {
        const world = this.screenToWorld(screenX, screenY);
        return {
            x: world.x / this.tileSize,
            y: world.y / this.tileSize
        };
    }

    /**
     * 检查某个世界坐标是否在视口内
     * @param {number} worldX - 世界x坐标（像素）
     * @param {number} worldY - 世界y坐标（像素）
     * @param {number} margin - 外边距（像素）
     * @returns {boolean} 是否在视口内
     */
    isInView(worldX, worldY, margin = 0) {
        const screen = this.worldToScreen(worldX, worldY);
        return (
            screen.x >= -margin &&
            screen.x <= this.viewWidth + margin &&
            screen.y >= -margin &&
            screen.y <= this.viewHeight + margin
        );
    }

    /**
     * 获取视口内的格子范围
     * @returns {{startX: number, startY: number, endX: number, endY: number}} 格子范围
     */
    getVisibleTileRange() {
        const halfViewW = (this.viewWidth / 2) / this.zoom;
        const halfViewH = (this.viewHeight / 2) / this.zoom;

        const startX = Math.floor((this.x - halfViewW) / this.tileSize) - 1;
        const startY = Math.floor((this.y - halfViewH) / this.tileSize) - 1;
        const endX = Math.ceil((this.x + halfViewW) / this.tileSize) + 1;
        const endY = Math.ceil((this.y + halfViewH) / this.tileSize) + 1;

        return { startX, startY, endX, endY };
    }

    /**
     * 重置摄像机
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this._shakeTime = 0;
        this._shakeX = 0;
        this._shakeY = 0;
        this._followTarget = null;
        this._applyPosition();
    }

    /**
     * 销毁摄像机
     */
    destroy() {
        this.container = null;
        this._followTarget = null;
    }
}

// 导出到全局作用域
window.Camera = Camera;

})();
