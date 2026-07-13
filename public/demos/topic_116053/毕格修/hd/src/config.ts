import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'
import { z } from 'zod'

// 加载 .env 文件（若不存在则使用环境变量或默认值）
dotenv.config()

const ConfigSchema = z.object({
  DEEPSEEK_BASE_URL: z.string().default('https://api.deepseek.com'),
  DEEPSEEK_API_KEY: z
    .string()
    .default('sk-YOUR_API_KEY_HERE'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),

  PORT: z.coerce.number().int().positive().default(8000),

  CORS_ORIGINS: z.string().default('*'),

  PROJECT_ROOT: z.string().default('c:\\play_biye'),
  TEMPLATE_DIR: z
    .string()
    .default('c:\\play_biye\\2025.9.19发放毕业论文模板\\03毕业论文'),
  UPLOAD_DIR: z.string().default('c:\\play_biye\\hd\\uploads'),
  OUTPUT_DIR: z.string().default('c:\\play_biye\\hd\\outputs'),
})

const parsed = ConfigSchema.parse(process.env)

export const settings = {
  DEEPSEEK_BASE_URL: parsed.DEEPSEEK_BASE_URL,
  DEEPSEEK_API_KEY: parsed.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: parsed.DEEPSEEK_MODEL,

  PORT: parsed.PORT,

  // CORS_ORIGINS: '*' 视为允许所有来源；否则按逗号分隔为数组
  CORS_ORIGINS:
    parsed.CORS_ORIGINS.trim() === '*'
      ? (['*'] as string[])
      : parsed.CORS_ORIGINS.split(',')
          .map((s) => s.trim())
          .filter(Boolean),

  PROJECT_ROOT: parsed.PROJECT_ROOT,
  TEMPLATE_DIR: parsed.TEMPLATE_DIR,
  UPLOAD_DIR: parsed.UPLOAD_DIR,
  OUTPUT_DIR: parsed.OUTPUT_DIR,
} as const

export type Settings = typeof settings
