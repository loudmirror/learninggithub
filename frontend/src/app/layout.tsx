/**
 * Root Layout
 * 应用根布局
 */

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LearningGitHub - 快速学习 GitHub 项目',
  description: '输入任意 GitHub 仓库 URL,自动生成结构化学习路径',
  keywords: ['GitHub', '学习路径', '代码分析', '开源项目'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 4,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
