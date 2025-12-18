# 用药提醒应用

一个帮助用户管理药品信息和按时服药的健康管理应用。

## 功能特点

- **药品管理**：添加、编辑、删除药品信息
  - 支持多种剂量单位（片、颗、克、毫克）
  - 智能服用时段设置（1-3次/天）
  - 服用方式选择（餐前/餐后）

- **服药提醒**：按时段（早餐、中餐、晚餐）发送提醒
  - 系统原生通知
  - 可自定义提醒时间
  - 通知权限管理

- **用药记录**：记录每日服药情况
  - 按餐记录服用状态
  - 一键标记服用/未服用
  - 自动刷新每日状态

- **数据统计**：展示七日内服药完成率
  - 可视化进度展示
  - 按日统计报告
  - 服药依从性分析

## 快速开始

### 方式一：直接运行

1. 确保已安装 Node.js (>=14.0)
2. 克隆项目到本地
3. 运行启动脚本：

**Linux/macOS:**
```bash
# 使用默认端口 3000
./start.sh

# 指定端口（例如 8080）
./start.sh --port 8080
```

**Windows:**
```cmd
# 使用默认端口 3000
start.bat

# 指定端口（例如 8080）
start.bat --port 8080
```

4. 打开浏览器访问 http://localhost:3000（或指定端口）

### 方式二：Docker 部署

**Linux/macOS:**
```bash
# 使用默认端口 3000
./deploy.sh

# 指定端口（例如 8080）
./deploy.sh --port 8080
```

**Windows:**
```cmd
# 使用默认端口 3000
deploy.bat

# 指定端口（例如 8080）
deploy.bat --port 8080
```

## 项目结构

```
med-reminder/
├── src/                    # 源代码
│   ├── api/               # API 路由
│   ├── database/          # 数据库配置
│   ├── models/            # 数据模型
│   ├── services/          # 业务逻辑
│   └── index.js           # 应用入口
├── public/                # 静态文件
│   └── index.html         # 前端界面
├── data/                  # 数据存储目录
├── config/                # 配置文件
├── scripts/               # 脚本文件
├── target.md              # 项目需求文档
├── README.md              # 项目说明
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose
└── openspec/              # OpenSpec 规格管理
    ├── project.md         # 项目配置
    ├── AGENTS.md          # AI 助手指南
    ├── changes/           # 变更提案
    └── specs/             # 规格文档
```

## 技术栈

- **后端**: Node.js + Express.js
- **数据库**: SQLite3
- **前端**: 原生 HTML/CSS/JavaScript
- **通知**: node-notifier
- **定时任务**: node-cron
- **容器化**: Docker

## 开发指南

### 环境准备

1. 安装 Node.js (>=14.0)
2. 安装依赖：`npm install`
3. 初始化数据库：`npm run init-db`
4. 启动开发服务器：`npm run dev`

### API 接口

#### 药品管理
- `GET /api/medications` - 获取所有药品
- `POST /api/medications` - 添加新药品
- `GET /api/medications/:id` - 获取单个药品
- `PUT /api/medications/:id` - 更新药品
- `DELETE /api/medications/:id` - 删除药品
- `GET /api/medications/status/today` - 获取今日用药状态
- `POST /api/medications/:id/take` - 标记服用状态
- `POST /api/medications/refresh` - 刷新用药状态

#### 统计接口
- `GET /api/statistics/seven-days` - 获取7天统计
- `GET /api/statistics/day/:date` - 获取单日统计
- `GET /api/statistics/month/:year/:month` - 获取月度统计

#### 通知接口
- `GET /api/statistics/notifications/status` - 获取通知状态
- `POST /api/statistics/notifications/enable` - 启用通知
- `POST /api/statistics/notifications/disable` - 禁用通知
- `POST /api/statistics/notifications/test` - 测试通知

### 数据模型

#### Medications (药品表)
```sql
CREATE TABLE medications (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  dosage REAL NOT NULL,
  unit TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  breakfast BOOLEAN DEFAULT 0,
  lunch BOOLEAN DEFAULT 0,
  dinner BOOLEAN DEFAULT 0,
  timing TEXT DEFAULT '餐后',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT 0
);
```

#### MedicationRecords (用药记录表)
```sql
CREATE TABLE medication_records (
  id INTEGER PRIMARY KEY,
  medication_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  meal_time TEXT NOT NULL,
  taken_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 部署

### Docker 部署

1. 构建镜像：
```bash
docker build -t med-reminder .
```

2. 运行容器：
```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data med-reminder
```

### Docker Compose 部署

```bash
docker-compose up -d
```

### 环境变量

创建 `.env` 文件：
```env
PORT=3000
NODE_ENV=development
BREAKFAST_TIME=08:00
LUNCH_TIME=12:00
DINNER_TIME=18:00
```

## 使用说明

1. **添加药品**
   - 点击"新增药品"按钮
   - 填写药品信息（名称、剂量、单位等）
   - 选择服用频次和时段
   - 系统会根据频次自动控制可选时段

2. **记录服药**
   - 在主界面查看各时段待服用药品
   - 点击药品或"标记服用"按钮记录
   - 已服用的药品会显示为绿色

3. **查看统计**
   - 点击"数据统计"按钮
   - 查看过去7天的服药完成率
   - 分析用药依从性趋势

4. **通知设置**
   - 在统计页面进入通知设置
   - 测试系统通知功能
   - 启用/禁用定时提醒

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request！