/**
 * VidBuddy 存储管理模块
 * 封装 Chrome 扩展存储 API，提供统一的数据持久化接口
 */
const VT_STORAGE = {};

/**
 * 存储键名常量定义
 */
const STORAGE_KEYS = {
  MARKERS: "markers",
  SCREENSHOTS: "screenshots",
  PROGRESS_HISTORY: "progressHistory",
};

/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 上下文是否有效
 */
function isContextValid() {
  return !!(chrome && chrome.runtime && chrome.runtime.id);
}

/**
 * 删除指定标记
 * @param {string} markerId - 标记ID
 * @returns {Promise<Array>} 删除后的标记列表
 */
VT_STORAGE.deleteMarker = function (markerId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ markers: [] }, (result) => {
      const updated = result.markers.filter((m) => m.id !== markerId);
      chrome.storage.local.set({ markers: updated }, () => {
        resolve(updated);
      });
    });
  });
};

/**
 * 删除指定截图
 * @param {string} snapId - 截图ID
 * @returns {Promise<Array>} 删除后的截图列表
 */
VT_STORAGE.deleteScreenshot = function (snapId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ screenshots: [], markers: [] }, (result) => {
      const updatedScreenshots = result.screenshots.filter((s) => s.id !== snapId);
      const updatedMarkers = result.markers.filter((m) => m.screenshotId !== snapId);
      chrome.storage.local.remove([`screenshot_${snapId}`], () => {
        chrome.storage.local.set({ screenshots: updatedScreenshots, markers: updatedMarkers }, () => {
          resolve(updatedScreenshots);
        });
      });
    });
  });
};

/**
 * 删除视频相关的所有数据（播放进度、标记、截图）
 * 级联删除逻辑：
 * 1. 删除播放进度记录
 * 2. 删除相关标记点（支持跨集匹配）
 * 3. 删除相关截图元数据和实际图片数据
 * 跨集匹配说明：
 * 某些平台（如B站分P、网易云课堂）同一视频的不同集数可能生成不同的videoId，
 * 通过generateFallbackIds生成备选ID，确保删除时能匹配到所有相关数据
 * @param {string} videoId - 视频ID
 * @returns {Promise} 删除完成的Promise
 */
VT_STORAGE.deleteProgress = function (videoId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve();
      return;
    }
    if (!videoId) {
      resolve();
      return;
    }
    chrome.storage.local.get(null, (allData) => {
      const history = allData.progressHistory || [];
      // 直接删除匹配的播放进度记录
      const updatedHistory = history.filter((p) => p.id !== videoId);

      // 跨集匹配：生成备选ID，确保删除同一视频不同集数的关联数据
      // 例如：bili_BV123_p2 会匹配 bili_BV123（母集）
      const fallbackIds = window.VT_UTILS ? window.VT_UTILS.generateFallbackIds(videoId) : [];
      const allMatchIds = [videoId, ...fallbackIds];

      // 删除相关标记点
      const markers = allData.markers || [];
      const updatedMarkers = markers.filter(
        (m) => !allMatchIds.includes(m.videoId),
      );

      // 删除相关截图：需要同时删除元数据和实际图片数据
      const screenshots = allData.screenshots || [];
      const targetSnaps = screenshots.filter((s) =>
        allMatchIds.includes(s.videoId),
      );
      const updatedScreenshots = screenshots.filter(
        (s) => !allMatchIds.includes(s.videoId),
      );

      // 构建截图实际数据的存储键名列表
      const deleteKeys = targetSnaps.map((s) => `screenshot_${s.id}`);

      // 先删除截图实际数据（base64图片），再更新元数据
      chrome.storage.local.remove(deleteKeys, () => {
        chrome.storage.local.set(
          {
            progressHistory: updatedHistory,
            markers: updatedMarkers,
            screenshots: updatedScreenshots,
          },
          () => {
            resolve();
          },
        );
      });
    });
  });
};

/**
 * 保存视频播放进度
 * @param {string} videoId - 视频ID
 * @param {Object} progressData - 进度数据
 * @returns {Promise<Array>} 更新后的进度历史列表
 */
VT_STORAGE.saveProgress = function (videoId, progressData) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ progressHistory: [] }, (result) => {
      const history = result.progressHistory;
      const existingIndex = history.findIndex((p) => p.id === videoId);

      if (existingIndex >= 0) {
        history[existingIndex] = { ...history[existingIndex], ...progressData };
      } else {
        history.unshift({ id: videoId, ...progressData });
      }

      chrome.storage.local.set({ progressHistory: history }, () => {
        resolve(history);
      });
    });
  });
};

/**
 * 加载视频播放进度
 * @param {string} videoId - 视频ID
 * @returns {Promise<Object|null>} 进度数据或null
 */
VT_STORAGE.loadProgress = function (videoId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve(null);
      return;
    }
    chrome.storage.local.get({ progressHistory: [] }, (result) => {
      const progress = result.progressHistory.find((p) => p.id === videoId);
      resolve(progress || null);
    });
  });
};

/**
 * 保存标记
 * @param {Object} marker - 标记对象
 * @returns {Promise<Array>} 更新后的标记列表
 */
VT_STORAGE.saveMarker = function (marker) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ markers: [] }, (result) => {
      const markers = result.markers;
      const existingIndex = markers.findIndex((m) => m.id === marker.id);

      if (existingIndex >= 0) {
        markers[existingIndex] = { ...markers[existingIndex], ...marker };
      } else {
        markers.push(marker);
      }

      chrome.storage.local.set({ markers: markers }, () => {
        resolve(markers);
      });
    });
  });
};

/**
 * 加载指定视频的标记列表
 * @param {string} videoId - 视频ID
 * @returns {Promise<Array>} 按时间排序的标记列表
 */
VT_STORAGE.loadMarkers = function (videoId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ markers: [] }, (result) => {
      const markers = result.markers.filter((m) => m.videoId === videoId);
      resolve(markers.sort((a, b) => a.time - b.time));
    });
  });
};

/**
 * 加载所有标记
 * @returns {Promise<Array>} 所有标记列表
 */
VT_STORAGE.loadAllMarkers = function () {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ markers: [] }, (result) => {
      resolve(result.markers);
    });
  });
};

/**
 * 保存截图信息
 * @param {Object} screenshot - 截图信息对象
 * @returns {Promise<Array>} 更新后的截图列表
 */
VT_STORAGE.saveScreenshot = function (screenshot) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ screenshots: [] }, (result) => {
      const screenshots = result.screenshots;
      const existingIndex = screenshots.findIndex(
        (s) => s.id === screenshot.id,
      );

      if (existingIndex >= 0) {
        screenshots[existingIndex] = {
          ...screenshots[existingIndex],
          ...screenshot,
        };
      } else {
        screenshots.push(screenshot);
      }

      chrome.storage.local.set({ screenshots: screenshots }, () => {
        resolve(screenshots);
      });
    });
  });
};

/**
 * 加载指定视频的截图列表
 * @param {string} videoId - 视频ID
 * @returns {Promise<Array>} 按时间戳排序的截图列表
 */
VT_STORAGE.loadScreenshots = function (videoId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ screenshots: [] }, (result) => {
      const screenshots = result.screenshots.filter(
        (s) => s.videoId === videoId,
      );
      resolve(screenshots.sort((a, b) => a.timestamp - b.timestamp));
    });
  });
};

/**
 * 加载所有截图信息
 * @returns {Promise<Array>} 所有截图信息列表
 */
VT_STORAGE.loadAllScreenshots = function () {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ screenshots: [] }, (result) => {
      resolve(result.screenshots);
    });
  });
};

/**
 * 加载截图的Base64数据
 * @param {string} screenshotId - 截图ID
 * @returns {Promise<string|null>} 截图的Base64数据或null
 */
VT_STORAGE.loadScreenshotData = function (screenshotId) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve(null);
      return;
    }
    chrome.storage.local.get(`screenshot_${screenshotId}`, (result) => {
      resolve(result[`screenshot_${screenshotId}`] || null);
    });
  });
};

/**
 * 批量加载多个截图的Base64数据
 * @param {Array<string>} screenshotIds - 截图ID列表
 * @returns {Promise<Object>} 截图ID到Base64数据的映射
 */
VT_STORAGE.loadScreenshotsDataMultiple = function (screenshotIds) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve({});
      return;
    }
    const keys = screenshotIds.map(id => `screenshot_${id}`);
    chrome.storage.local.get(keys, (result) => {
      resolve(result || {});
    });
  });
};

/**
 * 保存截图的Base64数据
 * @param {string} screenshotId - 截图ID
 * @param {string} dataUrl - Base64编码的图片数据
 * @returns {Promise} 保存完成的Promise
 */
VT_STORAGE.saveScreenshotData = function (screenshotId, dataUrl) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve();
      return;
    }
    const data = {};
    data[`screenshot_${screenshotId}`] = dataUrl;
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
};

/**
 * 加载播放进度历史
 * @returns {Promise<Array>} 播放进度历史列表
 */
VT_STORAGE.loadProgressHistory = function () {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve([]);
      return;
    }
    chrome.storage.local.get({ progressHistory: [] }, (result) => {
      resolve(result.progressHistory);
    });
  });
};

/**
 * 加载配置项
 * @param {Object|Array<string>} keys - 配置键名列表或默认值对象
 * @returns {Promise<Object>} 配置数据
 */
VT_STORAGE.loadConfig = function (keys) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve({});
      return;
    }
    chrome.storage.local.get(keys, (result) => {
      resolve(result);
    });
  });
};

/**
 * 保存配置项
 * @param {Object} data - 配置数据
 * @returns {Promise} 保存完成的Promise
 */
VT_STORAGE.saveConfig = function (data) {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve();
      return;
    }
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
};

/**
 * 监听配置变化
 * @param {Function} callback - 变化回调函数
 */
VT_STORAGE.onConfigChange = function (callback) {
  if (!isContextValid()) return;
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      callback(changes);
    }
  });
};

/**
 * 删除指定天数之前的旧数据
 * @param {number} days - 保留天数
 * @returns {Promise} 清理完成的Promise
 */
VT_STORAGE.removeOldData = function (days) {
  if (!isContextValid()) return Promise.resolve();
  if (!days || days <= 0) return Promise.resolve();

  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  return Promise.all([
    VT_STORAGE.loadProgressHistory().then((history) => {
      const filtered = history.filter((h) => h.updatedAt >= cutoffTime);
      return new Promise((resolve) => {
        chrome.storage.local.set({ progressHistory: filtered }, resolve);
      });
    }),
    VT_STORAGE.loadAllMarkers().then((markers) => {
      const filtered = markers.filter((m) => m.time >= cutoffTime);
      return new Promise((resolve) => {
        chrome.storage.local.set({ markers: filtered }, resolve);
      });
    }),
    VT_STORAGE.loadAllScreenshots().then((screenshots) => {
      const filtered = screenshots.filter((s) => s.timestamp >= cutoffTime);
      const removedIds = screenshots
        .filter((s) => s.timestamp < cutoffTime)
        .map((s) => `screenshot_${s.id}`);

      return new Promise((resolve) => {
        if (removedIds.length > 0) {
          chrome.storage.local.remove(removedIds, () => {
            chrome.storage.local.set({ screenshots: filtered }, resolve);
          });
        } else {
          chrome.storage.local.set({ screenshots: filtered }, resolve);
        }
      });
    }),
  ]);
};

/**
 * 获取存储使用情况
 * @returns {Promise<Object>} 存储使用信息对象
 */
VT_STORAGE.getStorageUsage = function () {
  return new Promise((resolve) => {
    if (!isContextValid()) {
      resolve({ bytes: 0, limit: 5242880, percent: "0.0", formatted: "0 B", limitFormatted: "5 MB" });
      return;
    }
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      const limit = chrome.storage.local.QUOTA_BYTES || 5242880;
      const percent = ((bytes / limit) * 100).toFixed(1);
      resolve({
        bytes,
        limit,
        percent,
        formatted: formatBytes(bytes),
        limitFormatted: formatBytes(limit),
      });
    });
  });
};

/**
 * 将字节数格式化为可读字符串
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串（如 "1.5 MB"）
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

if (typeof window !== "undefined") {
  window.VT_STORAGE = VT_STORAGE;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = VT_STORAGE;
}

if (typeof exports !== "undefined") {
  Object.keys(VT_STORAGE).forEach((key) => {
    exports[key] = VT_STORAGE[key];
  });
}
