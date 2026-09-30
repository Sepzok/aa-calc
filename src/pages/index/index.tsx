import Taro, { Component } from '@tarojs/taro';
import { View, Text, Input, Button, Checkbox, CheckboxGroup } from '@tarojs/components';
import './index.scss';

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      people: [
        { id: 1, name: '人员1', expenses: [] },
        { id: 2, name: '人员2', expenses: [] },
        { id: 3, name: '人员3', expenses: [] }
      ],
      exchangeRate: 7.12,
      showHelpModal: false,
      offsetSwitch: false,
      indirectPaymentSwitch: false,
      exchangeRateSwitch: false,
      roundSwitch: false
    };
  }

  // 添加参与人
  addPerson = () => {
    const { people } = this.state;
    const newId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1;
    const newPerson = {
      id: newId,
      name: '人员' + newId,
      expenses: []
    };
    this.setState({
      people: [...people, newPerson]
    });
  };

  // 删除参与人
  deletePerson = (personId) => {
    let { people } = this.state;
    
    // 从其他费用的参与人中移除该人员
    people = people.map(person => {
      const updatedExpenses = person.expenses.map(expense => {
        if (expense.participants) {
          const newParticipants = expense.participants.filter(id => id !== personId);
          
          // 确保至少有一个参与人
          if (newParticipants.length === 0 && people.length > 1) {
            const firstOtherId = people.find(p => p.id !== personId)?.id;
            if (firstOtherId) {
              return { ...expense, participants: [firstOtherId] };
            }
          }
          return { ...expense, participants: newParticipants };
        }
        return expense;
      });
      return { ...person, expenses: updatedExpenses };
    });
    
    // 删除人员
    people = people.filter(person => person.id !== personId);
    
    this.setState({ people });
  };

  // 更新参与人姓名
  updatePersonName = (personId, name) => {
    const { people } = this.state;
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        return { ...person, name };
      }
      return person;
    });
    this.setState({ people: updatedPeople });
  };

  // 添加费用
  addExpense = (personId) => {
    const { people } = this.state;
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const newExpense = {
          id: Date.now(),
          amount: 0,
          participants: people.map(p => p.id), // 默认所有人参与
          note: '' // 添加备注字段，默认为空
        };
        return { ...person, expenses: [...person.expenses, newExpense] };
      }
      return person;
    });
    this.setState({ people: updatedPeople });
  };

  // 删除费用
  deleteExpense = (personId, expenseId) => {
    const { people } = this.state;
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        return {
          ...person,
          expenses: person.expenses.filter(expense => expense.id !== expenseId)
        };
      }
      return person;
    });
    this.setState({ people: updatedPeople });
  };

  // 更新费用金额
  updateExpenseAmount = (personId, expenseId, amount) => {
    const { people } = this.state;
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const updatedExpenses = person.expenses.map(expense => {
          if (expense.id === expenseId) {
            return { ...expense, amount: parseFloat(amount) || 0 };
          }
          return expense;
        });
        return { ...person, expenses: updatedExpenses };
      }
      return person;
    });
    this.setState({ people: updatedPeople });
  };

  // 更新费用备注
  updateExpenseNote = (personId, expenseId, note) => {
    const { people } = this.state;
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const updatedExpenses = person.expenses.map(expense => {
          if (expense.id === expenseId) {
            return { ...expense, note };
          }
          return expense;
        });
        return { ...person, expenses: updatedExpenses };
      }
      return person;
    });
    this.setState({ people: updatedPeople });
  };

  // 更新费用参与人
  updateExpenseParticipants = (personId, expenseId, participants) => {
    const { people } = this.state;
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const updatedExpenses = person.expenses.map(expense => {
          if (expense.id === expenseId) {
            return { ...expense, participants };
          }
          return expense;
        });
        return { ...person, expenses: updatedExpenses };
      }
      return person;
    });
    this.setState({ people: updatedPeople });
  };

  // 加载测试数据
  loadTestData = () => {
    this.setState({
      people: [
        { id: 1, name: '张三', expenses: [
          { id: 101, amount: 100, participants: [1, 2, 3], note: '午餐' },
          { id: 102, amount: 50, participants: [1, 2], note: '咖啡' }
        ]},
        { id: 2, name: '李四', expenses: [
          { id: 201, amount: 150, participants: [1, 2, 3], note: '晚餐' }
        ]},
        { id: 3, name: '王五', expenses: [] }
      ]
    });
  };

  // 计算结算结果
  calculateSettlements = () => {
    const { people, exchangeRate, roundSwitch } = this.state;
    
    // 计算每个人的总支出和应分摊金额
    const balances = {};
    
    // 初始化每个人的余额为0
    people.forEach(person => {
      balances[person.id] = 0;
    });
    
    // 存储每个人的详细计算过程
    const calculationDetails = {};
    people.forEach(person => {
      calculationDetails[person.id] = {
        paid: [],      // 支出记录
        owes: []       // 欠款记录
      };
    });
    
    // 计算每个人的支出
    people.forEach(person => {
      let totalPaid = 0;
      person.expenses.forEach(expense => {
        const amount = expense.amount || 0;
        totalPaid += amount;
        
        if (amount > 0) {
          // 记录支出详情
          // 计算支付者实际承担的金额（总额减去自己应该分摊的部分）
          let actualAmount = amount;
          if (expense.participants && expense.participants.includes(person.id)) {
            actualAmount = amount - (amount / expense.participants.length);
          }
          
          calculationDetails[person.id].paid.push({
            amount: actualAmount,
            originalAmount: amount,
            description: "支付费用"
          });
        }
      });
      balances[person.id] += totalPaid;
    });
    
    // 计算每个人需要分摊的金额
    people.forEach(person => {
      person.expenses.forEach(expense => {
        if (expense.amount && expense.participants && expense.participants.length > 0) {
          const splitAmount = expense.amount / expense.participants.length;
          
          // 获取参与人姓名
          const participantNames = [];
          expense.participants.forEach(participantId => {
            const participant = people.find(p => p.id === participantId);
            if (participant) {
              participantNames.push(participant.name);
            }
          });
          
          expense.participants.forEach(participantId => {
            balances[participantId] -= splitAmount;
            
            // 记录分摊详情
            if (participantId !== person.id) { // 不记录支付者自己的分摊
              calculationDetails[participantId].owes.push({
                amount: splitAmount,
                description: "分摊" + person.name + "的费用(" + participantNames.join(",") + "参与)",
                payer: person.name,
                participants: participantNames
              });
            }
          });
        }
      });
    });
    
    // 保存原始余额（应用汇率前）
    const originalBalances = { ...balances };
    
    // 应用汇率
    Object.keys(balances).forEach(personId => {
      balances[personId] *= exchangeRate;
    });
    
    // 生成结算建议
    const creditors = [];
    const debtors = [];
    
    Object.keys(balances).forEach(personId => {
      const person = people.find(p => p.id === parseInt(personId));
      if (person) {
        const balance = balances[personId];
        if (balance > 0) {
          creditors.push({ person, amount: balance });
        } else if (balance < 0) {
          debtors.push({ person, amount: -balance });
        }
      }
    });
    
    // 排序：债权人按金额降序，债务人按金额降序
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // 生成转账建议
    const transfers = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      
      const transferAmount = Math.min(creditor.amount, debtor.amount);
      
      // 生成详细的计算公式
      const debtorDetails = calculationDetails[debtor.person.id];
      const formulaParts = [];
      
      // 添加债务人的支出部分
      if (debtorDetails && debtorDetails.paid && debtorDetails.paid.length > 0) {
        debtorDetails.paid.forEach(paid => {
          if (paid.originalAmount && paid.originalAmount !== paid.amount) {
            // 需要找到这笔费用对应的参与人数
            let participantCount = 2; // 默认为2
            // 查找这笔费用在expenses中的记录，以获取正确的参与人数
            const expense = debtor.person.expenses.find(e => e.amount === paid.originalAmount);
            if (expense && expense.participants) {
              participantCount = expense.participants.length;
            }
            formulaParts.push(paid.amount.toFixed(2) + '+(' + paid.originalAmount.toFixed(2) + '-' + (paid.originalAmount / participantCount).toFixed(2) + ')');
          } else {
            formulaParts.push(paid.amount.toFixed(2));
          }
        });
      }
      
      // 添加债务人的分摊部分
      if (debtorDetails && debtorDetails.owes && debtorDetails.owes.length > 0) {
        debtorDetails.owes.forEach(owes => {
          formulaParts.push('-' + owes.amount.toFixed(2));
        });
      }
      
      // 计算债务人的原始余额
      const debtorOriginalBalance = originalBalances[debtor.person.id];
      
      // 计算债务人在汇率换算后的总应付金额
      let debtorTotalAfterExchange = debtorOriginalBalance * exchangeRate;
      if (roundSwitch) {
        debtorTotalAfterExchange = Math.round(debtorTotalAfterExchange);
      }
      
      // 计算当前转账金额占总应付金额的比例
      const transferRatio = transferAmount / Math.abs(debtorTotalAfterExchange);
      
      // 组合公式，使用原始余额中的对应部分
      let formula = '[' + formulaParts.join('+') + ']×' + exchangeRate.toFixed(2) + '×' + transferRatio.toFixed(2);
      if (roundSwitch) {
        formula += '≈' + transferAmount.toFixed(2);
      }
      
      transfers.push({
        from: debtor.person,
        to: creditor.person,
        amount: transferAmount,
        formula: formula
      });
      
      // 更新余额
      creditor.amount -= transferAmount;
      debtor.amount -= transferAmount;
      
      // 移动指针
      if (creditor.amount === 0) creditorIndex++;
      if (debtor.amount === 0) debtorIndex++;
    }
    
    return { transfers, balances, exchangeRate, roundSwitch, calculationDetails, originalBalances };
  };

  // 显示帮助弹窗
  showHelpModal = () => {
    this.setState({ showHelpModal: true });
  };

  // 关闭帮助弹窗
  closeHelpModal = () => {
    this.setState({ showHelpModal: false });
  };

  // 处理汇率变化
  handleExchangeRateChange = (value) => {
    this.setState({ exchangeRate: parseFloat(value) || 0 });
  };

  // 处理开关变化
  handleSwitchChange = (switchName, value) => {
    this.setState({ [switchName]: value });
  };

  render() {
    const { people, exchangeRate, showHelpModal, offsetSwitch, indirectPaymentSwitch, exchangeRateSwitch, roundSwitch } = this.state;
    
    // 计算结算结果
    const settlementResult = this.calculateSettlements();
    const { transfers, balances } = settlementResult;

    return (
      <View className="container">
        {/* 标题区域 */}
        <View className="header">
          <Text className="title">AA分账计算器</Text>
          <Text className="subtitle">简单快捷地进行多人费用分摊计算</Text>
        </View>

        {/* 主内容区域 */}
        <View className="main-content">
          {/* 输入区域 */}
          <View className="input-section">
            <View className="section-header">
              <Text className="section-title">费用录入</Text>
              <View className="help-icon" onClick={this.showHelpModal}>
                <Text>?</Text>
              </View>
            </View>
            
            <View className="people-container">
              {people.map(person => (
                <View key={person.id} className="person-row">
                  <View className="person-header">
                    <Input
                      className="name-input"
                      value={person.name}
                      onChange={(e) => this.updatePersonName(person.id, e.detail.value)}
                      placeholder="输入姓名"
                    />
                    <Button className="add-expense-btn" onClick={() => this.addExpense(person.id)}>
                      <Text className="button-text">添加费用</Text>
                    </Button>
                    {people.length > 1 && (
                      <Button className="delete-person-btn" onClick={() => this.deletePerson(person.id)}>
                        <Text className="button-text">删除</Text>
                      </Button>
                    )}
                  </View>
                  
                  <View className="expenses-container">
                    {person.expenses.length > 0 ? (
                      person.expenses.map(expense => (
                        <View key={expense.id} className="expense-item">
                          <Input
                            className="expense-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={expense.amount || ''}
                            onChange={(e) => this.updateExpenseAmount(person.id, expense.id, e.detail.value)}
                            placeholder="金额"
                          />
                          <View className="participants-container">
                            {people.map(p => (
                              <Checkbox
                                key={p.id}
                                className="participant-checkbox"
                                checked={expense.participants.includes(p.id)}
                                onChange={(e) => {
                                  const newParticipants = e.detail.checked 
                                    ? [...expense.participants, p.id]
                                    : expense.participants.filter(id => id !== p.id);
                                  this.updateExpenseParticipants(person.id, expense.id, newParticipants);
                                }}
                              >
                                <Text className="participant-name">{p.name}</Text>
                              </Checkbox>
                            ))}
                          </View>
                          <Input
                            className="expense-note"
                            value={expense.note}
                            onChange={(e) => this.updateExpenseNote(person.id, expense.id, e.detail.value)}
                            placeholder="添加备注..."
                          />
                          <View className="expense-actions">
                            <Text className="split-amount">
                              平摊: ¥{(expense.amount ? (expense.amount / expense.participants.length).toFixed(2) : '0.00')}
                            </Text>
                            <Button className="delete-expense-btn" onClick={() => this.deleteExpense(person.id, expense.id)}>
                              <Text className="button-text">删除</Text>
                            </Button>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text className="no-expenses">暂无费用</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            
            <View className="action-buttons">
              <Button className="add-person-btn" onClick={this.addPerson}>
                <Text className="button-text">添加参与人</Text>
              </Button>
              <Button className="load-test-data-btn" onClick={this.loadTestData}>
                <Text className="button-text">加载测试数据</Text>
              </Button>
            </View>
          </View>

          {/* 输出区域 */}
          <View className="output-section">
            <View className="section-header">
              <Text className="section-title">结算结果</Text>
            </View>
            
            <View className="exchange-rate-container">
              <Text className="exchange-rate-label">汇率 (默认 7.12)</Text>
              <Input
                className="exchange-rate-input"
                type="number"
                min="0"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => this.handleExchangeRateChange(e.detail.value)}
              />
            </View>
            
            <View className="settlement-results">
              {people.length === 0 ? (
                <View className="empty-state">
                  <Text className="empty-state-text">请先添加参与人</Text>
                </View>
              ) : transfers.length === 0 ? (
                <View className="balanced-state">
                  <Text className="balanced-state-text">完美！所有费用已平衡</Text>
                  <Text className="balanced-state-subtext">当前没有需要结算的款项</Text>
                </View>
              ) : (
                <>
                  {/* 转账记录 */}
                  {transfers.map((transfer, index) => (
                    <View key={index} className="transfer-row">
                      <View className="transfer-info">
                        <Text className="transfer-from">{transfer.from.name}</Text>
                        <Text className="transfer-arrow">→</Text>
                        <Text className="transfer-to">{transfer.to.name}</Text>
                      </View>
                      <Text className="transfer-amount">¥{transfer.amount.toFixed(2)}</Text>
                      <Text className="transfer-formula">{transfer.formula}</Text>
                    </View>
                  ))}
                  
                  {/* 净收入人员 */}
                  <View className="net-income-section">
                    <Text className="section-subtitle">净收入人员：</Text>
                    {people.map(person => {
                      if (balances[person.id] > 0) {
                        return (
                          <View key={person.id} className="net-income-row">
                            <Text className="net-income-name">{person.name}</Text>
                            <Text className="net-income-amount">+¥{balances[person.id].toFixed(2)}</Text>
                          </View>
                        );
                      }
                      return null;
                    })}
                  </View>
                  
                  {/* 支付明细 */}
                  <View className="payment-detail">
                    <Text className="section-subtitle">支付明细：</Text>
                    
                    <View className="switches-container">
                      <Checkbox
                        className="switch"
                        checked={offsetSwitch}
                        onChange={(e) => this.handleSwitchChange('offsetSwitch', e.detail.checked)}
                      >
                        <Text className="switch-label">抵消</Text>
                      </Checkbox>
                      <Checkbox
                        className="switch"
                        checked={indirectPaymentSwitch}
                        onChange={(e) => this.handleSwitchChange('indirectPaymentSwitch', e.detail.checked)}
                      >
                        <Text className="switch-label">代还</Text>
                      </Checkbox>
                      <Checkbox
                        className="switch"
                        checked={exchangeRateSwitch}
                        onChange={(e) => this.handleSwitchChange('exchangeRateSwitch', e.detail.checked)}
                      >
                        <Text className="switch-label">汇率换算</Text>
                      </Checkbox>
                      <Checkbox
                        className="switch"
                        checked={roundSwitch}
                        onChange={(e) => this.handleSwitchChange('roundSwitch', e.detail.checked)}
                      >
                        <Text className="switch-label">四舍五入</Text>
                      </Checkbox>
                    </View>
                    
                    {/* 支付矩阵表格 */}
                    <View className="payment-matrix">
                      <View className="matrix-header">
                        <Text className="matrix-header-cell">支付方\收款方</Text>
                        {people.map(person => (
                          <Text key={person.id} className="matrix-header-cell">{person.name}</Text>
                        ))}
                      </View>
                      {people.map(payer => (
                        <View key={payer.id} className="matrix-row">
                          <Text className="matrix-row-header">{payer.name}</Text>
                          {people.map(payee => {
                            if (payer.id === payee.id) {
                              return <Text key={payee.id} className="matrix-cell">-</Text>;
                            }
                            // 计算支付金额
                            let amount = 0;
                            if (indirectPaymentSwitch) {
                              // 代还款后：计算净支付金额
                              const payerToPayee = transfers.find(t => t.from.id === payer.id && t.to.id === payee.id);
                              const payeeToPayer = transfers.find(t => t.from.id === payee.id && t.to.id === payer.id);
                              amount = (payerToPayee ? payerToPayee.amount : 0) - (payeeToPayer ? payeeToPayer.amount : 0);
                            } else {
                              // 代还款前：计算原始支付金额
                              amount = payer.expenses.reduce((total, expense) => {
                                if (expense.participants && expense.participants.includes(payee.id) && payer.id !== payee.id) {
                                  return total + (expense.amount / expense.participants.length);
                                }
                                return total;
                              }, 0);
                            }
                            
                            // 如果需要应用抵消
                            if (offsetSwitch) {
                              const payeeToPayer = transfers.find(t => t.from.id === payee.id && t.to.id === payer.id);
                              if (payeeToPayer) {
                                amount -= payeeToPayer.amount;
                              }
                            }
                            
                            // 如果需要应用汇率换算
                            if (exchangeRateSwitch) {
                              amount *= exchangeRate;
                            }
                            
                            // 如果需要四舍五入
                            if (roundSwitch) {
                              amount = Math.round(amount);
                            }
                            
                            return (
                              <Text key={payee.id} className={`matrix-cell ${amount > 0 ? 'matrix-cell-positive' : ''}`}>
                                {amount > 0 ? `¥${amount.toFixed(2)}` : '¥0.00'}
                              </Text>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 页脚 */}
        <View className="footer">
          <Text className="footer-text">© 2023 AA分账计算器 - 简单、公平地分摊费用</Text>
        </View>

        {/* 帮助弹窗 */}
        {showHelpModal && (
          <View className="help-modal">
            <View className="help-modal-content">
              <View className="help-modal-header">
                <Text className="help-modal-title">费用录入快捷键说明</Text>
                <Button className="help-modal-close" onClick={this.closeHelpModal}>
                  <Text className="button-text">×</Text>
                </Button>
              </View>
              <View className="help-content">
                <View className="help-section">
                  <Text className="help-section-title">键盘快捷键</Text>
                  <Text className="help-section-text">在费用录入过程中，您可以使用以下快捷键提高效率：</Text>
                  <View className="help-list">
                    <Text className="help-list-item">Enter - 在姓名输入框中按回车键，快速添加当前人员的费用项</Text>
                    <Text className="help-list-item">Tab - 在姓名输入框中按Tab键，切换到下一个参与人的姓名输入框并全选内容</Text>
                  </View>
                </View>
                <View className="help-section">
                  <Text className="help-section-title">使用技巧</Text>
                  <View className="help-list">
                    <Text className="help-list-item">1. 页面加载时会自动聚焦到第一个参与人的姓名输入框</Text>
                    <Text className="help-list-item">2. 使用Tab键可以在不同参与人之间快速切换</Text>
                    <Text className="help-list-item">3. 按回车键可以快速添加费用，无需鼠标点击</Text>
                    <Text className="help-list-item">4. 添加费用后，可以直接在金额输入框中输入费用金额</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
}

export default Index;
