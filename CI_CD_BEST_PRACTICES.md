# CI/CD 自动发布到 Release 的最佳实践

## 版本控制策略

### 1. 语义化版本控制

采用 [语义化版本控制](https://semver.org/lang/zh-CN/)（Semantic Versioning）规范：
- **MAJOR** (X.y.z)：不兼容的API更改
- **MINOR** (x.Y.z)：向下兼容的功能性新增
- **PATCH** (x.y.Z)：向下兼容的问题修正

### 2. Git 工作流建议

- 使用 `develop` 分支进行日常开发
- 功能开发使用 `feature/*` 分支
- Bug 修复使用 `bugfix/*` 分支
- 发布前合并到 `main` 分支
- 创建标签时使用 `v` 前缀，如 `v1.2.3`

## 工作流优化建议

### 1. 条件执行

```yaml
# 仅在 main 分支有新标签时执行
on:
  push:
    branches: []  # 不监听分支推送
    tags:
      - 'v*'
```

### 2. 缓存依赖

优化构建速度：

```yaml
- uses: actions/cache@v3
  with:
    path: |
      node_modules
      .npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 3. 多平台构建

支持多平台发布：

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    # 构建步骤...
```

## 错误处理和通知

### 1. 工作流通知

添加失败通知：

```yaml
jobs:
  build:
    # 其他配置...
    steps:
      # 构建步骤...
      - name: 通知构建结果
        if: always()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_TITLE: 构建结果
          SLACK_MESSAGE: ${{ job.status == 'success' && '✅ 构建成功' || '❌ 构建失败' }}
```

### 2. 错误恢复机制

添加回退步骤：

```yaml
- name: 清理失败的构建
  if: failure()
  run: |
    echo "构建失败，执行清理操作..."
    # 清理命令...
```

## 质量保证

### 1. 自动化测试

在发布前确保测试通过：

```yaml
- name: 运行测试
  run: npm test
  continue-on-error: false  # 测试失败时停止工作流
```

### 2. 代码质量检查

添加代码质量工具：

```yaml
- name: 运行 ESLint
  run: npx eslint .

- name: 代码覆盖率检查
  run: npm run coverage
  # 可以添加覆盖率阈值要求
```

## 发布管理

### 1. 发布说明自动化

从提交历史自动生成发布说明：

```yaml
- name: 生成发布说明
  id: changelog
  uses: metcalfc/changelog-generator@v4
  with:
    myToken: ${{ secrets.GITHUB_TOKEN }}

- name: 创建Release
  uses: softprops/action-gh-release@v1
  with:
    body: ${{ steps.changelog.outputs.changelog }}
```

### 2. 预发布和发布流程

设置预发布流程：

```yaml
# 对于预发布标签
on:
  push:
    tags:
      - 'v*-beta*'
      - 'v*-alpha*'

- name: 创建预发布
  uses: softprops/action-gh-release@v1
  with:
    prerelease: true
```

## 性能优化

1. **并行作业**：将独立任务拆分为并行作业
2. **按需执行**：使用 `paths-ignore` 避免不必要的构建
3. **选择轻量运行器**：对于小型项目，考虑使用较便宜的运行器
4. **使用自托管运行器**：对于大型项目，可以考虑自托管运行器

## 安全考虑

1. **定期更新依赖**：使用 Dependabot 自动更新依赖
2. **扫描依赖漏洞**：

```yaml
- name: 依赖安全扫描
  uses: npm audit
  # 或者使用专用工具
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## 监控和日志

1. **工作流日志**：保存构建日志用于审计和调试
2. **部署监控**：添加部署后的健康检查

```yaml
- name: 部署后验证
  run: |
    # 验证发布资产是否可用
    echo "验证发布资产..."
    curl -I https://github.com/${{ github.repository }}/releases/download/${{ github.ref_name }}/water_reminder_new.exe
```

## 实施步骤回顾

1. **设置工作流文件**：创建 `.github/workflows/release.yml`
2. **配置权限**：确保 GITHUB_TOKEN 有适当权限
3. **测试工作流**：创建测试标签验证流程
4. **完善发布流程**：根据需求调整发布说明、通知等
5. **监控和优化**：收集反馈并持续优化工作流

通过遵循这些最佳实践，可以建立一个可靠、高效的自动化发布流程，减少手动操作并提高发布质量。