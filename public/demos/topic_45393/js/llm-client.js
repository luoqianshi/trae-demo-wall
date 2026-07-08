/**
 * LLM 客户端模块
 * 预留 LLM 调用接口，当前使用模拟数据
 */

const LLMClient = {
    // 配置
    config: {
        apiKey: '',
        apiUrl: '',
        model: ''
    },

    // 设置配置
    setConfig(config) {
        this.config = { ...this.config, ...config };
    },

    // 分析食物（预留接口）
    async analyzeFood(foodInput, targets) {
        // TODO: 接入真实 LLM API
        // 当前返回模拟数据
        console.log('分析食物:', foodInput, targets);
        
        // 模拟延迟
        await this.delay(1000);
        
        // 返回模拟分析结果
        return this.mockAnalyze(foodInput, targets);
    },

    // 识别图片中的食物（预留接口）
    async recognizeFood(imageBase64) {
        // TODO: 接入视觉 LLM API
        console.log('识别图片', imageBase64 ? '(base64 长度:' + imageBase64.length + ')' : '(空)');

        await this.delay(1500);

        // mock 偶发错误路径（演示降级，默认关闭，需要演示时可手动改为 true）
        const MOCK_FAIL = false;
        if (MOCK_FAIL) {
            throw new Error('mock 识别失败');
        }

        // 返回模拟识别结果
        return {
            foods: ['虾滑', '牛肉卷', '青菜', '啤酒'],
            confidence: 0.85
        };
    },

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 模拟分析数据
    mockAnalyze(foodInput, targets) {
        const foods = this.parseFoods(foodInput);
        
        return foods.map(food => ({
            food: food,
            icon: this.getFoodIcon(food),
            results: targets.map(target => this.mockPersonResult(food, target))
        }));
    },

    // 解析食物输入
    parseFoods(input) {
        if (typeof input === 'string') {
            return input.split(/[,，、]/).map(f => f.trim()).filter(Boolean);
        }
        if (input.foods) {
            return input.foods;
        }
        return [];
    },

    // 获取食物图标
    getFoodIcon(food) {
        const icons = {
            '虾滑': '🍤',
            '牛肉卷': '🥩',
            '青菜': '🥬',
            '啤酒': '🍺',
            '红烧肉': '🍖',
            '清蒸鱼': '🐟',
            '白米饭': '🍚',
            '番茄炒蛋': '🍅',
            '牛肉面': '🍜',
            '奶茶': '🧋',
            '炸鸡': '🍗',
            '盖饭': '🍛'
        };
        return icons[food] || '🍽️';
    },

    // 模拟个人分析结果
    mockPersonResult(food, person) {
        // 根据食物和人员指标生成模拟结果
        const riskLevel = this.calculateRisk(food, person);
        
        return {
            personId: person.id,
            personName: person.name,
            riskLevel: riskLevel.level,
            riskLabel: riskLevel.label,
            impact: riskLevel.impact,
            suggestion: riskLevel.suggestion,
            reading: this.generateReading(person.name, food, riskLevel)
        };
    },

    // 计算风险等级
    calculateRisk(food, person) {
        const risks = {
            '虾滑': {
                highUric: { level: 'avoid', label: '尽量避免食用', impact: '嘌呤高，易加重尿酸', suggestion: '建议换成鸡肉丸或蔬菜丸' },
                highLipid: { level: 'caution', label: '谨慎食用', impact: '胆固醇偏高', suggestion: '建议不超过3个' },
                normal: { level: 'safe', label: '可以食用', impact: '富含优质蛋白', suggestion: '正常食用即可' }
            },
            '牛肉卷': {
                highUric: { level: 'caution', label: '谨慎食用', impact: '红肉嘌呤中等', suggestion: '建议3-5片，午餐吃更合适' },
                highLipid: { level: 'caution', label: '谨慎食用', impact: '脂肪含量较高', suggestion: '建议不超过3片' },
                normal: { level: 'safe', label: '可以食用', impact: '富含铁质', suggestion: '正常食用即可' }
            },
            '青菜': {
                default: { level: 'recommend', label: '推荐食用', impact: '富含纤维，对肠胃好', suggestion: '可以多吃' }
            },
            '啤酒': {
                highUric: { level: 'avoid', label: '尽量避免食用', impact: '嘌呤高，易加重尿酸', suggestion: '建议换成无糖气泡水或淡茶' },
                highBloodPressure: { level: 'avoid', label: '尽量避免食用', impact: '酒精会升高血压', suggestion: '建议换成无糖茶' },
                normal: { level: 'caution', label: '谨慎食用', impact: '热量较高', suggestion: '建议少量' }
            },
            '红烧肉': {
                highLipid: { level: 'avoid', label: '尽量避免食用', impact: '脂肪含量高', suggestion: '建议换成清蒸鱼或鸡胸肉' },
                highGlucose: { level: 'caution', label: '谨慎食用', impact: '糖分较高', suggestion: '建议少量，搭配青菜' },
                normal: { level: 'caution', label: '谨慎食用', impact: '热量较高', suggestion: '建议适量' }
            },
            '清蒸鱼': {
                default: { level: 'recommend', label: '推荐食用', impact: '优质蛋白，低脂肪', suggestion: '可以多吃' }
            },
            '白米饭': {
                highGlucose: { level: 'caution', label: '谨慎食用', impact: '升糖指数高', suggestion: '建议控制分量，搭配杂粮' },
                normal: { level: 'safe', label: '可以食用', impact: '主食来源', suggestion: '正常食用即可' }
            }
        };

        const foodRisk = risks[food];
        if (!foodRisk) {
            return { level: 'safe', label: '可以食用', impact: '一般食物，无明显风险', suggestion: '正常食用即可' };
        }

        // 指标检查顺序：先匹配 high（原逻辑），再匹配 high-normal（偏高，保守降级）
        const checks = [
            { value: person.uricAcid, key: 'highUric' },
            { value: person.lipid, key: 'highLipid' },
            { value: person.glucose, key: 'highGlucose' },
            { value: person.bloodPressure, key: 'highBloodPressure' }
        ];

        // 高：走原分支
        for (const check of checks) {
            if (check.value === 'high' && foodRisk[check.key]) {
                return foodRisk[check.key];
            }
        }

        // 偏高：保守原则，avoid 降级为 caution，其他保持
        for (const check of checks) {
            if (check.value === 'high-normal' && foodRisk[check.key]) {
                const original = foodRisk[check.key];
                if (original.level === 'avoid') {
                    return {
                        level: 'caution',
                        label: '谨慎食用',
                        impact: original.impact,
                        suggestion: original.suggestion
                    };
                }
                return original;
            }
        }

        return foodRisk.default || foodRisk.normal || { level: 'safe', label: '可以食用', impact: '一般食物，无明显风险', suggestion: '正常食用即可' };
    },

    // 生成朗读文本
    generateReading(name, food, risk) {
        const level = risk.level;
        const impact = risk.impact;
        const suggestion = risk.suggestion;

        switch (level) {
            case 'avoid':
                return `${name}需要注意，${food}${impact}，尽量避免食用，${suggestion}。`;
            case 'caution':
                return `${name}需要注意，${food}${impact}，谨慎食用，${suggestion}。`;
            case 'safe':
                return `${name}可以正常吃${food}，${impact}，${suggestion}。`;
            case 'recommend':
                return `${name}推荐食用${food}，${impact}，${suggestion}。`;
            default:
                return `${name}可以食用${food}，${suggestion}。`;
        }
    }
};
