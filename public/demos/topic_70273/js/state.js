// 状态管理模块

const AppState = {
    // 当前步骤 (0-5)
    currentStep: 0,
    
    // 蚕丝颜色
    silkColor: null,
    
    // 绒毛形状
    furShape: null,
    
    // 花瓣位置数组
    petals: [],
    
    // 叶子位置数组
    leaves: [],
    
    // 花朵是否已放置到花枝
    flowerPlaced: false,
    
    // 是否完成
    isComplete: false,
    
    // 步骤总数
    totalSteps: 6,
    
    // 初始化状态
    init() {
        this.currentStep = 0;
        this.silkColor = null;
        this.furShape = null;
        this.petals = [];
        this.leaves = [];
        this.flowerPlaced = false;
        this.isComplete = false;
    },
    
    // 设置当前步骤
    setStep(step) {
        if (step >= 0 && step < this.totalSteps) {
            this.currentStep = step;
            this.notifyStepChange();
        }
    },
    
    // 进入下一步
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.notifyStepChange();
        }
    },
    
    // 设置蚕丝颜色
    setSilkColor(color) {
        this.silkColor = color;
    },
    
    // 设置绒毛形状
    setFurShape(shape) {
        this.furShape = shape;
    },
    
    // 添加花瓣
    addPetal(petal) {
        this.petals.push(petal);
    },
    
    // 添加叶子
    addLeaf(leaf) {
        this.leaves.push(leaf);
    },
    
    // 标记花朵已放置
    setFlowerPlaced() {
        this.flowerPlaced = true;
    },
    
    // 检查第四步是否完成（花朵+叶子都放置）
    isStep4Complete() {
        return this.flowerPlaced && this.leaves.length >= 2;
    },
    
    // 标记完成
    setComplete() {
        this.isComplete = true;
    },
    
    // 步骤变化通知
    notifyStepChange() {
        const event = new CustomEvent('stepChange', {
            detail: {
                step: this.currentStep,
                total: this.totalSteps
            }
        });
        document.dispatchEvent(event);
    },
    
    // 获取当前状态快照
    getSnapshot() {
        return {
            currentStep: this.currentStep,
            silkColor: this.silkColor,
            furShape: this.furShape,
            petals: [...this.petals],
            leaves: [...this.leaves],
            isComplete: this.isComplete
        };
    }
};

// 导出状态管理器
window.AppState = AppState;
