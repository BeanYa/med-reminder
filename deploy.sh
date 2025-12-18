#!/bin/bash

# 用药提醒应用一键部署脚本
# 支持 Linux 和 macOS

set -e

# 默认端口
DEFAULT_PORT=3000

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "用法: $0 [选项]"
      echo "选项:"
      echo "  -p, --port PORT    指定端口号 (默认: $DEFAULT_PORT)"
      echo "  -h, --help        显示帮助信息"
      exit 0
      ;;
    *)
      echo "未知参数: $1"
      echo "使用 -h 或 --help 查看帮助"
      exit 1
      ;;
  esac
done

# 如果没有指定端口，使用默认值
PORT=${PORT:-$DEFAULT_PORT}

echo "=== 用药提醒应用部署脚本 ==="
echo "端口: $PORT"
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

# 停止并删除现有容器（如果存在）
echo
echo "清理现有容器..."
docker-compose down --remove-orphans 2>/dev/null || true

# 构建新镜像
echo
echo "构建应用镜像..."
PORT=$PORT docker-compose build

# 启动服务
echo
echo "启动应用服务..."
if docker-compose version &> /dev/null; then
    PORT=$PORT docker-compose up -d
else
    PORT=$PORT docker compose up -d
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