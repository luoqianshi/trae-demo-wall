/**
 * 恶魔的代价 - 地下室场景组件
 * 复用 CrimeScene 通用组件，硬编码 location='basement'
 */
import CrimeScene from './CrimeScene.js'

export default {
  name: 'BasementScene',
  components: { CrimeScene },
  template: `
    <crime-scene location="basement"></crime-scene>
  `,
  setup() {
    return {}
  }
}
