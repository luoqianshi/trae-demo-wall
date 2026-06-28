// 图片资源管理器
// 优先级：本地图片文件 > SVG精美占位图

window.ImageManager = {
  // 已存在的本地图片白名单（文件名）
  existingImages: [
    'poem_1.png', 'poem_2.png', 'poem_3.png',
    'narrative1_1.png', 'narrative1_2.png', 'narrative1_3.png', 'narrative1_4.png',
    'narrative2_1.png', 'narrative2_2.png', 'narrative2_3.png', 'narrative2_4.png',
    'choice1.png', 'choice2.png',
    'consequence1_pos_1.png', 'consequence1_pos_2.png', 'consequence1_pos_3.png', 'consequence1_pos_4.png',
    'after1_pos_1.png', 'after1_pos_2.png', 'after1_pos_3.png', 'after1_pos_4.png',
    'consequence1_neg_1.png', 'consequence1_neg_2.png', 'consequence1_neg_3.png', 'consequence1_neg_4.png',
    'after1_neg_1.png', 'after1_neg_2.png', 'after1_neg_3.png', 'after1_neg_4.png',
    'consequence2_pos_1.png', 'consequence2_pos_2.png', 'consequence2_pos_3.png', 'consequence2_pos_4.png',
    'consequence2_neg_1.png', 'consequence2_neg_2.png', 'consequence2_neg_3.png',
    'end_pos_1.png', 'end_pos_2.png', 'end_pos_3.png', 'end_pos_4.png',
    'end_neg_1.png', 'end_neg_2.png', 'end_neg_3.png', 'end_neg_4.png',
    'reflection.png'
  ],
  
  // 已解析的图片URL缓存（prompt -> url）
  resolvedUrls: new Map(),
  
  // 预加载完成状态
  totalImages: 0,
  loadedImages: 0,
  
  // 回调
  onProgress: null,
  onComplete: null,
  
  // 根据prompt获取图片URL
  getImageUrl(prompt) {
    if (this.resolvedUrls.has(prompt)) {
      return this.resolvedUrls.get(prompt);
    }
    
    const firstKey = Object.keys(window.IMAGE_MAP || {})[0];
    if (firstKey && window.IMAGE_MAP[firstKey]) {
      return window.IMAGE_MAP[firstKey].placeholder;
    }
    return '';
  },
  
  preloadAll(acts, onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.loadedImages = 0;
    
    const allPrompts = new Set();
    
    acts.forEach(act => {
      if (act.poemBg) {
        act.poemBg.forEach(p => allPrompts.add(p));
      }
      
      act.scenes.forEach(scene => {
        if (scene.type === 'choice' && scene.bgImage) {
          allPrompts.add(scene.bgImage);
        }
        if (scene.type === 'reflection' && scene.bgImage) {
          allPrompts.add(scene.bgImage);
        }
        if (scene.type === 'video' && scene.shots) {
          scene.shots.forEach(shot => {
            if (shot.image) allPrompts.add(shot.image);
          });
        }
      });
    });
    
    this.totalImages = allPrompts.size;
    console.log(`[ImageManager] 共 ${this.totalImages} 张图片待加载`);
    
    this._loadNext(Array.from(allPrompts));
  },
  
  _loadNext(prompts) {
    if (prompts.length === 0) {
      console.log(`[ImageManager] 全部加载完成`);
      if (this.onComplete) this.onComplete();
      return;
    }
    
    const prompt = prompts[0];
    const key = window.PROMPT_TO_KEY[prompt];
    const imgInfo = key ? window.IMAGE_MAP[key] : null;
    
    if (!imgInfo) {
      this.resolvedUrls.set(prompt, this._getFallbackPlaceholder());
      this._onOneLoaded();
      this._loadNext(prompts.slice(1));
      return;
    }
    
    const fileName = imgInfo.localPath.split('/').pop();
    const pngFileName = fileName.replace(/\.jpg$/, '.png');
    if (this.existingImages.includes(pngFileName)) {
      console.log('[ImageManager] 加载本地图片:', pngFileName);
      this._tryLoadLocalImage(imgInfo, prompt, () => {
        this._onOneLoaded();
        this._loadNext(prompts.slice(1));
      });
    } else {
      this.resolvedUrls.set(prompt, imgInfo.placeholder);
      this._onOneLoaded();
      this._loadNext(prompts.slice(1));
    }
  },
  
  _tryLoadLocalImage(imgInfo, prompt, callback) {
    const img = new Image();
    const self = this;
    
    const pngPath = imgInfo.localPath.replace(/\.jpg$/, '.png');
    
    img.onload = () => {
      self.resolvedUrls.set(prompt, pngPath);
      callback();
    };
    
    img.onerror = () => {
      self.resolvedUrls.set(prompt, imgInfo.placeholder);
      callback();
    };
    
    img.src = pngPath;
  },
  
  _onOneLoaded() {
    this.loadedImages++;
    if (this.onProgress) {
      this.onProgress(this.loadedImages, this.totalImages);
    }
  },
  
  _getFallbackPlaceholder() {
    const keys = Object.keys(window.IMAGE_MAP || {});
    if (keys.length > 0 && window.IMAGE_MAP[keys[0]]) {
      return window.IMAGE_MAP[keys[0]].placeholder;
    }
    return '';
  },
  
  getProgress() {
    if (this.totalImages === 0) return 0;
    return Math.round((this.loadedImages / this.totalImages) * 100);
  },
  
  // 添加新图片到白名单（后续可扩展）
  addExistingImage(fileName) {
    if (!this.existingImages.includes(fileName)) {
      this.existingImages.push(fileName);
    }
  }
};
