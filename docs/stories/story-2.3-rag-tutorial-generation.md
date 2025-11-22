# Story 2.3: RAG 教程生成服务

## 📋 Story 元信息

- **Story ID**: STORY-2.3
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 2 - 真实服务集成
- **状态**: Draft
- **优先级**: High
- **预估时间**: 3-4 天
- **负责人**: Dev Agent
- **依赖**: STORY-2.2 (内容处理与向量化服务)

---

## 📖 User Story

**As a** 用户
**I want** 系统能够基于向量检索生成个性化的学习教程
**So that** 我可以获得针对特定仓库的结构化、易懂的学习路径

---

## 🎯 背景与上下文

### 项目上下文
RAG (Retrieval Augmented Generation) 是本项目的核心功能。在 Story 2.2 完成向量化后，本 Story 需要：
1. 基于用户输入的仓库 URL，从 ChromaDB 检索相关代码片段
2. 构建包含代码上下文的 prompt
3. 调用 OpenAI Chat API 生成教程内容
4. 解析 LLM 输出，生成结构化的教程数据（modules, steps）
5. 确保生成的教程符合 UX 规格定义的格式

### 技术上下文
- **LLM 模型**: OpenAI `gpt-4-turbo-preview` (推理能力强，适合生成结构化内容)
- **检索策略**:
  - 第一阶段: 检索 README 和关键配置文件（如 package.json）
  - 第二阶段: 基于第一阶段生成的初步理解，检索相关代码文件
- **Prompt Engineering**:
  - System Prompt: 定义助手角色和输出格式
  - Few-shot Examples: 提供示例教程结构
  - Chain of Thought: 引导 LLM 逐步生成
- **输出格式**: JSON (严格遵循 frontend schemas)

### 迭代目标
实现从仓库 URL 到完整教程的端到端生成流程，替代 Story 1.1 的 Mock 数据。

---

## ✅ 验收标准

### 功能性需求

1. **AC-2.3.1**: 向量检索服务能够从 ChromaDB 查询相关代码片段
   - 支持语义相似度搜索
   - 返回 Top-K 个最相关的 chunks (K=10-20)
   - 每个结果包含: 代码内容、文件路径、元数据
   - 过滤掉相似度低于阈值的结果（如 cosine similarity < 0.7）

2. **AC-2.3.2**: Prompt 构建策略符合最佳实践
   - System Prompt 清晰定义任务和输出格式
   - 包含 Few-shot Examples（至少 1 个完整示例）
   - 动态注入检索到的代码上下文
   - 控制总 token 数 ≤ 6000（避免超出模型限制）

3. **AC-2.3.3**: LLM 调用接口稳定可靠
   - 使用 `gpt-4-turbo-preview` 或 `gpt-4`
   - 支持 JSON Mode（`response_format: { "type": "json_object" }`）
   - 温度设置: 0.3（平衡创造性和确定性）
   - Max Tokens: 4000
   - 实现指数退避重试（最多 3 次）
   - 处理 Rate Limit、Timeout 等错误

4. **AC-2.3.4**: 生成的教程数据符合前端 Schema
   ```typescript
   interface TutorialData {
     repo: RepoInfo;
     overview: string;
     prerequisites: string[];
     structure: {
       directories: DirectoryItem[];
       files: FileItem[];
     };
     modules: Module[];
     steps: Step[];
   }
   ```
   - 所有字段必须存在且类型正确
   - `modules` 数组长度: 3-8 个
   - 每个 `module` 包含 2-6 个 `stepIds`
   - `steps` 数组与 `stepIds` 引用一致
   - `overview` 长度: 200-500 字符
   - `prerequisites` 数组长度: 2-6 项

5. **AC-2.3.5**: 教程质量符合标准
   - Overview 准确描述仓库核心功能
   - Prerequisites 包含必要的技术要求（如 Node.js 版本）
   - Modules 按照逻辑顺序组织（环境搭建 → 核心功能 → 进阶主题）
   - Steps 具有可执行性（包含具体命令或代码示例）
   - 代码示例使用正确的语法高亮标记（如 ```python、```typescript）

6. **AC-2.3.6**: API 端点设计符合规范
   ```
   POST /api/tutorial/generate
   Body: { "repo_url": "https://github.com/..." }
   Response: {
     "ok": true,
     "data": {
       "task_id": "...",
       "status": "processing"
     }
   }

   GET /api/tutorial/{task_id}
   Response: {
     "ok": true,
     "data": {
       "status": "completed",
       "tutorial": { /* TutorialData */ }
     }
   }
   ```

7. **AC-2.3.7**: 支持缓存机制
   - 相同仓库 URL 的教程缓存 24 小时
   - 缓存键: `tutorial:{owner}:{repo}:{commit_sha}`
   - 使用内存缓存（MVP 阶段）或 Redis（可选）
   - 提供强制刷新选项: `POST /api/tutorial/generate?force=true`

8. **AC-2.3.8**: 错误处理完善
   - 仓库未向量化: 返回 404 with 提示 "Repository not vectorized"
   - LLM 输出格式错误: 重试或返回默认结构
   - OpenAI API 错误: 记录日志，返回友好错误信息
   - 超时处理: 任务超时时间 5 分钟

### 质量需求

9. **AC-2.3.9**: 性能满足要求
   - 生成单个教程 ≤ 60 秒（P95）
   - 向量检索 ≤ 2 秒
   - LLM 调用 ≤ 30 秒
   - 并发支持: 5 个同时进行的生成任务

10. **AC-2.3.10**: 单元测试覆盖率 ≥ 80%
    - 测试向量检索逻辑（Mock ChromaDB）
    - 测试 Prompt 构建（验证格式）
    - 测试 LLM 输出解析（Mock OpenAI API）
    - 测试缓存机制
    - 测试错误处理

11. **AC-2.3.11**: 代码符合项目规范
    - 遵循 `coding-standards.md` 中的 Python 规范
    - 使用 Type Hints
    - 使用 Pydantic 进行数据验证
    - 使用 structlog 记录结构化日志

12. **AC-2.3.12**: Prompt 可维护性
    - Prompt 模板存储在独立文件（如 `prompts/tutorial_generation.txt`）
    - 支持版本控制和 A/B 测试
    - 包含注释说明每个部分的作用

---

## 🔧 技术实现任务

### Task 1: 设计数据模型和 Schemas
**预估**: 30 分钟

在 `backend/app/schemas/` 中创建教程数据模型：

```python
# backend/app/schemas/tutorial.py
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class RepoInfo(BaseModel):
    """仓库信息"""
    owner: str
    name: str
    description: Optional[str] = None
    stars: int = 0
    language: Optional[str] = None
    url: str

class DirectoryItem(BaseModel):
    """目录项"""
    name: str
    description: str

class FileItem(BaseModel):
    """文件项"""
    name: str
    description: str

class DirectoryStructure(BaseModel):
    """目录结构"""
    directories: List[DirectoryItem] = []
    files: List[FileItem] = []

class Step(BaseModel):
    """学习步骤"""
    id: str
    title: str
    description: str
    command: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None

class Module(BaseModel):
    """学习模块"""
    id: str
    title: str
    description: str
    stepIds: List[str] = Field(..., alias="stepIds")

    class Config:
        populate_by_name = True

class TutorialData(BaseModel):
    """完整教程数据"""
    repo: RepoInfo
    overview: str = Field(..., min_length=200, max_length=1000)
    prerequisites: List[str] = Field(..., min_items=2, max_items=10)
    structure: DirectoryStructure
    modules: List[Module] = Field(..., min_items=3, max_items=8)
    steps: List[Step]

class GenerateTutorialRequest(BaseModel):
    """生成教程请求"""
    repo_url: str
    force: bool = False  # 强制刷新

class TutorialGenerationStatus(BaseModel):
    """教程生成状态"""
    task_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: Optional[dict] = None
    error: Optional[str] = None
    tutorial: Optional[TutorialData] = None
```

---

### Task 2: 实现向量检索服务
**预估**: 1.5 小时

扩展 `backend/app/services/vector_store.py`:

```python
from typing import List, Dict
import structlog

logger = structlog.get_logger()

class VectorStore:
    # ... 之前的代码 ...

    async def search_similar_chunks(
        self,
        repo_owner: str,
        repo_name: str,
        query: str,
        top_k: int = 20,
        min_similarity: float = 0.7
    ) -> List[Dict]:
        """检索相似代码块"""
        from app.services.embedder import EmbeddingService

        collection = self.get_or_create_collection(repo_owner, repo_name)

        # 生成查询向量
        embedder = EmbeddingService()
        query_embedding = await embedder.generate_embeddings([
            type('Chunk', (), {'content': query})()
        ])

        # 执行检索
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        # 过滤低相似度结果
        filtered_results = []
        for i, distance in enumerate(results["distances"][0]):
            # ChromaDB 使用 L2 距离，转换为相似度
            similarity = 1 / (1 + distance)

            if similarity >= min_similarity:
                filtered_results.append({
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity": similarity
                })

        logger.info(
            "vector_search_completed",
            repo=f"{repo_owner}/{repo_name}",
            total_results=len(results["documents"][0]),
            filtered_results=len(filtered_results)
        )

        return filtered_results

    async def get_readme_content(
        self,
        repo_owner: str,
        repo_name: str
    ) -> Optional[str]:
        """获取 README 内容"""
        collection = self.get_or_create_collection(repo_owner, repo_name)

        # 查找 README 文件
        results = collection.get(
            where={"file_path": {"$regex": "(?i)readme\\.md"}},
            limit=1
        )

        if results["documents"]:
            return results["documents"][0]

        return None
```

**测试**: 创建 `backend/tests/test_vector_store_search.py`

---

### Task 3: 创建 Prompt 模板
**预估**: 2 小时

创建 `backend/app/prompts/tutorial_generation.txt`:

```text
You are an expert technical writer and software educator. Your task is to analyze a GitHub repository and generate a comprehensive, beginner-friendly tutorial that helps users understand and learn the project.

## Input Context

You will receive:
1. Repository metadata (name, description, language, stars)
2. README content
3. Key configuration files (e.g., package.json, requirements.txt)
4. Relevant code snippets from the repository

## Output Format

You MUST respond with a valid JSON object following this exact structure:

{
  "overview": "A clear, concise overview (200-500 chars) explaining what this project does and its main purpose.",
  "prerequisites": [
    "Prerequisite 1 (e.g., Node.js 18.17 or higher)",
    "Prerequisite 2 (e.g., Basic understanding of React)",
    "..."
  ],
  "structure": {
    "directories": [
      {
        "name": "src/",
        "description": "Main source code directory"
      }
    ],
    "files": [
      {
        "name": "package.json",
        "description": "Project dependencies and scripts"
      }
    ]
  },
  "modules": [
    {
      "id": "module-1",
      "title": "Module Title",
      "description": "Module description",
      "stepIds": ["step-1", "step-2"]
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "title": "Step Title",
      "description": "Detailed step description with explanations",
      "command": "npm install",
      "code": "const example = 'code';",
      "language": "javascript"
    }
  ]
}

## Generation Guidelines

1. **Overview**:
   - Focus on the "what" and "why" of the project
   - Mention key technologies used
   - Highlight main features or use cases

2. **Prerequisites**:
   - Include version requirements (e.g., Node.js 18+)
   - List required knowledge (e.g., "Basic TypeScript knowledge")
   - Mention necessary tools (e.g., Git, Docker)

3. **Structure**:
   - Describe 5-10 most important directories
   - Describe 5-10 most important files
   - Explain the purpose of each item clearly

4. **Modules** (3-8 modules):
   - Module 1: "Environment Setup" (initial setup, installation)
   - Module 2-N: Core features and concepts (organized logically)
   - Last Module: "Next Steps" (advanced topics, resources)
   - Each module should have 2-6 steps

5. **Steps**:
   - Write in imperative mood ("Install dependencies", not "Installing dependencies")
   - Include either a command OR code example (or both if relevant)
   - For commands, use exact syntax (e.g., `npm install`, `python -m pip install`)
   - For code, include the language for syntax highlighting
   - Descriptions should explain WHY and WHAT, not just repeat the command

## Example Output

{
  "overview": "Next.js is a React framework for building full-stack web applications. It provides server-side rendering, static site generation, and built-in routing.",
  "prerequisites": [
    "Node.js 18.17 or higher",
    "Basic understanding of React and JSX",
    "Familiarity with JavaScript ES6+ syntax",
    "Text editor (VS Code recommended)"
  ],
  "structure": {
    "directories": [
      {"name": "app/", "description": "Main application code using App Router"},
      {"name": "public/", "description": "Static assets (images, fonts, etc.)"},
      {"name": "components/", "description": "Reusable React components"}
    ],
    "files": [
      {"name": "package.json", "description": "Project dependencies and scripts"},
      {"name": "next.config.js", "description": "Next.js configuration"},
      {"name": "tsconfig.json", "description": "TypeScript configuration"}
    ]
  },
  "modules": [
    {
      "id": "module-1",
      "title": "Environment Setup",
      "description": "Set up your development environment and create a new Next.js project",
      "stepIds": ["step-1", "step-2", "step-3"]
    },
    {
      "id": "module-2",
      "title": "Understanding App Router",
      "description": "Learn how Next.js App Router works and how to create pages",
      "stepIds": ["step-4", "step-5"]
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "title": "Install Node.js",
      "description": "Next.js requires Node.js 18.17 or higher. Download and install from nodejs.org.",
      "command": "node --version"
    },
    {
      "id": "step-2",
      "title": "Create Next.js App",
      "description": "Use create-next-app to bootstrap a new project with TypeScript and App Router.",
      "command": "npx create-next-app@latest my-app --typescript --app"
    },
    {
      "id": "step-3",
      "title": "Start Development Server",
      "description": "Run the dev server to see your app at localhost:3000.",
      "command": "cd my-app && npm run dev"
    },
    {
      "id": "step-4",
      "title": "Create Your First Page",
      "description": "In App Router, pages are defined by page.tsx files inside the app directory.",
      "code": "export default function HomePage() {\n  return <h1>Welcome to Next.js!</h1>\n}",
      "language": "typescript"
    },
    {
      "id": "step-5",
      "title": "Add Dynamic Routes",
      "description": "Create dynamic routes using folder names with brackets, e.g., [id].",
      "code": "export default function PostPage({ params }: { params: { id: string } }) {\n  return <div>Post ID: {params.id}</div>\n}",
      "language": "typescript"
    }
  ]
}

## Now Generate

Based on the repository context provided below, generate a complete tutorial following the above guidelines and format.
```

创建 Prompt 构建服务 `backend/app/services/prompt_builder.py`:

```python
from typing import List, Dict
from pathlib import Path
import structlog

logger = structlog.get_logger()

class PromptBuilder:
    """Prompt 构建服务"""

    MAX_CONTEXT_TOKENS = 4000  # 为代码上下文预留的 tokens

    def __init__(self):
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """加载系统 Prompt"""
        prompt_path = Path(__file__).parent.parent / "prompts" / "tutorial_generation.txt"
        return prompt_path.read_text(encoding="utf-8")

    def build_prompt(
        self,
        repo_info: dict,
        readme_content: str,
        code_chunks: List[Dict]
    ) -> List[Dict[str, str]]:
        """构建完整 Prompt"""

        # 构建用户消息
        user_message = self._build_user_message(
            repo_info, readme_content, code_chunks
        )

        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_message}
        ]

    def _build_user_message(
        self,
        repo_info: dict,
        readme_content: str,
        code_chunks: List[Dict]
    ) -> str:
        """构建用户消息"""
        parts = []

        # 1. Repository Metadata
        parts.append("## Repository Metadata")
        parts.append(f"Name: {repo_info['owner']}/{repo_info['name']}")
        parts.append(f"Description: {repo_info.get('description', 'N/A')}")
        parts.append(f"Language: {repo_info.get('language', 'N/A')}")
        parts.append(f"Stars: {repo_info.get('stars', 0)}")
        parts.append("")

        # 2. README Content
        if readme_content:
            parts.append("## README Content")
            # 截取前 2000 字符
            truncated_readme = readme_content[:2000]
            if len(readme_content) > 2000:
                truncated_readme += "\n... (truncated)"
            parts.append(truncated_readme)
            parts.append("")

        # 3. Relevant Code Snippets
        parts.append("## Relevant Code Snippets")
        parts.append("")

        for i, chunk in enumerate(code_chunks[:15], 1):  # 最多 15 个片段
            metadata = chunk["metadata"]
            parts.append(f"### Snippet {i}: {metadata['file_path']}")
            parts.append(f"Language: {metadata['language']}")
            parts.append(f"Lines: {metadata['start_line']}-{metadata['end_line']}")
            parts.append(f"```{metadata['language']}")
            parts.append(chunk["content"][:500])  # 每个片段最多 500 字符
            parts.append("```")
            parts.append("")

        return "\n".join(parts)
```

---

### Task 4: 实现 LLM 调用服务
**预估**: 2 小时

创建 `backend/app/services/llm.py`:

```python
from typing import List, Dict, Optional
from openai import AsyncOpenAI
import structlog
import json
from app.core.config import settings

logger = structlog.get_logger()

class LLMService:
    """LLM 调用服务"""

    MODEL = "gpt-4-turbo-preview"
    TEMPERATURE = 0.3
    MAX_TOKENS = 4000
    MAX_RETRIES = 3

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_tutorial(
        self,
        messages: List[Dict[str, str]]
    ) -> Dict:
        """生成教程"""
        for attempt in range(self.MAX_RETRIES):
            try:
                response = await self.client.chat.completions.create(
                    model=self.MODEL,
                    messages=messages,
                    temperature=self.TEMPERATURE,
                    max_tokens=self.MAX_TOKENS,
                    response_format={"type": "json_object"}
                )

                content = response.choices[0].message.content
                tutorial_data = json.loads(content)

                logger.info(
                    "tutorial_generated",
                    model=self.MODEL,
                    tokens_used=response.usage.total_tokens
                )

                return tutorial_data

            except json.JSONDecodeError as e:
                logger.error(
                    "llm_json_parse_error",
                    attempt=attempt + 1,
                    error=str(e),
                    content=content[:200]
                )

                if attempt == self.MAX_RETRIES - 1:
                    raise ValueError(f"Failed to parse LLM output as JSON: {e}")

            except Exception as e:
                logger.warning(
                    "llm_retry",
                    attempt=attempt + 1,
                    error=str(e)
                )

                if attempt == self.MAX_RETRIES - 1:
                    raise

                # 指数退避
                import asyncio
                await asyncio.sleep(2 ** attempt)

        raise RuntimeError("Failed to generate tutorial after retries")

    def validate_tutorial_structure(self, data: dict) -> bool:
        """验证教程结构"""
        required_fields = [
            "overview", "prerequisites", "structure",
            "modules", "steps"
        ]

        for field in required_fields:
            if field not in data:
                logger.error("missing_required_field", field=field)
                return False

        # 验证 modules 和 steps 引用一致性
        step_ids = {step["id"] for step in data.get("steps", [])}
        for module in data.get("modules", []):
            for step_id in module.get("stepIds", []):
                if step_id not in step_ids:
                    logger.error(
                        "invalid_step_reference",
                        module=module["id"],
                        step_id=step_id
                    )
                    return False

        return True
```

**测试**: 创建 `backend/tests/test_llm.py` (Mock OpenAI API)

---

### Task 5: 实现教程生成编排服务
**预估**: 2.5 小时

创建 `backend/app/services/tutorial_generation.py`:

```python
from typing import Dict, Optional
from pathlib import Path
import structlog
from app.services.vector_store import VectorStore
from app.services.prompt_builder import PromptBuilder
from app.services.llm import LLMService
from app.services.github_repo import GitHubRepoService
from app.schemas.tutorial import (
    TutorialData, TutorialGenerationStatus, RepoInfo
)

logger = structlog.get_logger()

class TutorialGenerationService:
    """教程生成编排服务"""

    def __init__(self):
        self.vector_store = VectorStore()
        self.prompt_builder = PromptBuilder()
        self.llm = LLMService()
        self.github_service = GitHubRepoService()
        self.tasks: Dict[str, TutorialGenerationStatus] = {}
        self.cache: Dict[str, TutorialData] = {}  # 简单内存缓存

    async def generate_tutorial(
        self,
        task_id: str,
        repo_url: str,
        force: bool = False
    ) -> None:
        """生成教程（异步任务）"""
        try:
            # 更新状态
            self.tasks[task_id] = TutorialGenerationStatus(
                task_id=task_id,
                status="processing",
                progress={"stage": "initializing"}
            )

            # 解析仓库 URL
            owner, repo_name = self.github_service.parse_repo_url(repo_url)
            cache_key = f"{owner}:{repo_name}"

            # 检查缓存
            if not force and cache_key in self.cache:
                logger.info("tutorial_cache_hit", repo=f"{owner}/{repo_name}")
                self.tasks[task_id] = TutorialGenerationStatus(
                    task_id=task_id,
                    status="completed",
                    tutorial=self.cache[cache_key]
                )
                return

            # 1. 获取仓库信息
            logger.info("fetching_repo_info", repo=f"{owner}/{repo_name}")
            repo_info_raw = await self.github_service.get_repo_info(owner, repo_name)

            repo_info = RepoInfo(
                owner=owner,
                name=repo_name,
                description=repo_info_raw.get("description"),
                stars=repo_info_raw.get("stars", 0),
                language=repo_info_raw.get("language"),
                url=repo_url
            )

            self.tasks[task_id].progress = {"stage": "retrieving_context"}

            # 2. 获取 README
            readme_content = await self.vector_store.get_readme_content(
                owner, repo_name
            )

            # 3. 向量检索相关代码
            logger.info("searching_relevant_code")
            query = f"How to use {repo_name}? Main features and examples."
            code_chunks = await self.vector_store.search_similar_chunks(
                owner, repo_name, query, top_k=20
            )

            if not code_chunks:
                raise ValueError(
                    f"No code chunks found for {owner}/{repo_name}. "
                    "Repository may not be vectorized."
                )

            self.tasks[task_id].progress = {"stage": "building_prompt"}

            # 4. 构建 Prompt
            logger.info("building_prompt")
            messages = self.prompt_builder.build_prompt(
                repo_info.dict(),
                readme_content or "",
                code_chunks
            )

            self.tasks[task_id].progress = {"stage": "generating_tutorial"}

            # 5. 调用 LLM
            logger.info("calling_llm")
            tutorial_raw = await self.llm.generate_tutorial(messages)

            # 6. 验证和解析
            logger.info("validating_output")
            if not self.llm.validate_tutorial_structure(tutorial_raw):
                raise ValueError("Generated tutorial has invalid structure")

            # 7. 构建完整 TutorialData
            tutorial_data = TutorialData(
                repo=repo_info,
                overview=tutorial_raw["overview"],
                prerequisites=tutorial_raw["prerequisites"],
                structure=tutorial_raw["structure"],
                modules=tutorial_raw["modules"],
                steps=tutorial_raw["steps"]
            )

            # 8. 缓存结果
            self.cache[cache_key] = tutorial_data

            # 9. 更新状态为完成
            self.tasks[task_id] = TutorialGenerationStatus(
                task_id=task_id,
                status="completed",
                tutorial=tutorial_data
            )

            logger.info(
                "tutorial_generation_completed",
                task_id=task_id,
                repo=f"{owner}/{repo_name}",
                modules=len(tutorial_data.modules),
                steps=len(tutorial_data.steps)
            )

        except Exception as e:
            logger.error(
                "tutorial_generation_failed",
                task_id=task_id,
                error=str(e),
                exc_info=True
            )

            self.tasks[task_id] = TutorialGenerationStatus(
                task_id=task_id,
                status="failed",
                error=str(e)
            )

    def get_task_status(self, task_id: str) -> TutorialGenerationStatus:
        """获取任务状态"""
        return self.tasks.get(
            task_id,
            TutorialGenerationStatus(task_id=task_id, status="pending")
        )
```

**测试**: 创建 `backend/tests/test_tutorial_generation.py`

---

### Task 6: 创建 API 路由
**预估**: 1 小时

创建 `backend/app/api/routes/tutorial.py`:

```python
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from app.schemas.tutorial import (
    GenerateTutorialRequest,
    TutorialGenerationStatus
)
from app.services.tutorial_generation import TutorialGenerationService
import uuid

router = APIRouter(prefix="/api/tutorial", tags=["tutorial"])

tutorial_service = TutorialGenerationService()

@router.post("/generate", response_model=dict)
async def generate_tutorial(
    request: GenerateTutorialRequest,
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Force regenerate")
):
    """生成教程"""
    try:
        task_id = str(uuid.uuid4())

        background_tasks.add_task(
            tutorial_service.generate_tutorial,
            task_id,
            request.repo_url,
            force or request.force
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
async def get_tutorial_status(task_id: str):
    """获取教程生成状态"""
    status = tutorial_service.get_task_status(task_id)

    response = {
        "ok": True,
        "data": status.dict(exclude_none=True)
    }

    return response

# 便捷端点：直接获取教程（阻塞）
@router.get("/by-url", response_model=dict)
async def get_tutorial_by_url(
    repo_url: str = Query(..., description="Repository URL"),
    force: bool = Query(False, description="Force regenerate")
):
    """直接获取教程（同步）"""
    import uuid

    task_id = str(uuid.uuid4())

    # 同步执行
    await tutorial_service.generate_tutorial(task_id, repo_url, force)

    status = tutorial_service.get_task_status(task_id)

    if status.status == "failed":
        raise HTTPException(status_code=500, detail=status.error)

    return {
        "ok": True,
        "data": status.tutorial.dict() if status.tutorial else None
    }
```

在 `backend/app/api/router.py` 中注册路由：

```python
from app.api.routes import tutorial

api_router.include_router(tutorial.router)
```

---

### Task 7: 创建 Prompt 目录和模板文件
**预估**: 30 分钟

```bash
mkdir -p backend/app/prompts
# 将 Task 3 中的 prompt 内容写入 backend/app/prompts/tutorial_generation.txt
```

---

### Task 8: 单元测试
**预估**: 3 小时

创建测试文件：
- `backend/tests/test_prompt_builder.py`: 测试 Prompt 构建逻辑
- `backend/tests/test_llm.py`: Mock OpenAI API 测试
- `backend/tests/test_tutorial_generation.py`: 集成测试
- `backend/tests/test_vector_store_search.py`: 测试向量检索

示例测试 (`backend/tests/test_llm.py`):

```python
import pytest
from unittest.mock import AsyncMock, patch
from app.services.llm import LLMService

@pytest.mark.asyncio
async def test_generate_tutorial_success():
    """测试成功生成教程"""
    llm = LLMService()

    mock_response = {
        "overview": "Test overview" * 20,  # 确保长度足够
        "prerequisites": ["Node.js", "Git"],
        "structure": {"directories": [], "files": []},
        "modules": [
            {
                "id": "m1",
                "title": "Module 1",
                "description": "Desc",
                "stepIds": ["s1"]
            }
        ],
        "steps": [
            {
                "id": "s1",
                "title": "Step 1",
                "description": "Desc",
                "command": "npm install"
            }
        ]
    }

    with patch.object(llm.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
        mock_create.return_value.choices[0].message.content = json.dumps(mock_response)
        mock_create.return_value.usage.total_tokens = 1500

        messages = [{"role": "user", "content": "Test"}]
        result = await llm.generate_tutorial(messages)

        assert result["overview"] == mock_response["overview"]
        assert len(result["modules"]) == 1
```

运行测试:
```bash
cd backend
poetry run pytest tests/ -v --cov=app --cov-report=term-missing
```

---

### Task 9: 集成测试（端到端）
**预估**: 1.5 小时

创建 `backend/tests/integration/test_tutorial_e2e.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_tutorial_generation_e2e():
    """端到端测试：教程生成完整流程"""

    # 前提：仓库已向量化（假设测试环境已准备）

    # 1. 启动教程生成
    response = client.post(
        "/api/tutorial/generate",
        json={"repo_url": "https://github.com/octocat/Hello-World"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    task_id = data["data"]["task_id"]

    # 2. 轮询状态
    import time
    for _ in range(60):  # 最多等待 60 秒
        response = client.get(f"/api/tutorial/{task_id}")
        status_data = response.json()["data"]
        status = status_data["status"]

        if status == "completed":
            break
        elif status == "failed":
            pytest.fail(f"Tutorial generation failed: {status_data.get('error')}")

        time.sleep(1)

    assert status == "completed"

    # 3. 验证教程数据
    tutorial = status_data["tutorial"]
    assert tutorial["repo"]["owner"] == "octocat"
    assert tutorial["repo"]["name"] == "Hello-World"
    assert len(tutorial["overview"]) >= 200
    assert len(tutorial["prerequisites"]) >= 2
    assert len(tutorial["modules"]) >= 3
    assert len(tutorial["steps"]) >= 5

    # 4. 验证 modules 和 steps 引用一致
    step_ids = {s["id"] for s in tutorial["steps"]}
    for module in tutorial["modules"]:
        for step_id in module["stepIds"]:
            assert step_id in step_ids
```

---

### Task 10: 文档更新
**预估**: 30 分钟

更新 `backend/README.md`:

```markdown
## 教程生成服务

### 生成教程（异步）

**POST** `/api/tutorial/generate`

Request:
\`\`\`json
{
  "repo_url": "https://github.com/facebook/react",
  "force": false
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

### 查询生成状态

**GET** `/api/tutorial/{task_id}`

Response:
\`\`\`json
{
  "ok": true,
  "data": {
    "task_id": "...",
    "status": "completed",
    "tutorial": { /* TutorialData */ }
  }
}
\`\`\`

### 直接获取教程（同步）

**GET** `/api/tutorial/by-url?repo_url=https://github.com/...`

Response:
\`\`\`json
{
  "ok": true,
  "data": { /* TutorialData */ }
}
\`\`\`
```

---

### Task 11: 性能优化和缓存
**预估**: 1 小时

在 `TutorialGenerationService` 中优化缓存机制（考虑使用 Redis）：

```python
# 可选：使用 Redis 作为缓存
import redis.asyncio as redis

class TutorialGenerationService:
    def __init__(self):
        # ...
        self.redis = redis.from_url("redis://localhost:6379")

    async def _get_from_cache(self, cache_key: str) -> Optional[TutorialData]:
        """从 Redis 获取缓存"""
        cached = await self.redis.get(f"tutorial:{cache_key}")
        if cached:
            return TutorialData.parse_raw(cached)
        return None

    async def _set_cache(self, cache_key: str, tutorial: TutorialData):
        """设置 Redis 缓存（24 小时）"""
        await self.redis.setex(
            f"tutorial:{cache_key}",
            86400,  # 24 hours
            tutorial.json()
        )
```

---

### Task 12: Prompt 版本控制和 A/B 测试支持
**预估**: 1 小时

创建 `backend/app/prompts/` 目录结构：

```
backend/app/prompts/
├── tutorial_generation_v1.txt
├── tutorial_generation_v2.txt  # 实验版本
└── active_version.txt          # 当前使用的版本号
```

在 `PromptBuilder` 中支持版本选择：

```python
class PromptBuilder:
    def __init__(self, version: str = "v1"):
        self.version = version
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = (
            Path(__file__).parent.parent
            / "prompts"
            / f"tutorial_generation_{self.version}.txt"
        )
        return prompt_path.read_text(encoding="utf-8")
```

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| LLM 输出格式不稳定 | 高 | 高 | 使用 JSON Mode、严格 Prompt、输出验证 |
| OpenAI API 费用高 | 中 | 高 | 缓存机制、限制并发、监控使用量 |
| 生成质量不佳 | 中 | 高 | Prompt 迭代优化、Few-shot Examples、人工审核 |
| 向量检索结果不相关 | 中 | 中 | 优化检索策略、调整相似度阈值 |
| 超时问题 | 中 | 中 | 异步处理、合理的超时设置 |

### 依赖关系

**前置依赖**:
- STORY-2.2: 内容处理与向量化服务（需要向量数据）

**后续依赖**:
- STORY-1.2: 前端基础应用（需要替换 Mock API）
- STORY-2.4: 学习路径生成（可能复用部分逻辑）

---

## ✅ Definition of Done

- [ ] 所有 12 个验收标准通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过（端到端教程生成）
- [ ] API 文档更新
- [ ] Prompt 模板文档化
- [ ] 代码符合 `coding-standards.md` 规范
- [ ] Code Review 通过
- [ ] 成功为测试仓库生成教程（质量人工验证）
- [ ] LLM 输出验证逻辑完善
- [ ] 缓存机制工作正常
- [ ] 错误处理完善（API 错误、格式错误等）
- [ ] 性能测试：生成单个教程 ≤ 60 秒
- [ ] 日志记录完善

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1: 数据模型设计
- [ ] Task 2: 向量检索服务
- [ ] Task 3: Prompt 模板
- [ ] Task 4: LLM 调用服务
- [ ] Task 5: 教程生成编排
- [ ] Task 6: API 路由
- [ ] Task 7-12: Prompt 文件、测试、文档、优化

#### 技术决策
- LLM 模型选择: gpt-4-turbo-preview（平衡质量和成本）
- JSON Mode: 强制结构化输出
- 缓存策略: 内存缓存（MVP）+ Redis（可选）
- Prompt 设计: System + Few-shot + 动态上下文注入

#### Prompt 迭代记录
- v1: 初始版本（Task 3 中的模板）
- v2: (待优化) 增加更多 Few-shot Examples，优化指令清晰度

#### 遇到的问题
_(记录实际开发中遇到的问题和解决方案)_

#### 测试结果
_(记录测试覆盖率和生成质量评估)_

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 2.2: 内容向量化](./story-2.2-content-vectorization.md)
- [Story 1.2: 前端基础应用](./story-1.2-frontend-foundation.md)
- [架构文档](../architecture.md)
- [UX 规格](../ux/ux-spec.md)
- [技术栈](../architecture/tech-stack.md)
- [编码规范](../architecture/coding-standards.md)
- [OpenAI Chat API](https://platform.openai.com/docs/guides/chat)
- [OpenAI JSON Mode](https://platform.openai.com/docs/guides/text-generation/json-mode)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
