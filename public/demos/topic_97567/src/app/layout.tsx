import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ClientProviders from "./components/ClientProviders";
import { SnowballProvider } from "../contexts/SnowballContext";
import { RecordsProvider } from "../contexts/RecordsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "雪球日记",
  description: "一个通过记录微小成功、用\"滚雪球\"可视化成长轨迹的AI陪伴工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientProviders>
          <SnowballProvider>
            <RecordsProvider>
            <Navbar />
            {children}
          </RecordsProvider>
          </SnowballProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
