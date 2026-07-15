const { useState, useEffect, useContext, createContext, useRef, createElement: e, useMemo, useCallback } = React;

const API_BASE = '/api';

// 检测是否为离线模式（file:// 协议或后端不可用时自动降级到 localStorage）
var _isOffline = window.location.protocol === 'file:' || window.location.hostname === '';
var _serverAvailable = !_isOffline;

// 离线数据库 - 基于localStorage实现
var localDB = {
    _users: function() { return JSON.parse(localStorage.getItem('yanrong_users') || '[]'); },
    _saveUsers: function(u) { localStorage.setItem('yanrong_users', JSON.stringify(u)); },
    _records: function() { return JSON.parse(localStorage.getItem('yanrong_records') || '[]'); },
    _saveRecords: function(r) { localStorage.setItem('yanrong_records', JSON.stringify(r)); },
    _posts: function() { return JSON.parse(localStorage.getItem('yanrong_posts') || '[]'); },
    _savePosts: function(p) { localStorage.setItem('yanrong_posts', JSON.stringify(p)); },
    _aiHistory: function() { return JSON.parse(localStorage.getItem('yanrong_ai_history') || '[]'); },
    _saveAiHistory: function(h) { localStorage.setItem('yanrong_ai_history', JSON.stringify(h)); },

    _hash: function(str) {
        var hash = 0, i, chr;
        for (i = 0; i < str.length; i++) { chr = str.charCodeAt(i); hash = ((hash << 5) - hash) + chr; hash |= 0; }
        return 'h' + Math.abs(hash).toString(36);
    },
    _token: function(userId) {
        return btoa(userId + ':' + Date.now() + ':' + Math.random().toString(36).slice(2));
    },
    _userIdFromToken: function(token) {
        try { return atob(token).split(':')[0]; } catch(e) { return null; }
    },

    // Auth
    register: function(data) {
        var users = this._users();
        if (users.find(function(u) { return u.username === data.username; })) {
            return { success: false, message: '用户名已存在' };
        }
        var user = {
            id: 'u_' + Date.now(),
            username: data.username,
            password: this._hash(data.password),
            gender: data.gender || 'female',
            skinType: data.skinType || 'unknown',
            avatar: '',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        this._saveUsers(users);
        var token = this._token(user.id);
        return { success: true, token: token, user: { id: user.id, username: user.username, gender: user.gender, skinType: user.skinType, avatar: user.avatar, createdAt: user.createdAt } };
    },
    login: function(data) {
        var users = this._users();
        var user = users.find(function(u) { return u.username === data.username; });
        if (!user || user.password !== this._hash(data.password)) {
            return { success: false, message: '用户名或密码错误' };
        }
        var token = this._token(user.id);
        return { success: true, token: token, user: { id: user.id, username: user.username, gender: user.gender, skinType: user.skinType, avatar: user.avatar, createdAt: user.createdAt } };
    },
    profile: function(token) {
        var uid = this._userIdFromToken(token);
        if (!uid) return { success: false, message: '未登录' };
        var users = this._users();
        var user = users.find(function(u) { return u.id === uid; });
        if (!user) return { success: false, message: '用户不存在' };
        return { success: true, user: { id: user.id, username: user.username, gender: user.gender, skinType: user.skinType, avatar: user.avatar, createdAt: user.createdAt } };
    },
    updateProfile: function(token, data) {
        var uid = this._userIdFromToken(token);
        var users = this._users();
        var user = users.find(function(u) { return u.id === uid; });
        if (!user) return { success: false, message: '用户不存在' };
        if (data.gender) user.gender = data.gender;
        if (data.skinType) user.skinType = data.skinType;
        if (data.avatar !== undefined) user.avatar = data.avatar;
        this._saveUsers(users);
        return { success: true, user: { id: user.id, username: user.username, gender: user.gender, skinType: user.skinType, avatar: user.avatar } };
    },
    changePassword: function(token, data) {
        var uid = this._userIdFromToken(token);
        var users = this._users();
        var user = users.find(function(u) { return u.id === uid; });
        if (!user) return { success: false, message: '用户不存在' };
        if (user.password !== this._hash(data.oldPassword)) return { success: false, message: '原密码错误' };
        user.password = this._hash(data.newPassword);
        this._saveUsers(users);
        return { success: true };
    },

    // Records
    listRecords: function(token, page, pageSize) {
        var uid = this._userIdFromToken(token);
        var records = this._records().filter(function(r) { return r.userId === uid; });
        records.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        var start = ((page || 1) - 1) * (pageSize || 10);
        return { success: true, data: { records: records.slice(start, start + (pageSize || 10)), total: records.length, page: page || 1, pageSize: pageSize || 10 } };
    },
    getRecord: function(token, id) {
        var records = this._records();
        var record = records.find(function(r) { return r.id === id; });
        return record ? { success: true, data: record } : { success: false, message: '记录不存在' };
    },
    createRecord: function(token, data) {
        var uid = this._userIdFromToken(token);
        var record = { ...data, id: 'r_' + Date.now(), userId: uid, createdAt: new Date().toISOString() };
        var records = this._records();
        records.push(record);
        this._saveRecords(records);
        return { success: true, record: record };
    },
    removeRecord: function(token, id) {
        var records = this._records().filter(function(r) { return r.id !== id; });
        this._saveRecords(records);
        return { success: true };
    },
    clearRecords: function(token) {
        var uid = this._userIdFromToken(token);
        var records = this._records().filter(function(r) { return r.userId !== uid; });
        this._saveRecords(records);
        return { success: true };
    },
    trend: function(token) {
        var uid = this._userIdFromToken(token);
        var records = this._records().filter(function(r) { return r.userId === uid; });
        records.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
        return { success: true, data: records.slice(-7).map(function(r) { return { date: r.createdAt, score: r.overallScore || 75 }; }) };
    },

    // Community
    listPosts: function(page, pageSize, keyword) {
        var posts = this._posts();
        if (keyword) {
            posts = posts.filter(function(p) { return p.title.indexOf(keyword) >= 0 || (p.content || '').indexOf(keyword) >= 0; });
        }
        posts.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
        var start = ((page || 1) - 1) * (pageSize || 10);
        return { success: true, data: { posts: posts.slice(start, start + (pageSize || 10)), total: posts.length, page: page || 1 } };
    },
    createPost: function(token, data) {
        var uid = this._userIdFromToken(token);
        var users = this._users();
        var user = users.find(function(u) { return u.id === uid; });
        var post = {
            id: 'p_' + Date.now(),
            userId: uid,
            username: user ? user.username : '匿名用户',
            avatar: user ? user.avatar : '',
            title: data.title || '分享我的皮肤状态',
            content: data.content || '',
            image: data.image || '',
            tags: data.tags || [],
            likes: 0,
            likedBy: [],
            favorites: 0,
            favoritedBy: [],
            comments: [],
            createdAt: new Date().toISOString()
        };
        var posts = this._posts();
        posts.unshift(post);
        this._savePosts(posts);
        return { success: true, post: post };
    },
    likePost: function(token, id) {
        var uid = this._userIdFromToken(token);
        var posts = this._posts();
        var post = posts.find(function(p) { return p.id === id; });
        if (!post) return { success: false, message: '帖子不存在' };
        var idx = post.likedBy.indexOf(uid);
        if (idx >= 0) { post.likedBy.splice(idx, 1); post.likes = Math.max(0, post.likes - 1); }
        else { post.likedBy.push(uid); post.likes++; }
        this._savePosts(posts);
        return { success: true, data: { liked: idx < 0, likes: post.likes } };
    },
    favoritePost: function(token, id) {
        var uid = this._userIdFromToken(token);
        var posts = this._posts();
        var post = posts.find(function(p) { return p.id === id; });
        if (!post) return { success: false, message: '帖子不存在' };
        var idx = post.favoritedBy.indexOf(uid);
        if (idx >= 0) { post.favoritedBy.splice(idx, 1); post.favorites = Math.max(0, post.favorites - 1); }
        else { post.favoritedBy.push(uid); post.favorites++; }
        this._savePosts(posts);
        return { success: true, data: { favorited: idx < 0, favorites: post.favorites } };
    },
    getComments: function(id) {
        var posts = this._posts();
        var post = posts.find(function(p) { return p.id === id; });
        return { success: true, data: post ? post.comments : [] };
    },
    addComment: function(token, id, content) {
        var uid = this._userIdFromToken(token);
        var users = this._users();
        var user = users.find(function(u) { return u.id === uid; });
        var posts = this._posts();
        var post = posts.find(function(p) { return p.id === id; });
        if (!post) return { success: false, message: '帖子不存在' };
        var comment = { id: 'c_' + Date.now(), userId: uid, username: user ? user.username : '匿名用户', content: content, createdAt: new Date().toISOString() };
        post.comments.push(comment);
        this._savePosts(posts);
        return { success: true, data: comment };
    },
    removePost: function(token, id) {
        var uid = this._userIdFromToken(token);
        var posts = this._posts().filter(function(p) { return !(p.id === id && p.userId === uid); });
        this._savePosts(posts);
        return { success: true };
    },

    // AI (离线模式返回智能预设回复)
    aiChat: function(messages) {
        var last = messages[messages.length - 1];
        var content = last ? last.content : '';
        var reply = '感谢您的咨询！在离线模式下，AI功能有限。\n\n针对您的问题「' + content + '」，以下是一些通用建议：\n\n1. 保持良好的作息习惯，早睡早起\n2. 多喝水，保持皮肤水分\n3. 注意防晒，避免紫外线伤害\n4. 合理饮食，少吃辛辣油腻食物\n5. 选择适合自己肤质的护肤品\n\n如需更详细的AI分析，请启动后端服务器体验完整功能。';
        var history = this._aiHistory();
        history.push({ role: 'user', content: content });
        history.push({ role: 'assistant', content: reply });
        this._saveAiHistory(history);
        return { success: true, reply: reply };
    },
    aiInterpret: function(record) {
        var score = record.overallScore || 75;
        var tips = [];
        if (score < 60) tips.push('您的皮肤整体状况需要关注，建议加强护理。');
        else if (score < 80) tips.push('您的皮肤状况中等，注意日常保养即可。');
        else tips.push('您的皮肤状况良好，请继续保持！');
        if (record.skinIssues && record.skinIssues.length > 0) {
            tips.push('检测到以下皮肤问题：' + record.skinIssues.map(function(i) { return i.name; }).join('、') + '。');
        }
        tips.push('建议保持良好作息，多喝水，注意防晒。');
        return { success: true, interpretation: tips.join('\n\n') };
    },
    getAiHistory: function() {
        return { success: true, data: this._aiHistory() };
    },
    clearAiHistory: function() {
        this._saveAiHistory([]);
        return { success: true };
    }
};

// 检测后端是否可用
async function _checkServer() {
    if (_isOffline) return false;
    try {
        var res = await fetch(API_BASE + '/health', { method: 'GET' });
        return res.ok;
    } catch (e) { return false; }
}

const api = {
    async request(path, options) {
        const opts = options || {};
        const token = localStorage.getItem('yanrong_token');
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        try {
            const res = await fetch(API_BASE + path, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
            if (!res.ok) throw new Error('Server error');
            const data = await res.json();
            return data;
        } catch (err) {
            _serverAvailable = false;
            return { success: false, message: '网络请求失败', _offline: true };
        }
    },
    auth: {
        register: async function(data) {
            var r = await api.request('/auth/register', { method: 'POST', body: data });
            if (r._offline) return localDB.register(data);
            return r;
        },
        login: async function(data) {
            var r = await api.request('/auth/login', { method: 'POST', body: data });
            if (r._offline) return localDB.login(data);
            return r;
        },
        profile: async function() {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/auth/profile');
            if (r._offline) return localDB.profile(token);
            return r;
        },
        updateProfile: async function(data) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/auth/profile', { method: 'PUT', body: data });
            if (r._offline) return localDB.updateProfile(token, data);
            return r;
        },
        changePassword: async function(data) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/auth/password', { method: 'PUT', body: data });
            if (r._offline) return localDB.changePassword(token, data);
            return r;
        }
    },
    records: {
        list: async function(page, pageSize) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/records?page=' + (page || 1) + '&pageSize=' + (pageSize || 10));
            if (r._offline) return localDB.listRecords(token, page, pageSize);
            return r;
        },
        get: async function(id) {
            var r = await api.request('/records/' + id);
            if (r._offline) return localDB.getRecord(null, id);
            return r;
        },
        create: async function(data) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/records', { method: 'POST', body: data });
            if (r._offline) return localDB.createRecord(token, data);
            return r;
        },
        remove: async function(id) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/records/' + id, { method: 'DELETE' });
            if (r._offline) return localDB.removeRecord(token, id);
            return r;
        },
        clear: async function() {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/records', { method: 'DELETE' });
            if (r._offline) return localDB.clearRecords(token);
            return r;
        },
        trend: async function() {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/records/stats/trend');
            if (r._offline) return localDB.trend(token);
            return r;
        }
    },
    ai: {
        chat: async function(messages, options) {
            var r = await api.request('/ai/chat', { method: 'POST', body: { messages, options } });
            if (r._offline) return localDB.aiChat(messages);
            return r;
        },
        interpret: async function(record) {
            var r = await api.request('/ai/interpret', { method: 'POST', body: { record } });
            if (r._offline) return localDB.aiInterpret(record);
            return r;
        },
        history: async function() {
            var r = await api.request('/ai/history');
            if (r._offline) return localDB.getAiHistory();
            return r;
        },
        clearHistory: async function() {
            var r = await api.request('/ai/history', { method: 'DELETE' });
            if (r._offline) return localDB.clearAiHistory();
            return r;
        }
    },
    community: {
        list: async function(page, pageSize, keyword) {
            var r = await api.request('/community?page=' + (page || 1) + '&pageSize=' + (pageSize || 10) + (keyword ? '&keyword=' + encodeURIComponent(keyword) : ''));
            if (r._offline) return localDB.listPosts(page, pageSize, keyword);
            return r;
        },
        create: async function(data) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/community', { method: 'POST', body: data });
            if (r._offline) return localDB.createPost(token, data);
            return r;
        },
        like: async function(id) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/community/' + id + '/like', { method: 'POST' });
            if (r._offline) return localDB.likePost(token, id);
            return r;
        },
        favorite: async function(id) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/community/' + id + '/favorite', { method: 'POST' });
            if (r._offline) return localDB.favoritePost(token, id);
            return r;
        },
        comments: async function(id) {
            var r = await api.request('/community/' + id + '/comments');
            if (r._offline) return localDB.getComments(id);
            return r;
        },
        addComment: async function(id, content) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/community/' + id + '/comments', { method: 'POST', body: { content } });
            if (r._offline) return localDB.addComment(token, id, content);
            return r;
        },
        remove: async function(id) {
            var token = localStorage.getItem('yanrong_token');
            var r = await api.request('/community/' + id, { method: 'DELETE' });
            if (r._offline) return localDB.removePost(token, id);
            return r;
        }
    }
};

const SKIN_ISSUES = [
    { id: 'pimple', name: '痘痘', severity: 'mild', description: '面部存在少量痘痘', suggestion: '保持面部清洁' },
    { id: 'blackhead', name: '黑头', severity: 'moderate', description: 'T区有明显黑头', suggestion: '定期使用清洁面膜' },
    { id: 'dark-circle', name: '黑眼圈', severity: 'mild', description: '眼下有轻微暗沉', suggestion: '保证充足睡眠' },
    { id: 'redness', name: '泛红', severity: 'mild', description: '面部有轻微泛红', suggestion: '使用温和护肤品' },
    { id: 'oil', name: '出油', severity: 'severe', description: '油脂分泌旺盛', suggestion: '使用控油产品' },
    { id: 'dull', name: '暗沉', severity: 'moderate', description: '肤色暗沉缺乏光泽', suggestion: '注意防晒' }
];

const HEALTH_TIPS = [
    { id: 'qi-blood', title: '气血提示', description: '眼下暗沉可能与气血不足有关', suggestion: '建议多食用红枣等食物' },
    { id: 'spleen', title: '脾胃提示', description: '鼻翼泛红可能与脾胃功能有关', suggestion: '建议饮食规律' }
];

const SKINCARE_RECOMMENDATIONS = [
    { id: 'cleanser', name: '温和洁面', icon: '🧴', description: '选择氨基酸洁面产品，避免过度清洁' },
    { id: 'moisturizer', name: '保湿补水', icon: '💧', description: '使用适合肤质的保湿乳液或面霜' },
    { id: 'sunblock', name: '防晒防护', icon: '☀️', description: '每天使用防晒霜，防止紫外线伤害' },
    { id: 'mask', name: '定期敷面膜', icon: '🎭', description: '每周使用2-3次面膜，深层滋养肌肤' },
    { id: 'eye-cream', name: '眼霜护理', icon: '👁️', description: '使用眼霜呵护眼周肌肤' },
    { id: 'serum', name: '精华液', icon: '✨', description: '根据肌肤需求选择针对性精华' }
];

function compressImage(base64Str, maxWidth, maxHeight, quality) {
    maxWidth = maxWidth || 300; maxHeight = maxHeight || 300; quality = quality || 0.6;
    return new Promise(function(resolve) {
        const img = new Image();
        img.src = base64Str;
        img.onload = function() {
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
            if (h > maxHeight) { w = (w * maxHeight) / h; h = maxHeight; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = function() { resolve(base64Str); };
    });
}

function getSeverityStyle(severity, isCute) {
    switch (severity) {
        case 'mild': return 'bg-green-100 text-green-700';
        case 'moderate': return 'bg-yellow-100 text-yellow-700';
        case 'severe': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getSeverityLabel(severity) {
    switch (severity) {
        case 'mild': return '轻微需要注意';
        case 'moderate': return '日常护理可改善';
        case 'severe': return '建议咨询专业人士';
        default: return '';
    }
}

function generateRadarData(record) {
    var details = record.skinResult.analysisDetails || {};
    var issues = record.skinResult.issues || [];
    var getIssueScore = function(id) {
        var issue = issues.find(function(i) { return i.id === id; });
        if (!issue) return 85;
        if (issue.severity === 'severe') return 40;
        if (issue.severity === 'moderate') return 60;
        return 75;
    };
    var moisture = details.brightness ? Math.min(95, Math.max(40, details.brightness - 10)) : 70;
    var oiliness = details.oiliness ? Math.min(95, Math.max(40, 100 - details.oiliness * 2)) : 75;
    var smoothness = getIssueScore('acne');
    var evenness = getIssueScore('darkspot');
    var firmness = getIssueScore('wrinkle');
    var sensitivity = getIssueScore('redness');
    return [
        { name: '水润度', value: moisture },
        { name: '油脂平衡', value: oiliness },
        { name: '光滑度', value: smoothness },
        { name: '均匀度', value: evenness },
        { name: '紧致度', value: firmness },
        { name: '耐受度', value: sensitivity }
    ];
}

function RadarChart(props) {
    var data = props.data;
    var size = props.size || 260;
    var cx = size / 2;
    var cy = size / 2;
    var maxR = size / 2 - 30;
    var levels = 4;
    var n = data.length;
    var angleStep = (Math.PI * 2) / n;

    var getPoint = function(index, ratio) {
        var angle = angleStep * index - Math.PI / 2;
        return {
            x: cx + Math.cos(angle) * maxR * ratio,
            y: cy + Math.sin(angle) * maxR * ratio
        };
    };

    var gridPath = [];
    for (var l = 1; l <= levels; l++) {
        var ratio = l / levels;
        var points = [];
        for (var i = 0; i < n; i++) {
            var p = getPoint(i, ratio);
            points.push(p.x + ',' + p.y);
        }
        gridPath.push('M' + points.join('L') + 'Z');
    }

    var axisLines = [];
    for (var j = 0; j < n; j++) {
        var p0 = getPoint(j, 0);
        var p1 = getPoint(j, 1);
        axisLines.push('M' + p0.x + ',' + p0.y + 'L' + p1.x + ',' + p1.y);
    }

    var dataPoints = [];
    var dataPathPoints = [];
    for (var k = 0; k < n; k++) {
        var dp = getPoint(k, data[k].value / 100);
        dataPoints.push(dp);
        dataPathPoints.push(dp.x + ',' + dp.y);
    }
    var dataPath = 'M' + dataPathPoints.join('L') + 'Z';

    var labels = data.map(function(d, idx) {
        var lp = getPoint(idx, 1.18);
        return { x: lp.x, y: lp.y, name: d.name, value: d.value };
    });

    return e('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, className: 'mx-auto' },
        gridPath.map(function(d, i) {
            return e('path', { key: 'grid-' + i, d: d, fill: 'none', stroke: '#e5e7eb', strokeWidth: 1 });
        }),
        axisLines.map(function(d, i) {
            return e('path', { key: 'axis-' + i, d: d, stroke: '#e5e7eb', strokeWidth: 1 });
        }),
        e('path', { d: dataPath, fill: 'rgba(244, 114, 182, 0.25)', stroke: '#f472b6', strokeWidth: 2 }),
        dataPoints.map(function(p, i) {
            return e('circle', { key: 'dot-' + i, cx: p.x, cy: p.y, r: 4, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 });
        }),
        labels.map(function(l, i) {
            return e('g', { key: 'label-' + i },
                e('text', { x: l.x, y: l.y - 2, textAnchor: 'middle', fontSize: 11, fill: '#6b7280', fontWeight: 500 }, l.name),
                e('text', { x: l.x, y: l.y + 12, textAnchor: 'middle', fontSize: 12, fill: '#ec4899', fontWeight: 700 }, l.value)
            );
        })
    );
}

function TrendChart(props) {
    var records = props.records;
    var width = props.width || 320;
    var height = props.height || 160;
    var padding = { top: 20, right: 20, bottom: 30, left: 30 };
    var chartW = width - padding.left - padding.right;
    var chartH = height - padding.top - padding.bottom;

    var recent = records.slice(-7);
    if (recent.length < 2) {
        return e('div', { className: 'text-center py-8 text-gray-400 text-sm' }, '至少需要2次检测才能查看趋势');
    }

    var scores = recent.map(function(r) { return r.skinResult ? r.skinResult.overallScore : 0; });
    var minScore = Math.min.apply(null, scores) - 5;
    var maxScore = Math.max.apply(null, scores) + 5;
    if (maxScore - minScore < 20) {
        var avg = (minScore + maxScore) / 2;
        minScore = avg - 15;
        maxScore = avg + 15;
    }

    var points = recent.map(function(r, i) {
        var x = padding.left + (chartW / (recent.length - 1)) * i;
        var y = padding.top + chartH - chartH * ((r.skinResult.overallScore - minScore) / (maxScore - minScore));
        return { x: x, y: y, score: r.skinResult.overallScore, date: new Date(r.createdAt || r.date) };
    });

    var pathD = 'M' + points[0].x + ',' + points[0].y + ' ' + points.slice(1).map(function(p) { return 'L' + p.x + ',' + p.y; }).join(' ');
    var areaD = pathD + ' L' + points[points.length - 1].x + ',' + (padding.top + chartH) + ' L' + points[0].x + ',' + (padding.top + chartH) + ' Z';

    var yTicks = [];
    for (var t = 0; t <= 4; t++) {
        var yVal = minScore + (maxScore - minScore) * (t / 4);
        var yPos = padding.top + chartH - chartH * (t / 4);
        yTicks.push({ value: Math.round(yVal), y: yPos });
    }

    return e('svg', { width: width, height: height, viewBox: '0 0 ' + width + ' ' + height, className: 'w-full' },
        yTicks.map(function(t, i) {
            return e('g', { key: 'yt-' + i },
                e('line', { x1: padding.left, y1: t.y, x2: padding.left + chartW, y2: t.y, stroke: '#f3f4f6', strokeWidth: 1 }),
                e('text', { x: padding.left - 6, y: t.y + 4, textAnchor: 'end', fontSize: 10, fill: '#9ca3af' }, t.value)
            );
        }),
        e('path', { d: areaD, fill: 'url(#gradient)' }),
        e('defs', null,
            e('linearGradient', { id: 'gradient', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
                e('stop', { offset: '0%', style: 'stop-color:#f472b6;stop-opacity:0.3' }),
                e('stop', { offset: '100%', style: 'stop-color:#f472b6;stop-opacity:0' })
            )
        ),
        e('path', { d: pathD, fill: 'none', stroke: '#f472b6', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        points.map(function(p, i) {
            return e('g', { key: 'pt-' + i },
                e('circle', { cx: p.x, cy: p.y, r: 4, fill: '#fff', stroke: '#f472b6', strokeWidth: 2 }),
                e('text', { x: p.x, y: p.y - 10, textAnchor: 'middle', fontSize: 10, fill: '#ec4899', fontWeight: 600 }, p.score)
            );
        }),
        points.map(function(p, i) {
            if (i % 2 !== 0 && recent.length > 4) return null;
            var dateStr = (p.date.getMonth() + 1) + '/' + p.date.getDate();
            return e('text', { key: 'dt-' + i, x: p.x, y: height - 8, textAnchor: 'middle', fontSize: 10, fill: '#9ca3af' }, dateStr);
        })
    );
}

function generateShortLongTermPlans(record) {
    var issues = record.skinResult.issues || [];
    var lip = record.lipAnalysis || {};
    var eye = record.eyeAnalysis || {};
    var face = record.faceColorAnalysis || {};

    var shortTerm = [];
    var longTerm = [];

    if (issues.some(function(i) { return i.id === 'acne' && i.severity === 'severe'; })) {
        shortTerm.push({ icon: '🧴', title: '痘痘急救', desc: '点涂祛痘精华，避免用手挤压，保持局部清洁', time: '24-48小时' });
    }
    if (issues.some(function(i) { return i.id === 'redness' && i.severity !== 'mild'; })) {
        shortTerm.push({ icon: '❄️', title: '舒缓退红', desc: '冷敷镇静，使用舒缓修护类护肤品，避免刺激', time: '1-3天' });
    }
    if (issues.some(function(i) { return i.id === 'darkspot' && i.severity !== 'mild'; })) {
        shortTerm.push({ icon: '✨', title: '提亮急救', desc: '使用提亮精华，加强防晒，均匀肤色', time: '7-14天' });
    }
    if (eye.severity === 'severe' || eye.severity === 'moderate') {
        shortTerm.push({ icon: '👁️', title: '眼部护理', desc: '使用眼霜配合轻柔按摩，冷热交替敷眼', time: '3-7天' });
    }
    if (lip.severity === 'severe' || lip.severity === 'moderate') {
        shortTerm.push({ icon: '💋', title: '唇部护理', desc: '使用润唇膏，多喝水，避免舔唇', time: '3-5天' });
    }
    if (shortTerm.length === 0) {
        shortTerm.push({ icon: '💧', title: '补水保湿', desc: '加强补水，保持肌肤水润状态', time: '日常维护' });
        shortTerm.push({ icon: '☀️', title: '严格防晒', desc: '每天使用防晒产品，预防光老化', time: '每日坚持' });
    }

    longTerm.push({ icon: '🥗', title: '饮食调理', desc: '多吃富含维生素C、E的食物，少糖少辣，饮食清淡均衡', period: '长期' });
    longTerm.push({ icon: '😴', title: '作息规律', desc: '保证7-8小时睡眠，晚上11点前入睡，养气血助修复', period: '长期' });
    longTerm.push({ icon: '🧘', title: '运动习惯', desc: '每周3-4次有氧运动，每次30分钟，促进血液循环', period: '长期' });
    longTerm.push({ icon: '😊', title: '情绪管理', desc: '保持心情舒畅，减少压力，好情绪是最好的护肤品', period: '长期' });
    if (lip.severity === 'severe' || (face && face.severity === 'severe')) {
        longTerm.push({ icon: '🩺', title: '中医调理', desc: '建议咨询专业中医师，根据体质进行辨证调理', period: '1-3个月' });
    }
    longTerm.push({ icon: '📅', title: '定期检测', desc: '每2周做一次皮肤检测，跟踪皮肤状态变化趋势', period: '持续' });

    return { shortTerm: shortTerm.slice(0, 4), longTerm: longTerm.slice(0, 5) };
}

function getFaceShapeName(shape) {
    switch (shape) {
        case 'oval': return '椭圆形'; case 'round': return '圆形';
        case 'square': return '方形'; case 'heart': return '心形';
        case 'long': return '长形'; default: return '标准型';
    }
}

function showToast(message, duration) {
    duration = duration || 2000;
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, duration);
}

function analyzeSkinFromImage(imageData, userSkinType) {
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;

    var totalBrightness = 0;
    var totalRedness = 0;
    var darkPixelCount = 0;
    var redPixelCount = 0;
    var shinyPixelCount = 0;
    var pixelCount = 0;

    var lipPixelCount = 0;
    var lipR = 0, lipG = 0, lipB = 0;
    var lipSaturation = 0;
    var lipBrightness = 0;

    var leftEyePixelCount = 0;
    var leftEyeBrightness = 0;
    var leftEyeDarkPixels = 0;
    var leftEyeContrast = 0;

    var rightEyePixelCount = 0;
    var rightEyeBrightness = 0;
    var rightEyeDarkPixels = 0;
    var rightEyeContrast = 0;

    var facePixelCount = 0;
    var faceR = 0, faceG = 0, faceB = 0;
    var faceBrightness = 0;
    var faceRedness = 0;
    var faceYellowness = 0;

    var yintangPixelCount = 0;
    var yintangR = 0, yintangG = 0, yintangB = 0;
    var yintangBrightness = 0;
    var yintangDarkPixels = 0;

    var faceCenterY = height * 0.65;
    var faceWidth = width * 0.25;
    var lipTop = faceCenterY - 15;
    var lipBottom = faceCenterY + 10;

    var leftEyeX = width * 0.38;
    var rightEyeX = width * 0.62;
    var eyeY = height * 0.42;
    var eyeWidth = width * 0.08;
    var eyeHeight = height * 0.06;

    var faceCenterX = width / 2;
    var faceAnalyzeTop = height * 0.3;
    var faceAnalyzeBottom = height * 0.6;
    var faceAnalyzeLeft = faceCenterX - width * 0.2;
    var faceAnalyzeRight = faceCenterX + width * 0.2;

    var yintangX = width / 2;
    var yintangY = height * 0.33;
    var yintangWidth = width * 0.1;
    var yintangHeight = height * 0.06;

    for (var y = 0; y < height; y += 4) {
        for (var x = 0; x < width; x += 4) {
            var i = (y * width + x) * 4;
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            var brightness = (r + g + b) / 3;

            totalBrightness += brightness;

            if (r > g * 1.15 && r > b * 1.1 && r > 120) {
                redPixelCount++;
                totalRedness += (r - Math.max(g, b)) / r;
            }

            if (brightness > 200 && r > 180 && g > 180 && b > 180) {
                shinyPixelCount++;
            }

            if (brightness < 80) {
                darkPixelCount++;
            }

            var centerX = width / 2;
            var distFromCenter = Math.abs(x - centerX);
            if (y >= lipTop && y <= lipBottom && distFromCenter < faceWidth) {
                var isRed = r > 120 && r > g * 1.1 && r > b * 1.1;
                var isPink = r > 150 && g > 100 && b > 100 && Math.abs(r - g) < 50 && Math.abs(r - b) < 50;
                var maxC = Math.max(r, g, b);
                var minC = Math.min(r, g, b);
                var sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
                var bri = brightness / 255;
                if (isRed || isPink) {
                    lipR += r;
                    lipG += g;
                    lipB += b;
                    lipSaturation += sat;
                    lipBrightness += bri;
                    lipPixelCount++;
                }
            }

            if (Math.abs(x - leftEyeX) < eyeWidth && Math.abs(y - eyeY) < eyeHeight) {
                leftEyeBrightness += brightness;
                if (brightness < 60) leftEyeDarkPixels++;
                leftEyePixelCount++;
            }

            if (Math.abs(x - rightEyeX) < eyeWidth && Math.abs(y - eyeY) < eyeHeight) {
                rightEyeBrightness += brightness;
                if (brightness < 60) rightEyeDarkPixels++;
                rightEyePixelCount++;
            }

            if (y >= faceAnalyzeTop && y <= faceAnalyzeBottom && x >= faceAnalyzeLeft && x <= faceAnalyzeRight) {
                var isSkin = r > 80 && g > 60 && b > 50 && r > g && g > b * 0.85;
                if (isSkin && brightness > 50) {
                    faceR += r;
                    faceG += g;
                    faceB += b;
                    faceBrightness += brightness;
                    if (r > g * 1.1 && r > b * 1.1) faceRedness++;
                    if (r > 200 && g > 180 && b < 150) faceYellowness++;
                    facePixelCount++;
                }
            }

            if (Math.abs(x - yintangX) < yintangWidth && Math.abs(y - yintangY) < yintangHeight) {
                var isSkin2 = r > 80 && g > 60 && b > 50 && r > g && g > b * 0.85;
                if (isSkin2) {
                    yintangR += r;
                    yintangG += g;
                    yintangB += b;
                    yintangBrightness += brightness;
                    if (brightness < 100) yintangDarkPixels++;
                    yintangPixelCount++;
                }
            }

            pixelCount++;
        }
    }

    var lipAnalysis = null;
    if (lipPixelCount > 0) {
        var avgLipR = lipR / lipPixelCount;
        var avgLipG = lipG / lipPixelCount;
        var avgLipB = lipB / lipPixelCount;
        var avgLipSat = lipSaturation / lipPixelCount;
        var avgLipBri = lipBrightness / lipPixelCount;

        var lipCondition = 'healthy';
        var lipDescription = '唇色红润';
        var lipSuggestion = '唇色健康，气血充足';
        var lipSeverity = 'mild';

        if (avgLipR < 120 || avgLipSat < 0.15) {
            if (avgLipR < 100) {
                lipCondition = 'blood-deficiency';
                lipDescription = '唇色苍白或暗淡';
                lipSuggestion = '唇色偏淡可能提示气血不足，建议多吃红枣、枸杞等补血食物';
                lipSeverity = 'severe';
            } else {
                lipCondition = 'blood-deficiency-mild';
                lipDescription = '唇色偏淡';
                lipSuggestion = '唇色偏淡可能提示气血稍弱，建议注意营养均衡';
                lipSeverity = 'mild';
            }
        } else if (avgLipR > 180 && avgLipBri > 0.75) {
            lipCondition = 'heat';
            lipDescription = '唇色偏红';
            lipSuggestion = '唇色偏红可能提示体内有热，建议清淡饮食，多喝水';
            lipSeverity = 'mild';
        } else if (avgLipSat < 0.2 && avgLipBri > 0.6) {
            lipCondition = 'qi-deficiency';
            lipDescription = '唇色偏淡偏白';
            lipSuggestion = '唇色偏淡可能提示气虚，建议适当运动，保证充足睡眠';
            lipSeverity = 'mild';
        }

        lipAnalysis = {
            condition: lipCondition,
            description: lipDescription,
            suggestion: lipSuggestion,
            severity: lipSeverity,
            avgR: Math.round(avgLipR),
            avgG: Math.round(avgLipG),
            avgB: Math.round(avgLipB),
            saturation: Math.round(avgLipSat * 100),
            brightness: Math.round(avgLipBri * 100)
        };
    }

    var eyeAnalysis = null;
    if (leftEyePixelCount > 10 && rightEyePixelCount > 10) {
        var avgLeftBrightness = leftEyeBrightness / leftEyePixelCount;
        var avgRightBrightness = rightEyeBrightness / rightEyePixelCount;
        var avgEyeBrightness = (avgLeftBrightness + avgRightBrightness) / 2;
        var leftDarkRatio = leftEyeDarkPixels / leftEyePixelCount;
        var rightDarkRatio = rightEyeDarkPixels / rightEyePixelCount;
        var avgDarkRatio = (leftDarkRatio + rightDarkRatio) / 2;

        var eyeCondition = 'bright';
        var eyeDescription = '眼睛有神';
        var eyeSuggestion = '眼神明亮，精神状态良好';
        var eyeSeverity = 'mild';

        if (avgEyeBrightness < 80 || avgDarkRatio > 0.4) {
            eyeCondition = 'tired';
            eyeDescription = '眼睛无神，有疲态';
            eyeSuggestion = '眼神暗淡可能提示疲劳或睡眠不足，建议保证充足睡眠，适当休息眼睛';
            eyeSeverity = 'moderate';
        } else if (avgEyeBrightness < 100 || avgDarkRatio > 0.25) {
            eyeCondition = 'slightly-tired';
            eyeDescription = '眼睛略显疲惫';
            eyeSuggestion = '眼神稍显暗淡，建议注意用眼卫生，适当做眼保健操';
            eyeSeverity = 'mild';
        }

        eyeAnalysis = {
            condition: eyeCondition,
            description: eyeDescription,
            suggestion: eyeSuggestion,
            severity: eyeSeverity,
            avgBrightness: Math.round(avgEyeBrightness),
            darkRatio: Math.round(avgDarkRatio * 100)
        };
    }

    var faceColorAnalysis = null;
    if (facePixelCount > 50) {
        var avgFaceR = faceR / facePixelCount;
        var avgFaceG = faceG / facePixelCount;
        var avgFaceB = faceB / facePixelCount;
        var avgFaceBrightness = faceBrightness / facePixelCount;
        var rednessRatio = faceRedness / facePixelCount;
        var yellownessRatio = faceYellowness / facePixelCount;

        var faceCondition = 'healthy';
        var faceDescription = '面色红润有光泽';
        var faceSuggestion = '面色健康，气血充足';
        var faceSeverity = 'mild';

        if (avgFaceBrightness > 180 && rednessRatio > 0.3) {
            faceCondition = 'flushed';
            faceDescription = '面色偏红';
            faceSuggestion = '面色偏红可能提示体内有热或肝火旺，建议清淡饮食，保持心情舒畅';
            faceSeverity = 'moderate';
        } else if (avgFaceBrightness < 100) {
            faceCondition = 'pale';
            faceDescription = '面色苍白';
            faceSuggestion = '面色苍白可能提示气血不足，建议多吃补血食物，如红枣、桂圆、黑芝麻等';
            faceSeverity = 'severe';
        } else if (avgFaceBrightness < 130 && rednessRatio < 0.1) {
            faceCondition = 'qi-deficiency';
            faceDescription = '面色偏白无华';
            faceSuggestion = '面色偏白可能提示气虚或血虚，建议注意营养均衡，适当运动';
            faceSeverity = 'moderate';
        } else if (yellownessRatio > 0.1) {
            faceCondition = 'yellow';
            faceDescription = '面色偏黄';
            faceSuggestion = '面色偏黄可能提示脾虚或湿气重，建议健脾祛湿，饮食规律';
            faceSeverity = 'moderate';
        }

        faceColorAnalysis = {
            condition: faceCondition,
            description: faceDescription,
            suggestion: faceSuggestion,
            severity: faceSeverity,
            avgR: Math.round(avgFaceR),
            avgG: Math.round(avgFaceG),
            avgB: Math.round(avgFaceB),
            brightness: Math.round(avgFaceBrightness),
            rednessRatio: Math.round(rednessRatio * 100),
            yellownessRatio: Math.round(yellownessRatio * 100)
        };
    }

    var yintangAnalysis = null;
    if (yintangPixelCount > 20) {
        var avgYintangBrightness = yintangBrightness / yintangPixelCount;
        var avgYintangR = yintangR / yintangPixelCount;
        var avgYintangG = yintangG / yintangPixelCount;
        var avgYintangB = yintangB / yintangPixelCount;
        var darkRatio2 = yintangDarkPixels / yintangPixelCount;

        var yintangCondition = 'bright';
        var yintangDescription = '印堂明亮';
        var yintangSuggestion = '印堂光亮，气血顺畅，精神状态良好';
        var yintangSeverity = 'mild';

        if (darkRatio2 > 0.3 || avgYintangBrightness < 90) {
            yintangCondition = 'dark';
            yintangDescription = '印堂发暗';
            yintangSuggestion = '印堂发暗可能提示气血不畅或压力过大，建议放松心情，保证睡眠，适当运动';
            yintangSeverity = 'severe';
        } else if (darkRatio2 > 0.15 || avgYintangBrightness < 110) {
            yintangCondition = 'slightly-dull';
            yintangDescription = '印堂稍暗';
            yintangSuggestion = '印堂稍显暗淡，建议注意休息，减轻压力，保持心情愉悦';
            yintangSeverity = 'moderate';
        } else if (avgYintangR > avgYintangG * 1.1 && avgYintangR > 150) {
            yintangCondition = 'red';
            yintangDescription = '印堂发红';
            yintangSuggestion = '印堂发红可能提示心火较旺，建议清淡饮食，保持心情平和';
            yintangSeverity = 'moderate';
        }

        yintangAnalysis = {
            condition: yintangCondition,
            description: yintangDescription,
            suggestion: yintangSuggestion,
            severity: yintangSeverity,
            brightness: Math.round(avgYintangBrightness),
            darkRatio: Math.round(darkRatio2 * 100),
            avgR: Math.round(avgYintangR),
            avgG: Math.round(avgYintangG),
            avgB: Math.round(avgYintangB)
        };
    }

    var avgBrightness = totalBrightness / pixelCount;
    var rednessRatio2 = redPixelCount / pixelCount;
    var shinyRatio = shinyPixelCount / pixelCount;
    var darkRatio = darkPixelCount / pixelCount;

    var issues = [];
    var overallScore = 85;

    if (userSkinType === 'oily' || shinyRatio > 0.05) {
        var severity = shinyRatio > 0.12 ? 'severe' : shinyRatio > 0.07 ? 'moderate' : 'mild';
        var descText = severity === 'severe' ? '油脂分泌旺盛' : severity === 'moderate' ? 'T区出油明显' : '有轻微出油';
        var sugText = severity === 'severe' ? '建议使用控油护肤产品，注意清洁' : '建议使用清爽型护肤品';
        issues.push({
            id: 'oil',
            name: '出油',
            severity: severity,
            description: '面部' + descText,
            suggestion: sugText
        });
        if (severity === 'severe') overallScore -= 10;
        else if (severity === 'moderate') overallScore -= 5;
    }

    if (rednessRatio2 > 0.08) {
        var severity2 = rednessRatio2 > 0.18 ? 'severe' : rednessRatio2 > 0.12 ? 'moderate' : 'mild';
        var descText2 = severity2 === 'severe' ? '泛红明显' : severity2 === 'moderate' ? '有明显泛红' : '轻微泛红';
        issues.push({
            id: 'redness',
            name: '泛红',
            severity: severity2,
            description: '面部' + descText2,
            suggestion: '建议使用温和舒缓的护肤品，避免刺激'
        });
        if (severity2 === 'severe') overallScore -= 8;
        else if (severity2 === 'moderate') overallScore -= 4;
    }

    if (darkRatio > 0.06) {
        var severity3 = darkRatio > 0.12 ? 'severe' : darkRatio > 0.09 ? 'moderate' : 'mild';
        var descText3 = severity3 === 'severe' ? '暗沉明显' : '有暗沉';
        issues.push({
            id: 'dark-circle',
            name: '黑眼圈/暗沉',
            severity: severity3,
            description: '眼部/面部' + descText3,
            suggestion: '建议保证充足睡眠，使用提亮产品'
        });
        if (severity3 === 'severe') overallScore -= 7;
        else if (severity3 === 'moderate') overallScore -= 3;
    }

    if (avgBrightness < 130) {
        var severity4 = avgBrightness < 100 ? 'moderate' : 'mild';
        issues.push({
            id: 'dull',
            name: '肤色暗沉',
            severity: severity4,
            description: '肤色整体偏暗，缺乏光泽',
            suggestion: '建议注意防晒，使用提亮肤色的产品'
        });
        overallScore -= 5;
    }

    if (userSkinType === 'oily' && shinyRatio > 0.08) {
        var severity5 = shinyRatio > 0.15 ? 'moderate' : 'mild';
        issues.push({
            id: 'blackhead',
            name: '黑头',
            severity: severity5,
            description: 'T区可能存在黑头问题',
            suggestion: '建议定期使用清洁面膜，注意毛孔清洁'
        });
        overallScore -= 3;
    }

    if (rednessRatio2 > 0.05 && userSkinType === 'oily') {
        var severity6 = rednessRatio2 > 0.1 ? 'moderate' : 'mild';
        issues.push({
            id: 'pimple',
            name: '痘痘',
            severity: severity6,
            description: '可能存在痘痘或痘印问题',
            suggestion: '建议保持面部清洁，使用祛痘产品'
        });
        overallScore -= 4;
    }

    overallScore = Math.max(60, Math.min(98, overallScore));

    var skincareRecommendations = [];
    if (shinyRatio > 0.08) {
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[0]);
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[1]);
    }
    if (darkRatio > 0.05) {
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[4]);
    }
    if (rednessRatio2 > 0.08) {
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[0]);
    }
    if (avgBrightness < 80) {
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[2]);
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[5]);
    }
    if (skincareRecommendations.length === 0) {
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[0]);
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[1]);
        skincareRecommendations.push(SKINCARE_RECOMMENDATIONS[2]);
    }

    var healthTips = [];
    if (darkRatio > 0.08) {
        healthTips.push({
            id: 'sleep',
            title: '作息提示',
            description: '眼部暗沉可能与睡眠不足有关',
            suggestion: '建议每天保证7-8小时睡眠'
        });
    }
    if (rednessRatio2 > 0.1) {
        healthTips.push({
            id: 'diet',
            title: '饮食提示',
            description: '面部泛红可能与饮食刺激有关',
            suggestion: '建议减少辛辣刺激食物，饮食清淡'
        });
    }
    if (shinyRatio > 0.1) {
        healthTips.push({
            id: 'water',
            title: '补水提示',
            description: '出油多可能是水油失衡的表现',
            suggestion: '建议多喝水，注意皮肤补水'
        });
    }
    if (healthTips.length === 0) {
        healthTips.push(HEALTH_TIPS[0]);
    }

    return {
        overallScore: Math.round(overallScore),
        issues: issues.length > 0 ? issues : [SKIN_ISSUES[3]],
        healthTips: healthTips,
        skincareRecommendations: skincareRecommendations.slice(0, 4),
        lipAnalysis: lipAnalysis,
        eyeAnalysis: eyeAnalysis,
        faceColorAnalysis: faceColorAnalysis,
        yintangAnalysis: yintangAnalysis,
        analysisDetails: {
            brightness: Math.round(avgBrightness),
            redness: Math.round(rednessRatio2 * 1000) / 10,
            oiliness: Math.round(shinyRatio * 1000) / 10,
            darkAreas: Math.round(darkRatio * 1000) / 10
        }
    };
}

var AppContext = createContext();

function AppProvider(props) {
    var children = props.children;
    var _useState = useState({
        user: null,
        currentStyle: 'neutral',
        scanHistory: [],
        selectedRecordId: null,
        communityPosts: [],
        aiChatHistory: [],
        skinCheckIns: JSON.parse(localStorage.getItem('yanrong_checkins') || '{}'),
        showPrivacyModal: !localStorage.getItem('yanrong_privacy_agreed'),
        toast: null,
        isLoading: false
    });
    var state = _useState[0];
    var setState = _useState[1];

    var showToastMessage = function(message, type, duration) {
        type = type || 'info';
        duration = duration || 2000;
        setState(function(prev) { return { ...prev, toast: { message: message, type: type } }; });
        setTimeout(function() {
            setState(function(prev) { return { ...prev, toast: null }; });
        }, duration);
    };

    var agreePrivacy = function() {
        localStorage.setItem('yanrong_privacy_agreed', 'true');
        setState(function(prev) { return { ...prev, showPrivacyModal: false }; });
    };

    var fetchUserProfile = useCallback(function() {
        var token = localStorage.getItem('yanrong_token');
        if (!token) return;
        api.auth.profile().then(function(data) {
            if (data.success && data.user) {
                setState(function(prev) {
                    return {
                        ...prev,
                        user: data.user,
                        currentStyle: data.user.gender === 'female' ? 'cute' : 'neutral'
                    };
                });
            }
        });
    }, []);

    useEffect(function() {
        fetchUserProfile();
        var savedStyle = localStorage.getItem('yanrong_style');
        if (savedStyle) {
            setState(function(prev) { return { ...prev, currentStyle: savedStyle }; });
        }
    }, [fetchUserProfile]);

    var login = async function(username, password) {
        var result = await api.auth.login({ username: username, password: password });
        if (result.success && result.token) {
            localStorage.setItem('yanrong_token', result.token);
            await fetchUserProfile();
            showToastMessage('登录成功', 'success');
            return { success: true };
        }
        showToastMessage(result.message || '登录失败', 'error');
        return { success: false, message: result.message || '登录失败' };
    };

    var register = async function(username, password, gender, skinType) {
        var result = await api.auth.register({
            username: username,
            password: password,
            gender: gender,
            skinType: skinType
        });
        if (result.success && result.token) {
            localStorage.setItem('yanrong_token', result.token);
            await fetchUserProfile();
            showToastMessage('注册成功', 'success');
            return { success: true };
        }
        showToastMessage(result.message || '注册失败', 'error');
        return { success: false, message: result.message || '注册失败' };
    };

    var logout = function() {
        localStorage.removeItem('yanrong_token');
        setState(function(prev) {
            return {
                ...prev,
                user: null,
                scanHistory: [],
                selectedRecordId: null,
                communityPosts: [],
                aiChatHistory: []
            };
        });
        showToastMessage('已退出登录', 'info');
    };

    var updateProfile = async function(userInfo) {
        var result = await api.auth.updateProfile(userInfo);
        if (result.success && result.user) {
            setState(function(prev) { return { ...prev, user: result.user }; });
            showToastMessage('保存成功', 'success');
            return { success: true };
        }
        showToastMessage(result.message || '保存失败', 'error');
        return { success: false, message: result.message };
    };

    var changePassword = async function(oldPassword, newPassword) {
        var result = await api.auth.changePassword({
            oldPassword: oldPassword,
            newPassword: newPassword
        });
        if (result.success) {
            showToastMessage('密码修改成功', 'success');
            return { success: true };
        }
        showToastMessage(result.message || '修改失败', 'error');
        return { success: false, message: result.message };
    };

    var setStyle = function(style) {
        localStorage.setItem('yanrong_style', style);
        setState(function(prev) { return { ...prev, currentStyle: style }; });
    };

    var setSelectedRecord = function(recordId) {
        setState(function(prev) { return { ...prev, selectedRecordId: recordId }; });
    };

    var addScanRecord = function(record) {
        setState(function(prev) {
            return { ...prev, scanHistory: [record, ...prev.scanHistory] };
        });
    };

    var setScanHistory = function(records) {
        setState(function(prev) { return { ...prev, scanHistory: records }; });
    };

    var setCommunityPosts = function(posts) {
        setState(function(prev) { return { ...prev, communityPosts: posts }; });
    };

    var addCommunityPost = function(post) {
        setState(function(prev) {
            return { ...prev, communityPosts: [post, ...prev.communityPosts] };
        });
    };

    var setAiChatHistory = function(history) {
        setState(function(prev) { return { ...prev, aiChatHistory: history }; });
    };

    var loadRecords = async function() {
        var result = await api.records.list(1, 100);
        if (result.success) {
            var records = result.records || (result.data && result.data.records) || [];
            setScanHistory(records);
        }
    };

    var loadCommunityPosts = async function() {
        var result = await api.community.list(1, 20);
        if (result.success) {
            var posts = result.posts || (result.data && (result.data.posts || result.data)) || [];
            setCommunityPosts(posts);
        }
    };

    var toggleLike = async function(postId) {
        var result = await api.community.like(postId);
        if (result.success) {
            await loadCommunityPosts();
        }
    };

    var contextValue = {
        state: state,
        login: login,
        register: register,
        logout: logout,
        updateProfile: updateProfile,
        changePassword: changePassword,
        setStyle: setStyle,
        setSelectedRecord: setSelectedRecord,
        addScanRecord: addScanRecord,
        setScanHistory: setScanHistory,
        setCommunityPosts: setCommunityPosts,
        addCommunityPost: addCommunityPost,
        setAiChatHistory: setAiChatHistory,
        loadRecords: loadRecords,
        loadCommunityPosts: loadCommunityPosts,
        toggleLike: toggleLike,
        showToast: showToastMessage,
        agreePrivacy: agreePrivacy,
        fetchUserProfile: fetchUserProfile
    };

    return e(AppContext.Provider, { value: contextValue },
        state.toast && e(Toast, { message: state.toast.message, type: state.toast.type }),
        state.showPrivacyModal && e(PrivacyModal, { onAgree: agreePrivacy }),
        children
    );
}

function useApp() {
    return useContext(AppContext);
}

function Toast(props) {
    var message = props.message;
    var type = props.type || 'info';
    var bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-gray-800';
    return e('div', {
        className: 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white text-sm shadow-lg animate-fade-in ' + bgColor,
        style: { maxWidth: '90vw' }
    }, message);
}

function PrivacyModal(props) {
    var onAgree = props.onAgree;
    var _useState2 = useState(false);
    var showFullContent = _useState2[0];
    var setShowFullContent = _useState2[1];

    return e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
        e('div', { className: 'bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto animate-scale-in' },
            e('div', { className: 'text-center mb-4' },
                e('div', { className: 'w-16 h-16 mx-auto mb-3 rounded-full bg-pink-100 flex items-center justify-center' },
                    e('span', { className: 'text-3xl' }, '🔒')
                ),
                e('h2', { className: 'text-xl font-bold text-gray-800' }, '隐私政策与用户协议'),
                e('p', { className: 'text-sm text-gray-500 mt-1' }, '请仔细阅读以下内容')
            ),
            e('div', { className: 'space-y-4 text-sm text-gray-600 mb-6' },
                e('div', { className: 'p-3 bg-gray-50 rounded-xl' },
                    e('h3', { className: 'font-semibold text-gray-700 mb-2' }, '📋 用户授权'),
                    e('p', null, '使用本应用需要您授权相机和相册权限，用于拍摄和上传面部照片进行皮肤分析。您的照片仅用于分析，不会用于其他用途。')
                ),
                e('div', { className: 'p-3 bg-gray-50 rounded-xl' },
                    e('h3', { className: 'font-semibold text-gray-700 mb-2' }, '🔐 隐私政策'),
                    e('p', null, '我们重视您的隐私保护。您的个人信息和检测数据将被安全存储，不会未经授权泄露给第三方。您可以随时删除自己的数据。')
                ),
                e('div', { className: 'p-3 bg-gray-50 rounded-xl' },
                    e('h3', { className: 'font-semibold text-gray-700 mb-2' }, '⚠️ 免责声明'),
                    e('p', null, '本应用提供的皮肤分析和健康建议仅供参考，不能替代专业医疗诊断。如有皮肤问题或健康疑虑，请咨询专业医生。')
                ),
                showFullContent && e('div', { className: 'p-3 bg-gray-50 rounded-xl' },
                    e('h3', { className: 'font-semibold text-gray-700 mb-2' }, '📖 详细条款'),
                    e('p', { className: 'mb-2' }, '1. 服务内容：本应用提供基于图像识别的皮肤分析和中医面诊参考服务。'),
                    e('p', { className: 'mb-2' }, '2. 用户责任：用户应如实提供个人信息，对自己的健康负责。'),
                    e('p', { className: 'mb-2' }, '3. 数据安全：我们采用合理的安全措施保护用户数据，但不保证绝对安全。'),
                    e('p', null, '4. 服务变更：我们保留随时修改或终止服务的权利。')
                ),
                e('button', {
                    onClick: function() { setShowFullContent(!showFullContent); },
                    className: 'text-pink-500 text-sm hover:underline w-full text-center'
                }, showFullContent ? '收起' : '查看完整条款')
            ),
            e('div', { className: 'space-y-3' },
                e('button', {
                    onClick: onAgree,
                    className: 'w-full py-3 rounded-full text-white font-medium bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg active:scale-95 transition-transform'
                }, '同意并继续使用'),
                e('p', { className: 'text-xs text-gray-400 text-center' },
                    '点击「同意」即表示您已阅读并同意以上条款'
                )
            )
        )
    );
}

function Login(props) {
    var onNavigate = props.onNavigate;
    var onComplete = props.onComplete;
    var _useApp = useApp();
    var login = _useApp.login;
    var state = _useApp.state;
    var _useState = useState('');
    var username = _useState[0];
    var setUsername = _useState[1];
    var _useState2 = useState('');
    var password = _useState2[0];
    var setPassword = _useState2[1];
    var _useState3 = useState('');
    var error = _useState3[0];
    var setError = _useState3[1];
    var _useState4 = useState(false);
    var isLoading = _useState4[0];
    var setIsLoading = _useState4[1];

    var isCute = state.currentStyle === 'cute';
    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var handleLogin = async function() {
        if (!username.trim()) {
            setError('请输入用户名');
            return;
        }
        if (!password.trim()) {
            setError('请输入密码');
            return;
        }
        setIsLoading(true);
        setError('');
        var result = await login(username.trim(), password);
        setIsLoading(false);
        if (result.success) {
            onComplete();
        } else {
            setError(result.message || '登录失败');
        }
    };

    return e('div', { className: 'min-h-screen ' + bgStyle + ' flex flex-col items-center justify-center p-6' },
        e('div', { className: 'w-full max-w-md' },
            e('div', { className: 'text-center mb-8' },
                e('div', { className: 'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-200' : 'bg-gray-200') },
                    e('span', { className: 'text-3xl' }, '✨')
                ),
                e('h1', { className: 'text-2xl font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '颜容'),
                e('p', { className: 'text-gray-500 mt-2' }, '登录后体验完整功能')
            ),
            e('div', { className: cardStyle + ' p-6' },
                e('div', { className: 'space-y-4' },
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '用户名'),
                        e('input', {
                            type: 'text',
                            value: username,
                            onChange: function(ev) { setUsername(ev.target.value); setError(''); },
                            placeholder: '请输入用户名',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'
                        })
                    ),
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '密码'),
                        e('input', {
                            type: 'password',
                            value: password,
                            onChange: function(ev) { setPassword(ev.target.value); setError(''); },
                            placeholder: '请输入密码',
                            onKeyPress: function(ev) { if (ev.key === 'Enter') handleLogin(); },
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'
                        })
                    ),
                    error && e('p', { className: 'text-red-500 text-sm text-center' }, error),
                    e('button', {
                        onClick: handleLogin,
                        disabled: isLoading,
                        className: 'w-full py-3 rounded-full text-white font-medium shadow-lg ' + btnStyle + ' disabled:opacity-50 disabled:cursor-not-allowed'
                    }, isLoading ? '登录中...' : '登 录'),
                    e('div', { className: 'text-center' },
                        e('button', {
                            onClick: function() { onNavigate('register'); },
                            className: 'text-pink-600 text-sm hover:underline'
                        }, '没有账号？立即注册')
                    )
                )
            )
        )
    );
}

function Register(props) {
    var onNavigate = props.onNavigate;
    var onComplete = props.onComplete;
    var _useApp = useApp();
    var register = _useApp.register;
    var state = _useApp.state;
    var _useState = useState(1);
    var step = _useState[0];
    var setStep = _useState[1];
    var _useState2 = useState('');
    var username = _useState2[0];
    var setUsername = _useState2[1];
    var _useState3 = useState('');
    var password = _useState3[0];
    var setPassword = _useState3[1];
    var _useState4 = useState('');
    var confirmPassword = _useState4[0];
    var setConfirmPassword = _useState4[1];
    var _useState5 = useState('female');
    var gender = _useState5[0];
    var setGender = _useState5[1];
    var _useState6 = useState('combination');
    var skinType = _useState6[0];
    var setSkinType = _useState6[1];
    var _useState7 = useState('');
    var error = _useState7[0];
    var setError = _useState7[1];
    var _useState8 = useState(false);
    var isLoading = _useState8[0];
    var setIsLoading = _useState8[1];

    var bgStyle = gender === 'female' ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = gender === 'female' ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var handleNext = async function() {
        if (step === 1) {
            if (!username.trim()) {
                setError('请输入用户名');
                return;
            }
            if (username.trim().length < 3) {
                setError('用户名至少3个字符');
                return;
            }
            if (!password.trim()) {
                setError('请输入密码');
                return;
            }
            if (password.length < 6) {
                setError('密码至少6个字符');
                return;
            }
            if (password !== confirmPassword) {
                setError('两次输入的密码不一致');
                return;
            }
            setError('');
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else {
            setIsLoading(true);
            setError('');
            var result = await register(username.trim(), password, gender, skinType);
            setIsLoading(false);
            if (result.success) {
                onComplete();
            } else {
                setError(result.message || '注册失败');
                setStep(1);
            }
        }
    };

    var handleBack = function() {
        if (step > 1) {
            setStep(step - 1);
            setError('');
        } else {
            onNavigate('login');
        }
    };

    return e('div', { className: 'min-h-screen ' + bgStyle + ' flex flex-col items-center justify-center p-6' },
        e('div', { className: 'w-full max-w-md' },
            e('div', { className: 'text-center mb-8' },
                e('div', { className: 'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ' + (gender === 'female' ? 'bg-pink-200' : 'bg-gray-200') },
                    e('span', { className: 'text-3xl' }, '✨')
                ),
                e('h1', { className: 'text-2xl font-bold ' + (gender === 'female' ? 'text-pink-600' : 'text-gray-700') }, '创建账号'),
                e('p', { className: 'text-gray-500 mt-2' }, step === 1 ? '填写账号信息' : step === 2 ? '选择您的性别' : '选择您的肤质')
            ),
            e('div', { className: cardStyle + ' p-6' },
                step === 1 && e('div', { className: 'space-y-4' },
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '用户名'),
                        e('input', {
                            type: 'text',
                            value: username,
                            onChange: function(ev) { setUsername(ev.target.value); setError(''); },
                            placeholder: '请输入用户名（至少3个字符）',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'
                        })
                    ),
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '密码'),
                        e('input', {
                            type: 'password',
                            value: password,
                            onChange: function(ev) { setPassword(ev.target.value); setError(''); },
                            placeholder: '请输入密码（至少6位）',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'
                        })
                    ),
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '确认密码'),
                        e('input', {
                            type: 'password',
                            value: confirmPassword,
                            onChange: function(ev) { setConfirmPassword(ev.target.value); setError(''); },
                            placeholder: '请再次输入密码',
                            onKeyPress: function(ev) { if (ev.key === 'Enter') handleNext(); },
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'
                        })
                    ),
                    error && e('p', { className: 'text-red-500 text-sm text-center' }, error)
                ),
                step === 2 && e('div', null,
                    e('h2', { className: 'text-lg font-semibold text-gray-700 mb-4 text-center' }, '请选择您的性别'),
                    e('div', { className: 'flex gap-4' },
                        e('button', { onClick: function() { setGender('female'); }, className: 'flex-1 p-4 rounded-xl transition-all ' + (gender === 'female' ? btnStyle + ' text-white shadow-lg scale-105' : 'bg-gray-100') },
                            e('span', { className: 'text-4xl block mb-2' }, '👩'),
                            e('span', { className: 'font-medium' }, '女性')
                        ),
                        e('button', { onClick: function() { setGender('male'); }, className: 'flex-1 p-4 rounded-xl transition-all ' + (gender === 'male' ? btnStyle + ' text-white shadow-lg scale-105' : 'bg-gray-100') },
                            e('span', { className: 'text-4xl block mb-2' }, '👨'),
                            e('span', { className: 'font-medium' }, '男性')
                        )
                    )
                ),
                step === 3 && e('div', null,
                    e('h2', { className: 'text-lg font-semibold text-gray-700 mb-4 text-center' }, '请选择您的肤质'),
                    e('div', { className: 'space-y-3' },
                        e('button', { onClick: function() { setSkinType('dry'); }, className: 'w-full p-4 rounded-xl transition-all flex items-center gap-3 ' + (skinType === 'dry' ? btnStyle + ' text-white shadow-lg' : 'bg-gray-100') },
                            e('span', { className: 'text-3xl' }, '☁️'),
                            e('span', { className: 'font-medium' }, '干性皮肤')
                        ),
                        e('button', { onClick: function() { setSkinType('oily'); }, className: 'w-full p-4 rounded-xl transition-all flex items-center gap-3 ' + (skinType === 'oily' ? btnStyle + ' text-white shadow-lg' : 'bg-gray-100') },
                            e('span', { className: 'text-3xl' }, '💧'),
                            e('span', { className: 'font-medium' }, '油性皮肤')
                        ),
                        e('button', { onClick: function() { setSkinType('combination'); }, className: 'w-full p-4 rounded-xl transition-all flex items-center gap-3 ' + (skinType === 'combination' ? btnStyle + ' text-white shadow-lg' : 'bg-gray-100') },
                            e('span', { className: 'text-3xl' }, '⚖️'),
                            e('span', { className: 'font-medium' }, '混合性皮肤')
                        )
                    )
                ),
                e('div', { className: 'mt-6 flex gap-3' },
                    step > 1 && e('button', {
                        onClick: handleBack,
                        className: 'px-6 py-3 rounded-full bg-gray-200 text-gray-700 font-medium'
                    }, '上一步'),
                    e('button', {
                        onClick: handleNext,
                        disabled: isLoading,
                        className: 'flex-1 py-3 rounded-full text-white font-medium shadow-lg ' + btnStyle + ' disabled:opacity-50 disabled:cursor-not-allowed'
                    }, isLoading ? '处理中...' : (step === 3 ? '完成注册' : '下一步'))
                ),
                e('div', { className: 'flex justify-center gap-2 mt-4' },
                    e('div', { className: 'w-2 h-2 rounded-full ' + (step === 1 ? 'bg-pink-400 scale-125' : 'bg-gray-300') }),
                    e('div', { className: 'w-2 h-2 rounded-full ' + (step === 2 ? 'bg-pink-400 scale-125' : 'bg-gray-300') }),
                    e('div', { className: 'w-2 h-2 rounded-full ' + (step === 3 ? 'bg-pink-400 scale-125' : 'bg-gray-300') })
                ),
                step === 1 && e('div', { className: 'text-center mt-4' },
                    e('button', {
                        onClick: function() { onNavigate('login'); },
                        className: 'text-pink-600 text-sm hover:underline'
                    }, '已有账号？去登录')
                )
            )
        )
    );
}

function AlertModal(props) {
    var alert = props.alert;
    var onConfirm = props.onConfirm;
    var onCancel = props.onCancel;
    if (!alert) return null;

    var iconMap = {
        light: '💡',
        recognition: '⚠️',
        error: '❌'
    };

    return e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
        e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in' },
            e('div', { className: 'text-center mb-4' },
                e('span', { className: 'text-5xl' }, iconMap[alert.type] || '⚠️')
            ),
            e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, alert.title),
            e('p', { className: 'text-gray-600 text-sm text-center mb-6' }, alert.message),
            e('div', { className: 'space-y-3' },
                e('button', { onClick: onConfirm, className: 'w-full py-3 rounded-full text-white font-medium bg-gradient-to-r from-pink-400 to-purple-400' }, alert.confirmText || '确定'),
                e('button', { onClick: onCancel, className: 'w-full py-3 rounded-full bg-gray-100 text-gray-600 font-medium' }, alert.cancelText || '取消')
            )
        )
    );
}

function Home(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var isCute = state.currentStyle === 'cute';
    var username = state.user ? state.user.username : '用户';

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var goUpload = function() { onNavigate('upload'); };

    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex justify-between items-center mb-6' },
            e('div', { className: 'flex items-center gap-2' },
                e('div', { className: 'w-10 h-10 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-200' : 'bg-gray-200') },
                    e('span', { className: isCute ? 'text-pink-600' : 'text-gray-600' }, '✨')
                ),
                e('h1', { className: 'text-xl font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '颜容')
            ),
            e('button', { onClick: function() { onNavigate('profile'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '⚙️')
        ),
        e('div', { className: 'text-center mb-6' },
            e('h2', { className: 'text-lg font-semibold text-gray-700' }, '您好，' + username),
            e('p', { className: 'text-gray-500 text-sm' }, '让我们来分析您的皮肤状况')
        ),
        e('div', { className: cardStyle + ' p-6 mb-6 text-center cursor-pointer active:scale-95 transition-transform', onClick: goUpload },
            e('div', { className: 'w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') },
                e('span', { className: 'text-5xl' }, '📸')
            ),
            e('h3', { className: 'text-lg font-semibold mb-2 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '开始检测'),
            e('p', { className: 'text-gray-500 text-sm' }, '上传照片进行皮肤检测')
        ),
        e('div', { className: 'grid grid-cols-2 gap-4' },
            e('div', { className: cardStyle + ' cursor-pointer active:bg-gray-100 transition-colors', onClick: function() { onNavigate('history'); } },
                e('div', { className: 'flex items-center gap-3 p-4' },
                    e('div', { className: 'w-12 h-12 rounded-xl flex items-center justify-center ' + (isCute ? 'bg-purple-100' : 'bg-gray-100') }, e('span', null, '📋')),
                    e('div', null,
                        e('h4', { className: 'font-semibold text-gray-700' }, '历史记录'),
                        e('p', { className: 'text-sm text-gray-500' }, state.scanHistory.length + ' 条记录')
                    )
                )
            ),
            e('div', { className: cardStyle + ' cursor-pointer active:bg-gray-100 transition-colors', onClick: function() { onNavigate('community'); } },
                e('div', { className: 'flex items-center gap-3 p-4' },
                    e('div', { className: 'w-12 h-12 rounded-xl flex items-center justify-center ' + (isCute ? 'bg-pink-100' : 'bg-gray-100') }, e('span', null, '👥')),
                    e('div', null,
                        e('h4', { className: 'font-semibold text-gray-700' }, '社区分享'),
                        e('p', { className: 'text-sm text-gray-500' }, state.communityPosts ? state.communityPosts.length + ' 条分享' : '0 条分享')
                    )
                )
            ),
            e('div', { className: cardStyle + ' col-span-2 cursor-pointer active:bg-gray-100 transition-colors', onClick: function() { onNavigate('aichat'); } },
                e('div', { className: 'flex items-center gap-3 p-4' },
                    e('div', { className: 'w-12 h-12 rounded-xl flex items-center justify-center ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') }, e('span', null, '🤖')),
                    e('div', { className: 'flex-1' },
                        e('h4', { className: 'font-semibold text-gray-700' }, 'AI助手'),
                        e('p', { className: 'text-sm text-gray-500' }, '智能皮肤咨询 · 中医面诊解读')
                    ),
                    e('span', { className: 'text-gray-400' }, '›')
                )
            ),
            e('div', { className: cardStyle + ' cursor-pointer active:bg-gray-100 transition-colors', onClick: function() { onNavigate('calendar'); } },
                e('div', { className: 'flex items-center gap-3 p-4' },
                    e('div', { className: 'w-12 h-12 rounded-xl flex items-center justify-center ' + (isCute ? 'bg-orange-100' : 'bg-gray-100') }, e('span', null, '📅')),
                    e('div', null,
                        e('h4', { className: 'font-semibold text-gray-700' }, '肤质日历'),
                        e('p', { className: 'text-sm text-gray-500' }, '打卡记录')
                    )
                )
            ),
            e('div', { className: cardStyle + ' cursor-pointer active:bg-gray-100 transition-colors', onClick: function() { onNavigate('questionnaire'); } },
                e('div', { className: 'flex items-center gap-3 p-4' },
                    e('div', { className: 'w-12 h-12 rounded-xl flex items-center justify-center ' + (isCute ? 'bg-blue-100' : 'bg-gray-100') }, e('span', null, '📝')),
                    e('div', null,
                        e('h4', { className: 'font-semibold text-gray-700' }, '肤质问卷'),
                        e('p', { className: 'text-sm text-gray-500' }, '6题速测')
                    )
                )
            )
        ),
        e('div', { className: cardStyle + ' p-4 mt-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-2' }, '💡 健康小贴士'),
            e('p', { className: 'text-gray-600 text-sm' }, '建议每天早晚各清洁一次面部，保持皮肤水油平衡。记得做好防晒哦！')
        ),
        e('div', { className: 'fixed bottom-4 left-1/2 -translate-x-1/2' },
            e('button', { onClick: goUpload, className: 'px-8 py-3 rounded-full text-white font-medium shadow-lg ' + btnStyle + ' active:scale-95 transition-transform' }, '开始检测')
        )
    );
}

function PhotoUpload(props) {
    var onNavigate = props.onNavigate;
    var onComplete = props.onComplete;
    var _useApp = useApp();
    var state = _useApp.state;
    var addScanRecord = _useApp.addScanRecord;
    var showToast = _useApp.showToast;
    var _useState = useState('select');
    var mode = _useState[0];
    var setMode = _useState[1];
    var _useState2 = useState(null);
    var photo = _useState2[0];
    var setPhoto = _useState2[1];
    var _useState3 = useState(false);
    var isAnalyzing = _useState3[0];
    var setIsAnalyzing = _useState3[1];
    var _useState4 = useState(0);
    var analyzeProgress = _useState4[0];
    var setAnalyzeProgress = _useState4[1];
    var _useState5 = useState(null);
    var cameraError = _useState5[0];
    var setCameraError = _useState5[1];
    var _useState6 = useState(null);
    var showAlert = _useState6[0];
    var setShowAlert = _useState6[1];
    var videoRef = useRef(null);
    var canvasRef = useRef(null);
    var streamRef = useRef(null);
    var fileInputRef = useRef(null);
    var cameraInputRef = useRef(null);

    var isCute = state.currentStyle === 'cute';
    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    useEffect(function() {
        return function() {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(function(track) { track.stop(); });
            }
        };
    }, []);

    var startCamera = async function() {
        setCameraError(null);
        try {
            var stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setMode('camera');
        } catch (err) {
            setCameraError('无法访问相机，请检查权限设置');
            console.error('Camera error:', err);
        }
    };

    var takePhoto = function() {
        if (videoRef.current && canvasRef.current) {
            var video = videoRef.current;
            var canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            var photoData = canvas.toDataURL('image/jpeg', 0.8);
            setPhoto(photoData);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(function(track) { track.stop(); });
                streamRef.current = null;
            }
            setMode('preview');
        }
    };

    var handleFileUpload = function(ev) {
        var file = ev.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(event) {
                setPhoto(event.target.result);
                setMode('preview');
            };
            reader.readAsDataURL(file);
        }
    };

    var handleCameraFile = function(ev) {
        var file = ev.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(event) {
                setPhoto(event.target.result);
                setMode('preview');
            };
            reader.readAsDataURL(file);
        }
    };

    var checkBrightness = function(imageData) {
        var data = imageData.data;
        var totalBrightness = 0;
        var pixelCount = 0;
        for (var i = 0; i < data.length; i += 16) {
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            totalBrightness += (r + g + b) / 3;
            pixelCount++;
        }
        return pixelCount > 0 ? totalBrightness / pixelCount : 0;
    };

    var hasEnoughFaceData = function(result) {
        var hasLip = result.lipAnalysis !== null;
        var hasEye = result.eyeAnalysis !== null;
        var hasFace = result.faceColorAnalysis !== null;
        var hasYintang = result.yintangAnalysis !== null;
        var count = 0;
        if (hasLip) count++;
        if (hasEye) count++;
        if (hasFace) count++;
        if (hasYintang) count++;
        return count >= 2;
    };

    var startAnalysis = function() {
        if (!photo) return;
        setIsAnalyzing(true);
        setAnalyzeProgress(0);

        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxSize = 400;
            var w = img.width;
            var h = img.height;
            if (w > h) {
                if (w > maxSize) { h = h * maxSize / w; w = maxSize; }
            } else {
                if (h > maxSize) { w = w * maxSize / h; h = maxSize; }
            }
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);

            var brightness = checkBrightness(imageData);
            if (brightness < 60) {
                setIsAnalyzing(false);
                setShowAlert({
                    type: 'light',
                    title: '光线不足',
                    message: '当前光线不足，建议调整环境光线后再尝试',
                    confirmText: '重新拍摄',
                    cancelText: '取消'
                });
                return;
            }

            var progress = 0;
            var progressInterval = setInterval(function() {
                progress += Math.random() * 15 + 5;
                if (progress > 90) {
                    clearInterval(progressInterval);
                    setAnalyzeProgress(90);
                } else {
                    setAnalyzeProgress(progress);
                }
            }, 200);

            setTimeout(function() {
                clearInterval(progressInterval);
                setAnalyzeProgress(100);

                var userSkin = state.user ? state.user.skinType : 'combination';
                var result = analyzeSkinFromImage(imageData, userSkin);

                if (!hasEnoughFaceData(result)) {
                    setIsAnalyzing(false);
                    setShowAlert({
                        type: 'recognition',
                        title: '识别失败',
                        message: '未能识别到清晰的面部，请调整拍摄角度后重新拍照',
                        confirmText: '重新拍摄',
                        cancelText: '取消'
                    });
                    return;
                }

                compressImage(photo).then(function(compressedPhoto) {
                    var recordData = {
                        photo: compressedPhoto,
                        skinResult: { overallScore: result.overallScore, issues: result.issues },
                        healthTips: result.healthTips,
                        skincareRecommendations: result.skincareRecommendations,
                        lipAnalysis: result.lipAnalysis,
                        eyeAnalysis: result.eyeAnalysis,
                        faceColorAnalysis: result.faceColorAnalysis,
                        yintangAnalysis: result.yintangAnalysis,
                        analysisDetails: result.analysisDetails
                    };

                    api.records.create(recordData).then(function(apiResult) {
                        if (apiResult.success && apiResult.record) {
                            addScanRecord(apiResult.record);
                            showToast('检测完成', 'success');
                            setTimeout(function() {
                                setIsAnalyzing(false);
                                onComplete();
                            }, 500);
                        } else {
                            addScanRecord({
                                id: Date.now().toString(),
                                date: new Date().toLocaleString('zh-CN'),
                                ...recordData
                            });
                            showToast('检测完成（本地保存）', 'success');
                            setTimeout(function() {
                                setIsAnalyzing(false);
                                onComplete();
                            }, 500);
                        }
                    });
                });
            }, 2500);
        };
        img.onerror = function() {
            setIsAnalyzing(false);
            setShowAlert({
                type: 'error',
                title: '图片加载失败',
                message: '无法加载图片，请重新选择照片',
                confirmText: '重新选择',
                cancelText: '取消'
            });
        };
        img.src = photo;
    };

    var retake = function() {
        setPhoto(null);
        setMode('select');
        setAnalyzeProgress(0);
        setShowAlert(null);
    };

    var handleAlertConfirm = function() {
        if (showAlert && showAlert.type === 'error') {
            setShowAlert(null);
            setMode('select');
            setPhoto(null);
        } else {
            setShowAlert(null);
            setMode('select');
            setPhoto(null);
        }
    };

    var handleAlertCancel = function() {
        setShowAlert(null);
    };

    var renderAlert = function() {
        return e(AlertModal, {
            alert: showAlert,
            onConfirm: handleAlertConfirm,
            onCancel: handleAlertCancel
        });
    };

    if (mode === 'select') {
        return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4' },
            e('header', { className: 'flex items-center gap-4 mb-6' },
                e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
                e('h1', { className: 'text-lg font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '上传照片')
            ),
            e('div', { className: 'text-center mb-6' },
                e('h2', { className: 'text-lg font-semibold text-gray-700 mb-2' }, '请上传您的面部照片'),
                e('p', { className: 'text-gray-500 text-sm' }, '请确保光线充足，面部清晰可见')
            ),
            e('div', { className: cardStyle + ' p-6 mb-4' },
                e('button', { onClick: startCamera, className: 'w-full flex items-center gap-4 p-4 mb-3 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all active:scale-95' },
                    e('div', { className: 'w-12 h-12 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-200' : 'bg-gray-200') },
                        e('span', { className: 'text-2xl' }, '📷')
                    ),
                    e('div', { className: 'text-left flex-1' },
                        e('h3', { className: 'font-semibold text-gray-700' }, '拍照检测'),
                        e('p', { className: 'text-sm text-gray-500' }, '使用相机拍摄照片')
                    ),
                    e('span', { className: 'text-gray-400' }, '›')
                ),
                cameraError && e('p', { className: 'text-red-500 text-sm text-center mb-3' }, cameraError)
            ),
            e('div', { className: cardStyle + ' p-6 mb-4' },
                e('button', { onClick: function() { if (fileInputRef.current) fileInputRef.current.click(); }, className: 'w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-95' },
                    e('div', { className: 'w-12 h-12 rounded-full flex items-center justify-center ' + (isCute ? 'bg-purple-200' : 'bg-gray-200') },
                        e('span', { className: 'text-2xl' }, '🖼️')
                    ),
                    e('div', { className: 'text-left flex-1' },
                        e('h3', { className: 'font-semibold text-gray-700' }, '从相册选择'),
                        e('p', { className: 'text-sm text-gray-500' }, '上传已有的照片')
                    ),
                    e('span', { className: 'text-gray-400' }, '›')
                )
            ),
            e('input', { ref: fileInputRef, type: 'file', accept: 'image/*', onChange: handleFileUpload, style: { display: 'none' } }),
            e('input', { ref: cameraInputRef, type: 'file', accept: 'image/*', capture: 'user', onChange: handleCameraFile, style: { display: 'none' } }),
            e('div', { className: cardStyle + ' p-4' },
                e('h3', { className: 'font-medium text-gray-700 mb-2' }, '📝 拍摄建议'),
                e('ul', { className: 'text-sm text-gray-600 space-y-1' },
                    e('li', null, '• 请在光线充足的环境下拍摄'),
                    e('li', null, '• 请确保面部完整出现在画面中'),
                    e('li', null, '• 请素颜或淡妆效果更佳'),
                    e('li', null, '• 请正面朝向镜头')
                )
            ),
            e('canvas', { ref: canvasRef, style: { display: 'none' } }),
            renderAlert()
        );
    }

    if (mode === 'camera') {
        var _useState7 = useState(0);
        var countdown = _useState7[0];
        var setCountdown = _useState7[1];
        var _useState8 = useState(0);
        var tipIndex = _useState8[0];
        var setTipIndex = _useState8[1];

        var closeCamera = function() {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(function(track) { track.stop(); });
                streamRef.current = null;
            }
            setMode('select');
        };

        var handleTakePhoto = function() {
            setCountdown(3);
            var count = 3;
            var timer = setInterval(function() {
                count--;
                setCountdown(count);
                if (count <= 0) {
                    clearInterval(timer);
                    takePhoto();
                    setCountdown(0);
                }
            }, 1000);
        };

        var guideTips = [
            '请将面部对准框内',
            '保持光线充足',
            '正面朝向镜头',
            '保持表情自然'
        ];

        useEffect(function() {
            var timer = setInterval(function() {
                setTipIndex(function(prev) { return (prev + 1) % guideTips.length; });
            }, 2500);
            return function() { clearInterval(timer); };
        }, []);

        return e('div', { className: 'min-h-screen bg-black p-4' },
            e('header', { className: 'flex items-center justify-between mb-4 relative z-10' },
                e('button', { onClick: closeCamera, className: 'p-2 rounded-full bg-white/20 text-white backdrop-blur-sm' }, '✕'),
                e('h1', { className: 'text-lg font-bold text-white' }, '拍照检测'),
                e('div', { className: 'w-10' })
            ),
            e('div', { className: 'relative rounded-2xl overflow-hidden mb-6 aspect-[3/4] bg-gray-900' },
                e('video', { ref: videoRef, autoPlay: true, playsInline: true, muted: true, className: 'w-full h-full object-cover' }),
                e('div', { className: 'absolute inset-0 flex items-center justify-center pointer-events-none' },
                    e('div', { className: 'relative' },
                        e('div', { className: 'w-64 h-80 border-2 border-white/60 rounded-full transition-all duration-300' + (countdown > 0 ? ' border-green-400 scale-105' : '') }),
                        e('div', { className: 'absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-pink-400 rounded-tl-2xl' }),
                        e('div', { className: 'absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-pink-400 rounded-tr-2xl' }),
                        e('div', { className: 'absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-pink-400 rounded-bl-2xl' }),
                        e('div', { className: 'absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-pink-400 rounded-br-2xl' })
                    )
                ),
                countdown > 0 && e('div', { className: 'absolute inset-0 flex items-center justify-center bg-black/30' },
                    e('span', { className: 'text-9xl font-bold text-white drop-shadow-lg' }, countdown)
                ),
                e('div', { className: 'absolute top-4 left-0 right-0 text-center px-4' },
                    e('div', { className: 'inline-block px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full' },
                        e('p', { className: 'text-white text-sm font-medium' }, guideTips[tipIndex])
                    )
                ),
                e('div', { className: 'absolute bottom-6 left-0 right-0 text-center' },
                    e('p', { className: 'text-white/80 text-xs' }, '点击拍照按钮开始 3 秒倒计时')
                )
            ),
            e('div', { className: 'flex justify-center items-center gap-8' },
                e('button', { onClick: function() { if (cameraInputRef.current) cameraInputRef.current.click(); }, className: 'w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 active:scale-90 transition-transform' },
                    e('span', { className: 'text-2xl' }, '🖼️')
                ),
                e('button', { onClick: handleTakePhoto, disabled: countdown > 0, className: 'w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50' },
                    e('div', { className: 'w-16 h-16 rounded-full border-4 border-pink-400 bg-pink-100' })
                ),
                e('button', { className: 'w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20' },
                    e('span', { className: 'text-2xl' }, '⚡')
                )
            ),
            renderAlert()
        );
    }

    if (mode === 'preview') {
        return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4' },
            e('header', { className: 'flex items-center gap-4 mb-6' },
                e('button', { onClick: retake, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
                e('h1', { className: 'text-lg font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '照片预览')
            ),
            e('div', { className: cardStyle + ' p-4 mb-6' },
                e('div', { className: 'aspect-[3/4] rounded-xl overflow-hidden bg-gray-100' },
                    e('img', { src: photo, alt: '预览', className: 'w-full h-full object-cover' })
                )
            ),
            isAnalyzing ? (
                e('div', { className: cardStyle + ' p-6 text-center' },
                    e('div', { className: 'mb-6' },
                        e('div', { className: 'relative w-20 h-20 mx-auto mb-4' },
                            e('div', { className: 'absolute inset-0 rounded-full ' + (isCute ? 'bg-pink-100' : 'bg-gray-100') }),
                            e('div', { className: 'absolute inset-0 rounded-full border-4 border-transparent border-t-pink-400 animate-spin' }),
                            e('div', { className: 'absolute inset-0 flex items-center justify-center' },
                                e('span', { className: 'text-2xl' }, '🔬')
                            )
                        ),
                        e('h3', { className: 'text-lg font-semibold text-gray-700 mb-1' }, 'AI 智能分析中...'),
                        e('p', { className: 'text-sm text-gray-500' }, '正在分析您的皮肤和面部特征')
                    ),
                    e('div', { className: 'w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden' },
                        e('div', { className: btnStyle + ' h-3 rounded-full transition-all duration-300 ease-out', style: { width: analyzeProgress + '%' } })
                    ),
                    e('div', { className: 'flex justify-between text-xs text-gray-500' },
                        e('span', null, '皮肤检测'),
                        e('span', null, '中医面诊'),
                        e('span', null, '生成报告')
                    ),
                    e('p', { className: 'text-sm text-gray-500 mt-3 font-medium' }, Math.round(analyzeProgress) + '%')
                )
            ) : (
                e('div', { className: 'space-y-3' },
                    e('button', { onClick: startAnalysis, className: 'w-full py-4 rounded-full text-white font-medium shadow-lg ' + btnStyle + ' active:scale-95 transition-transform' }, '开始分析'),
                    e('button', { onClick: retake, className: 'w-full py-3 rounded-full bg-white text-gray-700 border border-gray-200 font-medium active:bg-gray-50' }, '重新选择')
                )
            ),
            renderAlert()
        );
    }

    return null;
}

function Result(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var setSelectedRecord = _useApp.setSelectedRecord;
    var addCommunityPost = _useApp.addCommunityPost;
    var showToast = _useApp.showToast;
    var _useState = useState(false);
    var showDeleteConfirm = _useState[0];
    var setShowDeleteConfirm = _useState[1];
    var _useState2 = useState(false);
    var showShareModal = _useState2[0];
    var setShowShareModal = _useState2[1];
    var _useState3 = useState(false);
    var shareSuccess = _useState3[0];
    var setShareSuccess = _useState3[1];
    var _useState4 = useState(false);
    var shareToCommunity = _useState4[0];
    var setShareToCommunity = _useState4[1];
    var _useState5 = useState('');
    var communityText = _useState5[0];
    var setCommunityText = _useState5[1];
    var _useState6 = useState(false);
    var showAIInterpretation = _useState6[0];
    var setShowAIInterpretation = _useState6[1];
    var _useState7 = useState('');
    var aiInterpretation = _useState7[0];
    var setAiInterpretation = _useState7[1];
    var _useState8 = useState(false);
    var aiLoading = _useState8[0];
    var setAiLoading = _useState8[1];
    var isCute = state.currentStyle === 'cute';

    var currentRecord = state.selectedRecordId
        ? state.scanHistory.find(function(r) { return r.id === state.selectedRecordId; })
        : state.scanHistory[0];
    var isHistoryView = !!state.selectedRecordId;

    useEffect(function() {
        if (!currentRecord) { onNavigate('home'); }
    }, [currentRecord]);

    if (!currentRecord) { return null; }

    var handleShare = function() {
        setShowShareModal(true);
        setShareSuccess(false);
        setShareToCommunity(false);
        setCommunityText('');
    };

    var closeShareModal = function() {
        setShowShareModal(false);
        setShareSuccess(false);
        setShareToCommunity(false);
        setCommunityText('');
    };

    var copyShareLink = function() {
        var shareText = '我在颜容完成了皮肤检测，评分 ' + currentRecord.skinResult.overallScore + ' 分！快来试试吧～';
        var copied = false;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareText).then(function() {
                    setShareSuccess(true);
                    setTimeout(closeShareModal, 1500);
                }).catch(function() {
                    fallbackCopy(shareText);
                });
                return;
            }
        } catch (e) {}

        fallbackCopy(shareText);
    };

    function fallbackCopy(text) {
        try {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            var ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (ok) {
                setShareSuccess(true);
                setTimeout(closeShareModal, 1500);
            } else {
                alert('请手动复制：\n\n' + text);
                closeShareModal();
            }
        } catch (e) {
            alert('请手动复制：\n\n' + text);
            closeShareModal();
        }
    }

    var handlePublishToCommunity = async function() {
        var postData = {
            recordId: currentRecord.id,
            photo: currentRecord.photo,
            skinResult: currentRecord.skinResult,
            healthTips: currentRecord.healthTips || [],
            skincareRecommendations: currentRecord.skincareRecommendations || [],
            shareText: communityText.trim() || '分享了我的检测结果，快来围观！'
        };

        var result = await api.community.create(postData);
        if (result.success && result.post) {
            addCommunityPost(result.post);
            showToast('发布成功', 'success');
            closeShareModal();
            onNavigate('community');
        } else {
            showToast(result.message || '发布失败', 'error');
        }
    };

    var generateAIInterpretation = async function() {
        setShowAIInterpretation(true);
        setAiInterpretation('');
        setAiLoading(true);

        var result = await api.ai.interpret(currentRecord);
        setAiLoading(false);
        if (result.success) {
            setAiInterpretation(result.content || result.interpretation || 'AI解读完成');
        } else {
            setAiInterpretation('❌ ' + (result.message || 'AI解读失败'));
        }
    };

    var handleDelete = async function() {
        var result = await api.records.remove(currentRecord.id);
        if (result.success) {
            showToast('删除成功', 'success');
            setShowDeleteConfirm(false);
            setSelectedRecord(null);
            onNavigate('history');
        } else {
            showToast(result.message || '删除失败', 'error');
        }
    };

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var score = currentRecord.skinResult.overallScore;
    var scoreDesc = score >= 85 ? '您的皮肤状态非常好！' : score >= 70 ? '皮肤状态良好，继续保持！' : '建议关注皮肤护理。';
    var radarData = generateRadarData(currentRecord);
    var trendRecords = state.scanHistory.filter(function(r) { return r && r.skinResult; }).sort(function(a, b) {
        return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
    });
    var plans = generateShortLongTermPlans(currentRecord);
    var activePlanTab = useState('short');
    var activePlan = activePlanTab[0];
    var setActivePlan = activePlanTab[1];

    var photoSection = currentRecord.photo ? e('div', { className: cardStyle + ' p-4 mb-6' },
        e('div', { className: 'aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-4' },
            e('img', { src: currentRecord.photo, alt: '检测照片', className: 'w-full h-full object-cover' })
        ),
        currentRecord.faceShape ? e('div', { className: 'text-center' },
            e('span', { className: 'inline-block px-3 py-1 rounded-full text-sm ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') },
                '脸型：' + getFaceShapeName(currentRecord.faceShape)
            )
        ) : null
    ) : null;

    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex items-center gap-4 mb-6' },
            e('button', { onClick: function() { setSelectedRecord(null); onNavigate(isHistoryView ? 'history' : 'home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, isHistoryView ? '检测详情' : '检测结果'),
            isHistoryView && e('button', { onClick: function() { setShowDeleteConfirm(true); }, className: 'p-2 rounded-full bg-red-100 text-red-600' }, '🗑️')
        ),
        photoSection,
        e('div', { className: cardStyle + ' p-6 mb-6 text-center' },
            e('div', { className: 'w-24 h-24 rounded-full flex items-center justify-center ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') + ' mx-auto mb-4' },
                e('div', { className: 'text-center' },
                    e('div', { className: 'text-3xl font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, score),
                    e('div', { className: 'text-xs text-gray-500' }, '分')
                )
            ),
            e('h3', { className: 'text-lg font-semibold text-gray-700 mb-1' }, '皮肤健康评分'),
            e('p', { className: 'text-gray-500 text-sm' }, scoreDesc)
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-2' }, '📊 六维肤质分析'),
            e(RadarChart, { data: radarData, size: 260 })
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('div', { className: 'flex items-center justify-between mb-2' },
                e('h3', { className: 'font-medium text-gray-700' }, '📈 肤质变化趋势'),
                e('span', { className: 'text-xs text-gray-400' }, '最近' + Math.min(trendRecords.length, 7) + '次')
            ),
            e(TrendChart, { records: trendRecords, width: 340, height: 160 })
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '🎯 定制改善方案'),
            e('div', { className: 'flex gap-2 mb-4' },
                e('button', {
                    onClick: function() { setActivePlan('short'); },
                    className: 'flex-1 py-2 rounded-xl text-sm font-medium transition-all ' + (activePlan === 'short' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md' : 'bg-gray-100 text-gray-600')
                }, '⚡ 短期急救'),
                e('button', {
                    onClick: function() { setActivePlan('long'); },
                    className: 'flex-1 py-2 rounded-xl text-sm font-medium transition-all ' + (activePlan === 'long' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md' : 'bg-gray-100 text-gray-600')
                }, '🌱 长期调理')
            ),
            e('div', { className: 'space-y-2' },
                (activePlan === 'short' ? plans.shortTerm : plans.longTerm).map(function(item, idx) {
                    return e('div', { key: idx, className: 'flex items-start gap-3 p-3 bg-gradient-to-r ' + (activePlan === 'short' ? 'from-orange-50 to-amber-50' : 'from-green-50 to-emerald-50') + ' rounded-xl' },
                        e('div', { className: 'text-2xl flex-shrink-0' }, item.icon),
                        e('div', { className: 'flex-1' },
                            e('div', { className: 'flex items-center justify-between mb-1' },
                                e('h4', { className: 'font-medium text-gray-700 text-sm' }, item.title),
                                e('span', { className: 'text-xs px-2 py-0.5 rounded-full ' + (activePlan === 'short' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600') }, item.time || item.period)
                            ),
                            e('p', { className: 'text-xs text-gray-600 leading-relaxed' }, item.desc)
                        )
                    );
                })
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '🔍 皮肤问题分析'),
            e('div', { className: 'space-y-3' },
                (currentRecord.skinResult.issues || []).map(function(issue) {
                    return e('div', { key: issue.id, className: 'flex items-start gap-3 p-3 bg-gray-50 rounded-xl' },
                        e('div', { className: 'w-10 h-10 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-100' : 'bg-gray-100') }, e('span', null, '🔬')),
                        e('div', { className: 'flex-1' },
                            e('div', { className: 'flex items-center gap-2 mb-1' },
                                e('span', { className: 'font-medium text-gray-700' }, issue.name),
                                e('span', { className: 'text-xs px-2 py-1 rounded-full ' + getSeverityStyle(issue.severity) }, getSeverityLabel(issue.severity))
                            ),
                            e('p', { className: 'text-sm text-gray-600' }, issue.description),
                            e('p', { className: 'text-sm text-gray-500 mt-1' }, '建议：' + issue.suggestion)
                        )
                    );
                })
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '💋 唇色分析'),
            currentRecord.lipAnalysis ? (
                e('div', { className: 'p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl' },
                    e('div', { className: 'flex items-center gap-3 mb-3' },
                        e('div', { className: 'w-12 h-12 rounded-full border-2 border-red-200', style: { backgroundColor: 'rgb(' + currentRecord.lipAnalysis.avgR + ',' + currentRecord.lipAnalysis.avgG + ',' + currentRecord.lipAnalysis.avgB + ')' } }),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700' }, currentRecord.lipAnalysis.description),
                            e('p', { className: 'text-xs text-gray-500' }, '饱和度：' + currentRecord.lipAnalysis.saturation + '%  亮度：' + currentRecord.lipAnalysis.brightness + '%')
                        )
                    ),
                    e('div', { className: 'flex items-start gap-2 p-3 bg-white/60 rounded-lg' },
                        e('span', { className: 'text-xl' }, '🩺'),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700 text-sm' }, '中医气血分析'),
                            e('p', { className: 'text-sm text-gray-600 mt-1' }, currentRecord.lipAnalysis.suggestion),
                            e('p', { className: 'text-xs mt-2 font-medium ' + (currentRecord.lipAnalysis.severity === 'severe' ? 'text-red-500' : currentRecord.lipAnalysis.severity === 'moderate' ? 'text-yellow-600' : 'text-green-600') }, '⚠️ ' + getSeverityLabel(currentRecord.lipAnalysis.severity))
                        )
                    )
                )
            ) : (
                e('div', { className: 'p-4 bg-gray-50 rounded-xl text-center' },
                    e('span', { className: 'text-3xl' }, '🤔'),
                    e('p', { className: 'text-gray-500 text-sm mt-2' }, '未能检测到清晰的唇色'),
                    e('p', { className: 'text-gray-400 text-xs mt-1' }, '建议上传正面、光线充足的人脸照片')
                )
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '👀 眼神分析'),
            currentRecord.eyeAnalysis ? (
                e('div', { className: 'p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl' },
                    e('div', { className: 'flex items-center gap-3 mb-3' },
                        e('div', { className: 'w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center' }, e('span', { className: 'text-2xl' }, '👁️')),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700' }, currentRecord.eyeAnalysis.description),
                            e('p', { className: 'text-xs text-gray-500' }, '眼周亮度：' + currentRecord.eyeAnalysis.avgBrightness + '  暗沉比例：' + currentRecord.eyeAnalysis.darkRatio + '%')
                        )
                    ),
                    e('div', { className: 'flex items-start gap-2 p-3 bg-white/60 rounded-lg' },
                        e('span', { className: 'text-xl' }, '🩺'),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700 text-sm' }, '中医神采分析'),
                            e('p', { className: 'text-sm text-gray-600 mt-1' }, currentRecord.eyeAnalysis.suggestion),
                            e('p', { className: 'text-xs mt-2 font-medium ' + (currentRecord.eyeAnalysis.severity === 'severe' ? 'text-red-500' : currentRecord.eyeAnalysis.severity === 'moderate' ? 'text-yellow-600' : 'text-green-600') }, '⚠️ ' + getSeverityLabel(currentRecord.eyeAnalysis.severity))
                        )
                    )
                )
            ) : (
                e('div', { className: 'p-4 bg-gray-50 rounded-xl text-center' },
                    e('span', { className: 'text-3xl' }, '🤔'),
                    e('p', { className: 'text-gray-500 text-sm mt-2' }, '未能检测到清晰的眼部'),
                    e('p', { className: 'text-gray-400 text-xs mt-1' }, '建议上传正面、光线充足的人脸照片')
                )
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '🎨 面色分析'),
            currentRecord.faceColorAnalysis ? (
                e('div', { className: 'p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl' },
                    e('div', { className: 'flex items-center gap-3 mb-3' },
                        e('div', { className: 'w-12 h-12 rounded-full border-2 border-pink-200', style: { backgroundColor: 'rgb(' + currentRecord.faceColorAnalysis.avgR + ',' + currentRecord.faceColorAnalysis.avgG + ',' + currentRecord.faceColorAnalysis.avgB + ')' } }),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700' }, currentRecord.faceColorAnalysis.description),
                            e('p', { className: 'text-xs text-gray-500' }, '亮度：' + currentRecord.faceColorAnalysis.brightness + '  泛红率：' + currentRecord.faceColorAnalysis.rednessRatio + '%')
                        )
                    ),
                    e('div', { className: 'flex items-start gap-2 p-3 bg-white/60 rounded-lg' },
                        e('span', { className: 'text-xl' }, '🩺'),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700 text-sm' }, '中医面色诊断'),
                            e('p', { className: 'text-sm text-gray-600 mt-1' }, currentRecord.faceColorAnalysis.suggestion),
                            e('p', { className: 'text-xs mt-2 font-medium ' + (currentRecord.faceColorAnalysis.severity === 'severe' ? 'text-red-500' : currentRecord.faceColorAnalysis.severity === 'moderate' ? 'text-yellow-600' : 'text-green-600') }, '⚠️ ' + getSeverityLabel(currentRecord.faceColorAnalysis.severity))
                        )
                    )
                )
            ) : (
                e('div', { className: 'p-4 bg-gray-50 rounded-xl text-center' },
                    e('span', { className: 'text-3xl' }, '🤔'),
                    e('p', { className: 'text-gray-500 text-sm mt-2' }, '未能检测到清晰的面色'),
                    e('p', { className: 'text-gray-400 text-xs mt-1' }, '建议上传正面、光线充足的人脸照片')
                )
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '⚡ 印堂分析'),
            currentRecord.yintangAnalysis ? (
                e('div', { className: 'p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl' },
                    e('div', { className: 'flex items-center gap-3 mb-3' },
                        e('div', { className: 'w-12 h-12 rounded-full border-2 border-yellow-200', style: { backgroundColor: 'rgb(' + currentRecord.yintangAnalysis.avgR + ',' + currentRecord.yintangAnalysis.avgG + ',' + currentRecord.yintangAnalysis.avgB + ')' } }),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700' }, currentRecord.yintangAnalysis.description),
                            e('p', { className: 'text-xs text-gray-500' }, '亮度：' + currentRecord.yintangAnalysis.brightness + '  暗沉比例：' + currentRecord.yintangAnalysis.darkRatio + '%')
                        )
                    ),
                    e('div', { className: 'flex items-start gap-2 p-3 bg-white/60 rounded-lg' },
                        e('span', { className: 'text-xl' }, '🩺'),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700 text-sm' }, '中医印堂诊断'),
                            e('p', { className: 'text-sm text-gray-600 mt-1' }, currentRecord.yintangAnalysis.suggestion),
                            e('p', { className: 'text-xs mt-2 font-medium ' + (currentRecord.yintangAnalysis.severity === 'severe' ? 'text-red-500' : currentRecord.yintangAnalysis.severity === 'moderate' ? 'text-yellow-600' : 'text-green-600') }, '⚠️ ' + getSeverityLabel(currentRecord.yintangAnalysis.severity))
                        )
                    )
                )
            ) : (
                e('div', { className: 'p-4 bg-gray-50 rounded-xl text-center' },
                    e('span', { className: 'text-3xl' }, '🤔'),
                    e('p', { className: 'text-gray-500 text-sm mt-2' }, '未能检测到清晰的印堂'),
                    e('p', { className: 'text-gray-400 text-xs mt-1' }, '建议上传正面、光线充足的人脸照片')
                )
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '⚠️ 健康提示'),
            e('div', { className: 'space-y-3' },
                (currentRecord.healthTips || []).map(function(tip) {
                    return e('div', { key: tip.id, className: 'flex items-start gap-3 p-3 bg-gray-50 rounded-xl' },
                        e('span', { className: 'text-2xl' }, '⚡'),
                        e('div', null,
                            e('h4', { className: 'font-medium text-gray-700' }, tip.title),
                            e('p', { className: 'text-sm text-gray-600' }, tip.description),
                            e('p', { className: 'text-sm text-green-600 mt-1' }, '建议：' + tip.suggestion)
                        )
                    );
                })
            ),
            e('p', { className: 'text-xs text-gray-400 mt-3 text-center' }, '免责声明：以上提示仅供参考，不能替代专业医疗诊断')
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '📋 综合调理建议'),
            e('div', { className: 'space-y-3' },
                e('div', { className: 'flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl' },
                    e('span', { className: 'text-2xl' }, '🥗'),
                    e('div', null,
                        e('h4', { className: 'font-medium text-gray-700 text-sm' }, '饮食建议'),
                        e('p', { className: 'text-sm text-gray-600 mt-1' }, '饮食宜清淡，多吃新鲜蔬果，少吃辛辣油腻食物。建议每日饮水 1500-2000ml。')
                    )
                ),
                e('div', { className: 'flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl' },
                    e('span', { className: 'text-2xl' }, '😴'),
                    e('div', null,
                        e('h4', { className: 'font-medium text-gray-700 text-sm' }, '作息建议'),
                        e('p', { className: 'text-sm text-gray-600 mt-1' }, '保证每天 7-8 小时睡眠，尽量在晚上 11 点前入睡，避免熬夜伤气血。')
                    )
                ),
                e('div', { className: 'flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl' },
                    e('span', { className: 'text-2xl' }, '🧘'),
                    e('div', null,
                        e('h4', { className: 'font-medium text-gray-700 text-sm' }, '运动建议'),
                        e('p', { className: 'text-sm text-gray-600 mt-1' }, '每周进行 3-4 次有氧运动，每次 30 分钟，促进血液循环和新陈代谢。')
                    )
                ),
                e('div', { className: 'flex items-start gap-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl' },
                    e('span', { className: 'text-2xl' }, '😊'),
                    e('div', null,
                        e('h4', { className: 'font-medium text-gray-700 text-sm' }, '情绪建议'),
                        e('p', { className: 'text-sm text-gray-600 mt-1' }, '保持心情舒畅，避免长期压力和焦虑，好情绪是最好的护肤品。')
                    )
                )
            )
        ),
        e('div', { className: cardStyle + ' p-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '🧴 护肤建议'),
            e('div', { className: 'grid grid-cols-2 gap-3' },
                (currentRecord.skincareRecommendations || []).map(function(item) {
                    return e('div', { key: item.id, className: 'bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-3' },
                        e('div', { className: 'flex items-center gap-2 mb-2' },
                            e('span', { className: 'text-xl' }, item.icon),
                            e('h4', { className: 'font-medium text-gray-700 text-sm' }, item.name)
                        ),
                        e('p', { className: 'text-xs text-gray-600' }, item.description)
                    );
                })
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4 mt-4' },
            e('button', {
                onClick: generateAIInterpretation,
                className: 'w-full flex items-center justify-center gap-3 p-4 rounded-xl ' + (isCute ? 'bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100' : 'bg-gray-50 hover:bg-gray-100') + ' transition-colors active:scale-95'
            },
                e('div', { className: 'w-10 h-10 rounded-full flex items-center justify-center ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') }, '🤖'),
                e('div', { className: 'flex-1 text-left' },
                    e('h4', { className: 'font-medium text-gray-700' }, 'AI详细解读'),
                    e('p', { className: 'text-xs text-gray-500' }, '由AI提供专业的皮肤和中医面诊分析')
                ),
                e('span', { className: 'text-gray-400' }, '›')
            )
        ),
        e('div', { className: 'fixed bottom-4 left-4 right-4 flex gap-3' },
            e('button', { onClick: handleShare, className: 'flex-1 bg-white text-gray-700 border border-gray-200 rounded-full py-3 font-medium flex items-center justify-center gap-2 active:bg-gray-50' },
                e('span', null, '📤'),
                e('span', null, '分享')
            ),
            !isHistoryView && e('button', { onClick: function() { onNavigate('home'); }, className: 'flex-1 bg-white text-gray-700 border border-gray-200 rounded-full py-3 font-medium active:bg-gray-50' }, '返回首页'),
            isHistoryView && e('button', { onClick: function() { setSelectedRecord(null); onNavigate('history'); }, className: 'flex-1 bg-white text-gray-700 border border-gray-200 rounded-full py-3 font-medium active:bg-gray-50' }, '返回列表'),
            e('button', { onClick: function() { setSelectedRecord(null); onNavigate('upload'); }, className: 'flex-1 text-white rounded-full py-3 font-medium ' + btnStyle + ' active:scale-95 transition-transform' }, isHistoryView ? '重新检测' : '查看历史')
        ),
        showDeleteConfirm && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in' },
                e('div', { className: 'text-center mb-4' },
                    e('span', { className: 'text-5xl' }, '🗑️')
                ),
                e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '确认删除'),
                e('p', { className: 'text-gray-600 text-sm text-center mb-6' }, '删除后将无法恢复，确定要删除这条检测记录吗？'),
                e('div', { className: 'flex gap-3' },
                    e('button', { onClick: function() { setShowDeleteConfirm(false); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消'),
                    e('button', { onClick: handleDelete, className: 'flex-1 py-3 rounded-full bg-red-500 text-white font-medium' }, '删除')
                )
            )
        ),
        showAIInterpretation && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4', onClick: function() { setShowAIInterpretation(false); } },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto animate-scale-in', onClick: function(e) { e.stopPropagation(); } },
                e('div', { className: 'flex items-center justify-between mb-4' },
                    e('div', { className: 'flex items-center gap-3' },
                        e('div', { className: 'w-10 h-10 rounded-full flex items-center justify-center ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') }, '🤖'),
                        e('div', null,
                            e('h3', { className: 'text-lg font-bold text-gray-800' }, 'AI详细解读'),
                            e('p', { className: 'text-xs text-gray-500' }, '由AI提供')
                        )
                    ),
                    e('button', { onClick: function() { setShowAIInterpretation(false); }, className: 'text-gray-400 text-2xl leading-none' }, '×')
                ),
                aiLoading ? e('div', { className: 'text-center py-12' },
                    e('div', { className: 'w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4' }),
                    e('p', { className: 'text-gray-500' }, 'AI正在分析中，请稍候...')
                ) : e('div', { className: 'prose prose-sm max-w-none' },
                    e('div', { className: 'text-gray-700 whitespace-pre-wrap leading-relaxed text-sm' }, aiInterpretation)
                ),
                !aiLoading && aiInterpretation && e('div', { className: 'mt-6 flex gap-3' },
                    e('button', {
                        onClick: function() { setShowAIInterpretation(false); onNavigate('aichat'); },
                        className: 'flex-1 py-2.5 rounded-full border ' + (isCute ? 'border-pink-200 text-pink-600' : 'border-gray-200 text-gray-600') + ' font-medium'
                    }, '💬 继续对话'),
                    e('button', {
                        onClick: function() { setShowAIInterpretation(false); },
                        className: 'flex-1 py-2.5 rounded-full text-white font-medium ' + btnStyle
                    }, '关闭')
                )
            )
        ),
        showShareModal && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4', onClick: closeShareModal },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in', onClick: function(e) { e.stopPropagation(); } },
                shareSuccess
                    ? e('div', { className: 'text-center' },
                        e('div', { className: 'w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center' }, e('span', { className: 'text-3xl' }, '✓')),
                        e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '分享成功'),
                        e('p', { className: 'text-gray-600 text-sm text-center mb-6' }, '分享文案已复制到剪贴板'),
                        e('button', { onClick: closeShareModal, className: 'w-full py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '完成')
                    )
                    : shareToCommunity
                        ? e('div', null,
                            e('div', { className: 'text-center mb-4' },
                                e('div', { className: 'w-16 h-16 mx-auto mb-3 rounded-full bg-pink-100 flex items-center justify-center' }, e('span', { className: 'text-3xl' }, '👥')),
                                e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '分享到社区'),
                                e('p', { className: 'text-gray-600 text-sm text-center' }, '填写分享心得，发布到社区')
                            ),
                            e('div', { className: 'mb-4' },
                                e('textarea', {
                                    value: communityText,
                                    onChange: function(ev) { setCommunityText(ev.target.value); },
                                    placeholder: '分享一下您的护肤心得或改善方案吧～',
                                    className: 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-pink-300 resize-none',
                                    rows: 3
                                })
                            ),
                            e('div', { className: 'flex gap-3' },
                                e('button', { onClick: function() { setShareToCommunity(false); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '返回'),
                                e('button', { onClick: handlePublishToCommunity, className: 'flex-1 py-3 rounded-full ' + btnStyle + ' text-white font-medium' }, '发布')
                            )
                        )
                        : e('div', null,
                            e('div', { className: 'text-center mb-6' },
                                e('div', { className: 'w-16 h-16 mx-auto mb-3 rounded-full bg-pink-100 flex items-center justify-center' }, e('span', { className: 'text-3xl' }, '📤')),
                                e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '分享检测结果'),
                                e('p', { className: 'text-gray-600 text-sm text-center' }, '评分 ' + currentRecord.skinResult.overallScore + ' 分')
                            ),
                            e('div', { className: 'space-y-3' },
                                e('button', {
                                    onClick: function() { setShareToCommunity(true); },
                                    className: 'w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 transition-all active:scale-95'
                                },
                                    e('span', { className: 'text-2xl' }, '👥'),
                                    e('div', { className: 'flex-1 text-left' },
                                        e('h4', { className: 'font-medium text-gray-700' }, '分享到社区'),
                                        e('p', { className: 'text-xs text-gray-500' }, '发布到社区，和大家一起交流')
                                    ),
                                    e('span', { className: 'text-gray-400' }, '›')
                                ),
                                e('button', {
                                    onClick: copyShareLink,
                                    className: 'w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 transition-all active:scale-95'
                                },
                                    e('span', { className: 'text-2xl' }, '📋'),
                                    e('div', { className: 'flex-1 text-left' },
                                        e('h4', { className: 'font-medium text-gray-700' }, '复制分享文案'),
                                        e('p', { className: 'text-xs text-gray-500' }, '复制文案，分享给好友')
                                    ),
                                    e('span', { className: 'text-gray-400' }, '›')
                                )
                            ),
                            e('button', { onClick: closeShareModal, className: 'w-full mt-4 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消')
                        )
            )
        )
    );
}

function History(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var setSelectedRecord = _useApp.setSelectedRecord;
    var loadRecords = _useApp.loadRecords;
    var showToast = _useApp.showToast;
    var _useState = useState(false);
    var showClearConfirm = _useState[0];
    var setShowClearConfirm = _useState[1];
    var _useState2 = useState(false);
    var loading = _useState2[0];
    var setLoading = _useState2[1];
    var isCute = state.currentStyle === 'cute';

    useEffect(function() {
        var fetchData = async function() {
            setLoading(true);
            await loadRecords();
            setLoading(false);
        };
        fetchData();
    }, []);

    var handleClearHistory = async function() {
        var result = await api.records.clear();
        if (result.success) {
            showToast('已清空历史记录', 'success');
            await loadRecords();
        } else {
            showToast(result.message || '清空失败', 'error');
        }
        setShowClearConfirm(false);
    };

    var handleViewRecord = function(record) {
        setSelectedRecord(record.id);
        onNavigate('result');
    };

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var sortedHistory = [...state.scanHistory].sort(function(a, b) {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });

    var groupedByMonth = {};
    sortedHistory.forEach(function(record) {
        var date = new Date(record.createdAt || record.date);
        var monthKey = (date.getMonth() + 1) + '月 ' + date.getFullYear();
        if (!groupedByMonth[monthKey]) {
            groupedByMonth[monthKey] = [];
        }
        groupedByMonth[monthKey].push(record);
    });

    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex items-center gap-4 mb-6' },
            e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '历史记录'),
            state.scanHistory.length > 0 && e('button', { onClick: function() { setShowClearConfirm(true); }, className: 'text-sm text-red-500 font-medium' }, '清空')
        ),
        loading ? (
            e('div', { className: cardStyle + ' p-8 text-center' },
                e('div', { className: 'w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4' }),
                e('p', { className: 'text-gray-500' }, '加载中...')
            )
        ) : state.scanHistory.length === 0 ? (
            e('div', { className: cardStyle + ' p-8 text-center' },
                e('div', { className: 'text-6xl mb-4' }, '📷'),
                e('h3', { className: 'text-lg font-medium text-gray-700 mb-2' }, '还没有检测记录'),
                e('p', { className: 'text-gray-500 text-sm mb-6' }, '开始您的第一次皮肤检测吧'),
                e('button', { onClick: function() { onNavigate('upload'); }, className: 'px-6 py-3 rounded-full text-white font-medium ' + btnStyle }, '开始检测')
            )
        ) : (
            e('div', { className: 'space-y-6' },
                Object.keys(groupedByMonth).map(function(monthKey) {
                    return e('div', { key: monthKey },
                        e('h3', { className: 'text-sm font-medium text-gray-500 mb-3 px-1' }, monthKey + '（' + groupedByMonth[monthKey].length + '次）'),
                        e('div', { className: 'space-y-3' },
                            groupedByMonth[monthKey].map(function(record) {
                                var date = new Date(record.createdAt || record.date);
                                var score = record.skinResult ? record.skinResult.overallScore : 0;
                                var scoreColor = score >= 85 ? 'text-green-500' : score >= 70 ? 'text-yellow-500' : 'text-red-500';
                                var issues = record.skinResult && record.skinResult.issues ? record.skinResult.issues.slice(0, 3) : [];

                                return e('div', {
                                    key: record.id,
                                    onClick: function() { handleViewRecord(record); },
                                    className: cardStyle + ' p-3 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform'
                                },
                                    e('div', { className: 'w-20 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0' },
                                        record.photo
                                            ? e('img', { src: record.photo, alt: '检测照片', className: 'w-full h-full object-cover' })
                                            : e('div', { className: 'w-full h-full flex items-center justify-center' }, e('span', { className: 'text-3xl' }, '📷'))
                                    ),
                                    e('div', { className: 'flex-1 min-w-0' },
                                        e('div', { className: 'flex items-center justify-between mb-1' },
                                            e('span', { className: 'text-sm font-medium text-gray-700' },
                                                (date.getMonth() + 1) + '月' + date.getDate() + '日 ' +
                                                String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
                                            ),
                                            e('span', { className: 'text-lg font-bold ' + scoreColor }, score)
                                        ),
                                        e('div', { className: 'flex flex-wrap gap-1' },
                                            issues.length > 0
                                                ? issues.map(function(issue) {
                                                    return e('span', { key: issue.id, className: 'text-xs px-2 py-0.5 rounded-full ' + getSeverityStyle(issue.severity) }, issue.name);
                                                })
                                                : e('span', { className: 'text-xs text-gray-400' }, '暂无问题')
                                        ),
                                        record.faceShape && e('p', { className: 'text-xs text-gray-400 mt-1' }, '脸型：' + getFaceShapeName(record.faceShape))
                                    )
                                );
                            })
                        )
                    );
                })
            )
        ),
        showClearConfirm && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in' },
                e('div', { className: 'text-center mb-4' },
                    e('span', { className: 'text-5xl' }, '⚠️')
                ),
                e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '确认清空'),
                e('p', { className: 'text-gray-600 text-sm text-center mb-6' }, '清空后将无法恢复，确定要清空所有历史记录吗？'),
                e('div', { className: 'flex gap-3' },
                    e('button', { onClick: function() { setShowClearConfirm(false); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消'),
                    e('button', { onClick: handleClearHistory, className: 'flex-1 py-3 rounded-full bg-red-500 text-white font-medium' }, '清空')
                )
            )
        )
    );
}

function Community(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var loadCommunityPosts = _useApp.loadCommunityPosts;
    var toggleLike = _useApp.toggleLike;
    var showToast = _useApp.showToast;
    var _useState = useState(false);
    var loading = _useState[0];
    var setLoading = _useState[1];
    var _useState2 = useState(false);
    var showDeleteConfirm = _useState2[0];
    var setShowDeleteConfirm = _useState2[1];
    var _useState3 = useState(null);
    var deletePostId = _useState3[0];
    var setDeletePostId = _useState3[1];
    var _useState4 = useState('全部');
    var activeTab = _useState4[0];
    var setActiveTab = _useState4[1];
    var isCute = state.currentStyle === 'cute';

    useEffect(function() {
        var fetchData = async function() {
            setLoading(true);
            await loadCommunityPosts();
            setLoading(false);
        };
        fetchData();
    }, []);

    var handleLike = async function(postId) {
        var result = await api.community.like(postId);
        if (result.success) {
            toggleLike(postId);
        } else {
            showToast(result.message || '操作失败', 'error');
        }
    };

    var handleDeletePost = function(postId) {
        setDeletePostId(postId);
        setShowDeleteConfirm(true);
    };

    var confirmDeletePost = async function() {
        if (!deletePostId) return;
        var result = await api.community.remove(deletePostId);
        if (result.success) {
            showToast('删除成功', 'success');
            await loadCommunityPosts();
        } else {
            showToast(result.message || '删除失败', 'error');
        }
        setShowDeleteConfirm(false);
        setDeletePostId(null);
    };

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var filteredPosts = state.communityPosts.filter(function(post) {
        if (activeTab === '全部') return true;
        if (activeTab === '我的') return post.userId === state.user.id;
        return true;
    }).sort(function(a, b) {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });

    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex items-center gap-4 mb-4' },
            e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '社区广场'),
            e('button', {
                onClick: function() { onNavigate('upload'); },
                className: 'px-4 py-2 rounded-full text-white text-sm font-medium ' + btnStyle
            }, '+ 发布')
        ),
        e('div', { className: 'flex gap-2 mb-4 overflow-x-auto pb-2' },
            ['全部', '我的'].map(function(tab) {
                return e('button', {
                    key: tab,
                    onClick: function() { setActiveTab(tab); },
                    className: 'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ' +
                        (activeTab === tab
                            ? (isCute ? 'bg-pink-500 text-white' : 'bg-gray-700 text-white')
                            : (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'))
                }, tab);
            })
        ),
        loading ? (
            e('div', { className: cardStyle + ' p-8 text-center' },
                e('div', { className: 'w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4' }),
                e('p', { className: 'text-gray-500' }, '加载中...')
            )
        ) : filteredPosts.length === 0 ? (
            e('div', { className: cardStyle + ' p-8 text-center' },
                e('div', { className: 'text-6xl mb-4' }, '👥'),
                e('h3', { className: 'text-lg font-medium text-gray-700 mb-2' }, '还没有帖子'),
                e('p', { className: 'text-gray-500 text-sm mb-6' }, '快来分享您的护肤心得吧'),
                e('button', { onClick: function() { onNavigate('upload'); }, className: 'px-6 py-3 rounded-full text-white font-medium ' + btnStyle }, '去检测')
            )
        ) : (
            e('div', { className: 'space-y-4' },
                filteredPosts.map(function(post) {
                    var isLiked = post.isLiked || (post.likes && post.likes.includes && post.likes.includes(state.user.id));
                    var likeCount = post.likeCount || (post.likes ? post.likes.length : 0);
                    var commentCount = post.commentCount || (post.comments ? post.comments.length : 0);
                    var date = new Date(post.createdAt || post.date);
                    var isMyPost = post.userId === state.user.id;

                    return e('div', { key: post.id, className: cardStyle + ' p-4' },
                        e('div', { className: 'flex items-center gap-3 mb-3' },
                            e('div', { className: 'w-10 h-10 rounded-full ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') + ' flex items-center justify-center text-white font-medium' },
                                (post.userName || post.username || '用').charAt(0)
                            ),
                            e('div', { className: 'flex-1' },
                                e('div', { className: 'font-medium text-gray-700' }, post.userName || post.username || '用户'),
                                e('div', { className: 'text-xs text-gray-400' },
                                    (date.getMonth() + 1) + '月' + date.getDate() + '日 ' +
                                    String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
                                )
                            ),
                            isMyPost && e('button', {
                                onClick: function() { handleDeletePost(post.id); },
                                className: 'text-gray-400 text-sm'
                            }, '删除')
                        ),
                        post.shareText && e('p', { className: 'text-gray-700 mb-3' }, post.shareText),
                        post.photo && e('div', { className: 'aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3' },
                            e('img', { src: post.photo, alt: '分享图片', className: 'w-full h-full object-cover' })
                        ),
                        post.skinResult && e('div', { className: 'flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-xl' },
                            e('div', { className: 'w-12 h-12 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-100' : 'bg-gray-100') },
                                e('span', { className: 'text-lg font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, post.skinResult.overallScore)
                            ),
                            e('div', null,
                                e('div', { className: 'font-medium text-gray-700 text-sm' }, '皮肤评分'),
                                e('div', { className: 'text-xs text-gray-500' },
                                    (post.skinResult.issues || []).slice(0, 2).map(function(i) { return i.name; }).join('、')
                                )
                            )
                        ),
                        e('div', { className: 'flex items-center gap-6 text-sm text-gray-500' },
                            e('button', {
                                onClick: function() { handleLike(post.id); },
                                className: 'flex items-center gap-1 ' + (isLiked ? 'text-red-500' : '')
                            },
                                e('span', null, isLiked ? '❤️' : '🤍'),
                                e('span', null, likeCount)
                            ),
                            e('button', { className: 'flex items-center gap-1' },
                                e('span', null, '💬'),
                                e('span', null, commentCount)
                            ),
                            e('button', { className: 'flex items-center gap-1' },
                                e('span', null, '📤'),
                                e('span', null, '分享')
                            )
                        )
                    );
                })
            )
        ),
        showDeleteConfirm && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in' },
                e('div', { className: 'text-center mb-4' },
                    e('span', { className: 'text-5xl' }, '🗑️')
                ),
                e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '确认删除'),
                e('p', { className: 'text-gray-600 text-sm text-center mb-6' }, '删除后将无法恢复，确定要删除这条帖子吗？'),
                e('div', { className: 'flex gap-3' },
                    e('button', { onClick: function() { setShowDeleteConfirm(false); setDeletePostId(null); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消'),
                    e('button', { onClick: confirmDeletePost, className: 'flex-1 py-3 rounded-full bg-red-500 text-white font-medium' }, '删除')
                )
            )
        )
    );
}

function Profile(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var toggleStyle = _useApp.toggleStyle;
    var logout = _useApp.logout;
    var showToast = _useApp.showToast;
    var updateUserProfile = _useApp.updateUserProfile;
    var _useState = useState(false);
    var showEditModal = _useState[0];
    var setShowEditModal = _useState[1];
    var _useState2 = useState(state.user.username || '');
    var editUsername = _useState2[0];
    var setEditUsername = _useState2[1];
    var _useState3 = useState(state.user.skinType || 'mixed');
    var editSkinType = _useState3[0];
    var setEditSkinType = _useState3[1];
    var _useState4 = useState(false);
    var showPasswordModal = _useState4[0];
    var setShowPasswordModal = _useState4[1];
    var _useState5 = useState('');
    var oldPassword = _useState5[0];
    var setOldPassword = _useState5[1];
    var _useState6 = useState('');
    var newPassword = _useState6[0];
    var setNewPassword = _useState6[1];
    var _useState7 = useState('');
    var confirmPassword = _useState7[0];
    var setConfirmPassword = _useState7[1];
    var _useState8 = useState(false);
    var showLogoutConfirm = _useState8[0];
    var setShowLogoutConfirm = _useState8[1];
    var _useState9 = useState(false);
    var saving = _useState9[0];
    var setSaving = _useState9[1];
    var isCute = state.currentStyle === 'cute';

    var openEditModal = function() {
        setEditUsername(state.user.username || '');
        setEditSkinType(state.user.skinType || 'mixed');
        setShowEditModal(true);
    };

    var handleSaveProfile = async function() {
        if (!editUsername.trim()) {
            showToast('请输入昵称', 'error');
            return;
        }
        setSaving(true);
        var result = await api.auth.updateProfile({
            username: editUsername.trim(),
            skinType: editSkinType
        });
        setSaving(false);
        if (result.success) {
            updateUserProfile(result.user || { username: editUsername, skinType: editSkinType });
            showToast('保存成功', 'success');
            setShowEditModal(false);
        } else {
            showToast(result.message || '保存失败', 'error');
        }
    };

    var handleChangePassword = async function() {
        if (!oldPassword || !newPassword || !confirmPassword) {
            showToast('请填写完整信息', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('两次密码输入不一致', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('新密码至少6位', 'error');
            return;
        }
        setSaving(true);
        var result = await api.auth.changePassword({
            oldPassword: oldPassword,
            newPassword: newPassword
        });
        setSaving(false);
        if (result.success) {
            showToast('密码修改成功', 'success');
            setShowPasswordModal(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            showToast(result.message || '修改失败', 'error');
        }
    };

    var handleLogout = function() {
        logout();
        showToast('已退出登录', 'success');
        onNavigate('login');
    };

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var skinTypeMap = {
        dry: '干性皮肤',
        oily: '油性皮肤',
        mixed: '混合性皮肤',
        normal: '中性皮肤',
        sensitive: '敏感性皮肤'
    };

    var menuItems = [
        { icon: '📝', label: '编辑资料', onClick: openEditModal },
        { icon: '🔒', label: '修改密码', onClick: function() { setShowPasswordModal(true); } },
        { icon: '🎨', label: '风格切换', right: isCute ? '可爱风' : '中性风', onClick: toggleStyle },
        { icon: '📜', label: '隐私政策', onClick: function() { alert('隐私政策\n\n我们重视您的隐私，您的个人信息和照片数据将被安全存储，不会泄露给第三方。'); } },
        { icon: 'ℹ️', label: '关于我们', onClick: function() { alert('颜容 v1.0\n\n专业的AI皮肤检测与中医面诊应用'); } },
    ];

    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex items-center gap-4 mb-6' },
            e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '个人中心')
        ),
        e('div', { className: cardStyle + ' p-6 mb-6' },
            e('div', { className: 'flex items-center gap-4' },
                e('div', { className: 'w-16 h-16 rounded-full ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') + ' flex items-center justify-center text-white text-2xl font-bold' },
                    (state.user.username || '用').charAt(0)
                ),
                e('div', { className: 'flex-1' },
                    e('h2', { className: 'text-xl font-bold text-gray-700 mb-1' }, state.user.username || '用户'),
                    e('p', { className: 'text-sm text-gray-500' }, '肤质：' + (skinTypeMap[state.user.skinType] || '混合性皮肤')),
                    e('p', { className: 'text-xs text-gray-400 mt-1' }, state.user.email || '')
                ),
                e('button', { onClick: openEditModal, className: 'text-sm ' + (isCute ? 'text-pink-500' : 'text-gray-500') }, '编辑')
            )
        ),
        e('div', { className: cardStyle + ' overflow-hidden mb-6' },
            menuItems.map(function(item, index) {
                return e('button', {
                    key: item.label,
                    onClick: item.onClick,
                    className: 'w-full flex items-center gap-3 p-4 ' + (index < menuItems.length - 1 ? 'border-b border-gray-100' : '') + ' active:bg-gray-50 transition-colors'
                },
                    e('span', { className: 'text-xl' }, item.icon),
                    e('span', { className: 'flex-1 text-left text-gray-700' }, item.label),
                    item.right && e('span', { className: 'text-sm text-gray-400' }, item.right),
                    e('span', { className: 'text-gray-400' }, '›')
                );
            })
        ),
        e('div', { className: cardStyle + ' p-4 mb-6' },
            e('div', { className: 'grid grid-cols-3 gap-4 text-center' },
                e('div', null,
                    e('div', { className: 'text-2xl font-bold ' + (isCute ? 'text-pink-500' : 'text-gray-700') }, state.scanHistory.length),
                    e('div', { className: 'text-xs text-gray-500' }, '检测次数')
                ),
                e('div', null,
                    e('div', { className: 'text-2xl font-bold ' + (isCute ? 'text-purple-500' : 'text-gray-700') }, state.communityPosts.filter(function(p) { return p.userId === state.user.id; }).length),
                    e('div', { className: 'text-xs text-gray-500' }, '社区帖子')
                ),
                e('div', null,
                    e('div', { className: 'text-2xl font-bold ' + (isCute ? 'text-blue-500' : 'text-gray-700') }, state.aiChatHistory.length),
                    e('div', { className: 'text-xs text-gray-500' }, 'AI对话')
                )
            )
        ),
        e('button', {
            onClick: function() { setShowLogoutConfirm(true); },
            className: 'w-full py-4 rounded-full bg-white text-red-500 border border-red-200 font-medium active:bg-red-50'
        }, '退出登录'),
        showEditModal && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4', onClick: function() { setShowEditModal(false); } },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in', onClick: function(e) { e.stopPropagation(); } },
                e('h3', { className: 'text-lg font-bold text-gray-800 mb-4 text-center' }, '编辑资料'),
                e('div', { className: 'space-y-4' },
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '昵称'),
                        e('input', {
                            type: 'text',
                            value: editUsername,
                            onChange: function(ev) { setEditUsername(ev.target.value); },
                            placeholder: '请输入昵称',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-300'
                        })
                    ),
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '肤质类型'),
                        e('select', {
                            value: editSkinType,
                            onChange: function(ev) { setEditSkinType(ev.target.value); },
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-300 bg-white'
                        },
                            Object.keys(skinTypeMap).map(function(key) {
                                return e('option', { key: key, value: key }, skinTypeMap[key]);
                            })
                        )
                    )
                ),
                e('div', { className: 'flex gap-3 mt-6' },
                    e('button', { onClick: function() { setShowEditModal(false); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消'),
                    e('button', {
                        onClick: handleSaveProfile,
                        disabled: saving,
                        className: 'flex-1 py-3 rounded-full text-white font-medium ' + btnStyle + (saving ? ' opacity-50' : '')
                    }, saving ? '保存中...' : '保存')
                )
            )
        ),
        showPasswordModal && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4', onClick: function() { setShowPasswordModal(false); } },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in', onClick: function(e) { e.stopPropagation(); } },
                e('h3', { className: 'text-lg font-bold text-gray-800 mb-4 text-center' }, '修改密码'),
                e('div', { className: 'space-y-3' },
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '原密码'),
                        e('input', {
                            type: 'password',
                            value: oldPassword,
                            onChange: function(ev) { setOldPassword(ev.target.value); },
                            placeholder: '请输入原密码',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-300'
                        })
                    ),
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '新密码'),
                        e('input', {
                            type: 'password',
                            value: newPassword,
                            onChange: function(ev) { setNewPassword(ev.target.value); },
                            placeholder: '请输入新密码（至少6位）',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-300'
                        })
                    ),
                    e('div', null,
                        e('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '确认新密码'),
                        e('input', {
                            type: 'password',
                            value: confirmPassword,
                            onChange: function(ev) { setConfirmPassword(ev.target.value); },
                            placeholder: '请再次输入新密码',
                            className: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-300'
                        })
                    )
                ),
                e('div', { className: 'flex gap-3 mt-6' },
                    e('button', { onClick: function() { setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消'),
                    e('button', {
                        onClick: handleChangePassword,
                        disabled: saving,
                        className: 'flex-1 py-3 rounded-full text-white font-medium ' + btnStyle + (saving ? ' opacity-50' : '')
                    }, saving ? '修改中...' : '确认修改')
                )
            )
        ),
        showLogoutConfirm && e('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
            e('div', { className: 'bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in' },
                e('div', { className: 'text-center mb-4' },
                    e('span', { className: 'text-5xl' }, '👋')
                ),
                e('h3', { className: 'text-lg font-bold text-gray-800 text-center mb-2' }, '确认退出'),
                e('p', { className: 'text-gray-600 text-sm text-center mb-6' }, '确定要退出登录吗？'),
                e('div', { className: 'flex gap-3' },
                    e('button', { onClick: function() { setShowLogoutConfirm(false); }, className: 'flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium' }, '取消'),
                    e('button', { onClick: handleLogout, className: 'flex-1 py-3 rounded-full bg-red-500 text-white font-medium' }, '退出')
                )
            )
        )
    );
}

function AIChat(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var showToast = _useApp.showToast;
    var addAIChatMessage = _useApp.addAIChatMessage;
    var _useState = useState('');
    var inputText = _useState[0];
    var setInputText = _useState[1];
    var _useState2 = useState(false);
    var isLoading = _useState2[0];
    var setIsLoading = _useState2[1];
    var messagesEndRef = useRef(null);
    var isCute = state.currentStyle === 'cute';

    var scrollToBottom = function() {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(function() {
        scrollToBottom();
    }, [state.aiChatHistory, isLoading]);

    var handleSend = async function() {
        var text = inputText.trim();
        if (!text || isLoading) return;

        var userMsg = {
            id: Date.now(),
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };
        addAIChatMessage(userMsg);
        setInputText('');
        setIsLoading(true);

        try {
            var result = await api.ai.chat(text, state.aiChatHistory);
            setIsLoading(false);
            if (result.success) {
                var aiMsg = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: result.content || result.reply || '抱歉，我没有理解您的意思。',
                    timestamp: new Date().toISOString()
                };
                addAIChatMessage(aiMsg);
            } else {
                showToast(result.message || '发送失败', 'error');
            }
        } catch (error) {
            setIsLoading(false);
            showToast('网络错误，请稍后重试', 'error');
        }
    };

    var quickQuestions = [
        '如何改善痘痘肌？',
        '敏感肌怎么护理？',
        '黑眼圈怎么消除？',
        '肤色暗沉怎么办？'
    ];

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';

    return e('div', { className: 'min-h-screen ' + bgStyle + ' flex flex-col' },
        e('header', { className: 'flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10' },
            e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('div', { className: 'flex-1 flex items-center gap-3' },
                e('div', { className: 'w-10 h-10 rounded-full flex items-center justify-center ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') }, '🤖'),
                e('div', null,
                    e('h1', { className: 'text-lg font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, 'AI护肤顾问'),
                    e('p', { className: 'text-xs text-green-500' }, '在线')
                )
            )
        ),
        e('div', { className: 'flex-1 overflow-y-auto p-4 space-y-4 pb-24' },
            state.aiChatHistory.length === 0 && e('div', { className: 'text-center py-12' },
                e('div', { className: 'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-100' : 'bg-gray-100') },
                    e('span', { className: 'text-4xl' }, '💬')
                ),
                e('h3', { className: 'text-lg font-medium text-gray-700 mb-2' }, '你好！我是AI护肤顾问'),
                e('p', { className: 'text-gray-500 text-sm mb-6' }, '有任何皮肤问题都可以问我哦～'),
                e('div', { className: 'grid grid-cols-2 gap-2 max-w-xs mx-auto' },
                    quickQuestions.map(function(q) {
                        return e('button', {
                            key: q,
                            onClick: function() { setInputText(q); },
                            className: 'px-3 py-2 rounded-full text-sm ' + (isCute ? 'bg-pink-50 text-pink-600' : 'bg-gray-100 text-gray-600') + ' active:scale-95 transition-transform'
                        }, q);
                    })
                )
            ),
            state.aiChatHistory.map(function(msg) {
                var isUser = msg.role === 'user';
                return e('div', { key: msg.id, className: 'flex gap-3 ' + (isUser ? 'flex-row-reverse' : '') },
                    e('div', { className: 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + (isUser ? (isCute ? 'bg-pink-200' : 'bg-gray-200') : (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200')) },
                        isUser ? e('span', { className: 'text-sm' }, '😊') : e('span', { className: 'text-sm' }, '🤖')
                    ),
                    e('div', { className: 'max-w-[75%] ' + (isUser ? 'items-end' : 'items-start') },
                        e('div', {
                            className: 'px-4 py-3 rounded-2xl ' +
                                (isUser
                                    ? (isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-tr-sm' : 'bg-gray-700 text-white rounded-tr-sm')
                                    : (isCute ? 'bg-white text-gray-700 rounded-tl-sm shadow-sm' : 'bg-white text-gray-700 rounded-tl-sm shadow-sm'))
                        },
                            e('p', { className: 'whitespace-pre-wrap text-sm leading-relaxed' }, msg.content)
                        ),
                        e('div', { className: 'text-xs text-gray-400 mt-1 ' + (isUser ? 'text-right' : 'text-left') },
                            function() {
                                var d = new Date(msg.timestamp);
                                return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
                            }()
                        )
                    )
                );
            }),
            isLoading && e('div', { className: 'flex gap-3' },
                e('div', { className: 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200' : 'bg-gray-200') },
                    e('span', { className: 'text-sm' }, '🤖')
                ),
                e('div', { className: 'px-4 py-3 rounded-2xl bg-white rounded-tl-sm shadow-sm' },
                    e('div', { className: 'flex gap-1' },
                        e('div', { className: 'w-2 h-2 bg-gray-400 rounded-full animate-bounce', style: { animationDelay: '0ms' } }),
                        e('div', { className: 'w-2 h-2 bg-gray-400 rounded-full animate-bounce', style: { animationDelay: '150ms' } }),
                        e('div', { className: 'w-2 h-2 bg-gray-400 rounded-full animate-bounce', style: { animationDelay: '300ms' } })
                    )
                )
            ),
            e('div', { ref: messagesEndRef })
        ),
        e('div', { className: 'fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100' },
            e('div', { className: 'flex items-end gap-2 max-w-lg mx-auto' },
                e('div', { className: 'flex-1' },
                    e('textarea', {
                        value: inputText,
                        onChange: function(ev) { setInputText(ev.target.value); },
                        onKeyDown: function(ev) {
                            if (ev.key === 'Enter' && !ev.shiftKey) {
                                ev.preventDefault();
                                handleSend();
                            }
                        },
                        placeholder: '输入你的问题...',
                        rows: 1,
                        className: 'w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-pink-300 resize-none max-h-32'
                    })
                ),
                e('button', {
                    onClick: handleSend,
                    disabled: isLoading || !inputText.trim(),
                    className: 'p-3 rounded-full text-white flex-shrink-0 ' + btnStyle + ' ' + ((isLoading || !inputText.trim()) ? 'opacity-50' : 'active:scale-95 transition-transform')
                }, '➤')
            )
        )
    );
}

var SKIN_QUESTIONS = [
    {
        id: 'q1',
        question: '洗完脸后不涂任何护肤品，你的皮肤感觉是？',
        options: [
            { value: 'dry', label: '紧绷、干燥', score: 1 },
            { value: 'normal', label: '舒适，不油不干', score: 2 },
            { value: 'oily', label: 'T区出油，两颊偏干', score: 3 },
            { value: 'very_oily', label: '全脸都很油', score: 4 }
        ]
    },
    {
        id: 'q2',
        question: '你的毛孔明显吗？',
        options: [
            { value: 'none', label: '几乎看不到毛孔', score: 1 },
            { value: 'tzone', label: 'T区毛孔稍明显', score: 2 },
            { value: 'visible', label: '全脸毛孔都比较明显', score: 3 },
            { value: 'large', label: '毛孔粗大明显', score: 4 }
        ]
    },
    {
        id: 'q3',
        question: '你容易长痘痘或闭口吗？',
        options: [
            { value: 'never', label: '几乎不长', score: 1 },
            { value: 'rarely', label: '偶尔生理期或熬夜时长', score: 2 },
            { value: 'sometimes', label: '经常冒几颗', score: 3 },
            { value: 'often', label: '反复长，比较严重', score: 4 }
        ]
    },
    {
        id: 'q4',
        question: '换季或使用新护肤品时，皮肤容易泛红、发痒吗？',
        options: [
            { value: 'never', label: '从不，皮肤很耐受', score: 1 },
            { value: 'rarely', label: '偶尔轻微不适', score: 2 },
            { value: 'sometimes', label: '经常会泛红发痒', score: 3 },
            { value: 'always', label: '非常敏感，很容易过敏', score: 4 }
        ]
    },
    {
        id: 'q5',
        question: '你的肤色是否均匀，有没有色斑、暗沉？',
        options: [
            { value: 'even', label: '肤色均匀透亮', score: 1 },
            { value: 'slight', label: '轻微暗沉，没有明显色斑', score: 2 },
            { value: 'some', label: '有少量色斑，局部暗沉', score: 3 },
            { value: 'many', label: '色斑较多，整体暗沉', score: 4 }
        ]
    },
    {
        id: 'q6',
        question: '你的眼周状态如何？',
        options: [
            { value: 'good', label: '紧致，没有黑眼圈和细纹', score: 1 },
            { value: 'mild', label: '偶尔有黑眼圈，休息好就消', score: 2 },
            { value: 'moderate', label: '有明显黑眼圈或细纹', score: 3 },
            { value: 'severe', label: '眼袋、黑眼圈、细纹都有', score: 4 }
        ]
    }
];

function SkinQuestionnaire(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var showToast = _useApp.showToast;
    var isCute = state.currentStyle === 'cute';
    var _useState = useState(0);
    var currentQ = _useState[0];
    var setCurrentQ = _useState[1];
    var _useState2 = useState({});
    var answers = _useState2[0];
    var setAnswers = _useState2[1];
    var _useState3 = useState(false);
    var showResult = _useState3[0];
    var setShowResult = _useState3[1];

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var totalScore = Object.values(answers).reduce(function(s, v) { return s + v; }, 0);
    var avgScore = Object.keys(answers).length > 0 ? totalScore / Object.keys(answers).length : 0;

    var getSkinTypeResult = function() {
        if (avgScore <= 1.5) {
            return {
                type: '中性健康肌',
                icon: '🌟',
                color: 'from-green-100 to-emerald-100',
                textColor: 'text-green-700',
                description: '你的皮肤状态非常健康！水油平衡，屏障功能良好。',
                suggestions: [
                    '继续保持良好的作息和饮食习惯',
                    '基础清洁+保湿+防晒即可，不要过度护肤',
                    '可以根据季节变化微调护肤方案'
                ]
            };
        }
        if (avgScore <= 2.3) {
            return {
                type: '混合型肌肤',
                icon: '⚖️',
                color: 'from-blue-100 to-cyan-100',
                textColor: 'text-blue-700',
                description: '皮肤整体状态不错，T区略油，两颊偏干，属于典型混合肌。',
                suggestions: [
                    'T区使用清爽型产品，两颊加强保湿',
                    '定期清洁T区毛孔，预防黑头粉刺',
                    '分区护理，不要全脸使用同一款产品'
                ]
            };
        }
        if (avgScore <= 3.2) {
            return {
                type: '问题型肌肤',
                icon: '🌿',
                color: 'from-yellow-100 to-amber-100',
                textColor: 'text-amber-700',
                description: '皮肤存在一些问题，可能是出油多、敏感、或有色斑暗沉等困扰。',
                suggestions: [
                    '先找到最主要的皮肤问题，针对性护理',
                    '精简护肤，不要叠加太多功效产品',
                    '做好基础保湿和防晒，修复皮肤屏障',
                    '建议定期检测皮肤状态变化'
                ]
            };
        }
        return {
            type: '重度问题肌肤',
            icon: '💊',
            color: 'from-red-100 to-rose-100',
            textColor: 'text-red-700',
            description: '皮肤问题比较明显，建议咨询专业皮肤科医生或护肤顾问。',
            suggestions: [
                '尽快咨询专业人士，不要自行乱用产品',
                '极简护肤，只用温和的清洁和保湿产品',
                '严格防晒，避免问题加重',
                '保持良好作息和饮食清淡'
            ]
        };
    };

    var selectOption = function(questionId, score) {
        var newAnswers = { ...answers };
        newAnswers[questionId] = score;
        setAnswers(newAnswers);
        if (currentQ < SKIN_QUESTIONS.length - 1) {
            setTimeout(function() { setCurrentQ(currentQ + 1); }, 200);
        } else {
            setTimeout(function() { setShowResult(true); }, 200);
        }
    };

    var result = getSkinTypeResult();
    var progress = ((currentQ + 1) / SKIN_QUESTIONS.length) * 100;

    if (showResult) {
        return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
            e('header', { className: 'flex items-center gap-4 mb-6' },
                e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
                e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '肤质分析报告')
            ),
            e('div', { className: cardStyle + ' p-6 mb-4 text-center' },
                e('div', { className: 'w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ' + result.color + ' flex items-center justify-center' },
                    e('span', { className: 'text-4xl' }, result.icon)
                ),
                e('h2', { className: 'text-xl font-bold mb-2 ' + result.textColor }, result.type),
                e('p', { className: 'text-gray-600 text-sm' }, result.description)
            ),
            e('div', { className: cardStyle + ' p-4 mb-4' },
                e('h3', { className: 'font-medium text-gray-700 mb-3' }, '📋 定制护理建议'),
                e('div', { className: 'space-y-3' },
                    result.suggestions.map(function(s, i) {
                        return e('div', { key: i, className: 'flex items-start gap-3 p-3 bg-gray-50 rounded-xl' },
                            e('span', { className: 'w-6 h-6 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-200 text-gray-600') + ' flex items-center justify-center flex-shrink-0 text-sm font-medium' }, i + 1),
                            e('p', { className: 'text-sm text-gray-600 flex-1' }, s)
                        );
                    })
                )
            ),
            e('div', { className: cardStyle + ' p-4 mb-4' },
                e('h3', { className: 'font-medium text-gray-700 mb-3' }, '📊 评分分布'),
                e('div', { className: 'space-y-2' },
                    SKIN_QUESTIONS.map(function(q, i) {
                        var s = answers[q.id] || 0;
                        return e('div', { key: q.id, className: 'flex items-center gap-3' },
                            e('span', { className: 'text-xs text-gray-500 w-12 truncate' }, '维度' + (i + 1)),
                            e('div', { className: 'flex-1 h-2 bg-gray-100 rounded-full overflow-hidden' },
                                e('div', { className: 'h-full rounded-full ' + (isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gray-500'), style: { width: (s / 4 * 100) + '%' } })
                            ),
                            e('span', { className: 'text-xs font-medium ' + (isCute ? 'text-pink-600' : 'text-gray-600') }, s + '/4')
                        );
                    })
                )
            ),
            e('div', { className: 'fixed bottom-4 left-4 right-4 flex gap-3' },
                e('button', { onClick: function() { onNavigate('upload'); }, className: 'flex-1 py-3 rounded-full text-white font-medium ' + btnStyle + ' active:scale-95 transition-transform' }, '拍照测肤验证')
            )
        );
    }

    var q = SKIN_QUESTIONS[currentQ];
    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex items-center gap-4 mb-6' },
            e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '肤质问卷')
        ),
        e('div', { className: 'mb-6' },
            e('div', { className: 'flex justify-between text-xs text-gray-500 mb-2' },
                e('span', null, '第 ' + (currentQ + 1) + ' / ' + SKIN_QUESTIONS.length + ' 题'),
                e('span', null, Math.round(progress) + '%')
            ),
            e('div', { className: 'h-2 bg-gray-100 rounded-full overflow-hidden' },
                e('div', { className: 'h-full rounded-full transition-all duration-300 ' + (isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gray-500'), style: { width: progress + '%' } })
            )
        ),
        e('div', { className: cardStyle + ' p-6 mb-6' },
            e('div', { className: 'text-center mb-6' },
                e('div', { className: 'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ' + (isCute ? 'bg-pink-100' : 'bg-gray-100') },
                    e('span', { className: 'text-3xl' }, '❓')
                ),
                e('h2', { className: 'text-lg font-semibold text-gray-700' }, q.question)
            ),
            e('div', { className: 'space-y-3' },
                q.options.map(function(opt, i) {
                    return e('button', {
                        key: opt.value,
                        onClick: function() { selectOption(q.id, opt.score); },
                        className: 'w-full p-4 text-left rounded-xl border-2 transition-all active:scale-98 ' + (answers[q.id] === opt.score ? 'border-pink-400 bg-pink-50' : 'border-gray-100 bg-white hover:border-pink-200')
                    },
                        e('div', { className: 'flex items-center gap-3' },
                            e('span', { className: 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (answers[q.id] === opt.score ? 'bg-pink-400 text-white' : 'bg-gray-100 text-gray-600') }, String.fromCharCode(65 + i)),
                            e('span', { className: 'text-sm text-gray-700 flex-1' }, opt.label)
                        )
                    );
                })
            )
        ),
        currentQ > 0 && e('button', {
            onClick: function() { setCurrentQ(currentQ - 1); },
            className: 'w-full py-3 rounded-full bg-gray-100 text-gray-600 font-medium active:bg-gray-200'
        }, '上一题')
    );
}

function SkinCalendar(props) {
    var onNavigate = props.onNavigate;
    var _useApp = useApp();
    var state = _useApp.state;
    var showToast = _useApp.showToast;
    var isCute = state.currentStyle === 'cute';
    var _useState = useState(new Date());
    var currentMonth = _useState[0];
    var setCurrentMonth = _useState[1];

    var bgStyle = isCute ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100';
    var btnStyle = isCute ? 'bg-gradient-to-r from-pink-400 to-purple-400' : 'bg-gradient-to-r from-gray-500 to-slate-500';
    var cardStyle = isCute ? 'bg-white/80 rounded-2xl shadow-lg border-pink-100' : 'bg-white/80 rounded-xl shadow-md border-gray-100';

    var checkIns = state.skinCheckIns || {};

    var getMonthDays = function(date) {
        var year = date.getFullYear();
        var month = date.getMonth();
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var days = [];
        for (var i = 0; i < firstDay; i++) {
            days.push({ day: 0, empty: true });
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            days.push({ day: d, date: dateStr, checkIn: checkIns[dateStr] });
        }
        return days;
    };

    var days = getMonthDays(currentMonth);
    var monthLabel = currentMonth.getFullYear() + '年' + (currentMonth.getMonth() + 1) + '月';

    var prevMonth = function() {
        var d = new Date(currentMonth);
        d.setMonth(d.getMonth() - 1);
        setCurrentMonth(d);
    };

    var nextMonth = function() {
        var d = new Date(currentMonth);
        d.setMonth(d.getMonth() + 1);
        setCurrentMonth(d);
    };

    var streakDays = function() {
        var count = 0;
        var today = new Date();
        for (var i = 0; i < 30; i++) {
            var d = new Date(today);
            d.setDate(d.getDate() - i);
            var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            if (checkIns[dateStr]) {
                count++;
            } else if (i > 0) {
                break;
            }
        }
        return count;
    };

    var monthlyCount = function() {
        var count = 0;
        Object.keys(checkIns).forEach(function(k) {
            if (k.startsWith(currentMonth.getFullYear() + '-' + String(currentMonth.getMonth() + 1).padStart(2, '0'))) {
                count++;
            }
        });
        return count;
    };

    var handleCheckIn = function() {
        var today = new Date();
        var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        if (checkIns[dateStr]) {
            showToast('今天已打卡啦~', 'info');
            return;
        }
        var newCheckIns = { ...checkIns };
        newCheckIns[dateStr] = { date: dateStr, mood: 'good', note: '' };
        localStorage.setItem('yanrong_checkins', JSON.stringify(newCheckIns));
        state.skinCheckIns = newCheckIns;
        showToast('打卡成功！坚持就是胜利~', 'success');
        setCurrentMonth(new Date(currentMonth));
    };

    var WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
    var todayStr = new Date().toISOString().slice(0, 10);

    return e('div', { className: 'min-h-screen ' + bgStyle + ' p-4 pb-24' },
        e('header', { className: 'flex items-center gap-4 mb-6' },
            e('button', { onClick: function() { onNavigate('home'); }, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '←'),
            e('h1', { className: 'text-lg font-bold flex-1 ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, '肤质日历')
        ),
        e('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
            e('div', { className: cardStyle + ' p-4 text-center' },
                e('div', { className: 'text-3xl font-bold ' + (isCute ? 'text-pink-600' : 'text-gray-700') }, streakDays()),
                e('div', { className: 'text-xs text-gray-500 mt-1' }, '连续打卡')
            ),
            e('div', { className: cardStyle + ' p-4 text-center' },
                e('div', { className: 'text-3xl font-bold ' + (isCute ? 'text-purple-600' : 'text-gray-700') }, monthlyCount()),
                e('div', { className: 'text-xs text-gray-500 mt-1' }, '本月打卡')
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('div', { className: 'flex items-center justify-between mb-4' },
                e('button', { onClick: prevMonth, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '‹'),
                e('span', { className: 'font-medium text-gray-700' }, monthLabel),
                e('button', { onClick: nextMonth, className: 'p-2 rounded-full ' + (isCute ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600') }, '›')
            ),
            e('div', { className: 'grid grid-cols-7 gap-1 mb-2' },
                WEEK_DAYS.map(function(d, i) {
                    return e('div', { key: i, className: 'text-center text-xs text-gray-400 py-2' }, d);
                })
            ),
            e('div', { className: 'grid grid-cols-7 gap-1' },
                days.map(function(d, i) {
                    if (d.empty) {
                        return e('div', { key: i, className: 'aspect-square' });
                    }
                    var isToday = d.date === todayStr;
                    var hasCheckIn = !!d.checkIn;
                    return e('div', {
                        key: i,
                        className: 'aspect-square flex items-center justify-center rounded-lg text-sm ' +
                            (isToday ? 'ring-2 ' + (isCute ? 'ring-pink-400' : 'ring-gray-400') : '') +
                            (hasCheckIn ? ' ' + (isCute ? 'bg-gradient-to-br from-pink-200 to-purple-200 text-white font-medium' : 'bg-gray-300 text-white font-medium') : ' text-gray-600')
                    }, d.day);
                })
            )
        ),
        e('div', { className: cardStyle + ' p-4 mb-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '📝 今日护肤打卡'),
            e('button', {
                onClick: handleCheckIn,
                className: 'w-full py-4 rounded-xl text-white font-medium ' + btnStyle + ' active:scale-95 transition-transform'
            }, checkIns[todayStr] ? '✅ 今日已打卡' : '✍️ 立即打卡')
        ),
        e('div', { className: cardStyle + ' p-4' },
            e('h3', { className: 'font-medium text-gray-700 mb-3' }, '💡 打卡小贴士'),
            e('div', { className: 'space-y-2 text-sm text-gray-600' },
                e('p', null, '• 每天固定时间检测皮肤，数据更有参考意义'),
                e('p', null, '• 建议早上起床后或晚上洁面后检测'),
                e('p', null, '• 连续打卡21天，可以看到明显的肤质变化')
            )
        )
    );
}

function App() {
    var _useState = useState('login');
    var currentPage = _useState[0];
    var setCurrentPage = _useState[1];

    var navigate = function(page) {
        setCurrentPage(page);
    };

    var renderPage = function() {
        switch (currentPage) {
            case 'login':
                return e(Login, { onNavigate: navigate });
            case 'register':
                return e(Register, { onNavigate: navigate });
            case 'home':
                return e(Home, { onNavigate: navigate });
            case 'upload':
                return e(PhotoUpload, { onNavigate: navigate });
            case 'result':
                return e(Result, { onNavigate: navigate });
            case 'history':
                return e(History, { onNavigate: navigate });
            case 'community':
                return e(Community, { onNavigate: navigate });
            case 'profile':
                return e(Profile, { onNavigate: navigate });
            case 'aichat':
                return e(AIChat, { onNavigate: navigate });
            case 'calendar':
                return e(SkinCalendar, { onNavigate: navigate });
            case 'questionnaire':
                return e(SkinQuestionnaire, { onNavigate: navigate });
            default:
                return e(Login, { onNavigate: navigate });
        }
    };

    return e(AppProvider, null,
        renderPage()
    );
}

document.addEventListener('DOMContentLoaded', function() {
    var root = document.getElementById('root');
    if (root) {
        ReactDOM.render(e(App), root);
    }
});
