# CI/CD 权限设置与环境变量配置

## GitHub Actions 权限设置

### 1. GITHUB_TOKEN 权限说明

在我们的工作流配置中，使用了 `GITHUB_TOKEN` 来进行 GitHub Release 的创建和管理。这是 GitHub Actions 自动提供的临时令牌，默认具有以下权限：

- 读取仓库内容
- 创建和管理发布
- 上传发布资产（如构建生成的可执行文件）

### 2. 如何增强 GITHUB_TOKEN 权限

如果默认权限不足，可以在工作流文件中明确设置权限范围：

```yaml
permissions:
  contents: write  # 允许写入仓库内容，包括创建发布
  issues: write    # 可选，允许创建/更新issues
  pull-requests: write  # 可选，允许更新PR信息
```

### 3. 添加自定义环境变量

如果项目需要访问外部服务或需要额外的凭证，可以在 GitHub 仓库中设置：

1. 进入 GitHub 仓库页面
2. 点击 Settings > Secrets and variables > Actions
3. 点击 New repository secret
4. 添加所需的密钥，如 API 密钥、访问令牌等

## 环境变量配置示例

### 1. 在工作流中使用环境变量

```yaml
- name: 构建应用
  run: npm run build
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DEBUG_MODE: false
```

### 2. 为不同环境配置环境变量

可以创建不同的环境（如 production、staging）并为每个环境设置特定的密钥：

1. 进入 GitHub 仓库页面
2. 点击 Settings > Environments
3. 创建新环境，如 production
4. 在环境中设置所需的密钥
5. 在工作流中引用环境：

```yaml
jobs:
  build-and-release:
    environment: production
    # 其他配置...
```

## 安全最佳实践

1. **不要将敏感信息硬编码**：所有凭证、密钥都应通过环境变量或密钥管理
2. **最小权限原则**：仅授予工作流完成任务所需的最小权限
3. **使用环境**：为敏感环境使用环境特定的变量和审批流程
4. **定期轮换密钥**：定期更新和轮换使用的访问令牌和密钥

## 测试和调试

1. 使用 `actions/github-script` 检查可用权限：

```yaml
- name: 检查权限
  uses: actions/github-script@v6
  with:
    script: |
      console.log('可用权限:', process.env.GITHUB_TOKEN ? 'GITHUB_TOKEN 可用' : 'GITHUB_TOKEN 不可用');
```

2. 在步骤中添加调试信息：

```yaml
- name: 调试环境变量
  run: |
    echo "当前标签: ${{ github.ref_name }}"
    echo "构建目录: $(pwd)"
    ls -la dist/ || echo "dist 目录不存在"
```