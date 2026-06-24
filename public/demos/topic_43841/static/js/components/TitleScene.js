/**
 * 恶魔的代价 - 标题画面组件
 * 显示游戏名称、副标题、开始/继续按钮
 */
import { gameState, resetGame, loadGame } from '../store.js'

export default {
  name: 'TitleScene',
  template: `
    <div class="title-screen animate-fade-in">
      <h1 class="animate-pulse">恶魔的代价</h1>
      <p class="subtitle">一桩激情杀人的谜案</p>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="startNewGame">开始调查</button>
        <button class="btn btn-gold" v-if="gameState.hasSave" @click="continueGame">继续游戏</button>
      </div>
    </div>
  `,
  setup() {
    /**
     * 开始新游戏
     */
    function startNewGame() {
      resetGame()
      gameState.currentView = 'intro'
    }

    /**
     * 继续存档游戏
     */
    function continueGame() {
      const success = loadGame()
      if (success) {
        gameState.currentView = 'game'
        gameState.message = '存档已加载，继续调查吧。'
      }
    }

    return {
      gameState,
      startNewGame,
      continueGame,
    }
  }
}
