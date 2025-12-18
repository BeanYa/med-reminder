const database = require('../database/database');

class MedicationRecord {
  // 创建用药记录
  async create(record) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const { medication_id, date, meal_time, taken_at } = record;

      const sql = `
        INSERT OR REPLACE INTO medication_records (medication_id, date, meal_time, taken_at)
        VALUES (?, ?, ?, ?)
      `;

      db.run(sql, [medication_id, date, meal_time, taken_at],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...record });
          }
        }
      );
    });
  }

  // 标记已服用
  async markAsTaken(medication_id, date, meal_time) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE medication_records
        SET taken_at = CURRENT_TIMESTAMP
        WHERE medication_id = ? AND date = ? AND meal_time = ?
      `;

      db.run(sql, [medication_id, date, meal_time], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 获取某一天的用药记录
  async getByDate(date) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT mr.*, m.name, m.dosage, m.unit
        FROM medication_records mr
        JOIN medications m ON mr.medication_id = m.id
        WHERE mr.date = ? AND m.deleted = 0
        ORDER BY mr.meal_time
      `;

      db.all(sql, [date], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取今天的待服用药品
  async getTodayMedications() {
    const db = database.getDB();
    const today = new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          m.*,
          CASE
            WHEN mr.id IS NULL THEN NULL
            ELSE mr.taken_at
          END as taken_at
        FROM medications m
        LEFT JOIN medication_records mr ON
          m.id = mr.medication_id AND
          mr.date = ?
        WHERE m.deleted = 0
        ORDER BY
          CASE m.timing
            WHEN '餐前' THEN 1
            ELSE 2
          END,
          m.name
      `;

      db.all(sql, [today], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 按用餐时段分组今天的药品
  async getTodayMedicationsByMeal() {
    const medications = await this.getTodayMedications();

    const result = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    medications.forEach(med => {
      if (med.breakfast && (!med.taken_at || !med.taken_at.includes('早餐'))) {
        result.breakfast.push({
          ...med,
          taken: med.taken_at && med.taken_at.includes('早餐')
        });
      }
      if (med.lunch && (!med.taken_at || !med.taken_at.includes('中餐'))) {
        result.lunch.push({
          ...med,
          taken: med.taken_at && med.taken_at.includes('中餐')
        });
      }
      if (med.dinner && (!med.taken_at || !med.taken_at.includes('晚餐'))) {
        result.dinner.push({
          ...med,
          taken: med.taken_at && med.taken_at.includes('晚餐')
        });
      }
    });

    return result;
  }

  // 获取昨天的未服用记录
  async getYesterdayUntaken() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          m.name,
          m.dosage,
          m.unit,
          m.breakfast,
          m.lunch,
          m.dinner,
          CASE
            WHEN mr_breakfast.id IS NULL AND m.breakfast = 1 THEN '早餐'
            WHEN mr_lunch.id IS NULL AND m.lunch = 1 THEN '中餐'
            WHEN mr_dinner.id IS NULL AND m.dinner = 1 THEN '晚餐'
          END as missed_meal
        FROM medications m
        LEFT JOIN medication_records mr_breakfast ON
          m.id = mr_breakfast.medication_id AND
          mr_breakfast.date = ? AND
          mr_breakfast.meal_time = '早餐'
        LEFT JOIN medication_records mr_lunch ON
          m.id = mr_lunch.medication_id AND
          mr_lunch.date = ? AND
          mr_lunch.meal_time = '中餐'
        LEFT JOIN medication_records mr_dinner ON
          m.id = mr_dinner.medication_id AND
          mr_dinner.date = ? AND
          mr_dinner.meal_time = '晚餐'
        WHERE m.deleted = 0
        AND (
          (m.breakfast = 1 AND mr_breakfast.id IS NULL) OR
          (m.lunch = 1 AND mr_lunch.id IS NULL) OR
          (m.dinner = 1 AND mr_dinner.id IS NULL)
        )
      `;

      db.all(sql, [yesterdayStr, yesterdayStr, yesterdayStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取7天内的用药统计
  async getSevenDayStats() {
    const db = database.getDB();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          date,
          COUNT(*) as total_medications,
          SUM(CASE WHEN taken_at IS NOT NULL THEN 1 ELSE 0 END) as taken_medications
        FROM medication_records mr
        JOIN medications m ON mr.medication_id = m.id
        WHERE mr.date >= ? AND m.deleted = 0
        GROUP BY date
        ORDER BY date DESC
      `;

      db.all(sql, [sevenDaysAgoStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 计算完成率
          const stats = rows.map(row => ({
            date: row.date,
            total: row.total_medications,
            taken: row.taken_medications,
            completion_rate: row.total_medications > 0
              ? Math.round((row.taken_medications / row.total_medications) * 100)
              : 0
          }));
          resolve(stats);
        }
      });
    });
  }
}

module.exports = new MedicationRecord();