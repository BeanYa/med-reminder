@echo off
REM 用药提醒应用启动脚本 (Windows)

setlocal enabledelayedexpansion

REM 默认配置
set DEFAULT_PORT=3000
set DEFAULT_HOST=0.0.0.0
set DEFAULT_ENV=development

REM 初始化变量
set PORT=%DEFAULT_PORT%
set HOST=%DEFAULT_HOST%
set ENVIRONMENT=%DEFAULT_ENV%

REM 解析命令行参数
:parse_args
if "%~1"=="" goto start_app
if "%~1"=="-p" (
    set PORT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-H" (
    set HOST=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--host" (
    set HOST=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-e" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--env" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help
echo 未知参数: %~1
echo 使用 -h 或 --help 查看帮助
pause
exit /b 1

:show_help
echo 用法: %0 [选项]
echo.
echo 选项:
echo   -p, --port PORT       指定端口号 (默认: %DEFAULT_PORT%)
echo   -H, --host HOST       指定主机地址 (默认: %DEFAULT_HOST%)
echo   -e, --env ENV         指定环境 (development^|production^|test, 默认: %DEFAULT_ENV%)
echo   -h, --help           显示帮助信息
echo.
echo 示例:
echo   %0 --port 8080 --host 127.0.0.1 --env development
echo   %0 -p 3000 -H 0.0.0.0 -e production
echo.
exit /b 0

:start_app
REM 验证环境参数
if not "%ENVIRONMENT%"=="development" if not "%ENVIRONMENT%"=="production" if not "%ENVIRONMENT%"=="test" (
    echo 错误: 环境参数必须是: development, production, 或 test
    pause
    exit /b 1
)

REM 验证端口号
echo %PORT%| findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
    echo 错误: 端口号必须是数字
    pause
    exit /b 1
)
if %PORT% leq 0 if %PORT% gtr 65535 (
    echo 错误: 端口号必须是 1-65535 之间的数字
    pause
    exit /b 1
)

echo === 用药提醒应用启动脚本 ===
echo 端口: %PORT%
echo 主机: %HOST%
echo 环境: %ENVIRONMENT%
echo.

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Node.js 未安装，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查端口是否被占用
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% equ 0 (
    echo 错误: 端口 %PORT% 已被占用
    echo 请使用其他端口或关闭占用该端口的程序
    echo.
    echo 示例: 使用端口 8080
    echo   %0 --port 8080
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
echo 访问地址: http://%HOST%:%PORT%
echo.
set PORT=%PORT%
set HOST=%HOST%
set NODE_ENV=%ENVIRONMENT%
npm start