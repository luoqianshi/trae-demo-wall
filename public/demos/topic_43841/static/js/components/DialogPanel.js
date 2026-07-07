/**
 * 恶魔的代价 - 对话面板组件
 * 显示当前选中嫌疑人的对话话题
 */
import { computed } from 'vue'
import { gameState, gameData, useDialog, isTopicAvailable } from '../store.js'

export default {
  name: 'DialogPanel',
  template: `
    <div class="dialog-panel animate-slide-in">
      <!-- 嫌疑人名称标题 -->
      <div class="dialog-title">审问：{{ suspect.name }}</div>

      <!-- 消息显示区 -->
      <div class="message-box" v-if="gameState.message">{{ gameState.message }}</div>

      <!-- 话题按钮列表 -->
      <div class="topic-buttons">
        <button
          v-for="(dialog, topic) in suspect.dialogs"
          :key="topic"
          class="btn btn-small"
          :class="topicClass(topic)"
          @click="askTopic(topic)"
          :disabled="topicStatus(topic) !== 'available'"
        >
          {{ topic }}
          <span v-if="topicStatus(topic) === 'locked'">（未解锁）</span>
          <span v-if="topicStatus(topic) === 'used'">（已询问）</span>
        </button>
      </div>
    </div>
  `,
  setup() {
    // 当前选中的嫌疑人数据
    const suspect = computed(() => {
      if (!gameState.currentSuspect) return { name: '', dialogs: {} }
      return gameData.suspects[gameState.currentSuspect] || { name: '', dialogs: {} }
    })

    /**
     * 获取话题状态
     */
    function topicStatus(topic) {
      if (!gameState.currentSuspect) return 'locked'
      return isTopicAvailable(gameState.currentSuspect, topic)
    }

    /**
     * 获取话题按钮CSS类
     */
    function topicClass(topic) {
      const status = topicStatus(topic)
      if (status === 'used') return 'btn-disabled'
      if (status === 'locked') return 'btn-disabled'
      return ''
    }

    /**
     * 询问话题
     */
    function askTopic(topic) {
      if (topicStatus(topic) !== 'available') return
      useDialog(gameState.currentSuspect, topic)
    }

    return {
      gameState,
      suspect,
      topicStatus,
      topicClass,
      askTopic,
    }
  }
}
