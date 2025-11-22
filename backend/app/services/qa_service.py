"""QA service - orchestrates the question answering flow."""
from typing import Optional, Dict, Any
import structlog
from app.services.repository_service import repository_service
from app.services.code_analyzer import CodeAnalyzer
from app.services.question_analyzer import QuestionAnalyzer
from app.services.qa_prompt_builder import QAPromptBuilder
from app.services.session_manager import SessionManager
from app.services.ai_generator import AIGenerator
from app.schemas.qa import AskQuestionRequest, QAResponse, CodeReference
from app.core.exceptions import AppException

logger = structlog.get_logger()


class QAService:
    """问答服务 - 协调整个问答流程"""

    def __init__(self):
        """初始化 QA 服务"""
        self.question_analyzer = QuestionAnalyzer()
        self.prompt_builder = QAPromptBuilder()
        self.session_manager = SessionManager()
        self.ai_generator = AIGenerator()
        logger.info("qa_service_initialized")

    def ask_question(self, request: AskQuestionRequest) -> QAResponse:
        """
        处理问答请求

        Args:
            request: 问答请求

        Returns:
            问答响应

        Raises:
            AppException: 处理失败时抛出异常
        """
        try:
            # 1. 解析仓库 URL
            logger.info("parsing_repo_url", repo_url=request.repo_url)
            # 简单解析 GitHub URL (https://github.com/owner/repo)
            parts = request.repo_url.strip("/").split("/")
            if len(parts) < 2:
                raise AppException(
                    error_code="INVALID_REPO_URL",
                    message="Invalid repository URL format",
                    status_code=400,
                )

            owner = parts[-2]
            repo_name = parts[-1]
            repo_full_name = f"{owner}/{repo_name}"

            # 2. 获取或创建会话
            session_id = request.session_id
            if not session_id or not self.session_manager.get_session(session_id):
                session_id = self.session_manager.create_session(repo_full_name)
                logger.info("new_session_created", session_id=session_id)

            session = self.session_manager.get_session(session_id)

            # 3. 分析问题
            logger.info("analyzing_question", question=request.question[:100])
            question_analysis = self.question_analyzer.analyze_question(
                request.question
            )

            # 4. 获取仓库信息
            logger.info("fetching_repo_info", repo=repo_full_name)
            repo_info = repository_service.get_repository_info(request.repo_url)

            # 5. 执行代码分析（获取缓存的或重新分析）
            logger.info("performing_code_analysis")
            analyzer = CodeAnalyzer(request.repo_url)
            analysis = analyzer.analyze()

            # 6. 获取关键文件内容
            logger.info("fetching_key_files")
            file_contents = self._fetch_key_file_contents(
                request.repo_url, analysis, question_analysis
            )

            # 7. 构建 Prompt
            logger.info("building_prompt")
            messages = self.prompt_builder.build_messages(
                question=request.question,
                question_analysis=question_analysis,
                repo_info=repo_info,
                analysis=analysis,
                file_contents=file_contents,
                user_context=request.context,
                history=session.messages if session else None,
            )

            # 8. 调用 AI 生成回答
            if not self.ai_generator.is_available():
                # AI 未配置，返回友好提示
                return QAResponse(
                    answer="抱歉，AI 问答服务暂时不可用。请确保配置了 OPENAI_API_KEY 环境变量。",
                    references=[],
                    related_steps=[],
                    sessionId=session_id,
                )

            logger.info("calling_ai_for_answer")
            answer = self.ai_generator.generate_qa_answer(messages)

            # 9. 提取代码引用（基于关键文件）
            references = self._create_references(file_contents)

            # 10. 保存会话历史
            self.session_manager.add_message(session_id, "user", request.question)
            self.session_manager.add_message(session_id, "assistant", answer)

            logger.info(
                "qa_completed",
                session_id=session_id,
                answer_length=len(answer),
            )

            return QAResponse(
                answer=answer,
                references=references,
                related_steps=[],  # TODO: 未来可以基于学习位置推荐相关步骤
                sessionId=session_id,
            )

        except AppException:
            raise
        except Exception as e:
            logger.error("qa_failed", error=str(e), exc_info=True)
            raise AppException(
                error_code="QA_ERROR",
                message=f"Failed to process question: {str(e)}",
                status_code=500,
            )

    def _fetch_key_file_contents(
        self,
        repo_url: str,
        analysis: Dict[str, Any],
        question_analysis: Dict[str, Any],
    ) -> Dict[str, str]:
        """
        获取关键文件内容

        Args:
            repo_url: 仓库 URL
            analysis: 代码分析结果
            question_analysis: 问题分析结果

        Returns:
            文件路径到内容的映射
        """
        file_contents = {}

        # 优先获取 README
        try:
            readme_content = repository_service.get_file_content(
                repo_url, "README.md"
            )
            file_contents["README.md"] = readme_content[:5000]  # 限制长度
            logger.debug("readme_fetched", length=len(readme_content))
        except Exception as e:
            logger.debug("readme_not_found", error=str(e))

        # 根据项目类型获取配置文件
        key_files = analysis.get("key_files", [])
        for file_info in key_files[:3]:  # 最多3个关键文件
            try:
                file_path = file_info["path"]
                # 只获取配置类文件，不要获取大型代码文件
                if any(
                    ext in file_path.lower()
                    for ext in [".json", ".yml", ".yaml", ".toml", ".md", ".txt"]
                ):
                    content = repository_service.get_file_content(repo_url, file_path)
                    file_contents[file_path] = content[:3000]  # 限制长度
                    logger.debug("key_file_fetched", file_path=file_path)
            except Exception as e:
                logger.debug("key_file_fetch_failed", file_path=file_path, error=str(e))

        return file_contents

    def _create_references(
        self, file_contents: Dict[str, str]
    ) -> list[CodeReference]:
        """
        创建代码引用

        Args:
            file_contents: 文件内容映射

        Returns:
            代码引用列表
        """
        references = []

        for file_path, content in file_contents.items():
            # 创建引用（简化版本，使用前几行）
            snippet = "\n".join(content.split("\n")[:10])  # 前10行
            references.append(
                CodeReference(
                    filePath=file_path,
                    startLine=1,
                    endLine=min(10, len(content.split("\n"))),
                    snippet=snippet,
                    language=self._detect_language(file_path),
                )
            )

        return references[:3]  # 最多3个引用

    def _detect_language(self, file_path: str) -> str:
        """根据文件扩展名检测语言"""
        ext_to_lang = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".jsx": "javascript",
            ".tsx": "typescript",
            ".json": "json",
            ".yml": "yaml",
            ".yaml": "yaml",
            ".md": "markdown",
            ".toml": "toml",
            ".go": "go",
            ".rs": "rust",
            ".java": "java",
        }

        for ext, lang in ext_to_lang.items():
            if file_path.endswith(ext):
                return lang

        return "text"


# 全局实例
qa_service = QAService()
