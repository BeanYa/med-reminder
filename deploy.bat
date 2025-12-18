@echo off
REM 用药提醒应用一键部署脚本 (Windows)

setlocal enabledelayedexpansion

REM 默认配置
set DEFAULT_PORT=3000
set DEFAULT_HOST=0.0.0.0
set DEFAULT_ENV=production
set DEFAULT_NAME=med-reminder-app

REM 初始化变量
set PORT=%DEFAULT_PORT%
set HOST=%DEFAULT_HOST%
set ENVIRONMENT=%DEFAULT_ENV%
set CONTAINER_NAME=%DEFAULT_NAME%

REM 解析命令行参数
:parse_args
if "%~1"=="" goto start_deploy
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
if "%~1"=="-n" (
    set CONTAINER_NAME=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--name" (
    set CONTAINER_NAME=%~2
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
echo   -n, --name NAME       指定容器名称 (默认: %DEFAULT_NAME%)
echo   -h, --help           显示帮助信息
echo.
echo 示例:
echo   %0 --port 8080 --host 127.0.0.1 --env development
echo   %0 -p 3000 -H 0.0.0.0 -e production -n my-med-app
echo.
exit /b 0

:start_deploy
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

echo === 用药提醒应用部署脚本 ===
echo 端口: %PORT%
echo 主机: %HOST%
echo 环境: %ENVIRONMENT%
echo 容器名称: %CONTAINER_NAME%
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker 未安装，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 停止并删除现有容器（如果存在）
echo.
echo 清理现有容器...
docker-compose down --remove-orphans 2>nul

REM 构建新镜像
echo.
echo 构建应用镜像...
set PORT=%PORT% HOST=%HOST% NODE_ENV=%ENVIRONMENT% docker-compose build

REM 启动服务
echo.
echo 启动应用服务...
set PORT=%PORT% HOST=%HOST% NODE_ENV=%ENVIRONMENT% docker-compose up -d

REM 等待服务启动
echo.
echo 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查服务状态
echo.
echo 检查服务状态...
curl -f http://localhost:%PORT%/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 应用启动成功！
    echo.
    echo 访问地址: http://localhost:%PORT%
    echo API 文档: http://localhost:%PORT%/api/health
) else (
    echo ❌ 应用启动失败，请检查日志：
    docker-compose logs med-reminder
    pause
    exit /b 1
)

echo.
echo === 部署完成 ===
echo.
echo 常用命令：
echo 查看日志: docker-compose logs -f med-reminder
echo 停止服务: docker-compose down
echo 重启服务: docker-compose restart med-reminder
pause