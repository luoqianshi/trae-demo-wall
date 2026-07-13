/// <reference types="vite/client" />

// 统一日志封装：禁止业务代码直接使用 console，统一通过本模块输出.
// 开发环境输出到控制台；生产环境可在此对接日志上报服务（如 Sentry / 自建上报 SDK）。
// 注：本模块内部使用 console 是封装实现细节，业务代码仍应使用 logger。

// 是否为开发环境；生产环境关闭控制台输出
const isDev = import.meta.env.DEV

const info = (...args: unknown[]): void => {
  if (isDev) {
    console.info('[INFO]', ...args)
  }
  // 生产环境可在此对接日志上报服务
}

const warn = (...args: unknown[]): void => {
  if (isDev) {
    console.warn('[WARN]', ...args)
  }
  // 生产环境可在此对接日志上报服务
}

const error = (...args: unknown[]): void => {
  if (isDev) {
    console.error('[ERROR]', ...args)
  }
  // 生产环境：建议上报到日志服务以便排查
}

export default { info, warn, error }
