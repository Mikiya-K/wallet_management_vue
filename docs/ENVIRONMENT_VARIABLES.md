# 环境变量配置说明

## 概述

本项目使用环境变量来配置API相关设置，支持不同环境的灵活配置。

## 环境变量文件

### 文件优先级
Vue CLI 会按以下优先级加载环境变量文件：

1. `.env.local` (本地配置，会被git忽略)
2. `.env.[mode].local` (特定模式的本地配置)
3. `.env.[mode]` (特定模式配置)
4. `.env` (默认配置)

### 可用的环境变量

| 变量名 | 描述 | 默认值 | 示例 |
|--------|------|--------|------|
| `VUE_APP_API_BASE_URL` | API服务器基础URL | `http://168.100.174.146:16002/api` | `http://localhost:3000/api` |
| `VUE_APP_API_TIMEOUT` | API请求超时时间(毫秒) | `100000` | `30000` |

## 配置步骤

### 1. 复制示例文件
```bash
cp .env.example .env
```

### 2. 修改配置
编辑 `.env` 文件，根据你的实际环境修改配置：

```bash
# 开发环境示例
VUE_APP_API_BASE_URL=http://localhost:3000/api
VUE_APP_API_TIMEOUT=30000
```

```bash
# 生产环境示例
VUE_APP_API_BASE_URL=https://api.yourcompany.com/api
VUE_APP_API_TIMEOUT=60000
```

### 3. 重启开发服务器
修改环境变量后需要重启开发服务器：

```bash
npm run serve
```

## 不同环境的配置

### 开发环境
创建 `.env.development` 文件：
```bash
VUE_APP_API_BASE_URL=http://localhost:3000/api
VUE_APP_API_TIMEOUT=30000
```

### 生产环境
创建 `.env.production` 文件：
```bash
VUE_APP_API_BASE_URL=https://api.yourcompany.com/api
VUE_APP_API_TIMEOUT=60000
```

### 测试环境
创建 `.env.test` 文件：
```bash
VUE_APP_API_BASE_URL=http://test-api.yourcompany.com/api
VUE_APP_API_TIMEOUT=45000
```

## 注意事项

1. **变量名前缀**: 只有以 `VUE_APP_` 开头的变量才会被打包到客户端代码中
2. **安全性**: 不要在环境变量中存储敏感信息，因为它们会被打包到客户端代码中
3. **类型转换**: 环境变量都是字符串类型，需要时请手动转换（如 `parseInt()`）
4. **重启服务**: 修改环境变量后需要重启开发服务器才能生效

## 部署配置

### Docker部署
在Dockerfile中设置环境变量：
```dockerfile
ENV VUE_APP_API_BASE_URL=https://api.yourcompany.com/api
ENV VUE_APP_API_TIMEOUT=60000
```

### CI/CD配置
在CI/CD管道中设置环境变量，例如GitHub Actions：
```yaml
env:
  VUE_APP_API_BASE_URL: ${{ secrets.API_BASE_URL }}
  VUE_APP_API_TIMEOUT: 60000
```
