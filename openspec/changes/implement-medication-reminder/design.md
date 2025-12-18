## Context
用药提醒应用是一个健康管理工具，需要确保数据的准确性和提醒的及时性。用户群体主要是需要长期服药的慢性病患者和他们的照护者。

## Goals / Non-Goals
- Goals:
  - 简单易用的药品管理界面
  - 准确的用药提醒功能
  - 可靠的数据存储
  - 直观的用药统计展示
- Non-Goals:
  - 医生处方扫描（初始版本）
  - 多设备同步（初始版本）
  - 药物相互作用检查（后续版本）

## Decisions
- Decision: 使用 SQLite 作为本地数据库
  - 原因：轻量级、无需服务器、支持事务
  - 替代方案：JSON文件（考虑但数据一致性较弱）

- Decision: 使用系统通知服务
  - 原因：跨平台支持、用户体验好
  - 替代方案：应用内提醒（用户可能看不到）

- Decision: 响应式UI设计
  - 原因：适配不同屏幕尺寸的设备
  - 技术选择：Web技术栈便于跨平台

## Risks / Trade-offs
- 风险：通知权限可能被用户拒绝 → 缓解：引导用户开启权限
- 风险：时区变化影响提醒时间 → 缓解：使用本地时间并提醒用户确认
- 权衡：功能简洁 vs 功能完整 → 选择简洁，优先核心功能

## Data Model
```sql
Medications:
- id (主键)
- name (药品名称)
- dosage (剂量数值)
- unit (单位：片/颗/克/毫克)
- frequency (频次：1/2/3次/天)
- breakfast (是否早餐服用)
- lunch (是否中餐服用)
- dinner (是否晚餐服用)
- timing (服用方式：餐前/餐后)
- created_at (创建时间)
- updated_at (更新时间)

MedicationRecords:
- id (主键)
- medication_id (外键)
- date (日期)
- meal_time (用餐时段：早餐/中餐/晚餐)
- taken_at (服用时间，NULL表示未服用)
- created_at (记录时间)
```

## Migration Plan
1. 实现数据模型和数据库初始化
2. 实现药品管理CRUD功能
3. 实现主界面UI
4. 实现提醒系统
5. 实现统计功能
6. 端到端测试和优化

## Open Questions
- 是否需要药品分类功能？
- 是否需要导出用药报告功能？
- 是否支持多用户？