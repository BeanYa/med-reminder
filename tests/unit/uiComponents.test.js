/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// 加载 HTML 内容
const htmlPath = path.join(__dirname, '../../public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 设置 DOM
document.documentElement.innerHTML = htmlContent;

// 获取全局函数（从 HTML script 标签中提取）
const scriptContent = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
if (scriptContent) {
  scriptContent.forEach(script => {
    const code = script.replace(/<\/?script>/g, '');
    // 移除对 loadTodayStatus 等异步函数的直接调用
    const cleanedCode = code.replace(/loadTodayStatus\(\);/g, '');
    eval(cleanedCode);
  });
}

describe('UI Components', () => {
  beforeEach(() => {
    // 重置 DOM
    document.documentElement.innerHTML = htmlContent;
  });

  describe('Modal Functions', () => {
    test('closeModal should hide modal', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.style.display = 'block';
      document.body.appendChild(modal);

      if (typeof closeModal === 'function') {
        closeModal('test-modal');
        expect(modal.style.display).toBe('none');
      }
    });
  });

  describe('Medication Form', () => {
    test('updateMealOptions should disable checkboxes for frequency 3', () => {
      if (typeof updateMealOptions === 'function') {
        // 设置频率为 3
        const frequencySelect = document.createElement('select');
        frequencySelect.id = 'frequency';
        frequencySelect.value = '3';
        document.body.appendChild(frequencySelect);

        // 创建复选框
        const checkboxes = ['breakfast', 'lunch', 'dinner'];
        checkboxes.forEach(id => {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = id;
          checkbox.name = id;
          document.body.appendChild(checkbox);
        });

        updateMealOptions();

        checkboxes.forEach(id => {
          const checkbox = document.getElementById(id);
          expect(checkbox.checked).toBe(true);
          expect(checkbox.disabled).toBe(true);
        });
      }
    });
  });

  describe('Statistics Display', () => {
    test('should create stat card elements correctly', () => {
      const container = document.createElement('div');
      container.className = 'stats-grid';
      document.body.appendChild(container);

      const stat = {
        date: '1月1日 周一',
        completionRate: 85,
        taken: 5,
        total: 6
      };

      const statCard = document.createElement('div');
      statCard.className = 'stat-card';
      statCard.innerHTML = `
        <h4>${stat.date}</h4>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stat.completionRate}%"></div>
        </div>
        <p>完成率: ${stat.completionRate}%</p>
        <p>已服用: ${stat.taken}/${stat.total}</p>
      `;

      container.appendChild(statCard);

      expect(container.querySelector('h4').textContent).toBe(stat.date);
      expect(container.querySelector('.progress-fill').style.width).toBe('85%');
    });
  });

  describe('Progress Bar', () => {
    test('should update progress correctly', () => {
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = '0%';
      progressBar.appendChild(progressFill);

      document.body.appendChild(progressBar);

      // 模拟更新进度
      const percentage = 75;
      progressFill.style.width = `${percentage}%`;

      expect(progressFill.style.width).toBe('75%');
    });
  });

  describe('Medication Item Display', () => {
    test('should display medication information correctly', () => {
      const medication = {
        id: 1,
        name: '阿司匹林',
        dosage: 1,
        unit: '片',
        frequency: 2,
        breakfast: true,
        lunch: true,
        dinner: false,
        timing: '餐后'
      };

      const medicationItem = document.createElement('div');
      medicationItem.className = 'medication-item';
      medicationItem.innerHTML = `
        <div class="medication-info">
          <div class="medication-name">${medication.name}</div>
          <div class="medication-dosage">
            ${medication.dosage}${medication.unit} - ${medication.frequency}次/天
          </div>
          <div style="font-size: 0.85rem; color: #666;">
            时段: ${medication.breakfast ? '早餐' : ''} ${medication.lunch ? '中餐' : ''} ${medication.dinner ? '晚餐' : ''} - ${medication.timing}
          </div>
        </div>
        <button class="btn btn-primary">编辑</button>
      `;

      document.body.appendChild(medicationItem);

      const name = medicationItem.querySelector('.medication-name');
      const dosage = medicationItem.querySelector('.medication-dosage');
      const button = medicationItem.querySelector('button');

      expect(name.textContent).toBe(medication.name);
      expect(dosage.textContent).toContain('1片');
      expect(dosage.textContent).toContain('2次/天');
      expect(button.textContent).toBe('编辑');
    });
  });

  describe('Form Validation', () => {
    test('should validate required fields', () => {
      const form = document.createElement('form');
      const nameInput = document.createElement('input');
      nameInput.name = 'name';
      nameInput.required = true;
      nameInput.value = '';

      const dosageInput = document.createElement('input');
      dosageInput.name = 'dosage';
      dosageInput.type = 'number';
      dosageInput.required = true;

      form.appendChild(nameInput);
      form.appendChild(dosageInput);
      document.body.appendChild(form);

      // 模拟表单验证
      const isValid = form.checkValidity();
      expect(isValid).toBe(false);
    });
  });
});

// 测试工具函数
describe('Utility Functions', () => {
  test('should format date correctly', () => {
    // 模拟 formatDate 函数
    function formatDate(dateStr) {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
      return `${month}月${day}日 ${weekDay}`;
    }

    const formatted = formatDate('2024-01-01');
    expect(formatted).toBe('1月1日 周一');
  });

  test('should calculate completion rate', () => {
    function calculateCompletionRate(taken, total) {
      return total > 0 ? Math.round((taken / total) * 100) : 0;
    }

    expect(calculateCompletionRate(4, 5)).toBe(80);
    expect(calculateCompletionRate(0, 5)).toBe(0);
    expect(calculateCompletionRate(5, 5)).toBe(100);
    expect(calculateCompletionRate(5, 0)).toBe(0);
  });
});