"""Cache manager for storing and retrieving cached data."""
import json
import hashlib
import structlog
from pathlib import Path
from typing import Optional, Any
from datetime import datetime, timedelta

from app.config import settings

logger = structlog.get_logger()


class CacheManager:
    """File-based cache manager for API responses."""

    def __init__(self, cache_dir: str = ".cache"):
        """Initialize cache manager.

        Args:
            cache_dir: Directory to store cache files (relative to project root)
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.enabled = settings.cache_enabled
        self.ttl = settings.cache_ttl
        logger.info(
            "cache_manager_initialized",
            cache_dir=str(self.cache_dir),
            enabled=self.enabled,
            ttl=self.ttl,
        )

    def _get_cache_key(self, key: str) -> str:
        """Generate cache key hash.

        Args:
            key: Original cache key

        Returns:
            MD5 hash of the key
        """
        return hashlib.md5(key.encode()).hexdigest()

    def _get_cache_path(self, key: str) -> Path:
        """Get cache file path for a key.

        Args:
            key: Cache key

        Returns:
            Path to cache file
        """
        cache_key = self._get_cache_key(key)
        return self.cache_dir / f"{cache_key}.json"

    def get(self, key: str) -> Optional[Any]:
        """Get cached value.

        Args:
            key: Cache key

        Returns:
            Cached value if exists and not expired, None otherwise
        """
        if not self.enabled:
            return None

        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            logger.debug("cache_miss", key=key)
            return None

        try:
            with cache_path.open("r", encoding="utf-8") as f:
                cache_data = json.load(f)

            # Check expiration
            cached_at = datetime.fromisoformat(cache_data["cached_at"])
            expires_at = cached_at + timedelta(seconds=self.ttl)

            if datetime.now() > expires_at:
                logger.debug("cache_expired", key=key)
                # Remove expired cache
                cache_path.unlink()
                return None

            logger.debug("cache_hit", key=key)
            return cache_data["value"]

        except Exception as e:
            logger.error("cache_read_failed", key=key, error=str(e))
            # If cache read fails, remove the corrupted file
            if cache_path.exists():
                cache_path.unlink()
            return None

    def set(self, key: str, value: Any) -> bool:
        """Set cached value.

        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)

        Returns:
            True if successfully cached, False otherwise
        """
        if not self.enabled:
            return False

        cache_path = self._get_cache_path(key)

        try:
            cache_data = {
                "cached_at": datetime.now().isoformat(),
                "key": key,
                "value": value,
            }

            with cache_path.open("w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)

            logger.debug("cache_set", key=key)
            return True

        except Exception as e:
            logger.error("cache_write_failed", key=key, error=str(e))
            return False

    def delete(self, key: str) -> bool:
        """Delete cached value.

        Args:
            key: Cache key

        Returns:
            True if cache was deleted, False otherwise
        """
        cache_path = self._get_cache_path(key)

        if cache_path.exists():
            try:
                cache_path.unlink()
                logger.debug("cache_deleted", key=key)
                return True
            except Exception as e:
                logger.error("cache_delete_failed", key=key, error=str(e))
                return False

        return False

    def clear(self) -> int:
        """Clear all cached data.

        Returns:
            Number of cache files deleted
        """
        count = 0
        try:
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()
                count += 1

            logger.info("cache_cleared", files_deleted=count)
            return count

        except Exception as e:
            logger.error("cache_clear_failed", error=str(e))
            return count

    def get_stats(self) -> dict:
        """Get cache statistics.

        Returns:
            Dictionary with cache statistics:
            - total_files: Total number of cache files
            - total_size: Total size in bytes
            - enabled: Whether cache is enabled
            - ttl: Cache TTL in seconds
        """
        total_files = 0
        total_size = 0

        try:
            for cache_file in self.cache_dir.glob("*.json"):
                total_files += 1
                total_size += cache_file.stat().st_size

        except Exception as e:
            logger.error("cache_stats_failed", error=str(e))

        return {
            "total_files": total_files,
            "total_size": total_size,
            "enabled": self.enabled,
            "ttl": self.ttl,
        }


# Global cache instance
cache = CacheManager()
