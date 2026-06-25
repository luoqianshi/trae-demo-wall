const API_BASE = '/api';

let currentScene = null;
let currentData = null;
let isRecording = false;
let transcriptIndex = 0;
let recordingTimer = null;
let durationSeconds = 0;
let durationTimer = null;

const classroomDefaultNotes = `
<h2>课程概述</h2>
<p>本节课主要讲解神经网络的基础知识，包括其结构组成、激活函数的作用以及反向传播算法的原理。</p>
<h2>神经网络结构</h2>
<p>神经网络受到生物神经元的启发，由三层结构组成：</p>
<ul>
    <li><strong>输入层</strong>：接收原始数据</li>
    <li><strong>隐藏层</strong>：进行特征提取和转换</li>
    <li><strong>输出层</strong>：产生最终预测结果</li>
</ul>
<h2>激活函数</h2>
<p>激活函数引入非线性能力，常用的包括：</p>
<ul>
    <li>ReLU</li>
    <li>Sigmoid</li>
    <li>Tanh</li>
</ul>
<h2>反向传播</h2>
<p>反向传播算法是训练神经网络的核心，通过链式法则计算梯度，配合梯度下降优化权重参数。</p>
<h2>损失函数</h2>
<p>损失函数衡量预测值与真实值的差距，常见的有均方误差(MSE)和交叉熵损失。</p>
`;

const meetingDefaultNotes = `
<h2>会议概述</h2>
<p>本次会议主要讨论Q3产品路线图，包括AI助手功能和移动端改版两个核心项目。</p>
<h2>Q2回顾</h2>
<p>Q2用户增长目标达成率85%，略低于预期，需要分析原因并制定改进措施。</p>
<h2>AI助手</h2>
<p>技术侧评估需要6周开发周期，建议采用MVP策略，快速验证市场需求。</p>
<h2>移动端改版</h2>
<p>预计4周完成设计和开发，重点优化用户体验和协作功能。</p>
<h2>预算与资源</h2>
<p>Q3技术预算需增加20%，同时需要安排2周时间清理技术债务。</p>
`;

document.addEventListener('DOMContentLoaded', function() {
    loadSavedNotes();
    loadHistory();
});

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/history`);
        const history = await response.json();
        renderHistoryList(history);
    } catch (error) {
        console.error('Failed to load history:', error);
        renderHistoryList([]);
    }
}

function renderHistoryList(history) {
    const list = document.getElementById('historyList');
    if (history.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="ph-bold ph-clock"></i><div>暂无历史记录</div></div>';
        return;
    }
    list.innerHTML = history.map((record, index) => `
        <div class="history-item ${index === 0 ? 'active' : ''}" onclick="loadHistoryItem(${index})">
            <div class="history-item-title">
                <i class="ph-bold ${record.type === 'classroom' ? 'ph-graduation-cap' : 'ph-users-three'}"></i>
                ${record.title.length > 20 ? record.title.substring(0, 20) + '...' : record.title}
            </div>
            <div class="history-item-meta">
                <span>${record.date}</span>
                <span class="history-tag">${record.duration}</span>
            </div>
        </div>
    `).join('');
}

async function selectScene(scene) {
    currentScene = scene;
    
    try {
        const response = await fetch(`${API_BASE}/data/${scene}`);
        currentData = await response.json();
    } catch (error) {
        console.error('Failed to load scene data:', error);
        currentData = getMockData(scene);
    }
    
    const modeBadge = document.getElementById('modeBadge');
    if (scene === 'classroom') {
        modeBadge.className = 'mode-badge classroom';
        modeBadge.innerHTML = '<i class="ph-bold ph-graduation-cap"></i><span>课堂模式</span>';
        document.getElementById('editorContent').innerHTML = classroomDefaultNotes;
    } else {
        modeBadge.className = 'mode-badge meeting';
        modeBadge.innerHTML = '<i class="ph-bold ph-users-three"></i><span>会议模式</span>';
        document.getElementById('editorContent').innerHTML = meetingDefaultNotes;
    }
    
    document.getElementById('transcriptTitle').textContent = currentData.title;
    document.getElementById('welcomeOverlay').classList.add('hidden');
    
    resetTranscript();
    resetSummary();
    resetGraph();
}

function getMockData(scene) {
    return scene === 'classroom' ? {
        id: 'classroom-1',
        title: '机器学习导论 - 第3讲：神经网络基础',
        transcript: [
            { time: '00:00:05', text: '今天我们来讲神经网络的基础知识。', speaker: '教授' },
            { time: '00:00:32', text: '首先回顾一下，机器学习分为监督学习和无监督学习。', speaker: '教授' },
            { time: '00:01:15', text: '神经网络受到生物神经元的启发，由输入层、隐藏层和输出层组成。', speaker: '教授' },
            { time: '00:02:40', text: '每个连接都有一个权重，这是神经网络学习的核心参数。', speaker: '教授' },
            { time: '00:03:55', text: '激活函数引入非线性，常用的有 ReLU、Sigmoid 和 Tanh。', speaker: '教授' },
            { time: '00:05:20', text: '反向传播算法是训练神经网络的核心，它通过链式法则计算梯度。', speaker: '教授' },
            { time: '00:07:10', text: '损失函数衡量预测值与真实值的差距，常见的有均方误差和交叉熵。', speaker: '教授' },
            { time: '00:09:00', text: '梯度下降通过迭代更新权重，使损失函数最小化。', speaker: '教授' },
            { time: '00:11:30', text: '学习率是一个重要超参数，过大会导致震荡，过小收敛太慢。', speaker: '教授' },
            { time: '00:14:20', text: '批归一化可以加速训练并提高模型稳定性。', speaker: '教授' },
            { time: '00:17:45', text: 'Dropout 是一种正则化技术，可以有效防止过拟合。', speaker: '教授' },
            { time: '00:20:10', text: '卷积神经网络特别适合处理图像数据，通过卷积层提取特征。', speaker: '教授' },
            { time: '00:23:30', text: '循环神经网络适合处理序列数据，如文本和时间序列。', speaker: '教授' },
            { time: '00:26:15', text: 'Transformer 架构通过自注意力机制，在 NLP 领域取得了突破性进展。', speaker: '教授' },
            { time: '00:30:00', text: '总结一下，神经网络是深度学习的基础，掌握其原理非常重要。', speaker: '教授' }
        ],
        summary: [
            '机器学习分为监督学习和无监督学习两大范式',
            '神经网络由输入层、隐藏层和输出层三层结构组成',
            '激活函数（ReLU/Sigmoid/Tanh）为网络引入非线性能力',
            '反向传播算法配合梯度下降是训练的核心机制',
            '损失函数（MSE/交叉熵）指导优化方向'
        ],
        keywords: ['机器学习', '神经网络', '反向传播', '梯度下降', '激活函数', '损失函数', 'ReLU', '监督学习', '深度学习', 'Transformer'],
        graph: {
            nodes: [
                { id: 'ml', label: '机器学习', group: 'core', size: 35, description: '人工智能的核心分支' },
                { id: 'nn', label: '神经网络', group: 'core', size: 30, description: '模拟生物神经元的计算模型' },
                { id: 'bp', label: '反向传播', group: 'concept', size: 22, description: '通过链式法则计算梯度' },
                { id: 'gd', label: '梯度下降', group: 'concept', size: 22, description: '优化算法' },
                { id: 'af', label: '激活函数', group: 'concept', size: 20, description: '引入非线性变换' },
                { id: 'loss', label: '损失函数', group: 'concept', size: 20, description: '衡量预测与真实值差距' },
                { id: 'relu', label: 'ReLU', group: 'detail', size: 14, description: '线性整流函数' },
                { id: 'sigmoid', label: 'Sigmoid', group: 'detail', size: 14, description: '压缩到0-1之间' },
                { id: 'sl', label: '监督学习', group: 'concept', size: 18, description: '使用标注数据训练' },
                { id: 'dl', label: '深度学习', group: 'concept', size: 18, description: '多层神经网络' },
                { id: 'cnn', label: 'CNN', group: 'detail', size: 14, description: '卷积神经网络' },
                { id: 'rnn', label: 'RNN', group: 'detail', size: 14, description: '循环神经网络' },
                { id: 'transformer', label: 'Transformer', group: 'detail', size: 16, description: '自注意力机制' }
            ],
            edges: [
                { source: 'ml', target: 'nn', label: '包含' },
                { source: 'ml', target: 'sl', label: '分为' },
                { source: 'nn', target: 'bp', label: '使用' },
                { source: 'nn', target: 'af', label: '需要' },
                { source: 'nn', target: 'dl', label: '发展为' },
                { source: 'bp', target: 'gd', label: '依赖' },
                { source: 'bp', target: 'loss', label: '优化' },
                { source: 'af', target: 'relu', label: '例如' },
                { source: 'af', target: 'sigmoid', label: '例如' },
                { source: 'dl', target: 'cnn', label: '包含' },
                { source: 'dl', target: 'rnn', label: '包含' },
                { source: 'dl', target: 'transformer', label: '包含' },
                { source: 'gd', target: 'loss', label: '最小化' }
            ]
        }
    } : {
        id: 'meeting-1',
        title: 'Q3 产品路线图评审会',
        transcript: [
            { time: '00:00:10', text: '我们先回顾一下 Q2 的完成情况。', speaker: '产品经理' },
            { time: '00:01:30', text: 'Q2 用户增长目标达成率 85%，略低于预期。', speaker: '数据分析师' },
            { time: '00:03:00', text: 'Q3 重点推进 AI 助手功能和移动端改版。', speaker: '产品经理' },
            { time: '00:05:45', text: '技术侧评估 AI 助手需要 6 周开发周期。', speaker: '技术负责人' },
            { time: '00:08:20', text: '建议先推出 MVP 版本，收集用户反馈后再迭代。', speaker: '运营负责人' },
            { time: '00:10:00', text: '预算方面，Q3 技术投入需要增加 20%。', speaker: '财务' },
            { time: '00:12:30', text: '移动端改版预计 4 周完成设计和开发。', speaker: '设计负责人' },
            { time: '00:15:00', text: '用户调研显示，70% 的用户希望增加协作功能。', speaker: '用户研究' },
            { time: '00:18:20', text: '竞品分析显示，AI 功能是差异化竞争的关键。', speaker: '市场分析' },
            { time: '00:21:00', text: '技术债务需要在本季度清理，预计占用 2 周时间。', speaker: '技术负责人' },
            { time: '00:24:30', text: '运营侧准备配合 AI 功能上线做冷启动活动。', speaker: '运营负责人' },
            { time: '00:27:00', text: '总结一下，Q3 的核心目标是 AI 助手和移动端改版。', speaker: '产品经理' }
        ],
        summary: [
            'Q2 用户增长达成 85%，需分析未达标原因',
            'Q3 双主线：AI 助手 + 移动端改版',
            'AI 助手开发周期 6 周，建议采用 MVP 策略',
            '运营侧配合冷启动，收集种子用户反馈',
            'Q3 技术预算需上调 20%'
        ],
        keywords: ['Q3路线图', 'AI助手', 'MVP', '用户增长', '移动端改版', '预算', '技术债务', '协作功能'],
        graph: {
            nodes: [
                { id: 'q3', label: 'Q3路线图', group: 'core', size: 35, description: '第三季度产品规划' },
                { id: 'ai', label: 'AI助手', group: 'core', size: 28, description: '核心功能' },
                { id: 'mobile', label: '移动端改版', group: 'core', size: 28, description: '用户体验优化' },
                { id: 'mvp', label: 'MVP策略', group: 'concept', size: 20, description: '最小可行产品' },
                { id: 'budget', label: '预算', group: 'concept', size: 18, description: '技术投入增加20%' },
                { id: 'growth', label: '用户增长', group: 'concept', size: 22, description: 'Q2达成85%' },
                { id: 'tech', label: '技术债务', group: 'detail', size: 14, description: '需2周清理' },
                { id: 'collab', label: '协作功能', group: 'detail', size: 14, description: '70%用户需求' },
                { id: 'launch', label: '冷启动', group: 'detail', size: 14, description: '运营配合' },
                { id: 'research', label: '用户调研', group: 'detail', size: 14, description: '需求洞察' }
            ],
            edges: [
                { source: 'q3', target: 'ai', label: '核心' },
                { source: 'q3', target: 'mobile', label: '核心' },
                { source: 'q3', target: 'budget', label: '涉及' },
                { source: 'ai', target: 'mvp', label: '采用' },
                { source: 'ai', target: 'launch', label: '配合' },
                { source: 'mobile', target: 'collab', label: '包含' },
                { source: 'growth', target: 'q3', label: '影响' },
                { source: 'research', target: 'collab', label: '发现' },
                { source: 'tech', target: 'q3', label: '占用' }
            ]
        }
    };
}

async function loadHistoryItem(index) {
    try {
        const response = await fetch(`${API_BASE}/history`);
        const history = await response.json();
        const record = history[index];
        if (record) {
            await selectScene(record.type);
        }
    } catch (error) {
        console.error('Failed to load history item:', error);
    }
    
    document.querySelectorAll('.history-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('visible');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'Tab');
    });
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    isRecording = true;
    transcriptIndex = 0;
    
    const recordBtn = document.getElementById('recordBtn');
    recordBtn.innerHTML = '<i class="ph-bold ph-pause"></i>暂停';
    recordBtn.classList.remove('btn-primary');
    recordBtn.classList.add('btn-success');
    
    document.getElementById('statusDot').classList.add('recording');
    document.getElementById('statusText').textContent = '正在记录...';
    
    const content = document.getElementById('transcriptContent');
    content.innerHTML = '';
    
    durationSeconds = 0;
    durationTimer = setInterval(updateDuration, 1000);
    
    addTranscriptLine();
}

function stopRecording() {
    isRecording = false;
    
    const recordBtn = document.getElementById('recordBtn');
    recordBtn.innerHTML = '<i class="ph-bold ph-play"></i>继续';
    recordBtn.classList.remove('btn-success');
    recordBtn.classList.add('btn-primary');
    
    document.getElementById('statusDot').classList.remove('recording');
    document.getElementById('statusText').textContent = '已暂停';
    
    clearInterval(durationTimer);
    
    if (transcriptIndex >= currentData.transcript.length) {
        document.getElementById('generateBtn').disabled = false;
    }
}

function addTranscriptLine() {
    if (!isRecording || transcriptIndex >= currentData.transcript.length) {
        if (transcriptIndex >= currentData.transcript.length) {
            stopRecording();
            document.getElementById('recordBtn').innerHTML = '<i class="ph-bold ph-check"></i>已完成';
            document.getElementById('generateBtn').disabled = false;
        }
        return;
    }
    
    const item = currentData.transcript[transcriptIndex];
    const content = document.getElementById('transcriptContent');
    
    const prevHighlight = content.querySelector('.highlight');
    if (prevHighlight) {
        prevHighlight.classList.remove('highlight');
    }
    
    const line = document.createElement('div');
    line.className = 'transcript-line highlight';
    line.innerHTML = `
        <span class="transcript-time">[${item.time}]</span>
        <span class="transcript-speaker">${item.speaker}</span>
        <span class="transcript-text">${item.text}</span>
        <button class="mark-btn" onclick="markLine(this)">
            <i class="ph-bold ph-star"></i>
        </button>
    `;
    content.appendChild(line);
    
    updateWordCount();
    content.scrollTop = content.scrollHeight;
    
    transcriptIndex++;
    
    const delay = 2000 + Math.random() * 3000;
    setTimeout(addTranscriptLine, delay);
}

function markLine(btn) {
    const line = btn.closest('.transcript-line');
    line.classList.toggle('marked');
    
    if (line.classList.contains('marked')) {
        btn.innerHTML = '<i class="ph-bold ph-star-fill" style="color: #F59E0B;"></i>';
    } else {
        btn.innerHTML = '<i class="ph-bold ph-star"></i>';
    }
}

function resetTranscript() {
    isRecording = false;
    transcriptIndex = 0;
    durationSeconds = 0;
    
    clearInterval(durationTimer);
    
    document.getElementById('recordBtn').innerHTML = '<i class="ph-bold ph-play"></i>开始记录';
    document.getElementById('recordBtn').classList.remove('btn-success');
    document.getElementById('recordBtn').classList.add('btn-primary');
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('transcriptContent').innerHTML = `
        <div class="empty-state">
            <i class="ph-bold ph-microphone-slash"></i>
            <div class="empty-state-title">等待开始记录</div>
            <div class="empty-state-desc">点击"开始记录"按钮开始模拟转写</div>
        </div>
    `;
    document.getElementById('duration').textContent = '00:00:00';
    document.getElementById('wordCount').textContent = '0';
    document.getElementById('statusDot').classList.remove('recording');
    document.getElementById('statusText').textContent = '就绪';
}

function updateDuration() {
    durationSeconds++;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    document.getElementById('duration').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateWordCount() {
    const content = document.getElementById('transcriptContent');
    const text = content.textContent || '';
    document.getElementById('wordCount').textContent = text.length;
}

async function generateSummary() {
    switchTab('summary');
    
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `
        <div class="loading-overlay" style="position: relative; min-height: 200px;">
            <div class="loading-spinner"></div>
            <div class="loading-text">AI 正在分析内容...</div>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '', type: currentScene })
        });
        const data = await response.json();
        
        renderSummary(data);
        generateGraphFromAPI();
    } catch (error) {
        console.error('Failed to generate summary:', error);
        renderSummary(currentData);
        generateGraphFromData(currentData.graph);
    }
}

function renderSummary(data) {
    const summaryContent = document.getElementById('summaryContent');
    
    summaryContent.innerHTML = `
        <ul class="summary-list">
            ${data.summary.map(item => `
                <li class="summary-item">
                    <i class="ph-bold ph-check-circle"></i>
                    <span>${item}</span>
                </li>
            `).join('')}
        </ul>
    `;
    
    const keywordsSection = document.getElementById('keywordsSection');
    const keywordsList = document.getElementById('keywordsList');
    
    keywordsSection.style.display = 'block';
    keywordsList.innerHTML = data.keywords.map(keyword => 
        `<span class="keyword-tag" onclick="highlightKeyword('${keyword}')">${keyword}</span>`
    ).join('');
}

function copySummary() {
    const text = currentData.summary.join('\n');
    navigator.clipboard.writeText(text).then(() => {
        alert('摘要已复制到剪贴板');
    });
}

function highlightKeyword(keyword) {
    const nodes = document.querySelectorAll('#graph-svg .node');
    nodes.forEach(node => {
        const label = node.querySelector('text');
        if (label && label.textContent === keyword) {
            node.style.transform = 'scale(1.2)';
            setTimeout(() => {
                node.style.transform = 'scale(1)';
            }, 1000);
        }
    });
}

function resetSummary() {
    document.getElementById('summaryContent').innerHTML = `
        <div class="empty-state">
            <i class="ph-bold ph-text-aa"></i>
            <div class="empty-state-title">暂无摘要</div>
            <div class="empty-state-desc">完成转写后点击"生成摘要与图谱"</div>
        </div>
    `;
    document.getElementById('keywordsSection').style.display = 'none';
}

async function generateGraphFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/graph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '', type: currentScene })
        });
        const data = await response.json();
        generateGraphFromData(data);
    } catch (error) {
        console.error('Failed to generate graph:', error);
        generateGraphFromData(currentData.graph);
    }
}

function formatText(format) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    document.execCommand(format === 'heading' ? 'formatBlock' : format, false, 
        format === 'heading' ? 'h2' : null);
    saveNotes();
}

function saveNotes() {
    const content = document.getElementById('editorContent').innerHTML;
    localStorage.setItem('smartlink_notes_draft', content);
}

function loadSavedNotes() {
    const saved = localStorage.getItem('smartlink_notes_draft');
    if (saved) {
        document.getElementById('editorContent').innerHTML = saved;
    } else {
        document.getElementById('editorContent').innerHTML = classroomDefaultNotes;
    }
}

document.getElementById('editorContent')?.addEventListener('input', saveNotes);

function exportNotes() {
    const content = document.getElementById('editorContent').innerHTML;
    const text = document.getElementById('editorContent').textContent;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentData?.title || '笔记'}_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toggleDarkMode() {
    alert('深色模式功能开发中...');
}
