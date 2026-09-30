// 人员渲染模块
// 负责渲染参与人相关的UI组件
import { getPeople, addPerson, deletePerson, updatePersonName, calculateAndRenderSettlements, addExpense, deleteExpense, updateExpenseAmount, updateExpenseNote, updateExpenseParticipants } from './index.js';

/**
 * 渲染所有人员行
 */
export function renderPeople() {
    const people = getPeople();
    const container = document.getElementById('people-container');
    container.innerHTML = '';
    
    for (let i = 0; i < people.length; i++) {
        const personRow = createPersonRow(people[i]);
        container.appendChild(personRow);
    }
    
    // 为所有费用项添加事件监听器
    setupPersonEventListeners();
    
    // 只有在有人员且有费用时才计算结算
    if (people.length > 0 && hasExpenses()) {
        const roundSwitch = document.getElementById('round-switch');
        calculateAndRenderSettlements(roundSwitch ? roundSwitch.checked : false);
    }
}

/**
 * 创建单个人员行
 * @param {Object} person - 人员对象
 * @returns {HTMLElement} - 人员行DOM元素
 */
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
            '<button class="add-expense-btn px-2 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors flex items-center">' +
                '<i class="fa fa-plus mr-1"></i>添加费用' +
            '</button>' +
            deleteButtonHTML +
        '</div>' +
        '<div class="mt-2 expenses-container space-y-2">' +
            expensesHTML +
        '</div>';
    
    return row;
}

/**
 * 创建费用项HTML
 * @param {Object} expense - 费用对象
 * @param {number} personId - 人员ID
 * @returns {string} - 费用项HTML字符串
 */
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
                        '<button class="delete-expense-btn px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors flex items-center">' +
                            '<i class="fa fa-times mr-1"></i>删除' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

/**
 * 为所有人员和费用项添加事件监听器
 */
export function setupPersonEventListeners() {
    const personRows = document.querySelectorAll('.person-row');
    
    personRows.forEach(row => {
        const personId = parseInt(row.dataset.id);
        
        // 为姓名输入框添加事件监听器
        setupNameInputEventListener(row, personId);
        
        // 为添加费用按钮添加事件监听器
        setupAddExpenseButtonEventListener(row, personId);
        
        // 为删除人员按钮添加事件监听器
        setupDeletePersonButtonEventListener(row, personId);
        
        // 为费用项添加事件监听器
        setupExpenseItemEventListeners(row, personId);
    });
}

/**
 * 为姓名输入框添加事件监听器
 * @param {HTMLElement} row - 人员行DOM元素
 * @param {number} personId - 人员ID
 */
function setupNameInputEventListener(row, personId) {
    const nameInput = row.querySelector('.name-input');
    if (nameInput) {
        nameInput.addEventListener('input', function(e) {
            updatePersonName(personId, e.target.value);
            calculateAndRenderSettlements();
        });
        
        // 为姓名输入框添加键盘事件监听
        nameInput.addEventListener('keydown', function(e) {
            // 回车键：添加当前人员的费用
            if (e.key === 'Enter') {
                e.preventDefault();
                const expense = addExpense(personId);
                if (expense) {
                    renderPeople();
                }
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
}

/**
 * 为添加费用按钮添加事件监听器
 * @param {HTMLElement} row - 人员行DOM元素
 * @param {number} personId - 人员ID
 */
function setupAddExpenseButtonEventListener(row, personId) {
    const addExpenseBtn = row.querySelector('.add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            const expense = addExpense(personId);
            if (expense) {
                renderPeople();
            }
        });
    }
}

/**
 * 为删除人员按钮添加事件监听器
 * @param {HTMLElement} row - 人员行DOM元素
 * @param {number} personId - 人员ID
 */
function setupDeletePersonButtonEventListener(row, personId) {
    const deletePersonBtn = row.querySelector('.delete-person-btn');
    if (deletePersonBtn) {
        deletePersonBtn.addEventListener('click', function() {
            deletePerson(personId);
            renderPeople();
        });
    }
}

/**
 * 为费用项添加事件监听器
 * @param {HTMLElement} row - 人员行DOM元素
 * @param {number} personId - 人员ID
 */
function setupExpenseItemEventListeners(row, personId) {
    const expenseItems = row.querySelectorAll('.expense-item');
    expenseItems.forEach(expenseItem => {
        const expenseId = parseInt(expenseItem.dataset.id);
        
        // 为金额输入框添加事件监听器
        setupExpenseAmountInputEventListener(expenseItem, personId, expenseId);
        
        // 为备注输入框添加事件监听器
        setupExpenseNoteInputEventListener(expenseItem, personId, expenseId);
        
        // 为参与人复选框添加事件监听器
        setupParticipantCheckboxEventListeners(expenseItem, personId, expenseId);
        
        // 为删除费用按钮添加事件监听器
        setupDeleteExpenseButtonEventListener(expenseItem, personId, expenseId);
    });
}

/**
 * 为费用金额输入框添加事件监听器
 * @param {HTMLElement} expenseItem - 费用项DOM元素
 * @param {number} personId - 人员ID
 * @param {number} expenseId - 费用ID
 */
function setupExpenseAmountInputEventListener(expenseItem, personId, expenseId) {
    const amountInput = expenseItem.querySelector('.expense-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function(e) {
            const amount = parseFloat(e.target.value) || 0;
            updateExpenseAmount(personId, expenseId, amount);
            calculateAndRenderSettlements();
        });
    }
}

/**
 * 为费用备注输入框添加事件监听器
 * @param {HTMLElement} expenseItem - 费用项DOM元素
 * @param {number} personId - 人员ID
 * @param {number} expenseId - 费用ID
 */
function setupExpenseNoteInputEventListener(expenseItem, personId, expenseId) {
    const noteInput = expenseItem.querySelector('.expense-note');
    if (noteInput) {
        noteInput.addEventListener('input', function(e) {
            updateExpenseNote(personId, expenseId, e.target.value);
        });
    }
}

/**
 * 为参与人复选框添加事件监听器
 * @param {HTMLElement} expenseItem - 费用项DOM元素
 * @param {number} personId - 人员ID
 * @param {number} expenseId - 费用ID
 */
function setupParticipantCheckboxEventListeners(expenseItem, personId, expenseId) {
    const checkboxes = expenseItem.querySelectorAll('.participant-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const selectedParticipants = [];
            expenseItem.querySelectorAll('.participant-checkbox:checked').forEach(cb => {
                selectedParticipants.push(parseInt(cb.dataset.personId));
            });
            updateExpenseParticipants(personId, expenseId, selectedParticipants);
            calculateAndRenderSettlements();
        });
    });
}

/**
 * 为删除费用按钮添加事件监听器
 * @param {HTMLElement} expenseItem - 费用项DOM元素
 * @param {number} personId - 人员ID
 * @param {number} expenseId - 费用ID
 */
function setupDeleteExpenseButtonEventListener(expenseItem, personId, expenseId) {
    const deleteExpenseBtn = expenseItem.querySelector('.delete-expense-btn');
    if (deleteExpenseBtn) {
        deleteExpenseBtn.addEventListener('click', function() {
            deleteExpense(personId, expenseId);
            renderPeople();
        });
    }
}

/**
 * 检查是否有费用项
 * @returns {boolean} - 是否有费用项
 */
function hasExpenses() {
    const people = getPeople();
    for (let i = 0; i < people.length; i++) {
        if (people[i].expenses && people[i].expenses.length > 0) {
            return true;
        }
    }
    return false;
}


