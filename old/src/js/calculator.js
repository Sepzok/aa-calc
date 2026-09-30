// 计算模块
// 负责计算结算结果的核心逻辑
import { getPeople } from './index.js';

// 计算结算结果
export function calculateSettlements(applyRound) {
    const people = getPeople();
    const exchangeRate = parseFloat(document.getElementById('exchange-rate').value) || 1.0;
    
    // 计算每个人的总支出和应分摊金额
    const balances = {};
    
    // 初始化每个人的余额为0
    for (let i = 0; i < people.length; i++) {
        balances[people[i].id] = 0;
    }
    
    // 存储每个人的详细计算过程
    const calculationDetails = {};
    for (let i = 0; i < people.length; i++) {
        calculationDetails[people[i].id] = {
            paid: [],      // 支出记录
            owes: []       // 欠款记录
        };
    }
    
    // 计算每个人的支出
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        let totalPaid = 0;
        for (let j = 0; j < person.expenses.length; j++) {
            const expense = person.expenses[j];
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
        }
        balances[person.id] += totalPaid;
    }
    
    // 计算每个人需要分摊的金额
    for (let i = 0; i < people.length; i++) {
        const person = people[i];
        for (let j = 0; j < person.expenses.length; j++) {
            const expense = person.expenses[j];
            if (expense.amount && expense.participants && expense.participants.length > 0) {
                const splitAmount = expense.amount / expense.participants.length;
                
                // 获取参与人姓名
                const participantNames = [];
                for (let k = 0; k < expense.participants.length; k++) {
                    const participantId = expense.participants[k];
                    const participant = people.find(function(p) { return p.id === participantId; });
                    if (participant) {
                        participantNames.push(participant.name);
                    }
                }
                
                for (let k = 0; k < expense.participants.length; k++) {
                    const participantId = expense.participants[k];
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
                }
            }
        }
    }
    
    // 保存原始余额（应用汇率前）
    const originalBalances = {};
    for (const personId in balances) {
        originalBalances[personId] = balances[personId];
    }
    
    // 应用汇率
    for (const personId in balances) {
        balances[personId] *= exchangeRate;
    }
    
    // 生成结算建议
    const creditors = [];
    const debtors = [];
    
    for (const personId in balances) {
        for (let i = 0; i < people.length; i++) {
            if (people[i].id === parseInt(personId)) {
                const person = people[i];
                const balance = balances[personId];
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
    const transfers = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];
        
        const transferAmount = Math.min(creditor.amount, debtor.amount);
        
        // 生成详细的计算公式
        const debtorDetails = calculationDetails[debtor.person.id];
        const creditorDetails = calculationDetails[creditor.person.id];
        const formulaParts = [];
        
        // 添加债务人的支出部分
        if (debtorDetails && debtorDetails.paid && debtorDetails.paid.length > 0) {
            for (let i = 0; i < debtorDetails.paid.length; i++) {
                const paid = debtorDetails.paid[i];
                if (paid.originalAmount && paid.originalAmount !== paid.amount) {
                    // 需要找到这笔费用对应的参与人数
                    let participantCount = 2; // 默认为2
                    // 查找这笔费用在expenses中的记录，以获取正确的参与人数
                    for (let j = 0; j < debtor.person.expenses.length; j++) {
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
            for (let i = 0; i < debtorDetails.owes.length; i++) {
                const owes = debtorDetails.owes[i];
                formulaParts.push('-' + owes.amount.toFixed(2));
            }
        }
        
        // 计算债务人的原始余额
        const debtorOriginalBalance = originalBalances[debtor.person.id];
        
        // 计算债务人在汇率换算后的总应付金额
        let debtorTotalAfterExchange = debtorOriginalBalance * exchangeRate;
        if (applyRound) {
            debtorTotalAfterExchange = Math.round(debtorTotalAfterExchange);
        }
        
        // 计算当前转账金额占总应付金额的比例
        const transferRatio = transferAmount / Math.abs(debtorTotalAfterExchange);
        
        // 计算原始余额中对应当前转账金额的部分
        const originalTransferAmount = Math.abs(debtorOriginalBalance) * transferRatio;
        
        // 组合公式，使用原始余额中的对应部分
        let formula = '[' + formulaParts.join('+') + ']×' + exchangeRate.toFixed(2) + '×' + transferRatio.toFixed(2);
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
    
    return {
        transfers,
        balances,
        exchangeRate,
        applyRound,
        calculationDetails,
        originalBalances
    };
}
