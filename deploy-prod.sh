#!/bin/bash

# 生产环境部署脚本

set -e

# 默认生产配置
DEFAULT_PORT=3000
DEFAULT_HOST="0.0.0.0"
DEFAULT_NAME="med-reminder-prod"

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
    -n|--name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    -h|--help)
      echo "用法: $0 [选项]"
      echo "生产环境部署脚本"
      echo
      echo "选项:"
      echo "  -p, --port PORT       指定端口号 (默认: $DEFAULT_PORT)"
      echo "  -H, --host HOST       指定主机地址 (默认: $DEFAULT_HOST)"
      echo "  -n, --name NAME       指定容器名称 (默认: $DEFAULT_NAME)"
      echo "  -h, --help           显示帮助信息"
      echo
      echo "示例:"
      echo "  $0 --port 80 --name production-med-app"
      echo "  $0 -p 3000 -H 0.0.0.0"
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
CONTAINER_NAME=${CONTAINER_NAME:-$DEFAULT_NAME}

# 验证端口号
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "错误: 端口号必须是 1-65535 之间的数字"
    exit 1
fi

echo "=== 生产环境部署脚本 ==="
echo "端口: $PORT"
echo "主机: $HOST"
echo "容器名称: $CONTAINER_NAME"
echo "环境: production"
echo

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    exit 1
fi

# 清理现有容器
echo "清理现有容器..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# 构建并启动
echo "构建生产镜像..."
PORT=$PORT HOST=$HOST NODE_ENV=production CONTAINER_NAME=$CONTAINER_NAME \
    docker-compose -f docker-compose.prod.yml build

echo "启动生产服务..."
PORT=$PORT HOST=$HOST NODE_ENV=production CONTAINER_NAME=$CONTAINER_NAME \
    docker-compose -f docker-compose.prod.yml up -d

echo
echo "等待服务启动..."
sleep 10

# 健康检查
echo "检查服务状态..."
if curl -f http://localhost:$PORT/api/health &> /dev/null; then
    echo "✅ 生产环境部署成功！"
    echo
    echo "访问地址: http://localhost:$PORT"
    echo "容器名称: $CONTAINER_NAME"
    echo
    echo "管理命令："
    echo "查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "停止服务: docker-compose -f docker-compose.prod.yml down"
    echo "重启服务: docker-compose -f docker-compose.prod.yml restart"
else
    echo "❌ 服务启动失败，查看日志："
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo
echo "=== 生产环境部署完成 ==="