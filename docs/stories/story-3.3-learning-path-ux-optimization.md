# Story 3.3: 学习路径体验优化

## 📋 Story 元信息

- **Story ID**: STORY-3.3
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 3 - 问答功能 + 体验优化
- **状态**: Draft
- **优先级**: Medium
- **预估时间**: 1-2 天
- **负责人**: Dev Agent
- **依赖**: STORY-1.3 (学习路径 UI), STORY-2.4 (学习路径生成)

---

## 📖 User Story

**As a** 用户
**I want** 获得更流畅、更直观的学习路径体验
**So that** 我可以高效地完成学习，并清晰了解自己的进度

---

## 🎯 背景与上下文

### 项目上下文
基于 Story 1.3 的基础 UI，进行体验优化：
1. 优化视觉设计和交互动效
2. 添加学习进度可视化
3. 提供智能提示和引导
4. 优化性能和加载体验

### 技术上下文
- **动画库**: Framer Motion 或 Ant Design 内置动画
- **数据可视化**: Ant Design Progress, Charts (可选)
- **性能优化**: React.memo, useMemo, 虚拟滚动

### 迭代目标
提升学习路径的用户体验，降低学习门槛，提高完成率。

---

## ✅ 验收标准

### 功能性需求

1. **AC-3.3.1**: 学习进度可视化增强
   - 在页面顶部显示整体进度条
   - 显示完成百分比和已完成/总步骤数
   - Module 卡片显示各自进度

2. **AC-3.3.2**: 智能下一步提示
   - 高亮当前应该学习的 Step
   - 显示"继续学习"按钮，点击自动滚动到该 Step
   - 完成当前 Module 后自动展开下一个 Module

3. **AC-3.3.3**: 步骤完成动效
   - 勾选 Step 时显示流畅的动画效果
   - Module 全部完成时显示庆祝动画（如 ✨ 图标）

4. **AC-3.3.4**: 代码示例优化
   - 代码块添加"复制"按钮
   - 支持代码折叠/展开（长代码）
   - 代码语法高亮优化

5. **AC-3.3.5**: 学习路径导航
   - 添加侧边栏目录（可选，桌面端）
   - 快速跳转到任意 Module
   - 显示每个 Module 的完成状态

6. **AC-3.3.6**: 加载状态优化
   - 教程数据加载时显示 Skeleton Screen
   - 避免空白页面或突兀的内容跳动
   - Loading 状态友好提示

7. **AC-3.3.7**: 错误处理优化
   - 教程加载失败: 显示重试按钮
   - 网络错误: 友好提示
   - 空状态设计: 引导用户生成教程

8. **AC-3.3.8**: 响应式设计完善
   - 移动端: 优化触摸交互
   - 平板端: 适配中等屏幕
   - 桌面端: 充分利用空间

### 质量需求

9. **AC-3.3.9**: 性能优化
   - 首屏加载时间 ≤ 2 秒
   - 列表滚动流畅（60fps）
   - 大量 Steps 场景优化（虚拟滚动）

10. **AC-3.3.10**: 可访问性
    - 支持键盘导航
    - ARIA 标签完整
    - 色彩对比度符合 WCAG 2.1 AA 标准

11. **AC-3.3.11**: 代码质量
    - 组件拆分合理，可维护性强
    - TypeScript 类型完整
    - 遵循 `coding-standards.md`

---

## 🔧 技术实现任务

### Task 1: 安装依赖
**预估**: 5 分钟

```bash
cd frontend
pnpm add framer-motion
```

---

### Task 2: 创建整体进度条组件
**预估**: 45 分钟

创建 `frontend/src/components/Tutorial/ProgressHeader.tsx`:

```typescript
import { Progress, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

interface ProgressHeaderProps {
  totalSteps: number;
  completedSteps: number;
  currentModuleTitle: string;
}

export function ProgressHeader({
  totalSteps,
  completedSteps,
  currentModuleTitle
}: ProgressHeaderProps) {
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  const isCompleted = completedSteps === totalSteps;

  return (
    <motion.div
      className="progress-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="progress-info">
        <Title level={4}>
          {isCompleted ? (
            <>
              <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
              恭喜完成学习！
            </>
          ) : (
            <>正在学习: {currentModuleTitle}</>
          )}
        </Title>
        <Text type="secondary">
          已完成 {completedSteps} / {totalSteps} 步 ({percentage}%)
        </Text>
      </div>

      <Progress
        percent={percentage}
        status={isCompleted ? 'success' : 'active'}
        strokeColor={{
          from: '#108ee9',
          to: '#87d068'
        }}
      />
    </motion.div>
  );
}
```

---

### Task 3: 优化 Step 组件交互
**预估**: 1.5 小时

修改 `frontend/src/components/Tutorial/StepCard.tsx`:

```typescript
import { useState } from 'react';
import { Card, Checkbox, Button, Typography } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';

const { Title, Paragraph } = Typography;

interface StepCardProps {
  step: Step;
  isCompleted: boolean;
  isNext: boolean;  // 是否为下一步
  onToggle: (stepId: string) => void;
}

export function StepCard({ step, isCompleted, isNext, onToggle }: StepCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`step-card ${isNext ? 'next-step' : ''} ${isCompleted ? 'completed' : ''}`}
        hoverable
      >
        <div className="step-header">
          <Checkbox
            checked={isCompleted}
            onChange={() => onToggle(step.id)}
          >
            <Title level={5}>{step.title}</Title>
          </Checkbox>

          {isNext && !isCompleted && (
            <span className="next-badge">下一步</span>
          )}
        </div>

        <Paragraph>{step.description}</Paragraph>

        {step.command && (
          <div className="code-block">
            <div className="code-header">
              <span>命令</span>
              <Button
                type="text"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => handleCopy(step.command!)}
              >
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <SyntaxHighlighter language="bash" style={vscDarkPlus}>
              {step.command}
            </SyntaxHighlighter>
          </div>
        )}

        {step.code && (
          <div className="code-block">
            <div className="code-header">
              <span>代码示例</span>
              <Button
                type="text"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => handleCopy(step.code!)}
              >
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <SyntaxHighlighter language={step.language || 'javascript'} style={vscDarkPlus}>
              {step.code}
            </SyntaxHighlighter>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
```

添加样式:

```css
.step-card.next-step {
  border: 2px solid #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.step-card.completed {
  opacity: 0.7;
}

.next-badge {
  background: #1890ff;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px 12px;
  border-radius: 4px 4px 0 0;
}
```

---

### Task 4: 添加 Module 完成动画
**预估**: 45 分钟

修改 `frontend/src/components/Tutorial/ModuleCard.tsx`:

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyFilled } from '@ant-design/icons';

export function ModuleCard({ module, status, ... }: ModuleCardProps) {
  const isCompleted = status === 'completed';

  return (
    <Card
      className={`module-card module-${status}`}
      title={
        <div className="module-title">
          {module.title}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <TrophyFilled style={{ color: '#faad14', marginLeft: 8 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      {/* 现有内容 */}
    </Card>
  );
}
```

---

### Task 5: 添加"继续学习"按钮
**预估**: 30 分钟

在教程页面添加:

```typescript
export default function TutorialPage() {
  const nextStep = /* 从 learning path API 获取 */;

  const scrollToNextStep = () => {
    const element = document.getElementById(`step-${nextStep.id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="tutorial-page">
      <ProgressHeader {...progressData} />

      {nextStep && (
        <Button
          type="primary"
          size="large"
          onClick={scrollToNextStep}
          className="continue-button"
        >
          继续学习: {nextStep.title}
        </Button>
      )}

      {/* 其他内容 */}
    </div>
  );
}
```

---

### Task 6: 实现 Skeleton Loading
**预估**: 1 hour

创建 `frontend/src/components/Tutorial/TutorialSkeleton.tsx`:

```typescript
import { Card, Skeleton } from 'antd';

export function TutorialSkeleton() {
  return (
    <div className="tutorial-skeleton">
      <Skeleton.Input active style={{ width: 400, marginBottom: 24 }} />

      {[1, 2, 3].map((i) => (
        <Card key={i} style={{ marginBottom: 16 }}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ))}
    </div>
  );
}
```

在教程页面使用:

```typescript
if (loading) {
  return <TutorialSkeleton />;
}
```

---

### Task 7: 性能优化
**预估**: 1.5 小时

优化组件渲染:

```typescript
import React, { memo, useMemo } from 'react';

// 使用 React.memo 避免不必要的重渲染
export const StepCard = memo(function StepCard({ step, ... }) {
  // ... 组件逻辑
});

// 使用 useMemo 缓存计算结果
function TutorialPage() {
  const nextStep = useMemo(() => {
    return findNextStep(modules, completedSteps);
  }, [modules, completedSteps]);

  // ...
}
```

如果 Steps 很多（如 > 100），实现虚拟滚动（可选）。

---

### Task 8: 错误处理和空状态
**预估**: 45 分钟

创建 `frontend/src/components/Tutorial/EmptyState.tsx`:

```typescript
import { Button, Empty } from 'antd';
import { useRouter } from 'next/navigation';

export function TutorialEmptyState({ repoUrl }: { repoUrl: string }) {
  const router = useRouter();

  return (
    <Empty
      description="教程尚未生成"
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Button
        type="primary"
        onClick={() => router.push(`/?repo=${encodeURIComponent(repoUrl)}`)}
      >
        生成教程
      </Button>
    </Empty>
  );
}
```

---

### Task 9: 测试
**预估**: 1.5 小时

创建单元测试和集成测试。

---

### Task 10: 文档更新
**预估**: 20 分钟

更新 `frontend/README.md` 添加 UX 优化说明。

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 动画性能问题 | 低 | 中 | 使用 CSS 动画，限制动画元素数量 |
| 虚拟滚动实现复杂 | 中 | 低 | MVP 可暂不实现，后续优化 |

### 依赖关系

**前置依赖**:
- STORY-1.3: 学习路径 UI
- STORY-2.4: 学习路径生成

**后续依赖**:
- STORY-3.4: 用户测试

---

## ✅ Definition of Done

- [ ] 所有 11 个验收标准通过
- [ ] 组件单元测试通过
- [ ] 视觉设计验证
- [ ] 性能测试通过
- [ ] 响应式测试通过
- [ ] 可访问性测试通过
- [ ] 代码符合规范
- [ ] Code Review 通过

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1-10: 所有任务

#### 技术决策
- 动画库: Framer Motion
- 性能优化: React.memo + useMemo

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 1.3: 学习路径 UI](./story-1.3-learning-path-ui.md)
- [UX 规格](../ux/ux-spec.md)
- [编码规范](../architecture/coding-standards.md)
