"""Tutorial API routes."""
from typing import List, Dict, Any
from fastapi import APIRouter, Query
from pydantic import HttpUrl

from app.core.exceptions import InvalidRepoURLError
from app.core.logging import get_logger
from app.schemas.tutorial import (
    FileNode,
    Module,
    RepoInfo,
    RepositoryStructure,
    Step,
    TutorialData,
    TutorialResponse,
)
from app.services.repository_service import repository_service
from app.services.code_analyzer import CodeAnalyzer
from app.services.ai_generator import tutorial_generator

logger = get_logger(__name__)

router = APIRouter(tags=["tutorial"])


def convert_github_tree_to_file_nodes(tree_data: List[Dict[str, Any]]) -> List[FileNode]:
    """Convert GitHub directory tree to FileNode list.

    Args:
        tree_data: GitHub directory tree data

    Returns:
        List of FileNode objects
    """
    nodes = []
    for item in tree_data:
        node = FileNode(
            name=item["name"],
            path=item["path"],
            type=item["type"],
            children=(
                convert_github_tree_to_file_nodes(item["children"])
                if item.get("children")
                else None
            ),
        )
        nodes.append(node)
    return nodes


def get_real_tutorial_data(repo_url: str, language: str = "zh-CN") -> TutorialData:
    """Generate tutorial data using real GitHub API and AI.

    Args:
        repo_url: GitHub repository URL
        language: Output language

    Returns:
        Tutorial data with AI-generated learning path
    """
    # Fetch real repository information
    logger.info("fetching_real_repo_info", repo_url=repo_url)
    repo_info_data = repository_service.get_repository_info(repo_url)

    # Create RepoInfo from real data
    repo_info = RepoInfo(
        owner=repo_info_data["owner"],
        name=repo_info_data["name"],
        stars=repo_info_data["stars"],
        language=repo_info_data["language"],
        githubUrl=repo_url,
    )

    # Perform code analysis
    logger.info("analyzing_code", repo_url=repo_url)
    analyzer = CodeAnalyzer(repo_url)
    analysis = analyzer.analyze()

    # Fetch real directory tree
    logger.info("fetching_real_repo_tree", repo_url=repo_url)
    tree_data = repository_service.get_repository_tree(repo_url, path="", max_depth=2)

    # Convert tree data to FileNode format
    root_directories = convert_github_tree_to_file_nodes(tree_data)

    # Use key files from analysis
    key_files = analysis.get("key_files", [])

    structure = RepositoryStructure(
        rootDirectories=root_directories,
        keyFiles=key_files,
    )

    # Generate learning path with AI
    try:
        logger.info("generating_tutorial_with_ai", repo_url=repo_url)
        ai_tutorial = tutorial_generator.generate(
            repo_info=repo_info_data, analysis=analysis, language=language
        )

        overview = ai_tutorial.get("overview", f"{repo_info.name} 项目学习指南")
        prerequisites = ai_tutorial.get("prerequisites", [])
        modules_data = ai_tutorial.get("modules", [])
        steps_data = ai_tutorial.get("steps", [])

    except Exception as e:
        # Fallback to simplified version if AI fails
        logger.warning("ai_generation_failed_using_fallback", error=str(e))

        overview = (
            f"{repo_info.name} 是一个优秀的开源项目，"
            f"采用 {analysis['project_type']['language']} 开发。"
        )
        prerequisites = [
            "基础的编程知识",
            "Git 版本控制基础",
            f"{analysis['project_type']['language']} 语言基础",
        ]
        modules_data = [
            {
                "id": "module-1",
                "name": "环境准备",
                "description": "安装必要的工具和配置开发环境",
                "dependencies": [],
                "learningObjectives": ["配置开发环境", "理解项目依赖"],
                "estimatedMinutes": 30,
                "stepIds": ["step-1"],
            }
        ]
        steps_data = [
            {
                "id": "step-1",
                "title": "准备开发环境",
                "description": "配置必要的开发工具和环境",
                "filePath": "README.md",
                "lineStart": 1,
                "lineEnd": 5,
                "codeSnippet": f"# {repo_info.name}",
                "explanation": "配置开发环境是第一步",
                "tips": ["参考 README.md 文档"],
                "relatedFiles": ["README.md"],
                "moduleId": "module-1",
            }
        ]

    # Convert to Pydantic models
    modules = [Module(**m) for m in modules_data]
    steps = [Step(**s) for s in steps_data]

    logger.info(
        "real_tutorial_data_generated",
        repo=f"{repo_info.owner}/{repo_info.name}",
        modules=len(modules),
        steps=len(steps),
    )

    return TutorialData(
        repo=repo_info,
        overview=overview,
        prerequisites=prerequisites,
        structure=structure,
        modules=modules,
        steps=steps,
    )


def get_mock_tutorial_data(repo_url: str) -> TutorialData:
    """Generate mock tutorial data for a given repository URL.

    Args:
        repo_url: GitHub repository URL

    Returns:
        Mock tutorial data

    Raises:
        InvalidRepoURLError: If the URL format is invalid
    """
    # Basic URL validation
    if not repo_url.startswith("https://github.com/"):
        raise InvalidRepoURLError(repo_url)

    # Parse owner and repo name from URL
    parts = repo_url.replace("https://github.com/", "").split("/")
    if len(parts) < 2:
        raise InvalidRepoURLError(repo_url)

    owner = parts[0]
    repo_name = parts[1].rstrip(".git")

    # Create mock repository info
    repo_info = RepoInfo(
        owner=owner,
        name=repo_name,
        stars=120000,
        language="TypeScript",
        githubUrl=repo_url,
    )

    # Project overview
    overview = (
        f"{repo_name} 是一个优秀的开源项目，采用 TypeScript 开发。"
        f"本教程将引导你快速理解项目架构、配置开发环境，并掌握核心功能模块的实现原理。"
        f"通过系统化的学习路径，你将能够独立运行项目、理解关键代码，并为项目做出贡献。"
    )

    # Prerequisites
    prerequisites = [
        "Node.js 18.17 或更高版本",
        "npm 或 yarn 包管理器",
        "Git 版本控制基础知识",
        "TypeScript 基础语法",
        "React 开发经验（推荐）",
    ]

    # Repository structure
    structure = RepositoryStructure(
        rootDirectories=[
            FileNode(
                name="src",
                path="src/",
                type="directory",
                children=[
                    FileNode(name="components", path="src/components/", type="directory"),
                    FileNode(name="lib", path="src/lib/", type="directory"),
                    FileNode(name="app", path="src/app/", type="directory"),
                    FileNode(name="types", path="src/types/", type="directory"),
                ],
            ),
            FileNode(
                name="public",
                path="public/",
                type="directory",
                children=[
                    FileNode(name="images", path="public/images/", type="directory"),
                ],
            ),
            FileNode(
                name="tests",
                path="tests/",
                type="directory",
                children=[
                    FileNode(name="unit", path="tests/unit/", type="directory"),
                    FileNode(name="integration", path="tests/integration/", type="directory"),
                ],
            ),
        ],
        keyFiles=[
            {"path": "package.json", "description": "项目配置文件，定义依赖和脚本命令"},
            {"path": "tsconfig.json", "description": "TypeScript 编译配置"},
            {"path": "README.md", "description": "项目说明文档"},
            {"path": "next.config.js", "description": "Next.js 框架配置文件"},
            {"path": ".env.example", "description": "环境变量示例文件"},
        ],
    )

    # Learning modules
    modules = [
        Module(
            id="module-1",
            name="环境准备",
            description="安装必要的工具和配置开发环境，确保能够运行项目",
            dependencies=[],
            learningObjectives=[
                "掌握 Node.js 和 npm 的安装与配置",
                "理解项目的技术栈和依赖关系",
                "配置开发工具和编辑器",
            ],
            estimatedMinutes=30,
            stepIds=["step-1", "step-2", "step-3"],
        ),
        Module(
            id="module-2",
            name="跑通项目",
            description="克隆仓库、安装依赖并成功启动开发服务器",
            dependencies=["module-1"],
            learningObjectives=[
                "成功克隆 GitHub 仓库到本地",
                "理解项目的目录结构和文件组织",
                "启动开发服务器并验证环境",
            ],
            estimatedMinutes=45,
            stepIds=["step-4", "step-5", "step-6"],
        ),
        Module(
            id="module-3",
            name="理解核心架构",
            description="深入了解项目的核心架构、设计模式和关键技术决策",
            dependencies=["module-2"],
            learningObjectives=[
                "理解项目的整体架构设计",
                "掌握核心模块的职责划分",
                "了解数据流和状态管理",
            ],
            estimatedMinutes=90,
            stepIds=["step-7", "step-8"],
        ),
    ]

    # Learning steps
    steps = [
        # Module 1 steps
        Step(
            id="step-1",
            title="检查 Node.js 版本",
            description="确保你的系统安装了 Node.js 18.17 或更高版本。Node.js 是运行本项目的基础环境。",
            filePath="package.json",
            lineStart=1,
            lineEnd=5,
            codeSnippet='''{
  "name": "example-project",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.17.0"
  }
}''',
            explanation=(
                "项目的 package.json 文件中定义了对 Node.js 版本的要求。"
                "这确保所有开发者使用兼容的运行环境，避免因版本差异导致的问题。"
            ),
            tips=[
                "使用 `node --version` 命令检查当前版本",
                "推荐使用 nvm (Node Version Manager) 管理多个 Node.js 版本",
                "如果版本过低，请访问 nodejs.org 下载最新版本",
            ],
            relatedFiles=["package.json", ".nvmrc"],
            moduleId="module-1",
        ),
        Step(
            id="step-2",
            title="安装 Git 工具",
            description="Git 是必需的版本控制工具，用于克隆仓库和管理代码变更。",
            filePath=".gitignore",
            lineStart=1,
            lineEnd=8,
            codeSnippet='''# Dependencies
node_modules
.pnp
.pnp.js

# Production
/build
/dist''',
            explanation=(
                ".gitignore 文件告诉 Git 哪些文件和目录不应该被纳入版本控制。"
                "node_modules 目录包含大量第三方依赖，通过 npm install 可以重新生成，因此不需要提交到仓库。"
            ),
            tips=[
                "使用 `git --version` 检查 Git 是否已安装",
                "推荐安装 Git 2.x 以上版本",
                "配置 Git 用户名和邮箱：`git config --global user.name` 和 `git config --global user.email`",
            ],
            relatedFiles=[".gitignore", ".gitattributes"],
            moduleId="module-1",
        ),
        Step(
            id="step-3",
            title="配置编辑器",
            description="配置代码编辑器以获得最佳开发体验，包括代码提示、格式化等功能。",
            filePath=".vscode/settings.json",
            lineStart=1,
            lineEnd=10,
            codeSnippet='''{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}''',
            explanation=(
                "项目推荐使用 VS Code 作为开发工具。.vscode/settings.json 文件包含了项目级别的编辑器配置，"
                "可以确保所有团队成员使用一致的代码格式化规则和 TypeScript 版本。"
            ),
            tips=[
                "推荐安装 Prettier 和 ESLint 扩展",
                "启用 'Format On Save' 可以自动格式化代码",
                "如果使用其他编辑器，查阅项目 README 了解配置方法",
            ],
            relatedFiles=[".vscode/settings.json", ".vscode/extensions.json", ".prettierrc"],
            moduleId="module-1",
        ),
        # Module 2 steps
        Step(
            id="step-4",
            title="克隆仓库",
            description=f"使用 Git 将 {repo_name} 仓库克隆到本地计算机。",
            filePath="README.md",
            lineStart=15,
            lineEnd=20,
            codeSnippet=f'''## 快速开始

```bash
git clone {repo_url}
cd {repo_name}
npm install
```''',
            explanation=(
                "克隆操作会将远程 GitHub 仓库的所有文件和提交历史复制到本地。"
                "这是开始开发的第一步，确保你有最新的项目代码。"
            ),
            tips=[
                f"执行命令：`git clone {repo_url}`",
                "克隆完成后，使用 `cd {repo_name}` 进入项目目录",
                "如果克隆速度慢，可以考虑使用国内镜像或配置代理",
                "使用 `git branch -a` 查看所有分支",
            ],
            relatedFiles=["README.md", ".git/config"],
            moduleId="module-2",
        ),
        Step(
            id="step-5",
            title="安装项目依赖",
            description="使用 npm 或 yarn 安装项目所需的所有第三方库和工具。",
            filePath="package.json",
            lineStart=14,
            lineEnd=25,
            codeSnippet='''"dependencies": {
  "next": "^14.0.4",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.0"
},
"devDependencies": {
  "@types/react": "^18.2.42",
  "@types/node": "^20.10.0",
  "eslint": "^8.55.0",
  "prettier": "^3.1.0"
}''',
            explanation=(
                "package.json 的 dependencies 部分列出了项目运行所需的库，"
                "devDependencies 则包含开发时需要的工具。npm install 会读取这些配置并下载所有依赖到 node_modules 目录。"
            ),
            tips=[
                "在项目根目录执行 `npm install` 或 `yarn install`",
                "安装过程可能需要几分钟，取决于网络速度",
                "如果遇到权限问题，避免使用 sudo",
                "查看 package-lock.json 了解依赖的精确版本",
            ],
            relatedFiles=["package.json", "package-lock.json", "node_modules/"],
            moduleId="module-2",
        ),
        Step(
            id="step-6",
            title="启动开发服务器",
            description="运行开发服务器，在浏览器中预览项目，验证环境配置正确。",
            filePath="package.json",
            lineStart=6,
            lineEnd=12,
            codeSnippet='''"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest"
}''',
            explanation=(
                "package.json 的 scripts 部分定义了常用的命令别名。"
                "'npm run dev' 会启动 Next.js 开发服务器，提供热重载功能，代码修改后会自动刷新页面。"
            ),
            tips=[
                "执行 `npm run dev` 启动开发服务器",
                "通常开发服务器运行在 http://localhost:3000",
                "在浏览器中打开该地址查看项目",
                "使用 Ctrl+C 停止开发服务器",
                "如果端口被占用，会自动尝试其他端口",
            ],
            relatedFiles=["package.json", "next.config.js", ".env.local"],
            moduleId="module-2",
        ),
        # Module 3 steps
        Step(
            id="step-7",
            title="理解目录结构",
            description="熟悉项目的目录组织方式，了解各个目录的用途和职责。",
            filePath="src/app/layout.tsx",
            lineStart=1,
            lineEnd=15,
            codeSnippet='''import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <html lang="en"><body>{children}</body></html>
}''',
            explanation=(
                "Next.js 使用 App Router 模式组织代码。src/app 目录是应用的入口，"
                "layout.tsx 定义了页面的公共布局结构。每个子目录都可以有自己的 layout 和 page 文件，"
                "形成嵌套的路由结构。这种设计使得代码组织更加清晰，便于维护和扩展。"
            ),
            tips=[
                "src/app 目录对应路由结构",
                "src/components 存放可复用的 React 组件",
                "src/lib 包含工具函数和业务逻辑",
                "src/types 定义 TypeScript 类型",
                "public 目录存放静态资源如图片、字体等",
            ],
            relatedFiles=[
                "src/app/layout.tsx",
                "src/app/page.tsx",
                "src/components/",
                "src/lib/",
            ],
            moduleId="module-3",
        ),
        Step(
            id="step-8",
            title="探索核心功能模块",
            description="深入了解项目的核心功能实现，理解关键模块之间的交互关系。",
            filePath="src/lib/api/client.ts",
            lineStart=10,
            lineEnd=25,
            codeSnippet='''import axios, { AxiosInstance } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)''',
            explanation=(
                "这段代码展示了项目如何封装 HTTP 客户端。通过创建统一的 Axios 实例，"
                "可以在一个地方配置所有 API 请求的通用设置，如超时时间、基础 URL、请求头等。"
                "拦截器（interceptor）用于统一处理响应和错误，避免在每个 API 调用处重复相同的逻辑。"
            ),
            tips=[
                "查看 src/lib/api 目录了解 API 层的组织方式",
                "环境变量通过 .env 文件配置",
                "错误处理采用统一的拦截器模式",
                "所有 API 调用都应使用这个封装的 client",
            ],
            relatedFiles=[
                "src/lib/api/client.ts",
                "src/lib/api/tutorial.ts",
                ".env.example",
            ],
            moduleId="module-3",
        ),
    ]

    return TutorialData(
        repo=repo_info,
        overview=overview,
        prerequisites=prerequisites,
        structure=structure,
        modules=modules,
        steps=steps,
    )


@router.get("/tutorial", response_model=TutorialResponse)
async def get_tutorial(
    repo_url: HttpUrl = Query(..., alias="repoUrl", description="GitHub repository URL"),
    language: str = Query("zh-CN", description="Output language"),
    use_mock: bool = Query(False, alias="useMock", description="Use mock data instead of real GitHub API"),
) -> TutorialResponse:
    """Get tutorial for a GitHub repository.

    Args:
        repo_url: GitHub repository URL
        language: Output language code
        use_mock: If True, use mock data; if False, fetch real data from GitHub API

    Returns:
        Tutorial data

    Raises:
        InvalidRepoURLError: If the repository URL is invalid
        AppException: If GitHub API request fails
    """
    logger.info("get_tutorial", repo_url=str(repo_url), language=language, use_mock=use_mock)

    # Choose data source based on use_mock parameter
    if use_mock:
        logger.info("using_mock_data")
        tutorial_data = get_mock_tutorial_data(str(repo_url))
    else:
        logger.info("using_real_github_data")
        tutorial_data = get_real_tutorial_data(str(repo_url), language=language)

    logger.info("tutorial_generated", repo=f"{tutorial_data.repo.owner}/{tutorial_data.repo.name}")

    return TutorialResponse(ok=True, data=tutorial_data)
