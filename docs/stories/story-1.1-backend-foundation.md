# Story 1.1: 搭建后端基础架构

> **Story ID:** STORY-1.1
> **Epic:** EPIC-MVP-001 - LearningGitHub MVP v0.1
> **Iteration:** 迭代 1 - 基础架构 + Mock 数据
> **Status:** Draft
> **Priority:** P0 - Critical
> **Estimate:** 2-3 天
> **Created:** 2025-11-20

---

## User Story

**作为** 开发团队，
**我想要** 搭建完整的后端基础架构（FastAPI 项目骨架 + Mock 接口），
**以便** 前端团队可以基于真实的 API 规范进行开发，并验证端到端的数据流。

---

## Story 背景与上下文

### 项目上下文

LearningGitHub 是一个全新的项目（greenfield），目标是构建一个 AI 驱动的 GitHub 项目学习助手。本 Story 是 MVP 的第一步，需要从零搭建后端服务。

### 技术上下文

- **后端技术栈**: Python 3.9+, FastAPI, Poetry
- **数据格式**: REST API with JSON
- **部署目标**: 支持本地开发环境和 Docker 容器化
- **集成点**: 为前端提供标准的 REST API 接口

### 迭代 1 目标

在不接入真实 GitHub/LLM 服务的前提下，使用 Mock 数据打通端到端流程，验证架构设计的合理性。

---

## 验收标准 (Acceptance Criteria)

### 功能性需求

**AC1: 项目结构符合规范**
- ✅ 按照 `docs/architecture/source-tree.md` 创建完整的后端目录结构
- ✅ 包含 `app/` (应用代码)、`tests/` (测试代码) 等核心目录
- ✅ 使用 Poetry 管理依赖 (`pyproject.toml`, `poetry.lock`)

**AC2: FastAPI 应用可启动**
- ✅ 创建 `app/main.py` 作为应用入口
- ✅ 配置 CORS 中间件（允许前端跨域）
- ✅ 应用可通过 `uvicorn app.main:app --reload` 成功启动
- ✅ 访问 `http://localhost:8000/docs` 可看到自动生成的 API 文档（Swagger UI）

**AC3: 实现 Mock 教程 API**
- ✅ 创建 `GET /api/tutorial` 接口
- ✅ 接收参数：
  - `repoUrl` (必填, string): GitHub 仓库 URL
  - `language` (可选, string, 默认 "zh-CN"): 输出语言
- ✅ 返回符合前端规范的 Mock 教程数据（见下方数据结构）
- ✅ 对于无效 repoUrl，返回 400 错误和清晰的错误信息

**AC4: 统一错误处理**
- ✅ 实现全局异常处理器
- ✅ 所有 API 响应遵循统一格式：
  ```json
  // 成功
  {
    "ok": true,
    "data": { /* ... */ }
  }

  // 失败
  {
    "ok": false,
    "errorCode": "INVALID_URL",
    "message": "仓库 URL 格式无效",
    "details": {}
  }
  ```

**AC5: 配置管理**
- ✅ 创建 `app/config.py` 用于集中配置管理
- ✅ 支持从环境变量加载配置（使用 `python-dotenv`）
- ✅ 提供 `.env.example` 文件作为环境变量模板

**AC6: 日志系统**
- ✅ 配置结构化日志（使用 `structlog`）
- ✅ 日志包含请求 ID、时间戳、日志级别、消息
- ✅ 本地开发环境日志输出到控制台

### 质量需求

**AC7: 代码质量**
- ✅ 所有代码通过 Black 格式化检查
- ✅ 所有代码通过 isort import 排序检查
- ✅ 类型提示覆盖所有公开函数和方法
- ✅ 核心函数有 Google 风格的 Docstring

**AC8: 测试覆盖**
- ✅ 至少包含 1 个 API 集成测试（测试 `/api/tutorial` 端点）
- ✅ 测试可通过 `pytest` 命令执行
- ✅ 所有测试通过

**AC9: 文档完善**
- ✅ `backend/README.md` 包含：
  - 项目简介
  - 本地开发环境搭建步骤
  - API 接口说明
  - 运行测试的方法

---

## Mock 数据结构规范

### `/api/tutorial` 响应格式

```json
{
  "ok": true,
  "data": {
    "repo": {
      "owner": "vercel",
      "name": "next.js",
      "stars": 120000,
      "language": "TypeScript",
      "githubUrl": "https://github.com/vercel/next.js"
    },
    "overview": "Next.js 是一个 React 框架，提供生产级别的功能，如服务端渲染、静态生成、TypeScript 支持等。它由 Vercel 团队开发，是构建现代 Web 应用的最佳选择之一。",
    "prerequisites": [
      "Node.js 18.17 或更高版本",
      "npm 或 yarn 包管理器",
      "基础的 React 知识"
    ],
    "structure": {
      "directories": [
        {
          "path": "packages/",
          "description": "包含 Next.js 核心包和相关工具包"
        },
        {
          "path": "examples/",
          "description": "各种使用场景的示例项目"
        }
      ],
      "files": [
        {
          "path": "package.json",
          "description": "项目配置和依赖管理"
        },
        {
          "path": "turbo.json",
          "description": "Turborepo 配置，用于 monorepo 管理"
        }
      ]
    },
    "modules": [
      {
        "id": "module-1",
        "title": "环境准备",
        "description": "安装 Node.js 和配置开发环境",
        "order": 1,
        "stepIds": ["step-1", "step-2"]
      },
      {
        "id": "module-2",
        "title": "跑通项目",
        "description": "克隆仓库并启动开发服务器",
        "order": 2,
        "stepIds": ["step-3", "step-4", "step-5"]
      }
    ],
    "steps": [
      {
        "id": "step-1",
        "title": "检查 Node.js 版本",
        "description": "确保安装了 Node.js 18.17 或更高版本",
        "command": "node --version",
        "expectedOutput": "v18.17.0 或更高"
      },
      {
        "id": "step-2",
        "title": "安装 pnpm",
        "description": "Next.js 仓库使用 pnpm 作为包管理器",
        "command": "npm install -g pnpm",
        "expectedOutput": "pnpm 安装成功"
      },
      {
        "id": "step-3",
        "title": "克隆仓库",
        "description": "从 GitHub 克隆 Next.js 仓库到本地",
        "command": "git clone https://github.com/vercel/next.js.git",
        "expectedOutput": "仓库克隆完成"
      },
      {
        "id": "step-4",
        "title": "安装依赖",
        "description": "进入项目目录并安装所有依赖",
        "command": "cd next.js && pnpm install",
        "expectedOutput": "所有依赖安装完成"
      },
      {
        "id": "step-5",
        "title": "运行示例项目",
        "description": "启动一个示例项目验证环境",
        "command": "cd examples/blog && pnpm dev",
        "expectedOutput": "开发服务器运行在 http://localhost:3000"
      }
    ]
  }
}
```

---

## 技术实现任务 (Tasks)

### Task 1: 创建项目结构
- [ ] 创建 `backend/` 目录
- [ ] 初始化 Poetry 项目 (`poetry init`)
- [ ] 按照 source-tree.md 创建目录结构
- [ ] 创建 `.gitignore` 文件

### Task 2: 安装核心依赖
- [ ] 安装 FastAPI (`poetry add fastapi`)
- [ ] 安装 Uvicorn (`poetry add uvicorn`)
- [ ] 安装 Pydantic (`poetry add pydantic`)
- [ ] 安装 python-dotenv (`poetry add python-dotenv`)
- [ ] 安装 structlog (`poetry add structlog`)

### Task 3: 实现 FastAPI 应用入口
- [ ] 创建 `app/__init__.py`
- [ ] 创建 `app/main.py` 并初始化 FastAPI 应用
- [ ] 配置 CORS 中间件
- [ ] 添加健康检查端点 `GET /api/health`
- [ ] 测试应用启动

### Task 4: 实现配置管理
- [ ] 创建 `app/config.py`
- [ ] 定义配置类 (使用 Pydantic BaseSettings)
- [ ] 创建 `.env.example` 文件
- [ ] 在 main.py 中加载配置

### Task 5: 实现日志系统
- [ ] 创建 `app/core/logging.py`
- [ ] 配置 structlog
- [ ] 在 main.py 中初始化日志

### Task 6: 创建数据模型和 Schema
- [ ] 创建 `app/schemas/tutorial.py`
- [ ] 定义 TutorialRequest Schema
- [ ] 定义 TutorialResponse Schema
- [ ] 定义 Module, Step 等嵌套 Schema

### Task 7: 实现 Mock 教程 API
- [ ] 创建 `app/api/routes/tutorial.py`
- [ ] 实现 `GET /api/tutorial` 路由函数
- [ ] 实现 URL 基础校验逻辑
- [ ] 准备 Mock 数据（可以是硬编码的 JSON）
- [ ] 在 main.py 中注册路由

### Task 8: 实现错误处理
- [ ] 创建 `app/core/exceptions.py` 定义自定义异常
- [ ] 创建 `app/middleware/error_handler.py`
- [ ] 实现全局异常处理器
- [ ] 在 main.py 中注册异常处理器

### Task 9: 编写测试
- [ ] 安装测试依赖 (`poetry add --group dev pytest pytest-asyncio httpx`)
- [ ] 创建 `tests/conftest.py` (Pytest fixtures)
- [ ] 创建 `tests/integration/api/test_tutorial.py`
- [ ] 编写至少 2 个测试用例：
  - 测试成功获取教程 Mock 数据
  - 测试无效 URL 返回 400 错误
- [ ] 运行测试确保通过

### Task 10: 代码质量检查
- [ ] 安装开发工具 (`poetry add --group dev black isort mypy`)
- [ ] 运行 Black 格式化 (`poetry run black app tests`)
- [ ] 运行 isort 排序 (`poetry run isort app tests`)
- [ ] 运行 mypy 类型检查 (`poetry run mypy app`)
- [ ] 修复所有报错

### Task 11: 文档编写
- [ ] 编写 `backend/README.md`
- [ ] 包含环境搭建步骤
- [ ] 包含 API 接口说明
- [ ] 包含测试运行方法

### Task 12: Docker 支持（可选）
- [ ] 创建 `backend/Dockerfile`
- [ ] 创建 `backend/.dockerignore`
- [ ] 测试 Docker 构建和运行

---

## 技术说明 (Dev Notes)

### 项目初始化命令

```bash
# 1. 创建 backend 目录
mkdir backend && cd backend

# 2. 初始化 Poetry 项目
poetry init --no-interaction --name learninggithub-backend

# 3. 安装核心依赖
poetry add fastapi uvicorn pydantic python-dotenv structlog

# 4. 安装开发依赖
poetry add --group dev black isort mypy pytest pytest-asyncio httpx

# 5. 创建目录结构
mkdir -p app/{api/routes,core,schemas,middleware} tests/{integration/api,unit}
touch app/__init__.py app/main.py app/config.py
```

### 关键文件示例

**`app/main.py` 基础框架**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging
from app.api.routes import tutorial
from app.middleware.error_handler import add_exception_handlers

# 初始化日志
setup_logging()

# 创建 FastAPI 应用
app = FastAPI(
    title="LearningGitHub API",
    description="GitHub 项目学习助手后端服务",
    version="0.1.0",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(tutorial.router, prefix="/api")

# 注册异常处理器
add_exception_handlers(app)

# 健康检查
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
```

### 依赖版本

```toml
[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
pydantic = "^2.0.0"
python-dotenv = "^1.0.0"
structlog = "^23.2.0"

[tool.poetry.group.dev.dependencies]
black = "^23.11.0"
isort = "^5.12.0"
mypy = "^1.7.0"
pytest = "^7.4.3"
pytest-asyncio = "^0.21.1"
httpx = "^0.25.1"
```

---

## 风险与依赖

### 风险

**R1: Python/Poetry 环境配置问题**
- **影响**: 开发环境无法启动
- **缓解**: 提供详细的环境搭建文档，推荐使用 pyenv 管理 Python 版本

**R2: Mock 数据结构与前端不一致**
- **影响**: 前端集成时需要返工
- **缓解**: 与前端团队提前对齐 API 规范，使用 Pydantic Schema 确保类型一致性

### 依赖

- ✅ 架构文档已完成 (`docs/architecture/`)
- ✅ 技术栈已定义 (`tech-stack.md`)
- ✅ 源码树结构已定义 (`source-tree.md`)
- ✅ 编码标准已定义 (`coding-standards.md`)

### 后续 Story 依赖

- Story 1.2 (前端基础) 依赖本 Story 提供的 API 接口规范
- Story 2.1 (GitHub 解析) 将替换本 Story 的 Mock 实现为真实服务

---

## Definition of Done (完成定义)

- [x] 所有任务复选框已勾选 ✅
- [x] FastAPI 应用可成功启动并访问 Swagger 文档
- [x] `/api/tutorial` 接口返回符合规范的 Mock 数据
- [x] 所有测试通过 (`pytest`)
- [x] 代码质量检查通过 (Black, isort, mypy)
- [x] `backend/README.md` 文档完整且可执行
- [x] 代码已提交到 Git (feature branch)
- [x] 前端团队确认 API 规范满足需求

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
- [PRD v0.1](../prd.md)
- [架构文档](../architecture.md)
- [技术栈](../architecture/tech-stack.md)
- [源码树结构](../architecture/source-tree.md)
- [编码标准](../architecture/coding-standards.md)
