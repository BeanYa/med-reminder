@echo off
REM 用药提醒应用一键部署脚本 (Windows)

echo === 用药提醒应用部署脚本 ===
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
docker-compose build

REM 启动服务
echo.
echo 启动应用服务...
docker-compose up -d

REM 等待服务启动
echo.
echo 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查服务状态
echo.
echo 检查服务状态...
curl -f http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 应用启动成功！
    echo.
    echo 访问地址: http://localhost:3000
    echo API 文档: http://localhost:3000/api/health
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
echo.
pause