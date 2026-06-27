/**
 * 能耗模块 - 能耗统计与趋势图
 * 负责能耗历史数据生成、能耗统计更新、能耗图表绘制
 */

// 能耗计算常量
const ENERGY_CONSTANTS = {
    BASE_ENERGY: 5.5,
    LIGHT_MAX: 0.8,
    AC_COOL: 1.2,
    AC_HEAT: 1.5,
    TV_BASE: 0.8,
    TV_VOLUME_FACTOR: 0.5,
    HEATER_FACTOR: 2,
    PURIFIER: 0.3,
    ROBOT: 0.4,
    COMPUTER: 0.5,
    EXHAUST: 0.1,
    DEFAULT: 0.2
};

/**
 * 生成模拟的24小时能耗数据
 * @returns {Array} 24小时能耗数据数组
 */
function generateEnergyHistory() {
    const data = [];
    const basePattern = [
        0.3, 0.2, 0.15, 0.1, 0.1, 0.2,  // 0-6时：夜间低能耗
        0.4, 0.8, 1.2, 1.5, 1.3, 1.1,   // 6-12时：早晨上升
        1.0, 0.9, 0.85, 0.9, 1.1, 1.4,  // 12-18时：下午波动
        1.6, 1.8, 1.5, 1.2, 0.8, 0.5    // 18-24时：晚间高峰后下降
    ];
    
    // 添加随机波动
    for (let i = 0; i < 24; i++) {
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2的随机因子
        data.push(basePattern[i] * randomFactor);
    }
    
    return data;
}

/**
 * 更新能耗统计
 * @param {Object} app - SmartHome 实例
 */
function updateEnergyStats(app) {
    let lightEnergy = 0;
    let acEnergy = 0;
    let applianceEnergy = 0;

    app.devices.forEach(d => {
        if (!d.on) return;
        switch (d.type) {
            case 'light':
                lightEnergy += (d.brightness || 50) / 100 * ENERGY_CONSTANTS.LIGHT_MAX;
                break;
            case 'ac':
                acEnergy += (d.mode === 'cool' ? ENERGY_CONSTANTS.AC_COOL : ENERGY_CONSTANTS.AC_HEAT) * Math.abs((d.temperature || 24) - 22) / 5;
                break;
            case 'tv':
                applianceEnergy += (d.volume || 30) / 100 * ENERGY_CONSTANTS.TV_VOLUME_FACTOR + ENERGY_CONSTANTS.TV_BASE;
                break;
            case 'heater':
                applianceEnergy += (d.temperature || 40) / 50 * ENERGY_CONSTANTS.HEATER_FACTOR;
                break;
            case 'purifier':
                applianceEnergy += ENERGY_CONSTANTS.PURIFIER;
                break;
            case 'robot':
                applianceEnergy += ENERGY_CONSTANTS.ROBOT;
                break;
            case 'computer':
                applianceEnergy += ENERGY_CONSTANTS.COMPUTER;
                break;
            case 'exhaust':
                applianceEnergy += ENERGY_CONSTANTS.EXHAUST;
                break;
            default:
                applianceEnergy += ENERGY_CONSTANTS.DEFAULT;
        }
    });

    const total = lightEnergy + acEnergy + applianceEnergy;
    const finalEnergy = (ENERGY_CONSTANTS.BASE_ENERGY + total).toFixed(1);
    const percent = Math.min(100, Math.round((total / 12) * 100));

    document.getElementById('energyValue').textContent = finalEnergy;
    document.getElementById('energyBar').style.width = percent + '%';
    document.getElementById('stat-light').textContent = (lightEnergy + 1.2).toFixed(1) + ' kWh';
    document.getElementById('stat-ac').textContent = (acEnergy + 3.5).toFixed(1) + ' kWh';
    document.getElementById('stat-appliance').textContent = (applianceEnergy + 0.9).toFixed(1) + ' kWh';
    drawEnergyChart(app); // 更新能耗趋势图
}

/**
 * 绘制能耗趋势图
 * @param {Object} app - SmartHome 实例
 */
function drawEnergyChart(app) {
    const canvas = document.getElementById('energyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // 设置canvas实际尺寸（高分辨率支持）
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 获取数据最大值
    const maxValue = Math.max(...app.energyHistory) * 1.2;
    
    // 绘制渐变填充区域
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');   // amber-400
    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)'); // amber-500
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
    
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    
    // 绘制曲线点
    for (let i = 0; i < app.energyHistory.length; i++) {
        const x = padding.left + (i / (app.energyHistory.length - 1)) * chartWidth;
        const y = height - padding.bottom - (app.energyHistory[i] / maxValue) * chartHeight;
        
        if (i === 0) {
            ctx.lineTo(x, y);
        } else {
            // 使用贝塞尔曲线使曲线更平滑
            const prevX = padding.left + ((i - 1) / (app.energyHistory.length - 1)) * chartWidth;
            const prevY = height - padding.bottom - (app.energyHistory[i - 1] / maxValue) * chartHeight;
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
            ctx.quadraticCurveTo(midX, (prevY + y) / 2, x, y);
        }
    }
    
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制曲线线条
    ctx.beginPath();
    for (let i = 0; i < app.energyHistory.length; i++) {
        const x = padding.left + (i / (app.energyHistory.length - 1)) * chartWidth;
        const y = height - padding.bottom - (app.energyHistory[i] / maxValue) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            const prevX = padding.left + ((i - 1) / (app.energyHistory.length - 1)) * chartWidth;
            const prevY = height - padding.bottom - (app.energyHistory[i - 1] / maxValue) * chartHeight;
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
            ctx.quadraticCurveTo(midX, (prevY + y) / 2, x, y);
        }
    }
    
    ctx.strokeStyle = '#fbbf24'; // amber-400
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制X轴时间刻度
    ctx.fillStyle = '#475569'; // text-muted
    ctx.font = '10px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    
    const timeLabels = ['0', '6', '12', '18', '24'];
    const timePositions = [0, 6, 12, 18, 23];
    
    for (let i = 0; i < timeLabels.length; i++) {
        const x = padding.left + (timePositions[i] / (app.energyHistory.length - 1)) * chartWidth;
        ctx.fillText(timeLabels[i], x, height - 3);
    }
}