const auth = require("../../utils/auth");
const store = require("../../utils/store");

Page({
  data: {
    albums: [],
    visibleAlbums: [],
    query: "",
    showAlbumModal: false,
    albumName: "",
    errorText: "",
    isDecoy: false
  },

  onShow: function () {
    if (!auth.requireUnlocked()) {
      return;
    }
    this.setData({
      isDecoy: auth.isDecoyMode()
    });
    this.loadAlbums();
  },

  loadAlbums: function () {
    var targetDecoy = auth.isDecoyMode();
    var albums = store.getAlbums().filter(function (album) {
      return (album.decoy || false) === targetDecoy;
    });
    this.setData({
      albums: albums
    });
    this.applySearch(this.data.query, albums);
  },

  applySearch: function (query, albums) {
    var source = albums || this.data.albums;
    var keyword = (query || "").trim().toLowerCase();
    var visibleAlbums = keyword
      ? source.filter(function (album) {
        return album.name.toLowerCase().indexOf(keyword) >= 0;
      })
      : source;

    this.setData({
      visibleAlbums: visibleAlbums
    });
  },

  onSearchInput: function (event) {
    var query = event.detail.value;
    this.setData({
      query: query
    });
    this.applySearch(query);
  },

  openAlbumModal: function () {
    this.setData({
      showAlbumModal: true,
      albumName: "",
      errorText: ""
    });
  },

  closeAlbumModal: function () {
    this.setData({
      showAlbumModal: false,
      albumName: "",
      errorText: ""
    });
  },

  onAlbumNameInput: function (event) {
    this.setData({
      albumName: event.detail.value,
      errorText: ""
    });
  },

  submitAlbum: function () {
    var name = this.data.albumName.trim();
    if (!name) {
      this.setData({
        errorText: "请输入相册集名称"
      });
      return;
    }

    var album = store.createAlbum(name);
    if (auth.isDecoyMode()) {
      store.markAlbumAsDecoy(album.id);
    }
    this.closeAlbumModal();
    wx.navigateTo({
      url: "/pages/album/album?id=" + album.id
    });
  },

  openAlbum: function (event) {
    wx.navigateTo({
      url: "/pages/album/album?id=" + event.currentTarget.dataset.id
    });
  },

  showLocalOnlyTip: function () {
    wx.showToast({
      title: "数据仅保存在本机小程序沙盒",
      icon: "none"
    });
  }
});
