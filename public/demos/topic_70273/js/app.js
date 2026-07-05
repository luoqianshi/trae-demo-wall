// 主应用入口模块

const App = {
    // 初始化应用
    init() {
        console.log('非遗绒花·指尖上的AI工作坊 - 初始化');
        
        // 初始化状态
        AppState.init();
        
        // 初始化语音助手
        VoiceAssistant.init();
        
        // 初始化粒子系统
        ParticleSystem.init();
        
        // 初始化拖拽管理器
        DragManager.init();
        
        // 初始化Canvas渲染器
        CanvasRenderer.initFinishedFlower();
        
        // 绑定事件监听
        this.bindEvents();
        
        // 显示第一步
        this.showStep(0);
        
        // 播放欢迎语音
        setTimeout(() => {
            VoiceAssistant.speakStep('welcome');
        }, 500);
    },
    
    // 绑定事件监听
    bindEvents() {
        // 开始按钮
        document.getElementById('btnStart').addEventListener('click', () => {
            this.nextStep();
        });
        
        // 重新制作按钮
        document.getElementById('btnRestart').addEventListener('click', () => {
            this.restart();
        });
        
        // 分享作品按钮
        document.getElementById('btnShare').addEventListener('click', () => {
            this.shareWork();
        });
        
        // 步骤变化事件
        document.addEventListener('stepChange', (e) => {
            this.updateProgress(e.detail.step);
        });
        
        // 蚕丝染色事件
        document.addEventListener('silkDyed', (e) => {
            this.handleSilkDyed(e.detail);
        });
        
        // 花瓣放置事件
        document.addEventListener('petalPlaced', (e) => {
            this.handlePetalPlaced(e.detail);
        });
        
        // 花朵放置事件
        document.addEventListener('flowerPlaced', (e) => {
            this.handleFlowerPlaced(e.detail);
        });
        
        // 叶子放置事件
        document.addEventListener('leafPlaced', (e) => {
            this.handleLeafPlaced(e.detail);
        });
        
        // 形状选择
        document.querySelectorAll('.shape-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const shape = e.currentTarget.dataset.shape;
                this.handleShapeSelected(shape);
            });
        });
        
        // 剪刀拖到绒毛上
        document.addEventListener('scissorsOnFur', () => {
            this.handleScissorsOnFur();
        });
    },
    
    // 显示指定步骤
    showStep(stepIndex) {
        // 隐藏所有步骤
        document.querySelectorAll('.step').forEach(step => {
            step.classList.add('hidden');
        });
        
        // 显示当前步骤
        const steps = [
            'step-welcome',
            'step-dyeing',
            'step-shaping',
            'step-assembling',
            'step-completing',
            'step-finished'
        ];
        
        const currentStepEl = document.getElementById(steps[stepIndex]);
        if (currentStepEl) {
            currentStepEl.classList.remove('hidden');
        }
        
        // 进入第二步时，绒毛使用第一步选择的颜色
        if (stepIndex === 2 && AppState.silkColor) {
            const fur = document.getElementById('fur');
            fur.style.background = AppState.silkColor;
        }
        
        // 进入第三步时动态生成花瓣和槽位
        if (stepIndex === 3) {
            this.generatePetals();
        }
        
        // 进入第四步时，花朵头使用第二步选择的形状和颜色
        if (stepIndex === 4) {
            this.updateFlowerHead();
        }
        
        // 更新进度
        this.updateProgress(stepIndex);
        
        // 播放对应步骤的语音
        const stepNames = ['welcome', 'step1', 'step2', 'step3', 'step4', 'finish'];
        setTimeout(() => {
            VoiceAssistant.speakStep(stepNames[stepIndex]);
        }, 300);
    },
    
    // 动态生成花瓣和槽位
    generatePetals() {
        const petalSlots = document.getElementById('petalSlots');
        const petalsContainer = document.getElementById('petalsContainer');
        
        // 清空
        petalSlots.innerHTML = '';
        petalsContainer.innerHTML = '';
        
        const petalCount = 8;
        const radius = 80;
        const containerSize = 240;
        const center = containerSize / 2; // 120
        const slotSize = 40;
        const color = AppState.silkColor || '#c8553d';
        const shape = AppState.furShape || 'round';
        
        for (let i = 0; i < petalCount; i++) {
            // 创建槽位
            const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
            const x = center + Math.cos(angle) * radius - slotSize / 2;
            const y = center + Math.sin(angle) * radius - slotSize / 2;
            
            const slot = document.createElement('div');
            slot.className = 'petal-slot';
            slot.dataset.index = i;
            slot.style.left = x + 'px';
            slot.style.top = y + 'px';
            petalSlots.appendChild(slot);
            
            // 创建花瓣，应用第二步选择的形状
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.background = color;
            petal.dataset.index = i;
            
            if (shape === 'round') {
                petal.style.borderRadius = '50%';
            } else if (shape === 'pointed') {
                petal.style.borderRadius = '50% 50% 50% 0';
                petal.style.transform = 'rotate(-45deg)';
            } else if (shape === 'wavy') {
                petal.style.borderRadius = '50%';
                petal.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            }
            
            petalsContainer.appendChild(petal);
        }
        
        // 重新绑定拖拽事件（动态生成的花瓣需要 interact.js 绑定）
        DragManager.reinit();
        // 花瓣槽位是动态生成的，需要重新设置 dropzone
        DragManager.setupPetalSlotDropzones();
    },
    
    // 更新花朵头的形状和颜色
    updateFlowerHead() {
        const flowerHead = document.getElementById('flowerHead');
        if (!flowerHead) return;

        const color = AppState.silkColor || '#c8553d';
        const shape = AppState.furShape || 'round';

        // 背景透明，让花瓣可见
        flowerHead.style.background = 'transparent';
        flowerHead.style.boxShadow = 'none';
        flowerHead.className = 'flower-head';
        flowerHead.style.overflow = 'visible';

        // 清除之前的花瓣和花蕊
        flowerHead.querySelectorAll('.mini-petal, .mini-pistil').forEach(p => p.remove());

        // 创建花瓣，围成一圈，延伸到圆外
        const petalCount = 8;
        const radius = 35; // 距离中心的半径

        for (let i = 0; i < petalCount; i++) {
            const petal = document.createElement('div');
            petal.className = 'mini-petal';
            petal.style.position = 'absolute';
            petal.style.width = '26px';
            petal.style.height = '38px';
            petal.style.background = color;

            const angle = (i / petalCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // 定位花瓣中心到计算位置
            petal.style.left = `calc(50% + ${x}px - 13px)`;
            petal.style.top = `calc(50% + ${y}px - 19px)`;
            // 旋转花瓣使其朝外
            petal.style.transform = `rotate(${angle * 180 / Math.PI + 90}deg)`;

            // 应用形状
            if (shape === 'round') {
                petal.style.borderRadius = '50%';
            } else if (shape === 'pointed') {
                petal.style.borderRadius = '50% 50% 50% 0';
            } else if (shape === 'wavy') {
                petal.style.borderRadius = '50%';
                petal.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            }

            flowerHead.appendChild(petal);
        }

        // 添加花蕊（中心金色圆点）
        const pistil = document.createElement('div');
        pistil.className = 'mini-pistil';
        pistil.style.position = 'absolute';
        pistil.style.top = '50%';
        pistil.style.left = '50%';
        pistil.style.transform = 'translate(-50%, -50%)';
        pistil.style.width = '24px';
        pistil.style.height = '24px';
        pistil.style.background = '#e8b84a';
        pistil.style.borderRadius = '50%';
        pistil.style.zIndex = '5';
        pistil.style.boxShadow = '0 0 6px rgba(232, 184, 74, 0.6)';
        flowerHead.appendChild(pistil);
    },
    
    // 进入下一步
    nextStep() {
        AppState.nextStep();
        this.showStep(AppState.currentStep);
    },
    
    // 更新进度指示器
    updateProgress(stepIndex) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index < stepIndex) {
                step.classList.add('completed');
            } else if (index === stepIndex) {
                step.classList.add('active');
            }
        });
    },
    
    // 处理蚕丝染色
    handleSilkDyed(detail) {
        const { color, colorName } = detail;
        
        // 更新状态
        AppState.setSilkColor(color);
        
        // 添加染色动画
        const silk = document.getElementById('silk');
        silk.style.background = color;
        silk.classList.add('dyeing');
        
        setTimeout(() => {
            silk.classList.remove('dyeing');
            this.nextStep();
        }, 800);
    },
    
    // 处理形状选择（仅高亮选中，不直接跳转）
    handleShapeSelected(shape) {
        AppState._selectedShape = shape;
        // 立即设置furShape，确保后续步骤能使用
        AppState.setFurShape(shape);
        
        // 高亮选中的形状选项
        document.querySelectorAll('.shape-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelector(`.shape-option[data-shape="${shape}"]`).classList.add('selected');
        
        // 提示用户拖剪刀
        VoiceAssistant.speak('好，选好了。现在拿起剪刀，拖到绒毛上修剪一下。');
    },
    
    // 处理剪刀拖到绒毛上
    handleScissorsOnFur() {
        const shape = AppState._selectedShape;
        if (!shape) {
            VoiceAssistant.speak('先选一个形状，再用剪刀修剪哦。');
            return;
        }
        
        AppState.setFurShape(shape);
        
        const fur = document.getElementById('fur');
        fur.className = 'fur';
        fur.classList.add(`shape-${shape}`);
        fur.classList.add('changing');
        
        const scissors = document.getElementById('scissors');
        scissors.classList.add('cutting');
        
        setTimeout(() => {
            fur.classList.remove('changing');
            scissors.classList.remove('cutting');
            this.nextStep();
        }, 800);
    },
    
    // 处理花瓣放置
    handlePetalPlaced(detail) {
        const { slot, petal } = detail;
        
        // 标记槽位已填充，复制花瓣的形状样式
        slot.classList.add('filled');
        slot.style.background = petal.style.background || '#c8553d';
        
        // 复制形状样式（borderRadius、clipPath、transform）
        if (petal.style.borderRadius) {
            slot.style.borderRadius = petal.style.borderRadius;
        }
        if (petal.style.clipPath) {
            slot.style.clipPath = petal.style.clipPath;
        }
        if (petal.style.transform && petal.style.transform !== 'none') {
            slot.style.transform = petal.style.transform;
        }
        
        // 隐藏原花瓣
        petal.style.display = 'none';
        
        // 记录花瓣
        AppState.addPetal({ slot: slot.dataset.index });
        
        // 检查是否所有花瓣都已放置
        const totalSlots = document.querySelectorAll('.petal-slot').length;
        const filledSlots = document.querySelectorAll('.petal-slot.filled').length;
        
        if (filledSlots === totalSlots) {
            setTimeout(() => {
                this.nextStep();
            }, 500);
        }
    },
    
    // 处理花朵放置
    handleFlowerPlaced(detail) {
        const { flower } = detail;

        // 隐藏原花朵
        flower.style.display = 'none';

        // 在枝干顶部显示花朵
        const dropZone = document.getElementById('flowerDropZone');
        dropZone.innerHTML = '';
        dropZone.style.border = 'none';
        dropZone.style.background = 'transparent';

        // 用一个简单的花朵图代替 clone（避免 clone 丢失样式）
        const color = AppState.silkColor || '#c8553d';
        const shape = AppState.furShape || 'round';

        // 创建花朵容器
        const flowerEl = document.createElement('div');
        flowerEl.style.cssText = 'position:relative; width:80px; height:80px; margin:0 auto;';

        // 8个花瓣围绕中心
        const petalCount = 8;
        const radius = 35;
        for (let i = 0; i < petalCount; i++) {
            const petal = document.createElement('div');
            const angle = (i / petalCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            petal.style.cssText = `position:absolute; width:26px; height:38px; background:${color};`;
            petal.style.left = `calc(50% + ${x}px - 13px)`;
            petal.style.top = `calc(50% + ${y}px - 19px)`;
            petal.style.transform = `rotate(${angle * 180 / Math.PI + 90}deg)`;

            if (shape === 'round') {
                petal.style.borderRadius = '50%';
            } else if (shape === 'pointed') {
                petal.style.borderRadius = '50% 50% 50% 0';
            } else if (shape === 'wavy') {
                petal.style.borderRadius = '50%';
                petal.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            }
            flowerEl.appendChild(petal);
        }

        // 花蕊
        const pistil = document.createElement('div');
        pistil.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:24px; height:24px; background:#e8b84a; border-radius:50%; box-shadow:0 0 6px rgba(232,184,74,0.6); z-index:5;';
        flowerEl.appendChild(pistil);

        dropZone.appendChild(flowerEl);

        // 标记花朵已放置
        AppState.setFlowerPlaced();

        // 检查是否花朵和叶子都已放置
        if (AppState.isStep4Complete()) {
            setTimeout(() => {
                this.completeFlower();
            }, 600);
        }
    },

    // 处理叶子放置
    handleLeafPlaced(detail) {
        const { leaf } = detail;

        // 隐藏原叶子
        leaf.style.display = 'none';

        // 记录叶子
        AppState.addLeaf({ id: leaf.id });

        // 在枝干上显示叶子
        const dropZone = document.getElementById('leavesDropZone');

        // 只清除提示文字，保留已放置的叶子
        const hint = dropZone.querySelector('.drop-hint');
        if (hint) hint.remove();
        dropZone.style.border = 'none';
        dropZone.style.background = 'transparent';

        // 创建叶子（使用 SVG 绘制真实叶子形状）
        const placedCount = AppState.leaves.length;
        const leafEl = document.createElement('div');
        leafEl.style.cssText = 'position:absolute; font-size:32px; cursor:default;';
        leafEl.textContent = '🍃';

        if (placedCount === 1) {
            // 第一片叶子在左侧
            leafEl.style.left = '0';
            leafEl.style.top = '10px';
            leafEl.style.transform = 'rotate(-30deg)';
        } else {
            // 第二片叶子在右侧
            leafEl.style.right = '0';
            leafEl.style.top = '40px';
            leafEl.style.transform = 'rotate(30deg) scaleX(-1)';
        }

        dropZone.appendChild(leafEl);

        // 检查花朵和叶子是否都已放置
        if (AppState.isStep4Complete()) {
            setTimeout(() => {
                this.completeFlower();
            }, 600);
        }
    },
    
    // 完成绒花
    completeFlower() {
        AppState.setComplete();
        
        // 绘制成品
        CanvasRenderer.drawFinishedFlower();
        
        // 进入下一步
        this.nextStep();
    },
    
    // 重新开始
    restart() {
        // 重置状态
        AppState.init();
        
        // 重置UI
        const silk = document.getElementById('silk');
        silk.style.background = 'white';
        
        const fur = document.getElementById('fur');
        fur.className = 'fur';
        
        // 重置花瓣
        document.querySelectorAll('.petal-slot').forEach(slot => {
            slot.classList.remove('filled');
            slot.style.background = '';
        });
        
        document.querySelectorAll('.petal').forEach(petal => {
            petal.style.display = 'block';
        });
        
        // 重置花朵和叶子
        document.getElementById('flowerHead').style.display = 'block';
        document.querySelectorAll('.leaf').forEach(leaf => {
            leaf.style.display = 'block';
        });
        
        // 重置放置区域
        const flowerDropZone = document.getElementById('flowerDropZone');
        flowerDropZone.innerHTML = '<div class="drop-hint">将花朵拖到这里</div>';
        flowerDropZone.style.border = '2px dashed #e8dcc8';
        
        const leavesDropZone = document.getElementById('leavesDropZone');
        leavesDropZone.innerHTML = '<div class="drop-hint">将叶子拖到这里</div>';
        leavesDropZone.style.border = '2px dashed #e8dcc8';
        
        // 显示第一步
        this.showStep(0);
    },
    
    // 分享作品
    shareWork() {
        CanvasRenderer.exportAsImage();
        
        // 显示提示
        VoiceAssistant.speak('作品已保存，快分享给朋友吧！');
    }
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出应用
window.App = App;
