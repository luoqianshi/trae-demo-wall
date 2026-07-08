import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '星钥 StarKey',
  description: '用孩子最痴迷的兴趣，生成专属社交情景练习',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
