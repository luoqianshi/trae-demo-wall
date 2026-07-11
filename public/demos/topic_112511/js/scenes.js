// 大地图上的地点定义
// 地图尺寸: 2400 x 1600
const LOCATIONS = {
  home: {
    id: 'home',
    name: '家',
    description: '温馨的小窝',
    x: 150, y: 150, w: 200, h: 150,
    events: ['sleep', 'cook', 'study', 'watch_tv', 'rest']
  },
  company: {
    id: 'company',
    name: '公司',
    description: '打工的地方',
    x: 1000, y: 75, w: 275, h: 200,
    events: ['work_normal', 'work_overtime', 'meeting', 'slack_off', 'drink_water']
  },
  restaurant: {
    id: 'restaurant',
    name: '餐厅',
    description: '填饱肚子的地方',
    x: 125, y: 625, w: 225, h: 150,
    events: ['eat_fast', 'eat_good', 'eat_fancy', 'drink']
  },
  mall: {
    id: 'mall',
    name: '商场',
    description: '购物消费的地方',
    x: 850, y: 575, w: 325, h: 225,
    events: ['buy_clothes', 'buy_electronics', 'buy_furniture', 'buy_property', 'buy_car', 'window_shopping']
  },
  gym: {
    id: 'gym',
    name: '健身房',
    description: '锻炼身体的地方',
    x: 100, y: 1125, w: 250, h: 175,
    events: ['run', 'lift_weights', 'swim', 'yoga', 'get_membership']
  },
  hospital: {
    id: 'hospital',
    name: '医院',
    description: '恢复健康的地方',
    x: 900, y: 1100, w: 300, h: 200,
    events: ['see_doctor', 'buy_medicine', 'health_check', 'rest_hospital']
  },
  park: {
    id: 'park',
    name: '公园',
    description: '休闲放松的好地方',
    x: 500, y: 300, w: 400, h: 300,
    events: ['walk', 'jog', 'sit_bench', 'enjoy_scenery']
  },
  training_center: {
    id: 'training_center',
    name: '培训机构',
    description: '学习提升的地方',
    x: 1850, y: 100, w: 250, h: 150,
    events: ['study', 'take_exam', 'attend_lecture']
  },
  coffee_shop: {
    id: 'coffee_shop',
    name: '咖啡厅',
    description: '悠闲的下午茶时光',
    x: 1825, y: 600, w: 225, h: 150,
    events: ['drink_coffee', 'read_book', 'part_time_job', 'socialize']
  },
  property_center: {
    id: 'property_center',
    name: '房产中心',
    description: '买房租房的地方',
    x: 1800, y: 1125, w: 275, h: 175,
    events: ['view_house', 'buy_house', 'rent_house']
  },
  car_dealer: {
    id: 'car_dealer',
    name: '4S店',
    description: '买车的地方',
    x: 1325, y: 1350, w: 250, h: 150,
    events: ['view_car', 'buy_car', 'car_maintenance']
  }
};

// 道路网络（用于绘制道路）
const ROADS = [
  // 横向主干道
  { x1: 0, y1: 800, x2: 2400, y2: 800, w: 60 },
  // 纵向主干道
  { x1: 1200, y1: 0, x2: 1200, y2: 1600, w: 60 },
  // 家到公园
  { x1: 350, y1: 225, x2: 500, y2: 225, w: 40 },
  { x1: 350, y1: 225, x2: 350, y2: 800, w: 40 },
  // 公园到公司
  { x1: 900, y1: 225, x2: 1000, y2: 225, w: 40 },
  { x1: 900, y1: 225, x2: 900, y2: 800, w: 40 },
  // 公司到培训机构
  { x1: 1275, y1: 175, x2: 1850, y2: 175, w: 40 },
  // 培训机构到咖啡厅
  { x1: 1975, y1: 250, x2: 1975, y2: 600, w: 40 },
  // 咖啡厅到房产中心
  { x1: 1938, y1: 750, x2: 1938, y2: 1125, w: 40 },
  // 商场到医院
  { x1: 1175, y1: 800, x2: 1175, y2: 1100, w: 40 },
  { x1: 1175, y1: 1200, x2: 1325, y2: 1350, w: 40 },
  // 餐厅到商场
  { x1: 350, y1: 700, x2: 850, y2: 700, w: 40 },
  // 健身房到医院
  { x1: 350, y1: 1213, x2: 900, y2: 1213, w: 40 },
  // 医院到房产中心
  { x1: 1200, y1: 1213, x2: 1800, y2: 1213, w: 40 },
  // 公园到商场
  { x1: 700, y1: 600, x2: 850, y2: 600, w: 40 },
  // 商场到咖啡厅
  { x1: 1175, y1: 675, x2: 1825, y2: 675, w: 40 },
  // 左侧连接
  { x1: 225, y1: 300, x2: 225, y2: 625, w: 40 },
  { x1: 225, y1: 775, x2: 225, y2: 1125, w: 40 },
];

// 装饰物（树木、长椅等）
const DECORATIONS = [
  // 公园内的树
  { x: 525, y: 325, type: 'tree' },
  { x: 600, y: 375, type: 'tree' },
  { x: 675, y: 325, type: 'tree' },
  { x: 750, y: 400, type: 'tree' },
  { x: 800, y: 350, type: 'tree' },
  { x: 550, y: 450, type: 'tree' },
  { x: 650, y: 475, type: 'tree' },
  { x: 775, y: 450, type: 'tree' },
  // 公园长椅
  { x: 575, y: 425, type: 'bench' },
  { x: 725, y: 425, type: 'bench' },
  // 公园喷泉
  { x: 663, y: 388, type: 'fountain' },
  // 路边树
  { x: 50, y: 50, type: 'tree' },
  { x: 400, y: 50, type: 'tree' },
  { x: 800, y: 50, type: 'tree' },
  { x: 1500, y: 50, type: 'tree' },
  { x: 1700, y: 50, type: 'tree' },
  { x: 2125, y: 50, type: 'tree' },
  { x: 2300, y: 50, type: 'tree' },
  { x: 50, y: 500, type: 'tree' },
  { x: 450, y: 500, type: 'tree' },
  { x: 1550, y: 500, type: 'tree' },
  { x: 2125, y: 500, type: 'tree' },
  { x: 50, y: 1000, type: 'tree' },
  { x: 450, y: 1000, type: 'tree' },
  { x: 1550, y: 1000, type: 'tree' },
  { x: 2125, y: 1000, type: 'tree' },
  { x: 50, y: 1450, type: 'tree' },
  { x: 450, y: 1450, type: 'tree' },
  { x: 800, y: 1450, type: 'tree' },
  { x: 1550, y: 1450, type: 'tree' },
  { x: 2125, y: 1450, type: 'tree' },
  { x: 2300, y: 1450, type: 'tree' },
  // 更多路边树
  { x: 1125, y: 300, type: 'tree' },
  { x: 1275, y: 400, type: 'tree' },
  { x: 1625, y: 300, type: 'tree' },
  { x: 1750, y: 875, type: 'tree' },
  { x: 1375, y: 950, type: 'tree' },
  { x: 625, y: 950, type: 'tree' },
  { x: 375, y: 875, type: 'tree' },
];

// 水域
const WATERS = [
  { x: 1300, y: 325, w: 150, h: 100 },
  { x: 1500, y: 875, w: 125, h: 88 },
];
