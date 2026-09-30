// 数据管理模块
// 存储和管理人员和费用数据

// 初始化人员数据
let people = [
    { id: 1, name: '人员1', expenses: [] },
    { id: 2, name: '人员2', expenses: [] },
    { id: 3, name: '人员3', expenses: [] }
];

// 获取所有人员
export function getPeople() {
    return people;
}

// 设置人员数据
export function setPeople(newPeople) {
    people = newPeople;
}

// 添加新人员
export function addPerson() {
    const newId = people.length > 0 ? Math.max.apply(null, people.map(function(p) { return p.id; })) + 1 : 1;
    const newPerson = {
        id: newId,
        name: '人员' + newId,
        expenses: []
    };
    people.push(newPerson);
    return newPerson;
}

// 删除人员
export function deletePerson(personId) {
    // 从其他费用的参与人中移除该人员
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        for (let j = 0; j < person.expenses.length; j++) {
            const expense = person.expenses[j];
            if (expense.participants) {
                const newParticipants = [];
                for (let k = 0; k < expense.participants.length; k++) {
                    if (expense.participants[k] !== personId) {
                        newParticipants.push(expense.participants[k]);
                    }
                }
                expense.participants = newParticipants;
                
                // 确保至少有一个参与人
                if (expense.participants.length === 0 && people.length > 1) {
                    let firstOtherId;
                    for (let m = 0; m < people.length; m++) {
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
    const newPeople = [];
    for (let i = 0; i < people.length; i++) {
        if (people[i].id !== personId) {
            newPeople.push(people[i]);
        }
    }
    people = newPeople;
}

// 更新人员姓名
export function updatePersonName(personId, name) {
    // 更新数据中的名字
    for (let i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            people[i].name = name;
            break;
        }
    }
}

// 添加费用
export function addExpense(personId) {
    const person = people.find(p => p.id === personId);
    if (!person) return null;
    
    const expense = {
        id: Date.now(),
        amount: 0,
        participants: people.map(p => p.id), // 默认所有人参与
        note: '' // 添加备注字段，默认为空
    };
    
    person.expenses.push(expense);
    return expense;
}

// 删除费用
export function deleteExpense(personId, expenseId) {
    for (let i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            const person = people[i];
            const newExpenses = [];
            for (let j = 0; j < person.expenses.length; j++) {
                if (person.expenses[j].id !== expenseId) {
                    newExpenses.push(person.expenses[j]);
                }
            }
            person.expenses = newExpenses;
            break;
        }
    }
}

// 更新费用金额
export function updateExpenseAmount(personId, expenseId, amount) {
    for (let i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            const person = people[i];
            for (let j = 0; j < person.expenses.length; j++) {
                if (person.expenses[j].id === expenseId) {
                    person.expenses[j].amount = amount;
                    break;
                }
            }
            break;
        }
    }
}

// 更新费用备注
export function updateExpenseNote(personId, expenseId, note) {
    for (let i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            for (let j = 0; j < people[i].expenses.length; j++) {
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
export function updateExpenseParticipants(personId, expenseId, participants) {
    for (let i = 0; i < people.length; i++) {
        if (people[i].id === personId) {
            for (let j = 0; j < people[i].expenses.length; j++) {
                if (people[i].expenses[j].id === expenseId) {
                    people[i].expenses[j].participants = participants;
                    break;
                }
            }
            break;
        }
    }
}

// 检查是否有费用项
export function hasExpenses() {
    for (let i = 0; i < people.length; i++) {
        if (people[i].expenses && people[i].expenses.length > 0) {
            return true;
        }
    }
    return false;
}

// 加载测试数据
export function loadTestData() {
    people = [
        { id: 1, name: '张三', expenses: [
            { id: 101, amount: 100, participants: [1, 2, 3], note: '午餐' },
            { id: 102, amount: 50, participants: [1, 2], note: '咖啡' }
        ]},
        { id: 2, name: '李四', expenses: [
            { id: 201, amount: 150, participants: [1, 2, 3], note: '晚餐' }
        ]},
        { id: 3, name: '王五', expenses: [] }
    ];
}
