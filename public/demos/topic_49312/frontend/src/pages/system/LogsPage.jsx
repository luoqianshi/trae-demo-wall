import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Input, Select, Space, Row, Col,
  DatePicker, Tag, Result, Tooltip
} from 'antd';
import { SearchOutlined, LockOutlined } from '@ant-design/icons';
import { get } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;
const { RangePicker } = DatePicker;

/** 操作模块选项 */
const moduleOptions = [
  { label: '员工管理', value: 'employee' },
  { label: '部门管理', value: 'department' },
  { label: '考勤管理', value: 'attendance' },
  { label: '招聘管理', value: 'recruitment' },
  { label: '薪资管理', value: 'salary' },
  { label: '绩效管理', value: 'performance' },
  { label: '用户管理', value: 'user' },
  { label: '系统设置', value: 'system' },
];

/** 操作类型选项 */
const typeOptions = [
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查看', value: 'view' },
  { label: '导入', value: 'import' },
  { label: '导出', value: 'export' },
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '审批', value: 'approve' },
  { label: '其他', value: 'other' },
];

/** 模块名称映射 */
const moduleNameMap = {
  employee: '员工管理',
  department: '部门管理',
  attendance: '考勤管理',
  recruitment: '招聘管理',
  salary: '薪资管理',
  performance: '绩效管理',
  user: '用户管理',
  system: '系统设置',
};

/** 操作类型名称映射 */
const typeNameMap = {
  create: { text: '新增', color: 'green' },
  update: { text: '编辑', color: 'blue' },
  delete: { text: '删除', color: 'red' },
  view: { text: '查看', color: 'default' },
  import: { text: '导入', color: 'cyan' },
  export: { text: '导出', color: 'purple' },
  login: { text: '登录', color: 'orange' },
  logout: { text: '登出', color: 'default' },
  approve: { text: '审批', color: 'geekblue' },
  other: { text: '其他', color: 'default' },
};

const LogsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState([]);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const currentUser = getUser();
  const canView = currentUser && hasRole('admin', 'hr');

  // 非admin/HR无权限
  if (!canView) {
    return (
      <Card>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限查看操作日志，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取日志列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (moduleFilter) params.module = moduleFilter;
      if (typeFilter) params.type = typeFilter;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await get('/logs', params);
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      const total = res.data?.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取日志列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, moduleFilter, typeFilter, dateRange]);

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [keyword, moduleFilter, typeFilter, dateRange]);

  const columns = [
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (val) => moduleNameMap[val] || val,
    },
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (val) => {
        const t = typeNameMap[val] || { text: val, color: 'default' };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '操作内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: {
        showTitle: false,
      },
      render: (val) => (
        <Tooltip placement="topLeft" title={val}>
          {val || '-'}
        </Tooltip>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (val) => val || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val) => val || '-',
    },
  ];

  return (
    <Card title="操作日志">
      {/* 提示信息 */}
      <Row style={{ marginBottom: 12 }}>
        <Col span={24}>
          <span style={{ color: '#999', fontSize: 13 }}>
            注意：操作日志仅可查看，不可删除或修改。所有系统操作均会被自动记录。
          </span>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Input
            placeholder="搜索操作人/内容"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="操作模块"
            value={moduleFilter || undefined}
            onChange={setModuleFilter}
            allowClear
            style={{ width: '100%' }}
          >
            {moduleOptions.map((m) => (
              <Option key={m.value} value={m.value}>
                {m.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="操作类型"
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
        <Col span={7}>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={setDateRange}
            style={{ width: '100%' }}
          />
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
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default LogsPage;
