import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

const IMAGE_DIR = path.join(__dirname, '..', '..', 'public', 'images');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 确保图片目录存在
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

interface GenerateOptions {
  prompt: string;
  size?: string;
  filename?: string;
  negative_prompt?: string;
}

interface GenerateResult {
  success: boolean;
  url?: string;
  localPath?: string;
  error?: string;
}

/**
 * 下载URL内容到本地文件
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', (err) => { fs.unlinkSync(destPath); reject(err); });
    }).on('error', (err) => { fs.unlinkSync(destPath); reject(err); });
  });
}

/**
 * 调用Agnes API生成图片并保存到本地
 */
export async function generateImage(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, size = '1024x768', filename, negative_prompt } = options;

  if (!config.agnes.apiKey) {
    return { success: false, error: 'AGNES_API_KEY未配置' };
  }

  const apiUrl = `${config.agnes.apiBase}/v1/images/generations`;

  try {
    // 构建请求体
    const requestBody: any = {
      model: 'agnes-image-2.0-flash',
      prompt,
      size,
      extra_body: {
        response_format: 'url',
      },
    };

    // 如果提供了negative_prompt，添加到请求中
    if (negative_prompt) {
      requestBody.extra_body.negative_prompt = negative_prompt;
    }

    // 调用Agnes API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.agnes.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `API错误(${response.status}): ${errText}` };
    }

    const data = await response.json() as any;

    // 提取图片URL
    let imageUrl: string | null = null;
    if (data.data && data.data.length > 0 && data.data[0].url) {
      imageUrl = data.data[0].url;
    } else if (data.url) {
      imageUrl = data.url;
    }

    if (!imageUrl) {
      return { success: false, error: `API返回无图片URL: ${JSON.stringify(data)}` };
    }

    // 保存到本地
    const ext = '.png';
    const safeFilename = filename || `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const localFilename = safeFilename.endsWith(ext) ? safeFilename : safeFilename + ext;
    const localPath = path.join(IMAGE_DIR, localFilename);

    await downloadFile(imageUrl, localPath);

    const publicUrl = `${BASE_URL}/images/${localFilename}`;

    return {
      success: true,
      url: publicUrl,
      localPath,
    };
  } catch (err: any) {
    return { success: false, error: err.message || '未知错误' };
  }
}

/**
 * 批量生成图片
 */
export async function generateImages(
  prompts: Array<GenerateOptions & { id: string }>,
  onProgress?: (current: number, total: number, result: GenerateResult & { id: string }) => void,
): Promise<Array<GenerateResult & { id: string }>> {
  const results: Array<GenerateResult & { id: string }> = [];

  for (let i = 0; i < prompts.length; i++) {
    const item = prompts[i];
    const result = await generateImage({
      prompt: item.prompt,
      size: item.size,
      filename: item.filename,
    });
    const resultWithId = { ...result, id: item.id };
    results.push(resultWithId);

    if (onProgress) {
      onProgress(i + 1, prompts.length, resultWithId);
    }

    // 避免请求过快，间隔1秒
    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * 根据PBL模板信息生成prompt
 */
export function buildTemplatePrompt(template: {
  name: string;
  category: string;
  description: string;
  grade_level: string;
}): string {
  const categoryStyles: Record<string, string> = {
    science: 'clean laboratory or scientific illustration style, with experiment equipment, charts, and data visualizations',
    humanities: 'warm watercolor illustration style, with historical artifacts, cultural symbols, and literary elements',
    social: 'photographic documentary style, showing community interaction, diverse people collaborating, urban or natural settings',
    business: 'modern corporate illustration style, with business icons, charts, innovation symbols, professional environment',
  };

  const gradeLevels: Record<string, string> = {
    elementary: 'colorful and playful, suitable for children, with bright colors and simple shapes',
    middle: 'balanced and engaging, suitable for teenagers, with modern design elements',
    high: 'sophisticated and academic, suitable for high school students, with professional aesthetics',
    undergraduate: 'professional and research-oriented, suitable for university students, with clean academic design',
    graduate: 'cutting-edge and advanced, suitable for graduate researchers, with high-tech aesthetics',
  };

  const style = categoryStyles[template.category] || 'clean modern illustration style';
  const grade = gradeLevels[template.grade_level] || '';

  return `A professional educational illustration for a project-based learning module titled "${template.name}". ${template.description}. ${style}. ${grade}. The image should convey learning, discovery, and hands-on project work. Clean composition, flat design with subtle gradients, no text overlay.`;
}