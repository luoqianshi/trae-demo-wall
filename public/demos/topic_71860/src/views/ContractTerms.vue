<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const agreed = ref(false)
const canSubmit = ref(false)
const scrollToBottom = ref(false)
const readTimeEnough = ref(false)
const countdown = ref(10)
let timer: ReturnType<typeof setInterval> | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

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

请仔细阅读以上合同条款，确保您完全理解并同意所有内容后再进行签署。您的签署将视为您对合同全部条款的认可和接受。

---

特别提示：
1. 请确保您已年满18周岁，具有完全民事行为能力。
2. 请确保您提供的信息真实、准确、完整。
3. 电子签名与手写签名具有同等法律效力。
4. 本合同采用电子数据形式订立，符合《中华人民共和国电子签名法》相关规定。

感谢您选择我们的服务！
`)

function onScroll(e: Event) {
  const target = e.target as HTMLElement
  const scrollBottom = target.scrollTop + target.clientHeight
  const scrollHeight = target.scrollHeight
  
  if (scrollBottom >= scrollHeight - 50) {
    scrollToBottom.value = true
    checkCanSubmit()
  }
}

function checkCanSubmit() {
  if (scrollToBottom.value && readTimeEnough.value && agreed.value) {
    canSubmit.value = true
  } else {
    canSubmit.value = false
  }
}

function onAgreeChange() {
  agreed.value = !agreed.value
  checkCanSubmit()
}

function submitContract() {
  if (!canSubmit.value) return
  router.push('/idcard-upload')
}

function goBack() {
  router.back()
}

onMounted(() => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      readTimeEnough.value = true
      checkCanSubmit()
      if (timer) clearInterval(timer)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (scrollTimer) clearTimeout(scrollTimer)
})
</script>

<template>
  <div class="contract-terms-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">‹</div>
      <h1>合同条款</h1>
      <div class="placeholder"></div>
    </div>

    <div class="contract-content" @scroll="onScroll">
      <pre>{{ contractContent }}</pre>
    </div>

    <div class="bottom-bar safe-bottom">
      <div class="countdown-hint" v-if="!readTimeEnough">
        请仔细阅读合同条款（还需等待 {{ countdown }} 秒）
      </div>
      <div class="scroll-hint" v-else-if="!scrollToBottom">
        请下滑阅读完整合同内容
      </div>
      <div class="agree-row">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="agreed"
            @change="onAgreeChange"
          />
          <span class="checkmark"></span>
          <span class="agree-text">我已阅读并同意以上条款</span>
        </label>
      </div>
      <button
        class="btn-primary submit-btn"
        :disabled="!canSubmit"
        @click="submitContract"
      >
        {{ canSubmit ? '同意并继续' : '请完成阅读后提交' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.contract-terms-page
  display flex
  flex-direction column
  height 100vh
  background $bg-white

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

.contract-content
  flex 1
  overflow-y auto
  padding 20px 16px
  padding-bottom 180px

  pre
    white-space pre-wrap
    word-wrap break-word
    font-size 14px
    line-height 1.8
    color $text-primary
    font-family inherit

.bottom-bar
  position fixed
  bottom 0
  left 0
  right 0
  background $bg-white
  border-top 1px solid $border-color
  padding 16px
  box-shadow $shadow-bar

.countdown-hint
.scroll-hint
  text-align center
  font-size 13px
  color $warning
  margin-bottom 12px

.agree-row
  margin-bottom 12px

.checkbox-label
  display flex
  align-items center
  cursor pointer

  input
    display none

.checkmark
  width 18px
  height 18px
  border 2px solid $border-dashed
  border-radius 3px
  margin-right 8px
  display flex
  align-items center
  justify-content center
  transition all 0.3s
  flex-shrink 0

.checkbox-label input:checked + .checkmark
  background $primary
  border-color $primary

  &::after
    content '✓'
    color $bg-white
    font-size 12px

.agree-text
  font-size 14px
  color $text-secondary

.submit-btn
  margin-top 8px
</style>
