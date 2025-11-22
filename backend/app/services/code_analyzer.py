"""Code analyzer for identifying project type, structure, and dependencies."""
import json
import re
import structlog
from typing import Dict, Any, List, Optional, Set
from pathlib import Path

from app.services.repository_service import repository_service

logger = structlog.get_logger()


class ProjectTypeIdentifier:
    """Identifies project type based on file patterns and configurations."""

    # Project type detection patterns
    TYPE_PATTERNS = {
        "Next.js": {
            "required_files": ["next.config.js", "package.json"],
            "alternative_files": [["next.config.ts", "next.config.mjs"]],
            "package_dependencies": ["next"],
        },
        "React": {
            "required_files": ["package.json"],
            "package_dependencies": ["react"],
            "exclude_dependencies": ["next", "gatsby"],
        },
        "Vue": {
            "required_files": ["package.json"],
            "package_dependencies": ["vue"],
        },
        "Angular": {
            "required_files": ["package.json", "angular.json"],
            "package_dependencies": ["@angular/core"],
        },
        "Svelte": {
            "required_files": ["package.json"],
            "package_dependencies": ["svelte"],
        },
        "Python": {
            "required_files": [],
            "alternative_files": [
                ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile"]
            ],
        },
        "Django": {
            "required_files": ["manage.py"],
            "alternative_files": [
                ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile"]
            ],
        },
        "Flask": {
            "required_files": [],
            "alternative_files": [
                ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile"]
            ],
            "file_content_patterns": [{"file": "requirements.txt", "pattern": r"Flask"}],
        },
        "FastAPI": {
            "required_files": [],
            "alternative_files": [
                ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile"]
            ],
            "file_content_patterns": [
                {"file": "requirements.txt", "pattern": r"fastapi"}
            ],
        },
        "Node.js": {
            "required_files": ["package.json"],
        },
        "Go": {
            "required_files": ["go.mod"],
        },
        "Rust": {
            "required_files": ["Cargo.toml"],
        },
        "Java": {
            "required_files": [],
            "alternative_files": [["pom.xml", "build.gradle", "build.gradle.kts"]],
        },
        "Spring Boot": {
            "required_files": [],
            "alternative_files": [["pom.xml", "build.gradle"]],
            "file_content_patterns": [
                {"file": "pom.xml", "pattern": r"spring-boot"},
                {"file": "build.gradle", "pattern": r"spring-boot"},
            ],
        },
    }

    def __init__(self, repo_url: str):
        """Initialize project type identifier.

        Args:
            repo_url: GitHub repository URL
        """
        self.repo_url = repo_url
        self._file_list: Optional[Set[str]] = None
        self._package_json: Optional[Dict[str, Any]] = None

    def _get_file_list(self) -> Set[str]:
        """Get list of all files in repository (cached).

        Returns:
            Set of file paths
        """
        if self._file_list is None:
            tree = repository_service.get_repository_tree(
                self.repo_url, path="", max_depth=2
            )
            self._file_list = self._extract_file_paths(tree)

        return self._file_list

    def _extract_file_paths(self, tree: List[Dict[str, Any]]) -> Set[str]:
        """Extract all file paths from directory tree.

        Args:
            tree: Directory tree data

        Returns:
            Set of file paths
        """
        paths = set()
        for item in tree:
            paths.add(item["path"])
            if item.get("children"):
                paths.update(self._extract_file_paths(item["children"]))
        return paths

    def _get_package_json(self) -> Optional[Dict[str, Any]]:
        """Get and parse package.json (cached).

        Returns:
            Parsed package.json content or None
        """
        if self._package_json is None:
            try:
                content = repository_service.get_file_content(
                    self.repo_url, "package.json"
                )
                self._package_json = json.loads(content)
            except Exception as e:
                logger.debug("package_json_not_found", error=str(e))
                self._package_json = {}

        return self._package_json if self._package_json else None

    def _check_file_exists(self, file_path: str) -> bool:
        """Check if a file exists in repository.

        Args:
            file_path: File path to check

        Returns:
            True if file exists
        """
        file_list = self._get_file_list()
        return file_path in file_list

    def _check_package_dependency(self, dependency: str) -> bool:
        """Check if package.json contains a dependency.

        Args:
            dependency: Dependency name to check

        Returns:
            True if dependency exists
        """
        package_json = self._get_package_json()
        if not package_json:
            return False

        all_deps = {
            **package_json.get("dependencies", {}),
            **package_json.get("devDependencies", {}),
        }

        return dependency in all_deps

    def _check_pattern(self, pattern: Dict[str, Any]) -> bool:
        """Check if project matches a type pattern.

        Args:
            pattern: Pattern definition

        Returns:
            True if pattern matches
        """
        # Check required files
        for required_file in pattern.get("required_files", []):
            if not self._check_file_exists(required_file):
                return False

        # Check alternative files (at least one must exist)
        for alternatives in pattern.get("alternative_files", []):
            if not any(self._check_file_exists(f) for f in alternatives):
                return False

        # Check package dependencies
        for dep in pattern.get("package_dependencies", []):
            if not self._check_package_dependency(dep):
                return False

        # Check excluded dependencies (must not exist)
        for dep in pattern.get("exclude_dependencies", []):
            if self._check_package_dependency(dep):
                return False

        # Check file content patterns
        for content_pattern in pattern.get("file_content_patterns", []):
            file_path = content_pattern["file"]
            pattern_regex = content_pattern["pattern"]

            if self._check_file_exists(file_path):
                try:
                    content = repository_service.get_file_content(
                        self.repo_url, file_path
                    )
                    if not re.search(pattern_regex, content, re.IGNORECASE):
                        return False
                except Exception:
                    return False

        return True

    def identify(self) -> Dict[str, Any]:
        """Identify project type and related information.

        Returns:
            Dictionary with:
            - primary_type: Main project type
            - framework: Specific framework (if applicable)
            - language: Primary programming language
            - all_types: List of all detected types
        """
        detected_types = []

        # Check each type pattern
        for type_name, pattern in self.TYPE_PATTERNS.items():
            if self._check_pattern(pattern):
                detected_types.append(type_name)
                logger.debug("type_detected", type=type_name)

        # Determine primary type (most specific first)
        priority_order = [
            "Next.js",
            "Django",
            "Flask",
            "FastAPI",
            "Spring Boot",
            "React",
            "Vue",
            "Angular",
            "Svelte",
            "Node.js",
            "Python",
            "Go",
            "Rust",
            "Java",
        ]

        primary_type = None
        for ptype in priority_order:
            if ptype in detected_types:
                primary_type = ptype
                break

        # Determine language
        language_map = {
            "Next.js": "JavaScript/TypeScript",
            "React": "JavaScript/TypeScript",
            "Vue": "JavaScript/TypeScript",
            "Angular": "TypeScript",
            "Svelte": "JavaScript/TypeScript",
            "Node.js": "JavaScript/TypeScript",
            "Python": "Python",
            "Django": "Python",
            "Flask": "Python",
            "FastAPI": "Python",
            "Go": "Go",
            "Rust": "Rust",
            "Java": "Java",
            "Spring Boot": "Java",
        }

        language = language_map.get(primary_type, "Unknown")

        # Determine framework
        framework_types = {
            "Next.js",
            "Django",
            "Flask",
            "FastAPI",
            "React",
            "Vue",
            "Angular",
            "Svelte",
            "Spring Boot",
        }
        framework = primary_type if primary_type in framework_types else None

        result = {
            "primary_type": primary_type or "Unknown",
            "framework": framework,
            "language": language,
            "all_types": detected_types,
        }

        logger.info(
            "project_type_identified",
            primary_type=result["primary_type"],
            framework=result["framework"],
            language=result["language"],
        )

        return result


class DependencyAnalyzer:
    """Analyzes project dependencies."""

    def __init__(self, repo_url: str, project_type: str):
        """Initialize dependency analyzer.

        Args:
            repo_url: GitHub repository URL
            project_type: Detected project type
        """
        self.repo_url = repo_url
        self.project_type = project_type

    def analyze(self) -> Dict[str, Any]:
        """Analyze project dependencies.

        Returns:
            Dictionary with dependencies information
        """
        if "Node.js" in self.project_type or any(
            t in self.project_type
            for t in ["Next.js", "React", "Vue", "Angular", "Svelte"]
        ):
            return self._analyze_node_dependencies()
        elif "Python" in self.project_type or any(
            t in self.project_type for t in ["Django", "Flask", "FastAPI"]
        ):
            return self._analyze_python_dependencies()
        elif "Go" in self.project_type:
            return self._analyze_go_dependencies()
        elif "Rust" in self.project_type:
            return self._analyze_rust_dependencies()
        elif "Java" in self.project_type or "Spring Boot" in self.project_type:
            return self._analyze_java_dependencies()

        return {}

    def _analyze_node_dependencies(self) -> Dict[str, Any]:
        """Analyze Node.js dependencies from package.json."""
        try:
            content = repository_service.get_file_content(
                self.repo_url, "package.json"
            )
            package_data = json.loads(content)

            dependencies = package_data.get("dependencies", {})
            dev_dependencies = package_data.get("devDependencies", {})

            # Extract core and notable dependencies
            core_deps = list(dependencies.keys())[:10]  # Top 10
            dev_deps = list(dev_dependencies.keys())[:10]

            return {
                "package_manager": "npm",
                "core_dependencies": core_deps,
                "dev_dependencies": dev_deps,
                "total_dependencies": len(dependencies),
                "total_dev_dependencies": len(dev_dependencies),
            }
        except Exception as e:
            logger.warning("failed_to_analyze_node_deps", error=str(e))
            return {}

    def _analyze_python_dependencies(self) -> Dict[str, Any]:
        """Analyze Python dependencies."""
        try:
            # Try requirements.txt first
            try:
                content = repository_service.get_file_content(
                    self.repo_url, "requirements.txt"
                )
                deps = [
                    line.split("==")[0].split(">=")[0].split("<=")[0].strip()
                    for line in content.splitlines()
                    if line.strip() and not line.startswith("#")
                ]
                return {
                    "package_manager": "pip",
                    "dependencies": deps[:20],  # Top 20
                    "total_dependencies": len(deps),
                }
            except Exception:
                pass

            # Try pyproject.toml
            try:
                content = repository_service.get_file_content(
                    self.repo_url, "pyproject.toml"
                )
                # Simple extraction (could be improved with TOML parser)
                return {"package_manager": "poetry", "dependencies": []}
            except Exception:
                pass

            return {}

        except Exception as e:
            logger.warning("failed_to_analyze_python_deps", error=str(e))
            return {}

    def _analyze_go_dependencies(self) -> Dict[str, Any]:
        """Analyze Go dependencies."""
        try:
            content = repository_service.get_file_content(self.repo_url, "go.mod")
            # Simple parsing of go.mod
            require_section = False
            deps = []
            for line in content.splitlines():
                line = line.strip()
                if line.startswith("require"):
                    require_section = True
                    continue
                if require_section and line.startswith(")"):
                    break
                if require_section and line:
                    dep = line.split()[0] if line.split() else ""
                    if dep:
                        deps.append(dep)

            return {
                "package_manager": "go modules",
                "dependencies": deps[:20],
                "total_dependencies": len(deps),
            }
        except Exception as e:
            logger.warning("failed_to_analyze_go_deps", error=str(e))
            return {}

    def _analyze_rust_dependencies(self) -> Dict[str, Any]:
        """Analyze Rust dependencies."""
        try:
            content = repository_service.get_file_content(self.repo_url, "Cargo.toml")
            # Simple extraction (could be improved with TOML parser)
            return {"package_manager": "cargo", "dependencies": []}
        except Exception as e:
            logger.warning("failed_to_analyze_rust_deps", error=str(e))
            return {}

    def _analyze_java_dependencies(self) -> Dict[str, Any]:
        """Analyze Java dependencies."""
        # Try Maven first
        try:
            content = repository_service.get_file_content(self.repo_url, "pom.xml")
            return {"package_manager": "maven", "dependencies": []}
        except Exception:
            pass

        # Try Gradle
        try:
            for gradle_file in ["build.gradle", "build.gradle.kts"]:
                try:
                    content = repository_service.get_file_content(
                        self.repo_url, gradle_file
                    )
                    return {"package_manager": "gradle", "dependencies": []}
                except Exception:
                    continue
        except Exception:
            pass

        return {}


class StructureAnalyzer:
    """Analyzes directory structure and identifies key directories."""

    IMPORTANT_DIRS = {
        "src",
        "app",
        "lib",
        "components",
        "pages",
        "api",
        "models",
        "views",
        "controllers",
        "services",
        "utils",
        "helpers",
        "config",
        "public",
        "static",
        "assets",
        "tests",
        "docs",
    }

    def __init__(self, repo_url: str):
        """Initialize structure analyzer.

        Args:
            repo_url: GitHub repository URL
        """
        self.repo_url = repo_url

    def analyze(self, tree: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze directory structure.

        Args:
            tree: Directory tree data

        Returns:
            Structure analysis results
        """
        key_directories = []
        all_dirs = []

        for item in tree:
            if item["type"] == "dir":
                dir_name = item["name"].lower()
                all_dirs.append(item["name"])

                if dir_name in self.IMPORTANT_DIRS:
                    key_directories.append(
                        {
                            "name": item["name"],
                            "path": item["path"],
                            "purpose": self._get_directory_purpose(dir_name),
                        }
                    )

        return {
            "total_directories": len(all_dirs),
            "key_directories": key_directories,
            "all_directories": all_dirs,
        }

    def _get_directory_purpose(self, dir_name: str) -> str:
        """Get description of directory purpose.

        Args:
            dir_name: Directory name

        Returns:
            Purpose description
        """
        purposes = {
            "src": "Source code",
            "app": "Application code",
            "lib": "Library/utility code",
            "components": "Reusable components",
            "pages": "Page components",
            "api": "API routes/endpoints",
            "models": "Data models",
            "views": "View templates",
            "controllers": "Controllers",
            "services": "Business logic services",
            "utils": "Utility functions",
            "helpers": "Helper functions",
            "config": "Configuration files",
            "public": "Public assets",
            "static": "Static files",
            "assets": "Assets",
            "tests": "Test files",
            "docs": "Documentation",
        }
        return purposes.get(dir_name, "Project directory")


class KeyFilesExtractor:
    """Extracts key files based on project type."""

    def __init__(self, repo_url: str, project_type: str):
        """Initialize key files extractor.

        Args:
            repo_url: GitHub repository URL
            project_type: Detected project type
        """
        self.repo_url = repo_url
        self.project_type = project_type

    def extract(self) -> List[Dict[str, str]]:
        """Extract key files list.

        Returns:
            List of key files with descriptions
        """
        key_files = [
            {"path": "README.md", "description": "Project documentation"},
            {"path": ".gitignore", "description": "Git ignore patterns"},
        ]

        # Add type-specific files
        if "Next.js" in self.project_type:
            key_files.extend(
                [
                    {"path": "package.json", "description": "Project dependencies"},
                    {"path": "next.config.js", "description": "Next.js configuration"},
                    {"path": "tsconfig.json", "description": "TypeScript configuration"},
                ]
            )
        elif any(
            t in self.project_type for t in ["React", "Vue", "Angular", "Node.js"]
        ):
            key_files.extend(
                [
                    {"path": "package.json", "description": "Project dependencies"},
                    {"path": "tsconfig.json", "description": "TypeScript configuration"},
                ]
            )
        elif "Python" in self.project_type:
            key_files.extend(
                [
                    {"path": "requirements.txt", "description": "Python dependencies"},
                    {"path": "setup.py", "description": "Package setup"},
                    {"path": "pyproject.toml", "description": "Project configuration"},
                ]
            )
        elif "Django" in self.project_type:
            key_files.extend(
                [
                    {"path": "manage.py", "description": "Django management script"},
                    {"path": "settings.py", "description": "Django settings"},
                ]
            )

        return key_files


class CodeAnalyzer:
    """Main code analyzer service."""

    def __init__(self, repo_url: str):
        """Initialize code analyzer.

        Args:
            repo_url: GitHub repository URL
        """
        self.repo_url = repo_url
        self.type_identifier = ProjectTypeIdentifier(repo_url)

    def analyze(self) -> Dict[str, Any]:
        """Perform full code analysis.

        Returns:
            Analysis results including:
            - project_type: Project type information
            - structure: Directory structure analysis
            - dependencies: Dependency information
            - key_files: Important files list
        """
        logger.info("starting_code_analysis", repo_url=self.repo_url)

        # Identify project type
        project_type_info = self.type_identifier.identify()
        primary_type = project_type_info["primary_type"]

        # Get directory tree
        tree = repository_service.get_repository_tree(
            self.repo_url, path="", max_depth=2
        )

        # Analyze structure
        structure_analyzer = StructureAnalyzer(self.repo_url)
        structure = structure_analyzer.analyze(tree)

        # Analyze dependencies
        dep_analyzer = DependencyAnalyzer(self.repo_url, primary_type)
        dependencies = dep_analyzer.analyze()

        # Extract key files
        files_extractor = KeyFilesExtractor(self.repo_url, primary_type)
        key_files = files_extractor.extract()

        result = {
            "project_type": project_type_info,
            "structure": structure,
            "dependencies": dependencies,
            "key_files": key_files,
        }

        logger.info("code_analysis_completed", repo_url=self.repo_url)
        return result
