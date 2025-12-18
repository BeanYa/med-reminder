#!/bin/bash

# 用药提醒应用启动脚本

echo "=== 用药提醒应用启动脚本 ==="
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
npm start