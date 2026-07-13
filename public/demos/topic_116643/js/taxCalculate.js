/**
 * 房产税费计算引擎
 * 依据不动产登记中心最新收费标准
 * 从原 index.html 迁移并优化
 */

// 契税计算（140㎡为临界点）
function calcDeedTax(price, area, tradeType, propertyType) {
  if (propertyType !== 'residential') {
    return { tax: price * 0.03, note: '非住宅 · 3%' };
  }
  if (tradeType === 'first') {
    if (area <= 140) return { tax: price * 0.01, note: '首套·≤140㎡ · 1%' };
    return { tax: price * 0.015, note: '首套·>140㎡ · 1.5%' };
  } else if (tradeType === 'second') {
    if (area <= 140) return { tax: price * 0.01, note: '二套·≤140㎡ · 1%' };
    return { tax: price * 0.02, note: '二套·>140㎡ · 2%' };
  }
  return { tax: price * 0.03, note: '卖方视角' };
}

// 增值税计算（满2年免征，不满2年按5%；非住宅不享受免征）
function calcVAT(price, holdYears, propertyType) {
  if (propertyType === 'non-residential') {
    return { tax: price * 0.05, note: '非住宅 · 5%', free: false };
  }
  if (holdYears === 'lt2') {
    return { tax: price * 0.05, note: '不满2年 · 5%', free: false };
  }
  return { tax: 0, note: '满2年以上', free: true };
}

// 个人所得税（满五唯一免征，否则1%；非住宅不享受免征）
function calcIncomeTax(price, holdYears, tradeType, propertyType) {
  if (propertyType === 'non-residential') {
    return { tax: price * 0.01, note: '非住宅 · 核定1%', free: false };
  }
  if (holdYears === 'ge5' && (tradeType === 'first' || tradeType === 'second')) {
    return { tax: 0, note: '满五唯一（家庭唯一住房）', free: true };
  }
  return { tax: price * 0.01, note: '无原值凭证 · 1%', free: false };
}

// 登记费
function calcRegFee(propertyType) {
  if (propertyType === 'residential') {
    return { tax: 80, note: '住宅 · 80元/件' };
  }
  return { tax: 550, note: '非住宅 · 550元/件' };
}

// 维修资金
function calcMaintFee(area, buildingType) {
  if (buildingType === 'high-rise') {
    return { tax: area * 90, note: '高层 · 90元/㎡' };
  }
  return { tax: area * 50, note: '多层/别墅 · 50元/㎡' };
}

// 完整税费计算
function calculateAllTax(params) {
  const price = params.price * 10000; // 万元→元
  const area = params.area;
  const propertyType = params.propertyType || 'residential';
  const tradeType = params.tradeType || 'first';
  const holdYears = params.holdYears || 'ge5';
  const buildingType = params.buildingType || 'high-rise';

  const deedTax = calcDeedTax(price, area, tradeType, propertyType);
  const vat = calcVAT(price, holdYears, propertyType);
  const incomeTax = calcIncomeTax(price, holdYears, tradeType, propertyType);
  const regFee = calcRegFee(propertyType);
  const maintFee = propertyType === 'non-residential'
    ? { tax: 0, note: '非住宅不缴纳维修资金' }
    : calcMaintFee(area, buildingType);

  const transFee = propertyType === 'non-residential'
    ? { tax: area * 6, note: '非住宅 · 6元/㎡' }
    : { tax: area * 3, note: '3元/㎡' };
  const stampTax = propertyType === 'non-residential'
    ? { tax: Math.max(5, Math.round(price * 0.0005)), note: '非住宅 · 0.05%' }
    : { tax: 5, note: '5元/件' };

  const items = [
    { name: '契税', ...deedTax, type: 'buyer' },
    { name: '增值税', ...vat, type: 'seller' },
    { name: '个人所得税', ...incomeTax, type: 'seller' },
    { name: '维修资金', ...maintFee, type: 'buyer' },
    { name: '不动产登记费', ...regFee, type: 'buyer' },
    { name: '交易手续费', ...transFee, type: 'buyer' },
    { name: '印花税', ...stampTax, type: 'buyer' }
  ];

  const total = items.reduce((sum, i) => sum + i.tax, 0);
  const buyerTotal = items.filter(i => i.type === 'buyer').reduce((s, i) => s + i.tax, 0);
  const sellerTotal = items.filter(i => i.type === 'seller').reduce((s, i) => s + i.tax, 0);

  let savedAmount = 0;
  if (propertyType === 'residential') {
    if (vat.free) savedAmount += price * 0.05;
    if (incomeTax.free) savedAmount += price * 0.01;
  }

  return { items, total, buyerTotal, sellerTotal, savedAmount };
}

// 贷款计算（等额本息）
function calcLoanEqual(loanAmount, years, rateYear) {
  const months = years * 12;
  const monthlyRate = rateYear / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  const monthlyPayment = loanAmount * monthlyRate * factor / (factor - 1);
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - loanAmount;
  return { monthlyPayment, totalPayment, totalInterest, months };
}

// 贷款计算（等额本金）
function calcLoanPrincipal(loanAmount, years, rateYear) {
  const months = years * 12;
  const monthlyRate = rateYear / 100 / 12;
  const principalPerMonth = loanAmount / months;
  const firstMonth = principalPerMonth + loanAmount * monthlyRate;
  const totalInterest = loanAmount * monthlyRate * (months + 1) / 2;
  const totalPayment = loanAmount + totalInterest;
  const lastMonth = principalPerMonth + principalPerMonth * monthlyRate;
  return { firstMonth, lastMonth, totalPayment, totalInterest, months };
}