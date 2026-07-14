const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// 参考范围常量
const REF_RANGES = {
  bmi: { normal: '18.5-23.9', warning: '24.0-27.9', abnormal: '≥28.0', unit: '' },
  blood_pressure: { systolic: { normal: '<120', warning: '120-139', abnormal: '≥140', unit: 'mmHg' }, diastolic: { normal: '<80', warning: '80-89', abnormal: '≥90', unit: 'mmHg' } },
  blood_sugar: { fasting: { normal: '<6.1', warning: '6.1-6.9', abnormal: '≥7.0', unit: 'mmol/L' }, postprandial: { normal: '<7.8', warning: '7.8-11.0', abnormal: '≥11.1', unit: 'mmol/L' } },
  blood_lipid: { total_cholesterol: { normal: '<5.2', warning: '5.2-6.2', abnormal: '>6.2', unit: 'mmol/L' }, ldl: { normal: '<3.4', warning: '3.4-4.1', abnormal: '>4.1', unit: 'mmol/L' }, hdl: { normal: '>1.0', abnormal: '<1.0', unit: 'mmol/L' }, triglycerides: { normal: '<1.7', warning: '1.7-2.3', abnormal: '>2.3', unit: 'mmol/L' } },
  uric_acid: { normal: '≤420', warning: '420-480', abnormal: '>480', unit: 'μmol/L' },
  hba1c: { normal: '<5.7%', warning: '5.7%-6.4%', abnormal: '≥6.5%', unit: '%' },
  waist: { male: { normal: '<90', abnormal: '≥90', unit: 'cm' }, female: { normal: '<85', abnormal: '≥85', unit: 'cm' } }
};

/**
 * POST /api/v1/analysis/scan-report
 * 模拟体检报告扫描
 */
router.post('/scan-report', (req, res) => {
  try {
    const userId = req.user.id;
    const { metrics } = req.body;

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ code: 400, message: '请提供体检指标数据', data: null });
    }

    const supportedTypes = [
      'blood_pressure', 'blood_sugar', 'blood_lipid',
      'uric_acid', 'hba1c', 'bmi', 'waist'
    ];

    const analysisResults = [];
    const abnormalItems = [];

    for (const metric of metrics) {
      if (!metric.type || !supportedTypes.includes(metric.type)) {
        analysisResults.push({ type: metric.type, status: 'unknown', message: '不支持的指标类型' });
        continue;
      }
      const result = analyzeMetric(metric.type, metric.value);
      analysisResults.push(result);
      if (result.status !== 'normal') abnormalItems.push(result);
    }

    const insertReport = db.prepare(`INSERT INTO medical_reports (user_id, ocr_status, ocr_result) VALUES (?, ?, ?)`);
    const reportResult = insertReport.run(userId, 'completed', JSON.stringify({ metrics, analysis: analysisResults }));

    res.json({
      code: 0, message: '体检报告分析完成',
      data: {
        report_id: reportResult.lastInsertRowid,
        total_items: metrics.length,
        normal_count: analysisResults.filter(r => r.status === 'normal').length,
        abnormal_count: abnormalItems.length,
        analysis: analysisResults,
        abnormal_items: abnormalItems,
        summary: generateSummary(abnormalItems)
      }
    });
  } catch (err) {
    console.error('[Analysis] 体检报告扫描失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/analysis/report
 * 获取用户的体检档案分析报告（含综合评分和参考范围）
 */
router.get('/report', (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const allMetrics = db.prepare('SELECT * FROM health_metrics WHERE user_id = ? ORDER BY id DESC').all(userId);

    const latestMetrics = {};
    for (const m of allMetrics) {
      if (!latestMetrics[m.metric_type]) {
        latestMetrics[m.metric_type] = {
          value: (function(v) { try { return typeof v === 'string' ? JSON.parse(v) : v } catch(e) { return v } })(m.value),
          record_date: m.record_date
        };
      }
    }

    const isMale = profile && profile.gender === 'male';
    const analyses = [];

    // BMI分析（优先从metrics表的最新bmi记录读取身高体重，更准确）
    let bmiAnalysis = null;
    let bmiHeight = null;
    let bmiWeight = null;

    // 优先从metrics表的最新bmi记录读取
    const bmiMetric = latestMetrics['bmi'];
    if (bmiMetric && bmiMetric.value) {
      const bv = bmiMetric.value;
      if (bv.height) bmiHeight = bv.height;
      if (bv.weight) bmiWeight = bv.weight;
    }
    // 如果metrics中没有bmi记录，再fallback到profile
    if (!bmiHeight || !bmiWeight) {
      if (profile && profile.height) bmiHeight = profile.height;
      if (profile && profile.weight) bmiWeight = profile.weight;
    }

    if (bmiHeight && bmiWeight) {
      const heightM = bmiHeight / 100;
      const bmi = Math.round((bmiWeight / (heightM * heightM)) * 10) / 10;
      const status = bmi >= 18.5 && bmi < 24 ? 'normal' : bmi >= 24 && bmi < 28 ? 'warning' : 'abnormal';
      bmiAnalysis = {
        value: bmi, label: bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '偏胖' : '肥胖',
        status,
        suggestion: bmi >= 28 ? '建议控制饮食并增加有氧运动' : bmi >= 24 ? '建议减少高热量食物，增加运动' : bmi < 18.5 ? '建议增加蛋白质和碳水化合物摄入' : '保持良好习惯',
        reference_range: REF_RANGES.bmi.normal,
        unit: REF_RANGES.bmi.unit
      };
      analyses.push({ type: 'bmi', status });
    }

    // 血压评估（兼容对象格式和字符串格式）
    let bpAnalysis = null;
    if (latestMetrics['blood_pressure']) {
      const raw = latestMetrics['blood_pressure'].value;
      let systolic = null, diastolic = null;
      if (typeof raw === 'string' && raw.includes('/')) {
        const parts = raw.split('/');
        systolic = parseFloat(parts[0]);
        diastolic = parseFloat(parts[1]);
      } else if (typeof raw === 'object' && raw !== null) {
        systolic = raw.systolic;
        diastolic = raw.diastolic;
      }
      if (systolic !== null && diastolic !== null) {
        const status = systolic < 120 && diastolic < 80 ? 'normal' : systolic < 140 && diastolic < 90 ? 'warning' : 'abnormal';
        bpAnalysis = {
          systolic, diastolic, status,
          label: status === 'normal' ? '正常' : status === 'warning' ? '正常高值' : '偏高',
          suggestion: status === 'normal' ? '继续保持' : status === 'warning' ? '建议低盐饮食，定期监测' : '建议就医检查，严格控制盐分摄入',
          reference_range: `收缩压${REF_RANGES.blood_pressure.systolic.normal}${REF_RANGES.blood_pressure.systolic.unit}，舒张压${REF_RANGES.blood_pressure.diastolic.normal}${REF_RANGES.blood_pressure.diastolic.unit}`,
          unit: 'mmHg'
        };
        analyses.push({ type: 'blood_pressure', status });
      }
    }

    // 血糖评估（兼容对象格式和字符串格式）
    let bsAnalysis = null;
    if (latestMetrics['blood_sugar']) {
      const raw = latestMetrics['blood_sugar'].value;
      let fasting = null, postprandial = null;
      if (typeof raw === 'string') {
        fasting = parseFloat(raw);
      } else if (typeof raw === 'object' && raw !== null) {
        fasting = raw.fasting;
        postprandial = raw.postprandial;
      }
      if (fasting !== null) {
        const status = fasting < 6.1 ? 'normal' : fasting < 7.0 ? 'warning' : 'abnormal';
        bsAnalysis = {
          fasting, postprandial, status,
          label: status === 'normal' ? '正常' : status === 'warning' ? '空腹血糖受损' : '偏高',
          suggestion: status === 'normal' ? '继续保持' : status === 'warning' ? '建议控制碳水化合物摄入，增加运动' : '建议就医检查，严格控制饮食',
          reference_range: `空腹${REF_RANGES.blood_sugar.fasting.normal}${REF_RANGES.blood_sugar.fasting.unit}，餐后${REF_RANGES.blood_sugar.postprandial.normal}${REF_RANGES.blood_sugar.postprandial.unit}`,
          unit: 'mmol/L'
        };
        analyses.push({ type: 'blood_sugar', status });
      }
    }

    // 血脂评估
    let blAnalysis = null;
    if (latestMetrics['blood_lipid']) {
      const bl = latestMetrics['blood_lipid'].value;
      const abnormalFlags = [];
      if (bl.total_cholesterol >= 5.2) abnormalFlags.push('总胆固醇偏高');
      if (bl.ldl >= 3.4) abnormalFlags.push('低密度脂蛋白偏高');
      if (bl.triglycerides >= 1.7) abnormalFlags.push('甘油三酯偏高');
      if (bl.hdl < 1.0) abnormalFlags.push('高密度脂蛋白偏低');
      const status = abnormalFlags.length === 0 ? 'normal' : abnormalFlags.length <= 1 ? 'warning' : 'abnormal';
      blAnalysis = {
        total_cholesterol: bl.total_cholesterol, ldl: bl.ldl, hdl: bl.hdl, triglycerides: bl.triglycerides,
        status,
        label: status === 'normal' ? '正常' : status === 'warning' ? '轻度异常' : '异常',
        abnormal_flags: abnormalFlags,
        suggestion: status === 'normal' ? '继续保持' : '建议减少饱和脂肪摄入，增加有氧运动',
        reference_range: `总胆固醇${REF_RANGES.blood_lipid.total_cholesterol.normal}${REF_RANGES.blood_lipid.total_cholesterol.unit}，LDL${REF_RANGES.blood_lipid.ldl.normal}${REF_RANGES.blood_lipid.ldl.unit}，HDL>${REF_RANGES.blood_lipid.hdl.normal}${REF_RANGES.blood_lipid.hdl.unit}，甘油三酯${REF_RANGES.blood_lipid.triglycerides.normal}${REF_RANGES.blood_lipid.triglycerides.unit}`,
        unit: 'mmol/L'
      };
      analyses.push({ type: 'blood_lipid', status });
    }

    // 尿酸评估
    let uaAnalysis = null;
    if (latestMetrics['uric_acid']) {
      const ua = latestMetrics['uric_acid'].value;
      const uaValue = typeof ua === 'object' ? ua.value : ua;
      const status = uaValue <= 420 ? 'normal' : uaValue <= 480 ? 'warning' : 'abnormal';
      uaAnalysis = {
        value: uaValue, status,
        label: status === 'normal' ? '正常' : status === 'warning' ? '边缘升高' : '偏高',
        suggestion: status === 'normal' ? '继续保持' : '建议减少高嘌呤食物（海鲜、动物内脏），多喝水',
        reference_range: `${REF_RANGES.uric_acid.normal}${REF_RANGES.uric_acid.unit}`,
        unit: REF_RANGES.uric_acid.unit
      };
      analyses.push({ type: 'uric_acid', status });
    }

    // 糖化血红蛋白评估
    let hbaAnalysis = null;
    if (latestMetrics['hba1c']) {
      const hba = latestMetrics['hba1c'].value;
      const hbaValue = typeof hba === 'object' ? hba.value : hba;
      const status = hbaValue < 5.7 ? 'normal' : hbaValue < 6.5 ? 'warning' : 'abnormal';
      hbaAnalysis = {
        value: hbaValue, status,
        label: status === 'normal' ? '正常' : status === 'warning' ? '糖尿病前期' : '偏高',
        suggestion: status === 'normal' ? '继续保持' : status === 'warning' ? '建议控制碳水摄入，定期监测血糖' : '建议就医，严格控制饮食和血糖',
        reference_range: REF_RANGES.hba1c.normal,
        unit: REF_RANGES.hba1c.unit
      };
      analyses.push({ type: 'hba1c', status });
    }

    // 腰围评估
    let waistAnalysis = null;
    if (latestMetrics['waist']) {
      const waist = latestMetrics['waist'].value;
      const waistValue = typeof waist === 'object' ? waist.value : waist;
      const threshold = isMale ? 90 : 85;
      const status = waistValue < threshold ? 'normal' : 'abnormal';
      waistAnalysis = {
        value: waistValue, status,
        label: status === 'normal' ? '正常' : '超标',
        suggestion: status === 'normal' ? '继续保持' : '提示腹型肥胖风险，建议控制饮食+有氧运动',
        reference_range: `${isMale ? '男<90' : '女<85'}cm`,
        unit: 'cm'
      };
      analyses.push({ type: 'waist', status });
    }

    // 综合评分计算
    const allStatuses = analyses.map(a => a.status);
    const abnormalCount = allStatuses.filter(s => s !== 'normal').length;
    const warningCount = allStatuses.filter(s => s === 'warning').length;
    const totalCount = allStatuses.length;

    // 评分公式：满分100，每项正常+100/total，warning+50/total，abnormal+0
    let overallScore = 0;
    allStatuses.forEach(s => {
      if (s === 'normal') overallScore += 100 / totalCount;
      else if (s === 'warning') overallScore += 50 / totalCount;
    });
    overallScore = Math.round(overallScore);

    let overallRisk = 'low';
    if (abnormalCount >= 3 || allStatuses.some(s => s === 'abnormal')) overallRisk = 'high';
    else if (abnormalCount >= 1 || warningCount >= 2) overallRisk = 'medium';

    // 生成建议
    const dietSuggestions = [];
    if (bpAnalysis?.status !== 'normal') dietSuggestions.push('低盐饮食，每日盐摄入<5g');
    if (bsAnalysis?.status !== 'normal') dietSuggestions.push('低GI饮食，控制精制碳水');
    if (blAnalysis?.status !== 'normal') dietSuggestions.push('低脂饮食，减少油炸和动物脂肪');
    if (uaAnalysis?.status !== 'normal') dietSuggestions.push('低嘌呤饮食，多喝水');
    if (bmiAnalysis?.status !== 'normal' && bmiAnalysis?.value >= 24) dietSuggestions.push('控制总热量，增加蔬菜摄入');
    if (dietSuggestions.length === 0) dietSuggestions.push('均衡饮食，多样化摄入');

    const exerciseSuggestions = [];
    if (bmiAnalysis?.value >= 28) exerciseSuggestions.push('从快走开始，每次30分钟');
    else if (bmiAnalysis?.value >= 24) exerciseSuggestions.push('有氧运动+力量训练结合');
    if (bpAnalysis?.status !== 'normal') exerciseSuggestions.push('推荐快走、太极等低强度运动');
    if (blAnalysis?.status !== 'normal') exerciseSuggestions.push('有氧运动促进脂质代谢');
    if (bsAnalysis?.status !== 'normal') exerciseSuggestions.push('餐后1小时快走有助控糖');
    if (exerciseSuggestions.length === 0) exerciseSuggestions.push('保持规律运动，每周150分钟中等强度');

    // 构建前端兼容的数据结构
    const responseData = {
      overall_score: overallScore,
      score: overallScore,
      bmi: bmiAnalysis,
      blood_pressure: bpAnalysis,
      blood_sugar: bsAnalysis,
      blood_lipid: blAnalysis,
      uric_acid: uaAnalysis,
      hba1c: hbaAnalysis,
      waist: waistAnalysis,
      overall_risk: overallRisk,
      risk_label: overallRisk === 'low' ? '低风险' : overallRisk === 'medium' ? '中风险' : '高风险',
      analyses_summary: analyses,
      diet_suggestions: dietSuggestions,
      dietAdvice: dietSuggestions,
      exercise_suggestions: exerciseSuggestions,
      exerciseAdvice: exerciseSuggestions,
      // 前端期望的扁平字段
      systolic: bpAnalysis ? bpAnalysis.systolic : null,
      diastolic: bpAnalysis ? bpAnalysis.diastolic : null,
      fastingGlucose: bsAnalysis ? bsAnalysis.fasting : null,
      postprandialGlucose: bsAnalysis ? bsAnalysis.postprandial : null,
      totalCholesterol: blAnalysis ? blAnalysis.total_cholesterol : null,
      triglycerides: blAnalysis ? blAnalysis.triglycerides : null,
      hdl: blAnalysis ? blAnalysis.hdl : null,
      ldl: blAnalysis ? blAnalysis.ldl : null,
      uricAcid: uaAnalysis ? uaAnalysis.value : null,
      hba1cValue: hbaAnalysis ? hbaAnalysis.value : null,
      waistValue: waistAnalysis ? waistAnalysis.value : null,
      // risks 数组（前端格式）
      risks: analyses.filter(a => a.status !== 'normal').map(a => {
        const nameMap = {
          bmi: 'BMI', blood_pressure: '血压', blood_sugar: '血糖',
          blood_lipid: '血脂', uric_acid: '尿酸', hba1c: '糖化血红蛋白', waist: '腰围'
        };
        return {
          name: (nameMap[a.type] || a.type) + (a.status === 'abnormal' ? '异常' : '注意'),
          level: a.status
        };
      })
    };

    res.json({
      code: 0, message: 'ok',
      data: responseData
    });
  } catch (err) {
    console.error('[Analysis] 获取分析报告失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

function analyzeMetric(type, value) {
  switch (type) {
    case 'blood_pressure': {
      const { systolic, diastolic } = value;
      if (systolic < 120 && diastolic < 80) return { type, status: 'normal', message: '血压正常', value };
      else if (systolic < 140 && diastolic < 90) return { type, status: 'warning', message: '血压正常高值，建议预防性控制', value };
      else return { type, status: 'abnormal', message: '血压偏高，建议就医检查', value };
    }
    case 'blood_sugar': {
      const fasting = value.fasting;
      if (fasting < 6.1) return { type, status: 'normal', message: '空腹血糖正常', value };
      else if (fasting < 7.0) return { type, status: 'warning', message: '空腹血糖受损，建议控制饮食', value };
      else return { type, status: 'abnormal', message: '空腹血糖偏高，建议就医', value };
    }
    case 'blood_lipid': {
      const flags = [];
      if (value.total_cholesterol >= 5.2) flags.push('总胆固醇偏高');
      if (value.ldl >= 3.4) flags.push('低密度脂蛋白偏高');
      if (value.triglycerides >= 1.7) flags.push('甘油三酯偏高');
      if (value.hdl < 1.0) flags.push('高密度脂蛋白偏低');
      if (flags.length === 0) return { type, status: 'normal', message: '血脂指标正常', value };
      else return { type, status: 'abnormal', message: `血脂异常：${flags.join('，')}`, value, flags };
    }
    case 'uric_acid': {
      const uaValue = typeof value === 'object' ? value.value : value;
      if (uaValue <= 420) return { type, status: 'normal', message: '尿酸正常', value };
      else if (uaValue <= 480) return { type, status: 'warning', message: '尿酸边缘升高，建议多喝水', value };
      else return { type, status: 'abnormal', message: '尿酸偏高，建议调整饮食', value };
    }
    case 'hba1c': {
      const hbaValue = typeof value === 'object' ? value.value : value;
      if (hbaValue < 5.7) return { type, status: 'normal', message: '糖化血红蛋白正常', value };
      else if (hbaValue < 6.5) return { type, status: 'warning', message: '糖化血红蛋白处于糖尿病前期范围', value };
      else return { type, status: 'abnormal', message: '糖化血红蛋白偏高，提示血糖控制不佳', value };
    }
    case 'bmi': {
      const bmiValue = typeof value === 'object' ? value.value : value;
      if (bmiValue >= 18.5 && bmiValue < 24) return { type, status: 'normal', message: 'BMI正常', value };
      else if (bmiValue >= 24 && bmiValue < 28) return { type, status: 'warning', message: 'BMI偏高，建议控制体重', value };
      else return { type, status: 'abnormal', message: bmiValue < 18.5 ? 'BMI偏低，建议增加营养' : 'BMI超标，建议减重', value };
    }
    case 'waist': {
      const waistValue = typeof value === 'object' ? value.value : value;
      if (waistValue < 85) return { type, status: 'normal', message: '腰围正常', value };
      else if (waistValue < 90) return { type, status: 'warning', message: '腰围偏大，建议控制', value };
      else return { type, status: 'abnormal', message: '腰围超标，提示腹型肥胖风险', value };
    }
    default:
      return { type, status: 'unknown', message: '未知指标', value };
  }
}

function generateSummary(abnormalItems) {
  if (abnormalItems.length === 0) return '恭喜，所有指标均在正常范围内！请继续保持健康的生活方式。';
  const summaryParts = [];
  const abnormalTypes = abnormalItems.map(i => i.type);
  if (abnormalTypes.includes('blood_pressure')) summaryParts.push('血压需要关注');
  if (abnormalTypes.includes('blood_sugar') || abnormalTypes.includes('hba1c')) summaryParts.push('血糖需要控制');
  if (abnormalTypes.includes('blood_lipid')) summaryParts.push('血脂需要调理');
  if (abnormalTypes.includes('uric_acid')) summaryParts.push('尿酸需要降低');
  if (abnormalTypes.includes('bmi') || abnormalTypes.includes('waist')) summaryParts.push('体重/腰围需要管理');
  return `体检发现${summaryParts.join('、')}，建议参考下方的饮食和运动建议进行调整，必要时请咨询医生。`;
}

module.exports = router;
