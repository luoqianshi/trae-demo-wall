<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  imageSrc: string
  title: string
}>()

const emit = defineEmits<{
  confirm: [croppedImage: string]
  cancel: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// 身份证标准比例 85.6mm : 54mm = 856 : 540
const ID_CARD_RATIO = 856 / 540 // ≈ 1.585

// 裁剪框状态
const cropBox = ref({ x: 0, y: 0, w: 0, h: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, cropX: 0, cropY: 0 })
const imageSize = ref({ w: 0, h: 0 })
const scale = ref(1)

let img: HTMLImageElement | null = null

onMounted(() => {
  nextTick(() => {
    loadImage()
  })
})

onUnmounted(() => {
  img = null
})

function loadImage() {
  img = new Image()
  img.onload = () => {
    initCanvas()
  }
  img.src = props.imageSrc
}

function initCanvas() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container || !img) return

  const containerW = container.clientWidth
  const containerH = container.clientHeight

  // 计算图片在容器中的缩放比例
  const imgRatio = img.naturalWidth / img.naturalHeight
  const containerRatio = containerW / containerH

  let drawW: number, drawH: number
  if (imgRatio > containerRatio) {
    drawW = containerW
    drawH = containerW / imgRatio
  } else {
    drawH = containerH
    drawW = containerH * imgRatio
  }

  scale.value = drawW / img.naturalWidth
  imageSize.value = { w: drawW, h: drawH }

  // 设置canvas尺寸
  canvas.width = containerW
  canvas.height = containerH

  // 计算裁剪框尺寸（按身份证比例）
  let cropW: number, cropH: number
  const maxCropW = drawW * 0.9
  const maxCropH = drawH * 0.9

  if (maxCropW / ID_CARD_RATIO <= maxCropH) {
    cropW = maxCropW
    cropH = maxCropW / ID_CARD_RATIO
  } else {
    cropH = maxCropH
    cropW = maxCropH * ID_CARD_RATIO
  }

  cropBox.value = {
    x: (containerW - cropW) / 2,
    y: (containerH - cropH) / 2,
    w: cropW,
    h: cropH,
  }

  draw()
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const containerW = canvas.width
  const containerH = canvas.height

  // 清空画布
  ctx.clearRect(0, 0, containerW, containerH)

  // 计算图片绘制位置（居中）
  const offsetX = (containerW - imageSize.value.w) / 2
  const offsetY = (containerH - imageSize.value.h) / 2

  // 绘制图片
  ctx.drawImage(img!, offsetX, offsetY, imageSize.value.w, imageSize.value.h)

  // 绘制半透明遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(0, 0, containerW, containerH)

  // 在裁剪区域挖洞（显示原图）
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillRect(cropBox.value.x, cropBox.value.y, cropBox.value.w, cropBox.value.h)
  ctx.globalCompositeOperation = 'source-over'

  // 绘制裁剪框边框
  ctx.strokeStyle = '#1677ff'
  ctx.lineWidth = 3
  ctx.strokeRect(cropBox.value.x, cropBox.value.y, cropBox.value.w, cropBox.value.h)

  // 绘制四角标记
  const cornerLen = 20
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3

  // 左上角
  ctx.beginPath()
  ctx.moveTo(cropBox.value.x, cropBox.value.y + cornerLen)
  ctx.lineTo(cropBox.value.x, cropBox.value.y)
  ctx.lineTo(cropBox.value.x + cornerLen, cropBox.value.y)
  ctx.stroke()

  // 右上角
  ctx.beginPath()
  ctx.moveTo(cropBox.value.x + cropBox.value.w - cornerLen, cropBox.value.y)
  ctx.lineTo(cropBox.value.x + cropBox.value.w, cropBox.value.y)
  ctx.lineTo(cropBox.value.x + cropBox.value.w, cropBox.value.y + cornerLen)
  ctx.stroke()

  // 左下角
  ctx.beginPath()
  ctx.moveTo(cropBox.value.x, cropBox.value.y + cropBox.value.h - cornerLen)
  ctx.lineTo(cropBox.value.x, cropBox.value.y + cropBox.value.h)
  ctx.lineTo(cropBox.value.x + cornerLen, cropBox.value.y + cropBox.value.h)
  ctx.stroke()

  // 右下角
  ctx.beginPath()
  ctx.moveTo(cropBox.value.x + cropBox.value.w - cornerLen, cropBox.value.y + cropBox.value.h)
  ctx.lineTo(cropBox.value.x + cropBox.value.w, cropBox.value.y + cropBox.value.h)
  ctx.lineTo(cropBox.value.x + cropBox.value.w, cropBox.value.y + cropBox.value.h - cornerLen)
  ctx.stroke()

  // 绘制提示文字
  ctx.fillStyle = '#fff'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('拖动调整位置', containerW / 2, cropBox.value.y - 10)
}

function onPointerDown(e: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 检查是否在裁剪框内
  if (
    x >= cropBox.value.x &&
    x <= cropBox.value.x + cropBox.value.w &&
    y >= cropBox.value.y &&
    y <= cropBox.value.y + cropBox.value.h
  ) {
    isDragging.value = true
    dragStart.value = { x, y, cropX: cropBox.value.x, cropY: cropBox.value.y }
    canvas.setPointerCapture(e.pointerId)
  }
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const dx = x - dragStart.value.x
  const dy = y - dragStart.value.y

  let newX = dragStart.value.cropX + dx
  let newY = dragStart.value.cropY + dy

  // 限制裁剪框不超出图片区域
  const offsetX = (canvas.width - imageSize.value.w) / 2
  const offsetY = (canvas.height - imageSize.value.h) / 2

  newX = Math.max(offsetX, Math.min(newX, offsetX + imageSize.value.w - cropBox.value.w))
  newY = Math.max(offsetY, Math.min(newY, offsetY + imageSize.value.h - cropBox.value.h))

  cropBox.value.x = newX
  cropBox.value.y = newY

  draw()
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  const canvas = canvasRef.value
  if (canvas) {
    canvas.releasePointerCapture(e.pointerId)
  }
}

function confirmCrop() {
  if (!img || !canvasRef.value) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置输出尺寸（身份证标准比例，固定宽度856px）
  const outputW = 856
  const outputH = Math.round(outputW / ID_CARD_RATIO)
  canvas.width = outputW
  canvas.height = outputH

  // 计算图片在canvas中的偏移
  const containerW = canvasRef.value.width
  const containerH = canvasRef.value.height
  const offsetX = (containerW - imageSize.value.w) / 2
  const offsetY = (containerH - imageSize.value.h) / 2

  // 计算裁剪区域在原图中的位置
  const srcX = (cropBox.value.x - offsetX) / scale.value
  const srcY = (cropBox.value.y - offsetY) / scale.value
  const srcW = cropBox.value.w / scale.value
  const srcH = cropBox.value.h / scale.value

  // 绘制裁剪后的图片
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH)

  const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92)
  emit('confirm', croppedDataUrl)
}

function cancelCrop() {
  emit('cancel')
}
</script>

<template>
  <div class="cropper-overlay">
    <div class="cropper-container">
      <div class="cropper-header">
        <h3>{{ title }}</h3>
        <p>拖动方框调整裁剪位置</p>
      </div>

      <div ref="containerRef" class="cropper-body">
        <canvas
          ref="canvasRef"
          class="cropper-canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
        />
      </div>

      <div class="cropper-footer">
        <button class="btn-secondary" @click="cancelCrop">取消</button>
        <button class="btn-primary" @click="confirmCrop">确认裁剪</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.cropper-overlay
  position fixed
  top 0
  left 0
  right 0
  bottom 0
  background rgba(0, 0, 0, 0.85)
  display flex
  align-items center
  justify-content center
  z-index 300
  padding 16px

.cropper-container
  background $bg-white
  border-radius $radius-lg
  width 100%
  max-width 420px
  overflow hidden
  display flex
  flex-direction column
  max-height 90vh

.cropper-header
  padding 16px
  text-align center
  border-bottom 1px solid $border-color

  h3
    font-size 16px
    font-weight 600
    color $text-primary
    margin-bottom 4px

  p
    font-size 13px
    color $text-muted

.cropper-body
  flex 1
  min-height 280px
  position relative
  background #000

.cropper-canvas
  width 100%
  height 100%
  display block
  touch-action none
  cursor move

.cropper-footer
  display flex
  gap 12px
  padding 16px
  border-top 1px solid $border-color

  .btn-secondary
    flex 1
    height 44px
    background $bg-white
    border 1px solid $border-dashed
    border-radius $radius-xl
    font-size 15px
    color $text-secondary
    cursor pointer

    &:active
      background $bg-page

  .btn-primary
    flex 1
    height 44px
    background linear-gradient(135deg, $primary 0%, $primary-dark 100%)
    color $bg-white
    border none
    border-radius $radius-xl
    font-size 15px
    font-weight 500
    cursor pointer

    &:active
      opacity 0.9
</style>
