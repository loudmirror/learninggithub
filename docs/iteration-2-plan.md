# Iteration 2: AI驱动的智能分析

> 将 Mock 数据替换为真实的 AI 分析功能，实现自动化的代码理解和学习路径生成

## 📋 迭代目标

在 Iteration 1 的 MVP 基础上，实现真正的智能化功能：
- 集成 GitHub API 自动获取仓库信息和代码
- 实现代码结构分析和依赖关系解析
- 使用 AI 模型自动生成学习路径和代码讲解

## 🎯 核心功能

### 1. 仓库信息获取
- 通过 GitHub API 获取仓库基本信息（stars, forks, language等）
- 获取仓库目录树结构
- 下载关键文件内容用于分析

### 2. 代码分析
- 识别项目类型和技术栈
- 分析目录结构和文件组织
- 提取关键文件和入口文件
- 解析依赖关系

### 3. AI 学习路径生成
- 基于代码分析结果使用 AI 生成学习模块
- 为每个模块生成学习步骤
- 生成代码片段讲解和实用建议
- 自动化整个流程

## 📝 Story 拆分

### Story 2.1: GitHub API 集成

**目标**: 实现完整的 GitHub 仓库信息获取功能

**任务**:
1. 创建 GitHub API 客户端
   - 封装 GitHub REST API 调用
   - 处理 API 认证（支持 token）
   - 实现速率限制处理

2. 实现仓库信息获取
   - 获取仓库基本信息 (owner, name, description, stars, forks, language)
   - 获取仓库目录树
   - 下载关键文件内容

3. 添加缓存机制
   - 缓存仓库信息避免重复请求
   - 设置合理的过期时间

**验收标准**:
- ✅ 能够通过 URL 获取任意公开仓库的完整信息
- ✅ API 调用有错误处理和重试机制
- ✅ 有单元测试覆盖主要功能

### Story 2.2: 代码分析服务

**目标**: 实现自动化的代码结构分析

**任务**:
1. 项目类型识别
   - 根据文件特征识别项目类型（Next.js, React, Vue, Python等）
   - 识别主要技术栈

2. 目录结构分析
   - 解析目录树，识别关键目录（src, components, lib等）
   - 提取配置文件信息（package.json, tsconfig.json等）

3. 依赖关系分析
   - 解析 package.json / requirements.txt
   - 识别核心依赖和开发依赖

4. 关键文件提取
   - 识别入口文件
   - 提取重要配置文件
   - 选择代表性代码文件

**验收标准**:
- ✅ 能够准确识别常见项目类型
- ✅ 生成结构化的分析结果
- ✅ 支持至少 3 种主流技术栈（Next.js, React, Python）

### Story 2.3: AI 学习路径生成

**目标**: 使用 AI 模型自动生成个性化学习路径

**任务**:
1. AI 模型集成
   - 选择合适的 AI 模型（OpenAI GPT / Anthropic Claude）
   - 设计 Prompt 模板
   - 实现 AI API 调用封装

2. 学习模块生成
   - 基于代码分析结果生成学习模块
   - 确定模块依赖关系
   - 估算学习时长

3. 学习步骤生成
   - 为每个模块生成具体学习步骤
   - 提取相关代码片段
   - 生成代码讲解和提示

4. 结果后处理
   - 验证生成结果的格式
   - 清理和格式化输出
   - 错误处理和降级方案

**验收标准**:
- ✅ 能够为任意仓库生成完整的学习路径
- ✅ 生成的内容准确、有价值
- ✅ 整个流程在合理时间内完成（< 30秒）

## 🛠️ 技术选型

### 后端新增依赖

**GitHub 集成**:
- `PyGithub` - GitHub API Python 客户端
- `aiohttp` - 异步 HTTP 客户端

**代码分析**:
- `tree-sitter` - 代码解析器（可选）
- `gitpython` - Git 操作（可选）

**AI 集成**:
- `openai` - OpenAI API 客户端
- `anthropic` - Anthropic Claude API 客户端（备选）

**缓存**:
- `redis` - 缓存存储（可选）
- 或使用文件系统缓存

### 环境变量配置

新增环境变量：
```env
# GitHub API
GITHUB_TOKEN=your_github_token_here
GITHUB_API_BASE_URL=https://api.github.com

# AI Model
AI_PROVIDER=openai  # openai | anthropic
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4-turbo-preview
# ANTHROPIC_API_KEY=your_anthropic_key_here  # 可选

# Cache
CACHE_ENABLED=True
CACHE_TTL=3600  # 1 hour
```

## 📐 系统架构

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────────┐
│           FastAPI Backend            │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐  │
│  │   Tutorial Generation        │  │
│  │   Orchestrator               │  │
│  └────────┬─────────────────────┘  │
│           │                          │
│  ┌────────┼─────────┬──────────┐   │
│  ▼        ▼         ▼          ▼   │
│ ┌────┐ ┌─────┐ ┌─────┐ ┌──────┐   │
│ │Git │ │Code │ │ AI  │ │Cache │   │
│ │Hub │ │Anal │ │Gen  │ │Mgr   │   │
│ │API │ │yzer │ │     │ │      │   │
│ └────┘ └─────┘ └─────┘ └──────┘   │
│   │       │       │        │       │
└───┼───────┼───────┼────────┼───────┘
    │       │       │        │
    ▼       ▼       ▼        ▼
┌────────┐ ┌─────┐ ┌────┐ ┌─────┐
│ GitHub │ │Code │ │ AI │ │Cache│
│   API  │ │Files│ │API │ │Store│
└────────┘ └─────┘ └────┘ └─────┘
```

## 📊 数据流

1. **用户输入** → 前端接收 GitHub URL
2. **请求发送** → POST /api/tutorial?repoUrl={url}
3. **GitHub API** → 获取仓库信息和文件树
4. **代码分析** → 分析项目结构和技术栈
5. **AI 生成** → 基于分析结果生成学习路径
6. **返回结果** → 返回完整的 TutorialData
7. **前端渲染** → 展示学习路径和进度追踪

## 🔄 开发流程

### Phase 1: GitHub API 集成 (Story 2.1)
- [ ] 创建 GitHub 客户端模块
- [ ] 实现仓库信息获取
- [ ] 添加测试和文档
- [ ] 集成到现有 API 端点

### Phase 2: 代码分析 (Story 2.2)
- [ ] 实现项目类型识别器
- [ ] 实现结构分析器
- [ ] 实现依赖分析器
- [ ] 整合分析结果

### Phase 3: AI 生成 (Story 2.3)
- [ ] 设计 Prompt 模板
- [ ] 集成 AI API
- [ ] 实现结果解析和验证
- [ ] 端到端测试

### Phase 4: 优化和完善
- [ ] 添加缓存机制
- [ ] 性能优化
- [ ] 错误处理改进
- [ ] 文档更新

## ✅ 验收标准

**功能性**:
- ✅ 能够分析任意公开 GitHub 仓库
- ✅ 自动识别项目类型和技术栈
- ✅ 生成高质量的学习路径
- ✅ 前端能够正常展示生成的内容

**性能**:
- ✅ 整个流程在 30 秒内完成
- ✅ API 响应时间合理
- ✅ 适当的缓存减少重复请求

**可靠性**:
- ✅ 有完善的错误处理
- ✅ API 限流和重试机制
- ✅ 降级方案（AI 失败时使用模板）

**可维护性**:
- ✅ 代码结构清晰
- ✅ 有单元测试
- ✅ 文档完整

## 🚧 风险和挑战

### 技术风险
1. **GitHub API 限流**:
   - 缓解：使用认证 token，添加缓存
2. **AI 生成质量不稳定**:
   - 缓解：优化 Prompt，添加结果验证
3. **代码分析复杂度**:
   - 缓解：先支持主流框架，逐步扩展

### 成本风险
1. **AI API 调用费用**:
   - 缓解：添加缓存，限制请求频率
2. **GitHub API 配额**:
   - 缓解：使用认证提高配额

## 📅 时间估计

- **Story 2.1**: 2-3 天
- **Story 2.2**: 3-4 天
- **Story 2.3**: 4-5 天
- **总计**: 9-12 天（约 2 周）

## 🔗 相关资源

- [GitHub REST API 文档](https://docs.github.com/en/rest)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [PyGithub 文档](https://pygithub.readthedocs.io/)

---

**准备开始 Iteration 2！** 🚀
