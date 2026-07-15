/**
 * 战术分析报告组件
 * 显示后端返回的战术分析文字报告
 * @param {string} report - 报告文本
 */
function Report({ report }) {
  if (!report) {
    return (
      <div className="report-container">
        <h3 className="report-title">战术洞察</h3>
        <p className="report-empty">暂无分析报告，分析完成后将在此显示 AI 生成的战术总结</p>
      </div>
    )
  }

  // 将报告文本按段落分割
  const paragraphs = report.split('\n').filter(p => p.trim())

  return (
    <div className="report-container">
      <h3 className="report-title">战术洞察</h3>
      <div className="report-content">
        {paragraphs.map((para, index) => (
          <p key={index} className="report-paragraph">{para}</p>
        ))}
      </div>
    </div>
  )
}

export default Report
