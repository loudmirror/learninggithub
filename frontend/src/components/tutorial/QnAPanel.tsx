/**
 * QnAPanel Component
 * 智能问答面板组件 - 完整实现
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Tag,
  message,
  Divider,
  Collapse,
  Empty,
  Alert,
} from 'antd';
import {
  QuestionCircleOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { qaApi } from '@/lib/qaApi';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import type { ChatMessage, CodeReference } from '@/types/qa';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface QnAPanelProps {
  repoUrl: string;
  currentModuleId?: string;
  currentStepId?: string;
}

export default function QnAPanel({
  repoUrl,
  currentModuleId,
  currentStepId,
}: QnAPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [references, setReferences] = useState<CodeReference[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 提交问题
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      message.warning('请输入您的问题');
      return;
    }

    if (question.trim().length < 5) {
      message.warning('问题至少需要 5 个字符');
      return;
    }

    if (question.trim().length > 500) {
      message.warning('问题不能超过 500 个字符');
      return;
    }

    // 添加用户消息到界面
    const userMessage: ChatMessage = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');

    setLoading(true);

    try {
      const response = await qaApi.askQuestion({
        repoUrl,
        question: userMessage.content,
        sessionId,
        context: currentModuleId || currentStepId
          ? {
              currentModuleId,
              currentStepId,
            }
          : undefined,
      });

      // 保存会话 ID
      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      // 添加 AI 回答到界面
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // 更新代码引用
      if (response.references.length > 0) {
        setReferences(response.references);
      }

      // 聚焦输入框
      inputRef.current?.focus();
    } catch (error: any) {
      message.error(error.message || '提问失败，请稍后重试');
      console.error('Ask question error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 清空对话
  const handleClearConversation = () => {
    setMessages([]);
    setSessionId(undefined);
    setReferences([]);
    message.success('对话已清空');
  };

  // 按Enter发送（Shift+Enter换行）
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} 分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} 小时前`;
    } else {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <Card
      title={
        <Space>
          <QuestionCircleOutlined />
          <span>智能问答</span>
          {sessionId && (
            <Tag color="blue" icon={<ClockCircleOutlined />}>
              会话中
            </Tag>
          )}
        </Space>
      }
      bordered={false}
      extra={
        messages.length > 0 && (
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearConversation}
          >
            清空对话
          </Button>
        )
      }
      styles={{
        body: { padding: 0, height: '600px', display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* 消息列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  在这里提问关于项目的任何问题
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  我会基于项目代码为您解答
                </Text>
              </Space>
            }
          >
            <Space direction="vertical" style={{ marginTop: '16px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                示例问题：
              </Text>
              <Button
                type="link"
                size="small"
                onClick={() => setQuestion('这个项目的主要功能是什么？')}
              >
                这个项目的主要功能是什么？
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => setQuestion('如何安装和运行这个项目？')}
              >
                如何安装和运行这个项目？
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => setQuestion('项目使用了哪些技术栈？')}
              >
                项目使用了哪些技术栈？
              </Button>
            </Space>
          </Empty>
        ) : (
          <List
            dataSource={messages}
            renderItem={(msg) => (
              <List.Item
                style={{
                  border: 'none',
                  padding: '12px 0',
                  alignItems: 'flex-start',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={
                        msg.role === 'user' ? (
                          <UserOutlined />
                        ) : (
                          <RobotOutlined />
                        )
                      }
                      style={{
                        backgroundColor:
                          msg.role === 'user' ? '#1890ff' : '#52c41a',
                      }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>
                        {msg.role === 'user' ? '我' : 'AI 助手'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </Space>
                  }
                  description={
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor:
                          msg.role === 'user' ? '#f0f5ff' : '#f6ffed',
                        borderRadius: '8px',
                      }}
                    >
                      {msg.role === 'user' ? (
                        <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Paragraph>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 代码引用 */}
      {references.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          <Divider style={{ margin: '12px 0' }} />
          <Collapse
            size="small"
            items={[
              {
                key: 'references',
                label: (
                  <Space>
                    <FileTextOutlined />
                    <Text strong>代码引用 ({references.length})</Text>
                  </Space>
                ),
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {references.map((ref, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '8px',
                          backgroundColor: '#fafafa',
                          borderRadius: '4px',
                        }}
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Text strong style={{ fontSize: '12px' }}>
                            {ref.filePath}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            行 {ref.startLine}-{ref.endLine}
                          </Text>
                          <pre
                            style={{
                              margin: 0,
                              padding: '8px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '4px',
                              fontSize: '11px',
                              overflow: 'auto',
                              maxHeight: '200px',
                            }}
                          >
                            <code>{ref.snippet}</code>
                          </pre>
                        </Space>
                      </div>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* 输入框 */}
      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入您的问题... (Enter 发送，Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            maxLength={500}
            disabled={loading}
            showCount
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAskQuestion}
            loading={loading}
            disabled={!question.trim() || loading}
          >
            发送
          </Button>
        </Space.Compact>

        {!sessionId && messages.length === 0 && (
          <Alert
            message="提示：第一次提问会创建新的对话会话"
            type="info"
            showIcon
            style={{ marginTop: '8px', fontSize: '12px' }}
            closable
          />
        )}
      </div>
    </Card>
  );
}
