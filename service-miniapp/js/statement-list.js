let currentTypeFilter = 'all';
let currentStatusFilter = 'all';
let currentContractFilter = 'all';
let selectedContract = '';
let selectedBillType = '';
let currentDropdown = null;

const typeNames = {
    'all': '全部',
    'worker_wage': '工友工资',
    'material': '辅料费',
    'measure': '措施费',
    'insurance': '保险费',
    'foreman_wage': '工长工资'
};

const statusNames = {
    'all': '全部',
    'pending': '待我确认',
    'effective': '已生效',
    'paid': '已支付',
    'rejected': '已驳回'
};

document.addEventListener('DOMContentLoaded', function() {
    initTypeCapsules();
});

function toggleDropdown(type) {
    const overlay = document.getElementById('dropdownOverlay');
    const content = document.getElementById(type + 'DropdownContent');
    const dropdown = document.getElementById(type + 'Dropdown');
    
    if (currentDropdown === type) {
        closeDropdown();
        return;
    }
    
    if (currentDropdown) {
        closeDropdown();
    }
    
    overlay.classList.add('show');
    content.classList.add('show');
    dropdown.classList.add('active');
    currentDropdown = type;
}

function closeDropdown() {
    const overlay = document.getElementById('dropdownOverlay');
    const typeContent = document.getElementById('typeDropdownContent');
    const statusContent = document.getElementById('statusDropdownContent');
    const contractContent = document.getElementById('contractDropdownContent');
    const typeDropdown = document.getElementById('typeDropdown');
    const statusDropdown = document.getElementById('statusDropdown');
    const contractDropdown = document.getElementById('contractDropdown');
    
    overlay.classList.remove('show');
    typeContent.classList.remove('show');
    statusContent.classList.remove('show');
    if (contractContent) contractContent.classList.remove('show');
    typeDropdown.classList.remove('active');
    statusDropdown.classList.remove('active');
    if (contractDropdown) contractDropdown.classList.remove('active');
    currentDropdown = null;
}

function selectDropdownOption(type, value, name) {
    if (type === 'type') {
        currentTypeFilter = value;
        document.getElementById('typeDropdownValue').textContent = name;
        
        document.querySelectorAll('#typeDropdownContent .dropdown-option').forEach(function(item) {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    } else if (type === 'status') {
        currentStatusFilter = value;
        document.getElementById('statusDropdownValue').textContent = name;
        
        document.querySelectorAll('#statusDropdownContent .dropdown-option').forEach(function(item) {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    } else if (type === 'contract') {
        currentContractFilter = value;
        document.getElementById('contractDropdownValue').textContent = name;
        
        document.querySelectorAll('#contractDropdownContent .dropdown-option').forEach(function(item) {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }
    
    closeDropdown();
    filterStatements();
}

function initTypeCapsules() {
    const typeCapsules = document.getElementById('billTypeCapsules');
    if (!typeCapsules) return;
    
    typeCapsules.querySelectorAll('.type-capsule').forEach(function(capsule) {
        capsule.addEventListener('click', function() {
            typeCapsules.querySelectorAll('.type-capsule').forEach(function(c) { c.classList.remove('active'); });
            this.classList.add('active');
            selectedBillType = this.dataset.type;
        });
    });
}

function filterStatements() {
    const cards = document.querySelectorAll('.statement-card');
    let visibleCount = 0;
    
    cards.forEach(function(card) {
        const cardType = card.dataset.type;
        const cardStatus = card.dataset.status;
        const cardContract = card.dataset.contract;
        
        const typeMatch = currentTypeFilter === 'all' || cardType === currentTypeFilter;
        const statusMatch = currentStatusFilter === 'all' || cardStatus === currentStatusFilter;
        const contractMatch = currentContractFilter === 'all' || cardContract === currentContractFilter;
        
        if (typeMatch && statusMatch && contractMatch) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    const emptyState = document.getElementById('emptyState');
    const statementList = document.getElementById('statementList');
    
    if (visibleCount === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (statementList) statementList.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        if (statementList) statementList.style.display = 'block';
    }
}

function goToDetail(status, type, role) {
    let url = 'statement-detail.html?status=' + encodeURIComponent(status) + '&type=' + encodeURIComponent(type);
    if (role) {
        url += '&role=' + encodeURIComponent(role);
    }
    window.location.href = url;
}

function showAddDrawer() {
    document.getElementById('addDrawerOverlay').classList.add('show');
    document.getElementById('addDrawer').classList.add('show');
    resetAddForm();
}

function hideAddDrawer() {
    document.getElementById('addDrawerOverlay').classList.remove('show');
    document.getElementById('addDrawer').classList.remove('show');
}

function resetAddForm() {
    selectedContract = '';
    selectedBillType = '';
    document.getElementById('amountInput').value = '';
    document.getElementById('descInput').value = '';
    document.getElementById('charCount').textContent = '0';
    
    const selectEl = document.querySelector('.form-select');
    if (selectEl) {
        selectEl.innerHTML = 
            '<span class="select-placeholder">请选择关联合同</span>' +
            '<span class="select-arrow">▼</span>';
    }
    document.querySelectorAll('.type-capsule').forEach(function(c) { c.classList.remove('active'); });
    
    const confirmerInfoGroup = document.getElementById('confirmerInfoGroup');
    if (confirmerInfoGroup) confirmerInfoGroup.style.display = 'none';
}

function showContractPicker() {
    document.getElementById('contractPickerOverlay').classList.add('show');
    document.getElementById('contractPicker').classList.add('show');
}

function hideContractPicker() {
    document.getElementById('contractPickerOverlay').classList.remove('show');
    document.getElementById('contractPicker').classList.remove('show');
}

const contractConfirmerMap = {
    '基础施工服务合同': { role: '业主', name: '李先生' },
    '设计服务合同': { role: '业主', name: '李先生' }
};

function selectContract(contractName) {
    selectedContract = contractName;
    const selectEl = document.querySelector('.form-select');
    if (selectEl) {
        selectEl.innerHTML = 
            '<span class="select-value">' + contractName + '</span>' +
            '<span class="select-arrow">▼</span>';
    }
    hideContractPicker();
    
    const confirmerInfo = contractConfirmerMap[contractName];
    if (confirmerInfo) {
        document.getElementById('confirmerRole').textContent = confirmerInfo.role;
        document.getElementById('confirmerName').textContent = confirmerInfo.name;
        document.getElementById('confirmerInfoGroup').style.display = 'block';
    }
}

function formatAmount(input) {
    let value = input.value.replace(/[^\d.-]/g, '');
    
    if (value.indexOf('-') > 0) {
        value = '-' + value.replace(/-/g, '');
    }
    
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    input.value = value;
}

function updateCharCount() {
    const descInput = document.getElementById('descInput');
    const charCount = document.getElementById('charCount');
    if (descInput && charCount) {
        charCount.textContent = descInput.value.length;
    }
}

function submitStatement() {
    // 校验关联合同
    if (!selectedContract) {
        showToast('请选择关联合同');
        return;
    }
    
    // 校验账单类型
    if (!selectedBillType) {
        showToast('请选择账单类型');
        return;
    }
    
    // 校验金额（使用validation.js）
    const amountInput = document.getElementById('amountInput');
    const amountValue = amountInput.value.trim();
    const amountResult = Validation.validate.amountNegative(amountValue, 9999999.99);
    if (!amountResult.valid) {
        showToast(amountResult.message);
        amountInput.focus();
        return;
    }
    
    // 校验用途描述
    const descInput = document.getElementById('descInput');
    const descValue = descInput.value.trim();
    const descResult = Validation.validate.textLength(descValue, 200, true, '用途描述');
    if (!descResult.valid) {
        showToast(descResult.message);
        descInput.focus();
        return;
    }
    
    // 所有字段校验通过 → 弹出「确认提交」二次确认弹窗（与创建项目 5.5 一致）
    const confirmerName = (document.getElementById('confirmerName') || {}).textContent || '对方';
    showModal(
        '确认提交',
        '确认要提交该对账单吗？提交后将通知「' + confirmerName + '」确认账单。',
        function() {
            generateOwnerStatementTodo();
            showToast('提交成功，已通知对方确认');
            hideAddDrawer();
            setTimeout(function() {
                location.reload();
            }, 1500);
        },
        true
    );
}

// 二次确认弹窗（与 create-project.html 的 showModal 保持一致）
function showModal(title, content, onConfirm, showCancel = true) {
    const modal = document.getElementById('appModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').textContent = content;
    document.getElementById('modalCancel').style.display = showCancel ? 'flex' : 'none';
    modal.classList.add('show');
    document.getElementById('modalConfirm').onclick = function() {
        closeModal();
        if (onConfirm) onConfirm();
    };
}

function closeModal() {
    document.getElementById('appModal').classList.remove('show');
}

// 提交成功后，为业主（确认人）生成一条「对账单确认」待办项
// 原型演示使用浏览器端临时持久化（localStorage.lzj_owner_todos），业主端待办页读取
function generateOwnerStatementTodo() {
    try {
        var contractName = selectedContract || '关联合同';
        var typeKey = selectedBillType || 'material';
        var typeLabel = (typeNames[typeKey] || '对账单');
        var amountVal = (document.getElementById('amountInput') || {}).value || '';
        var id = 'ST' + Date.now();

        var todo = {
            id: id,
            type: 'bill',
            title: typeLabel + '对账单确认',
            meta: contractName + ' · 待确认账单' + (amountVal ? ' · ¥' + amountVal : ''),
            status: 'confirming',
            target: 'statement-detail.html?status=pending&role=confirmer&id=' + id,
            createdAt: Date.now()
        };

        var KEY = 'lzj_owner_todos';
        var list = [];
        try { list = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { list = []; }
        // 去重：同一对账单只保留一条待办
        list = list.filter(function(t) { return String(t.id) !== String(id); });
        list.unshift(todo);
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
        // 生成待办失败不影响提交主流程
    }
}

function showToast(message) {
    const toast = document.getElementById('toastModal');
    const toastContent = document.getElementById('toastContent');
    
    if (toast && toastContent) {
        toastContent.textContent = message;
        toast.classList.add('show');
        
        setTimeout(function() {
            toast.classList.remove('show');
        }, 2000);
    }
}

function showRejectDrawer() {
    document.getElementById('rejectDrawerOverlay').classList.add('show');
    document.getElementById('rejectDrawer').classList.add('show');
    document.getElementById('rejectReasonInput').focus();
}

function hideRejectDrawer() {
    document.getElementById('rejectDrawerOverlay').classList.remove('show');
    document.getElementById('rejectDrawer').classList.remove('show');
    document.getElementById('rejectReasonInput').value = '';
}

function confirmReject() {
    const reasonInput = document.getElementById('rejectReasonInput');
    const reason = reasonInput.value.trim();
    
    // 校验驳回原因（使用validation.js）
    const result = Validation.validate.textLength(reason, 500, true, '驳回原因');
    if (!result.valid) {
        showToast(result.message);
        reasonInput.focus();
        return;
    }
    
    showToast('已驳回，对方将收到通知');
    hideRejectDrawer();
    
    setTimeout(function() {
        history.back();
    }, 1500);
}