import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const testsDirectory = dirname(fileURLToPath(import.meta.url))
const demoRoot = resolve(testsDirectory, '..')
const tempRoot = join(demoRoot, '.tmp-browser-validation')
const profileDirectory = join(tempRoot, 'profile')
const screenshotDirectory = join(tempRoot, 'screenshots')
const keepScreenshots = process.argv.includes('--keep-screenshots')

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]
const browserExecutable = chromeCandidates.find(existsSync)

if (!browserExecutable) {
  console.error('Browser validation BLOCKED: 未找到本地 Chrome 或 Edge。')
  process.exit(2)
}

if (!resolve(tempRoot).startsWith(resolve(demoRoot))) {
  throw new Error('临时浏览器目录必须位于 demo-html 内。')
}
try {
  rmSync(tempRoot, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 })
} catch (error) {
  console.error(`Browser validation BLOCKED: 无法准备临时目录（${error instanceof Error ? error.message : String(error)}）`)
  process.exit(2)
}
mkdirSync(profileDirectory, { recursive: true })
mkdirSync(screenshotDirectory, { recursive: true })

const browser = spawn(browserExecutable, [
  '--headless=new',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-domain-reliability',
  '--disable-sync',
  '--metrics-recording-only',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-proxy-server',
  '--remote-debugging-port=0',
  `--user-data-dir=${profileDirectory}`,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })

let browserStderr = ''
browser.stderr.setEncoding('utf8')
browser.stderr.on('data', (chunk) => { browserStderr += chunk })

const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))

async function waitForDevToolsEndpoint() {
  const endpointFile = join(profileDirectory, 'DevToolsActivePort')
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(endpointFile)) {
      const [port, browserPath] = readFileSync(endpointFile, 'utf8').trim().split(/\r?\n/)
      if (port && browserPath) return `ws://127.0.0.1:${port}${browserPath}`
    }
    if (browser.exitCode !== null) throw new Error(`浏览器提前退出：${browser.exitCode}\n${browserStderr}`)
    await delay(100)
  }
  throw new Error('等待本地浏览器 DevTools 端点超时。')
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Set()
  }

  async connect() {
    await new Promise((resolvePromise, rejectPromise) => {
      this.socket.addEventListener('open', resolvePromise, { once: true })
      this.socket.addEventListener('error', rejectPromise, { once: true })
    })
    const rejectPending = (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      for (const pending of this.pending.values()) pending.reject(error)
      this.pending.clear()
    }
    this.socket.addEventListener('close', (event) => {
      rejectPending(new Error(`DevTools WebSocket closed (${event.code}${event.reason ? `: ${event.reason}` : ''})`))
    })
    this.socket.addEventListener('error', () => {
      rejectPending(new Error('DevTools WebSocket connection failed'))
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(`${message.error.code}: ${message.error.message}`))
        else pending.resolve(message.result)
        return
      }
      for (const listener of this.listeners) listener(message)
    })
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId
    this.nextId += 1
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise })
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  }

  waitFor(method, sessionId, timeout = 10000) {
    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener)
        rejectPromise(new Error(`等待 ${method} 超时。`))
      }, timeout)
      const listener = (message) => {
        if (message.method !== method || (sessionId && message.sessionId !== sessionId)) return
        clearTimeout(timer)
        this.listeners.delete(listener)
        resolvePromise(message.params)
      }
      this.listeners.add(listener)
    })
  }

  on(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

const productPageContracts = {
  'beacon-registration.html': {
    mainActionSelector: '.hero-actions a[href="#terminals"]',
    boundarySelector: '.registration-footer__safety',
    boundaryFirstViewport: false,
    selfContained: true,
    requiredSections: ['#top', '#why', '#terminals', '#workflow', '#story', '#ai-safety', '#value', '#product-form'],
    requiredSectionText: {
      '#top': ['Beacon｜守望', '极端天气下的公众求助与重点人群照护协同平台', '让每一次求助被看见，让每一份帮助安全抵达。'],
      '#why': ['求助信息分散', '重点人群难以主动表达', '普通互助缺少安全边界', '基层处理缺少持续闭环'],
      '#terminals': ['公众服务端', '重点关怀端', '社区管理端'],
      '#workflow': ['灾情感知', 'AI 结构化与风险分级', '灾后回访'],
      '#story': ['发起求助', 'AI 识别', '持续照护'],
      '#ai-safety': ['自然语言求助解析', '绿色', '黄色', '红色'],
      '#value': ['社会价值', '效率价值', '创新价值'],
      '#product-form': ['Web 平台', 'App'],
    },
  },
  'index.html': { mainActionSelector: '.hero-actions a', boundarySelector: '.service-boundary' },
  '01-public-user-demo.html': { mainActionSelector: '[data-action="focus-request"]', boundarySelector: '.emergency-strip' },
  '02-vulnerable-mode-demo.html': { mainActionSelector: '[data-action="safe"]', boundarySelector: '.emergency-strip' },
  '03-admin-console-demo.html': { mainActionSelector: '.topbar-action', boundarySelector: '.emergency-strip' },
  '04-full-story-demo.html': { mainActionSelector: '.story-start', boundarySelector: '.emergency-strip' },
}

const aliasPageContracts = {
  'user.html': { target: '01-public-user-demo.html', keySelector: '#request-card' },
  'vulnerable.html': { target: '02-vulnerable-mode-demo.html', keySelector: '#care-status-badge' },
  'admin.html': { target: '03-admin-console-demo.html', keySelector: '#task-state' },
  'scenario.html': { target: '04-full-story-demo.html', keySelector: '#completion-badge' },
}

const forbiddenVisibleCopyPatterns = [
  ['无需安装', '无需\\s*安装'],
  ['无需后端', '无需\\s*后端'],
  ['无需联网', '无需\\s*联网'],
  ['无需构建', '无需\\s*构建'],
  ['离线交付自检', '离线\\s*交付\\s*自检'],
  ['运行离线说明', '运行\\s*离线\\s*说明'],
  ['兼容入口', '兼容(?:故事|用户|关怀|后台)?\\s*入口'],
  ['OFFLINE DEMO', 'OFFLINE\\s+DEMO'],
  ['离线 Demo', '离线\\s*Demo'],
  ['单文件 Demo', '单文件\\s*Demo'],
  ['进入演示', '进入\\s*演示'],
  ['比赛录屏', '比赛\\s*录屏'],
  ['3–5 分钟', '3\\s*[-–—~至]\\s*5\\s*分钟'],
  ['断网运行说明', '断网.{0,12}(?:运行|打开|双击)'],
  ['不访问网络', '不访问\\s*网络'],
]

const pages = [
  ...Object.keys(productPageContracts).map((file) => ({
    file,
    interaction: ({
      '01-public-user-demo.html': 'public',
      '02-vulnerable-mode-demo.html': 'vulnerable',
      '03-admin-console-demo.html': 'admin',
      '04-full-story-demo.html': 'story',
      'beacon-registration.html': 'registration',
    })[file] || null,
    product: productPageContracts[file],
  })),
  ...Object.entries(aliasPageContracts).map(([file, alias]) => ({ file, interaction: null, alias })),
]
const viewports = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
]
const preferredInteractionViewport = { public: '375', vulnerable: '375', admin: '1440', story: '1440', registration: '375' }

async function evaluate(client, sessionId, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId)
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '页面脚本执行失败。')
  return result.result?.value
}

async function waitForAliasDestination(client, sessionId, alias, timeout = 5000) {
  const deadline = Date.now() + timeout
  let lastState = { file: '', selectorFound: false, href: '' }
  let lastError = ''
  while (Date.now() < deadline) {
    try {
      lastState = await evaluate(client, sessionId, `(()=>({file:decodeURIComponent(location.pathname.split('/').pop()||''),selectorFound:Boolean(document.querySelector(${JSON.stringify(alias.keySelector)})),href:location.href}))()`)
      if (lastState.file === alias.target && lastState.selectorFound) {
        return { passed: true, ...lastState }
      }
    } catch (error) {
      // A redirect can destroy the previous execution context between polls.
      lastError = error instanceof Error ? error.message : String(error)
    }
    await delay(100)
  }
  return { passed: false, ...lastState, error: lastError }
}

async function runInteraction(client, sessionId, kind) {
  if (kind === 'registration') {
    return evaluate(client, sessionId, `(async()=>{
      const wait=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
      const waitFor=async(predicate,timeout)=>{const deadline=Date.now()+timeout;while(Date.now()<deadline){if(predicate())return true;await wait(50)}return predicate()};
      const isHittable=(element)=>{if(!element)return false;const rect=element.getBoundingClientRect();const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||rect.width<1||rect.height<1)return false;const hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);return Boolean(hit&&(hit===element||element.contains(hit)))};
      const reveal=async(element)=>{document.documentElement.style.scrollBehavior='auto';element.scrollIntoView({block:'center'});await wait(60);return isHittable(element)};
      const menu=document.querySelector('[data-action="toggle-menu"]');
      const navigation=document.querySelector('#site-nav');
      const backTop=document.querySelector('[data-action="back-top"]');
      const backTopInitiallyHidden=backTop.tabIndex===-1&&backTop.getAttribute('aria-hidden')==='true';
      const menuHittable=isHittable(menu);
      menu.click();
      const menuOpened=menu.getAttribute('aria-expanded')==='true'&&!navigation.hidden;
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      const menuEscaped=menu.getAttribute('aria-expanded')==='false'&&navigation.hidden&&document.activeElement===menu;
      menu.click();
      const navigationLink=navigation.querySelector('a[href="#terminals"]');
      const navigationHittable=isHittable(navigationLink);
      navigationLink.focus();
      navigationLink.click();
      await wait(80);
      const menuClosed=menu.getAttribute('aria-expanded')==='false'&&navigation.hidden&&document.activeElement===menu;
      const careTab=document.querySelector('[data-terminal="care"]');
      const terminalHittable=await reveal(careTab);
      careTab.click();
      const terminalChanged=careTab.getAttribute('aria-selected')==='true'&&!document.querySelector('#terminal-care').hidden&&document.querySelector('#terminal-care').textContent.includes('安置照护卡');
      careTab.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
      const adminTab=document.querySelector('[data-terminal="admin"]');
      const terminalKeyboardForward=adminTab.getAttribute('aria-selected')==='true'&&document.querySelector('[role="tablist"]').getAttribute('aria-orientation')==='vertical';
      adminTab.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
      const terminalKeyboardBack=careTab.getAttribute('aria-selected')==='true';
      const flow=document.querySelector('[data-flow-step="4"]');
      const flowHittable=await reveal(flow);
      flow.click();
      const flowChanged=flow.getAttribute('aria-pressed')==='true'&&document.querySelector('#flow-detail').textContent.includes('能力匹配与任务派发');
      const play=document.querySelector('[data-action="play-story"]');
      const reset=document.querySelector('[data-action="reset-story"]');
      const track=document.querySelector('#story-track');
      const storyControlsHittable=await reveal(play)&&isHittable(reset);
      play.click();
      await waitFor(()=>Number(track.dataset.activeStep)>0,2600);
      const movedStep=Number(track.dataset.activeStep);
      const activeStoryCard=document.querySelector('.story-step[aria-current="step"]');
      const storyMoved=Boolean(movedStep>0&&activeStoryCard?.querySelector('.story-step__status')?.textContent.includes('进行中'));
      play.click();
      const pausedStep=Number(track.dataset.activeStep);
      await wait(700);
      const storyPaused=Number(track.dataset.activeStep)===pausedStep&&play.textContent.includes('继续');
      play.click();
      const storyResumed=await waitFor(()=>Number(track.dataset.activeStep)>pausedStep,2600);
      reset.click();
      const storyReset=Boolean(track.dataset.activeStep==='0'&&Number(document.querySelector('#story-progress').value)===1&&document.querySelector('[data-story-step="0"] .story-step__status')?.textContent.includes('进行中'));
      window.scrollTo(0,document.documentElement.scrollHeight);
      await wait(100);
      const backTopVisible=backTop.classList.contains('is-visible')&&backTop.tabIndex===0&&backTop.getAttribute('aria-hidden')==='false';
      const backTopHittable=isHittable(backTop);
      backTop.click();
      const scrolledTop=await waitFor(()=>window.scrollY<50,1600);
      const returnedTop=scrolledTop&&document.activeElement?.id==='hero-title'&&backTop.tabIndex===-1&&backTop.getAttribute('aria-hidden')==='true';
      const controlsHittable=menuHittable&&navigationHittable&&terminalHittable&&flowHittable&&storyControlsHittable&&backTopHittable;
      const details={menuOpened,menuEscaped,menuClosed,terminalChanged,terminalKeyboardForward,terminalKeyboardBack,flowChanged,storyMoved,storyPaused,storyResumed,storyReset,backTopInitiallyHidden,backTopVisible,returnedTop,controlsHittable,menuHittable,navigationHittable,terminalHittable,flowHittable,storyControlsHittable,backTopHittable,movedStep,pausedStep,scrollY:window.scrollY};
      return {passed:menuOpened&&menuEscaped&&menuClosed&&terminalChanged&&terminalKeyboardForward&&terminalKeyboardBack&&flowChanged&&storyMoved&&storyPaused&&storyResumed&&storyReset&&backTopInitiallyHidden&&backTopVisible&&returnedTop&&controlsHittable,details};
    })()`)
  }
  if (kind === 'public') {
    return evaluate(client, sessionId, `(async()=>{const wait=(ms)=>new Promise(r=>setTimeout(r,ms));document.querySelector('[data-action="example"]').click();document.querySelector('[data-action="analyze"]').click();await wait(360);document.querySelector('[data-action="submit"]').click();document.querySelector('#safe-only').click();document.querySelector('[data-action="save-capability"]').click();document.querySelector('[data-action="check-safe"]').click();return !document.querySelector('#progress').hidden&&!document.querySelector('#capability-status').hidden&&!document.querySelector('#safe-status').hidden})()`)
  }
  if (kind === 'vulnerable') {
    return evaluate(client, sessionId, `(async()=>{const wait=(ms)=>new Promise(r=>setTimeout(r,ms));document.querySelector('[data-action="help"]').click();await wait(360);document.querySelector('[data-action="profile"]').click();document.querySelector('[data-action="shelter"]').click();return !document.querySelector('#request-result').hidden&&!document.querySelector('#profile-details').hidden&&!document.querySelector('#shelter-status').hidden})()`)
  }
  if (kind === 'admin') {
    return evaluate(client, sessionId, `(()=>{window.confirm=()=>true;for(const action of ['review','match','dispatch','complete','verify-disaster','mark-check','shelter']){const button=document.querySelector('[data-action="'+action+'"]');if(button)button.click()}return document.querySelector('#task-state').textContent.includes('已完成')&&!document.querySelector('#disaster-status').hidden&&!document.querySelector('#shelter-status').hidden})()`)
  }
  if (kind === 'story') {
    return evaluate(client, sessionId, `(()=>{window.confirm=()=>true;for(let index=0;index<8;index+=1){document.querySelector('[data-action="run-step"]').click();if(index<7)document.querySelector('[data-action="next-step"]').click()}return document.querySelector('#completion-badge').textContent.includes('8 / 8')&&document.querySelector('#admin-status').textContent.includes('完整闭环')})()`)
  }
  return true
}

async function runSafetyRegression(client, sessionId, kind) {
  if (kind === 'registration') {
    return evaluate(client, sessionId, `(()=>{const text=(document.querySelector('#ai-safety')?.innerText||'').replace(/\s+/g,' ');const red=document.querySelector('.safety-level--red');return Boolean(red&&/红色/.test(red.textContent)&&/仅交由专业救援力量/.test(red.textContent)&&/AI 结果受确定性安全规则约束/.test(text)&&/红色任务不会推送给普通帮助者/.test(text)&&/平台不替代专业报警和救援/.test(text))})()`)
  }
  if (kind === 'public') {
    return evaluate(client, sessionId, `(async()=>{const wait=(ms)=>new Promise(r=>setTimeout(r,ms));const input=document.querySelector('#request-text');const analyze=document.querySelector('[data-action="analyze"]');input.value='我妈妈腿脚不好，电梯停了，她下不来。';analyze.click();await wait(360);input.value='电线落水，燃气泄漏，深水有人被困';input.dispatchEvent(new Event('input',{bubbles:true}));const invalidated=document.querySelector('[data-action="submit"]').disabled&&document.querySelector('#analysis-result').hidden;const dangerCases=['家里着火','现场发生爆炸','山洪正在逼近','泥石流堵住道路','山体滑坡','危房有倒塌风险','有人困在地下空间','老人无法呼吸','手臂出血','有人受伤','有人重伤','老人被困住','老人出不来','地下车库被困','房屋倒塌','屋顶塌了','积水水到腰','家中失火'];let allRed=true;for(const value of dangerCases){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));analyze.click();await wait(360);allRed=allRed&&document.querySelector('#priority-badge').textContent.includes('P1')&&document.querySelector('#safety-badge').textContent.includes('RED')&&document.querySelector('#analysis-message').textContent.includes('专业救援')}return invalidated&&allRed})()`)
  }
  if (kind === 'vulnerable') {
    return evaluate(client, sessionId, `(async()=>{const wait=(ms)=>new Promise(r=>setTimeout(r,ms));document.querySelector('[data-action="safe"]').click();await wait(340);const badge=document.querySelector('#care-status-badge');const safe=badge&&badge.textContent.includes('已安全');document.querySelector('[data-action="no-response"]').click();const noResponse=badge&&badge.textContent.includes('未确认安全');return Boolean(safe&&noResponse)})()`)
  }
  if (kind === 'admin') {
    return evaluate(client, sessionId, `(()=>{window.confirm=()=>true;document.querySelector('[data-action="match"]').click();const blockedBeforeReview=document.querySelector('[data-action="dispatch"]').disabled;document.querySelector('[data-action="review"]').click();document.querySelector('[data-action="match"]').click();const enabledAfterReview=!document.querySelector('[data-action="dispatch"]').disabled;const yellowGuard=document.querySelector('#yellow-guard-status');const probe=window.__fengyuSafetyProbe;const ruleBranches=Boolean(probe)&&!probe.canPublicUserAccept('YELLOW',false,true)&&!probe.canPublicUserAccept('YELLOW',true,false)&&probe.canPublicUserAccept('YELLOW',true,true)&&!probe.canPublicUserAccept('RED',true,true)&&!probe.dispatchTask('YELLOW',false,true)&&!probe.dispatchTask('YELLOW',true,false)&&probe.dispatchTask('YELLOW',true,true)&&!probe.dispatchTask('RED',true,true);return blockedBeforeReview&&enabledAfterReview&&yellowGuard&&yellowGuard.dataset.allowed==='false'&&yellowGuard.textContent.includes('后台确认')&&ruleBranches})()`)
  }
  if (kind === 'story') {
    return evaluate(client, sessionId, `(()=>{const future=document.querySelector('[data-step="5"]');const disabledByDefault=future.disabled;future.disabled=false;future.click();const blocked=disabledByDefault&&document.querySelector('#step-title').textContent.includes('灾害发生')&&document.querySelector('#completion-badge').textContent.includes('0 / 8')&&document.querySelector('#step-outcome').textContent.includes('先完成');const yellowGuard=document.querySelector('#yellow-policy-status');const probe=window.__fengyuStorySafetyProbe;const dangerCases=['家里着火','现场发生爆炸','山洪正在逼近','泥石流堵住道路','山体滑坡','危房有倒塌风险','有人困在地下空间','老人无法呼吸','手臂出血','有人受伤','有人重伤','老人被困住','老人出不来','地下车库被困','房屋倒塌','屋顶塌了','积水水到腰','家中失火'];const highRiskGuard=Boolean(probe)&&dangerCases.every(value=>{const result=probe.analyzeRequest(value,null);return result.priority==='P1'&&result.safetyLevel==='RED'&&result.publicHelperAllowed===false});return blocked&&yellowGuard&&yellowGuard.dataset.allowed==='false'&&yellowGuard.textContent.includes('禁止')&&highRiskGuard})()`)
  }
  return true
}

async function runReducedMotionRegistration(client, sessionId) {
  return evaluate(client, sessionId, `(()=>{const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const storyStep=document.querySelector('.story-step');const transitionDuration=Number.parseFloat(getComputedStyle(storyStep).transitionDuration)||0;document.querySelector('[data-action="play-story"]').click();const completed=document.querySelector('#story-track').dataset.activeStep==='5'&&document.querySelector('[data-action="play-story"]').textContent.includes('重新播放');return prefersReduced&&transitionDuration<0.01&&completed})()`)
}

let client
let targetId
let sessionId
const failures = []
let checks = 0

try {
  client = new CdpClient(await waitForDevToolsEndpoint())
  await client.connect()
  ;({ targetId } = await client.send('Target.createTarget', { url: 'about:blank' }))
  ;({ sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true }))
  await client.send('Page.enable', {}, sessionId)
  await client.send('Runtime.enable', {}, sessionId)
  await client.send('Network.enable', {}, sessionId)
  await client.send('Log.enable', {}, sessionId)

  let exceptions = []
  let remoteRequests = []
  let allRequests = []
  let loadingFailures = []
  let consoleErrors = []
  let currentDocumentUrl = ''
  const unsubscribe = client.on((message) => {
    if (message.sessionId !== sessionId) return
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails?.text || '页面异常')
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args?.map((argument) => argument.value ?? argument.description ?? '').join(' ') || 'console.error')
    }
    if (message.method === 'Log.entryAdded' && message.params.entry?.level === 'error') consoleErrors.push(message.params.entry.text || '页面日志错误')
    if (message.method === 'Network.requestWillBeSent') {
      const url = message.params.request?.url || ''
      allRequests.push(url)
      if (/^https?:/i.test(url)) remoteRequests.push(url)
    }
    if (message.method === 'Network.loadingFailed' && !message.params.canceled) loadingFailures.push(message.params.errorText || '资源加载失败')
  })

  for (const page of pages) {
    for (const viewport of viewports) {
      exceptions = []
      remoteRequests = []
      allRequests = []
      loadingFailures = []
      consoleErrors = []
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.width <= 375,
      }, sessionId)
      await client.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
      }, sessionId)
      currentDocumentUrl = pathToFileURL(join(demoRoot, page.file)).href
      const loaded = client.waitFor('Page.loadEventFired', sessionId)
      await client.send('Page.navigate', { url: currentDocumentUrl }, sessionId)
      await loaded
      await delay(100)

      if (page.alias) {
        const aliasState = await waitForAliasDestination(client, sessionId, page.alias)
        checks += 1
        if (!aliasState.passed) {
          failures.push(`${page.file}@${viewport.name}: alias 未落到 ${page.alias.target} 或缺少关键选择器 ${page.alias.keySelector}（当前 ${aliasState.file || aliasState.href || '未知页面'}${aliasState.error ? `；${aliasState.error}` : ''}）`)
        }
        await delay(100)
      }

      const layout = await evaluate(client, sessionId, `(()=>{
        const isRendered=(element)=>{
          if(!element||element.closest('[hidden],[aria-hidden="true"]'))return false;
          const style=getComputedStyle(element);const rect=element.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>0&&rect.height>0;
        };
        const bodyText=(document.body.innerText||'').replace(/\\s+/g,' ').trim();
        const patterns=${JSON.stringify(forbiddenVisibleCopyPatterns)};
        const smallControls=Array.from(document.querySelectorAll('button,a[href],[role="button"]')).filter(element=>{
          if(element.matches('.skip,.skip-link'))return false;
          const rect=element.getBoundingClientRect();
          return isRendered(element)&&(rect.width<43.5||rect.height<43.5);
        }).map(element=>({text:(element.getAttribute('aria-label')||element.textContent||'').trim().slice(0,40),width:Math.round(element.getBoundingClientRect().width),height:Math.round(element.getBoundingClientRect().height),className:typeof element.className==='string'?element.className:''}));
        const product=${JSON.stringify(page.product || null)};
        let productChecks=null;
        if(product){
          const main=document.querySelector('main');
          const mainAction=document.querySelector(product.mainActionSelector);
          const boundary=document.querySelector(product.boundarySelector);
          const actionRect=mainAction?mainAction.getBoundingClientRect():null;
          const boundaryRect=boundary?boundary.getBoundingClientRect():null;
          const actionName=mainAction?(mainAction.getAttribute('aria-label')||mainAction.textContent||mainAction.getAttribute('title')||'').trim():'';
          const boundaryText=boundary?(boundary.innerText||'').replace(/\\s+/g,' ').trim():'';
          const requiredSections=(product.requiredSections||[]).map(selector=>{
            const section=document.querySelector(selector);
            const heading=section?.querySelector(selector==='#top'?'h1':'h2');
            const sectionText=(section?.innerText||'').replace(/\\s+/g,' ');
            const missingText=(product.requiredSectionText?.[selector]||[]).filter(text=>!sectionText.includes(text));
            return {selector,missingText,rendered:Boolean(section&&heading&&isRendered(section)&&isRendered(heading)&&(heading.textContent||'').trim()&&missingText.length===0)};
          });
          productChecks={
            shell:document.body.hasAttribute('data-product-shell'),
            mainActionAccessible:Boolean(main&&mainAction&&main.contains(mainAction)&&isRendered(mainAction)&&actionName&&(mainAction.tagName!=='BUTTON'||!mainAction.disabled)&&(mainAction.tagName!=='A'||mainAction.hasAttribute('href'))),
            mainActionInFirstViewport:Boolean(actionRect&&actionRect.bottom>0&&actionRect.top<window.innerHeight),
            boundaryAccessible:Boolean(boundary&&isRendered(boundary)&&boundary.matches('aside,[role="note"],[role="alert"]')&&/110/.test(boundaryText)&&/119/.test(boundaryText)&&/120/.test(boundaryText)&&/不能替代/.test(boundaryText)),
            boundaryInFirstViewport:Boolean(boundaryRect&&boundaryRect.bottom>0&&boundaryRect.top<window.innerHeight),
            boundaryFirstViewportRequired:product.boundaryFirstViewport!==false,
            requiredSections,
            resourceEntries:performance.getEntriesByType('resource').map(entry=>entry.name),
          };
        }
        const tabs=document.querySelector('.tabs');
        return {
          title:document.title,
          documentWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
          viewport:window.innerWidth,
          smallControls,
          technicalCopyMatches:patterns.filter(([,source])=>new RegExp(source,'i').test(bodyText)).map(([label])=>label),
          safety:/110/.test(bodyText)&&/119/.test(bodyText)&&/120/.test(bodyText),
          tabStrip:tabs?{scrollWidth:tabs.scrollWidth,clientWidth:tabs.clientWidth}:null,
          productChecks,
        };
      })()`)
      checks += 1
      if (Math.max(layout.documentWidth, layout.bodyWidth) > layout.viewport + 1) failures.push(`${page.file}@${viewport.name}: body 出现横向滚动（document ${layout.documentWidth}px / body ${layout.bodyWidth}px > viewport ${layout.viewport}px）`)
      checks += 1
      if (layout.smallControls.length > 0) failures.push(`${page.file}@${viewport.name}: ${layout.smallControls.length} 个可见链接/按钮触控区域小于 44×44px：${layout.smallControls.map(item => `${item.text || '无可访问名称'}[${item.width}×${item.height}px, ${item.className || 'no-class'}]`).join('；')}`)
      checks += 1
      if (!layout.safety) failures.push(`${page.file}@${viewport.name}: 安全声明未呈现`)
      checks += 1
      if (layout.technicalCopyMatches.length > 0) failures.push(`${page.file}@${viewport.name}: 浏览器可见正文包含技术交付文案：${layout.technicalCopyMatches.join('、')}`)
      if (layout.tabStrip && viewport.width >= 768) {
        checks += 1
        if (layout.tabStrip.scrollWidth > layout.tabStrip.clientWidth + 1) failures.push(`${page.file}@${viewport.name}: .tabs 局部横向溢出（${layout.tabStrip.scrollWidth}px > ${layout.tabStrip.clientWidth}px）`)
      }
      if (page.product) {
        checks += 1
        if (!layout.productChecks?.shell) failures.push(`${page.file}@${viewport.name}: 正式页缺少 data-product-shell`)
        checks += 1
        if (!layout.productChecks?.mainActionAccessible || !layout.productChecks?.mainActionInFirstViewport) failures.push(`${page.file}@${viewport.name}: 首屏主行动 ${page.product.mainActionSelector} 不可见、不可操作或缺少可访问名称`)
        checks += 1
        if (!layout.productChecks?.boundaryAccessible || (layout.productChecks?.boundaryFirstViewportRequired && !layout.productChecks?.boundaryInFirstViewport)) failures.push(`${page.file}@${viewport.name}: 安全边界 ${page.product.boundarySelector} 不可见、语义不足或缺少 110/119/120 与“不能替代”声明`)
        if (page.product.requiredSections) {
          checks += 1
          const missingSections = layout.productChecks?.requiredSections?.filter((section) => !section.rendered).map((section) => section.selector) ?? page.product.requiredSections
          if (missingSections.length) failures.push(`${page.file}@${viewport.name}: 必需章节或文案未正确渲染：${missingSections.join('、')}`)
        }
        if (page.product.selfContained) {
          checks += 1
          if (layout.productChecks?.resourceEntries?.length) failures.push(`${page.file}@${viewport.name}: 单文件页面加载了子资源 ${layout.productChecks.resourceEntries.join('、')}`)
        }
      }
      checks += 1
      if (remoteRequests.length) failures.push(`${page.file}@${viewport.name}: 页面发起远程请求 ${remoteRequests.join('、')}`)
      checks += 1
      if (exceptions.length) failures.push(`${page.file}@${viewport.name}: JavaScript 异常 ${exceptions.join('、')}`)
      checks += 1
      if (consoleErrors.length) failures.push(`${page.file}@${viewport.name}: 控制台错误 ${consoleErrors.join('、')}`)
      checks += 1
      if (loadingFailures.length) failures.push(`${page.file}@${viewport.name}: 资源加载失败 ${loadingFailures.join('、')}`)
      if (page.product?.selfContained) {
        checks += 1
        const unexpectedRequests = allRequests.filter((url) => url !== currentDocumentUrl)
        if (unexpectedRequests.length) failures.push(`${page.file}@${viewport.name}: 单文件页面请求了主文档之外的资源 ${unexpectedRequests.join('、')}`)
      }

      if (page.interaction && preferredInteractionViewport[page.interaction] === viewport.name) {
        exceptions = []
        remoteRequests = []
        allRequests = []
        loadingFailures = []
        consoleErrors = []
        const regressionPassed = await runSafetyRegression(client, sessionId, page.interaction)
        await delay(100)
        checks += 1
        if (!regressionPassed) failures.push(`${page.file}@${viewport.name}: 安全/状态机负向回归断言失败`)
        checks += 1
        if (remoteRequests.length) failures.push(`${page.file}@${viewport.name}: 负向路径发起远程请求 ${remoteRequests.join('、')}`)
        if (exceptions.length) failures.push(`${page.file}@${viewport.name}: 负向路径触发 JavaScript 异常 ${exceptions.join('、')}`)
        if (consoleErrors.length) failures.push(`${page.file}@${viewport.name}: 负向路径产生控制台错误 ${consoleErrors.join('、')}`)
        if (loadingFailures.length) failures.push(`${page.file}@${viewport.name}: 负向路径资源加载失败 ${loadingFailures.join('、')}`)
        if (page.product?.selfContained) {
          checks += 1
          if (allRequests.length) failures.push(`${page.file}@${viewport.name}: 负向路径请求了资源 ${allRequests.join('、')}`)
        }

        exceptions = []
        remoteRequests = []
        allRequests = []
        loadingFailures = []
        consoleErrors = []
        const reloaded = client.waitFor('Page.loadEventFired', sessionId)
        await client.send('Page.navigate', { url: currentDocumentUrl }, sessionId)
        await reloaded
        await delay(100)
        const interactionResult = await runInteraction(client, sessionId, page.interaction)
        await delay(100)
        const interactionPassed = typeof interactionResult === 'object' ? interactionResult.passed : interactionResult
        checks += 1
        if (!interactionPassed) {
          const diagnostics = typeof interactionResult === 'object' ? `：${JSON.stringify(interactionResult.details)}` : ''
          failures.push(`${page.file}@${viewport.name}: 核心交互断言失败${diagnostics}`)
        }
        if (exceptions.length) failures.push(`${page.file}@${viewport.name}: 核心交互触发 JavaScript 异常 ${exceptions.join('、')}`)
        checks += 1
        if (remoteRequests.length) failures.push(`${page.file}@${viewport.name}: 核心交互发起远程请求 ${remoteRequests.join('、')}`)
        if (consoleErrors.length) failures.push(`${page.file}@${viewport.name}: 核心交互产生控制台错误 ${consoleErrors.join('、')}`)
        if (loadingFailures.length) failures.push(`${page.file}@${viewport.name}: 核心交互资源加载失败 ${loadingFailures.join('、')}`)
        if (page.product?.selfContained) {
          checks += 1
          const unexpectedRequests = allRequests.filter((url) => url !== currentDocumentUrl)
          if (unexpectedRequests.length) failures.push(`${page.file}@${viewport.name}: 核心交互请求了主文档之外的资源 ${unexpectedRequests.join('、')}`)
        }

        if (page.interaction === 'registration') {
          exceptions = []
          remoteRequests = []
          allRequests = []
          loadingFailures = []
          consoleErrors = []
          await client.send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
          }, sessionId)
          const reducedReloaded = client.waitFor('Page.loadEventFired', sessionId)
          await client.send('Page.navigate', { url: currentDocumentUrl }, sessionId)
          await reducedReloaded
          await delay(100)
          const reducedMotionPassed = await runReducedMotionRegistration(client, sessionId)
          await delay(100)
          checks += 1
          if (!reducedMotionPassed) failures.push(`${page.file}@${viewport.name}: prefers-reduced-motion 行为断言失败`)
          checks += 1
          const reducedUnexpectedRequests = allRequests.filter((url) => url !== currentDocumentUrl)
          if (remoteRequests.length || reducedUnexpectedRequests.length) failures.push(`${page.file}@${viewport.name}: reduced-motion 路径发起资源请求 ${[...remoteRequests, ...reducedUnexpectedRequests].join('、')}`)
          if (exceptions.length) failures.push(`${page.file}@${viewport.name}: reduced-motion 路径触发 JavaScript 异常 ${exceptions.join('、')}`)
          if (consoleErrors.length) failures.push(`${page.file}@${viewport.name}: reduced-motion 路径产生控制台错误 ${consoleErrors.join('、')}`)
          if (loadingFailures.length) failures.push(`${page.file}@${viewport.name}: reduced-motion 路径资源加载失败 ${loadingFailures.join('、')}`)
          await client.send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
          }, sessionId)
        }
      }

      const screenshot = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true }, sessionId)
      writeFileSync(join(screenshotDirectory, `${basename(page.file, '.html')}-${viewport.name}.png`), Buffer.from(screenshot.data, 'base64'))
    }
  }
  unsubscribe()
  await client.send('Target.closeTarget', { targetId })
  await client.send('Browser.close')
  await delay(200)

  if (failures.length) {
    console.error(`Browser offline gate FAIL: ${failures.length} 项失败，执行 ${checks} 项检查。`)
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exitCode = 1
  } else {
    console.log(`Browser offline gate PASS: ${checks} 项检查全部通过。`)
    console.log(`已验证 ${pages.length} 个页面在 375 / 768 / 1440 三类视口，并完成五条核心交互。`)
    if (keepScreenshots) console.log(`临时截图：${screenshotDirectory}`)
  }
} catch (error) {
  console.error(`Browser offline gate BLOCKED: ${error instanceof Error ? error.stack || error.message : String(error)}`)
  process.exitCode = 2
} finally {
  if (browser.exitCode === null) {
    const exited = new Promise((resolvePromise) => browser.once('exit', resolvePromise))
    browser.kill()
    await Promise.race([exited, delay(5000)])
  }
  const cleanupTarget = keepScreenshots ? profileDirectory : tempRoot
  try {
    rmSync(cleanupTarget, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 })
  } catch (error) {
    console.error(`Browser validation cleanup BLOCKED: 无法清理 ${cleanupTarget}（${error instanceof Error ? error.message : String(error)}）`)
    if (!process.exitCode) process.exitCode = 2
  }
}
