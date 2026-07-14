<script setup lang="ts">
import { onLaunch, onShow, onHide, onError, onPageNotFound } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('品牌红黑榜启动')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

onError((err) => {
  console.error('应用错误:', err)
})

onPageNotFound(() => {
  uni.switchTab({ url: '/pages/home/index' })
})
</script>

<style lang="scss">
@import './styles/global.scss';
</style>
