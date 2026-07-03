// ==================== API 调用层 ====================
// 兼容OpenAI格式的API调用

/**
 * 调用视觉模型分析图片
 * @param {string} imageBase64 - base64编码的图片
 * @param {string} prompt - 提示词
 * @returns {Promise<string>} - 模型返回的文本
 */
async function callVisionModel(imageBase64, prompt) {
  const { baseUrl, apiKey, visionModel } = getApiConfig();
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const url = `${baseUrl}/chat/completions`;
  
  const body = {
    model: visionModel,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`视觉模型调用失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 调用对话模型
 * @param {Array} messages - 消息数组 [{role: 'user'|'assistant'|'system', content: ''}]
 * @param {object} options - 可选参数 { temperature, max_tokens }
 * @returns {Promise<string>} - 模型返回的文本
 */
async function callChatModel(messages, options = {}) {
  const { baseUrl, apiKey, chatModel } = getApiConfig();
  
  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const url = `${baseUrl}/chat/completions`;
  
  const body = {
    model: chatModel,
    messages: messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 1000
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`对话模型调用失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 图片压缩并转base64
 * @param {File} file - 图片文件
 * @param {number} maxSize - 最大边长(像素)
 * @param {number} quality - 质量 0-1
 * @returns {Promise<{base64: string, width: number, height: number}>}
 */
async function imageToBase64(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // 等比缩放
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          } else {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', quality)
          .replace(/^data:image\/jpeg;base64,/, '');
        
        resolve({ base64, width, height });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
