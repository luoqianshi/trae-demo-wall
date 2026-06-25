// 智行通 - 模拟数据
// 地铁线路颜色定义
export const LINE_COLORS = {
  '1': '#FF0000',
  '2': '#00AA00',
  '3': '#FFD700',
  '4': '#8A2BE2',
  '5': '#FF69B4',
  '6': '#FF8C00',
  '7': '#FF4500',
  '8': '#008080',
  '9': '#87CEEB',
  '10': '#C0C0C0',
  '11': '#800000',
  '12': '#006400',
  '13': '#DDA0DD',
  '14': '#A0522D',
  '15': '#9400D3',
  'S1': '#FF6347',
  'S2': '#4682B4',
}

// 模拟线路列表
export const metroLines = [
  { id: '1', name: '1号线', color: '#FF0000', stations: 30, status: 'normal' },
  { id: '2', name: '2号线', color: '#00AA00', stations: 28, status: 'normal' },
  { id: '3', name: '3号线', color: '#FFD700', stations: 25, status: 'normal' },
  { id: '4', name: '4号线', color: '#8A2BE2', stations: 32, status: 'normal' },
  { id: '5', name: '5号线', color: '#FF69B4', stations: 22, status: 'normal' },
  { id: '6', name: '6号线', color: '#FF8C00', stations: 26, status: 'normal' },
  { id: '7', name: '7号线', color: '#FF4500', stations: 24, status: 'normal' },
  { id: '8', name: '8号线', color: '#008080', stations: 20, status: 'delay' },
  { id: '9', name: '9号线', color: '#87CEEB', stations: 18, status: 'normal' },
  { id: '10', name: '10号线', color: '#C0C0C0', stations: 27, status: 'normal' },
]

// 模拟附近站点
export const nearbyStations = [
  {
    id: 's001',
    name: '人民广场',
    lines: ['1', '2', '8'],
    distance: 120,
    crowdedness: 4,
    entrances: ['A口', 'B口', 'C口', 'D口'],
  },
  {
    id: 's002',
    name: '南京东路',
    lines: ['2', '10'],
    distance: 380,
    crowdedness: 3,
    entrances: ['A口', 'B口', 'C口'],
  },
  {
    id: 's003',
    name: '静安寺',
    lines: ['2', '7'],
    distance: 650,
    crowdedness: 2,
    entrances: ['A口', 'B口', 'C口'],
  },
]

// 模拟实时到站数据
export function getArrivalData(stationId) {
  const now = new Date()
  const directions = ['上行', '下行']
  return directions.map((dir, idx) => ({
    direction: dir,
    terminal: idx === 0 ? '往富锦路' : '往莘庄',
    arrivals: [
      {
        id: 'a1',
        time: new Date(now.getTime() + 2 * 60000),
        countdown: 120,
        crowdedness: 4,
        carCrowdedness: [3, 4, 5, 4, 3, 2],
        hasAC: '强冷',
      },
      {
        id: 'a2',
        time: new Date(now.getTime() + 5 * 60000),
        countdown: 300,
        crowdedness: 3,
        carCrowdedness: [2, 3, 4, 3, 2, 2],
        hasAC: '弱冷',
      },
      {
        id: 'a3',
        time: new Date(now.getTime() + 8 * 60000),
        countdown: 480,
        crowdedness: 2,
        carCrowdedness: [1, 2, 2, 2, 1, 1],
        hasAC: '强冷',
      },
    ],
  }))
}

// 模拟拥挤度热力图数据
export function getCrowdednessData() {
  const stations = [
    { name: '莘庄', lng: 121.385, lat: 31.111, crowdedness: 4 },
    { name: '外环路', lng: 121.393, lat: 31.121, crowdedness: 3 },
    { name: '莲花路', lng: 121.401, lat: 31.131, crowdedness: 3 },
    { name: '锦江乐园', lng: 121.409, lat: 31.141, crowdedness: 2 },
    { name: '上海南站', lng: 121.417, lat: 31.151, crowdedness: 4 },
    { name: '漕宝路', lng: 121.425, lat: 31.161, crowdedness: 3 },
    { name: '上海体育馆', lng: 121.433, lat: 31.171, crowdedness: 4 },
    { name: '徐家汇', lng: 121.438, lat: 31.181, crowdedness: 5 },
    { name: '衡山路', lng: 121.443, lat: 31.191, crowdedness: 2 },
    { name: '常熟路', lng: 121.448, lat: 31.201, crowdedness: 3 },
    { name: '陕西南路', lng: 121.453, lat: 31.211, crowdedness: 4 },
    { name: '黄陂南路', lng: 121.458, lat: 31.221, crowdedness: 3 },
    { name: '人民广场', lng: 121.463, lat: 31.231, crowdedness: 5 },
    { name: '新闸路', lng: 121.468, lat: 31.241, crowdedness: 3 },
    { name: '汉中路', lng: 121.473, lat: 31.251, crowdedness: 4 },
    { name: '上海火车站', lng: 121.478, lat: 31.261, crowdedness: 5 },
    { name: '中山北路', lng: 121.483, lat: 31.271, crowdedness: 2 },
    { name: '延长路', lng: 121.488, lat: 31.281, crowdedness: 2 },
    { name: '上海马戏城', lng: 121.493, lat: 31.291, crowdedness: 1 },
    { name: '汶水路', lng: 121.498, lat: 31.301, crowdedness: 2 },
    { name: '彭浦新村', lng: 121.503, lat: 31.311, crowdedness: 3 },
    { name: '共康路', lng: 121.508, lat: 31.321, crowdedness: 2 },
    { name: '通河新村', lng: 121.513, lat: 31.331, crowdedness: 2 },
    { name: '呼兰路', lng: 121.518, lat: 31.341, crowdedness: 1 },
    { name: '共富新村', lng: 121.523, lat: 31.351, crowdedness: 1 },
    { name: '宝安公路', lng: 121.528, lat: 31.361, crowdedness: 1 },
    { name: '友谊西路', lng: 121.533, lat: 31.371, crowdedness: 1 },
    { name: '富锦路', lng: 121.538, lat: 31.381, crowdedness: 1 },
  ]
  return stations
}

// 模拟换乘方案
export function getTransferRoutes(from, to) {
  return [
    {
      id: 'r1',
      name: '方案一',
      duration: 25,
      transferCount: 1,
      steps: [
        { type: 'walk', desc: '步行至人民广场站·A口', duration: 3 },
        { type: 'metro', line: '1', lineName: '1号线', from: '人民广场', to: '徐家汇', stations: 5, duration: 12, crowdedness: 4 },
        { type: 'transfer', desc: '站内换乘 9号线', duration: 5, guide: '下车后直行50米，右转下楼梯，步行约200米至9号线站台' },
        { type: 'metro', line: '9', lineName: '9号线', from: '徐家汇', to: '漕河泾开发区', stations: 3, duration: 8, crowdedness: 2 },
        { type: 'walk', desc: '出站步行至目的地', duration: 3 },
      ],
    },
    {
      id: 'r2',
      name: '方案二',
      duration: 32,
      transferCount: 2,
      steps: [
        { type: 'walk', desc: '步行至人民广场站·B口', duration: 3 },
        { type: 'metro', line: '8', lineName: '8号线', from: '人民广场', to: '东方体育中心', stations: 8, duration: 16, crowdedness: 3 },
        { type: 'transfer', desc: '站内换乘 11号线', duration: 3, guide: '同站台换乘，步行约30米即可' },
        { type: 'metro', line: '11', lineName: '11号线', from: '东方体育中心', to: '龙耀路', stations: 2, duration: 5, crowdedness: 2 },
        { type: 'transfer', desc: '站内换乘 12号线', duration: 4, guide: '沿指示牌步行约150米至12号线站台' },
        { type: 'metro', line: '12', lineName: '12号线', from: '龙耀路', to: '漕河泾开发区', stations: 2, duration: 5, crowdedness: 1 },
        { type: 'walk', desc: '出站步行至目的地', duration: 3 },
      ],
    },
    {
      id: 'r3',
      name: '方案三',
      duration: 35,
      transferCount: 0,
      steps: [
        { type: 'walk', desc: '步行至人民广场站·C口', duration: 3 },
        { type: 'metro', line: '1', lineName: '1号线', from: '人民广场', to: '上海体育馆', stations: 6, duration: 14, crowdedness: 4 },
        { type: 'transfer', desc: '站内换乘 4号线', duration: 6, guide: '下楼梯后左转，沿通道步行约250米至4号线站台' },
        { type: 'metro', line: '4', lineName: '4号线', from: '上海体育馆', to: '宜山路', stations: 1, duration: 3, crowdedness: 3 },
        { type: 'walk', desc: '出站步行至目的地', duration: 5 },
      ],
    },
  ]
}

// 模拟用户通勤习惯
export const userCommute = {
  home: '莘庄',
  work: '漕河泾开发区',
  preferredLine: '1',
  preferredTime: '08:15',
  morningPeak: true,
}

// 模拟站点客流趋势
export function getStationFlow(stationId) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return {
    today: hours.map((h) => ({
      hour: h,
      flow: h < 6 ? 50 : h < 9 ? 200 + Math.random() * 400 : h < 17 ? 100 + Math.random() * 200 : h < 20 ? 200 + Math.random() * 300 : 50 + Math.random() * 100,
    })),
    yesterday: hours.map((h) => ({
      hour: h,
      flow: h < 6 ? 40 : h < 9 ? 180 + Math.random() * 380 : h < 17 ? 90 + Math.random() * 180 : h < 20 ? 180 + Math.random() * 280 : 40 + Math.random() * 90,
    })),
  }
}

// 拥挤度等级映射
export const CROWD_LEVELS = {
  1: { label: '空闲', color: '#2ED573', icon: '😊' },
  2: { label: '较空闲', color: '#7BED9F', icon: '🙂' },
  3: { label: '适中', color: '#FFA502', icon: '😐' },
  4: { label: '较拥挤', color: '#FF8C42', icon: '😟' },
  5: { label: '拥挤', color: '#FF4757', icon: '😫' },
}