/**
 * 传感器模块 - 温湿度环境数据管理
 * 负责环境数据初始化、传感器数据周期更新、传感器显示更新
 */

// 传感器更新间隔（毫秒）
const SENSOR_UPDATE_INTERVAL = 3000;

/**
 * 初始化温湿度环境数据
 * @returns {Object} 环境数据对象，包含基准值和各房间偏移
 */
function initEnvData() {
    return {
        // 整体环境基准值（与 header 一致）
        baseTemp: 24,
        baseHumid: 58,
        // 每个房间的微调偏移
        roomOffset: {
            living: { temp: 0.0, humid: 0 },
            bedroom: { temp: -0.5, humid: -2 },
            kitchen: { temp: 1.5, humid: 4 },  // 厨房通常温度/湿度较高
            bathroom: { temp: 0.8, humid: 10 }, // 浴室湿度更高
            study: { temp: -0.3, humid: -2 }
        }
    };
}

/**
 * 启动温湿度传感器周期更新
 * @param {Object} app - SmartHome 实例
 */
function startSensorUpdates(app) {
    // 每 3 秒更新一次数据
    setInterval(() => {
        // 让基准值做轻微随机漂移（24-26°C, 55-65%）
        const tempDrift = (Math.random() - 0.5) * 0.6; // -0.3 ~ 0.3
        const humidDrift = (Math.random() - 0.5) * 2; // -1 ~ 1

        app.envData.baseTemp = Math.max(24, Math.min(26,
            app.envData.baseTemp + tempDrift));
        app.envData.baseHumid = Math.max(55, Math.min(65,
            app.envData.baseHumid + humidDrift));

        updateSimulation(app);
    }, SENSOR_UPDATE_INTERVAL);
}

/**
 * 更新温湿度传感器显示
 * @param {Object} app - SmartHome 实例
 */
function updateSensors(app) {
    const rooms = ['living', 'bedroom', 'kitchen', 'bathroom', 'study'];

    rooms.forEach(room => {
        const tempEl = document.getElementById(`sim-${room}-temp`);
        const humidEl = document.getElementById(`sim-${room}-humid`);
        if (!tempEl || !humidEl) return;

        // 计算当前房间温湿度
        const offset = app.envData.roomOffset[room] || { temp: 0, humid: 0 };
        // 每个房间再加一个微小的随机波动
        const tempJitter = (Math.random() - 0.5) * 0.4; // -0.2 ~ 0.2
        const humidJitter = Math.round((Math.random() - 0.5) * 2); // -1 ~ 1

        const temp = app.envData.baseTemp + offset.temp + tempJitter;
        const humid = Math.round(app.envData.baseHumid + offset.humid + humidJitter);

        const tempText = temp.toFixed(1) + '°C';
        const humidText = humid + '%';

        // 仅在数值变化时触发闪烁动画，避免每次都闪烁
        const key = room;
        const lastVal = app.lastSensorValues[key];
        if (!lastVal || lastVal.tempText !== tempText) {
            tempEl.textContent = tempText;
            tempEl.classList.remove('flash');
            // 强制重排以重新触发动画
            void tempEl.offsetWidth;
            tempEl.classList.add('flash');
        }
        if (!lastVal || lastVal.humidText !== humidText) {
            humidEl.textContent = humidText;
            humidEl.classList.remove('flash');
            void humidEl.offsetWidth;
            humidEl.classList.add('flash');
        }

        app.lastSensorValues[key] = { tempText, humidText };
    });

    // 同步更新 header 中的环境数据
    updateEnvironment(app);
}

/**
 * 更新 header 中的环境数据（与传感器基准值保持一致）
 * @param {Object} app - SmartHome 实例
 */
function updateEnvironment(app) {
    const envTemp = document.getElementById('envTemp');
    const envHumid = document.getElementById('envHumidity');
    if (envTemp) {
        envTemp.textContent = app.envData.baseTemp.toFixed(1) + '°C';
    }
    if (envHumid) {
        envHumid.textContent = Math.round(app.envData.baseHumid) + '%';
    }
}