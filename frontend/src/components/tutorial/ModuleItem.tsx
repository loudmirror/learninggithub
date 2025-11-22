/**
 * ModuleItem Component
 * 学习模块项组件 - 支持折叠/展开
 */

'use client';

import { Card, Space, Tag, Typography, Badge } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  MinusCircleOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { Module, ModuleStatus } from '@/types/tutorial';
import { THEME_COLORS, SPACING, BOX_SHADOW, TRANSITIONS } from '@/constants/design';

const { Text, Paragraph } = Typography;

interface ModuleItemProps {
  module: Module;
  index: number;
  totalCount: number;
  status: ModuleStatus;
  isCurrent: boolean;
  onClick: () => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * 模块状态图标配置
 */
const STATUS_CONFIG = {
  'not-started': {
    icon: <MinusCircleOutlined style={{ fontSize: '20px', color: THEME_COLORS.neutral.border }} />,
    color: THEME_COLORS.neutral.border,
    text: '未开始',
  },
  'in-progress': {
    icon: <ClockCircleFilled style={{ fontSize: '20px', color: THEME_COLORS.primary.main }} />,
    color: THEME_COLORS.primary.main,
    text: '进行中',
  },
  completed: {
    icon: <CheckCircleFilled style={{ fontSize: '20px', color: THEME_COLORS.success.main }} />,
    color: THEME_COLORS.success.main,
    text: '已完成',
  },
};

export default function ModuleItem({
  module,
  index,
  totalCount,
  status,
  isCurrent,
  onClick,
  expandable = true,
  expanded = false,
  onToggleExpand,
}: ModuleItemProps) {
  const statusConfig = STATUS_CONFIG[status];

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是展开/折叠按钮，不触发选中
    if ((e.target as HTMLElement).closest('.expand-toggle')) {
      e.stopPropagation();
      onToggleExpand?.();
    } else {
      onClick();
    }
  };

  return (
    <Badge.Ribbon
      text={isCurrent ? '当前模块' : null}
      color="blue"
      style={{ display: isCurrent ? 'block' : 'none' }}
    >
      <Card
        hoverable
        onClick={handleCardClick}
        style={{
          marginBottom: SPACING.md,
          cursor: 'pointer',
          border: isCurrent
            ? `2px solid ${THEME_COLORS.primary.main}`
            : `1px solid ${THEME_COLORS.neutral.border}`,
          background: isCurrent ? THEME_COLORS.primary.light : THEME_COLORS.neutral.bgBase,
          transition: `all ${TRANSITIONS.normal}`,
          boxShadow: BOX_SHADOW.sm,
        }}
        bodyStyle={{ padding: expandable && !expanded ? `${SPACING.md}px` : `${SPACING.lg}px` }}
        onMouseEnter={(e) => {
          if (!isCurrent) {
            e.currentTarget.style.boxShadow = BOX_SHADOW.md;
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrent) {
            e.currentTarget.style.boxShadow = BOX_SHADOW.sm;
          }
        }}
      >
        {expandable && !expanded ? (
          // 折叠视图 - 只显示核心信息
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              {statusConfig.icon}
              <Text
                strong
                style={{
                  fontSize: '16px',
                  color: isCurrent ? THEME_COLORS.primary.main : THEME_COLORS.neutral.text.primary,
                }}
              >
                {module.name}
              </Text>
              <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            </Space>

            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {index + 1}/{totalCount}
              </Text>
              <RightOutlined
                className="expand-toggle"
                style={{
                  color: THEME_COLORS.neutral.text.secondary,
                  cursor: 'pointer',
                  padding: SPACING.xs,
                  transition: `transform ${TRANSITIONS.fast}`,
                }}
              />
            </Space>
          </div>
        ) : (
          // 展开视图 - 完整内容
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                {statusConfig.icon}
                <Text
                  strong
                  style={{
                    fontSize: '16px',
                    color: isCurrent ? THEME_COLORS.primary.main : THEME_COLORS.neutral.text.primary,
                  }}
                >
                  {module.name}
                </Text>
              </Space>

              <Space>
                <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {index + 1}/{totalCount}
                </Text>
                {expandable && (
                  <DownOutlined
                    className="expand-toggle"
                    style={{
                      color: THEME_COLORS.neutral.text.secondary,
                      cursor: 'pointer',
                      padding: SPACING.xs,
                      transition: `transform ${TRANSITIONS.fast}`,
                    }}
                  />
                )}
              </Space>
            </div>

            {/* Description */}
            <Paragraph
              style={{
                margin: 0,
                fontSize: '14px',
                color: THEME_COLORS.neutral.text.secondary,
                paddingLeft: '28px',
                lineHeight: 1.6,
              }}
              ellipsis={{ rows: 2, expandable: false }}
            >
              {module.description}
            </Paragraph>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '28px' }}>
              <Space size="large">
                {/* Estimated Time */}
                <Space size={4}>
                  <ClockCircleFilled style={{ fontSize: '12px', color: THEME_COLORS.neutral.text.secondary }} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    预计 {Math.ceil(module.estimatedMinutes / 60)} 小时
                  </Text>
                </Space>

                {/* Learning Objectives Count */}
                {module.learningObjectives && module.learningObjectives.length > 0 && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {module.learningObjectives.length} 个学习目标
                  </Text>
                )}
              </Space>
            </div>
          </Space>
        )}
      </Card>
    </Badge.Ribbon>
  );
}
