/**
 * LearningPathPanel Component
 * 学习路径面板组件 - 增强版,支持学习进度和模块折叠
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, Space, Typography, Progress, Divider } from 'antd';
import { RocketOutlined, TrophyOutlined } from '@ant-design/icons';
import ModuleItem from './ModuleItem';
import type { Module, ModuleStatus } from '@/types/tutorial';
import { THEME_COLORS, SPACING, BOX_SHADOW } from '@/constants/design';

const { Text } = Typography;

interface LearningPathPanelProps {
  modules: Module[];
  currentModuleId: string;
  onModuleSelect: (moduleId: string) => void;
  getModuleStatus: (module: Module) => ModuleStatus;
  completedCount: number;
  totalCount: number;
  overallProgress: number;
}

export default function LearningPathPanel({
  modules,
  currentModuleId,
  onModuleSelect,
  getModuleStatus,
  completedCount,
  totalCount,
  overallProgress,
}: LearningPathPanelProps) {
  // 展开状态管理 - 默认只展开当前模块
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set([currentModuleId])
  );

  // 当前模块变化时，自动展开
  useEffect(() => {
    setExpandedModules((prev) => new Set([...prev, currentModuleId]));
  }, [currentModuleId]);

  // 切换模块展开/折叠
  const handleToggleExpand = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // 选择模块时自动展开
  const handleModuleSelect = (moduleId: string) => {
    setExpandedModules((prev) => new Set([...prev, moduleId]));
    onModuleSelect(moduleId);
  };

  return (
    <Card
      title={
        <Space>
          <RocketOutlined />
          <span>学习路径</span>
        </Space>
      }
      bordered={false}
      style={{
        boxShadow: BOX_SHADOW.sm,
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Overall Progress */}
        <div>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <TrophyOutlined style={{ fontSize: '16px', color: THEME_COLORS.warning.main }} />
                <Text strong style={{ color: THEME_COLORS.neutral.text.primary }}>
                  整体进度
                </Text>
              </Space>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                已完成 {completedCount}/{totalCount} 个模块
              </Text>
            </div>

            <Progress
              percent={overallProgress}
              strokeColor={{
                '0%': THEME_COLORS.primary.main,
                '100%': THEME_COLORS.success.main,
              }}
              status={overallProgress === 100 ? 'success' : 'active'}
              strokeWidth={8}
            />
          </Space>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Module List */}
        <div>
          <Text
            type="secondary"
            style={{
              fontSize: '13px',
              marginBottom: `${SPACING.md}px`,
              display: 'block',
              color: THEME_COLORS.neutral.text.secondary,
            }}
          >
            点击模块查看学习步骤，点击箭头展开/折叠详情
          </Text>

          {modules.map((module, index) => (
            <ModuleItem
              key={module.id}
              module={module}
              index={index}
              totalCount={modules.length}
              status={getModuleStatus(module)}
              isCurrent={module.id === currentModuleId}
              onClick={() => handleModuleSelect(module.id)}
              expandable={true}
              expanded={expandedModules.has(module.id)}
              onToggleExpand={() => handleToggleExpand(module.id)}
            />
          ))}
        </div>
      </Space>
    </Card>
  );
}
