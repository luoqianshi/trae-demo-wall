// ===== 演示模式模块 =====

const Demo = {
    state: {
        isPlaying: false,
        currentStep: 0,
        speed: 1,
        caseId: null,
        timer: null,
        steps: [],
        onStepChange: null,
        onPlayStateChange: null,
        animationFrameId: null,
        startTime: null
    },
    
    STEP_TYPES: {
        INTRO: 'intro',
        EXTERNAL: 'external',
        QUESTION: 'question',
        TRANSITION: 'transition',
        REPORT: 'report'
    },
    
    DEFAULT_DEMO_SCORES: {
        'car-business': { direction: 2, certainty: 2, timing: 3, cost: 3 },
        'city-change': { direction: 3, certainty: 3, timing: 3, cost: 3 },
        'career-switch': { direction: 4, certainty: 4, timing: 3, cost: 3 }
    },
    
    init: function(caseId, options = {}) {
        this.state.caseId = caseId;
        this.state.speed = options.speed || 1;
        this.state.onStepChange = options.onStepChange || null;
        this.state.onPlayStateChange = options.onPlayStateChange || null;
        this.state.steps = this.generateSteps(caseId);
        this.state.currentStep = 0;
        this.state.isPlaying = false;
        
        if (this.state.timer) clearTimeout(this.state.timer);
        if (this.state.animationFrameId) cancelAnimationFrame(this.state.animationFrameId);
    },
    
    generateSteps: function(caseId) {
        const steps = [];
        const dimensionOrder = Cases.getDimensionOrder();
        const demoScores = this.DEFAULT_DEMO_SCORES[caseId] || this.DEFAULT_DEMO_SCORES.switchFDE;
        
        steps.push({
            type: this.STEP_TYPES.INTRO,
            duration: 2000,
            title: '决策体检开始',
            description: '让我们一起探索这个决策的内外校准过程',
            data: { caseId: caseId }
        });
        
        steps.push({
            type: this.STEP_TYPES.EXTERNAL,
            duration: 3000,
            title: '外部校准',
            description: '基于公开数据和政策文件，对外部环境进行客观评估',
            data: { caseId: caseId }
        });
        
        dimensionOrder.forEach((dim, index) => {
            steps.push({
                type: this.STEP_TYPES.QUESTION,
                duration: 2500,
                title: Cases.dimensionNames[dim],
                description: Cases.questions[dim].question,
                data: {
                    dimension: dim,
                    question: Cases.questions[dim],
                    answer: demoScores[dim],
                    order: index + 1,
                    total: dimensionOrder.length
                }
            });
        });
        
        steps.push({
            type: this.STEP_TYPES.TRANSITION,
            duration: 1500,
            title: '分析中...',
            description: '正在对比外部评估与内在感受，生成诊断报告',
            data: {}
        });
        
        steps.push({
            type: this.STEP_TYPES.REPORT,
            duration: 5000,
            title: '诊断报告',
            description: '内外差距分析与卡点诊断',
            data: { caseId: caseId, scores: demoScores }
        });
        
        return steps;
    },
    
    play: function() {
        if (this.state.isPlaying) return;
        
        this.state.isPlaying = true;
        this.state.startTime = performance.now();
        this.notifyPlayStateChange(true);
        this.executeStep(this.state.currentStep);
    },
    
    pause: function() {
        if (!this.state.isPlaying) return;
        
        this.state.isPlaying = false;
        this.notifyPlayStateChange(false);
        
        if (this.state.timer) {
            clearTimeout(this.state.timer);
            this.state.timer = null;
        }
        if (this.state.animationFrameId) {
            cancelAnimationFrame(this.state.animationFrameId);
            this.state.animationFrameId = null;
        }
    },
    
    stop: function() {
        this.pause();
        this.state.currentStep = 0;
        this.state.startTime = null;
        this.notifyStepChange(0);
    },
    
    stepForward: function() {
        if (this.state.currentStep < this.state.steps.length - 1) {
            this.pause();
            this.state.currentStep++;
            this.state.startTime = performance.now();
            this.notifyStepChange(this.state.currentStep);
            this.executeStep(this.state.currentStep);
        }
    },
    
    stepBackward: function() {
        if (this.state.currentStep > 0) {
            this.pause();
            this.state.currentStep--;
            this.state.startTime = performance.now();
            this.notifyStepChange(this.state.currentStep);
            this.executeStep(this.state.currentStep);
        }
    },
    
    setSpeed: function(speed) {
        this.state.speed = speed;
    },
    
    executeStep: function(stepIndex) {
        const step = this.state.steps[stepIndex];
        if (!step) return;
        
        const adjustedDuration = step.duration / this.state.speed;
        
        this.state.timer = setTimeout(() => {
            if (this.state.isPlaying && stepIndex < this.state.steps.length - 1) {
                this.state.currentStep++;
                this.state.startTime = performance.now();
                this.notifyStepChange(this.state.currentStep);
                this.executeStep(this.state.currentStep);
            } else if (!this.state.isPlaying) {
                this.notifyStepChange(this.state.currentStep);
            }
        }, adjustedDuration);
        
        this.notifyStepChange(stepIndex);
    },
    
    getCurrentStep: function() {
        return this.state.steps[this.state.currentStep] || null;
    },
    
    getTotalSteps: function() {
        return this.state.steps.length;
    },
    
    getProgress: function() {
        return (this.state.currentStep / (this.state.steps.length - 1)) * 100;
    },
    
    getStepProgress: function() {
        const step = this.state.steps[this.state.currentStep];
        if (!step || !this.state.startTime) return 0;
        
        const elapsed = performance.now() - this.state.startTime;
        const adjustedDuration = step.duration / this.state.speed;
        return Math.min(elapsed / adjustedDuration, 1) * 100;
    },
    
    canStepForward: function() {
        return this.state.currentStep < this.state.steps.length - 1;
    },
    
    canStepBackward: function() {
        return this.state.currentStep > 0;
    },
    
    isLastStep: function() {
        return this.state.currentStep === this.state.steps.length - 1;
    },
    
    isFirstStep: function() {
        return this.state.currentStep === 0;
    },
    
    getSteps: function() {
        return this.state.steps.map((step, index) => ({
            ...step,
            index: index,
            isCurrent: index === this.state.currentStep,
            isPast: index < this.state.currentStep,
            isFuture: index > this.state.currentStep
        }));
    },
    
    goToStep: function(index) {
        if (index < 0 || index >= this.state.steps.length) return;
        
        this.pause();
        this.state.currentStep = index;
        this.state.startTime = performance.now();
        this.notifyStepChange(this.state.currentStep);
        this.executeStep(this.state.currentStep);
    },
    
    notifyStepChange: function(index) {
        if (typeof this.state.onStepChange === 'function') {
            this.state.onStepChange({
                index: index,
                step: this.state.steps[index],
                progress: this.getProgress(),
                stepProgress: this.getStepProgress(),
                totalSteps: this.getTotalSteps(),
                isPlaying: this.state.isPlaying
            });
        }
    },
    
    notifyPlayStateChange: function(isPlaying) {
        if (typeof this.state.onPlayStateChange === 'function') {
            this.state.onPlayStateChange(isPlaying);
        }
    },
    
    getDemoScores: function(caseId) {
        return this.DEFAULT_DEMO_SCORES[caseId] || this.DEFAULT_DEMO_SCORES.switchFDE;
    },
    
    preloadResources: function(caseId) {
        const externalData = Cases.externalData[caseId];
        const demoScores = this.getDemoScores(caseId);
        
        return {
            externalData: externalData,
            demoScores: demoScores,
            diagnosis: Diagnosis.generateDiagnosis(externalData, demoScores)
        };
    },
    
    getConfig: function() {
        return {
            caseId: this.state.caseId,
            speed: this.state.speed,
            isPlaying: this.state.isPlaying,
            currentStep: this.state.currentStep,
            totalSteps: this.state.steps.length
        };
    },
    
    animateValue: function(element, start, end, duration, callback) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (end - start) * easeOut;
            
            if (callback) callback(currentValue, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    animateScore: function(elementId, targetScore, duration = 800) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.animateValue(element, 0, targetScore, duration, (value) => {
            element.textContent = value.toFixed(1);
        });
    },
    
    animateProgress: function(elementId, targetProgress, duration = 500) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.animateValue(element, parseFloat(element.style.width) || 0, targetProgress, duration, (value) => {
            element.style.width = `${value}%`;
        });
    },
    
    fadeIn: function(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    },
    
    fadeOut: function(element, duration = 300) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
        });
        
        return new Promise(resolve => setTimeout(resolve, duration));
    },
    
    slideInLeft: function(element, duration = 400) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-30px)';
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        });
    },
    
    slideInRight: function(element, duration = 400) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(30px)';
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        });
    },
    
    scaleIn: function(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.9)';
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
        });
    },
    
    pulseHighlight: function(element, duration = 1000) {
        element.style.animation = `highlight ${duration}ms ease`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },
    
    destroy: function() {
        this.stop();
        this.state = {
            isPlaying: false,
            currentStep: 0,
            speed: 1,
            caseId: null,
            timer: null,
            steps: [],
            onStepChange: null,
            onPlayStateChange: null,
            animationFrameId: null,
            startTime: null
        };
    }
};

window.Demo = Demo;