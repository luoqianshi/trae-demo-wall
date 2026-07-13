/**
 * 打工人的工具箱 - 文件信息查看工具
 * 支持图片（包括GIF）、视频文件的信息解析
 * 可查看文件格式、大小、分辨率、时长等信息
 */

(function() {
  'use strict';

  // 当前文件信息
  let currentFile = null;

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    
    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'file-infoPage') {
        // 页面进入时可以做一些准备工作
      }
    });
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    
    // 点击上传
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFile(file);
      }
      fileInput.value = ''; // 重置input
    });
    
    // 拖拽上传
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    });
  }

  /**
   * 处理文件
   */
  async function handleFile(file) {
    currentFile = file;
    
    // 基本信息
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type || '未知',
      lastModified: file.lastModified,
      extension: getFileExtension(file.name)
    };
    
    // 判断文件类型
    const fileType = getFileType(file);
    
    // 获取额外信息
    let extraInfo = {};
    
    if (fileType === 'image') {
      extraInfo = await getImageInfo(file);
    } else if (fileType === 'video') {
      extraInfo = await getVideoInfo(file);
    }
    
    // 显示预览和信息
    displayFilePreview(file, fileType);
    displayFileInfo({ ...fileInfo, ...extraInfo, fileType });
  }

  /**
   * 获取文件扩展名
   */
  function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : '未知';
  }

  /**
   * 判断文件类型
   */
  function getFileType(file) {
    if (file.type.startsWith('image/')) {
      return 'image';
    }
    if (file.type.startsWith('video/')) {
      return 'video';
    }
    return 'other';
  }

  /**
   * 获取图片信息
   */
  function getImageInfo(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const info = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
        };
        
        // 如果是GIF，解析详细结构信息
        if (file.type === 'image/gif') {
          parseGifInfo(file).then(gifInfo => {
            Object.assign(info, gifInfo);
            URL.revokeObjectURL(url);
            resolve(info);
          });
        } else {
          URL.revokeObjectURL(url);
          resolve(info);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ error: '无法加载图片' });
      };
      
      img.src = url;
    });
  }

  /**
   * 解析GIF文件二进制数据，提取完整结构信息
   * 参考文章: https://juejin.cn/post/7022637452066029599
   */
  async function parseGifInfo(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      let index = 0;

      const info = {};

      // 1. 解析文件头 Header（6字节）：签名3字节 + 版本3字节
      const signature = String.fromCharCode(data[0], data[1], data[2]);
      if (signature !== 'GIF') {
        return { gifError: '非GIF文件' };
      }
      const version = String.fromCharCode(data[3], data[4], data[5]);
      info.gifVersion = version; // "87a" 或 "89a"
      index = 6;

      // 2. 解析逻辑屏幕描述符 LogicalScreenDescriptor（7字节）
      const logicalWidth = data[index] | (data[index + 1] << 8); // 宽度，小端序2字节
      const logicalHeight = data[index + 2] | (data[index + 3] << 8); // 高度，小端序2字节
      index += 4;

      const packedByte = data[index]; // 压缩字段1字节
      index++;
      // 解析压缩字段的各个位
      const globalColorTableFlag = (packedByte >> 7) & 0x01; // 最高位：全局颜色表标志
      const colorResolution = ((packedByte >> 4) & 0x07) + 1; // 3位：颜色分辨率（位数）
      const sortFlag = (packedByte >> 3) & 0x01; // 1位：排序标志
      const globalColorTableSize = (packedByte & 0x07); // 3位：全局颜色表大小指数

      const backgroundColorIndex = data[index]; // 背景颜色索引1字节
      index++;
      const pixelAspectRatio = data[index]; // 像素纵横比1字节
      index++;

      info.logicalScreenWidth = logicalWidth;
      info.logicalScreenHeight = logicalHeight;
      info.colorResolution = colorResolution + ' 位';
      info.backgroundColorIndex = backgroundColorIndex;
      info.pixelAspectRatio = pixelAspectRatio === 0 ? '默认(1:1)' : ((pixelAspectRatio + 15) / 64).toFixed(2);

      // 3. 解析全局颜色表 GlobalColorTable（如果存在）
      if (globalColorTableFlag) {
        // 颜色数量 = 2^(size+1)，每个颜色3字节(RGB)
        const colorCount = 1 << (globalColorTableSize + 1);
        info.globalColorTableSize = colorCount + ' 色';
        info.colorTableSorted = sortFlag ? '是' : '否';
        index += colorCount * 3; // 跳过颜色表数据
      } else {
        info.globalColorTableSize = '无';
      }

      // 4. 遍历数据块，解析帧数、延迟时间、循环次数等
      let frameCount = 0;
      let loopCount = 0; // 0 = 无限循环
      let totalDelay = 0;
      let hasNetscape = false;
      const delays = [];
      const disposalMethods = new Set();

      while (index < data.length) {
        const blockType = data[index];
        index++;

        if (blockType === 0x3B) {
          // Trailer（0x3B）：GIF数据流结束标记
          break;
        } else if (blockType === 0x2C) {
          // 图像描述符 ImageDescriptor（0x2C）：表示一帧图像
          frameCount++;
          // 跳过图像描述符：左4字节 + 宽高4字节 + 压缩字段1字节 = 9字节
          index += 8;
          const imgPackedByte = data[index];
          index++;
          // 检查是否有局部颜色表
          const localColorTableFlag = (imgPackedByte >> 7) & 0x01;
          const localColorTableSize = imgPackedByte & 0x07;
          if (localColorTableFlag) {
            index += (1 << (localColorTableSize + 1)) * 3;
          }
          // 跳过LZW压缩的图像数据
          index = skipLzwData(data, index);
        } else if (blockType === 0x21) {
          // 扩展块 Extension（0x21）
          const label = data[index];
          index++;

          if (label === 0xF9) {
            // 图形控制扩展 GraphicControlExtension（0xF9）
            const blockSize = data[index]; // 块大小，固定为4
            index++;
            const gcePackedByte = data[index]; // 压缩字段
            index++;
            const disposalMethod = (gcePackedByte >> 2) & 0x07; // 处理方法3位
            const transparentFlag = gcePackedByte & 0x01; // 透明标志1位
            const delayTime = data[index] | (data[index + 1] << 8); // 延迟时间2字节（单位1/100秒）
            index += 2;
            const transparentColorIndex = data[index]; // 透明颜色索引
            index++;
            index++; // 块终止符

            delays.push(delayTime);
            totalDelay += delayTime;
            disposalMethods.add(disposalMethod);
          } else if (label === 0xFF) {
            // 应用扩展 ApplicationExtension（0xFF）
            const blockSize = data[index]; // 块大小，固定为11
            index++;
            // 读取应用标识符（8字节）+ 验证码（3字节）
            const appId = String.fromCharCode(...data.slice(index, index + 8));
            index += 11;

            // 检查是否是 Netscape 循环扩展
            if (appId.startsWith('NETSCAPE')) {
              hasNetscape = true;
              // 读取子块：块大小 + 数据
              const subBlockSize = data[index];
              index++;
              if (subBlockSize === 3) {
                index++; // 固定值1
                loopCount = data[index] | (data[index + 1] << 8);
                index += 2;
              }
              index++; // 块终止符
            } else {
              // 跳过其他应用扩展的子块
              index = skipSubBlocks(data, index);
            }
          } else {
            // 其他扩展块（0xFE评论、0x01纯文本等），跳过子块
            index = skipSubBlocks(data, index);
          }
        } else {
          // 未知块，跳过避免死循环
          break;
        }
      }

      // 填充解析结果
      info.frameCount = frameCount;
      info.isAnimated = frameCount > 1 ? '是（动画GIF）' : '否（静态GIF）';
      if (frameCount > 1) {
        info.loopCount = hasNetscape ? (loopCount === 0 ? '无限循环' : loopCount + ' 次') : '默认（1次）';
        const avgDelay = delays.length > 0 ? (totalDelay / delays.length / 100).toFixed(2) : 0;
        info.avgFrameDelay = avgDelay + ' 秒';
        info.totalDuration = (totalDelay / 100).toFixed(2) + ' 秒';

        // 处理方法映射
        const disposalNames = ['未指定', '不处理', '恢复背景色', '恢复上一帧'];
        const disposalStrs = [...disposalMethods].map(m => disposalNames[m] || `自定义(${m})`);
        info.disposalMethod = disposalStrs.join(', ');
      }

      return info;
    } catch (error) {
      console.error('GIF解析失败:', error);
      return { gifError: '解析失败: ' + error.message };
    }
  }

  /**
   * 跳过LZW压缩图像数据（跳过所有数据子块）
   */
  function skipLzwData(data, index) {
    // 先跳过LZW最小代码长度1字节
    index++;
    // 然后跳过所有数据子块（每个子块以长度字节开头，0表示结束）
    while (index < data.length) {
      const subBlockSize = data[index];
      index++;
      if (subBlockSize === 0) break;
      index += subBlockSize;
    }
    return index;
  }

  /**
   * 跳过扩展块的子块数据
   */
  function skipSubBlocks(data, index) {
    while (index < data.length) {
      const subBlockSize = data[index];
      index++;
      if (subBlockSize === 0) break;
      index += subBlockSize;
    }
    return index;
  }

  /**
   * 获取视频信息
   */
  function getVideoInfo(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const info = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2)
        };
        
        URL.revokeObjectURL(video.src);
        resolve(info);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({ error: '无法加载视频' });
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * 显示文件预览
   */
  function displayFilePreview(file, fileType) {
    const container = document.getElementById('filePreviewContainer');
    const url = URL.createObjectURL(file);
    
    container.innerHTML = '';
    
    if (fileType === 'image') {
      const img = document.createElement('img');
      img.className = 'file-preview';
      img.src = url;
      img.alt = file.name;
      container.appendChild(img);
    } else if (fileType === 'video') {
      const video = document.createElement('video');
      video.className = 'file-preview';
      video.src = url;
      video.controls = true;
      video.muted = true;
      container.appendChild(video);
    }
    
    document.getElementById('fileInfoResult').style.display = 'block';
  }

  /**
   * 显示文件信息
   */
  function displayFileInfo(info) {
    const grid = document.getElementById('fileInfoGrid');
    grid.innerHTML = '';
    
    // 文件名
    addInfoItem(grid, '文件名', info.name);
    
    // 文件大小
    addInfoItem(grid, '文件大小', App.formatFileSize(info.size));
    
    // 文件格式
    addInfoItem(grid, '文件格式', info.extension);
    
    // MIME类型
    addInfoItem(grid, 'MIME类型', info.type);
    
    // 修改时间
    if (info.lastModified) {
      addInfoItem(grid, '修改时间', new Date(info.lastModified).toLocaleString('zh-CN'));
    }
    
    // 图片/视频特有信息
    if (info.width && info.height) {
      addInfoItem(grid, '分辨率', `${info.width} × ${info.height}`);
    }
    
    if (info.aspectRatio) {
      addInfoItem(grid, '宽高比', info.aspectRatio);
    }
    
    if (info.duration !== undefined) {
      addInfoItem(grid, '时长', formatDuration(info.duration));
    }
    
    if (info.isAnimated) {
      addInfoItem(grid, '动画类型', info.isAnimated);
    }
    
    // GIF详细结构信息
    if (info.gifVersion) {
      addInfoItem(grid, 'GIF版本', info.gifVersion);
    }
    if (info.logicalScreenWidth) {
      addInfoItem(grid, '逻辑屏幕尺寸', `${info.logicalScreenWidth} × ${info.logicalScreenHeight}`);
    }
    if (info.colorResolution) {
      addInfoItem(grid, '颜色分辨率', info.colorResolution);
    }
    if (info.globalColorTableSize) {
      addInfoItem(grid, '全局颜色表', info.globalColorTableSize);
    }
    if (info.colorTableSorted) {
      addInfoItem(grid, '颜色表排序', info.colorTableSorted);
    }
    if (info.backgroundColorIndex !== undefined) {
      addInfoItem(grid, '背景色索引', info.backgroundColorIndex);
    }
    if (info.pixelAspectRatio) {
      addInfoItem(grid, '像素纵横比', info.pixelAspectRatio);
    }
    if (info.frameCount !== undefined) {
      addInfoItem(grid, '帧数', info.frameCount);
    }
    if (info.loopCount) {
      addInfoItem(grid, '循环次数', info.loopCount);
    }
    if (info.avgFrameDelay) {
      addInfoItem(grid, '平均帧延迟', info.avgFrameDelay);
    }
    if (info.totalDuration) {
      addInfoItem(grid, '总时长', info.totalDuration);
    }
    if (info.disposalMethod) {
      addInfoItem(grid, '处理方法', info.disposalMethod);
    }
  }

  /**
   * 添加信息项
   */
  function addInfoItem(grid, label, value) {
    const item = document.createElement('div');
    item.className = 'file-info-item';
    item.innerHTML = `
      <div class="file-info-label">${label}</div>
      <div class="file-info-value" title="${escapeHtml(String(value))}">${escapeHtml(String(value))}</div>
    `;
    grid.appendChild(item);
  }

  /**
   * 格式化时长
   */
  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '未知';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}时${m}分${s}秒`;
    } else if (m > 0) {
      return `${m}分${s}秒`;
    } else {
      return `${s}秒`;
    }
  }

  /**
   * HTML转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
