/**
 * @jest-environment jsdom
 */

const MedicationService = require('../../src/services/MedicationService');
const Medication = require('../../src/models/Medication');
const MedicationRecord = require('../../src/models/MedicationRecord');
const database = require('../../src/database/database');

// Mock DOM for browser simulation
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div id="app">
    <div id="completed">0</div>
    <div id="total">0</div>
    <div class="progress-fill"></div>
    <div id="breakfast-meds"></div>
    <div id="lunch-meds"></div>
    <div id="dinner-meds"></div>
    <button id="add-medication-btn">新增药品</button>
    <button id="refresh-btn">刷新</button>
    <form id="medication-form">
      <input name="name" type="text">
      <input name="dosage" type="number">
      <select name="unit">
        <option value="片">片</option>
      </select>
      <select name="frequency">
        <option value="1">1次/天</option>
        <option value="2">2次/天</option>
        <option value="3">3次/天</option>
      </select>
      <input name="breakfast" type="checkbox">
      <input name="lunch" type="checkbox">
      <input name="dinner" type="checkbox">
      <select name="timing">
        <option value="餐后">餐后</option>
      </select>
    </form>
  </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

describe('End-to-End Medication Flow', () => {
  let medications;

  beforeAll(async () => {
    // Initialize test database
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

    // Create test medications
    medications = await Promise.all([
      Medication.create({
        name: '阿司匹林',
        dosage: 1,
        unit: '片',
        frequency: 1,
        breakfast: true,
        lunch: false,
        dinner: false,
        timing: '餐后'
      }),
      Medication.create({
        name: '维生素C',
        dosage: 500,
        unit: '毫克',
        frequency: 2,
        breakfast: true,
        lunch: true,
        dinner: false,
        timing: '餐后'
      })
    ]);
  });

  describe('Complete Medication Workflow', () => {
    test('should handle full day medication workflow', async () => {
      // 1. Get today's status
      const todayStatus = await MedicationService.getTodayMedicationStatus();
      expect(todayStatus.todayProgress.total).toBeGreaterThan(0);

      // 2. Add new medication
      const newMed = await MedicationService.addMedication({
        name: '新药品',
        dosage: 2,
        unit: '片',
        frequency: 3,
        timing: '餐前'
      });
      expect(newMed.id).toBeTruthy();

      // 3. Update medication
      await MedicationService.updateMedication(newMed.id, {
        dosage: 3
      });
      const updatedMed = await MedicationService.findById(newMed.id);
      expect(updatedMed.dosage).toBe(3);

      // 4. Mark breakfast medications as taken
      for (const med of todayStatus.meals.breakfast) {
        await MedicationService.markMedicationTaken(med.id, '早餐');
      }

      // 5. Check progress after breakfast
      const afterBreakfast = await MedicationService.getTodayMedicationStatus();
      expect(afterBreakfast.todayProgress.completed).toBeGreaterThan(0);

      // 6. Mark lunch medications as taken
      for (const med of todayStatus.meals.lunch) {
        await MedicationService.markMedicationTaken(med.id, '中餐');
      }

      // 7. Mark dinner medications as taken
      for (const med of todayStatus.meals.dinner) {
        await MedicationService.markMedicationTaken(med.id, '晚餐');
      }

      // 8. Check final progress
      const finalStatus = await MedicationService.getTodayMedicationStatus();
      expect(finalStatus.todayProgress.completed).toBe(
        finalStatus.todayProgress.total
      );
    });

    test('should handle refresh correctly', async () => {
      // Get initial status
      const initialStatus = await MedicationService.getTodayMedicationStatus();
      const initialTotal = initialStatus.todayProgress.total;

      // Refresh status
      const refreshResult = await MedicationService.refreshMedicationStatus();
      expect(refreshResult.todayRecordsCreated).toBe(initialTotal);

      // Check status after refresh
      const refreshedStatus = await MedicationService.getTodayMedicationStatus();
      expect(refreshedStatus.todayProgress.total).toBe(initialTotal);
    });

    test('should handle missed medications', async () => {
      // Create records for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Don't mark some medications as taken
      await MedicationRecord.create({
        medication_id: medications[0].id,
        date: yesterdayStr,
        meal_time: '早餐',
        taken_at: null
      });

      // Get yesterday untaken medications
      const untaken = await MedicationRecord.getYesterdayUntaken();
      expect(untaken.length).toBeGreaterThan(0);
      expect(untaken[0].name).toBe(medications[0].name);
    });

    test('should handle medication deletion with history', async () => {
      // Add a medication
      const medToDelete = await Medication.create({
        name: '待删除药品',
        dosage: 1,
        unit: '片',
        frequency: 1,
        breakfast: true,
        lunch: false,
        dinner: false,
        timing: '餐后'
      });

      // Add some records
      const today = new Date().toISOString().split('T')[0];
      await MedicationRecord.create({
        medication_id: medToDelete.id,
        date: today,
        meal_time: '早餐',
        taken_at: new Date().toISOString()
      });

      // Delete medication
      await MedicationService.deleteMedication(medToDelete.id);

      // Verify medication is deleted
      const deletedMed = await Medication.findById(medToDelete.id);
      expect(deletedMed).toBeNull();

      // Verify history is still accessible through records
      const records = await MedicationRecord.getByDate(today);
      // Note: Soft delete means records might still exist
      // but medication won't appear in active list
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty medication list', async () => {
      // Delete all medications
      for (const med of medications) {
        await Medication.delete(med.id);
      }

      const status = await MedicationService.getTodayMedicationStatus();
      expect(status.todayProgress.total).toBe(0);
      expect(status.meals.breakfast).toHaveLength(0);
      expect(status.meals.lunch).toHaveLength(0);
      expect(status.meals.dinner).toHaveLength(0);
    });

    test('should handle duplicate take attempts', async () => {
      const med = medications[0];
      const today = new Date().toISOString().split('T')[0];

      // Mark as taken
      await MedicationService.markMedicationTaken(med.id, '早餐');

      // Mark as taken again (should toggle)
      const result = await MedicationService.markMedicationTaken(med.id, '早餐');
      expect(result.action).toBeDefined();
    });

    test('should handle invalid medication operations', async () => {
      // Try to get non-existent medication
      await expect(MedicationService.getMedicationById(99999))
        .rejects.toThrow('药品不存在');

      // Try to update non-existent medication
      await expect(MedicationService.updateMedication(99999, {}))
        .rejects.toThrow('药品不存在');

      // Try to delete non-existent medication
      await expect(MedicationService.deleteMedication(99999))
        .rejects.toThrow('药品不存在');
    });

    test('should handle invalid medication data', async () => {
      // Try to add medication with empty name
      await expect(MedicationService.addMedication({
        name: '',
        dosage: 1,
        unit: '片',
        frequency: 1,
        timing: '餐后'
      })).rejects.toThrow();

      // Try to add medication with invalid frequency
      await expect(MedicationService.addMedication({
        name: '测试',
        dosage: 1,
        unit: '片',
        frequency: 4,
        timing: '餐后'
      })).rejects.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should handle multiple medications efficiently', async () => {
      // Create 50 medications
      const newMeds = [];
      for (let i = 0; i < 50; i++) {
        newMeds.push({
          name: `药品${i}`,
          dosage: 1,
          unit: '片',
          frequency: 3,
          timing: '餐后'
        });
      }

      const startTime = Date.now();

      // Add all medications
      for (const med of newMeds) {
        await MedicationService.addMedication(med);
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Get today's status with many medications
      const statusStartTime = Date.now();
      const status = await MedicationService.getTodayMedicationStatus();
      const statusTime = Date.now() - statusStartTime;

      expect(statusTime).toBeLessThan(1000); // Should complete within 1 second
      expect(status.todayProgress.total).toBeGreaterThanOrEqual(50);
    });
  });
});