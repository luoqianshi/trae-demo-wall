const auth = require("../../utils/auth");
const store = require("../../utils/store");
const fileStore = require("../../utils/files");
const DEBUG = true;

function debugLog(message, data) {
  if (!DEBUG) {
    return;
  }
  console.log("[GhostAlbum][preview] " + message, data || "");
}

Page({
  data: {
    albumId: "",
    mediaId: "",
    album: {
      name: ""
    },
    media: {
      id: "",
      type: "",
      path: "",
      playPath: "",
      name: "",
      createdAt: 0
    },
    videoSrc: "",
    videoDiagnosticText: "",
    photoList: [],
    currentIndex: 0,
    currentPhotoNumber: 0,
    positionText: "",
    isImage: false,
    isVideo: false,
    hidden: false,
    lastVideoLogAt: 0
  },

  onLoad: function (options) {
    this.setData({
      albumId: options.albumId || "",
      mediaId: options.id || ""
    });
  },

  onShow: function () {
    if (!auth.requireUnlocked()) {
      return;
    }
    this.loadMedia();
  },

  loadMedia: function () {
    var media = store.getMediaItem(this.data.mediaId);
    var album = store.getAlbum(this.data.albumId);
    debugLog("loadMedia:start", {
      albumId: this.data.albumId,
      mediaId: this.data.mediaId,
      media: media,
      album: album
    });

    if (!media || !album) {
      wx.showToast({
        title: "内容不存在",
        icon: "none"
      });
      setTimeout(function () {
        wx.navigateBack();
      }, 600);
      return;
    }
    var isImage = media.type === "image";
    var photoList = [];
    var currentIndex = 0;
    var currentMedia = Object.assign({}, media, {
      createdLabel: this.formatTime(media.createdAt)
    });

    if (isImage) {
      var targetDecoy = auth.isDecoyMode();
      photoList = store.getMediaByAlbum(album.id)
        .filter(function (item) {
          return item.type === "image" && (item.decoy || false) === targetDecoy;
        })
        .map(function (item) {
          return Object.assign({}, item, {
            createdLabel: this.formatTime(item.createdAt)
          });
        }, this);

      currentIndex = photoList.findIndex(function (item) {
        return item.id === media.id;
      });

      if (currentIndex < 0) {
        currentIndex = 0;
      }

      if (!photoList.length) {
        photoList = [currentMedia];
      }

      currentMedia = photoList[currentIndex] || currentMedia;
    }

    this.setData({
      media: currentMedia,
      album: album,
      mediaId: currentMedia.id,
      photoList: photoList,
      currentIndex: currentIndex,
      currentPhotoNumber: isImage ? currentIndex + 1 : 0,
      positionText: isImage ? (currentIndex + 1) + "/" + photoList.length : "",
      isImage: isImage,
      isVideo: media.type === "video",
      videoSrc: media.type === "video" ? currentMedia.path : "",
      videoDiagnosticText: media.type === "video" ? this.getVideoDiagnosticText(currentMedia) : "",
      hidden: false,
      lastVideoLogAt: 0
    }, function () {
      debugLog("loadMedia:setDataDone", {
        isImage: isImage,
        isVideo: media.type === "video",
        videoSrc: media.type === "video" ? currentMedia.path : "",
        media: currentMedia
      });
    });
  },

  getVideoDiagnosticText: function (media) {
    if (!media || media.type !== "video") {
      return "";
    }

    if (media.transcodeStatus === "failed") {
      return "开发者工具未完成视频转码。HEVC/H.265 视频可能只有进度条没有画面，请安装 ffmpeg 或换 H.264 视频。";
    }

    if (media.transcodeStatus === "unavailable") {
      return "当前环境不支持视频转码。若黑屏，请换 H.264 视频或在真机验证。";
    }

    return "";
  },

  formatTime: function (timestamp) {
    var date = new Date(timestamp || Date.now());
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    var hour = String(date.getHours()).padStart(2, "0");
    var minute = String(date.getMinutes()).padStart(2, "0");
    return year + "." + month + "." + day + " · " + hour + ":" + minute;
  },

  goBack: function () {
    wx.navigateBack();
  },

  previewOriginal: function () {
    if (!this.data.isImage) {
      return;
    }
    wx.previewImage({
      urls: this.data.photoList.map(function (item) {
        return item.path;
      }),
      current: this.data.media.path
    });
  },

  onSwiperChange: function (event) {
    var index = event.detail.current;
    var media = this.data.photoList[index];
    if (!media) {
      return;
    }

    this.setData({
      media: media,
      mediaId: media.id,
      currentIndex: index,
      currentPhotoNumber: index + 1,
      positionText: (index + 1) + "/" + this.data.photoList.length,
      hidden: false
    });
  },

  toggleHidden: function () {
    this.setData({
      hidden: !this.data.hidden
    });
  },

  showShareTip: function () {
    wx.showToast({
      title: "为保护隐私，第一版不提供分享",
      icon: "none"
    });
  },

  onVideoLoadedMetadata: function (event) {
    debugLog("video:loadedmetadata", {
      detail: event.detail,
      videoSrc: this.data.videoSrc,
      media: this.data.media
    });
  },

  onVideoPlay: function (event) {
    debugLog("video:play", {
      detail: event.detail,
      videoSrc: this.data.videoSrc
    });
  },

  onVideoPause: function (event) {
    debugLog("video:pause", {
      detail: event.detail,
      videoSrc: this.data.videoSrc
    });
  },

  onVideoWaiting: function (event) {
    debugLog("video:waiting", {
      detail: event.detail,
      videoSrc: this.data.videoSrc
    });
  },

  onVideoEnded: function (event) {
    debugLog("video:ended", {
      detail: event.detail,
      videoSrc: this.data.videoSrc
    });
  },

  onVideoTimeUpdate: function (event) {
    var now = Date.now();
    if (now - this.data.lastVideoLogAt < 2000) {
      return;
    }

    this.setData({
      lastVideoLogAt: now
    });
    debugLog("video:timeupdate", {
      detail: event.detail,
      videoSrc: this.data.videoSrc
    });
  },

  onVideoError: function (event) {
    debugLog("video:error", {
      detail: event.detail,
      videoSrc: this.data.videoSrc,
      media: this.data.media
    });

    wx.showToast({
      title: "视频无法播放，请重新导入或换一个格式",
      icon: "none"
    });
  },

  confirmDelete: function () {
    var that = this;
    wx.showModal({
      title: "删除内容",
      content: "会删除该文件在小程序沙盒中的副本，删除后无法恢复。",
      confirmText: "删除",
      confirmColor: "#ef4444",
      success: function (res) {
        if (!res.confirm) {
          return;
        }
        wx.showLoading({
          title: "删除中",
          mask: true
        });
        fileStore.deleteMediaFiles([that.data.media])
          .then(function () {
            store.removeMediaItems([that.data.media.id]);
            wx.hideLoading();
            wx.navigateBack();
          });
      }
    });
  }
});
