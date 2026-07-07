import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  message, Popconfirm, Tag, Row, Col, Result
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  LockOutlined, UnlockOutlined, KeyOutlined, StopOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;

/** 角色映射 */
const roleMap = {
  admin: { text: '管理员', color: 'red' },
  hr: { text: 'HR', color: 'orange' },
  manager: { text: '部门经理', color: 'blue' },
  employee: { text: '普通员工', color: 'default' },
};

/** 状态映射 */
const statusMap = {
  active: { text: '启用', color: 'green' },
  disabled: { text: '禁用', color: 'default' },
};

/** 手机号脱敏 */
const maskPhone = (phone) => {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const UsersPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  // 新增/编辑 Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const user = getUser();
  const canOperate = user && hasRole('admin', 'hr');

  // 非admin/HR无权限
  if (!canOperate) {
    return (
      <Card>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限访问用户管理，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取用户列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await get('/users', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, roleFilter, statusFilter]);

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
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [keyword, roleFilter, statusFilter]);

  /** 新增用户 */
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalVisible(true);
  };

  /** 编辑用户 */
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.resetFields();
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      role: record.role,
      departmentId: record.departmentId,
      phone: record.phone,
      email: record.email,
      status: record.status,
    });
    setModalVisible(true);
  };

  /** 提交新增/编辑 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await put(`/users/${editingRecord.id}`, values);
        message.success('用户信息更新成功');
      } else {
        await post('/users', values);
        message.success('新增用户成功');
      }
      setModalVisible(false);
      fetchList(pagination.current);
    } catch (err) {
      console.error('保存用户失败:', err);
    }
  };

  /** 删除用户 */
  const handleDelete = async (record) => {
    try {
      await del(`/users/${record.id}`);
      message.success('删除成功');
      fetchList(pagination.current);
    } catch (err) {
      console.error('删除用户失败:', err);
    }
  };

  /** 禁用用户 */
  const handleDisable = async (record) => {
    try {
      await put(`/users/${record.id}`, { status: 'disabled' });
      message.success('用户已禁用');
      fetchList(pagination.current);
    } catch (err) {
      console.error('禁用用户失败:', err);
    }
  };

  /** 启用用户 */
  const handleEnable = async (record) => {
    try {
      await put(`/users/${record.id}`, { status: 'active' });
      message.success('用户已启用');
      fetchList(pagination.current);
    } catch (err) {
      console.error('启用用户失败:', err);
    }
  };

  /** 重置密码 */
  const handleResetPassword = async (record) => {
    try {
      await put(`/users/${record.id}/reset-password`);
      message.success('密码已重置为默认密码');
    } catch (err) {
      console.error('重置密码失败:', err);
    }
  };

  /** 获取部门名称 */
  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '-';
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (val) => {
        const r = roleMap[val] || { text: val, color: 'default' };
        return <Tag color={r.color}>{r.text}</Tag>;
      },
    },
    {
      title: '部门',
      dataIndex: 'departmentId',
      key: 'departmentId',
      width: 120,
      render: (val) => getDepartmentName(val),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (val) => maskPhone(val),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (val) => {
        const s = statusMap[val] || { text: val, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 170,
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => {
        const actions = [];
        // 不允许操作自己
        const isSelf = user.id === record.id;

        actions.push(
          <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        );

        if (record.status === 'active' && !isSelf) {
          actions.push(
            <Popconfirm key="disable" title="确定禁用此用户？" onConfirm={() => handleDisable(record)}>
              <Button type="link" size="small" icon={<StopOutlined />} danger>
                禁用
              </Button>
            </Popconfirm>
          );
        }

        if (record.status === 'disabled' && !isSelf) {
          actions.push(
            <Button key="enable" type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleEnable(record)}>
              启用
            </Button>
          );
        }

        actions.push(
          <Popconfirm key="reset" title="确定重置此用户密码？" onConfirm={() => handleResetPassword(record)}>
            <Button type="link" size="small" icon={<KeyOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
        );

        // 仅admin可删除，且不能删自己
        if (user.role === 'admin' && !isSelf) {
          actions.push(
            <Popconfirm key="delete" title="确定删除此用户？此操作不可恢复。" onConfirm={() => handleDelete(record)}>
              <Button type="link" size="small" icon={<DeleteOutlined />} danger>
                删除
              </Button>
            </Popconfirm>
          );
        }

        return <Space size={0}>{actions}</Space>;
      },
    },
  ];

  return (
    <Card title="用户管理">
      {/* 筛选栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="搜索用户名/姓名"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="角色"
            value={roleFilter || undefined}
            onChange={setRoleFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {Object.entries(roleMap).map(([key, val]) => (
              <Option key={key} value={key}>
                {val.text}
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
        <Col span={10}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增用户
            </Button>
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
        scroll={{ x: 1100 }}
      />

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {Object.entries(roleMap).map(([key, val]) => (
                    <Option key={key} value={key}>
                      {val.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="部门"
                name="departmentId"
              >
                <Select placeholder="请选择部门" allowClear>
                  {departments.map((d) => (
                    <Option key={d.id} value={d.id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          {!editingRecord && (
            <Form.Item
              label="初始密码"
              name="password"
              rules={[{ required: true, message: '请设置初始密码' }]}
            >
              <Input.Password placeholder="请设置初始密码（至少6位）" />
            </Form.Item>
          )}
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">启用</Option>
              <Option value="disabled">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UsersPage;
