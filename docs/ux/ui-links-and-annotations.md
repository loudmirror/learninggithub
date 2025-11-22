# LearningGitHub UI 链接与标注文档（MVP）

> 文档版本：v0.1（MVP 冻结版，当前记录为 v0.1 UI 基线）  
> 目的：集中记录 Figma 设计资源与关键标注，方便产品、设计和前端协作。生成首页 / 教程页设计后，请在此文档中补充链接与说明。

---

## 1. Figma 文件总览

- 文件名称：`LearningGitHub UI`
- 文件链接（Desktop + Mobile 设计）：
  - TODO：在此粘贴 Figma 文件链接

---

## 2. 页面与 Frame 对应

### 2.1 首页（Home）

- Desktop Frame 名称：`Home - LearningGitHub`
  - Figma Frame 链接：TODO
  - 对应路由：`/`
  - 说明：
    - 包含主输入区（URL + 语言选择 + 开始学习按钮）
    - 下方有最近项目列表与「如何使用」三步说明

- Mobile Frame 名称（如有）：`Home - Mobile`
  - Figma Frame 链接：TODO
  - 对应断点：视口宽度 < 1024px

### 2.2 教程页面（Tutorial）

- Desktop Frame 名称：`Tutorial - LearningGitHub`
  - Figma Frame 链接：TODO
  - 对应路由：`/tutorial/:owner/:repo`
  - 说明：
    - 左侧为项目概览 + 项目结构与重要文件 + 运行前准备 + 学习路径 + 当前模块步骤列表
    - 右侧为 Q&A 对话区域

- Mobile Frame 名称（如有）：`Tutorial - Mobile`
  - Figma Frame 链接：TODO
  - 对应断点：视口宽度 < 1024px

---

## 3. 组件与 Figma Component 映射

> 请在完成组件抽取后，补充实际组件名与链接。

- Button
  - Figma 组件名：`Button / Primary` 等
  - 用途：主操作（开始学习、发送问题等）

- Input（GitHub URL 输入框）
  - Figma 组件名：`Input / GithubUrl`
  - 对应前端组件：`GitHubUrlInput`

- Card（最近项目）
  - Figma 组件名：`Card / RecentRepo`
  - 对应前端组件：`RecentRepoCard`

- Step Card（步骤卡片）
  - Figma 组件名：`Card / Step`
  - 对应前端组件：`StepItem`

- Project Structure Panel（项目结构/文件讲解）
  - Figma 组件名：`Panel / ProjectStructure`
  - 对应前端组件：`ProjectStructurePanel`

- Learning Path Panel（学习路径/模块列表）
  - Figma 组件名：`Panel / LearningPath`
  - 对应前端组件：`LearningPathPanel`

- Code Block with Copy（代码块）
  - Figma 组件名：`CodeBlock / WithCopy`
  - 对应前端组件：`CodeBlockWithCopy`

- Chat Bubble / Q&A
  - Figma 组件名：`Chat / Message`
  - 对应前端组件：`ChatMessageList`, `ChatInputBox`

---

## 4. 标注约定（供设计与开发参考）

- 尺寸与栅格：
  - Desktop 主要使用 12 列或 16 列栅格，左右保留统一边距。
  - Mobile 使用单列布局，组件宽度尽量占据可用宽度。

- 字体与颜色：
  - 字体层级与颜色定义在 Design System Page 中，禁止页面内自定义颜色。
  - 前端实现时，优先参考 Design System 的 Token 名称。

- 交互状态：
  - 对 Button、Input、Card、Step Card 等组件，在 Figma 中以 Variant 形式提供正常/悬停/禁用或已完成等状态。
  - 前端应至少实现正常与禁用状态；悬停等微交互可按优先级逐步补齐。

---

## 5. 维护说明

- 每当更新 Figma 设计（新增页面或调整组件），请同步更新本文件中的：
  - 链接（文件 / Frame）
  - 组件名称与用途说明
- 如对响应式或交互行为有额外约定，请同时更新：
  - `docs/ux/front-end-spec.md`
  - 本文件的相关说明
