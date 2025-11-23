/**
 * Tutorial Page
 * 教程详情页面 - 仿照 Zread 的三栏布局
 */

'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spin, message } from 'antd';
import {
  ArrowLeftOutlined,
  GithubOutlined,
  StarOutlined,
  ForkOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  PlayCircleFilled,
  SendOutlined,
  ExpandOutlined,
  CloseOutlined,
  RobotOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { ErrorMessage } from '@/components/common';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { useTutorial, useLearningProgress } from '@/lib/hooks';
import type { ModuleStatus } from '@/types/tutorial';
import styles from './page.module.css';

function TutorialPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error, fetchTutorial } = useTutorial();

  const repoUrl = searchParams.get('repoUrl');
  const language = (searchParams.get('language') as 'zh-CN' | 'en-US') || 'zh-CN';

  // AI 问答状态
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isSending, setIsSending] = useState(false);

  // 当前显示的内容类型
  const [activeSection, setActiveSection] = useState<'overview' | 'structure' | 'module'>('overview');

  // 学习进度
  const {
    completedSteps,
    currentModuleId,
    toggleStep,
    setCurrentModule,
    getModuleStatus,
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
    if (!repoUrl) {
      router.push('/');
      return;
    }
    fetchTutorial({ repoUrl, language });
  }, [repoUrl, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理模块选择
  const handleModuleSelect = (moduleId: string) => {
    setCurrentModule(moduleId);
    setActiveSection('module');
  };

  // 获取模块状态图标
  const getStatusIcon = (status: ModuleStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleFilled className={styles.statusCompleted} />;
      case 'in-progress':
        return <PlayCircleFilled className={styles.statusInProgress} />;
      default:
        return <span className={styles.statusNotStarted}>○</span>;
    }
  };

  // 发送聊天消息
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      // 模拟 AI 回复（实际应该调用后端 API）
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `感谢你的提问！关于"${userMessage}"，这是一个很好的问题。基于当前教程的内容，我建议你先阅读概述部分了解项目的整体架构，然后按照学习路径逐步深入学习各个模块。如果有具体的代码问题，可以参考代码片段和相关说明。`,
          },
        ]);
        setIsSending(false);
      }, 1000);
    } catch {
      message.error('发送失败，请重试');
      setIsSending(false);
    }
  };

  // 滚动到聊天底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 加载状态
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <span className={styles.loadingText}>正在生成学习路径...</span>
      </div>
    );
  }

  // 错误状态
  if (isError && error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => repoUrl && fetchTutorial({ repoUrl, language })}
        onGoHome={() => router.push('/')}
      />
    );
  }

  if (!data) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <span className={styles.loadingText}>加载中...</span>
      </div>
    );
  }

  const currentModule = data.modules.find((m) => m.id === currentModuleId);
  const currentModuleSteps = getCurrentModuleSteps();

  // 渲染主内容
  const renderMainContent = () => {
    if (activeSection === 'overview') {
      return (
        <article className={styles.article}>
          <header className={styles.articleHeader}>
            <h1 className={styles.articleTitle}>项目概述</h1>
            <div className={styles.articleMeta}>
              <span className={styles.articleMetaItem}>
                <ClockCircleOutlined />
                约 5 分钟
              </span>
              <span className={styles.articleTag}>
                <BookOutlined />
                入门
              </span>
            </div>
          </header>
          <div className={styles.articleContent}>
            <MarkdownRenderer content={data.overview} />

            <h2>运行环境</h2>
            <ul>
              {data.prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>

            <h2>项目结构</h2>
            <table>
              <thead>
                <tr>
                  <th>组件</th>
                  <th>用途</th>
                  <th>位置</th>
                </tr>
              </thead>
              <tbody>
                {data.structure.keyFiles.map((file, index) => (
                  <tr key={index}>
                    <td>{file.path.split('/').pop()}</td>
                    <td>{file.description}</td>
                    <td><code>{file.path}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      );
    }

    if (activeSection === 'module' && currentModule) {
      return (
        <article className={styles.article}>
          <header className={styles.articleHeader}>
            <h1 className={styles.articleTitle}>{currentModule.name}</h1>
            <div className={styles.articleMeta}>
              <span className={styles.articleMetaItem}>
                <ClockCircleOutlined />
                约 {currentModule.estimatedMinutes} 分钟
              </span>
              <span className={styles.articleTag}>
                {getModuleStatus(currentModule) === 'completed' ? (
                  <><CheckCircleFilled /> 已完成</>
                ) : getModuleStatus(currentModule) === 'in-progress' ? (
                  <><PlayCircleFilled /> 学习中</>
                ) : (
                  <><BookOutlined /> 未开始</>
                )}
              </span>
            </div>
          </header>

          <div className={styles.articleContent}>
            <p>{currentModule.description}</p>

            <h2>学习目标</h2>
            <ul>
              {currentModule.learningObjectives.map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>

            {currentModule.dependencies.length > 0 && (
              <>
                <h2>前置模块</h2>
                <ul>
                  {currentModule.dependencies.map((dep, index) => (
                    <li key={index}>{data.modules.find(m => m.id === dep)?.name || dep}</li>
                  ))}
                </ul>
              </>
            )}

            <h2>学习步骤</h2>
            {currentModuleSteps.map((step, index) => (
              <div key={step.id} style={{ marginBottom: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    onClick={() => toggleStep(step.id)}
                    style={{
                      cursor: 'pointer',
                      color: completedSteps.has(step.id) ? '#52c41a' : '#d9d9d9',
                    }}
                  >
                    {completedSteps.has(step.id) ? <CheckCircleFilled /> : '○'}
                  </span>
                  {index + 1}. {step.title}
                </h3>
                <p>{step.description}</p>

                {step.codeSnippet && (
                  <pre><code>{step.codeSnippet}</code></pre>
                )}

                <MarkdownRenderer content={step.explanation} />

                {step.tips.length > 0 && (
                  <div style={{
                    background: '#fffbe6',
                    border: '1px solid #ffe58f',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '12px',
                  }}>
                    <strong>提示：</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      {step.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      );
    }

    return null;
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 左侧边栏 */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.backButton} onClick={() => router.push('/')}>
            <ArrowLeftOutlined />
            返回首页
          </button>

          <div className={styles.repoInfo}>
            <div className={styles.repoName}>
              <GithubOutlined />
              {data.repo.name}
            </div>
            <p className={styles.repoDesc}>{data.repo.description}</p>
            <div className={styles.repoMeta}>
              <span className={styles.repoMetaItem}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#3572a5',
                  display: 'inline-block',
                  marginRight: 4,
                }} />
                {data.repo.language}
              </span>
              {data.repo.stars && (
                <span className={styles.repoMetaItem}>
                  <StarOutlined />
                  {data.repo.stars >= 1000 ? `${(data.repo.stars / 1000).toFixed(1)}k` : data.repo.stars}
                </span>
              )}
              {data.repo.forks && (
                <span className={styles.repoMetaItem}>
                  <ForkOutlined />
                  {data.repo.forks}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 目录导航 */}
        <nav className={styles.navSection}>
          <div className={styles.navTitle}>目录</div>
          <ul className={styles.navList}>
            <li
              className={`${styles.navItem} ${activeSection === 'overview' ? styles.navItemActive : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <div className={styles.navItemHeader}>
                <span className={styles.navItemTitle}>
                  <BookOutlined />
                  项目概述
                </span>
              </div>
            </li>

            {data.modules.map((module) => (
              <li
                key={module.id}
                className={`${styles.navItem} ${currentModuleId === module.id && activeSection === 'module' ? styles.navItemActive : ''}`}
                onClick={() => handleModuleSelect(module.id)}
              >
                <div className={styles.navItemHeader}>
                  <span className={styles.navItemTitle}>
                    {getStatusIcon(getModuleStatus(module))}
                    {module.name}
                  </span>
                </div>
                <div className={styles.navItemMeta}>
                  约 {module.estimatedMinutes} 分钟
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* 进度条 */}
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span className={styles.progressTitle}>学习进度</span>
            <span className={styles.progressValue}>{overallProgress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
            已完成 {completedModulesCount}/{totalModulesCount} 个模块
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => router.push('/')}>
              首页
            </span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbLink} onClick={() => setActiveSection('overview')}>
              {data.repo.name}
            </span>
            {activeSection === 'module' && currentModule && (
              <>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>{currentModule.name}</span>
              </>
            )}
          </div>
        </header>

        <div className={styles.contentBody}>
          {renderMainContent()}
        </div>
      </main>

      {/* 右侧边栏 - AI 问答 */}
      <aside className={styles.rightSidebar}>
        <div className={styles.rightSidebarHeader}>
          <span className={styles.rightSidebarTitle}>
            <RobotOutlined />
            Ask AI
          </span>
          <div className={styles.rightSidebarActions}>
            <button className={styles.iconButton} title="展开">
              <ExpandOutlined />
            </button>
            <button className={styles.iconButton} title="关闭">
              <CloseOutlined />
            </button>
          </div>
        </div>

        <div className={styles.chatContainer} ref={chatContainerRef}>
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
              <p>有任何关于这个项目的问题吗？</p>
              <p style={{ fontSize: 13 }}>我可以帮你解答代码、架构等相关问题</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.chatMessage} ${
                  msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant
                }`}
              >
                <div
                  className={`${styles.chatBubble} ${
                    msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className={`${styles.chatMessage} ${styles.chatMessageAssistant}`}>
              <div className={`${styles.chatBubble} ${styles.chatBubbleAssistant}`}>
                <Spin size="small" /> 正在思考...
              </div>
            </div>
          )}
        </div>

        <div className={styles.chatInputArea}>
          <div className={styles.chatInputWrapper}>
            <textarea
              className={styles.chatInput}
              placeholder="输入你的问题..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
            />
            <button
              className={styles.chatSendBtn}
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isSending}
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function TutorialPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <span className={styles.loadingText}>加载中...</span>
        </div>
      }
    >
      <TutorialPageContent />
    </Suspense>
  );
}
