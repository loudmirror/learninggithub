/**
 * StepList Component
 * 学习步骤列表组件 - 增强版,支持完成标记和进度提示
 */

'use client';

import { useState } from 'react';
import { Card, Steps, Typography, Space, Tag, Collapse, Checkbox, Button, Divider, Alert } from 'antd';
import { BookOutlined, FileTextOutlined, BulbOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { CodeBlock } from '@/components/common';
import type { Step } from '@/types/tutorial';
import { THEME_COLORS, SPACING, BOX_SHADOW, TRANSITIONS } from '@/constants/design';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface StepListProps {
  steps: Step[];
  completedSteps: Set<string>;
  onStepToggle: (stepId: string) => void;
  currentModuleName?: string;
}

export default function StepList({
  steps,
  completedSteps,
  onStepToggle,
  currentModuleName,
}: StepListProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) {
    return (
      <Card bordered={false}>
        <Text type="secondary">当前模块暂无学习步骤</Text>
      </Card>
    );
  }

  const currentStepData = steps[currentStep];
  const isCurrentStepCompleted = completedSteps.has(currentStepData?.id);

  // 计算已完成步骤数
  const completedCount = steps.filter((step) => completedSteps.has(step.id)).length;

  // 获取下一步信息
  const nextStep = currentStep < steps.length - 1 ? steps[currentStep + 1] : null;

  return (
    <div className="step-list-container">
      {/* Module Info and Progress */}
      <Card
        bordered={false}
        style={{
          marginBottom: SPACING.md,
          boxShadow: BOX_SHADOW.sm,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <BookOutlined style={{ fontSize: '18px', color: THEME_COLORS.primary.main }} />
            <Text strong style={{ fontSize: '16px', color: THEME_COLORS.neutral.text.primary }}>
              {currentModuleName || '当前模块学习步骤'}
            </Text>
          </Space>
          <Space>
            <Text type="secondary">
              <CheckCircleOutlined style={{ color: THEME_COLORS.success.main }} /> 已完成 {completedCount}/
              {steps.length} 个步骤
            </Text>
          </Space>
        </div>
      </Card>

      {/* Steps Navigation */}
      <Card
        bordered={false}
        style={{
          marginBottom: SPACING.lg,
          boxShadow: BOX_SHADOW.sm,
        }}
      >
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          direction="horizontal"
          size="small"
          items={steps.map((step, index) => ({
            title: `步骤 ${index + 1}`,
            description: step.title,
            status: completedSteps.has(step.id)
              ? 'finish'
              : index === currentStep
              ? 'process'
              : 'wait',
          }))}
          style={{ marginBottom: 0 }}
        />

        {/* 进度提示和下一步提示 */}
        <Alert
          message={
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Text strong>当前进度：</Text>
                <Text>{completedCount}/{steps.length} 步骤已完成</Text>
                {completedCount === steps.length && (
                  <Tag color="success">🎉 全部完成</Tag>
                )}
              </Space>
              {nextStep && (
                <Space>
                  <Text type="secondary">下一步：</Text>
                  <Text strong>
                    <ArrowRightOutlined /> {nextStep.title}
                  </Text>
                </Space>
              )}
            </Space>
          }
          type={completedCount === steps.length ? 'success' : 'info'}
          showIcon
          style={{
            marginTop: SPACING.md,
            borderRadius: '4px',
          }}
        />
      </Card>

      {/* Current Step Details */}
      <Card
        bordered={false}
        style={{
          boxShadow: BOX_SHADOW.md,
          transition: `box-shadow ${TRANSITIONS.normal}`,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Step Header with Completion Checkbox */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Space>
              <Tag color={THEME_COLORS.primary.main}>步骤 {currentStep + 1}</Tag>
              <Title
                level={3}
                style={{
                  margin: 0,
                  textDecoration: isCurrentStepCompleted ? 'line-through' : 'none',
                  color: isCurrentStepCompleted
                    ? THEME_COLORS.neutral.text.disabled
                    : THEME_COLORS.neutral.text.primary,
                }}
              >
                {currentStepData.title}
              </Title>
            </Space>

            <Checkbox
              checked={isCurrentStepCompleted}
              onChange={() => onStepToggle(currentStepData.id)}
            >
              <Text strong>标记为完成</Text>
            </Checkbox>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Step Description */}
          <div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>
                <BookOutlined /> 描述
              </Text>
              <Paragraph>{currentStepData.description}</Paragraph>
            </Space>
          </div>

          {/* Code Snippet */}
          {currentStepData.codeSnippet && (
            <div>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <Text strong>
                    <FileTextOutlined /> 代码示例
                  </Text>
                  <Text type="secondary" code>
                    {currentStepData.filePath}:{currentStepData.lineStart}-
                    {currentStepData.lineEnd}
                  </Text>
                </Space>
                <CodeBlock
                  code={currentStepData.codeSnippet}
                  language={getLanguageFromPath(currentStepData.filePath)}
                  fileName={currentStepData.filePath}
                  showLineNumbers={true}
                />
              </Space>
            </div>
          )}

          {/* Explanation */}
          <div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>
                <BulbOutlined /> 详细说明
              </Text>
              <Paragraph
                style={{
                  background: THEME_COLORS.neutral.bgLight,
                  padding: `${SPACING.md}px`,
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  color: THEME_COLORS.neutral.text.secondary,
                }}
              >
                {currentStepData.explanation}
              </Paragraph>
            </Space>
          </div>

          {/* Tips */}
          {currentStepData.tips && currentStepData.tips.length > 0 && (
            <div>
              <Text strong>💡 小贴士</Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {currentStepData.tips.map((tip, index) => (
                  <li key={index}>
                    <Text>{tip}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Files */}
          {currentStepData.relatedFiles && currentStepData.relatedFiles.length > 0 && (
            <Collapse ghost>
              <Panel header="相关文件" key="1">
                <Space direction="vertical" size="small">
                  {currentStepData.relatedFiles.map((file, index) => (
                    <Text key={index} code>
                      {file}
                    </Text>
                  ))}
                </Space>
              </Panel>
            </Collapse>
          )}

          {/* 完成建议 */}
          {!isCurrentStepCompleted && currentStep > 0 && (
            <Alert
              message="建议先标记当前步骤为完成后再继续"
              type="warning"
              showIcon
              closable
              style={{
                borderRadius: '4px',
              }}
            />
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: `${SPACING.lg}px` }}>
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
              size="large"
            >
              上一步
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                if (!isCurrentStepCompleted) {
                  onStepToggle(currentStepData.id);
                }
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                }
              }}
            >
              {currentStep === steps.length - 1
                ? isCurrentStepCompleted
                  ? '已完成'
                  : '完成并结束'
                : isCurrentStepCompleted
                ? '下一步'
                : '完成并继续'}
            </Button>
          </div>
        </Space>
      </Card>

      <style jsx>{`
        .step-list-container {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

/**
 * 从文件路径推断语言
 */
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    go: 'go',
    rs: 'rust',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    html: 'html',
    xml: 'xml',
    css: 'css',
    scss: 'css',
    md: 'markdown',
  };

  return ext ? languageMap[ext] || 'text' : 'text';
}
