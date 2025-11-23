"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import tutorial, qa
from app.config import settings
from app.core.logging import setup_logging
from app.middleware.error_handler import add_exception_handlers

# Initialize logging
setup_logging(settings.log_level)

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="GitHub 项目学习助手 API",
    version=settings.app_version,
    debug=settings.debug,
)

# CORS configuration - hardcoded to avoid env variable issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://learninggithub-frontend.vercel.app",
        "https://learninggithub.com",
        "https://www.learninggithub.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(tutorial.router, prefix=settings.api_prefix)
app.include_router(qa.router)

# Register exception handlers
add_exception_handlers(app)


@app.get(f"{settings.api_prefix}/health")
async def health_check() -> dict:
    """Health check endpoint.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/")
async def root() -> dict:
    """Root endpoint.

    Returns:
        Welcome message
    """
    return {
        "message": "Welcome to LearningGitHub API",
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }
