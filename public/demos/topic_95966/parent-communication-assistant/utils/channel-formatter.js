import { CHANNELS } from './constants';

/**
 * 根据渠道格式化话术内容
 * @param {string} content - AI 生成的原始内容
 * @param {string} channelId - 渠道ID
 * @param {string} studentName - 学生姓名
 * @param {Object} settings - 教师设置信息
 * @returns {string} 格式化后的话术
 */
export function formatByChannel(content, channelId, studentName, settings = {}) {
  const channel = CHANNELS.find(c => c.id === channelId) || CHANNELS[0];
  let formatted = content;
  
  // 替换占位符
  formatted = formatted.replace(/XX/g, studentName);
  formatted = formatted.replace(/\{studentName\}/g, studentName);
  
  // 根据渠道进行特定格式化
  switch (channelId) {
    case 'wechat':
      formatted = formatWechat(formatted, studentName);
      break;
    case 'sms':
      formatted = formatSMS(formatted, studentName);
      break;
    case 'email':
      formatted = formatEmail(formatted, studentName, settings);
      break;
    case 'phone':
      formatted = formatPhone(formatted, studentName);
      break;
    default:
      formatted = formatWechat(formatted, studentName);
  }
  
  // 截断至渠道字数上限
  if (formatted.length > channel.maxLength) {
    formatted = formatted.substring(0, channel.maxLength - 3) + '...';
  }
  
  return formatted.trim();
}

function formatWechat(content, studentName) {
  // 微信：简洁段落，去除多余空行
  let text = content
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // 如果没有称呼，添加默认称呼
  if (!text.includes('家长')) {
    text = `${studentName}家长您好！\n\n${text}`;
  }
  
  return text;
}

function formatSMS(content, studentName) {
  // 短信：极度精简
  let text = content
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 去除修饰词和过渡语
  const redundantPatterns = [
    /首先，/g, /其次，/g, /最后，/g, /总的来说，/g,
    /希望您/g, /建议您/g, /此外，/g, /另外，/g
  ];
  redundantPatterns.forEach(pattern => {
    text = text.replace(pattern, '');
  });
  
  if (!text.includes('家长')) {
    text = `${studentName}家长您好，${text}`;
  }
  
  return text;
}

function formatEmail(content, studentName, settings) {
  const { teacherName = '', subject = '', grade = '' } = settings;
  
  let text = content.trim();
  
  // 确保有称呼
  if (!text.includes('家长')) {
    text = `${studentName}家长您好：\n\n${text}`;
  }
  
  // 添加落款
  const signature = teacherName ? `\n\n${teacherName}${subject ? `（${subject}老师）` : ''}` : '';
  text = text + signature;
  
  return text;
}

function formatPhone(content, studentName) {
  let text = content.trim();
  
  // 转换为要点式结构
  const sentences = text.split(/[。！？\n]+/).filter(s => s.trim());
  
  let points = sentences.map((s, i) => `${i + 1}. ${s.trim()}`);
  
  // 添加沟通注意事项
  points.push('\n【沟通注意事项】');
  points.push('• 语气平和，避免家长产生抵触情绪');
  points.push('• 先肯定优点，再提出问题');
  points.push('• 给家长具体的配合建议');
  
  return points.join('\n');
}
