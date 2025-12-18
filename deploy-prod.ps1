# 生产环境部署脚本 (PowerShell)
# Production Environment Deployment Script

param(
    [string]$Port = "3000",
    [string]$Host = "0.0.0.0",
    [string]$Name = "med-reminder-prod",
    [switch]$Help
)

# 显示帮助信息
if ($Help) {
    Write-Host "用法: .\deploy-prod.ps1 [选项]" -ForegroundColor Cyan
    Write-Host "Usage: .\deploy-prod.ps1 [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Port <端口>       指定端口号 (默认: 3000) / Specify port number (default: 3000)"
    Write-Host "  -Host <主机>       指定主机地址 (默认: 0.0.0.0) / Specify host address (default: 0.0.0.0)"
    Write-Host "  -Name <名称>       指定容器名称 (默认: med-reminder-prod) / Specify container name (default: med-reminder-prod)"
    Write-Host "  -Help             显示帮助信息 / Show help information"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Green
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\deploy-prod.ps1 -Port 80 -Name production-med-app"
    Write-Host "  .\deploy-prod.ps1 -Port 3000 -Host 127.0.0.1"
    exit 0
}

# 验证端口号
if ($Port -notmatch '^\d+$' -or [int]$Port -lt 1 -or [int]$Port -gt 65535) {
    Write-Host "错误: 端口号必须是 1-65535 之间的数字" -ForegroundColor Red
    Write-Host "Error: Port number must be between 1-65535" -ForegroundColor Red
    exit 1
}

Write-Host "=== 生产环境部署脚本 ===" -ForegroundColor Cyan
Write-Host "=== Production Environment Deployment Script ===" -ForegroundColor Cyan
Write-Host "端口 Port: $Port" -ForegroundColor White
Write-Host "主机 Host: $Host" -ForegroundColor White
Write-Host "容器名称 Container Name: $Name" -ForegroundColor White
Write-Host "环境 Environment: production" -ForegroundColor White
Write-Host ""

# 检查 Docker 是否安装
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "✓ Docker 已安装 / Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: Docker 未安装，请先安装 Docker Desktop" -ForegroundColor Red
    Write-Host "✗ Error: Docker is not installed, please install Docker Desktop" -ForegroundColor Red
    Write-Host "下载地址 / Download URL: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# 检查 Docker Compose
try {
    $composeVersion = docker-compose --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        # 尝试新版本命令
        $composeVersion = docker compose version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose not found"
        }
        $composeCmd = "docker compose"
    } else {
        $composeCmd = "docker-compose"
    }
    Write-Host "✓ Docker Compose 已安装 / Docker Compose is installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: Docker Compose 未安装" -ForegroundColor Red
    Write-Host "✗ Error: Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

# 设置环境变量
$env:PORT = $Port
$env:HOST = $Host
$env:NODE_ENV = "production"
$env:CONTAINER_NAME = $Name

# 清理现有容器
Write-Host "清理现有容器 / Cleaning up existing containers..." -ForegroundColor Yellow
try {
    Invoke-Expression "$composeCmd -f docker-compose.prod.yml down --remove-orphans 2>`$null"
    Write-Host "✓ 容器清理完成 / Containers cleaned up" -ForegroundColor Green
} catch {
    Write-Host "! 容器清理警告 / Container cleanup warning: $_" -ForegroundColor Yellow
}

# 构建镜像
Write-Host "构建生产镜像 / Building production image..." -ForegroundColor Yellow
try {
    Invoke-Expression "$composeCmd -f docker-compose.prod.yml build"
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✓ 镜像构建成功 / Image built successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: 镜像构建失败" -ForegroundColor Red
    Write-Host "✗ Error: Image build failed" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
    exit 1
}

# 启动服务
Write-Host "启动生产服务 / Starting production service..." -ForegroundColor Yellow
try {
    Invoke-Expression "$composeCmd -f docker-compose.prod.yml up -d"
    if ($LASTEXITCODE -ne 0) {
        throw "Service start failed"
    }
    Write-Host "✓ 服务启动成功 / Service started successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: 服务启动失败" -ForegroundColor Red
    Write-Host "✗ Error: Service failed to start" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
    exit 1
}

# 等待服务启动
Write-Host "等待服务启动 / Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 健康检查
Write-Host "检查服务状态 / Checking service status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 生产环境部署成功！" -ForegroundColor Green
        Write-Host "✅ Production environment deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "访问地址 / Access URL: http://localhost:$Port" -ForegroundColor Cyan
        Write-Host "容器名称 / Container Name: $Name" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "管理命令 / Management Commands:" -ForegroundColor Yellow
        Write-Host "查看日志 / View logs: $composeCmd -f docker-compose.prod.yml logs -f" -ForegroundColor White
        Write-Host "停止服务 / Stop service: $composeCmd -f docker-compose.prod.yml down" -ForegroundColor White
        Write-Host "重启服务 / Restart service: $composeCmd -f docker-compose.prod.yml restart" -ForegroundColor White
    } else {
        throw "Health check failed with status code: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ 服务启动失败，查看日志:" -ForegroundColor Red
    Write-Host "❌ Service failed to start, viewing logs:" -ForegroundColor Red
    Invoke-Expression "$composeCmd -f docker-compose.prod.yml logs"
    exit 1
}

Write-Host ""
Write-Host "=== 生产环境部署完成 ===" -ForegroundColor Green
Write-Host "=== Production Environment Deployment Complete ===" -ForegroundColor Green

# 清理环境变量
Remove-Item Env:\PORT -ErrorAction SilentlyContinue
Remove-Item Env:\HOST -ErrorAction SilentlyContinue
Remove-Item Env:\NODE_ENV -ErrorAction SilentlyContinue
Remove-Item Env:\CONTAINER_NAME -ErrorAction SilentlyContinue