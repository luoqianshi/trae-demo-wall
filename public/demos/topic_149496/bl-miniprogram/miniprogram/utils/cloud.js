// utils/cloud.js - 云函数调用封装

// 统一调用云函数
function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success(res) {
        resolve(res.result)
      },
      fail(err) {
        console.error(`云函数 ${name} 调用失败:`, err)
        reject(err)
      }
    })
  })
}

// 登录（含定位）
function login(nickname, avatar, community, location) {
  return callFunction('login', { nickname, avatar, community, location })
}

// 发布互助
function publishHelp(data) {
  return callFunction('publishHelp', data)
}

// 发布闲置
function publishIdle(data) {
  return callFunction('publishIdle', data)
}

// 获取列表（基于距离）
function getList(data) {
  return callFunction('getList', data)
}

// 获取详情（含距离）
function getDetail(data) {
  return callFunction('getDetail', data)
}

// 完成互助
function completeHelp(data) {
  return callFunction('completeHelp', data)
}

// 完成交易
function completeTrade(data) {
  return callFunction('completeTrade', data)
}

// 更新个人信息（含定位）
function updateProfile(data) {
  return callFunction('updateProfile', data)
}

// 删除记录
function deleteRecord(data) {
  return callFunction('deleteRecord', data)
}

// 编辑信息或切换显隐
function updateRecord(data) {
  return callFunction('updateRecord', data)
}

// 初始化数据库（含演示数据）
function initDatabase(location) {
  return callFunction('initDatabase', { location })
}

// 上传图片到云存储
function uploadFile(filePath, cloudPath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success(res) {
        resolve(res.fileID)
      },
      fail(err) {
        console.error('上传失败:', err)
        reject(err)
      }
    })
  })
}

// 获取用户信息
function getUserInfo(openid) {
  return callFunction('getUserInfo', { openid })
}

// 获取社区列表
function getCommunities() {
  return callFunction('getCommunities', {})
}

// ========== 聊天相关 ==========

// 发送消息
function sendMessage(data) {
  return callFunction('sendMessage', data)
}

// 获取聊天消息列表
function getMessages(data) {
  return callFunction('getMessages', data)
}

// 获取聊天会话列表
function getChatList() {
  return callFunction('getChatList', {})
}

// 获取或创建聊天会话
function getChatSession(data) {
  return callFunction('getChatSession', data)
}

// 标记消息已读
function markRead(data) {
  return callFunction('markRead', data)
}

// 获取未读消息数
function getUnreadCount() {
  return callFunction('getUnreadCount', {})
}

// 删除聊天会话
function deleteChatSession(data) {
  return callFunction('deleteChatSession', data)
}

module.exports = {
  callFunction,
  login,
  publishHelp,
  publishIdle,
  getList,
  getDetail,
  completeHelp,
  completeTrade,
  updateProfile,
  deleteRecord,
  updateRecord,
  initDatabase,
  uploadFile,
  getUserInfo,
  getCommunities,
  sendMessage,
  getMessages,
  getChatList,
  getChatSession,
  markRead,
  getUnreadCount,
  deleteChatSession
}
