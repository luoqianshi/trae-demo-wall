const Service = {
  services: {
    haircut: { name: '上门理发', desc: '专业理发师上门服务', icon: '✂️' },
    medicine: { name: '买药送药', desc: '社区人员代购送药上门', icon: '💊' },
    repair: { name: '家电维修', desc: '专业师傅上门维修', icon: '🔧' }
  },

  currentService: null,

  openBooking(serviceType) {
    this.currentService = serviceType;
    const service = this.services[serviceType];
    document.getElementById('bookingTitle').textContent = '预约 ' + service.name;
    document.getElementById('bookingForm').style.display = 'block';
    document.getElementById('bookingSuccess').style.display = 'none';
    document.getElementById('booking-name').value = '王奶奶';
    document.getElementById('booking-phone').value = '138****6789';
    document.getElementById('booking-time').value = 'afternoon';
    UI.navigateTo('page-booking');
  },

  submitBooking() {
    const name = document.getElementById('booking-name').value;
    const phone = document.getElementById('booking-phone').value;
    const time = document.getElementById('booking-time').value;

    if (!name || !phone) {
      UI.showToast('请填写完整信息');
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    const cleanPhone = phone.replace(/\s|-|\*/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      UI.showToast('号码格式不正确，请重新确认');
      return;
    }

    const service = this.services[this.currentService];
    Data.addAppointment(this.currentService, service.name, time, name, phone);

    setTimeout(() => {
      document.getElementById('bookingForm').style.display = 'none';
      document.getElementById('bookingSuccess').style.display = 'block';
    }, 500);
  },

  confirmCancel(id) {
    const appt = Data.appointments.find(a => a.id === id);
    if (!appt) return;

    const cancelConfirm = document.createElement('div');
    cancelConfirm.id = 'cancelConfirm';
    cancelConfirm.className = 'modal-overlay show';
    cancelConfirm.innerHTML = `
      <div class="modal-box">
        <div class="modal-icon">❓</div>
        <div class="modal-title">确认取消预约</div>
        <div class="modal-text">是否要取消预约「${appt.serviceName}」？</div>
        <div class="modal-actions">
          <button class="modal-btn secondary" onclick="Service.cancel('${id}')">是</button>
          <button class="modal-btn" onclick="Service.closeCancelConfirm()">否</button>
        </div>
      </div>
    `;
    document.body.appendChild(cancelConfirm);
  },

  cancel(id) {
    Data.deleteAppointment(id);
    this.closeCancelConfirm();
    UI.showToast('取消预约成功');
    this.renderAppointments();
  },

  closeCancelConfirm() {
    const el = document.getElementById('cancelConfirm');
    if (el) el.remove();
  },

  renderAppointments() {
    const list = document.getElementById('appointmentList');
    list.innerHTML = '';

    if (Data.appointments.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无预约记录</div>
        </div>
      `;
      return;
    }

    Data.appointments.forEach(appt => {
      const statusColors = {
        '待确认': { bg: '#FFF8E5', color: '#F39C12', border: '#F39C12' },
        '已预约': { bg: '#E8F4FC', color: '#3498DB', border: '#3498DB' },
        '服务中': { bg: '#E8F8EF', color: '#27AE60', border: '#27AE60' },
        '已完成': { bg: '#F5F5F5', color: '#95A5A6', border: '#95A5A6' }
      };

      const colors = statusColors[appt.status] || statusColors['待确认'];

      const canCancel = appt.status === '待确认' || appt.status === '已预约';
      const cancelBtn = canCancel ? `
        <button class="cancel-btn" onclick="Service.confirmCancel('${appt.id}')">取消预约</button>
      ` : '';

      const item = document.createElement('div');
      item.className = 'appointment-card';
      item.innerHTML = `
        <div class="appointment-header">
          <div class="appointment-icon">${this.services[appt.serviceType]?.icon || '📋'}</div>
          <div class="appointment-info">
            <div class="appointment-name">${appt.serviceName}</div>
            <div class="appointment-time">📅 ${appt.date} · ⏰ ${appt.time}</div>
          </div>
          <span class="appointment-status" style="background: ${colors.bg}; color: ${colors.color}; border-color: ${colors.border}">${appt.status}</span>
        </div>
        <div class="appointment-contact">
          <div>👤 预约人：${appt.userName}</div>
          <div>📞 联系电话：${appt.userPhone}</div>
          <div>👷 服务人员：${appt.contact}</div>
        </div>
        <div class="appointment-footer">
          <span class="appointment-create">预约时间：${appt.createTime}</span>
          ${cancelBtn}
        </div>
      `;
      list.appendChild(item);
    });
  },

  getServiceName(type) {
    return this.services[type]?.name || '服务';
  }
};