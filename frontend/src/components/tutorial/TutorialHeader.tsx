/**
 * TutorialHeader Component
 * 教程页面头部组件
 */

'use client';

import { Tag, Space, Typography, Button } from 'antd';
import { GithubOutlined, StarOutlined, ForkOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { Repository } from '@/types/tutorial';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

interface TutorialHeaderProps {
  repo: Repository;
}

export default function TutorialHeader({ repo }: TutorialHeaderProps) {
  const router = useRouter();

  return (
    <div className="tutorial-header">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Back Button */}
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/')}
          style={{ padding: 0 }}
        >
          返回首页
        </Button>

        {/* Repository Info */}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <GithubOutlined style={{ fontSize: '24px' }} />
            <Title level={2} style={{ margin: 0 }}>
              {repo.name}
            </Title>
          </Space>

          <Paragraph type="secondary" style={{ margin: 0 }}>
            {repo.description}
          </Paragraph>

          <Space size="middle">
            <Tag color="blue">{repo.language}</Tag>
            {repo.stars !== undefined && (
              <Space size={4}>
                <StarOutlined />
                <Text>{repo.stars.toLocaleString()}</Text>
              </Space>
            )}
            {repo.forks !== undefined && (
              <Space size={4}>
                <ForkOutlined />
                <Text>{repo.forks.toLocaleString()}</Text>
              </Space>
            )}
            <Button
              type="link"
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: 0 }}
            >
              在 GitHub 上查看
            </Button>
          </Space>
        </Space>
      </Space>

      <style jsx>{`
        .tutorial-header {
          padding: 24px;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
        }
      `}</style>
    </div>
  );
}
