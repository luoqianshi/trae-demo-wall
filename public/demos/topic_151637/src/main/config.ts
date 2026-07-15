import { app } from 'electron'
import { join } from 'path'

const isDev = !app.isPackaged

export const PATHS = {
  samples: isDev
    ? join(process.env.APP_ROOT || process.cwd(), 'resources/samples')
    : join(process.resourcesPath, 'samples'),
  pythonHarness: isDev
    ? join(__dirname, '../../src/sandbox/python/harness.py')
    : join(process.resourcesPath, 'sandbox-python/harness.py'),
  database: join(app.getPath('userData'), 'datapilot.db'),
  logs: join(app.getPath('userData'), 'logs')
}

export const SANDBOX_CONFIG = {
  // 首次执行时可能需要等待重型库后台导入完成，给足超时
  timeout: 120_000,
  maxOutputSize: 1_000_000
}
