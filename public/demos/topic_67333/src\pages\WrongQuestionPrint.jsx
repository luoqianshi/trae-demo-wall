import React, { useMemo, useRef, useContext, useState } from 'react'
import { AppContext } from '../App'
import './WrongQuestionPrint.css'

function WrongQuestionPrint() {
  const { wrongQuestions, navigateTo } = useContext(AppContext)
  const printRef = useRef(null)

  const allSubjects = useMemo(() => {
    const subjects = [...new Set(wrongQuestions.map(q => q.subject || '未分类'))]
    return subjects.sort()
  }, [wrongQuestions])

  const [selectedSubjects, setSelectedSubjects] = useState(allSubjects)

  const goBack = () => navigateTo('list')

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject)
      } else {
        return [...prev, subject]
      }
    })
  }

  const selectAll = () => setSelectedSubjects(allSubjects)
  const clearAll = () => setSelectedSubjects([])

  const filteredQuestions = useMemo(() => {
    return wrongQuestions.filter(q => selectedSubjects.includes(q.subject || '未分类'))
  }, [wrongQuestions, selectedSubjects])

  const sortedQuestions = useMemo(() => {
    return [...filteredQuestions].sort((a, b) => {
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [filteredQuestions])

  const groupedBySubject = useMemo(() => {
    const groups = {}
    sortedQuestions.forEach(q => {
      if (!groups[q.subject]) {
        groups[q.subject] = []
      }
      groups[q.subject].push(q)
    })
    return groups
  }, [sortedQuestions])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadHTML = () => {
    const printContent = printRef.current
    if (!printContent) return

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>错题本 - ${new Date().toLocaleDateString('zh-CN')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    .print-page {
      max-width: 210mm;
      margin: 0 auto;
    }
    .print-header {
      text-align: center;
      padding: 20px 0 30px;
      border-bottom: 2px solid #6366f1;
      margin-bottom: 30px;
    }
    .print-header h1 {
      font-size: 24px;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .print-header .subtitle {
      font-size: 14px;
      color: #666;
    }
    .subject-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .subject-title {
      font-size: 18px;
      color: #6366f1;
      padding: 8px 16px;
      background: linear-gradient(90deg, #eef2ff 0%, #fff 100%);
      border-left: 4px solid #6366f1;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .question-item {
      margin-bottom: 25px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .question-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #e5e7eb;
    }
    .question-num {
      font-weight: 600;
      color: #6366f1;
    }
    .question-kp {
      font-size: 13px;
      color: #6b7280;
    }
    .question-text {
      margin-bottom: 12px;
      white-space: pre-wrap;
    }
    .question-images {
      display: flex;
      gap: 10px;
      margin: 10px 0;
      flex-wrap: wrap;
    }
    .question-images img {
      max-width: 200px;
      max-height: 150px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .wrong-answer, .confusion {
      margin-top: 8px;
      font-size: 13px;
    }
    .wrong-answer .label, .confusion .label {
      color: #ef4444;
      font-weight: 600;
    }
    .answer-area {
      margin-top: 15px;
      padding: 20px 0;
      border-top: 1px dashed #d1d5db;
    }
    .answer-area .answer-label {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .answer-lines {
      height: 80px;
      background: repeating-linear-gradient(
        transparent,
        transparent 28px,
        #e5e7eb 28px,
        #e5e7eb 29px
      );
    }
    .error-tags {
      margin-top: 10px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .error-tag {
      font-size: 12px;
      padding: 2px 8px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 4px;
    }
    .print-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .print-page { padding: 15mm; }
    }
  </style>
</head>
<body>
${printContent.innerHTML}
</body>
</html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `错题本_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="print-container">
      <div className="print-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>
          ← 返回
        </button>
        <h2>错题本打印</h2>
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={handleDownloadHTML}>
            📥 下载 HTML
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ 打印
          </button>
        </div>
      </div>

      {allSubjects.length > 0 && (
        <div className="subject-filter-bar">
          <div className="filter-label">📚 选择打印科目：</div>
          <div className="subject-checkboxes">
            {allSubjects.map(subject => (
              <label key={subject} className="subject-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => toggleSubject(subject)}
                />
                <span>{subject}</span>
                <span className="subject-count">
                  ({wrongQuestions.filter(q => (q.subject || '未分类') === subject).length}题)
                </span>
              </label>
            ))}
          </div>
          <div className="filter-actions">
            <button className="btn-link" onClick={selectAll}>全选</button>
            <span className="filter-divider">|</span>
            <button className="btn-link" onClick={clearAll}>清空</button>
          </div>
        </div>
      )}

      <div className="print-info-bar">
        <span>已选 {selectedSubjects.length} / {allSubjects.length} 个科目</span>
        <span>共 {sortedQuestions.length} 道错题</span>
        <span>生成时间：{new Date().toLocaleString('zh-CN')}</span>
      </div>

      <div className="print-page" ref={printRef}>
        <div className="print-header">
          <h1>📚 我的错题本</h1>
          <p className="subtitle">
            共 {sortedQuestions.length} 道错题 · {Object.keys(groupedBySubject).length} 个科目 ·
            生成日期：{new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>

        {Object.entries(groupedBySubject).map(([subject, questions]) => (
          <div key={subject} className="subject-section">
            <div className="subject-title">
              {subject}（{questions.length} 题）
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className="question-item">
                <div className="question-meta">
                  <span className="question-num">第 {idx + 1} 题</span>
                  <span className="question-kp">📌 {q.knowledgePoint || '未标注知识点'}</span>
                </div>

                <div className="question-text">{q.questionText}</div>

                {q.imageUrls && q.imageUrls.length > 0 && (
                  <div className="question-images">
                    {q.imageUrls.map((url, i) => (
                      <img key={i} src={url} alt={`题目图 ${i + 1}`} />
                    ))}
                  </div>
                )}

                {q.wrongAnswer && (
                  <div className="wrong-answer">
                    <span className="label">❌ 我的错误答案：</span>
                    {q.wrongAnswer}
                  </div>
                )}

                {q.confusion && (
                  <div className="confusion">
                    <span className="label">❓ 我的困惑：</span>
                    {q.confusion}
                  </div>
                )}

                {q.errorTags && q.errorTags.length > 0 && (
                  <div className="error-tags">
                    {q.errorTags.map((tag, i) => (
                      <span key={i} className="error-tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="answer-area">
                  <div className="answer-label">✏️ 订正区域（正确答案 & 解题过程）</div>
                  <div className="answer-lines"></div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {sortedQuestions.length === 0 && (
          <div className="empty-print">
            <p>还没有错题，快去录入吧！</p>
          </div>
        )}

        <div className="print-footer">
          由「高中生的 AI 学习陪跑教练」生成 · 每天消灭一道错题，成绩稳步提升 💪
        </div>
      </div>
    </div>
  )
}

export default WrongQuestionPrint
