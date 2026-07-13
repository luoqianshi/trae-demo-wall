const App = {
  init() {
    Data.init();
    UI.initEventListeners();
    Utils.updateTime();
    Utils.setCareMessage();
    this.renderCareReminders();
    setInterval(Utils.updateTime.bind(Utils), 1000);
  },

  navigateTo(pageId) {
    UI.navigateTo(pageId);
  },

  navigateBack() {
    UI.navigateBack();
  },

  showToast(msg, duration) {
    UI.showToast(msg, duration);
  },

  showModal(icon, title, text, autoClose) {
    UI.showModal(icon, title, text, autoClose);
  },

  closeModal() {
    UI.closeModal();
  },

  makeCall(phone) {
    UI.makeCall(phone);
  },

  saveHealthData() {
    Health.saveHealthData();
  },

  shareHealth() {
    UI.showToast('健康报告已发送给女儿');
  },

  startSOS() {
    SOS.startSOS();
  },

  openBooking(serviceType) {
    Service.openBooking(serviceType);
  },

  submitBooking() {
    Service.submitBooking();
  },

  startListening() {
    Voice.startListening();
  },

  viewAppointments() {
    UI.navigateTo('page-appointments');
  },

  renderCareReminders() {
    const container = document.getElementById('careReminders');
    container.innerHTML = '';

    Data.careReminders.forEach(reminder => {
      const typeStyles = {
        info: { bg: '#E8F4FC', text: '#3498DB', border: '#3498DB' },
        normal: { bg: '#FFF8E5', text: '#F39C12', border: '#F39C12' },
        warning: { bg: '#FFE5E5', text: '#E74C3C', border: '#E74C3C' },
        success: { bg: '#E8F8EF', text: '#27AE60', border: '#27AE60' }
      };

      const style = typeStyles[reminder.type] || typeStyles.normal;

      const card = document.createElement('div');
      card.className = 'care-card';
      card.style.background = style.bg;
      card.style.borderColor = style.border;
      card.innerHTML = `
        <div class="care-icon">${reminder.icon}</div>
        <div class="care-content">
          <div class="care-title" style="color: ${style.text}">${reminder.title}</div>
          <div class="care-text">${reminder.content}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});