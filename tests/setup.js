const fs = require('fs');
const path = require('path');

// 测试数据库路径
const testDbPath = path.join(__dirname, '../data/test-medications.db');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_PATH = testDbPath;

// 每个测试前清理测试数据库
beforeEach(() => {
  // 确保测试数据目录存在
  const testDir = path.dirname(testDbPath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 删除旧的测试数据库
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// 所有测试后清理
afterAll(() => {
  // 删除测试数据库
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// 全局测试工具函数
global.createTestMedication = (overrides = {}) => {
  return {
    name: '测试药品',
    dosage: 1,
    unit: '片',
    frequency: 3,
    breakfast: true,
    lunch: true,
    dinner: true,
    timing: '餐后',
    ...overrides
  };
};

global.createTestMedicationRecord = (overrides = {}) => {
  const today = new Date().toISOString().split('T')[0];
  return {
    medication_id: 1,
    date: today,
    meal_time: '早餐',
    taken_at: new Date().toISOString(),
    ...overrides
  };
};