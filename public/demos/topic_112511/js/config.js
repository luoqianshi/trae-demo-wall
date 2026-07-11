// 游戏全局配置
const GAME_CONFIG = {
  // 视口分辨率（显示窗口大小）
  viewportWidth: 960,
  viewportHeight: 540,

  // 大地图尺寸
  mapWidth: 2400,
  mapHeight: 1600,

  // 时间配置
  timeSpeed: 1,
  minutesPerRealSecond: 10,

  // 玩家初始状态
  initialState: {
    name: '打工人',
    health: 100,
    energy: 100,
    ability: 50,
    gold: 3000,
    currentLocation: 'home',
    day: 1,
    hour: 8,
    minute: 0
  },

  // 状态上限
  maxState: {
    health: 100,
    energy: 100,
    ability: 999
  },

  // 移动速度（像素/帧）
  playerSpeed: 3.0,

  // 动画
  animFrameDuration: 8,

  // 像素颜色
  colors: {
    skin: '#f5d0a9',
    skinShadow: '#e0b888',
    hair: '#4a3728',
    shirt: '#3498db',
    shirtLight: '#5dade2',
    pants: '#2c3e50',
    pantsLight: '#34495e',
    shoes: '#1a1a1a',
    eye: '#1a1a1a',
    mouth: '#c0392b',
    blush: '#e8a0a0'
  },

  // 地图颜色
  mapColors: {
    grass: '#3a7d3a',
    grassLight: '#4a9d4a',
    grassDark: '#2a5d2a',
    road: '#7a7a7a',
    roadLight: '#8a8a8a',
    roadMarking: '#bbbbbb',
    sidewalk: '#9a9a9a',
    water: '#3a6a9a',
    tree: '#2d6b2d',
    treeTrunk: '#5a3a1a',
    fence: '#8a7a5a'
  },

  // 地点颜色
  locationColors: {
    home: { primary: '#c4956a', roof: '#a07050', door: '#6b4226' },
    company: { primary: '#7a9aaa', roof: '#5a7a8a', door: '#4a6a7a' },
    restaurant: { primary: '#d4a050', roof: '#b48040', door: '#8a6020' },
    mall: { primary: '#8a9aaa', roof: '#6a7a8a', door: '#5a6a7a' },
    property_center: { primary: '#c4a070', roof: '#a08050', door: '#7a6030' },
    car_dealer: { primary: '#6a9aaa', roof: '#4a7a8a', door: '#3a6a7a' },
    hospital: { primary: '#e8e8e8', roof: '#d0d0d0', door: '#a0a0a0' },
    gym: { primary: '#a05050', roof: '#803030', door: '#602020' },
    training_center: { primary: '#7a8aaa', roof: '#5a6a8a', door: '#4a5a7a' },
    park: { primary: '#4a9a4a', roof: '#3a7a3a', door: '#2a5a2a' },
    coffee_shop: { primary: '#8a6a4a', roof: '#6a4a2a', door: '#5a3a1a' }
  },

  // 时间段
  timeSlots: [
    { id: 'midnight', name: '深夜', startHour: 0, endHour: 6, sky: '#0a0a2e' },
    { id: 'early_morning', name: '清晨', startHour: 6, endHour: 8, sky: '#1a1a4e' },
    { id: 'morning', name: '上午', startHour: 8, endHour: 12, sky: '#4a90d9' },
    { id: 'noon', name: '中午', startHour: 12, endHour: 14, sky: '#87ceeb' },
    { id: 'afternoon', name: '下午', startHour: 14, endHour: 18, sky: '#5dade2' },
    { id: 'evening', name: '傍晚', startHour: 18, endHour: 20, sky: '#d35400' },
    { id: 'night', name: '夜晚', startHour: 20, endHour: 24, sky: '#1a1a4e' }
  ]
};
