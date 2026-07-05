<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToApplicant() {
  router.push('/home')
}

function goToAuditor() {
  router.push('/audit-list')
}
</script>

<template>
  <div class="role-select-page">
    <div class="role-header">
      <h1>电子签约平台</h1>
      <p>请选择您的角色</p>
    </div>

    <div class="role-cards">
      <div class="role-card applicant" @click="goToApplicant">
        <div class="role-icon">👤</div>
        <h2>申请人员</h2>
        <p>发起合同签约申请</p>
        <div class="role-arrow">›</div>
      </div>

      <div class="role-card auditor" @click="goToAuditor">
        <div class="role-icon">🔍</div>
        <h2>审核人员</h2>
        <p>审核合同签约申请</p>
        <div class="role-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.role-select-page
  min-height 100vh
  background linear-gradient(135deg, #1677ff 0%, #0958d9 100%)
  display flex
  flex-direction column
  align-items center
  justify-content center
  padding 20px

.role-header
  text-align center
  margin-bottom 40px

  h1
    font-size 28px
    font-weight 700
    color #fff
    margin-bottom 8px

  p
    font-size 16px
    color rgba(255, 255, 255, 0.8)

.role-cards
  width 100%
  max-width 360px

.role-card
  background #fff
  border-radius $radius-lg
  padding 24px
  margin-bottom 16px
  display flex
  align-items center
  cursor pointer
  transition all 0.3s
  box-shadow 0 4px 16px rgba(0, 0, 0, 0.15)

  &:active
    transform scale(0.98)

  .role-icon
    font-size 40px
    margin-right 16px

  h2
    font-size 18px
    color $text-primary
    margin-bottom 4px

  p
    font-size 13px
    color $text-muted

  .role-arrow
    margin-left auto
    font-size 24px
    color #ccc
</style>
