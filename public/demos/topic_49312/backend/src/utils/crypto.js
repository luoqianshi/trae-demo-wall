/**
 * 加密解密与脱敏工具
 * 敏感字段：身份证、手机号、银行卡、薪资
 */
const CryptoJS = require('crypto-js');

// 加密密钥（生产环境应从环境变量读取）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'hr-system-secret-key-2024';

/**
 * AES加密
 */
function encrypt(text) {
  if (text === null || text === undefined || text === '') return text;
  return CryptoJS.AES.encrypt(String(text), ENCRYPTION_KEY).toString();
}

/**
 * AES解密
 */
function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return ciphertext;
  }
}

/**
 * 手机号脱敏: 138****8000
 */
function maskPhone(phone) {
  if (!phone) return phone;
  const plain = decrypt(phone);
  if (!plain || plain.length < 7) return plain;
  return plain.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 获取真实手机号（解密）
 */
function getRealPhone(ciphertext) {
  return decrypt(ciphertext);
}

/**
 * 身份证号脱敏: 310***********1234
 */
function maskIdCard(idCard) {
  if (!idCard) return idCard;
  const plain = decrypt(idCard);
  if (!plain || plain.length < 8) return plain;
  const len = plain.length;
  return plain.substring(0, 3) + '*'.repeat(len - 7) + plain.substring(len - 4);
}

/**
 * 获取真实身份证号（解密）
 */
function getRealIdCard(ciphertext) {
  return decrypt(ciphertext);
}

/**
 * 银行卡号脱敏: 6222 **** **** 1234
 */
function maskBankCard(cardNumber) {
  if (!cardNumber) return cardNumber;
  const plain = decrypt(cardNumber);
  if (!plain || plain.length < 8) return plain;
  const len = plain.length;
  return plain.substring(0, 4) + ' **** **** ' + plain.substring(len - 4);
}

/**
 * 获取真实银行卡号（解密）
 */
function getRealBankCard(ciphertext) {
  return decrypt(ciphertext);
}

/**
 * 薪资脱敏: 只显示范围，不显示具体数值
 * 非HR/管理员看到的是 *** 或薪资区间
 */
function maskSalary(salary) {
  if (salary === null || salary === undefined) return salary;
  return '***';
}

/**
 * 批量解密对象中的敏感字段
 * @param {Object} obj - 数据对象
 * @param {Array<string>} fields - 敏感字段名数组
 * @returns {Object} 解密后的对象
 */
function decryptFields(obj, fields) {
  if (!obj) return obj;
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  });
  return result;
}

/**
 * 批量加密对象中的敏感字段
 */
function encryptFields(obj, fields) {
  if (!obj) return obj;
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  });
  return result;
}

/**
 * 前端脱敏：将对象中的敏感字段替换为脱敏版本
 * @param {Object} obj - 已解密的数据对象
 * @param {Array<string>} phoneFields - 手机号字段
 * @param {Array<string>} idCardFields - 身份证字段
 * @param {Array<string>} bankCardFields - 银行卡字段
 * @param {Array<string>} salaryFields - 薪资字段
 */
function maskSensitiveData(obj, options = {}) {
  if (!obj) return obj;
  const {
    phoneFields = ['phone'],
    idCardFields = ['id_card'],
    bankCardFields = ['bank_card'],
    salaryFields = ['salary', 'base_salary', 'position_salary', 'performance_bonus',
      'allowance', 'social_insurance', 'housing_fund', 'tax', 'gross_salary', 'net_salary',
      'overtime_pay', 'other_additions', 'other_deductions', 'salary_enc', 'base_salary_enc',
      'position_salary_enc', 'performance_bonus_enc', 'allowance_enc', 'social_insurance_enc',
      'housing_fund_enc', 'tax_enc', 'salary_encrypted', 'expected_salary', 'current_salary']
  } = options;

  const result = { ...obj };

  phoneFields.forEach(f => {
    if (result[f]) {
      const plain = result[f];
      if (plain.length >= 7) {
        result[f] = plain.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      }
    }
  });

  idCardFields.forEach(f => {
    if (result[f]) {
      const plain = result[f];
      const len = plain.length;
      if (len >= 8) {
        result[f] = plain.substring(0, 3) + '*'.repeat(len - 7) + plain.substring(len - 4);
      }
    }
  });

  bankCardFields.forEach(f => {
    if (result[f]) {
      const plain = result[f];
      const len = plain.length;
      if (len >= 8) {
        result[f] = plain.substring(0, 4) + ' **** **** ' + plain.substring(len - 4);
      }
    }
  });

  salaryFields.forEach(f => {
    if (result[f] !== null && result[f] !== undefined && f !== 'salary_range') {
      result[f] = '***';
    }
  });

  return result;
}

module.exports = {
  encrypt,
  decrypt,
  maskPhone,
  getRealPhone,
  maskIdCard,
  getRealIdCard,
  maskBankCard,
  getRealBankCard,
  maskSalary,
  decryptFields,
  encryptFields,
  maskSensitiveData,
  ENCRYPTION_KEY
};
