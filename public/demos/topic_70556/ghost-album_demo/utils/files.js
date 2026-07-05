const store = require("./store");

const ROOT_DIR = wx.env.USER_DATA_PATH + "/ghost-album";
const MEDIA_DIR = ROOT_DIR + "/media";
const THUMB_DIR = ROOT_DIR + "/thumbs";
const DEBUG = true;

function debugLog(scope, message, data) {
  if (!DEBUG) {
    return;
  }
  console.log("[GhostAlbum][" + scope + "] " + message, data || "");
}

function normalizeError(error) {
  if (!error) {
    return "";
  }
  return error.errMsg || error.message || error;
}

function getFs() {
  return wx.getFileSystemManager();
}

function ensureDir(path) {
  var fs = getFs();
  try {
    fs.accessSync(path);
  } catch (error) {
    try {
      fs.mkdirSync(path, true);
    } catch (mkdirError) {
      try {
        fs.mkdirSync(path);
      } catch (ignored) {
      }
    }
  }
}

function ensureMediaDirs() {
  ensureDir(ROOT_DIR);
  ensureDir(MEDIA_DIR);
  ensureDir(THUMB_DIR);
}

function getExtension(path, fallback) {
  var clean = (path || "").split("?")[0].split("#")[0];
  var matched = clean.match(/\.([a-zA-Z0-9]+)$/);
  if (!matched) {
    return fallback;
  }
  return matched[1].toLowerCase();
}

function getPickedFileExtension(file, type) {
  var fallback = type === "video" ? "mp4" : "jpg";
  var ext = getExtension(file.tempFilePath || file.path || "", "");
  if (ext) {
    return ext;
  }
  return getExtension(file.name || "", fallback);
}

function inferType(file) {
  if (file.fileType === "image" || file.type === "image") {
    return "image";
  }
  if (file.fileType === "video" || file.type === "video") {
    return "video";
  }
  var path = file.tempFilePath || file.path || file.name || "";
  var ext = getExtension(path, "");
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].indexOf(ext) >= 0) {
    return "image";
  }
  if (["mp4", "mov", "m4v", "avi", "mkv", "webm"].indexOf(ext) >= 0) {
    return "video";
  }
  return "";
}

function copyFile(srcPath, destPath) {
  return new Promise(function (resolve, reject) {
    debugLog("files", "copyFile:start", {
      srcPath: srcPath,
      destPath: destPath
    });
    getFs().copyFile({
      srcPath: srcPath,
      destPath: destPath,
      success: function () {
        debugLog("files", "copyFile:success", {
          destPath: destPath
        });
        resolve(destPath);
      },
      fail: function (error) {
        debugLog("files", "copyFile:fail", {
          srcPath: srcPath,
          destPath: destPath,
          error: normalizeError(error)
        });
        reject(error);
      }
    });
  });
}

function savePickedFile(srcPath) {
  return new Promise(function (resolve, reject) {
    debugLog("files", "saveFile:start", {
      tempFilePath: srcPath
    });
    getFs().saveFile({
      tempFilePath: srcPath,
      success: function (res) {
        debugLog("files", "saveFile:success", res);
        resolve(res.savedFilePath);
      },
      fail: function (error) {
        debugLog("files", "saveFile:fail", {
          tempFilePath: srcPath,
          error: normalizeError(error)
        });
        reject(error);
      }
    });
  });
}

function compressVideoSource(srcPath) {
  return new Promise(function (resolve) {
    if (!wx.compressVideo) {
      debugLog("files", "compressVideo:unavailable", {
        src: srcPath
      });
      resolve({
        path: srcPath,
        status: "unavailable",
        error: "wx.compressVideo unavailable"
      });
      return;
    }

    debugLog("files", "compressVideo:start", {
      src: srcPath
    });
    wx.compressVideo({
      src: srcPath,
      quality: "high",
      success: function (res) {
        debugLog("files", "compressVideo:success", res);
        resolve({
          path: res.tempFilePath || srcPath,
          status: res.tempFilePath ? "success" : "unchanged",
          error: ""
        });
      },
      fail: function (error) {
        var message = normalizeError(error);
        debugLog("files", "compressVideo:fail", {
          src: srcPath,
          error: message
        });
        resolve({
          path: srcPath,
          status: "failed",
          error: message
        });
      }
    });
  });
}

function deleteFile(filePath) {
  return new Promise(function (resolve) {
    if (!filePath) {
      resolve();
      return;
    }
    getFs().unlink({
      filePath: filePath,
      success: resolve,
      fail: resolve
    });
  });
}

function getSourcePath(file) {
  return file.tempFilePath || file.path || "";
}

function getDisplayName(file, type, id) {
  if (file.name) {
    return file.name;
  }
  return (type === "video" ? "video_" : "photo_") + id.slice(-8);
}

function getVideoThumbSource(file) {
  return file.thumbTempFilePath ||
    file.thumbnailPath ||
    file.tempThumbPath ||
    file.coverTempFilePath ||
    file.poster ||
    file.thumbPath ||
    "";
}

function getPickedFileDebugInfo(file) {
  return {
    keys: Object.keys(file || {}),
    name: file.name || "",
    type: file.type || "",
    fileType: file.fileType || "",
    tempFilePath: file.tempFilePath || "",
    path: file.path || "",
    size: file.size || 0,
    duration: file.duration || 0,
    width: file.width || 0,
    height: file.height || 0,
    thumbTempFilePath: file.thumbTempFilePath || "",
    thumbnailPath: file.thumbnailPath || "",
    tempThumbPath: file.tempThumbPath || "",
    coverTempFilePath: file.coverTempFilePath || ""
  };
}

function persistPickedFile(file, albumId, source) {
  return new Promise(function (resolve, reject) {
    ensureMediaDirs();

    var type = inferType(file);
    var sourcePath = getSourcePath(file);
    debugLog("files", "persistPickedFile:start", {
      albumId: albumId,
      source: source,
      inferredType: type,
      sourcePath: sourcePath,
      file: getPickedFileDebugInfo(file)
    });

    if (!type || !sourcePath) {
      debugLog("files", "persistPickedFile:unsupported", {
        type: type,
        sourcePath: sourcePath
      });
      reject(new Error("unsupported file"));
      return;
    }

    var id = store.createId("media");
    var mediaExt = getPickedFileExtension(file, type);
    var mediaPath = MEDIA_DIR + "/" + id + "." + mediaExt;
    var thumbTempPath = type === "video" ? getVideoThumbSource(file) : "";
    var thumbPath = "";
    var playableSourcePath = sourcePath;
    var transcodeStatus = type === "video" ? "not_started" : "";
    var transcodeError = "";

    (type === "video" ? compressVideoSource(sourcePath) : Promise.resolve(sourcePath))
      .then(function (nextSource) {
        if (type === "video") {
          playableSourcePath = nextSource.path || sourcePath;
          transcodeStatus = nextSource.status || "unknown";
          transcodeError = nextSource.error || "";
        } else {
          playableSourcePath = nextSource || sourcePath;
        }
        mediaExt = getExtension(playableSourcePath, "") || mediaExt;
        mediaPath = MEDIA_DIR + "/" + id + "." + mediaExt;
        if (type === "video") {
          return copyFile(playableSourcePath, mediaPath);
        }
        return savePickedFile(playableSourcePath);
      })
      .catch(function () {
        return copyFile(playableSourcePath, mediaPath);
      })
      .then(function (savedMediaPath) {
        mediaPath = savedMediaPath || mediaPath;
        if (type === "video" && thumbTempPath) {
          var thumbExt = getExtension(thumbTempPath, "jpg");
          thumbPath = THUMB_DIR + "/" + id + "." + thumbExt;
          return copyFile(thumbTempPath, thumbPath).catch(function () {
            thumbPath = "";
            return null;
          });
        }
        thumbPath = type === "image" ? mediaPath : "";
        return null;
      })
      .then(function () {
        var mediaItem = {
          id: id,
          albumId: albumId,
          type: type,
          path: mediaPath,
          playPath: "",
          thumbPath: thumbPath,
          name: getDisplayName(file, type, id),
          size: file.size || 0,
          duration: file.duration || 0,
          width: file.width || 0,
          height: file.height || 0,
          source: source,
          decoy: false,
          transcodeStatus: transcodeStatus,
          transcodeError: transcodeError,
          createdAt: Date.now()
        };
        debugLog("files", "persistPickedFile:done", mediaItem);
        resolve(mediaItem);
      })
      .catch(function (error) {
        debugLog("files", "persistPickedFile:fail", {
          id: id,
          sourcePath: sourcePath,
          playableSourcePath: playableSourcePath,
          mediaPath: mediaPath,
          error: normalizeError(error)
        });
        reject(error);
      });
  });
}

function persistPickedFiles(files, albumId, source) {
  debugLog("files", "persistPickedFiles:start", {
    albumId: albumId,
    source: source,
    count: files.length
  });
  var tasks = files.map(function (file) {
    return persistPickedFile(file, albumId, source).catch(function (error) {
      debugLog("files", "persistPickedFiles:itemSkipped", {
        error: normalizeError(error),
        file: getPickedFileDebugInfo(file)
      });
      return null;
    });
  });
  return Promise.all(tasks).then(function (items) {
    var persistedItems = items.filter(function (item) {
      return !!item;
    });
    debugLog("files", "persistPickedFiles:done", {
      requested: files.length,
      persisted: persistedItems.length,
      items: persistedItems
    });
    return persistedItems;
  });
}

function deleteMediaFiles(items) {
  var tasks = [];
  items.forEach(function (item) {
    tasks.push(deleteFile(item.path));
    if (item.thumbPath && item.thumbPath !== item.path) {
      tasks.push(deleteFile(item.thumbPath));
    }
  });
  return Promise.all(tasks);
}

module.exports = {
  inferType: inferType,
  persistPickedFiles: persistPickedFiles,
  deleteMediaFiles: deleteMediaFiles
};
