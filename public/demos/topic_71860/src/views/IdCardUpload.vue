<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract'
import IdCardCropper from '../components/IdCardCropper.vue'

const router = useRouter()
const contractStore = useContractStore()

const frontImage = ref('')
const backImage = ref('')
const isRecognizing = ref(false)
const recognizeResult = ref<any>(null)
const frontInput = ref<HTMLInputElement | null>(null)
const backInput = ref<HTMLInputElement | null>(null)

// 裁剪相关
const showCropper = ref(false)
const cropperImage = ref('')
const cropperTitle = ref('')
const cropperTarget = ref<'front' | 'back'>('front')

const MAX_SIZE = 1.5 * 1024 * 1024 // 1.5MB
const MIN_DIMENSION = 500
const MAX_DIMENSION = 8000
const MAX_RATIO = 50

function validateImage(file: File): Promise<{ valid: boolean; message?: string }> {
  return new Promise((resolve) => {
    // 1. 文件大小限制
    if (file.size > MAX_SIZE) {
      resolve({ valid: false, message: `图片大小不能超过1.5M（当前 ${(file.size / 1024 / 1024).toFixed(2)}M）` })
      return
    }

    // 2. 读取图片获取宽高
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const width = img.naturalWidth
      const height = img.naturalHeight

      // 3. 长宽均大于500px
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({ valid: false, message: `图片长和宽均需大于500px（当前 ${width}x${height}）` })
        return
      }

      // 4. 长宽均小于8000px
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({ valid: false, message: `图片长和宽均需小于8000px（当前 ${width}x${height}）` })
        return
      }

      // 5. 长宽比小于50
      const ratio = Math.max(width, height) / Math.min(width, height)
      if (ratio > MAX_RATIO) {
        resolve({ valid: false, message: `图片长宽比不能超过50（当前 ${ratio.toFixed(2)}）` })
        return
      }

      resolve({ valid: true })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ valid: false, message: '图片读取失败，请重新选择' })
    }

    img.src = url
  })
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleFile(file: File, type: 'front' | 'back') {
  const result = await validateImage(file)
  if (!result.valid) {
    alert(result.message)
    return
  }

  const dataUrl = await readFileAsDataURL(file)

  // 打开裁剪器
  cropperImage.value = dataUrl
  cropperTarget.value = type
  cropperTitle.value = type === 'front' ? '裁剪身份证正面' : '裁剪身份证反面'
  showCropper.value = true
}

function onCropConfirm(croppedImage: string) {
  if (cropperTarget.value === 'front') {
    frontImage.value = croppedImage
  } else {
    backImage.value = croppedImage
  }
  showCropper.value = false
}

function onCropCancel() {
  showCropper.value = false
}

function triggerFrontUpload() {
  frontInput.value?.click()
}

function triggerBackUpload() {
  backInput.value?.click()
}

function handleFrontChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    handleFile(file, 'front')
    ;(e.target as HTMLInputElement).value = ''
  }
}

function handleBackChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    handleFile(file, 'back')
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function recognizeIdCard() {
  if (!frontImage.value || !backImage.value) {
    alert('请先上传身份证正反面照片')
    return
  }

  isRecognizing.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))

  recognizeResult.value = {
    name: '张三',
    idNumber: '110101199001011234',
    address: '北京市朝阳区xxx街道xxx号',
    validDate: '2020.01.01-2030.01.01',
  }

  isRecognizing.value = false
}

function goNext() {
  if (!recognizeResult.value) {
    alert('请先完成身份证识别')
    return
  }

  if (contractStore.currentContract) {
    contractStore.updateContract({
      id: contractStore.currentContract.id,
      idCardFront: frontImage.value,
      idCardBack: backImage.value,
      idCardInfo: recognizeResult.value,
    })
  }

  router.push('/signature')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="idcard-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">‹</div>
      <h1>身份证认证</h1>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <p class="tip">请上传身份证正反面照片，我们将使用阿里云OCR进行识别验证</p>

      <div class="upload-section">
        <div class="upload-label">身份证正面（人像面）</div>
        <div class="upload-box" @click="triggerFrontUpload">
          <input
            ref="frontInput"
            type="file"
            accept="image/*"
            capture="environment"
            style="display: none"
            @change="handleFrontChange"
          />
          <template v-if="!frontImage">
            <div class="upload-icon">📷</div>
            <div class="upload-text">点击拍照或选择照片</div>
          </template>
          <img v-else :src="frontImage" class="preview-img" />
        </div>
      </div>

      <div class="upload-section">
        <div class="upload-label">身份证反面（国徽面）</div>
        <div class="upload-box" @click="triggerBackUpload">
          <input
            ref="backInput"
            type="file"
            accept="image/*"
            capture="environment"
            style="display: none"
            @change="handleBackChange"
          />
          <template v-if="!backImage">
            <div class="upload-icon">📷</div>
            <div class="upload-text">点击拍照或选择照片</div>
          </template>
          <img v-else :src="backImage" class="preview-img" />
        </div>
      </div>

      <button
        class="btn-primary recognize-btn"
        :disabled="!frontImage || !backImage || isRecognizing"
        @click="recognizeIdCard"
      >
        <span v-if="isRecognizing">识别中...</span>
        <span v-else>开始识别</span>
      </button>

      <div v-if="recognizeResult" class="result-card">
        <h3>识别结果</h3>
        <div class="result-item">
          <span class="result-label">姓名：</span>
          <span class="result-value">{{ recognizeResult.name }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">身份证号：</span>
          <span class="result-value">{{ recognizeResult.idNumber }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">地址：</span>
          <span class="result-value">{{ recognizeResult.address }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">有效期：</span>
          <span class="result-value">{{ recognizeResult.validDate }}</span>
        </div>
      </div>

      <button
        v-if="recognizeResult"
        class="btn-primary next-btn"
        @click="goNext"
      >
        下一步
      </button>
    </div>

    <!-- 身份证裁剪器 -->
    <IdCardCropper
      v-if="showCropper"
      :image-src="cropperImage"
      :title="cropperTitle"
      @confirm="onCropConfirm"
      @cancel="onCropCancel"
    />
  </div>
</template>

<style scoped lang="stylus">
.idcard-page
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
  padding 16px

.tip
  font-size 13px
  color $text-secondary
  margin-bottom 20px
  line-height 1.5

.upload-section
  margin-bottom 20px

.upload-label
  font-size 14px
  color $text-primary
  margin-bottom 10px
  font-weight 500

.upload-box
  width 100%
  height 200px
  background $bg-white
  border 2px dashed $border-dashed
  border-radius $radius-lg
  display flex
  align-items center
  justify-content center
  flex-direction column
  cursor pointer
  overflow hidden

.upload-icon
  font-size 40px
  margin-bottom 8px

.upload-text
  font-size 14px
  color $text-muted

.preview-img
  width 100%
  height 100%
  object-fit cover

.recognize-btn
  margin-bottom 20px

.result-card
  background $bg-white
  border-radius $radius-lg
  padding 16px
  margin-bottom 12px
  box-shadow $shadow-card

  h3
    font-size 15px
    color $text-primary
    margin-bottom 12px
    font-weight 600

.result-item
  display flex
  margin-bottom 10px
  font-size 14px

.result-label
  color $text-secondary
  flex-shrink 0
  width 80px

.result-value
  color $text-primary
  font-weight 500

.next-btn
  margin-bottom 40px
</style>
