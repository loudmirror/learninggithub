"""AI-powered tutorial generation service."""
import json
import structlog
from typing import Dict, Any, List, Optional
from openai import OpenAI

from app.config import settings
from app.core.exceptions import AppException

logger = structlog.get_logger()


class PromptBuilder:
    """Builds prompts for AI model based on project analysis."""

    @staticmethod
    def build_tutorial_prompt(
        repo_info: Dict[str, Any],
        analysis: Dict[str, Any],
        language: str = "zh-CN",
    ) -> str:
        """Build tutorial generation prompt.

        Args:
            repo_info: Repository information
            analysis: Code analysis results
            language: Output language (zh-CN or en-US)

        Returns:
            Formatted prompt string
        """
        project_type = analysis["project_type"]
        structure = analysis["structure"]
        dependencies = analysis["dependencies"]

        prompt = f"""你是一位经验丰富的技术导师，专门帮助开发者学习开源项目。

## 项目信息
- 名称: {repo_info['name']}
- 作者: {repo_info['owner']}
- 类型: {project_type['primary_type']}
- 框架: {project_type.get('framework', 'N/A')}
- 语言: {project_type['language']}
- Stars: {repo_info['stars']:,}

## 项目结构
- 总目录数: {structure['total_directories']}
- 关键目录: {', '.join([d['name'] for d in structure.get('key_directories', [])[:5]])}

## 依赖信息
"""

        if dependencies:
            pkg_mgr = dependencies.get("package_manager", "N/A")
            prompt += f"- 包管理器: {pkg_mgr}\n"

            if "core_dependencies" in dependencies:
                core_deps = dependencies["core_dependencies"][:5]
                prompt += f"- 核心依赖: {', '.join(core_deps)}\n"

        prompt += """
## 任务要求

请为这个项目创建一个结构化的学习路径，帮助开发者从零开始理解和运行项目。

输出格式必须是有效的 JSON，包含以下结构：

{
  "overview": "项目概述（2-3句话）",
  "prerequisites": ["前置知识1", "前置知识2", ...],
  "modules": [
    {
      "id": "module-1",
      "name": "模块名称",
      "description": "模块描述",
      "dependencies": [],
      "learningObjectives": ["目标1", "目标2"],
      "estimatedMinutes": 30
    }
  ],
  "steps": [
    {
      "id": "step-1",
      "title": "步骤标题",
      "description": "步骤描述",
      "moduleId": "module-1",
      "tips": ["提示1", "提示2"]
    }
  ]
}

## 生成指南

1. **项目概述**: 简洁描述项目功能和技术亮点
2. **前置知识**: 列出 3-5 个必要的技术知识点
3. **学习模块**: 创建 3-4 个循序渐进的模块
   - 模块 1: 环境准备和项目运行
   - 模块 2: 核心架构理解
   - 模块 3: 关键功能深入
   - 模块 4（可选）: 进阶内容
4. **学习步骤**: 每个模块 2-4 个具体步骤

请确保：
- 步骤循序渐进，从简单到复杂
- 每个步骤都有清晰的目标和提示
- 估算时间要合理
- 内容针对{project_type['primary_type']}项目特点
- 输出纯 JSON，不要有其他文字

请生成学习路径："""

        return prompt

    @staticmethod
    def build_step_details_prompt(
        step_info: Dict[str, Any],
        file_content: str,
        language: str = "zh-CN",
    ) -> str:
        """Build prompt for generating step details with code.

        Args:
            step_info: Step information
            file_content: Related file content
            language: Output language

        Returns:
            Formatted prompt string
        """
        prompt = f"""为学习步骤生成详细的代码讲解。

## 步骤信息
- 标题: {step_info['title']}
- 描述: {step_info['description']}

## 相关代码
```
{file_content[:1000]}  # 截取前1000字符
```

请生成以下内容（JSON 格式）：

{{
  "codeSnippet": "关键代码片段（10-20行）",
  "explanation": "代码讲解（2-3句话）",
  "filePath": "文件路径",
  "lineStart": 1,
  "lineEnd": 10,
  "relatedFiles": ["相关文件1", "相关文件2"]
}}

要求：
- 选择最具代表性的代码片段
- 讲解要清晰易懂
- 输出纯 JSON
"""

        return prompt


class AIGenerator:
    """AI-powered content generator using OpenAI or compatible APIs (OpenRouter)."""

    def __init__(self):
        """Initialize AI generator."""
        self.api_key = settings.openai_api_key
        self.base_url = settings.openai_base_url
        self.model = settings.openai_model

        if not self.api_key:
            logger.warning("openai_api_key_not_configured")
            self.client = None
        else:
            # 支持 OpenRouter 等兼容 OpenAI 的 API
            client_kwargs = {"api_key": self.api_key}
            if self.base_url:
                client_kwargs["base_url"] = self.base_url
            self.client = OpenAI(**client_kwargs)
            logger.info("ai_generator_initialized", model=self.model, base_url=self.base_url or "default")

    def is_available(self) -> bool:
        """Check if AI generator is available.

        Returns:
            True if API key is configured
        """
        return self.client is not None

    def generate_tutorial(
        self,
        repo_info: Dict[str, Any],
        analysis: Dict[str, Any],
        language: str = "zh-CN",
    ) -> Dict[str, Any]:
        """Generate tutorial content using AI.

        Args:
            repo_info: Repository information
            analysis: Code analysis results
            language: Output language

        Returns:
            Generated tutorial structure

        Raises:
            AppException: If AI generation fails
        """
        if not self.is_available():
            raise AppException(
                error_code="AI_NOT_CONFIGURED",
                message="OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.",
                status_code=503,
            )

        try:
            # Build prompt
            prompt = PromptBuilder.build_tutorial_prompt(
                repo_info, analysis, language
            )

            logger.info("generating_tutorial_with_ai", model=self.model)

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert technical educator who creates structured learning paths for open source projects. Always output valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )

            # Parse response
            content = response.choices[0].message.content
            result = json.loads(content)

            logger.info(
                "tutorial_generated_successfully",
                modules=len(result.get("modules", [])),
                steps=len(result.get("steps", [])),
            )

            return result

        except json.JSONDecodeError as e:
            logger.error("failed_to_parse_ai_response", error=str(e))
            raise AppException(
                error_code="AI_PARSE_ERROR",
                message="Failed to parse AI response as JSON",
                status_code=500,
            )
        except Exception as e:
            logger.error("ai_generation_failed", error=str(e))
            raise AppException(
                error_code="AI_GENERATION_ERROR",
                message=f"AI generation failed: {str(e)}",
                status_code=500,
            )

    def enhance_step(
        self, step_info: Dict[str, Any], file_content: str, language: str = "zh-CN"
    ) -> Dict[str, Any]:
        """Enhance step with AI-generated code details.

        Args:
            step_info: Step information
            file_content: Related file content
            language: Output language

        Returns:
            Enhanced step with code details
        """
        if not self.is_available():
            logger.warning("ai_not_available_for_step_enhancement")
            return {}

        try:
            prompt = PromptBuilder.build_step_details_prompt(
                step_info, file_content, language
            )

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a code educator. Generate detailed code explanations in JSON format.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=500,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            return result

        except Exception as e:
            logger.warning("step_enhancement_failed", error=str(e))
            return {}

    def generate_qa_answer(self, messages: List[Dict[str, str]]) -> str:
        """Generate QA answer using AI.

        Args:
            messages: List of messages (system, user, assistant)

        Returns:
            Generated answer text

        Raises:
            AppException: If AI generation fails
        """
        if not self.is_available():
            raise AppException(
                error_code="AI_NOT_CONFIGURED",
                message="OpenAI API key not configured.",
                status_code=503,
            )

        try:
            logger.info("generating_qa_answer_with_ai", model=self.model)

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,  # Lower temperature for more factual answers
                max_tokens=1000,
            )

            # Extract answer
            answer = response.choices[0].message.content

            logger.info(
                "qa_answer_generated",
                answer_length=len(answer),
                tokens_used=response.usage.total_tokens if response.usage else 0,
            )

            return answer

        except Exception as e:
            logger.error("qa_answer_generation_failed", error=str(e))
            raise AppException(
                error_code="AI_GENERATION_ERROR",
                message=f"Failed to generate answer: {str(e)}",
                status_code=500,
            )


class TutorialGenerator:
    """High-level tutorial generator combining analysis and AI."""

    def __init__(self):
        """Initialize tutorial generator."""
        self.ai_generator = AIGenerator()

    def generate(
        self,
        repo_info: Dict[str, Any],
        analysis: Dict[str, Any],
        language: str = "zh-CN",
    ) -> Dict[str, Any]:
        """Generate complete tutorial.

        Args:
            repo_info: Repository information
            analysis: Code analysis results
            language: Output language

        Returns:
            Complete tutorial data
        """
        logger.info("starting_tutorial_generation", repo=repo_info["name"])

        # Generate tutorial structure with AI
        ai_result = self.ai_generator.generate_tutorial(repo_info, analysis, language)

        # Post-process and validate
        tutorial = self._post_process(ai_result, repo_info, analysis)

        logger.info("tutorial_generation_completed", repo=repo_info["name"])

        return tutorial

    def _post_process(
        self,
        ai_result: Dict[str, Any],
        repo_info: Dict[str, Any],
        analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Post-process AI-generated content.

        Args:
            ai_result: AI-generated tutorial
            repo_info: Repository information
            analysis: Code analysis results

        Returns:
            Processed tutorial data
        """
        # Ensure all required fields exist
        tutorial = {
            "overview": ai_result.get(
                "overview", f"{repo_info['name']} 项目学习指南"
            ),
            "prerequisites": ai_result.get("prerequisites", []),
            "modules": ai_result.get("modules", []),
            "steps": ai_result.get("steps", []),
        }

        # Assign step IDs to modules
        step_module_map = {
            step["id"]: step.get("moduleId") for step in tutorial["steps"]
        }

        for module in tutorial["modules"]:
            module["stepIds"] = [
                step_id
                for step_id, module_id in step_module_map.items()
                if module_id == module["id"]
            ]

        # Add default values for missing fields
        for step in tutorial["steps"]:
            if "filePath" not in step:
                step["filePath"] = "README.md"
            if "lineStart" not in step:
                step["lineStart"] = 1
            if "lineEnd" not in step:
                step["lineEnd"] = 5
            if "codeSnippet" not in step:
                step["codeSnippet"] = "# 查看项目文档"
            if "explanation" not in step:
                step["explanation"] = step.get("description", "")
            if "relatedFiles" not in step:
                step["relatedFiles"] = []

        return tutorial


# Global instance
tutorial_generator = TutorialGenerator()
