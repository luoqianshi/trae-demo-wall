<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
onLaunch(() => {
  console.log('智行通 App Launch')
})
onShow(() => {
  console.log('智行通 App Show')
})
onHide(() => {
  console.log('智行通 App Hide')
})
</script>

<style lang="scss">
@import './styles/global.scss';
page {
  background-color: #0B1120;
  color: #E8ECF4;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
}
</style>