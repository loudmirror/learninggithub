<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 我想构建一个 学习其他github应用。因為普通用戶尤其是不懂代码的用户。 要看懂GitHub是有難度的。 而且對于中文用户来说要看懂GitHub的英文是有困難的。 这个应用的核心功能就是用户只需要提供github的項目鏈接地址，然后这个應用就可以通过直接学习整个github项目，之后提供給這個用戶整個项目的手把手教程。 用户可以设置自己的母语为教程的默认语言。

现在我将生成最终答案。

# GitHub项目学习助手：构建指南与技术架构

## 概述

基于您的需求，本报告提供了一个完整的GitHub项目学习助手应用的构建方案。该应用旨在帮助不懂代码的用户和中文用户更容易地学习和理解GitHub上的开源项目，通过输入GitHub项目链接自动生成手把手的多语言教程。[^1][^2][^3]

![GitHub学习助手工作流程](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/ddf031df1be442fd0b7de831db2bde7f/83739569-103f-485c-a088-dce3017394e7/048966a9.png)

GitHub学习助手工作流程

## 核心功能设计

### 1. 项目解析与信息提取

应用的第一个核心功能是自动解析GitHub仓库。当用户提供GitHub项目链接后，系统需要通过**GitHub REST API**或**GraphQL API**获取仓库的完整信息。这包括仓库的基本元数据（描述、编程语言、星标数）、README文件内容、目录结构以及源代码文件。[^4][^5][^6][^7][^8]

为了实现高效的代码提取，可以使用专门的工具如**git-repo-parser**，这是一个NPM包，能够将整个GitHub仓库转换为结构化的JSON或TXT格式，特别适合AI和大语言模型(LLM)项目使用。该工具支持临时本地克隆、智能文件过滤（自动忽略二进制文件、日志等），并能保持完整的文件和目录结构。[^1]

**关键技术挑战：** GitHub API存在速率限制——未认证用户每小时只能发送60次请求，认证用户可达5000次。解决方案包括使用GitHub Personal Access Token进行认证、实现请求缓存机制、使用Redis缓存仓库信息，以及为大型项目提供离线处理选项。[^9][^10]

### 2. 智能内容理解与向量化

获取代码后，系统需要将其转换为机器可理解的格式。这个过程被称为**向量化(vectorization)**，是实现语义搜索和智能问答的基础。[^11][^12][^13]

**代码分块策略**至关重要。简单地按行数分块会破坏代码的语义结构，导致上下文丢失。更好的方法是使用**语法感知分块**：利用**tree-sitter**等AST(抽象语法树)解析器按函数、类或方法进行分块，同时保留必要的上下文信息如导入语句。每个代码块应该是一个语义完整的单元，大小适中（通常300-1000个token）。[^14][^15][^11]

接下来，使用**嵌入模型(embedding model)**将每个代码块转换为高维向量表示。可选方案包括：[^16][^12][^17]

- **OpenAI的text-embedding-ada-002**：性能优异但需要付费[^13][^11]
- **Hugging Face的开源模型**如sentence-transformers/all-MiniLM-L6-v2：免费且可本地部署[^3][^15]
- **专门的代码嵌入模型**：能更好地理解代码语义[^15]

生成的向量需要存储在**向量数据库**中以支持高效检索。推荐选项包括：[^17][^16]

- **FAISS**：Facebook开源，适合快速原型开发，支持精确搜索[^11][^14]
- **ChromaDB**：轻量级，易于集成Python应用[^17]
- **Qdrant**：功能强大，支持混合搜索和过滤[^15]
- **Pinecone**：托管服务，扩展性好但有成本[^16]


### 3. 基于RAG的教程生成

**检索增强生成(RAG, Retrieval Augmented Generation)**是该应用的核心技术。当用户请求教程或提出问题时，系统工作流程如下：[^18][^19][^11]

1. **查询嵌入**：将用户的问题转换为向量表示[^14][^11]
2. **语义检索**：在向量数据库中搜索最相关的代码片段，通常检索前3-5个最相似的chunks[^11][^14]
3. **上下文构建**：将检索到的代码片段与用户问题组合成提示词[^19][^18]
4. **LLM生成**：调用大语言模型（如GPT-4、Claude或开源的LLaMA、Mistral）生成详细的教程[^3][^16]

**LlamaIndex**和**LangChain**是两个强大的框架，可以大大简化RAG系统的实现。LlamaIndex特别适合构建数据索引和查询引擎，提供了开箱即用的GitHub仓库加载器。以下是一个简化的代码示例：[^8][^20][^21][^16][^3]

```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from llama_index.readers.github import GithubRepositoryReader

# 加载GitHub仓库
documents = GithubRepositoryReader(
    github_client=github_client,
    owner="用户名",
    repo="仓库名"
).load_data(branch="main")

# 创建向量索引
index = VectorStoreIndex.from_documents(documents)

# 构建查询引擎
query_engine = index.as_query_engine()

# 生成教程
response = query_engine.query("如何使用这个项目？")
```


### 4. 多语言支持

为了支持中文用户，应用需要实现强大的**多语言翻译功能**。关键考虑包括：[^22][^23][^24]

**翻译策略**：

- 使用专业的AI翻译API（OpenAI、DeepL、Google Translate）[^23][^24][^25]
- 构建**技术术语词典**，确保专业术语翻译的一致性和准确性[^24]
- **保留代码片段不翻译**，避免破坏代码结构[^24]
- 对关键技术概念进行人工审核[^24]

**实施方案**：

- 在用户界面中添加语言选择器，支持中文（简体/繁体）、英文等多种语言[^26][^27][^28]
- 将语言设置保存为用户偏好，作为教程生成的默认语言[^2][^29]
- 对于GitHub README的翻译，可以参考**translate-readme**等开源项目的实践[^27][^28][^26]

**翻译质量保障**：

- 实现翻译质量评估指标
- 收集用户反馈进行持续改进
- 对比不同翻译服务的效果
- A/B测试优化翻译策略


## 用户界面设计

### 渐进式信息披露

应用应采用**渐进式披露(progressive disclosure)**的UX设计理念。这种方法通过逐步揭示信息来减少认知负荷，特别适合不懂代码的初学者。[^30][^31][^32][^33]

**首页设计**：

- 简洁的输入框用于粘贴GitHub URL[^34][^7]
- 清晰的语言选择器（支持中文、英文等）[^22][^23]
- 可选的高级选项（折叠显示），如文件类型过滤、深度控制等[^32][^33]

**教程展示页面**：

- **项目概览**：显示项目名称、描述、技术栈、依赖关系[^7][^34]
- **可视化结构图**：使用树状图或Mermaid图表展示项目文件结构[^35][^34]
- **分步教程**：按逻辑顺序组织，每个步骤包含：[^36][^37][^38]
    - 清晰的标题和目标说明
    - 代码片段（使用highlight.js进行语法高亮）[^39]
    - 详细的中文解释
    - 预期输出和验证方法
- **交互式Q\&A**：用户可以针对代码提问，获得实时解答[^2][^3]
- **代码playground**：允许用户直接在浏览器中运行简单代码示例[^40][^41]


### 学习路径设计

参考优秀编程学习平台的经验，应用应提供：[^42][^43][^44][^40]

**模块化学习内容**：

- 将复杂项目分解为多个学习模块
- 每个模块对应项目的一个核心功能或组件
- 按依赖关系和难度排序

**游戏化元素**：[^45][^46]

- 进度追踪和完成度显示
- 里程碑徽章和成就系统
- 学习时长统计

**协作功能**：[^46][^33]

- 社区讨论区
- 问题标记和解答
- 学习笔记共享


## 技术架构建议

### 后端架构

**技术栈**：

- **编程语言**：Python（推荐）或Node.js[^16][^3]
- **Web框架**：FastAPI（Python）或Express（Node.js）[^47][^48]
- **数据库**：
    - PostgreSQL用于存储用户数据、项目元数据、缓存信息[^12][^13]
    - Redis用于会话管理和高频访问数据缓存[^5]
- **向量数据库**：FAISS、ChromaDB或Qdrant[^17][^15][^16]

**关键模块**：

1. **GitHub集成服务**：处理API调用、仓库克隆、文件解析[^10][^1][^5]
2. **向量化服务**：代码分块、嵌入生成、索引构建[^12][^13][^11]
3. **RAG引擎**：查询处理、向量检索、上下文构建[^18][^19][^11]
4. **LLM接口**：统一的LLM调用接口，支持多个提供商[^3][^16]
5. **翻译服务**：多语言支持和术语管理[^25][^23][^24]
6. **缓存层**：减少API调用和提高响应速度[^5][^10]

### 前端架构

**技术栈**：

- **框架**：React或Vue.js[^49][^47]
- **UI组件库**：Ant Design、Material-UI或Tailwind CSS[^50][^47]
- **状态管理**：Redux或Vuex
- **代码高亮**：highlight.js或Prism.js[^39]
- **图表库**：Mermaid.js用于结构可视化[^35]
- **实时通信**：WebSocket用于交互式Q\&A[^33]

**响应式设计**：确保在桌面、平板和移动设备上都有良好的用户体验。[^50][^33]

### 部署方案

**容器化**：使用Docker进行容器化部署，确保环境一致性。[^51][^47]

**云服务选择**：

- **AWS**：EC2、Lambda、S3、RDS[^52]
- **Vercel**：适合前端托管和无服务器函数[^47]
- **Render**或**Railway**：提供简单的全栈部署方案

**CI/CD**：设置GitHub Actions进行自动化测试和部署。[^53][^26]

## 实施步骤

### 第一阶段：基础设施搭建（2-3周）

1. 搭建后端服务器，选择FastAPI或Express框架[^48][^47]
2. 设置PostgreSQL数据库存储元数据和用户信息[^12]
3. 配置环境变量管理，确保API密钥安全[^47]
4. 建立错误处理和日志系统，便于调试和监控[^47]

### 第二阶段：GitHub集成（2-3周）

1. 集成GitHub REST API或GraphQL API[^6][^54][^4]
2. 实现仓库信息获取功能，包括README、文件树、代码内容[^55][^10][^5]
3. 开发代码文件下载和解析模块，使用git-repo-parser或类似工具[^1]
4. 处理API速率限制，实现Token认证和请求缓存[^9][^10]

### 第三阶段：AI/ML集成（3-4周）

1. 选择并配置向量数据库（FAISS、ChromaDB或Qdrant）[^15][^16][^17]
2. 集成嵌入模型，可选OpenAI或Hugging Face的开源模型[^13][^11]
3. 实现智能代码分块策略，考虑使用tree-sitter进行语法分析[^11][^15]
4. 构建RAG检索和生成管道，使用LlamaIndex或LangChain[^21][^16][^3]

### 第四阶段：前端开发（3-4周）

1. 使用React或Vue.js构建用户界面[^49][^47]
2. 实现URL输入和语言选择功能[^34][^7]
3. 设计教程展示页面，包含代码高亮和结构可视化[^34][^39][^35]
4. 开发交互式Q\&A界面，支持实时问答[^33][^2][^3]

### 第五阶段：优化与测试（2-3周）

1. 优化向量检索性能，实施批处理和索引优化[^12][^11]
2. 实现多级缓存机制，减少API调用成本[^5]
3. 进行多语言翻译质量测试，建立评估指标[^23][^24]
4. 组织用户测试，收集反馈并迭代改进[^37][^30]

## 技术挑战与解决方案

### 1. GitHub API速率限制

**问题**：未认证请求每小时60次，认证请求5000次。[^10]

**解决方案**：

- 强制用户使用GitHub Token认证[^9][^10]
- 实现Redis缓存，存储常访问的仓库数据
- 提供离线处理模式，允许用户上传代码压缩包
- 实现请求队列和速率限制监控


### 2. 大型代码库处理效率

**问题**：数百MB的项目处理时间长，内存消耗大。

**解决方案**：

- 实现渐进式加载，优先处理核心文件
- 过滤测试文件、文档、媒体文件等非必要内容[^1]
- 使用流式处理而非一次性加载全部内容
- 设置合理的文件大小和数量限制


### 3. 代码分块与上下文保留

**问题**：简单分块破坏语义结构，导致上下文丢失。[^11]

**解决方案**：

- 使用tree-sitter进行AST解析，按函数/类分块[^15][^11]
- 实现重叠分块，保留必要的上下文信息
- 在每个chunk中包含文件路径、导入语句等元数据
- 维护代码片段之间的依赖关系图


### 4. 多语言翻译质量

**问题**：技术术语翻译不准确，上下文意义丢失。[^24]

**解决方案**：

- 构建技术术语词典，确保一致性翻译[^24]
- 保留代码片段、变量名、函数名不翻译
- 使用专业的技术翻译API（DeepL、OpenAI）[^25][^23]
- 实现人工审核机制，收集用户纠错反馈


### 5. LLM调用成本控制

**问题**：频繁调用OpenAI等API成本高昂。[^16]

**解决方案**：

- 实现多级缓存：内存缓存、Redis缓存、数据库缓存
- 使用开源模型（LLaMA 2、Mistral）进行本地部署[^3][^16]
- 批处理多个请求，减少API调用次数
- 缓存常见问题的答案，避免重复生成


### 6. 教程生成质量

**问题**：生成内容不够清晰或缺乏实操性。[^38][^37]

**解决方案**：

- 精心设计提示词模板，明确要求结构化输出[^37][^47]
- 在提示中要求包含代码示例和验证步骤[^38][^37]
- 实现用户评分反馈系统，持续优化提示词
- 采用few-shot learning，在提示中包含优质示例


### 7. 实时性能优化

**问题**：用户等待时间过长影响体验。

**解决方案**：

- 采用异步处理架构，后台处理耗时任务[^47]
- 使用WebSocket提供实时进度反馈[^33]
- 实现流式输出，逐步显示生成的教程内容
- 使用CDN加速静态资源加载[^47]


## 最佳实践与建议

### 教程结构设计

参考技术教程的最佳实践，生成的教程应包含：[^37][^38]

1. **引言**：简要说明项目用途和学习目标[^37]
2. **先决条件**：列出需要的技术背景和工具[^37]
3. **项目概览**：高层架构和技术栈说明[^37]
4. **分步指南**：详细的实施步骤，每步包含：[^38][^37]
    - 清晰的标题
    - 代码示例
    - 详细解释
    - 预期输出
    - 验证方法
5. **故障排除**：常见问题和解决方案
6. **总结**：关键要点和下一步建议[^37]

### 代码生成最佳实践

参考AI代码生成的最佳实践：[^56][^57]

- **提供清晰的上下文**：在提示词中包含足够的背景信息[^56]
- **迭代改进**：允许用户提供反馈，持续优化输出[^56]
- **质量审核**：自动检查生成代码的语法正确性
- **风格一致性**：确保生成的代码遵循项目的编码规范[^57]
- **文档生成**：自动为代码添加注释和文档字符串[^58][^59][^57]


### 用户体验优化

借鉴成功编程学习平台的经验：[^43][^44][^41][^40]

- **即时反馈**：用户操作后立即显示结果[^44][^40]
- **清晰导航**：使用面包屑、侧边栏、进度条等帮助用户定位[^30][^46]
- **个性化学习**：记住用户的进度和偏好设置[^44][^30]
- **社区互动**：支持用户提问、分享和讨论[^40][^46]
- **移动友好**：确保在移动设备上也能良好使用[^50][^33]


## 类似项目参考

在实施过程中，可以参考以下现有项目和工具：

1. **RepoMaster**：一个自主探索和理解GitHub仓库的AI代理框架[^60]
2. **Chat with GitHub Repo**：使用LlamaIndex和Chainlit构建的GitHub仓库问答系统[^3]
3. **GitHub Classroom**：GitHub官方的教育工具，提供代码分发和收集功能[^53]
4. **ReadmeCodegen**：AI驱动的README文件生成器[^34]
5. **InstantReadme**：从GitHub仓库URL生成README的工具[^7]
6. **Codecademy、freeCodeCamp**：优秀的交互式编程学习平台[^43][^40]

## 结论

构建一个GitHub项目学习助手是一个技术上可行且有实际价值的项目。通过结合**GitHub API集成**、**RAG技术**、**向量数据库**和**多语言AI翻译**，可以创建一个强大的工具，帮助不懂代码的用户和中文用户更容易地理解和学习GitHub上的开源项目。[^2][^1][^16][^3]

**关键成功因素**包括：

- 高质量的代码解析和语义理解[^15][^11]
- 准确的向量检索和相关性排序[^14][^11]
- 清晰、结构化的教程生成[^38][^37]
- 优秀的多语言翻译质量[^23][^24]
- 流畅的用户体验设计[^32][^30][^33]

**建议的开发周期**为**12-16周**，分五个阶段逐步实施。初期可以从MVP（最小可行产品）开始，实现核心功能，然后根据用户反馈持续迭代改进。[^30][^37]

通过遵循本报告提供的技术架构、实施步骤和最佳实践，您将能够构建一个功能强大、用户友好的GitHub学习助手应用，为全球开发者特别是中文用户降低学习开源项目的门槛。
<span style="display:none">[^100][^101][^102][^103][^104][^105][^106][^107][^108][^109][^110][^111][^112][^113][^114][^115][^116][^117][^61][^62][^63][^64][^65][^66][^67][^68][^69][^70][^71][^72][^73][^74][^75][^76][^77][^78][^79][^80][^81][^82][^83][^84][^85][^86][^87][^88][^89][^90][^91][^92][^93][^94][^95][^96][^97][^98][^99]</span>

<div align="center">⁂</div>

[^1]: https://www.reddit.com/r/developersIndia/comments/1dv2sqd/gitrepoparser_a_npm_package_to_scrape_all_files/

[^2]: https://www.linkedin.com/posts/sahin-ahmed-469354170_how-to-turn-any-github-repo-into-a-conversational-activity-7290744953045979137-5YR2

[^3]: https://dev.to/karanjanthe/chat-with-your-github-repo-using-llamaindex-and-chainlit-452f

[^4]: https://docs.github.com/en/rest/about-the-rest-api/about-the-rest-api

[^5]: https://towardsdatascience.com/all-the-things-you-can-do-with-github-api-and-python-f01790fca131/

[^6]: https://docs.github.com/en/rest

[^7]: https://devpost.com/software/test-vij1g5

[^8]: https://developers.llamaindex.ai/python/examples/usecases/github_issue_analysis/

[^9]: https://paulcbauer.github.io/apis_for_social_scientists_a_review/github.com-api.html

[^10]: https://www.reddit.com/r/github/comments/14f9tof/extracting_data_from_github_repositories_using/

[^11]: https://dev.to/zachary62/retrieval-augmented-generation-rag-from-scratch-tutorial-for-dummies-508a

[^12]: https://www.mongodb.com/docs/atlas/atlas-vector-search/create-embeddings/

[^13]: https://www.tigerdata.com/learn/a-beginners-guide-to-vector-embeddings

[^14]: https://huggingface.co/blog/ngxson/make-your-own-rag

[^15]: https://adasci.org/code-search-with-vector-embeddings-using-qdrant-vector-database/

[^16]: https://github.com/run-llama/llama_index

[^17]: https://realpython.com/chromadb-vector-database/

[^18]: https://learnbybuilding.ai/tutorial/rag-from-scratch/

[^19]: https://www.singlestore.com/blog/a-guide-to-retrieval-augmented-generation-rag/

[^20]: https://llamaindexxx.readthedocs.io/en/latest/examples/data_connectors/GithubRepositoryReaderDemo.html

[^21]: https://docs.langchain.com/oss/python/langchain/rag

[^22]: https://musely.ai/tools/ai-code-generator

[^23]: https://ai-code-translator.com

[^24]: https://www.docuwriter.ai/posts/code-language-translator

[^25]: https://www.deepl.com/en/translator

[^26]: https://github.com/ephraimduncan/translate-readme

[^27]: https://github.com/marketplace/actions/translate-readme-action

[^28]: https://dev.to/ephraimduncan/translate-readme-to-any-language-2jia

[^29]: https://realpython.com/ref/ai-coding-tools/codegeex/

[^30]: https://userguiding.com/blog/progressive-onboarding

[^31]: https://dev.to/lollypopdesign/the-power-of-progressive-disclosure-in-saas-ux-design-1ma4

[^32]: https://www.interaction-design.org/literature/topics/progressive-disclosure

[^33]: https://www.userflow.com/blog/onboarding-user-experience-the-ultimate-guide-to-creating-exceptional-first-impressions

[^34]: https://www.readmecodegen.com/blog/how-to-create-professional-github-readme-file-with-ai-step-by-step-guide-2025

[^35]: https://dev.to/anmolbaranwal/make-github-readme-like-pro-15am

[^36]: https://theimowski.com/blog/2016/12-19-creating-a-tutorial-from-git-repo/index.html

[^37]: https://dev.to/dunithd/how-to-structure-a-perfect-technical-tutorial-21h9

[^38]: https://www.ryanjyost.com/how-to-write-a-coding-tutorial/

[^39]: https://code.visualstudio.com/docs/getstarted/getting-started

[^40]: https://www.codecademy.com

[^41]: https://dev.to/evergrowingdev/5-interactive-learning-platforms-to-get-you-out-of-tutorial-hell-10k0

[^42]: https://mimo.org

[^43]: https://futureclassroom.com.ph/best-coding-learning-platforms-for-schools-in-2025-updated/

[^44]: https://learnqoch.com/adaptive-learning-platforms-for-coding-education/

[^45]: https://www.codemonkey.com

[^46]: https://www.muvi.com/blogs/5-features-of-interactive-e-learning-platform/

[^47]: https://huggingface.co/blog/text-to-webapp

[^48]: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/skeleton_website

[^49]: https://flatlogic.com/blog/full-stack-web-app-builder/

[^50]: https://www.netguru.com/blog/pwa-ux-techniques

[^51]: https://www.hostinger.com/tutorials/web-application-architecture

[^52]: https://cic.ubc.ca/project/ai-learning-assistant-the-non-traditional-learning-tool/

[^53]: https://github.blog/news-insights/github-classroom-celebrates-3m-repositories-with-the-launch-of-classroom-assistant/

[^54]: https://docs.github.com/rest/using-the-rest-api/getting-started-with-the-rest-api

[^55]: https://www.youtube.com/watch?v=-vFwfwy5WZA

[^56]: https://zencoder.ai/blog/how-ai-code-generators-work

[^57]: https://overcast.blog/ai-code-documentation-generators-a-guide-b6cd72cd0ec4

[^58]: https://www.index.dev/blog/best-ai-tools-for-coding-documentation

[^59]: https://www.docuwriter.ai

[^60]: https://arxiv.org/html/2505.21577v2

[^61]: https://swimm.io/learn/documentation-tools/documentation-generators-great-tools-you-should-know

[^62]: https://github.com/api-platform/api-doc-parser

[^63]: https://stackoverflow.com/questions/29546670/parsing-github-api-response

[^64]: https://www.npmjs.com/package/parse-github-repo-url

[^65]: https://www.atlassian.com/blog/loom/software-documentation-tools

[^66]: https://overcast.blog/13-code-documentation-tools-you-should-know-e838c6e793e8

[^67]: https://gh.labspace.ai

[^68]: https://github.apidog.io/api-3489503

[^69]: https://www.reddit.com/r/typescript/comments/131np9u/codenarrator_an_opensource_tool_for/

[^70]: https://www.youtube.com/watch?v=VMMFSTGnlmU

[^71]: https://github.com/edx/learning-assistant

[^72]: https://graphite.com/guides/ai-code-translation

[^73]: https://www.maxai.co/ai-tools/ai-writer/code-generator-for-html-css-and-javascript-projects/

[^74]: https://workik.com/ai-code-generator

[^75]: https://www.reddit.com/r/ChatGPTCoding/comments/1e11o1d/what_applicationtool_is_best_for_code_translation/

[^76]: https://aicurator.io/ai-code-generators/

[^77]: https://poedit.net

[^78]: https://www.qodo.ai/blog/best-ai-code-generators/

[^79]: https://www.kdnuggets.com/10-github-repositories-for-machine-learning-projects

[^80]: https://www.f22labs.com/blogs/15-best-ai-code-generators-of-2025-reviewed/

[^81]: https://github.com/topics/learning-assistant

[^82]: https://javascript.plainenglish.io/the-best-readme-generators-for-your-github-profile-ea4f50559d87

[^83]: https://github.com/practical-tutorials/project-based-learning

[^84]: https://arturssmirnovs.github.io/github-profile-readme-generator/

[^85]: https://docs.github.com/get-started/quickstart/hello-world

[^86]: https://sd2.org/great-interactive-beginners-coding-websites/

[^87]: https://www.w3schools.com/git/

[^88]: https://www.codedex.io

[^89]: https://profile-readme-generator.com

[^90]: https://learn.microsoft.com/en-us/visualstudio/get-started/tutorial-open-project-from-repo?view=visualstudio

[^91]: https://www.sololearn.com

[^92]: https://www.youtube.com/watch?v=rCt9DatF63I

[^93]: https://product.hubspot.com/blog/git-and-github-tutorial-for-beginners

[^94]: https://dev.to/pavanbelagatti/a-complete-developer-guide-to-vector-embeddings-90j

[^95]: https://towardsdatascience.com/how-to-build-an-ai-journal-to-build-your-own-principles/

[^96]: https://www.youtube.com/watch?v=sVcwVQRHIc8

[^97]: https://docling-project.github.io/docling/examples/rag_llamaindex/

[^98]: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/tutorial/build-rag-solution

[^99]: https://platform.openai.com/docs/guides/embeddings

[^100]: https://www.youtube.com/watch?v=4akqDpxFlm8

[^101]: https://www.eraser.io/ai/architecture-diagram-generator

[^102]: https://www.codio.com

[^103]: https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/

[^104]: https://architechtures.com/en

[^105]: https://genially.com

[^106]: https://www.youtube.com/watch?v=UbPpydNokyE

[^107]: https://tomassetti.me/code-generation/

[^108]: https://stackoverflow.com/questions/1136518/best-practice-for-writing-a-code-generator

[^109]: https://maboloshi.github.io/github-chinese/

[^110]: https://www.youtube.com/watch?v=AGWyx96lP8U

[^111]: https://chromium.googlesource.com/external/github.com/git/git/+/HEAD/po/README.md

[^112]: https://www.freecodecamp.org/news/how-to-build-programming-projects/

[^113]: https://www.anthropic.com/engineering/claude-code-best-practices

[^114]: https://www.reddit.com/r/github/comments/1jyx9uh/translate_readme_best_practices_and_tips/

[^115]: https://codeop.tech/how-to-code-a-beginners-guide/

[^116]: https://about.gitlab.com/topics/devops/ai-code-generation-guide/

[^117]: https://github.com/winfunc/opcode/issues/383

