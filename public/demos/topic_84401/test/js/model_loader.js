// 中国手语识别 - 终极修复版
// 完全重写手指状态检测，使用向量的相对距离

class CSLModel {
    constructor() {
        this.words = window.CSLWords.words;
        this.numClasses = window.CSLWords.words.length;
        this.tfModel = null;
        this.useTfModel = false;
        this.historyBuffer = [];
        this.maxHistory = 20;
    }

    async loadModel(modelPath) {
        try {
            this.tfModel = await tf.loadLayersModel(modelPath);
            this.useTfModel = true;
            return true;
        } catch (e) {
            this.useTfModel = false;
            return false;
        }
    }

    isReady() { return true; }

    /**
     * 计算手指状态
     * MediaPipe坐标说明: (x, y, z), x和y是归一化的0-1坐标
     * y=0在图片顶部, y=1在底部
     * 摄像头视频是水平镜像的(实际显示翻转)，但landmarks坐标不翻转
     */
    _computeFingerStates(landmarks) {
        const states = [0, 0, 0, 0, 0];

        if (!landmarks || landmarks.length < 21) return states;

        const wrist = landmarks[0];

        // ==== 拇指 ====
        // 拇指比较特殊：弯曲时指尖(4)靠在食指根部(5)附近；伸直时远离
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const thumbMcp = landmarks[2];
        const indexMcp = landmarks[5];

        // 拇指尖到食指MCP的距离 - 拇指弯曲时这个距离很小
        const thumbTipToIndexMcp = Math.hypot(
            thumbTip.x - indexMcp.x,
            thumbTip.y - indexMcp.y
        );

        // 手掌宽度参考：小指MCP(17)到食指MCP(5)
        const palmWidth = Math.hypot(
            landmarks[17].x - indexMcp.x,
            landmarks[17].y - indexMcp.y
        );

        // 拇指伸直: 拇指尖到食指MCP距离 > 手掌宽度的 80%
        // 拇指弯曲: 这个距离 < 手掌宽度的 60%
        // 状态1（伸直）= 大于0.8倍手掌宽度
        states[0] = thumbTipToIndexMcp > palmWidth * 0.8 ? 1 : 0;

        // ==== 食指、中指、无名指、小指 ====
        // 标准方法: 计算"指尖到手腕的距离" 和 "MCP到手腕的距离" 的比值
        // 手指伸直时, 指尖离手腕应该比MCP远 1.25倍以上
        const fingers = [
            { tip: 8, mcp: 5 },    // 食指
            { tip: 12, mcp: 9 },   // 中指
            { tip: 16, mcp: 13 },  // 无名指
            { tip: 20, mcp: 17 }   // 小指
        ];

        for (let i = 0; i < 4; i++) {
            const f = fingers[i];
            const tip = landmarks[f.tip];
            const mcp = landmarks[f.mcp];

            const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

            // 伸直: tipDist > mcpDist * 1.25
            const ratio = tipDist / mcpDist;
            states[i + 1] = ratio > 1.25 ? 1 : 0;
        }

        return states;
    }

    /**
     * 计算4指并拢程度
     * "4"和"5"的本质区别: 4指并拢 vs 5指张开
     * 返回0-1的归一化值，值越大表示手指越分散
     */
    _computeFingerSpread(landmarks) {
        if (!landmarks || landmarks.length < 21) return 0;

        // 4个手指的指尖: 8, 12, 16, 20
        const tips = [8, 12, 16, 20];
        const palmWidth = Math.hypot(
            landmarks[17].x - landmarks[5].x,
            landmarks[17].y - landmarks[5].y
        );
        if (palmWidth < 0.01) return 0;

        // 计算相邻指尖的平均距离
        let totalGap = 0;
        for (let i = 0; i < tips.length - 1; i++) {
            totalGap += Math.hypot(
                landmarks[tips[i]].x - landmarks[tips[i+1]].x,
                landmarks[tips[i]].y - landmarks[tips[i+1]].y
            );
        }
        const avgGap = totalGap / (tips.length - 1);

        // 归一化: 用手掌宽度作分母
        return avgGap / palmWidth;
    }

    // 计算手部姿态 - 方向
    _computeHandPose(landmarks) {
        if (!landmarks || landmarks.length < 21) {
            return { fingerDir: 'unknown', palmFacing: 'unknown' };
        }

        const wrist = landmarks[0];
        const indexMcp = landmarks[5];
        const indexTip = landmarks[8];
        const middleMcp = landmarks[9];
        const middleTip = landmarks[12];
        const pinkyMcp = landmarks[17];
        const thumbMcp = landmarks[2];

        // 手指方向：用食指MCP→食指Tip（更稳定，能区分"一"和"我"）
        // 食指指自己（向摄像头）= back/forward
        // 食指朝上 = up
        // 食指指向旁边 = left/right
        const idxDx = indexTip.x - indexMcp.x;
        const idxDy = indexTip.y - indexMcp.y;

        let fingerDir;
        if (Math.abs(idxDy) > Math.abs(idxDx) * 1.5) {
            fingerDir = idxDy < 0 ? 'up' : 'down';
        } else if (Math.abs(idxDx) > Math.abs(idxDy) * 1.5) {
            fingerDir = idxDx > 0 ? 'right' : 'left';
        } else {
            fingerDir = idxDy < 0 ? 'up' : 'down';
        }

        // 掌心朝向判断 - 用Z轴(深度)来识别更准确
        // MediaPipe的z是相对深度，正值表示靠近摄像头
        // 掌心朝外（面对摄像头）时，拇指MCP的z比小指MCP小（远离）
        // 掌心朝内（背对摄像头）时，拇指MCP的z比小指MCP大（靠近）
        const thumbMcpZ = thumbMcp.z || 0;
        const pinkyMcpZ = pinkyMcp.z || 0;
        const zDiff = thumbMcpZ - pinkyMcpZ;

        let palmFacing;
        if (Math.abs(zDiff) > 0.005) {
            // z值差异足够大
            palmFacing = zDiff > 0 ? 'back' : 'front';  // 拇指靠近 = 掌心朝前
        } else {
            // 用拇指和小指的X位置判断
            const thumbMcpX = thumbMcp.x;
            const pinkyMcpX = pinkyMcp.x;
            const xDiff = thumbMcpX - pinkyMcpX;

            if (Math.abs(xDiff) > 0.05) {
                palmFacing = xDiff > 0 ? 'right' : 'left';
            } else {
                palmFacing = fingerDir === 'up' ? 'front' : 'side';
            }
        }

        // 计算食指指向自己的程度（食指方向是否朝摄像头）
        // 用食指MCP的z和tip的z比较：食指指向摄像头时 tip.z > mcp.z
        const forwardScore = (indexTip.z || 0) - (indexMcp.z || 0);
        const isPointingForward = forwardScore > 0.02;  // 食指指向摄像头方向

        return { fingerDir, palmFacing, isPointingForward };
    }

    _analyzeMotion() {
        if (this.historyBuffer.length < 5) {
            return { type: 'insufficient' };
        }

        const recent = this.historyBuffer.slice(-15);
        const first = recent[0];
        const last = recent[recent.length - 1];

        const dx = last.wrist.x - first.wrist.x;
        const dy = last.wrist.y - first.wrist.y;
        const magnitude = Math.hypot(dx, dy);

        if (magnitude < 0.02) {
            return { type: 'static', magnitude };
        }

        // 检测震动
        let totalVar = 0;
        for (let i = 1; i < recent.length; i++) {
            const v = Math.hypot(
                recent[i].wrist.x - recent[i-1].wrist.x,
                recent[i].wrist.y - recent[i-1].wrist.y
            );
            totalVar += v;
        }
        const avgVar = totalVar / (recent.length - 1);

        if (avgVar > 0.004 && magnitude < 0.08) {
            return { type: 'shake', magnitude };
        }

        let direction;
        if (Math.abs(dy) > Math.abs(dx) * 1.3) {
            direction = dy < 0 ? 'up' : 'down';
        } else if (Math.abs(dx) > Math.abs(dy) * 1.3) {
            direction = dx > 0 ? 'right' : 'left';
        } else {
            direction = 'diag';
        }

        return { type: 'move', direction, magnitude, dx, dy };
    }

    recognize(landmarks) {
        if (!landmarks || landmarks.length < 21) {
            return { word: '', pinyin: '', confidence: 0, id: -1, debug: null };
        }

        if (this.useTfModel && this.tfModel) {
            return this._recognizeWithTf(landmarks);
        }

        // 1. 特征提取
        const fingers = this._computeFingerStates(landmarks);
        const fingersSpread = this._computeFingerSpread(landmarks);
        const pose = this._computeHandPose(landmarks);
        const fingersStr = fingers.join('');
        const extendedCount = fingers.reduce((a, b) => a + b, 0);

        // 2. 更新历史
        this.historyBuffer.push({
            wrist: { x: landmarks[0].x, y: landmarks[0].y },
            timestamp: Date.now()
        });
        if (this.historyBuffer.length > this.maxHistory) {
            this.historyBuffer.shift();
        }

        // 3. 动态分析
        const motion = this._analyzeMotion();

        // 4. 基础匹配 - 根据手指状态选择候选词
        let candidates = this._matchByFingers(fingersStr, fingers, extendedCount);

        // 5. 结合方向、掌心朝向、动态和手指间距调整分数
        candidates = this._refineByContext(candidates, pose, motion, fingers, fingersSpread);

        // 6. 排序
        candidates.sort((a, b) => b.score - a.score);
        const top = candidates[0];

        if (top.score < 20) {
            return {
                word: '', pinyin: '', confidence: 0, id: -1,
                debug: {
                    fingers: fingersStr,
                    fingerDir: pose.fingerDir,
                    palmFacing: pose.palmFacing,
                    spread: fingersSpread.toFixed(2),
                    motion: motion.type,
                    candidates: candidates.slice(0, 5).map(c => `${c.word}(${c.score})`).join(' | ')
                }
            };
        }

        const wordInfo = this.words.find(w => w.word === top.word);
        return {
            word: top.word,
            pinyin: wordInfo ? wordInfo.pinyin : '',
            confidence: Math.min(1, top.score / 100),
            id: wordInfo ? this.words.indexOf(wordInfo) : -1,
            debug: {
                fingers: fingersStr,
                fingerDir: pose.fingerDir,
                palmFacing: pose.palmFacing,
                spread: fingersSpread.toFixed(2),
                motion: motion.type,
                candidates: candidates.slice(0, 5).map(c => `${c.word}(${c.score})`).join(' | ')
            }
        };
    }

    _matchByFingers(fingersStr, fingers, count) {
        // 根据手指状态字符串返回候选词
        // 注意：4和5的区别在于掌心朝向
        // 4 = 掌心朝外 + 4指并拢
        // 5 = 掌心朝内 + 4指分开(张开) 或 5指都伸直
        const map = {
            '00000': [
                {word: '十', score: 80}, {word: '工作', score: 70},
                {word: '对不起', score: 50}, {word: '没关系', score: 50}
            ],
            '10000': [
                {word: '十', score: 85}, {word: '饿', score: 50}
            ],
            '01000': [
                {word: '一', score: 95}, {word: '我', score: 80}, {word: '你', score: 80},
                {word: '他', score: 70}, {word: '她', score: 70}, {word: '吃饭', score: 40}
            ],
            '01100': [
                {word: '二', score: 95}, {word: '好', score: 70}, {word: '朋友', score: 60},
                {word: '我们', score: 50}, {word: '来', score: 50}, {word: '水', score: 40}
            ],
            '01110': [
                {word: '三', score: 95}, {word: '可以', score: 70}
            ],
            '01111': [
                {word: '四', score: 95}  // 4指并拢（不含拇指）
            ],
            '11111': [
                // 5指都伸直，可能是"五"也可能是"四"（拇指可能误判）
                // 真正的区分要看手指间距
                {word: '五', score: 80}, {word: '四', score: 70},
                {word: '中国', score: 50}, {word: '高兴', score: 50},
                {word: '请', score: 50}, {word: '谢谢', score: 50}, {word: '早上', score: 50}
            ],
            '10001': [
                {word: '六', score: 95}, {word: '九', score: 60}, {word: '手机', score: 70}
            ],
            '11000': [
                {word: '七', score: 85}, {word: '八', score: 70}, {word: '北京', score: 50},
                {word: '上海', score: 50}, {word: '爱', score: 60}, {word: '喜欢', score: 60}
            ],
            '11100': [
                {word: '爱', score: 80}, {word: '喜欢', score: 80},
                {word: '笔', score: 60}, {word: '钱', score: 60}, {word: '帮忙', score: 60}
            ],
            '11001': [
                {word: '六', score: 70}, {word: '手机', score: 80}, {word: '打电话', score: 80}
            ],
            '00100': [
                {word: '中指', score: 50}, {word: '不', score: 50}
            ],
            '01010': [
                {word: 'V', score: 50}, {word: '二', score: 50}
            ]
        };

        return (map[fingersStr] || [{word: '未知', score: 20}]).map(c => ({...c}));
    }

    _refineByContext(candidates, pose, motion, fingers, fingersSpread) {
        // 数字类列表 - 用于"动态手势时大幅降权"
        const numbers = ['一','二','三','四','五','六','七','八','九','十','零'];

        for (const c of candidates) {
            const w = c.word;
            const isNumber = numbers.indexOf(w) >= 0;

            // ==== 关键：动态手势时数字候选应该大幅降权 ====
            // 数字是静态手势，如果检测到有动作(motion=move)，数字应该降分
            if (isNumber && motion.type === 'move') {
                c.score -= 30;  // 数字不应该在动态时胜出
            }

            // ==== 方向调整（关键：区分"一"vs"我"vs"你"）====
            if (w === '一') {
                if (pose.fingerDir === 'up') c.score += 30;
                if (pose.isPointingForward) c.score -= 40;
            }
            if (w === '我') {
                if (pose.isPointingForward || pose.fingerDir === 'back') c.score += 60;
                if (pose.fingerDir === 'up') c.score -= 30;
            }
            if (w === '你') {
                if (pose.isPointingForward) c.score += 40;
            }
            if (w === '他' && pose.fingerDir === 'left') c.score += 25;
            if (w === '她' && pose.fingerDir === 'right') c.score += 25;

            // ==== 4和5的关键区分: 手指间距 ====
            if (w === '四') {
                if (fingersSpread < 0.30) c.score += 35;
                else if (fingersSpread > 0.45) c.score -= 50;
            }
            if (w === '五') {
                if (fingersSpread > 0.40) c.score += 25;
                else if (fingersSpread < 0.25) c.score -= 50;
            }

            // ==== 其它数字方向加分 ====
            if (w === '五' && pose.fingerDir === 'up') c.score += 15;
            if (w === '六' && pose.fingerDir === 'side') c.score += 15;
            if (w === '八' && pose.fingerDir === 'side') c.score += 15;

            // ==== 动态手势加分（这些词本身就是动作）====
            if (w === '谢谢' && motion.type === 'move' && motion.direction === 'down') {
                c.score += 50;  // 鞠躬动作
            }
            if (w === '对不起' && motion.type === 'move' && motion.direction === 'down') {
                c.score += 50;
            }
            if (w === '来' && motion.type === 'move' && motion.direction === 'left') {
                c.score += 40;
            }
            if (w === '去' && motion.type === 'move' && motion.direction === 'right') {
                c.score += 40;
            }
            if (w === '吃饭' && motion.type === 'move' && motion.direction === 'up') {
                c.score += 40;
            }
            if (w === '工作' && motion.type === 'move') {
                c.score += 30;
            }
            if (w === '帮忙' && motion.type === 'move') {
                c.score += 30;
            }
            if (w === '帮助' && motion.type === 'move') {
                c.score += 30;
            }
            if (w === '打电话' && motion.type === 'move') {
                c.score += 35;
            }
            if (w === '手机' && motion.type === 'static') {
                c.score += 25;
            }
            if (w === '水' && motion.type === 'static' && pose.fingerDir === 'side') {
                c.score += 20;
            }
            if (w === '饿' && motion.type === 'move' && motion.direction === 'up') {
                c.score += 35;
            }
            if (w === '高兴' && motion.type === 'static' && pose.fingerDir === 'up' && fingersSpread > 0.4) {
                c.score += 30;  // 5指张开朝上
            }

            // ==== 静态手势加分（数字） ====
            if (isNumber && motion.type === 'static') {
                c.score += 10;
            }
        }

        return candidates;
    }

    _recognizeWithTf(landmarks) {
        const wrist = landmarks[0];
        const result = [];
        for (let i = 0; i < 21; i++) {
            result.push(landmarks[i].x - wrist.x);
            result.push(landmarks[i].y - wrist.y);
        }
        return tf.tidy(() => {
            const input = tf.tensor2d([result]);
            const predictions = this.tfModel.predict(input);
            const values = predictions.dataSync();
            let maxIdx = 0, maxVal = values[0];
            for (let i = 1; i < values.length; i++) {
                if (values[i] > maxVal) { maxVal = values[i]; maxIdx = i; }
            }
            const wordInfo = this.words[maxIdx];
            return {
                word: wordInfo.word,
                pinyin: wordInfo.pinyin,
                confidence: Math.round(maxVal * 1000) / 1000,
                id: maxIdx
            };
        });
    }
}

window.CSLModel = CSLModel;
