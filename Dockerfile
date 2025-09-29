# 钱包管理系统 - 生产环境 Dockerfile
# 使用 Node.js 22

# 构建阶段
FROM node:22-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 设置npm配置优化构建速度
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set cache /tmp/.npm && \
    npm config set fund false && \
    npm config set audit false

# 安装所有依赖（包括开发依赖，构建需要）
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# 复制源代码
COPY . .

# 设置构建环境变量
ARG VUE_APP_API_BASE_URL=http://host.docker.internal:80/api
ARG VUE_APP_API_TIMEOUT=300000
ARG BUILD_NUMBER=latest
ARG GIT_COMMIT=unknown
ARG BUILD_TIME
ARG NODE_ENV=production

ENV VUE_APP_API_BASE_URL=$VUE_APP_API_BASE_URL
ENV VUE_APP_API_TIMEOUT=$VUE_APP_API_TIMEOUT
ENV NODE_ENV=$NODE_ENV
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 构建应用
RUN npm run build

# 创建版本信息文件
RUN echo "{\"version\": \"$BUILD_NUMBER\", \"commit\": \"$GIT_COMMIT\", \"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"nodeVersion\": \"$(node --version)\"}" > dist/version.json

# 验证构建结果
RUN ls -la dist/ && \
    du -sh dist/ && \
    echo "构建完成，文件大小: $(du -sh dist/ | cut -f1)"

# 生产阶段
FROM nginx:alpine as production-stage

# 安装必要工具
RUN apk add --no-cache \
    curl \
    tzdata

# 设置时区为UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制构建文件
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 设置环境变量
ARG BACKEND_SERVER=host.docker.internal:16003

ENV BACKEND_SERVER=$BACKEND_SERVER

# 复制并处理 Nginx 配置
COPY nginx.conf.example /tmp/nginx.conf.template
RUN sed -e 's/your-port/80/g' \
        -e 's/your-domain.com/host.docker.internal/g' \
        -e 's|/var/www/wallet-management|/usr/share/nginx/html|g' \
        -e "s|your-backend-server:port|${BACKEND_SERVER}|g" \
        /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf && \
    rm /tmp/nginx.conf.template

# 测试nginx配置
RUN nginx -t

# 设置文件权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/version.json || exit 1

# 暴露端口
EXPOSE 80

# 添加标签
LABEL maintainer="DevOps Team" \
      project="wallet-management" \
      version="1.0.0" \
      description="钱包管理系统前端应用" \
      node.version="22"

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
