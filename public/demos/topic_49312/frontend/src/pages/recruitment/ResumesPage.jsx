import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, Form,
  InputNumber, message, Popconfirm, Tag, Card, Row, Col, Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;

const statusMap = {
  pending: { text: '待沟通', color: 'blue' },
  interviewed: { text: '已面试', color: 'purple' },
  eliminated: { text: '已淘汰', color: 'red' },
  onboarded: { text: '已入职', color: 'green' },
};

const sourceMap = {
  website: '官网投递',
  referral: '内推',
  headhunter: '猎头',
  jobFair: '招聘会',
  other: '其他',
};

const educationOptions = [
  { label: '高中', value: 'high_school' },
  { label: '大专', value: 'college' },
  { label: '本科', value: 'bachelor' },
  { label: '硕士', value: 'master' },
  { label: '博士', value: 'phd' },
];

const ResumesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const noPermission = user && hasRole('employee');

  const fetchResumes = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (jobFilter) params.jobId = jobFilter;

      const res = await get('/resumes', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取简历列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, jobFilter]);

  const fetchJobs = async () => {
    try {
      const res = await get('/jobs', { pageSize: 999, status: 'active' });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setJobs(list);
    } catch (err) {
      console.error('获取岗位列表失败:', err);
    }
  };

  useEffect(() => {
    fetchResumes();
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchResumes(1);
  }, [keyword, statusFilter, jobFilter]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      email: record.email,
      jobId: record.jobId,
      education: record.education,
      workYears: record.workYears,
      expectedSalary: record.expectedSalary,
      currentSalary: record.currentSalary,
      skills: record.skills,
      source: record.source,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/resumes/${id}`);
      message.success('删除成功');
      fetchResumes(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await put(`/resumes/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await post('/resumes', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchResumes(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  const handleStatusChange = (record, newStatus) => {
    Modal.confirm({
      title: '确认状态变更',
      content:
        newStatus === 'onboarded'
          ? '确认将候选人状态改为"已入职"？系统将自动创建员工档案和开通账号。'
          : `确认将候选人状态改为"${statusMap[newStatus]?.text || newStatus}"？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await put(`/resumes/${record.id}`, { status: newStatus });
          if (newStatus === 'onboarded') {
            message.success('状态已更新，系统将自动创建员工档案和开通账号');
          } else {
            message.success('状态已更新');
          }
          fetchResumes(pagination.current, pagination.pageSize);
        } catch (err) {
          console.error('状态变更失败:', err);
        }
      },
    });
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '应聘岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      ellipsis: true,
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 80,
      render: (val) => educationOptions.find((e) => e.value === val)?.label || val || '-',
    },
    {
      title: '工作年限',
      dataIndex: 'workYears',
      key: 'workYears',
      width: 90,
      render: (val) => (val != null ? `${val}年` : '-'),
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
    {
      title: '操作',
      key: 'action',
      width: canEdit ? 280 : 200,
      render: (_, record) => (
        <Space size="small" wrap>
          {canEdit && (
            <>
              <Button type="link" size="small" onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除该简历吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          <Dropdown statusButtons={record} />
        </Space>
      ),
    },
  ];

  const Dropdown = ({ statusButtons }) => {
    const statusList = [
      { key: 'pending', label: '待沟通' },
      { key: 'interviewed', label: '已面试' },
      { key: 'eliminated', label: '已淘汰' },
      { key: 'onboarded', label: '已入职' },
    ];
    return (
      <Space size={4}>
        {statusList.map((item) => (
          <Tooltip key={item.key} title={`变更为${item.label}`}>
            <Button
              type="link"
              size="small"
              disabled={statusButtons.status === item.key}
              onClick={() => handleStatusChange(statusButtons, item.key)}
            >
              {item.label}
            </Button>
          </Tooltip>
        ))}
      </Space>
    );
  };

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
    <Card title="简历库管理">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space wrap>
            <Input
              placeholder="搜索姓名/手机号"
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
              <Option value="pending">待沟通</Option>
              <Option value="interviewed">已面试</Option>
              <Option value="eliminated">已淘汰</Option>
              <Option value="onboarded">已入职</Option>
            </Select>
            <Select
              placeholder="岗位筛选"
              allowClear
              value={jobFilter}
              onChange={setJobFilter}
              style={{ width: 160 }}
            >
              {jobs.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增简历
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
          onChange: (page, pageSize) => fetchResumes(page, pageSize),
        }}
      />

      <Modal
        title={editingRecord ? '编辑简历' : '新增简历'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入正确的邮箱' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            label="应聘岗位"
            name="jobId"
            rules={[{ required: true, message: '请选择应聘岗位' }]}
          >
            <Select placeholder="请选择岗位" showSearch optionFilterProp="children">
              {jobs.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="学历" name="education">
                <Select placeholder="请选择学历" allowClear>
                  {educationOptions.map((e) => (
                    <Option key={e.value} value={e.value}>
                      {e.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="工作年限" name="workYears">
                <InputNumber min={0} max={50} placeholder="年" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="期望薪资（千元/月）" name="expectedSalary">
                <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="当前薪资（千元/月）" name="currentSalary">
                <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="技能标签" name="skills">
            <Select mode="tags" placeholder="输入后回车添加标签" />
          </Form.Item>
          <Form.Item label="来源渠道" name="source">
            <Select placeholder="请选择来源渠道" allowClear>
              {Object.entries(sourceMap).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ResumesPage;
