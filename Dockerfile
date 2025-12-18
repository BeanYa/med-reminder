# 简化构建 - 直接使用一个阶段
FROM node:18-alpine

# 安装系统依赖和创建用户
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S medreminder -u 1001

# 设置工作目录
WORKDIR /app

# 复制 package.json，先尝试复制 package-lock.json（如果存在）
COPY package.json ./
COPY package-lock.json* ./

# 只安装生产依赖
RUN if [ -f package-lock.json ]; then \
        echo "Using package-lock.json for production installation..." && \
        npm ci --omit=dev --no-audit --no-fund && \
        npm cache clean --force; \
    else \
        echo "package-lock.json not found, using npm install..." && \
        npm install --omit=dev --no-audit --no-fund && \
        npm cache clean --force; \
    fi

# 复制应用源代码和脚本
COPY --chown=medreminder:nodejs src/ ./src/
COPY --chown=medreminder:nodejs public/ ./public/
COPY --chown=medreminder:nodejs scripts/ ./scripts/

# 创建数据目录
RUN mkdir -p /app/data && \
    chown -R medreminder:nodejs /app

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