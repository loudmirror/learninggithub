"""Repository service for fetching and caching GitHub repository data."""
import structlog
from typing import Dict, Any, List

from app.services.github_client import GitHubClient
from app.services.cache_manager import cache

logger = structlog.get_logger()


class RepositoryService:
    """Service for managing repository data with caching."""

    def __init__(self):
        """Initialize repository service."""
        self.github_client = GitHubClient()
        logger.info("repository_service_initialized")

    def get_repository_info(self, repo_url: str, use_cache: bool = True) -> Dict[str, Any]:
        """Get repository information with caching.

        Args:
            repo_url: GitHub repository URL
            use_cache: Whether to use cache (default: True)

        Returns:
            Dictionary containing repository information
        """
        cache_key = f"repo_info:{repo_url}"

        # Try to get from cache
        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                logger.info("repo_info_from_cache", repo_url=repo_url)
                return cached_data

        # Fetch from GitHub API
        logger.info("fetching_repo_info_from_github", repo_url=repo_url)
        repo_info = self.github_client.get_repo_info(repo_url)

        # Cache the result
        if use_cache:
            cache.set(cache_key, repo_info)

        return repo_info

    def get_repository_tree(
        self,
        repo_url: str,
        path: str = "",
        max_depth: int = 3,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        """Get repository directory tree with caching.

        Args:
            repo_url: GitHub repository URL
            path: Starting path in repository
            max_depth: Maximum depth to traverse
            use_cache: Whether to use cache (default: True)

        Returns:
            List of file/directory nodes
        """
        cache_key = f"repo_tree:{repo_url}:{path}:{max_depth}"

        # Try to get from cache
        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                logger.info("repo_tree_from_cache", repo_url=repo_url, path=path)
                return cached_data

        # Fetch from GitHub API
        logger.info("fetching_repo_tree_from_github", repo_url=repo_url, path=path)
        tree = self.github_client.get_directory_tree(repo_url, path, max_depth)

        # Cache the result
        if use_cache:
            cache.set(cache_key, tree)

        return tree

    def get_file_content(
        self, repo_url: str, file_path: str, use_cache: bool = True
    ) -> str:
        """Get file content with caching.

        Args:
            repo_url: GitHub repository URL
            file_path: Path to file in repository
            use_cache: Whether to use cache (default: True)

        Returns:
            File content as string
        """
        cache_key = f"file_content:{repo_url}:{file_path}"

        # Try to get from cache
        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                logger.info(
                    "file_content_from_cache", repo_url=repo_url, file_path=file_path
                )
                return cached_data

        # Fetch from GitHub API
        logger.info(
            "fetching_file_content_from_github", repo_url=repo_url, file_path=file_path
        )
        content = self.github_client.get_file_content(repo_url, file_path)

        # Cache the result
        if use_cache:
            cache.set(cache_key, content)

        return content

    def get_multiple_files(
        self, repo_url: str, file_paths: List[str], use_cache: bool = True
    ) -> Dict[str, str]:
        """Get content of multiple files.

        Args:
            repo_url: GitHub repository URL
            file_paths: List of file paths to fetch
            use_cache: Whether to use cache (default: True)

        Returns:
            Dictionary mapping file paths to their contents
        """
        logger.info(
            "fetching_multiple_files", repo_url=repo_url, file_count=len(file_paths)
        )

        results = {}
        for file_path in file_paths:
            try:
                content = self.get_file_content(repo_url, file_path, use_cache)
                results[file_path] = content
            except Exception as e:
                logger.warning(
                    "failed_to_fetch_file",
                    repo_url=repo_url,
                    file_path=file_path,
                    error=str(e),
                )
                # Continue with other files even if one fails
                continue

        return results

    def clear_cache_for_repo(self, repo_url: str) -> None:
        """Clear all cached data for a repository.

        Args:
            repo_url: GitHub repository URL
        """
        # This is a simplified version - ideally we'd track all cache keys per repo
        logger.info("clearing_repo_cache", repo_url=repo_url)
        cache.delete(f"repo_info:{repo_url}")
        # Note: This won't clear all tree and file caches, but gives an idea


# Global service instance
repository_service = RepositoryService()
