/**
 * devices.js - 设备数据模块
 * 包含：设备默认数据、设备初始化
 */

// 设备默认开启时，随机初始化一个启动时间（1-120分钟前）
function initRuntime() {
    const now = Date.now();
    return now - (1 + Math.random() * 119) * 60 * 1000;
}

// 获取默认设备列表
function getDefaultDevices() {
    return [
        { id: '1', name: '客厅主灯', icon: '💡', room: 'living', type: 'light', on: true, brightness: 80, colorTemp: 4000, color: '#fbbf24', hasSlider: true, sliderLabel: '亮度', sliderValue: 80, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '2', name: '客厅空调', icon: '❄️', room: 'living', type: 'ac', on: true, temperature: 24, mode: 'cool', color: '#38bdf8', hasSlider: true, sliderLabel: '温度', sliderValue: 24, sliderMin: 16, sliderMax: 30, sliderUnit: '°C', timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '3', name: '智能窗帘', icon: '🪟', room: 'living', type: 'curtain', on: true, openPercent: 70, color: '#a78bfa', hasSlider: true, sliderLabel: '开合', sliderValue: 70, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '4', name: '智能电视', icon: '📺', room: 'living', type: 'tv', on: false, volume: 30, color: '#60a5fa', hasSlider: true, sliderLabel: '音量', sliderValue: 30, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: null },
        { id: '5', name: '卧室吊灯', icon: '💡', room: 'bedroom', type: 'light', on: false, brightness: 50, colorTemp: 3000, color: '#fbbf24', hasSlider: true, sliderLabel: '亮度', sliderValue: 50, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: null },
        { id: '6', name: '卧室空调', icon: '❄️', room: 'bedroom', type: 'ac', on: false, temperature: 26, mode: 'cool', color: '#38bdf8', hasSlider: true, sliderLabel: '温度', sliderValue: 26, sliderMin: 16, sliderMax: 30, sliderUnit: '°C', timerTime: null, timerAction: null, startedAt: null },
        { id: '7', name: '空气净化器', icon: '🌬️', room: 'bedroom', type: 'purifier', on: true, speed: 2, color: '#34d399', hasSlider: false, timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '8', name: '智能门锁', icon: '🔒', room: 'living', type: 'lock', on: true, color: '#f97316', hasSlider: false, timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '9', name: '扫地机器人', icon: '🤖', room: 'living', type: 'robot', on: false, color: '#8b5cf6', hasSlider: false, timerTime: null, timerAction: null, startedAt: null },
        { id: '10', name: '厨房灯', icon: '💡', room: 'kitchen', type: 'light', on: true, brightness: 100, colorTemp: 5000, color: '#fbbf24', hasSlider: true, sliderLabel: '亮度', sliderValue: 100, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '11', name: '热水器', icon: '🔥', room: 'bathroom', type: 'heater', on: false, temperature: 42, color: '#fb7185', hasSlider: true, sliderLabel: '温度', sliderValue: 42, sliderMin: 30, sliderMax: 60, sliderUnit: '°C', timerTime: null, timerAction: null, startedAt: null },
        { id: '12', name: '书房台灯', icon: '🪔', room: 'study', type: 'light', on: true, brightness: 65, colorTemp: 4500, color: '#fbbf24', hasSlider: true, sliderLabel: '亮度', sliderValue: 65, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '13', name: '浴室灯', icon: '💡', room: 'bathroom', type: 'light', on: false, brightness: 80, colorTemp: 5000, color: '#fbbf24', hasSlider: true, sliderLabel: '亮度', sliderValue: 80, sliderMin: 0, sliderMax: 100, sliderUnit: '%', timerTime: null, timerAction: null, startedAt: null },
        { id: '14', name: '智能冰箱', icon: '🧊', room: 'kitchen', type: 'fridge', on: true, temperature: 4, color: '#38bdf8', hasSlider: true, sliderLabel: '温度', sliderValue: 4, sliderMin: 2, sliderMax: 8, sliderUnit: '°C', timerTime: null, timerAction: null, startedAt: initRuntime() },
        { id: '15', name: '书房电脑', icon: '💻', room: 'study', type: 'computer', on: false, color: '#34d399', hasSlider: false, timerTime: null, timerAction: null, startedAt: null },
        { id: '16', name: '浴室排气扇', icon: '🌀', room: 'bathroom', type: 'exhaust', on: false, color: '#38bdf8', hasSlider: false, timerTime: null, timerAction: null, startedAt: null },
    ];
}