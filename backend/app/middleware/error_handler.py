"""Global error handling middleware."""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException
from app.core.logging import get_logger

logger = get_logger(__name__)


def add_exception_handlers(app: FastAPI) -> None:
    """Add global exception handlers to the FastAPI application.

    Args:
        app: FastAPI application instance
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        """Handle custom application exceptions.

        Args:
            request: FastAPI request
            exc: Application exception

        Returns:
            JSON error response
        """
        logger.error(
            "app_exception",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            details=exc.details,
            path=request.url.path,
        )

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "ok": False,
                "errorCode": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle unexpected exceptions.

        Args:
            request: FastAPI request
            exc: Exception

        Returns:
            JSON error response
        """
        logger.error(
            "unhandled_exception",
            error=str(exc),
            path=request.url.path,
            exc_info=True,
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "ok": False,
                "errorCode": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "details": {},
            },
        )
