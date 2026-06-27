import { useState, useEffect, useCallback } from 'react'

function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!isElectron()) return
    document.body.classList.add('electron-app')
    window.electronAPI.winIsMaximized().then(setIsMaximized)
  }, [])

  const handleMinimize = useCallback(() => {
    window.electronAPI?.winMinimize()
  }, [])

  const handleMaximize = useCallback(() => {
    window.electronAPI?.winMaximize()
    setIsMaximized((prev) => !prev)
  }, [])

  const handleClose = useCallback(() => {
    window.electronAPI?.winClose()
  }, [])

  if (!isElectron()) return null

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region" />
      <div className="title-bar-controls">
        <button
          className="traffic-light traffic-close"
          onClick={handleClose}
          title="关闭"
          aria-label="关闭"
        />
        <button
          className="traffic-light traffic-minimize"
          onClick={handleMinimize}
          title="最小化"
          aria-label="最小化"
        />
        <button
          className="traffic-light traffic-maximize"
          onClick={handleMaximize}
          title={isMaximized ? '还原' : '最大化'}
          aria-label={isMaximized ? '还原' : '最大化'}
        />
      </div>
    </div>
  )
}