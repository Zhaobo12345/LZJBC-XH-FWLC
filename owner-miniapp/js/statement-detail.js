let statementData = {
    id: '1',
    type: 'material',
    typeName: '辅料费',
    amount: 4500.00,
    contract: '基础施工合同',
    description: '现场水电实际超出原合同预估米数，进行实际增项测量结算。',
    status: 'pending',
    creator: '张工长',
    creatorRole: 'foreman',
    createTime: '2026-05-20 10:30',
    confirmer: '我',
    confirmerRole: 'owner',
    confirmTime: '',
    rejectReason: '',
    payment_voucher: {
        attachment_urls: [],
        upload_time: '',
        uploader_name: ''
    }
};

const typeMap = {
    'worker_wage': '工友工资',
    'material': '辅料费',
    'measure': '措施费',
    'insurance': '保险费',
    'foreman_wage': '工长工资'
};

const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status') || 'pending';
const type = urlParams.get('type') || 'material';
const role = urlParams.get('role') || 'confirmer';
const todoId = urlParams.get('id') || '';

document.addEventListener('DOMContentLoaded', function() {
    initPageData();
    updatePageByStatus();
});

function initPageData() {
    statementData.status = status;
    statementData.type = type;
    statementData.typeName = typeMap[type] || '辅料费';
    
    document.getElementById('typeTag').textContent = statementData.typeName;
    document.getElementById('typeTag').className = 'type-tag ' + type;
    document.getElementById('amountDisplay').textContent = formatAmount(statementData.amount);
    document.getElementById('contractName').textContent = statementData.contract;
    document.getElementById('billType').textContent = statementData.typeName;
    document.getElementById('creatorName').textContent = statementData.creator;
    document.getElementById('createTime').textContent = statementData.createTime;
}

function formatAmount(amount) {
    const prefix = amount < 0 ? '-' : '';
    const absAmount = Math.abs(amount);
    return prefix + '¥ ' + absAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updatePageByStatus() {
    const statusBanner = document.getElementById('statusBanner');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusDesc = document.getElementById('statusDesc');
    const actionFooter = document.getElementById('actionFooter');
    const waitingHint = document.getElementById('waitingHint');
    const rejectReasonBanner = document.getElementById('rejectReasonBanner');
    const confirmInfoCard = document.getElementById('confirmInfoCard');
    const voucherCard = document.getElementById('voucherCard');
    
    switch (status) {
        case 'pending':
            statusBanner.className = 'status-banner';
            statusIcon.textContent = '⏳';
            statusText.textContent = '待确认';
            statusDesc.textContent = '请确认此对账单';
            
            if (role === 'confirmer') {
                actionFooter.classList.remove('hidden');
                actionFooter.style.display = 'flex';
            } else {
                actionFooter.classList.add('hidden');
                actionFooter.style.display = 'none';
            }
            waitingHint.style.display = 'none';
            break;
            
        case 'effective':
            statusBanner.className = 'status-banner effective';
            statusIcon.textContent = '✅';
            statusText.textContent = '已生效';
            statusDesc.textContent = '账单已确认生效';
            actionFooter.style.display = 'none';
            
            confirmInfoCard.style.display = 'block';
            document.getElementById('confirmerAvatar').textContent = '我';
            document.getElementById('confirmerName').textContent = '我（业主）';
            document.getElementById('confirmTime').textContent = '已于 2026-05-19 14:30 确认';
            
            addLogItem('我 确认了对账单', '2026-05-19 14:30');
            
            waitingHint.style.display = 'block';
            break;
            
        case 'paid':
            statusBanner.className = 'status-banner paid';
            statusIcon.textContent = '💳';
            statusText.textContent = '已支付';
            statusDesc.textContent = '账单已完成支付';
            actionFooter.style.display = 'none';
            waitingHint.style.display = 'none';
            
            confirmInfoCard.style.display = 'block';
            document.getElementById('confirmerAvatar').textContent = '我';
            document.getElementById('confirmerName').textContent = '我（业主）';
            document.getElementById('confirmTime').textContent = '已于 2026-05-19 14:30 确认';
            
            voucherCard.style.display = 'block';
            document.getElementById('uploaderAvatar').textContent = statementData.creator.charAt(0);
            document.getElementById('uploaderName').textContent = statementData.creator;
            document.getElementById('uploadTime').textContent = '2026-05-18 16:30';
            
            addLogItem('我 确认了对账单', '2026-05-19 14:30');
            addLogItem(statementData.creator + ' 上传了支付凭证', '2026-05-18 16:30');
            break;
            
        case 'rejected':
            statusBanner.className = 'status-banner rejected';
            statusIcon.textContent = '❌';
            statusText.textContent = '已驳回';
            statusDesc.textContent = '账单已被驳回';
            actionFooter.style.display = 'none';
            waitingHint.style.display = 'none';
            
            rejectReasonBanner.style.display = 'block';
            document.getElementById('rejectReasonContent').textContent = '数量算错了，现场测量只有20米，请核对后重新发起。';
            
            addLogItem('我 驳回了对账单', '2026-05-18 16:00');
            break;
    }
}

function addLogItem(text, time) {
    const logList = document.getElementById('logList');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.innerHTML = `
        <div class="log-dot"></div>
        <div class="log-content">
            <div class="log-text">${text}</div>
            <div class="log-time">${time}</div>
        </div>
    `;
    logList.appendChild(logItem);
}

function showConfirmModal() {
    document.getElementById('confirmModalOverlay').classList.add('show');
    document.getElementById('confirmModal').classList.add('show');
}

function hideConfirmModal() {
    document.getElementById('confirmModalOverlay').classList.remove('show');
    document.getElementById('confirmModal').classList.remove('show');
}

function submitConfirm() {
    hideConfirmModal();
    showToast('确认成功，账单已生效');
    removeOwnerTodo(todoId);
    
    setTimeout(() => {
        window.location.href = 'statement-list.html';
    }, 1500);
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

function submitReject() {
    const reasonInput = document.getElementById('rejectReasonInput');
    const reason = reasonInput.value.trim();
    
    // 校验驳回原因（使用validation.js）
    const result = Validation.validate.textLength(reason, 500, true, '驳回原因');
    if (!result.valid) {
        showToast(result.message);
        reasonInput.focus();
        return;
    }
    
    showToast('已驳回，工长将收到通知');
    hideRejectDrawer();
    removeOwnerTodo(todoId);
    
    setTimeout(() => {
        window.location.href = 'statement-list.html';
    }, 1500);
}

function confirmStatement() {
    showConfirmModal();
}

// 业主确认/驳回后，将对应的「对账单确认」待办从业主端待办列表移除
function removeOwnerTodo(id) {
    if (!id) return;
    try {
        const KEY = 'lzj_owner_todos';
        let list = [];
        try { list = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { list = []; }
        list = list.filter(function(t) { return String(t.id) !== String(id); });
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
}

function previewAttachment(name) {
    showToast('预览：' + name);
}

function previewImage(index) {
    showToast('预览凭证图片 ' + (index + 1));
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
