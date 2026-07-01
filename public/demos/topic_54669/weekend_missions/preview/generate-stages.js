const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'maps', 'routes.json'), 'utf8'));

// 提取路线数据，去重相邻重复点
const routes = {};
data.routes.forEach((r, i) => {
    const pts = [];
    r.points.forEach(p => {
        const last = pts[pts.length-1];
        if (!last || last[0] !== p.lng || last[1] !== p.lat) {
            pts.push([p.lng, p.lat]);
        }
    });
    routes[i+1] = { from: r.from, to: r.to, pts };
});

// 4关配置
const stages = [
    {
        index: 0, name: "南海意馆", color: "#6B4423",
        route: routes[1],
        task: { title: "点一杯「孤独的星球」", cost: "¥45", duration: "1h", hp: 20 },
        walk: { style: "city", skyColor: "#1a2a4a", midColor: "#2a3a5a", groundColor: "#3a3a3a", dynamicElements: ["lamp_glow"] },
        ending: { type: "coffee", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}] },
    },
    {
        index: 1, name: "南山书城", color: "#2d5016",
        route: routes[2],
        task: { title: "找一本关于旅行的书", cost: "¥0", duration: "2h", hp: 15 },
        walk: { style: "forest", skyColor: "#a8d8f0", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
        ending: { type: "bookstore", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}] },
    },
    {
        index: 2, name: "海岸城", color: "#5a2a5a",
        route: routes[3],
        task: { title: "拍一张城市俯瞰照", cost: "¥0", duration: "1h", hp: 10 },
        walk: { style: "commercial", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}] },
    },
    {
        index: 3, name: "深圳湾公园", color: "#ff7a3a",
        route: routes[4],
        task: { title: "在海边长椅坐10分钟", cost: "¥0", duration: "10min", hp: 0 },
        walk: { style: "seaside", skyColor: "#ff7a3a", midColor: "#4a7c9a", groundColor: "#8B7355", dynamicElements: ["wave_scroll", "seagull"] },
        ending: { type: "park", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}], isBoss: true, countdown: 10 },
    },
];

// 输出 stages.js
const output = `'use strict';

// ==========================================
// 内联路线数据（由 generate-stages.js 从 docs/maps/routes.json 生成，去重相邻重复点）
// ==========================================
WM.ROUTES = ${JSON.stringify(routes, null, 2)};

// ==========================================
// 4关配置数据
// ==========================================
WM.STAGES = ${JSON.stringify(stages, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'stages.js'), output, 'utf8');
console.log('Generated preview/js/stages.js');
console.log('Routes:', Object.keys(routes).map(k => `${k}: ${routes[k].from}→${routes[k].to} (${routes[k].pts.length} points)`).join(', '));
