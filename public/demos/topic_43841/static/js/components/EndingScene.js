/**
 * 恶魔的代价 - 结局画面组件
 * 逐页显示 gameData.endingPages
 */
import { computed } from 'vue'
import { gameState, gameData, resetGame } from '../store.js'

export default {
  name: 'EndingScene',
  template: `
    <div class="story-screen animate-page-flip" :key="gameState.endingPage">
      <h2 class="scene-title">案件真相</h2>
      <div class="story-text">{{ currentPageText }}</div>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="nextPage">
          {{ isLastPage ? '重新开始' : '继续' }}
        </button>
      </div>
      <p class="page-indicator">{{ gameState.endingPage + 1 }} / {{ gameData.endingPages.length }}</p>
    </div>
  `,
  setup() {
    // 当前页文本
    const currentPageText = computed(() => {
      if (gameData.endingPages.length === 0) return '正在加载结局...'
      return gameData.endingPages[gameState.endingPage] || ''
    })

    // 是否是最后一页
    const isLastPage = computed(() => {
      return gameState.endingPage >= gameData.endingPages.length - 1
    })

    /**
     * 下一页或重新开始
     */
    function nextPage() {
      if (isLastPage.value) {
        resetGame()
      } else {
        gameState.endingPage++
      }
    }

    return {
      gameState,
      gameData,
      currentPageText,
      isLastPage,
      nextPage,
    }
  }
}
