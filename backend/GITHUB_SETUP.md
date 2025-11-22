# GitHub API 配置说明

## 为什么需要 GitHub Token？

GitHub API 对未认证请求有严格的速率限制：
- **未认证请求**: 每小时 60 次
- **认证请求**: 每小时 5,000 次

为了正常使用本应用的 GitHub 集成功能，强烈建议配置 GitHub Personal Access Token。

## 如何获取 GitHub Token

### 1. 登录 GitHub

访问 [GitHub](https://github.com) 并登录你的账号。

### 2. 生成 Personal Access Token

1. 点击右上角头像 → **Settings**
2. 左侧菜单滚动到底部 → 点击 **Developer settings**
3. 点击 **Personal access tokens** → **Tokens (classic)**
4. 点击 **Generate new token** → **Generate new token (classic)**

### 3. 配置 Token 权限

- **Note**: 填写描述，例如 "LearningGitHub API"
- **Expiration**: 选择过期时间（建议选择 90 days 或更长）
- **Select scopes**: 勾选以下权限
  - ✅ `public_repo` - 访问公开仓库（必需）
  - ✅ `read:user` - 读取用户信息（可选）

### 4. 生成并复制 Token

1. 点击页面底部的 **Generate token** 按钮
2. **重要**: 立即复制生成的 token（离开页面后将无法再次查看）
3. Token 格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 配置 Token

### 方式 1: 使用环境变量文件（推荐）

1. 在 `backend/` 目录下创建 `.env` 文件（如果还没有）：

```bash
cd backend
cp .env.example .env
```

2. 编辑 `.env` 文件，添加你的 GitHub Token：

```env
# GitHub API Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_API_BASE_URL=https://api.github.com
```

3. 重启后端服务器：

```bash
poetry run uvicorn app.main:app --reload
```

### 方式 2: 直接设置环境变量

```bash
export GITHUB_TOKEN=ghp_your_token_here
poetry run uvicorn app.main:app --reload
```

## 验证配置

运行测试脚本验证配置是否成功：

```bash
poetry run python test_github_integration.py
```

如果配置成功，你应该看到：
- ✅ 所有测试通过
- ✅ 没有速率限制错误
- ✅ 能够成功获取仓库信息、目录树和文件内容

## 安全提示

⚠️ **重要安全注意事项**：

1. **不要提交 Token 到代码仓库**
   - `.env` 文件已经在 `.gitignore` 中
   - 永远不要在代码中硬编码 Token

2. **Token 保密**
   - 不要在公开场合分享你的 Token
   - 如果 Token 泄露，立即在 GitHub 删除并重新生成

3. **定期更换 Token**
   - 建议定期（如每 3 个月）更换一次 Token
   - 删除不再使用的 Token

4. **最小权限原则**
   - 只授予必要的权限
   - 对于公开仓库，`public_repo` 权限足够

## 故障排除

### 问题：速率限制错误

```
403: rate limit exceeded
```

**解决方案**：
1. 确保已正确配置 GITHUB_TOKEN
2. 检查 Token 是否有效（未过期）
3. 重启服务器使配置生效

### 问题：认证失败

```
401: Bad credentials
```

**解决方案**：
1. 检查 Token 是否完整复制
2. 确认 Token 未过期
3. 重新生成 Token 并更新配置

### 问题：权限不足

```
403: Resource not accessible by integration
```

**解决方案**：
1. 检查 Token 权限设置
2. 确保勾选了 `public_repo` 权限
3. 重新生成 Token 并授予正确权限

## 参考资料

- [GitHub Personal Access Tokens 文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub API 速率限制](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [GitHub API 文档](https://docs.github.com/en/rest)
