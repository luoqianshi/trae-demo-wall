const hash = require("./hash");

const STORAGE_KEYS = {
  PASSWORD: "ghost_album_password_v1",
  ALBUMS: "ghost_album_albums_v1",
  MEDIA: "ghost_album_media_v1"
};

function now() {
  return Date.now();
}

function createId(prefix) {
  return prefix + "_" + now() + "_" + Math.random().toString(36).slice(2, 8);
}

function read(key, fallback) {
  try {
    var value = wx.getStorageSync(key);
    return value || fallback;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  wx.setStorageSync(key, value);
}

function getPasswordMeta() {
  return read(STORAGE_KEYS.PASSWORD, null);
}

function hasPassword() {
  var meta = getPasswordMeta();
  return !!(meta && meta.salt && meta.hash);
}

function setPassword(password) {
  var salt = createId("salt");
  write(STORAGE_KEYS.PASSWORD, {
    salt: salt,
    hash: hash.digestPassword(password, salt),
    createdAt: now()
  });
}

function verifyPassword(password) {
  var meta = getPasswordMeta();
  if (!meta || !meta.salt || !meta.hash) {
    return false;
  }
  return hash.digestPassword(password, meta.salt) === meta.hash;
}

function hasDecoyPassword() {
  var meta = getPasswordMeta();
  return !!(meta && meta.decoySalt && meta.decoyHash);
}

function isDecoyEnabled() {
  var meta = getPasswordMeta();
  return !!(meta && meta.decoyEnabled);
}

function setDecoyPassword(decoyPassword) {
  var meta = getPasswordMeta();
  if (!meta) {
    return;
  }
  var decoySalt = createId("decoy");
  meta.decoySalt = decoySalt;
  meta.decoyHash = hash.digestPassword(decoyPassword, decoySalt);
  meta.decoyEnabled = true;
  write(STORAGE_KEYS.PASSWORD, meta);
}

function removeDecoyPassword() {
  var meta = getPasswordMeta();
  if (!meta) {
    return;
  }
  delete meta.decoySalt;
  delete meta.decoyHash;
  meta.decoyEnabled = false;
  write(STORAGE_KEYS.PASSWORD, meta);
}

function verifyDecoyPassword(decoyPassword) {
  var meta = getPasswordMeta();
  if (!meta || !meta.decoySalt || !meta.decoyHash || !meta.decoyEnabled) {
    return false;
  }
  return hash.digestPassword(decoyPassword, meta.decoySalt) === meta.decoyHash;
}

function getAlbums() {
  return read(STORAGE_KEYS.ALBUMS, []);
}

function saveAlbums(albums) {
  write(STORAGE_KEYS.ALBUMS, albums);
}

function getAlbum(albumId) {
  return getAlbums().find(function (album) {
    return album.id === albumId;
  }) || null;
}

function createAlbum(name) {
  var album = {
    id: createId("album"),
    name: name,
    coverPath: "",
    count: 0,
    photoCount: 0,
    videoCount: 0,
    decoy: false,
    createdAt: now(),
    updatedAt: now()
  };
  var albums = getAlbums();
  albums.unshift(album);
  saveAlbums(albums);
  return album;
}

function updateAlbum(albumId, patch) {
  var albums = getAlbums();
  var changed = null;
  var next = albums.map(function (album) {
    if (album.id !== albumId) {
      return album;
    }
    changed = Object.assign({}, album, patch, {
      updatedAt: now()
    });
    return changed;
  });
  saveAlbums(next);
  return changed;
}

function deleteAlbum(albumId) {
  saveAlbums(getAlbums().filter(function (album) {
    return album.id !== albumId;
  }));
  saveMedia(getMedia().filter(function (item) {
    return item.albumId !== albumId;
  }));
}

function markAlbumAsDecoy(albumId) {
  updateAlbum(albumId, { decoy: true });
}

function unmarkAlbumAsDecoy(albumId) {
  updateAlbum(albumId, { decoy: false });
}

function markMediaAsDecoy(mediaId) {
  var media = getMedia();
  var next = media.map(function (item) {
    if (item.id !== mediaId) {
      return item;
    }
    return Object.assign({}, item, { decoy: true });
  });
  saveMedia(next);
}

function unmarkMediaAsDecoy(mediaId) {
  var media = getMedia();
  var next = media.map(function (item) {
    if (item.id !== mediaId) {
      return item;
    }
    return Object.assign({}, item, { decoy: false });
  });
  saveMedia(next);
}

function getMedia() {
  return read(STORAGE_KEYS.MEDIA, []);
}

function saveMedia(media) {
  write(STORAGE_KEYS.MEDIA, media);
}

function getMediaByAlbum(albumId) {
  return getMedia()
    .filter(function (item) {
      return item.albumId === albumId;
    })
    .sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });
}

function getMediaItem(mediaId) {
  return getMedia().find(function (item) {
    return item.id === mediaId;
  }) || null;
}

function addMediaItems(items) {
  if (!items || !items.length) {
    return;
  }
  saveMedia(items.concat(getMedia()));
  refreshAlbumStats(items[0].albumId);
}

function removeMediaItems(mediaIds) {
  var lookup = {};
  mediaIds.forEach(function (id) {
    lookup[id] = true;
  });
  var removedAlbumIds = {};
  var next = getMedia().filter(function (item) {
    if (lookup[item.id]) {
      removedAlbumIds[item.albumId] = true;
      return false;
    }
    return true;
  });
  saveMedia(next);
  Object.keys(removedAlbumIds).forEach(refreshAlbumStats);
}

function refreshAlbumStats(albumId) {
  var items = getMediaByAlbum(albumId);
  var photoCount = items.filter(function (item) {
    return item.type === "image";
  }).length;
  var videoCount = items.filter(function (item) {
    return item.type === "video";
  }).length;
  var coverItem = items.find(function (item) {
    return item.type === "image" || !!item.thumbPath;
  });
  updateAlbum(albumId, {
    count: items.length,
    photoCount: photoCount,
    videoCount: videoCount,
    coverPath: coverItem ? (coverItem.thumbPath || coverItem.path) : ""
  });
}

module.exports = {
  STORAGE_KEYS: STORAGE_KEYS,
  createId: createId,
  hasPassword: hasPassword,
  setPassword: setPassword,
  verifyPassword: verifyPassword,
  hasDecoyPassword: hasDecoyPassword,
  isDecoyEnabled: isDecoyEnabled,
  setDecoyPassword: setDecoyPassword,
  removeDecoyPassword: removeDecoyPassword,
  verifyDecoyPassword: verifyDecoyPassword,
  getAlbums: getAlbums,
  getAlbum: getAlbum,
  createAlbum: createAlbum,
  updateAlbum: updateAlbum,
  deleteAlbum: deleteAlbum,
  markAlbumAsDecoy: markAlbumAsDecoy,
  unmarkAlbumAsDecoy: unmarkAlbumAsDecoy,
  markMediaAsDecoy: markMediaAsDecoy,
  unmarkMediaAsDecoy: unmarkMediaAsDecoy,
  getMedia: getMedia,
  getMediaByAlbum: getMediaByAlbum,
  getMediaItem: getMediaItem,
  addMediaItems: addMediaItems,
  removeMediaItems: removeMediaItems,
  refreshAlbumStats: refreshAlbumStats
};
