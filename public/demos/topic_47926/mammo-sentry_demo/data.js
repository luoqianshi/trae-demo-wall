// ===========================================================
// MammoSentry · 模拟数据
// ===========================================================

// 病例数据
const MOCK_CASES = [
  { id: 'CASE_2026_00142', patientId: 'P-A8F2-1039', examType: 'L-MLO', patientAge: 54, breastDensity: 'C', biradsScore: 5, lesionType: 'mass', malignant: true, confidence: 0.94, inferenceTime: 286, status: 'completed' },
  { id: 'CASE_2026_00141', patientId: 'P-C3E1-8842', examType: 'R-CC', patientAge: 47, breastDensity: 'B', biradsScore: 2, lesionType: 'none', malignant: false, confidence: 0.98, inferenceTime: 234, status: 'completed' },
  { id: 'CASE_2026_00140', patientId: 'P-F7A0-2291', examType: 'R-MLO', patientAge: 62, breastDensity: 'D', biradsScore: 4, lesionType: 'calcification', malignant: true, confidence: 0.87, inferenceTime: 312, status: 'completed' },
  { id: 'CASE_2026_00139', patientId: 'P-B2D4-5571', examType: 'L-CC', patientAge: 38, breastDensity: 'A', biradsScore: 1, lesionType: 'none', malignant: false, confidence: 0.99, inferenceTime: 198, status: 'completed' },
  { id: 'CASE_2026_00138', patientId: 'P-E5C9-7710', examType: 'L-MLO', patientAge: 51, breastDensity: 'C', biradsScore: 3, lesionType: 'asymmetry', malignant: false, confidence: 0.72, inferenceTime: 267, status: 'completed' },
  { id: 'CASE_2026_00137', patientId: 'P-D8F3-1045', examType: 'R-CC', patientAge: 67, breastDensity: 'D', biradsScore: 5, lesionType: 'mass', malignant: true, confidence: 0.91, inferenceTime: 345, status: 'completed' },
  { id: 'CASE_2026_00136', patientId: 'P-A1B6-3388', examType: 'L-CC', patientAge: 44, breastDensity: 'B', biradsScore: 2, lesionType: 'none', malignant: false, confidence: 0.96, inferenceTime: 221, status: 'completed' },
  { id: 'CASE_2026_00135', patientId: 'P-G9C2-6690', examType: 'L-MLO', patientAge: 58, breastDensity: 'C', biradsScore: 4, lesionType: 'mass', malignant: true, confidence: 0.83, inferenceTime: 298, status: 'flagged' },
  { id: 'CASE_2026_00134', patientId: 'P-H4D7-1124', examType: 'R-MLO', patientAge: 49, breastDensity: 'B', biradsScore: 3, lesionType: 'calcification', malignant: false, confidence: 0.78, inferenceTime: 256, status: 'completed' },
  { id: 'CASE_2026_00133', patientId: 'P-J6E8-9001', examType: 'L-CC', patientAge: 71, breastDensity: 'D', biradsScore: 6, lesionType: 'mass', malignant: true, confidence: 0.97, inferenceTime: 389, status: 'flagged' },
];

// 实时推理流 (动态数据)
const STREAM_INITIAL = [
  { id: 'CASE_2026_00132', patient: 'P-K2F1-5532', view: 'L-MLO', status: 'preprocess', progress: 35, conf: null },
  { id: 'CASE_2026_00131', patient: 'P-L8G4-1129', view: 'R-CC', status: 'infer', progress: 68, conf: null },
  { id: 'CASE_2026_00130', patient: 'P-M3H7-8843', view: 'R-MLO', status: 'preprocess', progress: 12, conf: null },
  { id: 'CASE_2026_00129', patient: 'P-N5I9-3370', view: 'L-CC', status: 'infer', progress: 91, conf: null },
  { id: 'CASE_2026_00128', patient: 'P-P1J2-6612', view: 'L-MLO', status: 'postprocess', progress: 100, conf: 0.86 },
];

// 模型指标 (训练曲线)
const MODEL_METRICS = {
  name: 'MammoSentry v2.3',
  version: 'v2.3.0-prod',
  backbone: 'Swin-T → ResNet-18',
  pretrained: 'CBIS-DDSM (自监督) + ImageNet-1k',
  accuracy: 0.927,
  auc: 0.954,
  sensitivity: 0.918,
  specificity: 0.892,
  f1Score: 0.911,
  precision: 0.904,
  recall: 0.918,
  totalParams: '21.7M',
  flops: '4.5G',
  inferenceSpeed: '156ms/img (A100)',
  epochs: 60,
  batchSize: 32,
  learningRate: 1e-4,
  trainLoss: [0.732,0.612,0.498,0.421,0.358,0.301,0.256,0.219,0.187,0.162,0.141,0.124,0.109,0.097,0.086,0.077,0.069,0.063,0.057,0.052,0.048,0.044,0.041,0.038,0.036,0.034,0.032,0.030,0.029,0.027,0.026,0.025,0.024,0.023,0.022,0.022,0.021,0.020,0.020,0.019,0.019,0.018,0.018,0.017,0.017,0.017,0.016,0.016,0.016,0.015,0.015,0.015,0.015,0.014,0.014,0.014,0.014,0.013,0.013,0.013,0.013],
  valLoss: [0.701,0.598,0.512,0.448,0.392,0.341,0.298,0.267,0.238,0.215,0.198,0.183,0.171,0.162,0.154,0.148,0.143,0.138,0.134,0.131,0.128,0.126,0.124,0.122,0.121,0.119,0.118,0.117,0.116,0.115,0.115,0.114,0.114,0.113,0.113,0.112,0.112,0.112,0.111,0.111,0.111,0.110,0.110,0.110,0.110,0.109,0.109,0.109,0.109,0.109,0.108,0.108,0.108,0.108,0.108,0.108,0.108,0.107,0.107,0.107],
  trainAcc: [0.512,0.638,0.721,0.776,0.812,0.842,0.863,0.879,0.892,0.902,0.911,0.918,0.924,0.929,0.933,0.937,0.941,0.944,0.946,0.948,0.950,0.952,0.954,0.955,0.956,0.957,0.958,0.959,0.960,0.961,0.961,0.962,0.962,0.963,0.963,0.964,0.964,0.964,0.965,0.965,0.965,0.966,0.966,0.966,0.966,0.967,0.967,0.967,0.967,0.967,0.968,0.968,0.968,0.968,0.968,0.968,0.969,0.969,0.969,0.969],
  valAcc: [0.498,0.612,0.694,0.745,0.781,0.808,0.826,0.842,0.853,0.862,0.869,0.875,0.881,0.885,0.889,0.892,0.895,0.897,0.899,0.901,0.903,0.904,0.905,0.906,0.907,0.908,0.909,0.910,0.911,0.911,0.912,0.913,0.913,0.914,0.914,0.915,0.915,0.915,0.916,0.916,0.916,0.917,0.917,0.917,0.917,0.918,0.918,0.918,0.918,0.918,0.919,0.919,0.919,0.919,0.919,0.919,0.920,0.920,0.920,0.920],
};

// 数据集统计
const DATASET_STATS = {
  totalTrain: 11200,
  totalTest: 3850,
  totalVal: 950,
  positiveRate: 0.347,
  negativeRate: 0.653,
  classBalance: {
    trainPos: 3886, trainNeg: 7314,
    valPos: 330, valNeg: 620,
    testPos: 1329, testNeg: 2521,
  },
  lesionTypeDistribution: {
    mass: 3214,
    calcification: 2867,
    asymmetry: 1612,
    benign: 1820,
    normal: 1687,
  },
  ageDistribution: [
    { range: '20-29', count: 184 },
    { range: '30-39', count: 1284 },
    { range: '40-49', count: 3214 },
    { range: '50-59', count: 3521 },
    { range: '60-69', count: 2214 },
    { range: '70-79', count: 671 },
    { range: '80+', count: 112 },
  ],
  densityDistribution: { A: 1135, B: 3854, C: 4312, D: 1899 },
  sources: [
    { name: 'CBIS-DDSM', contribution: 0.62, cases: 6944 },
    { name: 'TCIA-BRCA', contribution: 0.21, cases: 2352 },
    { name: 'INbreast', contribution: 0.08, cases: 896 },
    { name: '院内数据', contribution: 0.09, cases: 1008 },
  ],
  augmentation: {
    '水平翻转': 1.0,
    '随机旋转(±15°)': 0.85,
    '亮度扰动': 0.72,
    '高斯噪声': 0.45,
    '弹性形变': 0.30,
    'CutMix': 0.20,
  },
};

// 推理日志
const INFERENCE_LOGS = [
  { time: '16:22:18.412', level: 'info', msg: '> mammo.infer --model=v2.3 --device=cuda:0 --precision=fp16' },
  { time: '16:22:18.418', level: 'info', msg: '> 加载预训练权重: swin_tiny_patch4_window7_224.pth' },
  { time: '16:22:18.523', level: 'ok', msg: '✓ Backbone [Swin-Tiny] 加载完成 (224×224, 28.3M params)' },
  { time: '16:22:18.531', level: 'info', msg: '> 加载微调权重: resnet18_finetuned_best.pth' },
  { time: '16:22:18.604', level: 'ok', msg: '✓ Head [ResNet-18] 加载完成 (11.7M params, 4-class)' },
  { time: '16:22:18.612', level: 'info', msg: '> 输入: DICOM (L-MLO, 2294×1914, 12-bit, 0.1mm/pixel)' },
  { time: '16:22:18.625', level: 'info', msg: '> 预处理: 灰度化 → CLAHE均衡 → 标准化 → resize(224,224)' },
  { time: '16:22:19.087', level: 'info', msg: '> Patch Embedding: 49 patches × 96-dim' },
  { time: '16:22:19.142', level: 'info', msg: '> Stage 1 [W-MSA 7×7] → 特征图 56×56' },
  { time: '16:22:19.218', level: 'info', msg: '> Stage 2 [SW-MSA 7×7] → 特征图 28×28' },
  { time: '16:22:19.301', level: 'info', msg: '> Stage 3 [SW-MSA 7×7] → 特征图 14×14' },
  { time: '16:22:19.385', level: 'info', msg: '> Stage 4 [SW-MSA 7×7] → 特征图 7×7' },
  { time: '16:22:19.412', level: 'info', msg: '> Global AvgPool → 768-dim embedding' },
  { time: '16:22:19.487', level: 'info', msg: '> ResNet-18 微调分类头 · FC(512) → ReLU → Drop(0.3) → FC(4)' },
  { time: '16:22:19.602', level: 'ok', msg: '✓ 前向传播完成 · 286ms · GPU mem: 1.42GB' },
  { time: '16:22:19.610', level: 'info', msg: '> Softmax 概率: [benign: 0.04, mass: 0.91, calc: 0.03, asym: 0.02]' },
  { time: '16:22:19.624', level: 'warn', msg: '⚠ 高置信度阳性 · 自动触发 BI-RADS 4+ 预警' },
  { time: '16:22:19.658', level: 'ok', msg: '✓ Grad-CAM 热力图生成完成 · 病灶定位 (R-Sup, x=842, y=512)' },
  { time: '16:22:19.701', level: 'info', msg: '> 输出: BI-RADS 5 · 恶性置信度 0.94 · 病灶类别: mass' },
  { time: '16:22:19.712', level: 'info', msg: '> 报告生成: REPORT_2026_00142.pdf · 队列推送 ✓' },
  { time: '16:22:19.720', level: 'ok', msg: '✓ 推理任务完成 · 总耗时 308ms' },
];

// 模型架构节点
const ARCH_NODES = [
  { id: 'input', name: 'Input', detail: '224×224' },
  { id: 'patch', name: 'Patch', detail: '4×4 · 96d' },
  { id: 'swin1', name: 'Swin-1', detail: 'W-MSA 56²' },
  { id: 'swin2', name: 'Swin-2', detail: 'SW-MSA 28²' },
  { id: 'swin3', name: 'Swin-3', detail: 'SW-MSA 14²' },
  { id: 'swin4', name: 'Swin-4', detail: 'SW-MSA 7²' },
  { id: 'resnet', name: 'ResNet-18', detail: 'FT backbone' },
  { id: 'head', name: 'FC Head', detail: 'BI-RADS 0-6' },
];

// 模拟历史检测结果 (用于检测结果页面)
const RESULT_CASE = {
  id: 'CASE_2026_00142',
  patientId: 'P-A8F2-1039',
  patientAge: 54,
  patientGender: 'F',
  examDate: '2026-06-27 14:32:08',
  examType: 'L-MLO',
  facility: '中心医院 · 放射科',
  physician: 'Dr. Chen',
  modality: 'Hologic 3Dimensions',
  breastDensity: 'C - 不均匀致密',
  findings: '左乳外上象限可见不规则高密度肿块影，边缘呈毛刺状，范围约 18×14mm。',
  birads: 5,
  biradsLabel: '高度怀疑恶性',
  confidence: 0.94,
  recommendation: '建议立即活检以明确病理诊断，可考虑超声引导下空芯针穿刺活检(CNB)。',
  lesion: {
    type: 'mass',
    location: 'L-Sup-Outer (左乳外上象限)',
    size: '18 × 14 mm',
    shape: '不规则形',
    margin: '毛刺状',
    density: '高密度',
  },
  classification: {
    benign: 0.04,
    mass: 0.91,
    calcification: 0.03,
    asymmetry: 0.02,
  },
  riskFactors: [
    { name: '肿块形态不规则', value: 0.92, level: 'high' },
    { name: '边缘毛刺征', value: 0.88, level: 'high' },
    { name: '密度高于腺体', value: 0.76, level: 'high' },
    { name: '周围结构扭曲', value: 0.65, level: 'mid' },
    { name: '皮肤/乳头改变', value: 0.18, level: 'low' },
  ],
  comparisonStudies: [
    { date: '2024-11-12', birads: 2, note: '未见明确占位' },
    { date: '2025-05-08', birads: 3, note: '外上象限轻度不对称' },
    { date: '2025-11-22', birads: 4, note: '可疑肿块,建议短期随访' },
    { date: '2026-06-27', birads: 5, note: '明显恶性征象' },
  ],
  heatmapCoords: { x: 50, y: 50, w: 30, h: 22 },
};
