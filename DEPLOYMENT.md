# 部署指南

本文档介绍了用药提醒应用的多种部署方式和配置选项。

## 快速开始

### 使用 Docker 部署（推荐）

```bash
# 使用默认配置部署
./deploy.sh

# 或者 Windows
deploy.bat
```

### 本地开发部署

```bash
# 使用默认配置启动
./start.sh

# 或者 Windows
start.bat
```

## 配置选项

所有部署脚本都支持以下参数：

### 参数说明

| 参数 | 简写 | 描述 | 默认值 | 示例 |
|------|------|------|--------|------|
| `--port` | `-p` | 指定端口号 | 3000 | `--port 8080` |
| `--host` | `-H` | 指定主机地址 | 0.0.0.0 | `--host 127.0.0.1` |
| `--env` | `-e` | 指定运行环境 | production | `--env development` |
| `--name` | `-n` | 指定容器名称（仅Docker） | med-reminder-app | `--name my-app` |
| `--help` | `-h` | 显示帮助信息 | - | `-h` |

### 环境选项

- `development`: 开发环境，启用详细日志
- `production`: 生产环境，优化性能
- `test`: 测试环境，使用测试数据库

## 使用示例

### Docker 部署示例

```bash
# 基本部署
./deploy.sh

# 指定端口部署
./deploy.sh --port 8080

# 开发环境部署，绑定到本地主机
./deploy.sh --port 3000 --host 127.0.0.1 --env development

# 完整参数部署
./deploy.sh -p 8080 -H 0.0.0.0 -e production -n my-medication-reminder
```

### 本地开发示例

```bash
# 基本启动
./start.sh

# 开发环境启动
./start.sh --env development --port 3001

# 测试环境启动
./start.sh -e test -p 3002
```

### Windows 示例

```cmd
# 基本部署
deploy.bat

# 指定端口部署
deploy.bat --port 8080

# 开发环境部署
deploy.bat -p 3000 -H 127.0.0.1 -e development
```

## 端口配置

### 端口冲突检测

所有脚本都会自动检测端口冲突：

- 如果端口被占用，脚本会提示错误并退出
- 请使用其他端口或关闭占用端口的程序

### 端口范围

- 有效端口范围：1-65535
- 建议使用范围：3000-9999

## 主机配置

### 主机地址选项

- `0.0.0.0`: 监听所有网络接口（默认）
- `127.0.0.1`: 仅本地访问
- `192.168.x.x`: 局域网访问
- 具体IP地址: 绑定到特定网络接口

### 使用场景

```bash
# 仅本地访问
./deploy.sh --host 127.0.0.1

# 局域网访问
./deploy.sh --host 0.0.0.0

# 绑定到特定IP
./deploy.sh --host 192.168.1.100
```

## 环境配置

### 开发环境

```bash
./deploy.sh --env development
```

特点：
- 详细的调试日志
- 热重载支持
- 开发工具集成

### 生产环境

```bash
./deploy.sh --env production
```

特点：
- 性能优化
- 错误日志最小化
- 安全增强

### 测试环境

```bash
./deploy.sh --env test
```

特点：
- 使用测试数据库
- 隔离的测试环境
- 测试覆盖率报告

## Docker 配置

### docker-compose.yml 配置

服务支持以下环境变量：

```yaml
services:
  med-reminder:
    build: .
    container_name: ${CONTAINER_NAME:-med-reminder-app}
    ports:
      - "${HOST:-0.0.0.0}:${PORT:-3000}:${PORT:-3000}"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3000}
      - HOST=${HOST:-0.0.0.0}
```

### 数据持久化

- `./data:/app/data`: 药品数据库
- `./config:/app/config`: 配置文件

### 健康检查

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:${PORT:-3000}/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 常用命令

### Docker 管理

```bash
# 查看日志
docker-compose logs -f med-reminder

# 停止服务
docker-compose down

# 重启服务
docker-compose restart med-reminder

# 进入容器
docker-compose exec med-reminder sh
```

### 端口检查

```bash
# Linux/macOS
lsof -i :3000
netstat -tulpn | grep :3000

# Windows
netstat -ano | findstr :3000
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :3000

   # 使用其他端口
   ./deploy.sh --port 8080
   ```

2. **Docker 未安装**
   - 安装 Docker Desktop (Windows/Mac)
   - 安装 Docker Engine (Linux)

3. **权限问题**
   ```bash
   # Linux/macOS
   sudo chmod +x deploy.sh start.sh

   # 确保脚本有执行权限
   ```

4. **容器启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs med-reminder

   # 重新构建镜像
   docker-compose build --no-cache
   ```

### 日志位置

- **应用日志**: `./logs/app.log`
- **Docker 日志**: `docker-compose logs med-reminder`
- **数据库文件**: `./data/medications.db`

## 配置文件

### .env 文件

```bash
# 服务器配置
PORT=3000
HOST=0.0.0.0

# 数据库配置
DB_PATH=./data/medications.db

# 通知配置
BREAKFAST_TIME=08:00
LUNCH_TIME=12:00
DINNER_TIME=18:00
NOTIFICATION_ENABLED=true

# 应用配置
NODE_ENV=development

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 安全建议

1. **生产环境**
   - 使用 HTTPS
   - 配置防火墙
   - 定期更新依赖
   - 使用强密码

2. **网络安全**
   - 限制主机绑定（如使用 127.0.0.1）
   - 使用 VPN 访问
   - 配置反向代理

3. **数据安全**
   - 定期备份数据库
   - 设置适当的文件权限
   - 加密敏感数据