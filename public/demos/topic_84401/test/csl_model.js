/**
 * 中国手语识别模型 - TensorFlow.js 训练模块
 * 
 * 基于MediaPipe Hands的21个关键点特征提取
 * 训练神经网络分类器
 */

class CSLGestureModel {
    constructor() {
        this.model = null;
        this.gestures = window.CSLGestures.gestures;
        this.config = window.CSLGestures.config;
        this.isTraining = false;
        this.onProgress = null;
    }

    /**
     * 初始化模型结构
     */
    async initModel() {
        const inputSize = this.config.featureDimension;
        const numClasses = this.gestures.length;

        this.model = tf.sequential();
        
        // 输入层 + 第一个隐藏层
        this.model.add(tf.layers.dense({
            units: 256,
            activation: 'relu',
            inputShape: [inputSize],
            kernelInitializer: 'glorotUniform'
        }));
        this.model.add(tf.layers.batchNormalization());
        this.model.add(tf.layers.dropout({ rate: 0.4 }));

        // 第二个隐藏层
        this.model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
        }));
        this.model.add(tf.layers.batchNormalization());
        this.model.add(tf.layers.dropout({ rate: 0.3 }));

        // 第三个隐藏层
        this.model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
        }));
        this.model.add(tf.layers.dropout({ rate: 0.2 }));

        // 输出层
        this.model.add(tf.layers.dense({
            units: numClasses,
            activation: 'softmax'
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return this.model;
    }

    /**
     * 生成训练数据
     * 基于手势规则生成模拟样本
     */
    generateTrainingData() {
        const datasets = [];
        const labels = [];
        const samplesPerGesture = 80;

        for (let i = 0; i < this.gestures.length; i++) {
            const gesture = this.gestures[i];
            const samples = this.generateGestureSamples(gesture, samplesPerGesture);
            datasets.push(...samples);
            labels.push(...Array(samples.length).fill(i));
        }

        return { datasets, labels };
    }

    /**
     * 为单个手势生成样本
     */
    generateGestureSamples(gesture, count) {
        const samples = [];
        const basePattern = this.getGesturePattern(gesture);
        
        for (let i = 0; i < count; i++) {
            const sample = this.generateVariedSample(basePattern, gesture);
            samples.push(sample);
        }
        
        return samples;
    }

    /**
     * 获取手势的基础特征模式
     */
    getGesturePattern(gesture) {
        const word = gesture.word;
        const pinyin = gesture.pinyin;
        const category = gesture.category;

        // 基于词汇特征生成手势模式
        let pattern = {
            fingers: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
            handShape: 'neutral',
            orientation: 'front',
            movement: 'static'
        };

        // 数字手势
        if (category === '数字') {
            switch (word) {
                case '一': pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 }; break;
                case '二': pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 }; break;
                case '三': pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 1, pinky: 0 }; break;
                case '四': pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 1, pinky: 1 }; break;
                case '五': pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }; break;
                case '六': pattern.fingers = { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1 }; break;
                case '七': pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 }; break;
                case '八': pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 }; break;
                case '九': pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 1 }; break;
                case '十': pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }; break;
            }
        }
        // 基础词汇
        else if (category === '基础') {
            switch (word) {
                case '你':
                case '他':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'side';
                    break;
                case '我':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'self';
                    break;
                case '好':
                    pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 };
                    break;
                case '是':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'horizontal';
                    break;
                case '不':
                    pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 };
                    break;
                case '谢谢':
                case '请':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'forward';
                    break;
                case '对不起':
                    pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
                    pattern.handShape = 'flat';
                    break;
                case '帮助':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'up';
                    break;
                case '朋友':
                    pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 };
                    pattern.handShape = 'pinch';
                    break;
                case '爱':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'chest';
                    break;
                case '喜欢':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'tap';
                    break;
                case '学习':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'flip';
                    break;
                case '工作':
                    pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
                    pattern.handShape = 'fist';
                    pattern.movement = 'up_down';
                    break;
                case '老师':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.orientation = 'forehead';
                    break;
                case '学生':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.handShape = 'book';
                    break;
            }
        }
        // 动作类
        else if (category === '动作') {
            switch (word) {
                case '吃':
                case '喝':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.handShape = 'curve';
                    pattern.movement = 'mouth';
                    break;
                case '走':
                case '跑':
                    pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 };
                    pattern.movement = 'walk';
                    break;
                case '看':
                case '听':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.orientation = 'face';
                    break;
                case '睡觉':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'cheek';
                    break;
                case '打电话':
                    pattern.fingers = { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1 };
                    pattern.orientation = 'ear';
                    break;
                case '打开':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'spread';
                    break;
                case '来':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'come';
                    break;
                case '去':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'go';
                    break;
                case '给':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'give';
                    break;
                case '找':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'search';
                    break;
                default:
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
            }
        }
        // 形容词
        else if (category === '形容词') {
            switch (word) {
                case '大':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'expand';
                    break;
                case '小':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'shrink';
                    break;
                case '高':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'up';
                    break;
                case '快':
                case '慢':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = word === '快' ? 'fast' : 'slow';
                    break;
                case '好':
                    pattern.fingers = { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0 };
                    break;
                case '漂亮':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'chin';
                    break;
                default:
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
            }
        }
        // 情绪
        else if (category === '情绪') {
            switch (word) {
                case '高兴':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'wave';
                    break;
                case '生气':
                case '害怕':
                    pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
                    pattern.handShape = 'fist';
                    pattern.movement = 'shake';
                    break;
                case '难过':
                    pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
                    pattern.handShape = 'fist';
                    pattern.movement = 'down';
                    break;
                case '累':
                    pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'hang';
                    break;
                default:
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
            }
        }
        // 疑问词
        else if (category === '疑问') {
            pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 1 };
            pattern.movement = 'wiggle';
        }
        // 疑问词-什么
        else if (word === '什么') {
            pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 };
            pattern.movement = 'twist';
        }
        // 疑问词-谁
        else if (word === '谁') {
            pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 1 };
            pattern.movement = 'point';
        }
        // 疑问词-怎么
        else if (word === '怎么') {
            pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
            pattern.movement = 'twist';
        }
        // 疑问词-为什么
        else if (word === '为什么') {
            pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
            pattern.orientation = 'temple';
            pattern.movement = 'twist';
        }
        // 物品类
        else if (category === '物品' || category === '场所') {
            switch (word) {
                case '手机':
                    pattern.fingers = { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1 };
                    pattern.orientation = 'ear';
                    break;
                case '电脑':
                    pattern.fingers = { thumb: 0, index: 1, middle: 1, ring: 0, pinky: 0 };
                    pattern.movement = 'tap';
                    break;
                case '水':
                    pattern.fingers = { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1 };
                    pattern.orientation = 'tilt';
                    break;
                case '钱':
                    pattern.fingers = { thumb: 1, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'rub';
                    break;
                case '医院':
                    pattern.fingers = { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'wrist_inner';
                    break;
                case '学校':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.handShape = 'book';
                    pattern.orientation = 'roof';
                    break;
                default:
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
            }
        }
        // 时间类
        else if (category === '时间') {
            pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
            pattern.orientation = 'wrist';
            switch (word) {
                case '现在':
                case '几点':
                case '时间':
                case '小时':
                case '分钟':
                    pattern.orientation = 'wrist';
                    break;
                case '早上':
                case '中午':
                case '晚上':
                    pattern.movement = 'sun_moon';
                    break;
                default:
                    pattern.movement = 'time';
            }
        }
        // 代词
        else if (category === '代词') {
            switch (word) {
                case '我们':
                case '他们':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.movement = 'plural';
                    break;
                case '自己':
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
                    pattern.orientation = 'chest';
                    break;
                case '大家':
                    pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
                    pattern.movement = 'spread';
                    break;
                case '别人':
                    pattern.fingers = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 1 };
                    break;
                default:
                    pattern.fingers = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 };
            }
        }
        // 默认
        else {
            pattern.fingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
        }

        return pattern;
    }

    /**
     * 生成带变化的样本
     */
    generateVariedSample(basePattern, gesture) {
        const landmarks = [];
        const baseX = 0.5;
        const baseY = 0.5;
        const noise = 0.03;

        // 生成21个关键点
        for (let i = 0; i < 21; i++) {
            let x = baseX + (Math.random() - 0.5) * noise;
            let y = baseY + (Math.random() - 0.5) * noise;

            // 根据手势模式调整关键点位置
            x = this.applyPatternToLandmark(x, i, basePattern, 'x');
            y = this.applyPatternToLandmark(y, i, basePattern, 'y');

            landmarks.push({ x, y });
        }

        // 归一化
        return this.normalizeLandmarks(landmarks);
    }

    /**
     * 根据手势模式调整关键点
     */
    applyPatternToLandmark(value, landmarkIndex, pattern, axis) {
        const fingers = {
            thumb: [1, 2, 3, 4],
            index: [5, 6, 7, 8],
            middle: [9, 10, 11, 12],
            ring: [13, 14, 15, 16],
            pinky: [17, 18, 19, 20]
        };

        // 拇指处理
        if (landmarkIndex >= 1 && landmarkIndex <= 4) {
            const fingerOffset = landmarkIndex - 1;
            if (pattern.fingers.thumb === 1) {
                // 拇指伸直
                const offset = axis === 'x' ? -0.25 : -0.15;
                value += offset + (fingerOffset * (axis === 'x' ? 0.03 : -0.08));
            } else {
                // 拇指弯曲
                const offset = axis === 'x' ? -0.1 : 0.05;
                value += offset + (fingerOffset * (axis === 'x' ? 0.02 : 0.02));
            }
        }

        // 其他手指处理
        for (const [fingerName, indices] of Object.entries(fingers)) {
            if (fingerName === 'thumb') continue;
            
            if (indices.includes(landmarkIndex)) {
                const fingerIdx = indices.indexOf(landmarkIndex);
                const fingerOffsets = {
                    index: axis === 'x' ? -0.15 : -0.05,
                    middle: axis === 'x' ? 0 : -0.05,
                    ring: axis === 'x' ? 0.15 : -0.05,
                    pinky: axis === 'x' ? 0.25 : -0.05
                };

                const offset = fingerOffsets[fingerName];

                if (pattern.fingers[fingerName] === 1) {
                    // 手指伸直
                    value += offset + (fingerIdx * (axis === 'x' ? 0.02 : -0.1));
                } else {
                    // 手指弯曲
                    value += offset + (fingerIdx * (axis === 'x' ? 0.02 : 0.03));
                }
            }
        }

        return Math.max(0, Math.min(1, value));
    }

    /**
     * 归一化关键点（相对于手腕）
     */
    normalizeLandmarks(landmarks) {
        const result = [];
        const wrist = landmarks[0];

        for (let i = 0; i < landmarks.length; i++) {
            result.push(landmarks[i].x - wrist.x);
            result.push(landmarks[i].y - wrist.y);
        }

        return result;
    }

    /**
     * 训练模型
     */
    async train(onProgress) {
        if (this.isTraining) return;
        this.isTraining = true;
        this.onProgress = onProgress;
        const totalEpochs = 30;

        try {
            // 初始化模型
            await this.initModel();

            // 生成训练数据
            const { datasets, labels } = this.generateTrainingData();

            const xs = tf.tensor2d(datasets);
            const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), this.gestures.length);

            // 训练 - 使用较少的epoch加快首次启动
            await this.model.fit(xs, ys, {
                epochs: totalEpochs,
                batchSize: 64,
                validationSplit: 0.2,
                verbose: 0,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (this.onProgress) {
                            const progress = ((epoch + 1) / totalEpochs) * 100;
                            // 兼容不同版本tf的字段名
                            const acc = logs.acc || logs.accuracy || 0;
                            const valAcc = logs.val_acc || logs.val_accuracy || 0;
                            this.onProgress({
                                epoch: epoch + 1,
                                totalEpochs: totalEpochs,
                                progress: progress,
                                loss: logs.loss || 0,
                                accuracy: acc,
                                valLoss: logs.val_loss || 0,
                                valAccuracy: valAcc
                            });
                        }
                    }
                }
            });

            // 清理张量
            xs.dispose();
            ys.dispose();

            this.isTraining = false;
            return this.model;

        } catch (error) {
            this.isTraining = false;
            console.error('训练模型失败:', error);
            throw error;
        }
    }

    /**
     * 识别手势
     */
    recognize(landmarks) {
        if (!this.model) {
            return { word: '', confidence: 0, category: '' };
        }

        try {
            const normalized = this.normalizeLandmarks(landmarks);
            const input = tf.tensor2d([normalized]);
            const predictions = this.model.predict(input);
            const values = predictions.dataSync();

            input.dispose();
            predictions.dispose();

            // 找到最高置信度
            let maxIndex = 0;
            let maxValue = values[0];

            for (let i = 1; i < values.length; i++) {
                if (values[i] > maxValue) {
                    maxValue = values[i];
                    maxIndex = i;
                }
            }

            const gesture = this.gestures[maxIndex];

            return {
                word: gesture.word,
                pinyin: gesture.pinyin,
                category: gesture.category,
                description: gesture.description,
                confidence: maxValue
            };

        } catch (error) {
            console.error('识别错误:', error);
            return { word: '', confidence: 0, category: '' };
        }
    }

    /**
     * 保存模型
     */
    async saveModel() {
        if (!this.model) return;
        await this.model.save('localstorage://csl-gesture-model-v2');
    }

    /**
     * 加载已保存的模型
     * @returns {boolean} 是否成功加载
     */
    async loadModel() {
        try {
            this.model = await tf.loadLayersModel('localstorage://csl-gesture-model-v2');
            return true;
        } catch (error) {
            // 第一次运行时没有保存的模型，这是正常情况，无需报错
            console.log('未找到已保存的模型，将开始训练新模型');
            return false;
        }
    }
}

// 导出
window.CSLGestureModel = CSLGestureModel;
