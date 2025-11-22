"""QA Prompt builder service for constructing AI prompts."""
from typing import List, Dict, Optional, Any
from pathlib import Path
import structlog
from app.schemas.qa import QuestionContext, ChatMessage

logger = structlog.get_logger()


class QAPromptBuilder:
    """问答 Prompt 构建服务 - 构建包含上下文的 AI Prompt"""

    MAX_FILE_CONTENT_LENGTH = 3000  # 每个文件内容最大长度
    MAX_HISTORY_TURNS = 5  # 最多保留的历史对话轮数

    def __init__(self):
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """加载系统 Prompt"""
        prompt_path = Path(__file__).parent.parent / "prompts" / "qa_system.txt"
        try:
            return prompt_path.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.warning("system_prompt_file_not_found", path=str(prompt_path))
            # 使用默认 prompt
            return "You are a helpful coding assistant. Answer questions based on the provided repository context."

    def build_messages(
        self,
        question: str,
        question_analysis: Dict[str, Any],
        repo_info: Dict[str, Any],
        analysis: Dict[str, Any],
        file_contents: Optional[Dict[str, str]] = None,
        user_context: Optional[QuestionContext] = None,
        history: Optional[List[ChatMessage]] = None,
    ) -> List[Dict[str, str]]:
        """
        构建完整的消息列表

        Args:
            question: 用户问题
            question_analysis: 问题分析结果
            repo_info: 仓库信息
            analysis: 代码分析结果
            file_contents: 相关文件内容（可选）
            user_context: 用户学习上下文（可选）
            history: 会话历史（可选）

        Returns:
            消息列表，格式为 [{"role": "system", "content": "..."}, ...]
        """
        messages = [{"role": "system", "content": self.system_prompt}]

        # 添加会话历史（保留最近 N 轮）
        if history:
            recent_history = history[-(self.MAX_HISTORY_TURNS * 2) :]
            for msg in recent_history:
                messages.append({"role": msg.role, "content": msg.content})

        # 构建用户消息（包含上下文）
        user_message = self._build_user_message(
            question, question_analysis, repo_info, analysis, file_contents, user_context
        )

        messages.append({"role": "user", "content": user_message})

        logger.debug(
            "prompt_built",
            total_messages=len(messages),
            user_message_length=len(user_message),
        )

        return messages

    def _build_user_message(
        self,
        question: str,
        question_analysis: Dict[str, Any],
        repo_info: Dict[str, Any],
        analysis: Dict[str, Any],
        file_contents: Optional[Dict[str, str]],
        user_context: Optional[QuestionContext],
    ) -> str:
        """构建用户消息，包含所有上下文信息"""
        parts = []

        # 1. Repository Context
        parts.append("## Repository Context")
        parts.append(f"**Repository**: {repo_info['owner']}/{repo_info['name']}")
        parts.append(f"**Stars**: {repo_info.get('stars', 'N/A'):,}")
        parts.append(
            f"**Language**: {analysis['project_type'].get('language', 'Unknown')}"
        )
        parts.append(
            f"**Type**: {analysis['project_type'].get('primary_type', 'Unknown')}"
        )
        if analysis["project_type"].get("framework"):
            parts.append(f"**Framework**: {analysis['project_type']['framework']}")
        parts.append("")

        # 2. User Learning Context
        if user_context and (
            user_context.current_module_id or user_context.current_step_id
        ):
            parts.append("## User's Current Learning Position")
            if user_context.current_module_id:
                parts.append(f"**Current Module**: {user_context.current_module_id}")
            if user_context.current_step_id:
                parts.append(f"**Current Step**: {user_context.current_step_id}")
            parts.append("")

        # 3. Project Structure Overview
        parts.append("## Project Structure")
        if analysis.get("structure"):
            structure = analysis["structure"]
            parts.append(
                f"**Total Directories**: {structure.get('total_directories', 0)}"
            )

            key_dirs = structure.get("key_directories", [])
            if key_dirs:
                parts.append("\n**Key Directories**:")
                for dir_info in key_dirs[:8]:  # 最多8个
                    parts.append(
                        f"- `{dir_info['path']}` - {dir_info.get('purpose', 'N/A')}"
                    )
        parts.append("")

        # 4. Dependencies
        if analysis.get("dependencies"):
            deps = analysis["dependencies"]
            parts.append("## Dependencies")
            parts.append(f"**Package Manager**: {deps.get('package_manager', 'N/A')}")

            core_deps = deps.get("core_dependencies", [])
            if core_deps:
                parts.append(
                    f"**Core Dependencies**: {', '.join(core_deps[:10])}"
                )  # 最多10个
            parts.append("")

        # 5. Key Files
        if analysis.get("key_files"):
            key_files = analysis["key_files"]
            if key_files:
                parts.append("## Important Files")
                for file_info in key_files[:6]:  # 最多6个
                    parts.append(
                        f"- `{file_info['path']}` - {file_info.get('description', '')}"
                    )
                parts.append("")

        # 6. File Contents (if provided)
        if file_contents:
            parts.append("## Relevant File Contents")
            parts.append("")

            for file_path, content in list(file_contents.items())[
                :3
            ]:  # 最多3个文件
                parts.append(f"### File: `{file_path}`")
                parts.append("```")
                # 截断过长的内容
                truncated_content = content[: self.MAX_FILE_CONTENT_LENGTH]
                if len(content) > self.MAX_FILE_CONTENT_LENGTH:
                    truncated_content += "\n\n... (content truncated)"
                parts.append(truncated_content)
                parts.append("```")
                parts.append("")

        # 7. Question Analysis
        if question_analysis.get("entities"):
            parts.append(f"**Note**: The question mentions: {', '.join(question_analysis['entities'])}")
            parts.append("")

        # 8. The Actual Question
        parts.append("## User's Question")
        parts.append(question)
        parts.append("")

        parts.append(
            "Please provide a helpful, accurate answer based on the repository context above."
        )

        return "\n".join(parts)
