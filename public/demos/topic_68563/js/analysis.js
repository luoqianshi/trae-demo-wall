// ==================== AI 分析模块 ====================
// 负责调用视觉模型分析照片，生成结构化描述和故事

// 照片分析提示词
const VISION_PROMPT = `请仔细分析这张照片，用中文输出JSON格式的分析结果，包含以下字段：
{
  "description": "一句话描述照片内容（不超过50字）",
  "subjects": ["照片中的主要人物或物体"],
  "scene": "场景类型（如：室内/户外/医院/海边/家庭/学校等）",
  "event_type": "事件类型（如：出生/生日/旅行/日常/聚会/节日等）",
  "emotion": "整体情绪氛围（如：温馨/欢乐/感动/平静等）",
  "people_count": 人物数量,
  "has_baby": true/false,
  "has_old_people": true/false,
  "is_family": true/false,
  "key_moments": ["2-3个关键细节或亮点"],
  "story_hint": "如果这是一个值得记录的时刻，用一句话描述它可能的故事（不超过30字）"
}

只输出JSON，不要输出其他内容。`;

// 故事生成提示词模板
const STORY_PROMPT_TEMPLATE = `你是一个温暖的"时光说书人"，擅长从照片中挖掘动人的故事。

以下是一组家庭照片的分析结果，请为每张照片写一段有温度的故事旁白。

要求：
1. 每段旁白50-100字，温暖、细腻、有画面感
2. 用第二人称"你"来叙述，像在对家人说话
3. 结合照片内容和生活常识，合理想象当时的情境
4. 按时间顺序排列
5. 输出JSON格式，每张照片一个对象，包含id、title、story、tags(3-5个标签)

照片数据：
{{PHOTOS}}

输出格式：
{
  "stories": [
    {"id": "照片ID", "title": "标题", "story": "故事旁白", "tags": ["标签1", "标签2"]}
  ]
}`;

/**
 * 分析单张照片
 * @param {object} photo - 照片对象
 * @returns {Promise<object>} - 分析结果
 */
async function analyzePhoto(photo) {
  try {
    if (!photo.fullBase64) {
      throw new Error('示例照片不支持AI分析，请上传自己的照片后重试，或通过本地服务器打开项目。');
    }
    const result = await callVisionModel(photo.fullBase64, VISION_PROMPT);
    // 尝试解析JSON
    let analysis;
    try {
      // 清理可能的markdown标记
      const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(clean);
    } catch (e) {
      // 解析失败，用纯文本
      analysis = {
        description: result.substring(0, 100),
        subjects: [],
        scene: '未知',
        event_type: '日常',
        emotion: '温馨',
        people_count: 0,
        has_baby: false,
        has_old_people: false,
        is_family: true,
        key_moments: [],
        story_hint: ''
      };
    }
    return analysis;
  } catch (e) {
    console.error('分析照片失败:', photo.name, e);
    return {
      description: '分析失败',
      subjects: [],
      scene: '未知',
      event_type: '未知',
      emotion: '未知',
      error: e.message
    };
  }
}

/**
 * 批量分析所有照片
 * @param {function} onProgress - 进度回调 (current, total)
 * @returns {Promise<Array>} - 所有分析结果
 */
async function analyzeAllPhotos(onProgress) {
  const photos = getAllPhotos();
  const results = [];
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (onProgress) onProgress(i, photos.length);
    
    const analysis = await analyzePhoto(photo);
    setPhotoAnalysis(photo.id, analysis);
    results.push({ photo, analysis });
    
    // 稍微延迟，避免请求过快
    if (i < photos.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  if (onProgress) onProgress(photos.length, photos.length);
  return results;
}

/**
 * 为所有照片生成故事旁白
 * @param {function} onProgress - 进度回调
 * @returns {Promise<object>} - 按年份组织的故事数据
 */
async function generateStories(onProgress) {
  const photos = getAllPhotos().filter(p => p.analysis && !p.analysis.error);
  
  if (photos.length === 0) {
    throw new Error('没有可分析的照片');
  }

  // 按年份分组
  const byYear = {};
  photos.forEach(p => {
    const year = p.year;
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(p);
  });

  // 构建照片描述列表
  const photoList = photos.map(p => ({
    id: p.id,
    date: p.date.toISOString().split('T')[0],
    description: p.analysis.description,
    scene: p.analysis.scene,
    event_type: p.analysis.event_type,
    emotion: p.analysis.emotion,
    key_moments: p.analysis.key_moments || [],
    story_hint: p.analysis.story_hint || ''
  }));

  const prompt = STORY_PROMPT_TEMPLATE.replace('{{PHOTOS}}', JSON.stringify(photoList, null, 2));
  
  const result = await callChatModel([
    { role: 'user', content: prompt }
  ], { temperature: 0.8, max_tokens: 2000 });

  // 解析结果
  let stories = [];
  try {
    const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    stories = parsed.stories || [];
  } catch (e) {
    console.warn('解析故事结果失败，使用原始文本', e);
    // 降级：为每张照片生成简单的故事
    stories = photos.map((p, i) => ({
      id: p.id,
      title: `时刻 ${i + 1}`,
      story: p.analysis.description,
      tags: [p.analysis.scene, p.analysis.emotion]
    }));
  }

  // 组织成按年份+事件的数据结构
  const storyData = {};
  Object.keys(byYear).sort().forEach(year => {
    storyData[year] = byYear[year]
      .map(photo => {
        const story = stories.find(s => s.id === photo.id);
        return {
          id: photo.id,
          day: photo.date.getDate(),
          month: `${year}年${photo.date.getMonth() + 1}月`,
          date: photo.date,
          thumbnail: photo.thumbnail,
          fullBase64: photo.fullBase64,
          title: story?.title || photo.analysis?.description || '难忘的时刻',
          story: story?.story || photo.analysis?.description || '',
          tags: story?.tags || [photo.analysis?.scene || '生活', photo.analysis?.emotion || '温馨']
        };
      })
      .sort((a, b) => a.date - b.date);
  });

  setStoryData(storyData);
  return storyData;
}

/**
 * 完整的分析流程
 * @param {function} onStepChange - 步骤回调 (stepIndex, stepName)
 * @param {function} onProgress - 进度回调 (current, total)
 */
async function runFullAnalysis(onStepChange, onProgress) {
  // Step 1: 识别照片内容
  if (onStepChange) onStepChange(0, '识别照片内容');
  await analyzeAllPhotos((cur, total) => {
    if (onProgress) onProgress(0, cur, total);
  });

  // Step 2: 梳理时间线
  if (onStepChange) onStepChange(1, '梳理时间线');
  await new Promise(r => setTimeout(r, 500));

  // Step 3: 挖掘故事线索
  if (onStepChange) onStepChange(2, '挖掘故事线索');
  await new Promise(r => setTimeout(r, 500));

  // Step 4: 撰写故事旁白
  if (onStepChange) onStepChange(3, '撰写故事旁白');
  const storyData = await generateStories((cur, total) => {
    if (onProgress) onProgress(3, cur, total);
  });

  return storyData;
}
