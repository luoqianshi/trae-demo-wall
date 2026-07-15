const DEFAULT_BOUNDS = [[97, 20.5], [123, 45]];
const HOME_PADDING = { top: 96, bottom: 96, left: 42, right: 42 };
const REGIONAL_RELIEF_TILE_BOUNDS = [56.25, 16.63619, 140.625, 55.77657];
const RELIEF_VERSION = "20260629-genghis";
const RELIEF_TILES = `tiles/relief/{z}/{x}/{y}.webp?v=${RELIEF_VERSION}`;
const DEM_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const DEM_BOUNDS = [73, 17, 135, 54];

const LOCATION_COORDS = {
  // 苏轼地点
  meishan: [103.848, 30.075],
  kaifeng: [114.307, 34.798],
  fengxiang: [107.401, 34.521],
  hangzhou: [120.155, 30.274],
  mizhou: [119.410, 35.996],
  xuzhou: [117.185, 34.261],
  huzhou: [120.087, 30.894],
  huangzhou: [114.879, 30.447],
  huizhou: [114.416, 23.112],
  danzhou: [109.2, 19.5],
  changzhou: [119.974, 31.811],
  // 李白地点
  qinglian: [104.744, 31.778],
  emei: [103.484, 29.601],
  yuzhou: [106.551, 29.563],
  jiangling: [112.239, 30.335],
  jinling: [118.796, 32.06],
  yangzhou: [119.412, 32.394],
  anlu: [113.689, 31.256],
  changan: [108.94, 34.341],
  luoyang: [112.454, 34.619],
  yanzhou: [116.828, 35.552],
  xuancheng: [118.759, 30.94],
  lushan: [115.982, 29.705],
  yelang: [106.825, 28.133],
  baidicheng: [109.575, 31.045],
  dangtu: [118.497, 31.571],
  // 额外旅行地点
  chengdu: [104.066, 30.663],
  emeishan: [103.484, 29.601],
  chongqing: [106.55, 29.56],
  wuhan: [114.30, 30.59],
  guangzhou: [113.26, 23.13],
  zhuhai: [113.58, 22.27],
  shaoxing: [120.58, 30.03],
  wuhu: [118.43, 31.35],
  qingdao: [120.38, 36.07],
  // 杜甫地点
  gongyi: [112.97, 34.82],
  fengxian: [109.58, 34.57],
  fuzhou: [109.98, 36.60],
  kuizhou: [109.65, 31.03],
  leiyang: [112.86, 26.41],
  // 白居易地点
  xinzheng: [113.87, 34.40],
  zhouzhi: [108.37, 34.16],
  jiangzhou: [115.97, 29.71],
  suzhou: [120.62, 31.32],
  xiangshan: [112.47, 34.62],
  // 王维地点
  puzhou: [110.59, 34.85],
  jizhou: [116.04, 36.38],
  zhongnanshan: [108.88, 33.98],
  hexi: [102.64, 37.93],
  wangchuan: [109.07, 34.14],
  // 李清照地点
  zhangqiu: [117.55, 36.72],
  jinan: [117.00, 36.65],
  qingzhou: [118.48, 36.69],
  jiankang: [118.78, 32.04],
  // 陶渊明地点
  jiujiang: [115.97, 29.71],
  xunyang: [115.97, 29.71],
  pengze: [116.55, 29.92],
  lixian: [115.78, 29.62],
  nanluo: [115.78, 29.62],
  // 新增旅行地点
  tianjin: [117.36, 39.34],
  tianmen: [113.16, 30.65],
  chizhou: [117.48, 30.66],
  jiande: [119.55, 29.48],
  jingmen: [112.20, 31.03],
  jianmen: [105.57, 32.40],
  changli: [119.16, 39.81],
  beidaihe: [119.50, 39.83],
  tianshui: [105.72, 34.58],
  lanzhou: [103.83, 36.06],
  wuwei: [102.64, 37.93],
  dunhuang: [94.66, 40.14],
  pucheng: [109.58, 34.57],
  yueyang: [113.10, 29.36],
  zhongnan: [108.88, 33.98],
  // 辛弃疾地点
  licheng: [117.05, 36.65],
  jinhua: [119.65, 29.12],
  linan: [120.155, 30.274],
  shangrao: [117.95, 28.47],
  zhenjiang: [119.43, 32.19],
  yanshan: [117.71, 28.32],
  // 陆游地点
  "shanyin-origin": [120.58, 30.03],
  shanyin: [120.58, 30.03],
  jiannan: [104.07, 30.66],
  shenyuan: [120.58, 30.03],
  // 杜牧地点
  jingzhao: [108.94, 34.34],
  yangzhou: [119.41, 32.39],
  xuanzhou: [118.76, 30.94],
  huzhou: [120.09, 30.89],
  fanchuan: [108.94, 34.34]
};

const MODERN_CITY_NAMES = {
  // 苏轼
  meishan: "眉山",
  kaifeng: "开封",
  fengxiang: "凤翔",
  hangzhou: "杭州",
  mizhou: "诸城",
  xuzhou: "徐州",
  huzhou: "湖州",
  huangzhou: "黄冈",
  huizhou: "惠州",
  danzhou: "儋州",
  changzhou: "常州",
  // 李白
  qinglian: "江油",
  emei: "峨眉山",
  yuzhou: "重庆",
  jiangling: "荆州",
  jinling: "南京",
  yangzhou: "扬州",
  anlu: "安陆",
  changan: "西安",
  luoyang: "洛阳",
  yanzhou: "兖州",
  xuancheng: "宣城",
  lushan: "庐山",
  yelang: "桐梓",
  baidicheng: "奉节",
  dangtu: "当涂",
  // 成吉思汗
  khentii: "肯特山",
  onon: "鄂嫩河",
  "xingqing-early": "银川",
  yehuling: "张家口",
  zhongdu: "北京",
  balasagun: "托克马克",
  otrar: "奥特拉尔",
  bukhara: "布哈拉",
  samarkand: "撒马尔罕",
  gurganj: "库尼亚乌尔根奇",
  indus: "印度河",
  "xingqing-final": "银川",
  // 旅行路线中的额外地点
  chengdu: "成都",
  emeishan: "峨眉山",
  chongqing: "重庆",
  wuhan: "武汉",
  guangzhou: "广州",
  zhuhai: "珠海",
  shaoxing: "绍兴",
  // 杜甫地点
  gongyi: "巩义",
  fengxian: "蒲城",
  fuzhou: "富县",
  kuizhou: "奉节",
  leiyang: "耒阳",
  // 白居易地点
  xinzheng: "新郑",
  zhouzhi: "周至",
  jiangzhou: "九江",
  suzhou: "苏州",
  xiangshan: "洛阳龙门",
  // 王维地点
  puzhou: "永济",
  jizhou: "济宁",
  zhongnanshan: "终南山",
  hexi: "武威",
  wangchuan: "蓝田",
  // 李清照地点
  zhangqiu: "章丘",
  jinan: "济南",
  qingzhou: "青州",
  jiankang: "南京",
  // 陶渊明地点
  jiujiang: "九江",
  xunyang: "浔阳",
  pengze: "彭泽",
  lixian: "栗里",
  nanluo: "南山",
  // 新增旅行地点
  tianjin: "天津",
  tianmen: "天门",
  chizhou: "池州",
  jiande: "建德",
  jingmen: "荆门",
  jianmen: "剑门",
  changli: "昌黎",
  beidaihe: "北戴河",
  tianshui: "天水",
  lanzhou: "兰州",
  wuwei: "武威",
  dunhuang: "敦煌",
  pucheng: "蒲城",
  yueyang: "岳阳",
  zhongnan: "终南山",
  // 辛弃疾地点
  licheng: "济南历城",
  jinhua: "金华",
  linan: "杭州",
  shangrao: "上饶",
  zhenjiang: "镇江",
  yanshan: "铅山",
  // 陆游地点
  "shanyin-origin": "绍兴",
  shanyin: "绍兴",
  jiannan: "成都",
  shenyuan: "绍兴沈园",
  // 杜牧地点
  jingzhao: "西安",
  yangzhou: "扬州",
  xuanzhou: "宣城",
  huzhou: "湖州",
  fanchuan: "西安樊川"
};

let points = [];
let tooltipTimer = null;
let routePathTimer = null;
let routeStopMarkers = [];
let routeCarriageMarker = null;
let routeCarriageAnimation = null;
let markers = [];
let journeys = {};
let peopleCatalog = [];
let poems = {};
let activeJourney = null;
let activeIndex = 0;
let loadingJourneyId = "";
let activePoem = null;
let reciteState = { playing: false, paused: false, currentIndex: -1 };
let activeMode = "map";
let cityModeActive = false;
let cityCardToken = 0;
let travelCache = {};
let activeTravel = null;
let travelSpeechState = { playing: false, paused: false, currentIndex: -1 };
let autoTourTimer = null;
let routesData = null;
let gradeRoutesData = null;
let routeDetailOrigin = "popular";
const TAB_PANEL_MAP = { original: "poemBodyOriginal", annotate: "poemBodyAnnotated", recite: "poemBodyRecite" };
const STORY_TAB_PANEL_MAP = { node: "storyTabNode", life: "storyTabLife", culture: "storyTabCulture" };
const CONTEXT_SECTIONS = [
  { key: "society", label: "社会环境" },
  { key: "life", label: "人生际遇" },
  { key: "cityHistory", label: "城市历史" },
  { key: "geography", label: "地理知识" },
  { key: "customs", label: "风土人情" }
];

/* ===== 背景音乐（古风 Web Audio 合成） ===== */
const MUSIC_STYLES = ["jiangnan", "bashu", "saibei", "zhongyuan", "lingnan", "tianyuan"];

const MUSIC_NAMES = {
  jiangnan: "江南水乡",
  bashu: "巴蜀山歌",
  saibei: "塞北长调",
  zhongyuan: "中原古韵",
  lingnan: "岭南风情",
  tianyuan: "田园归隐"
};

const CITY_MUSIC_MAP = {
  // 江南水乡
  hangzhou: "jiangnan", suzhou: "jiangnan", wuzhen: "jiangnan", shaoxing: "jiangnan",
  huzhou: "jiangnan", changzhou: "jiangnan", mizhou: "jiangnan", xuzhou: "jiangnan",
  jiangling: "jiangnan", jinling: "jiangnan", jiankang: "jiangnan", yangzhou: "jiangnan",
  anlu: "jiangnan", xuancheng: "jiangnan", lushan: "jiangnan", dangtu: "jiangnan",
  jiangzhou: "jiangnan", jizhou: "jiangnan", zhangqiu: "jiangnan", jinan: "jiangnan",
  qingzhou: "jiangnan", jiujiang: "jiangnan", wuhu: "jiangnan", qingdao: "jiangnan",
  wuhan: "jiangnan", tianjin: "jiangnan", tianmen: "jiangnan", chizhou: "jiangnan",
  jiande: "jiangnan", jingmen: "jiangnan", changli: "jiangnan", beidaihe: "jiangnan",
  yueyang: "jiangnan", yanzhou: "jiangnan", huangzhou: "jiangnan",
  // 巴蜀山地
  meishan: "bashu", emei: "bashu", emeishan: "bashu", chengdu: "bashu", chongqing: "bashu",
  yuzhou: "bashu", yelang: "bashu", baidicheng: "bashu", kuizhou: "bashu",
  qinglian: "bashu", jianmen: "bashu",
  // 塞北边塞
  hexi: "saibei", lanzhou: "saibei", wuwei: "saibei", dunhuang: "saibei",
  tianshui: "saibei", changli: "saibei",
  // 中原古都
  changan: "zhongyuan", luoyang: "zhongyuan", kaifeng: "zhongyuan", fengxiang: "zhongyuan",
  xinzheng: "zhongyuan", zhouzhi: "zhongyuan", xiangshan: "zhongyuan", puzhou: "zhongyuan",
  zhongnanshan: "zhongyuan", zhongnan: "zhongyuan", wangchuan: "zhongyuan",
  gongyi: "zhongyuan", fengxian: "zhongyuan", fuzhou: "zhongyuan", pucheng: "zhongyuan",
  // 岭南风情
  guangzhou: "lingnan", zhuhai: "lingnan", huizhou: "lingnan", danzhou: "lingnan",
  leiyang: "lingnan",
  // 田园归隐
  xunyang: "tianyuan", pengze: "tianyuan", lixian: "tianyuan", nanluo: "tianyuan"
};

// 诗人 ID → 主导音乐风格（用于切换人物时匹配）
const POET_MUSIC_MAP = {
  sushi: "jiangnan",
  libai: "bashu",
  dufu: "zhongyuan",
  baijiuyi: "zhongyuan",
  wangwei: "tianyuan",
  liqingzhao: "jiangnan",
  taoyuanming: "tianyuan",
  genghis: "saibei"
};

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    projection: { type: "globe" },
    sources: {},
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#c3d3cf" } }
    ]
  },
  center: [105, 34],
  zoom: 2.7,
  pitch: 0,
  bearing: 0,
  minZoom: 2.4,
  maxZoom: 12.5,
  maxPitch: 75,
  renderWorldCopies: false,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

function fitHome(duration = 700) {
  map.fitBounds(homeBounds(), {
    padding: HOME_PADDING,
    pitch: 0,
    bearing: 0,
    duration
  });
}

function homeBounds() {
  if (activeJourney?.bounds) return activeJourney.bounds;
  const routePoints = activeJourney?.points || points;
  if (!routePoints.length) return DEFAULT_BOUNDS;

  const lngs = routePoints.map((point) => point.lnglat[0]);
  const lats = routePoints.map((point) => point.lnglat[1]);
  let west = Math.min(...lngs);
  let east = Math.max(...lngs);
  let south = Math.min(...lats);
  let north = Math.max(...lats);

  if (west === east) {
    west -= 1;
    east += 1;
  }
  if (south === north) {
    south -= 1;
    north += 1;
  }

  const lngPad = Math.max((east - west) * 0.14, 1.2);
  const latPad = Math.max((north - south) * 0.14, 1.2);
  return [
    [Math.max(-180, west - lngPad), Math.max(-85, south - latPad)],
    [Math.min(180, east + lngPad), Math.min(85, north + latPad)]
  ];
}

function setLoaderHidden() {
  const loader = document.getElementById("loader");
  loader.classList.add("hide");
  window.setTimeout(() => loader.remove(), 420);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法载入 ${url}`);
  return response.json();
}

function addReliefTiles() {
  map.addSource("relief-global", {
    type: "raster",
    tiles: [RELIEF_TILES],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 3
  });
  map.addSource("relief-cn", {
    type: "raster",
    tiles: [RELIEF_TILES],
    tileSize: 256,
    minzoom: 4,
    maxzoom: 6,
    bounds: REGIONAL_RELIEF_TILE_BOUNDS
  });
  map.addLayer({
    id: "relief-global-img",
    type: "raster",
    source: "relief-global",
    paint: {
      "raster-fade-duration": 0,
      "raster-opacity": ["interpolate", ["linear"], ["zoom"], 1.8, .95, 6.8, .46, 10, .28, 12, .2]
    }
  });
  map.addLayer({
    id: "relief-cn-img",
    type: "raster",
    source: "relief-cn",
    paint: {
      "raster-fade-duration": 0,
      "raster-opacity": ["interpolate", ["linear"], ["zoom"], 3.8, 0, 4.6, .92, 7.2, .58, 9.5, .36, 12, .24]
    }
  });
}

function addChinaLayers(china) {
  map.addSource("china", { type: "geojson", data: china });
  map.addLayer({
    id: "relief-base",
    type: "fill",
    source: "china",
    paint: { "fill-color": "#aebd8a", "fill-opacity": 1 }
  }, "relief-global-img");
  map.addLayer({
    id: "prov-fill",
    type: "fill",
    source: "china",
    paint: {
      "fill-color": "#e8d2a8",
      "fill-opacity": 0.14
    }
  });
  map.addLayer({
    id: "prov-line",
    type: "line",
    source: "china",
    paint: { "line-color": "#a98e5f", "line-width": 0.75, "line-opacity": 0.72 }
  });
  map.addLayer({
    id: "country-line",
    type: "line",
    source: "china",
    paint: { "line-color": "#7c5b31", "line-width": 1.9, "line-opacity": 0.66 }
  });

  china.features.forEach((feature) => {
    const center = feature.properties && (feature.properties.center || feature.properties.centroid);
    if (!center) return;
    const el = document.createElement("div");
    el.className = "province-label";
    el.textContent = feature.properties.name.replace(/(维吾尔|壮族|回族)?自治区|特别行政区|省|市/g, "");
    Object.assign(el.style, {
      color: "#7d6536",
      font: "600 12px Kaiti SC, STKaiti, KaiTi, serif",
      letterSpacing: "2px",
      pointerEvents: "none",
      opacity: ".72"
    });
    new maplibregl.Marker({ element: el }).setLngLat(center).addTo(map);
  });
}

function addMask(outline) {
  const holes = [];
  outline.features.forEach((feature) => {
    const geometry = feature.geometry;
    if (!geometry) return;
    const polygons = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
    polygons.forEach((polygon) => {
      if (polygon && polygon[0]) holes.push(polygon[0]);
    });
  });
  map.addSource("mask", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], ...holes]
      }
    }
  });
  map.addLayer({
    id: "mask",
    type: "fill",
    source: "mask",
    paint: {
      "fill-color": "#ece1c6",
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 2.4, .42, 4, .22, 5.2, .06, 6, 0]
    }
  }, "prov-line");
}

function addWater(rivers, lakes) {
  map.addSource("rivers", { type: "geojson", data: rivers });
  map.addSource("lakes", { type: "geojson", data: lakes });
  const before = map.getLayer("mask") ? "mask" : "prov-line";
  map.addLayer({
    id: "lakes",
    type: "fill",
    source: "lakes",
    paint: { "fill-color": "#8cb8bf", "fill-opacity": 0.78 }
  }, before);
  map.addLayer({
    id: "rivers-under",
    type: "line",
    source: "rivers",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#4f7d8c",
      "line-opacity": 0.42,
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.6, 7, 4.4]
    }
  }, before);
  map.addLayer({
    id: "rivers",
    type: "line",
    source: "rivers",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#8fc0c6",
      "line-opacity": 0.95,
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, .75, 7, 2.1]
    }
  }, before);
}

function addTerrainSources() {
  const dem = {
    type: "raster-dem",
    encoding: "terrarium",
    tiles: [DEM_TILES],
    tileSize: 256,
    maxzoom: 8,
    bounds: DEM_BOUNDS
  };
  map.addSource("dem", dem);
  map.addSource("dem-hs", { ...dem });
  map.addLayer({
    id: "hillshade",
    type: "hillshade",
    source: "dem-hs",
    minzoom: 4.8,
    paint: {
      "hillshade-shadow-color": "#6e4f2c",
      "hillshade-highlight-color": "#fff6dd",
      "hillshade-accent-color": "#8a6a3f",
      "hillshade-exaggeration": 0.18
    }
  }, "prov-line");
}

function makeRoute() {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points.map((point) => point.lnglat)
    }
  };
}

function typeLabel(type) {
  return activeJourney.types[type]?.label || type;
}

function typeColor(type) {
  return activeJourney.types[type]?.color || "#9c2f1b";
}

function modernNameFor(point) {
  if (!point || !point.id) return "";
  const modern = MODERN_CITY_NAMES[point.id];
  if (!modern) return "";
  if (modern === point.name || modern === point.short) return "";
  return modern;
}

function clearMarkers() {
  markers.forEach(({ marker }) => marker.remove());
  markers = [];
}

function addRouteLayer() {
  map.addSource("journey-route", { type: "geojson", data: makeRoute() });
  map.addLayer({
    id: "journey-route",
    type: "line",
    source: "journey-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#9c2f1b",
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 3, .38, 6, .18],
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, .9, 7, 2],
      "line-dasharray": [2, 2]
    }
  });
}

function renderMarkers() {
  clearMarkers();
  points.forEach((point, index) => {
    const el = document.createElement("button");
    el.className = `journey-marker type-${point.type}`;
    el.type = "button";
    el.setAttribute("aria-label", `查看${point.name}`);
    el.dataset.type = point.type;
    const modern = modernNameFor(point);
    el.innerHTML = `<span class="flag" style="background:${typeColor(point.type)}"><span class="seal">${activeJourney.seal}</span><span class="name">${point.short}</span>${modern ? `<span class="modern-name">现${modern}</span>` : ""}</span><span class="pole" style="background:${typeColor(point.type)}"></span><span class="dot" style="background:${typeColor(point.type)}"></span>`;
    el.addEventListener("click", () => selectPoint(index, true));
    el.addEventListener("mouseenter", () => showCityTooltip(point, el));
    el.addEventListener("mouseleave", () => hideCityTooltip());
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(point.lnglat).addTo(map);
    markers.push({ point, marker, el });
  });
}

const MAP_MODE_TITLE = {
  kicker: "真实山河 · 文学行旅 · 可漫游叙事地图",
  heading: "诗词地图",
  subtitle: "从城市到山川，把诗人的足迹落回大地",
  searchPlaceholder: "城市、诗人、诗文"
};

function renderTitle() {
  if (activeMode === "map") {
    document.title = `${MAP_MODE_TITLE.heading} | 山河叙事地图`;
    document.getElementById("titleKicker").textContent = MAP_MODE_TITLE.kicker;
    document.getElementById("titleHeading").textContent = MAP_MODE_TITLE.heading;
    document.getElementById("titleSubtitle").textContent = MAP_MODE_TITLE.subtitle;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.placeholder = MAP_MODE_TITLE.searchPlaceholder;
    return;
  }
  document.title = `${activeJourney.heading} | 山河叙事地图`;
  document.getElementById("titleKicker").textContent = activeJourney.kicker;
  document.getElementById("titleHeading").textContent = activeJourney.heading;
  document.getElementById("titleSubtitle").textContent = activeJourney.subtitle;
  document.getElementById("searchInput").placeholder = activeJourney.searchPlaceholder;
}

function renderTimeline() {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = points.map((point, index) => {
    const modern = modernNameFor(point);
    return `
    <li data-index="${index}">
      <time>${point.years.split("-")[0]}</time>
      <div>
        <b>${point.name}${modern ? ` <span class="modern-name">现${modern}</span>` : ""}</b>
        <span>${typeLabel(point.type)} · ${point.works[0] || "生平节点"}</span>
      </div>
    </li>
  `;
  }).join("");
  timeline.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => selectPoint(Number(item.dataset.index), true));
  });
}

function selectPoint(index, fly) {
  activeIndex = (index + points.length) % points.length;
  const point = points[activeIndex];
  const poem = poemForPoint(point);
  document.getElementById("storyYears").textContent = point.years;
  const modern = modernNameFor(point);
  document.getElementById("storyTitle").innerHTML = `${point.name} · ${typeLabel(point.type)}${modern ? ` <span class="modern-name">现${modern}</span>` : ""}`;
  document.getElementById("storyText").textContent = point.summary;
  document.getElementById("storyWorks").innerHTML = point.works.map((work) => `<span>${work}</span>`).join("");
  document.getElementById("storyQuote").textContent = point.quote;
  document.getElementById("poemOpen").hidden = !poem;
  document.getElementById("progressText").textContent = `第 ${activeIndex + 1} / ${points.length} 站`;
  document.getElementById("progressBar").style.transform = `scaleX(${(activeIndex + 1) / points.length})`;
  markers.forEach((marker, i) => marker.el.classList.toggle("active", i === activeIndex));
  document.querySelectorAll(".timeline li").forEach((item) => {
    item.classList.toggle("on", Number(item.dataset.index) === activeIndex);
  });

  // 根据当前城市自动切换背景音乐
  if (point.id) musicEngine.applyForLocation(point.id);

  const hasContext = !!point.context;
  renderStoryContext(point);
  renderStoryCulture(point);
  document.querySelector('.story-tab[data-tab="life"]').hidden = !hasContext;
  document.querySelector('.story-tab[data-tab="culture"]').hidden = !hasContext;
  const activeStoryTab = document.querySelector(".story-tab.active");
  if (activeStoryTab && activeStoryTab.hidden) switchStoryTab("node");

  updateTravelButton(point);

  if (fly) {
    map.flyTo({
      center: point.lnglat,
      zoom: Math.max(map.getZoom(), 5.7),
      pitch: 0,
      bearing: 0,
      duration: 1500,
      curve: 1.42,
      essential: true
    });
  }
}

function poemForPoint(point) {
  const title = point.poem || point.works.find((work) => poems[work]);
  if (!title || !poems[title]) return null;
  return { title, ...poems[title] };
}

function openPoemModal(titleOverride) {
  const point = points[activeIndex];
  let poem;
  let locationName = point ? point.name : "";
  if (titleOverride && poems[titleOverride]) {
    poem = { title: titleOverride, ...poems[titleOverride] };
    locationName = "";
  } else {
    poem = poemForPoint(point);
  }
  if (!poem) return;
  activePoem = poem;
  stopRecite();

  const modal = document.getElementById("poemModal");
  const body = document.getElementById("poemBodyOriginal");
  const annotate = document.getElementById("poemBodyAnnotated");
  const recite = document.getElementById("poemBodyRecite");

  document.getElementById("poemAuthor").textContent = locationName ? `${poem.author} · ${locationName}` : poem.author;
  document.getElementById("poemTitle").textContent = poem.title;

  body.replaceChildren();
  poem.body.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    body.appendChild(p);
  });

  annotate.replaceChildren();
  const hasAnnotate = poem.pinyin || poem.annotations || poem.glossary;
  if (hasAnnotate) {
    poem.body.forEach((line, i) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "poem-line-annotated";

      const pinyinLine = (poem.pinyin && poem.pinyin[i]) || "";
      const textDiv = document.createElement("div");
      textDiv.className = "poem-text-annotated";
      buildAnnotatedLine(line, pinyinLine, poem.glossary).forEach((node) => textDiv.appendChild(node));

      lineDiv.appendChild(textDiv);

      if (poem.annotations && poem.annotations[i]) {
        const annDiv = document.createElement("div");
        annDiv.className = "poem-annotation";
        annDiv.textContent = poem.annotations[i];
        lineDiv.appendChild(annDiv);
      }
      annotate.appendChild(lineDiv);
    });
  }

  renderRecitePanel(poem);

  document.querySelector('.poem-tab[data-tab="annotate"]').hidden = !hasAnnotate;
  document.querySelector('.poem-tab[data-tab="recite"]').hidden = !poem.body || poem.body.length === 0;

  switchPoemTab("original");
  closeGlossCard();
  updateGlossarySource(poem.title);

  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("poemClose").focus();
}

function closePoemModal() {
  stopRecite();
  closeGlossCard();
  activePoem = null;
  document.getElementById("poemModal").hidden = true;
  document.body.classList.remove("modal-open");
  document.getElementById("poemOpen").focus();
}

function switchPoemTab(tabName) {
  const tab = document.querySelector(`.poem-tab[data-tab="${tabName}"]`);
  if (!tab || tab.hidden) tabName = "original";
  document.querySelectorAll(".poem-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tabName);
  });
  const panelId = TAB_PANEL_MAP[tabName];
  document.querySelectorAll(".poem-tab-content").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
  closeGlossCard();
  if (tabName !== "recite") stopRecite();
}

function buildAnnotatedLine(line, pinyinStr, glossary) {
  const pinyinSyllables = pinyinStr
    ? (pinyinStr.match(/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹ]+/g) || [])
    : [];

  const glossaryRanges = [];
  if (glossary && glossary.length) {
    const sorted = [...glossary].sort((a, b) => b.word.length - a.word.length);
    let searchStart = 0;
    while (searchStart < line.length) {
      let found = null;
      for (const entry of sorted) {
        const idx = line.indexOf(entry.word, searchStart);
        if (idx !== -1 && (found === null || idx < found.idx)) {
          found = { idx, entry };
        }
      }
      if (!found) break;
      const overlap = glossaryRanges.some((r) =>
        (found.idx >= r.start && found.idx < r.end) ||
        (found.idx + found.entry.word.length > r.start && found.idx + found.entry.word.length <= r.end)
      );
      if (!overlap) {
        glossaryRanges.push({
          start: found.idx,
          end: found.idx + found.entry.word.length,
          entry: found.entry
        });
      }
      searchStart = found.idx + found.entry.word.length;
    }
    glossaryRanges.sort((a, b) => a.start - b.start);
  }

  const chars = [...line];
  const nodes = [];
  let syllableIdx = 0;
  let pos = 0;

  const makeRuby = (char) => {
    if (!pinyinStr) return document.createTextNode(char);
    const py = pinyinSyllables[syllableIdx] || "";
    syllableIdx++;
    const ruby = document.createElement("ruby");
    ruby.textContent = char;
    const rt = document.createElement("rt");
    rt.textContent = py;
    ruby.appendChild(rt);
    return ruby;
  };

  while (pos < chars.length) {
    const range = glossaryRanges.find((r) => r.start === pos);
    if (range) {
      const span = document.createElement("span");
      span.className = "glossary-word";
      span.dataset.word = range.entry.word;
      span.addEventListener("click", (e) => showGlossCard(range.entry, e));
      for (let i = range.start; i < range.end; i++) {
        if (/[\u4e00-\u9fff]/.test(chars[i])) {
          span.appendChild(makeRuby(chars[i]));
        } else {
          span.appendChild(document.createTextNode(chars[i]));
        }
      }
      nodes.push(span);
      pos = range.end;
    } else {
      if (/[\u4e00-\u9fff]/.test(chars[pos])) {
        nodes.push(makeRuby(chars[pos]));
      } else {
        nodes.push(document.createTextNode(chars[pos]));
      }
      pos++;
    }
  }
  return nodes;
}

function showGlossCard(entry, event) {
  closeGlossCard();
  const sourceTitle = activePoem ? activePoem.title : "";
  const inBook = isInGlossary(entry.word, sourceTitle);
  const card = document.createElement("div");
  card.className = "glossary-card";
  card.innerHTML = `
    <button class="glossary-card-close" type="button">×</button>
    <div class="glossary-card-head">
      <span class="glossary-card-word">${entry.word}</span>
      <span class="glossary-card-pinyin">${entry.pinyin || ""}</span>
    </div>
    <p class="glossary-card-meaning">${entry.meaning || ""}</p>
    ${entry.example ? `<p class="glossary-card-example">例：${entry.example}</p>` : ""}
    <button class="glossary-card-add" type="button">${inBook ? "已收藏" : "加入生字本"}</button>
  `;
  document.body.appendChild(card);

  const rect = event.target.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  let top = rect.bottom + 8;
  let left = rect.left;
  if (left + cardRect.width > window.innerWidth - 12) {
    left = window.innerWidth - cardRect.width - 12;
  }
  if (top + cardRect.height > window.innerHeight - 12) {
    top = rect.top - cardRect.height - 8;
  }
  card.style.top = `${Math.max(12, top)}px`;
  card.style.left = `${Math.max(12, left)}px`;

  card.querySelector(".glossary-card-close").addEventListener("click", closeGlossCard);
  card.querySelector(".glossary-card-add").addEventListener("click", () => {
    if (isInGlossary(entry.word, sourceTitle)) {
      removeFromGlossary(entry.word, sourceTitle);
      card.querySelector(".glossary-card-add").textContent = "加入生字本";
    } else {
      addToGlossary({
        word: entry.word,
        pinyin: entry.pinyin || "",
        meaning: entry.meaning || "",
        example: entry.example || "",
        poemTitle: sourceTitle
      });
      card.querySelector(".glossary-card-add").textContent = "已收藏";
    }
  });

  setTimeout(() => {
    document.addEventListener("click", glossCardOutsideClick, true);
  }, 0);
}

function glossCardOutsideClick(event) {
  const card = document.querySelector(".glossary-card");
  if (!card) return;
  if (!card.contains(event.target) && !event.target.classList.contains("glossary-word")) {
    closeGlossCard();
  }
}

function closeGlossCard() {
  const card = document.querySelector(".glossary-card");
  if (card) card.remove();
  document.removeEventListener("click", glossCardOutsideClick, true);
}

function renderRecitePanel(poem) {
  const recite = document.getElementById("poemBodyRecite");
  recite.replaceChildren();
  if (!poem.body || !poem.body.length) return;

  const progress = getReciteProgress(poem.title);
  const total = poem.body.length;
  const speechAvailable = "speechSynthesis" in window;

  const progressDiv = document.createElement("div");
  progressDiv.className = "recite-progress";
  progressDiv.innerHTML = `
    <span class="recite-progress-text">已背诵 ${progress.length} / ${total} 句</span>
    <i class="recite-progress-bar"><b style="transform: scaleX(${total ? progress.length / total : 0})"></b></i>
  `;
  recite.appendChild(progressDiv);

  if (speechAvailable) {
    const controls = document.createElement("div");
    controls.className = "recite-controls";
    const readBtn = document.createElement("button");
    readBtn.type = "button";
    readBtn.className = "recite-read-btn";
    readBtn.textContent = "跟读";
    readBtn.addEventListener("click", toggleRecite);
    controls.appendChild(readBtn);
    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "recite-stop-btn";
    stopBtn.textContent = "停止";
    stopBtn.hidden = true;
    stopBtn.addEventListener("click", stopRecite);
    controls.appendChild(stopBtn);
    recite.appendChild(controls);
  }

  poem.body.forEach((line, i) => {
    const lineDiv = document.createElement("div");
    lineDiv.className = "recite-line";
    lineDiv.dataset.index = i;
    if (progress.includes(i)) lineDiv.classList.add("mastered");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "recite-toggle-btn";
    toggleBtn.textContent = "隐藏";
    toggleBtn.addEventListener("click", () => toggleReciteLineVisibility(i, toggleBtn));

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "recite-checkbox";
    checkbox.checked = progress.includes(i);
    checkbox.addEventListener("change", () => toggleReciteLine(i, checkbox.checked));

    const textSpan = document.createElement("span");
    textSpan.className = "recite-text";
    textSpan.textContent = line;

    lineDiv.appendChild(toggleBtn);
    lineDiv.appendChild(checkbox);
    lineDiv.appendChild(textSpan);
    recite.appendChild(lineDiv);
  });
}

function toggleReciteLineVisibility(index, btn) {
  if (!activePoem) return;
  const lineDiv = document.querySelector(`.recite-line[data-index="${index}"]`);
  if (!lineDiv) return;
  const textSpan = lineDiv.querySelector(".recite-text");
  if (lineDiv.classList.contains("hidden")) {
    textSpan.textContent = activePoem.body[index];
    lineDiv.classList.remove("hidden");
    btn.textContent = "隐藏";
  } else {
    textSpan.textContent = "······";
    lineDiv.classList.add("hidden");
    btn.textContent = "显示";
  }
}

function makePlaceholder(line) {
  return line.replace(/[\u4e00-\u9fff]/g, "▓");
}

function toggleReciteLine(index, checked) {
  if (!activePoem) return;
  const progress = getReciteProgress(activePoem.title);
  const set = new Set(progress);
  if (checked) set.add(index);
  else set.delete(index);
  const newProgress = [...set].sort((a, b) => a - b);
  setReciteProgress(activePoem.title, newProgress);

  const lineDiv = document.querySelector(`.recite-line[data-index="${index}"]`);
  if (lineDiv) {
    if (checked) {
      lineDiv.classList.add("mastered");
    } else {
      lineDiv.classList.remove("mastered");
    }
  }

  const total = activePoem.body.length;
  const progressText = document.querySelector(".recite-progress-text");
  const progressBar = document.querySelector(".recite-progress-bar b");
  if (progressText) progressText.textContent = `已背诵 ${newProgress.length} / ${total} 句`;
  if (progressBar) progressBar.style.transform = `scaleX(${total ? newProgress.length / total : 0})`;
}

function toggleRecite() {
  if (!activePoem) return;
  if (reciteState.playing && !reciteState.paused) {
    speechSynthesis.pause();
    reciteState.paused = true;
    updateReciteButton();
  } else if (reciteState.playing && reciteState.paused) {
    speechSynthesis.resume();
    reciteState.paused = false;
    updateReciteButton();
  } else {
    startRecite();
  }
}

function startRecite() {
  if (!activePoem) return;
  reciteState.playing = true;
  reciteState.paused = false;
  reciteState.currentIndex = 0;
  speakLine(0);
  updateReciteButton();
}

function speakLine(index) {
  if (!reciteState.playing || !activePoem) return;
  if (index >= activePoem.body.length) {
    stopRecite();
    return;
  }
  reciteState.currentIndex = index;
  document.querySelectorAll(".recite-line").forEach((el, i) => {
    el.classList.toggle("reciting", i === index);
  });
  const utterance = new SpeechSynthesisUtterance(activePoem.body[index]);
  utterance.lang = "zh-CN";
  utterance.rate = 0.8;
  utterance.onend = () => {
    if (reciteState.playing && !reciteState.paused) {
      speakLine(index + 1);
    }
  };
  speechSynthesis.speak(utterance);
}

function stopRecite() {
  reciteState.playing = false;
  reciteState.paused = false;
  reciteState.currentIndex = -1;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  document.querySelectorAll(".recite-line").forEach((el) => {
    el.classList.remove("reciting");
  });
  updateReciteButton();
}

function updateReciteButton() {
  const readBtn = document.querySelector(".recite-read-btn");
  const stopBtn = document.querySelector(".recite-stop-btn");
  if (!readBtn) return;
  if (reciteState.playing && !reciteState.paused) {
    readBtn.textContent = "暂停";
    if (stopBtn) stopBtn.hidden = false;
  } else if (reciteState.playing && reciteState.paused) {
    readBtn.textContent = "继续";
    if (stopBtn) stopBtn.hidden = false;
  } else {
    readBtn.textContent = "跟读";
    if (stopBtn) stopBtn.hidden = true;
  }
}

function getReciteProgress(title) {
  try {
    return JSON.parse(localStorage.getItem(`recite_progress_${title}`) || "[]");
  } catch {
    return [];
  }
}

function setReciteProgress(title, indices) {
  try {
    localStorage.setItem(`recite_progress_${title}`, JSON.stringify(indices));
  } catch {
    /* ignore */
  }
}

function getGlossary() {
  try {
    return JSON.parse(localStorage.getItem("glossary_book") || "[]");
  } catch {
    return [];
  }
}

function isInGlossary(word, poemTitle) {
  return getGlossary().some((item) => item.word === word && item.poemTitle === poemTitle);
}

function addToGlossary(item) {
  const book = getGlossary();
  if (book.some((existing) => existing.word === item.word && existing.poemTitle === item.poemTitle)) return;
  book.push({
    word: item.word,
    pinyin: item.pinyin || "",
    meaning: item.meaning || "",
    example: item.example || "",
    poemTitle: item.poemTitle || "",
    addedAt: Date.now()
  });
  localStorage.setItem("glossary_book", JSON.stringify(book));
  updateGlossaryCount();
}

function removeFromGlossary(word, poemTitle) {
  const book = getGlossary();
  const filtered = book.filter((item) => !(item.word === word && item.poemTitle === poemTitle));
  localStorage.setItem("glossary_book", JSON.stringify(filtered));
  updateGlossaryCount();
  renderGlossaryList();
}

function updateGlossaryCount() {
  const count = getGlossary().length;
  document.getElementById("glossaryCount").textContent = count;
}

function updateGlossarySource(title) {
  const select = document.getElementById("glossarySource");
  const currentValue = select.value;
  const book = getGlossary();
  const sources = [...new Set(book.map((item) => item.poemTitle))];
  if (title && !sources.includes(title)) sources.push(title);
  select.innerHTML = '<option value="">全部</option>' +
    sources.map((s) => `<option value="${s}">${s}</option>`).join("");
  if (sources.includes(currentValue)) select.value = currentValue;
}

function renderGlossaryList() {
  const list = document.getElementById("glossaryList");
  const filter = document.getElementById("glossarySource").value;
  const book = getGlossary();
  const filtered = filter ? book.filter((item) => item.poemTitle === filter) : book;

  if (!filtered.length) {
    list.innerHTML = '<p class="glossary-empty">尚无收藏字词</p>';
    return;
  }

  list.innerHTML = filtered.map((item) => `
    <div class="glossary-book-item">
      <div class="glossary-item-head">
        <span class="glossary-item-word">${item.word}</span>
        <span class="glossary-item-pinyin">${item.pinyin}</span>
      </div>
      <p class="glossary-item-meaning">${item.meaning}</p>
      ${item.example ? `<p class="glossary-item-example">例：${item.example}</p>` : ""}
      <p class="glossary-item-source">出自：${item.poemTitle}</p>
      <button class="glossary-item-remove" type="button" data-word="${item.word}" data-poem="${item.poemTitle}">移除</button>
    </div>
  `).join("");

  list.querySelectorAll(".glossary-item-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromGlossary(btn.dataset.word, btn.dataset.poem);
    });
  });
}

function toggleGlossary() {
  const panel = document.getElementById("glossaryPanel");
  if (panel.hidden) {
    renderGlossaryList();
    panel.hidden = false;
  } else {
    panel.hidden = true;
  }
}

function closeGlossary() {
  document.getElementById("glossaryPanel").hidden = true;
}

/* ===== Task 5: 故事侧栏标签页 ===== */
function switchStoryTab(tabName) {
  const tab = document.querySelector(`.story-tab[data-tab="${tabName}"]`);
  if (!tab || tab.hidden) tabName = "node";
  document.querySelectorAll(".story-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tabName);
  });
  const panelId = STORY_TAB_PANEL_MAP[tabName];
  document.querySelectorAll(".story-tab-content").forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
}

function makeContextBlock(label, text) {
  const block = document.createElement("section");
  block.className = "context-block";
  const h = document.createElement("h4");
  h.className = "context-title";
  h.textContent = label;
  const p = document.createElement("p");
  p.className = "context-text";
  p.textContent = text;
  block.appendChild(h);
  block.appendChild(p);
  return block;
}

function renderStoryContext(point) {
  const panel = document.getElementById("storyTabLife");
  panel.replaceChildren();
  if (!point.context) {
    const p = document.createElement("p");
    p.className = "story-empty";
    p.textContent = "暂无人生轨迹资料";
    panel.appendChild(p);
    return;
  }
  CONTEXT_SECTIONS.forEach((sec) => {
    if (!point.context[sec.key]) return;
    panel.appendChild(makeContextBlock(sec.label, point.context[sec.key]));
  });
}

function renderStoryCulture(point) {
  const panel = document.getElementById("storyTabCulture");
  panel.replaceChildren();
  if (!point.context) {
    const p = document.createElement("p");
    p.className = "story-empty";
    p.textContent = "暂无城市文化资料";
    panel.appendChild(p);
    return;
  }
  if (point.context.cityHistory) {
    panel.appendChild(makeContextBlock("历史沿革", point.context.cityHistory));
  }
  if (point.context.geography) {
    panel.appendChild(makeContextBlock("地理特征", point.context.geography));
  }
  if (point.context.customs) {
    panel.appendChild(makeContextBlock("风土人情", point.context.customs));
  }
  const landmarksBlock = document.createElement("section");
  landmarksBlock.className = "context-block";
  const lh = document.createElement("h4");
  lh.className = "context-title";
  lh.textContent = "文化地标";
  landmarksBlock.appendChild(lh);
  const landmarksList = document.createElement("div");
  landmarksList.className = "landmarks-list";
  const loading = document.createElement("p");
  loading.className = "landmarks-loading";
  loading.textContent = "加载中…";
  landmarksList.appendChild(loading);
  landmarksBlock.appendChild(landmarksList);
  panel.appendChild(landmarksBlock);

  loadTravel(point.id).then((data) => {
    if (!landmarksList.isConnected) return;
    landmarksList.replaceChildren();
    if (data && data.landmarks && data.landmarks.length) {
      data.landmarks.forEach((lm) => {
        const item = document.createElement("div");
        item.className = "landmark-item";
        const name = document.createElement("strong");
        name.className = "landmark-name";
        name.textContent = lm.name;
        const desc = document.createElement("p");
        desc.className = "landmark-desc";
        desc.textContent = lm.description;
        item.appendChild(name);
        item.appendChild(desc);
        landmarksList.appendChild(item);
      });
    } else {
      const empty = document.createElement("p");
      empty.className = "landmarks-empty";
      empty.textContent = "暂无地标信息";
      landmarksList.appendChild(empty);
    }
  });
}

/* ===== Task 6: 诗人年表 ===== */
function openChronicle() {
  renderChronicle();
  document.getElementById("chronicleTitle").textContent = `${activeJourney.heading} · 年表`;
  document.getElementById("chronicleModal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeChronicle() {
  document.getElementById("chronicleModal").hidden = true;
  document.body.classList.remove("modal-open");
}

function renderChronicle() {
  const list = document.getElementById("chronicleList");
  list.replaceChildren();
  points.forEach((point, index) => {
    const li = document.createElement("li");
    li.className = "chronicle-item";
    li.dataset.index = index;
    const year = point.years.split("-")[0];
    const color = typeColor(point.type);
    const modern = modernNameFor(point);
    li.innerHTML = `
      <div class="chronicle-marker"><span class="chronicle-dot" style="background:${color}"></span><span class="chronicle-line"></span></div>
      <div class="chronicle-content">
        <time class="chronicle-year">${year}</time>
        <strong class="chronicle-name">${point.name}</strong>
        ${modern ? `<span class="modern-name">现${modern}</span>` : ""}
        <span class="chronicle-type">${typeLabel(point.type)}</span>
        ${point.works && point.works.length ? `<span class="chronicle-works">代表作：${point.works.join("、")}</span>` : ""}
      </div>
    `;
    li.addEventListener("click", () => {
      closeChronicle();
      selectPoint(index, true);
    });
    list.appendChild(li);
  });
}

/* ===== 鼠标悬停诗句 tooltip ===== */
function showCityTooltip(point, markerEl) {
  hideCityTooltip();
  tooltipTimer = window.setTimeout(() => {
    if (!point) return;
    const poem = poemForPoint(point);
    let sourceText = "";
    if (poem) {
      sourceText = `《${poem.title}》· ${poem.author || (activeJourney ? activeJourney.heading : "")}`;
    } else if (point.works && point.works.length) {
      sourceText = point.works[0] + (activeJourney ? ` · ${activeJourney.heading}` : "");
    } else if (activeJourney) {
      sourceText = activeJourney.heading;
    }
    const tooltip = document.createElement("div");
    tooltip.className = "city-tooltip";
    tooltip.innerHTML = `
      <p class="tooltip-quote">${point.quote || ""}</p>
      <p class="tooltip-source">${sourceText}</p>
    `;
    document.body.appendChild(tooltip);
    const rect = markerEl.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.top - tipRect.height - 14;
    if (left < 8) left = 8;
    if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
    if (top < 8) {
      top = rect.bottom + 14;
      tooltip.classList.add("below");
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }, 300);
}

function hideCityTooltip() {
  if (tooltipTimer) {
    window.clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
  const tooltip = document.querySelector(".city-tooltip");
  if (tooltip) tooltip.remove();
}

/* ===== 诗词地图：城市维度展示 ===== */
function syncMarkerVisibility() {
  const showFlags = map.getZoom() >= 4.4;
  markers.forEach(({ el, point }) => {
    const flag = el.querySelector(".flag");
    const quote = el.querySelector(".city-quote");
    const show = showFlags || (point.importance || 0) >= 5;
    if (flag) flag.style.opacity = show ? "1" : "0";
    if (quote) quote.style.opacity = show ? "" : "0";
  });
}

async function loadAllCityPoints() {
  await ensureAllJourneysLoaded();
  const cityMap = new Map();
  peopleCatalog.forEach((person) => {
    const journey = journeys[person.id];
    if (!journey || !journey.points) return;
    journey.points.forEach((point) => {
      if (!point.id) return;
      const importance = point.importance || 0;
      const existing = cityMap.get(point.id);
      if (existing && (existing.importance || 0) >= importance) return;
      const typeColor = (journey.types && journey.types[point.type] && journey.types[point.type].color) || "#9c2f1b";
      cityMap.set(point.id, {
        cityId: point.id,
        name: point.name,
        short: point.short,
        modernName: modernNameFor(point),
        lnglat: point.lnglat,
        quote: point.quote || "",
        poemTitle: point.poem || (point.works && point.works[0]) || "",
        poetName: person.name,
        poetSeal: journey.seal || (person.name ? person.name.slice(0, 1) : "诗"),
        type: point.type,
        color: typeColor,
        importance,
        summary: point.summary || "",
        journeyId: journey.id
      });
    });
  });
  return Array.from(cityMap.values());
}

function renderCityMarkers(cityPoints) {
  clearMarkers();
  closeCityInfoCard();
  cityPoints.forEach((city) => {
    const el = document.createElement("button");
    el.className = `journey-marker city-marker type-${city.type}`;
    el.type = "button";
    el.setAttribute("aria-label", `查看${city.name}`);
    const modern = city.modernName;
    el.innerHTML = `
      <span class="flag" style="background:${city.color}">
        <span class="seal">${city.poetSeal}</span>
        <span class="name">${city.short}</span>
        ${modern ? `<span class="modern-name">现${modern}</span>` : ""}
      </span>
      <span class="pole" style="background:${city.color}"></span>
      <span class="dot" style="background:${city.color}"></span>
      ${city.quote ? `<span class="city-quote">${city.quote}</span>` : ""}
    `;
    el.addEventListener("click", () => openCityInfoCard(city, el));
    el.addEventListener("mouseenter", () => showCityTooltip({
      id: city.cityId,
      name: city.name,
      short: city.short,
      quote: city.quote,
      poem: city.poemTitle,
      works: city.poemTitle ? [city.poemTitle] : []
    }, el));
    el.addEventListener("mouseleave", () => hideCityTooltip());
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(city.lnglat).addTo(map);
    markers.push({ point: { ...city, id: city.cityId }, marker, el });
  });
  syncMarkerVisibility();
}

function closeCityInfoCard() {
  const card = document.querySelector(".city-info-card");
  if (card) card.remove();
  document.removeEventListener("click", cityCardOutsideClick, true);
}

function cityCardOutsideClick(event) {
  const card = document.querySelector(".city-info-card");
  if (!card) return;
  if (!card.contains(event.target) && !event.target.closest(".city-marker")) {
    closeCityInfoCard();
  }
}

async function openCityInfoCard(city, markerEl) {
  const token = ++cityCardToken;
  closeCityInfoCard();
  const hasPoem = city.poemTitle && poems[city.poemTitle];
  let travelData = null;
  try {
    travelData = await loadTravel(city.cityId);
  } catch {
    travelData = null;
  }
  if (token !== cityCardToken) return;
  const hasTravel = !!travelData;
  const modern = city.modernName;
  const card = document.createElement("div");
  card.className = "city-info-card";
  // 标记卡片来源：marker 表示来自地图标记（位置随地图移动），
  // route 表示来自路线面板按钮（位置固定，地图移动不应关闭）。
  card.dataset.source = city.type === "route" ? "route" : "marker";
  card.innerHTML = `
    <button class="city-info-close" type="button" aria-label="关闭">×</button>
    <div class="city-info-head">
      <strong>${city.name}</strong>
      ${modern ? `<span class="city-info-modern">现 ${modern}</span>` : ""}
    </div>
    <blockquote class="city-info-quote">${city.quote || "暂无诗句"}</blockquote>
    <p class="city-info-source">《${city.poemTitle || "佚名"}》· ${city.poetName}</p>
    ${city.summary ? `<p class="city-info-summary">${city.summary}</p>` : ""}
    <div class="city-info-actions">
      ${hasPoem ? `<button class="city-info-btn city-info-poem" type="button">查看诗词全文</button>` : ""}
      ${hasTravel ? `<button class="city-info-btn city-info-travel" type="button">查看城市讲解</button>` : ""}
    </div>
  `;
  document.body.appendChild(card);

  const rect = markerEl.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  let left = rect.right + 12;
  let top = rect.top;
  if (left + cardRect.width > window.innerWidth - 12) {
    left = rect.left - cardRect.width - 12;
  }
  if (left < 12) left = 12;
  if (top + cardRect.height > window.innerHeight - 12) {
    top = window.innerHeight - cardRect.height - 12;
  }
  if (top < 12) top = 12;
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;

  card.querySelector(".city-info-close").addEventListener("click", closeCityInfoCard);
  if (hasPoem) {
    card.querySelector(".city-info-poem").addEventListener("click", () => {
      closeCityInfoCard();
      openPoemModal(city.poemTitle);
    });
  }
  if (hasTravel) {
    card.querySelector(".city-info-travel").addEventListener("click", () => openCityTravelModal(city));
  }

  // 根据当前城市切换背景音乐
  if (city && city.cityId) musicEngine.applyForLocation(city.cityId);

  setTimeout(() => {
    document.addEventListener("click", cityCardOutsideClick, true);
  }, 0);
}

async function openCityTravelModal(city) {
  stopTravelRead();
  const modal = document.getElementById("travelModal");
  document.getElementById("travelTitle").textContent = city.name;
  document.getElementById("travelPoet").textContent = `${city.poetName} · ${city.name}`;

  const data = await loadTravel(city.cityId);
  activeTravel = data;
  const segmentsDiv = document.getElementById("travelSegments");
  const landmarksDiv = document.getElementById("travelLandmarks");
  const infoDiv = document.getElementById("travelInfo");
  const routeList = document.getElementById("travelRouteList");
  const readBtn = document.getElementById("travelReadBtn");

  segmentsDiv.replaceChildren();
  landmarksDiv.replaceChildren();
  infoDiv.replaceChildren();
  routeList.replaceChildren();

  const fakePoint = { id: city.cityId, name: city.name };
  if (!data) {
    const empty = document.createElement("p");
    empty.className = "story-empty";
    empty.textContent = "暂无讲解";
    segmentsDiv.appendChild(empty);
    readBtn.hidden = true;
  } else {
    renderTravelDetail(data, fakePoint);
    readBtn.hidden = !data.segments || !data.segments.length || !("speechSynthesis" in window);
  }

  // 城市讲解模式下隐藏路线推荐区域（points 不对应城市集合）
  const routeSection = document.querySelector(".travel-route-section");
  if (routeSection) routeSection.style.display = "none";

  closeCityInfoCard();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("travelClose").focus();
}

/* ===== 路线轨迹绘制 ===== */
function coordForStop(stop) {
  if (stop.pointId && LOCATION_COORDS[stop.pointId]) return LOCATION_COORDS[stop.pointId];
  const point = points.find((p) => p.id === stop.pointId);
  if (point) return point.lnglat;
  return null;
}

function clearRoutePath() {
  if (routePathTimer) {
    window.clearInterval(routePathTimer);
    routePathTimer = null;
  }
  if (routeCarriageAnimation) {
    window.cancelAnimationFrame(routeCarriageAnimation);
    routeCarriageAnimation = null;
  }
  if (routeCarriageMarker) {
    routeCarriageMarker.remove();
    routeCarriageMarker = null;
  }
  routeStopMarkers.forEach((m) => m.remove());
  routeStopMarkers = [];
  if (map.getLayer("route-path-anim")) map.removeLayer("route-path-anim");
  if (map.getSource("route-path-anim")) map.removeSource("route-path-anim");
  if (map.getLayer("route-trail")) map.removeLayer("route-trail");
  if (map.getSource("route-trail")) map.removeSource("route-trail");
  if (map.getLayer("route-path")) map.removeLayer("route-path");
  if (map.getSource("route-path")) map.removeSource("route-path");
}

function drawRoutePath(route) {
  clearRoutePath();
  if (!route || !route.stops || !route.stops.length) return;
  const stops = route.stops
    .map((stop) => ({ stop, coord: coordForStop(stop) }))
    .filter((s) => s.coord);
  if (!stops.length) return;

  const hasLine = stops.length >= 2;
  if (hasLine) {
    // 持续的车辙虚线轨迹（更古朴的土黄色）
    map.addSource("route-trail", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [stops[0].coord, stops[0].coord] }
      }
    });
    map.addLayer({
      id: "route-trail",
      type: "line",
      source: "route-trail",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "rgba(120, 90, 50, 0.5)",
        "line-width": 2,
        "line-dasharray": [2, 1.5]
      }
    });

    // 马车正在走过的动画线（金色，更明亮）
    map.addSource("route-path-anim", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [stops[0].coord, stops[0].coord] }
      }
    });
    map.addLayer({
      id: "route-path-anim",
      type: "line",
      source: "route-path-anim",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "rgba(189, 154, 85, 0.9)",
        "line-width": 2.5,
        "line-opacity": 0.95
      }
    });
  }

  stops.forEach(({ stop, coord }) => {
    const el = document.createElement("div");
    el.className = "route-stop-marker";
    el.innerHTML = `<span class="route-stop-dot"></span><span class="route-stop-label">${stop.location}</span>`;
    const marker = new maplibregl.Marker({ element: el }).setLngLat(coord).addTo(map);
    routeStopMarkers.push(marker);
  });

  if (routeStopMarkers[0]) routeStopMarkers[0].getElement().classList.add("shown");

  if (stops.length < 2) return;

  // 马车/马车 marker
  // 关键：MapLibre Marker 的 element 本身就是 marker 容器，会通过 inline style
  // 设置 transform 进行定位。任何在 .horse-carriage 上的 CSS animation 都会
  // 覆盖该 inline transform，导致 marker 丢失定位。bounce 动画要放在子元素。
  const carriageEl = document.createElement("div");
  carriageEl.className = "horse-carriage";
  carriageEl.style.cssText = "position: relative; left: 0; top: 0; width: 80px; height: 56px; pointer-events: none; z-index: 1000; visibility: visible;";
  carriageEl.innerHTML = '<div class="carriage-bounce"><img class="carriage" src="assets/horse-carriage.svg" alt="马车" draggable="false"></div><span class="carriage-shadow"></span>';
  routeCarriageMarker = new maplibregl.Marker({ element: carriageEl, anchor: "center" })
    .setLngLat(stops[0].coord)
    .addTo(map);
  if (!routeCarriageMarker.__loggedCreated) {
    routeCarriageMarker.__loggedCreated = true;
    console.log("[route] 马车已创建", {
      element: carriageEl,
      firstCoord: stops[0].coord,
      firstStop: stops[0].stop
    });
  }

  const lngs = stops.map((s) => s.coord[0]);
  const lats = stops.map((s) => s.coord[1]);
  const bounds = [
    [Math.min(...lngs) - 0.6, Math.min(...lats) - 0.6],
    [Math.max(...lngs) + 0.6, Math.max(...lats) + 0.6]
  ];
  map.fitBounds(bounds, { padding: { top: 100, bottom: 100, left: 380, right: 60 }, duration: 800 });

  // 段落间慢速步进，每段内部用 requestAnimationFrame 平滑过渡
  const STEP_DURATION = 1200; // 每一段总时长（更慢的动画）
  const SMOOTH_FRAMES = 30; // 平滑帧数
  let step = 0;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function bearingBetween(a, b) {
    const lng1 = a[0];
    const lat1 = a[1];
    const lng2 = b[0];
    const lat2 = b[1];
    const dy = lng2 - lng1;
    const dx = Math.log(Math.tan((lat2 * Math.PI) / 180 / 2 + Math.PI / 4) / Math.tan((lat1 * Math.PI) / 180 / 2 + Math.PI / 4));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return (angle + 360) % 360;
  }

  function runStep(prevIdx, nextIdx) {
    if (!routeCarriageMarker) return;
    const fromCoord = stops[prevIdx].coord;
    const toCoord = stops[nextIdx].coord;
    let frame = 0;
    const carriageInner = carriageEl.querySelector(".carriage");
    // 判断方向：dx < 0 表示向西行进，需要水平镜像翻转 SVG
    const isWestward = toCoord[0] < fromCoord[0];
    const carriageTransform = isWestward ? "scaleX(-1)" : "scaleX(1)";
    if (typeof window.__carriageDebug !== "undefined" && window.__carriageDebug) {
      console.log(`[route] runStep ${prevIdx}->${nextIdx}`, { fromCoord, toCoord, isWestward });
    }

    function animate() {
      if (!routeCarriageMarker) return;
      const t = Math.min(1, frame / SMOOTH_FRAMES);
      const eased = easeInOut(t);
      const lng = fromCoord[0] + (toCoord[0] - fromCoord[0]) * eased;
      const lat = fromCoord[1] + (toCoord[1] - fromCoord[1]) * eased;
      routeCarriageMarker.setLngLat([lng, lat]);
      if (carriageInner) carriageInner.style.transform = carriageTransform;
      // 调试日志：每 5 步输出一次
      if (typeof window.__carriageDebug !== "undefined" && window.__carriageDebug && frame % 5 === 0) {
        console.log(`[route] step ${prevIdx}->${nextIdx} frame ${frame} setLngLat`, [lng, lat]);
      }
      // 到达当前段终点
      if (t >= 1) return;
      frame++;
      routeCarriageAnimation = window.requestAnimationFrame(animate);
    }
    routeCarriageAnimation = window.requestAnimationFrame(animate);
  }

  routePathTimer = window.setInterval(() => {
    step++;
    if (step >= stops.length) {
      window.clearInterval(routePathTimer);
      routePathTimer = null;
      if (routeCarriageMarker) {
        routeCarriageMarker.getElement().classList.add("arrived");
        // 到达时切换到稳定朝向（最后一段的方向）
        const lastIdx = stops.length - 1;
        const finalCarriage = carriageEl.querySelector(".carriage");
        if (finalCarriage && lastIdx > 0) {
          const isWestwardFinal = stops[lastIdx].coord[0] < stops[lastIdx - 1].coord[0];
          finalCarriage.style.transform = isWestwardFinal ? "scaleX(-1)" : "scaleX(1)";
        }
      }
      return;
    }
    if (routeStopMarkers[step]) routeStopMarkers[step].getElement().classList.add("shown");
    const coords = stops.slice(0, step + 1).map((s) => s.coord);
    // 车辙（持续显示）每段完成后追加
    if (coords.length >= 2 && map.getSource("route-trail")) {
      map.getSource("route-trail").setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords }
      });
    }
    // 马车正在走过的动画线 = 只保留最新一段
    if (map.getSource("route-path-anim")) {
      map.getSource("route-path-anim").setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [stops[step - 1].coord, stops[step].coord] }
      });
    }
    runStep(step - 1, step);
  }, STEP_DURATION);
}

/* ===== Task 7: 模式切换与旅行讲解 ===== */
function switchMode(mode) {
  if (activeMode === mode) return;
  stopAutoTour();
  if (activeMode === "travel") clearRoutePath();
  activeMode = mode;
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  document.body.dataset.mode = mode;
  applyMode(mode);
  if (mode === "travel") {
    switchRouteTab("popular");
    if (routesData) {
      renderRouteList();
    } else {
      loadRoutes().then(() => renderRouteList());
    }
    if (!gradeRoutesData) loadGradeRoutes();
  }
  if (mode !== "study") {
    const poemSearchInput = document.getElementById("poemSearchInput");
    if (poemSearchInput) poemSearchInput.value = "";
    const poemSearchResults = document.getElementById("poemSearchResults");
    if (poemSearchResults) poemSearchResults.innerHTML = "";
  }
}

function applyMode(mode) {
  if (mode === "map") {
    cityModeActive = true;
    renderTitle();
    if (map.getLayer("journey-route")) {
      map.setLayoutProperty("journey-route", "visibility", "none");
    }
    closeCityInfoCard();
    loadAllCityPoints().then((cities) => {
      if (!cityModeActive) return;
      renderCityMarkers(cities);
      if (cities.length) {
        const lngs = cities.map((c) => c.lnglat[0]);
        const lats = cities.map((c) => c.lnglat[1]);
        const bounds = [
          [Math.min(...lngs) - 1.5, Math.min(...lats) - 1.5],
          [Math.max(...lngs) + 1.5, Math.max(...lats) + 1.5]
        ];
        map.fitBounds(bounds, { padding: HOME_PADDING, duration: 700 });
      }
    });
    return;
  }
  if (cityModeActive) {
    cityModeActive = false;
    if (map.getLayer("journey-route")) {
      map.setLayoutProperty("journey-route", "visibility", "visible");
    }
    renderMarkers();
    closeCityInfoCard();
  }
  if (activeJourney) renderTitle();
  if (!map.getLayer("journey-route")) return;
  if (mode === "travel") {
    map.setPaintProperty("journey-route", "line-color", "#bd9a55");
    map.setPaintProperty("journey-route", "line-opacity", ["interpolate", ["linear"], ["zoom"], 3, .72, 6, .5]);
    map.setPaintProperty("journey-route", "line-width", ["interpolate", ["linear"], ["zoom"], 3, 2.4, 7, 4.2]);
  } else {
    map.setPaintProperty("journey-route", "line-color", "#9c2f1b");
    map.setPaintProperty("journey-route", "line-opacity", ["interpolate", ["linear"], ["zoom"], 3, .38, 6, .18]);
    map.setPaintProperty("journey-route", "line-width", ["interpolate", ["linear"], ["zoom"], 3, .9, 7, 2]);
  }
  if (mode === "study") {
    ensureAllJourneysLoaded();
  } else {
    clearPoemHighlights();
  }
  markers.forEach(({ point, el }) => {
    const hasPoem = !!poemForPoint(point);
    el.classList.toggle("study-dim", mode === "study" && !hasPoem);
  });
  updateTravelButton(points[activeIndex]);
  if (mode === "travel") {
    ensureTravelDataLoaded();
  } else {
    stopTravelRead();
  }
}

async function loadTravel(pointId) {
  if (!pointId) return null;
  if (pointId in travelCache) return travelCache[pointId];
  try {
    const data = await getJson(`data/travel/${pointId}.json`);
    travelCache[pointId] = data;
    return data;
  } catch {
    travelCache[pointId] = null;
    return null;
  }
}

function ensureTravelDataLoaded() {
  points.forEach((point) => {
    if (point.id && !(point.id in travelCache)) loadTravel(point.id);
  });
}

function updateTravelButton(point) {
  const btn = document.getElementById("travelOpen");
  if (!point || activeMode !== "travel") {
    btn.hidden = true;
    return;
  }
  const cached = travelCache[point.id];
  if (cached === null) {
    btn.hidden = true;
  } else if (cached === undefined) {
    btn.hidden = false;
    loadTravel(point.id).then((data) => {
      if (points[activeIndex] === point) btn.hidden = !data;
    });
  } else {
    btn.hidden = false;
  }
}

async function openTravelModal() {
  const point = points[activeIndex];
  if (!point) return;
  stopTravelRead();
  const modal = document.getElementById("travelModal");
  document.getElementById("travelTitle").textContent = point.name;
  document.getElementById("travelPoet").textContent = activeJourney ? activeJourney.heading : "";

  const data = await loadTravel(point.id);
  activeTravel = data;
  const segmentsDiv = document.getElementById("travelSegments");
  const landmarksDiv = document.getElementById("travelLandmarks");
  const infoDiv = document.getElementById("travelInfo");
  const routeList = document.getElementById("travelRouteList");
  const readBtn = document.getElementById("travelReadBtn");

  segmentsDiv.replaceChildren();
  landmarksDiv.replaceChildren();
  infoDiv.replaceChildren();
  routeList.replaceChildren();

  if (!data) {
    const empty = document.createElement("p");
    empty.className = "story-empty";
    empty.textContent = "暂无讲解";
    segmentsDiv.appendChild(empty);
    readBtn.hidden = true;
  } else {
    renderTravelDetail(data, point);
    readBtn.hidden = !data.segments || !data.segments.length || !("speechSynthesis" in window);
    renderTravelRouteList();
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("travelClose").focus();
}

function renderTravelDetail(data, point) {
  document.getElementById("travelTitle").textContent = data.name || point.name;
  document.getElementById("travelPoet").textContent = data.poet ? `${data.poet} · ${point.name}` : (activeJourney ? activeJourney.heading : "");

  const segmentsDiv = document.getElementById("travelSegments");
  if (data.segments && data.segments.length) {
    data.segments.forEach((seg, i) => {
      const block = document.createElement("div");
      block.className = "travel-segment";
      block.dataset.index = i;
      const h = document.createElement("h3");
      h.className = "travel-segment-title";
      h.textContent = seg.title;
      const p = document.createElement("p");
      p.className = "travel-segment-body";
      p.textContent = seg.body;
      block.appendChild(h);
      block.appendChild(p);
      segmentsDiv.appendChild(block);
    });
  }

  const landmarksDiv = document.getElementById("travelLandmarks");
  if (data.landmarks && data.landmarks.length) {
    const h = document.createElement("h3");
    h.className = "travel-section-heading";
    h.textContent = "文化地标";
    landmarksDiv.appendChild(h);
    const list = document.createElement("div");
    list.className = "landmarks-list";
    data.landmarks.forEach((lm) => {
      const item = document.createElement("div");
      item.className = "landmark-item";
      const name = document.createElement("strong");
      name.className = "landmark-name";
      name.textContent = lm.name;
      const desc = document.createElement("p");
      desc.className = "landmark-desc";
      desc.textContent = lm.description;
      item.appendChild(name);
      item.appendChild(desc);
      list.appendChild(item);
    });
    landmarksDiv.appendChild(list);
  }

  const infoDiv = document.getElementById("travelInfo");
  if (data.travel) {
    const h = document.createElement("h3");
    h.className = "travel-section-heading";
    h.textContent = "旅行信息";
    infoDiv.appendChild(h);
    const grid = document.createElement("div");
    grid.className = "travel-info-grid";
    const fields = [
      { label: "建议时长", value: data.travel.duration },
      { label: "交通方式", value: data.travel.transport },
      { label: "出行贴士", value: data.travel.tips, wide: true }
    ];
    fields.forEach((f) => {
      if (!f.value) return;
      const item = document.createElement("div");
      item.className = f.wide ? "travel-info-item travel-info-tips" : "travel-info-item";
      const labelEl = document.createElement("span");
      labelEl.className = "travel-info-label";
      labelEl.textContent = f.label;
      const valueEl = document.createElement("span");
      valueEl.className = "travel-info-value";
      valueEl.textContent = f.value;
      item.appendChild(labelEl);
      item.appendChild(valueEl);
      grid.appendChild(item);
    });
    infoDiv.appendChild(grid);
  }
  if (data.tips && data.tips.length) {
    const h = document.createElement("h3");
    h.className = "travel-section-heading";
    h.textContent = "历史小 tips";
    landmarksDiv.appendChild(h);
    const list = document.createElement("div");
    list.className = "landmarks-list";
    data.tips.forEach((tip) => {
      const item = document.createElement("div");
      item.className = "landmark-item";
      const name = document.createElement("strong");
      name.className = "landmark-name";
      name.textContent = "·";
      const desc = document.createElement("p");
      desc.className = "landmark-desc";
      desc.textContent = tip;
      item.appendChild(name);
      item.appendChild(desc);
      list.appendChild(item);
    });
    landmarksDiv.appendChild(list);
  }
}

async function renderTravelRouteList() {
  const list = document.getElementById("travelRouteList");
  list.replaceChildren();
  await Promise.all(points.map((p) => loadTravel(p.id)));
  const items = [];
  points.forEach((point, i) => {
    const data = travelCache[point.id];
    if (data) items.push({ point, index: i, data });
  });
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "story-empty";
    empty.textContent = "暂无旅行路线数据";
    list.appendChild(empty);
    return;
  }
  items.forEach(({ point, index, data }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "travel-route-item";
    const nameEl = document.createElement("span");
    nameEl.className = "travel-route-name";
    nameEl.textContent = point.name;
    const metaParts = [];
    if (data.travel && data.travel.duration) metaParts.push(data.travel.duration);
    if (data.travel && data.travel.transport) {
      metaParts.push(data.travel.transport.split(/[；;]/)[0]);
    }
    const metaEl = document.createElement("span");
    metaEl.className = "travel-route-meta";
    metaEl.textContent = metaParts.join(" · ");
    item.appendChild(nameEl);
    item.appendChild(metaEl);
    item.addEventListener("click", () => {
      closeTravelModal();
      selectPoint(index, true);
      window.setTimeout(openTravelModal, 1700);
    });
    list.appendChild(item);
  });
}

function closeTravelModal() {
  stopTravelRead();
  activeTravel = null;
  document.getElementById("travelModal").hidden = true;
  document.body.classList.remove("modal-open");
  const routeSection = document.querySelector(".travel-route-section");
  if (routeSection) routeSection.style.display = "";
}

function toggleTravelRead() {
  if (!activeTravel || !activeTravel.segments) return;
  if (travelSpeechState.playing && !travelSpeechState.paused) {
    speechSynthesis.pause();
    travelSpeechState.paused = true;
    updateTravelReadButton();
  } else if (travelSpeechState.playing && travelSpeechState.paused) {
    speechSynthesis.resume();
    travelSpeechState.paused = false;
    updateTravelReadButton();
  } else {
    startTravelRead();
  }
}

function startTravelRead() {
  if (!activeTravel || !activeTravel.segments) return;
  travelSpeechState.playing = true;
  travelSpeechState.paused = false;
  travelSpeechState.currentIndex = 0;
  speakTravelSegment(0);
  updateTravelReadButton();
}

function speakTravelSegment(index) {
  if (!travelSpeechState.playing || !activeTravel) return;
  const segments = activeTravel.segments;
  if (!segments || index >= segments.length) {
    stopTravelRead();
    return;
  }
  travelSpeechState.currentIndex = index;
  document.querySelectorAll(".travel-segment").forEach((el, i) => {
    el.classList.toggle("reciting", i === index);
  });
  const seg = segments[index];
  const utterance = new SpeechSynthesisUtterance(`${seg.title}。${seg.body}`);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  utterance.onend = () => {
    if (travelSpeechState.playing && !travelSpeechState.paused) {
      speakTravelSegment(index + 1);
    }
  };
  speechSynthesis.speak(utterance);
}

function stopTravelRead() {
  travelSpeechState.playing = false;
  travelSpeechState.paused = false;
  travelSpeechState.currentIndex = -1;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  document.querySelectorAll(".travel-segment").forEach((el) => {
    el.classList.remove("reciting");
  });
  updateTravelReadButton();
}

function updateTravelReadButton() {
  const readBtn = document.getElementById("travelReadBtn");
  const stopBtn = document.getElementById("travelStopBtn");
  if (!readBtn) return;
  if (travelSpeechState.playing && !travelSpeechState.paused) {
    readBtn.textContent = "暂停";
    if (stopBtn) stopBtn.hidden = false;
  } else if (travelSpeechState.playing && travelSpeechState.paused) {
    readBtn.textContent = "继续";
    if (stopBtn) stopBtn.hidden = false;
  } else {
    readBtn.textContent = "朗读";
    if (stopBtn) stopBtn.hidden = true;
  }
}

function selectAdjacent(direction) {
  const next = (activeIndex + direction + points.length) % points.length;
  selectPoint(next, true);
}

function searchableText(point) {
  const poem = poemForPoint(point);
  const poemText = poem ? [poem.title, poem.author, ...poem.body] : [];
  return [point.name, point.short, point.years, typeLabel(point.type), point.summary, point.quote, ...point.works, ...poemText]
    .join(" ")
    .toLowerCase();
}

function renderSearchResults(query) {
  const panel = document.getElementById("searchResults");
  const value = query.trim().toLowerCase();
  if (!value) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  const matches = points
    .map((point, index) => ({ point, index, text: searchableText(point) }))
    .filter((item) => item.text.includes(value))
    .slice(0, 8);
  if (!matches.length) {
    panel.hidden = false;
    panel.innerHTML = `<p>没有匹配的地点或作品</p>`;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = matches.map(({ point, index }) => `
    <button type="button" data-index="${index}">
      <b>${point.name}</b>
      <span>${typeLabel(point.type)} · ${point.works.join(" / ")}</span>
    </button>
  `).join("");
  panel.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      selectPoint(index, true);
      panel.hidden = true;
    });
  });
}

async function loadJourney(journeyId) {
  if (journeys[journeyId]) return journeys[journeyId];
  const person = peopleCatalog.find((item) => item.id === journeyId);
  if (!person) throw new Error(`未知人物：${journeyId}`);
  const journey = await getJson(person.path);
  journeys[journey.id] = journey;
  return journey;
}

async function ensureAllJourneysLoaded() {
  await Promise.all(peopleCatalog.map((person) => loadJourney(person.id)));
}

function renderPersonSelect() {
  const select = document.getElementById("personSelect");
  select.replaceChildren(...peopleCatalog.map((person) => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = `${person.name} · ${person.label}`;
    return option;
  }));
}

function updatePersonSelect(journeyId) {
  document.getElementById("personSelect").value = journeyId;
}

async function setJourney(journeyId, flyHome = true) {
  if (loadingJourneyId || activeJourney?.id === journeyId) return;
  const search = document.querySelector(".search");
  const select = document.getElementById("personSelect");
  loadingJourneyId = journeyId;
  search.classList.add("loading");
  select.disabled = true;
  try {
    const nextJourney = await loadJourney(journeyId);
    if (!nextJourney) return;
    // 根据诗人主导地区切换背景音乐
    musicEngine.applyForPoet(journeyId);
    applyJourney(nextJourney, flyHome);
  } catch (error) {
    console.error(error);
    updatePersonSelect(activeJourney?.id || "");
  } finally {
    loadingJourneyId = "";
    select.disabled = false;
    search.classList.remove("loading");
  }
}

function applyJourney(nextJourney, flyHome = true) {
  stopAutoTour();
  clearRoutePath();
  hideCityTooltip();
  if (!document.getElementById("poemModal").hidden) closePoemModal();
  if (!document.getElementById("chronicleModal").hidden) closeChronicle();
  if (!document.getElementById("travelModal").hidden) closeTravelModal();
  stopTravelRead();
  travelCache = {};
  activeJourney = nextJourney;
  points = nextJourney.points;
  activeIndex = 0;
  document.getElementById("searchInput").value = "";
  renderSearchResults("");
  renderTitle();
  renderMarkers();
  map.getSource("journey-route").setData(makeRoute());
  renderTimeline();
  updatePersonSelect(nextJourney.id);
  selectPoint(0, false);
  applyMode(activeMode);
  if (flyHome) fitHome();
}

/* ===== 自动巡游（地图行旅模式） ===== */
function startAutoTour() {
  if (autoTourTimer) return;
  const btn = document.getElementById("autoTourBtn");
  if (btn) {
    btn.textContent = "停止巡游";
    btn.classList.add("touring");
  }
  switchStoryTab("node");
  autoTourTimer = window.setInterval(() => {
    const next = activeIndex + 1;
    if (next >= points.length) {
      stopAutoTour();
      return;
    }
    selectPoint(next, true);
  }, 4000);
}

function stopAutoTour() {
  if (!autoTourTimer) return;
  window.clearInterval(autoTourTimer);
  autoTourTimer = null;
  const btn = document.getElementById("autoTourBtn");
  if (btn) {
    btn.textContent = "重走人生轨迹";
    btn.classList.remove("touring");
  }
}

/* ===== 诗词搜索（学习模式） ===== */
function searchPoems(keyword) {
  const value = keyword.trim().toLowerCase();
  if (!value) return [];
  const results = [];
  peopleCatalog.forEach((person) => {
    const journey = journeys[person.id];
    if (!journey) return;
    journey.points.forEach((point, index) => {
      if (!point.poem) return;
      const poem = poems[point.poem];
      if (!poem || !poem.body) return;
      poem.body.forEach((line) => {
        if (line.toLowerCase().includes(value)) {
          results.push({
            poemTitle: point.poem,
            author: poem.author || person.name,
            lineText: line,
            pointId: point.id,
            journeyId: journey.id,
            pointName: point.name,
            lnglat: point.lnglat,
            pointIndex: index
          });
        }
      });
    });
  });
  return results;
}

function highlightMatch(text, keyword) {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + "<mark>" + text.slice(idx, idx + keyword.length) + "</mark>" + text.slice(idx + keyword.length);
}

function renderPoemSearchResults(results, keyword) {
  const panel = document.getElementById("poemSearchResults");
  if (!panel) return;
  if (!keyword.trim()) {
    panel.innerHTML = "";
    return;
  }
  if (!results.length) {
    panel.innerHTML = '<p class="poem-search-empty">没有匹配的诗词</p>';
    return;
  }
  panel.innerHTML = results.slice(0, 30).map((r) => `
    <button type="button" class="poem-search-item" data-journey="${r.journeyId}" data-point="${r.pointId}">
      <span class="poem-search-line">${highlightMatch(r.lineText, keyword)}</span>
      <span class="poem-search-meta">《${r.poemTitle}》· ${r.author} · ${r.pointName}</span>
    </button>
  `).join("");
  panel.querySelectorAll(".poem-search-item").forEach((item) => {
    item.addEventListener("click", () => {
      focusSearchResult(item.dataset.journey, item.dataset.point);
    });
  });
}

function highlightMatchingMarkers(results) {
  const matchedIds = new Set(results.map((r) => r.pointId));
  markers.forEach(({ point, el }) => {
    el.classList.toggle("highlight", matchedIds.has(point.id));
  });
}

function clearPoemHighlights() {
  markers.forEach(({ el }) => el.classList.remove("highlight"));
}

async function focusSearchResult(journeyId, pointId) {
  if (activeJourney?.id !== journeyId) {
    await setJourney(journeyId, false);
  }
  const idx = points.findIndex((p) => p.id === pointId);
  if (idx >= 0) {
    selectPoint(idx, true);
    window.setTimeout(openPoemModal, 1700);
  }
}

/* ===== 旅行路线（旅行模式） ===== */
async function loadRoutes() {
  if (routesData) return routesData;
  try {
    routesData = await getJson("data/routes.json");
  } catch (error) {
    console.error("无法载入路线数据", error);
    routesData = null;
  }
  return routesData;
}

function renderRouteList() {
  const list = document.getElementById("routeList");
  const detail = document.getElementById("routeDetail");
  if (!list) return;
  clearRoutePath();
  detail.hidden = true;
  const tabs = document.querySelector(".route-tabs");
  if (tabs) tabs.style.display = "";
  list.hidden = false;
  if (!routesData || !routesData.routes || !routesData.routes.length) {
    list.innerHTML = '<p class="route-empty">暂无路线数据</p>';
    return;
  }
  list.innerHTML = routesData.routes.map((route, i) => `
    <button type="button" class="route-card" data-index="${i}">
      <div class="route-card-head">
        <strong>${route.name}</strong>
        <span class="route-days">${route.days}天</span>
      </div>
      <p class="route-summary">${route.summary}</p>
      <div class="route-poets">${route.poets.map((p) => `<span>${p}</span>`).join("")}</div>
    </button>
  `).join("");
  list.querySelectorAll(".route-card").forEach((card) => {
    card.addEventListener("click", () => {
      const idx = Number(card.dataset.index);
      renderRouteDetail(routesData.routes[idx]);
    });
  });
}

function switchRouteTab(tab) {
  document.querySelectorAll(".route-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  const popular = document.getElementById("routePopular");
  const grade = document.getElementById("routeGrade");
  const poet = document.getElementById("routePoet");
  if (!popular || !grade) return;
  const panels = { popular, grade, poet };
  Object.entries(panels).forEach(([key, panel]) => {
    if (!panel) return;
    if (key === tab) {
      panel.classList.add("active");
      panel.hidden = false;
    } else {
      panel.classList.remove("active");
      panel.hidden = true;
    }
  });
  if (tab === "grade") {
    renderGradeRoutes();
  } else if (tab === "poet") {
    ensureAllJourneysLoaded().then(renderPoetRoutes);
  }
}

async function loadGradeRoutes() {
  if (gradeRoutesData) return gradeRoutesData;
  try {
    gradeRoutesData = await getJson("data/grade-routes.json");
  } catch (error) {
    console.error("无法载入年级路线数据", error);
    gradeRoutesData = null;
  }
  return gradeRoutesData;
}

function renderGradeRoutes() {
  const list = document.getElementById("gradeList");
  if (!list) return;
  list.replaceChildren();
  if (!gradeRoutesData || !gradeRoutesData.grades || !gradeRoutesData.grades.length) {
    list.innerHTML = '<p class="route-empty">暂无课本路线数据</p>';
    return;
  }
  gradeRoutesData.grades.forEach((grade) => {
    const group = document.createElement("div");
    group.className = "grade-group";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "grade-group-head";
    head.innerHTML = `<span>${grade.name}（${grade.routes.length} 条路线）</span><span class="grade-toggle">▸</span>`;
    head.addEventListener("click", () => {
      group.classList.toggle("expanded");
    });
    const body = document.createElement("div");
    body.className = "grade-group-body";
    grade.routes.forEach((route) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "route-card";
      card.innerHTML = `
        <div class="route-card-head">
          <strong>${route.name}</strong>
          <span class="route-days">${route.days}天</span>
        </div>
        <p class="route-summary">${route.summary}</p>
        <div class="route-poets">${route.poets.map((p) => `<span>${p}</span>`).join("")}</div>
      `;
      card.addEventListener("click", () => {
        renderRouteDetail(route, "grade");
      });
      body.appendChild(card);
    });
    group.appendChild(head);
    group.appendChild(body);
    list.appendChild(group);
  });
}

function renderPoetRoutes() {
  const list = document.getElementById("poetRouteList");
  if (!list) return;
  list.replaceChildren();
  const poetRoutes = peopleCatalog.map((person) => {
    const journey = journeys[person.id];
    if (!journey || !journey.points || !journey.points.length) return null;
    const stops = journey.points.map((p, i) => ({
      day: i + 1,
      location: p.name,
      pointId: p.id,
      poet: person.name,
      poem: p.poem || (p.works && p.works[0]) || "",
      highlight: (p.summary || "").slice(0, 30),
      activities: p.summary || ""
    }));
    const years = journey.points
      .map((p) => p.years.split("-")[0])
      .filter(Boolean)
      .map((y) => Number(y))
      .filter((y) => !Number.isNaN(y));
    const yearSpan = years.length
      ? `${Math.min(...years)}-${Math.max(...years)}`
      : "";
    return {
      id: person.id,
      name: `${person.name}人生轨迹`,
      days: journey.points.length,
      poets: [person.name],
      summary: journey.subtitle || person.label || "",
      yearSpan,
      stops
    };
  }).filter(Boolean);

  if (!poetRoutes.length) {
    list.innerHTML = '<p class="route-empty">暂无诗人路线数据</p>';
    return;
  }

  poetRoutes.forEach((route) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "route-card poet-route-card";
    card.innerHTML = `
      <div class="route-card-head">
        <strong>${route.name}</strong>
        <span class="route-days">${route.stops.length} 站</span>
      </div>
      <p class="route-summary">${route.summary}</p>
      <div class="route-poets">
        <span>${route.yearSpan || "年代待考"}</span>
      </div>
    `;
    card.addEventListener("click", () => selectPoetRoute(route));
    list.appendChild(card);
  });
}

async function selectPoetRoute(route) {
  if (activeJourney?.id !== route.id) {
    await setJourney(route.id, false);
  }
  renderRouteDetail(route, "poet");
}

function renderRouteDetail(route, origin = "popular") {
  routeDetailOrigin = origin;
  // 隐藏所有标签面板
  ["routePopular", "routeGrade", "routePoet"].forEach((id) => {
    const panel = document.getElementById(id);
    if (panel) panel.hidden = true;
  });
  // 隐藏标签按钮组
  const tabs = document.querySelector(".route-tabs");
  if (tabs) tabs.style.display = "none";
  const detail = document.getElementById("routeDetail");
  detail.hidden = false;
  detail.innerHTML = `
    <button type="button" class="route-back">← 返回路线列表</button>
    <div class="route-detail-head">
      <strong>${route.name}</strong>
      <span class="route-days">${route.days}天</span>
    </div>
    <p class="route-summary">${route.summary}</p>
    <div class="route-poets">${route.poets.map((p) => `<span>${p}</span>`).join("")}</div>
    <div class="route-days-list">
      ${route.stops.map((stop) => `
        <div class="route-day-card">
          <div class="route-day-head">
            <span class="route-day-num">第 ${stop.day} 天</span>
            <button type="button" class="route-day-loc" data-point="${stop.pointId}">${stop.location}</button>
          </div>
          <div class="route-day-poem">
            <span>诗词：</span>
            <button type="button" class="route-poem-btn" data-poem="${stop.poem}" data-poet="${stop.poet}">${stop.poem}</button>
          </div>
          <p class="route-day-highlight">亮点：${stop.highlight}</p>
          <p class="route-day-activities">${stop.activities}</p>
        </div>
      `).join("")}
    </div>
  `;
  detail.querySelector(".route-back").addEventListener("click", () => {
    clearRoutePath();
    detail.hidden = true;
    // 恢复标签按钮组
    if (tabs) tabs.style.display = "";
    // 恢复来源标签面板
    const targetTab = routeDetailOrigin === "grade" ? "grade" : routeDetailOrigin === "poet" ? "poet" : "popular";
    switchRouteTab(targetTab);
  });
  detail.querySelectorAll(".route-day-loc").forEach((btn, i) => {
    const stop = route.stops[i];
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRouteCityCard(stop, btn);
    });
  });
  detail.querySelectorAll(".route-poem-btn").forEach((btn) => {
    btn.addEventListener("click", () => openPoemFromRoute(btn.dataset.poem, btn.dataset.poet));
  });
  // 根据路线首个地点切换背景音乐
  if (route.stops && route.stops.length && route.stops[0].pointId) {
    musicEngine.applyForLocation(route.stops[0].pointId);
  }
  drawRoutePath(route);
}

function flyToLocation(pointId) {
  const idx = points.findIndex((p) => p.id === pointId);
  if (idx >= 0) {
    selectPoint(idx, true);
    return;
  }
  const coords = LOCATION_COORDS[pointId];
  if (coords) {
    map.flyTo({
      center: coords,
      zoom: Math.max(map.getZoom(), 6),
      duration: 1500,
      curve: 1.42,
      essential: true
    });
  }
}

/* 路线中的地点：点击后弹出与诗词地图相同的城市信息卡片 */
async function openRouteCityCard(stop, btnEl) {
  if (!stop || !stop.pointId) {
    window.alert(`"${stop ? stop.location : "未知地点"}" 暂无具体地理坐标，请参考活动描述。`);
    return;
  }
  const coord = coordForStop(stop.pointId);
  if (!coord) {
    window.alert(`"${stop.location}" 暂无具体地理坐标，请参考活动描述。`);
    return;
  }
  // 飞到该地点
  map.flyTo({
    center: coord,
    zoom: Math.max(map.getZoom(), 7),
    duration: 1500,
    curve: 1.42,
    essential: true
  });
  // 构造与诗词地图一致的城市对象，复用 openCityInfoCard
  const poem = stop.poem && poems[stop.poem] ? poems[stop.poem] : null;
  const quote = (poem && poem.body && poem.body[0]) || stop.highlight || "";
  const city = {
    cityId: stop.pointId,
    name: stop.location,
    short: stop.location,
    modernName: MODERN_CITY_NAMES[stop.pointId] || "",
    lnglat: coord,
    quote,
    poemTitle: stop.poem || "",
    poetName: stop.poet || "",
    poetSeal: (stop.poet || "诗").slice(0, 1),
    color: "#bd9a55",
    type: "route",
    summary: stop.activities || stop.highlight || ""
  };
  // 预热 travel 数据，便于卡片显示"查看城市讲解"按钮
  try { await loadTravel(stop.pointId); } catch { /* ignore */ }
  // 根据路线地点切换背景音乐
  musicEngine.applyForLocation(stop.pointId);
  await openCityInfoCard(city, btnEl);
}

function journeyIdByPoetName(name) {
  const person = peopleCatalog.find((p) => p.name === name);
  return person ? person.id : null;
}

async function openPoemFromRoute(poemTitle, poetName) {
  const journeyId = journeyIdByPoetName(poetName);
  if (journeyId && activeJourney?.id !== journeyId) {
    await setJourney(journeyId, false);
  }
  const idx = points.findIndex((p) => p.poem === poemTitle);
  if (idx >= 0) {
    selectPoint(idx, true);
    window.setTimeout(openPoemModal, 1700);
  } else if (poems[poemTitle]) {
    openPoemModal(poemTitle);
  }
}

/* ===== 背景音乐引擎（古风 Web Audio 合成） ===== */
class MusicEngine {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.currentStyle = null;
    this.isPlaying = false;
    this.loopTimer = null;
    this.volume = 0.3;
    this.activeOscillators = new Set();
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("浏览器不支持 Web Audio API");
      return;
    }
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(this.ctx.destination);
  }

  // 五声音阶：宫(C) 商(D) 角(E) 徵(G) 羽(A)
  noteFreq(noteIndex, octave) {
    const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0];
    return baseFreqs[noteIndex] * Math.pow(2, octave - 4);
  }

  // 播放单个音符，带包络
  playNote(noteIdx, octave, startTime, duration, type, volume) {
    if (!this.ctx || !this.gainNode) return;
    if (noteIdx < 0 || noteIdx > 4) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = this.noteFreq(noteIdx, octave);
    const attack = 0.04;
    const sustainLevel = volume * 0.7;
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(volume, startTime + attack);
    env.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + 0.08);
    env.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(env);
    env.connect(this.gainNode);
    this.activeOscillators.add(osc);
    osc.onended = () => this.activeOscillators.delete(osc);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // 6 种音乐风格参数（音阶 / 速度 / 音色 / 八度 / 音量）
  getStyleParams(style) {
    const styles = {
      // 江南水乡：缓慢的宫商角徵羽，五声音阶上行下行
      jiangnan: {
        scale: [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 5, 7],
        tempo: 580,
        type: "sine",
        octaves: [4, 5],
        volume: 0.55
      },
      // 巴蜀山歌：高亢激昂，笛子/唢呐明亮音色
      bashu: {
        scale: [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0],
        tempo: 380,
        type: "triangle",
        octaves: [4, 5, 6],
        volume: 0.45
      },
      // 塞北长调：苍凉辽远，低频为主
      saibei: {
        scale: [0, 4, 5, 7, 5, 4, 0, 3, 5, 7, 5, 4, 0],
        tempo: 920,
        type: "sine",
        octaves: [3, 4],
        volume: 0.6
      },
      // 中原古韵：庄重典雅，编钟/古筝的中频
      zhongyuan: {
        scale: [0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 4],
        tempo: 540,
        type: "sine",
        octaves: [4],
        volume: 0.5
      },
      // 岭南风情：柔美细腻，类似二胡
      lingnan: {
        scale: [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7],
        tempo: 700,
        type: "triangle",
        octaves: [4, 5],
        volume: 0.5
      },
      // 田园归隐：清新自然，竹笛的高频
      tianyuan: {
        scale: [0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0],
        tempo: 1050,
        type: "sine",
        octaves: [5, 6],
        volume: 0.42
      }
    };
    return styles[style] || styles.jiangnan;
  }

  // 排程循环播放
  scheduleLoop(params) {
    const playOnce = () => {
      if (!this.isPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      let time = t;
      params.scale.forEach((noteIdx, i) => {
        const octave = params.octaves[i % params.octaves.length];
        const noteDuration = (params.tempo / 1000) * 0.85;
        this.playNote(noteIdx, octave, time, noteDuration, params.type, params.volume);
        time += params.tempo / 1000;
      });
      const totalDuration = params.scale.length * params.tempo;
      this.loopTimer = window.setTimeout(playOnce, totalDuration);
    };
    playOnce();
  }

  // 切换音乐风格（无缝过渡：让当前 loop 自然结束，调度下一个）
  startStyle(style) {
    this.currentStyle = style;
    if (!this.isPlaying) return;
    if (this.loopTimer) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (!this.ctx) return;
    const params = this.getStyleParams(style);
    // 立即开始新风格（Web Audio 的 envelope 自然淡出旧音符）
    this.scheduleLoop(params);
  }

  // 用户点击播放
  play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.isPlaying = true;
    if (!this.currentStyle) this.currentStyle = "jiangnan";
    this.startStyle(this.currentStyle);
  }

  // 暂停
  pause() {
    this.isPlaying = false;
    if (this.loopTimer) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    // 立即静音所有活跃振荡器
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  // 继续
  resume() {
    if (!this.ctx) return this.play();
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    this.isPlaying = true;
    if (!this.currentStyle) this.currentStyle = "jiangnan";
    this.startStyle(this.currentStyle);
  }

  // 设置音量（0.0 - 1.0）
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.isPlaying ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
  }

  // 切换上一首
  prevStyle() {
    const idx = MUSIC_STYLES.indexOf(this.currentStyle);
    const next = idx <= 0 ? MUSIC_STYLES.length - 1 : idx - 1;
    this.setStyleById(MUSIC_STYLES[next]);
  }

  // 切换下一首
  nextStyle() {
    const idx = MUSIC_STYLES.indexOf(this.currentStyle);
    const next = (idx + 1) % MUSIC_STYLES.length;
    this.setStyleById(MUSIC_STYLES[next]);
  }

  setStyleById(style) {
    if (!MUSIC_STYLES.includes(style)) return;
    this.startStyle(style);
    this.updateUI();
  }

  // 根据城市 ID 自动匹配音乐风格
  applyForLocation(cityId) {
    if (!this.isPlaying || !cityId) return;
    const style = CITY_MUSIC_MAP[cityId];
    if (style && style !== this.currentStyle) {
      this.startStyle(style);
    }
    this.updateUI();
  }

  // 根据诗人 ID 自动匹配
  applyForPoet(journeyId) {
    if (!this.isPlaying || !journeyId) return;
    const style = POET_MUSIC_MAP[journeyId];
    if (style && style !== this.currentStyle) {
      this.startStyle(style);
    }
    this.updateUI();
  }

  // 同步 UI
  updateUI() {
    const nameEl = document.getElementById("musicName");
    if (nameEl) nameEl.textContent = MUSIC_NAMES[this.currentStyle] || "未播放";
    const selectEl = document.getElementById("musicSelect");
    if (selectEl && selectEl.value !== this.currentStyle) {
      selectEl.value = this.currentStyle || "";
    }
    const toggleEl = document.getElementById("musicToggle");
    if (toggleEl) toggleEl.textContent = this.isPlaying ? "❚❚" : "♪";
    const barEl = document.getElementById("musicBar");
    if (barEl) barEl.classList.toggle("playing", this.isPlaying);
  }
}

const musicEngine = new MusicEngine();

function wireMusicBar() {
  const toggleBtn = document.getElementById("musicToggle");
  const prevBtn = document.getElementById("musicPrev");
  const nextBtn = document.getElementById("musicNext");
  const selectEl = document.getElementById("musicSelect");
  const volumeEl = document.getElementById("musicVolume");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (musicEngine.isPlaying) {
        musicEngine.pause();
      } else {
        musicEngine.play();
      }
      musicEngine.updateUI();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (!musicEngine.isPlaying) musicEngine.play();
      musicEngine.prevStyle();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!musicEngine.isPlaying) musicEngine.play();
      musicEngine.nextStyle();
    });
  }
  if (selectEl) {
    selectEl.addEventListener("change", (event) => {
      if (!musicEngine.isPlaying) musicEngine.play();
      musicEngine.setStyleById(event.target.value);
    });
  }
  if (volumeEl) {
    const initial = Number(volumeEl.value) / 100;
    musicEngine.setVolume(initial);
    volumeEl.addEventListener("input", (event) => {
      musicEngine.setVolume(Number(event.target.value) / 100);
    });
  }
  musicEngine.updateUI();
}

function wireControls() {
  document.getElementById("prevBtn").addEventListener("click", () => selectAdjacent(-1));
  document.getElementById("nextBtn").addEventListener("click", () => selectAdjacent(1));
  document.getElementById("poemOpen").addEventListener("click", openPoemModal);
  document.getElementById("poemClose").addEventListener("click", closePoemModal);
  document.getElementById("poemBackdrop").addEventListener("click", closePoemModal);
  document.getElementById("searchInput").addEventListener("input", (event) => {
    renderSearchResults(event.target.value);
  });
  document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const first = document.querySelector("#searchResults button");
    if (first) first.click();
  });
  document.getElementById("searchClear").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    renderSearchResults("");
    document.getElementById("searchInput").focus();
  });
  document.addEventListener("click", (event) => {
    const search = document.querySelector(".search");
    if (!search.contains(event.target)) document.getElementById("searchResults").hidden = true;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (autoTourTimer) stopAutoTour();
    closeCityInfoCard();
    if (!document.getElementById("poemModal").hidden) closePoemModal();
    if (!document.getElementById("chronicleModal").hidden) closeChronicle();
    if (!document.getElementById("travelModal").hidden) closeTravelModal();
  });
  document.getElementById("personSelect").addEventListener("change", (event) => {
    setJourney(event.target.value);
  });
  map.on("zoom", syncMarkerVisibility);
  map.on("movestart", () => {
    cityCardToken++;
    hideCityTooltip();
    // 仅关闭与地图标记绑定的城市卡片，路线面板中点击展开的卡片位置固定，
    // 跟随地图移动会立刻被关闭导致用户看不到信息卡。
    const card = document.querySelector(".city-info-card");
    if (card && card.dataset.source === "marker") {
      closeCityInfoCard();
    }
  });
  document.querySelectorAll(".poem-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchPoemTab(tab.dataset.tab));
  });
  document.querySelectorAll(".story-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchStoryTab(tab.dataset.tab));
  });
  document.querySelectorAll(".route-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchRouteTab(tab.dataset.tab));
  });
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn.dataset.mode));
  });
  document.getElementById("autoTourBtn").addEventListener("click", () => {
    if (autoTourTimer) stopAutoTour();
    else startAutoTour();
  });
  document.getElementById("poemSearchInput").addEventListener("input", (event) => {
    const value = event.target.value;
    const results = searchPoems(value);
    renderPoemSearchResults(results, value);
    highlightMatchingMarkers(results);
  });
  document.getElementById("chronicleOpen").addEventListener("click", openChronicle);
  document.getElementById("chronicleClose").addEventListener("click", closeChronicle);
  document.getElementById("chronicleBackdrop").addEventListener("click", closeChronicle);
  document.getElementById("travelOpen").addEventListener("click", openTravelModal);
  document.getElementById("travelClose").addEventListener("click", closeTravelModal);
  document.getElementById("travelBackdrop").addEventListener("click", closeTravelModal);
  document.getElementById("travelReadBtn").addEventListener("click", toggleTravelRead);
  document.getElementById("travelStopBtn").addEventListener("click", stopTravelRead);
  document.getElementById("glossaryToggle").addEventListener("click", toggleGlossary);
  document.getElementById("glossaryClose").addEventListener("click", closeGlossary);
  document.getElementById("glossarySource").addEventListener("change", renderGlossaryList);
  updateGlossaryCount();
  wireMusicBar();
}

function drawMist() {
  const canvas = document.getElementById("mist");
  const context = canvas.getContext("2d");
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const clouds = [
    { x: .18, y: .18, w: 260, h: 58, r: -.08, a: .095 },
    { x: .72, y: .25, w: 300, h: 64, r: .06, a: .075 },
    { x: .44, y: .72, w: 340, h: 70, r: -.04, a: .06 }
  ];
  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
  };
  const render = () => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    clouds.forEach((cloud) => {
      const x = window.innerWidth * cloud.x;
      const y = window.innerHeight * cloud.y;
      const gradient = context.createRadialGradient(x, y, 18, x, y, cloud.w * .62);
      gradient.addColorStop(0, `rgba(255,250,235,${cloud.a})`);
      gradient.addColorStop(1, "rgba(255,250,235,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(x, y, cloud.w, cloud.h, cloud.r, 0, Math.PI * 2);
      context.fill();
    });
  };
  resize();
  window.addEventListener("resize", resize);
}

map.on("load", async () => {
  try {
    addReliefTiles();
    const [china, outline, rivers, lakes, peopleIndex, poemData] = await Promise.all([
      getJson("geo/100000_full.json"),
      getJson("geo/china-outline.json"),
      getJson("geo/ne_50m_rivers_cn.json"),
      getJson("geo/ne_50m_lakes_cn.json"),
      getJson("data/people/index.json"),
      getJson("data/poems.json")
    ]);
    poems = poemData;
    peopleCatalog = peopleIndex.people || [];
    const defaultJourneyId = peopleIndex.default || peopleCatalog[0]?.id;
    if (!defaultJourneyId) throw new Error("缺少默认人物数据");
    renderPersonSelect();
    activeJourney = await loadJourney(defaultJourneyId);
    points = activeJourney.points;
    addChinaLayers(china);
    addMask(outline);
    addWater(rivers, lakes);
    addTerrainSources();
    addRouteLayer();
    renderTitle();
    renderMarkers();
    renderTimeline();
    updatePersonSelect(activeJourney.id);
    wireControls();
    document.body.dataset.mode = "map";
    applyMode("map");
    ensureAllJourneysLoaded();
    loadRoutes();
    loadGradeRoutes();
    drawMist();
    fitHome(0);
    selectPoint(0, false);
    map.once("render", () => window.setTimeout(setLoaderHidden, 180));
  } catch (error) {
    document.querySelector("#loader strong").textContent = "载入失败";
    document.querySelector("#loader span").textContent = error.message;
  }
});
