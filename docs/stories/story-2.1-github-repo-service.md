# Story 2.1: GitHub 仓库解析服务

> **Story ID:** STORY-2.1
> **Epic:** EPIC-MVP-001 - LearningGitHub MVP v0.1
> **Iteration:** 迭代 2 - 真实服务集成
> **Status:** Draft
> **Priority:** P0 - Critical
> **Estimate:** 2-3 天
> **Created:** 2025-11-20
> **Depends On:** STORY-1.1 (后端基础架构)

---

## User Story

**作为** 系统，
**我想要** 能够解析任意公开 GitHub 仓库并提取关键信息，
**以便** 为后续的教程生成提供准确的项目元数据和代码内容。

---

## Story 背景与上下文

### 项目上下文

本 Story 将 Story 1.1 的 Mock 实现替换为真实的 GitHub 集成。这是 MVP 的关键一步，从此开始处理真实的 GitHub 仓库数据。

### 技术上下文

- **GitHub API**: REST API v3
- **认证**: Personal Access Token (环境变量)
- **Git 操作**: GitPython 库
- **速率限制**: 5000 请求/小时（认证后）
- **仓库大小限制**: MVP 阶段限制 ≤ 50MB

### 迭代 2 目标

实现完整的 GitHub 仓库解析流程，包括 URL 解析、API 调用、仓库克隆、文件提取、目录树构建。

---

## 验收标准 (Acceptance Criteria)

### 功能性需求

**AC1: URL 解析**
- ✅ 支持标准 GitHub URL 格式:
  - `https://github.com/owner/repo`
  - `https://github.com/owner/repo.git`
  - `git@github.com:owner/repo.git`
- ✅ 提取 `owner` 和 `repo` 名称
- ✅ 无效 URL 抛出 `ValueError` 异常

**AC2: GitHub API 集成**
- ✅ 使用 PyGithub 库调用 GitHub REST API
- ✅ 支持 Personal Access Token 认证（从环境变量读取）
- ✅ 获取仓库基本信息:
  - 名称 (name)
  - 描述 (description)
  - 星标数 (stargazers_count)
  - 主要语言 (language)
  - 默认分支 (default_branch)
  - 仓库大小 (size, 单位 KB)
- ✅ 获取 README 内容（优先中文版，否则英文版）

**AC3: 仓库克隆**
- ✅ 使用 Git CLI 进行浅克隆 (`git clone --depth 1`)
- ✅ 克隆到临时目录 (`temp_repos/{owner}-{repo}-{timestamp}`)
- ✅ 克隆完成后返回本地路径
- ✅ 仓库大小超过限制时拒绝克隆并返回错误

**AC4: 目录树构建**
- ✅ 遍历本地仓库目录
- ✅ 识别核心目录（根据常见模式）:
  - 源代码目录: `src/`, `app/`, `lib/`, `packages/`
  - 配置目录: `config/`, `.github/`
  - 文档目录: `docs/`, `documentation/`
- ✅ 识别关键文件:
  - 入口文件: `main.py`, `index.js`, `app.py`, `server.ts`
  - 配置文件: `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`
  - 构建文件: `Dockerfile`, `docker-compose.yml`, `Makefile`
- ✅ 过滤无关文件:
  - `node_modules/`, `venv/`, `.git/`
  - 二进制文件、图片、视频
  - 大型文件 (> 1MB)

**AC5: 错误处理**
- ✅ 仓库不存在: 返回 404 错误和清晰提示
- ✅ 私有仓库无权限: 返回 403 错误和认证提示
- ✅ GitHub API 限流: 返回 429 错误和重试建议
- ✅ 仓库过大: 返回自定义错误和大小限制说明
- ✅ 网络错误: 返回 503 错误和网络问题提示

**AC6: 数据模型**
- ✅ 创建 `RepoInfo` Pydantic 模型:
  ```python
  class RepoInfo(BaseModel):
      owner: str
      name: str
      description: str
      stars: int
      language: str
      default_branch: str
      size_kb: int
      github_url: str
      local_path: str
      readme_content: Optional[str]
  ```
- ✅ 创建 `DirectoryTree` 模型:
  ```python
  class DirectoryTree(BaseModel):
      core_directories: List[DirectoryInfo]
      key_files: List[FileInfo]
  ```

### 质量需求

**AC7: 性能**
- ✅ URL 解析 < 100ms
- ✅ GitHub API 调用 < 3s (正常网络)
- ✅ 仓库克隆时间 < 30s (中小型仓库)
- ✅ 目录树构建 < 5s

**AC8: 代码质量**
- ✅ 所有函数有类型提示
- ✅ 所有公开函数有 Docstring
- ✅ 通过 Black + isort + mypy 检查

**AC9: 测试覆盖**
- ✅ URL 解析单元测试（至少 3 个用例）
- ✅ GitHub API 调用集成测试（使用 Mock）
- ✅ 目录树构建单元测试
- ✅ 错误处理测试（各种异常情况）

**AC10: 安全性**
- ✅ GitHub Token 不记录到日志
- ✅ 临时目录权限设置正确
- ✅ 克隆后清理临时文件

---

## 技术实现任务 (Tasks)

### Task 1: 创建服务模块结构
- [ ] 创建 `app/services/repo_service.py`
- [ ] 创建 `app/clients/github_client.py`
- [ ] 创建 `app/utils/git_utils.py`
- [ ] 创建 `app/models/repo.py`

### Task 2: 实现 URL 解析
- [ ] 在 `repo_service.py` 中实现 `parse_repo_url(url: str) -> Dict[str, str]`
- [ ] 支持多种 URL 格式
- [ ] 使用正则表达式提取 owner 和 repo
- [ ] 添加单元测试

### Task 3: 配置 GitHub API 客户端
- [ ] 安装 PyGithub: `poetry add PyGithub`
- [ ] 在 `config.py` 中添加 `GITHUB_TOKEN` 配置
- [ ] 在 `.env.example` 中添加 `GITHUB_TOKEN=` 说明
- [ ] 在 `github_client.py` 中初始化 `Github` 实例
- [ ] 实现认证检查函数

### Task 4: 实现 GitHub API 调用
- [ ] 在 `github_client.py` 中实现 `get_repo_info(owner: str, repo: str)`
- [ ] 调用 GitHub API 获取仓库元数据
- [ ] 处理 API 异常（404, 403, 403 rate limit）
- [ ] 返回 `RepoInfo` 对象
- [ ] 添加集成测试（Mock GitHub API）

### Task 5: 实现 README 获取
- [ ] 在 `github_client.py` 中实现 `get_readme(owner: str, repo: str)`
- [ ] 优先获取 `README.zh-CN.md` 或 `README.zh.md`
- [ ] 回退到 `README.md`
- [ ] 解码 Base64 内容
- [ ] 返回文本内容

### Task 6: 实现 Git 克隆工具
- [ ] 安装 GitPython: `poetry add GitPython`
- [ ] 在 `git_utils.py` 中实现 `clone_repo(repo_url: str, target_dir: str)`
- [ ] 使用浅克隆: `git clone --depth 1`
- [ ] 处理克隆失败情况
- [ ] 添加超时控制（60秒）

### Task 7: 实现临时目录管理
- [ ] 在 `git_utils.py` 中实现 `create_temp_dir(owner: str, repo: str)`
- [ ] 使用 `tempfile` 或自定义路径: `temp_repos/{owner}-{repo}-{timestamp}`
- [ ] 实现清理函数 `cleanup_temp_dir(path: str)`
- [ ] 注册进程退出时自动清理

### Task 8: 实现仓库大小检查
- [ ] 在 `repo_service.py` 中实现 `check_repo_size(size_kb: int)`
- [ ] 设置大小限制（从配置读取，默认 50MB = 51200KB）
- [ ] 超限抛出自定义异常 `RepoTooLargeError`

### Task 9: 实现目录树构建
- [ ] 在 `repo_service.py` 中实现 `build_directory_tree(local_path: str)`
- [ ] 遍历目录，识别核心目录
- [ ] 识别关键文件
- [ ] 过滤无关文件（node_modules, .git, 二进制）
- [ ] 返回 `DirectoryTree` 对象

### Task 10: 创建数据模型
- [ ] 在 `app/models/repo.py` 中定义:
  - `RepoInfo` (仓库基本信息)
  - `DirectoryInfo` (目录信息)
  - `FileInfo` (文件信息)
  - `DirectoryTree` (目录树)
- [ ] 所有字段有类型提示和验证

### Task 11: 实现完整的仓库解析流程
- [ ] 在 `repo_service.py` 中实现 `parse_repository(repo_url: str)`
- [ ] 整合所有步骤:
  1. 解析 URL
  2. 获取仓库信息
  3. 检查大小
  4. 克隆仓库
  5. 获取 README
  6. 构建目录树
- [ ] 返回完整的 `RepoInfo` + `DirectoryTree`
- [ ] 添加日志记录

### Task 12: 更新 API 路由
- [ ] 修改 `app/api/routes/tutorial.py`
- [ ] 将 Mock 实现替换为调用 `parse_repository()`
- [ ] 暂时保留其他字段的 Mock 数据（概览、步骤等）
- [ ] 测试 API 端点返回真实仓库数据

### Task 13: 实现错误处理
- [ ] 创建自定义异常:
  - `RepoNotFoundError`
  - `RepoAccessDeniedError`
  - `RepoTooLargeError`
  - `GitHubRateLimitError`
- [ ] 在 `error_handler.py` 中添加异常处理器
- [ ] 返回友好的错误信息和 HTTP 状态码

### Task 14: 编写测试
- [ ] 测试 URL 解析（各种格式）
- [ ] 测试 GitHub API 调用（Mock）
- [ ] 测试目录树构建
- [ ] 测试错误处理（各种异常）
- [ ] 测试完整流程（集成测试，使用真实小型仓库）

### Task 15: 文档更新
- [ ] 更新 `backend/README.md`
- [ ] 添加 GitHub Token 配置说明
- [ ] 添加测试真实仓库的示例

---

## 技术说明 (Dev Notes)

### 关键实现示例

**`app/services/repo_service.py`**

```python
import re
from typing import Dict, Tuple
from app.clients.github_client import GitHubClient
from app.utils.git_utils import clone_repo, create_temp_dir
from app.models.repo import RepoInfo, DirectoryTree
from app.core.exceptions import RepoTooLargeError
import structlog

logger = structlog.get_logger(__name__)

class RepoService:
    def __init__(self, github_client: GitHubClient):
        self.github_client = github_client
        self.max_size_kb = 51200  # 50MB

    def parse_repo_url(self, url: str) -> Dict[str, str]:
        """解析 GitHub 仓库 URL

        Args:
            url: GitHub 仓库 URL

        Returns:
            包含 owner 和 repo 的字典

        Raises:
            ValueError: URL 格式无效
        """
        # https://github.com/owner/repo
        # https://github.com/owner/repo.git
        # git@github.com:owner/repo.git

        patterns = [
            r'github\.com[:/]([^/]+)/([^/\.]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                owner, repo = match.groups()
                return {"owner": owner, "repo": repo}

        raise ValueError(f"无效的 GitHub URL: {url}")

    async def parse_repository(
        self,
        repo_url: str
    ) -> Tuple[RepoInfo, DirectoryTree]:
        """解析完整的 GitHub 仓库

        Args:
            repo_url: GitHub 仓库 URL

        Returns:
            (RepoInfo, DirectoryTree) 元组
        """
        logger.info("开始解析仓库", repo_url=repo_url)

        # 1. 解析 URL
        parsed = self.parse_repo_url(repo_url)
        owner, repo = parsed["owner"], parsed["repo"]

        # 2. 获取仓库信息
        repo_info = await self.github_client.get_repo_info(owner, repo)

        # 3. 检查大小
        if repo_info.size_kb > self.max_size_kb:
            raise RepoTooLargeError(
                f"仓库过大 ({repo_info.size_kb}KB)，"
                f"超过限制 ({self.max_size_kb}KB)"
            )

        # 4. 克隆仓库
        temp_dir = create_temp_dir(owner, repo)
        clone_repo(repo_info.github_url, temp_dir)
        repo_info.local_path = temp_dir

        # 5. 获取 README
        readme = await self.github_client.get_readme(owner, repo)
        repo_info.readme_content = readme

        # 6. 构建目录树
        dir_tree = self.build_directory_tree(temp_dir)

        logger.info(
            "仓库解析完成",
            owner=owner,
            repo=repo,
            size_kb=repo_info.size_kb
        )

        return repo_info, dir_tree

    def build_directory_tree(self, local_path: str) -> DirectoryTree:
        """构建目录树"""
        # 实现细节...
        pass
```

**`app/clients/github_client.py`**

```python
from github import Github, GithubException
from app.core.config import settings
from app.models.repo import RepoInfo
from app.core.exceptions import (
    RepoNotFoundError,
    RepoAccessDeniedError,
    GitHubRateLimitError
)

class GitHubClient:
    def __init__(self):
        self.client = Github(settings.GITHUB_TOKEN)

    async def get_repo_info(
        self,
        owner: str,
        repo: str
    ) -> RepoInfo:
        """获取仓库基本信息"""
        try:
            gh_repo = self.client.get_repo(f"{owner}/{repo}")

            return RepoInfo(
                owner=owner,
                name=repo,
                description=gh_repo.description or "",
                stars=gh_repo.stargazers_count,
                language=gh_repo.language or "Unknown",
                default_branch=gh_repo.default_branch,
                size_kb=gh_repo.size,
                github_url=gh_repo.clone_url,
                local_path="",  # 稍后填充
                readme_content=None
            )
        except GithubException as e:
            if e.status == 404:
                raise RepoNotFoundError(f"仓库不存在: {owner}/{repo}")
            elif e.status == 403:
                if 'rate limit' in str(e).lower():
                    raise GitHubRateLimitError("GitHub API 速率限制")
                raise RepoAccessDeniedError(f"无权访问仓库: {owner}/{repo}")
            raise
```

### 环境变量配置

**`.env.example`**

```bash
# GitHub
GITHUB_TOKEN=ghp_your_token_here

# Repo Limits
MAX_REPO_SIZE_KB=51200
```

---

## 风险与依赖

### 风险

**R1: GitHub Token 配置错误**
- **影响**: 无法访问 GitHub API
- **缓解**: 提供清晰的配置文档，启动时验证 Token

**R2: GitHub API 速率限制**
- **影响**: 频繁测试时触发限流
- **缓解**:
  - 使用测试专用 Token
  - 实现请求缓存
  - 提供清晰的限流错误提示

**R3: 大型仓库处理**
- **影响**: 克隆和处理时间过长
- **缓解**:
  - 设置合理的大小限制
  - 使用浅克隆减少数据量
  - 后台异步处理（后续版本）

### 依赖

- ✅ Story 1.1 完成（后端基础架构）
- ✅ GitHub Personal Access Token（需用户提供）

### 后续 Story 依赖

- Story 2.2 (内容处理) 依赖本 Story 提供的仓库文件
- Story 2.3 (RAG 生成) 依赖本 Story 提供的 README 和目录树

---

## Definition of Done (完成定义)

- [x] 所有任务复选框已勾选 ✅
- [x] URL 解析支持多种格式
- [x] GitHub API 集成成功（获取元数据 + README）
- [x] 仓库克隆功能正常
- [x] 目录树构建准确
- [x] 所有错误情况有友好提示
- [x] API 路由返回真实仓库数据（部分字段仍为 Mock）
- [x] 所有测试通过（单元 + 集成）
- [x] 代码质量检查通过
- [x] 文档更新完整
- [x] 使用真实小型仓库验证成功
- [x] 代码已提交到 Git

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
- [技术栈](../architecture/tech-stack.md)
- [编码标准](../architecture/coding-standards.md)
