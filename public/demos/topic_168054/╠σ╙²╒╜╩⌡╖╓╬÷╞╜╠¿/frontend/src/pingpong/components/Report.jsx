/**
 * 战术分析报告组件
 * 显示后端返回的战术分析文字报告
 * @param {string} report - 报告文本
 */
function Report({ report }) {
  if (!report) {
    return (
      <div className="pp-report-container">
        <h3 className="pp-report-title">战术分析报告</h3>
        <p className="pp-report-empty">暂无分析报告</p>
      </div>
    )
  }

  // 将报告文本按段落分割
  const paragraphs = report.split('\n').filter(p => p.trim())

  return (
    <div className="pp-report-container">
      <h3 className="pp-report-title">战术分析报告</h3>
      <div className="pp-report-content">
        {paragraphs.map((para, index) => (
          <p key={index} className="pp-report-paragraph">{para}</p>
        ))}
      </div>
    </div>
  )
}

export default Report
