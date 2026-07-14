const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 所有健康路由需要认证
router.use(auth);

/**
 * GET /api/v1/health/profile
 * 获取基础信息
 */
router.get('/profile', (req, res) => {
  try {
    const userId = req.user.id;
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    res.json({
      code: 0,
      message: 'ok',
      data: profile || null
    });
  } catch (err) {
    console.error('[Health] 获取基础信息失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * PUT /api/v1/health/profile
 * 更新基础信息（身高/体重/年龄/性别/职业）
 */
router.put('/profile', (req, res) => {
  try {
    const userId = req.user.id;
    const { height, weight, age, gender, occupation, diet_habits, sleep_habits, exercise_habits } = req.body;

    // 检查是否已有档案
    const existing = db.prepare('SELECT id FROM user_profiles WHERE user_id = ?').get(userId);

    if (existing) {
      // 更新
      db.prepare(`
        UPDATE user_profiles SET
          height = COALESCE(?, height),
          weight = COALESCE(?, weight),
          age = COALESCE(?, age),
          gender = COALESCE(?, gender),
          occupation = COALESCE(?, occupation),
          diet_habits = COALESCE(?, diet_habits),
          sleep_habits = COALESCE(?, sleep_habits),
          exercise_habits = COALESCE(?, exercise_habits),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        height !== undefined ? height : null,
        weight !== undefined ? weight : null,
        age !== undefined ? age : null,
        gender !== undefined ? gender : null,
        occupation !== undefined ? occupation : null,
        diet_habits !== undefined ? (typeof diet_habits === 'object' ? JSON.stringify(diet_habits) : diet_habits) : null,
        sleep_habits !== undefined ? (typeof sleep_habits === 'object' ? JSON.stringify(sleep_habits) : sleep_habits) : null,
        exercise_habits !== undefined ? (typeof exercise_habits === 'object' ? JSON.stringify(exercise_habits) : exercise_habits) : null,
        userId
      );
    } else {
      // 新建
      db.prepare(`
        INSERT INTO user_profiles (user_id, height, weight, age, gender, occupation, diet_habits, sleep_habits, exercise_habits)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        height || null,
        weight || null,
        age || null,
        gender || null,
        occupation || null,
        diet_habits ? (typeof diet_habits === 'object' ? JSON.stringify(diet_habits) : diet_habits) : null,
        sleep_habits ? (typeof sleep_habits === 'object' ? JSON.stringify(sleep_habits) : sleep_habits) : null,
        exercise_habits ? (typeof exercise_habits === 'object' ? JSON.stringify(exercise_habits) : exercise_habits) : null
      );
    }

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

    res.json({
      code: 0,
      message: '基础信息更新成功',
      data: profile
    });
  } catch (err) {
    console.error('[Health] 更新基础信息失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * POST /api/v1/health/metrics
 * 录入体检指标（血压/血脂/血糖/尿酸/糖化血红蛋白/BMI/腰围）
 */
router.post('/metrics', (req, res) => {
  try {
    const userId = req.user.id;
    const { metrics } = req.body; // [{ metric_type: 'blood_pressure', value: {...}, record_date: '...' }]

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ code: 400, message: '请提供体检指标数据', data: null });
    }

    // 支持的指标类型
    const validTypes = [
      'blood_pressure', 'blood_sugar', 'blood_lipid',
      'uric_acid', 'hba1c', 'bmi', 'waist'
    ];

    const insert = db.prepare(
      'INSERT INTO health_metrics (user_id, metric_type, value, record_date) VALUES (?, ?, ?, ?)'
    );

    const results = [];
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        if (!item.metric_type || !item.value) {
          continue;
        }
        // 校验指标类型
        if (!validTypes.includes(item.metric_type)) {
          results.push({ metric_type: item.metric_type, error: '不支持的指标类型' });
          continue;
        }

        // 自动计算BMI
        let value = item.value;
        if (item.metric_type === 'bmi' && typeof value === 'object' && value.height && value.weight) {
          const heightM = value.height / 100;
          value = {
            ...value,
            value: Math.round((value.weight / (heightM * heightM)) * 10) / 10
          };
        }

        const result = insert.run(
          userId,
          item.metric_type,
          typeof value === 'object' ? JSON.stringify(value) : value,
          item.record_date || new Date().toISOString().split('T')[0]
        );
        results.push({ id: result.lastInsertRowid, metric_type: item.metric_type });
      }
    });

    insertMany(metrics);

    res.status(201).json({
      code: 0,
      message: '体检指标录入成功',
      data: { count: results.filter(r => !r.error).length, items: results }
    });
  } catch (err) {
    console.error('[Health] 录入体检指标失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/health/summary
 * 获取健康画像汇总
 */
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id;

    // 获取基础档案
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

    // 获取所有体检指标（按类型分组）
    const allMetrics = db.prepare(
      'SELECT * FROM health_metrics WHERE user_id = ? ORDER BY id DESC'
    ).all(userId);

    // 按类型分组
    const metricsByType = {};
    for (const m of allMetrics) {
      if (!metricsByType[m.metric_type]) {
        metricsByType[m.metric_type] = [];
      }
      metricsByType[m.metric_type].push({
        id: m.id,
        value: (function(v) { try { return typeof v === 'string' ? JSON.parse(v) : v } catch(e) { return v } })(m.value),
        record_date: m.record_date,
        created_at: m.created_at
      });
    }

    // 获取疾病记录
    const diseases = db.prepare('SELECT * FROM diseases WHERE user_id = ?').all(userId);

    // 计算BMI
    let bmi = null;
    let bmiLabel = null;
    if (profile && profile.height && profile.weight) {
      const heightM = profile.height / 100;
      bmi = Math.round((profile.weight / (heightM * heightM)) * 10) / 10;
      if (bmi < 18.5) bmiLabel = '偏瘦';
      else if (bmi < 24) bmiLabel = '正常';
      else if (bmi < 28) bmiLabel = '偏胖';
      else bmiLabel = '肥胖';
    }

    // 健康风险评估（简化版）
    const risks = [];
    if (bmi !== null) {
      if (bmi >= 28) risks.push('体重超标，建议控制饮食并增加运动');
      else if (bmi >= 24) risks.push('体重偏高，注意饮食平衡');
      else if (bmi < 18.5) risks.push('体重偏低，建议增加营养摄入');
    }

    // 检查血压（兼容对象格式和字符串格式）
    const bpMetrics = metricsByType['blood_pressure'] || [];
    if (bpMetrics.length > 0) {
      const latestBP = bpMetrics[0].value;
      let systolic = null, diastolic = null;
      if (typeof latestBP === 'string' && latestBP.includes('/')) {
        const parts = latestBP.split('/');
        systolic = parseFloat(parts[0]);
        diastolic = parseFloat(parts[1]);
      } else if (typeof latestBP === 'object' && latestBP !== null) {
        systolic = latestBP.systolic;
        diastolic = latestBP.diastolic;
      }
      if (systolic >= 140 || diastolic >= 90) {
        risks.push('血压偏高，建议低盐饮食并定期监测');
      } else if (systolic >= 130 || diastolic >= 85) {
        risks.push('血压处于正常高值，建议预防性控制');
      }
    }

    // 检查血糖（兼容对象格式和字符串格式）
    const bsMetrics = metricsByType['blood_sugar'] || [];
    if (bsMetrics.length > 0) {
      const latestBS = bsMetrics[0].value;
      let fasting = null;
      if (typeof latestBS === 'string') {
        fasting = parseFloat(latestBS);
      } else if (typeof latestBS === 'object' && latestBS !== null) {
        fasting = latestBS.fasting;
      }
      if (fasting >= 7.0) {
        risks.push('空腹血糖偏高，建议就医检查');
      } else if (fasting >= 6.1) {
        risks.push('空腹血糖偏高，建议控制碳水化合物摄入');
      }
    }

    // 检查血脂
    const blMetrics = metricsByType['blood_lipid'] || [];
    if (blMetrics.length > 0) {
      const latestBL = blMetrics[0].value;
      if (latestBL.total_cholesterol >= 5.2) {
        risks.push('总胆固醇偏高，建议减少高脂肪食物摄入');
      }
      if (latestBL.ldl >= 3.4) {
        risks.push('低密度脂蛋白偏高，注意心血管风险');
      }
      if (latestBL.triglycerides >= 1.7) {
        risks.push('甘油三酯偏高，建议控制油脂和糖分摄入');
      }
      if (latestBL.hdl < 1.0) {
        risks.push('高密度脂蛋白偏低，建议增加有氧运动');
      }
    }

    // 检查尿酸
    const uaMetrics = metricsByType['uric_acid'] || [];
    if (uaMetrics.length > 0) {
      const latestUA = uaMetrics[0].value;
      const uaValue = typeof latestUA === 'object' ? latestUA.value : latestUA;
      if (uaValue > 420) {
        risks.push('尿酸偏高，建议减少高嘌呤食物摄入，多喝水');
      }
    }

    // 检查糖化血红蛋白
    const hbaMetrics = metricsByType['hba1c'] || [];
    if (hbaMetrics.length > 0) {
      const latestHbA = hbaMetrics[0].value;
      const hbaValue = typeof latestHbA === 'object' ? latestHbA.value : latestHbA;
      if (hbaValue >= 6.5) {
        risks.push('糖化血红蛋白偏高，提示近3个月血糖控制不佳');
      } else if (hbaValue >= 5.7) {
        risks.push('糖化血红蛋白处于糖尿病前期范围，建议预防');
      }
    }

    // 检查腰围
    const waistMetrics = metricsByType['waist'] || [];
    if (waistMetrics.length > 0) {
      const latestWaist = waistMetrics[0].value;
      const waistValue = typeof latestWaist === 'object' ? latestWaist.value : latestWaist;
      const isMale = profile && profile.gender === 'male';
      if ((isMale && waistValue >= 90) || (!isMale && waistValue >= 85)) {
        risks.push('腰围超标，提示腹型肥胖风险');
      }
    }

    // 构建兼容前端的扁平字段（兼容对象格式和字符串格式）
    const rawBP = (metricsByType['blood_pressure'] && metricsByType['blood_pressure'].length > 0)
      ? metricsByType['blood_pressure'][0].value : null;
    const rawBS = (metricsByType['blood_sugar'] && metricsByType['blood_sugar'].length > 0)
      ? metricsByType['blood_sugar'][0].value : null;

    let bloodPressureStr = null;
    if (rawBP) {
      if (typeof rawBP === 'string' && rawBP.includes('/')) {
        bloodPressureStr = rawBP;
      } else if (typeof rawBP === 'object' && rawBP !== null) {
        bloodPressureStr = `${rawBP.systolic || '--'}/${rawBP.diastolic || '--'}`;
      }
    }

    let bloodSugarStr = null;
    if (rawBS) {
      if (typeof rawBS === 'string') {
        bloodSugarStr = rawBS + ' mmol/L';
      } else if (typeof rawBS === 'object' && rawBS !== null) {
        bloodSugarStr = (rawBS.fasting || '--') + ' mmol/L';
      }
    }

    res.json({
      code: 0,
      message: 'ok',
      data: {
        profile: profile || null,
        // 兼容前端dashboard的扁平字段
        bmi: bmi,
        bmiLabel: bmiLabel,
        bloodPressure: bloodPressureStr,
        bloodSugar: bloodSugarStr,
        // 完整数据（供其他页面使用）
        bmiDetail: bmi !== null ? { value: bmi, label: bmiLabel } : null,
        metrics: metricsByType,
        diseases,
        risks,
        risk_level: risks.length === 0 ? 'low' : risks.length <= 2 ? 'medium' : 'high'
      }
    });
  } catch (err) {
    console.error('[Health] 获取健康画像失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
