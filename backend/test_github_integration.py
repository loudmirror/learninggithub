"""Test script for GitHub integration."""
import sys
import json
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.repository_service import repository_service


def test_repo_info():
    """Test fetching repository information."""
    print("=" * 60)
    print("Testing GitHub Repository Information Retrieval")
    print("=" * 60)

    # Test with a well-known public repository
    test_repo = "https://github.com/vercel/next.js"

    try:
        print(f"\n📦 Fetching info for: {test_repo}")
        repo_info = repository_service.get_repository_info(test_repo)

        print("\n✅ Successfully retrieved repository info:")
        print(f"   Owner: {repo_info['owner']}")
        print(f"   Name: {repo_info['name']}")
        print(f"   Description: {repo_info['description'][:100]}...")
        print(f"   Stars: {repo_info['stars']:,}")
        print(f"   Forks: {repo_info['forks']:,}")
        print(f"   Language: {repo_info['language']}")
        print(f"   Topics: {', '.join(repo_info['topics'][:5])}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_directory_tree():
    """Test fetching repository directory tree."""
    print("\n" + "=" * 60)
    print("Testing GitHub Directory Tree Retrieval")
    print("=" * 60)

    test_repo = "https://github.com/vercel/next.js"

    try:
        print(f"\n📁 Fetching directory tree for: {test_repo}")
        tree = repository_service.get_repository_tree(
            test_repo, path="", max_depth=2
        )

        print(f"\n✅ Successfully retrieved directory tree:")
        print(f"   Total top-level items: {len(tree)}")

        # Show first few items
        print("\n   First 5 items:")
        for item in tree[:5]:
            item_type = "📁" if item["type"] == "dir" else "📄"
            print(f"   {item_type} {item['name']}")
            if item["type"] == "dir" and "children" in item:
                print(f"      └─ ({len(item['children'])} items)")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_file_content():
    """Test fetching file content."""
    print("\n" + "=" * 60)
    print("Testing GitHub File Content Retrieval")
    print("=" * 60)

    test_repo = "https://github.com/vercel/next.js"
    test_file = "package.json"

    try:
        print(f"\n📄 Fetching file: {test_file} from {test_repo}")
        content = repository_service.get_file_content(test_repo, test_file)

        # Parse as JSON to verify it's valid
        package_data = json.loads(content)

        print(f"\n✅ Successfully retrieved file content:")
        print(f"   File size: {len(content)} bytes")
        print(f"   Package name: {package_data.get('name', 'N/A')}")
        print(f"   Package version: {package_data.get('version', 'N/A')}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_cache():
    """Test caching functionality."""
    print("\n" + "=" * 60)
    print("Testing Cache Functionality")
    print("=" * 60)

    test_repo = "https://github.com/vercel/next.js"

    try:
        print(f"\n🔄 First fetch (should hit GitHub API):")
        import time

        start = time.time()
        repo_info1 = repository_service.get_repository_info(test_repo, use_cache=True)
        time1 = time.time() - start
        print(f"   Time: {time1:.2f}s")

        print(f"\n🔄 Second fetch (should hit cache):")
        start = time.time()
        repo_info2 = repository_service.get_repository_info(test_repo, use_cache=True)
        time2 = time.time() - start
        print(f"   Time: {time2:.2f}s")

        if time2 < time1:
            print(f"\n✅ Cache is working! Second fetch was {time1/time2:.1f}x faster")
        else:
            print(f"\n⚠️  Cache might not be working as expected")

        # Verify data is the same
        if repo_info1 == repo_info2:
            print("✅ Cached data matches original data")
        else:
            print("❌ Cached data does not match original data")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "🚀" * 30)
    print("GitHub Integration Test Suite")
    print("🚀" * 30)

    results = {
        "Repository Info": test_repo_info(),
        "Directory Tree": test_directory_tree(),
        "File Content": test_file_content(),
        "Cache": test_cache(),
    }

    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")

    all_passed = all(results.values())
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed")
    print("=" * 60 + "\n")

    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
