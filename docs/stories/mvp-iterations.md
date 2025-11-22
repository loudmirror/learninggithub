# LearningGitHub MVP 迭代计划与任务列表

> 文档版本：v0.1  
> 依据：`docs/prd.md` v0.1、`docs/architecture.md` v0.1、`docs/ux/ux-spec.md` v0.1  
> 目标：分三个迭代完成 v0.1 MVP 能力

---

## 迭代 1：输入 URL → 概览 + 结构 + 学习路径（Mock 数据）

**迭代目标**

- 在不接 GitHub / LLM 的前提下，打通端到端体验：  
  Home 输入仓库 URL → Tutorial 显示「项目概览 + 项目结构与重要文件 + 运行前准备 + 模块化学习路径 + 当前模块步骤（简单版）」。
- 所有数据由后端以 Mock 形式返回，结构与 PRD / UX / 前端规格一致。

**后端任务**

1. 创建 FastAPI 项目骨架
   - 项目结构：`app/main.py`、路由模块、配置文件等。
   - 配置基础日志与错误处理（统一返回 `{ ok, data|errorCode, message }`）。

2. 实现 `GET /api/tutorial?repoUrl=...` Mock 接口
   - 接口入参：`repoUrl`（必填）、`language`（可选，默认 zh-CN）。
   - 返回字段需满足 `docs/ux/front-end-spec.md` 第 5.1 节要求：
     - `repo`: `{ owner, name, stars, language, githubUrl }`
     - `overview`
     - `prerequisites[]`
     - `structure.directories[]` / `structure.files[]`
     - `modules[]`
     - `steps[]`（可先只覆盖「环境准备」「跑通项目」等关键步骤）。
   - 先针对 1 个 Demo 仓库（例如 next.js）写死一份 JSON，repoUrl 不做真实校验。

3. 基础错误返回规范
   - 对缺失 repoUrl、明显非法 URL 等情况返回 `INVALID_URL`。
   - 其它错误统一返回 `INTERNAL_ERROR`，前期直接用默认错误信息。

**前端任务**

4. 创建前端项目骨架
   - 使用 React 或 Next.js，建立基础路由：
     - `/` → HomePage
     - `/tutorial/:owner/:repo` → TutorialPage
   - 配置基础布局与全局样式。

5. 实现 Home 页面（UI + 交互）
   - 按 `ux-spec.md` 与 `ux-pages-and-layout.md` 的定义，完成：
     - URL 输入框 + 语言选择器 + 「开始学习」按钮。
     - 最近学习项目列表（先用本地假数据）。
   - 点击「开始学习」时：
     - 调用 `/api/tutorial` 获取教程 Mock 数据。
     - 解析 `owner/repo` 后跳转到 `/tutorial/:owner/:repo`。

6. 实现 Tutorial 页面（UI + Mock 数据渲染）
   - 根据 `front-end-spec.md` 中的 `TutorialPage` 结构实现：
     - 顶部：仓库信息。
     - 左侧模块：
       - `ProjectOverviewPanel`（项目概览）。
       - `ProjectStructurePanel`（项目结构与重要文件）。
       - `RunPrerequisitesPanel`（运行前准备）。
       - `LearningPathPanel`（模块化学习路径）。
       - `StepList`（当前模块步骤；初期可暂时展示全部 steps）。
     - 右侧：`QnAPanel` 壳组件（仅 UI，不调用后端）。
   - 暂不处理模块/步骤状态持久化，仅用本地 state。

7. 基础 Loading / 错误处理
   - tutorial 加载中显示 Loading 状态；失败时使用简单错误提示与「返回首页」Link。

**验收标准**

- 手工输入指定 demo 仓库 URL 后，可以看到结构化的中文概览、项目结构、运行前准备、学习路径和步骤列表。
- 没有真实 GitHub / LLM 调用，但数据结构与后续真实实现保持兼容。

---

## 迭代 2：接入真实 GitHub 解析与运行步骤

**迭代目标**

- 替换迭代 1 的 Mock 数据，实现真实的 GitHub 仓库解析、项目结构提取、运行步骤生成（可使用 LLM / 规则混合）。

**后端任务**

1. 实现 Repo Service 与 GitHub 访问
   - 从 `repoUrl` 解析 `owner/repo`。
   - 调用 GitHub REST API 获取仓库元数据与 README。
   - 使用 `git clone` 克隆仓库到本地临时目录（带大小与文件数限制）。
   - 构建目录树，识别核心目录与关键文件（根据常见模式与规则）。

2. 内容处理与索引
   - 提取 README、关键代码文件、配置文件等内容。
   - 将内容按文件/模块分段，写入 ChromaDB（嵌入）。
   - 基于内容与结构生成：
     - `overview`（项目概览）。
     - `prerequisites[]`（运行前准备）。
     - `structure`（目录/文件说明）。

3. 运行步骤生成
   - 基于 `package.json`、`requirements.txt` 等文件 + README 中的运行说明：
     - 构造「环境准备」「跑通项目」等步骤。
     - 使用规则 + LLM 组合生成 `steps[]`。

4. 学习路径生成
   - 基于步骤与结构生成 `modules[]`（模块列表 + 顺序 + 关联步骤）。
   - 确保 `modules.stepIds[]` 可驱动前端仅展示当前模块步骤。

5. 缓存与错误处理
   - 对相同 repo 做缓存，避免重复 GitHub 调用。
   - 完善错误码（`REPO_NOT_FOUND`、`REPO_TOO_LARGE`、`RATE_LIMITED` 等）。

**前端任务**

6. 将 Tutorial 页面切换到真实数据模式
   - `TutorialPage` 根据 `repoUrl` 或 `owner/repo` 调用真实 `/api/tutorial`。
   - 更新 UI 以支持：
     - 目录/文件说明列表。
     - 模块化学习路径（模块列表 + 当前模块高亮）。
     - 当前模块步骤过滤（基于 `modules.stepIds`）。

7. 模块/步骤状态管理
   - 实现 `moduleStates[]` 与 `stepStates[]`：
     - 点击步骤「完成」时更新状态；
     - 如果一个模块内关键步骤全部完成，则标记模块为已完成。
   - 状态暂存于浏览器（localStorage），页面刷新后尽可能恢复。

8. UI 调整与优化
   - 根据真实数据长度，调整 Tutorial 布局与折叠策略（例如只展开当前模块，其他折叠）。

**验收标准**

- 针对若干真实 GitHub 仓库（中小型），能成功解析并生成合理的概览、结构、运行前准备、学习路径与步骤。
- 用户可以按模块和步骤完成「环境准备」和「跑通项目」两个模块。

---

## 迭代 3：接入 QA 与体验优化

**迭代目标**

- 实现围绕单仓库的上下文问答能力，并对学习路径与步骤的体验做一轮优化。

**后端任务**

1. 问答服务实现
   - 实现 `POST /api/tutorial/qa`：
     - 入参：`repoUrl`、`question`、可选 `history`。
     - 基于 ChromaDB 检索与问题相关的片段。
     - 构造提示词，调用 LLM 生成回答。
     - 返回回答文本与可选源文件路径列表。

2. 问答相关监控与限制
   - 添加最基本的速率限制与日志记录（防止滥用）。
   - 对调用失败时返回可解释的错误码与 message。

**前端任务**

3. 问答 UI 接入
   - `QnAPanel` 调用 `POST /api/tutorial/qa`，展示：
     - 用户提问气泡。
     - 模型回答气泡（支持多行文本与简单代码块）。
   - 显示「正在生成回答…」的局部 Loading 状态。
   - 对错误情况在对话内显示友好提示。

4. 学习路径与步骤体验优化
   - 基于使用体验：
     - 优化模块列表与步骤的展开/折叠策略。
     - 调整视觉层级与留白，使信息密度适中。

5. 小范围用户测试与反馈收集
   - 面向少量用户（同学/朋友）发放 Demo 链接。  
   - 收集关于：  
     - 是否看得懂学习路径；  
     - 是否能跑起来项目；  
     - 问答是否有帮助 等反馈。  

**验收标准**

- 用户可以在 Tutorial 页面中围绕项目提出问题并获得上下文相关回答。  
- 学习路径与步骤交互在真实使用场景下不会让用户迷失位置，主要信息一目了然。

---

本 `mvp-iterations.md` 为 MVP v0.1 的迭代规划基线，后续如需增加新功能（例如游戏化、社区、登录系统等），建议通过 v0.2+ 的新文档补充新的迭代章节。

