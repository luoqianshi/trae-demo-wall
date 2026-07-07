/**
 * 恶魔的代价 - Vue 3 应用入口
 * 注册所有组件，根据 gameState.currentView 动态渲染视图
 */
import { createApp, onMounted, computed, defineComponent } from 'vue'
import { gameState, gameData, checkSaveExists } from './store.js'
import { fetchGameData } from './api.js'

// --- 导入所有组件 ---
import TitleScene from './components/TitleScene.js'
import IntroScene from './components/IntroScene.js'
import EndingScene from './components/EndingScene.js'
import GameHeader from './components/GameHeader.js'
import NavigationBar from './components/NavigationBar.js'
import SceneIllustration from './components/SceneIllustration.js'
import CrimeScene from './components/CrimeScene.js'
import BasementScene from './components/BasementScene.js'
import StudyScene from './components/StudyScene.js'
import OfficeScene from './components/OfficeScene.js'
import InterviewScene from './components/InterviewScene.js'
import EvidenceBoard from './components/EvidenceBoard.js'
import SaveLoadModal from './components/SaveLoadModal.js'

/**
 * 场景组件映射
 * 根据 currentScene 决定显示哪个调查场景组件
 */
const sceneComponents = {
  crime_scene: 'CrimeScene',
  basement: 'BasementScene',
  study: 'StudyScene',
  office: 'OfficeScene',
  interview: 'InterviewScene',
  board: 'EvidenceBoard',
}

/**
 * 游戏主视图组件
 * 包含 GameHeader + NavigationBar + 动态场景内容
 */
const GameView = defineComponent({
  name: 'GameView',
  components: {
    GameHeader,
    SceneNav: NavigationBar,
    CrimeScene,
    BasementScene,
    StudyScene,
    OfficeScene,
    InterviewScene,
    EvidenceBoard,
  },
  template: `
    <div class="animate-fade-in">
      <game-header></game-header>
      <scene-nav></scene-nav>
      <component :is="currentSceneComponent" :location="gameState.currentScene" :key="gameState.currentScene"></component>
    </div>
  `,
  setup() {
    // 当前场景对应的组件名
    const currentSceneComponent = computed(() => {
      return sceneComponents[gameState.currentScene] || 'CrimeScene'
    })

    return {
      gameState,
      currentSceneComponent,
    }
  }
})

/**
 * 根应用组件
 */
const App = defineComponent({
  name: 'App',
  components: {
    TitleScene,
    IntroScene,
    GameView,
    EndingScene,
    SaveLoadModal,
  },
  template: `
    <div id="app-root">
      <!-- 标题画面 -->
      <title-scene v-if="gameState.currentView === 'title'"></title-scene>

      <!-- 案件介绍 -->
      <intro-scene v-else-if="gameState.currentView === 'intro'"></intro-scene>

      <!-- 游戏主界面 -->
      <game-view v-else-if="gameState.currentView === 'game'"></game-view>

      <!-- 结局画面 -->
      <ending-scene v-else-if="gameState.currentView === 'ending'"></ending-scene>

      <!-- 存档弹窗（全局覆盖层） -->
      <save-load-modal v-if="gameState.showSaveModal"></save-load-modal>
    </div>
  `,
  setup() {
    onMounted(async () => {
      // 检查是否有存档
      checkSaveExists()

      // 从API加载游戏数据
      try {
        const data = await fetchGameData()
        // 填充 gameData
        if (data.evidences) gameData.evidences = data.evidences
        if (data.suspects) gameData.suspects = data.suspects
        if (data.connection_results) gameData.connectionResults = data.connection_results
        if (data.scenes) gameData.scenes = data.scenes
        if (data.intro_pages) gameData.introPages = data.intro_pages
        if (data.ending_pages) gameData.endingPages = data.ending_pages
        if (data.accuse_requirements) gameData.accuseRequirements = data.accuse_requirements
        gameData.loaded = true
      } catch (err) {
        console.error('加载游戏数据失败:', err)
        gameState.message = '加载游戏数据失败，请刷新页面重试。'
      }
    })

    return {
      gameState,
    }
  }
})

// --- 创建并挂载 Vue 应用 ---
const app = createApp(App)
app.mount('#app')
