// 系统托盘管理
import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'path'

let tray: Tray | null = null

/** 创建系统托盘 */
export function createTray(mainWindow: BrowserWindow): Tray {
  // 使用 Electron 内置图标作为默认（如果没有自定义图标）
  let icon: nativeImage
  const iconPath = path.join(app.getAppPath(), 'public/images/favicon.png')
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      // 回退到一个 16x16 的空图标
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('ComfyUI Draw Flow')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show()
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.focus()
      },
    },
    {
      label: '重启后端',
      click: () => {
        mainWindow.webContents.send('backend:restart')
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        // 标记为真正退出（而非最小化到托盘）
        ;(app as unknown as { isQuitting: boolean }).isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // 双击托盘显示窗口
  tray.on('double-click', () => {
    mainWindow.show()
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  })

  return tray
}

/** 销毁托盘 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
