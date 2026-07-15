import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'

const testsDirectory = dirname(fileURLToPath(import.meta.url))
const demoRoot = resolve(testsDirectory, '..')
const targetPath = process.argv[2] ? resolve(process.argv[2]) : join(demoRoot, 'beacon-registration.html')
const targetName = basename(targetPath)
const failures = []
let checks = 0

function assert(condition, message) {
  checks += 1
  if (!condition) failures.push(message)
}

function readHexToken(name) {
  const match = source.match(new RegExp(`--${name}:\\s*#([0-9a-f]{6})`, 'i'))
  return match?.[1] ?? null
}

function relativeLuminance(hex) {
  if (!hex) return null
  const channels = hex.match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(left, right) {
  const leftLuminance = relativeLuminance(left)
  const rightLuminance = relativeLuminance(right)
  if (leftLuminance === null || rightLuminance === null) return 0
  return (Math.max(leftLuminance, rightLuminance) + 0.05) / (Math.min(leftLuminance, rightLuminance) + 0.05)
}

if (!existsSync(targetPath)) {
  console.error(`报名页静态门禁 FAIL：缺少 ${targetName}`)
  process.exit(1)
}

let source = ''
try {
  source = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(targetPath))
  assert(true, '文件是有效 UTF-8')
} catch (error) {
  console.error(`报名页静态门禁 FAIL：文件无法以 UTF-8 读取（${error instanceof Error ? error.message : '未知错误'}）`)
  process.exit(1)
}

const brand = 'Beacon｜守望'
const subtitle = '极端天气下的公众求助与重点人群照护协同平台'
const slogan = '让每一次求助被看见，让每一份帮助安全抵达。'
const productForm = '一套由公众服务端、重点关怀端和社区管理后台组成的 Web 平台，并计划进一步拓展为面向移动场景的 App，满足公众求助、重点人群照护与基层协同管理需求。'
const legacyBrands = [
  '\u98ce\u96e8\u65b9\u821f AI',
  '\u98ce\u96e8\u65b9\u821fAI',
  '\u98ce\u96e8\u65b9\u821f',
  '\u98ce\u96e8\u540c\u821f AI',
  '\u98ce\u96e8\u540c\u821fAI',
  '\u98ce\u96e8\u540c\u821f',
]
const wrongBrand = ['Beacon ', String.fromCharCode(0x7c), ' \u5b88\u671b'].join('')
const forbiddenCopy = [
  '单文件 HTML',
  '离线页面',
  '无需安装',
  '无需后端',
  '无需联网',
  '离线交付',
  '离线自检',
  '兼容入口',
  '演示页面',
  'Demo 页面',
  '点击验证网络请求',
  '打包上传',
  '技术交付',
]

assert(/^\s*<!doctype html>/i.test(source), '包含 HTML5 DOCTYPE')
assert(/<html\s+[^>]*lang=["']zh-CN["']/i.test(source), '声明中文页面语言')
assert(/<meta\s+[^>]*charset=["']?utf-8/i.test(source), '声明 UTF-8')
assert(/<meta\s+[^>]*name=["']viewport["'][^>]*width=device-width/i.test(source), '包含移动端 viewport')
assert(/<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+[^>]*>/i.test(source), '包含产品 Meta description')
assert(new RegExp(`<title>[^<]*${brand}[^<]*<\\/title>`, 'i').test(source), '页面标题包含正式品牌')

for (const phrase of [brand, subtitle, slogan, productForm]) {
  assert(source.includes(phrase), `包含正式文案：${phrase}`)
}
for (const phrase of ['公众服务端', '重点关怀端', '社区管理端']) {
  assert(source.includes(phrase), `包含三端名称：${phrase}`)
}
for (const phrase of ['社会价值', '效率价值', '创新价值']) {
  assert(source.includes(phrase), `包含价值模块：${phrase}`)
}
for (const phrase of ['求助信息分散', '重点人群难以主动表达', '普通互助缺少安全边界', '基层处理缺少持续闭环']) {
  assert(source.includes(phrase), `包含具体痛点：${phrase}`)
}
for (const phrase of ['灾情感知', '发起求助', 'AI 结构化与风险分级', '后台核验', '能力匹配与任务派发', '安全执行', '转移安置', '灾后回访']) {
  assert(source.includes(phrase), `包含协同流程步骤：${phrase}`)
}
for (const phrase of ['自然语言求助解析', '人员和危险因素提取', 'P1—P4 风险分级', '重复灾情合并', '帮助能力匹配', '通知和回访内容生成']) {
  assert(source.includes(phrase), `包含 AI 能力：${phrase}`)
}
for (const phrase of ['绿色：普通用户可参与的低风险互助', '黄色：需要相应经验或认证', '红色：仅交由专业救援力量']) {
  assert(source.includes(phrase), `包含任务安全等级：${phrase}`)
}
assert(source.includes('极端天气中，最容易被忽略的不是没有收到预警的人，而是无法独立求助、无法自行转移，或求助后没有得到持续跟进的人。'), '包含核心问题洞察')
assert(source.includes('暴雨导致社区停电，一位行动不便的独居老人发起求助。'), '包含可信虚构场景')

for (const legacy of legacyBrands) assert(!source.includes(legacy), `不包含旧品牌：${legacy}`)
assert(!source.includes(wrongBrand), '不使用半角竖线品牌写法')
for (const phrase of forbiddenCopy) assert(!source.includes(phrase), `不包含技术交付文案：${phrase}`)
assert(!/\bDemo\b/i.test(source), '正文不使用 Demo 技术表述')

assert(!/<link\b[^>]*rel=["']stylesheet["']/i.test(source), '不引用外部样式表')
assert(!/<script\b[^>]*\bsrc\s*=/i.test(source), '不引用外部脚本')
assert(!/<img\b[^>]*\bsrc\s*=/i.test(source), '不引用外部或本地图片')
assert(!/\b(?:srcset|poster|ping)\s*=/i.test(source), '不通过 srcset、poster 或 ping 引用资源')
assert(!/<object\b[^>]*\bdata\s*=/i.test(source), '不通过 object data 引用资源')
assert(!/<(?:audio|video|source|track|input)\b[^>]*\bsrc\s*=/i.test(source), '不通过媒体或输入元素引用资源')
assert(!/<iframe\b/i.test(source), '不使用 iframe')
assert(!/serviceWorker/i.test(source), '不使用 Service Worker')
assert(!/https?:\/\//i.test(source), '不包含 HTTP/HTTPS URL')
assert(!/\b(?:href|src|srcset|poster|ping)\s*=\s*["']\/\//i.test(source), '不包含协议相对资源 URL')
assert(!/\bfetch\s*\(/.test(source), '不调用 fetch')
assert(!/\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/.test(source), '不使用其他网络 API')
assert(!/@import\b|fonts?\.(?:googleapis|gstatic)|font-face/i.test(source), '不导入在线字体或外部 CSS')
assert(!/\burl\s*\(/i.test(source), 'CSS 不引用外部资源 URL')
assert(!/(?:[A-Za-z]:[\\/]|file:\/{2,}|\/(?:Users|home|var|tmp)\/)/i.test(source), '不包含绝对本地路径')
assert(!/<form\b[^>]*\baction\s*=/i.test(source), '不提交到外部表单地址')
assert(!/\b(?:alert|window\.open)\s*\(/.test(source), '不使用 alert 或打开外部窗口')

const resourceReferences = [...source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1].trim())
for (const reference of resourceReferences) {
  assert(reference.startsWith('#'), `页面引用仅允许页内锚点：${reference}`)
  if (reference.startsWith('#') && reference.length > 1) {
    const id = reference.slice(1).replace(/([\\.^$|?*+()[{])/g, '\\$1')
    assert(new RegExp(`\\bid=["']${id}["']`).test(source), `锚点目标存在：${reference}`)
  }
}

const styleBlocks = [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
const scriptBlocks = [...source.matchAll(/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)]
assert(styleBlocks.length === 1, '存在且仅存在一个内嵌样式块')
assert(scriptBlocks.length === 1, '存在且仅存在一个内嵌脚本块')
assert(/:root\s*\{[\s\S]*--color-primary:[\s\S]*--space-4:[\s\S]*--radius-lg:[\s\S]*--motion-base:/i.test(source), '内嵌 CSS 定义统一 Design Tokens')
assert(contrastRatio(readHexToken('color-accent'), readHexToken('color-white')) >= 4.5, '强调色与白色小字号对比度至少 4.5:1')
assert(contrastRatio(readHexToken('color-ink-soft'), readHexToken('color-white')) >= 4.5, '次级状态底色与白色小字号对比度至少 4.5:1')
assert(/:focus-visible\s*\{[^}]*outline:/i.test(source), '定义清晰的键盘焦点样式')
assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(source), '尊重 prefers-reduced-motion')
assert(!/\sstyle=["']/i.test(source), '结构中不散落内联 style 属性')

for (const [index, block] of scriptBlocks.entries()) {
  try {
    new Script(block[1], { filename: `${targetName}#inline-script-${index + 1}` })
    assert(true, `内嵌脚本 ${index + 1} 语法有效`)
  } catch (error) {
    assert(false, `内嵌脚本 ${index + 1} 语法有效（${error instanceof Error ? error.message : '未知错误'}）`)
  }
}

assert((source.match(/<h1\b/gi) ?? []).length === 1, '页面仅有一个 h1')
for (const tag of ['header', 'nav', 'main', 'section', 'article', 'footer']) {
  assert(new RegExp(`<${tag}\\b`, 'i').test(source), `使用语义化 ${tag} 元素`)
}
for (const id of ['top', 'why', 'terminals', 'workflow', 'story', 'ai-safety', 'value', 'product-form']) {
  assert(new RegExp(`\\bid=["']${id}["']`).test(source), `包含章节锚点 #${id}`)
}

assert(/role=["']tablist["']/.test(source), '三端切换使用 tablist 语义')
assert((source.match(/<button\b[^>]*\brole=["']tab["'][^>]*>/g) ?? []).length === 3, '三端切换包含三个 tab')
assert((source.match(/<article\b[^>]*\brole=["']tabpanel["'][^>]*>/g) ?? []).length === 3, '三端切换包含三个 tabpanel')
assert(/aria-expanded=["']false["']/.test(source), '移动菜单按钮提供展开状态')
assert(/data-action=["']toggle-menu["']/.test(source), '包含移动端导航开关')
assert(/data-terminal=["']public["']/.test(source) && /data-terminal=["']care["']/.test(source) && /data-terminal=["']admin["']/.test(source), '三端按钮具有稳定交互标识')
assert((source.match(/data-flow-step=/g) ?? []).length === 8, '包含八个可操作流程步骤')
assert(/data-action=["']play-story["']/.test(source), '包含场景播放按钮')
assert(/data-action=["']back-top["']/.test(source), '包含返回顶部按钮')
assert(/<button\b[^>]*class=["'][^"']*back-top[^"']*["'][^>]*tabindex=["']-1["'][^>]*aria-hidden=["']true["']/i.test(source), '隐藏的返回顶部按钮退出 Tab 顺序')
assert(/<progress\b[^>]*aria-label=["'][^"']+["']/i.test(source), '故事进度提供可访问名称')
assert((source.match(/class=["']story-step__status["']/g) ?? []).length === 6, '六个故事步骤均包含可见状态文字')
assert(/aria-current=["']step["']/.test(source), '当前故事步骤提供 aria-current')
const storyDuration = Number(source.match(/const\s+storyStepDuration\s*=\s*(\d+)/)?.[1] ?? 0)
assert(storyDuration >= 1000, '故事自动播放为可阅读节奏')
assert(/IntersectionObserver/.test(source), '滚动时更新当前导航章节')
assert(/ArrowRight/.test(source) && /ArrowLeft/.test(source), '三端标签支持方向键切换')
assert(/aria-live=["']polite["']/.test(source), '动态内容提供礼貌播报区域')

const introMatch = source.match(/<p\b[^>]*data-hero-intro[^>]*>([\s\S]*?)<\/p>/i)
const introText = introMatch?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim() ?? ''
assert(introText.length > 0 && introText.length <= 100, 'Hero 产品介绍不超过 100 字')

assert(/110/.test(source) && /119/.test(source) && /120/.test(source), '安全说明包含 110、119、120')
assert(/不能替代/.test(source), '明确产品不能替代专业渠道')
assert(/虚构场景和数据/.test(source), '以低干扰方式说明虚构数据')
assert(/红色任务不会推送给普通帮助者/.test(source), '明确红色任务不推给普通帮助者')
assert(/AI 结果受确定性安全规则约束/.test(source), '明确 AI 受确定性规则约束')

if (failures.length) {
  console.error(`报名页静态门禁 FAIL：${failures.length} 项失败，${checks - failures.length} 项通过。`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`报名页静态门禁 PASS：${checks} 项检查全部通过。`)
  console.log(`${targetName} 为完全自包含的单文件产品介绍页。`)
}
