/**
 * 摄像头管理模块 - 负责摄像头访问、画面截取等功能
 * 提供初始化、启动、停止、截图、状态查询等 API
 */

/** 当前活跃的 MediaStream 对象，用于跟踪摄像头视频流状态，初始为 null 表示未启动 */
let currentStream = null;

/** 绑定到的 <video> DOM 元素，用于实时显示摄像头画面 */
let videoElement = null;

/**
 * 初始化摄像头模块
 * 根据传入的视频元素 ID 获取 DOM 引用，供后续启动摄像头时使用
 * @param {string} videoId - 页面中 <video> 标签的 id 属性值
 */
export function initCamera(videoId) {
    // 通过 DOM API 获取对应的视频元素并保存到模块级变量中
    videoElement = document.getElementById(videoId);
}

/**
 * 启动摄像头
 * 请求用户授权并获取摄像头视频流，绑定到预先初始化的 video 元素上
 * @returns {Promise<boolean>} - 启动成功返回 true，失败返回 false
 */
export async function startCamera() {
    try {
        // 如果当前已有活跃的流，先停止旧流以释放设备资源，避免重复占用摄像头
        if (currentStream) {
            stopCamera();
        }

        // 调用浏览器原生 API 请求摄像头权限并获取媒体流
        // 配置理想分辨率为 1280x720，优先使用前置摄像头（facingMode: 'user'），不采集音频
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },   // 理想宽度 1280 像素
                height: { ideal: 720 },   // 理想高度 720 像素
                facingMode: 'user'        // 优先使用前置摄像头（自拍模式）
            },
            audio: false                  // 仅获取视频轨道，不采集音频
        });

        // 如果 video 元素已成功初始化，将视频流赋值给它并开始播放
        if (videoElement) {
            // 将获取到的 MediaStream 设置为视频元素的输入源
            videoElement.srcObject = currentStream;

            // 当视频元数据加载完成后触发回调，确保视频可以播放后再执行后续操作
            videoElement.onloadedmetadata = () => {
                // 开始播放视频流，使画面在页面上实时显示
                videoElement.play();
                // 隐藏视频加载前的占位提示元素
                hidePlaceholder();
            };
        }

        // 摄像头启动成功，返回 true 供调用方判断状态
        return true;
    } catch (err) {
        // 捕获并输出摄像头访问失败的异常，常见原因包括用户拒绝授权或无可用设备
        console.error('Camera access error:', err);
        // 启动失败时返回 false，提示调用方进行降级处理
        return false;
    }
}

/**
 * 停止摄像头
 * 停止当前所有媒体轨道并释放摄像头硬件资源
 */
export function stopCamera() {
    // 只有当存在活跃的视频流时才执行停止操作，防止空引用错误
    if (currentStream) {
        // 遍历流中的所有轨道（通常包含视频轨道，可能还有音频轨道）并逐个停止
        currentStream.getTracks().forEach(track => track.stop());
        // 将模块级变量重置为 null，标记当前无活跃流
        currentStream = null;
    }
}

/**
 * 截取当前画面
 * 将 video 元素当前帧绘制到 canvas 上并导出为 Base64 PNG 图片
 * @returns {string} - Base64 编码的 PNG 图片数据 URL
 */
export function captureScreenshot() {
    // 安全检查：如果视频元素不存在、流未启动或视频宽度为 0（尚未准备好），则返回模拟截图
    if (!videoElement || !currentStream || videoElement.videoWidth === 0) {
        return generateMockScreenshot();
    }

    // 创建离屏 canvas 元素，用于将视频帧绘制为静态图像
    const canvas = document.createElement('canvas');
    // 设置 canvas 尺寸与视频实际分辨率一致，保证截图清晰度
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    // 获取 2D 绘图上下文，用于执行后续的图像变换和绘制操作
    const ctx = canvas.getContext('2d');

    // 对 canvas 上下文进行坐标变换，实现水平镜像翻转
    // 先将坐标原点移动到 canvas 右侧边缘
    ctx.translate(canvas.width, 0);
    // 在 X 轴方向进行 -1 倍缩放，使画面左右翻转（模拟镜子效果）
    ctx.scale(-1, 1);
    // 将当前视频帧绘制到 canvas 上，覆盖整个画布区域
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 将 canvas 内容导出为 PNG 格式的 Base64 Data URL，便于直接显示或上传
    return canvas.toDataURL('image/png');
}

/**
 * 生成模拟截图（当摄像头不可用时作为降级方案）
 * 绘制一个带有渐变色背景、随机矩形噪点和时间戳文字的占位图片
 * @returns {string} - Base64 编码的 PNG 图片数据 URL
 */
function generateMockScreenshot() {
    // 创建离屏 canvas 用于绘制模拟画面
    const canvas = document.createElement('canvas');
    // 设置固定分辨率 1280x720，与理想摄像头分辨率保持一致
    canvas.width = 1280;
    canvas.height = 720;
    // 获取 2D 绘图上下文
    const ctx = canvas.getContext('2d');

    // 创建从左上到右下的线性渐变背景，模拟深色监控画面风格
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    // 渐变起始颜色：深蓝灰色
    grad.addColorStop(0, '#1e293b');
    // 渐变结束颜色：更深的近黑色
    grad.addColorStop(1, '#0f172a');
    // 将填充样式设为该渐变
    ctx.fillStyle = grad;
    // 以渐变填充整个 canvas 矩形区域
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 循环 50 次，绘制随机位置的半透明蓝色小矩形，模拟监控画面的噪点或信号干扰效果
    for (let i = 0; i < 50; i++) {
        // 设置每次循环的填充色为半透明蓝色，透明度在 0 到 0.1 之间随机变化
        ctx.fillStyle = `rgba(59, 130, 246, ${Math.random() * 0.1})`;
        // 在随机位置绘制随机宽高的小矩形
        ctx.fillRect(
            Math.random() * canvas.width,   // 随机 X 坐标
            Math.random() * canvas.height,  // 随机 Y 坐标
            Math.random() * 100,            // 随机宽度（0-100 像素）
            Math.random() * 100             // 随机高度（0-100 像素）
        );
    }

    // 设置文字颜色为浅灰色，用于在模拟画面上显示提示信息
    ctx.fillStyle = '#94a3b8';
    // 设置字体样式为 20 像素无衬线字体
    ctx.font = '20px sans-serif';
    // 在固定位置绘制“模拟监控画面”提示文字
    ctx.fillText('模拟监控画面', 40, 60);
    // 在提示文字下方绘制当前系统时间的本地化字符串，增加真实感
    ctx.fillText(new Date().toLocaleString(), 40, 90);

    // 将绘制好的模拟画面导出为 PNG 格式的 Base64 Data URL
    return canvas.toDataURL('image/png');
}

/**
 * 隐藏摄像头占位符
 * 当视频流成功加载并开始播放后，隐藏页面中提示“等待摄像头”的占位元素
 */
function hidePlaceholder() {
    // 通过 ID 获取页面中的占位提示元素
    const placeholder = document.getElementById('video-placeholder');
    // 判断元素是否存在，避免元素未渲染时报错
    if (placeholder) {
        // 将该元素的显示样式设为 none，使其在页面上不可见
        placeholder.style.display = 'none';
    }
}

/**
 * 获取当前视频流状态
 * 判断摄像头是否处于活跃状态
 * @returns {boolean} - 如果存在活跃的视频流则返回 true，否则返回 false
 */
export function isCameraActive() {
    // 使用双重逻辑非运算符将 currentStream 转换为布尔值
    // 当 currentStream 为 null 或 undefined 时返回 false，存在对象时返回 true
    return !!currentStream;
}

/**
 * 获取视频流对象
 * 供外部模块直接访问当前的 MediaStream 实例
 * @returns {MediaStream|null} - 当前活跃的 MediaStream 对象，未启动时返回 null
 */
export function getStream() {
    // 直接返回模块级变量 currentStream，可能是 MediaStream 实例或 null
    return currentStream;
}
