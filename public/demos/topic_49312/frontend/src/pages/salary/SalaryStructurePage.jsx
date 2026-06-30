import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  InputNumber, message, Popconfirm, Tag, Row, Col, DatePicker
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { get, post, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;

/** 状态映射 */
const statusMap = {
  active: { text: '生效中', color: 'green' },
  inactive: { text: '已失效', color: 'default' },
};

const SalaryStructurePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // 设置薪资 Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const user = getUser();
  const canOperate = user && hasRole('admin', 'hr');

  /** 获取薪资结构列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await get('/salaries', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取薪资结构列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, departmentFilter, statusFilter]);

  /** 获取员工列表 */
  const fetchEmployees = async () => {
    try {
      const res = await get('/employees', { pageSize: 999, status: 'active' });
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
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [keyword, departmentFilter, statusFilter]);

  /** 新建薪资 */
  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // DatePicker 返回的是 dayjs 对象，需要格式化
      if (values.effectiveDate) {
        values.effectiveDate = values.effectiveDate.format('YYYY-MM-DD');
      }
      await post('/salaries', values);
      message.success('薪资设置成功，旧薪资已自动失效');
      setModalVisible(false);
      fetchList(1);
    } catch (err) {
      console.error('薪资设置失败:', err);
    }
  };

  /** 删除薪资（仅能删除失效记录） */
  const handleDelete = async (record) => {
    try {
      await del(`/salaries/${record.id}`);
      message.success('删除成功');
      fetchList(pagination.current);
    } catch (err) {
      console.error('删除薪资失败:', err);
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
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
    },
    {
      title: '底薪',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 100,
      align: 'right',
      render: (val) => val != null ? `¥${val.toLocaleString()}` : '-',
    },
    {
      title: '岗位津贴',
      dataIndex: 'positionAllowance',
      key: 'positionAllowance',
      width: 100,
      align: 'right',
      render: (val) => val != null ? `¥${val.toLocaleString()}` : '-',
    },
    {
      title: '绩效奖金比例',
      dataIndex: 'bonusRate',
      key: 'bonusRate',
      width: 110,
      align: 'center',
      render: (val) => (val != null ? `${val}%` : '-'),
    },
    {
      title: '其他补贴',
      dataIndex: 'otherAllowance',
      key: 'otherAllowance',
      width: 100,
      align: 'right',
      render: (val) => val != null ? `¥${val.toLocaleString()}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val) => {
        const s = statusMap[val] || { text: val, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        // 仅能删除已失效的薪资
        if (canOperate && record.status === 'inactive') {
          return (
            <Popconfirm title="确定删除此薪资记录？" onConfirm={() => handleDelete(record)}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          );
        }
        return '-';
      },
    },
  ];

  return (
    <Card title="薪资结构管理">
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
        <Col span={5}>
          <Select
            placeholder="部门筛选"
            value={departmentFilter || undefined}
            onChange={setDepartmentFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {departments.map((d) => (
              <Option key={d.id} value={d.id}>
                {d.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
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
        <Col span={9}>
          <Space>
            {canOperate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                设置薪资
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
        scroll={{ x: 960 }}
      />

      {/* 设置薪资 Modal */}
      <Modal
        title="设置薪资"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
        width={560}
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
              optionFilterProp="label"
              options={employees.map((emp) => ({
                label: `${emp.name} - ${emp.position || ''} (${getDepartmentName(emp.departmentId)})`,
                value: emp.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="底薪"
                name="baseSalary"
                rules={[{ required: true, message: '请输入底薪' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="请输入"
                  style={{ width: '100%' }}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="岗位津贴"
                name="positionAllowance"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="请输入"
                  style={{ width: '100%' }}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="绩效奖金比例(%)"
                name="bonusRate"
                initialValue={0}
                extra="如20表示20%"
              >
                <InputNumber min={0} max={100} precision={1} placeholder="0-100" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="其他补贴"
                name="otherAllowance"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="请输入"
                  style={{ width: '100%' }}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="生效日期"
            name="effectiveDate"
            rules={[{ required: true, message: '请选择生效日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SalaryStructurePage;
