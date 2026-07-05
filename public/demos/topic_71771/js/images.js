/**
 * 今天吃什么 - 图片上传/加载模块
 * 从服务器 uploads/ 目录加载用户上传的图片
 */

// 已上传图片映射 { foodId: '/uploads/1.jpg' }
var _uploadMap = {};

/**
 * 从服务器获取已上传图片列表
 */
function loadUploadMap() {
  return fetch('/api/uploads')
    .then(function(r) { return r.json(); })
    .then(function(map) {
      _uploadMap = map || {};
      return _uploadMap;
    })
    .catch(function() {
      _uploadMap = {};
      return {};
    });
}

/**
 * 获取食物图片URL
 * @param {number} foodId
 * @returns {string} 图片URL，未上传返回空字符串
 */
function getFoodImageUrl(foodId) {
  return _uploadMap[foodId] || '';
}

/**
 * 上传食物图片
 * @param {number} foodId
 * @param {File} file
 * @returns {Promise}
 */
function uploadFoodImage(foodId, file) {
  var form = new FormData();
  form.append('image', file);
  return fetch('/api/upload/' + foodId, {
    method: 'POST',
    body: form
  }).then(function(r) { return r.json(); });
}

/**
 * 检查食物是否已上传图片
 * @param {number} foodId
 * @returns {boolean}
 */
function hasFoodImage(foodId) {
  return !!_uploadMap[foodId];
}

// 导出
if (typeof window !== 'undefined') {
  window.loadUploadMap = loadUploadMap;
  window.getFoodImageUrl = getFoodImageUrl;
  window.uploadFoodImage = uploadFoodImage;
  window.hasFoodImage = hasFoodImage;
}
