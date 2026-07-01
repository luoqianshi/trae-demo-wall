// 加载页面
var loadingAnimId = null;
var currentFact = 0;
var MathFunFacts = [
    // === 算术与数列 ===
    '1 + 2 + 3 + ... + 100 = 5050，高斯10岁就发现了这个规律！',
    '1 + 2 + 3 + ... + n = n×(n+1)÷2，这就是三角形数公式',
    '1³ + 2³ + 3³ + 4³ = (1+2+3+4)² = 100，立方和与平方和的巧合',
    '2¹⁰ = 1024，所以1KB = 1024字节',
    '8¹ = 8, 8²=64, 8³=512, 8⁴=4096... 神奇的8的幂',
    '1×1=1, 11×11=121, 111×111=12321, 1111×1111=1234321',
    '142857 × 2 = 285714，这是一个循环数！',
    '12345679 × 9 = 111111111，缺8数的神奇之处',
    '37 × 3 = 111, 37 × 6 = 222, 37 × 9 = 333... 37的规律',
    '2025 = 45²，也是 (20+25)²，神奇的卡普列加数',
    '最小的一位数是1，不是0哦！',
    '9 × 9 + 7 = 88, 98 × 9 + 6 = 888, 987 × 9 + 5 = 8888',
    '任何一个两位数，减去它的数字之和，都能被9整除',
    '任何整数乘以9，各位数字之和最终都会变成9',
    '中国剩余定理：一个数除以3余2，除以5余3，除以7余2，这个数是23',

    // === 几何与图形 ===
    '圆周率 π ≈ 3.1415926535... 无限不循环小数',
    '黄金比例 φ ≈ 1.6180339887... 达芬奇用它创作了蒙娜丽莎',
    '勾股定理: 3² + 4² = 5², 也叫"商高定理"，中国古人的发现',
    '勾股数 (5,12,13) 也是整数解：5²+12²=13²',
    '莫比乌斯环只有一个面，一只蚂蚁可以爬遍整个环！',
    '正六边形是最省材料的结构，蜂窝就是正六边形',
    '三角形最稳固，所以桥梁和塔吊都用三角形结构',
    '正多面体只有5种：正四面体、立方体、正八面体、正十二面体、正二十面体',
    '圆的周长 = π × 直径，这是古人早就发现的', 
    '圆柱体积 = πr²h，阿基米德最骄傲的公式之一',
    '斐波那契数列: 1,1,2,3,5,8,13,21,34,55... 大自然中的黄金数列',
    '鹦鹉螺的壳、向日葵的种子、松果的螺纹都符合斐波那契数列',
    'π的近似值22/7 ≈ 3.1429，古人用这个分数计算',
    'π的近似值355/113 ≈ 3.1415929，精确到小数点后6位！',

    // === 逻辑与思维 ===
    '四色定理：任何地图只需要4种颜色，就能让相邻区域颜色不同',
    '鸽巢原理：5个苹果放入4个抽屉，至少有一个抽屉有2个苹果',
    '七桥问题：哥尼斯堡的七座桥不能一次性不重复走完',
    '哥德尔不完备定理：总有一些数学命题既不能证明也不能证伪',
    '费马大定理：xⁿ+yⁿ=zⁿ当n>2时没有整数解，358年后才被证明',
    '黎曼猜想是数学界最重要的未解之谜之一，解决它可得100万美元！',
    '哥德巴赫猜想：任何大于2的偶数都可以写成两个质数之和',
    '六度分隔理论：世界上任何人之间最多通过6个人就能建立联系',
    '亏格0的多面体满足 V - E + F = 2（欧拉公式）',
    '拓扑学中，甜甜圈和咖啡杯是"一样"的形状！',

    // === 中国古代数学 ===
    '祖冲之将π精确到3.1415926，领先世界1000年！',
    '《九章算术》是世界上最古老的数学著作之一',
    '杨辉三角（帕斯卡三角）最早由南宋杨辉发现',
    '孙子算经中的"鸡兔同笼"已有1500多年历史',
    '中国古人用算筹计算，是世界上最早使用十进制计数',
    '刘徽用割圆术计算π，用96边形逼近圆',
    '秦九韶的"大衍求一术"是对一次同余方程组的最早解法',
    '珠算口诀"上五去四进一"是古人的计算智慧',

    // === 趣味数字 ===
    '最大的数是∞（无穷大），但无穷大也有不同的大小！',
    '自然数的个数 = 偶数的个数 = 整数的个数，都是无穷多',
    '0的阶乘：0! = 1，数学家们约定俗成的规定',
    '完全数：6 = 1+2+3, 28 = 1+2+4+7+14，因数之和等于本身',
    '质数有无限多个，欧几里得在2300年前就证明了',
    '2是最小的质数，也是唯一的偶质数',
    '回文数正着读和倒着读一样：12321, 45654',
    '五边形数：1,5,12,22,35... 每个数可以用五边形排列',
    '杨辉三角的第n行数字之和 = 2ⁿ⁻¹',
    '6174是一个神奇的数字：卡普雷卡常数',
    '数字 9 的任何倍数，各位相加最终都会回到 9',
    '拉马努金发现了许多神奇的数学公式，被称为"来自神的数学家"',

    // === 生活中的数学 ===
    '足球由12个正五边形和20个正六边形组成',
    '一年365天 ≈ π × 10⁷ 秒（约3140万秒）',
    '一张纸对折42次，厚度可以到达月球！',
    '国际象棋棋盘有64格，麦粒问题：1+2+4+8+...+2⁶³ 有多夸张？',
    '蜂巢角度109°28′，这是最省蜡的角度',
    '蜘蛛网的几何结构是最优的力学结构之一',
    '向日葵的花序旋转角度 137.5° 是黄金角',
    '所有雪花的对称轴都是6条，因为水的分子结构',
    '人体手臂长度比接近黄金比例 φ',
    '蒙娜丽莎的脸部比例完美符合黄金矩形',
    '骰子对面两点数之和为7：1对6, 2对5, 3对4',
    '闰年的规则：被4整除但不能被100整除，除非被400整除',
    '72法则：用72除以年利率，就能估算本金翻倍需要的年数'
];

function initLoadingScreen() {
    var hint = document.getElementById('math-hint');
    currentFact = Math.floor(Math.random() * MathFunFacts.length); // 随机起始
    
    function cycleFacts() {
        hint.textContent = '💡 ' + MathFunFacts[currentFact];
        currentFact = (currentFact + 1) % MathFunFacts.length;
    }
    
    cycleFacts();
    var factInterval = setInterval(cycleFacts, 3000);
    
    setTimeout(function() {
        clearInterval(factInterval);
        document.getElementById('start-btn').classList.add('visible');
    }, 4000);
}

function startGame() {
    if (window._gameStarted) return;
    window._gameStarted = true;
    
    document.getElementById('loading-screen').classList.add('hidden');
    initGame();
    GameState.isPlaying = true;
    updateEnergyHUD();
    updateHUD();
    updateNpcProgress();
    
    setTimeout(function() {
        showWelcomeToast();
        document.body.requestPointerLock();
    }, 500);
}

function updateEnergyHUD() {
    var pct = (GameState.energyShards / GameState.shardsNeeded) * 100;
    document.getElementById('energy-fill').style.width = pct + '%';
    document.getElementById('energy-text').textContent = GameState.energyShards + '/' + GameState.shardsNeeded;
}

function updateNpcProgress() {
    var gen = QGen[GradeConfig[GameState.currentGrade].gen];
    var npcNames = Object.keys(gen);
    var total = npcNames.length;
    var visited = 0;
    npcNames.forEach(function(name) {
        var key = name + '_' + GameState.currentGrade;
        if (GameState.npcCompleted[key]) visited++;
    });
    var totalEl = document.getElementById('npc-total');
    var visitedEl = document.getElementById('npc-visited');
    if (totalEl) totalEl.textContent = total;
    if (visitedEl) visitedEl.textContent = visited;
}

function showShardPopup() {
    var popup = document.getElementById('shard-popup');
    popup.classList.add('visible');
    setTimeout(function() { popup.classList.remove('visible'); }, 1500);
}

function showCollectibleHint(text) {
    var hint = document.getElementById('collectible-hint');
    hint.textContent = '💎 发现数学彩蛋：' + text;
    hint.classList.add('visible');
    setTimeout(function() { hint.classList.remove('visible'); }, 4000);
}

function showWelcomeToast() {
    // 防止重复创建
    if (window._welcomeToastShown) return;
    window._welcomeToastShown = true;
    
    // 清理可能残留的旧弹窗和监听器
    if (window._removeWelcomeToast) {
        window._removeWelcomeToast();
    }
    
    var toast = document.createElement('div');
    toast.id = 'welcome-toast';
    toast.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:3px solid #333;border-radius:20px;padding:30px 40px;text-align:center;z-index:600;box-shadow:8px 8px 0 rgba(0,0,0,0.1);font-family:Microsoft YaHei,sans-serif;';
    toast.innerHTML = '<div style="font-size:24px;font-weight:bold;color:#5DBDB6;margin-bottom:15px">🌍 欢迎来到数学星球！</div><div style="font-size:15px;color:#333;line-height:1.8">你是数学小使者，要收集能量碎片，<br>解决各大陆的数学问题，最终成为数学大师！<br><br><span style="color:#666;font-size:13px">WASD 移动 | 空格跳跃 | 鼠标控制视角<br>E 与导师对话 | C 更换装扮</span></div><div style="margin-top:20px;font-size:13px;color:#999">点击任意处继续</div>';
    document.body.appendChild(toast);
    
    function removeToast() {
        if (!toast.parentNode) return;
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 500);
        document.removeEventListener('click', removeToast);
        document.removeEventListener('keydown', removeToast);
        window._removeWelcomeToast = null;
        // 关闭弹窗后尝试获取鼠标锁定
        if (!GameState.questionOpen && !GameState.dialogueOpen && !GameState.levelComplete) {
            document.body.requestPointerLock();
        }
    }
    
    window._removeWelcomeToast = removeToast;
    
    setTimeout(function() {
        document.addEventListener('click', removeToast);
        document.addEventListener('keydown', removeToast);
    }, 100);
}

// ============================================================
// 对话系统
// ============================================================
function startDialogue(npc) {
    GameState.dialogueOpen = true;
    document.exitPointerLock();
    
    var npcName = npc.userData.name;
    var gradeName = GradeConfig[GameState.currentGrade].name;
    var npcKey = npcName + '_' + GameState.currentGrade;
    
    if (GameState.npcCompleted[npcKey]) {
        // 已经答完这个NPC
        var npcScore = GameState.npcScores[npcKey] || 0;
        GameState.dialogueQueue = [
            { speaker: npcName, text: '你真棒！上次你在我这里得了 ' + npcScore + ' 分。' },
            { speaker: npcName, text: '继续挑战其他导师吧，集齐所有能量碎片就能前往下一大陆！' }
        ];
    } else {
        GameState.dialogueQueue = [
            { speaker: npcName, text: '你好，数学小使者！欢迎来到' + gradeName + '。' },
            { speaker: npcName, text: '我是' + npcName + '，专门负责' + npc.userData.npcType + '的知识。' },
            { speaker: npcName, text: '准备好接受数学挑战了吗？答对题目可以获得能量碎片哦！' }
        ];
    }
    GameState.dialogueIndex = 0;
    
    showDialogueBox();
}

function showDialogueBox() {
    var box = document.getElementById('dialogue-box');
    var npcEl = document.getElementById('dialogue-npc');
    var textEl = document.getElementById('dialogue-text');
    
    var line = GameState.dialogueQueue[GameState.dialogueIndex];
    npcEl.textContent = line.speaker;
    textEl.textContent = line.text;
    
    box.classList.add('visible');
}

function nextDialogue() {
    GameState.dialogueIndex++;
    if (GameState.dialogueIndex >= GameState.dialogueQueue.length) {
        closeDialogue();
        var npcKey = nearbyNPC ? nearbyNPC.userData.name + '_' + GameState.currentGrade : '';
        if (nearbyNPC && !GameState.npcCompleted[npcKey]) {
            startQuestions(nearbyNPC);
        }
    } else {
        showDialogueBox();
    }
}

function closeDialogue() {
    document.getElementById('dialogue-box').classList.remove('visible');
    GameState.dialogueOpen = false;
    document.body.requestPointerLock();
}

// ============================================================
// 图形SVG生成（用于图形认知题目）
// ============================================================
function getShapeSVG(shape) {
    var size = 48;
    switch(shape) {
        case 'triangle':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="25,5 5,45 45,45" fill="#5DBDB6" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        case 'square':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><rect x="5" y="5" width="40" height="40" fill="#F5C542" stroke="#333" stroke-width="2.5" rx="2"/></svg>';
        case 'rectangle':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><rect x="3" y="10" width="44" height="30" fill="#E85D4E" stroke="#333" stroke-width="2.5" rx="2"/></svg>';
        case 'circle':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="#7CB342" stroke="#333" stroke-width="2.5"/></svg>';
        case 'diamond':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="25,3 47,25 25,47 3,25" fill="#FF8FAB" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        case 'trapezoid':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="12,10 38,10 47,40 3,40" fill="#64B5F6" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        case 'pentagon':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="25,3 47,18 39,43 11,43 3,18" fill="#FFB74D" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        case 'hexagon':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="25,3 45,14 45,36 25,47 5,36 5,14" fill="#CE93D8" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        case 'ellipse':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><ellipse cx="25" cy="25" rx="22" ry="14" fill="#4DB6AC" stroke="#333" stroke-width="2.5"/></svg>';
        case 'parallelogram':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="15,12 47,12 35,38 3,38" fill="#A1887F" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        case 'star':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><polygon points="25,2 31,18 48,18 34,28 39,45 25,35 11,45 16,28 2,18 19,18" fill="#FFD54F" stroke="#333" stroke-width="2" stroke-linejoin="round"/></svg>';
        case 'semicircle':
            return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 50 50"><path d="M5,30 A20,20 0 0,1 45,30 L5,30 Z" fill="#90CAF9" stroke="#333" stroke-width="2.5" stroke-linejoin="round"/></svg>';
        default:
            return shape;
    }
}

// ============================================================
// 答题系统
// ============================================================
function startQuestions(npc) {
    GameState.questionOpen = true;
    GameState.currentNPCIndex = npcs.indexOf(npc);
    window._currentQuestionNPC = npc;
    window._npcScoreBefore = GameState.score; // 记录答题前的分数
    GameState.answeredCount = 0; // 重置答题计数，每个NPC独立
    document.exitPointerLock();
    showQuestion(npc);
}

function showQuestion(npc) {
    if (GameState.answeredCount >= GameState.totalQuestions) {
        finishAllQuestions();
        return;
    }
    
    var gen = QGen[GradeConfig[GameState.currentGrade].gen];
    var npcType = npc.userData.npcType;
    var q = gen[npcType](GameState.answeredCount);
    
    var panel = document.getElementById('question-panel');
    document.getElementById('q-type').textContent = q.type;
    document.getElementById('q-count').textContent = (GameState.answeredCount + 1) + '/' + GameState.totalQuestions;
    document.getElementById('question-text').textContent = q.q;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('explanation-box').classList.remove('visible');
    
    var optsEl = document.getElementById('answer-options');
    optsEl.innerHTML = '';
    q.opts.forEach(function(opt) {
        var btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.gap = '8px';
        btn.style.padding = '12px 10px';
        if (q.isShape) {
            // 用 SVG 图形代替文字
            btn.innerHTML = getShapeSVG(opt);
            btn.style.flexDirection = 'column';
        } else {
            btn.textContent = opt;
        }
        btn.onclick = function() { checkAnswer(opt, q.a, btn, q.exp); };
        optsEl.appendChild(btn);
    });
    
    panel.classList.add('visible');
}

function checkAnswer(selected, correct, btn, explanation) {
    document.querySelectorAll('.answer-btn').forEach(function(b) { b.disabled = true; });
    var fb = document.getElementById('feedback');
    var expBox = document.getElementById('explanation-box');
    
    if (selected === correct) {
        btn.classList.add('correct');
        fb.textContent = '✓ 回答正确！+10分';
        fb.className = 'feedback correct';
        GameState.score += 10;
        GameState.answeredCount++;
        
        // 每答对2题给一个碎片（10题共5个碎片，2个NPC就能集满10个）
        if (GameState.answeredCount % 2 === 0 && GameState.energyShards < GameState.shardsNeeded) {
            GameState.energyShards++;
            updateEnergyHUD();
            showShardPopup();
        }
    } else {
        var shapeNames = {triangle:'三角形',square:'正方形',rectangle:'长方形',circle:'圆形',diamond:'菱形',trapezoid:'梯形',pentagon:'五边形',hexagon:'六边形',ellipse:'椭圆形',parallelogram:'平行四边形',star:'五角星',semicircle:'半圆形'};
        var displayCorrect = shapeNames[correct] || correct;
        btn.classList.add('wrong');
        fb.textContent = '✗ 回答错误，正确答案是 ' + displayCorrect;
        fb.className = 'feedback wrong';
        GameState.answeredCount++;
    }
    
    // 显示讲解
    if (explanation) {
        expBox.textContent = '💡 讲解：' + explanation;
        expBox.classList.add('visible');
    }
    
    updateHUD();
    
    // 如果有自定义事件，后续可以使用
    var npcRef = window._currentQuestionNPC;
    
    setTimeout(function() {
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';
        document.getElementById('explanation-box').classList.remove('visible');
        
        if (GameState.answeredCount >= GameState.totalQuestions) {
            document.getElementById('question-panel').classList.remove('visible');
            GameState.questionOpen = false;
            finishAllQuestions();
        } else {
            // 自动进入下一题
            if (npcRef) {
                showQuestion(npcRef);
            } else {
                document.getElementById('question-panel').classList.remove('visible');
                GameState.questionOpen = false;
                document.body.requestPointerLock();
            }
        }
    }, 2000);
}

function finishAllQuestions() {
    document.getElementById('question-panel').classList.remove('visible');
    GameState.questionOpen = false;
    
    // 标记当前NPC已完成
    var npc = window._currentQuestionNPC;
    if (npc) {
        var npcKey = npc.userData.name + '_' + GameState.currentGrade;
        var npcScore = GameState.score - (window._npcScoreBefore || 0);
        GameState.npcCompleted[npcKey] = true;
        GameState.npcScores[npcKey] = npcScore;
    }
    
    // 更新NPC进度显示
    updateNpcProgress();
    
    // 检查是否满足通关条件
    checkLevelComplete();
}

function checkLevelComplete() {
    var gen = QGen[GradeConfig[GameState.currentGrade].gen];
    var npcNames = Object.keys(gen);
    var totalNpc = npcNames.length;
    var completedNpc = 0;
    var totalPossibleScore = totalNpc * 10 * GameState.totalQuestions; // 每个NPC满分 = 10题×10分
    var requiredScore = Math.floor(totalPossibleScore * 0.1); // 需要10%的分数（测试用，正式改回0.8）
    
    npcNames.forEach(function(name) {
        var key = name + '_' + GameState.currentGrade;
        if (GameState.npcCompleted[key]) completedNpc++;
    });
    
    // 通关条件：所有NPC答完 + 积分达80% + 能量碎片集满
    if (completedNpc >= totalNpc && GameState.score >= requiredScore && GameState.energyShards >= GameState.shardsNeeded) {
        GameState.levelComplete = true;
        GameState.gradesCompleted[GameState.currentGrade] = true;
        showLevelComplete();
    } else {
        // 显示NPC完成提示
        showNpcCompleteToast(completedNpc, totalNpc, requiredScore);
    }
}

function showNpcCompleteToast(completed, total, required) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:3px solid #333;border-radius:20px;padding:25px 35px;text-align:center;z-index:600;box-shadow:8px 8px 0 rgba(0,0,0,0.1);font-family:Microsoft YaHei,sans-serif;max-width:400px;';
    
    var shardText = GameState.energyShards >= GameState.shardsNeeded ? '✅ 能量碎片已集满！' : '💎 能量碎片：' + GameState.energyShards + '/' + GameState.shardsNeeded;
    var scoreText = '当前得分：' + GameState.score + '（需要 ' + required + ' 分）';
    var npcText = '已完成导师：' + completed + '/' + total;
    
    toast.innerHTML = '<div style="font-size:20px;font-weight:bold;color:#5DBDB6;margin-bottom:12px">🎯 导师挑战完成！</div>' +
        '<div style="font-size:14px;color:#333;line-height:2">' + npcText + '<br>' + scoreText + '<br>' + shardText + '</div>' +
        '<div style="margin-top:15px;font-size:13px;color:#999">继续挑战其他导师吧！</div>';
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() { toast.remove(); }, 500);
    }, 2500);
}

function showLevelComplete() {
    var panel = document.getElementById('level-complete-panel');
    document.getElementById('complete-score').textContent = '本轮得分：' + GameState.score;
    document.getElementById('complete-grade').textContent = GradeConfig[GameState.currentGrade].name + ' 试炼完成！';
    
    var btn = document.getElementById('next-level-btn');
    if (GameState.currentGrade >= 5) {
        btn.textContent = '🎉 恭喜通关全部大陆！';
        btn.onclick = function() { alert('恭喜成为数学大师！最终得分：' + GameState.score); location.reload(); };
    } else {
        btn.textContent = '⛵ 坐船前往下一大陆';
        btn.onclick = function() { goNextLevel(); };
    }
    panel.classList.add('visible');
}

function updateHUD() {
    document.getElementById('score').textContent = GameState.score;
}

// ============================================================
// 坐船过场动画
// ============================================================
function goNextLevel() {
    document.getElementById('level-complete-panel').classList.remove('visible');
    document.exitPointerLock();
    
    var overlay = document.getElementById('transition-overlay');
    var canvas = document.getElementById('transition-canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    overlay.classList.add('active');
    
    var nextGrade = GameState.currentGrade + 1;
    var textEl = document.getElementById('transition-text');
    
    // 每个大陆用不同的数学函数曲线
    var curves = [
        { name: '正弦波 y = sin(x)', fn: function(t) { return Math.sin(t * Math.PI * 2); }, desc: '正弦波 sin(x)' },
        { name: '余弦波 y = cos(x)', fn: function(t) { return Math.cos(t * Math.PI * 2); }, desc: '余弦波 cos(x)' },
        { name: '抛物线 y = x²', fn: function(t) { var x = (t - 0.5) * 2; return x * x * 0.5; }, desc: '抛物线 x²' },
        { name: '心形线', fn: function(t) { return 0.5 * Math.sin(t * Math.PI * 2) * Math.abs(Math.cos(t * Math.PI * 3)); }, desc: '心形线' },
        { name: '螺旋线', fn: function(t) { return Math.sin(t * Math.PI * 4) * (1 - t * 0.5); }, desc: '衰减正弦波' },
        { name: '双曲正弦', fn: function(t) { var x = (t - 0.5) * 3; return Math.sinh(x) / Math.sinh(1.5) * 0.3; }, desc: '双曲正弦 sinh(x)' }
    ];
    var curve = curves[nextGrade % curves.length];
    
    var progress = 0;
    var duration = 6000;
    var startTime = Date.now();
    
    // 星星背景
    var stars = [];
    for (var i = 0; i < 60; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.5, r: Math.random() * 2 + 0.5, speed: Math.random() * 0.5 + 0.2 });
    }
    
    function drawTransition() {
        var elapsed = Date.now() - startTime;
        progress = Math.min(1, elapsed / duration);
        
        // 深空背景
        var skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#1a1a2e');
        skyGrad.addColorStop(0.4, '#16213e');
        skyGrad.addColorStop(0.7, '#0f3460');
        skyGrad.addColorStop(1, '#533483');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 星星
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            var twinkle = 0.5 + 0.5 * Math.sin(elapsed * 0.003 + i);
            ctx.fillStyle = 'rgba(255,255,255,' + (twinkle * 0.8) + ')';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * twinkle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制数学函数曲线（虚线轨迹）
        ctx.strokeStyle = 'rgba(93,189,182,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        for (var x = 0; x <= canvas.width; x += 3) {
            var t = x / canvas.width;
            var curveY = curve.fn(t);
            var py = canvas.height * 0.45 - curveY * canvas.height * 0.25;
            if (x === 0) ctx.moveTo(x, py);
            else ctx.lineTo(x, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 函数公式文字
        ctx.fillStyle = 'rgba(93,189,182,0.6)';
        ctx.font = '16px monospace';
        ctx.fillText('y = ' + curve.desc, 20, 30);
        
        // 出发星球（左边）
        var fromPlanetX = canvas.width * 0.12;
        var fromPlanetY = canvas.height * 0.5;
        var fromColor = GradeConfig[GameState.currentGrade].color;
        var fromR = parseInt(fromColor.toString(16).substring(0, 2), 16);
        var fromG = parseInt(fromColor.toString(16).substring(2, 4), 16);
        var fromB = parseInt(fromColor.toString(16).substring(4, 6), 16);
        
        // 星球光晕
        var glowGrad = ctx.createRadialGradient(fromPlanetX, fromPlanetY, 15, fromPlanetX, fromPlanetY, 50);
        glowGrad.addColorStop(0, 'rgba(' + fromR + ',' + fromG + ',' + fromB + ',0.3)');
        glowGrad.addColorStop(1, 'rgba(' + fromR + ',' + fromG + ',' + fromB + ',0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(fromPlanetX, fromPlanetY, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = fromColor;
        ctx.beginPath();
        ctx.arc(fromPlanetX, fromPlanetY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 目标星球（右边，逐渐出现）
        var toPlanetX = canvas.width * 0.88;
        var toPlanetY = canvas.height * 0.5;
        var toColor = GradeConfig[nextGrade].color;
        var toR = parseInt(toColor.toString(16).substring(0, 2), 16);
        var toG = parseInt(toColor.toString(16).substring(2, 4), 16);
        var toB = parseInt(toColor.toString(16).substring(4, 6), 16);
        var toAlpha = Math.min(1, progress * 2);
        
        var toGlow = ctx.createRadialGradient(toPlanetX, toPlanetY, 15, toPlanetX, toPlanetY, 50);
        toGlow.addColorStop(0, 'rgba(' + toR + ',' + toG + ',' + toB + ',' + (0.3 * toAlpha) + ')');
        toGlow.addColorStop(1, 'rgba(' + toR + ',' + toG + ',' + toB + ',0)');
        ctx.fillStyle = toGlow;
        ctx.beginPath();
        ctx.arc(toPlanetX, toPlanetY, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(' + toR + ',' + toG + ',' + toB + ',' + toAlpha + ')';
        ctx.beginPath();
        ctx.arc(toPlanetX, toPlanetY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 * toAlpha) + ')';
        ctx.stroke();
        
        // 飞船沿函数曲线飞行
        var shipT = Math.min(progress * 1.1, 1); // 稍微超前完成
        var shipX = fromPlanetX + shipT * (toPlanetX - fromPlanetX);
        var shipCurveT = shipT;
        var shipCurveY = curve.fn(shipCurveT);
        var shipY = canvas.height * 0.45 - shipCurveY * canvas.height * 0.25;
        
        // 飞船尾焰（粒子效果）
        for (var p = 0; p < 5; p++) {
            var trailT = Math.max(0, shipT - 0.02 * (p + 1));
            var trailX = fromPlanetX + trailT * (toPlanetX - fromPlanetX);
            var trailY = canvas.height * 0.45 - curve.fn(trailT) * canvas.height * 0.25;
            var trailAlpha = (1 - p / 5) * 0.5;
            var trailSize = (5 - p) * 2;
            ctx.fillStyle = 'rgba(245,197,66,' + trailAlpha + ')';
            ctx.beginPath();
            ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 飞船本体
        ctx.save();
        ctx.translate(shipX, shipY);
        
        // 计算飞行方向
        var nextT = Math.min(1, shipT + 0.01);
        var nextX = fromPlanetX + nextT * (toPlanetX - fromPlanetX);
        var nextY = canvas.height * 0.45 - curve.fn(nextT) * canvas.height * 0.25;
        var angle = Math.atan2(nextY - shipY, nextX - shipX);
        ctx.rotate(angle);
        
        // 火箭主体
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 火焰
        var flameLen = 8 + Math.sin(elapsed * 0.02) * 4;
        ctx.fillStyle = '#F5C542';
        ctx.beginPath();
        ctx.moveTo(-5, -4);
        ctx.lineTo(-5 - flameLen, 0);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#E85D4E';
        ctx.beginPath();
        ctx.moveTo(-5, -2);
        ctx.lineTo(-5 - flameLen * 0.6, 0);
        ctx.lineTo(-5, 2);
        ctx.closePath();
        ctx.fill();
        
        // 窗户
        ctx.fillStyle = '#5DBDB6';
        ctx.beginPath();
        ctx.arc(5, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
        
        // 飞行路径上的数学知识小贴士
        if (progress > 0.1 && progress < 0.9) {
            var mathTips = [
                '正弦函数描述了波浪的运动规律',
                '余弦函数和正弦函数只差一个相位',
                '抛物线是物体抛出后的运动轨迹',
                '心形线的方程包含三角函数',
                '衰减波在自然界中随处可见',
                '双曲函数在桥梁设计中很重要',
                'π 是圆周率，约等于 3.14159',
                '黄金比例 φ ≈ 1.618，无处不在',
                '斐波那契数列：1,1,2,3,5,8,13...',
                '欧拉公式 e^(iπ) + 1 = 0 被称为最美公式'
            ];
            var tipIndex = Math.floor(progress * mathTips.length) % mathTips.length;
            
            textEl.innerHTML = '🚀 飞船沿 <span style="color:#F5C542;font-weight:bold">' + curve.desc + '</span> 飞行中...<br>' +
                '<span style="font-size:16px;color:rgba(255,255,255,0.7)">💡 ' + mathTips[tipIndex] + '</span><br>' +
                '<span style="font-size:14px;color:rgba(255,255,255,0.5)">正在前往 ' + GradeConfig[nextGrade].name + '</span>';
            textEl.classList.add('visible');
        } else {
            textEl.classList.remove('visible');
        }
        
        if (progress < 1) {
            requestAnimationFrame(drawTransition);
        } else {
            overlay.classList.remove('active');
            GameState.currentGrade = nextGrade;
            GameState.answeredCount = 0;
            GameState.score = 0;
            GameState.levelComplete = false;
            GameState.energyShards = 0;
            // 重置NPC通关追踪
            GameState.npcCompleted = {};
            GameState.npcScores = {};
            
            document.getElementById('current-grade').textContent = GradeConfig[nextGrade].name;
            spawnNPCs(nextGrade);
            spawnShards(nextGrade);
            spawnCollectibles(nextGrade);
            
            // 传送玩家到新大陆
            var newLatRange = getGradeLatRange(nextGrade);
            var newLat = (newLatRange.min + newLatRange.max) / 2;
            var newPos = latLonToVector(newLat, 0, PLANET_RADIUS + 1.5);
            player.position.copy(newPos);
            player.lookAt(new THREE.Vector3(0, 0, 0));
            player.rotateX(-Math.PI / 2);
            
            // 同步物理体位置
            if (playerBody) {
                playerBody.position.set(player.position.x, player.position.y, player.position.z);
                playerBody.velocity.set(0, 0, 0);
            }
            
            updateEnergyHUD();
            updateHUD();
            updateNpcProgress();
            
            document.body.requestPointerLock();
        }
    }
    drawTransition();
}

// ============================================================
// 角色自定义
// ============================================================
function openCustomize() {
    document.exitPointerLock();
    var panel = document.getElementById('customize-panel');
    
    // 发型选项
    var hairOpts = document.getElementById('hair-options');
    hairOpts.innerHTML = '';
    ['圆帽', '鸭舌帽', '礼帽', '无帽'].forEach(function(h, i) {
        var btn = document.createElement('span');
        btn.className = 'customize-opt' + (GameState.playerStyle.hair === i ? ' active' : '');
        btn.textContent = h;
        btn.onclick = function() { setHair(i); };
        hairOpts.appendChild(btn);
    });
    
    // 衣服选项
    var clothesOpts = document.getElementById('clothes-options');
    clothesOpts.innerHTML = '';
    ['青色', '红色', '绿色', '紫色', '黄色'].forEach(function(c, i) {
        var btn = document.createElement('span');
        btn.className = 'customize-opt' + (GameState.playerStyle.clothes === i ? ' active' : '');
        btn.textContent = c;
        btn.onclick = function() { setClothes(i); };
        clothesOpts.appendChild(btn);
    });
    
    // 背包选项
    var bagOpts = document.getElementById('bag-options');
    bagOpts.innerHTML = '';
    ['黄色', '红色', '蓝色', '绿色'].forEach(function(b, i) {
        var btn = document.createElement('span');
        btn.className = 'customize-opt' + (GameState.playerStyle.bag === i ? ' active' : '');
        btn.textContent = b;
        btn.onclick = function() { setBag(i); };
        bagOpts.appendChild(btn);
    });
    
    panel.classList.add('visible');
}

function setHair(index) {
    GameState.playerStyle.hair = index;
    var hat = player.getObjectByName('hat');
    if (hat) {
        if (index === 3) { hat.visible = false; }
        else {
            hat.visible = true;
            var colors = [0x5DBDB6, 0xE85D4E, 0x7CB342, COLORS.shard];
            var color = colors[index] || colors[0];
            // 帽子是 Group，需要遍历子 Mesh 修改材质颜色
            hat.children.forEach(function(child) {
                if (child.material && child.material.color) {
                    child.material.color.setHex(color);
                }
            });
        }
    }
    openCustomize(); // 刷新UI
}

function setClothes(index) {
    GameState.playerStyle.clothes = index;
    var body = player.children[0];
    if (body) {
        var colors = [0x5DBDB6, 0xE85D4E, 0x7CB342, 0xBA68C8, 0xFFD54F];
        body.material.color.setHex(colors[index]);
    }
    openCustomize();
}

function setBag(index) {
    GameState.playerStyle.bag = index;
    var bag = player.getObjectByName('bag');
    if (bag) {
        var colors = [COLORS.shard, 0xE85D4E, 0x5DBDB6, 0x7CB342];
        bag.material.color.setHex(colors[index]);
    }
    openCustomize();
}

function closeCustomize() {
    document.getElementById('customize-panel').classList.remove('visible');
    document.body.requestPointerLock();
}

// ============================================================
// 移动端控制
// ============================================================
function initMobileControls() {
    document.getElementById('mobile-controls').style.display = 'block';
    
    var touchMap = {
        'btn-up': 'ArrowUp', 'btn-down': 'ArrowDown',
        'btn-left': 'ArrowLeft', 'btn-right': 'ArrowRight',
        'btn-action': 'KeyE'
    };
    
    Object.keys(touchMap).forEach(function(id) {
        var btn = document.getElementById(id);
        btn.addEventListener('touchstart', function(e) { e.preventDefault(); keys[touchMap[id]] = true; });
        btn.addEventListener('touchend', function(e) { e.preventDefault(); keys[touchMap[id]] = false; });
    });
}
