/**
 * 场景管理模块 - 负责场景切换、摄像头网格渲染等功能
 */

// 导入场景数据配置，包含各场景及其摄像头信息
import { scenes } from './data.js';
// 导入摄像头媒体流获取函数，用于将实时视频流绑定到网格中的 video 元素
import { getStream } from './camera.js';
// 导入 Toast 提示函数，用于在切换场景时给用户视觉反馈
import { showToast } from './alert.js';

// 当前激活的场景ID，默认初始化为 'subway'（地铁场景）
let currentScene = 'subway';
// 当前被选中的摄像头索引，默认选中第一个摄像头（索引为0）
let selectedCamera = 0;

/**
 * 切换场景
 * 根据传入的场景ID更新当前场景，并重新渲染摄像头网格和按钮状态。
 * @param {string} sceneId - 场景ID，对应 scenes 数据对象中的键名
 */
export function switchScene(sceneId) {
    // 安全校验：如果传入的场景ID在数据配置中不存在，则直接退出，避免后续操作出错
    if (!scenes[sceneId]) return;

    // 更新全局当前场景变量为传入的场景ID
    currentScene = sceneId;
    // 更新侧边栏或顶部场景按钮的激活状态，使UI与当前场景保持一致
    updateSceneButtons();
    // 根据新的当前场景重新渲染摄像头网格，展示对应场景下的摄像头列表
    renderCameraGrid();

    // 弹出信息提示，告知用户场景已切换，并显示当前场景的中文名称
    showToast('info', '场景已切换', `当前监控: ${scenes[sceneId].name}`);
}

/**
 * 更新场景按钮状态
 * 遍历页面上所有带有 .scene-btn 类名的按钮，根据当前场景设置激活样式。
 */
function updateSceneButtons() {
    // 获取页面中所有场景切换按钮，并为每个按钮执行状态更新
    document.querySelectorAll('.scene-btn').forEach(btn => {
        // 判断按钮绑定的场景ID是否与当前场景匹配：
        // 若匹配则添加 'active' 类，否则移除 'active' 类
        btn.classList.toggle('active', btn.dataset.scene === currentScene);
    });
}

/**
 * 渲染摄像头网格
 * 根据当前场景对应的摄像头数据，动态生成摄像头画面卡片并插入到页面中，
 * 同时尝试将已有的媒体流绑定到新生成的 video 元素上。
 */
export function renderCameraGrid() {
    // 获取页面中用于承载摄像头卡片的容器元素（ID 为 'camera-grid'）
    const grid = document.getElementById('camera-grid');
    // 如果容器元素不存在（例如页面结构未加载完成），则直接退出，防止后续操作报错
    if (!grid) return;

    // 从全局场景数据中取出当前场景对应的配置对象
    const scene = scenes[currentScene];
    // 遍历当前场景下的摄像头数组，为每个摄像头生成对应的 HTML 卡片字符串，
    // 最后将所有卡片拼接为一个字符串并赋值给 grid 的 innerHTML，完成网格渲染
    grid.innerHTML = scene.cameras.map((cam, idx) => `
        <!-- 单个摄像头画面卡片容器 -->
        <div
            class="camera-feed ${idx === selectedCamera ? 'selected' : ''}"
            onclick="selectCamera(${idx})"
        >
            <!-- 用于播放实时视频流的 video 元素，默认自动播放、静音、支持行内播放（移动端兼容） -->
            <video class="feed-video" autoplay muted playsinline></video>
            <!-- 摄像头状态指示层，用于显示在线/离线等状态 -->
            <div class="feed-status"></div>
            <!-- 摄像头名称标签，显示在画面下方以便用户识别 -->
            <div class="feed-label">${cam.name}</div>
        </div>
    `).join('');

    // 尝试获取当前已建立的摄像头媒体流（可能为 null，例如权限未授予时）
    const stream = getStream();
    // 只有当成功获取到媒体流时，才将其绑定到网格内所有的 video 元素上，实现画面同步
    if (stream) {
        // 查询网格中所有用于播放视频的 .feed-video 元素
        const feeds = grid.querySelectorAll('.feed-video');
        // 为每个 video 元素设置视频源为获取到的媒体流对象
        feeds.forEach(feed => {
            feed.srcObject = stream;
        });
    }
}

/**
 * 选择摄像头
 * 更新当前选中的摄像头索引，并触发网格重绘以高亮显示被选中的摄像头。
 * @param {number} idx - 摄像头在当前场景摄像头数组中的索引
 */
export function selectCamera(idx) {
    // 更新全局变量，记录用户选中的摄像头索引
    selectedCamera = idx;
    // 重新渲染摄像头网格，使新选中的摄像头获得 'selected' 高亮样式
    renderCameraGrid();
}

/**
 * 获取当前场景ID
 * @returns {string} 当前激活的场景ID字符串
 */
export function getCurrentScene() {
    // 返回全局变量 currentScene 的值，供外部模块查询当前所在场景
    return currentScene;
}

/**
 * 获取当前场景的完整数据对象
 * @returns {Object} 包含当前场景名称、摄像头列表等信息的配置对象
 */
export function getCurrentSceneData() {
    // 通过当前场景ID作为键，从 scenes 数据对象中取出对应的场景配置并返回
    return scenes[currentScene];
}
