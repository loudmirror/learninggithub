/**
 * LoadingSpinner Component
 * 加载动画组件
 */

'use client';

import { Spin, Space, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LoadingSpinnerProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  tip = '加载中...',
  size = 'large',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />;

  const spinner = (
    <Space direction="vertical" size="middle" style={{ display: 'flex', alignItems: 'center' }}>
      <Spin indicator={antIcon} size={size} />
      {tip && <Text type="secondary">{tip}</Text>}
    </Space>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        width: '100%',
      }}
    >
      {spinner}
    </div>
  );
}
