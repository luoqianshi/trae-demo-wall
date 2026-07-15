import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'

const testsDirectory = dirname(fileURLToPath(import.meta.url))
const demoRoot = resolve(testsDirectory, '..')

const requiredPages = [
  'index.html',
  '01-public-user-demo.html',
  '02-vulnerable-mode-demo.html',
  '03-admin-console-demo.html',
  '04-full-story-demo.html',
  'user.html',
  'vulnerable.html',
  'admin.html',
  'scenario.html',
]

const corePages = [
  '01-public-user-demo.html',
  '02-vulnerable-mode-demo.html',
  '03-admin-console-demo.html',
  '04-full-story-demo.html',
]

const productPages = ['index.html', ...corePages]

const compatibilityPages = ['user.html', 'vulnerable.html', 'admin.html', 'scenario.html']

const compatibilityTargets = {
  'user.html': '01-public-user-demo.html',
  'vulnerable.html': '02-vulnerable-mode-demo.html',
  'admin.html': '03-admin-console-demo.html',
  'scenario.html': '04-full-story-demo.html',
}

const forbiddenTechnicalCopy = [
  '\uFF08\u6F14\u793A\uFF09',
  '\uFF08\u6A21\u62DF\uFF09',
  '\u6A21\u62DF\u4E8B\u4EF6',
  '无需安装',
  '无需后端',
  '无需联网',
  '离线交付自检',
  '运行离线说明',
  '兼容故事入口',
  '兼容用户入口',
  '兼容关怀入口',
  '兼容后台入口',
  'OFFLINE DEMO',
  '离线 Demo',
  '单文件 Demo',
  '进入演示',
  '填入示例求助',
  '当前示例未满足',
  '家属同步预览',
  '比赛录屏推荐入口',
  '3–5 分钟可复现故事',
]

const requiredAssets = [
  'assets/styles.css',
  'assets/data.js',
  'assets/app.js',
  'README.md',
  '_design-notes.md',
]

const requiredNavigationTargets = [
  'index.html',
  '01-public-user-demo.html',
  '02-vulnerable-mode-demo.html',
  '03-admin-console-demo.html',
  '04-full-story-demo.html',
]

const brandName = 'Beacon｜守望'
const legacyBrandNames = [
  '\u98ce\u96e8\u65b9\u821f AI',
  '\u98ce\u96e8\u65b9\u821fAI',
  '\u98ce\u96e8\u65b9\u821f',
  '\u98ce\u96e8\u540c\u821f AI',
  '\u98ce\u96e8\u540c\u821fAI',
  '\u98ce\u96e8\u540c\u821f',
]
const halfWidthBrandName = ['Beacon ', String.fromCharCode(0x7c), ' \u5b88\u671b'].join('')
const escapedBrandName = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const brandLinkPattern = new RegExp(
  `<a[^>]*class=["'][^"']*\\bbrand\\b[^"']*["'][^>]*>[\\s\\S]{0,400}${escapedBrandName}[\\s\\S]{0,400}<\\/a>`,
  'i',
)

const failures = []
const checks = []

function pass(message) {
  checks.push(message)
}

function fail(file, message) {
  failures.push(`${file}: ${message}`)
}

function assert(file, condition, message) {
  if (condition) pass(`${file}: ${message}`)
  else fail(file, message)
}

function readUtf8(relativePath) {
  const absolutePath = join(demoRoot, relativePath)
  try {
    const buffer = readFileSync(absolutePath)
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch (error) {
    fail(relativePath, `不是有效 UTF-8 或无法读取（${error instanceof Error ? error.message : '未知错误'}）`)
    return ''
  }
}

function isInsideDemoRoot(target) {
  const pathFromRoot = relative(demoRoot, target)
  return pathFromRoot === '' || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..' && !pathFromRoot.includes(`..${sep}`))
}

function checkLocalReferences(file, source) {
  const referencePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi
  for (const match of source.matchAll(referencePattern)) {
    const reference = match[1].trim()
    if (!reference || reference.startsWith('#')) continue
    if (/^(?:https?:|\/\/|data:|javascript:|file:)/i.test(reference)) {
      fail(file, `存在非本地相对引用：${reference}`)
      continue
    }
    const cleanReference = decodeURIComponent(reference.split('#')[0].split('?')[0])
    const target = normalize(resolve(dirname(join(demoRoot, file)), cleanReference))
    if (!isInsideDemoRoot(target)) {
      fail(file, `引用越出 demo-html 目录：${reference}`)
    } else if (!existsSync(target)) {
      fail(file, `相对引用目标不存在：${reference}`)
    }
  }
}

function checkNoExternalRuntime(file, source) {
  assert(file, !/(?:https?:)?\/\//i.test(source), '无远程 HTTP/HTTPS URL')
  assert(file, !/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(source), '无运行时网络请求')
  assert(file, !/(?:[A-Za-z]:[\\/]|file:\/{2,}|\/(?:Users|home|var|tmp)\/)/i.test(source), '无绝对本地磁盘路径')
  assert(file, !/@import\s+url|fonts?\.(?:googleapis|gstatic)/i.test(source), '无在线字体或 CSS 导入')
}

function checkInlineScriptSyntax(file, source) {
  const scripts = [...source.matchAll(/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [index, match] of scripts.entries()) {
    try {
      new Script(match[1], { filename: `${file}#inline-script-${index + 1}` })
      pass(`${file}: 内嵌脚本 ${index + 1} 语法有效`)
    } catch (error) {
      fail(file, `内嵌脚本 ${index + 1} 语法错误（${error instanceof Error ? error.message : '未知错误'}）`)
    }
  }
}

for (const file of [...requiredPages, ...requiredAssets]) {
  assert(file, existsSync(join(demoRoot, file)), '必需文件存在')
}

for (const file of requiredPages) {
  if (!existsSync(join(demoRoot, file))) continue
  const source = readUtf8(file)
  if (!source) continue

  assert(file, /^\s*<!doctype html>/i.test(source), '包含 HTML5 DOCTYPE')
  assert(file, /<meta\s+[^>]*charset\s*=\s*["']?utf-8/i.test(source), '声明 UTF-8')
  assert(file, /<meta\s+[^>]*name\s*=\s*["']viewport["'][^>]*content\s*=\s*["'][^"']*width=device-width/i.test(source), '包含移动端 viewport')
  assert(file, /<html\s+[^>]*lang\s*=\s*["']zh-CN["']/i.test(source), '声明中文页面语言')
  assert(file, source.includes(brandName), `包含正式品牌名称“${brandName}”`)
  assert(file, new RegExp(`<title>[^<]*${escapedBrandName}[^<]*<\\/title>`, 'i').test(source), `页面标题包含“${brandName}”`)
  for (const legacyName of legacyBrandNames) {
    assert(file, !source.includes(legacyName), `不包含旧品牌“${legacyName}”`)
  }
  assert(file, !source.includes(halfWidthBrandName), '不使用半角竖线品牌写法')
  assert(file, !/<input[^>]+(?:name|id)=["']?(?:phone|mobile|id-card|identity)/i.test(source), '不采集真实电话或身份信息')
  checkNoExternalRuntime(file, source)
  checkLocalReferences(file, source)
  checkInlineScriptSyntax(file, source)
}

for (const file of productPages) {
  if (!existsSync(join(demoRoot, file))) continue
  const source = readUtf8(file)
  assert(file, /data-product-shell/.test(source), '使用产品化页面壳标识')
  assert(file, brandLinkPattern.test(source), `品牌导航区完整展示“${brandName}”`)
  assert(file, /110/.test(source) && /119/.test(source) && /120/.test(source), '包含 110、119、120 专业渠道提示')
  assert(file, /(?:不能|无法|不应|不得|不可)替代(?:报警|专业救援|应急|官方)/.test(source), '声明不能替代报警、官方信息或专业救援')
  assert(file, /(?:赛事原型|模拟数据)/.test(source), '以低干扰方式披露赛事原型或模拟数据边界')
  assert(file, /prefers-reduced-motion/.test(source), '尊重减少动态效果偏好')
  assert(file, !/behavior\s*:\s*["']smooth["']/.test(source) || /matchMedia\([^)]*prefers-reduced-motion/.test(source), '脚本触发的平滑滚动受减少动态效果偏好控制')
  for (const phrase of forbiddenTechnicalCopy) {
    assert(file, !source.includes(phrase), `不展示技术交付说明“${phrase}”`)
  }
  for (const target of requiredNavigationTargets) {
    assert(file, source.includes(target), `可导航到 ${target}`)
  }
}

for (const file of corePages) {
  if (!existsSync(join(demoRoot, file))) continue
  const source = readUtf8(file)
  assert(file, /<style(?:\s[^>]*)?>[\s\S]*<\/style>/i.test(source), '核心页面内嵌 CSS 并可自包含运行')
  assert(file, /<script(?:\s[^>]*)?>[\s\S]*<\/script>/i.test(source), '核心页面内嵌 JavaScript 并可自包含运行')
  assert(file, /data-action=/.test(source), '核心页面包含可验证的真实交互入口')
  assert(file, !/(?:src|href)=["']assets\//i.test(source), '核心页面不依赖共享 assets')
}

if (existsSync(join(demoRoot, 'index.html'))) {
  const home = readUtf8('index.html')
  assert('index.html', home.includes('让求助被看见，让互助有边界，让照护有闭环。'), '首页使用既定核心价值表达')
}

for (const file of compatibilityPages) {
  if (!existsSync(join(demoRoot, file))) continue
  const source = readUtf8(file)
  const target = compatibilityTargets[file]
  assert(file, source.includes(target), `旧入口无感转向 ${target}`)
  assert(file, /http-equiv=["']refresh["']|location\.(?:replace|href)/i.test(source), '旧入口使用本地无感转向')
  assert(file, !/(?:src|href)=["']assets\//i.test(source), '旧入口不再展示兼容说明页')
  for (const phrase of forbiddenTechnicalCopy) {
    assert(file, !source.includes(phrase), `旧入口不展示技术说明“${phrase}”`)
  }
}

if (existsSync(join(demoRoot, '04-full-story-demo.html'))) {
  const story = readUtf8('04-full-story-demo.html')
  for (const phrase of ['灾害发生', '用户求助', '弱势端一键求助', '后台分诊', '任务派发', '用户协助', '安置照护', '回访']) {
    assert('04-full-story-demo.html', story.includes(phrase), `故事 stepper 包含“${phrase}”`)
  }
  assert('04-full-story-demo.html', story.includes('让求助被看见，让互助有边界，让照护有闭环'), '包含项目口号')
}

if (existsSync(join(demoRoot, '01-public-user-demo.html'))) {
  const publicDemo = readUtf8('01-public-user-demo.html')
  assert('01-public-user-demo.html', /requestText\.addEventListener\(['"]input['"]/.test(publicDemo), '求助文本变化会使旧分析失效')
  assert('01-public-user-demo.html', /function\s+invalidateAnalysis\s*\(/.test(publicDemo), '集中实现旧分析失效逻辑')
  assert('01-public-user-demo.html', /analysisSourceText/.test(publicDemo), '提交前绑定分析对应的原始文本')
}

if (existsSync(join(demoRoot, '02-vulnerable-mode-demo.html'))) {
  const vulnerableDemo = readUtf8('02-vulnerable-mode-demo.html')
  assert('02-vulnerable-mode-demo.html', vulnerableDemo.includes('id="care-status-badge"'), '照护状态徽标具有单一更新目标')
  assert('02-vulnerable-mode-demo.html', /function\s+renderCareStatus\s*\(/.test(vulnerableDemo), 'SAFE、NEEDS_HELP、NO_RESPONSE 使用统一状态渲染')
}

if (existsSync(join(demoRoot, '03-admin-console-demo.html'))) {
  const adminDemo = readUtf8('03-admin-console-demo.html')
  assert('03-admin-console-demo.html', /requestId:['"]request_demo_001['"]/.test(adminDemo), '任务显式关联来源求助')
  assert('03-admin-console-demo.html', /status!==['"]VERIFIED['"]/.test(adminDemo), '匹配或派发前强制检查人工核验状态')
  assert('03-admin-console-demo.html', /experienceVerified/.test(adminDemo) && /adminConfirmed/.test(adminDemo), 'YELLOW 任务同时检查经验资格与后台确认')
  assert('03-admin-console-demo.html', adminDemo.includes('id="yellow-guard-status"'), '页面可见展示 YELLOW 资格拦截')
  assert('03-admin-console-demo.html', !/target\.focus\(\)/.test(adminDemo), '自动隐藏的状态提示不抢夺键盘焦点')
}

if (existsSync(join(demoRoot, '04-full-story-demo.html'))) {
  const storyDemo = readUtf8('04-full-story-demo.html')
  assert('04-full-story-demo.html', /function\s+canEnterStep\s*\(/.test(storyDemo), 'stepper 禁止越过未完成前置步骤')
  assert('04-full-story-demo.html', /function\s+prerequisitesMet\s*\(/.test(storyDemo), '每个故事处理器执行前检查领域前置')
  assert('04-full-story-demo.html', /experienceVerified/.test(storyDemo) && /adminConfirmed/.test(storyDemo), '完整故事的 YELLOW 规则检查经验和后台确认')
  assert('04-full-story-demo.html', storyDemo.includes('id="yellow-policy-status"'), '完整故事可见展示未授权 YELLOW 拦截')
  assert('04-full-story-demo.html', /aria-controls=["'](?:public|vulnerable|admin)-panel["']/.test(storyDemo), '三端 tabs 关联对应面板')
  assert('04-full-story-demo.html', /ArrowRight/.test(storyDemo) && /ArrowLeft/.test(storyDemo), '三端 tabs 支持方向键操作')
}

for (const file of requiredAssets.filter((item) => ['.js', '.css'].includes(extname(item)))) {
  if (!existsSync(join(demoRoot, file))) continue
  checkNoExternalRuntime(file, readUtf8(file))
}

if (existsSync(join(demoRoot, 'assets'))) {
  const unexpected = readdirSync(join(demoRoot, 'assets'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && !['styles.css', 'data.js', 'app.js'].includes(entry.name))
    .map((entry) => entry.name)
  assert('assets/', unexpected.length === 0, `无未说明的外部资源${unexpected.length ? `：${unexpected.join('、')}` : ''}`)
}

if (failures.length > 0) {
  console.error(`Demo 静态门禁 FAIL：${failures.length} 项失败，${checks.length} 项通过。`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Demo 静态门禁 PASS：${checks.length} 项检查全部通过。`)
  console.log(`已验证 ${requiredPages.length} 个 HTML 页面、${requiredAssets.length} 个文档/资源文件。`)
}
