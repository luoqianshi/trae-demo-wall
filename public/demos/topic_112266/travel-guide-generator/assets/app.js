// ==================== SEEDED RANDOM ====================
// HTML escape utility for XSS prevention
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// Geo cache: avoid repeated API calls for the same location
var geoCache = {};


// Rate limiter for geocodeAsync (at least 1 second between calls)
var _lastGeocodeTime = 0;
function _rateLimitedFetch(url, options) {
  var now = Date.now();
  var wait = Math.max(0, 1000 - (now - _lastGeocodeTime));
  _lastGeocodeTime = now + wait;
  if (wait > 0) {
    return new Promise(function(resolve) {
      setTimeout(function() { resolve(fetch(url, options)); }, wait);
    });
  }
  return fetch(url, options);
}

// Dynamic geocoding via Nominatim (OpenStreetMap, free, no API key)
function geocodeAsync(query) {
  if (geoCache[query]) {
    return Promise.resolve(geoCache[query]);
  }
  // Use AbortController for timeout (5s)
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 5000) : null;

  var fetchPromise = _rateLimitedFetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1&accept-language=zh', controller ? { signal: controller.signal } : undefined)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (timeoutId) clearTimeout(timeoutId);
      if (data && data.length > 0) {
        var result = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        geoCache[query] = result;
        return result;
      }
      return null;
    })
    .catch(function(err) {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn('地理编码请求失败（' + query + '）：', err.message || '网络错误，将使用本地数据估算坐标');
      return null;
    });

  // Fallback timeout in case AbortController is not available
  if (!controller) {
    return Promise.race([
      fetchPromise,
      new Promise(function(resolve) { setTimeout(function() { resolve(null); }, 5000); })
    ]);
  }
  return fetchPromise;
}

// Get coords: use cache → dynamic API → fallback to simulated
function getSpotCoordsAsync(cityName, spotName) {
  var fullQuery = cityName + ' ' + spotName;
  // First check cache
  if (geoCache[fullQuery]) {
    return Promise.resolve(geoCache[fullQuery]);
  }
  // Try dynamic geocoding
  return geocodeAsync(fullQuery).then(function(coords) {
    if (coords) return coords;
    // Fallback: simulate around city center
    var city = getCityInfo(cityName);
    if (city && city.info.center) {
      var center = city.info.center;
      var spots = city.info.famous;
      var idx = spots.indexOf(spotName);
      if (idx === -1) idx = hashString(spotName) % 12;
      var angle = (idx / Math.max(spots.length, 1)) * Math.PI * 2;
      var dist = 0.03 + (idx % 3) * 0.025;
      return [center[0] + Math.cos(angle) * dist, center[1] + Math.sin(angle) * dist * 1.2];
    }
    return null;
  });
}

function seededRandom(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function makeRand(seed) {
  var s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function hashString(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ==================== CITY KNOWLEDGE BASE ====================
var cityKnowledge = {
  '大理': { center: [25.6065, 100.2676], province: '云南', type: '古城+自然', famous: ['洱海','苍山','大理古城','双廊','喜洲古镇','崇圣寺三塔'], foods: ['白族酸辣鱼','乳扇','喜洲粑粑','凉鸡米线','鲜花饼','雕梅扣肉'], tags: ['苍山雪','洱海月','风花雪月','白族文化'] },
  '丽江': { center: [26.8721, 100.2295], province: '云南', type: '古城+雪山', famous: ['丽江古城','玉龙雪山','束河古镇','泸沽湖','蓝月谷','拉市海'], foods: ['腊排骨火锅','纳西烤鱼','鸡豆凉粉','酥油茶','黑山羊火锅'], tags: ['纳西文化','东巴文字','雪山','古城'] },
  '昆明': { center: [25.0389, 102.7183], province: '云南', type: '春城', famous: ['滇池','石林','翠湖公园','金马碧鸡坊','云南民族村','大观楼'], foods: ['过桥米线','汽锅鸡','鲜花饼','烤乳扇','野生菌火锅'], tags: ['春城','四季如春','少数民族'] },
  '成都': { center: [30.5728, 104.0668], province: '四川', type: '美食+熊猫', famous: ['大熊猫基地','宽窄巷子','武侯祠','锦里','都江堰','青城山','春熙路'], foods: ['火锅','串串香','龙抄手','担担面','钟水饺','兔头'], tags: ['天府之国','慢生活','熊猫','川剧'] },
  '重庆': { center: [29.5630, 106.5516], province: '重庆', type: '山城+火锅', famous: ['洪崖洞','解放碑','磁器口','长江索道','武隆天坑','李子坝'], foods: ['重庆火锅','小面','酸辣粉','毛血旺','辣子鸡'], tags: ['8D城市','山城','火锅之都'] },
  '西安': { center: [34.3416, 108.9398], province: '陕西', type: '古都', famous: ['兵马俑','大雁塔','古城墙','钟鼓楼','回民街','华清宫','大唐不夜城'], foods: ['肉夹馍','羊肉泡馍','凉皮','biangbiang面','葫芦头'], tags: ['十三朝古都','丝绸之路','大唐'] },
  '杭州': { center: [30.2741, 120.1551], province: '浙江', type: '西湖+江南', famous: ['西湖','灵隐寺','西溪湿地','千岛湖','雷峰塔','河坊街'], foods: ['西湖醋鱼','东坡肉','龙井虾仁','片儿川','葱包桧'], tags: ['人间天堂','江南','龙井茶'] },
  '苏州': { center: [31.2989, 120.5853], province: '江苏', type: '园林', famous: ['拙政园','留园','虎丘','山塘街','平江路','周庄'], foods: ['松鼠鳜鱼','响油鳝糊','蟹粉狮子头','苏式汤面','酒酿饼'], tags: ['园林','江南水乡','丝绸'] },
  '厦门': { center: [24.4798, 118.0894], province: '福建', type: '海岛', famous: ['鼓浪屿','南普陀寺','环岛路','曾厝垵','厦门大学','中山路'], foods: ['沙茶面','土笋冻','海蛎煎','花生汤','姜母鸭'], tags: ['海上花园','文艺','闽南文化'] },
  '青岛': { center: [36.0671, 120.3826], province: '山东', type: '海滨', famous: ['栈桥','八大关','崂山','金沙滩','五四广场','极地海洋世界'], foods: ['青岛啤酒','海鲜大咖','辣炒蛤蜊','鲅鱼饺子','脂渣'], tags: ['啤酒之城','红瓦绿树','碧海蓝天'] },
  '三亚': { center: [18.2528, 109.5120], province: '海南', type: '热带海岛', famous: ['亚龙湾','蜈支洲岛','天涯海角','南山寺','椰梦长廊','海棠湾'], foods: ['椰子鸡','文昌鸡','清补凉','和乐蟹','抱罗粉'], tags: ['东方夏威夷','热带','蜜月'] },
  '桂林': { center: [25.2736, 110.2900], province: '广西', type: '山水', famous: ['漓江','阳朔','象鼻山','龙脊梯田','两江四湖','遇龙河'], foods: ['桂林米粉','啤酒鱼','荔浦芋头扣肉','油茶','马蹄糕'], tags: ['山水甲天下','喀斯特地貌'] },
  '拉萨': { center: [29.6500, 91.1000], province: '西藏', type: '高原', famous: ['布达拉宫','大昭寺','纳木错','羊卓雍措','八廓街','罗布林卡'], foods: ['酥油茶','糌粑','藏面','甜茶','牦牛肉干'], tags: ['日光城','雪域高原','朝圣'] },
  '张家界': { center: [29.1171, 110.4792], province: '湖南', type: '奇峰', famous: ['武陵源','天门山','玻璃栈道','黄龙洞','宝峰湖'], foods: ['三下锅','土家腊肉','葛根粉','酸肉'], tags: ['阿凡达取景地','奇峰异石'] },
  '长沙': { center: [28.2282, 112.9388], province: '湖南', type: '美食+娱乐', famous: ['橘子洲','岳麓山','太平街','湖南省博物馆','IFS','文和友'], foods: ['臭豆腐','糖油粑粑','口味虾','辣椒炒肉','茶颜悦色'], tags: ['娱乐之都','湘菜','网红'] },
  '北京': { center: [39.9042, 116.4074], province: '北京', type: '首都', famous: ['故宫','长城','天坛','颐和园','天安门','南锣鼓巷','798'], foods: ['北京烤鸭','炸酱面','豆汁儿','卤煮火烧','驴打滚'], tags: ['帝都','皇城','胡同'] },
  '上海': { center: [31.2304, 121.4737], province: '上海', type: '都市', famous: ['外滩','东方明珠','豫园','南京路','田子坊','迪士尼'], foods: ['小笼包','生煎','红烧肉','本帮面','排骨年糕'], tags: ['魔都','外滩','海派'] },
  '南京': { center: [32.0603, 118.7969], province: '江苏', type: '古都', famous: ['中山陵','夫子庙','总统府','玄武湖','明孝陵','秦淮河'], foods: ['盐水鸭','鸭血粉丝汤','小笼包','糖芋苗','鸡鸣汤包'], tags: ['六朝古都','民国','梧桐'] },
  '武汉': { center: [30.5928, 114.3055], province: '湖北', type: '江城', famous: ['黄鹤楼','东湖','户部巷','武汉大学','湖北省博物馆','长江大桥'], foods: ['热干面','武昌鱼','豆皮','面窝','鸭脖'], tags: ['江城','樱花','九省通衢'] },
  '哈尔滨': { center: [45.8038, 126.5350], province: '黑龙江', type: '冰雪', famous: ['中央大街','冰雪大世界','索菲亚教堂','太阳岛','松花江'], foods: ['锅包肉','红肠','大列巴','冻梨','杀猪菜'], tags: ['冰城','俄式风情','冰雪'] }
};

var imagePool = {
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&h=260&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop'
  ],
  video: [
    'https://images.unsplash.com/photo-1537950064127-749a9a49e7d6?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1548585744-5e4a1e62e6ef?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1502728238465-9368012c22d0?w=400&h=240&fit=crop',
    'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400&h=240&fit=crop'
  ]
};

function getCityInfo(cityName) {
  for (var key in cityKnowledge) {
    if (cityName.indexOf(key) !== -1 || key.indexOf(cityName) !== -1) {
      return { key: key, info: cityKnowledge[key] };
    }
  }
  return null;
}

function getCityCenter(cityName) {
  var city = getCityInfo(cityName);
  if (city && city.info && city.info.center) return city.info.center;
  return null;
}

function getSpotCoords(cityName, spotName) {
  var city = getCityInfo(cityName);
  if (!city || !city.info.center) return null;
  var center = city.info.center;
  var spots = city.info.famous;
  var idx = spots.indexOf(spotName);
  if (idx === -1) {
    idx = hashString(spotName) % 12;
  }
  var angle = (idx / Math.max(spots.length, 1)) * Math.PI * 2;
  var dist = 0.03 + (idx % 3) * 0.025;
  var lat = center[0] + Math.cos(angle) * dist;
  var lon = center[1] + Math.sin(angle) * dist * 1.2;
  return [lat, lon];
}

function extractSpotFromTitle(title, cityName) {
  var city = getCityInfo(cityName);
  if (!city) return null;
  var spots = city.info.famous;
  for (var i = 0; i < spots.length; i++) {
    if (title.indexOf(spots[i]) !== -1) return spots[i];
  }
  return null;
}

function generateHotels(dest, budget) {
  var seed = hashString(dest + '_hotel_' + budget);
  var rand = makeRand(seed);
  var city = getCityInfo(dest);
  var cityName = city ? city.key : dest;

  var hotelNames = ['国际','世纪','海景','云端','悦享','丽景','柏悦','天域','华庭','翡翠','星辰','悦榕','雅居','锦华','洲际','万豪','希尔顿','喜来登','香格里拉','铂尔曼'];
  var hostelNames = ['客栈','民宿','青年旅舍','庭院','小筑','别院','居舍','驿站','草堂','瓦舍','院落','人家','小窝','窝点','小馆'];
  var areaNames = ['古城','中心',' waterfront','新区','老街','景区','南门','北门','东区','西区'];
  var tags = {
    luxury: ['无边泳池','SPA','管家服务','海景房','免费早餐','私人沙滩','行政酒廊','接机服务'],
    comfort: ['免费停车','健身房','免费WiFi','接送服务','湖景房','山景房','免费早餐','行李寄存'],
    economy: ['地铁直达','24小时前台','免费WiFi','经济实惠','近景区','干净舒适','热水充足','免费停车'],
    hostel: ['古城景观','庭院','免费WiFi','行李寄存','公共厨房','旅行社交','免费茶水','自助洗衣']
  };
  var types = ['luxury','luxury','comfort','comfort','economy','hostel'];

  var budgetMultipliers = { economy: 0.3, comfort: 0.7, luxury: 1.5 };
  var basePrice = { luxury: 1500, comfort: 600, economy: 200, hostel: 120 };
  var multiplier = budgetMultipliers[budget] || 0.7;

  var hotels = [];
  for (var i = 0; i < 6; i++) {
    var type = types[i];
    var name, location;
    var r = rand();
    if (type === 'luxury') {
      name = cityName + hotelNames[Math.floor(r * hotelNames.length)] + '酒店';
      location = cityName + areaNames[Math.floor(rand() * areaNames.length)];
    } else if (type === 'hostel') {
      name = cityName + hostelNames[Math.floor(r * hostelNames.length)];
      location = cityName + areaNames[Math.floor(rand() * areaNames.length)];
    } else {
      name = cityName + hotelNames[Math.floor(r * hotelNames.length)] + (type === 'comfort' ? '大酒店' : '宾馆');
      location = cityName + areaNames[Math.floor(rand() * areaNames.length)];
    }

    var base = Math.round(basePrice[type] * multiplier * (0.8 + rand() * 0.4));
    var prices = {};
    var platforms = ['携程','去哪儿','Booking','Agoda','飞猪'];
    platforms.forEach(function(p) {
      prices[p] = Math.round(base * (0.85 + rand() * 0.3));
    });

    var typeTags = tags[type];
    var hotelTagList = [];
    var tagCount = 3 + Math.floor(rand() * 2);
    for (var t = 0; t < tagCount; t++) {
      hotelTagList.push(typeTags[Math.floor(rand() * typeTags.length)]);
    }
    hotelTagList = hotelTagList.filter(function(v, i, a) { return a.indexOf(v) === i; });

    hotels.push({
      name: name, type: type, rating: (3.8 + rand() * 1.2).toFixed(1),
      reviews: Math.floor(500 + rand() * 9000), location: location,
      img: imagePool.hotel[(seed + i) % imagePool.hotel.length],
      tags: hotelTagList.slice(0, 4), prices: prices
    });
  }
  return hotels;
}

function generateTransport(from, to) {
  var seed = hashString(from + '_' + to + '_transport');
  var rand = makeRand(seed);

  var distanceEst = 500 + Math.floor(rand() * 2500);
  var fromCity = getCityInfo(from);
  var toCity = getCityInfo(to);
  var fromName = fromCity ? fromCity.key : from;
  var toName = toCity ? toCity.key : to;

  var routes = [];
  var flyTime = Math.max(1, Math.floor(distanceEst / 800));
  var flyPrice = Math.round(400 + distanceEst * 0.6 + rand() * 400);
  routes.push({
    type: 'plane', name: '直飞航班', icon: 'plane',
    duration: flyTime + 'h' + Math.floor(rand() * 50) + 'm',
    depart: pad2(Math.floor(6 + rand() * 4)) + ':' + pad2(Math.floor(rand() * 60)),
    arrive: pad2(Math.floor(10 + rand() * 6)) + ':' + pad2(Math.floor(rand() * 60)),
    detail: fromName + '出发 → ' + toName + '机场，飞行距离约' + distanceEst + 'km，每日多班',
    price: flyPrice, priceNote: '含税/人', recommended: distanceEst > 1200
  });

  var trainTime = Math.max(3, Math.floor(distanceEst / 250));
  var trainPrice = Math.round(150 + distanceEst * 0.25 + rand() * 100);
  routes.push({
    type: 'train', name: '高铁动车', icon: 'train',
    duration: trainTime + 'h' + Math.floor(rand() * 50) + 'm',
    depart: pad2(Math.floor(6 + rand() * 6)) + ':' + pad2(Math.floor(rand() * 60)),
    arrive: pad2(Math.floor((6 + rand() * 6 + trainTime) % 24)) + ':' + pad2(Math.floor(rand() * 60)),
    detail: fromName + '站 → ' + toName + '站，二等座，沿途可欣赏风景',
    price: trainPrice, priceNote: '二等座/人', recommended: distanceEst >= 300 && distanceEst <= 1500
  });

  if (distanceEst < 600) {
    var busPrice = Math.round(80 + distanceEst * 0.15 + rand() * 50);
    routes.push({
      type: 'bus', name: '长途大巴', icon: 'bus',
      duration: Math.ceil(distanceEst / 80) + 'h',
      depart: pad2(Math.floor(7 + rand() * 3)) + ':' + pad2(Math.floor(rand() * 60)),
      arrive: '-',
      detail: fromName + '客运站 → ' + toName + '客运站，经济实惠',
      price: busPrice, priceNote: '单程/人', recommended: false
    });
  }

  var carCost = Math.round(distanceEst * 0.6 + 200 + rand() * 300);
  routes.push({
    type: 'car', name: '自驾出行', icon: 'car',
    duration: '约' + Math.ceil(distanceEst / 90) + 'h',
    depart: '-', arrive: '-',
    detail: '全程约' + distanceEst + 'km，油费+过路费估算，途经' + Math.ceil(distanceEst / 300) + '个服务区',
    price: carCost, priceNote: '油费+过路费估算', recommended: false
  });

  var hasRec = routes.some(function(r) { return r.recommended; });
  if (!hasRec) routes[0].recommended = true;
  return routes;
}

function generateVideos(dest, vtype) {
  var seed = hashString(dest + '_video_' + (vtype || 'all'));
  var rand = makeRand(seed);
  var city = getCityInfo(dest);
  var cityName = city ? city.key : dest;

  var videoTemplates = {
    guide: [
      { titleTmpl: '{city}X天X晚保姆级攻略 | 最新避坑指南', platform: 'bilibili', duration: [15,30] },
      { titleTmpl: '{city}旅行全攻略 | 第一次去必看', platform: 'bilibili', duration: [12,25] },
      { titleTmpl: '{city}本地人推荐的游玩路线', platform: 'douyin', duration: [1,4] },
      { titleTmpl: '{city}自由行攻略 | 行程规划详解', platform: 'bilibili', duration: [10,20] }
    ],
    vlog: [
      { titleTmpl: '{city}旅行Vlog | 说走就走的旅行', platform: 'bilibili', duration: [15,25] },
      { titleTmpl: '一个人去{city} | 治愈系旅行记录', platform: 'bilibili', duration: [10,20] },
      { titleTmpl: '我在{city}的一天', platform: 'douyin', duration: [1,3] },
      { titleTmpl: '{city}深度游Vlog', platform: 'bilibili', duration: [18,28] }
    ],
    food: [
      { titleTmpl: '{city}美食地图 | X家必吃店推荐', platform: 'douyin', duration: [2,4] },
      { titleTmpl: '在{city}吃什么 | 本地人私藏美食', platform: 'bilibili', duration: [10,18] },
      { titleTmpl: '{city}街头小吃大搜罗', platform: 'douyin', duration: [1,3] },
      { titleTmpl: '{city}必吃美食排行榜', platform: 'bilibili', duration: [8,15] }
    ],
    photo: [
      { titleTmpl: '{city}摄影攻略 | 拍出大片感', platform: 'bilibili', duration: [10,20] },
      { titleTmpl: '{city}最美打卡点合集', platform: 'douyin', duration: [1,3] },
      { titleTmpl: '带相机去{city} | 扫街摄影', platform: 'bilibili', duration: [12,22] }
    ]
  };

  var authors = ['旅行小达人','摄影师阿杰','吃货日记','背包客老王','小红薯旅行','文化探索者','本地通','周末去哪玩','在路上','时光旅行者'];
  var templates = [];
  if (vtype && vtype !== 'all' && videoTemplates[vtype]) {
    templates = videoTemplates[vtype];
  } else {
    Object.keys(videoTemplates).forEach(function(k) { templates = templates.concat(videoTemplates[k]); });
  }

  var videos = [];
  var count = vtype === 'all' ? 8 : 5;
  for (var i = 0; i < count; i++) {
    var tmpl = templates[i % templates.length];
    var days = 2 + Math.floor(rand() * 5);
    var title = tmpl.titleTmpl.replace('{city}', cityName).replace('X天X晚', days + '天' + (days-1) + '晚').replace('X', 5 + Math.floor(rand() * 8));
    var durMin = tmpl.duration[0] + Math.floor(rand() * (tmpl.duration[1] - tmpl.duration[0]));
    var durStr = durMin < 5 ? '0' + pad2(durMin) + ':' + pad2(Math.floor(rand() * 60)) : durMin + ':' + pad2(Math.floor(rand() * 60));
    var plat = tmpl.platform;
    var views = Math.floor(10 + rand() * 500);
    var likes = Math.floor(views * (0.02 + rand() * 0.08));
    videos.push({
      title: title, author: authors[Math.floor(rand() * authors.length)],
      platform: plat, duration: durStr,
      views: formatNum(views) + '万', likes: formatNum(likes) + '万',
      type: vtype === 'all' ? (['guide','vlog','food','photo'][i % 4]) : vtype,
      thumb: imagePool.video[(seed + i) % imagePool.video.length]
    });
  }
  return videos;
}

function generateItineraryData(destinations, fromCity, style, budget, special) {
  // Dynamic days: each dest at least 1 day + 1 transit buffer
  var days = destinations.length + 1;
  var seed = hashString(destinations.join('_') + '_' + style + '_' + budget + '_' + fromCity);
  var rand = makeRand(seed);

  var generatedDays = [];
  var usedSpots = [];
  var usedFoods = [];

  var dayTemplates = [
    { titleTmpl: '初识{city}', theme: 'city_explore' },
    { titleTmpl: '深度体验{city}', theme: 'deep_explore' },
    { titleTmpl: '{city}周边探索', theme: 'surrounding' },
    { titleTmpl: '{city}文化之旅', theme: 'culture' },
    { titleTmpl: '{city}美食之日', theme: 'food_day' },
    { titleTmpl: '{city}自然探险', theme: 'nature' },
    { titleTmpl: '告别{city}', theme: 'departure' }
  ];

  // === Generate per-destination hotels ===
  var dayHotels = {};
  destinations.forEach(function(dest) {
    var city = getCityInfo(dest);
    var cityName = city ? city.key : dest;
    var hotelList = generateHotels(dest, budget);
    var rec = null;
    for (var h = 0; h < hotelList.length; h++) {
      if (hotelList[h].recommended) { rec = hotelList[h]; break; }
    }
    if (!rec) rec = hotelList[0];
    if (rec) {
      // Get min price across platforms
      var minPrice = 0;
      if (rec.prices) {
        var priceVals = Object.keys(rec.prices).map(function(k) { return rec.prices[k]; });
        minPrice = Math.min.apply(null, priceVals);
      }
      dayHotels[cityName] = {
        name: rec.name,
        area: rec.location,
        type: rec.type,
        price: minPrice,
        platforms: rec.prices || {}
      };
    }
  });

  // === Helper: generate transit info between two spots ===
  function makeTransit(fromCoords, toCoords) {
    if (!fromCoords || !toCoords) return null;
    var R = 6371;
    var dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
    var dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(fromCoords[0]*Math.PI/180) * Math.cos(toCoords[0]*Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    dist = Math.round(dist * 10) / 10;

    if (dist < 1.0) {
      return { mode: 'walk', label: '步行', dist: dist, duration: Math.max(5, Math.round(dist * 12)) + '分钟', cost: 0 };
    } else if (dist < 5.0) {
      return { mode: 'bus', label: '公交/地铁', dist: dist, duration: Math.round(dist * 6 + 10) + '分钟', cost: Math.round(dist * 2) + '元' };
    } else {
      return { mode: 'taxi', label: '打车', dist: dist, duration: Math.round(dist * 3) + '分钟', cost: Math.round(dist * 2.5 + 5) + '元' };
    }
  }

  // === Helper: get coords for a spot ===
  function getSpotCoordsForCity(cityName, spotName) {
    return getSpotCoords(cityName, spotName);
  }

  // === Helper: attach transitToNext to items ===
  function attachTransit(items, cityName) {
    for (var k = 0; k < items.length - 1; k++) {
      var cur = items[k];
      var next = items[k + 1];
      var curCoords = null, nextCoords = null;

      // Get coords from spot name, hotel area, or city center
      if (cur.spotName) {
        curCoords = getSpotCoordsForCity(cityName, cur.spotName);
      } else if (cur.hotelArea) {
        curCoords = getSpotCoordsForCity(cityName, cur.hotelArea);
      } else if (cur.tags.indexOf('交通') !== -1) {
        curCoords = getCityCenter(cityName);
      }

      if (next.spotName) {
        nextCoords = getSpotCoordsForCity(cityName, next.spotName);
      } else if (next.hotelArea) {
        nextCoords = getSpotCoordsForCity(cityName, next.hotelArea);
      } else if (next.tags.indexOf('交通') !== -1) {
        nextCoords = getCityCenter(cityName);
      }

      // Skip if either is a transport item (no real location)
      if (cur.tags.indexOf('交通') !== -1 || next.tags.indexOf('交通') !== -1) continue;

      if (curCoords && nextCoords) {
        cur.transitToNext = makeTransit(curCoords, nextCoords);
      }
    }
  }

  // Day 1: Transit day - fromCity to first destination
  var firstDest = destinations[0];
  var firstCity = getCityInfo(firstDest);
  var firstName = firstCity ? firstCity.key : firstDest;
  var firstHotel = dayHotels[firstName];

  var day1Items = [
    { time: '08:00', title: '从' + fromCity + '出发，前往' + firstName, desc: '选择高铁或航班前往' + firstName + '，建议早晨出发，中午前抵达。', tags: ['交通'] },
    { time: '12:00', title: '抵达' + firstName + '，入住' + (firstHotel ? firstHotel.name : '酒店'), desc: firstHotel ? '位于' + firstHotel.area + '，' + (budget === 'luxury' ? '高端度假体验' : '交通便利') + '，办理入住后稍作休整。' + (special ? '注意：' + special + '的需求可提前与酒店沟通。' : '') : '办理入住后稍作休整。', tags: ['酒店'], hotelName: firstHotel ? firstHotel.name : '', hotelArea: firstHotel ? firstHotel.area : '' }
  ];

  var firstInfo = firstCity ? firstCity.info : null;
  var firstSpots = firstInfo ? firstInfo.famous : generateGenericSpots(firstName, rand);
  var firstFoods = firstInfo ? firstInfo.foods : generateGenericFoods(firstName, rand);
  var firstSpotName = pickUnused(firstSpots, usedSpots, rand);
  day1Items.push({
    time: '14:00', title: '初探' + firstSpotName, desc: '漫步' + firstName + '街头，感受当地氛围，开启旅程。', tags: ['景点'], spotName: firstSpotName
  });
  var firstFood = pickUnused(firstFoods, usedFoods, rand);
  day1Items.push({
    time: '18:30', title: '品尝' + firstFood, desc: '第一顿' + firstName + '美食，推荐尝试当地名菜。', tags: ['美食']
  });

  attachTransit(day1Items, firstName);
  generatedDays.push({
    title: '出发：' + fromCity + ' → ' + firstName,
    date: '第1天',
    city: firstName,
    hotel: firstHotel,
    items: day1Items
  });

  // Middle days: one day per destination (destinations[1] onwards), then final departure
  var dayIndex = 2;
  for (var i = 1; i < destinations.length; i++) {
    var dest = destinations[i];
    var city = getCityInfo(dest);
    var cityName = city ? city.key : dest;
    var info = city ? city.info : null;
    var spots = info ? info.famous : generateGenericSpots(cityName, rand);
    var foods = info ? info.foods : generateGenericFoods(cityName, rand);
    var prevDest = destinations[i - 1];
    var prevCity = getCityInfo(prevDest);
    var prevName = prevCity ? prevCity.key : prevDest;
    var tmpl = dayTemplates[i % dayTemplates.length];
    var dayHotel = dayHotels[cityName];

    var dayItems = [];

    // Transit from previous city
    dayItems.push({
      time: '08:00', title: prevName + ' → ' + cityName + '（交通）',
      desc: '乘高铁/航班前往' + cityName + '，路程约1-3小时。',
      tags: ['交通']
    });

    // Hotel check-in for this city
    dayItems.push({
      time: '10:00', title: '抵达' + cityName + '，入住' + (dayHotel ? dayHotel.name : '酒店'),
      desc: dayHotel ? '位于' + dayHotel.area + '，放下行李后开始游览。' : '办理入住后开始游览。',
      tags: ['酒店'], hotelName: dayHotel ? dayHotel.name : '', hotelArea: dayHotel ? dayHotel.area : ''
    });

    var spot1 = pickUnused(spots, usedSpots, rand);
    dayItems.push({
      time: '10:30', title: '游览' + spot1,
      desc: cityName + '著名景点，' + (style === 'photo' ? '适合拍照，光线最佳时段。' : '景色宜人，建议游览2-3小时。'),
      tags: ['景点'], spotName: spot1
    });

    var food1 = pickUnused(foods, usedFoods, rand);
    dayItems.push({
      time: '12:30', title: '品尝' + food1,
      desc: cityName + '特色美食，人均消费' + (budget === 'economy' ? '30-50' : budget === 'comfort' ? '60-100' : '150-300') + '元。',
      tags: ['美食']
    });

    var spot2 = pickUnused(spots, usedSpots, rand);
    dayItems.push({
      time: '14:30', title: '探访' + spot2,
      desc: style === 'culture' ? '了解' + cityName + '文化底蕴。' : style === 'adventure' ? '体验户外项目，感受大自然。' : '热门景点，值得一游。',
      tags: ['景点'], spotName: spot2
    });

    if (style === 'food' || rand() > 0.4) {
      var food2 = pickUnused(foods, usedFoods, rand);
      dayItems.push({
        time: '17:00', title: '下午茶/小吃：' + food2,
        desc: cityName + '街头特色小吃，感受地道风味。',
        tags: ['美食']
      });
    }

    var food3 = pickUnused(foods, usedFoods, rand);
    dayItems.push({
      time: '18:30', title: '晚餐：' + food3,
      desc: '继续探索' + cityName + '美食。',
      tags: ['美食']
    });

    var spot3 = pickUnused(spots, usedSpots, rand);
    dayItems.push({
      time: '20:00', title: spot3 + '夜景漫步',
      desc: '漫步' + cityName + '街头，感受当地夜生活。',
      tags: ['景点'], spotName: spot3
    });

    attachTransit(dayItems, cityName);
    generatedDays.push({
      title: tmpl.titleTmpl.replace('{city}', cityName),
      date: '第' + dayIndex + '天',
      city: cityName,
      hotel: dayHotel,
      items: dayItems
    });
    dayIndex++;
  }

  // Final day: return from last destination to fromCity
  var lastDest = destinations[destinations.length - 1];
  var lastCity = getCityInfo(lastDest);
  var lastName = lastCity ? lastCity.key : lastDest;
  var lastHotel = dayHotels[lastName];

  var returnItems = [
    { time: '08:00', title: '购买伴手礼，整理行李', desc: '推荐购买当地特产纪念品。', tags: ['景点'] },
    { time: '10:00', title: '最后游览：' + lastName + '老街', desc: '趁返程前再逛逛，感受' + lastName + '的慢节奏。', tags: ['景点'], spotName: lastName + '老街' },
    { time: '13:00', title: '午餐', desc: '', tags: ['美食'] },
    { time: '15:00', title: lastName + ' → ' + fromCity + '（返程）', desc: '前往机场/车站，建议提前2小时到达。环线之旅圆满结束！', tags: ['交通'] }
  ];

  attachTransit(returnItems, lastName);
  generatedDays.push({
    title: '返程：' + lastName + ' → ' + fromCity + '（环线闭合）',
    date: '第' + dayIndex + '天',
    city: lastName,
    hotel: lastHotel,
    items: returnItems
  });

  var budgetMap = {
    economy: { transport: 400 + Math.floor(rand() * 400), accommodation: 150 * days, food: 80 * days, tickets: 100 + Math.floor(rand() * 150), other: 50 + Math.floor(rand() * 100) },
    comfort: { transport: 800 + Math.floor(rand() * 600), accommodation: 400 * days, food: 180 * days, tickets: 300 + Math.floor(rand() * 300), other: 150 + Math.floor(rand() * 200) },
    luxury: { transport: 1500 + Math.floor(rand() * 1000), accommodation: 1000 * days, food: 400 * days, tickets: 600 + Math.floor(rand() * 400), other: 400 + Math.floor(rand() * 400) }
  };
  return { days: generatedDays, budget: budgetMap[budget] || budgetMap.comfort, hotels: dayHotels };
}

function generateGenericSpots(cityName, rand) {
  var generics = ['古城','老街','中心广场','博物馆','公园','观景台','寺庙','塔','湖','山','瀑布','海滩','森林公园','湿地公园','植物园'];
  var spots = [];
  for (var i = 0; i < 8; i++) spots.push(cityName + generics[Math.floor(rand() * generics.length)]);
  return spots;
}

function generateGenericFoods(cityName, rand) {
  var generics = ['特色面','小吃','火锅','烧烤','炒饭','汤包','煎饼','凉粉','汤圆','糕点','卤味','海鲜','炖菜','炒菜'];
  var foods = [];
  for (var i = 0; i < 6; i++) foods.push(cityName + generics[Math.floor(rand() * generics.length)]);
  return foods;
}

function pickUnused(pool, used, rand) {
  var available = pool.filter(function(s) { return used.indexOf(s) === -1; });
  if (available.length === 0) { used.length = 0; available = pool; }
  var pick = available[Math.floor(rand() * available.length)];
  used.push(pick);
  return pick;
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function formatNum(n) { return n < 10 ? n.toFixed(1) : Math.floor(n); }

// ==================== RENDER FUNCTIONS ====================
var currentHotels = [];
var currentVideos = [];
var currentHotelFilter = 'all';
var currentVideoFilter = 'all';

function renderHotels() {
  var container = document.getElementById('hotelList');
  var hotels = currentHotels;
  if (currentHotelFilter !== 'all') hotels = hotels.filter(function(h) { return h.type === currentHotelFilter; });
  if (hotels.length === 0) {
    container.innerHTML = '<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M3 7v14M21 7v14M6 11h4v4H6zM14 11h4v4h-4zM9 21v-4h6v4M12 3v4"/></svg><p>点击上方搜索按钮，AI 将为你实时生成酒店比价</p></div>';
    return;
  }
  var html = '';
  hotels.forEach(function(hotel) {
    var minPrice = Infinity, minPlatform = '';
    Object.keys(hotel.prices).forEach(function(p) { if (hotel.prices[p] < minPrice) { minPrice = hotel.prices[p]; minPlatform = p; } });
    var priceRows = '';
    Object.keys(hotel.prices).forEach(function(p) {
      var isBest = p === minPlatform;
      priceRows += '<div class="price-row"><span class="platform-name">' + p + '</span><span class="price-val ' + (isBest ? 'price-best' : 'price-original') + '">&yen;' + hotel.prices[p] + '</span>' + (isBest ? '<span class="best-badge">最低</span>' : '') + '</div>';
    });
    var tags = hotel.tags.map(function(t) { return '<span class="hotel-tag">' + escapeHTML(t) + '</span>'; }).join('');
    html += '<div class="hotel-card"><img class="hotel-img" src="' + hotel.img + '" alt="' + hotel.name + '" loading="lazy"><div class="hotel-info"><h4>' + hotel.name + '</h4><span class="hotel-rating">&#9733; ' + hotel.rating + ' (' + hotel.reviews + '条评价)</span><div class="hotel-loc">&#128205; ' + hotel.location + '</div><div class="hotel-tags">' + tags + '</div></div><div class="hotel-prices">' + priceRows + '<div class="price-total">最低 &yen;' + minPrice + '<span style="font-size:0.8rem;color:var(--muted);font-weight:400;">/晚</span></div></div></div>';
  });
  container.innerHTML = html;
}

function renderTransport(routes) {
  var container = document.getElementById('routeList');
  if (!routes || routes.length === 0) {
    container.innerHTML = '<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><p>请输入出发地和目的地，AI 将为你实时规划交通方案</p></div>';
    return;
  }
  var html = '';
  routes.forEach(function(route) {
    var icon = route.icon === 'plane' ? '&#9992;' : route.icon === 'train' ? '&#128646;' : route.icon === 'bus' ? '&#128652;' : '&#128663;';
    html += '<div class="route-card' + (route.recommended ? ' recommended' : '') + '"><div class="route-header"><div class="route-type"><div class="route-type-icon ' + route.icon + '">' + icon + '</div><span>' + escapeHTML(route.name) + '</span>' + (route.recommended ? '<span class="recommend-tag">推荐</span>' : '') + '</div><div class="route-price">&yen;' + route.price + '<span style="font-size:0.75rem;color:var(--muted);font-weight:400;"> ' + route.priceNote + '</span></div></div><div class="route-meta"><span>&#128339; ' + route.duration + '</span>' + (route.depart !== '-' ? '<span>&#128197; ' + route.depart + ' &rarr; ' + route.arrive + '</span>' : '') + '</div><div class="route-detail">' + escapeHTML(route.detail) + '</div></div>';
  });
  container.innerHTML = html;
}

function renderVideos() {
  var container = document.getElementById('videoGrid');
  var videos = currentVideos;
  if (currentVideoFilter !== 'all') videos = videos.filter(function(v) { return v.type === currentVideoFilter; });
  if (videos.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg><p>点击上方搜索按钮，AI 将为你推荐相关视频攻略</p></div>';
    return;
  }
  var html = '';
  videos.forEach(function(video, idx) {
    html += '<div class="video-card" onclick="openVideoModal(' + idx + ')" style="animation-delay:' + (idx * 0.1) + 's"><div class="video-thumb"><img src="' + video.thumb + '" alt="' + video.title + '" loading="lazy"><div class="video-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><span class="video-duration">' + video.duration + '</span><span class="video-platform ' + video.platform + '">' + (video.platform === 'bilibili' ? 'B站' : '抖音') + '</span></div><div class="video-info"><h4>' + video.title + '</h4><div class="video-author">@' + video.author + '</div><div class="video-stats"><span>&#128065; ' + video.views + '</span><span>&#10084; ' + video.likes + '</span></div></div></div>';
  });
  container.innerHTML = html;
}

// ==================== SPECTRUM ENGINE ====================
var NUM_BINS = 128;
var spectrumData = new Float32Array(NUM_BINS);
var spectrumSmooth = new Float32Array(NUM_BINS);
var binOscillators = [];
for (var b = 0; b < NUM_BINS; b++) {
  binOscillators.push({
    freq1: 0.02 + Math.random() * 0.06,
    freq2: 0.03 + Math.random() * 0.09,
    freq3: 0.01 + Math.random() * 0.04,
    phase1: Math.random() * Math.PI * 2,
    phase2: Math.random() * Math.PI * 2,
    phase3: Math.random() * Math.PI * 2,
    baseEnergy: Math.max(0.1, 1.0 - b / NUM_BINS * 0.7),
    modRate: 0.003 + Math.random() * 0.008,
    modPhase: Math.random() * Math.PI * 2
  });
}
var songEnergy = 0.5;
var songPhase = 0;

function updateSpectrumEngine(t) {
  if (!rhythmMode) {
    for (var i = 0; i < NUM_BINS; i++) {
      spectrumSmooth[i] *= 0.95;
    }
    return;
  }
  songPhase += 0.0003;
  songEnergy = 0.4
    + Math.sin(songPhase) * 0.2
    + Math.sin(songPhase * 4.7) * 0.15
    + Math.sin(songPhase * 11.3) * 0.1;
  songEnergy = Math.max(0.15, Math.min(1.0, songEnergy));

  for (var i = 0; i < NUM_BINS; i++) {
    var osc = binOscillators[i];
    var raw = Math.sin(t * osc.freq1 + osc.phase1) * 0.4
            + Math.sin(t * osc.freq2 + osc.phase2) * 0.3
            + Math.sin(t * osc.freq3 + osc.phase3) * 0.2;
    raw += Math.sin(t * osc.modRate + osc.modPhase) * 0.3;
    raw = raw * 0.5 + 0.5;
    raw *= osc.baseEnergy;
    raw *= songEnergy;
    raw += (Math.random() - 0.5) * 0.04 * songEnergy;
    raw = Math.max(0, Math.min(1, raw));
    spectrumData[i] = raw;
    spectrumSmooth[i] += (raw - spectrumSmooth[i]) * 0.3;
  }
}

function getBandEnergy(bandIndex) {
  var bandRanges = [[0,8],[8,20],[20,38],[38,60],[60,90],[90,128]];
  var range = bandRanges[bandIndex];
  var sum = 0;
  for (var i = range[0]; i < range[1]; i++) sum += spectrumSmooth[i];
  return (range[1] - range[0]) > 0 ? sum / (range[1] - range[0]) : 0;
}

var spectrumFrame = 0;
function animateSpectrum() {
  spectrumFrame++;
  updateSpectrumEngine(spectrumFrame);
  if (window.updateThreeSpectrum) {
    window.updateThreeSpectrum(Array.from(spectrumSmooth));
  }
  if (rhythmMode) requestAnimationFrame(animateSpectrum);
}

function initSpectrumEngine() {
  if (rhythmMode) animateSpectrum();
}

// ==================== SCROLL REVEAL ====================
function initScrollReveal() {
  if (typeof gsap !== 'undefined' && gsap.registerPlugin && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal').forEach(function(el) {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });
  } else {
    // Fallback: IntersectionObserver
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
  }
}

// ==================== STARFIELD ====================
function initStarfield() {
  var container = document.querySelector('.starfield');
  if (!container) return;
  var count = 80;
  for (var i = 0; i < count; i++) {
    var star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.animationDuration = (2 + Math.random() * 3) + 's';
    var size = Math.random() > 0.8 ? 3 : 2;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    container.appendChild(star);
  }
}

// ==================== 3D TILT (Event Delegation) ====================
var _tiltParents = [];

function initTilt() {
  // Clean up previous listeners by replacing parent elements
  _tiltParents.forEach(function(p) {
    if (p.parentNode) {
      var clone = p.cloneNode(true);
      p.parentNode.replaceChild(clone, p);
    }
  });
  _tiltParents = [];

  var parentSelectors = ['#hotelList', '#videoGrid', '#routeList', '#workspace', '#itinerary', '#itineraryOutput'];
  parentSelectors.forEach(function(sel) {
    var parent = document.querySelector(sel);
    if (!parent) return;
    _tiltParents.push(parent);

    parent.addEventListener('mousemove', function(e) {
      var card = e.target.closest('.hotel-card, .video-card, .route-card, .feature-card, .glass-card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = (y - centerY) / centerY * -8;
      var rotateY = (x - centerX) / centerX * 8;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
    });

    parent.addEventListener('mouseleave', function(e) {
      var card = e.target.closest('.hotel-card, .video-card, .route-card, .feature-card, .glass-card');
      if (!card) {
        // Reset all cards in this parent when mouse leaves parent entirely
        parent.querySelectorAll('.hotel-card, .video-card, .route-card, .feature-card, .glass-card').forEach(function(c) {
          c.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        });
        return;
      }
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

// ==================== EVENT HANDLERS ====================
document.addEventListener('DOMContentLoaded', function() {
  var today = new Date();
  today.setDate(today.getDate() + 7);
  document.getElementById('departDate').value = today.toISOString().split('T')[0];

  initSpectrumEngine();
  initScrollReveal();
  initMusicPlayer();
  initStarfield();
  initTilt();

  // Try restore saved itinerary
  setTimeout(loadItinerary, 500);

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });

  document.querySelectorAll('[data-filter]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('[data-filter]').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      currentHotelFilter = chip.dataset.filter;
      renderHotels();
    });
  });

  document.querySelectorAll('[data-vfilter]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('[data-vfilter]').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      currentVideoFilter = chip.dataset.vfilter;
      renderVideos();
    });
  });
});

function quickSearch(dest) {
  // Set first destination input
  var inputs = document.querySelectorAll('#heroDestList .dest-input');
  if (inputs.length > 0) {
    inputs[0].value = dest;
    // Clear other destinations
    for (var i = 1; i < inputs.length; i++) {
      inputs[i].value = '';
    }
  }
  updateTripSummary();
  handleHeroSearch();
}

// ==================== DESTINATION LIST MANAGEMENT ====================
function addDestination() {
  var list = document.getElementById('heroDestList');
  var count = list.querySelectorAll('.dest-item').length + 1;
  var div = document.createElement('div');
  div.className = 'dest-item';
  div.innerHTML = '<div class="dest-arrow">→</div><div class="dest-input-wrap"><input type="text" class="search-input dest-input" placeholder="目的地 ' + count + '"></div><button class="dest-remove" onclick="removeDestination(this)" title="移除">×</button>';
  list.appendChild(div);
  updateTripSummary();
}

function removeDestination(btn) {
  var list = document.getElementById('heroDestList');
  var items = list.querySelectorAll('.dest-item');
  if (items.length <= 1) return; // Keep at least 1
  btn.closest('.dest-item').remove();
  updateTripSummary();
}

function getHeroDestinations() {
  var inputs = document.querySelectorAll('#heroDestList .dest-input');
  var results = [];
  inputs.forEach(function(inp) {
    var val = inp.value.trim();
    if (val) results.push(val);
  });
  return results;
}

function updateTripSummary() {
  var summary = document.getElementById('tripSummary');
  var fromCity = document.getElementById('heroFromCity').value.trim() || '出发地';
  var destinations = getHeroDestinations();
  if (destinations.length === 0) {
    summary.style.display = 'none';
    return;
  }
  var text = fromCity + ' → ' + destinations.join(' → ') + ' → 返回' + fromCity + '（环线）';
  summary.textContent = text;
  summary.style.display = 'block';
}

function addItinDestination() {
  var list = document.getElementById('itinDestList');
  var count = list.querySelectorAll('.dest-item-small').length + 1;
  var div = document.createElement('div');
  div.className = 'dest-item-small';
  div.innerHTML = '<span class="dest-item-num">D' + count + '</span><input type="text" class="search-input dest-input" placeholder="目的地 ' + count + '"><button class="dest-remove" onclick="removeItinDestination(this)" title="移除">×</button>';
  list.appendChild(div);
}

function removeItinDestination(btn) {
  var list = document.getElementById('itinDestList');
  var items = list.querySelectorAll('.dest-item-small');
  if (items.length <= 1) return;
  btn.closest('.dest-item-small').remove();
}

function getItinDestinations() {
  var inputs = document.querySelectorAll('#itinDestList .dest-input');
  var results = [];
  inputs.forEach(function(inp) {
    var val = inp.value.trim();
    if (val) results.push(val);
  });
  return results;
}

// ==================== SEARCH DEBOUNCE & CANCEL ====================
var _searchCancelToken = false;
var _searchDebounceTimer = null;
var _searchTimeouts = [];

function _scheduleTimeout(fn, delay) {
  if (_searchCancelToken) return;
  var id = setTimeout(function() {
    if (_searchCancelToken) return;
    fn();
  }, delay);
  _searchTimeouts.push(id);
  return id;
}

function _clearAllSearchTimeouts() {
  if (_searchTimeouts) {
    _searchTimeouts.forEach(function(id) { clearTimeout(id); });
    _searchTimeouts = [];
  }
}

function handleHeroSearch() {
  // Cancel any in-progress search chain
  _searchCancelToken = true;
  _clearAllSearchTimeouts();
  _searchCancelToken = false;
  
  // Debounce: 300ms
  if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
  _searchDebounceTimer = setTimeout(function() {
    _doHeroSearch();
  }, 300);
}

function _doHeroSearch() {
  _searchCancelToken = false;
  _searchTimeouts = [];

  var destinations = getHeroDestinations();
  var fromCity = document.getElementById('heroFromCity').value.trim() || '北京';
  var style = document.getElementById('heroTravelType').value;
  if (destinations.length === 0) { showToast('请输入至少一个目的地', 'info'); return; }

  updateTripSummary();

  // Trigger 3D flight arcs on the globe
  if (window.createFlightArc) {
    var prevCity = fromCity;
    destinations.forEach(function(dest) {
      var cityInfo = getCityInfo(dest);
      var cityKey = cityInfo ? cityInfo.key : dest;
      // Draw arc from prev to current
      window.createFlightArc(prevCity, cityKey);
      prevCity = cityKey;
    });
    // Return arc
    var lastCity = getCityInfo(destinations[destinations.length - 1]);
    var lastKey = lastCity ? lastCity.key : destinations[destinations.length - 1];
    window.createFlightArc(lastKey, fromCity);
  }

  var btn = document.getElementById('heroSearchBtn');
  btn.disabled = true;
  btn.textContent = 'AI 生成中...';

  showAIThinking();
  addThought('正在接入 AI 旅游分析引擎...');
  addThought('出发地：「' + escapeHTML(fromCity) + '」，环线目的地：' + destinations.map(function(d) { return '「' + escapeHTML(d) + '」'; }).join(' → '));

  var delay = 400;
  destinations.forEach(function(dest, idx) {
    _scheduleTimeout(function() { addThought('分析目的地' + (idx+1) + '：「' + escapeHTML(dest) + '」，地理位置与气候特征...'); }, delay);
    delay += 300;
  });
  _scheduleTimeout(function() { addThought('规划环线路线：' + fromCity + ' → ' + destinations.join(' → ') + ' → 返回' + fromCity); }, delay);
  delay += 300;

  // Hotels for first destination
  _scheduleTimeout(function() {
    addThought('正在爬取携程酒店数据...');
  }, delay);
  delay += 200;
  _scheduleTimeout(function() {
    addThought('正在爬取去哪儿酒店数据...');
  }, delay);
  delay += 200;
  _scheduleTimeout(function() {
    addThought('正在爬取 Booking / Agoda 国际平台数据...');
  }, delay);
  delay += 200;
  _scheduleTimeout(function() {
    addThought('交叉比对 5 个平台价格，寻找最优价格...');
    currentHotels = generateHotels(destinations[0], 'comfort');
    renderHotels();
    initTilt();
  }, delay);
  delay += 300;

  // Multi-segment transport
  _scheduleTimeout(function() {
    addThought('分析环线各段距离，计算交通方案...');
  }, delay);
  delay += 300;
  _scheduleTimeout(function() {
    addThought('检索各段航班时刻表与高铁班次...');
    var allRoutes = generateMultiSegmentTransport(fromCity, destinations);
    renderMultiTransport(allRoutes);
    initTilt();
  }, delay);
  delay += 300;

  // Videos
  _scheduleTimeout(function() {
    addThought('正在检索 Bilibili 平台相关视频...');
  }, delay);
  delay += 200;
  _scheduleTimeout(function() {
    addThought('正在检索抖音平台相关视频...');
  }, delay);
  delay += 200;
  _scheduleTimeout(function() {
    addThought('正在通过网络搜索专属BGM推荐...');
  }, delay);
  delay += 250;
  _scheduleTimeout(function() {
    var bgm = getBGMForDest(destinations[0]);
    addThought('已找到匹配曲目：<span style="color:var(--accent)">' + escapeHTML(bgm.title) + '</span>，获取BV号并加载播放器...');
    loadMusicForDest(destinations[0]);
  }, delay);
  delay += 200;
  _scheduleTimeout(function() {
    addThought('视频内容分析完成，筛选优质攻略...');
    currentVideos = generateVideos(destinations[0], 'all');
    renderVideos();
    initTilt();
  }, delay);
  delay += 300;

  _scheduleTimeout(function() {
    hideAIThinking();
    document.getElementById('workspace').scrollIntoView({ behavior: 'smooth' });
    showToast('已生成环线「' + fromCity + ' → ' + destinations.join(' → ') + ' → ' + fromCity + '」的完整旅游信息', 'success');
    btn.disabled = false;
    btn.textContent = 'AI 生成攻略';

    // Auto-sync destinations to itinerary section and trigger full itinerary generation
    syncHeroToItinerary(destinations, fromCity, style);
  }, delay);
}

function syncHeroToItinerary(destinations, fromCity, style) {
  // Sync destination inputs
  var itinInputs = document.querySelectorAll('#itinDestList .dest-input');
  for (var i = 0; i < itinInputs.length; i++) {
    itinInputs[i].value = destinations[i] || '';
  }
  // Add more inputs if needed
  while (itinInputs.length < destinations.length) {
    addItinDestination();
    itinInputs = document.querySelectorAll('#itinDestList .dest-input');
  }
  // Fill any new inputs
  for (var j = 0; j < destinations.length; j++) {
    itinInputs[j].value = destinations[j];
  }
  // Remove extra empty inputs beyond what we need
  var allItems = document.querySelectorAll('#itinDestList .dest-item-small');
  for (var k = allItems.length - 1; k >= destinations.length; k--) {
    if (k > 0) allItems[k].remove();
  }

  // Sync from city and style
  document.getElementById('itinFromCity').value = fromCity;
  document.getElementById('itinStyle').value = style;

  // Trigger itinerary generation after a short delay
  setTimeout(function() {
    generateItinerary();
  }, 500);
}

function styleName(s) {
  var map = { relax: '休闲度假', adventure: '户外探险', culture: '人文历史', food: '美食之旅', photo: '摄影采风' };
  return map[s] || '休闲度假';
}

function searchTransport() {
  var from = document.getElementById('fromCity').value.trim() || '北京';
  var to = document.getElementById('toCity').value.trim();
  if (!to) { showToast('请输入目的城市', 'info'); return; }
  var routes = generateTransport(from, to);
  renderTransport(routes);
  showToast('已生成「' + from + ' → ' + to + '」的交通方案', 'success');
}

// Generate multi-segment transport for ring route: from→D1, D1→D2, ..., Dn→from
function generateMultiSegmentTransport(fromCity, destinations) {
  var segments = [];
  var route = [fromCity].concat(destinations).concat([fromCity]);
  for (var i = 0; i < route.length - 1; i++) {
    var segFrom = route[i];
    var segTo = route[i + 1];
    var isReturn = (i === route.length - 2);
    var routes = generateTransport(segFrom, segTo);
    segments.push({
      from: segFrom,
      to: segTo,
      isReturn: isReturn,
      routes: routes
    });
  }
  return segments;
}

// Render multi-segment transport cards with segment headers
function renderMultiTransport(allSegments) {
  var container = document.getElementById('routeList');
  if (!allSegments || allSegments.length === 0) {
    container.innerHTML = '<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><p>请输入出发地和目的地，AI 将为你实时规划交通方案</p></div>';
    return;
  }
  var html = '';
  allSegments.forEach(function(seg) {
    var label = seg.isReturn ? ('&#8617; 返回：' + escapeHTML(seg.to)) : (escapeHTML(seg.from) + ' &#8594; ' + escapeHTML(seg.to));
    html += '<div class="transport-segment-header"><h4>' + label + '</h4></div>';
    seg.routes.forEach(function(route) {
      var icon = route.icon === 'plane' ? '&#9992;' : route.icon === 'train' ? '&#128646;' : route.icon === 'bus' ? '&#128652;' : '&#128663;';
      html += '<div class="route-card' + (route.recommended ? ' recommended' : '') + '"><div class="route-header"><div class="route-type"><div class="route-type-icon ' + route.icon + '">' + icon + '</div><span>' + escapeHTML(route.name) + '</span>' + (route.recommended ? '<span class="recommend-tag">推荐</span>' : '') + '</div><div class="route-price">&yen;' + route.price + '<span style="font-size:0.75rem;color:var(--muted);font-weight:400;"> ' + (route.priceNote || '') + '</span></div></div><div class="route-meta"><span>&#128339; ' + route.duration + '</span>' + (route.depart !== '-' ? '<span>&#128197; ' + route.depart + ' &rarr; ' + route.arrive + '</span>' : '') + '</div><div class="route-detail">' + escapeHTML(route.detail) + '</div></div>';
    });
  });
  container.innerHTML = html;
}

function generateItinerary() {
  var destinations = getItinDestinations();
  if (destinations.length === 0) { showToast('请至少填写一个目的地', 'info'); return; }

  var style = document.getElementById('itinStyle').value;
  var budget = document.getElementById('itinBudget').value;
  var fromCity = document.getElementById('itinFromCity').value.trim() || '北京';
  var special = document.getElementById('itinSpecial').value.trim();

  // Dynamic days: each destination at least 1 day + 1 transit buffer
  var days = destinations.length + 1;

  var btn = document.getElementById('btnGenItin');
  btn.disabled = true;
  btn.textContent = 'AI 生成中...';

  showLoading('AI 正在分析环线「' + fromCity + ' → ' + destinations.join(' → ') + ' → ' + fromCity + '」并生成' + days + '天攻略...');

  setTimeout(function() {
    var result = generateItineraryData(destinations, fromCity, style, budget, special);
    window.currentItinerary = result;
    window.currentItineraryCity = destinations[0];

    // === Extract spot coords & draw 3D itinerary route (async geocoding) ===
    // Pre-populate geocode cache for all spots in all days
    var geoPromises = [];
    result.days.forEach(function(day) {
      var cityName = day.city || '';
      day.items.forEach(function(item) {
        if (item.tags.indexOf('景点') !== -1 && item.spotName) {
          geoPromises.push(getSpotCoordsAsync(cityName, item.spotName));
        }
        if (item.tags.indexOf('酒店') !== -1 && day.hotel) {
          geoPromises.push(getSpotCoordsAsync(cityName, day.hotel.area));
        }
      });
    });

    Promise.all(geoPromises).then(function() {
      // Draw 3D route on Earth
      try {
        if (window.drawItineraryRoute) {
          window.drawItineraryRoute(destinations, fromCity);
        }
      } catch(e) { console.warn('3D route draw failed:', e); }
    }).catch(function(e) { console.warn('Geocoding batch failed:', e); });
    // ===

    var html = renderItineraryHTML(result);
    document.getElementById('itineraryOutput').innerHTML = html;
    document.getElementById('itineraryOutput').classList.add('visible');

    // Show export button and map
    document.getElementById('btnExport').style.display = 'inline-block';

    // Create / re-create map container inside itineraryOutput (safe from external DOM mutations)
    var oldMap = document.getElementById('itineraryMap');
    if (oldMap) oldMap.remove();
    var mapContainer = document.createElement('div');
    mapContainer.id = 'itineraryMap';
    var outputEl = document.getElementById('itineraryOutput');
    outputEl.appendChild(mapContainer);

    // Init 2D Leaflet map after container is in DOM (uses local fallback coords)
    try {
      initLeafletMap(result);
    } catch(e) { console.warn('Leaflet map init failed:', e); }

    // Init sortable after DOM ready
    setTimeout(function() {
      initSortable();
    }, 100);

    hideLoading();
    showToast('攻略生成完成！', 'success');
    document.getElementById('itineraryOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
    btn.disabled = false;
    btn.textContent = 'AI 生成攻略';
  }, 2500);
}

function resetItinerary() {
  // Clear destination list inputs
  var destInputs = document.querySelectorAll('#itinDestList .dest-input');
  destInputs.forEach(function(inp) { inp.value = ''; });
  // Keep at least first input, fill with placeholder value
  if (destInputs.length > 0) destInputs[0].value = '';
  
  document.getElementById('itinStyle').selectedIndex = 0;
  document.getElementById('itinBudget').selectedIndex = 1;
  document.getElementById('itinFromCity').value = '北京';
  document.getElementById('itinSpecial').value = '';
  document.getElementById('itineraryOutput').classList.remove('visible');
  var mapEl = document.getElementById('itineraryMap');
  if (mapEl) mapEl.remove();
  document.getElementById('btnExport').style.display = 'none';
  if (window.itineraryMap) { window.itineraryMap.remove(); window.itineraryMap = null; }
  window.currentItinerary = null;
  showToast('已重置', 'info');
}

// ==================== ITINERARY RENDER (with edit controls) ====================
function renderItineraryHTML(result) {
  var html = '';
  result.days.forEach(function(day, dayIdx) {
    html += '<div class="day-section" data-day="' + dayIdx + '">';
    html += '<div class="day-header"><div class="day-badge">D' + (dayIdx + 1) + '</div><div><h3>' + day.title + '</h3><span class="day-date">' + day.date + '</span></div></div>';

    // Hotel info bar
    if (day.hotel) {
      html += '<div class="day-hotel-bar">' +
        '<span class="hotel-icon">&#127976;</span>' +
        '<span class="hotel-name">' + escapeHTML(day.hotel.name) + '</span>' +
        '<span class="hotel-area">' + escapeHTML(day.hotel.area) + '</span>' +
        '<span class="hotel-price">&yen;' + day.hotel.price + '/晚</span>' +
      '</div>';
    }

    html += '<div class="timeline" id="timeline-' + dayIdx + '">';
    day.items.forEach(function(item, itemIdx) {
      var tagHtml = item.tags.map(function(t) {
        var cls = t === '景点' ? 'scenic' : t === '美食' ? 'food' : t === '酒店' ? 'hotel' : t === '交通' ? 'transport' : 'tip';
        return '<span class="card-tag ' + cls + '">' + t + '</span>';
      }).join('');
      html += '<div class="timeline-item" data-day="' + dayIdx + '" data-index="' + itemIdx + '">' +
        '<div class="drag-handle"><span></span><span></span><span></span><span></span></div>' +
        '<div class="timeline-dot"></div>' +
        '<div class="timeline-time">' + item.time + '</div>' +
        '<div class="timeline-card">' +
          '<div class="item-actions">' +
            '<button class="item-btn" onclick="deleteItem(' + dayIdx + ',' + itemIdx + ')" title="删除">&times;</button>' +
          '</div>' +
          '<h4>' + escapeHTML(item.title) + '</h4><p>' + escapeHTML(item.desc) + '</p><div class="card-tags">' + tagHtml + '</div>' +
        '</div>' +
      '</div>';

      // Transit segment between items
      if (item.transitToNext && itemIdx < day.items.length - 1) {
        var tr = item.transitToNext;
        var modeIcon = tr.mode === 'walk' ? '&#128694;' : tr.mode === 'bus' ? '&#128652;' : '&#128663;';
        html += '<div class="transit-segment">' +
          '<div class="transit-line"></div>' +
          '<div class="transit-info">' +
            '<span class="transit-icon">' + modeIcon + '</span>' +
            '<span class="transit-label">' + tr.label + '</span>' +
            '<span class="transit-detail">' + tr.duration + (tr.cost > 0 ? ' / ' + tr.cost : '') + ' / ' + tr.dist + 'km</span>' +
          '</div>' +
        '</div>';
      }
    });
    html += '</div>';
    html += '<div class="day-actions"><button onclick="addItem(' + dayIdx + ')">+ 添加活动</button></div>';
    html += '</div>';
  });

  var total = 0;
  html += '<div class="budget-bar"><h3>预算参考（每人）</h3><div class="budget-items">';
  Object.keys(result.budget).forEach(function(k) {
    total += result.budget[k];
    html += '<div class="budget-item"><span class="budget-label">' + k + '</span><span class="budget-value">&yen;' + result.budget[k] + '</span></div>';
  });
  html += '<div class="budget-total"><span class="budget-label">预估总计</span><span class="budget-value">&yen;' + total + '</span></div></div></div>';
  return html;
}

// ==================== LEAFLET 2D MAP ====================
function initLeafletMap(result) {
  if (typeof L === 'undefined') return;
  var mapContainer = document.getElementById('itineraryMap');
  if (!mapContainer) return;

  // Remove previous map instance — Leaflet's .remove() destroys the container,
  // so we must re-create it after removal. Guard against stale non-Map values.
  try {
    if (window.itineraryMap && typeof window.itineraryMap.getContainer === 'function') {
      var oldContainer = window.itineraryMap.getContainer();
      var parentOfOld = oldContainer && oldContainer.parentNode;
      window.itineraryMap.remove();
      window.itineraryMap = null;
      // Leaflet removed the container, re-append a fresh one
      if (parentOfOld && !document.getElementById('itineraryMap')) {
        var fresh = document.createElement('div');
        fresh.id = 'itineraryMap';
        parentOfOld.appendChild(fresh);
      }
    } else {
      window.itineraryMap = null;
    }
  } catch(cleanupErr) {
    console.warn('[MAP] Cleanup error:', cleanupErr);
    window.itineraryMap = null;
  }

  var dayColors = ['#f59e0b', '#06b6d4', '#a855f7', '#10b981', '#ef4444', '#ec4899', '#f97316'];
  var dayLayers = [];
  var allBounds = [];

  // Compute center from first day's city
  var firstCity = result.days[0] && result.days[0].city ? result.days[0].city : '';
  var cityInfo = getCityInfo(firstCity);
  var center = cityInfo && cityInfo.info && cityInfo.info.center ? cityInfo.info.center : [35.0, 105.0];

  window.itineraryMap = L.map('itineraryMap').setView([center[0], center[1]], 11);

  // Dark theme tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 18,
    subdomains: 'abcd'
  }).addTo(window.itineraryMap);

  // Process each day
  result.days.forEach(function(day, dayIdx) {
    var color = dayColors[dayIdx % dayColors.length];
    var layerGroup = L.layerGroup();
    var latlngs = [];
    var cityName = day.city || '';

    // Hotel marker
    if (day.hotel) {
      var hotelCoords = getSpotCoords(cityName, day.hotel.area);
      if (!hotelCoords) hotelCoords = getCityCenter(cityName);
      if (hotelCoords) {
        var hotelMarker = L.marker([hotelCoords[0], hotelCoords[1]], {
          icon: L.divIcon({
            className: 'hotel-marker',
            html: '<div style="background:' + color + ';width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);">&#127976;</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });
        hotelMarker.bindPopup('<b>D' + (dayIdx + 1) + ' 住宿</b><br>' + escapeHTML(day.hotel.name) + '<br>' + escapeHTML(day.hotel.area) + '<br>&yen;' + day.hotel.price + '/晚');
        layerGroup.addLayer(hotelMarker);
        latlngs.push([hotelCoords[0], hotelCoords[1]]);
        allBounds.push([hotelCoords[0], hotelCoords[1]]);
      }
    }

    // Spot markers
    day.items.forEach(function(item, itemIdx) {
      if (item.tags.indexOf('景点') === -1 || !item.spotName) return;
      var coords = getSpotCoords(cityName, item.spotName);
      if (!coords) return;

      var latlng = [coords[0], coords[1]];
      latlngs.push(latlng);
      allBounds.push(latlng);

      var spotMarker = L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      });
      spotMarker.bindPopup('<b>D' + (dayIdx + 1) + ' ' + item.time + '</b><br>' + escapeHTML(item.title));
      layerGroup.addLayer(spotMarker);

      // Day label
      var labelMarker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'day-label',
          html: '<span style="background:' + color + ';color:#0f172a;padding:1px 5px;border-radius:8px;font-size:10px;font-weight:700;">D' + (dayIdx + 1) + '</span>',
          iconSize: [30, 14],
          iconAnchor: [15, 28]
        })
      });
      layerGroup.addLayer(labelMarker);
    });

    // Draw transit segments between spots
    for (var k = 0; k < day.items.length - 1; k++) {
      var cur = day.items[k];
      var next = day.items[k + 1];
      if (cur.tags.indexOf('景点') === -1 || !cur.spotName) continue;
      if (next.tags.indexOf('景点') === -1 && next.tags.indexOf('酒店') === -1) continue;

      var fromCoords = getSpotCoords(cityName, cur.spotName);
      var toTarget = next.spotName || (next.hotelName ? day.hotel.area : null);
      if (!toTarget && next.tags.indexOf('酒店') !== -1 && day.hotel) toTarget = day.hotel.area;
      var toCoords = toTarget ? getSpotCoords(cityName, toTarget) : null;
      if (!fromCoords || !toCoords) continue;

      var transitMode = cur.transitToNext;
      var lineStyle = { color: color, weight: 2, opacity: 0.6 };
      if (transitMode) {
        if (transitMode.mode === 'walk') {
          lineStyle.dashArray = '3, 6';
          lineStyle.weight = 2;
        } else if (transitMode.mode === 'bus') {
          lineStyle.dashArray = '8, 4';
          lineStyle.weight = 3;
        } else {
          lineStyle.dashArray = 'none';
          lineStyle.weight = 3;
        }
      } else {
        lineStyle.dashArray = '6, 6';
      }

      var transitLine = L.polyline([[fromCoords[0], fromCoords[1]], [toCoords[0], toCoords[1]]], lineStyle);
      if (transitMode) {
        transitLine.bindPopup(escapeHTML(transitMode.label) + ' / ' + transitMode.duration + (transitMode.cost > 0 ? ' / ' + transitMode.cost : '') + ' / ' + transitMode.dist + 'km');
      }
      layerGroup.addLayer(transitLine);
    }

    // Connect all spots with a thin overview line
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: color, weight: 1, opacity: 0.3, dashArray: '4, 8' }).addTo(layerGroup);
    }

    layerGroup.addTo(window.itineraryMap);
    dayLayers.push({ layer: layerGroup, day: dayIdx, color: color, title: day.title });
  });

  // Legend + day filter
  var legendDiv = L.control({ position: 'topright' });
  legendDiv.onAdd = function() {
    var div = L.DomUtil.create('div', 'map-legend');
    var html = '<div class="legend-title">行程图层</div>';
    html += '<div class="legend-item"><span class="legend-dot scenic"></span>景点</div>';
    html += '<div class="legend-item"><span class="legend-dot hotel">&#127976;</span>酒店</div>';
    html += '<div class="legend-item"><span class="legend-line walk"></span>步行</div>';
    html += '<div class="legend-item"><span class="legend-line bus"></span>公交</div>';
    html += '<div class="legend-item"><span class="legend-line taxi"></span>打车</div>';
    html += '<div class="legend-divider"></div>';
    html += '<div class="legend-days">';
    dayLayers.forEach(function(dl) {
      html += '<label class="legend-day-toggle"><input type="checkbox" checked data-day="' + dl.day + '"><span class="legend-day-dot" style="background:' + dl.color + '"></span>D' + (dl.day + 1) + ' ' + escapeHTML(dl.title.substring(0, 8)) + '</label>';
    });
    html += '</div>';
    div.innerHTML = html;
    return div;
  };
  legendDiv.addTo(window.itineraryMap);

  // Day toggle handlers
  var legendContainer = legendDiv.getContainer();
  var checkboxes = legendContainer.querySelectorAll('input[type="checkbox"]');
  for (var c = 0; c < checkboxes.length; c++) {
    checkboxes[c].addEventListener('change', function(e) {
      var dayNum = parseInt(e.target.getAttribute('data-day'));
      if (e.target.checked) {
        dayLayers[dayNum].layer.addTo(window.itineraryMap);
      } else {
        window.itineraryMap.removeLayer(dayLayers[dayNum].layer);
      }
    });
  }

  // Fit bounds
  if (allBounds.length > 0) {
    window.itineraryMap.fitBounds(allBounds, { padding: [40, 40] });
  }
}


// ==================== DYNAMIC SCRIPT LOADING ====================
var _sortableLoaded = false;
var _sortableLoadPromise = null;

function loadSortable() {
  if (typeof Sortable !== 'undefined') return Promise.resolve();
  if (_sortableLoadPromise) return _sortableLoadPromise;
  _sortableLoadPromise = new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = 'assets/Sortable.min.js';
    script.onload = function() { _sortableLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _sortableLoadPromise;
}

var _html2pdfLoaded = false;
var _html2pdfLoadPromise = null;

function loadHtml2Pdf() {
  if (typeof html2pdf !== 'undefined') return Promise.resolve();
  if (_html2pdfLoadPromise) return _html2pdfLoadPromise;
  _html2pdfLoadPromise = new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = 'assets/html2pdf.bundle.min.js';
    script.onload = function() { _html2pdfLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _html2pdfLoadPromise;
}

// ==================== SORTABLE DRAG & DROP ====================
function initSortable() {
  loadSortable().then(function() {
    _initSortableImpl();
  }).catch(function() {
    console.warn('Sortable.js 加载失败，拖拽排序不可用');
    _sortableLoadPromise = null; // Allow retry on next call
  });
}

function _initSortableImpl() {
  document.querySelectorAll('.timeline').forEach(function(timeline) {
    if (timeline._sortable) return;
    timeline._sortable = new Sortable(timeline, {
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: function() {
        syncItineraryFromDOM();
        saveItinerary();
      }
    });
  });
}

function deleteItem(dayIdx, itemIdx) {
  if (!window.currentItinerary || !window.currentItinerary.days[dayIdx]) return;
  window.currentItinerary.days[dayIdx].items.splice(itemIdx, 1);
  document.getElementById('itineraryOutput').innerHTML = renderItineraryHTML(window.currentItinerary);
  initSortable();
  saveItinerary();
}

function addItem(dayIdx) {
  if (!window.currentItinerary || !window.currentItinerary.days[dayIdx]) return;
  var newItem = {
    time: '自定',
    title: '自定义活动',
    desc: '点击编辑添加活动详情',
    tags: ['景点']
  };
  window.currentItinerary.days[dayIdx].items.push(newItem);
  document.getElementById('itineraryOutput').innerHTML = renderItineraryHTML(window.currentItinerary);
  initSortable();
  saveItinerary();
}

function syncItineraryFromDOM() {
  if (!window.currentItinerary) return;
  document.querySelectorAll('.day-section').forEach(function(dayEl) {
    var dayIdx = parseInt(dayEl.getAttribute('data-day'));
    var newItems = [];
    dayEl.querySelectorAll('.timeline-item').forEach(function(itemEl) {
      var title = itemEl.querySelector('.timeline-card h4').textContent;
      var desc = itemEl.querySelector('.timeline-card p').textContent;
      var time = itemEl.querySelector('.timeline-time').textContent;
      var tags = [];
      itemEl.querySelectorAll('.card-tag').forEach(function(tagEl) {
        var cls = tagEl.className;
        if (cls.indexOf('scenic') !== -1) tags.push('景点');
        else if (cls.indexOf('food') !== -1) tags.push('美食');
        else if (cls.indexOf('hotel') !== -1) tags.push('酒店');
        else if (cls.indexOf('transport') !== -1) tags.push('交通');
        else tags.push('提示');
      });
      newItems.push({ time: time, title: title, desc: desc, tags: tags });
    });
    if (window.currentItinerary.days[dayIdx]) {
      window.currentItinerary.days[dayIdx].items = newItems;
    }
  });
}

// ==================== LOCALSTORAGE PERSIST ====================
function saveItinerary() {
  if (!window.currentItinerary || !window.currentItineraryCity) return;
  try {
    var key = 'itinerary_' + hashString(window.currentItineraryCity);
    localStorage.setItem(key, JSON.stringify(window.currentItinerary));
    localStorage.setItem(key + '_city', window.currentItineraryCity);
  } catch(e) {}
}

function loadItinerary() {
  try {
    var destinations = getItinDestinations();
    if (destinations.length === 0) return;
    var dest = destinations[0];
    var key = 'itinerary_' + hashString(dest);
    var saved = localStorage.getItem(key);
    var savedCity = localStorage.getItem(key + '_city');
    if (saved && savedCity === dest) {
      window.currentItinerary = JSON.parse(saved);
      window.currentItineraryCity = dest;
      document.getElementById('itineraryOutput').innerHTML = renderItineraryHTML(window.currentItinerary);
      document.getElementById('itineraryOutput').classList.add('visible');
      document.getElementById('btnExport').style.display = 'inline-block';
      // Re-create map container inside output and init map
      var oldMap = document.getElementById('itineraryMap');
      if (oldMap) oldMap.remove();
      var mc = document.createElement('div');
      mc.id = 'itineraryMap';
      document.getElementById('itineraryOutput').appendChild(mc);
      try { initLeafletMap(window.currentItinerary); } catch(e) {}
      initSortable();
      showToast('已恢复上次编辑的行程', 'info');
    }
  } catch(e) {}
}

// ==================== EXPORT PDF ====================
function exportPDF() {
  var element = document.getElementById('itineraryOutput');
  if (!element || element.innerHTML.trim() === '') {
    showToast('请先生成攻略', 'info');
    return;
  }
  if (typeof html2pdf === 'undefined') {
    showToast('正在加载 PDF 导出库...', 'info');
    loadHtml2Pdf().then(function() {
      _doExportPDF();
    }).catch(function() {
      showToast('PDF 导出库加载失败', 'error');
      _html2pdfLoadPromise = null; // Allow retry
    });
    return;
  }
  _doExportPDF();
}

function _doExportPDF() {
  var element = document.getElementById('itineraryOutput');
  if (!element || element.innerHTML.trim() === '') {
    showToast('请先生成攻略', 'info');
    return;
  }
  showToast('正在生成 PDF...', 'info');
  var opt = {
    margin: 10,
    filename: '智游攻略_' + (window.currentItineraryCity || '行程') + '.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0f1e' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save().then(function() {
    showToast('PDF 导出成功', 'success');
  }).catch(function() {
    showToast('PDF 导出失败', 'error');
  });
}

function showAIThinking() {
  var el = document.getElementById('aiThinking');
  el.classList.add('visible');
  document.getElementById('aiThoughts').innerHTML = '';
}
function hideAIThinking() {
  document.getElementById('aiThinking').classList.remove('visible');
}
function addThought(text) {
  var container = document.getElementById('aiThoughts');
  var div = document.createElement('div');
  div.className = 'ai-thought';
  div.textContent = text;
  container.appendChild(div);
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || '加载中...';
  document.getElementById('loadingOverlay').classList.add('visible');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('visible');
}

function showToast(msg, type) {
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.innerHTML = (type === 'success' ? '&#10003; ' : '&#8505; ') + msg;
  container.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s'; }, 2500);
  setTimeout(function() { if (toast.parentNode) container.removeChild(toast); }, 2800);
}

// ==================== VIDEO MODAL ====================
function openVideoModal(idx) {
  var videos = currentVideos;
  if (currentVideoFilter !== 'all') videos = videos.filter(function(v) { return v.type === currentVideoFilter; });
  var video = videos[idx];
  if (!video) return;
  document.getElementById('modalThumb').src = video.thumb;
  document.getElementById('modalTitle').textContent = video.title;
  document.getElementById('modalAuthor').textContent = '@' + video.author + '  ·  ' + video.platform + '  ·  ' + video.views + '播放';
  document.getElementById('videoModal').classList.add('visible');
}

function closeVideoModal() {
  document.getElementById('videoModal').classList.remove('visible');
}

function playVideo() {
  showToast('正在跳转至视频平台播放...', 'info');
  setTimeout(function() {
    showToast('（Demo 演示模式：实际产品将跳转至 B站/抖音 原视频页面）', 'success');
  }, 1000);
}

// ==================== MUSIC PLAYER & RHYTHM MODE ====================
var rhythmMode = false;
var miniSpectrumInterval = null;
var musicPopupVisible = false;
var currentBvid = '';
var currentSongTitle = '';
var currentDestName = '';

// Destination -> BGM mapping (B站BV号，通过API自动提取)
var destMusicMap = {
  '大理': { title: '浪漫故事都会在', bvid: 'BV1PN411b7zK' },
  '丽江': { title: '丽江鼓手《小宝贝》', bvid: 'BV1tx411G7Gh' },
  '昆明': { title: '麻园诗人《昆明》', bvid: 'BV1Kw411g7Y4' },
  '成都': { title: '吉他指弹 赵雷《成都》', bvid: 'BV1fx41117Mh' },
  '重庆': { title: '重庆音乐喷泉', bvid: 'BV1ApTH6pEqk' },
  '西安': { title: '中国古典音乐·笛子古筝', bvid: 'BV1EX4y1M7c8' },
  '杭州': { title: '杭州西湖blue hour纯音乐', bvid: 'BV1th3LzqE7w' },
  '苏州': { title: '苏州园林·古风纯音乐', bvid: 'BV1EX4y1M7c8' },
  '厦门': { title: '《启程》电子琴纯音乐', bvid: 'BV191421C7he' },
  '青岛': { title: '海边氛围纯音乐·海风', bvid: 'BV1iBuBzVEEK' },
  '三亚': { title: '雨声爵士乐咖啡馆', bvid: 'BV1k64y1B76M' },
  '桂林': { title: '桂林山水风景素材', bvid: 'BV14rJtzoEUB' },
  '拉萨': { title: '川藏行·献给梦想的人们', bvid: 'BV1bJ411K7xS' },
  '张家界': { title: 'Sappheiros-Embrace纯音乐', bvid: 'BV1h44y1M7GC' },
  '长沙': { title: '长安一夜·古城夜景航拍', bvid: 'BV1Yb4y1Q7ad' },
  '北京': { title: '北京电报大楼东方红钟声', bvid: 'BV1Ve411d7wg' },
  '上海': { title: '上海夜爵士·奢华酒廊', bvid: 'BV16r7N6hEps' },
  '南京': { title: '南京的夜晚·桨声灯影', bvid: 'BV1Ny4y157z1' },
  '武汉': { title: '古风纯音乐歌单·钢琴', bvid: 'BV1ZUFYeEEbM' },
  '哈尔滨': { title: '冰雨·钢琴纯音乐', bvid: 'BV1YJ411t7T4' }
};

function getBGMForDest(dest) {
  var city = getCityInfo(dest);
  var key = city ? city.key : dest;
  if (destMusicMap[key]) return destMusicMap[key];
  // Fallback: deterministic pick from available songs
  var seed = hashString(dest + '_bgm');
  var keys = Object.keys(destMusicMap);
  return destMusicMap[keys[seed % keys.length]];
}

function initMusicPlayer() {
  initNavSpectrum();
}

function initNavSpectrum() {
  var container = document.getElementById('navSpectrum');
  if (!container) return;
  var html = '';
  for (var i = 0; i < 8; i++) {
    html += '<div class="bar" style="height:2px"></div>';
  }
  container.innerHTML = html;
}

function loadMusicForDest(dest) {
  var bgm = getBGMForDest(dest);
  currentBvid = bgm.bvid;
  currentSongTitle = bgm.title;
  currentDestName = dest;

  // Update nav label
  var label = document.getElementById('navSongLabel');
  if (label) label.textContent = bgm.title;

  // Update popup info
  var popupInfo = document.getElementById('popupInfo');
  if (popupInfo) popupInfo.innerHTML = '<strong>' + bgm.title + '</strong> &middot; ' + dest;

  // Load into iframe
  var iframe = document.getElementById('bilibiliPlayer');
  if (iframe) {
    iframe.src = 'https://player.bilibili.com/player.html?bvid=' + bgm.bvid + '&page=1&high_quality=1&danmaku=0&autoplay=1&muted=0';
  }

  // Auto enable rhythm mode
  if (!rhythmMode) toggleRhythmMode(true);
}

function toggleMusicPopup() {
  musicPopupVisible = !musicPopupVisible;
  var popup = document.getElementById('musicPopup');
  var btn = document.getElementById('navPlayBtn');
  popup.classList.toggle('visible', musicPopupVisible);
  if (btn) btn.classList.toggle('active', musicPopupVisible);
}

function loadBilibiliVideoFromInput() {
  var input = document.getElementById('bvidInput');
  var val = input.value.trim();
  if (!val) { showToast('请输入BV号', 'info'); return; }
  var bvid = val.startsWith('BV') ? val : val;
  currentBvid = bvid;
  currentSongTitle = '自定义音乐';

  var label = document.getElementById('navSongLabel');
  if (label) label.textContent = currentSongTitle;
  var popupInfo = document.getElementById('popupInfo');
  if (popupInfo) popupInfo.innerHTML = '<strong>' + currentSongTitle + '</strong>';

  var iframe = document.getElementById('bilibiliPlayer');
  if (iframe) {
    iframe.src = 'https://player.bilibili.com/player.html?bvid=' + bvid + '&page=1&high_quality=1&danmaku=0&autoplay=1&muted=0';
  }
  if (!musicPopupVisible) toggleMusicPopup();
  if (!rhythmMode) toggleRhythmMode(true);
  showToast('已加载 B站音乐', 'success');
}

function toggleRhythmMode(forceState) {
  if (typeof forceState !== 'undefined') rhythmMode = forceState;
  else rhythmMode = !rhythmMode;

  var btn = document.getElementById('navRhythmBtn');
  if (btn) btn.classList.toggle('active', rhythmMode);

  if (rhythmMode) {
    startNavSpectrumAnimation();
    animateSpectrum();
  } else {
    stopNavSpectrumAnimation();
  }
}

function startNavSpectrumAnimation() {
  if (miniSpectrumInterval) clearInterval(miniSpectrumInterval);
  var bars = document.querySelectorAll('#navSpectrum .bar');
  miniSpectrumInterval = setInterval(function() {
    bars.forEach(function(bar, idx) {
      var bandIdx = Math.floor((idx / bars.length) * 6);
      var energy = getBandEnergy(bandIdx);
      var h = 2 + energy * 16;
      bar.style.height = h + 'px';
      bar.style.background = energy > 0.6 ? 'var(--accent)' : 'var(--accent2)';
    });
  }, 80);
}

function stopNavSpectrumAnimation() {
  if (miniSpectrumInterval) {
    clearInterval(miniSpectrumInterval);
    miniSpectrumInterval = null;
  }
  var bars = document.querySelectorAll('#navSpectrum .bar');
  bars.forEach(function(bar) {
    bar.style.height = '2px';
    bar.style.background = 'var(--accent2)';
  });
}

// === Auto-init: trip summary live update on hero input changes ===
(function() {
  function _bindHeroInputs() {
    var heroSearchBox = document.querySelector('.search-box');
    if (!heroSearchBox) return;
    heroSearchBox.addEventListener('input', function(e) {
      var target = e.target;
      if (target.id === 'heroFromCity' || target.closest('#heroDestList')) {
        updateTripSummary();
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bindHeroInputs);
  } else {
    _bindHeroInputs();
  }
})();
