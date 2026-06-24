/**
 * 恶魔的代价 - 游戏头部状态栏组件
 * 显示已发现线索数、已建立关联数、当前位置名称、存档按钮
 */
import { computed } from 'vue'
import { gameState, gameData } from '../store.js'

export default {
  name: 'GameHeader',
  template: `
    <div class="game-header">
      <div class="stat">
        线索: <span>{{ gameState.foundEvidences.length }}</span>
      </div>
      <div class="stat">
        关联: <span>{{ gameState.connections.length }}</span>
      </div>
      <div class="stat">
        位置: <span>{{ currentSceneName }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-small" @click="openSaveModal">存档</button>
      </div>
    </div>
  `,
  setup() {
    // 当前场景中文名称
    const currentSceneName = computed(() => {
      const scene = gameData.scenes[gameState.currentScene]
      return scene ? scene.name : gameState.currentScene
    })

    /**
     * 打开存档弹窗
     */
    function openSaveModal() {
      gameState.showSaveModal = true
    }

    return {
      gameState,
      currentSceneName,
      openSaveModal,
    }
  }
}
