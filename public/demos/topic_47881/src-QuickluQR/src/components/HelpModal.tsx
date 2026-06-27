import { useEffect, useRef } from 'react'

interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div className="help-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="help-modal">
        <div className="help-modal-header">
          <h2 className="help-modal-title">帮助文档</h2>
          <button className="help-modal-close" onClick={onClose} title="关闭">
            ×
          </button>
        </div>
        <div className="help-modal-body">
          <section className="help-section">
            <h3 className="help-section-title">📖 简介</h3>
            <p className="help-text">
              QuicklyQR 是一个快速生成二维码的工具，支持文本和网址转换。您可以生成二维码后复制图像或直接下载为 PNG 格式。
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">🚀 快速开始</h3>
            <ol className="help-list">
              <li className="help-list-item">
                <span className="help-step">在输入框中输入文本或网址</span>
                <span className="help-desc">支持任意文字内容，包括中文、英文、数字等</span>
              </li>
              <li className="help-list-item">
                <span className="help-step">选择纠错等级</span>
                <span className="help-desc">L/M/Q/H 四个等级，等级越高纠错能力越强，但容量越小</span>
              </li>
              <li className="help-list-item">
                <span className="help-step">点击「生成二维码」或按 Ctrl/Cmd + Enter</span>
                <span className="help-desc">快捷键可快速生成，无需鼠标操作</span>
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">⚙️ 功能说明</h3>
            
            <h4 className="help-subtitle">纠错等级</h4>
            <table className="help-table">
              <thead>
                <tr>
                  <th className="help-th">等级</th>
                  <th className="help-th">纠错能力</th>
                  <th className="help-th">最大容量（字节）</th>
                  <th className="help-th">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="help-td">L</td>
                  <td className="help-td">~7%</td>
                  <td className="help-td">2,900</td>
                  <td className="help-td">最小容量，适合短内容</td>
                </tr>
                <tr>
                  <td className="help-td">M</td>
                  <td className="help-td">~15%</td>
                  <td className="help-td">2,280</td>
                  <td className="help-td">默认等级，平衡容量与纠错</td>
                </tr>
                <tr>
                  <td className="help-td">Q</td>
                  <td className="help-td">~25%</td>
                  <td className="help-td">1,620</td>
                  <td className="help-td">高纠错，适合需要较高识别率的场景</td>
                </tr>
                <tr>
                  <td className="help-td">H</td>
                  <td className="help-td">~30%</td>
                  <td className="help-td">1,240</td>
                  <td className="help-td">最高纠错，容量最小</td>
                </tr>
              </tbody>
            </table>

            <h4 className="help-subtitle">白色背景</h4>
            <p className="help-text">
              开启后二维码将显示白色背景，关闭则为透明背景（显示棋盘格图案）。透明背景适合叠加在其他图片上使用，但可能影响部分扫码设备的识别率。
            </p>

            <h4 className="help-subtitle">折叠多余空白</h4>
            <p className="help-text">
              开启后会压缩输入内容中的连续空格和换行符为单个空格，减少二维码容量占用。
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">💾 导出与分享</h3>
            <ul className="help-list">
              <li className="help-list-item">
                <span className="help-action">📋 复制图像</span>
                <span className="help-desc">将二维码 PNG 图像复制到剪贴板，可直接粘贴到微信、QQ 等应用</span>
              </li>
              <li className="help-list-item">
                <span className="help-action">⬇️ 下载 PNG</span>
                <span className="help-desc">将二维码保存为 PNG 文件到本地</span>
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">📜 历史记录</h3>
            <ul className="help-list">
              <li className="help-list-item">
                <span className="help-step">自动生成</span>
                <span className="help-desc">每次生成二维码后，系统会自动保存配置信息到历史记录</span>
              </li>
              <li className="help-list-item">
                <span className="help-step">搜索功能</span>
                <span className="help-desc">可通过关键词搜索历史记录，匹配内容会高亮显示</span>
              </li>
              <li className="help-list-item">
                <span className="help-step">快速恢复</span>
                <span className="help-desc">点击历史记录项可恢复配置并重新生成二维码</span>
              </li>
              <li className="help-list-item">
                <span className="help-step">管理记录</span>
                <span className="help-desc">可删除单条记录或清空全部历史</span>
              </li>
            </ul>
            <p className="help-text help-note">
              💡 数据存储：Electron 桌面模式下存储在本地文件系统中；Web 模式下存储在浏览器 localStorage 中，最多保留 1000 条记录。
            </p>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">❓ 常见问题</h3>
            
            <div className="help-faq">
              <h4 className="help-faq-question">生成的二维码无法扫描？</h4>
              <p className="help-faq-answer">
                可能原因：① 内容过长超出容量限制；② 二维码尺寸过小；③ 透明背景下对比度不足。建议尝试降低纠错等级、增加二维码尺寸或开启白色背景。
              </p>
            </div>

            <div className="help-faq">
              <h4 className="help-faq-question">为什么有些内容生成失败？</h4>
              <p className="help-faq-answer">
                二维码有容量限制，超出当前纠错等级的最大字节数时会提示错误。您可以：① 缩短内容；② 降低纠错等级（如从 M 改为 L）以获得更大容量。
              </p>
            </div>

            <div className="help-faq">
              <h4 className="help-faq-question">容量进度条颜色含义？</h4>
              <p className="help-faq-answer">
                🟢 绿色：容量充足；🟡 黄色：接近上限（建议使用 L 等级）；🔴 红色：超出限制，无法生成。
              </p>
            </div>
          </section>

          <section className="help-section">
            <h3 className="help-section-title">⌨️ 快捷键</h3>
            <table className="help-table help-table-sm">
              <thead>
                <tr>
                  <th className="help-th">快捷键</th>
                  <th className="help-th">功能</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="help-td"><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td>
                  <td className="help-td">快速生成二维码（Mac: Cmd + Enter）</td>
                </tr>
                <tr>
                  <td className="help-td"><kbd>Esc</kbd></td>
                  <td className="help-td">关闭帮助文档</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  )
}
