/**
 * image-upload.js - 图片上传组件
 * Handles image selection via file input, preview, deletion.
 * Images stored as base64 in localStorage.
 */
const ImageUpload = {
  // Maximum number of images allowed
  MAX_IMAGES: 9,
  // Maximum file size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  // Accepted image MIME types
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  // JPEG compression quality
  JPEG_QUALITY: 0.7,

  /**
   * Initialize image upload area
   * @param {HTMLElement} container - DOM element to render into
   * @param {Array} images - existing array of image objects [{id, name, data (base64), type}]
   * @param {Function} onChange - callback with updated images array
   */
  init(container, images = [], onChange) {
    if (!container) return;

    this._renderGrid(container, images, onChange);

    // Create hidden file input
    let fileInput = container.querySelector('.image-upload-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.className = 'image-upload-input';
      fileInput.style.display = 'none';
      container.appendChild(fileInput);
    }

    // Handle file selection
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        this._handleFileSelect(files, images, onChange, container);
      }
      // Reset input so the same file can be selected again
      fileInput.value = '';
    };

    // Store reference for external trigger
    container._fileInput = fileInput;
  },

  /**
   * Render image grid into container
   * @param {HTMLElement} container - DOM element
   * @param {Array} images - array of image objects
   * @param {Function} onChange - change callback
   */
  _renderGrid(container, images, onChange) {
    // Preserve existing file input
    const existingInput = container.querySelector('.image-upload-input');

    // Clear container contents (except file input)
    const grid = document.createElement('div');
    grid.className = 'image-upload-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    `;

    // Render existing images
    images.forEach((img, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'image-upload-item';
      wrapper.style.cssText = `
        position: relative;
        padding-top: 100%;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f5f5;
      `;

      const imgEl = document.createElement('img');
      imgEl.src = img.data;
      imgEl.alt = img.name || '图片';
      imgEl.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      imgEl.addEventListener('click', () => {
        this.preview(images, index);
      });

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'image-upload-delete';
      deleteBtn.innerHTML = '&#10005;';
      deleteBtn.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        -webkit-tap-highlight-color: transparent;
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = images.filter((_, i) => i !== index);
        onChange(updated);
      });

      wrapper.appendChild(imgEl);
      wrapper.appendChild(deleteBtn);
      grid.appendChild(wrapper);
    });

    // Add button (only if under max)
    if (images.length < this.MAX_IMAGES) {
      const addBtn = document.createElement('div');
      addBtn.className = 'image-upload-add';
      addBtn.style.cssText = `
        position: relative;
        padding-top: 100%;
        border-radius: 8px;
        border: 2px dashed #d0d0d0;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      `;

      const addContent = document.createElement('div');
      addContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #bbb;
      `;
      addContent.innerHTML = `
        <div style="font-size: 28px; line-height: 1;">+</div>
        <div style="font-size: 11px; margin-top: 2px;">${images.length}/${this.MAX_IMAGES}</div>
      `;

      addBtn.appendChild(addContent);
      addBtn.addEventListener('click', () => {
        // Trigger file input
        const input = container.querySelector('.image-upload-input') || container._fileInput;
        if (input) {
          input.click();
        }
      });

      grid.appendChild(addBtn);
    }

    // Rebuild container contents
    container.innerHTML = '';
    container.appendChild(grid);
    if (existingInput) {
      container.appendChild(existingInput);
    }
  },

  /**
   * Handle file selection
   * @param {FileList|Array} files - selected files
   * @param {Array} images - current images array
   * @param {Function} onChange - change callback
   * @param {HTMLElement} container - container element
   */
  _handleFileSelect(files, images, onChange, container) {
    const remaining = this.MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Toast.warning(`最多只能上传 ${this.MAX_IMAGES} 张图片`);
      return;
    }

    // Filter and limit files
    const validFiles = Array.from(files)
      .filter(file => {
        if (!this.ACCEPTED_TYPES.includes(file.type)) {
          Toast.warning(`不支持的文件格式: ${file.name}`);
          return false;
        }
        if (file.size > this.MAX_FILE_SIZE) {
          Toast.warning(`文件过大: ${file.name} (最大5MB)`);
          return false;
        }
        return true;
      })
      .slice(0, remaining);

    if (validFiles.length === 0) return;

    // Convert all files to base64
    const promises = validFiles.map(file => this._fileToBase64(file));

    Promise.all(promises).then(results => {
      const newImages = results.map(result => ({
        id: Utils.generateId('img'),
        name: result.name,
        data: result.data,
        type: result.type
      }));

      const updated = [...images, ...newImages];
      onChange(updated);
      this._renderGrid(container, updated, onChange);
    }).catch(err => {
      console.error('ImageUpload: error converting files:', err);
      Toast.error('图片处理失败，请重试');
    });
  },

  /**
   * Convert file to base64 string with optional compression
   * @param {File} file - file to convert
   * @returns {Promise<Object>} {name, data (base64), type}
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        // If the file is JPEG or PNG, try to compress via canvas
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
          try {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              // Scale down if image is larger than 1200px on either side
              const maxDim = 1200;
              let width = img.width;
              let height = img.height;

              if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              // Export as JPEG for compression (or keep PNG for transparency)
              const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const dataUrl = canvas.toDataURL(outputType, this.JPEG_QUALITY);

              resolve({
                name: file.name,
                data: dataUrl,
                type: outputType
              });
            };
            img.onerror = () => {
              // Fall back to raw base64 if canvas rendering fails
              resolve({
                name: file.name,
                data: e.target.result,
                type: file.type
              });
            };
            img.src = e.target.result;
          } catch (err) {
            // Fall back to raw base64
            resolve({
              name: file.name,
              data: e.target.result,
              type: file.type
            });
          }
        } else {
          // For non-JPEG/PNG files (GIF, WebP), use raw base64
          resolve({
            name: file.name,
            data: e.target.result,
            type: file.type
          });
        }
      };

      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Preview images in lightbox starting from a given index
   * @param {Array} images - array of image objects
   * @param {number} startIndex - index of image to show first
   */
  preview(images, startIndex) {
    if (!images || images.length === 0) return;

    let currentIndex = startIndex || 0;

    // Create lightbox overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-preview-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 15000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
    `;

    // Counter
    const counter = document.createElement('div');
    counter.style.cssText = `
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    `;
    counter.textContent = `${currentIndex + 1} / ${images.length}`;

    // Image container
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
      padding: 40px 20px;
      overflow: hidden;
    `;

    const imgEl = document.createElement('img');
    imgEl.src = images[currentIndex].data;
    imgEl.alt = images[currentIndex].name || '图片预览';
    imgEl.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: opacity 0.2s ease;
    `;
    imgContainer.appendChild(imgEl);

    // Navigation buttons
    const navStyle = `
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    `;

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&#8249;';
    prevBtn.style.cssText = navStyle + 'left: 12px;';
    prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updatePreview();
    });

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&#8250;';
    nextBtn.style.cssText = navStyle + 'right: 12px;';
    nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % images.length;
      updatePreview();
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    `;
    closeBtn.addEventListener('click', () => {
      this.closePreview();
    });

    // Update preview image
    function updatePreview() {
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = images[currentIndex].data;
        imgEl.alt = images[currentIndex].name || '图片预览';
        counter.textContent = `${currentIndex + 1} / ${images.length}`;
        imgEl.style.opacity = '1';
      }, 150);
    }

    // Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    overlay.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    overlay.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left -> next
          currentIndex = (currentIndex + 1) % images.length;
        } else {
          // Swipe right -> prev
          currentIndex = (currentIndex - 1 + images.length) % images.length;
        }
        updatePreview();
      }
    }, { passive: true });

    // Assemble lightbox
    overlay.appendChild(counter);
    overlay.appendChild(imgContainer);
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    // Store reference for closePreview
    this._lightbox = overlay;

    // Trigger enter animation
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  },

  /**
   * Close lightbox preview
   */
  closePreview() {
    if (this._lightbox) {
      const overlay = this._lightbox;
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 250);
      this._lightbox = null;
    }
  }
};
