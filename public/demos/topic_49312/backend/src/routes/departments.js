/**
 * 部门管理路由
 */
const express = require('express');
const dayjs = require('dayjs');
const db = require('../utils/db');
const { success, fail, badRequest, notFound, page } = require('../utils/response');
const { authenticate, requireAdminOrHR } = require('../middleware/auth');
const operationLogger = require('../middleware/logger');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/departments
 * 获取部门列表（树形结构）
 */
router.get('/', operationLogger('部门管理'), (req, res) => {
  const { keyword = '', status = '' } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (name LIKE ? OR code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status !== '') {
    where += ' AND status = ?';
    params.push(parseInt(status));
  }

  const list = db.prepare(`
    SELECT d.*, m.real_name as manager_name,
           (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.status = 'active') as employee_count
    FROM departments d
    LEFT JOIN users m ON d.manager_id = m.id
    ${where}
    ORDER BY d.sort_order ASC, d.id ASC
  `).all(...params);

  success(res, list);
});

/**
 * GET /api/departments/tree
 * 获取部门树形结构
 */
router.get('/tree', operationLogger('部门管理'), (req, res) => {
  const allDepts = db.prepare(`
    SELECT d.*, m.real_name as manager_name,
           (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.status = 'active') as employee_count
    FROM departments d
    LEFT JOIN users m ON d.manager_id = m.id
    WHERE d.status = 1
    ORDER BY d.sort_order ASC, d.id ASC
  `).all();

  // 构建树形结构
  const map = {};
  const roots = [];

  allDepts.forEach(dept => {
    map[dept.id] = { ...dept, children: [] };
  });

  allDepts.forEach(dept => {
    if (dept.parent_id === 0) {
      roots.push(map[dept.id]);
    } else if (map[dept.parent_id]) {
      map[dept.parent_id].children.push(map[dept.id]);
    } else {
      roots.push(map[dept.id]);
    }
  });

  success(res, roots);
});

/**
 * GET /api/departments/:id
 * 获取部门详情
 */
router.get('/:id', operationLogger('部门管理'), (req, res) => {
  const { id } = req.params;
  const dept = db.prepare(`
    SELECT d.*, m.real_name as manager_name,
           (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.status = 'active') as employee_count
    FROM departments d
    LEFT JOIN users m ON d.manager_id = m.id
    WHERE d.id = ?
  `).get(parseInt(id));

  if (!dept) {
    return notFound(res, '部门不存在');
  }

  success(res, dept);
});

/**
 * POST /api/departments
 * 创建部门
 */
router.post('/', requireAdminOrHR, operationLogger('部门管理'), (req, res) => {
  const { name, code, parentId = 0, managerId, description, sortOrder = 0, status = 1 } = req.body;

  if (!name || !code) {
    return badRequest(res, '部门名称和编码不能为空');
  }

  const existCode = db.prepare('SELECT id FROM departments WHERE code = ?').get(code);
  if (existCode) {
    return fail(res, '部门编码已存在', 400);
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const stmt = db.prepare(`
    INSERT INTO departments (name, code, parent_id, manager_id, description, sort_order, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, code, parentId, managerId || null, description || null, sortOrder, status, now, now);

  success(res, { id: result.lastInsertRowid }, '部门创建成功', 201);
});

/**
 * PUT /api/departments/:id
 * 更新部门
 */
router.put('/:id', requireAdminOrHR, operationLogger('部门管理'), (req, res) => {
  const { id } = req.params;
  const { name, code, parentId, managerId, description, sortOrder, status } = req.body;

  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(parseInt(id));
  if (!dept) {
    return notFound(res, '部门不存在');
  }

  if (code && code !== dept.code) {
    const existCode = db.prepare('SELECT id FROM departments WHERE code = ? AND id != ?').get(code, parseInt(id));
    if (existCode) {
      return fail(res, '部门编码已存在', 400);
    }
  }

  // 不能将自己设为自己的父级
  if (parentId && parseInt(parentId) === parseInt(id)) {
    return fail(res, '上级部门不能选择自己', 400);
  }

  db.prepare(`
    UPDATE departments SET name = ?, code = ?, parent_id = ?, manager_id = ?, description = ?, sort_order = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    name || dept.name,
    code || dept.code,
    parentId !== undefined ? parentId : dept.parent_id,
    managerId !== undefined ? managerId : dept.manager_id,
    description !== undefined ? description : dept.description,
    sortOrder !== undefined ? sortOrder : dept.sort_order,
    status !== undefined ? status : dept.status,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
    parseInt(id)
  );

  success(res, null, '部门更新成功');
});

/**
 * DELETE /api/departments/:id
 * 删除部门
 */
router.delete('/:id', requireAdminOrHR, operationLogger('部门管理'), (req, res) => {
  const { id } = req.params;

  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(parseInt(id));
  if (!dept) {
    return notFound(res, '部门不存在');
  }

  // 检查是否有子部门
  const childCount = db.prepare('SELECT COUNT(*) as count FROM departments WHERE parent_id = ?').get(parseInt(id)).count;
  if (childCount > 0) {
    return fail(res, '该部门下存在子部门，无法删除', 400);
  }

  // 检查是否有员工
  const empCount = db.prepare("SELECT COUNT(*) as count FROM employees WHERE department_id = ? AND status = 'active'").get(parseInt(id)).count;
  if (empCount > 0) {
    return fail(res, '该部门下存在在职员工，无法删除', 400);
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(parseInt(id));
  success(res, null, '部门删除成功');
});

module.exports = router;
