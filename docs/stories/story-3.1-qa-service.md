# Story 3.1: 问答服务实现

## 📋 Story 元信息

- **Story ID**: STORY-3.1
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 3 - 问答功能 + 体验优化
- **状态**: Draft
- **优先级**: High
- **预估时间**: 2-3 天
- **负责人**: Dev Agent
- **依赖**: STORY-2.2 (向量化服务), STORY-2.3 (RAG 服务)

---

## 📖 User Story

**As a** 用户
**I want** 在学习过程中提出具体问题并获得基于仓库代码的准确回答
**So that** 我可以快速解决学习中的疑惑，深入理解代码实现

---

## 🎯 背景与上下文

### 项目上下文
在完成教程生成后，用户在学习过程中会遇到具体问题。本 Story 需要实现：
1. 基于 RAG 的问答功能，从向量数据库检索相关代码
2. 使用 LLM 生成针对性的回答
3. 支持上下文追踪（会话历史）
4. 提供代码引用和定位功能

### 技术上下文
- **检索策略**:
  - 将用户问题向量化
  - 从 ChromaDB 检索 Top-K 相关代码片段
  - 结合用户当前学习的 module/step 上下文
- **LLM 模型**: `gpt-4-turbo-preview` 或 `gpt-3.5-turbo`（成本考虑）
- **会话管理**:
  - 保留最近 N 轮对话（如 5 轮）
  - 使用滑动窗口控制 token 数量
- **输出格式**: Markdown with 代码高亮

### 迭代目标
实现完整的问答功能，支持前端集成，提供良好的用户体验。

---

## ✅ 验收标准

### 功能性需求

1. **AC-3.1.1**: 问答服务能够接收用户问题并检索相关代码
   - 输入: 问题文本 + 仓库标识 + (可选) 当前 module/step
   - 检索: Top-10 相关代码片段
   - 过滤: 相似度阈值 ≥ 0.65

2. **AC-3.1.2**: 构建包含上下文的 Prompt
   - System Prompt: 定义助手角色（代码导师）
   - 用户上下文: 当前学习位置（module, step）
   - 代码上下文: 检索到的相关代码片段
   - 会话历史: 最近 3-5 轮对话

3. **AC-3.1.3**: LLM 生成高质量回答
   - 回答准确性: 基于实际代码，不编造
   - 回答结构: 包含解释 + 代码示例 + 相关文件引用
   - 代码格式: 使用 Markdown 代码块，包含语法高亮
   - 长度控制: 200-800 字符

4. **AC-3.1.4**: 提供代码引用功能
   ```typescript
   interface QAResponse {
     answer: string;  // Markdown 格式
     references: CodeReference[];  // 相关代码引用
     relatedSteps: string[];  // 建议查看的 steps
   }

   interface CodeReference {
     filePath: string;
     startLine: number;
     endLine: number;
     snippet: string;
   }
   ```

5. **AC-3.1.5**: 支持会话管理
   - 会话 ID 生成和跟踪
   - 会话历史存储（内存或 Redis）
   - 会话过期: 30 分钟无活动后清除
   - 每个会话最多保留最近 10 轮对话

6. **AC-3.1.6**: API 端点设计符合规范
   ```
   POST /api/qa/ask
   Body: {
     "repo_url": "https://github.com/...",
     "question": "How does authentication work?",
     "session_id": "uuid...",  // 可选
     "context": {
       "current_module_id": "module-2",
       "current_step_id": "step-5"
     }
   }
   Response: {
     "ok": true,
     "data": {
       "answer": "...",
       "references": [...],
       "relatedSteps": [...],
       "session_id": "uuid..."
     }
   }

   GET /api/qa/history/{session_id}
   Response: {
     "ok": true,
     "data": {
       "messages": [
         {"role": "user", "content": "..."},
         {"role": "assistant", "content": "..."}
       ]
     }
   }
   ```

7. **AC-3.1.7**: 智能问题理解
   - 识别问题类型: "如何使用"、"为什么"、"这段代码做什么"
   - 提取关键词和实体（如函数名、类名）
   - 上下文补全（如果问题模糊，使用学习位置补充）

8. **AC-3.1.8**: 错误处理
   - 仓库未向量化: 提示用户先生成教程
   - 找不到相关代码: 返回通用回答或建议
   - LLM 调用失败: 重试或返回友好错误

### 质量需求

9. **AC-3.1.9**: 性能满足要求
   - 单次问答响应时间 ≤ 5 秒（P95）
   - 向量检索 ≤ 1 秒
   - LLM 调用 ≤ 3 秒
   - 支持 5 个并发会话

10. **AC-3.1.10**: 回答质量保证
    - 准确性: 基于实际代码，不臆测
    - 相关性: 回答与问题直接相关
    - 可读性: 结构清晰，代码格式正确
    - 实用性: 提供可操作的建议或示例

11. **AC-3.1.11**: 单元测试覆盖率 ≥ 80%
    - 测试问题理解和关键词提取
    - 测试 Prompt 构建
    - 测试 LLM 输出解析（Mock API）
    - 测试会话管理

12. **AC-3.1.12**: 代码符合项目规范
    - 遵循 `coding-standards.md`
    - 使用 Type Hints
    - 使用 Pydantic 进行数据验证
    - 结构化日志

---

## 🔧 技术实现任务

### Task 1: 设计数据模型和 Schemas
**预估**: 30 分钟

在 `backend/app/schemas/` 中创建问答数据模型：

```python
# backend/app/schemas/qa.py
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class CodeReference(BaseModel):
    """代码引用"""
    filePath: str = Field(..., alias="filePath")
    startLine: int = Field(..., alias="startLine")
    endLine: int = Field(..., alias="endLine")
    snippet: str
    language: str = "python"

    class Config:
        populate_by_name = True

class QuestionContext(BaseModel):
    """问题上下文"""
    current_module_id: Optional[str] = Field(None, alias="currentModuleId")
    current_step_id: Optional[str] = Field(None, alias="currentStepId")

    class Config:
        populate_by_name = True

class AskQuestionRequest(BaseModel):
    """提问请求"""
    repo_url: str = Field(..., alias="repoUrl")
    question: str = Field(..., min_length=5, max_length=500)
    session_id: Optional[str] = Field(None, alias="sessionId")
    context: Optional[QuestionContext] = None

    class Config:
        populate_by_name = True

class QAResponse(BaseModel):
    """问答响应"""
    answer: str
    references: List[CodeReference] = []
    relatedSteps: List[str] = Field([], alias="relatedSteps")
    session_id: str = Field(..., alias="sessionId")

    class Config:
        populate_by_name = True

class ChatMessage(BaseModel):
    """聊天消息"""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[str] = None

class ConversationHistory(BaseModel):
    """会话历史"""
    session_id: str = Field(..., alias="sessionId")
    messages: List[ChatMessage] = []
    repo: str
    created_at: str = Field(..., alias="createdAt")
    last_activity: str = Field(..., alias="lastActivity")

    class Config:
        populate_by_name = True
```

---

### Task 2: 实现问题理解服务
**预估**: 1 小时

创建 `backend/app/services/question_analyzer.py`:

```python
from typing import List, Set
import re
import structlog

logger = structlog.get_logger()

class QuestionAnalyzer:
    """问题分析服务"""

    # 问题类型关键词
    HOW_TO_KEYWORDS = ["how", "如何", "怎么", "怎样"]
    WHY_KEYWORDS = ["why", "为什么", "为何"]
    WHAT_KEYWORDS = ["what", "是什么", "什么是", "这是"]

    def __init__(self):
        pass

    def analyze_question(self, question: str) -> dict:
        """分析问题"""
        question_lower = question.lower()

        # 1. 识别问题类型
        question_type = self._identify_type(question_lower)

        # 2. 提取关键词
        keywords = self._extract_keywords(question)

        # 3. 提取代码实体（如函数名、类名）
        entities = self._extract_entities(question)

        logger.info(
            "question_analyzed",
            type=question_type,
            keywords=keywords[:5],  # 只记录前5个
            entities=entities
        )

        return {
            "type": question_type,
            "keywords": keywords,
            "entities": entities,
            "original": question
        }

    def _identify_type(self, question: str) -> str:
        """识别问题类型"""
        if any(kw in question for kw in self.HOW_TO_KEYWORDS):
            return "how_to"
        elif any(kw in question for kw in self.WHY_KEYWORDS):
            return "why"
        elif any(kw in question for kw in self.WHAT_KEYWORDS):
            return "what"
        else:
            return "general"

    def _extract_keywords(self, question: str) -> List[str]:
        """提取关键词（简单版）"""
        # 移除停用词
        stop_words = {
            "how", "what", "why", "is", "the", "a", "an", "in", "on", "at",
            "如何", "是什么", "为什么", "这个", "那个", "的", "了", "吗"
        }

        # 分词（简单按空格和标点）
        words = re.findall(r'\b\w+\b', question.lower())

        keywords = [
            word for word in words
            if word not in stop_words and len(word) > 2
        ]

        return keywords[:10]  # 最多10个关键词

    def _extract_entities(self, question: str) -> Set[str]:
        """提取代码实体（函数名、类名等）"""
        # 简单的驼峰式和下划线式识别
        # 如: "useState", "use_state"
        entities = set()

        # 驼峰式: UserProfile, useState
        camel_case = re.findall(r'\b[a-z]+[A-Z]\w*\b|\b[A-Z][a-z]+[A-Z]\w*\b', question)
        entities.update(camel_case)

        # 下划线式: user_profile, get_data
        snake_case = re.findall(r'\b[a-z]+_[a-z_]+\b', question)
        entities.update(snake_case)

        # 反引号包裹: `function_name`
        backtick = re.findall(r'`(\w+)`', question)
        entities.update(backtick)

        return entities
```

---

### Task 3: 实现问答 Prompt 构建服务
**预估**: 1.5 小时

创建 `backend/app/prompts/qa_system.txt`:

```text
You are a helpful coding assistant and tutor. Your role is to answer questions about a specific GitHub repository based on its actual source code.

## Guidelines

1. **Accuracy**: Base your answers ONLY on the provided code snippets and repository context. Do not make assumptions or hallucinate code that doesn't exist.

2. **Clarity**: Explain concepts clearly, using simple language. Assume the user is learning.

3. **Code Examples**: When relevant, include code snippets from the repository with proper formatting:
   ```language
   code here
   ```

4. **File References**: Mention specific files and line numbers when referencing code:
   - "In `src/index.ts` (lines 10-20)..."
   - "The `UserService` class in `services/user.service.ts`..."

5. **Structure**: Organize your answer:
   - **Direct Answer**: Start with a concise answer to the question
   - **Explanation**: Provide context and details
   - **Code Example**: Show relevant code if applicable
   - **Related Concepts**: Mention related files or steps if helpful

6. **Honesty**: If the provided code snippets don't contain enough information to answer the question, say so and suggest what to look for.

## Output Format

Your answer should be in Markdown format, using proper formatting for code blocks, headers, and lists.
```

创建 `backend/app/services/qa_prompt_builder.py`:

```python
from typing import List, Dict, Optional
from pathlib import Path
import structlog
from app.schemas.qa import QuestionContext, ChatMessage

logger = structlog.get_logger()

class QAPromptBuilder:
    """问答 Prompt 构建服务"""

    MAX_CONTEXT_SNIPPETS = 8
    MAX_HISTORY_TURNS = 5

    def __init__(self):
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = Path(__file__).parent.parent / "prompts" / "qa_system.txt"
        return prompt_path.read_text(encoding="utf-8")

    def build_messages(
        self,
        question: str,
        question_analysis: dict,
        code_snippets: List[Dict],
        repo_context: dict,
        user_context: Optional[QuestionContext] = None,
        history: List[ChatMessage] = None
    ) -> List[Dict[str, str]]:
        """构建完整消息列表"""

        messages = [
            {"role": "system", "content": self.system_prompt}
        ]

        # 添加会话历史（保留最近N轮）
        if history:
            for msg in history[-self.MAX_HISTORY_TURNS * 2:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # 构建用户消息
        user_message = self._build_user_message(
            question,
            question_analysis,
            code_snippets,
            repo_context,
            user_context
        )

        messages.append({"role": "user", "content": user_message})

        return messages

    def _build_user_message(
        self,
        question: str,
        question_analysis: dict,
        code_snippets: List[Dict],
        repo_context: dict,
        user_context: Optional[QuestionContext]
    ) -> str:
        """构建用户消息"""
        parts = []

        # 1. Repository Context
        parts.append("## Repository Context")
        parts.append(f"Repository: {repo_context['owner']}/{repo_context['name']}")
        parts.append(f"Language: {repo_context.get('language', 'Unknown')}")
        parts.append("")

        # 2. User Learning Context
        if user_context and user_context.current_step_id:
            parts.append("## Current Learning Position")
            parts.append(f"Module: {user_context.current_module_id or 'N/A'}")
            parts.append(f"Step: {user_context.current_step_id}")
            parts.append("")

        # 3. Relevant Code Snippets
        parts.append("## Relevant Code Snippets")
        parts.append("")

        for i, snippet in enumerate(code_snippets[:self.MAX_CONTEXT_SNIPPETS], 1):
            metadata = snippet["metadata"]
            parts.append(f"### Snippet {i}: {metadata['file_path']}")
            parts.append(f"Lines: {metadata['start_line']}-{metadata['end_line']}")
            parts.append(f"```{metadata['language']}")
            parts.append(snippet["content"])
            parts.append("```")
            parts.append("")

        # 4. Question
        parts.append("## Question")
        parts.append(question)
        parts.append("")

        parts.append("Please provide a helpful answer based on the code snippets above.")

        return "\n".join(parts)
```

---

### Task 4: 实现会话管理服务
**预估**: 1 hour

创建 `backend/app/services/session_manager.py`:

```python
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import uuid
import structlog
from app.schemas.qa import ChatMessage, ConversationHistory

logger = structlog.get_logger()

class SessionManager:
    """会话管理服务"""

    SESSION_TIMEOUT = timedelta(minutes=30)
    MAX_MESSAGES_PER_SESSION = 20

    def __init__(self):
        self.sessions: Dict[str, ConversationHistory] = {}

    def create_session(self, repo: str) -> str:
        """创建新会话"""
        session_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        self.sessions[session_id] = ConversationHistory(
            sessionId=session_id,
            messages=[],
            repo=repo,
            createdAt=now,
            lastActivity=now
        )

        logger.info("session_created", session_id=session_id, repo=repo)
        return session_id

    def get_session(self, session_id: str) -> Optional[ConversationHistory]:
        """获取会话"""
        session = self.sessions.get(session_id)

        if not session:
            return None

        # 检查是否过期
        last_activity = datetime.fromisoformat(session.last_activity.rstrip("Z"))
        if datetime.utcnow() - last_activity > self.SESSION_TIMEOUT:
            logger.info("session_expired", session_id=session_id)
            self.delete_session(session_id)
            return None

        return session

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> None:
        """添加消息到会话"""
        session = self.get_session(session_id)

        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # 限制消息数量
        if len(session.messages) >= self.MAX_MESSAGES_PER_SESSION:
            # 删除最早的一对（user + assistant）
            session.messages = session.messages[2:]

        message = ChatMessage(
            role=role,
            content=content,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

        session.messages.append(message)
        session.last_activity = datetime.utcnow().isoformat() + "Z"

        logger.debug(
            "message_added",
            session_id=session_id,
            role=role,
            total_messages=len(session.messages)
        )

    def delete_session(self, session_id: str) -> None:
        """删除会话"""
        self.sessions.pop(session_id, None)
        logger.info("session_deleted", session_id=session_id)

    def cleanup_expired_sessions(self) -> int:
        """清理过期会话"""
        now = datetime.utcnow()
        expired = []

        for session_id, session in self.sessions.items():
            last_activity = datetime.fromisoformat(session.last_activity.rstrip("Z"))
            if now - last_activity > self.SESSION_TIMEOUT:
                expired.append(session_id)

        for session_id in expired:
            self.delete_session(session_id)

        if expired:
            logger.info("sessions_cleaned_up", count=len(expired))

        return len(expired)
```

---

### Task 5: 实现问答服务编排
**预估**: 2 小时

创建 `backend/app/services/qa_service.py`:

```python
from typing import Optional
import structlog
from app.services.vector_store import VectorStore
from app.services.question_analyzer import QuestionAnalyzer
from app.services.qa_prompt_builder import QAPromptBuilder
from app.services.llm import LLMService
from app.services.session_manager import SessionManager
from app.services.github_repo import GitHubRepoService
from app.schemas.qa import (
    AskQuestionRequest,
    QAResponse,
    CodeReference,
    QuestionContext
)

logger = structlog.get_logger()

class QAService:
    """问答服务"""

    def __init__(self):
        self.vector_store = VectorStore()
        self.question_analyzer = QuestionAnalyzer()
        self.prompt_builder = QAPromptBuilder()
        self.llm = LLMService()
        self.session_manager = SessionManager()
        self.github_service = GitHubRepoService()

    async def ask_question(
        self,
        request: AskQuestionRequest
    ) -> QAResponse:
        """处理问答请求"""
        try:
            # 1. 解析仓库 URL
            owner, repo_name = self.github_service.parse_repo_url(request.repo_url)
            repo_full_name = f"{owner}/{repo_name}"

            # 2. 获取或创建会话
            session_id = request.session_id
            if not session_id or not self.session_manager.get_session(session_id):
                session_id = self.session_manager.create_session(repo_full_name)

            session = self.session_manager.get_session(session_id)

            # 3. 分析问题
            logger.info("analyzing_question", question=request.question[:50])
            question_analysis = self.question_analyzer.analyze_question(
                request.question
            )

            # 4. 向量检索相关代码
            logger.info("searching_relevant_code")
            code_snippets = await self.vector_store.search_similar_chunks(
                owner,
                repo_name,
                request.question,
                top_k=10,
                min_similarity=0.65
            )

            if not code_snippets:
                # 未找到相关代码
                return QAResponse(
                    answer="抱歉，我无法在仓库代码中找到与您问题相关的内容。请尝试：\n\n"
                          "1. 重新表述您的问题\n"
                          "2. 确保仓库已完成向量化\n"
                          "3. 查看教程中的相关章节",
                    references=[],
                    relatedSteps=[],
                    sessionId=session_id
                )

            # 5. 获取仓库上下文
            repo_info = await self.github_service.get_repo_info(owner, repo_name)

            # 6. 构建 Prompt
            logger.info("building_prompt")
            messages = self.prompt_builder.build_messages(
                request.question,
                question_analysis,
                code_snippets,
                {
                    "owner": owner,
                    "name": repo_name,
                    "language": repo_info.get("language")
                },
                request.context,
                session.messages if session else []
            )

            # 7. 调用 LLM
            logger.info("calling_llm_for_qa")
            answer = await self.llm.generate_qa_answer(messages)

            # 8. 提取代码引用
            references = self._extract_references(code_snippets[:3])

            # 9. 保存会话
            self.session_manager.add_message(session_id, "user", request.question)
            self.session_manager.add_message(session_id, "assistant", answer)

            # 10. 返回响应
            logger.info(
                "qa_completed",
                session_id=session_id,
                answer_length=len(answer)
            )

            return QAResponse(
                answer=answer,
                references=references,
                relatedSteps=[],  # TODO: 实现相关 steps 推荐
                sessionId=session_id
            )

        except Exception as e:
            logger.error("qa_failed", error=str(e), exc_info=True)
            raise

    def _extract_references(self, snippets: list) -> list[CodeReference]:
        """提取代码引用"""
        references = []

        for snippet in snippets:
            metadata = snippet["metadata"]
            references.append(CodeReference(
                filePath=metadata["file_path"],
                startLine=metadata["start_line"],
                endLine=metadata["end_line"],
                snippet=snippet["content"][:200],  # 截取前200字符
                language=metadata["language"]
            ))

        return references
```

在 `backend/app/services/llm.py` 中添加 QA 方法：

```python
class LLMService:
    # ... 现有代码 ...

    async def generate_qa_answer(self, messages: List[Dict[str, str]]) -> str:
        """生成问答回答"""
        for attempt in range(self.MAX_RETRIES):
            try:
                response = await self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=messages,
                    temperature=0.3,
                    max_tokens=1000
                )

                answer = response.choices[0].message.content

                logger.info(
                    "qa_answer_generated",
                    tokens_used=response.usage.total_tokens
                )

                return answer

            except Exception as e:
                logger.warning("llm_retry_qa", attempt=attempt + 1, error=str(e))

                if attempt == self.MAX_RETRIES - 1:
                    raise

                import asyncio
                await asyncio.sleep(2 ** attempt)

        raise RuntimeError("Failed to generate QA answer")
```

---

### Task 6: 创建 API 路由
**预估**: 1 小时

创建 `backend/app/api/routes/qa.py`:

```python
from fastapi import APIRouter, HTTPException
from app.schemas.qa import AskQuestionRequest, QAResponse
from app.services.qa_service import QAService

router = APIRouter(prefix="/api/qa", tags=["qa"])

qa_service = QAService()

@router.post("/ask", response_model=dict)
async def ask_question(request: AskQuestionRequest):
    """提问"""
    try:
        response = await qa_service.ask_question(request)

        return {
            "ok": True,
            "data": response.dict()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}", response_model=dict)
async def get_conversation_history(session_id: str):
    """获取会话历史"""
    session = qa_service.session_manager.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    return {
        "ok": True,
        "data": session.dict()
    }

@router.delete("/session/{session_id}", response_model=dict)
async def delete_session(session_id: str):
    """删除会话"""
    qa_service.session_manager.delete_session(session_id)

    return {
        "ok": True,
        "message": "Session deleted"
    }
```

在 `backend/app/api/router.py` 中注册：

```python
from app.api.routes import qa

api_router.include_router(qa.router)
```

---

### Task 7: 单元测试
**预估**: 2 小时

创建测试文件：
- `backend/tests/test_question_analyzer.py`
- `backend/tests/test_session_manager.py`
- `backend/tests/test_qa_service.py`

运行测试:
```bash
cd backend
poetry run pytest tests/ -v --cov=app.services.qa_service
```

---

### Task 8: 集成测试
**预估**: 1 小时

创建 `backend/tests/integration/test_qa_e2e.py`:

```python
@pytest.mark.asyncio
async def test_qa_e2e(setup_vectorized_repo):
    """端到端测试：问答流程"""
    response = client.post(
        "/api/qa/ask",
        json={
            "repoUrl": "https://github.com/octocat/Hello-World",
            "question": "How do I get started with this project?"
        }
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert "answer" in data
    assert len(data["answer"]) > 50
    assert "sessionId" in data
```

---

### Task 9: 文档更新
**预估**: 30 分钟

更新 `backend/README.md` 添加问答 API 文档。

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 回答质量不稳定 | 中 | 高 | Prompt 优化、Few-shot Examples |
| LLM 成本过高 | 中 | 中 | 使用 gpt-3.5-turbo、缓存常见问题 |
| 会话管理内存泄漏 | 低 | 中 | 定期清理过期会话 |

### 依赖关系

**前置依赖**:
- STORY-2.2: 向量化服务
- STORY-2.3: RAG 服务

**后续依赖**:
- STORY-3.2: 问答 UI 集成

---

## ✅ Definition of Done

- [ ] 所有 12 个验收标准通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] API 文档更新
- [ ] 代码符合规范
- [ ] Code Review 通过
- [ ] 性能测试：响应时间 ≤ 5 秒
- [ ] 回答质量人工验证（至少 10 个问题）

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1-9: 所有任务

#### 技术决策
- LLM 模型: gpt-4-turbo-preview（质量优先）
- 会话管理: 内存存储（MVP）
- 会话过期: 30 分钟

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 2.2: 内容向量化](./story-2.2-content-vectorization.md)
- [Story 2.3: RAG 教程生成](./story-2.3-rag-tutorial-generation.md)
- [编码规范](../architecture/coding-standards.md)
