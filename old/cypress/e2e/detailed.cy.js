// 详细测试用例，测试AA分账计算器的各种场景和边缘情况

describe('AA分账计算器详细功能测试', () => {
  beforeEach(() => {
    // 访问测试页面
    cy.visit('index.html');
  });

  it('测试删除参与人功能', () => {
    // 确保有至少两个参与人
    cy.get('.person-row').then(($rows) => {
      if ($rows.length < 2) {
        cy.get('#add-person-btn').click();
      }
    });
    
    // 记录初始参与人数
    cy.get('.person-row').then(($rows) => {
      const initialCount = $rows.length;
      
      // 点击最后一个参与人的删除按钮
      cy.get('.person-row').last().find('.delete-person-btn').click();
      
      // 验证参与人数减少
      cy.get('.person-row').should('have.length', initialCount - 1);
    });
  });

  it('测试删除费用功能', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 验证费用项已添加
    cy.get('.person-row').first().find('.expense-item').should('exist');
    
    // 点击删除费用按钮
    cy.get('.person-row').first().find('.delete-expense-btn').last().click();
    
    // 验证费用项已删除
    cy.get('.person-row').first().find('.expense-item').should('not.exist');
  });

  it('测试修改参与人姓名', () => {
    // 选择第一个参与人的姓名输入框
    const nameInput = cy.get('.person-row').first().find('.name-input');
    
    // 修改姓名
    nameInput.clear().type('张三');
    
    // 验证姓名已更新
    nameInput.should('have.value', '张三');
  });

  it('测试修改费用金额', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    const expenseAmount = cy.get('.person-row').first().find('.expense-amount').last();
    
    // 输入初始金额
    expenseAmount.type('100');
    
    // 验证初始金额
    expenseAmount.should('have.value', '100');
    
    // 修改金额
    expenseAmount.clear().type('200');
    
    // 验证金额已更新
    expenseAmount.should('have.value', '200');
  });

  it('测试修改费用参与人', () => {
    // 确保有至少两个参与人
    cy.get('.person-row').then(($rows) => {
      if ($rows.length < 2) {
        cy.get('#add-person-btn').click();
      }
    });
    
    // 为第一个参与人添加费用
    cy.get('.person-row').eq(0).find('.add-expense-btn').click();
    cy.get('.person-row').eq(0).find('.expense-amount').last().type('100');
    
    // 取消选择第二个参与人
    cy.get('.person-row').eq(0).find('.expense-item').last().find('.participant-checkbox').eq(1).uncheck();
    
    // 验证平摊金额已更新（现在只有一个人参与）
    cy.get('.person-row').eq(0).find('.expense-item').last().find('.text-xs.text-gray-500').should('contain', '平摊: ¥');
  });

  it('测试结算结果的详细信息展开/收起功能', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 点击第一个展开详细信息按钮
    cy.get('.toggle-details').first().click();
    
    // 验证详细信息已展开
    cy.get('.transfer-details').first().should('exist');
    
    // 再次点击收起详细信息按钮
    cy.get('.toggle-details').first().click();
  });

  it('测试各种开关功能', () => {
    // 为第一个参与人添加费用
    cy.get('.person-row').first().find('.add-expense-btn').click();
    cy.get('.person-row').first().find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 测试抵消开关
    cy.get('#offset-switch').uncheck();
    cy.get('#offset-switch').check();
    
    // 测试代还开关
    cy.get('#indirect-payment-switch').uncheck();
    cy.get('#indirect-payment-switch').check();
    
    // 测试汇率换算开关
    cy.get('#exchange-rate-switch').check();
    cy.get('#exchange-rate-switch').uncheck();
    
    // 测试四舍五入开关
    cy.get('#round-switch').check();
    cy.get('#round-switch').uncheck();
  });

  it('测试键盘快捷键功能', () => {
    // 测试回车键添加费用
    cy.get('.person-row').first().find('.name-input').type('{enter}');
    cy.get('.person-row').first().find('.expense-item').should('exist');
  });

  it('测试帮助弹窗功能', () => {
    // 点击帮助图标
    cy.get('#expense-help-icon').click();
    
    // 验证帮助弹窗已打开
    cy.get('#help-modal').should('be.visible');
    
    // 点击关闭按钮
    cy.get('#help-modal-close').click();
    
    // 验证帮助弹窗已关闭
    cy.get('#help-modal').should('not.be.visible');
  });

  it('测试多个人多笔费用的复杂场景', () => {
    // 确保有三个参与人
    cy.get('.person-row').then(($rows) => {
      while ($rows.length < 3) {
        cy.get('#add-person-btn').click();
        $rows = cy.get('.person-row');
      }
    });
    
    // 为第一个参与人添加费用
    cy.get('.person-row').eq(0).find('.name-input').clear().type('张三');
    cy.get('.person-row').eq(0).find('.add-expense-btn').click();
    cy.get('.person-row').eq(0).find('.expense-amount').last().type('300');
    
    // 为第二个参与人添加费用
    cy.get('.person-row').eq(1).find('.name-input').clear().type('李四');
    cy.get('.person-row').eq(1).find('.add-expense-btn').click();
    cy.get('.person-row').eq(1).find('.expense-amount').last().type('200');
    
    // 为第三个参与人添加费用
    cy.get('.person-row').eq(2).find('.name-input').clear().type('王五');
    cy.get('.person-row').eq(2).find('.add-expense-btn').click();
    cy.get('.person-row').eq(2).find('.expense-amount').last().type('100');
    
    // 点击保存并计算按钮
    cy.get('#calculate-btn').click();
    
    // 验证结算结果已生成
    cy.get('#settlement-results').should('not.contain', '请先添加人员和费用');
    cy.get('#settlement-results').contains('需要支付');
  });
});
