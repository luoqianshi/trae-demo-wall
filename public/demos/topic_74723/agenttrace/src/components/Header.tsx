export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h1>AgentTrace</h1>
        </div>
        <p className="tagline">让 AI Agent 的每一次工作都有迹可循</p>
        <p className="subtitle">把零散 AI 工作记录转化为项目日志、问题知识库和成本分析报告</p>
        <div className="feature-badges">
          <span className="feature-badge">📊 智能复盘</span>
          <span className="feature-badge">⚠️ 问题识别</span>
          <span className="feature-badge">💰 成本分析</span>
          <span className="feature-badge">📥 一键导出</span>
          <span className="feature-badge">💾 本地存储</span>
        </div>
      </div>
    </header>
  );
}
