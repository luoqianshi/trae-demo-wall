'use client';

import { Button, Modal, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'jobscope-legal-confirmed';

export function LegalDisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const confirmed = window.localStorage.getItem(STORAGE_KEY);
    if (!confirmed) {
      setOpen(true);
    }
  }, []);

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      footer={
        <Button
          type="primary"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, '1');
            setOpen(false);
          }}
        >
          我已知悉并继续使用
        </Button>
      }
      title="采集与使用法律声明"
    >
      <Space direction="vertical" size={12}>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          本平台仅供内部招聘市场研究、岗位技能分析与产品验证使用，不得用于绕过平台限制、批量传播受限数据或进行任何违法用途。
        </Typography.Paragraph>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          采集任务应遵循目标平台协议、robots 策略、频控规则及相关法律法规；涉及个人信息时应执行最小化采集与脱敏展示。
        </Typography.Paragraph>
        <Typography.Text type="secondary">如你不确认以上内容，请停止继续访问与操作。</Typography.Text>
      </Space>
    </Modal>
  );
}
