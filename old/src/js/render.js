// 渲染模块
// 负责渲染页面元素和处理DOM操作
import { getPeople } from './data.js';
import { calculateSettlements } from './calculator.js';

// 渲染所有人员行
export function renderPeople() {
    const people = getPeople();
    const container = document.getElementById('people-container');
    container.innerHTML = '';
    
    for (let i = 0; i < people.length; i++) {
        const personRow = createPersonRow(people[i]);
        container.appendChild(personRow);
    }
    
    // 为所有费用项添加事件监听器
    setupExpenseEventListeners();
    
    // 只有在有人员且有费用时才计算结算
    if (people.length > 0 && hasExpenses()) {
        const roundSwitch = document.getElementById('round-switch');
        calculateAndRenderSettlements(roundSwitch ? roundSwitch.checked : false);
    }
}

// 创建单个人员行
function createPersonRow(person) {
    const people = getPeople();
    const row = document.createElement('div');
    row.className = 'person-row bg-gray-50 rounded-lg p-2 transition-all duration-300';
    row.dataset.id = person.id;
    
    // 构建HTML结构
    let deleteButtonHTML = '';
    if (people.length > 1) {
        deleteButtonHTML = '<button class="delete-person-btn px-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-r-md transition-colors">' +
            '<i class="fa fa-trash-o"></i>' +
        '</button>';
    }
    
    let expensesHTML = '';
    if (person.expenses.length > 0) {
        for (let i = 0; i < person.expenses.length; i++) {
            expensesHTML += createExpenseHTML(person.expenses[i], person.id);
        }
    } else {
        expensesHTML = '<p class="text-gray-500 text-sm italic">暂无费用</p>';
    }
    
    row.innerHTML = 
        '<div class="flex items-center gap-2">' +
            '<div class="flex-1">' +
                '<input type="text" value="' + person.name + '" ' +
                    'class="w-full px-2 py-1 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary/50 name-input"' +
                    'placeholder="输入姓名">' +
            '</div>' +
            '<button class="add-expense-btn px-2 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors">' +
                '<i class="fa fa-plus"></i>' +
            '</button>' +
            deleteButtonHTML +
        '</div>' +
        '<div class="mt-2 expenses-container space-y-2">' +
            expensesHTML +
        '</div>';
    
    return row;
}

// 创建费用项HTML
function createExpenseHTML(expense, personId) {
    const people = getPeople();
    const allPeople = [];
    for (let i = 0; i < people.length; i++) {
        allPeople.push(people[i].id);
    }
    const selectedPeople = expense.participants || allPeople;
    
    let peopleCheckboxesHTML = '';
    for (let i = 0; i < people.length; i++) {
        const p = people[i];
        let isChecked = '';
        for (let j = 0; j < selectedPeople.length; j++) {
            if (selectedPeople[j] === p.id) {
                isChecked = 'checked';
                break;
            }
        }
        peopleCheckboxesHTML += 
            '<label class="flex items-center p-1 rounded hover:bg-gray-50 cursor-pointer">' +
                '<input type="checkbox" class="participant-checkbox h-3 w-3 text-primary rounded" ' +
                    'data-person-id="' + p.id + '" ' + isChecked + '>' +
                '<span class="ml-1 text-xs text-gray-700">' + p.name + '</span>' +
            '</label>';
    }
    
    const splitAmount = expense.amount ? ((expense.amount || 0) / (selectedPeople.length || 1)).toFixed(2) : '0.00';
    const splitAmountText = '平摊: ¥' + splitAmount;
    
    return '<div class="expense-item-wrapper">' +
            '<div class="expense-item bg-white border border-gray-200 rounded-md p-2 transition-all" data-id="' + expense.id + '">' +
                '<div class="flex items-start gap-2">' +
                    '<div class="w-24 flex-shrink-0">' +
                        '<input type="number" min="0" step="0.01" value="' + (expense.amount || '') + '" ' +
                            'class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 expense-amount"' +
                            'placeholder="金额">' +
                    '</div>' +
                    '<div class="flex-1">' +
                        '<div class="flex flex-wrap gap-1">' +
                            peopleCheckboxesHTML +
                        '</div>' +
                        '<div class="mt-1">' +
                            '<input type="text" value="' + (expense.note || '') + '" ' +
                                'class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/50 expense-note"' +
                                'placeholder="添加备注...">' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex items-center gap-1 flex-shrink-0">' +
                        '<div class="text-xs text-gray-500 whitespace-nowrap">' +
                            splitAmountText +
                        '</div>' +
                        '<button class="delete-expense-btn px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">' +
                            '<i class="fa fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// 为所有费用项添加事件监听器的辅助函数
export function setupExpenseEventListeners() {
    const personRows = document.querySelectorAll('.person-row');
    
    personRows.forEach(row => {
        const personId = parseInt(row.dataset.id);
        
        // 为姓名输入框添加事件监听器
        const nameInput = row.querySelector('.name-input');
        if (nameInput) {
            nameInput.addEventListener('input', function(e) {
                import('./data.js').then(({ updatePersonName }) => {
                    updatePersonName(personId, e.target.value);
                    calculateAndRenderSettlements();
                });
            });
            
            // 为姓名输入框添加键盘事件监听
            nameInput.addEventListener('keydown', function(e) {
                // 回车键：添加当前人员的费用
                if (e.key === 'Enter') {
                    e.preventDefault();
                    import('./data.js').then(({ addExpense }) => {
                        const expense = addExpense(personId);
                        if (expense) {
                            renderPeople();
                        }
                    });
                }
                // Tab键：切换到下一个参与人的姓名输入框
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    // 找到当前人员索引
                    const people = getPeople();
                    let currentIndex = -1;
                    for (let i = 0; i < people.length; i++) {
                        if (people[i].id === personId) {
                            currentIndex = i;
                            break;
                        }
                    }
                    
                    // 计算下一个人员的索引
                    const nextIndex = (currentIndex + 1) % people.length;
                    const nextPersonId = people[nextIndex].id;
                    
                    // 找到下一个人员的姓名输入框
                    const nextPersonRow = document.querySelector('.person-row[data-id="' + nextPersonId + '"]');
                    if (nextPersonRow) {
                        const nextNameInput = nextPersonRow.querySelector('.name-input');
                        if (nextNameInput) {
                            nextNameInput.focus();
                            nextNameInput.select();
                        }
                    }
                }
            });
        }
        
        // 为添加费用按钮添加事件监听器
        const addExpenseBtn = row.querySelector('.add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', function() {
                import('./data.js').then(({ addExpense }) => {
                    const expense = addExpense(personId);
                    if (expense) {
                        renderPeople();
                    }
                });
            });
        }
        
        // 为删除人员按钮添加事件监听器
        const deletePersonBtn = row.querySelector('.delete-person-btn');
        if (deletePersonBtn) {
            deletePersonBtn.addEventListener('click', function() {
                import('./data.js').then(({ deletePerson }) => {
                    deletePerson(personId);
                    renderPeople();
                });
            });
        }
        
        // 为费用项添加事件监听器
        const expenseItems = row.querySelectorAll('.expense-item');
        expenseItems.forEach(expenseItem => {
            const expenseId = parseInt(expenseItem.dataset.id);
            
            // 为金额输入框添加事件监听器
            const amountInput = expenseItem.querySelector('.expense-amount');
            if (amountInput) {
                amountInput.addEventListener('input', function(e) {
                    const amount = parseFloat(e.target.value) || 0;
                    import('./data.js').then(({ updateExpenseAmount }) => {
                        updateExpenseAmount(personId, expenseId, amount);
                        calculateAndRenderSettlements();
                    });
                });
            }
            
            // 为备注输入框添加事件监听器
            const noteInput = expenseItem.querySelector('.expense-note');
            if (noteInput) {
                noteInput.addEventListener('input', function(e) {
                    import('./data.js').then(({ updateExpenseNote }) => {
                        updateExpenseNote(personId, expenseId, e.target.value);
                    });
                });
            }
            
            // 为参与人复选框添加事件监听器
            const checkboxes = expenseItem.querySelectorAll('.participant-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const selectedParticipants = [];
                    expenseItem.querySelectorAll('.participant-checkbox:checked').forEach(cb => {
                        selectedParticipants.push(parseInt(cb.dataset.personId));
                    });
                    import('./data.js').then(({ updateExpenseParticipants }) => {
                        updateExpenseParticipants(personId, expenseId, selectedParticipants);
                        calculateAndRenderSettlements();
                    });
                });
            });
            
            // 为删除费用按钮添加事件监听器
            const deleteExpenseBtn = expenseItem.querySelector('.delete-expense-btn');
            if (deleteExpenseBtn) {
                deleteExpenseBtn.addEventListener('click', function() {
                    import('./data.js').then(({ deleteExpense }) => {
                        deleteExpense(personId, expenseId);
                        renderPeople();
                    });
                });
            }
        });
    });
}

// 计算并渲染结算结果
export function calculateAndRenderSettlements(applyRound = false) {
    const result = calculateSettlements(applyRound);
    renderSettlementResults(result.transfers, result.balances, result.exchangeRate, result.applyRound, result.calculationDetails, result.originalBalances);
}

// 渲染结算结果
function renderSettlementResults(transfers, balances, exchangeRate, applyRound, calculationDetails, originalBalances) {
    const people = getPeople();
    const container = document.getElementById('settlement-results');
    
    // 清空容器并添加淡入动画类
    container.classList.add('opacity-0');
    
    if (people.length === 0) {
        container.innerHTML = 
            '<div class="text-gray-500 text-center py-12">' +
                '<i class="fa fa-user-plus text-4xl mb-4 text-gray-300"></i>' +
                '<p class="text-lg">请先添加参与人</p>' +
                '<p class="text-sm mt-2">点击"添加参与人"按钮开始</p>' +
            '</div>';
    } else if (transfers.length === 0) {
        // 检查是否有费用输入
        let hasExpenses = false;
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            for (let j = 0; j < person.expenses.length; j++) {
                if (person.expenses[j].amount > 0) {
                    hasExpenses = true;
                    break;
                }
            }
            if (hasExpenses) break;
        }
        
        if (!hasExpenses) {
            container.innerHTML = 
                '<div class="text-gray-500 text-center py-12">' +
                    '<i class="fa fa-credit-card text-4xl mb-4 text-gray-300"></i>' +
                    '<p class="text-lg">请添加费用</p>' +
                    '<p class="text-sm mt-2">点击"添加费用"按钮输入各项支出</p>' +
                '</div>';
        } else {
            container.innerHTML = 
                '<div class="text-green-600 text-center py-12">' +
                    '<i class="fa fa-check-circle text-4xl mb-4 text-green-300"></i>' +
                    '<p class="text-lg">完美！所有费用已平衡</p>' +
                    '<p class="text-sm mt-2 text-gray-500">当前没有需要结算的款项</p>' +
                '</div>';
        }
    } else {
        container.innerHTML = '';
        
        // 按人员分组转账记录
        const transfersByPerson = {};
        for (let i = 0; i < transfers.length; i++) {
            const transfer = transfers[i];
            if (!transfersByPerson[transfer.from.id]) {
                transfersByPerson[transfer.from.id] = [];
            }
            transfersByPerson[transfer.from.id].push(transfer);
        }
        
        // 渲染每个人的转账记录
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            const personTransfers = transfersByPerson[person.id] || [];
            
            if (personTransfers.length > 0) {
                const resultRow = document.createElement('div');
                resultRow.className = 'result-row bg-gray-50 rounded-lg p-4 transition-all';
                
                let totalAmount = 0;
                let transferDetailsHTML = '';
                for (let j = 0; j < personTransfers.length; j++) {
                    const transfer = personTransfers[j];
                    totalAmount += transfer.amount;
                    transferDetailsHTML += 
                        '<div class="transfer-detail flex flex-col py-2 border-b border-gray-100 last:border-0">' +
                            '<div class="flex items-center justify-between mb-1">' +
                                '<span class="text-gray-700">支付给 ' + transfer.to.name + '</span>' +
                                '<span class="text-red-600 font-medium">-¥' + transfer.amount.toFixed(2) + '</span>' +
                            '</div>' +
                            '<div class="text-xs text-gray-500 italic">计算: ' + transfer.formula + '</div>' +
                        '</div>';
                }
                
                // 添加详细计算过程
                let calculationHTML = '';
                if (calculationDetails && calculationDetails[person.id]) {
                    const details = calculationDetails[person.id];
                    
                    // 支出详情
                    calculationHTML += '<div class="calculation-section mt-3 p-3 bg-blue-50 rounded">';
                    calculationHTML += '<h5 class="text-sm font-medium text-blue-800 mb-2">支出详情 (+)</h5>';
                    if (details.paid.length > 0) {
                        for (let k = 0; k < details.paid.length; k++) {
                            const paid = details.paid[k];
                            if (paid.originalAmount && paid.originalAmount !== paid.amount) {
                                calculationHTML += '<div class="text-xs text-blue-700">实际承担: +¥' + paid.amount.toFixed(2) + ' (支付总额: ¥' + paid.originalAmount.toFixed(2) + ') ' + paid.description + '</div>';
                            } else {
                                calculationHTML += '<div class="text-xs text-blue-700">+¥' + paid.amount.toFixed(2) + ' ' + paid.description + '</div>';
                            }
                        }
                    } else {
                        calculationHTML += '<div class="text-xs text-gray-500">无支出记录</div>';
                    }
                    calculationHTML += '</div>';
                    
                    // 分摊详情
                    calculationHTML += '<div class="calculation-section mt-2 p-3 bg-orange-50 rounded">';
                    calculationHTML += '<h5 class="text-sm font-medium text-orange-800 mb-2">分摊详情 (-)</h5>';
                    if (details.owes.length > 0) {
                        for (let k = 0; k < details.owes.length; k++) {
                            const owes = details.owes[k];
                            calculationHTML += '<div class="text-xs text-orange-700">-¥' + owes.amount.toFixed(2) + ' ' + owes.description + '</div>';
                        }
                    } else {
                        calculationHTML += '<div class="text-xs text-gray-500">无分摊记录</div>';
                    }
                    calculationHTML += '</div>';
                    
                    // 汇总计算
                    const totalPaid = details.paid.reduce(function(sum, item) { return sum + item.amount; }, 0);
                    const totalOwes = details.owes.reduce(function(sum, item) { return sum + item.amount; }, 0);
                    const originalBalance = totalPaid - totalOwes;
                    
                    calculationHTML += '<div class="calculation-section mt-2 p-3 bg-gray-100 rounded">';
                    calculationHTML += '<h5 class="text-sm font-medium text-gray-800 mb-2">汇总计算</h5>';
                    calculationHTML += '<div class="text-xs text-gray-700">支出总额: +¥' + totalPaid.toFixed(2) + '</div>';
                    calculationHTML += '<div class="text-xs text-gray-700">分摊总额: -¥' + totalOwes.toFixed(2) + '</div>';
                    calculationHTML += '<div class="text-xs text-gray-700 font-medium">原始余额: ¥' + originalBalance.toFixed(2) + '</div>';
                    calculationHTML += '<div class="text-xs text-gray-700">汇率换算: ' + originalBalance.toFixed(2) + ' × ' + exchangeRate.toFixed(2) + '</div>';
                    if (applyRound) {
                        calculationHTML += '<div class="text-xs text-gray-700">四舍五入: ≈ ¥' + Math.round(originalBalance * exchangeRate).toFixed(2) + '</div>';
                    }
                    calculationHTML += '<div class="text-xs text-gray-800 font-bold">最终余额: ¥' + balances[person.id].toFixed(2) + '</div>';
                    calculationHTML += '</div>';
                }
                
                resultRow.innerHTML = 
                    '<div class="flex justify-between items-center">' +
                        '<div class="font-medium text-gray-800">' + person.name + ' 需要支付</div>' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="text-red-600 font-semibold text-lg">¥' + totalAmount.toFixed(2) + '</span>' +
                            '<button class="toggle-details px-2 py-1 text-primary hover:bg-blue-50 rounded">' +
                                '<i class="fa fa-chevron-down"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="transfer-details mt-3 space-y-1">' +
                        transferDetailsHTML +
                        calculationHTML +
                    '</div>';
                
                // 添加详情切换事件
                const toggleBtn = resultRow.querySelector('.toggle-details');
                const details = resultRow.querySelector('.transfer-details');
                
                // 初始化时设置为收起状态
                details.classList.add('hidden');
                details.style.overflow = 'hidden';
                details.style.transition = 'max-height 0.3s ease';
                
                toggleBtn.addEventListener('click', function() {
                    if (details.style.maxHeight && details.style.maxHeight !== '0px') {
                        // 当前是展开状态，需要收起
                        details.style.maxHeight = '0';
                        setTimeout(function() {
                            details.classList.add('hidden');
                        }, 300);
                    } else {
                        // 当前是收起状态，需要展开
                        details.classList.remove('hidden');
                        setTimeout(function() {
                            details.style.maxHeight = details.scrollHeight + 'px';
                        }, 10);
                    }
                    
                    const icon = toggleBtn.querySelector('i');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                });
                
                container.appendChild(resultRow);
            }
        }
        
        // 添加净收入人员的显示
        const netIncomePeople = [];
        for (let i = 0; i < people.length; i++) {
            if (balances[people[i].id] > 0) {
                netIncomePeople.push(people[i]);
            }
        }
        
        if (netIncomePeople.length > 0) {
            const incomeHeader = document.createElement('div');
            incomeHeader.className = 'font-medium text-gray-700 mt-6 mb-2';
            incomeHeader.textContent = '净收入人员：';
            container.appendChild(incomeHeader);
            
            for (let i = 0; i < netIncomePeople.length; i++) {
                const person = netIncomePeople[i];
                const incomeRow = document.createElement('div');
                incomeRow.className = 'flex justify-between items-center p-3 bg-green-50 rounded-lg transition-all hover:shadow-md';
                incomeRow.innerHTML = 
                    '<div>' + person.name + '</div>' +
                    '<div class="text-green-600 font-medium">+¥' + balances[person.id].toFixed(2) + '</div>';
                container.appendChild(incomeRow);
            }
        }
        
        // 添加两人之间支付明细
        if (transfers.length > 0) {
            const summaryHeader = document.createElement('div');
            summaryHeader.className = 'font-medium text-gray-700 mt-6 mb-2';
            summaryHeader.textContent = '支付明细：';
            container.appendChild(summaryHeader);
            
            // 添加抵消开关
            const offsetSwitchContainer = document.createElement('div');
            offsetSwitchContainer.className = 'flex items-center mb-3 relative';
            
            const offsetSwitchLabel = document.createElement('label');
            offsetSwitchLabel.className = 'flex items-center cursor-pointer';
            
            const offsetSwitchCheckbox = document.createElement('input');
            offsetSwitchCheckbox.type = 'checkbox';
            offsetSwitchCheckbox.id = 'offset-switch';
            offsetSwitchCheckbox.className = 'mr-2';
            offsetSwitchCheckbox.checked = false; // 默认不勾选抵消
            
            const offsetSwitchText = document.createElement('span');
            offsetSwitchText.className = 'text-sm text-gray-600';
            offsetSwitchText.textContent = '抵消';
            
            // 添加悬停说明
            const offsetTooltip = document.createElement('div');
            offsetTooltip.className = 'tooltip absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 w-48 opacity-0 pointer-events-none transition-opacity duration-200';
            offsetTooltip.textContent = '自动抵消两个人之间的相互债务，只显示净支付金额，减少转账次数';
            
            offsetSwitchLabel.appendChild(offsetSwitchCheckbox);
            offsetSwitchLabel.appendChild(offsetSwitchText);
            offsetSwitchContainer.appendChild(offsetSwitchLabel);
            offsetSwitchContainer.appendChild(offsetTooltip);
            
            // 添加悬停事件
            offsetSwitchContainer.addEventListener('mouseenter', function() {
                offsetTooltip.style.opacity = '1';
            });
            
            offsetSwitchContainer.addEventListener('mouseleave', function() {
                offsetTooltip.style.opacity = '0';
            });
            
            // 添加代还开关
            const switchContainer = document.createElement('div');
            switchContainer.className = 'flex items-center mb-3 ml-4 relative';
            
            const switchLabel = document.createElement('label');
            switchLabel.className = 'flex items-center cursor-pointer';
            
            const switchCheckbox = document.createElement('input');
            switchCheckbox.type = 'checkbox';
            switchCheckbox.id = 'indirect-payment-switch';
            switchCheckbox.className = 'mr-2';
            switchCheckbox.checked = false; // 默认不勾选代还
            
            const switchText = document.createElement('span');
            switchText.className = 'text-sm text-gray-600';
            switchText.textContent = '代还';
            
            // 添加悬停说明
            const indirectTooltip = document.createElement('div');
            indirectTooltip.className = 'tooltip absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 w-48 opacity-0 pointer-events-none transition-opacity duration-200';
            indirectTooltip.textContent = '允许通过中间人进行债务传递，优化还款路径，进一步减少转账次数';
            
            switchLabel.appendChild(switchCheckbox);
            switchLabel.appendChild(switchText);
            switchContainer.appendChild(switchLabel);
            switchContainer.appendChild(indirectTooltip);
            
            // 添加悬停事件
            switchContainer.addEventListener('mouseenter', function() {
                indirectTooltip.style.opacity = '1';
            });
            
            switchContainer.addEventListener('mouseleave', function() {
                indirectTooltip.style.opacity = '0';
            });
            
            // 添加汇率换算开关
            const exchangeSwitchContainer = document.createElement('div');
            exchangeSwitchContainer.className = 'flex items-center mb-3 ml-4';
            
            const exchangeSwitchLabel = document.createElement('label');
            exchangeSwitchLabel.className = 'flex items-center cursor-pointer';
            
            const exchangeSwitchCheckbox = document.createElement('input');
            exchangeSwitchCheckbox.type = 'checkbox';
            exchangeSwitchCheckbox.id = 'exchange-rate-switch';
            exchangeSwitchCheckbox.className = 'mr-2';
            exchangeSwitchCheckbox.checked = false; // 默认不勾选汇率换算
            
            const exchangeSwitchText = document.createElement('span');
            exchangeSwitchText.className = 'text-sm text-gray-600';
            exchangeSwitchText.textContent = '汇率换算';
            
            exchangeSwitchLabel.appendChild(exchangeSwitchCheckbox);
            exchangeSwitchLabel.appendChild(exchangeSwitchText);
            exchangeSwitchContainer.appendChild(exchangeSwitchLabel);
            
            // 添加四舍五入开关
            const roundSwitchContainer = document.createElement('div');
            roundSwitchContainer.className = 'flex items-center mb-3 ml-4';
            
            const roundSwitchLabel = document.createElement('label');
            roundSwitchLabel.className = 'flex items-center cursor-pointer';
            
            const roundSwitchCheckbox = document.createElement('input');
            roundSwitchCheckbox.type = 'checkbox';
            roundSwitchCheckbox.id = 'round-switch';
            roundSwitchCheckbox.className = 'mr-2';
            roundSwitchCheckbox.checked = false; // 默认不勾选四舍五入
            
            const roundSwitchText = document.createElement('span');
            roundSwitchText.className = 'text-sm text-gray-600';
            roundSwitchText.textContent = '四舍五入';
            
            roundSwitchLabel.appendChild(roundSwitchCheckbox);
            roundSwitchLabel.appendChild(roundSwitchText);
            roundSwitchContainer.appendChild(roundSwitchLabel);
            
            // 将四个开关放在同一行
            const switchesRow = document.createElement('div');
            switchesRow.className = 'flex items-center mb-3';
            switchesRow.appendChild(offsetSwitchContainer);
            switchesRow.appendChild(switchContainer);
            switchesRow.appendChild(exchangeSwitchContainer);
            switchesRow.appendChild(roundSwitchContainer);
            
            container.appendChild(switchesRow);
            
            // 创建一个二维数组来存储每两个人之间的支付金额（汇率换算前）
            const paymentMatrix = {};
            
            // 初始化矩阵
            for (let i = 0; i < people.length; i++) {
                paymentMatrix[people[i].id] = {};
                for (let j = 0; j < people.length; j++) {
                    paymentMatrix[people[i].id][people[j].id] = 0;
                }
            }
            
            // 计算每笔转账对应的原始金额（汇率换算前）
            for (let i = 0; i < transfers.length; i++) {
                const transfer = transfers[i];
                // 直接使用汇率换算前的金额
                paymentMatrix[transfer.from.id][transfer.to.id] += transfer.amount / exchangeRate;
            }
            
            // 创建另一个矩阵来存储代还款前的原始支付关系
            const originalPaymentMatrix = {};
            
            // 初始化原始支付矩阵
            for (let i = 0; i < people.length; i++) {
                originalPaymentMatrix[people[i].id] = {};
                for (let j = 0; j < people.length; j++) {
                    originalPaymentMatrix[people[i].id][people[j].id] = 0;
                }
            }
            
            // 计算原始支付关系（基于费用分摊）
            for (let i = 0; i < people.length; i++) {
                const person = people[i];
                for (let j = 0; j < person.expenses.length; j++) {
                    const expense = person.expenses[j];
                    if (expense.amount > 0 && expense.participants && expense.participants.length > 0) {
                        // 计算每个人应分摊的金额
                        const shareAmount = expense.amount / expense.participants.length;
                        
                        // 对于每个参与者，记录他们需要支付给费用支付者的金额
                        for (let k = 0; k < expense.participants.length; k++) {
                            const participantId = expense.participants[k];
                            // 跳过费用支付者自己
                            if (participantId !== person.id) {
                                originalPaymentMatrix[participantId][person.id] += shareAmount;
                            }
                        }
                    }
                }
            }
            
            // 只有当有多个参与人时才创建汇总表格
            if (people.length > 1) {
                // 创建汇总表格
                const summaryTable = document.createElement('div');
                summaryTable.className = 'overflow-x-auto mt-3';
                summaryTable.id = 'payment-summary-table';
                
                // 渲染表格的函数
                function renderPaymentTable(isIndirectPayment, applyExchangeRate, applyOffset, applyRound) {
                    let tableHTML = '<table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">';
                    tableHTML += '<thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方\\收款方</th>';
                    
                    // 添加表头（收款方）
                    for (let j = 0; j < people.length; j++) {
                        tableHTML += '<th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">' + people[j].name + '</th>';
                    }
                    tableHTML += '</tr></thead><tbody>';
                    
                    // 创建一个临时矩阵来存储应用抵消后的金额
                    const tempMatrix = {};
                    for (let i = 0; i < people.length; i++) {
                        tempMatrix[people[i].id] = {};
                        for (let j = 0; j < people.length; j++) {
                            tempMatrix[people[i].id][people[j].id] = 0;
                        }
                    }
                    
                    // 计算基础金额
                    for (let i = 0; i < people.length; i++) {
                        for (let j = 0; j < people.length; j++) {
                            if (i === j) continue;
                            
                            let amount;
                            
                            if (isIndirectPayment) {
                                // 代还款后：计算净支付金额
                                const amountFromAToB = paymentMatrix[people[i].id][people[j].id];
                                const amountFromBToA = paymentMatrix[people[j].id][people[i].id];
                                amount = amountFromAToB - amountFromBToA;
                            } else {
                                // 代还款前：使用原始支付矩阵
                                amount = originalPaymentMatrix[people[i].id][people[j].id];
                            }
                            
                            tempMatrix[people[i].id][people[j].id] = amount;
                        }
                    }
                    
                    // 如果需要应用抵消
                    if (applyOffset) {
                        // 找出所有人之间的最小金额，用于抵消
                        for (let i = 0; i < people.length; i++) {
                            for (let j = 0; j < people.length; j++) {
                                if (i === j) continue;
                                
                                // 找出A到B和B到A的最小正值
                                const amountAToB = tempMatrix[people[i].id][people[j].id];
                                const amountBToA = tempMatrix[people[j].id][people[i].id];
                                
                                if (amountAToB > 0 && amountBToA > 0) {
                                    const minAmount = Math.min(amountAToB, amountBToA);
                                    tempMatrix[people[i].id][people[j].id] -= minAmount;
                                    tempMatrix[people[j].id][people[i].id] -= minAmount;
                                }
                            }
                        }
                    }
                    
                    // 添加表格内容
                    for (let i = 0; i < people.length; i++) {
                        tableHTML += '<tr>';
                        tableHTML += '<td class="px-4 py-2 text-left text-xs font-medium text-gray-900">' + people[i].name + '</td>';
                        
                        for (let j = 0; j < people.length; j++) {
                            if (i === j) {
                                tableHTML += '<td class="px-4 py-2 text-center text-sm text-gray-400">-</td>';
                            } else {
                                let amount = tempMatrix[people[i].id][people[j].id];
                                
                                // 如果需要应用汇率换算
                                if (applyExchangeRate) {
                                    amount = amount * exchangeRate;
                                    // 如果需要四舍五入
                                    if (applyRound) {
                                        amount = Math.round(amount);
                                    }
                                }
                                
                                if (amount > 0) {
                                    tableHTML += '<td class="px-4 py-2 text-center text-sm text-red-600 font-medium">¥' + amount.toFixed(2) + '</td>';
                                } else {
                                    tableHTML += '<td class="px-4 py-2 text-center text-sm text-gray-400">¥0.00</td>';
                                }
                            }
                        }
                        
                        tableHTML += '</tr>';
                    }
                    
                    tableHTML += '</tbody></table>';
                    summaryTable.innerHTML = tableHTML;
                }
                
                // 初始渲染表格（默认代还款模式，不应用汇率换算，不应用抵消，不应用四舍五入）
                renderPaymentTable(true, false, false, false);
                
                // 只有当有多个参与人时才添加开关事件监听器
                if (people.length > 1) {
                    // 添加开关事件监听器
                    offsetSwitchCheckbox.addEventListener('change', function() {
                        renderPaymentTable(switchCheckbox.checked, exchangeSwitchCheckbox.checked, this.checked, roundSwitchCheckbox.checked);
                    });
                    
                    switchCheckbox.addEventListener('change', function() {
                        // 如果选择代还，自动勾选抵消
                        if (this.checked && !offsetSwitchCheckbox.checked) {
                            offsetSwitchCheckbox.checked = true;
                        }
                        renderPaymentTable(this.checked, exchangeSwitchCheckbox.checked, offsetSwitchCheckbox.checked, roundSwitchCheckbox.checked);
                    });
                    
                    exchangeSwitchCheckbox.addEventListener('change', function() {
                        renderPaymentTable(switchCheckbox.checked, this.checked, offsetSwitchCheckbox.checked, roundSwitchCheckbox.checked);
                    });
                    
                    roundSwitchCheckbox.addEventListener('change', function() {
                        renderPaymentTable(switchCheckbox.checked, exchangeSwitchCheckbox.checked, offsetSwitchCheckbox.checked, this.checked);
                    });
                }
                
                container.appendChild(summaryTable);
                
                // 添加说明文字
                const explanation = document.createElement('div');
                explanation.className = 'text-xs text-gray-500 mt-2';
                explanation.innerHTML = '<span class="text-red-600">红色数字</span>表示该行人员需要支付给该列人员的金额<br>' +
                                     '<span class="font-medium">开关说明：</span>抵消开关控制是否抵消双向支付；代还开关控制显示原始支付关系或代还后净支付结果；汇率换算开关控制是否应用汇率换算；四舍五入开关控制是否对金额进行四舍五入';
                container.appendChild(explanation);
            }
        }
    }
    
    // 添加淡入动画
    setTimeout(function() {
        container.classList.remove('opacity-0');
        container.style.transition = 'opacity 0.5s ease';
    }, 50);
}

// 检查是否有费用项
function hasExpenses() {
    const people = getPeople();
    for (let i = 0; i < people.length; i++) {
        if (people[i].expenses && people[i].expenses.length > 0) {
            return true;
        }
    }
    return false;
}
