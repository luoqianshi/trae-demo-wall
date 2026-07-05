const auth = require("../../utils/auth");
const store = require("../../utils/store");
const fileStore = require("../../utils/files");
const DEBUG = true;

function debugLog(message, data) {
  if (!DEBUG) {
    return;
  }
  console.log("[GhostAlbum][album] " + message, data || "");
}

Page({
  data: {
    albumId: "",
    album: {
      name: "",
      count: 0,
      photoCount: 0,
      videoCount: 0
    },
    mediaList: [],
    showImportSheet: false,
    showAlbumMenu: false,
    importing: false
  },

  onLoad: function (options) {
    this.setData({
      albumId: options.id || ""
    });
  },

  onShow: function () {
    if (!auth.requireUnlocked()) {
      return;
    }
    this.loadAlbum();
  },

  loadAlbum: function () {
    var album = store.getAlbum(this.data.albumId);
    if (!album) {
      wx.showToast({
        title: "相册集不存在",
        icon: "none"
      });
      setTimeout(function () {
        wx.navigateBack();
      }, 600);
      return;
    }

    var targetDecoy = auth.isDecoyMode();
    var mediaList = store.getMediaByAlbum(album.id)
      .filter(function (item) {
        return (item.decoy || false) === targetDecoy;
      })
      .map(function (item) {
        var coverPath = item.type === "video" ? item.thumbPath : item.path;
        return Object.assign({}, item, {
          coverPath: coverPath,
          hasCover: !!coverPath,
          isVideo: item.type === "video"
        });
      });

    this.setData({
      album: album,
      mediaList: mediaList
    });
  },

  goBack: function () {
    wx.navigateBack();
  },

  openImportSheet: function () {
    this.setData({
      showImportSheet: true
    });
  },

  closeImportSheet: function () {
    this.setData({
      showImportSheet: false
    });
  },

  openAlbumMenu: function () {
    this.setData({
      showAlbumMenu: true
    });
  },

  noop: function () {},

  closeAlbumMenu: function () {
    this.setData({
      showAlbumMenu: false
    });
  },

  chooseFromSystemAlbum: function () {
    var that = this;
    if (that.data.importing) {
      return;
    }
    that.closeImportSheet();
    wx.chooseMedia({
      count: 9,
      mediaType: ["image", "video"],
      sourceType: ["album"],
      sizeType: ["compressed"],
      success: function (res) {
        debugLog("chooseMedia:success", res);
        that.importFiles(res.tempFiles || [], "system_album");
      },
      fail: function (error) {
        debugLog("chooseMedia:fail", error);
      }
    });
  },

  chooseFromChat: function () {
    var that = this;
    if (that.data.importing) {
      return;
    }
    that.closeImportSheet();
    wx.chooseMessageFile({
      count: 9,
      type: "all",
      success: function (res) {
        debugLog("chooseMessageFile:success", res);
        var files = (res.tempFiles || []).filter(function (item) {
          return !!fileStore.inferType(item);
        });
        if (!files.length) {
          wx.showToast({
            title: "请选择图片或视频文件",
            icon: "none"
          });
          return;
        }
        that.importFiles(files, "wechat_chat");
      },
      fail: function (error) {
        debugLog("chooseMessageFile:fail", error);
      }
    });
  },

  importFiles: function (pickedFiles, source) {
    var that = this;
    if (!pickedFiles.length) {
      return;
    }
    debugLog("importFiles:start", {
      source: source,
      count: pickedFiles.length,
      pickedFiles: pickedFiles
    });

    that.setData({
      importing: true
    });
    wx.showLoading({
      title: "处理中",
      mask: true
    });

    var isDecoy = auth.isDecoyMode();
    fileStore.persistPickedFiles(pickedFiles, that.data.albumId, source)
      .then(function (items) {
        wx.hideLoading();
        that.setData({
          importing: false
        });
        debugLog("importFiles:persisted", {
          count: items.length,
          items: items
        });
        if (!items.length) {
          wx.showToast({
            title: "没有可导入的照片或视频",
            icon: "none"
          });
          return;
        }
        var taggedItems = items.map(function (item) {
          return Object.assign({}, item, { decoy: isDecoy });
        });
        store.addMediaItems(taggedItems);
        that.loadAlbum();
        that.showVideoDiagnostics(items);
        wx.showToast({
          title: "已导入 " + items.length + " 项",
          icon: "none"
        });
      })
      .catch(function (error) {
        wx.hideLoading();
        that.setData({
          importing: false
        });
        debugLog("importFiles:fail", error);
        wx.showToast({
          title: "导入失败，请检查文件权限或空间",
          icon: "none"
        });
      });
  },

  showVideoDiagnostics: function (items) {
    var failedVideos = items.filter(function (item) {
      return item.type === "video" && item.transcodeStatus === "failed";
    });

    if (!failedVideos.length) {
      return;
    }

    wx.showModal({
      title: "视频可能黑屏",
      content: "当前开发者工具无法转码该视频。若视频为 HEVC/H.265，可能只有进度条没有画面。请安装开发者工具 ffmpeg 支持，或换用 H.264/AVC 编码的视频后重新导入。",
      confirmText: "知道了",
      showCancel: false
    });
  },

  openMedia: function (event) {
    var mediaId = event.currentTarget.dataset.id;
    debugLog("openMedia", {
      mediaId: mediaId,
      media: store.getMediaItem(mediaId)
    });
    wx.navigateTo({
      url: "/pages/preview/preview?albumId=" + this.data.albumId + "&id=" + mediaId
    });
  },

  confirmDeleteAlbum: function () {
    var that = this;
    that.closeAlbumMenu();
    wx.showModal({
      title: "删除相册集",
      content: "会删除该相册集内已导入的小程序本地文件，删除后无法恢复。",
      confirmText: "删除",
      confirmColor: "#ef4444",
      success: function (res) {
        if (!res.confirm) {
          return;
        }
        var items = store.getMediaByAlbum(that.data.albumId);
        wx.showLoading({
          title: "删除中",
          mask: true
        });
        fileStore.deleteMediaFiles(items)
          .then(function () {
            store.deleteAlbum(that.data.albumId);
            wx.hideLoading();
            wx.navigateBack();
          });
      }
    });
  }
});
