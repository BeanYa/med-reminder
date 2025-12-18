const Medication = require('../models/Medication');
const MedicationRecord = require('../models/MedicationRecord');

class MedicationService {
  // 添加新药品
  async addMedication(medicationData) {
    // 验证数据
    const validation = Medication.validate(medicationData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // 根据频次自动设置服用时段
    if (medicationData.frequency === 3) {
      medicationData.breakfast = true;
      medicationData.lunch = true;
      medicationData.dinner = true;
    }

    return await Medication.create(medicationData);
  }

  // 获取所有药品
  async getAllMedications() {
    return await Medication.getAll();
  }

  // 获取单个药品
  async getMedicationById(id) {
    const medication = await Medication.findById(id);
    if (!medication) {
      throw new Error('药品不存在');
    }
    return medication;
  }

  // 更新药品
  async updateMedication(id, medicationData) {
    // 验证药品是否存在
    const existing = await Medication.findById(id);
    if (!existing) {
      throw new Error('药品不存在');
    }

    // 验证数据
    const validation = Medication.validate(medicationData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // 根据频次自动设置服用时段
    if (medicationData.frequency === 3) {
      medicationData.breakfast = true;
      medicationData.lunch = true;
      medicationData.dinner = true;
    }

    return await Medication.update(id, medicationData);
  }

  // 删除药品
  async deleteMedication(id) {
    const medication = await Medication.findById(id);
    if (!medication) {
      throw new Error('药品不存在');
    }

    return await Medication.delete(id);
  }

  // 获取今天的用药情况
  async getTodayMedicationStatus() {
    const [todayMeds, yesterdayUntaken] = await Promise.all([
      MedicationRecord.getTodayMedications(),
      MedicationRecord.getYesterdayUntaken()
    ]);

    // 按时段分组
    const medsByMeal = await MedicationRecord.getTodayMedicationsByMeal();

    // 计算今日进度
    const todayProgress = {
      total: todayMeds.filter(m => {
        // 计算总的应服药次数
        let count = 0;
        if (m.breakfast) count++;
        if (m.lunch) count++;
        if (m.dinner) count++;
        return count > 0;
      }).length,
      completed: todayMeds.filter(m => {
        // 计算已完成所有时段的药品
        let totalRequired = 0;
        let totalTaken = 0;

        if (m.breakfast) {
          totalRequired++;
          if (m.taken_at && m.taken_at.includes('早餐')) totalTaken++;
        }
        if (m.lunch) {
          totalRequired++;
          if (m.taken_at && m.taken_at.includes('中餐')) totalTaken++;
        }
        if (m.dinner) {
          totalRequired++;
          if (m.taken_at && m.taken_at.includes('晚餐')) totalTaken++;
        }

        return totalRequired > 0 && totalTaken === totalRequired;
      }).length
    };

    return {
      todayProgress,
      yesterdayUntaken,
      meals: medsByMeal
    };
  }

  // 标记服用状态
  async markMedicationTaken(medicationId, mealTime) {
    const today = new Date().toISOString().split('T')[0];

    // 首先检查是否存在记录
    const existingRecords = await MedicationRecord.getByDate(today);
    const existing = existingRecords.find(r =>
      r.medication_id === medicationId && r.meal_time === mealTime
    );

    if (existing && existing.taken_at) {
      // 如果已经标记过，取消标记
      await MedicationRecord.create({
        medication_id: medicationId,
        date: today,
        meal_time: mealTime,
        taken_at: null
      });
      return { action: 'untaken' };
    } else {
      // 标记为已服用
      await MedicationRecord.markAsTaken(medicationId, today, mealTime);
      return { action: 'taken' };
    }
  }

  // 刷新用药状态（将昨天未服用的标记为已服用）
  async refreshMedicationStatus() {
    const yesterdayUntaken = await MedicationRecord.getYesterdayUntaken();
    const today = new Date().toISOString().split('T')[0];

    // 将昨天的未服用记录全部标记为已服用
    for (const record of yesterdayUntaken) {
      await MedicationRecord.create({
        medication_id: record.medication_id,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 昨天
        meal_time: record.missed_meal,
        taken_at: new Date().toISOString()
      });
    }

    // 为今天创建空记录
    const todayMeds = await MedicationRecord.getTodayMedications();
    for (const med of todayMeds) {
      if (med.breakfast) {
        await MedicationRecord.create({
          medication_id: med.id,
          date: today,
          meal_time: '早餐',
          taken_at: null
        });
      }
      if (med.lunch) {
        await MedicationRecord.create({
          medication_id: med.id,
          date: today,
          meal_time: '中餐',
          taken_at: null
        });
      }
      if (med.dinner) {
        await MedicationRecord.create({
          medication_id: med.id,
          date: today,
          meal_time: '晚餐',
          taken_at: null
        });
      }
    }

    return {
      yesterdayMarked: yesterdayUntaken.length,
      todayRecordsCreated: todayMeds.length
    };
  }
}

module.exports = new MedicationService();