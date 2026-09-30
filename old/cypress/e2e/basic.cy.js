// 基础测试用例，测试AA分账计算器的核心功能

describe('AA分账计算器基础功能测试', () => {
  beforeEach(() => {
    // 访问测试页面
    cy.visit('index.html');
  });

  it('测试页面加载和初始状态', () => {
    // 验证页面标题
    cy.title().should('eq', 'AA分账计算器');
    
    // 验证初始状态下有默认的参与人
    cy.get('.person-row').should('have.length.at.least', 1);
    
    // 验证结算结果区域显示提示信息
    cy.get('#settlement-results').contains('请先添加人员和费用');
  });

  it('测试添加参与人功能', () => {
    // 记录初始参与人数
    cy.get('.person-row').then(($rows) => {
      const initialCount = $rows.length;
      
      // 点击添加参与人按钮
      cy.get('#add-person-btn').click();
      
      // 验证参与人数增加
      cy.get('.person-row').should('have.length', initialCount + 1);
      
      // 验证新添加的参与人姓名输入框存在
      cy.get('.person-row').last().find('.name-input').should('exist');
    });
  });

  it('测试添加费用功能', () => {
    // 点击第一个参与人的添加费用按钮
    cy.get('.person-row').first().find('.add-expense-btn').click();
    
    // 验证费用项已添加
    cy.get('.person-row').first().find('.expense-item').should('exist');
    
    // 输入费用金额
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 验证平摊金额显示正确
    cy.get('.person-row').first().find('.text-xs.text-gray-500').last().should('contain', '平摊: ¥');
  });

  it('测试计算结算结果功能', () => {
    // 确保有至少两个参与人
    cy.get('.person-row').then(($rows) => {
      if ($rows.length < 2) {
        cy.get('#add-person-btn').click();
      }
    });
    
    // 为第一个参与人添加费用
    cy.get('.person-row').eq(0).find('.add-expense-btn').click();
    cy.get('.person-row').eq(0).find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 验证结算结果已生成
    cy.get('#settlement-results').should('not.contain', '请先添加人员和费用');
    
    // 验证结算结果中包含支付信息
    cy.get('#settlement-results').contains('需要支付');
  });

  it('测试加载测试数据功能', () => {
    // 点击加载测试数据按钮
    cy.get('#load-test-data-btn').click();
    
    // 验证生成了结算结果
    cy.get('#settlement-results').should('not.contain', '请先添加人员和费用');
    cy.get('#settlement-results').contains('需要支付');
  });

  it('测试汇率设置功能', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 记录初始结算结果
    cy.get('#settlement-results').find('.text-red-600').first().invoke('text').then((initialAmount) => {
      // 修改汇率
      cy.get('#exchange-rate').clear().type('8');
      
      // 验证结算结果已更新
      cy.get('#settlement-results').find('.text-red-600').first().invoke('text').should('not.eq', initialAmount);
    });
  });
});
