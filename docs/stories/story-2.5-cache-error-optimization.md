# Story 2.5: 缓存与错误处理优化

## 📋 Story 元信息

- **Story ID**: STORY-2.5
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 2 - 真实服务集成
- **状态**: Draft
- **优先级**: Medium
- **预估时间**: 1-2 天
- **负责人**: Dev Agent
- **依赖**: STORY-2.1, 2.2, 2.3, 2.4 (所有迭代 2 服务)

---

## 📖 User Story

**As a** 系统开发者
**I want** 实现健壮的缓存机制和错误处理策略
**So that** 系统能够高效响应、降低成本，并在异常情况下优雅降级

---

## 🎯 背景与上下文

### 项目上下文
在迭代 2 完成所有核心服务后，需要进行横向优化：
1. **缓存优化**: 减少 OpenAI API 调用频率，降低成本和延迟
2. **错误处理**: 统一异常处理机制，提供友好的错误响应
3. **可观测性**: 完善日志、监控和调试能力
4. **性能监控**: 添加关键路径的性能指标

### 技术上下文
- **缓存层级**:
  - L1: 内存缓存（应用内，快速但不持久）
  - L2: Redis（可选，持久化跨实例共享）
  - L3: 文件系统缓存（备选方案）
- **错误分类**:
  - 4xx: 客户端错误（参数错误、资源不存在）
  - 5xx: 服务端错误（第三方 API 失败、内部异常）
- **监控工具**: structlog（结构化日志）+ 未来可集成 Sentry

### 迭代目标
完善系统的生产就绪度，确保稳定性和可维护性。

---

## ✅ 验收标准

### 功能性需求

1. **AC-2.5.1**: 实现统一的缓存抽象层
   - 支持多种缓存后端（Memory, Redis, FileSystem）
   - 提供统一接口: `get()`, `set()`, `delete()`, `exists()`
   - 支持 TTL（Time To Live）配置
   - 支持缓存键前缀和命名空间

2. **AC-2.5.2**: 教程生成结果缓存
   - 缓存键: `tutorial:{owner}:{repo}:{commit_sha}`
   - TTL: 24 小时（可配置）
   - 强制刷新参数: `force=true`
   - 缓存命中率监控

3. **AC-2.5.3**: 向量检索结果缓存
   - 缓存热门查询结果
   - 缓存键: `search:{repo}:{query_hash}`
   - TTL: 1 小时
   - LRU 淘汰策略（如果使用内存缓存）

4. **AC-2.5.4**: GitHub API 响应缓存
   - 缓存仓库元数据（stars, description 等）
   - TTL: 6 小时
   - 避免频繁调用 GitHub API

5. **AC-2.5.5**: 统一错误响应格式
   ```json
   {
     "ok": false,
     "error": {
       "code": "REPO_NOT_FOUND",
       "message": "Repository not found or not vectorized",
       "details": { "repo": "owner/repo" },
       "timestamp": "2024-01-01T00:00:00Z"
     }
   }
   ```

6. **AC-2.5.6**: 错误分类和处理
   - `RepoNotFoundError` → 404
   - `RepoNotVectorizedError` → 404
   - `OpenAIAPIError` → 503 (Service Unavailable)
   - `RateLimitError` → 429 (Too Many Requests)
   - `ValidationError` → 400 (Bad Request)
   - `InternalError` → 500

7. **AC-2.5.7**: 实现全局异常处理器
   - FastAPI 异常处理器捕获所有未处理异常
   - 记录错误日志（包含 request_id、stack trace）
   - 避免敏感信息泄露（如 API keys）

8. **AC-2.5.8**: 添加请求追踪
   - 每个请求生成唯一 `request_id`
   - 在日志和响应头中包含 `X-Request-ID`
   - 方便调试和问题排查

### 质量需求

9. **AC-2.5.9**: 缓存性能提升
   - 缓存命中时响应时间 ≤ 100ms
   - 内存缓存容量限制（如 1000 条记录）
   - 缓存命中率 ≥ 60%（稳定运行后）

10. **AC-2.5.10**: 日志结构化和完整性
    - 所有关键操作记录日志
    - 日志包含: timestamp, level, request_id, service, message, context
    - 敏感信息脱敏（如 repo 内容截断）

11. **AC-2.5.11**: 单元测试覆盖率 ≥ 80%
    - 测试缓存 get/set/delete 逻辑
    - 测试错误处理器
    - 测试缓存过期和淘汰

12. **AC-2.5.12**: 配置化
    - 缓存后端可通过环境变量配置
    - TTL 可配置
    - 缓存开关可配置（用于调试）

---

## 🔧 技术实现任务

### Task 1: 设计缓存抽象层
**预估**: 1.5 小时

创建 `backend/app/core/cache.py`:

```python
from abc import ABC, abstractmethod
from typing import Optional, Any
import json
from datetime import timedelta
import structlog

logger = structlog.get_logger()

class CacheBackend(ABC):
    """缓存后端抽象基类"""

    @abstractmethod
    async def get(self, key: str) -> Optional[str]:
        """获取缓存值"""
        pass

    @abstractmethod
    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None
    ) -> None:
        """设置缓存值"""
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        """删除缓存"""
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """检查键是否存在"""
        pass

class MemoryCache(CacheBackend):
    """内存缓存实现"""

    def __init__(self, max_size: int = 1000):
        self.cache: dict = {}
        self.max_size = max_size

    async def get(self, key: str) -> Optional[str]:
        import time
        entry = self.cache.get(key)

        if entry is None:
            return None

        # 检查过期
        if entry["expires_at"] and time.time() > entry["expires_at"]:
            await self.delete(key)
            return None

        logger.debug("cache_hit", key=key)
        return entry["value"]

    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None
    ) -> None:
        import time

        # LRU 淘汰
        if len(self.cache) >= self.max_size:
            # 删除最早的条目
            oldest_key = next(iter(self.cache))
            await self.delete(oldest_key)

        expires_at = None
        if ttl:
            expires_at = time.time() + ttl

        self.cache[key] = {
            "value": value,
            "expires_at": expires_at
        }

        logger.debug("cache_set", key=key, ttl=ttl)

    async def delete(self, key: str) -> None:
        self.cache.pop(key, None)
        logger.debug("cache_delete", key=key)

    async def exists(self, key: str) -> bool:
        value = await self.get(key)
        return value is not None

class RedisCache(CacheBackend):
    """Redis 缓存实现（可选）"""

    def __init__(self, redis_url: str):
        import redis.asyncio as redis
        self.redis = redis.from_url(redis_url)

    async def get(self, key: str) -> Optional[str]:
        value = await self.redis.get(key)
        if value:
            logger.debug("cache_hit", key=key)
            return value.decode("utf-8")
        return None

    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None
    ) -> None:
        if ttl:
            await self.redis.setex(key, ttl, value)
        else:
            await self.redis.set(key, value)

        logger.debug("cache_set", key=key, ttl=ttl)

    async def delete(self, key: str) -> None:
        await self.redis.delete(key)

    async def exists(self, key: str) -> bool:
        return await self.redis.exists(key) > 0

class CacheService:
    """缓存服务（高级封装）"""

    def __init__(self, backend: CacheBackend, prefix: str = ""):
        self.backend = backend
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        """生成完整缓存键"""
        return f"{self.prefix}:{key}" if self.prefix else key

    async def get_json(self, key: str) -> Optional[Any]:
        """获取 JSON 缓存"""
        value = await self.backend.get(self._make_key(key))
        if value:
            return json.loads(value)
        return None

    async def set_json(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        """设置 JSON 缓存"""
        await self.backend.set(
            self._make_key(key),
            json.dumps(value),
            ttl
        )

    async def get(self, key: str) -> Optional[str]:
        """获取字符串缓存"""
        return await self.backend.get(self._make_key(key))

    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None
    ) -> None:
        """设置字符串缓存"""
        await self.backend.set(self._make_key(key), value, ttl)

    async def delete(self, key: str) -> None:
        """删除缓存"""
        await self.backend.delete(self._make_key(key))

    async def exists(self, key: str) -> bool:
        """检查键是否存在"""
        return await self.backend.exists(self._make_key(key))
```

---

### Task 2: 配置缓存服务
**预估**: 30 分钟

在 `backend/app/core/config.py` 中添加缓存配置：

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... 其他配置 ...

    # 缓存配置
    CACHE_BACKEND: str = "memory"  # memory | redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_TUTORIAL: int = 86400  # 24 hours
    CACHE_TTL_SEARCH: int = 3600     # 1 hour
    CACHE_TTL_GITHUB: int = 21600    # 6 hours
    CACHE_MAX_SIZE: int = 1000       # 内存缓存最大条目数

    class Config:
        env_file = ".env"

settings = Settings()
```

创建缓存工厂 `backend/app/core/cache_factory.py`:

```python
from app.core.cache import CacheBackend, MemoryCache, RedisCache, CacheService
from app.core.config import settings

def create_cache_backend() -> CacheBackend:
    """创建缓存后端"""
    if settings.CACHE_BACKEND == "redis":
        return RedisCache(settings.REDIS_URL)
    else:
        return MemoryCache(max_size=settings.CACHE_MAX_SIZE)

# 全局缓存实例
cache_backend = create_cache_backend()

tutorial_cache = CacheService(cache_backend, prefix="tutorial")
search_cache = CacheService(cache_backend, prefix="search")
github_cache = CacheService(cache_backend, prefix="github")
```

---

### Task 3: 集成缓存到服务
**预估**: 2 小时

#### 3.1 教程生成服务缓存

修改 `backend/app/services/tutorial_generation.py`:

```python
from app.core.cache_factory import tutorial_cache
from app.core.config import settings

class TutorialGenerationService:
    async def generate_tutorial(
        self,
        task_id: str,
        repo_url: str,
        force: bool = False
    ) -> None:
        owner, repo_name = self.github_service.parse_repo_url(repo_url)
        cache_key = f"{owner}:{repo_name}"

        # 检查缓存
        if not force:
            cached = await tutorial_cache.get_json(cache_key)
            if cached:
                logger.info("tutorial_cache_hit", repo=f"{owner}/{repo_name}")
                self.tasks[task_id] = TutorialGenerationStatus(
                    task_id=task_id,
                    status="completed",
                    tutorial=TutorialData(**cached)
                )
                return

        # ... 生成教程逻辑 ...

        # 缓存结果
        await tutorial_cache.set_json(
            cache_key,
            tutorial_data.dict(),
            ttl=settings.CACHE_TTL_TUTORIAL
        )
```

#### 3.2 向量检索缓存

修改 `backend/app/services/vector_store.py`:

```python
from app.core.cache_factory import search_cache
from app.core.config import settings
import hashlib

class VectorStore:
    async def search_similar_chunks(
        self,
        repo_owner: str,
        repo_name: str,
        query: str,
        top_k: int = 20,
        min_similarity: float = 0.7,
        use_cache: bool = True
    ) -> List[Dict]:
        # 生成缓存键
        query_hash = hashlib.md5(query.encode()).hexdigest()[:16]
        cache_key = f"{repo_owner}:{repo_name}:{query_hash}"

        # 检查缓存
        if use_cache:
            cached = await search_cache.get_json(cache_key)
            if cached:
                logger.info("search_cache_hit", query_hash=query_hash)
                return cached

        # ... 执行检索 ...

        # 缓存结果
        if use_cache:
            await search_cache.set_json(
                cache_key,
                filtered_results,
                ttl=settings.CACHE_TTL_SEARCH
            )

        return filtered_results
```

#### 3.3 GitHub API 缓存

修改 `backend/app/services/github_repo.py`:

```python
from app.core.cache_factory import github_cache
from app.core.config import settings

class GitHubRepoService:
    async def get_repo_info(
        self,
        owner: str,
        repo: str,
        use_cache: bool = True
    ) -> dict:
        cache_key = f"{owner}:{repo}:info"

        # 检查缓存
        if use_cache:
            cached = await github_cache.get_json(cache_key)
            if cached:
                logger.info("github_cache_hit", repo=f"{owner}/{repo}")
                return cached

        # ... 调用 GitHub API ...

        # 缓存结果
        if use_cache:
            await github_cache.set_json(
                cache_key,
                repo_info,
                ttl=settings.CACHE_TTL_GITHUB
            )

        return repo_info
```

---

### Task 4: 实现统一错误处理
**预估**: 1.5 小时

创建 `backend/app/core/exceptions.py`:

```python
from datetime import datetime

class AppException(Exception):
    """应用基础异常"""

    def __init__(
        self,
        code: str,
        message: str,
        details: dict = None,
        status_code: int = 500
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code
        super().__init__(message)

    def to_dict(self):
        return {
            "ok": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }

class RepoNotFoundError(AppException):
    def __init__(self, repo: str):
        super().__init__(
            code="REPO_NOT_FOUND",
            message=f"Repository not found: {repo}",
            details={"repo": repo},
            status_code=404
        )

class RepoNotVectorizedError(AppException):
    def __init__(self, repo: str):
        super().__init__(
            code="REPO_NOT_VECTORIZED",
            message=f"Repository not vectorized: {repo}",
            details={"repo": repo},
            status_code=404
        )

class OpenAIAPIError(AppException):
    def __init__(self, original_error: str):
        super().__init__(
            code="OPENAI_API_ERROR",
            message="OpenAI API request failed",
            details={"error": original_error},
            status_code=503
        )

class RateLimitError(AppException):
    def __init__(self, service: str):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=f"Rate limit exceeded for {service}",
            details={"service": service},
            status_code=429
        )
```

创建全局异常处理器 `backend/app/core/exception_handlers.py`:

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException
import structlog

logger = structlog.get_logger()

async def app_exception_handler(request: Request, exc: AppException):
    """处理应用自定义异常"""
    logger.error(
        "app_exception",
        code=exc.code,
        message=exc.message,
        details=exc.details,
        path=request.url.path,
        request_id=request.state.request_id
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """处理未捕获的通用异常"""
    logger.error(
        "unhandled_exception",
        error=str(exc),
        path=request.url.path,
        request_id=request.state.request_id,
        exc_info=True
    )

    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
    )
```

在 `backend/app/main.py` 中注册:

```python
from app.core.exception_handlers import (
    app_exception_handler,
    generic_exception_handler
)
from app.core.exceptions import AppException

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
```

---

### Task 5: 添加请求追踪中间件
**预估**: 1 小时

创建 `backend/app/middleware/request_id.py`:

```python
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger()

class RequestIDMiddleware(BaseHTTPMiddleware):
    """请求 ID 中间件"""

    async def dispatch(self, request: Request, call_next):
        # 生成或获取 request_id
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        # 绑定到日志上下文
        structlog.contextvars.bind_contextvars(request_id=request_id)

        # 记录请求
        logger.info(
            "request_start",
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else None
        )

        # 处理请求
        response = await call_next(request)

        # 添加响应头
        response.headers["X-Request-ID"] = request_id

        # 记录响应
        logger.info(
            "request_end",
            status_code=response.status_code
        )

        # 清除日志上下文
        structlog.contextvars.clear_contextvars()

        return response
```

在 `backend/app/main.py` 中注册:

```python
from app.middleware.request_id import RequestIDMiddleware

app.add_middleware(RequestIDMiddleware)
```

---

### Task 6: 单元测试
**预估**: 2 小时

创建测试文件：
- `backend/tests/test_cache.py`: 测试缓存逻辑
- `backend/tests/test_exceptions.py`: 测试异常处理

示例测试 (`backend/tests/test_cache.py`):

```python
import pytest
from app.core.cache import MemoryCache, CacheService
import asyncio

@pytest.mark.asyncio
async def test_memory_cache_get_set():
    """测试内存缓存 get/set"""
    cache = MemoryCache()

    await cache.set("key1", "value1")
    value = await cache.get("key1")

    assert value == "value1"

@pytest.mark.asyncio
async def test_memory_cache_expiration():
    """测试缓存过期"""
    cache = MemoryCache()

    await cache.set("key1", "value1", ttl=1)  # 1 second
    await asyncio.sleep(1.1)

    value = await cache.get("key1")
    assert value is None

@pytest.mark.asyncio
async def test_cache_service_json():
    """测试 JSON 缓存"""
    backend = MemoryCache()
    service = CacheService(backend, prefix="test")

    data = {"foo": "bar", "num": 123}
    await service.set_json("key1", data)

    result = await service.get_json("key1")
    assert result == data
```

运行测试:
```bash
cd backend
poetry run pytest tests/test_cache.py -v
```

---

### Task 7: 文档更新
**预估**: 30 分钟

更新 `backend/README.md`:

```markdown
## 缓存配置

### 环境变量

\`\`\`env
CACHE_BACKEND=memory        # memory | redis
REDIS_URL=redis://localhost:6379
CACHE_TTL_TUTORIAL=86400    # 24 hours
CACHE_TTL_SEARCH=3600       # 1 hour
CACHE_TTL_GITHUB=21600      # 6 hours
\`\`\`

### 缓存策略

- **教程缓存**: 24 小时，键格式 `tutorial:{owner}:{repo}`
- **搜索缓存**: 1 小时，键格式 `search:{repo}:{query_hash}`
- **GitHub 缓存**: 6 小时，键格式 `github:{owner}:{repo}:info`

### 错误响应格式

所有错误响应遵循统一格式：

\`\`\`json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

### 请求追踪

每个请求包含 `X-Request-ID` 响应头，用于日志追踪和调试。
```

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 缓存一致性问题 | 中 | 中 | 使用合理的 TTL，提供强制刷新选项 |
| 内存缓存溢出 | 低 | 中 | LRU 淘汰策略，设置最大容量 |
| Redis 依赖引入复杂性 | 低 | 低 | MVP 使用内存缓存，Redis 为可选 |

### 依赖关系

**前置依赖**:
- STORY-2.1, 2.2, 2.3, 2.4: 所有迭代 2 服务

**后续依赖**:
- 无

---

## ✅ Definition of Done

- [ ] 所有 12 个验收标准通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 缓存命中率监控日志完善
- [ ] API 文档更新（错误响应格式）
- [ ] 配置文档更新
- [ ] Code Review 通过
- [ ] 所有服务集成缓存机制
- [ ] 全局异常处理器测试通过
- [ ] 请求 ID 追踪验证
- [ ] 性能测试：缓存命中响应 ≤ 100ms

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1: 缓存抽象层
- [ ] Task 2: 缓存配置
- [ ] Task 3: 集成缓存到服务
- [ ] Task 4: 统一错误处理
- [ ] Task 5: 请求追踪中间件
- [ ] Task 6-7: 测试、文档

#### 技术决策
- 缓存后端: 内存优先（MVP），支持 Redis 扩展
- 错误处理: 统一 AppException 基类，分类处理
- 请求追踪: 使用 UUID，绑定到 structlog 上下文

#### 遇到的问题
_(记录实际开发中遇到的问题和解决方案)_

#### 测试结果
_(记录缓存命中率和性能提升数据)_

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 2.1-2.4](./story-2.1-github-repo-service.md)
- [架构文档](../architecture.md)
- [编码规范](../architecture/coding-standards.md)
- [FastAPI 异常处理](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [structlog 文档](https://www.structlog.org/)
