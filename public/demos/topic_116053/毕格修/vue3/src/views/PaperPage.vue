<template>
  <div
    class="paper-page"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <NavBar />
    <!-- Global drag overlay -->
    <div v-if="isDragOver && uploadedFiles.length > 0" class="drag-overlay">
      <div class="drag-overlay-content">
        <IconDocument :size="48" />
        <p>释放文件以上传</p>
      </div>
    </div>

    <main class="paper-main">
      <!-- Upload View (no files) -->
      <div v-if="uploadedFiles.length === 0" class="paper-upload-view">
        <h1 class="paper-title">论文格式检修</h1>
        <p class="paper-desc">上传你的毕业论文，AI 将自动检测格式问题并给出修正建议</p>

        <div
          class="upload-zone"
          :class="{ 'upload-zone--dragover': isDragOver }"
          @click="triggerUpload"
        >
          <input
            ref="fileInput"
            type="file"
            class="upload-input"
            accept=".docx,.doc,.pdf,.txt"
            @change="onFileSelect"
          />
          <div class="upload-icon">
            <IconDocument :size="48" />
          </div>
          <p class="upload-text">拖拽文件到此处，或点击上传</p>
          <p class="upload-hint">支持 .docx .doc .pdf .txt 格式，最大 50MB</p>
        </div>
      </div>

      <!-- File Management View (has files) -->
      <div v-else class="file-layout">
        <!-- Left Sidebar — flush to edge -->
        <aside class="file-sidebar">
          <div class="sidebar-header">
            <h3 class="sidebar-title">我的文件</h3>
            <button class="sidebar-add-btn" @click="triggerUploadInline">
              <IconDocument :size="14" />
              继续上传
            </button>
            <input
              ref="fileInputInline"
              type="file"
              class="upload-input"
              accept=".docx,.doc,.pdf,.txt"
              @change="onFileSelectInline"
            />
          </div>

          <div class="sidebar-list">
            <div
              v-for="file in uploadedFiles"
              :key="file.id"
              class="sidebar-item"
              :class="{ 'sidebar-item--active': selectedFileId === file.id }"
              @click="selectedFileId = file.id"
            >
              <div class="sidebar-item-icon">
                <IconDocument :size="18" />
              </div>
              <div class="sidebar-item-info">
                <span class="sidebar-item-name">{{ file.name }}</span>
                <span class="sidebar-item-meta">{{ formatSize(file.size) }}</span>
              </div>
              <button class="sidebar-item-remove" @click.stop="removeFile(file.id)" title="移除">&times;</button>
            </div>
          </div>
        </aside>

        <!-- Right Main Area -->
        <div class="file-main" v-if="selectedFile">
          <div class="file-detail-header">
            <div class="file-detail-icon">
              <IconDocument :size="24" />
            </div>
            <div class="file-detail-meta">
              <h2 class="file-detail-name">{{ selectedFile.name }}</h2>
              <span class="file-detail-info">{{ formatSize(selectedFile.size) }} · 上传时间：{{ selectedFile.uploadTime }}</span>
            </div>
            <div class="file-detail-actions">
              <button class="btn btn-primary btn-sm" @click="startCheck" :disabled="isChecking" v-if="!fileCheckResults">
                <IconAI :size="16" />
                {{ isChecking ? '检查中...' : '检查' }}
              </button>
              <button class="btn btn-outline btn-sm" @click="triggerUploadInline">
                <IconDocument :size="16" />
                上传新文件
              </button>
            </div>
          </div>

          <!-- File Content Preview -->
          <div class="preview-section" v-if="selectedFile">
            <div class="preview-toolbar">
              <div class="preview-header">
                <IconCheck :size="16" />
                <h3>文件内容预览</h3>
              </div>
              <!-- TOC toggle button for DOCX -->
              <button
                v-if="docxHeadings.length > 0 && (selectedFileExt === 'docx')"
                class="toc-toggle-btn"
                :class="{ 'toc-toggle-btn--active': tocExpanded }"
                @click="tocExpanded = !tocExpanded"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                目录
              </button>
            </div>
            <div class="preview-body">
              <!-- WPS-style TOC sidebar panel -->
              <div v-if="docxHeadings.length > 0 && tocExpanded && (selectedFileExt === 'docx')" class="toc-panel">
                <div class="toc-panel-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                  <span>文档目录</span>
                  <button class="toc-panel-close" @click="tocExpanded = false">&times;</button>
                </div>
                <div class="toc-panel-list">
                  <a
                    v-for="(heading, index) in docxHeadings"
                    :key="index"
                    class="toc-panel-item"
                    :class="{ 'toc-panel-item--active': activeHeadingIndex === index }"
                    :style="{ paddingLeft: (heading.level - 1) * 16 + 12 + 'px' }"
                    :href="'#docx-heading-' + index"
                    @click.prevent="scrollToHeading(index)"
                  >
                    <span class="toc-panel-dot" :style="{ background: heading.level === 1 ? 'var(--color-primary)' : 'var(--color-accent)' }"></span>
                    {{ heading.text }}
                  </a>
                </div>
              </div>
              <div class="preview-content" :class="{ 'preview-content--docx': selectedFileExt === 'docx', 'preview-content--with-toc': tocExpanded && docxHeadings.length > 0 && (selectedFileExt === 'docx') }" ref="previewContentRef" @scroll="onDocxScroll">
                <!-- PDF preview via iframe -->
                <iframe
                  v-if="selectedFileExt === 'pdf' && selectedPdfUrl"
                  :src="selectedPdfUrl"
                  class="preview-iframe"
                  frameborder="0"
                ></iframe>
                <!-- DOCX preview via docx-preview -->
                <div v-else-if="selectedFileExt === 'docx'" class="preview-docx" ref="docxContainer"></div>
                <!-- TXT / text preview -->
                <pre v-else-if="selectedFileContent" class="preview-text">{{ selectedFileContent }}</pre>
                <!-- Loading / placeholder -->
                <div v-else class="preview-placeholder">
                  <div class="preview-loading-spinner" v-if="selectedFile.isPreviewable && !selectedFileContent"></div>
                  <IconDocument :size="32" v-else />
                  <p>{{ previewStatusText }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Checking loading indicator -->
          <div v-if="isChecking" class="results-panel">
            <div class="results-header">
              <div class="preview-loading-spinner"></div>
              <h3 class="results-title">正在检查中</h3>
            </div>
            <p class="results-loading-text">
              AI 正在解析文档格式并对比毕业论文模板规范，通常需要 10-30 秒，请稍候...
            </p>
          </div>

          <!-- Check Results -->
          <div v-else-if="fileCheckResults" class="results-panel">
            <div class="results-header">
              <IconCheck :size="20" />
              <h3 class="results-title">格式检查结果</h3>
              <span class="results-summary">共 {{ fileCheckResults.length }} 项检查</span>
              <!-- 顶部 AI 修复按钮：检查完成即可见，无需滚动到底部 -->
              <button
                v-if="!isRepairing && !fileRepairReport && !repairError"
                class="btn btn-primary btn-sm results-header-action"
                @click="startRepair"
              >
                <IconAI :size="16" />
                AI 修复
              </button>
              <button
                v-else-if="fileRepairReport && outputFileMap[selectedFileId]"
                class="btn btn-primary btn-sm results-header-action"
                @click="downloadFixedFile"
              >
                <IconDocument :size="16" />
                下载修正文件
              </button>
            </div>

            <div v-if="checkSummary" class="results-summary-box">
              <span class="results-summary-label">检查概览：</span>
              <span class="results-summary-value">
                发现 {{ checkSummary.total }} 项格式问题
              </span>
            </div>

            <div v-if="checkError" class="results-error-box">
              <IconTools :size="16" />
              <span>{{ checkError }}</span>
            </div>

            <div class="results-list">
              <div
                v-for="(item, index) in fileCheckResults"
                :key="index"
                class="result-item"
                :class="{ 'result-item--fail': !item.pass }"
              >
                <div class="result-icon">
                  <IconCheck v-if="item.pass" :size="18" />
                  <IconTools v-else :size="18" />
                </div>
                <div class="result-content">
                  <span class="result-name">{{ item.name }}</span>
                  <span class="result-detail">{{ item.detail }}</span>
                </div>
                <span class="result-badge" :class="item.pass ? 'result-badge--pass' : 'result-badge--fail'">
                  {{ item.pass ? '通过' : '未通过' }}
                </span>
              </div>
            </div>

            <!-- 修复中加载态 -->
            <div v-if="isRepairing" class="results-actions">
              <div class="preview-loading-spinner"></div>
              <span class="repair-loading-text">AI 正在修复文档格式，请稍候...</span>
            </div>
            <!-- 修复错误 -->
            <div v-else-if="repairError" class="results-error-box">
              <IconTools :size="16" />
              <span>修复失败：{{ repairError }}</span>
              <button class="btn btn-primary btn-sm repair-retry-btn" @click="startRepair">
                <IconAI :size="16" />
                重新修复
              </button>
            </div>
            <!-- 修复完成：展示报告 + 下载按钮 -->
            <div v-else-if="fileRepairReport" class="repair-done-box">
              <div class="repair-report-summary">
                <IconCheck :size="18" />
                <span>修复完成：已修正 {{ fileRepairReport.total_modified }} 项格式问题</span>
              </div>
              <button v-if="outputFileMap[selectedFileId]" class="btn btn-primary btn-sm" @click="downloadFixedFile">
                <IconDocument :size="18" />
                下载修正文件
              </button>
            </div>
            <!-- 未修复：显示 AI 修复按钮 -->
            <div v-else class="results-actions">
              <button class="btn btn-primary btn-sm" @click="startRepair">
                <IconAI :size="18" />
                AI 修复
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import NavBar from '../components/NavBar.vue'
import IconDocument from '../components/icons/IconDocument.vue'
import IconCheck from '../components/icons/IconCheck.vue'
import IconAI from '../components/icons/IconAI.vue'
import IconTools from '../components/icons/IconTools.vue'
import { renderAsync } from 'docx-preview'
import {
  checkDocument,
  repairDocument,
  planToCheckResults,
  buildDownloadUrl,
} from '../api'

let fileIdCounter = 0

const fileInput = ref(null)
const fileInputInline = ref(null)
const docxContainer = ref(null)
const previewContentRef = ref(null)
const isDragOver = ref(false)
const uploadedFiles = ref([])
const selectedFileId = ref(null)
const allCheckResults = ref({})
const fileContents = ref({})
const pdfUrls = ref({})
const docxHeadings = ref([])
const tocExpanded = ref(false)
const activeHeadingIndex = ref(-1)
const isChecking = ref(false)
const checkError = ref(null)
const checkSummary = ref(null)
const outputFileMap = ref({})
const isRepairing = ref(false)
const allCheckPlans = ref({})
const allRepairReports = ref({})
const repairError = ref(null)

const selectedFile = computed(() =>
  uploadedFiles.value.find(f => f.id === selectedFileId.value) || null
)

const fileCheckResults = computed(() =>
  selectedFileId.value ? allCheckResults.value[selectedFileId.value] || null : null
)

const fileCheckPlan = computed(() =>
  selectedFileId.value ? allCheckPlans.value[selectedFileId.value] || null : null
)

const fileRepairReport = computed(() =>
  selectedFileId.value ? allRepairReports.value[selectedFileId.value] || null : null
)

const selectedFileContent = computed(() =>
  selectedFileId.value ? fileContents.value[selectedFileId.value] || null : null
)

const selectedFileExt = computed(() => {
  if (!selectedFile.value) return ''
  return selectedFile.value.name.split('.').pop()?.toLowerCase() || ''
})

const selectedPdfUrl = computed(() =>
  selectedFileId.value ? pdfUrls.value[selectedFileId.value] || null : null
)

const previewStatusText = computed(() => {
  if (!selectedFile.value) return ''
  const ext = selectedFileExt.value
  if (ext === 'pdf') return '正在加载 PDF 预览...'
  if (ext === 'docx') return '正在加载文档预览...'
  if (selectedFile.value.isText && !selectedFileContent.value) return '正在读取文件内容...'
  return '此文件格式暂不支持文本预览'
})

// Cleanup blob URLs on unmount
onBeforeUnmount(() => {
  Object.values(pdfUrls.value).forEach(url => URL.revokeObjectURL(url))
})

// Watch for selected file changes to read content
watch(selectedFileId, async (newId) => {
  if (!newId) return
  const file = uploadedFiles.value.find(f => f.id === newId)
  if (!file || !file.rawFile) return

  const ext = file.name.split('.').pop()?.toLowerCase()

  // Text files
  if (file.isText && !fileContents.value[newId]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      fileContents.value[newId] = e.target.result
    }
    reader.readAsText(file.rawFile)
  }

  // PDF files — create blob URL
  if (ext === 'pdf' && !pdfUrls.value[newId]) {
    pdfUrls.value[newId] = URL.createObjectURL(file.rawFile)
  }

  // DOCX files — render with docx-preview（每次切换都重新渲染，避免多文件内容叠加）
  if (ext === 'docx') {
    await nextTick()
    const container = docxContainer.value
    if (container) {
      // 清空旧内容（避免切换文件时内容叠加）并重置目录状态
      container.innerHTML = ''
      docxHeadings.value = []
      activeHeadingIndex.value = -1
      try {
        await renderAsync(file.rawFile, container, null, {
          className: 'docx-preview-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: true,
          renderHeaders: true,
          renderFooters: true,
        })

        // Extract headings for TOC navigation
        extractDocxHeadings(container)
      } catch (err) {
        console.error('DOCX render error:', err)
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-light)">文档预览加载失败，请确认文件格式正确</div>'
      }
    }
  }
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const triggerUploadInline = () => {
  fileInputInline.value?.click()
}

const onFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) addFile(file)
  e.target.value = ''
}

const onFileSelectInline = (e) => {
  const file = e.target.files[0]
  if (file) addFile(file)
  e.target.value = ''
}

const onDrop = (e) => {
  isDragOver.value = false
  const files = e.dataTransfer.files
  for (let i = 0; i < files.length; i++) {
    addFile(files[i])
  }
}

const addFile = (file) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['docx', 'doc', 'pdf', 'txt'].includes(ext)) {
    alert('仅支持 .docx、.pdf、.txt 格式')
    return
  }
  // docx-preview 只能解析 .docx（Office Open XML），旧版 .doc 是二进制 OLE 格式无法渲染
  if (ext === 'doc') {
    alert('旧版 .doc 格式不支持在线预览，请用 Word 将文件另存为 .docx 格式后重新上传')
    return
  }
  const id = ++fileIdCounter
  const now = new Date()
  const uploadTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const isText = ['txt'].includes(ext)
  const isPreviewable = ['docx', 'doc', 'pdf', 'txt'].includes(ext)
  uploadedFiles.value.push({ id, name: file.name, size: file.size, uploadTime, isText, isPreviewable, rawFile: file })
  selectedFileId.value = id

  // Read text files immediately
  if (isText) {
    const reader = new FileReader()
    reader.onload = (e) => {
      fileContents.value[id] = e.target.result
    }
    reader.readAsText(file)
  }
}

const removeFile = (id) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== id)
  delete allCheckResults.value[id]
  delete allCheckPlans.value[id]
  delete allRepairReports.value[id]
  delete fileContents.value[id]
  if (pdfUrls.value[id]) {
    URL.revokeObjectURL(pdfUrls.value[id])
    delete pdfUrls.value[id]
  }
  if (selectedFileId.value === id) {
    selectedFileId.value = uploadedFiles.value.length > 0 ? uploadedFiles.value[0].id : null
  }
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const extractDocxHeadings = (container) => {
  const headings = []
  const section = container.querySelector('.docx-wrapper') || container.querySelector('section.docx-preview-wrapper')
  if (!section) { docxHeadings.value = []; return }

  // docx-preview often renders headings as <p> with bold font
  // Check actual h1-h6 first, then fallback to bold paragraphs
  const hElements = section.querySelectorAll('h1, h2, h3, h4, h5, h6')
  hElements.forEach(h => {
    const level = parseInt(h.tagName[1])
    headings.push({ level, text: h.textContent.trim(), el: h })
  })

  if (headings.length === 0) {
    // Fallback: find paragraphs with heading-like patterns and style signals
    const paragraphs = section.querySelectorAll('p')
    paragraphs.forEach(p => {
      const text = p.textContent.trim()
      if (!text) return

      const style = window.getComputedStyle(p)
      const fontSize = parseFloat(style.fontSize) || 0
      const lineHeight = parseFloat(style.lineHeight) || 0
      const marginTop = parseFloat(style.marginTop) || 0

      // Chapter markers: 第一章、第一节 etc.
      const chapterMatch = text.match(/^[第][一二三四五六七八九十]+[章节部分篇]/)
      if (chapterMatch && text.length < 80) {
        headings.push({ level: 1, text, el: p })
        return
      }

      // Chinese numbering headings: 一、二、三、 (short, large font or distinctive spacing)
      const cnMatch = text.match(/^([一二三四五六七八九十]+)[、．.]\s*\S/)
      if (cnMatch && text.length < 80) {
        // Only count as heading if it looks heading-like (short text, larger font, or has top margin)
        if (fontSize >= 13 || marginTop >= 8 || text.length < 40) {
          headings.push({ level: 1, text, el: p })
          return
        }
      }

      // Sub-numbered headings: 1.1、1.2、2.3 etc. (section-level numbering)
      const subNumMatch = text.match(/^\d+\.\d+[、．.]?\s*\S/)
      if (subNumMatch && text.length < 80) {
        headings.push({ level: 2, text, el: p })
        return
      }

      // Arabic numbered headings: 1、2、3、 — but must be short + heading-like
      const arMatch = text.match(/^(\d+)[、．.]\s*\S/)
      if (arMatch && text.length < 50 && text.length > 3) {
        // Heading signals: larger font, different line-height, or top margin
        const isHeadingLike = fontSize > 14 || marginTop >= 10 || lineHeight < 1.6
        if (isHeadingLike) {
          headings.push({ level: 2, text, el: p })
          return
        }
      }

      // Bold paragraphs with short text (potential headings without numbering)
      if (text.length < 60 && text.length > 2 && fontSize >= 14) {
        const fontWeight = parseInt(style.fontWeight) || 0
        if (fontWeight >= 600) {
          headings.push({ level: 3, text, el: p })
          return
        }
      }
    })
  }

  // Sort by DOM position
  headings.sort((a, b) => {
    const pos = a.el.compareDocumentPosition(b.el)
    return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
  })

  // Add IDs for anchor navigation
  headings.forEach((h, i) => {
    h.el.id = 'docx-heading-' + i
    h.elIndex = i
  })

  docxHeadings.value = headings.map(({ level, text }) => ({ level, text }))
  if (headings.length > 0) tocExpanded.value = true
}

const scrollToHeading = (index) => {
  const el = document.getElementById('docx-heading-' + index)
  if (!el) return

  // Find the actual scrollable container — .preview-content (outer wrapper with overflow:auto)
  const scrollContainer = document.querySelector('.preview-content--docx') || document.querySelector('.preview-docx')
  if (!scrollContainer) return

  const containerRect = scrollContainer.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  // Calculate how much to scroll: current position relative to container + current scroll + offset
  const scrollTop = scrollContainer.scrollTop
  const offsetFromContainerTop = elRect.top - containerRect.top
  const targetScroll = scrollTop + offsetFromContainerTop - 20 // 20px padding from top

  scrollContainer.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
  activeHeadingIndex.value = index
}

const onDocxScroll = () => {
  const container = document.querySelector('.preview-content--docx') || document.querySelector('.preview-docx')
  if (!container || docxHeadings.value.length === 0) return

  const containerTop = container.getBoundingClientRect().top

  let closestIdx = -1
  let closestDist = Infinity

  for (let i = 0; i < docxHeadings.value.length; i++) {
    const el = document.getElementById('docx-heading-' + i)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const dist = Math.abs(rect.top - containerTop - 20)
    if (rect.top <= containerTop + 80 && dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  if (closestIdx !== -1) {
    activeHeadingIndex.value = closestIdx
  }
}

const startCheck = async () => {
  const file = selectedFile.value
  if (!file || !file.rawFile) return
  if (isChecking.value) return

  isChecking.value = true
  checkError.value = null
  // 清空旧检查结果与修复状态
  allCheckResults.value[selectedFileId.value] = null
  delete allCheckPlans.value[selectedFileId.value]
  delete allRepairReports.value[selectedFileId.value]
  delete outputFileMap.value[selectedFileId.value]
  repairError.value = null

  try {
    const result = await checkDocument(file.rawFile)
    const plan = result.plan
    allCheckPlans.value[selectedFileId.value] = plan
    const checkItems = planToCheckResults(plan)
    allCheckResults.value[selectedFileId.value] = checkItems
    checkSummary.value = {
      total: plan.total_items ?? 0,
      detail: plan.summary || '',
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    checkError.value = msg
    allCheckResults.value[selectedFileId.value] = [
      { name: '检查失败', detail: msg, pass: false },
    ]
  } finally {
    isChecking.value = false
  }
}

const startRepair = async () => {
  const file = selectedFile.value
  if (!file || !file.rawFile) return
  const plan = fileCheckPlan.value
  if (!plan) {
    alert('请先执行检查')
    return
  }
  if (isRepairing.value) return

  isRepairing.value = true
  repairError.value = null

  try {
    const result = await repairDocument(file.rawFile, plan)
    allRepairReports.value[selectedFileId.value] = result.report
    if (result.output_file) {
      outputFileMap.value[selectedFileId.value] = result.output_file
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    repairError.value = msg
  } finally {
    isRepairing.value = false
  }
}

const downloadFixedFile = () => {
  const filename = outputFileMap.value[selectedFileId.value]
  if (!filename) {
    alert('请先执行检查并修复')
    return
  }
  const url = buildDownloadUrl(filename)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
.paper-page {
  min-height: 100vh;
  background: var(--bg-body);
  display: flex;
  flex-direction: column;
}

.paper-main {
  flex: 1;
  padding: 0;
}

/* Global drag overlay */
.drag-overlay {
  position: fixed;
  inset: 64px 0 0 0;
  z-index: 200;
  background: rgba(59, 53, 43, 0.06);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 500;
}

/* Upload View */
.paper-upload-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  text-align: center;
}

.paper-title {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.paper-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 40px;
}

.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-xl);
  padding: 64px 24px;
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-card);
}

.upload-zone:hover,
.upload-zone--dragover {
  border-color: var(--color-accent);
  background: var(--color-primary-light);
}

.upload-input {
  display: none;
}

.upload-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  margin-bottom: 20px;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: var(--text-light);
}

/* File Layout — sidebar flush left, main fills rest */
.file-layout {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}

/* Left Sidebar */
.file-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-title {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.sidebar-add-btn {
  width: 100%;
  padding: 7px 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.sidebar-add-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-bottom: 2px;
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background: var(--color-primary-light);
}

.sidebar-item--active {
  background: var(--color-primary-light);
  border-left-color: var(--color-accent);
}

.sidebar-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
}

.sidebar-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.sidebar-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-item-meta {
  font-size: 11px;
  color: var(--text-light);
}

.sidebar-item-remove {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-light);
  border-radius: 50%;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: all var(--transition-normal);
}

.sidebar-item:hover .sidebar-item-remove {
  opacity: 1;
}

.sidebar-item-remove:hover {
  background: rgba(59, 53, 43, 0.1);
  color: var(--color-primary);
}

/* Right Main Area */
.file-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.file-detail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
}

.file-detail-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.file-detail-name {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-detail-info {
  font-size: 13px;
  color: var(--text-light);
}

.file-detail-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

/* File Content Preview */
.preview-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.preview-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

/* TOC toggle button */
.toc-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.toc-toggle-btn:hover,
.toc-toggle-btn--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

/* Preview body: TOC panel + content side by side */
.preview-body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0;
}

/* WPS-style TOC sidebar panel */
.toc-panel {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 16px;
}

.toc-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.toc-panel-close {
  margin-left: auto;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-light);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all var(--transition-normal);
}

.toc-panel-close:hover {
  background: rgba(59, 53, 43, 0.08);
  color: var(--text-primary);
}

.toc-panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.toc-panel-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 0;
  transition: all var(--transition-normal);
  line-height: 1.5;
  cursor: pointer;
  border-left: 2px solid transparent;
}

.toc-panel-item:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.toc-panel-item--active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 500;
}

.toc-panel-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

/* Preview content container */
.preview-content {
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  min-width: 0;
}

/* When TOC panel is visible, content fills remaining space */
.preview-content--with-toc {
  flex: 1;
  min-width: 0;
}

/* DOCX-specific preview: WPS-style page view */
.preview-content--docx {
  background: #e8e5de;
  overflow: auto;
  border: none;
  border-radius: 0;
  min-height: 0;
}

.preview-iframe {
  width: 100%;
  height: 600px;
  border: none;
  display: block;
}

/* DOCX container — full-width page rendering */
.preview-docx {
  overflow: visible !important;
  max-height: none !important;
  background: #e8e5de;
  padding: 32px 0 48px;
  min-height: 100%;
}

/* Override docx-preview library wrapper to WPS page style */
.preview-docx :deep(.docx-preview-wrapper-wrapper) {
  background: #e8e5de !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  width: 100% !important;
  gap: 24px;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.preview-docx :deep(.docx-preview-wrapper-wrapper > section.docx-preview-wrapper) {
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06) !important;
  margin-bottom: 0 !important;
  background: white !important;
  border-radius: 2px;
}

/* Each page section — preserve exact page dimensions from docx-preview */
.preview-docx :deep(section.docx-preview-wrapper) {
  box-sizing: border-box;
  flex-shrink: 0;
}

.preview-text {
  margin: 0;
  padding: 20px;
  font-size: 13px;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  background: #fffdf8;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--text-light);
  font-size: 14px;
}

.preview-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Results Panel */
.results-panel {
  margin-top: 24px;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.results-header svg {
  color: var(--color-accent);
}

.results-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.results-summary {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-light);
  background: var(--color-primary-light);
  padding: 3px 10px;
  border-radius: 20px;
}

.results-header-action {
  margin-left: 12px;
  flex-shrink: 0;
}

.results-loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  padding: 4px 0;
}

.results-summary-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-size: 13px;
}

.results-summary-label {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.results-summary-value {
  color: var(--text-primary);
  font-weight: 500;
}

.results-error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(232, 99, 12, 0.08);
  border: 1px solid rgba(232, 99, 12, 0.25);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--color-primary);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  transition: all var(--transition-normal);
}

.result-item:hover {
  box-shadow: var(--shadow-card-hover);
}

.result-item--fail {
  border-left: 3px solid var(--color-accent);
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.result-item:not(.result-item--fail) .result-icon {
  background: rgba(155, 150, 95, 0.12);
  color: var(--color-accent);
}

.result-item--fail .result-icon {
  background: rgba(59, 53, 43, 0.08);
  color: var(--color-primary);
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.result-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.result-detail {
  font-size: 12px;
  color: var(--text-light);
}

.result-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.result-badge--pass {
  background: rgba(155, 150, 95, 0.12);
  color: var(--color-accent);
}

.result-badge--fail {
  background: rgba(59, 53, 43, 0.08);
  color: var(--color-primary);
}

.results-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
  align-items: center;
}

.results-actions .btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.repair-loading-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.repair-done-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding: 14px 16px;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}

.repair-report-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.repair-report-summary svg {
  color: var(--color-accent);
}

.repair-done-box .btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.repair-retry-btn {
  margin-left: auto;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .file-layout {
    flex-direction: column;
    height: auto;
  }
  .file-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color-light);
    max-height: 180px;
  }
  .sidebar-list {
    display: flex;
    overflow-x: auto;
    gap: 6px;
    padding: 6px;
  }
  .sidebar-item {
    flex: 0 0 auto;
    min-width: 160px;
    border-left: none !important;
  }
  .file-main {
    padding: 16px;
  }
  .file-detail-header {
    flex-wrap: wrap;
  }
  .file-detail-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .paper-title {
    font-size: 24px;
  }
  .upload-zone {
    padding: 40px 16px;
  }
  .results-actions {
    flex-direction: column;
  }
}
</style>
