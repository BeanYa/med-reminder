const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/medications.db');

class Database {
  constructor() {
    this.db = null;
  }

  // 初始化数据库连接
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  // 创建数据表
  async createTables() {
    const createMedicationsTable = `
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        dosage REAL NOT NULL,
        unit TEXT NOT NULL CHECK(unit IN ('片', '颗', '克', '毫克')),
        frequency INTEGER NOT NULL CHECK(frequency IN (1, 2, 3)),
        breakfast BOOLEAN NOT NULL DEFAULT 0,
        lunch BOOLEAN NOT NULL DEFAULT 0,
        dinner BOOLEAN NOT NULL DEFAULT 0,
        timing TEXT NOT NULL CHECK(timing IN ('餐前', '餐后')) DEFAULT '餐后',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted BOOLEAN DEFAULT 0
      );
    `;

    const createMedicationRecordsTable = `
      CREATE TABLE IF NOT EXISTS medication_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        meal_time TEXT NOT NULL CHECK(meal_time IN ('早餐', '中餐', '晚餐')),
        taken_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medication_id) REFERENCES medications(id),
        UNIQUE(medication_id, date, meal_time)
      );
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_med_records_date ON medication_records(date);',
      'CREATE INDEX IF NOT EXISTS idx_med_records_med_id ON medication_records(medication_id);',
      'CREATE INDEX IF NOT EXISTS idx_med_records_taken ON medication_records(taken_at);'
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createMedicationsTable);
        this.db.run(createMedicationRecordsTable);

        // 创建索引
        createIndexes.forEach(sql => {
          this.db.run(sql);
        });

        console.log('Database tables created successfully');
        resolve();
      });
    });
  }

  // 获取数据库实例
  getDB() {
    return this.db;
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// 创建单例实例
const database = new Database();

module.exports = database;