/**
 * BI数据报表路由
 * 包含：招聘看板、人员结构看板、异动流失看板、考勤人效看板、人力成本看板
 */
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticate, requireRoles } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { decrypt } = require('../utils/crypto');

// 所有报表接口需要登录
router.use(authenticate);

/**
 * 权限校验中间件
 * - admin / hr: 可查看全公司所有报表数据
 * - manager: 只能查看本部门数据（通过department_id过滤）
 * - employee: 无权限访问（返回403）
 */
function checkReportPermission(req, res, next) {
  const role = req.userRole;
  if (role === 'admin' || role === 'hr') {
    // 全公司数据权限
    req.reportScope = 'all';
    req.reportDepartmentId = null;
    return next();
  }
  if (role === 'manager') {
    // 仅本部门数据权限
    req.reportScope = 'department';
    req.reportDepartmentId = req.user.department_id;
    return next();
  }
  return fail(res, '无权限访问报表数据', 403);
}

/**
 * 获取部门过滤条件
 */
function getDepartmentFilter(scope, departmentId) {
  if (scope === 'department' && departmentId) {
    return { clause: 'e.department_id = ?', params: [departmentId] };
  }
  return { clause: '1=1', params: [] };
}

// ==================== 1. 招聘看板 ====================

/**
 * GET /api/reports/recruitment - 招聘看板
 * - 岗位投递量（每个岗位的简历数量）
 * - 简历转化率（各状态简历占比）
 * - 面试通过率（通过数/总面试数）
 * - 入职率（已入职数/总简历数）
 * - 平均招聘周期（从简历创建到入职的平均天数）
 * - 各渠道招聘质量统计
 */
router.get('/recruitment', checkReportPermission, (req, res) => {
  try {
    const deptFilter = getDepartmentFilter(req.reportScope, req.reportDepartmentId);

    // 1. 岗位投递量（每个岗位的简历数量）
    const jobApplications = db.prepare(`
      SELECT j.id as job_id, j.title as job_name, j.department_id,
        COUNT(r.id) as resume_count
      FROM jobs j
      LEFT JOIN resumes r ON r.job_id = j.id
      ${req.reportScope === 'department' ? 'WHERE j.department_id = ?' : ''}
      GROUP BY j.id, j.title, j.department_id
      ORDER BY resume_count DESC
    `).all(...(deptFilter.params));

    // 2. 简历转化率（各状态简历占比）
    const resumeStatusStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN r.status = 'screening' THEN 1 ELSE 0 END) as screening_count,
        SUM(CASE WHEN r.status = 'interview' THEN 1 ELSE 0 END) as interview_count,
        SUM(CASE WHEN r.status = 'offer' THEN 1 ELSE 0 END) as offer_count,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN r.status = 'hired' THEN 1 ELSE 0 END) as hired_count
      FROM resumes r
      LEFT JOIN jobs j ON r.job_id = j.id
      WHERE ${req.reportScope === 'department' ? 'j.department_id = ?' : '1=1'}
    `).get(...(deptFilter.params));

    const totalResumes = resumeStatusStats.total || 0;
    const resumeConversionRate = {
      total: totalResumes,
      pending: { count: resumeStatusStats.pending_count || 0, rate: totalResumes > 0 ? parseFloat(((resumeStatusStats.pending_count || 0) / totalResumes * 100).toFixed(1)) : 0 },
      screening: { count: resumeStatusStats.screening_count || 0, rate: totalResumes > 0 ? parseFloat(((resumeStatusStats.screening_count || 0) / totalResumes * 100).toFixed(1)) : 0 },
      interview: { count: resumeStatusStats.interview_count || 0, rate: totalResumes > 0 ? parseFloat(((resumeStatusStats.interview_count || 0) / totalResumes * 100).toFixed(1)) : 0 },
      offer: { count: resumeStatusStats.offer_count || 0, rate: totalResumes > 0 ? parseFloat(((resumeStatusStats.offer_count || 0) / totalResumes * 100).toFixed(1)) : 0 },
      rejected: { count: resumeStatusStats.rejected_count || 0, rate: totalResumes > 0 ? parseFloat(((resumeStatusStats.rejected_count || 0) / totalResumes * 100).toFixed(1)) : 0 },
      hired: { count: resumeStatusStats.hired_count || 0, rate: totalResumes > 0 ? parseFloat(((resumeStatusStats.hired_count || 0) / totalResumes * 100).toFixed(1)) : 0 }
    };

    // 3. 面试通过率（通过数/总面试数）
    const interviewStats = db.prepare(`
      SELECT
        COUNT(*) as total_interviews,
        SUM(CASE WHEN i.status = 'passed' THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN i.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN i.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN i.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count
      FROM interviews i
      LEFT JOIN jobs j ON i.job_id = j.id
      WHERE ${req.reportScope === 'department' ? 'j.department_id = ?' : '1=1'}
    `).get(...(deptFilter.params));

    const totalInterviews = interviewStats.total_interviews || 0;
    const interviewPassRate = {
      total: totalInterviews,
      passed: interviewStats.passed_count || 0,
      failed: interviewStats.failed_count || 0,
      cancelled: interviewStats.cancelled_count || 0,
      scheduled: interviewStats.scheduled_count || 0,
      passRate: totalInterviews > 0 ? parseFloat(((interviewStats.passed_count || 0) / totalInterviews * 100).toFixed(1)) : 0
    };

    // 4. 入职率（已入职数/总简历数）
    const hireRate = totalResumes > 0
      ? parseFloat(((resumeStatusStats.hired_count || 0) / totalResumes * 100).toFixed(1))
      : 0;

    // 5. 平均招聘周期（从简历创建到入职的平均天数）
    const avgCycleRows = db.prepare(`
      SELECT r.created_at, o.entry_date
      FROM resumes r
      LEFT JOIN jobs j ON r.job_id = j.id
      LEFT JOIN offers o ON o.resume_id = r.id AND o.status = 'accepted'
      WHERE r.status = 'hired'
        ${req.reportScope === 'department' ? 'AND j.department_id = ?' : ''}
        AND o.entry_date IS NOT NULL
    `).all(...(deptFilter.params));

    let totalDays = 0;
    let validCount = 0;
    avgCycleRows.forEach(row => {
      if (row.created_at && row.entry_date) {
        const created = new Date(row.created_at);
        const entry = new Date(row.entry_date);
        const diffDays = Math.ceil((entry - created) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          totalDays += diffDays;
          validCount++;
        }
      }
    });
    const avgRecruitmentCycle = validCount > 0 ? parseFloat((totalDays / validCount).toFixed(1)) : 0;

    // 6. 各渠道招聘质量统计
    const sourceStats = db.prepare(`
      SELECT
        COALESCE(r.source, '未知') as source,
        COUNT(r.id) as total_resumes,
        SUM(CASE WHEN r.status = 'hired' THEN 1 ELSE 0 END) as hired_count,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN r.status = 'interview' THEN 1 ELSE 0 END) as interview_count
      FROM resumes r
      LEFT JOIN jobs j ON r.job_id = j.id
      WHERE ${req.reportScope === 'department' ? 'j.department_id = ?' : '1=1'}
      GROUP BY r.source
      ORDER BY total_resumes DESC
    `).all(...(deptFilter.params));

    const sourceQuality = sourceStats.map(s => ({
      source: s.source,
      totalResumes: s.total_resumes,
      hiredCount: s.hired_count,
      rejectedCount: s.rejected_count,
      interviewCount: s.interview_count,
      hireRate: s.total_resumes > 0 ? parseFloat(((s.hired_count / s.total_resumes) * 100).toFixed(1)) : 0
    }));

    return success(res, {
      jobApplications,
      resumeConversionRate,
      interviewPassRate,
      hireRate,
      avgRecruitmentCycle,
      sourceQuality
    }, '招聘看板数据获取成功');
  } catch (err) {
    console.error('招聘看板查询失败:', err);
    return fail(res, '招聘看板数据查询失败', 500);
  }
});

// ==================== 2. 人员结构看板 ====================

/**
 * GET /api/reports/staffing - 人员结构看板
 * - 部门人数分布
 * - 学历分布
 * - 年龄段分布
 * - 司龄分布
 * - 编制使用率
 */
router.get('/staffing', checkReportPermission, (req, res) => {
  try {
    const now = new Date();
    const deptFilter = getDepartmentFilter(req.reportScope, req.reportDepartmentId);

    // 1. 部门人数分布
    const deptDistribution = db.prepare(`
      SELECT d.id as department_id, d.name as department_name, COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      ${req.reportScope === 'department' ? 'WHERE d.id = ?' : ''}
      GROUP BY d.id, d.name
      ORDER BY employee_count DESC
    `).all(...(deptFilter.params));

    // 2. 学历分布
    const educationDistribution = db.prepare(`
      SELECT
        CASE
          WHEN e.education IS NULL OR e.education = '' THEN '其他'
          ELSE e.education
        END as education,
        COUNT(e.id) as count
      FROM employees e
      WHERE e.status = 'active'
        ${req.reportScope === 'department' ? 'AND e.department_id = ?' : ''}
      GROUP BY education
      ORDER BY count DESC
    `).all(...(deptFilter.params));

    // 3. 年龄段分布
    const ageDistribution = db.prepare(`
      SELECT
        CASE
          WHEN e.birth_date IS NULL THEN '未知'
          WHEN CAST((julianday('now') - julianday(e.birth_date)) / 365.25 AS INTEGER) < 25 THEN '25岁以下'
          WHEN CAST((julianday('now') - julianday(e.birth_date)) / 365.25 AS INTEGER) BETWEEN 25 AND 30 THEN '25-30岁'
          WHEN CAST((julianday('now') - julianday(e.birth_date)) / 365.25 AS INTEGER) BETWEEN 31 AND 35 THEN '31-35岁'
          WHEN CAST((julianday('now') - julianday(e.birth_date)) / 365.25 AS INTEGER) BETWEEN 36 AND 40 THEN '36-40岁'
          WHEN CAST((julianday('now') - julianday(e.birth_date)) / 365.25 AS INTEGER) BETWEEN 41 AND 50 THEN '41-50岁'
          ELSE '50岁以上'
        END as age_range,
        COUNT(e.id) as count
      FROM employees e
      WHERE e.status = 'active'
        ${req.reportScope === 'department' ? 'AND e.department_id = ?' : ''}
      GROUP BY age_range
      ORDER BY
        CASE age_range
          WHEN '25岁以下' THEN 1
          WHEN '25-30岁' THEN 2
          WHEN '31-35岁' THEN 3
          WHEN '36-40岁' THEN 4
          WHEN '41-50岁' THEN 5
          WHEN '50岁以上' THEN 6
          ELSE 7
        END
    `).all(...(deptFilter.params));

    // 4. 司龄分布（按入职时间计算）
    const tenureDistribution = db.prepare(`
      SELECT
        CASE
          WHEN e.entry_date IS NULL THEN '未知'
          WHEN CAST((julianday('now') - julianday(e.entry_date)) / 365.25 AS INTEGER) < 1 THEN '1年以下'
          WHEN CAST((julianday('now') - julianday(e.entry_date)) / 365.25 AS INTEGER) BETWEEN 1 AND 3 THEN '1-3年'
          WHEN CAST((julianday('now') - julianday(e.entry_date)) / 365.25 AS INTEGER) BETWEEN 3 AND 5 THEN '3-5年'
          WHEN CAST((julianday('now') - julianday(e.entry_date)) / 365.25 AS INTEGER) BETWEEN 5 AND 10 THEN '5-10年'
          ELSE '10年以上'
        END as tenure_range,
        COUNT(e.id) as count
      FROM employees e
      WHERE e.status = 'active'
        ${req.reportScope === 'department' ? 'AND e.department_id = ?' : ''}
      GROUP BY tenure_range
      ORDER BY
        CASE tenure_range
          WHEN '1年以下' THEN 1
          WHEN '1-3年' THEN 2
          WHEN '3-5年' THEN 3
          WHEN '5-10年' THEN 4
          WHEN '10年以上' THEN 5
          ELSE 6
        END
    `).all(...(deptFilter.params));

    // 5. 编制使用率（在岗人数/招聘总需求）
    const headcountData = db.prepare(`
      SELECT
        SUM(CASE WHEN j.status = 'open' THEN j.headcount ELSE 0 END) as total_headcount
      FROM jobs j
      ${req.reportScope === 'department' ? 'WHERE j.department_id = ?' : ''}
    `).get(...(deptFilter.params));

    const activeCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM employees e
      WHERE e.status = 'active'
        ${req.reportScope === 'department' ? 'AND e.department_id = ?' : ''}
    `).get(...(deptFilter.params));

    const totalHeadcount = headcountData.total_headcount || 0;
    const totalActive = activeCount.count || 0;
    const staffingRate = totalHeadcount > 0 ? parseFloat(((totalActive / totalHeadcount) * 100).toFixed(1)) : 0;

    return success(res, {
      departmentDistribution: deptDistribution,
      educationDistribution,
      ageDistribution,
      tenureDistribution,
      staffingRate: {
        activeEmployees: totalActive,
        totalHeadcount,
        rate: staffingRate
      }
    }, '人员结构看板数据获取成功');
  } catch (err) {
    console.error('人员结构看板查询失败:', err);
    return fail(res, '人员结构看板数据查询失败', 500);
  }
});

// ==================== 3. 异动流失看板 ====================

/**
 * GET /api/reports/turnover - 异动流失看板
 * - 月度离职率
 * - 主动/被动离职统计（离职原因分类）
 * - 异动趋势（按月统计调岗/晋升/降薪数量）
 * - 离职率趋势图数据
 */
router.get('/turnover', checkReportPermission, (req, res) => {
  try {
    const deptFilter = getDepartmentFilter(req.reportScope, req.reportDepartmentId);
    const deptWhereClause = req.reportScope === 'department' ? 'AND e.department_id = ?' : '';

    // 1. 月度离职率
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyResigned = db.prepare(`
      SELECT COUNT(*) as count
      FROM employees e
      WHERE e.status = 'resigned'
        AND e.leave_date LIKE ?
        ${deptWhereClause}
    `).get(`${currentMonth}%`, ...(deptFilter.params));

    const monthlyActiveAvg = db.prepare(`
      SELECT COUNT(*) as count
      FROM employees e
      WHERE (e.status = 'active' OR (e.status = 'resigned' AND e.leave_date LIKE ?))
        ${deptWhereClause}
    `).get(`${currentMonth}%`, ...(deptFilter.params));

    const monthlyResignedCount = monthlyResigned.count || 0;
    const monthlyTotalEmployees = monthlyActiveAvg.count || 0;
    const monthlyTurnoverRate = monthlyTotalEmployees > 0
      ? parseFloat(((monthlyResignedCount / monthlyTotalEmployees) * 100).toFixed(1))
      : 0;

    // 2. 主动/被动离职统计（基于离职日期和绩效/考勤/薪资等推断）
    // 系统无明确离职原因字段，使用 leave_date 和 remark 做分类
    const turnoverStats = db.prepare(`
      SELECT
        COUNT(*) as total_resigned,
        SUM(CASE WHEN e.remark LIKE '%主动%' OR e.remark LIKE '%个人%' OR e.remark LIKE '%发展%' THEN 1 ELSE 0 END) as voluntary_count,
        SUM(CASE WHEN e.remark LIKE '%辞退%' OR e.remark LIKE '%淘汰%' OR e.remark LIKE '%绩效%' OR e.remark LIKE '%违规%' THEN 1 ELSE 0 END) as involuntary_count
      FROM employees e
      WHERE e.status = 'resigned'
        ${deptWhereClause}
    `).get(...(deptFilter.params));

    const totalResigned = turnoverStats.total_resigned || 0;
    const otherCount = totalResigned - (turnoverStats.voluntary_count || 0) - (turnoverStats.involuntary_count || 0);

    const turnoverClassification = {
      total: totalResigned,
      voluntary: { count: turnoverStats.voluntary_count || 0, rate: totalResigned > 0 ? parseFloat(((turnoverStats.voluntary_count || 0) / totalResigned * 100).toFixed(1)) : 0 },
      involuntary: { count: turnoverStats.involuntary_count || 0, rate: totalResigned > 0 ? parseFloat(((turnoverStats.involuntary_count || 0) / totalResigned * 100).toFixed(1)) : 0 },
      other: { count: otherCount > 0 ? otherCount : 0, rate: totalResigned > 0 ? parseFloat((otherCount > 0 ? otherCount : 0) / totalResigned * 100).toFixed(1) : 0 }
    };

    // 3. 异动趋势（按月统计，基于员工状态变更，用 remark 中关键词推断调岗/晋升/降薪）
    // 由于系统无独立的异动记录表，使用操作日志中记录的异动动作来统计
    const changeTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', ol.created_at) as month,
        SUM(CASE WHEN ol.action LIKE '%调岗%' OR ol.content LIKE '%调岗%' OR ol.content LIKE '%部门变更%' THEN 1 ELSE 0 END) as transfer_count,
        SUM(CASE WHEN ol.action LIKE '%晋升%' OR ol.content LIKE '%晋升%' OR ol.content LIKE '%升职%' THEN 1 ELSE 0 END) as promotion_count,
        SUM(CASE WHEN ol.action LIKE '%降薪%' OR ol.action LIKE '%降级%' OR ol.content LIKE '%降薪%' OR ol.content LIKE '%降级%' THEN 1 ELSE 0 END) as demotion_count
      FROM operation_logs ol
      WHERE ol.module = 'employees'
        AND (ol.action LIKE '%调岗%' OR ol.action LIKE '%晋升%' OR ol.action LIKE '%降薪%'
          OR ol.action LIKE '%降级%' OR ol.content LIKE '%调岗%' OR ol.content LIKE '%晋升%'
          OR ol.content LIKE '%升职%' OR ol.content LIKE '%降薪%' OR ol.content LIKE '%降级%')
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all();

    // 4. 离职率趋势图数据（最近12个月）
    const turnoverTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', e.leave_date) as month,
        COUNT(*) as resigned_count
      FROM employees e
      WHERE e.status = 'resigned'
        AND e.leave_date IS NOT NULL
        ${deptWhereClause}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(...(deptFilter.params));

    // 计算每月在岗人数（用于计算离职率）
    const monthlyEmployeeTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', e.entry_date) as month,
        COUNT(*) as entry_count
      FROM employees e
      WHERE e.status = 'active'
        ${deptWhereClause}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(...(deptFilter.params));

    const turnoverTrendData = turnoverTrend.map(item => ({
      month: item.month,
      resignedCount: item.resigned_count
    })).sort((a, b) => a.month.localeCompare(b.month));

    return success(res, {
      monthlyTurnoverRate: {
        month: currentMonth,
        resignedCount: monthlyResignedCount,
        totalEmployees: monthlyTotalEmployees,
        rate: monthlyTurnoverRate
      },
      turnoverClassification,
      changeTrend,
      turnoverTrend: turnoverTrendData
    }, '异动流失看板数据获取成功');
  } catch (err) {
    console.error('异动流失看板查询失败:', err);
    return fail(res, '异动流失看板数据查询失败', 500);
  }
});

// ==================== 4. 考勤人效看板 ====================

/**
 * GET /api/reports/attendance - 考勤人效看板
 * - 迟到率
 * - 加班率
 * - 出勤率
 * - 各部门考勤对比
 * - 月度考勤趋势
 */
router.get('/attendance', checkReportPermission, (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const deptWhereClause = req.reportScope === 'department' ? 'AND e.department_id = ?' : '';
    const deptParams = req.reportScope === 'department' ? [req.reportDepartmentId] : [];

    // 全月考勤总数
    const totalStats = db.prepare(`
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'normal' THEN 1 ELSE 0 END) as normal_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'early' THEN 1 ELSE 0 END) as early_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) as leave_count,
        SUM(CASE WHEN a.status = 'overtime' THEN 1 ELSE 0 END) as overtime_count
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.date LIKE ?
        ${deptWhereClause}
    `).get(`${targetMonth}%`, ...deptParams);

    const totalRecords = totalStats.total_records || 0;

    // 1. 迟到率
    const lateRate = totalRecords > 0
      ? parseFloat(((totalStats.late_count || 0) / totalRecords * 100).toFixed(1))
      : 0;

    // 2. 加班率
    const overtimeRate = totalRecords > 0
      ? parseFloat(((totalStats.overtime_count || 0) / totalRecords * 100).toFixed(1))
      : 0;

    // 3. 出勤率（正常 + 迟到 + 早退 + 加班视为出勤，缺勤和请假除外）
    const attendanceCount = (totalStats.normal_count || 0) + (totalStats.late_count || 0) +
      (totalStats.early_count || 0) + (totalStats.overtime_count || 0);
    const attendanceRate = totalRecords > 0
      ? parseFloat(((attendanceCount / totalRecords) * 100).toFixed(1))
      : 0;

    // 4. 各部门考勤对比
    const deptAttendanceComparison = db.prepare(`
      SELECT
        d.id as department_id,
        d.name as department_name,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'normal' THEN 1 ELSE 0 END) as normal_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'early' THEN 1 ELSE 0 END) as early_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) as leave_count,
        SUM(CASE WHEN a.status = 'overtime' THEN 1 ELSE 0 END) as overtime_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date LIKE ?
      ${req.reportScope === 'department' ? 'WHERE d.id = ?' : ''}
      GROUP BY d.id, d.name
      HAVING COUNT(a.id) > 0
      ORDER BY d.name
    `).all(`${targetMonth}%`, ...deptParams);

    const deptComparison = deptAttendanceComparison.map(d => {
      const deptTotal = d.total_records || 0;
      const deptAttendance = (d.normal_count || 0) + (d.late_count || 0) + (d.early_count || 0) + (d.overtime_count || 0);
      return {
        departmentId: d.department_id,
        departmentName: d.department_name,
        totalRecords: deptTotal,
        normalCount: d.normal_count || 0,
        lateCount: d.late_count || 0,
        earlyCount: d.early_count || 0,
        absentCount: d.absent_count || 0,
        leaveCount: d.leave_count || 0,
        overtimeCount: d.overtime_count || 0,
        attendanceRate: deptTotal > 0 ? parseFloat(((deptAttendance / deptTotal) * 100).toFixed(1)) : 0,
        lateRate: deptTotal > 0 ? parseFloat(((d.late_count || 0) / deptTotal * 100).toFixed(1)) : 0,
        overtimeRate: deptTotal > 0 ? parseFloat(((d.overtime_count || 0) / deptTotal * 100).toFixed(1)) : 0
      };
    });

    // 5. 月度考勤趋势（最近6个月）
    const monthlyTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', a.date) as month,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'normal' THEN 1 ELSE 0 END) as normal_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'overtime' THEN 1 ELSE 0 END) as overtime_count
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
        ${deptWhereClause}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all(...deptParams);

    const attendanceTrend = monthlyTrend.map(item => {
      const t = item.total_records || 0;
      const attendCount = (item.normal_count || 0) + (item.late_count || 0);
      return {
        month: item.month,
        totalRecords: t,
        lateRate: t > 0 ? parseFloat(((item.late_count || 0) / t * 100).toFixed(1)) : 0,
        absentRate: t > 0 ? parseFloat(((item.absent_count || 0) / t * 100).toFixed(1)) : 0,
        overtimeRate: t > 0 ? parseFloat(((item.overtime_count || 0) / t * 100).toFixed(1)) : 0,
        attendanceRate: t > 0 ? parseFloat(((attendCount / t) * 100).toFixed(1)) : 0
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    return success(res, {
      lateRate,
      overtimeRate,
      attendanceRate,
      departmentComparison: deptComparison,
      monthlyTrend: attendanceTrend
    }, '考勤人效看板数据获取成功');
  } catch (err) {
    console.error('考勤人效看板查询失败:', err);
    return fail(res, '考勤人效看板数据查询失败', 500);
  }
});

// ==================== 5. 人力成本看板 ====================

/**
 * GET /api/reports/cost - 人力成本看板
 * - 月度薪资总成本
 * - 部门人力成本分布
 * - 人均成本
 * - 成本趋势图数据
 */
router.get('/cost', checkReportPermission, (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const deptWhereClause = req.reportScope === 'department' ? 'AND e.department_id = ?' : '';
    const deptParams = req.reportScope === 'department' ? [req.reportDepartmentId] : [];

    // 1. 月度薪资总成本（使用salary_records中已发放或已确认的记录）
    const monthlyCost = db.prepare(`
      SELECT
        COALESCE(SUM(sr.gross_salary), 0) as total_gross,
        COALESCE(SUM(sr.net_salary), 0) as total_net,
        COALESCE(SUM(sr.base_salary), 0) as total_base,
        COALESCE(SUM(sr.position_salary), 0) as total_position,
        COALESCE(SUM(sr.performance_bonus), 0) as total_bonus,
        COALESCE(SUM(sr.allowance), 0) as total_allowance,
        COALESCE(SUM(sr.overtime_pay), 0) as total_overtime,
        COALESCE(SUM(sr.social_insurance), 0) as total_insurance,
        COALESCE(SUM(sr.housing_fund), 0) as total_fund,
        COALESCE(SUM(sr.tax), 0) as total_tax
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      WHERE sr.period = ?
        AND sr.status IN ('confirmed', 'paid')
        ${deptWhereClause}
    `).get(targetMonth, ...deptParams);

    // 2. 部门人力成本分布
    const deptCostDistribution = db.prepare(`
      SELECT
        d.id as department_id,
        d.name as department_name,
        COUNT(sr.id) as employee_count,
        COALESCE(SUM(sr.gross_salary), 0) as total_gross,
        COALESCE(SUM(sr.net_salary), 0) as total_net,
        COALESCE(AVG(sr.gross_salary), 0) as avg_gross
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      LEFT JOIN salary_records sr ON sr.employee_id = e.id AND sr.period = ? AND sr.status IN ('confirmed', 'paid')
      ${req.reportScope === 'department' ? 'WHERE d.id = ?' : ''}
      GROUP BY d.id, d.name
      HAVING COUNT(sr.id) > 0
      ORDER BY total_gross DESC
    `).all(targetMonth, ...deptParams);

    // 3. 人均成本
    const totalEmployeesWithSalary = db.prepare(`
      SELECT COUNT(DISTINCT sr.employee_id) as count
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      WHERE sr.period = ?
        AND sr.status IN ('confirmed', 'paid')
        ${deptWhereClause}
    `).get(targetMonth, ...deptParams);

    const employeeCount = totalEmployeesWithSalary.count || 0;
    const avgCost = employeeCount > 0 ? {
      avgGross: parseFloat((monthlyCost.total_gross / employeeCount).toFixed(2)),
      avgNet: parseFloat((monthlyCost.total_net / employeeCount).toFixed(2))
    } : { avgGross: 0, avgNet: 0 };

    // 4. 成本趋势图数据（最近6个月）
    const costTrend = db.prepare(`
      SELECT
        sr.period as month,
        COALESCE(SUM(sr.gross_salary), 0) as total_gross,
        COALESCE(SUM(sr.net_salary), 0) as total_net,
        COUNT(DISTINCT sr.employee_id) as employee_count
      FROM salary_records sr
      LEFT JOIN employees e ON sr.employee_id = e.id
      WHERE sr.status IN ('confirmed', 'paid')
        ${deptWhereClause}
      GROUP BY sr.period
      ORDER BY sr.period DESC
      LIMIT 6
    `).all(...deptParams);

    const costTrendData = costTrend.map(item => ({
      month: item.month,
      totalGross: item.total_gross,
      totalNet: item.total_net,
      employeeCount: item.employee_count,
      avgCost: item.employee_count > 0 ? parseFloat((item.total_gross / item.employee_count).toFixed(2)) : 0
    })).sort((a, b) => a.month.localeCompare(b.month));

    return success(res, {
      monthlyCost: {
        month: targetMonth,
        totalGross: monthlyCost.total_gross,
        totalNet: monthlyCost.total_net,
        totalBase: monthlyCost.total_base,
        totalPosition: monthlyCost.total_position,
        totalBonus: monthlyCost.total_bonus,
        totalAllowance: monthlyCost.total_allowance,
        totalOvertime: monthlyCost.total_overtime,
        totalInsurance: monthlyCost.total_insurance,
        totalFund: monthlyCost.total_fund,
        totalTax: monthlyCost.total_tax
      },
      departmentCostDistribution: deptCostDistribution,
      averageCost: avgCost,
      costTrend: costTrendData
    }, '人力成本看板数据获取成功');
  } catch (err) {
    console.error('人力成本看板查询失败:', err);
    return fail(res, '人力成本看板数据查询失败', 500);
  }
});

module.exports = router;
