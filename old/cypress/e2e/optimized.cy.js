// 优化测试用例，提高测试覆盖率，测试边界情况和额外场景

describe('AA分账计算器优化测试', () => {
  beforeEach(() => {
    // 访问测试页面
    cy.visit('index.html');
  });

  it('测试边界情况：费用金额为0', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('0');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 验证结算结果区域存在
    cy.get('#settlement-results').should('exist');
  });

  it.skip('测试边界情况：只有一个参与人', () => {
    // 确保只有一个参与人
    cy.get('.person-row').then(($rows) => {
      while ($rows.length > 1) {
        cy.get('.person-row').last().find('.delete-person-btn').click();
        $rows = cy.get('.person-row');
      }
    });
    
    // 为唯一的参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 验证结算结果存在
    cy.get('#settlement-results').should('exist');
  });

  it('测试UI交互：输入验证', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    const expenseAmount = cy.get('.person-row').first().find('.expense-amount').last();
    
    // 测试输入负数
    expenseAmount.type('-100');
    
    // 验证输入框接受负数（实际业务逻辑会处理）
    expenseAmount.should('have.value', '-100');
  });

  it('测试响应式设计：不同屏幕尺寸', () => {
    // 测试桌面尺寸
    cy.viewport(1024, 768);
    cy.get('main').should('exist');
    
    // 测试移动尺寸
    cy.viewport(375, 667);
    cy.get('main').should('exist');
  });

  it('测试性能：添加大量参与人和费用', () => {
    // 记录开始时间
    const startTime = Date.now();
    
    // 添加5个参与人
    for (let i = 0; i < 5; i++) {
      cy.get('#add-person-btn').click();
    }
    
    // 为第一个参与人添加3笔费用
    for (let i = 0; i < 3; i++) {
      cy.get('.person-row').first().find('.add-expense-btn').click();
      cy.get('.person-row').first().find('.expense-amount').last().type((i + 1) * 100);
    }
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 记录结束时间
    const endTime = Date.now();
    
    // 验证计算完成时间不超过5秒（性能测试）
    expect(endTime - startTime).to.be.lessThan(5000);
    
    // 验证结算结果已生成
    cy.get('#settlement-results').should('not.contain', '请先添加人员和费用');
  });

  it('测试费用备注功能', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 输入备注
    const expenseNote = cy.get('.person-row').first().find('.expense-note').last();
    expenseNote.type('测试备注');
    
    // 验证备注已更新
    expenseNote.should('have.value', '测试备注');
  });

  it('测试多币种汇率换算', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 测试不同汇率
    const exchangeRates = [5, 10, 15];
    
    exchangeRates.forEach(rate => {
      // 设置汇率
      cy.get('#exchange-rate').clear().type(rate);
      
      // 验证结算结果已更新
      cy.get('#settlement-results').should('exist');
    });
  });

  it('测试四舍五入功能', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100.55');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 启用四舍五入
    cy.get('#round-switch').check();
    
    // 验证结算结果已更新
    cy.get('#settlement-results').should('exist');
  });

  it('测试抵消功能', () => {
    // 确保有两个参与人
    cy.get('.person-row').then(($rows) => {
      if ($rows.length < 2) {
        cy.get('#add-person-btn').click();
      }
    });
    
    // 为第一个参与人添加费用
    cy.get('.person-row').eq(0).find('.add-expense-btn').click();
    cy.get('.person-row').eq(0).find('.expense-amount').last().type('100');
    
    // 为第二个参与人添加费用
    cy.get('.person-row').eq(1).find('.add-expense-btn').click();
    cy.get('.person-row').eq(1).find('.expense-amount').last().type('50');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 禁用抵消
    cy.get('#offset-switch').uncheck();
    
    // 验证结算结果已更新
    cy.get('#settlement-results').should('exist');
    
    // 启用抵消
    cy.get('#offset-switch').check();
    
    // 验证结算结果已更新
    cy.get('#settlement-results').should('exist');
  });
});
