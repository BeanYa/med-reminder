const request = require('supertest');
const express = require('express');
const MedicationService = require('../../src/services/MedicationService');
const medicationRoutes = require('../../src/api/medicationRoutes');

// Mock service
jest.mock('../../src/services/MedicationService');

describe('Medication API Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/medications', medicationRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/medications', () => {
    test('should return all medications', async () => {
      const mockMedications = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];
      MedicationService.getAllMedications.mockResolvedValue(mockMedications);

      const response = await request(app)
        .get('/api/medications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMedications);
    });

    test('should handle errors', async () => {
      MedicationService.getAllMedications.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/medications')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/medications', () => {
    test('should create new medication', async () => {
      const medicationData = {
        name: '新药品',
        dosage: 1,
        unit: '片',
        frequency: 3
      };

      MedicationService.addMedication.mockResolvedValue({ id: 1, ...medicationData });

      const response = await request(app)
        .post('/api/medications')
        .send(medicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(MedicationService.addMedication).toHaveBeenCalledWith(medicationData);
    });

    test('should return 400 for invalid data', async () => {
      MedicationService.addMedication.mockRejectedValue(
        new Error('Invalid data')
      );

      const response = await request(app)
        .post('/api/medications')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/medications/:id', () => {
    test('should return medication by id', async () => {
      const medication = { id: 1, name: '测试药品' };
      MedicationService.getMedicationById.mockResolvedValue(medication);

      const response = await request(app)
        .get('/api/medications/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(medication);
    });

    test('should return 404 for non-existent medication', async () => {
      MedicationService.getMedicationById.mockRejectedValue(
        new Error('药品不存在')
      );

      const response = await request(app)
        .get('/api/medications/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/medications/:id', () => {
    test('should update medication', async () => {
      const updateData = { name: '更新后的药品' };

      MedicationService.updateMedication.mockResolvedValue();

      const response = await request(app)
        .put('/api/medications/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(MedicationService.updateMedication).toHaveBeenCalledWith(1, updateData);
    });

    test('should return 400 for invalid update', async () => {
      MedicationService.updateMedication.mockRejectedValue(
        new Error('Invalid update')
      );

      const response = await request(app)
        .put('/api/medications/1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/medications/:id', () => {
    test('should delete medication', async () => {
      MedicationService.deleteMedication.mockResolvedValue();

      const response = await request(app)
        .delete('/api/medications/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(MedicationService.deleteMedication).toHaveBeenCalledWith(1);
    });

    test('should return 404 for non-existent medication', async () => {
      MedicationService.deleteMedication.mockRejectedValue(
        new Error('药品不存在')
      );

      const response = await request(app)
        .delete('/api/medications/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/medications/status/today', () => {
    test('should return today medication status', async () => {
      const mockStatus = {
        todayProgress: { total: 5, completed: 3 },
        yesterdayUntaken: [],
        meals: {
          breakfast: [],
          lunch: [],
          dinner: []
        }
      };
      MedicationService.getTodayMedicationStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/medications/status/today')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatus);
    });
  });

  describe('POST /api/medications/:id/take', () => {
    test('should mark medication as taken', async () => {
      const result = { action: 'taken' };
      MedicationService.markMedicationTaken.mockResolvedValue(result);

      const response = await request(app)
        .post('/api/medications/1/take')
        .send({ mealTime: '早餐' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(result);
    });

    test('should handle invalid request', async () => {
      MedicationService.markMedicationTaken.mockRejectedValue(
        new Error('Invalid request')
      );

      const response = await request(app)
        .post('/api/medications/1/take')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/medications/refresh', () => {
    test('should refresh medication status', async () => {
      const result = {
        yesterdayMarked: 2,
        todayRecordsCreated: 5
      };
      MedicationService.refreshMedicationStatus.mockResolvedValue(result);

      const response = await request(app)
        .post('/api/medications/refresh')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(result);
    });
  });
});