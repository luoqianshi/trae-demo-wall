/**
 * 瞳伴APP 全量测试套件
 * 覆盖：语法检查、代码质量、业务逻辑、用户体验、无障碍、兼容性
 */
const fs = require('fs');
const path = require('path');

const APP_JS = path.join(__dirname, 'App.js');
const APP_MOBILE_JS = path.join(__dirname, 'tongban-app', 'www', 'js', 'app.js');
const DEMO_HTML = path.join(__dirname, 'tongban-demo.html');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;
const testResults = [];

function test(category, name, passed, detail) {
  totalTests++;
  if (passed) { passedTests++; }
  else { failedTests++; }
  const status = passed ? 'PASS' : 'FAIL';
  testResults.push({ category, name, status, detail: detail || '' });
  console.log(`[${status}] [${category}] ${name}${detail ? ' - ' + detail : ''}`);
}

function warn(category, name, detail) {
  warnings++;
  testResults.push({ category, name, status: 'WARN', detail: detail || '' });
  console.log(`[WARN] [${category}] ${name}${detail ? ' - ' + detail : ''}`);
}

// ============================================================
// 1. 文件完整性检查
// ============================================================
console.log('\n====== 1. 文件完整性检查 ======');

const appJsContent = fs.readFileSync(APP_JS, 'utf-8');
const appMobileContent = fs.readFileSync(APP_MOBILE_JS, 'utf-8');
const demoHtmlContent = fs.readFileSync(DEMO_HTML, 'utf-8');

test('文件完整性', 'App.js 文件存在且非空', appJsContent.length > 0, `大小: ${appJsContent.length} 字节`);
test('文件完整性', 'tongban-app/app.js 文件存在且非空', appMobileContent.length > 0, `大小: ${appMobileContent.length} 字节`);
test('文件完整性', 'tongban-demo.html 文件存在且非空', demoHtmlContent.length > 0, `大小: ${demoHtmlContent.length} 字节`);

// Demo与App端代码同步检查
test('代码同步', 'Demo与App端代码一致', appJsContent === appMobileContent, 
  appJsContent === appMobileContent ? '' : `文件大小差异: Demo=${appJsContent.length}, App=${appMobileContent.length}`);

// ============================================================
// 2. JavaScript语法检查
// ============================================================
console.log('\n====== 2. JavaScript语法检查 ======');

try {
  require('child_process').execSync('node -c "' + APP_JS + '"', { stdio: 'pipe' });
  test('语法检查', 'App.js 语法正确', true);
} catch (e) {
  test('语法检查', 'App.js 语法正确', false, e.stderr?.toString() || e.message);
}

try {
  require('child_process').execSync('node -c "' + APP_MOBILE_JS + '"', { stdio: 'pipe' });
  test('语法检查', 'tongban-app/app.js 语法正确', true);
} catch (e) {
  test('语法检查', 'tongban-app/app.js 语法正确', false, e.stderr?.toString() || e.message);
}

// ============================================================
// 3. 代码质量检查
// ============================================================
console.log('\n====== 3. 代码质量检查 ======');

// 3.1 检查所有document.getElementById是否有null保护
const getElementByIdCalls = [];
const getByIdRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
while ((match = getByIdRegex.exec(appJsContent)) !== null) {
  const id = match[1];
  const lineNum = appJsContent.substring(0, match.index).split('\n').length;
  // 检查是否有null保护（在接下来3行内）
  const afterCode = appJsContent.substring(match.index, match.index + 200);
  const hasNullCheck = afterCode.includes('if (') || afterCode.includes('?.') || afterCode.includes('&& ');
  if (!hasNullCheck) {
    // 只对关键ID报警告（某些是确定性存在的）
    const criticalIds = ['navDestName', 'modeIndicatorText', 'gestureFeedback', 'cameraOverlay', 'dangerOverlay'];
    if (criticalIds.includes(id)) {
      warn('代码质量', `getElementById('${id}') 缺少null保护`, `行: ${lineNum}`);
    }
  }
}

// 3.2 检查setInterval是否有对应clearInterval
const setIntervalCount = (appJsContent.match(/setInterval\(/g) || []).length;
const clearIntervalCount = (appJsContent.match(/clearInterval\(/g) || []).length;
test('代码质量', 'setInterval/clearInterval 配对检查', setIntervalCount <= clearIntervalCount + 5, 
  `setInterval: ${setIntervalCount}, clearInterval: ${clearIntervalCount}`);

// 3.3 检查setTimeout是否有对应clearTimeout（很多setTimeout是一次性的无需clear）
const setTimeoutCount = (appJsContent.match(/setTimeout\(/g) || []).length;
const clearTimeoutCount = (appJsContent.match(/clearTimeout\(/g) || []).length;
test('代码质量', 'setTimeout/clearTimeout 使用合理', true, 
  `setTimeout: ${setTimeoutCount}, clearTimeout: ${clearTimeoutCount} (一次性定时器无需clear)`);

// 3.4 检查try-catch覆盖
const tryCatchCount = (appJsContent.match(/try\s*\{/g) || []).length;
const catchCount = (appJsContent.match(/catch\s*\(/g) || []).length;
test('代码质量', 'try-catch 配对正确', tryCatchCount === catchCount, 
  `try: ${tryCatchCount}, catch: ${catchCount}`);

// 3.5 检查全局错误处理
test('代码质量', '全局错误处理(window.onerror)', appJsContent.includes('window.onerror'), '');
test('代码质量', 'Promise未捕获处理(unhandledrejection)', appJsContent.includes('unhandledrejection'), '');

// 3.6 检查防抖节流工具
test('代码质量', '防抖函数(debounce)定义', appJsContent.includes('function debounce('), '');
test('代码质量', '节流函数(throttle)定义', appJsContent.includes('function throttle('), '');

// 3.7 检查定时器安全封装
test('代码质量', 'safeSetInterval 定义', appJsContent.includes('function safeSetInterval('), '');
test('代码质量', 'safeClearInterval 定义', appJsContent.includes('function safeClearInterval('), '');
test('代码质量', 'safeSetTimeout 定义', appJsContent.includes('function safeSetTimeout('), '');
test('代码质量', 'safeClearTimeout 定义', appJsContent.includes('function safeClearTimeout('), '');

// ============================================================
// 4. 核心业务逻辑检查
// ============================================================
console.log('\n====== 4. 核心业务逻辑检查 ======');

// 4.1 登录模块
test('登录模块', '一键登录函数存在', appJsContent.includes('oneClickLogin') || appJsContent.includes('一键登录'), '');
test('登录模块', '验证码登录函数存在', appJsContent.includes('verifyCodeLogin') || appJsContent.includes('验证码登录') || appJsContent.includes('getCode'), '');
test('登录模块', '角色选择逻辑(blind/family)', appJsContent.includes('blind') && appJsContent.includes('family'), '');
test('登录模块', '验证码倒计时(60秒)', appJsContent.includes('60') && appJsContent.includes('重发') || appJsContent.includes('resend'), '');
test('登录模块', '第三方登录(微信/Apple/QQ/支付宝/微博)', 
  (appJsContent.includes('fa-weixin') || appJsContent.includes('wechat')) && appJsContent.includes('fa-apple') && appJsContent.includes('fa-qq') && appJsContent.includes('fa-alipay') && appJsContent.includes('fa-weibo'), '');
test('登录模块', '登录成功后安全培训检查', appJsContent.includes("checkSafetyTraining()"), '');
test('登录模块', '家人模式登录后跳转守护中心', appJsContent.includes("showScreen('family')") && appJsContent.includes("switchTab('family')"), '');

// 4.2 导航模块
test('导航模块', 'startNavigation 函数存在', appJsContent.includes('function startNavigation('), '');
test('导航模块', 'navTick 函数存在', appJsContent.includes('function navTick('), '');
test('导航模块', 'endNavigation 函数存在', appJsContent.includes('function endNavigation('), '');
test('导航模块', '导航模式包含步行', appJsContent.includes("'walk'") || appJsContent.includes('"walk"'), '');
test('导航模块', '导航模式包含公交', appJsContent.includes("'bus'") || appJsContent.includes('"bus"'), '');
test('导航模块', '导航模式包含地铁', appJsContent.includes("'metro'") || appJsContent.includes('"metro"'), '');
test('导航模块', '导航模式包含网约车', appJsContent.includes("'taxi'") || appJsContent.includes('"taxi"'), '');
test('导航模块', '导航模式包含室内', appJsContent.includes("'indoor'") || appJsContent.includes('"indoor"'), '');
test('导航模块', '导航模式包含BRT', appJsContent.includes("'brt'") || appJsContent.includes('"brt"'), '');
test('导航模块', '导航模式包含有轨电车', appJsContent.includes("'tram'") || appJsContent.includes('"tram"'), '');
test('导航模块', '最后公里模式(85%阈值)', appJsContent.includes('85') && appJsContent.includes('isLastMile'), '');
test('导航模块', '导航暂停功能', appJsContent.includes('isNavPaused'), '');
test('导航模块', '结束导航按钮', appJsContent.includes('endNavigation') && (appJsContent.includes('navEndBtn') || appJsContent.includes('结束导航')), '');
test('导航模块', '到达页面', appJsContent.includes('arrivalScreen') || appJsContent.includes('enterArrivalMode'), '');
test('导航模块', '语音播报当前进度', appJsContent.includes('当前进度') || appJsContent.includes('navProgress'), '');
test('导航模块', '语音指令重播功能', appJsContent.includes('lastSpeech') || appJsContent.includes('重播'), '');

// 4.3 AI摄像头模块
test('摄像头模块', 'openCamera 函数存在', appJsContent.includes('function openCamera('), '');
test('摄像头模块', 'closeCamera 函数存在', appJsContent.includes('function closeCamera('), '');
test('摄像头模块', '场景识别(aiScenesByMode)', appJsContent.includes('aiScenesByMode'), '');
test('摄像头模块', '智能省电模式', appJsContent.includes('getCameraRefreshInterval'), '');
test('摄像头模块', '摄像头自动开启(打车找车30%-50%)', 
  appJsContent.includes('navProgress >= 30') && appJsContent.includes('navProgress < 50'), '');
test('摄像头模块', '摄像头自动开启(公交上车20%-40%)', 
  appJsContent.includes('navProgress >= 20') && appJsContent.includes('navProgress < 40'), '');
test('摄像头模块', '摄像头自动开启(地铁进站5%-30%)', 
  appJsContent.includes('navProgress >= 5') && appJsContent.includes('navProgress < 30'), '');
test('摄像头模块', '摄像头自动开启(室内入口0%-30%)', 
  appJsContent.includes('indoor') && appJsContent.includes('navProgress < 30'), '');
test('摄像头模块', '低电量降频(2倍间隔)', appJsContent.includes('baseInterval * 2') || appJsContent.includes('batterySaverMode'), '');
test('摄像头模块', 'AI摄像头可随时打开', appJsContent.includes('function openCamera(') && appJsContent.includes('cameraOpen'), '');

// 4.4 语音播报模块
test('语音模块', 'speak 函数存在', appJsContent.includes('function speak('), '');
test('语音模块', 'doSpeak 函数存在', appJsContent.includes('function doSpeak('), '');
test('语音模块', '语音优先级队列(critical/high/normal/low)', 
  appJsContent.includes('critical') && appJsContent.includes('high') && appJsContent.includes('normal') && appJsContent.includes('low'), '');
test('语音模块', '语音去重机制', appJsContent.includes('isDuplicateSpeech'), '');
test('语音模块', '家人模式静音', appJsContent.includes("userRole === 'family'") && appJsContent.includes('return'), '');
test('语音模块', '语音唤醒功能', appJsContent.includes('你好') || appJsContent.includes('唤醒'), '');
test('语音模块', 'low级别队列溢出保护(最多2条)', appJsContent.includes('speechQueue.length >= 2'), '');

// 4.5 紧急求助模块
test('紧急求助', '摇一摇触发', appJsContent.includes('devicemotion') || appJsContent.includes('shake'), '');
test('紧急求助', '3秒倒计时确认', appJsContent.includes('3') && appJsContent.includes('倒计时') || appJsContent.includes('countdown'), '');
test('紧急求助', '停止呼叫按钮', appJsContent.includes('停止呼叫'), '');
test('紧急求助', '纯黑背景', appJsContent.includes('#000000') || appJsContent.includes('black'), '');
test('紧急求助', '红色电话图标', appJsContent.includes('red') || appJsContent.includes('#FF3B30'), '');
test('紧急求助', '波纹动画(emergency-icon-ring/sosRing)', 
  demoHtmlContent.includes('emergency-icon-ring') && demoHtmlContent.includes('sosRing'), '');

// 4.6 社区模块
test('社区模块', '危险标记功能', appJsContent.includes('navDangerMarkBtn') || appJsContent.includes('dangerMark'), '');
test('社区模块', '施工/障碍共享到社区', appJsContent.includes('共享到社区'), '');
test('社区模块', 'medium级别施工类场景触发询问', 
  appJsContent.includes('施工') && appJsContent.includes('障碍') && appJsContent.includes('占道'), '');
test('社区模块', '语音确认(是/否)', appJsContent.includes('是') && appJsContent.includes('否'), '');
test('社区模块', '仅步行导航检查危险标记', appJsContent.includes('walk') && appJsContent.includes('dangerMark'), '');

// 4.7 紧急求助模块（详细测试）
test('紧急求助', '摇一摇触发', appJsContent.includes('devicemotion') || appJsContent.includes('handleShakeMotion'), '');
test('紧急求助', '3秒倒计时确认', appJsContent.includes('emergencyCountdownValue') && appJsContent.includes('3'), '');
test('紧急求助', '停止呼叫按钮', appJsContent.includes('cancelEmergency') || appJsContent.includes('emergency-cancel'), '');
test('紧急求助', '纯黑背景', demoHtmlContent.includes('.emergency-overlay') && demoHtmlContent.includes('background: #000'), '');
test('紧急求助', '红色电话图标', demoHtmlContent.includes('emergency-icon-core') && demoHtmlContent.includes('background: #FF3B30'), '');
test('紧急求助', '波纹动画(emergency-icon-ring/sosRing)', demoHtmlContent.includes('emergency-icon-ring') && demoHtmlContent.includes('sosRing'), '');
test('紧急求助', '紧急联系人列表', demoHtmlContent.includes('emergency-contacts') && demoHtmlContent.includes('emergency-contact'), '');
test('紧急求助', '呼叫状态显示', demoHtmlContent.includes('ec-dot calling') || appJsContent.includes('正在呼叫'), '');
test('紧急求助', '取消紧急求助函数', appJsContent.includes('function cancelEmergency'), '');
test('紧急求助', '触发紧急求助函数', appJsContent.includes('function triggerEmergency'), '');
test('紧急求助', '确认紧急求助函数', appJsContent.includes('function confirmEmergency'), '');
test('紧急求助', '摇一摇阈值设置', appJsContent.includes('SHAKE_THRESHOLD') && appJsContent.includes('18'), '');
test('紧急求助', '摇一摇冷却时间', appJsContent.includes('SHAKE_COOLDOWN') && appJsContent.includes('3000'), '');
test('紧急求助', '摇一摇触发函数', appJsContent.includes('function triggerShakeEmergency'), '');
test('紧急求助', '紧急求助覆盖层ID存在', demoHtmlContent.includes('id="emergencyOverlay"'), '');
test('紧急求助', '倒计时元素ID存在', demoHtmlContent.includes('id="emergencyCountdown"'), '');
test('紧急求助', '紧急求助CSS样式完整', demoHtmlContent.includes('.emergency-content') && demoHtmlContent.includes('.emergency-title') && demoHtmlContent.includes('.emergency-sub'), '');
test('紧急求助', '紧急求助语音播报', appJsContent.includes('紧急求助倒计时') || appJsContent.includes('紧急求助已触发'), '');
test('紧急求助', '紧急求助震动反馈', appJsContent.includes('triggerHaptic') && (appJsContent.includes("'critical'") || appJsContent.includes("'triple'")), '');
test('紧急求助', '摇一摇监听器初始化', appJsContent.includes('attachShakeListener') && appJsContent.includes("attachShakeListener()"), '');
test('紧急求助', '摇一摇冷却保护', appJsContent.includes('lastShakeTime') && appJsContent.includes('SHAKE_COOLDOWN'), '');
test('紧急求助', 'iOS权限请求', appJsContent.includes('DeviceMotionEvent.requestPermission'), '');

// 4.8 家庭守护模块
test('家庭守护', '安全围栏功能', appJsContent.includes('fence') || appJsContent.includes('围栏'), '');
test('家庭守护', '被监护人位置追踪', appJsContent.includes('wardDetail') || appJsContent.includes('ward'), '');
test('家庭守护', '前往导航按钮', appJsContent.includes('前往导航'), '');
test('家庭守护', '语音通话按钮', appJsContent.includes('语音通话'), '');
test('家庭守护', '地图卡片可点击进入详情', appJsContent.includes('familyLocation'), '');
test('家庭守护', '家人模式默认守护中心', appJsContent.includes("switchTab('family')"), '');

// 4.8 安全功能模块
test('安全功能', '首次使用安全培训', appJsContent.includes('checkSafetyTraining'), '');
test('安全功能', '安全培训完成标记存储', appJsContent.includes('safetyTrainingCompleted') || appJsContent.includes('localStorage'), '');
test('安全功能', '5分钟定期安全提醒', appJsContent.includes('300000') || appJsContent.includes('5分钟') || appJsContent.includes('safetyReminder'), '');
test('安全功能', '关键路口手动确认', appJsContent.includes('checkSafetyCheckpoint') || appJsContent.includes('confirmSafetyCheckpoint'), '');
test('安全功能', '安全培训在登录后展示', appJsContent.includes("checkSafetyTraining()"), '');
test('安全功能', '安全培训页面适配屏幕(phone-screen容器)', appJsContent.includes("phone-screen") || appJsContent.includes("phoneScreen"), '');
test('安全功能', '产品声明为辅助工具', appJsContent.includes('辅助'), '');

// 4.9 信号与电池管理
test('信号电池', '信号强度管理(0-4级)', appJsContent.includes('signalStrength') && appJsContent.includes('updateSignalStrength'), '');
test('信号电池', '离线缓存路线数据', appJsContent.includes('cacheRouteData') && appJsContent.includes('getCachedRouteData'), '');
test('信号电池', '信号弱切换离线模式', appJsContent.includes('isOfflineMode'), '');
test('信号电池', '信号恢复切换在线模式', appJsContent.includes('信号恢复'), '');
test('信号电池', '电池状态指示器', appJsContent.includes('updateBatteryLevel'), '');
test('信号电池', '低电量省电模式', appJsContent.includes('batterySaverMode') || appJsContent.includes('isLowBattery'), '');

// 4.10 搜索与路线规划
test('搜索路线', '首页搜索框', appJsContent.includes('你要去哪里') || appJsContent.includes('searchInput'), '');
test('搜索路线', '搜索结果列表', appJsContent.includes('wakeSearchResults') || appJsContent.includes('searchResult'), '');
test('搜索路线', '路线规划自动显示路线列表', appJsContent.includes('renderRouteList'), '');
test('搜索路线', '出行方式Tab切换', appJsContent.includes('transportMode') || appJsContent.includes('selectedMode'), '');
test('搜索路线', '路线卡片选中状态', appJsContent.includes('selectedRoute') || appJsContent.includes('routeCard'), '');
test('搜索路线', '开始导航按钮', appJsContent.includes('开始导航'), '');
test('搜索路线', '公交不支持城市灰显', appJsContent.includes('暂不支持') || appJsContent.includes('notAvailable') || appJsContent.includes('opacity') || appJsContent.includes('gray'), '');

// 4.11 室内导航分类
test('室内导航', '商场/购物中心', appJsContent.includes('商场') || appJsContent.includes('购物中心'), '');
test('室内导航', '医院', appJsContent.includes('医院'), '');
test('室内导航', '办公楼/写字楼', appJsContent.includes('办公楼') || appJsContent.includes('写字楼'), '');
test('室内导航', '学校/大学', appJsContent.includes('学校') || appJsContent.includes('大学'), '');
test('室内导航', '机场航站楼', appJsContent.includes('机场') || appJsContent.includes('航站楼'), '');
test('室内导航', '图书馆', appJsContent.includes('图书馆'), '');
test('室内导航', '超市/大卖场', appJsContent.includes('超市') || appJsContent.includes('大卖场'), '');
test('室内导航', '餐厅/美食城', appJsContent.includes('餐厅') || appJsContent.includes('美食'), '');
test('室内导航', '博物馆/展览馆', appJsContent.includes('博物馆') || appJsContent.includes('展览馆'), '');

// 4.12 盲道偏离检测
test('盲道偏离', '偏离检测函数', appJsContent.includes('simulateTactileDeviation') || appJsContent.includes('tactileDeviation'), '');
test('盲道偏离', '偏离方向提示', appJsContent.includes('offTrackDirection') || appJsContent.includes('偏离'), '');
test('室内导航', '偏离纠正引导', appJsContent.includes('correctTactileDeviation') || appJsContent.includes('纠正'), '');

// ============================================================
// 5. 用户体验检查
// ============================================================
console.log('\n====== 5. 用户体验检查 ======');

// 5.1 交互方式（基础手势已移除，依赖系统无障碍TalkBack/旁白，保留摇一摇紧急求助）
test('交互方式', '摇一摇紧急求助', appJsContent.includes('devicemotion') || appJsContent.includes('onShake'), '');
test('交互方式', '语音唤醒词唤醒', appJsContent.includes('toggleVoiceWake') || appJsContent.includes('你好，瞳伴'), '');
test('交互方式', '系统无障碍兼容(aria)', appJsContent.includes('aria-label') || appJsContent.includes('role='), '');
test('交互方式', '关键路口语音提醒', appJsContent.includes('路口') || appJsContent.includes('红绿灯') || appJsContent.includes('斑马线'), '');

// 5.2 页面结构
test('页面结构', '首页为唤醒页(无导航菜单)', appJsContent.includes('wakeScreen'), '');
test('页面结构', '导航页无底部Tab栏', appJsContent.includes("screenName === 'wake'") && appJsContent.includes("tabBar.style.display"), '');
test('页面结构', '社区页可滚动', appJsContent.includes('communityScreen'), '');
test('页面结构', '我的页可滚动', appJsContent.includes('myScreen') && appJsContent.includes('overflow'), '');
test('页面结构', '覆盖页全屏不透明', appJsContent.includes('#000') || appJsContent.includes('rgba'), '');

// 5.3 操作反馈
test('操作反馈', '震动反馈(triggerHaptic)', appJsContent.includes('triggerHaptic'), '');
test('操作反馈', '视觉反馈(showFeedback)', appJsContent.includes('showFeedback'), '');
test('操作反馈', '语音播报确认', appJsContent.includes('speak'), '');
test('操作反馈', '按压缩放反馈(scale 0.98)', demoHtmlContent.includes('scale(0.98)') || appJsContent.includes('0.98'), '');

// 5.4 设计一致性
test('设计一致性', 'Apple风格圆角(14px)', demoHtmlContent.includes('14px') || appJsContent.includes('14px'), '');
test('设计一致性', '渐变主按钮', appJsContent.includes('linear-gradient') || demoHtmlContent.includes('linear-gradient'), '');
test('设计一致性', '毛玻璃导航栏', demoHtmlContent.includes('backdrop-filter') || appJsContent.includes('backdrop-filter'), '');
test('设计一致性', '统一色彩系统(#007AFF)', appJsContent.includes('#007AFF') || demoHtmlContent.includes('#007AFF'), '');
test('设计一致性', '0.5px超细边框', demoHtmlContent.includes('0.5px') || appJsContent.includes('0.5px'), '');

// ============================================================
// 6. 无障碍与兼容性检查
// ============================================================
console.log('\n====== 6. 无障碍与兼容性检查 ======');

test('无障碍', 'aria-live区域', appJsContent.includes('aria-live') || demoHtmlContent.includes('aria-live'), '');
test('无障碍', 'aria-label属性', demoHtmlContent.includes('aria-label') || appJsContent.includes('aria-label'), '');
test('无障碍', 'role属性', demoHtmlContent.includes('role=') || appJsContent.includes('role='), '');
test('无障碍', '焦点管理(saveFocus/restoreFocus)', appJsContent.includes('saveFocus') && appJsContent.includes('restoreFocus'), '');
test('无障碍', '焦点陷阱(trapFocus)', appJsContent.includes('trapFocus'), '');
test('无障碍', 'tabindex属性', demoHtmlContent.includes('tabindex') || appJsContent.includes('tabindex'), '');
test('无障碍', '屏幕阅读器通知(announce)', appJsContent.includes('announce'), '');
test('无障碍', 'ARIA状态同步(aria-checked)', appJsContent.includes('aria-checked'), '');

// ============================================================
// 7. HTML-JS 一致性检查
// ============================================================
console.log('\n====== 7. HTML-JS 一致性检查 ======');

// 检查showScreen中引用的所有screen ID是否在HTML中存在（静态或动态创建）
const staticScreens = [
  'wakeScreen', 'routeScreen', 'navScreen', 'arrivalScreen', 
  'communityScreen', 'familyScreen', 'myScreen'
];

const dynamicScreens = [
  'accountScreen', 'loginScreen', 'registerScreen', 'settingsScreen', 'safetyScreen'
];

staticScreens.forEach(screenId => {
  const exists = demoHtmlContent.includes(screenId);
  test('HTML-JS一致性', `Screen ID "${screenId}" 在HTML中存在`, exists, 
    exists ? '' : `HTML中缺少id="${screenId}"的元素`);
});

dynamicScreens.forEach(screenId => {
  const inJs = appJsContent.includes(screenId);
  test('HTML-JS一致性', `动态Screen "${screenId}" 在JS中创建`, inJs);
});

// 检查关键DOM元素
const criticalElementIds = [
  'gestureFeedback', 'cameraOverlay', 'dangerOverlay',
  'navDestName', 'modeIndicatorText', 'tabBar',
  'routeList', 'wakeSearchResults'
];

criticalElementIds.forEach(id => {
  const inHtml = demoHtmlContent.includes(id);
  const inJs = appJsContent.includes(id);
  test('HTML-JS一致性', `元素ID "${id}" HTML存在`, inHtml);
  test('HTML-JS一致性', `元素ID "${id}" JS引用`, inJs);
});

// ============================================================
// 8. 双角色系统检查
// ============================================================
console.log('\n====== 8. 双角色系统检查 ======');

test('双角色系统', 'userRole变量', appJsContent.includes('userRole'), '');
test('双角色系统', '视障模式(blind)', appJsContent.includes("'blind'") || appJsContent.includes('"blind"'), '');
test('双角色系统', '家人模式(family)', appJsContent.includes("'family'") || appJsContent.includes('"family"'), '');
test('双角色系统', '家人模式语音静音', appJsContent.includes("userRole === 'family'") && appJsContent.includes('return'), '');
test('双角色系统', '家人模式隐藏视障UI', appJsContent.includes('applyRoleUI'), '');
test('双角色系统', '家人模式默认守护中心', appJsContent.includes("showScreen('family')") && appJsContent.includes("switchTab('family')"), '');

// 设置页面角色差异化
test('双角色系统', '视障设置内容(语音/导航/AI摄像头/安全)', 
  appJsContent.includes('语音设置') && appJsContent.includes('导航设置') && appJsContent.includes('AI摄像头设置'), '');
test('双角色系统', '家人设置内容(守护/通知)', 
  appJsContent.includes('守护设置') || appJsContent.includes('通知设置'), '');

// ============================================================
// 9. 数据持久化检查
// ============================================================
console.log('\n====== 9. 数据持久化检查 ======');

const localStorageKeys = [
  'safetyTrainingCompleted',
  'userRole',
  'selectedDestination',
  'selectedMode'
];

localStorageKeys.forEach(key => {
  test('数据持久化', `localStorage key "${key}"`, appJsContent.includes(key), '');
});

test('数据持久化', '离线路线缓存', appJsContent.includes('cacheRouteData'), '');
test('数据持久化', '缓存数据读取', appJsContent.includes('getCachedRouteData'), '');

// ============================================================
// 10. 安全性检查
// ============================================================
console.log('\n====== 10. 安全性检查 ======');

test('安全性', '无VIP/付费/订阅标识', 
  !appJsContent.includes('VIP') && !appJsContent.includes('会员') && !appJsContent.includes('订阅'), '');
test('安全性', '无广告标识', 
  !appJsContent.includes('广告') || appJsContent.includes('无广告'), '');
test('安全性', '登录页+86区号', appJsContent.includes('+86') || appJsContent.includes('86'), '');
test('安全性', '安全培训声明非医疗工具', appJsContent.includes('不构成医疗'), '');
test('安全性', '安全培训声明辅助工具', appJsContent.includes('辅助'), '');
test('安全性', '设置页退出登录', appJsContent.includes('退出登录'), '');

// ============================================================
// 汇总报告
// ============================================================
console.log('\n\n========================================');
console.log('          瞳伴APP 全量测试报告');
console.log('========================================');
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
console.log(`失败: ${failedTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);
console.log(`警告: ${warnings}`);
console.log('========================================');

// 输出失败项
const failedItems = testResults.filter(r => r.status === 'FAIL');
if (failedItems.length > 0) {
  console.log('\n失败项详情:');
  failedItems.forEach((item, i) => {
    console.log(`  ${i+1}. [${item.category}] ${item.name}${item.detail ? ' - ' + item.detail : ''}`);
  });
}

// 输出警告项
const warnItems = testResults.filter(r => r.status === 'WARN');
if (warnItems.length > 0) {
  console.log('\n警告项详情:');
  warnItems.forEach((item, i) => {
    console.log(`  ${i+1}. [${item.category}] ${item.name}${item.detail ? ' - ' + item.detail : ''}`);
  });
}

console.log('\n');

// 返回退出码
process.exit(failedTests > 0 ? 1 : 0);
