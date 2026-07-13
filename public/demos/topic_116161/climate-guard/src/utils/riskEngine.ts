import type { 
  RiskProfile, RiskResult, WeatherData, RiskLevel, RiskMode,
  CaredPerson, EmergencySymptom, EmergencyAdvice, SafePoint
} from '../types';
import { cityWeathers, safePoints } from '../data/mockData';

// ==================== 风险等级映射 ====================
function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return '极高';
  if (score >= 60) return '高';
  if (score >= 40) return '中';
  return '低';
}

// ==================== 风险模式检测 ====================
function detectRiskMode(weather: WeatherData): RiskMode {
  const { temperature, humidity, windSpeed } = weather;
  
  if (temperature >= 35) return '高温';
  if (temperature <= -15) return '寒潮';
  if (temperature <= 5 && humidity >= 80) return '湿冷';
  if (temperature <= 0 && windSpeed >= 15) return '风寒';
  if (temperature >= 20 && (weather as any).dailyTempRange >= 10) return '昼夜温差';
  if (temperature <= -5) return '寒潮';
  
  return '正常';
}

// ==================== 核心评分算法 ====================
export function calculateRisk(weather: WeatherData, profile: RiskProfile): RiskResult {
  let score = 0;
  const reasons: string[] = [];
  const { temperature, humidity, windSpeed } = weather;
  const { identity, ageGroup, outdoorHours, chronicDisease, mainTimeSlot, isAlone, hasAC } = profile;
  
  // === 温度评分 ===
  if (temperature >= 40) {
    score += 35;
    reasons.push(`${weather.city}气温高达${temperature}°C`);
  } else if (temperature >= 35) {
    score += 25;
    reasons.push(`${weather.city}高温${temperature}°C`);
  } else if (temperature >= 30) {
    score += 15;
  } else if (temperature <= -25) {
    score += 35;
    reasons.push(`${weather.city}寒潮${temperature}°C`);
  } else if (temperature <= -15) {
    score += 25;
    reasons.push(`${weather.city}低温${temperature}°C`);
  } else if (temperature <= -5) {
    score += 15;
    reasons.push(`${weather.city}气温较低${temperature}°C`);
  } else if (temperature <= 5 && humidity >= 80) {
    score += 20;
    reasons.push(`湿冷天气，体感温度更低`);
  }
  
  // === 湿度评分 ===
  if (humidity >= 85) {
    score += 10;
    reasons.push('湿度极高，闷热难耐');
  } else if (humidity >= 70 && temperature >= 30) {
    score += 8;
    reasons.push('高湿加剧体感热度');
  } else if (humidity >= 80 && temperature <= 10) {
    score += 10;
    reasons.push('高湿加剧寒冷体感');
  }
  
  // === 风速评分 ===
  if (windSpeed >= 20) {
    score += 15;
    reasons.push(`大风${windSpeed}km/h，风寒效应明显`);
  } else if (windSpeed >= 15 && temperature <= 0) {
    score += 12;
    reasons.push('大风加剧低温风险');
  } else if (windSpeed >= 10 && temperature <= -10) {
    score += 8;
  }
  
  // === 身份加权 ===
  const outdoorWorkers = ['外卖骑手', '快递员', '环卫工', '建筑工'];
  if (outdoorWorkers.includes(identity)) {
    score += 15;
    reasons.push(`${identity}户外工作风险更高`);
  } else if (identity === '独居老人') {
    score += 12;
    reasons.push('独居老人应对能力较弱');
  } else if (identity === '慢病人群') {
    score += 10;
    reasons.push('慢病人群对温度更敏感');
  } else if (identity === '学生') {
    score += 3;
  }
  
  // === 年龄加权 ===
  if (ageGroup === '老人') {
    score += 10;
    reasons.push('老年人体温调节能力下降');
  } else if (ageGroup === '儿童') {
    score += 8;
    reasons.push('儿童体温调节能力未完善');
  }
  
  // === 户外时长 ===
  if (outdoorHours === '6小时以上') {
    score += 15;
    reasons.push('户外暴露时间过长');
  } else if (outdoorHours === '3-6小时') {
    score += 10;
    reasons.push('户外暴露时间较长');
  } else if (outdoorHours === '1-3小时') {
    score += 5;
  }
  
  // === 时段加权 ===
  if (mainTimeSlot === '中午' && temperature >= 30) {
    score += 10;
    reasons.push('中午时段高温加剧');
  } else if (mainTimeSlot === '下午' && temperature >= 30) {
    score += 8;
    reasons.push('下午时段持续高温');
  } else if (mainTimeSlot === '晚上' && temperature <= -10) {
    score += 8;
    reasons.push('夜间低温风险更高');
  }
  
  // === 慢病加权 ===
  if (chronicDisease === '心脑血管') {
    score += 12;
    reasons.push('心脑血管疾病对温度极端敏感');
  } else if (chronicDisease === '呼吸系统') {
    score += 10;
    reasons.push('呼吸系统疾病易受温度影响');
  } else if (chronicDisease === '糖尿病') {
    score += 8;
    reasons.push('糖尿病患者温度感知可能异常');
  } else if (chronicDisease === '其他') {
    score += 5;
  }
  
  // === 独居加权 ===
  if (isAlone) {
    score += 8;
    reasons.push('独居状态，应急能力受限');
  }
  
  // === 空调/供暖 ===
  if (!hasAC) {
    if (temperature >= 33) {
      score += 8;
      reasons.push('无空调，室内避暑困难');
    } else if (temperature <= 5) {
      score += 10;
      reasons.push('无供暖，室内保暖困难');
    }
  }
  
  // 封顶
  score = Math.min(100, score);
  
  const mode = detectRiskMode(weather);
  const level = getRiskLevel(score);
  
  return {
    score,
    level,
    mode,
    reasons,
    actions: generateActionPlan(level, mode, profile),
    dangerousTimeSlot: getDangerousTimeSlot(weather, mode),
  };
}

// ==================== 生成行动建议 ====================
function generateActionPlan(level: RiskLevel, mode: RiskMode, profile: RiskProfile): string[] {
  const actions: string[] = [];
  const { identity, hasAC } = profile;
  const isOutdoorWorker = ['外卖骑手', '快递员', '环卫工', '建筑工'].includes(identity);
  
  if (level === '极高') {
    actions.push('⚠️ 建议今日尽量减少或停止户外暴露');
  } else if (level === '高') {
    actions.push('建议缩短户外时间，避开危险时段');
  }
  
  if (mode === '高温') {
    if (isOutdoorWorker) {
      actions.push(`每${level === '极高' ? '30' : level === '高' ? '40' : '60'}分钟进入阴凉处休息`);
      actions.push('补充含电解质饮品，每小时至少500ml');
      actions.push('佩戴遮阳帽、冰袖，穿透气衣物');
    } else {
      actions.push('避免11:00-17:00长时间外出');
      actions.push('外出携带遮阳伞和饮用水');
    }
    if (!hasAC) {
      actions.push('室内使用风扇、湿毛巾降温，前往清凉驿站');
    }
    actions.push('关注头晕、恶心、大量出汗等中暑信号');
  }
  
  if (mode === '寒潮' || mode === '风寒') {
    if (isOutdoorWorker) {
      actions.push('穿戴防寒服、手套、帽子、防滑鞋');
      actions.push('每次户外不超过30分钟，定时回室内回暖');
    } else {
      actions.push('减少不必要外出，外出穿戴多层保暖');
    }
    actions.push('室内保持18°C以上，检查供暖设备');
    actions.push('关注手脚麻木、反应迟缓等失温信号');
  }
  
  if (mode === '湿冷') {
    actions.push('穿戴防潮保暖衣物，注意脚部保暖');
    actions.push('室内使用电暖器或空调制热');
    actions.push('老人减少外出，注意关节疼痛和呼吸道症状');
  }
  
  if (mode === '昼夜温差') {
    actions.push('采用洋葱式穿衣，方便增减');
    actions.push('早出晚归携带外套');
    actions.push('老人儿童注意早晚保暖');
  }
  
  if (profile.ageGroup === '老人' || profile.identity === '独居老人') {
    actions.push('建议家属电话确认安全状况');
  }
  if (profile.chronicDisease !== '无') {
    actions.push('按时服药，监测血压/血糖');
  }
  
  return actions;
}

function getDangerousTimeSlot(weather: WeatherData, mode: RiskMode): string {
  const { temperature } = weather;
  if (mode === '高温') {
    if (temperature >= 38) return '11:00 - 17:00';
    return '12:00 - 15:00';
  }
  if (mode === '寒潮') return '夜间至清晨 (20:00 - 08:00)';
  if (mode === '湿冷') return '夜间至清晨';
  if (mode === '昼夜温差') return '06:00 - 09:00, 18:00 后';
  return '无明显危险时段';
}

// ==================== 生成关怀消息 ====================
export function generateCareMessage(person: CaredPerson, weather: WeatherData): string {
  const { nickname, relation, ageGroup, healthTags, isAlone, hasAC } = person;
  const { city, temperature, humidity, windSpeed } = weather;
  
  let msg = `${nickname}(${relation})今天`;
  
  if (temperature >= 35) {
    msg += `处于高温风险中。${city}${temperature}°C`;
    if (humidity > 70) msg += `且湿度${humidity}%`;
    msg += '，';
    if (ageGroup === '老人') msg += '老年人体温调节弱，';
    if (ageGroup === '儿童') msg += '儿童容易中暑，';
    if (!hasAC) msg += '家中无空调需特别注意，';
    if (isAlone) msg += '独居更需关心，';
    msg += '建议提醒减少外出、多喝水、注意防暑。';
  } else if (temperature <= -10) {
    msg += `处于寒潮风险中。${city}${temperature}°C`;
    if (windSpeed > 15) msg += `大风${windSpeed}km/h`;
    msg += '，';
    if (!hasAC) msg += '家中无供暖需紧急确认，';
    if (isAlone) msg += '独居老人务必电话确认，';
    if (healthTags.length > 0) msg += `有${healthTags.join('、')}史需警惕，`;
    msg += '建议提醒保暖、减少外出、注意失温信号。';
  } else if (temperature <= 10 && humidity >= 80) {
    msg += `处于湿冷风险中。${city}${temperature}°C湿度${humidity}%，`;
    if (!hasAC) msg += '无集中供暖室内阴冷，';
    msg += '建议开启电暖器、穿戴防潮保暖衣物、减少外出。';
  } else {
    msg += `天气相对温和，${city}${temperature}°C，建议正常防护即可。`;
  }
  
  return msg;
}

// ==================== 应急建议 ====================
export function generateEmergencyAdvice(
  symptoms: EmergencySymptom[], 
  mode: 'heat' | 'cold'
): EmergencyAdvice {
  const severeSymptoms = symptoms.filter(s => s.severity === '重度');
  const moderateSymptoms = symptoms.filter(s => s.severity === '中度');
  const hasSevere = severeSymptoms.length > 0;
  const hasModerate = moderateSymptoms.length > 0;
  
  const advice: EmergencyAdvice = {
    riskStatement: '',
    immediateActions: [],
    warningSigns: [],
    contactFamily: false,
    contactManager: false,
    call120: false,
    nearbySafePoints: safePoints.slice(0, 3),
  };
  
  if (mode === 'heat') {
    if (hasSevere) {
      advice.riskStatement = '存在较高中暑风险，请立即采取以下措施。如症状持续或加重，务必拨打120。';
      advice.call120 = true;
      advice.contactFamily = true;
    } else if (hasModerate) {
      advice.riskStatement = '存在中暑风险，请立即停止活动并采取降温措施。';
      advice.contactFamily = true;
    } else {
      advice.riskStatement = '存在轻度热应激风险，请提前预防。';
    }
    
    advice.immediateActions = [
      '立即转移到阴凉通风处',
      '松开衣物，平躺休息',
      '用冷水擦拭颈部、腋下、腹股沟',
      '少量多次补充含盐饮品',
      '如意识模糊，侧卧防止呕吐窒息',
    ];
    advice.warningSigns = [
      '体温超过40°C',
      '意识模糊或昏迷',
      '抽搐',
      '无汗但皮肤干热',
    ];
    advice.contactManager = true;
  } else {
    if (hasSevere) {
      advice.riskStatement = '存在较高失温风险，请立即采取以下措施。如症状持续，务必拨打120。';
      advice.call120 = true;
      advice.contactFamily = true;
    } else if (hasModerate) {
      advice.riskStatement = '存在失温风险，请立即取暖并更换湿衣物。';
      advice.contactFamily = true;
    } else {
      advice.riskStatement = '存在轻度冷应激风险，请注意保暖。';
    }
    
    advice.immediateActions = [
      '立即转移到温暖室内或避风处',
      '更换湿冷衣物，穿上干燥保暖衣物',
      '用毛毯包裹，重点保暖躯干和头部',
      '饮用温热糖水或热饮（意识清醒时）',
      '避免饮酒、剧烈活动、直接烤火',
    ];
    advice.warningSigns = [
      '体温低于35°C',
      '意识不清或嗜睡',
      '呼吸变浅变慢',
      '脉搏微弱',
    ];
    advice.contactManager = false;
  }
  
  return advice;
}

// ==================== 生成班组排班建议 ====================
export function generateWorkScheduleAdvice(team: any, weather: WeatherData) {
  const { temperature, windSpeed } = weather;
  const isOutdoorWorkerTeam = true; // 简化
  
  let schedule = {
    highRiskHours: [] as string[],
    restFrequency: '',
    maxShiftLength: '',
    gearChecklist: [] as string[],
    specialNotes: '',
  };
  
  if (temperature >= 38) {
    schedule.highRiskHours = ['11:00-17:00'];
    schedule.restFrequency = '每30分钟休息10分钟';
    schedule.maxShiftLength = '6小时';
    schedule.gearChecklist = ['遮阳帽', '冰袖', '防暑药品', '1L以上水壶'];
    schedule.specialNotes = '高温红色预警，建议缩减户外班次，优先派早晚单';
  } else if (temperature >= 35) {
    schedule.highRiskHours = ['12:00-16:00'];
    schedule.restFrequency = '每40分钟休息10分钟';
    schedule.maxShiftLength = '8小时';
    schedule.gearChecklist = ['遮阳帽', '防晒霜', '防暑药品', '充足饮水'];
    schedule.specialNotes = '高温橙色预警，注意补水和轮班';
  } else if (temperature <= -20) {
    schedule.highRiskHours = ['全天'];
    schedule.restFrequency = '每30分钟回室内回暖';
    schedule.maxShiftLength = '4小时';
    schedule.gearChecklist = ['防寒服', '保暖手套', '防滑鞋', '暖宝宝'];
    schedule.specialNotes = '极寒天气，建议暂停非必要户外作业';
  } else if (temperature <= -10) {
    schedule.highRiskHours = ['夜间至清晨'];
    schedule.restFrequency = '每1小时休息15分钟';
    schedule.maxShiftLength = '6小时';
    schedule.gearChecklist = ['羽绒服', '保暖帽', '手套', '防滑鞋'];
    schedule.specialNotes = '寒潮天气，注意防风保暖';
  }
  
  return schedule;
}

// ==================== 获取城市天气 ====================
export function getCityWeather(city: string) {
  return cityWeathers.find(w => w.city === city) || cityWeathers[0];
}
