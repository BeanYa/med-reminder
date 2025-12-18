const express = require('express');
const MedicationService = require('../services/MedicationService');

const router = express.Router();

// 获取所有药品
router.get('/', async (req, res) => {
  try {
    const medications = await MedicationService.getAllMedications();
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加新药品
router.post('/', async (req, res) => {
  try {
    const medication = await MedicationService.addMedication(req.body);
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取单个药品
router.get('/:id', async (req, res) => {
  try {
    const medication = await MedicationService.getMedicationById(req.params.id);
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// 更新药品
router.put('/:id', async (req, res) => {
  try {
    await MedicationService.updateMedication(req.params.id, req.body);
    res.json({ success: true, message: '药品更新成功' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 删除药品
router.delete('/:id', async (req, res) => {
  try {
    await MedicationService.deleteMedication(req.params.id);
    res.json({ success: true, message: '药品删除成功' });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// 获取今天的用药情况
router.get('/status/today', async (req, res) => {
  try {
    const status = await MedicationService.getTodayMedicationStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 标记服用状态
router.post('/:id/take', async (req, res) => {
  try {
    const { mealTime } = req.body;
    const result = await MedicationService.markMedicationTaken(req.params.id, mealTime);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 刷新用药状态
router.post('/refresh', async (req, res) => {
  try {
    const result = await MedicationService.refreshMedicationStatus();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;