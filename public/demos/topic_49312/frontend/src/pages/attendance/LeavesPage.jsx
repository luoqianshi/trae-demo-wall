import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Select, Space, Modal, Form,
  DatePicker, message, Tag, Row, Col, Input, Popconfirm,
  Alert, Tooltip
} from 'antd';
import {
  PlusOutlined, CheckOutlined, CloseOutlined,
  RollbackOutlined, FileTextOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

/** 请假类型选项 */
const leaveTypeOptions = [
  { value: 'annual', label: '年假' },
  { value: 'personal', label: '事假' },
  { value: 'sick', label: '病假' },
  { value: 'compensatory', label: '调休' },
  { value: 'marriage', label: '婚假' },
  { value: 'maternity', label: '产假' },
];

/** 请假类型映射 */
const leaveTypeMap = {};
leaveTypeOptions.forEach((item) => {
  leaveTypeMap[item.value] = item.label;
});

/**
 * 请假状态映射
 * 后端存储使用数字: 0=待审批, 1=已通过, 2=已驳回, 3=已取消
 * 前端筛选使用字符串: pending/approved/rejected/cancelled（后端自动兼容）
 */
const statusMap = {
  0: { text: '待审批', color: 'gold' },
  1: { text: '已通过', color: 'green' },
  2: { text: '已驳回', color: 'red' },
  3: { text: '已取消', color: 'default' },
  // 兼容字符串key
  pending: { text: '待审批', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
  cancelled: { text: '已取消', color: 'default' },
};

/** 待审批状态值（后端返回0） */
const STATUS_PENDING = 0;

/** 计算请假天数 */
const calcDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return end.diff(start, 'day') + 1;
};

const LeavesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  // 审批意见弹窗（仅驳回时需要填写理由）
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const user = getUser();
  const isEmployeeRole = user && hasRole('employee');
  const isManagerRole = user && hasRole('manager');
  const isHROrAdmin = user && hasRole('admin', 'hr');
  const canApprove = isHROrAdmin || isManagerRole; // admin/HR/manager可审批

  /** 获取请假列表 */
  const fetchLeaves = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      // 注意：employeeId 不需要前端传，后端根据角色自动过滤
      // manager 也不需要传 departmentId，后端自动根据角色过滤
      // 但如果前端需要显式过滤，可以传（后端已支持）
      if (isManagerRole && !isHROrAdmin && user?.departmentId) {
        params.departmentId = user.departmentId;
      }

      const res = await get('/leaves', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取请假列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, user, isEmployeeRole, isManagerRole, isHROrAdmin]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    fetchLeaves(1);
  }, [statusFilter, typeFilter]);

  /** 新增请假申请 */
  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  /** 提交请假申请 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        type: values.type,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        days: calcDays(values.startDate, values.endDate),
        reason: values.reason,
      };

      if (submitData.startDate && submitData.endDate && submitData.days < 1) {
        message.warning('结束日期不能早于开始日期');
        return;
      }

      await post('/leaves', submitData);
      message.success('请假申请已提交');
      setModalVisible(false);
      form.resetFields();
      fetchLeaves(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交请假申请失败:', err);
    }
  };

  /** 直接通过审批 */
  const handleApproveDirect = async (record) => {
    try {
      await put(`/leaves/${record.id}/approve`, { action: 'approve' });
      message.success('已通过该请假申请');
      fetchLeaves(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('审批失败:', err);
    }
  };

  /** 打开驳回弹窗 */
  const handleOpenReject = (record) => {
    setRejectTarget(record);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  /** 提交驳回 */
  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await put(`/leaves/${rejectTarget.id}/approve`, { action: 'reject', reason: rejectReason });
      message.success('已驳回该请假申请');
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
      fetchLeaves(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('驳回失败:', err);
    }
  };

  /** 撤销请假 */
  const handleCancel = async (record) => {
    try {
      await del(`/leaves/${record.id}`);
      message.success('已撤销该请假申请');
      fetchLeaves(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('撤销失败:', err);
    }
  };

  /** 渲染状态 */
  const renderStatus = (status) => {
    const info = statusMap[status] || { text: status || '未知', color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  /** 判断是否为本人申请（用于撤销权限） */
  const isOwnLeave = (record) => {
    // employeeId 是 employees 表主键，而 user.id 是 users 表主键
    // 对于员工本人，后端返回的 applicantName 或 employeeName 应匹配
    // 最可靠方式：检查 employeeId 是否关联当前用户
    return !!(user && (
      record.applicantName === user.realName ||
      record.employeeName === user.realName ||
      record.applicantName === user.username
    ));
  };

  /** 表格列定义 */
  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 90,
      render: (type) => leaveTypeMap[type] || type || '-',
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days',
      width: 70,
      align: 'center',
      render: (val) => val || '-',
    },
    {
      title: '请假原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (val) => (
        <Tooltip title={val}>
          <span>{val || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => renderStatus(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionItems = [];
        // 审批操作 - 待审批状态下由有审批权限的人操作
        if (record.status === STATUS_PENDING && canApprove) {
          actionItems.push(
            <Popconfirm
              key="pass"
              title="确定通过该请假申请？"
              onConfirm={() => handleApproveDirect(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
            </Popconfirm>
          );
          actionItems.push(
            <Button
              key="reject"
              type="link"
              size="small"
              icon={<CloseOutlined />}
              danger
              onClick={() => handleOpenReject(record)}
            >
              驳回
            </Button>
          );
        }
        // 撤销操作 - 仅本人且待审批状态
        if (record.status === STATUS_PENDING && isOwnLeave(record)) {
          actionItems.push(
            <Popconfirm
              key="cancel"
              title="确定撤销该请假申请？"
              description="撤销后将无法恢复。"
              onConfirm={() => handleCancel(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<RollbackOutlined />}
              >
                撤销
              </Button>
            </Popconfirm>
          );
        }
        return <Space size="small">{actionItems}</Space>;
      },
    },
  ];

  // 普通员工视角隐藏员工姓名和部门列
  const visibleColumns = (isEmployeeRole && !isManagerRole && !isHROrAdmin)
    ? columns.filter((col) => col.dataIndex !== 'employeeName' && col.dataIndex !== 'departmentName')
    : columns;

  return (
    <Card
      title={
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          假期审批管理
        </span>
      }
    >
      {/* 权限提示 */}
      {isManagerRole && !isHROrAdmin && (
        <Alert
          message="您当前以部门经理身份查看，可审批本部门员工的请假申请。"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 筛选栏 + 新增按钮 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            <Select
              placeholder="请假类型"
              allowClear
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 140 }}
            >
              {leaveTypeOptions.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增请假
          </Button>
        </Col>
      </Row>

      {/* 请假列表 */}
      <Table
        columns={visibleColumns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchLeaves(page, pageSize),
        }}
        locale={{ emptyText: '暂无请假记录' }}
      />

      {/* 新增请假 Modal */}
      <Modal
        title="新增请假申请"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={560}
        destroyOnHidden
        okText="提交申请"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="请假类型"
            name="type"
            rules={[{ required: true, message: '请选择请假类型' }]}
          >
            <Select placeholder="请选择请假类型">
              {leaveTypeOptions.map((item) => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="开始日期"
                name="startDate"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择开始日期"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束日期"
                name="endDate"
                rules={[{ required: true, message: '请选择结束日期' }]}
                dependencies={['startDate']}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择结束日期"
                  disabledDate={(current) => {
                    if (!current) return false;
                    const start = form.getFieldValue('startDate');
                    if (start) return current.isBefore(start, 'day');
                    return current < dayjs().startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="请假原因"
            name="reason"
            rules={[{ required: true, message: '请填写请假原因' }]}
          >
            <TextArea
              placeholder="请详细描述请假原因"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 驳回弹窗 - 需要填写驳回理由 */}
      <Modal
        title="驳回请假申请"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectTarget(null);
          setRejectReason('');
        }}
        width={480}
        destroyOnHidden
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <Form.Item label="驳回原因">
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写驳回原因（可选）"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default LeavesPage;
