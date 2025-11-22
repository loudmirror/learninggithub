# Story 1.2: 创建前端基础应用

> **Story ID:** STORY-1.2
> **Epic:** EPIC-MVP-001 - LearningGitHub MVP v0.1
> **Iteration:** 迭代 1 - 基础架构 + Mock 数据
> **Status:** Draft
> **Priority:** P0 - Critical
> **Estimate:** 2-3 天
> **Created:** 2025-11-20
> **Depends On:** STORY-1.1 (后端 API 规范)

---

## User Story

**作为** 用户，
**我想要** 能够在网页上输入 GitHub 仓库 URL 并查看完整的学习教程，
**以便** 我可以按照教程步骤学习和运行该项目。

---

## Story 背景与上下文

### 项目上下文

本 Story 创建 LearningGitHub 的前端应用，包含首页（URL 输入）和教程页面（教程内容展示）。这是用户直接交互的界面，需要清晰、易用、响应迅速。

### 技术上下文

- **前端技术栈**: Next.js 14 (App Router), React 18, TypeScript
- **UI 组件库**: Ant Design 5
- **HTTP 客户端**: Axios
- **状态管理**: React Hooks + Context API
- **代码高亮**: highlight.js
- **集成点**: 调用后端 `/api/tutorial` 接口获取数据

### 迭代 1 目标

使用后端提供的 Mock 数据，完成前端页面开发和基础交互功能，验证用户体验流程的合理性。

---

## 验收标准 (Acceptance Criteria)

### 功能性需求

**AC1: 项目结构符合规范**
- ✅ 按照 `docs/architecture/source-tree.md` 创建完整的前端目录结构
- ✅ 使用 Next.js 14 App Router 模式
- ✅ 包含 `src/app/`, `src/components/`, `src/lib/`, `src/types/` 等核心目录
- ✅ 使用 TypeScript 进行类型安全开发

**AC2: 首页 (Home Page) 功能完整**
- ✅ 路由: `/`
- ✅ 包含以下元素:
  - 产品名称和简短副标题
  - GitHub URL 输入框（placeholder: "https://github.com/owner/repo"）
  - 语言选择器（默认选中"简体中文"）
  - "开始学习"按钮
  - 最近学习项目列表（暂时使用硬编码 Mock 数据）
- ✅ URL 输入框有基础验证（必须是 GitHub 域名）
- ✅ 点击"开始学习"后：
  - 显示 Loading 状态
  - 调用后端 `/api/tutorial?repoUrl=xxx` 接口
  - 成功后跳转到教程页面 `/tutorial/[owner]/[repo]`
  - 失败时显示错误提示（不跳转）

**AC3: 教程页面 (Tutorial Page) 功能完整**
- ✅ 路由: `/tutorial/[owner]/[repo]`
- ✅ 页面结构（桌面端）:
  - **顶部**: 仓库名称、stars、语言、返回首页链接
  - **左侧主内容区**:
    1. 项目概览 Panel
    2. 运行前准备 Panel
    3. 项目结构与文件 Panel
    4. 模块化学习路径 Panel
    5. 当前模块步骤列表
  - **右侧**: 问答区域（UI 壳，不实现功能）
- ✅ 移动端自适应（单列布局）
- ✅ 从后端 API 获取教程数据并正确渲染

**AC4: 组件实现完整**

实现以下核心组件（见 Task 列表）:
- ✅ `HomePage` - 首页容器
- ✅ `UrlInput` - URL 输入组件
- ✅ `LanguageSelector` - 语言选择器
- ✅ `RecentProjects` - 最近项目列表
- ✅ `TutorialPage` - 教程页容器
- ✅ `TutorialHeader` - 教程页头部
- ✅ `ProjectOverviewPanel` - 项目概览
- ✅ `RunPrerequisitesPanel` - 运行前准备
- ✅ `ProjectStructurePanel` - 项目结构
- ✅ `LearningPathPanel` - 学习路径
- ✅ `StepList` - 步骤列表
- ✅ `QnAPanel` - 问答区（壳组件）

**AC5: 代码高亮功能**
- ✅ 步骤中的命令代码使用 highlight.js 高亮显示
- ✅ 代码块有"复制"按钮，点击后复制到剪贴板
- ✅ 复制成功有短暂的视觉反馈

**AC6: 错误处理**
- ✅ API 调用失败时显示友好的错误页面
- ✅ 错误页面包含错误信息和"返回首页"按钮
- ✅ 使用 React Error Boundary 捕获组件渲染错误

**AC7: Loading 状态**
- ✅ 首页提交 URL 时按钮显示 Loading 状态
- ✅ 教程页面加载时显示骨架屏或 Loading 动画
- ✅ Loading 状态不会阻塞用户其他操作

### 质量需求

**AC8: 代码质量**
- ✅ 所有代码通过 ESLint 检查（Next.js 推荐配置）
- ✅ 所有代码通过 Prettier 格式化
- ✅ 所有组件和函数有明确的 TypeScript 类型定义
- ✅ 避免使用 `any` 类型

**AC9: 测试覆盖**
- ✅ 至少包含 2 个组件单元测试:
  - `UrlInput` 组件测试（验证输入和校验逻辑）
  - `StepList` 组件测试（验证步骤渲染）
- ✅ 测试可通过 `npm test` 或 `pnpm test` 执行
- ✅ 所有测试通过

**AC10: 响应式设计**
- ✅ 桌面端（≥1024px）：左右双列布局
- ✅ 移动端（<1024px）：单列纵向布局
- ✅ 在常见设备尺寸下（iPhone, iPad, Desktop）布局正常

**AC11: 文档完善**
- ✅ `frontend/README.md` 包含:
  - 项目简介
  - 本地开发环境搭建步骤
  - 可用的脚本命令
  - 项目结构说明

---

## 技术实现任务 (Tasks)

### Task 1: 创建 Next.js 项目
- [ ] 创建 `frontend/` 目录
- [ ] 使用 `create-next-app` 初始化项目（App Router + TypeScript）
- [ ] 按照 source-tree.md 调整目录结构（`src/` 模式）
- [ ] 安装 Ant Design: `pnpm add antd`
- [ ] 安装 Axios: `pnpm add axios`
- [ ] 安装 highlight.js: `pnpm add highlight.js`
- [ ] 配置 `.gitignore`

### Task 2: 配置开发环境
- [ ] 创建 `.env.local.example` 文件
- [ ] 配置 `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] 配置 `next.config.js`（如需要）
- [ ] 配置 Ant Design 主题（可选）
- [ ] 配置 ESLint 和 Prettier

### Task 3: 创建类型定义
- [ ] 创建 `src/types/tutorial.ts`:
  - `Repository` 接口
  - `TutorialData` 接口
  - `Module` 接口
  - `Step` 接口
  - `Directory`, `File` 接口
- [ ] 创建 `src/types/api.ts`:
  - `ApiResponse<T>` 通用接口
  - `ApiError` 接口

### Task 4: 创建 API 客户端
- [ ] 创建 `src/lib/api/client.ts`:
  - 配置 Axios 实例（baseURL, timeout, interceptors）
  - 添加请求/响应拦截器
- [ ] 创建 `src/lib/api/tutorial.ts`:
  - `fetchTutorial(repoUrl: string)` 函数
  - 类型安全的 API 调用

### Task 5: 创建自定义 Hooks
- [ ] 创建 `src/lib/hooks/useTutorial.ts`:
  - `useTutorial(repoUrl)` Hook
  - 管理 loading, error, data 状态
  - 提供 refetch 方法
- [ ] 创建 `src/lib/hooks/useLocalStorage.ts`:
  - 用于存储最近访问的项目列表

### Task 6: 实现 Home 页面
- [ ] 创建 `src/app/page.tsx` (首页)
- [ ] 创建 `src/components/home/UrlInput.tsx`
- [ ] 创建 `src/components/home/LanguageSelector.tsx`
- [ ] 创建 `src/components/home/RecentProjects.tsx`
- [ ] 实现 URL 验证逻辑（正则或简单字符串匹配）
- [ ] 实现"开始学习"点击事件
- [ ] 实现跳转逻辑（使用 Next.js Router）

### Task 7: 实现 Tutorial 页面基础
- [ ] 创建 `src/app/tutorial/[owner]/[repo]/page.tsx`
- [ ] 使用 `useTutorial` Hook 获取数据
- [ ] 实现 Loading 状态显示
- [ ] 实现错误状态显示

### Task 8: 实现 Tutorial 页面组件（左侧内容区）
- [ ] 创建 `src/components/tutorial/TutorialHeader.tsx`
- [ ] 创建 `src/components/tutorial/ProjectOverviewPanel.tsx`
- [ ] 创建 `src/components/tutorial/RunPrerequisitesPanel.tsx`
- [ ] 创建 `src/components/tutorial/ProjectStructurePanel.tsx`
- [ ] 创建 `src/components/tutorial/LearningPathPanel.tsx`
- [ ] 创建 `src/components/tutorial/StepList.tsx`
- [ ] 创建 `src/components/tutorial/StepItem.tsx`（单个步骤）

### Task 9: 实现问答区域（壳组件）
- [ ] 创建 `src/components/tutorial/QnAPanel.tsx`
- [ ] 仅包含 UI 结构（输入框 + 消息列表）
- [ ] 暂不实现实际问答功能（留给 Story 3.2）

### Task 10: 实现通用组件
- [ ] 创建 `src/components/common/LoadingSpinner.tsx`
- [ ] 创建 `src/components/common/ErrorMessage.tsx`
- [ ] 创建 `src/components/common/CodeBlock.tsx`（带复制功能）
- [ ] 创建 `src/components/common/Button.tsx`（如需要）

### Task 11: 实现代码高亮
- [ ] 在 `CodeBlock` 组件中集成 highlight.js
- [ ] 配置语法高亮主题
- [ ] 实现复制到剪贴板功能
- [ ] 实现复制成功的视觉反馈（如 Toast 或按钮文本变化）

### Task 12: 实现响应式布局
- [ ] 使用 Ant Design Grid 系统或 CSS Media Queries
- [ ] 桌面端：左右双列布局（8:4 或 9:3 比例）
- [ ] 移动端：单列布局，问答区通过 Tab 或底部入口显示
- [ ] 测试不同屏幕尺寸下的显示效果

### Task 13: 实现 Error Boundary
- [ ] 创建 `src/components/common/ErrorBoundary.tsx`
- [ ] 在根布局或关键页面使用 Error Boundary
- [ ] 提供友好的错误 UI

### Task 14: 编写测试
- [ ] 安装测试依赖: `pnpm add --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom`
- [ ] 配置 Jest (`jest.config.js`)
- [ ] 创建 `src/components/home/__tests__/UrlInput.test.tsx`
- [ ] 创建 `src/components/tutorial/__tests__/StepList.test.tsx`
- [ ] 运行测试确保通过

### Task 15: 代码质量检查
- [ ] 运行 ESLint: `pnpm lint`
- [ ] 运行 Prettier: `pnpm format`
- [ ] 修复所有 lint 和格式问题
- [ ] 确保 TypeScript 编译无错误: `pnpm build`

### Task 16: 文档编写
- [ ] 编写 `frontend/README.md`
- [ ] 包含环境搭建步骤
- [ ] 包含可用脚本说明
- [ ] 包含项目结构说明

### Task 17: 集成测试（本地联调）
- [ ] 启动后端服务（Story 1.1）
- [ ] 启动前端开发服务器
- [ ] 测试完整流程:
  1. 访问首页
  2. 输入 GitHub URL
  3. 点击"开始学习"
  4. 查看教程页面数据正确显示
- [ ] 验证所有 UI 组件正常工作

---

## 技术说明 (Dev Notes)

### 项目初始化命令

```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest frontend --typescript --app --use-pnpm

# 2. 进入项目目录
cd frontend

# 3. 调整目录结构为 src/ 模式（如 create-next-app 未自动生成）
mkdir -p src/app src/components src/lib src/types

# 4. 安装依赖
pnpm add antd axios highlight.js
pnpm add --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# 5. 创建环境变量文件
cp .env.local.example .env.local
```

### 关键文件示例

**`src/lib/api/client.ts`**

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token 等
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 统一错误处理
    if (error.response) {
      console.error("API Error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**`src/lib/api/tutorial.ts`**

```typescript
import apiClient from "./client";
import type { TutorialData } from "@/types/tutorial";
import type { ApiResponse } from "@/types/api";

export async function fetchTutorial(
  repoUrl: string
): Promise<TutorialData> {
  const response = await apiClient.get<ApiResponse<TutorialData>>(
    "/api/tutorial",
    {
      params: { repoUrl },
    }
  );

  if (!response.data.ok) {
    throw new Error(response.data.message || "获取教程失败");
  }

  return response.data.data;
}
```

**`src/lib/hooks/useTutorial.ts`**

```typescript
import { useState, useEffect } from "react";
import { fetchTutorial } from "@/lib/api/tutorial";
import type { TutorialData } from "@/types/tutorial";

export function useTutorial(repoUrl: string) {
  const [data, setData] = useState<TutorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTutorial() {
      try {
        setLoading(true);
        setError(null);
        const tutorial = await fetchTutorial(repoUrl);
        if (!cancelled) {
          setData(tutorial);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTutorial();

    return () => {
      cancelled = true;
    };
  }, [repoUrl]);

  return { data, loading, error };
}
```

### 依赖版本

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.0.0",
    "axios": "^1.6.0",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

---

## 风险与依赖

### 风险

**R1: 后端 API 规范变更**
- **影响**: 前端需要返工修改类型定义和 API 调用
- **缓解**: 与后端开发保持密切沟通，使用 TypeScript 尽早发现不一致

**R2: Ant Design 组件学习曲线**
- **影响**: 开发速度可能慢于预期
- **缓解**: 参考 Ant Design 官方文档和示例，优先使用简单组件

**R3: 响应式布局适配问题**
- **影响**: 移动端体验不佳
- **缓解**: 早期测试多种设备，使用 Chrome DevTools 模拟不同屏幕尺寸

### 依赖

- ✅ Story 1.1 完成（后端 API `/api/tutorial` 可用）
- ✅ 架构文档已完成
- ✅ UX 规格已完成 (`docs/ux/`)

### 后续 Story 依赖

- Story 1.3 (学习路径 UI 交互) 依赖本 Story 的基础组件
- Story 3.2 (问答 UI 集成) 将完善 QnAPanel 组件

---

## Definition of Done (完成定义)

- [x] 所有任务复选框已勾选 ✅
- [x] Next.js 应用可成功启动 (`pnpm dev`)
- [x] 首页可输入 URL 并跳转到教程页面
- [x] 教程页面可正确显示后端 Mock 数据
- [x] 所有测试通过 (`pnpm test`)
- [x] 代码质量检查通过 (ESLint, Prettier, TypeScript)
- [x] 响应式布局在桌面和移动端都正常
- [x] `frontend/README.md` 文档完整且可执行
- [x] 本地联调成功（前后端集成无误）
- [x] 代码已提交到 Git (feature branch)
- [x] UX 团队确认页面布局符合设计规范

---

## Dev Agent Record

> 此部分由开发工程师在实施过程中更新

### Agent Model Used
- 待填写

### Debug Log References
- 待填写

### Completion Notes
- 待填写

### File List

**Created:**
- 待填写

**Modified:**
- 待填写

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-20 | Story 创建 | PM (John) |

---

## 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 1.1: 后端基础架构](./story-1.1-backend-foundation.md)
- [PRD v0.1](../prd.md)
- [UX 规格](../ux/ux-spec.md)
- [前端规格](../ux/front-end-spec.md)
- [技术栈](../architecture/tech-stack.md)
- [源码树结构](../architecture/source-tree.md)
- [编码标准](../architecture/coding-standards.md)
