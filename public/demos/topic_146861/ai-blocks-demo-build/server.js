/**
 * AI积木编程 - 本地后端服务
 * 
 * 功能：
 * - L1 需求理解：调用豆包大模型理解用户意图
 * - L2 积木生成：根据用户需求生成积木组合
 * 
 * 启动方式：
 *   npm install    # 首次安装依赖
 *   npm start      # 启动服务
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 打印启动信息
console.log(`
╔═══════════════════════════════════════════════════╗
║         AI积木编程 - 本地后端服务                  ║
╠═══════════════════════════════════════════════════╣
║  状态: ${process.env.ARK_API_KEY && process.env.ARK_API_KEY !== 'your_ark_api_key_here' ? '✅ API Key 已配置' : '⚠️  请在 .env 中配置 API Key'}
║  端口: http://localhost:${PORT}                       ║
╚═══════════════════════════════════════════════════╝
`);

/**
 * 调用豆包大模型 API
 */
async function callDoubao(messages) {
    const apiKey = process.env.ARK_API_KEY;
    const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    const model = process.env.DOUBao_MODEL || 'doubao-pro-32k';

    if (!apiKey || apiKey === 'your_ark_api_key_here') {
        throw new Error('请先在 .env 文件中配置 ARK_API_KEY');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 2000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API 调用失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * 序列化项目状态给AI
 */
function getProjectSummary(projectData) {
    const sprites = projectData.sprites || projectData.all_sprites || [];
    const costumes = projectData.costumes || [];
    const sounds = projectData.sounds || [];
    const stacks = projectData.stacks || [];

    const summary = {
        sprites: sprites.map(s => ({
            emoji: s.emoji,
            name: s.name,
            active: s.active
        })),
        costumes: costumes.map(c => ({
            emoji: c.emoji,
            name: c.name,
            active: c.active
        })),
        sounds: sounds.map(s => ({
            icon: s.icon,
            name: s.name,
            active: s.active
        })),
        stacks: stacks.filter(s => s.blocks && s.blocks.length > 0).map(stack => ({
            id: stack.id,
            blockCount: stack.blocks.length,
            firstBlock: stack.blocks[0]?.text || '未知',
            blocks: (stack.blocks || []).map(b => ({
                type: b.type,
                action: b.action || '未知',
                text: b.text || '无文本',
                icon: b.icon,
                selectValue: b.selectValue,
                selectName: b.selectName
            }))
        }))
    };
    return summary;
}

const SYSTEM_PROMPT = `你是积木编程的好朋友助手，亲切、友好又聪明！你可以做两件事：

1️⃣ 和小朋友聊天（当你的好朋友）
2️⃣ 帮小朋友编程积木（当你的编程小助手）

## 🎨 怎么判断该做什么呢？

**当用户这样说时，和他开心聊天：**
- "你好"、"在吗"、"今天天气真好"
- "讲个故事"、"聊聊天"、"我们玩什么"
- "你喜欢什么"、"你会唱歌吗"
- 或者看起来就是普通闲聊的话

**当用户这样说时，帮他编程积木：**
- "帮我做..."、"让小猫跳一跳"、"加个积木"
- "怎么让..."、"我想做一个..."、"添加..."
- "查看一下"、"现在有什么"、"看看我的程序"
- 或者明确提到积木、角色、声音等

## 🤗 智能称呼与自然对话

### 选择适合的称呼（根据对话内容智能判断）
**通用友好的称呼（适合大多数人）：**
- 好朋友、伙伴、朋友、一起探索的搭档
- 积木编程小伙伴、创意探索家

**小朋友喜欢（适合儿童化内容）：**
- 小可爱、小朋友、小天才、小英雄
- 积木小达人、小创造家

**专业中性（适合编程调试内容）：**
- 编程伙伴、技术伙伴、创意搭档
- 不需要称呼，直接自然对话

**如何选择：**
- 如果用户说话可爱或有颜文字/表情，用小朋友称呼
- 如果用户讨论调试、逻辑、技术问题，用专业中性称呼
- 其他情况用通用友好称呼
- 如果用户明确说"别叫我..."，就改用"朋友"或不带称呼

### 💬 自然对话的秘诀
1. **呼应内容**：聊到天气就说"是啊，阳光真好"，聊到吃饭就说"我也饿了"
2. **话题延伸**：用户说"无聊"，可以说"要不我们来做个有趣的积木？"
3. **多样开场**：不要总是"你好呀"，试试：
   - "嗨！我看到你的积木项目了，真有趣～"
   - "今天心情怎么样？想做点什么积木吗？"
   - "哇，你的角色设计得真好！😊"

### 🌈 聊天例子库（不要每次都一样）：
1. 回应"你好"：
   - "哈喽！我是你的积木编程伙伴，随时准备帮助你～✨"
   - "你好呀！今天想聊天还是想做积木呢？🎮"
   - "嗨！看到你在这里，真棒！😊"

2. 回应"今天天气真好"：
   - "是啊！阳光明媚，要不要做个太阳主题的积木？☀️"
   - "真好！适合边晒太阳边玩积木编程～"

3. 回应"无聊"：
   - "无聊的时候就该玩积木啦！我们来做点有趣的？🎁"
   - "一起做个解闷的小游戏怎么样？"

4. 回应"你会唱歌吗？"
   - "唱歌不擅长，但可以让积木里的角色唱歌播放音乐哦！🎵"
   - "我会让你的积木程序唱歌！要不要试试？"

## 🧩 编程帮助时的沟通
亲切但清晰的指导，像有经验的伙伴一样：
- 先看看对方在做什么项目
- 用合适的称呼和说话方式（小朋友可爱些，专业用户清晰些）
- 一步一步解释清楚
- 多用例子帮助理解

## 📤 怎么回复呢？

### 💬 **聊天模式（直接说开心的话，不要用JSON）**
如果用户只是想聊天，就直接回复亲切自然的话！
例子回复：
"今天天气真好啊！✨
我们可以一起做个太阳公公出来的小游戏哦～
小可爱今天想做什么积木呀？😊"

### 🧱 **编程模式（需要输出JSON）**
当用户需要编程帮助时，用这个格式：
{
  "mode": "programming",  // 必须是这个模式
  "response_type": "view | add_blocks | edit_blocks | add_sprite | delete_sprite | add_costume | delete_costume | add_sound | delete_sound",
  
  // 给小朋友看的亲切回话
  "friendly_response": "小可爱，我来帮你看看你的积木！现在有3个角色在玩跳跳游戏呢。想加点什么好玩的功能吗？😊",
  
  // 下面这些只有在编程模式才需要：
  "operation": "操作的详细说明",
  
  // 如果是查看项目
  "view_report": "📋 这个项目做得真棒！\n- 角色设计得很精彩\n- 积木组合很有创意\n- 音效效果很不错\n\n想再增加些什么功能吗？✨",
  
  // 如果是新增积木
  "blocks": [
    {
      "type": "movement",
      "action": "jump",
      "text": "⬆️ 跳跃"
    }
  ],
  
  // 如果是编辑积木
  "edits": [],
  
  // 如果是管理资源
  "resources": [],
  
  // 删除时需要确认
  "confirmation_needed": false,
  "confirmation_message": ""
}

## 🧸 项目里的积木有哪些？
1. 🚀 当程序开始
2. 朝 ?° 方向移动 ? 步
3. 🔄 旋转 ? 度
4. ⬆️ 跳跃
5. ⏱️ 等待 ? 秒
6. 🔁 重复 ? 次
7. 💬 说 "?"
8. 🔊 播放声音（要选列表里的哦）
9. ✨ 特效：发光
10. 🎭 换造型

## 💝 最重要的爱心提醒：
1. **先判断**：先看看小朋友是想聊天还是想编程
2. **要亲切**：说话像好朋友，用小朋友懂的话
3. **别太复杂**：一步一步来，别让小朋友头疼
4. **多鼓励**：说"做得好"、"加油"、"你真聪明"
5. **别太技术**：少说专业词，多说"积木跳舞"、"角色玩耍"这样的话

记住哦，你是小朋友的好朋友，要让他觉得和你聊天很开心，和你编程很有趣！🌈`;

const chatHistory = new Map();

/**
 * POST /api/chat - 处理AI对话和智能编辑
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { message, project_state, session_id = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: '消息不能为空' });
        }

        console.log(`\n📨 收到请求: ${message}`);

        // 获取或初始化会话历史
        if (!chatHistory.has(session_id)) {
            chatHistory.set(session_id, []);
        }
        const sessionHistory = chatHistory.get(session_id);

        // 序列化项目状态给AI
        const projectSummary = project_state ? getProjectSummary(project_state) : null;
        
        // 构建具体上下文
        const contextPrompt = projectSummary ? `
## 当前项目状态（现在你可以查看并基于此进行智能编辑）：
- 共 ${projectSummary.sprites.length} 个角色：${projectSummary.sprites.map(s => `${s.emoji} ${s.name}`).join(', ')}
- 共 ${projectSummary.costumes.length} 个造型：${projectSummary.costumes.map(c => `${c.emoji} ${c.name}`).join(', ')}
- 共 ${projectSummary.sounds.length} 个音效：${projectSummary.sounds.map(s => `${s.icon} ${s.name}`).join(', ')}
- 共 ${projectSummary.stacks.length} 个积木堆：
${projectSummary.stacks.map(stack => `  • 堆 ${stack.id}: ${stack.blockCount} 个积木，第一个是「${stack.firstBlock}」`).join('\n')}` : '';

        // 构建消息列表
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT + contextPrompt },
            ...sessionHistory.slice(-4), // 最近2轮对话
            { role: 'user', content: message }
        ];

        // 调用豆包API
        const response = await callDoubao(messages);

        console.log(`📨 AI分析: ${response}`);

        // 解析AI响应，支持聊天模式和编程模式
        let aiResponse;
        const cleanedResponse = response.trim();
        
        // 尝试查找JSON（编程模式）
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
            // 提取有效的JSON部分
            const jsonContent = cleanedResponse.substring(jsonStart, jsonEnd + 1);
            
            try {
                aiResponse = JSON.parse(jsonContent);
                console.log(`🧱 AI编程模式响应: ${jsonContent}`);
                
                // 兼容AI返回的action_type字段（自动映射到response_type）
                if (aiResponse.action_type && !aiResponse.response_type) {
                    aiResponse.response_type = aiResponse.action_type;
                }
                
                // 智能检测是否为编程模式：
                // 1. mode是programming，或者
                // 2. 有blocks/edits/resources/action_type等编程相关字段
                const hasProgrammingContent = 
                    aiResponse.mode === "programming" ||
                    aiResponse.blocks || 
                    aiResponse.edits || 
                    aiResponse.resources ||
                    aiResponse.action_type ||
                    (aiResponse.response_type && aiResponse.response_type !== "chat_only");
                
                if (!hasProgrammingContent) {
                    console.log("⚠️ JSON但无编程内容，转为聊天模式");
                    throw new Error("无编程内容，转为聊天");
                }
                
                // 确保mode为programming
                aiResponse.mode = "programming";
                
                // 验证response_type
                const validResponseTypes = ["view", "add_blocks", "edit_blocks", "add_sprite", "delete_sprite", 
                                          "add_costume", "delete_costume", "add_sound", "delete_sound", "chat_only"];
                if (!aiResponse.response_type || !validResponseTypes.includes(aiResponse.response_type)) {
                    // 如果有blocks就设为add_blocks
                    if (aiResponse.blocks && aiResponse.blocks.length > 0) {
                        aiResponse.response_type = "add_blocks";
                    } else if (aiResponse.edits && aiResponse.edits.length > 0) {
                        aiResponse.response_type = "edit_blocks";
                    } else {
                        aiResponse.response_type = "chat_only";
                    }
                }
                
                // 如果有friendly_response就用它作为用户看到的内容
                // AI会在friendly_response中设置合适的称呼
                if (!aiResponse.friendly_response) {
                    aiResponse.friendly_response = "我来帮你处理积木项目啦！✨";
                }
                
                // 如果是删除操作，确保有确认消息
                if (aiResponse.response_type.includes('delete') && (!aiResponse.confirmation_needed || !aiResponse.confirmation_message)) {
                    aiResponse.confirmation_needed = true;
                    if (!aiResponse.confirmation_message) {
                        aiResponse.confirmation_message = "小可爱，确定要执行这个删除操作吗？想清楚哦～";
                    }
                }
                
            } catch (parseError) {
                console.error("JSON解析失败，转为聊天模式:", parseError.message);
                // 解析失败，说明可能是聊天模式
                aiResponse = {
                    mode: "chat",
                    friendly_response: cleanedResponse
                };
            }
        } else {
            // 没有JSON，是纯文本聊天模式
            console.log(`💬 AI聊天模式响应: ${cleanedResponse}`);
            
            // 过滤掉AI可能会有的思考前缀
            const thoughtPatterns = [
                /让我想想[：:]\s*\n*/,
                /好的[，,]\s*\n*/,
                /嗯[，,]\s*\n*/,
                /首先[，,]\s*\n*/,
                /我来分析一下[：:]\s*\n*/
            ];
            
            let chatResponse = cleanedResponse;
            for (const pattern of thoughtPatterns) {
                chatResponse = chatResponse.replace(pattern, '');
            }
            
            aiResponse = {
                mode: "chat",
                friendly_response: chatResponse.trim() || "嗨！我是你的积木编程伙伴～✨ 想聊聊天还是做点积木？"
            };
        }

        // 确保mode字段存在
        if (!aiResponse.mode) {
            aiResponse.mode = "chat";
        }

        // 保存对话历史（最多保留5轮对话 = 10条消息）
        // 格式：用户消息 + AI回复 = 1轮对话
        sessionHistory.push({ role: 'user', content: message });
        sessionHistory.push({ role: 'assistant', content: response });

        // 保持最多5轮对话（10条消息）
        // 如果超过5轮，去掉最早的1轮对话（2条消息）
        const MAX_TURNS = 5;
        const MAX_MESSAGES = MAX_TURNS * 2; // 10条消息 = 5轮对话
        
        if (sessionHistory.length > MAX_MESSAGES) {
            // 去掉最早的1轮对话（2条消息）
            sessionHistory.splice(0, 2);
            console.log(`📝 对话历史已裁剪，当前保留 ${sessionHistory.length} 条消息（${sessionHistory.length/2} 轮对话）`);
        }

        res.json({
            success: true,
            data: aiResponse,
            conversation_info: {
                total_turns: sessionHistory.length / 2,
                max_turns: MAX_TURNS,
                is_full: sessionHistory.length >= MAX_MESSAGES
            }
        });

    } catch (error) {
        console.error(`❌ 错误: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/status - 检查服务状态
 */
app.get('/api/status', (req, res) => {
    const apiKeyConfigured = process.env.ARK_API_KEY && 
                             process.env.ARK_API_KEY !== 'your_ark_api_key_here';

    res.json({
        status: 'ok',
        apiKeyConfigured: apiKeyConfigured,
        version: '1.0.0'
    });
});

/**
 * POST /api/reset - 重置对话历史
 */
app.post('/api/reset', (req, res) => {
    chatHistory.length = 0;
    res.json({ success: true, message: '对话历史已重置' });
});

// 启动服务
app.listen(PORT, () => {
    console.log(`✨ 服务已启动: http://localhost:${PORT}`);
    console.log(`📡 API端点: http://localhost:${PORT}/api/chat`);
});
