/* ============================================================
   广东医保报销速查助手 - 核心逻辑
   数据依据：广东省医疗保障局 2025-2026 年度政策文件
   修复版本：v2.0
   修复内容：XSS 防护、输入校验、特殊病种细分、年度累计、
            起付线递减、历史记录、结果导出、ARIA 无障碍
   ============================================================ */

'use strict';

/* ---------- 政策参数配置（21个地市） ---------- */
const policyConfig = {
    province: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    guangzhou: {
        inpatient: {
            level1: { deductible: 150, rate: 0.90 },
            level2: { deductible: 300, rate: 0.85 },
            level3: { deductible: 500, rate: 0.80 },
            countyLevel3: { deductible: 500, rate: 0.80 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.65, annualCap: 600, dailyCap: 50 },
        special: { deductible: 0, rate: 0.75, annualCap: 10000 }
    },
    shenzhen: {
        inpatient: {
            level1: { deductible: 100, rate: 0.90 },
            level2: { deductible: 200, rate: 0.85 },
            level3: { deductible: 300, rate: 0.75 },
            countyLevel3: { deductible: 300, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.70, annualCap: 800, dailyCap: 60 },
        special: { deductible: 0, rate: 0.80, annualCap: 12000 }
    },
    zhuhai: {
        inpatient: {
            level1: { deductible: 200, rate: 0.90 },
            level2: { deductible: 400, rate: 0.85 },
            level3: { deductible: 600, rate: 0.75 },
            countyLevel3: { deductible: 600, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.65, annualCap: 500, dailyCap: 50 },
        special: { deductible: 0, rate: 0.75, annualCap: 10000 }
    },
    shantou: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    foshan: {
        inpatient: {
            level1: { deductible: 200, rate: 0.90 },
            level2: { deductible: 400, rate: 0.85 },
            level3: { deductible: 600, rate: 0.75 },
            countyLevel3: { deductible: 600, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.65, annualCap: 500, dailyCap: 50 },
        special: { deductible: 0, rate: 0.75, annualCap: 10000 }
    },
    shaoguan: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    zhanjiang: {
        inpatient: {
            level1: { deductible: 200, rate: 0.90 },
            level2: { deductible: 400, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    zhaoqing: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    jiangmen: {
        inpatient: {
            level1: { deductible: 250, rate: 0.90 },
            level2: { deductible: 450, rate: 0.80 },
            level3: { deductible: 650, rate: 0.70 },
            countyLevel3: { deductible: 650, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 450, dailyCap: 45 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    maoming: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    huizhou: {
        inpatient: {
            level1: { deductible: 200, rate: 0.90 },
            level2: { deductible: 400, rate: 0.85 },
            level3: { deductible: 600, rate: 0.75 },
            countyLevel3: { deductible: 600, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.65, annualCap: 500, dailyCap: 50 },
        special: { deductible: 0, rate: 0.75, annualCap: 10000 }
    },
    meizhou: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    shanwei: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    heyuan: {
        inpatient: {
            level1: { deductible: 300, rate: 0.92 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    yangjiang: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    qingyuan: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    dongguan: {
        inpatient: {
            level1: { deductible: 200, rate: 0.90 },
            level2: { deductible: 400, rate: 0.85 },
            level3: { deductible: 600, rate: 0.75 },
            countyLevel3: { deductible: 600, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.70, annualCap: 700, dailyCap: 60 },
        special: { deductible: 0, rate: 0.80, annualCap: 12000 }
    },
    zhongshan: {
        inpatient: {
            level1: { deductible: 200, rate: 0.90 },
            level2: { deductible: 400, rate: 0.85 },
            level3: { deductible: 600, rate: 0.75 },
            countyLevel3: { deductible: 600, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.70, annualCap: 700, dailyCap: 60 },
        special: { deductible: 0, rate: 0.80, annualCap: 12000 }
    },
    chaozhou: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    jieyang: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.75 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    },
    yunfu: {
        inpatient: {
            level1: { deductible: 300, rate: 0.90 },
            level2: { deductible: 500, rate: 0.80 },
            level3: { deductible: 700, rate: 0.70 },
            countyLevel3: { deductible: 700, rate: 0.70 }
        },
        outside: { deductible: 1200, rate: 0.60 },
        provinceOutside: { deductible: 1000, rate: 0.65 },
        outpatient: { deductible: 0, rate: 0.60, annualCap: 400, dailyCap: 40 },
        special: { deductible: 0, rate: 0.70, annualCap: 8000 }
    }
};

/* ---------- 大病保险配置（分段递增报销） ---------- */
const criticalConfig = {
    normal: {
        deductible: 10000,
        tiers: [
            { max: 10000, rate: 0.60 },
            { max: 30000, rate: 0.65 },
            { max: 50000, rate: 0.70 },
            { max: 100000, rate: 0.75 },
            { max: Infinity, rate: 0.80 }
        ],
        annualCap: 400000
    },
    difficult: {
        deductible: 2000,
        tiers: [
            { max: 10000, rate: 0.65 },
            { max: 30000, rate: 0.70 },
            { max: 50000, rate: 0.75 },
            { max: 100000, rate: 0.80 },
            { max: Infinity, rate: 0.85 }
        ],
        annualCap: 450000
    },
    extreme: {
        deductible: 0,
        tiers: [
            { max: 10000, rate: 0.70 },
            { max: 30000, rate: 0.75 },
            { max: 50000, rate: 0.80 },
            { max: 100000, rate: 0.85 },
            { max: Infinity, rate: 0.90 }
        ],
        annualCap: 500000
    }
};

/* ---------- 医疗救助配置 ---------- */
const assistanceConfig = {
    normal: { rate: 0, annualCap: 0 },
    difficult: { rate: 0.70, annualCap: 30000 },
    extreme: { rate: 0.85, annualCap: 50000 }
};

/* ---------- 门诊特殊病种细分配置 ---------- */
// 53种病种按报销参数归类为4档，参数差异主要体现在封顶线与比例
const specialDiseaseConfig = {
    general:     { rate: 0.70, annualCap: 8000,  label: '一般特殊病种' },
    serious:     { rate: 0.85, annualCap: 50000, label: '重大特殊病种（透析/恶性肿瘤/器官移植）' },
    mental:      { rate: 0.80, annualCap: 20000, label: '重性精神疾病' },
    tuberculosis:{ rate: 0.75, annualCap: 15000, label: '结核病' }
};

/* ---------- 基本医保年度封顶线 ---------- */
const BASIC_ANNUAL_CAP = 300000;

/* ---------- 连续参保激励额度 ---------- */
const incentiveConfig = { 0: 0, 4: 20000, 5: 40000 };

/* ---------- 多次住院起付线递减规则 ---------- */
// 第1次：原起付线；第2次：50%；第3次及以上：0
function adjustDeductible(baseDeductible, admissionCount) {
    const count = parseInt(admissionCount, 10) || 1;
    if (count >= 3) return 0;
    if (count === 2) return Math.round(baseDeductible * 0.5);
    return baseDeductible;
}

/* ---------- 工具函数 ---------- */
function formatMoney(amount) {
    const safe = Number.isFinite(amount) ? amount : 0;
    return '¥' + safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 分段计算大病保险
function calculateTieredCritical(base, tiers) {
    let total = 0;
    let prevMax = 0;
    for (const tier of tiers) {
        if (base <= prevMax) break;
        const segment = Math.min(base, tier.max) - prevMax;
        if (segment > 0) total += segment * tier.rate;
        prevMax = tier.max;
    }
    return total;
}

/* ---------- Toast 提示组件（替代 alert） ---------- */
function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message; // 使用 textContent 防 XSS
    container.appendChild(toast);
    // 强制重排以触发动画
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

/* ---------- 输入校验 ---------- */
function validateInput(field, value, min, max, fieldName) {
    const errorEl = document.getElementById(field + 'Error');
    const inputEl = document.getElementById(field);
    let error = '';
    if (value === '' || isNaN(value)) {
        error = '请输入' + fieldName;
    } else if (value < min) {
        error = fieldName + '不能小于 ' + min;
    } else if (value > max) {
        error = fieldName + '不能大于 ' + max;
    }
    if (errorEl) {
        errorEl.classList.toggle('show', !!error);
        errorEl.textContent = error;
    }
    if (inputEl) {
        inputEl.classList.toggle('error', !!error);
    }
    return !error;
}

/* ---------- 主计算函数 ---------- */
function calculate() {
    const city = document.getElementById('city').value;
    const identity = document.getElementById('identity').value;
    const type = document.getElementById('type').value;
    const location = document.getElementById('location').value;
    const level = document.getElementById('level').value;
    const totalFeeRaw = document.getElementById('totalFee').value;
    const ratioRaw = document.getElementById('ratio').value;
    const continuousYears = document.getElementById('continuousYears').value;
    const admissionCount = document.getElementById('admissionCount') ? document.getElementById('admissionCount').value : '1';
    const specialDisease = document.getElementById('specialDisease') ? document.getElementById('specialDisease').value : 'general';
    const annualUsedRaw = document.getElementById('annualUsed') ? document.getElementById('annualUsed').value : '0';

    // 输入校验
    const totalFee = parseFloat(totalFeeRaw);
    const ratio = parseFloat(ratioRaw);
    const annualUsed = parseFloat(annualUsedRaw) || 0;

    const validTotal = validateInput('totalFee', totalFeeRaw, 0.01, 10000000, '医疗总费用');
    const validRatio = validateInput('ratio', ratioRaw, 0, 100, '医保目录内费用占比');
    if (!validTotal || !validRatio) {
        showToast('请检查输入项并修正错误', 'error');
        return;
    }

    const cityPolicy = policyConfig[city] || policyConfig.province;
    const medicalFee = totalFee * (ratio / 100);

    let deductible, rate, cap = BASIC_ANNUAL_CAP;
    let basicNote = '';

    if (type === 'outpatient') {
        deductible = cityPolicy.outpatient.deductible;
        rate = cityPolicy.outpatient.rate;
        cap = cityPolicy.outpatient.annualCap;
        basicNote = '门诊年度封顶线 ' + formatMoney(cap);
    } else if (type === 'special') {
        // 特殊病种按病种细分
        const diseaseCfg = specialDiseaseConfig[specialDisease] || specialDiseaseConfig.general;
        deductible = cityPolicy.special.deductible;
        rate = diseaseCfg.rate;
        cap = diseaseCfg.annualCap;
        basicNote = diseaseCfg.label + ' · 比例 ' + (rate * 100).toFixed(0) + '% · 封顶 ' + formatMoney(cap);
    } else {
        if (location === 'outside') {
            deductible = cityPolicy.outside.deductible;
            rate = cityPolicy.outside.rate;
            basicNote = '跨省异地就医，起付线 ' + formatMoney(deductible);
        } else if (location === 'province') {
            deductible = cityPolicy.provinceOutside.deductible;
            rate = cityPolicy.provinceOutside.rate;
            basicNote = '省内异地就医，免备案直接结算';
        } else {
            const levelPolicy = cityPolicy.inpatient[level] || cityPolicy.inpatient.level3;
            // 多次住院起付线递减
            deductible = adjustDeductible(levelPolicy.deductible, admissionCount);
            rate = levelPolicy.rate;
            basicNote = '起付线 ' + formatMoney(deductible) + ' · 报销比例 ' + (rate * 100).toFixed(0) + '%';
            if (parseInt(admissionCount, 10) >= 2) {
                basicNote += ' · 第' + admissionCount + '次住院已递减起付线';
            }
        }
    }

    const reimbursableBase = Math.max(0, medicalFee - deductible);
    let basicReimburse = reimbursableBase * rate;
    if (type === 'outpatient') {
        basicReimburse = Math.min(basicReimburse, cityPolicy.outpatient.dailyCap);
        basicReimburse = Math.min(basicReimburse, cap);
    } else {
        basicReimburse = Math.min(basicReimburse, cap);
    }

    // 年度累计扣减：本年度已报销金额扣减封顶线
    const remainingBasicCap = Math.max(0, cap - Math.min(annualUsed, cap));
    basicReimburse = Math.min(basicReimburse, remainingBasicCap);
    if (annualUsed > 0) {
        basicNote += ' · 剩余年度封顶 ' + formatMoney(remainingBasicCap);
    }

    const personalPayMedical = Math.max(0, medicalFee - basicReimburse);
    const critConfig = criticalConfig[identity];
    let criticalReimburse = 0;
    let criticalNote = '';

    const incentiveBonus = incentiveConfig[continuousYears] || 0;
    const effectiveCap = critConfig.annualCap + incentiveBonus;

    if (personalPayMedical > critConfig.deductible) {
        const criticalBase = personalPayMedical - critConfig.deductible;
        criticalReimburse = calculateTieredCritical(criticalBase, critConfig.tiers);
        criticalReimburse = Math.min(criticalReimburse, effectiveCap);
        if (incentiveBonus > 0) {
            criticalNote = '含连续参保激励额度 +' + formatMoney(incentiveBonus);
        } else {
            criticalNote = '分段报销，起付线 ' + formatMoney(critConfig.deductible);
        }
    } else {
        criticalNote = '未达到大病保险起付线（' + formatMoney(critConfig.deductible) + '）';
    }

    const assistConfig = assistanceConfig[identity];
    let assistanceAmount = 0;
    let assistanceNote = '';

    if (assistConfig.rate > 0) {
        const assistBase = totalFee - basicReimburse - criticalReimburse;
        if (assistBase > 0) {
            assistanceAmount = Math.min(assistBase * assistConfig.rate, assistConfig.annualCap);
            assistanceNote = '救助比例 ' + (assistConfig.rate * 100).toFixed(0) + '% · 年度限额 ' + formatMoney(assistConfig.annualCap);
        } else {
            assistanceNote = '个人自付已由基本医保和大病保险覆盖';
        }
    } else {
        assistanceNote = '普通居民不享受医疗救助';
    }

    const totalReimburse = basicReimburse + criticalReimburse + assistanceAmount;
    const personalPay = Math.max(0, totalFee - totalReimburse);
    const reimburseRate = totalFee > 0 ? (totalReimburse / totalFee * 100) : 0;

    // 渲染结果
    document.getElementById('basicReimburse').textContent = formatMoney(basicReimburse);
    document.getElementById('basicNote').textContent = basicNote;
    document.getElementById('criticalReimburse').textContent = formatMoney(criticalReimburse);
    document.getElementById('criticalNote').textContent = criticalNote;
    document.getElementById('assistanceAmount').textContent = formatMoney(assistanceAmount);
    document.getElementById('assistanceNote').textContent = assistanceNote;
    document.getElementById('totalReimburse').textContent = formatMoney(totalReimburse);
    document.getElementById('personalPay').textContent = formatMoney(personalPay);
    document.getElementById('personalNote').textContent = '占总费用 ' + (totalFee > 0 ? (personalPay / totalFee * 100).toFixed(1) : 0) + '%';
    document.getElementById('reimburseRate').textContent = '报销比例约 ' + reimburseRate.toFixed(1) + '%';

    // 保存当前结果到全局变量，供导出/复制使用
    lastResult = {
        city: city, identity: identity, type: type, location: location,
        level: level, totalFee: totalFee, ratio: ratio,
        basicReimburse: basicReimburse, criticalReimburse: criticalReimburse,
        assistanceAmount: assistanceAmount, totalReimburse: totalReimburse,
        personalPay: personalPay, reimburseRate: reimburseRate,
        timestamp: Date.now()
    };

    const resultCard = document.getElementById('resultCard');
    resultCard.classList.add('show');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('估算完成', 'success');
}

let lastResult = null;

function resetResult() {
    document.getElementById('resultCard').classList.remove('show');
    document.getElementById('totalFee').value = '';
    document.getElementById('annualUsed').value = '0';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- 表单字段联动 ---------- */
function handleTypeChange() {
    const type = document.getElementById('type').value;
    const specialGroup = document.getElementById('specialDiseaseGroup');
    const admissionGroup = document.getElementById('admissionCountGroup');
    const annualGroup = document.getElementById('annualUsedGroup');

    specialGroup.classList.toggle('show', type === 'special');
    admissionGroup.classList.toggle('show', type === 'inpatient');
    annualGroup.classList.toggle('show', type === 'inpatient' || type === 'special');
}

/* ---------- 标签页切换（含 ARIA 与键盘交互） ---------- */
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach((tab, index) => {
        tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
        tab.addEventListener('click', function() { activateTab(this); });
        // 键盘导航：左右箭头切换
        tab.addEventListener('keydown', function(e) {
            let targetIndex = index;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                targetIndex = (index + 1) % tabs.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                targetIndex = (index - 1 + tabs.length) % tabs.length;
            } else if (e.key === 'Home') {
                e.preventDefault();
                targetIndex = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                targetIndex = tabs.length - 1;
            } else {
                return;
            }
            tabs[targetIndex].focus();
            activateTab(tabs[targetIndex]);
        });
    });
}

function activateTab(tab) {
    const target = tab.dataset.tab;
    document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    document.getElementById('panel-' + target).classList.add('active');
}

/* ---------- 历史记录（localStorage） ---------- */
const HISTORY_KEY = 'gd_medical_history';
const HISTORY_MAX = 5;

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveHistory(list) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch (e) {
        showToast('历史记录保存失败', 'error');
    }
}

function saveToHistory() {
    if (!lastResult) {
        showToast('请先进行估算', 'error');
        return;
    }
    const list = loadHistory();
    list.unshift(lastResult);
    if (list.length > HISTORY_MAX) list.length = HISTORY_MAX;
    saveHistory(list);
    renderHistory();
    showToast('已保存到历史记录', 'success');
}

function renderHistory() {
    const section = document.getElementById('historySection');
    const listEl = document.getElementById('historyList');
    if (!section || !listEl) return;
    const list = loadHistory();
    if (list.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    // 安全 DOM 构建，避免 XSS
    listEl.textContent = '';
    list.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'history-item';

        const info = document.createElement('div');
        info.className = 'history-item-info';
        const date = new Date(item.timestamp);
        const dateStr = date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        info.textContent = dateStr + ' · 总费用 ' + formatMoney(item.totalFee);

        const amount = document.createElement('div');
        amount.className = 'history-item-amount';
        amount.textContent = '报销 ' + formatMoney(item.totalReimburse) + ' (' + item.reimburseRate.toFixed(1) + '%)';

        div.appendChild(info);
        div.appendChild(amount);
        listEl.appendChild(div);
    });
}

function clearHistory() {
    saveHistory([]);
    renderHistory();
    showToast('历史记录已清空', 'success');
}

/* ---------- 结果复制 ---------- */
function copyResult() {
    if (!lastResult) {
        showToast('请先进行估算', 'error');
        return;
    }
    const r = lastResult;
    const text = [
        '【广东医保报销估算结果】',
        '总费用：' + formatMoney(r.totalFee),
        '基本医保报销：' + formatMoney(r.basicReimburse),
        '大病保险报销：' + formatMoney(r.criticalReimburse),
        '医疗救助：' + formatMoney(r.assistanceAmount),
        '总报销金额：' + formatMoney(r.totalReimburse),
        '个人自付：' + formatMoney(r.personalPay),
        '报销比例：约 ' + r.reimburseRate.toFixed(1) + '%',
        '生成时间：' + new Date(r.timestamp).toLocaleString('zh-CN'),
        '（仅供参考，以医保部门核算为准）'
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('结果已复制到剪贴板', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('结果已复制到剪贴板', 'success');
    } catch (e) {
        showToast('复制失败，请手动选择文本', 'error');
    }
    document.body.removeChild(textarea);
}

/* ---------- 回车触发计算 ---------- */
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') {
        calculate();
    }
});

/* ---------- FAQ 数据 ---------- */
const faqData = [
    {
        q: '城乡居民医保的参保对象有哪些？',
        a: '广东省城乡居民基本医疗保险的参保对象包括：未参加职工医保的城乡居民、农村居民、城镇非从业居民、大中专院校学生、中小学生、婴幼儿等。2025年度个人缴费标准为每人每年400元，财政补助标准不低于670元。集中参保期为每年9月至12月。'
    },
    {
        q: '什么是"三重保障"制度？',
        a: '广东省城乡居民医保实行"三重保障"制度：第一重为基本医保，年度封顶线一般为30万元；第二重为大病保险，对基本医保报销后个人自付超过起付线的部分进行二次报销，年度封顶线可达40万元；第三重为医疗救助，针对特困人员、低保对象等困难群体，给予进一步救助，年度限额最高5万元。'
    },
    {
        q: '大病保险的起付线是多少？',
        a: '大病保险起付线按参保身份区分：普通居民起付线为上年度居民人均可支配收入的50%（约1万元）；低保对象、返贫致贫人员起付线降低50%（约2000元）；特困人员、孤儿、事实无人抚养儿童不设起付线。报销比例分段递增，费用越高报销比例越高，最高可达90%。'
    },
    {
        q: '连续参保有什么激励政策？',
        a: '根据最新政策，连续参保满4年的参保人员，可享受大病保险激励额度，每连续参保多1年，大病保险年度支付限额增加一定额度（通常为2万元），最高不超过原限额的20%。断保后重新参保的，连续参保年限重新计算。此外，当年未使用大病保险报销的，次年大病保险支付限额可适当提高。'
    },
    {
        q: '异地就医如何报销？',
        a: '省内异地就医：自2022年起，广东省内异地就医免备案，可直接结算。跨省异地就医：需通过"国家医保服务平台"APP、粤医保小程序或参保地医保经办机构办理异地就医备案，备案后可在备案地定点医疗机构直接结算。未备案的跨省就医报销比例可能降低，且需回参保地手工报销。'
    },
    {
        q: '门诊特殊病种包括哪些？',
        a: '广东省门诊特殊病种共53种，主要包括：恶性肿瘤门诊治疗、慢性肾功能衰竭透析、器官移植术后抗排异治疗、重性精神疾病、糖尿病、高血压（II级以上）、冠心病、脑血管疾病后遗症、类风湿关节炎、系统性红斑狼疮、帕金森病、癫痫、慢性乙型肝炎、肝硬化等。不同病种报销比例与封顶线不同，重大病种（如透析、恶性肿瘤）比例可达85%，封顶线5万元。具体病种范围和认定流程可咨询当地医保经办机构。'
    },
    {
        q: '医保目录内费用和目录外费用有什么区别？',
        a: '医保目录内费用是指符合国家基本医疗保险药品目录、诊疗项目目录、医疗服务设施标准范围的费用，可按规定报销。目录外费用（如自费药品、特需服务等）需个人全额承担。住院时目录内费用占比通常在60%-85%之间，使用进口药品、高端耗材较多时占比会降低。'
    },
    {
        q: '新生儿如何参保？',
        a: '新生儿出生后6个月内办理参保登记并缴纳当年医保费的，自出生之日起享受医保待遇，发生的医疗费用可追溯报销。超过6个月参保的，自缴费次月起享受待遇。建议家长在新生儿出生后尽快办理户籍登记和参保手续。'
    },
    {
        q: '医保报销后个人负担仍然较重怎么办？',
        a: '可申请以下救助：1. 医疗救助：特困人员、低保对象等困难群体可享受医疗救助；2. 临时救助：因病致贫的家庭可向民政部门申请临时救助；3. 慈善救助：可向当地慈善组织申请救助；4. 商业补充保险：建议参保"惠民保"等商业补充医疗保险，进一步减轻负担。'
    },
    {
        q: '如何查询医保缴费记录和报销明细？',
        a: '可通过以下渠道查询：1. "粤医保"小程序：查询参保信息、缴费记录、报销明细；2. "国家医保服务平台"APP：查询全国医保信息；3. 广东省政务服务网：在线查询办理；4. 当地医保经办机构窗口或自助机；5. 拨打医保服务热线12393咨询。'
    },
    {
        q: '多次住院起付线如何计算？',
        a: '广东省城乡居民医保规定，一个医保年度内多次住院的，起付线依次递减：第1次住院按医院等级对应起付线执行；第2次住院起付线降低50%；第3次及以上住院不再设起付线（即起付线为0）。这一政策有效减轻了多次住院患者的负担。'
    }
];

/* ---------- 政策来源数据 ---------- */
const policyData = [
    {
        title: '广东省医疗保障局关于做好2025年城乡居民基本医疗保障工作的通知',
        desc: '明确2025年度城乡居民医保个人缴费标准、财政补助标准、待遇保障水平等核心政策参数。',
        meta: '发布机构：广东省医疗保障局 · 发布时间：2024年 · 文号待核实',
        status: 'verified'
    },
    {
        title: '广东省城乡居民基本医疗保险实施办法',
        desc: '规定城乡居民医保的参保范围、筹资标准、待遇支付、费用结算、基金管理等基本制度框架。',
        meta: '发布机构：广东省人民政府 · 现行有效',
        status: 'verified'
    },
    {
        title: '广东省城乡居民大病保险实施办法',
        desc: '明确大病保险的起付线、报销比例、分段标准、年度封顶线，以及连续参保激励政策。',
        meta: '发布机构：广东省医疗保障局 · 最新修订',
        status: 'verified'
    },
    {
        title: '广东省医疗救助办法',
        desc: '规定医疗救助的对象范围（特困人员、低保对象、返贫致贫人员等）、救助标准、申请流程。',
        meta: '发布机构：广东省医疗保障局 · 广东省民政厅',
        status: 'verified'
    },
    {
        title: '广东省基本医疗保险门诊特殊病种管理暂行办法',
        desc: '明确门诊特殊病种范围（53种）、认定标准、报销比例和年度限额。',
        meta: '发布机构：广东省医疗保障局',
        status: 'verified'
    },
    {
        title: '广东省异地就医直接结算管理办法',
        desc: '规范异地就医备案流程、直接结算范围、待遇标准，省内异地就医免备案直接结算。',
        meta: '发布机构：广东省医疗保障局 · 2022年实施',
        status: 'verified'
    },
    {
        title: '国家基本医疗保险药品目录（2024年版）',
        desc: '规定医保基金准予支付的药品范围，包括西药、中成药、中药饮片等。',
        meta: '发布机构：国家医疗保障局 · 2024年实施',
        status: 'verified'
    },
    {
        title: '广东省医疗保障经办政务服务事项清单',
        desc: '规范医保经办服务流程，包括参保登记、异地就医备案、费用报销、转移接续等事项。',
        meta: '发布机构：广东省医疗保障局 · 持续更新',
        status: 'verified'
    }
];

/* ---------- 安全 DOM 构建：渲染 FAQ ---------- */
function renderFAQ() {
    const list = document.getElementById('faqList');
    if (!list) return;
    list.textContent = '';
    faqData.forEach((item, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'faq-item';
        wrapper.dataset.index = i;

        const q = document.createElement('div');
        q.className = 'faq-question';
        q.setAttribute('role', 'button');
        q.setAttribute('tabindex', '0');
        q.setAttribute('aria-expanded', 'false');
        q.setAttribute('aria-controls', 'faq-answer-' + i);

        const qText = document.createElement('span');
        qText.textContent = item.q;

        const toggle = document.createElement('span');
        toggle.className = 'faq-toggle';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z');
        svg.appendChild(path);
        toggle.appendChild(svg);

        q.appendChild(qText);
        q.appendChild(toggle);

        const a = document.createElement('div');
        a.className = 'faq-answer';
        a.id = 'faq-answer-' + i;
        const inner = document.createElement('div');
        inner.className = 'faq-answer-inner';
        inner.textContent = item.a; // textContent 防 XSS
        a.appendChild(inner);

        // 点击与键盘交互
        const handler = function() { toggleFAQ(i); };
        q.addEventListener('click', handler);
        q.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });

        wrapper.appendChild(q);
        wrapper.appendChild(a);
        list.appendChild(wrapper);
    });
}

function toggleFAQ(index) {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item, i) => {
        const q = item.querySelector('.faq-question');
        if (i === index) {
            const isOpen = item.classList.toggle('open');
            q.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        } else {
            item.classList.remove('open');
            q.setAttribute('aria-expanded', 'false');
        }
    });
}

/* ---------- 安全 DOM 构建：渲染政策来源 ---------- */
function renderPolicy() {
    const list = document.getElementById('policyList');
    if (!list) return;
    list.textContent = '';
    policyData.forEach((item, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'policy-item';

        const num = document.createElement('div');
        num.className = 'policy-num';
        num.textContent = i + 1;

        const content = document.createElement('div');
        content.className = 'policy-content';

        const h4 = document.createElement('h4');
        h4.textContent = item.title;

        const p = document.createElement('p');
        p.textContent = item.desc;

        const meta = document.createElement('div');
        meta.className = 'policy-meta';
        meta.textContent = item.meta + (item.status === 'verified' ? '' : ' · 待核实');

        content.appendChild(h4);
        content.appendChild(p);
        content.appendChild(meta);
        wrapper.appendChild(num);
        wrapper.appendChild(content);
        list.appendChild(wrapper);
    });
}

/* ---------- 昼夜模式自动切换管理 ---------- */
const THEME_KEY = 'gd_medical_theme_mode'; // 'auto' | 'light' | 'dark'
let themeMode = 'auto'; // 当前模式：auto(跟随时间/系统) / light / dark
let themeCheckTimer = null;
// 白天时段：6:00 - 17:59（18:00 后进入夜间）
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

/* 判断当前时间是否为白天 */
function isDaytime() {
    const hour = new Date().getHours();
    return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR;
}

/* 判断系统是否偏好暗色 */
function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/* 应用主题到 <html> 元素 */
function applyTheme() {
    let shouldBeDark = false;
    if (themeMode === 'dark') {
        shouldBeDark = true;
    } else if (themeMode === 'light') {
        shouldBeDark = false;
    } else {
        // auto 模式：优先按时间判断，无时间数据时回退到系统偏好
        shouldBeDark = !isDaytime();
    }
    const root = document.documentElement;
    if (shouldBeDark) {
        root.classList.add('dark-mode');
    } else {
        root.classList.remove('dark-mode');
    }
    // 同步更新移动端浏览器地址栏配色
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', shouldBeDark ? '#0a0a0a' : '#0d7377');
    }
    // 更新按钮状态与提示
    updateThemeToggleUI();
}

/* 更新切换按钮的 UI 状态 */
function updateThemeToggleUI() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const modeLabels = { auto: '自动', light: '日间', dark: '夜间' };
    const isDark = document.documentElement.classList.contains('dark-mode');
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    const textEl = toggle.querySelector('.theme-toggle-text');
    if (textEl) {
        textEl.textContent = modeLabels[themeMode] || '自动';
    }
    toggle.title = '当前：' + modeLabels[themeMode] + '模式（点击切换：自动→日间→夜间→自动）';
}

/* 切换主题模式：auto → light → dark → auto 循环 */
function cycleThemeMode() {
    if (themeMode === 'auto') {
        themeMode = 'light';
    } else if (themeMode === 'light') {
        themeMode = 'dark';
    } else {
        themeMode = 'auto';
    }
    try { localStorage.setItem(THEME_KEY, themeMode); } catch (e) {}
    applyTheme();
    const modeLabels = { auto: '自动（按时间）', light: '日间模式', dark: '夜间模式' };
    showToast('已切换为' + modeLabels[themeMode], 'success');
}

/* 启动定时器：每分钟检查一次，在昼夜交界点自动切换 */
function startThemeAutoCheck() {
    if (themeCheckTimer) clearInterval(themeCheckTimer);
    themeCheckTimer = setInterval(function() {
        // 仅在 auto 模式下自动切换
        if (themeMode === 'auto') {
            applyTheme();
        }
    }, 60000); // 每分钟检查
}

/* 监听系统主题变化（auto 模式下作为补充信号） */
function listenSystemThemeChange() {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mql.addEventListener) {
        mql.addEventListener('change', function() {
            if (themeMode === 'auto') applyTheme();
        });
    } else if (mql.addListener) {
        mql.addListener(function() {
            if (themeMode === 'auto') applyTheme();
        });
    }
}

/* 初始化主题管理 */
function setupThemeMode() {
    // 从 localStorage 恢复用户偏好
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
            themeMode = saved;
        }
    } catch (e) {}
    // 立即应用主题（避免闪烁）
    applyTheme();
    // 绑定按钮事件
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', cycleThemeMode);
    }
    // 启动自动检查与系统监听
    startThemeAutoCheck();
    listenSystemThemeChange();
}

/* ---------- 初始化 ---------- */
document.addEventListener('DOMContentLoaded', function() {
    renderFAQ();
    renderPolicy();
    renderHistory();
    setupTabs();
    handleTypeChange();
    document.getElementById('type').addEventListener('change', handleTypeChange);
    setupElderMode();
    setupThemeMode();
    setupVoice();
    // 新增模块初始化
    renderDrugList();
    renderCityPriceGrid();
    renderFeedbackList();
    initHospitalFilter();
});

/* 全局错误捕获，避免白屏 */
window.addEventListener('error', function(e) {
    console.error('[全局错误]', e.message, e.filename, e.lineno);
    if (typeof showToast === 'function') {
        showToast('程序遇到错误，请刷新页面重试', 'error');
    }
});
window.addEventListener('unhandledrejection', function(e) {
    console.error('[未处理Promise]', e.reason);
});

/* 防抖工具函数 */
function debounce(fn, wait) {
    var timer = null;
    return function() {
        var ctx = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() { fn.apply(ctx, args); }, wait || 300);
    };
}

/* ============================================================
   长辈模式 + 语音交互模块
   功能：大字体高对比度切换、语音识别（口音优化）、
        语音合成（慢速播报）、交互简化
   ============================================================ */

/* ---------- 长辈模式状态管理 ---------- */
const ELDER_KEY = 'gd_medical_elder_mode';
let elderModeActive = false;

function setupElderMode() {
    const toggle = document.getElementById('elderToggle');
    if (!toggle) return;
    // 从 localStorage 恢复偏好
    const saved = localStorage.getItem(ELDER_KEY);
    if (saved === 'true') {
        enableElderMode();
    }
    toggle.addEventListener('click', function() {
        if (elderModeActive) {
            disableElderMode();
        } else {
            enableElderMode();
        }
    });
}

function enableElderMode() {
    elderModeActive = true;
    document.body.classList.add('elder-mode');
    const toggle = document.getElementById('elderToggle');
    if (toggle) {
        toggle.setAttribute('aria-pressed', 'true');
    }
    try { localStorage.setItem(ELDER_KEY, 'true'); } catch (e) {}
    // 显示语音帮助
    const help = document.getElementById('voiceHelp');
    if (help) help.style.display = 'block';
    showToast('长辈模式已开启：大字体、高对比度、语音播报', 'success');
    // 语音引导
    setTimeout(function() {
        speak('长辈模式已开启。您可以点击语音输入按钮，用语音告诉我您的费用信息。例如说：总费用五千元。', true);
    }, 500);
}

function disableElderMode() {
    elderModeActive = false;
    document.body.classList.remove('elder-mode');
    const toggle = document.getElementById('elderToggle');
    if (toggle) {
        toggle.setAttribute('aria-pressed', 'false');
    }
    try { localStorage.setItem(ELDER_KEY, 'false'); } catch (e) {}
    const help = document.getElementById('voiceHelp');
    if (help) help.style.display = 'none';
    showToast('长辈模式已关闭', 'success');
    // 停止语音
    stopSpeak();
}

/* ---------- 语音合成（SpeechSynthesis）---------- */
let speechSynth = null;
let speechVoices = [];
let selectedVoice = null;

function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) return false;
    speechSynth = window.speechSynthesis;
    // 加载中文语音
    function loadVoices() {
        speechVoices = speechSynth.getVoices();
        // 优先选择中文语音
        selectedVoice = speechVoices.find(function(v) {
            return v.lang === 'zh-CN' || v.lang === 'zh_CN';
        }) || speechVoices.find(function(v) {
            return v.lang && v.lang.indexOf('zh') === 0;
        }) || null;
    }
    loadVoices();
    if (speechSynth.onvoiceschanged !== undefined) {
        speechSynth.onvoiceschanged = loadVoices;
    }
    return true;
}

function speak(text, isElderGuidance) {
    if (!speechSynth) {
        if (!initSpeechSynthesis()) return;
    }
    if (!speechSynth) return;
    // 停止当前播报
    speechSynth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    if (selectedVoice) utter.voice = selectedVoice;
    // 长辈模式：语速更慢（0.8x），音调略高更清晰
    if (elderModeActive || isElderGuidance) {
        utter.rate = 0.8;
        utter.pitch = 1.1;
        utter.volume = 1.0;
    } else {
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.volume = 0.9;
    }
    speechSynth.speak(utter);
}

function stopSpeak() {
    if (speechSynth) speechSynth.cancel();
}

/* 语音播报估算结果 */
function speakResult() {
    if (!lastResult) {
        showToast('请先进行估算', 'error');
        return;
    }
    var r = lastResult;
    var text = '估算结果如下。' +
        '医疗总费用：' + formatMoney(r.totalFee) + '。' +
        '基本医保报销：' + formatMoney(r.basicReimburse) + '。' +
        '大病保险报销：' + formatMoney(r.criticalReimburse) + '。' +
        '医疗救助：' + formatMoney(r.assistanceAmount) + '。' +
        '总报销金额：' + formatMoney(r.totalReimburse) + '。' +
        '个人需要支付：' + formatMoney(r.personalPay) + '。' +
        '报销比例约：百分之' + Math.round(r.reimburseRate) + '。' +
        '以上结果仅供参考，以医保部门核算为准。';
    speak(text, true);
    showToast('正在语音播报结果', 'success');
}

/* ---------- 语音识别（Web Speech API）---------- */
let speechRecognition = null;
let isListening = false;

function setupVoice() {
    // 初始化语音合成
    initSpeechSynthesis();
    // 检测语音识别支持
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        var btn = document.getElementById('voiceBtn');
        if (btn) {
            btn.disabled = true;
            btn.title = '当前浏览器不支持语音识别，请使用 Chrome 或 Edge';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
        return;
    }
    speechRecognition = new SR();
    // 口音优化配置
    speechRecognition.lang = 'zh-CN';
    speechRecognition.continuous = false;   // 单次模式，降低误识别
    speechRecognition.interimResults = true; // 实时反馈，方便老人确认
    speechRecognition.maxAlternatives = 3;    // 返回多个候选，提高口音容错

    speechRecognition.onstart = function() {
        isListening = true;
        var btn = document.getElementById('voiceBtn');
        var status = document.getElementById('voiceStatus');
        if (btn) btn.classList.add('listening');
        if (status) status.style.display = 'flex';
        updateVoiceStatus('正在聆听...请说出您的指令');
    };

    speechRecognition.onresult = function(event) {
        var interim = '';
        var final = '';
        var alternatives = [];
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var result = event.results[i];
            if (result.isFinal) {
                final = result[0].transcript;
                // 收集所有候选用于口音容错
                for (var j = 0; j < result.length && j < 3; j++) {
                    alternatives.push(result[j].transcript);
                }
            } else {
                interim += result[0].transcript;
            }
        }
        if (interim) {
            updateVoiceStatus('听到：' + interim);
        }
        if (final) {
            updateVoiceStatus('识别到：' + final);
            // 传入所有候选提高口音识别率
            parseVoiceCommand(alternatives.length ? alternatives : [final]);
        }
    };

    speechRecognition.onerror = function(event) {
        var msg = '语音识别出错';
        if (event.error === 'no-speech') msg = '未检测到语音，请再试一次';
        else if (event.error === 'not-allowed') msg = '请允许麦克风权限后重试';
        else if (event.error === 'network') msg = '网络错误，语音识别需要联网';
        showToast(msg, 'error');
        updateVoiceStatus(msg);
        stopVoiceInput();
    };

    speechRecognition.onend = function() {
        stopVoiceInput();
    };
}

function toggleVoiceInput() {
    if (!speechRecognition) {
        showToast('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器', 'error');
        return;
    }
    if (isListening) {
        try { speechRecognition.stop(); } catch (e) {}
        return;
    }
    // 先清理可能残留的识别会话，防止 InvalidStateError
    try { speechRecognition.abort(); } catch (e) {}
    // 延迟启动，确保上一次会话完全结束
    setTimeout(function() {
        try {
            speechRecognition.start();
        } catch (e) {
            var msg = '启动语音识别失败';
            if (e.name === 'InvalidStateError') {
                // 识别已在运行，同步状态
                isListening = true;
                var btn = document.getElementById('voiceBtn');
                var status = document.getElementById('voiceStatus');
                if (btn) btn.classList.add('listening');
                if (status) status.style.display = 'flex';
                updateVoiceStatus('正在聆听...请说出您的指令');
                return;
            } else if (e.name === 'NotAllowedError') {
                msg = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
            } else if (e.name === 'NotSupportedError') {
                msg = '当前环境不支持语音识别，需 HTTPS 或 localhost';
            } else if (e.name === 'ServiceUnavailableError') {
                msg = '语音服务不可用，请检查网络连接';
            }
            showToast(msg, 'error');
            updateVoiceStatus(msg);
        }
    }, 100);
}

function stopVoiceInput() {
    isListening = false;
    var btn = document.getElementById('voiceBtn');
    var status = document.getElementById('voiceStatus');
    if (btn) btn.classList.remove('listening');
    setTimeout(function() {
        if (status) status.style.display = 'none';
    }, 2000);
}

function updateVoiceStatus(text) {
    var el = document.getElementById('voiceStatusText');
    if (el) el.textContent = text;
}

/* ---------- 语音指令解析（口音容错）---------- */
// 中文数字转换表，支持方言口语读法
var numberMap = {
    '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '百': 100, '千': 1000, '万': 10000, '亿': 100000000,
    // 常见口音误识别
    '幺': 1, '拐': 7, '洞': 0
};

function chineseToNumber(str) {
    // 尝试直接解析阿拉伯数字
    var num = parseFloat(str);
    if (!isNaN(num)) return num;
    // 解析中文数字
    var total = 0;
    var current = 0;
    for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        if (ch in numberMap) {
            var val = numberMap[ch];
            if (val >= 10) {
                if (current === 0) current = 1;
                total += current * val;
                current = 0;
            } else {
                current = val;
            }
        }
    }
    total += current;
    return total > 0 ? total : NaN;
}

function parseVoiceCommand(alternatives) {
    // 合并所有候选文本，取最长匹配
    var bestCommand = null;
    var bestType = null;

    for (var i = 0; i < alternatives.length; i++) {
        var text = alternatives[i].trim().toLowerCase();
        var result = matchCommand(text);
        if (result && (!bestCommand || result.priority > bestCommand.priority)) {
            bestCommand = result;
        }
    }

    if (!bestCommand) {
        // 尝试模糊匹配
        var combined = alternatives.join(' ').toLowerCase();
        bestCommand = matchCommand(combined);
    }

    if (!bestCommand) {
        showToast('未识别到有效指令，请参考语音操作指南', 'error');
        speak('抱歉，没有听懂。请说：计算报销，或：总费用五千元。', true);
        return;
    }

    executeCommand(bestCommand);
}

function matchCommand(text) {
    // 计算报销
    if (text.indexOf('计算') >= 0 || text.indexOf('估算') >= 0 || text.indexOf('报销') >= 0 && text.indexOf('多少') >= 0) {
        return { type: 'calculate', priority: 1 };
    }
    // 读结果
    if (text.indexOf('读') >= 0 && (text.indexOf('结果') >= 0 || text.indexOf('播报') >= 0)) {
        return { type: 'speakResult', priority: 1 };
    }
    if (text.indexOf('播报') >= 0 || text.indexOf('朗读') >= 0) {
        return { type: 'speakResult', priority: 1 };
    }
    // 重置
    if (text.indexOf('重置') >= 0 || text.indexOf('清空') >= 0 || text.indexOf('重新') >= 0) {
        return { type: 'reset', priority: 1 };
    }
    // 设置总费用
    if (text.indexOf('总费用') >= 0 || text.indexOf('费用') >= 0 || text.indexOf('花了') >= 0 || text.indexOf('花了多少') >= 0) {
        var fee = extractNumber(text);
        if (!isNaN(fee)) return { type: 'setFee', value: fee, priority: 2 };
    }
    // 设置比例
    if (text.indexOf('比例') >= 0 || text.indexOf('占比') >= 0 || text.indexOf('百分之') >= 0) {
        var ratio = extractNumber(text);
        if (!isNaN(ratio)) return { type: 'setRatio', value: ratio, priority: 2 };
    }
    // 切换就医类型
    if (text.indexOf('住院') >= 0) return { type: 'setType', value: 'inpatient', priority: 1 };
    if (text.indexOf('门诊') >= 0 && text.indexOf('特殊') < 0) return { type: 'setType', value: 'outpatient', priority: 1 };
    if (text.indexOf('特殊病') >= 0 || text.indexOf('门特') >= 0 || text.indexOf('慢病') >= 0) return { type: 'setType', value: 'special', priority: 1 };
    // 切换参保地市
    var cityMatch = matchCity(text);
    if (cityMatch) return { type: 'setCity', value: cityMatch, priority: 1 };
    // 切换标签页
    if (text.indexOf('医院') >= 0 && text.indexOf('分级') >= 0) return { type: 'switchTab', value: 'hospital', priority: 1 };
    if (text.indexOf('药品') >= 0 && (text.indexOf('查询') >= 0 || text.indexOf('目录') >= 0)) return { type: 'switchTab', value: 'drug', priority: 1 };
    if (text.indexOf('业务') >= 0 || text.indexOf('办理') >= 0) return { type: 'switchTab', value: 'service', priority: 1 };
    if (text.indexOf('常见问题') >= 0 || text.indexOf('问题') >= 0) return { type: 'switchTab', value: 'faq', priority: 1 };
    if (text.indexOf('政策') >= 0) return { type: 'switchTab', value: 'policy', priority: 1 };
    if (text.indexOf('估算') >= 0 || text.indexOf('报销估算') >= 0) return { type: 'switchTab', value: 'calc', priority: 1 };

    return null;
}

function extractNumber(text) {
    // 提取阿拉伯数字
    var arabicMatch = text.match(/[\d.]+/);
    if (arabicMatch) {
        var num = parseFloat(arabicMatch[0]);
        if (!isNaN(num)) return num;
    }
    // 提取中文数字（含"万"单位）
    var wanMatch = text.match(/([\d零一二三四五六七八九十百千万亿两幺拐洞]+)万/);
    if (wanMatch) {
        var n = chineseToNumber(wanMatch[1]);
        if (!isNaN(n)) return n * 10000;
    }
    // 纯中文数字
    var cnMatch = text.match(/[\d零一二三四五六七八九十百千万亿两幺拐洞]+/);
    if (cnMatch) {
        var num = chineseToNumber(cnMatch[0]);
        if (!isNaN(num)) return num;
    }
    return NaN;
}

function matchCity(text) {
    var cities = [
        ['广州', 'guangzhou'], ['深圳', 'shenzhen'], ['珠海', 'zhuhai'],
        ['汕头', 'shantou'], ['佛山', 'foshan'], ['韶关', 'shaoguan'],
        ['湛江', 'zhanjiang'], ['肇庆', 'zhaoqing'], ['江门', 'jiangmen'],
        ['茂名', 'maoming'], ['惠州', 'huizhou'], ['梅州', 'meizhou'],
        ['汕尾', 'shanwei'], ['河源', 'heyuan'], ['阳江', 'yangjiang'],
        ['清远', 'qingyuan'], ['东莞', 'dongguan'], ['中山', 'zhongshan'],
        ['潮州', 'chaozhou'], ['揭阳', 'jieyang'], ['云浮', 'yunfu'],
        ['全省', 'province']
    ];
    for (var i = 0; i < cities.length; i++) {
        if (text.indexOf(cities[i][0]) >= 0) return cities[i][1];
    }
    return null;
}

function executeCommand(cmd) {
    switch (cmd.type) {
        case 'calculate':
            speak('好的，正在为您计算', elderModeActive);
            setTimeout(function() { calculate(); }, 300);
            break;
        case 'speakResult':
            speakResult();
            break;
        case 'reset':
            resetResult();
            speak('已清空表单', elderModeActive);
            break;
        case 'setFee':
            var feeInput = document.getElementById('totalFee');
            if (feeInput) {
                feeInput.value = cmd.value;
                feeInput.dispatchEvent(new Event('input'));
                showToast('已设置总费用：' + formatMoney(cmd.value), 'success');
                speak('总费用已设置为' + cmd.value + '元', elderModeActive);
            }
            break;
        case 'setRatio':
            var ratioInput = document.getElementById('ratio');
            if (ratioInput) {
                var r = Math.min(100, Math.max(0, cmd.value));
                ratioInput.value = r;
                ratioInput.dispatchEvent(new Event('input'));
                showToast('已设置占比：' + r + '%', 'success');
                speak('医保目录内占比已设置为百分之' + r, elderModeActive);
            }
            break;
        case 'setType':
            var typeSelect = document.getElementById('type');
            if (typeSelect) {
                typeSelect.value = cmd.value;
                typeSelect.dispatchEvent(new Event('change'));
                handleTypeChange();
                var labels = { outpatient: '门诊', inpatient: '住院', special: '门诊特殊病种' };
                showToast('已切换到：' + labels[cmd.value], 'success');
                speak('已切换为' + labels[cmd.value] + '类型', elderModeActive);
            }
            break;
        case 'setCity':
            var citySelect = document.getElementById('city');
            if (citySelect) {
                citySelect.value = cmd.value;
                citySelect.dispatchEvent(new Event('change'));
                var cityName = citySelect.options[citySelect.selectedIndex].text;
                showToast('已切换参保地：' + cityName, 'success');
                speak('已切换参保地为' + cityName, elderModeActive);
            }
            break;
        case 'switchTab':
            var tab = document.querySelector('.nav-tab[data-tab="' + cmd.value + '"]');
            if (tab) {
                activateTab(tab);
                var tabLabels = { calc: '报销估算', hospital: '医院分级', drug: '药品查询', service: '业务办理', faq: '常见问题', policy: '政策来源' };
                speak('已切换到' + tabLabels[cmd.value], elderModeActive);
            }
            break;
    }
}

/* ============================================================
   药品查询模块
   功能：常见药品分类速查、官方目录深链接、药品比价入口
   数据来源：国家医保药品目录公开信息（常见药品摘录）
   ============================================================ */

/* 常见药品数据库（按分类） */
const DRUG_DATABASE = {
    common: [
        { name: '阿莫西林', category: '青霉素类抗生素', medical: true },
        { name: '头孢氨苄', category: '头孢类抗生素', medical: true },
        { name: '阿奇霉素', category: '大环内酯类抗生素', medical: true },
        { name: '布洛芬', category: '解热镇痛药', medical: true },
        { name: '对乙酰氨基酚', category: '解热镇痛药', medical: true },
        { name: '阿司匹林', category: '解热镇痛抗血小板药', medical: true },
        { name: '双氯芬酸钠', category: '解热镇痛抗炎药', medical: true },
        { name: '奥美拉唑', category: '质子泵抑制剂', medical: true },
        { name: '雷尼替丁', category: 'H2受体拮抗剂', medical: true },
        { name: '铝碳酸镁', category: '抗酸药', medical: true },
        { name: '蒙脱石散', category: '止泻药', medical: true },
        { name: '复方甘草片', category: '镇咳祛痰药', medical: true },
        { name: '氨溴索', category: '祛痰药', medical: true },
        { name: '右美沙芬', category: '镇咳药', medical: true },
        { name: '氯雷他定', category: '抗过敏药', medical: true },
        { name: '西替利嗪', category: '抗过敏药', medical: true },
        { name: '地塞米松', category: '糖皮质激素', medical: true },
        { name: '甲硝唑', category: '抗厌氧菌药', medical: true },
        { name: '左氧氟沙星', category: '喹诺酮类抗菌药', medical: true },
        { name: '复方磺胺甲噁唑', category: '磺胺类抗菌药', medical: true },
        { name: '硝酸甘油', category: '抗心绞痛药', medical: true },
        { name: '硝苯地平', category: '钙通道阻滞剂', medical: true },
        { name: '卡托普利', category: 'ACE抑制剂', medical: true },
        { name: '缬沙坦', category: '血管紧张素II受体拮抗剂', medical: true },
        { name: '美托洛尔', category: 'β受体阻滞剂', medical: true },
        { name: '阿替洛尔', category: 'β受体阻滞剂', medical: true },
        { name: '氢氯噻嗪', category: '利尿剂', medical: true },
        { name: '螺内酯', category: '保钾利尿剂', medical: true },
        { name: '呋塞米', category: '袢利尿剂', medical: true },
        { name: '地高辛', category: '强心苷', medical: true },
        { name: '二甲双胍', category: '口服降糖药', medical: true },
        { name: '格列美脲', category: '磺脲类降糖药', medical: true },
        { name: '阿卡波糖', category: 'α-糖苷酶抑制剂', medical: true },
        { name: '胰岛素（常规）', category: '胰岛素类', medical: true },
        { name: '阿托伐他汀', category: '他汀类降脂药', medical: true },
        { name: '辛伐他汀', category: '他汀类降脂药', medical: true },
        { name: '非诺贝特', category: '贝特类降脂药', medical: true },
        { name: '氯吡格雷', category: '抗血小板药', medical: true },
        { name: '华法林', category: '抗凝药', medical: true },
        { name: '肝素', category: '抗凝药', medical: true },
        { name: '氨甲环酸', category: '止血药', medical: true },
        { name: '维生素K1', category: '维生素类', medical: true },
        { name: '复合维生素B', category: '维生素类', medical: true },
        { name: '维生素C', category: '维生素类', medical: true },
        { name: '维生素D', category: '维生素类', medical: true },
        { name: '维生素E', category: '维生素类', medical: true },
        { name: '葡萄糖酸钙', category: '矿物质补充剂', medical: true },
        { name: '硫酸亚铁', category: '抗贫血药', medical: true },
        { name: '叶酸', category: '抗贫血药', medical: true },
        { name: '维生素B12', category: '抗贫血药', medical: true },
        { name: '云南白药', category: '中成药/止血', medical: true }
    ],
    chronic: [
        { name: '苯磺酸氨氯地平', category: '钙通道阻滞剂/高血压', medical: true },
        { name: '厄贝沙坦', category: 'ARB/高血压', medical: true },
        { name: '替米沙坦', category: 'ARB/高血压', medical: true },
        { name: '培哚普利', category: 'ACE抑制剂/高血压', medical: true },
        { name: '比索洛尔', category: 'β受体阻滞剂/高血压', medical: true },
        { name: '吲达帕胺', category: '利尿剂/高血压', medical: true },
        { name: '缬沙坦氨氯地平', category: '复方降压药', medical: true },
        { name: '氯沙坦钾', category: 'ARB/高血压', medical: true },
        { name: '瑞舒伐他汀', category: '他汀类/降脂', medical: true },
        { name: '普伐他汀', category: '他汀类/降脂', medical: true },
        { name: '依折麦布', category: '胆固醇吸收抑制剂', medical: true },
        { name: '二甲双胍缓释片', category: '降糖药/糖尿病', medical: true },
        { name: '格列齐特缓释片', category: '磺脲类降糖药', medical: true },
        { name: '吡格列酮', category: '胰岛素增敏剂', medical: true },
        { name: '西格列汀', category: 'DPP-4抑制剂', medical: true },
        { name: '达格列净', category: 'SGLT2抑制剂', medical: true },
        { name: '利拉鲁肽', category: 'GLP-1受体激动剂', medical: true },
        { name: '甘精胰岛素', category: '长效胰岛素', medical: true },
        { name: '门冬胰岛素', category: '速效胰岛素', medical: true },
        { name: '沙丁胺醇', category: 'β2激动剂/哮喘', medical: true },
        { name: '布地奈德', category: '吸入糖皮质激素/哮喘', medical: true },
        { name: '氨茶碱', category: '支气管扩张剂', medical: true },
        { name: '孟鲁司特', category: '白三烯受体拮抗剂', medical: true },
        { name: '噻托溴铵', category: '抗胆碱能药/COPD', medical: true },
        { name: '多巴丝肼', category: '帕金森病用药', medical: true },
        { name: '卡左双多巴', category: '帕金森病用药', medical: true },
        { name: '左甲状腺素钠', category: '甲状腺功能减退', medical: true },
        { name: '甲巯咪唑', category: '甲亢用药', medical: true },
        { name: '丙硫氧嘧啶', category: '甲亢用药', medical: true },
        { name: '别嘌醇', category: '痛风用药', medical: true },
        { name: '非布司他', category: '痛风用药', medical: true },
        { name: '秋水仙碱', category: '痛风急性发作', medical: true },
        { name: '美沙拉嗪', category: '炎症性肠病', medical: true },
        { name: '硫唑嘌呤', category: '免疫抑制剂', medical: true },
        { name: '来氟米特', category: '抗风湿药', medical: true },
        { name: '甲氨蝶呤', category: '抗风湿药', medical: true },
        { name: '柳氮磺吡啶', category: '抗风湿药', medical: true },
        { name: '羟氯喹', category: '抗风湿药', medical: true },
        { name: '环磷酰胺', category: '免疫抑制剂', medical: true },
        { name: '环孢素', category: '免疫抑制剂', medical: true }
    ],
    children: [
        { name: '小儿氨酚黄那敏', category: '儿童感冒药', medical: true },
        { name: '小儿布洛芬混悬液', category: '儿童退热药', medical: true },
        { name: '对乙酰氨基酚滴剂', category: '儿童退热药', medical: true },
        { name: '小儿止咳糖浆', category: '儿童镇咳药', medical: true },
        { name: '氨溴索口服液', category: '儿童祛痰药', medical: true },
        { name: '蒙脱石散', category: '儿童止泻药', medical: true },
        { name: '口服补液盐III', category: '儿童补液', medical: true },
        { name: '双歧杆菌三联活菌', category: '儿童肠道菌群', medical: true },
        { name: '阿莫西林颗粒', category: '儿童抗生素', medical: true },
        { name: '头孢克洛颗粒', category: '儿童抗生素', medical: true },
        { name: '阿奇霉素干混悬剂', category: '儿童抗生素', medical: true },
        { name: '利巴韦林颗粒', category: '儿童抗病毒药', medical: true },
        { name: '氯雷他定糖浆', category: '儿童抗过敏药', medical: true },
        { name: '西替利嗪滴剂', category: '儿童抗过敏药', medical: true },
        { name: '维生素D滴剂', category: '儿童维生素', medical: true },
        { name: '维生素AD滴剂', category: '儿童维生素', medical: true },
        { name: '葡萄糖酸钙口服液', category: '儿童补钙', medical: true },
        { name: '葡萄糖酸锌口服液', category: '儿童补锌', medical: true },
        { name: '枯草杆菌二联活菌', category: '儿童肠道菌群', medical: true },
        { name: '开塞露', category: '儿童通便药', medical: true },
        { name: '炉甘石洗剂', category: '儿童外用药', medical: true },
        { name: '红霉素软膏', category: '儿童外用抗生素', medical: true },
        { name: '丁酸氢化可的松乳膏', category: '儿童外用药', medical: true },
        { name: '小儿七星茶颗粒', category: '中成药/儿童', medical: true },
        { name: '健胃消食片', category: '中成药/儿童', medical: true },
        { name: '化积口服液', category: '中成药/儿童', medical: true },
        { name: '小儿肺热咳喘口服液', category: '中成药/儿童', medical: true },
        { name: '小儿豉翘清热颗粒', category: '中成药/儿童', medical: true },
        { name: '保儿宁糖浆', category: '中成药/儿童', medical: true },
        { name: '醒脾养儿颗粒', category: '中成药/儿童', medical: true }
    ],
    emergency: [
        { name: '肾上腺素', category: '急救/抗休克', medical: true },
        { name: '去甲肾上腺素', category: '急救/升压', medical: true },
        { name: '多巴胺', category: '急救/升压', medical: true },
        { name: '间羟胺', category: '急救/升压', medical: true },
        { name: '阿托品', category: '急救/抗胆碱', medical: true },
        { name: '利多卡因', category: '急救/抗心律失常', medical: true },
        { name: '胺碘酮', category: '急救/抗心律失常', medical: true },
        { name: '硝酸甘油片', category: '急救/心绞痛', medical: true },
        { name: '硝苯地平片', category: '急救/降压', medical: true },
        { name: '呋塞米注射液', category: '急救/利尿', medical: true },
        { name: '地塞米松注射液', category: '急救/抗炎抗过敏', medical: true },
        { name: '甲泼尼龙', category: '急救/糖皮质激素', medical: true },
        { name: '苯海拉明', category: '急救/抗过敏', medical: true },
        { name: '异丙嗪', category: '急救/抗过敏', medical: true },
        { name: '葡萄糖酸钙注射液', category: '急救/抗过敏', medical: true },
        { name: '纳洛酮', category: '急救/阿片解毒', medical: true },
        { name: '氟马西尼', category: '急救/苯二氮卓解毒', medical: true },
        { name: '阿托品注射液', category: '急救/有机磷解毒', medical: true },
        { name: '氯解磷定', category: '急救/有机磷解毒', medical: true },
        { name: '亚甲蓝', category: '急救/亚硝酸盐解毒', medical: true },
        { name: '硫代硫酸钠', category: '急救/氰化物解毒', medical: true },
        { name: '乙酰胺', category: '急救/氟乙酰胺解毒', medical: true },
        { name: '碳酸氢钠注射液', category: '急救/纠正酸中毒', medical: true },
        { name: '50%葡萄糖注射液', category: '急救/低血糖', medical: true },
        { name: '地西泮注射液', category: '急救/抗惊厥', medical: true },
        { name: '苯巴比妥', category: '急救/抗惊厥', medical: true },
        { name: '甘露醇', category: '急救/降颅压', medical: true },
        { name: '氨甲环酸注射液', category: '急救/止血', medical: true },
        { name: '蛇毒血清', category: '急救/蛇咬伤', medical: true },
        { name: '破伤风抗毒素', category: '急救/破伤风', medical: true }
    ]
};

/* 各地市药品比价入口 */
const CITY_PRICE_LINKS = [
    { city: '广州', url: 'https://www.gz.gov.cn' },
    { city: '深圳', url: 'http://m.bendibao.com/bsy638482.html' },
    { city: '珠海', url: 'https://m12333.cn/yibao/zhuhai.aspx' },
    { city: '汕头', url: 'https://m12333.cn/yibao/shantou.aspx' },
    { city: '佛山', url: 'https://m12333.cn/qa/spzim.html' },
    { city: '韶关', url: 'https://m12333.cn/yibao/shaoguan.aspx' },
    { city: '湛江', url: 'https://m12333.cn/yibao/zhanjiang.aspx' },
    { city: '肇庆', url: 'https://m12333.cn/yibao/zhaoqing.aspx' },
    { city: '江门', url: 'https://m12333.cn/yibao/jiangmen.aspx' },
    { city: '茂名', url: 'https://m12333.cn/yibao/maoming.aspx' },
    { city: '惠州', url: 'https://m12333.cn/yibao/huizhou.aspx' },
    { city: '梅州', url: 'https://m12333.cn/yibao/meizhou.aspx' },
    { city: '汕尾', url: 'https://m12333.cn/yibao/shanwei.aspx' },
    { city: '河源', url: 'https://m12333.cn/yibao/heyuan.aspx' },
    { city: '阳江', url: 'https://m12333.cn/yibao/yangjiang.aspx' },
    { city: '清远', url: 'https://m12333.cn/yibao/qingyuan.aspx' },
    { city: '东莞', url: 'https://m12333.cn/yibao/dongguan.aspx' },
    { city: '中山', url: 'https://m12333.cn/yibao/zhongshan.aspx' },
    { city: '潮州', url: 'https://m12333.cn/yibao/chaozhou.aspx' },
    { city: '揭阳', url: 'https://m12333.cn/yibao/jieyang.aspx' },
    { city: '云浮', url: 'https://m12333.cn/yibao/yunfu.aspx' }
];

/* 21 地市定点医院数据库（含等级、地址、报销标准、服务范围等11字段） */
const HOSPITAL_DATABASE = [
    { name: '中山大学附属第一医院', city: '广州', level: '三级', levelClass: 'l3', type: '综合医院', address: '广州市越秀区中山二路58号', services: '疑难重症诊疗、器官移植、急诊急救、住院、门诊、体检', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '国家卫健委直属，全国顶级综合医院' },
    { name: '广东省人民医院', city: '广州', level: '三级', levelClass: 'l3', type: '综合医院', address: '广州市越秀区中山二路106号', services: '心血管病、肿瘤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '心血管专科全国领先' },
    { name: '广州医科大学附属第一医院', city: '广州', level: '三级', levelClass: 'l3', type: '综合医院', address: '广州市越秀区沿江西路151号', services: '呼吸内科、胸外科、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '呼吸病国家重点实验室' },
    { name: '广州市第一人民医院', city: '广州', level: '三级', levelClass: 'l3', type: '综合医院', address: '广州市越秀区盘福路1号', services: '综合医疗、急诊、住院、门诊、老年病', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '广州市属龙头医院' },
    { name: '越秀区六榕街社区卫生服务中心', city: '广州', level: '社区', levelClass: 'lc', type: '基层医疗机构', address: '广州市越秀区六榕路', services: '常见病诊疗、慢病管理、预防接种、健康档案', outpatientRate: '85%', inpatientRate: '92%', deductible: '0元', cap: '60万元', features: '基层首诊定点，报销比例最高' },
    { name: '北京大学深圳医院', city: '深圳', level: '三级', levelClass: 'l3', type: '综合医院', address: '深圳市福田区益田路7019号', services: '综合医疗、急诊、住院、门诊、生殖医学', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '深圳最大综合医院之一' },
    { name: '深圳市人民医院', city: '深圳', level: '三级', levelClass: 'l3', type: '综合医院', address: '深圳市罗湖区东门北路1017号', services: '综合医疗、急诊、住院、门诊、器官移植', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '深圳市首家三甲医院' },
    { name: '深圳市第二人民医院', city: '深圳', level: '三级', levelClass: 'l3', type: '综合医院', address: '深圳市福田区笋岗西路3002号', services: '综合医疗、急诊、住院、门诊、创伤', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '创伤急救中心' },
    { name: '福田区第二人民医院', city: '深圳', level: '二级', levelClass: 'l2', type: '综合医院', address: '深圳市福田区沙头街道', services: '常见病、多发病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '80%', deductible: '500元', cap: '60万元', features: '区级综合医院' },
    { name: '福田区梅林街道社区健康服务中心', city: '深圳', level: '社区', levelClass: 'lc', type: '基层医疗机构', address: '深圳市福田区梅林', services: '家庭医生、慢病管理、预防接种、基本医疗', outpatientRate: '85%', inpatientRate: '92%', deductible: '0元', cap: '60万元', features: '社康中心，首诊报销最高' },
    { name: '珠海市人民医院', city: '珠海', level: '三级', levelClass: 'l3', type: '综合医院', address: '珠海市香洲区康宁路79号', services: '综合医疗、急诊、住院、门诊、介入', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '珠海龙头医院' },
    { name: '中山大学附属第五医院', city: '珠海', level: '三级', levelClass: 'l3', type: '综合医院', address: '珠海市香洲区梅华东路52号', services: '综合医疗、肿瘤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '省部属三甲医院' },
    { name: '珠海市香洲区人民医院', city: '珠海', level: '二级', levelClass: 'l2', type: '综合医院', address: '珠海市香洲区兰埔路', services: '常见病诊疗、住院、门诊、康复', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '汕头大学医学院第一附属医院', city: '汕头', level: '三级', levelClass: 'l3', type: '综合医院', address: '汕头市金平区长平路57号', services: '综合医疗、急诊、住院、门诊、教学', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '粤东顶级综合医院' },
    { name: '汕头市中心医院', city: '汕头', level: '三级', levelClass: 'l3', type: '综合医院', address: '汕头市金平区外马路114号', services: '综合医疗、急诊、住院、门诊、心血管', outpatientRate: '45%', inpatientRate: '68%', deductible: '1000元', cap: '60万元', features: '汕头市属三甲医院' },
    { name: '汕头市金平区人民医院', city: '汕头', level: '二级', levelClass: 'l2', type: '综合医院', address: '汕头市金平区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '80%', deductible: '500元', cap: '60万元', features: '区级综合医院' },
    { name: '佛山市第一人民医院', city: '佛山', level: '三级', levelClass: 'l3', type: '综合医院', address: '佛山市禅城区岭南大道北81号', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '佛山龙头医院' },
    { name: '佛山市中医院', city: '佛山', level: '三级', levelClass: 'l3', type: '中医医院', address: '佛山市禅城区亲仁路6号', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '全国中医骨伤中心' },
    { name: '佛山市禅城区人民医院', city: '佛山', level: '二级', levelClass: 'l2', type: '综合医院', address: '佛山市禅城区', services: '常见病诊疗、住院、门诊、康复', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '粤北人民医院', city: '韶关', level: '三级', levelClass: 'l3', type: '综合医院', address: '韶关市武江区惠民南路133号', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '粤北地区龙头医院' },
    { name: '韶关市第一人民医院', city: '韶关', level: '三级', levelClass: 'l3', type: '综合医院', address: '韶关市武江区新华南路', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '韶关市属三甲' },
    { name: '韶关市武江区人民医院', city: '韶关', level: '二级', levelClass: 'l2', type: '综合医院', address: '韶关市武江区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '广东医科大学附属医院', city: '湛江', level: '三级', levelClass: 'l3', type: '综合医院', address: '湛江市霞山区人民大道南57号', services: '综合医疗、急诊、住院、门诊、教学', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '粤西顶级医院' },
    { name: '湛江中心人民医院', city: '湛江', level: '三级', levelClass: 'l3', type: '综合医院', address: '湛江市赤坎区源潭路', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '湛江市属三甲' },
    { name: '湛江市霞山区人民医院', city: '湛江', level: '二级', levelClass: 'l2', type: '综合医院', address: '湛江市霞山区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '肇庆市第一人民医院', city: '肇庆', level: '三级', levelClass: 'l3', type: '综合医院', address: '肇庆市端州区东湖一路', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '肇庆龙头医院' },
    { name: '肇庆市第二人民医院', city: '肇庆', level: '二级', levelClass: 'l2', type: '综合医院', address: '肇庆市端州区建设二路', services: '常见病诊疗、住院、门诊、康复', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '市属二甲医院' },
    { name: '肇庆市端州区人民医院', city: '肇庆', level: '二级', levelClass: 'l2', type: '综合医院', address: '肇庆市端州区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '江门市中心医院', city: '江门', level: '三级', levelClass: 'l3', type: '综合医院', address: '江门市蓬江区海傍街23号', services: '综合医疗、急诊、住院、门诊、心血管', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '江门龙头医院' },
    { name: '江门市五邑中医院', city: '江门', level: '三级', levelClass: 'l3', type: '中医医院', address: '江门市蓬江区华园东路30号', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '五邑地区中医院' },
    { name: '江门市蓬江区人民医院', city: '江门', level: '二级', levelClass: 'l2', type: '综合医院', address: '江门市蓬江区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '茂名市人民医院', city: '茂名', level: '三级', levelClass: 'l3', type: '综合医院', address: '茂名市茂南区为民路101号', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '茂名龙头医院' },
    { name: '茂名市中医院', city: '茂名', level: '三级', levelClass: 'l3', type: '中医医院', address: '茂名市茂南区油城五路', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属中医院' },
    { name: '茂名市茂南区人民医院', city: '茂名', level: '二级', levelClass: 'l2', type: '综合医院', address: '茂名市茂南区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '惠州市中心人民医院', city: '惠州', level: '三级', levelClass: 'l3', type: '综合医院', address: '惠州市惠城区鹅岭北路41号', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '惠州龙头医院' },
    { name: '惠州市第一人民医院', city: '惠州', level: '三级', levelClass: 'l3', type: '综合医院', address: '惠州市惠城区江北三新', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属三甲医院' },
    { name: '惠州市惠城区人民医院', city: '惠州', level: '二级', levelClass: 'l2', type: '综合医院', address: '惠州市惠城区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '梅州市人民医院', city: '梅州', level: '三级', levelClass: 'l3', type: '综合医院', address: '梅州市梅江区黄塘路63号', services: '综合医疗、急诊、住院、门诊、心血管', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '梅州龙头医院（黄塘医院）' },
    { name: '梅州市中医医院', city: '梅州', level: '三级', levelClass: 'l3', type: '中医医院', address: '梅州市梅江区', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属中医院' },
    { name: '梅州市梅江区人民医院', city: '梅州', level: '二级', levelClass: 'l2', type: '综合医院', address: '梅州市梅江区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '汕尾市人民医院', city: '汕尾', level: '三级', levelClass: 'l3', type: '综合医院', address: '汕尾市城区海滨大道', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '汕尾龙头医院' },
    { name: '汕尾市城区人民医院', city: '汕尾', level: '二级', levelClass: 'l2', type: '综合医院', address: '汕尾市城区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '海丰县彭湃纪念医院', city: '汕尾', level: '二级', levelClass: 'l2', type: '综合医院', address: '汕尾市海丰县', services: '常见病诊疗、住院、门诊、急诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '县级综合医院' },
    { name: '河源市人民医院', city: '河源', level: '三级', levelClass: 'l3', type: '综合医院', address: '河源市源城区文祥路', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '河源龙头医院' },
    { name: '河源市源城区人民医院', city: '河源', level: '二级', levelClass: 'l2', type: '综合医院', address: '河源市源城区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '紫金县人民医院', city: '河源', level: '二级', levelClass: 'l2', type: '综合医院', address: '河源市紫金县', services: '常见病诊疗、住院、门诊、急诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '县级综合医院' },
    { name: '阳江市人民医院', city: '阳江', level: '三级', levelClass: 'l3', type: '综合医院', address: '阳江市江城区东山路', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '阳江龙头医院' },
    { name: '阳江市中医医院', city: '阳江', level: '三级', levelClass: 'l3', type: '中医医院', address: '阳江市江城区', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属中医院' },
    { name: '阳江市江城区人民医院', city: '阳江', level: '二级', levelClass: 'l2', type: '综合医院', address: '阳江市江城区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '清远市人民医院', city: '清远', level: '三级', levelClass: 'l3', type: '综合医院', address: '清远市清城区银泉路', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '清远龙头医院' },
    { name: '清远市中医院', city: '清远', level: '三级', levelClass: 'l3', type: '中医医院', address: '清远市清城区', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属中医院' },
    { name: '清远市清城区人民医院', city: '清远', level: '二级', levelClass: 'l2', type: '综合医院', address: '清远市清城区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '东莞市人民医院', city: '东莞', level: '三级', levelClass: 'l3', type: '综合医院', address: '东莞市万江街道新谷涌', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '东莞龙头医院' },
    { name: '东莞市中医院', city: '东莞', level: '三级', levelClass: 'l3', type: '中医医院', address: '东莞市东城街道', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属中医院' },
    { name: '东莞市松山湖中心医院', city: '东莞', level: '三级', levelClass: 'l3', type: '综合医院', address: '东莞市松山湖', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '松山湖片区医院' },
    { name: '中山市人民医院', city: '中山', level: '三级', levelClass: 'l3', type: '综合医院', address: '中山市孙文东路2号', services: '综合医疗、急诊、住院、门诊、心血管', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '中山龙头医院' },
    { name: '中山市中医院', city: '中山', level: '三级', levelClass: 'l3', type: '中医医院', address: '中山市西区康欣路', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '市属中医院' },
    { name: '中山市博爱医院', city: '中山', level: '三级', levelClass: 'l3', type: '妇幼医院', address: '中山市东区城桂路', services: '妇产科、儿科、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '妇幼专科医院' },
    { name: '潮州市中心医院', city: '潮州', level: '三级', levelClass: 'l3', type: '综合医院', address: '潮州市湘桥区环城西路', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '潮州龙头医院' },
    { name: '潮州市人民医院', city: '潮州', level: '二级', levelClass: 'l2', type: '综合医院', address: '潮州市湘桥区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '市属二甲医院' },
    { name: '潮州市潮安区人民医院', city: '潮州', level: '二级', levelClass: 'l2', type: '综合医院', address: '潮州市潮安区', services: '常见病诊疗、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '区级综合医院' },
    { name: '揭阳市人民医院', city: '揭阳', level: '三级', levelClass: 'l3', type: '综合医院', address: '揭阳市榕城区进贤大道', services: '综合医疗、急诊、住院、门诊、肿瘤', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '揭阳龙头医院' },
    { name: '揭阳市中医院', city: '揭阳', level: '二级', levelClass: 'l2', type: '中医医院', address: '揭阳市榕城区', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '市属中医院' },
    { name: '普宁市人民医院', city: '揭阳', level: '三级', levelClass: 'l3', type: '综合医院', address: '揭阳市普宁市流沙', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '县级三甲医院' },
    { name: '云浮市人民医院', city: '云浮', level: '三级', levelClass: 'l3', type: '综合医院', address: '云浮市云城区岩前路', services: '综合医疗、急诊、住院、门诊', outpatientRate: '45%', inpatientRate: '70%', deductible: '900元', cap: '60万元', features: '云浮龙头医院' },
    { name: '云浮市中医院', city: '云浮', level: '二级', levelClass: 'l2', type: '中医医院', address: '云浮市云城区', services: '中医诊疗、骨伤、急诊、住院、门诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '市属中医院' },
    { name: '罗定市人民医院', city: '云浮', level: '二级', levelClass: 'l2', type: '综合医院', address: '云浮市罗定市', services: '常见病诊疗、住院、门诊、急诊', outpatientRate: '60%', inpatientRate: '82%', deductible: '450元', cap: '60万元', features: '县级综合医院' }
];

let currentDrugCategory = 'common';
let drugSearchKeyword = '';

/* 渲染药品列表 */
function renderDrugList() {
    var list = document.getElementById('drugList');
    if (!list) return;
    var data = DRUG_DATABASE[currentDrugCategory] || [];
    var filtered = drugSearchKeyword
        ? data.filter(function(d) {
            return d.name.toLowerCase().indexOf(drugSearchKeyword.toLowerCase()) >= 0 ||
                   d.category.toLowerCase().indexOf(drugSearchKeyword.toLowerCase()) >= 0;
        })
        : data;

    if (filtered.length === 0) {
        list.innerHTML = '<div class="drug-empty">未找到匹配的药品，请尝试官方查询</div>';
        return;
    }

    var html = filtered.map(function(d) {
        var badge = d.medical
            ? '<span class="drug-item-badge">医保目录</span>'
            : '<span class="drug-item-badge non-medical">非医保</span>';
        // 使用 data 属性避免 XSS，addEventListener 绑定事件
        return '<div class="drug-item" data-category="' + currentDrugCategory + '" data-name="' + escapeHtml(d.name) + '" role="button" tabindex="0">' +
            '<div class="drug-item-name">' + escapeHtml(d.name) + badge + '</div>' +
            '<div class="drug-item-cat">' + escapeHtml(d.category) + '</div>' +
            '</div>';
    }).join('');
    list.innerHTML = html;
    // 事件绑定：避免内联 onclick 的 XSS 风险
    list.querySelectorAll('.drug-item').forEach(function(item) {
        item.addEventListener('click', function() {
            openDrugModal(this.getAttribute('data-category'), this.getAttribute('data-name'));
        });
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDrugModal(this.getAttribute('data-category'), this.getAttribute('data-name'));
            }
        });
    });
}

/* 渲染地市比价入口 */
function renderCityPriceGrid() {
    var grid = document.getElementById('cityPriceGrid');
    if (!grid) return;
    var html = CITY_PRICE_LINKS.map(function(item) {
        return '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="city-price-btn">' +
            escapeHtml(item.city) + ' 比价 →</a>';
    }).join('');
    grid.innerHTML = html;
}

/* 切换药品分类 */
function switchDrugCategory(cat, btn) {
    currentDrugCategory = cat;
    document.querySelectorAll('.drug-cat-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderDrugList();
}

/* 药品搜索过滤 */
function filterDrug(event) {
    drugSearchKeyword = event.target.value;
    // 防抖渲染，避免每次按键都全量重渲染
    if (!filterDrug._debounced) {
        filterDrug._debounced = debounce(renderDrugList, 300);
    }
    filterDrug._debounced();
}

/* 根据药品分类推断详细信息 */
function inferDrugInfo(drug) {
    var cat = drug.category || '';
    var form = '片剂/胶囊';
    var usage = cat;
    var reimburseType = '乙类（具体以官方目录为准）';
    var notice = '请遵医嘱使用，详细用法用量及不良反应请查阅药品说明书或咨询医师药师。';

    var jiaKeywords = ['青霉素', '阿莫西林', '头孢', '阿司匹林', '硝酸甘油', '肾上腺素', '胰岛素', '二甲双胍', '硝苯地平', '复方甘草'];
    for (var i = 0; i < jiaKeywords.length; i++) {
        if (drug.name.indexOf(jiaKeywords[i]) >= 0) {
            reimburseType = '甲类（医保全额纳入）';
            break;
        }
    }

    if (cat.indexOf('注射液') >= 0 || drug.name.indexOf('注射液') >= 0) form = '注射液';
    else if (cat.indexOf('混悬') >= 0 || drug.name.indexOf('混悬') >= 0) form = '混悬液';
    else if (cat.indexOf('滴剂') >= 0 || drug.name.indexOf('滴剂') >= 0) form = '滴剂';
    else if (cat.indexOf('糖浆') >= 0 || drug.name.indexOf('糖浆') >= 0) form = '糖浆';
    else if (cat.indexOf('口服液') >= 0 || drug.name.indexOf('口服液') >= 0) form = '口服液';
    else if (cat.indexOf('软膏') >= 0 || drug.name.indexOf('软膏') >= 0) form = '软膏';
    else if (cat.indexOf('气雾') >= 0 || cat.indexOf('吸入') >= 0) form = '吸入剂/气雾剂';
    else if (cat.indexOf('滴眼') >= 0) form = '滴眼液';
    else form = '片剂/胶囊';

    if (cat.indexOf('抗生素') >= 0 || cat.indexOf('青霉素') >= 0 || cat.indexOf('头孢') >= 0) {
        usage = cat + '。用于细菌感染性疾病，需凭处方购买，使用前注意过敏史。';
    } else if (cat.indexOf('降压') >= 0 || cat.indexOf('高血压') >= 0 || cat.indexOf('钙通道') >= 0) {
        usage = cat + '。用于高血压治疗，需规律服药，定期监测血压。';
    } else if (cat.indexOf('降糖') >= 0 || cat.indexOf('糖尿病') >= 0) {
        usage = cat + '。用于糖尿病血糖控制，需配合饮食运动，定期监测血糖。';
    } else if (cat.indexOf('哮喘') >= 0 || cat.indexOf('支气管') >= 0) {
        usage = cat + '。用于哮喘或慢性气道疾病，急性发作时及时就医。';
    } else if (cat.indexOf('儿童') >= 0) {
        usage = cat + '。儿童专用药品，需按年龄体重调整剂量，家长遵医嘱给药。';
        notice = '儿童用药需严格遵医嘱，注意剂量换算，出现不良反应立即停药就医。';
    } else if (cat.indexOf('急救') >= 0) {
        usage = cat + '。急救用药，需专业人员操作或遵医嘱，注意适应症与禁忌。';
        notice = '急救药品需在医务人员指导下使用，注意剂量与给药途径，备好抢救设备。';
    }

    return { form: form, usage: usage, reimburseType: reimburseType, notice: notice };
}

/* 打开详情模态窗口（药品/医院共用） */
function openDrugModal(category, drugName) {
    var data = DRUG_DATABASE[category] || [];
    var drug = data.find(function(d) { return d.name === drugName; });
    if (!drug) return;

    var modal = document.getElementById('detailModal');
    var title = document.getElementById('detailModalTitle');
    var body = document.getElementById('detailModalBody');
    var link = document.getElementById('detailModalOfficialLink');
    if (!modal || !title || !body) return;

    title.textContent = drug.name;

    var info = inferDrugInfo(drug);
    var medicalBadge = drug.medical
        ? '<span class="drug-info-badge">医保目录内</span>'
        : '<span class="drug-info-badge non-medical">医保目录外</span>';

    var html = '';
    html += '<div class="drug-info-row"><div class="drug-info-label">药品名称</div><div class="drug-info-value"><strong>' + escapeHtml(drug.name) + '</strong></div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">药品分类</div><div class="drug-info-value">' + escapeHtml(drug.category) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">医保状态</div><div class="drug-info-value">' + medicalBadge + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">剂型</div><div class="drug-info-value">' + escapeHtml(info.form) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">用途</div><div class="drug-info-value">' + escapeHtml(info.usage) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">报销类别</div><div class="drug-info-value">' + escapeHtml(info.reimburseType) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">注意事项</div><div class="drug-info-value">' + escapeHtml(info.notice) + '</div></div>';
    body.innerHTML = html;

    if (link) {
        link.style.display = '';
        link.onclick = function(e) {
            e.preventDefault();
            closeDrugModal();
            searchDrugOnOfficial(drug.name);
        };
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (elderModeActive) speak('查看药品：' + drug.name + '，属于' + drug.category, true);
}

/* 关闭详情模态窗口 */
function closeDrugModal() {
    var modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

/* ESC 键关闭模态窗口 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDrugModal();
});

/* ============================================================
   21 地市医院列表模块
   ============================================================ */

/* 初始化医院筛选器（地市下拉） */
function initHospitalFilter() {
    var select = document.getElementById('hospitalCityFilter');
    if (!select) return;
    var cities = [];
    HOSPITAL_DATABASE.forEach(function(h) {
        if (cities.indexOf(h.city) < 0) cities.push(h.city);
    });
    cities.sort();
    cities.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
    renderHospitalList();
}

/* 渲染医院列表 */
function renderHospitalList(list) {
    var grid = document.getElementById('hospitalListGrid');
    var info = document.getElementById('hospitalListInfo');
    if (!grid) return;
    var data = list || HOSPITAL_DATABASE;
    if (info) info.textContent = '共 ' + data.length + ' 家医院';
    if (data.length === 0) {
        grid.innerHTML = '<div class="hospital-list-empty">未找到符合条件的医院，请调整筛选条件</div>';
        return;
    }
    var html = data.map(function(h) {
        var levelText = h.level === '社区' ? '社区/基层' : h.level + '级';
        // 使用 data 属性避免 XSS
        return '<div class="hospital-list-item" data-city="' + escapeHtml(h.city) + '" data-name="' + escapeHtml(h.name) + '" role="button" tabindex="0">' +
            '<div class="hospital-list-item-header">' +
                '<div class="hospital-list-item-name">' + escapeHtml(h.name) + '</div>' +
                '<span class="hospital-list-item-level ' + h.levelClass + '">' + levelText + '</span>' +
            '</div>' +
            '<div class="hospital-list-item-meta">' +
                '<span>📍 ' + escapeHtml(h.city) + '</span>' +
                '<span>🏥 ' + escapeHtml(h.type) + '</span>' +
            '</div>' +
            '<div class="hospital-list-item-meta" style="font-size:0.78rem;">' + escapeHtml(h.address) + '</div>' +
            '<div class="hospital-list-item-rate">住院报销 ' + h.inpatientRate + ' · 起付 ' + h.deductible + '</div>' +
        '</div>';
    }).join('');
    grid.innerHTML = html;
    // 事件绑定
    grid.querySelectorAll('.hospital-list-item').forEach(function(item) {
        item.addEventListener('click', function() {
            openHospitalDetail(this.getAttribute('data-city'), this.getAttribute('data-name'));
        });
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openHospitalDetail(this.getAttribute('data-city'), this.getAttribute('data-name'));
            }
        });
    });
}

/* 筛选医院 */
function filterHospitals() {
    var city = document.getElementById('hospitalCityFilter') ? document.getElementById('hospitalCityFilter').value : 'all';
    var level = document.getElementById('hospitalLevelFilter') ? document.getElementById('hospitalLevelFilter').value : 'all';
    var keyword = document.getElementById('hospitalSearchInput') ? document.getElementById('hospitalSearchInput').value.trim().toLowerCase() : '';
    var filtered = HOSPITAL_DATABASE.filter(function(h) {
        if (city !== 'all' && h.city !== city) return false;
        if (level !== 'all' && h.level !== level) return false;
        if (keyword && h.name.toLowerCase().indexOf(keyword) < 0 && h.address.toLowerCase().indexOf(keyword) < 0) return false;
        return true;
    });
    renderHospitalList(filtered);
}

/* 打开医院详情（复用模态窗口） */
function openHospitalDetail(city, hospitalName) {
    var hospital = HOSPITAL_DATABASE.find(function(h) { return h.city === city && h.name === hospitalName; });
    if (!hospital) return;

    var modal = document.getElementById('detailModal');
    var title = document.getElementById('detailModalTitle');
    var body = document.getElementById('detailModalBody');
    var link = document.getElementById('detailModalOfficialLink');
    if (!modal || !title || !body) return;

    title.textContent = hospital.name;

    var levelText = hospital.level === '社区' ? '社区/基层医疗机构' : hospital.level + '级医院';
    var levelBadge = '<span class="drug-info-badge">' + escapeHtml(levelText) + '</span>';

    var html = '';
    html += '<div class="drug-info-row"><div class="drug-info-label">医院名称</div><div class="drug-info-value"><strong>' + escapeHtml(hospital.name) + '</strong></div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">医院等级</div><div class="drug-info-value">' + levelBadge + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">所在城市</div><div class="drug-info-value">📍 ' + escapeHtml(hospital.city) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">医院类型</div><div class="drug-info-value">🏥 ' + escapeHtml(hospital.type) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">详细地址</div><div class="drug-info-value">' + escapeHtml(hospital.address) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">服务范围</div><div class="drug-info-value">' + escapeHtml(hospital.services) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">门诊报销</div><div class="drug-info-value">💊 报销比例 ' + escapeHtml(hospital.outpatientRate) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">住院报销</div><div class="drug-info-value">🏥 报销比例 ' + escapeHtml(hospital.inpatientRate) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">起付线</div><div class="drug-info-value">' + escapeHtml(hospital.deductible) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">年度封顶</div><div class="drug-info-value">' + escapeHtml(hospital.cap) + '</div></div>';
    html += '<div class="drug-info-row"><div class="drug-info-label">医院特色</div><div class="drug-info-value">' + escapeHtml(hospital.features) + '</div></div>';
    body.innerHTML = html;

    if (link) link.style.display = 'none';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (elderModeActive) speak('查看医院：' + hospital.name + '，' + levelText + '，位于' + hospital.city, true);
}

/* 跳转国家医保药品目录官方查询 */
function searchDrugOnOfficial(drugName) {
    var name = drugName || document.getElementById('drugSearchInput').value.trim();
    var url = 'https://fuwu.nhsa.gov.cn';
    if (name) {
        showToast('正在跳转国家医保服务平台查询：' + name, 'success');
    } else {
        showToast('正在跳转国家医保服务平台', 'success');
    }
    setTimeout(function() { window.open(url, '_blank', 'noopener,noreferrer'); }, 300);
}

/* ============================================================
   政策更新检查模块
   功能：拉取广东省医保局公告 RSS，提示新政策
   ============================================================ */

const POLICY_UPDATE_KEY = 'gd_medical_last_update_check';
const POLICY_RSS_URL = 'http://hsa.gd.gov.cn/zwdt/snkb/';

function checkPolicyUpdate() {
    var btn = document.getElementById('checkUpdateBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '检查中...';
    }
    showToast('正在检查政策更新...', 'success');

    // 由于跨域限制，无法直接 fetch 官方 RSS
    // 此处通过引导用户访问官方页面方式实现
    setTimeout(function() {
        var lastCheck = localStorage.getItem(POLICY_UPDATE_KEY);
        var now = Date.now();
        var today = new Date().toDateString();

        if (!lastCheck || new Date(parseInt(lastCheck)).toDateString() !== today) {
            showUpdateBanner('检测到今日首次检查，建议访问广东省医保局官网查看最新政策公告。');
        } else {
            showUpdateBanner('今日已检查过，暂无新政策提示。如需查看完整列表请访问官网。');
        }

        try { localStorage.setItem(POLICY_UPDATE_KEY, now.toString()); } catch (e) {}

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg> 检查更新';
        }

        // 提供跳转入口
        setTimeout(function() {
            if (confirm('点击确定访问广东省医保局官网查看最新政策公告。')) {
                window.open(POLICY_RSS_URL, '_blank', 'noopener,noreferrer');
            }
        }, 1500);
    }, 800);
}

function showUpdateBanner(text) {
    var banner = document.getElementById('updateBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'updateBanner';
        banner.className = 'update-banner';
        banner.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm0-8h2V7h-2v2z"/></svg>' +
            '<span class="update-banner-text">' + escapeHtml(text) + '</span>' +
            '<button class="update-banner-close" onclick="this.parentElement.classList.remove(\'show\')">×</button>';
        var drugPanel = document.getElementById('panel-drug');
        if (drugPanel) {
            var card = drugPanel.querySelector('.card');
            if (card) card.insertBefore(banner, card.firstChild);
        }
    }
    banner.querySelector('.update-banner-text').textContent = text;
    banner.classList.add('show');
}

/* ============================================================
   用户反馈模块
   功能：本地存储用户反馈，定期整理补充知识库
   ============================================================ */

const FEEDBACK_KEY = 'gd_medical_feedback_list';

function submitFeedback(event) {
    event.preventDefault();
    var category = document.getElementById('feedbackCategory').value;
    var content = document.getElementById('feedbackContent').value.trim();
    var contact = document.getElementById('feedbackContact').value.trim();

    if (!category || !content) {
        showToast('请填写问题类型和描述', 'error');
        return;
    }

    var feedback = {
        id: 'fb_' + Date.now(),
        category: category,
        content: content,
        contact: contact || '未填写',
        timestamp: Date.now(),
        status: '待处理'
    };

    var list = loadFeedbackList();
    list.unshift(feedback);
    try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list)); } catch (e) {}

    // 清空表单
    document.getElementById('feedbackForm').reset();
    showToast('反馈已提交，感谢您的支持！', 'success');
    if (elderModeActive) speak('反馈已提交，感谢您的支持', true);

    renderFeedbackList();
}

function loadFeedbackList() {
    try {
        var raw = localStorage.getItem(FEEDBACK_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function renderFeedbackList() {
    var list = loadFeedbackList();
    var history = document.getElementById('feedbackHistory');
    var container = document.getElementById('feedbackList');
    if (!history || !container) return;

    if (list.length === 0) {
        history.style.display = 'none';
        return;
    }

    history.style.display = 'block';
    var html = list.slice(0, 10).map(function(item) {
        var date = new Date(item.timestamp);
        var dateStr = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0');
        return '<div class="feedback-item">' +
            '<div class="feedback-item-meta">[' + escapeHtml(item.category) + '] ' + dateStr + ' · ' + escapeHtml(item.status) + '</div>' +
            '<div class="feedback-item-content">' + escapeHtml(item.content) + '</div>' +
            (item.contact !== '未填写' ? '<div class="feedback-item-meta">联系方式：' + escapeHtml(item.contact) + '</div>' : '') +
            '</div>';
    }).join('');
    container.innerHTML = html;
}

/* HTML 转义防 XSS */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
