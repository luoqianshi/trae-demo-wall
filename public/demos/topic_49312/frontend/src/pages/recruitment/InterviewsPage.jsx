import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, Form,
  DatePicker, InputNumber, message, Popconfirm, Tag, Card, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const statusMap = {
  pending: { text: '待面试', color: 'blue' },
  passed: { text: '已通过', color: 'green' },
  failed: { text: '已淘汰', color: 'red' },
  retry: { text: '复试', color: 'orange' },
};

const InterviewsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [evaluateModalVisible, setEvaluateModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [scheduleForm] = Form.useForm();
  const [evaluateForm] = Form.useForm();

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const noPermission = user && hasRole('employee');

  const fetchInterviews = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;

      const res = await get('/interviews', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取面试列表失败:', err);
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

  const fetchInterviewers = async () => {
    try {
      const res = await get('/employees', { pageSize: 999 });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setInterviewers(list);
    } catch (err) {
      console.error('获取面试官列表失败:', err);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchResumes();
    fetchInterviewers();
  }, []);

  useEffect(() => {
    fetchInterviews(1);
  }, [keyword, statusFilter]);

  const handleSchedule = () => {
    scheduleForm.resetFields();
    setEditingRecord(null);
    setScheduleModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    scheduleForm.setFieldsValue({
      resumeId: record.resumeId,
      interviewerId: record.interviewerId,
      round: record.round,
      interviewTime: record.interviewTime ? dayjs(record.interviewTime) : null,
      location: record.location,
      remark: record.remark,
    });
    setScheduleModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/interviews/${id}`);
      message.success('删除成功');
      fetchInterviews(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleScheduleSubmit = async () => {
    try {
      const values = await scheduleForm.validateFields();
      const payload = {
        ...values,
        interviewTime: values.interviewTime
          ? dayjs(values.interviewTime).format('YYYY-MM-DD HH:mm:ss')
          : null,
      };
      if (editingRecord) {
        await put(`/interviews/${editingRecord.id}`, payload);
        message.success('编辑成功');
      } else {
        await post('/interviews', payload);
        message.success('安排面试成功');
      }
      setScheduleModalVisible(false);
      scheduleForm.resetFields();
      fetchInterviews(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  const handleEvaluate = (record) => {
    setEditingRecord(record);
    evaluateForm.setFieldsValue({
      evaluation: record.evaluation,
      result: record.status,
    });
    setEvaluateModalVisible(true);
  };

  const handleEvaluateSubmit = async () => {
    try {
      const values = await evaluateForm.validateFields();
      await put(`/interviews/${editingRecord.id}`, {
        evaluation: values.evaluation,
        status: values.result,
      });
      message.success('评价提交成功');
      setEvaluateModalVisible(false);
      evaluateForm.resetFields();
      fetchInterviews(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('评价提交失败:', err);
    }
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 100,
    },
    {
      title: '应聘岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      ellipsis: true,
    },
    {
      title: '面试轮次',
      dataIndex: 'round',
      key: 'round',
      width: 90,
      render: (val) => (val != null ? `第${val}轮` : '-'),
    },
    {
      title: '面试官',
      dataIndex: 'interviewerName',
      key: 'interviewerName',
      width: 100,
    },
    {
      title: '面试时间',
      dataIndex: 'interviewTime',
      key: 'interviewTime',
      width: 170,
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
      width: canEdit ? 260 : 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleEvaluate(record)}
          >
            评价
          </Button>
          {canEdit && (
            <>
              <Button type="link" onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除该面试记录吗？"
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
    <Card title="面试管理">
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
              <Option value="pending">待面试</Option>
              <Option value="passed">已通过</Option>
              <Option value="failed">已淘汰</Option>
              <Option value="retry">复试</Option>
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSchedule}>
              安排面试
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
          onChange: (page, pageSize) => fetchInterviews(page, pageSize),
        }}
      />

      {/* 安排/编辑面试 Modal */}
      <Modal
        title={editingRecord ? '编辑面试' : '安排面试'}
        open={scheduleModalVisible}
        onOk={handleScheduleSubmit}
        onCancel={() => {
          setScheduleModalVisible(false);
          scheduleForm.resetFields();
        }}
        width={560}
        destroyOnHidden
      >
        <Form form={scheduleForm} layout="vertical">
          <Form.Item
            label="选择简历（候选人）"
            name="resumeId"
            rules={[{ required: true, message: '请选择候选人简历' }]}
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
            label="面试官"
            name="interviewerId"
            rules={[{ required: true, message: '请选择面试官' }]}
          >
            <Select
              placeholder="请选择面试官"
              showSearch
              optionFilterProp="children"
            >
              {interviewers.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="面试轮次"
                name="round"
                rules={[{ required: true, message: '请输入面试轮次' }]}
              >
                <InputNumber min={1} placeholder="请输入" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="面试时间"
                name="interviewTime"
                rules={[{ required: true, message: '请选择面试时间' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  placeholder="请选择"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="面试地点" name="location">
            <Input placeholder="请输入面试地点" />
          </Form.Item>
          <Form.Item label="面试备注" name="remark">
            <TextArea rows={3} placeholder="请输入面试备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 面试评价 Modal */}
      <Modal
        title="面试评价"
        open={evaluateModalVisible}
        onOk={handleEvaluateSubmit}
        onCancel={() => {
          setEvaluateModalVisible(false);
          evaluateForm.resetFields();
        }}
        width={520}
        destroyOnHidden
      >
        <Form form={evaluateForm} layout="vertical">
          <Form.Item label="候选人">
            <span style={{ fontWeight: 500 }}>
              {editingRecord?.candidateName || '-'}
            </span>
          </Form.Item>
          <Form.Item
            label="评价内容"
            name="evaluation"
            rules={[{ required: true, message: '请填写评价内容' }]}
          >
            <TextArea rows={4} placeholder="请输入面试评价" />
          </Form.Item>
          <Form.Item
            label="面试结果"
            name="result"
            rules={[{ required: true, message: '请选择面试结果' }]}
          >
            <Select placeholder="请选择结果">
              <Option value="passed">通过</Option>
              <Option value="failed">淘汰</Option>
              <Option value="retry">复试</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default InterviewsPage;
