import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Row, Col, Statistic, Select, Space, Spin,
  Alert, Tag, Typography, Progress, Input
} from 'antd';
import {
  DashboardOutlined, CheckCircleOutlined,
  WarningOutlined, CloseCircleOutlined, ClockCircleOutlined,
  TeamOutlined, RiseOutlined
} from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

/** 统计卡片配置 */
const statCards = [
  {
    key: 'attendanceDays',
    title: '出勤天数',
    icon: <CheckCircleOutlined />,
    color: '#3f8600',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  {
    key: 'lateCount',
    title: '迟到次数',
    icon: <ClockCircleOutlined />,
    color: '#fa8c16',
    bgColor: '#fff7e6',
    borderColor: '#ffd591',
  },
  {
    key: 'earlyCount',
    title: '早退次数',
    icon: <WarningOutlined />,
    color: '#fa541c',
    bgColor: '#fff2e8',
    borderColor: '#ffbb96',
  },
  {
    key: 'absentDays',
    title: '缺勤天数',
    icon: <CloseCircleOutlined />,
    color: '#f5222d',
    bgColor: '#fff1f0',
    borderColor: '#ffa39e',
  },
  {
    key: 'leaveDays',
    title: '请假天数',
    icon: <ClockCircleOutlined />,
    color: '#1890ff',
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
  },
  {
    key: 'overtimeDays',
    title: '加班天数',
    icon: <RiseOutlined />,
    color: '#722ed1',
    bgColor: '#f9f0ff',
    borderColor: '#d3adf7',
  },
];

const AttendanceStatsPage = () => {
  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deptData, setDeptData] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const user = getUser();
  const isManagerRole = user && hasRole('manager');
  const isHROrAdmin = user && hasRole('admin', 'hr');
  const canViewAll = isHROrAdmin; // admin/HR看全公司
  const canViewDept = isManagerRole; // manager看本部门

  /** 生成近12个月的月份选项 */
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const m = dayjs().subtract(i, 'month').format('YYYY-MM');
    monthOptions.push(
      <Option key={m} value={m}>
        {dayjs(m).format('YYYY年MM月')}
      </Option>
    );
  }

  /** 获取考勤汇总统计 */
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = { month };
      if (canViewDept && !canViewAll && user.departmentId) {
        params.departmentId = user.departmentId;
      } else if (!canViewAll && !canViewDept) {
        // 普通员工看自己的汇总
        params.employeeId = user.id;
      }

      const res = await get('/attendance/stats/summary', params);
      const data = res.data || res;
      setSummary(data);
    } catch (err) {
      console.error('获取考勤汇总失败:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [month, user, canViewAll, canViewDept]);

  /** 获取考勤明细数据（按员工汇总） */
  const fetchDetail = useCallback(async (page = 1, pageSize = 10) => {
    setDetailLoading(true);
    try {
      const params = { page, pageSize, month };
      if (canViewDept && !canViewAll && user.departmentId) {
        params.departmentId = user.departmentId;
      }

      const res = await get('/attendance', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setDetailData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取考勤明细失败:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [month, user, canViewAll, canViewDept]);

  /** 从考勤明细中计算部门对比数据 */
  const fetchDeptComparison = useCallback(async () => {
    setDeptLoading(true);
    try {
      // 如果是 manager 且非 admin/HR，只取本部门
      if (canViewDept && !canViewAll) {
        // manager只看本部门，无需部门对比
        setDeptData([]);
        setDeptLoading(false);
        return;
      }

      const params = { month, pageSize: 999 };
      const res = await get('/attendance', params);
      const allRecords = res.data?.list || res.data?.records || res.list || res.records || [];

      // 按部门汇总
      const deptMap = {};
      allRecords.forEach((record) => {
        const deptName = record.departmentName || '未分配部门';
        if (!deptMap[deptName]) {
          deptMap[deptName] = {
            departmentName: deptName,
            total: 0,
            normal: 0,
            late: 0,
            early: 0,
            absent: 0,
            leave: 0,
          };
        }
        deptMap[deptName].total += 1;
        const status = record.status || 'normal';
        if (deptMap[deptName][status] !== undefined) {
          deptMap[deptName][status] += 1;
        }
      });

      // 计算考勤率并排序
      const deptList = Object.values(deptMap).map((dept) => ({
        ...dept,
        attendanceRate: dept.total > 0
          ? Math.round(((dept.normal + dept.late + dept.early) / dept.total) * 100)
          : 0,
      }));
      deptList.sort((a, b) => b.attendanceRate - a.attendanceRate);

      setDeptData(deptList);
    } catch (err) {
      console.error('获取部门对比数据失败:', err);
    } finally {
      setDeptLoading(false);
    }
  }, [month, canViewAll, canViewDept]);

  useEffect(() => {
    fetchSummary();
    fetchDetail();
    if (canViewAll) {
      fetchDeptComparison();
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchDetail(1);
    if (canViewAll) {
      fetchDeptComparison();
    }
  }, [month]);

  /** 渲染部门考勤率进度条 */
  const renderProgress = (rate) => {
    let color = '#52c41a';
    if (rate < 80) color = '#f5222d';
    else if (rate < 90) color = '#faad14';
    else if (rate < 95) color = '#1890ff';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Progress
          percent={rate}
          size="small"
          strokeColor={color}
          style={{ width: 120, margin: 0 }}
        />
        <Text style={{ minWidth: 40 }}>{rate}%</Text>
      </div>
    );
  };

  /** 考勤明细表格列 */
  const detailColumns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
      fixed: 'left',
      render: (text) => text || user?.name || '-',
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 120,
      ellipsis: true,
      render: (text) => text || user?.departmentName || '-',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '签到时间',
      dataIndex: 'clockIn',
      key: 'clockIn',
      width: 110,
      render: (val) => val || '-',
    },
    {
      title: '签退时间',
      dataIndex: 'clockOut',
      key: 'clockOut',
      width: 110,
      render: (val) => val || '-',
    },
    {
      title: '工作时长',
      key: 'workHours',
      width: 100,
      render: (_, record) => {
        if (!record.clockIn || !record.clockOut) return '-';
        const start = dayjs(record.clockIn, 'HH:mm:ss');
        const end = dayjs(record.clockOut, 'HH:mm:ss');
        if (end.isBefore(start)) return '-';
        const diff = end.diff(start, 'minute');
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => {
        const map = {
          normal: { text: '正常', color: 'green' },
          late: { text: '迟到', color: 'orange' },
          early: { text: '早退', color: 'volcano' },
          absent: { text: '缺勤', color: 'red' },
          leave: { text: '请假', color: 'blue' },
        };
        const info = map[status] || { text: status || '-', color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  // 普通员工视角
  const visibleDetailColumns = (!canViewAll && !canViewDept)
    ? detailColumns.filter((col) => col.dataIndex !== 'employeeName' && col.dataIndex !== 'departmentName')
    : detailColumns;

  /** 部门对比表格列 */
  const deptColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => {
        const rank = index + 1;
        if (rank <= 3) {
          const colors = ['#f5222d', '#fa8c16', '#faad14'];
          return (
            <Tag color={colors[rank - 1]} style={{ fontWeight: 700 }}>
              {rank}
            </Tag>
          );
        }
        return <Text type="secondary">{rank}</Text>;
      },
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 150,
    },
    {
      title: '考勤率',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 200,
      render: (rate) => renderProgress(rate),
    },
    {
      title: '正常天数',
      dataIndex: 'normal',
      key: 'normal',
      width: 90,
      align: 'center',
    },
    {
      title: '迟到天数',
      dataIndex: 'late',
      key: 'late',
      width: 90,
      align: 'center',
      render: (val) => val || 0,
    },
    {
      title: '早退天数',
      dataIndex: 'early',
      key: 'early',
      width: 90,
      align: 'center',
      render: (val) => val || 0,
    },
    {
      title: '缺勤天数',
      dataIndex: 'absent',
      key: 'absent',
      width: 90,
      align: 'center',
      render: (val) => val || 0,
    },
    {
      title: '请假天数',
      dataIndex: 'leave',
      key: 'leave',
      width: 90,
      align: 'center',
      render: (val) => val || 0,
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* 页面标题 + 月份选择 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <DashboardOutlined style={{ marginRight: 8 }} />
            考勤统计
          </Title>
        </Col>
        <Col>
          <Space>
            <Text type="secondary">统计月份：</Text>
            <Select
              value={month}
              onChange={setMonth}
              style={{ width: 160 }}
            >
              {monthOptions}
            </Select>
          </Space>
        </Col>
      </Row>

      {/* 权限提示 */}
      {canViewDept && !canViewAll && (
        <Alert
          message="您当前以部门经理身份查看，仅可查看本部门的考勤统计数据。"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 统计概览卡片 */}
      <Spin spinning={summaryLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((card) => (
            <Col xs={12} sm={8} md={4} key={card.key}>
              <Card
                size="small"
                bordered={false}
                style={{
                  borderRadius: 8,
                  background: card.bgColor,
                  borderLeft: `4px solid ${card.borderColor}`,
                }}
                styles={{ body: { padding: '16px 12px' } }}
              >
                <Statistic
                  title={
                    <Text style={{ fontSize: 13, color: '#666' }}>
                      {card.icon} {card.title}
                    </Text>
                  }
                  value={summary[card.key] ?? 0}
                  valueStyle={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: card.color,
                  }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {/* 部门考勤对比 - 仅admin/HR可见 */}
      {canViewAll && (
        <Card
          title={
            <span>
              <TeamOutlined style={{ marginRight: 8 }} />
              部门考勤对比
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          <Table
            columns={deptColumns}
            dataSource={deptData}
            rowKey="departmentName"
            loading={deptLoading}
            pagination={false}
            scroll={{ x: 800 }}
            locale={{ emptyText: '暂无部门数据' }}
            size="middle"
          />
        </Card>
      )}

      {/* 考勤明细表格 */}
      <Card
        title={
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            考勤明细
          </span>
        }
      >
        <Table
          columns={visibleDetailColumns}
          dataSource={detailData}
          rowKey="id"
          loading={detailLoading}
          scroll={{ x: 750 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '31', '50'],
            onChange: (page, pageSize) => fetchDetail(page, pageSize),
          }}
          locale={{ emptyText: '暂无考勤明细' }}
        />
      </Card>
    </div>
  );
};

export default AttendanceStatsPage;
