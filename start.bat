@echo off
REM 用药提醒应用启动脚本 (Windows)

echo === 用药提醒应用启动脚本 ===
echo.

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Node.js 未安装，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查依赖
if not exist node_modules (
    echo 正在安装依赖...
    npm install
)

REM 初始化数据库
echo 初始化数据库...
npm run init-db

REM 启动应用
echo 启动应用...
npm start