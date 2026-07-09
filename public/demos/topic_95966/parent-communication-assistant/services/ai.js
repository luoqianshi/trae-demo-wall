import { buildPrompt } from '../utils/prompt-builder';
import { formatByChannel } from '../utils/channel-formatter';
import { getFallbackTemplate } from '../utils/fallback-templates';
import { GENERATE_LIMIT } from '../utils/constants';

// API 配置
const API_CONFIG = {
  protocol: 'https',
  host: 'api.deepseek.com',
  version: 'v1',
  model: 'deepseek-chat',
  timeout: 15000,
  maxTokens: 800,
  temperature: 0.7
};

const getBaseURL = () => `${API_CONFIG.protocol}://${API_CONFIG.host}/${API_CONFIG.version}`;

// 生成频率控制
let generateCount = 0;
let lastResetTime = Date.now();

/**
 * 检查生成频率限制
 * @returns {boolean} 是否允许生成
 */
function checkRateLimit() {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    generateCount = 0;
    lastResetTime = now;
  }
  
  if (generateCount >= GENERATE_LIMIT) {
    return false;
  }
  
  generateCount++;
  return true;
}

/**
 * 生成家长沟通话术
 * @param {Object} params - 生成参数
 * @param {string} params.scene - 场景ID
 * @param {string} params.style - 风格ID
 * @param {string} params.channel - 渠道ID
 * @param {string} params.studentName - 学生姓名
 * @param {string} params.description - 表现描述
 * @param {Object} params.settings - 教师设置
 * @returns {Promise<string>} 生成的话术
 */
export function generateMessage(params) {
  return new Promise((resolve, reject) => {
    // 检查频率限制
    if (!checkRateLimit()) {
      wx.showToast({
        title: '生成过于频繁，请稍后再试',
        icon: 'none',
        duration: 2000
      });
      reject(new Error('Rate limit exceeded'));
      return;
    }
    
    const prompt = buildPrompt({
      scene: params.scene,
      style: params.style,
      channel: params.channel,
      description: params.description
    });
    
    wx.request({
      url: `${getBaseURL()}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      data: {
        model: API_CONFIG.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant specialized in educational communication.' },
          { role: 'user', content: prompt }
        ],
        temperature: API_CONFIG.temperature,
        max_tokens: API_CONFIG.maxTokens
      },
      timeout: API_CONFIG.timeout,
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices[0]) {
          const content = res.data.choices[0].message.content;
          const formatted = formatByChannel(
            content,
            params.channel,
            params.studentName,
            params.settings
          );
          resolve(formatted);
        } else {
          reject(new Error(`API 错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(`请求失败: ${err.errMsg}`));
      }
    });
  });
}

/**
 * 生成话术（带错误处理和兜底）
 * @param {Object} params - 生成参数
 * @returns {Promise<Object>} { success, content, isFallback }
 */
export async function generateMessageWithFallback(params) {
  try {
    const content = await generateMessage(params);
    return {
      success: true,
      content,
      isFallback: false
    };
  } catch (err) {
    const fallbackContent = getFallbackTemplate(
      params.scene,
      params.style,
      params.studentName,
      params.description
    );
    
    return {
      success: true,
      content: fallbackContent,
      isFallback: true
    };
  }
}

/**
 * 获取 API Key
 */
function getApiKey() {
  return wx.getStorageSync('comm_api_token') || '';
}

/**
 * 设置 API Key
 * @param {string} key - API Key
 */
export function setApiKey(key) {
  wx.setStorageSync('comm_api_token', key);
}

/**
 * 检查是否已配置 API Key
 */
export function hasApiKey() {
  return !!getApiKey();
}
