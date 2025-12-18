const Medication = require('../../src/models/Medication');
const MedicationRecord = require('../../src/models/MedicationRecord');
const database = require('../../src/database/database');

describe('MedicationRecord Model', () => {
  let testMedication;

  beforeAll(async () => {
    await database.init();
    // 创建测试药品
    testMedication = await Medication.create(createTestMedication());
  });

  afterAll(async () => {
    database.close();
  });

  describe('CRUD Operations', () => {
    test('should create a new medication record', async () => {
      const record = createTestMedicationRecord({
        medication_id: testMedication.id
      });

      const result = await MedicationRecord.create(record);
      expect(result).toHaveProperty('id');
      expect(result.medication_id).toBe(testMedication.id);
      expect(result.date).toBe(record.date);
      expect(result.meal_time).toBe(record.meal_time);
    });

    test('should replace existing record', async () => {
      const record = createTestMedicationRecord({
        medication_id: testMedication.id,
        meal_time: '午餐'
      });

      // 第一次创建
      const result1 = await MedicationRecord.create(record);
      expect(result1.taken_at).toBeNull();

      // 第二次创建（替换）
      const record2 = { ...record, taken_at: new Date().toISOString() };
      const result2 = await MedicationRecord.create(record2);
      expect(result2.id).toBe(result1.id);
      expect(result2.taken_at).toBeTruthy();
    });

    test('should get records by date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const record = createTestMedicationRecord({
        medication_id: testMedication.id,
        date: today
      });

      await MedicationRecord.create(record);

      const records = await MedicationRecord.getByDate(today);
      expect(records).toHaveLength(1);
      expect(records[0].medication_id).toBe(testMedication.id);
    });

    test('should get today medications', async () => {
      const medications = await MedicationRecord.getTodayMedications();
      expect(Array.isArray(medications)).toBe(true);
    });

    test('should get today medications by meal', async () => {
      const medsByMeal = await MedicationRecord.getTodayMedicationsByMeal();
      expect(medsByMeal).toHaveProperty('breakfast');
      expect(medsByMeal).toHaveProperty('lunch');
      expect(medsByMeal).toHaveProperty('dinner');
    });

    test('should mark medication as taken', async () => {
      const today = new Date().toISOString().split('T')[0];
      const record = createTestMedicationRecord({
        medication_id: testMedication.id,
        date: today,
        taken_at: null
      });

      await MedicationRecord.create(record);

      const result = await MedicationRecord.markAsTaken(
        testMedication.id,
        today,
        '早餐'
      );

      expect(result.changes).toBe(1);
    });

    test('should get yesterday untaken medications', async () => {
      const untaken = await MedicationRecord.getYesterdayUntaken();
      expect(Array.isArray(untaken)).toBe(true);
    });

    test('should get seven day statistics', async () => {
      const stats = await MedicationRecord.getSevenDayStats();
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('Business Logic', () => {
    test('should correctly format medication info with dosage', async () => {
      const record = await MedicationRecord.create({
        medication_id: testMedication.id,
        date: new Date().toISOString().split('T')[0],
        meal_time: '早餐'
      });

      const records = await MedicationRecord.getByDate(record.date);
      expect(records[0]).toHaveProperty('name');
      expect(records[0]).toHaveProperty('dosage');
      expect(records[0]).toHaveProperty('unit');
    });

    test('should handle multiple medications for same day', async () => {
      const testMed2 = await Medication.create(
        createTestMedication({ name: '测试药品2' })
      );

      const today = new Date().toISOString().split('T')[0];

      await MedicationRecord.create({
        medication_id: testMedication.id,
        date: today,
        meal_time: '早餐'
      });

      await MedicationRecord.create({
        medication_id: testMed2.id,
        date: today,
        meal_time: '早餐'
      });

      const records = await MedicationRecord.getByDate(today);
      expect(records).toHaveLength(2);
    });
  });
});