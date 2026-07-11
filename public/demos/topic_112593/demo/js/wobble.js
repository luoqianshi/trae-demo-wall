/* ==================== 准星晃动模拟 ==================== */
const Wobble = {
    // 生成准星晃动偏移
    // time: 当前时间（秒）
    // mouseX, mouseY: 鼠标原始位置
    // 返回: { x, y } 晃动后的位置
    generate(time, mouseX, mouseY) {
        // 呼吸晃动（低频，模拟呼吸导致的自然晃动）
        const breathX = Math.sin(time * 0.5) * 3 + Math.sin(time * 0.3) * 1.5;
        const breathY = Math.cos(time * 0.5) * 2 + Math.cos(time * 0.4) * 1.2;

        // 肌肉颤抖（高频，模拟手部微颤）
        const tremorX = Math.sin(time * 15) * 0.5 + Math.sin(time * 23) * 0.3;
        const tremorY = Math.cos(time * 17) * 0.5 + Math.cos(time * 29) * 0.3;

        // 随机噪声
        const noiseX = (Math.random() - 0.5) * 0.5;
        const noiseY = (Math.random() - 0.5) * 0.5;

        return {
            x: mouseX + breathX + tremorX + noiseX,
            y: mouseY + breathY + tremorY + noiseY
        };
    },

    // 计算当前晃动幅度（用于评分）
    // 返回: 晃动幅度值（越小越稳）
    getAmplitude(time) {
        const breathAmp = Math.abs(Math.sin(time * 0.5) * 3) + Math.abs(Math.cos(time * 0.5) * 2);
        const tremorAmp = Math.abs(Math.sin(time * 15) * 0.5) + Math.abs(Math.cos(time * 17) * 0.5);
        return breathAmp + tremorAmp;
    },

    // 计算准星速度（用于判断是否稳定）
    // prevPos, currPos: 前一帧和当前帧位置
    // dt: 帧间隔（秒）
    getSpeed(prevPos, currPos, dt) {
        if (!prevPos || dt <= 0) return 999;
        const dx = currPos.x - prevPos.x;
        const dy = currPos.y - prevPos.y;
        return Math.sqrt(dx * dx + dy * dy) / dt;
    },

    // 判断是否处于最佳击发窗口
    // 速度低于阈值且靠近靶心
    isOptimalWindow(speed, aimX, aimY, targetCenterX, targetCenterY, targetRadius) {
        const speedThreshold = 15; // 像素/秒
        const dist = Utils.distance(aimX, aimY, targetCenterX, targetCenterY);
        return speed < speedThreshold && dist < targetRadius * 0.4;
    }
};
