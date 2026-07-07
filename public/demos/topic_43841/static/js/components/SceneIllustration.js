/**
 * 恶魔的代价 - 场景插图组件
 * 根据 location prop 渲染 CSS 场景插图
 */
export default {
  name: 'SceneIllustration',
  props: {
    // 场景位置ID
    location: {
      type: String,
      required: true,
    }
  },
  template: `
    <div :class="'scene-illustration-' + location" class="scene-illustration"></div>
  `,
  setup(props) {
    return {
      location: props.location,
    }
  }
}
