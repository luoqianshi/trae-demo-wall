/**
 * 恶魔的代价 - 书房场景组件
 * 复用 CrimeScene 通用组件，硬编码 location='study'
 */
import CrimeScene from './CrimeScene.js'

export default {
  name: 'StudyScene',
  components: { CrimeScene },
  template: `
    <crime-scene location="study"></crime-scene>
  `,
  setup() {
    return {}
  }
}
