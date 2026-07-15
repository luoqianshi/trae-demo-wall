// AI 视觉识别服务
// 实际开发中接入多模态大模型 API（豆包/通义/GPT-4V）

const MOCK_DELAY = 1500;

export async function analyzeScene(imageUri) {
  // TODO: 接入真实 AI 视觉 API
  // const response = await fetch('https://api.doubao.com/vision', {...})
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const scenes = [
        { object: '盲道', distance: '脚下', action: '沿盲道直行' },
        { object: '台阶', distance: '前方2米', action: '注意，前方有台阶，请抬脚' },
        { object: '施工围挡', distance: '前方5米', action: '前方施工，请从右侧绕行' },
        { object: '红绿灯', distance: '前方10米', action: '红灯，请等待' },
        { object: '门店招牌', distance: '前方右侧', action: '星巴克咖啡，已到达目标附近' },
        { object: '公交车', distance: '前方站台', action: '52路公交车已到达' },
      ];
      resolve(scenes[Math.floor(Math.random() * scenes.length)]);
    }, MOCK_DELAY);
  });
}

export async function recognizeText(imageUri) {
  // OCR 识别：门店招牌、车牌号、公交站牌等
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ text: '星巴克咖啡', confidence: 0.95 });
    }, MOCK_DELAY);
  });
}