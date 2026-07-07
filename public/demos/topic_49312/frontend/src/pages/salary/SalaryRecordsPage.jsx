import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Modal, Form,
  DatePicker, message, Tag, Row, Col, Result, Alert
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, LockOutlined,
  CheckOutlined, DollarOutlined
} from '@ant-design/icons';
import { get, post, put } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;

/** 状态映射 */
const statusMap = {
  draft: { text: '草稿', color: 'orange' },
  confirmed: { text: '已确认', color: 'blue' },
  paid: { text: '已发放', color: 'green' },
};

/** 工资脱敏处理 - 隐藏金额 */
const maskAmount = () => '***';

const SalaryRecordsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  // 生成工资 Modal
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generateForm] = Form.useForm();
  const [generating, setGenerating] = useState(false);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const user = getUser();
  const isAdminOrHR = user && hasRole('admin', 'hr');
  const isManagerRole = user && hasRole('manager');
  const isEmployeeRole = user && hasRole('employee');

  // ====== 权限红线 ======
  // manager 完全不能查看薪资，直接提示无权限
  if (isManagerRole) {
    return (
      <Card>
        <Result
          status="403"
          title="无权限"
          subTitle="您没有权限查看薪资记录，如需访问请联系管理员。"
          icon={<LockOutlined />}
        />
      </Card>
    );
  }

  /** 获取工资记录列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { pageNum: page, pageSize };
      if (keyword) params.keyword = keyword;
      if (monthFilter) params.period = monthFilter;
      if (statusFilter) params.status = statusFilter;

      // 员工只能看自己的（后端根据角色自动过滤，不需要传employeeId）
      const res = await get('/salaries/records/list', params);
      // 后端 page() 返回 { code, message, data: { list, total, page, pageSize, totalPages } }
      const pageData = res.data || {};
      const list = pageData.list || pageData.records || res.list || res.records || [];
      const total = pageData.total || res.total || 0;
      setData(list);
      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (err) {
      console.error('获取工资记录列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, monthFilter, statusFilter, isEmployeeRole, user]);

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
    if (isAdminOrHR) {
      fetchDepartments();
    }
  }, []);

  useEffect(() => {
    fetchList(1);
  }, [keyword, monthFilter, statusFilter]);

  /** 生成工资 */
  const handleGenerate = () => {
    generateForm.resetFields();
    setGenerateModalVisible(true);
  };

  const handleGenerateSubmit = async () => {
    try {
      const values = await generateForm.validateFields();
      setGenerating(true);
      const period = values.month.format('YYYY-MM');
      await post('/salaries/records', { period });
      message.success(`${period} 工资生成成功，系统已自动核算`);
      setGenerateModalVisible(false);
      generateForm.resetFields();
      fetchList(1);
    } catch (err) {
      if (err.errorFields) return;
      console.error('生成工资失败:', err);
    } finally {
      setGenerating(false);
    }
  };

  /** 确认工资 */
  const handleConfirm = async (record) => {
    try {
      await put(`/salaries/records/${record.id}/confirm`);
      message.success('工资已确认');
      fetchList(pagination.current);
    } catch (err) {
      console.error('确认工资失败:', err);
    }
  };

  /** 发放工资 */
  const handlePay = async (record) => {
    try {
      await put(`/salaries/records/${record.id}/pay`);
      message.success('工资已发放');
      fetchList(pagination.current);
    } catch (err) {
      console.error('发放工资失败:', err);
    }
  };

  /** 导出 */
  const handleExport = async () => {
    try {
      const params = {};
      if (monthFilter) params.period = monthFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await get('/salaries/records/export', { ...params, responseType: 'blob' });
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `工资记录_${monthFilter || '全部'}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  /** 获取部门名称 */
  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '-';
  };

  /** 员工视角 - 脱敏显示 */
  const isMasked = isEmployeeRole;

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
    },
    ...(isMasked
      ? []
      : [
          {
            title: '部门',
            dataIndex: 'departmentId',
            key: 'departmentId',
            width: 120,
            render: (val) => getDepartmentName(val),
          },
        ]),
    {
      title: '工资月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
    },
    {
      title: '底薪',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 100,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '津贴',
      dataIndex: 'allowance',
      key: 'allowance',
      width: 100,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '绩效奖金',
      dataIndex: 'performanceBonus',
      key: 'performanceBonus',
      width: 100,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '加班费',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 90,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '请假扣款',
      dataIndex: 'leaveDeduction',
      key: 'leaveDeduction',
      width: 100,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `-¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '迟到扣款',
      dataIndex: 'lateDeduction',
      key: 'lateDeduction',
      width: 100,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `-¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '社保公积金',
      dataIndex: 'socialInsurance',
      key: 'socialInsurance',
      width: 110,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `-¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '应发合计',
      dataIndex: 'grossPay',
      key: 'grossPay',
      width: 110,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? `¥${val.toLocaleString()}` : '-'),
    },
    {
      title: '实发合计',
      dataIndex: 'netPay',
      key: 'netPay',
      width: 110,
      align: 'right',
      render: (val) => (isMasked ? maskAmount() : val != null ? <strong>¥{val.toLocaleString()}</strong> : '-'),
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
    ...(!isMasked && isAdminOrHR
      ? [
          {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, record) => {
              const actions = [];
              if (record.status === 'draft') {
                actions.push(
                  <Button
                    key="confirm"
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleConfirm(record)}
                  >
                    确认
                  </Button>
                );
              }
              if (record.status === 'confirmed') {
                actions.push(
                  <Button
                    key="pay"
                    type="link"
                    size="small"
                    icon={<DollarOutlined />}
                    onClick={() => handlePay(record)}
                  >
                    发放
                  </Button>
                );
              }
              return <Space size="small">{actions}</Space>;
            },
          },
        ]
      : []),
  ];

  return (
    <Card title="工资记录">
      {/* 员工视角提示 */}
      {isMasked && (
        <Alert
          message="提示"
          description="您当前以员工身份查看，仅能查看本人的工资条信息，金额数据已脱敏处理。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 筛选栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {!isMasked && (
          <Col span={6}>
            <Input
              placeholder="搜索员工姓名"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
        )}
        <Col span={isMasked ? 8 : 5}>
          <DatePicker
            picker="month"
            placeholder="选择月份"
            onChange={(date) => {
              if (date) {
                setMonthFilter(date.format('YYYY-MM'));
              } else {
                setMonthFilter('');
              }
            }}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
        <Col span={isMasked ? 6 : 4}>
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
        <Col span={isMasked ? 10 : 9}>
          <Space>
            {isAdminOrHR && (
              <>
                <Button type="primary" onClick={handleGenerate}>
                  生成工资
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExport}>
                  导出
                </Button>
              </>
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
        scroll={{ x: isMasked ? 800 : 1500 }}
      />

      {/* 生成工资 Modal */}
      <Modal
        title="生成工资"
        open={generateModalVisible}
        onOk={handleGenerateSubmit}
        onCancel={() => setGenerateModalVisible(false)}
        confirmLoading={generating}
        destroyOnHidden
        width={400}
      >
        <Form form={generateForm} layout="vertical">
          <Form.Item
            label="选择工资月份"
            name="month"
            rules={[{ required: true, message: '请选择月份' }]}
            extra="系统将自动根据考勤记录、绩效评分和薪资结构进行核算"
          >
            <DatePicker picker="month" style={{ width: '100%' }} placeholder="请选择月份" />
          </Form.Item>
        </Form>
        <Alert
          message="提示"
          description="生成后请仔细核对各项数据，确认无误后再进行发放操作。"
          type="warning"
          showIcon
          style={{ marginTop: 8 }}
        />
      </Modal>
    </Card>
  );
};

export default SalaryRecordsPage;
