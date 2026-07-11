<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const contractStore = useContractStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const isDrawing = ref(false)
const hasDrawn = ref(false)

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  const context = canvas.getContext('2d')
  if (!context) return

  context.scale(dpr, dpr)
  context.strokeStyle = '#333'
  context.lineWidth = 2
  context.lineCap = 'round'
  context.lineJoin = 'round'

  ctx.value = context
}

function getPoint(e: TouchEvent | MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  let clientX, clientY

  if ('touches' in e) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

function startDrawing(e: TouchEvent | MouseEvent) {
  e.preventDefault()
  isDrawing.value = true
  hasDrawn.value = true

  const point = getPoint(e)
  ctx.value?.beginPath()
  ctx.value?.moveTo(point.x, point.y)
}

function draw(e: TouchEvent | MouseEvent) {
  if (!isDrawing.value) return
  e.preventDefault()

  const point = getPoint(e)
  ctx.value?.lineTo(point.x, point.y)
  ctx.value?.stroke()
}

function stopDrawing() {
  isDrawing.value = false
  ctx.value?.closePath()
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !ctx.value) return

  ctx.value.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))
  hasDrawn.value = false
}

function submitSignature() {
  if (!hasDrawn.value) {
    alert('请先进行签名')
    return
  }

  const canvas = canvasRef.value
  if (!canvas) return

  const signatureImage = canvas.toDataURL('image/png')

  if (contractStore.currentContract) {
    contractStore.updateContract({
      id: contractStore.currentContract.id,
      signatureImage: signatureImage,
      companySeal: generateCompanySeal(),
      signTime: new Date().toLocaleString('zh-CN'),
    })
  }

  router.push('/submit-success')
}

function generateCompanySeal(): string {
  const sealCanvas = document.createElement('canvas')
  sealCanvas.width = 200
  sealCanvas.height = 200
  const sealCtx = sealCanvas.getContext('2d')
  if (!sealCtx) return ''

  const centerX = 100
  const centerY = 100
  const radius = 90

  sealCtx.beginPath()
  sealCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  sealCtx.strokeStyle = '#f5222d'
  sealCtx.lineWidth = 4
  sealCtx.stroke()

  sealCtx.beginPath()
  sealCtx.arc(centerX, centerY, radius - 8, 0, 2 * Math.PI)
  sealCtx.strokeStyle = '#f5222d'
  sealCtx.lineWidth = 1
  sealCtx.stroke()

  sealCtx.fillStyle = '#f5222d'
  drawStar(sealCtx, centerX, centerY - 25, 5, 18, 8)

  sealCtx.font = 'bold 18px sans-serif'
  sealCtx.fillStyle = '#f5222d'
  sealCtx.textAlign = 'center'
  sealCtx.fillText('科技有限公司', centerX, centerY + 25)

  sealCtx.font = '14px sans-serif'
  sealCtx.fillText('合同专用章', centerX, centerY + 48)

  return sealCanvas.toDataURL('image/png')
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fill()
}

function goBack() {
  router.back()
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  stopDrawing()
})
</script>

<template>
  <div class="signature-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">‹</div>
      <h1>电子签名</h1>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <p class="tip">请在下方区域手写您的签名</p>

      <div class="canvas-wrapper">
        <canvas
          ref="canvasRef"
          class="signature-canvas"
          @touchstart="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
        ></canvas>
        <div v-if="!hasDrawn" class="canvas-placeholder">
          <span>请在此处签名</span>
        </div>
      </div>

      <div class="action-btns">
        <button class="btn-secondary" @click="clearCanvas">
          重新签名
        </button>
      </div>

      <button
        class="btn-primary submit-btn"
        :disabled="!hasDrawn"
        @click="submitSignature"
      >
        提交签名
      </button>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.signature-page
  min-height 100vh
  background $bg-page
  display flex
  flex-direction column

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
  flex 1
  padding 16px
  display flex
  flex-direction column

.tip
  font-size 14px
  color $text-secondary
  margin-bottom 16px
  text-align center

.canvas-wrapper
  position relative
  flex 1
  background $bg-white
  border-radius $radius-lg
  border 2px dashed $border-dashed
  overflow hidden
  min-height 300px

.signature-canvas
  width 100%
  height 100%
  display block
  touch-action none

.canvas-placeholder
  position absolute
  top 50%
  left 50%
  transform translate(-50%, -50%)
  pointer-events none
  color #ccc
  font-size 16px

.action-btns
  display flex
  align-items center
  justify-content center
  margin 16px 0

.btn-secondary
  padding 10px 24px
  background $bg-white
  border 1px solid $border-dashed
  border-radius 20px
  font-size 14px
  color $text-secondary
  cursor pointer
  transition all 0.3s

  &:active
    background $bg-page

.submit-btn
  margin-bottom 40px
</style>
