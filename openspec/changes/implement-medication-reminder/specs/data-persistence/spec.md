## ADDED Requirements

### Requirement: 数据持久化
系统 SHALL 将所有数据持久化存储在本地。

#### Scenario: 药品信息存储
- **WHEN** 用户添加或修改药品信息
- **THEN** 系统 SHALL 将药品数据保存到本地数据库
- **AND** 数据 SHALL 包含所有药品属性
- **AND** 应用重启后数据 SHALL 保持不变

#### Scenario: 用药记录存储
- **WHEN** 用户标记服用药品
- **THEN** 系统 SHALL 记录用药时间和日期
- **AND** 记录 SHALL 包含药品ID、服用时段、服用时间
- **AND** 历史记录 SHALL 可查询和分析

### Requirement: 数据独立性
系统 SHALL 确保新添加的药品不影响已有数据。

#### Scenario: 新旧药品隔离
- **WHEN** 用户添加新药品
- **THEN** 新药品 SHALL 不影响已存在的用药记录
- **AND** 新药品与已存在药品 SHALL 相互独立
- **AND** 修改或删除某个药品 SHALL 不影响其他药品

### Requirement: 数据完整性
系统 SHALL 确保数据的完整性和一致性。

#### Scenario: 事务处理
- **WHEN** 执行数据修改操作
- **THEN** 系统 SHALL 使用事务确保数据一致性
- **AND** 操作失败 SHALL 自动回滚
- **AND** 数据 SHALL 始终处于有效状态

#### Scenario: 数据验证
- **WHEN** 保存药品数据
- **THEN** 系统 SHALL 验证必填字段不为空
- **AND** 系统 SHALL 验证剂量为有效数字
- **AND** 系统 SHALL 验证服用频次为预设值