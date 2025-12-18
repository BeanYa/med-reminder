const MedicationService = require('../../src/services/MedicationService');
const Medication = require('../../src/models/Medication');
const MedicationRecord = require('../../src/models/MedicationRecord');

jest.mock('../../src/models/Medication');
jest.mock('../../src/models/MedicationRecord');

describe('MedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addMedication', () => {
    test('should add medication with valid data', async () => {
      const medication = createTestMedication();
      Medication.validate.mockReturnValue({ isValid: true });
      Medication.create.mockResolvedValue({ id: 1, ...medication });

      const result = await MedicationService.addMedication(medication);

      expect(Medication.validate).toHaveBeenCalledWith(medication);
      expect(Medication.create).toHaveBeenCalledWith({
        ...medication,
        breakfast: true,
        lunch: true,
        dinner: true
      });
      expect(result).toEqual({ id: 1, ...medication });
    });

    test('should reject invalid medication', async () => {
      const medication = createTestMedication({ name: '' });
      Medication.validate.mockReturnValue({
        isValid: false,
        errors: ['名称不能为空']
      });

      await expect(MedicationService.addMedication(medication))
        .rejects.toThrow('名称不能为空');
    });

    test('should auto-set meal times for frequency 3', async () => {
      const medication = createTestMedication({
        frequency: 3,
        breakfast: false,
        lunch: false,
        dinner: false
      });
      Medication.validate.mockReturnValue({ isValid: true });
      Medication.create.mockResolvedValue({ id: 1, ...medication });

      await MedicationService.addMedication(medication);

      expect(Medication.create).toHaveBeenCalledWith({
        ...medication,
        breakfast: true,
        lunch: true,
        dinner: true
      });
    });
  });

  describe('getMedicationById', () => {
    test('should return medication when found', async () => {
      const medication = { id: 1, name: '测试药品' };
      Medication.findById.mockResolvedValue(medication);

      const result = await MedicationService.getMedicationById(1);

      expect(Medication.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(medication);
    });

    test('should throw error when not found', async () => {
      Medication.findById.mockResolvedValue(null);

      await expect(MedicationService.getMedicationById(1))
        .rejects.toThrow('药品不存在');
    });
  });

  describe('deleteMedication', () => {
    test('should delete medication', async () => {
      const medication = { id: 1, name: '测试药品' };
      Medication.findById.mockResolvedValue(medication);
      Medication.delete.mockResolvedValue({ changes: 1 });

      const result = await MedicationService.deleteMedication(1);

      expect(Medication.findById).toHaveBeenCalledWith(1);
      expect(Medication.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ changes: 1 });
    });

    test('should throw error when medication not found', async () => {
      Medication.findById.mockResolvedValue(null);

      await expect(MedicationService.deleteMedication(1))
        .rejects.toThrow('药品不存在');
    });
  });

  describe('getTodayMedicationStatus', () => {
    test('should return today status', async () => {
      const mockStatus = {
        todayProgress: { total: 5, completed: 3 },
        yesterdayUntaken: [],
        meals: {
          breakfast: [{ id: 1, taken: false }],
          lunch: [{ id: 2, taken: true }],
          dinner: []
        }
      };
      MedicationRecord.getTodayMedications.mockResolvedValue([]);
      MedicationRecord.getYesterdayUntaken.mockResolvedValue([]);
      MedicationRecord.getTodayMedicationsByMeal.mockResolvedValue({
        breakfast: [],
        lunch: [],
        dinner: []
      });

      const result = await MedicationService.getTodayMedicationStatus();

      expect(result).toHaveProperty('todayProgress');
      expect(result).toHaveProperty('yesterdayUntaken');
      expect(result).toHaveProperty('meals');
    });
  });

  describe('markMedicationTaken', () => {
    test('should toggle taken status', async () => {
      const today = new Date().toISOString().split('T')[0];
      MedicationRecord.getByDate.mockResolvedValue([
        {
          medication_id: 1,
          date: today,
          meal_time: '早餐',
          taken_at: null
        }
      ]);
      MedicationRecord.markAsTaken.mockResolvedValue({ changes: 1 });

      const result = await MedicationService.markMedicationTaken(1, '早餐');

      expect(MedicationRecord.markAsTaken).toHaveBeenCalledWith(1, today, '早餐');
      expect(result.action).toBe('taken');
    });
  });

  describe('refreshMedicationStatus', () => {
    test('should refresh status successfully', async () => {
      const yesterdayUntaken = [
        { medication_id: 1, missed_meal: '早餐' }
      ];
      const todayMeds = [
        { id: 1, name: '测试药品' }
      ];

      MedicationRecord.getYesterdayUntaken.mockResolvedValue(yesterdayUntaken);
      MedicationRecord.getTodayMedications.mockResolvedValue(todayMeds);
      MedicationRecord.create.mockResolvedValue({});

      const result = await MedicationService.refreshMedicationStatus();

      expect(result.yesterdayMarked).toBe(1);
      expect(result.todayRecordsCreated).toBe(1);
    });
  });
});