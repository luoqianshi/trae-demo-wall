import type { NextConfig } from 'next';

/**
 * Next.js 配置
 * 通过 rewrites 将 /api/* 请求代理到后端 http://localhost:8000/api/*
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
