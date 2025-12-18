## ADDED Requirements

### Requirement: 用药提醒通知
系统 SHALL 在用药时间发送提醒通知。

#### Scenario: 定时提醒
- **WHEN** 到达预设的用药时间
- **THEN** 系统 SHALL 发送系统通知
- **AND** 通知 SHALL 显示需要服用的药品列表
- **AND** 通知 SHALL 包含药品名称和剂量信息

#### Scenario: 时段提醒
- **WHEN** 到达早餐时间（用户可配置）
- **THEN** 系统 SHALL 发送早餐药品提醒
- **WHEN** 到达中餐时间（用户可配置）
- **THEN** 系统 SHALL 发送中餐药品提醒
- **WHEN** 到达晚餐时间（用户可配置）
- **THEN** 系统 SHALL 发送晚餐药品提醒

#### Scenario: 通知权限管理
- **WHEN** 应用首次启动
- **THEN** 系统 SHALL 请求发送通知的权限
- **AND** 用户拒绝权限后系统 SHALL 引导用户在设置中开启
- **AND** 系统 SHALL 在通知设置页面显示当前权限状态

### Requirement: 数据统计
系统 SHALL 提供用药依从性统计功能。

#### Scenario: 七日用药统计
- **WHEN** 用户访问数据统计页面
- **THEN** 系统 SHALL 显示过去七天的用药数据
- **AND** 系统 SHALL 计算每日服药完成率
- **AND** 系统 SHALL 展示统计图表或列表
- **AND** 无数据的日期 SHALL 不显示

#### Scenario: 服药完成率计算
- **WHEN** 计算某日服药完成率
- **THEN** 系统 SHALL 将完成当日所有时段服用的药品视为完成
- **AND** 完成率 SHALL 为完成药品数/应服药品总数
- **AND** 统计规则 SHALL 与主界面"今日进度"一致