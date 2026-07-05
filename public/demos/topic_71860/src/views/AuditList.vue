<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const contractStore = useContractStore()
const activeFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')

const filteredContracts = computed(() => {
  if (activeFilter.value === 'all') {
    return contractStore.contracts
  }
  return contractStore.contracts.filter(c => c.status === activeFilter.value)
})

function goToAuditDetail(contract: any) {
  contractStore.setCurrentContract(contract)
  router.push(`/audit-detail/${contract.id}`)
}

function goBack() {
  router.push('/')
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  }
  return map[status] || status
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: '#faad14',
    approved: '#52c41a',
    rejected: '#f5222d',
  }
  return map[status] || '#999'
}

function getStatusBgColor(status: string) {
  const map: Record<string, string> = {
    pending: '#fffbe6',
    approved: '#f6ffed',
    rejected: '#fff2f0',
  }
  return map[status] || '#f5f5f5'
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
] as const
</script>

<template>
  <div class="audit-list-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">‹</div>
      <h1>审核列表</h1>
      <div class="placeholder"></div>
    </div>

    <div class="filter-tabs">
      <div
        v-for="tab in filterTabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: activeFilter === tab.key }"
        @click="activeFilter = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="content-area">
      <div v-if="filteredContracts.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无{{ activeFilter === 'all' ? '' : getStatusText(activeFilter) }}记录</p>
      </div>

      <div
        v-for="contract in filteredContracts"
        :key="contract.id"
        class="audit-item"
        @click="goToAuditDetail(contract)"
      >
        <div class="audit-header">
          <span class="audit-title">{{ contract.title }}</span>
          <span
            class="audit-status"
            :style="{ color: getStatusColor(contract.status), backgroundColor: getStatusBgColor(contract.status) }"
          >
            {{ getStatusText(contract.status) }}
          </span>
        </div>
        <div class="audit-info">
          <span class="audit-name" v-if="contract.idCardInfo">申请人：{{ contract.idCardInfo.name }}</span>
          <span class="audit-id" v-if="contract.idCardInfo">{{ contract.idCardInfo.idNumber }}</span>
        </div>
        <div class="audit-time">申请时间：{{ contract.createTime }}</div>
        <div v-if="contract.signTime" class="audit-time">
          签约时间：{{ contract.signTime }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.audit-list-page
  min-height 100vh
  background $bg-page

.nav-header
  display flex
  align-items center
  justify-content space-between
  padding 12px 16px
  background $bg-white
  border-bottom 1px solid $border-color
  position sticky
  top 0
  z-index 100

.back-btn
  font-size 28px
  color $text-primary
  cursor pointer
  width 40px

.nav-header h1
  font-size 17px
  font-weight 600
  color $text-primary

.placeholder
  width 40px

.filter-tabs
  display flex
  background $bg-white
  padding 12px 16px
  gap 8px
  border-bottom 1px solid $border-color
  overflow-x auto

.filter-tab
  padding 6px 16px
  border-radius 16px
  font-size 13px
  color $text-secondary
  background $bg-page
  cursor pointer
  transition all 0.3s
  white-space nowrap

  &.active
    background $primary
    color $bg-white
    font-weight 500

.content-area
  padding 12px
  padding-bottom 40px

.audit-item
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card
  cursor pointer

.audit-header
  display flex
  align-items center
  justify-content space-between
  margin-bottom 10px

.audit-title
  font-size 15px
  font-weight 500
  color $text-primary

.audit-status
  font-size 12px
  font-weight 500
  padding 3px 10px
  border-radius 10px

.audit-info
  display flex
  flex-direction column
  gap 4px
  margin-bottom 8px

.audit-name
  font-size 14px
  color $text-primary
  font-weight 500

.audit-id
  font-size 12px
  color $text-muted
  font-family monospace

.audit-time
  font-size 12px
  color $text-muted
  margin-top 4px

.empty-state
  text-align center
  padding 80px 20px

.empty-icon
  font-size 64px
  margin-bottom 16px

.empty-state p
  font-size 14px
  color $text-muted
</style>
