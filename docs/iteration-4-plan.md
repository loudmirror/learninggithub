# Iteration 4 - 生产部署准备

**开始时间**: 2025-11-22
**目标**: 将 LearningGitHub 部署到生产环境

## 部署架构

```
┌─────────────────┐     ┌─────────────────┐
│   Vercel CDN    │     │  Railway/Fly.io │
│   (Frontend)    │────▶│   (Backend)     │
│   Next.js 14    │     │   FastAPI       │
└─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   用户浏览器     │     │   External APIs │
│                 │     │   - GitHub API  │
│                 │     │   - OpenAI API  │
└─────────────────┘     └─────────────────┘
```

## 部署平台选择

### 前端: Vercel (推荐)

**优势**:
- Next.js 原生支持
- 零配置部署
- 全球 CDN
- 自动 HTTPS
- 免费额度充足

### 后端: Railway / Fly.io / Render

| 平台 | 免费额度 | 冷启动 | 特点 |
|------|---------|--------|------|
| Railway | $5/月 | 快 | 简单，支持 Docker |
| Fly.io | 免费 | 中等 | 全球边缘部署 |
| Render | 免费 | 慢 | 自动休眠 |

**推荐**: Railway (速度快，配置简单)

## Story 列表

### Story 4.1 - 后端部署配置
- [ ] 创建 Dockerfile
- [ ] 配置 Railway/Fly.io
- [ ] 生产环境变量设置
- [ ] 健康检查端点

### Story 4.2 - 前端部署配置
- [ ] 创建 vercel.json
- [ ] 配置环境变量
- [ ] 设置重写规则

### Story 4.3 - 安全和监控
- [ ] 配置生产 CORS
- [ ] 添加速率限制
- [ ] 设置错误监控 (Sentry)
- [ ] 日志收集

### Story 4.4 - 域名和 SSL
- [ ] 配置自定义域名
- [ ] SSL 证书设置
- [ ] DNS 配置

## 环境变量清单

### 后端生产环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DEBUG` | 是 | 设为 `False` |
| `LOG_LEVEL` | 否 | 设为 `WARNING` 或 `ERROR` |
| `CORS_ORIGINS` | 是 | 前端生产域名 |
| `GITHUB_TOKEN` | 是 | GitHub Personal Access Token |
| `OPENAI_API_KEY` | 是 | OpenAI API 密钥 |
| `OPENAI_MODEL` | 否 | 默认 `gpt-4-turbo-preview` |

### 前端生产环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | 是 | 后端 API 地址 |
| `NEXT_PUBLIC_APP_NAME` | 否 | 应用名称 |
| `NEXT_PUBLIC_APP_VERSION` | 否 | 应用版本 |

## 部署步骤

### 第一步: 部署后端到 Railway

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 登录

2. **创建新项目**
   ```bash
   # 或直接从 GitHub 仓库导入
   ```

3. **配置环境变量**
   - 在 Railway Dashboard 添加所有必需的环境变量

4. **部署**
   - Railway 自动检测 Dockerfile 并部署

### 第二步: 部署前端到 Vercel

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 登录

2. **导入项目**
   - 选择 GitHub 仓库
   - 设置 Root Directory 为 `frontend`

3. **配置环境变量**
   - `NEXT_PUBLIC_API_URL`: Railway 后端地址

4. **部署**
   - 自动构建和部署

## 验收标准

### 功能验收
- [ ] 首页正常加载
- [ ] GitHub URL 输入和提交
- [ ] 学习路径正常生成
- [ ] Q&A 功能正常工作
- [ ] 进度保存正常

### 性能验收
- [ ] 首页加载 < 3秒
- [ ] API 响应 < 5秒 (AI 生成除外)
- [ ] 无明显卡顿

### 安全验收
- [ ] HTTPS 强制启用
- [ ] CORS 正确配置
- [ ] 无敏感信息泄露
- [ ] API 密钥安全存储

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| OpenAI 成本超支 | 高 | 设置使用限额 |
| GitHub API 限流 | 中 | 实现缓存 |
| 冷启动延迟 | 低 | 使用 Railway (无休眠) |
| CORS 配置错误 | 高 | 测试环境先验证 |

## 时间估算

| 任务 | 时间 |
|------|------|
| 后端部署配置 | 2-3小时 |
| 前端部署配置 | 1-2小时 |
| 环境变量设置 | 30分钟 |
| 测试验证 | 1-2小时 |
| **总计** | **5-8小时** |

---

**状态**: 进行中
