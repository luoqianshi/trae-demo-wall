/* ============================================================
 * 智管慢病 - 基层慢病管理信息系统 Demo
 * 纯前端实现，无需构建工具，浏览器直接打开即可运行
 * ============================================================ */

(function () {
  'use strict';

  /* ===== 字典映射 ===== */
  const diseaseTypeMap = {
    hypertension: '高血压',
    diabetes: '2型糖尿病',
    copd: '慢阻肺',
    chd: '冠心病',
    stroke: '脑卒中',
    ckd: '慢性肾病',
    osteoporosis: '骨质疏松症',
    ra: '类风湿关节炎',
  };

  const diseaseTypeColor = {
    hypertension: 'red',
    diabetes: 'orange',
    copd: 'blue',
    chd: 'volcano',
    stroke: 'purple',
    ckd: 'cyan',
    osteoporosis: 'green',
    ra: 'magenta',
  };

  const diseaseChartColors = {
    hypertension: '#ff4d4f',
    diabetes: '#fa8c16',
    copd: '#1677ff',
    chd: '#fa541c',
    stroke: '#722ed1',
    ckd: '#13c2c2',
    osteoporosis: '#52c41a',
    ra: '#eb2f96',
  };

  const followupMethodMap = {
    outpatient: '门诊',
    phone: '电话',
    doorstep: '上门',
    online: '线上',
  };

  const followupStatusMap = {
    pending: '待随访',
    completed: '已完成',
    overdue: '已逾期',
    cancelled: '已取消',
  };

  const followupStatusColor = {
    pending: 'blue',
    completed: 'green',
    overdue: 'red',
    cancelled: 'default',
  };

  const signingStatusMap = {
    unsigned: '未签约',
    pending_signing: '签约申请中',
    signed: '已签约',
    pending_transfer: '转签申请中',
  };

  const signingStatusColor = {
    unsigned: 'default',
    pending_signing: 'orange',
    signed: 'green',
    pending_transfer: 'blue',
  };

  const referralTypeMap = { upward: '上转', downward: '下转' };
  const referralStatusMap = {
    pending: '待接收',
    accepted: '已接收',
    returned: '已回转',
    cancelled: '已取消',
  };
  const referralStatusColor = {
    pending: 'orange',
    accepted: 'blue',
    returned: 'green',
    cancelled: 'default',
  };

  const interventionTypeMap = {
    diet: '饮食',
    exercise: '运动',
    medication: '用药',
    education: '教育',
  };
  const interventionTypeColor = {
    diet: 'green',
    exercise: 'blue',
    medication: 'orange',
    education: 'purple',
  };
  const interventionStatusMap = { active: '进行中', completed: '已完成', paused: '已暂停' };
  const interventionStatusColor = { active: 'blue', completed: 'green', paused: 'orange' };

  const approvalTypeMap = { signing: '签约申请', transfer: '转签申请' };
  const approvalStatusMap = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
  };
  const approvalStatusColor = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'default',
  };

  const manageLevelMap = {
    level1: '一级（常规）',
    level2: '二级（重点）',
    level3: '三级（强化）',
  };

  const genderMap = { male: '男', female: '女' };
  const roleMap = { doctor: '基层医生', director: '主任', admin: '机构管理员', patient: '患者' };

  /* ===== 确定性随机数生成器（Mulberry32） ===== */
  function createRng(seed) {
    let s = seed;
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rng = createRng(20260621);
  function randInt(min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }
  function randPick(arr) {
    return arr[Math.floor(rng() * arr.length)];
  }
  function shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /* ===== 日期工具 ===== */
  function today() {
    return new Date();
  }
  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function formatDateTime(d) {
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${formatDate(d)} ${h}:${min}:${s}`;
  }
  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }
  function subtractDays(d, n) {
    return addDays(d, -n);
  }
  function subtractMonths(d, n) {
    const r = new Date(d);
    r.setMonth(r.getMonth() - n);
    return r;
  }
  function formatMonth(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  /* ===== 系统用户 ===== */
  const systemUsers = [
    { id: 'u001', username: 'doctor', name: '张医生', role: 'doctor', org: '幸福社区卫生服务中心', status: 'active', phone: '13800000001', createdAt: '2025-01-15' },
    { id: 'u002', username: 'doctor2', name: '李医生', role: 'doctor', org: '幸福社区卫生服务中心', status: 'active', phone: '13800000002', createdAt: '2025-01-15' },
    { id: 'u003', username: 'doctor3', name: '赵医生', role: 'doctor', org: '幸福社区卫生服务中心', status: 'active', phone: '13800000003', createdAt: '2025-01-15' },
    { id: 'u004', username: 'doctor4', name: '周医生', role: 'doctor', org: '阳光乡镇卫生院', status: 'active', phone: '13800000004', createdAt: '2025-01-15' },
    { id: 'u005', username: 'director', name: '陈主任', role: 'director', org: '幸福社区卫生服务中心', status: 'active', phone: '13800000005', createdAt: '2025-01-10' },
    { id: 'u006', username: 'admin', name: '李管理员', role: 'admin', org: '幸福社区卫生服务中心', status: 'active', phone: '13800000006', createdAt: '2025-01-01' },
  ];

  /* ===== 生成患者数据 ===== */
  const surnames = '王李张刘陈杨黄赵周吴徐孙马朱胡郭林何高梁郑宋沈韩冯邓曹彭萧蔡谢邹贾魏薛叶余潘'.split('');
  const givenNameChars = '明华强军伟杰英娟艳芳丽霞红燕平辉斌飞龙虎志国文建淑桂金玉春海小永长振立培传晓健鑫婷宇鹏玲云兰凯琴波荣亮群卫敏静磊洋勇涛超秀刚臣良福生宝庆祥瑞德道达远高光正政宁安康仁义信智'.split('');

  function generateNames(count) {
    const names = new Set();
    while (names.size < count) {
      const surname = randPick(surnames);
      const nameLen = rng() > 0.4 ? 2 : 1;
      let given = '';
      for (let i = 0; i < nameLen; i++) given += randPick(givenNameChars);
      names.add(surname + given);
    }
    return Array.from(names);
  }

  const doctors = systemUsers.filter((u) => u.role === 'doctor' && u.status === 'active');

  const diseaseWeights = [
    { type: 'hypertension', weight: 25 },
    { type: 'diabetes', weight: 15 },
    { type: 'copd', weight: 8 },
    { type: 'chd', weight: 6 },
    { type: 'stroke', weight: 5 },
    { type: 'ckd', weight: 4 },
    { type: 'osteoporosis', weight: 3 },
    { type: 'ra', weight: 3 },
  ];

  function pickDisease(exclude) {
    exclude = exclude || [];
    const available = diseaseWeights.filter((d) => !exclude.includes(d.type));
    const totalWeight = available.reduce((s, d) => s + d.weight, 0);
    let r = rng() * totalWeight;
    for (const d of available) {
      r -= d.weight;
      if (r <= 0) return d.type;
    }
    return available[available.length - 1].type;
  }

  const signingStatusList = [
    ...Array(66).fill('signed'),
    ...Array(14).fill('unsigned'),
    ...Array(12).fill('pending_signing'),
    ...Array(8).fill('pending_transfer'),
  ];
  const shuffledSigningStatuses = shuffle(signingStatusList);

  const diseaseCountList = [...Array(50).fill(1), ...Array(36).fill(2), ...Array(14).fill(3)];
  const shuffledDiseaseCounts = shuffle(diseaseCountList);

  const manageLevels = ['level1', 'level2', 'level3'];
  const patientStatuses = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'frozen', 'transferred'];
  const bloodTypes = ['A', 'B', 'O', 'AB'];
  const exerciseFrequencies = ['每周1-2次', '每周3-4次', '每周5次以上', '偶尔运动', '不运动'];
  const dietHabits = ['清淡饮食', '荤素均衡', '偏咸', '偏甜', '偏油腻'];
  const communities = ['幸福社区', '阳光小区', '和平里', '健康家园', '安康小区', '和谐花园', '锦绣华庭', '翠湖天地'];
  const areaCodes = ['110101', '310101', '440101', '440301', '330101', '510101', '420101', '320101'];
  const phonePrefixes = ['133', '135', '137', '138', '139', '150', '151', '152', '158', '159', '170', '180', '182', '183', '185', '186', '188', '189', '191', '198'];

  function generateIdCard(birthDate) {
    const areaCode = randPick(areaCodes);
    const birthDateStr = birthDate.replace(/-/g, '');
    const sequence = String(randInt(1, 999)).padStart(3, '0');
    const checkDigit = String(randInt(0, 9));
    return areaCode + birthDateStr + sequence + checkDigit;
  }
  function generatePhone() {
    return randPick(phonePrefixes) + String(randInt(0, 99999999)).padStart(8, '0');
  }
  function generateAddress() {
    return `${randPick(communities)}${randInt(1, 30)}栋${randInt(1, 50)}号`;
  }

  function generateLastIndicators(disease) {
    switch (disease) {
      case 'copd': return { fev1Pct: randInt(35, 80) };
      case 'chd': return { chestPainFreq: randInt(0, 5) };
      case 'stroke': return { nihss: randInt(0, 10) };
      case 'ckd': return { egfr: randInt(15, 90) };
      case 'osteoporosis': return { tScore: -(randInt(10, 40) / 10) };
      case 'ra': return { das28: randInt(20, 60) / 10 };
      default: return {};
    }
  }

  const names = generateNames(100);
  const now = today();
  const patients = [];
  let doctorAssignIndex = 0;

  for (let i = 0; i < 100; i++) {
    const id = `p${String(i + 1).padStart(3, '0')}`;
    const name = names[i];
    const gender = rng() > 0.5 ? 'male' : 'female';
    const age = randInt(35, 85);
    const birthYear = now.getFullYear() - age;
    const birthMonth = randInt(1, 12);
    const birthDay = randInt(1, 28);
    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    const diseaseCount = shuffledDiseaseCounts[i];
    const diseaseTypes = [];
    for (let j = 0; j < diseaseCount; j++) {
      diseaseTypes.push(pickDisease(diseaseTypes));
    }

    const manageLevel = randPick(manageLevels);
    const status = randPick(patientStatuses);
    const signingStatus = shuffledSigningStatuses[i];

    let signedDoctorId, signedDoctor, signedDate;
    if (signingStatus === 'signed' || signingStatus === 'pending_transfer') {
      const doctor = doctors[doctorAssignIndex % doctors.length];
      doctorAssignIndex++;
      signedDoctorId = doctor.id;
      signedDoctor = doctor.name;
      signedDate = formatDate(subtractDays(now, randInt(30, 730)));
    }

    const lastFollowupDate = formatDate(subtractDays(now, randInt(1, 90)));
    const height = randInt(150, 180);
    const weight = randInt(45, 90);
    const bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
    const bloodType = randPick(bloodTypes);
    const familyHistory = rng() > 0.6 ? randPick(['高血压家族史', '糖尿病家族史', '心脑血管疾病家族史']) : '无';
    const allergyHistory = rng() > 0.7 ? randPick(['青霉素过敏', '磺胺类过敏', '海鲜过敏', '花粉过敏']) : '无';
    const smoking = rng() > 0.6;
    const drinking = rng() > 0.7;
    const exerciseFrequency = randPick(exerciseFrequencies);
    const dietHabit = randPick(dietHabits);

    let lastSystolic, lastDiastolic, lastFastingGlucose, lastHba1c, lastIndicators;
    if (diseaseTypes.includes('hypertension')) {
      lastSystolic = randInt(110, 180);
      lastDiastolic = randInt(70, 110);
    }
    if (diseaseTypes.includes('diabetes')) {
      lastFastingGlucose = randInt(40, 150) / 10;
      lastHba1c = randInt(50, 100) / 10;
    }
    const otherDiseases = diseaseTypes.filter((d) => d !== 'hypertension' && d !== 'diabetes');
    if (otherDiseases.length > 0) {
      lastIndicators = {};
      for (const disease of otherDiseases) {
        Object.assign(lastIndicators, generateLastIndicators(disease));
      }
    }

    patients.push({
      id, name, gender, age, birthDate, idCard: generateIdCard(birthDate),
      phone: generatePhone(), address: generateAddress(), diseaseTypes, manageLevel,
      status, signedDoctorId, signedDoctor, signedDate, signingStatus, lastFollowupDate,
      height, weight, bmi, bloodType, familyHistory, allergyHistory, smoking, drinking,
      exerciseFrequency, dietHabit, lastSystolic, lastDiastolic, lastFastingGlucose,
      lastHba1c, lastIndicators, createdAt: formatDate(subtractDays(now, randInt(30, 730))),
    });
  }

  /* ===== 生成随访记录 ===== */
  const followups = [];
  let followupIdx = 0;
  const followupMethods = ['outpatient', 'phone', 'doorstep', 'online'];
  const signedPatients = patients.filter((p) => p.signingStatus === 'signed' || p.signingStatus === 'pending_transfer');

  for (const patient of signedPatients) {
    const count = randInt(2, 6);
    for (let j = 0; j < count; j++) {
      followupIdx++;
      const diseaseType = randPick(patient.diseaseTypes);
      const planDate = formatDate(addDays(now, randInt(-60, 30)));
      let status;
      const planD = new Date(planDate);
      if (planD < subtractDays(now, 1)) {
        status = rng() > 0.15 ? 'completed' : 'overdue';
      } else {
        status = rng() > 0.3 ? 'pending' : 'completed';
      }
      const actualDate = status === 'completed' ? formatDate(subtractDays(new Date(planDate), randInt(0, 2))) : undefined;
      const doctor = patient.signedDoctor;

      const f = {
        id: `f${String(followupIdx).padStart(3, '0')}`,
        patientId: patient.id,
        patientName: patient.name,
        diseaseType,
        method: randPick(followupMethods),
        planDate,
        actualDate,
        status,
        doctor,
      };

      if (status === 'completed') {
        if (diseaseType === 'hypertension') {
          f.systolic = randInt(110, 170);
          f.diastolic = randInt(70, 105);
          f.heartRate = randInt(60, 100);
          f.assessment = f.systolic < 140 && f.diastolic < 90 ? 'controlled' : 'uncontrolled';
        } else if (diseaseType === 'diabetes') {
          f.fastingGlucose = randInt(40, 120) / 10;
          f.hba1c = randInt(50, 90) / 10;
          f.assessment = f.fastingGlucose < 7 ? 'controlled' : 'uncontrolled';
        } else {
          f.assessment = rng() > 0.3 ? 'controlled' : 'uncontrolled';
        }
        f.medicationAdherence = randPick(['good', 'fair', 'poor']);
        f.dietControl = randPick(['good', 'fair', 'poor']);
        f.nextPlanDate = formatDate(addDays(new Date(planDate), randInt(30, 90)));
      }
      followups.push(f);
    }
  }

  /* ===== 生成转诊记录 ===== */
  const referrals = [];
  const hospitals = ['市中心人民医院', '市第一人民医院', '省人民医院', '市中医院'];
  const departments = ['心内科', '内分泌科', '呼吸内科', '神经内科', '肾内科'];

  for (let i = 0; i < 25; i++) {
    const patient = randPick(signedPatients);
    const type = rng() > 0.4 ? 'upward' : 'downward';
    const applyDate = formatDate(subtractDays(now, randInt(1, 180)));
    let status;
    if (type === 'upward') {
      status = randPick(['pending', 'accepted', 'accepted', 'returned']);
    } else {
      status = randPick(['accepted', 'returned', 'returned']);
    }
    referrals.push({
      id: `r${String(i + 1).padStart(3, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      diseaseType: randPick(patient.diseaseTypes),
      type,
      targetHospital: randPick(hospitals),
      targetDepartment: randPick(departments),
      reason: randPick(['病情控制不佳，需上级医院进一步诊治', '需要专科检查', '患者要求转诊', '药物不良反应', '回转社区继续管理']),
      conditionSummary: '患者近期指标波动较大，建议上级医院进一步评估。',
      status,
      applyDate,
      acceptedDate: status !== 'pending' ? formatDate(addDays(new Date(applyDate), randInt(1, 5))) : undefined,
      returnedDate: status === 'returned' ? formatDate(addDays(new Date(applyDate), randInt(10, 30))) : undefined,
      feedback: status === 'returned' || status === 'accepted' ? '已制定治疗方案，建议回社区随访管理。' : undefined,
      doctor: patient.signedDoctor,
    });
  }

  /* ===== 生成健康干预方案 ===== */
  const interventions = [];
  const interventionTemplates = {
    diet: [
      { title: '低盐低脂饮食方案', content: '每日食盐摄入量控制在5g以内，减少动物脂肪摄入，增加蔬菜水果比例。', target: '食盐<5g/日', period: '3个月' },
      { title: '糖尿病饮食管理', content: '控制总热量摄入，合理分配三餐比例，避免高糖食物。', target: '空腹血糖<7.0mmol/L', period: '6个月' },
    ],
    exercise: [
      { title: '有氧运动计划', content: '每周5次中等强度有氧运动，每次30分钟，如快走、慢跑。', target: '每周运动≥150分钟', period: '3个月' },
      { title: '关节功能锻炼', content: '针对类风湿关节炎患者，进行关节活动度训练。', target: '关节活动度改善', period: '2个月' },
    ],
    medication: [
      { title: '降压药物规范服用', content: '遵医嘱按时服用降压药物，不擅自停药或调整剂量。', target: '血压<140/90mmHg', period: '长期' },
      { title: '降糖药物管理', content: '按时注射胰岛素/口服降糖药，定期监测血糖。', target: '糖化血红蛋白<7%', period: '3个月' },
    ],
    education: [
      { title: '慢病健康知识宣教', content: '学习慢病自我管理知识，掌握自我监测技能。', target: '知识掌握率≥80%', period: '1个月' },
      { title: '并发症预防教育', content: '了解慢病并发症的早期症状，及时就医。', target: '知晓率≥90%', period: '2个月' },
    ],
  };

  for (let i = 0; i < 30; i++) {
    const patient = randPick(signedPatients);
    const type = randPick(['diet', 'exercise', 'medication', 'education']);
    const template = randPick(interventionTemplates[type]);
    const createdAt = formatDate(subtractDays(now, randInt(1, 180)));
    interventions.push({
      id: `i${String(i + 1).padStart(3, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      diseaseType: randPick(patient.diseaseTypes),
      type,
      title: template.title,
      content: template.content,
      target: template.target,
      period: template.period,
      status: randPick(['active', 'active', 'completed', 'paused']),
      doctor: patient.signedDoctor,
      createdAt,
      updatedAt: createdAt,
    });
  }

  /* ===== 生成审批申请 ===== */
  const approvals = [];
  for (let i = 0; i < 20; i++) {
    const patient = randPick(patients.filter((p) => p.signingStatus === 'pending_signing' || p.signingStatus === 'pending_transfer'));
    const type = patient.signingStatus === 'pending_transfer' ? 'transfer' : 'signing';
    const fromDoctor = randPick(doctors);
    const requestDate = formatDate(subtractDays(now, randInt(1, 30)));
    let status;
    if (type === 'signing') {
      status = randPick(['pending', 'pending', 'approved', 'rejected']);
    } else {
      status = randPick(['pending', 'pending', 'approved', 'rejected']);
    }
    approvals.push({
      id: `a${String(i + 1).padStart(3, '0')}`,
      type,
      patientId: patient.id,
      patientName: patient.name,
      fromDoctorId: fromDoctor.id,
      fromDoctorName: fromDoctor.name,
      toDoctorId: type === 'transfer' ? randPick(doctors).id : undefined,
      toDoctorName: type === 'transfer' ? randPick(doctors).name : undefined,
      initiator: 'doctor',
      initiatorId: fromDoctor.id,
      initiatorName: fromDoctor.name,
      status,
      reason: type === 'signing' ? '患者申请签约家庭医生' : '医生工作调动，申请转签',
      requestDate,
      approverType: type === 'signing' ? 'patient' : 'director',
      approverName: status !== 'pending' ? (type === 'signing' ? patient.name : '陈主任') : undefined,
      approveDate: status !== 'pending' ? formatDate(addDays(new Date(requestDate), randInt(1, 5))) : undefined,
      approveRemark: status === 'approved' ? '同意' : status === 'rejected' ? '不符合条件' : undefined,
      orgId: 'org001',
      orgName: '幸福社区卫生服务中心',
    });
  }

  /* ===== 生成操作日志 ===== */
  const logs = [];
  const logModules = ['patient', 'followup', 'referral', 'intervention', 'system', 'approval'];
  const logActions = ['create', 'update', 'delete', 'approve', 'reject', 'login', 'execute'];
  const logUsers = [...systemUsers, { id: 'p001', name: '王患者', role: 'patient' }];

  for (let i = 0; i < 60; i++) {
    const user = randPick(logUsers);
    const module = randPick(logModules);
    const action = randPick(logActions);
    const ts = formatDateTime(subtractDays(now, randInt(0, 30)));
    const targetNames = {
      patient: () => randPick(patients).name,
      followup: () => randPick(followups).patientName + '的随访',
      referral: () => randPick(referrals).patientName + '的转诊',
      intervention: () => randPick(interventions).title,
      system: () => randPick(['用户管理', '机构管理', '字典管理']),
      approval: () => randPick(approvals).patientName + '的审批',
    };
    logs.push({
      id: `l${String(i + 1).padStart(3, '0')}`,
      timestamp: ts,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      module,
      action,
      targetType: module,
      targetId: randPick(patients).id,
      targetName: targetNames[module](),
      detail: `${user.name}(${roleMap[user.role]}) ${action}了 ${targetNames[module]()}`,
    });
  }
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  /* ===== 生成统计数据 ===== */
  const monthlyStatistics = [];
  for (let i = 11; i >= 0; i--) {
    const month = formatMonth(subtractMonths(now, i));
    const monthIndex = 11 - i;
    const totalPatients = 180 + monthIndex * 4 + randInt(-2, 2);
    const plannedFollowups = randInt(30, 50);
    const completionRate = Math.min(90, 70 + monthIndex * 1.5 + randInt(-2, 2));
    monthlyStatistics.push({
      month,
      totalPatients,
      newPatients: randInt(5, 15),
      plannedFollowups,
      completedFollowups: Math.round((plannedFollowups * completionRate) / 100),
      completionRate: Math.round(completionRate),
      bpControlRate: Math.round(Math.min(85, 65 + monthIndex * 1.5 + randInt(-2, 2))),
      glucoseControlRate: Math.round(Math.min(80, 60 + monthIndex * 1.5 + randInt(-2, 2))),
      upwardReferrals: randInt(2, 5),
      downwardReferrals: randInt(1, 3),
    });
  }

  function getAgeGroup(age) {
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    if (age <= 64) return '55-64';
    if (age <= 74) return '65-74';
    return '75+';
  }
  const ageGroups = ['35-44', '45-54', '55-64', '65-74', '75+'];
  const allDiseases = ['hypertension', 'diabetes', 'copd', 'chd', 'stroke', 'ckd', 'osteoporosis', 'ra'];
  const ageDistribution = ageGroups.map((group) => {
    const counts = {};
    for (const d of allDiseases) counts[d] = 0;
    for (const patient of patients) {
      if (getAgeGroup(patient.age) === group) {
        for (const disease of patient.diseaseTypes) counts[disease]++;
      }
    }
    return { ageGroup: group, counts };
  });

  const diseaseDistribution = allDiseases.map((diseaseType) => ({
    diseaseType,
    count: patients.filter((p) => p.diseaseTypes.includes(diseaseType)).length,
  }));

  /* ===== 当前登录状态 ===== */
  let currentUser = null;
  let currentRoute = '';

  /* ===== 路由配置 ===== */
  const menuConfig = {
    doctor: [
      { key: '/dashboard', icon: '📊', label: '工作台' },
      { key: '/patient', icon: '👤', label: '患者建档' },
      { key: '/followup', icon: '📅', label: '智能随访' },
      { key: '/intervention', icon: '❤', label: '健康干预' },
      { key: '/referral', icon: '🔄', label: '双向转诊' },
      { key: '/approval', icon: '✓', label: '审批管理' },
      { key: '/statistics', icon: '📈', label: '统计报表' },
    ],
    director: [
      { key: '/dashboard', icon: '📊', label: '工作台' },
      { key: '/patient', icon: '👤', label: '患者建档' },
      { key: '/followup', icon: '📅', label: '智能随访' },
      { key: '/intervention', icon: '❤', label: '健康干预' },
      { key: '/referral', icon: '🔄', label: '双向转诊' },
      { key: '/approval', icon: '✓', label: '审批管理' },
      { key: '/log', icon: '📋', label: '操作日志' },
      { key: '/statistics', icon: '📈', label: '统计报表' },
    ],
    admin: [
      { key: '/statistics', icon: '📈', label: '统计报表' },
      { key: '/approval', icon: '✓', label: '审批管理' },
      { key: '/log', icon: '📋', label: '操作日志' },
      { key: '/system/user', icon: '👥', label: '用户管理' },
      { key: '/system/org', icon: '🏥', label: '机构管理' },
      { key: '/system/dict', icon: '📖', label: '字典管理' },
    ],
    patient: [
      { key: '/portal/home', icon: '🏠', label: '我的首页' },
      { key: '/portal/profile', icon: '🪪', label: '我的档案' },
      { key: '/portal/followup', icon: '📋', label: '随访记录' },
      { key: '/portal/intervention', icon: '❤', label: '健康干预' },
    ],
  };

  const breadcrumbMap = {
    '/dashboard': ['工作台'],
    '/patient': ['患者建档'],
    '/followup': ['智能随访'],
    '/intervention': ['健康干预'],
    '/referral': ['双向转诊'],
    '/approval': ['审批管理'],
    '/log': ['操作日志'],
    '/statistics': ['统计报表'],
    '/system/user': ['系统管理', '用户管理'],
    '/system/org': ['系统管理', '机构管理'],
    '/system/dict': ['系统管理', '字典管理'],
    '/portal/home': ['我的首页'],
    '/portal/profile': ['我的档案'],
    '/portal/followup': ['随访记录'],
    '/portal/intervention': ['健康干预'],
  };

  function getHomePath(role) {
    return role === 'admin' ? '/statistics' : role === 'patient' ? '/portal/home' : '/dashboard';
  }

  /* ===== 工具函数 ===== */
  function $(sel) { return document.querySelector(sel); }
  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function tag(text, color) {
    return `<span class="tag tag-${color || 'default'}">${text}</span>`;
  }
  function diseaseTags(diseaseTypes) {
    return diseaseTypes.map((d) => tag(diseaseTypeMap[d], diseaseTypeColor[d])).join('');
  }
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function toast(msg, type) {
    type = type || 'info';
    const t = el('div', `toast toast-${type}`, msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  /* ===== 登录逻辑 ===== */
  const roleCredentials = {
    doctor: { username: 'doctor', name: '张医生', id: 'u001', org: '幸福社区卫生服务中心' },
    director: { username: 'director', name: '陈主任', id: 'u005', org: '幸福社区卫生服务中心' },
    admin: { username: 'admin', name: '李管理员', id: 'u006', org: '幸福社区卫生服务中心' },
    patient: { username: 'patient', name: '王患者', id: 'p001', org: '' },
  };

  let selectedRole = 'doctor';

  document.querySelectorAll('.role-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.role-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.dataset.role;
      $('#login-username').value = roleCredentials[selectedRole].username;
    });
  });
  // 默认选中医生
  $('.role-card[data-role="doctor"]').classList.add('active');
  $('#login-username').value = 'doctor';

  $('#login-btn').addEventListener('click', () => {
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    if (!username) { toast('请输入用户名', 'warning'); return; }
    if (!password) { toast('请输入密码', 'warning'); return; }
    const cred = roleCredentials[selectedRole];
    if (username !== cred.username) {
      toast('用户名与所选角色不匹配，请点击上方角色卡片', 'warning');
      return;
    }
    currentUser = {
      id: cred.id,
      name: cred.name,
      role: selectedRole,
      org: cred.org,
    };
    enterApp();
  });

  $('#login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#login-btn').click();
  });

  function enterApp() {
    $('#login-page').style.display = 'none';
    $('#main-app').style.display = 'flex';
    renderSidebar();
    renderHeader();
    navigate(getHomePath(currentUser.role));
    toast(`欢迎回来，${currentUser.name}！`, 'success');
  }

  function logout() {
    currentUser = null;
    currentRoute = '';
    $('#main-app').style.display = 'none';
    $('#login-page').style.display = 'flex';
    $('#login-password').value = '123456';
  }

  $('#logout-btn').addEventListener('click', logout);

  /* ===== 侧边栏渲染 ===== */
  function renderSidebar() {
    const menu = menuConfig[currentUser.role] || [];
    const menuEl = $('#sidebar-menu');
    menuEl.innerHTML = '';
    for (const item of menu) {
      const btn = el('button', 'menu-item');
      btn.innerHTML = `<span class="menu-icon">${item.icon}</span><span>${item.label}</span>`;
      btn.dataset.route = item.key;
      btn.addEventListener('click', () => navigate(item.key));
      menuEl.appendChild(btn);
    }
  }

  /* ===== 顶部渲染 ===== */
  function renderHeader() {
    // 用户信息
    $('#user-avatar').textContent = currentUser.name.charAt(0);
    $('#user-name').textContent = `${currentUser.name}（${roleMap[currentUser.role]}）`;

    // 角色切换
    const switcher = $('#role-switcher');
    switcher.innerHTML = '';
    const roles = ['doctor', 'director', 'admin', 'patient'];
    for (const role of roles) {
      const btn = el('button', `role-switch-btn ${role === currentUser.role ? 'active' : ''}`, roleMap[role]);
      btn.addEventListener('click', () => {
        if (role === currentUser.role) return;
        const cred = roleCredentials[role];
        currentUser = { id: cred.id, name: cred.name, role, org: cred.org };
        renderSidebar();
        renderHeader();
        navigate(getHomePath(role));
        toast(`已切换为${roleMap[role]}角色`, 'info');
      });
      switcher.appendChild(btn);
    }
  }

  /* ===== 路由导航 ===== */
  function navigate(route) {
    currentRoute = route;
    // 更新菜单激活状态
    document.querySelectorAll('.menu-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.route === route);
    });
    // 更新面包屑
    const crumbs = breadcrumbMap[route] || [route];
    $('#breadcrumb').innerHTML = crumbs
      .map((c, i) => `<span>${i > 0 ? '/ ' : ''}${c}</span>`)
      .join('');
    // 渲染页面
    renderPage(route);
  }

  function renderPage(route) {
    const content = $('#page-content');
    content.innerHTML = '';
    // 销毁旧图表
    if (window._activeCharts) {
      window._activeCharts.forEach((c) => c.destroy());
    }
    window._activeCharts = [];

    const patientId = currentUser.role === 'patient' ? currentUser.id : null;

    switch (route) {
      case '/dashboard': renderDashboard(content); break;
      case '/patient': renderPatientList(content); break;
      case '/followup': renderFollowupList(content); break;
      case '/intervention': renderInterventionList(content); break;
      case '/referral': renderReferralList(content); break;
      case '/approval': renderApprovalList(content); break;
      case '/log': renderLogList(content); break;
      case '/statistics': renderStatistics(content); break;
      case '/system/user': renderSystemUser(content); break;
      case '/system/org': renderSystemOrg(content); break;
      case '/system/dict': renderSystemDict(content); break;
      case '/portal/home': renderPortalHome(content); break;
      case '/portal/profile': renderPortalProfile(content); break;
      case '/portal/followup': renderPortalFollowup(content); break;
      case '/portal/intervention': renderPortalIntervention(content); break;
      default:
        content.innerHTML = '<div class="empty"><div class="empty-icon">📭</div>页面建设中...</div>';
    }
  }

  /* ===== 页面：工作台 ===== */
  function renderDashboard(container) {
    const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'director';
    // 医生只看自己签约的患者
    const myPatients = isDoctor
      ? patients.filter((p) => p.signedDoctor === currentUser.name)
      : patients;
    const pendingFollowups = followups.filter((f) => f.status === 'pending');
    const myPendingFollowups = isDoctor
      ? pendingFollowups.filter((f) => f.doctor === currentUser.name)
      : pendingFollowups;
    const pendingReferrals = referrals.filter((r) => r.status === 'pending');
    const currentMonth = formatMonth(now);
    const newThisMonth = patients.filter((p) => formatMonth(new Date(p.createdAt)) === currentMonth).length;

    container.innerHTML = `
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:#1677ff">👥</div>
          <div class="stat-info">
            <div class="stat-label">${isDoctor ? '我管理的患者' : '管理患者总数'}</div>
            <div class="stat-value">${myPatients.length}<span class="stat-suffix">人</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#52c41a">➕</div>
          <div class="stat-info">
            <div class="stat-label">本月新增患者</div>
            <div class="stat-value">${newThisMonth}<span class="stat-suffix">人</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#faad14">⏰</div>
          <div class="stat-info">
            <div class="stat-label">待随访人数</div>
            <div class="stat-value">${myPendingFollowups.length}<span class="stat-suffix">人</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#ff4d4f">🔄</div>
          <div class="stat-info">
            <div class="stat-label">待转诊人数</div>
            <div class="stat-value">${pendingReferrals.length}<span class="stat-suffix">人</span></div>
          </div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-container">
          <div class="chart-title">近6个月随访完成率</div>
          <div class="chart-wrapper"><canvas id="chart-completion"></canvas></div>
        </div>
        <div class="chart-container">
          <div class="chart-title">慢病类型分布</div>
          <div class="chart-wrapper"><canvas id="chart-disease"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">今日待办随访</span>
          <button class="btn-link" onclick="window._app.navigate('/followup')">查看全部</button>
        </div>
        <div class="card-body" style="padding:0;">
          ${renderFollowupTable(myPendingFollowups.slice(0, 8))}
        </div>
      </div>
    `;

    // 渲染图表
    const recent6 = monthlyStatistics.slice(-6);
    const completionChart = new Chart($('#chart-completion'), {
      type: 'line',
      data: {
        labels: recent6.map((s) => s.month),
        datasets: [{
          label: '完成率',
          data: recent6.map((s) => s.completionRate),
          borderColor: '#1677ff',
          backgroundColor: 'rgba(22,119,255,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#1677ff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { callbacks: { label: (c) => `完成率: ${c.raw}%` } },
        },
        scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } },
      },
    });

    const diseaseChart = new Chart($('#chart-disease'), {
      type: 'doughnut',
      data: {
        labels: diseaseDistribution.map((d) => diseaseTypeMap[d.diseaseType]),
        datasets: [{
          data: diseaseDistribution.map((d) => d.count),
          backgroundColor: allDiseases.map((d) => diseaseChartColors[d]),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      },
    });
    window._activeCharts.push(completionChart, diseaseChart);
  }

  /* ===== 患者列表 ===== */
  let patientPage = 1;
  const pageSize = 10;

  function renderPatientList(container) {
    const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'director';
    let data = isDoctor ? patients.filter((p) => p.signedDoctor === currentUser.name) : patients;

    container.innerHTML = `
      <div class="page-title">患者建档</div>
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <input class="input" id="patient-search" placeholder="搜索姓名/手机号" style="width:200px;" />
            <select class="select" id="filter-disease">
              <option value="">全部病种</option>
              ${allDiseases.map((d) => `<option value="${d}">${diseaseTypeMap[d]}</option>`).join('')}
            </select>
            <select class="select" id="filter-signing">
              <option value="">全部签约状态</option>
              ${Object.entries(signingStatusMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
          </div>
          <div class="toolbar-right">
            <button class="btn btn-primary" onclick="window._app.toast('Demo版本暂不支持新增患者','info')">+ 新建患者</button>
          </div>
        </div>
        <div id="patient-table-body"></div>
        <div class="pagination" id="patient-pagination"></div>
      </div>
    `;

    function refresh() {
      const keyword = $('#patient-search').value.trim().toLowerCase();
      const disease = $('#filter-disease').value;
      const signing = $('#filter-signing').value;
      let filtered = data;
      if (keyword) filtered = filtered.filter((p) => p.name.toLowerCase().includes(keyword) || p.phone.includes(keyword));
      if (disease) filtered = filtered.filter((p) => p.diseaseTypes.includes(disease));
      if (signing) filtered = filtered.filter((p) => p.signingStatus === signing);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (patientPage > totalPages) patientPage = totalPages;
      const pageData = filtered.slice((patientPage - 1) * pageSize, patientPage * pageSize);

      $('#patient-table-body').innerHTML = `
        <table>
          <thead><tr>
            <th>患者ID</th><th>姓名</th><th>性别</th><th>年龄</th>
            <th>慢病类型</th><th>签约状态</th><th>签约医生</th>
            <th>最近随访</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${pageData.length === 0 ? '<tr><td colspan="9" style="text-align:center;padding:40px;color:#999;">暂无数据</td></tr>' : ''}
            ${pageData.map((p) => `
              <tr>
                <td>${p.id}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>${genderMap[p.gender]}</td>
                <td>${p.age}</td>
                <td>${diseaseTags(p.diseaseTypes)}</td>
                <td>${tag(signingStatusMap[p.signingStatus], signingStatusColor[p.signingStatus])}</td>
                <td>${escapeHtml(p.signedDoctor || '-')}</td>
                <td>${p.lastFollowupDate || '-'}</td>
                <td><button class="btn-link btn-sm" onclick="window._app.showPatientDetail('${p.id}')">查看</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      renderPagination('#patient-pagination', patientPage, totalPages, (p) => { patientPage = p; refresh(); });
    }

    $('#patient-search').addEventListener('input', () => { patientPage = 1; refresh(); });
    $('#filter-disease').addEventListener('change', () => { patientPage = 1; refresh(); });
    $('#filter-signing').addEventListener('change', () => { patientPage = 1; refresh(); });
    refresh();
  }

  function renderPagination(selector, current, total, onChange) {
    const container = $(selector);
    container.innerHTML = '';
    if (total <= 1) return;
    const prev = el('button', 'page-btn', '上一页');
    prev.disabled = current <= 1;
    prev.addEventListener('click', () => onChange(current - 1));
    container.appendChild(prev);
    for (let i = 1; i <= total; i++) {
      const btn = el('button', `page-btn ${i === current ? 'active' : ''}`, String(i));
      btn.addEventListener('click', () => onChange(i));
      container.appendChild(btn);
    }
    const next = el('button', 'page-btn', '下一页');
    next.disabled = current >= total;
    next.addEventListener('click', () => onChange(current + 1));
    container.appendChild(next);
  }

  function showPatientDetail(patientId) {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    const content = $('#page-content');
    content.innerHTML = `
      <div class="page-title">患者详情</div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">基本信息</span>
          <button class="btn btn-sm" onclick="window._app.navigate('/patient')">返回列表</button>
        </div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">患者ID</span><span class="detail-value">${p.id}</span></div>
            <div class="detail-item"><span class="detail-label">姓名</span><span class="detail-value">${escapeHtml(p.name)}</span></div>
            <div class="detail-item"><span class="detail-label">性别</span><span class="detail-value">${genderMap[p.gender]}</span></div>
            <div class="detail-item"><span class="detail-label">年龄</span><span class="detail-value">${p.age}岁</span></div>
            <div class="detail-item"><span class="detail-label">出生日期</span><span class="detail-value">${p.birthDate}</span></div>
            <div class="detail-item"><span class="detail-label">身份证号</span><span class="detail-value">${p.idCard}</span></div>
            <div class="detail-item"><span class="detail-label">手机号</span><span class="detail-value">${p.phone}</span></div>
            <div class="detail-item"><span class="detail-label">地址</span><span class="detail-value">${escapeHtml(p.address)}</span></div>
            <div class="detail-item"><span class="detail-label">慢病类型</span><span class="detail-value">${diseaseTags(p.diseaseTypes)}</span></div>
            <div class="detail-item"><span class="detail-label">管理级别</span><span class="detail-value">${manageLevelMap[p.manageLevel]}</span></div>
            <div class="detail-item"><span class="detail-label">签约状态</span><span class="detail-value">${tag(signingStatusMap[p.signingStatus], signingStatusColor[p.signingStatus])}</span></div>
            <div class="detail-item"><span class="detail-label">签约医生</span><span class="detail-value">${escapeHtml(p.signedDoctor || '-')}</span></div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div class="card-header"><span class="card-title">健康信息</span></div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">身高</span><span class="detail-value">${p.height || '-'} cm</span></div>
            <div class="detail-item"><span class="detail-label">体重</span><span class="detail-value">${p.weight || '-'} kg</span></div>
            <div class="detail-item"><span class="detail-label">BMI</span><span class="detail-value">${p.bmi || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">血型</span><span class="detail-value">${p.bloodType || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">家族史</span><span class="detail-value">${escapeHtml(p.familyHistory || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">过敏史</span><span class="detail-value">${escapeHtml(p.allergyHistory || '-')}</span></div>
            <div class="detail-item"><span class="detail-label">吸烟</span><span class="detail-value">${p.smoking ? '是' : '否'}</span></div>
            <div class="detail-item"><span class="detail-label">饮酒</span><span class="detail-value">${p.drinking ? '是' : '否'}</span></div>
            <div class="detail-item"><span class="detail-label">运动频率</span><span class="detail-value">${p.exerciseFrequency || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">饮食习惯</span><span class="detail-value">${p.dietHabit || '-'}</span></div>
            ${p.lastSystolic ? `<div class="detail-item"><span class="detail-label">最近血压</span><span class="detail-value">${p.lastSystolic}/${p.lastDiastolic} mmHg</span></div>` : ''}
            ${p.lastFastingGlucose ? `<div class="detail-item"><span class="detail-label">最近空腹血糖</span><span class="detail-value">${p.lastFastingGlucose} mmol/L</span></div>` : ''}
            ${p.lastHba1c ? `<div class="detail-item"><span class="detail-label">最近糖化血红蛋白</span><span class="detail-value">${p.lastHba1c}%</span></div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /* ===== 随访列表 ===== */
  let followupPage = 1;
  function renderFollowupList(container) {
    const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'director';
    let data = isDoctor ? followups.filter((f) => f.doctor === currentUser.name) : followups;

    container.innerHTML = `
      <div class="page-title">智能随访</div>
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <input class="input" id="fu-search" placeholder="搜索患者姓名" style="width:200px;" />
            <select class="select" id="filter-fu-status">
              <option value="">全部状态</option>
              ${Object.entries(followupStatusMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
            <select class="select" id="filter-fu-disease">
              <option value="">全部病种</option>
              ${allDiseases.map((d) => `<option value="${d}">${diseaseTypeMap[d]}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="fu-table-body"></div>
        <div class="pagination" id="fu-pagination"></div>
      </div>
    `;

    function refresh() {
      const keyword = $('#fu-search').value.trim();
      const status = $('#filter-fu-status').value;
      const disease = $('#filter-fu-disease').value;
      let filtered = data;
      if (keyword) filtered = filtered.filter((f) => f.patientName.includes(keyword));
      if (status) filtered = filtered.filter((f) => f.status === status);
      if (disease) filtered = filtered.filter((f) => f.diseaseType === disease);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (followupPage > totalPages) followupPage = totalPages;
      const pageData = filtered.slice((followupPage - 1) * pageSize, followupPage * pageSize);

      $('#fu-table-body').innerHTML = `
        <table>
          <thead><tr>
            <th>随访ID</th><th>患者姓名</th><th>慢病类型</th><th>随访方式</th>
            <th>计划日期</th><th>实际日期</th><th>状态</th><th>随访医生</th><th>评估</th>
          </tr></thead>
          <tbody>
            ${pageData.length === 0 ? '<tr><td colspan="9" style="text-align:center;padding:40px;color:#999;">暂无数据</td></tr>' : ''}
            ${pageData.map((f) => `
              <tr>
                <td>${f.id}</td>
                <td>${escapeHtml(f.patientName)}</td>
                <td>${tag(diseaseTypeMap[f.diseaseType], diseaseTypeColor[f.diseaseType])}</td>
                <td>${followupMethodMap[f.method]}</td>
                <td>${f.planDate}</td>
                <td>${f.actualDate || '-'}</td>
                <td>${tag(followupStatusMap[f.status], followupStatusColor[f.status])}</td>
                <td>${escapeHtml(f.doctor)}</td>
                <td>${f.assessment ? tag(f.assessment === 'controlled' ? '已达标' : '未达标', f.assessment === 'controlled' ? 'green' : 'red') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      renderPagination('#fu-pagination', followupPage, totalPages, (p) => { followupPage = p; refresh(); });
    }
    $('#fu-search').addEventListener('input', () => { followupPage = 1; refresh(); });
    $('#filter-fu-status').addEventListener('change', () => { followupPage = 1; refresh(); });
    $('#filter-fu-disease').addEventListener('change', () => { followupPage = 1; refresh(); });
    refresh();
  }

  function renderFollowupTable(data) {
    if (!data || data.length === 0) {
      return '<div class="empty"><div class="empty-icon">📋</div>暂无待办随访</div>';
    }
    return `
      <table>
        <thead><tr>
          <th>患者姓名</th><th>慢病类型</th><th>随访方式</th><th>计划日期</th><th>操作</th>
        </tr></thead>
        <tbody>
          ${data.map((f) => `
            <tr>
              <td>${escapeHtml(f.patientName)}</td>
              <td>${tag(diseaseTypeMap[f.diseaseType], diseaseTypeColor[f.diseaseType])}</td>
              <td>${followupMethodMap[f.method]}</td>
              <td>${f.planDate}</td>
              <td><button class="btn-link btn-sm" onclick="window._app.toast('Demo版本暂不支持执行随访','info')">执行随访</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /* ===== 健康干预列表 ===== */
  let interventionPage = 1;
  function renderInterventionList(container) {
    const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'director';
    let data = isDoctor ? interventions.filter((i) => i.doctor === currentUser.name) : interventions;

    container.innerHTML = `
      <div class="page-title">健康干预</div>
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <input class="input" id="iv-search" placeholder="搜索患者/方案" style="width:200px;" />
            <select class="select" id="filter-iv-type">
              <option value="">全部类型</option>
              ${Object.entries(interventionTypeMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="iv-table-body"></div>
        <div class="pagination" id="iv-pagination"></div>
      </div>
    `;

    function refresh() {
      const keyword = $('#iv-search').value.trim();
      const type = $('#filter-iv-type').value;
      let filtered = data;
      if (keyword) filtered = filtered.filter((i) => i.patientName.includes(keyword) || i.title.includes(keyword));
      if (type) filtered = filtered.filter((i) => i.type === type);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (interventionPage > totalPages) interventionPage = totalPages;
      const pageData = filtered.slice((interventionPage - 1) * pageSize, interventionPage * pageSize);

      $('#iv-table-body').innerHTML = `
        <table>
          <thead><tr>
            <th>方案ID</th><th>患者姓名</th><th>干预类型</th><th>方案标题</th>
            <th>目标</th><th>周期</th><th>状态</th><th>创建医生</th>
          </tr></thead>
          <tbody>
            ${pageData.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">暂无数据</td></tr>' : ''}
            ${pageData.map((i) => `
              <tr>
                <td>${i.id}</td>
                <td>${escapeHtml(i.patientName)}</td>
                <td>${tag(interventionTypeMap[i.type], interventionTypeColor[i.type])}</td>
                <td>${escapeHtml(i.title)}</td>
                <td>${escapeHtml(i.target)}</td>
                <td>${escapeHtml(i.period)}</td>
                <td>${tag(interventionStatusMap[i.status], interventionStatusColor[i.status])}</td>
                <td>${escapeHtml(i.doctor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      renderPagination('#iv-pagination', interventionPage, totalPages, (p) => { interventionPage = p; refresh(); });
    }
    $('#iv-search').addEventListener('input', () => { interventionPage = 1; refresh(); });
    $('#filter-iv-type').addEventListener('change', () => { interventionPage = 1; refresh(); });
    refresh();
  }

  /* ===== 双向转诊列表 ===== */
  let referralPage = 1;
  function renderReferralList(container) {
    container.innerHTML = `
      <div class="page-title">双向转诊</div>
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <input class="input" id="rf-search" placeholder="搜索患者姓名" style="width:200px;" />
            <select class="select" id="filter-rf-type">
              <option value="">全部类型</option>
              <option value="upward">上转</option>
              <option value="downward">下转</option>
            </select>
            <select class="select" id="filter-rf-status">
              <option value="">全部状态</option>
              ${Object.entries(referralStatusMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="rf-table-body"></div>
        <div class="pagination" id="rf-pagination"></div>
      </div>
    `;

    function refresh() {
      const keyword = $('#rf-search').value.trim();
      const type = $('#filter-rf-type').value;
      const status = $('#filter-rf-status').value;
      let filtered = referrals;
      if (keyword) filtered = filtered.filter((r) => r.patientName.includes(keyword));
      if (type) filtered = filtered.filter((r) => r.type === type);
      if (status) filtered = filtered.filter((r) => r.status === status);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (referralPage > totalPages) referralPage = totalPages;
      const pageData = filtered.slice((referralPage - 1) * pageSize, referralPage * pageSize);

      $('#rf-table-body').innerHTML = `
        <table>
          <thead><tr>
            <th>转诊ID</th><th>患者姓名</th><th>转诊类型</th><th>目标医院</th>
            <th>目标科室</th><th>申请日期</th><th>状态</th><th>申请医生</th>
          </tr></thead>
          <tbody>
            ${pageData.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">暂无数据</td></tr>' : ''}
            ${pageData.map((r) => `
              <tr>
                <td>${r.id}</td>
                <td>${escapeHtml(r.patientName)}</td>
                <td>${tag(referralTypeMap[r.type], r.type === 'upward' ? 'orange' : 'blue')}</td>
                <td>${escapeHtml(r.targetHospital)}</td>
                <td>${escapeHtml(r.targetDepartment)}</td>
                <td>${r.applyDate}</td>
                <td>${tag(referralStatusMap[r.status], referralStatusColor[r.status])}</td>
                <td>${escapeHtml(r.doctor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      renderPagination('#rf-pagination', referralPage, totalPages, (p) => { referralPage = p; refresh(); });
    }
    $('#rf-search').addEventListener('input', () => { referralPage = 1; refresh(); });
    $('#filter-rf-type').addEventListener('change', () => { referralPage = 1; refresh(); });
    $('#filter-rf-status').addEventListener('change', () => { referralPage = 1; refresh(); });
    refresh();
  }

  /* ===== 审批管理 ===== */
  let approvalPage = 1;
  function renderApprovalList(container) {
    container.innerHTML = `
      <div class="page-title">审批管理</div>
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <select class="select" id="filter-ap-status">
              <option value="">全部状态</option>
              ${Object.entries(approvalStatusMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
            <select class="select" id="filter-ap-type">
              <option value="">全部类型</option>
              ${Object.entries(approvalTypeMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="ap-table-body"></div>
        <div class="pagination" id="ap-pagination"></div>
      </div>
    `;

    function refresh() {
      const status = $('#filter-ap-status').value;
      const type = $('#filter-ap-type').value;
      let filtered = approvals;
      if (status) filtered = filtered.filter((a) => a.status === status);
      if (type) filtered = filtered.filter((a) => a.type === type);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (approvalPage > totalPages) approvalPage = totalPages;
      const pageData = filtered.slice((approvalPage - 1) * pageSize, approvalPage * pageSize);

      $('#ap-table-body').innerHTML = `
        <table>
          <thead><tr>
            <th>审批ID</th><th>类型</th><th>患者姓名</th><th>申请医生</th>
            <th>申请日期</th><th>状态</th><th>审批人</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${pageData.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">暂无数据</td></tr>' : ''}
            ${pageData.map((a) => `
              <tr>
                <td>${a.id}</td>
                <td>${tag(approvalTypeMap[a.type], a.type === 'signing' ? 'blue' : 'purple')}</td>
                <td>${escapeHtml(a.patientName)}</td>
                <td>${escapeHtml(a.fromDoctorName)}</td>
                <td>${a.requestDate}</td>
                <td>${tag(approvalStatusMap[a.status], approvalStatusColor[a.status])}</td>
                <td>${escapeHtml(a.approverName || '-')}</td>
                <td>${a.status === 'pending' ? `<button class="btn-link btn-sm" onclick="window._app.approve('${a.id}','approved')">通过</button><button class="btn-link btn-sm" style="color:#ff4d4f;margin-left:8px;" onclick="window._app.approve('${a.id}','rejected')">拒绝</button></td>` : '<td>-</td>'}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      renderPagination('#ap-pagination', approvalPage, totalPages, (p) => { approvalPage = p; refresh(); });
    }
    $('#filter-ap-status').addEventListener('change', () => { approvalPage = 1; refresh(); });
    $('#filter-ap-type').addEventListener('change', () => { approvalPage = 1; refresh(); });
    refresh();
  }

  function approve(id, action) {
    const a = approvals.find((x) => x.id === id);
    if (!a) return;
    a.status = action;
    a.approverName = currentUser.name;
    a.approveDate = formatDate(now);
    a.approveRemark = action === 'approved' ? '同意' : '拒绝';
    toast(`已${action === 'approved' ? '通过' : '拒绝'}审批`, 'success');
    renderPage(currentRoute);
  }

  /* ===== 操作日志 ===== */
  let logPage = 1;
  function renderLogList(container) {
    container.innerHTML = `
      <div class="page-title">操作日志</div>
      <div class="table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <input class="input" id="log-search" placeholder="搜索用户/操作" style="width:200px;" />
            <select class="select" id="filter-log-module">
              <option value="">全部模块</option>
              ${['patient', 'followup', 'referral', 'intervention', 'system', 'approval'].map((m) => `<option value="${m}">${{ patient: '患者', followup: '随访', referral: '转诊', intervention: '干预', system: '系统', approval: '审批' }[m]}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="log-table-body"></div>
        <div class="pagination" id="log-pagination"></div>
      </div>
    `;

    function refresh() {
      const keyword = $('#log-search').value.trim();
      const module = $('#filter-log-module').value;
      let filtered = logs;
      if (keyword) filtered = filtered.filter((l) => l.userName.includes(keyword) || l.detail.includes(keyword));
      if (module) filtered = filtered.filter((l) => l.module === module);

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (logPage > totalPages) logPage = totalPages;
      const pageData = filtered.slice((logPage - 1) * pageSize, logPage * pageSize);

      $('#log-table-body').innerHTML = `
        <table>
          <thead><tr>
            <th>时间</th><th>用户</th><th>角色</th><th>模块</th>
            <th>操作</th><th>操作对象</th><th>详情</th>
          </tr></thead>
          <tbody>
            ${pageData.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">暂无数据</td></tr>' : ''}
            ${pageData.map((l) => `
              <tr>
                <td>${l.timestamp}</td>
                <td>${escapeHtml(l.userName)}</td>
                <td>${roleMap[l.userRole]}</td>
                <td>${{ patient: '患者', followup: '随访', referral: '转诊', intervention: '干预', system: '系统', approval: '审批' }[l.module]}</td>
                <td>${l.action}</td>
                <td>${escapeHtml(l.targetName)}</td>
                <td>${escapeHtml(l.detail)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      renderPagination('#log-pagination', logPage, totalPages, (p) => { logPage = p; refresh(); });
    }
    $('#log-search').addEventListener('input', () => { logPage = 1; refresh(); });
    $('#filter-log-module').addEventListener('change', () => { logPage = 1; refresh(); });
    refresh();
  }

  /* ===== 统计报表 ===== */
  function renderStatistics(container) {
    container.innerHTML = `
      <div class="page-title">统计报表</div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:#1677ff">👥</div>
          <div class="stat-info"><div class="stat-label">管理患者总数</div><div class="stat-value">${patients.length}<span class="stat-suffix">人</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#52c41a">✓</div>
          <div class="stat-info"><div class="stat-label">血压控制率</div><div class="stat-value">${monthlyStatistics[11].bpControlRate}<span class="stat-suffix">%</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#faad14">✓</div>
          <div class="stat-info"><div class="stat-label">血糖控制率</div><div class="stat-value">${monthlyStatistics[11].glucoseControlRate}<span class="stat-suffix">%</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#ff4d4f">📊</div>
          <div class="stat-info"><div class="stat-label">随访完成率</div><div class="stat-value">${monthlyStatistics[11].completionRate}<span class="stat-suffix">%</span></div></div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-container">
          <div class="chart-title">近12个月随访完成率趋势</div>
          <div class="chart-wrapper"><canvas id="chart-stat-completion"></canvas></div>
        </div>
        <div class="chart-container">
          <div class="chart-title">慢病类型分布</div>
          <div class="chart-wrapper"><canvas id="chart-stat-disease"></canvas></div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-container" style="grid-column:span 2;">
          <div class="chart-title">各年龄段慢病分布（堆叠柱状图）</div>
          <div class="chart-wrapper" style="height:360px;"><canvas id="chart-stat-age"></canvas></div>
        </div>
      </div>
    `;

    const c1 = new Chart($('#chart-stat-completion'), {
      type: 'line',
      data: {
        labels: monthlyStatistics.map((s) => s.month),
        datasets: [{
          label: '随访完成率',
          data: monthlyStatistics.map((s) => s.completionRate),
          borderColor: '#1677ff',
          backgroundColor: 'rgba(22,119,255,0.1)',
          fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { tooltip: { callbacks: { label: (c) => `完成率: ${c.raw}%` } } },
        scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } },
      },
    });

    const c2 = new Chart($('#chart-stat-disease'), {
      type: 'pie',
      data: {
        labels: diseaseDistribution.map((d) => diseaseTypeMap[d.diseaseType]),
        datasets: [{
          data: diseaseDistribution.map((d) => d.count),
          backgroundColor: allDiseases.map((d) => diseaseChartColors[d]),
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      },
    });

    const c3 = new Chart($('#chart-stat-age'), {
      type: 'bar',
      data: {
        labels: ageGroups,
        datasets: allDiseases.map((d) => ({
          label: diseaseTypeMap[d],
          data: ageDistribution.map((g) => g.counts[d]),
          backgroundColor: diseaseChartColors[d],
        })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      },
    });
    window._activeCharts.push(c1, c2, c3);
  }

  /* ===== 系统管理 ===== */
  function renderSystemUser(container) {
    container.innerHTML = `
      <div class="page-title">用户管理</div>
      <div class="table-wrapper">
        <div class="table-toolbar"><div class="toolbar-left"><input class="input" placeholder="搜索用户" style="width:200px;" /></div></div>
        <table>
          <thead><tr><th>用户ID</th><th>用户名</th><th>姓名</th><th>角色</th><th>所属机构</th><th>手机号</th><th>状态</th><th>创建时间</th></tr></thead>
          <tbody>
            ${systemUsers.map((u) => `
              <tr>
                <td>${u.id}</td><td>${u.username}</td><td>${escapeHtml(u.name)}</td>
                <td>${tag(roleMap[u.role], { doctor: 'blue', director: 'gold', admin: 'purple' }[u.role])}</td>
                <td>${escapeHtml(u.org)}</td><td>${u.phone}</td>
                <td>${tag(u.status === 'active' ? '启用' : '禁用', u.status === 'active' ? 'green' : 'red')}</td>
                <td>${u.createdAt}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSystemOrg(container) {
    const orgs = [
      { id: 'org001', name: '幸福社区卫生服务中心', type: '社区卫生服务中心', parentId: null, address: '幸福路88号', phone: '0571-88888888', level: '一级' },
      { id: 'org002', name: '阳光乡镇卫生院', type: '乡镇卫生院', parentId: null, address: '阳光大道100号', phone: '0571-87777777', level: '一级' },
      { id: 'org003', name: '市中心人民医院', type: '县级医院', parentId: null, address: '人民路1号', phone: '0571-86666666', level: '三级' },
      { id: 'org004', name: '幸福社区第一卫生服务站', type: '社区卫生服务站', parentId: 'org001', address: '幸福路10号', phone: '0571-88880001', level: '二级' },
    ];
    container.innerHTML = `
      <div class="page-title">机构管理</div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>机构ID</th><th>机构名称</th><th>类型</th><th>上级机构</th><th>地址</th><th>电话</th><th>等级</th></tr></thead>
          <tbody>
            ${orgs.map((o) => {
              const parent = orgs.find((x) => x.id === o.parentId);
              return `<tr>
                <td>${o.id}</td><td>${escapeHtml(o.name)}</td><td>${o.type}</td>
                <td>${parent ? escapeHtml(parent.name) : '-'}</td>
                <td>${escapeHtml(o.address)}</td><td>${o.phone}</td><td>${o.level}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSystemDict(container) {
    const dicts = [
      { id: 'd001', category: '慢病类型', code: 'hypertension', label: '高血压', sort: 1, status: 'active' },
      { id: 'd002', category: '慢病类型', code: 'diabetes', label: '2型糖尿病', sort: 2, status: 'active' },
      { id: 'd003', category: '慢病类型', code: 'copd', label: '慢阻肺', sort: 3, status: 'active' },
      { id: 'd004', category: '管理级别', code: 'level1', label: '一级（常规）', sort: 1, status: 'active' },
      { id: 'd005', category: '管理级别', code: 'level2', label: '二级（重点）', sort: 2, status: 'active' },
      { id: 'd006', category: '随访方式', code: 'outpatient', label: '门诊', sort: 1, status: 'active' },
      { id: 'd007', category: '随访方式', code: 'phone', label: '电话', sort: 2, status: 'active' },
    ];
    container.innerHTML = `
      <div class="page-title">字典管理</div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>字典ID</th><th>分类</th><th>编码</th><th>标签</th><th>排序</th><th>状态</th></tr></thead>
          <tbody>
            ${dicts.map((d) => `<tr>
              <td>${d.id}</td><td>${d.category}</td><td>${d.code}</td><td>${d.label}</td><td>${d.sort}</td>
              <td>${tag(d.status === 'active' ? '启用' : '禁用', d.status === 'active' ? 'green' : 'red')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ===== 患者门户 ===== */
  function renderPortalHome(container) {
    const patient = patients[0]; // p001 王患者
    const myFollowups = followups.filter((f) => f.patientId === patient.id);
    const myInterventions = interventions.filter((i) => i.patientId === patient.id);
    const pendingApprovals = approvals.filter((a) => a.patientId === patient.id && a.status === 'pending');

    container.innerHTML = `
      <div class="portal-welcome">
        <div>
          <h2>您好，${escapeHtml(patient.name)}</h2>
          <p>欢迎来到智管慢病患者门户 · ${escapeHtml(patient.signedDoctor ? '您的签约医生：' + patient.signedDoctor : '您尚未签约家庭医生')}</p>
          <p style="margin-top:8px;">患有慢病：${diseaseTags(patient.diseaseTypes)}</p>
        </div>
        <div class="portal-avatar">👤</div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-icon" style="background:#1677ff">📋</div>
          <div class="stat-info"><div class="stat-label">随访记录</div><div class="stat-value">${myFollowups.length}<span class="stat-suffix">条</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#52c41a">❤</div>
          <div class="stat-info"><div class="stat-label">干预方案</div><div class="stat-value">${myInterventions.length}<span class="stat-suffix">个</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#faad14">✓</div>
          <div class="stat-info"><div class="stat-label">待审批</div><div class="stat-value">${pendingApprovals.length}<span class="stat-suffix">条</span></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#13c2c2">🩺</div>
          <div class="stat-info"><div class="stat-label">签约状态</div><div class="stat-value" style="font-size:18px;">${signingStatusMap[patient.signingStatus]}</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">待处理审批</span></div>
        <div class="card-body" style="padding:0;">
          ${pendingApprovals.length === 0 ? '<div class="empty"><div class="empty-icon">✓</div>暂无待处理审批</div>' : `
            <table>
              <thead><tr><th>类型</th><th>申请医生</th><th>申请日期</th><th>原因</th><th>操作</th></tr></thead>
              <tbody>
                ${pendingApprovals.map((a) => `<tr>
                  <td>${tag(approvalTypeMap[a.type], a.type === 'signing' ? 'blue' : 'purple')}</td>
                  <td>${escapeHtml(a.fromDoctorName)}</td><td>${a.requestDate}</td>
                  <td>${escapeHtml(a.reason)}</td>
                  <td><button class="btn-link btn-sm" onclick="window._app.approve('${a.id}','approved')">同意</button><button class="btn-link btn-sm" style="color:#ff4d4f;margin-left:8px;" onclick="window._app.approve('${a.id}','rejected')">拒绝</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  }

  function renderPortalProfile(container) {
    showPatientDetail('p001');
  }

  function renderPortalFollowup(container) {
    const patient = patients[0];
    const myFollowups = followups.filter((f) => f.patientId === patient.id);
    container.innerHTML = `
      <div class="page-title">我的随访记录</div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>随访ID</th><th>慢病类型</th><th>随访方式</th><th>计划日期</th><th>实际日期</th><th>状态</th><th>随访医生</th><th>评估</th></tr></thead>
          <tbody>
            ${myFollowups.map((f) => `<tr>
              <td>${f.id}</td><td>${tag(diseaseTypeMap[f.diseaseType], diseaseTypeColor[f.diseaseType])}</td>
              <td>${followupMethodMap[f.method]}</td><td>${f.planDate}</td><td>${f.actualDate || '-'}</td>
              <td>${tag(followupStatusMap[f.status], followupStatusColor[f.status])}</td>
              <td>${escapeHtml(f.doctor)}</td>
              <td>${f.assessment ? tag(f.assessment === 'controlled' ? '已达标' : '未达标', f.assessment === 'controlled' ? 'green' : 'red') : '-'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderPortalIntervention(container) {
    const patient = patients[0];
    const myInterventions = interventions.filter((i) => i.patientId === patient.id);
    container.innerHTML = `
      <div class="page-title">我的健康干预</div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>方案ID</th><th>干预类型</th><th>方案标题</th><th>内容</th><th>目标</th><th>周期</th><th>状态</th></tr></thead>
          <tbody>
            ${myInterventions.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">暂无干预方案</td></tr>' : ''}
            ${myInterventions.map((i) => `<tr>
              <td>${i.id}</td><td>${tag(interventionTypeMap[i.type], interventionTypeColor[i.type])}</td>
              <td>${escapeHtml(i.title)}</td><td style="max-width:300px;">${escapeHtml(i.content)}</td>
              <td>${escapeHtml(i.target)}</td><td>${escapeHtml(i.period)}</td>
              <td>${tag(interventionStatusMap[i.status], interventionStatusColor[i.status])}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ===== 暴露 API ===== */
  window._app = {
    navigate,
    toast,
    showPatientDetail,
    approve,
  };

  console.log('[智管慢病] Demo 已加载，数据：', { patients: patients.length, followups: followups.length, referrals: referrals.length, interventions: interventions.length, approvals: approvals.length, logs: logs.length });
})();
