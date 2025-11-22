# Story 2.2: 内容处理与向量化服务

## 📋 Story 元信息

- **Story ID**: STORY-2.2
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 2 - 真实服务集成
- **状态**: Draft
- **优先级**: High
- **预估时间**: 2-3 天
- **负责人**: Dev Agent
- **依赖**: STORY-2.1 (GitHub 仓库解析服务)

---

## 📖 User Story

**As a** 系统开发者
**I want** 实现内容提取、分块和向量化服务
**So that** 可以将 GitHub 仓库内容转换为可检索的向量数据，为 RAG 教程生成提供基础

---

## 🎯 背景与上下文

### 项目上下文
在 Story 2.1 完成仓库解析后，需要对克隆的代码仓库进行深度处理：
1. 提取关键代码文件内容（过滤二进制文件、依赖目录等）
2. 将文件内容按语义单元分块（保持代码完整性）
3. 使用 OpenAI Embedding API 生成向量
4. 存储到 ChromaDB 向量数据库

### 技术上下文
- **向量化模型**: OpenAI `text-embedding-ada-002` (1536 维)
- **向量数据库**: ChromaDB (embedded mode)
- **分块策略**:
  - 单文件 < 2000 tokens: 整文件作为一个 chunk
  - 单文件 ≥ 2000 tokens: 按函数/类级别分块
- **文件过滤**: 使用 `.gitignore` 规则 + 自定义黑名单
- **元数据**: 保留文件路径、语言、代码范围等信息

### 迭代目标
实现从仓库目录到向量数据库的完整 pipeline，支持增量更新和错误重试。

---

## ✅ 验收标准

### 功能性需求

1. **AC-2.2.1**: 内容提取服务能够遍历克隆的仓库目录，识别代码文件
   - 支持常见编程语言（Python, JS/TS, Java, Go, Rust 等）
   - 过滤 `node_modules`, `venv`, `.git`, `dist`, `build` 等目录
   - 过滤二进制文件、图片、视频等非文本内容
   - 尊重 `.gitignore` 规则

2. **AC-2.2.2**: 文件内容读取使用正确的编码检测
   - 默认 UTF-8，自动检测其他编码（如 GBK）
   - 遇到无法解码的文件跳过并记录日志
   - 单文件大小限制 1MB（可配置）

3. **AC-2.2.3**: 文本分块策略能够保持代码语义完整性
   - 小文件（< 2000 tokens）: 整文件作为一个 chunk
   - 大文件（≥ 2000 tokens）: 按函数/类级别分块
   - 使用 AST 解析器（如 `tree-sitter`）识别代码边界
   - Fallback: 使用行号分块（如 AST 解析失败）

4. **AC-2.2.4**: Embedding 生成调用 OpenAI API
   - 使用 `text-embedding-ada-002` 模型
   - 批量处理（每批最多 100 个 chunks）
   - 实现 Rate Limiting (3000 RPM)
   - 错误重试机制（指数退避，最多 3 次）

5. **AC-2.2.5**: ChromaDB 集成能够存储向量和元数据
   - Collection 命名规则: `repo_{owner}_{name}`
   - 每个 chunk 包含元数据:
     ```python
     {
       "file_path": "src/index.ts",
       "language": "typescript",
       "chunk_type": "function",  # file | function | class
       "start_line": 10,
       "end_line": 25,
       "chunk_index": 0
     }
     ```
   - Document ID 格式: `{file_path}::{chunk_index}`
   - 支持幂等性更新（相同 ID 覆盖）

6. **AC-2.2.6**: 提供向量化任务状态查询接口
   - 状态: `pending`, `processing`, `completed`, `failed`
   - 返回进度信息: 已处理文件数 / 总文件数
   - 返回错误详情（如果失败）

7. **AC-2.2.7**: API 端点设计符合规范
   ```
   POST /api/vectorize
   Body: { "repo_url": "https://github.com/..." }
   Response: { "ok": true, "data": { "task_id": "...", "status": "processing" } }

   GET /api/vectorize/{task_id}
   Response: { "ok": true, "data": { "status": "completed", "stats": {...} } }
   ```

8. **AC-2.2.8**: Token 计数准确
   - 使用 `tiktoken` 库计算 token 数
   - 使用 `cl100k_base` encoder（匹配 ada-002）
   - 单个 chunk 不超过 8191 tokens（模型限制）

### 质量需求

9. **AC-2.2.9**: 错误处理完善
   - OpenAI API 错误: Rate limit, timeout, quota exceeded
   - 文件读取错误: 编码错误、权限错误、文件不存在
   - ChromaDB 错误: 连接失败、写入冲突
   - 所有错误记录结构化日志，包含上下文信息

10. **AC-2.2.10**: 性能满足要求
    - 处理 1000 个文件（约 50MB 代码）≤ 5 分钟
    - 内存占用 ≤ 512MB（流式处理大文件）
    - OpenAI API 并发控制（避免 Rate Limit）

11. **AC-2.2.11**: 单元测试覆盖率 ≥ 80%
    - 测试文件过滤逻辑
    - 测试分块策略（Mock AST 解析）
    - 测试 Embedding 批处理（Mock OpenAI API）
    - 测试 ChromaDB 存储（使用内存模式）

12. **AC-2.2.12**: 代码符合项目规范
    - 遵循 `coding-standards.md` 中的 Python 规范
    - 使用 Type Hints
    - 使用 Pydantic 进行数据验证
    - 使用 structlog 记录结构化日志

---

## 🔧 技术实现任务

### Task 1: 设计数据模型和 Schemas
**预估**: 30 分钟

在 `backend/app/schemas/` 中创建数据模型：

```python
# backend/app/schemas/content.py
from typing import Literal, Optional
from pydantic import BaseModel, Field

class CodeChunk(BaseModel):
    """代码块模型"""
    content: str = Field(..., description="代码内容")
    file_path: str = Field(..., description="文件路径")
    language: str = Field(..., description="编程语言")
    chunk_type: Literal["file", "function", "class"] = Field(..., description="分块类型")
    start_line: int = Field(..., description="起始行号")
    end_line: int = Field(..., description="结束行号")
    chunk_index: int = Field(0, description="分块索引")
    token_count: int = Field(..., description="Token 数量")

class VectorizeRequest(BaseModel):
    """向量化请求"""
    repo_url: str = Field(..., description="仓库 URL")

class VectorizeStatus(BaseModel):
    """向量化状态"""
    task_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: Optional[dict] = None  # {"processed": 50, "total": 100}
    error: Optional[str] = None
    stats: Optional[dict] = None  # {"chunks": 500, "files": 100, "vectors": 500}
```

---

### Task 2: 实现文件过滤服务
**预估**: 1 小时

创建 `backend/app/services/file_filter.py`：

```python
import os
from pathlib import Path
from typing import List, Set
import fnmatch

class FileFilter:
    """文件过滤器"""

    # 默认忽略目录
    IGNORE_DIRS = {
        "node_modules", ".git", "venv", "env", ".venv",
        "dist", "build", "__pycache__", ".next", ".nuxt",
        "target", "out", "coverage"
    }

    # 默认忽略文件模式
    IGNORE_PATTERNS = [
        "*.pyc", "*.pyo", "*.so", "*.dll", "*.dylib",
        "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico",
        "*.mp4", "*.avi", "*.mov",
        "*.zip", "*.tar", "*.gz", "*.rar",
        "package-lock.json", "yarn.lock", "pnpm-lock.yaml"
    ]

    # 支持的代码文件扩展名
    CODE_EXTENSIONS = {
        ".py", ".js", ".ts", ".jsx", ".tsx",
        ".java", ".go", ".rs", ".c", ".cpp", ".h", ".hpp",
        ".rb", ".php", ".swift", ".kt", ".scala",
        ".md", ".txt", ".yml", ".yaml", ".json", ".toml"
    }

    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.gitignore_patterns = self._load_gitignore()

    def _load_gitignore(self) -> List[str]:
        """加载 .gitignore 规则"""
        gitignore_path = self.repo_path / ".gitignore"
        if not gitignore_path.exists():
            return []

        patterns = []
        with open(gitignore_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    patterns.append(line)
        return patterns

    def should_ignore_dir(self, dir_name: str) -> bool:
        """判断目录是否应该忽略"""
        if dir_name in self.IGNORE_DIRS:
            return True

        for pattern in self.gitignore_patterns:
            if fnmatch.fnmatch(dir_name, pattern.rstrip("/")):
                return True

        return False

    def should_ignore_file(self, file_path: Path) -> bool:
        """判断文件是否应该忽略"""
        # 检查扩展名
        if file_path.suffix not in self.CODE_EXTENSIONS:
            return True

        # 检查文件名模式
        for pattern in self.IGNORE_PATTERNS:
            if fnmatch.fnmatch(file_path.name, pattern):
                return True

        # 检查 gitignore
        relative_path = file_path.relative_to(self.repo_path)
        for pattern in self.gitignore_patterns:
            if fnmatch.fnmatch(str(relative_path), pattern):
                return True

        # 检查文件大小
        if file_path.stat().st_size > 1024 * 1024:  # 1MB
            return True

        return False

    def get_code_files(self) -> List[Path]:
        """获取所有代码文件"""
        code_files = []

        for root, dirs, files in os.walk(self.repo_path):
            # 过滤目录
            dirs[:] = [d for d in dirs if not self.should_ignore_dir(d)]

            # 收集文件
            for file in files:
                file_path = Path(root) / file
                if not self.should_ignore_file(file_path):
                    code_files.append(file_path)

        return code_files
```

**测试**: 创建 `backend/tests/test_file_filter.py`

---

### Task 3: 实现文本分块服务
**预估**: 2 小时

创建 `backend/app/services/chunker.py`：

```python
from typing import List
from pathlib import Path
import tiktoken
from app.schemas.content import CodeChunk

class CodeChunker:
    """代码分块器"""

    MAX_TOKENS = 2000  # 分块阈值

    def __init__(self):
        self.encoder = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """计算 token 数量"""
        return len(self.encoder.encode(text))

    def chunk_file(self, file_path: Path, repo_root: Path) -> List[CodeChunk]:
        """对单个文件进行分块"""
        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            # 尝试其他编码
            try:
                content = file_path.read_text(encoding="gbk")
            except Exception:
                return []  # 跳过无法读取的文件

        token_count = self.count_tokens(content)
        relative_path = file_path.relative_to(repo_root)
        language = self._detect_language(file_path.suffix)

        # 小文件：整文件作为一个 chunk
        if token_count < self.MAX_TOKENS:
            return [CodeChunk(
                content=content,
                file_path=str(relative_path),
                language=language,
                chunk_type="file",
                start_line=1,
                end_line=len(content.splitlines()),
                chunk_index=0,
                token_count=token_count
            )]

        # 大文件：尝试按函数/类分块
        chunks = self._chunk_by_syntax(content, relative_path, language)
        if chunks:
            return chunks

        # Fallback: 按行数分块
        return self._chunk_by_lines(content, relative_path, language)

    def _detect_language(self, suffix: str) -> str:
        """检测编程语言"""
        lang_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".jsx": "javascript",
            ".tsx": "typescript",
            ".java": "java",
            ".go": "go",
            ".rs": "rust",
            ".c": "c",
            ".cpp": "cpp",
            ".h": "c",
            ".hpp": "cpp",
            ".rb": "ruby",
            ".php": "php",
            ".md": "markdown"
        }
        return lang_map.get(suffix, "unknown")

    def _chunk_by_syntax(
        self, content: str, file_path: Path, language: str
    ) -> List[CodeChunk]:
        """按语法结构分块（简化版，MVP 阶段使用 regex）"""
        # TODO: 集成 tree-sitter 进行准确的 AST 解析
        # 当前使用简单的正则表达式识别函数/类

        if language == "python":
            return self._chunk_python_simple(content, file_path)
        elif language in ["javascript", "typescript"]:
            return self._chunk_js_simple(content, file_path)

        return []  # 不支持的语言，返回空列表，Fallback 到按行分块

    def _chunk_python_simple(self, content: str, file_path: Path) -> List[CodeChunk]:
        """简单的 Python 分块（基于缩进）"""
        import re

        lines = content.splitlines()
        chunks = []
        current_chunk = []
        start_line = 1
        chunk_index = 0

        for i, line in enumerate(lines, 1):
            # 检测顶级函数或类定义
            if re.match(r'^(def|class)\s+\w+', line):
                if current_chunk:
                    # 保存上一个 chunk
                    chunk_content = "\n".join(current_chunk)
                    if self.count_tokens(chunk_content) > 0:
                        chunks.append(CodeChunk(
                            content=chunk_content,
                            file_path=str(file_path),
                            language="python",
                            chunk_type="function",
                            start_line=start_line,
                            end_line=i - 1,
                            chunk_index=chunk_index,
                            token_count=self.count_tokens(chunk_content)
                        ))
                        chunk_index += 1

                # 开始新 chunk
                current_chunk = [line]
                start_line = i
            else:
                current_chunk.append(line)

        # 保存最后一个 chunk
        if current_chunk:
            chunk_content = "\n".join(current_chunk)
            chunks.append(CodeChunk(
                content=chunk_content,
                file_path=str(file_path),
                language="python",
                chunk_type="function",
                start_line=start_line,
                end_line=len(lines),
                chunk_index=chunk_index,
                token_count=self.count_tokens(chunk_content)
            ))

        return chunks

    def _chunk_js_simple(self, content: str, file_path: Path) -> List[CodeChunk]:
        """简单的 JS/TS 分块"""
        # 类似 Python，基于 function/class 关键字
        # 实现略，逻辑类似
        return []

    def _chunk_by_lines(
        self, content: str, file_path: Path, language: str
    ) -> List[CodeChunk]:
        """按行数分块（Fallback）"""
        lines = content.splitlines()
        chunks = []
        chunk_size = 100  # 每个 chunk 100 行

        for i in range(0, len(lines), chunk_size):
            chunk_lines = lines[i:i + chunk_size]
            chunk_content = "\n".join(chunk_lines)

            chunks.append(CodeChunk(
                content=chunk_content,
                file_path=str(file_path),
                language=language,
                chunk_type="file",
                start_line=i + 1,
                end_line=min(i + chunk_size, len(lines)),
                chunk_index=i // chunk_size,
                token_count=self.count_tokens(chunk_content)
            ))

        return chunks
```

**测试**: 创建 `backend/tests/test_chunker.py`

---

### Task 4: 实现 Embedding 生成服务
**预估**: 1.5 小时

创建 `backend/app/services/embedder.py`：

```python
from typing import List
import asyncio
from openai import AsyncOpenAI
import structlog
from app.schemas.content import CodeChunk
from app.core.config import settings

logger = structlog.get_logger()

class EmbeddingService:
    """Embedding 生成服务"""

    MODEL = "text-embedding-ada-002"
    BATCH_SIZE = 100  # 每批处理数量
    MAX_RETRIES = 3

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.semaphore = asyncio.Semaphore(10)  # 并发限制

    async def generate_embeddings(
        self, chunks: List[CodeChunk]
    ) -> List[List[float]]:
        """批量生成 embeddings"""
        all_embeddings = []

        for i in range(0, len(chunks), self.BATCH_SIZE):
            batch = chunks[i:i + self.BATCH_SIZE]
            embeddings = await self._process_batch(batch)
            all_embeddings.extend(embeddings)

            logger.info(
                "embeddings_generated",
                batch_num=i // self.BATCH_SIZE + 1,
                batch_size=len(batch)
            )

        return all_embeddings

    async def _process_batch(self, chunks: List[CodeChunk]) -> List[List[float]]:
        """处理单个批次"""
        texts = [chunk.content for chunk in chunks]

        for attempt in range(self.MAX_RETRIES):
            try:
                async with self.semaphore:
                    response = await self.client.embeddings.create(
                        model=self.MODEL,
                        input=texts
                    )

                return [item.embedding for item in response.data]

            except Exception as e:
                logger.warning(
                    "embedding_retry",
                    attempt=attempt + 1,
                    error=str(e)
                )

                if attempt == self.MAX_RETRIES - 1:
                    raise

                # 指数退避
                await asyncio.sleep(2 ** attempt)

        return []
```

**配置**: 在 `backend/app/core/config.py` 添加:

```python
class Settings(BaseSettings):
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
```

**测试**: 创建 `backend/tests/test_embedder.py` (Mock OpenAI API)

---

### Task 5: 实现 ChromaDB 集成服务
**预估**: 1.5 小时

创建 `backend/app/services/vector_store.py`：

```python
from typing import List
import chromadb
from chromadb.config import Settings as ChromaSettings
from pathlib import Path
import structlog
from app.schemas.content import CodeChunk

logger = structlog.get_logger()

class VectorStore:
    """向量存储服务"""

    def __init__(self, persist_directory: str = "./data/chromadb"):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.Client(ChromaSettings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=str(self.persist_directory)
        ))

    def get_or_create_collection(self, repo_owner: str, repo_name: str):
        """获取或创建 collection"""
        collection_name = f"repo_{repo_owner}_{repo_name}".lower()
        # ChromaDB collection 名称只能包含字母、数字、下划线和连字符
        collection_name = collection_name.replace("-", "_")

        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={"repo_owner": repo_owner, "repo_name": repo_name}
        )

    async def store_chunks(
        self,
        repo_owner: str,
        repo_name: str,
        chunks: List[CodeChunk],
        embeddings: List[List[float]]
    ) -> None:
        """存储代码块和向量"""
        collection = self.get_or_create_collection(repo_owner, repo_name)

        # 准备数据
        ids = [f"{chunk.file_path}::{chunk.chunk_index}" for chunk in chunks]
        documents = [chunk.content for chunk in chunks]
        metadatas = [
            {
                "file_path": chunk.file_path,
                "language": chunk.language,
                "chunk_type": chunk.chunk_type,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
                "chunk_index": chunk.chunk_index,
                "token_count": chunk.token_count
            }
            for chunk in chunks
        ]

        # 批量插入（upsert 保证幂等性）
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

        logger.info(
            "chunks_stored",
            repo=f"{repo_owner}/{repo_name}",
            count=len(chunks)
        )

    def get_collection_stats(self, repo_owner: str, repo_name: str) -> dict:
        """获取 collection 统计信息"""
        collection = self.get_or_create_collection(repo_owner, repo_name)
        count = collection.count()

        return {
            "total_chunks": count,
            "collection_name": collection.name
        }
```

**测试**: 创建 `backend/tests/test_vector_store.py`

---

### Task 6: 实现向量化编排服务
**预估**: 2 小时

创建 `backend/app/services/vectorization.py`：

```python
from typing import Dict
from pathlib import Path
import asyncio
import structlog
from app.services.file_filter import FileFilter
from app.services.chunker import CodeChunker
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStore
from app.schemas.content import VectorizeStatus

logger = structlog.get_logger()

class VectorizationService:
    """向量化编排服务"""

    def __init__(self):
        self.chunker = CodeChunker()
        self.embedder = EmbeddingService()
        self.vector_store = VectorStore()
        self.tasks: Dict[str, VectorizeStatus] = {}

    async def vectorize_repository(
        self,
        task_id: str,
        repo_path: Path,
        repo_owner: str,
        repo_name: str
    ) -> None:
        """向量化整个仓库"""
        try:
            # 更新状态
            self.tasks[task_id] = VectorizeStatus(
                task_id=task_id,
                status="processing",
                progress={"processed": 0, "total": 0}
            )

            # 1. 过滤文件
            logger.info("starting_file_filtering", repo=f"{repo_owner}/{repo_name}")
            file_filter = FileFilter(repo_path)
            code_files = file_filter.get_code_files()
            total_files = len(code_files)

            logger.info(
                "files_filtered",
                total=total_files,
                repo=f"{repo_owner}/{repo_name}"
            )

            # 2. 分块
            logger.info("starting_chunking")
            all_chunks = []
            for i, file_path in enumerate(code_files):
                chunks = self.chunker.chunk_file(file_path, repo_path)
                all_chunks.extend(chunks)

                # 更新进度
                self.tasks[task_id].progress = {
                    "processed": i + 1,
                    "total": total_files
                }

            logger.info("chunking_completed", chunks=len(all_chunks))

            # 3. 生成 embeddings
            logger.info("starting_embedding_generation")
            embeddings = await self.embedder.generate_embeddings(all_chunks)
            logger.info("embeddings_generated", count=len(embeddings))

            # 4. 存储到 ChromaDB
            logger.info("storing_to_chromadb")
            await self.vector_store.store_chunks(
                repo_owner, repo_name, all_chunks, embeddings
            )

            # 5. 更新状态为完成
            stats = self.vector_store.get_collection_stats(repo_owner, repo_name)
            self.tasks[task_id] = VectorizeStatus(
                task_id=task_id,
                status="completed",
                stats={
                    "files": total_files,
                    "chunks": len(all_chunks),
                    "vectors": len(embeddings),
                    **stats
                }
            )

            logger.info(
                "vectorization_completed",
                task_id=task_id,
                stats=self.tasks[task_id].stats
            )

        except Exception as e:
            logger.error(
                "vectorization_failed",
                task_id=task_id,
                error=str(e),
                exc_info=True
            )

            self.tasks[task_id] = VectorizeStatus(
                task_id=task_id,
                status="failed",
                error=str(e)
            )

    def get_task_status(self, task_id: str) -> VectorizeStatus:
        """获取任务状态"""
        return self.tasks.get(
            task_id,
            VectorizeStatus(task_id=task_id, status="pending")
        )
```

**测试**: 创建 `backend/tests/test_vectorization.py`

---

### Task 7: 创建 API 路由
**预估**: 1 小时

创建 `backend/app/api/routes/vectorize.py`：

```python
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.schemas.content import VectorizeRequest, VectorizeStatus
from app.services.vectorization import VectorizationService
from app.services.github_repo import GitHubRepoService
import uuid

router = APIRouter(prefix="/api/vectorize", tags=["vectorization"])

vectorization_service = VectorizationService()
github_service = GitHubRepoService()

@router.post("", response_model=dict)
async def start_vectorization(
    request: VectorizeRequest,
    background_tasks: BackgroundTasks
):
    """启动向量化任务"""
    try:
        # 解析仓库 URL
        owner, repo_name = github_service.parse_repo_url(request.repo_url)

        # 检查仓库是否已克隆（假设 Story 2.1 已完成）
        repo_path = github_service.get_repo_path(owner, repo_name)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository not cloned: {owner}/{repo_name}"
            )

        # 生成任务 ID
        task_id = str(uuid.uuid4())

        # 在后台运行向量化
        background_tasks.add_task(
            vectorization_service.vectorize_repository,
            task_id,
            repo_path,
            owner,
            repo_name
        )

        return {
            "ok": True,
            "data": {
                "task_id": task_id,
                "status": "processing"
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}", response_model=dict)
async def get_vectorization_status(task_id: str):
    """获取向量化任务状态"""
    status = vectorization_service.get_task_status(task_id)

    return {
        "ok": True,
        "data": status.dict()
    }
```

在 `backend/app/api/router.py` 中注册路由：

```python
from app.api.routes import vectorize

api_router.include_router(vectorize.router)
```

---

### Task 8: 配置 OpenAI API Key
**预估**: 15 分钟

更新 `backend/.env.example`:

```env
OPENAI_API_KEY=sk-...
```

更新 `backend/README.md` 添加配置说明。

---

### Task 9: 添加依赖包
**预估**: 15 分钟

更新 `backend/pyproject.toml`:

```toml
[tool.poetry.dependencies]
chromadb = "^0.4.18"
openai = "^1.3.0"
tiktoken = "^0.5.1"
```

运行:
```bash
cd backend
poetry install
```

---

### Task 10: 创建单元测试
**预估**: 3 小时

创建以下测试文件：
- `backend/tests/test_file_filter.py`: 测试文件过滤逻辑
- `backend/tests/test_chunker.py`: 测试分块策略
- `backend/tests/test_embedder.py`: Mock OpenAI API
- `backend/tests/test_vector_store.py`: 使用内存模式 ChromaDB
- `backend/tests/test_vectorization.py`: 集成测试

运行测试:
```bash
cd backend
poetry run pytest tests/ -v --cov=app --cov-report=term-missing
```

确保覆盖率 ≥ 80%。

---

### Task 11: 集成测试（端到端）
**预估**: 1 小时

创建 `backend/tests/integration/test_vectorize_e2e.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_vectorize_repository_e2e():
    """端到端测试：向量化完整流程"""
    # 1. 启动向量化
    response = client.post(
        "/api/vectorize",
        json={"repo_url": "https://github.com/octocat/Hello-World"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    task_id = data["data"]["task_id"]

    # 2. 轮询状态直到完成
    import time
    for _ in range(30):  # 最多等待 30 秒
        response = client.get(f"/api/vectorize/{task_id}")
        status = response.json()["data"]["status"]

        if status == "completed":
            break
        elif status == "failed":
            pytest.fail("Vectorization failed")

        time.sleep(1)

    assert status == "completed"

    # 3. 验证统计信息
    stats = response.json()["data"]["stats"]
    assert stats["files"] > 0
    assert stats["chunks"] > 0
    assert stats["vectors"] > 0
```

---

### Task 12: 文档更新
**预估**: 30 分钟

更新 `backend/README.md`:

```markdown
## 向量化服务

### 启动向量化

**POST** `/api/vectorize`

Request:
\`\`\`json
{
  "repo_url": "https://github.com/facebook/react"
}
\`\`\`

Response:
\`\`\`json
{
  "ok": true,
  "data": {
    "task_id": "uuid...",
    "status": "processing"
  }
}
\`\`\`

### 查询状态

**GET** `/api/vectorize/{task_id}`

Response:
\`\`\`json
{
  "ok": true,
  "data": {
    "task_id": "...",
    "status": "completed",
    "stats": {
      "files": 150,
      "chunks": 800,
      "vectors": 800
    }
  }
}
\`\`\`
```

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| OpenAI API Rate Limit | 高 | 中 | 实现重试机制、并发控制、使用 Batch API |
| 大文件处理内存溢出 | 中 | 高 | 流式处理、分批加载、设置文件大小限制 |
| ChromaDB 写入冲突 | 低 | 中 | 使用 upsert、实现幂等性 |
| AST 解析失败 | 中 | 低 | Fallback 到按行分块 |
| OpenAI API 费用超支 | 中 | 高 | 设置配额限制、监控使用量 |

### 依赖关系

**前置依赖**:
- STORY-2.1: GitHub 仓库解析服务（需要克隆的仓库路径）

**后续依赖**:
- STORY-2.3: RAG 教程生成服务（需要向量数据）

---

## ✅ Definition of Done

- [ ] 所有 12 个验收标准通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过（端到端向量化流程）
- [ ] API 文档更新
- [ ] 代码符合 `coding-standards.md` 规范
- [ ] Code Review 通过
- [ ] 在本地环境成功向量化测试仓库（如 `octocat/Hello-World`）
- [ ] OpenAI API 错误处理测试通过
- [ ] ChromaDB 数据持久化验证
- [ ] 性能测试：1000 文件 ≤ 5 分钟
- [ ] 日志记录完善，包含所有关键操作
- [ ] 依赖项已添加到 `pyproject.toml`

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1: 数据模型设计
- [ ] Task 2: 文件过滤服务
- [ ] Task 3: 文本分块服务
- [ ] Task 4: Embedding 生成
- [ ] Task 5: ChromaDB 集成
- [ ] Task 6: 向量化编排
- [ ] Task 7: API 路由
- [ ] Task 8-12: 配置、测试、文档

#### 技术决策
- 分块策略：使用简化的正则表达式（MVP），后续可升级到 tree-sitter
- Embedding 批处理：每批 100 个 chunks，平衡性能和 API 限制
- ChromaDB：使用 DuckDB + Parquet 模式，支持数据持久化

#### 遇到的问题
_(记录实际开发中遇到的问题和解决方案)_

#### 测试结果
_(记录测试覆盖率和关键测试用例)_

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 2.1: GitHub 仓库解析](./story-2.1-github-repo-service.md)
- [Story 2.3: RAG 教程生成](./story-2.3-rag-tutorial-generation.md) (待创建)
- [架构文档](../architecture.md)
- [技术栈](../architecture/tech-stack.md)
- [编码规范](../architecture/coding-standards.md)
- [ChromaDB 文档](https://docs.trychroma.com/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [tiktoken 文档](https://github.com/openai/tiktoken)
