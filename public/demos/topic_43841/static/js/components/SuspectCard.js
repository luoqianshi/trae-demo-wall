/**
 * 恶魔的代价 - 嫌疑人卡片组件
 * 显示嫌疑人信息，点击选中
 */
import { computed } from 'vue'
import { gameState, gameData } from '../store.js'

export default {
  name: 'SuspectCard',
  props: {
    // 嫌疑人ID
    suspectId: {
      type: String,
      required: true,
    }
  },
  template: `
    <div
      class="suspect-card"
      :class="{ selected: isSelected }"
      @click="selectSuspect"
    >
      <div class="suspect-name">{{ suspect.name }}</div>
      <div class="suspect-role">{{ suspect.role }}</div>
      <div class="suspect-desc">{{ suspect.description }}</div>
    </div>
  `,
  setup(props) {
    // 嫌疑人数据
    const suspect = computed(() => {
      return gameData.suspects[props.suspectId] || { name: '未知', role: '', description: '' }
    })

    // 是否被选中
    const isSelected = computed(() => {
      return gameState.currentSuspect === props.suspectId
    })

    /**
     * 选中嫌疑人
     */
    function selectSuspect() {
      gameState.currentSuspect = props.suspectId
      gameState.message = ''
    }

    return {
      suspect,
      isSelected,
      selectSuspect,
    }
  }
}
