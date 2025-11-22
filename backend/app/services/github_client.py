"""GitHub API client for repository information retrieval."""
import structlog
from typing import Optional, Dict, Any, List
from github import Github, GithubException, RateLimitExceededException
from github.Repository import Repository
from github.ContentFile import ContentFile

from app.config import settings
from app.core.exceptions import AppException

logger = structlog.get_logger()


class GitHubClient:
    """Client for interacting with GitHub API."""

    def __init__(self, token: Optional[str] = None):
        """Initialize GitHub client.

        Args:
            token: GitHub personal access token. If not provided, uses token from settings.
        """
        self.token = token or settings.github_token
        self.client = Github(self.token) if self.token else Github()
        self._base_url = settings.github_api_base_url
        logger.info(
            "github_client_initialized",
            authenticated=bool(self.token),
            base_url=self._base_url,
        )

    def parse_repo_url(self, repo_url: str) -> tuple[str, str]:
        """Parse GitHub repository URL to extract owner and repo name.

        Args:
            repo_url: GitHub repository URL (e.g., https://github.com/owner/repo)

        Returns:
            Tuple of (owner, repo_name)

        Raises:
            AppException: If URL format is invalid
        """
        try:
            # Remove trailing slashes and .git suffix
            url = repo_url.rstrip("/").rstrip(".git")

            # Handle different URL formats
            if "github.com/" in url:
                # Extract path after github.com/
                parts = url.split("github.com/")[-1].split("/")
                if len(parts) >= 2:
                    owner, repo = parts[0], parts[1]
                    logger.debug("repo_url_parsed", owner=owner, repo=repo)
                    return owner, repo

            raise ValueError("Invalid GitHub URL format")

        except Exception as e:
            logger.error("repo_url_parse_failed", url=repo_url, error=str(e))
            raise AppException(
                error_code="INVALID_REPO_URL",
                message=f"Invalid GitHub repository URL: {repo_url}",
                status_code=400,
            )

    def get_repository(self, repo_url: str) -> Repository:
        """Get GitHub repository object.

        Args:
            repo_url: GitHub repository URL

        Returns:
            GitHub Repository object

        Raises:
            AppException: If repository not found or API error occurs
        """
        try:
            owner, repo = self.parse_repo_url(repo_url)
            full_name = f"{owner}/{repo}"

            logger.info("fetching_repository", repo=full_name)
            repository = self.client.get_repo(full_name)

            return repository

        except RateLimitExceededException as e:
            logger.error("github_rate_limit_exceeded", error=str(e))
            raise AppException(
                error_code="RATE_LIMIT_EXCEEDED",
                message="GitHub API rate limit exceeded. Please try again later.",
                status_code=429,
            )
        except GithubException as e:
            if e.status == 404:
                logger.error("repository_not_found", repo_url=repo_url)
                raise AppException(
                    error_code="REPO_NOT_FOUND",
                    message=f"Repository not found: {repo_url}",
                    status_code=404,
                )
            logger.error("github_api_error", status=e.status, error=str(e))
            raise AppException(
                error_code="GITHUB_API_ERROR",
                message=f"GitHub API error: {e.data.get('message', str(e))}",
                status_code=e.status,
            )
        except Exception as e:
            logger.error("unexpected_error", error=str(e))
            raise AppException(
                error_code="INTERNAL_ERROR",
                message="Failed to fetch repository information",
                status_code=500,
            )

    def get_repo_info(self, repo_url: str) -> Dict[str, Any]:
        """Get basic repository information.

        Args:
            repo_url: GitHub repository URL

        Returns:
            Dictionary containing repository information:
            - owner: Repository owner
            - name: Repository name
            - full_name: Full repository name (owner/repo)
            - description: Repository description
            - stars: Number of stars
            - forks: Number of forks
            - language: Primary programming language
            - topics: List of topics/tags
            - default_branch: Default branch name
            - created_at: Creation timestamp
            - updated_at: Last update timestamp
            - clone_url: HTTPS clone URL
            - homepage: Project homepage URL
            - license: License information
        """
        repo = self.get_repository(repo_url)

        info = {
            "owner": repo.owner.login,
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description or "",
            "stars": repo.stargazers_count,
            "forks": repo.forks_count,
            "language": repo.language or "Unknown",
            "topics": repo.get_topics(),
            "default_branch": repo.default_branch,
            "created_at": repo.created_at.isoformat() if repo.created_at else None,
            "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
            "clone_url": repo.clone_url,
            "homepage": repo.homepage or "",
            "license": repo.license.name if repo.license else None,
        }

        logger.info("repo_info_retrieved", repo=repo.full_name, stars=info["stars"])
        return info

    def get_directory_tree(
        self, repo_url: str, path: str = "", max_depth: int = 3
    ) -> List[Dict[str, Any]]:
        """Get directory tree structure of repository.

        Args:
            repo_url: GitHub repository URL
            path: Starting path in repository (default: root)
            max_depth: Maximum depth to traverse (default: 3)

        Returns:
            List of file/directory nodes with structure:
            - name: File or directory name
            - path: Full path
            - type: 'file' or 'directory'
            - children: List of child nodes (for directories)
            - size: File size in bytes (for files)
        """
        repo = self.get_repository(repo_url)

        def traverse_directory(
            contents: List[ContentFile], current_depth: int = 0
        ) -> List[Dict[str, Any]]:
            """Recursively traverse directory structure."""
            if current_depth >= max_depth:
                return []

            nodes = []
            for content in contents:
                node = {
                    "name": content.name,
                    "path": content.path,
                    "type": content.type,
                }

                if content.type == "dir":
                    # Recursively get subdirectory contents
                    try:
                        subcontents = repo.get_contents(content.path)
                        if isinstance(subcontents, list):
                            node["children"] = traverse_directory(
                                subcontents, current_depth + 1
                            )
                        else:
                            node["children"] = []
                    except Exception as e:
                        logger.warning(
                            "failed_to_get_subdir",
                            path=content.path,
                            error=str(e),
                        )
                        node["children"] = []
                else:
                    # For files, include size
                    node["size"] = content.size

                nodes.append(node)

            return nodes

        try:
            contents = repo.get_contents(path)
            if not isinstance(contents, list):
                contents = [contents]

            tree = traverse_directory(contents)
            logger.info(
                "directory_tree_retrieved",
                repo=repo.full_name,
                path=path,
                nodes=len(tree),
            )
            return tree

        except Exception as e:
            logger.error(
                "failed_to_get_directory_tree",
                repo=repo.full_name,
                path=path,
                error=str(e),
            )
            raise AppException(
                error_code="TREE_FETCH_FAILED",
                message=f"Failed to fetch directory tree: {str(e)}",
                status_code=500,
            )

    def get_file_content(self, repo_url: str, file_path: str) -> str:
        """Get content of a specific file.

        Args:
            repo_url: GitHub repository URL
            file_path: Path to file in repository

        Returns:
            File content as string

        Raises:
            AppException: If file not found or cannot be decoded
        """
        repo = self.get_repository(repo_url)

        try:
            content_file = repo.get_contents(file_path)

            if isinstance(content_file, list):
                raise AppException(
                    error_code="INVALID_FILE_PATH",
                    message=f"Path is a directory, not a file: {file_path}",
                    status_code=400,
                )

            # Decode content
            content = content_file.decoded_content.decode("utf-8")

            logger.info(
                "file_content_retrieved",
                repo=repo.full_name,
                file=file_path,
                size=len(content),
            )
            return content

        except UnicodeDecodeError as e:
            logger.error("file_decode_failed", file=file_path, error=str(e))
            raise AppException(
                error_code="FILE_DECODE_ERROR",
                message=f"Failed to decode file (binary file?): {file_path}",
                status_code=400,
            )
        except GithubException as e:
            if e.status == 404:
                logger.error("file_not_found", file=file_path)
                raise AppException(
                    error_code="FILE_NOT_FOUND",
                    message=f"File not found: {file_path}",
                    status_code=404,
                )
            raise
        except Exception as e:
            logger.error("file_fetch_failed", file=file_path, error=str(e))
            raise AppException(
                error_code="FILE_FETCH_FAILED",
                message=f"Failed to fetch file content: {str(e)}",
                status_code=500,
            )

    def get_rate_limit(self) -> Dict[str, Any]:
        """Get current API rate limit status.

        Returns:
            Dictionary with rate limit information:
            - limit: Maximum requests per hour
            - remaining: Remaining requests
            - reset: Timestamp when limit resets
        """
        rate_limit = self.client.get_rate_limit()

        info = {
            "core": {
                "limit": rate_limit.core.limit,
                "remaining": rate_limit.core.remaining,
                "reset": rate_limit.core.reset.isoformat(),
            },
            "search": {
                "limit": rate_limit.search.limit,
                "remaining": rate_limit.search.remaining,
                "reset": rate_limit.search.reset.isoformat(),
            },
        }

        logger.debug("rate_limit_checked", remaining=info["core"]["remaining"])
        return info
