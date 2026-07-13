const Voice = {
  listening: false,

  startListening() {
    if (this.listening) return;

    this.listening = true;
    const micBtn = document.getElementById('voice-mic');
    const statusText = document.getElementById('voice-status');

    micBtn.classList.add('listening');
    statusText.textContent = '正在聆听...';

    setTimeout(() => {
      this.stopListening();
    }, 3000);
  },

  stopListening() {
    this.listening = false;
    const micBtn = document.getElementById('voice-mic');
    const statusText = document.getElementById('voice-status');

    micBtn.classList.remove('listening');

    const commands = [
      { text: '我要买药', action: 'medicine' },
      { text: '我要找女儿', action: 'call-daughter' },
      { text: '我要预约理发', action: 'haircut' },
      { text: '我要记录血压', action: 'health' },
      { text: '我要报修家电', action: 'repair' },
      { text: '我要联系家人', action: 'call-daughter' },
      { text: '我不舒服', action: 'sos' },
      { text: '救命', action: 'sos' }
    ];

    const randomCmd = commands[Math.floor(Math.random() * commands.length)];

    statusText.textContent = `识别成功：${randomCmd.text}`;

    setTimeout(() => {
      statusText.textContent = '正在打开对应服务...';
    }, 1500);

    setTimeout(() => {
      this.executeCommand(randomCmd.action);
    }, 2500);
  },

  executeCommand(action) {
    const statusText = document.getElementById('voice-status');

    switch (action) {
      case 'health':
        statusText.textContent = '正在打开健康记录...';
        setTimeout(() => UI.navigateTo('page-health'), 800);
        break;
      case 'haircut':
        statusText.textContent = '正在打开理发预约...';
        setTimeout(() => Service.openBooking('haircut'), 800);
        break;
      case 'medicine':
        statusText.textContent = '正在打开买药服务...';
        setTimeout(() => Service.openBooking('medicine'), 800);
        break;
      case 'repair':
        statusText.textContent = '正在打开家电维修...';
        setTimeout(() => Service.openBooking('repair'), 800);
        break;
      case 'call-daughter':
        statusText.textContent = '正在拨打电话...';
        setTimeout(() => UI.makeCall('138****6789'), 800);
        break;
      case 'sos':
        statusText.textContent = '正在发起紧急求助...';
        setTimeout(() => SOS.startSOS(), 800);
        break;
      default:
        statusText.textContent = '未识别到指令，请重试';
        setTimeout(() => {
          statusText.textContent = '点击麦克风开始说话';
        }, 2000);
    }
  }
};