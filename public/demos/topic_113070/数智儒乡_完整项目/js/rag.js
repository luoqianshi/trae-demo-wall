const ZHIPU_API_KEY = 'b32b94eca5ee44a4bed31b5c7d7faf21.4Ih46kKp8A4N2xcr';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

let currentChatMessages = [];

function createPetals() {
  const container = document.getElementById('petals');
  if (!container) return;

  const petalCount = 15;
  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + '%';
    petal.style.animationDuration = (8 + Math.random() * 12) + 's';
    petal.style.animationDelay = Math.random() * 10 + 's';
    petal.style.width = (8 + Math.random() * 8) + 'px';
    petal.style.height = petal.style.width;
    container.appendChild(petal);
  }
}

async function callZhipuAPI(messages) {
  try {
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ZHIPU_API_KEY
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('API request failed: ' + response.status);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Zhipu API error:', error);
    return '抱歉，我现在无法回答您的问题，请稍后再试。';
  }
}

function formatAnswer(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

document.addEventListener('DOMContentLoaded', () => {
  createPetals();
});

window.ZHIPU_API_KEY = ZHIPU_API_KEY;
window.callZhipuAPI = callZhipuAPI;
window.formatAnswer = formatAnswer;
window.createPetals = createPetals;