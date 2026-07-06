'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider, theme } from 'antd';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#4fd1ff',
            colorBgBase: '#09111f',
            colorBgContainer: '#101a2f',
            colorBorderSecondary: 'rgba(147, 197, 253, 0.12)',
            borderRadius: 14,
            fontFamily: 'Microsoft YaHei, PingFang SC, Segoe UI, sans-serif',
          },
          components: {
            Layout: {
              bodyBg: '#08111f',
              headerBg: 'rgba(8, 17, 31, 0.82)',
              siderBg: '#0b1527',
            },
            Card: {
              colorBgContainer: 'rgba(16, 26, 47, 0.92)',
            },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
