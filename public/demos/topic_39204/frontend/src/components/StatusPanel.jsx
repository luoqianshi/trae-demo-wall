const connectionLabels = {
  connected: "已连接",
  connecting: "连接中",
  disconnected: "已断开",
};

const pipelineLabels = {
  idle: "待命",
  running: "翻译中",
  stopped: "已停止",
};

export function StatusPanel({ connectionState, pipelineState, lastError, endpoint }) {
  return (
    <section className="panel status-panel">
      <div className="section-head">
        <h2>运行状态</h2>
        <span className={`badge badge-${connectionState}`}>
          {connectionLabels[connectionState] || connectionState}
        </span>
      </div>
      <div className="status-grid">
        <article className="metric-card">
          <span>连接链路</span>
          <strong>{connectionLabels[connectionState] || connectionState}</strong>
          <small>{endpoint}</small>
        </article>
        <article className="metric-card">
          <span>翻译管道</span>
          <strong>{pipelineLabels[pipelineState] || pipelineState}</strong>
          <small>启动后会持续接收流式字幕</small>
        </article>
        <article className="metric-card">
          <span>接入方式</span>
          <strong>App 只连你的服务端</strong>
          <small>第三方接口放到香港机房侧处理</small>
        </article>
      </div>
      {lastError ? <p className="error-text">{lastError}</p> : null}
    </section>
  );
}
