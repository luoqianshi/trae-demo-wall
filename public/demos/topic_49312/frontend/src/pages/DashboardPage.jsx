import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Typography,
  Spin,
  message,
  List,
  Tag,
} from 'antd';
import {
  ClockCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  EditOutlined,
  SearchOutlined,
  SwapOutlined,
  DashboardOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { get } from '../utils/request';
import { getUser, hasRole } from '../utils/auth';

const { Title, Text } = Typography;

/**
 * 安全获取接口返回的数据列表
 * 兼容 res.data / res.list / res 等不同返回结构
 */
function safeList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.list)) return res.list;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    // data 是分页对象 { list, total, ... }
    if (Array.isArray(res.data.list)) return res.data.list;
    if (Array.isArray(res.data.records)) return res.data.records;
  }
  return [];
}

/**
 * 安全获取接口返回的总数
 */
function safeTotal(res) {
  if (!res) return 0;
  if (typeof res.total === 'number') return res.total;
  if (res.data && typeof res.data === 'object') {
    if (typeof res.data.total === 'number') return res.data.total;
    if (typeof res.data.count === 'number') return res.data.count;
  }
  return safeList(res).length;
}

/**
 * 统计卡片组件
 * 接收 title, value, icon, color, loading, onClick 属性
 */
function StatCard({ title, value, icon, color, loading, onClick }) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ borderRadius: 8 }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Spin spinning={!!loading}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: color || '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {React.createElement(icon, {
              style: { fontSize: 24, color: '#1677ff' },
            })}
          </div>
          <Statistic
            title={title}
            value={value}
            valueStyle={{ fontSize: 24, fontWeight: 600 }}
          />
        </div>
      </Spin>
    </Card>
  );
}

/**
 * 快捷操作入口组件
 */
function QuickActions({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <Card
      title="快捷操作"
      style={{ borderRadius: 8 }}
      styles={{ body: { padding: '16px 24px' } }}
    >
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col xs={12} sm={8} md={6} key={action.key}>
            <div
              onClick={action.onClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: action.bgColor || '#f6f8fa',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e6f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = action.bgColor || '#f6f8fa';
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: action.iconColor || '#1677ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.createElement(action.icon, {
                  style: { fontSize: 18, color: '#fff' },
                })}
              </div>
              <Text style={{ fontSize: 13 }}>{action.label}</Text>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

/**
 * 列表概况卡片
 */
function OverviewList({ title, items, loading, emptyText }) {
  return (
    <Card
      title={title}
      style={{ borderRadius: 8, height: '100%' }}
      styles={{ body: { padding: '0 24px 16px' } }}
    >
      <Spin spinning={!!loading}>
        <List
          dataSource={items}
          locale={{ emptyText: emptyText || '暂无数据' }}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div>
                  <Text strong>{item.title}</Text>
                  {item.desc && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.desc}
                      </Text>
                    </div>
                  )}
                </div>
                {item.tag && <Tag color={item.tagColor || 'blue'}>{item.tag}</Tag>}
              </div>
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
}

// ==================== Admin/HR 工作台 ====================

/**
 * admin/HR角色仪表盘
 * 展示全公司待办统计卡片 + 快捷操作入口 + 待办列表
 */
function AdminDashboard({ navigate, stats }) {
  const { loading, data } = stats;

  // 快捷操作：使用useNavigate导航到各模块路由
  const quickActions = [
    {
      key: 'leave',
      icon: FileTextOutlined,
      label: '审批请假',
      bgColor: '#f6ffed',
      iconColor: '#52c41a',
      onClick: () => navigate('/attendance/leaves'),
    },
    {
      key: 'interview',
      icon: SearchOutlined,
      label: '面试安排',
      bgColor: '#fff7e6',
      iconColor: '#fa8c16',
      onClick: () => navigate('/recruitment/interviews'),
    },
    {
      key: 'performance',
      icon: BarChartOutlined,
      label: '绩效评分',
      bgColor: '#e6f7ff',
      iconColor: '#1677ff',
      onClick: () => navigate('/performance/list'),
    },
    {
      key: 'offer',
      icon: EditOutlined,
      label: 'Offer管理',
      bgColor: '#f9f0ff',
      iconColor: '#722ed1',
      onClick: () => navigate('/recruitment/offers'),
    },
    {
      key: 'employee',
      icon: TeamOutlined,
      label: '员工档案',
      bgColor: '#e6fffb',
      iconColor: '#13c2c2',
      onClick: () => navigate('/hr/employees'),
    },
    {
      key: 'report',
      icon: DashboardOutlined,
      label: '数据报表',
      bgColor: '#fff1f0',
      iconColor: '#ff4d4f',
      onClick: () => navigate('/reports/staffing'),
    },
  ];

  return (
    <>
      {/* 全公司待办统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <StatCard
            title="待审批请假数"
            value={data.pendingLeaves}
            icon={FileTextOutlined}
            color="#fff7e6"
            loading={loading}
            onClick={() => navigate('/attendance/leaves')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <StatCard
            title="待面试数"
            value={data.pendingInterviews}
            icon={SearchOutlined}
            color="#e6f7ff"
            loading={loading}
            onClick={() => navigate('/recruitment/interviews')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <StatCard
            title="待绩效评分数"
            value={data.pendingPerformances}
            icon={BarChartOutlined}
            color="#f6ffed"
            loading={loading}
            onClick={() => navigate('/performance/list')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <StatCard
            title="待入职人数"
            value={data.pendingOffers}
            icon={UserAddOutlined}
            color="#f9f0ff"
            loading={loading}
            onClick={() => navigate('/recruitment/offers')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <StatCard
            title="本月新入职数"
            value={data.newOnboard}
            icon={UserAddOutlined}
            color="#e6fffb"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <StatCard
            title="本月离职数"
            value={data.resigned}
            icon={CloseCircleOutlined}
            color="#fff1f0"
            loading={loading}
          />
        </Col>
      </Row>

      {/* 快捷操作入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <QuickActions actions={quickActions} />
        </Col>
      </Row>

      {/* 待办列表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <OverviewList
            title="待审批请假"
            items={data.recentLeaves}
            loading={loading}
            emptyText="暂无待审批请假"
          />
        </Col>
        <Col xs={24} lg={12}>
          <OverviewList
            title="待安排面试"
            items={data.recentInterviews}
            loading={loading}
            emptyText="暂无待安排面试"
          />
        </Col>
      </Row>
    </>
  );
}

// ==================== Manager 工作台 ====================

/**
 * manager角色仪表盘
 * 展示本部门待办 + 部门人员概况
 */
function ManagerDashboard({ navigate, stats }) {
  const { loading, data } = stats;

  // 快捷操作
  const quickActions = [
    {
      key: 'leave',
      icon: FileTextOutlined,
      label: '审批请假',
      bgColor: '#f6ffed',
      iconColor: '#52c41a',
      onClick: () => navigate('/attendance/leaves'),
    },
    {
      key: 'performance',
      icon: BarChartOutlined,
      label: '绩效评分',
      bgColor: '#e6f7ff',
      iconColor: '#1677ff',
      onClick: () => navigate('/performance/list'),
    },
    {
      key: 'attendance',
      icon: CalendarOutlined,
      label: '考勤统计',
      bgColor: '#fff7e6',
      iconColor: '#fa8c16',
      onClick: () => navigate('/attendance/stats'),
    },
    {
      key: 'employees',
      icon: TeamOutlined,
      label: '部门人员',
      bgColor: '#e6fffb',
      iconColor: '#13c2c2',
      onClick: () => navigate('/hr/employees'),
    },
  ];

  return (
    <>
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        部门待办概况
      </Title>

      {/* 本部门待办统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard
            title="本部门待审批请假"
            value={data.deptPendingLeaves}
            icon={FileTextOutlined}
            color="#fff7e6"
            loading={loading}
            onClick={() => navigate('/attendance/leaves')}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="本部门待绩效评分"
            value={data.deptPendingPerformances}
            icon={BarChartOutlined}
            color="#f6ffed"
            loading={loading}
            onClick={() => navigate('/performance/list')}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="本部门人数"
            value={data.deptEmployeeCount}
            icon={TeamOutlined}
            color="#e6f7ff"
            loading={loading}
          />
        </Col>
      </Row>

      {/* 快捷操作入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <QuickActions actions={quickActions} />
        </Col>
      </Row>

      {/* 部门待办列表与人员概况 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <OverviewList
            title="部门待审批请假"
            items={data.deptRecentLeaves}
            loading={loading}
            emptyText="暂无待审批请假"
          />
        </Col>
        <Col xs={24} lg={12}>
          <OverviewList
            title="部门人员情况"
            items={data.deptEmployees}
            loading={loading}
            emptyText="暂无部门人员信息"
          />
        </Col>
      </Row>
    </>
  );
}

// ==================== Employee 工作台 ====================

/**
 * employee角色仪表盘
 * 展示个人待办：我的请假、本月考勤、个人绩效
 */
function EmployeeDashboard({ navigate, stats }) {
  const { loading, data } = stats;

  // 快捷操作
  const quickActions = [
    {
      key: 'leave',
      icon: FileTextOutlined,
      label: '请假申请',
      bgColor: '#f6ffed',
      iconColor: '#52c41a',
      onClick: () => navigate('/attendance/leaves'),
    },
    {
      key: 'attendance',
      icon: ClockCircleOutlined,
      label: '考勤打卡',
      bgColor: '#e6f7ff',
      iconColor: '#1677ff',
      onClick: () => navigate('/attendance/check'),
    },
    {
      key: 'performance',
      icon: BarChartOutlined,
      label: '我的绩效',
      bgColor: '#fff7e6',
      iconColor: '#fa8c16',
      onClick: () => navigate('/performance/list'),
    },
    {
      key: 'salary',
      icon: EditOutlined,
      label: '我的工资条',
      bgColor: '#f9f0ff',
      iconColor: '#722ed1',
      onClick: () => navigate('/salary/records'),
    },
  ];

  return (
    <>
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        个人待办概况
      </Title>

      {/* 个人待办统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard
            title="我的请假申请"
            value={data.myPendingLeaves}
            icon={FileTextOutlined}
            color="#fff7e6"
            loading={loading}
            onClick={() => navigate('/attendance/leaves')}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="本月出勤天数"
            value={data.monthlyAttendance}
            icon={CalendarOutlined}
            color="#e6f7ff"
            loading={loading}
            onClick={() => navigate('/attendance/check')}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="本月迟到次数"
            value={data.monthlyLateCount}
            icon={ClockCircleOutlined}
            color="#fff1f0"
            loading={loading}
          />
        </Col>
      </Row>

      {/* 快捷操作入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <QuickActions actions={quickActions} />
        </Col>
      </Row>

      {/* 个人请假记录与考勤记录 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <OverviewList
            title="我的请假记录"
            items={data.myLeaves}
            loading={loading}
            emptyText="暂无请假记录"
          />
        </Col>
        <Col xs={24} lg={12}>
          <OverviewList
            title="本月考勤记录"
            items={data.myAttendance}
            loading={loading}
            emptyText="暂无考勤记录"
          />
        </Col>
      </Row>
    </>
  );
}

// ==================== 数据获取 ====================

/**
 * 获取admin/hr统计信息
 * 包含全公司待办统计卡片数据 + 待办列表数据
 */
async function fetchAdminStats() {
  const results = await Promise.allSettled([
    get('/leaves', { status: 0, page: 1, pageSize: 1 }),
    get('/interviews', { status: 'scheduled', page: 1, pageSize: 1 }),
    get('/performances', { status: 'pending', page: 1, pageSize: 1 }),
    get('/offers', { status: 'pending', page: 1, pageSize: 1 }),
    get('/employees', { onboardThisMonth: true, page: 1, pageSize: 1 }),
    get('/employees', { resignedThisMonth: true, page: 1, pageSize: 1 }),
    // 获取列表用于待办展示
    get('/leaves', { status: 0, page: 1, pageSize: 5 }),
    get('/interviews', { status: 'scheduled', page: 1, pageSize: 5 }),
  ]);

  const [
    leavesRes,
    interviewsRes,
    performancesRes,
    offersRes,
    newOnboardRes,
    resignedRes,
    recentLeavesRes,
    recentInterviewsRes,
  ] = results;

  // 解析请假列表
  const parseLeaves = (res) =>
    safeList(res.status === 'fulfilled' ? res.value : null).map((item) => ({
      title: item.employeeName || item.applicantName || item.name || '未知',
      desc: `${item.startDate || ''} ~ ${item.endDate || ''} (${item.days || item.leaveDays || '-'}天)`,
      tag: item.leaveType || item.type || '请假',
      tagColor: item.leaveType === '事假' ? 'orange' : 'blue',
    }));

  // 解析面试列表
  const parseInterviews = (res) =>
    safeList(res.status === 'fulfilled' ? res.value : null).map((item) => ({
      title: item.candidateName || '未知',
      desc: `${item.scheduledAt || item.interviewDate || ''} ${item.jobTitle || ''}`,
      tag: item.round ? `第${item.round}轮` : '面试',
      tagColor: 'green',
    }));

  return {
    pendingLeaves: safeTotal(leavesRes.status === 'fulfilled' ? leavesRes.value : null),
    pendingInterviews: safeTotal(interviewsRes.status === 'fulfilled' ? interviewsRes.value : null),
    pendingPerformances: safeTotal(performancesRes.status === 'fulfilled' ? performancesRes.value : null),
    pendingOffers: safeTotal(offersRes.status === 'fulfilled' ? offersRes.value : null),
    newOnboard: safeTotal(newOnboardRes.status === 'fulfilled' ? newOnboardRes.value : null),
    resigned: safeTotal(resignedRes.status === 'fulfilled' ? resignedRes.value : null),
    recentLeaves: parseLeaves(recentLeavesRes),
    recentInterviews: parseInterviews(recentInterviewsRes),
  };
}

/**
 * 获取manager统计信息
 * 包含本部门待办 + 部门人员概况
 */
async function fetchManagerStats(user) {
  const deptId = user?.departmentId || user?.deptId || '';
  const results = await Promise.allSettled([
    get('/leaves', { status: 0, departmentId: deptId, page: 1, pageSize: 1 }),
    get('/performances', { status: 'pending', departmentId: deptId, page: 1, pageSize: 1 }),
    get('/employees', { departmentId: deptId, page: 1, pageSize: 1 }),
    get('/leaves', { status: 0, departmentId: deptId, page: 1, pageSize: 5 }),
    get('/employees', { departmentId: deptId, page: 1, pageSize: 5 }),
  ]);

  const [
    deptLeavesRes,
    deptPerformancesRes,
    deptCountRes,
    deptRecentLeavesRes,
    deptEmployeesRes,
  ] = results;

  // 解析部门请假列表
  const parseDeptLeaves = (res) =>
    safeList(res.status === 'fulfilled' ? res.value : null).map((item) => ({
      title: item.employeeName || item.applicantName || item.name || '未知',
      desc: `${item.startDate || ''} ~ ${item.endDate || ''} (${item.days || item.leaveDays || '-'}天)`,
      tag: item.leaveType || item.type || '请假',
      tagColor: 'orange',
    }));

  // 解析部门人员列表
  const parseDeptEmployees = (res) =>
    safeList(res.status === 'fulfilled' ? res.value : null).map((item) => ({
      title: item.name || item.employeeName || '未知',
      desc: `${item.position || item.title || ''}`,
      tag: item.status === 'active' ? '在职' : item.status === 'probation' ? '试用期' : item.status === 'resigned' ? '离职' : '未知',
      tagColor: item.status === 'active' ? 'green' : item.status === 'probation' ? 'blue' : 'default',
    }));

  return {
    deptPendingLeaves: safeTotal(deptLeavesRes.status === 'fulfilled' ? deptLeavesRes.value : null),
    deptPendingPerformances: safeTotal(deptPerformancesRes.status === 'fulfilled' ? deptPerformancesRes.value : null),
    deptEmployeeCount: safeTotal(deptCountRes.status === 'fulfilled' ? deptCountRes.value : null),
    deptRecentLeaves: parseDeptLeaves(deptRecentLeavesRes),
    deptEmployees: parseDeptEmployees(deptEmployeesRes),
  };
}

/**
 * 获取employee统计信息
 * 包含个人待办：我的请假、本月考勤、个人绩效
 */
async function fetchEmployeeStats(user) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const results = await Promise.allSettled([
    get('/leaves', { status: 0, page: 1, pageSize: 1 }),
    get('/leaves', { page: 1, pageSize: 5 }),
    get('/attendance', { startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, page: 1, pageSize: 1 }),
    get('/attendance', { startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, status: 'late', page: 1, pageSize: 1 }),
    get('/attendance', { startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31`, page: 1, pageSize: 5 }),
  ]);

  const [
    myPendingLeavesRes,
    myLeavesListRes,
    monthlyAttendanceRes,
    monthlyLateRes,
    myAttendanceListRes,
  ] = results;

  // 请假状态映射（后端用数字：0=待审批, 1=已通过, 2=已驳回）
  const statusTagMap = {
    0: { text: '待审批', color: 'orange' },
    1: { text: '已通过', color: 'green' },
    2: { text: '已驳回', color: 'red' },
  };

  // 解析个人请假记录
  const parseMyLeaves = (res) =>
    safeList(res.status === 'fulfilled' ? res.value : null).map((item) => ({
      title: item.leaveType || item.type || '请假',
      desc: `${item.startDate || ''} ~ ${item.endDate || ''} (${item.days || item.leaveDays || '-'}天)`,
      tag: (statusTagMap[item.status] || { text: item.status || '未知', color: 'default' }).text,
      tagColor: (statusTagMap[item.status] || { color: 'default' }).color,
    }));

  // 解析个人考勤记录（字段：date, checkIn, checkOut, status）
  const parseMyAttendance = (res) =>
    safeList(res.status === 'fulfilled' ? res.value : null).map((item) => ({
      title: item.date || '',
      desc: `上班: ${item.checkIn || '-'} | 下班: ${item.checkOut || '-'}`,
      tag: item.status === 'normal' ? '正常' : item.status === 'late' ? '迟到' : item.status === 'early' ? '早退' : item.status === 'absent' ? '缺勤' : item.status === 'leave' ? '请假' : item.status === 'overtime' ? '加班' : (item.status || '未知'),
      tagColor: item.status === 'late' || item.status === 'absent' ? 'red' : item.status === 'normal' ? 'green' : 'orange',
    }));

  return {
    myPendingLeaves: safeTotal(myPendingLeavesRes.status === 'fulfilled' ? myPendingLeavesRes.value : null),
    monthlyAttendance: safeTotal(monthlyAttendanceRes.status === 'fulfilled' ? monthlyAttendanceRes.value : null),
    monthlyLateCount: safeTotal(monthlyLateRes.status === 'fulfilled' ? monthlyLateRes.value : null),
    myLeaves: parseMyLeaves(myLeavesListRes),
    myAttendance: parseMyAttendance(myAttendanceListRes),
  };
}

// ==================== 主组件 ====================

/**
 * 工作台页面
 * 根据不同角色展示不同内容：
 * - admin/HR：全公司待办统计卡片 + 快捷操作入口 + 待办列表
 * - manager：本部门待办 + 部门人员概况
 * - employee：个人待办（我的请假、本月考勤、个人绩效）
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let data = {};
        if (hasRole('admin', 'hr')) {
          data = await fetchAdminStats();
        } else if (hasRole('manager')) {
          data = await fetchManagerStats(user);
        } else {
          data = await fetchEmployeeStats(user);
        }
        setStatsData(data);
      } catch (err) {
        message.error('获取工作台数据失败');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, []);

  // 角色名称映射
  const roleLabel = {
    admin: '管理员',
    hr: 'HR',
    manager: '部门经理',
    employee: '普通员工',
  };

  return (
    <div>
      {/* 页面标题和欢迎信息 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          工作台
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          欢迎回来，{user?.realName || user?.username || '用户'}（{roleLabel[user?.role] || ''}）
        </Text>
      </div>

      {/* 根据角色展示不同内容 */}
      {hasRole('admin', 'hr') && (
        <AdminDashboard navigate={navigate} stats={{ loading, data: statsData }} />
      )}
      {hasRole('manager') && !hasRole('admin', 'hr') && (
        <ManagerDashboard navigate={navigate} stats={{ loading, data: statsData }} />
      )}
      {hasRole('employee') && !hasRole('admin', 'hr', 'manager') && (
        <EmployeeDashboard navigate={navigate} stats={{ loading, data: statsData }} />
      )}
    </div>
  );
}
