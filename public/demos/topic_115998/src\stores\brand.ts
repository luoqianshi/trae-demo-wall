import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categories, alerts, features, redListBrands, blackListBrands, defaultScanResult, type Category, type Alert, type Feature, type Brand, type ScanResult } from '@/data/mockData'

export const useBrandStore = defineStore('brand', () => {
  const categoryList = ref<Category[]>(categories)
  const alertList = ref<Alert[]>(alerts)
  const featureList = ref<Feature[]>(features)
  const redBrands = ref<Brand[]>(redListBrands)
  const blackBrands = ref<Brand[]>(blackListBrands)
  const currentCategory = ref<string>('全部')
  const currentListType = ref<'red' | 'black'>('red')

  const filteredBrands = computed(() => {
    let brands = currentListType.value === 'red' ? redBrands.value : blackBrands.value
    if (currentCategory.value !== '全部') {
      brands = brands.filter(b => b.category === currentCategory.value)
    }
    return brands
  })

  function getCategories() {
    return categoryList.value
  }

  function getAlerts() {
    return alertList.value
  }

  function getFeatures() {
    return featureList.value
  }

  function getBrands(category?: string, type?: 'red' | 'black') {
    let brands = type === 'black' ? blackBrands.value : redBrands.value
    if (category && category !== '全部') {
      brands = brands.filter(b => b.category === category)
    }
    return brands
  }

  function getBrandDetail(brandId: string): ScanResult | null {
    const brand = [...redBrands.value, ...blackBrands.value].find(b => b.id === brandId)
    if (!brand) return null
    
    const statusText = brand.status === 'red' ? '红榜推荐' : brand.status === 'black' ? '黑榜警告' : '预警关注'
    const commentText = brand.status === 'red' ? '品牌信誉优秀' : brand.status === 'black' ? '品牌存在风险' : '品牌需持续关注'
    
    const baseScore = brand.trustScore
    const offset = brand.status === 'red' ? 0 : -5

    return {
      barcode: '6901234567890',
      brandName: brand.name,
      productName: `${brand.name}产品`,
      category: brand.subCategory || brand.category,
      trustScore: brand.trustScore,
      status: statusText,
      comment: commentText,
      ratingDetails: [
        { label: '质量安全', value: Math.max(0, Math.min(100, baseScore + 3 + offset)) },
        { label: '新闻舆情', value: Math.max(0, Math.min(100, baseScore - 2 + offset)) },
        { label: '合规记录', value: Math.max(0, Math.min(100, baseScore - 4 + offset)) },
        { label: '用户评价', value: Math.max(0, Math.min(100, baseScore + 0 + offset)) }
      ],
      timeline: [
        { text: brand.reason, date: '最近', type: 'new' },
        { text: '历史质量检查记录', date: '2024.01', type: brand.status === 'red' ? 'new' : 'old' },
        { text: '企业资质认证', date: '2023.09', type: 'old' }
      ]
    }
  }

  function getScanResult(barcode?: string): ScanResult {
    return defaultScanResult
  }

  function setCategory(category: string) {
    currentCategory.value = category
  }

  function setListType(type: 'red' | 'black') {
    currentListType.value = type
  }

  return {
    categoryList,
    alertList,
    featureList,
    redBrands,
    blackBrands,
    currentCategory,
    currentListType,
    filteredBrands,
    getCategories,
    getAlerts,
    getFeatures,
    getBrands,
    getBrandDetail,
    getScanResult,
    setCategory,
    setListType
  }
})
