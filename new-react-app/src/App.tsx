import { useState } from 'react'
import './App.css'

function App() {
  const [people, setPeople] = useState([
    { id: 1, name: '人员1', expenses: [] },
    { id: 2, name: '人员2', expenses: [] },
    { id: 3, name: '人员3', expenses: [] }
  ])
  const [exchangeRate, setExchangeRate] = useState(7.12)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [offsetSwitch, setOffsetSwitch] = useState(false) // 抵消功能
  const [indirectPaymentSwitch, setIndirectPaymentSwitch] = useState(false) // 代还功能
  const [exchangeRateSwitch, setExchangeRateSwitch] = useState(false) // 汇率换算功能

  // 添加参与人
  const addPerson = () => {
    const newId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1
    const newPerson = {
      id: newId,
      name: '人员' + newId,
      expenses: []
    }
    setPeople([...people, newPerson])
  }

  // 删除参与人
  const deletePerson = (personId) => {
    let updatedPeople = [...people]
    
    // 从其他费用的参与人中移除该人员
    updatedPeople = updatedPeople.map(person => {
      const updatedExpenses = person.expenses.map(expense => {
        if (expense.participants) {
          const newParticipants = expense.participants.filter(id => id !== personId)
          
          // 确保至少有一个参与人
          if (newParticipants.length === 0 && updatedPeople.length > 1) {
            const firstOtherId = updatedPeople.find(p => p.id !== personId)?.id
            if (firstOtherId) {
              return { ...expense, participants: [firstOtherId] }
            }
          }
          return { ...expense, participants: newParticipants }
        }
        return expense
      })
      return { ...person, expenses: updatedExpenses }
    })
    
    // 删除人员
    updatedPeople = updatedPeople.filter(person => person.id !== personId)
    
    setPeople(updatedPeople)
  }

  // 更新参与人姓名
  const updatePersonName = (personId, name) => {
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        return { ...person, name }
      }
      return person
    })
    setPeople(updatedPeople)
  }

  // 添加费用
  const addExpense = (personId) => {
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const newExpense = {
          id: Date.now(),
          amount: 0,
          participants: people.map(p => p.id), // 默认所有人参与
          note: '' // 添加备注字段，默认为空
        }
        return { ...person, expenses: [...person.expenses, newExpense] }
      }
      return person
    })
    setPeople(updatedPeople)
  }

  // 删除费用
  const deleteExpense = (personId, expenseId) => {
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        return {
          ...person,
          expenses: person.expenses.filter(expense => expense.id !== expenseId)
        }
      }
      return person
    })
    setPeople(updatedPeople)
  }

  // 更新费用金额
  const updateExpenseAmount = (personId, expenseId, amount) => {
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const updatedExpenses = person.expenses.map(expense => {
          if (expense.id === expenseId) {
            return { ...expense, amount: parseFloat(amount) || 0 }
          }
          return expense
        })
        return { ...person, expenses: updatedExpenses }
      }
      return person
    })
    setPeople(updatedPeople)
  }

  // 更新费用备注
  const updateExpenseNote = (personId, expenseId, note) => {
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const updatedExpenses = person.expenses.map(expense => {
          if (expense.id === expenseId) {
            return { ...expense, note }
          }
          return expense
        })
        return { ...person, expenses: updatedExpenses }
      }
      return person
    })
    setPeople(updatedPeople)
  }

  // 更新费用参与人
  const updateExpenseParticipants = (personId, expenseId, participants) => {
    const updatedPeople = people.map(person => {
      if (person.id === personId) {
        const updatedExpenses = person.expenses.map(expense => {
          if (expense.id === expenseId) {
            return { ...expense, participants }
          }
          return expense
        })
        return { ...person, expenses: updatedExpenses }
      }
      return person
    })
    setPeople(updatedPeople)
  }

  // 加载测试数据
  const loadTestData = () => {
    setPeople([
      { id: 1, name: '张三', expenses: [
        { id: 101, amount: 100, participants: [1, 2, 3], note: '午餐' },
        { id: 102, amount: 50, participants: [1, 2], note: '咖啡' }
      ]},
      { id: 2, name: '李四', expenses: [
        { id: 201, amount: 150, participants: [1, 2, 3], note: '晚餐' }
      ]},
      { id: 3, name: '王五', expenses: [] }
    ])
  }

  // 计算结算结果
  const calculateSettlements = (exchangeRateSwitch: boolean) => {
    
    // 计算每个人的总支出和应分摊金额
    const balances = {}
    
    // 初始化每个人的余额为0
    people.forEach(person => {
      balances[person.id] = 0
    })
    
    // 存储每个人的详细计算过程
    const calculationDetails = {}
    people.forEach(person => {
      calculationDetails[person.id] = {
        paid: [],      // 支出记录
        owes: []       // 欠款记录
      }
    })
    
    // 计算每个人的支出
    people.forEach(person => {
      let totalPaid = 0
      person.expenses.forEach(expense => {
        const amount = expense.amount || 0
        totalPaid += amount
        
        if (amount > 0) {
          // 记录支出详情
          // 计算支付者实际承担的金额（总额减去自己应该分摊的部分）
          let actualAmount = amount
          if (expense.participants && expense.participants.includes(person.id)) {
            actualAmount = amount - (amount / expense.participants.length)
          }
          
          calculationDetails[person.id].paid.push({
            amount: actualAmount,
            originalAmount: amount,
            description: "支付费用"
          })
        }
      })
      balances[person.id] += totalPaid
    })
    
    // 计算每个人需要分摊的金额
    people.forEach(person => {
      person.expenses.forEach(expense => {
        if (expense.amount && expense.participants && expense.participants.length > 0) {
          const splitAmount = expense.amount / expense.participants.length
          
          // 获取参与人姓名
          const participantNames = []
          expense.participants.forEach(participantId => {
            const participant = people.find(p => p.id === participantId)
            if (participant) {
              participantNames.push(participant.name)
            }
          })
          
          expense.participants.forEach(participantId => {
            balances[participantId] -= splitAmount
            
            // 记录分摊详情
            if (participantId !== person.id) { // 不记录支付者自己的分摊
              calculationDetails[participantId].owes.push({
                amount: splitAmount,
                description: "分摊" + person.name + "的费用(" + participantNames.join(",") + "参与)",
                payer: person.name,
                participants: participantNames
              })
            }
          })
        }
      })
    })
    
    // 保存原始余额（应用汇率前）
    const originalBalances = { ...balances }
    
    // 应用汇率
    if (exchangeRateSwitch) {
      Object.keys(balances).forEach(personId => {
        balances[personId] *= exchangeRate
      })
    }
    
    // 生成结算建议
    const creditors = []
    const debtors = []
    
    Object.keys(balances).forEach(personId => {
      const person = people.find(p => p.id === parseInt(personId))
      if (person) {
        const balance = balances[personId]
        if (balance > 0) {
          creditors.push({ person, amount: balance })
        } else if (balance < 0) {
          debtors.push({ person, amount: -balance })
        }
      }
    })
    
    // 排序：债权人按金额降序，债务人按金额降序
    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)
    
    // 生成转账建议
    const transfers = []
    let creditorIndex = 0
    let debtorIndex = 0
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]
      
      const transferAmount = Math.min(creditor.amount, debtor.amount)
      
      // 生成详细的计算公式
      const debtorDetails = calculationDetails[debtor.person.id]
      const formulaParts = []
      
      // 添加债务人的支出部分
      if (debtorDetails && debtorDetails.paid && debtorDetails.paid.length > 0) {
        debtorDetails.paid.forEach(paid => {
          if (paid.originalAmount && paid.originalAmount !== paid.amount) {
            // 需要找到这笔费用对应的参与人数
            let participantCount = 2; // 默认为2
            // 查找这笔费用在expenses中的记录，以获取正确的参与人数
            const expense = debtor.person.expenses.find(e => e.amount === paid.originalAmount)
            if (expense && expense.participants) {
              participantCount = expense.participants.length
            }
            formulaParts.push(paid.amount.toFixed(2) + '+(' + paid.originalAmount.toFixed(2) + '-' + (paid.originalAmount / participantCount).toFixed(2) + ')')
          } else {
            formulaParts.push(paid.amount.toFixed(2))
          }
        })
      }
      
      // 添加债务人的分摊部分
      if (debtorDetails && debtorDetails.owes && debtorDetails.owes.length > 0) {
        debtorDetails.owes.forEach(owes => {
          formulaParts.push('-' + owes.amount.toFixed(2))
        })
      }
      
      // 计算债务人的原始余额
      const debtorOriginalBalance = originalBalances[debtor.person.id]
      
      // 计算债务人在汇率换算后的总应付金额
      let debtorTotalAfterExchange = debtorOriginalBalance * exchangeRate
      
      // 计算当前转账金额占总应付金额的比例
      const transferRatio = transferAmount / Math.abs(debtorTotalAfterExchange)
      
      // 组合公式，使用原始余额中的对应部分
      let formula = '[' + formulaParts.join('+') + ']×' + exchangeRate.toFixed(2) + '×' + transferRatio.toFixed(2)
      
      transfers.push({
        from: debtor.person,
        to: creditor.person,
        amount: transferAmount,
        formula: formula
      })
      
      // 更新余额
      creditor.amount -= transferAmount
      debtor.amount -= transferAmount
      
      // 移动指针
      if (creditor.amount === 0) creditorIndex++
      if (debtor.amount === 0) debtorIndex++
    }
    
    // 计算原始支付矩阵（抵消前的明细）
    const originalPaymentMatrix = {}
    people.forEach(payer => {
      originalPaymentMatrix[payer.id] = {}
      people.forEach(payee => {
        originalPaymentMatrix[payer.id][payee.id] = 0
      })
    })
    
    // 填充原始支付矩阵
    people.forEach(person => {
      person.expenses.forEach(expense => {
        if (expense.amount && expense.participants && expense.participants.length > 0) {
          const splitAmount = expense.amount / expense.participants.length
          expense.participants.forEach(participantId => {
            if (participantId !== person.id) {
              originalPaymentMatrix[participantId][person.id] += splitAmount
            }
          })
        }
      })
    })
    
    // 计算应用汇率后的原始支付矩阵
    const originalPaymentMatrixWithExchange = {}
    people.forEach(payer => {
      originalPaymentMatrixWithExchange[payer.id] = {}
      people.forEach(payee => {
        let amount = originalPaymentMatrix[payer.id][payee.id]
        if (exchangeRateSwitch) {
          amount *= exchangeRate
        }
        originalPaymentMatrixWithExchange[payer.id][payee.id] = amount
      })
    })
    
    return { 
      transfers, 
      balances, 
      exchangeRate, 
      calculationDetails, 
      originalBalances,
      originalPaymentMatrix: originalPaymentMatrixWithExchange
    }
  }

  // 显示帮助弹窗
  const openHelpModal = () => {
    setIsHelpModalOpen(true)
  }

  // 关闭帮助弹窗
  const closeHelpModal = () => {
    setIsHelpModalOpen(false)
  }

  // 处理汇率变化
  const handleExchangeRateChange = (value) => {
    setExchangeRate(parseFloat(value) || 0)
  }

  // 计算结算结果
  const settlementResult = calculateSettlements(exchangeRateSwitch)
  const { transfers, balances } = settlementResult

  return (
    <div className="container">
      {/* 标题区域 */}
      <div className="header">
        <h1 className="title">AA分账计算器</h1>
        <p className="subtitle">简单快捷地进行多人费用分摊计算</p>
      </div>

      {/* 主内容区域 */}
      <div className="main-content">
        {/* 输入区域 */}
        <div className="input-section">
          <div className="section-header">
            <h2 className="section-title">费用录入</h2>
            <div className="help-icon" onClick={openHelpModal}>
              <span>?</span>
            </div>
          </div>
          
          <div className="people-container">
            {people.map(person => (
              <div key={person.id} className="person-row">
                <div className="person-header">
                  <input
                    className="name-input"
                    value={person.name}
                    onChange={(e) => updatePersonName(person.id, e.target.value)}
                    placeholder="输入姓名"
                  />
                  <button className="add-expense-btn" onClick={() => addExpense(person.id)}>
                    <span className="button-text">添加费用</span>
                  </button>
                  {people.length > 1 && (
                    <button className="delete-person-btn" onClick={() => deletePerson(person.id)}>
                      <span className="button-text">删除</span>
                    </button>
                  )}
                </div>
                
                <div className="expenses-container">
                  {person.expenses.length > 0 ? (
                    person.expenses.map(expense => (
                      <div key={expense.id} className="expense-item">
                        <input
                          className="expense-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={expense.amount || ''}
                          onChange={(e) => updateExpenseAmount(person.id, expense.id, e.target.value)}
                          placeholder="金额"
                        />
                        <div className="participants-container">
                          {people.map(p => (
                            <label key={p.id} className="participant-checkbox">
                              <input
                                type="checkbox"
                                checked={expense.participants.includes(p.id)}
                                onChange={(e) => {
                                  const newParticipants = e.target.checked 
                                    ? [...expense.participants, p.id]
                                    : expense.participants.filter(id => id !== p.id)
                                  updateExpenseParticipants(person.id, expense.id, newParticipants)
                                }}
                              />
                              <span className="participant-name">{p.name}</span>
                            </label>
                          ))}
                        </div>
                        <input
                          className="expense-note"
                          value={expense.note}
                          onChange={(e) => updateExpenseNote(person.id, expense.id, e.target.value)}
                          placeholder="添加备注..."
                        />
                        <div className="expense-actions">
                          <span className="split-amount">
                            平摊: ¥{(expense.amount ? (expense.amount / expense.participants.length).toFixed(2) : '0.00')}
                          </span>
                          <button className="delete-expense-btn" onClick={() => deleteExpense(person.id, expense.id)}>
                            <span className="button-text">删除</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-expenses">暂无费用</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="action-buttons">
            <button className="add-person-btn" onClick={addPerson}>
              <span className="button-text">添加参与人</span>
            </button>
            <button className="load-test-data-btn" onClick={loadTestData}>
              <span className="button-text">加载测试数据</span>
            </button>
          </div>
        </div>

        {/* 输出区域 */}
        <div className="output-section">
          <div className="section-header">
            <h2 className="section-title">结算结果</h2>
          </div>
          

          
          <div className="settlement-results">
            {people.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">请先添加参与人</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="balanced-state">
                <p className="balanced-state-text">完美！所有费用已平衡</p>
                <p className="balanced-state-subtext">当前没有需要结算的款项</p>
              </div>
            ) : (
              <>
                {/* 转账记录 */}
                {transfers.map((transfer, index) => (
                  <div key={index} className="transfer-row">
                    <div className="transfer-info">
                      <span className="transfer-from">{transfer.from.name}</span>
                      <span className="transfer-arrow">→</span>
                      <span className="transfer-to">{transfer.to.name}</span>
                      <span className="transfer-amount">¥{transfer.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                
                {/* 净收入人员 */}
                <div className="net-income-section">
                  <h3 className="section-subtitle">净收入人员：</h3>
                  {people.map(person => {
                    if (balances[person.id] > 0) {
                      return (
                        <div key={person.id} className="net-income-row">
                          <span className="net-income-name">{person.name}</span>
                          <span className="net-income-amount">+¥{balances[person.id].toFixed(2)}</span>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
                
                {/* 支付明细表格 */}
                <div className="payment-detail">
                  <h3 className="section-subtitle">支付明细：</h3>
                  
                  {/* 功能开关 */}
                  <div className="function-switches">
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={offsetSwitch} 
                        onChange={(e) => setOffsetSwitch(e.target.checked)}
                      />
                      <span className="switch-text">抵消</span>
                      <span className="switch-tooltip">自动抵消两个人之间的相互债务，只显示净支付金额</span>
                    </label>
                    
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={indirectPaymentSwitch} 
                        onChange={(e) => setIndirectPaymentSwitch(e.target.checked)}
                      />
                      <span className="switch-text">代还</span>
                      <span className="switch-tooltip">允许通过中间人进行债务传递，优化还款路径</span>
                    </label>
                    
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={exchangeRateSwitch} 
                        onChange={(e) => setExchangeRateSwitch(e.target.checked)}
                      />
                      <span className="switch-text">汇率换算</span>
                      {exchangeRateSwitch && (
                        <input
                          id="exchange-rate"
                          className="exchange-rate-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={exchangeRate}
                          onChange={(e) => handleExchangeRateChange(e.target.value)}
                          placeholder="7.12"
                        />
                      )}
                      <span className="switch-tooltip">使用指定汇率进行货币换算</span>
                    </label>
                    

                  </div>
                  
                  <div className="detail-table-container">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>支付方</th>
                          <th>收款方</th>
                          <th>金额</th>
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!offsetSwitch ? (
                          // 不勾选抵消时，显示抵消前的明细
                          people.map(payer => {
                            return people.map(payee => {
                              if (payer.id === payee.id) return null;
                              const amount = settlementResult.originalPaymentMatrix[payer.id][payee.id];
                              if (amount <= 0) return null;
                              return (
                                <tr key={`${payer.id}-${payee.id}`} className="table-row">
                                  <td className="table-cell">{payer.name}</td>
                                  <td className="table-cell">{payee.name}</td>
                                  <td className="table-cell amount-cell">{amount.toFixed(2)}</td>
                                  <td className="table-cell status-cell">
                                    <span className="status-pending">待支付</span>
                                  </td>
                                </tr>
                              );
                            });
                          }).flat()
                        ) : !indirectPaymentSwitch ? (
                          // 勾选抵消但不勾选代还时，显示只应用抵消功能的明细
                          (() => {
                            // 计算只应用抵消功能的矩阵
                            const offsetOnlyMatrix = {};
                            people.forEach(payer => {
                              offsetOnlyMatrix[payer.id] = {};
                              people.forEach(payee => {
                                offsetOnlyMatrix[payer.id][payee.id] = settlementResult.originalPaymentMatrix[payer.id][payee.id];
                              });
                            });
                            
                            // 应用抵消逻辑
                            people.forEach(payer => {
                              people.forEach(payee => {
                                if (payer.id === payee.id) return;
                                const amountAToB = offsetOnlyMatrix[payer.id][payee.id];
                                const amountBToA = offsetOnlyMatrix[payee.id][payer.id];
                                if (amountAToB > 0 && amountBToA > 0) {
                                  const minAmount = Math.min(amountAToB, amountBToA);
                                  offsetOnlyMatrix[payer.id][payee.id] -= minAmount;
                                  offsetOnlyMatrix[payee.id][payer.id] -= minAmount;
                                }
                              });
                            });
                            
                            // 生成表格行
                            const rows = [];
                            people.forEach(payer => {
                              people.forEach(payee => {
                                if (payer.id === payee.id) return;
                                const amount = offsetOnlyMatrix[payer.id][payee.id];
                                if (amount <= 0) return;
                                rows.push(
                                  <tr key={`${payer.id}-${payee.id}`} className="table-row">
                                    <td className="table-cell">{payer.name}</td>
                                    <td className="table-cell">{payee.name}</td>
                                    <td className="table-cell amount-cell">{amount.toFixed(2)}</td>
                                    <td className="table-cell status-cell">
                                      <span className="status-pending">待支付</span>
                                    </td>
                                  </tr>
                                );
                              });
                            });
                            return rows;
                          })()
                        ) : (
                          // 同时勾选抵消和代还时，显示抵消加代还的效果
                          transfers.map((transfer, index) => (
                            <tr key={index} className="table-row">
                              <td className="table-cell">{transfer.from.name}</td>
                              <td className="table-cell">{transfer.to.name}</td>
                              <td className="table-cell amount-cell">{transfer.amount.toFixed(2)}</td>
                              <td className="table-cell status-cell">
                                <span className="status-pending">待支付</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* 功能说明 */}
                <div className="feature-explanation">
                  <h3 className="section-subtitle">功能说明：</h3>
                  <div className="explanation-content">
                    <p><strong>抵消：</strong>当两个人之间互有债务时，系统会自动计算净支付金额，减少转账次数。例如：A欠B 100元，B欠A 50元，抵消后只需要A支付B 50元。</p>
                    <p><strong>代还：</strong>通过中间人进行债务传递，进一步减少转账次数。例如：A欠B 100元，B欠C 100元，代还后只需要A直接支付C 100元。</p>
                    <p><strong>汇率换算：</strong>使用指定的汇率将结算金额转换为目标货币，方便国际旅行或跨境消费的费用分摊。</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="footer">
        <p className="footer-text">© AA分账计算器 · Sepzok</p>
      </footer>

      {/* 帮助弹窗 */}
      {isHelpModalOpen && (
        <div className="help-modal">
          <div className="help-modal-content">
            <div className="help-modal-header">
              <h2 className="help-modal-title">费用录入快捷键说明</h2>
              <button className="help-modal-close" onClick={closeHelpModal}>
                <span className="button-text">×</span>
              </button>
            </div>
            <div className="help-content">
              <div className="help-section">
                <h3 className="help-section-title">键盘快捷键</h3>
                <p className="help-section-text">在费用录入过程中，您可以使用以下快捷键提高效率：</p>
                <ul className="help-list">
                  <li className="help-list-item">Enter - 在姓名输入框中按回车键，快速添加当前人员的费用项</li>
                  <li className="help-list-item">Tab - 在姓名输入框中按Tab键，切换到下一个参与人的姓名输入框并全选内容</li>
                </ul>
              </div>
              <div className="help-section">
                <h3 className="help-section-title">使用技巧</h3>
                <ul className="help-list">
                  <li className="help-list-item">1. 页面加载时会自动聚焦到第一个参与人的姓名输入框</li>
                  <li className="help-list-item">2. 使用Tab键可以在不同参与人之间快速切换</li>
                  <li className="help-list-item">3. 按回车键可以快速添加费用，无需鼠标点击</li>
                  <li className="help-list-item">4. 添加费用后，可以直接在金额输入框中输入费用金额</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
