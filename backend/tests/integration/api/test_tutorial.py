"""Integration tests for tutorial API."""
import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    """Test health check endpoint.

    Args:
        client: FastAPI test client
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "version" in data


def test_get_tutorial_success(client: TestClient) -> None:
    """Test successful tutorial retrieval with valid GitHub URL.

    Args:
        client: FastAPI test client
    """
    response = client.get(
        "/api/tutorial",
        params={"repoUrl": "https://github.com/vercel/next.js"},
    )

    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert data["ok"] is True
    assert "data" in data

    # Check tutorial data structure
    tutorial = data["data"]
    assert "repo" in tutorial
    assert "overview" in tutorial
    assert "prerequisites" in tutorial
    assert "structure" in tutorial
    assert "modules" in tutorial
    assert "steps" in tutorial

    # Check repo info
    assert tutorial["repo"]["owner"] == "vercel"
    assert tutorial["repo"]["name"] == "next.js"

    # Check modules and steps
    assert len(tutorial["modules"]) > 0
    assert len(tutorial["steps"]) > 0


def test_get_tutorial_invalid_url(client: TestClient) -> None:
    """Test tutorial retrieval with invalid URL.

    Args:
        client: FastAPI test client
    """
    response = client.get(
        "/api/tutorial",
        params={"repoUrl": "https://invalid-url.com/repo"},
    )

    assert response.status_code == 400
    data = response.json()

    # Check error response structure
    assert data["ok"] is False
    assert data["errorCode"] == "INVALID_REPO_URL"
    assert "message" in data
    assert "details" in data


def test_get_tutorial_with_language(client: TestClient) -> None:
    """Test tutorial retrieval with language parameter.

    Args:
        client: FastAPI test client
    """
    response = client.get(
        "/api/tutorial",
        params={
            "repoUrl": "https://github.com/facebook/react",
            "language": "en-US",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
