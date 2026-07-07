/**
 * 恶魔的代价 - 审问场景组件
 * 上方显示嫌疑人卡片，下方显示对话面板
 */
import { computed } from 'vue'
import { gameState, gameData } from '../store.js'
import SceneIllustration from './SceneIllustration.js'
import SuspectCard from './SuspectCard.js'
import DialogPanel from './DialogPanel.js'

export default {
  name: 'InterviewScene',
  components: { SceneIllustration, SuspectCard, DialogPanel },
  template: `
    <div class="section animate-fade-in">
      <scene-illustration location="interview"></scene-illustration>
      <h2 class="scene-title">审问嫌疑人</h2>

      <!-- 消息显示区 -->
      <div class="message-box" v-if="gameState.message">{{ gameState.message }}</div>

      <!-- 嫌疑人卡片网格 -->
      <div class="suspect-grid">
        <suspect-card
          v-for="suspect in suspectList"
          :key="suspect.id"
          :suspect-id="suspect.id"
        ></suspect-card>
      </div>

      <!-- 对话面板（选中嫌疑人后显示） -->
      <dialog-panel v-if="gameState.currentSuspect"></dialog-panel>
    </div>
  `,
  setup() {
    // 嫌疑人列表
    const suspectList = computed(() => {
      return Object.entries(gameData.suspects).map(([id, data]) => ({
        id,
        ...data,
      }))
    })

    return {
      gameState,
      suspectList,
    }
  }
}
