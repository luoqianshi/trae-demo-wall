import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import aiRoutes from './routes/ai.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 章节配置
const chapters = [
  { id: 'skill', title: 'EQagent 简介', category: '首页', path: 'skill.md' },
  { id: 'ch01', title: '推脱者识别', category: '职场识人', path: 'ch01-gongshibangong.md' },
  { id: 'ch02', title: '伪君子识别', category: '职场识人', path: 'ch02-jiangdadaoli.md' },
  { id: 'ch03', title: '标榜者识别', category: '职场识人', path: 'ch03-daodejiepi.md' },
  { id: 'ch04', title: '畏祸者识别', category: '职场识人', path: 'ch04-shenseweinan.md' },
  { id: 'ch05', title: '投机者识别', category: '职场识人', path: 'ch05-xuanshixiao.md' },
  { id: 'ch06', title: '鹰派鸽派', category: '人格与情绪', path: 'ch06-yingge.md' },
  { id: 'ch07', title: '嫉妒管理', category: '人格与情绪', path: 'ch07-jidu.md' },
  { id: 'ch08', title: '害羞克服', category: '人格与情绪', path: 'ch08-haixiu.md' },
  { id: 'ch09', title: '婆媳关系', category: '家庭关系', path: 'ch09-poxi.md' },
  { id: 'ch10', title: '夫妻关系', category: '家庭关系', path: 'ch10-fuqi.md' },
  { id: 'ch11', title: '兄弟姐妹', category: '家庭关系', path: 'ch11-xiongdi.md' },
  { id: 'ch12', title: '校园欺凌', category: '校园关系', path: 'ch12-bully.md' },
  { id: 'ch13', title: '宿舍关系', category: '校园关系', path: 'ch13-sushe.md' },
  { id: 'ch14', title: '师生关系', category: '校园关系', path: 'ch14-shisheng.md' },
  { id: 'ch15', title: '体制生存', category: '体制内', path: 'ch15-tizhi.md' },
  { id: 'ch16', title: '上下级关系', category: '体制内', path: 'ch16-guanxi.md' },
  { id: 'ch17', title: '谈钱策略', category: '体制内', path: 'ch17-tanqian.md' },
  { id: 'ch18', title: '提升职', category: '体制内', path: 'ch18-shengzhi.md' },
  { id: 'glossary', title: '术语表', category: '附录', path: 'glossary.md' },
  { id: 'cheatsheet', title: '速查表', category: '附录', path: 'cheatsheet.md' },
]

/**
 * API Routes
 */
app.use('/api/ai', aiRoutes)

/**
 * 获取章节列表
 */
app.get('/api/chapters', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    chapters: chapters,
  })
})

/**
 * 获取章节内容
 */
app.get('/api/chapters/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const chapter = chapters.find(c => c.id === id)

  if (!chapter) {
    res.status(404).json({
      success: false,
      error: '章节不存在',
    })
    return
  }

  // 读取 markdown 文件
  const chaptersPath = path.join(__dirname, '..', 'public', 'chapters', chapter.path)

  try {
    const content = fs.readFileSync(chaptersPath, 'utf-8')
    res.status(200).json({
      success: true,
      content: content,
      title: chapter.title,
    })
  } catch {
    res.status(500).json({
      success: false,
      error: '读取章节失败',
    })
  }
})

/**
 * 搜索章节
 */
app.get('/api/search', (req: Request, res: Response): void => {
  const { q } = req.query

  if (!q || typeof q !== 'string') {
    res.status(200).json({
      success: true,
      results: [],
    })
    return
  }

  const keyword = q.toLowerCase()
  const results = chapters.filter(c => 
    c.title.toLowerCase().includes(keyword) || 
    c.category.toLowerCase().includes(keyword)
  )

  res.status(200).json({
    success: true,
    results: results,
  })
})

/**
 * health
 */
app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app