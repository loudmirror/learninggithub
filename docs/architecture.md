# LearningGitHub 系统架构文档（MVP）

> 文档版本：v0.1（MVP 冻结版，对应 PRD v0.1）  
> 范围：支持「输入 GitHub 链接 → 中文项目概览 + 文件/模块讲解 + 模块化学习路径 + 运行教程 + 基础问答」

---

## 1. 架构目标与约束

- 快速支持 MVP：单体或轻量分层架构，优先开发效率与可维护性。
- 主要技术栈（参考技术方案 v0.1）：
  - 后端：Python + FastAPI
  - 前端：React 或 Next.js
  - 向量库：ChromaDB（嵌入式）
  - 外部：GitHub REST API + Git
  - LLM/Embedding 提供商：可插拔（例如 OpenAI）
- 仅支持公开仓库；优先支持常见栈（Node.js、Python），其他语言有限支持。
- 初期部署可为单实例应用（API + 前端 + 向量库同机），后续再拆分。

---

## 2. 高层架构视图

从宏观上，本系统可以分为四个主要部分：

1. 前端 Web 应用
   - 页面：Home、Tutorial
   - 职责：收集用户输入、展示教程与学习路径、提供问答交互 UI。

2. 应用后端（FastAPI）
   - API 网关层：对外暴露 HTTP API（如 `/api/tutorial`、`/api/tutorial/qa`）。
   - 领域服务层：
     - 仓库解析服务（Repo Service）
     - 内容处理与索引服务（Content/Index Service）
     - RAG 检索与生成服务（RAG Service）
     - 学习路径与进度服务（Learning Path Service）
     - 问答服务（Q&A Service）

3. 数据与存储
   - 持久化数据库（可选，MVP 可用轻量 DB 或文件存储）：
     - 仓库 Profile、教程结果缓存、学习路径定义。
   - 向量数据库（ChromaDB）：
     - 存储代码/文档片段嵌入，用于检索。
   - 本地仓库缓存（文件系统）：
     - 临时 Git clone 目录，用于解析文件与结构。

4. 外部依赖
   - GitHub API（REST）
   - Git 客户端（拉取仓库）
   - LLM/Embedding 服务（云 API）

---

## 3. 关键组件说明

### 3.1 前端 Web 应用

- `HomePage`
  - 输入 GitHub URL、选择语言。
  - 展示最近学习项目列表。
  - 调用后端 `/api/tutorial` 创建或获取教程。

- `TutorialPage`
  - 读取 URL 中的仓库标识或 repoUrl 参数。
  - 通过 `/api/tutorial` 获取：
    - 项目概览（overview）
    - 运行前准备（prerequisites）
    - 项目结构与文件讲解（structure）
    - 模块化学习路径（modules）
    - 分步运行教程（steps）
  - 渲染学习路径视图和当前模块的步骤列表。
  - 通过 `/api/tutorial/qa` 进行问答。

### 3.2 后端 API 网关层（FastAPI Router）

公开的主要 API：

- `GET /api/tutorial?repoUrl={url}`
  - 入参：repoUrl、可选 language。
  - 功能：如果已有缓存，返回已生成的教程；否则触发解析流程并返回结果（可同步或半同步）。

- `POST /api/tutorial/qa`
  - 入参：repoUrl、question、可选 history。
  - 功能：基于该仓库的向量索引和教程上下文进行问答。

MVP 阶段可以使用同步请求模式（用户等待 30–90 秒），后续可扩展为异步任务 + 轮询/进度 API。

### 3.3 仓库解析服务（Repo Service）

职责：

- 解析用户提供的 repoUrl，提取 owner/repo 信息。
- 调用 GitHub REST API 获取：
  - 基本信息（名称、描述、stars、language 等）。
  - README 内容。
- 使用 `git clone` 将仓库克隆到本地临时目录：
  - 建议按仓库 hash + 时间戳命名目录，避免冲突。
  - 实现基础的大小/文件数量限制；超出范围则返回错误。
- 构建项目目录树：
  - 遍历本地目录，过滤掉无关文件（如 node_modules、二进制文件、大型媒体）。
  - 记录核心目录（如 `src/`, `pages/`, `app/` 等）与关键文件（如入口文件、配置文件）。

### 3.4 内容处理与索引服务（Content/Index Service）

职责：

- 基于本地仓库构建内容片段：
  - README、主要代码文件、配置文件、路由等。
  - 以「文件/模块」为单位分段，保留路径与上下文信息。
- 生成嵌入向量并写入 ChromaDB：
  - 向量集合按 repoId 分区。
  - 每条记录包含：`{ repoId, path, type(file/dir), contentSnippet, embedding }`。
- 生成项目结构与文件讲解的数据基础：
  - 对核心目录/文件生成简要说明（可以基于模板 + LLM）。
  - 输出数据供 RAG 与学习路径服务使用。

### 3.5 RAG 检索与生成服务（RAG Service）

职责：

- 提供针对不同“生成任务”的检索与提示词组装：
  - 项目概览生成：聚焦 README + 顶级说明文件。
  - 运行教程生成：聚焦安装脚本、package.json/requirements.txt、README 中的安装/运行章节。
  - 文件/模块讲解：聚焦目录/文件本身及其周边代码片段。
- 将检索到的上下文片段与任务说明一起传给 LLM，生成结构化结果：
  - `overview`、`prerequisites`、`steps`、`structure`。

### 3.6 学习路径与进度服务（Learning Path Service）

职责：

- 根据教程内容和项目结构，为每个 repo 构建基础学习路径：
  - 模块列表：例如「环境准备」「跑通项目」「理解核心功能」「进阶扩展」。
  - 每个模块关联若干步骤或文件（元数据层面）。
- 将学习路径作为教程数据的一部分返回前端：
  - 每个模块：`{ id, title, description, order, stepIds[] }`。
- 进度管理（MVP）：
  - 优先由前端在浏览器本地保存模块完成状态。
  - 后续可扩展为写入后端（需要用户身份体系）。

### 3.7 问答服务（Q&A Service）

职责：

- 接收 `repoUrl` 与 `question`。
- 在对应 `repoId` 的向量索引中检索相关片段。
- 构造包含「问题 + 上下文片段 + 必要约束」的提示词，调用 LLM 生成回答。
- 返回回答文本和可选源文件列表（路径），供前端展示。

---

## 4. 主要数据模型概览（逻辑）

> 实际物理模型可根据选用的数据库调整，以下更偏逻辑视图。

- `RepositoryProfile`
  - repoId（owner + repo）
  - repoUrl
  - name
  - description
  - language
  - stars
  - createdAt / updatedAt

- `Tutorial`
  - repoId
  - overview（Markdown）
  - prerequisites[]
  - structure（目录/文件说明集合）
  - modules[]（学习模块）
  - steps[]（运行步骤）
  - createdAt / updatedAt

- `LearningModule`
  - id
  - repoId
  - title
  - description
  - order
  - stepIds[]

- 向量库记录（ChromaDB 集合结构）
  - repoId
  - path
  - type（file/dir/doc）
  - contentSnippet
  - embedding（由模型生成）

---

## 5. 关键流程时序（MVP）

### 5.1 创建/获取教程流程（同步简化版）

1. 前端调用 `GET /api/tutorial?repoUrl=...`。
2. API 网关检查本地缓存是否已有该 repo 的教程：
   - 若有：直接返回缓存结果。
   - 若无：
     1. 调用 Repo Service：解析 repoUrl、获取 GitHub 元信息、本地 Git clone。
     2. 调用 Content/Index Service：构建内容片段、写入向量库。
     3. 调用 RAG Service：生成 `overview`、`prerequisites`、`steps`、`structure`。
     4. 调用 Learning Path Service：基于上述结果生成 `modules[]`。
     5. 将 Tutorial 结果持久化（可选）并返回给前端。

### 5.2 问答流程

1. 前端调用 `POST /api/tutorial/qa` 提交问题与 repoUrl。  
2. API 网关解析 repoId 并构建 Q&A 请求。  
3. Q&A Service：
   - 在向量库中按 repoId 检索与问题相关的片段。
   - 与过去若干轮对话（可选）一起构造提示词，调用 LLM。
   - 返回回答文本与可选源文件路径列表。  
4. 前端将回答插入聊天界面。

---

## 6. 部署与运行时拓扑（建议）

MVP 阶段可采用单机/单容器部署：

- 一个服务实例：
  - 内含 FastAPI 应用。
  - 本地嵌入式 ChromaDB。
  - 本地磁盘作为 Git 仓库缓存与简单数据存储。
- 前端：
  - 通过静态资源（如 Next.js 部署到同一域名 / 同一反向代理）。
- 外部访问：
  - 出站访问 GitHub API 与 LLM/Embedding Provider。

后续扩展方向：

- 将向量库与长时间存储迁移到独立服务（托管 Chroma/Qdrant 等）。
- 将解析和索引流程改为异步任务队列（如 Celery/RQ + Redis），提升响应体验。

---

## 7. 风险与演进建议（架构视角）

- **性能与成本**
  - 对相同仓库的重复请求要强制走缓存。
  - 嵌入与生成阶段尽量批处理，减少 API 调用次数。

- **GitHub 速率限制**
  - 强制使用用户提供或服务端配置的 Token。
  - 引入简单的请求节流与错误提示机制。

- **大仓库处理**
  - 在 Repo Service 中实现大小/文件数阈值校验。
  - 可选支持用户上传压缩包作为替代方式（后续版本）。

- **LLM 输出质量**
  - 使用固定的模板与结构化字段约束输出，减少发散。
  - 针对典型技术栈预置规则（如 Node/Python 的运行/安装步骤偏好）。

---

本架构文档作为 v0.1 基线，后续如需支持私有仓库、账户体系或多模型调度，将在 v0.2+ 中扩展相应组件与流程。

