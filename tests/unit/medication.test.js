const Medication = require('../../src/models/Medication');
const database = require('../../src/database/database');

describe('Medication Model', () => {
  beforeAll(async () => {
    // 初始化测试数据库
    await database.init();
  });

  afterAll(async () => {
    database.close();
  });

  describe('validate', () => {
    test('should validate valid medication data', () => {
      const medication = createTestMedication();
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty name', () => {
      const medication = createTestMedication({ name: '' });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('药品名称不能为空');
    });

    test('should reject negative dosage', () => {
      const medication = createTestMedication({ dosage: -1 });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('剂量必须是正数');
    });

    test('should reject invalid unit', () => {
      const medication = createTestMedication({ unit: '无效单位' });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('单位必须是：片、颗、克、毫克之一');
    });

    test('should reject invalid frequency', () => {
      const medication = createTestMedication({ frequency: 4 });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('频次必须是：1、2、3次/天之一');
    });

    test('should enforce frequency 1 with 1 meal time', () => {
      const medication = createTestMedication({
        frequency: 1,
        breakfast: true,
        lunch: true
      });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('1次/天只能选择一个服用时段');
    });

    test('should enforce frequency 2 with 2 meal times', () => {
      const medication = createTestMedication({
        frequency: 2,
        breakfast: true
      });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('2次/天只能选择两个服用时段');
    });

    test('should enforce frequency 3 with all meal times', () => {
      const medication = createTestMedication({
        frequency: 3,
        breakfast: true,
        lunch: true,
        dinner: false
      });
      const result = Medication.validate(medication);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('3次/天必须选择所有三个服用时段');
    });
  });

  describe('CRUD Operations', () => {
    test('should create a new medication', async () => {
      const medication = createTestMedication();
      const result = await Medication.create(medication);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(medication.name);
      expect(result.dosage).toBe(medication.dosage);
    });

    test('should find medication by id', async () => {
      const medication = createTestMedication();
      const created = await Medication.create(medication);

      const found = await Medication.findById(created.id);
      expect(found).toBeTruthy();
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(medication.name);
    });

    test('return null for non-existent medication', async () => {
      const found = await Medication.findById(99999);
      expect(found).toBeNull();
    });

    test('should get all medications', async () => {
      const medications = [
        createTestMedication({ name: '药品A' }),
        createTestMedication({ name: '药品B' })
      ];

      await Medication.create(medications[0]);
      await Medication.create(medications[1]);

      const all = await Medication.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].name).toBe('药品B'); // 最新的在前
      expect(all[1].name).toBe('药品A');
    });

    test('should update medication', async () => {
      const medication = createTestMedication({ dosage: 1 });
      const created = await Medication.create(medication);

      const updateData = { dosage: 2 };
      await Medication.update(created.id, updateData);

      const updated = await Medication.findById(created.id);
      expect(updated.dosage).toBe(2);
    });

    test('should soft delete medication', async () => {
      const medication = createTestMedication();
      const created = await Medication.create(medication);

      await Medication.delete(created.id);

      const found = await Medication.findById(created.id);
      expect(found).toBeNull();

      const all = await Medication.getAll();
      expect(all).toHaveLength(0);
    });
  });
});