import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  DatePicker, InputNumber, message, Popconfirm, Tag, Row, Col, Alert, Tooltip
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, SwapOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;
const { TextArea } = Input;

/** 异动类型映射 */
const changeTypeMap = {
  transfer: { text: '调岗', color: 'blue' },
  promotion: { text: '晋升', color: 'green' },
  demotion: { text: '降职', color: 'orange' },
  salary_cut: { text: '降薪', color: 'red' },
  regularization: { text: '转正', color: 'purple' },
};

/** 异动状态映射 */
const changeStatusMap = {
  pending: { text: '待审批', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
  cancelled: { text: '已取消', color: 'default' },
};

const EmployeeChangesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  // 下拉数据
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const canApprove = user && hasRole('admin', 'hr', 'manager');

  /** 获取异动列表 */
  const fetchChanges = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (typeFilter) params.changeType = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await get('/employee-changes', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取异动列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, typeFilter, statusFilter]);

  /** 获取员工列表（下拉选择用） */
  const fetchEmployees = async () => {
    try {
      const res = await get('/employees', { pageSize: 999, status: 'active,probation' });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setEmployees(list);
    } catch (err) {
      console.error('获取员工列表失败:', err);
    }
  };

  /** 获取部门列表 */
  const fetchDepartments = async () => {
    try {
      const res = await get('/departments', { pageSize: 999 });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setDepartments(list);
    } catch (err) {
      console.error('获取部门列表失败:', err);
    }
  };

  useEffect(() => {
    fetchChanges();
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchChanges(1);
  }, [keyword, typeFilter, statusFilter]);

  /** 新增异动申请 */
  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  /** 审批通过 */
  const handleApprove = async (record) => {
    try {
      await put(`/employee-changes/${record.id}/approve`);
      message.success('审批通过');
      fetchChanges(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('审批失败:', err);
    }
  };

  /** 审批驳回 */
  const handleReject = async (record) => {
    Modal.confirm({
      title: '驳回异动申请',
      content: (
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="驳回原因">
            <TextArea
              id="reject-reason"
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
        const reason = document.getElementById('reject-reason')?.value || '';
        try {
          await put(`/employee-changes/${record.id}/reject`, { reason });
          message.success('已驳回');
          fetchChanges(pagination.current, pagination.pageSize);
        } catch (err) {
          console.error('驳回失败:', err);
        }
      },
    });
  };

  /** 取消申请 */
  const handleCancel = async (record) => {
    try {
      await put(`/employee-changes/${record.id}/cancel`);
      message.success('已取消');
      fetchChanges(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('取消失败:', err);
    }
  };

  /** 提交新增 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.effectiveDate) {
        values.effectiveDate = values.effectiveDate.format('YYYY-MM-DD');
      }
      await post('/employee-changes', values);
      message.success('提交成功，等待审批');
      setModalVisible(false);
      form.resetFields();
      fetchChanges(1);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  /** 选中员工变化时自动填充原部门和岗位 */
  const handleEmployeeChange = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      form.setFieldsValue({
        fromDepartmentId: emp.departmentId,
        fromPosition: emp.position,
      });
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
      title: '异动类型',
      dataIndex: 'changeType',
      key: 'changeType',
      width: 90,
      render: (type) => {
        const info = changeTypeMap[type] || { text: type, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '异动前部门/岗位',
      key: 'fromInfo',
      width: 160,
      render: (_, record) => (
        <span>
          {record.fromDepartmentName || record.fromDepartment || '-'} / {record.fromPosition || '-'}
        </span>
      ),
    },
    {
      title: '异动后部门/岗位',
      key: 'toInfo',
      width: 160,
      render: (_, record) => (
        <span>
          {record.toDepartmentName || record.toDepartment || '-'} / {record.toPosition || '-'}
        </span>
      ),
    },
    {
      title: '薪资变动',
      key: 'salaryChange',
      width: 120,
      render: (_, record) => {
        if (!record.newSalary && record.newSalary !== 0) return '-';
        const oldSalary = record.oldSalary || 0;
        const diff = record.newSalary - oldSalary;
        if (diff > 0) {
          return <span style={{ color: '#52c41a' }}>+{diff} 元</span>;
        } else if (diff < 0) {
          return <span style={{ color: '#ff4d4f' }}>{diff} 元</span>;
        }
        return <span>无变动</span>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => {
        const info = changeStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && canApprove && (
            <>
              <Tooltip title="审批通过后，系统将自动同步员工档案、考勤归属、绩效归属、薪资核算">
                <Popconfirm
                  title="确认通过此异动申请？"
                  description="通过后将自动同步员工档案、考勤归属、绩效归属及薪资核算。"
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
              </Tooltip>
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
      title={<span><SwapOutlined /> 员工异动管理</span>}
      extra={
        <Tooltip title="异动审批通过后，系统将自动同步员工档案信息、考勤归属部门、绩效归属部门及薪资核算数据。">
          <Alert
            message="审批通过后自动同步员工档案、考勤归属、绩效归属、薪资核算"
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
              placeholder="异动类型"
              allowClear
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 130 }}
            >
              <Option value="transfer">调岗</Option>
              <Option value="promotion">晋升</Option>
              <Option value="demotion">降职</Option>
              <Option value="salary_cut">降薪</Option>
              <Option value="regularization">转正</Option>
            </Select>
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增异动申请
            </Button>
          </Col>
        )}
      </Row>

      {/* 异动列表 */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchChanges(page, pageSize),
        }}
      />

      {/* 新增异动 Modal */}
      <Modal
        title="新增异动申请"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={640}
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
              onChange={handleEmployeeChange}
            >
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.employeeNo || ''} ({emp.departmentName || '-'}/{emp.position || '-'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="异动类型" name="changeType" rules={[{ required: true, message: '请选择异动类型' }]}>
                <Select placeholder="请选择异动类型">
                  <Option value="transfer">调岗</Option>
                  <Option value="promotion">晋升</Option>
                  <Option value="demotion">降职</Option>
                  <Option value="salary_cut">降薪</Option>
                  <Option value="regularization">转正</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="生效日期" name="effectiveDate" rules={[{ required: true, message: '请选择生效日期' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择生效日期" />
              </Form.Item>
            </Col>
          </Row>

          {/* 原信息展示（只读） */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="原部门" name="fromDepartmentId">
                <Input disabled placeholder="选择员工后自动填充" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="原岗位" name="fromPosition">
                <Input disabled placeholder="选择员工后自动填充" />
              </Form.Item>
            </Col>
          </Row>

          {/* 新信息 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="新部门" name="toDepartmentId">
                <Select placeholder="请选择新部门" allowClear>
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="新岗位" name="toPosition">
                <Input placeholder="请输入新岗位" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="新薪资（元/月）" name="newSalary">
                <InputNumber
                  min={0}
                  placeholder="请输入新薪资"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="异动原因" name="reason">
            <TextArea rows={3} placeholder="请输入异动原因" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default EmployeeChangesPage;
