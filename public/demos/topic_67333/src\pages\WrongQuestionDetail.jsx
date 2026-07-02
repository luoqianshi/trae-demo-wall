import { useState, useContext } from 'react'
import { AppContext } from '../App'
import { formatDate, formatDateTime, generateId } from '../utils/storage'
import { generateDiagnosis, generateGuideSteps, generateVariationQuestions, generateReviewPlan } from '../utils/aiMock'
import { callDoubaoForGrading, callDoubaoForHandwritingOCR } from '../utils/doubaoOCR'
import './WrongQuestionDetail.css'

export default function WrongQuestionDetail() {
  const {
    selectedQuestion,
    wrongQuestions,
    navigateTo,
    addWrongQuestion,
    updateWrongQuestion,
    deleteWrongQuestion,
    advanceStatus,
    toggleVariationStatus,
    runAIDiagnosis,
    regenerateVariations
  } = useContext(AppContext)

  const question = wrongQuestions.find(q => q.id === selectedQuestion?.id) || selectedQuestion || wrongQuestions[0]
  const [currentGuideStep, setCurrentGuideStep] = useState(0)
  const [expandedVariations, setExpandedVariations] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState({})
  const [gradingResults, setGradingResults] = useState({})
  const [isGrading, setIsGrading] = useState({})
  const [addedToWrongBook, setAddedToWrongBook] = useState({})
  const [answerImages, setAnswerImages] = useState({})
  const [isRecognizing, setIsRecognizing] = useState({})
  const [lightboxImage, setLightboxImage] = useState(null)

  if (!question) {
    return (
      <div className="detail-page">
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>请选择一道错题</h3>
          <p>点击「错题生命线」查看所有错题</p>
        </div>
      </div>
    )
  }

  const handleStartDiagnosis = async () => {
    setIsDiagnosing(true)
    try {
      await runAIDiagnosis(question)
      setCurrentGuideStep(0)
    } finally {
      setIsDiagnosing(false)
    }
  }

  const handleShowNextStep = () => {
    if (currentGuideStep < (question.guideSteps?.length || 0) - 1) {
      setCurrentGuideStep(prev => prev + 1)
    }
  }

  const handleStartTraining = () => {
    updateWrongQuestion(question.id, {
      status: '变式训练中',
      progress: 60
    })
  }

  const handleMarkMastered = () => {
    updateWrongQuestion(question.id, {
      status: '已掌握',
      progress: 100
    })
  }

  const handleRegenerateVariations = async () => {
    setIsRegenerating(true)
    try {
      await regenerateVariations(question.id)
      setExpandedVariations({})
      setStudentAnswers({})
      setGradingResults({})
      setIsGrading({})
      setAddedToWrongBook({})
      // 清理图片预览
      Object.values(answerImages).forEach(url => URL.revokeObjectURL(url))
      setAnswerImages({})
      setIsRecognizing({})
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleStudentAnswerChange = (variationId, value) => {
    setStudentAnswers(prev => ({
      ...prev,
      [variationId]: value
    }))
  }

  const handleSubmitAnswer = async (variation) => {
    const studentAnswer = studentAnswers[variation.id] || ''
    if (!studentAnswer.trim()) {
      alert('请先输入你的答案或解题过程')
      return
    }

    setIsGrading(prev => ({ ...prev, [variation.id]: true }))

    try {
      const result = await callDoubaoForGrading(
        variation.question,
        studentAnswer,
        variation.answer,
        variation.explanation
      )

      if (result) {
        setGradingResults(prev => ({
          ...prev,
          [variation.id]: result
        }))

        const updatedVariations = question.variationQuestions.map(v => {
          if (v.id === variation.id) {
            return {
              ...v,
              userStatus: result.isCorrect ? '会做' : '还不会',
              studentAnswer: studentAnswer,
              gradingResult: result
            }
          }
          return v
        })
        updateWrongQuestion(question.id, { variationQuestions: updatedVariations })
      } else {
        // 降级：简单判断
        const isCorrect = studentAnswer.trim().toLowerCase().includes(variation.answer.trim().toLowerCase())
        setGradingResults(prev => ({
          ...prev,
          [variation.id]: {
            isCorrect,
            score: isCorrect ? '80分' : '40分',
            feedback: isCorrect ? '做得不错！' : '再想想看',
            errorAnalysis: isCorrect ? '答案正确' : '答案不正确，请查看解析',
            correctApproach: variation.explanation,
            keyPoints: []
          }
        }))
      }
    } catch (e) {
      console.error('批改失败:', e)
      alert('批改失败，请稍后重试')
    } finally {
      setIsGrading(prev => ({ ...prev, [variation.id]: false }))
    }
  }

  const handleAddToWrongBook = (variation) => {
    const newWrongQuestion = {
      id: generateId(),
      sourceType: 'variation',
      parentQuestionId: question.id,
      subject: question.subject,
      knowledgePoint: question.knowledgePoint,
      questionText: variation.question,
      wrongAnswer: studentAnswers[variation.id] || '',
      confusion: gradingResults[variation.id]?.errorAnalysis || '',
      errorTags: ['变式训练做错'],
      imageUrl: question.imageUrl,
      extractionStatus: '已确认',
      confirmedAt: new Date().toISOString(),
      status: '未诊断',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addWrongQuestion(newWrongQuestion)
    setAddedToWrongBook(prev => ({ ...prev, [variation.id]: true }))
    alert('已加入错题本！可以去错题生命线查看')
  }

  const handleAnswerImageUpload = async (variationId, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setAnswerImages(prev => ({ ...prev, [variationId]: imageUrl }))
    setIsRecognizing(prev => ({ ...prev, [variationId]: true }))

    try {
      const recognizedText = await callDoubaoForHandwritingOCR(file)
      if (recognizedText && !recognizedText.includes('无法识别')) {
        setStudentAnswers(prev => ({
          ...prev,
          [variationId]: (prev[variationId] ? prev[variationId] + '\n\n' : '') + recognizedText
        }))
      } else {
        alert('识别失败，请手动输入解题过程')
      }
    } catch (err) {
      console.error('识别失败:', err)
      alert('识别失败，请手动输入解题过程')
    } finally {
      setIsRecognizing(prev => ({ ...prev, [variationId]: false }))
    }
  }

  const handleRemoveAnswerImage = (variationId) => {
    setAnswerImages(prev => {
      const newImages = { ...prev }
      if (newImages[variationId]) {
        URL.revokeObjectURL(newImages[variationId])
        delete newImages[variationId]
      }
      return newImages
    })
  }

  const handleDelete = () => {
    deleteWrongQuestion(question.id)
    navigateTo('list')
  }

  const toggleVariation = (id) => {
    setExpandedVariations(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleVariationStatus = (variationId, isCorrect) => {
    toggleVariationStatus(question.id, variationId, isCorrect)
  }

  const getStatusClass = (status) => {
    const map = {
      '未诊断': 'status-unconfirmed',
      '已诊断': 'status-diagnosed',
      '引导中': 'status-guiding',
      '变式训练中': 'status-training',
      '待复测': 'status-review',
      '已掌握': 'status-mastered'
    }
    return map[status] || 'status-unconfirmed'
  }

  return (
    <div className="detail-page fade-in">
      <div className="detail-header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="question-card-subject">{question.subject}</span>
            <span className={`question-card-status ${getStatusClass(question.status)}`}>
              {question.status}
            </span>
          </div>
          <h1 className="page-title">错题详情</h1>
          <div className="detail-meta">
            <span>知识点：{question.knowledgePoint || '未指定'}</span>
            <span>录入时间：{formatDateTime(question.createdAt)}</span>
          </div>
        </div>
        <div className="detail-progress">
          <div className="progress-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${question.progress || 0}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{question.progress || 0}%</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">📝 题目内容</h3>
        <div className="detail-content question">{question.questionText}</div>
      </div>

      {/* 错题图片/图形 - 支持多图 */}
      {(question.imageUrls?.length > 0 || question.imagePreviewUrl) && (
        <div className="detail-section">
          <h3 className="detail-section-title">
            📐 题目图示
            {(question.imageUrls?.length > 1 || (question.imageUrls?.length === 0 && question.imagePreviewUrl)) && (
              <span className="section-subtitle">（点击图片可放大查看）</span>
            )}
          </h3>
          <div className="detail-images-grid">
            {question.imageUrls && question.imageUrls.length > 0 ? (
              question.imageUrls.map((url, index) => (
                <div key={index} className="detail-image-item" onClick={() => setLightboxImage(url)}>
                  <img src={url} alt={`题目图片 ${index + 1}`} className="detail-image" />
                  {question.imageUrls.length > 1 && (
                    <span className="image-number">图 {index + 1}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="detail-image-item" onClick={() => setLightboxImage(question.imagePreviewUrl)}>
                <img src={question.imagePreviewUrl} alt="错题图片" className="detail-image" />
              </div>
            )}
          </div>
          <p className="image-hint-text">💡 图片中的图形、图示请对照题目文字一起看</p>
        </div>
      )}

      <div className="detail-row">
        <div className="detail-section half">
          <h3 className="detail-section-title">❌ 我的错误答案</h3>
          <div className="detail-content wrong">{question.wrongAnswer || '未填写'}</div>
        </div>
        <div className="detail-section half">
          <h3 className="detail-section-title">❓ 我的困惑</h3>
          <div className="detail-content confusion">{question.confusion || '未填写'}</div>
        </div>
      </div>

      {question.errorTags?.length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">🏷️ 错误感觉标签</h3>
          <div className="tag-list">
            {question.errorTags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {question.extractedText && (
        <div className="detail-section">
          <h3 className="detail-section-title">🔍 AI 识别原始文本</h3>
          <div className="detail-content extracted">{question.extractedText}</div>
        </div>
      )}

      {/* AI 错因诊断 */}
      <div className="detail-section">
        <h3 className="detail-section-title">🧠 AI 错因诊断</h3>
        {!question.diagnosis ? (
          <div className="empty-action">
            {isDiagnosing ? (
              <>
                <div className="ocr-loading-spinner" style={{ margin: '0 auto 16px' }} />
                <p>AI 正在分析你的错题，请稍候...</p>
              </>
            ) : (
              <>
                <p>尚未进行错因诊断</p>
                <button className="btn btn-primary" onClick={handleStartDiagnosis}>
                  开始 AI 诊断
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="diagnosis-card">
            <div className="diagnosis-item">
              <span className="diagnosis-label">错因类型</span>
              <span className="diagnosis-value">{question.diagnosis.causeType}</span>
            </div>
            <div className="diagnosis-item">
              <span className="diagnosis-label">可能原因</span>
              <ul className="diagnosis-list">
                {question.diagnosis.possibleReasons?.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
            <div className="diagnosis-item">
              <span className="diagnosis-label">复习建议</span>
              <p className="diagnosis-text">{question.diagnosis.reviewSuggestion}</p>
            </div>
            <div className="diagnosis-item">
              <span className="diagnosis-label">推荐训练</span>
              <p className="diagnosis-text">{question.diagnosis.recommendedTraining}</p>
            </div>
          </div>
        )}
      </div>

      {/* 分步引导 */}
      <div className="detail-section">
        <h3 className="detail-section-title">📖 分步引导</h3>
        {!question.guideSteps?.length ? (
          <div className="empty-action">
            <p>请先完成错因诊断</p>
          </div>
        ) : (
          <div className="guide-container">
            <div className="guide-steps">
              {question.guideSteps.slice(0, currentGuideStep + 1).map((step, index) => (
                <div key={index} className="guide-step fade-in">
                  <div className="guide-step-header">
                    <span className="guide-step-num">{index + 1}</span>
                    <span className="guide-step-title">{step.title}</span>
                  </div>
                  <div className="guide-step-content">{step.content}</div>
                </div>
              ))}
            </div>

            {currentGuideStep < question.guideSteps.length - 1 && (
              <button className="btn btn-primary" onClick={handleShowNextStep}>
                显示下一步提示
              </button>
            )}

            {currentGuideStep === question.guideSteps.length - 1 && question.status === '已诊断' && (
              <div className="guide-complete">
                <p>现在请尝试重新完成这道题</p>
                <button className="btn btn-success" onClick={handleStartTraining}>
                  我已完成订正，进入变式训练
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 变式训练 */}
      <div className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">🎯 变式训练</h3>
          {question.variationQuestions?.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRegenerateVariations}
              disabled={isRegenerating}
            >
              {isRegenerating ? '生成中...' : '🔄 换一批'}
            </button>
          )}
        </div>
        {!question.variationQuestions?.length ? (
          <div className="empty-action">
            <p>请先完成分步引导</p>
          </div>
        ) : (
          <div className="variation-list">
            {question.variationQuestions.map(v => (
              <div key={v.id} className="variation-item">
                <div
                  className="variation-header"
                  onClick={() => toggleVariation(v.id)}
                >
                  <div className="variation-info">
                    <span className={`variation-type ${v.type === '基础巩固' ? 'basic' : v.type === '方法辨析' ? 'method' : 'advanced'}`}>
                      {v.type}
                    </span>
                    <span className="variation-question-preview">
                      {v.question.length > 50 ? v.question.slice(0, 50) + '...' : v.question}
                    </span>
                  </div>
                  <div className="variation-right">
                    <span className={`variation-status ${v.userStatus === '会做' ? 'success' : v.userStatus === '还不会' ? 'danger' : ''}`}>
                      {v.userStatus}
                    </span>
                    <span className={`variation-expand ${expandedVariations[v.id] ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {expandedVariations[v.id] && (
                  <div className="variation-body">
                    <div className="variation-question">{v.question}</div>

                    {/* 图形描述（如果有） */}
                    {v.figureDescription && (
                      <div className="variation-figure">
                        <div className="variation-figure-label">📐 图形描述</div>
                        <div className="variation-figure-content">{v.figureDescription}</div>
                      </div>
                    )}

                    {/* 原题图片参考（如果有） */}
                    {(question.imageUrls?.length > 0 || question.imagePreviewUrl) && (
                      <div className="variation-original-ref">
                        <div className="variation-ref-label">
                          📎 原题图示参考
                          <span className="ref-hint">（和原题同类型，图形结构类似）</span>
                        </div>
                        <div className="variation-ref-images">
                          {(question.imageUrls && question.imageUrls.length > 0) ? (
                            question.imageUrls.slice(0, 2).map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`原题图 ${idx + 1}`}
                                className="variation-ref-image"
                                onClick={() => setLightboxImage(url)}
                              />
                            ))
                          ) : (
                            <img
                              src={question.imagePreviewUrl}
                              alt="原题图片"
                              className="variation-ref-image"
                              onClick={() => setLightboxImage(question.imagePreviewUrl)}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* 答题输入区 - 提交前显示 */}
                    {!gradingResults[v.id] && (
                      <div className="variation-answer-input">
                        <div className="variation-answer-label">✏️ 请写下你的答案或解题过程</div>

                        {/* 拍照上传按钮 */}
                        <div className="answer-upload-section">
                          <label className="btn btn-secondary btn-sm upload-btn">
                            📷 拍照上传答案
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: 'none' }}
                              onChange={(e) => handleAnswerImageUpload(v.id, e)}
                              disabled={isRecognizing[v.id]}
                            />
                          </label>
                          <span className="upload-hint">
                            {isRecognizing[v.id] ? 'AI 正在识别中...' : '拍下手写解题过程，AI 自动识别填入'}
                          </span>
                        </div>

                        {/* 图片预览 */}
                        {answerImages[v.id] && (
                          <div className="answer-image-preview">
                            <img src={answerImages[v.id]} alt="答案图片" />
                            <button
                              className="remove-image-btn"
                              onClick={() => handleRemoveAnswerImage(v.id)}
                            >
                              ×
                            </button>
                          </div>
                        )}

                        <textarea
                          className="variation-textarea"
                          placeholder="在这里写下你的解题过程和答案... 也可以点击上方拍照上传手写答案"
                          value={studentAnswers[v.id] || ''}
                          onChange={(e) => handleStudentAnswerChange(v.id, e.target.value)}
                          rows={5}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSubmitAnswer(v)}
                          disabled={isGrading[v.id]}
                        >
                          {isGrading[v.id] ? 'AI 批改中...' : '提交答案，让 AI 批改'}
                        </button>
                      </div>
                    )}

                    {/* 批改结果 - 提交后显示 */}
                    {gradingResults[v.id] && (
                      <div className={`variation-grading-result ${gradingResults[v.id].isCorrect ? 'correct' : 'wrong'}`}>
                        <div className="grading-header">
                          <span className="grading-icon">
                            {gradingResults[v.id].isCorrect ? '✅' : '❌'}
                          </span>
                          <span className="grading-title">
                            {gradingResults[v.id].isCorrect ? '答对了！太棒了 🎉' : '答错了，没关系，继续加油'}
                          </span>
                          <span className="grading-score">{gradingResults[v.id].score}</span>
                        </div>
                        <div className="grading-feedback">
                          <strong>老师评语：</strong>{gradingResults[v.id].feedback}
                        </div>
                        {gradingResults[v.id].errorAnalysis && (
                          <div className="grading-analysis">
                            <strong>📝 问题分析：</strong>
                            <p>{gradingResults[v.id].errorAnalysis}</p>
                          </div>
                        )}
                        {gradingResults[v.id].correctApproach && (
                          <div className="grading-approach">
                            <strong>💡 正确思路：</strong>
                            <p>{gradingResults[v.id].correctApproach}</p>
                          </div>
                        )}
                        {gradingResults[v.id].keyPoints && gradingResults[v.id].keyPoints.length > 0 && (
                          <div className="grading-keypoints">
                            <strong>🎯 得分点：</strong>
                            <ul>
                              {gradingResults[v.id].keyPoints.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 正确答案和解析 - 批改后显示 */}
                        <div className="variation-answer">
                          <div className="variation-answer-label">参考答案</div>
                          <div className="variation-answer-content">{v.answer}</div>
                        </div>
                        <div className="variation-explanation">
                          <div className="variation-answer-label">解析</div>
                          <div className="variation-answer-content">{v.explanation}</div>
                        </div>

                        {/* 答错了 - 加入错题本按钮 */}
                        {!gradingResults[v.id].isCorrect && (
                          <div className="variation-add-wrong">
                            {addedToWrongBook[v.id] ? (
                              <span className="already-added">✓ 已加入错题本</span>
                            ) : (
                              <button
                                className="btn btn-danger"
                                onClick={() => handleAddToWrongBook(v)}
                              >
                                📌 把这道题加入错题本
                              </button>
                            )}
                          </div>
                        )}

                        {/* 状态按钮 */}
                        <div className="variation-actions">
                          <button
                            className={`btn ${v.userStatus === '会做' ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => handleVariationStatus(v.id, true)}
                          >
                            ✓ 会做
                          </button>
                          <button
                            className={`btn ${v.userStatus === '还不会' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleVariationStatus(v.id, false)}
                          >
                            ✗ 还不会
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 复习计划 */}
      {question.reviewPlan?.length > 0 && (
        <div className="detail-section">
          <h3 className="detail-section-title">📅 复习计划</h3>
          <div className="review-plan-list">
            {question.reviewPlan.map(task => (
              <div key={task.id} className={`review-plan-item ${task.status === '已完成' ? 'completed' : ''}`}>
                <div className="review-plan-date">{task.reviewDate}</div>
                <div className="review-plan-type">{task.taskType}</div>
                <div className={`review-plan-status ${task.status === '已完成' ? 'success' : ''}`}>
                  {task.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="detail-actions">
        {question.status === '未诊断' && (
          <button
            className="btn btn-primary"
            onClick={handleStartDiagnosis}
            disabled={isDiagnosing}
          >
            {isDiagnosing ? '诊断中...' : '开始 AI 诊断'}
          </button>
        )}
        {question.status === '已诊断' && (
          <button className="btn btn-primary" onClick={() => navigateTo('detail', question.id)}>
            继续引导
          </button>
        )}
        {question.status === '变式训练中' && (
          <button className="btn btn-success" onClick={handleMarkMastered}>
            标记为已掌握
          </button>
        )}
        {question.status === '待复测' && (
          <button className="btn btn-success" onClick={handleMarkMastered}>
            确认已掌握
          </button>
        )}
        {question.status !== '已掌握' && (
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            删除该错题
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>删除后无法恢复，确定要删除这道错题吗？</p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片灯箱 - 点击放大查看 */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
            ×
          </button>
          <img src={lightboxImage} alt="放大查看" className="lightbox-image" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
