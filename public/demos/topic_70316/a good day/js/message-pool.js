// 留言存储与信件回放
const MessagePool = {
  // 保存留言
  saveMessage(text) {
    Storage.saveMessage(text.trim());
  },

  // 获取今日陌生人信件
  getTodayLetter() {
    return getStrangerLetter();
  }
};