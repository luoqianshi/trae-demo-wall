import { PredictResult, TimeRangeKey } from '@/types';

export const predictData: Record<TimeRangeKey, PredictResult> = {
  '1-3': {
    timeRange: '1-3小时',
    possibleLocations: ['家门口附近', '楼道里', '同楼层邻居家', '楼梯间'],
    tips: [
      '先在家门口仔细寻找，猫咪可能就在附近躲着',
      '轻声呼唤猫咪的名字，它可能因为害怕不敢出来',
      '检查楼道、楼梯间、电梯口等地方',
      '问问同楼层的邻居有没有看到'
    ],
    confidence: 85
  },
  '3-6': {
    timeRange: '3-6小时',
    possibleLocations: ['楼下绿化带', '小区花园', '停车场', '附近垃圾桶旁'],
    tips: [
      '扩大搜索范围到楼下和小区花园',
      '猫咪可能去寻找食物，检查垃圾桶附近',
      '在停车场的车底和角落寻找',
      '带上猫咪喜欢的零食和玩具'
    ],
    confidence: 75
  },
  '6-12': {
    timeRange: '6-12小时',
    possibleLocations: ['小区内各个角落', '邻居家院子', '小区围墙附近', '地下车库'],
    tips: [
      '在小区内进行地毯式搜索',
      '询问小区保安和保洁人员',
      '在猫咪走失地点附近放置食物和水',
      '打印寻猫启事贴在小区公告栏'
    ],
    confidence: 65
  },
  '12-24': {
    timeRange: '12-24小时',
    possibleLocations: ['周边小区', '附近公园', '建筑工地', '废弃房屋'],
    tips: [
      '扩大搜索范围到周边500米',
      '深夜和清晨是猫咪最活跃的时间，重点搜索',
      '在社交媒体上发布寻猫信息',
      '联系附近的宠物医院和救助站'
    ],
    confidence: 55
  },
  '24-48': {
    timeRange: '24-48小时',
    possibleLocations: ['更远的街区', '菜市场附近', '学校校园', '河边公园'],
    tips: [
      '继续扩大搜索范围到1公里内',
      '在各个平台发布寻猫启事，附带清晰照片',
      '寻求当地宠物救助组织的帮助',
      '不要放弃，很多猫咪在几天后被找到'
    ],
    confidence: 45
  },
  '48-72': {
    timeRange: '48-72小时',
    possibleLocations: ['被好心人收养', '附近商铺', '小区地下室', '废弃工地'],
    tips: [
      '72小时是黄金搜寻期，不要放弃希望',
      '在附近的商铺、餐厅询问',
      '检查小区地下室、设备间等隐蔽场所',
      '在走失地点附近放置带有猫咪气味的物品'
    ],
    confidence: 35
  },
  'over72': {
    timeRange: '超过72小时',
    possibleLocations: ['被好心人收留', '更远的区域', '流浪猫群中', '新的领地'],
    tips: [
      '不要放弃，很多猫咪在几周甚至几个月后被找回',
      '持续在社交媒体更新寻猫信息',
      '联系更多的宠物救助组织和动物医院',
      '在家门口放置食物和猫砂盆，引导猫咪回家'
    ],
    confidence: 25
  }
};

export const timeRangeOptions: { key: TimeRangeKey; label: string }[] = [
  { key: '1-3', label: '1-3小时' },
  { key: '3-6', label: '3-6小时' },
  { key: '6-12', label: '6-12小时' },
  { key: '12-24', label: '12-24小时' },
  { key: '24-48', label: '24-48小时' },
  { key: '48-72', label: '48-72小时' },
  { key: 'over72', label: '超过72小时' },
];
