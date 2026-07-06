import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '用典 - 古籍智慧生活顾问',
  description: '让千年典籍智慧，主动为你解今之忧。以古籍为智囊，以AI为桥梁，让传统文化走入现代生活。',
  keywords: ['用典', '古籍', '智慧', '生活顾问', 'AI', '传统文化'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5F0E6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-xuanzhi text-mo font-hei antialiased">
        {children}
      </body>
    </html>
  );
}
