# 钱包管理系统 (Wallet Management System)

一个基于 Vue.js 3 的现代化钱包管理前端应用，提供完整的钱包管理、用户权限控制、矿工注册等功能。

## 🏗️ 系统架构

```
                        +-----------------+
                        |   Frontend (Vue.js) |
                    +-----------------+
                                |
                                |  API Requests (REST)
                                v
                 +-------------------------------+
                 |              Nginx             |
                 |     (Reverse Proxy, Load       |
                 |      Balancing, Static Files)  |
                 +-------------------------------+
                                |
                                |  Proxy Requests
                                v
                +-------------------------------+
                |           Gunicorn            |
                |      (WSGI Server for Flask)   |
                +-------------------------------+
                |                               |
           +----v----+                      +------v------+
           | PostgreSQL |                   |    Redis    |
           | (Database) |                   | (Cache/Queue)|
           +------------+                   +-------------+
```

## ✨ 主要功能

### 🔐 用户认证与权限管理

- **JWT 认证** - 基于 Token 的安全认证机制
- **角色权限** - 支持管理员和普通用户角色
- **自动刷新** - Token 自动刷新，无缝用户体验
- **路由守卫** - 基于权限的路由访问控制

### 💰 钱包管理

- **钱包列表** - 查看所有钱包的详细信息
- **余额显示** - 实时显示自由余额、质押余额和总余额
- **钱包转账** - 支持内部钱包和外部地址转账
- **质押管理** - 移除质押功能
- **批量操作** - 支持批量设置钱包密码
- **钱包导入** - 管理员可批量导入钱包

### 👥 用户管理 (管理员功能)

- **用户列表** - 查看所有系统用户
- **权限分配** - 分配和修改用户角色
- **钱包分配** - 为用户分配钱包访问权限
- **用户搜索** - 快速查找特定用户

### 🔗 外部钱包管理 (管理员功能)

- **外部钱包** - 管理外部钱包地址
- **转账记录** - 查看所有转账历史
- **地址验证** - 确保外部地址的有效性

### ⛏️ 矿工注册

- **矿工信息** - 注册和管理矿工信息
- **Hotkey 管理** - 管理矿工的 Hotkey 地址
- **网络配置** - 支持不同网络的矿工注册

## 🛠️ 技术栈

### 前端框架

- **Vue.js 3** - 渐进式 JavaScript 框架
- **Vue Router 4** - 官方路由管理器
- **Vuex 4** - 状态管理模式

### 开发工具

- **Vue CLI 5** - Vue.js 开发工具链
- **Babel** - JavaScript 编译器
- **ESLint** - 代码质量检查工具

### UI 组件

- **Font Awesome 6** - 图标库
- **自定义 CSS** - 响应式设计和现代化界面

### HTTP 客户端

- **Axios** - Promise 基础的 HTTP 库
- **请求拦截器** - 自动添加认证头
- **响应拦截器** - 统一错误处理和 Token 刷新

## 📦 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量示例文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置 API 服务器地址：

```bash
# API基础URL
VUE_APP_API_BASE_URL=http://your-api-server:port/api

# API请求超时时间（毫秒）
VUE_APP_API_TIMEOUT=300000
```

### 开发环境运行

```bash
npm run serve
```

应用将在 `http://localhost:8080` 启动

### 生产环境构建

```bash
npm run build
```

构建文件将生成在 `dist/` 目录

### 代码检查

```bash
npm run lint
```

## 🚀 部署指南

### 生产环境部署

#### 1. 构建应用

```bash
# 安装依赖
npm install

# 配置生产环境变量
cp .env.example .env.production
# 编辑 .env.production 文件，设置生产环境的 API 地址

# 构建生产版本
npm run build
```

#### 2. Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/wallet-management`：

```nginx
server {
    listen 16002;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 300;
    keepalive_requests 1000;

    # 启用 Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Vue 应用静态文件服务
    root /path/to/your/wallet_management_vue/dist;  # 替换为实际路径
    index index.html;

    # 处理 Vue Router 的 history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:16003;  # 后端API地址
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout       300s;
        proxy_send_timeout          300s;
        proxy_read_timeout          300s;
        proxy_buffering             off;
    }

    # 静态资源缓存
    location ~* \.(?:jpg|jpeg|gif|png|ico|svg|css|js)$ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin "*";
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 客户端限制
    client_max_body_size 10m;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;

    # 日志
    access_log /var/log/nginx/wallet-management-access.log combined;
    error_log /var/log/nginx/wallet-management-error.log warn;
}
```

#### 3. 启用 Nginx 站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/wallet-management /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

#### 4. SSL 配置 (推荐)

使用 Let's Encrypt 为生产环境配置 HTTPS：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker 部署 (可选)

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:16-alpine as build-stage

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 设置环境变量
ARG VUE_APP_API_BASE_URL
ARG VUE_APP_API_TIMEOUT
ENV VUE_APP_API_BASE_URL=$VUE_APP_API_BASE_URL
ENV VUE_APP_API_TIMEOUT=$VUE_APP_API_TIMEOUT

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine as production-stage

# 复制构建文件
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: "3.8"

services:
  wallet-frontend:
    build:
      context: .
      args:
        VUE_APP_API_BASE_URL: http://your-api-server:16003/api
        VUE_APP_API_TIMEOUT: 300000
    ports:
      - "16002:80"
    restart: unless-stopped
    networks:
      - wallet-network

networks:
  wallet-network:
    external: true
```

#### 3. Docker 部署命令

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f wallet-frontend
```

## 🔧 环境配置详解

### 环境变量说明

| 变量名                 | 描述                   | 默认值                             | 示例                          |
| ---------------------- | ---------------------- | ---------------------------------- | ----------------------------- |
| `VUE_APP_API_BASE_URL` | API 服务器基础 URL     | `http://168.100.174.146:16002/api` | `https://api.example.com/api` |
| `VUE_APP_API_TIMEOUT`  | API 请求超时时间(毫秒) | `300000`                           | `60000`                       |

### 不同环境配置

#### 开发环境 (.env.development)

```bash
VUE_APP_API_BASE_URL=http://localhost:16003/api
VUE_APP_API_TIMEOUT=300000
```

#### 测试环境 (.env.test)

```bash
VUE_APP_API_BASE_URL=http://test-api.example.com:16003/api
VUE_APP_API_TIMEOUT=300000
```

#### 生产环境 (.env.production)

```bash
VUE_APP_API_BASE_URL=https://api.example.com/api
VUE_APP_API_TIMEOUT=300000
```

## 🔍 故障排除

### 常见问题

#### 1. API 连接失败

**问题**: 前端无法连接到后端 API
**解决方案**:

- 检查 `.env` 文件中的 `VUE_APP_API_BASE_URL` 配置
- 确认后端服务正在运行
- 检查防火墙设置
- 验证 CORS 配置

#### 2. 路由 404 错误

**问题**: 刷新页面时出现 404 错误
**解决方案**:

- 确保 Nginx 配置了 `try_files $uri $uri/ /index.html;`
- 检查 Vue Router 的 history 模式配置

#### 3. 静态资源加载失败

**问题**: CSS、JS 文件无法加载
**解决方案**:

- 检查 Nginx 静态文件路径配置
- 确认文件权限设置正确
- 验证 Gzip 压缩配置

#### 4. Token 认证问题

**问题**: 用户频繁需要重新登录
**解决方案**:

- 检查后端 JWT 配置
- 确认 Token 刷新机制正常工作
- 验证系统时间同步

### 性能优化建议

#### 1. 前端优化

- 启用 Gzip 压缩
- 配置静态资源缓存
- 使用 CDN 加速
- 代码分割和懒加载

#### 2. 网络优化

- 配置 HTTP/2
- 启用 Keep-Alive
- 优化 DNS 解析
- 使用负载均衡

#### 3. 监控和日志

- 配置 Nginx 访问日志
- 设置错误日志级别
- 使用监控工具（如 Prometheus）
- 配置告警机制

## 📁 项目结构

```
wallet_management_vue/
├── public/                     # 静态资源
│   ├── index.html             # HTML 模板
│   └── favicon.ico            # 网站图标
├── src/                       # 源代码
│   ├── components/            # Vue 组件
│   │   ├── AppNavbar.vue      # 导航栏组件
│   │   ├── LoginForm.vue      # 登录表单
│   │   ├── RegisterForm.vue   # 注册表单
│   │   ├── WalletManagement.vue # 钱包管理
│   │   ├── UserManagement.vue # 用户管理
│   │   ├── ExternalWalletManagement.vue # 外部钱包管理
│   │   ├── TransferHistory.vue # 转账历史
│   │   ├── MinerRegistration.vue # 矿工注册
│   │   └── ErrorPage.vue      # 错误页面
│   ├── router/                # 路由配置
│   │   └── index.js           # 路由定义
│   ├── store/                 # Vuex 状态管理
│   │   └── index.js           # 状态管理配置
│   ├── utils/                 # 工具函数
│   │   ├── api.js             # API 请求封装
│   │   └── errorHandler.js    # 错误处理
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
├── docs/                      # 文档
│   └── ENVIRONMENT_VARIABLES.md # 环境变量说明
├── .env.example               # 环境变量示例
├── .env.development           # 开发环境配置
├── .gitignore                 # Git 忽略文件
├── babel.config.js            # Babel 配置
├── jsconfig.json              # JavaScript 配置
├── package.json               # 项目依赖
├── vue.config.js              # Vue CLI 配置
├── vue-app                    # Nginx 配置文件
└── README.md                  # 项目说明
```

## 🤝 贡献指南

### 开发流程

1. **Fork 项目**

   ```bash
   git clone https://github.com/your-username/wallet_management_vue.git
   cd wallet_management_vue
   ```

2. **创建功能分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **安装依赖**

   ```bash
   npm install
   ```

4. **开发和测试**

   ```bash
   npm run serve  # 启动开发服务器
   npm run lint   # 代码检查
   ```

5. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Vue.js 官方风格指南
- 组件名使用 PascalCase
- 文件名使用 kebab-case
- 提交信息遵循 Conventional Commits 规范

### 提交信息格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型说明：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与联系

- **问题反馈**: [GitHub Issues](https://github.com/Mikiya-K/wallet_management_vue/issues)
- **功能请求**: [GitHub Discussions](https://github.com/Mikiya-K/wallet_management_vue/discussions)
- **文档**: [项目 Wiki](https://github.com/Mikiya-K/wallet_management_vue/wiki)

## 🔗 相关链接

- [Vue.js 官方文档](https://vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/)
- [Vuex 文档](https://vuex.vuejs.org/)
- [Vue CLI 文档](https://cli.vuejs.org/)
- [Axios 文档](https://axios-http.com/)

## 📊 项目状态

![GitHub last commit](https://img.shields.io/github/last-commit/Mikiya-K/wallet_management_vue)
![GitHub issues](https://img.shields.io/github/issues/Mikiya-K/wallet_management_vue)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Mikiya-K/wallet_management_vue)
![GitHub stars](https://img.shields.io/github/stars/Mikiya-K/wallet_management_vue)

---

**感谢使用钱包管理系统！** 🚀
