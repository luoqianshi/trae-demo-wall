const fs = require('fs');
const path = require('path');

function loadRouteData(fileName) {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'maps', fileName), 'utf8'));
    const routes = {};
    raw.routes.forEach((r, i) => {
        const pts = [];
        r.points.forEach(p => {
            const last = pts[pts.length - 1];
            if (!last || last[0] !== p.lng || last[1] !== p.lat) {
                pts.push([p.lng, p.lat]);
            }
        });
        routes[i + 1] = {
            from: r.from,
            to: r.to,
            distance: r.distance || 0,
            duration: r.duration || 0,
            pts,
        };
    });
    return {
        places: raw.places.map(p => ({ name: p.name, lng: p.lng, lat: p.lat })),
        routes,
    };
}

const shenzhenData = loadRouteData('routes.json');
const hangzhouData = loadRouteData('routes-hangzhou.json');
const shanghaiData = loadRouteData('routes-shanghai.json');

const shenzhenStages = [
    {
        index: 0, name: "南海意馆", color: "#6B4423",
        route: shenzhenData.routes[1],
        task: { title: "点一杯「孤独的星球」", cost: "¥45", duration: "1h", hp: 20 },
        note: "这家藏在巷子里的咖啡馆，墙上贴满了旅行者留下的明信片。每一张都是一个故事。",
        walk: { style: "city", skyColor: "#1a2a4a", midColor: "#2a3a5a", groundColor: "#3a3a3a", dynamicElements: ["lamp_glow"] },
        ending: { type: "coffee", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 1, name: "南山书城", color: "#2d5016",
        route: shenzhenData.routes[2],
        task: { title: "找一本关于旅行的书", cost: "¥0", duration: "2h", hp: 15 },
        note: "书城的二楼有一个安静的角落，阳光从落地窗洒进来。在这里，时间会慢下来。",
        walk: { style: "forest", skyColor: "#a8d8f0", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
        ending: { type: "bookstore", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 2, name: "海岸城", color: "#5a2a5a",
        route: shenzhenData.routes[3],
        task: { title: "拍一张城市俯瞰照", cost: "¥0", duration: "1h", hp: 10 },
        note: "海岸城的顶层有一个观景台，可以俯瞰整个南山。傍晚时分，夕阳会把整个城市染成金色。",
        walk: { style: "commercial", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 3, name: "深圳湾公园", color: "#ff7a3a",
        route: shenzhenData.routes[4],
        task: { title: "在海边长椅坐10分钟", cost: "¥0", duration: "10min", hp: 0 },
        note: "这里是今天的压轴。当夕阳落下，整个海湾会被染成橙红色。牵着她的手，慢慢走完这段栈道。",
        walk: { style: "seaside", skyColor: "#ff7a3a", midColor: "#4a7c9a", groundColor: "#8B7355", dynamicElements: ["wave_scroll", "seagull"] },
        ending: { type: "park", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true, countdown: 10 },
    },
];

const hangzhouStages = [
    {
        index: 0, name: "河坊街老面馆", color: "#8B7355",
        route: hangzhouData.routes[1],
        task: { title: "吃一碗热乎的片儿川", cost: "¥25", duration: "30min", hp: 12 },
        note: "河坊街的老味道藏在热气里，一个人坐下也可以认真吃一顿饭。",
        walk: { style: "city", variant: "hangzhou-oldtown", skyColor: "#8fbfe8", midColor: "#8B7355", groundColor: "#6B5333", dynamicElements: ["lamp_glow", "steam_rise"] },
        ending: { type: "coffee", variant: "hangzhou-noodle", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 1, name: "中国美术学院南山校区", color: "#00D2D3",
        route: hangzhouData.routes[2],
        task: { title: "在校园里找一幅喜欢的作品", cost: "¥0", duration: "45min", hp: 12 },
        note: "校园里的墙、树影和展窗都像一幅画。慢慢走，挑一幅只属于今天的作品。",
        walk: { style: "forest", skyColor: "#a8d8f0", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
        ending: { type: "bookstore", variant: "hangzhou-gallery", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 2, name: "南宋御街", color: "#E67E22",
        route: hangzhouData.routes[3],
        task: { title: "逛一间小店，挑一个纪念品", cost: "¥40", duration: "1h", hp: 15 },
        note: "旧街的招牌和石板路把时间拉慢。给未来的自己带走一个小物件。",
        walk: { style: "commercial", variant: "hangzhou-oldtown", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", variant: "hangzhou-oldstreet", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 3, name: "宝石山日落", color: "#27AE60",
        route: hangzhouData.routes[4],
        task: { title: "爬上山顶，看一次西湖日落", cost: "¥0", duration: "1.5h", hp: 15 },
        note: "这是今天的压轴。站在山顶时，西湖会把一整天的疲惫都收走。",
        walk: { style: "forest", variant: "hangzhou-lake", skyColor: "#ff9a5a", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot", "river_reflection"] },
        ending: { type: "mountain", variant: "hangzhou-sunset", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true, countdown: 10 },
    },
];

const shanghaiStages = [
    {
        index: 0, name: "老上海本帮菜", color: "#E67E22",
        route: shanghaiData.routes[1],
        task: { title: "点一份红烧肉，给兄弟夹第一筷", cost: "¥150", duration: "1.5h", hp: 15 },
        note: "上海的热闹从饭桌开始。第一关不是赶路，是先把气氛吃热。",
        walk: { style: "commercial", variant: "shanghai-neon", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian", "steam_rise"] },
        ending: { type: "coffee", variant: "shanghai-restaurant", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 1, name: "田子坊艺术区", color: "#F1C40F",
        route: shanghaiData.routes[2],
        task: { title: "找一面最适合合影的墙", cost: "¥0", duration: "1h", hp: 12 },
        note: "巷子越窄，惊喜越多。给小队找一张能证明到此一游的背景。",
        walk: { style: "city", skyColor: "#1a2a4a", midColor: "#2a3a5a", groundColor: "#3a3a3a", dynamicElements: ["lamp_glow", "camera_flash"] },
        ending: { type: "bookstore", variant: "shanghai-lilong-art", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 2, name: "南京路步行街", color: "#F39C12",
        route: shanghaiData.routes[3],
        task: { title: "买一份老字号伴手礼", cost: "¥100", duration: "1h", hp: 12 },
        note: "人潮、霓虹、招牌和老字号，这一关要在热闹里保持队形。",
        walk: { style: "commercial", variant: "shanghai-neon", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", variant: "shanghai-nanjing-road", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 3, name: "外滩夜景", color: "#FFD700",
        route: shanghaiData.routes[4],
        task: { title: "在外滩拍一张通关合照", cost: "¥0", duration: "1h", hp: 15 },
        note: "这是今天的压轴。站在江边，对面亮起的灯就是最终通关画面。",
        walk: { style: "seaside", variant: "shanghai-river", skyColor: "#1a2a4a", midColor: "#4a7c9a", groundColor: "#2a2a2a", dynamicElements: ["wave_scroll", "camera_flash", "river_reflection"] },
        ending: { type: "bund", variant: "shanghai-bund", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true },
    },
];

const themes = {
    "shenzhen-couple": {
        id: "shenzhen-couple",
        title: "深圳·情侣甜蜜大作战",
        city: "深圳",
        budget: 200,
        groupSize: 2,
        themeColor: "#FD79A8",
        scene: { label: "情侣约会", city: "深圳南山" },
        briefing: [
            "特工，密令已下达。",
            "本次任务：深圳·情侣甜蜜大作战",
            "作战时间：今日 10:00 - 19:00",
            "作战预算：¥200",
            "作战人数：2 人",
            "任务：穿越南山区，打卡甜蜜坐标。"
        ],
        map: {
            centerLng: 113.945129,
            centerLat: 22.500940,
            zoom: 14,
            imgW: 800,
            imgH: 600,
            img: "docs/maps/shenzhen_full.png",
            places: shenzhenData.places
        },
        routes: shenzhenData.routes,
        stages: shenzhenStages,
    },
    "hangzhou-solo": {
        id: "hangzhou-solo",
        title: "杭州·独居时光漫步",
        city: "杭州",
        budget: 150,
        groupSize: 1,
        themeColor: "#00D2D3",
        scene: { label: "独行漫游", city: "杭州西湖" },
        briefing: [
            "特工，密令已下达。",
            "本次任务：杭州·独居时光漫步",
            "作战时间：今日 13:00 - 19:00",
            "作战预算：¥150",
            "作战人数：1 人",
            "任务：一个人，一座城，发现杭州的小众浪漫。"
        ],
        map: {
            centerLng: 120.150000,
            centerLat: 30.280000,
            zoom: 13,
            imgW: 800,
            imgH: 600,
            img: "docs/maps/hangzhou.png",
            places: hangzhouData.places
        },
        routes: hangzhouData.routes,
        stages: hangzhouStages,
    },
    "shanghai-friends": {
        id: "shanghai-friends",
        title: "上海·兄弟聚会闯关",
        city: "上海",
        budget: 500,
        groupSize: 4,
        themeColor: "#F1C40F",
        scene: { label: "好友聚会", city: "上海黄浦" },
        briefing: [
            "特工，密令已下达。",
            "本次任务：上海·兄弟聚会闯关",
            "作战时间：今日 14:00 - 22:00",
            "作战预算：¥500",
            "作战人数：4 人",
            "任务：集合小队，穿过上海最热闹的街区。"
        ],
        map: {
            centerLng: 121.470000,
            centerLat: 31.230000,
            zoom: 13,
            imgW: 800,
            imgH: 600,
            img: "docs/maps/shanghai.png",
            places: shanghaiData.places
        },
        routes: shanghaiData.routes,
        stages: shanghaiStages,
    },
};

const output = `'use strict';

// ==========================================
// 主题数据（由 generate-stages.js 从 docs/maps/routes.json 生成）
// 关卡数由各主题 stages.length 决定，引擎自适应
// ==========================================
WM.THEMES = ${JSON.stringify(themes, null, 2)};

// 默认装配深圳主题（app.js 选主题后会用 WM.applyTheme 覆盖）
WM.ROUTES = WM.THEMES['shenzhen-couple'].routes;
WM.STAGES = WM.THEMES['shenzhen-couple'].stages;
`;

fs.writeFileSync(path.join(__dirname, 'js', 'stages.js'), output, 'utf8');
console.log('Generated js/stages.js');
console.log('Themes:', Object.keys(themes).join(', '));
Object.keys(themes).forEach(k => {
    console.log(`  ${k}: ${themes[k].stages.length} stages, ${Object.keys(themes[k].routes).length} routes`);
});
