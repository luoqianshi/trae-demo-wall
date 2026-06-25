/**
 * 恶魔的代价 - 证据板组件
 * 分三个区域：已发现线索列表、关联推理面板、指认凶手面板
 */
import { computed } from 'vue'
import { gameState, gameData } from '../store.js'
import SceneIllustration from './SceneIllustration.js'
import ConnectPanel from './ConnectPanel.js'
import AccusePanel from './AccusePanel.js'

export default {
  name: 'EvidenceBoard',
  components: { SceneIllustration, ConnectPanel, AccusePanel },
  template: `
    <div class="section animate-fade-in">
      <scene-illustration location="board"></scene-illustration>
      <h2 class="scene-title">证据板</h2>

      <!-- 消息显示区 -->
      <div class="message-box" v-if="gameState.message">{{ gameState.message }}</div>

      <div class="evidence-board">
        <!-- 区域一：已发现线索列表 -->
        <div class="card">
          <div class="section-title">已发现线索 ({{ foundList.length }})</div>
          <ul class="evidence-list" v-if="foundList.length > 0">
            <li v-for="item in foundList" :key="item.id">
              <span class="ev-name">{{ item.name }}</span>
              <span class="ev-location">{{ item.locationName }}</span>
            </li>
          </ul>
          <p v-else style="color:#666; text-align:center;">尚未发现任何线索，请先调查各场景。</p>
        </div>

        <!-- 区域二：关联推理 -->
        <div class="card">
          <div class="section-title">关联推理</div>
          <connect-panel></connect-panel>
        </div>

        <!-- 区域三：指认凶手 -->
        <div class="card">
          <div class="section-title">指认凶手</div>
          <accuse-panel></accuse-panel>
        </div>
      </div>
    </div>
  `,
  setup() {
    // 已发现线索列表（显示中文名称和位置名称）
    const foundList = computed(() => {
      return gameState.foundEvidences.map(evId => {
        const ev = gameData.evidences[evId]
        if (!ev) return { id: evId, name: evId, locationName: '未知' }
        // 获取位置中文名称
        const scene = gameData.scenes[ev.location]
        const locationName = scene ? scene.name : ev.location
        return {
          id: evId,
          name: ev.name,
          locationName: locationName,
        }
      })
    })

    return {
      gameState,
      foundList,
    }
  }
}
