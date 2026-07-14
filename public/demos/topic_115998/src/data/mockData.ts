export interface Category {
  id: string
  name: string
  icon: string
  count: number
  color: string
}

export interface Brand {
  id: string
  name: string
  category: string
  trustScore: number
  status: 'red' | 'black' | 'warning'
  reason: string
  subCategory?: string
}

export interface Alert {
  id: string
  brandName: string
  type: 'red-list' | 'black-list' | 'warning'
  reason: string
  time: string
}

export interface Feature {
  id: string
  title: string
  description: string
  image?: string
  bgColor?: string
}

export interface ScanResult {
  barcode: string
  brandName: string
  productName: string
  category: string
  trustScore: number
  status: string
  comment: string
  ratingDetails: {
    label: string
    value: number
  }[]
  timeline: {
    text: string
    date: string
    type: 'new' | 'old'
  }[]
}

export const categories: Category[] = [
  { id: 'food', name: '食品', icon: 'utensils', count: 1286, color: 'green' },
  { id: 'medicine', name: '药品', icon: 'pill', count: 856, color: 'blue' },
  { id: 'cosmetic', name: '化妆品', icon: 'sparkles', count: 2104, color: 'purple' },
  { id: 'baby', name: '母婴用品', icon: 'baby', count: 743, color: 'amber' }
]

export const alerts: Alert[] = [
  {
    id: '1',
    brandName: 'XX乳业',
    type: 'black-list',
    reason: '产品检出违禁添加剂，已被市场监管部门立案调查',
    time: '2小时前'
  },
  {
    id: '2',
    brandName: 'YY制药',
    type: 'red-list',
    reason: '连续三年获评质量信得过企业，用户满意度行业领先',
    time: '5小时前'
  },
  {
    id: '3',
    brandName: 'ZZ美妆',
    type: 'warning',
    reason: '多批次产品重金属含量接近安全限值，需持续关注',
    time: '昨天'
  }
]

export const features: Feature[] = [
  {
    id: '1',
    title: '全网新闻监控',
    description: '实时抓取各大媒体与社交平台品牌资讯',
    image: '/static/images/image_0.jpg'
  },
  {
    id: '2',
    title: 'AI智能分析',
    description: '深度学习模型自动识别品牌风险与舆情趋势',
    bgColor: 'purple'
  },
  {
    id: '3',
    title: '315数据同步',
    description: '对接消协与315投诉平台，数据实时同步更新',
    bgColor: 'amber'
  }
]

export const redListBrands: Brand[] = [
  { id: '1', name: '蒙牛', category: '食品', subCategory: '乳制品', trustScore: 92, status: 'red', reason: '连续5年无质量通报' },
  { id: '2', name: '云南白药', category: '药品', subCategory: '药品', trustScore: 95, status: 'red', reason: '国家级质量标杆企业' },
  { id: '3', name: '欧莱雅', category: '化妆品', subCategory: '化妆品', trustScore: 88, status: 'red', reason: '全球合规体系认证' },
  { id: '4', name: '伊利', category: '食品', subCategory: '乳制品', trustScore: 90, status: 'red', reason: '行业领先品质管理' },
  { id: '5', name: '强生', category: '母婴', subCategory: '母婴用品', trustScore: 89, status: 'red', reason: '国际安全标准认证' },
  { id: '6', name: '华为', category: '家电', subCategory: '电子产品', trustScore: 94, status: 'red', reason: '品质卓越服务优质' }
]

export const blackListBrands: Brand[] = [
  { id: '101', name: '某某食品', category: '食品', subCategory: '食品', trustScore: 23, status: 'black', reason: '2024年315晚会曝光违规添加' },
  { id: '102', name: '某某药业', category: '药品', subCategory: '药品', trustScore: 31, status: 'black', reason: '多次抽检不合格被通报' },
  { id: '103', name: '某某美妆', category: '化妆品', subCategory: '化妆品', trustScore: 18, status: 'black', reason: '检出禁用成分已被下架' },
  { id: '104', name: '某某奶粉', category: '母婴', subCategory: '奶粉', trustScore: 27, status: 'black', reason: '菌落总数超标被召回' },
  { id: '105', name: '某某电器', category: '家电', subCategory: '家电', trustScore: 35, status: 'black', reason: '安全隐患被责令停产' }
]

export const defaultScanResult: ScanResult = {
  barcode: '6901234567890',
  brandName: '蒙牛乳业',
  productName: '特仑苏有机纯牛奶 250ml',
  category: '乳制品',
  trustScore: 92,
  status: '红榜推荐',
  comment: '品牌信誉优秀',
  ratingDetails: [
    { label: '质量安全', value: 95 },
    { label: '新闻舆情', value: 90 },
    { label: '合规记录', value: 88 },
    { label: '用户评价', value: 92 }
  ],
  timeline: [
    { text: '2024年国家抽检全部合格', date: '2024.03', type: 'new' },
    { text: '入选消费者信赖品牌TOP10', date: '2024.01', type: 'new' },
    { text: '通过ISO9001质量体系认证', date: '2023.09', type: 'old' }
  ]
}

export const categoryLabels = ['全部', '食品', '药品', '化妆品', '母婴', '家电']
