// 主模块
// 应用的入口文件，负责初始化应用和绑定事件监听器
import { getPeople, addPerson, loadTestData, renderPeople, setupPersonEventListeners, calculateAndRenderSettlements } from './index.js';

// 初始化函数
function init() {
    // 渲染初始人员
    renderPeople();
    
    // 绑定添加参与人按钮事件
    document.getElementById('add-person-btn').addEventListener('click', function() {
        addPerson();
        renderPeople();
        
        // 滚动到新添加的人员行
        const personRows = document.querySelectorAll('.person-row');
        const newPersonRow = personRows[personRows.length - 1];
        if (newPersonRow) {
            newPersonRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newPersonRow.classList.add('bg-blue-50', 'ring-1', 'ring-primary');
            setTimeout(function() {
                newPersonRow.classList.remove('bg-blue-50', 'ring-1', 'ring-primary');
            }, 1000);
            
            // 聚焦到新人员的姓名输入框
            const nameInput = newPersonRow.querySelector('.name-input');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }
    });
    
    // 绑定加载测试数据按钮事件
    document.getElementById('load-test-data-btn').addEventListener('click', function() {
        loadTestData();
        renderPeople();
    });
    
    // 绑定保存并计算按钮事件
    document.getElementById('calculate-btn').addEventListener('click', function() {
        const roundSwitch = document.getElementById('round-switch');
        calculateAndRenderSettlements(roundSwitch ? roundSwitch.checked : false);
    });
    
    // 绑定汇率输入框事件
    document.getElementById('exchange-rate').addEventListener('input', function() {
        const roundSwitch = document.getElementById('round-switch');
        calculateAndRenderSettlements(roundSwitch ? roundSwitch.checked : false);
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
        const firstPersonRow = document.querySelector('.person-row');
        if (firstPersonRow) {
            const nameInput = firstPersonRow.querySelector('.name-input');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }
    }, 100);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
