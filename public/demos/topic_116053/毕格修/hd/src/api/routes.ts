import express from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'

import { logger } from '../utils/logger.js'
import { settings } from '../config.js'
import { parseDocx } from '../core/docxParser.js'
import { DocxModifier } from '../core/docxModifier.js'
import { getTemplateRules } from '../core/templateLoader.js'
import { DeepSeekAgent } from '../core/agent.js'
import {
  ModificationItemSchema,
  ModificationPlanSchema,
  type ModificationItem,
  type ModificationPlan,
} from '../models/schemas.js'

export const router = express.Router()

// ---------- multer 配置 ----------

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fsPromises.mkdir(settings.UPLOAD_DIR, { recursive: true })
      cb(null, settings.UPLOAD_DIR)
    } catch (e) {
      cb(e as Error, settings.UPLOAD_DIR)
    }
  },
  filename: (_req, file, cb) => {
    const filename = formatTimestamp(new Date()) + '.docx'
    cb(null, filename)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

// ---------- 辅助函数 ----------

function _validateDocx(filename: string | undefined): void {
  if (!filename || !filename.toLowerCase().endsWith('.docx')) {
    const err = new Error('仅支持 .docx 格式') as Error & { status?: number }
    err.status = 400
    throw err
  }
}

function _cleanupFile(filePath: string | undefined): void {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (e) {
    logger.warn({ err: e, filePath }, '清理临时文件失败')
  }
}

// 时间戳格式 YYYYMMDD_HHMMSS
function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `upload_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

// 统一错误响应：返回 { detail }
function errorResponse(
  res: express.Response,
  status: number,
  message: string,
): express.Response {
  return res.status(status).json({ detail: message })
}

// ---------- 路由 ----------

// POST /api/analyze — 解析上传的 .docx 文档
router.post('/analyze', upload.single('file'), async (req, res) => {
  let filePath: string | undefined
  try {
    const file = req.file
    _validateDocx(file?.originalname)
    filePath = file!.path
    logger.info({ filePath }, '文件已保存')
    const documentFormat = await parseDocx(filePath)
    logger.info(
      {
        paragraphs: documentFormat.total_paragraphs,
        tables: documentFormat.total_tables,
      },
      '文档解析完成',
    )
    return res.json(documentFormat)
  } catch (e) {
    const status = (e as Error & { status?: number }).status || 500
    if (status === 500) logger.error({ err: e }, '文档解析失败')
    return errorResponse(res, status, (e as Error).message)
  } finally {
    _cleanupFile(filePath)
  }
})

// POST /api/fix — 完整格式修改流程：解析 -> 规则对比 -> 智能体分析 -> 应用修改
router.post('/fix', upload.single('file'), async (req, res) => {
  let filePath: string | undefined
  try {
    const file = req.file
    _validateDocx(file?.originalname)
    filePath = file!.path
    logger.info({ filePath }, '文件已保存')
    // 1. 解析文档
    logger.info('步骤 1/4: 解析文档格式...')
    const documentFormat = await parseDocx(filePath)
    logger.info(
      {
        paragraphs: documentFormat.total_paragraphs,
        tables: documentFormat.total_tables,
      },
      '文档解析完成',
    )

    // 2. 获取模板规则
    logger.info('步骤 2/4: 加载模板规范规则集...')
    const templateRules = await getTemplateRules()
    logger.info('模板规范规则集加载完成')

    // 3. 调用 DeepSeek 智能体分析格式
    logger.info('步骤 3/4: 调用 DeepSeek 智能体分析格式偏差...')
    let plan: ModificationPlan
    try {
      const agent = new DeepSeekAgent()
      plan = await agent.analyzeFormat(documentFormat, templateRules)
    } catch (e) {
      logger.error({ err: e }, 'DeepSeek API 调用失败')
      return errorResponse(res, 502, `DeepSeek API 调用失败: ${(e as Error).message}`)
    }
    logger.info({ totalItems: plan.total_items }, '修改方案生成完成')

    // 4. 应用修改方案
    logger.info('步骤 4/4: 应用修改方案到文档...')
    const modifier = new DocxModifier(filePath)
    const report = await modifier.applyPlan(plan)
    logger.info(
      { totalModified: report.total_modified, outputFilename: report.output_filename },
      '修改完成',
    )

    return res.json({
      report,
      plan,
      output_file: report.output_filename,
      download_url: `/api/download/${report.output_filename}`,
    })
  } catch (e) {
    const status = (e as Error & { status?: number }).status || 500
    if (status === 500) logger.error({ err: e }, '文档修改流程失败')
    return errorResponse(res, status, (e as Error).message)
  } finally {
    _cleanupFile(filePath)
  }
})

// POST /api/check — 仅检查文档格式偏差，生成修改方案但不修改文件
router.post('/check', upload.single('file'), async (req, res) => {
  let filePath: string | undefined
  try {
    const file = req.file
    _validateDocx(file?.originalname)
    filePath = file!.path
    logger.info({ filePath }, '文件已保存')
    // 1. 解析文档
    logger.info('步骤 1/3: 解析文档格式...')
    const documentFormat = await parseDocx(filePath)
    logger.info(
      {
        paragraphs: documentFormat.total_paragraphs,
        tables: documentFormat.total_tables,
      },
      '文档解析完成',
    )

    // 2. 获取模板规则
    logger.info('步骤 2/3: 加载模板规范规则集...')
    const templateRules = await getTemplateRules()
    logger.info('模板规范规则集加载完成')

    // 3. 调用 DeepSeek 智能体分析格式
    logger.info('步骤 3/3: 调用 DeepSeek 智能体分析格式偏差...')
    let plan: ModificationPlan
    try {
      const agent = new DeepSeekAgent()
      plan = await agent.analyzeFormat(documentFormat, templateRules)
    } catch (e) {
      logger.error({ err: e }, 'DeepSeek API 调用失败')
      return errorResponse(res, 502, `DeepSeek API 调用失败: ${(e as Error).message}`)
    }
    logger.info({ totalItems: plan.total_items }, '修改方案生成完成')

    return res.json({
      plan,
      document_format: documentFormat,
    })
  } catch (e) {
    const status = (e as Error & { status?: number }).status || 500
    if (status === 500) logger.error({ err: e }, '检查流程失败')
    return errorResponse(res, status, (e as Error).message)
  } finally {
    _cleanupFile(filePath)
  }
})

// POST /api/repair — 仅修复：基于检查阶段产出的修改方案，对上传文件应用修改
router.post('/repair', upload.single('file'), async (req, res) => {
  let filePath: string | undefined
  try {
    const file = req.file
    _validateDocx(file?.originalname)
    const planStr = req.body?.plan
    if (!planStr || !String(planStr).trim()) {
      return errorResponse(res, 400, '请先执行检查获取修改方案')
    }

    let planData: any
    try {
      planData = JSON.parse(String(planStr))
    } catch (e) {
      logger.error({ err: e }, '修改方案 JSON 解析失败')
      return errorResponse(res, 400, '修改方案格式无效，请重新检查')
    }

    // 构造 ModificationPlan（容错：跳过非法 item）
    const items: ModificationItem[] = []
    const rawItems = Array.isArray(planData?.items) ? planData.items : []
    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') continue
      try {
        const item = ModificationItemSchema.parse({
          target_type: raw.target_type || 'paragraph',
          target_index: parseInt(raw.target_index, 10) || 0,
          field: raw.field || '',
          current_value: raw.current_value ?? null,
          target_value: raw.target_value ?? null,
          description: raw.description ?? null,
        })
        items.push(item)
      } catch (e) {
        logger.warn({ err: e, raw }, 'item 构造失败，已跳过')
      }
    }
    const modificationPlan: ModificationPlan = ModificationPlanSchema.parse({
      items,
      summary: planData?.summary ?? null,
      total_items: items.length,
    })
    logger.info({ totalItems: modificationPlan.total_items }, '修改方案已构造')

    filePath = file!.path
    logger.info({ filePath }, '文件已保存')
    logger.info('应用修改方案到文档...')
    const modifier = new DocxModifier(filePath)
    const report = await modifier.applyPlan(modificationPlan)
    logger.info(
      { totalModified: report.total_modified, outputFilename: report.output_filename },
      '修改完成',
    )

    return res.json({
      report,
      output_file: report.output_filename,
      download_url: `/api/download/${report.output_filename}`,
    })
  } catch (e) {
    const status = (e as Error & { status?: number }).status || 500
    if (status === 500) logger.error({ err: e }, '修复流程失败')
    return errorResponse(res, status, (e as Error).message)
  } finally {
    _cleanupFile(filePath)
  }
})

// GET /api/template-rules — 返回毕业论文模板规范规则集
router.get('/template-rules', async (_req, res) => {
  const rules = await getTemplateRules()
  return res.json(rules)
})

// GET /api/download/:filename — 从 OUTPUT_DIR 下载指定文件
router.get('/download/:filename', async (req, res) => {
  // 防路径穿越：只取文件名部分
  const safeName = path.basename(req.params.filename)
  await fsPromises.mkdir(settings.OUTPUT_DIR, { recursive: true })
  const filePath = path.join(settings.OUTPUT_DIR, safeName)
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return errorResponse(res, 404, '文件不存在')
  }
  return res.download(filePath, safeName, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  })
})
