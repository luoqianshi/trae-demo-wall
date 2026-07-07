/**
 * 恶魔的代价 - 物业办公室场景组件
 * 复用 CrimeScene 通用组件，硬编码 location='office'
 */
import CrimeScene from './CrimeScene.js'

export default {
  name: 'OfficeScene',
  components: { CrimeScene },
  template: `
    <crime-scene location="office"></crime-scene>
  `,
  setup() {
    return {}
  }
}
