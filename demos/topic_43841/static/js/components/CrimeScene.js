/**
 * 恶魔的代价 - 调查场景通用组件
 * 显示场景插图 + 线索按钮网格
 * 根据 location prop 筛选对应场景的线索
 */
import { computed } from 'vue'
import { gameState, gameData, investigateEvidence } from '../store.js'
import { playDiscovery } from '../audio.js'
import SceneIllustration from './SceneIllustration.js'

export default {
  name: 'CrimeScene',
  components: { SceneIllustration },
  props: {
    // 场景位置ID
    location: {
      type: String,
      required: true,
    }
  },
  template: `
    <div class="section animate-fade-in">
      <scene-illustration :location="location"></scene-illustration>
      <h2 class="scene-title">{{ sceneName }}</h2>

      <!-- 消息显示区 -->
      <div class="message-box" v-if="gameState.message">{{ gameState.message }}</div>

      <!-- 线索按钮网格 -->
      <div class="evidence-grid">
        <button
          v-for="ev in sceneEvidences"
          :key="ev.id"
          class="btn"
          :class="isFound(ev.id) ? 'btn-found' : ''"
          @click="investigate(ev.id)"
        >
          {{ isFound(ev.id) ? '✓ ' : '' }}{{ ev.name }}
        </button>
      </div>

      <!-- 无线索提示 -->
      <p v-if="sceneEvidences.length === 0 && gameData.loaded" style="text-align:center; margin-top:20px;">
        这里暂时没有可调查的线索。
      </p>
    </div>
  `,
  setup(props) {
    // 当前场景名称
    const sceneName = computed(() => {
      const scene = gameData.scenes[props.location]
      return scene ? scene.name : props.location
    })

    // 筛选当前场景的线索
    const sceneEvidences = computed(() => {
      return Object.entries(gameData.evidences)
        .filter(([id, ev]) => ev.location === props.location)
        .map(([id, ev]) => ({ id, ...ev }))
    })

    /**
     * 检查线索是否已发现
     */
    function isFound(evId) {
      return gameState.foundEvidences.includes(evId)
    }

    /**
     * 调查线索
     */
    function investigate(evId) {
      if (!isFound(evId)) {
        playDiscovery()
      }
      investigateEvidence(evId)
    }

    return {
      gameState,
      gameData,
      sceneName,
      sceneEvidences,
      isFound,
      investigate,
    }
  }
}
