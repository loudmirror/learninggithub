/**
 * RecentProjects Component
 * 最近访问的项目列表组件
 */

'use client';

import { Card, List, Typography, Button, Space, Tag, Empty } from 'antd';
import { GithubOutlined, ClockCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RecentProject } from '@/types/tutorial';

const { Text, Link } = Typography;

interface RecentProjectsProps {
  projects: RecentProject[];
  onSelect: (repoUrl: string) => void;
  onRemove: (repoUrl: string) => void;
  onClearAll: () => void;
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} 分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} 小时前`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} 天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

export default function RecentProjects({
  projects,
  onSelect,
  onRemove,
  onClearAll,
}: RecentProjectsProps) {
  if (projects.length === 0) {
    return (
      <Card title="最近访问" size="small">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无访问记录"
          style={{ padding: '20px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card
      title="最近访问"
      size="small"
      extra={
        <Button type="link" size="small" onClick={onClearAll} danger>
          清空
        </Button>
      }
    >
      <List
        dataSource={projects}
        renderItem={(project) => (
          <List.Item
            key={project.repoUrl}
            actions={[
              <Button
                key="delete"
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onRemove(project.repoUrl)}
                danger
              />,
            ]}
          >
            <List.Item.Meta
              avatar={<GithubOutlined style={{ fontSize: '24px' }} />}
              title={
                <Link onClick={() => onSelect(project.repoUrl)} strong>
                  {project.repoName}
                </Link>
              }
              description={
                <Space size="small">
                  <Tag color="blue">{project.language === 'zh-CN' ? '中文' : 'English'}</Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <ClockCircleOutlined /> {formatRelativeTime(project.visitedAt)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
        size="small"
      />
    </Card>
  );
}
