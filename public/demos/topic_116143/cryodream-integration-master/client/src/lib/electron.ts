// Electron 环境检测与 API 访问工具

/** 检测是否在 Electron 环境中运行 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electron
}

/** 获取 Electron API（如果不在 Electron 环境则返回 null） */
export const getElectronAPI = () => {
  if (!isElectron()) return null
  return window.electron!
}

/** 获取文件系统 API */
export const getFs = () => {
  return getElectronAPI()?.fs ?? null
}

/** 获取工作区 API */
export const getWorkspace = () => {
  return getElectronAPI()?.workspace ?? null
}

/** 获取应用 API */
export const getApp = () => {
  return getElectronAPI()?.app ?? null
}
