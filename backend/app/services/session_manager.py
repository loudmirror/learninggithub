"""Session manager service for managing QA conversations."""
from typing import Dict, Optional
from datetime import datetime, timedelta
import uuid
import structlog
from app.schemas.qa import ChatMessage, ConversationHistory

logger = structlog.get_logger()


class SessionManager:
    """会话管理服务 - 管理用户的问答会话"""

    SESSION_TIMEOUT = timedelta(minutes=30)  # 会话超时时间
    MAX_MESSAGES_PER_SESSION = 20  # 每个会话最多保留的消息数

    def __init__(self):
        """初始化会话管理器"""
        self.sessions: Dict[str, ConversationHistory] = {}
        logger.info("session_manager_initialized")

    def create_session(self, repo: str) -> str:
        """
        创建新会话

        Args:
            repo: 仓库标识 (owner/name)

        Returns:
            会话 ID
        """
        session_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + "Z"

        self.sessions[session_id] = ConversationHistory(
            sessionId=session_id,
            messages=[],
            repo=repo,
            createdAt=now,
            lastActivity=now,
        )

        logger.info("session_created", session_id=session_id, repo=repo)
        return session_id

    def get_session(self, session_id: str) -> Optional[ConversationHistory]:
        """
        获取会话

        Args:
            session_id: 会话 ID

        Returns:
            会话对象，如果不存在或已过期则返回 None
        """
        session = self.sessions.get(session_id)

        if not session:
            logger.debug("session_not_found", session_id=session_id)
            return None

        # 检查是否过期
        last_activity = datetime.fromisoformat(session.last_activity.rstrip("Z"))
        if datetime.utcnow() - last_activity > self.SESSION_TIMEOUT:
            logger.info("session_expired", session_id=session_id)
            self.delete_session(session_id)
            return None

        return session

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """
        添加消息到会话

        Args:
            session_id: 会话 ID
            role: 消息角色 (user/assistant/system)
            content: 消息内容

        Raises:
            ValueError: 会话不存在
        """
        session = self.get_session(session_id)

        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # 限制消息数量（保持会话历史可控）
        if len(session.messages) >= self.MAX_MESSAGES_PER_SESSION:
            # 删除最早的一对消息（user + assistant）
            session.messages = session.messages[2:]
            logger.debug(
                "session_messages_trimmed",
                session_id=session_id,
                remaining=len(session.messages),
            )

        # 添加新消息
        message = ChatMessage(
            role=role, content=content, timestamp=datetime.utcnow().isoformat() + "Z"
        )

        session.messages.append(message)
        session.last_activity = datetime.utcnow().isoformat() + "Z"

        logger.debug(
            "message_added",
            session_id=session_id,
            role=role,
            content_length=len(content),
            total_messages=len(session.messages),
        )

    def delete_session(self, session_id: str) -> None:
        """
        删除会话

        Args:
            session_id: 会话 ID
        """
        if session_id in self.sessions:
            self.sessions.pop(session_id)
            logger.info("session_deleted", session_id=session_id)

    def cleanup_expired_sessions(self) -> int:
        """
        清理过期会话

        Returns:
            清理的会话数量
        """
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

    def get_active_session_count(self) -> int:
        """
        获取活跃会话数量

        Returns:
            活跃会话数
        """
        # 先清理过期会话
        self.cleanup_expired_sessions()
        return len(self.sessions)
