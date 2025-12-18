const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

// 导入数据库
const database = require('./database/database');

// 导入路由
const medicationRoutes = require('./api/medicationRoutes');
const statisticsRoutes = require('./api/statisticsRoutes');

// 导入通知服务
const NotificationService = require('./services/NotificationService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API 路由
app.use('/api/medications', medicationRoutes);
app.use('/api/statistics', statisticsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Service is running' });
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await database.init();
    console.log('Database initialized successfully');

    // 初始化通知服务
    NotificationService.scheduleReminders();
    console.log('Notification service initialized');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access the app at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  NotificationService.cancelAllScheduledJobs();
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  NotificationService.cancelAllScheduledJobs();
  database.close();
  process.exit(0);
});

// 启动应用
startServer();