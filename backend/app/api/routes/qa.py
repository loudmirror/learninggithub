"""QA (Question & Answer) API routes."""
from fastapi import APIRouter, HTTPException, status
import structlog
from app.schemas.qa import AskQuestionRequest, QAResponse
from app.services.qa_service import qa_service
from app.core.exceptions import AppException

logger = structlog.get_logger()

router = APIRouter(prefix="/api/qa", tags=["qa"])


@router.post("/ask", response_model=dict)
async def ask_question(request: AskQuestionRequest):
    """
    提问接口 - 用户可以提问并获得基于仓库代码的回答

    **Request Body**:
    - `repoUrl`: 仓库 URL (必需)
    - `question`: 用户问题 (必需, 5-500 字符)
    - `sessionId`: 会话 ID (可选, 用于多轮对话)
    - `context`: 学习上下文 (可选)
      - `currentModuleId`: 当前模块 ID
      - `currentStepId`: 当前步骤 ID

    **Response**:
    ```json
    {
        "ok": true,
        "data": {
            "answer": "AI 生成的回答...",
            "references": [...],
            "relatedSteps": [...],
            "sessionId": "uuid..."
        }
    }
    ```

    **Errors**:
    - 400: Invalid request (invalid URL or question too short/long)
    - 503: AI service not configured
    - 500: Internal error
    """
    try:
        logger.info("qa_ask_question", repo_url=request.repo_url, question_length=len(request.question))

        response = qa_service.ask_question(request)

        return {"ok": True, "data": response.dict()}

    except AppException as e:
        logger.warning(
            "qa_request_failed",
            error_code=e.error_code,
            message=e.message,
            status=e.status_code,
        )
        raise HTTPException(status_code=e.status_code, detail=e.message)

    except Exception as e:
        logger.error("qa_request_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process question: {str(e)}",
        )


@router.get("/history/{session_id}", response_model=dict)
async def get_conversation_history(session_id: str):
    """
    获取会话历史

    **Path Parameters**:
    - `session_id`: 会话 ID

    **Response**:
    ```json
    {
        "ok": true,
        "data": {
            "sessionId": "uuid...",
            "messages": [
                {"role": "user", "content": "...", "timestamp": "..."},
                {"role": "assistant", "content": "...", "timestamp": "..."}
            ],
            "repo": "owner/name",
            "createdAt": "...",
            "lastActivity": "..."
        }
    }
    ```

    **Errors**:
    - 404: Session not found or expired
    """
    try:
        logger.info("getting_conversation_history", session_id=session_id)

        session = qa_service.session_manager.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or expired",
            )

        return {"ok": True, "data": session.dict()}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_history_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation history: {str(e)}",
        )


@router.delete("/session/{session_id}", response_model=dict)
async def delete_session(session_id: str):
    """
    删除会话

    **Path Parameters**:
    - `session_id`: 会话 ID

    **Response**:
    ```json
    {
        "ok": true,
        "message": "Session deleted"
    }
    ```
    """
    try:
        logger.info("deleting_session", session_id=session_id)

        qa_service.session_manager.delete_session(session_id)

        return {"ok": True, "message": "Session deleted"}

    except Exception as e:
        logger.error("delete_session_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}",
        )


@router.get("/sessions/stats", response_model=dict)
async def get_session_stats():
    """
    获取会话统计信息 (用于监控)

    **Response**:
    ```json
    {
        "ok": true,
        "data": {
            "active_sessions": 5,
            "total_sessions_created": 42
        }
    }
    ```
    """
    try:
        active_count = qa_service.session_manager.get_active_session_count()

        return {
            "ok": True,
            "data": {
                "active_sessions": active_count,
            },
        }

    except Exception as e:
        logger.error("get_stats_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}",
        )
