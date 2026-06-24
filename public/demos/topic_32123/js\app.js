/**
 * TRAE DevFlow Demo - 主应用逻辑
 * 串联所有模块：聊天、流水线、Agent、记忆、规则
 */

// ==========================================
// 预设任务模板
// ==========================================
const TaskTemplates = {
    'flask-api': '帮我写一个Python Flask REST API，包含用户注册登录（JWT认证）和文章CRUD接口',
    'todo-app': '创建一个待办事项管理App，支持添加/删除/完成待办，使用Vue3前端 + Express后端',
    'blog-system': '搭建一个完整的博客系统后端，包括用户认证、文章管理、评论功能，使用Node.js + MongoDB',
    'crawler': '写一个Python数据爬虫，爬取指定网站的文章标题和内容，保存到本地JSON文件'
};

// ==========================================
// 模拟代码生成结果
// ==========================================
const CodeTemplates = {
    default: `<span class="comment"># === TRAE DevFlow 自动生成的代码 ===</span>
<span class="comment"># 任务: {task_description}</span>
<span class="comment"># 生成时间: {timestamp}</span>
<span class="comment"># Agent: Coder-1, Coder-2 (并行协作)</span>

<span class="keyword">from</span> flask <span class="keyword">import</span> Flask, request, jsonify
<span class="keyword">from</span> flask_sqlalchemy <span class="keyword">import</span> SQLAlchemy
<span class="keyword">from</span> werkzeug.security <span class="keyword">import</span> generate_password_hash, check_password_hash
<span class="keyword">import</span> jwt
<span class="keyword">import</span> datetime

<span class="decorator">@app.route(<span class="string">'/api/register'</span>, methods=[<span class="string">'POST'</span>])</span>
<span class="keyword">def</span> <span class="function">register</span>():
    <span class="string">"""用户注册接口"""</span>
    data = request.get_json()
    
    <span class="comment"># 参数校验 (规则引擎: STYLE-001 已检查)</span>
    <span class="keyword">if not</span> data.get(<span class="string">'username'</span>) <span class="keyword">or not</span> data.get(<span class="string">'password'</span>):
        <span class="keyword">return</span> jsonify({<span class="string">'error'</span>: <span class="string">'缺少必填参数'</span>}), <span class="number">400</span>
    
    <span class="comment"># 密码哈希处理 (规则引擎: SEC-002 敏感信息已脱敏)</span>
    hashed_pw = generate_password_hash(data[<span class="string">'password'</span>])
    
    user = User(
        username=data[<span class="string">'username'</span>],
        password=hashed_pw,
        created_at=datetime.datetime.now()
    )
    
    db.session.add(user)
    db.session.commit()
    
    <span class="keyword">return</span> jsonify({
        <span class="string">'message'</span>: <span class="string">'注册成功'</span>,
        <span class="string">'user_id'</span>: user.id
    }), <span class="number">201</span>


<span class="decorator">@app.route(<span class="string">'/api/login'</span>, methods=[<span class="string">'POST'</span>])</span>
<span class="keyword">def</span> <span class="function">login</span>():
    <span class="string">"""JWT登录认证接口"""</span>
    data = request.get_json()
    user = User.query.filter_by(username=data[<span class="string">'username'</span>]).first()
    
    <span class="keyword">if not</span> user <span class="keyword">or not</span> check_password_hash(user.password, data[<span class="string">'password'</span>]):
        <span class="keyword">return</span> jsonify({<span class="string">'error'</span>: <span class="string">'用户名或密码错误'</span>}), <span class="number">401</span>
    
    <span class="comment"># 生成JWT Token (有效期24小时)</span>
    token = jwt.encode({
        <span class="string">'user_id'</span>: user.id,
        <span class="string">'exp'</span>: datetime.datetime.utcnow() + datetime.timedelta(hours=<span class="number">24</span>)
    }, app.config[<span class="string">'SECRET_KEY'</span>])
    
    <span class="keyword">return</span> jsonify({<span class="string">'token'</span>: token, <span class="string">'user_id'</span>: user.id})


<span class="decorator">@app.route(<span class="string">'/api/articles'</span>, methods=[<span class="string">'GET'</span>, <span class="string">'POST'</span>])</span>
<span class="keyword">def</span> <span class="function">articles</span>():
    <span class="string">"""文章CRUD接口"""</span>
    <span class="keyword">if</span> request.method == <span class="string">'GET'</span>:
        page = request.args.get(<span class="string">'page'</span>, <span class="number">1</span>, type=<span class="class-name">int</span>)
        articles = Article.query.order_by(Article.created_at.desc())\\
            .paginate(page=page, per_page=<span class="number">10</span>)
        <span class="keyword">return</span> jsonify({
            <span class="string">'articles'</span>: [{<span class="string">'id'</span>: a.id, <span class="string">'title'</span>: a.title, 
                       <span class="string">'content'</span>: a.content[:<span class="number">200</span>]} <span class="keyword">for</span> a <span class="keyword">in</span> articles.items],
            <span class="string">'total'</span>: articles.total,
            <span class="string">'pages'</span>: articles.pages
        })
    
    <span class="keyword">elif</span> request.method == <span class="string">'POST'</span>:
        <span class="comment"># 创建新文章 (需要Token验证)</span>
        token = request.headers.get(<span class="string">'Authorization'</span>)
        <span class="keyword">if not</span> token:
            <span class="keyword">return</span> jsonify({<span class="string">'error'</span>: <span class="string">'未提供认证Token'</span>}), <span class="number">401</span>
        
        data = request.get_json()
        article = Article(
            title=data[<span class="string">'title'</span>],
            content=data[<span class="string">'content'</span>],
            author_id=<span class="function">get_current_user_id</span>(token),
            created_at=datetime.datetime.now()
        )
        db.session.add(article)
        db.session.commit()
        <span class="keyword">return</span> jsonify({<span class="string">'message'</span>: <span class="string">'文章创建成功'</span>, <span class="string">'id'</span>: article.id}), <span class="number">201</span>

<span class="comment"># === 测试覆盖率: 87% | 测试用例: 12个全部通过 ===</span>
<span class="comment"># === 规则检查: SEC-001通过 | SEC-002通过 | STYLE-001通过 ===</span>`
};

// ==========================================
// 应用状态
// ==========================================
let currentTaskId = null;
let timerInterval = null;
let elapsedSeconds = 0;
let totalTokens = 0;

// ==========================================
// 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化各模块UI
    window.pipelineEngine.initUI('pipelineFlow');
    window.agentManager.initUI('agentGrid');
    window.memorySystem.refreshSTMUI();
    window.memorySystem.refreshLTMUI();
    
    // 绑定事件
    _bindEvents();
    
    console.log('TRAE DevFlow Demo 初始化完成 ✓');
});

// ==========================================
// 事件绑定
// ==========================================
function _bindEvents() {
    // 发送按钮
    document.getElementById('sendBtn').addEventListener('click', handleSendTask);
    
    // 回车发送
    document.getElementById('taskInput').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendTask();
        }
    });
    
    // 快捷任务按钮
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskKey = btn.dataset.task;
            const template = TaskTemplates[taskKey];
            if (template) {
                document.getElementById('taskInput').value = template;
                document.getElementById('taskInput').focus();
            }
        });
    });
    
    // 输出标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
    
    // Modal关闭
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('resultModal').classList.remove('show');
    });
    
    document.getElementById('newTaskBtn').addEventListener('click', () => {
        document.getElementById('resultModal').classList.remove('show');
        resetAll();
    });
    
    document.getElementById('downloadBtn').addEventListener('click', () => {
        alert('Demo模式：实际环境中这里会触发产物ZIP下载\n包含：源码文件 + Docker镜像 + API文档 + Postman集合');
    });
}

// ==========================================
// 核心流程：发送任务
// ==========================================
async function handleSendTask() {
    const input = document.getElementById('taskInput');
    const message = input.value.trim();
    
    if (!message) {
        shakeElement(input);
        return;
    }
    
    // 禁用输入
    input.disabled = true;
    document.getElementById('sendBtn').disabled = true;
    
    // 生成任务ID
    currentTaskId = 'TASK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    document.getElementById('taskId').textContent = currentTaskId;
    
    // 添加用户消息到聊天
    addChatMessage('user', message);
    input.value = '';
    
    // 更新系统状态
    updateSystemStatus('running');
    
    // 开始计时
    startTimer();
    
    // 显示Bot正在处理
    setTimeout(() => {
        addChatMessage('bot', null, true);  // typing indicator
        
        // 记录到记忆系统
        window.memorySystem.addSTMEvent('USER_MESSAGE', message, 0.75);
        window.memorySystem.refreshSTMUI();
        
        // 启动流水线
        setTimeout(() => {
            removeTypingIndicator();
            addChatMessage('bot', `收到任务！正在启动多Agent流水线处理...\n\n&#128196; 任务ID: ${currentTaskId}\n&#128337; 预计耗时: 15-20秒`);
            
            startPipeline(message);
        }, 1500);
    }, 500);
}

// ==========================================
// 启动流水线
// ==========================================
async function startPipeline(taskDescription) {
    // 设置流水线回调
    window.pipelineEngine.onStageChange = async (stage, index, taskData) => {
        // 更新阶段详情
        updateStageDetail(stage, index, taskData);
        
        // 激活对应Agent
        await window.agentManager.activateForStage(stage.id, taskData);
        
        // 执行规则检查
        await window.rulesEngine.executeForStage(stage.id, taskData);
        
        // 记录阶段完成到STM
        window.memorySystem.addSTMEvent(
            'STAGE_COMPLETE', 
            `${stage.name}: ${stage.desc}`, 
            0.6 + Math.random() * 0.2
        );
        window.memorySystem.refreshSTMUI();
        
        // 累加Token消耗
        totalTokens += Math.floor(500 + Math.random() * 1500);
        document.getElementById('tokenCount').textContent = totalTokens.toLocaleString();
        
        // 在特定阶段更新代码输出
        if (stage.id === 'coded') {
            showCodeGeneration(taskData);
        }
        if (stage.id === 'tested') {
            appendCodeOutput(`<span class="comment">
# ✅ 自动化测试结果
# ================================
# 运行测试: python -m pytest tests/ -v
# 
# test_register.py::test_register_success ............ PASSED [  15%]
# test_login.py::test_login_success .................. PASSED [  30%]
# test_login.py::test_wrong_password ................. PASSED [  45%]
# test_articles.py::test_create_article .............. PASSED [  60%]
# test_articles.py::test_list_articles ............... PASSED [  75%]
# test_articles.py::test_delete_article .............. PASSED [  90%]
# test_auth.py::test_token_expiry ..................... PASSED [100%]
#
# ======== 8 passed in 2.34s ========
# 覆盖率: 87% | 分支覆盖: 82%</span>`);
        }
    };
    
    // 流水线完成回调
    window.pipelineEngine.onComplete = (durations) => {
        stopTimer();
        updateSystemStatus('success');
        
        // 最终Bot回复
        const totalTime = formatTime(elapsedSeconds);
        addChatMessage('bot', `
&#127881; **任务执行完成！**

&#128196; **任务ID**: ${currentTaskId}
&#128337; **总耗时**: ${totalTime}
&#128188; **Token消耗**: ${totalTokens.toLocaleString()}
&#9989; **测试**: 8个测试全部通过 (覆盖率87%)

**生成的文件:**
• \`app.py\` - 主应用入口 (347行)
• \`models.py\` - 数据模型 (89行)
• \`routes/\` - 路由模块 (256行)
• \`tests/\` - 测试套件 (423行)
• \`requirements.txt\` - 依赖清单
• \`Dockerfile\` - 容器配置

**下一步操作提示:**
\`\`\`bash
docker build -t my-api:v1.0 .
docker run -d -p 5000:5000 my-api:v1.0
\`\`\`
        `.trim());
        
        // 记录完成到记忆
        window.memorySystem.addSTMEvent('AGENT_RESPONSE', `任务${currentTaskId}完成，耗时${totalTime}`, 0.9);
        window.memorySystem.refreshSTMUI();
        
        // 显示结果弹窗
        showResultModal(durations, taskDescription);
        
        // 恢复输入
        document.getElementById('taskInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
    };
    
    // 开始执行
    await window.pipelineEngine.start(taskDescription);
}

// ==========================================
// UI辅助函数
// ==========================================

function addChatMessage(type, content, isTyping = false) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${type}-msg`;
    
    const avatarContent = type === 'user' ? '&#128100;' : '&#129302;';
    
    div.innerHTML = `
        <div class="msg-avatar">${avatarContent}</div>
        <div class="msg-content">
            ${isTyping ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : `<p>${content.replace(/\n/g, '</p><p>')}</p>`}
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.querySelector('.message.bot-msg .typing-indicator');
    if (typing) {
        typing.closest('.message').remove();
    }
}

function updateStageDetail(stage, index, taskData) {
    const detailEl = document.getElementById('stageDetail');
    const stageNum = index + 1;
    
    detailEl.innerHTML = `
        <div class="stage-info">
            <h4>${stage.icon} 阶段 ${stageNum}/12: ${stage.name}</h4>
            <div class="info-row">
                <span class="info-label">描述</span>
                <span class="info-value">${stage.desc}</span>
            </div>
            <div class="info-row">
                <span class="info-label">当前任务</span>
                <span class="info-value" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;">${taskData.substring(0, 50)}...</span>
            </div>
            <div class="info-row">
                <span class="info-label">参与Agent</span>
                <span class="info-value">${_getAgentsForStage(stage.id)}</span>
            </div>
        </div>
    `;
}

function _getAgentsForStage(stageId) {
    const map = {
        received: '-', analyzed: '分析师', dispatched: '分配器',
        designed: '架构师', coded: 'Coder#1 + Coder#2 (并行)',
        reviewed: '审查员', tested: '测试员', built: '构建员',
        deployed: '部署员', documented: '文档员', notified: '通知员', completed: '-'
    };
    return map[stageId] || '-';
}

function showCodeGeneration(taskDesc) {
    let code = CodeTemplates.default
        .replace('{task_description}', taskDesc)
        .replace('{timestamp}', new Date().toLocaleString());
    
    document.getElementById('codeOutput').innerHTML = code;
}

function appendCodeOutput(code) {
    const output = document.getElementById('codeOutput');
    output.innerHTML += '\n' + code;
}

function showResultModal(durations, taskDesc) {
    const modal = document.getElementById('resultModal');
    const body = document.getElementById('modalBody');
    
    const totalMs = Object.values(durations).reduce((a, b) => a + b, 0);
    const linesOfCode = Math.floor(800 + Math.random() * 400);
    
    body.innerHTML = `
        <div class="result-summary">
            <div class="result-stat">
                <div class="stat-label">总代码量</div>
                <div class="stat-val">${linesOfCode}行</div>
            </div>
            <div class="result-stat">
                <div class="stat-label">API接口数</div>
                <div class="stat-val">${Math.floor(8 + Math.random() * 10)}</div>
            </div>
            <div class="result-stat">
                <div class="stat-label">测试通过率</div>
                <div class="stat-val">100%</div>
            </div>
            <div class="result-stat">
                <div class="stat-label">构建耗时</div>
                <div class="stat-val">${(totalMs / 1000).toFixed(1)}s</div>
            </div>
        </div>
        <h4 style="margin-bottom:0.8rem;color:var(--accent);">&#128193; 生成的文件列表:</h4>
        <ul class="result-files">
            <li><span class="file-icon">&#128196;</span> app.py <span style="color:var(--gray-3);font-size:0.78rem;">(${Math.floor(linesOfCode*0.4)}行)</span></li>
            <li><span class="file-icon">&#128196;</span> models.py <span style="color:var(--gray-3);font-size:0.78rem;">(${Math.floor(linesOfCode*0.12)}行)</span></li>
            <li><span class="file-icon">&#128193;</span> routes/ <span style="color:var(--gray-3);font-size:0.78rem;">(3个路由模块)</span></li>
            <li><span class="file-icon">&#128187;</span> tests/ <span style="color:var(--gray-3);font-size:0.78rem;">(8个测试用例)</span></li>
            <li><span class="file-icon">&#128202;</span> requirements.txt</li>
            <li><span class="file-icon">&#128203;</span> Dockerfile</li>
            <li><span class="file-icon">&#128221;</span> README.md</li>
            <li><span class="file-icon">&#128218;</span> API文档(Swagger).json</li>
        </ul>
        <h4 style="margin:1rem 0 0.8rem;color:var(--accent);">&#128269; 规则引擎报告:</h4>
        <p style="font-size:0.85rem;color:var(--gray-1);">
            &#9989; SEC-001 危险命令检测: 通过<br>
            &#9989; SEC-002 敏感信息检测: 通过<br>
            &#9989; SEC-003 资源限制检查: 通过<br>
            &#9989; STYLE-001 代码风格: 通过<br>
            &#9989; TECH-001 技术栈约束: 通过<br>
            &#9989; USER-001 用户偏好: 已应用
        </p>
    `;
    
    modal.classList.add('show');
}

function updateSystemStatus(status) {
    const el = document.getElementById('systemStatus');
    el.textContent = { idle: '空闲', running: '运行中', success: '已完成', error: '出错' }[status];
    el.className = `value status-value ${status}`;
    
    const dot = document.querySelector('.nav-status .status-dot');
    if (dot) {
        dot.className = `status-dot ${status === 'running' ? 'busy' : status === 'success' || status === 'idle' ? 'online' : 'offline'}`;
    }
}

// ==========================================
// 计时器
// ==========================================
function startTimer() {
    elapsedSeconds = 0;
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        document.getElementById('elapsedTime').textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// ==========================================
// 重置
// ==========================================
function resetAll() {
    stopTimer();
    elapsedSeconds = 0;
    totalTokens = 0;
    currentTaskId = null;
    
    document.getElementById('taskId').textContent = '--';
    document.getElementById('elapsedTime').textContent = '00:00:00';
    document.getElementById('tokenCount').textContent = '0';
    
    window.pipelineEngine.reset();
    window.agentManager.resetAll();
    window.rulesEngine.clearLog();
    window.memorySystem.clearSTM();
    
    document.getElementById('codeOutput').innerHTML = '<span class="comment">// 生成完成后，代码将显示在这里...</span>';
    document.getElementById('stageDetail').innerHTML = '<div class="detail-placeholder">&#128197; 发送任务后，这里将显示各阶段的详细执行信息</div>';
    
    updateSystemStatus('idle');
}

// ==========================================
// 工具函数
// ==========================================
function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.5s ease';
}

// 添加shake动画
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);
