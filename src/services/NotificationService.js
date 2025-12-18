const notifier = require('node-notifier');
const cron = require('node-cron');
const MedicationRecord = require('../models/MedicationRecord');

class NotificationService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isEnabled = true;
  }

  // 检查通知权限
  async checkNotificationPermission() {
    return new Promise((resolve) => {
      // node-notifier 在 Windows/Mac/Linux 上有不同的权限检查方式
      // 这里简化处理，实际应用中需要更详细的权限检查
      notifier.notify({
        title: '权限测试',
        message: '这是权限测试通知',
        wait: false
      }, (error, response) => {
        resolve(error ? false : true);
      });
    });
  }

  // 发送通知
  sendNotification(title, message, options = {}) {
    if (!this.isEnabled) {
      console.log('通知已禁用，跳过发送');
      return;
    }

    const notification = {
      title,
      message,
      sound: true,
      wait: false,
      ...options
    };

    notifier.notify(notification, (error, response) => {
      if (error) {
        console.error('发送通知失败:', error);
      } else {
        console.log('通知发送成功:', title);
      }
    });
  }

  // 发送用药提醒
  async sendMedicationReminder(mealTime) {
    try {
      const medsByMeal = await MedicationRecord.getTodayMedicationsByMeal();
      const medications = medsByMeal[mealTime] || [];

      if (medications.length === 0) {
        return;
      }

      const medicationList = medications
        .map(med => `${med.name} (${med.dosage}${med.unit})`)
        .join('\n');

      const title = `${mealTime}用药提醒`;
      const message = `您需要服用以下药品：\n\n${medicationList}\n\n请按时服药！`;

      this.sendNotification(title, message, {
        urgency: 'normal',
        icon: path.join(__dirname, '../../public/icon.png')
      });
    } catch (error) {
      console.error('发送用药提醒失败:', error);
    }
  }

  // 设置定时提醒
  scheduleReminders() {
    // 取消现有的定时任务
    this.cancelAllScheduledJobs();

    // 设置早餐提醒 (默认 8:00)
    this.scheduleJob('breakfast', '0 8 * * *', () => {
      this.sendMedicationReminder('breakfast');
    });

    // 设置中餐提醒 (默认 12:00)
    this.scheduleJob('lunch', '0 12 * * *', () => {
      this.sendMedicationReminder('lunch');
    });

    // 设置晚餐提醒 (默认 18:00)
    this.scheduleJob('dinner', '0 18 * * *', () => {
      this.sendMedicationReminder('dinner');
    });

    console.log('定时提醒已设置完成');
  }

  // 调度单个任务
  scheduleJob(name, cronPattern, callback) {
    // 如果已存在该名称的任务，先取消
    if (this.scheduledJobs.has(name)) {
      this.scheduledJobs.get(name).stop();
    }

    const task = cron.schedule(cronPattern, callback, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });

    this.scheduledJobs.set(name, task);
  }

  // 取消所有定时任务
  cancelAllScheduledJobs() {
    this.scheduledJobs.forEach((task, name) => {
      task.stop();
      console.log(`已取消定时任务: ${name}`);
    });
    this.scheduledJobs.clear();
  }

  // 启用通知
  enableNotifications() {
    this.isEnabled = true;
    this.scheduleReminders();
  }

  // 禁用通知
  disableNotifications() {
    this.isEnabled = false;
    this.cancelAllScheduledJobs();
  }

  // 更新提醒时间
  updateReminderTimes(breakfast, lunch, dinner) {
    this.cancelAllScheduledJobs();

    // 更新早餐提醒时间
    if (breakfast) {
      const [hour, minute] = breakfast.split(':');
      this.scheduleJob('breakfast', `${minute} ${hour} * * *`, () => {
        this.sendMedicationReminder('breakfast');
      });
    }

    // 更新中餐提醒时间
    if (lunch) {
      const [hour, minute] = lunch.split(':');
      this.scheduleJob('lunch', `${minute} ${hour} * * *`, () => {
        this.sendMedicationReminder('lunch');
      });
    }

    // 更新晚餐提醒时间
    if (dinner) {
      const [hour, minute] = dinner.split(':');
      this.scheduleJob('dinner', `${minute} ${hour} * * *`, () => {
        this.sendMedicationReminder('dinner');
      });
    }
  }

  // 获取通知状态
  getNotificationStatus() {
    return {
      enabled: this.isEnabled,
      scheduledJobs: Array.from(this.scheduledJobs.keys())
    };
  }
}

module.exports = new NotificationService();