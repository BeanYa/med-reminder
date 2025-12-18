#!/bin/bash

# 用药提醒应用一键部署脚本
# 支持 Linux 和 macOS

set -e

# 默认配置
DEFAULT_PORT=3000
DEFAULT_HOST="0.0.0.0"
DEFAULT_ENV="production"
DEFAULT_NAME="med-reminder-app"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -H|--host)
      HOST="$2"
      shift 2
      ;;
    -e|--env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -n|--name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    -h|--help)
      echo "用法: $0 [选项]"
      echo "选项:"
      echo "  -p, --port PORT       指定端口号 (默认: $DEFAULT_PORT)"
      echo "  -H, --host HOST       指定主机地址 (默认: $DEFAULT_HOST)"
      echo "  -e, --env ENV         指定环境 (development|production|test, 默认: $DEFAULT_ENV)"
      echo "  -n, --name NAME       指定容器名称 (默认: $DEFAULT_NAME)"
      echo "  -h, --help           显示帮助信息"
      echo
      echo "示例:"
      echo "  $0 --port 8080 --host 127.0.0.1 --env development"
      echo "  $0 -p 3000 -H 0.0.0.0 -e production -n my-med-app"
      exit 0
      ;;
    *)
      echo "未知参数: $1"
      echo "使用 -h 或 --help 查看帮助"
      exit 1
      ;;
  esac
done

# 设置默认值
PORT=${PORT:-$DEFAULT_PORT}
HOST=${HOST:-$DEFAULT_HOST}
ENVIRONMENT=${ENVIRONMENT:-$DEFAULT_ENV}
CONTAINER_NAME=${CONTAINER_NAME:-$DEFAULT_NAME}

# 验证环境参数
if [[ ! "$ENVIRONMENT" =~ ^(development|production|test)$ ]]; then
    echo "错误: 环境参数必须是: development, production, 或 test"
    exit 1
fi

# 验证端口号
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "错误: 端口号必须是 1-65535 之间的数字"
    exit 1
fi

echo "=== 用药提醒应用部署脚本 ==="
echo "端口: $PORT"
echo "主机: $HOST"
echo "环境: $ENVIRONMENT"
echo "容器名称: $CONTAINER_NAME"
echo

# 检查系统类型
OS=$(uname -s)
echo "检测到系统: $OS"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 选择合适的 compose 文件
COMPOSE_FILE="docker-compose.yml"
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# 停止并删除现有容器（如果存在）
echo
echo "清理现有容器..."
docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# 构建新镜像
echo
echo "构建应用镜像..."
PORT=$PORT HOST=$HOST NODE_ENV=$ENVIRONMENT docker-compose -f $COMPOSE_FILE build

# 启动服务
echo
echo "启动应用服务..."
if docker-compose version &> /dev/null; then
    PORT=$PORT HOST=$HOST NODE_ENV=$ENVIRONMENT docker-compose -f $COMPOSE_FILE up -d
else
    PORT=$PORT HOST=$HOST NODE_ENV=$ENVIRONMENT docker compose -f $COMPOSE_FILE up -d
fi

# 等待服务启动
echo
echo "等待服务启动..."
sleep 5

# 检查服务状态
echo
echo "检查服务状态..."
if curl -f http://localhost:$PORT/api/health &> /dev/null; then
    echo "✅ 应用启动成功！"
    echo
    echo "访问地址: http://localhost:$PORT"
    echo "API 文档: http://localhost:$PORT/api/health"
else
    echo "❌ 应用启动失败，请检查日志："
    if docker-compose version &> /dev/null; then
        docker-compose logs med-reminder
    else
        docker compose logs med-reminder
    fi
    exit 1
fi

echo
echo "=== 部署完成 ==="
echo
echo "常用命令："
echo "查看日志: docker-compose logs -f med-reminder"
echo "停止服务: docker-compose down"
echo "重启服务: docker-compose restart med-reminder"