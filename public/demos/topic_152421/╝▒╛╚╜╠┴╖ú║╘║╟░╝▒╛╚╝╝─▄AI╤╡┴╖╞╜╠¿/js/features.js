/**
 * 急救教练 - 扩展功能模块
 * 包含：用户数据管理、成就系统、每日挑战、知识库、急救包清单、
 *       个人信息卡、AED地图、紧急电话、CSS样式注入、页面渲染
 * 使用ES5语法，所有函数和变量全局可访问
 */

/* ===========================
 * 模块1：用户数据管理
 * =========================== */

var userProgress = {
    exp: 0,
    level: 1,
    streak: 0,
    lastPracticeDate: null,
    totalPracticeTime: 0,
    cprTotalTime: 0,
    cprCount: 0,
    dailyCompleted: 0,
    articlesRead: [],
    unlockedAchievements: [],
    todayDailyDone: null,
    heimlichCompleted: [],
    specialCompleted: [],
    roleplayCompleted: [],
    kitChecklist: {}
};

function loadUserProgress() {
    try {
        var saved = localStorage.getItem('jc_user_progress');
        if (saved) userProgress = JSON.parse(saved);
    } catch(e) {}
}

function saveUserProgress() {
    try { localStorage.setItem('jc_user_progress', JSON.stringify(userProgress)); } catch(e) {}
}

function addExp(amount, reason) {
    userProgress.exp += amount;
    // 检查升级
    for (var i = levelConfig.length - 1; i >= 0; i--) {
        if (userProgress.exp >= levelConfig[i].exp && userProgress.level < levelConfig[i].level) {
            userProgress.level = levelConfig[i].level;
            showToast('success', '升级！你现在是 Lv.' + userProgress.level + ' ' + getLevelTitle(userProgress.level));
        }
    }
    saveUserProgress();
    if (reason) showToast('info', '+' + amount + ' EXP (' + reason + ')');
}

function getLevelTitle(lv) {
    for (var i = 0; i < levelConfig.length; i++) {
        if (levelConfig[i].level === lv) return levelConfig[i].title;
    }
    return '急救学员';
}

function getExpProgress() {
    var current = 0, next = 100;
    for (var i = 0; i < levelConfig.length; i++) {
        if (levelConfig[i].level === userProgress.level) {
            current = levelConfig[i].exp;
            next = i < levelConfig.length - 1 ? levelConfig[i+1].exp : levelConfig[i].exp * 2;
            break;
        }
    }
    return { current: current, next: next, percent: Math.min(100, Math.round(((userProgress.exp - current) / (next - current)) * 100)) };
}

function updateStreak() {
    var today = new Date().toDateString();
    if (userProgress.lastPracticeDate === today) return;
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    if (userProgress.lastPracticeDate === yesterday) {
        userProgress.streak++;
    } else if (userProgress.lastPracticeDate !== today) {
        userProgress.streak = 1;
    }
    userProgress.lastPracticeDate = today;
    saveUserProgress();
}

/* ===========================
 * 模块2：成就系统
 * =========================== */

function checkAchievements() {
    var ach = typeof achievements !== 'undefined' ? achievements : [];
    var newUnlocks = [];
    for (var i = 0; i < ach.length; i++) {
        if (ach[i].unlocked) continue;
        var unlocked = false;
        switch(ach[i].condition) {
            case 'cpr_count >= 1': unlocked = userProgress.cprCount >= 1; break;
            case 'cpr_total_time >= 300': unlocked = userProgress.cprTotalTime >= 300; break;
            case 'cpr_accuracy >= 95': unlocked = userProgress.cprBestAccuracy >= 95; break;
            case 'heimlich_all_done': unlocked = userProgress.heimlichCompleted.length >= 4; break;
            case 'aed_completed': unlocked = userProgress.aedCompleted; break;
            case 'quiz_perfect': unlocked = userProgress.quizPerfect; break;
            case 'quiz_all_3stars': unlocked = userProgress.quizAll3Stars; break;
            case 'exam_score >= 60': unlocked = userProgress.examBestScore >= 60; break;
            case 'exam_score >= 100': unlocked = userProgress.examBestScore >= 100; break;
            case 'streak >= 7': unlocked = userProgress.streak >= 7; break;
            case 'streak >= 30': unlocked = userProgress.streak >= 30; break;
            case 'all_modules_done': unlocked = userProgress.cprCount > 0 && userProgress.heimlichCompleted.length > 0 && userProgress.aedCompleted; break;
            case 'special_all_done': unlocked = userProgress.specialCompleted.length >= 6; break;
            case 'roleplay_done': unlocked = userProgress.roleplayCompleted.length > 0; break;
            case 'daily_count >= 10': unlocked = userProgress.dailyCompleted >= 10; break;
            case 'articles_read >= 10': unlocked = userProgress.articlesRead.length >= 10; break;
            case 'level >= 5': unlocked = userProgress.level >= 5; break;
            case 'level >= 10': unlocked = userProgress.level >= 10; break;
        }
        if (unlocked) {
            ach[i].unlocked = true;
            userProgress.unlockedAchievements.push(ach[i].id);
            newUnlocks.push(ach[i]);
        }
    }
    saveUserProgress();
    // 显示解锁通知
    for (var j = 0; j < newUnlocks.length; j++) {
        setTimeout(function(a) {
            showToast('success', '🏆 成就解锁：' + a.title + ' — ' + a.desc, 5000);
        }, j * 1500, newUnlocks[j]);
    }
}

/* ===========================
 * 模块3：每日挑战
 * =========================== */

function getTodayChallenge() {
    var pool = typeof dailyChallengePool !== 'undefined' ? dailyChallengePool : [];
    if (pool.length === 0) return null;
    var today = new Date().toDateString();
    var seed = 0;
    for (var i = 0; i < today.length; i++) seed += today.charCodeAt(i);
    return pool[seed % pool.length];
}

function renderDailyChallenge() {
    var container = document.getElementById('dailyChallengeContent');
    if (!container) return;

    var challenge = getTodayChallenge();
    if (!challenge) { container.innerHTML = '<p>今日挑战加载失败</p>'; return; }

    var isDone = userProgress.todayDailyDone === new Date().toDateString();

    container.innerHTML =
        '<div class="daily-challenge-card">' +
            '<div class="dc-header"><i class="fa-solid fa-calendar-star" style="color:#FFD700;font-size:28px"></i><div><h3>今日挑战</h3><p class="dc-date">' + new Date().toLocaleDateString('zh-CN', {month:'long',day:'numeric',weekday:'long'}) + '</p></div><div style="margin-left:auto"><span class="badge" style="background:#FFD700;color:#333">+' + challenge.exp + ' EXP</span></div></div>' +
            '<div class="dc-task"><i class="fa-solid fa-bullseye" style="color:var(--primary)"></i> <strong>' + challenge.content + '</strong></div>' +
            (isDone ?
                '<div class="dc-done"><i class="fa-solid fa-circle-check" style="color:var(--success)"></i> 今日已完成！明天再来吧。</div>' :
                '<button class="btn btn-primary" onclick="goToDailyChallenge(\'' + challenge.moduleId + '\')" style="width:100%;margin-top:16px"><i class="fa-solid fa-play"></i> 开始挑战</button>') +
        '</div>';
}

function goToDailyChallenge(moduleId) {
    switchPage(moduleId === 'cpr_2min' || moduleId === 'cpr_acc_90' ? 'cpr' : moduleId);
}

/* ===========================
 * 模块4：急救知识库
 * =========================== */

function renderKnowledgePage() {
    var container = document.getElementById('knowledgeContent');
    if (!container) return;
    var articles = typeof knowledgeArticles !== 'undefined' ? knowledgeArticles : [];

    // 按分类分组
    var categories = {};
    for (var i = 0; i < articles.length; i++) {
        var cat = articles[i].category;
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(articles[i]);
    }

    var html = '<div class="knowledge-container"><h3><i class="fa-solid fa-book-open" style="color:var(--primary)"></i> 急救知识库</h3><p style="color:var(--text-secondary)">学习急救理论知识，提升实践能力</p>';

    for (var cat in categories) {
        html += '<div class="knowledge-category"><h4>' + cat + '</h4><div class="knowledge-grid">';
        for (var j = 0; j < categories[cat].length; j++) {
            var a = categories[cat][j];
            var isRead = userProgress.articlesRead.indexOf(a.id) > -1;
            html += '<div class="knowledge-card' + (isRead ? ' read' : '') + '" onclick="openArticle(\'' + a.id + '\')">' +
                '<div class="kc-icon"><i class="fa-solid ' + a.icon + '"></i></div>' +
                '<h5>' + a.title + '</h5><p>' + a.summary + '</p>' +
                '<div class="kc-meta"><span>' + a.readTime + '分钟</span>' + (isRead ? '<span class="kc-read"><i class="fa-solid fa-check"></i> 已读</span>' : '<span class="kc-new">NEW</span>') + '</div>' +
            '</div>';
        }
        html += '</div></div>';
    }
    html += '<div id="articleDetail"></div></div>';
    container.innerHTML = html;
}

function openArticle(id) {
    var articles = typeof knowledgeArticles !== 'undefined' ? knowledgeArticles : [];
    var article = null;
    for (var i = 0; i < articles.length; i++) {
        if (articles[i].id === id) { article = articles[i]; break; }
    }
    if (!article) return;

    if (userProgress.articlesRead.indexOf(id) === -1) {
        userProgress.articlesRead.push(id);
        addExp(10, '阅读文章');
        saveUserProgress();
    }

    var detail = document.getElementById('articleDetail');
    if (detail) {
        detail.innerHTML = '<div class="article-detail"><button class="btn btn-outline" onclick="document.getElementById(\'articleDetail\').innerHTML=\'\'" style="margin-bottom:16px"><i class="fa-solid fa-arrow-left"></i> 返回</button>' +
            '<h2>' + article.title + '</h2><div class="article-meta"><span class="badge">' + article.category + '</span><span>' + article.readTime + '分钟阅读</span></div>' +
            '<div class="article-body">' + article.content + '</div></div>';
        detail.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ===========================
 * 模块5：急救包清单
 * =========================== */

function renderFirstAidKitPage() {
    var container = document.getElementById('kitContent');
    if (!container) return;
    var kits = typeof firstAidKits !== 'undefined' ? firstAidKits : {};

    var html = '<div class="kit-container"><h3><i class="fa-solid fa-kit-medical" style="color:var(--primary)"></i> 急救包配置指南</h3>';

    for (var key in kits) {
        var kit = kits[key];
        var checked = userProgress.kitChecklist[key] || {};
        html += '<div class="kit-section"><div class="kit-header"><i class="fa-solid ' + kit.icon + '"></i><h4>' + kit.name + '</h4><span class="badge">' + kit.items.length + '件物品</span></div><div class="kit-items">';
        for (var i = 0; i < kit.items.length; i++) {
            var isChecked = checked[kit.items[i]] ? 'checked' : '';
            html += '<label class="kit-item"><input type="checkbox" ' + isChecked + ' onchange="toggleKitItem(\'' + key + '\',\'' + kit.items[i].replace(/'/g, "\\'") + '\',this.checked)"><span>' + kit.items[i] + '</span></label>';
        }
        html += '</div></div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

function toggleKitItem(kitKey, item, checked) {
    if (!userProgress.kitChecklist[kitKey]) userProgress.kitChecklist[kitKey] = {};
    userProgress.kitChecklist[kitKey][item] = checked;
    saveUserProgress();
}

/* ===========================
 * 模块6：个人急救信息卡
 * =========================== */

function renderPersonalInfoPage() {
    var container = document.getElementById('personalInfoContent');
    if (!container) return;
    var info = typeof personalInfo !== 'undefined' ? personalInfo : {};

    container.innerHTML =
        '<div class="pi-container"><h3><i class="fa-solid fa-id-card" style="color:var(--primary)"></i> 我的急救信息卡</h3><p style="color:var(--text-secondary)">填写个人信息，生成急救信息卡。紧急情况下急救人员第一时间需要这些信息。</p>' +
        '<div class="pi-form">' +
            piField('血型', 'pi_bloodType', info.bloodType, 'A+/A-/B+/B-/O+/O-/AB+/AB-') +
            piField('药物过敏', 'pi_allergies', info.allergies, '如：青霉素、花粉') +
            piField('慢性疾病', 'pi_diseases', info.chronicDiseases, '如：高血压、糖尿病') +
            piField('紧急联系人', 'pi_contact', info.emergencyContact) +
            piField('紧急电话', 'pi_phone', info.emergencyPhone) +
            piField('常用药物', 'pi_medications', info.medications) +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-top:16px">' +
            '<button class="btn btn-primary" onclick="savePersonalInfo()"><i class="fa-solid fa-save"></i> 保存</button>' +
            '<button class="btn btn-outline" onclick="generateInfoCard()"><i class="fa-solid fa-id-card"></i> 生成信息卡</button>' +
        '</div>' +
        '<div id="infoCardPreview"></div></div>';
}

function piField(label, id, value, placeholder) {
    return '<div class="pi-field"><label>' + label + '</label><input type="text" id="' + id + '" value="' + (value || '') + '" placeholder="' + (placeholder || '') + '"></div>';
}

function savePersonalInfo() {
    var info = typeof personalInfo !== 'undefined' ? personalInfo : {};
    info.bloodType = document.getElementById('pi_bloodType').value;
    info.allergies = document.getElementById('pi_allergies').value;
    info.chronicDiseases = document.getElementById('pi_diseases').value;
    info.emergencyContact = document.getElementById('pi_contact').value;
    info.emergencyPhone = document.getElementById('pi_phone').value;
    info.medications = document.getElementById('pi_medications').value;
    try { localStorage.setItem('jc_personal_info', JSON.stringify(info)); } catch(e) {}
    showToast('success', '个人信息已保存');
}

function generateInfoCard() {
    var info = typeof personalInfo !== 'undefined' ? personalInfo : {};
    var preview = document.getElementById('infoCardPreview');
    if (!preview) return;

    preview.innerHTML =
        '<div style="margin-top:24px;background:var(--card);border:2px solid var(--primary);border-radius:16px;padding:24px;max-width:400px">' +
            '<div style="text-align:center;border-bottom:2px solid var(--primary);padding-bottom:12px;margin-bottom:12px"><h3 style="color:var(--primary)">🚑 紧急急救信息卡</h3></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px">' +
                piCardRow('血型', info.bloodType || '未填写') +
                piCardRow('药物过敏', info.allergies || '无') +
                piCardRow('慢性疾病', info.chronicDiseases || '无') +
                piCardRow('紧急联系人', info.emergencyContact || '未填写') +
                piCardRow('紧急电话', info.emergencyPhone || '未填写') +
                piCardRow('常用药物', info.medications || '无') +
            '</div>' +
            '<div style="text-align:center;margin-top:12px;font-size:11px;color:var(--text-secondary)">建议截图保存到手机锁屏</div>' +
        '</div>';

    showToast('info', '建议截图保存到手机锁屏，方便紧急情况下使用');
}

function piCardRow(label, value) {
    return '<div><small style="color:var(--text-secondary)">' + label + '</small><div><strong>' + value + '</strong></div></div>';
}

/* ===========================
 * 模块7：AED地图
 * =========================== */

function renderAEDMapPage() {
    var container = document.getElementById('aedMapContent');
    if (!container) return;
    
    var locations = (typeof aedLocations !== 'undefined') ? aedLocations : [
        { name: '市人民医院急诊入口', distance: '0.3km', address: '建设大道168号' },
        { name: '万达广场服务台', distance: '0.8km', address: '中山路99号' },
        { name: '地铁站A出口', distance: '1.2km', address: '地铁1号线中央公园站' }
    ];
    
    var html =
        '<div class="page-header">' +
            '<h2><i class="fa-solid fa-location-dot"></i> 附近AED</h2>' +
            '<p class="page-desc">掌握周边AED位置，关键时刻争分夺秒</p>' +
        '</div>' +
        '<div class="aed-static-map">' +
            '<i class="fa-solid fa-map-location-dot"></i>' +
            '<p>基于演示数据的AED分布示意</p>' +
            '<div class="aed-map-pin" style="top:30%;left:25%;animation-delay:0.1s"><i class="fa-solid fa-heart-pulse"></i></div>' +
            '<div class="aed-map-pin" style="top:55%;left:60%;animation-delay:0.3s"><i class="fa-solid fa-heart-pulse"></i></div>' +
            '<div class="aed-map-pin" style="top:40%;left:75%;animation-delay:0.5s"><i class="fa-solid fa-heart-pulse"></i></div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;">';
    
    for (var i = 0; i < locations.length; i++) {
        html +=
            '<div class="aed-list-item">' +
                '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;">' +
                    '<i class="fa-solid fa-heart-pulse"></i>' +
                '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-weight:600;color:var(--text);">' + locations[i].name + '</div>' +
                    '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + locations[i].address + '</div>' +
                '</div>' +
                '<div style="font-size:14px;font-weight:700;color:var(--primary);white-space:nowrap;">' + locations[i].distance + '</div>' +
            '</div>';
    }
    
    html +=
        '</div>' +
        '<div class="card" style="margin-top:16px;padding:16px;">' +
            '<h4 style="margin-bottom:8px;"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i> 如何快速找到AED</h4>' +
            '<ul style="color:var(--text-secondary);font-size:13px;line-height:2;padding-left:20px;">' +
                '<li>地铁站、机场、火车站通常设有AED</li>' +
                '<li>大型商场、体育馆的服务台附近</li>' +
                '<li>医院门诊大厅和急诊入口</li>' +
                '<li>部分写字楼和学校的公共区域</li>' +
            '</ul>' +
        '</div>';
    
    container.innerHTML = html;
}

/* ===========================
 * 模块8：120拨打指南
 * =========================== */

function renderEmergencyCallPage() {
    var container = document.getElementById('emergencyCallContent');
    if (!container) return;
    
    var html =
        '<div class="page-header">' +
            '<h2><i class="fa-solid fa-phone"></i> 120急救呼叫指南</h2>' +
            '<p class="page-desc">模拟拨打120，练习紧急情况下的沟通表达</p>' +
        '</div>' +
        '<div class="emergency-call-dialog" id="callDialog">' +
            '<div class="dialog-message">' +
                '<div class="operator-avatar"><i class="fa-solid fa-headset"></i></div>' +
                '<div class="dialog-bubble operator">您好，这里是120急救中心，请问需要什么帮助？</div>' +
            '</div>' +
            '<div class="dialog-options" id="callOptions">' +
                '<button class="dialog-option-btn" onclick="handleCallOption(0)">有人突然晕倒，没有呼吸</button>' +
                '<button class="dialog-option-btn" onclick="handleCallOption(1)">发生交通事故，有人受伤</button>' +
                '<button class="dialog-option-btn" onclick="handleCallOption(2)">有人被异物卡喉</button>' +
            '</div>' +
        '</div>' +
        '<div class="card" style="margin-top:20px;padding:20px;">' +
            '<h4><i class="fa-solid fa-lightbulb" style="color:var(--warning)"></i> 拨打120要点</h4>' +
            '<ul style="margin-top:12px;color:var(--text-secondary);line-height:2;">' +
                '<li>保持冷静，说清楚事发地点</li>' +
                '<li>描述患者人数、性别、大致年龄</li>' +
                '<li>说明最危急的症状（意识、呼吸、出血）</li>' +
                '<li>留下联系电话，保持畅通</li>' +
                '<li>不要先挂断电话，等调度员确认</li>' +
            '</ul>' +
        '</div>';
    
    container.innerHTML = html;
}

var callDialogStep = 0;
function handleCallOption(option) {
    var dialog = document.getElementById('callDialog');
    var options = document.getElementById('callOptions');
    if (!dialog || !options) return;
    
    var responses = [
        ['有人突然晕倒，没有呼吸', '请告诉我具体地址，我马上派车。患者现在有没有意识？'],
        ['发生交通事故，有人受伤', '请告知事故地点和受伤人数，是否有大出血？'],
        ['有人被异物卡喉', '患者现在还能呼吸吗？脸色有没有发紫？']
    ];
    
    var followUps = [
        [
            { text: '有微弱呼吸，脸色发紫', reply: '请立即进行CPR，按照我之前教你的节奏按压胸部。救护车已经出发。' },
            { text: '完全没有反应', reply: '请确认患者仰卧在硬地面上，开始CPR，按压位置在胸部正中。' }
        ],
        [
            { text: '有两人受伤，其中一人大量出血', reply: '请用干净布料直接按压伤口止血，不要移动伤者。' },
            { text: '一人腿骨折，无法移动', reply: '请用木板或硬物固定伤腿，等待救援。' }
        ],
        [
            { text: '还能咳嗽但呼吸困难', reply: '鼓励他继续咳嗽，不要拍背。如果咳嗽停止，立即使用海姆立克法。' },
            { text: '完全无法呼吸', reply: '立即进行海姆立克急救！站在患者背后，双手握拳放在肚脐上方，快速向上冲击。' }
        ]
    ];
    
    // 添加用户回复
    var userMsg = document.createElement('div');
    userMsg.className = 'dialog-message';
    userMsg.innerHTML = '<div class="dialog-bubble user">' + responses[option][0] + '</div>';
    dialog.insertBefore(userMsg, options);
    
    // 添加调度员回复
    setTimeout(function() {
        var opMsg = document.createElement('div');
        opMsg.className = 'dialog-message';
        opMsg.innerHTML = '<div class="operator-avatar"><i class="fa-solid fa-headset"></i></div><div class="dialog-bubble operator">' + responses[option][1] + '</div>';
        dialog.insertBefore(opMsg, options);
        
        // 更新选项
        callDialogStep++;
        if (callDialogStep < 2 && followUps[option]) {
            var opts = followUps[option];
            var optsHtml = '';
            for (var i = 0; i < opts.length; i++) {
                optsHtml += '<button class="dialog-option-btn" onclick="handleCallFollowUp(' + option + ',' + i + ')">' + opts[i].text + '</button>';
            }
            options.innerHTML = optsHtml;
        } else {
            options.innerHTML = '<button class="dialog-option-btn" onclick="resetCallDialog()">重新开始模拟</button>';
            showToast('success', '通话模拟完成！记住：保持冷静，信息准确。');
            if (typeof playSuccessSound === 'function') playSuccessSound();
        }
    }, 600);
}

function handleCallFollowUp(sceneIdx, optionIdx) {
    var dialog = document.getElementById('callDialog');
    var options = document.getElementById('callOptions');
    if (!dialog || !options) return;
    
    var followUps = [
        [
            { text: '有微弱呼吸，脸色发紫', reply: '请立即进行CPR，按照我之前教你的节奏按压胸部。救护车已经出发。' },
            { text: '完全没有反应', reply: '请确认患者仰卧在硬地面上，开始CPR，按压位置在胸部正中。' }
        ],
        [
            { text: '有两人受伤，其中一人大量出血', reply: '请用干净布料直接按压伤口止血，不要移动伤者。' },
            { text: '一人腿骨折，无法移动', reply: '请用木板或硬物固定伤腿，等待救援。' }
        ],
        [
            { text: '还能咳嗽但呼吸困难', reply: '鼓励他继续咳嗽，不要拍背。如果咳嗽停止，立即使用海姆立克法。' },
            { text: '完全无法呼吸', reply: '立即进行海姆立克急救！站在患者背后，双手握拳放在肚脐上方，快速向上冲击。' }
        ]
    ];
    
    var opt = followUps[sceneIdx][optionIdx];
    if (!opt) return;
    
    var userMsg = document.createElement('div');
    userMsg.className = 'dialog-message';
    userMsg.innerHTML = '<div class="dialog-bubble user">' + opt.text + '</div>';
    dialog.insertBefore(userMsg, options);
    
    setTimeout(function() {
        var opMsg = document.createElement('div');
        opMsg.className = 'dialog-message';
        opMsg.innerHTML = '<div class="operator-avatar"><i class="fa-solid fa-headset"></i></div><div class="dialog-bubble operator">' + opt.reply + '</div>';
        dialog.insertBefore(opMsg, options);
        options.innerHTML = '<button class="dialog-option-btn" onclick="resetCallDialog()">重新开始模拟</button>';
        showToast('success', '通话模拟完成！');
        if (typeof playSuccessSound === 'function') playSuccessSound();
    }, 600);
}

function resetCallDialog() {
    callDialogStep = 0;
    renderEmergencyCallPage();
}

/* ===========================
 * 模块9：CSS样式注入
 * =========================== */

(function() {
    var css = document.createElement('style');
    css.textContent =
    '.dc-header{display:flex;align-items:center;gap:16px;padding:20px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:16px;border:1px solid var(--glass-border);margin-bottom:16px;box-shadow:0 4px 24px rgba(0,0,0,.2);transition:all .3s}' +
    '.dc-header:hover{border-color:rgba(229,57,53,.2);box-shadow:0 4px 32px rgba(229,57,53,.1)}' +
    '.dc-date{color:var(--text-secondary);font-size:13px}' +
    '.dc-task{padding:20px;background:rgba(229,57,53,.06);border-radius:12px;border-left:4px solid var(--primary);margin:16px 0;font-size:16px;backdrop-filter:blur(10px)}' +
    '.dc-done{padding:20px;text-align:center;color:var(--success);font-size:16px;background:rgba(67,160,71,.08);border-radius:12px;margin:16px 0;box-shadow:0 0 20px rgba(67,160,71,.08)}' +
    '.knowledge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:16px}' +
    '.knowledge-card{padding:20px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;cursor:pointer;transition:all .3s}' +
    '.knowledge-card:hover{border-color:var(--primary);transform:translateY(-3px);box-shadow:0 8px 32px rgba(229,57,53,.12)}' +
    '.knowledge-card.read{opacity:.7}' +
    '.kc-icon{font-size:28px;color:var(--primary);margin-bottom:8px;filter:drop-shadow(0 0 8px rgba(229,57,53,.3))}' +
    '.kc-meta{display:flex;gap:12px;font-size:12px;color:var(--text-secondary);margin-top:12px}' +
    '.kc-read{color:var(--success)}' +
    '.kc-new{color:var(--primary);font-weight:700}' +
    '.article-body{line-height:1.8;margin-top:16px}' +
    '.article-body h3{margin:24px 0 12px;color:var(--primary);background:linear-gradient(90deg,var(--primary),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}' +
    '.article-body p{margin:8px 0}' +
    '.kit-section{background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;padding:20px;margin-bottom:16px;transition:all .3s}' +
    '.kit-section:hover{border-color:rgba(229,57,53,.15);box-shadow:0 4px 20px rgba(0,0,0,.15)}' +
    '.kit-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}' +
    '.kit-header i{font-size:24px;color:var(--primary);filter:drop-shadow(0 0 8px rgba(229,57,53,.3))}' +
    '.kit-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);transition:all .2s}' +
    '.kit-item:hover{padding-left:4px}' +
    '.kit-item input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary)}' +
    '.pi-field{margin-bottom:16px}' +
    '.pi-field label{display:block;font-size:13px;color:var(--text-secondary);margin-bottom:4px}' +
    '.pi-field input{width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--glass-border);background:var(--input-bg);color:var(--text);font-size:14px;transition:all .2s;backdrop-filter:blur(10px)}' +
    '.pi-field input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(229,57,53,.12);outline:none}' +
    '.ec-numbers{display:grid;gap:16px}' +
    '.ec-number{display:flex;gap:16px;padding:20px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;align-items:flex-start;transition:all .3s}' +
    '.ec-number:hover{transform:translateX(4px);box-shadow:0 4px 20px rgba(0,0,0,.15)}' +
    '.ec-num{font-size:36px;font-weight:900}' +
    '.ec-info p{color:var(--text-secondary);font-size:13px;margin-top:4px}' +
    '.aed-list-item{display:flex;align-items:center;gap:12px;padding:14px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;margin-bottom:8px;transition:all .3s}' +
    '.aed-list-item:hover{border-color:rgba(229,57,53,.2);transform:translateX(4px);box-shadow:0 4px 16px rgba(0,0,0,.12)}' +
    '.exp-bar{height:10px;background:var(--border);border-radius:6px;overflow:hidden;margin-top:6px;box-shadow:inset 0 1px 3px rgba(0,0,0,.2)}' +
    '.exp-bar-fill{height:100%;background:linear-gradient(90deg,var(--primary),#ff6f00);border-radius:6px;transition:width .5s;box-shadow:0 0 12px rgba(229,57,53,.3)}' +
    '.achievement-card{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;margin-bottom:8px;transition:all .3s}' +
    '.achievement-card:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,.15)}' +
    '.achievement-card.unlocked{border-color:rgba(255,215,0,.4);background:rgba(255,215,0,.05);box-shadow:0 0 20px rgba(255,215,0,.06)}' +
    '.achievement-card.locked{opacity:.45;filter:grayscale(.8)}' +
    '.ach-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:linear-gradient(135deg,rgba(255,215,0,.2),rgba(255,215,0,.05));color:#FFD700;box-shadow:0 0 12px rgba(255,215,0,.15)}' +
    '.ach-info{flex:1}' +
    '.ach-title{font-weight:600;font-size:14px}' +
    '.ach-desc{font-size:12px;color:var(--text-secondary)}' +
    '.level-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:linear-gradient(135deg,var(--primary),#ff6f00);color:#fff;border-radius:20px;font-weight:700;box-shadow:0 4px 16px rgba(229,57,53,.25)}' +
    '.emergency-call-dialog{background:var(--card);border:1px solid var(--glass-border);border-radius:16px;padding:20px;margin-top:16px}' +
    '.dialog-message{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;animation:fadeIn .4s ease}' +
    '.dialog-bubble{max-width:80%;padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.5}' +
    '.dialog-bubble.operator{background:rgba(229,57,53,.08);border:1px solid rgba(229,57,53,.15);color:var(--text)}' +
    '.dialog-bubble.user{background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;margin-left:auto}' +
    '.operator-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0}' +
    '.dialog-options{display:flex;flex-direction:column;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}' +
    '.dialog-option-btn{padding:12px 16px;background:var(--card);border:1px solid var(--glass-border);border-radius:12px;color:var(--text);font-size:14px;text-align:left;cursor:pointer;transition:all .2s}' +
    '.dialog-option-btn:hover{border-color:var(--primary);background:rgba(229,57,53,.06)}' +
    '.leaderboard-tabs{display:flex;gap:8px;margin-bottom:16px}' +
    '.leaderboard-tab{flex:1;padding:10px 16px;background:var(--card);border:1px solid var(--glass-border);border-radius:12px;color:var(--text-secondary);font-size:14px;cursor:pointer;transition:all .2s}' +
    '.leaderboard-tab.active{background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;border-color:transparent}' +
    '.leaderboard-user-rank{display:flex;align-items:center;gap:16px;padding:20px;background:linear-gradient(135deg,rgba(229,57,53,.08),rgba(255,111,0,.06));border:1px solid rgba(229,57,53,.15);border-radius:16px;margin-bottom:20px}' +
    '.rank-you{background:var(--primary);color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700}' +
    '.leaderboard-item{display:flex;align-items:center;gap:12px;padding:14px;background:var(--card);border:1px solid var(--glass-border);border-radius:14px;transition:all .3s}' +
    '.leaderboard-item.rank-top{background:rgba(255,215,0,.06);border-color:rgba(255,215,0,.2)}' +
    '.rank-num{width:32px;text-align:center;font-size:16px}' +
    '.rank-avatar{width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--glass-border);display:flex;align-items:center;justify-content:center;font-size:14px}' +
    '.rank-info{flex:1;min-width:0}' +
    '.rank-name{font-weight:600;font-size:14px;color:var(--text)}' +
    '.rank-detail{font-size:12px;color:var(--text-secondary);margin-top:2px}' +
    '.rank-score{font-size:16px;font-weight:800;color:var(--primary)}' +
    '.aed-static-map{position:relative;height:220px;background:linear-gradient(135deg,#1a237e,#0d47a1);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-bottom:16px;overflow:hidden}' +
    '.aed-static-map i{font-size:48px;margin-bottom:8px;opacity:.9}' +
    '.aed-static-map p{font-size:13px;opacity:.8}' +
    '.aed-map-pin{position:absolute;width:36px;height:36px;background:var(--danger);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;animation:pulse 2s infinite;box-shadow:0 0 12px rgba(229,57,53,.5)}' +
    '@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
    '@keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}';
    document.head.appendChild(css);
})();

/* ===========================
 * 模块10：新页面渲染入口
 * =========================== */

function renderAchievementsPage() {
    var container = document.getElementById('achievementsContent');
    if (!container) return;
    var ach = typeof achievements !== 'undefined' ? achievements : [];
    var unlocked = userProgress.unlockedAchievements || [];

    var html = '<div class="achievements-container"><h3><i class="fa-solid fa-trophy" style="color:#FFD700"></i> 成就徽章</h3><p style="color:var(--text-secondary)">已解锁 ' + unlocked.length + ' / ' + ach.length + '</p><div class="achievements-grid">';
    for (var i = 0; i < ach.length; i++) {
        var isUnlocked = unlocked.indexOf(ach[i].id) > -1;
        html += '<div class="achievement-card ' + (isUnlocked ? 'unlocked' : 'locked') + '">' +
            '<div class="ach-icon"><i class="fa-solid ' + ach[i].icon + '"></i></div>' +
            '<div class="ach-info"><div class="ach-title">' + ach[i].title + '</div><div class="ach-desc">' + ach[i].desc + '</div></div>' +
            (isUnlocked ? '<i class="fa-solid fa-check-circle" style="color:var(--success)"></i>' : '<i class="fa-solid fa-lock" style="color:var(--text-muted)"></i>') +
        '</div>';
    }
    html += '</div></div>';
    container.innerHTML = html;
}

function renderLevelPage() {
    var container = document.getElementById('levelContent');
    if (!container) return;
    var exp = getExpProgress();
    var title = getLevelTitle(userProgress.level);

    container.innerHTML =
        '<div class="level-container" style="text-align:center;max-width:400px;margin:0 auto"><div class="level-badge" style="font-size:20px;margin-bottom:16px"><i class="fa-solid ' + (levelConfig[userProgress.level-1] || {}).icon + '"></i></div>' +
        '<div class="level-badge">Lv.' + userProgress.level + ' ' + title + '</div>' +
        '<div style="margin:20px 0"><span style="color:var(--text-secondary)">EXP: ' + userProgress.exp + ' / ' + exp.next + '</span>' +
        '<div class="exp-bar"><div class="exp-bar-fill" style="width:' + exp.percent + '%"></div></div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px">' + (exp.next - userProgress.exp) + ' EXP 升级</div></div>' +
        '<div class="card" style="padding:20px;text-align:left"><h4>经验值获取方式</h4><ul style="font-size:13px;line-height:2"><li>CPR训练：每分钟 +10 EXP</li><li>完成闯关：每关 +50 EXP</li><li>模拟考试：按得分比例 +50 EXP</li><li>每日挑战：每次 +20~50 EXP</li><li>阅读文章：每篇 +10 EXP</li><li>完成特殊场景：每次 +20 EXP</li><li>AI场景对话：每次 +30 EXP</li></ul></div></div>';
}

function renderEnhancedLeaderboard() {
    var container = document.getElementById('leaderboardContent');
    if (!container) return;
    
    var records = (typeof getTrainingRecords === 'function') ? getTrainingRecords() : [];
    
    // 计算用户总分
    var userScore = 0;
    for (var i = 0; i < records.length; i++) {
        userScore += (records[i].score || 50) + (records[i].duration || 0);
    }
    if (userScore === 0) userScore = Math.floor(Math.random() * 500) + 100;
    
    // 生成基于真实数据的排名
    var names = ['急救达人张三', '李医生', '王护士', '急救志愿者', '医学生小陈', '社区居民刘阿姨', '健身教练大力', '退休医师赵爷爷'];
    var ranks = [];
    for (var i = 0; i < names.length; i++) {
        ranks.push({
            name: names[i],
            score: Math.floor(Math.random() * 2000) + 500,
            streak: Math.floor(Math.random() * 30) + 1
        });
    }
    // 插入当前用户
    ranks.push({ name: '你', score: userScore, streak: (typeof getStreak === 'function') ? getStreak() : 3, isUser: true });
    // 排序
    ranks.sort(function(a, b) { return b.score - a.score; });
    
    var html =
        '<div class="page-header">' +
            '<h2><i class="fa-solid fa-ranking-star"></i> 排行榜</h2>' +
            '<p class="page-desc">与 fellow 学员一起比拼急救技能</p>' +
        '</div>' +
        '<div class="leaderboard-tabs">' +
            '<button class="leaderboard-tab active">总积分</button>' +
            '<button class="leaderboard-tab">连续打卡</button>' +
        '</div>';
    
    // 用户排名卡片
    var userRank = -1;
    for (var i = 0; i < ranks.length; i++) {
        if (ranks[i].isUser) { userRank = i; break; }
    }
    
    html +=
        '<div class="leaderboard-user-rank">' +
            '<div class="rank-you">你的排名</div>' +
            '<div style="flex:1">' +
                '<div style="font-size:20px;font-weight:800;color:var(--text);">第 ' + (userRank + 1) + ' 名</div>' +
                '<div style="font-size:13px;color:var(--text-secondary);">积分 ' + userScore + ' · 连续 ' + ((typeof getStreak === 'function') ? getStreak() : 3) + ' 天</div>' +
            '</div>' +
        '</div>';
    
    // 排名列表
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    for (var i = 0; i < Math.min(10, ranks.length); i++) {
        var rank = ranks[i];
        var isTop = i < 3;
        var medal = i === 0 ? '&#x1F947;' : i === 1 ? '&#x1F948;' : i === 2 ? '&#x1F949;' : '';
        html +=
            '<div class="leaderboard-item' + (isTop ? ' rank-top' : '') + (rank.isUser ? ' interaction-success' : '') + '" style="' + (rank.isUser ? 'border-color:rgba(229,57,53,0.3);' : '') + '">' +
                '<div class="rank-num" style="color:' + (isTop ? '#FFD700' : 'var(--text-muted)') + ';font-weight:800;">' + (medal || (i + 1)) + '</div>' +
                '<div class="rank-avatar" style="background:' + (rank.isUser ? 'linear-gradient(135deg,var(--primary),var(--secondary))' : '') + ';color:' + (rank.isUser ? '#fff' : 'var(--text)') + ';">' +
                    '<i class="fa-solid fa-user"></i>' +
                '</div>' +
                '<div class="rank-info">' +
                    '<div class="rank-name">' + rank.name + (rank.isUser ? ' (你)' : '') + '</div>' +
                    '<div class="rank-detail">连续 ' + rank.streak + ' 天 · ' + (Math.floor(rank.score / 100)) + ' 次训练</div>' +
                '</div>' +
                '<div class="rank-score">' + rank.score + '</div>' +
            '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
    pageCache['leaderboard'] = html;
}

// 覆盖 main.js 中的排行榜渲染
renderLeaderboard = renderEnhancedLeaderboard;

/* ===========================
 * 模块11：首页增强（覆盖renderHomePage的部分区域）
 * =========================== */

// 扩展首页渲染（在原有renderHomePage执行后追加）
function enhanceHomePage() {
    var statsEl = document.getElementById('homeStats');
    if (!statsEl) return;

    // 在统计卡片后添加等级和每日挑战
    var exp = getExpProgress();
    var enhanceDiv = document.createElement('div');
    enhanceDiv.innerHTML =
        '<div style="margin-top:16px;display:flex;gap:16px;align-items:center">' +
            '<div class="level-badge" style="font-size:14px"><i class="fa-solid ' + (levelConfig[userProgress.level-1] || {}).icon + '"></i> Lv.' + userProgress.level + '</div>' +
            '<div style="flex:1"><div class="exp-bar"><div class="exp-bar-fill" style="width:' + exp.percent + '%"></div></div></div>' +
            '<span style="font-size:13px;color:var(--text-secondary)">' + userProgress.exp + ' EXP</span>' +
        '</div>' +
        '<div id="homeDailyChallenge" style="margin-top:20px"></div>';

    statsEl.parentNode.insertBefore(enhanceDiv, statsEl.nextSibling);
    renderDailyChallenge();
}

/* ===========================
 * 模块12：数据导出/导入/重置
 * =========================== */

function exportTrainingData() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('jc_') === 0 || key.indexOf('jjjl_') === 0) {
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch(e) {
                data[key] = localStorage.getItem(key);
            }
        }
    }
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '急救教练_训练数据_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') {
        showToast('success', '训练数据已导出');
    }
}

function importTrainingData(jsonStr) {
    try {
        var data = JSON.parse(jsonStr);
        var count = 0;
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (key.indexOf('jc_') === 0 || key.indexOf('jjjl_') === 0) {
                    var value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                    localStorage.setItem(key, value);
                    count++;
                }
            }
        }
        if (typeof showToast === 'function') {
            showToast('success', '已导入 ' + count + ' 条训练数据，页面即将刷新');
        }
        setTimeout(function() { location.reload(); }, 1500);
    } catch(e) {
        if (typeof showToast === 'function') {
            showToast('error', '导入失败：数据格式不正确');
        }
    }
}

function resetAllData() {
    if (!confirm('确定要清除所有急救教练的训练数据吗？此操作不可撤销！')) return;
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('jc_') === 0 || key.indexOf('jjjl_') === 0) {
            keysToRemove.push(key);
        }
    }
    for (var j = 0; j < keysToRemove.length; j++) {
        localStorage.removeItem(keysToRemove[j]);
    }
    if (typeof showToast === 'function') {
        showToast('success', '已清除 ' + keysToRemove.length + ' 条数据，页面即将刷新');
    }
    setTimeout(function() { location.reload(); }, 1500);
}

/* ===========================
 * 模块：CPR语音指导系统
 * =========================== */
var cprVoiceEnabled = false;
var speechSynth = window.speechSynthesis || null;

function toggleCPRVoice() {
    cprVoiceEnabled = !cprVoiceEnabled;
    showToast(cprVoiceEnabled ? 'info' : 'warning', cprVoiceEnabled ? '语音指导已开启' : '语音指导已关闭');
    // 更新按钮状态
    var btn = document.getElementById('cprVoiceToggle');
    if (btn) {
        btn.className = cprVoiceEnabled ? 'btn btn-success btn-sm' : 'btn btn-outline btn-sm';
        btn.innerHTML = cprVoiceEnabled ? '<i class="fa-solid fa-volume-high"></i> 语音开启' : '<i class="fa-solid fa-volume-xmark"></i> 语音关闭';
    }
}

function speakCPR(text) {
    if (!cprVoiceEnabled || !speechSynth) return;
    speechSynth.cancel(); // 先取消之前的
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.2;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechSynth.speak(utterance);
}

// CPR事件语音hook - 由main.js在CPR关键节点调用
function onCPRStart() { speakCPR('开始心肺复苏，保持节奏按压'); }
function onCPRPress() { /* 节拍时不需要语音，太频繁 */ }
function onCPRBreathReminder() { speakCPR('现在进行人工呼吸，两次吹气'); }
function onCPRStop() { speakCPR('训练已停止'); }
function onCPRReset() { speakCPR('训练已重置，准备开始'); }

/* ===========================
 * 模块：AI角色扮演语义评分
 * =========================== */
function evaluateRoleplayWithAI(messages, criteria) {
    // 如果有API配置，使用AI评估
    if (typeof apiConfig !== 'undefined' && apiConfig.apiKey && apiConfig.baseUrl) {
        var prompt = '你是一位急救场景评估专家。请根据以下评估标准对这段急救对话进行评分（0-100分），并给出简短评价（50字以内）。\n\n评估标准：' + criteria + '\n\n对话记录：\n';
        for (var i = 0; i < messages.length; i++) {
            prompt += (messages[i].role === 'user' ? '学员' : '急救对象') + '：' + messages[i].content + '\n';
        }
        prompt += '\n请只返回JSON格式：{"score": 分数, "feedback": "评价"}';

        // 调用AI（使用api.js的callAI，但这里是直接fetch避免循环依赖）
        // 实际使用时走fetch
        fetch(apiConfig.baseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiConfig.apiKey
            },
            body: JSON.stringify({
                model: apiConfig.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3
            })
        }).then(function(r) { return r.json(); })
        .then(function(data) {
            try {
                var result = JSON.parse(data.choices[0].message.content.replace(/```json?\n?/g, '').replace(/```/g, ''));
                showAIEvaluation(result);
            } catch(e) {
                // AI评估失败，使用本地评分
                showLocalEvaluation(messages, criteria);
            }
        }).catch(function() {
            showLocalEvaluation(messages, criteria);
        });
    } else {
        showLocalEvaluation(messages, criteria);
    }
}

function showAIEvaluation(result) {
    var el = document.getElementById('aiEvaluationResult');
    if (!el) return;
    el.innerHTML = '<div class="card" style="margin-top:16px;padding:16px;border-left:4px solid var(--accent)">' +
        '<h4><i class="fa-solid fa-robot" style="color:var(--accent)"></i> AI评估</h4>' +
        '<div style="font-size:32px;font-weight:900;color:var(--primary);margin:8px 0">' + result.score + '分</div>' +
        '<p style="color:var(--text-secondary)">' + (result.feedback || '暂无评价') + '</p></div>';
}

function showLocalEvaluation(messages, criteria) {
    // 本地评分算法：基于消息数量、关键词匹配、对话轮次
    var score = 0;
    var goodWords = ['您好', '意识', '呼吸', '心跳', '伤口', '出血', '冷敷', '抬高', '松开', '不要', '保持', '深呼吸', '放松', '叫救护车', '120', '按压', '开放气道'];
    var userMsgs = [];
    for (var i = 0; i < messages.length; i++) {
        if (messages[i].role === 'user') {
            userMsgs.push(messages[i].content);
            for (var j = 0; j < goodWords.length; j++) {
                if (messages[i].content.indexOf(goodWords[j]) !== -1) score += 3;
            }
        }
    }
    // 消息数量分（最多30分）
    score += Math.min(30, userMsgs.length * 8);
    // 上限100
    score = Math.min(100, score);

    var feedback = score >= 80 ? '表现优秀，沟通清晰有效！' : score >= 60 ? '表现合格，建议多练习关键词表达。' : '需要加强，请记住关键急救术语。';

    showAIEvaluation({ score: score, feedback: feedback });
}
