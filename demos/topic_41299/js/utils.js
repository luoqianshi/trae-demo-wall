    // ===== 7. 工具函数 =====

    function uid() {
      return 'oc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function formatDate(timestamp) {
      const d = new Date(timestamp);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    function formatDateTime(timestamp) {
      const d = new Date(timestamp);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} ${h}:${min}`;
    }

    function getMoodEmoji(mood) {
      if (mood >= 80) return '😊';
      if (mood >= 60) return '😌';
      if (mood >= 40) return '😐';
      if (mood >= 20) return '😟';
      return '😢';
    }

    function getMoodText(mood) {
      if (mood >= 80) return '非常开心';
      if (mood >= 60) return '心情不错';
      if (mood >= 40) return '心情平静';
      if (mood >= 20) return '有些低落';
      return '需要陪伴';
    }

    function getPrivacyLabel(privacy) {
      const map = { public: '公开', followers: '仅粉丝', private: '仅自己' };
      return map[privacy] || '仅自己';
    }

    function formatCooldown(ms) {
      if (ms <= 0) return '';
      const minutes = Math.ceil(ms / 60000);
      if (minutes < 60) return `${minutes}分后`;
      const hours = Math.ceil(minutes / 60);
      return `${hours}小时后`;
    }

    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // 统一头像渲染：avatarImage(上传) > portraitImage(AI生成) > avatar(Emoji)
    function renderAvatar(oc, size = 'normal') {
      if (!oc) return '🌸';
      const sizeClass = size === 'large' ? 'avatar-img avatar-img-lg'
        : size === 'small' ? 'avatar-img avatar-img-sm'
        : 'avatar-img';
      if (oc.avatarImage) {
        const cp = oc.copyright || {};
        const protectionAttrs = cp.disableDownload !== false ? 'oncontextmenu="return false" ondragstart="return false"' : '';
        return `<img src="${oc.avatarImage}" class="${sizeClass}" alt="${escapeAttr(oc.name || 'OC')}" ${protectionAttrs}>`;
      }
      if (oc.portraitImage) {
        const cp = oc.copyright || {};
        const protectionAttrs = cp.disableDownload !== false ? 'oncontextmenu="return false" ondragstart="return false"' : '';
        return `<img src="${oc.portraitImage}" class="${sizeClass}" alt="${escapeAttr(oc.name || 'OC')}" ${protectionAttrs}>`;
      }
      return oc.avatar || '🌸';
    }

    // 受版权保护的图片渲染（用于详情页立绘等大图展示）
    function renderImageWithProtection(oc, src, options = {}) {
      const { alt = '', className = '' } = options;
      const cp = oc.copyright || {};
      const showWatermark = cp.watermarkEnabled !== false;
      const disableDownload = cp.disableDownload !== false;
      const watermarkText = cp.watermarkText || `© ${oc.name || ''}`;

      const protectionAttrs = disableDownload
        ? 'oncontextmenu="return false" ondragstart="return false"'
        : '';
      const overlay = disableDownload
        ? '<div class="image-protect-overlay"></div>'
        : '';
      const watermarkLayer = showWatermark
        ? `<div class="image-watermark">${escapeHtml(watermarkText)}</div>`
        : '';

      return `
        <div class="protected-image ${className}">
          <img src="${src}" alt="${escapeAttr(alt)}" ${protectionAttrs}>
          ${watermarkLayer}
          ${overlay}
        </div>
      `;
    }

    // 根据OC外观字段组装SDXL风格的立绘提示词
    function buildPortraitPrompt(oc) {
      const parts = [];
      parts.push('full body portrait');
      parts.push(oc.gender || 'character');
      if (oc.race) parts.push(oc.race);
      if (oc.age) parts.push(`${oc.age} years old`);
      if (oc.hairStyle) parts.push(oc.hairStyle);
      if (oc.eyeColor) parts.push(`${oc.eyeColor} eyes`);
      if (oc.skinTone) parts.push(oc.skinTone);
      if (oc.bodyType) parts.push(oc.bodyType);
      if (oc.height) parts.push(oc.height);
      if (oc.outfit) parts.push(`wearing ${oc.outfit}`);
      if (oc.features) parts.push(oc.features);
      parts.push('anime style, detailed, high quality, digital painting');
      if (oc.colors && oc.colors[0]) {
        parts.push(`${oc.colors[0]} color theme`);
      }
      return parts.join(', ');
    }

    // 调用AI绘画API生成全身立绘
    async function generatePortrait(oc) {
      const prompt = buildPortraitPrompt(oc);
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=portrait_4_3`;
      try {
        const resp = await fetch(imageUrl);
        if (!resp.ok) throw new Error(`API返回 ${resp.status}`);
        // API返回的是图片URL字符串或JSON
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await resp.json();
          // 兼容多种返回结构
          return data.image_url || data.url || data.data?.url || data.result?.url || (typeof data === 'string' ? data : '');
        } else {
          // 直接返回图片二进制，转成blob URL
          const blob = await resp.blob();
          return URL.createObjectURL(blob);
        }
      } catch (err) {
        console.error('生成立绘失败:', err);
        throw err;
      }
    }

    // 本地图片上传：通过Canvas压缩到最大宽度800px，质量0.8，返回base64
    function compressImage(file, maxWidth = 800, quality = 0.8) {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('请选择图片文件'));
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let { width, height } = img;
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', quality);
            resolve(base64);
          };
          img.onerror = () => reject(new Error('图片加载失败'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });
    }

    // ===== 画廊相关工具函数 =====

    // 画廊图片分类
    const GALLERY_CATEGORIES = [
      { value: 'portrait', label: '立绘' },
      { value: 'chibi', label: 'Q版' },
      { value: 'emote', label: '表情包' },
      { value: 'reference', label: '参考图' },
      { value: 'other', label: '其他' }
    ];

    function getGalleryCategoryLabel(value) {
      const cat = GALLERY_CATEGORIES.find(c => c.value === value);
      return cat ? cat.label : '其他';
    }

    // 从 base64 原图生成缩略图 base64（用于画廊网格预览，减少渲染压力）
    function compressImageToThumbnail(src, maxWidth = 200, quality = 0.7) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('缩略图生成失败'));
        img.src = src;
      });
    }

    // 检测 localStorage 剩余空间是否足够
    function checkStorageQuota(estimatedBytes) {
      try {
        const currentData = JSON.stringify(state).length;
        const totalEstimate = currentData + estimatedBytes;
        // localStorage 通常 5-10MB，保守按 4.5MB 阈值判断
        const QUOTA_THRESHOLD = 4.5 * 1024 * 1024;
        return {
          ok: totalEstimate < QUOTA_THRESHOLD,
          current: currentData,
          estimate: totalEstimate,
          threshold: QUOTA_THRESHOLD
        };
      } catch (e) {
        return { ok: true, current: 0, estimate: 0, threshold: 0 };
      }
    }
