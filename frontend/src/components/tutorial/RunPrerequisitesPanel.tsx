/**
 * RunPrerequisitesPanel Component
 * 运行前置条件面板组件
 */

'use client';

import { Card, List, Typography } from 'antd';
import { ToolOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface RunPrerequisitesPanelProps {
  prerequisites: string[];
}

export default function RunPrerequisitesPanel({ prerequisites }: RunPrerequisitesPanelProps) {
  if (prerequisites.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <>
          <ToolOutlined /> 运行前置条件
        </>
      }
      bordered={false}
    >
      <List
        dataSource={prerequisites}
        renderItem={(item) => (
          <List.Item>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
            <Text>{item}</Text>
          </List.Item>
        )}
        size="small"
      />
    </Card>
  );
}
