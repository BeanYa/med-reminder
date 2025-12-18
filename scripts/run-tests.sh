#!/bin/bash

echo "=== 运行用药提醒应用测试套件 ==="
echo

# 设置测试环境
export NODE_ENV=test

# 清理旧的测试数据库
if [ -f "data/test-medications.db" ]; then
    rm data/test-medications.db
fi

# 创建测试数据目录
mkdir -p data

echo "1. 运行单元测试..."
npm run test:unit

echo
echo "2. 运行集成测试..."
npm run test:integration

echo
echo "3. 运行端到端测试..."
npm run test:e2e

echo
echo "4. 生成测试覆盖率报告..."
npm run test:coverage

echo
echo "5. 运行性能测试..."
npm run test:performance

echo
echo "=== 所有测试完成 ==="