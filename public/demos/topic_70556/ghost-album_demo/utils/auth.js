const store = require("./store");

function markUnlocked(mode) {
  var app = getApp();
  app.globalData.unlocked = true;
  app.globalData.sessionMode = mode || "real";
}

function isDecoyMode() {
  return getApp().globalData.sessionMode === "decoy";
}

function getSessionMode() {
  return getApp().globalData.sessionMode || "real";
}

function requireUnlocked() {
  if (!store.hasPassword()) {
    wx.reLaunch({
      url: "/pages/intro/intro"
    });
    return false;
  }

  if (!getApp().globalData.unlocked) {
    wx.reLaunch({
      url: "/pages/unlock/unlock"
    });
    return false;
  }

  return true;
}

module.exports = {
  markUnlocked: markUnlocked,
  isDecoyMode: isDecoyMode,
  getSessionMode: getSessionMode,
  requireUnlocked: requireUnlocked
};
