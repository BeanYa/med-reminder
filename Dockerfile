# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --include=dev

# 复制应用源代码
COPY src/ ./src/
COPY public/ ./public/

# 初始化数据库
RUN mkdir -p /app/data && \
    npm run init-db && \
    chown -R 1001:1001 /app

# 生产环境镜像
FROM node:18-alpine AS production

# 安装生产环境需要的工具
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S medreminder -u 1001

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 只安装生产依赖
RUN npm ci --omit=dev && \
    npm cache clean --force

# 从构建阶段复制应用文件
COPY --from=builder --chown=medreminder:nodejs /app/src ./src
COPY --from=builder --chown=medreminder:nodejs /app/public ./public
COPY --from=builder --chown=medreminder:nodejs /app/data ./data
COPY --from=builder --chown=medreminder:nodejs /app/node_modules ./node_modules

# 创建必要的目录
RUN mkdir -p logs && \
    chown -R medreminder:nodejs /app

# 切换到非 root 用户
USER medreminder

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 运行应用
CMD [ "node", "src/app.js" ]