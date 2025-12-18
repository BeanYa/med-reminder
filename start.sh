#!/bin/bash

# 用药提醒应用启动脚本

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

echo "=== 用药提醒应用启动脚本 ==="
echo "端口: $PORT"
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
echo "访问地址: http://localhost:$PORT"
export PORT=$PORT
npm start