# LearningGitHub Backend

GitHub 项目学习助手后端服务 - FastAPI 实现

## 📋 项目简介

LearningGitHub Backend 是一个基于 FastAPI 的 RESTful API 服务，为前端提供 GitHub 项目学习教程数据。

### 当前版本

- **Version**: 0.1.0 (MVP - Mock 数据阶段)
- **Status**: Development
- **迭代**: 迭代 1 - 基础架构 + Mock 数据

## 🛠 技术栈

- **Python**: 3.9+
- **Web 框架**: FastAPI 0.104+
- **ASGI 服务器**: Uvicorn
- **数据验证**: Pydantic 2.0+
- **日志**: structlog
- **测试**: Pytest
- **代码格式化**: Black, isort
- **类型检查**: mypy

## 📦 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置管理
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── tutorial.py     # 教程 API 路由
│   ├── core/
│   │   ├── __init__.py
│   │   ├── exceptions.py       # 自定义异常
│   │   └── logging.py          # 日志配置
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── tutorial.py         # 数据模型
│   └── middleware/
│       ├── __init__.py
│       └── error_handler.py    # 全局异常处理
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest 配置
│   └── integration/
│       └── api/
│           └── test_tutorial.py
├── pyproject.toml              # Poetry 配置
├── .env.example                # 环境变量模板
├── .gitignore
└── README.md
```

## 🚀 快速开始

### 1. 环境要求

- Python 3.9 或更高版本
- Poetry (推荐) 或 pip

### 2. 安装依赖

使用 Poetry（推荐）:

```bash
# 安装 Poetry（如果尚未安装）
curl -sSL https://install.python-poetry.org | python3 -

# 安装项目依赖
cd backend
poetry install
```

使用 pip:

```bash
cd backend
pip install fastapi uvicorn pydantic pydantic-settings python-dotenv structlog
pip install --dev black isort mypy pytest pytest-asyncio httpx
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件（如需要）
# 默认配置已经可以直接使用
```

### 4. 启动开发服务器

使用 Poetry:

```bash
poetry run uvicorn app.main:app --reload
```

使用 uvicorn 直接启动:

```bash
uvicorn app.main:app --reload
```

服务将在 `http://localhost:8000` 启动。

### 5. 访问 API 文档

启动服务后，访问：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 📖 API 接口说明

### 健康检查

```
GET /api/health
```

**响应示例**:

```json
{
  "status": "healthy",
  "app_name": "LearningGitHub API",
  "version": "0.1.0"
}
```

### 获取教程数据 (Mock)

```
GET /api/tutorial?repoUrl={github_url}&language={lang}
```

**请求参数**:

- `repoUrl` (必填): GitHub 仓库 URL
  - 示例: `https://github.com/vercel/next.js`
- `language` (可选): 输出语言，默认 `zh-CN`
  - 支持: `zh-CN`, `en-US`

**成功响应** (200):

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
    "overview": "...",
    "prerequisites": ["Node.js 18.17+", "..."],
    "structure": {
      "directories": [...],
      "files": [...]
    },
    "modules": [...],
    "steps": [...]
  }
}
```

**错误响应** (400):

```json
{
  "ok": false,
  "errorCode": "INVALID_REPO_URL",
  "message": "Invalid repository URL: ...",
  "details": {
    "url": "..."
  }
}
```

## 🧪 运行测试

### 运行所有测试

```bash
poetry run pytest
```

### 运行特定测试文件

```bash
poetry run pytest tests/integration/api/test_tutorial.py
```

### 查看测试覆盖率

```bash
poetry run pytest --cov=app --cov-report=html
```

覆盖率报告将生成在 `htmlcov/index.html`。

## 🎨 代码质量检查

### 格式化代码

```bash
# 使用 Black 格式化
poetry run black app tests

# 使用 isort 排序 imports
poetry run isort app tests
```

### 类型检查

```bash
poetry run mypy app
```

### 一键运行所有检查

```bash
poetry run black app tests && poetry run isort app tests && poetry run mypy app && poetry run pytest
```

## 🔧 开发说明

### 当前阶段 (迭代 1)

- ✅ 使用 **Mock 数据** 返回教程信息
- ✅ 不连接真实的 GitHub API
- ✅ 不使用 LLM 生成内容
- ✅ 目的：验证架构和 API 规范

### 后续迭代

- **迭代 2**: 集成 GitHub API、ChromaDB、OpenAI
- **迭代 3**: 添加问答功能、优化体验

### 添加新的 API 端点

1. 在 `app/schemas/` 中定义数据模型
2. 在 `app/api/routes/` 中创建路由文件
3. 在 `app/main.py` 中注册路由
4. 在 `tests/integration/api/` 中添加测试

## 📝 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `APP_NAME` | 应用名称 | `LearningGitHub API` |
| `APP_VERSION` | 应用版本 | `0.1.0` |
| `DEBUG` | 调试模式 | `False` |
| `API_PREFIX` | API 路径前缀 | `/api` |
| `CORS_ORIGINS` | 允许的跨域来源 | `["http://localhost:3000"]` |
| `LOG_LEVEL` | 日志级别 | `INFO` |

## 🐛 常见问题

### 1. Poetry 安装失败

```bash
# 使用官方安装脚本
curl -sSL https://install.python-poetry.org | python3 -

# 或使用 pipx
pipx install poetry
```

### 2. 依赖安装出错

```bash
# 清除缓存重新安装
poetry cache clear . --all
poetry install
```

### 3. 端口被占用

```bash
# 使用不同端口启动
uvicorn app.main:app --reload --port 8001
```

## 📚 相关文档

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [Pytest 文档](https://docs.pytest.org/)
- [Poetry 文档](https://python-poetry.org/docs/)

## 📄 License

MIT

## 👥 贡献者

LearningGitHub Team
