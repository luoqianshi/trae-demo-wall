import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  InputNumber, message, Popconfirm, Tag, Row, Col, DatePicker
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;
const { TextArea } = Input;

/** 考核状态映射 */
const statusMap = {
  pending_self: { text: '待自评', color: 'orange' },
  manager_reviewing: { text: '主管评分中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
};

/** 考核周期选项 */
const periodOptions = [
  { label: '2024Q1', value: '2024Q1' },
  { label: '2024Q2', value: '2024Q2' },
  { label: '2024Q3', value: '2024Q3' },
  { label: '2024Q4', value: '2024Q4' },
  { label: '2024H1', value: '2024H1' },
  { label: '2024H2', value: '2024H2' },
  { label: '2024年度', value: '2024年度' },
  { label: '2025Q1', value: '2025Q1' },
  { label: '2025Q2', value: '2025Q2' },
  { label: '2025Q3', value: '2025Q3' },
  { label: '2025Q4', value: '2025Q4' },
  { label: '2025H1', value: '2025H1' },
  { label: '2025H2', value: '2025H2' },
  { label: '2025年度', value: '2025年度' },
];

/** 考核类型选项 */
const typeOptions = [
  { label: 'KPI', value: 'KPI' },
  { label: 'OKR', value: 'OKR' },
];

const PerformancesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // 新增考核 Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  // 自评 Modal
  const [selfModalVisible, setSelfModalVisible] = useState(false);
  const [selfRecord, setSelfRecord] = useState(null);
  const [selfForm] = Form.useForm();

  // 主管评分 Modal
  const [managerModalVisible, setManagerModalVisible] = useState(false);
  const [managerRecord, setManagerRecord] = useState(null);
  const [managerForm] = Form.useForm();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const user = getUser();
  const isAdminOrHR = user && hasRole('admin', 'hr');
  const isManagerRole = user && hasRole('manager');
  const isEmployeeRole = user && hasRole('employee');

  /** 获取绩效列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (periodFilter) params.period = periodFilter;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      // 权限控制
      if (isEmployeeRole) {
        params.employeeId = user.id;
      } else if (isManagerRole && user.departmentId) {
        params.departmentId = user.departmentId;
      }

      const res = await get('/performances', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取绩效列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, periodFilter, typeFilter, statusFilter, isEmployeeRole, isManagerRole, user]);

  /** 获取员工列表 */
  const fetchEmployees = async () => {
    try {
      const res = await get('/employees', { pageSize: 999 });
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
    fetchList();
    if (isAdminOrHR || isManagerRole) {
      fetchEmployees();
      fetchDepartments();
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [keyword, periodFilter, typeFilter, statusFilter]);

  /** 新增考核 */
  const handleAdd = () => {
    addForm.resetFields();
    setAddModalVisible(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields();
      await post('/performances', values);
      message.success('新增考核成功');
      setAddModalVisible(false);
      fetchList(1);
    } catch (err) {
      console.error('新增考核失败:', err);
    }
  };

  /** 删除考核 */
  const handleDelete = async (record) => {
    try {
      await del(`/performances/${record.id}`);
      message.success('删除成功');
      fetchList(pagination.current);
    } catch (err) {
      console.error('删除考核失败:', err);
    }
  };

  /** 员工自评 */
  const handleSelfEval = (record) => {
    setSelfRecord(record);
    selfForm.resetFields();
    selfForm.setFieldsValue({
      selfContent: record.selfContent || '',
      selfScore: record.selfScore || undefined,
    });
    setSelfModalVisible(true);
  };

  const handleSelfSubmit = async () => {
    try {
      const values = await selfForm.validateFields();
      await put(`/performances/${selfRecord.id}/self-evaluate`, values);
      message.success('自评提交成功');
      setSelfModalVisible(false);
      fetchList(pagination.current);
    } catch (err) {
      console.error('自评提交失败:', err);
    }
  };

  /** 主管评分 */
  const handleManagerEval = (record) => {
    setManagerRecord(record);
    managerForm.resetFields();
    managerForm.setFieldsValue({
      managerComment: record.managerComment || '',
      managerScore: record.managerScore || undefined,
    });
    setManagerModalVisible(true);
  };

  const handleManagerSubmit = async () => {
    try {
      const values = await managerForm.validateFields();
      await put(`/performances/${managerRecord.id}/manager-evaluate`, values);
      message.success('主管评分提交成功');
      setManagerModalVisible(false);
      fetchList(pagination.current);
    } catch (err) {
      console.error('主管评分提交失败:', err);
    }
  };

  /** 获取部门名称 */
  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '-';
  };

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'departmentId',
      key: 'departmentId',
      width: 120,
      render: (val) => getDepartmentName(val),
    },
    {
      title: '考核周期',
      dataIndex: 'period',
      key: 'period',
      width: 100,
      filters: periodOptions.map((p) => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.period === value,
    },
    {
      title: '考核类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (val) => <Tag>{val}</Tag>,
    },
    {
      title: '自评得分',
      dataIndex: 'selfScore',
      key: 'selfScore',
      width: 90,
      render: (val) => (val != null ? val : '-'),
    },
    {
      title: '主管评分',
      dataIndex: 'managerScore',
      key: 'managerScore',
      width: 90,
      render: (val) => (val != null ? val : '-'),
    },
    {
      title: '最终得分',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 90,
      render: (val) => (val != null ? <Tag color="blue">{val}</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (val) => {
        const s = statusMap[val] || { text: val, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actions = [];
        // 待自评状态且是员工本人或管理员
        if (record.status === 'pending_self') {
          if ((isEmployeeRole && record.employeeId === user?.id) || isAdminOrHR) {
            actions.push(
              <Button key="self" type="link" size="small" onClick={() => handleSelfEval(record)}>
                自评
              </Button>
            );
          }
        }
        // 主管评分中状态且是主管或管理员
        if (record.status === 'manager_reviewing' || record.status === 'pending_self') {
          if (isManagerRole || isAdminOrHR) {
            actions.push(
              <Button key="manager" type="link" size="small" onClick={() => handleManagerEval(record)}>
                主管评分
              </Button>
            );
          }
        }
        // 删除仅管理员/HR
        if (isAdminOrHR) {
          actions.push(
            <Popconfirm key="delete" title="确定删除此考核记录？" onConfirm={() => handleDelete(record)}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          );
        }
        return <Space size="small">{actions}</Space>;
      },
    },
  ];

  return (
    <Card title="绩效管理">
      {/* 筛选栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="搜索员工姓名"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="考核周期"
            value={periodFilter || undefined}
            onChange={setPeriodFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {periodOptions.map((p) => (
              <Option key={p.value} value={p.value}>
                {p.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder="考核类型"
            value={typeFilter || undefined}
            onChange={setTypeFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {typeOptions.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder="状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>
                {val.text}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <Space>
            {isAdminOrHR && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增考核
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          onChange: (page, pageSize) => fetchList(page, pageSize),
        }}
        scroll={{ x: 900 }}
      />

      {/* 新增考核 Modal */}
      <Modal
        title="新增考核"
        open={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={() => setAddModalVisible(false)}
        destroyOnHidden
        width={560}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="选择员工"
            name="employeeId"
            rules={[{ required: true, message: '请选择员工' }]}
          >
            <Select
              placeholder="请选择员工"
              showSearch
              optionFilterProp="label"
              options={employees.map((emp) => ({
                label: `${emp.name} - ${getDepartmentName(emp.departmentId)}`,
                value: emp.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="考核周期"
                name="period"
                rules={[{ required: true, message: '请选择考核周期' }]}
              >
                <Select placeholder="请选择" options={periodOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="考核类型"
                name="type"
                rules={[{ required: true, message: '请选择考核类型' }]}
              >
                <Select placeholder="请选择" options={typeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="考核目标/指标"
            name="goals"
            rules={[{ required: true, message: '请填写考核目标/指标' }]}
          >
            <TextArea rows={4} placeholder="请填写考核目标或指标" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 自评 Modal */}
      <Modal
        title="员工自评"
        open={selfModalVisible}
        onOk={handleSelfSubmit}
        onCancel={() => setSelfModalVisible(false)}
        destroyOnHidden
        width={520}
      >
        <Form form={selfForm} layout="vertical">
          <Form.Item
            label="自评内容"
            name="selfContent"
            rules={[{ required: true, message: '请填写自评内容' }]}
          >
            <TextArea rows={4} placeholder="请填写自评内容" />
          </Form.Item>
          <Form.Item
            label="自评得分"
            name="selfScore"
            rules={[{ required: true, message: '请填写自评得分' }]}
            extra="评分范围 1-100"
          >
            <InputNumber min={1} max={100} placeholder="请输入1-100的分数" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 主管评分 Modal */}
      <Modal
        title="主管评分"
        open={managerModalVisible}
        onOk={handleManagerSubmit}
        onCancel={() => setManagerModalVisible(false)}
        destroyOnHidden
        width={520}
      >
        <Form form={managerForm} layout="vertical">
          <Form.Item
            label="评价"
            name="managerComment"
            rules={[{ required: true, message: '请填写评价内容' }]}
          >
            <TextArea rows={4} placeholder="请填写评价内容" />
          </Form.Item>
          <Form.Item
            label="评分"
            name="managerScore"
            rules={[{ required: true, message: '请填写评分' }]}
            extra="评分范围 1-100"
          >
            <InputNumber min={1} max={100} placeholder="请输入1-100的分数" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PerformancesPage;
