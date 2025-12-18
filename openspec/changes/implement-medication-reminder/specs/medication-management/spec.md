## ADDED Requirements

### Requirement: 药品管理
系统 SHALL 允许用户添加、编辑和删除药品信息。

#### Scenario: 添加新药品
- **WHEN** 用户点击"新增药品"按钮
- **THEN** 系统 SHALL 显示药品添加表单
- **AND** 表单 SHALL 包含：名称、剂量、单位、服用频次、服用时段、服用方式
- **AND** 用户 SHALL 能够选择1-3次/天的服用频次
- **AND** 系统 SHALL 根据频次自动控制可选择的服用时段

#### Scenario: 设置服用频次
- **WHEN** 用户选择"1次/天"
- **THEN** 服用时段 SHALL 只能选择一个（早餐/中餐/晚餐）
- **WHEN** 用户选择"2次/天"
- **THEN** 服用时段 SHALL 只能选择两个
- **WHEN** 用户选择"3次/天"
- **THEN** 服用时段 SHALL 默认全选且不可修改

#### Scenario: 设置服用方式
- **WHEN** 用户在表单中设置服用方式
- **THEN** 系统 SHALL 提供"餐前"和"餐后"选项
- **AND** "餐后" SHALL 作为默认选择

#### Scenario: 编辑药品
- **WHEN** 用户点击已有药品
- **THEN** 系统 SHALL 显示药品编辑表单
- **AND** 表单 SHALL 预填充当前药品的所有信息
- **AND** 用户 SHALL 能够修改任何属性

#### Scenario: 删除药品
- **WHEN** 用户在药品列表选择删除药品
- **THEN** 系统 SHALL 要求确认删除操作
- **AND** 确认后药品 SHALL 被标记为删除
- **AND** 历史用药记录 SHALL 保留不受影响

### Requirement: 剂量单位管理
系统 SHALL 支持多种药品剂量单位。

#### Scenario: 选择剂量单位
- **WHEN** 用户添加或编辑药品
- **THEN** 系统 SHALL 提供预设的单位选项：片、颗、克、毫克
- **AND** 用户 SHALL 能够输入自定义剂量数值