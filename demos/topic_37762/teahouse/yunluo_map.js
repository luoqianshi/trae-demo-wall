var YunluoMap = (function() {
    'use strict';

    // ==================== 地形类型常量 ====================
    // 室外地形（主地图、探索区使用）
    var OT = {
        GRASS: 0, GRASS2: 1, WATER: 2, DEEPWATER: 3, PATH: 4,
        MOUNTAIN: 5, FOREST: 6, FIELD: 7, BRIDGE: 8, DOOR: 9, BUILDING: 10
    };

    // 室内地形（茶馆、三界室内地图使用）
    var IT = {
        FLOOR: 0, WALL: 1, COUNTER: 2, SEAT: 3, KITCHEN: 4,
        INDOOR_DOOR: 5, DECOR: 6, REALM_PORTAL: 11, INDOOR_WATER: 12
    };

    // 兼容旧代码：合并为一个T对象，但室内常量使用独立值避免冲突
    var T = {
        // 室外（值0-10）
        GRASS: OT.GRASS, GRASS2: OT.GRASS2, WATER: OT.WATER, DEEPWATER: OT.DEEPWATER,
        PATH: OT.PATH, MOUNTAIN: OT.MOUNTAIN, FOREST: OT.FOREST, FIELD: OT.FIELD,
        BRIDGE: OT.BRIDGE, DOOR: OT.DOOR, BUILDING: OT.BUILDING,
        // 室内（值0-6与室外重叠但场景不同，REALM_PORTAL=11独立值）
        FLOOR: IT.FLOOR, WALL: IT.WALL, COUNTER: IT.COUNTER, SEAT: IT.SEAT,
        KITCHEN: IT.KITCHEN, INDOOR_DOOR: IT.INDOOR_DOOR, DECOR: IT.DECOR,
        REALM_PORTAL: IT.REALM_PORTAL, INDOOR_WATER: IT.INDOOR_WATER
    };

    var WALKABLE = [0, 1, 4, 7, 8, 9];

    // ==================== 地点配置 ====================
    var LOCATIONS = [
        { id: 'teahouse',    name: '茶馆',     x: 25, y: 20, doorX: 24, doorY: 20, isIndoor: true,  emoji: '🏠', buildingType: 'teahouse' },
        { id: 'market',      name: '集市',     x: 15, y: 18, emoji: '🏪', buildingType: 'market' },
        { id: 'herb_garden', name: '百草堂',   x: 20, y: 12, emoji: '🌿', buildingType: 'herb' },
        { id: 'forge',       name: '铁匠铺',   x: 30, y: 15, emoji: '🔨', buildingType: 'forge' },
        { id: 'tavern',      name: '醉仙楼',   x: 12, y: 25, emoji: '🍶', buildingType: 'tavern' },
        { id: 'academy',     name: '书院',     x: 35, y: 10, emoji: '📚', buildingType: 'academy' },
        { id: 'dock',        name: '码头',     x: 5,  y: 30, emoji: '⚓', buildingType: 'dock' },
        { id: 'shrine',      name: '祠堂',     x: 40, y: 20, emoji: '🏮', buildingType: 'shrine' },
        { id: 'north_cabin', name: '猎户小屋', x: 38, y: 8,  emoji: '🛖', buildingType: 'cabin' },
        { id: 'spirit_field',name: '灵田',     x: 8,  y: 15, isExplore: true, emoji: '🌱', buildingType: 'explore' },
        { id: 'old_well',    name: '古井',     x: 42, y: 25, isExplore: true, emoji: '🪣', buildingType: 'explore' },
        { id: 'official_road',name: '官道',    x: 45, y: 35, emoji: '🛤️', buildingType: 'house' },
        { id: 'west_alley',  name: '后巷',     x: 10, y: 22, emoji: '🏚️', buildingType: 'house' },
        { id: 'sect_gate',   name: '宗门山门', x: 35, y: 5,  minLevel: 3, cost: 50, isExplore: true, emoji: '⛩️', buildingType: 'explore' },
        { id: 'riverside',   name: '溪边',     x: 8,  y: 28, isExplore: true, emoji: '💧', buildingType: 'explore' },
        // ── NPC引用的额外地点 ──
        { id: 'east_street',  name: '东街',     x: 20, y: 22, emoji: '🏘️', buildingType: 'house' },
        { id: 'south_street', name: '南街',     x: 18, y: 28, emoji: '🏘️', buildingType: 'house' },
        { id: 'sect_outer',   name: '宗门外门', x: 35, y: 6,  emoji: '⛩️', buildingType: 'shrine' },
        { id: 'training_ground',name: '练武场', x: 37, y: 7,  emoji: '⚔️', buildingType: 'house' },
        { id: 'inn',          name: '客栈',     x: 14, y: 16, emoji: '🏨', buildingType: 'tavern' },
        { id: 'herb_hut',     name: '药庐',     x: 21, y: 11, emoji: '🏚️', buildingType: 'herb' },
        { id: 'bridge',       name: '石桥',     x: 24, y: 17, emoji: '🌉', buildingType: 'house' },
        { id: 'shop',         name: '杂货铺',   x: 16, y: 17, emoji: '🏪', buildingType: 'market' },
        { id: 'workshop',     name: '木工坊',   x: 31, y: 16, emoji: '🪵', buildingType: 'forge' },
        { id: 'kitchen',      name: '后厨',     x: 26, y: 21, emoji: '🍳', buildingType: 'house' },
        { id: 'library',      name: '藏书阁',   x: 36, y: 9,  emoji: '📖', buildingType: 'academy' },
        { id: 'rooftop',      name: '屋顶',     x: 25, y: 19, emoji: '🏠', buildingType: 'house' },
        { id: 'back_mountain',name: '后山',     x: 38, y: 6,  isExplore: true, emoji: '🏔️', buildingType: 'explore' }
    ];

    // ==================== 第一层：云落镇主地图（50×40）====================
    function generateTownMap() {
        var W = 50, H = 40;
        var map = [];
        var x, y, row;

        // 初始化全草地
        for (y = 0; y < H; y++) {
            row = [];
            for (x = 0; x < W; x++) {
                // 交替草地增加自然感
                row.push((x + y) % 3 === 0 ? T.GRASS2 : T.GRASS);
            }
            map.push(row);
        }

        // 边界山脉和森林（0-2行、37-39行、0-2列、47-49列）
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++) {
                // 北侧山脉
                if (y <= 1) { map[y][x] = T.MOUNTAIN; continue; }
                if (y === 2 && x % 2 === 0) { map[y][x] = T.MOUNTAIN; continue; }
                // 南侧山脉
                if (y >= 38) { map[y][x] = T.MOUNTAIN; continue; }
                if (y === 37 && x % 2 === 0) { map[y][x] = T.MOUNTAIN; continue; }
                // 西侧山脉/森林
                if (x <= 1) { map[y][x] = T.MOUNTAIN; continue; }
                if (x === 2 && y % 2 === 0) { map[y][x] = T.FOREST; continue; }
                // 东侧山脉/森林
                if (x >= 48) { map[y][x] = T.MOUNTAIN; continue; }
                if (x === 47 && y % 2 === 0) { map[y][x] = T.FOREST; continue; }
            }
        }

        // 散布森林（西北、东北、西南、东南角）
        var forestPatches = [
            // 西北
            [3,3],[4,3],[5,3],[3,4],[4,4],[5,4],[3,5],[4,5],
            // 东北
            [44,3],[45,3],[46,3],[44,4],[45,4],[46,4],[45,5],[46,5],
            // 西南
            [3,34],[4,34],[5,34],[3,35],[4,35],[5,35],[4,36],[5,36],
            // 东南
            [44,34],[45,34],[46,34],[44,35],[45,35],[46,35],[45,36],[46,36]
        ];
        for (var fi = 0; fi < forestPatches.length; fi++) {
            map[forestPatches[fi][1]][forestPatches[fi][0]] = T.FOREST;
        }

        // 河流：从北向南，x≈25附近蜿蜒
        // 河流路径：从(25,3)蜿蜒到(25,37)
        var riverPath = [
            [25,3],[25,4],[25,5],[24,6],[24,7],[24,8],[24,9],[24,10],
            [24,11],[24,12],[24,13],[24,14],[24,15],[24,16],[24,17],[24,18],
            [24,19],[25,20],[25,21],[25,22],[25,23],[25,24],[25,25],[25,26],
            [25,27],[25,28],[25,29],[25,30],[25,31],[25,32],[25,33],[25,34],
            [25,35],[25,36],[25,37]
        ];
        for (var ri = 0; ri < riverPath.length; ri++) {
            var rx = riverPath[ri][0], ry = riverPath[ri][1];
            // 河流主体（深水）
            map[ry][rx] = T.DEEPWATER;
            // 两岸浅水
            if (rx - 1 >= 0 && map[ry][rx - 1] !== T.DEEPWATER) map[ry][rx - 1] = T.WATER;
            if (rx + 1 < W && map[ry][rx + 1] !== T.DEEPWATER) map[ry][rx + 1] = T.WATER;
        }

        // 桥梁：在(24,17)和(24,18)附近横跨河流
        // 桥在y=17到y=19处，横跨x=23到x=26
        for (x = 23; x <= 26; x++) {
            map[17][x] = T.BRIDGE;
            map[18][x] = T.BRIDGE;
            map[19][x] = T.BRIDGE;
        }

        // 主干道路：连接各地点
        // 1. 东西主道：从码头(5,30)沿y=30到河边，再从河边到官道(45,35)
        for (x = 3; x <= 23; x++) { map[30][x] = T.PATH; }
        for (x = 27; x <= 47; x++) { map[30][x] = T.PATH; }
        // 2. 北南纵道：从北到南沿x=15
        for (y = 3; y <= 30; y++) { map[y][15] = T.PATH; }
        // 3. 北南纵道：沿x=35
        for (y = 3; y <= 30; y++) { map[y][35] = T.PATH; }
        // 4. 东西横道：沿y=20，茶馆门口
        for (x = 3; x <= 23; x++) { map[20][x] = T.PATH; }
        for (x = 27; x <= 47; x++) { map[20][x] = T.PATH; }
        // 5. 东西横道：沿y=15
        for (x = 10; x <= 23; x++) { map[15][x] = T.PATH; }
        for (x = 27; x <= 40; x++) { map[15][x] = T.PATH; }
        // 6. 东西横道：沿y=25
        for (x = 3; x <= 23; x++) { map[25][x] = T.PATH; }
        for (x = 27; x <= 47; x++) { map[25][x] = T.PATH; }
        // 7. 连接码头到主道
        for (y = 25; y <= 30; y++) { map[y][5] = T.PATH; }
        // 8. 连接官道
        for (y = 30; y <= 35; y++) { map[y][45] = T.PATH; }
        for (x = 35; x <= 45; x++) { map[35][x] = T.PATH; }
        // 9. 连接书院(35,10)
        for (y = 10; y <= 15; y++) { map[y][35] = T.PATH; }
        // 10. 连接猎户小屋(38,8)
        for (y = 8; y <= 10; y++) { map[y][38] = T.PATH; }
        for (x = 35; x <= 38; x++) { map[8][x] = T.PATH; }
        // 11. 连接祠堂(40,20)
        for (x = 35; x <= 40; x++) { map[20][x] = T.PATH; }
        // 12. 连接宗门山门(35,5)
        for (y = 3; y <= 10; y++) { map[y][35] = T.PATH; }
        // 13. 连接溪边(8,28)
        for (y = 25; y <= 28; y++) { map[y][8] = T.PATH; }
        // 14. 连接灵田(8,15)
        for (y = 15; y <= 20; y++) { map[y][8] = T.PATH; }
        for (x = 8; x <= 15; x++) { map[15][x] = T.PATH; }
        // 15. 连接古井(42,25)
        for (x = 35; x <= 42; x++) { map[25][x] = T.PATH; }
        // 16. 连接后巷(10,22)
        for (x = 10; x <= 15; x++) { map[22][x] = T.PATH; }
        for (y = 20; y <= 22; y++) { map[y][10] = T.PATH; }

        // 田地：灵田(8,15)附近
        var fieldCoords = [
            [6,13],[7,13],[8,13],[9,13],[10,13],
            [6,14],[7,14],[8,14],[9,14],[10,14],
            [6,15],[7,15],          [9,15],[10,15],
            [6,16],[7,16],[8,16],[9,16],[10,16],
            [6,17],[7,17],[8,17],[9,17],[10,17]
        ];
        for (var fci = 0; fci < fieldCoords.length; fci++) {
            var fx = fieldCoords[fci][0], fy = fieldCoords[fci][1];
            if (map[fy][fx] === T.GRASS || map[fy][fx] === T.GRASS2) {
                map[fy][fx] = T.FIELD;
            }
        }

        // 建筑物：在各地点位置放置
        var buildingLocations = [
            { x: 25, y: 20, w: 2, h: 2 },  // 茶馆
            { x: 15, y: 18, w: 2, h: 2 },  // 集市
            { x: 20, y: 12, w: 2, h: 2 },  // 百草堂
            { x: 30, y: 15, w: 2, h: 2 },  // 铁匠铺
            { x: 12, y: 25, w: 2, h: 2 },  // 醉仙楼
            { x: 35, y: 10, w: 2, h: 2 },  // 书院
            { x: 5,  y: 30, w: 2, h: 2 },  // 码头
            { x: 40, y: 20, w: 2, h: 2 },  // 祠堂
            { x: 38, y: 8,  w: 2, h: 2 },  // 猎户小屋
            { x: 10, y: 22, w: 1, h: 1 }   // 后巷（小建筑）
        ];
        for (var bi = 0; bi < buildingLocations.length; bi++) {
            var b = buildingLocations[bi];
            for (var by = b.y; by < b.y + b.h && by < H; by++) {
                for (var bx = b.x; bx < b.x + b.w && bx < W; bx++) {
                    map[by][bx] = T.BUILDING;
                }
            }
        }

        // 门：茶馆门口(24,20)
        map[20][24] = T.DOOR;

        // 确保路径不被建筑覆盖的地方恢复路径
        // 重新铺设关键路径点
        map[20][24] = T.DOOR; // 茶馆门
        map[30][5] = T.PATH;  // 码头入口
        map[35][45] = T.PATH; // 官道入口

        return map;
    }

    // ==================== 第二层：茶馆室内（20×15）====================
    function generateIndoorMap(level) {
        var W = 20, H = 15;
        var map = [];
        var x, y, row;

        // 初始化全地板
        for (y = 0; y < H; y++) {
            row = [];
            for (x = 0; x < W; x++) {
                row.push(T.FLOOR);
            }
            map.push(row);
        }

        // 四面墙壁
        for (x = 0; x < W; x++) {
            map[0][x] = T.WALL;  // 上墙
            map[H - 1][x] = T.WALL;  // 下墙
        }
        for (y = 0; y < H; y++) {
            map[y][0] = T.WALL;  // 左墙
            map[y][W - 1] = T.WALL;  // 右墙
        }

        // ---- 右上角书架区域（DECOR地形，x=15~18, y=1~2）----
        for (x = 15; x <= 18; x++) {
            map[1][x] = T.DECOR;  // 书架第一排
            map[2][x] = T.DECOR;  // 书架第二排
        }

        // ---- 柜台：第8行中间（x=5到x=14）----
        for (x = 5; x <= 14; x++) {
            map[8][x] = T.COUNTER;
        }

        // ---- 柜台后面茶具展示架（DECOR地形，x=5~14, y=7）----
        for (x = 5; x <= 14; x++) {
            map[7][x] = T.DECOR;
        }

        // ---- 迎宾台（COUNTER地形，门口内侧 x=9~10, y=13）----
        map[13][9] = T.COUNTER;
        map[13][10] = T.COUNTER;

        // ---- 屏风/隔断（WALL地形，把座位区分成几个小区域）----
        // 左区隔断：x=4, y=3~6
        for (y = 3; y <= 6; y++) { map[y][4] = T.WALL; }
        // 中区隔断：x=10, y=3~6
        for (y = 3; y <= 6; y++) { map[y][10] = T.WALL; }
        // 右区隔断：x=15, y=3~6
        for (y = 3; y <= 6; y++) { map[y][15] = T.WALL; }

        // ---- 座位：三个小区域各4个座位 ----
        // 左区座位（x=1~3区域）：y=4和y=6
        map[4][2] = T.SEAT; map[4][3] = T.SEAT;
        map[6][2] = T.SEAT; map[6][3] = T.SEAT;
        // 中区座位（x=5~9区域）：y=4和y=6
        map[4][6] = T.SEAT; map[4][7] = T.SEAT;
        map[4][8] = T.SEAT; map[4][9] = T.SEAT;
        map[6][6] = T.SEAT; map[6][7] = T.SEAT;
        map[6][8] = T.SEAT; map[6][9] = T.SEAT;
        // 右区座位（x=11~14区域）：y=4和y=6
        map[4][12] = T.SEAT; map[4][13] = T.SEAT;
        map[4][14] = T.SEAT;
        map[6][12] = T.SEAT; map[6][13] = T.SEAT;
        map[6][14] = T.SEAT;

        // ---- 柜台前座位（y=10, 靠柜台）----
        map[10][6] = T.SEAT; map[10][8] = T.SEAT;
        map[10][11] = T.SEAT; map[10][13] = T.SEAT;

        // ---- 厨房：左下角（x=1~3, y=11~13）----
        for (y = 11; y <= 13; y++) {
            for (x = 1; x <= 3; x++) {
                map[y][x] = T.KITCHEN;
            }
        }

        // ---- 门：下方中间 (10, 14) ----
        map[14][10] = T.INDOOR_DOOR;

        // ---- 窗户位置（DECOR地形，靠墙）----
        map[0][5] = T.DECOR;   // 北墙窗户1
        map[0][10] = T.DECOR;  // 北墙窗户2
        map[0][15] = T.DECOR;  // 北墙窗户3
        map[7][0] = T.DECOR;   // 西墙窗户
        map[7][W - 1] = T.DECOR; // 东墙窗户

        // ---- 牌匾（DECOR，北墙中央上方）----
        map[1][10] = T.DECOR;

        // ---- 三界传送门（北墙内侧，根据等级解锁）----
        if (level >= 3) {
            map[1][3] = T.REALM_PORTAL;   // 魔界裂缝（左）
        }
        if (level >= 4) {
            map[1][7] = T.REALM_PORTAL;   // 灵界裂缝（中）
        }
        if (level >= 5) {
            map[1][12] = T.REALM_PORTAL;  // 仙界裂缝（右）
        }

        return map;
    }

    // ==================== 灵界茶室（18×14）====================
    // ==================== 魔界·焰城（20×16）====================
    // 红黑基调，岩浆河流，魔族茶馆
    function generateDemonRealm() {
        var W = 20, H = 16;
        var map = [];
        var x, y, row;

        for (y = 0; y < H; y++) {
            row = [];
            for (x = 0; x < W; x++) {
                row.push(T.FLOOR);
            }
            map.push(row);
        }

        // 四面墙壁（暗岩）
        for (x = 0; x < W; x++) { map[0][x] = T.WALL; map[H - 1][x] = T.WALL; }
        for (y = 0; y < H; y++) { map[y][0] = T.WALL; map[y][W - 1] = T.WALL; }

        // 熔岩池（INDOOR_WATER地形，用红色渲染）：中央偏右3×2区域
        map[7][13] = T.INDOOR_WATER; map[7][14] = T.INDOOR_WATER; map[7][15] = T.INDOOR_WATER;
        map[8][13] = T.INDOOR_WATER; map[8][14] = T.INDOOR_WATER; map[8][15] = T.INDOOR_WATER;

        // 岩浆河：从北到南蜿蜒（用DECOR表示岩浆）
        var lavaPath = [[10,1],[10,2],[9,3],[9,4],[10,5],[10,6],[11,7],[11,8],[10,9],[10,10],[9,11],[9,12]];
        for (var li = 0; li < lavaPath.length; li++) {
            map[lavaPath[li][1]][lavaPath[li][0]] = T.DECOR;
        }

        // 铁砧（DECOR）：左下角区域
        map[12][2] = T.DECOR; map[12][3] = T.DECOR;
        map[13][2] = T.DECOR;

        // 火焰祭坛（DECOR）：北侧中央
        map[1][9] = T.DECOR; map[1][10] = T.DECOR; map[1][11] = T.DECOR;
        map[2][10] = T.DECOR;

        // 魔族柜台：北侧(x=3到x=7, y=3)
        for (x = 3; x <= 7; x++) { map[3][x] = T.COUNTER; }

        // 座位：2排各6个，避开岩浆和熔岩池
        var demonSeats = [
            { x: 3, y: 6 },  { x: 5, y: 6 },  { x: 7, y: 6 },
            { x: 13, y: 6 }, { x: 15, y: 6 }, { x: 17, y: 6 },
            { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 },
            { x: 13, y: 11 }, { x: 15, y: 11 }, { x: 17, y: 11 }
        ];
        for (var dsi = 0; dsi < demonSeats.length; dsi++) {
            map[demonSeats[dsi].y][demonSeats[dsi].x] = T.SEAT;
        }

        // 门：南侧中央(x=10, y=15)
        map[15][10] = T.INDOOR_DOOR;

        // 四角火盆装饰
        map[1][1] = T.DECOR; map[1][W - 2] = T.DECOR;
        map[H - 2][1] = T.DECOR; map[H - 2][W - 2] = T.DECOR;

        return map;
    }

    // ==================== 灵界·幽都（22×18）====================
    // 幽蓝基调，灵泉环绕，灵族茶室
    function generateSpiritRealm() {
        var W = 22, H = 18;
        var map = [];
        var x, y, row;

        for (y = 0; y < H; y++) {
            row = [];
            for (x = 0; x < W; x++) {
                row.push(T.FLOOR);
            }
            map.push(row);
        }

        // 四面墙壁
        for (x = 0; x < W; x++) { map[0][x] = T.WALL; map[H - 1][x] = T.WALL; }
        for (y = 0; y < H; y++) { map[y][0] = T.WALL; map[y][W - 1] = T.WALL; }

        // 灵泉（INDOOR_WATER地形，用蓝色渲染）：中央2×2
        map[8][10] = T.INDOOR_WATER; map[8][11] = T.INDOOR_WATER;
        map[9][10] = T.INDOOR_WATER; map[9][11] = T.INDOOR_WATER;

        // 莲花台（DECOR）：灵泉四周
        map[7][10] = T.DECOR; map[7][11] = T.DECOR;  // 北
        map[10][10] = T.DECOR; map[10][11] = T.DECOR; // 南
        map[8][9] = T.DECOR; map[9][9] = T.DECOR;    // 西
        map[8][12] = T.DECOR; map[9][12] = T.DECOR;  // 东

        // 月光石（DECOR）：四角散布
        map[1][1] = T.DECOR; map[1][W - 2] = T.DECOR;
        map[H - 2][1] = T.DECOR; map[H - 2][W - 2] = T.DECOR;
        map[5][3] = T.DECOR; map[5][18] = T.DECOR;

        // 柜台：北侧(x=6到x=15, y=3)
        for (x = 6; x <= 15; x++) { map[3][x] = T.COUNTER; }

        // 座位：3排各6个
        var spiritSeats = [
            // 第1排 y=6
            { x: 3, y: 6 },  { x: 6, y: 6 },  { x: 9, y: 6 },
            { x: 12, y: 6 }, { x: 15, y: 6 }, { x: 18, y: 6 },
            // 第2排 y=12
            { x: 3, y: 12 }, { x: 6, y: 12 }, { x: 9, y: 12 },
            { x: 12, y: 12 }, { x: 15, y: 12 }, { x: 18, y: 12 },
            // 第3排 y=15
            { x: 3, y: 15 }, { x: 6, y: 15 }, { x: 9, y: 15 },
            { x: 12, y: 15 }, { x: 15, y: 15 }, { x: 18, y: 15 }
        ];
        for (var ssi = 0; ssi < spiritSeats.length; ssi++) {
            map[spiritSeats[ssi].y][spiritSeats[ssi].x] = T.SEAT;
        }

        // 门：南侧中央(x=11, y=17)
        map[17][11] = T.INDOOR_DOOR;

        return map;
    }

    // ==================== 仙界·云阙（24×20）====================
    // 金白基调，云雾缭绕，仙族茶亭
    function generateImmortalRealm() {
        var W = 24, H = 20;
        var map = [];
        var x, y, row;

        for (y = 0; y < H; y++) {
            row = [];
            for (x = 0; x < W; x++) {
                row.push(T.FLOOR);
            }
            map.push(row);
        }

        // 四面墙壁
        for (x = 0; x < W; x++) { map[0][x] = T.WALL; map[H - 1][x] = T.WALL; }
        for (y = 0; y < H; y++) { map[y][0] = T.WALL; map[y][W - 1] = T.WALL; }

        // 云池（INDOOR_WATER地形，用白色渲染）：中央偏东3×2区域
        map[8][14] = T.INDOOR_WATER; map[8][15] = T.INDOOR_WATER; map[8][16] = T.INDOOR_WATER;
        map[9][14] = T.INDOOR_WATER; map[9][15] = T.INDOOR_WATER; map[9][16] = T.INDOOR_WATER;

        // 仙桃树（DECOR）：西侧散布
        map[3][3] = T.DECOR; map[4][3] = T.DECOR;
        map[6][2] = T.DECOR; map[7][2] = T.DECOR;
        map[10][3] = T.DECOR; map[11][3] = T.DECOR;

        // 玉台（DECOR）：中央祭坛区域
        var altarPos = [
            { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 13, y: 9 },
            { x: 10, y: 10 }, { x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }
        ];
        for (var ai = 0; ai < altarPos.length; ai++) {
            map[altarPos[ai].y][altarPos[ai].x] = T.DECOR;
        }

        // 三界之门：北/东/西三面
        map[1][4] = T.INDOOR_DOOR;     // 人界门
        map[10][23] = T.INDOOR_DOOR;   // 灵界门
        map[10][0] = T.INDOOR_DOOR;    // 魔界门

        // 柜台呈环形(x=5到x=18, y=5)
        for (x = 5; x <= 18; x++) { map[5][x] = T.COUNTER; }

        // 座位：4排各8个
        var seatX = [3, 5, 8, 10, 13, 15, 18, 20];
        var seatY = [7, 12, 15, 17];
        for (var syi = 0; syi < seatY.length; syi++) {
            for (var sxi = 0; sxi < seatX.length; sxi++) {
                map[seatY[syi]][seatX[sxi]] = T.SEAT;
            }
        }

        // 门：南侧中央(x=12, y=19)
        map[19][12] = T.INDOOR_DOOR;

        // 四角仙柱
        map[1][1] = T.DECOR; map[1][W - 2] = T.DECOR;
        map[H - 2][1] = T.DECOR; map[H - 2][W - 2] = T.DECOR;

        return map;
    }

    // 座位位置（20×15茶馆室内）
    var SEAT_POSITIONS = [
        // 左区
        { x: 2, y: 4 },  { x: 3, y: 4 },
        { x: 2, y: 6 },  { x: 3, y: 6 },
        // 中区
        { x: 6, y: 4 },  { x: 7, y: 4 },  { x: 8, y: 4 },  { x: 9, y: 4 },
        { x: 6, y: 6 },  { x: 7, y: 6 },  { x: 8, y: 6 },  { x: 9, y: 6 },
        // 右区
        { x: 12, y: 4 }, { x: 13, y: 4 }, { x: 14, y: 4 },
        { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
        // 柜台前
        { x: 6, y: 10 }, { x: 8, y: 10 },
        { x: 11, y: 10 }, { x: 13, y: 10 }
    ];

    // 魔界·焰城座位位置（20×16，2排各6个）
    var DEMON_SEAT_POSITIONS = [
        { x: 3, y: 6 },  { x: 5, y: 6 },  { x: 7, y: 6 },
        { x: 13, y: 6 }, { x: 15, y: 6 }, { x: 17, y: 6 },
        { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 },
        { x: 13, y: 11 }, { x: 15, y: 11 }, { x: 17, y: 11 }
    ];

    // 灵界·幽都座位位置（22×18，3排各6个）
    var SPIRIT_SEAT_POSITIONS = [
        { x: 3, y: 6 },  { x: 6, y: 6 },  { x: 9, y: 6 },
        { x: 12, y: 6 }, { x: 15, y: 6 }, { x: 18, y: 6 },
        { x: 3, y: 12 }, { x: 6, y: 12 }, { x: 9, y: 12 },
        { x: 12, y: 12 }, { x: 15, y: 12 }, { x: 18, y: 12 },
        { x: 3, y: 15 }, { x: 6, y: 15 }, { x: 9, y: 15 },
        { x: 12, y: 15 }, { x: 15, y: 15 }, { x: 18, y: 15 }
    ];

    // 仙界·云阙座位位置（24×20，4排各8个）
    var IMMORTAL_SEAT_POSITIONS = [
        { x: 3, y: 7 },  { x: 5, y: 7 },  { x: 8, y: 7 },  { x: 10, y: 7 },
        { x: 13, y: 7 }, { x: 15, y: 7 }, { x: 18, y: 7 }, { x: 20, y: 7 },
        { x: 3, y: 12 }, { x: 5, y: 12 }, { x: 8, y: 12 }, { x: 10, y: 12 },
        { x: 13, y: 12 }, { x: 15, y: 12 }, { x: 18, y: 12 }, { x: 20, y: 12 },
        { x: 3, y: 15 }, { x: 5, y: 15 }, { x: 8, y: 15 }, { x: 10, y: 15 },
        { x: 13, y: 15 }, { x: 15, y: 15 }, { x: 18, y: 15 }, { x: 20, y: 15 },
        { x: 3, y: 17 }, { x: 5, y: 17 }, { x: 8, y: 17 }, { x: 10, y: 17 },
        { x: 13, y: 17 }, { x: 15, y: 17 }, { x: 18, y: 17 }, { x: 20, y: 17 }
    ];

    // ==================== 第三层：探索区域（20×15通用模板）====================
    function createExploreMap(baseTerrain, features) {
        var W = 20, H = 15;
        var map = [];
        var x, y, row;

        for (y = 0; y < H; y++) {
            row = [];
            for (x = 0; x < W; x++) {
                row.push(baseTerrain);
            }
            map.push(row);
        }

        // 应用特征点
        if (features && features.length) {
            for (var fi = 0; fi < features.length; fi++) {
                var f = features[fi];
                map[f.y][f.x] = f.terrain;
            }
        }

        return map;
    }

    // 后山采药：多山多树，有草药点
    function generateHoushanMap() {
        var W = 20, H = 15;
        var map = [];
        var x, y;

        // 初始化为草地
        for (y = 0; y < H; y++) {
            var row = [];
            for (x = 0; x < W; x++) {
                row.push(T.GRASS);
            }
            map.push(row);
        }

        // 山脉：北部和东部
        for (x = 0; x < W; x++) {
            if (y === 0) map[0][x] = T.MOUNTAIN;
            if (x >= 16) map[0][x] = T.MOUNTAIN;
        }
        for (y = 0; y < 4; y++) {
            for (x = 15; x < W; x++) {
                map[y][x] = T.MOUNTAIN;
            }
        }
        for (x = 0; x < 5; x++) { map[0][x] = T.MOUNTAIN; map[1][x] = T.MOUNTAIN; }
        for (x = 0; x < 3; x++) { map[2][x] = T.MOUNTAIN; }

        // 森林：散布
        var trees = [
            [3,3],[4,4],[5,3],[7,2],[8,3],[10,4],[12,2],[13,3],
            [6,6],[8,7],[10,8],[12,6],[14,5],[3,8],[5,10],[7,9],
            [9,11],[11,10],[13,8],[15,6],[2,11],[4,12],[6,11],
            [14,10],[16,8],[1,5],[3,6],[9,5],[11,3],[15,4]
        ];
        for (var ti = 0; ti < trees.length; ti++) {
            var tx = trees[ti][0], ty = trees[ti][1];
            if (ty < H && tx < W && map[ty][tx] === T.GRASS) {
                map[ty][tx] = T.FOREST;
            }
        }

        // 小路
        for (x = 5; x <= 14; x++) { map[7][x] = T.PATH; }
        for (y = 7; y <= 12; y++) { map[y][10] = T.PATH; }

        // 草药点（用FIELD标记）
        var herbs = [[4,5],[9,3],[12,5],[6,9],[3,10],[11,9],[14,7]];
        for (var hi = 0; hi < herbs.length; hi++) {
            map[herbs[hi][1]][herbs[hi][0]] = T.FIELD;
        }

        return map;
    }

    // 溪边钓鱼：有水有岸
    function generateXibianMap() {
        var W = 20, H = 15;
        var map = [];
        var x, y;

        for (y = 0; y < H; y++) {
            var row = [];
            for (x = 0; x < W; x++) {
                row.push(T.GRASS);
            }
            map.push(row);
        }

        // 溪流：从左上到右下蜿蜒
        var streamPath = [
            [0,2],[1,2],[2,3],[3,3],[4,4],[5,4],[6,5],[7,5],[8,6],
            [9,6],[10,7],[11,7],[12,8],[13,8],[14,9],[15,9],[16,10],
            [17,10],[18,11],[19,11]
        ];
        for (var si = 0; si < streamPath.length; si++) {
            var sx = streamPath[si][0], sy = streamPath[si][1];
            map[sy][sx] = T.DEEPWATER;
            // 两岸浅水
            if (sx + 1 < W && map[sy][sx + 1] === T.GRASS) map[sy][sx + 1] = T.WATER;
            if (sy + 1 < H && map[sy + 1][sx] === T.GRASS) map[sy + 1][sx] = T.WATER;
        }

        // 岸边草地变深
        for (y = 0; y < H; y++) {
            for (x = 0; x < W; x++) {
                if (map[y][x] === T.GRASS && Math.random() < 0.15) {
                    map[y][x] = T.GRASS2;
                }
            }
        }

        // 小池塘
        map[12][4] = T.WATER; map[12][5] = T.WATER; map[12][6] = T.WATER;
        map[13][5] = T.DEEPWATER; map[13][6] = T.DEEPWATER;
        map[11][5] = T.WATER;

        // 钓鱼点标记（PATH表示可站位置）
        map[5][7] = T.PATH;
        map[6][9] = T.PATH;
        map[8][11] = T.PATH;
        map[10][13] = T.PATH;

        // 入口
        for (y = 10; y <= 14; y++) { map[y][0] = T.PATH; }

        return map;
    }

    // 灵田种茶：田地为主
    function generateLingtianMap() {
        var W = 20, H = 15;
        var map = [];
        var x, y;

        for (y = 0; y < H; y++) {
            var row = [];
            for (x = 0; x < W; x++) {
                row.push(T.GRASS);
            }
            map.push(row);
        }

        // 大片田地
        for (y = 2; y <= 12; y++) {
            for (x = 2; x <= 17; x++) {
                if ((x + y) % 2 === 0) {
                    map[y][x] = T.FIELD;
                }
            }
        }

        // 田埂（路径分隔田地）
        for (x = 2; x <= 17; x++) { map[4][x] = T.PATH; }
        for (x = 2; x <= 17; x++) { map[8][x] = T.PATH; }
        for (x = 2; x <= 17; x++) { map[12][x] = T.PATH; }
        for (y = 2; y <= 12; y++) { map[y][6] = T.PATH; }
        for (y = 2; y <= 12; y++) { map[y][12] = T.PATH; }

        // 灵泉（小水塘）
        map[6][9] = T.WATER; map[6][10] = T.WATER;
        map[7][9] = T.WATER; map[7][10] = T.DEEPWATER;

        // 入口
        for (y = 5; y <= 9; y++) { map[y][0] = T.PATH; }

        return map;
    }

    // 古井探秘：小空间，有井
    function generateGujingMap() {
        var W = 20, H = 15;
        var map = [];
        var x, y;

        // 初始化为草地
        for (y = 0; y < H; y++) {
            var row = [];
            for (x = 0; x < W; x++) {
                row.push(T.GRASS);
            }
            map.push(row);
        }

        // 围墙（用森林代替，营造封闭感）
        for (x = 0; x < W; x++) { map[0][x] = T.FOREST; map[H - 1][x] = T.FOREST; }
        for (y = 0; y < H; y++) { map[y][0] = T.FOREST; map[y][W - 1] = T.FOREST; }

        // 内部空地
        for (y = 2; y <= 12; y++) {
            for (x = 3; x <= 16; x++) {
                map[y][x] = T.GRASS2;
            }
        }

        // 古井（深水）
        map[7][9] = T.DEEPWATER;
        map[7][10] = T.DEEPWATER;
        map[6][9] = T.WATER;
        map[6][10] = T.WATER;
        map[8][9] = T.WATER;
        map[8][10] = T.WATER;

        // 井台（路径环绕）
        for (x = 8; x <= 11; x++) { map[5][x] = T.PATH; map[9][x] = T.PATH; }
        for (y = 5; y <= 9; y++) { map[y][8] = T.PATH; map[y][11] = T.PATH; }

        // 入口小路（延伸到地图边缘，确保玩家能走到col=0触发exit_explore）
        for (y = 7; y <= 13; y++) { map[y][1] = T.PATH; }
        map[7][0] = T.PATH;  // 边缘出口
        map[7][2] = T.PATH;

        // 散落石块（用MOUNTAIN小标记）
        map[3][5] = T.MOUNTAIN;
        map[4][14] = T.MOUNTAIN;
        map[10][4] = T.MOUNTAIN;
        map[11][13] = T.MOUNTAIN;

        return map;
    }

    // 宗门外围：山门+石阶
    function generateZongmenMap() {
        var W = 20, H = 15;
        var map = [];
        var x, y;

        // 初始化为草地
        for (y = 0; y < H; y++) {
            var row = [];
            for (x = 0; x < W; x++) {
                row.push(T.GRASS);
            }
            map.push(row);
        }

        // 后方山脉
        for (x = 0; x < W; x++) { map[0][x] = T.MOUNTAIN; map[1][x] = T.MOUNTAIN; }
        for (x = 0; x < 6; x++) { map[2][x] = T.MOUNTAIN; }
        for (x = 14; x < W; x++) { map[2][x] = T.MOUNTAIN; }

        // 两侧山脉
        for (y = 0; y <= 5; y++) { map[y][0] = T.MOUNTAIN; map[y][1] = T.MOUNTAIN; }
        for (y = 0; y <= 5; y++) { map[y][W - 1] = T.MOUNTAIN; map[y][W - 2] = T.MOUNTAIN; }

        // 山门（用BUILDING标记）
        map[3][9] = T.BUILDING; map[3][10] = T.BUILDING;
        map[4][9] = T.BUILDING; map[4][10] = T.BUILDING;
        map[3][8] = T.BUILDING; map[3][11] = T.BUILDING;  // 门柱

        // 石阶（PATH从山门向下延伸）
        for (y = 5; y <= 13; y++) {
            map[y][9] = T.PATH;
            map[y][10] = T.PATH;
        }

        // 两侧松树
        var pines = [
            [4,3],[5,4],[3,6],[6,7],[4,8],[5,9],[3,10],[6,11],[4,12],
            [14,3],[15,4],[13,6],[16,7],[14,8],[15,9],[13,10],[16,11],[14,12]
        ];
        for (var pi = 0; pi < pines.length; pi++) {
            var px = pines[pi][0], py = pines[pi][1];
            if (py < H && px < W && map[py][px] === T.GRASS) {
                map[py][px] = T.FOREST;
            }
        }

        // 入口
        map[14][9] = T.PATH;
        map[14][10] = T.PATH;

        return map;
    }

    // 探索区域数据
    var EXPLORE_AREAS = [
        {
            id: 'back_mountain',
            name: '后山采药',
            emoji: '🏔️',
            map: generateHoushanMap(),
            collectPoints: [
                { x: 4, y: 5, type: 'herb', name: '灵芝草' },
                { x: 9, y: 3, type: 'herb', name: '当归' },
                { x: 12, y: 5, type: 'herb', name: '金银花' },
                { x: 6, y: 9, type: 'herb', name: '白芷' },
                { x: 3, y: 10, type: 'herb', name: '黄芪' },
                { x: 11, y: 9, type: 'herb', name: '川芎' },
                { x: 14, y: 7, type: 'herb', name: '茯苓' }
            ],
            events: [
                { name: '发现珍稀草药', probability: 0.15, reward: { item: '千年灵芝', exp: 50 } },
                { name: '遇到采药老人', probability: 0.2, reward: { exp: 20, skill: '采药术' } },
                { name: '踩到毒蛇', probability: 0.1, damage: 15 },
                { name: '发现隐藏山洞', probability: 0.05, reward: { item: '古方残页', exp: 100 } }
            ]
        },
        {
            id: 'riverside',
            name: '溪边钓鱼',
            emoji: '🎣',
            map: generateXibianMap(),
            collectPoints: [
                { x: 7, y: 5, type: 'fish', name: '鲫鱼' },
                { x: 9, y: 6, type: 'fish', name: '鲤鱼' },
                { x: 11, y: 8, type: 'fish', name: '草鱼' },
                { x: 13, y: 10, type: 'fish', name: '青鱼' }
            ],
            events: [
                { name: '钓到大鱼', probability: 0.2, reward: { item: '金色锦鲤', exp: 30 } },
                { name: '捡到漂流瓶', probability: 0.1, reward: { item: '神秘信笺', exp: 15 } },
                { name: '滑入水中', probability: 0.1, damage: 5 },
                { name: '遇到老渔翁', probability: 0.15, reward: { exp: 25, skill: '垂钓术' } }
            ]
        },
        {
            id: 'spirit_field',
            name: '灵田种茶',
            emoji: '🍵',
            map: generateLingtianMap(),
            collectPoints: [
                { x: 3, y: 3, type: 'tea', name: '云雾茶苗' },
                { x: 8, y: 3, type: 'tea', name: '碧螺春苗' },
                { x: 14, y: 3, type: 'tea', name: '龙井茶苗' },
                { x: 3, y: 6, type: 'tea', name: '铁观音苗' },
                { x: 14, y: 6, type: 'tea', name: '毛峰茶苗' },
                { x: 3, y: 10, type: 'tea', name: '普洱茶苗' },
                { x: 8, y: 10, type: 'tea', name: '白茶苗' },
                { x: 14, y: 10, type: 'tea', name: '红茶苗' }
            ],
            events: [
                { name: '发现灵泉涌出', probability: 0.1, reward: { item: '灵泉水', exp: 40 } },
                { name: '茶树变异', probability: 0.08, reward: { item: '变异茶种', exp: 60 } },
                { name: '虫害来袭', probability: 0.15, damage: 10 },
                { name: '遇到茶农', probability: 0.2, reward: { exp: 15, skill: '种茶术' } }
            ]
        },
        {
            id: 'old_well',
            name: '古井探秘',
            emoji: '🪣',
            map: generateGujingMap(),
            collectPoints: [
                { x: 9, y: 7, type: 'well', name: '古井水' },
                { x: 10, y: 7, type: 'well', name: '古井水' }
            ],
            events: [
                { name: '井中传来异响', probability: 0.15, reward: { item: '古铜钱', exp: 25 } },
                { name: '发现井底密道', probability: 0.05, reward: { item: '密道钥匙', exp: 80 } },
                { name: '井水突然翻涌', probability: 0.1, damage: 20 },
                { name: '拾到古物', probability: 0.12, reward: { item: '玉佩碎片', exp: 35 } }
            ]
        },
        {
            id: 'sect_gate',
            name: '宗门外围',
            emoji: '⛩️',
            map: generateZongmenMap(),
            collectPoints: [
                { x: 9, y: 3, type: 'gate', name: '山门令牌碎片' },
                { x: 10, y: 3, type: 'gate', name: '山门令牌碎片' }
            ],
            events: [
                { name: '发现修仙者遗物', probability: 0.08, reward: { item: '残破法器', exp: 70 } },
                { name: '遭遇守山灵兽', probability: 0.12, damage: 30 },
                { name: '感悟天地灵气', probability: 0.15, reward: { exp: 50, skill: '聚气术' } },
                { name: '发现隐秘石碑', probability: 0.05, reward: { item: '宗门心法残卷', exp: 120 } }
            ]
        }
    ];

    // ==================== 地形颜色映射 ====================
    var TERRAIN_COLORS = {
        // 主地图地形颜色
        0:  '#7ec850',  // GRASS - 草绿
        1:  '#5da832',  // GRASS2 - 深草绿
        2:  '#4a9bd9',  // WATER - 浅水蓝
        3:  '#2d6a9f',  // DEEPWATER - 深水蓝
        4:  '#c4a86b',  // PATH - 土黄
        5:  '#8b7355',  // MOUNTAIN - 山岩棕
        6:  '#2d5a1e',  // FOREST - 深林绿
        7:  '#a8c256',  // FIELD - 田地黄绿
        8:  '#b89a5a',  // BRIDGE - 桥木色
        9:  '#d4a017',  // DOOR - 门金色
        10: '#6b4226',  // BUILDING - 建筑棕
        // 室内地形颜色
        floor:   '#d4b896',  // FLOOR - 木地板色
        wall:    '#5c3a1e',  // WALL - 墙壁深棕
        counter: '#8b6914',  // COUNTER - 柜台木色
        seat:    '#a0522d',  // SEAT - 座椅棕红
        kitchen: '#4a4a4a',  // KITCHEN - 厨房灰
        door:    '#d4a017',  // INDOOR_DOOR - 门金色
        decor:   '#cd853f',  // DECOR - 装饰古铜
        portal:  '#9b59b6',  // REALM_PORTAL - 传送门紫光
        indoor_water: '#4a9bd9'  // INDOOR_WATER - 室内水域（默认蓝色，三界会覆盖）
    };

    // ==================== 三界室内特殊颜色 ====================
    // 三界地图中WATER和DECOR使用不同颜色渲染
    var REALM_COLORS = {
        demon_realm: {
            water: '#c62828',   // 熔岩池-红色
            decor: '#ff6f00',   // 火焰装饰-橙红
            floor: '#3e2723',   // 暗褐地板
            wall: '#1b0000',    // 深红墙
            counter: '#5d4037', // 暗木柜台
            seat: '#8b0000'     // 暗红座
        },
        spirit_realm: {
            water: '#1565c0',   // 灵泉-蓝色
            decor: '#7e57c2',   // 灵光装饰-紫蓝
            floor: '#1a237e',   // 幽蓝地板
            wall: '#0d1b3e',    // 深蓝墙
            counter: '#283593', // 靛蓝柜台
            seat: '#3949ab'     // 蓝紫座
        },
        immortal_realm: {
            water: '#e0e0e0',   // 云池-白色
            decor: '#ffd54f',   // 仙光装饰-金色
            floor: '#f5f5f5',   // 云白地板
            wall: '#bdbdbd',    // 银灰墙
            counter: '#ffe082', // 金柜台
            seat: '#fff9c4'     // 淡金座
        }
    };

    // ==================== 季节颜色变体 ====================
    var SEASON_TINTS = {
        spring: {
            0:  '#7ec850',  // GRASS - 嫩绿
            1:  '#5da832',  // GRASS2
            2:  '#4a9bd9',  // WATER
            3:  '#2d6a9f',  // DEEPWATER
            4:  '#c4a86b',  // PATH
            5:  '#8b7355',  // MOUNTAIN
            6:  '#3a7a2e',  // FOREST - 新叶绿
            7:  '#a8c256',  // FIELD
            10: '#6b4226'   // BUILDING
        },
        summer: {
            0:  '#5cb338',  // GRASS - 浓绿
            1:  '#4a8f28',  // GRASS2
            2:  '#3a8bc9',  // WATER
            3:  '#1d5a8f',  // DEEPWATER
            4:  '#b8985b',  // PATH
            5:  '#7a6345',  // MOUNTAIN
            6:  '#1d4a0e',  // FOREST - 郁郁葱葱
            7:  '#98b246',  // FIELD
            10: '#5b3216'   // BUILDING
        },
        autumn: {
            0:  '#b8a038',  // GRASS - 枯黄
            1:  '#9a8528',  // GRASS2
            2:  '#4a8bb9',  // WATER
            3:  '#2d5a8f',  // DEEPWATER
            4:  '#b8905b',  // PATH
            5:  '#8b7355',  // MOUNTAIN
            6:  '#8b4513',  // FOREST - 红叶
            7:  '#c8a846',  // FIELD - 金黄
            10: '#6b4226'   // BUILDING
        },
        winter: {
            0:  '#c8c8c8',  // GRASS - 雪白
            1:  '#a8a8a8',  // GRASS2
            2:  '#6ab0d9',  // WATER - 冰蓝
            3:  '#4a80a9',  // DEEPWATER
            4:  '#b8a878',  // PATH
            5:  '#9a8a7a',  // MOUNTAIN - 积雪
            6:  '#5a5a5a',  // FOREST - 枯枝灰
            7:  '#b8b8a8',  // FIELD - 休耕
            10: '#7a5a3a'   // BUILDING
        }
    };

    // ==================== 缓存生成的地图 ====================
    var _townMap = null;
    var _indoorMapCache = null;   // 缓存茶馆室内地图
    var _indoorMapLevel = -1;    // 缓存对应的等级
    var _demonRealmCache = null;
    var _spiritRealmCache = null;
    var _immortalRealmCache = null;

    // ==================== 公开接口 ====================
    return {
        // 获取云落镇主地图
        getTownMap: function() {
            if (!_townMap) {
                _townMap = generateTownMap();
            }
            return _townMap;
        },

        // 获取茶馆室内地图（根据等级动态生成，传送门随等级出现）
        getIndoorMap: function(level) {
            var lv = level || 1;
            // 只有等级变化时才重新生成
            if (_indoorMapCache && _indoorMapLevel === lv) {
                return _indoorMapCache;
            }
            _indoorMapCache = generateIndoorMap(lv);
            _indoorMapLevel = lv;
            return _indoorMapCache;
        },

        // 获取魔界·焰城地图
        getDemonRealm: function() { if (!_demonRealmCache) _demonRealmCache = generateDemonRealm(); return _demonRealmCache; },

        // 获取灵界·幽都地图
        getSpiritRealm: function() { if (!_spiritRealmCache) _spiritRealmCache = generateSpiritRealm(); return _spiritRealmCache; },

        // 获取仙界·云阙地图
        getImmortalRealm: function() { if (!_immortalRealmCache) _immortalRealmCache = generateImmortalRealm(); return _immortalRealmCache; },

        // 获取探索区域数据
        getExploreArea: function(id) {
            for (var i = 0; i < EXPLORE_AREAS.length; i++) {
                if (EXPLORE_AREAS[i].id === id) {
                    return EXPLORE_AREAS[i];
                }
            }
            return null;
        },

        // 获取地点信息
        getLocationInfo: function(locId) {
            for (var i = 0; i < LOCATIONS.length; i++) {
                if (LOCATIONS[i].id === locId) {
                    return LOCATIONS[i];
                }
            }
            return null;
        },

        // 所有15个地点配置
        LOCATIONS: LOCATIONS,

        // 座位坐标数组
        SEAT_POSITIONS: SEAT_POSITIONS,

        // 魔界·焰城座位坐标
        DEMON_SEAT_POSITIONS: DEMON_SEAT_POSITIONS,

        // 灵界·幽都座位坐标
        SPIRIT_SEAT_POSITIONS: SPIRIT_SEAT_POSITIONS,

        // 仙界·云阙座位坐标
        IMMORTAL_SEAT_POSITIONS: IMMORTAL_SEAT_POSITIONS,

        // 地形颜色映射
        TERRAIN_COLORS: TERRAIN_COLORS,

        // 三界室内特殊颜色
        REALM_COLORS: REALM_COLORS,

        // 季节颜色变体
        SEASON_TINTS: SEASON_TINTS,

        // 地形常量
        TERRAIN: T,
        OUTDOOR_TERRAIN: OT,
        INDOOR_TERRAIN: IT,

        // 可行走地形
        WALKABLE: WALKABLE
    };
})();

window.YunluoMap = YunluoMap;
