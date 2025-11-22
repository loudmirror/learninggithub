# LearningGitHub 部署指南

本指南将帮助你将 LearningGitHub 部署到生产环境。

## 目录

1. [前置准备](#前置准备)
2. [后端部署 (Railway)](#后端部署-railway)
3. [前端部署 (Vercel)](#前端部署-vercel)
4. [配置连接](#配置连接)
5. [验证部署](#验证部署)
6. [故障排除](#故障排除)

---

## 前置准备

### 1. 获取 API 密钥

#### GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 设置名称: `LearningGitHub`
4. 选择权限:
   - `repo` (read access)
   - `read:user` (可选)
5. 生成并保存 Token

#### OpenAI API Key

1. 访问 https://platform.openai.com/api-keys
2. 创建新的 API Key
3. 保存 Key (只显示一次)
4. **重要**: 在 Usage limits 设置消费上限，防止超支

### 2. 准备代码仓库

确保代码已推送到 GitHub:

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## 后端部署 (Railway)

### 步骤 1: 注册 Railway

1. 访问 https://railway.app
2. 使用 GitHub 账号登录

### 步骤 2: 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 `learninggithub.com` 仓库

### 步骤 3: 配置服务

Railway 会自动检测到 `backend` 目录:

1. 点击创建的服务
2. 进入 "Settings"
3. 设置 Root Directory: `backend`

### 步骤 4: 配置环境变量

在 "Variables" 标签页添加:

| 变量名 | 值 |
|--------|-----|
| `DEBUG` | `False` |
| `LOG_LEVEL` | `WARNING` |
| `CORS_ORIGINS` | `["https://your-app.vercel.app"]` |
| `GITHUB_TOKEN` | `ghp_xxxx...` |
| `OPENAI_API_KEY` | `sk-xxxx...` |
| `OPENAI_MODEL` | `gpt-4-turbo-preview` |

### 步骤 5: 部署

1. Railway 会自动构建和部署
2. 等待部署完成 (约 2-5 分钟)
3. 记录生成的 URL (如: `https://xxx.up.railway.app`)

### 步骤 6: 验证后端

访问健康检查端点:
```
https://your-app.up.railway.app/api/health
```

应返回:
```json
{
  "status": "healthy",
  "app_name": "LearningGitHub API",
  "version": "0.1.0"
}
```

---

## 前端部署 (Vercel)

### 步骤 1: 注册 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录

### 步骤 2: 导入项目

1. 点击 "Add New..." > "Project"
2. 选择你的 GitHub 仓库
3. 配置项目:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

### 步骤 3: 配置环境变量

在部署前设置环境变量:

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app` |
| `NEXT_PUBLIC_APP_NAME` | `LearningGitHub` |
| `NEXT_PUBLIC_APP_VERSION` | `0.1.0` |

### 步骤 4: 部署

1. 点击 "Deploy"
2. 等待构建完成 (约 1-3 分钟)
3. 记录生成的 URL

---

## 配置连接

### 更新后端 CORS

部署前端后，更新后端的 CORS 配置:

1. 在 Railway 中编辑 `CORS_ORIGINS`
2. 添加 Vercel 域名:
   ```
   ["https://your-app.vercel.app"]
   ```
3. Railway 会自动重新部署

### 自定义域名 (可选)

#### Vercel 自定义域名

1. 进入项目 "Settings" > "Domains"
2. 添加你的域名
3. 配置 DNS:
   - 类型: CNAME
   - 名称: www (或 @)
   - 值: cname.vercel-dns.com

#### Railway 自定义域名

1. 进入服务 "Settings" > "Networking"
2. 添加自定义域名
3. 配置 DNS 记录

---

## 验证部署

### 功能检查清单

- [ ] **首页加载**
  - 访问前端 URL
  - 页面正常显示

- [ ] **API 健康检查**
  - 访问 `/api/health`
  - 返回 healthy 状态

- [ ] **教程生成**
  - 输入: `https://github.com/octocat/Hello-World`
  - 点击开始学习
  - 教程正常生成

- [ ] **Q&A 功能**
  - 在教程页面提问
  - AI 正常回答

- [ ] **进度保存**
  - 完成几个步骤
  - 刷新页面
  - 进度保持

### 性能检查

- [ ] 首页加载 < 3秒
- [ ] 教程生成 < 30秒
- [ ] Q&A 响应 < 10秒

---

## 故障排除

### 问题 1: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
1. 检查后端 `CORS_ORIGINS` 是否包含前端域名
2. 确保域名格式正确 (包含 `https://`)
3. 重新部署后端

### 问题 2: API 连接失败

**症状**: 前端无法连接后端

**解决方案**:
1. 验证 `NEXT_PUBLIC_API_URL` 是否正确
2. 检查后端是否正常运行
3. 确认 URL 末尾没有多余的 `/`

### 问题 3: OpenAI 请求失败

**症状**: AI 功能不工作

**解决方案**:
1. 验证 `OPENAI_API_KEY` 是否正确
2. 检查 OpenAI 账户余额
3. 确认 API Key 有效

### 问题 4: GitHub API 限流

**症状**: 教程生成失败，提示限流

**解决方案**:
1. 确保配置了 `GITHUB_TOKEN`
2. 检查 Token 权限
3. 等待限流重置

### 问题 5: 部署失败

**症状**: Railway/Vercel 构建失败

**解决方案**:
1. 查看构建日志
2. 检查依赖是否完整
3. 验证 Node.js/Python 版本

---

## 监控和维护

### Railway 监控

- 查看 "Metrics" 了解资源使用
- 设置 "Alerts" 接收异常通知
- 定期检查 "Logs"

### Vercel 监控

- 使用 Analytics 了解访问情况
- 查看 Functions 日志
- 监控 Build 时间

### 日志查看

**Railway 日志**:
```
railway logs
```

**Vercel 日志**:
在项目 Dashboard > "Logs" 查看

---

## 成本估算

### Railway

- **免费额度**: $5/月
- **预估使用**: ~$3-5/月 (低流量)
- **注意**: 无休眠，持续运行

### Vercel

- **免费额度**: 足够个人项目
- **带宽**: 100GB/月
- **构建**: 6000分钟/月

### OpenAI

- **GPT-4 Turbo**: $0.01/1K tokens (input), $0.03/1K tokens (output)
- **预估**: $5-20/月 (取决于使用量)
- **建议**: 设置月度消费上限

---

## 下一步

部署成功后，考虑:

1. [ ] 配置自定义域名
2. [ ] 设置错误监控 (Sentry)
3. [ ] 添加分析统计 (Google Analytics)
4. [ ] 配置 CDN 加速
5. [ ] 设置自动备份

---

**部署遇到问题?**

查看项目 Issues: https://github.com/your-org/learninggithub.com/issues
