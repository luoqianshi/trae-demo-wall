const state = {
    records: JSON.parse(localStorage.getItem('gutHealthRecords')) || [],
    achievements: JSON.parse(localStorage.getItem('gutHealthAchievements')) || {},
    selectedType: 4,
    selectedColor: 'brown',
    selectedFeeling: 1,
    selectedMood: 'normal',
    waterCups: 0,
    selectedDiets: []
};

const ACHIEVEMENTS = {
    'ach-first': { icon: '🌱', name: '初次体验', desc: '完成第一次健康记录' },
    'ach-week': { icon: '📅', name: '坚持一周', desc: '连续记录7天' },
    'ach-perfect': { icon: '💯', name: '完美表现', desc: '获得一次100分' },
    'ach-month': { icon: '🌟', name: '月度达人', desc: '累计记录30次' },
    'ach-30days': { icon: '🔥', name: '连续达人', desc: '连续记录30天' },
    'ach-healthy': { icon: '💪', name: '健康达人', desc: '连续7天获得80分以上' },
    'ach-notes': { icon: '📝', name: '记录达人', desc: '添加10次备注' },
    'ach-100days': { icon: '👑', name: '终极达人', desc: '累计记录100次' }
};

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    setCurrentTime();
    setTodayDate();
    updateGreeting();
    updateUI();
    updateAchievements();
});

function initEventListeners() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.bristol-card').forEach(card => {
        card.addEventListener('click', () => selectBristolType(card));
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => selectColor(swatch));
    });

    document.querySelectorAll('.feeling-option').forEach(option => {
        option.addEventListener('click', () => selectFeeling(option));
    });

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn));
    });

    document.querySelectorAll('.water-cup').forEach(cup => {
        cup.addEventListener('click', () => toggleWater(cup));
    });

    document.querySelectorAll('.diet-tag').forEach(tag => {
        tag.addEventListener('click', () => toggleDiet(tag));
    });

    document.getElementById('save-btn').addEventListener('click', saveRecord);
    document.getElementById('clear-btn').addEventListener('click', clearRecords);
    document.getElementById('modal-close').addEventListener('click', closeAchievementModal);
    
    // 导入导出
    const exportBtn = document.getElementById('export-btn');
    if(exportBtn) exportBtn.addEventListener('click', exportData);
    
    const importBtn = document.getElementById('import-btn');
    if(importBtn) {
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => importData(e.target.files[0]);
            input.click();
        });
    }

    // AI周报
    const aiBtn = document.getElementById('generate-ai-report-btn');
    if(aiBtn) aiBtn.addEventListener('click', generateAIReport);
}

function selectMood(btn) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedMood = btn.dataset.mood;
}

function toggleWater(cup) {
    const index = parseInt(cup.dataset.index);
    if (cup.classList.contains('filled') && index === state.waterCups) {
        // 如果点击的是最后一杯已喝的水，则取消它
        state.waterCups = index - 1;
    } else {
        // 否则喝到点击的这杯
        state.waterCups = index;
    }
    
    document.querySelectorAll('.water-cup').forEach(c => {
        const i = parseInt(c.dataset.index);
        if (i <= state.waterCups) {
            c.classList.add('filled');
        } else {
            c.classList.remove('filled');
        }
    });
    document.getElementById('water-count').textContent = state.waterCups;
}

function toggleDiet(tag) {
    tag.classList.toggle('active');
    const diet = tag.dataset.tag;
    if (tag.classList.contains('active')) {
        state.selectedDiets.push(diet);
    } else {
        state.selectedDiets = state.selectedDiets.filter(d => d !== diet);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (tabName === 'record') {
        updateAchievements();
    } else if (tabName === 'history') {
        updateHistoryTab();
    } else if (tabName === 'health') {
        updateHealthTab();
    }
}

function selectBristolType(card) {
    document.querySelectorAll('.bristol-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.selectedType = parseInt(card.dataset.type);
    updateScorePreview();
}

function selectColor(swatch) {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    state.selectedColor = swatch.dataset.color;
}

function selectFeeling(option) {
    document.querySelectorAll('.feeling-option').forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    state.selectedFeeling = parseInt(option.dataset.feeling);
    updateScorePreview();
}

function setCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('record-time').value = `${hours}:${minutes}`;
}

function setTodayDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('today-date').textContent = `${month}/${day}`;
}

function updateGreeting() {
    const hour = new Date().getHours();
    let emoji, title, subtitle;
    
    if (hour < 6) {
        emoji = '🌙';
        title = '夜深了';
        subtitle = '还没休息呢？';
    } else if (hour < 12) {
        emoji = '☀️';
        title = '早上好！';
        subtitle = '今天也要加油哦';
    } else if (hour < 14) {
        emoji = '🌤️';
        title = '中午好！';
        subtitle = '记得午休片刻';
    } else if (hour < 18) {
        emoji = '🌅';
        title = '下午好！';
        subtitle = '来杯下午茶吧';
    } else {
        emoji = '🌙';
        title = '晚上好！';
        subtitle = '今天辛苦了';
    }
    
    document.getElementById('welcome-emoji').textContent = emoji;
    document.getElementById('welcome-title').textContent = title;
    document.getElementById('welcome-subtitle').textContent = subtitle;
}

function updateScorePreview() {
    const score = calculateHealthScore(state.selectedType, state.selectedFeeling);
    document.getElementById('preview-score').textContent = score;
    document.getElementById('score-fill').style.width = `${score}%`;
}

function calculateHealthScore(type, feeling) {
    let score = 0;
    
    // Type score (0-50)
    if (type === 4) score += 50;
    else if (type === 3 || type === 5) score += 40;
    else if (type === 2 || type === 6) score += 25;
    else score += 10;
    
    // Feeling score (0-50)
    if (feeling === 0) score += 50;
    else if (feeling === 1) score += 40;
    else if (feeling === 2) score += 25;
    else score += 10;
    
    return score;
}

function saveRecord() {
    const time = document.getElementById('record-time').value;
    const note = document.getElementById('note').value;

    if (!time) {
        showToast('⚠️', '请选择时间');
        return;
    }

    const record = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time,
        type: state.selectedType,
        color: state.selectedColor,
        feeling: state.selectedFeeling,
        mood: state.selectedMood,
        waterCups: state.waterCups,
        diets: [...state.selectedDiets],
        note,
        score: calculateHealthScore(state.selectedType, state.selectedFeeling)
    };

    state.records.unshift(record);
    localStorage.setItem('gutHealthRecords', JSON.stringify(state.records));

    // Reset form
    document.getElementById('note').value = '';
    
    // Reset newly added fields if desired, or keep them for next record
    // state.waterCups = 0;
    // ... update UI

    setCurrentTime();

    // Check achievements and update
    checkAchievements(record);
    updateTodayStatus();
    showToast('✨', '记录保存成功！');
    updateUI();
}

function updateUI() {
    updateStreak();
    updateMiniStats();
    updateTodayStatus();
}

function updateTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    const hasRecordToday = state.records.some(r => r.date === today);
    
    const badge = document.getElementById('today-status');
    const text = document.getElementById('today-status-text');
    
    if (hasRecordToday) {
        badge.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-light))';
        text.textContent = '今日已记录';
        text.style.color = 'white';
        badge.querySelector('.streak-emoji').textContent = '✅';
    } else {
        badge.style.background = 'linear-gradient(135deg, var(--accent-orange), #FBBF24)';
        text.textContent = '还没记录哦';
        text.style.color = '#92400E';
        badge.querySelector('.streak-emoji').textContent = '⏰';
    }
}

function updateMiniStats() {
    document.getElementById('mini-streak').textContent = calculateCurrentStreak();
    
    if (state.records.length > 0) {
        const recentRecords = state.records.slice(0, 7);
        const avgScore = Math.round(recentRecords.reduce((sum, r) => sum + r.score, 0) / recentRecords.length);
        document.getElementById('mini-score').textContent = avgScore;
    }
}

function updateStreak() {
    const streak = calculateCurrentStreak();
    document.getElementById('streak-count').textContent = streak;
    
    const progressBar = document.getElementById('streak-fill');
    const progressPercent = Math.min((streak / 30) * 100, 100);
    progressBar.style.width = `${progressPercent}%`;
    
    const tipElement = document.getElementById('streak-tip');
    if (streak === 0) {
        tipElement.textContent = '开始你的健康之旅吧！';
    } else if (streak < 7) {
        tipElement.textContent = `继续加油！再坚持${7 - streak}天解锁新成就 🏆`;
    } else if (streak < 30) {
        tipElement.textContent = `太棒了！你已经坚持${streak}天了 🎉`;
    } else {
        tipElement.textContent = '太厉害了！你已经养成了良好的健康习惯 🌟';
    }
}

function calculateCurrentStreak() {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasRecord = state.records.some(r => r.date === dateStr);
        if (hasRecord) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    
    return streak;
}

function updateAchievements() {
    const achievementIds = Object.keys(ACHIEVEMENTS);
    let unlockedCount = 0;
    
    achievementIds.forEach(id => {
        const el = document.getElementById(id);
        if (state.achievements[id]) {
            el.classList.remove('locked');
            el.classList.add('unlocked');
            el.querySelector('.status-text').textContent = '已解锁';
            unlockedCount++;
        } else {
            el.classList.remove('unlocked');
            el.classList.add('locked');
            el.querySelector('.status-text').textContent = '待解锁';
        }
    });
    
    document.getElementById('achievements-count').textContent = `${unlockedCount} / ${achievementIds.length}`;
    
    const progress = Math.round((unlockedCount / achievementIds.length) * 100);
    document.getElementById('achievement-progress').textContent = `${progress}%`;
    document.getElementById('achievement-bar').style.width = `${progress}%`;
}

function checkAchievements(record) {
    let newAchievements = [];

    // 初次体验
    if (!state.achievements['ach-first'] && state.records.length === 1) {
        state.achievements['ach-first'] = true;
        newAchievements.push('ach-first');
    }

    // 坚持一周
    if (!state.achievements['ach-week']) {
        const streak = calculateCurrentStreak();
        if (streak >= 7) {
            state.achievements['ach-week'] = true;
            newAchievements.push('ach-week');
        }
    }

    // 完美表现
    if (!state.achievements['ach-perfect'] && record.score === 100) {
        state.achievements['ach-perfect'] = true;
        newAchievements.push('ach-perfect');
    }

    // 月度达人
    if (!state.achievements['ach-month'] && state.records.length >= 30) {
        state.achievements['ach-month'] = true;
        newAchievements.push('ach-month');
    }

    // 连续30天
    if (!state.achievements['ach-30days']) {
        const streak = calculateCurrentStreak();
        if (streak >= 30) {
            state.achievements['ach-30days'] = true;
            newAchievements.push('ach-30days');
        }
    }

    // 健康达人：连续7天80分以上
    if (!state.achievements['ach-healthy']) {
        const recentRecords = state.records.slice(0, 7);
        if (recentRecords.length >= 7 && recentRecords.every(r => r.score >= 80)) {
            state.achievements['ach-healthy'] = true;
            newAchievements.push('ach-healthy');
        }
    }

    // 记录达人：10条备注
    if (!state.achievements['ach-notes']) {
        const notesCount = state.records.filter(r => r.note && r.note.trim()).length;
        if (notesCount >= 10) {
            state.achievements['ach-notes'] = true;
            newAchievements.push('ach-notes');
        }
    }

    // 终极达人：100次记录
    if (!state.achievements['ach-100days'] && state.records.length >= 100) {
        state.achievements['ach-100days'] = true;
        newAchievements.push('ach-100days');
    }

    if (newAchievements.length > 0) {
        localStorage.setItem('gutHealthAchievements', JSON.stringify(state.achievements));
        setTimeout(() => {
            showAchievementModal(newAchievements[0]);
        }, 800);
    }
}

function showAchievementModal(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    document.getElementById('modal-icon').textContent = achievement.icon;
    document.getElementById('modal-name').textContent = achievement.name;
    document.getElementById('modal-desc').textContent = achievement.desc;
    document.getElementById('achievement-modal').classList.add('show');
    updateAchievements();
}

function closeAchievementModal() {
    document.getElementById('achievement-modal').classList.remove('show');
}

function updateHistoryTab() {
    updateStats();
    updateChart();
    updateHeatmap();
    updateHistoryList();
}

function updateHeatmap() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    // 生成过去28天的热力图 (4周 x 7天)
    const days = 28;
    const today = new Date();
    let html = '';
    
    // 创建一个从27天前到今天的数组
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // 计算这一天的记录次数
        const count = state.records.filter(r => r.date === dateStr).length;
        
        let level = 0;
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;
        
        html += `<div class="calendar-cell level-${level}" title="${dateStr}: ${count}次记录"></div>`;
    }
    grid.innerHTML = html;
}

function updateStats() {
    document.getElementById('total-records').textContent = state.records.length;

    if (state.records.length > 0) {
        const avgScore = Math.round(state.records.reduce((sum, r) => sum + r.score, 0) / state.records.length);
        document.getElementById('health-score').textContent = avgScore;

        const times = state.records.map(r => {
            const [h, m] = r.time.split(':').map(Number);
            return h * 60 + m;
        });
        const avgMinutes = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const avgH = String(Math.floor(avgMinutes / 60)).padStart(2, '0');
        const avgM = String(avgMinutes % 60).padStart(2, '0');
        document.getElementById('avg-time').textContent = `${avgH}:${avgM}`;
        
        document.getElementById('best-streak').textContent = calculateCurrentStreak();
    }
}

function updateChart() {
    const ctx = document.getElementById('health-chart').getContext('2d');
    
    if (window.healthChart) {
        window.healthChart.destroy();
    }

    const last7Days = [];
    const scores = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);

        const dayRecords = state.records.filter(r => r.date === dateStr);
        if (dayRecords.length > 0) {
            const avgScore = dayRecords.reduce((sum, r) => sum + r.score, 0) / dayRecords.length;
            scores.push(avgScore);
        } else {
            scores.push(null);
        }
    }

    window.healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: '健康评分',
                data: scores,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointRadius: 7,
                pointHoverRadius: 9,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function updateHistoryList() {
    const list = document.getElementById('history-list');
    
    if (state.records.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <span class="empty-emoji">📭</span>
                <span class="empty-text">还没有记录哦</span>
            </div>
        `;
        return;
    }
    
    const typeNames = {
        1: '坚果状',
        2: '凹凸状',
        3: '裂纹状',
        4: '香蕉状',
        5: '软块状',
        6: '糊状',
        7: '水样'
    };

    list.innerHTML = state.records.slice(0, 20).map(record => `
        <div class="history-item">
            <div class="history-date">${record.date.slice(5)}<br>${record.time}</div>
            <div class="history-info">
                <div class="history-type">${typeNames[record.type]}</div>
                ${record.note ? `<div class="history-note">${record.note}</div>` : ''}
            </div>
            <div class="history-score">${record.score}</div>
        </div>
    `).join('');
}

function clearRecords() {
    if (confirm('确定要清空所有记录吗？这个操作不可恢复哦！')) {
        state.records = [];
        state.achievements = {};
        localStorage.removeItem('gutHealthRecords');
        localStorage.removeItem('gutHealthAchievements');
        updateHistoryTab();
        updateAchievements();
        updateUI();
        showToast('🗑️', '记录已清空');
    }
}

function updateHealthTab() {
    const tipsContent = document.getElementById('tips-content');
    
    if (state.records.length === 0) {
        tipsContent.innerHTML = `
            <div class="empty-tips">
                <span class="empty-icon">✨</span>
                <span class="empty-text">开始记录后，这里会有你的专属建议！</span>
            </div>
        `;
        return;
    }

    const recentRecords = state.records.slice(0, 7);
    const avgScore = recentRecords.reduce((sum, r) => sum + r.score, 0) / recentRecords.length;
    const avgType = recentRecords.reduce((sum, r) => sum + r.type, 0) / recentRecords.length;

    let tips = [];

    if (avgType < 3) {
        tips.push(`
            <div class="tip-item">
                <strong>💡 最近有些便秘迹象</strong><br>
                建议增加膳食纤维摄入，多吃蔬菜和水果，每天喝够2000ml水！
            </div>
        `);
    } else if (avgType > 5) {
        tips.push(`
            <div class="tip-item">
                <strong>💡 最近有些腹泻迹象</strong><br>
                建议注意饮食卫生，避免生冷刺激食物，注意腹部保暖！
            </div>
        `);
    }

    if (avgScore < 50) {
        tips.push(`
            <div class="tip-item">
                <strong>🏃 需要加强运动</strong><br>
                建议每天进行30分钟有氧运动，促进肠道蠕动，快走或慢跑都是不错的选择！
            </div>
        `);
    }

    if (tips.length === 0) {
        tips.push(`
            <div class="tip-item">
                <strong>🎉 太棒了！</strong><br>
                继续保持良好的生活习惯，你做得非常优秀！
            </div>
        `);
    }

    tipsContent.innerHTML = tips.join('');
}

function showToast(icon, message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-icon').textContent = icon;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function exportData() {
    if (state.records.length === 0) {
        showToast('⚠️', '没有可以导出的数据');
        return;
    }
    const dataStr = JSON.stringify({
        records: state.records,
        achievements: state.achievements
    });
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `肠乐记数据_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾', '数据导出成功');
}

function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.records && Array.isArray(data.records)) {
                state.records = data.records;
                state.achievements = data.achievements || {};
                localStorage.setItem('gutHealthRecords', JSON.stringify(state.records));
                localStorage.setItem('gutHealthAchievements', JSON.stringify(state.achievements));
                updateUI();
                updateHistoryTab();
                updateAchievements();
                showToast('✅', '数据导入成功');
            } else {
                showToast('❌', '无效的数据格式');
            }
        } catch (error) {
            showToast('❌', '读取文件失败');
        }
    };
    reader.readAsText(file);
}

function generateAIReport() {
    const btn = document.getElementById('generate-ai-report-btn');
    const content = document.getElementById('ai-report-content');
    
    if (state.records.length === 0) {
        showToast('⚠️', '需要先记录数据才能生成报告哦');
        return;
    }
    
    // 模拟AI生成过程
    btn.innerHTML = `
        <div class="btn-content">
            <span class="btn-icon" style="animation: rotate 1s linear infinite;">⏳</span>
            <span class="btn-text">AI 正在深度分析...</span>
        </div>
    `;
    btn.disabled = true;
    content.style.display = 'none';
    
    setTimeout(() => {
        const recentRecords = state.records.slice(0, 7);
        const avgScore = Math.round(recentRecords.reduce((sum, r) => sum + r.score, 0) / recentRecords.length);
        const avgWater = Math.round(recentRecords.reduce((sum, r) => sum + (r.wa
function generateAIReport() {
    const btn = document.getElementByIdHtm    const btn = document.gee="    const content = document.getElementById('ai-report-content');      
    if (state.records.length === 0) {
        showToast('?: 16p ;">?       showToast('⚠️',           return;
    }
    
    // 模拟AI生成过程
    btn.innerHTML = `
        <div??   }
    
   ng    vg   er    btn.innerHTML = `
              <div class=" i            <span class="btn-ic  r            <span class="btn-text">AI 正在深度分析...</span>
        </div>
    `;
 ??       </div>
    `;
    btn.disabled = true;
    content.style.?   `;
    bt?   b??    content.style.displ"
function generateAIReport() {
    const btn = document.getElementById('generate-ai-report-btn');
    const content = document.getElementById('ai-report-content');
    
    if (state.records.length === 0) {
        showToast('⚠️', '需要先记录数据才能生成报告哦');
        return;
    }
    
    // 模拟AI生成过程
    btn.innerHTML = `
        <div class="btn-content">
            <span class="btn-icon" style="animation: rotate 1s linear infinite;">⏳</span>
            <span class="btn-text">AI 正在深度分析...</span>
        </div>
    `;
    btn.disabled = true;
    content.style.display = 'none';
    
    setTimeout(() => {
        const recentRecords = state.records.slice(0, 7);
        const avgScore = Math.round(recentRecords.reduce((sum, r) => sum + r.score, 0) / recentRecords.length);
        const avgWater = Math.round(recentRecords.reduce((sum, r) => sum + (r.waterCups || 0), 0) / recentRecords.length);
        
        let reportHtml = `
            <div style="font-size: 14px; line-height: 1.6; color: var(--text-primary);">
                <h4 style="color: var(--primary); margin-bottom: 8px; font-size: 16px;">📊 本周健康洞察</h4>
                <p>过去7天，你的平均健康分为 <strong>${avgScore}分</strong>，平均每日饮水 <strong>${avgWater}杯</strong>。</p>
        `;
        
        if (avgScore >= 80) {
            reportHtml += `<p>🌟 <strong>状态极佳：</strong>你的肠胃状态非常稳定！你的饮食和作息习惯很棒，肠脑轴处于良性循环，请继续保持这优秀的健康习惯！</p>`;
        } else if (avgScore >= 60) {
            reportHtml += `<p>⚖️ <strong>状态良好：</strong>整体表现不错，但还有提升空间。建议增加一些高纤维食物的摄入，并保持愉快的心情，这有助于进一步提升肠道活力。</p>`;
        } else {
            reportHtml += `<p>⚠️ <strong>需要关注：</strong>近期肠胃似乎有些小情绪。建议近期以清淡饮食为主，规律作息，同时注意排解压力，多喝温水。</p>`;
        }
        
        reportHtml += `
                <h4 style="color: var(--primary); margin-top: 12px; margin-bottom: 8px; font-size: 16px;">💡 AI 专属建议</h4>
                <ul style="padding-left: 20px; color: var(--text-secondary);">
                    <li style="margin-bottom: 4px;">保持每日 1500ml-2000ml 的水分摄入</li>
                    <li style="margin-bottom: 4px;">尝试每天进行 20 分钟的轻度拉伸或散步</li>
                    <li style="margin-bottom: 4px;">多食用富含益生菌的食物（如酸奶、纳豆）</li>
                </ul>
                <div style="margin-top: 12px; font-size: 12px; color: var(--text-light); text-align: right;">
                    🤖 报告由 肠乐记AI大模型 生成
                </div>
            </div>
        `;
        
        content.innerHTML = reportHtml;
        content.style.display = 'block';
        
        // 恢复按钮状态
        btn.innerHTML = `
            <div class="btn-content">
                <span class="btn-icon">✨</span>
                <span class="btn-text">重新生成报告</span>
            </div>
        `;
        btn.disabled = false;
        showToast('✅', 'AI 周报生成完毕');
        
    }, 2000);
}
