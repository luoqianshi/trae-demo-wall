import { useState } from 'react'
import './App.css'

const API_BASE = '/api'

function App() {
  const [step, setStep] = useState(1)
  const [candidates, setCandidates] = useState([])
  const [selectedCode, setSelectedCode] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [notFound, setNotFound] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ocrDetails, setOcrDetails] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleUploadCodeImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch(`${API_BASE}/extract-code`, {
        method: 'POST',
        body: formData
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('非JSON响应:', text)
        alert(`服务端返回错误: ${text.substring(0, 200)}`)
        return
      }

      const data = await response.json()
      setOcrDetails({
        engine: data.ocr_engine,
        fallback: data.fallback_used
      })

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates)
        setStep(2)
      } else {
        alert(data.message || '未识别到取件码，请重新上传')
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请检查后端服务是否已启动')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCode = (code) => {
    setSelectedCode(code)
    setStep(3)
  }

  const handleUploadShelfImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedCode) return

    setLoading(true)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('full_code', selectedCode.full_code)
    formData.append('short_code', selectedCode.short_code)

    try {
      const response = await fetch(`${API_BASE}/locate-code`, {
        method: 'POST',
        body: formData
      })

      const contentType = response.headers.get('content-type')

      if (contentType?.includes('image')) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setResultImage(url)
        setNotFound(null)
        setOcrDetails({
          engine: response.headers.get('x-ocr-engine'),
          fallback: response.headers.get('x-fallback-used') === 'true',
          found: true,
          targetCode: response.headers.get('x-target-code'),
          matchedText: response.headers.get('x-matched-text')
        })
        setStep(4)
      } else if (contentType?.includes('application/json')) {
          const data = await response.json()
          setNotFound(data)
          setResultImage(null)
          setOcrDetails({
            engine: data.ocr_engine,
            fallback: data.fallback_used,
            found: false,
            targetCode: data.target_code,
            rawTexts: data.ocr_raw_texts || []
          })
          setStep(4)
      } else {
        const text = await response.text()
        console.error('非预期响应:', text)
        alert(`服务端返回错误: ${text.substring(0, 200)}`)
      }
    } catch (error) {
      console.error('定位失败:', error)
      alert('定位失败，请检查后端服务是否已启动')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setStep(1)
    setCandidates([])
    setSelectedCode(null)
    setResultImage(null)
    setNotFound(null)
    setOcrDetails(null)
    setShowDetails(false)
  }

  const handleRetryLocate = () => {
    setStep(3)
    setResultImage(null)
    setNotFound(null)
    setShowDetails(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>快递取件码定位</h1>
        <p className="subtitle">快速找到你的包裹</p>
      </header>

      <main className="main">
        {step === 1 && (
          <div className="step">
            <div className="step-number">1</div>
            <h2>上传取件码截图</h2>
            <p className="description">请上传包含取件码的短信、App 或微信截图</p>
            <div className="upload-area" onClick={() => document.getElementById('code-input').click()}>
              <input
                id="code-input"
                type="file"
                accept="image/*"
                onChange={handleUploadCodeImage}
                className="file-input"
              />
              <div className="upload-icon">📷</div>
              <span>点击上传图片</span>
            </div>
            {loading && <div className="loading">识别中...</div>}
          </div>
        )}

        {step === 2 && (
          <div className="step">
            <div className="step-number">2</div>
            <h2>选择目标取件码</h2>
            <p className="description">请确认你的取件码</p>
            <div className="candidates-list">
              {candidates.map((candidate, index) => (
                <button
                  key={index}
                  className="candidate-btn"
                  onClick={() => handleSelectCode(candidate)}
                >
                  <span className="full-code">{candidate.full_code}</span>
                  <span className="short-code">{candidate.short_code}</span>
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => setStep(1)}>返回重新上传</button>
          </div>
        )}

        {step === 3 && selectedCode && (
          <div className="step">
            <div className="step-number">3</div>
            <h2>上传货架照片</h2>
            <p className="description">请拍摄目标货架格或货架层的照片</p>
            <div className="selected-code">
              <span className="label">目标取件码:</span>
              <span className="value">{selectedCode.full_code}</span>
            </div>
            <div className="upload-area" onClick={() => document.getElementById('shelf-input').click()}>
              <input
                id="shelf-input"
                type="file"
                accept="image/*"
                onChange={handleUploadShelfImage}
                className="file-input"
              />
              <div className="upload-icon">📸</div>
              <span>点击上传货架照片</span>
            </div>
            {loading && <div className="loading">定位中...</div>}
            <button className="back-btn" onClick={() => setStep(2)}>返回重新选择</button>
          </div>
        )}

        {step === 4 && (
          <div className="step">
            <div className="step-number">4</div>
            <h2>识别结果</h2>

            {resultImage && (
              <div className="result-image-container">
                <img src={resultImage} alt="标注结果" className="result-image" />
                <div className="found-badge">✓ 已找到</div>
              </div>
            )}

            {notFound && (
              <div className="not-found">
                <div className="not-found-icon">❌</div>
                <p className="not-found-message">{notFound.message}</p>
                <ul className="suggestions">
                  {notFound.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className="details-btn" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? '隐藏识别详情' : '查看识别详情'}
            </button>

            {showDetails && ocrDetails && (
              <div className="details-panel">
                <div className="detail-row">
                  <span className="detail-label">是否找到:</span>
                  <span className="detail-value">{ocrDetails.found ? '是' : '否'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">目标码:</span>
                  <span className="detail-value">{ocrDetails.targetCode}</span>
                </div>
                {ocrDetails.matchedText && (
                  <div className="detail-row">
                    <span className="detail-label">匹配文本:</span>
                    <span className="detail-value">{ocrDetails.matchedText}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">OCR引擎:</span>
                  <span className="detail-value">{ocrDetails.engine}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">是否启用备用OCR:</span>
                  <span className="detail-value">{ocrDetails.fallback ? '是' : '否'}</span>
                </div>
                {ocrDetails.rawTexts && ocrDetails.rawTexts.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">OCR识别文本:</span>
                    <div className="raw-texts">
                      {ocrDetails.rawTexts.map((text, index) => (
                        <span key={index} className="raw-text-item">{text}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="action-buttons">
              <button className="primary-btn" onClick={handleRetryLocate}>重新拍摄</button>
              <button className="secondary-btn" onClick={handleRetry}>重新开始</button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>本工具不会保存您的图片和识别记录</p>
      </footer>
    </div>
  )
}

export default App