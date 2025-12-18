#!/bin/bash

# 用药提醒应用启动脚本

# 默认配置
DEFAULT_PORT=3000
DEFAULT_HOST="0.0.0.0"
DEFAULT_ENV="development"

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
    -h|--help)
      echo "用法: $0 [选项]"
      echo "选项:"
      echo "  -p, --port PORT       指定端口号 (默认: $DEFAULT_PORT)"
      echo "  -H, --host HOST       指定主机地址 (默认: $DEFAULT_HOST)"
      echo "  -e, --env ENV         指定环境 (development|production|test, 默认: $DEFAULT_ENV)"
      echo "  -h, --help           显示帮助信息"
      echo
      echo "示例:"
      echo "  $0 --port 8080 --host 127.0.0.1 --env development"
      echo "  $0 -p 3000 -H 0.0.0.0 -e production"
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

echo "=== 用药提醒应用启动脚本 ==="
echo "端口: $PORT"
echo "主机: $HOST"
echo "环境: $ENVIRONMENT"
echo

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装"
    exit 1
fi

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "错误: 端口 $PORT 已被占用"
    echo "请使用其他端口或关闭占用该端口的程序"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 初始化数据库
echo "初始化数据库..."
npm run init-db

# 启动应用
echo "启动应用..."
echo "访问地址: http://$HOST:$PORT"
export PORT=$PORT
export HOST=$HOST
export NODE_ENV=$ENVIRONMENT
npm start