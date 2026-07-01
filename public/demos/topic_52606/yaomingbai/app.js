/**
 * 药明白 - 老年人药品说明书AI解读助手
 * TRAE AI创造力大赛参赛作品
 */

// ==================== 全局状态 ====================
let currentImage = null;
let currentOCRText = '';
let currentDrugInfo = null;
let isLargeFont = true;
let tesseractWorker = null;

// ==================== 页面导航 ====================
function showPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新底部导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    const pageMap = { 'home': 0, 'scan': 1, 'drugs': 2, 'reminders': 3, 'about': 4 };
    if (pageMap[pageName] !== undefined && navItems[pageMap[pageName]]) {
        navItems[pageMap[pageName]].classList.add('active');
    }
    
    // 特定页面初始化
    if (pageName === 'drugs') {
        renderDrugList();
    } else if (pageName === 'reminders') {
        renderReminderList();
    }
}

// ==================== 字体大小切换 ====================
function toggleFontSize() {
    isLargeFont = !isLargeFont;
    document.body.classList.toggle('large-text', isLargeFont);
    showToast(isLargeFont ? '已切换为大字体模式' : '已切换为标准字体');
}

// ==================== 文件上传处理 ====================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImage = e.target.result;
        document.getElementById('previewImg').src = currentImage;
        showScanStep(2);
    };
    reader.readAsDataURL(file);
}

// ==================== 示例图片（用于演示）====================
function useDemoImage() {
    // 使用一张包含药品说明书的示例图片（使用base64编码的简单图片或从网络加载）
    showToast('正在加载示例...');
    
    // 由于没有真实的示例图片，我们直接模拟OCR结果
    setTimeout(() => {
        simulateDemoResult();
    }, 800);
}

function simulateDemoResult() {
    currentOCRText = `阿莫西林胶囊
Amoxicillin Capsules

【适应症】
适用于敏感菌所致的下列感染：
1. 上呼吸道感染
2. 泌尿生殖道感染
3. 皮肤软组织感染

【用法用量】
口服。成人一次0.5g，每6-8小时1次，一日剂量不超过4g。
小儿一日剂量按体重20-40mg/kg，每8小时1次。

【不良反应】
1. 恶心、呕吐、腹泻等胃肠道反应
2. 皮疹、药物热等过敏反应
3. 贫血、血小板减少

【禁忌】
1. 青霉素过敏者禁用
2. 传染性单核细胞增多症患者禁用

【注意事项】
1. 用前需做青霉素皮试
2. 疗程较长者应检查肝肾功能
3. 孕妇及哺乳期妇女慎用`;

    const drugInfo = analyzeDrugText(currentOCRText);
    displayResult(drugInfo);
    showScanStep(4);
    showToast('示例加载完成！');
}

// ==================== 扫描步骤控制 ====================
function showScanStep(step) {
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`scan-step${i}`);
        if (el) el.style.display = i === step ? 'block' : 'none';
        
        const dot = document.getElementById(`step${i}`);
        if (dot) {
            dot.classList.remove('active', 'completed');
            if (i < step) dot.classList.add('completed');
            if (i === step) dot.classList.add('active');
        }
    }
}

function resetScan() {
    currentImage = null;
    currentOCRText = '';
    currentDrugInfo = null;
    document.getElementById('fileInput').value = '';
    showScanStep(1);
}

// ==================== OCR识别 ====================
async function startOCR() {
    if (!currentImage) {
        showToast('请先上传图片');
        return;
    }
    
    showScanStep(3);
    document.getElementById('ocrStatus').textContent = '正在初始化识别引擎...';
    
    try {
        // 使用Tesseract.js进行OCR识别
        document.getElementById('ocrStatus').textContent = '正在识别文字，请稍候...';
        
        const result = await Tesseract.recognize(
            currentImage,
            'chi_sim+eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        document.getElementById('ocrStatus').textContent = 
                            `正在识别... ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        );
        
        currentOCRText = result.data.text;
        
        if (!currentOCRText || currentOCRText.trim().length < 10) {
            throw new Error('未能识别到足够文字，请尝试上传更清晰的图片');
        }
        
        document.getElementById('ocrStatus').textContent = '识别完成，正在分析...';
        
        // 分析药品信息
        const drugInfo = analyzeDrugText(currentOCRText);
        displayResult(drugInfo);
        
        showScanStep(4);
        showToast('识别成功！');
        
    } catch (error) {
        console.error('OCR错误:', error);
        showToast('识别失败：' + error.message);
        showScanStep(2);
    }
}

// ==================== AI药品文本分析 ====================
function analyzeDrugText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 提取药品名称（第一行通常包含）
    let drugName = '未知药品';
    for (const line of lines) {
        if (line.includes('胶囊') || line.includes('片') || line.includes('颗粒') || 
            line.includes('口服液') || line.includes('注射液') || line.includes('软胶囊')) {
            drugName = line.replace(/[【\[\]]/g, '').trim();
            if (drugName.length > 2 && drugName.length < 30) break;
        }
    }
    // 如果上面没找到，尝试第一行
    if (drugName === '未知药品' && lines.length > 0) {
        drugName = lines[0].substring(0, 25);
    }
    
    // 提取用法用量
    let usage = '请仔细阅读说明书或遵医嘱';
    const usageKeywords = ['用法用量', '用法', '用量', '口服', '一次', '一日', '每次'];
    for (let i = 0; i < lines.length; i++) {
        if (usageKeywords.some(k => lines[i].includes(k))) {
            // 收集接下来几行
            const usageLines = [];
            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                if (lines[j].length > 3) usageLines.push(lines[j]);
            }
            usage = usageLines.join('；').substring(0, 200);
            break;
        }
    }
    
    // 提取注意事项
    let precautions = '暂无特殊注意事项';
    const precautionKeywords = ['注意事项', '注意', '慎用', '皮试', '肝肾功能'];
    for (let i = 0; i < lines.length; i++) {
        if (precautionKeywords.some(k => lines[i].includes(k))) {
            const precautionLines = [];
            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                if (lines[j].length > 3) precautionLines.push(lines[j]);
            }
            precautions = precautionLines.join('；').substring(0, 200);
            break;
        }
    }
    
    // 提取禁忌
    let contraindications = '暂无明确禁忌';
    const contraindicationKeywords = ['禁忌', '禁用', '过敏者禁用', '禁用人群'];
    for (let i = 0; i < lines.length; i++) {
        if (contraindicationKeywords.some(k => lines[i].includes(k))) {
            const contraindicationLines = [];
            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                if (lines[j].length > 3) contraindicationLines.push(lines[j]);
            }
            contraindications = contraindicationLines.join('；').substring(0, 200);
            break;
        }
    }
    
    // 提取不良反应
    let sideEffects = '暂无记录';
    const sideEffectKeywords = ['不良反应', '副作用', '反应'];
    for (let i = 0; i < lines.length; i++) {
        if (sideEffectKeywords.some(k => lines[i].includes(k))) {
            const sideEffectLines = [];
            for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                if (lines[j].length > 3) sideEffectLines.push(lines[j]);
            }
            sideEffects = sideEffectLines.join('；').substring(0, 200);
            break;
        }
    }
    
    // AI智能总结
    const summary = generateAISummary(drugName, usage, precautions, contraindications, sideEffects);
    
    return {
        name: drugName,
        usage: usage,
        precautions: precautions,
        contraindications: contraindications,
        sideEffects: sideEffects,
        summary: summary,
        rawText: text,
        analyzedAt: new Date().toLocaleString('zh-CN')
    };
}

function generateAISummary(name, usage, precautions, contraindications, sideEffects) {
    let summary = `【${name}】`;
    
    // 提取核心用法
    const dosageMatch = usage.match(/(一次|每次|口服)[^，；。]*/);
    if (dosageMatch) {
        summary += `，建议${dosageMatch[0]}`;
    }
    
    // 提取禁忌提示
    if (contraindications.includes('过敏') || contraindications.includes('禁用')) {
        summary += '。重要提醒：过敏者禁用，使用前请咨询医生';
    }
    
    // 提取注意事项
    if (precautions.includes('皮试')) {
        summary += '；使用前需做皮试';
    }
    if (precautions.includes('孕妇') || precautions.includes('哺乳期')) {
        summary += '；孕妇及哺乳期妇女慎用';
    }
    
    summary += '。请严格按照医嘱服用，如有不适及时就医。';
    
    return summary;
}

// ==================== 显示结果 ====================
function displayResult(drugInfo) {
    currentDrugInfo = drugInfo;
    
    document.getElementById('drugNameBadge').textContent = drugInfo.name.substring(0, 10);
    document.getElementById('drugName').textContent = drugInfo.name;
    document.getElementById('usage').textContent = drugInfo.usage;
    document.getElementById('precautions').textContent = drugInfo.precautions;
    document.getElementById('contraindications').textContent = drugInfo.contraindications;
    document.getElementById('sideEffects').textContent = drugInfo.sideEffects;
    document.getElementById('aiSummary').textContent = drugInfo.summary;
}

// ==================== 语音播报 ====================
function speakResult() {
    if (!currentDrugInfo) return;
    
    if (!window.speechSynthesis) {
        showToast('您的浏览器不支持语音播报');
        return;
    }
    
    // 停止之前的播报
    window.speechSynthesis.cancel();
    
    const text = `药品名称：${currentDrugInfo.name}。用法用量：${currentDrugInfo.usage}。注意事项：${currentDrugInfo.precautions}。禁忌：${currentDrugInfo.contraindications}。不良反应：${currentDrugInfo.sideEffects}。${currentDrugInfo.summary}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; // 稍慢，适合老年人
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const btn = document.getElementById('speechBtn');
    btn.classList.add('speaking');
    
    utterance.onend = () => {
        btn.classList.remove('speaking');
    };
    
    utterance.onerror = () => {
        btn.classList.remove('speaking');
        showToast('语音播报失败');
    };
    
    window.speechSynthesis.speak(utterance);
}

// ==================== 药品收藏 ====================
function saveDrug() {
    if (!currentDrugInfo) {
        showToast('没有可收藏的药品');
        return;
    }
    
    const drugs = getDrugs();
    
    // 检查是否已存在
    const exists = drugs.some(d => d.name === currentDrugInfo.name);
    if (exists) {
        showToast('该药品已收藏');
        return;
    }
    
    drugs.push({
        ...currentDrugInfo,
        savedAt: new Date().toLocaleString('zh-CN')
    });
    
    localStorage.setItem('yaomingbai_drugs', JSON.stringify(drugs));
    showToast('收藏成功！');
}

function getDrugs() {
    try {
        return JSON.parse(localStorage.getItem('yaomingbai_drugs') || '[]');
    } catch {
        return [];
    }
}

function renderDrugList() {
    const drugs = getDrugs();
    const container = document.getElementById('drugList');
    
    if (drugs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="icon-circle bg-gray-100 text-gray-400 text-4xl mb-4">
                    <i class="fas fa-box-open"></i>
                </div>
                <p class="elder-text text-gray-500">还没有收藏药品</p>
                <p class="text-gray-400 mt-2">解读药品后可以收藏到这里</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = drugs.map((drug, index) => `
        <div class="drug-item">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-amber-900 text-xl">${drug.name}</h3>
                <button onclick="deleteDrug(${index})" class="text-red-400 hover:text-red-600 p-2">
                    <i class="fas fa-trash-alt text-lg"></i>
                </button>
            </div>
            <p class="text-amber-700 mb-2"><i class="fas fa-clock mr-1"></i> ${drug.savedAt}</p>
            <div class="bg-amber-50 rounded-xl p-3 mb-2">
                <p class="text-amber-800 font-bold">用法用量：</p>
                <p class="elder-text text-sm">${drug.usage.substring(0, 100)}${drug.usage.length > 100 ? '...' : ''}</p>
            </div>
            <button onclick="loadDrugDetail(${index})" class="elder-btn elder-btn-primary w-full text-base py-3">
                <i class="fas fa-eye mr-2"></i> 查看详情
            </button>
        </div>
    `).join('');
}

function deleteDrug(index) {
    if (!confirm('确定要删除这个药品吗？')) return;
    
    const drugs = getDrugs();
    drugs.splice(index, 1);
    localStorage.setItem('yaomingbai_drugs', JSON.stringify(drugs));
    renderDrugList();
    showToast('已删除');
}

function loadDrugDetail(index) {
    const drugs = getDrugs();
    if (drugs[index]) {
        currentDrugInfo = drugs[index];
        displayResult(currentDrugInfo);
        showPage('scan');
        showScanStep(4);
    }
}

// ==================== 用药提醒 ====================
function getReminders() {
    try {
        return JSON.parse(localStorage.getItem('yaomingbai_reminders') || '[]');
    } catch {
        return [];
    }
}

function renderReminderList() {
    const reminders = getReminders();
    const container = document.getElementById('reminderList');
    
    if (reminders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="icon-circle bg-gray-100 text-gray-400 text-4xl mb-4">
                    <i class="fas fa-bell-slash"></i>
                </div>
                <p class="elder-text text-gray-500">还没有设置提醒</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reminders.map((reminder, index) => `
        <div class="reminder-item">
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-green-900 text-xl">${reminder.drugName}</h3>
                <div class="flex items-center gap-3">
                    <div class="switch-toggle ${reminder.enabled !== false ? 'on' : ''}" onclick="toggleReminder(${index})"></div>
                    <button onclick="deleteReminder(${index})" class="text-red-400 hover:text-red-600 p-2">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <p class="text-green-700 mb-1"><i class="fas fa-clock mr-1"></i> 每天 ${reminder.time}</p>
            <p class="text-green-700"><i class="fas fa-pills mr-1"></i> ${reminder.dose}</p>
        </div>
    `).join('');
}

function showAddReminder() {
    document.getElementById('addReminderModal').classList.remove('hidden');
    // 如果有当前药品，自动填充
    if (currentDrugInfo) {
        document.getElementById('reminderDrugName').value = currentDrugInfo.name;
    }
}

function hideAddReminder() {
    document.getElementById('addReminderModal').classList.add('hidden');
    // 清空表单
    document.getElementById('reminderDrugName').value = '';
    document.getElementById('reminderTime').value = '';
    document.getElementById('reminderDose').value = '';
    document.getElementById('reminderRepeat').value = 'daily';
}

function addReminder() {
    const drugName = document.getElementById('reminderDrugName').value.trim();
    const time = document.getElementById('reminderTime').value;
    const dose = document.getElementById('reminderDose').value.trim();
    const repeat = document.getElementById('reminderRepeat').value;
    
    if (!drugName || !time) {
        showToast('请填写药品名称和服用时间');
        return;
    }
    
    const reminders = getReminders();
    reminders.push({
        drugName,
        time,
        dose: dose || '按说明书服用',
        repeat,
        enabled: true,
        createdAt: new Date().toLocaleString('zh-CN')
    });
    
    localStorage.setItem('yaomingbai_reminders', JSON.stringify(reminders));
    hideAddReminder();
    renderReminderList();
    showToast('提醒设置成功！');
}

function toggleReminder(index) {
    const reminders = getReminders();
    if (reminders[index]) {
        reminders[index].enabled = reminders[index].enabled === false ? true : false;
        localStorage.setItem('yaomingbai_reminders', JSON.stringify(reminders));
        renderReminderList();
    }
}

function deleteReminder(index) {
    if (!confirm('确定要删除这个提醒吗？')) return;
    
    const reminders = getReminders();
    reminders.splice(index, 1);
    localStorage.setItem('yaomingbai_reminders', JSON.stringify(reminders));
    renderReminderList();
    showToast('已删除');
}

function setReminderFromResult() {
    if (!currentDrugInfo) {
        showToast('请先识别药品');
        return;
    }
    showPage('reminders');
    showAddReminder();
}

// ==================== 工具函数 ====================
function showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-amber-800 text-white px-6 py-3 rounded-2xl shadow-lg z-50 text-lg font-bold';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    // 检查浏览器支持
    if (!window.speechSynthesis) {
        console.log('浏览器不支持语音合成');
    }
    
    // 初始化页面
    showPage('home');
    
    console.log('药明白 - 已加载完成');
});
