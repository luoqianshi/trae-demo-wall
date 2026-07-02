const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'YOUR_API_KEY_HERE';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const systemPrompt = `你是一个专业的旅行规划助手"周末就出发"。

你的工作方式：
1. 当用户发送任何非出行需求的消息时（如问候、闲聊、提问等），请友好、专业地回应。返回JSON格式：{"type":"chat","reply":"你的回复内容"}
2. 只有当用户明确表达了出行需求（包含目的地、时间或出行意图，如"想去XX玩"、"周末去XX"、"规划XX行程"等）时，才生成行程计划。
3. 生成行程时，必须严格根据用户提供的实际需求（目的地、天数、预算、偏好等）来定制行程，不要套用固定模板。如果用户没说清楚细节，先以对话方式询问。
4. 返回纯JSON格式（不带type字段，不带markdown标记，不带代码块反引号），包含以下字段：
   - destination: 目的地城市（必须是用户指定的城市）
   - duration: 行程天数（根据用户描述，如"2天1晚"、"3天2晚"）
   - date: 出发日期（根据用户指定或默认即将到来的周末）
   - budget: 人均预算（根据用户预算或合理估算）
   - transport: 交通信息（去程go和回程back，根据用户出发地和目的地安排）
   - hotel: 酒店信息（符合预算档次）
   - days: 每天的行程安排数组，包含时间轴schedule。每个schedule项可以包含photoGuide字段（仅对景点和打卡类型），photoGuide包含：position(推荐机位)、composition(构图建议)、time(最佳拍摄时间)、tips(拍照小技巧数组)

判断规则：
- "你好"、"嗨"、"你是谁"、"今天天气怎么样"等 → 返回 {"type":"chat","reply":"..."}
- "想去青岛玩"、"周末去南京"、"帮我规划北京两日游"等 → 根据用户需求生成对应行程JSON
- 不确定时，先以对话方式询问用户的出行需求

重要：行程内容必须与用户指定的目的地、天数、预算一致。不要默认生成青岛行程。不要在JSON外包裹markdown代码块标记。为每个景点和打卡类型的行程项都生成photoGuide拍照指南数据。

行程JSON示例（仅作格式参考，实际内容必须根据用户需求生成）：
{
  "destination": "南京",
  "duration": "2天1晚",
  "date": "2024-06-22",
  "budget": "1000-1500元",
  "transport": {
    "go": {"type":"高铁","number":"G101","departure":"上海虹桥","arrival":"南京南","time":"08:00-09:30","price":134,"duration":"1小时30分"},
    "back": {"type":"高铁","number":"G102","departure":"南京南","arrival":"上海虹桥","time":"18:00-19:30","price":134,"duration":"1小时30分"}
  },
  "hotel": {"name":"南京新街口酒店","address":"秦淮区中山东路","tags":["近地铁","含早餐"],"price":358},
  "days": [{"day":"第一天","date":"6月22日","schedule":[{"time":"10:00","activity":"中山陵","type":"景点","location":"玄武区钟山风景区","description":"孙中山先生陵墓","photoSpot":true,"photoGuide":{"position":"陵墓正门前台阶上方，仰拍陵墓全貌","composition":"对称构图，人物站在中轴线上","time":"上午9:00-10:00光线柔和","tips":["穿素色衣服","台阶上行走抓拍","仰拍建筑","广角收纳全景"]}}]}]
}

请确保返回纯JSON，不要包含markdown标记（如反引号代码块）或其他文本。`;

// 动态上下文：注入当前日期，并强调必须结合多轮对话历史理解用户，避免"已读乱回"
function buildContext() {
  const now = new Date();
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekday}`;
  return `

【重要上下文】
- 今天是${dateStr}。当用户说"这周末""下周末""明天"等相对时间时，请据此推算出具体日期。
- 你会收到完整的多轮对话历史，请务必结合上下文理解用户的最新一句话。例如：用户先说想去某地，下一句只补充了天数或预算，你要把这些信息合并理解，绝不要忽略此前已提供的目的地/天数/预算/偏好，更不要答非所问。
- 若用户在已有行程的基础上提出修改（换目的地、加减天数、改预算、换酒店等），请基于之前的方案调整，而不是从头重来。
- 如果关键信息（尤其是目的地）仍然缺失，请用一句自然的话友好询问，不要凭空编造目的地。`;
}

app.post('/api/generate-trip', async (req, res) => {
  try {
    // 支持两种入参：messages（多轮对话历史，优先）或 message（单条消息，向后兼容）
    const history = Array.isArray(req.body.messages)
      ? req.body.messages
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-12)
      : null;
    const userInput = req.body.message;

    if ((!history || history.length === 0) && !userInput) {
      return res.status(400).json({ error: '请输入出行需求' });
    }

    const convo = (history && history.length)
      ? history
      : [{ role: 'user', content: userInput }];

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt + buildContext() },
          ...convo
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    const content = response.data.choices[0].message.content;

    // 清理AI返回内容中的markdown标记和多余文本，提取纯JSON
    function extractJSON(text) {
      if (!text) return null;
      let cleaned = text.trim();
      // 去除markdown代码块标记 ```json ... ``` 或 ``` ... ```
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
      // 如果还有其他文本，尝试找到第一个 { 和最后一个 } 之间的内容
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        return null;
      }
    }

    const tripData = extractJSON(content);
    if (tripData && tripData.type === 'chat' && tripData.reply) {
      // 模型选择了对话回应
      res.json({ type: 'chat', reply: tripData.reply });
    } else if (tripData && tripData.destination) {
      // 模型生成了行程
      res.json(tripData);
    } else {
      // 不是有效行程：把模型的自然语言回复直接作为对话内容返回，避免"已读乱回"
      let fallbackReply = (tripData && typeof tripData.reply === 'string')
        ? tripData.reply
        : (content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      if (!fallbackReply || fallbackReply.startsWith('{')) {
        console.error('JSON Parse Failed. Content:', (content || '').substring(0, 200));
        fallbackReply = '我可以帮你规划周末行程～告诉我你想去的城市、出发时间和预算，比如"这周末想去南京玩两天，预算1500"。';
      }
      res.json({ type: 'chat', reply: fallbackReply });
    }
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    res.json({
      type: 'chat',
      reply: '抱歉，网络连接出现问题，请稍后重试。'
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const userInput = req.body.message;
    if (!userInput) {
      return res.status(400).json({ error: '请输入消息' });
    }

    const chatSystemPrompt = `你是"周末就出发"智能旅行助手。用户正在和你聊天。
请友好、专业地回应用户。如果用户只是打招呼或闲聊，请礼貌回应并引导用户描述出行需求（目的地、时间、预算、偏好等）。
回复要简洁自然，像朋友聊天一样。不要生成行程，只做对话回应。
返回JSON格式：{"reply":"你的回复内容"}`;

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: chatSystemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.8,
        max_tokens: 512
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    const content = response.data.choices[0].message.content;
    try {
      const parsed = JSON.parse(content);
      res.json({ reply: parsed.reply || content });
    } catch {
      res.json({ reply: content });
    }
  } catch (error) {
    console.error('Chat API Error:', error.message);
    const fallbackReplies = {
      '你好': '你好！我是你的智能旅行助手。告诉我你想去哪里、什么时候出发，我来帮你规划完美行程！',
      '您好': '您好！很高兴为您服务。请告诉我您的出行需求，比如目的地、时间和预算，我来为您定制行程。',
      '嗨': '嗨！准备好周末出发了吗？告诉我你想去哪里玩，我来帮你安排一切！',
      'hi': 'Hi！我是你的旅行助手，想好周末去哪玩了吗？告诉我你的想法吧！',
      'hello': 'Hello！我是你的智能旅行助手。想去哪里度周末？我来帮你规划！',
      '你是谁': '我是"周末就出发"的智能旅行助手，专门帮你规划周末出行。告诉我你的目的地和时间，我就能为你生成专属行程！'
    };
    const input = userInput || '';
    const reply = fallbackReplies[input.toLowerCase().trim()] || '你好！我是你的智能旅行助手。告诉我你想去哪里、什么时候出发，我来帮你规划完美行程！';
    res.json({ reply });
  }
});

app.get('/api/time', (req, res) => {
  const now = new Date();
  res.json({
    time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    timestamp: now.getTime()
  });
});

app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
