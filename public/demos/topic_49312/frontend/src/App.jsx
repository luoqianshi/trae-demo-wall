import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout';
import { getToken } from './utils/auth';

// ==================== 登录页 ====================
// 延迟加载各页面组件（后续创建）
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

// ==================== 工作台 ====================
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

// ==================== 智能招聘 ====================
const JobsPage = React.lazy(() => import('./pages/recruitment/JobsPage'));
const ResumesPage = React.lazy(() => import('./pages/recruitment/ResumesPage'));
const InterviewsPage = React.lazy(() => import('./pages/recruitment/InterviewsPage'));
const OffersPage = React.lazy(() => import('./pages/recruitment/OffersPage'));
const RecruitReportPage = React.lazy(() => import('./pages/recruitment/RecruitReportPage'));

// ==================== 人事管理 ====================
const DepartmentsPage = React.lazy(() => import('./pages/hr/DepartmentsPage'));
const EmployeesPage = React.lazy(() => import('./pages/hr/EmployeesPage'));
const EmployeeChangesPage = React.lazy(() => import('./pages/hr/EmployeeChangesPage'));
const ResignationsPage = React.lazy(() => import('./pages/hr/ResignationsPage'));

// ==================== 考勤排班 ====================
const AttendancePage = React.lazy(() => import('./pages/attendance/AttendancePage'));
const LeavesPage = React.lazy(() => import('./pages/attendance/LeavesPage'));
const AttendanceStatsPage = React.lazy(() => import('./pages/attendance/AttendanceStatsPage'));

// ==================== 绩效薪酬 ====================
const PerformancesPage = React.lazy(() => import('./pages/performance/PerformancesPage'));
const SalaryStructurePage = React.lazy(() => import('./pages/salary/SalaryStructurePage'));
const SalaryRecordsPage = React.lazy(() => import('./pages/salary/SalaryRecordsPage'));

// ==================== 数据报表 ====================
const ReportRecruitmentPage = React.lazy(() => import('./pages/reports/ReportRecruitmentPage'));
const ReportStaffingPage = React.lazy(() => import('./pages/reports/ReportStaffingPage'));
const ReportTurnoverPage = React.lazy(() => import('./pages/reports/ReportTurnoverPage'));
const ReportAttendancePage = React.lazy(() => import('./pages/reports/ReportAttendancePage'));
const ReportCostPage = React.lazy(() => import('./pages/reports/ReportCostPage'));

// ==================== 系统管理 ====================
const UsersPage = React.lazy(() => import('./pages/system/UsersPage'));
const LogsPage = React.lazy(() => import('./pages/system/LogsPage'));

// ==================== 路由守卫 ====================

/**
 * 需要登录认证的路由守卫组件
 * 未登录则重定向到 /login
 */
function RequireAuth({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ==================== 加载占位 ====================
function LoadingFallback() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: 24, color: '#999' }}>加载中...</div>
    </div>
  );
}

export default function App() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 登录页 - 无需认证 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护路由 - 需要登录认证 */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* 工作台 */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* 智能招聘 */}
          <Route path="recruitment/jobs" element={<JobsPage />} />
          <Route path="recruitment/resumes" element={<ResumesPage />} />
          <Route path="recruitment/interviews" element={<InterviewsPage />} />
          <Route path="recruitment/offers" element={<OffersPage />} />
          <Route path="recruitment/report" element={<RecruitReportPage />} />

          {/* 人事管理 */}
          <Route path="hr/departments" element={<DepartmentsPage />} />
          <Route path="hr/employees" element={<EmployeesPage />} />
          <Route path="hr/changes" element={<EmployeeChangesPage />} />
          <Route path="hr/resignations" element={<ResignationsPage />} />

          {/* 考勤排班 */}
          <Route path="attendance/check" element={<AttendancePage />} />
          <Route path="attendance/leaves" element={<LeavesPage />} />
          <Route path="attendance/stats" element={<AttendanceStatsPage />} />

          {/* 绩效薪酬 */}
          <Route path="performance/list" element={<PerformancesPage />} />
          <Route path="salary/structure" element={<SalaryStructurePage />} />
          <Route path="salary/records" element={<SalaryRecordsPage />} />

          {/* 数据报表 */}
          <Route path="reports/recruitment" element={<ReportRecruitmentPage />} />
          <Route path="reports/staffing" element={<ReportStaffingPage />} />
          <Route path="reports/turnover" element={<ReportTurnoverPage />} />
          <Route path="reports/attendance" element={<ReportAttendancePage />} />
          <Route path="reports/cost" element={<ReportCostPage />} />

          {/* 系统管理 */}
          <Route path="system/users" element={<UsersPage />} />
          <Route path="system/logs" element={<LogsPage />} />
        </Route>

        {/* 未匹配路由 -> 重定向到工作台 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Suspense>
  );
}
