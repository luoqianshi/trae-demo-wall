/**
 * 数据库基础工具模块
 * 提供基础工具函数，避免循环依赖
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function pad4(num) {
  return String(num).padStart(4, '0');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDb() {
  return db;
}

function setDb(instance) {
  db = instance;
}

function genProjectId() {
  if (!db) return pad4(1);
  const row = db.prepare('SELECT COUNT(*) as c FROM projects').get();
  return pad4(row.c + 1);
}

function loadTemplate() {
  const tplPath = path.join(__dirname, '..', 'db-template.json');
  try {
    const raw = fs.readFileSync(tplPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('加载数据库模板失败:', e.message);
    return null;
  }
}

module.exports = {
  Database,
  pad4,
  todayStr,
  getDb,
  setDb,
  genProjectId,
  loadTemplate
};
