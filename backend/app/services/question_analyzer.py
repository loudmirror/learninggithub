"""Question analyzer service for understanding user questions."""
from typing import List, Set, Dict, Any
import re
import structlog

logger = structlog.get_logger()


class QuestionAnalyzer:
    """问题分析服务 - 理解用户提问的意图和关键信息"""

    # 问题类型关键词
    HOW_TO_KEYWORDS = ["how", "如何", "怎么", "怎样", "怎么样"]
    WHY_KEYWORDS = ["why", "为什么", "为何", "原因"]
    WHAT_KEYWORDS = ["what", "是什么", "什么是", "这是", "那是"]
    WHERE_KEYWORDS = ["where", "哪里", "在哪", "位置"]

    def __init__(self):
        pass

    def analyze_question(self, question: str) -> Dict[str, Any]:
        """
        分析问题，提取关键信息

        Args:
            question: 用户问题文本

        Returns:
            包含问题类型、关键词、实体等信息的字典
        """
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
            entities=list(entities)[:5],
        )

        return {
            "type": question_type,
            "keywords": keywords,
            "entities": entities,
            "original": question,
        }

    def _identify_type(self, question: str) -> str:
        """识别问题类型"""
        if any(kw in question for kw in self.HOW_TO_KEYWORDS):
            return "how_to"
        elif any(kw in question for kw in self.WHY_KEYWORDS):
            return "why"
        elif any(kw in question for kw in self.WHAT_KEYWORDS):
            return "what"
        elif any(kw in question for kw in self.WHERE_KEYWORDS):
            return "where"
        else:
            return "general"

    def _extract_keywords(self, question: str) -> List[str]:
        """提取关键词（简单版本，基于停用词过滤）"""
        # 停用词列表
        stop_words = {
            "how",
            "what",
            "why",
            "where",
            "when",
            "is",
            "the",
            "a",
            "an",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "as",
            "do",
            "does",
            "this",
            "that",
            "these",
            "those",
            "如何",
            "是什么",
            "为什么",
            "这个",
            "那个",
            "的",
            "了",
            "吗",
            "呢",
            "在",
            "是",
            "有",
            "和",
        }

        # 分词（简单按空格和标点）
        words = re.findall(r"\b\w+\b", question.lower())

        # 过滤停用词和短词
        keywords = [word for word in words if word not in stop_words and len(word) > 2]

        return keywords[:10]  # 最多10个关键词

    def _extract_entities(self, question: str) -> Set[str]:
        """提取代码实体（函数名、类名等）"""
        entities = set()

        # 1. 驼峰式: UserProfile, useState, getUser
        camel_case = re.findall(
            r"\b[a-z]+[A-Z]\w*\b|\b[A-Z][a-z]+[A-Z]\w*\b", question
        )
        entities.update(camel_case)

        # 2. 下划线式: user_profile, get_data
        snake_case = re.findall(r"\b[a-z]+_[a-z_]+\b", question)
        entities.update(snake_case)

        # 3. 反引号包裹: `function_name`
        backtick = re.findall(r"`(\w+)`", question)
        entities.update(backtick)

        # 4. 引号包裹: "ClassName"
        quoted = re.findall(r'"(\w+)"|\'(\w+)\'', question)
        for match in quoted:
            entities.update([m for m in match if m])

        return entities
