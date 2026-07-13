import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "晨间衣橱 | Morning Atelier",
  description: "晨间私人穿搭推荐和衣橱管理"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
