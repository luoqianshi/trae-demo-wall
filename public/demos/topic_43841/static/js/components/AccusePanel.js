/**
 * 恶魔的代价 - 指认凶手面板组件
 * 4个嫌疑人按钮，点击调用API验证
 */
import { ref } from 'vue'
import { gameState, gameData } from '../store.js'
import { validateAccuse } from '../api.js'
import { playConnect, playError } from '../audio.js'

export default {
  name: 'AccusePanel',
  template: `
    <div class="accuse-panel">
      <p style="color: var(--text-secondary); margin-bottom: 12px;">
        你认为谁是凶手？选择一名嫌疑人进行指认。
      </p>

      <!-- 嫌疑人按钮列表 -->
      <div class="action-buttons" style="justify-content: flex-start;">
        <button
          v-for="suspect in suspectList"
          :key="suspect.id"
          class="btn btn-danger btn-small"
          @click="accuse(suspect)"
          :disabled="accusing"
        >
          指认 {{ suspect.name }}
        </button>
      </div>

      <!-- 指认结果 -->
      <div v-if="accuseResult" class="accuse-result" :class="accuseResult.type">
        {{ accuseResult.message }}
      </div>
    </div>
  `,
  setup() {
    const accuseResult = ref(null)
    const accusing = ref(false)

    // 嫌疑人列表
    const suspectList = ref([])

    // 从 gameData 中获取嫌疑人列表
    function updateSuspectList() {
      suspectList.value = Object.entries(gameData.suspects).map(([id, data]) => ({
        id,
        name: data.name,
      }))
    }

    // 初始化
    updateSuspectList()

    /**
     * 指认凶手
     */
    async function accuse(suspect) {
      if (accusing.value) return
      accusing.value = true
      accuseResult.value = null

      try {
        const result = await validateAccuse(
          suspect.name,
          gameState.foundEvidences,
          gameState.connections
        )

        if (result.correct) {
          accuseResult.value = { type: 'success', message: result.message || '恭喜你，指认正确！' }
          playConnect()
          // 延迟进入结局
          setTimeout(() => {
            gameState.gameOver = true
            gameState.currentView = 'ending'
          }, 2000)
        } else {
          accuseResult.value = { type: 'failure', message: result.message || '指认错误，请重新思考。' }
          playError()
        }
      } catch (err) {
        accuseResult.value = { type: 'failure', message: '指认验证失败，请稍后重试。' }
      } finally {
        accusing.value = false
      }
    }

    return {
      accuseResult,
      accusing,
      suspectList,
      accuse,
    }
  }
}
