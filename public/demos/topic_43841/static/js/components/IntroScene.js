/**
 * 恶魔的代价 - 案件介绍组件
 * 逐页显示 gameData.introPages，支持换行
 */
import { computed } from 'vue'
import { gameState, gameData } from '../store.js'

export default {
  name: 'IntroScene',
  template: `
    <div class="story-screen animate-page-flip" :key="gameState.introPage">
      <h2 class="scene-title">案件档案</h2>
      <div class="story-text">{{ currentPageText }}</div>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="nextPage">
          {{ isLastPage ? '开始调查' : '继续' }}
        </button>
      </div>
      <p class="page-indicator">{{ gameState.introPage + 1 }} / {{ gameData.introPages.length }}</p>
    </div>
  `,
  setup() {
    // 当前页文本
    const currentPageText = computed(() => {
      if (gameData.introPages.length === 0) return '正在加载案件资料...'
      return gameData.introPages[gameState.introPage] || ''
    })

    // 是否是最后一页
    const isLastPage = computed(() => {
      return gameState.introPage >= gameData.introPages.length - 1
    })

    /**
     * 下一页或进入游戏
     */
    function nextPage() {
      if (isLastPage.value) {
        gameState.currentView = 'game'
      } else {
        gameState.introPage++
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
