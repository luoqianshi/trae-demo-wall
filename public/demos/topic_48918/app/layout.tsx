import { AppShell } from '@/components/layout/app-shell';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata = {
  title: 'JobScope 管理台',
  description: '招聘数据采集与 AI 分析平台管理台',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
