/**
 * 图片处理模块
 * 负责图片上传、预览、拖拽处理
 */

var ImageProcessor = {

  /**
   * 初始化图片上传相关事件
   */
  init: function() {
    var self = this;
    var uploadArea = document.getElementById('uploadArea');
    var uploadBtn = document.getElementById('uploadBtn');
    var fileInput = document.getElementById('fileInput');
    var reuploadBtn = document.getElementById('reuploadBtn');

    // 点击上传按钮
    uploadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      fileInput.click();
    });

    // 点击上传区域
    uploadArea.addEventListener('click', function() {
      fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        self.handleFile(e.target.files[0]);
      }
    });

    // 拖拽
    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        self.handleFile(e.dataTransfer.files[0]);
      }
    });

    // 重新上传
    reuploadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      self.resetUpload();
      fileInput.click();
    });
  },

  /**
   * 处理选择的文件
   */
  handleFile: function(file) {
    // 验证文件类型
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      alert('请上传 JPG、PNG 或 WebP 格式的图片');
      return;
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }

    var self = this;
    var reader = new FileReader();

    // ★ 立即标记图片为"加载中"，防止旧的示例图片数据被误用
    if (window.App) {
      window.App.currentImageDataUrl = null;
      window.App.currentDemoType = null;
    }

    reader.onload = function(e) {
      self.showPreview(e.target.result);
      // 用户上传了真实图片，清除示例类型标记
      if (window.App) {
        window.App.currentImageDataUrl = e.target.result;
      }
    };

    reader.onerror = function() {
      alert('图片读取失败，请重新选择');
    };

    reader.readAsDataURL(file);
  },

  /**
   * 显示图片预览
   */
  showPreview: function(dataUrl) {
    var placeholder = document.getElementById('uploadPlaceholder');
    var previewContainer = document.getElementById('previewContainer');
    var previewImage = document.getElementById('previewImage');
    var actionBar = document.getElementById('actionBar');

    previewImage.src = dataUrl;
    placeholder.style.display = 'none';
    previewContainer.style.display = 'flex';
    actionBar.style.display = 'block';
  },

  /**
   * 重置上传区域
   */
  resetUpload: function() {
    var placeholder = document.getElementById('uploadPlaceholder');
    var previewContainer = document.getElementById('previewContainer');
    var actionBar = document.getElementById('actionBar');
    var fileInput = document.getElementById('fileInput');

    placeholder.style.display = 'flex';
    previewContainer.style.display = 'none';
    actionBar.style.display = 'none';
    fileInput.value = '';
  }
};