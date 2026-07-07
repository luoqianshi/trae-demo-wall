/**
 * 恶魔的代价 - 关联推理面板组件
 * 两个下拉选择器选择线索，建立关联
 */
import { ref, computed } from 'vue'
import { gameState, gameData } from '../store.js'
import { validateConnect } from '../api.js'
import { playConnect, playError } from '../audio.js'

export default {
  name: 'ConnectPanel',
  template: `
    <div class="connect-panel">
      <!-- 选择线索1 -->
      <select v-model="selectedEv1" @change="onSelectionChange">
        <option value="">-- 选择第一条线索 --</option>
        <option v-for="ev in foundEvidences" :key="ev.id" :value="ev.id">
          {{ ev.name }}
        </option>
      </select>

      <!-- 选择线索2 -->
      <select v-model="selectedEv2" @change="onSelectionChange">
        <option value="">-- 选择第二条线索 --</option>
        <option v-for="ev in foundEvidences" :key="ev.id" :value="ev.id">
          {{ ev.name }}
        </option>
      </select>

      <!-- 线索描述预览 -->
      <div v-if="previewEv1" class="ev-desc-preview">
        <strong>{{ previewEv1.name }}：</strong>{{ previewEv1.description }}
      </div>
      <div v-if="previewEv2" class="ev-desc-preview">
        <strong>{{ previewEv2.name }}：</strong>{{ previewEv2.description }}
      </div>

      <!-- 建立关联按钮 -->
      <div class="action-buttons">
        <button
          class="btn btn-primary btn-small"
          :disabled="!canConnect"
          @click="connect"
        >
          建立关联
        </button>
      </div>

      <!-- 关联结果显示 -->
      <div v-if="connectResult" class="connection-result" :class="connectResult.type">
        {{ connectResult.message }}
      </div>

      <!-- 已建立的关联列表 -->
      <div v-if="connectionsList.length > 0" class="connections-list">
        <div class="section-title" style="margin-top:16px;">已建立的关联 ({{ connectionsList.length }})</div>
        <div v-for="(conn, index) in connectionsList" :key="index" class="connection-item">
          <span>{{ conn.ev1Name }}</span> ↔ <span>{{ conn.ev2Name }}</span>
        </div>
      </div>
    </div>
  `,
  setup() {
    const selectedEv1 = ref('')
    const selectedEv2 = ref('')
    const connectResult = ref(null)

    // 已发现的线索列表（含中文名）
    const foundEvidences = computed(() => {
      return gameState.foundEvidences.map(evId => {
        const ev = gameData.evidences[evId]
        return ev ? { id: evId, name: ev.name, description: ev.description } : { id: evId, name: evId, description: '' }
      })
    })

    // 预览线索1
    const previewEv1 = computed(() => {
      if (!selectedEv1.value) return null
      return foundEvidences.value.find(e => e.id === selectedEv1.value) || null
    })

    // 预览线索2
    const previewEv2 = computed(() => {
      if (!selectedEv2.value) return null
      return foundEvidences.value.find(e => e.id === selectedEv2.value) || null
    })

    // 是否可以建立关联
    const canConnect = computed(() => {
      return selectedEv1.value && selectedEv2.value && selectedEv1.value !== selectedEv2.value
    })

    // 已建立的关联列表（显示中文名）
    const connectionsList = computed(() => {
      return gameState.connections.map(([ev1, ev2]) => {
        const name1 = gameData.evidences[ev1] ? gameData.evidences[ev1].name : ev1
        const name2 = gameData.evidences[ev2] ? gameData.evidences[ev2].name : ev2
        return { ev1, ev2, ev1Name: name1, ev2Name: name2 }
      })
    })

    /**
     * 选择变化时清除结果
     */
    function onSelectionChange() {
      connectResult.value = null
    }

    /**
     * 建立关联
     */
    async function connect() {
      if (!canConnect.value) return

      try {
        const result = await validateConnect(
          selectedEv1.value,
          selectedEv2.value,
          gameState.foundEvidences,
          gameState.connections
        )

        if (result.success) {
          // 关联成功，添加到列表
          gameState.connections.push([selectedEv1.value, selectedEv2.value])
          connectResult.value = { type: 'success', message: result.message || '关联建立成功！' }
          playConnect()
          // 清空选择
          selectedEv1.value = ''
          selectedEv2.value = ''
        } else if (result.exists) {
          connectResult.value = { type: 'exists', message: result.message || '这两条线索已经关联过了。' }
        } else {
          connectResult.value = { type: 'failure', message: result.message || '这两条线索之间没有明显的关联。' }
          playError()
        }
      } catch (err) {
        connectResult.value = { type: 'failure', message: '关联验证失败，请稍后重试。' }
      }
    }

    return {
      selectedEv1,
      selectedEv2,
      connectResult,
      foundEvidences,
      previewEv1,
      previewEv2,
      canConnect,
      connectionsList,
      onSelectionChange,
      connect,
    }
  }
}
