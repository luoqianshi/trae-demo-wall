<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/store/archiveStore'
import { useUiStore } from '@/store/uiStore'
import { mockOcrText, mockDocuments } from '@/mock/data'
import { docTypeIcon, docTypeClass } from '@/utils/format'

// 文档柜：分类筛选 + 列表 + OCR 识别模拟
const router = useRouter()
const archiveStore = useArchiveStore()
const uiStore = useUiStore()

const activeType = ref('all')
const ocrLoading = ref({}) // { [id]: boolean }

// 类型筛选项：从数据中提取所有类型 + "全部"
const types = computed(() => {
  const set = new Set(archiveStore.documents.map((d) => d.docType))
  return ['all', ...Array.from(set)]
})

// 过滤后的文档
const filteredDocs = computed(() => {
  if (activeType.value === 'all') return archiveStore.documents
  return archiveStore.documents.filter((d) => d.docType === activeType.value)
})

onMounted(async () => {
  if (!archiveStore.documents.length) {
    await archiveStore.fetchDocuments()
  }
})

// 切换类型
const setType = (t) => {
  activeType.value = t
}

// 类型计数
const typeCount = (t) => {
  if (t === 'all') return archiveStore.documents.length
  return archiveStore.documents.filter((d) => d.docType === t).length
}

// OCR 识别
const runOcr = (doc) => {
  if (doc.ocrText) return
  ocrLoading.value[doc.id] = true
  uiStore.showToast('正在识别"' + doc.title + '"…')
  setTimeout(() => {
    const text = mockOcrText[doc.docType] || '识别完成'
    archiveStore.updateDocument(doc.id, { ocrText: text })
    ocrLoading.value[doc.id] = false
    uiStore.showToast('OCR 识别完成')
  }, 1600)
}

const back = () => router.push('/archive')
</script>

<template>
  <div class="page">
    <div class="page-head">
      <button class="back-btn" @click="back">
        <AppIcon icon="lucide:arrow-left" :size="16" />
        返回档案
      </button>
      <div class="section-eyebrow">文档柜</div>
      <h2 class="section-title">家族里的纸与字</h2>
      <p class="section-sub">地契、家谱、奖状、书信……这些泛黄的纸张，承载着家族的历史。</p>
    </div>

    <!-- 类型筛选 -->
    <div class="doc-toolbar">
      <button
        v-for="t in types"
        :key="t"
        class="doc-filter"
        :class="{ active: activeType === t }"
        @click="setType(t)"
      >
        {{ t === 'all' ? '全部' : t }}
        <span class="count">{{ typeCount(t) }}</span>
      </button>
    </div>

    <!-- 文档列表 -->
    <div class="doc-list">
      <div class="doc-card" v-for="d in filteredDocs" :key="d.id">
        <div class="doc-thumb" :class="docTypeClass(d.docType)">
          <AppIcon :icon="docTypeIcon(d.docType)" :size="30" />
        </div>
        <div class="doc-info">
          <div class="type">{{ d.docType }}</div>
          <h5>{{ d.title }}</h5>
          <p class="meta">
            <AppIcon icon="lucide:calendar" :size="13" />
            {{ d.docYear }} 年
          </p>
          <p>{{ d.description }}</p>
          <button
            class="ocr-btn"
            v-if="!d.ocrText"
            :disabled="ocrLoading[d.id]"
            @click="runOcr(d)"
          >
            <AppIcon :icon="ocrLoading[d.id] ? 'lucide:loader-circle' : 'lucide:scan-text'" :size="13" />
            {{ ocrLoading[d.id] ? '识别中…' : 'OCR 识别' }}
          </button>
          <div class="ocr-result" v-else>
            <div class="ocr-title">
              <AppIcon icon="lucide:check-circle-2" :size="13" />
              识别文本
            </div>
            <p>{{ d.ocrText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 30px;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 14px;
  margin-bottom: 14px;
  padding: 0;
  transition: color var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  color: var(--seal);
}

.doc-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.doc-filter {
  padding: 8px 18px;
  border-radius: 30px;
  border: 1.5px solid rgba(139, 107, 80, 0.25);
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 13px;
  transition: all 0.25s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.doc-filter:hover {
  border-color: var(--primary);
  color: var(--primary-deep);
}

.doc-filter.active {
  background: var(--primary);
  color: var(--bg-warm);
  border-color: var(--primary);
}

.doc-filter .count {
  background: rgba(139, 107, 80, 0.15);
  color: var(--primary-deep);
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
}

.doc-filter.active .count {
  background: rgba(255, 255, 255, 0.25);
  color: var(--bg-warm);
}

.doc-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.doc-card {
  background: var(--bg-warm);
  border-radius: var(--radius);
  padding: 22px;
  display: flex;
  gap: 18px;
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  border: 1px solid rgba(139, 107, 80, 0.1);
  transition: all var(--transition);
}

.doc-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lift);
}

.doc-thumb {
  width: 70px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(139, 107, 80, 0.2);
}

.doc-thumb.deed { background: linear-gradient(135deg, var(--earth-soft), var(--gold)); color: var(--text-deep); }
.doc-thumb.genealogy { background: linear-gradient(135deg, #9bb5a3, var(--moss)); color: var(--bg-warm); }
.doc-thumb.award { background: linear-gradient(135deg, var(--primary-light), var(--seal)); color: var(--bg-warm); }
.doc-thumb.letter { background: linear-gradient(135deg, var(--bg-warm), #cdb892); color: var(--primary-deep); }
.doc-thumb.default { background: linear-gradient(135deg, var(--bg-warm), var(--bg-deep)); color: var(--primary-deep); }

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-info .type {
  font-size: 11px;
  color: var(--seal);
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.doc-info h5 {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 6px;
}

.doc-info .meta {
  font-size: 12px;
  color: var(--text-soft);
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.doc-info p {
  font-size: 13px;
  color: var(--text-light);
  line-height: 1.5;
  margin-bottom: 8px;
}

.ocr-btn {
  font-size: 12px;
  color: var(--moss-deep);
  background: rgba(90, 122, 107, 0.12);
  border: none;
  padding: 6px 14px;
  border-radius: 14px;
  cursor: pointer;
  font-family: var(--font-serif);
  transition: all var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.ocr-btn:hover:not(:disabled) {
  background: rgba(90, 122, 107, 0.25);
}

.ocr-btn:disabled {
  opacity: 0.7;
  cursor: progress;
}

.ocr-result {
  margin-top: 10px;
  padding: 12px;
  background: rgba(90, 122, 107, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: var(--moss-deep);
  line-height: 1.6;
  border-left: 2px solid var(--moss);
}

.ocr-title {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

@media (max-width: 768px) {
  .doc-list {
    grid-template-columns: 1fr;
  }
}
</style>
