import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Tree, Button, Space, Modal, Form, Input, Select,
  TreeSelect, message, Popconfirm, Descriptions, Tag, Row, Col, Empty
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/utils/request';
import { getUser, hasRole } from '@/utils/auth';

const { Option } = Select;

/**
 * 将扁平部门列表转换为 Ant Design Tree 组件所需的 treeData 格式
 * 后端tree接口已返回嵌套结构，这里做兼容处理和字段映射
 */
const normalizeTreeData = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    // 后端tree接口已返回children；扁平接口需要递归
    const existingChildren = item.children && item.children.length > 0
      ? normalizeTreeData(item.children)
      : undefined;
    return {
      key: item.id,
      title: (
        <span>
          {item.name}
          {(item.status === 'disabled' || item.status === 0 || item.status === 'inactive') && (
            <Tag color="default" style={{ marginLeft: 6 }}>已停用</Tag>
          )}
        </span>
      ),
      ...item,
      children: existingChildren,
    };
  });
};

/**
 * 将tree数据展开为扁平列表（用于查找等操作）
 */
const flattenTree = (tree) => {
  let result = [];
  tree.forEach((node) => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children));
    }
  });
  return result;
};

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  const user = getUser();
  const canEdit = user && hasRole('admin', 'hr');

  /** 获取部门列表 */
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/departments/tree');
      // tree接口直接返回数组（已嵌套）；扁平接口返回{list:[]}
      const treeArr = Array.isArray(res.data) ? res.data : (res.data?.list || res.list || []);
      const tree = normalizeTreeData(treeArr);
      setTreeData(tree);
      // 展开为扁平列表用于查找
      const flat = flattenTree(tree);
      setDepartments(flat);
      // 默认展开第一层
      const roots = tree.filter((item) => !item.parentId || item.parentId === 0);
      setExpandedKeys(roots.map((r) => r.id));
    } catch (err) {
      console.error('获取部门列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 获取用户列表（用于部门负责人选择） */
  const fetchUsers = async () => {
    try {
      const res = await get('/employees', { pageSize: 999, status: 'active' });
      const list = res.data?.list || res.data?.records || res.list || res.records || [];
      setUsers(list);
    } catch (err) {
      console.error('获取用户列表失败:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  /** 选中部门节点 */
  const handleSelect = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      const dept = departments.find((d) => d.id === selectedKeys[0]);
      setSelectedDept(dept || null);
    } else {
      setSelectedDept(null);
    }
  };

  /** 展开/折叠 */
  const handleExpand = (keys) => {
    setExpandedKeys(keys);
  };

  /** 新增部门 */
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    // 如果已选中部门，默认设为上级部门
    if (selectedDept) {
      form.setFieldsValue({ parentId: selectedDept.id });
    }
    setModalVisible(true);
  };

  /** 编辑部门 */
  const handleEdit = () => {
    if (!selectedDept) {
      message.warning('请先选择一个部门');
      return;
    }
    setEditingRecord(selectedDept);
    form.setFieldsValue({
      name: selectedDept.name,
      code: selectedDept.code,
      parentId: selectedDept.parentId === 0 ? null : selectedDept.parentId,
      managerId: selectedDept.managerId,
      status: selectedDept.status === 1 || selectedDept.status === 'active' ? 'active' : 'disabled',
    });
    setModalVisible(true);
  };

  /** 删除部门 */
  const handleDelete = async () => {
    if (!selectedDept) {
      message.warning('请先选择一个部门');
      return;
    }

    // 前端检查是否有子部门
    const children = departments.filter((d) => d.parentId === selectedDept.id);
    if (children.length > 0) {
      message.error('该部门下存在子部门，无法删除。请先删除或迁移子部门。');
      return;
    }

    try {
      // 后端也会检查是否有在职员工
      await del(`/departments/${selectedDept.id}`);
      message.success('删除成功');
      setSelectedDept(null);
      fetchDepartments();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  /** 提交新增/编辑 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 转换status为数字：active→1, disabled→0
      const submitData = {
        ...values,
        status: values.status === 'active' ? 1 : 0,
        parentId: values.parentId || 0,
      };
      if (editingRecord) {
        await put(`/departments/${editingRecord.id}`, submitData);
        message.success('编辑成功');
      } else {
        await post('/departments', submitData);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchDepartments();
    } catch (err) {
      // 表单校验错误由 Form 自行处理，不需要额外提示
      if (err.errorFields) return;
      message.error(err.message || '提交失败，请稍后重试');
      console.error('提交失败:', err);
    }
  };

  /** 获取部门负责人姓名 */
  const getLeaderName = (managerId) => {
    const u = users.find((item) => item.id === managerId);
    return u ? u.name : (selectedDept?.managerName || '-');
  };

  /** 获取上级部门名称 */
  const getParentName = (parentId) => {
    const d = departments.find((item) => item.id === parentId);
    return d ? d.name : '-';
  };

  /** 构建 TreeSelect 数据（扁平列表转树） */
  const buildTreeSelectData = (list, parentId = null) => {
    return list
      .filter((item) => item.parentId === parentId || (parentId === null && (!item.parentId || item.parentId === 0)))
      .map((item) => ({
        value: item.id,
        title: item.name,
        children: buildTreeSelectData(list, item.id),
      }));
  };

  return (
    <Card title={<span><ApartmentOutlined /> 组织架构管理</span>}>
      <Row gutter={16} style={{ height: 'calc(100vh - 220px)' }}>
        {/* 左侧 - 部门树 */}
        <Col span={10} style={{ borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
          <div style={{ marginBottom: 12 }}>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginRight: 8 }}>
                新增部门
              </Button>
            )}
            {canEdit && selectedDept && (
              <>
                <Button icon={<EditOutlined />} onClick={handleEdit} style={{ marginRight: 8 }}>
                  编辑
                </Button>
                <Popconfirm
                  title={
                    <>
                      <p>确定要删除该部门吗？</p>
                      <p style={{ color: '#ff4d4f', fontSize: 12 }}>
                        删除前系统将检查是否有子部门或在职员工，如有则无法删除。
                      </p>
                    </>
                  }
                  onConfirm={handleDelete}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>

          {treeData.length > 0 ? (
            <div style={{ overflowY: 'auto', height: 'calc(100% - 52px)' }}>
              <Tree
                showLine
                blockNode
                treeData={treeData}
                expandedKeys={expandedKeys}
                selectedKeys={selectedDept ? [selectedDept.id] : []}
                onSelect={handleSelect}
                onExpand={handleExpand}
              />
            </div>
          ) : (
            <Empty description="暂无部门数据" />
          )}
        </Col>

        {/* 右侧 - 部门详情 */}
        <Col span={14} style={{ paddingLeft: 16 }}>
          {selectedDept ? (
            <Descriptions
              title={selectedDept.name}
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="部门名称">{selectedDept.name}</Descriptions.Item>
              <Descriptions.Item label="部门编码">{selectedDept.code}</Descriptions.Item>
              <Descriptions.Item label="上级部门">{getParentName(selectedDept.parentId)}</Descriptions.Item>
              <Descriptions.Item label="部门负责人">{getLeaderName(selectedDept.managerId)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(selectedDept.status === 1 || selectedDept.status === 'active') ? 'green' : 'default'}>
                  {(selectedDept.status === 1 || selectedDept.status === 'active') ? '正常' : '已停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedDept.createdAt ? new Date(selectedDept.createdAt).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
              请在左侧选择一个部门查看详情
            </div>
          )}
        </Col>
      </Row>

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑部门' : '新增部门'}
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
            label="部门名称"
            name="name"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item
            label="部门编码"
            name="code"
            rules={[{ required: true, message: '请输入部门编码' }]}
          >
            <Input placeholder="请输入部门编码，如 DEV" />
          </Form.Item>
          <Form.Item label="上级部门" name="parentId">
            <TreeSelect
              placeholder="请选择上级部门（不选则为顶级部门）"
              allowClear
              treeData={buildTreeSelectData(departments)}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item label="部门负责人" name="managerId">
            <Select placeholder="请选择部门负责人" allowClear showSearch optionFilterProp="children">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name} - {u.departmentName || u.department || '-'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            initialValue="active"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">正常</Option>
              <Option value="disabled">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentsPage;
