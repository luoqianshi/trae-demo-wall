<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContractStore } from '../stores/contract'
import { generateContractPDF } from '../utils/pdfGenerator'

const router = useRouter()
const route = useRoute()
const contractStore = useContractStore()

const contract = computed(() => {
  const id = route.params.id as string
  return contractStore.contracts.find(c => c.id === id) || null
})

const contractContent = ref(`电子服务合同

甲方（服务提供方）：科技有限公司
乙方（服务接受方）：用户

鉴于甲方是一家依法设立并有效存续的科技公司，拥有提供相关服务的资质和能力；乙方有接受相关服务的需求，双方本着平等互利、诚实信用的原则，经友好协商，就乙方向甲方购买服务事宜达成如下协议：

第一条 服务内容
1.1 甲方同意向乙方提供以下服务：技术咨询、软件开发、系统维护等相关技术服务。
1.2 服务的具体内容、标准、要求等详见附件《服务说明书》。

第二条 服务期限
2.1 本合同服务期限自合同生效之日起计算，为期一年。
2.2 服务期满前三十日，双方可协商续签事宜。

第三条 服务费用
3.1 乙方应向甲方支付的服务费用为人民币壹万元整。
3.2 付款方式：乙方应在合同签订后五个工作日内支付全部服务费用。

第四条 甲方权利与义务
4.1 甲方应按照本合同约定向乙方提供服务。
4.2 甲方应保证所提供服务的质量符合行业标准。
4.3 甲方应对乙方的商业秘密负有保密义务。

第五条 乙方权利与义务
5.1 乙方有权要求甲方按照合同约定提供服务。
5.2 乙方应按时支付服务费用。
5.3 乙方应配合甲方完成服务所需的相关工作。

第六条 保密条款
6.1 双方应对在履行本合同过程中知悉的对方商业秘密予以保密。
6.2 未经对方书面同意，任何一方不得向第三方披露对方的商业秘密。

第七条 违约责任
7.1 任何一方违反本合同约定，应承担相应的违约责任。
7.2 因违约给对方造成损失的，违约方应赔偿对方的实际损失。

第八条 争议解决
8.1 本合同的签订、履行、解释及争议解决均适用中华人民共和国法律。
8.2 双方因本合同发生的争议，应首先通过友好协商解决；协商不成的，任何一方均可向甲方所在地人民法院提起诉讼。

第九条 其他
9.1 本合同一式两份，甲乙双方各执一份，具有同等法律效力。
9.2 本合同自双方签字（或盖章）之日起生效。

第十条 附则
10.1 本合同未尽事宜，双方可另行签订补充协议。
10.2 本合同的附件是本合同不可分割的组成部分，与本合同具有同等法律效力。
`)

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

function getStatusBgColor(status: string) {
  const map: Record<string, string> = {
    pending: '#fffbe6',
    approved: '#f6ffed',
    rejected: '#fff2f0',
  }
  return map[status] || '#f5f5f5'
}

function goBack() {
  router.back()
}

function reSign() {
  if (contract.value) {
    contractStore.updateContract({
      id: contract.value.id,
      status: 'pending',
      rejectReason: undefined,
      signatureImage: undefined,
      companySeal: undefined,
      signTime: undefined,
    })
  }
  router.push('/contract-terms')
}

async function downloadPDF() {
  if (!contract.value) return
  try {
    await generateContractPDF(contract.value)
  } catch (e) {
    console.error('PDF生成失败', e)
    alert('PDF生成失败，请重试')
  }
}
</script>

<template>
  <div class="contract-detail-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">‹</div>
      <h1>合同详情</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="contract" class="content">
      <div class="status-card" :style="{ backgroundColor: getStatusBgColor(contract.status) }">
        <div class="status-row">
          <span class="status-label">审核状态</span>
          <span class="status-value" :style="{ color: getStatusColor(contract.status) }">
            {{ getStatusText(contract.status) }}
          </span>
        </div>
        <div v-if="contract.signTime" class="status-row">
          <span class="status-label">签约时间</span>
          <span class="status-value">{{ contract.signTime }}</span>
        </div>
      </div>

      <div v-if="contract.status === 'rejected' && contract.rejectReason" class="reject-card">
        <div class="reject-title">驳回原因</div>
        <div class="reject-content">{{ contract.rejectReason }}</div>
      </div>

      <div class="contract-card">
        <pre>{{ contractContent }}</pre>

        <div v-if="contract.signatureImage || contract.companySeal" class="sign-section">
          <div class="sign-row">
            <div v-if="contract.signatureImage" class="sign-item">
              <div class="sign-label">乙方签名：</div>
              <img :src="contract.signatureImage" class="signature-img" alt="电子签名" />
            </div>
            <div v-if="contract.companySeal" class="sign-item">
              <div class="sign-label">甲方盖章：</div>
              <img :src="contract.companySeal" class="seal-img" alt="公司电子章" />
            </div>
          </div>
          <div v-if="contract.signTime" class="sign-time">
            签约时间：{{ contract.signTime }}
          </div>
        </div>
      </div>

      <div v-if="contract.idCardFront || contract.idCardBack" class="upload-card">
        <h3>客户上传资料</h3>
        <div class="upload-section">
          <div class="upload-label">身份证正面</div>
          <img v-if="contract.idCardFront" :src="contract.idCardFront" class="upload-img" alt="身份证正面" />
        </div>
        <div class="upload-section">
          <div class="upload-label">身份证反面</div>
          <img v-if="contract.idCardBack" :src="contract.idCardBack" class="upload-img" alt="身份证反面" />
        </div>
        <div v-if="contract.signatureImage" class="upload-section">
          <div class="upload-label">手写签名</div>
          <img :src="contract.signatureImage" class="signature-preview" alt="手写签名" />
        </div>
      </div>

      <div v-if="contract.idCardInfo" class="idcard-card">
        <h3>身份证信息（OCR识别结果）</h3>
        <div class="info-row">
          <span class="info-label">姓名：</span>
          <span class="info-value">{{ contract.idCardInfo.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">身份证号：</span>
          <span class="info-value">{{ contract.idCardInfo.idNumber }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">地址：</span>
          <span class="info-value">{{ contract.idCardInfo.address }}</span>
        </div>
      </div>

      <div v-if="contract.status === 'approved'" class="action-section">
        <button class="btn-primary download-btn" @click="downloadPDF">
          下载电子版合同
        </button>
      </div>

      <div v-if="contract.status === 'rejected'" class="action-section">
        <button class="btn-primary re-sign-btn" @click="reSign">
          重新签约
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>合同不存在</p>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.contract-detail-page
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

.content
  padding 12px
  padding-bottom 40px

.status-card
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card

.status-row
  display flex
  align-items center
  justify-content space-between
  margin-bottom 8px

  &:last-child
    margin-bottom 0

.status-label
  font-size 14px
  color $text-secondary

.status-value
  font-size 14px
  font-weight 600

.reject-card
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card
  border-left 4px solid $danger

.reject-title
  font-size 15px
  font-weight 600
  color $danger
  margin-bottom 8px

.reject-content
  font-size 14px
  color $text-secondary
  line-height 1.6

.contract-card
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card

  pre
    white-space pre-wrap
    word-wrap break-word
    font-size 14px
    line-height 1.8
    color $text-primary
    font-family inherit

.sign-section
  margin-top 40px
  padding-top 20px
  border-top 1px dashed $border-dashed

.sign-row
  display flex
  align-items flex-start
  justify-content space-between
  margin-bottom 16px

.sign-item
  display flex
  flex-direction column
  align-items center

.sign-label
  font-size 13px
  color $text-secondary
  margin-bottom 8px

.signature-img
  width 120px
  height 60px
  object-fit contain
  border 1px solid $border-color
  border-radius $radius-sm

.seal-img
  width 100px
  height 100px
  object-fit contain

.sign-time
  text-align center
  font-size 13px
  color $text-muted
  margin-top 12px

.upload-card
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card

  h3
    font-size 15px
    font-weight 600
    color $text-primary
    margin-bottom 16px

.upload-section
  margin-bottom 16px

  &:last-child
    margin-bottom 0

.upload-label
  font-size 13px
  color $text-secondary
  margin-bottom 8px

.upload-img
  width 100%
  max-width 280px
  height 180px
  object-fit cover
  border-radius $radius-md
  border 1px solid $border-color

.signature-preview
  width 100%
  max-width 240px
  height 100px
  object-fit contain
  border 1px solid $border-color
  border-radius $radius-md
  background $bg-white

.idcard-card
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card

  h3
    font-size 15px
    font-weight 600
    color $text-primary
    margin-bottom 12px

.info-row
  display flex
  margin-bottom 10px
  font-size 14px

.info-label
  color $text-secondary
  flex-shrink 0
  width 90px

.info-value
  color $text-primary
  font-weight 500

.action-section
  padding 16px

.download-btn
.re-sign-btn
  margin-bottom 20px

.empty-state
  text-align center
  padding 80px 20px
  color $text-muted
</style>
