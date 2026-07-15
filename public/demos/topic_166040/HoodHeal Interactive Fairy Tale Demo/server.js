const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 从环境变量或配置文件读取API密钥
require('dotenv').config();

// 初始化OpenAI客户端
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// 童话风格提示词
const storySystemPrompt = `
你是一个温柔的童话作家，擅长根据儿童的情绪创作温馨的互动故事。

规则：
1. 故事必须有明确的主角（动物角色）
2. 包含至少2个选择分支
3. 所有选择都导向正向结局
4. 语言要简单、温暖，适合4-10岁儿童
5. 故事长度适中（约300-500字）
6. 传递积极价值观（友谊、勇气、感恩等）
7. 包含具体的场景描述

输出格式：
{
  "character": "角色名称（如：小熊贝贝）",
  "characterEmoji": "角色表情（如：🐻）",
  "scene": "当前场景描述",
  "choices": [
    {"text": "选项1", "nextSceneId": "scene2", "endingType": "friendship"},
    {"text": "选项2", "nextSceneId": "scene3", "endingType": "courage"}
  ]
}
`;

// 生成故事
app.post('/api/generate-story', async (req, res) => {
    try {
        const { emotion } = req.body;
        
        if (!emotion) {
            return res.status(400).json({ error: '请输入情绪关键词' });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: storySystemPrompt },
                { role: 'user', content: `请根据情绪「${emotion}」生成一个互动童话，包含2个选择分支。` }
            ],
            temperature: 0.8,
            response_format: { type: 'json_object' }
        });

        const storyData = JSON.parse(response.choices[0].message.content);
        res.json(storyData);
        
    } catch (error) {
        console.error('生成故事失败:', error);
        res.status(500).json({ 
            error: '生成故事失败，请稍后重试',
            fallback: generateFallbackStory(emotion)
        });
    }
});

// 生成后续场景
app.post('/api/continue-story', async (req, res) => {
    try {
        const { emotion, character, characterEmoji, previousScene, choice } = req.body;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: storySystemPrompt },
                { role: 'user', content: `继续故事：角色${character}(${characterEmoji})，情绪${emotion}，上一场景：${previousScene}，选择：${choice}。请生成下一个场景，包含2个选择分支。` }
            ],
            temperature: 0.8,
            response_format: { type: 'json_object' }
        });

        const sceneData = JSON.parse(response.choices[0].message.content);
        res.json(sceneData);
        
    } catch (error) {
        console.error('生成场景失败:', error);
        res.status(500).json({ 
            error: '生成场景失败，请稍后重试',
            fallback: generateFallbackScene(emotion, character, characterEmoji, choice)
        });
    }
});

// 生成结局
app.post('/api/generate-ending', async (req, res) => {
    try {
        const { emotion, character, characterEmoji, endingType } = req.body;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: `你是一个温柔的童话作家。请根据情绪和结局类型生成一个温暖的正向结局。输出格式：{"emoji": "表情", "title": "结局标题", "content": "结局内容", "moral": "成长启示"}` },
                { role: 'user', content: `角色${character}(${characterEmoji})，情绪${emotion}，结局类型${endingType}。请生成一个温暖的正向结局和成长启示。` }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const endingData = JSON.parse(response.choices[0].message.content);
        res.json(endingData);
        
    } catch (error) {
        console.error('生成结局失败:', error);
        res.status(500).json({ 
            error: '生成结局失败，请稍后重试',
            fallback: generateFallbackEnding(emotion, character, characterEmoji, endingType)
        });
    }
});

// 生成场景插画描述（用于调用图像生成API）
app.post('/api/generate-image-prompt', async (req, res) => {
    try {
        const { sceneDescription, emotion } = req.body;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: '你是一个插画师，擅长将文字描述转换为图像生成提示词。请输出适合儿童绘本风格的详细描述。' },
                { role: 'user', content: `请根据场景描述生成图像提示词：${sceneDescription}，情绪：${emotion}。风格：儿童绘本、温馨、色彩丰富。` }
            ],
            temperature: 0.7
        });

        res.json({ prompt: response.choices[0].message.content });
        
    } catch (error) {
        console.error('生成图像提示词失败:', error);
        res.status(500).json({ 
            error: '生成图像提示词失败',
            prompt: `A cute children's book illustration of ${sceneDescription}, colorful, warm style`
        });
    }
});

// 情感分析
app.post('/api/analyze-emotion', async (req, res) => {
    try {
        const { text } = req.body;

        // 使用简单规则匹配情绪
        const emotionKeywords = {
            '难过': ['伤心', '难过', '不开心', '委屈', '失落', '伤心欲绝', '闷闷不乐'],
            '孤单': ['孤单', '孤独', '寂寞', '一个人', '没人陪'],
            '生气': ['生气', '愤怒', '发火', '烦躁', '怒火'],
            '紧张': ['紧张', '害怕', '担心', '焦虑', '不安'],
            '害怕': ['害怕', '恐惧', '胆小', '惊恐'],
            '开心': ['开心', '快乐', '高兴', '幸福', '兴奋']
        };

        let matchedEmotion = '难过';
        for (const [key, keywords] of Object.entries(emotionKeywords)) {
            if (keywords.some(k => text.includes(k))) {
                matchedEmotion = key;
                break;
            }
        }

        res.json({ emotion: matchedEmotion, confidence: 0.85 });
        
    } catch (error) {
        console.error('情感分析失败:', error);
        res.status(500).json({ emotion: '难过', confidence: 0.5 });
    }
});

// 回退故事生成（当API不可用时）
function generateFallbackStory(emotion) {
    const characters = [
        { name: '小熊贝贝', emoji: '🐻' },
        { name: '小兔朵朵', emoji: '🐰' },
        { name: '小狐狸闪闪', emoji: '🦊' }
    ];
    const char = characters[Math.floor(Math.random() * characters.length)];
    
    const stories = {
        '难过': {
            character: char.name,
            characterEmoji: char.emoji,
            scene: `在一片美丽的森林里，住着一只可爱的${char.emoji}${char.name}。今天，${char.name}看起来有点不开心，因为它刚刚不小心弄丢了自己最心爱的彩虹围巾。它坐在大树下，眼泪吧嗒吧嗒地掉下来。`,
            choices: [
                { text: '继续寻找彩虹围巾', nextSceneId: 'scene2', endingType: 'persistence' },
                { text: '问问森林里的朋友', nextSceneId: 'scene3', endingType: 'friendship' }
            ]
        },
        '孤单': {
            character: char.name,
            characterEmoji: char.emoji,
            scene: `在一片宁静的森林里，${char.emoji}${char.name}独自坐在草地上。周围的小动物们都在开心地玩耍，但${char.name}却觉得自己好像不属于这里。`,
            choices: [
                { text: '主动和小动物们打招呼', nextSceneId: 'scene2', endingType: 'initiative' },
                { text: '继续观察大家玩耍', nextSceneId: 'scene3', endingType: 'observation' }
            ]
        },
        '生气': {
            character: char.name,
            characterEmoji: char.emoji,
            scene: `${char.emoji}${char.name}今天非常生气！因为它辛辛苦苦搭建的小房子被一场暴风雨弄坏了。看着满地的木屑，${char.name}气得直跺脚。`,
            choices: [
                { text: '深呼吸冷静下来', nextSceneId: 'scene2', endingType: 'calm' },
                { text: '找猫头鹰爷爷帮忙', nextSceneId: 'scene3', endingType: 'learning' }
            ]
        },
        '开心': {
            character: char.name,
            characterEmoji: char.emoji,
            scene: `今天是${char.emoji}${char.name}的生日！森林里的小动物们都来为它庆祝。${char.name}穿着漂亮的衣服，看着朋友们送来的礼物，心里充满了幸福。`,
            choices: [
                { text: '感谢每一位朋友', nextSceneId: 'scene2', endingType: 'gratitude' },
                { text: '和大家分享生日蛋糕', nextSceneId: 'scene3', endingType: 'sharing' }
            ]
        }
    };
    
    return stories[emotion] || stories['难过'];
}

function generateFallbackScene(emotion, character, characterEmoji, choice) {
    return {
        character,
        characterEmoji,
        scene: `${characterEmoji}${character}选择了「${choice}」。这个选择让${character}学到了很重要的一课，它变得更加勇敢和坚强了。`,
        choices: [
            { text: '继续前进', nextSceneId: 'ending', endingType: 'courage' },
            { text: '回顾今天的经历', nextSceneId: 'ending', endingType: 'reflection' }
        ]
    };
}

function generateFallbackEnding(emotion, character, characterEmoji, endingType) {
    const endings = {
        'friendship': { emoji: '👭', title: '友谊之花', content: `${characterEmoji}${character}找到了真正的友谊。好朋友就是在你需要时陪伴你的人。`, moral: '💡 成长启示：真诚地对待他人，友谊就会像花朵一样绽放。' },
        'courage': { emoji: '🌟', title: '勇气之星', content: `${characterEmoji}${character}学会了勇敢地面对困难。每一次尝试都是成长。`, moral: '💡 成长启示：勇气不是没有恐惧，而是带着恐惧依然前行。' },
        'gratitude': { emoji: '🍀', title: '感恩之心', content: `${characterEmoji}${character}学会了珍惜身边的美好，幸福其实就在身边。`, moral: '💡 成长启示：感恩生活中的每一个小美好。' },
        'sharing': { emoji: '🎁', title: '分享之乐', content: `${characterEmoji}${character}发现分享会让快乐加倍，温暖会传递给每一个人。`, moral: '💡 成长启示：分享是快乐的源泉，给予比接受更幸福。' },
        'persistence': { emoji: '🌈', title: '坚持之美', content: `${characterEmoji}${character}懂得了坚持的意义，美好的事物终会出现。`, moral: '💡 成长启示：坚持下去，彩虹就在风雨后。' }
    };
    return endings[endingType] || endings['courage'];
}

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
