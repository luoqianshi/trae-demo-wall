import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  DatePicker, message, Popconfirm, Tag, Row, Col, Alert, Tooltip
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SearchOutlined, LogoutOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;
const { TextArea } = Input;

/** 离职状态映射 */
const resignationStatusMap = {
  pending: { text: '待审批', color: 'orange' },
  approved: { text: '已审批', color: 'blue' },
  confirmed: { text: '已离职', color: 'default' },
  rejected: { text: '已驳回', color: 'red' },
  cancelled: { text: '已取消', color: 'default' },
};

const ResignationsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  // 下拉数据
  const [employees, setEmployees] = useState([]);

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const canApprove = user && hasRole('admin', 'hr', 'manager');

  /** 获取离职列表 */
  const fetchResignations = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;

      const res = await get('/resignations', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取离职列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  /** 获取在职员工列表 */
  const fetchEmployees = async () => {
    try {
      const res = await get('/employees', { pageSize: 999, status: 'active,probation' });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setEmployees(list);
    } catch (err) {
      console.error('获取员工列表失败:', err);
    }
  };

  useEffect(() => {
    fetchResignations();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchResignations(1);
  }, [keyword, statusFilter]);

  /** 提交离职申请 */
  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  /** 审批通过 */
  const handleApprove = async (record) => {
    try {
      await put(`/resignations/${record.id}/approve`);
      message.success('审批通过，离职流程已启动');
      fetchResignations(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('审批失败:', err);
    }
  };

  /** 审批驳回 */
  const handleReject = async (record) => {
    Modal.confirm({
      title: '驳回离职申请',
      content: (
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="驳回原因">
            <TextArea
              id="resign-reject-reason"
              rows={3}
              placeholder="请输入驳回原因"
            />
          </Form.Item>
        </Form>
      ),
      okText: '确认驳回',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const reason = document.getElementById('resign-reject-reason')?.value || '';
        try {
          await put(`/resignations/${record.id}/reject`, { reason });
          message.success('已驳回');
          fetchResignations(pagination.current, pagination.pageSize);
        } catch (err) {
          console.error('驳回失败:', err);
        }
      },
    });
  };

  /** 确认离职生效 */
  const handleComplete = async (record) => {
    Modal.confirm({
      title: '确认离职生效',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确认 {record.employeeName} 的离职已生效？</p>
          <Alert
            message="离职生效后系统将执行以下操作："
            description="1. 账号自动冻结，无法登录系统
2. 停止考勤打卡及薪资核算
3. 历史数据（考勤、绩效、异动记录等）永久留存，可随时查询"
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: '确认生效',
      cancelText: '取消',
      onOk: async () => {
        try {
          await put(`/resignations/${record.id}/confirm`);
          message.success('离职已生效');
          fetchResignations(pagination.current, pagination.pageSize);
        } catch (err) {
          console.error('操作失败:', err);
        }
      },
    });
  };

  /** 取消申请 */
  const handleCancel = async (record) => {
    try {
      await put(`/resignations/${record.id}/cancel`);
      message.success('已取消');
      fetchResignations(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('取消失败:', err);
    }
  };

  /** 提交新增 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.expectedDate) {
        values.expectedDate = values.expectedDate.format('YYYY-MM-DD');
      }
      await post('/resignations', values);
      message.success('离职申请已提交，等待审批');
      setModalVisible(false);
      form.resetFields();
      fetchResignations(1);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  /** 表格列 */
  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      ellipsis: true,
    },
    {
      title: '入职日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 110,
    },
    {
      title: '申请离职日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
    },
    {
      title: '期望离职日期',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 110,
    },
    {
      title: '离职原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '交接人',
      dataIndex: 'handoverTo',
      key: 'handoverTo',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => {
        const info = resignationStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && canApprove && (
            <>
              <Popconfirm
                title="确认通过此离职申请？"
                onConfirm={() => handleApprove(record)}
                okText="确认通过"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                >
                  通过
                </Button>
              </Popconfirm>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
              >
                驳回
              </Button>
            </>
          )}
          {record.status === 'approved' && canEdit && (
            <Button
              type="link"
              onClick={() => handleComplete(record)}
            >
              确认离职生效
            </Button>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="确定要取消此申请吗？"
              onConfirm={() => handleCancel(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link">取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span><LogoutOutlined /> 离职管理</span>}
      extra={
        <Tooltip title="离职生效后系统将自动冻结账号、停止考勤薪资核算，历史数据永久留存。">
          <Alert
            message="离职生效后账号自动冻结、停止考勤薪资、历史数据永久留存"
            type="warning"
            showIcon
            style={{ marginBottom: 0, padding: '4px 12px' }}
          />
        </Tooltip>
      }
    >
      {/* 搜索栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Input
              placeholder="搜索员工姓名"
              prefix={<SearchOutlined />}
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已审批</Option>
              <Option value="confirmed">已离职</Option>
              <Option value="rejected">已驳回</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              提交离职申请
            </Button>
          </Col>
        )}
      </Row>

      {/* 离职列表 */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchResignations(page, pageSize),
        }}
      />

      {/* 提交离职 Modal */}
      <Modal
        title="提交离职申请"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="选择员工"
            name="employeeId"
            rules={[{ required: true, message: '请选择员工' }]}
          >
            <Select
              placeholder="请选择员工"
              showSearch
              optionFilterProp="children"
            >
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.employeeNo || ''} ({emp.departmentName || '-'}/{emp.position || '-'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="离职原因"
            name="reason"
            rules={[{ required: true, message: '请输入离职原因' }]}
          >
            <TextArea rows={3} placeholder="请输入离职原因" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="期望离职日期"
                name="expectedDate"
                rules={[{ required: true, message: '请选择期望离职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择期望离职日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="交接人"
                name="handoverTo"
                rules={[{ required: true, message: '请选择交接人' }]}
              >
                <Select
                  placeholder="请选择交接人"
                  showSearch
                  optionFilterProp="children"
                >
                  {employees.map((emp) => (
                    <Option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.departmentName || '-'}/{emp.position || '-'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="离职生效后系统将自动执行以下操作："
            description="1. 该员工系统账号自动冻结，无法登录
2. 停止考勤打卡及薪资核算
3. 历史数据（考勤、绩效、异动记录、合同信息等）永久留存，可随时查询"
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </Card>
  );
};

export default ResignationsPage;
