const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let config;
let prompts;

function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('配置文件 config.json 不存在');
        }
        
        const configData = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configData);
        
        if (!config.api || !config.api.endpoint || !config.api.apiKey || !config.api.model) {
            throw new Error('配置文件缺少必要的API配置（endpoint, apiKey, model）');
        }
        
        if (!config.api.endpoint.startsWith('http')) {
            throw new Error('API端点地址格式错误，必须以 http:// 或 https:// 开头');
        }
        
        if (config.api.apiKey === 'sk-your-api-key-here' || !config.api.apiKey.startsWith('sk-')) {
            throw new Error('API密钥无效，请在 config.json 中填写正确的 sk-... 密钥');
        }
        
        console.log('✅ 配置文件加载成功');
        console.log(`   API端点: ${config.api.endpoint}`);
        console.log(`   模型名称: ${config.api.model}`);
        console.log(`   密钥: ${config.api.apiKey.substring(0, 8)}...`);
        
        return true;
    } catch (error) {
        console.error('❌ 配置文件错误:', error.message);
        console.error('\n请编辑 config.json 文件，填写正确的API配置：');
        console.error('  - endpoint: OpenAI API地址 (如 https://api.openai.com/v1/chat/completions)');
        console.error('  - apiKey: 以 sk- 开头的API密钥');
        console.error('  - model: 模型名称 (如 gpt-4o)');
        return false;
    }
}

function parseMarkdownPrompt(content) {
    const systemMatch = content.match(/## System Prompt\s*\n([\s\S]*?)(?=## User Prompt)/);
    const userMatch = content.match(/## User Prompt\s*\n([\s\S]*)$/);

    return {
        system: systemMatch ? systemMatch[1].trim() : '',
        user: userMatch ? userMatch[1].trim() : ''
    };
}

function loadPrompts() {
    try {
        const promptDir = path.join(__dirname, 'prompt');
        if (!fs.existsSync(promptDir)) {
            throw new Error('提示词目录 prompt/ 不存在');
        }
        
        const requiredPrompts = ['extract', 'geolocation', 'people', 'text', 'environment', 'overview'];
        prompts = {};
        
        for (const name of requiredPrompts) {
            const filePath = path.join(promptDir, `${name}.md`);
            if (!fs.existsSync(filePath)) {
                throw new Error(`提示词文件 prompt/${name}.md 不存在`);
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            prompts[name] = parseMarkdownPrompt(content);
        }
        
        console.log('✅ 提示词文件加载成功');
        console.log(`   已加载 ${Object.keys(prompts).length} 个提示词（1个提取 + 4个维度 + 1个总览）`);
        console.log(`   提示词目录: prompt/`);
        
        return true;
    } catch (error) {
        console.error('❌ 提示词文件错误:', error.message);
        return false;
    }
}

async function validateApiConnection() {
    try {
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const requestBody = {
            model: config.api.model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Hi' },
                        { type: 'image_url', image_url: { url: testImage } }
                    ]
                }
            ],
            max_tokens: 5
        };
        
        const url = new URL(config.api.endpoint);
        const protocol = url.protocol === 'https:' ? https : http;
        
        return new Promise((resolve, reject) => {
            const req = protocol.request({
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.api.apiKey}`
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.error) {
                            reject(new Error(result.error.message));
                        } else {
                            resolve(true);
                        }
                    } catch (e) {
                        reject(new Error('API响应格式错误'));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(JSON.stringify(requestBody));
            req.end();
        });
    } catch (error) {
        throw error;
    }
}

async function callAIModel(messages, maxTokens = 4096, temperature = null) {
    const requestBody = {
        model: config.api.model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature !== null ? temperature : (config.api.temperature || 0.7)
    };

    // 统计请求信息（用于调试）
    const bodyStr = JSON.stringify(requestBody);
    const hasImage = messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );
    console.log(`  📤 API请求: ${bodyStr.length} 字节 | 含图片: ${hasImage} | 消息数: ${messages.length}`);

    const url = new URL(config.api.endpoint);
    const protocol = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const req = protocol.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'Authorization': `Bearer ${config.api.apiKey}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`  📥 API响应: HTTP ${res.statusCode} | ${data.length} 字节`);

                if (res.statusCode !== 200) {
                    console.error('  ⚠️ 非200响应，内容前500字:', data.substring(0, 500));
                    reject(new Error(`API返回 HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                    return;
                }

                try {
                    const result = JSON.parse(data);
                    if (result.error) {
                        console.error('  ⚠️ API返回错误:', JSON.stringify(result.error));
                        reject(new Error(result.error.message || JSON.stringify(result.error)));
                        return;
                    }
                    if (!result.choices || !result.choices[0]) {
                        console.error('  ⚠️ API响应无choices，前500字:', data.substring(0, 500));
                        reject(new Error('API响应缺少 choices 字段'));
                        return;
                    }
                    const message = result.choices[0].message;
                    let content = message.content || '';
                    const reasoning = message.reasoning_content || '';

                    // 如果 content 为空但有 reasoning_content，尝试从 reasoning 中提取 JSON
                    if (!content && reasoning) {
                        console.log('  ℹ️ content 为空，尝试从 reasoning_content 提取内容');
                        console.log('  ℹ️ reasoning 片段（前300字）:', reasoning.substring(0, 300));
                        content = reasoning;
                    }

                    if (!content) {
                        console.error('  ⚠️ API响应 content 为空，完整响应:', data.substring(0, 500));
                        reject(new Error('API返回内容为空'));
                        return;
                    }
                    resolve(content);
                } catch (e) {
                    console.error('  ⚠️ JSON解析失败，原始响应前500字:', data.substring(0, 500));
                    reject(new Error('API响应格式错误: ' + e.message));
                }
            });
        });

        req.on('error', (err) => {
            console.error('  ⚠️ 网络请求错误:', err.message);
            reject(err);
        });

        req.write(bodyStr);
        req.end();
    });
}

function extractJSON(text) {
    if (!text || typeof text !== 'string') return null;

    // 去除 markdown 代码块标记 ```json ... ``` 或 ``` ... ```
    let cleaned = text.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
    }

    // 尝试直接解析
    try {
        return JSON.parse(cleaned);
    } catch (e) { /* 继续尝试 */ }

    // 提取第一个 { ... } 块（贪婪到最后一个 }）
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        let candidate = jsonMatch[0];
        // 移除单行注释 // ...
        candidate = candidate.replace(/\/\/[^\n\r]*/g, '');
        // 移除多行注释 /* ... */
        candidate = candidate.replace(/\/\*[\s\S]*?\*\//g, '');
        // 移除尾随逗号（对象和数组末尾的 ,）
        candidate = candidate.replace(/,(\s*[}\]])/g, '$1');
        // 单引号转双引号（简单替换，注意转义引号）
        candidate = candidate.replace(/(?<!\\)'/g, '"');

        try {
            return JSON.parse(candidate);
        } catch (e) {
            console.error('⚠️ JSON 解析失败，原始内容片段:', candidate.substring(0, 300));
            return null;
        }
    }
    return null;
}

function buildMessages(promptKey, imageData, variables = {}) {
    const prompt = prompts[promptKey];
    if (!prompt) {
        throw new Error(`未找到提示词: ${promptKey}`);
    }
    
    let userPrompt = prompt.user;
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        const val = typeof value === 'string' ? value : JSON.stringify(value);
        userPrompt = userPrompt.split(placeholder).join(val);
    }
    
    const messages = [
        {
            role: 'system',
            content: prompt.system
        }
    ];
    
    if (imageData) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: imageData } }
            ]
        });
    } else {
        messages.push({
            role: 'user',
            content: userPrompt
        });
    }
    
    return messages;
}

async function extractImageInfo(imageData, exifText = '') {
    const variables = exifText ? { exifInfo: exifText } : {};
    const messages = buildMessages('extract', imageData, variables);
    const response = await callAIModel(messages, 4096);
    console.log('  📋 extract 原始返回（前200字）:', response.substring(0, 200));
    const result = extractJSON(response);
    if (!result) {
        console.error('  ⚠️ extract JSON 解析失败，使用默认值');
        return {
            availableDimensions: ['people', 'geolocation', 'text', 'environment'],
            basicDescription: '',
            extractedInfo: { people: '', geolocation: '', text: '', environment: '' }
        };
    }
    if (!Array.isArray(result.availableDimensions)) {
        result.availableDimensions = ['people', 'geolocation', 'text', 'environment'];
    }
    return result;
}

async function analyzeGeolocation(imageData, exifText = '', overviewInfo = '') {
    const variables = {};
    if (exifText) variables.exifInfo = exifText;
    if (overviewInfo) variables.overviewInfo = overviewInfo;
    const messages = buildMessages('geolocation', imageData, variables);
    const response = await callAIModel(messages, 4096);
    console.log('  📍 geolocation 原始返回（前200字）:', response.substring(0, 200));
    const result = extractJSON(response);
    if (!result) {
        return {
            location: '未知', landmark: '未知', environment: '未知',
            coordinates: null, relatedPlaces: [], country: '未知', city: '未知'
        };
    }
    // 确保 coordinates 是对象或 null
    if (result.coordinates && typeof result.coordinates === 'object') {
        // 验证 lat/lng 是数字
        const lat = parseFloat(result.coordinates.lat);
        const lng = parseFloat(result.coordinates.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            result.coordinates = { lat, lng, source: result.coordinates.source || 'ai_inferred' };
        } else {
            result.coordinates = null;
        }
    } else if (typeof result.coordinates === 'string') {
        // 兼容旧格式 "30.2592°N, 120.1303°E"
        const m = result.coordinates.match(/(-?\d+\.?\d*)[°\s]*[NS]?[,\s]+(-?\d+\.?\d*)[°\s]*[EW]?/i);
        if (m) {
            result.coordinates = { lat: parseFloat(m[1]), lng: parseFloat(m[2]), source: 'ai_inferred' };
        } else {
            result.coordinates = null;
        }
    } else {
        result.coordinates = null;
    }
    return result;
}

async function analyzePeople(imageData, exifText = '') {
    const variables = exifText ? { exifInfo: exifText } : {};
    const messages = buildMessages('people', imageData, variables);
    // 人物识别使用低温度提升稳定性和准确性
    const response = await callAIModel(messages, 4096, 0.2);
    console.log('  👤 people 原始返回（前200字）:', response.substring(0, 200));
    const defaultResult = {
        count: 0, isCelebrity: false, celebrityInfo: null,
        descriptions: [], activities: [], emotions: [],
        relationships: '未知', ageRange: '未知', gender: '未知'
    };
    const result = extractJSON(response);
    if (!result) return defaultResult;
    // 兜底校验：确保 isCelebrity 与 celebrityInfo 一致
    if (!result.isCelebrity) {
        result.celebrityInfo = null;
    } else if (result.isCelebrity && !result.celebrityInfo) {
        result.isCelebrity = false;
    }
    // 置信度 < 0.8 强制降级为非名人
    if (result.celebrityInfo && typeof result.celebrityInfo.confidence === 'number'
        && result.celebrityInfo.confidence < 0.8) {
        result.isCelebrity = false;
        result.celebrityInfo = null;
    }
    return result;
}

async function analyzeText(imageData, exifText = '') {
    const variables = exifText ? { exifInfo: exifText } : {};
    const messages = buildMessages('text', imageData, variables);
    const response = await callAIModel(messages, 4096);
    console.log('  📝 text 原始返回（前200字）:', response.substring(0, 200));
    return extractJSON(response) || { detected: [], signs: [], language: '未知' };
}

async function analyzeEnvironment(imageData, exifText = '') {
    const variables = exifText ? { exifInfo: exifText } : {};
    const messages = buildMessages('environment', imageData, variables);
    const response = await callAIModel(messages, 4096);
    console.log('  🌳 environment 原始返回（前200字）:', response.substring(0, 200));
    return extractJSON(response) || {
        type: '未知', category: '未知', purpose: '未知',
        period: '未知', season: '未知', weather: '未知', lighting: '未知',
        features: [], atmosphere: '未知'
    };
}

async function generateOverview(basicDescription, allAnalysis) {
    const messages = buildMessages('overview', null, {
        basicDescription: basicDescription || '',
        geo: allAnalysis.geo || null,
        person: allAnalysis.person || null,
        text: allAnalysis.text || null,
        environment: allAnalysis.environment || null
    });

    const response = await callAIModel(messages, 4096);
    console.log('  📊 overview 原始返回（前200字）:', response.substring(0, 200));
    return extractJSON(response) || {
        description: '分析完成', tags: ['AI分析'], confidence: 0.8,
        purpose: '未知', context: '未知', story: '未知'
    };
}

// 将 EXIF 拍摄信息格式化为可读文本（供 AI 参考）
function formatExifForAI(exif) {
    if (!exif) return '';
    const parts = [];
    if (exif.dateTime) parts.push(`拍摄时间: ${exif.dateTime}`);
    if (exif.makeModel) parts.push(`拍摄设备: ${exif.makeModel}`);
    if (exif.lens) parts.push(`镜头: ${exif.lens}`);
    if (exif.exposure) parts.push(`快门: ${exif.exposure}`);
    if (exif.fNumber) parts.push(`光圈: ${exif.fNumber}`);
    if (exif.iso) parts.push(`感光度: ${exif.iso}`);
    if (exif.focalLength) parts.push(`焦距: ${exif.focalLength}`);
    if (exif.gps) {
        const alt = exif.gps.alt !== null ? ` 海拔 ${exif.gps.alt}m` : '';
        parts.push(`GPS 坐标: ${exif.gps.lat}, ${exif.gps.lon}${alt}`);
    }
    return parts.join('\n');
}

// 返回前端需要的公共配置（高德地图 key 等）
app.get('/api/config', (req, res) => {
    res.json({
        amap: {
            key: (config.amap && config.amap.key) || '',
            securityJsCode: (config.amap && config.amap.securityJsCode) || ''
        }
    });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { imageData, exif } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        console.log('🔍 开始分析图片...');
        const exifText = formatExifForAI(exif);
        if (exifText) {
            console.log('  📷 检测到 EXIF 拍摄信息:');
            exifText.split('\n').forEach(line => console.log('     ' + line));
        } else {
            console.log('  📷 未检测到 EXIF 拍摄信息');
        }

        // 第一步：提取图片信息，判断可分析维度
        console.log('  📋 提取图片信息...');
        const extractResult = await extractImageInfo(imageData, exifText);
        const availableDimensions = extractResult.availableDimensions;
        console.log(`     可分析维度: ${availableDimensions.join(', ')}`);

        // 第二步：根据可分析维度，分别调用对应的分析
        const allAnalysis = {};

        // 构造概览信息（供地理分析参考）
        const overviewInfo = [
            `基础描述: ${extractResult.basicDescription || '无'}`,
            `提取的地理线索: ${extractResult.extractedInfo?.geolocation || '无'}`,
            `提取的人物线索: ${extractResult.extractedInfo?.people || '无'}`,
            `提取的文字线索: ${extractResult.extractedInfo?.text || '无'}`,
            `提取的环境线索: ${extractResult.extractedInfo?.environment || '无'}`
        ].join('\n');

        if (availableDimensions.includes('geolocation')) {
            console.log('  📍 分析地理位置...');
            allAnalysis.geo = await analyzeGeolocation(imageData, exifText, overviewInfo);
        }

        if (availableDimensions.includes('people')) {
            console.log('  👤 分析人物信息...');
            allAnalysis.person = await analyzePeople(imageData, exifText);
        }

        if (availableDimensions.includes('text')) {
            console.log('  📝 提取文字信息...');
            allAnalysis.text = await analyzeText(imageData, exifText);
        }

        if (availableDimensions.includes('environment')) {
            console.log('  🌳 分析环境信息...');
            allAnalysis.environment = await analyzeEnvironment(imageData, exifText);
        }
        
        // 第三步：生成全景描述
        console.log('  📊 生成全景描述...');
        const overview = await generateOverview(extractResult.basicDescription, allAnalysis);
        
        console.log('✅ 分析完成！');
        
        const result = {
            overview,
            extract: {
                availableDimensions,
                basicDescription: extractResult.basicDescription,
                extractedInfo: extractResult.extractedInfo
            },
            geo: allAnalysis.geo || null,
            person: allAnalysis.person || null,
            text: allAnalysis.text || null,
            environment: allAnalysis.environment || null
        };
        
        res.json(result);
        
    } catch (error) {
        console.error('分析失败:', error);
        res.status(500).json({ error: error.message || '分析失败' });
    }
});

const PORT = config?.server?.port || 3000;
const HOST = config?.server?.host || 'localhost';

if (loadConfig() && loadPrompts()) {
    console.log('\n🔍 正在验证API连接...');
    
    validateApiConnection()
        .then(() => {
            console.log('✅ API连接验证成功！\n');
            
            app.listen(PORT, HOST, () => {
                console.log(`🚀 服务器已启动`);
                console.log(`   地址: http://${HOST}:${PORT}`);
                console.log(`   按 Ctrl+C 停止服务器\n`);
            });
        })
        .catch((error) => {
            console.error('❌ API连接验证失败:', error.message);
            console.error('\n请检查 config.json 中的配置是否正确\n');
            process.exit(1);
        });
} else {
    process.exit(1);
}
