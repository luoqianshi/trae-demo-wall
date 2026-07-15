/**
 * GameMap - 游戏地图类
 * 继承 PIXI.Container，负责地图生成、地形渲染和资源管理
 * 
 * 地图规格：60 x 50 格 = 3000 格
 * 每格像素大小：32px
 * 
 * 地形类型：
 * - 深海 (DEEP_WATER)：不可通行，空气墙
 * - 浅海 (WATER)：海边1-2格，可进入
 * - 沙滩 (SAND)：岛屿边缘，开局区域
 * - 草地 (GRASS)：基础地形
 * - 森林 (FOREST)：有树木和果实
 * - 岩石 (ROCK)：石块分布区
 */

(function() {

// 从全局常量获取地形类型定义（与 Constants.js 保持一致）
const TERRAIN_TYPES = window.Constants.TERRAIN_TYPES;
const TERRAIN_NAMES = window.Constants.TERRAIN_NAMES;

// 地形颜色配置（像素风格）
const TERRAIN_COLORS = {
    [TERRAIN_TYPES.SAND]: 0xf5deb3,         // 沙滩色
    [TERRAIN_TYPES.GRASS]: 0x7cb342,        // 草地绿
    [TERRAIN_TYPES.FOREST]: 0x2e7d32,       // 森林深绿
    [TERRAIN_TYPES.ROCK]: 0x9e9e9e,         // 岩石灰
    [TERRAIN_TYPES.WATER]: 0x4a90b8,        // 浅海蓝
    [TERRAIN_TYPES.DEEP_WATER]: 0x1a4d6e    // 深海蓝
};

class GameMap extends PIXI.Container {
    /**
     * 构造函数
     * @param {number} width - 地图宽度（格子数），默认60
     * @param {number} height - 地图高度（格子数），默认50
     * @param {number} tileSize - 每格像素大小，默认32
     */
    constructor(width = 60, height = 50, tileSize = 32) {
        super();

        // 地图基本属性
        this.mapWidth = width;           // 地图宽度（格子数）
        this.mapHeight = height;         // 地图高度（格子数）
        this.tileSize = tileSize;        // 每格像素大小

        // 地形数据二维数组 [y][x]
        this.tiles = [];

        // 资源列表
        this.resources = [];

        // 显示容器分层
        this.tileContainer = new PIXI.Container();      // 地形瓦片层
        this.gridContainer = new PIXI.Container();      // 网格线层
        this.highlightContainer = new PIXI.Container(); // 选中高亮层
        this.resourceContainer = new PIXI.Container();  // 资源层
        this.addChild(this.tileContainer, this.gridContainer, this.highlightContainer, this.resourceContainer);

        // 使用单一 Graphics 对象绘制所有瓦片，避免 3000 个 draw call 导致卡顿
        this.tileGraphics = new PIXI.Graphics();
        this.tileContainer.addChild(this.tileGraphics);

        // 网格线 Graphics
        this.gridGraphics = new PIXI.Graphics();
        this.gridContainer.addChild(this.gridGraphics);

        // 选中高亮 Graphics
        this.highlightGraphics = new PIXI.Graphics();
        this.highlightContainer.addChild(this.highlightGraphics);

        // 选中格子位置
        this._highlightedTile = null;
        this._highlightAnimTime = 0;

        // 生成地图
        this._generateMap();

        // 绘制网格线
        this._drawGrid();

        // 生成初始资源
        this._spawnInitialResources();
    }

    /**
     * 生成地图地形
     * 使用简化的柏林噪声+圆形岛屿算法生成自然的岛屿地形
     */
    _generateMap() {
        const centerX = this.mapWidth / 2;
        const centerY = this.mapHeight / 2;
        const maxDist = Math.min(centerX, centerY);

        // 预生成噪声扰动值，使地形更自然
        const noiseGrid = this._generateNoiseGrid();

        // 逐格计算地形类型
        for (let y = 0; y < this.mapHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // 计算到中心的距离比例
                const dx = x - centerX;
                const dy = y - centerY;
                const distFromCenter = Math.sqrt(dx * dx + dy * dy);
                let distRatio = distFromCenter / maxDist;

                // 添加噪声扰动
                const noiseVal = noiseGrid[y][x];
                distRatio += noiseVal * 0.25;

                // 根据距离比例确定地形类型
                let terrain;
                if (distRatio > 0.95) {
                    terrain = TERRAIN_TYPES.DEEP_WATER;    // 深海
                } else if (distRatio > 0.82) {
                    terrain = TERRAIN_TYPES.WATER;         // 浅海
                } else if (distRatio > 0.72) {
                    terrain = TERRAIN_TYPES.SAND;          // 沙滩
                } else if (distRatio > 0.45) {
                    // 草地和森林交错分布
                    terrain = noiseGrid[y][x] > 0.3 ? TERRAIN_TYPES.FOREST : TERRAIN_TYPES.GRASS;
                } else {
                    // 中心区域以岩石和森林为主
                    terrain = noiseGrid[y][x] > 0.5 ? TERRAIN_TYPES.ROCK : TERRAIN_TYPES.FOREST;
                }

                this.tiles[y][x] = terrain;
                this._drawTile(x, y, terrain);
            }
        }
    }

    /**
     * 生成噪声网格
     * 使用简单的值噪声算法，为地形添加自然的随机变化
     * @returns {number[][]} 噪声值二维数组，范围 [-1, 1]
     */
    _generateNoiseGrid() {
        const grid = [];
        const scale = 8;  // 噪声缩放系数，值越大地形越平滑

        for (let y = 0; y < this.mapHeight; y++) {
            grid[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // 使用多层噪声叠加（分形噪声简化版）
                let noise = 0;
                noise += this._valueNoise(x / scale, y / scale);
                noise += this._valueNoise(x / (scale / 2), y / (scale / 2)) * 0.5;
                noise += this._valueNoise(x / (scale / 4), y / (scale / 4)) * 0.25;
                noise = (noise / 1.75) * 2 - 1;  // 归一化到 [-1, 1]
                grid[y][x] = noise;
            }
        }
        return grid;
    }

    /**
     * 简单的值噪声函数
     * 基于伪随机数生成连续的噪声值
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {number} 噪声值 [0, 1]
     */
    _valueNoise(x, y) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        // 四个角的随机值
        const v00 = this._pseudoRandom(x0, y0);
        const v10 = this._pseudoRandom(x1, y0);
        const v01 = this._pseudoRandom(x0, y1);
        const v11 = this._pseudoRandom(x1, y1);

        // 双线性插值
        const sx = x - x0;
        const sy = y - y0;
        const vx0 = v00 * (1 - sx) + v10 * sx;
        const vx1 = v01 * (1 - sx) + v11 * sx;
        const vy = vx0 * (1 - sy) + vx1 * sy;

        return vy;
    }

    /**
     * 伪随机数生成器
     * 相同的(x,y)总是返回相同的值，保证噪声的连贯性
     * @param {number} x 
     * @param {number} y 
     * @returns {number} 随机值 [0, 1]
     */
    _pseudoRandom(x, y) {
        const seed = x * 374761393 + y * 668265263;
        const n = (seed ^ (seed >> 13)) * 1274126177;
        return ((n ^ (n >> 16)) >>> 0) / 4294967295;
    }

    /**
     * 绘制网格线
     * 为每个格子绘制边框，清晰展示格子划分
     */
    _drawGrid() {
        const g = this.gridGraphics;
        const size = this.tileSize;
        const width = this.mapWidth * size;
        const height = this.mapHeight * size;

        g.lineStyle(1, 0x000000, 0.15);

        // 绘制垂直线
        for (let x = 0; x <= this.mapWidth; x++) {
            const px = x * size;
            g.moveTo(px, 0);
            g.lineTo(px, height);
        }

        // 绘制水平线
        for (let y = 0; y <= this.mapHeight; y++) {
            const py = y * size;
            g.moveTo(0, py);
            g.lineTo(width, py);
        }
    }

    /**
     * 设置选中高亮的格子
     * @param {number} tileX - 格子x坐标
     * @param {number} tileY - 格子y坐标
     */
    setHighlightedTile(tileX, tileY) {
        if (tileX === null || tileY === null) {
            this._highlightedTile = null;
            this.highlightGraphics.clear();
            return;
        }
        this._highlightedTile = { x: tileX, y: tileY };
        this._highlightAnimTime = 0;
        this._updateHighlight();
    }

    /**
     * 清除选中高亮
     */
    clearHighlightedTile() {
        this.setHighlightedTile(null, null);
    }

    /**
     * 更新高亮显示
     */
    _updateHighlight() {
        if (!this._highlightedTile) return;

        const g = this.highlightGraphics;
        const px = this._highlightedTile.x * this.tileSize;
        const py = this._highlightedTile.y * this.tileSize;
        const size = this.tileSize;

        g.clear();

        // 外边框（脉动效果）
        const pulse = 0.6 + Math.sin(this._highlightAnimTime * 4) * 0.2;
        g.lineStyle(3, 0xffffff, pulse);
        g.drawRect(px + 1, py + 1, size - 2, size - 2);

        // 内部半透明填充
        g.beginFill(0xffffff, 0.15);
        g.drawRect(px + 2, py + 2, size - 4, size - 4);
        g.endFill();

        // 四角装饰点
        g.beginFill(0xffffff, 0.8);
        const dotSize = 3;
        g.drawRect(px + 2, py + 2, dotSize, dotSize);
        g.drawRect(px + size - dotSize - 2, py + 2, dotSize, dotSize);
        g.drawRect(px + 2, py + size - dotSize - 2, dotSize, dotSize);
        g.drawRect(px + size - dotSize - 2, py + size - dotSize - 2, dotSize, dotSize);
        g.endFill();
    }

    /**
     * 绘制单个地形瓦片
     * 使用 PIXI.Graphics 绘制像素风格的瓦片
     * @param {number} x - 格子x坐标
     * @param {number} y - 格子y坐标
     * @param {number} terrain - 地形类型
     */
    _drawTile(x, y, terrain) {
        const g = this.tileGraphics;  // 使用共享的 Graphics 对象，避免每格创建独立对象
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const size = this.tileSize;

        // 基础填充色
        const baseColor = TERRAIN_COLORS[terrain];
        g.beginFill(baseColor);
        g.drawRect(px, py, size, size);
        g.endFill();

        // 添加地形细节（像素风格的纹理变化）
        this._drawTerrainDetails(g, x, y, terrain, px, py, size);
    }

    /**
     * 绘制地形细节纹理
     * 为不同地形添加特征性的像素点缀
     * @param {PIXI.Graphics} g - Graphics对象
     * @param {number} tileX - 格子x坐标
     * @param {number} tileY - 格子y坐标
     * @param {number} terrain - 地形类型
     * @param {number} px - 像素x坐标
     * @param {number} py - 像素y坐标
     * @param {number} size - 瓦片大小
     */
    _drawTerrainDetails(g, tileX, tileY, terrain, px, py, size) {
        const rand = this._pseudoRandom(tileX * 7, tileY * 13);

        switch (terrain) {
            case TERRAIN_TYPES.SAND:
                // 沙滩：添加深色沙粒斑点
                if (rand > 0.6) {
                    g.beginFill(0xd4b88a);
                    g.drawRect(px + 4 + Math.floor(rand * 20), py + 8 + Math.floor(rand * 16), 2, 2);
                    g.drawRect(px + 12 + Math.floor(rand * 12), py + 20 + Math.floor(rand * 8), 2, 2);
                    g.endFill();
                }
                // 贝壳点缀
                if (rand > 0.85) {
                    g.beginFill(0xfff8dc);
                    g.drawRect(px + 10, py + 12, 4, 3);
                    g.endFill();
                }
                break;

            case TERRAIN_TYPES.GRASS:
                // 草地：添加深绿色草丛
                if (rand > 0.4) {
                    g.beginFill(0x558b2f);
                    g.drawRect(px + 3 + Math.floor(rand * 24), py + 4 + Math.floor(rand * 20), 2, 4);
                    g.drawRect(px + 16 + Math.floor(rand * 10), py + 18 + Math.floor(rand * 10), 2, 4);
                    g.endFill();
                }
                // 小花点缀
                if (rand > 0.8) {
                    g.beginFill(0xffeb3b);
                    g.drawRect(px + 12, py + 14, 3, 3);
                    g.endFill();
                }
                break;

            case TERRAIN_TYPES.FOREST:
                // 森林：绘制树木
                if (rand > 0.3) {
                    // 树干
                    g.beginFill(0x5d4037);
                    g.drawRect(px + 13, py + 18, 6, 10);
                    g.endFill();
                    // 树冠
                    g.beginFill(0x1b5e20);
                    g.drawRect(px + 6, py + 4, 20, 16);
                    g.endFill();
                    // 树冠高光
                    g.beginFill(0x388e3c);
                    g.drawRect(px + 8, py + 6, 6, 6);
                    g.endFill();
                }
                break;

            case TERRAIN_TYPES.ROCK:
                // 岩石区：绘制石块
                if (rand > 0.3) {
                    g.beginFill(0x757575);
                    g.drawRect(px + 6, py + 10, 20, 16);
                    g.endFill();
                    // 岩石高光
                    g.beginFill(0xbdbdbd);
                    g.drawRect(px + 8, py + 12, 8, 6);
                    g.endFill();
                    // 岩石阴影
                    g.beginFill(0x616161);
                    g.drawRect(px + 18, py + 20, 6, 4);
                    g.endFill();
                }
                // 小石子
                if (rand > 0.6) {
                    g.beginFill(0x9e9e9e);
                    g.drawRect(px + 2 + Math.floor(rand * 10), py + 24 + Math.floor(rand * 4), 3, 3);
                    g.endFill();
                }
                break;

            case TERRAIN_TYPES.WATER:
                // 浅海：水波纹
                if (rand > 0.5) {
                    g.beginFill(0x6bb3d9, 0.6);
                    g.drawRect(px + 2 + Math.floor(rand * 20), py + 10 + Math.floor(rand * 12), 8, 2);
                    g.drawRect(px + 16 + Math.floor(rand * 10), py + 20 + Math.floor(rand * 8), 6, 2);
                    g.endFill();
                }
                break;

            case TERRAIN_TYPES.DEEP_WATER:
                // 深海：少量波纹
                if (rand > 0.7) {
                    g.beginFill(0x2d6a8c, 0.5);
                    g.drawRect(px + 4 + Math.floor(rand * 20), py + 12 + Math.floor(rand * 10), 10, 2);
                    g.endFill();
                }
                break;
        }
    }

    /**
     * 生成初始资源
     * 在地图上随机分布各种资源
     */
    _spawnInitialResources() {
        const resourceTypes = [
            { type: 'branch', terrain: [TERRAIN_TYPES.GRASS, TERRAIN_TYPES.FOREST], count: 30, color: 0x8d6e63 },
            { type: 'wood', terrain: [TERRAIN_TYPES.FOREST], count: 20, color: 0x6d4c41 },
            { type: 'stone', terrain: [TERRAIN_TYPES.ROCK], count: 25, color: 0x757575 },
            { type: 'fruit', terrain: [TERRAIN_TYPES.FOREST, TERRAIN_TYPES.GRASS], count: 15, color: 0xe53935 },
            { type: 'coconut', terrain: [TERRAIN_TYPES.SAND], count: 8, color: 0x5d4037 },
            { type: 'shell', terrain: [TERRAIN_TYPES.SAND], count: 12, color: 0xfff8dc }
        ];

        for (const resConfig of resourceTypes) {
            for (let i = 0; i < resConfig.count; i++) {
                const pos = this._findRandomPosition(resConfig.terrain);
                if (pos) {
                    const resource = new Resource(resConfig.type, pos.x, pos.y, false);
                    this.resources.push(resource);
                    this.resourceContainer.addChild(resource);
                }
            }
        }
    }

    /**
     * 在指定地形上找一个随机位置
     * @param {number[]} terrainTypes - 可生成的地形类型数组
     * @returns {{x: number, y: number} | null} 格子坐标
     */
    _findRandomPosition(terrainTypes) {
        let attempts = 0;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            if (terrainTypes.includes(this.tiles[y][x])) {
                // 检查该位置是否已有资源
                const hasResource = this.resources.some(r =>
                    Math.floor(r.tileX) === x && Math.floor(r.tileY) === y
                );
                if (!hasResource) {
                    return { x: x + 0.5, y: y + 0.5 };
                }
            }
            attempts++;
        }
        return null;
    }

    /**
     * 判断指定位置是否可行走
     * 深海不可通行，其他地形均可进入
     * @param {number} x - 格子x坐标（支持小数）
     * @param {number} y - 格子y坐标（支持小数）
     * @returns {boolean} 是否可行走
     */
    isWalkable(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        // 边界检测
        if (tileX < 0 || tileX >= this.mapWidth) return false;
        if (tileY < 0 || tileY >= this.mapHeight) return false;

        // 深海不可通行
        return this.tiles[tileY][tileX] !== TERRAIN_TYPES.DEEP_WATER;
    }

    /**
     * 获取所有沙滩位置
     * 用于生成漂流物资等需要在海边的事件
     * @returns {{x: number, y: number}[]} 沙滩格子坐标数组
     */
    getBeachPositions() {
        const positions = [];
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.tiles[y][x] === TERRAIN_TYPES.SAND) {
                    positions.push({ x: x + 0.5, y: y + 0.5 });
                }
            }
        }
        return positions;
    }

    /**
     * 获取指定位置的地形类型
     * @param {number} x - 格子x坐标
     * @param {number} y - 格子y坐标
     * @returns {number | null} 地形类型
     */
    getTerrainAt(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        if (tileX < 0 || tileX >= this.mapWidth) return null;
        if (tileY < 0 || tileY >= this.mapHeight) return null;
        return this.tiles[tileY][tileX];
    }

    /**
     * 获取指定位置的地形名称
     * @param {number} x - 格子x坐标
     * @param {number} y - 格子y坐标
     * @returns {string} 地形名称
     */
    getTerrainName(x, y) {
        const terrain = this.getTerrainAt(x, y);
        if (terrain === null) return '未知';
        return TERRAIN_NAMES[terrain] || '未知';
    }

    /**
     * 获取指定范围内的资源
     * @param {number} x - 中心x坐标（格子）
     * @param {number} y - 中心y坐标（格子）
     * @param {number} radius - 搜索半径（格子）
     * @returns {Resource[]} 资源数组
     */
    getResourcesNear(x, y, radius = 1) {
        return this.resources.filter(r => {
            const dx = r.tileX - x;
            const dy = r.tileY - y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }

    /**
     * 移除资源
     * @param {Resource} resource - 要移除的资源对象
     */
    removeResource(resource) {
        const index = this.resources.indexOf(resource);
        if (index > -1) {
            this.resources.splice(index, 1);
            this.resourceContainer.removeChild(resource);
            resource.destroy();
        }
    }

    /**
     * 添加漂流物资
     * 在随机沙滩位置生成带闪烁效果的资源
     * @param {string} itemType - 物品类型
     * @returns {Resource | null} 生成的资源对象
     */
    addDriftItem(itemType) {
        const beachPositions = this.getBeachPositions();
        if (beachPositions.length === 0) return null;

        const pos = beachPositions[Math.floor(Math.random() * beachPositions.length)];
        const resource = new Resource(itemType, pos.x, pos.y, true);
        this.resources.push(resource);
        this.resourceContainer.addChild(resource);
        return resource;
    }

    /**
     * 更新地图中的资源动画
     * @param {number} delta - 帧时间增量（秒）
     */
    update(delta) {
        for (const resource of this.resources) {
            resource.update(delta);
        }

        if (this._highlightedTile) {
            this._highlightAnimTime += delta;
            this._updateHighlight();
        }
    }

    /**
     * 获取地图像素宽度
     * @returns {number} 像素宽度
     */
    getPixelWidth() {
        return this.mapWidth * this.tileSize;
    }

    /**
     * 获取地图像素高度
     * @returns {number} 像素高度
     */
    getPixelHeight() {
        return this.mapHeight * this.tileSize;
    }
}

// 导出到全局作用域
window.GameMap = GameMap;
window.TERRAIN_TYPES = TERRAIN_TYPES;
window.TERRAIN_COLORS = TERRAIN_COLORS;
window.TERRAIN_NAMES = TERRAIN_NAMES;

})();
