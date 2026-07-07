import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, Form,
  DatePicker, InputNumber, message, Popconfirm, Tag, Card, Row, Col,
  Descriptions
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';
import dayjs from 'dayjs';

const { Option } = Select;

const statusMap = {
  pending: { text: '待发送', color: 'orange' },
  sent: { text: '已发送', color: 'blue' },
  accepted: { text: '已接受', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
};

const OffersPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const noPermission = user && hasRole('employee');

  const fetchOffers = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;

      const res = await get('/offers', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取Offer列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  const fetchResumes = async () => {
    try {
      const res = await get('/resumes', { pageSize: 999 });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setResumes(list);
    } catch (err) {
      console.error('获取简历列表失败:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await get('/jobs', { pageSize: 999 });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setJobs(list);
    } catch (err) {
      console.error('获取岗位列表失败:', err);
    }
  };

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
    fetchOffers();
    fetchResumes();
    fetchJobs();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchOffers(1);
  }, [keyword, statusFilter]);

  const handleSendOffer = () => {
    form.resetFields();
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      resumeId: record.resumeId,
      jobId: record.jobId,
      salary: record.salary,
      onboardDate: record.onboardDate ? dayjs(record.onboardDate) : null,
      departmentId: record.departmentId,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/offers/${id}`);
      message.success('删除成功');
      fetchOffers(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        onboardDate: values.onboardDate
          ? dayjs(values.onboardDate).format('YYYY-MM-DD')
          : null,
      };
      if (editingRecord) {
        await put(`/offers/${editingRecord.id}`, payload);
        message.success('编辑成功');
      } else {
        await post('/offers', payload);
        message.success('发送Offer成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchOffers(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  const handleViewDetail = (record) => {
    setDetailRecord(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 100,
    },
    {
      title: '岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      ellipsis: true,
    },
    {
      title: '薪资',
      dataIndex: 'salary',
      key: 'salary',
      width: 120,
      render: (val) => (val != null ? `${val}K/月` : '-'),
    },
    {
      title: '入职时间',
      dataIndex: 'onboardDate',
      key: 'onboardDate',
      width: 120,
      render: (val) => val || '-',
    },
    {
      title: 'Offer状态',
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
      width: canEdit ? 240 : 100,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {canEdit && (
            <>
              <Button type="link" onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除该Offer吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
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
    <Card title="Offer管理">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Input
              placeholder="搜索候选人"
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
              <Option value="pending">待发送</Option>
              <Option value="sent">已发送</Option>
              <Option value="accepted">已接受</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSendOffer}>
              发送Offer
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
          onChange: (page, pageSize) => fetchOffers(page, pageSize),
        }}
      />

      {/* 发送/编辑Offer Modal */}
      <Modal
        title={editingRecord ? '编辑Offer' : '发送Offer'}
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
            label="选择简历（候选人）"
            name="resumeId"
            rules={[{ required: true, message: '请选择候选人' }]}
          >
            <Select
              placeholder="请选择候选人"
              showSearch
              optionFilterProp="children"
              disabled={!!editingRecord}
            >
              {resumes.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} - {r.phone}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="关联岗位"
            name="jobId"
            rules={[{ required: true, message: '请选择关联岗位' }]}
          >
            <Select placeholder="请选择岗位" showSearch optionFilterProp="children">
              {jobs.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="薪资（千元/月）"
            name="salary"
            rules={[{ required: true, message: '请输入薪资' }]}
          >
            <InputNumber min={0} placeholder="请输入薪资" style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="入职时间"
                name="onboardDate"
                rules={[{ required: true, message: '请选择入职时间' }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="请选择"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="入职部门"
                name="departmentId"
                rules={[{ required: true, message: '请选择入职部门' }]}
              >
                <Select placeholder="请选择部门">
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 查看详情 Modal */}
      <Modal
        title="Offer详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setDetailRecord(null);
        }}
        footer={null}
        width={600}
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="候选人">{detailRecord.candidateName || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{detailRecord.candidatePhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="岗位">{detailRecord.jobTitle || '-'}</Descriptions.Item>
            <Descriptions.Item label="薪资">{detailRecord.salary ? `${detailRecord.salary}K/月` : '-'}</Descriptions.Item>
            <Descriptions.Item label="入职时间">{detailRecord.onboardDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="入职部门">{detailRecord.departmentName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Offer状态">
              <Tag color={statusMap[detailRecord.status]?.color || 'default'}>
                {statusMap[detailRecord.status]?.text || detailRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailRecord.createdAt || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default OffersPage;
