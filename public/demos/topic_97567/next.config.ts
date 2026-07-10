import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 输出独立可运行的服务器包，供 Electron 启动
  output: "standalone",
  // 排除不必要的目录被文件追踪器包含到 standalone 输出中
  outputFileTracingExcludes: {
    '/': [
      './docs/**/*',
      './scripts/**/*',
      './electron/**/*',
      './release/**/*',
      './ai-collaboration-workflow-skill/**/*',
      './src/test-gap-analyzer/**/*',
      './public/ppt-package/**/*',
      './public/screenshots/**/*',
      './public/*.pptx',
      './public/*.html',
    ],
  },
};

export default nextConfig;
