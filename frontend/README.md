# LearningGitHub Frontend

> 快速学习 GitHub 项目的前端应用 - 基于 Next.js 14 构建

## 📋 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [测试](#测试)
- [构建部署](#构建部署)
- [环境变量](#环境变量)
- [常见问题](#常见问题)

## 项目简介

LearningGitHub Frontend 是一个帮助开发者快速学习和理解 GitHub 开源项目的 Web 应用。用户只需输入 GitHub 仓库 URL,即可自动生成:

- 📖 项目概览和架构分析
- 🗂️ 清晰的项目结构可视化
- 🎯 结构化的学习路径
- 💻 带高亮的代码片段讲解
- 🔍 逐步引导的学习步骤
- ✅ **学习进度追踪** - 标记已完成的步骤,自动保存学习进度
- 📊 **模块化学习** - 按模块组织学习内容,清晰展示完成状态
- 💾 **进度持久化** - 学习进度保存到浏览器,刷新页面不丢失

## 技术栈

### 核心框架

- **Next.js 14** - React 服务端渲染框架
- **React 18** - UI 组件库
- **TypeScript** - 类型安全的 JavaScript

### UI 组件

- **Ant Design 5** - 企业级 UI 设计系统
- **highlight.js** - 代码语法高亮

### 状态管理 & 数据获取

- **Axios** - HTTP 客户端
- **Custom Hooks** - useTutorial, useLocalStorage, useLearningProgress

### 开发工具

- **ESLint** - 代码规范检查
- **Prettier** - 代码格式化
- **Jest** - 单元测试框架
- **Testing Library** - React 组件测试

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 安装依赖

\`\`\`bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
\`\`\`

### 配置环境变量

复制环境变量示例文件:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

编辑 `.env.local` 文件,配置后端 API 地址:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=LearningGitHub
NEXT_PUBLIC_APP_VERSION=0.1.0
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
# 或
yarn dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

\`\`\`
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 首页
│   │   ├── tutorial/           # 教程页面
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # 根布局
│   │   └── globals.css         # 全局样式
│   │
│   ├── components/             # React 组件
│   │   ├── common/             # 通用组件
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── home/               # 首页组件
│   │   │   ├── UrlInput.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── RecentProjects.tsx
│   │   └── tutorial/           # 教程页组件
│   │       ├── TutorialHeader.tsx
│   │       ├── ProjectOverviewPanel.tsx
│   │       ├── RunPrerequisitesPanel.tsx
│   │       ├── ProjectStructurePanel.tsx
│   │       ├── LearningPathPanel.tsx
│   │       ├── StepList.tsx
│   │       └── QnAPanel.tsx
│   │
│   ├── lib/                    # 业务逻辑
│   │   ├── api/                # API 客户端
│   │   │   ├── client.ts       # Axios 配置
│   │   │   └── tutorial.ts     # Tutorial API
│   │   └── hooks/              # 自定义 Hooks
│   │       ├── useTutorial.ts
│   │       └── useLocalStorage.ts
│   │
│   └── types/                  # TypeScript 类型定义
│       ├── api.ts
│       └── tutorial.ts
│
├── public/                     # 静态资源
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript 配置
├── next.config.js              # Next.js 配置
├── jest.config.js              # Jest 配置
├── .eslintrc.json              # ESLint 配置
└── .prettierrc                 # Prettier 配置
\`\`\`

## 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 保证代码质量:

\`\`\`bash
# 运行 ESLint 检查
npm run lint

# 格式化代码
npm run format
\`\`\`

### 组件开发

#### 创建新组件

1. 在合适的目录下创建组件文件 (例如 `src/components/common/NewComponent.tsx`)
2. 使用 TypeScript 定义 Props 接口
3. 导出组件并在 `index.ts` 中添加导出

示例:

\`\`\`typescript
'use client';

import { FC } from 'react';

interface NewComponentProps {
  title: string;
  onAction?: () => void;
}

const NewComponent: FC<NewComponentProps> = ({ title, onAction }) => {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
};

export default NewComponent;
\`\`\`

#### 使用自定义 Hooks

\`\`\`typescript
import { useTutorial } from '@/lib/hooks';

function MyComponent() {
  const { data, isLoading, fetchTutorial } = useTutorial();

  // 使用 hook 的状态和方法
}
\`\`\`

### API 集成

API 客户端已配置好请求/响应拦截器,支持:

- 自动错误处理
- 统一的请求/响应格式
- 开发环境日志记录

使用示例:

\`\`\`typescript
import { getTutorial } from '@/lib/api';

const response = await getTutorial({
  repoUrl: 'https://github.com/user/repo',
  language: 'zh-CN',
});

if (response.ok) {
  console.log(response.data);
}
\`\`\`

## 测试

### 运行测试

\`\`\`bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
\`\`\`

### 编写测试

测试文件放在 `__tests__` 目录或使用 `.test.tsx` 后缀:

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
\`\`\`

## 构建部署

### 生产构建

\`\`\`bash
npm run build
\`\`\`

构建产物会生成在 `.next` 目录。

### 本地预览生产构建

\`\`\`bash
npm run start
\`\`\`

### 部署到 Vercel

项目已针对 Vercel 部署优化:

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

或使用 Vercel CLI:

\`\`\`bash
npx vercel
\`\`\`

## 环境变量

| 变量名                       | 说明                 | 示例值                     |
| ---------------------------- | -------------------- | -------------------------- |
| \`NEXT_PUBLIC_API_URL\`      | 后端 API 地址        | \`http://localhost:8000\`  |
| \`NEXT_PUBLIC_APP_NAME\`     | 应用名称             | \`LearningGitHub\`         |
| \`NEXT_PUBLIC_APP_VERSION\`  | 应用版本             | \`0.1.0\`                  |

> **注意**: 以 `NEXT_PUBLIC_` 开头的环境变量会暴露到浏览器端

## 常见问题

### Q: 为什么 API 请求失败?

A: 检查以下几点:
1. 后端服务是否正常运行
2. `.env.local` 中的 API 地址是否正确
3. 浏览器控制台是否有 CORS 错误

### Q: 如何添加新的语言支持?

A:
1. 在 `LanguageSelector.tsx` 中添加新的语言选项
2. 更新 `Language` 类型定义
3. 确保后端 API 支持该语言

### Q: 组件样式不生效?

A:
1. 检查是否正确导入了 Ant Design 样式
2. 确认使用 `'use client'` 指令(客户端组件)
3. 检查 CSS 模块是否正确导入

### Q: TypeScript 类型错误?

A:
1. 运行 `npm run build` 查看详细错误
2. 确保所有类型定义文件都已更新
3. 检查 `tsconfig.json` 配置

## 许可证

MIT License

## 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]

---

**Happy Coding! 🚀**
