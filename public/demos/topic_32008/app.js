// AI 旅行盲盒 - 核心应用逻辑

// 全局状态
let currentTrip = null;
let currentMap = null;
let customCities = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initSelectors();
    initCityInput();
});

// 初始化选择器
function initSelectors() {
    // 预算选择
    document.querySelectorAll('#budget-options .option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#budget-options .option-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // 天数选择
    document.querySelectorAll('#days-options .option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#days-options .option-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // 标签选择
    document.querySelectorAll('#tags-container .tag-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
}

// 初始化城市输入
function initCityInput() {
    const input = document.getElementById('city-input');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCity();
        }
    });
}

// 添加自定义城市
function addCity() {
    const input = document.getElementById('city-input');
    const cityName = input.value.trim();
    
    if (!cityName) {
        input.focus();
        input.style.borderColor = 'var(--neon-pink)';
        input.style.boxShadow = '0 0 15px rgba(255, 45, 146, 0.3)';
        showToast('请输入城市名称，例如：成都、大理、青岛');
        
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }, 2000);
        return;
    }
    
    if (cityName.length < 2) {
        showToast('城市名称至少需要 2 个字');
        return;
    }
    
    if (customCities.includes(cityName)) {
        showToast(`${cityName} 已经在列表中啦`);
        input.value = '';
        return;
    }
    
    if (customCities.length >= 5) {
        showToast('最多可以添加 5 个自定义城市');
        return;
    }
    
    customCities.push(cityName);
    input.value = '';
    renderCustomCities();
    showToast(`已添加 ${cityName}，AI 会优先考虑这个城市`);
}

// 点击预设城市按钮快速添加/移除
function togglePresetCity(cityName) {
    const index = customCities.indexOf(cityName);
    
    if (index > -1) {
        customCities.splice(index, 1);
        showToast(`已取消 ${cityName}`);
    } else {
        if (customCities.length >= 5) {
            showToast('最多可以添加 5 个自定义城市');
            return;
        }
        customCities.push(cityName);
        showToast(`已添加 ${cityName}`);
    }
    
    renderCustomCities();
}

// 清空所有自定义城市
function clearAllCities() {
    customCities = [];
    renderCustomCities();
    showToast('已清空自定义城市');
}

// 移除自定义城市
function removeCity(cityName) {
    customCities = customCities.filter(c => c !== cityName);
    renderCustomCities();
}

// 渲染自定义城市标签
function renderCustomCities() {
    const container = document.getElementById('selected-cities');
    const statusDiv = document.getElementById('city-status');
    
    container.innerHTML = customCities.map(city => `
        <div class="city-tag">
            ${city}
            <span class="remove" onclick="removeCity('${city}')">×</span>
        </div>
    `).join('');
    
    if (customCities.length === 0) {
        statusDiv.innerHTML = '<span>💡 提示：未添加自定义城市时，AI 会根据标签从预设城市中智能匹配</span>';
    } else {
        statusDiv.innerHTML = `
            <span>✅ 已添加 ${customCities.length} 个自定义城市，AI 会优先从这些城市中推荐</span>
            <button class="clear-cities-btn" onclick="clearAllCities()">清空全部</button>
        `;
    }
    
    // 同步预设城市按钮的选中状态
    document.querySelectorAll('.preset-city-btn').forEach(btn => {
        const city = btn.dataset.city;
        if (customCities.includes(city)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// 获取用户选择
function getUserSelection() {
    const budget = document.querySelector('#budget-options .option-btn.selected').dataset.value;
    const days = document.querySelector('#days-options .option-btn.selected').dataset.value;
    const tags = Array.from(document.querySelectorAll('#tags-container .tag-btn.selected')).map(btn => btn.dataset.value);
    
    return {
        budget: parseInt(budget),
        days: parseInt(days),
        tags: tags,
        customCities: [...customCities]
    };
}

// 生成旅行方案
function generateTrip() {
    const selection = getUserSelection();
    
    // 显示加载页
    showPage('loading-page');
    
    // 模拟 AI 计算过程
    setTimeout(() => {
        currentTrip = createTripPlan(selection);
        renderResult(currentTrip);
        showPage('result-page');
        initMap(currentTrip.destination);
        createSparkles();
    }, 2500);
}

// 重新生成
function regenerateTrip() {
    generateTrip();
}

// 返回首页
function backToHome() {
    showPage('home-page');
    if (currentMap) {
        currentMap.remove();
        currentMap = null;
    }
}

// 创建旅行计划
function createTripPlan(selection) {
    let destination = selectDestination(selection);
    const days = selection.days;
    const budget = selection.budget;
    
    // 生成行程
    const itinerary = generateItinerary(destination, days);
    
    // 选择景点和美食
    const spots = shuffleArray([...destination.spots]).slice(0, Math.min(4, destination.spots.length));
    const foods = shuffleArray([...destination.foods]).slice(0, Math.min(4, destination.foods.length));
    
    // 生成 AI 推荐理由
    const aiReason = generateAIReason(destination, selection);
    
    // 生成预算明细
    const budgetBreakdown = generateBudgetBreakdown(budget, days, destination);
    
    return {
        destination: destination,
        days: days,
        budget: budget,
        tags: selection.tags,
        spots: spots,
        foods: foods,
        itinerary: itinerary,
        aiReason: aiReason,
        budgetBreakdown: budgetBreakdown,
        generatedAt: new Date().toLocaleString('zh-CN')
    };
}

// 生成 AI 推荐理由
function generateAIReason(destination, selection) {
    const tags = selection.tags;
    const budget = selection.budget;
    const days = selection.days;
    
    let reason = `基于你的${budget}元预算、${days}天时间和「${tags.join('、')}」偏好，我为你选择了<strong>${destination.name}</strong>。`;
    
    // 根据匹配的标签生成具体理由
    const matchedTags = destination.tags.filter(tag => tags.includes(tag));
    if (matchedTags.length > 0) {
        reason += `这座城市在${matchedTags.join('、')}方面非常突出，`;
    }
    
    // 根据天数追加理由
    if (days <= 2) {
        reason += `${days}天短途旅行节奏刚好，不会太累又能体验精华。`;
    } else {
        reason += `${days}天时间足够你深度体验这里的特色。`;
    }
    
    // 根据预算追加理由
    if (budget <= 1000) {
        reason += `而且整体消费水平友好，${budget}元内可以玩得很好。`;
    } else if (budget <= 2000) {
        reason += `这个预算能让你住得舒适、吃得尽兴。`;
    } else {
        reason += `充足的预算让你可以解锁更多高品质体验。`;
    }
    
    // 城市特色补充
    if (destination.foods && destination.foods.length > 0) {
        const topFood = destination.foods[0].name;
        reason += `别忘了尝尝这里的${topFood}！`;
    }
    
    return reason;
}

// 生成预算明细
function generateBudgetBreakdown(budget, days, destination) {
    // 根据总预算按比例分配
    const transportRatio = 0.3;  // 交通 30%
    const accommodationRatio = 0.25; // 住宿 25%
    const foodRatio = 0.25;      // 餐饮 25%
    const ticketsRatio = 0.15;   // 门票/活动 15%
    const otherRatio = 0.05;     // 其他 5%
    
    const breakdown = {
        transport: Math.round(budget * transportRatio),
        accommodation: Math.round(budget * accommodationRatio),
        food: Math.round(budget * foodRatio),
        tickets: Math.round(budget * ticketsRatio),
        other: Math.round(budget * otherRatio),
        total: budget
    };
    
    return breakdown;
}

// 计算预计节省时间
function calculateTimeSaved(days) {
    // 做攻略平均每小时：短途 2-3 小时，长途 5-8 小时
    const baseTime = 2;
    const perDayTime = 1.5;
    return Math.round(baseTime + days * perDayTime);
}

// 选择目的地
function selectDestination(selection) {
    // 1. 优先使用自定义城市
    if (selection.customCities.length > 0) {
        const randomCustomCity = selection.customCities[Math.floor(Math.random() * selection.customCities.length)];
        const matchedPreset = travelData.destinations.find(d => d.name === randomCustomCity);
        if (matchedPreset) {
            return matchedPreset;
        }
        return generateRandomDestination(randomCustomCity);
    }
    
    // 2. 根据标签匹配预设目的地
    let candidates = travelData.destinations.filter(dest => {
        return selection.tags.some(tag => dest.tags.includes(tag)) && 
               dest.budget.min <= selection.budget;
    });
    
    // 3. 如果没有匹配的预设，使用所有预算内预设
    if (candidates.length === 0) {
        candidates = travelData.destinations.filter(dest => dest.budget.min <= selection.budget);
    }
    
    // 4. 如果还是没有，完全随机生成
    if (candidates.length === 0) {
        const randomCity = travelData.cityPool[Math.floor(Math.random() * travelData.cityPool.length)];
        return generateRandomDestination(randomCity);
    }
    
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// 生成随机目的地
function generateRandomDestination(cityName) {
    const baseLat = 20 + Math.random() * 25; // 中国境内大致纬度
    const baseLng = 95 + Math.random() * 30; // 中国境内大致经度
    
    return {
        name: cityName,
        province: "未知",
        lat: baseLat,
        lng: baseLng,
        desc: `神秘的${cityName}，等待你去探索和发现属于这里的独特风景与故事。`,
        tags: ["城市探索", "美食"],
        budget: { min: 300, max: 3000 },
        spots: shuffleArray([...travelData.randomSpots]).slice(0, 6),
        foods: shuffleArray([...travelData.randomFoods]).slice(0, 6),
        outfit: travelData.outfitTemplates[Math.floor(Math.random() * travelData.outfitTemplates.length)]
    };
}

// 生成行程
function generateItinerary(destination, days) {
    const itinerary = [];
    const allSpots = [...destination.spots];
    const allFoods = [...destination.foods];
    
    for (let i = 1; i <= days; i++) {
        const daySpots = [];
        const dayFoods = [];
        
        // 每天安排 2-3 个景点
        const spotCount = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < spotCount && allSpots.length > 0; j++) {
            const spotIndex = Math.floor(Math.random() * allSpots.length);
            daySpots.push(allSpots.splice(spotIndex, 1)[0]);
        }
        
        // 每天安排 2 个美食
        for (let j = 0; j < 2 && allFoods.length > 0; j++) {
            const foodIndex = Math.floor(Math.random() * allFoods.length);
            dayFoods.push(allFoods.splice(foodIndex, 1)[0]);
        }
        
        itinerary.push({
            day: i,
            spots: daySpots,
            foods: dayFoods
        });
    }
    
    return itinerary;
}

// 渲染结果页
function renderResult(trip) {
    const dest = trip.destination;
    
    document.getElementById('destination-name').textContent = dest.name;
    document.getElementById('destination-desc').textContent = dest.desc;
    document.getElementById('trip-budget').textContent = trip.budget;
    document.getElementById('trip-days').textContent = trip.days;
    document.getElementById('trip-spots').textContent = trip.spots.length + trip.itinerary.reduce((sum, day) => sum + day.spots.length, 0);
    document.getElementById('outfit-suggestion').textContent = dest.outfit;
    
    // 渲染 AI 推荐理由
    document.getElementById('ai-reason-text').innerHTML = trip.aiReason;
    
    // 渲染节省时间
    const timeSaved = calculateTimeSaved(trip.days);
    document.getElementById('time-saved').innerHTML = `AI 盲盒为你节省了约 <strong style="color: var(--neon-cyan);">${timeSaved} 小时</strong> 的攻略时间，让你把精力留给旅行本身。`;
    
    // 渲染预算明细
    const breakdown = trip.budgetBreakdown;
    document.getElementById('budget-breakdown').innerHTML = `
        <div class="budget-item">
            <div class="name"><span>🚗</span> 交通</div>
            <div class="amount">¥${breakdown.transport}</div>
        </div>
        <div class="budget-item">
            <div class="name"><span>🏨</span> 住宿</div>
            <div class="amount">¥${breakdown.accommodation}</div>
        </div>
        <div class="budget-item">
            <div class="name"><span>🍜</span> 餐饮</div>
            <div class="amount">¥${breakdown.food}</div>
        </div>
        <div class="budget-item">
            <div class="name"><span>🎫</span> 门票/活动</div>
            <div class="amount">¥${breakdown.tickets}</div>
        </div>
        <div class="budget-item">
            <div class="name"><span>🛍️</span> 其他</div>
            <div class="amount">¥${breakdown.other}</div>
        </div>
    `;
    document.getElementById('budget-total').textContent = `¥${breakdown.total}`;
    
    // 渲染美食
    document.getElementById('food-list').innerHTML = trip.foods.map((food, index) => `
        <div class="highlight-spot">
            <div class="num">${index + 1}</div>
            <div class="content">
                <h4>${food.name}</h4>
                <p>${food.desc}</p>
            </div>
        </div>
    `).join('');
    
    // 渲染景点
    document.getElementById('spots-list').innerHTML = trip.spots.map((spot, index) => `
        <div class="highlight-spot">
            <div class="num">${index + 1}</div>
            <div class="content">
                <h4>${spot.name}</h4>
                <p>${spot.desc}</p>
            </div>
        </div>
    `).join('');
    
    // 渲染行程
    document.getElementById('timeline').innerHTML = trip.itinerary.map(day => `
        <div class="timeline-item">
            <div class="timeline-dot">D${day.day}</div>
            <div class="timeline-content">
                <h4>第 ${day.day} 天</h4>
                <p>探索 ${dest.name} 的精彩景点与地道美食</p>
                <div class="timeline-tags">
                    ${day.spots.map(spot => `<span class="timeline-tag">📍 ${spot.name}</span>`).join('')}
                    ${day.foods.map(food => `<span class="timeline-tag">🍜 ${food.name}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
    
    // 重置反馈状态
    resetFeedback();
}

// 初始化地图
function initMap(destination) {
    if (currentMap) {
        currentMap.remove();
    }
    
    currentMap = L.map('map').setView([destination.lat, destination.lng], 10);
    
    // 使用深色地图瓦片
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(currentMap);
    
    // 添加自定义标记
    const marker = L.marker([destination.lat, destination.lng]).addTo(currentMap);
    marker.bindPopup(`<b>${destination.name}</b><br>${destination.desc}`).openPopup();
}

// 创建开箱粒子效果
function createSparkles() {
    const resultPage = document.getElementById('result-page');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = centerX + 'px';
        sparkle.style.top = centerY + 'px';
        sparkle.style.setProperty('--tx', (Math.random() - 0.5) * 400 + 'px');
        sparkle.style.setProperty('--ty', (Math.random() - 0.5) * 400 + 'px');
        sparkle.style.background = [ '#b829f7', '#00d4ff', '#ff2d92', '#00f5d4' ][Math.floor(Math.random() * 4)];
        resultPage.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 1000);
    }
}

// 分享功能
function shareTrip() {
    if (!currentTrip) return;
    
    document.getElementById('share-destination').textContent = currentTrip.destination.name;
    document.getElementById('share-budget').textContent = currentTrip.budget;
    document.getElementById('share-days').textContent = currentTrip.days;
    document.getElementById('share-spots').textContent = currentTrip.spots.length + currentTrip.itinerary.reduce((sum, day) => sum + day.spots.length, 0);
    
    document.getElementById('share-modal').classList.add('active');
}

function closeShare() {
    document.getElementById('share-modal').classList.remove('active');
}

// 下载分享卡片为图片
function downloadShareCard() {
    const shareCard = document.getElementById('share-card-content');
    
    if (!shareCard) {
        showToast('分享卡片不存在');
        return;
    }
    
    showToast('正在生成分享图片...');
    
    html2canvas(shareCard, {
        backgroundColor: '#1a1a25',
        scale: 2,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `AI旅行盲盒_${currentTrip.destination.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('分享图片已下载');
    }).catch(err => {
        console.error('生成分享图片失败:', err);
        showToast('生成图片失败，请重试');
    });
}

// 用户满意度反馈
function giveFeedback(type) {
    const likeBtn = document.querySelector('.feedback-btn.like');
    const dislikeBtn = document.querySelector('.feedback-btn.dislike');
    const resultDiv = document.getElementById('feedback-result');
    
    likeBtn.classList.remove('active');
    dislikeBtn.classList.remove('active');
    
    if (type === 'like') {
        likeBtn.classList.add('active');
        resultDiv.textContent = '✨ 收到！AI 会记住你的喜好，下次为你推荐更多惊喜目的地。';
    } else {
        dislikeBtn.classList.add('active');
        resultDiv.textContent = '🎲 收到！点击"重新生成"，AI 会为你换一个方案。';
    }
    
    resultDiv.style.display = 'block';
    
    // 保存反馈到本地
    if (currentTrip) {
        const feedbackKey = `trip_feedback_${currentTrip.destination.name}_${currentTrip.generatedAt}`;
        localStorage.setItem(feedbackKey, type);
    }
}

// 重置反馈状态
function resetFeedback() {
    const likeBtn = document.querySelector('.feedback-btn.like');
    const dislikeBtn = document.querySelector('.feedback-btn.dislike');
    const resultDiv = document.getElementById('feedback-result');
    
    likeBtn.classList.remove('active');
    dislikeBtn.classList.remove('active');
    resultDiv.style.display = 'none';
}

// 收藏方案
function saveTrip() {
    if (!currentTrip) return;
    
    const savedTrips = JSON.parse(localStorage.getItem('saved_trips') || '[]');
    
    // 检查是否已收藏
    const isAlreadySaved = savedTrips.some(trip => 
        trip.destination.name === currentTrip.destination.name && 
        trip.generatedAt === currentTrip.generatedAt
    );
    
    if (isAlreadySaved) {
        showToast('该方案已收藏');
        return;
    }
    
    savedTrips.push(currentTrip);
    localStorage.setItem('saved_trips', JSON.stringify(savedTrips));
    showToast(`已收藏 ${currentTrip.destination.name} 方案`);
}

// 点击遮罩关闭弹窗
document.getElementById('share-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeShare();
    }
});

// 页面切换
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

// 显示提示
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 工具函数：数组随机打乱
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
