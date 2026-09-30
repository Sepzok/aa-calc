// 结算结果渲染模块
// 负责渲染结算结果和支付汇总相关的UI组件
import { getPeople, calculateSettlements } from './index.js';

/**
 * 计算并渲染结算结果
 * @param {boolean} applyRound - 是否应用四舍五入
 */
export function calculateAndRenderSettlements(applyRound = false) {
    const result = calculateSettlements(applyRound);
    renderSettlementResults(result.transfers, result.balances, result.exchangeRate, result.applyRound, result.calculationDetails, result.originalBalances);
}

/**
 * 渲染结算结果
 * @param {Array} transfers - 转账记录数组
 * @param {Object} balances - 余额对象
 * @param {number} exchangeRate - 汇率
 * @param {boolean} applyRound - 是否应用四舍五入
 * @param {Object} calculationDetails - 计算详情
 * @param {Object} originalBalances - 原始余额
 */
function renderSettlementResults(transfers, balances, exchangeRate, applyRound, calculationDetails, originalBalances) {
    const people = getPeople();
    const container = document.getElementById('settlement-results');
    
    // 清空容器并添加淡入动画类
    container.classList.add('opacity-0');
    
    if (people.length === 0) {
        renderEmptyState(container, '请先添加参与人', '点击"添加参与人"按钮开始', 'fa-user-plus');
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
            renderEmptyState(container, '请添加费用', '点击"添加费用"按钮输入各项支出', 'fa-credit-card');
        } else {
            renderBalancedState(container);
        }
    } else {
        renderTransfersState(container, transfers, balances, exchangeRate, applyRound, calculationDetails, originalBalances, people);
    }
    
    // 添加淡入动画
    setTimeout(function() {
        container.classList.remove('opacity-0');
        container.style.transition = 'opacity 0.5s ease';
    }, 50);
}

/**
 * 渲染空状态
 * @param {HTMLElement} container - 容器DOM元素
 * @param {string} title - 标题
 * @param {string} subtitle - 副标题
 * @param {string} iconClass - 图标类名
 */
function renderEmptyState(container, title, subtitle, iconClass) {
    container.innerHTML = 
        '<div class="text-gray-500 text-center py-12">' +
            '<i class="fa ' + iconClass + ' text-4xl mb-4 text-gray-300"></i>' +
            '<p class="text-lg">' + title + '</p>' +
            '<p class="text-sm mt-2">' + subtitle + '</p>' +
        '</div>';
}

/**
 * 渲染平衡状态（所有费用已平衡）
 * @param {HTMLElement} container - 容器DOM元素
 */
function renderBalancedState(container) {
    container.innerHTML = 
        '<div class="text-green-600 text-center py-12">' +
            '<i class="fa fa-check-circle text-4xl mb-4 text-green-300"></i>' +
            '<p class="text-lg">完美！所有费用已平衡</p>' +
            '<p class="text-sm mt-2 text-gray-500">当前没有需要结算的款项</p>' +
        '</div>';
}

/**
 * 渲染转账状态（有需要结算的款项）
 * @param {HTMLElement} container - 容器DOM元素
 * @param {Array} transfers - 转账记录数组
 * @param {Object} balances - 余额对象
 * @param {number} exchangeRate - 汇率
 * @param {boolean} applyRound - 是否应用四舍五入
 * @param {Object} calculationDetails - 计算详情
 * @param {Object} originalBalances - 原始余额
 * @param {Array} people - 人员数组
 */
function renderTransfersState(container, transfers, balances, exchangeRate, applyRound, calculationDetails, originalBalances, people) {
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
            const calculationHTML = generateCalculationHTML(person, calculationDetails, exchangeRate, applyRound, balances);
            
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
            setupToggleDetailsEventListener(resultRow);
            
            container.appendChild(resultRow);
        }
    }
    
    // 添加净收入人员的显示
    renderNetIncomePeople(container, people, balances);
    
    // 添加两人之间支付汇总
    renderPaymentSummary(container, transfers, people, exchangeRate, applyRound);
}

/**
 * 生成详细计算过程HTML
 * @param {Object} person - 人员对象
 * @param {Object} calculationDetails - 计算详情
 * @param {number} exchangeRate - 汇率
 * @param {boolean} applyRound - 是否应用四舍五入
 * @param {Object} balances - 余额对象
 * @returns {string} - 计算过程HTML字符串
 */
function generateCalculationHTML(person, calculationDetails, exchangeRate, applyRound, balances) {
    if (!calculationDetails || !calculationDetails[person.id]) {
        return '';
    }
    
    const details = calculationDetails[person.id];
    let calculationHTML = '';
    
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
    
    return calculationHTML;
}

/**
 * 为详情切换按钮添加事件监听器
 * @param {HTMLElement} resultRow - 结果行DOM元素
 */
function setupToggleDetailsEventListener(resultRow) {
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
}

/**
 * 渲染净收入人员
 * @param {HTMLElement} container - 容器DOM元素
 * @param {Array} people - 人员数组
 * @param {Object} balances - 余额对象
 */
function renderNetIncomePeople(container, people, balances) {
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
}

/**
 * 渲染支付明细
 * @param {HTMLElement} container - 容器DOM元素
 * @param {Array} transfers - 转账记录数组
 * @param {Array} people - 人员数组
 * @param {number} exchangeRate - 汇率
 * @param {boolean} applyRound - 是否应用四舍五入
 */
function renderPaymentSummary(container, transfers, people, exchangeRate, applyRound) {
    if (transfers.length === 0) {
        return;
    }
    
    const summaryHeader = document.createElement('div');
    summaryHeader.className = 'font-medium text-gray-700 mt-6 mb-2';
    summaryHeader.textContent = '支付明细：';
    container.appendChild(summaryHeader);
    
    // 创建开关容器
    const switchesRow = createSwitchesRow();
    container.appendChild(switchesRow);
    
    // 创建汇总表格
    const summaryTable = createSummaryTable();
    container.appendChild(summaryTable);
    
    // 添加说明文字
    const explanation = document.createElement('div');
    explanation.className = 'text-xs text-gray-500 mt-2';
    explanation.innerHTML = '<span class="text-red-600">红色数字</span>表示该行人员需要支付给该列人员的金额<br>' +
                         '<span class="font-medium">开关说明：</span>抵消开关控制是否抵消双向支付；代还开关控制显示原始支付关系或代还后净支付结果；汇率换算开关控制是否应用汇率换算；四舍五入开关控制是否对金额进行四舍五入';
    container.appendChild(explanation);
    
    // 初始化支付矩阵
    const paymentMatrix = initializePaymentMatrix(people);
    const originalPaymentMatrix = initializeOriginalPaymentMatrix(people);
    
    // 计算支付矩阵
    calculatePaymentMatrices(transfers, people, exchangeRate, paymentMatrix, originalPaymentMatrix);
    
    // 初始渲染表格
    renderPaymentTable(summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate, applyRound);
    
    // 添加开关事件监听器
    setupSwitchEventListeners(switchesRow, summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate);
}

/**
 * 创建开关行
 * @returns {HTMLElement} - 开关行DOM元素
 */
function createSwitchesRow() {
    const switchesRow = document.createElement('div');
    switchesRow.className = 'flex items-center mb-3';
    
    // 添加抵消开关
    switchesRow.appendChild(createOffsetSwitch());
    
    // 添加代还开关
    switchesRow.appendChild(createIndirectPaymentSwitch());
    
    // 添加汇率换算开关
    switchesRow.appendChild(createExchangeRateSwitch());
    
    // 添加四舍五入开关
    switchesRow.appendChild(createRoundSwitch());
    
    return switchesRow;
}

/**
 * 创建抵消开关
 * @returns {HTMLElement} - 抵消开关DOM元素
 */
function createOffsetSwitch() {
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
    
    return offsetSwitchContainer;
}

/**
 * 创建代还开关
 * @returns {HTMLElement} - 代还开关DOM元素
 */
function createIndirectPaymentSwitch() {
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
    
    return switchContainer;
}

/**
 * 创建汇率换算开关
 * @returns {HTMLElement} - 汇率换算开关DOM元素
 */
function createExchangeRateSwitch() {
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
    
    return exchangeSwitchContainer;
}

/**
 * 创建四舍五入开关
 * @returns {HTMLElement} - 四舍五入开关DOM元素
 */
function createRoundSwitch() {
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
    
    return roundSwitchContainer;
}

/**
 * 创建汇总表格
 * @returns {HTMLElement} - 汇总表格DOM元素
 */
function createSummaryTable() {
    const summaryTable = document.createElement('div');
    summaryTable.className = 'overflow-x-auto mt-3';
    summaryTable.id = 'payment-summary-table';
    return summaryTable;
}

/**
 * 初始化支付矩阵
 * @param {Array} people - 人员数组
 * @returns {Object} - 初始化后的支付矩阵
 */
function initializePaymentMatrix(people) {
    const matrix = {};
    for (let i = 0; i < people.length; i++) {
        matrix[people[i].id] = {};
        for (let j = 0; j < people.length; j++) {
            matrix[people[i].id][people[j].id] = 0;
        }
    }
    return matrix;
}

/**
 * 初始化原始支付矩阵
 * @param {Array} people - 人员数组
 * @returns {Object} - 初始化后的原始支付矩阵
 */
function initializeOriginalPaymentMatrix(people) {
    return initializePaymentMatrix(people);
}

/**
 * 计算支付矩阵
 * @param {Array} transfers - 转账记录数组
 * @param {Array} people - 人员数组
 * @param {number} exchangeRate - 汇率
 * @param {Object} paymentMatrix - 支付矩阵
 * @param {Object} originalPaymentMatrix - 原始支付矩阵
 */
function calculatePaymentMatrices(transfers, people, exchangeRate, paymentMatrix, originalPaymentMatrix) {
    // 计算支付矩阵
    for (let i = 0; i < transfers.length; i++) {
        const transfer = transfers[i];
        paymentMatrix[transfer.from.id][transfer.to.id] += transfer.amount / exchangeRate;
    }
    
    // 计算原始支付矩阵（基于费用分摊）
    const allPeople = getPeople();
    for (let i = 0; i < allPeople.length; i++) {
        const person = allPeople[i];
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
}

/**
 * 渲染支付表格
 * @param {HTMLElement} summaryTable - 表格容器DOM元素
 * @param {Array} people - 人员数组
 * @param {Object} paymentMatrix - 支付矩阵
 * @param {Object} originalPaymentMatrix - 原始支付矩阵
 * @param {number} exchangeRate - 汇率
 * @param {boolean} applyRound - 是否应用四舍五入
 */
function renderPaymentTable(summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate, applyRound) {
    // 获取开关状态
    const offsetSwitch = document.getElementById('offset-switch');
    const indirectPaymentSwitch = document.getElementById('indirect-payment-switch');
    const exchangeRateSwitch = document.getElementById('exchange-rate-switch');
    const roundSwitch = document.getElementById('round-switch');
    
    const isIndirectPayment = indirectPaymentSwitch ? indirectPaymentSwitch.checked : true;
    const applyOffset = offsetSwitch ? offsetSwitch.checked : true;
    const applyExchangeRate = exchangeRateSwitch ? exchangeRateSwitch.checked : false;
    const applyRoundToTable = roundSwitch ? roundSwitch.checked : false;
    
    let tableHTML = '<table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">';
    tableHTML += '<thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方\\收款方</th>';
    
    // 添加表头（收款方）
    for (let j = 0; j < people.length; j++) {
        tableHTML += '<th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">' + people[j].name + '</th>';
    }
    tableHTML += '</tr></thead><tbody>';
    
    // 创建临时矩阵来存储应用抵消后的金额
    const tempMatrix = initializePaymentMatrix(people);
    
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
                    if (applyRoundToTable) {
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

/**
 * 为开关添加事件监听器
 * @param {HTMLElement} switchesRow - 开关行DOM元素
 * @param {HTMLElement} summaryTable - 表格容器DOM元素
 * @param {Array} people - 人员数组
 * @param {Object} paymentMatrix - 支付矩阵
 * @param {Object} originalPaymentMatrix - 原始支付矩阵
 * @param {number} exchangeRate - 汇率
 */
function setupSwitchEventListeners(switchesRow, summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate) {
    const offsetSwitch = document.getElementById('offset-switch');
    const indirectPaymentSwitch = document.getElementById('indirect-payment-switch');
    const exchangeRateSwitch = document.getElementById('exchange-rate-switch');
    const roundSwitch = document.getElementById('round-switch');
    
    // 添加开关事件监听器
    if (offsetSwitch) {
        offsetSwitch.addEventListener('change', function() {
            renderPaymentTable(summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate, false);
        });
    }
    
    if (indirectPaymentSwitch) {
        indirectPaymentSwitch.addEventListener('change', function() {
            // 如果选择代还，自动勾选抵消
            if (this.checked && offsetSwitch && !offsetSwitch.checked) {
                offsetSwitch.checked = true;
            }
            renderPaymentTable(summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate, false);
        });
    }
    
    if (exchangeRateSwitch) {
        exchangeRateSwitch.addEventListener('change', function() {
            renderPaymentTable(summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate, false);
        });
    }
    
    if (roundSwitch) {
        roundSwitch.addEventListener('change', function() {
            renderPaymentTable(summaryTable, people, paymentMatrix, originalPaymentMatrix, exchangeRate, this.checked);
        });
    }
}
