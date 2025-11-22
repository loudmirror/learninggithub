# LearningGitHub 源码树结构规范

> 文档版本: v0.1
> 最后更新: 2025-11-20
> 状态: Frozen (MVP)

---

## 概述

本文档定义 LearningGitHub 项目的标准目录结构和文件组织方式。所有代码必须遵循此结构，确保项目的可维护性和一致性。

---

## 项目根目录结构

```
learninggithub.com/
├── .bmad-core/              # BMAD 方法论核心配置 (已存在)
├── .claude/                 # Claude AI 配置 (已存在)
├── .github/                 # GitHub 工作流和配置
│   └── workflows/           # GitHub Actions CI/CD
├── .spec-workflow/          # 规格工作流配置 (已存在)
├── backend/                 # 后端服务 (FastAPI)
│   ├── app/                 # 应用代码
│   ├── tests/               # 测试代码
│   ├── pyproject.toml       # Poetry 配置
│   ├── poetry.lock          # 依赖锁定
│   ├── Dockerfile           # Docker 镜像
│   └── README.md            # 后端文档
├── frontend/                # 前端应用 (Next.js)
│   ├── src/                 # 源代码
│   ├── public/              # 静态资源
│   ├── package.json         # NPM 配置
│   ├── pnpm-lock.yaml       # 依赖锁定
│   ├── next.config.js       # Next.js 配置
│   ├── tsconfig.json        # TypeScript 配置
│   ├── Dockerfile           # Docker 镜像
│   └── README.md            # 前端文档
├── docs/                    # 项目文档 (已存在)
│   ├── architecture/        # 架构文档
│   ├── stories/             # 用户故事
│   ├── ux/                  # UX 设计
│   ├── prd.md               # 产品需求文档
│   └── architecture.md      # 架构总览
├── scripts/                 # 工具脚本
│   ├── setup.sh             # 环境搭建
│   └── deploy.sh            # 部署脚本
├── docker-compose.yml       # Docker Compose 配置
├── .gitignore               # Git 忽略规则
├── .env.example             # 环境变量示例
└── README.md                # 项目主文档
```

---

## 后端目录结构详解

### backend/ 完整结构

```
backend/
├── app/                     # 应用代码根目录
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── dependencies.py      # 依赖注入
│   │
│   ├── api/                 # API 路由层
│   │   ├── __init__.py
│   │   ├── routes/          # 路由定义
│   │   │   ├── __init__.py
│   │   │   ├── tutorial.py  # 教程相关 API
│   │   │   └── qa.py        # 问答相关 API
│   │   └── deps.py          # API 依赖
│   │
│   ├── core/                # 核心业务逻辑
│   │   ├── __init__.py
│   │   ├── exceptions.py    # 自定义异常
│   │   └── logging.py       # 日志配置
│   │
│   ├── services/            # 服务层 (领域服务)
│   │   ├── __init__.py
│   │   ├── repo_service.py      # 仓库解析服务
│   │   ├── content_service.py   # 内容处理与索引服务
│   │   ├── rag_service.py       # RAG 检索与生成服务
│   │   ├── learning_path_service.py  # 学习路径服务
│   │   └── qa_service.py        # 问答服务
│   │
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── repo.py          # 仓库相关模型
│   │   ├── tutorial.py      # 教程相关模型
│   │   ├── module.py        # 学习模块模型
│   │   └── qa.py            # 问答相关模型
│   │
│   ├── schemas/             # Pydantic 模式 (API 输入输出)
│   │   ├── __init__.py
│   │   ├── tutorial.py      # 教程 Schema
│   │   ├── module.py        # 模块 Schema
│   │   └── qa.py            # 问答 Schema
│   │
│   ├── clients/             # 外部服务客户端
│   │   ├── __init__.py
│   │   ├── github_client.py     # GitHub API 客户端
│   │   ├── openai_client.py     # OpenAI 客户端
│   │   └── chroma_client.py     # ChromaDB 客户端
│   │
│   ├── utils/               # 工具函数
│   │   ├── __init__.py
│   │   ├── git_utils.py         # Git 操作工具
│   │   ├── text_utils.py        # 文本处理工具
│   │   └── cache_utils.py       # 缓存工具
│   │
│   └── middleware/          # 中间件
│       ├── __init__.py
│       ├── error_handler.py     # 错误处理中间件
│       └── rate_limiter.py      # 速率限制中间件
│
├── tests/                   # 测试代码
│   ├── __init__.py
│   ├── conftest.py          # Pytest 配置和 Fixtures
│   ├── unit/                # 单元测试
│   │   ├── services/        # 服务层测试
│   │   ├── models/          # 模型测试
│   │   └── utils/           # 工具函数测试
│   ├── integration/         # 集成测试
│   │   ├── api/             # API 集成测试
│   │   └── clients/         # 客户端集成测试
│   └── fixtures/            # 测试数据
│       └── mock_data.json
│
├── alembic/                 # 数据库迁移 (如使用 PostgreSQL)
│   ├── versions/
│   └── env.py
│
├── pyproject.toml           # Poetry 项目配置
├── poetry.lock              # 依赖锁定文件
├── .env.example             # 环境变量示例
├── .python-version          # Python 版本声明 (pyenv)
├── Dockerfile               # Docker 镜像定义
├── .dockerignore            # Docker 忽略文件
└── README.md                # 后端文档
```

---

## 前端目录结构详解

### frontend/ 完整结构 (Next.js App Router)

```
frontend/
├── public/                  # 静态资源
│   ├── images/              # 图片资源
│   ├── icons/               # 图标
│   └── favicon.ico
│
├── src/                     # 源代码根目录
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页 (/)
│   │   ├── globals.css      # 全局样式
│   │   │
│   │   ├── tutorial/        # 教程页面路由
│   │   │   └── [owner]/
│   │   │       └── [repo]/
│   │   │           └── page.tsx  # 教程页面
│   │   │
│   │   └── api/             # API Routes (可选)
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── components/          # React 组件
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── home/            # 首页组件
│   │   │   ├── UrlInput.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── RecentProjects.tsx
│   │   │
│   │   ├── tutorial/        # 教程页面组件
│   │   │   ├── TutorialHeader.tsx
│   │   │   ├── ProjectOverviewPanel.tsx
│   │   │   ├── ProjectStructurePanel.tsx
│   │   │   ├── RunPrerequisitesPanel.tsx
│   │   │   ├── LearningPathPanel.tsx
│   │   │   ├── StepList.tsx
│   │   │   └── QnAPanel.tsx
│   │   │
│   │   ├── common/          # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── CodeBlock.tsx
│   │   │
│   │   └── ui/              # Ant Design 封装或自定义 UI
│   │       ├── Card.tsx
│   │       └── Panel.tsx
│   │
│   ├── lib/                 # 库和工具函数
│   │   ├── api/             # API 客户端
│   │   │   ├── client.ts    # Axios 实例配置
│   │   │   ├── tutorial.ts  # 教程 API
│   │   │   └── qa.ts        # 问答 API
│   │   │
│   │   ├── hooks/           # 自定义 React Hooks
│   │   │   ├── useTutorial.ts
│   │   │   ├── useQA.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── utils/           # 工具函数
│   │   │   ├── format.ts    # 格式化工具
│   │   │   ├── validation.ts  # 验证工具
│   │   │   └── storage.ts   # 本地存储工具
│   │   │
│   │   └── constants/       # 常量定义
│   │       ├── api.ts       # API 相关常量
│   │       └── routes.ts    # 路由常量
│   │
│   ├── types/               # TypeScript 类型定义
│   │   ├── tutorial.ts      # 教程相关类型
│   │   ├── module.ts        # 模块相关类型
│   │   ├── qa.ts            # 问答相关类型
│   │   └── api.ts           # API 响应类型
│   │
│   ├── contexts/            # React Context (状态管理)
│   │   ├── TutorialContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   └── styles/              # 样式文件
│       ├── variables.css    # CSS 变量
│       └── themes.ts        # Ant Design 主题配置
│
├── tests/                   # 测试代码
│   ├── unit/                # 单元测试
│   │   └── components/      # 组件测试
│   └── e2e/                 # 端到端测试 (Playwright)
│       └── tutorial.spec.ts
│
├── .next/                   # Next.js 构建输出 (gitignored)
├── node_modules/            # 依赖包 (gitignored)
│
├── package.json             # NPM 配置
├── pnpm-lock.yaml           # 依赖锁定
├── next.config.js           # Next.js 配置
├── tsconfig.json            # TypeScript 配置
├── .eslintrc.json           # ESLint 配置
├── .prettierrc              # Prettier 配置
├── .env.local.example       # 环境变量示例
├── Dockerfile               # Docker 镜像
├── .dockerignore            # Docker 忽略文件
└── README.md                # 前端文档
```

---

## 关键文件说明

### 后端关键文件

#### `backend/app/main.py` - FastAPI 应用入口
```python
# 应用初始化
# 路由注册
# 中间件配置
# CORS 配置
# 错误处理
```

#### `backend/app/config.py` - 配置管理
```python
# 环境变量加载
# 应用配置类
# GitHub/OpenAI 配置
# 数据库配置
```

#### `backend/app/services/` - 核心服务
- **repo_service.py**: GitHub 仓库解析
- **content_service.py**: 内容提取和向量化
- **rag_service.py**: RAG 检索和教程生成
- **learning_path_service.py**: 学习路径构建
- **qa_service.py**: 问答服务

### 前端关键文件

#### `frontend/src/app/layout.tsx` - 根布局
```tsx
// 全局布局
// 头部/底部
// 主题提供者
// 全局样式
```

#### `frontend/src/app/page.tsx` - 首页
```tsx
// URL 输入
// 语言选择
// 最近项目列表
```

#### `frontend/src/app/tutorial/[owner]/[repo]/page.tsx` - 教程页面
```tsx
// 动态路由
// 教程数据获取
// 教程内容展示
// 问答交互
```

#### `frontend/src/lib/api/` - API 客户端
- **client.ts**: Axios 实例配置
- **tutorial.ts**: 教程 API 方法
- **qa.ts**: 问答 API 方法

---

## 命名约定

### 文件命名

**后端 (Python)**
- 模块文件: `snake_case.py`
- 类名: `PascalCase`
- 函数名: `snake_case`
- 常量: `UPPER_SNAKE_CASE`

**前端 (TypeScript/React)**
- 组件文件: `PascalCase.tsx`
- 工具文件: `camelCase.ts`
- 类型文件: `camelCase.ts`
- 常量文件: `UPPER_SNAKE_CASE.ts` 或 `camelCase.ts`

### 目录命名

- 统一使用小写 + 下划线: `my_directory/`
- 前端组件目录可使用小写: `components/`

---

## 特殊目录说明

### `.bmad-core/` - BMAD 方法论核心
- 不修改，保持原有结构
- 包含 agents、tasks、templates、checklists

### `.spec-workflow/` - 规格工作流
- 规格文档管理
- 不修改现有配置

### `docs/` - 项目文档
- 保持现有结构
- 新增文档遵循现有分类

### `scripts/` - 工具脚本
- 环境搭建脚本
- 数据库迁移脚本
- 部署脚本
- 测试辅助脚本

---

## Git 忽略规则

### 后端 `.gitignore` (部分)
```gitignore
# Python
__pycache__/
*.py[cod]
*.so
.Python
venv/
.env

# Poetry
poetry.lock

# ChromaDB
chroma_data/

# 临时仓库缓存
temp_repos/
```

### 前端 `.gitignore` (部分)
```gitignore
# Next.js
.next/
out/

# Dependencies
node_modules/

# Env
.env.local

# Build
dist/
build/
```

---

## 开发环境配置

### 后端开发环境搭建

```bash
cd backend/
poetry install              # 安装依赖
poetry shell                # 激活虚拟环境
cp .env.example .env        # 配置环境变量
uvicorn app.main:app --reload  # 启动开发服务器
```

### 前端开发环境搭建

```bash
cd frontend/
pnpm install                # 安装依赖
cp .env.local.example .env.local  # 配置环境变量
pnpm dev                    # 启动开发服务器
```

---

## Docker 环境

### Docker Compose 结构

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    env_file:
      - ./frontend/.env.local
```

---

## 总结

**后端结构特点:**
- 清晰的分层架构 (API → Services → Models)
- 服务模块化，职责单一
- 完整的测试覆盖

**前端结构特点:**
- Next.js App Router 文件路由
- 组件按功能模块组织
- 清晰的类型定义和 API 抽象

**整体项目:**
- 前后端独立目录
- 文档完善集中管理
- Docker 支持容器化部署

遵循此源码树结构，确保项目的可维护性和团队协作效率。
