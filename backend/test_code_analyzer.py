"""Test script for code analyzer."""
import sys
import json
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.code_analyzer import CodeAnalyzer


def test_nextjs_project():
    """Test analyzing a Next.js project."""
    print("=" * 60)
    print("Testing Next.js Project Analysis")
    print("=" * 60)

    test_repo = "https://github.com/vercel/next.js"

    try:
        print(f"\n📊 Analyzing repository: {test_repo}")
        analyzer = CodeAnalyzer(test_repo)
        result = analyzer.analyze()

        print("\n✅ Analysis completed successfully!")
        print("\n📦 Project Type:")
        print(f"   Primary: {result['project_type']['primary_type']}")
        print(f"   Framework: {result['project_type']['framework']}")
        print(f"   Language: {result['project_type']['language']}")
        print(f"   All types: {', '.join(result['project_type']['all_types'])}")

        print("\n📁 Structure:")
        print(f"   Total directories: {result['structure']['total_directories']}")
        print(f"   Key directories: {len(result['structure']['key_directories'])}")
        for kdir in result['structure']['key_directories'][:5]:
            print(f"      - {kdir['name']}: {kdir['purpose']}")

        print("\n📚 Dependencies:")
        if result['dependencies']:
            print(f"   Package Manager: {result['dependencies'].get('package_manager', 'N/A')}")
            if 'core_dependencies' in result['dependencies']:
                print(f"   Core Dependencies ({result['dependencies']['total_dependencies']} total):")
                for dep in result['dependencies']['core_dependencies'][:5]:
                    print(f"      - {dep}")

        print("\n📄 Key Files:")
        for kfile in result['key_files'][:5]:
            print(f"   - {kfile['path']}: {kfile['description']}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_python_project():
    """Test analyzing a Python project."""
    print("\n" + "=" * 60)
    print("Testing Python Project Analysis")
    print("=" * 60)

    test_repo = "https://github.com/fastapi/fastapi"

    try:
        print(f"\n📊 Analyzing repository: {test_repo}")
        analyzer = CodeAnalyzer(test_repo)
        result = analyzer.analyze()

        print("\n✅ Analysis completed successfully!")
        print("\n📦 Project Type:")
        print(f"   Primary: {result['project_type']['primary_type']}")
        print(f"   Framework: {result['project_type']['framework']}")
        print(f"   Language: {result['project_type']['language']}")

        print("\n📁 Structure:")
        print(f"   Total directories: {result['structure']['total_directories']}")
        print(f"   Key directories found: {len(result['structure']['key_directories'])}")

        print("\n📚 Dependencies:")
        if result['dependencies']:
            print(f"   Package Manager: {result['dependencies'].get('package_manager', 'N/A')}")
            if 'dependencies' in result['dependencies']:
                print(f"   Total Dependencies: {result['dependencies'].get('total_dependencies', 0)}")
                for dep in result['dependencies'].get('dependencies', [])[:5]:
                    print(f"      - {dep}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "🧪" * 30)
    print("Code Analyzer Test Suite")
    print("🧪" * 30)

    results = {
        "Next.js Project": test_nextjs_project(),
        "Python Project": test_python_project(),
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
