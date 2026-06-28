import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createUser, createConversation, createMessage } from './matching.js';
import { evaluateRating } from './ai-moderator.js';
export class ChatServer {
    clients = new Map();
    conversations = new Map();
    matchingPool = new Set();
    userConversations = new Map(); // userId -> conversationIds
    apiConfigs = new Map(); // userId -> apiConfig
    wss;
    constructor(server) {
        this.wss = new WebSocketServer({
            server,
            path: '/ws',
            verifyClient: (info, callback) => {
                console.log('WebSocket connection attempt from:', info.origin);
                callback(true);
            }
        });
        this.setupWebSocket();
    }
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('WebSocket connection established from:', req.socket.remoteAddress);
            const clientId = uuidv4();
            const user = createUser();
            this.clients.set(clientId, { ws, user });
            this.userConversations.set(user.id, []);
            // 发送注册信息
            const registerMsg = JSON.stringify({
                type: 'register',
                payload: { user }
            });
            ws.send(registerMsg);
            console.log('Sent register message to client:', clientId);
            ws.on('message', (data) => {
                console.log('Received message from client:', clientId, data.length, 'bytes');
                try {
                    const msg = JSON.parse(data);
                    this.handleMessage(clientId, msg);
                }
                catch (e) {
                    console.error('Failed to parse message:', e);
                }
            });
            ws.on('close', (code, reason) => {
                console.log('WebSocket connection closed:', clientId, 'code:', code, 'reason:', reason.toString());
                this.handleDisconnect(clientId);
            });
            ws.on('error', (error) => {
                console.error('WebSocket error for client:', clientId, error);
            });
        });
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled rejection at:', promise, 'reason:', reason);
        });
    }
    handleMessage(clientId, msg) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        switch (msg.type) {
            case 'match':
                this.handleMatch(clientId, msg.payload);
                break;
            case 'cancel_match':
                this.handleCancelMatch(clientId);
                break;
            case 'message':
                this.handleChatMessage(clientId, msg.payload);
                break;
            case 'update_profile':
                this.handleUpdateProfile(clientId, msg.payload);
                break;
            case 'exit':
                this.handleExit(clientId);
                break;
            case 'exit_confirm':
                this.handleExitConfirm(clientId, msg.payload);
                break;
            case 'rate':
                this.handleRate(clientId, msg.payload);
                break;
            case 'delete_conversation':
                this.handleDeleteConversation(clientId, msg.payload);
                break;
            case 'history':
                this.handleHistory(clientId);
                break;
            case 'view_history':
                this.handleViewHistory(clientId, msg.payload);
                break;
            case 'resume_conversation':
                this.handleResumeConversation(clientId, msg.payload);
                break;
            case 'update_api_config':
                this.handleUpdateAPIConfig(clientId, msg.payload);
                break;
            case 'user_info':
                this.handleUserInfo(clientId, msg.payload);
                break;
            case 'test_api_config':
                this.handleTestAPIConfig(clientId, msg.payload);
                break;
            case 'generate_title':
                this.handleGenerateTitle(clientId, msg.payload);
                break;
            case 'update_title':
                this.handleUpdateTitle(clientId, msg.payload);
                break;
        }
    }
    send(ws, type, payload) {
        ws.send(JSON.stringify({ type, payload }));
    }
    // 加入匹配池
    handleMatch(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        // 清理之前可能残留的AI对话状态
        if (clientInfo.matchedWith === 'ai') {
            clientInfo.matchedWith = undefined;
            clientInfo.conversationId = undefined;
        }
        if (payload.mode === 'ai') {
            // 创建与AI的对话
            this.createAIConversation(clientId);
        }
        else {
            // 加入随机匹配池
            this.matchingPool.add(clientId);
            this.send(clientInfo.ws, 'match', { status: 'waiting', message: '正在匹配中...' });
            // 尝试匹配
            this.tryMatch();
        }
    }
    // 取消匹配
    handleCancelMatch(clientId) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        this.matchingPool.delete(clientId);
        clientInfo.exitRequested = false;
        this.send(clientInfo.ws, 'cancel_match', { status: 'cancelled', message: '已取消匹配' });
    }
    // 更新API配置
    handleUpdateAPIConfig(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const config = {
            provider: payload.provider || 'custom',
            endpoint: (payload.endpoint || '').trim(),
            apiKey: (payload.apiKey || '').trim(),
            model: (payload.model || 'gpt-3.5-turbo').trim(),
            enabled: payload.enabled === true,
            triggerWord: (payload.triggerWord || '小助手').trim(),
        };
        this.apiConfigs.set(clientInfo.user.id, config);
        console.log(`[API Config] userId=${clientInfo.user.id}, enabled=${config.enabled}, provider=${config.provider}, endpoint=${config.endpoint}, model=${config.model}`);
        this.send(clientInfo.ws, 'api_config_updated', {
            success: true,
            config,
        });
    }
    // 自动补全端点 URL：如果路径不包含 /chat/completions 或 /messages，追加 /chat/completions
    normalizeEndpoint(endpoint) {
        try {
            const url = new URL(endpoint);
            if (!url.pathname.includes('/chat/completions') && !url.pathname.includes('/messages')) {
                return endpoint.replace(/\/+$/, '') + '/chat/completions';
            }
        }
        catch { /* invalid URL, return as-is */ }
        return endpoint;
    }
    // 测试API配置是否可用
    async handleTestAPIConfig(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        let { endpoint, apiKey, model } = payload;
        // 清理 API Key 中的空白字符
        apiKey = (apiKey || '').trim();
        endpoint = (endpoint || '').trim();
        if (!endpoint || !apiKey) {
            this.send(clientInfo.ws, 'api_config_tested', {
                success: false,
                message: '缺少 API 地址或 API Key',
            });
            return;
        }
        endpoint = this.normalizeEndpoint(endpoint);
        console.log(`[API Test] userId=${clientInfo.user.id}, endpoint=${endpoint}, model=${model}, keyPrefix=${apiKey.slice(0, 7)}...`);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'user', content: 'ping' }
                    ],
                    max_tokens: 5,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.log(`[API Test] FAILED: HTTP ${response.status} - ${errorText.slice(0, 200)}`);
                const statusMsg = response.status === 401 ? 'API Key 无效或已过期' :
                    response.status === 403 ? 'API Key 无权限' :
                        response.status === 404 ? '端点地址不存在' :
                            `HTTP ${response.status}`;
                this.send(clientInfo.ws, 'api_config_tested', {
                    success: false,
                    message: `${statusMsg}（Key: ${apiKey.slice(0, 7)}...）${errorText ? ' | ' + errorText.slice(0, 80) : ''}`,
                });
                return;
            }
            const data = await response.json();
            // 检查响应格式（OpenAI compatible: 检查 choices[0].message.content）
            const content = data.choices?.[0]?.message?.content;
            if (content !== undefined) {
                console.log(`[API Test] SUCCESS: response=${content}`);
                this.send(clientInfo.ws, 'api_config_tested', {
                    success: true,
                    message: `连接成功！模型: ${model || 'unknown'}`,
                });
            }
            else {
                // 尝试其他格式（Anthropic: content[0].text）
                const altContent = data.content?.[0]?.text;
                if (altContent !== undefined) {
                    console.log(`[API Test] SUCCESS (Anthropic format): response=${altContent}`);
                    this.send(clientInfo.ws, 'api_config_tested', {
                        success: true,
                        message: `连接成功！模型: ${model || 'unknown'}`,
                    });
                }
                else {
                    console.log(`[API Test] WARN: unexpected response format`, JSON.stringify(data).slice(0, 200));
                    this.send(clientInfo.ws, 'api_config_tested', {
                        success: true,
                        message: `收到响应但格式不标准，请检查模型名称`,
                    });
                }
            }
        }
        catch (err) {
            console.log(`[API Test] ERROR: ${err.message}`);
            this.send(clientInfo.ws, 'api_config_tested', {
                success: false,
                message: `连接失败: ${err.message}`,
            });
        }
    }
    // 尝试匹配两个用户
    tryMatch() {
        if (this.matchingPool.size < 2)
            return;
        const poolArray = Array.from(this.matchingPool);
        const client1Id = poolArray[0];
        const client2Id = poolArray[1];
        const client1 = this.clients.get(client1Id);
        const client2 = this.clients.get(client2Id);
        if (!client1 || !client2) {
            this.matchingPool.delete(client1Id);
            this.matchingPool.delete(client2Id);
            return;
        }
        // 确保双方都没有残留的AI对话状态
        if (client1.matchedWith === 'ai') {
            client1.matchedWith = undefined;
            client1.conversationId = undefined;
        }
        if (client2.matchedWith === 'ai') {
            client2.matchedWith = undefined;
            client2.conversationId = undefined;
        }
        // 检查AI开关：必须至少有一方开启了智能体
        const c1 = this.apiConfigs.get(client1.user.id);
        const c2 = this.apiConfigs.get(client2.user.id);
        const c1Ready = !!(c1?.enabled && c1.endpoint && c1.apiKey);
        const c2Ready = !!(c2?.enabled && c2.endpoint && c2.apiKey);
        if (!c1Ready && !c2Ready) {
            // 双方都没有AI，跳过继续匹配
            console.log(`[Match] Skipped: both ${client1.user.id.slice(0, 8)} and ${client2.user.id.slice(0, 8)} have no AI`);
            this.matchingPool.delete(client1Id);
            this.matchingPool.delete(client2Id);
            return;
        }
        // 从匹配池移除
        this.matchingPool.delete(client1Id);
        this.matchingPool.delete(client2Id);
        // 创建对话
        const conversation = createConversation(client1.user.id, client2.user.id);
        // 记录AI提供者：优先使用开启AI的一方
        conversation.aiProviderId = c1Ready ? client1.user.id : client2.user.id;
        conversation.hasAI = c1Ready || c2Ready;
        conversation.dualAI = c1Ready && c2Ready;
        this.conversations.set(conversation.id, conversation);
        // 更新客户端信息
        client1.conversationId = conversation.id;
        client1.matchedWith = client2Id;
        client2.conversationId = conversation.id;
        client2.matchedWith = client1Id;
        // 记录用户对话历史
        this.userConversations.get(client1.user.id)?.push(conversation.id);
        this.userConversations.get(client2.user.id)?.push(conversation.id);
        // 统一分配AI配色方案（0-5），确保双方看到一致的颜色
        const aiColorIndex = Math.floor(Math.random() * 6);
        conversation.aiColorIndex = aiColorIndex;
        // 发送匹配成功消息
        this.send(client1.ws, 'matched', {
            conversationId: conversation.id,
            peer: {
                id: client2.user.id,
                code: client2.user.code,
                avatar: client2.user.avatar,
                nickname: client2.user.nickname
            },
            aiGreeting: null,
            hasAI: c1Ready || c2Ready,
            dualAI: c1Ready && c2Ready,
            aiColorIndex,
            mySide: 'left', // participants[0]
            peerApiConfig: c2 ? {
                enabled: c2.enabled,
                triggerWord: c2.triggerWord || '小助手',
            } : null,
        });
        this.send(client2.ws, 'matched', {
            conversationId: conversation.id,
            peer: {
                id: client1.user.id,
                code: client1.user.code,
                avatar: client1.user.avatar,
                nickname: client1.user.nickname
            },
            aiGreeting: null,
            hasAI: c1Ready || c2Ready,
            dualAI: c1Ready && c2Ready,
            aiColorIndex,
            mySide: 'right', // participants[1]
            peerApiConfig: c1 ? {
                enabled: c1.enabled,
                triggerWord: c1.triggerWord || '小助手',
            } : null,
        });
        // 通知双方对方在线
        this.send(client1.ws, 'peer_status', { peerId: client2.user.id, online: true });
        this.send(client2.ws, 'peer_status', { peerId: client1.user.id, online: true });
    }
    // 创建与AI的对话
    async createAIConversation(clientId) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const aiUser = {
            id: 'ai-moderator',
            code: 'AI0000',
            avatar: { bgColor: '#1a1a2e', textColor: '#00fff5', kaomoji: '˶>ᗜ<˶' },
            nickname: 'AI调解助手',
            selfAvatar: { bgColor: '#1a1a2e', textColor: '#00fff5', kaomoji: '˶>ᗜ<˶' },
        };
        const conversation = createConversation(clientInfo.user.id, aiUser.id);
        conversation.participants = [clientInfo.user.id, 'ai-moderator'];
        this.conversations.set(conversation.id, conversation);
        clientInfo.conversationId = conversation.id;
        clientInfo.matchedWith = 'ai';
        this.userConversations.get(clientInfo.user.id)?.push(conversation.id);
        // 检查外部API配置
        const apiConfig = this.apiConfigs.get(clientInfo.user.id);
        const useExternal = !!(apiConfig?.enabled && apiConfig.endpoint && apiConfig.apiKey);
        console.log(`[AI Greeting] userId=${clientInfo.user.id}, useExternal=${useExternal}`);
        let greeting = null;
        if (useExternal) {
            greeting = await this.generateExternalGreeting(clientInfo.user.id);
        }
        // 仅在有外部API时发送问候语
        if (greeting) {
            const greetingMsg = createMessage('ai-moderator', greeting, 'ai');
            greetingMsg.id = 'ai-greeting';
            conversation.messages.push(greetingMsg);
        }
        // 统一分配AI配色方案
        conversation.aiColorIndex = Math.floor(Math.random() * 6);
        this.send(clientInfo.ws, 'matched', {
            conversationId: conversation.id,
            peer: {
                id: aiUser.id,
                code: aiUser.code,
                avatar: aiUser.avatar,
                nickname: aiUser.nickname,
            },
            isAI: true,
            aiGreeting: greeting,
            aiColorIndex: conversation.aiColorIndex,
            mySide: 'left', // AI单聊：用户是 participants[0]
        });
    }
    // 处理聊天消息
    handleChatMessage(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo || !clientInfo.conversationId)
            return;
        const conversation = this.conversations.get(clientInfo.conversationId);
        if (!conversation)
            return;
        const message = createMessage(clientInfo.user.id, payload.content);
        // 使用客户端提供的 messageId 以便客户端确认发送成功
        if (payload.messageId) {
            message.id = payload.messageId;
        }
        conversation.messages.push(message);
        this.send(clientInfo.ws, 'message', message);
        if (clientInfo.matchedWith === 'ai') {
            // AI对话：检查外部API配置
            const apiConfig = this.apiConfigs.get(clientInfo.user.id);
            const useExternal = !!(apiConfig?.enabled && apiConfig.endpoint && apiConfig.apiKey);
            console.log(`[AI Response] userId=${clientInfo.user.id}, useExternal=${useExternal}`);
            if (useExternal) {
                this.callExternalAI(clientInfo.user.id, conversation, clientInfo.ws, payload.content);
            }
            return;
        }
        // 真人对话：发送给对方
        const peerInfo = this.clients.get(clientInfo.matchedWith);
        if (peerInfo) {
            this.send(peerInfo.ws, 'message', message);
        }
        // === AI 调解者分析 ===
        // 核心规则：
        // 1. 每个智能体只响应自己的触发词，但允许对方用户使用该触发词
        // 2. 双AI模式下双方智能体同时生效（各自监控，可介入调解）
        // 3. 单AI模式下只有AI提供者能触发自己的智能体
        const senderId = clientInfo.user.id;
        const peerId = clientInfo.matchedWith;
        const senderConfig = this.apiConfigs.get(senderId);
        const peerClientInfo = peerId ? this.clients.get(peerId) : undefined;
        const peerUserId = peerClientInfo?.user.id;
        const peerConfig = peerUserId ? this.apiConfigs.get(peerUserId) : undefined;
        const senderAIReady = !!(senderConfig?.enabled && senderConfig.endpoint && senderConfig.apiKey);
        const peerAIReady = !!(peerConfig?.enabled && peerConfig.endpoint && peerConfig.apiKey);
        const isDualAI = conversation.dualAI === true;
        const aiEnabled = senderAIReady || peerAIReady;
        const onlyOneAI = aiEnabled && !isDualAI;
        console.log(`[AI Analysis] senderReady=${senderAIReady}, peerReady=${peerAIReady}, dualAI=${isDualAI}, onlyOneAI=${onlyOneAI}`);
        console.log(`[AI Analysis] message.content="${message.content}"`);
        if (!aiEnabled)
            return; // 双方都未开启智能体，跳过
        const senderTrigger = senderConfig?.triggerWord || '小助手';
        const peerTrigger = peerConfig?.triggerWord || '小助手';
        // 每个AI各自检查自己的触发词（不分谁说的）
        const hasSenderAITrigger = message.content.includes(senderTrigger);
        const hasPeerAITrigger = message.content.includes(peerTrigger);
        console.log(`[ExternalAI] hasSenderAITrigger=${hasSenderAITrigger}, hasPeerAITrigger=${hasPeerAITrigger}`);
        if (isDualAI) {
            // ── 双AI模式：各自检查自己的触发词，允许对方使用 ──
            // dualAISide 使用绝对标识：'left' = participants[0] 的AI, 'right' = participants[1] 的AI
            const senderSide = conversation.participants[0] === senderId ? 'left' : 'right';
            const peerSide = senderSide === 'left' ? 'right' : 'left';
            // 发送方智能体：匹配自己的触发词才强制响应
            this.callExternalAIModerator(senderConfig, conversation, clientInfo.ws, peerInfo?.ws, message, senderConfig, peerConfig, hasSenderAITrigger, senderSide);
            // 对方智能体：匹配自己的触发词才强制响应
            this.callExternalAIModerator(peerConfig, conversation, clientInfo.ws, peerInfo?.ws, message, senderConfig, peerConfig, hasPeerAITrigger, peerSide);
        }
        else if (onlyOneAI) {
            // ── 单AI模式：仅AI提供者能触发自己的智能体 ──
            const aiProviderId = conversation.aiProviderId;
            if (senderId === aiProviderId) {
                const aiConfig = senderConfig || peerConfig;
                this.callExternalAIModerator(aiConfig, conversation, clientInfo.ws, peerInfo?.ws, message, senderConfig, peerConfig, hasSenderAITrigger);
            }
            // 非AI提供者发送的消息：不触发智能体
        }
    }
    // 生成AI横幅文字（模拟心理活动/旁白）
    generateBannerText(_messages, _latestMessage) {
        return '智能体已就绪，正在倾听中...';
    }
    // 使用外部API生成问候语
    async generateExternalGreeting(userId) {
        const config = this.apiConfigs.get(userId);
        if (!config)
            return null;
        try {
            const response = await fetch(this.normalizeEndpoint(config.endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        { role: 'system', content: '你是一个友善的AI调解助手，请用一句简短、温暖的话向我打招呼。' },
                        { role: 'user', content: '请用一句简短、温暖的话向我打招呼。' }
                    ],
                    max_tokens: 100,
                    temperature: 0.9,
                }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        }
        catch {
            return null;
        }
    }
    // 生成对话标题
    handleGenerateTitle(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation)
            return;
        const apiConfig = this.apiConfigs.get(clientInfo.user.id);
        if (!apiConfig?.enabled || !apiConfig.endpoint || !apiConfig.apiKey) {
            // 没有外部API，用第一条用户消息作为标题
            const firstUserMsg = conversation.messages.find(m => m.type === 'user');
            const title = firstUserMsg
                ? firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
                : '对话';
            this.send(clientInfo.ws, 'title_generated', { conversationId: conversation.id, title });
            return;
        }
        this.generateExternalTitle(clientInfo.user.id, conversation, clientInfo.ws);
    }
    // 手动更新对话标题
    handleUpdateTitle(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation)
            return;
        conversation.title = payload.title;
        console.log(`[UpdateTitle] userId=${clientInfo.user.id}, conversationId=${payload.conversationId}, title=${payload.title}`);
        this.send(clientInfo.ws, 'title_updated', { conversationId: payload.conversationId, title: payload.title });
    }
    async generateExternalTitle(userId, conversation, ws) {
        const config = this.apiConfigs.get(userId);
        if (!config)
            return;
        try {
            const userMessages = conversation.messages
                .filter(m => m.type === 'user')
                .map(m => m.content)
                .slice(0, 5)
                .join('\n');
            const response = await fetch(this.normalizeEndpoint(config.endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        { role: 'system', content: '你是一个对话标题生成器。根据对话内容生成一个简短的标题（不超过15个字），直接输出标题，不要其他内容。' },
                        { role: 'user', content: `请为以下对话生成一个简短的标题:\n${userMessages}` }
                    ],
                    max_tokens: 30,
                    temperature: 0.7,
                }),
            });
            if (!response.ok) {
                const firstUserMsg = conversation.messages.find(m => m.type === 'user');
                const title = firstUserMsg
                    ? firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
                    : '对话';
                this.send(ws, 'title_generated', { conversationId: conversation.id, title });
                return;
            }
            const data = await response.json();
            const title = data.choices?.[0]?.message?.content?.trim() || '对话';
            this.send(ws, 'title_generated', { conversationId: conversation.id, title });
        }
        catch {
            const firstUserMsg = conversation.messages.find(m => m.type === 'user');
            const title = firstUserMsg
                ? firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
                : '对话';
            this.send(ws, 'title_generated', { conversationId: conversation.id, title });
        }
    }
    // 调用外部AI API
    async callExternalAI(userId, conversation, ws, userMessage) {
        const config = this.apiConfigs.get(userId);
        if (!config)
            return;
        try {
            // 构建消息历史
            const messages = [];
            messages.push({
                role: 'system',
                content: '你是一个友善的AI调解助手，在Two-Way Chat应用中辅助用户对话。你的职责包括：\n' +
                    '1. 当用户主动呼唤你或对话需要第三方调解时介入，用温和的语气帮助双方沟通\n' +
                    '2. 根据对话上下文和语气判断用户是否需要帮助（而非仅靠关键词），例如当对话出现争执、困惑、情绪波动时主动介入\n' +
                    '3. 检测并提醒不当言论，违规词包括但不限于：人身攻击、辱骂、歧视性言论、威胁、骚扰、色情内容\n' +
                    '4. 保持友好、中立的态度，用温暖的语言化解冲突\n' +
                    '5. 回复中保持自然，让对话更轻松愉快\n' +
                    '6. 不要过度干预，仅在必要时介入'
            });
            // 添加最近10条对话历史
            const recentMessages = conversation.messages.slice(-10);
            for (const msg of recentMessages) {
                if (msg.type === 'ai') {
                    messages.push({ role: 'assistant', content: msg.content });
                }
                else {
                    messages.push({ role: 'user', content: msg.content });
                }
            }
            const response = await fetch(this.normalizeEndpoint(config.endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model,
                    messages,
                    max_tokens: 1000,
                    temperature: 0.8,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('External AI API error:', response.status, errorText);
                return;
            }
            const data = await response.json();
            const aiContent = data.choices?.[0]?.message?.content;
            if (!aiContent)
                return;
            const aiMessage = createMessage('ai-moderator', aiContent, 'ai');
            conversation.messages.push(aiMessage);
            this.send(ws, 'ai_message', aiMessage);
        }
        catch (error) {
            console.error('External AI call failed:', error);
        }
    }
    // 外部AI调解者：监听双方对话并适时介入
    async callExternalAIModerator(config, conversation, senderWs, peerWs, _latestMessage, senderConfig, peerConfig, forceRespond = false, dualAISide) {
        try {
            const recentMessages = conversation.messages.slice(-10);
            // 确定此AI的归属用户和对方用户
            const ownerId = dualAISide === 'left' ? conversation.participants[0] : dualAISide === 'right' ? conversation.participants[1] : (conversation.aiProviderId || conversation.participants[0]);
            const otherId = dualAISide === 'left' ? conversation.participants[1] : dualAISide === 'right' ? conversation.participants[0] : '';
            const myTrigger = config.triggerWord || '小助手';
            const otherTrigger = otherId ? (this.apiConfigs.get(otherId)?.triggerWord || '小助手') : '';
            const isDualAI = conversation.dualAI === true;
            // 构建分析请求
            const messages = [];
            let systemPrompt;
            if (isDualAI) {
                // 双AI模式：各自的触发词，任一方使用了都响应
                if (forceRespond) {
                    systemPrompt = `你是用户"${ownerId.slice(0, 6)}"的专属AI助手。你的触发词是"${myTrigger}"，无论对话中哪一方使用这个触发词，都请务必用温和的语气回应。\n\n注意：对方用户的AI助手使用触发词"${otherTrigger}"，那是另一个AI的触发词。你只需关注自己的触发词"${myTrigger}"。\n\n如果对话顺畅无需干预，请回复"PASS"（仅此一词，不要多余内容）。\n\n违规词参考：人身攻击、辱骂、歧视性言论、威胁、骚扰、色情内容。`;
                }
                else {
                    systemPrompt = `你是用户"${ownerId.slice(0, 6)}"的专属AI助手，正在后台监控对话。你的触发词是"${myTrigger}"，无论对话中哪一方使用这个触发词，都请务必用温和的语气回应。\n\n注意：对方用户的AI助手使用触发词"${otherTrigger}"，那是另一个AI的触发词。你只需关注自己的触发词"${myTrigger}"。\n\n当对话出现争执、困惑、情绪波动或用户需要帮助时，请介入并用温和的语气帮助双方沟通。如果对话顺畅无需干预，请回复"PASS"（仅此一词，不要多余内容）。\n\n违规词参考：人身攻击、辱骂、歧视性言论、威胁、骚扰、色情内容。`;
                }
            }
            else {
                // 单AI模式：简化的提示词
                if (forceRespond) {
                    systemPrompt = `你是一个友善的AI调解助手，在Two-Way Chat应用中辅助用户对话。用户通过触发词"${myTrigger}"呼叫你，当用户使用这个触发词时，请务必用温和的语气回应他们的问题或请求。如果对话顺畅无需干预，请回复"PASS"（仅此一词，不要多余内容）。\n\n违规词参考：人身攻击、辱骂、歧视性言论、威胁、骚扰、色情内容。`;
                }
                else {
                    systemPrompt = '你是一个友善的AI调解助手，在Two-Way Chat应用中辅助用户对话。当对话出现争执、困惑、情绪波动或用户需要帮助时，请介入并用温和的语气帮助双方沟通。如果对话顺畅无需干预，请回复"PASS"（仅此一词，不要多余内容）。\n\n违规词参考：人身攻击、辱骂、歧视性言论、威胁、骚扰、色情内容。';
                }
            }
            messages.push({ role: 'system', content: systemPrompt });
            // 添加对话历史：双AI模式用身份标签，单AI模式用通用标签
            for (const msg of recentMessages) {
                let label;
                if (msg.type === 'ai') {
                    // AI消息：区分是自己还是对方AI
                    label = (isDualAI && msg.dualAISide === dualAISide) ? '你' : 'AI';
                }
                else {
                    // 用户消息：区分是你的用户还是对方用户
                    label = (isDualAI && msg.senderId === ownerId) ? '你的用户' : (isDualAI ? '对方用户' : (msg.senderId === conversation.participants[0] ? '用户A' : '用户B'));
                }
                messages.push({ role: 'user', content: `[${label}]: ${msg.content}` });
            }
            messages.push({
                role: 'user',
                content: forceRespond
                    ? '用户使用了触发词呼叫你，请用温和的语气回应他们的请求或问题，不要回复"PASS"。'
                    : '请分析以上对话，判断是否需要介入调解。如果需要，请用温和的语气回应；如果不需要，只回复"PASS"。'
            });
            const response = await fetch(this.normalizeEndpoint(config.endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model,
                    messages,
                    max_tokens: 500,
                    temperature: 0.7,
                }),
            });
            if (!response.ok) {
                console.error('External AI Moderator API error:', response.status);
                return;
            }
            const data = await response.json();
            const aiContent = data.choices?.[0]?.message?.content || 'PASS';
            console.log(`[ExternalAI Moderator] forceRespond=${forceRespond}, aiContent=${aiContent?.slice(0, 50)}...`);
            // 发送横幅（心理活动）
            const bannerText = this.generateBannerText(conversation.messages, _latestMessage);
            const bannerTextRight = isDualAI ? this.generateBannerText(conversation.messages, _latestMessage) : '';
            this.send(senderWs, 'ai_banner', { text: bannerText, textRight: bannerTextRight });
            if (peerWs) {
                this.send(peerWs, 'ai_banner', { text: bannerText, textRight: bannerTextRight });
            }
            // PASS检查：无论是否强制响应，只要AI返回PASS就静默跳过，不输出到对话
            const aiTrimmed = aiContent.trim();
            if (aiTrimmed.toUpperCase() === 'PASS' || aiTrimmed.toUpperCase().startsWith('PASS')) {
                console.log(`[ExternalAI Moderator] AI returned PASS, skipping silently`);
                return;
            }
            const aiMessage = createMessage('ai-moderator', aiContent, 'ai');
            // 双AI模式：使用传入的 side 或交替
            if (isDualAI) {
                if (dualAISide) {
                    aiMessage.dualAISide = dualAISide;
                }
                else {
                    const lastSide = conversation.lastAISide || 'right';
                    const currentSide = lastSide === 'right' ? 'left' : 'right';
                    conversation.lastAISide = currentSide;
                    aiMessage.dualAISide = currentSide;
                }
            }
            conversation.messages.push(aiMessage);
            this.send(senderWs, 'ai_message', aiMessage);
            if (peerWs) {
                this.send(peerWs, 'ai_message', aiMessage);
            }
        }
        catch (error) {
            console.error('External AI Moderator call failed:', error);
        }
    }
    // 更新用户资料
    handleUpdateProfile(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        // 更新自己的资料（仅当不是在对等方显示更新时）
        if (!payload.peerId && payload.nickname) {
            clientInfo.user.nickname = payload.nickname;
        }
        if (payload.selfAvatar) {
            clientInfo.user.selfAvatar = payload.selfAvatar;
        }
        // 更新对方在当前对话中的显示
        if (payload.peerId && payload.avatar && clientInfo.conversationId) {
            // 查找对等方的WebSocket并转发更新
            const peerClientInfo = Array.from(this.clients.entries())
                .find(([_, info]) => info.user.id === payload.peerId);
            if (peerClientInfo) {
                this.send(peerClientInfo[1].ws, 'update_profile', {
                    peerId: payload.peerId,
                    avatar: payload.avatar,
                    nickname: payload.nickname
                });
            }
        }
    }
    // 处理暂离/退出
    handleExit(clientId) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo || !clientInfo.conversationId)
            return;
        // AI对话：仅清理客户端状态，保留对话记录
        if (clientInfo.matchedWith === 'ai') {
            clientInfo.conversationId = undefined;
            clientInfo.exitRequested = undefined;
            clientInfo.matchedWith = undefined;
            return;
        }
        const conversation = this.conversations.get(clientInfo.conversationId);
        if (!conversation)
            return;
        // 暂离：默认保留对话
        conversation.preserved = true;
        conversation.endedAt = Date.now();
        console.log(`[Exit/Away] userId=${clientInfo.user.id}, conversationId=${clientInfo.conversationId}, preserved=true`);
        const peerInfo = this.clients.get(clientInfo.matchedWith);
        if (peerInfo) {
            // 通知对方：对方暂时离开
            this.send(peerInfo.ws, 'exit', {
                message: '对方暂时离开，对话已保留，可随时回来继续'
            });
            this.send(peerInfo.ws, 'peer_status', { peerId: clientInfo.user.id, online: false });
        }
        // 清理状态
        clientInfo.conversationId = undefined;
        clientInfo.exitRequested = undefined;
        clientInfo.matchedWith = undefined;
    }
    // 确认退出
    handleExitConfirm(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation)
            return;
        // 保存对话
        conversation.preserved = payload.preserve;
        conversation.endedAt = Date.now();
        if (payload.title) {
            conversation.title = payload.title;
        }
        console.log(`[ExitConfirm] userId=${clientInfo.user.id}, conversationId=${payload.conversationId}, preserved=${payload.preserve}, title=${payload.title}`);
        // 通知对方结束交谈
        if (clientInfo.matchedWith && clientInfo.matchedWith !== 'ai') {
            const peerInfo = this.clients.get(clientInfo.matchedWith);
            if (peerInfo) {
                this.send(peerInfo.ws, 'exit', {
                    message: '对方已结束交谈'
                });
                this.send(peerInfo.ws, 'peer_status', { peerId: clientInfo.user.id, online: false });
                peerInfo.conversationId = undefined;
                peerInfo.exitRequested = undefined;
            }
        }
        // 清理状态
        clientInfo.conversationId = undefined;
        clientInfo.exitRequested = undefined;
        clientInfo.matchedWith = undefined;
    }
    // 处理评分
    handleRate(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation)
            return;
        // AI裁决评分
        const evaluation = evaluateRating(conversation.messages, payload.rating, payload.reason);
        if (evaluation.valid) {
            conversation.ratings[clientInfo.user.id] = payload.rating;
            this.send(clientInfo.ws, 'rating_result', {
                success: true,
                message: evaluation.reason
            });
        }
        else {
            this.send(clientInfo.ws, 'rating_result', {
                success: false,
                message: evaluation.reason
            });
        }
    }
    // 删除对话记录
    handleDeleteConversation(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation)
            return;
        // 从双方用户对话历史中移除
        for (const participantId of conversation.participants) {
            if (participantId === 'ai-moderator')
                continue;
            const userConversations = this.userConversations.get(participantId);
            if (userConversations) {
                const idx = userConversations.indexOf(payload.conversationId);
                if (idx !== -1) {
                    userConversations.splice(idx, 1);
                }
            }
        }
        // 删除对话
        this.conversations.delete(payload.conversationId);
        console.log(`[DeleteConversation] conversationId=${payload.conversationId} deleted`);
    }
    // 获取历史对话
    handleHistory(clientId) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversationIds = this.userConversations.get(clientInfo.user.id) || [];
        const history = conversationIds.map(id => {
            const conv = this.conversations.get(id);
            if (!conv)
                return null;
            const peerId = conv.participants.find(p => p !== clientInfo.user.id);
            const isAI = peerId === 'ai-moderator';
            const peerClient = isAI ? undefined : Array.from(this.clients.values()).find(c => c.user.id === peerId);
            return {
                id: conv.id,
                peerId,
                peerCode: isAI ? 'AI0000' : (peerClient?.user.code || '未知'),
                peerNickname: isAI ? 'AI调解助手' : (peerClient?.user.nickname || '匿名用户'),
                peerAvatar: isAI ? { bgColor: '#1a1a2e', textColor: '#00fff5', kaomoji: '˶>ᗜ<˶' } : peerClient?.user.avatar,
                createdAt: conv.createdAt,
                endedAt: conv.endedAt,
                preserved: conv.preserved,
                messageCount: conv.messages.length,
                isAI,
                title: conv.title,
                lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content : '',
            };
        }).filter(Boolean);
        this.send(clientInfo.ws, 'history', history);
    }
    // 查看历史对话内容
    handleViewHistory(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation) {
            this.send(clientInfo.ws, 'error', { message: '对话不存在' });
            return;
        }
        // 检查用户是否是对话参与者
        if (!conversation.participants.includes(clientInfo.user.id)) {
            this.send(clientInfo.ws, 'error', { message: '无权查看该对话' });
            return;
        }
        const peerId = conversation.participants.find(p => p !== clientInfo.user.id);
        const isAI = peerId === 'ai-moderator';
        const peerClient = isAI ? undefined : Array.from(this.clients.values()).find(c => c.user.id === peerId);
        this.send(clientInfo.ws, 'history_messages', {
            conversationId: conversation.id,
            peerNickname: isAI ? 'AI调解助手' : (peerClient?.user.nickname || '匿名用户'),
            peerAvatar: isAI ? { bgColor: '#1a1a2e', textColor: '#00fff5', kaomoji: '˶>ᗜ<˶' } : (peerClient?.user.avatar || null),
            peerCode: isAI ? 'AI0000' : (peerClient?.user.code || '未知'),
            isAI,
            messages: conversation.messages,
            preserved: conversation.preserved,
            createdAt: conversation.createdAt,
            endedAt: conversation.endedAt,
        });
    }
    // 处理用户重连：恢复历史对话记录
    handleUserInfo(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const oldUserId = payload.userId;
        const newUserId = clientInfo.user.id;
        if (oldUserId === newUserId)
            return;
        const oldConversationIds = this.userConversations.get(oldUserId);
        if (!oldConversationIds || oldConversationIds.length === 0)
            return;
        console.log(`[UserInfo] Merging conversations from ${oldUserId} to ${newUserId}, count: ${oldConversationIds.length}`);
        // 更新所有旧对话的参与者ID
        for (const convId of oldConversationIds) {
            const conv = this.conversations.get(convId);
            if (conv) {
                const idx = conv.participants.indexOf(oldUserId);
                if (idx !== -1) {
                    conv.participants[idx] = newUserId;
                }
            }
        }
        // 合并对话记录到新用户
        const newConversationIds = this.userConversations.get(newUserId) || [];
        const merged = [...new Set([...oldConversationIds, ...newConversationIds])];
        this.userConversations.set(newUserId, merged);
        // 删除旧用户的记录
        this.userConversations.delete(oldUserId);
    }
    // 恢复对话（继续聊天，支持AI和普通对话）
    handleResumeConversation(clientId, payload) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        const conversation = this.conversations.get(payload.conversationId);
        if (!conversation) {
            this.send(clientInfo.ws, 'error', { message: '对话不存在' });
            return;
        }
        if (!conversation.participants.includes(clientInfo.user.id)) {
            this.send(clientInfo.ws, 'error', { message: '无权查看该对话' });
            return;
        }
        const peerId = conversation.participants.find(p => p !== clientInfo.user.id);
        const isAI = peerId === 'ai-moderator';
        // 设置当前对话为活跃状态 - matchedWith 必须使用 clientId 以便消息转发
        clientInfo.conversationId = conversation.id;
        const peerClient = peerId ? Array.from(this.clients.entries()).find(([_, c]) => c.user.id === peerId) : undefined;
        clientInfo.matchedWith = isAI ? 'ai' : (peerClient ? peerClient[0] : peerId);
        if (isAI) {
            this.send(clientInfo.ws, 'conversation_resumed', {
                conversationId: conversation.id,
                peer: {
                    id: 'ai-moderator',
                    code: 'AI0000',
                    avatar: { bgColor: '#1a1a2e', textColor: '#00fff5', kaomoji: '˶>ᗜ<˶' },
                    nickname: 'AI调解助手',
                },
                isAI: true,
                hasAI: true,
                dualAI: conversation.dualAI || false,
                aiColorIndex: conversation.aiColorIndex,
                mySide: 'left', // AI单聊：用户是 participants[0]
                peerApiConfig: null,
                messages: conversation.messages,
            });
        }
        else {
            // 普通对话：通知对方并重新建立连接
            const peerClientInfo = peerClient ? peerClient[1] : undefined;
            const peerClientId = peerClient ? peerClient[0] : undefined;
            const peerData = {
                id: peerId || 'unknown',
                code: peerClientInfo?.user.code || '未知',
                avatar: peerClientInfo?.user.avatar || { bgColor: '#1a1a2e', textColor: '#00fff5', kaomoji: '˶>ᗜ<˶' },
                nickname: peerClientInfo?.user.nickname || '匿名用户',
            };
            // 发送恢复消息给请求方
            const peerApiConfig = peerId ? this.apiConfigs.get(peerId) || null : null;
            this.send(clientInfo.ws, 'conversation_resumed', {
                conversationId: conversation.id,
                peer: peerData,
                isAI: false,
                hasAI: conversation.hasAI || false,
                dualAI: conversation.dualAI || false,
                aiColorIndex: conversation.aiColorIndex,
                mySide: conversation.participants[0] === clientInfo.user.id ? 'left' : 'right',
                peerApiConfig,
                messages: conversation.messages,
            });
            // 如果对方在线，检查对方是否仍在对话中
            if (peerClientInfo && peerClientId && peerId) {
                // 对方已退出（conversationId 为空或不匹配），不要强制拉回
                if (!peerClientInfo.conversationId || peerClientInfo.conversationId !== conversation.id) {
                    // 对方已退出，仅通知请求方对方在线状态
                    this.send(clientInfo.ws, 'peer_status', { peerId: peerId, online: true });
                    // 通知对方：另一方已回来，但不强制拉入对话
                    this.send(peerClientInfo.ws, 'peer_status', { peerId: clientInfo.user.id, online: true });
                }
                else {
                    // 对方仍在对话中，同步状态
                    peerClientInfo.conversationId = conversation.id;
                    peerClientInfo.matchedWith = clientId;
                    this.send(peerClientInfo.ws, 'peer_join', {
                        conversationId: conversation.id,
                        peer: {
                            id: clientInfo.user.id,
                            code: clientInfo.user.code,
                            avatar: clientInfo.user.avatar,
                            nickname: clientInfo.user.nickname,
                        },
                        isAI: false,
                        hasAI: conversation.hasAI || false,
                        dualAI: conversation.dualAI || false,
                        aiColorIndex: conversation.aiColorIndex,
                        messages: conversation.messages,
                    });
                    // 通知请求方：对方在线
                    this.send(clientInfo.ws, 'peer_status', { peerId: peerId, online: true });
                    // 通知对方：请求方在线
                    this.send(peerClientInfo.ws, 'peer_status', { peerId: clientInfo.user.id, online: true });
                }
            }
            else {
                // 对方不在线，通知请求方
                this.send(clientInfo.ws, 'peer_status', { peerId: peerId, online: false });
            }
        }
    }
    // 处理断开连接
    handleDisconnect(clientId) {
        const clientInfo = this.clients.get(clientId);
        if (!clientInfo)
            return;
        // 从匹配池移除
        this.matchingPool.delete(clientId);
        // 通知对方
        if (clientInfo.matchedWith && clientInfo.matchedWith !== 'ai') {
            const peerInfo = this.clients.get(clientInfo.matchedWith);
            if (peerInfo) {
                this.send(peerInfo.ws, 'exit', {
                    message: '对方已断开连接，对话已保留，可等待对方重新上线'
                });
                this.send(peerInfo.ws, 'peer_status', {
                    peerId: clientInfo.user.id,
                    online: false
                });
                peerInfo.conversationId = undefined;
                peerInfo.matchedWith = undefined;
            }
        }
        this.clients.delete(clientId);
    }
}
