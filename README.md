# LearningGitHub

> 快速学习 GitHub 开源项目的智能助手 - 自动生成结构化学习路径

## 📋 项目简介

LearningGitHub 是一个创新的学习工具，旨在帮助开发者快速理解和上手 GitHub 开源项目。通过输入任意 GitHub 仓库 URL，系统会自动分析项目结构，生成定制化的学习路径，让你循序渐进地掌握项目精髓。

### 核心功能

- 📖 **项目概览分析** - 自动解析项目架构和技术栈
- 🗂️ **结构可视化** - 清晰展示项目目录和关键文件
- 🎯 **AI 学习路径** - 基于 GPT-4 生成个性化学习路径
- 💻 **代码片段讲解** - 带语法高亮的代码示例和详细解释
- ✅ **进度追踪** - 实时保存学习进度，支持断点续学
- 📊 **完成度统计** - 可视化展示整体学习进度
- 🤖 **智能问答** - 随时提问，AI 基于代码分析即时解答
- 🎨 **优化体验** - 模块折叠、进度提示、平滑导航

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 或 **yarn** >= 1.22.0
- **Python** >= 3.9
- **Poetry** (Python 包管理器)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-org/learninggithub.com.git
cd learninggithub.com
```

#### 2. 安装 Poetry (如果尚未安装)

```bash
# macOS/Linux
curl -sSL https://install.python-poetry.org | python3 -

# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

验证安装:
```bash
poetry --version
```

#### 3. 设置后端

```bash
cd backend

# 安装依赖
poetry install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，根据需要调整配置

# 启动后端服务器
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将运行在 `http://localhost:8000`

#### 4. 设置前端

打开新的终端窗口:

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 默认配置已指向 localhost:8000，通常无需修改

# 启动开发服务器
npm run dev
```

前端应用将运行在 `http://localhost:3000`

### 访问应用

在浏览器中打开 [http://localhost:3000](http://localhost:3000)，开始使用 LearningGitHub！

## 📁 项目结构

```
learninggithub.com/
├── backend/                # FastAPI 后端服务
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   └── routes/
│   │   │       └── tutorial.py
│   │   ├── core/          # 核心配置
│   │   │   ├── config.py
│   │   │   ├── exceptions.py
│   │   │   └── logging.py
│   │   ├── schemas/       # Pydantic 数据模型
│   │   │   └── tutorial.py
│   │   └── main.py        # 应用入口
│   ├── pyproject.toml     # Poetry 配置
│   └── .env.example       # 环境变量示例
│
├── frontend/              # Next.js 前端应用
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   │   ├── page.tsx          # 首页
│   │   │   ├── tutorial/         # 教程页面
│   │   │   └── layout.tsx
│   │   ├── components/   # React 组件
│   │   │   ├── common/           # 通用组件
│   │   │   ├── home/             # 首页组件
│   │   │   └── tutorial/         # 教程页组件
│   │   ├── lib/          # 业务逻辑
│   │   │   ├── api/              # API 客户端
│   │   │   └── hooks/            # 自定义 Hooks
│   │   └── types/        # TypeScript 类型
│   ├── package.json
│   └── .env.local.example
│
└── README.md             # 项目文档 (本文件)
```

## 🔧 开发指南

### 后端开发

```bash
cd backend

# 运行测试
poetry run pytest

# 代码格式化
poetry run black app/
poetry run isort app/

# 类型检查
poetry run mypy app/

# 查看日志
tail -f logs/app.log
```

### 前端开发

```bash
cd frontend

# 运行测试
npm test

# 运行测试 (watch 模式)
npm run test:watch

# 代码格式化
npm run format

# Lint 检查
npm run lint

# 生产构建
npm run build

# 预览生产构建
npm run start
```

## 🧪 测试

### 运行所有测试

**后端测试:**
```bash
cd backend
poetry run pytest -v
```

**前端测试:**
```bash
cd frontend
npm test
```

### 测试覆盖率

**前端测试覆盖率:**
```bash
cd frontend
npm test -- --coverage
```

## 📦 生产部署

### 后端部署

```bash
cd backend

# 构建
poetry build

# 使用生产环境配置
export DEBUG=False
export LOG_LEVEL=WARNING

# 使用 gunicorn (生产环境推荐)
poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 前端部署

#### 部署到 Vercel (推荐)

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量:
   - `NEXT_PUBLIC_API_URL`: 生产环境后端 API 地址
   - `NEXT_PUBLIC_APP_NAME`: LearningGitHub
   - `NEXT_PUBLIC_APP_VERSION`: 0.1.0
4. 自动部署

#### 使用 Vercel CLI

```bash
cd frontend
npx vercel
```

#### 自托管部署

```bash
cd frontend

# 构建
npm run build

# 使用 Node.js 服务器启动
npm run start
```

## 🌟 功能特性

### 学习进度管理

- **自动保存**: 学习进度自动保存到浏览器 localStorage
- **多项目支持**: 每个仓库的进度独立追踪
- **进度可视化**: 实时显示模块和整体完成度
- **断点续学**: 刷新页面后进度不丢失

### 模块化学习

- **依赖关系**: 模块之间的学习依赖明确标注
- **学习目标**: 每个模块都有清晰的学习目标
- **时间估算**: 每个模块标注预估学习时长
- **状态追踪**: 未开始、进行中、已完成三种状态

### 代码学习

- **语法高亮**: 使用 highlight.js 提供代码高亮
- **详细解释**: 每个代码片段都有详细的中文解释
- **实用提示**: 提供实际操作建议和最佳实践
- **相关文件**: 列出相关联的其他文件

## 🔐 环境变量

### 后端环境变量 (.env)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `APP_NAME` | 应用名称 | LearningGitHub API |
| `APP_VERSION` | 应用版本 | 0.1.0 |
| `DEBUG` | 调试模式 | False |
| `API_PREFIX` | API 路径前缀 | /api |
| `CORS_ORIGINS` | CORS 允许的源 | ["http://localhost:3000"] |
| `LOG_LEVEL` | 日志级别 | INFO |

### 前端环境变量 (.env.local)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | http://localhost:8000 |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | LearningGitHub |
| `NEXT_PUBLIC_APP_VERSION` | 应用版本 | 0.1.0 |

> **注意**: 以 `NEXT_PUBLIC_` 开头的变量会暴露到浏览器端

## 🛠️ 技术栈

### 后端

- **FastAPI** - 现代、快速的 Python Web 框架
- **Pydantic** - 数据验证和设置管理
- **uvicorn** - ASGI 服务器
- **structlog** - 结构化日志

### 前端

- **Next.js 14** - React 服务端渲染框架
- **React 18** - UI 组件库
- **TypeScript** - 类型安全
- **Ant Design 5** - 企业级 UI 设计系统
- **Axios** - HTTP 客户端
- **highlight.js** - 代码语法高亮

### 开发工具

- **Poetry** - Python 包管理
- **ESLint** - JavaScript 代码检查
- **Prettier** - 代码格式化
- **Jest** - JavaScript 测试框架
- **pytest** - Python 测试框架

## ❓ 常见问题

### Q: Poetry 命令找不到？

A: 确保已正确安装 Poetry 并将其添加到 PATH:
```bash
# macOS/Linux
export PATH="$HOME/.local/bin:$PATH"

# 或重新安装
curl -sSL https://install.python-poetry.org | python3 -
```

### Q: 前端 API 请求失败？

A: 检查以下几点:
1. 后端服务是否正常运行 (http://localhost:8000)
2. `.env.local` 中的 API 地址是否正确
3. 浏览器控制台是否有 CORS 错误
4. 检查后端 `.env` 中的 `CORS_ORIGINS` 配置

### Q: npm install 失败？

A: 尝试以下步骤:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### Q: 学习进度丢失了？

A: 学习进度保存在浏览器的 localStorage 中。如果:
- 清除了浏览器缓存/数据
- 使用了隐身模式
- 更换了浏览器

进度会丢失。建议在同一浏览器中持续学习。

## 📝 开发路线图

- [x] **Iteration 1**: MVP 基础功能
  - [x] Story 1.1: 后端基础架构
  - [x] Story 1.2: 前端基础页面
  - [x] Story 1.3: 学习进度追踪

- [x] **Iteration 2**: AI 驱动的学习路径
  - [x] GitHub API 集成
  - [x] 代码结构分析
  - [x] OpenAI GPT-4 集成
  - [x] AI 学习路径生成
  - [x] 完整教程页面

- [x] **Iteration 3**: Q&A 功能和 UX 优化
  - [x] Story 3.1: Q&A 后端服务
  - [x] Story 3.2: Q&A 前端界面
  - [x] Story 3.3: 学习路径 UX 优化
  - [x] 设计系统建立
  - [x] 模块折叠功能

- [ ] **Iteration 4**: 生产准备（规划中）
  - [ ] 生产环境部署
  - [ ] 性能优化
  - [ ] 监控和日志
  - [ ] 用户反馈收集

- [ ] **Iteration 5**: 社区功能（规划中）
  - [ ] 用户账户系统
  - [ ] 学习路径分享
  - [ ] 社区评论和讨论

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

- 项目主页: [GitHub Repository](https://github.com/your-org/learninggithub.com)
- 问题反馈: [GitHub Issues](https://github.com/your-org/learninggithub.com/issues)

---

**Happy Learning! 🚀**
