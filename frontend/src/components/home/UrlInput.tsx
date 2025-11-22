/**
 * UrlInput Component
 * GitHub 仓库 URL 输入组件
 */

'use client';

import { useState } from 'react';
import { Input, Button, Form, Space, Typography } from 'antd';
import { GithubOutlined, SearchOutlined } from '@ant-design/icons';
import { isValidGitHubUrl } from '@/lib/api';

const { Text } = Typography;

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
  defaultValue?: string;
}

export default function UrlInput({ onSubmit, loading = false, defaultValue = '' }: UrlInputProps) {
  const [form] = Form.useForm();
  const [error, setError] = useState<string>('');

  /**
   * 处理表单提交
   */
  const handleSubmit = (values: { repoUrl: string }) => {
    const url = values.repoUrl.trim();

    // 验证 URL
    if (!url) {
      setError('请输入 GitHub 仓库 URL');
      return;
    }

    if (!isValidGitHubUrl(url)) {
      setError('请输入有效的 GitHub 仓库 URL (例如: https://github.com/username/repo)');
      return;
    }

    setError('');
    onSubmit(url);
  };

  /**
   * 处理输入变化
   */
  const handleChange = () => {
    setError('');
  };

  return (
    <div className="url-input-container">
      <Form
        form={form}
        onFinish={handleSubmit}
        initialValues={{ repoUrl: defaultValue }}
        layout="vertical"
      >
        <Form.Item
          name="repoUrl"
          label={
            <Space>
              <GithubOutlined />
              <Text strong>GitHub 仓库 URL</Text>
            </Space>
          }
          validateStatus={error ? 'error' : ''}
          help={error}
        >
          <Input
            size="large"
            placeholder="https://github.com/username/repository"
            prefix={<GithubOutlined style={{ color: '#8c8c8c' }} />}
            onChange={handleChange}
            disabled={loading}
            allowClear
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={loading}
            disabled={loading}
            block
          >
            {loading ? '生成中...' : '生成学习路径'}
          </Button>
        </Form.Item>
      </Form>

      <style jsx>{`
        .url-input-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
