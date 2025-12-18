const database = require('../database/database');

class Medication {
  // 创建新药品
  async create(medication) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const { name, dosage, unit, frequency, breakfast, lunch, dinner, timing } = medication;

      const sql = `
        INSERT INTO medications (name, dosage, unit, frequency, breakfast, lunch, dinner, timing)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, [name, dosage, unit, frequency, breakfast, lunch, dinner, timing],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...medication });
          }
        }
      );
    });
  }

  // 根据ID获取药品
  async findById(id) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM medications WHERE id = ? AND deleted = 0';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 获取所有药品
  async getAll() {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM medications WHERE deleted = 0 ORDER BY created_at DESC';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 更新药品
  async update(id, medication) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const { name, dosage, unit, frequency, breakfast, lunch, dinner, timing } = medication;

      const sql = `
        UPDATE medications
        SET name = ?, dosage = ?, unit = ?, frequency = ?,
            breakfast = ?, lunch = ?, dinner = ?, timing = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted = 0
      `;

      db.run(sql, [name, dosage, unit, frequency, breakfast, lunch, dinner, timing, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  // 删除药品（软删除）
  async delete(id) {
    const db = database.getDB();
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE medications SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 验证药品数据
  validate(medication) {
    const errors = [];

    if (!medication.name || medication.name.trim() === '') {
      errors.push('药品名称不能为空');
    }

    if (!medication.dosage || medication.dosage <= 0) {
      errors.push('剂量必须是正数');
    }

    if (!['片', '颗', '克', '毫克'].includes(medication.unit)) {
      errors.push('单位必须是：片、颗、克、毫克之一');
    }

    if (![1, 2, 3].includes(medication.frequency)) {
      errors.push('频次必须是：1、2、3次/天之一');
    }

    if (!['餐前', '餐后'].includes(medication.timing)) {
      errors.push('服用方式必须是：餐前或餐后');
    }

    // 检查服用时段与频次的一致性
    const selectedTimes = [medication.breakfast, medication.lunch, medication.dinner]
      .filter(Boolean).length;

    if (medication.frequency === 1 && selectedTimes !== 1) {
      errors.push('1次/天只能选择一个服用时段');
    }

    if (medication.frequency === 2 && selectedTimes !== 2) {
      errors.push('2次/天只能选择两个服用时段');
    }

    if (medication.frequency === 3 && selectedTimes !== 3) {
      errors.push('3次/天必须选择所有三个服用时段');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new Medication();