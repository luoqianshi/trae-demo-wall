let currentPage = 'import';
let guides = [];
let parsedLocations = [];
let generatedRoute = [];

const LOCAL_STORAGE_KEY = 'travel_guide_data';

const AMAP_KEY = '您的高德地图API Key';

let amapService = null;

function loadFromStorage() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            guides = parsed.guides || [];
            parsedLocations = parsed.parsedLocations || [];
            generatedRoute = parsed.generatedRoute || [];
        } catch (e) {
            console.error('Failed to load data from storage:', e);
        }
    }
}

function saveToStorage() {
    const data = {
        guides,
        parsedLocations,
        generatedRoute
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

function showPage(pageName) {
    currentPage = pageName;
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(`page-${pageName}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.nav-btn[onclick="showPage('${pageName}')"]`).classList.add('active');
    
    if (pageName === 'import') renderGuideList();
    if (pageName === 'confirm') renderLocationList();
    if (pageName === 'result') renderRouteResult();
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        const statusText = document.getElementById('upload-status');
        statusText.textContent = `📷 已选择 ${files.length} 张图片，正在进行 OCR 识别...`;
        
        setTimeout(() => {
            const mockOcrText = `杭州三日游攻略：

第一天：西湖
- 门票：免费
- 游玩时间：3小时
- 最佳时间：早上7点前
- 避坑点：节假日人多，建议早去

第二天：灵隐寺
- 门票：45元
- 游玩时间：2小时
- 最佳时间：上午
- 避坑点：门口的香不要买，里面可以请

第三天：西溪湿地
- 门票：80元
- 游玩时间：4小时
- 最佳时间：下午
- 避坑点：夏天带防蚊用品

第四天：龙井村
- 消费：150元/人
- 游玩时间：3小时
- 最佳时间：上午
- 避坑点：品茶时注意价格`;
            
            addGuide('截图导入攻略', mockOcrText, '截图OCR');
            statusText.textContent = `✅ OCR 识别完成，已提取攻略内容`;
            event.target.value = '';
        }, 1500);
    }
}

function addGuide(title, content, source) {
    const guide = {
        id: Date.now(),
        title: title || generateTitle(content),
        content: content,
        source: source || '手动输入',
        status: 'pending',
        createdAt: new Date().toLocaleString()
    };
    guides.push(guide);
    saveToStorage();
    renderGuideList();
}

function generateTitle(content) {
    const lines = content.trim().split('\n');
    for (const line of lines) {
        if (line.trim().length > 5) {
            return line.trim().substring(0, 30) + '...';
        }
    }
    return '未命名攻略';
}

function renderGuideList() {
    const guideList = document.getElementById('guide-list');
    if (guides.length === 0) {
        guideList.innerHTML = '<div class="empty-state">暂无导入的攻略</div>';
        return;
    }
    
    guideList.innerHTML = guides.map(guide => `
        <div class="guide-item">
            <div class="guide-item-info">
                <div class="guide-item-title">${guide.title}</div>
                <div class="guide-item-meta">来源：${guide.source} | ${guide.createdAt}</div>
            </div>
            <div class="guide-item-actions">
                <span class="guide-item-status status-${guide.status}">
                    ${guide.status === 'pending' ? '待解析' : guide.status === 'processing' ? '解析中' : '已解析'}
                </span>
                <button class="edit-btn" onclick="editGuide(${guide.id})" title="编辑攻略">✏️</button>
                <button class="delete-btn" onclick="deleteGuide(${guide.id})" title="删除攻略">🗑️</button>
            </div>
        </div>
    `).join('');
}

function editGuide(id) {
    const guide = guides.find(g => g.id === id);
    if (!guide) return;
    
    const newContent = prompt('请编辑攻略内容：', guide.content);
    if (newContent !== null && newContent.trim() !== guide.content) {
        guide.content = newContent.trim();
        guide.title = generateTitle(guide.content);
        guide.status = 'pending';
        saveToStorage();
        renderGuideList();
    }
}

function deleteGuide(id) {
    if (confirm('确定要删除这篇攻略吗？')) {
        guides = guides.filter(g => g.id !== id);
        saveToStorage();
        renderGuideList();
    }
}

async function startParse() {
    const textInput = document.getElementById('guide-text');
    const text = textInput.value.trim();
    
    if (text) {
        addGuide(null, text, '手动输入');
        textInput.value = '';
    }
    
    if (guides.length === 0) {
        alert('请先导入攻略内容');
        return;
    }
    
    const pendingGuides = guides.filter(g => g.status === 'pending');
    if (pendingGuides.length > 0) {
        pendingGuides[0].status = 'processing';
        saveToStorage();
        renderGuideList();
    }
    
    const tempLocations = mockAIParse(guides);
    
    for (let i = 0; i < tempLocations.length; i++) {
        if (tempLocations[i].name && tempLocations[i].status === 'confirmed') {
            const amapInfo = await fetchAmapPOI(tempLocations[i].name);
            if (amapInfo) {
                tempLocations[i].cost = amapInfo.cost || tempLocations[i].cost;
                tempLocations[i].duration = amapInfo.duration || tempLocations[i].duration;
                tempLocations[i].address = amapInfo.address || '';
                tempLocations[i].tel = amapInfo.tel || '';
            }
        }
    }
    
    parsedLocations = tempLocations;
    guides.forEach(g => g.status = 'parsed');
    saveToStorage();
    renderGuideList();
    showPage('confirm');
}

function fetchAmapPOI(keyword) {
    return new Promise((resolve) => {
        if (!window.AMap || !window.AMap.PlaceSearch) {
            resolve(null);
            return;
        }
        
        if (!amapService) {
            amapService = new AMap.PlaceSearch({
                pageSize: 1,
                pageIndex: 1
            });
        }
        
        amapService.search(keyword, (status, result) => {
            if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                const poi = result.poiList.pois[0];
                const info = {
                    name: poi.name,
                    address: poi.address,
                    tel: poi.tel || '',
                    cost: '',
                    duration: ''
                };
                
                if (poi.type && poi.type.includes('收费')) {
                    info.cost = '收费';
                }
                if (poi.type && poi.type.includes('免费')) {
                    info.cost = '免费';
                }
                
                resolve(info);
            } else {
                resolve(null);
            }
        });
    });
}

function mockAIParse(guides) {
    const allContent = guides.map(g => g.content).join('\n');
    const lines = allContent.split('\n').filter(l => l.trim());
    
    const locationNames = [
        { name: '西湖', type: '景点' },
        { name: '灵隐寺', type: '景点' },
        { name: '知味观', type: '餐厅' },
        { name: '西溪湿地', type: '景点' },
        { name: '龙井村', type: '景点' },
        { name: '千岛湖', type: '景点' },
        { name: '雷峰塔', type: '景点' },
        { name: '断桥', type: '景点' },
        { name: '苏堤', type: '景点' },
        { name: '白堤', type: '景点' },
        { name: '三潭印月', type: '景点' },
        { name: '河坊街', type: '景点' },
        { name: '南宋御街', type: '景点' },
        { name: '楼外楼', type: '餐厅' },
        { name: '外婆家', type: '餐厅' },
        { name: '绿茶餐厅', type: '餐厅' },
        { name: '九溪', type: '景点' },
        { name: '云栖竹径', type: '景点' },
        { name: '虎跑', type: '景点' },
        { name: '植物园', type: '景点' },
        { name: '动物园', type: '景点' },
        { name: '博物馆', type: '景点' },
        { name: '科技馆', type: '景点' },
        { name: '美术馆', type: '景点' },
        { name: '商业街', type: '购物' },
        { name: '夜市', type: '景点' },
        { name: '公园', type: '景点' },
        { name: '广场', type: '景点' }
    ];
    
    const foundLocations = [];
    
    locationNames.forEach(location => {
        const regex = new RegExp(location.name, 'g');
        const matches = allContent.match(regex);
        const frequency = matches ? matches.length : 0;
        
        if (frequency > 0) {
            const locationInfo = {
                id: Date.now() + Math.random(),
                name: location.name,
                type: location.type,
                cost: extractCost(allContent, location.name),
                duration: extractDuration(allContent, location.name),
                bestTime: extractBestTime(allContent, location.name),
                pitfalls: extractPitfalls(allContent, location.name),
                status: 'confirmed',
                frequency: frequency,
                reason: generateReason(location.name, location.type, frequency)
            };
            foundLocations.push(locationInfo);
        }
    });
    
    if (foundLocations.length === 0) {
        const tempLocation = {
            id: Date.now(),
            name: '',
            type: '景点',
            cost: '',
            duration: '',
            bestTime: '',
            pitfalls: '',
            status: 'needs-complete',
            frequency: 0,
            reason: '攻略中未识别到已知地点，请手动添加'
        };
        foundLocations.push(tempLocation);
    }
    
    foundLocations.sort((a, b) => b.frequency - a.frequency);
    
    return foundLocations;
}

function extractCost(content, locationName) {
    const costPatterns = [
        new RegExp(locationName + '[^\\n]*?免费', 'i'),
        new RegExp(locationName + '[^\\n]*?门票[：:]?\\s*(\\d+)元', 'i'),
        new RegExp(locationName + '[^\\n]*?消费[：:]?\\s*(\\d+)元', 'i'),
        new RegExp(locationName + '[^\\n]*?人均[：:]?\\s*(\\d+)元', 'i'),
        new RegExp('[^\\n]*' + locationName + '[^\\n]*?(\\d+)元', 'i')
    ];
    
    for (const pattern of costPatterns) {
        const match = content.match(pattern);
        if (match) {
            if (match[0].includes('免费')) return '免费';
            if (match[1]) return match[1] + '元';
        }
    }
    return '';
}

function extractDuration(content, locationName) {
    const durationPattern = new RegExp(locationName + '[^\\n]*?(\\d+)小时', 'i');
    const match = content.match(durationPattern);
    return match ? match[1] + '小时' : '';
}

function extractBestTime(content, locationName) {
    const timeKeywords = ['早上', '上午', '中午', '下午', '晚上', '傍晚'];
    const line = content.split('\n').find(l => l.includes(locationName));
    if (line) {
        for (const keyword of timeKeywords) {
            if (line.includes(keyword)) {
                return keyword;
            }
        }
        const timeMatch = line.match(/(\d+)\s*[点时]/);
        if (timeMatch) {
            const hour = parseInt(timeMatch[1]);
            if (hour >= 5 && hour < 12) return '上午';
            if (hour >= 12 && hour < 14) return '中午';
            if (hour >= 14 && hour < 18) return '下午';
            if (hour >= 18 || hour < 5) return '晚上';
        }
    }
    return '';
}

function extractPitfalls(content, locationName) {
    const pitfallKeywords = ['避坑', '注意', '不要', '建议', '提醒'];
    const line = content.split('\n').find(l => l.includes(locationName));
    if (line) {
        for (const keyword of pitfallKeywords) {
            const idx = line.indexOf(keyword);
            if (idx !== -1) {
                return line.substring(idx).replace(keyword, '').replace(/[：:]/, '').trim().substring(0, 50);
            }
        }
    }
    return '';
}

function generateReason(name, type, frequency) {
    const reasons = [
        `${name}是${type}，攻略中多次提到，建议优先游览`,
        `${name}是热门${type}，攻略中重点推荐`,
        `${name}是特色${type}，值得一去`,
        `${name}在攻略中被提及${frequency}次，是推荐景点`
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
}

function renderLocationList() {
    const locationList = document.getElementById('location-list');
    if (parsedLocations.length === 0) {
        locationList.innerHTML = '<div class="empty-state">请先在攻略导入页面导入攻略并解析</div>';
        return;
    }
    
    locationList.innerHTML = parsedLocations.map(location => `
        <div class="location-card ${location.status === 'needs-complete' ? 'needs-complete' : ''}">
            <div class="location-card-header">
                <div>
                    <div class="location-name">${location.name || '<span style="color:#999">待补全</span>'}</div>
                    <div class="location-type">📍 ${location.type}</div>
                </div>
                <span class="location-status ${location.status === 'confirmed' ? 'status-confirmed' : 'status-needs-complete'}">
                    ${location.status === 'confirmed' ? '已确认' : '需补全'}
                </span>
            </div>
            <div class="location-frequency">
                ${location.frequency >= 5 ? '5篇提及' : location.frequency >= 2 ? '2篇提及' : '单篇'}
            </div>
            <div class="location-detail">
                <span class="location-detail-label">💰 花费</span>
                <span class="location-detail-value">${location.cost || '-'}</span>
            </div>
            <div class="location-detail">
                <span class="location-detail-label">⏱️ 时长</span>
                <span class="location-detail-value">${location.duration || '-'}</span>
            </div>
            <div class="location-detail">
                <span class="location-detail-label">⏰ 最佳时间</span>
                <span class="location-detail-value">${location.bestTime || '-'}</span>
            </div>
            ${location.address ? `
            <div class="location-detail">
                <span class="location-detail-label">📍 地址</span>
                <span class="location-detail-value">${location.address}</span>
            </div>
            ` : ''}
            ${location.tel ? `
            <div class="location-detail">
                <span class="location-detail-label">📞 电话</span>
                <span class="location-detail-value">${location.tel}</span>
            </div>
            ` : ''}
            ${location.pitfalls ? `
            <div class="location-pitfalls">
                <div class="location-pitfalls-title">⚠️ 避坑点</div>
                <div class="location-pitfalls-text">${location.pitfalls}</div>
            </div>
            ` : ''}
            ${location.status === 'needs-complete' ? `
            <input type="text" class="complete-input" placeholder="请输入正确的地名" 
                   onchange="updateLocationName(${location.id}, this.value)">
            ` : ''}
        </div>
    `).join('');
}

function updateLocationName(id, name) {
    const location = parsedLocations.find(l => l.id === id);
    if (location && name.trim()) {
        location.name = name.trim();
        location.status = 'confirmed';
        saveToStorage();
        renderLocationList();
    }
}

function generateRoute() {
    const confirmedLocations = parsedLocations.filter(l => l.status === 'confirmed');
    
    if (confirmedLocations.length === 0) {
        alert('请先确认至少一个地点');
        return;
    }
    
    generatedRoute = mockGenerateRoute(confirmedLocations);
    saveToStorage();
    showPage('result');
}

function mockGenerateRoute(locations) {
    const day1Locations = locations.filter(l => ['西湖', '知味观'].includes(l.name));
    const day2Locations = locations.filter(l => ['灵隐寺', '龙井村'].includes(l.name));
    const day3Locations = locations.filter(l => ['西溪湿地'].includes(l.name));
    
    const route = [];
    let sequence = 1;
    
    day1Locations.forEach((loc, idx) => {
        route.push({
            id: loc.id,
            day: 1,
            sequence: sequence++,
            ...loc,
            dayPart: idx === 0 ? '上午' : '中午'
        });
    });
    
    day2Locations.forEach((loc, idx) => {
        route.push({
            id: loc.id,
            day: 2,
            sequence: sequence++,
            ...loc,
            dayPart: idx === 0 ? '上午' : '下午'
        });
    });
    
    day3Locations.forEach(loc => {
        route.push({
            id: loc.id,
            day: 3,
            sequence: sequence++,
            ...loc,
            dayPart: '全天'
        });
    });
    
    return route;
}

function renderRouteResult() {
    const routeList = document.getElementById('route-list');
    
    if (generatedRoute.length === 0) {
        routeList.innerHTML = '<div class="empty-state">请先生成路线</div>';
        return;
    }
    
    routeList.innerHTML = generatedRoute.map(item => `
        <div class="route-item">
            <div class="route-number">${item.sequence}</div>
            <div class="route-header">
                <div>
                    <div class="route-name">${item.name}</div>
                    <span class="route-best-time">📅 第${item.day}天 · ${item.dayPart}</span>
                </div>
                <div class="route-info">
                    <div class="route-info-item">💰 ${item.cost}</div>
                    <div class="route-info-item">⏱️ ${item.duration}</div>
                </div>
            </div>
            <div class="route-reason">
                <div class="route-reason-title">💡 推荐理由</div>
                <div class="route-reason-text">${item.reason}</div>
            </div>
            ${item.pitfalls ? `
            <div class="route-pitfalls">⚠️ ${item.pitfalls}</div>
            ` : ''}
        </div>
    `).join('');
    
    updateRouteOverview();
}

function updateRouteOverview() {
    const totalCost = generatedRoute.reduce((acc, item) => {
        if (item.cost && item.cost.includes('元')) {
            const match = item.cost.match(/(\d+)/);
            return acc + (match ? parseInt(match[1]) : 0);
        }
        return acc;
    }, 0);
    
    const totalDuration = generatedRoute.reduce((acc, item) => {
        if (item.duration && item.duration.includes('小时')) {
            const match = item.duration.match(/(\d+)/);
            return acc + (match ? parseInt(match[1]) : 0);
        }
        return acc;
    }, 0);
    
    document.querySelectorAll('.overview-value')[0].textContent = `¥${totalCost * 0.8}-${totalCost * 1.2}`;
    document.querySelectorAll('.overview-value')[1].textContent = `${totalDuration}-${totalDuration + 3}小时`;
    document.querySelectorAll('.overview-value')[2].textContent = `${Math.floor(totalDuration * 0.5)}-${Math.floor(totalDuration * 0.8)}公里`;
    document.querySelectorAll('.overview-value')[3].textContent = `¥${Math.floor(totalDuration * 5)}-${Math.floor(totalDuration * 10)}`;
}

function regenerateRoute() {
    generateRoute();
}

function shortenRoute() {
    if (generatedRoute.length > 2) {
        generatedRoute = generatedRoute.slice(0, Math.floor(generatedRoute.length * 0.7));
        saveToStorage();
        renderRouteResult();
        alert('已缩短路线，保留了70%的景点');
    } else {
        alert('路线已经很短了，无法再缩短');
    }
}

function saveMoneyMode() {
    generatedRoute = generatedRoute.filter(item => {
        if (item.cost === '免费') return true;
        if (item.cost && item.cost.includes('元')) {
            const match = item.cost.match(/(\d+)/);
            return match ? parseInt(match[1]) < 100 : true;
        }
        return true;
    });
    saveToStorage();
    renderRouteResult();
    alert('已切换到省钱模式，移除了高消费景点');
}

loadFromStorage();
showPage('import');