/**
 * 恶魔的代价 - 导航栏组件
 * 6个场景按钮，点击切换 currentScene
 */
import { gameState } from '../store.js'

export default {
  name: 'NavigationBar',
  template: `
    <div class="nav-bar">
      <button
        v-for="scene in sceneList"
        :key="scene.id"
        class="btn"
        :class="{ 'btn-primary': gameState.currentScene === scene.id }"
        @click="switchScene(scene.id)"
      >
        {{ scene.name }}
      </button>
    </div>
  `,
  setup() {
    // 场景列表（固定6个场景）
    const sceneList = [
      { id: 'crime_scene', name: '案发现场' },
      { id: 'basement', name: '地下室' },
      { id: 'study', name: '书房' },
      { id: 'office', name: '物业办公室' },
      { id: 'interview', name: '审问嫌疑人' },
      { id: 'board', name: '证据板' },
    ]

    /**
     * 切换场景
     */
    function switchScene(sceneId) {
      gameState.currentScene = sceneId
      gameState.currentSuspect = null
      gameState.message = ''
    }

    return {
      gameState,
      sceneList,
      switchScene,
    }
  }
}
