const API_BASE = '/api';
let currentSessionId = null;
let currentMemoryId = null;
let homeDecayChart = null;
let decayChart = null;
let sensitivityChart = null;
let strengthChart = null;

function init() {
    setupNavigation();
    loadStats();
    loadSessions();
    loadMemoryList();
    setupSearch();
    setupMemoryTabs();
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const viewId = btn.dataset.view;
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`view-${viewId}`).classList.add('active');

            if (viewId === 'home') {
                loadStats();
                setTimeout(() => renderHomeDecayChart(), 100);
            } else if (viewId === 'research') {
                setTimeout(() => renderResearchCharts(), 100);
            }
        });
    });
}

async function apiRequest(method, endpoint, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
}

async function loadStats() {
    try {
        const result = await apiRequest('GET', '/stats');
        const stats = result.stats;
        const detailed = result.detailed;

        document.getElementById('stat-sessions').textContent = stats.session_count;
        document.getElementById('stat-messages').textContent = stats.total_messages;
        document.getElementById('stat-active').textContent = detailed.active_count;
        document.getElementById('stat-forgotten').textContent = detailed.forgotten_count;

        if (document.getElementById('research-sessions')) {
            document.getElementById('research-sessions').textContent = stats.session_count;
            document.getElementById('research-messages').textContent = stats.total_messages;

            const avgStrength = stats.session_count > 0 
                ? ((detailed.strength_distribution['strong(>0.7)'] * 0.85 + 
                    detailed.strength_distribution['mid(0.3-0.7)'] * 0.5 + 
                    detailed.strength_distribution['weak(<0.3)'] * 0.15) / stats.session_count).toFixed(2)
                : '0.00';
            document.getElementById('research-avg-strength').textContent = avgStrength;

            const avgImportance = stats.session_count > 0 
                ? ((detailed.importance_distribution['high(>0.7)'] * 0.85 + 
                    detailed.importance_distribution['mid(0.3-0.7)'] * 0.5 + 
                    detailed.importance_distribution['low(<0.3)'] * 0.15) / stats.session_count).toFixed(2)
                : '0.00';
            document.getElementById('research-avg-importance').textContent = avgImportance;
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

async function loadSessions() {
    try {
        const sessions = await apiRequest('GET', '/sessions/active');
        const sessionList = document.getElementById('session-list');
        
        if (sessions.length === 0) {
            sessionList.innerHTML = '<div class="no-sessions">暂无会话</div>';
            return;
        }

        sessionList.innerHTML = sessions.map(session => `
            <div class="session-item ${currentSessionId === session.session_id ? 'active' : ''}" 
                 onclick="selectSession('${session.session_id}')">
                <div class="session-title">${session.title || '未命名会话'} <span class="session-time">${formatTime(session.created_at)}</span></div>
                <div class="session-topic">${session.topic || '无主题'}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载会话失败:', error);
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function createNewSession() {
    const title = prompt('请输入会话标题:', '新学习');
    if (!title) return;
    
    try {
        const session = await apiRequest('POST', '/sessions', { title, topic: '' });
        selectSession(session.session_id);
        loadSessions();
    } catch (error) {
        console.error('创建会话失败:', error);
    }
}

async function selectSession(sessionId) {
    currentSessionId = sessionId;
    
    document.querySelectorAll('.session-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(sessionId)) {
            item.classList.add('active');
        }
    });

    try {
        const session = await apiRequest('GET', `/sessions/${sessionId}`);
        document.getElementById('chat-title').textContent = session.title || '未命名会话';
        renderMessages(session.messages);
    } catch (error) {
        console.error('加载会话详情失败:', error);
    }
}

function renderMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <p>会话已创建</p>
                <p>开始输入学习内容...</p>
            </div>
        `;
        return;
    }

    chatMessages.innerHTML = messages.map(msg => `
        <div class="message ${msg.role}">
            <div class="message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
            <div class="message-content">
                ${msg.content}
                <div class="message-time">${formatTime(msg.timestamp)}</div>
            </div>
        </div>
    `).join('');

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    
    if (!content || !currentSessionId) {
        if (!currentSessionId) {
            alert('请先创建或选择一个会话');
        }
        return;
    }

    input.value = '';
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML += `
        <div class="message user">
            <div class="message-avatar">👤</div>
            <div class="message-content">${content}</div>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        await apiRequest('POST', `/sessions/${currentSessionId}/messages`, {
            role: 'user',
            content: content
        });

        setTimeout(() => {
            selectSession(currentSessionId);
        }, 500);
    } catch (error) {
        console.error('发送消息失败:', error);
    }
}

async function loadMemoryList(filter = 'all') {
    try {
        let sessions = [];
        if (filter === 'active') {
            sessions = await apiRequest('GET', '/sessions/active');
        } else if (filter === 'forgotten') {
            sessions = await apiRequest('GET', '/sessions/forgotten');
        } else {
            sessions = await apiRequest('GET', '/sessions');
        }

        const searchQuery = document.getElementById('memory-search')?.value.toLowerCase() || '';
        
        const filtered = sessions.filter(s => 
            (s.title && s.title.toLowerCase().includes(searchQuery)) ||
            (s.topic && s.topic.toLowerCase().includes(searchQuery))
        );

        const memoryList = document.getElementById('memory-list');
        
        if (filtered.length === 0) {
            memoryList.innerHTML = '<div class="no-memories">暂无学习记录</div>';
            return;
        }

        memoryList.innerHTML = filtered.map(session => {
            const strengthClass = session.strength > 0.7 ? 'strong' : session.strength > 0.3 ? 'mid' : 'weak';
            return `
                <div class="memory-item ${session.is_forgotten ? 'forgotten' : ''}" 
                     onclick="selectMemory('${session.session_id}')">
                    <div class="memory-item-title">${session.title || '未命名'} ${session.is_forgotten ? '🪦' : ''}</div>
                    <div class="memory-item-meta">
                        <span>${session.topic || '无主题'}</span>
                        <span>${formatTime(session.created_at)}</span>
                    </div>
                    <div class="strength-bar">
                        <div class="strength-fill ${strengthClass}" style="width: ${session.strength * 100}%"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: #5D6D7E; margin-top: 0.3rem;">
                        强度: ${(session.strength * 100).toFixed(0)}% | 重要性: ${(session.importance * 100).toFixed(0)}%
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载记忆列表失败:', error);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('memory-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadMemoryList(document.querySelector('.tab-btn.active')?.dataset.tab || 'all');
        });
    }
}

function setupMemoryTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMemoryList(btn.dataset.tab);
        });
    });
}

async function selectMemory(sessionId) {
    currentMemoryId = sessionId;
    
    try {
        const session = await apiRequest('GET', `/sessions/${sessionId}`);
        
        const detailHeader = document.getElementById('detail-header');
        const detailContent = document.getElementById('detail-content');

        detailHeader.innerHTML = `
            <h2>${session.title || '未命名学习记录'}</h2>
            <div class="detail-meta">
                <span>📅 创建时间: ${new Date(session.created_at * 1000).toLocaleString('zh-CN')}</span>
                <span>🔄 更新时间: ${new Date(session.updated_at * 1000).toLocaleString('zh-CN')}</span>
                <span>📋 主题: ${session.topic || '未分类'}</span>
                <span>📊 状态: ${session.is_forgotten ? '🪦 已遗忘' : '🔋 活跃'}</span>
                <span>💪 记忆强度: ${(session.strength * 100).toFixed(0)}%</span>
                <span>⭐ 重要性: ${(session.importance * 100).toFixed(0)}%</span>
            </div>
        `;

        detailContent.innerHTML = `
            <div class="detail-section">
                <h3>📝 学习摘要</h3>
                <div class="summary-box">${session.narrative_summary || '暂无摘要'}</div>
            </div>
            <div class="detail-section">
                <h3>🏷 关键词</h3>
                <div class="keywords">
                    ${session.keywords && session.keywords.length > 0 
                        ? session.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('') 
                        : '暂无关键词'}
                </div>
            </div>
            <div class="detail-section">
                <h3>📑 学习笔记</h3>
                <div class="body-box">${session.body_content || session.narrative_summary || '暂无内容'}</div>
            </div>
            <div class="detail-section">
                <h3>💬 原始对话记录</h3>
                <div class="body-box">
                    ${session.messages && session.messages.length > 0 
                        ? session.messages.map((m, i) => `${i + 1}. ${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n') 
                        : '暂无对话记录'}
                </div>
            </div>
            <div class="detail-actions">
                ${session.is_forgotten 
                    ? `<button class="detail-btn primary" onclick="restoreMemory('${sessionId}')">↩️ 恢复记忆</button>` 
                    : `<button class="detail-btn secondary" onclick="applyDecay('${sessionId}')">⏳ 应用衰减</button>`}
                <button class="detail-btn danger" onclick="deleteMemory('${sessionId}')">❌ 删除记录</button>
            </div>
        `;
    } catch (error) {
        console.error('加载记忆详情失败:', error);
    }
}

async function applyDecay(sessionId) {
    try {
        await apiRequest('POST', `/sessions/${sessionId}/decay`);
        loadMemoryList(document.querySelector('.tab-btn.active')?.dataset.tab || 'all');
        if (currentMemoryId === sessionId) {
            selectMemory(sessionId);
        }
    } catch (error) {
        console.error('应用衰减失败:', error);
    }
}

async function applyDecayAll() {
    if (!confirm('确定要对所有记忆应用时间衰减吗？')) return;
    try {
        await apiRequest('POST', '/decay-all');
        loadMemoryList(document.querySelector('.tab-btn.active')?.dataset.tab || 'all');
        loadStats();
    } catch (error) {
        console.error('衰减所有失败:', error);
    }
}

async function restoreMemory(sessionId) {
    try {
        await apiRequest('POST', `/sessions/${sessionId}/restore`);
        loadMemoryList('all');
        selectMemory(sessionId);
    } catch (error) {
        console.error('恢复记忆失败:', error);
    }
}

async function deleteMemory(sessionId) {
    if (!confirm('确定要删除这条学习记录吗？此操作不可恢复。')) return;
    try {
        await apiRequest('DELETE', `/sessions/${sessionId}`);
        loadMemoryList(document.querySelector('.tab-btn.active')?.dataset.tab || 'all');
        document.getElementById('detail-header').innerHTML = '<h2>选择学习记录查看详情</h2>';
        document.getElementById('detail-content').innerHTML = '<div class="empty-detail">请从左侧选择一条学习记录</div>';
        currentMemoryId = null;
        loadStats();
    } catch (error) {
        console.error('删除记录失败:', error);
    }
}

async function cleanupForgotten() {
    if (!confirm('确定要清理所有已遗忘的会话吗？此操作不可恢复。')) return;
    try {
        const result = await apiRequest('POST', '/cleanup-forgotten', { max_days: 0 });
        alert(`已清理 ${result.deleted_count} 条已遗忘会话`);
        loadMemoryList(document.querySelector('.tab-btn.active')?.dataset.tab || 'all');
        loadStats();
    } catch (error) {
        console.error('清理遗忘失败:', error);
    }
}

function renderHomeDecayChart() {
    const chartDom = document.getElementById('home-decay-chart');
    if (!chartDom) return;

    if (homeDecayChart) {
        homeDecayChart.dispose();
    }

    homeDecayChart = echarts.init(chartDom);

    const days = 30;
    const importance = 0.7;
    const halfLife = 7;
    const data = [];

    for (let d = 0; d <= days; d++) {
        const decaySpeed = 2.0 - importance;
        const decayFactor = Math.pow(Math.pow(0.5, d / halfLife), decaySpeed);
        const strength = Math.min(1.0, Math.max(0.0, decayFactor));
        data.push({ day: d, strength: Math.round(strength * 100) / 100 });
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}天: {c}'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map(d => d.day),
            name: '天数'
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 1,
            name: '记忆强度',
            axisLabel: { formatter: '{value}' }
        },
        series: [{
            name: '记忆强度',
            type: 'line',
            smooth: true,
            data: data.map(d => d.strength),
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(74, 124, 89, 0.4)' },
                    { offset: 1, color: 'rgba(74, 124, 89, 0.05)' }
                ])
            },
            itemStyle: { color: '#4A7C59' },
            lineStyle: { width: 3 }
        }]
    };

    homeDecayChart.setOption(option);

    window.addEventListener('resize', () => {
        homeDecayChart && homeDecayChart.resize();
    });
}

async function renderResearchCharts() {
    loadStats();
    setTimeout(async () => {
        await renderDecayChart();
        await renderSensitivityChart();
        await renderStrengthChart();
    }, 500);
}

async function renderDecayChart() {
    const chartDom = document.getElementById('decay-chart');
    if (!chartDom) return;

    if (decayChart) {
        decayChart.dispose();
    }

    decayChart = echarts.init(chartDom);

    const halfLives = [3, 7, 14, 21];
    const importance = 0.7;
    const days = 30;
    const series = [];

    const colors = ['#4A7C59', '#A0714F', '#6B8E6B', '#C4956A'];

    halfLives.forEach((hl, index) => {
        const data = [];
        for (let d = 0; d <= days; d++) {
            const decaySpeed = 2.0 - importance;
            const decayFactor = Math.pow(Math.pow(0.5, d / hl), decaySpeed);
            const strength = Math.min(1.0, Math.max(0.0, decayFactor));
            data.push(Math.round(strength * 100) / 100);
        }
        series.push({
            name: `半衰期 ${hl}天`,
            type: 'line',
            smooth: true,
            data: data,
            itemStyle: { color: colors[index] },
            lineStyle: { width: 2 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: colors[index] + '40' },
                    { offset: 1, color: colors[index] + '05' }
                ])
            }
        });
    });

    const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: halfLives.map(hl => `半衰期 ${hl}天`) },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: Array.from({ length: days + 1 }, (_, i) => i), name: '天数' },
        yAxis: { type: 'value', min: 0, max: 1, name: '记忆强度' },
        series: series
    };

    decayChart.setOption(option);
    window.addEventListener('resize', () => decayChart && decayChart.resize());
}

async function renderSensitivityChart() {
    const chartDom = document.getElementById('sensitivity-chart');
    if (!chartDom) return;

    if (sensitivityChart) {
        sensitivityChart.dispose();
    }

    sensitivityChart = echarts.init(chartDom);

    try {
        const result = await apiRequest('GET', '/sensitivity');
        
        const categories = Object.keys(result);
        const recalledData = categories.map(k => result[k].recalled_count);
        const forgottenData = categories.map(k => result[k].forgotten_count);

        const option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['召回数', '遗忘数'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: categories.map(c => c.replace('T_half_', '').replace('d', '天')) },
            yAxis: { type: 'value', name: '数量' },
            series: [
                { name: '召回数', type: 'bar', data: recalledData, itemStyle: { color: '#4A7C59' } },
                { name: '遗忘数', type: 'bar', data: forgottenData, itemStyle: { color: '#E74C3C' } }
            ]
        };

        sensitivityChart.setOption(option);
    } catch (error) {
        console.error('加载敏感性分析失败:', error);
        const option = {
            title: { text: '暂无数据', left: 'center', top: 'center' }
        };
        sensitivityChart.setOption(option);
    }

    window.addEventListener('resize', () => sensitivityChart && sensitivityChart.resize());
}

async function renderStrengthChart() {
    const chartDom = document.getElementById('strength-chart');
    if (!chartDom) return;

    if (strengthChart) {
        strengthChart.dispose();
    }

    strengthChart = echarts.init(chartDom);

    try {
        const result = await apiRequest('GET', '/stats');
        const detailed = result.detailed;

        const option = {
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', right: '5%', top: 'center' },
            series: [{
                name: '记忆强度分布',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: { show: true, formatter: '{b}: {c} ({d}%)' },
                data: [
                    { value: detailed.strength_distribution['strong(>0.7)'], name: '强', itemStyle: { color: '#4A7C59' } },
                    { value: detailed.strength_distribution['mid(0.3-0.7)'], name: '中', itemStyle: { color: '#A0714F' } },
                    { value: detailed.strength_distribution['weak(<0.3)'], name: '弱', itemStyle: { color: '#E74C3C' } }
                ]
            }]
        };

        strengthChart.setOption(option);
    } catch (error) {
        console.error('加载强度分布失败:', error);
        const option = {
            title: { text: '暂无数据', left: 'center', top: 'center' }
        };
        strengthChart.setOption(option);
    }

    window.addEventListener('resize', () => strengthChart && strengthChart.resize());
}

document.addEventListener('DOMContentLoaded', init);