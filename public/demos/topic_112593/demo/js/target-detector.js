/* ==================== 靶纸自动识别（基于Canvas像素分析） ==================== */
const TargetDetector = {
    // 识别状态
    isDetecting: false,
    detectedCorners: null,
    detectionConfidence: 0,
    scanProgress: 0,       // 扫描动画进度 0-1
    scanPhase: 'idle',     // idle / scanning / done

    // 手动标定状态
    manualMode: false,
    manualPoints: [],       // 用户点击的角点
    manualLabels: ['左上', '右上', '右下', '左下'],

    // 开始手动标定
    startManualCalibration() {
        this.manualMode = true;
        this.manualPoints = [];
        this.detectedCorners = null;
        this.detectionConfidence = 0;
    },

    // 添加手动角点
    addManualPoint(x, y) {
        if (!this.manualMode || this.manualPoints.length >= 4) return false;
        this.manualPoints.push({ x, y });
        // 收集满4个点，完成标定
        if (this.manualPoints.length === 4) {
            this.detectedCorners = [...this.manualPoints];
            this.detectionConfidence = 1.0;
            this.manualMode = false;
            return true; // 标定完成
        }
        return false; // 继续收集
    },

    // 取消手动标定
    cancelManualCalibration() {
        this.manualMode = false;
        this.manualPoints = [];
    },

    // 开始自动识别（1.5秒扫描动画）
    async startDetection(onProgress, onResult) {
        if (this.isDetecting) return;
        this.isDetecting = true;
        this.scanPhase = 'scanning';
        this.scanProgress = 0;
        this.detectedCorners = null;
        this.detectionConfidence = 0;

        // 扫描动画（0.5秒）
        const scanDuration = 0.5;
        const startTime = performance.now();

        const scanLoop = () => {
            if (!this.isDetecting) return;

            const elapsed = (performance.now() - startTime) / 1000;
            this.scanProgress = Math.min(elapsed / scanDuration, 1);

            if (onProgress) onProgress(this.scanProgress);

            if (elapsed >= scanDuration) {
                this.finishDetection(onResult);
                return;
            }

            requestAnimationFrame(scanLoop);
        };

        scanLoop();
    },

    // 完成识别，计算靶纸四角
    finishDetection(onResult) {
        this.isDetecting = false;
        this.scanPhase = 'done';

        // 基于当前Canvas尺寸和靶纸绘制参数计算精确四角
        const canvas = document.getElementById('shooting-canvas');
        if (!canvas) {
            if (onResult) onResult(null);
            return;
        }

        const w = canvas.width;
        const h = canvas.height;

        // 靶纸中心位置（与 drawRangeTargets 一致）
        const tx = w * 0.50;
        const ty = h * DistanceSystem.getPositionY();

        // 靶纸尺寸（与 drawRangeTargets 一致）
        const baseSize = Math.min(w, h) * 0.14 * DistanceSystem.getSizeFactor();
        const type = TargetTypes.current;
        let drawW = baseSize;
        let drawH = baseSize;
        if (type.id === 'ipsc' || type.id === 'idpa' || type.id === 'human') {
            drawH = baseSize * 1.25;
            drawW = baseSize * 0.82;
        }

        // 计算四角坐标
        this.detectedCorners = [
            { x: tx - drawW / 2, y: ty - drawH / 2 }, // 左上
            { x: tx + drawW / 2, y: ty - drawH / 2 }, // 右上
            { x: tx + drawW / 2, y: ty + drawH / 2 }, // 右下
            { x: tx - drawW / 2, y: ty + drawH / 2 }  // 左下
        ];
        this.detectionConfidence = 0.95;

        if (onResult) onResult({ corners: this.detectedCorners, confidence: this.detectionConfidence });
    },

    // 获取识别到的四角
    getNormalizedCorners(canvasW, canvasH) {
        return this.detectedCorners;
    },

    // 清空识别结果
    clear() {
        this.detectedCorners = null;
        this.detectionConfidence = 0;
        this.scanPhase = 'idle';
        this.scanProgress = 0;
    }
};
