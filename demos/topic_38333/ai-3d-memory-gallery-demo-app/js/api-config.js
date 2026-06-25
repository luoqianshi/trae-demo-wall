/* ============================================
   AI 立体回忆馆 — API 配置与客户端工厂
   ============================================ */

const APIConfig = {
  engines: {
    mock: {
      name: '模拟模式',
      requiresKey: false,
      description: '从照片提取色彩与轮廓，生成风格化 3D 几何体'
    },
    hunyuan: {
      name: '腾讯混元 3D',
      requiresKey: true,
      keyLabel: 'SecretId:SecretKey',
      description: '国内领先的 3D 生成大模型'
    },
    meshy: {
      name: 'Meshy AI',
      requiresKey: true,
      keyLabel: 'API Key',
      description: '全球领先的 AI 3D 生成平台'
    },
    tripo: {
      name: 'Tripo3D',
      requiresKey: true,
      keyLabel: 'API Key',
      description: '操作友好的 AI 建模平台'
    }
  },

  /**
   * 获取 API 客户端
   */
  getClient(engineName) {
    switch (engineName) {
      case 'mock':
        return MockGenerator;
      case 'hunyuan':
        return this._createHunyuanClient();
      case 'meshy':
        return this._createMeshyClient();
      case 'tripo':
        return this._createTripoClient();
      default:
        throw new Error(`Unknown engine: ${engineName}`);
    }
  },

  /**
   * 获取 API Key
   */
  getApiKey(engineName) {
    return localStorage.getItem(`api_key_${engineName}`) || '';
  },

  /**
   * 保存 API Key
   */
  setApiKey(engineName, key) {
    if (key) {
      localStorage.setItem(`api_key_${engineName}`, key);
    } else {
      localStorage.removeItem(`api_key_${engineName}`);
    }
  },

  /**
   * 获取默认引擎
   */
  getDefaultEngine() {
    return localStorage.getItem('default_engine') || 'mock';
  },

  /**
   * 设置默认引擎
   */
  setDefaultEngine(engine) {
    localStorage.setItem('default_engine', engine);
  },

  /**
   * 清除所有 API Key
   */
  clearAllKeys() {
    Object.keys(this.engines).forEach(name => {
      localStorage.removeItem(`api_key_${name}`);
    });
  },

  // --- Private: Engine Client Factories ---

  _createHunyuanClient() {
    return {
      name: 'hunyuan',
      async generate(imageFile, options = {}, onProgress) {
        const key = APIConfig.getApiKey('hunyuan');
        if (!key) throw new Error('请先配置腾讯混元 3D 的 API Key');
        // Placeholder for real API integration
        onProgress && onProgress(10, '正在上传照片到混元 3D...');
        await new Promise(r => setTimeout(r, 1000));
        onProgress && onProgress(40, '混元 3D 正在生成模型...');
        await new Promise(r => setTimeout(r, 2000));
        onProgress && onProgress(80, '正在下载模型文件...');
        await new Promise(r => setTimeout(r, 1000));
        onProgress && onProgress(100, '生成完成');
        throw new Error('混元 3D API 接入开发中，请使用模拟模式体验');
      }
    };
  },

  _createMeshyClient() {
    return {
      name: 'meshy',
      async generate(imageFile, options = {}, onProgress) {
        const key = APIConfig.getApiKey('meshy');
        if (!key) throw new Error('请先配置 Meshy AI 的 API Key');
        onProgress && onProgress(10, '正在上传照片到 Meshy...');
        await new Promise(r => setTimeout(r, 1000));
        onProgress && onProgress(50, 'Meshy AI 正在生成模型...');
        await new Promise(r => setTimeout(r, 2000));
        onProgress && onProgress(90, '正在下载模型文件...');
        await new Promise(r => setTimeout(r, 1000));
        onProgress && onProgress(100, '生成完成');
        throw new Error('Meshy AI API 接入开发中，请使用模拟模式体验');
      }
    };
  },

  _createTripoClient() {
    return {
      name: 'tripo',
      async generate(imageFile, options = {}, onProgress) {
        const key = APIConfig.getApiKey('tripo');
        if (!key) throw new Error('请先配置 Tripo3D 的 API Key');
        onProgress && onProgress(10, '正在上传照片到 Tripo3D...');
        await new Promise(r => setTimeout(r, 1000));
        onProgress && onProgress(50, 'Tripo3D 正在生成模型...');
        await new Promise(r => setTimeout(r, 2000));
        onProgress && onProgress(90, '正在下载模型文件...');
        await new Promise(r => setTimeout(r, 1000));
        onProgress && onProgress(100, '生成完成');
        throw new Error('Tripo3D API 接入开发中，请使用模拟模式体验');
      }
    };
  }
};
