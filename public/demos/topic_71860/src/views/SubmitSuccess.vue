<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const contractStore = useContractStore()

const showSuccess = ref(true)
const showReview = ref(false)

onMounted(() => {
  setTimeout(() => {
    showSuccess.value = false
    showReview.value = true
  }, 2000)
})

function goToContracts() {
  router.push('/home')
}

function goToContractDetail() {
  if (contractStore.currentContract) {
    router.push(`/contract-detail/${contractStore.currentContract.id}`)
  }
}
</script>

<template>
  <div class="submit-success-page">
    <div v-if="showSuccess" class="success-section">
      <div class="success-icon">✓</div>
      <h2>提交成功</h2>
      <p>您的签约申请已提交</p>
    </div>

    <div v-else-if="showReview" class="review-section">
      <div class="review-icon">⏳</div>
      <h2>正在进行人工审核</h2>
      <p>工作人员正在审核您的签约申请</p>
      <p class="sub-tip">审核结果将通过消息通知您</p>

      <div class="action-btns">
        <button class="btn-primary" @click="goToContracts">
          返回首页
        </button>
        <button class="btn-secondary" @click="goToContractDetail">
          查看合同
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.submit-success-page
  min-height 100vh
  background $bg-page
  display flex
  align-items center
  justify-content center

.success-section
.review-section
  text-align center
  padding 40px 20px

.success-icon
  width 80px
  height 80px
  background linear-gradient(135deg, $success 0%, #389e0d 100%)
  border-radius 50%
  display flex
  align-items center
  justify-content center
  margin 0 auto 24px
  font-size 40px
  color $bg-white
  animation scaleIn 0.5s ease

.review-icon
  width 80px
  height 80px
  background linear-gradient(135deg, $warning 0%, #d48806 100%)
  border-radius 50%
  display flex
  align-items center
  justify-content center
  margin 0 auto 24px
  font-size 40px
  animation pulse 2s infinite

@keyframes scaleIn
  0%
    transform scale(0)
    opacity 0
  50%
    transform scale(1.1)
  100%
    transform scale(1)
    opacity 1

@keyframes pulse
  0%, 100%
    transform scale(1)
  50%
    transform scale(1.05)

h2
  font-size 20px
  color $text-primary
  margin-bottom 12px

p
  font-size 14px
  color $text-secondary
  margin-bottom 8px

.sub-tip
  font-size 13px
  color $text-muted
  margin-top 16px

.action-btns
  margin-top 40px
  display flex
  flex-direction column
  gap 12px
  padding 0 40px

.btn-secondary
  width 100%
  height 44px
  background $bg-white
  border 1px solid $border-dashed
  border-radius $radius-xl
  font-size 16px
  color $text-secondary
  cursor pointer
  transition all 0.3s

  &:active
    background $bg-page
</style>
