import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'

import { logger } from './utils/logger.js'
import { settings } from './config.js'
import { router } from './api/routes.js'

// 启动时确保上传和输出目录存在
fs.mkdirSync(settings.UPLOAD_DIR, { recursive: true })
fs.mkdirSync(settings.OUTPUT_DIR, { recursive: true })

const app = express()
const port = settings.PORT

// 中间件
app.use(
  cors({
    origin: settings.CORS_ORIGINS,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// API 路由
app.use('/api', router)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ detail: `未找到路径: ${req.method} ${req.path}` })
})

// 全局错误处理中间件
app.use(
  (
    err: Error & { status?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status = err.status || 500
    logger.error({ err, status }, '请求处理异常')
    res.status(status).json({ detail: err.message || '服务器内部错误' })
  },
)

// 启动服务
app.listen(port, () => {
  logger.info(`毕格修后端服务已启动: http://localhost:${port}`)
  logger.info({ corsOrigins: settings.CORS_ORIGINS }, 'CORS 配置')
})

export { app }
