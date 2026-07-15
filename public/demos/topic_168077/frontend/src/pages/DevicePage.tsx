import React, { useState } from 'react';
import { Tabs, Result } from 'antd';
import { useAuth } from '../context/AuthContext';
import DeviceManager from '../components/DeviceManager';
import RFIDBindingManager from '../components/RFIDBindingManager';
import SleepConfigModal from '../components/SleepConfigModal';

export default function DevicePage() {
  const { role } = useAuth();
  const [sleepDevice, setSleepDevice] = useState<any>(null);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);

  if (role !== 'admin') {
    return <Result status="403" title="无权限" subTitle="孩子模式下无法访问设备管理" />;
  }

  return (
    <div>
      <Tabs items={[
        {
          key: 'devices',
          label: '设备列表',
          children: <DeviceManager onSleepConfig={(device) => { setSleepDevice(device); setSleepModalVisible(true); }} />,
        },
        {
          key: 'rfid',
          label: 'RFID卡绑定',
          children: <RFIDBindingManager />,
        },
      ]} />
      {sleepDevice && (
        <SleepConfigModal device={sleepDevice} visible={sleepModalVisible}
          onClose={() => { setSleepModalVisible(false); setSleepDevice(null); }} />
      )}
    </div>
  );
}