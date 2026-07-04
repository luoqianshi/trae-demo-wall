// 全局状态管理
const AppState = {
    currentPage: 'home',
    selectedDialect: 'cantonese',
    selectedStyle: 'ink',
    audioBlob: null,
    rawText: '',
    polishedStory: null,
    pictureBook: null,
    apiConfig: {
        xunfeiAppId: '',
        xunfeiKey: '',
        llmKey: '',
        imageKey: ''
    }
};

// ========== Toast提示系统 ==========
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========== API配置面板 ==========
function toggleApiPanel() {
    const panel = document.getElementById('apiConfigPanel');
    panel.classList.toggle('open');

    // 加载已保存的配置
    if (panel.classList.contains('open')) {
        loadApiConfig();
    }
}

function loadApiConfig() {
    const saved = localStorage.getItem('xiangyin_api_config');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('cfgXunfeiAppId').value = config.xunfeiAppId || '';
        document.getElementById('cfgXunfeiKey').value = config.xunfeiKey || '';
        document.getElementById('cfgLLMKey').value = config.llmKey || '';
        document.getElementById('cfgImageKey').value = config.imageKey || '';
        AppState.apiConfig = config;
        updateConfigStatus();
    }
}

function saveApiConfig() {
    const config = {
        xunfeiAppId: document.getElementById('cfgXunfeiAppId').value.trim(),
        xunfeiKey: document.getElementById('cfgXunfeiKey').value.trim(),
        llmKey: document.getElementById('cfgLLMKey').value.trim(),
        imageKey: document.getElementById('cfgImageKey').value.trim()
    };

    localStorage.setItem('xiangyin_api_config', JSON.stringify(config));
    AppState.apiConfig = config;
    updateConfigStatus();
    showToast('API配置已保存', 'success');
    toggleApiPanel();
}

function updateConfigStatus() {
    const config = AppState.apiConfig;

    // 讯飞状态
    const xunfeiStatus = document.getElementById('statusXunfei');
    if (config.xunfeiAppId && config.xunfeiKey) {
        xunfeiStatus.textContent = '已配置';
        xunfeiStatus.className = 'config-status ok';
        document.getElementById('cfgXunfeiAppId').classList.add('configured');
        document.getElementById('cfgXunfeiKey').classList.add('configured');
    } else {
        xunfeiStatus.textContent = '未配置';
        xunfeiStatus.className = 'config-status pending';
        document.getElementById('cfgXunfeiAppId').classList.remove('configured');
        document.getElementById('cfgXunfeiKey').classList.remove('configured');
    }

    // LLM状态
    const llmStatus = document.getElementById('statusLLM');
    if (config.llmKey) {
        llmStatus.textContent = '已配置';
        llmStatus.className = 'config-status ok';
        document.getElementById('cfgLLMKey').classList.add('configured');
    } else {
        llmStatus.textContent = '未配置';
        llmStatus.className = 'config-status pending';
        document.getElementById('cfgLLMKey').classList.remove('configured');
    }

    // 绘图状态
    const imageStatus = document.getElementById('statusImage');
    if (config.imageKey) {
        imageStatus.textContent = '已配置';
        imageStatus.className = 'config-status ok';
        document.getElementById('cfgImageKey').classList.add('configured');
    } else {
        imageStatus.textContent = '未配置';
        imageStatus.className = 'config-status pending';
        document.getElementById('cfgImageKey').classList.remove('configured');
    }
}

// ========== 按钮波纹效果 ==========
function addRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// 为所有按钮添加波纹效果
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-primary, .btn-outline, .btn-record').forEach(btn => {
        btn.addEventListener('click', addRippleEffect);
    });
});

// 页面导航
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    AppState.currentPage = pageId;
    window.scrollTo(0, 0);
}

function goHome() {
    navigateTo('page-home');
}

function goToRecord() {
    navigateTo('page-record');
}

function goToStory() {
    navigateTo('page-story');
}

// 开始创作
function startCreate() {
    navigateTo('page-record');
}

// 方言选择
document.addEventListener('DOMContentLoaded', () => {
    const dialectBtns = document.querySelectorAll('.dialect-btn');
    dialectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dialectBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.selectedDialect = btn.dataset.dialect;
        });
    });

    // 初始化录音器
    initRecorder();
});

// 录音器初始化
let recorder = null;
let waveAnimation = null;

async function initRecorder() {
    recorder = new AudioRecorder();
    waveAnimation = new WaveAnimation();
    
    // 设置录音完成回调
    recorder.onRecordingComplete = handleRecordingComplete;
}

// 页面离开时清理录音器资源
window.addEventListener('beforeunload', () => {
    if (recorder) {
        recorder.cleanup();
    }
});

// 切换录音状态
async function toggleRecord() {
    const btnRecord = document.getElementById('btnRecord');
    const recordHint = document.getElementById('recordHint');
    
    if (!recorder.isRecording) {
        // 开始录音
        const success = await recorder.startRecording();
        if (success) {
            btnRecord.classList.add('recording');
            btnRecord.querySelector('.record-text').textContent = '停止录制';
            recordHint.textContent = '正在录制，请讲述您的故事...';
            waveAnimation.start();
        }
    } else {
        // 停止录音
        recorder.stopRecording();
        btnRecord.classList.remove('recording');
        btnRecord.querySelector('.record-text').textContent = '开始录制';
        recordHint.textContent = '录制完成，正在识别...';
        waveAnimation.stop();
    }
}

// 录音完成处理
async function handleRecordingComplete(audioBlob) {
    AppState.audioBlob = audioBlob;
    
    // 显示识别中状态
    const nextStepArea = document.getElementById('nextStepArea');
    nextStepArea.style.display = 'block';
    document.getElementById('recognizedContent').innerHTML = '<div class="loading-spinner"></div><p>正在识别方言...</p>';
    
    try {
        // 调用方言识别API
        const result = await API.recognizeDialect(audioBlob, AppState.selectedDialect);
        
        if (result.success) {
            AppState.rawText = result.text;
            document.getElementById('recognizedContent').textContent = result.text;
            document.getElementById('editText').value = result.text;
            document.getElementById('recordHint').textContent = '识别完成！您可以修改后生成绘本';
        } else {
            throw new Error('识别失败');
        }
    } catch (error) {
        console.error('识别错误:', error);
        document.getElementById('recognizedContent').textContent = '识别失败，请手动输入文字';
    }
}

// 文件上传处理
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const audioBlob = new Blob([file], { type: file.type });
        handleRecordingComplete(audioBlob);
    }
}

// 提交文字
function submitText() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) {
        showToast('请输入故事内容', 'error');
        return;
    }
    
    AppState.rawText = text;
    
    const nextStepArea = document.getElementById('nextStepArea');
    nextStepArea.style.display = 'block';
    document.getElementById('recognizedContent').textContent = text;
    document.getElementById('editText').value = text;
}

// 生成故事
async function generateStory() {
    const editText = document.getElementById('editText').value.trim();
    if (!editText) {
        showToast('请先输入或修改故事内容', 'error');
        return;
    }
    
    AppState.rawText = editText;
    
    // 跳转到故事页面
    navigateTo('page-story');
    
    // 显示加载状态
    document.getElementById('storyLoading').style.display = 'block';
    document.getElementById('storyResult').style.display = 'none';
    
    try {
        // 调用大模型API润色故事
        const story = await API.polishStory(editText, AppState.selectedDialect);
        AppState.polishedStory = story;
        
        // 显示结果
        document.getElementById('storyLoading').style.display = 'none';
        document.getElementById('storyResult').style.display = 'block';
        document.getElementById('storyTitle').textContent = story.title;
        document.getElementById('storyContent').textContent = story.content;
    } catch (error) {
        console.error('故事生成错误:', error);
        showToast('故事生成失败，请重试', 'error');
        goHome();
    }
}

// 选择绘本风格
function selectStyle(btn) {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    AppState.selectedStyle = btn.dataset.style;
}

// 生成绘本
async function generatePictureBook() {
    if (!AppState.polishedStory) {
        showToast('请先生成故事', 'error');
        return;
    }
    
    // 跳转到绘本页面
    navigateTo('page-book');
    
    // 显示加载状态
    document.getElementById('bookLoading').style.display = 'block';
    document.getElementById('bookContent').style.display = 'none';
    document.getElementById('bookActions').style.display = 'none';
    
    try {
        // 将故事分成多个段落
        const paragraphs = AppState.polishedStory.content.split('\n\n').filter(p => p.trim());
        
        // 为每个段落生成插图
        const pages = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const illustration = await API.generateIllustration(paragraphs[i], AppState.selectedStyle);
            pages.push({
                text: paragraphs[i],
                illustration: illustration
            });
        }
        
        AppState.pictureBook = {
            title: AppState.polishedStory.title,
            pages: pages,
            dialect: getDialectName(AppState.selectedDialect),
            date: new Date().toLocaleDateString('zh-CN')
        };
        
        // 渲染绘本
        renderPictureBook();
        
        // 显示结果
        document.getElementById('bookLoading').style.display = 'none';
        document.getElementById('bookContent').style.display = 'block';
        document.getElementById('bookActions').style.display = 'flex';
        
        showToast('绘本生成完成！', 'success');
    } catch (error) {
        console.error('绘本生成错误:', error);
        showToast('绘本生成失败，请重试', 'error');
        goToStory();
    }
}

// 渲染绘本
function renderPictureBook() {
    const book = AppState.pictureBook;
    
    // 封面
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = '讲述者：匿名老人';
    document.getElementById('bookDialect').textContent = book.dialect;
    
    // 内页
    const pagesContainer = document.getElementById('bookPages');
    pagesContainer.innerHTML = '';
    
    book.pages.forEach((page, index) => {
        const pageElement = document.createElement('div');
        pageElement.className = 'book-page book-inner-page';
        
        // 插图
        const imageDiv = document.createElement('div');
        imageDiv.className = 'page-image-placeholder';
        imageDiv.textContent = page.illustration.emoji;
        
        // 文字
        const textDiv = document.createElement('div');
        textDiv.className = 'page-text';
        textDiv.textContent = page.text;
        
        // 页码
        const numberDiv = document.createElement('div');
        numberDiv.className = 'page-number';
        numberDiv.textContent = `- ${index + 1} -`;
        
        pageElement.appendChild(imageDiv);
        pageElement.appendChild(textDiv);
        pageElement.appendChild(numberDiv);
        
        pagesContainer.appendChild(pageElement);
    });
    
    // 封底日期
    document.getElementById('bookDate').textContent = book.date;
}

// 获取方言名称
function getDialectName(dialectCode) {
    const dialectNames = {
        cantonese: '粤语',
        minnan: '闽南语',
        sichuan: '四川话',
        shanghai: '上海话',
        zhejiang: '浙江话',
        dongbei: '东北话',
        other: '方言'
    };
    return dialectNames[dialectCode] || '方言';
}

// 分享功能
function shareBook() {
    document.getElementById('shareModal').style.display = 'flex';
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

function copyLink() {
    const shareLink = document.getElementById('shareLink');
    const shareLinkInput = document.getElementById('shareLinkInput');
    
    // 生成模拟分享链接
    const mockLink = `https://xiangyin.example.com/book/${Date.now()}`;
    shareLinkInput.value = mockLink;
    shareLink.style.display = 'flex';
}

function copyToClipboard() {
    const shareLinkInput = document.getElementById('shareLinkInput');
    shareLinkInput.select();
    document.execCommand('copy');
    showToast('链接已复制到剪贴板', 'success');
}

function shareWechat() {
    showToast('微信分享功能需要接入微信SDK', 'info');
}

function generatePoster() {
    showToast('海报生成功能需要接入Canvas API', 'info');
}

// 下载PDF
function downloadPDF() {
    showToast('PDF下载功能需要接入PDF生成库（如jsPDF）', 'info');
}

// 打印绘本
function printBook() {
    window.print();
}

// 查看示例
function viewExample(index) {
    const examples = [
        {
            title: '月亮婆婆的故事',
            dialect: 'cantonese',
            content: '在很久很久以前，天上住着一位慈祥的月亮婆婆。每当夜幕降临，她就会提着银色的灯笼，缓缓走过天际，为大地洒下柔和的光芒。'
        },
        {
            title: '龙女的传说',
            dialect: 'minnan',
            content: '在古老的年代，海边住着一位美丽的龙女。她有着银色的鳞片和温柔的眼眸，每天夜晚都会来到海边，静静地听着渔人们的歌声。'
        },
        {
            title: '山里的老猎人',
            dialect: 'sichuan',
            content: '在我们那片深山里，住着一位老猎人。他打了一辈子的猎，对每一座山头、每一条溪流都了如指掌。'
        }
    ];
    
    const example = examples[index];
    AppState.rawText = example.content;
    AppState.selectedDialect = example.dialect;
    
    // 直接生成故事
    navigateTo('page-story');
    document.getElementById('storyLoading').style.display = 'block';
    document.getElementById('storyResult').style.display = 'none';
    
    setTimeout(async () => {
        const story = await API.polishStory(example.content, example.dialect);
        AppState.polishedStory = story;
        
        document.getElementById('storyLoading').style.display = 'none';
        document.getElementById('storyResult').style.display = 'block';
        document.getElementById('storyTitle').textContent = story.title;
        document.getElementById('storyContent').textContent = story.content;
    }, 1500);
}
