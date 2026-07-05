<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const contractStore = useContractStore()
const activeTab = ref<'sign' | 'contracts'>('sign')

function goToContractTerms() {
  router.push('/contract-terms')
}

function goToContractDetail(contract: any) {
  contractStore.setCurrentContract(contract)
  router.push(`/contract-detail/${contract.id}`)
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '审核中',
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
</script>

<template>
  <div class="home-page">
    <div class="page-header">
      <h1>电子签约平台</h1>
    </div>

    <div class="content-area">
      <div v-if="activeTab === 'sign'" class="tab-content">
        <div class="sign-card" @click="goToContractTerms">
          <div class="sign-icon">📝</div>
          <div class="sign-info">
            <h3>电子服务合同</h3>
            <p>点击阅读并签署合同</p>
          </div>
          <div class="sign-arrow">›</div>
        </div>
      </div>

      <div v-else class="tab-content">
        <div v-if="contractStore.contracts.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <p>暂无合同记录</p>
        </div>
        <div
          v-for="contract in contractStore.contracts"
          :key="contract.id"
          class="contract-item"
          @click="goToContractDetail(contract)"
        >
          <div class="contract-header">
            <span class="contract-title">{{ contract.title }}</span>
            <span
              class="contract-status"
              :style="{ color: getStatusColor(contract.status) }"
            >
              {{ getStatusText(contract.status) }}
            </span>
          </div>
          <div class="contract-time">申请时间：{{ contract.createTime }}</div>
          <div v-if="contract.signTime" class="contract-time">
            签约时间：{{ contract.signTime }}
          </div>
        </div>
      </div>
    </div>

    <div class="tab-bar safe-bottom">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'sign' }"
        @click="activeTab = 'sign'"
      >
        <div class="tab-icon">📝</div>
        <div class="tab-label">电子签约</div>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'contracts' }"
        @click="activeTab = 'contracts'"
      >
        <div class="tab-icon">📄</div>
        <div class="tab-label">我的合同</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.home-page
  min-height 100vh
  background-color $bg-page
  display flex
  flex-direction column

.page-header
  background $bg-white
  padding 16px
  text-align center
  border-bottom 1px solid $border-color

  h1
    font-size 18px
    font-weight 600
    color $text-primary

.content-area
  flex 1
  overflow-y auto
  padding-bottom 80px

.tab-content
  padding 12px

.sign-card
  display flex
  align-items center
  background $bg-white
  border-radius $radius-lg
  padding 20px
  margin-bottom 12px
  box-shadow $shadow-card
  cursor pointer
  transition all 0.3s

  &:active
    transform scale(0.98)

.sign-icon
  font-size 36px
  margin-right 16px

.sign-info
  flex 1

  h3
    font-size 16px
    color $text-primary
    margin-bottom 6px

  p
    font-size 13px
    color $text-muted

.sign-arrow
  font-size 24px
  color #ccc

.contract-item
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card
  cursor pointer

.contract-header
  display flex
  align-items center
  justify-content space-between
  margin-bottom 8px

.contract-title
  font-size 15px
  font-weight 500
  color $text-primary

.contract-status
  font-size 13px
  font-weight 500

.contract-time
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

.tab-bar
  position fixed
  bottom 0
  left 0
  right 0
  display flex
  background $bg-white
  border-top 1px solid $border-color
  z-index 100
  box-shadow 0 -2px 8px rgba(0, 0, 0, 0.04)

  .tab-item
    flex 1
    display flex
    align-items center
    justify-content center
    flex-direction column
    padding 8px 0
    cursor pointer
    transition all 0.3s

  .tab-icon
    font-size 22px
    margin-bottom 2px
    transition all 0.3s

  .tab-label
    font-size 11px
    color $text-muted
    transition all 0.3s

  .tab-item.active
    .tab-label
      color $primary
      font-weight 600
</style>
