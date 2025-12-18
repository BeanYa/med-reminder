const Medication = require('../../src/models/Medication');
const MedicationRecord = require('../../src/models/MedicationRecord');
const MedicationService = require('../../src/services/MedicationService');
const database = require('../../src/database/database');

describe('Database Performance Tests', () => {
  let largeDataset;

  beforeAll(async () => {
    await database.init();
  });

  afterAll(async () => {
    database.close();
  });

  beforeEach(async () => {
    // Clean up test data
    const db = database.getDB();
    await new Promise(resolve => {
      db.run('DELETE FROM medication_records', resolve);
    });
    await new Promise(resolve => {
      db.run('DELETE FROM medications', resolve);
    });
  });

  describe('Large Dataset Operations', () => {
    test('should handle 1000 medications efficiently', async () => {
      const medications = [];
      for (let i = 0; i < 1000; i++) {
        medications.push({
          name: `性能测试药品${i}`,
          dosage: Math.floor(Math.random() * 5) + 1,
          unit: ['片', '颗', '克', '毫克'][Math.floor(Math.random() * 4)],
          frequency: Math.floor(Math.random() * 3) + 1,
          breakfast: Math.random() > 0.5,
          lunch: Math.random() > 0.5,
          dinner: Math.random() > 0.5,
          timing: Math.random() > 0.5 ? '餐前' : '餐后'
        });
      }

      // Test batch insertion
      const startTime = Date.now();
      for (const med of medications) {
        await Medication.create(med);
      }
      const insertTime = Date.now() - startTime;

      console.log(`Inserted 1000 medications in ${insertTime}ms`);
      expect(insertTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Test retrieval
      const retrieveStartTime = Date.now();
      const allMeds = await Medication.getAll();
      const retrieveTime = Date.now() - retrieveStartTime;

      console.log(`Retrieved 1000 medications in ${retrieveTime}ms`);
      expect(retrieveTime).toBeLessThan(1000); // Should complete within 1 second
      expect(allMeds).toHaveLength(1000);
    });

    test('should handle 10000 medication records efficiently', async () => {
      // Create a medication first
      const medication = await Medication.create({
        name: '性能测试药品',
        dosage: 1,
        unit: '片',
        frequency: 3,
        breakfast: true,
        lunch: true,
        dinner: true,
        timing: '餐后'
      });

      // Create 10000 records over 100 days
      const records = [];
      const today = new Date();
      for (let day = 0; day < 100; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];

        records.push({
          medication_id: medication.id,
          date: dateStr,
          meal_time: '早餐',
          taken_at: Math.random() > 0.2 ? new Date().toISOString() : null
        });

        records.push({
          medication_id: medication.id,
          date: dateStr,
          meal_time: '中餐',
          taken_at: Math.random() > 0.2 ? new Date().toISOString() : null
        });

        records.push({
          medication_id: medication.id,
          date: dateStr,
          meal_time: '晚餐',
          taken_at: Math.random() > 0.2 ? new Date().toISOString() : null
        });
      }

      // Test batch insertion
      const startTime = Date.now();
      for (const record of records) {
        await MedicationRecord.create(record);
      }
      const insertTime = Date.now() - startTime;

      console.log(`Inserted 10000 records in ${insertTime}ms`);
      expect(insertTime).toBeLessThan(30000); // Should complete within 30 seconds

      // Test statistics calculation
      const statsStartTime = Date.now();
      const stats = await MedicationRecord.getSevenDayStats();
      const statsTime = Date.now() - statsStartTime;

      console.log(`Calculated 7-day stats in ${statsTime}ms`);
      expect(statsTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent medication creation', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          Medication.create({
            name: `并发测试药品${i}`,
            dosage: 1,
            unit: '片',
            frequency: 1,
            breakfast: true,
            lunch: false,
            dinner: false,
            timing: '餐后'
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const time = Date.now() - startTime;

      console.log(`Created 100 medications concurrently in ${time}ms`);
      expect(results).toHaveLength(100);
      expect(time).toBeLessThan(5000);
    });

    test('should handle concurrent status updates', async () => {
      // Create a medication
      const medication = await Medication.create({
        name: '并发测试药品',
        dosage: 1,
        unit: '片',
        frequency: 3,
        breakfast: true,
        lunch: true,
        dinner: true,
        timing: '餐后'
      });

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          MedicationService.markMedicationTaken(medication.id, '早餐')
        );
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const time = Date.now() - startTime;

      console.log(`Performed 50 concurrent updates in ${time}ms`);
      expect(time).toBeLessThan(2000);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const med = await Medication.create({
          name: `内存测试药品${i}`,
          dosage: 1,
          unit: '片',
          frequency: 1,
          breakfast: true,
          lunch: false,
          dinner: false,
          timing: '餐后'
        });

        await Medication.findById(med.id);
        await Medication.getAll();

        await Medication.delete(med.id);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory increase: ${memoryIncrease / 1024 / 1024} MB`);
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Query Optimization', () => {
    test('should use indexes effectively', async () => {
      // Create medications with records
      const medications = [];
      for (let i = 0; i < 100; i++) {
        const med = await Medication.create({
          name: `索引测试药品${i}`,
          dosage: 1,
          unit: '片',
          frequency: 3,
          breakfast: true,
          lunch: true,
          dinner: true,
          timing: '餐后'
        });
        medications.push(med);
      }

      // Create records
      const today = new Date().toISOString().split('T')[0];
      for (const med of medications) {
        await MedicationRecord.create({
          medication_id: med.id,
          date: today,
          meal_time: '早餐',
          taken_at: new Date().toISOString()
        });
      }

      // Test query performance with date filter
      const startTime = Date.now();
      const records = await MedicationRecord.getByDate(today);
      const queryTime = Date.now() - startTime;

      console.log(`Queried records by date in ${queryTime}ms`);
      expect(queryTime).toBeLessThan(500);
      expect(records).toHaveLength(100);
    });
  });
});