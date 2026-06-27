/**
 * JSON文件数据库工具
 * 使用JSON文件作为简易数据库，适合中小型项目
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 获取表数据
 * @param {string} table 表名
 * @returns {Array} 数据数组
 */
function getTable(table) {
  const filePath = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`读取表 ${table} 失败:`, err);
    return [];
  }
}

/**
 * 保存表数据
 * @param {string} table 表名
 * @param {Array} data 数据数组
 */
function saveTable(table, data) {
  const filePath = path.join(DATA_DIR, `${table}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * 插入数据
 * @param {string} table 表名
 * @param {Object} record 记录对象
 * @returns {Object} 插入的记录（含id）
 */
function insert(table, record) {
  const data = getTable(table);
  const newRecord = {
    id: record.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  };
  data.push(newRecord);
  saveTable(table, data);
  return newRecord;
}

/**
 * 查询数据（支持条件过滤）
 * @param {string} table 表名
 * @param {Object} conditions 查询条件
 * @returns {Array} 匹配的记录数组
 */
function find(table, conditions = {}) {
  let data = getTable(table);
  for (const key of Object.keys(conditions)) {
    data = data.filter(item => item[key] === conditions[key]);
  }
  return data;
}

/**
 * 查询单条记录
 * @param {string} table 表名
 * @param {Object} conditions 查询条件
 * @returns {Object|null} 匹配的记录或null
 */
function findOne(table, conditions = {}) {
  const results = find(table, conditions);
  return results.length > 0 ? results[0] : null;
}

/**
 * 根据ID查询
 * @param {string} table 表名
 * @param {string} id 记录ID
 * @returns {Object|null}
 */
function findById(table, id) {
  return findOne(table, { id });
}

/**
 * 更新数据
 * @param {string} table 表名
 * @param {string} id 记录ID
 * @param {Object} updates 更新的字段
 * @returns {Object|null} 更新后的记录
 */
function update(table, id, updates) {
  const data = getTable(table);
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return null;
  data[index] = {
    ...data[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveTable(table, data);
  return data[index];
}

/**
 * 删除数据
 * @param {string} table 表名
 * @param {string} id 记录ID
 * @returns {boolean} 是否删除成功
 */
function remove(table, id) {
  const data = getTable(table);
  const newData = data.filter(item => item.id !== id);
  if (newData.length === data.length) return false;
  saveTable(table, newData);
  return true;
}

/**
 * 初始化数据（如果不存在）
 * @param {string} table 表名
 * @param {Array} defaultData 默认数据
 */
function initTable(table, defaultData = []) {
  const filePath = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) {
    saveTable(table, defaultData);
  }
}

module.exports = {
  getTable,
  saveTable,
  insert,
  find,
  findOne,
  findById,
  update,
  remove,
  initTable
};
