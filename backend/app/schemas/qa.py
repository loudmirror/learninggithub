"""QA (Question & Answer) schemas for the API."""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class CodeReference(BaseModel):
    """代码引用"""

    file_path: str = Field(..., alias="filePath")
    start_line: int = Field(..., alias="startLine")
    end_line: int = Field(..., alias="endLine")
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
    related_steps: List[str] = Field([], alias="relatedSteps")
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
