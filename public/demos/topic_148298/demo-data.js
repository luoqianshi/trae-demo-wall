/**
 * 模拟数据模块
 * 万物皆可卦 - 演示用运动健康数据
 */

// ==================== 工具函数 ====================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成近7天的日期
function getLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
      isToday: i === 0
    });
  }
  return days;
}

// ==================== Strava 骑行数据 ====================

const STRAVA_PROFILE = {
  name: "骑行爱好者",
  avatar: "🚴",
  platform: "Strava",
  totalRides: 128,
  totalDistance: 3560,
  totalTime: 168
};

function generateStravaDaily(dateOffset) {
  // dateOffset: 0=今天, 1=昨天, ...
  // 周末骑行更远
  const isWeekend = dateOffset <= 2 && (new Date().getDay() === 0 || new Date().getDay() === 6);
  const baseDistance = isWeekend ? 35 : 15;
  const distance = randomFloat(baseDistance, baseDistance + 20);
  const duration = Math.round(distance * randomFloat(2.5, 3.5)); // 2.5-3.5 min/km
  const avgSpeed = randomFloat(18, 28);
  const maxSpeed = randomFloat(avgSpeed + 5, avgSpeed + 15);
  const avgHr = randomInt(130, 155);
  const maxHr = randomInt(avgHr + 10, 185);
  const elevation = randomInt(50, 400);
  const calories = Math.round(distance * randomFloat(25, 35));
  const power = randomInt(120, 220);

  return {
    "骑行距离": parseFloat(distance.toFixed(1)),
    "平均速度": parseFloat(avgSpeed.toFixed(1)),
    "心率峰值": maxHr,
    "心率均值": avgHr,
    "最大速度": parseFloat(maxSpeed.toFixed(1)),
    "爬升海拔": elevation,
    "卡路里消耗": calories,
    "骑行时长": duration,
    "平均功率": power,
    // 用于展示但不参与卦象计算
    _detail: {
      route: randomChoice(['城市环线', '山地越野', '海滨公路', '公园绕圈', '爬坡训练']),
      weather: randomChoice(['晴朗', '多云', '微风', '阴天']),
      mood: randomChoice(['酣畅淋漓', '轻松愉快', '挑战自我', '享受风景'])
    }
  };
}

function generateStravaData() {
  const days = getLast7Days();
  const history = days.map((day, i) => ({
    ...day,
    data: generateStravaDaily(6 - i)
  }));

  return {
    profile: STRAVA_PROFILE,
    today: history[6].data,
    history: history,
    // 趋势数据（用于图表）
    trends: {
      labels: days.map(d => d.weekday),
      distance: history.map(h => h.data["骑行距离"]),
      speed: history.map(h => h.data["平均速度"]),
      hr: history.map(h => h.data["心率均值"]),
      calories: history.map(h => h.data["卡路里消耗"])
    }
  };
}

// ==================== 华为运动健康数据 ====================

const HUAWEI_PROFILE = {
  name: "健康达人",
  avatar: "💪",
  platform: "华为运动健康",
  totalSteps: 892000,
  totalDays: 365
};

function generateHuaweiDaily(dateOffset) {
  const isWeekend = dateOffset <= 2 && (new Date().getDay() === 0 || new Date().getDay() === 6);
  const baseSteps = isWeekend ? 6000 : 3000;
  const steps = randomInt(baseSteps, baseSteps + 8000);
  const activeMinutes = Math.round(steps / randomInt(100, 140));
  const avgHr = randomInt(68, 82);
  const maxHr = randomInt(avgHr + 20, 160);
  const sleepHours = randomFloat(5.5, 9);
  const sleepQuality = randomChoice(['优秀', '良好', '一般', '优秀', '良好']);
  const stress = randomInt(25, 75);
  const spo2 = randomInt(94, 99);
  const exerciseType = randomChoice([1, 2, 3, 4, 5]); // 1-5级强度
  const exerciseTypeNames = ['', '散步', '快走', '慢跑', '跑步', '高强度'];
  const weight = randomFloat(58, 75);

  return {
    "步数": steps,
    "心率均值": avgHr,
    "心率峰值": maxHr,
    "睡眠时长": parseFloat(sleepHours.toFixed(1)),
    "睡眠质量": sleepQuality,
    "压力指数": stress,
    "血氧饱和度": spo2,
    "运动类型强度": exerciseType,
    "运动分钟": activeMinutes,
    "体重": parseFloat(weight.toFixed(1)),
    // 用于展示
    _detail: {
      exerciseName: exerciseTypeNames[exerciseType],
      deepSleep: randomFloat(1.5, 2.5).toFixed(1),
      remSleep: randomFloat(1, 2).toFixed(1),
      standHours: randomInt(6, 12)
    }
  };
}

function generateHuaweiData() {
  const days = getLast7Days();
  const history = days.map((day, i) => ({
    ...day,
    data: generateHuaweiDaily(6 - i)
  }));

  return {
    profile: HUAWEI_PROFILE,
    today: history[6].data,
    history: history,
    trends: {
      labels: days.map(d => d.weekday),
      steps: history.map(h => h.data["步数"]),
      sleep: history.map(h => h.data["睡眠时长"]),
      stress: history.map(h => h.data["压力指数"]),
      hr: history.map(h => h.data["心率均值"])
    }
  };
}

// ==================== 苹果健康数据 ====================

const APPLE_PROFILE = {
  name: "Apple Watch用户",
  avatar: "⌚",
  platform: "苹果健康",
  streakDays: 23,
  totalRings: 156
};

function generateAppleDaily(dateOffset) {
  const isWeekend = dateOffset <= 2 && (new Date().getDay() === 0 || new Date().getDay() === 6);
  const baseEnergy = isWeekend ? 350 : 200;
  const activeEnergy = randomInt(baseEnergy, baseEnergy + 400);
  const exerciseMinutes = randomInt(15, 60);
  const standHours = randomInt(4, 12);
  const steps = randomInt(3000, 12000);
  const hrv = randomInt(30, 60);
  const restingHr = randomInt(55, 72);
  const walkingDistance = parseFloat((steps * 0.0007).toFixed(2));
  const flights = randomInt(2, 15);
  const sleepHours = randomFloat(5.5, 8.5);

  return {
    "活动能量": activeEnergy,
    "运动分钟": exerciseMinutes,
    "站立小时": standHours,
    "心率变异": hrv,
    "静息心率": restingHr,
    "步数": steps,
    "步行距离": walkingDistance,
    "爬楼层数": flights,
    "睡眠时长": parseFloat(sleepHours.toFixed(1)),
    // 用于展示
    _detail: {
      ringClosed: {
        move: activeEnergy >= 400,
        exercise: exerciseMinutes >= 30,
        stand: standHours >= 8
      },
      workoutType: randomChoice(['户外步行', '瑜伽', '游泳', '力量训练', '椭圆机', '舞蹈']),
      mindfulness: randomInt(5, 20)
    }
  };
}

function generateAppleData() {
  const days = getLast7Days();
  const history = days.map((day, i) => ({
    ...day,
    data: generateAppleDaily(6 - i)
  }));

  return {
    profile: APPLE_PROFILE,
    today: history[6].data,
    history: history,
    trends: {
      labels: days.map(d => d.weekday),
      energy: history.map(h => h.data["活动能量"]),
      exercise: history.map(h => h.data["运动分钟"]),
      stand: history.map(h => h.data["站立小时"]),
      steps: history.map(h => h.data["步数"])
    }
  };
}

// ==================== 数据生成器 ====================

const DataGenerator = {
  strava: generateStravaData,
  huawei: generateHuaweiData,
  apple: generateAppleData
};

function generateData(source) {
  const generator = DataGenerator[source] || generateStravaData;
  return generator();
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateData, getLast7Days };
}
