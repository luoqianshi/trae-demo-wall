import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfigProvider locale={zhCN} theme={{
        token: {
          colorPrimary: '#00A870',
          borderRadius: 10,
          colorBgContainer: '#FFFFFF',
          colorBgLayout: '#F7F8FA',
          colorBorder: '#E4E4E7',
          colorBorderSecondary: '#F4F4F5',
          colorText: '#18181B',
          colorTextSecondary: '#52525B',
          colorTextTertiary: '#A1A1AA',
          colorTextQuaternary: '#D4D4D8',
          colorSuccess: '#00A870',
          colorWarning: '#D97706',
          colorError: '#DC2626',
          colorInfo: '#2563EB',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
          controlHeight: 36,
        },
        components: {
          Card: {
            borderRadiusLG: 16,
            paddingLG: 20,
            boxShadowTertiary: 'none',
            headerFontSize: 15,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            primaryShadow: 'none',
          },
          Table: {
            borderRadius: 12,
            headerBg: '#FAFAFA',
            headerColor: '#52525B',
            headerSplitColor: 'transparent',
            rowHoverBg: '#FAFAFA',
            cellPaddingBlock: 14,
          },
          Menu: {
            itemBorderRadius: 8,
            itemHeight: 40,
            itemSelectedBg: '#F4F5F7',
            itemSelectedColor: '#18181B',
            itemColor: '#52525B',
            itemHoverBg: '#FAFAFA',
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Modal: {
            borderRadiusLG: 16,
          },
          Input: {
            borderRadius: 8,
            activeShadow: '0 0 0 2px rgba(0, 168, 112, 0.1)',
          },
          Select: {
            borderRadius: 8,
          },
          Slider: {
            trackBg: '#00A870',
            handleColor: '#00A870',
            handleActiveColor: '#00A870',
          },
          Progress: {
            defaultColor: '#00A870',
          },
          Tabs: {
            inkBarColor: '#00A870',
            itemActiveColor: '#00A870',
            itemSelectedColor: '#00A870',
          },
        },
      }}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
