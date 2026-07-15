const express = require('express');
const fetch = require('node-fetch');
const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
console.log('========================================');
console.log('.env 文件路径:', envPath);
console.log('当前工作目录:', process.cwd());

const envContent = fs.readFileSync(envPath, 'utf8');
console.log('=== .env 文件原始内容 ===');
console.log(envContent);
console.log('=== .env 文件原始内容结束 ===');

const keyMatch = envContent.match(/DASHSCOPE_API_KEY=(.+)/);
const rawKey = keyMatch ? keyMatch[1].trim() : '';
console.log('直接从文件解析的密钥:', JSON.stringify(rawKey));
console.log('解析的密钥长度:', rawKey.length);

console.log('========================================');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

console.log('=== 密钥调试信息 ===');
console.log('原始读取的完整密钥:', JSON.stringify(rawKey));
console.log('原始密钥长度:', rawKey.length);
console.log('原始密钥ASCII码:', [...rawKey].map(c => c.charCodeAt(0)));
const API_KEY = rawKey.replace(/[\s\u2000-\u200D\uFEFF]/g, '').trim();
console.log('清洗后密钥:', JSON.stringify(API_KEY));
console.log('清洗后密钥长度:', API_KEY.length);
console.log('密钥前缀是否sk-ws:', API_KEY.startsWith('sk-ws'));
console.log('=== 密钥调试信息结束 ===');

const API_CONFIG = {
    BASE_URL: 'https://dashscope.aliyuncs.com/api/v1/apps/e157cd697cd0455ab2a94d65ae8a2bb4/completion',
    API_KEY: API_KEY,
    TIMEOUT: 15000,
    IMAGE_TIMEOUT: 60000,
    HEALTH_APP_ID: 'e157cd697cd0455ab2a94d65ae8a2bb4',
    QUIZ_APP_ID: 'cb96426e8d0a4f598f1c493cf8e91406'
};

app.post('/api/health-consult', async (req, res) => {
    const { userText } = req.body;
    
    if (!userText) {
        return res.status(400).json({ error: '请输入咨询内容' });
    }

    if (!API_CONFIG.API_KEY) {
        return res.status(500).json({ error: '服务未配置阿里云百炼API密钥，请检查.env文件' });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(API_CONFIG.API_KEY);
        console.log('API Key 字节长度:', keyBytes.length);
        
        const authToken = `Bearer ${API_CONFIG.API_KEY}`;
        console.log('Auth Token:', authToken);
        console.log('Auth Token 长度:', authToken.length);

        const agent = new https.Agent({
            rejectUnauthorized: false // 本地调试关闭，线上改为true
        });

        const response = await fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: {
                    prompt: userText
                },
                parameters: {}
            }),
            agent: agent,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('=== 接口错误详情 ===');
            console.log('状态码:', response.status);
            console.log('错误响应:', JSON.stringify(errorData, null, 2));
            console.log('请求URL:', API_CONFIG.BASE_URL);
            console.log('请求方法:', 'POST');
            console.log('=== 错误详情结束 ===');
            throw new Error(`API调用失败: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (data.code) {
            throw new Error(`平台业务错误：${data.code} ${data.message}`);
        }
        const content = data.output.text;
        
        res.json({ success: true, content });
    } catch (error) {
        console.error('详细错误：', error);
        if (error.name === 'AbortError') {
            res.status(504).json({ success: false, content: '网络有点慢，请稍后再试试。' });
        } else {
            res.status(500).json({
                success: false,
                content: '服务暂时出错，请稍后重试'
            });
        }
    }
});

app.post('/api/image-recognition', async (req, res) => {
    const { base64Image } = req.body;
    
    if (!base64Image) {
        return res.status(400).json({ error: '请上传图片' });
    }

    if (!API_CONFIG.API_KEY) {
        return res.status(500).json({ error: '服务未配置阿里云百炼API密钥，请检查.env文件' });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.IMAGE_TIMEOUT);

        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(API_CONFIG.API_KEY);
        console.log('API Key 字节长度:', keyBytes.length);
        
        const authToken = `Bearer ${API_CONFIG.API_KEY}`;
        console.log('Auth Token:', authToken);
        console.log('Auth Token 长度:', authToken.length);

        const agent = new https.Agent({
            rejectUnauthorized: false // 本地调试关闭，线上改为true
        });

        const response = await fetch(API_CONFIG.BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: {
                    prompt: '识别药品图片，标注用法、禁忌，大白话给老人看',
                    image_list: [base64Image]
                },
                parameters: {}
            }),
            agent: agent,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`图片识别API调用失败: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (data.code) {
            throw new Error(`平台业务错误：${data.code} ${data.message}`);
        }
        const content = data.output.text;
        
        res.json({ success: true, content });
    } catch (error) {
        console.error('详细错误：', error);
        if (error.name === 'AbortError') {
            res.status(504).json({ success: false, content: '图片识别超时，请尝试压缩图片后重新上传' });
        } else {
            res.status(500).json({
                success: false,
                content: '服务暂时出错，请稍后重试'
            });
        }
    }
});

app.post('/api/generate-scam-question', async (req, res) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const agent = new https.Agent({
            rejectUnauthorized: false // 本地调试关闭，线上改为true
        });

        const QUIZ_BASE_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${API_CONFIG.QUIZ_APP_ID}/completion`;
        
        const response = await fetch(QUIZ_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: {
                    prompt: `请帮我生成一道防骗情景模拟题，用于老年人防骗教育。格式要求：

1. 题目类型：从以下类型中选择一个：冒充公检法、保健品推销、中奖诈骗、冒充熟人、投资理财、上门服务、网络钓鱼、情感诈骗

2. 返回格式（必须是纯JSON）：
{
    "id": 999,
    "title": "题目标题",
    "description": "情景描述（用老人能理解的语言，口语化）",
    "options": [
        {"text": "错误选项A", "correct": false, "feedback": "解释为什么错"},
        {"text": "正确选项", "correct": true, "feedback": "解释为什么对，给鼓励"},
        {"text": "错误选项B", "correct": false, "feedback": "解释为什么错"}
    ]
}

注意：
- 描述要具体，像真实发生的事情
- 选项要贴近老人的真实选择
- feedback要用大白话解释，让老人能听懂
- 不要输出任何其他文字，只输出JSON`
                },
                parameters: {}
            }),
            agent: agent,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`AI生成失败: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (data.code) {
            throw new Error(`平台业务错误：${data.code} ${data.message}`);
        }
        
        let content = data.output.text;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const question = JSON.parse(content);
            question.id = Date.now();
            res.json({ success: true, question });
        } catch (parseError) {
            console.error('JSON解析失败:', content);
            throw new Error('生成的题目格式不正确');
        }
        
    } catch (error) {
        console.error('AI生成题目失败:', error);
        if (error.name === 'AbortError') {
            res.status(504).json({ success: false, content: '生成题目超时，请稍后再试' });
        } else {
            res.status(500).json({
                success: false,
                content: '生成题目失败，请稍后重试'
            });
        }
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行正常' });
});

app.post('/api/generate-ai-quiz', async (req, res) => {

    const url = `https://dashscope.aliyuncs.com/api/v1/apps/${API_CONFIG.QUIZ_APP_ID}/completion`;

    const agent = new https.Agent({
        rejectUnauthorized: false // 本地调试关闭，线上改为true
    });

    const systemPrompt = `你是一个防骗教育专家。请生成1道适合老年人做的防骗情景模拟选择题。
每道题包含：情景描述、3个选项（1个正确2个错误）、每个选项的详细反馈。
骗局类型要多样化，包括但不限于：冒充公检法、保健品推销、中奖诈骗、冒充熟人、
投资理财诈骗、上门服务诈骗、网络钓鱼、情感诈骗等。
请严格返回JSON对象格式，不要有其他内容。

格式示例：

{
    "title": "标题",
    "description": "情景描述",
    "options": [
        {"text": "选项A", "correct": false, "feedback": "反馈"},
        {"text": "选项B", "correct": true, "feedback": "反馈"},
        {"text": "选项C", "correct": false, "feedback": "反馈"}
    ]
}`;


    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: {
                    prompt: systemPrompt
                },
                parameters: {
                    temperature: 0.7,
                    max_tokens: 2000
                }
            }),
            agent: agent
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('=== AI生成题目错误详情 ===');
            console.log('状态码:', response.status);
            console.log('错误响应:', JSON.stringify(errorData, null, 2));
            console.log('请求URL:', url);
            console.log('=== 错误详情结束 ===');
            throw new Error(`AI生成失败: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (data.code) {
            throw new Error(`平台业务错误：${data.code} ${data.message}`);
        }
        
        let quizText = data.output.text;
        
        quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        let quizData = JSON.parse(quizText);
        
        if (!quizData || typeof quizData !== 'object' || !quizData.title || !quizData.options) {
            throw new Error('AI返回格式错误：不是有效的题目对象');
        }

        res.json({
            success: true,
            data: quizData
        });

    } catch (error) {
        console.error('AI生成题目失败:', error);
        res.json({
            success: false,
            message: 'AI生成失败，使用本地题库'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 银发守护者后端服务已启动`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`� API接口:`);
    console.log(`   - POST /api/health-consult (健康咨询)`);
    console.log(`   - POST /api/image-recognition (图片识别)`);
    console.log(`   - POST /api/generate-scam-question (AI生成防骗题)`);
    console.log(`   - POST /api/generate-ai-quiz (AI生成防骗情景题)`);
    console.log(`   - GET /api/health (健康检查)`);
});