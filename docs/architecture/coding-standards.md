# LearningGitHub 编码标准与最佳实践

> 文档版本: v0.1
> 最后更新: 2025-11-20
> 状态: Frozen (MVP)

---

## 概述

本文档定义 LearningGitHub 项目的编码标准、最佳实践和代码质量要求。所有代码必须遵循这些标准，确保代码的可读性、可维护性和一致性。

---

## 通用原则

### 代码质量原则

1. **可读性优先**: 代码是写给人看的，其次才是给机器执行
2. **保持简单**: KISS (Keep It Simple, Stupid)
3. **不要重复**: DRY (Don't Repeat Yourself)
4. **单一职责**: 每个函数/类只做一件事
5. **开放封闭**: 对扩展开放，对修改封闭
6. **显式优于隐式**: 明确的代码优于简洁但晦涩的代码
7. **优化可延迟**: 先保证正确性，再考虑性能优化

### 代码审查检查点

- ✅ 代码是否清晰易懂?
- ✅ 是否有充分的注释和文档?
- ✅ 是否有单元测试覆盖?
- ✅ 是否遵循项目命名约定?
- ✅ 是否处理了错误情况?
- ✅ 是否有安全漏洞?

---

## Python (后端) 编码标准

### 代码风格

**遵循 PEP 8 + Black 格式化**

```python
# 使用 Black 自动格式化
# 最大行长: 88
# 字符串引号: 双引号优先
```

#### 导入顺序 (isort)

```python
# 1. 标准库
import os
import sys
from typing import List, Optional

# 2. 第三方库
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 3. 本地模块
from app.core.config import settings
from app.services.repo_service import RepoService
```

#### 命名约定

```python
# 变量和函数: snake_case
user_name = "Alice"
def get_user_data():
    pass

# 类名: PascalCase
class UserService:
    pass

# 常量: UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3
API_BASE_URL = "https://api.github.com"

# 私有变量/方法: 前缀下划线
class MyClass:
    def __init__(self):
        self._private_var = 10

    def _private_method(self):
        pass
```

### 类型提示 (Type Hints)

**强制使用类型提示**

```python
from typing import List, Optional, Dict, Any

# 函数参数和返回值
def parse_repo_url(url: str) -> Dict[str, str]:
    """解析仓库 URL

    Args:
        url: GitHub 仓库 URL

    Returns:
        包含 owner 和 repo 的字典

    Raises:
        ValueError: URL 格式无效时
    """
    # 实现...
    return {"owner": "user", "repo": "project"}

# 可选类型
def get_readme(repo_id: str) -> Optional[str]:
    # 可能返回 None
    return None

# 列表和字典
def get_file_list() -> List[str]:
    return ["file1.py", "file2.py"]

def get_metadata() -> Dict[str, Any]:
    return {"name": "repo", "stars": 100}
```

### Docstrings (文档字符串)

**使用 Google 风格 Docstring**

```python
def generate_tutorial(
    repo_url: str,
    language: str = "zh-CN"
) -> Dict[str, Any]:
    """生成仓库学习教程

    基于给定的 GitHub 仓库 URL，生成包含项目概览、运行步骤
    和学习路径的完整教程。

    Args:
        repo_url: GitHub 仓库完整 URL
        language: 输出语言，默认为简体中文

    Returns:
        包含以下键的字典:
            - overview: 项目概览
            - prerequisites: 运行前准备
            - steps: 运行步骤列表
            - modules: 学习模块列表

    Raises:
        ValueError: repo_url 格式无效
        HTTPException: GitHub API 调用失败

    Example:
        >>> tutorial = generate_tutorial(
        ...     "https://github.com/user/repo"
        ... )
        >>> print(tutorial["overview"])
    """
    # 实现...
    pass
```

### 错误处理

**明确的异常处理**

```python
# ✅ 好的做法
from fastapi import HTTPException
from app.core.exceptions import RepoNotFoundError

def get_repo_info(repo_url: str) -> dict:
    try:
        # GitHub API 调用
        response = github_client.get(repo_url)
        response.raise_for_status()
        return response.json()
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            raise RepoNotFoundError(f"仓库不存在: {repo_url}")
        elif e.response.status_code == 403:
            raise HTTPException(
                status_code=429,
                detail="GitHub API 速率限制，请稍后重试"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"GitHub API 调用失败: {str(e)}"
            )
    except Exception as e:
        # 记录未预期的错误
        logger.error(f"获取仓库信息失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="内部服务器错误"
        )

# ❌ 避免的做法
def bad_error_handling():
    try:
        # 某些操作
        pass
    except:  # 裸 except
        pass  # 吞掉异常
```

### 日志记录

**结构化日志**

```python
import structlog

logger = structlog.get_logger(__name__)

# 使用结构化日志
logger.info(
    "仓库解析成功",
    repo_url=repo_url,
    owner=owner,
    repo=repo,
    duration_ms=duration
)

logger.error(
    "仓库解析失败",
    repo_url=repo_url,
    error=str(e),
    exc_info=True
)

# 不同日志级别
logger.debug("调试信息")      # 开发调试
logger.info("常规信息")       # 重要事件
logger.warning("警告信息")    # 潜在问题
logger.error("错误信息")      # 错误但可恢复
logger.critical("严重错误")   # 系统故障
```

### 测试标准

**Pytest 单元测试**

```python
# tests/unit/services/test_repo_service.py
import pytest
from app.services.repo_service import RepoService
from app.core.exceptions import RepoNotFoundError

class TestRepoService:
    """RepoService 单元测试"""

    @pytest.fixture
    def repo_service(self):
        """提供 RepoService 实例"""
        return RepoService()

    def test_parse_valid_url(self, repo_service):
        """测试解析有效的 GitHub URL"""
        result = repo_service.parse_repo_url(
            "https://github.com/user/repo"
        )
        assert result["owner"] == "user"
        assert result["repo"] == "repo"

    def test_parse_invalid_url_raises_error(self, repo_service):
        """测试解析无效 URL 抛出异常"""
        with pytest.raises(ValueError):
            repo_service.parse_repo_url("not-a-url")

    @pytest.mark.asyncio
    async def test_fetch_repo_info(self, repo_service, mocker):
        """测试获取仓库信息 (Mock GitHub API)"""
        # Mock GitHub API 响应
        mock_response = {
            "name": "test-repo",
            "description": "Test repository",
            "stargazers_count": 100
        }
        mocker.patch.object(
            repo_service.github_client,
            "get_repo",
            return_value=mock_response
        )

        result = await repo_service.fetch_repo_info("user/repo")
        assert result["name"] == "test-repo"
        assert result["stars"] == 100
```

**测试覆盖率要求**
- 核心服务层: ≥ 80%
- API 路由: ≥ 70%
- 工具函数: ≥ 90%

---

## TypeScript/React (前端) 编码标准

### 代码风格

**遵循 ESLint + Prettier**

```typescript
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

#### 命名约定

```typescript
// 变量和函数: camelCase
const userName = "Alice";
function getUserData() {}

// 类和组件: PascalCase
class UserService {}
function UserProfile() {}

// 常量: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "https://api.example.com";

// 类型和接口: PascalCase
interface User {
  id: string;
  name: string;
}

type TutorialData = {
  overview: string;
  steps: Step[];
};

// 枚举: PascalCase
enum Status {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}
```

### TypeScript 类型定义

**强类型，避免 any**

```typescript
// ✅ 好的做法
interface TutorialResponse {
  repo: {
    owner: string;
    name: string;
    stars: number;
    language: string;
  };
  overview: string;
  prerequisites: string[];
  modules: Module[];
  steps: Step[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  stepIds: string[];
}

// API 调用
async function fetchTutorial(
  repoUrl: string
): Promise<TutorialResponse> {
  const response = await apiClient.get<TutorialResponse>(
    `/api/tutorial?repoUrl=${encodeURIComponent(repoUrl)}`
  );
  return response.data;
}

// ❌ 避免的做法
async function badFetch(url: any): Promise<any> {
  const response = await fetch(url);
  return response.json();
}
```

### React 组件标准

**函数组件 + TypeScript**

```typescript
// ✅ 好的做法: 明确的 Props 类型
interface StepListProps {
  steps: Step[];
  currentStepId?: string;
  onStepComplete: (stepId: string) => void;
}

export function StepList({
  steps,
  currentStepId,
  onStepComplete,
}: StepListProps) {
  return (
    <div className="step-list">
      {steps.map((step) => (
        <StepItem
          key={step.id}
          step={step}
          isCurrent={step.id === currentStepId}
          onComplete={() => onStepComplete(step.id)}
        />
      ))}
    </div>
  );
}

// ❌ 避免的做法: 隐式 any
export function BadStepList(props: any) {
  // ...
}
```

**使用自定义 Hooks**

```typescript
// lib/hooks/useTutorial.ts
import { useState, useEffect } from "react";
import { fetchTutorial } from "@/lib/api/tutorial";
import type { TutorialResponse } from "@/types/tutorial";

interface UseTutorialReturn {
  tutorial: TutorialResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTutorial(
  repoUrl: string
): UseTutorialReturn {
  const [tutorial, setTutorial] =
    useState<TutorialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchTutorial(repoUrl);
      setTutorial(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [repoUrl]);

  return { tutorial, loading, error, refetch: fetchData };
}

// 使用示例
function TutorialPage({ repoUrl }: { repoUrl: string }) {
  const { tutorial, loading, error } = useTutorial(repoUrl);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!tutorial) return null;

  return <TutorialContent tutorial={tutorial} />;
}
```

### 错误处理

**前端错误边界**

```typescript
// components/common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // 可选: 发送到错误追踪服务
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>出错了</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 测试标准

**React Testing Library**

```typescript
// tests/unit/components/StepList.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { StepList } from "@/components/tutorial/StepList";
import type { Step } from "@/types/tutorial";

describe("StepList", () => {
  const mockSteps: Step[] = [
    { id: "1", title: "步骤 1", description: "描述 1" },
    { id: "2", title: "步骤 2", description: "描述 2" },
  ];

  const mockOnComplete = jest.fn();

  it("应该渲染所有步骤", () => {
    render(
      <StepList steps={mockSteps} onStepComplete={mockOnComplete} />
    );

    expect(screen.getByText("步骤 1")).toBeInTheDocument();
    expect(screen.getByText("步骤 2")).toBeInTheDocument();
  });

  it("点击完成按钮应触发回调", () => {
    render(
      <StepList steps={mockSteps} onStepComplete={mockOnComplete} />
    );

    const completeButton = screen.getAllByRole("button", {
      name: /完成/i,
    })[0];
    fireEvent.click(completeButton);

    expect(mockOnComplete).toHaveBeenCalledWith("1");
  });
});
```

---

## API 设计标准

### RESTful API 规范

**URL 设计**

```
# ✅ 好的做法
GET    /api/tutorial?repoUrl={url}           # 获取教程
POST   /api/tutorial/qa                      # 问答
GET    /api/health                           # 健康检查

# ❌ 避免的做法
GET    /api/getTutorial                      # 动词形式
POST   /api/tutorial/question/ask            # 冗余层级
```

**HTTP 状态码使用**

```
200 OK              - 成功返回数据
201 Created         - 成功创建资源
400 Bad Request     - 请求参数错误
401 Unauthorized    - 未认证
403 Forbidden       - 无权限
404 Not Found       - 资源不存在
429 Too Many Requests - 速率限制
500 Internal Server Error - 服务器错误
503 Service Unavailable   - 服务不可用
```

**统一响应格式**

```typescript
// 成功响应
{
  "ok": true,
  "data": {
    "tutorial": { /* ... */ }
  }
}

// 错误响应
{
  "ok": false,
  "errorCode": "REPO_NOT_FOUND",
  "message": "仓库不存在或无法访问",
  "details": {
    "repoUrl": "https://github.com/user/repo"
  }
}
```

---

## 安全编码标准

### 输入验证

```python
# ✅ 验证所有用户输入
from pydantic import BaseModel, HttpUrl, validator

class TutorialRequest(BaseModel):
    repo_url: HttpUrl  # 自动验证 URL 格式
    language: str = "zh-CN"

    @validator("language")
    def validate_language(cls, v):
        allowed = ["zh-CN", "en-US"]
        if v not in allowed:
            raise ValueError(f"不支持的语言: {v}")
        return v
```

### 敏感信息处理

```python
# ✅ 不记录敏感信息
logger.info(
    "GitHub API 调用",
    repo_url=repo_url,
    # token="ghp_xxx"  # ❌ 不要记录 token
)

# ✅ 环境变量存储密钥
import os
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ❌ 硬编码密钥
# API_KEY = "sk-1234567890"
```

### SQL 注入防护 (如使用数据库)

```python
# ✅ 使用参数化查询
from sqlalchemy import text

query = text("SELECT * FROM repos WHERE owner = :owner")
result = session.execute(query, {"owner": owner})

# ❌ 字符串拼接
# query = f"SELECT * FROM repos WHERE owner = '{owner}'"  # 危险!
```

---

## 性能优化标准

### 后端性能

**异步编程**

```python
# ✅ 使用 async/await
async def fetch_multiple_repos(repo_urls: List[str]) -> List[dict]:
    tasks = [fetch_repo_info(url) for url in repo_urls]
    results = await asyncio.gather(*tasks)
    return results

# ❌ 同步串行
def bad_fetch_multiple(repo_urls):
    results = []
    for url in repo_urls:
        result = fetch_repo_info(url)  # 阻塞
        results.append(result)
    return results
```

**缓存策略**

```python
from functools import lru_cache

# 内存缓存
@lru_cache(maxsize=128)
def get_language_rules(language: str) -> dict:
    # 加载语言规则
    return rules

# Redis 缓存
async def get_tutorial_cached(repo_url: str) -> dict:
    cache_key = f"tutorial:{repo_url}"

    # 尝试从缓存获取
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # 缓存未命中,生成教程
    tutorial = await generate_tutorial(repo_url)

    # 写入缓存 (1小时过期)
    await redis.setex(cache_key, 3600, json.dumps(tutorial))

    return tutorial
```

### 前端性能

**组件懒加载**

```typescript
// 动态导入
import dynamic from "next/dynamic";

const QnAPanel = dynamic(
  () => import("@/components/tutorial/QnAPanel"),
  { loading: () => <LoadingSpinner /> }
);
```

**React.memo 优化**

```typescript
import { memo } from "react";

interface StepItemProps {
  step: Step;
  onComplete: () => void;
}

export const StepItem = memo(function StepItem({
  step,
  onComplete,
}: StepItemProps) {
  return <div>{/* ... */}</div>;
});
```

---

## Git 提交规范

### Conventional Commits

```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式 (不影响功能)
refactor: 重构
test:     测试相关
chore:    构建/工具链

# 示例
feat(backend): 实现仓库解析服务
fix(frontend): 修复教程页面加载错误
docs(api): 更新 API 文档
refactor(services): 重构 RAG 服务代码结构
test(repo): 添加仓库解析单元测试
```

### 提交最佳实践

```bash
# ✅ 好的提交
git commit -m "feat(tutorial): 添加模块化学习路径功能

- 实现学习模块数据结构
- 添加模块生成逻辑
- 更新教程 API 响应格式

Closes #42"

# ❌ 避免的提交
git commit -m "update"
git commit -m "fix bug"
git commit -m "改了一些东西"
```

---

## 代码审查检查清单

### 提交代码前自查

- [ ] 代码通过所有 lint 检查 (Black, ESLint)
- [ ] 所有单元测试通过
- [ ] 新功能有对应的测试
- [ ] 添加了必要的注释和文档字符串
- [ ] 敏感信息已移除
- [ ] 遵循命名约定
- [ ] 错误处理完善
- [ ] 日志记录充分
- [ ] 性能影响评估
- [ ] 提交信息符合规范

### 代码审查要点

**功能性**
- 代码是否实现了需求?
- 边界情况是否处理?
- 错误处理是否完善?

**可维护性**
- 代码是否清晰易懂?
- 是否有足够的注释?
- 函数/类职责是否单一?

**测试性**
- 是否有单元测试?
- 测试覆盖率是否足够?
- 测试是否有意义?

**安全性**
- 是否有安全漏洞?
- 输入是否验证?
- 敏感信息是否暴露?

**性能**
- 是否有性能问题?
- 是否有不必要的重复计算?
- 数据库查询是否优化?

---

## 总结

**核心要点:**
1. 类型提示和类型安全
2. 完善的错误处理和日志
3. 充分的单元测试覆盖
4. 清晰的命名和注释
5. 统一的代码风格
6. 安全编码实践
7. 性能优化意识
8. 规范的 Git 提交

遵循这些编码标准，确保代码库的高质量和长期可维护性。
