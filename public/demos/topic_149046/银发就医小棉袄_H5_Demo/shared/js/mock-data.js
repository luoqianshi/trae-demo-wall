/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

const MOCK_DATA = {
  profile: {
    name: '张秀兰',
    age: 72,
    dialect: '四川话',
    theme_mode: 'accessible'
  },
  visit_records: [{
    id: 'v_001',
    date: '2026-06-27',
    time: '09:30',
    department: '心内科',
    doctor: '李医生',
    hospital: 'XX市人民医院',
    diagnosis: { text: '冠心病、高脂血症稳定期', confidence: 92 },
    medications: [
      { generic: '美托洛尔', brand: '倍他乐克', dosage: '25mg', frequency: '每日2次', amount: '半片', time: '早晚', confidence: 94 },
      { generic: '阿托伐他汀', brand: '立普妥', dosage: '20mg', frequency: '每日1次', amount: '1片', time: '睡前', confidence: 91 }
    ],
    medication_rules: [
      { rule: '阿托伐他汀需睡前服用', type: 'timing', confidence: 88 },
      { rule: '避免与西柚汁同服', type: 'contraindication', confidence: 88 }
    ],
    follow_up: { date: '2026-07-24', items: '肝功能、心电图', department: '心内科', confidence: 78 },
    dialect_phrases: [
      { dialect: '四川话', original: '脑壳昏', standard: '头晕' },
      { dialect: '四川话', original: '心口闷', standard: '胸闷' }
    ],
    safety_level: 'green',
    recording: { duration: '02:35', source: '方言录音', text: '张阿姨，您这是冠心病合并高脂血症，我给您开美托洛尔，每天两次每次半片；阿托伐他汀睡前吃一片。注意别吃西柚，定期复查肝功能。两周后心来复查。' },
    recordings: [
      { title: '诊断说明', duration: '01:20', source: '方言录音', text: '张阿姨，您这是冠心病合并高脂血症，我给您开两种药，美托洛尔和阿托伐他汀。' },
      { title: '用药嘱咐', duration: '01:15', source: '方言录音', text: '美托洛尔每天两次每次半片；阿托伐他汀睡前吃一片。注意别吃西柚，定期复查肝功能。' }
    ],
    lab_reports: [
      { name: '血常规', date: '2026-06-27', status: 'normal', detail: '白细胞 6.8 / 红细胞 4.2 / 血红蛋白 128 / 血小板 215' },
      { name: '肝功能', date: '2026-06-27', status: 'normal', detail: 'ALT 24 / AST 22 / 总胆红素 12 / 白蛋白 42' }
    ]
  }, {
    id: 'v_005',
    date: '2026-06-27',
    time: '14:00',
    department: '神经内科',
    doctor: '陈医生',
    hospital: 'XX市人民医院',
    diagnosis: { text: '短暂性脑缺血发作（TIA）随访', confidence: 88 },
    medications: [
      { generic: '阿司匹林', brand: '拜阿司匹灵', dosage: '100mg', frequency: '每日1次', amount: '1片', time: '早上空腹', confidence: 90 }
    ],
    medication_rules: [
      { rule: '阿司匹林肠溶片需空腹服用（饭前30分钟）', type: 'timing', confidence: 85 }
    ],
    follow_up: { date: '2026-07-25', items: '颈动脉超声', department: '神经内科', confidence: 80 },
    dialect_phrases: [],
    safety_level: 'green',
    recording: { duration: '01:48', source: '方言录音', text: '陈医生说上次脑缺血要继续吃阿司匹林，这个药是肠溶片，要空腹吃，饭前30分钟吃一片，下次做个颈动脉超声。' },
    recordings: [
      { title: '诊断说明', duration: '00:55', source: '方言录音', text: '陈医生说上次脑缺血要继续吃阿司匹林，这个药是肠溶片。' },
      { title: '用药嘱咐', duration: '00:53', source: '方言录音', text: '要空腹吃，饭前30分钟吃一片，下次做个颈动脉超声。' }
    ],
    lab_reports: []
  }, {
    id: 'v_002',
    date: '2026-06-10',
    time: '10:00',
    department: '内分泌科',
    doctor: '王医生',
    hospital: 'XX市人民医院',
    diagnosis: { text: '2型糖尿病', confidence: 95 },
    medications: [
      { generic: '二甲双胍', brand: '格华止', dosage: '500mg', frequency: '每日2次', amount: '1片', time: '早晚', confidence: 96 }
    ],
    medication_rules: [
      { rule: '二甲双胍需随餐服用', type: 'timing', confidence: 92 }
    ],
    follow_up: { date: '2026-07-10', items: '糖化血红蛋白', department: '内分泌科', confidence: 90 },
    dialect_phrases: [],
    safety_level: 'green',
    recording: { duration: '02:12', source: '普通话录音', text: '王医生说糖尿病控制得不错，继续吃二甲双胍，饭后吃，下次复查糖化血红蛋白。' },
    lab_reports: [
      { name: '糖化血红蛋白', date: '2026-06-10', status: 'normal', detail: '本次 6.2%（参考 < 6.5%）✅ / 3个月前 6.5% ↓ 改善' }
    ]
  }, {
    id: 'v_003',
    date: '2026-05-25',
    time: '09:15',
    department: '心内科',
    doctor: '李医生',
    hospital: 'XX市人民医院',
    diagnosis: { text: '高血压', confidence: 78 },
    medications: [
      { generic: '硝苯地平', brand: '拜新同', dosage: '30mg', frequency: '每日1次', amount: '1片', time: '早上', confidence: 82 }
    ],
    medication_rules: [],
    follow_up: { date: '2026-06-25', items: '血压监测', department: '心内科', confidence: 76 },
    dialect_phrases: [],
    safety_level: 'green',
    recording: { duration: '01:30', source: '方言录音', text: '李医生说血压还是有点高，硝苯地平继续吃。' },
    lab_reports: []
  }, {
    id: 'v_004',
    date: '2026-04-20',
    time: '14:30',
    department: '骨科',
    doctor: '赵医生',
    hospital: 'XX市人民医院',
    diagnosis: { text: '膝关节退行性病变', confidence: 86 },
    medications: [],
    medication_rules: [],
    follow_up: null,
    dialect_phrases: [],
    safety_level: 'green',
    recording: { duration: '00:55', source: '普通话录音', text: '赵医生说膝盖退行性病变，少爬楼梯，不需要吃药。' },
    lab_reports: []
  }],
  medication_logs: [
    { date: '2026-06-27', time: '08:15', drug: '美托洛尔', status: 'taken', source: 'voice' },
    { date: '2026-06-26', time: '08:10', drug: '美托洛尔', status: 'taken', source: 'voice' },
    { date: '2026-06-26', time: '20:30', drug: '阿托伐他汀', status: 'taken', source: 'voice' },
    { date: '2026-06-26', time: '08:10', drug: '二甲双胍', status: 'taken', source: 'voice' },
    { date: '2026-06-26', time: '18:30', drug: '二甲双胍', status: 'taken', source: 'voice' },
    { date: '2026-06-25', time: '08:10', drug: '美托洛尔', status: 'taken', source: 'voice' },
    { date: '2026-06-25', time: '20:45', drug: '阿托伐他汀', status: 'taken', source: 'voice' }
  ],
  reminder_settings: { medication: true, medication_time: '08:00', follow_up: true },
  health_logs: [
    {
      id: 'hl_001', date: '2026-06-27', time: '14:30', source: 'voice',
      text: '今天血压有点高，头有点晕，胃口不太好。吃完药后胃有点不舒服。',
      extracted: { symptoms: ['头晕', '胃口不好', '胃不舒服'], medication_related: true, severity: 'mild' },
      confidence: 85
    },
    {
      id: 'hl_002', date: '2026-06-27', time: '08:00', source: 'manual',
      text: '血压 148/92，心率 78',
      extracted: { symptoms: [], measurements: { bp_sys: 148, bp_dia: 92, hr: 78 } },
      confidence: 95
    },
    {
      id: 'hl_003', date: '2026-06-26', time: '16:00', source: 'voice',
      text: '头不晕了，感觉好多了。',
      extracted: { symptoms: ['头晕缓解'], medication_related: false, severity: 'mild' },
      confidence: 72
    },
    {
      id: 'hl_004', date: '2026-06-25', time: '09:00', source: 'voice',
      text: '今天血压正常了，没什么不舒服。',
      extracted: { symptoms: [], medication_related: false, severity: 'none' },
      confidence: 88
    }
  ],
  self_measurements: [
    { date: '2026-06-27', type: 'bp_sys', value: 148, unit: 'mmHg' },
    { date: '2026-06-26', type: 'bp_sys', value: 145, unit: 'mmHg' },
    { date: '2026-06-25', type: 'bp_sys', value: 142, unit: 'mmHg' },
    { date: '2026-06-24', type: 'bp_sys', value: 140, unit: 'mmHg' },
    { date: '2026-06-23', type: 'bp_sys', value: 138, unit: 'mmHg' }
  ],
  family_members: [
    { id: 'f_001', name: '小芳', relation: '女儿' },
    { id: 'f_002', name: '小明', relation: '儿子' },
    { id: 'f_003', name: '张建国', relation: '配偶' }
  ],
  share_logs: [
    { date: '2026-06-27', target: '女儿 小芳', record_id: 'v_001', status: 'shared' }
  ],
  safety_levels: {
    green: {
      level: 'green',
      threshold: '≥ 85%',
      description: '安全通过，自动同步至子女端',
      example: { drug: '美托洛尔 25mg bid', confidence: 94 }
    },
    yellow: {
      level: 'yellow',
      threshold: '65-84%',
      description: '需子女确认，半自动同步',
      example: { drug: '氯吡格雷+奥美拉唑', confidence: 72, risk: '潜在药物相互作用' }
    },
    red: {
      level: 'red',
      threshold: '< 65%',
      description: '硬中断，阻止同步',
      example: { drug: '华法林+阿司匹林', confidence: 58, risk: '严重药物相互作用（出血风险）' },
      triggers: [
        '华法林+阿司匹林',
        '氯吡格雷+奥美拉唑',
        '地高辛+呋塞米',
        '华法林 > 10mg',
        '胰岛素 > 50 单位',
        '地高辛 > 0.5mg'
      ]
    }
  },
  offline_samples: [
    { id: 'sample_1', name: '普通话：心内科复诊', dialect: 'mandarin', scenario: '冠心病复诊' },
    { id: 'sample_2', name: '四川话：糖尿病随访', dialect: 'sichuan', scenario: '糖尿病随访' },
    { id: 'sample_3', name: '粤语：高血压初诊', dialect: 'cantonese', scenario: '高血压初诊' }
  ]
};

// 初始化 Mock 数据到 localStorage（如果尚未初始化）
function initMockData() {
  if (!localStorage.getItem('my_visit_records')) {
    localStorage.setItem('my_visit_records', JSON.stringify(MOCK_DATA.visit_records));
  }
  if (!localStorage.getItem('my_medication_logs')) {
    localStorage.setItem('my_medication_logs', JSON.stringify(MOCK_DATA.medication_logs));
  }
  if (!localStorage.getItem('my_reminder_settings')) {
    localStorage.setItem('my_reminder_settings', JSON.stringify(MOCK_DATA.reminder_settings));
  }
  if (!localStorage.getItem('my_health_logs')) {
    localStorage.setItem('my_health_logs', JSON.stringify(MOCK_DATA.health_logs));
  }
  if (!localStorage.getItem('my_self_measurements')) {
    localStorage.setItem('my_self_measurements', JSON.stringify(MOCK_DATA.self_measurements));
  }
  if (!localStorage.getItem('my_family_members')) {
    localStorage.setItem('my_family_members', JSON.stringify(MOCK_DATA.family_members));
  }
  if (!localStorage.getItem('my_share_logs')) {
    localStorage.setItem('my_share_logs', JSON.stringify(MOCK_DATA.share_logs));
  }
  // 主题默认 accessible（适老模式）：银发产品首开即大字
  // 用户主动切到 standard 后由 theme.js 写入 theme_user_choice 标记
  if (!localStorage.getItem('theme_mode')) {
    localStorage.setItem('theme_mode', 'accessible');
  }
  if (!localStorage.getItem('family_confirmed_records')) {
    localStorage.setItem('family_confirmed_records', JSON.stringify([]));
  }
  if (!localStorage.getItem('demo_current_mode')) {
    localStorage.setItem('demo_current_mode', 'online');
  }
}