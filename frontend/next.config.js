/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许从外部加载图片（如果需要）
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
}

module.exports = nextConfig
