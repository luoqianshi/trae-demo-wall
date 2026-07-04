/**
 * 示例数据生成模块
 * 用于生成演示用的示例项目数据
 */
const path = require('path');
const fs = require('fs');
const { pad4, todayStr } = require('./db-utils');
const { getDb } = require('./db-utils');
const { buildProgressText } = require('./text-parser');

/**
 * 随机选择数组元素
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成随机整数
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机日期
 */
function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  return d.toISOString().slice(0, 10);
}

/**
 * 获取数据目录路径
 */
function getDataDir() {
  return path.join(__dirname, '..', 'app-data');
}

/**
 * 生成示例项目
 */
function generateDemoProjects(count) {
  const db = getDb();
  if (!db) return { ok: false, inserted: 0 };

  const customers = ['中国电信', '中国移动', '中国联通', '国家电网', '中国石油', '工商银行', '建设银行', '腾讯云', '阿里云', '华为云'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '天津', '苏州', '青岛', '厦门', '长沙', '郑州'];
  const statuses = ['进行中', '已完成', '暂停', '待启动'];
  const phases = ['需求调研', '方案设计', '环境部署', '系统联调', '用户培训', '验收交付', '运维保障'];
  const nextActions = ['等待客户反馈', '准备上线材料', '协调资源', '完成测试用例', '排障优化', '等待审批', '编写交付文档', '现场实施', '数据迁移'];
  const contacts = ['张伟', '李娜', '王磊', '刘洋', '陈静', '赵强', '孙丽', '周杰', '吴敏', '郑浩', '冯超', '蒋婷'];

  const dataDirPath = getDataDir();

  let inserted = 0;
  try {
    const tx = db.transaction(() => {
      for (let i = 1; i <= count; i++) {
        const customer = randomPick(customers);
        const city = randomPick(cities);
        const status = randomPick(statuses);
        const phase = randomPick(phases);
        const nextAction = randomPick(nextActions);
        const contact = randomPick(contacts);
        const id = pad4(i);
        const name = `${city}${customer}${randomPick(['数据中心', '云平台', '运维系统', '业务系统', 'OA系统', 'CRM系统'])}`;
        const createdAt = randomDate(180);
        const updatedAt = randomDate(30);
        const dir = path.join(dataDirPath, 'projects', id);

        const progCount = randomInt(1, 3);
        const progressItems = [];
        for (let p = 0; p < progCount; p++) {
          progressItems.push({
            id: 'P' + id + '-' + (p + 1),
            createdAt: randomDate(30),
            content: `${phase}阶段进展 ${p + 1}：已完成${randomPick(['需求梳理', '方案评审', '部署安装', '联调测试', '数据迁移', '培训交付'])}，整体${randomPick(['顺利推进', '按计划进行', '稳步实施'])}。`
          });
        }
        const progressText = buildProgressText(progressItems);

        db.prepare(`
          INSERT INTO projects (id, name, customer, region, status, currentPhase, nextAction,
            imGroup, imContact, attachmentDir, isRecent, progressText, attachmentsText, customFields, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, name, customer, `${city}分公司`, status, phase, nextAction,
          `${customer}项目沟通群`, `${contact}（${customer}）`,
          dir, Math.random() > 0.7 ? 1 : 0,
          progressText, '', '{}', createdAt, updatedAt
        );
        inserted = i;
      }
    });
    tx();
    return { ok: true, inserted };
  } catch (e) {
    return { ok: false, inserted, error: e.message };
  }
}

/**
 * 清除所有项目
 */
function clearDemoProjects() {
  const db = getDb();
  if (!db) return { ok: false, deleted: 0 };

  try {
    const projects = db.prepare("SELECT id, attachmentDir FROM projects").all();
    for (const p of projects) {
      if (p.attachmentDir && fs.existsSync(p.attachmentDir)) {
        try { fs.rmSync(p.attachmentDir, { recursive: true, force: true }); } catch (_) {}
      }
    }
    const info = db.prepare("DELETE FROM projects").run();
    return { ok: true, deleted: info.changes || 0 };
  } catch (e) {
    return { ok: false, deleted: 0, error: e.message };
  }
}

/**
 * 检查并生成示例项目（根据设置）
 */
function ensureDemoProjects() {
  const db = getDb();
  if (!db) return;

  try {
    const { getSettings } = require('./settings');
    const settings = getSettings();
    const demoEnabled = settings.demoModeEnabled;
    const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    if (demoEnabled && projectCount === 0) {
      generateDemoProjects(10);
    }
  } catch (_) {}
}

module.exports = {
  generateDemoProjects,
  clearDemoProjects,
  ensureDemoProjects
};
