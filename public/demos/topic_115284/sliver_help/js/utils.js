const Utils = {
  careMessages: [
    '😊 天气不错，适合出门散步',
    '☀️ 天气炎热，记得多喝水',
    '🌧️ 今天有雨，出门记得带伞',
    '❄️ 天气转凉，注意添衣保暖',
    '🌤️ 阳光正好，多晒晒太阳',
    '💤 中午记得休息一会儿'
  ],

  updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    document.querySelectorAll('.time').forEach(el => el.textContent = timeStr);
  },

  setCareMessage() {
    const hour = new Date().getHours();
    let message = this.careMessages[0];
    if (hour >= 11 && hour < 14) {
      message = this.careMessages[5];
    } else if (hour >= 14 && hour < 18) {
      message = this.careMessages[1];
    } else {
      message = this.careMessages[Math.floor(Math.random() * this.careMessages.length)];
    }
    document.getElementById('careMessage').textContent = message;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};