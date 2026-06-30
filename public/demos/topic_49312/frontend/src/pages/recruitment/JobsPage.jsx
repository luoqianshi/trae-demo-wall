import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, Form,
  InputNumber, message, Popconfirm, Tag, Card, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;

const statusMap = {
  active: { text: '招聘中', color: 'green' },
  paused: { text: '已暂停', color: 'orange' },
  closed: { text: '已关闭', color: 'default' },
};

const JobsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const isManager = user && hasRole('manager');
  const noPermission = user && hasRole('employee');

  const fetchJobs = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (isManager && user.departmentId) params.departmentId = user.departmentId;

      const res = await get('/jobs', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取岗位列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, isManager, user]);

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
    fetchJobs();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchJobs(1);
  }, [keyword, statusFilter]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      title: record.title,
      departmentId: record.departmentId,
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      headcount: record.headcount,
      requirements: record.requirements,
      description: record.description,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/jobs/${id}`);
      message.success('删除成功');
      fetchJobs(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await put(`/jobs/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await post('/jobs', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchJobs(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  const columns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '所属部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 120,
    },
    {
      title: '薪资范围',
      key: 'salary',
      width: 160,
      render: (_, record) =>
        record.salaryMin && record.salaryMax
          ? `${record.salaryMin}K - ${record.salaryMax}K`
          : '-',
    },
    {
      title: '招聘人数',
      dataIndex: 'headcount',
      key: 'headcount',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    ...(canEdit
      ? [
          {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除该岗位吗？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  if (noPermission) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          暂无权限访问此页面
        </div>
      </Card>
    );
  }

  return (
    <Card title="招聘岗位管理">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Input
              placeholder="搜索岗位名称"
              prefix={<SearchOutlined />}
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
            >
              <Option value="active">招聘中</Option>
              <Option value="paused">已暂停</Option>
              <Option value="closed">已关闭</Option>
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增岗位
            </Button>
          </Col>
        )}
      </Row>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchJobs(page, pageSize),
        }}
      />

      <Modal
        title={editingRecord ? '编辑岗位' : '新增岗位'}
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
            label="岗位名称"
            name="title"
            rules={[{ required: true, message: '请输入岗位名称' }]}
          >
            <Input placeholder="请输入岗位名称" />
          </Form.Item>
          <Form.Item
            label="所属部门"
            name="departmentId"
            rules={[{ required: true, message: '请选择所属部门' }]}
          >
            <Select placeholder="请选择部门">
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="薪资范围（千元/月）">
            <Space>
              <Form.Item
                name="salaryMin"
                noStyle
                rules={[{ required: true, message: '请输入最低薪资' }]}
              >
                <InputNumber min={0} placeholder="最低" style={{ width: 120 }} />
              </Form.Item>
              <span style={{ lineHeight: '32px' }}>-</span>
              <Form.Item
                name="salaryMax"
                noStyle
                rules={[{ required: true, message: '请输入最高薪资' }]}
              >
                <InputNumber min={0} placeholder="最高" style={{ width: 120 }} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item
            label="招聘人数"
            name="headcount"
            rules={[{ required: true, message: '请输入招聘人数' }]}
          >
            <InputNumber min={1} placeholder="请输入招聘人数" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="岗位要求" name="requirements">
            <Input.TextArea rows={3} placeholder="请输入岗位要求" />
          </Form.Item>
          <Form.Item label="岗位描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入岗位描述" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            initialValue="active"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">招聘中</Option>
              <Option value="paused">已暂停</Option>
              <Option value="closed">已关闭</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default JobsPage;
