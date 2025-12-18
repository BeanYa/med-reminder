const express = require('express');
const StatisticsService = require('../services/StatisticsService');
const NotificationService = require('../services/NotificationService');

const router = express.Router();

// 获取7天用药统计
router.get('/seven-days', async (req, res) => {
  try {
    const result = await StatisticsService.getSevenDayStatistics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取某一天统计
router.get('/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await StatisticsService.getDayStatistics(date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取月度统计
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await StatisticsService.getMonthlyStatistics(
      parseInt(year),
      parseInt(month)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 生成报告
router.post('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const result = await StatisticsService.generateReport(startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取通知状态
router.get('/notifications/status', (req, res) => {
  try {
    const status = NotificationService.getNotificationStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 检查通知权限
router.get('/notifications/permission', async (req, res) => {
  try {
    const hasPermission = await NotificationService.checkNotificationPermission();
    res.json({ success: true, data: { hasPermission } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启用通知
router.post('/notifications/enable', (req, res) => {
  try {
    NotificationService.enableNotifications();
    res.json({ success: true, message: '通知已启用' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 禁用通知
router.post('/notifications/disable', (req, res) => {
  try {
    NotificationService.disableNotifications();
    res.json({ success: true, message: '通知已禁用' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新提醒时间
router.post('/notifications/update-times', (req, res) => {
  try {
    const { breakfast, lunch, dinner } = req.body;
    NotificationService.updateReminderTimes(breakfast, lunch, dinner);
    res.json({ success: true, message: '提醒时间已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试通知
router.post('/notifications/test', (req, res) => {
  try {
    NotificationService.sendNotification(
      '测试通知',
      '这是一条测试通知，如果您能看到这条消息，说明通知系统正常工作。',
      { urgency: 'low' }
    );
    res.json({ success: true, message: '测试通知已发送' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;