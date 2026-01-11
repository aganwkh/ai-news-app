
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 开启静态导出，生成纯静态文件到 'out' 目录
  output: 'export',
  
  // 2. 禁用 Next.js 的图片优化 API，因为静态导出不支持
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
