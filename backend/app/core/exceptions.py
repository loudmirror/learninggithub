"""Custom exceptions."""
from typing import Optional

from fastapi import status


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[dict] = None,
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class InvalidRepoURLError(AppException):
    """Invalid repository URL error."""

    def __init__(self, url: str):
        super().__init__(
            error_code="INVALID_REPO_URL",
            message=f"Invalid repository URL: {url}",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"url": url},
        )


class RepoNotFoundError(AppException):
    """Repository not found error."""

    def __init__(self, url: str):
        super().__init__(
            error_code="REPO_NOT_FOUND",
            message=f"Repository not found: {url}",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"url": url},
        )
