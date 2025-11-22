/**
 * ProjectOverviewPanel Component
 * 项目概览面板组件
 */

'use client';

import { Card, Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

interface ProjectOverviewPanelProps {
  overview: string;
}

export default function ProjectOverviewPanel({ overview }: ProjectOverviewPanelProps) {
  return (
    <Card
      title={
        <>
          <BookOutlined /> 项目概览
        </>
      }
      bordered={false}
    >
      <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>
        {overview}
      </Paragraph>
    </Card>
  );
}
