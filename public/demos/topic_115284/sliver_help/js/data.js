const Data = {
  appointments: [],

  healthRecords: [
    { date: '周一', systolic: 128, diastolic: 82, sugar: 5.6, heartRate: 72 },
    { date: '周二', systolic: 132, diastolic: 85, sugar: 5.8, heartRate: 70 },
    { date: '周三', systolic: 125, diastolic: 78, sugar: 6.1, heartRate: 75 },
    { date: '周四', systolic: 130, diastolic: 80, sugar: 5.4, heartRate: 68 },
    { date: '周五', systolic: 127, diastolic: 81, sugar: 5.9, heartRate: 74 },
    { date: '周六', systolic: 135, diastolic: 88, sugar: 6.2, heartRate: 71 }
  ],

  user: {
    name: '王奶奶',
    phone: '138****6789',
    age: 72,
    healthStreak: 15,
    lastHealthCheck: new Date().toLocaleDateString('zh-CN')
  },

  careReminders: [
    { id: 'weather', icon: '☀️', title: '天气提醒', content: '今天天气晴朗，温度28℃', type: 'info' },
    { id: 'water', icon: '💧', title: '喝水提醒', content: '已喝水 3/8 杯', type: 'normal' },
    { id: 'bp', icon: '❤️', title: '测量提醒', content: '今天还未测量血压', type: 'warning' },
    { id: 'streak', icon: '🔥', title: '健康打卡', content: '连续打卡 15 天', type: 'success' }
  ],

  init() {
    const saved = localStorage.getItem('silverHelp_appointments');
    if (saved) {
      try {
        this.appointments = JSON.parse(saved);
      } catch (e) {
        this.appointments = [];
      }
    } else {
      this.appointments = [
        {
          id: 'appt_001',
          serviceType: 'haircut',
          serviceName: '上门理发',
          userName: '王奶奶',
          userPhone: '138****6789',
          date: new Date().toLocaleDateString('zh-CN'),
          time: '下午 14:00-17:00',
          status: '已预约',
          contact: '李师傅',
          phone: '139****1234',
          createTime: new Date(Date.now() - 86400000).toLocaleString('zh-CN')
        },
        {
          id: 'appt_002',
          serviceType: 'medicine',
          serviceName: '买药送药',
          userName: '王奶奶',
          userPhone: '138****6789',
          date: new Date().toLocaleDateString('zh-CN'),
          time: '上午 9:00-12:00',
          status: '服务中',
          contact: '张阿姨',
          phone: '138****5678',
          createTime: new Date(Date.now() - 3600000).toLocaleString('zh-CN')
        },
        {
          id: 'appt_003',
          serviceType: 'repair',
          serviceName: '家电维修',
          userName: '王奶奶',
          userPhone: '138****6789',
          date: new Date(Date.now() - 172800000).toLocaleDateString('zh-CN'),
          time: '下午 14:00-17:00',
          status: '已完成',
          contact: '王师傅',
          phone: '137****9012',
          createTime: new Date(Date.now() - 172800000).toLocaleString('zh-CN')
        }
      ];
      this.saveAppointments();
    }
  },

  saveAppointments() {
    localStorage.setItem('silverHelp_appointments', JSON.stringify(this.appointments));
  },

  addAppointment(serviceType, serviceName, time, userName, userPhone) {
    const timeLabels = {
      morning: '上午 9:00-12:00',
      afternoon: '下午 14:00-17:00',
      evening: '晚上 18:00-20:00'
    };

    const contacts = {
      haircut: { name: '李师傅', phone: '139****1234' },
      medicine: { name: '张阿姨', phone: '138****5678' },
      repair: { name: '王师傅', phone: '137****9012' }
    };

    const newAppointment = {
      id: 'appt_' + Date.now(),
      serviceType,
      serviceName,
      userName: userName || '王奶奶',
      userPhone: userPhone || '138****6789',
      date: new Date().toLocaleDateString('zh-CN'),
      time: timeLabels[time] || time,
      status: '已预约',
      contact: contacts[serviceType]?.name || '工作人员',
      phone: contacts[serviceType]?.phone || '138****6789',
      createTime: new Date().toLocaleString('zh-CN')
    };

    this.appointments.unshift(newAppointment);
    this.saveAppointments();
    return newAppointment;
  },

  deleteAppointment(id) {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.appointments.splice(index, 1);
      this.saveAppointments();
      return true;
    }
    return false;
  },

  updateAppointmentStatus(id, status) {
    const appt = this.appointments.find(a => a.id === id);
    if (appt) {
      appt.status = status;
    }
  },

  getHealthScore(systolic, diastolic, sugar, heartRate) {
    let score = 100;

    if (systolic >= 140 || diastolic >= 90) {
      score -= 35;
    } else if (systolic >= 121 || diastolic >= 81) {
      score -= 15;
    } else if (systolic < 90 || diastolic < 60) {
      score -= 25;
    }

    if (sugar >= 7.0) {
      score -= 35;
    } else if (sugar >= 6.2) {
      score -= 15;
    } else if (sugar < 3.9) {
      score -= 25;
    }

    if (heartRate < 50 || heartRate > 120) {
      score -= 35;
    } else if (heartRate < 60 || heartRate > 100) {
      score -= 15;
    } else if (heartRate < 55 || heartRate > 110) {
      score -= 25;
    }

    return Math.max(0, Math.min(100, score));
  },

  getHealthStatus(score) {
    if (score >= 95) return { text: '健康状态良好', color: '#27AE60', bg: '#E8F8EF', message: '请继续保持。' };
    if (score >= 85) return { text: '整体健康', color: '#58D68D', bg: '#EBF8F1', message: '个别指标略有波动，建议继续观察。' };
    if (score >= 70) return { text: '存在部分异常', color: '#F39C12', bg: '#FFF8E5', message: '建议注意饮食、规律作息，并持续观察。' };
    if (score >= 50) return { text: '多项指标异常', color: '#E67E22', bg: '#FFF5EB', message: '建议尽快咨询医生或通知家人关注。' };
    return { text: '⚠️ 健康预警', color: '#E74C3C', bg: '#FFE5E5', message: '当前健康数据存在明显异常，请及时联系家人，并尽快前往医院检查。如出现胸闷、头晕、呼吸困难等情况，请立即拨打急救电话或使用首页 SOS 一键求助。' };
  },

  getHealthAdvice(systolic, diastolic, sugar, heartRate) {
    const issues = [];

    if (systolic >= 140 || diastolic >= 90) {
      issues.push('血压偏高');
    } else if (systolic >= 121) {
      issues.push('血压略高');
    } else if (systolic < 90 || diastolic < 60) {
      issues.push('血压偏低');
    }

    if (sugar >= 7.0) {
      issues.push('血糖明显异常');
    } else if (sugar >= 6.2) {
      issues.push('血糖偏高');
    } else if (sugar < 3.9) {
      issues.push('血糖偏低');
    }

    if (heartRate < 50 || heartRate > 120) {
      issues.push('心率严重异常');
    } else if (heartRate < 60 || heartRate > 100) {
      issues.push('心率波动');
    }

    if (issues.length === 0) {
      return '本周血压、血糖和心率均保持稳定，建议继续保持良好的生活习惯。';
    }

    if (issues.length === 1) {
      if (issues[0] === '血压偏高') {
        return '本周血压明显高于正常范围，建议减少高盐饮食，保持规律作息，并持续监测血压变化。';
      } else if (issues[0] === '血压略高') {
        return '本周血压略高于正常范围，建议注意休息，减少盐分摄入，继续观察。';
      } else if (issues[0] === '血压偏低') {
        return '本周血压偏低，建议适当增加营养摄入，避免突然站立，如出现头晕请及时休息。';
      } else if (issues[0] === '血糖明显异常') {
        return '本周血糖明显异常，建议合理控制饮食，减少高糖食物摄入，如持续异常建议立即咨询医生。';
      } else if (issues[0] === '血糖偏高') {
        return '本周血糖偏高，建议控制甜食摄入，适当运动，继续监测血糖变化。';
      } else if (issues[0] === '血糖偏低') {
        return '本周血糖偏低，建议随身携带糖果或饼干，按时进餐，避免空腹。';
      } else if (issues[0] === '心率严重异常') {
        return '本周心率存在严重异常，请注意休息，避免剧烈运动，建议尽快咨询医生进行检查。';
      } else if (issues[0] === '心率波动') {
        return '本周心率存在波动，请注意休息，避免情绪激动，如持续异常请及时就医。';
      }
    }

    if (issues.length === 2) {
      return `本周${issues.join('和')}，建议更加关注身体健康，调整生活习惯，必要时咨询医生。`;
    }

    return '本周多项健康指标存在异常，请尽快联系家人并咨询医生，进行全面检查。';
  },

  getWeather() {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) {
      return { icon: '☀️', temp: '28℃', desc: '阳光明媚' };
    } else if (hour >= 18 || hour < 6) {
      return { icon: '🌙', temp: '22℃', desc: '夜色宜人' };
    } else {
      return { icon: '🌤️', temp: '24℃', desc: '天气晴朗' };
    }
  },

  getWaterIntake() {
    return { current: 3, total: 8 };
  },

  incrementHealthStreak() {
    this.user.healthStreak++;
    this.user.lastHealthCheck = new Date().toLocaleDateString('zh-CN');
  }
};