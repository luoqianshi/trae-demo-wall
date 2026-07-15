/**
 * 告警管理模块 - 负责告警触发、展示、处置等功能
 */

import { scenes, detectionLabels, bboxPositions } from './data.js';
import { captureScreenshot } from './camera.js';

let alertCount = 0;
let resolvedCount = 0;
let lastScreenshot = null;
let lastBboxPos = null;
let lastAlertType = null;
let lastConfidence = 0;

/**
 * 触发模拟告警
 * @param {string} sceneId - 当前场景ID
 */
export function simulateAlert(sceneId) {
    const scene = scenes[sceneId];
    if (!scene) return;

    const alert = scene.alerts[Math.floor(Math.random() * scene.alerts.length)];
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);

    lastScreenshot = captureScreenshot();
    lastBboxPos = bboxPositions[Math.floor(Math.random() * bboxPositions.length)];
    lastAlertType = alert.type;
    lastConfidence = Math.random() * 0.3 + 0.7;

    showAlertBanner(alert, timeStr);
    addDetectionOverlay(alert.type);
    
    alertCount++;
    updateStats();

    return {
        ...alert,
        time: timeStr,
        confidence: lastConfidence
    };
}

/**
 * 显示告警横幅
 * @param {Object} alert - 告警对象
 * @param {string} timeStr - 时间字符串
 */
function showAlertBanner(alert, timeStr) {
    const banner = document.getElementById('alert-banner');
    const screenshotImg = document.getElementById('screenshot-img');
    
    screenshotImg.src = lastScreenshot;
    document.getElementById('alert-title').textContent = alert.title;
    document.getElementById('alert-desc').textContent = alert.desc;
    document.getElementById('alert-time').textContent = timeStr;
    document.getElementById('alert-level').textContent = alert.level.toUpperCase();
    
    banner.classList.add('show');
}

/**
