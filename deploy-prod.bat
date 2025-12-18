@echo off
REM 生产环境部署脚本 (Windows)

setlocal enabledelayedexpansion

REM 默认生产配置
set DEFAULT_PORT=3000
set DEFAULT_HOST=0.0.0.0
set DEFAULT_NAME=med-reminder-prod

REM 初始化变量
set PORT=%DEFAULT_PORT%
set HOST=%DEFAULT_HOST%
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
echo 生产环境部署脚本
echo.
echo 选项:
echo   -p, --port PORT       指定端口号 (默认: %DEFAULT_PORT%)
echo   -H, --host HOST       指定主机地址 (默认: %DEFAULT_HOST%)
echo   -n, --name NAME       指定容器名称 (默认: %DEFAULT_NAME%)
echo   -h, --help           显示帮助信息
echo.
echo 示例:
echo   %0 --port 80 --name production-med-app
echo   %0 -p 3000 -H 0.0.0.0
echo.
exit /b 0

:start_deploy
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

echo === 生产环境部署脚本 ===
echo 端口: %PORT%
echo 主机: %HOST%
echo 容器名称: %CONTAINER_NAME%
echo 环境: production
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker 未安装，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 清理现有容器
echo.
echo 清理现有容器...
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>nul

REM 构建并启动
echo.
echo 构建生产镜像...
set PORT=%PORT% HOST=%HOST% NODE_ENV=production CONTAINER_NAME=%CONTAINER_NAME% docker-compose -f docker-compose.prod.yml build

echo.
echo 启动生产服务...
set PORT=%PORT% HOST=%HOST% NODE_ENV=production CONTAINER_NAME=%CONTAINER_NAME% docker-compose -f docker-compose.prod.yml up -d

REM 等待服务启动
echo.
echo 等待服务启动...
timeout /t 10 /nobreak >nul

REM 健康检查
echo.
echo 检查服务状态...
curl -f http://localhost:%PORT%/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 生产环境部署成功！
    echo.
    echo 访问地址: http://localhost:%PORT%
    echo 容器名称: %CONTAINER_NAME%
    echo.
    echo 管理命令：
    echo 查看日志: docker-compose -f docker-compose.prod.yml logs -f
    echo 停止服务: docker-compose -f docker-compose.prod.yml down
    echo 重启服务: docker-compose -f docker-compose.prod.yml restart
) else (
    echo ❌ 服务启动失败，查看日志：
    docker-compose -f docker-compose.prod.yml logs
    pause
    exit /b 1
)

echo.
echo === 生产环境部署完成 ===
pause