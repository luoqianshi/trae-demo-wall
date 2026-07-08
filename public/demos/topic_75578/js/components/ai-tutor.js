/**
 * 学智云学习平台 - AI辅导组件
 */

const AiTutorComponent = {
    chatMessages: [],

    /**
     * 渲染AI辅导页面
     * @returns {string} HTML字符串
     */
    render() {
        return `
            <div class="ai-tutor-container">
                <!-- 拍照搜题区域 -->
                <div class="photo-upload">
                    <h3>拍照搜题</h3>
                    <div class="upload-area" onclick="AiTutorComponent.handleUpload()">
                        <i class="el-icon-camera upload-icon"></i>
                        <p class="upload-text">点击或拖拽上传题目图片</p>
                        <p class="upload-hint">支持 JPG、PNG 格式，大小不超过 5MB</p>
                    </div>
                    <input type="file" id="photoInput" accept="image/*" style="display: none;">
                </div>

                <!-- AI对话区域 -->
                <div class="chat-container">
                    <div class="chat-header">
                        <i class="el-icon-chat-dot-round"></i>
                        <span>AI智能问答</span>
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <div class="message ai">
                            <p>你好！我是学智云AI辅导助手，有什么问题可以帮助你？</p>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="chatInput" placeholder="输入你的问题..." placeholder="输入你的问题...">
                        <button onclick="AiTutorComponent.sendMessage()">
                            <i class="el-icon-s-promotion"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 处理图片上传
     */
    handleUpload() {
        const input = document.getElementById('photoInput');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // 模拟上传处理
                Helpers.showLoading(true, '正在识别题目...');
                
                setTimeout(() => {
                    const result = API.aiPhotoSearch(file.name);
                    Helpers.showLoading(false);
                    
                    if (result.success) {
                        this.addMessage('user', `已上传图片：${file.name}`);
                        this.addMessage('ai', `识别结果：${result.question}<br>答案：${result.answer}<br>解析：${result.explanation}`);
                    }
                }, 1500);
            }
        };
        input.click();
    },

    /**
     * 发送消息
     */
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) {
            Helpers.showMessage('请输入问题', 'warning');
            return;
        }

        // 添加用户消息
        this.addMessage('user', message);
        input.value = '';

        // 获取AI回复
        Helpers.showLoading(true, 'AI正在思考...');
        
        setTimeout(() => {
            const result = API.aiChat(message);
            Helpers.showLoading(false);
            
            if (result.success) {
                this.addMessage('ai', result.answer);
            }
        }, 1000);
    },

    /**
     * 添加消息到聊天窗口
     * @param {string} type - 消息类型（user/ai）
     * @param {string} content - 消息内容
     */
    addMessage(type, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `<p>${content}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};

window.AiTutorComponent = AiTutorComponent;