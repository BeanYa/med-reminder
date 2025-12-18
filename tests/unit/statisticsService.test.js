const StatisticsService = require('../../src/services/StatisticsService');
const MedicationRecord = require('../../src/models/MedicationRecord');

jest.mock('../../src/models/MedicationRecord');

describe('StatisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSevenDayStatistics', () => {
    test('should return success with data', async () => {
      const mockStats = [
        {
          date: '2024-01-01',
          total: 5,
          taken: 4,
          completion_rate: 80
        }
      ];
      MedicationRecord.getSevenDayStats.mockResolvedValue(mockStats);

      const result = await StatisticsService.getSevenDayStatistics();

      expect(MedicationRecord.getSevenDayStats).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('date');
    });

    test('should handle error', async () => {
      MedicationRecord.getSevenDayStats.mockRejectedValue(
        new Error('Database error')
      );

      const result = await StatisticsService.getSevenDayStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getDayStatistics', () => {
    test('should calculate statistics correctly', async () => {
      const mockRecords = [
        {
          medication_id: 1,
          meal_time: '早餐',
          taken_at: '2024-01-01 08:00:00'
        },
        {
          medication_id: 2,
          meal_time: '中餐',
          taken_at: null
        },
        {
          medication_id: 1,
          meal_time: '晚餐',
          taken_at: '2024-01-01 18:00:00'
        }
      ];
      MedicationRecord.getByDate.mockResolvedValue(mockRecords);

      const result = await StatisticsService.getDayStatistics('2024-01-01');

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(3);
      expect(result.data.taken).toBe(2);
      expect(result.data.missed).toBe(1);
      expect(result.data.completionRate).toBe(67);
    });

    test('should handle empty records', async () => {
      MedicationRecord.getByDate.mockResolvedValue([]);

      const result = await StatisticsService.getDayStatistics('2024-01-01');

      expect(result.data.total).toBe(0);
      expect(result.data.completionRate).toBe(0);
    });
  });

  describe('getMealStatistics', () => {
    test('should calculate meal statistics', () => {
      const records = [
        { meal_time: '早餐', taken_at: '2024-01-01 08:00:00' },
        { meal_time: '早餐', taken_at: '2024-01-01 08:30:00' },
        { meal_time: '中餐', taken_at: null }
      ];

      const stats = StatisticsService.getMealStatistics(records, '早餐');
      expect(stats.total).toBe(2);
      expect(stats.taken).toBe(2);
      expect(stats.missed).toBe(0);
      expect(stats.completionRate).toBe(100);
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const dateStr = '2024-01-01';
      const formatted = StatisticsService.formatDate(dateStr);
      expect(formatted).toMatch(/\d+月\d+日 周[一二三四五六日]/);
    });
  });

  describe('generateReport', () => {
    test('should generate report for date range', async () => {
      jest.spyOn(StatisticsService, 'getStatisticsInRange')
        .mockResolvedValue([
          { completionRate: 80 },
          { completionRate: 90 }
        ]);
      jest.spyOn(StatisticsService, 'analyzeTrends')
        .mockReturnValue({ trend: 'improving' });

      const result = await StatisticsService.generateReport(
        '2024-01-01',
        '2024-01-07'
      );

      expect(result.success).toBe(true);
      expect(result.data.period).toBeDefined();
      expect(result.data.summary).toBeDefined();
    });
  });

  describe('calculateAverage', () => {
    test('should calculate average correctly', () => {
      const numbers = [80, 90, 70];
      const avg = StatisticsService.calculateAverage(numbers);
      expect(avg).toBe(80);
    });

    test('should handle empty array', () => {
      const avg = StatisticsService.calculateAverage([]);
      expect(avg).toBe(0);
    });

    test('should filter out NaN values', () => {
      const numbers = [80, NaN, 70];
      const avg = StatisticsService.calculateAverage(numbers);
      expect(avg).toBe(75);
    });
  });

  describe('analyzeTrends', () => {
    test('should detect improving trend', () => {
      const stats = [
        { completionRate: 70 },
        { completionRate: 75 },
        { completionRate: 80 },
        { completionRate: 85 },
        { completionRate: 90 },
        { completionRate: 85 },
        { completionRate: 90 }
      ];

      const trends = StatisticsService.analyzeTrends(stats);
      expect(trends.trend).toBe('improving');
    });

    test('should detect declining trend', () => {
      const stats = [
        { completionRate: 90 },
        { completionRate: 85 },
        { completionRate: 80 },
        { completionRate: 75 },
        { completionRate: 70 },
        { completionRate: 75 },
        { completionRate: 70 }
      ];

      const trends = StatisticsService.analyzeTrends(stats);
      expect(trends.trend).toBe('declining');
    });

    test('should detect stable trend', () => {
      const stats = [
        { completionRate: 80 },
        { completionRate: 85 },
        { completionRate: 80 },
        { completionRate: 75 },
        { completionRate: 80 },
        { completionRate: 85 },
        { completionRate: 80 }
      ];

      const trends = StatisticsService.analyzeTrends(stats);
      expect(trends.trend).toBe('stable');
    });
  });
});