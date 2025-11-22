# Story 3.2: 问答 UI 集成

## 📋 Story 元信息

- **Story ID**: STORY-3.2
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 3 - 问答功能 + 体验优化
- **状态**: Draft
- **优先级**: High
- **预估时间**: 1-2 天
- **负责人**: Dev Agent
- **依赖**: STORY-3.1 (问答服务实现)

---

## 📖 User Story

**As a** 用户
**I want** 在学习教程时能够方便地提问并查看回答
**So that** 我可以快速解决学习中的疑惑，无需离开学习界面

---

## 🎯 背景与上下文

### 项目上下文
在 Story 3.1 完成后端问答服务后，需要在前端集成问答 UI，提供良好的用户体验：
1. 在教程页面添加问答面板
2. 支持实时提问和回答展示
3. 显示代码引用和跳转功能
4. 保留会话历史

### 技术上下文
- **UI 组件**: Ant Design (Modal, Input, Button, List)
- **Markdown 渲染**: `react-markdown` + `react-syntax-highlighter`
- **状态管理**: React Hooks (`useState`, `useEffect`)
- **API 调用**: 复用 `lib/api.ts`

### 迭代目标
实现完整的问答 UI，与后端无缝集成，提供流畅的交互体验。

---

## ✅ 验收标准

### 功能性需求

1. **AC-3.2.1**: 添加问答入口
   - 在教程页面右侧或底部添加"提问"按钮
   - 点击后打开问答面板（Modal 或 Drawer）
   - 面板默认隐藏，不影响学习体验

2. **AC-3.2.2**: 问答输入界面
   - 提供多行文本输入框（支持换行）
   - "发送"按钮，禁用状态：输入为空或正在加载
   - 字符限制: 5-500 字符
   - 显示字符计数

3. **AC-3.2.3**: 回答展示
   - 使用 Markdown 渲染回答内容
   - 代码块语法高亮
   - 回答以流式方式显示（加载动画）

4. **AC-3.2.4**: 代码引用功能
   - 在回答下方显示相关代码引用
   - 每个引用显示: 文件路径 + 行号
   - 点击引用可跳转到代码查看（可选，MVP 可简化）

5. **AC-3.2.5**: 会话历史
   - 面板内展示当前会话的所有问答
   - 用户问题左对齐，助手回答右对齐（或统一左对齐）
   - 滚动到最新消息

6. **AC-3.2.6**: 错误处理
   - API 调用失败: 显示友好错误提示
   - 仓库未向量化: 提示用户先生成教程
   - 加载超时: 显示重试按钮

7. **AC-3.2.7**: 上下文传递
   - 自动传递当前学习位置（currentModuleId, currentStepId）
   - 在问答请求中包含上下文信息

8. **AC-3.2.8**: 响应式设计
   - 在桌面端: 使用 Drawer 或 Modal，宽度 600-800px
   - 在移动端: 全屏 Modal
   - 适配不同屏幕尺寸

### 质量需求

9. **AC-3.2.9**: 性能流畅
   - 输入无延迟
   - 回答加载时显示 Skeleton 或 Loading 动画
   - 历史消息加载 ≤ 500ms

10. **AC-3.2.10**: 用户体验
    - 交互直观，无需说明即可使用
    - 回答易读，代码格式清晰
    - 支持键盘操作（Enter 发送，Shift+Enter 换行）

11. **AC-3.2.11**: 代码质量
    - 组件化设计，可复用
    - TypeScript 类型完整
    - 遵循 `coding-standards.md`

---

## 🔧 技术实现任务

### Task 1: 安装依赖
**预估**: 10 分钟

```bash
cd frontend
pnpm add react-markdown react-syntax-highlighter
pnpm add -D @types/react-syntax-highlighter
```

---

### Task 2: 创建问答 API 客户端
**预估**: 30 分钟

在 `frontend/src/lib/api.ts` 中添加:

```typescript
export interface AskQuestionParams {
  repoUrl: string;
  question: string;
  sessionId?: string;
  context?: {
    currentModuleId?: string;
    currentStepId?: string;
  };
}

export interface QAResponse {
  answer: string;
  references: CodeReference[];
  relatedSteps: string[];
  sessionId: string;
}

export interface CodeReference {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  language: string;
}

export async function askQuestion(params: AskQuestionParams): Promise<QAResponse> {
  const response = await fetch(`${API_BASE_URL}/qa/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to ask question');
  }

  const data = await response.json();
  return data.data;
}

export async function getConversationHistory(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/qa/history/${sessionId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch conversation history');
  }

  const data = await response.json();
  return data.data;
}
```

---

### Task 3: 创建 Markdown 渲染组件
**预估**: 30 分钟

创建 `frontend/src/components/QA/MarkdownRenderer.tsx`:

```typescript
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';

          return !inline ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

添加样式 `frontend/src/components/QA/MarkdownRenderer.module.css`:

```css
.inline-code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}
```

---

### Task 4: 创建代码引用组件
**预估**: 30 分钟

创建 `frontend/src/components/QA/CodeReferences.tsx`:

```typescript
import { Card, Typography } from 'antd';
import { CodeReference } from '@/lib/api';

const { Text } = Typography;

interface CodeReferencesProps {
  references: CodeReference[];
}

export function CodeReferences({ references }: CodeReferencesProps) {
  if (references.length === 0) {
    return null;
  }

  return (
    <div className="code-references">
      <Text strong>相关代码引用:</Text>
      {references.map((ref, index) => (
        <Card key={index} size="small" className="reference-card">
          <div className="reference-header">
            <Text code>{ref.filePath}</Text>
            <Text type="secondary"> (Lines {ref.startLine}-{ref.endLine})</Text>
          </div>
          <pre className="reference-snippet">
            <code>{ref.snippet}</code>
          </pre>
        </Card>
      ))}
    </div>
  );
}
```

添加样式:

```css
.code-references {
  margin-top: 16px;
}

.reference-card {
  margin-top: 8px;
}

.reference-header {
  margin-bottom: 8px;
}

.reference-snippet {
  background-color: #f6f8fa;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-size: 12px;
}
```

---

### Task 5: 创建问答面板组件
**预估**: 3 小时

创建 `frontend/src/components/QA/QAPanel.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { Drawer, Input, Button, List, Spin, message, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { askQuestion, QAResponse } from '@/lib/api';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CodeReferences } from './CodeReferences';

const { TextArea } = Input;
const { Text } = Typography;

interface QAPanelProps {
  open: boolean;
  onClose: () => void;
  repoUrl: string;
  currentModuleId?: string;
  currentStepId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  references?: QAResponse['references'];
}

export function QAPanel({
  open,
  onClose,
  repoUrl,
  currentModuleId,
  currentStepId
}: QAPanelProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: question
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await askQuestion({
        repoUrl,
        question,
        sessionId,
        context: {
          currentModuleId,
          currentStepId
        }
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        references: response.references
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.sessionId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提问失败，请重试');
      // 移除用户消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Drawer
      title="AI 助手"
      placement="right"
      width={700}
      open={open}
      onClose={onClose}
      footer={
        <div className="qa-input-container">
          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={500}
            showCount
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!question.trim() || loading}
            style={{ marginTop: 8 }}
          >
            发送
          </Button>
        </div>
      }
    >
      <div className="qa-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Text type="secondary">
              👋 您好！我是 AI 助手，可以回答关于这个项目的问题。
            </Text>
          </div>
        ) : (
          <List
            dataSource={messages}
            renderItem={(msg) => (
              <div className={`message message-${msg.role}`}>
                <div className="message-role">
                  {msg.role === 'user' ? '您' : 'AI 助手'}
                </div>
                <div className="message-content">
                  {msg.role === 'user' ? (
                    <Text>{msg.content}</Text>
                  ) : (
                    <>
                      <MarkdownRenderer content={msg.content} />
                      {msg.references && (
                        <CodeReferences references={msg.references} />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          />
        )}

        {loading && (
          <div className="loading-message">
            <Spin /> <Text type="secondary">AI 正在思考...</Text>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </Drawer>
  );
}
```

添加样式 `frontend/src/components/QA/QAPanel.module.css`:

```css
.qa-messages {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message {
  margin-bottom: 24px;
}

.message-role {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1890ff;
}

.message-user .message-role {
  color: #52c41a;
}

.message-content {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 8px;
}

.message-user .message-content {
  background-color: #e6f7ff;
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8c8c8c;
}

.qa-input-container {
  display: flex;
  flex-direction: column;
}
```

---

### Task 6: 集成到教程页面
**预估**: 1 小时

修改 `frontend/src/app/tutorial/[...params]/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { QAPanel } from '@/components/QA/QAPanel';
// ... 其他 imports

export default function TutorialPage({ params }: TutorialPageProps) {
  const [qaOpen, setQaOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string>();
  const [currentStepId, setCurrentStepId] = useState<string>();

  // ... 现有逻辑 ...

  return (
    <div className="tutorial-page">
      {/* 现有内容 */}

      {/* 问答按钮 */}
      <Button
        type="primary"
        shape="circle"
        icon={<QuestionCircleOutlined />}
        size="large"
        onClick={() => setQaOpen(true)}
        className="qa-floating-button"
      />

      {/* 问答面板 */}
      <QAPanel
        open={qaOpen}
        onClose={() => setQaOpen(false)}
        repoUrl={repoUrl}
        currentModuleId={currentModuleId}
        currentStepId={currentStepId}
      />
    </div>
  );
}
```

添加浮动按钮样式:

```css
.qa-floating-button {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}
```

---

### Task 7: 单元测试
**预估**: 1.5 小时

创建 `frontend/src/components/QA/__tests__/QAPanel.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QAPanel } from '../QAPanel';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('QAPanel', () => {
  it('should render empty state', () => {
    render(
      <QAPanel
        open={true}
        onClose={() => {}}
        repoUrl="https://github.com/test/repo"
      />
    );

    expect(screen.getByText(/AI 助手/)).toBeInTheDocument();
  });

  it('should submit question and display answer', async () => {
    const mockAskQuestion = jest.spyOn(api, 'askQuestion').mockResolvedValue({
      answer: 'Test answer',
      references: [],
      relatedSteps: [],
      sessionId: 'session-123'
    });

    render(
      <QAPanel
        open={true}
        onClose={() => {}}
        repoUrl="https://github.com/test/repo"
      />
    );

    const input = screen.getByPlaceholderText(/输入您的问题/);
    fireEvent.change(input, { target: { value: 'Test question' } });

    const submitButton = screen.getByText('发送');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument();
    });

    expect(mockAskQuestion).toHaveBeenCalledWith({
      repoUrl: 'https://github.com/test/repo',
      question: 'Test question',
      sessionId: undefined,
      context: {}
    });
  });
});
```

运行测试:
```bash
cd frontend
pnpm test
```

---

### Task 8: 文档更新
**预估**: 20 分钟

更新 `frontend/README.md`:

```markdown
## 问答功能

### 使用方式

1. 在教程页面点击右下角的问答按钮
2. 输入问题并点击"发送"
3. AI 助手会基于仓库代码回答您的问题
4. 查看代码引用了解更多细节

### 技术实现

- `react-markdown`: Markdown 渲染
- `react-syntax-highlighter`: 代码高亮
- Ant Design Drawer: 问答面板
```

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Markdown 渲染性能问题 | 低 | 低 | 使用虚拟滚动（如需要）|
| 移动端体验不佳 | 中 | 中 | 响应式设计测试 |

### 依赖关系

**前置依赖**:
- STORY-3.1: 问答服务实现

**后续依赖**:
- 无

---

## ✅ Definition of Done

- [ ] 所有 11 个验收标准通过
- [ ] 组件单元测试通过
- [ ] 在桌面端和移动端测试通过
- [ ] 与后端 API 集成测试通过
- [ ] 用户体验验证（至少 3 人试用）
- [ ] 代码符合规范
- [ ] Code Review 通过
- [ ] 文档更新

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1-8: 所有任务

#### 技术决策
- UI 组件: Ant Design Drawer
- Markdown 渲染: react-markdown
- 代码高亮: react-syntax-highlighter

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 3.1: 问答服务](./story-3.1-qa-service.md)
- [UX 规格](../ux/ux-spec.md)
- [编码规范](../architecture/coding-standards.md)
