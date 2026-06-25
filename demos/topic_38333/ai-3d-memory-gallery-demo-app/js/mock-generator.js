/* ============================================
   AI 立体回忆馆 — 模拟 3D 生成器
   ============================================ */

const MockGenerator = {
  name: 'mock',

  /**
   * 从照片生成风格化 3D 模型（模拟）
   * @param {File} imageFile - 上传的图片文件
   * @param {Object} options - 生成选项 { style: 'sculpture'|'voxel'|'lowpoly'|'relief' }
   * @param {Function} onProgress - 进度回调 (percent, statusText, detailText)
   * @returns {Promise<{geometry, colors, name, style}>}
   */
  async generate(imageFile, options = {}, onProgress) {
    const style = options.style || 'sculpture';

    // Step 1: 读取图片
    onProgress && onProgress(5, '正在读取照片...', '解析图片数据');
    const dataURL = await Utils.readFileAsDataURL(imageFile);

    // Step 2: 分析图片色彩
    onProgress && onProgress(15, '正在分析照片色彩...', '提取主色调与轮廓');
    await this._delay(400);
    const { colors, width, height } = await this._analyzeImage(dataURL);

    // Step 3: 生成 3D 几何体
    onProgress && onProgress(30, `正在生成${this._getStyleName(style)}模型...`, '构建 3D 几何体');
    await this._delay(600);

    const geometry = this._generateGeometry(style, colors, width, height);
    onProgress && onProgress(60, '正在优化模型细节...', '调整顶点与面片');
    await this._delay(500);

    // Step 4: 应用材质
    onProgress && onProgress(80, '正在应用材质与纹理...', '映射照片色彩');
    await this._delay(400);

    // Step 5: 完成
    onProgress && onProgress(95, '正在最终渲染...', '准备预览');
    await this._delay(300);
    onProgress && onProgress(100, '生成完成', '模型已准备就绪');

    const fileName = imageFile.name.replace(/\.[^.]+$/, '');
    return {
      geometry,
      colors,
      name: `${fileName}_${style}`,
      style,
      sourceImage: dataURL,
      sourceFileName: imageFile.name,
      generatedAt: Utils.getTimestamp()
    };
  },

  /**
   * 分析图片
   */
  async _analyzeImage(dataURL) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const colors = Utils.extractColors(imageData, 6);
        resolve({ colors, width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({
          colors: [
            { r: 232, g: 112, b: 64 },
            { r: 196, g: 154, b: 108 },
            { r: 91, g: 138, b: 110 },
            { r: 250, g: 245, b: 239 },
            { r: 28, g: 21, b: 16 }
          ],
          width: 512, height: 512
        });
      };
      img.src = dataURL;
    });
  },

  /**
   * 根据风格生成 Three.js 几何体描述
   */
  _generateGeometry(style, colors, imgW, imgH) {
    const primaryColor = colors[0] || { r: 232, g: 112, b: 64 };
    const secondaryColor = colors[1] || { r: 196, g: 154, b: 108 };
    const accentColor = colors[2] || { r: 91, g: 138, b: 110 };

    switch (style) {
      case 'sculpture':
        return this._genSculpture(primaryColor, secondaryColor, accentColor);
      case 'voxel':
        return this._genVoxel(colors);
      case 'lowpoly':
        return this._genLowPoly(primaryColor, secondaryColor, accentColor);
      case 'relief':
        return this._genRelief(primaryColor, secondaryColor, colors);
      default:
        return this._genSculpture(primaryColor, secondaryColor, accentColor);
    }
  },

  // --- Style Generators ---

  _genSculpture(c1, c2, c3) {
    return {
      type: 'sculpture',
      params: {
        mainRadius: 1.2,
        detail: 4,
        distortions: Array.from({ length: 20 }, () => ({
          freq: 2 + Math.random() * 6,
          amp: 0.05 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2
        })),
        colors: [
          `rgb(${c1.r},${c1.g},${c1.b})`,
          `rgb(${c2.r},${c2.g},${c2.b})`,
          `rgb(${c3.r},${c3.g},${c3.b})`
        ]
      }
    };
  },

  _genVoxel(colors) {
    const voxels = [];
    const size = 8;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const cx = x - size / 2, cy = y - size / 2, cz = z - size / 2;
          const dist = Math.sqrt(cx * cx + cy * cy + cz * cz);
          if (dist < size * 0.55 && Math.random() > 0.35) {
            const c = colors[Math.floor(Math.random() * Math.min(colors.length, 4))];
            voxels.push({
              x: cx * 0.25, y: cy * 0.25, z: cz * 0.25,
              size: 0.22 + Math.random() * 0.06,
              color: `rgb(${c.r},${c.g},${c.b})`
            });
          }
        }
      }
    }
    return { type: 'voxel', params: { voxels } };
  },

  _genLowPoly(c1, c2, c3) {
    const vertices = [];
    const faces = [];
    const rings = 12;
    const segments = 16;
    // Generate icosphere-like low poly
    for (let i = 0; i <= rings; i++) {
      const phi = (Math.PI * i) / rings;
      for (let j = 0; j < segments; j++) {
        const theta = (2 * Math.PI * j) / segments;
        const r = 1.2 + (Math.random() - 0.5) * 0.15;
        vertices.push({
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.cos(phi),
          z: r * Math.sin(phi) * Math.sin(theta)
        });
      }
    }
    // Generate faces
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * segments + j;
        const b = i * segments + (j + 1) % segments;
        const c = (i + 1) * segments + j;
        const d = (i + 1) * segments + (j + 1) % segments;
        faces.push([a, b, c]);
        faces.push([b, d, c]);
      }
    }
    return {
      type: 'lowpoly',
      params: {
        vertices,
        faces,
        colors: [
          `rgb(${c1.r},${c1.g},${c1.b})`,
          `rgb(${c2.r},${c2.g},${c2.b})`,
          `rgb(${c3.r},${c3.g},${c3.b})`
        ],
        flatShading: true
      }
    };
  },

  _genRelief(c1, c2, colors) {
    const gridW = 32, gridH = 32;
    const heights = [];
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const nx = x / gridW - 0.5;
        const ny = y / gridH - 0.5;
        let h = 0;
        h += Math.sin(nx * 8) * 0.15;
        h += Math.cos(ny * 6) * 0.1;
        h += Math.sin((nx + ny) * 12) * 0.08;
        h += Math.random() * 0.05;
        heights.push(h);
      }
    }
    return {
      type: 'relief',
      params: {
        gridW, gridH,
        heights,
        depth: 0.5,
        colors: [
          `rgb(${c1.r},${c1.g},${c1.b})`,
          `rgb(${c2.r},${c2.g},${c2.b})`,
          ...colors.slice(2, 4).map(c => `rgb(${c.r},${c.g},${c.b})`)
        ]
      }
    };
  },

  _getStyleName(style) {
    const names = {
      sculpture: '立体雕塑',
      voxel: '体素风格',
      lowpoly: 'Low Poly',
      relief: '浮雕风格'
    };
    return names[style] || style;
  },

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
};
