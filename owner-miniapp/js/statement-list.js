let currentTypeFilter = 'all';
let currentStatusFilter = 'all';
let currentContractFilter = 'all';
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
        
        document.querySelectorAll('#typeDropdownContent .dropdown-option').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    } else if (type === 'status') {
        currentStatusFilter = value;
        document.getElementById('statusDropdownValue').textContent = name;
        
        document.querySelectorAll('#statusDropdownContent .dropdown-option').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    } else if (type === 'contract') {
        currentContractFilter = value;
        document.getElementById('contractDropdownValue').textContent = name;
        
        document.querySelectorAll('#contractDropdownContent .dropdown-option').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }
    
    closeDropdown();
    filterStatements();
}

function filterStatements() {
    const cards = document.querySelectorAll('.statement-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
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
        emptyState.style.display = 'block';
        statementList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        statementList.style.display = 'block';
    }
}

function goToDetail(status, type, role) {
    let url = `statement-detail.html?status=${status}&type=${type}`;
    if (role) {
        url += `&role=${role}`;
    }
    window.location.href = url;
}

function showToast(message) {
    const toast = document.getElementById('toastModal');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}
