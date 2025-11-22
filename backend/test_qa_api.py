#!/usr/bin/env python3
"""测试 QA API 功能"""
import os

# 禁用所有代理
os.environ["NO_PROXY"] = "*"
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)

import requests
import json
import time
from typing import Optional

BASE_URL = "http://localhost:8000"

# 禁用代理
session = requests.Session()
session.trust_env = False


def test_health_check():
    """测试健康检查"""
    print("\n=== 测试健康检查 ===")
    response = session.get(f"{BASE_URL}/api/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    assert response.status_code == 200
    print("✓ 健康检查通过")


def test_ask_question(repo_url: str, question: str, session_id: Optional[str] = None):
    """测试提问接口"""
    print(f"\n=== 测试提问 ===")
    print(f"仓库: {repo_url}")
    print(f"问题: {question}")

    payload = {
        "repoUrl": repo_url,
        "question": question,
    }

    if session_id:
        payload["sessionId"] = session_id
        print(f"会话 ID: {session_id}")

    response = session.post(
        f"{BASE_URL}/api/qa/ask",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"状态码: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"响应结构: ok={data.get('ok')}")

        if data.get("ok") and "data" in data:
            qa_data = data["data"]
            print(f"\n回答 ({len(qa_data.get('answer', ''))} 字符):")
            print("-" * 60)
            print(qa_data.get("answer", "")[:500])  # 打印前500字符
            if len(qa_data.get("answer", "")) > 500:
                print("...")
            print("-" * 60)

            print(f"\n代码引用数量: {len(qa_data.get('references', []))}")
            for i, ref in enumerate(qa_data.get("references", [])[:2], 1):
                print(f"  引用 {i}: {ref.get('filePath')} (行 {ref.get('startLine')}-{ref.get('endLine')})")

            print(f"会话 ID: {qa_data.get('sessionId')}")

            return qa_data.get("sessionId")
        else:
            print(f"响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
    else:
        print(f"错误: {response.text}")

    return None


def test_conversation_history(session_id: str):
    """测试获取会话历史"""
    print(f"\n=== 测试获取会话历史 ===")
    print(f"会话 ID: {session_id}")

    response = session.get(f"{BASE_URL}/api/qa/history/{session_id}")
    print(f"状态码: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        if data.get("ok") and "data" in data:
            history = data["data"]
            print(f"仓库: {history.get('repo')}")
            print(f"消息数量: {len(history.get('messages', []))}")

            for i, msg in enumerate(history.get("messages", []), 1):
                role = msg.get("role")
                content = msg.get("content", "")[:100]
                print(f"  消息 {i} [{role}]: {content}...")

            print("✓ 会话历史获取成功")
        else:
            print(f"响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
    else:
        print(f"错误: {response.text}")


def test_session_stats():
    """测试会话统计"""
    print(f"\n=== 测试会话统计 ===")

    response = session.get(f"{BASE_URL}/api/qa/sessions/stats")
    print(f"状态码: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        if data.get("ok") and "data" in data:
            stats = data["data"]
            print(f"活跃会话数: {stats.get('active_sessions')}")
            print("✓ 会话统计获取成功")
        else:
            print(f"响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
    else:
        print(f"错误: {response.text}")


def test_delete_session(session_id: str):
    """测试删除会话"""
    print(f"\n=== 测试删除会话 ===")
    print(f"会话 ID: {session_id}")

    response = session.delete(f"{BASE_URL}/api/qa/session/{session_id}")
    print(f"状态码: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
        print("✓ 会话删除成功")
    else:
        print(f"错误: {response.text}")


def main():
    """主测试流程"""
    print("=" * 60)
    print("QA API 功能测试")
    print("=" * 60)

    try:
        # 1. 健康检查
        test_health_check()

        # 2. 测试提问（第一次 - 创建新会话）
        repo_url = "https://github.com/fastapi/fastapi"
        question1 = "这个项目的主要功能是什么？"

        session_id = test_ask_question(repo_url, question1)

        if not session_id:
            print("\n⚠️  未能创建会话，可能是 AI 服务未配置")
            print("请确保在 .env 文件中设置了 OPENAI_API_KEY")
            return

        # 等待一下
        time.sleep(1)

        # 3. 测试多轮对话（使用相同会话 ID）
        question2 = "如何安装和运行这个项目？"
        test_ask_question(repo_url, question2, session_id)

        # 等待一下
        time.sleep(1)

        # 4. 测试会话历史
        test_conversation_history(session_id)

        # 5. 测试会话统计
        test_session_stats()

        # 6. 测试删除会话
        test_delete_session(session_id)

        # 7. 验证会话已删除
        print(f"\n=== 验证会话已删除 ===")
        response = session.get(f"{BASE_URL}/api/qa/history/{session_id}")
        if response.status_code == 404:
            print("✓ 会话已成功删除（返回 404）")
        else:
            print(f"⚠️  期望 404，实际得到 {response.status_code}")

        print("\n" + "=" * 60)
        print("所有测试完成！")
        print("=" * 60)

    except requests.exceptions.ConnectionError:
        print("\n❌ 无法连接到后端服务")
        print("请确保后端服务正在运行: poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
