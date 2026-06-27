/**
 * 场景模块 - 场景模式管理
 * 负责场景应用和房间设备批量设置
 */

// 场景名称配置
const SCENE_NAMES = {
    home: '回家模式',
    away: '离家模式',
    sleep: '睡眠模式',
    movie: '影院模式',
    party: '派对模式',
    work: '工作模式'
};

/**
 * 应用场景模式
 * @param {Object} app - SmartHome 实例
 * @param {string} scene - 场景名称（home/away/sleep/movie/party/work）
 */
function applyScene(app, scene) {
    switch (scene) {
        case 'home':
            setDevicesByRoom(app, 'living', { light: { on: true, brightness: 80 }, ac: { on: true, temperature: 24 } });
            setDevicesByRoom(app, 'bedroom', { light: { on: false }, ac: { on: true, temperature: 26 } });
            updateSpeakers(false);
            showToast(app, '🏡 已开启回家模式', 'success');
            break;
        case 'away':
            app.devices.forEach(d => { d.on = false; d.startedAt = null; });
            updateSpeakers(false);
            showToast(app, '🔒 已开启离家模式，所有设备已关闭', 'info');
            break;
        case 'sleep':
            app.devices.forEach(d => {
                if (d.type === 'light') { d.on = false; d.startedAt = null; }
                if (d.type === 'ac') { d.on = true; d.startedAt = Date.now(); d.temperature = 26; d.sliderValue = 26; }
                if (d.type === 'curtain') { d.on = true; d.startedAt = Date.now(); d.openPercent = 0; d.sliderValue = 0; }
            });
            updateSpeakers(false);
            showToast(app, '🌙 已开启睡眠模式', 'success');
            break;
        case 'movie':
            setDevicesByRoom(app, 'living', { light: { on: true, brightness: 15 }, tv: { on: true, volume: 40 }, curtain: { on: true, openPercent: 0 } });
            updateSpeakers(true, false);
            showToast(app, '🎬 已开启影院模式', 'success');
            break;
        case 'party':
            app.devices.forEach(d => {
                if (d.type === 'light') { d.on = true; d.startedAt = Date.now(); d.brightness = 100; d.sliderValue = 100; }
                if (d.type === 'tv') { d.on = true; d.startedAt = Date.now(); d.volume = 60; d.sliderValue = 60; }
            });
            updateSpeakers(true, true);
            showToast(app, '🎉 已开启派对模式', 'success');
            break;
        case 'work':
            setDevicesByRoom(app, 'study', { light: { on: true, brightness: 90 }, computer: { on: true } });
            setDevicesByRoom(app, 'living', { light: { on: false }, tv: { on: false } });
            updateSpeakers(false);
            showToast(app, '💼 已开启工作模式', 'success');
            break;
    }

    render(app);
    updateSummary(app);
    updateSimulation(app);
    updateRuntimeDisplays(app);
    updateEnergyStats(app);
}

/**
 * 按房间批量设置设备状态
 * @param {Object} app - SmartHome 实例
 * @param {string} room - 房间名称（living/bedroom/kitchen/bathroom/study）
 * @param {Object} settings - 设备设置对象，键为设备类型，值为要设置的属性
 */
function setDevicesByRoom(app, room, settings) {
    app.devices.forEach(d => {
        if (d.room === room && settings[d.type]) {
            Object.assign(d, settings[d.type]);
            if (d.on) {
                d.startedAt = Date.now();
            } else {
                d.startedAt = null;
            }
        }
    });
}
