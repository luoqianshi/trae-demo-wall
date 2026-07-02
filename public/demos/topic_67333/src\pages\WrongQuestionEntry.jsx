import { useState, useRef, useContext } from 'react'
import { AppContext } from '../App'
import { generateId } from '../utils/storage'
import { generateDiagnosis, generateGuideSteps, generateVariationQuestions, generateReviewPlan } from '../utils/aiMock'
import { callDoubaoForQuestionOCR } from '../utils/doubaoOCR'
import './WrongQuestionEntry.css'

const SUBJECTS = ['数学', '物理', '化学', '生物', '英语']
const ERROR_TAGS = ['知识点不会', '审题漏条件', '公式不会选', '思路卡住', '计算错误', '看懂解析但换题不会']

export default function WrongQuestionEntry() {
  const { addWrongQuestion, navigateTo, processImageOCR, runAIDiagnosis } = useContext(AppContext)

  const [entryMode, setEntryMode] = useState('manual')
  const [isSaving, setIsSaving] = useState(false)

  // Manual entry state
  const [manualForm, setManualForm] = useState({
    subject: '数学',
    knowledgePoint: '',
    questionText: '',
    wrongAnswer: '',
    confusion: '',
    errorTags: []
  })

  // Image upload state - 支持多图
  const [imageFiles, setImageFiles] = useState([]) // { file, preview }
  const [ocrStatus, setOcrStatus] = useState('idle') // idle, loading, success, error
  const [ocrResult, setOcrResult] = useState(null)
  const [editedResult, setEditedResult] = useState(null)

  const fileInputRef = useRef(null)

  const handleImageSelect = (files) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (newFiles.length === 0) return

    const fileReaders = newFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            file,
            preview: e.target.result
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(fileReaders).then(results => {
      setImageFiles(prev => [...prev, ...results])
      setOcrStatus('idle')
      setOcrResult(null)
      setEditedResult(null)
    })
  }

  const handleAddMoreImages = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleImageSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleFileChange = (e) => {
    handleImageSelect(e.target.files)
    e.target.value = '' // 清空以便重复选择同一文件
  }

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setOcrStatus('idle')
    setOcrResult(null)
    setEditedResult(null)
  }

  const handleClearAllImages = () => {
    setImageFiles([])
    setOcrStatus('idle')
    setOcrResult(null)
    setEditedResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOCR = async () => {
    if (imageFiles.length === 0) return

    setOcrStatus('loading')
    try {
      const files = imageFiles.map(img => img.file)
      const result = await callDoubaoForQuestionOCR(files)
      setOcrResult(result)
      setEditedResult({ ...result })
      setOcrStatus('success')
    } catch (error) {
      console.error('OCR failed:', error)
      setOcrStatus('error')
    }
  }

  const handleRetryOCR = () => {
    setOcrStatus('idle')
    setOcrResult(null)
    setEditedResult(null)
  }

  const handleConfirmEntry = () => {
    const data = editedResult || manualForm

    if (!data.questionText || data.questionText.trim() === '') {
      alert('题目内容不能为空，请修改后再确认录入。')
      return
    }

    const wrongQuestion = {
      id: generateId(),
      sourceType: entryMode === 'image' ? 'image_upload' : 'manual',
      subject: data.subject,
      knowledgePoint: data.knowledgePoint || '',
      questionText: data.questionText,
      wrongAnswer: data.wrongAnswer || '',
      confusion: data.confusion || '',
      errorTags: data.errorTags || [],
      // 保存所有图片
      imageUrls: imageFiles.map(img => img.preview),
      extractedText: ocrResult?.extractedText || null,
      extractionResult: ocrResult,
      extractionStatus: '已确认',
      confirmedAt: new Date().toISOString(),
      diagnosis: null,
      guideSteps: [],
      variationQuestions: [],
      reviewPlan: [],
      status: '未诊断',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextReviewAt: null
    }

    addWrongQuestion(wrongQuestion)

    // Reset form
    setImageFiles([])
    setOcrStatus('idle')
    setOcrResult(null)
    setEditedResult(null)
    setManualForm({
      subject: '数学',
      knowledgePoint: '',
      questionText: '',
      wrongAnswer: '',
      confusion: '',
      errorTags: []
    })

    // Navigate to detail page for AI diagnosis
    navigateTo('detail', wrongQuestion.id)
  }

  const handleSaveAndDiagnose = async () => {
    if (!manualForm.questionText || manualForm.questionText.trim() === '') {
      alert('题目内容不能为空，请修改后再确认录入。')
      return
    }

    setIsSaving(true)
    try {
      const diagnosis = generateDiagnosis(manualForm)
      const guideSteps = generateGuideSteps(manualForm, diagnosis)
      const variationQuestions = generateVariationQuestions(manualForm, diagnosis)
      const reviewPlan = generateReviewPlan(manualForm)

      const wrongQuestion = {
        id: generateId(),
        sourceType: 'manual',
        ...manualForm,
        extractionStatus: '已确认',
        confirmedAt: new Date().toISOString(),
        diagnosis,
        guideSteps,
        variationQuestions,
        reviewPlan,
        status: '已诊断',
        progress: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextReviewAt: reviewPlan.find(t => t.taskType === '3天后复测')?.reviewDate
      }

      addWrongQuestion(wrongQuestion)

      // 异步调用真实 AI 进行优化
      runAIDiagnosis(wrongQuestion)

      // Reset form
      setManualForm({
        subject: '数学',
        knowledgePoint: '',
        questionText: '',
        wrongAnswer: '',
        confusion: '',
        errorTags: []
      })

      navigateTo('detail', wrongQuestion.id)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTagToggle = (tag) => {
    setManualForm(prev => ({
      ...prev,
      errorTags: prev.errorTags.includes(tag)
        ? prev.errorTags.filter(t => t !== tag)
        : [...prev.errorTags, tag]
    }))
  }

  const handleEditedChange = (field, value) => {
    setEditedResult(prev => ({ ...prev, [field]: value }))
  }

  const handleEditedTagToggle = (tag) => {
    setEditedResult(prev => ({
      ...prev,
      errorTags: prev.errorTags.includes(tag)
        ? prev.errorTags.filter(t => t !== tag)
        : [...prev.errorTags, tag]
    }))
  }

  return (
    <div className="entry-page fade-in">
      <div className="page-header">
        <h1 className="page-title">录入新错题</h1>
        <p className="page-subtitle">选择手动录入或拍照上传</p>
      </div>

      <div className="entry-tabs">
        <button
          className={`entry-tab ${entryMode === 'manual' ? 'active' : ''}`}
          onClick={() => setEntryMode('manual')}
        >
          📝 手动录入
        </button>
        <button
          className={`entry-tab ${entryMode === 'image' ? 'active' : ''}`}
          onClick={() => setEntryMode('image')}
        >
          📷 拍照上传
        </button>
      </div>

      {entryMode === 'manual' && (
        <div className="entry-form">
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">科目</label>
              <select
                className="input"
                value={manualForm.subject}
                onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">知识点</label>
              <input
                type="text"
                className="input"
                placeholder="例如：平面向量坐标运算"
                value={manualForm.knowledgePoint}
                onChange={(e) => setManualForm({ ...manualForm, knowledgePoint: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">题目内容 *</label>
            <textarea
              className="input"
              placeholder="请输入完整的题目内容..."
              value={manualForm.questionText}
              onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">我的错误答案</label>
            <textarea
              className="input"
              placeholder="你在这道题上的错误答案..."
              value={manualForm.wrongAnswer}
              onChange={(e) => setManualForm({ ...manualForm, wrongAnswer: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">我的困惑</label>
            <textarea
              className="input"
              placeholder="你在解题过程中哪里卡住了？..."
              value={manualForm.confusion}
              onChange={(e) => setManualForm({ ...manualForm, confusion: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">错误感觉标签</label>
            <div className="checkbox-group">
              {ERROR_TAGS.map(tag => (
                <span
                  key={tag}
                  className={`checkbox-item ${manualForm.errorTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleSaveAndDiagnose}
              disabled={!manualForm.questionText || isSaving}
            >
              {isSaving ? '保存中...' : '保存并开始 AI 诊断'}
            </button>
          </div>
        </div>
      )}

      {entryMode === 'image' && (
        <div className="image-entry">
          {/* 还没有上传任何图片时 */}
          {imageFiles.length === 0 && (
            <div
              className="image-upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="image-upload-icon">📷</div>
              <p className="image-upload-text">点击上传图片或拖拽到此处</p>
              <p className="image-upload-hint">
                支持多图上传<br />
                可以分别拍「题目文字」和「图形图示」<br />
                手机端可调用相机拍照
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="file-input-hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* 已上传图片时 */}
          {imageFiles.length > 0 && (
            <div className="image-preview-wrapper">
              {/* 多图预览区 */}
              <div className="multi-image-preview">
                {imageFiles.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img.preview} alt={`图片 ${index + 1}`} />
                    <button
                      className="image-preview-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(index)
                      }}
                    >
                      ✕
                    </button>
                    {index === 0 && <span className="image-label">题目</span>}
                    {index > 0 && <span className="image-label image-label-secondary">图 {index + 1}</span>}
                  </div>
                ))}

                {/* 添加更多图片按钮 */}
                {imageFiles.length < 5 && (
                  <div
                    className="image-preview-item add-more"
                    onClick={handleAddMoreImages}
                  >
                    <div className="add-more-content">
                      <span className="add-icon">+</span>
                      <span>添加更多图片</span>
                      <span className="add-hint">最多 5 张</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="file-input-hidden"
                onChange={handleFileChange}
              />

              <div className="image-info">
                已上传 {imageFiles.length} 张图片
                {imageFiles.length >= 2 && (
                  <span className="image-tip">💡 多图会一起识别</span>
                )}
              </div>

              {ocrStatus === 'idle' && (
                <div className="ocr-action">
                  <button className="btn btn-primary btn-large" onClick={handleOCR}>
                    🤖 豆包 AI 识别错题
                  </button>
                  <button className="btn btn-secondary" onClick={handleClearAllImages}>
                    清除全部
                  </button>
                </div>
              )}

              {ocrStatus === 'loading' && (
                <div className="ocr-loading">
                  <div className="ocr-loading-spinner" />
                  <h3>正在识别题目内容...</h3>
                  <p>正在整合 {imageFiles.length} 张图片的信息</p>
                </div>
              )}

              {ocrStatus === 'error' && (
                <div className="ocr-error">
                  <p>识别失败，请重新上传图片，或改为手动录入。</p>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={handleRetryOCR}>
                      重新识别
                    </button>
                    <button className="btn btn-secondary" onClick={() => setEntryMode('manual')}>
                      改为手动录入
                    </button>
                  </div>
                </div>
              )}

              {ocrStatus === 'success' && editedResult && (
                <div className="ocr-result">
                  <div className="ocr-result-header">
                    <h3>AI 识别结果</h3>
                    <div className="ocr-confidence">
                      <span>置信度</span>
                      <div className="ocr-confidence-bar">
                        <div
                          className={`ocr-confidence-fill ${editedResult.confidence < 0.7 ? 'low' : ''}`}
                          style={{ width: `${editedResult.confidence * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(editedResult.confidence * 100)}%</span>
                    </div>
                  </div>

                  {editedResult.warnings && editedResult.warnings.length > 0 && (
                    <div className="ocr-warnings">
                      <strong>⚠️ 识别提醒：</strong>
                      {editedResult.warnings.join('；')}
                    </div>
                  )}

                  {editedResult.confidence < 0.7 && (
                    <div className="ocr-warnings low-confidence">
                      <strong>⚠️ 识别置信度较低</strong><br />
                      请认真核对题目、公式和错误答案。
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">科目</label>
                    <select
                      className="input"
                      value={editedResult.subject}
                      onChange={(e) => handleEditedChange('subject', e.target.value)}
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">知识点</label>
                    <input
                      type="text"
                      className="input"
                      value={editedResult.knowledgePoint}
                      onChange={(e) => handleEditedChange('knowledgePoint', e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">题目内容 *</label>
                    <textarea
                      className="input"
                      value={editedResult.questionText}
                      onChange={(e) => handleEditedChange('questionText', e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">我的错误答案</label>
                    <textarea
                      className="input"
                      value={editedResult.wrongAnswer}
                      onChange={(e) => handleEditedChange('wrongAnswer', e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">我的困惑</label>
                    <textarea
                      className="input"
                      value={editedResult.confusion}
                      onChange={(e) => handleEditedChange('confusion', e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">错误感觉标签</label>
                    <div className="checkbox-group">
                      {ERROR_TAGS.map(tag => (
                        <span
                          key={tag}
                          className={`checkbox-item ${editedResult.errorTags.includes(tag) ? 'selected' : ''}`}
                          onClick={() => handleEditedTagToggle(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {editedResult.extractedText && (
                    <div className="input-group">
                      <label className="input-label">AI 识别原始文本</label>
                      <div className="ocr-extracted-text">{editedResult.extractedText}</div>
                    </div>
                  )}

                  <div className="ocr-actions">
                    <button
                      className="btn btn-primary btn-large"
                      onClick={handleConfirmEntry}
                      disabled={!editedResult.questionText}
                    >
                      ✓ 确认录入
                    </button>
                    <button className="btn btn-secondary" onClick={handleRetryOCR}>
                      重新识别
                    </button>
                    <button className="btn btn-secondary" onClick={handleClearAllImages}>
                      取消录入
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
