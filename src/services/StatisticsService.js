const MedicationRecord = require('../models/MedicationRecord');

class StatisticsService {
  // 获取7天用药统计
  async getSevenDayStatistics() {
    try {
      const stats = await MedicationRecord.getSevenDayStats();

      // 按日期格式化
      const formattedStats = stats.map(stat => ({
        date: this.formatDate(stat.date),
        ...stat
      }));

      return {
        success: true,
        data: formattedStats
      };
    } catch (error) {
      console.error('获取统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取某一天的详细统计
  async getDayStatistics(date) {
    try {
      const records = await MedicationRecord.getByDate(date);

      // 计算各种统计指标
      const statistics = {
        date: this.formatDate(date),
        total: records.length,
        taken: records.filter(r => r.taken_at !== null).length,
        missed: records.filter(r => r.taken_at === null).length,
        completionRate: 0,
        byMeal: {
          breakfast: this.getMealStatistics(records, '早餐'),
          lunch: this.getMealStatistics(records, '中餐'),
          dinner: this.getMealStatistics(records, '晚餐')
        }
      };

      // 计算总体完成率
      statistics.completionRate = statistics.total > 0
        ? Math.round((statistics.taken / statistics.total) * 100)
        : 0;

      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      console.error('获取日期统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取时段统计
  getMealStatistics(records, mealTime) {
    const mealRecords = records.filter(r => r.meal_time === mealTime);
    const taken = mealRecords.filter(r => r.taken_at !== null).length;
    const total = mealRecords.length;

    return {
      total,
      taken,
      missed: total - taken,
      completionRate: total > 0 ? Math.round((taken / total) * 100) : 0
    };
  }

  // 获取月度统计
  async getMonthlyStatistics(year, month) {
    try {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // 获取该月所有日期
      const dates = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 获取所有日期的记录并计算统计
      const dayStats = await Promise.all(
        dates.map(date => MedicationRecord.getByDate(date))
      );

      // 计算月度汇总
      const monthlyStats = {
        year,
        month,
        totalDays: dates.length,
        activeDays: dayStats.filter(stats => stats.length > 0).length,
        totalMedications: dayStats.reduce((sum, day) => sum + day.length, 0),
        takenMedications: dayStats.reduce((sum, day) =>
          sum + day.filter(r => r.taken_at !== null).length, 0
        ),
        completionRate: 0,
        dailyStats: dayStats.map((records, index) => {
          const taken = records.filter(r => r.taken_at !== null).length;
          const total = records.length;
          return {
            date: this.formatDate(dates[index]),
            total,
            taken,
            missed: total - taken,
            completionRate: total > 0 ? Math.round((taken / total) * 100) : 0
          };
        })
      };

      // 计算月度完成率
      monthlyStats.completionRate = monthlyStats.totalMedications > 0
        ? Math.round((monthlyStats.takenMedications / monthlyStats.totalMedications) * 100)
        : 0;

      return {
        success: true,
        data: monthlyStats
      };
    } catch (error) {
      console.error('获取月度统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取药品服用率排名
  async getMedicationAdherenceRanking(days = 30) {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      // 这里需要实现药品服用率的计算逻辑
      // 简化实现，返回空结果
      return {
        success: true,
        data: {
          period: `${days}天`,
          rankings: []
        }
      };
    } catch (error) {
      console.error('获取药品排名失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  }

  // 生成统计报告
  async generateReport(startDate, endDate) {
    try {
      const stats = await this.getStatisticsInRange(startDate, endDate);

      const report = {
        period: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
        summary: {
          totalDays: stats.length,
          activeDays: stats.filter(s => s.total > 0).length,
          totalMedications: stats.reduce((sum, s) => sum + s.total, 0),
          takenMedications: stats.reduce((sum, s) => sum + s.taken, 0),
          averageCompletionRate: this.calculateAverage(stats.map(s => s.completionRate))
        },
        dailyStats: stats,
        trends: this.analyzeTrends(stats)
      };

      return {
        success: true,
        data: report
      };
    } catch (error) {
      console.error('生成报告失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取日期范围内的统计
  async getStatisticsInRange(startDate, endDate) {
    // 简化实现
    return [];
  }

  // 计算平均值
  calculateAverage(numbers) {
    const validNumbers = numbers.filter(n => !isNaN(n));
    return validNumbers.length > 0
      ? Math.round(validNumbers.reduce((sum, n) => sum + n, 0) / validNumbers.length)
      : 0;
  }

  // 分析趋势
  analyzeTrends(stats) {
    if (stats.length < 7) {
      return { trend: 'insufficient_data' };
    }

    const recentWeek = stats.slice(-7);
    const previousWeek = stats.slice(-14, -7);

    const recentAvg = this.calculateAverage(recentWeek.map(s => s.completionRate));
    const previousAvg = this.calculateAverage(previousWeek.map(s => s.completionRate));

    return {
      trend: recentAvg > previousAvg ? 'improving' :
             recentAvg < previousAvg ? 'declining' : 'stable',
      recentWeek: recentAvg,
      previousWeek: previousAvg
    };
  }
}

module.exports = new StatisticsService();