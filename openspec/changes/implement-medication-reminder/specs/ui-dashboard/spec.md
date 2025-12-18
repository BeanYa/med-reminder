## ADDED Requirements

### Requirement: 主界面仪表板
系统 SHALL 提供直观的主界面展示当日用药情况。

#### Scenario: 显示用药情况卡片
- **WHEN** 用户打开应用
- **THEN** 主界面 SHALL 显示五个卡片：今日进度、前一天未服用、早餐、中餐、晚餐
- **AND** 卡片 SHALL 清晰标识各自的状态

#### Scenario: 今日进度统计
- **WHEN** 用户查看"今日进度"卡片
- **THEN** 系统 SHALL 显示今日已完成服用的药品数量
- **AND** 系统 SHALL 显示今日需服用的药品总数
- **AND** 单种药品完成所有对应时段服用 SHALL 被视为完成

#### Scenario: 前一天未服用提醒
- **WHEN** 用户查看"前一天未服用"卡片
- **THEN** 系统 SHALL 列出所有昨天未服用的药品
- **AND** 系统 SHALL 标识每个药品遗漏的服用时段（早餐/中餐/晚餐）

#### Scenario: 时段用药清单
- **WHEN** 用户查看早餐/中餐/晚餐卡片
- **THEN** 系统 SHALL 列出该时段需要服用的所有药品
- **AND** 每个药品 SHALL 显示名称和剂量
- **AND** 未服用的药品 SHALL 可点击切换服用状态

#### Scenario: 标记服用状态
- **WHEN** 用户点击时段卡片中的药品
- **THEN** 系统 SHALL 切换该药品的服用状态（未服用→已服用）
- **AND** 服用状态 SHALL 立即反映在界面上
- **AND** 系统 SHALL 记录服用时间

### Requirement: 刷新功能
系统 SHALL 提供刷新功能更新用药状态。

#### Scenario: 刷新用药情况
- **WHEN** 用户点击刷新按钮
- **THEN** 系统 SHALL 将前一天所有未服用药品标记为已服用
- **AND** 系统 SHALL 将今天所有需要服用的药品标记为未服用
- **AND** 系统 SHALL 更新所有卡片显示

### Requirement: 药品编辑入口
系统 SHALL 提供药品管理的便捷入口。

#### Scenario: 访问药品编辑
- **WHEN** 用户点击"新增药品"按钮
- **THEN** 系统 SHALL 跳转到药品添加页面
- **WHEN** 用户访问"药品编辑"页面
- **THEN** 系统 SHALL 列出所有已添加的药品
- **AND** 点击任一药品 SHALL 进入编辑页面