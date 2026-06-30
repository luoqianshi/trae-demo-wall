import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  DatePicker, message, Popconfirm, Tag, Row, Col, Drawer, Descriptions,
  Tabs, Spin, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  UserOutlined, EyeOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;
const { TextArea } = Input;

/** 员工状态映射 */
const statusMap = {
  active: { text: '在职', color: 'green' },
  probation: { text: '试用期', color: 'blue' },
  resigned: { text: '离职', color: 'default' },
};

/** 学历映射 */
const educationMap = {
  high_school: '高中',
  associate: '大专',
  bachelor: '本科',
  master: '硕士',
  doctor: '博士',
  other: '其他',
};

/** 手机号脱敏 */
const maskPhone = (phone) => {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const EmployeesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  // 详情抽屉
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 详情子Tab数据
  const [contractList, setContractList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [performanceList, setPerformanceList] = useState([]);
  const [changeList, setChangeList] = useState([]);

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');
  const isManagerRole = user && hasRole('manager');
  const isEmployeeRole = user && hasRole('employee');

  /** 获取员工列表 */
  const fetchEmployees = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      // 权限控制
      if (isEmployeeRole) {
        // 普通员工只能看自己
        params.id = user.id;
      } else if (isManagerRole && user.departmentId) {
        // 部门经理只能看本部门
        params.departmentId = params.departmentId || user.departmentId;
      }

      const res = await get('/employees', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取员工列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, departmentFilter, statusFilter, user, isEmployeeRole, isManagerRole]);

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
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees(1);
  }, [keyword, departmentFilter, statusFilter]);

  /** 查看详情 */
  const handleViewDetail = async (record) => {
    setDetailRecord(record);
    setDrawerVisible(true);
    setDetailLoading(true);

    try {
      // 并行请求各Tab数据
      const [contractRes, attendanceRes, performanceRes, changeRes] = await Promise.allSettled([
        get(`/employees/${record.id}/contracts`),
        get(`/employees/${record.id}/attendance`),
        get(`/employees/${record.id}/performance`),
        get(`/employees/${record.id}/changes`),
      ]);

      setContractList(
        contractRes.status === 'fulfilled'
          ? (contractRes.value.data?.list || contractRes.value.list || [])
          : []
      );
      setAttendanceList(
        attendanceRes.status === 'fulfilled'
          ? (attendanceRes.value.data?.list || attendanceRes.value.list || [])
          : []
      );
      setPerformanceList(
        performanceRes.status === 'fulfilled'
          ? (performanceRes.value.data?.list || performanceRes.value.list || [])
          : []
      );
      setChangeList(
        changeRes.status === 'fulfilled'
          ? (changeRes.value.data?.list || changeRes.value.list || [])
          : []
      );
    } catch (err) {
      console.error('获取员工详情失败:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  /** 新增 */
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  /** 编辑 */
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      idCard: record.idCard,
      gender: record.gender,
      education: record.education,
      departmentId: record.departmentId,
      position: record.position,
      joinDate: record.joinDate ? record.joinDate : null,
      contractStart: record.contractStart ? record.contractStart : null,
      contractEnd: record.contractEnd ? record.contractEnd : null,
    });
    setModalVisible(true);
  };

  /** 删除 */
  const handleDelete = async (id) => {
    try {
      await del(`/employees/${id}`);
      message.success('删除成功');
      fetchEmployees(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  /** 提交新增/编辑 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 日期字段格式化
      if (values.joinDate) {
        values.joinDate = values.joinDate.format('YYYY-MM-DD');
      }
      if (values.contractStart) {
        values.contractStart = values.contractStart.format('YYYY-MM-DD');
      }
      if (values.contractEnd) {
        values.contractEnd = values.contractEnd.format('YYYY-MM-DD');
      }

      if (editingRecord) {
        await put(`/employees/${editingRecord.id}`, values);
        message.success('编辑成功');
      } else {
        await post('/employees', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchEmployees(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.errorFields) return;
      console.error('提交失败:', err);
    }
  };

  /** 基础信息Tab */
  const BasicInfoTab = () => {
    if (!detailRecord) return null;
    const info = [
      { label: '工号', value: detailRecord.employeeNo },
      { label: '姓名', value: detailRecord.name },
      { label: '性别', value: detailRecord.gender === 'male' ? '男' : detailRecord.gender === 'female' ? '女' : '-' },
      { label: '手机号', value: canEdit ? detailRecord.phone : maskPhone(detailRecord.phone) },
      { label: '身份证号', value: canEdit ? detailRecord.idCard : maskPhone(detailRecord.idCard?.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')) || '-' },
      { label: '学历', value: educationMap[detailRecord.education] || detailRecord.education || '-' },
      { label: '部门', value: detailRecord.departmentName || '-' },
      { label: '岗位', value: detailRecord.position || '-' },
      { label: '入职日期', value: detailRecord.joinDate || '-' },
      { label: '状态', value: detailRecord.status ? (statusMap[detailRecord.status]?.text || detailRecord.status) : '-' },
      { label: '邮箱', value: detailRecord.email || '-' },
      { label: '紧急联系人', value: detailRecord.emergencyContact || '-' },
    ];
    return (
      <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }} size="small">
        {info.map((item) => (
          <Descriptions.Item key={item.label} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  /** 合同信息Tab */
  const ContractTab = () => (
    <Table
      dataSource={contractList}
      rowKey="id"
      size="small"
      pagination={false}
      columns={[
        { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo' },
        { title: '合同类型', dataIndex: 'contractType', key: 'contractType' },
        { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
        { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
        { title: '状态', dataIndex: 'status', key: 'status' },
      ]}
      locale={{ emptyText: '暂无合同信息' }}
    />
  );

  /** 考勤记录Tab */
  const AttendanceTab = () => (
    <Table
      dataSource={attendanceList}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 5 }}
      columns={[
        { title: '日期', dataIndex: 'date', key: 'date' },
        { title: '上班时间', dataIndex: 'clockIn', key: 'clockIn' },
        { title: '下班时间', dataIndex: 'clockOut', key: 'clockOut' },
        { title: '状态', dataIndex: 'status', key: 'status' },
        { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
      ]}
      locale={{ emptyText: '暂无考勤记录' }}
    />
  );

  /** 绩效记录Tab */
  const PerformanceTab = () => (
    <Table
      dataSource={performanceList}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 5 }}
      columns={[
        { title: '考核周期', dataIndex: 'period', key: 'period' },
        { title: '考核类型', dataIndex: 'type', key: 'type' },
        { title: '评分', dataIndex: 'score', key: 'score' },
        { title: '等级', dataIndex: 'grade', key: 'grade' },
        { title: '评估人', dataIndex: 'evaluator', key: 'evaluator' },
        { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
      ]}
      locale={{ emptyText: '暂无绩效记录' }}
    />
  );

  /** 异动记录Tab */
  const ChangeTab = () => (
    <Table
      dataSource={changeList}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 5 }}
      columns={[
        { title: '异动类型', dataIndex: 'changeType', key: 'changeType' },
        { title: '原部门', dataIndex: 'fromDepartment', key: 'fromDepartment' },
        { title: '原岗位', dataIndex: 'fromPosition', key: 'fromPosition' },
        { title: '新部门', dataIndex: 'toDepartment', key: 'toDepartment' },
        { title: '新岗位', dataIndex: 'toPosition', key: 'toPosition' },
        { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate' },
        { title: '状态', dataIndex: 'status', key: 'status' },
      ]}
      locale={{ emptyText: '暂无异动记录' }}
    />
  );

  /** 表格列定义 */
  const buildColumns = () => {
    const baseCols = [
      {
        title: '工号',
        dataIndex: 'employeeNo',
        key: 'employeeNo',
        width: 100,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 90,
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
        title: '手机号',
        dataIndex: 'phone',
        key: 'phone',
        width: 130,
        render: (phone) => canEdit ? phone : maskPhone(phone),
      },
      {
        title: '入职时间',
        dataIndex: 'joinDate',
        key: 'joinDate',
        width: 110,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        render: (status) => {
          const info = statusMap[status] || { text: status, color: 'default' };
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
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            {canEdit && (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除该员工吗？"
                  description="删除后数据将无法恢复，请谨慎操作。"
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

    // manager角色隐藏部分列
    if (isManagerRole && !canEdit) {
      // 隐藏手机号详细列
      return baseCols.filter((col) => col.key !== 'phone' || col.dataIndex !== 'phone');
    }

    return baseCols;
  };

  if (isEmployeeRole && !canEdit && !isManagerRole) {
    // 普通员工只能查看自己的信息
    return (
      <Card title={<span><UserOutlined /> 个人档案</span>}>
        {data.length > 0 && (
          <Alert
            message="您仅可查看自己的档案信息。如需修改，请联系人事部门。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          columns={buildColumns()}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    );
  }

  return (
    <Card title={<span><UserOutlined /> 员工档案管理</span>}>
      {/* 权限提示 */}
      {isManagerRole && !canEdit && (
        <Alert
          message="您当前以部门经理身份查看，仅可查看本部门员工的基础信息（薪资、身份证等敏感字段已隐藏）。"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 搜索栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space>
            <Input
              placeholder="搜索姓名/工号/手机号"
              prefix={<SearchOutlined />}
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
            />
            {!isManagerRole && (
              <Select
                placeholder="部门筛选"
                allowClear
                value={departmentFilter}
                onChange={setDepartmentFilter}
                style={{ width: 160 }}
              >
                {departments.map((dept) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            )}
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
            >
              <Option value="active">在职</Option>
              <Option value="probation">试用期</Option>
              <Option value="resigned">离职</Option>
            </Select>
          </Space>
        </Col>
        {canEdit && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增员工
            </Button>
          </Col>
        )}
      </Row>

      {/* 员工列表 */}
      <Table
        columns={buildColumns()}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchEmployees(page, pageSize),
        }}
      />

      {/* 新增/编辑员工 Modal */}
      <Modal
        title={editingRecord ? '编辑员工' : '新增员工'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={720}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="身份证号"
                name="idCard"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' },
                ]}
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="性别"
                name="gender"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="学历"
                name="education"
                rules={[{ required: true, message: '请选择学历' }]}
              >
                <Select placeholder="请选择学历">
                  <Option value="high_school">高中</Option>
                  <Option value="associate">大专</Option>
                  <Option value="bachelor">本科</Option>
                  <Option value="master">硕士</Option>
                  <Option value="doctor">博士</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="部门"
                name="departmentId"
                rules={[{ required: true, message: '请选择部门' }]}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="岗位"
                name="position"
                rules={[{ required: true, message: '请输入岗位' }]}
              >
                <Input placeholder="请输入岗位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="入职日期"
                name="joinDate"
                rules={[{ required: true, message: '请选择入职日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择入职日期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="合同开始日期" name="contractStart">
                <DatePicker style={{ width: '100%' }} placeholder="请选择合同开始日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="合同结束日期" name="contractEnd">
                <DatePicker style={{ width: '100%' }} placeholder="请选择合同结束日期" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title={`员工详情 - ${detailRecord?.name || ''}`}
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setDetailRecord(null);
        }}
        destroyOnHidden
      >
        <Spin spinning={detailLoading}>
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '基础信息',
                children: <BasicInfoTab />,
              },
              {
                key: 'contract',
                label: `合同信息 (${contractList.length})`,
                children: <ContractTab />,
              },
              {
                key: 'attendance',
                label: `考勤记录 (${attendanceList.length})`,
                children: <AttendanceTab />,
              },
              {
                key: 'performance',
                label: `绩效记录 (${performanceList.length})`,
                children: <PerformanceTab />,
              },
              {
                key: 'changes',
                label: `异动记录 (${changeList.length})`,
                children: <ChangeTab />,
              },
            ]}
          />
        </Spin>
      </Drawer>
    </Card>
  );
};

export default EmployeesPage;
