# LearningGitHub 技术栈规范

> 文档版本: v0.1
> 最后更新: 2025-11-20
> 状态: Frozen (MVP)

---

## 概述

本文档定义 LearningGitHub MVP v0.1 的官方技术栈选型。所有开发必须遵循此规范，确保技术一致性和可维护性。

---

## 后端技术栈

### 核心框架

**Web 框架: FastAPI**
- **版本**: 0.104.0+
- **选择理由**:
  - 原生异步支持，性能优异
  - 自动 API 文档生成 (OpenAPI/Swagger)
  - 类型提示和数据验证 (Pydantic)
  - 易于集成和部署
- **用途**: REST API 服务、路由管理、请求处理

**Python 版本: 3.9+**
- **最低版本**: 3.9
- **推荐版本**: 3.11
- **选择理由**: 稳定性、性能、类型提示支持

### 向量数据库与检索

**向量数据库: ChromaDB**
- **版本**: 0.4.0+
- **模式**: 嵌入式 (Embedded)
- **选择理由**:
  - 轻量级，适合单机 MVP
  - Python 原生支持
  - 易于集成和部署
  - 无需独立服务器
- **用途**: 代码片段向量存储、语义检索

**Embedding 模型**
- **主选方案**: OpenAI text-embedding-ada-002
  - API 调用，实现简单
  - 效果稳定可靠
  - 1536 维向量
- **备选方案**: sentence-transformers (开源)
  - 用于成本敏感或离线场景
  - 可本地部署

### GitHub 集成

**GitHub 访问方式**
- **GitHub REST API v3**
  - 获取仓库元数据 (名称、描述、stars、language)
  - 获取 README 内容
  - 认证: Personal Access Token
  - 限流: 5000 请求/小时 (认证后)

- **Git CLI**
  - 用于仓库克隆: `git clone --depth 1 <repo_url>`
  - 浅克隆减少带宽和存储
  - 临时本地缓存

**依赖库**
- `PyGithub`: GitHub API Python SDK
- `GitPython`: Git 操作封装

### LLM 集成

**大语言模型: OpenAI GPT**
- **主模型**: GPT-4 Turbo
  - 用于复杂教程生成和问答
  - 128K 上下文窗口
- **备选模型**: GPT-3.5 Turbo
  - 用于简单任务和成本优化
  - 16K 上下文窗口

**LLM 客户端**
- **库**: `openai` (官方 Python SDK)
- **版本**: 1.0.0+
- **功能**:
  - 聊天补全 (Chat Completions)
  - 流式输出支持
  - 重试和错误处理

### 数据存储

**主数据库: PostgreSQL** (可选，MVP 可简化)
- **版本**: 14+
- **用途**:
  - 仓库元数据存储
  - 教程缓存
  - 用户会话 (后续版本)
- **MVP 简化方案**: 使用文件存储或 SQLite

**缓存: Redis** (可选)
- **版本**: 7.0+
- **用途**:
  - 仓库解析结果缓存
  - 会话管理
  - 速率限制
- **MVP 简化方案**: 使用内存缓存或文件缓存

### 其他后端依赖

**必需依赖**
```toml
fastapi = "^0.104.0"
uvicorn = "^0.24.0"          # ASGI 服务器
pydantic = "^2.0.0"          # 数据验证
chromadb = "^0.4.0"          # 向量数据库
openai = "^1.0.0"            # OpenAI SDK
PyGithub = "^2.1.0"          # GitHub API
GitPython = "^3.1.0"         # Git 操作
python-dotenv = "^1.0.0"     # 环境变量管理
```

**可选依赖**
```toml
redis = "^5.0.0"             # Redis 客户端
psycopg2-binary = "^2.9.0"   # PostgreSQL 驱动
sentence-transformers = "^2.2.0"  # 开源 Embedding 模型
```

---

## 前端技术栈

### 核心框架

**UI 框架: Next.js**
- **版本**: 14.0.0+
- **模式**: App Router (推荐) 或 Pages Router
- **选择理由**:
  - React 最佳实践框架
  - 服务端渲染 (SSR) 和静态生成 (SSG)
  - 内置路由和 API Routes
  - 优秀的开发体验
- **用途**: 完整前端应用

**React 版本: 18.0.0+**
- 支持并发特性
- 改进的 Hooks API

**Node.js 版本: 18.0.0+**
- LTS 版本
- 稳定且性能优异

### UI 组件与样式

**组件库: Ant Design** (主选)
- **版本**: 5.0.0+
- **选择理由**:
  - 企业级 UI 组件库
  - 开箱即用的高质量组件
  - 完善的中文文档
  - 主题定制能力强
- **备选**: Tailwind CSS + Headless UI
  - 更灵活的定制能力
  - 更小的打包体积

**CSS 方案**
- **主方案**: Ant Design 内置样式系统
- **备选**: Tailwind CSS
  - Utility-first CSS 框架
  - 高度可定制

### 状态管理

**状态管理方案**
- **全局状态**: React Context API + useReducer
  - MVP 阶段足够简单
  - 无需引入重量级状态库
- **服务端状态**: SWR 或 React Query
  - 数据获取、缓存、同步
  - 自动重试和错误处理
- **备选**: Zustand (轻量级状态管理)

### 代码高亮与可视化

**代码高亮: highlight.js**
- **版本**: 11.0.0+
- **用途**: 教程中的代码片段语法高亮
- **备选**: Prism.js

**图表与可视化: Mermaid.js**
- **版本**: 10.0.0+
- **用途**: 项目结构可视化、流程图

### HTTP 客户端

**HTTP 请求: Axios**
- **版本**: 1.6.0+
- **用途**: API 调用、请求/响应拦截
- **备选**: Fetch API (原生)

### 前端依赖

**必需依赖**
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "antd": "^5.0.0",
  "axios": "^1.6.0",
  "highlight.js": "^11.9.0"
}
```

**开发依赖**
```json
{
  "typescript": "^5.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "@types/react": "^18.2.0",
  "@types/node": "^20.0.0"
}
```

---

## 开发工具链

### 包管理器

**后端: Poetry**
- 依赖管理和虚拟环境
- `pyproject.toml` 配置
- 锁定依赖版本

**前端: pnpm** (推荐) 或 npm
- 更快的安装速度
- 更高效的磁盘空间利用
- 严格的依赖管理

### 代码质量

**Python 代码检查**
- **Black**: 代码格式化
  - 配置: `pyproject.toml`
  - 最大行长: 88
- **isort**: import 排序
- **mypy**: 类型检查
- **pylint**: 代码质量检查

**TypeScript/JavaScript 代码检查**
- **ESLint**: 代码规范检查
  - 配置: Next.js 推荐配置
- **Prettier**: 代码格式化
  - 集成 ESLint
- **TypeScript**: 类型检查
  - 严格模式启用

### 版本控制

**Git**
- 分支策略: Git Flow (简化版)
  - `main`: 生产分支
  - `develop`: 开发分支
  - `feature/*`: 功能分支
- Commit 规范: Conventional Commits
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

---

## 部署与运行环境

### 容器化

**Docker**
- **后端**: Python 3.11-slim 基础镜像
- **前端**: Node 18-alpine 基础镜像
- **开发**: docker-compose 本地开发环境

### 部署平台

**推荐方案 (MVP)**
- **后端**: Railway / Render / Fly.io
  - 简单部署
  - 自动扩展
  - 合理价格
- **前端**: Vercel
  - Next.js 最佳部署平台
  - 自动 CI/CD
  - 全球 CDN
  - 免费额度

**备选方案**
- AWS (EC2 + S3 + CloudFront)
- Google Cloud Platform
- Azure

### CI/CD

**GitHub Actions**
- 自动测试
- 自动部署
- 代码质量检查

---

## 环境配置

### 环境变量

**后端 (.env)**
```bash
# GitHub
GITHUB_TOKEN=ghp_xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Database (可选)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# App
DEBUG=false
LOG_LEVEL=info
```

**前端 (.env.local)**
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags (可选)
NEXT_PUBLIC_ENABLE_QA=true
```

---

## 监控与日志

### 日志

**后端日志: structlog**
- 结构化日志
- JSON 格式输出
- 日志级别: DEBUG, INFO, WARNING, ERROR

**前端日志**
- 生产环境: Sentry (可选)
- 开发环境: console

### 性能监控 (可选)

- **APM**: New Relic / DataDog
- **错误追踪**: Sentry
- **用户分析**: Google Analytics / Plausible

---

## 安全

### API 密钥管理

- 环境变量存储
- 不提交到 Git
- 使用密钥管理服务 (AWS Secrets Manager, 可选)

### CORS 配置

- FastAPI CORS 中间件
- 仅允许前端域名

### 速率限制

- 基于 IP 的请求限流
- 防止滥用

---

## 总结

**后端核心**
- Python 3.9+ + FastAPI
- ChromaDB + OpenAI
- GitHub API + Git CLI

**前端核心**
- Next.js 14 + React 18
- Ant Design
- Axios + highlight.js

**开发工具**
- Poetry + pnpm
- Black + ESLint
- Docker + Git

**部署**
- Vercel (前端)
- Railway/Render (后端)
- GitHub Actions (CI/CD)

---

本技术栈经过精心选择，平衡了开发效率、性能、成本和可维护性，完全满足 MVP 阶段需求。
