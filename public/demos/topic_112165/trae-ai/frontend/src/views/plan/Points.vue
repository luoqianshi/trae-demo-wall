<template>
  <div class="points-page">
    <div class="page-header">
      <h2>💰 积分中心</h2>
    </div>

    <!-- 积分余额 -->
    <el-card class="balance-card" v-loading="loading">
      <div class="balance-display">
        <span class="balance-label">我的积分</span>
        <span class="balance-value">{{ balance }}</span>
      </div>
    </el-card>

    <!-- 排行榜 + 兑换商城 -->
    <el-row :gutter="20">
      <!-- 排行榜 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>🏆 积分排行</span>
              <el-radio-group v-model="rankingPeriod" size="small" @change="loadRanking">
                <el-radio-button label="WEEK">本周</el-radio-button>
                <el-radio-button label="MONTH">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-table :data="ranking" size="small">
            <el-table-column type="index" label="排名" width="70" />
            <el-table-column prop="name" label="用户" />
            <el-table-column prop="totalPoints" label="积分" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 兑换商城 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>🎁 积分兑换</span>
          </template>
          <div class="exchange-grid">
            <div v-for="item in exchangeItems" :key="item.id" class="exchange-item">
              <div class="item-name">{{ item.itemName }}</div>
              <div class="item-desc">{{ item.description }}</div>
              <div class="item-cost">{{ item.pointsCost }} 积分</div>
              <div class="item-stock">库存: {{ item.stock }}</div>
              <el-button
                type="primary"
                size="small"
                :disabled="balance < item.pointsCost || item.stock <= 0"
                @click="handleExchange(item)"
              >
                兑换
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBalance, getRanking, getExchangeItems, exchangeItem, type ExchangeItem } from '@/api/plan'
import logger from '@/utils/logger'

const loading = ref(false)
const balance = ref(0)
const ranking = ref<import('@/api/plan').RankingItem[]>([])
const exchangeItems = ref<ExchangeItem[]>([])
const rankingPeriod = ref<'WEEK' | 'MONTH'>('WEEK')

const loadBalance = async () => {
  try {
    const data = await getBalance()
    balance.value = data.balance
  } catch (e) {
    logger.error('获取积分余额失败', e)
  }
}

const loadRanking = async () => {
  try {
    ranking.value = await getRanking(rankingPeriod.value)
  } catch (e) {
    logger.error('获取排行榜失败', e)
  }
}

const loadExchangeItems = async () => {
  try {
    exchangeItems.value = await getExchangeItems()
  } catch (e) {
    logger.error('获取兑换商品失败', e)
  }
}

const handleExchange = async (item: ExchangeItem) => {
  try {
    await ElMessageBox.confirm(`确认使用 ${item.pointsCost} 积分兑换「${item.itemName}」？`, '兑换确认', {
      type: 'warning'
    })
    await exchangeItem(item.id)
    ElMessage.success('兑换成功')
    await loadBalance()
    await loadExchangeItems()
  } catch (e) {
    if (e !== 'cancel') {
      logger.error('兑换失败', e)
    }
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadBalance(), loadRanking(), loadExchangeItems()])
  loading.value = false
})
</script>

<style scoped>
.points-page { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { margin: 0; color: #333; }
.balance-card { margin-bottom: 20px; text-align: center; }
.balance-display { padding: 20px; }
.balance-label { display: block; color: #666; margin-bottom: 10px; }
.balance-value { font-size: 3em; font-weight: bold; color: #f5576c; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.exchange-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.exchange-item { border: 1px solid #eee; border-radius: 8px; padding: 15px; text-align: center; }
.item-name { font-weight: bold; margin-bottom: 8px; }
.item-desc { font-size: 0.85em; color: #888; margin-bottom: 8px; }
.item-cost { color: #f5576c; font-weight: bold; margin-bottom: 5px; }
.item-stock { font-size: 0.85em; color: #999; margin-bottom: 10px; }
</style>
