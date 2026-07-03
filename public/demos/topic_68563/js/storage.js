// ==================== 数据存储 ====================
// 照片数据和分析结果的本地存储

let photoStore = {
  photos: [],       // [{ id, file, base64, thumbnail, analysis, date }]
  analysisResult: null,  // AI分析结果
  storyData: {}     // 按年份组织的故事数据
};

/**
 * 添加照片
 * @param {File[]} files - 图片文件数组
 */
async function addPhotos(files) {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  
  for (const file of imageFiles) {
    try {
      // 生成缩略图
      const { base64, width, height } = await imageToBase64(file, 300, 0.7);
      // 生成大图用于分析
      const { base64: fullBase64 } = await imageToBase64(file, 1024, 0.8);
      
      // 尝试从文件名/EXIF获取日期（简化版，用文件修改时间）
      const date = file.lastModified ? new Date(file.lastModified) : new Date();
      
      const photo = {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        file: file,
        name: file.name,
        thumbnail: base64,
        fullBase64: fullBase64,
        width: width,
        height: height,
        date: date,
        year: date.getFullYear(),
        analysis: null
      };
      
      photoStore.photos.push(photo);
    } catch (e) {
      console.error('处理图片失败:', file.name, e);
    }
  }
  
  return photoStore.photos.length;
}

/**
 * 清空所有照片
 */
function clearPhotos() {
  photoStore.photos = [];
  photoStore.analysisResult = null;
  photoStore.storyData = {};
}

/**
 * 获取所有照片
 */
function getAllPhotos() {
  return photoStore.photos;
}

/**
 * 获取照片数量
 */
function getPhotoCount() {
  return photoStore.photos.length;
}

/**
 * 保存分析结果到照片上
 * @param {string} photoId - 照片ID
 * @param {object} analysis - 分析结果
 */
function setPhotoAnalysis(photoId, analysis) {
  const photo = photoStore.photos.find(p => p.id === photoId);
  if (photo) {
    photo.analysis = analysis;
  }
}

/**
 * 保存故事数据
 * @param {object} storyData - 按年份组织的故事数据
 */
function setStoryData(storyData) {
  photoStore.storyData = storyData;
}

/**
 * 获取故事数据
 */
function getStoryData() {
  return photoStore.storyData;
}

/**
 * 获取所有已分析的照片描述（用于对话上下文）
 */
function getAllPhotoDescriptions() {
  return photoStore.photos
    .filter(p => p.analysis)
    .map(p => ({
      id: p.id,
      thumbnail: p.thumbnail,
      fullBase64: p.fullBase64,
      date: p.date,
      year: p.year,
      description: p.analysis.description,
      subjects: p.analysis.subjects,
      scene: p.analysis.scene,
      emotion: p.analysis.emotion,
      keyMoments: p.analysis.keyMoments
    }));
}
