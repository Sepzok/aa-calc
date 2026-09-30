// 数据结构：存储所有人员和费用信息
var people = [
    { id: 1, name: '人员1', expenses: [] },
    { id: 2, name: '人员2', expenses: [] },
    { id: 3, name: '人员3', expenses: [] }
];

// 初始化函数
function init() {
    renderPeople();
    document.getElementById('add-person-btn').addEventListener('click', addPerson);
    document.getElementById('load-test-data-btn').addEventListener('click', loadTestData);
    document.getElementById('calculate-btn').addEventListener('click', function() {
        var roundSwitch = document.getElementById('round-switch');
        calculateSettlements(roundSwitch ? roundSwitch.checked : false);
    });
    document.getElementById('exchange-rate').addEventListener('input', function() {
        var roundSwitch = document.getElementById('round-switch');
        calculateSettlements(roundSwitch ? roundSwitch.checked : false);
    });
    
    // 帮助弹窗事件监听器
    document.getElementById('expense-help-icon').addEventListener('click', function() {
        document.getElementById('help-modal').style.display = 'flex';
    });
    
    document.getElementById('help-modal-close').addEventListener('click', function() {
        document.getElementById('help-modal').style.display = 'none';
    });
    
    // 点击弹窗背景关闭弹窗
    document.getElementById('help-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
    
    // 默认聚焦到第一个参与人的姓名输入框并全选姓名
    setTimeout(function() {
        var firstPersonRow = document.querySelector('.person-row');
        if (firstPersonRow) {
            var nameInput = firstPersonRow.querySelector('.name-input');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }
    }, 100);
}

// 渲染所有人员行
function renderPeople() {
    var container = document.getElementById('people-container');
    container.innerHTML = '';
    
    for (var i = 0; i < people.length; i++) {
        var personRow = createPersonRow(people[i]);
        container.appendChild(personRow);
    }
    
    // 为所有费用项添加事件监听器
    setupExpenseEventListeners();
    
    // 只有在有人员且有费用时才计算结算
    if (people.length > 0 && hasExpenses()) {
        var roundSwitch = document.getElementById('round-switch');
        calculateSettlements(roundSwitch ? roundSwitch.checked : false);
    }
}

// 检查是否有费用项
function hasExpenses() {
    for (var i = 0; i < people.length; i++) {
        if (people[i].expenses && people[i].expenses.length > 0) {
            return true;
        }
    }
    return false;
}

// 创建单个人员行
function createPersonRow(person) {
    var row = document.createElement('div');
    row.className = 'person-row bg-gray-50 rounded-lg p-2 transition-all duration-300';
    row.dataset.id = person.id;
    
    // 构建HTML结构
    var deleteButtonHTML = '';
    if (people.length > 1) {
        deleteButtonHTML = '<button class="delete-person-btn px-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-r-md transition-colors">' +
            '<i class="fa fa-trash-o"></i>' +
        '</button>';
    }
    
    var expensesHTML = '';
    if (person.expenses.length > 0) {
        for (var i = 0; i < person.expenses.length; i++) {
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
    
    // 添加事件监听器
    var nameInput = row.querySelector('.name-input');
    nameInput.addEventListener('input', function(e) {
        updatePersonName(person.id, e.target.value);
    });
    
    // 为姓名输入框添加键盘事件监听
    nameInput.addEventListener('keydown', function(e) {
        // 回车键：添加当前人员的费用
        if (e.key === 'Enter') {
            e.preventDefault();
            addExpense(person.id);
        }
        // Tab键：切换到下一个参与人的姓名输入框
        else if (e.key === 'Tab') {
            e.preventDefault();
            // 找到当前人员索引
            var currentIndex = -1;
            for (var i = 0; i < people.length; i++) {
                if (people[i].id === person.id) {
                    currentIndex = i;
                    break;
                }
            }
            
            // 计算下一个人员的索引
            var nextIndex = (currentIndex + 1) % people.length;
            var nextPersonId = people[nextIndex].id;
            
            // 找到下一个人员的姓名输入框
            var nextPersonRow = document.querySelector('.person-row[data-id="' + nextPersonId + '"]');
            if (nextPersonRow) {
                var nextNameInput = nextPersonRow.querySelector('.name-input');
                if (nextNameInput) {
                    nextNameInput.focus();
                    nextNameInput.select();
                }
            }
        }
    });
    
    if (people.length > 1) {
        var deleteBtn = row.querySelector('.delete-person-btn');
        deleteBtn.addEventListener('click', function() {
            deletePerson(person.id);
        });
    }
    
    var addExpenseBtn = row.querySelector('.add-expense-btn');
    addExpenseBtn.addEventListener('click', function() {
        addExpense(person.id);
    });
    
    return row;
}

// 创建费用项HTML
function createExpenseHTML(expense, personId) {
    var allPeople = [];
    for (var i = 0; i < people.length; i++) {
        allPeople.push(people[i].id);
    }
    var selectedPeople = expense.participants || allPeople;
    
    var peopleCheckboxesHTML = '';
    for (var i = 0; i < people.length; i++) {
        var p = people[i];
        var isChecked = '';
        for (var j = 0; j < selectedPeople.length; j++) {
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
    
    var splitAmount = expense.amount ? ((expense.amount || 0) / (selectedPeople.length || 1)).toFixed(2) : '0.00';
    var splitAmountText = '平摊: ¥' + splitAmount;
    
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

// 添加新人员
function addPerson() {
    var newId = people.length > 0 ? Math.max.apply(null, people.map(function(p) { return p.id; })) + 1 : 1;
    people.push({
        id: newId,
        name: '人员' + newId,
        expenses: []
    });
    
    // 添加按钮动画反馈
    var addBtn = document.getElementById('add-person-btn');
    addBtn.classList.add('scale-95');
    setTimeout(function() {
        addBtn.classList.remove('scale-95');
    }, 200);
    
    renderPeople();
    
    // 滚动到新添加的人员行
    var newPersonRow = document.querySelector('.person-row[data-id="' + newId + '"]');
    if (newPersonRow) {
        newPersonRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newPersonRow.classList.add('bg-blue-50', 'ring-1', 'ring-primary');
        setTimeout(function() {
            newPersonRow.classList.remove('bg-blue-50', 'ring-1', 'ring-primary');
        }, 1000);
        
        // 聚焦到新人员的姓名输入框
        var nameInput = newPersonRow.querySelector('.name-input');
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    }
}

// 删除人员
function deletePerson(personId) {
    // 添加删除动画
    var personRow = document.querySelector('.person-row[data-id="' + personId + '"]');
    if (personRow) {
        personRow.classList.add('opacity-0', 'scale-95');
        personRow.style.height = personRow.offsetHeight + 'px';
        setTimeout(function() {
            personRow.style.height = '0';
            personRow.style.marginBottom = '0';
            personRow.style.paddingTop = '0';
            personRow.style.paddingBottom = '0';
            personRow.style.overflow = 'hidden';
        }, 10);
    }
    
    // 从其他费用的参与人中移除该人员
    for (var i = 0; i < people.length; i++) {
        var person = people[i];
        for (var j = 0; j < person.expenses.length; j++) {
            var expense = person.expenses[j];
            if (expense.participants) {
                var newParticipants = [];
                for (var k = 0; k < expense.participants.length; k++) {
                    if (expense.participants[k] !== personId) {
                        newParticipants.push(expense.participants[k]);
                    }
                }
                expense.participants = newParticipants;
                
                // 确保至少有一个参与人
                if (expense.participants.length === 0 && people.length > 1) {
                    var firstOtherId;
                    for (var m = 0; m < people.length; m++) {
                        if (people[m].id !== personId) {
                            firstOtherId = people[m].id;
                            break;
                        }
                    }
                    expense.participants = [firstOtherId];
                }
            }
        }
    }
    
    // 删除人员
    setTimeout(function() {
        var newPeople = [];
        for (var i = 0; i < people.length; i++) {
            if (people[i].id !== personId) {
                newPeople.push(people[i]);
            }
        }
        people = newPeople;
        renderPeople();
    }, 300);
}

// 更新人员姓名
function updatePersonName(personId, name) {
    // 更新数据中的名字
    for (var i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            people[i].name = name;
            break;
        }
    }
    
    // 更新所有费用项中参与人员的名字
    var allExpenseItems = document.querySelectorAll('.expense-item');
    for (var i = 0; i < allExpenseItems.length; i++) {
        var expenseItem = allExpenseItems[i];
        var checkboxes = expenseItem.querySelectorAll('.participant-checkbox');
        
        for (var j = 0; j < checkboxes.length; j++) {
            var checkbox = checkboxes[j];
            if (parseInt(checkbox.dataset.personId) === personId) {
                // 更新复选框旁边的名字文本
                var label = checkbox.closest('label');
                if (label) {
                    var nameSpan = label.querySelector('span');
                    if (nameSpan) {
                        nameSpan.textContent = name;
                    }
                }
            }
        }
    }
    
    var roundSwitch = document.getElementById('round-switch');
    calculateSettlements(roundSwitch ? roundSwitch.checked : false);
}

// 添加费用
function addExpense(personId) {
    var person = people.find(p => p.id === personId);
    if (!person) return;
    
    var expense = {
        id: Date.now(),
        amount: 0,
        participants: people.map(p => p.id), // 默认所有人参与
        note: '' // 添加备注字段，默认为空
    };
    
    person.expenses.push(expense);
    
    // 获取当前人员行和费用容器
    var personRow = document.querySelector('.person-row[data-id="' + personId + '"]');
    if (!personRow) return;
    
    var expensesContainer = personRow.querySelector('.expenses-container');
    if (!expensesContainer) return;
    
    // 创建新费用项HTML并添加到容器
    var expenseHTML = createExpenseHTML(expense, personId);
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = expenseHTML;
    var newExpenseElement = tempDiv.firstElementChild;
    
    // 添加淡入动画
    newExpenseElement.style.opacity = '0';
    newExpenseElement.style.transform = 'translateY(-10px)';
    expensesContainer.appendChild(newExpenseElement);
    
    // 触发动画
    setTimeout(() => {
        newExpenseElement.style.transition = 'opacity 0.3s, transform 0.3s';
        newExpenseElement.style.opacity = '1';
        newExpenseElement.style.transform = 'translateY(0)';
    }, 10);
    
    // 设置事件监听器
    setupExpenseEventListeners(newExpenseElement);
    
    // 聚焦到新添加的金额输入框
    setTimeout(() => {
        var amountInput = newExpenseElement.querySelector('.expense-amount');
        if (amountInput) {
            amountInput.focus();
        }
    }, 100);
    
    // 更新结算
    var roundSwitch = document.getElementById('round-switch');
    calculateSettlements(roundSwitch ? roundSwitch.checked : false);
}

// 删除费用
function deleteExpense(personId, expenseId) {
    for (var i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            var person = people[i];
            var newExpenses = [];
            for (var j = 0; j < person.expenses.length; j++) {
                if (person.expenses[j].id !== expenseId) {
                    newExpenses.push(person.expenses[j]);
                }
            }
            person.expenses = newExpenses;
            
            // 只删除对应的费用项，而不是重新渲染整个列表
            var expenseItem = document.querySelector('.person-row[data-id="' + personId + '"] .expense-item[data-id="' + expenseId + '"]');
            if (expenseItem) {
                var wrapper = expenseItem.closest('.expense-item-wrapper');
                if (wrapper) {
                    // 添加删除动画
                    wrapper.style.transition = 'opacity 0.3s, transform 0.3s';
                    wrapper.style.opacity = '0';
                    wrapper.style.transform = 'translateX(10px)';
                    
                    // 动画完成后移除元素
                    setTimeout(function() {
                        wrapper.remove();
                    }, 300);
                }
            }
            break;
        }
    }
    
    // 更新结算
    calculateSettlements();
}

// 更新费用金额
function updateExpenseAmount(personId, expenseId, amount) {
    for (var i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            var person = people[i];
            for (var j = 0; j < person.expenses.length; j++) {
                if (person.expenses[j].id === expenseId) {
                    person.expenses[j].amount = amount;
                    
                    // 更新UI中的平摊金额文本
                    var expenseItem = document.querySelector('.person-row[data-id="' + personId + '"] .expense-item[data-id="' + expenseId + '"]');
                    if (expenseItem) {
                        var selectedParticipants = [];
                        var checkboxes = expenseItem.querySelectorAll('.participant-checkbox:checked');
                        for (var k = 0; k < checkboxes.length; k++) {
                            selectedParticipants.push(parseInt(checkboxes[k].dataset.personId));
                        }
                        
                        var splitAmount = (amount || 0) / (selectedParticipants.length || 1);
                        var splitAmountText = '平摊: ¥' + splitAmount.toFixed(2);
                        
                        // 找到平摊金额文本元素
                        var splitAmountElement = expenseItem.querySelector('.text-xs.text-gray-500');
                        if (splitAmountElement) {
                            splitAmountElement.textContent = splitAmountText;
                        }
                    }
                    
                    // 为输入框添加交互反馈
                    var expenseInput = document.querySelector('.person-row[data-id="' + personId + '"] .expense-item[data-id="' + expenseId + '"] .expense-amount');
                    if (expenseInput) {
                        if (amount > 0) {
                            expenseInput.classList.add('border-green-500');
                            setTimeout(function() {
                                expenseInput.classList.remove('border-green-500');
                            }, 500);
                        }
                    }
                    
                    var roundSwitch = document.getElementById('round-switch');
                    calculateSettlements(roundSwitch ? roundSwitch.checked : false);
                    break;
                }
            }
            break;
        }
    }
}

// 更新费用备注
function updateExpenseNote(personId, expenseId, note) {
    for (var i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            for (var j = 0; j < people[i].expenses.length; j++) {
                if (people[i].expenses[j].id === expenseId) {
                    people[i].expenses[j].note = note;
                    break;
                }
            }
            break;
        }
    }
}

// 更新费用参与人
function updateExpenseParticipants(personId, expenseId, participants) {
    // 更新数据
    for (var i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            for (var j = 0; j < people[i].expenses.length; j++) {
                if (people[i].expenses[j].id === expenseId) {
                    people[i].expenses[j].participants = participants;
                    
                    // 更新UI中的平摊金额文本
                    var expenseItem = document.querySelector('.person-row[data-id="' + personId + '"] .expense-item[data-id="' + expenseId + '"]');
                    if (expenseItem) {
                        var expenseAmount = 0;
                        var amountInput = expenseItem.querySelector('.expense-amount');
                        if (amountInput) {
                            expenseAmount = parseFloat(amountInput.value) || 0;
                        }
                        
                        var splitAmount = expenseAmount / (participants.length || 1);
                        var splitAmountText = '平摊: ¥' + splitAmount.toFixed(2);
                        
                        // 找到平摊金额文本元素
                        var splitAmountElement = expenseItem.querySelector('.text-xs.text-gray-500');
                        if (splitAmountElement) {
                            splitAmountElement.textContent = splitAmountText;
                        }
                    }
                    
                    var roundSwitch = document.getElementById('round-switch');
                    calculateSettlements(roundSwitch ? roundSwitch.checked : false);
                    break;
                }
            }
            break;
        }
    }
}

// 计算结算结果
function calculateSettlements(applyRound) {
    var exchangeRate = parseFloat(document.getElementById('exchange-rate').value) || 1.0;
    
    // 计算每个人的总支出和应分摊金额
    var balances = {};
    
    // 初始化每个人的余额为0
    for (var i = 0; i < people.length; i++) {
        balances[people[i].id] = 0;
    }
    
    // 存储每个人的详细计算过程
    var calculationDetails = {};
    for (var i = 0; i < people.length; i++) {
        calculationDetails[people[i].id] = {
            paid: [],      // 支出记录
            owes: []       // 欠款记录
        };
    }
    
    // 计算每个人的支出
    for (var i = 0; i < people.length; i++) {
        var person = people[i];
        var totalPaid = 0;
        for (var j = 0; j < person.expenses.length; j++) {
            var expense = person.expenses[j];
            var amount = expense.amount || 0;
            totalPaid += amount;
            
            if (amount > 0) {
                // 记录支出详情
            // 计算支付者实际承担的金额（总额减去自己应该分摊的部分）
            var actualAmount = amount;
            if (expense.participants && expense.participants.includes(person.id)) {
                actualAmount = amount - (amount / expense.participants.length);
            }
            
            calculationDetails[person.id].paid.push({
                amount: actualAmount,
                originalAmount: amount,
                description: "支付费用"
            });
            }
        }
        balances[person.id] += totalPaid;
    }
    
    // 计算每个人需要分摊的金额
    for (var i = 0; i < people.length; i++) {
        var person = people[i];
        for (var j = 0; j < person.expenses.length; j++) {
            var expense = person.expenses[j];
            if (expense.amount && expense.participants && expense.participants.length > 0) {
                var splitAmount = expense.amount / expense.participants.length;
                
                // 获取参与人姓名
                var participantNames = [];
                for (var k = 0; k < expense.participants.length; k++) {
                    var participantId = expense.participants[k];
                    var participant = people.find(function(p) { return p.id === participantId; });
                    if (participant) {
                        participantNames.push(participant.name);
                    }
                }
                
                for (var k = 0; k < expense.participants.length; k++) {
                    var participantId = expense.participants[k];
                    balances[participantId] -= splitAmount;
                    
                    // 记录分摊详情
                    if (participantId !== person.id) { // 不记录支付者自己的分摊
                        if (calculationDetails[participantId] && calculationDetails[participantId].owes) {
                            calculationDetails[participantId].owes.push({
                                amount: splitAmount,
                                description: "分摊" + person.name + "的费用(" + participantNames.join(",") + "参与)",
                                payer: person.name,
                                participants: participantNames
                            });
                        }
                    }
                }
            }
        }
    }
    
    // 保存原始余额（应用汇率前）
    var originalBalances = {};
    for (var personId in balances) {
        originalBalances[personId] = balances[personId];
    }
    
    // 应用汇率
    for (var personId in balances) {
        balances[personId] *= exchangeRate;
    }
    
    // 生成结算建议
    var creditors = [];
    var debtors = [];
    
    for (var personId in balances) {
        for (var i = 0; i < people.length; i++) {
            if (people[i].id === parseInt(personId)) {
                var person = people[i];
                var balance = balances[personId];
                if (balance > 0) {
                    creditors.push({ person: person, amount: balance });
                } else if (balance < 0) {
                    debtors.push({ person: person, amount: -balance });
                }
                break;
            }
        }
    }
    
    // 排序：债权人按金额降序，债务人按金额降序
    creditors.sort(function(a, b) { return b.amount - a.amount; });
    debtors.sort(function(a, b) { return b.amount - a.amount; });
    
    // 生成转账建议
    var transfers = [];
    var creditorIndex = 0;
    var debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        var creditor = creditors[creditorIndex];
        var debtor = debtors[debtorIndex];
        
        var transferAmount = Math.min(creditor.amount, debtor.amount);
        
        // 生成详细的计算公式
        var debtorDetails = calculationDetails[debtor.person.id];
        var creditorDetails = calculationDetails[creditor.person.id];
        var formulaParts = [];
        
        // 添加债务人的支出部分
        if (debtorDetails && debtorDetails.paid && debtorDetails.paid.length > 0) {
            for (var i = 0; i < debtorDetails.paid.length; i++) {
                var paid = debtorDetails.paid[i];
                if (paid.originalAmount && paid.originalAmount !== paid.amount) {
                    // 需要找到这笔费用对应的参与人数
                    var participantCount = 2; // 默认为2
                    // 查找这笔费用在expenses中的记录，以获取正确的参与人数
                    for (var j = 0; j < debtor.person.expenses.length; j++) {
                        if (debtor.person.expenses[j].amount === paid.originalAmount) {
                            participantCount = debtor.person.expenses[j].participants.length;
                            break;
                        }
                    }
                    formulaParts.push(paid.amount.toFixed(2) + '+(' + paid.originalAmount.toFixed(2) + '-' + (paid.originalAmount / participantCount).toFixed(2) + ')');
                } else {
                    formulaParts.push(paid.amount.toFixed(2));
                }
            }
        }
        
        // 添加债务人的分摊部分
        if (debtorDetails && debtorDetails.owes && debtorDetails.owes.length > 0) {
            for (var i = 0; i < debtorDetails.owes.length; i++) {
                var owes = debtorDetails.owes[i];
                formulaParts.push('-' + owes.amount.toFixed(2));
            }
        }
        
        // 计算债务人的原始余额
        var debtorOriginalBalance = originalBalances[debtor.person.id];
        
        // 计算债务人在汇率换算后的总应付金额
        var debtorTotalAfterExchange = debtorOriginalBalance * exchangeRate;
        if (applyRound) {
            debtorTotalAfterExchange = Math.round(debtorTotalAfterExchange);
        }
        
        // 计算当前转账金额占总应付金额的比例
        var transferRatio = transferAmount / Math.abs(debtorTotalAfterExchange);
        
        // 计算原始余额中对应当前转账金额的部分
        var originalTransferAmount = Math.abs(debtorOriginalBalance) * transferRatio;
        
        // 组合公式，使用原始余额中的对应部分
        var formula = '[' + formulaParts.join('+') + ']×' + exchangeRate.toFixed(2) + '×' + transferRatio.toFixed(2);
        if (applyRound) {
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
    
    // 渲染结算结果
    renderSettlementResults(transfers, balances, exchangeRate, applyRound, calculationDetails, originalBalances);
}

// 渲染结算结果
function renderSettlementResults(transfers, balances, exchangeRate, applyRound, calculationDetails, originalBalances) {
    var container = document.getElementById('settlement-results');
    
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
        var hasExpenses = false;
        for (var i = 0; i < people.length; i++) {
            var person = people[i];
            for (var j = 0; j < person.expenses.length; j++) {
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
        var transfersByPerson = {};
        for (var i = 0; i < transfers.length; i++) {
            var transfer = transfers[i];
            if (!transfersByPerson[transfer.from.id]) {
                transfersByPerson[transfer.from.id] = [];
            }
            transfersByPerson[transfer.from.id].push(transfer);
        }
        
        // 渲染每个人的转账记录
        for (var i = 0; i < people.length; i++) {
            var person = people[i];
            var personTransfers = transfersByPerson[person.id] || [];
            
            if (personTransfers.length > 0) {
                var resultRow = document.createElement('div');
                resultRow.className = 'result-row bg-gray-50 rounded-lg p-4 transition-all';
                
                var totalAmount = 0;
                var transferDetailsHTML = '';
                for (var j = 0; j < personTransfers.length; j++) {
                    var transfer = personTransfers[j];
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
                var calculationHTML = '';
                if (calculationDetails && calculationDetails[person.id]) {
                    var details = calculationDetails[person.id];
                    
                    // 支出详情
                    calculationHTML += '<div class="calculation-section mt-3 p-3 bg-blue-50 rounded">';
                    calculationHTML += '<h5 class="text-sm font-medium text-blue-800 mb-2">支出详情 (+)</h5>';
                    if (details.paid.length > 0) {
                        for (var k = 0; k < details.paid.length; k++) {
                            var paid = details.paid[k];
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
                        for (var k = 0; k < details.owes.length; k++) {
                            var owes = details.owes[k];
                            calculationHTML += '<div class="text-xs text-orange-700">-¥' + owes.amount.toFixed(2) + ' ' + owes.description + '</div>';
                        }
                    } else {
                        calculationHTML += '<div class="text-xs text-gray-500">无分摊记录</div>';
                    }
                    calculationHTML += '</div>';
                    
                    // 汇总计算
                    var totalPaid = details.paid.reduce(function(sum, item) { return sum + item.amount; }, 0);
                    var totalOwes = details.owes.reduce(function(sum, item) { return sum + item.amount; }, 0);
                    var originalBalance = totalPaid - totalOwes;
                    
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
                var toggleBtn = resultRow.querySelector('.toggle-details');
                var details = resultRow.querySelector('.transfer-details');
                
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
                    
                    var icon = toggleBtn.querySelector('i');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                });
                
                container.appendChild(resultRow);
            }
        }
        
        // 添加净收入人员的显示
        var netIncomePeople = [];
        for (var i = 0; i < people.length; i++) {
            if (balances[people[i].id] > 0) {
                netIncomePeople.push(people[i]);
            }
        }
        
        if (netIncomePeople.length > 0) {
            var incomeHeader = document.createElement('div');
            incomeHeader.className = 'font-medium text-gray-700 mt-6 mb-2';
            incomeHeader.textContent = '净收入人员：';
            container.appendChild(incomeHeader);
            
            for (var i = 0; i < netIncomePeople.length; i++) {
                var person = netIncomePeople[i];
                var incomeRow = document.createElement('div');
                incomeRow.className = 'flex justify-between items-center p-3 bg-green-50 rounded-lg transition-all hover:shadow-md';
                incomeRow.innerHTML = 
                    '<div>' + person.name + '</div>' +
                    '<div class="text-green-600 font-medium">+¥' + balances[person.id].toFixed(2) + '</div>';
                container.appendChild(incomeRow);
            }
        }
        
        // 添加两人之间支付明细
        if (transfers.length > 0) {
            var summaryHeader = document.createElement('div');
            summaryHeader.className = 'font-medium text-gray-700 mt-6 mb-2';
            summaryHeader.textContent = '支付明细：';
            container.appendChild(summaryHeader);
            
            // 添加抵消开关
            var offsetSwitchContainer = document.createElement('div');
            offsetSwitchContainer.className = 'flex items-center mb-3 relative';
            
            var offsetSwitchLabel = document.createElement('label');
            offsetSwitchLabel.className = 'flex items-center cursor-pointer';
            
            var offsetSwitchCheckbox = document.createElement('input');
            offsetSwitchCheckbox.type = 'checkbox';
            offsetSwitchCheckbox.id = 'offset-switch';
            offsetSwitchCheckbox.className = 'mr-2';
            offsetSwitchCheckbox.checked = false; // 默认不勾选抵消
            
            var offsetSwitchText = document.createElement('span');
            offsetSwitchText.className = 'text-sm text-gray-600';
            offsetSwitchText.textContent = '抵消';
            
            // 添加悬停说明
            var offsetTooltip = document.createElement('div');
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
            var switchContainer = document.createElement('div');
            switchContainer.className = 'flex items-center mb-3 ml-4 relative';
            
            var switchLabel = document.createElement('label');
            switchLabel.className = 'flex items-center cursor-pointer';
            
            var switchCheckbox = document.createElement('input');
            switchCheckbox.type = 'checkbox';
            switchCheckbox.id = 'indirect-payment-switch';
            switchCheckbox.className = 'mr-2';
            switchCheckbox.checked = false; // 默认不勾选代还
            
            var switchText = document.createElement('span');
            switchText.className = 'text-sm text-gray-600';
            switchText.textContent = '代还';
            
            // 添加悬停说明
            var indirectTooltip = document.createElement('div');
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
            var exchangeSwitchContainer = document.createElement('div');
            exchangeSwitchContainer.className = 'flex items-center mb-3 ml-4';
            
            var exchangeSwitchLabel = document.createElement('label');
            exchangeSwitchLabel.className = 'flex items-center cursor-pointer';
            
            var exchangeSwitchCheckbox = document.createElement('input');
            exchangeSwitchCheckbox.type = 'checkbox';
            exchangeSwitchCheckbox.id = 'exchange-rate-switch';
            exchangeSwitchCheckbox.className = 'mr-2';
            exchangeSwitchCheckbox.checked = false; // 默认不勾选汇率换算
            
            var exchangeSwitchText = document.createElement('span');
            exchangeSwitchText.className = 'text-sm text-gray-600';
            exchangeSwitchText.textContent = '汇率换算';
            
            exchangeSwitchLabel.appendChild(exchangeSwitchCheckbox);
            exchangeSwitchLabel.appendChild(exchangeSwitchText);
            exchangeSwitchContainer.appendChild(exchangeSwitchLabel);
            
            // 添加四舍五入开关
            var roundSwitchContainer = document.createElement('div');
            roundSwitchContainer.className = 'flex items-center mb-3 ml-4';
            
            var roundSwitchLabel = document.createElement('label');
            roundSwitchLabel.className = 'flex items-center cursor-pointer';
            
            var roundSwitchCheckbox = document.createElement('input');
            roundSwitchCheckbox.type = 'checkbox';
            roundSwitchCheckbox.id = 'round-switch';
            roundSwitchCheckbox.className = 'mr-2';
            roundSwitchCheckbox.checked = false; // 默认不勾选四舍五入
            
            var roundSwitchText = document.createElement('span');
            roundSwitchText.className = 'text-sm text-gray-600';
            roundSwitchText.textContent = '四舍五入';
            
            roundSwitchLabel.appendChild(roundSwitchCheckbox);
            roundSwitchLabel.appendChild(roundSwitchText);
            roundSwitchContainer.appendChild(roundSwitchLabel);
            
            // 将四个开关放在同一行
            var switchesRow = document.createElement('div');
            switchesRow.className = 'flex items-center mb-3';
            switchesRow.appendChild(offsetSwitchContainer);
            switchesRow.appendChild(switchContainer);
            switchesRow.appendChild(exchangeSwitchContainer);
            switchesRow.appendChild(roundSwitchContainer);
            
            container.appendChild(switchesRow);
            
            // 创建一个二维数组来存储每两个人之间的支付金额（汇率换算前）
            var paymentMatrix = {};
            
            // 初始化矩阵
            for (var i = 0; i < people.length; i++) {
                paymentMatrix[people[i].id] = {};
                for (var j = 0; j < people.length; j++) {
                    paymentMatrix[people[i].id][people[j].id] = 0;
                }
            }
            
            // 计算每笔转账对应的原始金额（汇率换算前）
            for (var i = 0; i < transfers.length; i++) {
                var transfer = transfers[i];
                // 直接使用汇率换算前的金额
                paymentMatrix[transfer.from.id][transfer.to.id] += transfer.amount / exchangeRate;
            }
            
            // 创建另一个矩阵来存储代还款前的原始支付关系
            var originalPaymentMatrix = {};
            
            // 初始化原始支付矩阵
            for (var i = 0; i < people.length; i++) {
                originalPaymentMatrix[people[i].id] = {};
                for (var j = 0; j < people.length; j++) {
                    originalPaymentMatrix[people[i].id][people[j].id] = 0;
                }
            }
            
            // 计算原始支付关系（基于费用分摊）
            for (var i = 0; i < people.length; i++) {
                var person = people[i];
                for (var j = 0; j < person.expenses.length; j++) {
                    var expense = person.expenses[j];
                    if (expense.amount > 0 && expense.participants && expense.participants.length > 0) {
                        // 计算每个人应分摊的金额
                        var shareAmount = expense.amount / expense.participants.length;
                        
                        // 对于每个参与者，记录他们需要支付给费用支付者的金额
                        for (var k = 0; k < expense.participants.length; k++) {
                            var participantId = expense.participants[k];
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
                var summaryTable = document.createElement('div');
                summaryTable.className = 'overflow-x-auto mt-3';
                summaryTable.id = 'payment-summary-table';
                
                // 渲染表格的函数
                function renderPaymentTable(isIndirectPayment, applyExchangeRate, applyOffset, applyRound) {
                    var tableHTML = '<table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">';
                    tableHTML += '<thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方\\收款方</th>';
                    
                    // 添加表头（收款方）
                    for (var j = 0; j < people.length; j++) {
                        tableHTML += '<th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">' + people[j].name + '</th>';
                    }
                    tableHTML += '</tr></thead><tbody>';
                    
                    // 创建一个临时矩阵来存储应用抵消后的金额
                    var tempMatrix = {};
                    for (var i = 0; i < people.length; i++) {
                        tempMatrix[people[i].id] = {};
                        for (var j = 0; j < people.length; j++) {
                            tempMatrix[people[i].id][people[j].id] = 0;
                        }
                    }
                    
                    // 计算基础金额
                    for (var i = 0; i < people.length; i++) {
                        for (var j = 0; j < people.length; j++) {
                            if (i === j) continue;
                            
                            var amount;
                            
                            if (isIndirectPayment) {
                                // 代还款后：计算净支付金额
                                var amountFromAToB = paymentMatrix[people[i].id][people[j].id];
                                var amountFromBToA = paymentMatrix[people[j].id][people[i].id];
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
                        for (var i = 0; i < people.length; i++) {
                            for (var j = 0; j < people.length; j++) {
                                if (i === j) continue;
                                
                                // 找出A到B和B到A的最小正值
                                var amountAToB = tempMatrix[people[i].id][people[j].id];
                                var amountBToA = tempMatrix[people[j].id][people[i].id];
                                
                                if (amountAToB > 0 && amountBToA > 0) {
                                    var minAmount = Math.min(amountAToB, amountBToA);
                                    tempMatrix[people[i].id][people[j].id] -= minAmount;
                                    tempMatrix[people[j].id][people[i].id] -= minAmount;
                                }
                            }
                        }
                    }
                    
                    // 添加表格内容
                    for (var i = 0; i < people.length; i++) {
                        tableHTML += '<tr>';
                        tableHTML += '<td class="px-4 py-2 text-left text-xs font-medium text-gray-900">' + people[i].name + '</td>';
                        
                        for (var j = 0; j < people.length; j++) {
                            if (i === j) {
                                tableHTML += '<td class="px-4 py-2 text-center text-sm text-gray-400">-</td>';
                            } else {
                                var amount = tempMatrix[people[i].id][people[j].id];
                                
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
            }
            
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
            
            container.appendChild(summaryTable);
            
            // 添加说明文字
            var explanation = document.createElement('div');
            explanation.className = 'text-xs text-gray-500 mt-2';
            explanation.innerHTML = '<span class="text-red-600">红色数字</span>表示该行人员需要支付给该列人员的金额<br>' +
                                 '<span class="font-medium">开关说明：</span>抵消开关控制是否抵消双向支付；代还开关控制显示原始支付关系或代还后净支付结果；汇率换算开关控制是否应用汇率换算；四舍五入开关控制是否对金额进行四舍五入';
            container.appendChild(explanation);
        }
    }
    
    // 添加淡入动画
    setTimeout(function() {
        container.classList.remove('opacity-0');
        container.style.transition = 'opacity 0.5s ease';
    }, 50);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 为所有费用项添加事件监听器的辅助函数
function setupExpenseEventListeners(targetElement) {
    var expenseWrappers;
    
    // 如果指定了目标元素，只处理该元素内的费用项
    if (targetElement) {
        // 如果目标元素本身是expense-item-wrapper
        if (targetElement.classList.contains('expense-item-wrapper')) {
            expenseWrappers = [targetElement];
        } 
        // 如果目标元素在expense-item-wrapper内
        else {
            var wrapper = targetElement.closest('.expense-item-wrapper');
            expenseWrappers = wrapper ? [wrapper] : [];
        }
    } else {
        // 否则处理所有费用项
        expenseWrappers = document.querySelectorAll('.expense-item-wrapper');
    }
    
    for (var i = 0; i < expenseWrappers.length; i++) {
        var wrapper = expenseWrappers[i];
        if (!wrapper) continue;
        
        var expenseItem = wrapper.querySelector('.expense-item');
        var personRow = wrapper.closest('.person-row');
        if (personRow && expenseItem) {
            var personId = parseInt(personRow.dataset.id);
            var expenseId = parseInt(expenseItem.dataset.id);
            
            // 金额输入框事件
            var amountInput = expenseItem.querySelector('.expense-amount');
            if (amountInput) {
                amountInput.addEventListener('input', function(e) {
                    var item = e.target.closest('.expense-item');
                    var wrapper = item.closest('.expense-item-wrapper');
                    var pid = parseInt(wrapper.closest('.person-row').dataset.id);
                    var eid = parseInt(item.dataset.id);
                    updateExpenseAmount(pid, eid, parseFloat(e.target.value) || 0);
                });
                
                // 添加键盘事件监听
                amountInput.addEventListener('keydown', function(e) {
                    var item = e.target.closest('.expense-item');
                    var wrapper = item.closest('.expense-item-wrapper');
                    var personRow = wrapper.closest('.person-row');
                    var pid = parseInt(personRow.dataset.id);
                    var eid = parseInt(item.dataset.id);
                    
                    // 回车键：添加当前人员的费用
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addExpense(pid);
                    }
                    // Tab键：添加下一个人员的费用
                    else if (e.key === 'Tab') {
                        e.preventDefault();
                        // 找到当前人员索引
                        var currentIndex = -1;
                        for (var i = 0; i < people.length; i++) {
                            if (people[i].id === pid) {
                                currentIndex = i;
                                break;
                            }
                        }
                        
                        // 计算下一个人员的索引
                        var nextIndex = (currentIndex + 1) % people.length;
                        var nextPersonId = people[nextIndex].id;
                        
                        // 添加下一个人员的费用
                        addExpense(nextPersonId);
                    }
                });
            }
            
            // 备注输入框事件
            var noteInput = expenseItem.querySelector('.expense-note');
            if (noteInput) {
                noteInput.addEventListener('input', function(e) {
                    var item = e.target.closest('.expense-item');
                    var wrapper = item.closest('.expense-item-wrapper');
                    var pid = parseInt(wrapper.closest('.person-row').dataset.id);
                    var eid = parseInt(item.dataset.id);
                    updateExpenseNote(pid, eid, e.target.value);
                });
            }
            
            // 删除按钮事件
            var deleteBtn = expenseItem.querySelector('.delete-expense-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                    var item = e.target.closest('.expense-item');
                    var wrapper = item.closest('.expense-item-wrapper');
                    var pid = parseInt(wrapper.closest('.person-row').dataset.id);
                    var eid = parseInt(item.dataset.id);
                    deleteExpense(pid, eid);
                });
            }
            
            // 参与人复选框事件 - 直接绑定到复选框
            (function(pid, eid) {
                var checkboxes = wrapper.querySelectorAll('.participant-checkbox');
                for (var j = 0; j < checkboxes.length; j++) {
                    (function(checkbox) {
                        checkbox.addEventListener('change', function(e) {
                            e.stopPropagation();
                            var selectedParticipants = [];
                            var allCheckboxes = wrapper.querySelectorAll('.participant-checkbox');
                            for (var k = 0; k < allCheckboxes.length; k++) {
                                if (allCheckboxes[k].checked) {
                                    selectedParticipants.push(parseInt(allCheckboxes[k].dataset.personId));
                                }
                            }
                            updateExpenseParticipants(pid, eid, selectedParticipants);
                        });
                    })(checkboxes[j]);
                }
            })(personId, expenseId);
        }
    }
}

// 在renderPeople函数最后调用setupExpenseEventListeners
var originalRenderPeople = renderPeople;
renderPeople = function() {
    originalRenderPeople();
    setupExpenseEventListeners();
};

// 加载测试数据
function loadTestData() {
    // 清空现有数据
    people = [];
    
    // 创建测试人员：李、曹、张
    var li = { id: Date.now(), name: '李', expenses: [] };
    var cao = { id: Date.now() + 1, name: '曹', expenses: [] };
    var zhang = { id: Date.now() + 2, name: '张', expenses: [] };
    
    // 添加李的费用
    li.expenses.push({
        id: Date.now() + 10,
        amount: 20.4,
        participants: [li.id, cao.id, zhang.id] // 李、曹、张
    });
    
    // 添加曹的费用
    cao.expenses.push({
        id: Date.now() + 20,
        amount: 12.29,
        participants: [cao.id, zhang.id] // 曹和张，李没有参与
    });
    
    // 添加张的费用
    zhang.expenses.push({
        id: Date.now() + 30,
        amount: 2.69,
        participants: [li.id, cao.id, zhang.id] // 李、曹、张
    });
    
    zhang.expenses.push({
        id: Date.now() + 31,
        amount: 29.72,
        participants: [cao.id, zhang.id] // 曹和张，李没有参与
    });
    
    // 将人员添加到数组
    people.push(li, cao, zhang);
    
    // 设置汇率为7.11
    document.getElementById('exchange-rate').value = 7.11;
    
    // 重新渲染界面
    renderPeople();
    
    // 自动计算结算
    var roundSwitch = document.getElementById('round-switch');
    calculateSettlements(roundSwitch ? roundSwitch.checked : false);
}