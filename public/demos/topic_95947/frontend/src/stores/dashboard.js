import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const salesSummary = ref(null)
  const revenueTrend = ref([])
  const customerAnalysis = ref(null)
  const peakHours = ref([])

  async function fetchDashboard() {
    const result = await dashboardApi.getDashboard()
    salesSummary.value = result.sales_summary
    revenueTrend.value = result.revenue_trend
    customerAnalysis.value = result.customer_analysis
    peakHours.value = result.peak_hours
    return result
  }

  async function fetchSalesSummary() {
    const result = await dashboardApi.getSalesSummary()
    salesSummary.value = result
    return result
  }

  async function fetchRevenueTrend(days = 7) {
    const result = await dashboardApi.getRevenueTrend(days)
    revenueTrend.value = result
    return result
  }

  function reset() {
    salesSummary.value = null
    revenueTrend.value = []
    customerAnalysis.value = null
    peakHours.value = []
  }

  return {
    salesSummary,
    revenueTrend,
    customerAnalysis,
    peakHours,
    fetchDashboard,
    fetchSalesSummary,
    fetchRevenueTrend,
    reset
  }
})
