/**
 * 恶魔的代价 - 存档弹窗组件
 * 提供保存、加载、删除存档功能
 */
import { gameState, saveGame, loadGame, deleteSave, checkSaveExists } from '../store.js'

export default {
  name: 'SaveLoadModal',
  template: `
    <div class="modal-overlay" @click.self="close">
      <div class="modal-content animate-fade-in">
        <h3>存档管理</h3>

        <div class="modal-actions">
          <!-- 保存游戏 -->
          <button class="btn btn-primary" @click="save">保存游戏</button>

          <!-- 加载存档（仅在有存档时可用） -->
          <button
            class="btn btn-gold"
            :disabled="!gameState.hasSave"
            @click="load"
          >
            加载存档
          </button>

          <!-- 删除存档（仅在有存档时可用） -->
          <button
            class="btn btn-danger"
            :disabled="!gameState.hasSave"
            @click="removeSave"
          >
            删除存档
          </button>

          <!-- 关闭 -->
          <button class="btn" @click="close">关闭</button>
        </div>

        <p v-if="!gameState.hasSave" style="color:#666; margin-top:12px; font-size:0.85rem;">
          当前没有存档。
        </p>
      </div>
    </div>
  `,
  setup() {
    /**
     * 保存游戏
     */
    function save() {
      saveGame()
    }

    /**
     * 加载存档
     */
    function load() {
      const success = loadGame()
      if (success) {
        gameState.currentView = 'game'
      }
    }

    /**
     * 删除存档
     */
    function removeSave() {
      if (confirm('确定要删除存档吗？此操作不可撤销。')) {
        deleteSave()
      }
    }

    /**
     * 关闭弹窗
     */
    function close() {
      gameState.showSaveModal = false
    }

    return {
      gameState,
      save,
      load,
      removeSave,
      close,
    }
  }
}
