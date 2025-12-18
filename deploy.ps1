# 用药提醒应用部署脚本 (PowerShell)
# Medication Reminder App Deployment Script

param(
    [string]$Port = "3000",
    [string]$Host = "0.0.0.0",
    [string]$Env = "production",
    [string]$Name = "med-reminder-app",
    [switch]$Help
)

# 显示帮助信息
if ($Help) {
    Write-Host "用法: .\deploy.ps1 [选项]" -ForegroundColor Cyan
    Write-Host "Usage: .\deploy.ps1 [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Port <端口>       指定端口号 (默认: 3000) / Specify port number (default: 3000)"
    Write-Host "  -Host <主机>       指定主机地址 (默认: 0.0.0.0) / Specify host address (default: 0.0.0.0)"
    Write-Host "  -Env <环境>        指定环境 (development/production/test, 默认: production)"
    Write-Host "  -Name <名称>       指定容器名称 (默认: med-reminder-app)"
    Write-Host "  -Help             显示帮助信息 / Show help information"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Green
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\deploy.ps1 -Env development -Port 3001"
    Write-Host "  .\deploy.ps1 -Env production -Host 127.0.0.1 -Name my-med-app"
    Write-Host "  .\deploy.ps1 -Port 8080 -Env test"
    exit 0
}

# 验证环境参数
$validEnvs = @("development", "production", "test")
if ($Env -notin $validEnvs) {
    Write-Host "错误: 环境参数必须是: development, production, 或 test" -ForegroundColor Red
    Write-Host "Error: Environment must be: development, production, or test" -ForegroundColor Red
    exit 1
}

# 验证端口号
if ($Port -notmatch '^\d+$' -or [int]$Port -lt 1 -or [int]$Port -gt 65535) {
    Write-Host "错误: 端口号必须是 1-65535 之间的数字" -ForegroundColor Red
    Write-Host "Error: Port number must be between 1-65535" -ForegroundColor Red
    exit 1
}

Write-Host "=== 用药提醒应用部署脚本 ===" -ForegroundColor Cyan
Write-Host "=== Medication Reminder App Deployment Script ===" -ForegroundColor Cyan
Write-Host "端口 Port: $Port" -ForegroundColor White
Write-Host "主机 Host: $Host" -ForegroundColor White
Write-Host "环境 Environment: $Env" -ForegroundColor White
Write-Host "容器名称 Container Name: $Name" -ForegroundColor White
Write-Host ""

# 检查 Docker
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "✓ Docker 已安装 / Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: Docker 未安装" -ForegroundColor Red
    Write-Host "✗ Error: Docker is not installed" -ForegroundColor Red
    Write-Host "下载地址 / Download URL: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# 检查 Docker Compose
try {
    $composeVersion = docker-compose --version 2>$null
    if ($LASTEXITCODE -ne 0) {
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

# 选择合适的 compose 文件
$composeFile = if ($Env -eq "production") { "docker-compose.prod.yml" } else { "docker-compose.yml" }
Write-Host "使用配置文件 / Using compose file: $composeFile" -ForegroundColor Yellow

# 设置环境变量
$env:PORT = $Port
$env:HOST = $Host
$env:NODE_ENV = $Env
$env:CONTAINER_NAME = $Name

# 清理现有容器
Write-Host "清理现有容器 / Cleaning up existing containers..." -ForegroundColor Yellow
try {
    Invoke-Expression "$composeCmd -f $composeFile down --remove-orphans 2>`$null"
    Write-Host "✓ 容器清理完成 / Containers cleaned up" -ForegroundColor Green
} catch {
    Write-Host "! 容器清理警告 / Container cleanup warning: $_" -ForegroundColor Yellow
}

# 构建镜像
Write-Host "构建应用镜像 / Building application image..." -ForegroundColor Yellow
try {
    Invoke-Expression "$composeCmd -f $composeFile build"
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
Write-Host "启动应用服务 / Starting application service..." -ForegroundColor Yellow
try {
    Invoke-Expression "$composeCmd -f $composeFile up -d"
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
$waitTime = if ($Env -eq "production") { 10 } else { 5 }
Write-Host "等待服务启动 / Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds $waitTime

# 健康检查
Write-Host "检查服务状态 / Checking service status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 部署成功！" -ForegroundColor Green
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "访问地址 / Access URL: http://localhost:$Port" -ForegroundColor Cyan
        Write-Host "环境 Environment: $Env" -ForegroundColor Cyan
        Write-Host "容器名称 / Container Name: $Name" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "管理命令 / Management Commands:" -ForegroundColor Yellow
        Write-Host "查看日志 / View logs: $composeCmd -f $composeFile logs -f" -ForegroundColor White
        Write-Host "停止服务 / Stop service: $composeCmd -f $composeFile down" -ForegroundColor White
        Write-Host "重启服务 / Restart service: $composeCmd -f $composeFile restart" -ForegroundColor White
    } else {
        throw "Health check failed with status code: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ 服务启动失败，查看日志:" -ForegroundColor Red
    Write-Host "❌ Service failed to start, viewing logs:" -ForegroundColor Red
    Invoke-Expression "$composeCmd -f $composeFile logs"
    exit 1
}

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Green
Write-Host "=== Deployment Complete ===" -ForegroundColor Green

# 清理环境变量
Remove-Item Env:\PORT -ErrorAction SilentlyContinue
Remove-Item Env:\HOST -ErrorAction SilentlyContinue
Remove-Item Env:\NODE_ENV -ErrorAction SilentlyContinue
Remove-Item Env:\CONTAINER_NAME -ErrorAction SilentlyContinue