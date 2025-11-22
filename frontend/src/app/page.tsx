/**
 * Home Page
 * 主页 - GitHub 仓库 URL 输入页面
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Typography, Space, Card, Divider } from 'antd';
import { GithubOutlined, RocketOutlined } from '@ant-design/icons';
import UrlInput from '@/components/home/UrlInput';
import LanguageSelector, { type Language } from '@/components/home/LanguageSelector';
import RecentProjects from '@/components/home/RecentProjects';
import { useTutorial } from '@/lib/hooks';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const router = useRouter();
  const {
    fetchTutorial,
    isLoading,
    recentProjects,
    removeFromRecentProjects,
    clearRecentProjects,
  } = useTutorial();

  const [language, setLanguage] = useState<Language>('zh-CN');

  /**
   * 处理 URL 提交
   */
  const handleSubmit = async (repoUrl: string) => {
    try {
      await fetchTutorial({ repoUrl, language });

      // 跳转到教程页面
      const encodedUrl = encodeURIComponent(repoUrl);
      router.push(`/tutorial?repoUrl=${encodedUrl}&language=${language}`);
    } catch (error) {
      console.error('Failed to fetch tutorial:', error);
      // 错误处理已在 useTutorial hook 中完成
    }
  };

  /**
   * 选择最近的项目
   */
  const handleSelectRecent = (repoUrl: string) => {
    handleSubmit(repoUrl);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header style={{ background: '#fff', padding: '0 50px', boxShadow: '0 2px 8px #f0f1f2' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '64px' }}>
          <GithubOutlined style={{ fontSize: '32px', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0 }}>
            LearningGitHub
          </Title>
        </div>
      </Header>

      {/* Content */}
      <Content style={{ padding: '50px 50px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <RocketOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
              <Title level={1}>快速学习 GitHub 项目</Title>
              <Paragraph style={{ fontSize: '18px', color: '#595959' }}>
                输入任意 GitHub 仓库 URL,自动生成结构化学习路径,
                <br />
                让你快速理解项目架构和代码实现
              </Paragraph>
            </Space>
          </div>

          {/* Input Section */}
          <Card
            style={{
              maxWidth: '800px',
              margin: '0 auto 40px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <UrlInput onSubmit={handleSubmit} loading={isLoading} />
              <Divider style={{ margin: '12px 0' }} />
              <LanguageSelector
                value={language}
                onChange={setLanguage}
                disabled={isLoading}
              />
            </Space>
          </Card>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <RecentProjects
                projects={recentProjects}
                onSelect={handleSelectRecent}
                onRemove={removeFromRecentProjects}
                onClearAll={clearRecentProjects}
              />
            </div>
          )}

          {/* Features Section */}
          <div style={{ marginTop: '80px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              主要特性
            </Title>
            <Space direction="horizontal" size="large" style={{ width: '100%', justifyContent: 'center' }}>
              <Card hoverable style={{ width: 300 }}>
                <Title level={4}>🎯 智能分析</Title>
                <Paragraph>
                  自动分析代码结构,识别关键模块和依赖关系,生成清晰的学习路径
                </Paragraph>
              </Card>
              <Card hoverable style={{ width: 300 }}>
                <Title level={4}>📚 分步讲解</Title>
                <Paragraph>
                  逐步引导你理解每个模块的功能和实现,配合代码片段深入讲解
                </Paragraph>
              </Card>
              <Card hoverable style={{ width: 300 }}>
                <Title level={4}>💡 实践建议</Title>
                <Paragraph>
                  提供运行环境配置、前置知识要求和学习建议,帮助你快速上手
                </Paragraph>
              </Card>
            </Space>
          </div>
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        <Text type="secondary">
          LearningGitHub © 2024 | Powered by Next.js & FastAPI
        </Text>
      </Footer>
    </Layout>
  );
}
