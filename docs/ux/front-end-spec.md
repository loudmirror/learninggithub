# LearningGitHub 前端开发规格说明（MVP）

> 文档版本：v0.1（MVP 冻结版，后续调整请更新版本与变更记录）

本规格说明基于 `docs/prd.md`、`docs/ux-core-flow.md` 与 `docs/ux-pages-and-layout.md`，面向前端工程师，约束页面结构、路由、组件划分、状态管理和与后端的交互方式。

---

## 1. 技术栈与整体约束

- 推荐栈：React（或 Next.js）+ TypeScript。
- UI：可使用 Ant Design 或 Tailwind，MVP 阶段以快速实现为主。
- 状态管理：MVP 使用组件内部 state + 简单的全局状态（例如 React Context），暂不引入复杂状态库。
- 国际化：暂时只实现中文，所有布局/文案在组件中通过可替换的常量或简单 i18n 封装处理。

---

## 2. 路由与页面结构

### 2.1 路由映射

- `/`  
  - 「首页 Home」视图。  
  - 功能：输入 GitHub URL、选择语言、查看最近学习项目。

- `/tutorial/:owner/:repo`  
  - 「教程 Tutorial」视图。  
  - 参数：
    - `owner`: 仓库 owner 名。
    - `repo`: 仓库名。
  - 查询参数（可选）：
    - `ref`: 来源标记（例如 `?ref=recent` 来源于最近项目）。

> 说明：实际项目中可根据后端接口设计调整路由形式，但需要保证「首页 → 教程」的单一主路径清晰。

---

## 3. 页面级组件设计

### 3.1 `<HomePage />`

**职责**

- 展示产品简要说明。
- 提供 GitHub URL 输入和语言选择。
- 显示最近学习的项目列表。

**主要区域**

- 顶部文案区域：产品标题 + 一句话说明。
- 主表单区域：
  - `GitHubUrlInput`：受控输入框，支持粘贴和即时校验。
  - `LanguageSelector`：下拉选择，目前仅中文可用但保留扩展接口。
  - `PrimaryButton`：「开始学习」。
- 最近项目区域：
  - `RecentRepoList`：展示本地存储中的最近仓库（名称、语言、star 数）。

**关键交互**

- URL 校验：
  - 基本格式检查（是否以 `https://github.com/` 开头）。
  - 错误提示展示在输入框下方，按钮禁用。
- 提交行为：
  - 点击「开始学习」或按回车时触发。
  - 解析出 `owner` 和 `repo`，导航到 `/tutorial/:owner/:repo`。
- 最近项目点击：
  - 点击卡片直接导航到对应 `TutorialPage`。

---

### 3.2 `<TutorialPage />`

**职责**

- 根据 URL 参数加载指定仓库的学习数据。
- 展示项目概览、项目结构/文件讲解、运行前准备、模块化学习路径、当前模块运行步骤和问答区域。

**主要区域**

- 顶部栏：
  - 仓库名（owner/repo）。
  - GitHub 链接按钮。
  - Star 数、主要语言。
  - 返回首页按钮。
- 主内容（左/上）：
  - `ProjectOverviewPanel`：项目概览。
  - `ProjectStructurePanel`：项目结构与文件讲解。
  - `RunPrerequisitesPanel`：运行前准备（环境要求与必要工具），UX 上视为运行教程的前置部分。
  - `LearningPathPanel`：模块化学习路径视图（模块列表与进度）。
  - `StepList`：当前学习模块对应的分步运行教程列表（基于 modules/stepIds 过滤）。
- 辅助内容（右/下）：
  - `QnAPanel`：问答区域。

**关键交互**

- 首次加载：
  - 从后端请求仓库学习数据（详情见第 5 章数据接口）。
  - 加载中显示骨架屏或 Loading 提示。
- 步骤操作：
  - 用户可以展开/折叠步骤卡片。
  - 点击「标记为完成」更新步骤状态（本地 state）。
  - 命令代码块支持一键复制。
- 问答操作：
  - 用户输入问题并提交，调用问答 API。
  - 显示生成中的状态，返回后追加到对话列表。

---

## 4. 组件划分与状态管理

### 4.1 主要组件列表（建议）

- 页面级：
  - `HomePage`
  - `TutorialPage`

- 通用组件：
  - `GitHubUrlInput`（封装输入和校验逻辑）
  - `LanguageSelector`
  - `PrimaryButton`
  - `LoadingOverlay`
  - `ErrorBanner`

- 首页相关：
  - `RecentRepoList`
  - `RecentRepoCard`

- 教程相关：
  - `ProjectOverviewPanel`
  - `RunPrerequisitesPanel`
  - `ProjectStructurePanel`
  - `LearningPathPanel`
  - `StepList`
  - `StepItem`
  - `CodeBlockWithCopy`
  - `QnAPanel`
  - `ChatMessageList`
  - `ChatInputBox`

### 4.2 状态管理建议

- 全局：
  - 用户最近访问仓库列表：可通过 `localStorage` + 简单 Context 封装。
  - 当前语言：简易的 `LanguageContext`。

- 页面内部：
  - `HomePage`：
    - `url`, `urlError`, `isSubmitting`, `recentRepos[]`。
  - `TutorialPage`：
    - `loading`, `error`, `tutorialData`（概览、前提条件、项目结构、学习路径、步骤）。
    - `stepStates[]`（每步是否完成/展开）。
    - `moduleStates[]`（每个学习模块是否完成/当前高亮）。
    - `qaMessages[]`（问答历史）。
    - `qaLoading`。

---

## 5. 与后端的数据接口（前端视角）

> 具体字段可在实现时与后端协商，这里给出前端期望的最小契约。

### 5.1 获取教程数据

- 方法：`GET /api/tutorial?repoUrl={encodedUrl}`
- 入参：
  - `repoUrl`：完整 GitHub 仓库 URL。
- 期望返回：
  - `repo`: `{ owner, name, stars, language, githubUrl }`
  - `overview`: 项目概览文案（Markdown 或 HTML）。
  - `prerequisites`: 数组，列出运行前准备项。
  - `structure`: 项目结构与文件讲解数据，例如：
    - `directories[]`: `{ path, description }`
    - `files[]`: `{ path, description }`
  - `modules`: 学习模块数组，每个模块：
    - `id`
    - `title`
    - `description`
    - `order`
    - `stepIds[]`（可选：本模块关联的步骤 id 列表）
  - `steps`: 数组，每个步骤：
    - `id`
    - `title`
    - `description`
    - `command`（字符串或数组）
    - `expectedResult`
    - `troubleshootingTips[]`

### 5.2 问答接口

- 方法：`POST /api/tutorial/qa`
- 入参：
  - `repoUrl`
  - `question`
  - （可选）`history`：前若干轮对话（供后端选择是否使用）。
- 返回：
  - `answer`：文本（Markdown 或 HTML）。
  - （可选）`sourceFiles[]`：引用到的文件路径列表。

### 5.3 错误约定

- 所有接口统一返回：
  - 成功：`{ ok: true, data: ... }`
  - 失败：`{ ok: false, errorCode, message }`
- 前端根据 `errorCode` 映射为：
  - `INVALID_URL`
  - `REPO_NOT_FOUND`
  - `REPO_TOO_LARGE`
  - `RATE_LIMITED`
  - `INTERNAL_ERROR`

---

## 6. 加载与错误状态处理

- 加载中：
  - 请求教程数据时，`TutorialPage` 展示 `LoadingOverlay`，隐藏步骤内容。
  - 请求问答时，仅在问答区域展示「正在生成回答…」，不阻塞其他操作。

- 错误：
  - 教程加载失败时，在主内容区域展示 `ErrorBanner`，提供「返回首页」和「重试」。
  - 问答失败时，在对话历史中追加一条错误系统消息（例如「很抱歉，当前无法获取回答，请稍后再试」）。

---

## 7. 样式与可访问性（MVP 要求）

- 字体大小和颜色对比度满足基本可读性（遵循常用 UI 框架默认值即可）。
- 代码块在窄屏下允许横向滚动，不压缩字体到难以阅读。
- 所有可点击元素（按钮、卡片）提供 hover/active 状态反馈。
- 表单元素（输入框、按钮）应支持键盘操作（Tab/Enter）。

---

## 8. 响应式规则（Desktop / Mobile）

- 断点约定：
  - 桌面端：视口宽度 ≥ 1024px。
  - 移动端：视口宽度 < 1024px。

- 首页布局：
  - 桌面端：主区域内容居中，URL 表单和最近项目列表位于单列中间，左右保留适当边距。
  - 移动端：与桌面内容顺序一致（标题 → 表单 → 最近项目 → 使用说明），仅在竖向堆叠，按钮和输入框宽度为全宽。

- 教程页布局：
  - 桌面端：主内容（项目概览 + 项目结构/文件讲解 + 运行前准备 + 学习路径 + 当前模块步骤）与问答区域采用左右两列布局（建议 70% / 30%），Q&A 始终可见。
  - 移动端：同一套组件竖向堆叠，优先展示教程内容（同样的模块顺序）；问答区域放在下方或通过 Tab 切换呈现。

- 组件一致性：
  - Desktop 与 Mobile 使用同一组件家族（Button、Input、Card 等），仅通过样式/尺寸调整适配断点，不修改元素文案、信息顺序和交互逻辑。
  - 所有布局使用栅格或 Auto Layout 实现，确保在两个断点下内容对齐和间距规则一致。

---

## 9. 后续可扩展方向（非 MVP）

- 完整 i18n 支持（多语言切换）。
- 更细粒度的组件库抽象（例如统一的卡片组件、面包屑导航等）。
- 将问答历史与用户身份关联（需要登录系统后）。
