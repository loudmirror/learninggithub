/**
 * Tutorial Page
 * 教程详情页面 - 增强版,支持学习进度
 */

'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout, Row, Col, Space, Button, message, BackTop } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  TutorialHeader,
  ProjectOverviewPanel,
  RunPrerequisitesPanel,
  ProjectStructurePanel,
  LearningPathPanel,
  StepList,
  QnAPanel,
} from '@/components/tutorial';
import { LoadingSpinner, ErrorMessage } from '@/components/common';
import { useTutorial, useLearningProgress } from '@/lib/hooks';

const { Content } = Layout;

function TutorialPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepListRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error, fetchTutorial } = useTutorial();

  const repoUrl = searchParams.get('repoUrl');
  const language = (searchParams.get('language') as 'zh-CN' | 'en-US') || 'zh-CN';

  // Initialize learning progress
  const {
    completedSteps,
    currentModuleId,
    toggleStep,
    setCurrentModule,
    getModuleStatus,
    resetProgress,
    completedModulesCount,
    totalModulesCount,
    overallProgress,
    getCurrentModuleSteps,
  } = useLearningProgress({
    repoUrl: repoUrl || '',
    modules: data?.modules || [],
    steps: data?.steps || [],
  });

  useEffect(() => {
    // Validate parameters
    if (!repoUrl) {
      router.push('/');
      return;
    }

    // Fetch tutorial data
    fetchTutorial({ repoUrl, language });
  }, [repoUrl, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    setCurrentModule(moduleId);

    // Scroll to step list
    setTimeout(() => {
      stepListRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  // Handle step toggle
  const handleStepToggle = (stepId: string) => {
    toggleStep(stepId);
  };

  // Handle reset progress
  const handleResetProgress = () => {
    if (window.confirm('确定要重置学习进度吗？此操作不可撤销。')) {
      resetProgress();
      message.success('学习进度已重置');
    }
  };

  // Loading State
  if (isLoading) {
    return <LoadingSpinner tip="正在生成学习路径..." fullScreen />;
  }

  // Error State
  if (isError && error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content>
          <ErrorMessage
            error={error}
            onRetry={() => repoUrl && fetchTutorial({ repoUrl, language })}
            onGoHome={() => router.push('/')}
          />
        </Content>
      </Layout>
    );
  }

  // No Data
  if (!data) {
    return <LoadingSpinner tip="加载中..." fullScreen />;
  }

  // Get current module steps
  const currentModuleSteps = getCurrentModuleSteps();
  const currentModule = data.modules.find((m) => m.id === currentModuleId);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <TutorialHeader repo={data.repo} />

      {/* Back to Top Button */}
      <BackTop visibilityHeight={200} />

      {/* Content */}
      <Content style={{ padding: '24px 50px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Overview and Prerequisites */}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <ProjectOverviewPanel overview={data.overview} />
              </Col>
              <Col xs={24} lg={8}>
                <RunPrerequisitesPanel prerequisites={data.prerequisites} />
              </Col>
            </Row>

            {/* Project Structure */}
            <Row>
              <Col span={24}>
                <ProjectStructurePanel structure={data.structure} />
              </Col>
            </Row>

            {/* Learning Path with Progress */}
            <Row>
              <Col span={24}>
                <div style={{ position: 'relative' }}>
                  <LearningPathPanel
                    modules={data.modules}
                    currentModuleId={currentModuleId}
                    onModuleSelect={handleModuleSelect}
                    getModuleStatus={getModuleStatus}
                    completedCount={completedModulesCount}
                    totalCount={totalModulesCount}
                    overallProgress={overallProgress}
                  />

                  {/* Reset Progress Button */}
                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleResetProgress}
                      danger
                    >
                      重置学习进度
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Learning Steps (Current Module) */}
            <div ref={stepListRef}>
              <Row>
                <Col span={24}>
                  <StepList
                    steps={currentModuleSteps}
                    completedSteps={completedSteps}
                    onStepToggle={handleStepToggle}
                    currentModuleName={currentModule?.name}
                  />
                </Col>
              </Row>
            </div>

            {/* Q&A Panel */}
            <Row>
              <Col span={24}>
                <QnAPanel
                  repoUrl={repoUrl || ''}
                  currentModuleId={currentModuleId}
                />
              </Col>
            </Row>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}

export default function TutorialPage() {
  return (
    <Suspense fallback={<LoadingSpinner tip="加载中..." fullScreen />}>
      <TutorialPageContent />
    </Suspense>
  );
}
