/**
 * ErrorMessage Component
 * 错误信息显示组件
 */

'use client';

import { Alert, Button, Space, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import type { ApiError } from '@/types/api';

const { Title, Paragraph } = Typography;

interface ErrorMessageProps {
  error: ApiError | Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

/**
 * 获取错误信息
 */
function getErrorMessage(error: ApiError | Error | string): {
  title: string;
  message: string;
  details?: string;
} {
  if (typeof error === 'string') {
    return {
      title: '发生错误',
      message: error,
    };
  }

  if ('errorCode' in error) {
    // ApiError
    return {
      title: error.errorCode,
      message: error.message,
      details: error.details ? JSON.stringify(error.details, null, 2) : undefined,
    };
  }

  // JavaScript Error
  return {
    title: '发生错误',
    message: error.message || '未知错误',
  };
}

export default function ErrorMessage({
  error,
  onRetry,
  onGoHome,
  showHomeButton = true,
}: ErrorMessageProps) {
  const { title, message, details } = getErrorMessage(error);

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '60px auto',
        padding: '20px',
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message={<Title level={4} style={{ margin: 0 }}>{title}</Title>}
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph style={{ margin: 0 }}>{message}</Paragraph>
              {details && (
                <details>
                  <summary style={{ cursor: 'pointer', marginTop: '8px' }}>查看详细信息</summary>
                  <pre
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto',
                    }}
                  >
                    {details}
                  </pre>
                </details>
              )}
            </Space>
          }
          type="error"
          showIcon
        />

        <Space>
          {onRetry && (
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
              重试
            </Button>
          )}
          {showHomeButton && onGoHome && (
            <Button icon={<HomeOutlined />} onClick={onGoHome}>
              返回首页
            </Button>
          )}
        </Space>
      </Space>
    </div>
  );
}
