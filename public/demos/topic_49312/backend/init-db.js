/**
 * 数据库初始化脚本
 * 创建所有表结构并插入默认超级管理员账号
 * 使用 sql.js（纯 JavaScript SQLite 实现）
 * 运行: node init-db.js
 */
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');

async function main() {
// 数据库文件路径
const dbPath = path.join(__dirname, 'hr_system.db');

// 如果数据库已存在，先删除（开发环境）
if (fs.existsSync(dbPath)) {
  console.log('数据库已存在，正在删除旧数据库...');
  fs.unlinkSync(dbPath);
}

// 初始化 sql.js
const SQL = await initSqlJs();
const db = new SQL.Database();
console.log('数据库创建成功（内存模式）');

// 加密密钥（生产环境应从环境变量读取）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'hr-system-secret-key-2024';

/**
 * AES加密函数
 */
function encrypt(text) {
  if (!text) return text;
  return CryptoJS.AES.encrypt(String(text), ENCRYPTION_KEY).toString();
}

/**
 * 将内存数据库持久化到文件
 */
function save() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * 兼容层：提供与 better-sqlite3 类似的 API
 */
const compatDb = {
  exec(sql) {
    // sql.js 的 run() 不支持多条语句，按分号分割逐条执行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const stmt of statements) {
      db.run(stmt);
    }
  },
  pragma(sql) {
    db.run(sql);
  },
  prepare(sql) {
    return {
      run(...params) {
        const stmt = db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();

        const changes = db.getRowsModified();
        const lastInsertResult = db.exec('SELECT last_insert_rowid() as lid');
        const lastInsertRowid = (lastInsertResult.length > 0 && lastInsertResult[0].values.length > 0)
          ? lastInsertResult[0].values[0][0]
          : 0;

        return { changes, lastInsertRowid };
      }
    };
  },
  transaction(fn) {
    // 与 better-sqlite3 兼容：返回一个新函数，调用时在事务中执行 fn
    return function(...args) {
      db.run('BEGIN');
      try {
        fn(...args);
        db.run('COMMIT');
      } catch (e) {
        db.run('ROLLBACK');
        throw e;
      }
    };
  },
  close() {
    // sql.js 不需要特别关闭，只需释放内存
  }
};

// 启用外键约束和 WAL 模式
compatDb.pragma('PRAGMA foreign_keys = ON');
compatDb.pragma('PRAGMA journal_mode = WAL');

console.log('开始创建表...');

// ==================== 1. departments 部门表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    parent_id INTEGER DEFAULT 0,
    manager_id INTEGER,
    description TEXT,
    status INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);
console.log('  -> departments 表创建成功');

// ==================== 2. users 用户表（含角色） ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    real_name TEXT,
    email TEXT,
    phone TEXT,              -- 加密存储
    role TEXT NOT NULL DEFAULT 'employee',  -- admin(超管), hr(HR), manager(部门经理), employee(普通员工)
    department_id INTEGER,
    status INTEGER NOT NULL DEFAULT 1,      -- 1:启用 0:禁用
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
  )
`);
console.log('  -> users 表创建成功');

// ==================== 3. employees 员工档案表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no TEXT NOT NULL UNIQUE,       -- 工号
    name TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT '未知',
    birth_date TEXT,
    id_card TEXT,                           -- 身份证号（加密存储）
    phone TEXT,                             -- 手机号（加密存储）
    email TEXT,
    address TEXT,
    bank_card TEXT,                         -- 银行卡号（加密存储）
    bank_name TEXT,
    education TEXT,
    major TEXT,
    department_id INTEGER,
    position TEXT,
    entry_date TEXT,
    contract_start TEXT,
    contract_end TEXT,
    probation_end TEXT,
    status TEXT NOT NULL DEFAULT 'active',  -- active:在职, resigned:离职, probation:试用期
    leave_date TEXT,
    avatar TEXT,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
  )
`);
console.log('  -> employees 表创建成功');

// ==================== 4. jobs 招聘岗位表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,                    -- 岗位名称
    department_id INTEGER,
    description TEXT,                       -- 岗位描述
    requirements TEXT,                      -- 任职要求
    salary_range TEXT,                      -- 薪资范围
    location TEXT,                          -- 工作地点
    headcount INTEGER DEFAULT 1,            -- 招聘人数
    status TEXT NOT NULL DEFAULT 'open',    -- open:招聘中, closed:已关闭, draft:草稿
    publish_date TEXT,
    close_date TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> jobs 表创建成功');

// ==================== 5. resumes 简历表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    phone TEXT NOT NULL,                    -- 手机号（加密存储）
    email TEXT,
    education TEXT,
    work_years INTEGER DEFAULT 0,
    expected_salary TEXT,
    current_salary TEXT,
    resume_file TEXT,                       -- 简历文件路径
    source TEXT,                            -- 来源
    status TEXT NOT NULL DEFAULT 'pending', -- pending:待筛选, screening:筛选中, interview:面试中, offer:已发offer, rejected:已拒绝, hired:已入职
    hr_user_id INTEGER,                     -- 负责HR
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (hr_user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> resumes 表创建成功');

// ==================== 6. interviews 面试表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    round INTEGER NOT NULL DEFAULT 1,       -- 面试轮次
    interview_type TEXT DEFAULT 'onsite',   -- onsite:现场, phone:电话, video:视频
    interviewer_id INTEGER,                 -- 面试官
    scheduled_at TEXT NOT NULL,             -- 面试时间
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,                          -- 面试地点/链接
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled:已安排, passed:通过, failed:未通过, cancelled:已取消
    feedback TEXT,                          -- 面评反馈
    score INTEGER,                          -- 评分 1-100
    interviewer_remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> interviews 表创建成功');

// ==================== 7. offers 录用通知表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    offer_no TEXT NOT NULL UNIQUE,          -- Offer编号
    salary REAL NOT NULL,                   -- 薪资（加密存储）
    salary_encrypted TEXT,                  -- 加密后薪资
    position TEXT NOT NULL,
    department_id INTEGER,
    entry_date TEXT,                        -- 预计入职日期
    offer_date TEXT NOT NULL,               -- 发放日期
    valid_until TEXT,                       -- 有效期至
    status TEXT NOT NULL DEFAULT 'pending', -- pending:待确认, accepted:已接受, rejected:已拒绝, expired:已过期
    content TEXT,                           -- Offer内容
    created_by INTEGER,
    approved_by INTEGER,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> offers 表创建成功');

// ==================== 8. attendance 考勤表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    user_id INTEGER,
    date TEXT NOT NULL,                     -- 考勤日期
    check_in TEXT,                          -- 签到时间
    check_out TEXT,                         -- 签退时间
    check_in_location TEXT,                 -- 签到地点
    check_out_location TEXT,                -- 签退地点
    status TEXT NOT NULL DEFAULT 'normal',  -- normal:正常, late:迟到, early:早退, absent:缺勤, leave:请假, overtime:加班
    late_minutes INTEGER DEFAULT 0,
    early_minutes INTEGER DEFAULT 0,
    work_hours REAL DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(employee_id, date)
  )
`);
console.log('  -> attendance 表创建成功');

// ==================== 9. leaves 请假表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    user_id INTEGER,
    leave_type TEXT NOT NULL,               -- sick:病假, personal:事假, annual:年假, marriage:婚假, maternity:产假, other:其他
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '18:00',
    days REAL NOT NULL DEFAULT 1,           -- 请假天数
    reason TEXT NOT NULL,
    attachment TEXT,                        -- 附件
    status TEXT NOT NULL DEFAULT 'pending', -- pending:待审批, approved:已批准, rejected:已拒绝, cancelled:已取消
    approved_by INTEGER,
    approved_at TEXT,
    approve_remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> leaves 表创建成功');

// ==================== 10. performances 绩效表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    user_id INTEGER,
    period TEXT NOT NULL,                   -- 考核周期 如2024-Q1, 2024-01
    period_type TEXT NOT NULL DEFAULT 'quarterly', -- monthly:月度, quarterly:季度, yearly:年度
    score REAL,                             -- 绩效评分
    grade TEXT,                             -- 等级 S/A/B/C/D
    kpi_content TEXT,                       -- KPI内容
    self_evaluation TEXT,                   -- 自我评价
    manager_evaluation TEXT,                -- 主管评价
    hr_evaluation TEXT,                     -- HR评价
    status TEXT NOT NULL DEFAULT 'pending', -- pending:待考核, self_eval:自评中, manager_eval:主管评中, hr_eval:HR评中, completed:已完成
    rated_by INTEGER,                       -- 评分人
    rated_at TEXT,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(employee_id, period)
  )
`);
console.log('  -> performances 表创建成功');

// ==================== 11. salaries 薪资结构表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS salaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    user_id INTEGER,
    base_salary REAL NOT NULL DEFAULT 0,    -- 基本工资（加密存储）
    base_salary_enc TEXT,                   -- 加密后基本工资
    position_salary REAL DEFAULT 0,         -- 岗位工资（加密存储）
    position_salary_enc TEXT,
    performance_bonus REAL DEFAULT 0,       -- 绩效奖金（加密存储）
    performance_bonus_enc TEXT,
    allowance REAL DEFAULT 0,               -- 津贴（加密存储）
    allowance_enc TEXT,
    social_insurance REAL DEFAULT 0,        -- 社保个人部分（加密存储）
    social_insurance_enc TEXT,
    housing_fund REAL DEFAULT 0,            -- 公积金个人部分（加密存储）
    housing_fund_enc TEXT,
    tax REAL DEFAULT 0,                     -- 个人所得税（加密存储）
    tax_enc TEXT,
    effective_date TEXT NOT NULL,           -- 生效日期
    status TEXT NOT NULL DEFAULT 'active',  -- active:生效中, inactive:已失效
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> salaries 表创建成功');

// ==================== 12. salary_records 工资记录表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS salary_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    salary_id INTEGER,
    user_id INTEGER,
    period TEXT NOT NULL,                   -- 工资月份 如2024-01
    base_salary REAL DEFAULT 0,             -- 基本工资
    position_salary REAL DEFAULT 0,
    performance_bonus REAL DEFAULT 0,
    allowance REAL DEFAULT 0,
    overtime_pay REAL DEFAULT 0,            -- 加班费
    other_additions REAL DEFAULT 0,         -- 其他加项
    social_insurance REAL DEFAULT 0,
    housing_fund REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,        -- 其他扣项
    gross_salary REAL DEFAULT 0,            -- 应发工资
    net_salary REAL DEFAULT 0,              -- 实发工资
    status TEXT NOT NULL DEFAULT 'draft',   -- draft:草稿, confirmed:已确认, paid:已发放
    paid_at TEXT,
    created_by INTEGER,
    confirmed_by INTEGER,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (salary_id) REFERENCES salaries(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(employee_id, period)
  )
`);
console.log('  -> salary_records 表创建成功');

// ==================== 13. operation_logs 操作日志表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                        -- 操作人
    username TEXT,
    real_name TEXT,
    module TEXT NOT NULL,                   -- 操作模块
    action TEXT NOT NULL,                   -- 操作动作
    content TEXT,                           -- 操作内容
    method TEXT,                            -- 请求方法
    url TEXT,                               -- 请求URL
    ip TEXT,                                -- IP地址
    user_agent TEXT,                        -- 浏览器信息
    params TEXT,                            -- 请求参数
    result TEXT,                            -- 操作结果
    status INTEGER NOT NULL DEFAULT 1,      -- 1:成功 0:失败
    execution_time INTEGER,                 -- 执行时间(ms)
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);
console.log('  -> operation_logs 表创建成功');

// ==================== 14. employee_changes 人事变动表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS employee_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    change_type TEXT NOT NULL,
    old_department_id INTEGER,
    new_department_id INTEGER,
    old_position TEXT,
    new_position TEXT,
    old_salary REAL,
    old_salary_enc TEXT,
    new_salary REAL,
    new_salary_enc TEXT,
    effective_date TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    approved_at TEXT,
    reject_reason TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
`);
console.log('  -> employee_changes 表创建成功');

// ==================== 15. resignations 离职申请表 ====================
compatDb.exec(`
  CREATE TABLE IF NOT EXISTS resignations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    reason TEXT,
    resignation_type TEXT DEFAULT 'voluntary',
    expected_date TEXT,
    actual_date TEXT,
    handover_to INTEGER,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    approved_at TEXT,
    reject_reason TEXT,
    confirmed_by INTEGER,
    confirmed_at TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
`);
console.log('  -> resignations 表创建成功');

// 创建索引
console.log('创建索引...');
compatDb.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
  CREATE INDEX IF NOT EXISTS idx_employees_no ON employees(employee_no);
  CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
  CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_resumes_job ON resumes(job_id);
  CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
  CREATE INDEX IF NOT EXISTS idx_interviews_resume ON interviews(resume_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
  CREATE INDEX IF NOT EXISTS idx_leaves_emp ON leaves(employee_id);
  CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
  CREATE INDEX IF NOT EXISTS idx_performances_emp ON performances(employee_id);
  CREATE INDEX IF NOT EXISTS idx_performances_period ON performances(period);
  CREATE INDEX IF NOT EXISTS idx_salaries_emp ON salaries(employee_id);
  CREATE INDEX IF NOT EXISTS idx_salary_records_emp_period ON salary_records(employee_id, period);
  CREATE INDEX IF NOT EXISTS idx_logs_user ON operation_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_logs_module ON operation_logs(module);
  CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_emp_changes_emp ON employee_changes(employee_id);
  CREATE INDEX IF NOT EXISTS idx_emp_changes_status ON employee_changes(status);
  CREATE INDEX IF NOT EXISTS idx_resignations_emp ON resignations(employee_id);
  CREATE INDEX IF NOT EXISTS idx_resignations_status ON resignations(status);
`);

// ==================== 插入默认超级管理员 ====================
console.log('插入默认超级管理员账号...');
const hashedPassword = bcrypt.hashSync('admin123', 10);
const encryptedPhone = encrypt('13800138000');

const insertAdmin = compatDb.prepare(`
  INSERT INTO users (username, password, real_name, email, phone, role, status)
  VALUES (?, ?, ?, ?, ?, 'admin', 1)
`);
insertAdmin.run('admin', hashedPassword, '系统管理员', 'admin@hrsystem.com', encryptedPhone);

// 插入默认部门
const insertDept = compatDb.prepare(`
  INSERT INTO departments (name, code, parent_id, description, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);
const depts = [
  ['总经办', 'ZJB', 0, '公司最高管理机构', 1],
  ['人力资源部', 'HR', 0, '负责公司人力资源管理', 2],
  ['技术部', 'TECH', 0, '负责产品研发和技术支持', 3],
  ['市场部', 'MKT', 0, '负责市场营销和品牌推广', 4],
  ['财务部', 'FIN', 0, '负责公司财务管理', 5]
];
const insertDeptMany = compatDb.transaction((items) => {
  for (const item of items) {
    insertDept.run(...item);
  }
});
insertDeptMany(depts);
console.log('  -> 默认部门数据插入成功');

// ==================== 插入演示用户和员工数据 ====================
console.log('插入演示用户和员工数据...');

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const today = `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`;
const thisMonth = `${year}-${month}`;

// 辅助函数：生成日期字符串
function dateStr(daysAgo) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}
function dateTimeStr(daysAgo, hours, minutes) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours || 9, minutes || 0, 0, 0);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

// 演示用户列表（含各种角色）
const demoUsers = [
  // HR用户
  { username: 'hr01', password: '123456', realName: '张小红', email: 'zhangxh@hrsystem.com', phone: '13800138001', role: 'hr', deptId: 2 },
  // 部门经理
  { username: 'mgr_tech', password: '123456', realName: '李明', email: 'liming@hrsystem.com', phone: '13800138002', role: 'manager', deptId: 3 },
  { username: 'mgr_mkt', password: '123456', realName: '王芳', email: 'wangf@hrsystem.com', phone: '13800138003', role: 'manager', deptId: 4 },
  // 普通员工
  { username: 'emp01', password: '123456', realName: '陈伟', email: 'chenw@hrsystem.com', phone: '13900139001', role: 'employee', deptId: 3 },
  { username: 'emp02', password: '123456', realName: '刘洋', email: 'liuy@hrsystem.com', phone: '13900139002', role: 'employee', deptId: 3 },
  { username: 'emp03', password: '123456', realName: '赵静', email: 'zhaoj@hrsystem.com', phone: '13900139003', role: 'employee', deptId: 3 },
  { username: 'emp04', password: '123456', realName: '孙强', email: 'sunq@hrsystem.com', phone: '13900139004', role: 'employee', deptId: 4 },
  { username: 'emp05', password: '123456', realName: '周丽', email: 'zhoul@hrsystem.com', phone: '13900139005', role: 'employee', deptId: 4 },
  { username: 'emp06', password: '123456', realName: '吴磊', email: 'wul@hrsystem.com', phone: '13900139006', role: 'employee', deptId: 5 },
  { username: 'emp07', password: '123456', realName: '郑雪', email: 'zhengx@hrsystem.com', phone: '13900139007', role: 'employee', deptId: 2 },
  { username: 'emp08', password: '123456', realName: '黄涛', email: 'huangt@hrsystem.com', phone: '13900139008', role: 'employee', deptId: 3 },
  { username: 'emp09', password: '123456', realName: '林梅', email: 'linm@hrsystem.com', phone: '13900139009', role: 'employee', deptId: 1 },
  { username: 'emp10', password: '123456', realName: '何杰', email: 'hej@hrsystem.com', phone: '13900139010', role: 'employee', deptId: 3 },
];

const insertUser = compatDb.prepare(`
  INSERT INTO users (username, password, real_name, email, phone, role, department_id, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1)
`);

const userIds = {};
const insertUserTx = compatDb.transaction((users) => {
  users.forEach(u => {
    const hashed = bcrypt.hashSync(u.password, 10);
    const encPhone = encrypt(u.phone);
    const result = insertUser.run(u.username, hashed, u.realName, u.email, encPhone, u.role, u.deptId);
    userIds[u.username] = result.lastInsertRowid;
  });
});
insertUserTx(demoUsers);
console.log(`  -> ${demoUsers.length}个演示用户插入成功`);

// 插入员工档案
const demoEmployees = [
  { no: 'EMP001', name: '张小红', gender: '女', birth: '1988-03-15', idCard: '110101198803150021', phone: '13800138001', email: 'zhangxh@hrsystem.com', education: '硕士', major: '人力资源管理', deptId: 2, position: 'HR经理', entryDate: dateStr(720), salary: 18000, positionSal: 3000 },
  { no: 'EMP002', name: '李明', gender: '男', birth: '1985-07-22', idCard: '110101198507220031', phone: '13800138002', email: 'liming@hrsystem.com', education: '硕士', major: '计算机科学', deptId: 3, position: '技术总监', entryDate: dateStr(1080), salary: 35000, positionSal: 8000 },
  { no: 'EMP003', name: '王芳', gender: '女', birth: '1987-11-08', idCard: '110101198711080042', phone: '13800138003', email: 'wangf@hrsystem.com', education: '本科', major: '市场营销', deptId: 4, position: '市场总监', entryDate: dateStr(900), salary: 28000, positionSal: 5000 },
  { no: 'EMP004', name: '陈伟', gender: '男', birth: '1992-05-10', idCard: '110101199205100053', phone: '13900139001', email: 'chenw@hrsystem.com', education: '本科', major: '软件工程', deptId: 3, position: '高级工程师', entryDate: dateStr(450), salary: 22000, positionSal: 3000 },
  { no: 'EMP005', name: '刘洋', gender: '男', birth: '1995-01-20', idCard: '110101199501200064', phone: '13900139002', email: 'liuy@hrsystem.com', education: '本科', major: '计算机科学', deptId: 3, position: '前端工程师', entryDate: dateStr(300), salary: 16000, positionSal: 2000 },
  { no: 'EMP006', name: '赵静', gender: '女', birth: '1993-09-12', idCard: '110101199309120075', phone: '13900139003', email: 'zhaoj@hrsystem.com', education: '硕士', major: '人工智能', deptId: 3, position: '算法工程师', entryDate: dateStr(200), salary: 25000, positionSal: 4000 },
  { no: 'EMP007', name: '孙强', gender: '男', birth: '1991-12-03', idCard: '110101199112030086', phone: '13900139004', email: 'sunq@hrsystem.com', education: '本科', major: '广告学', deptId: 4, position: '市场专员', entryDate: dateStr(365), salary: 10000, positionSal: 1500 },
  { no: 'EMP008', name: '周丽', gender: '女', birth: '1994-06-25', idCard: '110101199406250097', phone: '13900139005', email: 'zhoul@hrsystem.com', education: '本科', major: '传播学', deptId: 4, position: '品牌经理', entryDate: dateStr(500), salary: 15000, positionSal: 2500 },
  { no: 'EMP009', name: '吴磊', gender: '男', birth: '1989-08-18', idCard: '110101198908180108', phone: '13900139006', email: 'wul@hrsystem.com', education: '本科', major: '会计学', deptId: 5, position: '财务主管', entryDate: dateStr(600), salary: 17000, positionSal: 2500 },
  { no: 'EMP010', name: '郑雪', gender: '女', birth: '1996-02-14', idCard: '110101199602140119', phone: '13900139007', email: 'zhengx@hrsystem.com', education: '本科', major: '人力资源管理', deptId: 2, position: 'HR专员', entryDate: dateStr(150), salary: 9000, positionSal: 1000 },
  { no: 'EMP011', name: '黄涛', gender: '男', birth: '1990-04-30', idCard: '110101199004300120', phone: '13900139008', email: 'huangt@hrsystem.com', education: '硕士', major: '计算机科学', deptId: 3, position: '测试工程师', entryDate: dateStr(250), salary: 14000, positionSal: 2000 },
  { no: 'EMP012', name: '林梅', gender: '女', birth: '1986-10-05', idCard: '110101198610050131', phone: '13900139009', email: 'linm@hrsystem.com', education: '硕士', major: 'MBA', deptId: 1, position: '总经理助理', entryDate: dateStr(800), salary: 20000, positionSal: 4000 },
  { no: 'EMP013', name: '何杰', gender: '男', birth: '1997-07-19', idCard: '110101199707190142', phone: '13900139010', email: 'hej@hrsystem.com', education: '本科', major: '软件工程', deptId: 3, position: '初级工程师', entryDate: dateStr(60), salary: 10000, positionSal: 1000, status: 'probation' },
];

const insertEmp = compatDb.prepare(`
  INSERT INTO employees (employee_no, name, gender, birth_date, id_card, phone, email, education, major,
    department_id, position, entry_date, contract_start, contract_end, probation_end, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);

const empIds = {};
const empNameToId = {};
const insertEmpTx = compatDb.transaction((emps) => {
  emps.forEach(e => {
    const contractStart = e.entryDate;
    const contractEnd = new Date(contractStart);
    contractEnd.setFullYear(contractEnd.getFullYear() + 3);
    const contractEndStr = contractEnd.toISOString().split('T')[0];
    const probationEnd = new Date(contractStart);
    probationEnd.setMonth(probationEnd.getMonth() + 3);
    const probationEndStr = probationEnd.toISOString().split('T')[0];
    const encIdCard = encrypt(e.idCard);
    const encPhone = encrypt(e.phone);
    const result = insertEmp.run(e.no, e.name, e.gender, e.birth, encIdCard, encPhone, e.email,
      e.education, e.major, e.deptId, e.position, e.entryDate, contractStart, contractEndStr,
      e.status === 'probation' ? probationEndStr : null, e.status || 'active');
    empIds[e.no] = result.lastInsertRowid;
    empNameToId[e.name] = result.lastInsertRowid;
  });
});
insertEmpTx(demoEmployees);
console.log(`  -> ${demoEmployees.length}个员工档案插入成功`);

// 插入薪资结构
const insertSal = compatDb.prepare(`
  INSERT INTO salaries (employee_id, user_id, base_salary, base_salary_enc, position_salary, position_salary_enc,
    performance_bonus, performance_bonus_enc, allowance, allowance_enc, social_insurance, social_insurance_enc,
    housing_fund, housing_fund_enc, tax, tax_enc, effective_date, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now', 'localtime'), datetime('now', 'localtime'))
`);

const insertSalTx = compatDb.transaction((emps) => {
  emps.forEach(e => {
    const eid = empIds[e.no];
    // 查找对应的user_id (通过real_name匹配)
    let uid = null;
    for (const [uname, uidVal] of Object.entries(userIds)) {
      const u = demoUsers.find(u => u.username === uname);
      if (u && u.realName === e.name) { uid = uidVal; break; }
    }
    const base = e.salary;
    const posSal = e.positionSal;
    const bonus = Math.round(base * 0.15);
    const allowance = 1000;
    const socialIns = Math.round(base * 0.105); // 社保个人约10.5%
    const housingFd = Math.round(base * 0.12);  // 公积金12%
    const gross = base + posSal + bonus + allowance;
    const taxBase = gross - socialIns - housingFd - 5000;
    const tax = taxBase > 0 ? Math.round(taxBase * 0.1) : 0;
    insertSal.run(eid, uid, base, encrypt(String(base)), posSal, encrypt(String(posSal)),
      bonus, encrypt(String(bonus)), allowance, encrypt(String(allowance)),
      socialIns, encrypt(String(socialIns)), housingFd, encrypt(String(housingFd)),
      tax, encrypt(String(tax)), e.entryDate);
  });
});
insertSalTx(demoEmployees);
console.log('  -> 薪资结构数据插入成功');

// 插入近3个月工资记录
const insertSalRec = compatDb.prepare(`
  INSERT INTO salary_records (employee_id, salary_id, user_id, period, base_salary, position_salary,
    performance_bonus, allowance, overtime_pay, other_additions, social_insurance, housing_fund,
    tax, other_deductions, gross_salary, net_salary, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', datetime('now', 'localtime'), datetime('now', 'localtime'))
`);

const salRecTx = compatDb.transaction(() => {
  for (let m = 2; m >= 0; m--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - m);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    demoEmployees.forEach(e => {
      const eid = empIds[e.no];
      let uid = null;
      for (const [uname, uidVal] of Object.entries(userIds)) {
        const u = demoUsers.find(u => u.username === uname);
        if (u && u.realName === e.name) { uid = uidVal; break; }
      }
      // 获取salary_id
      const salInfo = db.exec(`SELECT id FROM salaries WHERE employee_id = ${eid} AND status = 'active' LIMIT 1`);
      let salId = null;
      if (salInfo.length > 0 && salInfo[0].values.length > 0) {
        salId = salInfo[0].values[0][0];
      }
      const base = e.salary;
      const posSal = e.positionSal;
      const bonus = Math.round(base * (0.1 + Math.random() * 0.1));
      const allowance = 1000;
      const overtimePay = Math.round(Math.random() * 500);
      const socialIns = Math.round(base * 0.105);
      const housingFd = Math.round(base * 0.12);
      const gross = base + posSal + bonus + allowance + overtimePay;
      const taxBase = gross - socialIns - housingFd - 5000;
      const tax = taxBase > 0 ? Math.round(taxBase * 0.1) : 0;
      const net = gross - socialIns - housingFd - tax;
      try {
        insertSalRec.run(eid, salId, uid, period, base, posSal, bonus, allowance, overtimePay, 0,
          socialIns, housingFd, tax, 0, gross, net);
      } catch(e) {} // UNIQUE约束冲突则跳过
    });
  }
});
salRecTx();
console.log('  -> 工资记录数据插入成功（近3个月）');

// 插入招聘职位
const demoJobs = [
  { title: '高级Java开发工程师', deptId: 3, desc: '负责后端核心系统开发', req: '本科及以上，5年以上Java开发经验，熟悉Spring Boot、微服务架构', salaryRange: '25K-40K', location: '北京', headcount: 3 },
  { title: '前端开发工程师', deptId: 3, desc: '负责公司产品前端开发', req: '本科及以上，3年以上React/Vue开发经验，熟悉TypeScript', salaryRange: '18K-30K', location: '北京', headcount: 2 },
  { title: '产品经理', deptId: 3, desc: '负责HR SaaS产品规划', req: '本科及以上，3年以上B端产品经验，有人力资源领域经验优先', salaryRange: '20K-35K', location: '北京', headcount: 1 },
  { title: '市场推广专员', deptId: 4, desc: '负责品牌推广和市场活动', req: '本科及以上，2年以上市场推广经验，具备良好的文案能力', salaryRange: '10K-18K', location: '北京', headcount: 2 },
  { title: 'HR招聘专员', deptId: 2, desc: '负责技术岗位招聘', req: '本科及以上，2年以上IT行业招聘经验', salaryRange: '8K-15K', location: '北京', headcount: 1 },
];

const insertJob = compatDb.prepare(`
  INSERT INTO jobs (title, department_id, description, requirements, salary_range, location, headcount,
    status, publish_date, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'open', date('now'), 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
const jobIds = [];
demoJobs.forEach(j => {
  const r = insertJob.run(j.title, j.deptId, j.desc, j.req, j.salaryRange, j.location, j.headcount);
  jobIds.push(r.lastInsertRowid);
});
console.log(`  -> ${demoJobs.length}个招聘职位插入成功`);

// 插入简历数据（各种状态）
const demoResumes = [
  { jobIdx: 0, name: '马超', gender: '男', phone: '13700137001', email: 'machao@qq.com', edu: '本科', years: 6, source: 'BOSS直聘', status: 'interview' },
  { jobIdx: 0, name: '徐达', gender: '男', phone: '13700137002', email: 'xuda@qq.com', edu: '硕士', years: 8, source: '猎聘', status: 'offer' },
  { jobIdx: 0, name: '朱琳', gender: '女', phone: '13700137003', email: 'zhul@163.com', edu: '本科', years: 4, source: '智联招聘', status: 'hired' },
  { jobIdx: 1, name: '胡伟', gender: '男', phone: '13700137004', email: 'huw@gmail.com', edu: '本科', years: 3, source: 'BOSS直聘', status: 'screening' },
  { jobIdx: 1, name: '郭婷', gender: '女', phone: '13700137005', email: 'guot@qq.com', edu: '本科', years: 2, source: '拉勾网', status: 'pending' },
  { jobIdx: 1, name: '林峰', gender: '男', phone: '13700137006', email: 'linf@163.com', edu: '硕士', years: 5, source: '内推', status: 'interview' },
  { jobIdx: 2, name: '何静', gender: '女', phone: '13700137007', email: 'hej@qq.com', edu: '本科', years: 4, source: 'BOSS直聘', status: 'screening' },
  { jobIdx: 2, name: '罗敏', gender: '女', phone: '13700137008', email: 'luom@gmail.com', edu: '硕士', years: 5, source: '猎聘', status: 'offer' },
  { jobIdx: 3, name: '郑浩', gender: '男', phone: '13700137009', email: 'zhengh@qq.com', edu: '本科', years: 2, source: '智联招聘', status: 'pending' },
  { jobIdx: 3, name: '梁雪', gender: '女', phone: '13700137010', email: 'liangx@163.com', edu: '本科', years: 3, source: 'BOSS直聘', status: 'rejected' },
  { jobIdx: 4, name: '宋涛', gender: '男', phone: '13700137011', email: 'songt@qq.com', edu: '本科', years: 2, source: '拉勾网', status: 'screening' },
  { jobIdx: 0, name: '谢芳', gender: '女', phone: '13700137012', email: 'xief@gmail.com', edu: '硕士', years: 7, source: '猎头', status: 'hired' },
];

const insertResume = compatDb.prepare(`
  INSERT INTO resumes (job_id, name, gender, phone, email, education, work_years, source, status,
    hr_user_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const resumeIds = [];
demoResumes.forEach(r => {
  const jid = jobIds[r.jobIdx];
  const encPhone = encrypt(r.phone);
  const createdAt = dateTimeStr(Math.floor(Math.random() * 30) + 1, 10, 0);
  const result = insertResume.run(jid, r.name, r.gender, encPhone, r.email, r.edu, r.years, r.source, r.status, userIds['hr01'], createdAt, createdAt);
  resumeIds.push({ id: result.lastInsertRowid, jobId: jid, status: r.status, name: r.name });
});
console.log(`  -> ${demoResumes.length}份简历插入成功`);

// 插入面试记录
const interviewStatuses = { 'interview': 'scheduled', 'offer': 'passed', 'hired': 'passed', 'rejected': 'failed' };
const insertInterview = compatDb.prepare(`
  INSERT INTO interviews (resume_id, job_id, round, interview_type, interviewer_id, scheduled_at,
    duration_minutes, location, status, feedback, score, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
resumeIds.forEach(r => {
  if (['interview', 'offer', 'hired', 'rejected'].includes(r.status)) {
    const isPassed = ['offer', 'hired'].includes(r.status);
    const isFailed = r.status === 'rejected';
    const status = isPassed ? 'passed' : (isFailed ? 'failed' : 'scheduled');
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + (status === 'scheduled' ? 3 : -5));
    const scheduledStr = scheduledDate.toISOString().replace('T', ' ').substring(0, 19);
    const feedback = isPassed ? '技术能力扎实，沟通良好，建议录用' : (isFailed ? '经验不足，暂不录用' : null);
    const score = isPassed ? 85 : (isFailed ? 50 : null);
    insertInterview.run(r.id, r.jobId, 1, 'onsite', userIds['mgr_tech'], scheduledStr, 60, '会议室A', status, feedback, score, scheduledStr, scheduledStr);
  }
});
console.log('  -> 面试记录插入成功');

// 插入Offer记录
const insertOffer = compatDb.prepare(`
  INSERT INTO offers (resume_id, job_id, offer_no, salary, salary_encrypted, position, department_id,
    entry_date, offer_date, valid_until, status, content, created_by, approved_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), date('now', '+7 days'), 'accepted', ?, 1, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
resumeIds.filter(r => ['offer', 'hired'].includes(r.status)).forEach((r, idx) => {
  const job = demoJobs[r.jobId];
  const salary = r.status === 'hired' ? 28000 : 25000;
  const entryD = r.status === 'hired' ? dateStr(10) : dateStr(30);
  insertOffer.run(r.id, r.jobId, `OF${year}${month}${String(idx + 1).padStart(3, '0')}`, salary, encrypt(String(salary)), job.title.replace('高级', '').replace('工程师', '工程师'), job.deptId, entryD, `恭喜您通过面试，正式录用您为${job.title}职位，薪资${salary}元/月。`);
});
console.log('  -> Offer记录插入成功');

// 插入考勤记录（最近30天工作日）
const insertAttendance = compatDb.prepare(`
  INSERT OR IGNORE INTO attendance (employee_id, user_id, date, check_in, check_out, status,
    late_minutes, early_minutes, work_hours, overtime_hours, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);

const attTx = compatDb.transaction(() => {
  for (let d = 29; d >= 0; d--) {
    const attDate = new Date(now);
    attDate.setDate(attDate.getDate() - d);
    const dayOfWeek = attDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // 跳过周末
    const dateStr2 = attDate.toISOString().split('T')[0];

    demoEmployees.forEach(e => {
      if (e.status === 'probation' && d < 30) return; // 试用期员工只有最近的记录
      const eid = empIds[e.no];
      let uid = null;
      for (const [uname, uidVal] of Object.entries(userIds)) {
        const u = demoUsers.find(u => u.username === uname);
        if (u && u.realName === e.name) { uid = uidVal; break; }
      }
      // 随机考勤状态
      const rand = Math.random();
      let status = 'normal', lateMin = 0, earlyMin = 0, overtimeH = 0;
      let checkIn = '09:00:00', checkOut = '18:00:00';
      if (rand < 0.08) {
        status = 'late'; lateMin = Math.floor(Math.random() * 30) + 5;
        checkIn = `09:${String(lateMin).padStart(2, '0')}:00`;
      } else if (rand < 0.12) {
        status = 'early'; earlyMin = Math.floor(Math.random() * 30) + 5;
        checkOut = `17:${String(60 - earlyMin).padStart(2, '0')}:00`;
      } else if (rand < 0.15) {
        status = 'overtime'; overtimeH = Math.floor(Math.random() * 3) + 1;
        const outHour = 18 + overtimeH;
        checkOut = `${outHour}:00:00`;
      }
      const workH = 8 + overtimeH - lateMin / 60 - earlyMin / 60;
      insertAttendance.run(eid, uid, dateStr2, `${dateStr2} ${checkIn}`, `${dateStr2} ${checkOut}`, status, lateMin, earlyMin, workH.toFixed(1), overtimeH);
    });
  }
});
attTx();
console.log('  -> 考勤记录插入成功（最近30天工作日）');

// 插入请假记录
const demoLeaves = [
  { empName: '刘洋', type: 'sick', start: dateStr(5), end: dateStr(5), days: 1, reason: '感冒发烧，需休息一天', status: 'approved' },
  { empName: '赵静', type: 'annual', start: dateStr(10), end: dateStr(12), days: 3, reason: '年假休息，回老家探亲', status: 'approved' },
  { empName: '孙强', type: 'personal', start: dateStr(3), end: dateStr(3), days: 0.5, reason: '家中有事，需请假半天处理', status: 'pending' },
  { empName: '周丽', type: 'sick', start: dateStr(15), end: dateStr(16), days: 2, reason: '急性肠胃炎，需休息两天', status: 'approved' },
  { empName: '郑雪', type: 'personal', start: dateStr(1), end: dateStr(1), days: 1, reason: '办理个人事务', status: 'pending' },
];

const insertLeave = compatDb.prepare(`
  INSERT INTO leaves (employee_id, user_id, leave_type, start_date, end_date, days, reason, status,
    approved_by, approved_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
demoLeaves.forEach(l => {
  const eid = empNameToId[l.empName];
  let uid = null;
  for (const [uname, uidVal] of Object.entries(userIds)) {
    const u = demoUsers.find(u => u.username === uname);
    if (u && u.realName === l.empName) { uid = uidVal; break; }
  }
  const approvedBy = l.status === 'approved' ? userIds['hr01'] : null;
  const approvedAt = l.status === 'approved' ? dateTimeStr(2, 14, 0) : null;
  insertLeave.run(eid, uid, l.type, l.start, l.end, l.days, l.reason, l.status, approvedBy, approvedAt);
});
console.log(`  -> ${demoLeaves.length}条请假记录插入成功`);

// 插入绩效考核记录
const demoPerformances = [
  { empName: '陈伟', period: `${year}-Q2`, score: 88, grade: 'A', kpi: '完成核心模块开发，代码质量优秀', self: '本季度完成了3个重要功能模块，代码review通过率95%', mgr: '工作积极主动，技术能力强，建议晋升' },
  { empName: '刘洋', period: `${year}-Q2`, score: 78, grade: 'B', kpi: '完成前端页面开发任务', self: '按时完成分配的开发任务', mgr: '表现稳定，有进步空间' },
  { empName: '赵静', period: `${year}-Q2`, score: 92, grade: 'S', kpi: '主导算法优化，提升系统性能30%', self: '完成算法优化项目，性能指标超额完成', mgr: '技术突出，贡献重大' },
  { empName: '孙强', period: `${year}-Q2`, score: 72, grade: 'B', kpi: '完成市场推广活动', self: '参与了2次大型市场活动', mgr: '执行力不错，但创意不足' },
  { empName: '周丽', period: `${year}-Q2`, score: 85, grade: 'A', kpi: '品牌曝光量提升50%', self: '成功策划了品牌宣传活动', mgr: '业绩优秀，继续保持' },
  { empName: '吴磊', period: `${year}-Q2`, score: 80, grade: 'B', kpi: '财务报表按时完成', self: '按时完成月结和报表工作', mgr: '工作认真负责' },
  { empName: '郑雪', period: `${year}-Q2`, score: 82, grade: 'B', kpi: '完成招聘任务', self: '本季度招聘到岗5人', mgr: '招聘效率高，继续加油' },
  { empName: '黄涛', period: `${year}-Q2`, score: 75, grade: 'B', kpi: '完成测试任务', self: '完成了所有分配的测试用例', mgr: '工作细致，需提升自动化能力' },
  { empName: '林梅', period: `${year}-Q2`, score: 90, grade: 'A', kpi: '协助总经理完成年度规划', self: '协助完成公司战略规划文档', mgr: '能力全面，值得信赖' },
];

const insertPerf = compatDb.prepare(`
  INSERT INTO performances (employee_id, user_id, period, period_type, score, grade, kpi_content,
    self_evaluation, manager_evaluation, status, rated_by, rated_at, created_at, updated_at)
  VALUES (?, ?, ?, 'quarterly', ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
demoPerformances.forEach(p => {
  const eid = empNameToId[p.empName];
  let uid = null;
  for (const [uname, uidVal] of Object.entries(userIds)) {
    const u = demoUsers.find(u => u.username === uname);
    if (u && u.realName === p.empName) { uid = uidVal; break; }
  }
  insertPerf.run(eid, uid, p.period, p.score, p.grade, p.kpi, p.self, p.mgr, userIds['mgr_tech'], dateTimeStr(5, 10, 0));
});
console.log(`  -> ${demoPerformances.length}条绩效记录插入成功`);

// 插入人事变动记录
const insertChangeApproved = compatDb.prepare(`
  INSERT INTO employee_changes (employee_id, change_type, old_department_id, new_department_id,
    old_position, new_position, old_salary, old_salary_enc, new_salary, new_salary_enc,
    effective_date, reason, status, approved_by, approved_at, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
const insertChangePending = compatDb.prepare(`
  INSERT INTO employee_changes (employee_id, change_type, old_department_id, new_department_id,
    old_position, new_position, old_salary, old_salary_enc, new_salary, new_salary_enc,
    effective_date, reason, status, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
// 赵静晋升（技术部算法工程师 -> 高级算法工程师，薪资从25000到30000）
const zhaoJingEid = empNameToId['赵静'];
insertChangeApproved.run(zhaoJingEid, 'promotion', 3, 3, '算法工程师', '高级算法工程师', 25000, encrypt('25000'), 30000, encrypt('30000'), dateStr(15), '表现优秀，晋升为高级算法工程师', userIds['mgr_tech'], dateTimeStr(14, 15, 0), userIds['hr01']);
// 刘洋降薪（待审批）
const liuYangEid = empNameToId['刘洋'];
insertChangePending.run(liuYangEid, 'salary_cut', 3, 3, '前端工程师', '前端工程师', 16000, encrypt('16000'), 14000, encrypt('14000'), dateStr(7), '试用期表现未达预期，调整薪资', userIds['mgr_tech']);
console.log('  -> 人事变动记录插入成功');

// 插入离职记录
const insertResign = compatDb.prepare(`
  INSERT INTO resignations (employee_id, reason, resignation_type, expected_date,
    status, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'pending', ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
`);
// 一个待审批的离职申请（黄涛-测试工程师，因个人原因申请离职）
const huangTaoEid = empNameToId['黄涛'];
if (huangTaoEid) {
  insertResign.run(huangTaoEid, '回老家发展，申请离职', 'voluntary', dateStr(30), userIds['mgr_tech']);
}
console.log('  -> 离职记录插入成功');

// 持久化数据库到文件
save();
console.log('数据库已持久化到文件:', dbPath);

console.log('\n========================================');
console.log('数据库初始化完成！');
console.log('默认管理员账号: admin / admin123');
console.log('========================================\n');
}

main().catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
