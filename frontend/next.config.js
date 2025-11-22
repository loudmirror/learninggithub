const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许从外部加载图片（如果需要）
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
  // 显式配置 webpack 路径别名，确保 Vercel 构建时能正确解析
  // 使用 process.cwd() 而非 __dirname，更适合 Vercel 环境
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');
    return config;
  },
}

module.exports = nextConfig
