/**
 * 2D/3D视图切换组件
 * 在2D俯视图和3D透视图之间切换
 * @param {string} view - 当前视图模式 '2d' 或 '3d'
 * @param {(view: string) => void} onChange - 视图切换回调
 */
function ViewToggle({ view, onChange }) {
  return (
    <div className="pp-view-toggle">
      <button
        className={"pp-toggle-btn" + (view === '2d' ? " active" : "")}
        onClick={() => onChange('2d')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
        2D 俯视
      </button>
      <button
        className={"pp-toggle-btn" + (view === '3d' ? " active" : "")}
        onClick={() => onChange('3d')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        3D 透视
      </button>
    </div>
  )
}

export default ViewToggle
