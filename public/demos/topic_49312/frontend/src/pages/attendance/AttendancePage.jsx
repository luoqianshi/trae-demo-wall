import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Table, Button, Tag, Row, Col, Statistic, message, Spin,
  Alert, Badge, Typography, Space, Tooltip
} from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined,
  LoginOutlined, LogoutOutlined, CalendarOutlined,
  WarningOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { get, post } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/** 考勤状态映射 */
const statusMap = {
  normal: { text: '正常', color: 'green', icon: <CheckCircleOutlined /> },
  late: { text: '迟到', color: 'orange', icon: <WarningOutlined /> },
  early: { text: '早退', color: 'volcano', icon: <WarningOutlined /> },
  absent: { text: '缺勤', color: 'red', icon: <CloseCircleOutlined /> },
  leave: { text: '请假', color: 'blue', icon: <ClockCircleOutlined /> },
};

/** 计算工作时长（小时） */
const calcWorkHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return '-';
  const start = dayjs(clockIn, 'HH:mm:ss');
  const end = dayjs(clockOut, 'HH:mm:ss');
  if (end.isBefore(start)) return '-';
  const diff = end.diff(start, 'minute');
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
};

const AttendancePage = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 31, total: 0 });

  const user = getUser();
  const isEmployeeRole = user && hasRole('employee');
  const isManagerRole = user && hasRole('manager');
  const isHROrAdmin = user && hasRole('admin', 'hr');

  /** 实时时钟 */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /** 获取今日打卡记录 */
  const fetchTodayRecord = useCallback(async () => {
    try {
      const params = { date: dayjs().format('YYYY-MM-DD') };
      // 注意：employeeId不需要前端传，后端根据角色自动过滤
      if (isManagerRole && user.departmentId) {
        params.departmentId = user.departmentId;
      }
      const res = await get('/attendance', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      if (list.length > 0) {
        setTodayRecord(list[0]);
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error('获取今日考勤失败:', err);
    }
  }, [user, isEmployeeRole, isManagerRole]);

  /** 获取本月考勤记录 */
  const fetchRecords = useCallback(async (page = 1, pageSize = 31) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        month: dayjs().format('YYYY-MM'),
      };
      // 注意：employeeId不需要前端传，后端根据角色自动过滤
      if (isManagerRole && user.departmentId) {
        params.departmentId = user.departmentId;
      }

      const res = await get('/attendance', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setRecords(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取考勤记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isEmployeeRole, isManagerRole]);

  useEffect(() => {
    fetchTodayRecord();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords(1);
  }, [isEmployeeRole, isManagerRole]);

  /** 签到 */
  const handleCheckIn = async () => {
    setClockInLoading(true);
    try {
      const res = await post('/attendance/check-in');
      message.success(`签到成功！签到时间：${res.data?.clockIn || res.clockIn || dayjs().format('HH:mm:ss')}`);
      fetchTodayRecord();
      fetchRecords(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('签到失败:', err);
    } finally {
      setClockInLoading(false);
    }
  };

  /** 签退 */
  const handleCheckOut = async () => {
    setClockOutLoading(true);
    try {
      const res = await post('/attendance/check-out');
      message.success(`签退成功！签退时间：${res.data?.clockOut || res.clockOut || dayjs().format('HH:mm:ss')}`);
      fetchTodayRecord();
      fetchRecords(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('签退失败:', err);
    } finally {
      setClockOutLoading(false);
    }
  };

  /** 渲染考勤状态 */
  const renderStatus = (status) => {
    const info = statusMap[status] || { text: status || '未知', color: 'default', icon: null };
    return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
  };

  /** 表格列定义 */
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left',
    },
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
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
      render: (_, record) => calcWorkHours(record.clockIn, record.clockOut),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => renderStatus(status),
    },
  ];

  // 员工视角隐藏员工姓名和部门列
  const visibleColumns = isEmployeeRole && !isManagerRole && !isHROrAdmin
    ? columns.filter((col) => col.dataIndex !== 'employeeName' && col.dataIndex !== 'departmentName')
    : columns;

  const hasCheckedIn = todayRecord && todayRecord.clockIn;
  const hasCheckedOut = todayRecord && todayRecord.clockOut;

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* 打卡区域 - 大卡片 */}
      <Card
        style={{ marginBottom: 24, borderRadius: 12 }}
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={[24, 24]} align="middle">
          {/* 左侧：日期时间 */}
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {currentTime.format('YYYY年MM月DD日')}
              </Title>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: '#1890ff',
                }}
              >
                {currentTime.format('HH:mm:ss')}
              </Text>
              <Text type="secondary">
                {currentTime.format('dddd')}
              </Text>
            </Space>
          </Col>

          {/* 中间：打卡按钮 */}
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={12} style={{ width: '100%', alignItems: 'center' }}>
              <Space size={16}>
                <Tooltip title={hasCheckedIn ? `已签到 ${todayRecord.clockIn}` : '点击签到'}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<LoginOutlined />}
                    loading={clockInLoading}
                    disabled={hasCheckedIn}
                    onClick={handleCheckIn}
                    style={{
                      height: 64,
                      width: 160,
                      fontSize: 18,
                      borderRadius: 12,
                      background: hasCheckedIn ? '#d9d9d9' : undefined,
                      borderColor: hasCheckedIn ? '#d9d9d9' : undefined,
                    }}
                  >
                    {hasCheckedIn ? '已签到' : '签到打卡'}
                  </Button>
                </Tooltip>

                <Tooltip title={hasCheckedOut ? `已签退 ${todayRecord.clockOut}` : '点击签退'}>
                  <Button
                    type="primary"
                    danger={!hasCheckedOut}
                    size="large"
                    icon={<LogoutOutlined />}
                    loading={clockOutLoading}
                    disabled={!hasCheckedIn || hasCheckedOut}
                    onClick={handleCheckOut}
                    style={{
                      height: 64,
                      width: 160,
                      fontSize: 18,
                      borderRadius: 12,
                      background: hasCheckedOut ? '#d9d9d9' : undefined,
                      borderColor: hasCheckedOut ? '#d9d9d9' : undefined,
                    }}
                  >
                    {hasCheckedOut ? '已签退' : '签退打卡'}
                  </Button>
                </Tooltip>
              </Space>

              {/* 今日打卡状态提示 */}
              {todayRecord && todayRecord.status && (
                <div style={{ marginTop: 4 }}>
                  {renderStatus(todayRecord.status)}
                  {todayRecord.remark && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {todayRecord.remark}
                    </Text>
                  )}
                </div>
              )}
            </Space>
          </Col>

          {/* 右侧：今日概览 */}
          <Col xs={24} md={8}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="签到时间"
                  value={todayRecord?.clockIn || '--:--'}
                  valueStyle={{ fontSize: 20, color: hasCheckedIn ? '#3f8600' : '#999' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="签退时间"
                  value={todayRecord?.clockOut || '--:--'}
                  valueStyle={{ fontSize: 20, color: hasCheckedOut ? '#3f8600' : '#999' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
            {hasCheckedIn && hasCheckedOut && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Text strong>
                  工作时长：
                  {calcWorkHours(todayRecord.clockIn, todayRecord.clockOut)}
                </Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 本月考勤记录 */}
      <Card
        title={
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            本月考勤记录（{dayjs().format('YYYY年MM月')}）
          </span>
        }
      >
        {/* 权限提示 */}
        {isManagerRole && !isHROrAdmin && (
          <Alert
            message="您当前以部门经理身份查看，仅可查看本部门员工的考勤数据。"
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={visibleColumns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['15', '31', '62'],
            onChange: (page, pageSize) => fetchRecords(page, pageSize),
          }}
          locale={{ emptyText: '暂无考勤记录' }}
        />
      </Card>
    </div>
  );
};

export default AttendancePage;
